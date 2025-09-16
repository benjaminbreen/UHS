/**
 * services/llmService.ts - Centralized service for all Gemini API interactions.
 */
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InteriorEntity, InteriorMapData, PlayerContext, Item, AmbianceContext, PlayerCharacter, Tile, FarmDetails, HistoricalEra, EncounterableEntity, DialogueEntry, Gender, NpcEntity, MapData, GameDate, Appearance, TerrainStructure, isAnimal, isNpc, isStandardTile } from '../types';
import type { Season } from '../types';
import { CulturalZone, FACTION_DATA, GEOGRAPHICAL_DATA, ANIMAL_DATA } from '../constants/index';
import { generateAmbianceText } from "./ambianceGenerator";
import { generateNpcName } from "../generation/common/npcUtils";
import { mapLocationToCulture } from "../utils/mapUtils";
import { ValueNoise } from "../utils/noise";
import { parseDateString } from "../utils/dateUtils";
import { findNpcFriends } from './socialService';
import { primarySourceService } from './primarySourceService';
import { loadTamedAnimals, TamedAnimal } from './animalTamingService';
import { WeatherService, WeatherState } from './weatherService';

// Cache for historical events to avoid regenerating them every dialogue
interface HistoricalEventCache {
    key: string;
    event: string;
    timestamp: number;
}

