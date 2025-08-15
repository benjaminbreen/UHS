/**
 * Service for evaluating and executing physical feats like fording, climbing, jumping, etc.
 * Uses LLM to determine feasibility based on context.
 */

import { PlayerCharacter, Tile, BiomeType, MapData, Item } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

export type FeatType = 'ford' | 'climb' | 'jump' | 'swim' | 'squeeze' | 'break' | 'scale';
export type FeatRisk = 'low' | 'medium' | 'high' | 'extreme';

export interface PhysicalFeatAttempt {
  type: FeatType;
  targetDescription: string;
  direction?: 'north' | 'south' | 'east' | 'west';
  targetTile?: Tile;
}

export interface PhysicalFeatResult {
  possible: boolean;
  risk: FeatRisk;
  successChance: number; // 0-1
  reasoning: string;
  consequences?: {
    fatigueCost?: number;
    healthRisk?: number;
    itemLossChance?: number;
    alternativeSuggestion?: string;
  };
}

/**
 * Detects if a player input is attempting a physical feat
 * Returns null if no clear physical feat is detected
 */
export function detectPhysicalFeatIntent(input: string): PhysicalFeatAttempt | null {
  const lowercaseInput = input.toLowerCase();
  
  // First check if the input is too short or doesn't contain action words
  if (input.length < 10) return null;
  
  // Exclude inputs that are clearly not physical feats
  // e.g., "I cross my arms", "climb of social status", "jump to conclusions"
  const excludePatterns = [
    /\bcross\s+(my|your|his|her|their|arms|fingers|legs)/i,
    /\b(climb|rise)\s+(of|in)\s+(status|rank|society|power)/i,
    /\bjump\s+to\s+(conclusion|assumption)/i,
    /\bleap\s+of\s+faith/i,
    /\bbreak\s+(the\s+)?(news|silence|ice|fast)/i,
    /\bscale\s+(of|up|down)\s+(\d+|production|business)/i
  ];
  
  for (const pattern of excludePatterns) {
    if (pattern.test(input)) return null;
  }
  
  // Check for action verbs that indicate physical feats - but require more context
  const actionVerbs = ['ford', 'wade', 'climb', 'scale', 'ascend', 'vault'];
  const secondaryVerbs = ['cross', 'jump', 'leap', 'swim', 'dive', 'squeeze', 'break'];
  
  // For secondary verbs, require explicit physical objects
  const hasStrongVerb = actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`).test(lowercaseInput));
  const hasSecondaryVerb = secondaryVerbs.some(verb => new RegExp(`\\b${verb}\\b`).test(lowercaseInput));
  
  if (!hasStrongVerb && !hasSecondaryVerb) return null;
  
  // Fording patterns - be more specific and require water-related terms
  const fordingPatterns = [
    /\b(ford|wade)\s+(across\s+|through\s+)?(the\s+)?(river|stream|water|creek|rapids)/i,
    /\b(cross|traverse)\s+(the\s+)(river|stream|creek|rapids|water)\b/i,
    /\b(try|attempt|want)\s+to\s+(ford|wade|cross)\s+(the\s+)?(river|stream|water|creek)/i
  ];
  
  // Climbing patterns - require explicit climbable objects
  const climbingPatterns = [
    /\b(climb|scale)\s+(up\s+)?(the\s+|a\s+)?(tree|wall|cliff|rock|mountain|tower|fence|ladder)/i,
    /\b(ascend|scale)\s+(the\s+)(wall|cliff|fortress|castle|peak|mountain)/i,
    /\b(try|attempt|want)\s+to\s+(climb|scale|ascend)\s+(up\s+)?(the\s+|a\s+)?(\w+)/i
  ];
  
  // Jumping patterns - require explicit gaps or obstacles
  const jumpingPatterns = [
    /\b(jump|leap)\s+(across|over)\s+(the\s+|a\s+)?(gap|chasm|ravine|stream|fence|wall|obstacle)/i,
    /\b(vault)\s+(over)\s+(the\s+|a\s+)?(wall|fence|barrier|obstacle)/i,
    /\b(try|attempt|want)\s+to\s+(jump|leap|vault)\s+(across|over)\s+(the\s+|a\s+)?(\w+)/i
  ];
  
  // Swimming patterns - require explicit water bodies
  const swimmingPatterns = [
    /\b(swim)\s+(across|to|through)\s+(the\s+)?(river|lake|ocean|pond|channel|sea)/i,
    /\b(dive)\s+into\s+(the\s+)?(water|river|ocean|lake|pond|sea)/i,
    /\b(try|attempt|want)\s+to\s+(swim|dive)\s+(across|in|through)?\s*(the\s+)?(water|river|ocean|lake)/i
  ];
  
  // Check fording
  for (const pattern of fordingPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      // Extract direction if present
      const directionMatch = lowercaseInput.match(/to\s+the\s+(north|south|east|west)/i);
      return {
        type: 'ford',
        targetDescription: match[0],
        direction: directionMatch ? directionMatch[1].toLowerCase() as any : undefined
      };
    }
  }
  
  // Check climbing
  for (const pattern of climbingPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      return {
        type: 'climb',
        targetDescription: match[0]
      };
    }
  }
  
  // Check jumping
  for (const pattern of jumpingPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      return {
        type: 'jump',
        targetDescription: match[0]
      };
    }
  }
  
  // Check swimming
  for (const pattern of swimmingPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      return {
        type: 'swim',
        targetDescription: match[0]
      };
    }
  }
  
  return null;
}

/**
 * Evaluates whether a physical feat is possible using LLM
 */
export async function evaluatePhysicalFeat(
  attempt: PhysicalFeatAttempt,
  player: PlayerCharacter,
  currentTile: Tile,
  mapData: MapData
): Promise<PhysicalFeatResult> {
  // Get relevant context
  const context = buildFeatContext(attempt, player, currentTile, mapData);
  
  // Create specialized prompt for the LLM
  const prompt = `You are evaluating whether a physical feat is possible in a historical simulation game.

ATTEMPTED ACTION: ${attempt.targetDescription}
FEAT TYPE: ${attempt.type}

CONTEXT:
${context}

Evaluate this physical feat attempt and respond in JSON format:
{
  "possible": boolean (can this be done at all?),
  "risk": "low"|"medium"|"high"|"extreme",
  "successChance": number (0.0 to 1.0),
  "reasoning": "Brief explanation of your decision",
  "consequences": {
    "fatigueCost": number (0-50 fatigue points),
    "healthRisk": number (0-50 potential damage if failed),
    "itemLossChance": number (0.0-1.0 chance of losing items),
    "alternativeSuggestion": "string (optional suggestion if not possible)"
  }
}

Consider:
- Physical feasibility (can a human actually do this?)
- Environmental factors (weather, terrain, obstacles)
- Character capabilities (strength, equipment, fatigue)
- Historical realism (would this make sense in the time period?)
- Risk vs reward (is this unnecessarily dangerous?)

Be realistic but not overly restrictive. Allow creative solutions when they make sense.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possible: { type: Type.BOOLEAN, description: "Can this feat be attempted?" },
            risk: { type: Type.STRING, enum: ['low', 'medium', 'high', 'extreme'], description: "Risk level" },
            successChance: { type: Type.NUMBER, description: "Success probability (0-1)" },
            reasoning: { type: Type.STRING, description: "Explanation of the evaluation" },
            consequences: {
              type: Type.OBJECT,
              properties: {
                fatigueCost: { type: Type.NUMBER, description: "Fatigue points cost" },
                healthRisk: { type: Type.NUMBER, description: "Potential health damage" },
                itemLossChance: { type: Type.NUMBER, description: "Chance of losing items" },
                alternativeSuggestion: { type: Type.STRING, description: "Alternative if not possible" }
              }
            }
          },
          required: ["possible", "risk", "successChance", "reasoning"]
        }
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    const result = JSON.parse(jsonStr);
    
    // Validate and return
    return {
      possible: result.possible ?? false,
      risk: result.risk ?? 'high',
      successChance: Math.max(0, Math.min(1, result.successChance ?? 0.5)),
      reasoning: result.reasoning ?? 'Unable to evaluate',
      consequences: result.consequences
    };
  } catch (error) {
    console.error('[PhysicalFeat] Error evaluating feat:', error);
    
    // Fallback evaluation based on simple rules
    return getFallbackEvaluation(attempt, player, currentTile);
  }
}

