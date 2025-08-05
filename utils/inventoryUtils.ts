/**
 * utils/inventoryUtils.ts - Utility functions for player inventory management.
 */
import { Item, ItemDefinition, EquipmentSlot, PlayerCharacter } from '../types';
import { ITEM_DEFINITIONS, STARTING_PACKAGES } from '../constants/index';
import { generateProceduralItemDescription } from '../services/itemDescriptionGenerator';

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

    // Handle clothing
    let category: Item['category'] = 'Apparel';
    let equipmentSlot: EquipmentSlot | undefined = undefined;
    let material = 'Cloth';

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
    
    if (lowerId.includes('leather') || lowerId.includes('hide') || lowerId.includes('pelt')) material = 'Leather';
    if (lowerId.includes('wool')) material = 'Wool';
    if (lowerId.includes('silk')) material = 'Silk';

    const definition: ItemDefinition = {
        baseId, name, category, wearable: true, equipmentSlot, material, defense: 0,
        description: `A piece of clothing: ${name}.`,
        emoji: '👕',
        rarity: 'Common',
        value: 5,
        weight: 1,
        stackable: false,
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 2,
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
    let definition = ITEM_DEFINITIONS[baseId];
    if (!definition) {
        definition = generateProceduralItemDefinition(baseId);
    }
    return {
        ...definition,
        id: `item-${itemIdCounter++}-${Date.now()}`,
        quantity: 1,
    };
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
export function assembleStartingPackage(profession: string): { inventory: Item[], equippedItems: PlayerCharacter['equippedItems'] } {
    const pkg = STARTING_PACKAGES[profession] || STARTING_PACKAGES['Wanderer'];
    if (!pkg) return { inventory: [], equippedItems: {} };

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
    
    return { inventory, equippedItems };
}