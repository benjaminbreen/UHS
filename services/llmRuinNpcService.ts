/**
 * services/llmRuinNpcService.ts - LLM-powered NPC generation for ruins
 */
import { GoogleGenAI, Type } from "@google/genai";
import { HistoricalEra, CulturalZone } from '../types';

export interface LLMRuinNPC {
    name: string;
    type: string; // Profession or role
    age: number;
    gender: 'Male' | 'Female';
    backstory: string;
    motivation: string; // Why are they in the ruins?
    personality: string; // Friendly, hostile, cautious, etc.
    dialogue: {
        greeting: string;
        backstory: string;
        information: string;
        farewell: string;
    };
    hostile: boolean;
    tradeable: boolean;
    items?: string[]; // What they might trade or carry
}

/**
 * Generate a historically accurate NPC for ruins using Gemini Flash 2.5 Lite
 */
export async function generateLLMRuinNPC(
    year: number,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    ruinType: string,
    depth: number,
    biome: string
): Promise<LLMRuinNPC> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Determine what kinds of people would realistically be in these ruins
    const contextPrompt = `
You are generating a historically accurate human NPC for an educational history simulation game.

SETTING:
- Year: ${year}
- Cultural Zone: ${culturalZone}
- Historical Era: ${era}
- Location: ${ruinType} ruins in a ${biome} biome
- Depth: Floor ${depth} ${depth > 1 ? '(deeper underground)' : '(ground level)'}

Generate ONE realistic person who would be found in these ruins during this specific time period. Consider:
- Why would someone be in ruins in ${year}? (war refugees, bandits, scholars, hermits, etc.)
- What is happening in ${culturalZone} during ${era} that might drive people to ruins?
- Cultural and linguistic authenticity for names and speech patterns
- Realistic professions/roles for the time period
- No fantasy elements - this is historical education

Provide a JSON object with this structure:
{
    "name": "Culturally appropriate full name for ${culturalZone} in ${year}",
    "type": "Their profession or role (e.g., 'Refugee', 'Scholar', 'Bandit', 'Hermit')",
    "age": number between 18-70,
    "gender": "Male" or "Female",
    "backstory": "2-3 sentences about who they are and their history",
    "motivation": "Why they are in these ruins specifically (1-2 sentences)",
    "personality": "One of: friendly, cautious, hostile, desperate, scholarly, religious, mercenary",
    "dialogue": {
        "greeting": "What they say when first encountered (culturally appropriate for ${year} ${culturalZone})",
        "backstory": "What they say if asked about themselves",
        "information": "Useful information about the ruins or era they might share",
        "farewell": "What they say when conversation ends"
    },
    "hostile": boolean (true if likely to attack),
    "tradeable": boolean (true if willing to trade),
    "items": ["2-3 period-appropriate items they might have"]
}

Examples:
- Medieval Europe (1200): A plague refugee hiding from infected villages
- Ancient Egypt (100 BCE): A tomb robber searching for buried treasures
- Industrial England (1850): An archaeologist documenting ancient sites
- Warring States China (400 BCE): A hermit philosopher seeking solitude

Make them feel real and grounded in actual history.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: contextPrompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.9,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        age: { type: Type.NUMBER },
                        gender: { type: Type.STRING },
                        backstory: { type: Type.STRING },
                        motivation: { type: Type.STRING },
                        personality: { type: Type.STRING },
                        dialogue: {
                            type: Type.OBJECT,
                            properties: {
                                greeting: { type: Type.STRING },
                                backstory: { type: Type.STRING },
                                information: { type: Type.STRING },
                                farewell: { type: Type.STRING }
                            },
                            required: ['greeting', 'backstory', 'information', 'farewell']
                        },
                        hostile: { type: Type.BOOLEAN },
                        tradeable: { type: Type.BOOLEAN },
                        items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['name', 'type', 'age', 'gender', 'backstory', 'motivation',
                              'personality', 'dialogue', 'hostile', 'tradeable']
                }
            }
        });

        const npc = JSON.parse(response.text) as LLMRuinNPC;

        // Validate and provide defaults if needed
        if (!npc.name || npc.name.length > 50) {
            npc.name = getDefaultName(culturalZone, npc.gender);
        }

        return npc;

    } catch (error) {
        console.error("Error generating LLM ruin NPC:", error);
        return getFallbackNPC(culturalZone, era, year);
    }
}

/**
 * Generate dialogue for ongoing conversation
 */
export async function generateNPCDialogue(
    npc: LLMRuinNPC,
    playerMessage: string,
    conversationHistory: string[],
    year: number,
    culturalZone: CulturalZone
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
You are roleplaying as ${npc.name}, a ${npc.age} year old ${npc.gender} ${npc.type} in ${year} ${culturalZone}.

Character Details:
- Backstory: ${npc.backstory}
- Motivation: ${npc.motivation}
- Personality: ${npc.personality}
- Currently in: ruins

Conversation History:
${conversationHistory.slice(-3).join('\n')}

Player says: "${playerMessage}"

Respond in character as ${npc.name}. Keep your response:
1. Historically accurate for ${year} ${culturalZone}
2. True to your character's personality and backstory
3. Brief (1-2 sentences)
4. Use period-appropriate language and speech patterns
5. If asked about something you wouldn't know, admit ignorance
6. If threatened and you're not hostile, show fear or try to de-escalate
7. If you're hostile, maintain aggression but don't attack physically in dialogue

Response:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                temperature: 0.8,
                maxOutputTokens: 150
            }
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error generating NPC dialogue:", error);

        // Fallback responses based on personality
        const fallbacks: Record<string, string> = {
            'friendly': "I'm sorry, I didn't quite understand that.",
            'hostile': "I have nothing more to say to you!",
            'cautious': "I... I should go.",
            'desperate': "Please, I just want to be left alone.",
            'scholarly': "That's an interesting question, but I'm not sure.",
            'religious': "Only the divine knows such answers.",
            'mercenary': "Talk is cheap. Do you have coin?"
        };

        return fallbacks[npc.personality] || "I don't know what to say.";
    }
}

// Fallback data for when LLM fails
function getDefaultName(culturalZone: CulturalZone, gender: string): string {
    const names: Record<CulturalZone, { male: string[], female: string[] }> = {
        'EUROPEAN': {
            male: ['William', 'Robert', 'John', 'Thomas'],
            female: ['Mary', 'Elizabeth', 'Anne', 'Margaret']
        },
        'EAST_ASIAN': {
            male: ['Wei', 'Zhang', 'Li', 'Chen'],
            female: ['Mei', 'Lan', 'Ying', 'Xiu']
        },
        'MENA': {
            male: ['Ahmed', 'Hassan', 'Ibrahim', 'Omar'],
            female: ['Fatima', 'Aisha', 'Layla', 'Zahra']
        },
        'SOUTH_ASIAN': {
            male: ['Raj', 'Kumar', 'Dev', 'Arjun'],
            female: ['Priya', 'Anita', 'Lakshmi', 'Sita']
        },
        'SUB_SAHARAN_AFRICAN': {
            male: ['Kwame', 'Jabari', 'Olumide', 'Tendai'],
            female: ['Amara', 'Nia', 'Zara', 'Kesi']
        },
        'NORTH_AMERICAN_PRE_COLUMBIAN': {
            male: ['Akecheta', 'Chayton', 'Takoda', 'Kohana'],
            female: ['Aiyana', 'Halona', 'Kaya', 'Winona']
        },
        'NORTH_AMERICAN_COLONIAL': {
            male: ['James', 'Samuel', 'Benjamin', 'Joseph'],
            female: ['Sarah', 'Hannah', 'Abigail', 'Rebecca']
        },
        'OCEANIA': {
            male: ['Koa', 'Tane', 'Rangi', 'Maui'],
            female: ['Moana', 'Aroha', 'Kaia', 'Leilani']
        },
        'SOUTH_AMERICAN': {
            male: ['Inti', 'Tupaq', 'Amaru', 'Pacha'],
            female: ['Quilla', 'Ñusta', 'Mama', 'Killa']
        }
    };

    const genderNames = gender === 'Female' ? names[culturalZone]?.female : names[culturalZone]?.male;
    return genderNames?.[Math.floor(Math.random() * genderNames.length)] || 'Wanderer';
}

function getFallbackNPC(culturalZone: CulturalZone, era: HistoricalEra, year: number): LLMRuinNPC {
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const name = getDefaultName(culturalZone, gender);

    return {
        name,
        type: 'Wanderer',
        age: 25 + Math.floor(Math.random() * 30),
        gender: gender as 'Male' | 'Female',
        backstory: `A wanderer seeking shelter in these ruins during troubled times.`,
        motivation: `Looking for safety and perhaps something valuable to trade for food.`,
        personality: 'cautious',
        dialogue: {
            greeting: "Who goes there? I mean no trouble.",
            backstory: "I'm just passing through, seeking shelter from the world above.",
            information: "These ruins go deeper than you might think. Be careful.",
            farewell: "Safe travels, stranger."
        },
        hostile: false,
        tradeable: true,
        items: ['Stale bread', 'Water flask', 'Worn cloak']
    };
}