/**
 * services/npcDialogueService.ts - Simple NPC dialogue service for quick interactions
 * Provides context-aware responses for marketplace inhabitants and general NPCs
 */

import { generateNpcDialogue } from './llmClientService';
import { NpcEntity, PlayerCharacter, MapData, HistoricalEra, CulturalZone } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { guardPermissionService } from './guardPermissionService';
import { atmosphericContextService, type WeatherState, type GameTimeState, type GameDateState } from './atmosphericContextService';

/**
 * Helper function to create atmospheric-aware dialogue context
 */
export function createAtmosphericDialogueContext(
  baseContext: Omit<DialogueContext, 'gameTime' | 'gameDate' | 'weather'>,
  gameTime?: GameTimeState,
  gameDate?: GameDateState,
  weather?: WeatherState
): DialogueContext {
  return {
    ...baseContext,
    gameTime,
    gameDate,
    weather
  };
}

export interface DialogueContext {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  location: string;
  year: number;
  isMarketplace?: boolean;
  timeOfDay?: string;
  season?: string;

  // Atmospheric context (optional)
  gameTime?: GameTimeState;
  gameDate?: GameDateState;
  weather?: WeatherState;
}

export interface DialogueResponse {
  text: string;
  disposition: 'friendly' | 'neutral' | 'hostile' | 'suspicious';
  grantAccess?: boolean;
  accessLevel?: 'none' | 'partial' | 'full';
  accessReason?: string;
  tradeAvailable?: boolean;
  tradeReason?: string;
}

/**
 * Generate a quick greeting or idle comment from an NPC
 */
export async function generateNpcGreeting(
  npc: NpcEntity,
  context: DialogueContext,
  playerCharacter?: PlayerCharacter
): Promise<DialogueResponse> {
  // Get atmospheric context if available
  let atmosphericPrompt = '';
  if (context.gameTime && context.gameDate && context.weather) {
    const atmosphericContext = atmosphericContextService.getContext(
      context.gameTime,
      context.gameDate,
      context.weather
    );
    atmosphericPrompt = atmosphericContextService.getNpcPromptAdditions(atmosphericContext);
  }

  // Check if NPC was recently threatened (within last 5 minutes)
  const wasRecentlyThreatened = npc.wasThreatenedByWeapon &&
    npc.threatenedByPlayerTimestamp &&
    (Date.now() - npc.threatenedByPlayerTimestamp) < 300000; // 5 minutes

  const threatContext = wasRecentlyThreatened
    ? '\n\n⚠️ IMPORTANT: This person just swung a weapon at you moments ago! You are frightened, angry, or both. Address this immediately - demand an explanation, express fear/anger, or warn them to stay back. This should dominate your response.'
    : '';

  const prompt = `
You are ${npc.name}, a ${npc.age}-year-old ${npc.role} in ${context.location} during ${context.year}.

CHARACTER DETAILS:
- Personality: ${npc.personality || 'practical, hardworking'}
- Social Class: ${npc.class || 'common folk'}
- Religion: ${npc.religion}
- Wealth Level: ${npc.wealthLevel || 'modest'}

CONTEXT:
- Era: ${context.era}
- Cultural Zone: ${context.culturalZone}
- Location: ${context.isMarketplace ? 'marketplace' : 'local area'}
- Time: ${context.timeOfDay || 'midday'}
- Season: ${context.season || 'spring'}${atmosphericPrompt}${threatContext}

${playerCharacter ? `A ${playerCharacter.profession} named ${playerCharacter.name} approaches you.` : 'Someone approaches you.'}

Generate a brief, authentic greeting or comment (1-2 sentences) that reflects:
1. Your personality and social position
2. The historical period and cultural context
3. Your current activity or thoughts
4. Appropriate level of familiarity (first meeting)
5. Any notable celestial phenomena or atmospheric conditions (if relevant)

Keep it natural, period-appropriate, and under 25 words. Show your character's personality subtly.
  `;

  try {
    return await generateNpcDialogue(prompt, npc.name, playerCharacter?.name || 'stranger');
  } catch (error) {
    console.error('Failed to generate NPC greeting:', error);
    return {
      text: getDefaultGreeting(npc, context),
      disposition: 'neutral'
    };
  }
}

