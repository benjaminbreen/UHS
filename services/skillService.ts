/**
 * services/skillService.ts - The main service for executing player skills.
 */
import { Tile, SkillID, SkillResult, PlayerContext, ForageSkillResult, ObserveSkillResult, BiomeType, AnimalEntity, ChopSkillResult, DigSkillResult, VegetationEntity, VegetationSpecies, Item } from '../types';
import { generateObservationText, generateUniqueForageItem } from './llmService';
import { LOOT_TABLES, ANIMAL_DATA, VEGETATION_SPECIES_DATA, ITEM_DEFINITIONS, STRUCTURE_LOOT_TABLES, METALS } from '../constants/index';
import { createItemInstance, generateProceduralItemDefinition } from '../utils/inventoryUtils';


async function executeObserve(context: PlayerContext): Promise<ObserveSkillResult> {
    try {
        const description = await generateObservationText(context);
        return { type: 'observe', description };
    } catch (error) {
        console.error("Error executing Observe skill:", error);
        return { type: 'observe', description: "You try to focus, but your mind wanders. The details of the area remain indistinct." };
    }
}

function findSpeciesDefinition(baseType: string, speciesName: string, climate: string): VegetationSpecies | null {
    const climateData = VEGETATION_SPECIES_DATA[baseType as keyof typeof VEGETATION_SPECIES_DATA]?.[climate as keyof typeof VEGETATION_SPECIES_DATA[keyof typeof VEGETATION_SPECIES_DATA]];
    if (!climateData) return null;
    for (const rarityTier of Object.values(climateData)) {
        const speciesDef = rarityTier.find(s => s.name === speciesName);
        if (speciesDef) return speciesDef;
    }
    return null;
}

async function executeForage(context: PlayerContext): Promise<ForageSkillResult> {
    const { playerCharacter, currentTile, mapData } = context;

    if (!playerCharacter || !mapData) {
        return { type: 'forage', success: false, message: "You can't forage right now." };
    }
    
    const tile = currentTile as Tile;
    const perception = playerCharacter.stats.perception || 5;
    const luck = playerCharacter.stats.luck || 5;

    // 1. Check for specific vegetation on the tile
    const vegetationEntity = mapData.vegetation?.find(v => v.id === tile.vegetationId);
    if (vegetationEntity) {
        const speciesDef = findSpeciesDefinition(vegetationEntity.baseType, vegetationEntity.speciesName, mapData.climate);
        if (speciesDef?.drops && speciesDef.drops.length > 0) {
            for (const drop of speciesDef.drops) {
                const successChance = drop.chance * (1 + (perception - 5) * 0.05 + (luck - 5) * 0.02);
                if (Math.random() < successChance) {
                    const item = createItemInstance(drop.name);
                    if (item) {
                        return { 
                            type: 'forage', 
                            success: true, 
                            item,
                            message: `You foraged ${item.name.toLowerCase()} from the ${speciesDef.name}.`,
                            xpGained: 1
                        };
                    }
                }
            }
        }
    }

    // 2. Check for structure on the tile
    const structure = mapData.terrainStructures?.find(s => s.location[0] === tile.x && s.location[1] === tile.y);
    if (structure && STRUCTURE_LOOT_TABLES[structure.structureType]) {
        const lootTable = STRUCTURE_LOOT_TABLES[structure.structureType];
        const roll = Math.random() * 100;
        if (roll < 5 && lootTable.Rare) {
            const itemName = lootTable.Rare[Math.floor(Math.random() * lootTable.Rare.length)];
            const item = createItemInstance(itemName);
            if(item) return { type: 'forage', success: true, item, message: `Searching around the ${structure.name}, you find something rare!`, xpGained: 2 };
        }
        if (roll < 50 && lootTable.Common) {
            const itemName = lootTable.Common[Math.floor(Math.random() * lootTable.Common.length)];
            const item = createItemInstance(itemName);
            if(item) return { type: 'forage', success: true, item, message: `You find some scraps near the ${structure.name}.`, xpGained: 1 };
        }
    }
    
    // 3. Fallback to generic biome loot table
    const lootTable = LOOT_TABLES[tile.biome];
    if (!lootTable) {
        return { type: 'forage', success: false, message: "You find nothing of use in this area." };
    }

    const roll = Math.random() * 100;
    const luckBonus = (luck - 5) * 1.5;
    
    if (roll <= 1 + luckBonus / 2) { 
        try {
            const uniqueItem = await generateUniqueForageItem(context);
            return { type: 'forage', success: true, item: { ...uniqueItem, rarity: 'Unique' }, message: `Incredibly, you've found something unique!`, xpGained: 5 };
        } catch (error) {
             const fallbackItem = lootTable.ultra_rare?.[0] || lootTable.rare?.[0] || 'A Peculiar Rock';
             const item = createItemInstance(fallbackItem) || {name: fallbackItem, description: 'A rock', rarity: 'Rare'};
             return { type: 'forage', success: true, item: {name: item.name, rarity: 'Ultra-rare', description: item.description}, message: `You found something very rare!`, xpGained: 3 };
        }
    } else if (roll <= 6 + luckBonus) { 
        const items = lootTable.ultra_rare;
        if (items && items.length > 0) {
            const itemName = items[Math.floor(Math.random() * items.length)];
            const item = createItemInstance(itemName);
            if(item) return { type: 'forage', success: true, item, message: `You found something very rare!`, xpGained: 3 };
        }
    } else if (roll <= 31 + luckBonus * 2) { 
        const items = lootTable.rare;
        if (items && items.length > 0) {
            const itemName = items[Math.floor(Math.random() * items.length)];
            const item = createItemInstance(itemName);
            if(item) return { type: 'forage', success: true, item, message: 'You found something of interest!', xpGained: 1 };
        }
    }

    const items = lootTable.common;
    if (items && items.length > 0) {
        const itemName = items[Math.floor(Math.random() * items.length)];
        const item = createItemInstance(itemName);
        if(item) return { type: 'forage', success: true, item, message: 'You foraged successfully.', xpGained: 1 };
    }
    
    return { type: 'forage', success: false, message: "You search the area but find nothing useful." };
}