/**
 * Builds context string for feat evaluation
 */
function buildFeatContext(
  attempt: PhysicalFeatAttempt,
  player: PlayerCharacter,
  currentTile: Tile,
  mapData: MapData
): string {
  const contextParts: string[] = [];
  
  // Player stats
  contextParts.push(`CHARACTER STATS:
- Strength: ${player.stats.strength}/20
- Dexterity: ${player.stats.dexterity}/20
- Constitution: ${player.stats.constitution}/20
- Current Health: ${player.health}/${player.maxHealth}
- Current Fatigue: ${player.fatigue}/${player.maxFatigue}`);
  
  // Equipment that might help
  const relevantItems = getRelevantEquipment(player, attempt.type);
  if (relevantItems.length > 0) {
    contextParts.push(`RELEVANT EQUIPMENT:
${relevantItems.map(item => `- ${item.name}: ${item.description}`).join('\n')}`);
  }
  
  // Current terrain
  contextParts.push(`CURRENT LOCATION:
- Terrain: ${currentTile.biome}
- Altitude: ${currentTile.altitude}
- Climate: ${mapData.climate}`);
  
  // Target tile if specified
  if (attempt.targetTile) {
    contextParts.push(`TARGET LOCATION:
- Terrain: ${attempt.targetTile.biome}
- Altitude: ${attempt.targetTile.altitude}
- Distance: Adjacent tile`);
  }
  
  // Special conditions for water crossing
  if (attempt.type === 'ford' && attempt.targetTile) {
    const waterDepth = getWaterDepth(attempt.targetTile.biome);
    const current = getWaterCurrent(attempt.targetTile.biome, mapData.climate);
    
    contextParts.push(`WATER CONDITIONS:
- Type: ${attempt.targetTile.biome}
- Estimated Depth: ${waterDepth}
- Current Strength: ${current}`);
  }
  
  // Time and season
  const season = mapData.currentSeason || 'spring';
  const timeOfDay = mapData.currentTimeOfDay || 'day';
  contextParts.push(`ENVIRONMENTAL:
- Season: ${season}
- Time: ${timeOfDay}
- Year: ${mapData.year}`);
  
  return contextParts.join('\n\n');
}

