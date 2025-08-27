/**
 * services/npcDialogueService.ts - Simple NPC dialogue service for quick interactions
 * Provides context-aware responses for marketplace inhabitants and general NPCs
 */

import { generateNpcDialogue } from './llmClientService';
import { NpcEntity, PlayerCharacter, MapData, HistoricalEra, CulturalZone } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

export interface DialogueContext {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  location: string;
  year: number;
  isMarketplace?: boolean;
  timeOfDay?: string;
  season?: string;
}

export interface DialogueResponse {
  text: string;
  disposition: 'friendly' | 'neutral' | 'hostile' | 'suspicious';
}

/**
 * Generate a quick greeting or idle comment from an NPC
 */
export async function generateNpcGreeting(
  npc: NpcEntity,
  context: DialogueContext,
  playerCharacter?: PlayerCharacter
): Promise<DialogueResponse> {
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
- Season: ${context.season || 'spring'}

${playerCharacter ? `A ${playerCharacter.profession} named ${playerCharacter.name} approaches you.` : 'Someone approaches you.'}

Generate a brief, authentic greeting or comment (1-2 sentences) that reflects:
1. Your personality and social position
2. The historical period and cultural context
3. Your current activity or thoughts
4. Appropriate level of familiarity (first meeting)

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
- Location: ${context.isMarketplace ? 'marketplace' : 'local area'}

${playerCharacter ? `${playerCharacter.name}, a ${playerCharacter.profession}, says to you: "${playerInput}"` : `Someone says to you: "${playerInput}"`}

Respond naturally as your character would, considering:
1. Your social position and relationship to the player
2. The historical context and cultural norms
3. Your personality and likely knowledge
4. Whether this is marketplace business or casual conversation

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