async function executeChop(context: PlayerContext): Promise<ChopSkillResult> {
    const { playerCharacter, currentTile, mapData } = context;
    if (!playerCharacter || !mapData) return { type: 'chop', success: false, message: 'You cannot chop right now.' };
    
    const tile = currentTile as Tile;
    const vegetationEntity = mapData.vegetation?.find(v => v.id === tile.vegetationId);

    if (!vegetationEntity || !vegetationEntity.baseType.includes('tree')) {
        return { type: 'chop', success: false, message: 'There is nothing here to chop.' };
    }
    
    const equippedTool = playerCharacter.equippedItems.main_hand;
    if (!equippedTool) {
        return { type: 'chop', success: false, message: 'You need to be holding a tool to chop.' };
    }

    let toolModifier = 0;
    if (equippedTool.baseId === 'AXE') {
        toolModifier = 0.3; // 30% bonus for a proper axe
    } else if (equippedTool.baseId === 'STICK') {
        toolModifier = 0.05; // 5% bonus for a sturdy stick
    } else {
        toolModifier = -0.1; // 10% penalty for using an improper tool
    }

    const strength = playerCharacter.stats.strength || 5;
    const successChance = 0.3 + (strength / 10) * 0.5 + toolModifier; // Base 30% + up to 50% from strength + tool modifier

    if (Math.random() < successChance) {
        const logBaseId = `${vegetationEntity.speciesName.toUpperCase().replace(/ /g, '_')}_LOG`;
        const logItem = createItemInstance(logBaseId);
        
        if (!logItem) return { type: 'chop', success: false, message: 'You successfully chopped the tree, but the wood was unusable.' };

        return {
            type: 'chop',
            success: true,
            message: `With a mighty effort, you fell the ${vegetationEntity.speciesName.toLowerCase()} and gather a log!`,
            item: logItem,
            xpGained: 3,
            entityToRemoveId: vegetationEntity.id,
        };
    } else {
        return { type: 'chop', success: false, message: `You swing at the ${vegetationEntity.speciesName.toLowerCase()} but fail to make a dent.` };
    }
}

