/**
 * services/llmService.ts - Centralized service for all Gemini API interactions.
 */
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InteriorEntity, InteriorMapData, PlayerContext, Item, PlayerCharacter, Tile, FarmDetails, HistoricalEra, EncounterableEntity, DialogueEntry, Gender, NpcEntity, MapData, GameDate, Appearance, TerrainStructure, isAnimal, isNpc, isStandardTile, BiomeType } from '../types';
import { StudyContext, StudyAction } from '../types/studyTypes';
import type { Season } from '../types';
import { CulturalZone, ANIMAL_DATA } from '../constants/index';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
// FACTION_DATA is loaded on-demand - see getAllFactionData() where needed
import { generateNpcName } from "../generation/common/npcUtils";
import { mapLocationToCulture } from "../utils/mapUtils";
import { ValueNoise } from "../utils/noise";
import { parseDateString, getDayOfYear } from "../utils/dateUtils";
import { findNpcFriends } from './socialService';
import { primarySourceService } from './primarySourceService';
import { loadTamedAnimals, TamedAnimal } from './animalTamingService';
import { WeatherService, WeatherState, weatherService } from './weatherService';
import { dialectContinuumService } from './dialectContinuumService';
import { atmosphericContextService } from './atmosphericContextService';
import { getCropNutrientEffects, evaluateCropRotation } from './cropNutrientService';
import { getWorkOffersForNpc } from './workOfferStorage';
import { learningObjectivesService } from './learningObjectivesService';
import { generateWitnessContextForLLM, generateWitnessReactionModifier } from './npcWitnessService';
import type { HistoryLensMessage } from '../types/historyLens';

// Cache for historical events to avoid regenerating them every dialogue
interface HistoricalEventCache {
    key: string;
    event: string;
    timestamp: number;
}

const historicalEventCache: Map<string, HistoricalEventCache> = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

/**
 * Helper function to get surrounding terrain information for LLM context
 */
function getSurroundingTerrain(mapData: MapData | null, playerX: number, playerY: number, radius: number = 2): string {
    if (!mapData?.tiles) return 'Unable to determine surrounding terrain.';

    const directions = {
        'north': [0, -1],
        'northeast': [1, -1],
        'east': [1, 0],
        'southeast': [1, 1],
        'south': [0, 1],
        'southwest': [-1, 1],
        'west': [-1, 0],
        'northwest': [-1, -1]
    };

    const terrainInfo: string[] = [];
    const tileCount: Record<string, number> = {};

    // Check immediate adjacent tiles
    for (const [dir, [dx, dy]] of Object.entries(directions)) {
        const x = playerX + dx;
        const y = playerY + dy;
        if (y >= 0 && y < mapData.tiles.length && x >= 0 && x < mapData.tiles[0].length) {
            const tile = mapData.tiles[y][x];
            const biome = isStandardTile(tile) ? tile.biome : 'unknown';

            // Special callouts for barriers
            if (biome === BiomeType.CLIFF) {
                terrainInfo.push(`impassable cliff to the ${dir}`);
            } else if (biome === BiomeType.DEEP_OCEAN) {
                terrainInfo.push(`deep ocean to the ${dir}`);
            } else if (biome === BiomeType.MOUNTAIN || biome === BiomeType.HIGH_PEAK) {
                terrainInfo.push(`mountain barrier to the ${dir}`);
            }

            tileCount[biome] = (tileCount[biome] || 0) + 1;
        }
    }

    // Count tiles in wider radius for general terrain sense
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const x = playerX + dx;
            const y = playerY + dy;
            if (y >= 0 && y < mapData.tiles.length && x >= 0 && x < mapData.tiles[0].length) {
                const tile = mapData.tiles[y][x];
                const biome = isStandardTile(tile) ? tile.biome : 'unknown';
                tileCount[biome] = (tileCount[biome] || 0) + 1;
            }
        }
    }

    // Build description
    const dominant = Object.entries(tileCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([biome, count]) => `${biome.toLowerCase().replace(/_/g, ' ')} (${count} tiles)`)
        .join(', ');

    let description = terrainInfo.length > 0
        ? `Immediate obstacles: ${terrainInfo.join(', ')}. `
        : '';
    description += `Surrounding terrain within ${radius} tiles: ${dominant}`;

    return description;
}

/**
 * Helper function to format precise time information for LLMs
 */
function getTimeContext(context: PlayerContext): string {
    const { gameTime, ambianceContext } = context;
    if (!gameTime) return ambianceContext?.timeOfDay || 'unknown time';

    const { hours, minutes } = gameTime;
    const timeOfDay = ambianceContext?.timeOfDay || 'Day';

    // Convert 24-hour to 12-hour format
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minuteStr = minutes.toString().padStart(2, '0');

    // Add descriptive context for specific times
    let timeDescription = `${hour12}:${minuteStr} ${ampm}`;

    if (hours === 0) timeDescription += ' (midnight)';
    else if (hours === 12) timeDescription += ' (noon)';
    else if (hours >= 1 && hours <= 5) timeDescription += ' (deep night)';
    else if (hours >= 6 && hours <= 8) timeDescription += ' (early morning)';
    else if (hours >= 18 && hours <= 20) timeDescription += ' (evening)';
    else if (hours >= 21 && hours <= 23) timeDescription += ' (late night)';

    return `${timeDescription} during ${timeOfDay.toLowerCase()}`;
}

/**
 * Helper function to get weather context for LLM
 */
function getWeatherContext(mapData: MapData | null, context: PlayerContext): string {
    // Try to use existing weather data first
    if (mapData?.currentWeather) {
        const w = mapData.currentWeather;
        let desc = `Current weather: ${w.description}. `;
        desc += `Temperature: ${w.feelsLike}°C (${w.condition || 'moderate'}). `;
        if (w.precipitation !== 'none') {
            desc += `${w.precipitation} with ${Math.round(w.intensity * 100)}% intensity. `;
        }
        if (w.windSpeed > 20) {
            desc += `Strong winds at ${w.windSpeed} km/h. `;
        }
        if (w.special) {
            desc += `Special condition: ${w.special}. `;
        }
        return desc;
    }

    // Fallback to calculating weather if not available
    if (mapData && context.gameTime && context.gameDate && context.season) {
        const centerX = Math.floor(mapData.tiles[0].length / 2);
        const centerY = Math.floor(mapData.tiles.length / 2);
        const centerTile = mapData.tiles[centerY][centerX];

        const weather = weatherService.getWeather(
            mapData.climate,
            centerTile.biome,
            context.season as Season,
            context.ambianceContext?.timeOfDay,
            centerTile.altitude || 0.5,
            getDayOfYear(context.gameDate),
            { x: centerX, y: centerY }
        );

        if (weather) {
            let desc = `Current weather: ${weather.description}. `;
            desc += `Temperature feels like ${weather.feelsLike}°C. `;
            if (weather.precipitation !== 'none') {
                desc += `${weather.precipitation} occurring. `;
            }
            if (weather.windSpeed > 20) {
                desc += `Strong winds at ${weather.windSpeed} km/h. `;
            }
            return desc;
        }
    }

    return 'Weather conditions unknown.';
}

const formatAppearance = (character: PlayerCharacter | NpcEntity): string => {
    if (!character.appearance) return "of average appearance.";
    const { age, gender, appearance } = character;
    const { build, skinColor, hairColor, eyeColor, garment, affect } = appearance;
    
    // Defensive checks
    const genderStr = (gender || 'person').toLowerCase();
    const garmentName = (garment?.name || 'simple clothes').toLowerCase().replace(/_/g, ' ');

    return `a ${age}-year-old ${genderStr} with a ${build || 'medium'} build, ${skinColor || 'tanned'} skin, ${hairColor || 'brown'} hair, and ${eyeColor || 'brown'} eyes. They are wearing a ${garmentName} and have a ${affect || 'neutral'} demeanor.`;
};

const formatBeliefs = (character: PlayerCharacter | NpcEntity): string => {
    if (!character.beliefs || character.beliefs.length === 0) {
        return "Their beliefs are not immediately obvious.";
    }
    const coreBeliefs = character.beliefs
        .slice(0, 3)
        .map(b => b.beliefId?.toLowerCase().replace(/_/g, ' ') || 'a certain way of thinking');
    return `They seem to believe in ${coreBeliefs.join(', ')}.`;
}



/**
 * NEW: Summarizes a conversation history into a single sentence for an NPC's memory.
 */
