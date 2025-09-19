/**
 * services/roguelikeService.ts - LLM service for roguelike dialogue and encounters
 */
import { GoogleGenAI, Type } from "@google/genai";
import { HistoricalEra, CulturalZone } from '../types';
import { LLMServiceError } from './llmService';

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

/**
 * Generate a culturally-specific ruin name based on zone, era, and structure type
 */
export function generateCulturalRuinName(
    structureType: string,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    material?: string
): string {
    const culturalNames: Record<CulturalZone, Record<string, string[]>> = {
        ['OCEANIA']: {
            'fortress': ['Benteng', 'Kota', 'Pura Pertahanan', 'Istana Benteng'],
            'holy_site': ['Candi', 'Pura', 'Vihara', 'Masjid Kuno'],
            'palace': ['Kraton', 'Istana', 'Keraton', 'Puri'],
            'temple': ['Candi', 'Pura', 'Borobudur-style Temple', 'Prambanan-style Temple'],
            'monastery': ['Vihara', 'Ashram', 'Pesantren Kuno'],
            'tower': ['Menara', 'Meru', 'Pagoda'],
            'default': ['Reruntuhan', 'Situs Kuno']
        },
        ['EAST_ASIAN']: {
            'fortress': ['城塞 (Citadel)', '要塞 (Fortress)', '関所 (Checkpoint)', '城 (Castle)'],
            'holy_site': ['寺院 (Temple)', '神社 (Shrine)', '仏塔 (Pagoda)', '道観 (Taoist Temple)'],
            'palace': ['宮殿 (Palace)', '御所 (Imperial Residence)', '王府 (Royal Manor)', '行宮 (Temporary Palace)'],
            'temple': ['寺 (Temple)', '廟 (Temple)', '院 (Temple Complex)', '堂 (Hall)'],
            'monastery': ['僧院 (Monastery)', '禅寺 (Zen Temple)', '精舎 (Vihara)', '庵 (Hermitage)'],
            'tower': ['塔 (Pagoda)', '楼 (Tower)', '閣 (Pavilion)'],
            'default': ['遺跡 (Ruins)', '古跡 (Ancient Site)']
        },
        ['SOUTH_ASIAN']: {
            'fortress': ['Qila', 'Durg', 'Kila', 'Garh'],
            'holy_site': ['Mandir', 'Masjid', 'Gurdwara', 'Stupa'],
            'palace': ['Mahal', 'Raj Bhavan', 'Haveli', 'Darbar'],
            'temple': ['Mandir', 'Devalaya', 'Kovil', 'Devasthana'],
            'monastery': ['Ashram', 'Math', 'Vihara', 'Khanqah'],
            'tower': ['Minar', 'Gopuram', 'Shikara', 'Stambha'],
            'default': ['Khandar', 'Puratan Sthal']
        },
        ['MENA']: {
            'fortress': ['Qal\'ah', 'Hisar', 'Burj', 'Ribat'],
            'holy_site': ['Masjid', 'Madrasa', 'Zawiya', 'Khanqah'],
            'palace': ['Qasr', 'Dar', 'Seray', 'Diwan'],
            'temple': ['Ma\'bad', 'Haram', 'Mihrab', 'Musalla'],
            'monastery': ['Ribat', 'Zawiya', 'Tekke', 'Khanqah'],
            'tower': ['Minaret', 'Burj', 'Ma\'dhana', 'Sawma\'a'],
            'default': ['Kharabat', 'Athar']
        },
        ['SUB_SAHARAN_AFRICAN']: {
            'fortress': ['Gaari', 'Fasil', 'Ksar', 'Tata'],
            'holy_site': ['Sacred Grove', 'Spirit House', 'Ancestor Shrine', 'Oracle Chamber'],
            'palace': ['Fada', 'Mansa\'s Court', 'Royal Compound', 'Chief\'s Enclosure'],
            'temple': ['Temple Complex', 'Sacred Enclosure', 'Spirit Temple', 'Divination House'],
            'monastery': ['Sacred Community', 'Initiation Lodge', 'Elder\'s Compound'],
            'tower': ['Watchtower', 'Granary Tower', 'Sacred Pillar'],
            'default': ['Ancient Site', 'Lost Settlement']
        },
        ['EUROPEAN']: {
            'fortress': ['Castle', 'Keep', 'Citadel', 'Fortress'],
            'holy_site': ['Cathedral', 'Abbey', 'Chapel', 'Basilica'],
            'palace': ['Palace', 'Château', 'Villa', 'Manor'],
            'temple': ['Temple', 'Sanctuary', 'Shrine', 'Church'],
            'monastery': ['Monastery', 'Abbey', 'Priory', 'Cloister'],
            'tower': ['Tower', 'Donjon', 'Campanile', 'Belfry'],
            'default': ['Ruins', 'Ancient Site']
        },
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: {
            'fortress': ['Fortified Village', 'Palisaded Town', 'Hill Fort', 'Cliff Dwelling'],
            'holy_site': ['Ceremonial Center', 'Sacred Mound', 'Kiva', 'Medicine Wheel'],
            'palace': ['Chief\'s Lodge', 'Council House', 'Great House', 'Palace Complex'],
            'temple': ['Temple Mound', 'Ceremonial Platform', 'Sacred Plaza', 'Sun Temple'],
            'monastery': ['Sacred Complex', 'Ritual Center', 'Priest\'s Quarter'],
            'tower': ['Watchtower', 'Signal Tower', 'Observation Post'],
            'default': ['Ancient Village', 'Ancestral Site']
        },
        ['NORTH_AMERICAN_COLONIAL']: {
            'fortress': ['Fort', 'Stockade', 'Garrison', 'Blockhouse'],
            'holy_site': ['Mission', 'Church', 'Meeting House', 'Chapel'],
            'palace': ['Governor\'s Mansion', 'Manor House', 'Plantation House', 'Estate'],
            'temple': ['Church', 'Cathedral', 'Temple', 'Sanctuary'],
            'monastery': ['Mission Complex', 'Convent', 'Seminary', 'Religious Community'],
            'tower': ['Bell Tower', 'Watchtower', 'Lighthouse', 'Steeple'],
            'default': ['Abandoned Settlement', 'Old Town Site']
        },
        ['SOUTH_AMERICAN']: {
            'fortress': ['Pucara', 'Fortaleza', 'Castillo', 'Fuerte'],
            'holy_site': ['Huaca', 'Templo', 'Santuario', 'Centro Ceremonial'],
            'palace': ['Palacio', 'Tambo', 'Royal Compound', 'Kancha'],
            'temple': ['Templo', 'Pyramid', 'Huaca', 'Ushnu'],
            'monastery': ['Acllahuasi', 'Sacred Complex', 'Priest Quarter'],
            'tower': ['Torre', 'Chullpa', 'Observatory', 'Signal Tower'],
            'default': ['Ruinas', 'Sitio Arqueológico']
        }
    };

    const zoneNames = culturalNames[culturalZone] || culturalNames['EUROPEAN'];
    const typeKey = structureType.toLowerCase().replace('ruined ', '').replace('abandoned ', '').replace('ancient ', '');

    let candidates = zoneNames[typeKey] || zoneNames['default'];
    const name = candidates[Math.floor(Math.random() * candidates.length)];

    // Add era-specific prefixes
    const eraPrefix = {
        [HistoricalEra.PREHISTORY]: 'Ancient',
        [HistoricalEra.ANTIQUITY]: 'Classical',
        [HistoricalEra.MEDIEVAL]: 'Medieval',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Old',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Abandoned',
        [HistoricalEra.MODERN_ERA]: 'Abandoned',
        [HistoricalEra.FUTURE_ERA]: 'Derelict'
    };

    const prefix = eraPrefix[era] || 'Ruined';
    const materialSuffix = material && material !== 'stone' ? ` (${material})` : '';

    return `${prefix} ${name}${materialSuffix}`;
}

