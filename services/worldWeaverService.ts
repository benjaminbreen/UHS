/**
 * WorldWeaver Service
 * Interprets natural language prompts to create historical game settings
 */

import { GoogleGenAI } from "@google/genai";
import { generateMapAreaListForPrompt, isValidMapAreaName } from '../utils/generateMapAreaList';
import { findZoneForMapArea } from '../utils/mapAreaLookup';
import { eventService } from './eventService';
import { llmEventService } from './llmEventService';
import { GAME_MODES, suggestGameMode } from '../constants/gameData/gameModes';
import { GameMode, EventArchetype, SpecialNPC } from '../types/eventTypes';
import { DISEASES } from '../constants/gameData/diseases';
import { mapQuestAnalyzer, QuestLocation } from './mapQuestAnalyzer';
import { MapData } from '../types';

export interface CharacterSpecification {
  name?: string;
  age?: number;
  gender?: 'male' | 'female';
  profession?: string;
  health?: 'healthy' | 'average' | 'unhealthy' | 'sickly';
  socialClass?: 'peasant' | 'commoner' | 'merchant' | 'noble';
  traits?: string[];
  disease?: string; // Disease ID like BUBONIC_PLAGUE
  ethnicity?: 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN'; // Character's ethnic/cultural background
  customBackstory?: string; // LLM-generated backstory specific to the scenario (deprecated)
  characterDescription?: string; // Brief 1-2 sentence character description for InitialScenarioModal
  customItems?: Array<{ // LLM-generated items specific to the profession/scenario
    name: string;
    description: string;
    value: number;
    weight: number;
    category: string;
    stackable?: boolean;
    wearable?: boolean;
  }>;
}

export interface QuestStage {
  id: string;
  description: string;
  objective: string;
  locationHint?: string;
  completionTrigger: 'talk_to_npc' | 'reach_location' | 'obtain_item' | 'survive_days' | 'defeat_enemy';
  targetId?: string;
  targetLocation?: [number, number];
  dialogue?: string[];
  rewards?: Array<{
    type: 'item' | 'reputation' | 'skill' | 'knowledge';
    value: string | number;
  }>;
}

export interface QuestNPC {
  id: string;
  name: string;
  role: string;
  personality: string;
  appearance?: string;
  location?: [number, number];
  profession?: string;
  stages: {
    [stageId: string]: {
      dialogue: string[];
      givesItem?: string;
      triggersNextStage?: boolean;
      requiresItem?: string;
    };
  };
}

export interface WorldWeaverQuest {
  title: string;
  description: string;
  historicalContext: string;
  stages: QuestStage[];
  specialNPC: {
    name: string;
    profession: string;
    personality: string;
    location: { x: number; y: number };
    ethnicity?: 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
  };
  // Legacy support for old format
  specialNPCs?: QuestNPC[];
  branches?: {
    [stageId: string]: {
      choice: string;
      leadsTo: string; // next stage ID
    }[];
  };
}

export interface WorldWeaverResult {
  success: boolean;
  year?: number;
  mapArea?: string;
  zone?: string;
  region?: string;
  explanation?: string;
  reasoning?: string;
  suggestion?: string;
  errorMessage?: string;
  characterSpec?: CharacterSpecification;
  gameMode?: GameMode;
  customEvents?: EventArchetype[];
  specialNPCs?: SpecialNPC[];
  quest?: WorldWeaverQuest; // NEW: The elaborate quest
}

// Generate the exact list of valid map areas from the game data
const MAP_AREAS_LIST = generateMapAreaListForPrompt();
// console.log('[WorldWeaverService] Generated map areas list with', MAP_AREAS_LIST.split('\n').length, 'lines');

// Generate list of available diseases for the prompt
const DISEASE_LIST = DISEASES.map(d => `- ${d.id}: ${d.name} (${d.severity})`).join('\n');
// console.log('[WorldWeaverService] Generated disease list with', DISEASES.length, 'diseases');

