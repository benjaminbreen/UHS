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

export interface CharacterSpecification {
  name?: string;
  age?: number;
  gender?: 'male' | 'female';
  profession?: string;
  health?: 'healthy' | 'average' | 'unhealthy' | 'sickly';
  socialClass?: 'peasant' | 'commoner' | 'merchant' | 'noble';
  traits?: string[];
  disease?: string; // Disease ID like BUBONIC_PLAGUE
  customBackstory?: string; // LLM-generated backstory specific to the scenario
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
}

// Generate the exact list of valid map areas from the game data
const MAP_AREAS_LIST = generateMapAreaListForPrompt();
console.log('[WorldWeaverService] Generated map areas list with', MAP_AREAS_LIST.split('\n').length, 'lines');

// Generate list of available diseases for the prompt
const DISEASE_LIST = DISEASES.map(d => `- ${d.id}: ${d.name} (${d.severity})`).join('\n');
console.log('[WorldWeaverService] Generated disease list with', DISEASES.length, 'diseases');

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
- Look for character details like age, gender, name, profession, health status, social class, diseases
- Examples:
  - "35 year old female spy" → age: 35, gender: "female", profession: "spy"
  - "unhealthy peasant named Hans" → health: "unhealthy", socialClass: "peasant", name: "Hans"
  - "young merchant" → profession: "merchant", traits: ["young"]
  - "sickly noble woman" → health: "sickly", socialClass: "noble", gender: "female"
  - "peasant with the plague" → socialClass: "peasant", disease: "BUBONIC_PLAGUE"
  - "soldier suffering from typhus" → profession: "soldier", disease: "TYPHUS"
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
    console.log('[WorldWeaverService] interpretPrompt called with:', userPrompt);
    
    if (!userPrompt || userPrompt.trim().length === 0) {
      return {
        success: false,
        errorMessage: "Please enter a historical scenario"
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = WORLD_WEAVER_PROMPT + `\n\nUser prompt: "${userPrompt}"\n\nCreate a historical setting or explain why you cannot.`;
      
      console.log('[WorldWeaverService] Sending to LLM...');
      const result = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-lite', 
        contents: fullPrompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      });
      
      let response = result.text;
      console.log('[WorldWeaverService] Raw LLM response:', response);
      
      // Track API call with input/output
      eventService.trackAPICall(fullPrompt, response);
      console.log('[WorldWeaverService] API call tracked with history');
      
      // Remove markdown code blocks if present
      response = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      console.log('[WorldWeaverService] Cleaned response:', response);

      // Parse the JSON response
      try {
        const result = JSON.parse(response);
        console.log('[WorldWeaverService] Parsed result:', result);
        
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
      
      // Generate historical context
      const historicalContext = this.buildHistoricalContext(
        baseResult.year,
        baseResult.mapArea,
        baseResult.characterSpec
      );
      
      // Generate custom events for this scenario
      const customEvents = await llmEventService.generateCustomEvents(
        gameMode.id,
        historicalContext,
        this.getPlayerContext(baseResult.characterSpec),
        baseResult.year,
        baseResult.mapArea
      );
      console.log('[WorldWeaverService] Generated', customEvents.length, 'custom events');
      
      // Generate special NPCs
      const specialNPCs = await llmEventService.generateSpecialNPCs(
        historicalContext,
        baseResult.year,
        baseResult.mapArea,
        2 // Generate 2 special NPCs
      );
      console.log('[WorldWeaverService] Generated', specialNPCs.length, 'special NPCs');
      
      // Set the game mode in the event service
      eventService.setGameMode(gameMode);
      
      // Set custom events in the event service
      if (customEvents.length > 0) {
        eventService.setCustomEventArchetypes(customEvents);
      }
      
      return {
        ...baseResult,
        gameMode,
        customEvents,
        specialNPCs
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

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
You are creating a historically accurate character for an educational history simulation game.

CONTEXT:
- Year: ${year}
- Location: ${location}
- Character: ${characterSpec.age || 30} year old ${characterSpec.gender || 'person'} who is a ${characterSpec.profession}
- Social Class: ${characterSpec.socialClass || 'commoner'}
- Original Scenario: "${userPrompt}"

TASK 1 - BACKSTORY:
Write a compelling 2-3 sentence backstory that:
- Is SPECIFIC to being a ${characterSpec.profession} in ${location} in ${year}
- References actual historical context (wars, events, social conditions)
- Explains how they got into this situation
- Hints at their personality and recent experiences
- For military personnel, mention their unit/service and recent combat
- For civilians in wartime, mention how the conflict affects them

TASK 2 - STARTING ITEMS:
Generate 4-6 items this person would realistically have based on their profession and the scenario.
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
  "backstory": "Your 2-3 sentence backstory here",
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
        model: 'gemini-2.5-flash',
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
      if (enhanced.backstory) {
        characterSpec.customBackstory = enhanced.backstory;
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
}

export const worldWeaverService = new WorldWeaverService();