/**
 * Generate a response to player interaction or question
 */
export async function generateNpcResponse(
  npc: NpcEntity,
  playerInput: string,
  context: DialogueContext,
  playerCharacter?: PlayerCharacter
): Promise<DialogueResponse> {
  // Get atmospheric context if available
  let atmosphericPrompt = '';
  if (context.gameTime && context.gameDate && context.weather) {
    const atmosphericContext = atmosphericContextService.getContext(
      context.gameTime,
      context.gameDate,
      context.weather
    );
    atmosphericPrompt = atmosphericContextService.getNpcPromptAdditions(atmosphericContext);
  }

  // Check if NPC was recently threatened (within last 5 minutes)
  const wasRecentlyThreatened = npc.wasThreatenedByWeapon &&
    npc.threatenedByPlayerTimestamp &&
    (Date.now() - npc.threatenedByPlayerTimestamp) < 300000; // 5 minutes

  const threatContext = wasRecentlyThreatened
    ? '\n\n⚠️ IMPORTANT: This person just swung a weapon at you moments ago! You are frightened, angry, or both. You should acknowledge this threat in your response - demand they explain themselves, express fear/anger, refuse to cooperate, or threaten to call for help. Do not ignore this!'
    : '';

  const prompt = `
You are ${npc.name}, a ${npc.age}-year-old ${npc.role} in ${context.location} during ${context.year}.

CHARACTER DETAILS:
- Personality: ${npc.personality || 'practical, hardworking'}
- Social Class: ${npc.class || 'common folk'}
- Religion: ${npc.religion}
- Wealth Level: ${npc.wealthLevel || 'modest'}
- Background: ${npc.descriptions?.long || 'A local resident going about their daily business.'}

CONTEXT:
- Era: ${context.era}
- Cultural Zone: ${context.culturalZone}
- Location: ${context.isMarketplace ? 'marketplace' : 'local area'}${atmosphericPrompt}${threatContext}

${playerCharacter ? `${playerCharacter.name}, a ${playerCharacter.profession}, says to you: "${playerInput}"` : `Someone says to you: "${playerInput}"`}

Respond naturally as your character would, considering:
1. Your social position and relationship to the player
2. The historical context and cultural norms
3. Your personality and likely knowledge
4. Whether this is marketplace business or casual conversation
5. Any notable celestial phenomena or atmospheric conditions (if relevant)

Determine if you would be willing to trade:
- Merchants, traders, shopkeepers, and craftsmen should generally be open to trade
- Guards, officials, and nobility rarely trade unless it's relevant to the conversation
- Consider if the player asked about buying, selling, or trading goods
- Hostile NPCs should refuse to trade
- If you're a merchant but the player is being rude, you might refuse

Keep response under 40 words. Be authentic to the time period.
  `;

  try {
    return await generateNpcDialogue(prompt, npc.name, playerInput);
  } catch (error) {
    console.error('Failed to generate NPC response:', error);
    return {
      text: getDefaultResponse(npc, playerInput, context),
      disposition: 'neutral'
    };
  }
}

/**
 * Generate a random internal monologue for an NPC (for portrait click easter egg)
 */
export async function generateNpcMonologue(
  npc: NpcEntity,
  context: DialogueContext,
  clickCount: number = 1
): Promise<string> {
  const monologueTypes = [
    'current concerns or worries',
    'observations about daily life',
    'personal memories or reflections'
  ];
  
  const focusArea = monologueTypes[(clickCount - 1) % monologueTypes.length];
  
  const prompt = `
Generate a brief internal monologue for ${npc.name}, a ${npc.age}-year-old ${npc.role} in ${context.year} ${context.location}.

CHARACTER DETAILS:
- Personality: ${npc.personality || 'practical, hardworking'}
- Social Class: ${npc.class || 'common folk'}
- Wealth Level: ${npc.wealthLevel || 'modest'}

Focus on: ${focusArea}

Write 1-2 sentences of stream-of-consciousness thoughts that reveal:
- Personal concerns appropriate to their social position
- Period-appropriate worries, hopes, or observations
- Subtle personality traits
- Historical context of daily life in ${context.era}

Keep it intimate and authentic, under 30 words. Use italicized, thoughtful tone.
  `;

  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'npc_monologue',
        prompt,
        context: { npcName: npc.name, clickCount },
        model: 'gemini-2.5-flash'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data || result.rawResponse;
    }
    
    throw new Error(result.error || 'Failed to generate monologue');
  } catch (error) {
    console.error('Failed to generate NPC monologue:', error);
    return getDefaultMonologue(npc, context, clickCount);
  }
}