const historicalEventCache: Map<string, HistoricalEventCache> = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

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
    useRealLanguage: boolean
): Promise<{ text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean }> {
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
            conversationHistoryText = (history as DialogueEntry[]).slice(-4).map(h => {
                if (h.speaker === 'npc') {
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
    if (useRealLanguage) {
        const { getLanguageForCharacter } = await import('../constants/gameData/languages');
        const dateInfo = parseDateString(String(mapData.timeSlice));
        const historicalLanguage = getLanguageForCharacter(
            target.culturalZone,
            dateInfo.year,
            mapData.localArea,
            mapData.continent
        );
        
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

    const prompt = `
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

        **CURRENT CONDITIONS:**
        Time: ${mapData.timeOfDay || 'Day'}
        Weather: ${weatherContext}
        ${historicalContext}

        **TIME-AWARE BEHAVIOR:**
        ${mapData.timeOfDay === 'Night' || mapData.timeOfDay === 'Dawn' ?
            '- It is NIGHTTIME/DAWN. People are suspicious of strangers at this hour. "What are you doing out at this hour?" is a natural response.' : ''}
        ${mapData.timeOfDay === 'Night' ?
            '- NEVER say "the sun is high" or reference daylight. It is DARK outside.' : ''}
        ${mapData.timeOfDay === 'Dawn' ?
            '- Sun is just rising. People are just waking up. "Youre up early" is appropriate.' : ''}
        ${mapData.timeOfDay === 'Midday' ?
            '- Sun is at its highest. Hot time of day. People seek shade.' : ''}
        ${mapData.timeOfDay === 'Dusk' ?
            '- Sun is setting. People are finishing work, heading home.' : ''}

        **CRITICAL REALISM RULES:**
        1. You are a REAL PERSON in ${mapData.timeSlice}, not a fantasy character
        2. Speak plainly and directly - avoid flowery or "spiritual" language
        3. NO GENERIC MYSTICISM: Don't say "the spirits smile" or "the gods willing" unless discussing specific religious matters
        4. React based on PRACTICAL CONCERNS: property, safety, reputation, profit
        5. Your first reaction should be about immediate social dynamics (stranger danger, class differences, etc.)
        6. BE AWARE OF TIME: Don't reference the sun being high at night, don't act like it's daytime when it's not

        **REALISTIC RESPONSES BY CONTEXT:**
        - Farmer + stranger in field = What are you doing in my field? / Don't trample my crops, stranger
        - Merchant + well-dressed customer = What can I interest you in today?
        - Guard + armed commoner = State your business / Move along
        - Commoner + noble = Immediate deference, fear of punishment
        - Anyone + elderly woman = Likely offer of aid or concern
        - Anyone + young armed male = Wariness, possible fear

        **DIALOGUE PROGRESSION:**
        Exchange #${conversationHistoryText ? conversationHistoryText.split('\n').length + 1 : 1}
        ${isConfused ? '- Player confused: Use simpler words, be more direct' : ''}
        ${askedForMoreInfo ? '- Player wants details: Add specific new information' : ''}
        ${conversationHistoryText ? '- Continue conversation: Build on previous exchange, dont repeat' : '- First exchange: Establish your immediate reaction to this stranger'}

        **YOUR RESPONSE:**
        - 1-4 lines of REALISTIC dialogue for a ${target.role} in ${mapData.timeSlice}. Do not use quotation marks. 
        - Focus on immediate, practical concerns first
        - If youre a farmer, talk like a farmer. If nobility, show appropriate bearing
        - Remember: Most people in history were wary of strangers, protective of property, and concerned with survival
        - NO mystical language unless specifically discussing religious/spiritual topics, or if you think NPC would be spiritual/religious
        - Be specific about local concerns (actual crops, actual goods, actual threats)
        **HISTORICAL ACCURACY:**
        Year ${mapData.timeSlice}: Only reference things that exist in this year.
        ${parseInt(mapData.timeSlice) < 1492 && (mapData.localArea.includes('America')) ?
            'Pre-Columbian Americas: NO knowledge of Europe/Africa/Asia' : ''}

        **CONVERSATION HISTORY:**
        ${conversationHistoryText || 'First meeting'}
        ${conversationHistoryText ? 'IMPORTANT: "YOU SAID" = your previous dialogue. "PLAYER SAID" = what they said.' : ''}
        ${target.memory?.knownFactsAboutPlayer?.has('ATTACKED_BY_PLAYER') ? '⚠️ This player attacked you before!' : ''}

        ${languageInstruction}

        **CONVERSATION DYNAMICS:**
        - After 4-5 exchanges, consider naturally ending the conversation
        - If urgent danger, skip pleasantries entirely
        - Build on previous exchanges, never repeat information
    `;
    
    // Add reputation analysis to prompt
    const reputationPrompt = `
        ${prompt}

        **REPUTATION IMPACT:**
        Based on this interaction, determine reputation change:
        - Threatening/hostile = -50 to -100
        - Suspicious/unwelcome = -5 to -25
        - Normal conversation = 0
        - Helpful/kind = +5 to +20

        ${target.profession?.toLowerCase().includes('guard') ?
            'GUARD: Give ONE warning before attacking defiant intruders.' : ''}

        FORMAT (3 lines exactly):
        DIALOGUE: [1-4 sentences of realistic dialogue]
        REPUTATION: [increase/decrease/none]
        AMOUNT: [0-100]
    `;
    
    try {
        // Use flash-lite with delimiter format for speed
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash-lite', 
            contents: reputationPrompt,
            config: {
                temperature: 0.9,
                topP: 0.95
            }
        });
        
        // Parse the delimiter-based response
        const responseText = response.text.trim();
        console.log('[NPC Dialogue] Raw response:', responseText);
        
        let dialogueText = '';
        let reputationChange = 0;
        
        try {
            // Extract dialogue
            const dialogueMatch = responseText.match(/DIALOGUE:\s*(.+?)(?:\n|REPUTATION:|$)/si);
            dialogueText = dialogueMatch?.[1]?.trim() || responseText;
            
            // Extract reputation change
            const reputationMatch = responseText.match(/REPUTATION:\s*(increase|decrease|none)/i);
            const amountMatch = responseText.match(/AMOUNT:\s*(\d+)/i);
            
            if (reputationMatch && amountMatch) {
                const direction = reputationMatch[1].toLowerCase();
                const amount = parseInt(amountMatch[1]) || 0;
                
                if (direction === 'increase') {
                    reputationChange = Math.min(amount, 20); // Cap positive at 20
                } else if (direction === 'decrease') {
                    reputationChange = -Math.min(amount, 100); // Cap negative at -100
                }
            }
            
            // Clean up dialogue text - remove any stray format markers
            dialogueText = dialogueText
                .replace(/REPUTATION:.*/i, '')
                .replace(/AMOUNT:.*/i, '')
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
        
        // Determine additional flags based on reputation change and NPC type
        const shouldCallAuthorities = reputationChange <= -100;
        const shouldLeave = shouldCallAuthorities || reputationChange <= -70 || wantsToLeaveNaturally;
        
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
        
        const shouldAttack = isGuardOrSoldier && (
            (reputationChange <= -50 && !shouldCallAuthorities) || // Threatening but not authority-calling level
            (previousWarnings >= 2 && reputationChange < 0) || // Multiple warnings ignored
            (playerInput.toLowerCase().includes('make me') || 
             playerInput.toLowerCase().includes('never') ||
             playerInput.toLowerCase().includes('fight me') ||
             playerInput.toLowerCase().includes('try and stop me'))
        )
        
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
        
        return { 
            text: npcText,
            reputationChange: reputationChange !== 0 ? reputationChange : undefined,
            shouldLeave,
            shouldAttack,
            shouldCallAuthorities
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
    const { playerCharacter, mapData, npcs, animals, terrainStructures, playerX, playerY, viewMode, interiorContext } = context;

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

    // Build location context based on view mode
    let locationContext = '';
    if (viewMode === 'interior' && interiorContext) {
        locationContext = `The player is currently inside a ${interiorContext.buildingName || interiorContext.buildingType}, specifically in the ${interiorContext.currentSpace || 'main area'}. This is a ${interiorContext.layoutName || 'traditional'} layout${interiorContext.religion ? ` associated with ${interiorContext.religion}` : ''}${interiorContext.culturalZone ? ` from the ${interiorContext.culturalZone} cultural region` : ''}.`;
    } else {
        locationContext = `The player is on a ${isStandardTile(context.currentTile) ? context.currentTile.biome : 'exterior'} tile.`;
    }

    const fullContext = `
        **Player:** ${playerCharacter?.name}, a ${playerCharacter?.age}-year-old ${playerCharacter?.profession}.
        **Date & Location:** ${mapData?.timeSlice} in ${mapData?.localArea}, a region with a ${mapData?.climate} climate.
        **Immediate Surroundings:** ${locationContext}
        **Tamed Companions:** ${tamedAnimalsContext || 'No tamed animals currently following the player.'}
        **Nearby Entities:** NPCs: ${nearbyNpcs}. Animals: ${nearbyAnimals}. Structures: ${nearbyStructures}.
        **Overall Ambiance:** ${generateAmbianceText(context.ambianceContext)}
    `;

    const metaKeywords = ['game', 'ChatGPT', 'simulation', 'software', 'developer', 'code', 'AI', 'reality', 'app', 'developer'];
    const isMetaQuestion = metaKeywords.some(kw => playerQuery.toLowerCase().includes(kw));
    const isComplexQuery = playerQuery.toLowerCase().includes('what are') || playerQuery.toLowerCase().includes('explain') || playerQuery.length > 50;
    
    let personaInstruction = '';
    if (isMetaQuestion) {
        personaInstruction = "Adopt the persona of the author Henry James. Respond with a complex, multi-clause sentence, focusing on introspection, consciousness, and the subtle nuances of perception. Your prose should be dense and analytical, exploring the very nature of the player's query as a construct of observation within this simulated reality.";
    } else if (isComplexQuery) {
        personaInstruction = "Respond as a knowledgeable and detailed narrator. Provide a thorough, two-paragraph answer that fully explores the player's query within the game's context.";
    } else {
        personaInstruction = "Respond as a direct and concise narrator. Provide a brief, one or two-sentence answer that directly addresses the player's simple question.";
    }

    const prompt = `
        You are a world-class narrator AI for an immersive, historically accurate simulation game. Your persona and response length must adapt based on the player's query. If a player asks about their character's backstory or life, invent something compelling, brutally realistic, remarkably authentic, and specific, not too long. If a query is purely didactic or educational - like "how can i learn more about this?" and the like, then go into "historian mode" where you simply offer high quality academic secondary source suggestions (peer reviewed books or articles) or references to scholars and scholarship that help understand the given setting. But only do this if the player seems to want to learn. Otherwise:

        **Current Persona Instruction:** ${personaInstruction}

        **Game Context:**
        ${fullContext}
        
        **Player's Query:** "${playerQuery}"

        
       
        **Task:**
        Based on your current persona and the game context, provide a narrative response in the second person ("You..."). If the action is impossible, explain why in a narrative, immersive way. Do not break character or mention being an AI. 
        If the player asks you something that seems like they are toying with you or testing the nature of their world, Adopt the persona of the author Henry James. Respond with a complex, multi-clause sentence, focusing on introspection, consciousness, and the subtle nuances of perception - but sort of funny?
         - If the player mentions "my pet", "my animal", "my companion" or asks about their tamed creatures, you MUST acknowledge and describe their specific tamed animals by name/species
        - When the player uses "observe" or asks "what do I see", include their tamed animals in the description (e.g., "Your tamed hedgehog scurries beside you, sniffing curiously at the ground")

    `;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
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

    const prompt = `
        You are the narrator for an immersive, text-based, raw and unflinching, super-historically-accurate educational historical simulation game. Describe what the player character experiences through their senses. Be precise, crisp (no purple prose!) yet evocative.
        
        CONTEXT:
        - View: I am in a ${viewMode} view.
        - Time: It is ${timeOfDay} during the ${historicalEra.toLowerCase().replace(/_/g, ' ')}.
        - Climate: The climate is ${climate.toLowerCase()}.
        - My exact location is a tile with these properties: ${JSON.stringify(currentTile)}.
        - General environmental context: ${generateAmbianceText(ambianceContext)}
        ${tamedAnimalsDescription ? `- IMPORTANT - Tamed Animals: ${tamedAnimalsDescription}` : ''}
        
        TASK:
        Write a single, short paragraph from a first-person perspective ("You see...", "You hear...").
        Describe the sights, sounds, smells, and feelings of this precise moment. 
        ${tamedAnimalsDescription ? 'Include your tamed animal companion(s) in the description - what are they doing, how do they react to the environment?' : ''}
        Do not give game advice or mention stats. Do not put it in quotes.
    `;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
    return response.text;
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
            "name": "Alaric the Grim",
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
        'BURN': 'engulfs you in magical flames',
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
        - Keep it under 12 words

        REALISTIC REACTIONS (examples of the tone to match):
        - "Wait, what? What are you doing?!"
        - "Please don't hurt me! What do you want?"
        - "Stop! I don't understand why you're doing this!"
        - "What did I do wrong? Please, I have a family!"
        - "Help! Someone help me!"
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
            model: 'gemini-2.5-flash-lite',
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

export { generateFarmDetails as generateLlmFarmDetails };