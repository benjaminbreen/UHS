/**
 * utils/inventoryUtils.ts - Utility functions for player inventory management.
 */
import { Item, ItemDefinition, EquipmentSlot, PlayerCharacter, AnimalEntity, CulturalZone, HistoricalEra } from '../types';
import { ITEM_DEFINITIONS, STARTING_PACKAGES, ANIMAL_DATA } from '../constants/index';
import { generateProceduralItemDescription } from '../services/itemDescriptionGenerator';
import { createTamedAnimal, addToParty } from '../services/animalTamingService';
import { createColoredItemInstance, applyColorsToAllItems, generateContextualWeapon } from '../services/itemGenerationService';
import { generateContextualHeadgear, generateContextualStartingPackage } from '../services/headgearGenerationService';
import { generateContextualTorso, GENERIC_TORSO_ITEMS } from '../services/torsoGenerationService';
import { generateContextualAccessory, GENERIC_ACCESSORIES } from '../services/accessoryGenerationService';
import { getAccessoriesForCharacter, selectRandomAccessory } from '../constants/characterData/accessories';
import { generateCulturalAccessory, generateAccessorySet } from '../services/culturalAccessoryService';

let itemIdCounter = 1000; // Start high to avoid collision with other potential item sources

/**
 * NEW: Generates a temporary, procedural ItemDefinition for items not in the main database.
 * This is a critical failsafe for dynamically generated clothing and resources.
 */
