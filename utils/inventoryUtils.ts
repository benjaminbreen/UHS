/**
 * utils/inventoryUtils.ts - Utility functions for player inventory management.
 */
import { Item, ItemDefinition, EquipmentSlot, PlayerCharacter, AnimalEntity, CulturalZone, HistoricalEra, ItemCategory } from '../types';
import { ITEM_DEFINITIONS, STARTING_PACKAGES, ANIMAL_DATA } from '../constants/index';
import { getItemDefinition } from '../constants/gameData/itemDefinitions';
import { isItemAvailableInEra, isItemCulturallyAppropriate, getEraAppropriateSubstitute } from '../constants/gameData/historicalAvailability';
import { applyRegionalMaterial } from '../constants/gameData/regionalMaterials';
import { getEquipmentSlot, getMaterialFromName, getCategoryFromName, getEmojiFromName } from '../constants/gameData/itemClassifications';
import { calculateAmuletChance, getQualityFromPrivilege, getWealthFromPrivilege, getCulturalAccessoryChance } from '../constants/gameData/culturalClassifications';
import { getPetChanceMultiplier, canHaveEccentricPets, getBaseCatChance, ECCENTRIC_PETS } from '../constants/gameData/professionClassifications';
import { generateProceduralItemDescription } from '../services/itemDescriptionGenerator';
import { createTamedAnimal, addToParty } from '../services/animalTamingService';
import { generateItem, createColoredItemInstance, applyColorsToAllItems, generateContextualWeapon } from '../services/itemGenerationService';
import { generateContextualHeadgear, generateContextualStartingPackage } from '../services/headgearGenerationService';
import { generateContextualTorso, GENERIC_TORSO_ITEMS } from '../services/torsoGenerationService';
import { generateContextualAccessory, GENERIC_ACCESSORIES } from '../services/accessoryGenerationService';
import { getAccessoriesForCharacter, selectRandomAccessory } from '../constants/characterData/accessories';
import { generateCulturalAccessory, generateAccessorySet } from '../services/culturalAccessoryService';

// Use UUID for better performance and uniqueness instead of counter
import { v4 as uuidv4 } from 'uuid';

/**
 * Simplified procedural ItemDefinition generator using classification system
 * Replaces complex regex and hardcoded arrays with clean data-driven approach
 */
export function generateProceduralItemDefinition(baseId: string): ItemDefinition {
    const name = baseId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const lowerId = baseId.toLowerCase();

    // Handle special log items
    if (lowerId.endsWith('_log')) {
        const woodType = name.replace(' Log', '');
        return {
            baseId, name,
            description: `A rough log from a ${woodType} tree.`,
            emoji: '🪵',
            rarity: 'Common',
            value: 3,
            weight: 5.0,
            wearable: false,
            stackable: true,
            category: 'Material',
            attack: 2,
            sustenance: 0,
            wieldable: true,
            throwable: false,
            craftingValue: 3,
            equipmentSlot: 'main_hand',
            material: `${woodType} Wood`,
        };
    }

    // Use classification system for clean, maintainable logic
    const category = getCategoryFromName(name) as Item['category'];
    const material = getMaterialFromName(name);
    const equipmentSlot = getEquipmentSlot(name) as EquipmentSlot | undefined;
    const emoji = getEmojiFromName(name);

    // Set values based on category
    const categoryDefaults: Record<string, {
        value: number;
        weight: number;
        craftingValue: number;
        attack?: number;
        sustenance?: number;
        wieldable?: boolean;
        throwable?: boolean;
    }> = {
        'Food': { value: 5, weight: 0.5, craftingValue: 0, sustenance: 20 },
        'Material': { value: 3, weight: 1.0, craftingValue: 3 },
        'Tool': { value: 15, weight: 2.0, craftingValue: 3, attack: 2, wieldable: true },
        'Weapon': { value: 20, weight: 1.5, craftingValue: 2, attack: 4, wieldable: true, throwable: true },
        'Apparel': { value: 5, weight: 1.0, craftingValue: 2 },
        'Vessel': { value: 50, weight: 20.0, craftingValue: 0 },
        'Special': { value: 1, weight: 1.0, craftingValue: 1 }
    };

    const defaults = categoryDefaults[category] || categoryDefaults['Special'];

    const definition: ItemDefinition = {
        baseId,
        name,
        category,
        wearable: category === 'Apparel',
        equipmentSlot,
        material,
        defense: category === 'Apparel' ? 0 : undefined,
        description: category === 'Food' ? `Fresh ${name.toLowerCase()}.` :
                     category === 'Material' ? `Raw material: ${name}.` :
                     category === 'Apparel' ? `A piece of clothing: ${name}.` :
                     `${name}.`,
        emoji,
        rarity: 'Common',
        value: defaults.value,
        weight: defaults.weight,
        stackable: category !== 'Apparel' && category !== 'Tool' && category !== 'Weapon',
        attack: defaults.attack || 0,
        sustenance: defaults.sustenance || 0,
        wieldable: defaults.wieldable || false,
        throwable: defaults.throwable || false,
        craftingValue: defaults.craftingValue,
    };

    definition.description = generateProceduralItemDescription(definition as Item);
    return definition;
}