async function executeDig(context: PlayerContext): Promise<DigSkillResult> {
    const { playerCharacter, currentTile, mapData } = context;
    if (!playerCharacter || !mapData) return { type: 'dig', success: false, message: "You can't dig right now." };

    const tile = currentTile as Tile;
    const equippedTool = playerCharacter.equippedItems.main_hand;

    // Case 1: Mining a mineral deposit
    if (tile.mineralDeposit && tile.mineralDeposit.quantity > 0) {
        if (!equippedTool || !equippedTool.baseId.includes('PICKAXE')) {
            return { type: 'dig', success: false, message: "You need a pickaxe to mine this deposit." };
        }

        const strength = playerCharacter.stats.strength || 5;
        const toolModifier = equippedTool.baseId === 'STEEL_PICKAXE' ? 1.5 : 1.0;
        const successChance = 0.75 + (strength - 5) * 0.05 * toolModifier;

        if (Math.random() < successChance) {
            const amountExtracted = Math.floor((5 + strength / 2 + Math.random() * 5) * toolModifier);
            const actualAmount = Math.min(amountExtracted, tile.mineralDeposit.quantity);
            const oreItemId = METALS[tile.mineralDeposit.metalId].oreItemId;
            const item = createItemInstance(oreItemId);

            if (item) {
                item.quantity = actualAmount;
                const newDepositQty = tile.mineralDeposit.quantity - actualAmount;
                const message = newDepositQty > 0 
                    ? `You successfully mined some ${item.name.toLowerCase()}!`
                    : `You mined the last of the ${item.name.toLowerCase()} from the depleted deposit!`;
                
                return {
                    type: 'dig',
                    success: true,
                    message,
                    item,
                    xpGained: 2,
                    tileCoords: { x: tile.x, y: tile.y },
                    amountExtracted: actualAmount,
                };
            }
        }
        return { type: 'dig', success: false, message: "You swing your pickaxe but fail to break off any ore." };
    }

    // Case 2: Digging in normal ground
    const digRoll = Math.random();
    let foundItem: Item | null = null;
    let message: string;

    if (digRoll < 0.80) { // 80% chance to find something
        const lootRoll = Math.random();
        let itemBaseId: string;
        if (lootRoll < 0.35) itemBaseId = 'EARTHWORM';
        else if (lootRoll < 0.60) itemBaseId = 'CLAY_LUMP';
        else if (lootRoll < 0.75) itemBaseId = 'ROOT';
        else if (lootRoll < 0.85) itemBaseId = 'DAMP_LOG';
        else if (lootRoll < 0.95) itemBaseId = 'POTTERY_SHARD';
        else itemBaseId = 'SMOOTH_STONE';
        
        foundItem = createItemInstance(itemBaseId);
        message = `You dig in the dirt and find a ${foundItem?.name.toLowerCase()}.`;
    } else {
        message = "You dig for a while but find nothing of interest.";
    }

    if (foundItem) {
        return {
            type: 'dig',
            success: true,
            message,
            item: foundItem,
            xpGained: 1
        };
    }

    return { type: 'dig', success: false, message };
}

/**
 * Main dispatcher for executing any player skill.
 * @param skillId The ID of the skill to execute.
 * @param context The current player and environmental context.
 * @returns A promise that resolves with the result of the skill.
 */
export async function executeSkill(skillId: SkillID, context: PlayerContext): Promise<SkillResult> {
    switch(skillId) {
        case 'OBSERVE':
            return await executeObserve(context);
        case 'FORAGE':
            return await executeForage(context);
        case 'DIG':
            return await executeDig(context);
        case 'CHOP':
            return await executeChop(context);
        default:
            console.error(`Unknown skill ID: ${skillId}`);
            return null;
    }
}