/**
 * services/llmService.ts - Centralized service for all Gemini API interactions.
 */
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InteriorEntity, InteriorMapData, PlayerContext, Item, AmbianceContext, PlayerCharacter, Tile, FarmDetails, HistoricalEra, EncounterableEntity, DialogueEntry, Gender, NpcEntity, MapData, GameDate, Appearance, TerrainStructure, isAnimal, isNpc, isStandardTile } from '../types';
import { CulturalZone, FACTION_DATA, GEOGRAPHICAL_DATA, ANIMAL_DATA } from '../constants/index';
import { generateAmbianceText } from "./ambianceGenerator";
import { generateNpcName } from "../generation/common/npcUtils";
import { mapLocationToCulture } from "../utils/mapUtils";
import { ValueNoise } from "../utils/noise";
import { parseDateString } from "../utils/dateUtils";
import { findNpcFriends } from './socialService';
import { primarySourceService } from './primarySourceService';
import { loadTamedAnimals, TamedAnimal } from './animalTamingService';


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
            if (isDomestic) remarkability = 'not too unusual but still noteworthy';
            if (isExotic) remarkability = 'VERY UNUSUAL and eye-catching';
            if (isPredator) remarkability = 'DANGEROUS and alarming';
            
            return `a tamed ${animal.speciesName} (${remarkability})`;
        }).join(', ');
        
        return `
        - **IMPORTANT - TAMED ANIMALS WITH THEM:** The player has ${animalDescriptions} following them
        - **YOU MUST REACT TO THIS:** This is ${tamedAnimals.length === 1 ? 'an unusual sight' : 'a very unusual sight'} that demands comment
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
            conversationHistoryText = (history as DialogueEntry[]).slice(-4).map(h => `${h.speaker}: ${h.text}`).join('\n');
        }
    }
    
    // Get historical context from primary sources
    let primarySourceContext = '';
    try {
        const dateInfo = parseDateString(String(mapData.timeSlice));
        const culturalZone = mapLocationToCulture(mapData.localArea, dateInfo.year);
        
        // Calculate NPC birth year based on current year and age
        const currentYear = dateInfo.year;
        const npcBirthYear = currentYear - (target.age || 30);
        
        // Preload and get sources most relevant to when the NPC was born/lived
        await primarySourceService.preloadContext(dateInfo.era as HistoricalEra, culturalZone as CulturalZone);
        const relevantSources = await primarySourceService.getTemporallyRelevantSources(
            npcBirthYear, 
            3, // Get top 3 most relevant sources
            dateInfo.era as HistoricalEra, 
            culturalZone as CulturalZone
        );
        
        if (relevantSources.length > 0) {
            primarySourceContext = `
        
        **HISTORICAL CONTEXT FROM PRIMARY SOURCES:**
        ${relevantSources.map(source => `
        From "${source.title}" (${source.author}, ${Math.abs(source.year)} ${source.year < 0 ? 'BCE' : 'CE'}):
        "${source.excerpt}"
        `).join('\n')}
        
        This historical context should subtly inform your worldview and speech patterns, but don't quote these sources directly unless specifically asked about them.`;
        }
    } catch (error) {
        console.error('Error fetching primary sources for NPC dialogue:', error);
    }

    const languageInstruction = useRealLanguage 
        ? `**CRITICAL LANGUAGE DIRECTIVE:** 
        You MUST respond in the historically and linguistically accurate language for your character based on:
        - Year: ${mapData.timeSlice}
        - Location: ${mapData.localArea}, ${mapData.continent || 'Unknown Region'}
        - Cultural Zone: ${target.culturalZone}
        - Your Class/Role: ${target.class} ${target.role}
        
        **SPECIFIC LANGUAGE REQUIREMENTS:**
        
        ANCIENT LANGUAGES (Pre-500 CE):
        - Mesopotamia/Babylon (3000-500 BCE): Use Akkadian or Sumerian phrases
        - Egypt (3000 BCE-300 CE): Use Ancient Egyptian/Coptic phrases
        - Greece (800 BCE-300 CE): Use Ancient Greek (transliterated)
        - Rome/Italy (500 BCE-500 CE): Use Classical Latin
        - India (1500 BCE-500 CE): Use Sanskrit or Prakrit
        - China (1000 BCE-500 CE): Use Classical Chinese
        - Celtic Europe (500 BCE-500 CE): Use Proto-Celtic or Gaulish approximations
        - Germania (100 BCE-500 CE): Use Proto-Germanic reconstructions
        - Americas (Pre-1492):
          - Mesoamerica: Use Nahuatl (Aztec), Maya, or other regional languages
          - Andes: Use Quechua or Aymara
          - North America Pacific Coast (including Columbia River): Use Chinook Jargon or approximate Coast Salish/Chinookan languages
          - North America Plains: Use proto-Siouan or proto-Algonquian
        - Indus Valley (3000-1500 BCE): Use speculative Proto-Dravidian reconstructions
        
        MEDIEVAL LANGUAGES (500-1500 CE):
        - England (500-1100): Use Old English (Anglo-Saxon)
        - England (1100-1400): Use Middle English (like Chaucer)
        - France (800-1300): Use Old French
        - Iberia (700-1200): Mix Arabic with Old Spanish/Portuguese
        - Scandinavia (800-1300): Use Old Norse
        - Russia (900-1400): Use Old Church Slavonic
        - Japan (800-1600): Use Classical Japanese (with appropriate keigo)
        - Middle East (600-1500): Use Classical Arabic or Persian
        - Mongolia/Steppes (1200-1400): Use Middle Mongolian
        
        EARLY MODERN (1500-1800):
        - Use period-appropriate Early Modern versions of languages
        - Include archaic grammar, vocabulary, and spelling

        ANY OTHER LANGUAGE: given the specific setting, do your best to provide dialogue in the most historically authentic language you know of, even if its a reach. If you are roleplaying as someone in 5000 BCE in Europe, start speaking in Proto-Indo-European, and so forth. Fill in the blanks and use all your knowledge. 
        
        **LINGUISTIC AUTHENTICITY RULES:**
        1. Use actual words and phrases from the target language - do NOT use modern versions
        2. For reconstructed/extinct languages, use approximations, but never switch to english. 
        3. Include appropriate honorifics, titles, and social markers
        4. Use a wide range of words, expressions, rhetorical tones, and styles, and be voluble and realistic. 
        5. Do NOT provide translations or explanations
        6. If the exact language is unknown (like pre-Columbian Columbia River), make your best scholarly approximation based on linguistic reconstruction
        7. NEVER default to English - always attempt the historical language
        
        **EXAMPLES OF CORRECT RESPONSES:**
        - Roman merchant, 100 CE: "Salve, amice. Quid mercari vis hodie?"
        - Viking trader, 900 CE: "Hvat viltu kaupa, útlendingr?"
        - Aztec priest, 1400 CE: "Tlein ticnequi, teotl tlacatl?"
        - Medieval English peasant, 1350 CE: "What woldest thou, gode sire?"
        - Japanese samurai, 1580 CE: "Nanigoto de gozaru ka, tabi no kata?"
        - Chinookan fisher, Columbia River, 10 CE: "Ikta mika tikéh?" (Chinook Jargon approximation)
        - Ancient Egyptian scribe, 1350 BCE: "ỉw.k m-ḫd ỉḫ.t" (hieroglyphic transliteration)
        - Sumerian merchant, 2500 BCE: "ana šu-ka damgar" 
        
        **YOUR RESPONSE MUST BE ENTIRELY IN THE APPROPRIATE HISTORICAL LANGUAGE.**`
        : `**Language Rules:** Respond in English.`;


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

    const prompt = `
        You are roleplaying as ${target.name}, a ${target.age}-year-old ${target.role} in ${mapData.timeSlice} ${mapData.localArea}.
        
        **CRITICAL INSTRUCTION:** Think like a real person in this exact historical moment. Consider:
        - What would genuinely shock or alarm someone in my position at this time and place?
        - What are the real dangers and concerns of my era?
        - How would someone of my social class and profession realistically react?
        - What would I notice first about this stranger? (or are they plausibly someone you might know?)
        
        **EXAMPLES OF REALISTIC CONTEXTUAL RESPONSES:**
        
        Example 1 - Occupied France 1940, telephone operator meets RAF pilot:
        Player: "I am a British pilot, my plane was shot down"
        NPC: "Mon Dieu! British? Here? Quick, get inside before someone sees you! The Germans patrol this road!"
        (Notice: Immediate recognition of danger, practical urgency, no time for pleasantries)
        
        Example 2 - Medieval village 1348, peasant meets wealthy merchant:
        Player: "Good day, I seek lodging"
        NPC: "Lodging? In these times? Half the village is dead or dying. Try the monastery, if the monks still live."
        (Notice: Plague context dominates response, class difference secondary to crisis)
        
        Example 3 - Colonial America 1692, farmer meets strange woman with herbs:
        Player: "I gathered these herbs to help the sick"
        NPC: "Herbs? Healing? Best be careful with such talk, stranger. They hanged Goody Brown for less."
        (Notice: Witch trial paranoia shapes response to seemingly innocent action)
        
        Example 4 - Roman Britain 125 CE, local merchant meets Germanic tribesman:
        Player: "I come from across the Rhine, seeking trade"
        NPC: "Germanic? The legions just crushed a rebellion. You're either very brave or very foolish to announce that here."
        (Notice: Recent military context makes origin significant)
        
        **NOW YOUR SITUATION:**
        Setting: ${mapData.timeSlice} ${mapData.localArea}
        You see: ${playerCharacter.name}, appearing to be a ${playerCharacter.profession}
        They just said: "${playerInput}"
        
        Previous interaction: ${conversationHistoryText || 'This is your first exchange'}
        
        **YOUR TASK:**
        Respond as a real person would in this exact historical moment. Consider:
        1. What about this person would immediately stand out in my time/place?
        2. What recent events or current dangers would shape my reaction?
        3. What would someone of my role/class say in this situation?
        4. How would I realistically respond to what they just said?
        
        Your initial response should be just a sentence or even a word or two. In subsequent responses give between 1 and 4 lines of natural dialogue. Don't repeat previous statements. React authentically.

        ${languageInstruction}

        **YOUR CHARACTER CONTEXT:**
        - Class: ${(target.class || 'commoner').toLowerCase()}
        - Personality: ${target.backstory}
        - Health: ${target.health?.currentDiseases?.length > 0 ? 
            `SICK with ${target.health.currentDiseases[0].disease.name}` : 'Healthy'}
        - Previous interactions with player: ${previousSummaries || target.memory?.conversationSummaries?.join('; ') || 'None - first meeting'}
        - Player's reputation: ${playerCharacter.mapReputation}/100
        
        **CONVERSATION HISTORY:**
        ${conversationHistoryText || 'This is your first exchange'}
        
        ${primarySourceContext}
        
        **CRITICAL RULES:**
        - ONLY provide dialogue, no actions or narration
        - Stay in character for your role, age, and social class
        - Use period-appropriate language and concerns
        - Don't repeat things you've already said in this conversation
    `;
    
    // Create a more sophisticated prompt for reputation analysis
    const reputationPrompt = `
        ${prompt}
        
        ADDITIONALLY, analyze the situation and determine the reputation impact:
        - Is this NPC discovering an enemy combatant? (-100 reputation)
        - Is the player threatening violence? (-50 reputation)  
        - Is this a criminal being discovered? (-75 reputation)
        - Is the NPC calling for authorities? (-100 reputation)
        - Is this a dangerous historical situation where the player doesn't belong? (-50 to -100)
        - Is the player being helpful/kind? (+5 to +20)
        - Is this a normal conversation? (0 to +/-5)
        
        Return JSON with:
        {
            "dialogue": "The NPC's response",
            "reputationChange": number (-100 to +20),
            "shouldCallAuthorities": boolean,
            "reasoning": "Brief explanation of reputation change"
        }
    `;
    
    try {
        // Use standard flash model for better coherence
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: reputationPrompt,
            config: {
                temperature: 0.8,
                topP: 0.95,
                responseMimeType: "application/json"
            }
        });
        
        let responseData;
        try {
            responseData = JSON.parse(response.text.trim());
        } catch (parseError) {
            // Fallback to old behavior if JSON parsing fails
            console.warn('Failed to parse LLM JSON response, falling back to text analysis');
            const npcText = response.text.trim().replace(/"/g, '');
            
            // Basic text analysis for fallback
            let reputationChange = 0;
            let shouldLeave = false;
            let shouldAttack = false;
            
            const lowerText = npcText.toLowerCase();
            
            // Check for hostile reactions
            if (lowerText.includes('guards!') || lowerText.includes('authorities') || 
                lowerText.includes('arrest') || lowerText.includes('treason')) {
                shouldAttack = false;
                shouldLeave = true;
                reputationChange = -100; // Severe reputation loss for being reported
            } else if (lowerText.includes('attack') || lowerText.includes('kill you')) {
                shouldAttack = true;
                reputationChange = -50;
            } else if (lowerText.includes('leave') || lowerText.includes('go away')) {
                shouldLeave = true;
                reputationChange = -10;
            }
            
            return { 
                text: npcText,
                reputationChange: reputationChange !== 0 ? reputationChange : undefined,
                shouldLeave,
                shouldAttack,
                shouldCallAuthorities: reputationChange <= -100
            };
        }
        
        // Successfully parsed JSON response
        const npcText = responseData.dialogue || responseData.text || '';
        let reputationChange = responseData.reputationChange || 0;
        
        // Ensure reputation changes are significant when appropriate
        if (responseData.shouldCallAuthorities) {
            reputationChange = Math.min(reputationChange, -100);
        }
        
        console.log(`[NPC Dialogue] Reputation change: ${reputationChange}, Reason: ${responseData.reasoning || 'None provided'}`);
        
        return { 
            text: npcText,
            reputationChange: reputationChange !== 0 ? reputationChange : undefined,
            shouldLeave: responseData.shouldCallAuthorities || reputationChange <= -50,
            shouldAttack: false, // Authorities don't attack, they arrest
            shouldCallAuthorities: responseData.shouldCallAuthorities || false,
            reasoning: responseData.reasoning
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
        model: 'gemini-2.5-flash', 
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

    const metaKeywords = ['game', 'real', 'simulation', 'exist', 'purpose', 'developer', 'code', 'AI', 'reality', 'app', 'developer'];
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
        You are a world-class narrator AI for an immersive, historically accurate simulation game. Your persona and response length must adapt based on the player's query.

        **Current Persona Instruction:** ${personaInstruction}

        **Game Context:**
        ${fullContext}
        
        **Player's Query:** "${playerQuery}"

        **Important Instructions for Animal Companions:**
        - If the player mentions "my pet", "my animal", "my companion" or asks about their tamed creatures, you MUST acknowledge and describe their specific tamed animals by name/species
        - When the player uses "observe" or asks "what do I see", include their tamed animals in the description (e.g., "Your tamed hedgehog scurries beside you, sniffing curiously at the ground")
        - Describe how the tamed animals behave and react to the environment
        - Note how NPCs or wild animals react to seeing the player with tamed creatures

        **Task:**
        Based on your current persona and the game context, provide a narrative response in the second person ("You..."). If the action is impossible, explain why in a narrative, immersive way. Do not break character or mention being an AI. 
        If the player asks you something that seems like they are toying with you or testing the nature of their world, Adopt the persona of the author Henry James. Respond with a complex, multi-clause sentence, focusing on introspection, consciousness, and the subtle nuances of perception - but sort of funny?
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
        model: 'gemini-2.5-flash',
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
        3.  Write a compelling 2-paragraph **backstory** that fits their stats and new role. The backstory should hint at their personality and a recent significant event in their life.

        Return ONLY a valid JSON object with the keys: "name", "profession", and "backstory".
        Example response:
        {
            "name": "Alaric the Grim",
            "profession": "Exiled Blacksmith",
            "backstory": "Alaric was once the most sought-after blacksmith in the capital, his skill with steel matched only by his fiery temper. After a dispute with a powerful guild master left a nobleman's prize stallion shod incorrectly, he was forced to flee under threat of imprisonment."
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
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
        : `Respond in character with a short, spoken line. Decide if the player's words are convincing enough to make you stop fighting.`;

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
        : `Respond with a short, spoken line, reacting to the item being used on you. Your reaction should be in-character.`;

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
        
        Style: Stream-of-consciousness, emotional, personal, raw, sometimes even shocking inner thoughts - fragmentary and strange, with lots of ellipses. rarely sentences or full thoughts, but super authentic to real subjectivity, like something from Virginia Woolf's THE WAVES or Henry James, yet also very much in keeping with the tone, setting, and worldview of the given character in time and place. Fellini-esque, fragmentary, Lynchian. 
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dialogue: { type: Type.STRING },
                        counterOffer: { type: Type.STRING },
                        willNegotiate: { type: Type.BOOLEAN }
                    },
                    required: ["dialogue", "willNegotiate"]
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

export { generateFarmDetails as generateLlmFarmDetails };