export function generateProceduralItemDefinition(baseId: string): ItemDefinition {
    const name = baseId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const lowerId = baseId.toLowerCase();

    // Handle Logs
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
            attack: 2, // Can be used as a club
            sustenance: 0,
            wieldable: true,
            throwable: false,
            craftingValue: 3,
            equipmentSlot: 'main_hand',
            material: `${woodType} Wood`,
        };
    }

    // Determine category and material first
    let category: Item['category'] = 'Material'; // Default to material
    let equipmentSlot: EquipmentSlot | undefined = undefined;
    let material = 'Unknown';
    let emoji = '📦';
    let craftingValue = 1;
    let value = 2;

    // Handle meat products first
    if (lowerId.includes('meat') || lowerId.includes('mutton') || lowerId.includes('beef') || lowerId.includes('pork') || lowerId.includes('venison') || lowerId.includes('chicken')) {
        category = 'Food';
        material = 'Organic';
        emoji = '🥩';
        craftingValue = 0;
        value = 5;
    }
    // Handle animal products
    else if (lowerId.includes('hide') && !lowerId.includes('shirt') && !lowerId.includes('tunic')) {
        category = 'Material';
        material = 'Hide';
        emoji = '🦴';
        craftingValue = 4;
        value = 8;
    }
    else if (lowerId.includes('pelt') && !lowerId.includes('shirt') && !lowerId.includes('tunic')) {
        category = 'Material';
        material = 'Fur';
        emoji = '🦫';
        craftingValue = 5;
        value = 12;
    }
    else if (lowerId.includes('wool') && !lowerId.includes('shirt') && !lowerId.includes('tunic')) {
        category = 'Material';
        material = 'Wool';
        emoji = '🧶';
        craftingValue = 3;
        value = 6;
    }
    // Handle other materials
    else if (lowerId.includes('bone')) {
        category = 'Material';
        material = 'Bone';
        emoji = '🦴';
        craftingValue = 2;
        value = 3;
    }
    else if (lowerId.includes('stone')) {
        category = 'Material';
        material = 'Stone';
        emoji = '🪨';
        craftingValue = 2;
        value = 1;
    }
    else if (lowerId.includes('iron') || lowerId.includes('metal')) {
        category = 'Material';
        material = 'Iron';
        emoji = '⚙️';
        craftingValue = 6;
        value = 15;
    }
    // Handle vessels and boats
    else if (lowerId.includes('kayak') || lowerId.includes('canoe') || lowerId.includes('boat') || lowerId.includes('raft') || lowerId.includes('vessel') || lowerId.includes('sailboat') || lowerId.includes('rowboat') || lowerId.includes('log_raft')) {
        category = 'Vessel';
        material = 'Wood';
        emoji = lowerId.includes('kayak') ? '🛶' : 
               lowerId.includes('sailboat') ? '⛵' : 
               lowerId.includes('raft') ? '🪵' : 
               lowerId.includes('rowboat') ? '🚣' : '🚤';
        craftingValue = 0;
        value = 50;
        equipmentSlot = undefined; // Vessels are not wearable
    }
    // Handle tools
    else if (lowerId.includes('axe') || lowerId.includes('hammer') || lowerId.includes('chisel') || lowerId.includes('saw') || lowerId.includes('drill') || lowerId.includes('shovel') || lowerId.includes('pickaxe') || lowerId.includes('hoe') || lowerId.includes('rake')) {
        category = 'Tool';
        material = lowerId.includes('stone') ? 'Stone' : lowerId.includes('iron') || lowerId.includes('metal') ? 'Iron' : 'Wood';
        emoji = lowerId.includes('axe') ? '🪓' :
               lowerId.includes('hammer') ? '🔨' :
               lowerId.includes('shovel') ? '🪝' :
               lowerId.includes('pickaxe') ? '⛏️' : '🔧';
        craftingValue = 3;
        value = 15;
        equipmentSlot = 'main_hand';
    }
    // Handle weapons
    else if (lowerId.includes('sword') || lowerId.includes('spear') || lowerId.includes('club') || lowerId.includes('knife') || lowerId.includes('bow') || lowerId.includes('arrow') || lowerId.includes('dagger') || lowerId.includes('mace')) {
        category = 'Weapon';
        material = lowerId.includes('stone') ? 'Stone' : lowerId.includes('iron') || lowerId.includes('metal') ? 'Iron' : 'Wood';
        emoji = lowerId.includes('sword') ? '⚔️' :
               lowerId.includes('spear') ? '🔱' :
               lowerId.includes('bow') ? '🏹' :
               lowerId.includes('knife') || lowerId.includes('dagger') ? '🔪' : '🏏';
        craftingValue = 2;
        value = 20;
        equipmentSlot = lowerId.includes('arrow') ? 'off_hand' : 'main_hand';
    }
    // Handle clothing items
    else if (name.match(/\b(hide|pelt|jerkin|robe|tunic|cloak|plate|chain|wrap|shirt|dress|apron|doublet|kirtle|bodice|surcoat|houppelande|stola|peplos|palla|chiton|hanfu|agbada|dashiki|boubou|kaftan|sherwani|kurta|blouse|qipao|suit|jacket|vest|mantle|shawl|kimono|cap|helmet|hood|turban|hat|wimple|coif|diadem|crown|headdress|veil|circlet|boots|shoes|sandals|clogs|slippers|moccasins|hose|trousers|breeches|pants|skirt|leggings|belt|cord|sash|girdle|comb|necklace|pendant|amulet|chain|hairpin|ornament|brooch|pin|ring)\b/i)) {
        category = 'Apparel';
        material = 'Cloth';
        emoji = '👕';
        craftingValue = 2;
        value = 5;

        const torsoWords = ['hide', 'pelt', 'jerkin', 'robe', 'tunic', 'cloak', 'plate', 'chain', 'wrap', 'shirt', 'dress', 'apron', 'doublet', 'kirtle', 'bodice', 'surcoat', 'houppelande', 'stola', 'peplos', 'palla', 'chiton', 'hanfu', 'agbada', 'dashiki', 'boubou', 'kaftan', 'sherwani', 'kurta', 'blouse', 'qipao', 'suit', 'jacket', 'vest', 'mantle', 'shawl', 'kimono', 'jerkin', 'surcoat'];
        const headWords = ['cap', 'helmet', 'hood', 'turban', 'hat', 'wimple', 'coif', 'diadem', 'crown', 'headdress', 'veil', 'circlet'];
        const feetWords = ['boots', 'shoes', 'sandals', 'clogs', 'slippers', 'moccasins'];
        const legsWords = ['hose', 'trousers', 'breeches', 'pants', 'skirt', 'leggings'];
        const beltWords = ['belt', 'cord', 'sash', 'girdle'];
        const amuletWords = ['comb', 'necklace', 'pendant', 'amulet', 'chain', 'hairpin', 'ornament', 'brooch', 'pin'];
        const ringWords = ['ring'];

        if (torsoWords.some(word => lowerId.includes(word))) equipmentSlot = 'torso';
        else if (headWords.some(word => lowerId.includes(word))) equipmentSlot = 'head';
        else if (feetWords.some(word => lowerId.includes(word))) equipmentSlot = 'feet';
        else if (legsWords.some(word => lowerId.includes(word))) equipmentSlot = 'legs';
        else if (beltWords.some(word => lowerId.includes(word))) equipmentSlot = 'belt';
        else if (amuletWords.some(word => lowerId.includes(word))) equipmentSlot = 'amulet';
        else if (ringWords.some(word => lowerId.includes(word))) equipmentSlot = 'ring1';
        
        // Override material for clothing based on keywords
        if (lowerId.includes('leather') || lowerId.includes('hide') || lowerId.includes('pelt')) material = 'Leather';
        if (lowerId.includes('wool')) material = 'Wool';
        if (lowerId.includes('silk')) material = 'Silk';
    }
    // Default fallback for unrecognized items
    else {
        category = 'Special'; // Changed from 'Apparel' to 'Special'
        material = 'Unknown';
        emoji = '❓';
        craftingValue = 1;
        value = 1;
        equipmentSlot = undefined;
    }

    const definition: ItemDefinition = {
        baseId, name, category, 
        wearable: category === 'Apparel', 
        equipmentSlot, 
        material, 
        defense: category === 'Apparel' ? 0 : undefined,
        description: category === 'Food' ? `Fresh ${name.toLowerCase()}.` :
                     category === 'Material' ? `Raw material: ${name}.` :
                     `A piece of clothing: ${name}.`,
        emoji,
        rarity: 'Common',
        value,
        weight: category === 'Food' ? 0.5 : 1,
        stackable: category !== 'Apparel',
        attack: 0,
        sustenance: category === 'Food' ? 20 : 0,
        wieldable: false,
        throwable: false,
        craftingValue,
    };
    
    definition.description = generateProceduralItemDescription(definition as Item);
    return definition;
}


