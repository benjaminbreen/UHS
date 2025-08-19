/**
 * LLM Event Service
 * Generates historically accurate custom events using AI
 */

import { GoogleGenAI } from "@google/genai";
import { 
  EventArchetype, 
  EventInstance, 
  SpecialNPC,
  GameMode,
  EventOutcome,
  EventEffect
} from '../types/eventTypes';
import { eventService } from './eventService';

/**
 * LLM Event Generator Service
 */
class LLMEventService {
  private genAI: GoogleGenAI | null = null;
  private cache: Map<string, EventArchetype[]> = new Map();
  private specialNPCs: SpecialNPC[] = [];

  constructor() {
    // Initialize AI only if API key is available
    if (process.env.API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  /**
   * Generate custom events for a specific historical scenario
   */
  async generateCustomEvents(
    gameMode: string,
    historicalContext: string,
    playerContext: string,
    year: number,
    location: string
  ): Promise<EventArchetype[]> {
    // Check cache first
    const cacheKey = `${gameMode}_${year}_${location}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.genAI) {
      console.warn('[LLMEventService] No AI service available, using procedural events');
      return [];
    }

    const prompt = this.buildEventPrompt(gameMode, historicalContext, playerContext, year, location);

    try {
      console.log('[LLMEventService] Generating custom events...');
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1000
        }
      });

      const response = result.text;
      
      // Track API call with input/output
      eventService.trackAPICall(prompt, response);
      const events = this.parseEventResponse(response);
      
      // Cache the results
      this.cache.set(cacheKey, events);
      
      return events;
    } catch (error) {
      console.error('[LLMEventService] Error generating events:', error);
      return [];
    }
  }

  /**
   * Generate special NPCs for a scenario
   */
  async generateSpecialNPCs(
    historicalContext: string,
    year: number,
    location: string,
    count: number = 2
  ): Promise<SpecialNPC[]> {
    if (!this.genAI) {
      return [];
    }

    const prompt = this.buildNPCPrompt(historicalContext, year, location, count);

    try {
      console.log('[LLMEventService] Generating special NPCs...');
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 800
        }
      });

      const response = result.text;
      
      // Track API call with input/output
      eventService.trackAPICall(prompt, response);
      const npcs = this.parseNPCResponse(response);
      
      // Store special NPCs
      this.specialNPCs = npcs;
      
      return npcs;
    } catch (error) {
      console.error('[LLMEventService] Error generating NPCs:', error);
      return [];
    }
  }

  /**
   * Build prompt for event generation
   */
  private buildEventPrompt(
    gameMode: string,
    historicalContext: string,
    playerContext: string,
    year: number,
    location: string
  ): string {
    return `You are a historical accuracy expert creating events for an educational history game.

CONTEXT:
- Game Mode: ${gameMode}
- Year: ${year}
- Location: ${location}
- Historical Context: ${historicalContext}
- Player: ${playerContext}

Generate 3 historically accurate events that could happen in this context.
Each event should:
1. Be grounded in real historical circumstances of that time/place
2. Present meaningful choices that people actually faced
3. Have realistic consequences based on historical precedent
4. Include specific historical details (names, places, customs)
5. Avoid fantasy elements - only real historical possibilities

Format as JSON array with this structure:
[
  {
    "id": "unique_id",
    "title": "Short Event Title",
    "description": "Detailed description with historical specifics",
    "historicalBasis": "What real event/situation this is based on",
    "choices": [
      {
        "text": "Choice description",
        "requirements": "stat:value or null",
        "effects": "health:+10,reputation:-5",
        "historicalNote": "What typically happened when people made this choice"
      }
    ]
  }
]

Focus on daily life, not grand adventures. Most people dealt with:
- Economic survival (taxes, debt, trade)
- Social obligations (family, community, religion)
- Health challenges (disease, injury, childbirth)
- Political changes (new rulers, wars, laws)
- Natural events (weather, harvests, disasters)`;
  }

  /**
   * Build prompt for NPC generation
   */
  private buildNPCPrompt(
    historicalContext: string,
    year: number,
    location: string,
    count: number
  ): string {
    return `You are creating historically accurate NPCs for an educational game.

CONTEXT:
- Year: ${year}
- Location: ${location}
- Historical Context: ${historicalContext}

Generate ${count} special NPCs who would realistically exist in this setting.
Each NPC should:
1. Have a historically accurate occupation/role
2. Speak in period-appropriate language (translated to English)
3. Have realistic concerns for their time/place
4. Offer quests or information relevant to the era
5. Be ordinary people, not famous historical figures

Format as JSON array:
[
  {
    "id": "unique_id",
    "name": "Historically appropriate name",
    "occupation": "Realistic job/role for the era",
    "description": "Physical and personality description",
    "dialogue": [
      "Greeting or introduction",
      "Information about local conditions",
      "Request or offer"
    ],
    "questHint": "What they might ask player to do",
    "historicalNote": "Context about their role in society"
  }
]

Examples of good occupations:
- Medieval: miller, reeve, alewife, pardoner, farrier
- Ancient: scribe, potter, fisherman, slave, merchant
- Early Modern: printer, apothecary, factor, yeoman
- Modern: telegraph operator, factory foreman, union organizer`;
  }

  /**
   * Parse LLM response into event archetypes
   */
  private parseEventResponse(response: string): EventArchetype[] {
    try {
      // Remove markdown code blocks if present
      const cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const data = JSON.parse(cleaned);
      
      if (!Array.isArray(data)) {
        console.error('[LLMEventService] Response is not an array');
        return [];
      }

      return data.map(item => this.convertToEventArchetype(item));
    } catch (error) {
      console.error('[LLMEventService] Failed to parse response:', error);
      return [];
    }
  }

  /**
   * Convert parsed data to EventArchetype
   */
  private convertToEventArchetype(data: any): EventArchetype {
    const outcomes: EventOutcome[] = data.choices?.map((choice: any, index: number) => {
      const effects: EventEffect[] = [];
      
      // Parse effects string like "health:+10,reputation:-5"
      if (choice.effects) {
        const effectPairs = choice.effects.split(',');
        effectPairs.forEach((pair: string) => {
          const [type, value] = pair.split(':');
          if (type && value) {
            effects.push({
              type: type as any,
              target: type,
              value: parseInt(value) || value
            });
          }
        });
      }

      // Parse requirements like "wisdom:12"
      const statChecks = [];
      if (choice.requirements && choice.requirements !== 'null') {
        const [stat, minValue] = choice.requirements.split(':');
        if (stat && minValue) {
          statChecks.push({
            stat: stat as any,
            minimum: parseInt(minValue),
            description: `${stat} ${minValue}+`
          });
        }
      }

      return {
        id: `choice_${index}`,
        buttonText: choice.text || 'Choose',
        description: choice.text || '',
        effects,
        weight: 1,
        statChecks: statChecks.length > 0 ? statChecks : undefined,
        historicalNote: choice.historicalNote
      };
    }) || [];

    return {
      id: data.id || `event_${Date.now()}`,
      template: data.description || 'An event occurs.',
      triggers: [
        { type: 'always', condition: 'true', probability: 1.0 }
      ],
      outcomes,
      variables: []
    };
  }

  /**
   * Parse NPC response
   */
  private parseNPCResponse(response: string): SpecialNPC[] {
    try {
      const cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const data = JSON.parse(cleaned);
      
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(item => ({
        id: item.id || `npc_${Date.now()}_${Math.random()}`,
        name: item.name || 'Unnamed',
        occupation: item.occupation || 'Commoner',
        description: item.description || '',
        dialogue: Array.isArray(item.dialogue) ? item.dialogue : [item.dialogue || 'Hello'],
        location: { x: 0, y: 0 }, // Will be set when spawned
        questId: item.questHint ? `quest_${item.id}` : undefined,
        memory: [],
        isSpecial: true
      }));
    } catch (error) {
      console.error('[LLMEventService] Failed to parse NPC response:', error);
      return [];
    }
  }

  /**
   * Create an event instance from a template
   */
  createEventInstance(archetype: EventArchetype, title?: string): EventInstance {
    return {
      id: `instance_${Date.now()}_${Math.random()}`,
      archetypeId: archetype.id,
      title: title || 'Historical Event',
      description: archetype.template,
      outcomes: archetype.outcomes,
      timestamp: Date.now(),
      isLLMGenerated: true,
      historicalContext: 'Generated based on historical circumstances'
    };
  }

  /**
   * Get cached special NPCs
   */
  getSpecialNPCs(): SpecialNPC[] {
    return this.specialNPCs;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.specialNPCs = [];
  }

  /**
   * Enhance procedural event with historical context
   */
  async enhanceEventWithContext(
    event: EventInstance,
    year: number,
    location: string
  ): Promise<EventInstance> {
    if (!this.genAI) {
      return event;
    }

    const prompt = `Add historical context to this event:
Event: ${event.description}
Year: ${year}
Location: ${location}

Provide a 2-3 sentence historical note explaining what really happened in similar situations during this period. Be specific and educational.`;

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150
        }
      });

      const response = result.text;
      eventService.trackAPICall(prompt, response);
      
      event.historicalContext = response;
      event.isLLMGenerated = true;
      
      return event;
    } catch (error) {
      console.error('[LLMEventService] Failed to enhance event:', error);
      return event;
    }
  }
}

// Export singleton instance
export const llmEventService = new LLMEventService();