/**
 * Creates a unique instance of an item from its base definition.
 * @param baseId The base ID of the item to create (e.g., 'STICK', 'FISH_MEAT').
 * @returns An Item object with a unique instance ID, or null if the definition doesn't exist.
 */
// Color extraction moved to constant for better performance
const COLOR_PREFIXES = new Set([
    'NAVY', 'BLUE', 'ROYAL', 'RED', 'CRIMSON', 'GREEN', 'FOREST', 'YELLOW', 'GOLD',
    'PURPLE', 'ORANGE', 'BROWN', 'BLACK', 'WHITE', 'SILVER', 'GRAY', 'GREY',
    'TEAL', 'TURQUOISE', 'CORAL', 'TAN', 'IVORY', 'AMBER', 'BRONZE', 'COPPER',
    'DARK_BROWN', 'CHOCOLATE', 'INDIGO', 'WHEAT'
]);

const MATERIAL_COLORS = new Set([
    'leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 'copper',
    'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'
]);

export function createItemInstance(
    baseId: string,
    era?: HistoricalEra,
    culture?: CulturalZone
): Item | null {
    let colorPrefix = '';
    let cleanBaseId = baseId;

    // Extract color prefix more efficiently
    for (const color of COLOR_PREFIXES) {
        if (baseId.startsWith(color + '_')) {
            colorPrefix = color.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            cleanBaseId = baseId.substring(color.length + 1);
            break;
        }
    }

    // Check historical availability if era provided
    if (era && !isItemAvailableInEra(cleanBaseId, era)) {
        // Try to find an appropriate substitute
        cleanBaseId = getEraAppropriateSubstitute(cleanBaseId, 'GENERAL', era);
    }

    // Check cultural appropriateness if culture provided
    if (culture && !isItemCulturallyAppropriate(cleanBaseId, culture)) {
        // Item not culturally appropriate, return null or substitute
        return null;
    }

    let definition = getItemDefinition(cleanBaseId) || getItemDefinition(baseId);
    if (!definition) {
        definition = generateProceduralItemDefinition(cleanBaseId);
    }

    // Create the item instance with UUID
    let item: Item = {
        ...definition,
        id: uuidv4(),
        quantity: 1,
        condition: 100,  // Start at perfect condition
        age: 0  // New item
    };

    // Apply regional material variations if culture provided
    if (culture) {
        item = applyRegionalMaterial(item, culture);
    }

    // Add color to name only for appropriate items
    if (colorPrefix) {
        const material = (item.material || '').toLowerCase();
        if (!MATERIAL_COLORS.has(material)) {
            item.name = `${colorPrefix} ${item.name}`;
        }
    }

    return item;
}

/**
 * Stacking rules for realistic inventory management
 */
interface StackingRules {
    material?: boolean;      // Stack only if same material
    quality?: boolean;       // Stack only if same quality
    condition?: number;      // Stack only if condition within range (e.g., ±10%)
    age?: number;           // Stack only if age similar (for perishables)
    culture?: boolean;      // Stack only if same cultural variant
}