/**
 * Creates a unique instance of an item from its base definition.
 * @param baseId The base ID of the item to create (e.g., 'STICK', 'FISH_MEAT').
 * @returns An Item object with a unique instance ID, or null if the definition doesn't exist.
 */
export function createItemInstance(baseId: string): Item | null {
    // Check if the baseId contains a color prefix
    const colorWords = ['NAVY', 'BLUE', 'ROYAL', 'RED', 'CRIMSON', 'GREEN', 'FOREST', 'YELLOW', 'GOLD', 
                       'PURPLE', 'ORANGE', 'BROWN', 'BLACK', 'WHITE', 'SILVER', 'GRAY', 'GREY',
                       'TEAL', 'TURQUOISE', 'CORAL', 'TAN', 'IVORY', 'AMBER', 'BRONZE', 'COPPER',
                       'DARK_BROWN', 'CHOCOLATE', 'INDIGO', 'WHEAT'];
    
    let colorPrefix = '';
    let cleanBaseId = baseId;
    
    // Extract color from baseId if present
    for (const color of colorWords) {
        if (baseId.startsWith(color + '_')) {
            // Handle multi-word colors like DARK_BROWN
            colorPrefix = color.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            cleanBaseId = baseId.substring(color.length + 1);
            break;
        }
    }
    
    let definition = ITEM_DEFINITIONS[cleanBaseId] || ITEM_DEFINITIONS[baseId];
    if (!definition) {
        console.log(`[ItemCreation] Creating procedural item for: ${baseId}`);
        definition = generateProceduralItemDefinition(cleanBaseId);
        console.log(`[ItemCreation] Generated: ${definition.name} (${definition.material})`);
    }
    
    // Create the item instance
    const item: Item = {
        ...definition,
        id: `item-${itemIdCounter++}-${Date.now()}`,
        quantity: 1,
    };
    
    // Add color to the name if we found one, but only for non-material items
    if (colorPrefix) {
        const materialColors = ['leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 'copper', 
                               'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'];
        const material = (item.material || '').toLowerCase();
        const hasMaterialColor = materialColors.some(mat => material.includes(mat));
        
        if (!hasMaterialColor) {
            item.name = `${colorPrefix} ${item.name}`;
        }
    }
    
    return item;
}

