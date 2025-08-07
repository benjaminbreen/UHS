/**
 * api/llm.ts - Vercel Edge Function for LLM requests
 * Handles all Gemini API calls with near-zero cold starts
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

interface LLMRequest {
  operation: string;
  prompt: string;
  context?: any;
  responseSchema?: any;
  model?: string;
  config?: any;
}

export default async function handler(req: NextRequest) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { 
      operation, 
      prompt, 
      context,
      responseSchema,
      model = 'gemini-2.5-flash',
      config,
      ...additionalParams 
    }: LLMRequest = await req.json();

    if (!operation || !prompt) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const generateContentParams = {
      model,
      contents: prompt,
      config: {
        responseMimeType: responseSchema ? "application/json" : "text/plain",
        ...(responseSchema && { responseSchema }),
        ...config
      }
    };

    console.log(`[LLM Edge Function] ${operation} request initiated`);
    const startTime = Date.now();

    const response = await ai.models.generateContent(generateContentParams);
    
    const endTime = Date.now();
    console.log(`[LLM Edge Function] ${operation} completed in ${endTime - startTime}ms`);

    let result = response.text.trim();

    // If it's JSON, parse and return structured response
    if (responseSchema) {
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({
          success: true,
          operation,
          data: parsed,
          processingTimeMs: endTime - startTime
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (parseError) {
        console.error('[LLM Edge Function] JSON parse error:', parseError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid JSON response from AI model',
          rawResponse: result
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Return plain text response
    return new Response(JSON.stringify({
      success: true,
      operation,
      data: result,
      processingTimeMs: endTime - startTime
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[LLM Edge Function] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}