const ITEM_STACKING_RULES: Record<string, StackingRules> = {
    'Food': { condition: 20, age: 2 },  // Food must be similar freshness
    'Material': { material: true, quality: true },  // Materials need same type/quality
    'Weapon': {},  // Weapons don't stack
    'Apparel': {},  // Clothing doesn't stack
    'Tool': { condition: 30 },  // Tools stack if similar wear
    'Document': {},  // Documents don't stack
    'Special': {},  // Special items don't stack
    'Consumable': { condition: 10 },  // Consumables stack if similar condition
    'Vessel': {},  // Vessels don't stack
    'Container': {}  // Containers don't stack
};

/**
 * Check if two items can stack based on realistic rules
 */
function canItemsStack(item1: Item, item2: Item): boolean {
    // Basic checks
    if (!item1.stackable || !item2.stackable) return false;
    if (item1.baseId !== item2.baseId) return false;

    // Get stacking rules for this category
    const rules = ITEM_STACKING_RULES[item1.category];
    if (!rules) return false;

    // Check material match
    if (rules.material && item1.material !== item2.material) return false;

    // Check quality match
    if (rules.quality && item1.quality !== item2.quality) return false;

    // Check condition similarity
    if (rules.condition) {
        const condition1 = item1.condition || 100;
        const condition2 = item2.condition || 100;
        if (Math.abs(condition1 - condition2) > rules.condition) return false;
    }

    // Check age similarity (for perishables)
    if (rules.age && item1.age !== undefined && item2.age !== undefined) {
        if (Math.abs(item1.age - item2.age) > rules.age) return false;
    }

    // Check cultural variant
    if (rules.culture && item1.culturalVariant !== item2.culturalVariant) return false;

    return true;
}

/**
 * Adds an item to an inventory array, handling realistic stacking.
 * @param inventory The current inventory array.
 * @param itemToAdd The item instance to add.
 * @returns A new inventory array with the item added or stacked.
 */
export function addItemToInventory(inventory: Item[], itemToAdd: Item): Item[] {
    const newInventory = [...inventory];

    if (itemToAdd.stackable) {
        // Find compatible stack using realistic rules
        const existingItemIndex = newInventory.findIndex(i => canItemsStack(i, itemToAdd));
        if (existingItemIndex > -1) {
            newInventory[existingItemIndex] = {
                ...newInventory[existingItemIndex],
                quantity: newInventory[existingItemIndex].quantity + itemToAdd.quantity,
            };
            return newInventory;
        }
    }

    // If not stackable or no compatible stack found, add as new item
    newInventory.push(itemToAdd);
    return newInventory;
}

/**
 * Removes items from inventory by name and quantity, handling stacked items properly.
 * This is the complement to addItemToInventory() and follows the same quantity logic.
 *
 * @param inventory The current inventory array
 * @param itemName The name of the item to remove (case-insensitive)
 * @param quantityToRemove The quantity to remove (default: 1)
 * @returns Object with new inventory array and array of removed item IDs
 *
 * @example
 * // Remove 5 apples from inventory
 * const result = removeItemFromInventory(inventory, "Apple", 5);
 * // Returns: { inventory: [...], removedIds: ["id1", "id2"] }
 */
export function removeItemFromInventory(
    inventory: Item[],
    itemName: string,
    quantityToRemove: number = 1
): { inventory: Item[], removedIds: string[] } {
    const newInventory = [...inventory];
    const removedIds: string[] = [];
    let remainingToRemove = quantityToRemove;

    // Find and remove items in order
    for (let i = newInventory.length - 1; i >= 0 && remainingToRemove > 0; i--) {
        const item = newInventory[i];

        // Case-insensitive name match
        if (item.name.toLowerCase() === itemName.toLowerCase()) {
            const itemQuantity = item.quantity || 1;

            if (itemQuantity <= remainingToRemove) {
                // Remove entire stack
                removedIds.push(item.id);
                newInventory.splice(i, 1);
                remainingToRemove -= itemQuantity;
            } else {
                // Partial removal - decrement quantity
                newInventory[i] = {
                    ...item,
                    quantity: itemQuantity - remainingToRemove
                };
                remainingToRemove = 0;
                // Note: We don't add to removedIds because item still exists
            }
        }
    }

    return {
        inventory: newInventory,
        removedIds
    };
}

