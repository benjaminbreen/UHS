/**
 * services/cityModalService.ts - LLM-powered city description generation for CityModal
 */
import { GoogleGenAI, Type } from "@google/genai";
import { Tile, MapData, NpcEntity, BiomeType } from '../types';

interface CityDescriptionParams {
    tile: Tile;
    mapData: MapData;
    currentDate: { year: number; month: number; day: number };
    currentTime: { hours: number; minutes: number };
    residents: NpcEntity[];
    businesses: any[];
    culturalZone: string;
    era: string;
}

interface CityDescriptionResponse {
    description: string;
    atmosphere: string;
    workspaces: string;
}

/**
 * Generate a 3-sentence LLM description of the city/urban district
 * following the exact same pattern as llmService.ts
 */
export async function generateCityDescription(params: CityDescriptionParams): Promise<CityDescriptionResponse> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Analyze nearby biomes for geographic context
    const nearbyBiomes = getNearbyBiomes(params.tile, params.mapData);
    const geographicContext = formatGeographicContext(nearbyBiomes);

    // Format time and date
    const timeString = `${params.currentTime.hours.toString().padStart(2, '0')}:${params.currentTime.minutes.toString().padStart(2, '0')}`;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dateString = `${monthNames[params.currentDate.month - 1]} ${params.currentDate.day}, ${params.currentDate.year}`;

    // Format residents and businesses
    const residentsList = params.residents.map(npc => `${npc.name} (${npc.profession || npc.role})`).slice(0, 6);
    const businessesList = params.businesses.map(biz => `${biz.name} (${biz.type})`).slice(0, 4);

    // Get settlement name and type
    const settlementName = params.tile.cityName || getSettlementTypeDescription(params.tile.biome);
    const population = params.tile.population || Math.max(params.residents.length * 10, 50);

    // Get specific business details with names and types
    const businessDetails = params.businesses.map(biz => {
        const bizType = (biz.displayType || biz.type.replace(/_/g, ' ')).toLowerCase();
        const bizName = biz.name || 'unnamed business';
        const statusInfo = biz.businessStatusDisplay && biz.goodsQualityDisplay ?
            ` (${biz.businessStatusDisplay.toLowerCase()}, ${biz.goodsQualityDisplay.toLowerCase()} quality)` : '';
        return `${bizName} (${bizType}${statusInfo})`;
    });

    // Debug logging
    console.log('[CityModalService] Business data:', params.businesses);
    console.log('[CityModalService] Processed business details:', businessDetails);

    // Get the primary business for detailed description
    const primaryBusiness = params.businesses.length > 0 ? params.businesses[0] : null;
    const primaryBusinessType = primaryBusiness ?
        (primaryBusiness.displayType || primaryBusiness.type.replace(/_/g, ' ')).toLowerCase() : 'workshop';
    const primaryBusinessStatus = primaryBusiness?.businessStatusDisplay?.toLowerCase() || 'modest';
    const primaryBusinessQuality = primaryBusiness?.goodsQualityDisplay?.toLowerCase() || 'adequate';

    console.log('[CityModalService] Primary business:', primaryBusiness);
    console.log('[CityModalService] Primary business type:', primaryBusinessType);
    console.log('[CityModalService] Primary business status:', primaryBusinessStatus);
    console.log('[CityModalService] Primary business quality:', primaryBusinessQuality);

    const prompt = `
You are describing what a traveler SEES when entering an urban settlement. Write exactly 3 sentences in second-person POV ("You see...").

LOCATION: ${settlementName} in ${params.mapData.localArea || params.mapData.mapAreaName || 'the region'}
DATE: ${dateString} (${params.era} era)
TIME: ${timeString}
CULTURAL ZONE: ${params.culturalZone}
POPULATION: ~${population}
GEOGRAPHIC SETTING: ${geographicContext}
BUSINESSES VISIBLE: ${businessDetails.length > 0 ? businessDetails.join(', ') : 'small workshops'}

Write EXACTLY 3 sentences following this pattern:

1. First sentence: What the traveler SEES physically - describe the actual buildings, materials, layout. Be specific about architectural details for this culture/era. Start with "You see..." or "Before you stands..."

2. Second sentence: What people are DOING right now - be specific about their clothing, activities, sounds. Include specific cultural details about dress, behavior, tools being used.

3. Third sentence: Describe the specific workshop/business in detail - what it looks like from outside, what goods/services are visible, smells, sounds of work being done. Focus on the ${primaryBusinessType}${primaryBusiness ? ` called "${primaryBusiness.name}"` : ''}, which appears to be ${primaryBusinessStatus} and produces ${primaryBusinessQuality} quality goods. Describe specific details like tools hanging outside, goods on display, signs of the trade appropriate for a ${primaryBusinessType}, and visual cues that indicate the business is ${primaryBusinessStatus} (e.g., well-maintained vs. run-down appearance, busy vs. quiet activity, quality of displayed goods).

Be CONCRETE and VISUAL. No abstract descriptions or tentative language. Describe exactly what is SEEN, HEARD, and SMELLED. Include specific materials (adobe, timber, stone), colors, numbers of buildings, actual activities happening.

Examples of good specific language:
- "You see a cluster of twelve mud-brick houses with flat roofs"
- "Women in indigo-dyed cotton wraps carry water jars on their heads"
- "The blacksmith's shop displays iron tools hanging from the doorframe, and you can hear the rhythmic clang of hammer on anvil"

DO NOT use vague language like "bustling", "various", "some", "families prepare", etc.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "Complete 3-sentence description of the urban district"
                        },
                        atmosphere: {
                            type: Type.STRING,
                            description: "Single word describing the current mood/atmosphere"
                        },
                        workspaces: {
                            type: Type.STRING,
                            description: "Brief summary of the business/workspace activity"
                        }
                    },
                    required: ["description", "atmosphere", "workspaces"]
                }
            }
        });

        let jsonStr = response.text.trim();

        // Handle potential code fence wrapping
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);

        return {
            description: parsedData.description || "A bustling urban district filled with activity and commerce.",
            atmosphere: parsedData.atmosphere || "busy",
            workspaces: parsedData.workspaces || "Local craftspeople and merchants conduct their daily business."
        };

    } catch (error) {
        console.error('[CityModalService] Failed to generate city description:', error);

        // Fallback description in POV style
        const buildingMaterial = params.culturalZone.includes('AMERICAN') ? 'adobe and timber' :
                                params.culturalZone.includes('ASIAN') ? 'wood and tile' :
                                params.culturalZone.includes('MENA') ? 'mud-brick and stone' :
                                params.culturalZone.includes('AFRICAN') ? 'clay and thatch' :
                                'stone and timber';

        const timeActivity = params.currentTime.hours < 8 ? 'preparing morning meals' :
                            params.currentTime.hours < 12 ? 'carrying goods and water' :
                            params.currentTime.hours < 16 ? 'working at their trades' :
                            params.currentTime.hours < 19 ? 'closing shop for the day' :
                            'gathering around cooking fires';

        const businessDesc = primaryBusiness ?
            `A ${primaryBusinessStatus} ${primaryBusinessType}${primaryBusiness.name ? ` called "${primaryBusiness.name}"` : ''} displays ${primaryBusinessQuality} quality wares near the entrance, with the sound of work echoing from within.` :
            'Small workshops line the main path, their doors open to the ' + (params.currentTime.hours > 19 ? 'evening' : 'day') + ' air.';

        return {
            description: `You see a collection of ${buildingMaterial} structures arranged along narrow paths. People in simple cloth garments are ${timeActivity}. ${businessDesc}`,
            atmosphere: "active",
            workspaces: params.businesses.length > 0 ?
                `${params.businesses.length} workspaces` :
                "Small workshops"
        };
    }
}

/**
 * Get nearby biomes for geographic context
 */
function getNearbyBiomes(tile: Tile, mapData: MapData): BiomeType[] {
    const nearbyBiomes: BiomeType[] = [];
    const radius = 2;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = tile.x + dx;
            const y = tile.y + dy;

            if (y >= 0 && y < mapData.tiles.length && x >= 0 && x < mapData.tiles[0].length) {
                const nearbyTile = mapData.tiles[y][x];
                if (nearbyTile && nearbyTile.biome !== tile.biome) {
                    nearbyBiomes.push(nearbyTile.biome);
                }
            }
        }
    }

    // Remove duplicates
    const uniqueBiomes: BiomeType[] = [];
    nearbyBiomes.forEach(biome => {
        if (!uniqueBiomes.includes(biome)) {
            uniqueBiomes.push(biome);
        }
    });
    return uniqueBiomes;
}

/**
 * Format geographic context from nearby biomes
 */
function formatGeographicContext(nearbyBiomes: BiomeType[]): string {
    const features: string[] = [];

    if (nearbyBiomes.some(b => b === BiomeType.RIVER || b === BiomeType.MAJOR_RIVER)) {
        features.push("along a river");
    }
    if (nearbyBiomes.some(b => b === BiomeType.BEACH || b === BiomeType.SHALLOW_OCEAN)) {
        features.push("near the coast");
    }
    if (nearbyBiomes.some(b => b === BiomeType.MOUNTAIN || b === BiomeType.HIGH_PEAK)) {
        features.push("in the mountains");
    }
    if (nearbyBiomes.some(b => b === BiomeType.FOREST || b === BiomeType.DENSE_FOREST)) {
        features.push("surrounded by forests");
    }
    if (nearbyBiomes.some(b => b === BiomeType.FARMLAND)) {
        features.push("amid agricultural lands");
    }
    if (nearbyBiomes.some(b => b === BiomeType.DESERT)) {
        features.push("on the edge of desert");
    }
    if (nearbyBiomes.some(b => b === BiomeType.WETLANDS)) {
        features.push("near wetlands");
    }

    if (features.length === 0) {
        return "in an open landscape";
    } else if (features.length === 1) {
        return features[0];
    } else {
        return features.slice(0, 2).join(" and ");
    }
}

/**
 * Get settlement type description from biome
 */
function getSettlementTypeDescription(biome: BiomeType): string {
    switch (biome) {
        case BiomeType.HAMLET: return "small hamlet";
        case BiomeType.LOW_DENSITY_CITY: return "growing town";
        case BiomeType.DENSE_CITY: return "busy city district";
        case BiomeType.CITY_CENTER: return "city center";
        default: return "settlement";
    }
}

/**
 * Get time-based activity description
 */
function getTimeBasedActivity(hour: number): string {
    if (hour >= 5 && hour < 8) return "preparing for the day ahead";
    if (hour >= 8 && hour < 12) return "engaged in morning activities";
    if (hour >= 12 && hour < 16) return "busy with midday tasks";
    if (hour >= 16 && hour < 19) return "completing afternoon work";
    if (hour >= 19 && hour < 22) return "winding down from the day";
    return "resting in their homes";
}