/**
 * Adds an item to an inventory array, handling stacking for stackable items.
 * @param inventory The current inventory array.
 * @param itemToAdd The item instance to add.
 * @returns A new inventory array with the item added or stacked.
 */
export function addItemToInventory(inventory: Item[], itemToAdd: Item): Item[] {
    const newInventory = [...inventory];
    if (itemToAdd.stackable) {
        const existingItemIndex = newInventory.findIndex(i => i.baseId === itemToAdd.baseId);
        if (existingItemIndex > -1) {
            newInventory[existingItemIndex] = {
                ...newInventory[existingItemIndex],
                quantity: newInventory[existingItemIndex].quantity + itemToAdd.quantity,
            };
            return newInventory;
        }
    }
    // If not stackable or not found, add as a new item
    newInventory.push(itemToAdd);
    return newInventory;
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

/**
 * Calculate the chance of having an amulet based on era, culture, and profession
 */
function calculateAmuletChance(era?: HistoricalEra, culture?: CulturalZone, profession?: string): number {
    let baseChance = 0.35; // 35% base chance
    
    // Era modifiers
    if (era === HistoricalEra.MEDIEVAL) baseChance += 0.20; // +20% for medieval (religious)
    if (era === HistoricalEra.ANTIQUITY) baseChance += 0.15; // +15% for ancient (amulet culture)
    if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) baseChance += 0.10; // +10% for renaissance
    
    // Culture modifiers  
    if (culture === 'MENA' || culture === 'EUROPEAN') baseChance += 0.10; // Religious cultures
    if (culture === 'SOUTH_ASIAN' || culture === 'EAST_ASIAN') baseChance += 0.10; // Religious jewelry tradition
    
    // Profession modifiers
    const profLower = profession?.toLowerCase() || '';
    if (profLower.includes('priest') || profLower.includes('monk') || profLower.includes('nun')) baseChance = 0.90;
    if (profLower.includes('merchant') || profLower.includes('noble') || profLower.includes('scholar')) baseChance += 0.15;
    if (profLower.includes('child') || profLower.includes('orphan')) baseChance += 0.20; // Children more likely
    if (profLower.includes('pilgrim')) baseChance = 0.95; // Pilgrims almost always have religious items
    
    return Math.min(baseChance, 0.95); // Cap at 95%
}

/**
 * Add a quality adjective to amulet/jewelry names based on privilege level
 */
