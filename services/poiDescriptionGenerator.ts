/**
 * services/poiDescriptionGenerator.ts - Procedural and AI-powered description generator for Points of Interest.
 */
import { TerrainStructure, GameDate, MapData, BiomeType, CulturalZone, HistoricalEra } from '../types';
import { GoogleGenAI } from "@google/genai";

const getAgeDescriptor = (age: number): string => {
    if (age > 2000) return 'impossibly ancient';
    if (age > 1000) return 'ancient';
    if (age > 500) return 'very old';
    if (age > 200) return 'old';
    if (age > 50) return 'well-established';
    return 'recent';
};

const getConditionDescriptor = (state: TerrainStructure['state']): string => {
    switch (state) {
        case 'active':
            return 'in excellent, actively used condition';
        case 'ruined':
            return 'in a state of severe disrepair';
        case 'under_construction':
            return 'currently under construction';
        default:
            return 'in a peculiar state';
    }
};

const getTerrainContext = (structure: TerrainStructure, mapData: MapData): string => {
    const [x, y] = structure.location;
    const tiles = mapData.tiles;
    const checkRadius = 3;

    let isCoastal = false;
    let isMountainous = false;
    let isForested = false;
    let isRiverbank = false;

    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < mapData.width && checkY >= 0 && checkY < mapData.height) {
                const tile = tiles[checkY][checkX];
                if (tile.isCoast) isCoastal = true;
                if (tile.biome === BiomeType.MOUNTAIN || tile.biome === BiomeType.HIGH_PEAK) isMountainous = true;
                if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) isForested = true;
                if (tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) isRiverbank = true;
            }
        }
    }

    if (isCoastal) return `It stands defiantly on a coastal cliff overlooking the sea.`;
    if (isMountainous) return `It is nestled in the foothills of a great mountain.`;
    if (isForested) return `It is secluded within a deep forest.`;
    if (isRiverbank) return `It stands proudly on the banks of a river.`;

    return `It is situated on a strategic rise in the landscape.`;
};

async function generateLlmDescription(structure: TerrainStructure, gameDate: GameDate, mapData: MapData): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { name, constructionYear, state, structureType, allegianceGroup } = structure;

    if (!constructionYear) return `This is ${name}, a structure of unknown age.`;
    
    const age = gameDate.year - constructionYear;
    const ageDesc = getAgeDescriptor(age);
    const conditionDesc = getConditionDescriptor(state);
    const terrainDesc = getTerrainContext(structure, mapData);

    const prompt = `
        You are a historian and travel writer for a historical fantasy world. Write a short, evocative, 2-3 sentence description for a landmark.
        Do not use exact numbers for age or height. Be poetic and give it a sense of place and history.

        CONTEXT:
        - Landmark Name: ${name}
        - Type: ${structureType.replace(/_/g, ' ')}
        - Approx. Age: It is ${ageDesc} (built around ${constructionYear}).
        - Condition: It is ${conditionDesc}.
        - Location: ${terrainDesc}
        - Allegiance: It is aligned with ${allegianceGroup}.
        - Cultural Context: The region is similar to ${mapData.continent} around the year ${gameDate.year}.

        TASK:
        Combine these facts into a compelling, in-character description.
        Example: "The old Pagoda at Three Kingdoms Pass has stood for as long as anyone can remember, a silent sentinel watching the seasons turn. Locals whisper it was built by an ancient emperor to appease a mountain spirit. Though weathered by centuries, it remains a site of active pilgrimage, a beacon of faith for the people of the Three Kingdoms."
    `;

    try {
        const response = await ai.models.generateContent({ model: 'gem-2.5-flash', contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating POI description with Gemini:", error);
        // Fallback to procedural on error
        return generateProceduralDescription(structure, gameDate, mapData);
    }
}

function generateProceduralDescription(structure: TerrainStructure, gameDate: GameDate, mapData: MapData): string {
    const { name, constructionYear, dimensions, state, structureType } = structure;
    if (!constructionYear || !dimensions) {
        return 'A structure of indeterminate age and size stands here.';
    }

    const age = gameDate.year - constructionYear;
    const ageDesc = getAgeDescriptor(age);
    const conditionDesc = getConditionDescriptor(state);
    const terrainDesc = getTerrainContext(structure, mapData);

    let mainDesc = '';

    switch (structureType) {
        case 'palace':
            mainDesc = `${name} is a grand residence built as a seat of power.`;
            break;
        case 'holy_site':
            mainDesc = `${name} is a place of profound spiritual importance, drawing pilgrims from across the region.`;
            break;
        case 'ruin':
            mainDesc = `These are the remains of ${name}, hinting at a forgotten past.`;
            break;
        default:
            mainDesc = `This is a significant structure known as ${name}.`;
    }
    
    const sizeDesc = `It is a considerable structure.`;
    const ageInfo = `Locals say it is ${ageDesc}.`;
    const conditionInfo = `Today, it is ${conditionDesc}.`;
    const locationInfo = terrainDesc;

    return `${mainDesc} ${locationInfo} ${sizeDesc} ${ageInfo} ${conditionInfo}`;
}


export function generatePoiDescription(structure: TerrainStructure, gameDate: GameDate, mapData: MapData, useLlm: boolean = false): string {
    // For now, always use procedural until LLM functionality is explicitly requested/enabled via UI.
    // This maintains offline capability as the default.
    if (useLlm) {
        // This would be an async function, which React components can handle in useEffect.
        // For this synchronous context, we'd need to manage loading states.
        // Let's assume for now the component will handle the async nature.
        // Forcing procedural for now.
        return generateProceduralDescription(structure, gameDate, mapData);
    } else {
        return generateProceduralDescription(structure, gameDate, mapData);
    }
}