/**
 * Gets equipment that might help with a feat
 */
function getRelevantEquipment(player: PlayerCharacter, featType: FeatType): Item[] {
  const relevant: Item[] = [];
  
  const allItems = [...player.inventory, ...Object.values(player.equippedItems).filter(Boolean) as Item[]];
  
  for (const item of allItems) {
    if (!item) continue;
    
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    
    switch (featType) {
      case 'ford':
      case 'swim':
        if (name.includes('rope') || name.includes('staff') || name.includes('pole') ||
            desc.includes('float') || desc.includes('buoy')) {
          relevant.push(item);
        }
        break;
      case 'climb':
      case 'scale':
        if (name.includes('rope') || name.includes('hook') || name.includes('ladder') ||
            name.includes('piton') || desc.includes('climb')) {
          relevant.push(item);
        }
        break;
      case 'jump':
        if (name.includes('pole') || name.includes('staff') || desc.includes('vault')) {
          relevant.push(item);
        }
        break;
      case 'break':
        if (name.includes('hammer') || name.includes('axe') || name.includes('ram') ||
            item.attack > 10) {
          relevant.push(item);
        }
        break;
    }
  }
  
  return relevant;
}

/**
 * Estimates water depth based on biome type
 */
function getWaterDepth(biome: BiomeType): string {
  switch (biome) {
    case BiomeType.RIVER:
      return 'Moderate (3-6 feet)';
    case BiomeType.STREAM:
      return 'Shallow (1-3 feet)';
    case BiomeType.OCEAN:
      return 'Deep (20+ feet)';
    case BiomeType.LAKE:
      return 'Variable (5-15 feet near shore)';
    case BiomeType.WETLANDS:
      return 'Shallow (1-4 feet)';
    case BiomeType.MANGROVE:
      return 'Shallow to Moderate (2-5 feet)';
    case BiomeType.SHOALS:
      return 'Very Shallow (1-2 feet)';
    default:
      return 'Unknown';
  }
}

