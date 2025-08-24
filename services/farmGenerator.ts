/**
 * services/farmGenerator.ts - Procedural and LLM-based generation for farm details.
 */
import { Tile, FarmDetails, MapData, Gender } from '../types';
import { generateNpcName } from '../generation/common/npcUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { ValueNoise } from '../utils/noise';
import { generateLlmFarmDetails } from './llmService';
import { parseDateString } from '../utils/dateUtils';

/**
 * Main entry point for generating farm details.
 * Dispatches to the correct generator based on the `useLlm` flag.
 * @param tile The FARMLAND tile.
 * @param context Contextual information for generation.
 * @param useLlm Flag to determine if the LLM should be used.
 * @returns A promise that resolves to a FarmDetails object.
 */
export async function generateFarmDetails(
    tile: Tile,
    context: { date: string, location: string, climate: string },
    useLlm: boolean
): Promise<FarmDetails> {

    if (useLlm) {
        return generateLlmFarmDetails(tile, context, useLlm).catch(error => {
            console.error("Error generating LLM farm details, falling back to procedural:", error);
            return generateProceduralFarmDetails(tile, context);
        });
    } else {
        return Promise.resolve(generateProceduralFarmDetails(tile, context));
    }
}

/**
 * Generates farm details procedurally from predefined data and noise.
 * @param tile The FARMLAND tile.
 * @param context Contextual information for generation.
 * @returns A FarmDetails object.
 */
function generateProceduralFarmDetails(
    tile: Tile,
    context: { date: string, location: string, climate: string }
): FarmDetails {
    const noise = new ValueNoise(tile.x * 13 + tile.y * 31);
    const dateInfo = parseDateString(context.date);
    const culturalZone = mapLocationToCulture(context.location, dateInfo.year);
    const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
    const farmerName = generateNpcName(gender, culturalZone, undefined, dateInfo.year, noise);
    
    // Use family name consistently - extract surname from farmer name
    const nameParts = farmerName.split(' ');
    const familyName = (nameParts[1] || nameParts[0]);
    const farmName = `${familyName} Family Farm`;

    const economicStatusOptions: FarmDetails['economicStatus'][] = ["humble", "prosperous"];
    const economicStatus = economicStatusOptions[Math.floor(noise.random() * economicStatusOptions.length)];

    const descriptionTemplates = [
        `A simple farmstead with fields of ${tile.cropType?.toLowerCase() || 'local crops'}. The cottage looks weathered by the seasons.`,
        `A modest farmstead with neatly tended fields. It seems to have seen better days but is still functional.`,
        `A sprawling farm with well-maintained fences and a sturdy-looking farmhouse.`,
        `Nestled in a small valley, the fields are tidy but small, and a lone cottage has a sagging roof thatched with moss.`
    ];
    const farmDescription = descriptionTemplates[Math.floor(noise.random() * descriptionTemplates.length)];
    
    return {
        farmName,
        farmerName,
        farmerAge: 30 + Math.floor(noise.random() * 40),
        farmDescription,
        economicStatus,
    };
}