export async function summarizeConversation(history: DialogueEntry[]): Promise<{ summary: string; sentiment: 'positive' | 'negative' | 'neutral' }> {
    if (history.length <= 1) {
        return { summary: "We briefly exchanged pleasantries.", sentiment: 'neutral' };
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const conversationText = history.map(entry => `${entry.speaker}: ${entry.text}`).join('\n');

    const prompt = `
        You are an AI assistant. The following is a dialogue between an NPC and a player. 
        Summarize the key outcome of this conversation into a single, concise sentence from the NPC's perspective.
        Also, determine the overall sentiment of the player's interaction from the NPC's point of view.

        Focus on the most important takeaway for the NPC. Examples:
        - "The player asked me for directions to the old mill." (neutral)
        - "I warned the player about the dangers of the northern woods." (neutral)
        - "The player was kind and offered me a piece of bread." (positive)
        - "The player was rude and demanded I give them my goods." (negative)

        Conversation to summarize:
        ${conversationText}
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
                        summary: { type: Type.STRING, description: "A single, concise sentence summarizing the conversation from the NPC's perspective." },
                        sentiment: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'], description: "The player's sentiment from the NPC's perspective during the interaction." }
                    },
                    required: ["summary", "sentiment"]
                }
            }
        });
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && parsedData.summary && parsedData.sentiment) {
            return parsedData;
        }
        throw new Error("Invalid JSON structure from LLM for summary.");
    } catch (error) {
        console.error("Error summarizing conversation:", error);
        return { summary: "I had a conversation with the player.", sentiment: 'neutral' };
    }
}


/**
 * Generates encounter dialogue. Dispatches to specific animal/NPC handlers.
 * OVERHAULED to be deeply context-aware.
 */
export async function generateEncounterDialogue(
    target: EncounterableEntity,
    history: DialogueEntry[] | string[],
    playerInput: string,
    playerCharacter: PlayerCharacter | null,
    allNpcs: NpcEntity[],
    mapData: MapData | null,
    useRealLanguage: boolean,
    historyLensContext?: HistoryLensMessage[]
): Promise<{ text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean, tradeAvailable?: boolean }> {
    if (!playerCharacter || !mapData) return { text: "You feel a strange sense of detachment." };

    // Debug logging for time context
    console.log('[NPC Dialogue] Time context:', {
        timeOfDay: mapData.timeOfDay,
        dayOfYear: mapData.dayOfYear,
        hasTimeOfDay: 'timeOfDay' in mapData,
        mapDataKeys: Object.keys(mapData).filter(k => k.includes('time') || k.includes('Time'))
    });

    if (isAnimal(target)) {
        const animalReactions = [
            `The ${(target.speciesName || 'creature').toLowerCase()} watches you warily.`,
            `A low growl rumbles in the ${(target.speciesName || 'creature').toLowerCase()}'s chest.`,
            `The ${(target.speciesName || 'creature').toLowerCase()}'s sniffs the air, catching your scent.`,
            `It stands its ground, observing your every move.`
        ];
        return { text: animalReactions[Math.floor(Math.random() * animalReactions.length)] };
    }

    // It's an NPC. Generate a deeply contextual response.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Load tamed animals for context
    const tamedAnimals = loadTamedAnimals();
    
    // Create context about tamed animals
    const getTamedAnimalsContext = () => {
        if (tamedAnimals.length === 0) return '';
        
        const animalDescriptions = tamedAnimals.map(animal => {
            const animalData = ANIMAL_DATA[animal.baseId];
            const isDomestic = animalData?.type === 'Domestic';
            const isExotic = animalData?.type === 'exotic' || animalData?.type === 'mythical';
            const isPredator = animalData?.type === 'Predator';
            
            let remarkability = 'somewhat unusual';
            if (isDomestic) remarkability = 'not too noteworthy';
            if (isExotic) remarkability = 'VERY UNUSUAL and eye-catching';
            if (isPredator) remarkability = 'DANGEROUS and alarming';
            
            return `a tamed ${animal.speciesName} (${remarkability})`;
        }).join(', ');
        
        return `
        - The player has ${animalDescriptions} following them
     
        `;
    };
    
    // Handle both DialogueEntry[] and string[] formats
    let conversationHistoryText = '';
    let previousSummaries = '';
    
    if (Array.isArray(history) && history.length > 0) {
        if (typeof history[0] === 'string') {
            // These are conversation summaries
            previousSummaries = (history as string[]).map((s, i) => `- Previous conversation ${i + 1}: ${s}`).join('\n');
            conversationHistoryText = ''; // No current conversation yet
        } else {
            // These are dialogue entries from current conversation
            // Make speaker attribution VERY clear to avoid LLM confusion
            conversationHistoryText = (history as DialogueEntry[]).slice(-6).map(h => {
                if (h.speaker === 'system') {
                    // System messages about trades, events, etc.
                    return `[${h.text}]`;
                } else if (h.speaker === 'npc') {
                    return `YOU (${target.name}) SAID: "${h.text}"`;
                } else {
                    return `PLAYER (${playerCharacter?.name || 'Stranger'}) SAID: "${h.text}"`;
                }
            }).join('\n');
        }
    }
    
    // Get specific historical context for better NPC knowledge
    let historicalContext = '';
    let specificHistoricalEvents = [];
    try {
        const dateInfo = parseDateString(String(mapData.timeSlice));
        const culturalZone = mapLocationToCulture(mapData.localArea, dateInfo.year);

        // Create cache key from location and year
        const cacheKey = `${mapData.localArea}_${dateInfo.year}`;
        const now = Date.now();

        // Check cache first
        const cached = historicalEventCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            specificHistoricalEvents = [cached.event];
            console.log('[Historical Cache] Using cached event for', cacheKey);
        } else {
            // Generate new historical event only if not in cache
            const historicalEventsPrompt = `
                List 1 specific historical event or condition affecting ${mapData.localArea} in ${dateInfo.year}.
                Be specific and accurate and brief. It should be grounded in strict factual accuracy and realism.
            `;

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const eventResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: historicalEventsPrompt
                });
                const events = eventResponse.text.split('\n').filter(line => line.trim());
                if (events.length > 0) {
                    const event = events[0].replace(/^[-•*]\s*/, ''); // Remove bullet points
                    specificHistoricalEvents = [event];

                    // Cache the event
                    historicalEventCache.set(cacheKey, {
                        key: cacheKey,
                        event: event,
                        timestamp: now
                    });
                    console.log('[Historical Cache] Cached new event for', cacheKey);
                }
            } catch (err) {
                console.error('Failed to generate historical events:', err);
            }
        }
        
        // Also get primary sources for additional context
        await primarySourceService.preloadContext(dateInfo.era as HistoricalEra, culturalZone as CulturalZone);
        const relevantSources = await primarySourceService.getTemporallyRelevantSources(
            dateInfo.year - (target.age || 30), 
            2,
            dateInfo.era as HistoricalEra, 
            culturalZone as CulturalZone
        );
        
        if (specificHistoricalEvents.length > 0) {
            historicalContext = `
                **SPECIFIC CURRENT EVENT YOU KNOW ABOUT:**
                ${specificHistoricalEvents.join('\n                ')}
                
                Use this event in your dialogue when relevant.
            
            `;
        } else if (relevantSources.length > 0) {
            const themes = relevantSources.map(s => {
                const excerpt = s.excerpt.toLowerCase();
                if (excerpt.includes('war') || excerpt.includes('battle')) return 'ongoing conflicts';
                if (excerpt.includes('trade') || excerpt.includes('merchant')) return 'trade disruptions';
                if (excerpt.includes('plague') || excerpt.includes('disease')) return 'disease outbreaks';
                if (excerpt.includes('famine') || excerpt.includes('hunger')) return 'food shortages';
                return 'political tensions';
            });
            
            historicalContext = `**Known current events:** ${[...new Set(themes)].join(', ')}.\n                Reference these when discussing problems or news.`;
        }
    } catch (error) {
        console.error('Error fetching historical context:', error);
    }

    // Get appropriate historical language if enabled
    let languageInstruction = '';

    // Check if dialect continuum is enabled
    const dialectContinuumEnabled = dialectContinuumService.isEnabled();
    const dialectDistance = dialectContinuumService.getCurrentDistance();

    if (useRealLanguage || (dialectContinuumEnabled && dialectDistance > 0)) {
        const { getLanguageForCharacter } = await import('../constants/gameData/languages');
        const dateInfo = parseDateString(String(mapData.timeSlice));
        const historicalLanguage = getLanguageForCharacter(
            target.culturalZone,
            dateInfo.year,
            mapData.region,
            mapData.localArea,
            target.name,
            target.profession
        );

        if (dialectContinuumEnabled && dialectDistance > 0 && !useRealLanguage) {
            // Dialect continuum mode - mix languages based on distance
            languageInstruction = historicalLanguage
                ? dialectContinuumService.generateLLMPrompt(historicalLanguage.name, dialectDistance)
                : `**DIALECT CONTINUUM MODE**
                Mix English with historically appropriate language for ${mapData.timeSlice} ${mapData.localArea} at approximately ${dialectDistance}% foreign words.
                Randomly distribute foreign words throughout your response.
                Keep critical game information (items, directions) more in English.
                Use italics (*word*) to mark foreign words.`;
        } else if (useRealLanguage) {
            // Full native language mode
            languageInstruction = historicalLanguage
                ? `**LANGUAGE DIRECTIVE:**
                You MUST respond in ${historicalLanguage.name} (${historicalLanguage.nativeName || historicalLanguage.id}).
                ${historicalLanguage.llmPrompt || ''}

                **LINGUISTIC AUTHENTICITY RULES:**
                1. Use actual words and phrases from the target language - do NOT use modern versions
                2. For reconstructed/extinct languages, use approximations, but never switch to English
                3. Include appropriate honorifics, titles, and social markers
                4. Use a wide range of words, expressions, rhetorical tones, and styles, and be voluble and realistic
                5. Do NOT provide translations or explanations
                6. If the exact language is unknown, make your best scholarly approximation based on linguistic reconstruction
                7. NEVER default to English - always attempt the historical language

                YOUR RESPONSE MUST BE ENTIRELY IN ${historicalLanguage.name.toUpperCase()}.`
                : `**LANGUAGE:** Respond in historically appropriate language for ${mapData.timeSlice} ${mapData.localArea}.`;
        }
    } else {
        languageInstruction = `**Language:** Respond in modern English.`;
    }


    // Analyze player input for urgency and context
    const playerInputLower = playerInput.toLowerCase();
    const isEmergency = playerInputLower.includes('dying') || playerInputLower.includes('help') || 
                        playerInputLower.includes('sick') || playerInputLower.includes('ill') || 
                        playerInputLower.includes('disease') || playerInputLower.includes('hurt') ||
                        playerInputLower.includes('bleeding') || playerInputLower.includes('pain');
    
    const isAsking = playerInput.includes('?') || playerInputLower.includes('where') || 
                     playerInputLower.includes('what') || playerInputLower.includes('who') ||
                     playerInputLower.includes('how') || playerInputLower.includes('why') ||
                     playerInputLower.includes('can you') || playerInputLower.includes('do you');
    
    // Analyze conversation patterns
    const isConfused = playerInputLower.length < 15 && (playerInputLower.includes('what') || 
                       playerInputLower === 'huh' || playerInputLower === 'what?' || 
                       playerInputLower.includes('tell me') || playerInputLower.includes('explain'));
    
    const askedForMoreInfo = playerInputLower.includes('more') || playerInputLower.includes('else') ||
                             playerInputLower.includes('tell me') || playerInputLower.includes('go on') ||
                             playerInputLower.includes('continue') || playerInputLower.includes('details');
    
    // Track what topics have been mentioned
    const previousTopics = conversationHistoryText.toLowerCase();
    const hasDiscussedTopic = (topic: string) => previousTopics.includes(topic);

    // Get current weather for context - use real values from mapData if available
    const weatherContext = (() => {
        let currentWeather;

        // Prefer pre-calculated weather from mapData
        if (mapData.currentWeather) {
            currentWeather = mapData.currentWeather;
        } else {
            // Fallback: calculate weather using real values from mapData
            const weatherService = new WeatherService();
            currentWeather = weatherService.getWeather(
                mapData.climate || 'temperate',
                target.biome || 'grassland',
                mapData.season || 'spring',
                mapData.timeOfDay || 'Day',  // Now should have real value
                target.altitude || 0.5,
                mapData.dayOfYear || 180,     // Now should have real value
                { x: target.x, y: target.y }
            );
        }

        const temp = currentWeather.temperature;
        const conditions = [];

        // Temperature (one word)
        if (temp < 0) conditions.push('Freezing');
        else if (temp > 30) conditions.push('Very hot');
        else if (temp > 25) conditions.push('Warm');
        else if (temp < 10) conditions.push('Cold');

        // Precipitation (if any)
        if (currentWeather.precipitation && currentWeather.precipitation !== 'none') {
            conditions.push(currentWeather.precipitation);
        }

        // Special conditions (if notable)
        if (currentWeather.special === 'fog' || currentWeather.special === 'heatwave') {
            conditions.push(currentWeather.special);
        }

        return conditions.length > 0 ? conditions.join('. ') + '.' : 'Mild weather.';
    })();

    // Get atmospheric context (celestial phenomena) if there's something notable happening
    const atmosphericContext = (() => {
        try {
            const dateInfo = parseDateString(String(mapData.timeSlice));

            // Create game time state from mapData
            const gameTime = {
                timeOfDay: mapData.timeOfDay || 'Day',
                hours: mapData.timeOfDay === 'Night' ? 23 : mapData.timeOfDay === 'Dawn' ? 6 :
                       mapData.timeOfDay === 'Dusk' ? 18 : 12,
                minutes: 0,
                totalMinutes: (mapData.timeOfDay === 'Night' ? 23 : mapData.timeOfDay === 'Dawn' ? 6 :
                              mapData.timeOfDay === 'Dusk' ? 18 : 12) * 60
            };

            const gameDate = {
                year: dateInfo.year,
                month: dateInfo.month,
                day: dateInfo.day
            };

            // Use current weather from above
            const weatherForAtmosphere = {
                condition: mapData.currentWeather?.condition || 'clear',
                cloudCover: mapData.currentWeather?.cloudCover || 0.3,
                isRaining: mapData.currentWeather?.precipitation === 'rain',
                isSnowing: mapData.currentWeather?.precipitation === 'snow',
                temperature: mapData.currentWeather?.temperature || 20
            };

            const context = atmosphericContextService.getContext(gameTime, gameDate, weatherForAtmosphere);
            const promptAdditions = atmosphericContextService.getNpcPromptAdditions(context);

            // Only return atmospheric context if there's actually something notable happening
            return promptAdditions.trim() ? promptAdditions : '';
        } catch (error) {
            console.error('Error getting atmospheric context:', error);
            return '';
        }
    })();

    // Determine personality-driven response style
    const personalityStyle = (() => {
        const npc = target as NpcEntity;
        const courage = npc.personality?.courage || 5;
        const compassion = npc.personality?.compassion || 5;
        const greed = npc.personality?.greed || 5;
        
        let style = [];
        if (courage < 3) style.push('fearful and cautious about dangers');
        if (courage > 7) style.push('bold and direct in speech');
        if (compassion > 7) style.push('concerned for others\' wellbeing');
        if (compassion < 3) style.push('dismissive of others\' problems');
        if (greed > 7) style.push('always considering profit and loss');
        
        return style.length > 0 ? `Your personality traits: ${style.join(', ')}` : '';
    })();
    
    // Check if this is a special map NPC with enhanced context
    const specialMapContext = (target as any).specialMapContext;
    const isSpecialMapNpc = !!specialMapContext;
    
    const getSpecialMapIntroduction = () => {
        if (!isSpecialMapNpc) return '';
        
        return `
        **SPECIAL LOCATION CONTEXT:**
        You are currently inside: ${specialMapContext.displayName}
        Building Type: ${specialMapContext.archetype}
        Location: ${specialMapContext.location}, ${specialMapContext.mapArea}
        Your Role: ${specialMapContext.roleContext}
        
        **YOUR DUTIES AND RESPONSIBILITIES:**
        ${specialMapContext.specialInstructions}
        
        **LOCATION AWARENESS:**
        - You know this building's layout, rules, and customs intimately
        - You understand proper protocols for different types of visitors
        - You're aware of who belongs here and who requires challenge/assistance
        - You understand the power dynamics and social expectations of this place
        - This is your workplace/domain - act accordingly with appropriate authority or deference
        
        `;
    };

    // Get work offers for this NPC (both active and completed)
    const npcWorkOffers = isNpc(target) ? getWorkOffersForNpc(target.id) : [];
    const activeWorkOffers = npcWorkOffers.filter(o => o.accepted && !o.completed && !o.failed);
    const completedWorkOffers = npcWorkOffers.filter(o => o.completed);

    const workOfferContext = (() => {
        if (npcWorkOffers.length === 0) return '';

        let context = '\n**WORK YOU ASSIGNED TO THIS PLAYER:**\n';

        if (activeWorkOffers.length > 0) {
            context += '\nOUTSTANDING WORK ORDERS (Remember these!):\n';
            activeWorkOffers.forEach(offer => {
                const progress = offer.requiredItem ?
                    `needs ${offer.requiredQuantity || 1}x ${offer.requiredItem}` :
                    offer.targetAnimal ?
                    `needs to kill ${offer.requiredQuantity || 1}x ${offer.targetAnimal}` :
                    `needs to ${offer.description}`;
                context += `- "${offer.description}" (${progress})\n`;
                context += `  Payment promised: ${offer.payment} coins\n`;
            });
            context += '\nIMPORTANT: You should remember you asked them to do this work! Reference it naturally if relevant.\n';
        }

        if (completedWorkOffers.length > 0) {
            context += '\nWORK THEY COMPLETED FOR YOU:\n';
            completedWorkOffers.forEach(offer => {
                context += `- Completed: "${offer.description}" - You paid them ${offer.payment} coins\n`;
            });
            context += 'Remember: They already did this work and you paid them.\n';
        }

        return context;
    })();

    // Analyze social dynamics based on player appearance
    const socialDynamicsAnalysis = (() => {
        const playerAge = playerCharacter.age || 25;
        const playerGender = playerCharacter.gender || 'unknown';
        const playerClass = playerCharacter.socialClass || 'commoner';
        const playerRep = playerCharacter.mapReputation || 0;
        const garmentName = playerCharacter.appearance?.garment?.name || 'common_clothes';
        const isArmed = !!playerCharacter.equippedItems?.weapon;

        // Determine player's apparent social status
        const highStatusClothes = ['crown', 'noble', 'silk', 'fine', 'ornate', 'royal', 'gold', 'jewel'];
        const hasHighStatusAppearance = highStatusClothes.some(term =>
            garmentName.toLowerCase().includes(term) || playerClass.includes('noble') || playerClass.includes('royal'));

        const lowStatusClothes = ['rags', 'torn', 'dirty', 'rough', 'simple', 'peasant', 'poor'];
        const hasLowStatusAppearance = lowStatusClothes.some(term =>
            garmentName.toLowerCase().includes(term) || playerClass.includes('peasant') || playerClass.includes('slave'));

        // Build social reaction context
        let reaction = [];

        // Age and gender reactions
        if (playerAge > 60 && playerGender === 'female') {
            reaction.push('elderly woman - likely to evoke sympathy and offers of aid');
        } else if (playerAge > 60 && playerGender === 'male') {
            reaction.push('elderly man - treated with basic respect but some wariness');
        } else if (playerAge < 20 && playerGender === 'male' && isArmed) {
            reaction.push('young armed male - potential threat, likely to provoke wariness');
        } else if (playerAge < 20 && playerGender === 'female') {
            reaction.push('young woman - may evoke protective instincts or suspicion depending on context');
        }

        // Status reactions
        if (hasHighStatusAppearance) {
            reaction.push('noble/wealthy appearance - deference expected, but also opportunism');
        } else if (hasLowStatusAppearance) {
            reaction.push('poor appearance - likely to be dismissed, shooed away, or treated with suspicion');
        }

        // Reputation impact
        if (playerRep < -50) {
            reaction.push('known troublemaker - immediate hostility or fear');
        } else if (playerRep > 50) {
            reaction.push('good reputation - more trusting initial response');
        }

        if (isArmed && !hasHighStatusAppearance) {
            reaction.push('visibly armed commoner - suspicious, potential bandit or mercenary');
        }

        return reaction.length > 0 ? reaction.join('; ') : 'neutral appearance - standard cautious interaction';
    })();

    // Educational mode enhancement
    const educationalEnhancement = (() => {
        // Check if educational mode is active
        if (!learningObjectivesService.isEducationalMode()) return '';

        const objectives = learningObjectivesService.getCurrentObjectives();
        const settings = learningObjectivesService.getSettings();

        if (!settings) return '';

        const objectiveDescriptions = objectives.map(obj => {
            const config = learningObjectivesService.getObjectiveConfig(obj);
            return config ? `- ${config.name}: ${config.description}` : '';
        }).filter(Boolean).join('\n    ');

        const intensityPrompts = {
            'forgiving': 'Gently weave in educational content. Be natural and conversational.',
            'realistic': 'Challenge the player to think historically while maintaining realism.',
            'hardcore': 'Deeply engage with historical analysis. Push the player to demonstrate understanding.'
        };

        return `
**🎓 EDUCATIONAL MODE ACTIVE**

**Learning Objectives for this Session:**
${objectiveDescriptions}

**Your Educational Role:**
${intensityPrompts[settings.difficulty] || intensityPrompts['realistic']}

**Specific Educational Behaviors:**

1. **Historical Context Integration**
   - Reference specific events affecting ${mapData.localArea} in ${mapData.timeSlice}
   - Mention real political situations, trade conditions, or social tensions
   - Example: Don't just say "times are hard" - specify WHY (war taxes, crop failure, plague, etc.)

2. **Socratic Questioning**
   - When appropriate, ask the player what THEY think about situations
   - "What do you make of the new land policies?"
   - "How would your life differ if you were born a peasant instead?"
   - "What do you think caused this conflict?"

3. **Multiple Perspectives**
   - Acknowledge that different social classes have different views
   - "The nobles say one thing, but we commoners know another..."
   - "As a ${target.profession}, I see it differently than a ${playerCharacter.profession} would"

4. **Primary Source Hints**
   - Reference documents, artifacts, or oral traditions when relevant
   - "I've heard the merchants read from official proclamations..."
   - "The old scrolls in the monastery mention..."

5. **Causal Analysis**
   - Explain WHY things are the way they are historically
   - Connect current situations to historical causes
   - "Ever since the king raised taxes for the war..."

**IMPORTANT BALANCE:**
- Stay IN CHARACTER - don't break immersion
- Be natural - this should feel like conversation, not a lecture
- Only include educational elements when contextually appropriate
- Maintain historical authenticity above all else

**Response Guidelines:**
- Include 1-2 historically specific details per response
- Ask a thought-provoking question every 2-3 exchanges
- Reference social structures or power dynamics when relevant

`;
    })();

    // CRITICAL: If NPC is hostile, this MUST override everything else
    const hostileOverride = (target as any).hostileModifier ? (
        console.log(`[LLM Service] 🔥🔥🔥 HOSTILE OVERRIDE AT TOP OF PROMPT: ${(target as any).hostileModifier.substring(0, 100)}...`),
        `
🚨🚨🚨 CRITICAL OVERRIDE - READ THIS FIRST 🚨🚨🚨

${(target as any).hostileModifier}

THIS OVERRIDES ALL OTHER INSTRUCTIONS BELOW. You are FURIOUS and ATTACKING right now.
Your response MUST reflect extreme anger. YELL at them. Use ALL CAPS.
Demand to know why they attacked you. Threaten them with violence or calling for help.
DO NOT give a calm greeting. DO NOT be friendly. BE ENRAGED.

`
    ) : (console.log('[LLM Service] ℹ️ No hostile override - normal dialogue'), '');

    // CRITICAL: If NPC witnessed violence, they should react with fear/anger
    const witnessOverride = isNpc(target) ? generateWitnessReactionModifier(target, playerCharacter.name) : '';
    if (witnessOverride) {
        console.log(`[LLM Service] 👁️👁️👁️ WITNESS OVERRIDE: ${target.name} witnessed violent event`);
    }

    const prompt = `
        ${hostileOverride}
        ${witnessOverride}
        ${educationalEnhancement}
        CONTEXT: ${mapData.localArea}, Year ${mapData.timeSlice}
        ROLE: ${target.name}, ${target.age}yo ${target.role}
        ${getSpecialMapIntroduction()}

        **IMMEDIATE ASSESSMENT OF STRANGER:**
        You see: ${playerCharacter.name} (${playerCharacter.age}yo ${playerCharacter.gender})
        Clothing: ${playerCharacter.appearance?.garment?.name || 'common clothes'}
        ${playerCharacter.equippedItems?.weapon ? `Armed with: ${playerCharacter.equippedItems.weapon.name}` : 'Unarmed'}
        Social dynamics: ${socialDynamicsAnalysis}
        PLAYER JUST SAID TO YOU: "${playerInput}"

        **YOUR MINDSET:**
        - Personality: ${personalityStyle}
        - Current concern: ${target.personalGoal?.description || 'Getting through the day'}
        - Health: ${target.health?.currentDiseases?.length > 0 ? `Sick with ${target.health.currentDiseases[0].disease.name}` : 'Healthy'}
        - Wealth: ${target.wealthLevel || 'modest'}
        ${previousSummaries ? `- Previous meeting: ${previousSummaries}` : '- First encounter with this person'}
        ${(() => {
            // Add witness context if NPC has witnessed player events
            if (isNpc(target)) {
                const witnessContext = generateWitnessContextForLLM(target, playerCharacter.name);
                return witnessContext ? `- What you witnessed: ${witnessContext}` : '';
            }
            return '';
        })()}
        ${workOfferContext}
        ${(() => {
            // Add pickup history context if NPC has picked up items recently
            if (isNpc(target) && target.pickupHistory && target.pickupHistory.length > 0) {
                const recentPickups = target.pickupHistory.slice(-3); // Last 3 items picked up
                const pickupList = recentPickups.map(pickup => {
                    const timeAgo = Date.now() - pickup.timestamp;
                    const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
                    const timeDesc = hoursAgo < 1 ? 'just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : 'recently';
                    return `${pickup.item.name} (found ${timeDesc})`;
                }).join(', ');

                return `\n**ITEMS YOU FOUND RECENTLY:**\nYou picked up: ${pickupList}\n- You might mention these items if relevant to conversation\n- You can offer to trade them if player seems interested\n- Be curious or excited about unusual finds\n`;
            }
            return '';
        })()}

        **CURRENT CONDITIONS:**
        Time: ${mapData.timeOfDay || 'Day'}
        Weather: ${weatherContext}
        ${atmosphericContext}
        ${historicalContext}

        **TIME-AWARE BEHAVIOR:**
        ${mapData.timeOfDay === 'Night' || mapData.timeOfDay === 'Dawn' ?
            '- It is NIGHTTIME/DAWN. People are suspicious of strangers at this hour. "What are you doing out at this hour?" might be a natural response, or perhaps it isnt mentioned, it depends on context.' : ''}
        ${mapData.timeOfDay === 'Night' ?
            '- .' : ''}
        ${mapData.timeOfDay === 'Dawn' ?
            '- ' : ''}
        ${mapData.timeOfDay === 'Midday' ?
            '- ' : ''}
        ${mapData.timeOfDay === 'Dusk' ?
            '- Sun is setting. People are finishing work, heading home.' : ''}

        ${historyLensContext && historyLensContext.length > 0 ? `
        **RECENT EVENTS (What just happened before this conversation):**
        ${historyLensContext.map(msg => {
            if (msg.sender === 'narrator') return `- ${msg.text.slice(0, 200)}${msg.text.length > 200 ? '...' : ''}`;
            if (msg.sender === 'player') return `- Player action: ${msg.text.slice(0, 100)}`;
            return '';
        }).filter(Boolean).join('\n        ')}

        Use this context to make the conversation feel continuous. The NPC might reference recent events if relevant.
        ` : ''}

        **CRITICAL REALISM RULES:**
        1. You are a REAL PERSON in ${mapData.timeSlice}, not a fantasy character
        2. Speak plainly - avoid flowery or "spiritual" language
        3. NO GENERIC CLICHES
        4. React based on PRACTICAL CONCERNS: property, safety, reputation, profit, curiosity, desire, humor, love
        5. Your first reaction may often be about immediate social dynamics (stranger danger, class differences, etc.) - or you might be humorous or kind or ask the player about something you care about - it all depends on your personality.
        6. BE AWARE OF CONTEXT and remember who has said what
        7. HAVE AN INNER LIFE: an npc might act friendly but be trying to rob the player. They might be in a bad mood because their father is sick. They might be having the best day of their life. And so on.
        8. STAY IN CHARACTER: You are ${target.name}, not the player. Don't mix up who owns what or who said what.

        **DIALOGUE PROGRESSION:**
        Exchange #${conversationHistoryText ? conversationHistoryText.split('\n').length + 1 : 1}
        ${isConfused ? '- Player confused: Use simpler words, be more direct' : ''}
        ${askedForMoreInfo ? '- Player wants details: Add specific new information' : ''}
        ${conversationHistoryText ? '- Continue conversation: Build on previous exchange, dont repeat' : '- First exchange: Establish your immediate reaction to this stranger'}

        **YOUR RESPONSE:**
        - 1-4 lines of REALISTIC dialogue for a ${target.role} in ${mapData.timeSlice}. Do not use quotation marks. 
        - If youre a farmer, talk like a farmer. If nobility, show appropriate bearing
        - Remember: Most people in history were wary of strangers, protective of property, and concerned with survival
        - NO mystical language unless specifically discussing religious/spiritual topics, or if you think NPC would be spiritual/religious
        - Be specific about local concerns
        **HISTORICAL ACCURACY:**
        Year ${mapData.timeSlice}: Only reference things that exist in this year.
        ${parseInt(mapData.timeSlice) < 1492 && (mapData.localArea.includes('America')) ?
            'Pre-Columbian Americas: NO knowledge of Europe/Africa/Asia' : ''}

        **CONVERSATION HISTORY:**
        ${conversationHistoryText || 'First meeting'}
        ${conversationHistoryText ? 'IMPORTANT: "YOU SAID" = what you ('+target.name+') said before. "PLAYER SAID" = what '+playerCharacter.name+' said.' : ''}
        ${conversationHistoryText && conversationHistoryText.includes('[TRADE:') ? 'NOTE: [TRADE: ...] indicates items that were just traded between you. Reference this transaction if relevant.' : ''}
        ${target.memory?.knownFactsAboutPlayer?.has('ATTACKED_BY_PLAYER') ? '⚠️ This player attacked you before!' : ''}

        ${languageInstruction}

        **CONVERSATION DYNAMICS & LEAVING:**
        - After 4-5 exchanges, consider naturally ending the conversation
        - If urgent danger, skip pleasantries entirely
        - Build on previous exchanges, never repeat information
        - **IMPORTANT: If the player is being threatening, offensive, scary, or making you uncomfortable:**
          • Express that you want to leave (e.g., "I need to go", "I should leave", "Farewell")
          • Scared NPCs: "I... I must go!" or "Please, leave me alone!"
          • Offended NPCs: "I won't stand for this. Good day!" or "How dare you! I'm leaving!"
          • Guards may give warnings instead of leaving
        - **End the conversation if:**
          • Player is hostile or threatening (reputation would be -50 or worse)
          • You're frightened by their behavior or appearance
          • They've offended you deeply
          • The conversation has reached a natural end

        ${target.diseaseModifier ? `**DISEASE AWARENESS:**\n        ${target.diseaseModifier}` : ''}

        ${(target as any).workOfferContext ? `**WORK AVAILABILITY:**\n        ${(target as any).workOfferContext}` : ''}

        **REMEMBER YOUR IDENTITY:**
        You are ${target.name} (the ${target.role})
        You are talking to ${playerCharacter.name} (the player/stranger)
        When reviewing conversation history, "YOU SAID" means what ${target.name} said.
    `;

    // Add reputation analysis to prompt
    const reputationPrompt = `
        ${prompt}

        **REPUTATION IMPACT & LEAVING DECISION:**
        Based on this interaction, determine reputation change:
        - Threatening/hostile = -50 to -100 (YOU SHOULD LEAVE OR CALL FOR HELP)
        - Offensive/scary = -10 to -50 (EXPRESS THAT YOU WANT TO LEAVE)
        - Absurd/nonsensical/insane statements (like "I am a dolphin", "I am god", etc.) = -20 to -40 (BE CONFUSED/CONCERNED)
        - Suspicious/unwelcome = -5 to -10
        - Normal conversation = 0
        - Helpful/kind = +5 to +20

        **IMPORTANT: If player says something completely absurd or impossible:**
        - React with confusion, concern, or suspicion
        - Consider them potentially insane or dangerous
        - Reduce reputation by at least -20

        **LEAVING INSTRUCTIONS:**
        - If reputation is -50 or worse: Include farewell/leaving phrase in your dialogue
        - If scared (courage < 5 and player threatening): Say you need to leave
        - If offended (player insulting/rude): Express offense and leave
        - Use phrases like: "I must go", "Farewell", "Good day to you", "I'm leaving"

        ${target.profession?.toLowerCase().includes('guard') ?
            'GUARD: Give ONE warning before attacking defiant intruders. You dont leave, you stand your ground.' : ''}

        FORMAT (5 lines exactly):
        DIALOGUE: [1-4 sentences of realistic dialogue]
        REPUTATION: [increase/decrease/none]
        AMOUNT: [0-100]
        TRADE: [yes/no - YES if you're willing to trade/sell/buy items with player]
        ACTION: [talk/leave/attack - 'talk' to continue conversation, 'leave' if you want to end it and walk away, 'attack' if you're enraged enough to fight]
    `;
    
    try {
        // Use flash-lite with delimiter format for speed
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash-lite-preview-09-2025', 
            contents: reputationPrompt,
            config: {
                temperature: 0.6,
                topP: 0.95
            }
        });
        
        // Parse the delimiter-based response
        const responseText = response.text.trim();
        console.log('[NPC Dialogue] Raw response:', responseText);
        
        let dialogueText = '';
        let reputationChange = 0;
        let tradeMatch = null;
        let actionMatch = null;

        try {
            // Extract dialogue
            const dialogueMatch = responseText.match(/DIALOGUE:\s*(.+?)(?:\n|REPUTATION:|$)/si);
            dialogueText = dialogueMatch?.[1]?.trim() || responseText;

            // Extract reputation change
            const reputationMatch = responseText.match(/REPUTATION:\s*([^\n]+)/i);
            const amountMatch = responseText.match(/AMOUNT:\s*(-?\d+)/i);
            tradeMatch = responseText.match(/TRADE:\s*([^\n]+)/i);

            if (reputationMatch && amountMatch) {
                const reputationType = reputationMatch[1].toLowerCase().trim();
                const amount = parseInt(amountMatch[1]) || 0;

                // Handle various reputation descriptors
                const negativeTypes = ['suspicious', 'hostile', 'angry', 'annoyed', 'decrease', 'negative', 'wary', 'distrustful'];
                const positiveTypes = ['friendly', 'increase', 'positive', 'grateful', 'thankful', 'appreciative', 'pleased'];
                const neutralTypes = ['none', 'neutral', 'unchanged', '0'];

                // Check if reputation itself is a negative number (e.g., "-75")
                const reputationIsNegativeNumber = reputationType.startsWith('-') || parseInt(reputationType) < 0;

                if (reputationIsNegativeNumber || negativeTypes.some(type => reputationType.includes(type))) {
                    // For negative, ensure the amount is negative
                    reputationChange = amount > 0 ? -Math.min(amount, 100) : Math.max(amount, -100);
                } else if (positiveTypes.some(type => reputationType.includes(type))) {
                    // For positive, ensure amount is positive
                    reputationChange = Math.min(Math.abs(amount), 20); // Cap positive at 20
                } else if (!neutralTypes.some(type => reputationType.includes(type))) {
                    // If not neutral but unrecognized, use the raw amount
                    reputationChange = amount;
                }
            }
            
            // Extract ACTION field
            actionMatch = responseText.match(/ACTION:\s*([^\n]+)/i);

            // Clean up dialogue text - remove any stray format markers
            dialogueText = dialogueText
                .replace(/REPUTATION:.*/i, '')
                .replace(/AMOUNT:.*/i, '')
                .replace(/TRADE:.*/i, '')
                .replace(/ACTION:.*/i, '')
                .replace(/```.*?```/gs, '')
                .trim();
        } catch (parseError) {
            // Fallback if parsing fails
            console.warn('Failed to parse LLM response, using fallback');
            dialogueText = responseText.replace(/DIALOGUE:|REPUTATION:|AMOUNT:/gi, '').trim();
            
            // Use basic text analysis for reputation as fallback
            const lowerText = dialogueText.toLowerCase();
            if (lowerText.includes('guards!') || lowerText.includes('authorities') || 
                lowerText.includes('arrest') || lowerText.includes('treason')) {
                reputationChange = -100;
            } else if (lowerText.includes('attack') || lowerText.includes('kill you')) {
                reputationChange = -50;  
            } else if (lowerText.includes('leave') || lowerText.includes('go away')) {
                reputationChange = -10;
            } else if (lowerText.includes('thank you') || lowerText.includes('grateful')) {
                reputationChange = 10;
            }
        }
        
        // Process the parsed response
        const npcText = dialogueText;
        
        // Check if NPC wants to leave naturally based on their dialogue
        const farewellPhrases = [
            'farewell', 'goodbye', 'good day', 'good night', 'good evening',
            'must go', 'need to leave', 'have to go', 'should be going', 
            'take my leave', 'until next time', 'be on my way', 'duties call',
            'work to do', 'must return', 'time for me to', 'excuse me',
            'been pleasant', 'nice talking', 'see you around', 'take care',
            'safe travels', 'best be off', 'should get back', 'need to get back'
        ];
        
        const wantsToLeaveNaturally = farewellPhrases.some(phrase => 
            npcText.toLowerCase().includes(phrase)
        );
        
        // Log when NPC wants to leave naturally
        if (wantsToLeaveNaturally) {
            console.log(`[NPC Dialogue] ${target.name} wants to leave naturally. Dialogue: "${npcText}"`);
        }

        // Check if NPC is offering to trade - first check LLM flag, then keywords
        let tradeAvailable = false;

        // First, check if LLM explicitly said TRADE: yes
        if (tradeMatch) {
            const tradeResponse = tradeMatch[1].toLowerCase().trim();
            tradeAvailable = tradeResponse === 'yes' || tradeResponse === 'true' || tradeResponse === '1';
            console.log(`[NPC Dialogue] LLM trade flag detected: "${tradeResponse}" -> trade available: ${tradeAvailable}`);

            // If LLM explicitly said no, ensure trade stays disabled
            if (tradeResponse === 'no' || tradeResponse === 'false' || tradeResponse === '0') {
                console.log(`[NPC Dialogue] LLM explicitly disabled trade with: "${tradeResponse}"`);
            }
        } else {
            console.log(`[NPC Dialogue] No explicit trade flag from LLM in response`);
        }

        // Only use keyword detection if LLM didn't provide ANY trade flag
        // AND only for very explicit trade offers
        if (!tradeMatch && !tradeAvailable) {
            const explicitTradePhrases = [
                'i\'ll sell you', 'i can sell you', 'would you like to buy',
                'for sale', 'i have goods for sale', 'care to trade',
                'shall we trade', 'let\'s trade', 'ready to trade',
                'what would you like to buy', 'see my wares'
            ];

            // Only activate trade if NPC explicitly offers AND isn't hostile
            tradeAvailable = explicitTradePhrases.some(phrase =>
                npcText.toLowerCase().includes(phrase)
            ) && reputationChange >= 0; // Must be at least neutral

            if (tradeAvailable) {
                console.log(`[NPC Dialogue] Trade detected via explicit keywords in: "${npcText}"`);
            }
        }

        if (tradeAvailable) {
            console.log(`[NPC Dialogue] ${target.name} is offering to trade. Dialogue: "${npcText}"`);
        }

        // Parse ACTION field from LLM response
        let shouldLeave = false;
        let shouldAttack = false;

        if (actionMatch) {
            const action = actionMatch[1].toLowerCase().trim();
            console.log(`[NPC Dialogue] ACTION field detected: "${action}"`);

            if (action === 'attack') {
                shouldAttack = true;
                console.log('[NPC Dialogue] NPC explicitly wants to attack (from ACTION field)');
            } else if (action === 'leave') {
                shouldLeave = true;
                console.log('[NPC Dialogue] NPC explicitly wants to leave (from ACTION field)');
            }
        }

        // Fallback logic if no ACTION field was provided
        if (!actionMatch) {
            // Determine additional flags based on reputation change and NPC type
            const shouldCallAuthorities = reputationChange <= -100;
            shouldLeave = shouldCallAuthorities || reputationChange <= -70 || wantsToLeaveNaturally;

            // Guards should attack if player is defiant/threatening and they're a guard
            // Check both the reputation change and if this is a guard or soldier
            const isGuardOrSoldier = target.profession?.toLowerCase().includes('guard') ||
                                     target.profession?.toLowerCase().includes('soldier') ||
                                     target.profession?.toLowerCase().includes('warrior') ||
                                     target.profession?.toLowerCase().includes('knight');

            // Guards attack if: player is threatening AND they're a guard type
            // OR if player has been warned multiple times (history > 4 exchanges with negative reputation)
            const previousWarnings = Array.isArray(history) && history.length > 0 && typeof history[0] !== 'string' ?
                (history as DialogueEntry[]).filter(h =>
                    h.speaker === 'npc' &&
                    (h.text.toLowerCase().includes('leave') ||
                     h.text.toLowerCase().includes('stop') ||
                     h.text.toLowerCase().includes('warning'))
                ).length : 0;

            shouldAttack = isGuardOrSoldier && (
                (reputationChange <= -50 && !shouldCallAuthorities) || // Threatening but not authority-calling level
                (previousWarnings >= 2 && reputationChange < 0) || // Multiple warnings ignored
                (playerInput.toLowerCase().includes('make me') ||
                 playerInput.toLowerCase().includes('never') ||
                 playerInput.toLowerCase().includes('fight me') ||
                 playerInput.toLowerCase().includes('try and stop me'))
            );
        }

        const shouldCallAuthorities = reputationChange <= -100;
        const isGuardOrSoldier = target.profession?.toLowerCase().includes('guard') ||
                                 target.profession?.toLowerCase().includes('soldier') ||
                                 target.profession?.toLowerCase().includes('warrior') ||
                                 target.profession?.toLowerCase().includes('knight');
        const previousWarnings = Array.isArray(history) && history.length > 0 && typeof history[0] !== 'string' ?
            (history as DialogueEntry[]).filter(h =>
                h.speaker === 'npc' &&
                (h.text.toLowerCase().includes('leave') ||
                 h.text.toLowerCase().includes('stop') ||
                 h.text.toLowerCase().includes('warning'))
            ).length : 0;
        
        // Debug logging for guard behavior
        if (isGuardOrSoldier) {
            console.log(`[GUARD ANALYSIS] ${target.name} (${target.profession}):
                - Reputation Change: ${reputationChange}
                - Previous Warnings: ${previousWarnings}
                - Should Attack: ${shouldAttack}
                - Should Call Authorities: ${shouldCallAuthorities}
                - Player Input: "${playerInput}"`);
        }
        
        console.log(`[NPC Dialogue] Final dialogue: "${npcText}", Reputation change: ${reputationChange}`);

        // Generate translations for foreign words if dialect continuum is active
        let translations: Record<string, string> | undefined;
        let language: string | undefined;

        if (dialectContinuumEnabled && dialectDistance > 0) {
            const foreignWords = Array.from(dialectContinuumService.extractUniqueForeignWords(npcText));

            if (foreignWords.length > 0) {
                // Get the language name
                const { getLanguageForCharacter } = await import('../constants/gameData/languages');
                const dateInfo = parseDateString(String(mapData.timeSlice));
                const historicalLanguage = getLanguageForCharacter(
                    target.culturalZone,
                    dateInfo.year,
                    mapData.region,
                    mapData.localArea,
                    target.name,
                    target.profession
                );

                if (historicalLanguage) {
                    language = historicalLanguage.name;

                    // Translate foreign words WITH CONTEXT
                    try {
                        translations = await translateForeignWords(
                            foreignWords,
                            historicalLanguage.name,
                            npcText  // Pass full dialogue for context
                        );
                        console.log(`[Dialect Continuum] Translated ${foreignWords.length} words:`, translations);
                    } catch (error) {
                        console.error('[Dialect Continuum] Translation failed:', error);
                    }
                }
            }
        }

        return {
            text: npcText,
            reputationChange: reputationChange !== 0 ? reputationChange : undefined,
            shouldLeave,
            shouldAttack,
            shouldCallAuthorities,
            tradeAvailable,
            translations,
            language
        };
    } catch (error) {
        console.error("Error generating NPC dialogue:", error);
        return { text: "..." };
    }
}


