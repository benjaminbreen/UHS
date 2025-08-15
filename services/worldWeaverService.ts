/**
 * WorldWeaver Service
 * Interprets natural language prompts to create historical game settings
 */

import { GoogleGenAI } from "@google/genai";
import { generateMapAreaListForPrompt, isValidMapAreaName } from '../utils/generateMapAreaList';
import { findZoneForMapArea } from '../utils/mapAreaLookup';

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
}

// Generate the exact list of valid map areas from the game data
const MAP_AREAS_LIST = generateMapAreaListForPrompt();
console.log('[WorldWeaverService] Generated map areas list with', MAP_AREAS_LIST.split('\n').length, 'lines');

const WORLD_WEAVER_PROMPT = `You are WorldWeaver, an AI that converts user prompts into historical game settings.

Given ANY user input, try to create a plausible historical setting with:
1. A specific year (between -3000 and 2020)
2. A specific map area from the EXACT list below (NO VARIATIONS OR ALTERNATIVES)

Examples of how to interpret prompts:
- "sandwich" → 1760s "London" (Earl of Sandwich era)
- "pirates" → 1715 "Greater Antilles" (Golden Age of Piracy)
- "robinson crusoe" → 1659 "Lesser Antilles" (uninhabited island)
- "tea" → 1773 "Boston Harbor" (Boston Tea Party)
- "gold rush" → 1849 "Sacramento Valley" (California Gold Rush)

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
  "suggestion": "1 sentence suggesting what the player might try doing in this setting"
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
                suggestion: result.suggestion
              };
            }
            
            return {
              success: false,
              errorMessage: `Invalid map area: ${result.mapArea}`
            };
          }
          
          console.log('[WorldWeaverService] Valid map area! Returning:', {
            year: result.year,
            mapArea: result.mapArea
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
            suggestion: result.suggestion
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
}

export const worldWeaverService = new WorldWeaverService();