/**
 * utils/inventoryUtils.ts - Utility functions for player inventory management.
 */
import { Item, ItemDefinition, EquipmentSlot, PlayerCharacter, AnimalEntity } from '../types';
import { ITEM_DEFINITIONS, STARTING_PACKAGES, ANIMAL_DATA } from '../constants/index';
import { generateProceduralItemDescription } from '../services/itemDescriptionGenerator';
import { createTamedAnimal, addToParty } from '../services/animalTamingService';

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
    playerCharacter?: PlayerCharacter
): { inventory: Item[], equippedItems: PlayerCharacter['equippedItems'] } {
    const pkg = STARTING_PACKAGES[profession] || STARTING_PACKAGES['Wanderer'];
    if (!pkg) return { inventory: [], equippedItems: {} };
    
    // Clear any existing tamed animals when creating a new character
    if (playerCharacter) {
        console.log(`[StartingPackage] Clearing existing tamed animals for new character: ${playerCharacter.name}`);
        localStorage.removeItem('tamedAnimals');
    }

    const inventory = pkg.inventory
        .map(baseId => createItemInstance(baseId))
        .filter(item => item !== null) as Item[];
    
    const equippedItems: PlayerCharacter['equippedItems'] = {};
    for (const slot in pkg.equipment) {
        const baseId = pkg.equipment[slot as keyof typeof pkg.equipment];
        if (baseId) {
            const item = createItemInstance(baseId);
            if(item) equippedItems[slot as keyof typeof equippedItems] = item;
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