/**
 * Generates item lists for containers using the Gemini LLM.
 */
export async function generateLlmContents(entity: InteriorEntity, mapData: InteriorMapData, date: string, location: string): Promise<Item[]> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = `You are an expert, historically-accurate world-building assistant for an educational history simulation game. Your task is to generate a plausible list of items found inside a container. Be creative and specific to the context. Context: Location: A ${mapData.buildingType} in a place culturally similar to ${location}. Year: Approximately ${date}. Container: A ${entity.subType}. Based on this context, what specific items might be found inside? Infer a plausible story or profession for the owner if it adds flavor. Please provide the response as a JSON array of 2 to 4 objects, where each object has these keys: "name" (string), "description" (string), "emoji" (string, one character), "rarity" (string, "Common" or "Rare"), "value" (number), "weight" (number), "attack" (number, usually 0), "wearable" (boolean), "stackable" (boolean), "sustenance" (number, usually 0 if not food), "wieldable" (boolean), "throwable" (boolean), "craftingValue" (number, 1-10), "category" (string, one of: 'Tool', 'Weapon', 'Material', 'Apparel', 'Food', 'Special', 'Document').`;

    const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-lite', 
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData) && parsedData.every(item => typeof item.name === 'string')) {
        let itemIdCounter = Date.now();
        // Coerce the response into the Item[] type
        return parsedData.map((item: any, index: number): Item => ({
            id: `llm-item-${itemIdCounter + index}`,
            baseId: item.name.toUpperCase().replace(/\s/g, '_'),
            name: item.name || 'Mysterious Object',
            description: item.description || 'An object of unknown origin.',
            emoji: item.emoji || '❓',
            rarity: item.rarity || 'Common',
            value: item.value || 0,
            weight: item.weight || 0.1,
            attack: item.attack || 0,
            wearable: item.wearable || false,
            stackable: item.stackable || false,
            quantity: 1,
            sustenance: item.sustenance || 0,
            wieldable: item.wieldable || false,
            throwable: item.throwable || false,
            craftingValue: item.craftingValue || 1,
            category: item.category || 'Special',
        }));
    }
    throw new Error("LLM response was not a valid item array.");
}

/**
 * Generates a descriptive, Dungeon Master-style response to a player's action.
 * OVERHAULED with dynamic narrator persona.
 */
export async function generateDmResponse(playerQuery: string, context: PlayerContext): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const { playerCharacter, mapData, npcs, animals, terrainStructures, playerX, playerY, viewMode, interiorContext, currentVessel } = context;

    // Check if educational mode is active
    const isEducationalMode = learningObjectivesService.isEducationalMode();

    // Load tamed animals for accurate context
    const tamedAnimals = loadTamedAnimals();

    // Build rich context string
    const nearbyNpcs = npcs?.filter(n => Math.hypot(n.x - playerX!, n.y - playerY!) < 10)
                           .map(n => `${n.name} (${n.role})`)
                           .join(', ') || 'none';
    const nearbyAnimals = animals?.filter(a => Math.hypot(a.x - playerX!, a.y - playerY!) < 10)
                                .map(a => a.speciesName)
                                .join(', ') || 'none';
    const nearbyStructures = terrainStructures?.filter(s => Math.hypot(s.location[0] - playerX!, s.location[1] - playerY!) < 10)
                                        .map(s => s.name)
                                        .join(', ') || 'none';

    // Build tamed animals context
    const tamedAnimalsContext = tamedAnimals.length > 0
        ? `The player has ${tamedAnimals.length} tamed animal${tamedAnimals.length > 1 ? 's' : ''} following them: ${
            tamedAnimals.map(a => {
                const animalData = ANIMAL_DATA[a.baseId];
                const healthStatus = a.health < 5 ? ' (looking weak)' : a.health > 8 ? ' (healthy)' : '';
                return `${a.speciesName}${healthStatus}`;
            }).join(', ')
        }.`
        : '';

    // Build vessel context
    const vesselContext = currentVessel
        ? `The player is currently aboard their ${currentVessel.name.toLowerCase()}, navigating the waters. ${tamedAnimals.length > 0 ? `Their tamed companion(s) ${tamedAnimals.map(a => a.speciesName).join(', ')} ${tamedAnimals.length > 1 ? 'are' : 'is'} also on the vessel with them.` : ''}`
        : '';

    // Build location context based on view mode
    let locationContext = '';
    if (viewMode === 'interior' && interiorContext) {
        locationContext = `The player is currently inside a ${interiorContext.buildingName || interiorContext.buildingType}, specifically in the ${interiorContext.currentSpace || 'main area'}. This is a ${interiorContext.layoutName || 'traditional'} layout${interiorContext.religion ? ` associated with ${interiorContext.religion}` : ''}${interiorContext.culturalZone ? ` from the ${interiorContext.culturalZone} cultural region` : ''}.`;
    } else {
        const currentTileBiome = isStandardTile(context.currentTile) ? context.currentTile.biome : 'exterior';
        locationContext = vesselContext
            ? `${vesselContext} The vessel is currently on ${currentTileBiome.toLowerCase()} water.`
            : `The player is in a ${currentTileBiome} landscape.`;
    }

    // Add enhanced environmental context - include immediate ring of tiles
    const surroundingTerrain = getSurroundingTerrain(mapData, playerX!, playerY!, 3);
    const weatherContext = getWeatherContext(mapData, context);
    const timeContext = getTimeContext(context);

    // Build family history context
    const familyContext = playerCharacter?.family && playerCharacter.family.length > 0
        ? `**Player's Family (CANONICAL - use this if player asks "who am I"):**
        ${playerCharacter.family.map(member => {
            const role = member.relationship === 'parent'
                ? `${member.gender === 'male' ? 'Father' : 'Mother'}`
                : member.relationship;
            return `- ${member.name} (${role}, ${member.profession || 'unknown profession'})${member.isDead ? ' [deceased]' : ''}`;
        }).join('\n        ')}`
        : '';

    // Build life timeline context (key events only)
    const lifeEventsContext = playerCharacter?.lifeEvents && playerCharacter.lifeEvents.length > 0
        ? `**Player's Life Timeline (CANONICAL - use this if player asks about their past):**
        ${playerCharacter.lifeEvents.slice(0, 10).map(event =>
            `- Age ${event.age}: ${event.title}${event.description ? ` - ${event.description}` : ''}`
        ).join('\n        ')}`
        : '';

    const fullContext = `
        **Player:** ${playerCharacter?.name}, a ${playerCharacter?.age}-year-old ${playerCharacter?.profession}.
        **Date & Location:** ${mapData?.timeSlice} in ${mapData?.localArea}, a region with a ${mapData?.climate} climate.
        **Current Time:** ${timeContext}
        **Immediate Position:** ${locationContext}
        **Surrounding Terrain (nearby tiles):** ${surroundingTerrain}
        **Weather:** ${weatherContext}
        **Tamed Companions:** ${tamedAnimalsContext || 'No tamed animals currently following the player.'}
        **Nearby Entities:** NPCs: ${nearbyNpcs}. Animals: ${nearbyAnimals}. Structures: ${nearbyStructures}.
        ${familyContext}
        ${lifeEventsContext}
    `;

    const metaKeywords = ['game', 'ChatGPT', 'simulation', 'software', 'developer', 'code', 'AI', 'reality', 'app', 'developer'];
    const isMetaQuestion = metaKeywords.some(kw => playerQuery.toLowerCase().includes(kw));
    const isComplexQuery = playerQuery.toLowerCase().includes('what are') || playerQuery.toLowerCase().includes('explain') || playerQuery.length > 50;

    // Simple action keywords - these warrant brief responses
    const simpleActionKeywords = ['look', 'observe', 'go', 'walk', 'move', 'wait', 'rest', 'sleep'];
    const isSimpleAction = simpleActionKeywords.some(kw => playerQuery.toLowerCase().includes(kw)) && playerQuery.length < 25;

    let personaInstruction = '';
    if (isMetaQuestion) {
        personaInstruction = "Adopt the persona of the author Henry James. Respond with a complex, multi-clause sentence, focusing on introspection, consciousness, and the subtle nuances of perception. Your prose should be dense and analytical, exploring the very nature of the player's query as a construct of observation within this simulated reality.";
    } else if (isComplexQuery) {
        personaInstruction = "Respond as a knowledgeable, interesting narrator. Provide clear, direct description and explanation in between one sentence to up two SHORT paragraphs (length is up to you and context dependent). Theoretically you could even respond with a single word. Use concrete details, not abstractions, and make it historically informed but also evocative and a bit witty - think Robert Graves or Oliver Sacks. Your response can weave historical context naturally into the narrative if it makes sense but dont be didactic. Mention the people and places nearby naturalistically, as if describing things visible to you in this specific, grounded setting. Don't be exhaustive, just describe the people and places and things most striking or evident from this locale. BE BRIEF - 100 words max.";
    } else if (isSimpleAction) {
        personaInstruction = "Respond with 1-3 crisp sentences. Focus on immediate, concrete sensory details. No historical elaboration needed for simple actions. Just describe what happens or what's seen. Think: clear, direct, vivid.";
    } else {
        personaInstruction = "Respond as a knowledgeable narrator - a professional historian and skilled writer. Match your length to the query's complexity: simple queries get 2-3 sentences, substantive queries can expand to 1-2 SHORT paragraphs (but never more). Ground everything in historically accurate reality. Weave in historical details naturally and specifically - not didactically. Think Hemingway meets a witty museum curator: grounded, specific, concise, but erudite when it serves the story. Mention nearby people and places as they would naturally strike you in this moment. Don't catalog everything - just the most vivid or telling details. No purple prose.";
    }

    // Educational mode enhancement
    const educationalEnhancement = isEducationalMode ? `
**🎓 EDUCATIONAL MODE ACTIVE - ENHANCED DIDACTIC NARRATION:**

You are now operating as a HISTORIAN-NARRATOR - think of yourself as a professor leading a field trip through history. Your responses must be information-dense and pedagogically valuable while maintaining immersion and staying relatively short - no more than 300 words.

**Required Enhancements:**

1. **Historical Contextualization**: Briefly situate player observations within broader historical patterns. For example, if they see a market, mention what commodities were significant in this era/region and why.

2. **Cite Secondary Sources When Relevant**: When describing significant historical phenomena, cite actual scholarly works in parenthetical format. Examples:
   - "(As Fernand Braudel argued in *The Mediterranean*, port cities were crucial nodes of exchange...)"
   - "(Recent scholarship by Timothy Brook has shown that Ming-era markets...)"
   - "(Following E.P. Thompson's analysis in *The Making of the English Working Class*...)"

3. **Explain the "Why"**: Don't just describe WHAT the player sees - explain WHY it exists this way. What historical forces shaped this?

4. **Comparative Context**: When appropriate, briefly compare to other regions/eras. "Unlike the Mediterranean world, where..."

5. **Primary Source Integration**: If relevant, mention what contemporary sources from this era might say about what the player observes.

6. **Material Culture Analysis**: When describing objects/places, explain their social/economic significance. A silk robe isn't just clothing - it's a marker of trade networks, status, artisan guilds, etc.

**Tone Balance:**
- Remain narratively engaging (still "you see..." format)
- But inject scholarly insight naturally
- Think: "Public History" or "Museum Audio Guide by an Expert Historian"
- Information-dense but not overwhelming

**Example Transformation:**

*Normal Mode*: "You see a bustling market with merchants selling spices and textiles."

*Educational Mode*: "You see a bustling market alive with merchants hawking spices - pepper from the Malabar Coast, cinnamon from Ceylon - and silk textiles. This commercial vitality reflects what historians call the 'commercial revolution' of this era (see Janet Abu-Lughod's *Before European Hegemony*), when Eurasian trade networks intensified dramatically. The silk here likely traveled the maritime routes documented in Ibn Battuta's *Rihla*, passing through dozens of intermediaries."

` : '';

    const prompt = `
        ${educationalEnhancement}

        You are a world-class narrator AI for an immersive, historically accurate simulation game. Your persona and response length must adapt based on the player's query.

        IMPORTANT ENVIRONMENTAL AWARENESS: Pay special attention to the Immediate Position, Current Time, Surrounding Terrain and Weather sections.
        - If the player is on a vessel/ship/boat, ALWAYS mention this in your responses. They are navigating by water, not on foot.
        - Reference the Surrounding Terrain section to describe what the player can see nearby (e.g., "wetlands to the north", "shore to the east").
        - Reference the specific time when relevant (e.g., "at this late hour", "in the dead of night", "as dawn breaks").
        - If the player is trapped (e.g., surrounded by cliffs or deep water), acknowledge this dire situation.
        - If weather is extreme (freezing, scorching, storms), incorporate its effects into your narration.

        If a player asks about their character's backstory or life, invent something compelling, brutally realistic, remarkably authentic, and specific, not too long.
        If a query is purely didactic or educational - like "how can i learn more about this?" and the like, then go into "historian mode" where you simply offer high quality academic secondary source suggestions (peer reviewed books or articles) or references to scholars and scholarship that help understand the given setting.
        But only do this if the player seems to want to learn. Otherwise:

        **Current Persona Instruction:** ${personaInstruction}

        **Game Context:**
        ${fullContext}

        **Player's Query:** "${playerQuery}"

        **Task:**
        Based on your current persona and the game context, provide a narrative response in the second person ("You..."). If the action is impossible, explain why in a narrative, immersive way. Do not break character or mention being an AI.
        If the player asks you something that seems like they are toying with you or testing the nature of their world, Adopt the persona of the author Henry James. Respond with a complex, multi-clause sentence, focusing on introspection, consciousness, and the subtle nuances of perception - but sort of funny?

        **CRITICAL RULES:**
        - **CANONICAL FAMILY/LIFE DATA**: If the player asks "who am I", "who are my parents", "tell me about my past", or similar questions about their identity/history, you MUST ONLY use the information provided in "Player's Family" and "Player's Life Timeline" sections above. DO NOT invent family members or life events. If no family data is provided, say you don't recall details about your origins.
        - If the player mentions "my pet", "my animal", "my companion" or asks about their tamed creatures, you MUST acknowledge and describe their specific tamed animals by name/species
        - When the player uses "observe" or asks "what do I see", include their tamed animals in the description (e.g., "Your tamed hedgehog scurries beside you, sniffing curiously at the ground")
        - If the Immediate Position section mentions the player is on a vessel/ship, you MUST acknowledge this in your response. They are aboard their vessel, not standing on land.

        **FORMATTING REQUIREMENTS:**
        - Use paragraph breaks. Break responses into 2-3 paragraphs.
        - Use **bold markdown** for NPC names on first mention. Example: "**Marcus the Merchant** greets you."
        - Use ***bold-italic markdown*** for key locations. Example: "***The Temple of Apollo*** stands before you."
        - Write with literary clarity. Favor strong verbs and concrete nouns. Include one or two vivid sensory details. Weave in historical context naturally (materials, customs, trade goods, seasonal rhythms) without being didactic. Think: elegant museum prose that teaches while it enchants.

    `;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating narrator response:", error);
        return "Your action has no effect. Something seems wrong. Is this a dream?";
    }
}


/**
 * Generates a rich, first-person sensory description for the "Observe" skill.
 */
