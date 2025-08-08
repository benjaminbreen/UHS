/**
 * services/llmService.ts - Centralized service for all Gemini API interactions.
 */
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { InteriorEntity, InteriorMapData, PlayerContext, Item, AmbianceContext, PlayerCharacter, Tile, FarmDetails, HistoricalEra, EncounterableEntity, DialogueEntry, Gender, NpcEntity, MapData, GameDate, Appearance, isAnimal, isNpc, isStandardTile } from '../types';
import { CulturalZone, FACTION_DATA, GEOGRAPHICAL_DATA, ANIMAL_DATA } from '../constants/index';
import { generateAmbianceText } from "./ambianceGenerator";
import { generateNpcName } from "../generation/common/npcUtils";
import { mapLocationToCulture } from "../utils/mapUtils";
import { ValueNoise } from "../utils/noise";
import { parseDateString } from "../utils/dateUtils";
import { findNpcFriends } from './socialService';


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
            model: 'gemini-2.5-flash',
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
    history: DialogueEntry[],
    playerInput: string,
    playerCharacter: PlayerCharacter | null,
    allNpcs: NpcEntity[],
    mapData: MapData | null,
    useRealLanguage: boolean
): Promise<{ text: string }> {
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
    const conversationHistoryText = history.slice(-4).map(h => `${h.speaker}: ${h.text}`).join('\n');

    const languageInstruction = useRealLanguage 
        ? `**Language Rules:** Respond ONLY in the historically and culturally appropriate language for your character. Based on your context (Year ${mapData.timeSlice}, Location: ${mapData.localArea}), determine this language. For example, if you are a Roman soldier in 45 AD, you speak Latin. If you are a samurai in 1580 Japan, you speak Japanese. DO NOT provide a translation.`
        : `**Language Rules:** Respond in English.`;


    const prompt = `
        You are an advanced AI roleplaying as a character in a gritty, historically accurate history simulation game.
        You MUST respond ONLY with a short line of spoken dialogue from your character's perspective. Do not add actions or descriptions.

        ${languageInstruction}

        **YOUR CHARACTER'S CONTEXT:**
        - **Name:** ${target.name}
        - **Identity:** You are a ${target.age}-year-old ${(target.gender || 'person').toLowerCase()} ${target.role} of the ${(target.class || 'commoner').toLowerCase()} class from around the year ${mapData.timeSlice}.
        - **Appearance:** You are ${formatAppearance(target)}
        - **Personality & Backstory:** ${target.backstory}
        - **Core Beliefs:** ${formatBeliefs(target)}
        - **Your Memories of the Player:** 
          ${target.memory.conversationSummaries.length > 0 ? target.memory.conversationSummaries.map(s => `- ${s}`).join('\n') : "- You have no significant memories of this person."}
        
        **THE PLAYER YOU ARE TALKING TO:**
        - **Name:** ${playerCharacter.name}
        - **Identity:** They are a ${playerCharacter.age}-year-old ${(playerCharacter.gender || 'person').toLowerCase()} ${playerCharacter.profession} of the ${playerCharacter.class?.toLowerCase() || 'adventurer'} class.
        - **Appearance:** They are ${formatAppearance(playerCharacter)}
        - **Their Reputation:** Your general opinion of this person is based on their local reputation, which is currently (${playerCharacter.mapReputation}/100, where 0 is hated/despised and 100 is loved/respected). Adjust your tone accordingly. Low reputation means you are wary, suspicious, or hostile. High reputation means you are more open and friendly.

        **THE SITUATION:**
        - **Date & Location:** The year is ${mapData.timeSlice}, in ${mapData.localArea}.
        - **Recent Conversation:**
        ${conversationHistoryText}
        - **The Player just said to you:** "${playerInput}"

        **YOUR TASK AND RULES (MANDATORY):**
        1.  **Stay in Character:** Respond ONLY with spoken dialogue.
        2.  **Be Historically Accurate:** Your reaction MUST be based on your identity and context. Consider the player's gender, social class, and profession.
        3.  **Detect Anachronisms:** If the player says something that makes no sense for your time period (e.g., mentions a 'computer', 'democracy', 'the internet'), you MUST react with confusion, suspicion, or dismissal. Do not understand the anachronism.
        4.  **Use Your Memory:** If the conversation relates to something you've discussed before (see "Your Memories"), acknowledge it.
        5.  **Factor in Reputation:** Adjust your tone based on the player's reputation score.
        6.  **Be Concise:** Your response must be 1-3 sentences, unless there is a genuine need for it to be longer.
        7.  **Output Format:** Your entire response must be ONLY the dialogue text. Do not add quotes.
    `;
    
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
        return { text: response.text.trim().replace(/"/g, '') };
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
        **Nearby Entities:** NPCs: ${nearbyNpcs}. Animals: ${nearbyAnimals}. Structures: ${nearbyStructures}.
        **Overall Ambiance:** ${generateAmbianceText(context.ambianceContext)}
    `;

    const metaKeywords = ['game', 'real', 'simulation', 'exist', 'purpose', 'developer', 'code', 'AI'];
    const isMetaQuestion = metaKeywords.some(kw => playerQuery.toLowerCase().includes(kw));
    const isComplexQuery = playerQuery.toLowerCase().includes('what are') || playerQuery.toLowerCase().includes('explain') || playerQuery.length > 50;
    
    let personaInstruction = '';
    if (isMetaQuestion) {
        personaInstruction = "Adopt the persona of the author Henry James. Respond with long, complex, multi-clause sentences, focusing on introspection, consciousness, and the subtle nuances of perception. Your prose should be dense and analytical, exploring the very nature of the player's query as a construct of observation within this simulated reality.";
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

        **Task:**
        Based on your current persona and the game context, provide a narrative response in the second person ("You..."). If the action is impossible, explain why in a narrative, immersive way. Do not break character or mention being an AI.
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

    const prompt = `
        You are the narrator for an immersive, text-based, super-historically-accurate educational historical simulation game. Describe what the player character experiences through their senses. Be poetic, evocative, and detailed.
        
        CONTEXT:
        - View: I am in a ${viewMode} view.
        - Time: It is ${timeOfDay} during the ${historicalEra.toLowerCase().replace(/_/g, ' ')}.
        - Climate: The climate is ${climate.toLowerCase()}.
        - My exact location is a tile with these properties: ${JSON.stringify(currentTile)}.
        - General environmental context: ${generateAmbianceText(ambianceContext)}
        
        TASK:
        Write a single, short paragraph from a first-person perspective ("You see...", "You hear...").
        Describe the sights, sounds, smells, and feelings of this precise moment. Do not give game advice or mention stats. Do not put it in quotes.
    `;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
    return response.text;
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
            model: 'gemini-2.5-flash',
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


export { generateFarmDetails as generateLlmFarmDetails };