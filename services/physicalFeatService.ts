/**
 * Service for evaluating and executing physical feats like fording, climbing, jumping, etc.
 * Uses LLM to determine feasibility based on context.
 */

import { PlayerCharacter, Tile, BiomeType, MapData, Item } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import gameSounds from './gameSoundsService';
import { handleSkillFailureInjury } from './injuryService';

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
    /\b(climb|scale)\s+(up\s+)?(the\s+|a\s+)?(tree|wall|cliff|rock|mountain|tower|fence|ladder)(\s+(to\s+the\s+)?(north|south|east|west))?/i,
    /\b(ascend|scale)\s+(the\s+)(wall|cliff|fortress|castle|peak|mountain)(\s+(to\s+the\s+)?(north|south|east|west))?/i,
    /\b(try|attempt|want)\s+to\s+(climb|scale|ascend)\s+(up\s+)?(the\s+|a\s+)?(\w+)(\s+(to\s+the\s+)?(north|south|east|west))?/i,
    /\b(climb|get|come)\s+(down|out)(\s+(from|of)\s+(the\s+)?(tree|wall|cliff|rock|mountain|tower))?/i
  ];
  
  // Jumping patterns - permissive for dangerous actions
  const jumpingPatterns = [
    // Traditional jumping across things
    /\b(jump|leap)\s+(across|over)\s+(the\s+|a\s+)?(gap|chasm|ravine|stream|fence|wall|obstacle)/i,
    /\b(vault)\s+(over)\s+(the\s+|a\s+)?(wall|fence|barrier|obstacle)/i,

    // Dangerous jumping off/into things - be permissive
    /\b(jump|leap)\s+(off|from|down)\s+(the\s+|a\s+)?(cliff|mountain|peak|height|ledge|wall|tree)(\s+(to\s+the\s+)?(north|south|east|west|left|right))?/i,
    /\b(jump|leap)\s+(into|in)\s+(the\s+|a\s+)?(water|ocean|river|lake|sea|pond|stream)(\s+(to\s+the\s+)?(north|south|east|west|left|right))?/i,
    /\b(jump|leap)\s+(down|off)(\s+(from\s+)?(here|this|the\s+\w+))?(\s+(to\s+the\s+)?(north|south|east|west|left|right))?/i,

    // General attempts
    /\b(try|attempt|want)\s+to\s+(jump|leap|vault)\s+(across|over|off|into|down)\s+(the\s+|a\s+)?(\w+)/i
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
      // Extract direction if present in the climbing pattern
      const directionMatch = match[0].match(/\b(north|south|east|west)\b/i);
      return {
        type: 'climb',
        targetDescription: match[0],
        direction: directionMatch ? directionMatch[1].toLowerCase() as any : undefined
      };
    }
  }
  
  // Check jumping
  for (const pattern of jumpingPatterns) {
    const match = lowercaseInput.match(pattern);
    if (match) {
      // Extract direction from jump command (including left/right)
      const directionMatch = match[0].match(/\b(north|south|east|west|left|right)\b/i);
      return {
        type: 'jump',
        targetDescription: match[0],
        direction: directionMatch ? directionMatch[1].toLowerCase() as any : undefined
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
    "healthRisk": number (0-100 potential damage if failed),
    "itemLossChance": number (0.0-1.0 chance of losing items),
    "alternativeSuggestion": "string (optional suggestion if not possible)"
  }
}

IMPORTANT PHILOSOPHY: Players should be allowed to do dangerous things if they choose to!
- Jumping off cliffs: ALWAYS POSSIBLE (but high damage risk)
- Jumping into water: ALWAYS POSSIBLE (but drowning risk)
- Dangerous climbing: Usually possible (but fall risk)

This is a permissive system - let players make bad decisions and face consequences.
The game will handle health consequences automatically. Your job is to evaluate feasibility, not prevent stupidity.

Success chance guidelines (be generous):
- For low risk actions: 80-95% success chance
- For medium risk: 60-80% success chance
- For high risk: 40-60% success chance
- For extreme risk: 20-40% success chance

For dangerous actions like "jump off cliff" or "jump into water":
- Always mark as possible: true
- Set high healthRisk (30-80) for serious consequences
- Give reasonable success chances (players should usually succeed at the action itself, but face the health consequences)`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
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
      if (fatiguePercent > 0.9) {
        return {
          possible: false,
          risk: 'high',
          successChance: 0.3,
          reasoning: 'You are too exhausted to safely ford the water.',
          consequences: {
            alternativeSuggestion: 'Rest before attempting to cross.'
          }
        };
      }

      // Base 60% chance for fording, plus bonuses for strength
      const baseChance = 0.6;
      const strengthBonus = strength * 0.025;
      const fatiguePenalty = fatiguePercent > 0.6 ? 0.1 : 0;

      return {
        possible: true,
        risk: strength > 14 ? 'low' : (strength > 10 ? 'medium' : 'high'),
        successChance: Math.min(0.95, baseChance + strengthBonus - fatiguePenalty),
        reasoning: 'The crossing looks manageable with care.',
        consequences: {
          fatigueCost: 10,
          healthRisk: 8,
          itemLossChance: 0.05
        }
      };
      
    case 'climb':
      if (dexterity < 5) {
        return {
          possible: false,
          risk: 'extreme',
          successChance: 0.2,
          reasoning: 'You lack the agility for this climb.',
          consequences: {
            alternativeSuggestion: 'Find another way around or improve your dexterity.'
          }
        };
      }

      // Base 50% chance, plus 3% per dexterity point
      // Dexterity 10 = 80% chance, Dexterity 15 = 95% chance
      const climbBaseChance = 0.5;
      const dexBonus = dexterity * 0.03;
      const climbStrengthBonus = (strength > 12) ? 0.05 : 0; // Small bonus for strong characters

      return {
        possible: true,
        risk: dexterity > 14 ? 'low' : (dexterity > 10 ? 'medium' : 'high'),
        successChance: Math.min(0.95, climbBaseChance + dexBonus + climbStrengthBonus),
        reasoning: 'The climb looks manageable with careful handholds.',
        consequences: {
          fatigueCost: 15,
          healthRisk: 20,
          itemLossChance: 0.03
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
 * Auto-detect target tile for movement based on feat type and surrounding terrain
 */
function detectTargetTile(
  attempt: PhysicalFeatAttempt,
  player: PlayerCharacter,
  mapData: MapData
): { direction?: 'north' | 'south' | 'east' | 'west', targetTile?: Tile } | null {
  if (!mapData?.tiles || !player.location) return null;

  const currentX = player.location.x;
  const currentY = player.location.y;

  // Get adjacent tiles
  const adjacentTiles = [
    { direction: 'north' as const, x: currentX, y: currentY - 1 },
    { direction: 'south' as const, x: currentX, y: currentY + 1 },
    { direction: 'east' as const, x: currentX + 1, y: currentY },
    { direction: 'west' as const, x: currentX - 1, y: currentY }
  ].filter(({x, y}) =>
    y >= 0 && y < mapData.tiles.length &&
    x >= 0 && x < mapData.tiles[0].length
  ).map(({direction, x, y}) => ({
    direction,
    x,
    y,
    tile: mapData.tiles[y][x]
  }));

  // For climbing, look for higher elevation or climbable terrain
  if (attempt.type === 'climb') {
    const currentTile = mapData.tiles[currentY][currentX];
    const climbableTargets = adjacentTiles.filter(({tile}) => {
      // Look for higher elevation or climbable biomes
      return tile.altitude > currentTile.altitude ||
             ['MOUNTAIN', 'HILLS', 'ROCKY_OUTCROPS', 'CLIFF', 'WALL', 'WALL_GATE', 'WALL_WINDOW', 'WALL_LOW'].includes(tile.biome as any);
    });

    console.log('[PhysicalFeat] Climbing detection:', {
      currentTile: { biome: currentTile.biome, altitude: currentTile.altitude },
      adjacentTiles: adjacentTiles.map(t => ({ direction: t.direction, biome: t.tile.biome, altitude: t.tile.altitude })),
      climbableTargets: climbableTargets.map(t => ({ direction: t.direction, biome: t.tile.biome, altitude: t.tile.altitude }))
    });

    if (climbableTargets.length === 1) {
      // Only one climbable target, auto-select it
      const target = climbableTargets[0];
      console.log('[PhysicalFeat] Auto-selecting climb target:', target.direction, target.tile.biome);
      return {
        direction: target.direction,
        targetTile: target.tile
      };
    } else if (climbableTargets.length > 1) {
      console.log('[PhysicalFeat] Multiple climb targets available, need direction specification');
    } else {
      console.log('[PhysicalFeat] No climbable targets found around player');
    }
  }

  // For fording, look for water tiles
  if (attempt.type === 'ford') {
    const waterTargets = adjacentTiles.filter(({tile}) =>
      ['RIVER', 'STREAM', 'SHOALS'].includes(tile.biome as any)
    );

    if (waterTargets.length === 1) {
      const target = waterTargets[0];
      return {
        direction: target.direction,
        targetTile: target.tile
      };
    }
  }

  // For jumping, handle different jump scenarios
  if (attempt.type === 'jump') {
    const currentTile = mapData.tiles[currentY][currentX];

    // Jump off cliff/mountain (dangerous downward jumps)
    if (attempt.targetDescription.toLowerCase().includes('off') ||
        attempt.targetDescription.toLowerCase().includes('down')) {

      const jumpDownTargets = adjacentTiles.filter(({tile}) =>
        tile.altitude < currentTile.altitude - 0.5 || // Lower terrain
        !['MOUNTAIN', 'CLIFF', 'HIGH_PEAK'].includes(tile.biome as any) // Non-cliff terrain
      );

      if (jumpDownTargets.length === 1) {
        return {
          direction: jumpDownTargets[0].direction,
          targetTile: jumpDownTargets[0].tile
        };
      } else if (jumpDownTargets.length > 1) {
        // Multiple valid targets, pick random if no direction specified
        const randomTarget = jumpDownTargets[Math.floor(Math.random() * jumpDownTargets.length)];
        return {
          direction: randomTarget.direction,
          targetTile: randomTarget.tile
        };
      }
    }

    // Jump into water
    if (attempt.targetDescription.toLowerCase().includes('into') &&
        attempt.targetDescription.toLowerCase().includes('water')) {

      console.log('[PhysicalFeat] Looking for water tiles. Adjacent tiles:',
        adjacentTiles.map(t => ({ dir: t.direction, biome: t.tile.biome })));

      const waterTargets = adjacentTiles.filter(({tile}) =>
        ['RIVER', 'STREAM', 'LAKE', 'OCEAN', 'SHALLOW_OCEAN', 'DEEP_OCEAN', 'POND', 'WETLANDS'].includes(tile.biome as any)
      );

      console.log('[PhysicalFeat] Found water targets:', waterTargets.length,
        waterTargets.map(t => ({ dir: t.direction, biome: t.tile.biome })));

      if (waterTargets.length === 1) {
        console.log('[PhysicalFeat] Single water target found:', waterTargets[0].direction);
        return {
          direction: waterTargets[0].direction,
          targetTile: waterTargets[0].tile
        };
      } else if (waterTargets.length > 1) {
        // Multiple water tiles, pick random
        const randomTarget = waterTargets[Math.floor(Math.random() * waterTargets.length)];
        console.log('[PhysicalFeat] Multiple water targets, picking:', randomTarget.direction);
        return {
          direction: randomTarget.direction,
          targetTile: randomTarget.tile
        };
      } else {
        console.log('[PhysicalFeat] No water targets found adjacent to player');
      }
    }

    // Traditional gap jumping or obstacle crossing
    const jumpTargets = adjacentTiles.filter(({tile}) =>
      ['CHASM', 'RAVINE', 'STREAM'].includes(tile.biome as any) ||
      tile.altitude < currentTile.altitude - 2
    );

    if (jumpTargets.length === 1) {
      const target = jumpTargets[0];
      return {
        direction: target.direction,
        targetTile: target.tile
      };
    }
  }

  return null;
}

/**
 * Executes a physical feat after evaluation
 */
export async function executePhysicalFeat(
  attempt: PhysicalFeatAttempt,
  evaluation: PhysicalFeatResult,
  player: PlayerCharacter,
  mapData?: MapData,
  currentDate?: { year: number; month: number; day: number }
): Promise<{
  success: boolean;
  message: string;
  effects?: {
    fatigue?: number;
    damage?: number;
    lostItems?: Item[];
    newPosition?: { x: number, y: number };
    injury?: any;
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
  const soundService = gameSounds;

  if (success) {
    // Play success sound based on feat type
    switch (attempt.type) {
      case 'climb':
        if (attempt.targetDescription.toLowerCase().includes('tree')) {
          soundService.playStairsSound(); // Climbing up sound
        } else if (attempt.targetDescription.toLowerCase().includes('down')) {
          soundService.playFootstepSound(); // Landing on ground
        } else {
          soundService.playStairsSound(); // General climbing sound
        }
        break;
      case 'ford':
      case 'swim':
        soundService.playShipMovementSplash(); // Water sound
        break;
      case 'jump':
        soundService.playFootstepSound(); // Landing sound
        break;
      default:
        soundService.playDiscoverySound(); // Generic success
    }

    // Apply fatigue cost
    if (evaluation.consequences?.fatigueCost) {
      effects.fatigue = evaluation.consequences.fatigueCost;
    }

    // Apply immediate damage for dangerous actions
    const isDangerousJump = attempt.type === 'jump' &&
      (attempt.targetDescription.toLowerCase().includes('off') ||
       attempt.targetDescription.toLowerCase().includes('into water'));

    if (isDangerousJump) {
      // Calculate damage based on danger level
      let immediateDamage = 0;

      if (attempt.targetDescription.toLowerCase().includes('off')) {
        // Jumping off cliff/mountain - significant fall damage
        const currentTile = mapData?.tiles?.[player.location.y]?.[player.location.x];
        if (currentTile?.biome === 'CLIFF' || currentTile?.biome === 'MOUNTAIN' || currentTile?.biome === 'HIGH_PEAK') {
          immediateDamage = Math.floor(Math.random() * 30) + 20; // 20-50 damage
        } else {
          immediateDamage = Math.floor(Math.random() * 15) + 10; // 10-25 damage for lower heights
        }
      }

      if (attempt.targetDescription.toLowerCase().includes('into water')) {
        // Jumping into water - moderate impact damage
        immediateDamage = Math.floor(Math.random() * 10) + 5; // 5-15 damage
        // Mark player as in water for drowning system
        effects.inWater = true;
        effects.waterEntryTime = Date.now();
      }

      if (immediateDamage > 0) {
        effects.damage = (effects.damage || 0) + immediateDamage;
      }
    }

    // Calculate new position if applicable
    let targetDirection = attempt.direction;
    let targetTile = attempt.targetTile;

    // If no direction specified, try auto-detection
    if (!targetDirection && mapData) {
      const autoTarget = detectTargetTile(attempt, player, mapData);
      if (autoTarget) {
        targetDirection = autoTarget.direction;
        targetTile = autoTarget.targetTile;
        console.log('[PhysicalFeat] Auto-detected target:', targetDirection, 'to', targetTile?.biome);
      } else if ((attempt.type === 'climb') ||
                 (attempt.type === 'jump' && !attempt.targetDescription.toLowerCase().includes('water'))) {
        // Fallback for climbing or non-water jumps: if no specific target found,
        // pick a random adjacent tile (let them move somewhere dangerous)
        console.log('[PhysicalFeat] Using fallback movement - no specific target detected');
        const adjacentDirections = ['north', 'south', 'east', 'west'] as const;
        const validDirections = adjacentDirections.filter(dir => {
          const currentPos = { x: player.location.x, y: player.location.y };
          let targetX = currentPos.x, targetY = currentPos.y;

          switch (dir) {
            case 'north': targetY--; break;
            case 'south': targetY++; break;
            case 'east': targetX++; break;
            case 'west': targetX--; break;
          }

          // Check if target position is within bounds
          return targetY >= 0 && targetY < mapData.tiles.length &&
                 targetX >= 0 && targetX < mapData.tiles[0].length;
        });

        if (validDirections.length > 0) {
          // Pick random valid direction
          targetDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
          const currentPos = { x: player.location.x, y: player.location.y };
          let targetX = currentPos.x, targetY = currentPos.y;

          switch (targetDirection) {
            case 'north': targetY--; break;
            case 'south': targetY++; break;
            case 'east': targetX++; break;
            case 'west': targetX--; break;
          }

          targetTile = mapData.tiles[targetY][targetX];
          console.log('[PhysicalFeat] Fallback movement - no specific target found, moving', targetDirection, 'to', targetTile.biome);
        }
      }
    }

    // Check if this is tree climbing or climbing down
    const isTreeClimbing = attempt.type === 'climb' &&
      attempt.targetDescription.toLowerCase().includes('tree') &&
      !attempt.targetDescription.toLowerCase().includes('down');

    const isClimbingDown = attempt.type === 'climb' &&
      (attempt.targetDescription.toLowerCase().includes('down') ||
       attempt.targetDescription.toLowerCase().includes('out'));

    if (isTreeClimbing) {
      // Tree climbing: stay on same tile but set elevated state
      effects.elevatedState = 'in_tree';
      effects.elevationDescription = 'up in the tree branches';
      // Extra rustling sound for tree climbing
      setTimeout(() => soundService.playFootstepSound(), 100);
    } else if (isClimbingDown) {
      // Climbing down: remove elevated state
      effects.elevatedState = null;
      effects.elevationDescription = null;
      // Landing sound when coming down
      soundService.playFootstepSound();
    } else if (targetDirection) {
      // Normal movement to adjacent tile
      const currentPos = { x: player.location.x, y: player.location.y };
      switch (targetDirection) {
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
    // Failed attempt - play failure sound based on feat type
    switch (attempt.type) {
      case 'climb':
        soundService.playWallBumpSound(); // Hit the wall/cliff
        if (evaluation.consequences?.healthRisk && evaluation.consequences.healthRisk > 15) {
          setTimeout(() => soundService.playDamageSound('medium'), 200); // Fall damage
        }
        break;
      case 'ford':
      case 'swim':
        soundService.playEnvironmentalHazardSound('cold'); // Water hazard
        break;
      case 'jump':
        soundService.playDamageSound('light'); // Stumble/trip
        break;
      default:
        soundService.playWallBumpSound(); // Generic failure
    }

    // Use injury system for realistic injuries instead of raw damage
    if (evaluation.consequences?.healthRisk && currentDate) {
      const injuryContext = {
        type: 'physical_feat' as const,
        featType: attempt.type,
        risk: evaluation.risk,
        severity: evaluation.consequences.healthRisk / 50 // Convert to 0-1 scale
      };

      const injuryResult = handleSkillFailureInjury(player, injuryContext, currentDate);

      if (injuryResult.injured) {
        effects.injury = injuryResult.injury;
        // Update message to include injury
        return {
          success: false,
          message: `${getFailureMessage(attempt.type, evaluation.risk)}\n\n${injuryResult.message}`,
          effects
        };
      } else {
        // Fallback to minor damage if no injury occurred
        effects.damage = Math.floor(evaluation.consequences.healthRisk * 0.3);
      }
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
      low: 'You leap gracefully and land safely on the other side.',
      medium: 'You make the jump successfully, landing with a solid thud.',
      high: 'You barely make the dangerous leap, stumbling on landing but staying upright.',
      extreme: 'Against all odds, your desperate jump carries you to safety.'
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