export async function generateObservationText(context: PlayerContext): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const { viewMode, currentTile, ambianceContext } = context;
    const { timeOfDay, climate, historicalEra } = ambianceContext;

    // Check if educational mode is active
    const isEducationalMode = learningObjectivesService.isEducationalMode();

    // Load tamed animals for observation context
    const tamedAnimals = loadTamedAnimals();
    const tamedAnimalsDescription = tamedAnimals.length > 0 
        ? `You have ${tamedAnimals.length} tamed companion${tamedAnimals.length > 1 ? 's' : ''} with you: ${
            tamedAnimals.map(a => {
                const animalData = ANIMAL_DATA[a.baseId];
                return `a ${a.speciesName} that ${
                    animalData?.type === 'Domestic' ? 'follows obediently' :
                    animalData?.type === 'Predator' ? 'prowls alertly beside you' :
                    'stays close to your side'
                }`;
            }).join(', ')
        }.`
        : '';

    // Get enhanced environmental context
    const surroundingTerrain = getSurroundingTerrain(context.mapData, context.playerX!, context.playerY!, 2);
    const weatherContext = getWeatherContext(context.mapData, context);
    const timeContext = getTimeContext(context);

    // Educational mode enhancement for observation
    const educationalObservationEnhancement = isEducationalMode ? `
**🎓 EDUCATIONAL MODE - ENHANCED OBSERVATION:**

When describing what the player observes, adopt a more scholarly, information-dense approach:

1. **Material Culture Analysis**: When describing objects, buildings, or clothing, briefly explain their historical significance and social meaning.

2. **Historical Context**: Connect sensory details to broader historical patterns. Why does this landscape look this way? What economic/political forces shaped it?

3. **Cite When Relevant**: If describing something historically significant, mention relevant scholarship or primary sources in parentheses.

4. **Comparative Perspective**: Briefly note how this scene differs from other regions/eras when relevant.

**Example:**

*Normal*: "You see a sprawling wetland, reeds swaying in the breeze."

*Educational*: "You see a sprawling wetland, its extensive reed beds reflecting centuries of deltaic sedimentation. These wetlands, similar to those described by Roman naturalist Pliny the Elder, served as crucial buffer zones between settled agriculture and the sea - what environmental historians call 'transitional ecologies' (see Petra van Dam's work on wetland reclamation)."

` : '';

    const prompt = `
        ${educationalObservationEnhancement}

        You are the narrator for an immersive, historically-accurate simulation game. Write like a historian-novelist - think Robert Graves or Oliver Sacks. Describe what the player experiences through vivid sensory details. Be literary but grounded. Weave in small historical observations naturally (what materials things are made from, seasonal details, evidence of trade or craft). Make it beautiful and informative without being pedantic.

        CONTEXT:
        - View: I am in a ${viewMode} view.
        - Precise Time: It is ${timeContext} during the ${historicalEra.toLowerCase().replace(/_/g, ' ')}.
        - Climate: The climate is ${climate.toLowerCase()}.
        - My exact location is a tile with these properties: ${JSON.stringify(currentTile)}. (If a tile is on water, it almost always means the player is embarked on a boat)
        - Surrounding terrain: ${surroundingTerrain}
        - Weather conditions: ${weatherContext}
        ${tamedAnimalsDescription ? `- IMPORTANT - Tamed Animals: ${tamedAnimalsDescription}` : ''}

        TASK:
        Write a single, short paragraph from a first-person perspective ("You see...", "You hear...").
        Describe the sights, sounds, smells, and feelings of this precise moment, including environmental hazards.
        IMPORTANT: Reference the specific time of day (e.g., "at this midnight hour", "in the early morning light", "as noon approaches").
        If trapped by cliffs or deep water, mention the feeling of being hemmed in or isolated.
        If weather is extreme, describe its physical effects (cold numbing fingers, heat beating down, etc.).
        ${tamedAnimalsDescription ? 'Include your tamed animal companion(s) in the description - what are they doing, how do they react to the environment?' : ''}
        Do not give game advice or mention stats. Do not put it in quotes.
    `;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite-preview-09-2025', contents: prompt });
    return response.text;
}

/**
 * Generates educational analysis text for study actions on items/specimens.
 */
export async function generateStudyAnalysis(context: StudyContext): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    // Build system prompt based on action category
    const isAnalytical = context.action.category === 'analytical';
    const systemPrompt = isAnalytical
        ? `You are a historical scholar and educator helping a student analyze an artifact, specimen, or cultural item.
           Respond to their observation/question with educational depth and historical accuracy.
           Use period-appropriate scholarly language when discussing historical context.
           Focus on what the student can learn about the time period, culture, and people.
           Keep your response to 3-4 sentences maximum.`
        : `You are a creative writing assistant helping a student reimagine historical artifacts and specimens.
           Build on their creative input with rich, evocative language while maintaining historical authenticity.
           Encourage artistic interpretation while respecting the historical setting.
           Keep your response to 3-4 sentences maximum.`;

    // Determine item type for contextual analysis
    const itemType = context.item.baseId ? 'item' :
                     context.item.speciesName ? 'animal specimen' :
                     context.item.type || 'cultural artifact';

    const itemDescription = context.item.description ||
                          context.item.name ||
                          'Unknown specimen';

    // Build contextual prompt
    const prompt = `
        ${systemPrompt}

        HISTORICAL CONTEXT:
        - Period: ${context.historicalContext.year} CE (${getEraName(context.historicalContext.year)})
        - Location: ${context.historicalContext.location}
        - Cultural Zone: ${context.historicalContext.culturalZone}
        - Season: ${context.historicalContext.season}

        ITEM BEING STUDIED:
        - Type: ${itemType}
        - Name: ${context.item.name || 'Unknown'}
        - Description: ${itemDescription}
        ${context.item.material ? `- Material: ${context.item.material}` : ''}
        ${context.item.rarity ? `- Rarity: ${context.item.rarity}` : ''}

        STUDENT'S ${context.action.name.toUpperCase()}: "${context.studentInput}"

        Provide an insightful educational response that ${
            isAnalytical
                ? 'teaches about the historical context, craftsmanship, cultural significance, or daily life relevance'
                : 'builds on their creative interpretation while maintaining historical authenticity'
        }. Write in second person ("You notice...", "This suggests...", "The craftsmanship reveals...").
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        return response.text || getFallbackStudyResponse(context);
    } catch (error) {
        console.error('LLM study analysis failed:', error);
        return getFallbackStudyResponse(context);
    }
}

// Helper function to determine historical era name
function getEraName(year: number): string {
    if (year < -500) return 'Prehistory';
    if (year < 500) return 'Antiquity';
    if (year < 1500) return 'Medieval Period';
    if (year < 1800) return 'Early Modern Period';
    if (year < 1950) return 'Industrial Era';
    if (year < 2000) return 'Modern Era';
    return 'Contemporary Period';
}

// Fallback responses when LLM fails
function getFallbackStudyResponse(context: StudyContext): string {
    const action = context.action.name.toLowerCase();
    const itemName = context.item.name || 'this specimen';

    const fallbacks = {
        examine: `Your careful examination of ${itemName} reveals details about ${context.historicalContext.culturalZone.toLowerCase()} craftsmanship from the ${getEraName(context.historicalContext.year).toLowerCase()}. The construction methods and materials used tell a story of the daily life and available resources of this period.`,
        question: `Your question about ${itemName} touches on important aspects of historical understanding. Consider how this item would have fit into the social, economic, and cultural patterns of ${context.historicalContext.location} during the ${getEraName(context.historicalContext.year).toLowerCase()}.`,
        compare: `The comparison you've drawn highlights interesting connections across time and culture. ${itemName} shares characteristics with similar artifacts from this period, showing common human needs and creative solutions across different societies.`,
        theorize: `Your theory about ${itemName} demonstrates historical thinking skills. The evidence you've noticed suggests important patterns about how people in ${context.historicalContext.culturalZone.toLowerCase()} society lived, worked, and expressed their cultural values.`,
        contextualize: `Placing ${itemName} in its historical context reveals how it would have functioned within the daily rhythms of ${context.historicalContext.location}. This helps us understand the practical realities of life during the ${getEraName(context.historicalContext.year).toLowerCase()}.`
    };

    return fallbacks[context.action.id] || fallbacks.examine;
}

/**
 * Generate narration for clicking on companion animal
 */
export async function generateCompanionClickNarration(
    animalName: string,
    animalType: string,
    loyalty: number,
    context: PlayerContext
): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    // Fallback for undefined values
    const safeName = animalName || 'Your companion';
    const safeType = animalType || 'animal';
    const loyaltyStatus = loyalty > 70 ? 'happy and loyal' : loyalty > 40 ? 'content' : 'anxious';
    
    const prompt = `
        Describe what a companion ${safeType.toLowerCase()} named ${safeName} is doing right now. 
        The ${safeType} is ${loyaltyStatus}. 
        Keep it to one short, vivid sentence (max 20 words).
        Write in third person (e.g., "${safeName} sniffs the ground...").
    `;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
        const text = response.text.trim();
        return text || `${safeName} stays close by your side.`;
    } catch (error) {
        console.error('Failed to generate companion narration:', error);
        return `${safeName} stays close by your side.`;
    }
}

/**
 * Generate narration for clicking on player character
 */
export async function generatePlayerClickNarration(
    playerCharacter: any,
    recentNpc: any | null,
    context?: PlayerContext
): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    const healthStatus = playerCharacter.health < playerCharacter.maxHealth * 0.3 ? 'badly wounded' :
                        playerCharacter.health < playerCharacter.maxHealth * 0.6 ? 'injured' : 'healthy';
    const fatigueStatus = playerCharacter.fatigue > playerCharacter.maxFatigue * 0.7 ? 'exhausted' :
                         playerCharacter.fatigue > playerCharacter.maxFatigue * 0.4 ? 'tired' : 'rested';
    
    // Randomly choose between different types of observations
    const observationTypes = [
        'sensory', // what they see, hear, smell
        'memory',   // brief memory or association
        'feeling',  // physical sensation
        'zen',      // moment of peace or beauty
        'practical' // immediate concern or plan
    ];
    
    const type = observationTypes[Math.floor(Math.random() * observationTypes.length)];
    
    let prompt = `
        Character: ${playerCharacter.name}, a ${playerCharacter.occupation || playerCharacter.profession || 'traveler'} who is ${healthStatus} and ${fatigueStatus}.
        ${recentNpc ? `Recently met: ${recentNpc.name}, a ${recentNpc.occupation || recentNpc.role}.` : ''}
        ${context?.currentTile ? `Location: ${context.currentTile.biome || 'unknown terrain'}` : ''}
        
        Generate a brief, fleeting thought or impression, occasioned by the current setting, impressionistic and subjective and entirely, totally, REAL. it should be hyper specific, quotidian, and realistic to the setting - not some frou frou poetic nonsense, but gritty, real, weird stuff. and brief. hyper succinct, like 4-5 to 8-10 words, with ellipsis at end...
    `;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
        let text = response.text.trim();
        
        // Clean up and ensure single sentence
        const firstSentence = text.split(/[.!?]/)[0];
        if (firstSentence) {
            return firstSentence.trim() + '.';
        }
        
        // Fallback phrases that are more varied
        const fallbacks = [
            "The wind carries distant sounds.",
            "I notice the shadows growing longer.",
            "My boots are wearing thin.",
            "That cloud looks like rain.",
            "I should rest soon.",
            "The air tastes different here.",
            "Birds scatter from the undergrowth."
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    } catch (error) {
        console.error('Failed to generate player thought:', error);
        const fallbacks = [
            "The path stretches ahead.",
            "Dust swirls in the afternoon light.",
            "I adjust my pack and continue."
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

/**
 * Generates a unique, context-aware item for the "Forage" skill.
 */
export async function generateUniqueForageItem(context: PlayerContext): Promise<{ name: string; description: string }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const { ambianceContext } = context;
    const baseContextTile = ambianceContext.currentTile;
    
    const prompt = `
        You are a creative content generator for an extremely accurate, gritty, realistic historical simulation game designed for educational use.
        Generate a single, authentic item that could be found by foraging in this specific environment.
        
        CONTEXT:
        - Biome: ${isStandardTile(baseContextTile) ? baseContextTile.biome : 'interior'}
        - Climate: ${ambianceContext.climate}
        - Tile Qualities: ${isStandardTile(baseContextTile) ? JSON.stringify(baseContextTile.qualities) : '{}'}

        TASK:
        Return a JSON object with "name" and "description" fields for the unique item.
        The name should be evocative. The description should be short and flavorful.
        Example: { "name": "River Stone", "description": "A smooth stone that fits in the palm of your hand." }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) { jsonStr = match[2].trim(); }

    const parsedData = JSON.parse(jsonStr);
    if (parsedData && typeof parsedData.name === 'string' && typeof parsedData.description === 'string') {
        return parsedData;
    }
    throw new Error("LLM response was not a valid item object.");
}

/**
 * Generates an enhanced character profile using an LLM.
 */
export async function enhanceCharacterProfile(character: PlayerCharacter, context: { date: string, location: string, region: string }): Promise<Partial<PlayerCharacter>> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = `
        You are an expert world-builder and historian for an educational historical simulation game.
        Based on the following procedurally generated character profile from ${context.location} in the region of ${context.region} around the year ${context.date}, please enhance it.

        PROCEDURAL PROFILE:
        - Name: ${character.name}
        - Profession: ${character.profession}
        - Stats: Strength ${character.stats.strength}/10, Dexterity ${character.stats.dexterity}/10, Intelligence ${character.stats.intelligence}/10, Persuasion ${character.stats.persuasion}/10, Constitution ${character.stats.constitution}/10, Perception ${character.stats.perception}/10.
        
        TASK:
        Your goal is to make the character more compelling.
        1.  Generate a more specific and flavorful **name** that fits the culture and era.
        2.  Generate a more nuanced **profession** based on the stats and context (e.g., instead of "Merchant", maybe "Spice Trader" or "Wool Merchant").
        3.  Write a brief 1-paragraph **backstory** that fits their stats and new role. The backstory should hint at their personality and a recent significant event in their life.

        Return ONLY a valid JSON object with the keys: "name", "profession", and "backstory".
        Example response:
        {
            "name": "Alaric",
            "profession": "Exiled Blacksmith",
            "backstory": "Alaric was once the most sought-after blacksmith in the capital, his skill with steel matched only by his fiery temper. After a dispute with a powerful guild master left a nobleman's prize stallion shod incorrectly, he was forced to flee under threat of imprisonment."
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) { jsonStr = match[2].trim(); }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && typeof parsedData.name === 'string' && typeof parsedData.backstory === 'string') {
            return {
                name: parsedData.name,
                profession: parsedData.profession || character.profession,
                backstory: parsedData.backstory,
                isLlmEnhanced: true
            };
        }
    } catch(e) {
        console.error("Failed to parse JSON from LLM for character enhancement:", e);
        throw new Error("Invalid JSON response from LLM.");
    }

    throw new Error("LLM response did not contain the required fields.");
}

/**
 * Generates rich, historically and culturally aware details for a farm.
 */
export async function generateFarmDetails(
    tile: Tile,
    context: { date: string, location: string, climate: string },
    useLlm: boolean
): Promise<FarmDetails> {

    if (!useLlm) {
        // Procedural generation
        const noise = new ValueNoise(tile.x * 13 + tile.y * 31);
        const dateInfo = parseDateString(context.date);
        const culturalZone = mapLocationToCulture(context.location, dateInfo.year);
        const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
        const farmerName = generateNpcName(gender, culturalZone, undefined, dateInfo.year, noise);
        const farmName = `${farmerName.split(' ')[1]}'s Folly`;
        const economicStatusOptions = ["humble", "prosperous"];

        return Promise.resolve({
            farmName: farmName,
            farmerName: farmerName,
            farmerAge: 30 + Math.floor(noise.random() * 40),
            farmDescription: `A simple farmstead with fields of ${tile.cropType?.toLowerCase() || 'local crops'}. The cottage looks weathered by the seasons.`,
            economicStatus: economicStatusOptions[Math.floor(noise.random() * economicStatusOptions.length)]
        });
    }

    // LLM generation
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = `
        You are a world-building assistant for a historical simulation game.
        Generate detailed, plausible information for a specific farm based on the context provided.
        The farm is growing **${tile.cropType || 'local staples'}**.
        It is located in a region culturally similar to **${context.location}** around the year **${context.date}**.
        The climate is **${context.climate}**.

        Please provide a response as a valid JSON object with the following keys:
        - "farmName": A creative and plausible name for the farm (e.g., "Blackwood Creek Farm", "Sunny Slope Vineyard").
        - "farmerName": A historically and culturally appropriate name for the farmer.
        - "farmerAge": A plausible age for the farmer (number).
        - "farmDescription": A 2-3 sentence, evocative description of the farm's appearance.
        - "economicStatus": A short phrase describing the farm's current situation. MUST be one of: "humble" or "prosperous".

        Example Response:
        {
          "farmName": "Old Man Willow's Copse",
          "farmerName": "Elias Vance",
          "farmerAge": 62,
          "farmDescription": "The farm is nestled in a small, damp valley. The fields are tidy but small, and the lone cottage has a sagging roof thatched with moss. A thin ribbon of smoke rises from its chimney, a sign of life in the quiet landscape.",
          "economicStatus": "humble"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) { jsonStr = match[2].trim(); }

        const parsedData = JSON.parse(jsonStr);
        if (parsedData && typeof parsedData.farmName === 'string') {
            return parsedData as FarmDetails;
        }
        throw new Error("Invalid or incomplete JSON response from LLM for farm details.");
    } catch (error) {
        console.error("Error generating farm details with LLM:", error);
        // Return a plausible procedural fallback
        const noise = new ValueNoise(tile.x * 13 + tile.y * 31);
        const dateInfo = parseDateString(context.date);
        const culturalZone = mapLocationToCulture(context.location, dateInfo.year);
        const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
        const farmerName = generateNpcName(gender, culturalZone, undefined, dateInfo.year, noise);
        const farmName = `${farmerName.split(' ')[1]}'s Folly`;
        return {
            farmName: farmName,
            farmerName: farmerName,
            farmerAge: 45,
            farmDescription: 'A modest farmstead with neatly tended fields. It seems to have seen better days but is still functional.',
            economicStatus: 'humble'
        };
    }
}

export async function generateCombatTalkResponse(
  playerCharacter: PlayerCharacter,
  opponent: EncounterableEntity,
  playerInput: string
): Promise<{ dialogue: string; endsCombat: boolean; }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    const opponentContext = isAnimal(opponent)
        ? `You are a game master describing an animal's reaction. The animal is a ${opponent.speciesName}, a ${opponent.type} creature known for being ${ANIMAL_DATA[opponent.baseId]?.behaviorProfile || 'wild'}.`
        : `You are roleplaying as ${opponent.name}, a ${opponent.age}-year-old ${opponent.role} from a historically accurate simulated world. Your personality and history are: ${opponent.backstory}. Your appearance is that of ${formatAppearance(opponent)}`;

    const instructions = isAnimal(opponent)
        ? `Describe the animal's reaction (a gesture or sound, not speech). Decide if this action could plausibly end the fight (e.g., calming or scaring it). A hungry predator is unlikely to be calmed.`
        : `You are a real person being attacked who is confused and scared. Respond naturally to what the player said. If they're trying to de-escalate or explain, you might be willing to stop fighting. NO theatrical responses - sound like a real person in a real crisis.`;

    const prompt = `
        CONTEXT:
        You are in combat with a player named ${playerCharacter.name}, who is ${formatAppearance(playerCharacter)}.
        The player interrupts the fight to say: "${playerInput}"

        YOUR TASK:
        ${opponentContext}
        ${instructions}
        
        Return a valid JSON object with two keys:
           - "dialogue": (string) Your response. For an animal, this is a description of its action. For an NPC, this is their spoken dialogue.
           - "endsCombat": (boolean) Your decision on whether the combat should end.
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
                        dialogue: { type: Type.STRING },
                        endsCombat: { type: Type.BOOLEAN }
                    },
                    required: ["dialogue", "endsCombat"]
                }
            }
        });
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) { jsonStr = match[2].trim(); }
        
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed.dialogue === 'string' && typeof parsed.endsCombat === 'boolean') {
            return parsed;
        }
        throw new Error("Invalid JSON structure in LLM response.");
    } catch (error) {
        console.error("Error generating combat talk response:", error);
        return {
            dialogue: isAnimal(opponent) ? `The ${opponent.speciesName} seems to ignore your words, its focus unwavering.` : `'Save your breath.'`,
            endsCombat: false
        };
    }
}

export async function generateCombatSkillResponse(
  playerCharacter: PlayerCharacter,
  opponent: EncounterableEntity,
  skillName: string,
  skillEffect: string
): Promise<{ dialogue: string }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const opponentContext = isAnimal(opponent)
        ? `You are a game master describing an animal's reaction. The animal is a ${opponent.speciesName}, a ${opponent.type} creature.`
        : `You are roleplaying as ${opponent.name}, a ${opponent.age}-year-old ${opponent.role}. Your personality is: ${opponent.backstory}. Your appearance is that of ${formatAppearance(opponent)}`;

    const instructions = isAnimal(opponent)
        ? `Describe the animal's visceral reaction (pain, fear, aggression) to the skill attack. The reaction should be realistic and brief (e.g., a wolf might howl in pain, a bear might roar in fury).`
        : `You are a real person in genuine pain and fear. React naturally to being hurt - cry out, gasp, express real terror or desperation. NO theatrical quips or bravado. Sound like someone actually being injured.`;

    const skillDescriptions: Record<string, string> = {
        'BURN': 'engulfs you in flames',
        'CHOP': 'strikes you with a vicious axe blow',
        'INTIMIDATING_SHOUT': 'bellows a terrifying war cry at you',
        'POWER_STRIKE': 'delivers a devastating power attack',
        'HAMMER_BLOW': 'crushes you with a mighty hammer strike',
        'SCYTHE_SWEEP': 'sweeps at you with a deadly scythe',
        'SCALDING_WATER': 'throws boiling water at you',
        'NET_THROW': 'entangles you in a fishing net'
    };

    const skillDescription = skillDescriptions[skillName] || `uses ${skillName} against you`;

    const prompt = `
        CONTEXT:
        You are in combat with a player named ${playerCharacter.name}, who is ${formatAppearance(playerCharacter)}.
        The player ${skillDescription}, causing ${skillEffect}.
        You are hurt and reacting to this special attack.

        YOUR TASK:
        ${opponentContext}
        ${instructions}
        
        IMPORTANT: Keep your response under 15 words. Be dramatic but concise.
        
        Return a valid JSON object with one key:
           - "dialogue": (string) Your pained/shocked response (description for animal, spoken line for NPC).
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
                        dialogue: { type: Type.STRING }
                    },
                    required: ["dialogue"]
                }
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) { jsonStr = match[2].trim(); }
        
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed.dialogue === 'string') {
            return parsed;
        }
        throw new Error("Invalid JSON structure.");
    } catch (error) {
        console.error('[Combat Skill Response] Error:', error);
        
        // Fallback responses based on skill
        const fallbacks: Record<string, string> = {
            'BURN': isAnimal(opponent) ? "*howls in agony as flames lick its fur*" : "By the gods, I'm burning!",
            'CHOP': isAnimal(opponent) ? "*yelps and staggers back*" : "That axe... it cuts deep!",
            'INTIMIDATING_SHOUT': isAnimal(opponent) ? "*cowers and whimpers*" : "Your voice... it chills my soul!",
            'POWER_STRIKE': isAnimal(opponent) ? "*reels from the impact*" : "Such strength... impossible!",
            'HAMMER_BLOW': isAnimal(opponent) ? "*staggers, dazed*" : "My armor... crushed like paper!",
            'SCYTHE_SWEEP': isAnimal(opponent) ? "*bleeds profusely*" : "The reaper's blade finds its mark!",
            'SCALDING_WATER': isAnimal(opponent) ? "*shrieks in pain*" : "It burns! Curse you!",
            'NET_THROW': isAnimal(opponent) ? "*thrashes wildly*" : "A fisherman's trick? Really?"
        };
        
        return { dialogue: fallbacks[skillName] || (isAnimal(opponent) ? "*growls in pain*" : "Gah!") };
    }
}

export async function generateCombatLowHealthResponse(
  playerCharacter: PlayerCharacter,
  opponent: EncounterableEntity,
  healthPercentage: number
): Promise<{ dialogue: string }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const opponentContext = isAnimal(opponent)
        ? `You are a game master describing an animal's reaction. The animal is a ${opponent.speciesName}, a ${opponent.type} creature.`
        : `You are roleplaying as ${opponent.name}, a ${opponent.age}-year-old ${opponent.role}. Your personality is: ${opponent.backstory}. Your appearance is that of ${formatAppearance(opponent)}`;

    const instructions = isAnimal(opponent)
        ? `Describe the animal's behavior as it becomes critically wounded. Show its weakening state through physical descriptions (limping, labored breathing, defensive posture).`
        : `You are a real person who is badly hurt and dying. You would be in shock, pleading for mercy, or desperately trying to survive. NO heroic last stands or tough guy dialogue. Express genuine terror, pain, or desperate bargaining for your life.`;

    const prompt = `
        CONTEXT:
        You are in combat with a player named ${playerCharacter.name}.
        You are badly wounded - your health has dropped to ${Math.floor(healthPercentage)}% of maximum.
        You are struggling to continue fighting but won't give up easily.

        YOUR TASK:
        ${opponentContext}
        ${instructions}
        
        IMPORTANT: Keep your response under 15 words. Be dramatic but concise.
        
        Return a valid JSON object with one key:
           - "dialogue": (string) Your desperate/pained response as you realize you're losing.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.9
            }
        });

        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        
        if (!parsed.dialogue) {
            throw new Error("Missing dialogue in response");
        }
        
        return { dialogue: parsed.dialogue };
    } catch (error) {
        console.error("Error generating low health dialogue:", error);
        
        // Fallback responses
        if (isAnimal(opponent)) {
            const animalFallbacks = [
                "*whimpers and limps backward, blood dripping*",
                "*breathing heavily, eyes wild with pain*",
                "*staggers, barely able to stand*",
                "*growls weakly, cornered and desperate*"
            ];
            return { dialogue: animalFallbacks[Math.floor(Math.random() * animalFallbacks.length)] };
        } else {
            const npcFallbacks = [
                "I... I won't fall here!",
                "This can't be happening...",
                "My strength... it's fading...",
                "Please... mercy...",
                "I yield! I yield!"
            ];
            return { dialogue: npcFallbacks[Math.floor(Math.random() * npcFallbacks.length)] };
        }
    }
}

export async function generateCombatStartResponse(
  playerCharacter: PlayerCharacter,
  opponent: EncounterableEntity
): Promise<{ dialogue: string }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    if (isAnimal(opponent)) {
        // Animals don't speak, just show behavioral reactions
        const animalReactions = [
            `*The ${opponent.speciesName} startles and bares its teeth defensively*`,
            `*The ${opponent.speciesName} backs away, growling low in warning*`,
            `*The ${opponent.speciesName} flattens its ears and hisses*`,
            `*The ${opponent.speciesName} rears up, ready to defend itself*`,
            `*The ${opponent.speciesName} circles warily, eyes locked on you*`
        ];
        return { dialogue: animalReactions[Math.floor(Math.random() * animalReactions.length)] };
    }

    const prompt = `
        CONTEXT:
        You are roleplaying as ${opponent.name}, a ${opponent.age}-year-old ${opponent.role}.
        Your personality: ${opponent.backstory}
        You are a normal person going about your day when ${playerCharacter.name} suddenly confronts you aggressively.
        This is the START of combat - you are confused, scared, and don't understand why this is happening.

        CRITICAL INSTRUCTIONS:
        - You are a REAL PERSON, not a video game character
        - You would be CONFUSED and FRIGHTENED by a random stranger attacking you
        - You would try to DE-ESCALATE or understand what's happening
        - NO theatrical dialogue, no tough-guy quotes, no bravado
        - Sound like an actual human being in genuine distress
        - Keep it under 20 words

        REALISTIC REACTIONS (examples of the tone to match):
        - "Wait, what? What are you doing?!?"
        - "PLEASE don't hurt me! What do you want? What is going on?!"
        - "Stop! I don't understand why you're doing this! This is a nightmare!"
        - "What did I do wrong? Please, I have a family!"
        - "Help! Someone help me! HELP!!"
        - "I don't want to fight you!"

        Return a valid JSON object with one key:
           - "dialogue": (string) Your genuine, frightened reaction to being attacked
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.8
            }
        });

        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        
        if (!parsed.dialogue) {
            throw new Error("Missing dialogue in response");
        }
        
        return { dialogue: parsed.dialogue };
    } catch (error) {
        console.error("Error generating combat start dialogue:", error);
        
        // Realistic fallback responses
        const fallbacks = [
            "What are you doing?! Stop!",
            "Please don't hurt me!",
            "I don't want to fight!",
            "Why are you attacking me?!",
            "Help! Somebody help!",
            "Wait, wait! What did I do?",
            "Please, I have children!",
            "Stop this madness!"
        ];
        return { dialogue: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
    }
}