/**
 * Create dialogue context from map data
 */
export function createDialogueContext(
  mapData: MapData,
  options: {
    isMarketplace?: boolean;
    timeOfDay?: string;
    season?: string;
  } = {}
): DialogueContext {
  const dateInfo = parseDateString(mapData.timeSlice || '1650');
  const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
  
  return {
    era: dateInfo.era,
    culturalZone,
    location: mapData.localArea || mapData.continent || 'Unknown Lands',
    year: dateInfo.year,
    isMarketplace: options.isMarketplace,
    timeOfDay: options.timeOfDay,
    season: options.season
  };
}

/**
 * Fallback greetings when LLM fails
 */
function getDefaultGreeting(npc: NpcEntity, context: DialogueContext): string {
  const greetings = [
    `Good day to you.`,
    `Greetings, ${context.isMarketplace ? 'traveler' : 'friend'}.`,
    `May the day treat you well.`,
    `Fair weather for ${context.season || 'traveling'}.`,
    `Peace be with you.`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Fallback responses when LLM fails
 */
function getDefaultResponse(npc: NpcEntity, input: string, context: DialogueContext): string {
  if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('greet')) {
    return getDefaultGreeting(npc, context);
  }
  
  const responses = [
    "I'm afraid I can't help with that.",
    "Perhaps ask someone else about such matters.",
    "Times are uncertain these days.",
    "I must tend to my own affairs.",
    "May fortune favor your endeavors."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Fallback monologue when LLM fails
 */
function getDefaultMonologue(npc: NpcEntity, context: DialogueContext, clickCount: number): string {
  const monologues = [
    "Another day, another struggle to make ends meet...",
    "I wonder what tomorrow will bring to our humble lives.",
    "The world changes, but some things remain constant.",
    "There's always more work to be done around here.",
    "Perhaps things will improve with the changing seasons."
  ];

  return monologues[(clickCount - 1) % monologues.length];
}

/**
 * Generate NPC response in special maps with permission granting capability
 */
export async function generateSpecialMapNpcResponse(
  npc: NpcEntity,
  playerInput: string,
  context: DialogueContext,
  playerCharacter: PlayerCharacter,
  mapId: string,
  mapArchetype?: string,
  authorityContext?: any
): Promise<DialogueResponse> {
  const canGrant = guardPermissionService.canNpcGrantAccess(npc, mapArchetype);
  const currentPermission = guardPermissionService.getPermissionDetails(mapId);

  // Check if this NPC is the leader
  const isLeader = npc.customData?.isLeader === true;

  // Build authority awareness prompt
  let authorityAwareness = '';
  if (authorityContext) {
    authorityAwareness = `
AUTHORITY CONTEXT:
- Current Leader: ${authorityContext.leader.title} ${authorityContext.leader.name}
- Ruling Faction: ${authorityContext.faction.name}
- Faction Description: ${authorityContext.faction.description}
${authorityContext.faction.contextSentence ? `- Historical Context: ${authorityContext.faction.contextSentence}` : ''}
- Government Type: ${authorityContext.governmentType}

${isLeader ?
  `YOU ARE THE LEADER: You are ${authorityContext.leader.title} ${authorityContext.leader.name}, the highest authority in this ${authorityContext.governmentType}.` :
  `You are aware that ${authorityContext.leader.title} ${authorityContext.leader.name} leads this ${authorityContext.governmentType} under the ${authorityContext.faction.name}.`
}`;
  }

  const prompt = `
You are ${npc.name}, a ${npc.age}-year-old ${npc.role} in ${context.location} during ${context.year}.

CHARACTER DETAILS:
- Personality: ${npc.personality || 'practical, hardworking'}
- Social Class: ${npc.class || npc.socialClass || 'common folk'}
- Religion: ${npc.religion}
- Wealth Level: ${npc.wealthLevel || 'modest'}
- Profession: ${npc.profession}
- Background: ${npc.descriptions?.long || 'A local resident going about their daily business.'}

PLAYER DETAILS:
- Name: ${playerCharacter.name}
- Profession: ${playerCharacter.profession}
- Social Class: ${playerCharacter.socialClass}
- Reputation: ${playerCharacter.mapReputation || 50}/100
- Clothing Quality: ${getClothingQuality(playerCharacter)}

LOCATION CONTEXT:
- Era: ${context.era}
- Cultural Zone: ${context.culturalZone}
- Building Type: ${mapArchetype || 'special building'}
- Year: ${context.year}

${authorityAwareness}

CONVERSATION:
${playerCharacter.name} says to you: "${playerInput}"

AUTHORITY TO GRANT ACCESS:
${canGrant ?
  `You HAVE the authority to grant access to restricted areas in this ${mapArchetype || 'building'}. You can grant "partial" access (some areas) or "full" access (all areas) based on your judgment.` :
  `You do NOT have the authority to grant access to restricted areas. Only higher-ranking individuals can make such decisions.`}

CURRENT ACCESS STATUS:
${currentPermission ?
  `${playerCharacter.name} already has ${currentPermission.accessLevel} access granted by ${currentPermission.grantedByName}.` :
  `${playerCharacter.name} currently has no special access permissions.`}

DECISION FACTORS:
Consider these when deciding whether to grant access:
- Player's reputation (${playerCharacter.mapReputation || 50}/100)
- Player's social class and profession
- Quality of their clothing/appearance
- Convincingness of their stated reason
- Historical appropriateness for your era/culture
- Your character's personality and disposition

INSTRUCTIONS:
1. Respond naturally as your character would
2. If you have authority AND decide to grant access, set grantAccess to true and specify the level
3. Always provide an accessReason explaining your decision
4. Keep response under 50 words and authentic to the time period
5. Be generous but not unrealistic - consider the player's standing and request

Examples of good reasons to grant access:
- High reputation (80+) + official business + appropriate attire
- Matching social class + convincing explanation
- Small bribe offered (if culturally appropriate) + reasonable request

Examples to deny:
- Very poor reputation (<30) + suspicious behavior
- Inappropriate attire for the setting
- No valid reason given + low social standing
`;

  try {
    return await generateNpcDialogue(prompt, npc.name, playerInput);
  } catch (error) {
    console.error('Failed to generate special map NPC response:', error);
    return {
      text: getDefaultResponse(npc, playerInput, context),
      disposition: 'neutral'
    };
  }
}

/**
 * Determine clothing quality from player appearance
 */
function getClothingQuality(player: PlayerCharacter): string {
  const clothing = (player.appearance as any)?.clothing;
  if (!Array.isArray(clothing) || clothing.length === 0) {
    const garmentName = player.appearance?.garment?.name?.toLowerCase() || '';
    const garmentMaterial = player.appearance?.garment?.material?.toLowerCase() || '';
    const accessoryName = player.appearance?.accessory?.name?.toLowerCase() || '';
    const accessoryMaterial = player.appearance?.accessory?.material?.toLowerCase() || '';
    const headgearName = player.appearance?.headgear?.name?.toLowerCase() || '';
    const headgearMaterial = player.appearance?.headgear?.material?.toLowerCase() || '';
    const combined = `${garmentName} ${garmentMaterial} ${accessoryName} ${accessoryMaterial} ${headgearName} ${headgearMaterial}`;

    if (/(silk|gold|silver|velvet|brocade|jewel|gem|crimson|royal)/.test(combined)) return 'expensive/formal';
    if (/(wool|linen|leather|fine|well-made|embroidered)/.test(combined)) return 'decent';
    if (/(rough|patched|rag|frayed|torn)/.test(combined)) return 'poor';

    return 'basic';
  }

  const hasExpensive = clothing.some((item: any) =>
    item.material?.includes('silk') ||
    item.material?.includes('gold') ||
    item.material?.includes('silver') ||
    item.quality === 'excellent'
  );

  if (hasExpensive) return 'expensive/formal';

  const hasDecent = clothing.some((item: any) =>
    item.quality === 'good' ||
    item.material?.includes('wool')
  );

  return hasDecent ? 'decent' : 'poor';
}