/**
 * Estimates water current based on biome and climate
 */
function getWaterCurrent(biome: BiomeType, climate: string): string {
  if (biome === BiomeType.RIVER) {
    return climate === 'TROPICAL' ? 'Strong (monsoon season)' : 'Moderate';
  }
  if (biome === BiomeType.STREAM) {
    return 'Gentle';
  }
  if (biome === BiomeType.OCEAN) {
    return 'Variable (tides and waves)';
  }
  return 'Minimal';
}

/**
 * Provides fallback evaluation when LLM is unavailable
 */
function getFallbackEvaluation(
  attempt: PhysicalFeatAttempt,
  player: PlayerCharacter,
  currentTile: Tile
): PhysicalFeatResult {
  // Simple rule-based fallback
  const strength = player.stats.strength || 10;
  const dexterity = player.stats.dexterity || 10;
  const fatiguePercent = player.fatigue / player.maxFatigue;
  
  switch (attempt.type) {
    case 'ford':
      // Allow fording of streams and rivers if not too fatigued
      if (fatiguePercent > 0.8) {
        return {
          possible: false,
          risk: 'high',
          successChance: 0.2,
          reasoning: 'You are too exhausted to safely ford the water.',
          consequences: {
            alternativeSuggestion: 'Rest before attempting to cross.'
          }
        };
      }
      
      return {
        possible: true,
        risk: strength > 12 ? 'low' : 'medium',
        successChance: Math.min(0.9, 0.5 + strength * 0.03),
        reasoning: 'The crossing looks manageable with care.',
        consequences: {
          fatigueCost: 15,
          healthRisk: 10,
          itemLossChance: 0.1
        }
      };
      
    case 'climb':
      if (dexterity < 8) {
        return {
          possible: false,
          risk: 'extreme',
          successChance: 0.1,
          reasoning: 'You lack the agility for this climb.',
          consequences: {
            alternativeSuggestion: 'Find another way around.'
          }
        };
      }
      
      return {
        possible: true,
        risk: dexterity > 14 ? 'low' : 'medium',
        successChance: Math.min(0.85, 0.4 + dexterity * 0.04),
        reasoning: 'The climb is challenging but possible.',
        consequences: {
          fatigueCost: 20,
          healthRisk: 25,
          itemLossChance: 0.05
        }
      };
      
    default:
      return {
        possible: false,
        risk: 'high',
        successChance: 0.3,
        reasoning: 'This action is too risky to attempt.',
        consequences: {
          alternativeSuggestion: 'Consider a different approach.'
        }
      };
  }
}

/**
 * Executes a physical feat after evaluation
 */