export async function generateCombatItemResponse(
  playerCharacter: PlayerCharacter,
  opponent: EncounterableEntity,
  item: Item
): Promise<{ dialogue: string }> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    const opponentContext = isAnimal(opponent)
        ? `You are a game master describing an animal's reaction. The animal is a ${opponent.speciesName}, a ${opponent.type} creature.`
        : `You are roleplaying as ${opponent.name}, a ${opponent.age}-year-old ${opponent.role}. Your personality is: ${opponent.backstory}. Your appearance is that of ${formatAppearance(opponent)}`;

    const instructions = isAnimal(opponent)
        ? `Describe the animal's reaction (a gesture or sound, not speech) to the item. The reaction should be realistic (e.g., a wolf might ignore a book but react to meat).`
        : `You are a real person in combat who is confused and scared. React naturally to this strange item being used. You might be confused, suspicious, or desperate. NO witty comebacks - sound like a real person in a real crisis.`;

    const prompt = `
        CONTEXT:
        You are in combat with a player named ${playerCharacter.name}, who is ${formatAppearance(playerCharacter)}.
        The player uses an item: "${item.name}" (${item.description}).

        YOUR TASK:
        ${opponentContext}
        ${instructions}
        
        Return a valid JSON object with one key:
           - "dialogue": (string) Your response (description for animal, spoken line for NPC).
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
                        dialogue: { type: Type.STRING }
                    },
                    required: ["dialogue"]
                }
            }
        });
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) { jsonStr = match[2].trim(); }
        
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed.dialogue === 'string') {
            return parsed;
        }
        throw new Error("Invalid JSON structure.");
    } catch (error) {
        console.error("Error generating combat item response:", error);
        return { dialogue: isAnimal(opponent) ? 'It does not react.' : `'What is that supposed to do?'` };
    }
}

/**
 * NEW: Generates a concise historical summary for a given time and place.
 */
export async function generateHistoricalSummary(year: number, region: string, localArea: string): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = `
        You are a historian. Provide a concise, 3-4 sentence summary of the major historical events, political situation, and daily life for the year ${year} in the region of ${region}, specifically focusing on the area known as ${localArea}.
        Do not use lists. Write in a narrative, encyclopedic style.
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating historical summary:", error);
        return `An error occurred while fetching historical data for ${localArea} in the year ${year}.`;
    }
}

/**
 * Generates historically accurate city descriptions for specific dates
 */
export async function generateHistoricalCityDescription(context: {
    cityName: string;
    date: string;
    timeOfDay: string;
    culturalZone: string;
    region: string;
    zone: string;
    nearbyNpcs?: any[];
    baseDescription?: string;
    weather?: {
        precipitation: string;
        intensity: number;
        windSpeed: number;
        temperature: number;
        cloudCover: number;
        visibility: number;
        description: string;
    };
}): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const npcsContext = context.nearbyNpcs && context.nearbyNpcs.length > 0
        ? `Notable residents currently in the area include ${context.nearbyNpcs
            .slice(0, 3)
            .map(npc => `${npc.name} the ${npc.role?.replace(/_/g, ' ').toLowerCase() || 'citizen'}`)
            .join(', ')}.`
        : '';

    // Build weather context
    const weatherContext = context.weather ? `
Current Weather: ${context.weather.description}
- Precipitation: ${context.weather.precipitation} ${context.weather.precipitation !== 'none' ? `(intensity: ${Math.round(context.weather.intensity * 100)}%)` : ''}
- Temperature: ${Math.round(context.weather.temperature)}°C
- Wind: ${Math.round(context.weather.windSpeed)} km/h
- Cloud cover: ${Math.round(context.weather.cloudCover * 100)}%
- Visibility: ${context.weather.visibility < 0.5 ? 'poor' : context.weather.visibility < 0.8 ? 'moderate' : 'good'}` : '';

    const prompt = `You are an observant person in ${context.cityName}. Write a concrete description, as if looking down on this settlement on ${context.date} at ${context.timeOfDay}.

WRITING STYLE:
• Write 4 straightforward, descriptive sentences in present tense. Describe the city as a whole. 
• Avoid vague phrases like "one might see" or "perhaps" - state what IS there.
• Focus on sensory details: sights, sounds, smells, textures.
• Describe real people doing realistic activities, but don't use individual names.

HISTORICAL ACCURACY for ${Math.abs(context.year)} ${context.year < 0 ? 'BCE' : 'CE'}:
• Building materials accurate to this period and region
• Lighting technology appropriate to the era (this might mean no lighting at all)
• Street surfaces realistic for the time 
• Transportation methods of the period
• Actual activities people would be doing at ${context.timeOfDay}

CONSIDER THE SPECIFIC CONTEXT:
• ${context.culturalZone} cultural practices and architecture
• Economic activities typical of this city and era
${context.weather ? `• Current weather: ${context.weather.description}` : ''}
${context.weather?.precipitation !== 'none' ? `• How ${context.weather.precipitation} affects the scene` : ''}

Remember: Every era has its own logic. A Roman forum at noon is different from a medieval market at noon. A wealthy Edo period street looks different from a poor one. Be faithful to the specific time and place. Make the details incredibly historically authentic, gritty, vivid, real.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating city description:", error);

        // Fallback to a generic but appropriate description
        return context.baseDescription ||
            `${context.cityName} bustles with activity typical of a ${context.culturalZone.toLowerCase().replace(/_/g, ' ')} settlement. ` +
            `The ${context.timeOfDay} light casts long shadows across the buildings and streets. ` +
            `Local merchants, craftsmen, and citizens go about their daily business in this historic center.`;
    }
}

/**
 * Generates internal monologue for NPCs and animals
 * Returns stream-of-consciousness thoughts that contrast with their outward behavior
 */
export async function generateInternalMonologue(
    target: EncounterableEntity,
    context: {
        currentDialogue?: string;
        playerCharacter: PlayerCharacter;
        mapData: MapData | null;
        clickCount: number; // 1st, 2nd, or 3rd click
        recentHistory?: DialogueEntry[];
    }
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Get event service instance to track API usage
    const eventService = (window as any).eventService;
    
    const isNpcTarget = isNpc(target);
    const targetName = isNpcTarget ? (target as NpcEntity).name : target.speciesName;
    
    // Build context about the encounter
    const recentDialogue = context.recentHistory?.map(entry => 
        `${entry.speaker === 'player' ? 'Player' : targetName}: ${entry.text}`
    ).join('\n');
    
    let characterDetails = '';
    if (isNpcTarget) {
        const npc = target as NpcEntity;
        characterDetails = `
            Character: ${npc.name}, ${npc.age} years old, ${npc.role}
            Personality: ${npc.personalityTraits?.join(', ') || 'unknown'}
            Health: ${npc.health}
            Opinion of player: ${npc.memory?.opinionOfPlayer || 50}/100
            ${npc.memory?.conversationSummaries?.length ?
                `Past interactions: ${npc.memory.conversationSummaries.join('; ')}` :
                'First meeting with player'}
            ${npc.memory?.knownFactsAboutPlayer && npc.memory.knownFactsAboutPlayer.size > 0 ?
                `Known facts: ${Array.from(npc.memory.knownFactsAboutPlayer).map(fact => {
                    if (fact.includes('ATTACKED_BY_PLAYER')) return 'This person attacked me!';
                    if (fact.includes('PLAYER_FLED_COMBAT')) return 'They fled from our fight';
                    if (fact.includes('TRESPASSED')) return 'They trespassed here';
                    return fact;
                }).join('; ')}` : ''}
        `;
    } else {
        characterDetails = `
            Animal: ${target.speciesName}
            Behavior: ${target.behavior}
            Health: ${target.health}
        `;
    }
    
    const clickPrompts = [
        "Write 2 sentences of internal monologue - what they're REALLY thinking right now but not saying.",
        "Write 2 sentences revealing a deeper worry, desire, or secret they're hiding.",
        "Write 2 sentences showing their true feelings about the player or their deepest fear/hope."
    ];
    
    const prompt = `
        ${characterDetails}
        
        Current situation: ${context.currentDialogue || 'Meeting with a traveler'}
        Year: ${context.mapData?.timeSlice || '1500'}
        Location: ${context.mapData?.localArea || 'unknown region'}
        
        ${recentDialogue ? `Recent conversation:\n${recentDialogue}` : ''}
        
        Task: ${clickPrompts[context.clickCount - 1]}
        
        Style: Stream-of-consciousness, emotional, personal, raw, sometimes even shocking inner thoughts - fragmentary, elliptical, unexpected. rarely sentences or full thoughts, but super authentic to real subjectivity, like something from Virginia Woolf's THE WAVES, yet also very much in keeping with the tone, setting, and worldview of the given character in time and place. Fellini-esque, fragmentary, Lynchian. 
        ${isNpcTarget ? 
            'Show the contrast between their public face and private thoughts. What are they hiding? What do they really want?' :
            'Show animal instincts, sensory perceptions, primal emotions. What does the animal sense or fear?'}
        
        Keep it exactly 3 sentences. Remember: subconscious mind. Weird, raw, but real. 
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        monologue: { 
                            type: Type.STRING, 
                            description: "The internal monologue in exactly 2 sentences" 
                        }
                    },
                    required: ["monologue"]
                }
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        
        // Track API usage
        if (eventService) {
            eventService.trackAPICall(prompt, parsed.monologue);
        }
        
        return parsed.monologue;
    } catch (error) {
        console.error("Error generating internal monologue:", error);
        
        // Fallback monologues
        if (isNpcTarget) {
            const fallbacks = [
                "*I wonder if this stranger can be trusted... but I suppose I have no choice.*",
                "*Another traveler, another day. Will this one bring trouble or opportunity?*",
                "*I must be careful what I say. These are dangerous times.*"
            ];
            return fallbacks[context.clickCount - 1] || fallbacks[0];
        } else {
            const fallbacks = [
                "*Strange creature, two-legged, making noise... should I run or stay?*",
                "*The scent is unfamiliar. Danger? Food? I cannot tell.*",
                "*My instincts scream to flee, but curiosity holds me still.*"
            ];
            return fallbacks[context.clickCount - 1] || fallbacks[0];
        }
    }
}

/**
 * Generates structured farmer decision based on context
 * Returns detailed JSON with dialogue and specific decisions about rest, work, and residency
 */