const WORLD_WEAVER_PROMPT = `You are WorldWeaver, an AI that converts user prompts into historical game settings and player characters.

Given ANY user input, extract TWO things:
1. SETTING: A specific year and map area
2. CHARACTER: Optional player character specifications (if mentioned)

TIME PERIOD GUIDELINES:
- Neolithic/Stone Age: -5000 to -3000
- Bronze Age: -3000 to -1200  
- Iron Age: -1200 to -500
- Classical Antiquity: -500 to 500
- Medieval: 500 to 1453
- Renaissance: 1453 to 1600
- Early Modern: 1600 to 1800
- Industrial: 1800 to 1900
- Modern: 1900 to 2020

Always try to interpret the prompt creatively to find a valid historical setting.

CHARACTER EXTRACTION RULES:
- Look for character details like age, gender, name, profession, health status, social class, diseases, ethnicity
- IMPORTANT: If a specific person's name is mentioned (especially famous historical figures), PRESERVE IT in the name field
- ETHNICITY: Determine ethnicity from name patterns and historical context. Use these values:
  - EUROPEAN: Western/Central/Northern European names (Hans, Margaret, Giovanni, etc.)
  - EAST_ASIAN: Chinese, Japanese, Korean, Mongolian names (Li Wei, Akiko, Kim, etc.)
  - MENA: Middle Eastern, North African, Turkish, Persian names (Hassan, Fatima, Omar, etc.)
  - SOUTH_ASIAN: Indian, Pakistani, Bangladeshi, Sri Lankan names (Raj, Priya, Ahmed, etc.)
  - SUB_SAHARAN_AFRICAN: African names south of Sahara (Kwame, Amara, Jomo, etc.)
  - SOUTH_AMERICAN: Indigenous South American names (Atahualpa, Chuya, etc.)
  - NORTH_AMERICAN_PRE_COLUMBIAN: Native American names (Sequoya, Pocahontas, etc.)
  - OCEANIA: Pacific Islander, Aboriginal Australian names (Kailani, Wiremu, etc.)
- Examples:
  - "35 year old female spy" → age: 35, gender: "female", profession: "spy"
  - "unhealthy peasant named Hans" → health: "unhealthy", socialClass: "peasant", name: "Hans", ethnicity: "EUROPEAN"
  - "young merchant" → profession: "merchant", traits: ["young"]
  - "sickly noble woman" → health: "sickly", socialClass: "noble", gender: "female"
  - "peasant with the plague" → socialClass: "peasant", disease: "BUBONIC_PLAGUE"
  - "soldier suffering from typhus" → profession: "soldier", disease: "TYPHUS"
  - "Margaret Mead in 1950" → name: "Margaret Mead", profession: "Anthropologist", gender: "female", ethnicity: "EUROPEAN"
  - "Napoleon Bonaparte" → name: "Napoleon Bonaparte", profession: "Emperor", socialClass: "noble", ethnicity: "EUROPEAN"
  - "Ibn Battuta" → name: "Ibn Battuta", profession: "Explorer", ethnicity: "MENA"
  - "Li Wei the merchant" → name: "Li Wei", profession: "Merchant", ethnicity: "EAST_ASIAN"
  - "Marie Curie" → name: "Marie Curie", profession: "Scientist", gender: "female"
- If NO character is specified, leave characterSpec as null

DISEASE EXTRACTION:
If the prompt mentions a disease or illness, match it to one of these available diseases:
${DISEASE_LIST}

Disease matching examples:
- "plague", "black death", "bubonic plague" → disease: "BUBONIC_PLAGUE"
- "smallpox", "pox" → disease: "SMALLPOX"
- "cholera" → disease: "CHOLERA"
- "typhus", "typhoid" → disease: "TYPHUS"
- "flu", "influenza", "grippe" → disease: "INFLUENZA"
- "tuberculosis", "consumption", "TB" → disease: "TUBERCULOSIS"
- "leprosy", "Hansen's disease" → disease: "LEPROSY"
- "malaria", "ague", "fever" → disease: "MALARIA"
- "dysentery", "bloody flux" → disease: "DYSENTERY"

HISTORICAL FIGURES:
When a specific historical person is named in the prompt, you MUST:
1. Preserve their exact name in characterSpec.name
2. Set appropriate profession based on what they're known for
3. Set appropriate gender if known
4. Set appropriate ethnicity based on their origins
5. Examples:
   - "Margaret Mead" → name: "Margaret Mead", profession: "Anthropologist", gender: "female", ethnicity: "EUROPEAN"
   - "Christopher Columbus" → name: "Christopher Columbus", profession: "Explorer", gender: "male", ethnicity: "EUROPEAN"
   - "Cleopatra" → name: "Cleopatra", profession: "Pharaoh", gender: "female", socialClass: "noble", ethnicity: "MENA"
   - "Mozart" → name: "Wolfgang Amadeus Mozart", profession: "Composer", gender: "male", ethnicity: "EUROPEAN"
   - "Joan of Arc" → name: "Joan of Arc", profession: "Knight", gender: "female", ethnicity: "EUROPEAN"
   - "Zheng He" → name: "Zheng He", profession: "Admiral", gender: "male", ethnicity: "EAST_ASIAN"
   - "Ibn Battuta" → name: "Ibn Battuta", profession: "Explorer", gender: "male", ethnicity: "MENA"

SETTING EXTRACTION:
Examples of how to interpret prompts for settings:
- "french revolution" → 1793 "Paris Basin"
- "sandwich" → 1760s "London" (Earl of Sandwich era)
- "pirates" → 1715 "Greater Antilles" (Golden Age of Piracy)
- "robinson crusoe" → 1659 "Lesser Antilles" (uninhabited island)
- "tea" → 1773 "Boston Harbor" (Boston Tea Party)
- "gold rush" → 1849 "Sacramento Valley" (California Gold Rush)
- "neolithic" or "stone age" → -5000 to -3000 (choose appropriate location)
- "bronze age" → -3000 to -1200 (choose appropriate location)
- "ancient egypt" → -1500 "Lower Nile Valley" or "Upper Nile Valley"
- "ancient rome" → 100 "Central Italy"
- "turkey" or "anatolia" → "Cappadocian Highlands" (for inland Turkey)
- "mesopotamia" or "babylon" → "Mesopotamia"
- "space", "astronaut", "cosmonaut", "yuri gagarin", "space station", "orbit" → 1961-1990 "Outer Space"
- "submarine", "u-boat", "underwater", "deep sea", "ocean floor", "atlantis" → 1915 (WWI) or 1942 (WWII) "Undersea " (with trailing space)
- "heaven", "paradise", "afterlife", "angel", "divine realm", "pearly gates" → 1500 "Heaven"
- "dream", "nightmare", "ethereal", "surreal" → any year "Heaven" or "Undersea " (choose based on tone)

CRITICAL REQUIREMENT: You MUST select a map area name that appears EXACTLY in the list below. Do not create variations, do not use similar names, do not use city names that aren't listed. ONLY use the exact names from this list:

${MAP_AREAS_LIST}

ABSOLUTE RULES:
1. The mapArea field MUST contain an EXACT name from the list above
2. Do NOT make up area names
3. Do NOT use city/state/country names unless they appear in the list
4. If you want New York area, use "Hudson Valley" (if it's in the list)
5. If you want Boston area, use "Boston Harbor" (if it's in the list)
6. Copy the name EXACTLY as it appears, including capitalization

Return JSON only:
{
  "success": true/false,
  "year": number,
  "mapArea": "EXACT name from list - COPY AND PASTE, no variations!",
  "explanation": "Brief explanation of the setting and connection to the prompt",
  "reasoning": "1-2 sentences explaining why you chose this specific date and location",
  "suggestion": "1 sentence suggesting what the player might try doing in this setting",
  "characterSpec": {
    "name": "string or null",
    "age": number or null,
    "gender": "male" or "female" or null,
    "profession": "string or null",
    "health": "healthy" or "average" or "unhealthy" or "sickly" or null,
    "socialClass": "peasant" or "commoner" or "merchant" or "noble" or null,
    "traits": ["array", "of", "traits"] or null,
    "disease": "DISEASE_ID from list above or null"
  } or null
}

If you cannot find a suitable connection or cannot interpret the prompt, return:
{
  "success": false,
  "errorMessage": "Could not interpret prompt"
}`;

