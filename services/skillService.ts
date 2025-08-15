/**
 * services/skillService.ts - The main service for executing player skills.
 */
import { Tile, SkillID, SkillResult, PlayerContext, ForageSkillResult, ObserveSkillResult, BiomeType, AnimalEntity, ChopSkillResult, DigSkillResult, VegetationEntity, VegetationSpecies, Item, ItemQuality } from '../types';
import { generateObservationText, generateUniqueForageItem } from './llmService';
import { LOOT_TABLES, ANIMAL_DATA, VEGETATION_SPECIES_DATA, ITEM_DEFINITIONS, STRUCTURE_LOOT_TABLES, METALS } from '../constants/index';
import { createItemInstance, generateProceduralItemDefinition } from '../utils/inventoryUtils';
import { executeTerrainDig, executeTerrainForage, executeTerrainChop } from './terrainForagingService';


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
    
    // Check if this is an urban tile
    const isUrbanTile = mapData.urbanCenters?.some(uc => 
        uc.x === tile.x && uc.y === tile.y
    ) || false;
    
    // Try terrain-specific foraging first
    const terrainResult = executeTerrainForage(tile, playerCharacter, isUrbanTile);
    if (terrainResult.success) {
        const result: ForageSkillResult = {
            type: 'forage',
            success: true,
            item: terrainResult.item!,
            message: terrainResult.message,
            xpGained: terrainResult.xpGained || 1
        };
        
        // Add reputation change if stealing
        if (terrainResult.reputationChange) {
            (result as any).reputationChange = terrainResult.reputationChange;
            (result as any).stealingDetected = terrainResult.stealingDetected;
        }
        
        return result;
    }
    const perception = playerCharacter.stats.perception || 5;
    const luck = playerCharacter.stats.luck || 5;

    // 1. Check for specific vegetation on the tile
    const vegetationEntity = mapData.vegetation?.find(v => v.id === tile.vegetationId);
    if (vegetationEntity) {
        const speciesDef = findSpeciesDefinition(vegetationEntity.baseType, vegetationEntity.speciesName, mapData.climate);
        
        // Check if it's a bush that can be foraged - always successful
        if (vegetationEntity.baseType === 'generic_bush' || vegetationEntity.baseType === 'berry_bush') {
            let itemToCreate: string | null = null;
            const bushName = speciesDef?.name || vegetationEntity.speciesName || 'bush';
            
            // Map specific bush types to specific items
            const nameLower = bushName.toLowerCase();
            if (nameLower.includes('pepper')) {
                itemToCreate = 'WILD_BERRIES'; // Using existing item as peppercorns
            } else if (nameLower.includes('azalea')) {
                itemToCreate = 'HERB_BUNDLE'; // Azalea flowers
            } else if (nameLower.includes('jasmine')) {
                itemToCreate = 'HERB_BUNDLE'; // Jasmine flowers
            } else if (nameLower.includes('coffee')) {
                itemToCreate = 'WILD_BERRIES'; // Coffee beans
            } else if (nameLower.includes('tea')) {
                itemToCreate = 'DRY_LEAVES'; // Tea leaves
            } else if (nameLower.includes('berry') || nameLower.includes('elder') || 
                       nameLower.includes('blackberry') || nameLower.includes('lingon') ||
                       nameLower.includes('cloud') || nameLower.includes('crow')) {
                itemToCreate = 'WILD_BERRIES';
            } else if (nameLower.includes('rose')) {
                itemToCreate = 'HERB_BUNDLE'; // Rose petals
            } else if (nameLower.includes('hibiscus')) {
                itemToCreate = 'HERB_BUNDLE'; // Hibiscus flowers
            } else if (nameLower.includes('sage') || nameLower.includes('lavender') || 
                       nameLower.includes('thyme') || nameLower.includes('rosemary') ||
                       nameLower.includes('oregano') || nameLower.includes('basil')) {
                itemToCreate = 'HERB_BUNDLE';
            } else if (nameLower.includes('ginseng') || nameLower.includes('goldenseal') || 
                       nameLower.includes('echinacea')) {
                itemToCreate = 'MEDICINAL_HERBS';
            } else if (speciesDef?.drops && speciesDef.drops.length > 0) {
                // Use the first defined drop
                itemToCreate = speciesDef.drops[0].name;
            } else {
                // Generic fallback
                itemToCreate = 'HERB_BUNDLE';
            }
            
            const item = createItemInstance(itemToCreate);
            if (item) {
                // Customize item name based on the bush
                const customItem = { ...item };
                if (nameLower.includes('pepper')) {
                    customItem.name = 'Peppercorns';
                    customItem.description = 'Aromatic black peppercorns, worth their weight in silver.';
                } else if (nameLower.includes('coffee')) {
                    customItem.name = 'Coffee Beans';
                    customItem.description = 'Raw coffee beans, ready to be roasted.';
                } else if (nameLower.includes('azalea')) {
                    customItem.name = 'Azalea Flowers';
                    customItem.description = 'Beautiful azalea flowers, prized for their color.';
                } else if (nameLower.includes('jasmine')) {
                    customItem.name = 'Jasmine Flowers';
                    customItem.description = 'Fragrant jasmine flowers, perfect for tea or perfume.';
                } else if (nameLower.includes('rose')) {
                    customItem.name = 'Rose Petals';
                    customItem.description = 'Delicate rose petals with a sweet fragrance.';
                } else if (nameLower.includes('hibiscus')) {
                    customItem.name = 'Hibiscus Flowers';
                    customItem.description = 'Vibrant hibiscus flowers, excellent for tea.';
                } else if (nameLower.includes('lavender')) {
                    customItem.name = 'Lavender Sprigs';
                    customItem.description = 'Fragrant lavender, prized for perfumes and medicine.';
                } else if (nameLower.includes('rosemary')) {
                    customItem.name = 'Fresh Rosemary';
                    customItem.description = 'Aromatic rosemary, essential for Mediterranean cuisine.';
                } else if (nameLower.includes('thyme')) {
                    customItem.name = 'Wild Thyme';
                    customItem.description = 'Fragrant wild thyme, perfect for cooking and medicine.';
                } else if (nameLower.includes('oregano')) {
                    customItem.name = 'Wild Oregano';
                    customItem.description = 'Pungent oregano, a staple of Mediterranean cooking.';
                } else if (nameLower.includes('olive')) {
                    customItem.name = 'Fresh Olives';
                    customItem.description = 'Ripe olives from ancient trees, ready for pressing or curing.';
                } else if (nameLower.includes('grape')) {
                    customItem.name = 'Wine Grapes';
                    customItem.description = 'Sweet grapes perfect for winemaking.';
                } else if (nameLower.includes('fig')) {
                    customItem.name = 'Fresh Figs';
                    customItem.description = 'Sweet, ripe figs - a Mediterranean delicacy.';
                }
                
                return { 
                    type: 'forage', 
                    success: true, 
                    item: customItem,
                    message: `You successfully harvested ${customItem.name.toLowerCase()} from the ${bushName}.`,
                    xpGained: 2,
                    entityToRemoveId: vegetationEntity.id // Mark bush for removal
                };
            }
        } else if (speciesDef?.drops && speciesDef.drops.length > 0) {
            // For non-bush vegetation (trees, etc), use the original chance-based system
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
    
    // Check if this is an urban tile
    const isUrbanTile = mapData.urbanCenters?.some(uc => 
        uc.x === tile.x && uc.y === tile.y
    ) || false;
    
    // Try terrain-specific chopping first (mangroves, bamboo, etc.)
    const terrainResult = executeTerrainChop(tile, playerCharacter, isUrbanTile);
    if (terrainResult.success || terrainResult.reputationChange) {
        const result: ChopSkillResult = {
            type: 'chop',
            success: terrainResult.success,
            item: terrainResult.item,
            message: terrainResult.message,
            xpGained: terrainResult.xpGained || 0
        };
        
        // Add reputation change if vandalism
        if (terrainResult.reputationChange) {
            (result as any).reputationChange = terrainResult.reputationChange;
            (result as any).stealingDetected = terrainResult.stealingDetected;
        }
        
        return result;
    }

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
    
    // Check if this is an urban tile
    const isUrbanTile = mapData.urbanCenters?.some(uc => 
        uc.x === tile.x && uc.y === tile.y
    ) || false;
    
    // Try terrain-specific digging first (salt flats, beaches, etc.)
    const terrainResult = executeTerrainDig(tile, playerCharacter, isUrbanTile);
    if (terrainResult.success) {
        const result: DigSkillResult = {
            type: 'dig',
            success: true,
            item: terrainResult.item!,
            message: terrainResult.message,
            xpGained: terrainResult.xpGained || 1
        };
        
        // Add reputation change if stealing
        if (terrainResult.reputationChange) {
            (result as any).reputationChange = terrainResult.reputationChange;
            (result as any).stealingDetected = terrainResult.stealingDetected;
        }
        
        return result;
    }

    // Case 1: Mining a mineral deposit
    if (tile.mineralDeposit && tile.mineralDeposit.quantity > 0) {
        const strength = playerCharacter.stats.strength || 5;
        const luck = playerCharacter.stats.luck || 5;
        
        // Determine tool effectiveness and quality bonus
        let toolEffectiveness = 0.25; // Default for any item (25% success rate)
        let toolName = "your improvised tool";
        let toolModifier = 0.5; // Amount modifier for non-pickaxe tools
        let qualityBonus = 0; // Bonus to quality roll
        
        if (equippedTool) {
            const toolId = equippedTool.baseId.toUpperCase();
            
            if (toolId.includes('PICKAXE')) {
                // Pickaxes are 100% effective and give quality bonus
                toolEffectiveness = 1.0;
                toolModifier = toolId === 'STEEL_PICKAXE' ? 1.5 : 1.0;
                qualityBonus = toolId === 'STEEL_PICKAXE' ? 0.3 : 0.2;
                toolName = "your pickaxe";
            } else if (toolId.includes('SHOVEL') || toolId.includes('SPADE')) {
                // Shovels are moderately effective
                toolEffectiveness = 0.5;
                toolModifier = 0.7;
                qualityBonus = 0.1;
                toolName = "your shovel";
            } else if (toolId.includes('AXE') || toolId.includes('HAMMER')) {
                // Axes and hammers are somewhat effective
                toolEffectiveness = 0.4;
                toolModifier = 0.6;
                qualityBonus = 0.05;
                toolName = equippedTool.name.toLowerCase();
            } else if (toolId.includes('SWORD') || toolId.includes('DAGGER') || toolId.includes('KNIFE')) {
                // Bladed weapons are less effective
                toolEffectiveness = 0.3;
                toolModifier = 0.5;
                qualityBonus = 0;
                toolName = equippedTool.name.toLowerCase();
            } else if (toolId.includes('STICK') || toolId.includes('BRANCH')) {
                // Sticks are minimally effective
                toolEffectiveness = 0.25;
                toolModifier = 0.3;
                qualityBonus = -0.1; // Penalty to quality
                toolName = "your stick";
            } else {
                // Any other item
                toolEffectiveness = 0.25;
                toolModifier = 0.4;
                qualityBonus = -0.05;
                toolName = equippedTool.name.toLowerCase();
            }
        } else {
            // Bare hands - very ineffective and poor quality
            toolEffectiveness = 0.1;
            toolModifier = 0.2;
            qualityBonus = -0.2;
            toolName = "your bare hands";
        }
        
        // Apply strength bonus to success chance
        const successChance = toolEffectiveness + (strength - 5) * 0.02;

        if (Math.random() < successChance) {
            const baseAmount = 3 + Math.floor(strength / 3 + Math.random() * 3);
            const amountExtracted = Math.floor(baseAmount * toolModifier);
            const actualAmount = Math.min(amountExtracted, tile.mineralDeposit.quantity);
            const oreItemId = METALS[tile.mineralDeposit.metalId].oreItemId;
            const item = createItemInstance(oreItemId);

            if (item) {
                // Determine quality based on tool, luck, and random chance
                const luckModifier = (luck - 5) * 0.03; // Each luck point adds 3% to quality roll
                const qualityRoll = Math.random() + qualityBonus + luckModifier;
                
                let quality: ItemQuality;
                let qualityDescription = "";
                
                if (qualityRoll >= 0.95) {
                    quality = 'excellent';
                    qualityDescription = "pristine quality ";
                } else if (qualityRoll >= 0.7) {
                    quality = 'good';
                    qualityDescription = "good quality ";
                } else if (qualityRoll >= 0.3) {
                    quality = 'standard';
                    qualityDescription = "";
                } else {
                    quality = 'poor';
                    qualityDescription = "low quality ";
                }
                
                // Apply quality to the item
                item.quality = quality;
                
                // Modify item name based on quality for certain minerals
                const metalName = METALS[tile.mineralDeposit.metalId].name.toLowerCase();
                if (quality === 'poor' && (metalName === 'gold' || metalName === 'silver')) {
                    item.name = metalName.charAt(0).toUpperCase() + metalName.slice(1) + ' Dust';
                    item.description = `Fine ${metalName} dust, difficult to work with but still valuable.`;
                } else if (quality === 'excellent' && (metalName === 'gold' || metalName === 'silver')) {
                    item.name = metalName.charAt(0).toUpperCase() + metalName.slice(1) + ' Nugget';
                    item.description = `A pure ${metalName} nugget, perfect for crafting fine items.`;
                }
                
                // Adjust crafting value based on quality
                if (quality === 'excellent') {
                    item.craftingValue = (item.craftingValue || 1) * 1.5;
                } else if (quality === 'good') {
                    item.craftingValue = (item.craftingValue || 1) * 1.2;
                } else if (quality === 'poor') {
                    item.craftingValue = (item.craftingValue || 1) * 0.7;
                }
                
                item.quantity = actualAmount;
                const newDepositQty = tile.mineralDeposit.quantity - actualAmount;
                const message = newDepositQty > 0 
                    ? `You successfully extract ${actualAmount} ${qualityDescription}${item.name.toLowerCase()} using ${toolName}!`
                    : `You extract the last ${actualAmount} ${qualityDescription}${item.name.toLowerCase()} from the depleted deposit using ${toolName}!`;
                
                return {
                    type: 'dig',
                    success: true,
                    message,
                    item,
                    xpGained: quality === 'excellent' ? 4 : quality === 'good' ? 3 : 2,
                    tileCoords: { x: tile.x, y: tile.y },
                    amountExtracted: actualAmount,
                };
            }
        }
        
        // Failure message varies by tool
        const failureMessage = equippedTool?.baseId.includes('PICKAXE') 
            ? "You swing your pickaxe but fail to break off any ore."
            : `You try to dig with ${toolName} but can't extract any ore this time.`;
        return { type: 'dig', success: false, message: failureMessage };
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