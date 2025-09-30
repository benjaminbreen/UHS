
/**
 * services/contentGenerator.ts - Generates contents for interactive objects.
 */
import { InteriorEntity, InteriorMapData, Item, HistoricalEra } from '../types';
import { generateLlmContents } from './llmService';
import { CONTAINER_LOOT_TABLES, LocationKey, BuildingKey, ContainerKey } from '../constants/gameData/itemLists';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';
import { parseDateString } from '../utils/dateUtils';

let itemIdCounter = 0;

function createItemInstance(baseId: string): Item | null {
    const definition = getItemDefinition(baseId);
    if (!definition) {
        console.warn(`No item definition found for baseId: ${baseId}`);
        return null;
    }
    return {
        ...definition,
        id: `item-${itemIdCounter++}-${Date.now()}`,
        quantity: 1,
    };
}

function selectRandomItems(list: string[], count: number, noise: number): string[] {
    const shuffled = [...list].sort(() => 0.5 - Math.random() * noise);
    return shuffled.slice(0, count);
}

/**
 * Generates item lists procedurally from predefined constants.
 */
function generateProceduralContents(entity: InteriorEntity, mapData: InteriorMapData, date: string, location: string): Item[] {
    const dateInfo = parseDateString(date);
    const era = dateInfo.era as HistoricalEra;
    const buildingType = mapData.buildingType.toUpperCase() as BuildingKey;
    const containerType = entity.subType.toUpperCase() as ContainerKey;
    
    // Defaulting to Europe for now if location key is not found.
    const locationKey = 'EUROPE' as LocationKey;
    
    const possibleItemIds = CONTAINER_LOOT_TABLES[era]?.[locationKey]?.[buildingType]?.[containerType];
    
    if (possibleItemIds && possibleItemIds.length > 0) {
        const itemCount = 1 + Math.floor(Math.random() * 3); // 1 to 3 items
        const selectedIds = selectRandomItems(possibleItemIds, itemCount, Math.random());
        return selectedIds.map(id => createItemInstance(id)).filter(item => item !== null) as Item[];
    }

    return [];
}


/**
 * Main entry point for generating container contents.
 * Dispatches to the correct generator based on the `useLlm` flag.
 */
export function generateContents(
    entity: InteriorEntity, 
    mapData: InteriorMapData, 
    date: string, 
    location: string, 
    useLlm: boolean
): Promise<Item[]> {
    if (useLlm) {
        // LLM generation would need to be updated to return structured Item data
        // For now, we fall back to procedural if LLM fails.
        return generateLlmContents(entity, mapData, date, location).catch(error => {
            console.error("Error generating LLM contents, falling back to procedural:", error);
            return generateProceduralContents(entity, mapData, date, location);
        });
    } else {
        return Promise.resolve(generateProceduralContents(entity, mapData, date, location));
    }
}