/**
 * Assembles a starting package of items for a character based on their profession.
 * @param profession The character's profession key.
 * @returns An object containing inventory and equipped items.
 */
/**
 * Creates a tamed animal for starting companions
 */
function createStartingCompanion(animalBaseId: string, playerCharacter: PlayerCharacter): void {
    console.log(`[StartingCompanion] Adding ${animalBaseId} to ${playerCharacter.name} (${playerCharacter.profession})`);
    const animalData = ANIMAL_DATA[animalBaseId];
    if (!animalData) {
        console.warn(`Starting companion animal not found: ${animalBaseId}`);
        return;
    }
    
    // Create a basic animal entity
    const animal: AnimalEntity = {
        id: `companion-${Date.now()}-${Math.random()}`,
        baseId: animalBaseId,
        speciesName: animalData.name,
        emoji: animalData.emoji,
        type: animalData.type,
        x: 0, // Will be positioned with player
        y: 0,
        z: 0,
        health: animalData.maxHealth,
        behavior: 'peaceful',
        isAlive: true,
        lastSpawned: Date.now(),
        diseaseHealth: { currentDiseases: [], immunities: [] },
        level: animalData.level || 1,
        experience: 0
    };
    
    // Convert to tamed animal and add to party
    const gameDate = { 
        year: playerCharacter.year || 1500, 
        month: 1, 
        day: 1 
    };
    const tamedAnimal = createTamedAnimal(animal, playerCharacter, gameDate);
    tamedAnimal.loyalty = 100; // Starting companions are fully loyal
    
    addToParty(tamedAnimal);
}

// Note: calculateAmuletChance is now imported from culturalClassifications.ts

/**
 * Add a quality adjective to necklace/jewelry names based on privilege level
 */