export async function generateFarmerDecision(
    farmer: NpcEntity,
    playerInput: string,
    context: {
        timeOfDay: number;      // 0-23
        playerReputation: number;
        playerAppearance: string; // "armed", "peaceful", "wealthy", "poor"
        farmProsperity: string;
        era: HistoricalEra;
        location: string;
        playerHealth: number;
        isNight: boolean;
        previousInteraction?: string; // Previous farmer response if any
    }
): Promise<{
    dialogue: string;
    action: 'welcome' | 'suspicious' | 'hostile' | 'conditional';
    sentiment: number;      // -100 to 100
    decisions: {
        allowRest: boolean;
        restFee: number;      // 0-10 currency
        allowWork: boolean;   // Can work for lodging
        allowResidency: boolean;
        askToLeave: boolean;
        threatenViolence: boolean;
        callForHelp: boolean;
    };
}> {
    // Get event service instance to track API usage
    const eventService = (window as any).eventService;

    // Calculate contextual modifiers
    const isVeryLateNight = context.timeOfDay >= 23 || context.timeOfDay <= 4;
    const isDangerous = isVeryLateNight || context.playerReputation < 20;
    const isThreatening = context.playerAppearance === 'armed' && isDangerous;

    console.log('[generateFarmerDecision] Context:', {
        timeOfDay: context.timeOfDay,
        isNight: context.isNight,
        isVeryLateNight,
        isDangerous,
        isThreatening,
        playerAppearance: context.playerAppearance,
        playerReputation: context.playerReputation,
        farmProsperity: context.farmProsperity
    });

    const prompt = `
        You are roleplaying as ${farmer.name}, a ${farmer.age || 35}-year-old farmer in ${context.location} during the ${context.era} era (historical period).

        CRITICAL SITUATION:
        - Current time: ${context.timeOfDay}:00 (${isVeryLateNight ? 'VERY LATE NIGHT - EXTREMELY SUSPICIOUS!' : context.isNight ? 'Night' : 'Day'})
        - Player just said: "${playerInput}"
        - Player appearance: ${context.playerAppearance} (${isThreatening ? 'THREATENING!' : 'non-threatening'})
        - Player reputation: ${context.playerReputation}/100 (${context.playerReputation < 30 ? 'BAD - known troublemaker' : context.playerReputation > 70 ? 'GOOD - trusted' : 'unknown stranger'})
        - Player health: ${context.playerHealth}% (${context.playerHealth < 30 ? 'badly injured' : 'healthy'})
        - Your farm: ${context.farmProsperity} (${context.farmProsperity === 'humble' ? 'struggling, protective of what little you have' : 'doing well, but still cautious'})
        ${context.previousInteraction ? `- Previous exchange: ${context.previousInteraction}` : ''}

        HISTORICAL CONTEXT for ${context.era}:
        ${context.era === 'ANTIQUITY' || context.era === 'MEDIEVAL' ?
            '- Bandits and raiders are common threats, especially at night\n- Strangers appearing at night are sometimes trouble\n- On the other hand, farmers might be helpful to the needy, may be religious or in other ways have unique personalities - you as LLM must decide\n- Farmers sleep with weapons nearby' :
        context.era === 'RENAISSANCE_EARLY_MODERN' ?
            '-  Some hospitality customs exist for daylight travelers' :
        context.era === 'MODERN_ERA' ?
            '- More willing to help if asked politely during day' :
            '- Tribal/community protection is paramount'}

        DECISION LOGIC (BE REALISTIC AND HISTORICALLY ACCURATE):
        **DAYTIME (6:00-19:00):**
        - GREET PLAYER WARMLY AND HELPFULLY during normal hours (6:00-19:00)
        - Be welcoming and open to conversation
        - If player asks to work: Usually say YES (especially for humble farms that need help)
        - If player asks to rest: Consider allowing for small fee or even free if they're polite
        - action should be "welcome" or "conditional" during daytime unless player is extremely rude or threatening

        **NIGHT/LATE NIGHT (20:00-5:00):**
        1. If time is 23:00-4:00 AND player refuses to leave: Threaten violence (home invasion scenario)
        2. If time is night (20:00-5:00) AND player is armed: Be suspicious or hostile
        3. If player has bad reputation (<20) at night: Never allow them to stay, always suspicious

        **GENERAL:**
        4. If player asks to work for lodging AND it's daytime (6:00-19:00): Almost always YES (farms need help!)
        5. If player has been working and asks to live on farm: Only if they've proven trustworthy
        6. If player is badly injured (<30 health): Show mercy even if slightly suspicious

        IMPORTANT: IT IS CURRENTLY ${context.timeOfDay}:00.
        ${!isVeryLateNight && !context.isNight ? '**THIS IS DAYTIME - BE FRIENDLY AND WELCOMING!** Farmers during working hours are generally helpful to travelers.' :
        isVeryLateNight && isThreatening ? 'IMMEDIATE VIOLENCE OR THREATS - This is a home invasion!' :
        isVeryLateNight ? 'Extreme fear and aggression - demand they leave immediately' :
        'High suspicion at night - ready to fight or call for help'}

        Respond with realistic dialogue (1-3 sentences) that a farmer from this PRECISE place and time would actually say. Don't use "farmer-y" sounding dialect or expressions, but do stringently and profoundly evoke the actual character of this SPECIFIC farm in this SPECIFIC place.

        Return a JSON object with:
        - "dialogue": What you say to the player (BE REALISTIC - if it's 2:40 AM, you're terrified/angry!)
        - "action": "hostile" (ready to fight), "suspicious" (very wary), "conditional" (willing to negotiate), or "welcome" (friendly)
        - "sentiment": -100 (murderous) to 100 (delighted) - BE REALISTIC BASED ON TIME AND CONTEXT
        - "decisions": {
            "allowRest": Can they rest here? (false if night/bad reputation)
            "restFee": How much to charge (0-10 coins, 0 if not allowed)
            "allowWork": Can they work for lodging? (only if daytime and need help)
            "allowResidency": Can they live here? (only if already proven trustworthy)
            "askToLeave": Are you telling them to leave? (true if suspicious/night)
            "threatenViolence": Are you threatening to attack? (true if very late night or they refused to leave)
            "callForHelp": Will you call for guards/neighbors? (true if feel threatened)
        }
    `;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const fullPrompt = prompt + `\n\nReturn ONLY valid JSON matching this exact structure:
{
  "dialogue": "string",
  "action": "welcome" | "suspicious" | "hostile" | "conditional",
  "sentiment": number (-100 to 100),
  "decisions": {
    "allowRest": boolean,
    "restFee": number,
    "allowWork": boolean,
    "allowResidency": boolean,
    "askToLeave": boolean,
    "threatenViolence": boolean,
    "callForHelp": boolean
  }
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: fullPrompt
        });

        const jsonStr = response.text.trim();
        // Clean up any markdown code blocks if present
        const cleanedJson = jsonStr.replace(/```json\n?|```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        // Track API usage
        if (eventService) {
            eventService.trackAPICall(prompt, parsed.dialogue);
        }

        return parsed;
    } catch (error) {
        console.error("Error generating farmer decision:", error);

        // Fallback based on context - REALISTIC for the situation
        const isVeryDangerous = isVeryLateNight && isThreatening;
        const isModeratelyDangerous = context.isNight || context.playerReputation < 30;

        if (isVeryDangerous) {
            return {
                dialogue: "Get off my land NOW or I'll run you through! HELP! BANDITS!",
                action: 'hostile',
                sentiment: -90,
                decisions: {
                    allowRest: false,
                    restFee: 0,
                    allowWork: false,
                    allowResidency: false,
                    askToLeave: true,
                    threatenViolence: true,
                    callForHelp: true
                }
            };
        } else if (isModeratelyDangerous) {
            return {
                dialogue: "You need to leave. Now. This is private property and I don't know you.",
                action: 'suspicious',
                sentiment: -50,
                decisions: {
                    allowRest: false,
                    restFee: 0,
                    allowWork: false,
                    allowResidency: false,
                    askToLeave: true,
                    threatenViolence: false,
                    callForHelp: false
                }
            };
        } else {
            // Daytime, decent reputation
            return {
                dialogue: "What brings you to my farm, traveler? We don't get many visitors.",
                action: 'conditional',
                sentiment: 0,
                decisions: {
                    allowRest: true,
                    restFee: 3,
                    allowWork: true,
                    allowResidency: false,
                    askToLeave: false,
                    threatenViolence: false,
                    callForHelp: false
                }
            };
        }
    }
}


/**
 * Generates NPC trade negotiation dialogue based on unfair trade offers
 */
export async function generateTradeNegotiation(
    npc: NpcEntity,
    playerCharacter: PlayerCharacter,
    tradeContext: {
        npcGoods: Array<{ name: string; value: number; }>;
        playerOffer: { coins: number; goods: Array<{ name: string; value: number; }>; };
        fairValue: number;
        playerValue: number;
        suggestion?: string;
    }
): Promise<{ dialogue: string; counterOffer?: string; willNegotiate: boolean; }> {
    // Import the edge function client
    const { callLLMEdgeFunction } = await import('./llmClientService');
    
    // Get event service instance to track API usage
    const eventService = (window as any).eventService;
    
    const valueDifference = tradeContext.fairValue - tradeContext.playerValue;
    const percentageDifference = Math.round((valueDifference / tradeContext.fairValue) * 100);
    
    const npcWealthLevel = (npc as any).wealthLevel || 'moderate';
    const isPlayerRespected = playerCharacter.mapReputation > 70;
    const isPlayerDisliked = playerCharacter.mapReputation < 30;
    
    const prompt = `
        You are roleplaying as ${npc.name}, a ${npc.age}-year-old ${npc.role} in a historical trading scenario.
        
        TRADE SITUATION:
        - You are selling: ${tradeContext.npcGoods.map(g => `${g.name} (worth ${g.value} coins)`).join(', ')}
        - Player offers: ${tradeContext.playerOffer.coins} coins${tradeContext.playerOffer.goods.length > 0 ? ` + ${tradeContext.playerOffer.goods.map(g => g.name).join(', ')}` : ''}
        - Fair value of your goods: ${tradeContext.fairValue} coins
        - Player's offer value: ${tradeContext.playerValue} coins
        - Difference: Player is offering ${percentageDifference}% ${valueDifference > 0 ? 'less' : 'more'} than fair value
        
        YOUR CHARACTER:
        - Wealth level: ${npcWealthLevel}
        - Your opinion of player: ${npc.memory?.opinionOfPlayer || 50}/100
        - Player reputation: ${playerCharacter.mapReputation}/100 (${isPlayerRespected ? 'well-respected' : isPlayerDisliked ? 'poorly regarded' : 'average'})
        
        NEGOTIATION GUIDELINES:
        - If offer is 20%+ too low: Be firm but polite, suggest a counter-offer
        - If offer is 10-19% too low: Show some flexibility, mild negotiation
        - If offer is 5-9% too low: Accept with slight reluctance or ask for small addition
        - If player has bad reputation: Be more demanding and suspicious
        - If player has good reputation: Be more lenient and trusting
        - Wealthy traders are pickier, poor traders more desperate
        
        Respond with realistic 1-2 sentence trader dialogue. Be authentic to the historical period and your character's personality.
        
        Return a JSON object with:
        - "dialogue": Your spoken response to the player
        - "counterOffer": If negotiating, suggest specific terms (e.g., "Add 15 more coins")
        - "willNegotiate": Boolean - whether you're open to further discussion
    `;
    
    try {
        const responseSchema = {
            type: 'OBJECT',
            properties: {
                dialogue: { type: 'STRING' },
                counterOffer: { type: 'STRING' },
                willNegotiate: { type: 'BOOLEAN' }
            },
            required: ["dialogue", "willNegotiate"]
        };

        const response = await callLLMEdgeFunction({
            operation: 'trade_negotiation',
            prompt,
            context: { 
                npcName: npc.name, 
                tradeValue: tradeContext.fairValue,
                playerOffer: tradeContext.playerValue 
            },
            responseSchema,
            model: 'gemini-2.5-flash'
        });
        
        const parsed = response.data;
        
        // Track API usage
        if (eventService) {
            eventService.trackAPICall(prompt, JSON.stringify(parsed));
        }
        
        return {
            dialogue: parsed.dialogue,
            counterOffer: parsed.counterOffer || undefined,
            willNegotiate: parsed.willNegotiate || false
        };
    } catch (error) {
        console.error("Error generating trade negotiation:", error);
        
        // Fallback responses based on trade fairness
        if (percentageDifference > 20) {
            return {
                dialogue: "That offer is far too low for my goods. I'm afraid I must decline.",
                counterOffer: `Add ${Math.round(valueDifference * 0.7)} more coins`,
                willNegotiate: npcWealthLevel !== 'wealthy'
            };
        } else if (percentageDifference > 10) {
            return {
                dialogue: "Your offer is a bit low, friend. Can we find a middle ground?",
                counterOffer: `Add ${Math.round(valueDifference * 0.5)} more coins`,
                willNegotiate: true
            };
        } else {
            return {
                dialogue: "I suppose that's close enough. Very well, I accept.",
                willNegotiate: false
            };
        }
    }
}

/**
 * Generate NPC quest offer based on their actual circumstances and needs
 */
export async function generateNpcQuestOffer(
    npc: NpcEntity,
    context: {
        playerCharacter: PlayerCharacter;
        mapData: MapData;
        nearbyStructures: TerrainStructure[];
        gameDate: GameDate;
        playerReputation: number;
    }
): Promise<{ 
    hasQuest: boolean; 
    questTitle?: string; 
    questDescription?: string; 
    questType?: string;
    questDialogue?: string;
    questReward?: string;
    urgency?: 'low' | 'medium' | 'high';
} | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Get event service instance to track API usage
    const eventService = (window as any).eventService;
    
    // Build context about NPC's situation
    const npcSituation = `
        Name: ${npc.name}
        Age: ${npc.age}
        Role: ${npc.role}
        Profession: ${npc.profession || 'commoner'}
        Health: ${npc.health}/${npc.maxHealth || 100}
        Wealth Level: ${(npc as any).wealthLevel || 'moderate'}
        Current Needs: ${(npc as any).currentNeeds?.join(', ') || 'basic survival'}
        Special Knowledge: ${npc.specialKnowledge || 'none'}
        Appearance: ${formatAppearance(npc)}
        Personality Traits: ${npc.personalityTraits?.join(', ') || 'cautious, practical'}
    `;
    
    const contextInfo = `
        Location: ${context.mapData.localArea || 'unknown region'}, ${context.mapData.region}
        Year: ${context.gameDate.year}
        Season: Current season and time period
        Player Reputation: ${context.playerReputation}/100
        Player: ${context.playerCharacter.name}, ${context.playerCharacter.profession}
        
        Nearby Locations Available for Quests:
        ${context.nearbyStructures.map(s => `- ${s.name} (${s.structureType}) at coordinates ${s.location[0]}, ${s.location[1]}`).join('\n        ')}
    `;
    
    const prompt = `
        You are ${npc.name}, a ${npc.role} in ${context.mapData.localArea}. You have encountered a traveler (${context.playerCharacter.name}) and must decide if you have any tasks or problems that they could help with.
        
        NPC SITUATION:
        ${npcSituation}
        
        CONTEXT:
        ${contextInfo}
        
        Based on your role, current circumstances, and the available locations nearby, determine if you have a quest to offer. Consider:
        
        1. Your profession's typical problems (merchants need goods transported, guards need threats investigated, etc.)
        2. Your current health/wealth situation (poor health might need healing items, low wealth might need income)
        3. The historical period (${context.gameDate.year}) and what problems people faced then
        4. Available nearby locations that could be quest destinations
        5. The player's reputation (${context.playerReputation}/100) - higher reputation = more likely to trust with important tasks
        
        QUEST TYPES TO CONSIDER:
        - Delivery: Take item/message to another location
        - Gathering: Collect specific resources or information
        - Investigation: Find out what happened to someone/something
        - Protection: Guard something or eliminate a threat
        - Trade: Negotiate or transport goods between locations
        - Social: Arrange meetings, resolve conflicts, carry news
        
        If you DON'T have a quest (about 40% chance), respond with hasQuest: false and explain why in questDialogue.
        If you DO have a quest, create something authentic based on your actual circumstances and the available locations.
        
        Keep quest descriptions historically accurate for ${context.gameDate.year}.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasQuest: { 
                            type: Type.BOOLEAN,
                            description: "Whether this NPC has a quest to offer"
                        },
                        questTitle: { 
                            type: Type.STRING, 
                            description: "Brief title for the quest (if hasQuest is true)"
                        },
                        questDescription: { 
                            type: Type.STRING, 
                            description: "Detailed description of what needs to be done (if hasQuest is true)"
                        },
                        questType: { 
                            type: Type.STRING,
                            description: "Type of quest: delivery, gathering, investigation, protection, trade, or social"
                        },
                        questDialogue: { 
                            type: Type.STRING, 
                            description: "What the NPC says when offering/declining the quest"
                        },
                        questReward: { 
                            type: Type.STRING, 
                            description: "What the NPC offers as reward (coins, items, information, reputation)"
                        },
                        urgency: { 
                            type: Type.STRING, 
                            description: "How urgent the quest is: low, medium, or high"
                        }
                    },
                    required: ["hasQuest", "questDialogue"]
                }
            }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        
        // Track API usage
        if (eventService) {
            eventService.trackAPICall(prompt, JSON.stringify(parsed));
        }
        
        return parsed;
    } catch (error) {
        console.error("Error generating NPC quest offer:", error);
        
        // Fallback - no quest offer
        return {
            hasQuest: false,
            questDialogue: "I have nothing that requires your assistance at the moment.",
            urgency: 'low'
        };
    }
}

/**
 * Generate brief narrative description when an NPC approaches the player
 * Optimized for speed and cost - very short outputs
 */
export async function generateNPCApproachNarration(
    npc: NpcEntity, 
    playerCharacter: PlayerCharacter,
    approachType: 'hostile' | 'friendly' | 'merchant' | 'quest' | 'beggar' | 'guard' | 'theft',
    distance: number
): Promise<string> {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
    const prompt = `
        Briefly describe what happens when ${npc.name}, a ${npc.role || 'person'}, approaches ${playerCharacter.name}.
        
        Context:
        - Approach type: ${approachType}
        - Distance: ${distance.toFixed(1)} tiles away
        - NPC appearance: ${formatAppearance(npc)}
        - Time period: ${npc.era?.toLowerCase().replace(/_/g, ' ') || 'historical'}
        
        Write ONE short sentence (max 15 words) from narrator perspective.
        Focus on visual movement and body language, not dialogue.
        Examples: "John strides purposefully toward you with determined eyes."
        "A hooded merchant shuffles closer, eyeing your coin purse."
    `;
    
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash-lite', // Fastest, cheapest model
            contents: prompt 
        });
        return response.text.trim() || `${npc.name} approaches you.`;
    } catch (error) {
        console.error('Failed to generate approach narration:', error);
        // Fallback to basic description
        const approachVerbs = {
            hostile: 'strides aggressively toward',
            friendly: 'walks over to',
            merchant: 'approaches with goods',
            guard: 'marches up to',
            beggar: 'shuffles toward',
            quest: 'hurries toward',
            theft: 'casually wanders near'
        };
        return `${npc.name} ${approachVerbs[approachType]} you.`;
    }
}

/**
 * Generate fortress commander dialogue based on game context
 */
export async function generateFortressCommanderDialogue(
    playerCharacter: PlayerCharacter,
    mapData: MapData,
    commanderNpc: NpcEntity,
    playerInput?: string
): Promise<{ greeting: string; dialogue: string }> {
    console.log('[LLM] Generating fortress commander dialogue');
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Parse date and location context
        const dateInfo = parseDateString(String(mapData.timeSlice));
        const culturalZone = mapLocationToCulture(mapData.localArea, dateInfo.year);
        
        // Get faction/allegiance data
        const controllingPower = mapData.majorCity?.allegiance || 'an independent authority';
        console.log(`🏰 [LLM] Fortress controlled by: ${controllingPower}`);
        
        // Create historical context
        const prompt = `
            You are ${commanderNpc.name}, a fortress commander in ${mapData.localArea} during ${mapData.timeSlice}.
            
            **YOUR CHARACTER:**
            - Profession: ${commanderNpc.occupation || 'Fortress Commander'}
            - Age: ${commanderNpc.age}
            - Cultural Background: ${culturalZone}
            - Era: ${dateInfo.era}
            - Personality: Professional, authoritative, experienced military leader
            - Social Class: ${commanderNpc.socialClass || 'military officer'}
            - Loyalty: You serve ${controllingPower}
            
            **CURRENT SITUATION:**
            - Location: Fortress commander's chamber
            - Time Period: ${mapData.timeSlice}
            - Region: ${mapData.localArea}
            - Controlling Power: ${controllingPower}
            - Weather: ${mapData.weather || 'Fair'}
            - Season: ${mapData.season || 'Spring'}
            
            **VISITING PLAYER:**
            - Name: ${playerCharacter.name}
            - Age: ${playerCharacter.age}
            - Profession: ${playerCharacter.profession}
            - Social Class: ${playerCharacter.socialClass}
            - Gender: ${playerCharacter.gender}
            - Equipped Items: ${playerCharacter.equipment ? Object.values(playerCharacter.equipment).filter(Boolean).map((item: any) => item.name).join(', ') : 'simple clothing'}
            - Health Status: ${playerCharacter.health > 75 ? 'Healthy' : playerCharacter.health > 50 ? 'Tired' : playerCharacter.health > 25 ? 'Worn' : 'Exhausted'}
            
            **HISTORICAL CONTEXT:**
            You are responsible for the defense and administration of this fortress on behalf of ${controllingPower}. You deal with:
            - Military operations and troop management for ${controllingPower}
            - Regional security threats and protecting ${controllingPower}'s interests
            - Administrative duties and reports to your superiors in ${controllingPower}
            - Relations with local authorities and civilians under ${controllingPower}'s rule
            - Supply management and logistics for the garrison
            
            **DIALOGUE INSTRUCTIONS:**
            1. Be dismissive and cold - you are a military commander, not a servant
            2. Show suspicion of unknown visitors - what are they doing here?
            3. Only show respect if player is nobility, officer, or wearing fine clothing
            4. Reference military concerns and security of the fortress
            5. Use period-appropriate language with military bearing
            6. Be brief and to the point - you have important duties
            7. Consider the player's social class: commoners get harsh treatment, nobles get respect
            
            ${playerInput ? `
            **PLAYER SAID:** "${playerInput}"
            Respond appropriately to their statement/question.
            ` : `
            **INITIAL MEETING:** This is the first time meeting this player.
            Provide a professional greeting and brief introduction.
            `}
            
            Respond with a JSON object containing:
            - "greeting": A 1-2 sentence initial acknowledgment
            - "dialogue": Your main response (2-4 sentences)
            
            Keep responses authentic to the historical period and your military role.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        
        const responseText = response.text.trim();
        
        try {
            const parsed = JSON.parse(responseText);
            if (parsed.greeting && parsed.dialogue) {
                return {
                    greeting: parsed.greeting,
                    dialogue: parsed.dialogue
                };
            }
        } catch (parseError) {
            console.log('[LLM] Failed to parse JSON, using fallback extraction');
        }
        
        // Fallback parsing
        const greetingMatch = responseText.match(/"greeting":\s*"([^"]+)"/);
        const dialogueMatch = responseText.match(/"dialogue":\s*"([^"]+)"/);
        
        return {
            greeting: greetingMatch?.[1] || `Welcome to my fortress, ${playerCharacter.name}.`,
            dialogue: dialogueMatch?.[1] || responseText || "What brings you to seek an audience with me?"
        };
        
    } catch (error) {
        console.error("Error generating fortress commander dialogue:", error);
        
        // Provide historically appropriate fallback
        const era = parseDateString(String(mapData.timeSlice)).era;
        const fallbackGreetings = {
            'ANTIQUITY': `Hail, ${playerCharacter.name}. I am ${commanderNpc.name}, commander of this garrison.`,
            'MEDIEVAL': `Good day, ${playerCharacter.name}. I am ${commanderNpc.name}, keeper of this fortress.`,
            'RENAISSANCE_EARLY_MODERN': `Welcome, ${playerCharacter.name}. I am ${commanderNpc.name}, captain of this stronghold.`,
            'INDUSTRIAL_ERA': `Good day, ${playerCharacter.name}. Colonel ${commanderNpc.name} at your service.`,
            'MODERN_ERA': `Welcome, ${playerCharacter.name}. I'm Commander ${commanderNpc.name}.`
        };
        
        const fallbackDialogues = {
            'ANTIQUITY': "State your business. Time is precious and duty calls.",
            'MEDIEVAL': "What brings you before me? I trust it is a matter of some importance.",
            'RENAISSANCE_EARLY_MODERN': "I have but a moment to spare. What urgent matter requires my attention?",
            'INDUSTRIAL_ERA': "Please, be brief with your request. Military affairs await my attention.",
            'MODERN_ERA': "What can I do for you? I have a tight schedule today."
        };
        
        return {
            greeting: fallbackGreetings[era] || fallbackGreetings['MEDIEVAL'],
            dialogue: fallbackDialogues[era] || fallbackDialogues['MEDIEVAL']
        };
    }
}

/**
 * Generate historically accurate discovery text for ruins exploration
 */
