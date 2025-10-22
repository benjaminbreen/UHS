/**
 * services/eatingService.ts - Service for handling eating actions with LLM-based outcome determination
 */
import { GoogleGenAI, Type } from "@google/genai";
import { Item, PlayerCharacter } from '../types';
import { EatingResult } from '../types/eatingTypes';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for the LLM
const eatingResultSchema = {
    type: Type.OBJECT,
    properties: {
        healthChange: {
            type: Type.NUMBER,
            description: "Change in health points, from -100 to +100. Negative = damage, positive = healing"
        },
        fatigueChange: {
            type: Type.NUMBER,
            description: "Change in fatigue points, from -100 to +100. Negative = more tired, positive = energy gained"
        },
        description: {
            type: Type.STRING,
            description: "A single sentence (max 2 sentences) describing the eating experience and immediate effects"
        },
        wasEdible: {
            type: Type.BOOLEAN,
            description: "Whether the item was safely edible or caused harm"
        }
    },
    required: ["healthChange", "fatigueChange", "description", "wasEdible"]
};

/**
 * Execute eating action - determines realistic effects of consuming an item
 */
export async function executeEating(item: Item, playerCharacter: PlayerCharacter): Promise<EatingResult> {
    try {
        // Build context about the item and player state
        const itemContext = `
ITEM EATEN: ${item.name}
ITEM DESCRIPTION: ${item.description || 'No description available'}
ITEM CATEGORY: ${item.category}
ITEM MATERIAL: ${item.material || 'unknown'}
ITEM EMOJI: ${item.emoji}
        `.trim();

        const playerContext = `
CURRENT HEALTH: ${playerCharacter.health}/${playerCharacter.maxHealth}
CURRENT FATIGUE: ${playerCharacter.fatigue}/${playerCharacter.maxFatigue}
PLAYER AGE: ${playerCharacter.age}
PLAYER PROFESSION: ${playerCharacter.profession}
        `.trim();

        // Construct the prompt
        const prompt = `
You are simulating realistic outcomes in a historical simulation game set in ${playerCharacter.era} era.

${itemContext}

${playerContext}

TASK: Determine realistic effects of eating this item.

GUIDELINES:
- Food items (category: "Food") should restore health and/or fatigue appropriately based on nutrition and sustenance value
- Non-food items may be:
  * Harmful (eating rocks, metal, toxic materials) = negative health/fatigue
  * Neutral (paper, cloth) = minimal effect, perhaps slight negative
  * Rarely beneficial (medicinal herbs, special materials)
- Consider the historical context (${playerCharacter.era}) and cultural zone (${playerCharacter.culturalZone})
- Be realistic: eating a sword is very harmful, eating bread is beneficial
- Consider the item's material and description for clues about edibility
- Health change: -100 to +100 (negative = damage, positive = healing)
- Fatigue change: -100 to +100 (negative = more tired, positive = energy gained)
- Typical food items should give +10 to +30 health, +10 to +40 fatigue
- Harmful items should give -20 to -50 health, -10 to -30 fatigue

RESPONSE: Provide ONE concise sentence describing the eating experience and immediate effects. Be vivid and specific.
        `.trim();

        // Call the LLM with structured output
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: eatingResultSchema,
            }
        });

        let text = response.text.trim();

        // Remove code fences if present
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = text.match(fenceRegex);
        if (match && match[2]) {
            text = match[2].trim();
        }

        // Parse the JSON response
        const parsedResult = JSON.parse(text);

        // Validate and clamp values
        const healthChange = Math.max(-100, Math.min(100, parsedResult.healthChange || 0));
        const fatigueChange = Math.max(-100, Math.min(100, parsedResult.fatigueChange || 0));

        return {
            success: true,
            healthChange,
            fatigueChange,
            description: parsedResult.description || `You consumed the ${item.name}.`,
            wasEdible: parsedResult.wasEdible !== false,
            itemName: item.name,
            itemEmoji: item.emoji || '🍴'
        };

    } catch (error) {
        console.error('Error in executeEating:', error);

        // Fallback logic if LLM fails
        const isFood = item.category === 'Food';
        const sustainValue = item.sustenance || 0;

        if (isFood) {
            return {
                success: true,
                healthChange: Math.floor(sustainValue / 2),
                fatigueChange: sustainValue,
                description: `You ate the ${item.name}. It provided some nourishment.`,
                wasEdible: true,
                itemName: item.name,
                itemEmoji: item.emoji || '🍴'
            };
        } else {
            return {
                success: true,
                healthChange: -10,
                fatigueChange: -5,
                description: `You tried to eat the ${item.name}. It was not meant to be consumed.`,
                wasEdible: false,
                itemName: item.name,
                itemEmoji: item.emoji || '🍴'
            };
        }
    }
}