class WorldWeaverService {
  async interpretPrompt(userPrompt: string): Promise<WorldWeaverResult> {
    // console.log('[WorldWeaverService] interpretPrompt called with:', userPrompt);
    
    if (!userPrompt || userPrompt.trim().length === 0) {
      return {
        success: false,
        errorMessage: "Please enter a historical scenario"
      };
    }

    // Easter eggs: Check for special zone prompts
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Space keywords
    const spaceKeywords = ['space', 'cosmos', 'galaxy', 'stars', 'planet', 'alien', 'astronaut', 'moon', 'mars', 'asteroid', 'nebula', 'rocket'];
    if (spaceKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Space easter egg triggered!');
      return {
        success: true,
        year: 2150, // Future year for space
        mapArea: 'Outer Space',
        explanation: 'Venturing into the cosmic void...',
        reasoning: 'You have discovered the mysteries of outer space!',
        suggestion: 'Explore the infinite cosmos, but beware - the edges of space lead to unexpected destinations.',
        characterSpec: null
      };
    }
    
    // Heaven keywords
    const heavenKeywords = ['heaven', 'paradise', 'afterlife', 'celestial', 'angels', 'divine', 'ethereal', 'pearly gates'];
    if (heavenKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Heaven easter egg triggered!');
      return {
        success: true,
        year: 1350, // Medieval by default
        mapArea: 'Heaven',
        explanation: 'Ascending to the celestial realm...',
        reasoning: 'You have found the path to Heaven!',
        suggestion: 'Walk among the clouds in eternal peace. The edges of Heaven lead back to the mortal world.',
        characterSpec: null
      };
    }
    
    // Undersea keywords
    const underseaKeywords = ['undersea', 'underwater', 'atlantis', 'ocean depths', 'submarine', 'deep sea', 'merfolk', 'aquatic kingdom'];
    if (underseaKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Undersea Kingdom easter egg triggered!');
      return {
        success: true,
        year: 1500, // Age of exploration
        mapArea: 'Undersea Kingdom',
        explanation: 'Descending to the ocean depths...',
        reasoning: 'You have discovered the legendary undersea realm!',
        suggestion: 'Explore the glowing blue depths. Swimming off the edge will return you to the surface world.',
        characterSpec: null
      };
    }
    
    // Storm Realm keywords
    const stormKeywords = ['storm', 'tempest', 'maelstrom', 'chaos', 'whirlwind', 'cyclone'];
    if (stormKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Storm Realm easter egg triggered!');
      return {
        success: true,
        year: 1600,
        mapArea: 'Storm Realm',
        explanation: 'Entering the dimension of eternal storms...',
        reasoning: 'You have found the chaotic Storm Realm!',
        suggestion: 'Navigate the swirling winds and waters. The edges lead to random worlds.',
        characterSpec: null
      };
    }
    
    // Frozen Wastes keywords
    const frozenKeywords = ['frozen', 'ice realm', 'crystal dimension', 'arctic void', 'eternal winter'];
    if (frozenKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Frozen Wastes easter egg triggered!');
      return {
        success: true,
        year: 1800,
        mapArea: 'Frozen Wastes',
        explanation: 'Entering the realm of eternal ice...',
        reasoning: 'You have discovered the Frozen Wastes!',
        suggestion: 'Walk among the ice crystals. The edges lead to warmer worlds.',
        characterSpec: null
      };
    }
    
    // Typhoon Realm keywords
    const typhoonKeywords = ['typhoon', 'hurricane', 'tropical storm', 'monsoon'];
    if (typhoonKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      // console.log('[WorldWeaverService] Typhoon Realm easter egg triggered!');
      return {
        success: true,
        year: 1900,
        mapArea: 'Typhoon Realm',
        explanation: 'Entering the realm of endless hurricanes...',
        reasoning: 'You have found the Typhoon Realm!',
        suggestion: 'Brave the eternal storms. The edges lead to calmer lands.',
        characterSpec: null
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = WORLD_WEAVER_PROMPT + `\n\nUser prompt: "${userPrompt}"\n\nCreate a historical setting or explain why you cannot.`;
      
      // console.log('[WorldWeaverService] Sending to LLM...');
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-preview-09-2025', 
        contents: fullPrompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      });
      
      let response = result.text;
      // console.log('[WorldWeaverService] Raw LLM response:', response);
      
      // Track API call with input/output
      eventService.trackAPICall(fullPrompt, response);
      // console.log('[WorldWeaverService] API call tracked with history');
      
      // Remove markdown code blocks if present
      response = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      // console.log('[WorldWeaverService] Cleaned response:', response);

      // Parse the JSON response
      try {
        const result = JSON.parse(response);
        // console.log('[WorldWeaverService] Parsed result:', result);
        
        if (result.success) {
          // Validate that the map area is actually valid
          if (!isValidMapAreaName(result.mapArea)) {
            console.error('[WorldWeaverService] LLM returned invalid map area:', result.mapArea);
            console.log('[WorldWeaverService] Attempting to find closest match...');
            
            // Try to find the zone/region from the response for fallback
            const zoneRegion = findZoneForMapArea(result.mapArea);
            if (zoneRegion) {
              console.log('[WorldWeaverService] Found zone/region for fallback:', zoneRegion);
              return {
                success: true,
                year: result.year,
                mapArea: result.mapArea, // Keep the invalid one for logging
                zone: zoneRegion.zone,
                region: zoneRegion.region,
                explanation: result.explanation,
                reasoning: result.reasoning,
                suggestion: result.suggestion,
                characterSpec: result.characterSpec || null
              };
            }
            
            return {
              success: false,
              errorMessage: `Invalid map area: ${result.mapArea}`
            };
          }
          
          console.log('[WorldWeaverService] Valid map area! Returning:', {
            year: result.year,
            mapArea: result.mapArea,
            characterSpec: result.characterSpec
          });
          
          // Find the zone and region for this valid area
          const zoneRegion = findZoneForMapArea(result.mapArea);
          
          return {
            success: true,
            year: result.year,
            mapArea: result.mapArea,
            zone: zoneRegion?.zone,
            region: zoneRegion?.region,
            explanation: result.explanation,
            reasoning: result.reasoning,
            suggestion: result.suggestion,
            characterSpec: result.characterSpec || null
          };
        } else {
          console.log('[WorldWeaverService] Failed with error:', result.errorMessage);
          return {
            success: false,
            errorMessage: result.errorMessage || "Could not interpret prompt"
          };
        }
      } catch (parseError) {
        console.error('[WorldWeaverService] Failed to parse JSON:', parseError);
        console.error('[WorldWeaverService] Response was:', response);
        return {
          success: false,
          errorMessage: "Failed to generate setting"
        };
      }
    } catch (error) {
      console.error('WorldWeaver error:', error);
      return {
        success: false,
        errorMessage: "Service temporarily unavailable"
      };
    }
  }

  /**
   * Generate a complete scenario with game mode, events, and NPCs
   */
  async generateScenario(userPrompt: string): Promise<WorldWeaverResult> {
    console.log('[WorldWeaverService] Generating complete scenario for:', userPrompt);
    
    // First, interpret the basic prompt
    const baseResult = await this.interpretPrompt(userPrompt);
    
    if (!baseResult.success || !baseResult.year || !baseResult.mapArea) {
      return baseResult;
    }

    try {
      // Enhance character details if we have a character spec with profession
      if (baseResult.characterSpec?.profession) {
        console.log('[WorldWeaverService] Enhancing character details...');
        baseResult.characterSpec = await this.enhanceCharacterDetails(
          baseResult.characterSpec,
          baseResult.year,
          baseResult.mapArea,
          userPrompt
        );
      }
      
      // Determine the appropriate game mode
      const gameMode = this.determineGameMode(userPrompt, baseResult.characterSpec);
      console.log('[WorldWeaverService] Selected game mode:', gameMode.name);
      
      // Set the game mode in the event service
      eventService.setGameMode(gameMode);
      
      // Generate a map-aware quest based on the scenario
      // Note: mapData and playerLocation should be provided by the caller
      const quest = await this.generateQuest(
        userPrompt,
        baseResult.year!,
        baseResult.mapArea!,
        baseResult.characterSpec,
        gameMode
        // mapData and playerLocation will be added by the calling component
      );
      
      return {
        ...baseResult,
        gameMode,
        quest,
        customEvents: [], // Empty for now - quest replaces this
        specialNPCs: [] // Empty for now - quest NPCs replace this
      };
    } catch (error) {
      console.error('[WorldWeaverService] Error generating scenario:', error);
      return baseResult; // Return base result even if enhancement fails
    }
  }

  /**
   * Determine the best game mode based on the prompt
   */
  private determineGameMode(prompt: string, characterSpec?: CharacterSpecification): GameMode {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for mode keywords in prompt
    if (lowerPrompt.includes('survive') || lowerPrompt.includes('plague') || 
        lowerPrompt.includes('famine') || lowerPrompt.includes('escape')) {
      return GAME_MODES.find(m => m.id === 'survival')!;
    }
    
    if (lowerPrompt.includes('explore') || lowerPrompt.includes('discover') || 
        lowerPrompt.includes('expedition') || lowerPrompt.includes('captain')) {
      return GAME_MODES.find(m => m.id === 'exploration')!;
    }
    
    if (lowerPrompt.includes('merchant') || lowerPrompt.includes('trade') || 
        lowerPrompt.includes('business') || lowerPrompt.includes('wealth')) {
      return GAME_MODES.find(m => m.id === 'commerce')!;
    }
    
    if (lowerPrompt.includes('scholar') || lowerPrompt.includes('research') || 
        lowerPrompt.includes('study') || lowerPrompt.includes('university')) {
      return GAME_MODES.find(m => m.id === 'scholarship')!;
    }
    
    if (lowerPrompt.includes('lead') || lowerPrompt.includes('rule') || 
        lowerPrompt.includes('govern') || lowerPrompt.includes('mayor')) {
      return GAME_MODES.find(m => m.id === 'leadership')!;
    }
    
    if (lowerPrompt.includes('diplomat') || lowerPrompt.includes('negotiate') || 
        lowerPrompt.includes('ambassador') || lowerPrompt.includes('peace')) {
      return GAME_MODES.find(m => m.id === 'diplomacy')!;
    }
    
    if (lowerPrompt.includes('law') || lowerPrompt.includes('judge') || 
        lowerPrompt.includes('justice') || lowerPrompt.includes('court')) {
      return GAME_MODES.find(m => m.id === 'legal')!;
    }
    
    // Use character profession to suggest mode
    if (characterSpec?.profession) {
      return suggestGameMode(characterSpec.profession);
    }
    
    // Default to livelihood mode for ordinary people
    return GAME_MODES.find(m => m.id === 'livelihood')!;
  }

  /**
   * Build historical context string
   */
  private buildHistoricalContext(year: number, location: string, characterSpec?: CharacterSpecification): string {
    const profession = characterSpec?.profession || 'commoner';
    const socialClass = characterSpec?.socialClass || 'commoner';
    
    let context = `${location} in ${year}`;
    
    if (year < 0) {
      context = `${location} in ${Math.abs(year)} BCE`;
    }
    
    context += `. Player is a ${socialClass} ${profession}`;
    
    // Add era-specific context
    if (year >= 1347 && year <= 1353 && location.includes('Europe')) {
      context += ' during the Black Death pandemic';
    } else if (year >= 1845 && year <= 1852 && location.includes('Ireland')) {
      context += ' during the Great Famine';
    } else if (year >= 1914 && year <= 1918) {
      context += ' during World War I';
    } else if (year >= 1929 && year <= 1939) {
      context += ' during the Great Depression';
    }
    
    return context;
  }

  /**
   * Get player context string
   */
  private getPlayerContext(characterSpec?: CharacterSpecification): string {
    if (!characterSpec) {
      return 'An ordinary person trying to survive';
    }
    
    const parts = [];
    
    if (characterSpec.name) parts.push(characterSpec.name);
    if (characterSpec.age) parts.push(`age ${characterSpec.age}`);
    if (characterSpec.gender) parts.push(characterSpec.gender);
    if (characterSpec.profession) parts.push(characterSpec.profession);
    if (characterSpec.socialClass) parts.push(`${characterSpec.socialClass} class`);
    
    return parts.join(', ') || 'An ordinary person';
  }

  /**
   * Generate a map-aware, historically-grounded quest
   */
  async generateQuest(
    userPrompt: string,
    year: number,
    location: string,
    characterSpec?: CharacterSpecification,
    gameMode?: GameMode,
    mapData?: MapData,
    playerLocation?: { x: number; y: number }
  ): Promise<WorldWeaverQuest | undefined> {
    console.log('[WorldWeaverService] Generating quest for:', { year, location, gameMode: gameMode?.name });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // PHASE 1: Analyze the map if data is provided
      let locationPrompt = '';
      let availableLocations: QuestLocation[] = [];

      if (mapData && playerLocation) {
        console.log('[WorldWeaverService] Analyzing map for quest locations...');
        availableLocations = mapQuestAnalyzer.extractQuestLocations(mapData, playerLocation);

        if (availableLocations.length > 0) {
          locationPrompt = `\n\nACTUAL MAP LOCATIONS AVAILABLE:
${mapQuestAnalyzer.formatLocationsForPrompt(availableLocations)}

IMPORTANT: Use ONLY the locations listed above with their EXACT coordinates.`;
          console.log(`[WorldWeaverService] Found ${availableLocations.length} locations for quest generation`);
        } else {
          console.warn('[WorldWeaverService] No suitable quest locations found on map');
        }
      } else {
        console.log('[WorldWeaverService] No map data provided, generating abstract quest');
      }

      const prompt = `Create a simple, historically accurate SCENARIO for ${location} in ${year}.

CONTEXT:
- Year: ${year}
- Location: ${location}
- Player Character: ${characterSpec ? `${characterSpec.profession || 'commoner'}, ${characterSpec.socialClass || 'commoner'} class` : 'ordinary person'}
- Game Mode: ${gameMode?.name || 'Survival'}
- Original Request: "${userPrompt}"${locationPrompt}

CRITICAL TONE AND LANGUAGE REQUIREMENTS:
THIS IS A HYPER-REALISTIC HISTORY SIMULATOR, NOT A FANTASY RPG!
- NEVER use fantasy RPG terminology like "quest", "lore", "mystic", "arcane," or fan fic type names like "Elara Vance"
- Use realistic, historically appropriate language
- Instead of "quest", think: task, mission, assignment, job, request, problem, situation
- Make objectives sound like real activities, not game objectives
- Examples:
  - WRONG: "Seek the mystic sage"
  - RIGHT: "Consult with the local physician"

HISTORICAL ACCURACY REQUIREMENTS:
- DO NOT create generic tasks that lazily borrow fantasy tropes
- The scenario MUST reflect the actual historical situation of ${location} in ${year}
- Consider: What was REALLY happening in ${location} during ${year}? Wars? Trade? Discovery? Politics?
- The NPC's profession should be authentic to that specific time and place
- BE CREATIVE! Each scenario should feel like it could ONLY happen in this exact setting

REQUIREMENTS:
1. 1-3 stages maximum. Be succinct.
2. 1 special NPC only
3. Use ONLY these objective types: talk_to_npc, visit_location, collect_item, deliver_item
4. Each stage must be completable with existing game mechanics
5. If map locations are provided, use their exact coordinates
6. Scenario MUST be historically specific to ${location} in ${year}
7. Use REALISTIC language appropriate for a history simulation

EXAMPLES OF REALISTIC HISTORICAL SCENARIOS (adapt to YOUR context):
- 18th century French sailor: "The Smuggler's Route" - evade customs officials with contraband goods
- Medieval Cairo merchant: "The Spice Monopoly" - negotiate exclusive trade agreements with suppliers
- Ancient Chinese farmer: "The Irrigation Dispute" - resolve water rights conflict with neighboring farms
- Renaissance Italian soldier: "The Coded Message" - intercept enemy military correspondence
- 1950s American scientist: "The Grant Proposal" - secure funding from the research foundation

SCENARIO STRUCTURE:
{
  "title": "[Create realistic title using period-appropriate language]",
  "description": "[1-2 sentences describing a real historical situation, NOT fantasy language]",
  "historicalContext": "[2-3 evocative sentences about the setting and atmosphere of ${location} in ${year}. Paint a vivid picture of the time and place, mentioning key historical events, technologies, or social conditions that define this era.]",
  "stages": [
    {
      "id": "stage1",
      "objective": "[Realistic action using historically accurate terminology]",
      "completionTrigger": "talk_to_npc",
      "targetLocation": {"x": 45, "y": 23}
    }
  ],
  "specialNPC": {
    "name": "[Culturally appropriate name for ${location}]",
    "profession": "[Actual job that existed in ${location} during ${year}]",
    "personality": "[Realistic personality, not fantasy archetypes]",
    "location": {"x": 45, "y": 23},
    "ethnicity": "[EUROPEAN|EAST_ASIAN|MENA|SOUTH_ASIAN|SUB_SAHARAN_AFRICAN|SOUTH_AMERICAN|NORTH_AMERICAN_PRE_COLUMBIAN|OCEANIA - based on character's name/origin]"
  }
}

Return JSON only. USE REALISTIC HISTORICAL LANGUAGE, NOT FANTASY RPG TERMINOLOGY!`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: prompt,
        generationConfig: {
          temperature: 0.6,  // Reduced for more consistent coordinate usage
          maxOutputTokens: 600  // Much reduced from 1500
        }
      });

      let result = response.text;
      console.log('[WorldWeaverService] Quest generation response:', result);

      // Track API call
      eventService.trackAPICall(prompt, result);

      // Clean and parse response
      result = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const quest = JSON.parse(result) as WorldWeaverQuest;

      // PHASE 2: Validate and fix coordinates if map data was provided
      if (availableLocations.length > 0) {
        const validatedQuest = this.validateAndFixQuestCoordinates(quest, availableLocations);
        return validatedQuest;
      }

      console.log(`[WorldWeaverService] Generated quest "${quest.title}" with ${quest.stages.length} stages`);
      console.log(`[WorldWeaverService] NPC: ${quest.specialNPC?.name} at coordinates:`, quest.specialNPC?.location);

      return quest;
      
    } catch (error) {
      console.error('[WorldWeaverService] Failed to generate quest:', error);
      // Return a simple fallback quest
      return {
        title: 'Survive the Times',
        description: `Life in ${location} during ${year} is challenging. Find a way to survive and thrive.`,
        historicalContext: `${location} in ${year} was a time of change and uncertainty.`,
        stages: [
          {
            id: 'stage1',
            description: 'Find someone who knows the local situation',
            objective: 'Talk to a local resident',
            completionTrigger: 'talk_to_npc',
            dialogue: ['These are difficult times...', 'You should be careful around here.']
          },
          {
            id: 'stage2',
            description: 'Secure basic necessities',
            objective: 'Obtain food and shelter',
            completionTrigger: 'obtain_item',
            targetId: 'food'
          }
        ],
        specialNPC: {
          name: 'Local Resident',
          profession: 'Survivor',
          personality: 'Cautious but helpful',
          location: playerLocation || { x: 50, y: 50 }
        },
        specialNPCs: [] // Legacy support
      };
    }
  }

  /**
   * Validate and fix quest coordinates to ensure they match available map locations
   */
  private validateAndFixQuestCoordinates(quest: WorldWeaverQuest, availableLocations: QuestLocation[]): WorldWeaverQuest {
    const validCoords = availableLocations.map(loc => `${loc.coordinates.x},${loc.coordinates.y}`);

    console.log('[WorldWeaverService] Validating quest coordinates...');
    console.log('[WorldWeaverService] Available coordinates:', validCoords);

    // Validate stage coordinates
    quest.stages.forEach((stage, index) => {
      if (stage.targetLocation) {
        const stageCoords = `${stage.targetLocation.x},${stage.targetLocation.y}`;
        if (!validCoords.includes(stageCoords)) {
          console.warn(`[WorldWeaverService] Invalid coordinates in stage ${index + 1}: ${stageCoords}`);
          // Fallback to nearest valid location
          const fallback = availableLocations[index % availableLocations.length];
          stage.targetLocation = fallback.coordinates;
          console.log(`[WorldWeaverService] Fixed stage ${index + 1} coordinates to:`, fallback.coordinates);
        } else {
          console.log(`[WorldWeaverService] Stage ${index + 1} coordinates validated:`, stage.targetLocation);
        }
      }
    });

    // Validate NPC coordinates
    if (quest.specialNPC?.location) {
      const npcCoords = `${quest.specialNPC.location.x},${quest.specialNPC.location.y}`;
      if (!validCoords.includes(npcCoords)) {
        console.warn(`[WorldWeaverService] Invalid NPC coordinates: ${npcCoords}`);
        // Fallback to first valid location
        quest.specialNPC.location = availableLocations[0].coordinates;
        console.log(`[WorldWeaverService] Fixed NPC coordinates to:`, quest.specialNPC.location);
      } else {
        console.log(`[WorldWeaverService] NPC coordinates validated:`, quest.specialNPC.location);
      }
    }

    return quest;
  }

  /**
   * Enhance character with custom backstory and items based on the scenario
   */
  async enhanceCharacterDetails(
    characterSpec: CharacterSpecification,
    year: number,
    location: string,
    userPrompt: string
  ): Promise<CharacterSpecification> {
    console.log('[WorldWeaverService] Enhancing character details for:', characterSpec);

    if (!characterSpec.profession) {
      return characterSpec; // Can't enhance without a profession
    }

    // Check if this is a specific historical figure
    const isHistoricalFigure = characterSpec.name && (
      userPrompt.toLowerCase().includes(characterSpec.name.toLowerCase()) ||
      // Common historical figures
      ['Margaret Mead', 'Beethoven', 'Mozart', 'Napoleon', 'Cleopatra', 'Joan of Arc',
       'Christopher Columbus', 'Marie Curie', 'Albert Einstein', 'Charles Darwin',
       'Leonardo da Vinci', 'Galileo', 'Shakespeare', 'Julius Caesar'].some(name =>
        characterSpec.name?.toLowerCase().includes(name.toLowerCase())
      )
    );

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const historicalFigureInstructions = isHistoricalFigure ? `
IMPORTANT: This is the ACTUAL historical figure ${characterSpec.name}!
- You MUST create a backstory about the REAL ${characterSpec.name}
- Reference their ACTUAL life, work, and historical significance
- Do NOT create a fictional character with this name
- Example: If this is Margaret Mead, mention her actual anthropological work, Columbia University, Samoa research, etc.
` : '';

      const prompt = `
You are creating a historically accurate character for an educational history simulation game. This may be a real historical figure, or a fictional but realistic one.

CONTEXT:
- Year: ${year}
- Location: ${location}
- Character: ${characterSpec.name || `${characterSpec.age || 30} year old ${characterSpec.gender || 'person'}`} who is a ${characterSpec.profession}
- Social Class: ${characterSpec.socialClass || 'commoner'}
- Original Scenario: "${userPrompt}"
${historicalFigureInstructions}

TASK 1 - CHARACTER DESCRIPTION:
Write a concise 1-2 sentence character description that:
- Captures their personality and current situation
- Mentions a key personal detail or motivation
- Is written in an evocative, literary style suitable for display
- Should feel like a character introduction, not a full backstory
- Example: "A weary but determined merchant who fled the wars in the north, now seeking to rebuild their fortune through risky ventures in untamed territories."

TASK 2 - STARTING ITEMS:
Generate 2-3 items this person would realistically have based on their profession and the scenario.
Items should be:
- Historically accurate to ${year}
- Specific to their profession (${characterSpec.profession})
- Mix of practical tools, personal effects, and profession-specific items
- Include at least one unique item that tells a story

EXAMPLES:
- RAF Pilot 1940: "Service revolver", "Escape compass", "Silk escape map", "Lucky charm from sweetheart"
- Medieval Merchant 1348: "Letter of credit", "Spice samples", "Seal ring", "Accounting ledger"
- Aztec Priest 1519: "Obsidian knife", "Codex fragment", "Jade amulet", "Copal incense"
- Coal Miner 1880: "Safety lamp", "Union card", "Laudanum bottle", "Family photograph"

Return JSON only:
{
  "characterDescription": "Your 1-2 sentence character description here",
  "items": [
    {
      "name": "Item name",
      "description": "Brief description including historical detail",
      "value": 1-100 (based on worth),
      "weight": 0.1-5.0 (in kg),
      "category": "Tool|Weapon|Document|Apparel|Special|Medicine|Food",
      "stackable": true/false,
      "wearable": true/false
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: prompt,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500
        }
      });

      let result = response.text;
      console.log('[WorldWeaverService] Character enhancement response:', result);
      
      // Track API call
      eventService.trackAPICall(prompt, result);
      
      // Clean and parse response
      result = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const enhanced = JSON.parse(result);
      
      // Add the enhanced details to the character spec
      if (enhanced.characterDescription) {
        characterSpec.characterDescription = enhanced.characterDescription;
      }
      // Keep backward compatibility with old field name
      if (enhanced.backstory) {
        characterSpec.characterDescription = enhanced.backstory;
      }
      
      if (enhanced.items && Array.isArray(enhanced.items)) {
        characterSpec.customItems = enhanced.items;
      }
      
      console.log('[WorldWeaverService] Enhanced character with backstory and', enhanced.items?.length || 0, 'items');
      return characterSpec;
      
    } catch (error) {
      console.error('[WorldWeaverService] Failed to enhance character:', error);
      // Return original spec if enhancement fails
      return characterSpec;
    }
  }

  /**
   * Generate a quest chain (integrates with WorldWeaverQuestChain)
   * This method creates a quest that's designed to be part of a chain
   */
  async generateQuestForChain(
    userPrompt: string,
    year: number,
    location: string,
    mapData: MapData,
    playerLocation: { x: number; y: number },
    previousQuestSummaries?: Array<{
      questId: string;
      title: string;
      outcome: string;
    }>
  ): Promise<WorldWeaverQuest | undefined> {
    console.log('[WorldWeaverService] Generating quest for chain with context:', {
      year,
      location,
      previousQuests: previousQuestSummaries?.length || 0
    });

    try {
      // Build enhanced prompt with chain context
      let enhancedPrompt = userPrompt;

      if (previousQuestSummaries && previousQuestSummaries.length > 0) {
        const questHistory = previousQuestSummaries
          .map(q => `- "${q.title}" (${q.outcome})`)
          .join('\n');

        enhancedPrompt = `Continuing from previous events:\n${questHistory}\n\nNow: ${userPrompt}`;
      }

      // Generate with chain-aware parameters
      return await this.generateQuest(
        enhancedPrompt,
        year,
        location,
        undefined, // characterSpec
        undefined, // gameMode
        mapData,
        playerLocation
      );

    } catch (error) {
      console.error('[WorldWeaverService] Failed to generate quest for chain:', error);
      return undefined;
    }
  }

  /**
   * Check if quest generation is ready (has all required dependencies)
   */
  isReadyForGeneration(): boolean {
    return !!process.env.API_KEY;
  }
}

export const worldWeaverService = new WorldWeaverService();