export async function executePhysicalFeat(
  attempt: PhysicalFeatAttempt,
  evaluation: PhysicalFeatResult,
  player: PlayerCharacter
): Promise<{
  success: boolean;
  message: string;
  effects?: {
    fatigue?: number;
    damage?: number;
    lostItems?: Item[];
    newPosition?: { x: number, y: number };
  };
}> {
  if (!evaluation.possible) {
    return {
      success: false,
      message: evaluation.reasoning + (evaluation.consequences?.alternativeSuggestion 
        ? ` ${evaluation.consequences.alternativeSuggestion}` 
        : '')
    };
  }
  
  // Roll for success
  const roll = Math.random();
  const success = roll < evaluation.successChance;
  
  const effects: any = {};
  
  if (success) {
    // Apply fatigue cost
    if (evaluation.consequences?.fatigueCost) {
      effects.fatigue = evaluation.consequences.fatigueCost;
    }
    
    // Calculate new position if applicable
    if (attempt.direction) {
      const currentPos = { x: player.location.x, y: player.location.y };
      switch (attempt.direction) {
        case 'north':
          effects.newPosition = { x: currentPos.x, y: currentPos.y - 1 };
          break;
        case 'south':
          effects.newPosition = { x: currentPos.x, y: currentPos.y + 1 };
          break;
        case 'east':
          effects.newPosition = { x: currentPos.x + 1, y: currentPos.y };
          break;
        case 'west':
          effects.newPosition = { x: currentPos.x - 1, y: currentPos.y };
          break;
      }
    }
    
    return {
      success: true,
      message: getSuccessMessage(attempt.type, evaluation.risk),
      effects
    };
  } else {
    // Failed attempt
    if (evaluation.consequences?.healthRisk) {
      effects.damage = Math.floor(evaluation.consequences.healthRisk * (0.5 + Math.random() * 0.5));
    }
    
    if (evaluation.consequences?.itemLossChance && Math.random() < evaluation.consequences.itemLossChance) {
      // Randomly lose an item
      if (player.inventory.length > 0) {
        const lostItem = player.inventory[Math.floor(Math.random() * player.inventory.length)];
        effects.lostItems = [lostItem];
      }
    }
    
    if (evaluation.consequences?.fatigueCost) {
      effects.fatigue = Math.floor(evaluation.consequences.fatigueCost * 0.5); // Still get tired even on failure
    }
    
    return {
      success: false,
      message: getFailureMessage(attempt.type, evaluation.risk),
      effects
    };
  }
}

function getSuccessMessage(featType: FeatType, risk: FeatRisk): string {
  const messages = {
    ford: {
      low: 'You carefully wade across the water, keeping your footing on the rocky bottom.',
      medium: 'With some effort, you push through the current and reach the other side.',
      high: 'Fighting against the strong current, you barely manage to cross, soaked but safe.',
      extreme: 'Against all odds, you survive the treacherous crossing, gasping for breath.'
    },
    climb: {
      low: 'You easily scale the obstacle, finding good handholds.',
      medium: 'With careful movements, you successfully climb to your destination.',
      high: 'Your muscles strain as you pull yourself up, but you make it.',
      extreme: 'By sheer determination, you complete the dangerous climb.'
    },
    jump: {
      low: 'You clear the gap with room to spare.',
      medium: 'You land safely on the other side after a well-timed leap.',
      high: 'You barely make the jump, stumbling on landing but staying upright.',
      extreme: 'Your desperate leap just reaches the other side.'
    },
    swim: {
      low: 'You swim across with steady strokes.',
      medium: 'You power through the water and reach your destination.',
      high: 'Exhausted, you finally drag yourself out of the water.',
      extreme: 'You nearly drown but somehow make it across.'
    }
  } as any;
  
  return messages[featType]?.[risk] || 'You successfully complete the physical feat.';
}

function getFailureMessage(featType: FeatType, risk: FeatRisk): string {
  const messages = {
    ford: {
      low: 'You slip on the wet rocks and have to retreat.',
      medium: 'The current proves too strong and you turn back.',
      high: 'You lose your footing and are swept downstream before scrambling back to shore.',
      extreme: 'The raging waters overwhelm you. You barely escape with your life.'
    },
    climb: {
      low: 'Your grip fails and you slide back down.',
      medium: 'Halfway up, you realize you cannot continue and carefully descend.',
      high: 'You fall from a dangerous height, injuring yourself.',
      extreme: 'You plummet to the ground with a sickening crash.'
    },
    jump: {
      low: 'You misjudge the distance and stop yourself just in time.',
      medium: 'Your leap falls short and you tumble backward.',
      high: 'You fall into the gap, taking damage from the impact.',
      extreme: 'You fall badly, seriously injuring yourself.'
    },
    swim: {
      low: 'The water is too cold and you quickly return to shore.',
      medium: 'Exhaustion forces you to turn back.',
      high: 'You begin to drown and barely make it back, coughing up water.',
      extreme: 'You nearly drown and wash up on shore, unconscious.'
    }
  } as any;
  
  return messages[featType]?.[risk] || 'You fail to complete the physical feat.';
}