function addQualityAdjective(itemName: string, privilege: number): string {
    // COMPREHENSIVE check for ALL quality adjectives that might already be in the name
    const allQualityWords = [
        // Poor quality
        'Battered', 'Worn', 'Simple', 'Crude', 'Plain', 'Humble', 'Weathered',
        'Impure', 'Raw', 'Low-grade', 'Inferior', 'Rough', 'Damaged', 'Broken',
        'Shoddy', 'Makeshift', 'Improvised',
        // Standard quality
        'Common', 'Regular', 'Basic', 'Standard', 'Ordinary',
        // Good quality
        'Fine', 'Well-made', 'Sturdy', 'Quality', 'Superior', 'Solid', 'Refined',
        'Pure', 'High-grade', 'Select', 'Polished', 'Elegant', 'Beautiful',
        'Fresh', 'Choice', 'Decent', 'Reliable', 'Functional',
        // Excellent quality
        'Masterwork', 'Exceptional', 'Exquisite', 'Legendary', 'Pristine',
        'Perfect', 'Flawless', 'Premium', 'Ornate', 'Magnificent', 'Divine',
        'Sacred', 'Blessed', 'Ancient'
    ];

    // Check if ANY quality word is already in the name
    const itemNameLower = itemName.toLowerCase();
    for (const qualityWord of allQualityWords) {
        if (itemNameLower.includes(qualityWord.toLowerCase())) {
            return itemName; // Already has a quality adjective, don't add another
        }
    }

    const qualityAdjectives = {
        poor: ['Battered', 'Worn', 'Simple', 'Crude', 'Plain', 'Humble', 'Weathered'],
        common: ['Well-made', 'Sturdy', 'Decent', 'Solid', 'Reliable', 'Functional'],
        wealthy: ['Fine', 'Polished', 'Elegant', 'Beautiful', 'Ornate', 'Exquisite', 'Masterful'],
        legendary: ['Legendary', 'Ancient', 'Sacred', 'Blessed', 'Magnificent', 'Divine']
    };

    let adjectives: string[];
    if (privilege < 0.2) {
        adjectives = qualityAdjectives.poor;
    } else if (privilege < 0.6) {
        adjectives = qualityAdjectives.common;
    } else if (privilege < 0.9) {
        adjectives = qualityAdjectives.wealthy;
    } else {
        adjectives = qualityAdjectives.legendary;
    }

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${randomAdjective} ${itemName}`;
}

/**
 * Weight and encumbrance calculation for realistic inventory management
 */
export function calculateEncumbrance(
    inventory: Item[],
    strength: number = 10
): {
    totalWeight: number;
    maxCapacity: number;
    encumbrance: number;
    movementPenalty: number;
    categories: Record<string, number>;
} {
    // Calculate total weight and weight by category
    let totalWeight = 0;
    const categories: Record<string, number> = {};

    for (const item of inventory) {
        const itemWeight = (item.weight || 0) * (item.quantity || 1);
        totalWeight += itemWeight;

        const category = item.category || 'Other';
        categories[category] = (categories[category] || 0) + itemWeight;
    }

    // Calculate max capacity based on strength (15 lbs per strength point)
    const maxCapacity = strength * 15;
    const encumbrance = totalWeight / maxCapacity;

    // Movement penalty starts at 50% capacity, increases exponentially
    let movementPenalty = 0;
    if (encumbrance > 0.5) {
        movementPenalty = Math.min(0.75, Math.pow(encumbrance - 0.5, 2));
    }

    return {
        totalWeight,
        maxCapacity,
        encumbrance,
        movementPenalty,
        categories
    };
}

/**
 * Item degradation calculation based on usage and environment
 */
export function degradeItem(
    item: Item,
    usageIntensity: number = 1.0,  // 0.5 = light use, 1.0 = normal, 2.0 = heavy
    environmentHarshness: number = 1.0  // 0.5 = protected, 1.0 = normal, 2.0 = harsh
): Item {
    if (!item.condition) item.condition = 100;

    // Different categories degrade at different rates
    const degradationRates: Record<string, number> = {
        'Weapon': 0.5,
        'Tool': 0.3,
        'Apparel': 0.2,
        'Food': 2.0,  // Food degrades quickly
        'Material': 0.1,
        'Document': 0.4,  // Paper degrades moderately
        'Special': 0.05,
        'Consumable': 1.0,
        'Vessel': 0.15,
        'Container': 0.2
    };

    const baseRate = degradationRates[item.category] || 0.2;
    const degradation = baseRate * usageIntensity * environmentHarshness;

    // Apply degradation
    const newCondition = Math.max(0, item.condition - degradation);

    // Item breaks if condition reaches 0
    if (newCondition <= 0) {
        return {
            ...item,
            condition: 0,
            name: `Broken ${item.name}`,
            value: Math.floor(item.value * 0.1),  // 10% value when broken
            attack: item.attack ? Math.floor(item.attack * 0.25) : undefined,
            defense: item.defense ? Math.floor(item.defense * 0.25) : undefined
        };
    }

    return {
        ...item,
        condition: newCondition
    };
}

/**
 * Simplified pet assignment using profession classification system
 */
function addRandomPets(playerCharacter: PlayerCharacter): void {
    const currentYear = playerCharacter.year || 1500;
    const profession = playerCharacter.profession || '';
    const culturalZone = playerCharacter.culturalZone;

    // Old World domesticated animals that should NOT appear in Pre-Columbian Americas
    const OLD_WORLD_ANIMALS = ['SHEEP', 'COW', 'HORSE', 'GOAT'];
    const PRE_COLUMBIAN_ZONES = ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'];
    const isPreColumbian = culturalZone && PRE_COLUMBIAN_ZONES.includes(culturalZone);

    // Use classification system instead of hardcoded arrays
    const petChanceMultiplier = getPetChanceMultiplier(profession);

    // Random pet dog (base 10% chance, modified by profession)
    const dogChance = 0.10 * petChanceMultiplier;
    if (Math.random() < dogChance) {
        createStartingCompanion('DOG', playerCharacter);
    }

    // Random pet cat (era-appropriate base chance, modified by profession)
    const baseCatChance = getBaseCatChance(currentYear);
    const catChance = baseCatChance * petChanceMultiplier;
    if (Math.random() < catChance) {
        createStartingCompanion('CAT', playerCharacter);
    }

    // Eccentric pets for unusual professions
    if (canHaveEccentricPets(profession) && Math.random() < 0.05) {
        const randomPet = ECCENTRIC_PETS[Math.floor(Math.random() * ECCENTRIC_PETS.length)];

        // Skip Old World animals for Pre-Columbian characters
        if (isPreColumbian && OLD_WORLD_ANIMALS.includes(randomPet)) {
            console.log(`[RandomPets] Skipping ${randomPet} for ${culturalZone} character (Old World animal)`);
            return; // Don't add this pet
        }

        createStartingCompanion(randomPet, playerCharacter);
    }
}

export function assembleStartingPackage(
    profession: string, 
    playerCharacter?: PlayerCharacter,
    colorOptions?: {
        culture?: CulturalZone;
        era?: HistoricalEra;
        privilege?: number;
    }
): { inventory: Item[], equippedItems: PlayerCharacter['equippedItems'] } {
    // Try to get the defined package, or generate a contextual one
    let pkg = STARTING_PACKAGES[profession];
    
    // If profession not found, generate contextual package instead of always using Wanderer
    if (!pkg) {
        pkg = generateContextualStartingPackage(profession, {
            era: colorOptions?.era,
            culture: colorOptions?.culture,
            privilege: colorOptions?.privilege
        });
    }
    
    if (!pkg) return { inventory: [], equippedItems: {} };
    
    // Clear any existing tamed animals when creating a new character
    if (playerCharacter) {
        console.log(`[StartingPackage] Clearing existing tamed animals for new character: ${playerCharacter.name}`);
        localStorage.removeItem('tamedAnimals');
    }

    // Create inventory items with unified generation system
    const inventory: Item[] = pkg.inventory
        .map(baseId => generateItem(baseId, {
            culture: colorOptions?.culture,
            era: colorOptions?.era,
            privilege: colorOptions?.privilege
        }))
        .filter(item => item !== null) as Item[];
    
    // Create equipped items
    const equippedItems: PlayerCharacter['equippedItems'] = {};

    // Add all defined equipment from the package
    for (const slot in pkg.equipment) {
        const baseId = pkg.equipment[slot as keyof typeof pkg.equipment];
        if (baseId) {
            let item: Item | null;

            // Handle procedural weapon generation
            if (baseId === '*CONTEXTUAL*' && colorOptions) {
                item = generateContextualWeapon(profession, {
                    culture: colorOptions.culture,
                    era: colorOptions.era,
                    socialClass: colorOptions.privilege && colorOptions.privilege > 0.7 ? 'noble' :
                                colorOptions.privilege && colorOptions.privilege > 0.4 ? 'common' : 'common',
                    privilege: colorOptions.privilege
                });
            }
            else {
                item = generateItem(baseId, {
                    culture: colorOptions?.culture,
                    era: colorOptions?.era,
                    privilege: colorOptions?.privilege
                });
            }
            if(item) equippedItems[slot as keyof typeof equippedItems] = item;
        }
    }

    // ONLY add contextual items if they're COMPLETELY MISSING
    // Don't replace items that are already defined

    // Simplified accessory generation using new classification systems
    if (!equippedItems.necklace && colorOptions) {
        const necklaceChance = calculateAmuletChance(colorOptions.era, colorOptions.culture, profession);

        if (Math.random() < necklaceChance) {
            const necklaceId = generateContextualAccessory(profession, {
                era: colorOptions.era,
                culture: colorOptions.culture,
                privilege: colorOptions.privilege,
                slot: 'necklace'
            });

            if (necklaceId) {
                const necklaceItem = generateItem(necklaceId, {
                    culture: colorOptions.culture,
                    era: colorOptions.era,
                    privilege: colorOptions.privilege
                });
                if (necklaceItem) {
                    necklaceItem.quality = getQualityFromPrivilege(colorOptions.privilege || 0.5);
                    necklaceItem.name = addQualityAdjective(necklaceItem.name, colorOptions.privilege || 0.5);
                    equippedItems.necklace = necklaceItem;
                }
            }
        }
    }

    // Add ring for wealthy characters
    if (!equippedItems.ring1 && colorOptions) {
        const ringChance = 0.3 + (colorOptions.privilege || 0.5) * 0.4;

        if (Math.random() < ringChance) {
            const ringId = generateContextualAccessory(profession, {
                era: colorOptions.era,
                culture: colorOptions.culture,
                privilege: colorOptions.privilege,
                slot: 'ring'
            });

            if (ringId) {
                const ringItem = generateItem(ringId, {
                    culture: colorOptions.culture,
                    era: colorOptions.era,
                    privilege: colorOptions.privilege
                });
                if (ringItem) {
                    ringItem.quality = getQualityFromPrivilege(colorOptions.privilege || 0.5);
                    ringItem.name = addQualityAdjective(ringItem.name, colorOptions.privilege || 0.5);
                    equippedItems.ring1 = ringItem;
                }
            }
        }
    }

    // Add cultural accessory using simplified cultural system
    if (!equippedItems.accessory && colorOptions && playerCharacter) {
        const culturalChance = getCulturalAccessoryChance(colorOptions.culture);
        const accessoryChance = Math.min(1.0, culturalChance + (colorOptions.privilege || 0.5) * 0.1);

        if (Math.random() < accessoryChance) {
            const wealthLevel = getWealthFromPrivilege(colorOptions.privilege || 0.5);

            const accessoryItem = generateCulturalAccessory({
                culture: colorOptions.culture || 'EUROPEAN',
                era: colorOptions.era,
                wealth: wealthLevel,
                gender: playerCharacter.gender || 'male',
                profession: profession
            });

            if (accessoryItem) {
                equippedItems.accessory = accessoryItem;

                // Wealthy characters may get extra accessories
                if ((wealthLevel === 'wealthy' || wealthLevel === 'comfortable') && Math.random() < 0.4) {
                    const extraAccessories = generateAccessorySet({
                        culture: colorOptions.culture || 'EUROPEAN',
                        era: colorOptions.era,
                        wealth: wealthLevel,
                        gender: playerCharacter.gender || 'male',
                        profession: profession
                    }, wealthLevel === 'wealthy' ? 2 : 1);

                    extraAccessories.forEach(extra => {
                        if (extra && extra.baseId !== accessoryItem.baseId) {
                            inventory.push(extra);
                        }
                    });
                }
            }
        }
    }
    
    // Handle starting companion animals
    if (playerCharacter && pkg.companions) {
        // Old World domesticated animals that should NOT appear in Pre-Columbian Americas
        const OLD_WORLD_ANIMALS = ['SHEEP', 'COW', 'HORSE', 'GOAT'];
        const PRE_COLUMBIAN_ZONES = ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'];

        // Get cultural zone from either character property or color options
        const culturalZone = playerCharacter.culturalZone || colorOptions?.culture;

        pkg.companions.forEach(animalBaseId => {
            // Skip Old World animals for Pre-Columbian American characters
            if (culturalZone &&
                PRE_COLUMBIAN_ZONES.includes(culturalZone) &&
                OLD_WORLD_ANIMALS.includes(animalBaseId)) {
                console.log(`[StartingPackage] Skipping ${animalBaseId} for ${culturalZone} character (Old World animal)`);
                return; // Skip this companion
            }

            createStartingCompanion(animalBaseId, playerCharacter);
        });
    }
    
    // Add random pets
    if (playerCharacter) {
        addRandomPets(playerCharacter);
    }
    
    return { inventory, equippedItems };
}

/**
 * Generate contextual armor based on era and culture
 * NOTE: This is now primarily used by generateContextualStartingPackage
 * for professions not in the main STARTING_PACKAGES list
 */
export function generateContextualArmor(
    era?: HistoricalEra,
    culture?: CulturalZone,
    privilege?: number
): string | null {
    // Default to leather vest for unknown contexts
    if (!era || !culture) return 'LEATHER_VEST';

    const isWealthy = privilege && privilege > 0.7;
    const isPoor = privilege && privilege < 0.3;

    // Ancient/Classical era armor
    if (era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY) {
        if (culture === 'EUROPEAN' || culture === 'MENA') {
            return isWealthy ? 'BRONZE_ARMOR' : isPoor ? 'HIDE_ARMOR' : 'SCALE_ARMOR';
        }
        if (culture === 'EAST_ASIAN' || culture === 'SOUTH_ASIAN') {
            return isWealthy ? 'LACQUERED_ARMOR' : 'PADDED_ARMOR';
        }
        // Tribal/Indigenous cultures
        return 'HIDE_ARMOR';
    }

    // Medieval era armor
    if (era === HistoricalEra.MEDIEVAL) {
        if (culture === 'EUROPEAN') {
            return isWealthy ? 'MAIL_SHIRT' : isPoor ? 'PADDED_ARMOR' : 'STUDDED_LEATHER';
        }
        if (culture === 'EAST_ASIAN') {
            return isWealthy ? 'LACQUERED_ARMOR' : 'LAMELLAR_ARMOR';
        }
        if (culture === 'MENA') {
            return isWealthy ? 'MAIL_SHIRT' : 'SCALE_ARMOR';
        }
        return 'PADDED_ARMOR';
    }

    // Renaissance/Early Modern
    if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        if (culture === 'EUROPEAN' || culture === 'NORTH_AMERICAN_COLONIAL') {
            return isWealthy ? 'PLATE_ARMOR' : 'MAIL_SHIRT';
        }
        if (culture === 'EAST_ASIAN') {
            return isWealthy ? 'LACQUERED_ARMOR' : 'LAMELLAR_ARMOR';
        }
        return 'STUDDED_LEATHER';
    }

    // Industrial era and beyond - lighter armor
    if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) {
        return isPoor ? 'LEATHER_VEST' : 'STUDDED_LEATHER';
    }

    return 'LEATHER_VEST';
}

/**
 * Generate contextual military cloak based on era and culture
 * NOTE: This is now primarily used by generateContextualStartingPackage
 * for professions not in the main STARTING_PACKAGES list
 */
export function generateContextualMilitaryCloak(
    era?: HistoricalEra,
    culture?: CulturalZone,
    privilege?: number
): string | null {
    // Default to basic military cloak
    if (!era || !culture) return 'MILITARY_CLOAK';

    const isOfficer = privilege && privilege > 0.7;

    // Culture-specific cloaks
    if (culture === 'EUROPEAN' || culture === 'NORTH_AMERICAN_COLONIAL') {
        if (era === HistoricalEra.ANTIQUITY) {
            return 'ROMAN_CLOAK'; // Works for any classical European
        }
        if (era === HistoricalEra.MEDIEVAL) {
            return isOfficer ? 'KNIGHT_SURCOAT' : 'MILITARY_CLOAK';
        }
        return isOfficer ? 'OFFICER_CAPE' : 'CAMPAIGN_CLOAK';
    }

    if (culture === 'EAST_ASIAN') {
        if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
            return 'SAMURAI_SURCOAT';
        }
        return 'MILITARY_CLOAK';
    }

    if (culture === 'MENA' || culture === 'SUB_SAHARAN_AFRICAN') {
        return 'DESERT_MILITARY_CLOAK';
    }

    // Northern/cold cultures
    if (culture === 'OCEANIA' ||
        (culture === 'NORTH_AMERICAN_PRE_COLUMBIAN' && era === HistoricalEra.PREHISTORY)) {
        return 'FUR_MILITARY_CLOAK';
    }

    // Default fallback based on officer status
    return isOfficer ? 'OFFICER_CAPE' : 'MILITARY_CLOAK';
}