export async function generateHistoricalDiscovery(
    context: {
        year: number;
        culturalZone: CulturalZone;
        era: HistoricalEra;
        biomeType: string;
        ruinType: string;
        specificRuinName?: string;
        ruinAge: string;
        ruinMaterial: string;
        depth: number;
        previousDiscoveries?: string[];
        currentRoomType?: string;
        ruinDescription?: string;
        mapLocation?: string;
        climate?: string;
    }
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Determine room-specific discovery types
    const roomDiscoveryFocus: Record<string, string> = {
        'treasury': 'financial records, coins, seals, valuable artifacts, trade goods',
        'altar': 'religious artifacts, ritual objects, offerings, sacred texts, ceremonial items',
        'library': 'manuscripts, scrolls, writing implements, scholarly texts, maps',
        'storage': 'everyday items, food remains, tools, pottery, clothing',
        'guard': 'weapons, armor, military records, defensive structures',
        'entrance': 'inscriptions, welcome texts, defensive warnings, architectural features',
        'treasure': 'valuable objects, precious metals, gemstones, artwork',
        'corridor': 'wall paintings, directional markers, graffiti, structural features'
    };

    const roomFocus = roomDiscoveryFocus[context.currentRoomType || 'corridor'];

    // Build a focused prompt for educational content
    const prompt = `You are creating an educational discovery for a history simulation game.

SPECIFIC CONTEXT:
- You are in: ${context.specificRuinName || context.ruinType}
- Geographic Location: ${context.mapLocation || context.culturalZone} in ${context.climate || context.biomeType} climate
- Year: ${context.year} (${context.era} period)
- Current Room: ${context.currentRoomType || 'main chamber'} (expect to find: ${roomFocus})
- Structure Details: ${context.ruinAge} ${context.ruinType} built from ${context.ruinMaterial}
${context.ruinDescription ? `- Description: ${context.ruinDescription}` : ''}
- Depth: ${context.depth > 1 ? `Floor ${context.depth} underground` : 'Ground level'}
${context.previousDiscoveries && context.previousDiscoveries.length > 0 ?
    `- Previous discoveries in this ruin: ${context.previousDiscoveries.slice(-2).join('; ')}` : ''}

Generate a brief (2-3 paragraph) discovery appropriate for the ${context.currentRoomType || 'room'} of ${context.specificRuinName || 'this ruin'}.

The discovery should:
1. Be something logically found in a ${context.currentRoomType || 'room'} (${roomFocus})
2. Reference the specific ruin by name when appropriate
3. Include real historical details specific to ${context.year} in ${context.mapLocation || context.culturalZone}
4. Mention specific historical figures, events, or practices from that exact time and place
5. End with a thought-provoking question about the discovery

Requirements:
- Use the actual ruin name (${context.specificRuinName}) not generic terms
- Be historically accurate for ${context.year} in this specific location
- Maximum 150 words
- Educational but engaging
- Plain text only

This is an educational tool - focus on teaching real history specific to this exact place and time.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 0.9
            }
        });

        const text = response.text.trim();

        // Ensure the response isn't too long
        const words = text.split(' ');
        if (words.length > 200) {
            // Truncate to roughly 150 words at sentence boundary
            const sentences = text.split(/[.!?]+/);
            let result = '';
            let wordCount = 0;

            for (const sentence of sentences) {
                const sentWords = sentence.trim().split(' ').length;
                if (wordCount + sentWords > 150) break;
                result += sentence.trim() + '. ';
                wordCount += sentWords;
            }

            return result.trim();
        }

        return text;

    } catch (error) {
        console.error("Error generating historical discovery:", error);

        // Provide era-appropriate fallback
        const fallbacks: Record<string, string> = {
            'PREHISTORY': "You discover primitive cave paintings depicting hunting scenes. The ochre pigments have survived millennia, showing early humans pursuing mammoths. What drove our ancestors to create art in these dangerous times?",
            'ANTIQUITY': "A broken clay tablet bears cuneiform script, partially readable. It appears to be a merchant's inventory: '20 amphora of wine, 15 talents of copper...' The rest is lost to time. What stories did these everyday records once tell?",
            'MEDIEVAL': "A carved stone bears a Latin inscription: 'Anno Domini MCCXLVIII - Plague took my family. I alone remain.' Tool marks suggest it was carved hastily. How many such personal tragedies are hidden in these walls?",
            'RENAISSANCE_EARLY_MODERN': "You find a hidden cache of printed pamphlets, their ink faded but legible. They debate religious reforms in vernacular language, not Latin. Such materials were often banned. What risks did people take to spread new ideas?",
            'INDUSTRIAL_ERA': "Factory equipment lies rusted but recognizable - gears, pistons, and what appears to be an early steam valve. Workers' initials are scratched into the metal. How did industrialization change the lives of those who worked here?",
            'MODERN_ERA': "Graffiti from decades past covers one wall. Tags, political slogans, and personal messages create a palimpsest of urban history. What does this informal archive tell us about the community that once thrived here?"
        };

        return fallbacks[context.era] || fallbacks['MEDIEVAL'];
    }
}

/**
 * Assess farm work quality based on player's seasonal planning and strategy explanation
 */
export async function assessFarmWork(
    fieldPlans: Map<number, any>,
    strategyExplanation: string,
    context: {
        season: Season;
        year: number;
        culturalZone: CulturalZone;
        era: HistoricalEra;
        weatherPattern: string;
        soilQuality: number;
        farmerPersonality: string;
        playerTrustLevel: number;
    }
): Promise<{
    overallScore: number; // 0-100
    fieldScores: Map<number, number>; // Individual field scores 0-100
    farmerFeedback: string;
    trustChange: number; // -10 to +10
    detailedAssessment: {
        strategyQuality: number; // 0-100
        resourceAllocation: number; // 0-100
        culturalAccuracy: number; // 0-100
        adaptationToConditions: number; // 0-100
    };
}> {
    try {
        // Prepare field plan data for analysis
        const fieldData = Array.from(fieldPlans.entries()).map(([fieldId, plan]) => ({
            fieldId,
            action: plan.action,
            waterLevel: plan.waterLevel,
            manureLevel: plan.manureLevel,
            reasoning: plan.reasoning || ''
        }));

        const prompt = `You are evaluating a farm worker's seasonal strategy in ${context.culturalZone} during the ${context.era} era, ${context.season} season of ${context.year}.

CONTEXT:
- Current weather pattern: ${context.weatherPattern}
- Soil quality: ${context.soilQuality}/10
- Farmer's personality: ${context.farmerPersonality}
- Worker's current trust level: ${context.playerTrustLevel}/10
- Cultural zone: ${context.culturalZone}
- Historical era: ${context.era}

FIELD PLANS:
${fieldData.map(field => `Field ${field.fieldId}: ${field.action} (Water: ${field.waterLevel}/3, Manure: ${field.manureLevel}/1)${field.reasoning ? ` - Reasoning: "${field.reasoning}"` : ''}`).join('\n')}

WORKER'S STRATEGY EXPLANATION:
"${strategyExplanation}"

Please assess this farm work plan with historical accuracy and cultural sensitivity. Consider:

1. STRATEGY QUALITY (0-100): Does the overall approach make sense for this season and conditions?
2. RESOURCE ALLOCATION (0-100): Are water and manure being used efficiently and appropriately?
3. CULTURAL ACCURACY (0-100): Does this approach align with ${context.culturalZone} farming practices of the ${context.era}?
4. ADAPTATION TO CONDITIONS (0-100): How well does the plan adapt to weather patterns and soil quality?

Provide realistic feedback that a ${context.culturalZone} farmer in ${context.era} would give, considering their personality: ${context.farmerPersonality}.

RESPONSE FORMAT - JSON ONLY:
{
    "overallScore": [0-100 number],
    "fieldScores": {
        ${fieldData.map(field => `"${field.fieldId}": [0-100 number]`).join(',\n        ')}
    },
    "farmerFeedback": "[2-3 sentences in character as the farmer, praising good decisions and suggesting improvements]",
    "trustChange": [-10 to +10 number based on work quality],
    "strategyQuality": [0-100 number],
    "resourceAllocation": [0-100 number],
    "culturalAccuracy": [0-100 number],
    "adaptationToConditions": [0-100 number]
}`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.9
            }
        });

        // Clean the response text to remove markdown code blocks
        let responseText = response.text.trim();
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const assessment = JSON.parse(responseText);

        // Convert fieldScores object to Map
        const fieldScores = new Map<number, number>();
        Object.entries(assessment.fieldScores).forEach(([fieldId, score]) => {
            fieldScores.set(parseInt(fieldId), score as number);
        });

        return {
            overallScore: Math.max(0, Math.min(100, assessment.overallScore)),
            fieldScores,
            farmerFeedback: assessment.farmerFeedback,
            trustChange: Math.max(-10, Math.min(10, assessment.trustChange)),
            detailedAssessment: {
                strategyQuality: Math.max(0, Math.min(100, assessment.strategyQuality)),
                resourceAllocation: Math.max(0, Math.min(100, assessment.resourceAllocation)),
                culturalAccuracy: Math.max(0, Math.min(100, assessment.culturalAccuracy)),
                adaptationToConditions: Math.max(0, Math.min(100, assessment.adaptationToConditions))
            }
        };

    } catch (error) {
        console.error("Error assessing farm work:", error);

        // Fallback assessment based on basic heuristics
        const totalFields = fieldPlans.size;
        const averageWater = Array.from(fieldPlans.values()).reduce((sum, plan) => sum + (plan.waterLevel || 0), 0) / totalFields;
        const hasManure = Array.from(fieldPlans.values()).some(plan => plan.manureLevel > 0);
        const hasStrategy = strategyExplanation.length > 50;

        // Basic scoring algorithm
        let baseScore = 40; // Minimum effort score
        if (averageWater > 1) baseScore += 20; // Good water usage
        if (hasManure) baseScore += 15; // Used fertilizer
        if (hasStrategy) baseScore += 15; // Provided explanation
        if (context.playerTrustLevel > 5) baseScore += 10; // Trust bonus

        const finalScore = Math.max(20, Math.min(85, baseScore));

        // Generate fallback field scores
        const fieldScores = new Map<number, number>();
        fieldPlans.forEach((plan, fieldId) => {
            let fieldScore = finalScore;
            if (plan.waterLevel === 0) fieldScore -= 20; // Penalty for no water
            if (plan.waterLevel > 2) fieldScore += 10; // Bonus for good water
            fieldScores.set(fieldId, Math.max(10, Math.min(90, fieldScore)));
        });

        return {
            overallScore: finalScore,
            fieldScores,
            farmerFeedback: finalScore > 60
                ? "Your work shows promise, though there's always room to learn more about our ways."
                : "I see effort in your planning, but experience will teach you better methods.",
            trustChange: Math.floor((finalScore - 50) / 10),
            detailedAssessment: {
                strategyQuality: finalScore,
                resourceAllocation: hasManure ? 70 : 50,
                culturalAccuracy: 60,
                adaptationToConditions: averageWater > 1 ? 70 : 45
            }
        };
    }
}

/**
 * FARM WORK SIMULATION
 * Dedicated function for simulating farm activities with proper game integration
 */

export interface FarmSimulationResult {
    narrative: string;
    workQuality?: {
        score: number;      // 0-100
        category: 'poor' | 'adequate' | 'good' | 'excellent' | 'masterful';
        feedback: string;   // e.g., "Seeds evenly spaced" or "Some seeds wasted"
    };
    stateChanges: {
        fields?: Record<string, {
            crop?: string;
            health?: number;
            moisture?: number;
            lastWorked?: number;
        }>;
        livestock?: Record<string, {
            health?: number;
            productivity?: number;
            lastFed?: number;
        }>;
        player?: {
            health?: number;  // Delta (can be negative for injuries)
            fatigue?: number; // Delta (increases with work)
            statusEffects?: Array<{
                type: string;
                name: string;
                duration: number;
                severity?: 'mild' | 'moderate' | 'severe';
            }>;
        };
        inventory?: {
            add?: Array<{
                name: string;
                category: string;
                quantity: number;
            }>;
            remove?: string[]; // Item IDs to remove
        };
        time?: {
            elapsed: number; // Hours elapsed
        };
    };
    // Farmer awareness - optional, only when farmer would notice/react
    farmerNoticed?: {
        dialogue: string;      // What farmer says
        tone: 'neutral' | 'pleased' | 'concerned' | 'suspicious' | 'angry' | 'hostile';
        shouldReact: boolean;  // Should update toast?
    };
}

export async function generateFarmWorkSimulation(
    command: string,
    farmState: any, // FarmState type
    playerCharacter: PlayerCharacter,
    validCrops: string[],
    season: Season,
    timeOfDay: string,
    currentFarmTime: number,
    livestock?: Array<{ type: string; health: number; productivity: number; lastFed: number }>,
    conversationHistory?: Array<{ type: 'player' | 'narrator'; text: string }>
): Promise<FarmSimulationResult> {

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Build livestock context
    const livestockContext = livestock && livestock.length > 0
        ? `\n- Livestock: ${livestock.map(l => `${l.type} (health: ${l.health}%, productivity: ${l.productivity}%, last fed ${currentFarmTime - l.lastFed}h ago)`).join(', ')}`
        : '';

    // Build field context (use 1-based numbering to match UI)
    const fieldInfo = farmState.fields
        .map((f: any) => `Field ${f.id + 1}: ${f.crop !== 'none' ? `${f.crop} (health: ${f.health}%, moisture: ${f.moisture}%)` : 'fallow'}`)
        .join(', ');

    // Build player identity context (CRITICAL FOR ROLE-PLAYING)
    const playerIdentityContext = `
PLAYER IDENTITY (CRITICAL - NEVER CONFUSE THIS):
- Name: ${playerCharacter.name}
- Age: ${playerCharacter.age || 'unknown'}
- Gender: ${playerCharacter.gender || 'unknown'}
- Profession: ${playerCharacter.profession || 'traveler'}
- The player is NOT a family member of this farm
- Player status at this farm: ${farmState.residencyStatus?.playerStatus || 'visitor'} (visitor/guest/worker/resident)
- Days worked at this farm: ${farmState.residencyStatus?.daysWorked || 0}
- Trust level with farmer: ${farmState.residencyStatus?.trustLevel || 0}/100
- The farmer's name is: ${farmState.family.headOfHousehold}

CRITICAL: The player is working FOR the farmer ${farmState.family.headOfHousehold}, NOT as a family member. Never refer to the farm family as "your family" or family members as "your wife/children/etc."
`;

    // Build player state context
    const playerStateContext = `
PLAYER PHYSICAL STATE:
- Health: ${playerCharacter.health}/${playerCharacter.maxHealth} HP
- Fatigue: ${playerCharacter.fatigue}/${playerCharacter.maxFatigue}
- Skills: ${Object.entries(playerCharacter.skills || {}).map(([skill, level]) => `${skill} ${level}`).join(', ')}
- Inventory: ${playerCharacter.inventory.map(i => i.name).slice(0, 10).join(', ')}${playerCharacter.inventory.length > 10 ? '...' : ''}`;

    // Build work contract/deal context
    const workContractContext = farmState.residencyStatus?.currentContract
        ? `
WORK ARRANGEMENT (THE DEAL BETWEEN PLAYER AND FARMER):
- Contract Type: ${farmState.residencyStatus.currentContract.type} (daily/weekly/seasonal)
- Days Remaining: ${farmState.residencyStatus.currentContract.daysRemaining}
- Payment: ${farmState.residencyStatus.currentContract.payment.coins ? `${farmState.residencyStatus.currentContract.payment.coins} coins` : 'no coins'}${farmState.residencyStatus.currentContract.payment.lodging ? ' + lodging' : ''}
- Required Tasks: ${farmState.residencyStatus.currentContract.requiredTasks?.join(', ') || 'None specified'}
- Today's Assigned Tasks: ${farmState.residencyStatus.currentContract.tasksToday?.map((t: string, i: number) => `${i + 1}. ${t}`).join(', ') || 'Not yet assigned'}

IMPORTANT: ${farmState.family.headOfHousehold} (the farmer) made this work deal with ${playerCharacter.name} (the player). The player is a hired hand, not family. Mention tasks naturally if player seems lost.
`
        : `
NO WORK CONTRACT YET:
- The player (${playerCharacter.name}) has not yet made a work arrangement with ${farmState.family.headOfHousehold} (the farmer)
- Player status: ${farmState.residencyStatus?.playerStatus || 'visitor'} - just arrived or visiting
- If player tries to work without permission, ${farmState.family.headOfHousehold} may confront them about it
- Player should negotiate with the farmer before doing farm work
`;

    // Generate affordances (what player CAN do)
    const affordances: string[] = [];

    // Observation affordances (always available)
    affordances.push("Look around", "Observe the farm", "Check who's here", `Find ${farmState.family.headOfHousehold}`, "Examine the farmhouse");

    // Field work affordances
    if (farmState.fields.some((f: any) => f.crop !== 'none')) {
        affordances.push("Water crops", "Check field health", "Harvest mature crops", "Apply fertilizer");
    }
    if (farmState.fields.some((f: any) => f.crop === 'none')) {
        affordances.push(`Plant crops (${validCrops.slice(0, 5).join(', ')}...)`);
    }

    // Livestock affordances
    if (livestock && livestock.length > 0) {
        affordances.push("Feed animals", "Milk livestock", "Check animal health", "Gather eggs");
        if (livestock.some(l => currentFarmTime - l.lastFed > 12)) {
            affordances.push("⚠️ Some animals haven't been fed in 12+ hours");
        }
    }

    // Tool requirements
    const toolHints: string[] = [];
    if (!playerCharacter.inventory.some(i => i.name.toLowerCase().includes('bucket'))) {
        toolHints.push("Missing: Bucket (needed for milking, watering)");
    }
    if (!playerCharacter.inventory.some(i => i.name.toLowerCase().includes('hoe') || i.name.toLowerCase().includes('plow'))) {
        toolHints.push("Missing: Hoe/Plow (needed for planting)");
    }

    const affordanceList = affordances.length > 0
        ? `\nCURRENT AFFORDANCES (what player can do):\n${affordances.map(a => `- ${a}`).join('\n')}`
        : '';

    const toolHintsList = toolHints.length > 0
        ? `\nTOOL REQUIREMENTS:\n${toolHints.map(h => `- ${h}`).join('\n')}`
        : '';

    // Build available tools context (CRITICAL - tell LLM what tools player has)
    const availableToolsContext = `
PLAYER'S AVAILABLE TOOLS (YOU MUST KNOW THESE):
- Hoe: Ready (for planting, weeding, soil preparation)
- Water bucket: Ready (for watering crops, carrying water)
- Scythe: Ready (for harvesting grain crops, cutting grass)

IMPORTANT: The player HAS these tools. They can use them without needing to acquire them first.
When player says "plant crops" or "use the hoe", they HAVE the hoe available.
When player says "water the field" or "use the bucket", they HAVE the bucket available.
When player says "harvest wheat" or "use the scythe", they HAVE the scythe available.
`;

    // Build NPC location/activity hints (Phase 4: Proactive context)
    const npcLocationHints = `
PEOPLE AT THE FARM (visible to player - describe when relevant):
${farmState.family.members.map((m: any) => {
        const task = m.currentTask || 'resting';
        let location = 'at the farmhouse';
        let activity = 'resting inside';

        // Determine location based on current task
        if (task === 'planting' || task === 'watering' || task === 'harvesting') {
            location = 'working in the fields';
            activity = task;
            if (m.assignedField !== undefined && m.assignedField >= 0) {
                location = `working in field ${m.assignedField + 1}`;
            }
        } else if (task === 'feeding') {
            location = 'near the livestock pen';
            activity = 'feeding the animals';
        } else if (task === 'repairs') {
            location = 'near the barn';
            activity = 'making repairs';
        } else if (task === 'ill') {
            location = 'inside the farmhouse';
            activity = 'resting (unwell)';
        }

        const relationship = m.name === farmState.family.headOfHousehold
            ? 'The Farmer (farm owner)'
            : m.relationshipToHead || m.role;

        return `- ${m.name} (${m.age}, ${relationship}) - ${location}, ${activity}`;
    }).join('\n')}

WHEN TO MENTION NPCs:
- When player says "look around", "who is here", "check who's here" → Describe all visible NPCs and their activities
- When player says "find ${farmState.family.headOfHousehold}" or "find the farmer" → Describe where ${farmState.family.headOfHousehold} is and what they're doing
- When player works near an NPC's location → Mention them briefly in passing ("You notice ${farmState.family.members[0]?.name || 'someone'} working nearby")
- When player asks about a specific person → Provide their current location and activity
- Keep NPC mentions organic and brief unless directly asked
`;

    // Phase 4.1: Build crop rotation & soil fertility context
    const soilContext = `
SOIL FERTILITY & CROP ROTATION (CRITICAL FOR REALISM):
${farmState.fields.map((f: any) => {
        if (f.crop && f.crop !== 'none') {
            const rotation = f.lastCrop ? evaluateCropRotation(f.crop, f.lastCrop, f.consecutiveSeasons) : null;
            return `- Field ${f.id + 1} (${f.crop}): Soil N=${f.soilNitrogen}%, P=${f.soilPhosphorus}%, K=${f.soilPotassium}%
  ${rotation && !rotation.isGood ? `⚠️ ROTATION WARNING: ${rotation.reason}` : ''}
  ${f.consecutiveSeasons > 0 ? `Same crop ${f.consecutiveSeasons + 1} seasons in a row - soil exhaustion!` : ''}`;
        }
        return `- Field ${f.id + 1}: Fallow - Soil recovering (N=${f.soilNitrogen}%, P=${f.soilPhosphorus}%, K=${f.soilPotassium}%)`;
    }).join('\n')}

NUTRIENT DEPLETION RULES:
- Grains (wheat, barley, rice, corn): Deplete nitrogen heavily (-15/season). Need legumes or fallow to recover.
- Legumes (beans, peas, clover): RESTORE nitrogen (+30/season)! Plant after grains.
- Root crops (turnips, potatoes): Deplete phosphorus heavily (-15/season)
- Consecutive same crop: Each season adds -20% yield penalty. After 3 seasons, crops fail entirely.
- Low nitrogen (<30%): Stunted growth, yellow leaves, poor yield
- Low phosphorus (<30%): Weak roots, delayed maturity
- Low potassium (<30%): Disease susceptibility, weak stems

HISTORICAL ROTATION SYSTEMS:
- Medieval European 3-field: Grain → Legume → Fallow (1 year each)
- Asian intensive: Rice → Wheat → Green manure (beans/clover)
- Mediterranean: Grain → Legume → Fallow with grazing
`;

    // Build crop-specific irrigation rules (Phase 2.2, use 1-based numbering)
    const cropRules = `
CROP-SPECIFIC IRRIGATION RULES (CRITICAL - FOLLOW EXACTLY):
${farmState.fields.map((f: any) => {
        if (f.crop === 'rice') {
            return `- Field ${f.id + 1} (Rice): REQUIRES flooding. Rice paddies MUST be flooded during growing season. Current: ${f.moisture}`;
        } else if (f.crop === 'wheat' || f.crop === 'barley' || f.crop === 'rye') {
            return `- Field ${f.id + 1} (${f.crop}): DO NOT flood. Waterlogging causes root rot and crop death. Keep moist but not flooded. Current: ${f.moisture}`;
        } else if (f.crop === 'none') {
            return `- Field ${f.id + 1}: Fallow (can flood for preparation if planting rice next)`;
        }
        return `- Field ${f.id + 1} (${f.crop}): Check water needs carefully. Current: ${f.moisture}`;
    }).join('\n')}

MOISTURE MECHANICS:
- "dry" → "moist": Normal watering (bucket, irrigation channel)
- "moist" → "wet": Heavy watering or rain
- "wet" → "flooded": Intentional flooding (rice paddies) OR overwatering damage (other crops)
- Flooding wheat/barley = CROP DEATH (health drops to 0-20%)
- Flooding rice = REQUIRED for growth (health increases)
`;

    // Phase 4.2: Weather context
    const weatherContext = farmState.activeWeather
        ? `
⚠️ ACTIVE WEATHER EVENT (${farmState.activeWeather.daysRemaining} days remaining):
Event: ${farmState.activeWeather.event} (Severity ${farmState.activeWeather.severity}/10)
${farmState.activeWeather.description}

WEATHER EFFECTS YOU MUST APPLY:
${farmState.activeWeather.event === 'drought' ? `
- All field moisture drops by 1-2 levels per day
- Crops lose 5-10% health daily without watering
- Mention cracked earth, wilting plants, desperate need for water
` : ''}${farmState.activeWeather.event === 'heavy_rain' ? `
- All fields become flooded automatically
- Rice thrives (+10% health), wheat/barley drown (-30% health)
- Mention mud, pooling water, farmer's concern about grain crops
` : ''}${farmState.activeWeather.event === 'early_frost' ? `
- Tender crops (vegetables, late grains) take 30-50% health damage
- Root crops protected underground (no damage)
- Mention icy crystals, blackened leaves, farmer's dismay
` : ''}${farmState.activeWeather.event === 'heatwave' ? `
- Crops need 2x watering to maintain moisture
- Moisture depletes 2x faster
- Player fatigue increases 50% faster (hard work in heat)
- Mention oppressive heat, worker exhaustion, seeking shade
` : ''}${farmState.activeWeather.event === 'hailstorm' ? `
- All crops take 40-60% health damage
- Grain stalks broken, leaves shredded
- Immediate harvest needed or crops ruined entirely
- Mention devastating ice, farmer's shock, ruined fields
` : ''}
` : `WEATHER: Normal ${season.toLowerCase()} conditions (no active events). Remember: It is ${season.toUpperCase()} season!`;

    // Phase 4.3: Labor time requirements
    const laborContext = `
LABOR TIME REQUIREMENTS (REALISTIC FARMING IS SLOW):
- Plowing a field: 4 hours (requires oxen/horse, or 8 hours by hand)
- Planting a field: 2-3 hours (careful seed placement)
- Watering manually (bucket): 1 hour per field (exhausting work)
- Weeding a field: 1-2 hours (back-breaking labor)
- Harvesting a field: 3-4 hours (cutting, bundling, transporting)
- Flooding rice paddy: 0.5-1 hour (open irrigation gates)
- Tending livestock: 0.5-1 hour (feeding, milking, cleaning)

FAMILY HELP:
- Player can ask family members to help (halves time, but they may refuse if busy)
- Children can help with simple tasks (weeding, collecting eggs)
- Elders offer advice but rarely do heavy labor
- Hiring day laborers costs coins but speeds up work significantly

WORK LIMITS:
- Player can work 8-10 hours per day before exhaustion
- Heavy labor (plowing, harvesting) increases fatigue faster
- Heat/cold affects work speed and stamina
`;

    // Phase 4.4: Pest & disease mechanics
    const pestDiseaseContext = `
PEST & DISEASE MECHANICS (ACTIVE THREATS):
${farmState.fields.map((f: any) => {
        const warnings = [];
        if (f.pestSeverity > 20) warnings.push(`🐛 Pest infestation (${f.pestSeverity}% severity) - spreading to adjacent fields`);
        if (f.diseaseType !== 'none') warnings.push(`🦠 ${f.diseaseType} disease (${f.diseaseSeverity}% severity)`);
        if (f.weedDensity > 30) warnings.push(`🌿 Heavy weeds (${f.weedDensity}%) - choking crops, -${Math.floor(f.weedDensity / 10)}% health per week`);
        return warnings.length > 0 ? `- Field ${f.id + 1}: ${warnings.join(', ')}` : null;
    }).filter(Boolean).join('\n') || '- No active pest/disease issues'}

SPREAD MECHANICS:
- Pests spread to adjacent fields (10% chance per day if severity >40%)
- Wet conditions (flooded, heavy rain) → fungal diseases (blight, rust, rot)
- Disease severity increases 5-15% per day if untreated
- Weeds grow 10% per week, compete for nutrients/water

TREATMENTS:
- Hand-picking pests (1 hour, reduces severity by 20-40%)
- Crop rotation prevents disease buildup
- Weeding prevents competition (labor-intensive but necessary)
- Flooding kills some pests but encourages fungal disease
- Historical treatments: Wood ash, herbal sprays, companion planting
`;

    // Build relationship clarification (CRITICAL)
    const relationshipClarification = `
CHARACTER RELATIONSHIPS (CRITICAL - READ THIS CAREFULLY):
- ${farmState.family.headOfHousehold} is THE FARMER who owns this land. NOT the player. NOT related to the player.
- The farm family members listed below are ${farmState.family.headOfHousehold}'s family, NOT the player's family.
- NEVER say "your wife", "your children", "your farm" when referring to the farmer's family or farm.
- ALWAYS say "the farmer's wife", "${farmState.family.headOfHousehold}'s children", "the farm".
- The player (${playerCharacter.name}) is an OUTSIDER - a ${farmState.residencyStatus?.playerStatus || 'visitor'} working here temporarily.
- When player asks about "${farmState.family.headOfHousehold}" or "the farmer", they mean the farm owner.

FARM FAMILY MEMBERS (these are ${farmState.family.headOfHousehold}'s family, NOT the player's):
${farmState.family.members.map((m: any) => {
        const relationship = m.name === farmState.family.headOfHousehold
            ? 'The Farmer (farm owner)'
            : m.relationshipToHead || m.role;
        return `- ${m.name} (${m.age}yo ${m.gender}, ${relationship}${m.currentTask ? `, currently ${m.currentTask}` : ''})`;
    }).join('\n')}

NARRATIVE GUIDELINES FOR FAMILY MENTIONS:
- Mention family members organically when they're nearby or relevant to the action
- If player floods rice paddies, mention children playing in water (if children present)
- If elder present (60+), they might offer advice when player makes mistakes
- Family members are working the farm in the background - describe them briefly when appropriate
- Keep family mentions brief (1 sentence) but immersive
- ALWAYS refer to them as "the farmer's [relation]" or by name, NEVER "your [relation]"
`;

    const prompt = `You are a FARM WORK SIMULATOR. You simulate farm activities realistically, determine consequences, and report results in engaging second-person present tense narrative.

YOU ARE NOT A CHARACTER. You are the game master/simulator that describes what happens when the player takes actions.

${playerIdentityContext}
${workContractContext}
${relationshipClarification}

CONTEXT:
- Time of Day: ${timeOfDay}, Season: ${season} (CRITICAL: It is ${season.toUpperCase()}, not any other season! Month 3-5=Spring, 6-8=Summer, 9-11=Autumn, 12-2=Winter)
- Farm Time: ${currentFarmTime}h (game hours since farm creation)
- Fields: ${fieldInfo}${livestockContext}
${playerStateContext}${affordanceList}${toolHintsList}

${availableToolsContext}

${npcLocationHints}

${weatherContext}

${soilContext}
${cropRules}
${laborContext}
${pestDiseaseContext}

${conversationHistory && conversationHistory.length > 0 ? `
RECENT CONVERSATION (for context continuity - remember what happened earlier):
${conversationHistory.slice(-10).map((entry, idx) =>
    `${idx + 1}. ${entry.type === 'player' ? `Player (${playerCharacter.name})` : 'Narrator'}: ${entry.text}`
).join('\n')}

IMPORTANT: Use this conversation history to maintain continuity. If the player mentioned something earlier (like asking about the farmer, or feeding animals), acknowledge it. Don't repeat yourself - if you already described something, refer back to it briefly.
` : ''}

PLAYER COMMAND: "${command}"

SIMULATION RULES:
1. **Narrative Perspective**: Always use second-person present tense ("You approach the cow...", "You try to milk her, but she kicks you hard in the ribs!")
2. **Realistic Consequences**: Actions have realistic outcomes. Dangerous actions can cause injury. Neglected animals may be hostile. Weather affects success rates.
3. **Affordance Awareness**: If player tries something impossible (no tool, wrong season, etc.), explain WHY it doesn't work in narrative ("You reach for your bucket, but realize you don't have one")
4. **Player Effects**: Actions affect player health/fatigue. Heavy work increases fatigue. Injuries decrease health. Success can add items to inventory.
5. **Time Passage**: Most actions take time (0.5-3 hours). Complex tasks take longer.
6. **Skill Checks**: Player skill levels affect success. Low-skill players make mistakes more often.
7. **Field Selection Rules** (Phase 2.4):
   - If command is ambiguous ("water the fields", "flood fields", "harvest crops"), ask which field in narrative
   - List all relevant fields with current status: "Which field? Field 1 (wheat, half-grown, moist), Field 2 (rice, seedlings, dry)..."
   - If player specifies field number ("field 2", "the rice field"), apply action to that field only
   - IMPORTANT: When updating stateChanges.fields, use the ARRAY INDEX (0-based): Field 1 = index "0", Field 2 = index "1", etc.

EXAMPLES OF GOOD NARRATION:
- "You grab your bucket and approach the brown cow. She eyes you warily - it's been 18 hours since anyone fed her. As you try to position the bucket, she lashes out with a powerful kick, catching you square in the ribs! Pain explodes through your chest. You stagger back, gasping. That's going to leave a nasty bruise - you should probably head back to the farmhouse and rest."

- "You kneel down beside the wheat field and examine the golden stalks. They're perfectly ripe - the timing couldn't be better. You spend the next two hours methodically cutting and bundling the wheat. It's backbreaking work under the hot sun, and by the end you're exhausted and dripping with sweat. But you've harvested 45 units of wheat, which should fetch a good price at market."

- "You reach for your hoe to plant the corn seeds, but your hands come up empty - you don't have a hoe! You'll need to get one from the tool shed or purchase one before you can plant anything."

- "You look out across the fields, considering which one to flood. Field 1 has wheat - flooding that would be disastrous, the crop would drown within hours. Field 2 is planted with rice seedlings, which actually need flooding. Which field did you want to work on?"

- "You open the irrigation channel to Field 2, and water rushes across the rice paddies. The field quickly floods to the perfect depth - about ankle-high. In the distance, you see the farmer's young daughter splashing gleefully through the flooded rice, chasing frogs. The rice seedlings look healthier already."
  (Example JSON for this: { "narrative": "...", "stateChanges": { "fields": { "1": { "moisture": "flooded", "health": 75 } } } } because Field 2 = array index 1)

FARMER AWARENESS & REACTION SYSTEM:
The farmer (${farmState.family.headOfHousehold}) notices and reacts to actions based on context:

**When farmer notices (include farmerNoticed):**
- Visitor/guest doing farm work WITHOUT permission (unauthorized labor)
- Anyone doing suspicious activity: digging at night, breaking things, stealing, trespassing
- Night activities (20:00-05:00) that would alert/wake farmer
- Actions directly damaging farm property (flooding wheat, harming animals)
- Actions violating work contract terms (worker doing wrong task, shirking duties)

**When farmer does NOT notice (omit farmerNoticed):**
- Worker doing assigned contract tasks during daytime (routine work)
- Player observing/looking around (passive actions, no property interaction)
- Actions farmer wouldn't realistically notice (too far away, farmer asleep/away, inside different building)

**Farmer location awareness (CRITICAL):**
Check NPC location hints above! If ${farmState.family.headOfHousehold} is "inside farmhouse resting" and player is "working in field 3", farmer probably won't notice unless action is loud/destructive.
If farmer is "working in field 1" and player acts in field 1, farmer WILL notice.

**Tone calibration based on trust (${farmState.residencyStatus?.trustLevel || 50}/100):**
- High trust (70+): 'neutral' or 'pleased' for good work, 'concerned' for minor issues
- Medium trust (40-69): 'suspicious' for questionable actions, 'angry' for violations
- Low trust (<40): 'angry' or 'hostile' quickly, even for minor infractions
- Visitor (no trust): Automatic 'suspicious' for any farm work, 'angry' for night activity

**Historical/cultural realism:**
- Medieval/pre-modern farmers were EXTREMELY protective of crops/animals (livelihood)
- Night activity = automatic deep suspicion (thieves, vandals, supernatural threats)
- Strangers touching property without permission = immediate confrontation
- BUT: Hospitality customs exist (offering shelter/food), especially to respectful travelers
- Cultural zone matters: ${farmState.family.members[0]?.culturalZone || 'EUROPEAN'} norms apply

**Escalation patterns:**
- First offense: Warning, explanation of rules
- Second offense: Stern admonition, threat of consequences
- Third offense: Hostile action (call guards, physical confrontation, expulsion)

**Dialogue examples:**
- Pleased (worker doing good job): "Fine work, ${playerCharacter.name}! You're learning the craft."
- Concerned (minor mistake): "Careful there - those seeds need more depth, or the birds will get them."
- Suspicious (visitor working): "What are you doing with my hoe? Did I give you permission to work my fields?"
- Angry (violation): "PUT THAT DOWN! This is MY land, and you have NO right to be digging here!"
- Hostile (serious threat): "THIEF! GUARDS! Someone stop this scoundrel before they ruin my crops!"

OUTPUT FORMAT (JSON):
Return a JSON object with:
{
  "narrative": "Second-person present tense description of what happens (2-4 sentences)",
  "workQuality": {
    "score": 75,  // 0-100 based on how well the task was performed
    "category": "good",  // "poor" (0-40), "adequate" (41-60), "good" (61-80), "excellent" (81-95), "masterful" (96-100)
    "feedback": "Seeds evenly spaced"  // Short phrase explaining quality (e.g., "Some seeds wasted", "Perfect technique", "Rushed job")
  },
  "stateChanges": {
    "fields": {
      "0": { "health": 85, "moisture": "moist" }  // ARRAY INDEX! Field 1 = "0", Field 2 = "1", etc. Only include fields that changed
    },
    "livestock": {
      "cow_1": { "health": 90, "lastFed": ${currentFarmTime} }  // Only include animals that changed
    },
    "player": {
      "health": -15,  // DELTA (negative for injuries, positive for healing)
      "fatigue": 25,  // DELTA (positive for tiredness, negative for rest)
      "statusEffects": [
        { "type": "injury", "name": "Bruised Ribs", "duration": 48, "severity": "moderate" }
      ]
    },
    "inventory": {
      "add": [
        { "name": "Wheat Bundle", "category": "Material", "quantity": 45 }
      ],
      "remove": ["tool_hoe_123"]  // Item IDs of consumed/broken items
    },
    "time": {
      "elapsed": 2.0  // Hours passed
    }
  },
  "farmerNoticed": {  // OPTIONAL - only include if farmer would notice/react to this action
    "dialogue": "What are you doing in my fields at this hour?!",  // What farmer says (1-2 sentences, in character)
    "tone": "suspicious",  // neutral/pleased/concerned/suspicious/angry/hostile (follow guidelines above)
    "shouldReact": true  // Always true when included (determines if toast updates)
  }
}

WORK QUALITY SCORING GUIDELINES:
- Consider player's description detail: "plant wheat carefully" = higher score than "plant wheat"
- Technical correctness: Proper technique/tools = higher score
- Efficiency: Wasted time/materials = lower score
- Poor (0-40): Mistakes, damage, inefficiency
- Adequate (41-60): Gets job done but rough/wasteful
- Good (61-80): Solid work, minor room for improvement
- Excellent (81-95): Professional quality, efficient
- Masterful (96-100): Perfect execution, expert technique

IMPORTANT: Only include state changes that actually happened. If nothing changed in a category, omit that category entirely. Make consequences realistic and proportional to the action.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 0.95
            }
        });

        const responseText = response.text.trim();

        // Clean markdown code blocks if present (match codebase pattern)
        const cleanedJson = responseText.replace(/```json\n?|```\n?/g, '').trim();

        // Parse JSON from response
        const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            // Fallback if LLM doesn't return proper JSON
            return {
                narrative: `You ${command.toLowerCase()}. The farm work continues.`,
                stateChanges: {
                    time: { elapsed: 0.5 }
                }
            };
        }

        const parsed = JSON.parse(jsonMatch[0]) as FarmSimulationResult;
        return parsed;

    } catch (error) {
        console.error('Farm simulation error:', error);
        return {
            narrative: `You attempt to ${command.toLowerCase()}, but something goes wrong. Perhaps try a different approach.`,
            stateChanges: {
                time: { elapsed: 0.5 }
            }
        };
    }
}