/**
 * Get material-based colors for dungeon rendering
 */
export function getMaterialColors(material: string): { wall: string; floor: string; accent: string } {
    const materialPalettes: Record<string, { wall: string; floor: string; accent: string }> = {
        'sandstone': { wall: '#D2B48C', floor: '#F5DEB3', accent: '#FFE4B5' },
        'limestone': { wall: '#F5F5DC', floor: '#FAFAD2', accent: '#FFFACD' },
        'granite': { wall: '#808080', floor: '#A9A9A9', accent: '#C0C0C0' },
        'marble': { wall: '#F0F0F0', floor: '#FFFFFF', accent: '#F8F8FF' },
        'basalt': { wall: '#2F4F4F', floor: '#708090', accent: '#778899' },
        'coral': { wall: '#FFB6C1', floor: '#FFC0CB', accent: '#FFE4E1' },
        'volcanic rock': { wall: '#3B3B3B', floor: '#4B4B4B', accent: '#5B5B5B' },
        'adobe': { wall: '#C19A6B', floor: '#D2B48C', accent: '#DEB887' },
        'bamboo': { wall: '#8B7355', floor: '#A0826D', accent: '#BC9A6A' },
        'wood': { wall: '#8B4513', floor: '#A0522D', accent: '#D2691E' },
        'brick': { wall: '#B22222', floor: '#CD5C5C', accent: '#DC143C' },
        'concrete': { wall: '#696969', floor: '#808080', accent: '#A9A9A9' },
        'obsidian': { wall: '#1C1C1C', floor: '#2C2C2C', accent: '#3C3C3C' },
        'jade': { wall: '#00A86B', floor: '#00C78B', accent: '#50C878' },
        'laterite': { wall: '#B85A3A', floor: '#CC6A4A', accent: '#E67A5A' },
        'mud brick': { wall: '#8B6F47', floor: '#A0826D', accent: '#BDB76B' },
        'ice': { wall: '#B0E0E6', floor: '#E0FFFF', accent: '#F0FFFF' },
        'stone': { wall: '#5A5A5A', floor: '#6A6A6A', accent: '#7A7A7A' }
    };

    return materialPalettes[material.toLowerCase()] || materialPalettes['stone'];
}

/**
 * Get wall rendering patterns based on material
 */
export function getMaterialWallPattern(material: string): string {
    const patterns: Record<string, string> = {
        'sandstone': '▓',
        'limestone': '█',
        'granite': '█',
        'marble': '█',
        'basalt': '█',
        'coral': '▒',
        'volcanic rock': '▓',
        'adobe': '▓',
        'bamboo': '║',
        'wood': '╬',
        'brick': '▓',
        'concrete': '█',
        'obsidian': '█',
        'jade': '◆',
        'laterite': '▓',
        'mud brick': '▒',
        'ice': '◊',
        'default': '█'
    };

    return patterns[material.toLowerCase()] || patterns['default'];
}