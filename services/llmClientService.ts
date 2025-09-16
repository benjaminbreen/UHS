/**
 * services/llmClientService.ts - Client-side service for LLM calls via Edge Functions
 * Replaces direct Gemini API calls with edge function requests for better performance
 */

import type { Type } from "@google/genai";

interface EdgeLLMRequest {
  operation: string;
  prompt: string;
  context?: any;
  responseSchema?: any;
  model?: string;
  config?: any;
}

interface EdgeLLMResponse {
  success: boolean;
  operation: string;
  data?: any;
  error?: string;
  processingTimeMs?: number;
  rawResponse?: string;
}

/**
 * Makes an LLM request via the Vercel Edge Function
 */
export async function callLLMEdgeFunction(request: EdgeLLMRequest): Promise<EdgeLLMResponse> {
  try {
    console.log(`[LLM Client] Making ${request.operation} request via Edge Function`);
    const startTime = Date.now();

    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: EdgeLLMResponse = await response.json();
    const totalTime = Date.now() - startTime;

    if (!result.success) {
      console.error(`[LLM Client] ${request.operation} failed:`, result.error);
      throw new Error(result.error || 'LLM request failed');
    }

    console.log(`[LLM Client] ${request.operation} completed in ${totalTime}ms (server: ${result.processingTimeMs}ms)`);
    return result;

  } catch (error) {
    console.error(`[LLM Client] ${request.operation} error:`, error);
    throw error;
  }
}

/**
 * Generate NPC dialogue using the edge function
 */
export async function generateNpcDialogue(
  prompt: string,
  npcName: string,
  playerInput: string
): Promise<{
  text: string;
  disposition: 'friendly' | 'neutral' | 'hostile' | 'suspicious';
  grantAccess?: boolean;
  accessLevel?: 'none' | 'partial' | 'full';
  accessReason?: string;
}> {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "The NPC's response to the player, written in character"
      },
      disposition: {
        type: Type.STRING,
        enum: ['friendly', 'neutral', 'hostile', 'suspicious'],
        description: "The NPC's current disposition toward the player"
      },
      grantAccess: {
        type: Type.BOOLEAN,
        description: "Whether this NPC is granting the player access to restricted areas based on the conversation"
      },
      accessLevel: {
        type: Type.STRING,
        enum: ['none', 'partial', 'full'],
        description: "Level of access being granted: none (no access), partial (some areas), full (all areas)"
      },
      accessReason: {
        type: Type.STRING,
        description: "Brief explanation of why access is being granted or denied"
      }
    },
    required: ["text", "disposition"]
  };

  const response = await callLLMEdgeFunction({
    operation: 'npc_dialogue',
    prompt,
    context: { npcName, playerInput },
    responseSchema,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}

/**
 * Summarize conversation for NPC memory
 */
export async function summarizeConversation(
  history: Array<{ speaker: string; text: string }>
): Promise<{ summary: string; sentiment: 'positive' | 'negative' | 'neutral' }> {
  if (history.length <= 1) {
    return { summary: "We briefly exchanged pleasantries.", sentiment: 'neutral' };
  }

  const conversationText = history.map(entry => `${entry.speaker}: ${entry.text}`).join('\n');
  
  const prompt = `
    You are an AI assistant. The following is a dialogue between an NPC and a player. 
    Summarize the key outcome of this conversation into a single, concise sentence from the NPC's perspective.
    Also, determine the overall sentiment of the player's interaction from the NPC's point of view.

    Focus on the most important takeaway for the NPC. Examples:
    - "The player asked me for directions to the old mill." (neutral)
    - "I warned the player about the dangers of the northern woods." (neutral)
    - "The player was kind and offered me a piece of bread." (positive)
    - "The player was rude and demanded I give them my goods." (negative)

    Conversation to summarize:
    ${conversationText}
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { 
        type: Type.STRING, 
        description: "A single, concise sentence summarizing the conversation from the NPC's perspective." 
      },
      sentiment: { 
        type: Type.STRING, 
        enum: ['positive', 'negative', 'neutral'], 
        description: "The player's sentiment from the NPC's perspective during the interaction." 
      }
    },
    required: ["summary", "sentiment"]
  };

  const response = await callLLMEdgeFunction({
    operation: 'summarize_conversation',
    prompt,
    context: { historyLength: history.length },
    responseSchema,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}

/**
 * Generate animal behavior descriptions
 */
export async function generateAnimalDescription(prompt: string): Promise<string> {
  const response = await callLLMEdgeFunction({
    operation: 'animal_description',
    prompt,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}

/**
 * Generate skill descriptions and outcomes
 */
export async function generateSkillResponse(prompt: string): Promise<string> {
  const response = await callLLMEdgeFunction({
    operation: 'skill_response',
    prompt,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}

/**
 * Generate encounter descriptions
 */
export async function generateEncounterDescription(prompt: string): Promise<string> {
  const response = await callLLMEdgeFunction({
    operation: 'encounter_description',
    prompt,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}

/**
 * Generate item descriptions
 */
export async function generateItemDescription(prompt: string): Promise<string> {
  const response = await callLLMEdgeFunction({
    operation: 'item_description',
    prompt,
    model: 'gemini-2.5-flash'
  });

  return response.data;
}