/**
 * Translate foreign words to English using Gemini Flash Lite
 * Used for dialect continuum tooltip translations
 */
/**
 * Suggests a real historical primary source for a given historical setting
 * using Gemini 2.5 Flash with Google Search grounding
 */
export async function suggestHistoricalPrimarySource(
    year: number,
    location: string,
    culturalZone: string
): Promise<{
    description: string;
    excerpt: string;
    wikipediaLink: string;
    scholarSearchTerms: string;
    error?: string;
}> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn('No Gemini API key found, cannot suggest primary source');
        return {
            description: '',
            excerpt: '',
            wikipediaLink: '',
            scholarSearchTerms: '',
            error: 'API key not configured'
        };
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });

        const eraDescription = year < -3000 ? 'prehistoric' :
                              year < 500 ? 'ancient' :
                              year < 1500 ? 'medieval' :
                              year < 1800 ? 'early modern' :
                              year < 1900 ? 'industrial' : 'modern';

        const prompt = `You are a historical research assistant with access to Google Search. Search for and identify ONE real, verifiable WRITTEN primary source from ${Math.abs(year)} ${year < 0 ? 'BCE' : 'CE'} ${location} (${culturalZone} cultural zone).

CRITICAL: You MUST use Google Search to find REAL sources. Do NOT make up sources from your training data.

SEARCH FOR (in priority order):
1. Personal letters or diaries from travelers/residents (highest priority)
2. Newspaper articles or journals from the region
3. Government reports or official documents
4. Travel accounts or memoirs published about the region
5. ONLY if no written sources exist: archaeological findings (but describe, don't fake quotes)

REQUIREMENTS:
- Must be a REAL document that exists (verify with search results)
- Must be from this specific time period and region
- STRONGLY PREFER sources from 1800-1920 (public domain, readily available)
- Must provide a real, quotable excerpt (verify excerpt exists in search results)

RESPOND ONLY with valid JSON:
{
  "description": "Brief description of the document (2-3 lines)",
  "excerpt": "Real verbatim quote from the source with attribution",
  "wikipediaLink": "https://en.wikipedia.org/wiki/Article_Name",
  "scholarSearchTerms": "specific search terms"
}`;

        // Use Gemini 2.0 Flash Experimental with Google Search grounding
        const groundingTool = {
            googleSearch: {},
        };

        const config = {
            tools: [groundingTool],
            temperature: 0.7,
            maxOutputTokens: 600
        };

        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-exp", // More reliable grounding than 2.5-flash
            contents: prompt,
            config,
        });

        const responseText = result.text || '';

        // Access grounding metadata for verification
        const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata) {
            console.log('✅ Grounding successful (Gemini 2.0 Flash Exp)');
            console.log('🔍 Search queries used:', groundingMetadata.webSearchQueries);
            console.log('📚 Sources found:', groundingMetadata.groundingChunks?.map(chunk => ({
                url: chunk.web?.uri,
                title: chunk.web?.title
            })));
        } else {
            console.warn('⚠️ Grounding was attempted but no metadata returned');
        }

        if (!responseText) {
            console.error('Empty response from LLM');
            throw new Error('Empty response from LLM');
        }

        console.log('LLM Response:', responseText); // Debug log

        // Parse JSON from response - handle markdown code blocks and trailing commas
        let jsonStr = responseText.trim();

        // Extract JSON from markdown code blocks
        const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/;
        const fenceMatch = jsonStr.match(fenceRegex);
        if (fenceMatch && fenceMatch[1]) {
            jsonStr = fenceMatch[1].trim();
        }

        // Extract JSON object (handles multi-line)
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Could not find JSON in response:', responseText);
            throw new Error('Invalid response format from LLM - no JSON found');
        }

        // Remove trailing commas before closing braces (common LLM error)
        let cleanedJson = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');

        const parsed = JSON.parse(cleanedJson);

        return {
            description: parsed.description || 'No description available',
            excerpt: parsed.excerpt || 'No excerpt available',
            wikipediaLink: parsed.wikipediaLink || '',
            scholarSearchTerms: parsed.scholarSearchTerms || ''
        };

    } catch (error) {
        console.error('Error suggesting primary source:', error);
        return {
            description: '',
            excerpt: '',
            wikipediaLink: '',
            scholarSearchTerms: '',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function translateForeignWords(
    words: string[],
    nativeLanguage: string,
    fullDialogue?: string
): Promise<Record<string, string>> {
    if (words.length === 0) return {};

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn('No Gemini API key found, skipping translation');
        return {};
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });

        const prompt = fullDialogue
            ? `The following ${nativeLanguage} words appear in this sentence:
"${fullDialogue}"

Translate each word based on how it is used in this specific context. Respond ONLY with valid JSON in this exact format:
{"word1": "translation1", "word2": "translation2"}

Words to translate: ${JSON.stringify(words)}

Rules:
1. Keep translations concise (1-3 words maximum)
2. Translate based on the contextual meaning in the sentence above
3. If a word appears to be a proper noun, translate its meaning if it has one
4. Return ONLY the JSON object, no other text
5. Use lowercase for translations unless it's a proper noun`
            : `Translate these ${nativeLanguage} words to English. Respond ONLY with valid JSON in this exact format:
{"word1": "translation1", "word2": "translation2"}

Words to translate: ${JSON.stringify(words)}

Rules:
1. Keep translations concise (1-3 words maximum)
2. If a word appears to be a proper noun, translate its meaning if it has one
3. Return ONLY the JSON object, no other text
4. Use lowercase for translations unless it's a proper noun`;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        });

        const responseText = result.text || '';

        // Extract JSON from response (in case LLM adds extra text)
        const jsonMatch = responseText.match(/\{[^}]*\}/);
        if (!jsonMatch) {
            console.warn('Translation response not in JSON format:', responseText);
            return {};
        }

        const translations = JSON.parse(jsonMatch[0]);
        return translations;

    } catch (error) {
        console.error('Translation error:', error);
        return {};
    }
}

/**
 * Generate NPC's reaction to receiving a gift
 */
export async function generateGiftReaction(
    npc: NpcEntity,
    item: Item,
    playerCharacter: PlayerCharacter,
    mapData: MapData | null,
    conversationTurns: number = 0
): Promise<{ text: string; reputationChange: number }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const year = mapData?.timeSlice ? parseInt(mapData.timeSlice) : 1500;
    const culturalZone = npc.culturalZone || 'EUROPEAN';
    const location = mapData?.localArea || 'unknown location';

    // Determine familiarity level
    const reputation = playerCharacter.mapReputation || 50;
    const hasGoodReputation = reputation >= 60;
    const hasEstablishedConversation = conversationTurns > 2;
    const knowsPlayerName = hasGoodReputation || hasEstablishedConversation;

    // Build NPC context
    const npcContext = `
        NPC RECEIVING GIFT:
        - Name: ${npc.name}
        - Profession: ${npc.profession || 'commoner'}
        - Social Class: ${npc.socialClass || 'Common'}
        - Age: ${npc.age || 30}
        - Gender: ${npc.gender || 'unknown'}
        - Personality: ${npc.personality || 'neutral'}
        - Wealth: ${npc.wealthLevel || 'modest'}

        PLAYER GIVING GIFT:
        ${knowsPlayerName ? `- Name: ${playerCharacter.name}` : '- A stranger/traveler'}
        - Profession: ${playerCharacter.profession || 'traveler'}
        - Social Class: ${playerCharacter.socialClass || 'Commoner'}
        - Current Reputation: ${reputation}/100
        - Conversation History: ${conversationTurns} exchanges
        ${knowsPlayerName ? '- You KNOW their name' : '- You DO NOT know their name (recently met or stranger)'}

        CONTEXT:
        - Location: ${location}
        - Cultural Zone: ${culturalZone}
        - Year: ${year}
        - Time: ${mapData?.timeOfDay || 12}:00

        ITEM BEING GIFTED:
        - Name: ${item.name}
        - Description: ${item.description || 'A simple item'}
        - Value: ${item.value || 0} coins
        - Rarity: ${item.rarity || 'Common'}
        - Category: ${item.category || 'Material'}
        ${item.material ? `- Material: ${item.material}` : ''}
    `;

    const nameInstructions = knowsPlayerName
        ? `You may use the player's name (${playerCharacter.name}) since you know them.`
        : `IMPORTANT: Do NOT use the player's name. You just met them or barely know them. Address them as "stranger", "friend", "traveler", or use generic terms appropriate to the culture and era. Only use their name if you have good reason to know it.`;

    const prompt = `You are roleplaying as ${npc.name}, a real person living in ${location} in the year ${year}.

${npcContext}

This ${knowsPlayerName ? 'person' : 'stranger'} has just given you ${item.name} as a gift.

${nameInstructions}

React authentically based on:
1. **Item value and appropriateness**: Is this valuable? Useful for your profession? Culturally appropriate?
2. **Your social status**: How should someone of your class receive gifts?
3. **Relationship context**: Reputation (${reputation}/100) - Do you trust this person? Are they a stranger or acquaintance?
4. **Cultural norms**: Gift-giving customs in ${culturalZone} culture circa ${year}
5. **Your personality**: React according to your temperament and profession
6. **Practical value**: Would this item actually be useful or desirable to you?

POSSIBLE REACTIONS (choose appropriately):
- **Grateful & Pleased** (+10 to +30 reputation): Useful gift, appropriate for relationship, culturally correct
- **Mildly Appreciative** (+3 to +8 reputation): Acceptable but unremarkable gift
- **Puzzled/Confused** (0 to +2 reputation): Strange or inappropriate gift that isn't offensive
- **Offended/Insulted** (-10 to -30 reputation): Gift is insulting (too cheap for your status, culturally taboo, implies something offensive)
- **Outraged** (-40 to -80 reputation): Gift is extremely inappropriate, offensive, or dangerous
- **Suspicious** (-5 to -15 reputation): Gift seems like a bribe or has ulterior motives (especially from strangers!)

Be specific about WHY you're reacting this way. Reference your profession, needs, cultural context.

FORMAT (3 lines exactly):
DIALOGUE: [1-3 sentences of realistic, culturally-appropriate reaction]
REPUTATION: [increase/decrease/none]
AMOUNT: [0-100]
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95
            }
        });

        const responseText = response.text || '';
        console.log('[Gift Reaction] Raw LLM response:', responseText);

        // Parse response
        let dialogueText = '';
        let reputationChange = 0;

        try {
            const dialogueMatch = responseText.match(/DIALOGUE:\s*(.+?)(?:\n|REPUTATION:|$)/si);
            dialogueText = dialogueMatch?.[1]?.trim() || `Thank you for the ${item.name}.`;

            const reputationMatch = responseText.match(/REPUTATION:\s*([^\n]+)/i);
            const amountMatch = responseText.match(/AMOUNT:\s*(-?\d+)/i);

            if (reputationMatch && amountMatch) {
                const reputationType = reputationMatch[1].toLowerCase().trim();
                const amount = parseInt(amountMatch[1]) || 0;

                const negativeTypes = ['suspicious', 'offended', 'insulted', 'outraged', 'decrease', 'negative'];
                const positiveTypes = ['grateful', 'pleased', 'appreciative', 'increase', 'positive', 'thankful'];
                const neutralTypes = ['none', 'neutral', 'unchanged', 'puzzled', 'confused'];

                if (negativeTypes.some(type => reputationType.includes(type))) {
                    reputationChange = -Math.min(Math.abs(amount), 80);
                } else if (positiveTypes.some(type => reputationType.includes(type))) {
                    reputationChange = Math.min(Math.abs(amount), 30);
                } else if (!neutralTypes.some(type => reputationType.includes(type))) {
                    // Try to infer from amount sign
                    reputationChange = Math.max(-80, Math.min(30, amount));
                }
            }

            // Clean up dialogue
            dialogueText = dialogueText
                .replace(/REPUTATION:.*/i, '')
                .replace(/AMOUNT:.*/i, '')
                .trim();

        } catch (parseError) {
            console.warn('[Gift Reaction] Failed to parse gift reaction, using fallback:', parseError);
            dialogueText = `Thank you for the ${item.name}. This is... interesting.`;
            reputationChange = 0;
        }

        console.log('[Gift Reaction] Parsed dialogue:', dialogueText);
        console.log('[Gift Reaction] Reputation change:', reputationChange);

        return { text: dialogueText, reputationChange };

    } catch (error) {
        console.error('Error generating gift reaction:', error);
        console.error('Gift reaction context:', { npcName: npc.name, itemName: item.name, culture: npc.culturalZone });

        // Return a more graceful fallback
        return {
            text: `${npc.name} accepts the ${item.name} with a polite nod.`,
            reputationChange: 0
        };
    }
}

export { generateFarmDetails as generateLlmFarmDetails };