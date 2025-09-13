/**
 * services/roguelikeService.ts - LLM service for roguelike dialogue and encounters
 */
import { GoogleGenAI, Type } from "@google/genai";
import { HistoricalEra, CulturalZone } from '../types';

interface RoguelikeNpc {
    name: string;
    type: 'tomb_raider' | 'treasure_hunter' | 'bandit' | 'rebel' | 'hermit' | 'scholar' | 'guard' | 'refugee' | 'cultist' | 'archaeologist';
    hostile: boolean;
    dialogue?: string[];
}

interface RoguelikeDialogueContext {
    npcType: string;
    npcName: string;
    era: HistoricalEra;
    culturalZone: CulturalZone;
    ruinType: string;
    currentDepth: number;
    playerName: string;
    playerProfession: string;
    isHostile: boolean;
    hasWeapon: boolean;
    playerHealth: number;
    playerMaxHealth: number;
}

/**
 * Generate contextual dialogue for NPCs in ruins using Gemini Flash Lite
 */
export async function generateRoguelikeDialogue(context: RoguelikeDialogueContext): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Determine NPC motivations based on type
    const npcMotivations: Record<string, string> = {
        'tomb_raider': 'searching for valuable artifacts to sell',
        'treasure_hunter': 'looking for legendary treasures',
        'bandit': 'robbing anyone who enters their territory',
        'rebel': 'hiding from authorities in these ruins',
        'hermit': 'living in solitude away from society',
        'scholar': 'studying the historical significance of these ruins',
        'guard': 'protecting something valuable deeper in the ruins',
        'refugee': 'seeking shelter from conflict or persecution',
        'cultist': 'performing dark rituals in the depths',
        'archaeologist': 'documenting and preserving historical artifacts'
    };
    
    const motivation = npcMotivations[context.npcType] || 'wandering these ruins';
    
    // Build a period-appropriate greeting based on hostility
    const hostilityContext = context.isHostile 
        ? `The NPC is hostile and aggressive, ready to attack if provoked. They view the player as a threat or rival.`
        : `The NPC is cautious but not immediately hostile. They might be willing to talk or even trade.`;
    
    const prompt = `
You are creating dialogue for a historically accurate NPC in ruins during the ${context.era} era in a ${context.culturalZone} cultural zone.

NPC Details:
- Name: ${context.npcName}
- Type: ${context.npcType} (${motivation})
- Location: ${context.ruinType} ruins, depth level ${context.currentDepth}
- Attitude: ${hostilityContext}

Player Details:
- Name: ${context.playerName}
- Profession: ${context.playerProfession}
- Health: ${context.playerHealth}/${context.playerMaxHealth} (${context.playerHealth < context.playerMaxHealth / 2 ? 'injured' : 'healthy'})
- Armed: ${context.hasWeapon ? 'Yes' : 'No'}

Generate a single, short (1-2 sentences) realistic dialogue line that this NPC would say upon encountering the player. The dialogue should:
1. Be historically and culturally appropriate for the ${context.era} era and ${context.culturalZone} region
2. Reflect the NPC's type and motivation
3. Show awareness of the player's condition (injured, armed, etc.)
4. If hostile, include threats or warnings
5. If non-hostile, might offer information, warnings about deeper levels, or hint at trading
6. Use period-appropriate language (no modern slang)
7. Be concise and impactful

Return ONLY the dialogue line, no quotation marks or attribution.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt
        });
        
        const dialogue = response.text.trim();
        
        // Fallback if response is empty or too long
        if (!dialogue || dialogue.length > 200) {
            return context.isHostile 
                ? "Turn back now, or face the consequences!"
                : "Another soul wandering these ancient halls...";
        }
        
        return dialogue;
    } catch (error) {
        console.error("Error generating roguelike dialogue:", error);
        // Return appropriate fallback based on hostility
        return context.isHostile 
            ? "You shouldn't have come here!"
            : "These ruins hold many secrets...";
    }
}

/**
 * Generate appropriate NPCs for ruins based on era and culture
 */
export async function generateRoguelikeNpcs(
    era: HistoricalEra, 
    culturalZone: CulturalZone, 
    ruinType: string,
    depth: number
): Promise<RoguelikeNpc[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
Generate historically accurate human NPCs that might be found in ${ruinType} ruins during the ${era} era in the ${culturalZone} cultural region.

Consider:
- Current depth: Level ${depth} (deeper = more dangerous/desperate NPCs)
- Historical context: What kinds of people would realistically be in ruins during this period?
- Cultural specifics: Regional appropriate names, motivations, and behaviors

Generate 2-3 NPCs with the following JSON structure:
[
  {
    "name": "Culturally appropriate name",
    "type": "One of: tomb_raider, treasure_hunter, bandit, rebel, hermit, scholar, guard, refugee, cultist, archaeologist",
    "hostile": boolean (true if likely to attack on sight),
    "dialogue": ["First greeting", "Second line if talked to again", "Warning or information"]
  }
]

Make them realistic for the period - no fantasy elements. For example:
- Ancient era: Grave robbers, religious hermits, bandits
- Medieval: Crusaders, plague refugees, religious scholars
- Modern: Archaeologists, rebels, refugees from conflicts

Return ONLY the JSON array, no markdown or explanation.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            type: { 
                                type: Type.STRING,
                                enum: ['tomb_raider', 'treasure_hunter', 'bandit', 'rebel', 'hermit', 'scholar', 'guard', 'refugee', 'cultist', 'archaeologist']
                            },
                            hostile: { type: Type.BOOLEAN },
                            dialogue: { 
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["name", "type", "hostile"]
                    }
                }
            }
        });
        
        const npcs = JSON.parse(response.text);
        return npcs;
    } catch (error) {
        console.error("Error generating roguelike NPCs:", error);
        // Return fallback NPCs
        return [
            {
                name: "Wanderer",
                type: "refugee",
                hostile: false,
                dialogue: ["I'm just passing through...", "These ruins aren't safe.", "Beware the depths."]
            }
        ];
    }
}

/**
 * Generate dialogue for when player attempts to negotiate or talk instead of fight
 */
export async function generateNegotiationDialogue(
    context: RoguelikeDialogueContext,
    playerOffer?: string
): Promise<{ response: string; success: boolean }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
An encounter in ${context.ruinType} ruins during the ${context.era} era. 
NPC: ${context.npcName}, a ${context.npcType} who is ${context.isHostile ? 'hostile' : 'cautious'}.
Player (${context.playerName}, ${context.playerProfession}) attempts to negotiate/talk.
${playerOffer ? `Player says/offers: "${playerOffer}"` : 'Player attempts to calm the situation.'}

Generate a brief response (1-2 sentences) and determine if the NPC becomes non-hostile.
Consider:
- NPC type and motivations
- Player's profession (scholars might connect with scholars, etc.)
- Whether the player is injured or armed
- Historical/cultural context of ${context.culturalZone}

Response format:
{
  "response": "NPC's dialogue response",
  "success": boolean (true if NPC becomes non-hostile)
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        response: { type: Type.STRING },
                        success: { type: Type.BOOLEAN }
                    },
                    required: ["response", "success"]
                }
            }
        });
        
        const result = JSON.parse(response.text);
        return result;
    } catch (error) {
        console.error("Error generating negotiation dialogue:", error);
        return {
            response: "Words won't save you here!",
            success: false
        };
    }
}