function addQualityAdjective(itemName: string, privilege: number): string {
    // Skip if name already has an adjective
    if (itemName.toLowerCase().includes('legendary') || 
        itemName.toLowerCase().includes('ornate') ||
        itemName.toLowerCase().includes('polished') ||
        itemName.toLowerCase().includes('beautiful')) {
        return itemName;
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
 * Select a culturally appropriate amulet based on era, culture, and privilege
 */
function selectCulturalAmulet(era: HistoricalEra, culture: CulturalZone, privilege: number): string | null {
    // Map era/culture to appropriate amulet items
    const amuletMap: Record<string, string[]> = {
        // Medieval combinations
        'MEDIEVAL_EUROPEAN': ['WOODEN_CROSS', 'PRAYER_BEADS', 'SAINTS_MEDAL', 'PILGRIM_BADGE', 'ROPE_NECKLACE'],
        'MEDIEVAL_MENA': ['HAMSA_PENDANT', 'PRAYER_BEADS', 'EVIL_EYE_AMULET', 'CORAL_BEADS'],
        'MEDIEVAL_EAST_ASIAN': ['JADE_PENDANT', 'PRAYER_BEADS', 'BONE_NECKLACE'],
        'MEDIEVAL_SOUTH_ASIAN': ['PRAYER_BEADS', 'SHELL_NECKLACE', 'CORAL_BEADS'],
        'MEDIEVAL_SUB_SAHARAN_AFRICAN': ['BONE_NECKLACE', 'SHELL_NECKLACE', 'ROPE_NECKLACE'],
        'MEDIEVAL_NORTH_AMERICAN_PRE_COLUMBIAN': ['BONE_NECKLACE', 'SHELL_NECKLACE', 'JADE_PENDANT'],
        'MEDIEVAL_SOUTH_AMERICAN': ['BONE_NECKLACE', 'SHELL_NECKLACE', 'JADE_PENDANT'],
        'MEDIEVAL_OCEANIA': ['SHELL_NECKLACE', 'BONE_NECKLACE', 'WHALE_TOOTH_NECKLACE'],
        
        // Antiquity combinations
        'ANTIQUITY_EUROPEAN': ['BULLA', 'TORC_NECKLACE', 'AMBER_PENDANT', 'CORAL_BEADS'],
        'ANTIQUITY_MENA': ['EVIL_EYE_AMULET', 'SCARAB_PENDANT', 'ANKH_PENDANT', 'HAMSA_PENDANT'],
        'ANTIQUITY_EAST_ASIAN': ['JADE_PENDANT', 'BONE_NECKLACE'],
        'ANTIQUITY_SOUTH_ASIAN': ['SHELL_NECKLACE', 'CORAL_BEADS'],
        
        // Renaissance/Early Modern
        'RENAISSANCE_EARLY_MODERN_EUROPEAN': ['SILVER_CROSS', 'RELIQUARY_PENDANT', 'POMANDER', 'CORAL_BEADS', 'PEARL_NECKLACE'],
        'RENAISSANCE_EARLY_MODERN_MENA': ['HAMSA_PENDANT', 'EVIL_EYE_AMULET', 'PRAYER_BEADS'],
        
        // Industrial Era
        'INDUSTRIAL_ERA_EUROPEAN': ['PHOTO_LOCKET', 'POCKET_WATCH_CHAIN', 'MOURNING_JEWELRY', 'SILVER_CROSS'],
        'INDUSTRIAL_ERA_MENA': ['HAMSA_PENDANT', 'PRAYER_BEADS', 'EVIL_EYE_AMULET'],
        'INDUSTRIAL_ERA_EAST_ASIAN': ['JADE_PENDANT', 'PRAYER_BEADS'],
        
        // Modern Era
        'MODERN_ERA_EUROPEAN': ['DOG_TAGS', 'MEDICAL_ALERT_PENDANT', 'SILVER_CHAIN', 'PHOTO_LOCKET'],
        'MODERN_ERA_NORTH_AMERICAN_PRE_COLUMBIAN': ['DOG_TAGS', 'SILVER_CHAIN', 'MEDICAL_ALERT_PENDANT'],
        'MODERN_ERA_MENA': ['HAMSA_PENDANT', 'EVIL_EYE_AMULET', 'PRAYER_BEADS'],
        
        // Default fallbacks
        'DEFAULT_POOR': ['ROPE_NECKLACE', 'SHELL_NECKLACE', 'BONE_NECKLACE', 'WOODEN_CROSS'],
        'DEFAULT_COMMON': ['PRAYER_BEADS', 'SHELL_NECKLACE', 'BRONZE_PIN', 'ROPE_NECKLACE'],
        'DEFAULT_WEALTHY': ['SILVER_CHAIN', 'GOLD_CHAIN', 'PEARL_NECKLACE', 'CORAL_BEADS']
    };
    
    // Build key from era and culture
    const key = `${era}_${culture}`;
    let options = amuletMap[key];
    
    // If no specific match, use defaults based on wealth
    if (!options) {
        if (privilege > 0.7) {
            options = amuletMap['DEFAULT_WEALTHY'];
        } else if (privilege > 0.3) {
            options = amuletMap['DEFAULT_COMMON'];
        } else {
            options = amuletMap['DEFAULT_POOR'];
        }
    }
    
    // Filter by wealth level - remove expensive items for poor characters
    if (privilege < 0.3 && options) {
        const expensiveItems = ['GOLD_CHAIN', 'PEARL_NECKLACE', 'SILVER_CHAIN', 'RELIQUARY_PENDANT', 'WHALE_TOOTH_NECKLACE'];
        options = options.filter(item => !expensiveItems.includes(item));
    }
    
    // Add wealthy-only options
    if (privilege > 0.7 && options) {
        const wealthyUpgrades: Record<string, string> = {
            'ROPE_NECKLACE': 'SILVER_CHAIN',
            'WOODEN_CROSS': 'SILVER_CROSS',
            'SHELL_NECKLACE': 'PEARL_NECKLACE',
            'BONE_NECKLACE': 'AMBER_PENDANT'
        };
        
        options = options.map(item => wealthyUpgrades[item] || item);
    }
    
    if (!options || options.length === 0) return null;
    
    // Random selection from appropriate options
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Adds random pets based on era, profession, and chance
 */
function addRandomPets(playerCharacter: PlayerCharacter): void {
    const currentYear = playerCharacter.year || 1500;
    const profession = playerCharacter.profession?.toLowerCase() || '';
    
    console.log(`[RandomPets] Processing ${playerCharacter.name} (${profession})`);
    
    // Only certain professions get random pets
    const petFriendlyProfessions = [
        'shepherd', 'farmer', 'hunter', 'nomad', 'vaquero', 'cowboy', 'fur trapper',
        'innkeeper', 'merchant', 'wanderer', 'peasant', 'serf', 'commoner',
        'goat herder', 'cattle herder', 'camel herder', 'duck herder', 'llama herder', 'ranchero', 'horse trainer'
    ];
    
    // Urban/craft professions are less likely to have random pets
    const urbanProfessions = [
        'silk weaver', 'weaver', 'baker', 'blacksmith', 'scribe', 'merchant',
        'banker', 'painter', 'alchemist', 'court scribe', 'calligrapher',
        'factory worker', 'shopkeeper', 'docker', 'coal miner', 'journalist'
    ];
    
    let petChanceMultiplier = 1.0;
    
    if (petFriendlyProfessions.some(p => profession.includes(p))) {
        petChanceMultiplier = 2.0; // Double chance for rural/outdoor professions
        console.log(`[RandomPets] ${profession} is pet-friendly, multiplier = 2.0`);
    } else if (urbanProfessions.some(p => profession.includes(p))) {
        petChanceMultiplier = 0.02; // Almost no chance for urban crafters (2%)
        console.log(`[RandomPets] ${profession} is urban crafter, multiplier = 0.02`);
    } else {
        console.log(`[RandomPets] ${profession} is neutral, multiplier = 1.0`);
    }
    
    // Random pet dog (base 10% chance, modified by profession)
    const dogChance = 0.10 * petChanceMultiplier;
    if (Math.random() < dogChance) {
        createStartingCompanion('DOG', playerCharacter);
    }
    
    // Random pet cat (base chance varies by era, modified by profession)
    const baseCatChance = currentYear >= 1800 ? 0.08 : 0.03;
    const catChance = baseCatChance * petChanceMultiplier;
    if (Math.random() < catChance) {
        createStartingCompanion('CAT', playerCharacter);
    }
    
    // Eccentric pets (very rare - only for certain professions)
    if (profession.includes('jester') || profession.includes('alchemist') || profession.includes('shaman')) {
        if (Math.random() < 0.05) { // 5% for eccentric professions
            const eccentricPets = ['SQUIRREL', 'CHICKEN'];
            const randomPet = eccentricPets[Math.floor(Math.random() * eccentricPets.length)];
            createStartingCompanion(randomPet, playerCharacter);
        }
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

    // Create inventory items with colors if options provided
    let inventory: Item[];
    if (colorOptions?.culture) {
        inventory = pkg.inventory
            .map(baseId => createColoredItemInstance(baseId, colorOptions.culture!, colorOptions.privilege, colorOptions.era))
            .filter(item => item !== null) as Item[];
    } else {
        inventory = pkg.inventory
            .map(baseId => createItemInstance(baseId))
            .filter(item => item !== null) as Item[];
    }
    
    // Create equipped items with colors if options provided
    const equippedItems: PlayerCharacter['equippedItems'] = {};
    
    // First, add all defined equipment
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
            else if (colorOptions?.culture) {
                item = createColoredItemInstance(baseId, colorOptions.culture, colorOptions.privilege, colorOptions.era);
            } else {
                item = createItemInstance(baseId);
            }
            if(item) equippedItems[slot as keyof typeof equippedItems] = item;
        }
    }
    
    // Define generic headgear that should be replaced with contextual alternatives
    const GENERIC_HEADGEAR = ['STRAW_HAT', 'CLOTH_CAP', 'LEATHER_CAP', 'FELT_CAP', 'CLOTH_HOOD'];
    
    // Replace generic headgear OR add if missing
    const shouldReplaceHeadgear = !equippedItems.head || 
                                  (equippedItems.head && GENERIC_HEADGEAR.includes(equippedItems.head.baseId));
    
    if (shouldReplaceHeadgear && colorOptions) {
        const headgearId = generateContextualHeadgear(profession, {
            era: colorOptions.era,
            culture: colorOptions.culture,
            privilege: colorOptions.privilege
        });
        
        if (headgearId) {
            const headgearItem = createColoredItemInstance(headgearId, colorOptions.culture!, colorOptions.privilege, colorOptions.era);
            if (headgearItem) {
                equippedItems.head = headgearItem;
            }
        }
    }
    
    // Replace generic torso items OR add if missing
    const shouldReplaceTorso = !equippedItems.torso || 
                               (equippedItems.torso && GENERIC_TORSO_ITEMS.includes(equippedItems.torso.baseId));
    
    if (shouldReplaceTorso && colorOptions) {
        const torsoId = generateContextualTorso(profession, {
            era: colorOptions.era,
            culture: colorOptions.culture,
            privilege: colorOptions.privilege
        });
        
        if (torsoId) {
            const torsoItem = createItemInstance(torsoId);
            if (torsoItem) {
                equippedItems.torso = torsoItem;
            }
        }
    }
    
    // Replace generic amulet OR add if missing
    const shouldReplaceAmulet = !equippedItems.amulet || 
                                (equippedItems.amulet && GENERIC_ACCESSORIES.includes(equippedItems.amulet.baseId));
    
    if (shouldReplaceAmulet && colorOptions) {
        const amuletChance = calculateAmuletChance(colorOptions.era, colorOptions.culture, profession);
        
        if (Math.random() < amuletChance) {
            const amuletId = generateContextualAccessory(profession, {
                era: colorOptions.era,
                culture: colorOptions.culture,
                privilege: colorOptions.privilege,
                slot: 'amulet'
            });
            
            if (amuletId) {
                const amuletItem = createItemInstance(amuletId);
                if (amuletItem) {
                    // Add quality adjective instead of color/material prefix
                    amuletItem.name = addQualityAdjective(amuletItem.name, colorOptions.privilege || 0.5);
                    equippedItems.amulet = amuletItem;
                }
            }
        }
    }
    
    // Replace generic ring OR add if missing (ring1 slot)
    const shouldReplaceRing = !equippedItems.ring1 || 
                             (equippedItems.ring1 && GENERIC_ACCESSORIES.includes(equippedItems.ring1.baseId));
    
    if (shouldReplaceRing && colorOptions) {
        const ringChance = 0.3 + (colorOptions.privilege || 0.5) * 0.4; // 30-70% chance based on privilege
        
        if (Math.random() < ringChance) {
            const ringId = generateContextualAccessory(profession, {
                era: colorOptions.era,
                culture: colorOptions.culture,
                privilege: colorOptions.privilege,
                slot: 'ring'
            });
            
            if (ringId) {
                const ringItem = createItemInstance(ringId);
                if (ringItem) {
                    ringItem.name = addQualityAdjective(ringItem.name, colorOptions.privilege || 0.5);
                    equippedItems.ring1 = ringItem;
                }
            }
        }
    }
    
    // Add cultural accessory (earrings, nose rings, bindis, etc.) - Phase 2 Enhanced
    if (!equippedItems.accessory && colorOptions && playerCharacter) {
        // Use culture-specific accessory chance
        let baseChance = 0.30; // Default 30%
        
        // Cultures with near-universal tattoo/marking traditions
        if (colorOptions.culture === 'OCEANIA') {
            baseChance = 1.0; // Everyone in Polynesian/Maori culture has tattoos
        } else if (colorOptions.culture === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
            baseChance = 0.85; // Very common tattoos and face paint
        } else if (colorOptions.culture === 'SUB_SAHARAN_AFRICAN') {
            baseChance = 0.80; // Scarification, tattoos, and ornaments very common
        } else if (colorOptions.culture === 'SOUTH_AMERICAN') {
            baseChance = 0.75; // Body modifications common in many cultures
        } else if (colorOptions.culture === 'SOUTH_ASIAN') {
            baseChance = 0.70; // Bindis, nose rings, henna very common especially for women
        } else if (colorOptions.culture === 'MENA') {
            baseChance = 0.60; // Kohl, henna, tattoos common
        } else if (colorOptions.culture === 'EAST_ASIAN') {
            baseChance = 0.45; // Hair ornaments, some cultural markings
        } else if (colorOptions.culture === 'EUROPEAN') {
            baseChance = 0.35; // Lower base rate, more jewelry than markings
        }
        
        // Privilege can still modify the base chance slightly
        const accessoryChance = Math.min(1.0, baseChance + (colorOptions.privilege || 0.5) * 0.1)
        
        if (Math.random() < accessoryChance) {
            // Determine wealth level
            const wealthLevel = colorOptions.privilege && colorOptions.privilege > 0.7 ? 'wealthy' :
                               colorOptions.privilege && colorOptions.privilege > 0.5 ? 'comfortable' :
                               colorOptions.privilege && colorOptions.privilege > 0.3 ? 'modest' : 'poor';
            
            // Generate culturally appropriate accessory with procedural naming
            const accessoryItem = generateCulturalAccessory({
                culture: colorOptions.culture || 'EUROPEAN',
                era: colorOptions.era,
                wealth: wealthLevel,
                gender: playerCharacter.gender || 'male',
                profession: profession
            });
            
            if (accessoryItem) {
                equippedItems.accessory = accessoryItem;
                
                // For wealthy/noble characters, potentially add multiple accessories to inventory
                if (wealthLevel === 'wealthy' || wealthLevel === 'comfortable') {
                    const extraChance = wealthLevel === 'wealthy' ? 0.5 : 0.3;
                    if (Math.random() < extraChance) {
                        const extraAccessories = generateAccessorySet({
                            culture: colorOptions.culture || 'EUROPEAN',
                            era: colorOptions.era,
                            wealth: wealthLevel,
                            gender: playerCharacter.gender || 'male',
                            profession: profession
                        }, wealthLevel === 'wealthy' ? 2 : 1);
                        
                        // Add extra accessories to inventory
                        extraAccessories.forEach(extra => {
                            if (extra && extra.baseId !== accessoryItem.baseId) {
                                inventory.push(extra);
                            }
                        });
                    }
                }
            }
        }
    }
    
    // Handle starting companion animals
    if (playerCharacter && pkg.companions) {
        pkg.companions.forEach(animalBaseId => {
            createStartingCompanion(animalBaseId, playerCharacter);
        });
    }
    
    // Add random pets
    if (playerCharacter) {
        addRandomPets(playerCharacter);
    }
    
    return { inventory, equippedItems };
}