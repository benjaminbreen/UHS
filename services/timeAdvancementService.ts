/**
 * services/timeAdvancementService.ts
 * Handles time advancement with procedural event generation
 */

import { PlayerCharacter, ClimateType, Season, BiomeType } from '../types';
import { minigameLLMService } from './minigameLLMService';

export interface TimeAdvancementRequest {
  duration: number; // in hours
  durationType: 'hours' | 'until-dawn' | 'until-dusk' | 'until-morning' | 'days' | 'weeks';
  activity?: 'resting' | 'camping' | 'traveling' | 'waiting' | 'working';
  location?: {
    biome: BiomeType;
    climate: ClimateType;
    season: Season;
    isDangerous?: boolean;
  };
}

export interface TimeEvent {
  day: number; // Which day of the time skip this occurred
  hour?: number; // Hour within that day
  type: 'weather' | 'encounter' | 'observation' | 'dream' | 'health' | 'resource';
  severity: 'minor' | 'moderate' | 'significant';
  description: string;
}

export interface TimeAdvancementResult {
  hoursPassed: number;
  daysPassed: number;
  events: TimeEvent[];
  summary: string;
  resourceChanges: {
    health?: number;
    fatigue?: number;
    hunger?: number;
    thirst?: number;
  };
}

class TimeAdvancementService {
  /**
   * Main entry point for time advancement
   */
  async advanceTime(
    request: TimeAdvancementRequest,
    playerCharacter: PlayerCharacter,
    currentHour: number,
    currentDay: number,
    currentMonth: number,
    currentYear: number
  ): Promise<TimeAdvancementResult> {
    // Calculate actual hours to advance
    const hours = this.calculateHours(request, currentHour);
    const days = Math.floor(hours / 24);

    console.log(`[TimeAdvancement] Advancing ${hours} hours (${days} days) - Activity: ${request.activity}`);

    // Generate events during the time period
    const events = await this.generateEvents(request, hours, days, playerCharacter);

    // Calculate resource changes
    const resourceChanges = this.calculateResourceChanges(request, hours, playerCharacter);

    // Generate LLM summary of what happened
    const summary = await this.generateSummary(request, hours, days, events, playerCharacter);

    return {
      hoursPassed: hours,
      daysPassed: days,
      events,
      summary,
      resourceChanges
    };
  }

  /**
   * Calculate actual hours from request
   */
  private calculateHours(request: TimeAdvancementRequest, currentHour: number): number {
    switch (request.durationType) {
      case 'hours':
        return request.duration;

      case 'until-dawn':
        // Dawn is 6am
        if (currentHour < 6) {
          return 6 - currentHour;
        } else {
          return (24 - currentHour) + 6;
        }

      case 'until-dusk':
        // Dusk is 19 (7pm)
        if (currentHour < 19) {
          return 19 - currentHour;
        } else {
          return (24 - currentHour) + 19;
        }

      case 'until-morning':
        // Morning is 8am
        if (currentHour < 8) {
          return 8 - currentHour;
        } else {
          return (24 - currentHour) + 8;
        }

      case 'days':
        return request.duration * 24;

      case 'weeks':
        return request.duration * 24 * 7;

      default:
        return request.duration;
    }
  }

  /**
   * Generate random events during the time period
   */
  private async generateEvents(
    request: TimeAdvancementRequest,
    hours: number,
    days: number,
    playerCharacter: PlayerCharacter
  ): Promise<TimeEvent[]> {
    const events: TimeEvent[] = [];

    // Determine how many events to generate based on duration and danger
    const dangerMultiplier = request.location?.isDangerous ? 1.5 : 1.0;
    const baseEventChance = request.activity === 'traveling' ? 0.3 : 0.15;
    const expectedEvents = Math.floor((days + 1) * baseEventChance * dangerMultiplier);
    const eventCount = Math.max(1, Math.min(5, expectedEvents)); // 1-5 events max

    // If very short duration (< 3 hours), maybe no events
    if (hours < 3 && Math.random() > 0.3) {
      return events;
    }

    for (let i = 0; i < eventCount; i++) {
      const event = this.generateRandomEvent(request, days, hours, i, eventCount);
      if (event) {
        events.push(event);
      }
    }

    // Sort events by day and hour
    events.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.hour || 0) - (b.hour || 0);
    });

    return events;
  }

  /**
   * Generate a single random event
   */
  private generateRandomEvent(
    request: TimeAdvancementRequest,
    totalDays: number,
    totalHours: number,
    index: number,
    totalEvents: number
  ): TimeEvent | null {
    // Spread events across the time period
    const eventDay = totalDays > 0
      ? Math.floor((index / totalEvents) * totalDays)
      : 0;
    const eventHour = totalDays === 0
      ? Math.floor((index / totalEvents) * totalHours)
      : Math.floor(Math.random() * 24);

    const eventTypes: Array<{ type: TimeEvent['type']; weight: number }> = [
      { type: 'weather', weight: 0.3 },
      { type: 'encounter', weight: request.location?.isDangerous ? 0.25 : 0.15 },
      { type: 'observation', weight: 0.25 },
      { type: 'dream', weight: request.activity === 'resting' ? 0.15 : 0.05 },
      { type: 'health', weight: 0.05 },
      { type: 'resource', weight: 0.1 }
    ];

    const totalWeight = eventTypes.reduce((sum, e) => sum + e.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;
    let selectedType: TimeEvent['type'] = 'observation';

    for (const eventType of eventTypes) {
      cumulative += eventType.weight;
      if (rand < cumulative) {
        selectedType = eventType.type;
        break;
      }
    }

    const severity = this.randomSeverity();
    const description = this.generateEventDescription(selectedType, severity, request);

    return {
      day: eventDay,
      hour: eventHour,
      type: selectedType,
      severity,
      description
    };
  }

  /**
   * Generate event description based on type
   */
  private generateEventDescription(
    type: TimeEvent['type'],
    severity: TimeEvent['severity'],
    request: TimeAdvancementRequest
  ): string {
    const location = request.location;
    const activity = request.activity || 'waiting';

    switch (type) {
      case 'weather':
        return this.getWeatherEvent(severity, location);
      case 'encounter':
        return this.getEncounterEvent(severity, location);
      case 'observation':
        return this.getObservationEvent(severity, location);
      case 'dream':
        return this.getDreamEvent(severity);
      case 'health':
        return this.getHealthEvent(severity);
      case 'resource':
        return this.getResourceEvent(severity, activity);
      default:
        return 'The time passes quietly.';
    }
  }

  private getWeatherEvent(severity: string, location?: TimeAdvancementRequest['location']): string {
    const weather = [
      'A light rain begins to fall.',
      'Dark clouds gather overhead.',
      'A sudden gust of wind sweeps through.',
      'The sun breaks through the clouds briefly.',
      'A gentle mist settles over the area.'
    ];
    const severeWeather = [
      'A violent storm erupts, forcing you to seek shelter.',
      'Lightning strikes nearby, the thunder deafening.',
      'Heavy rain turns the ground to mud.',
      'A powerful windstorm batters everything in its path.'
    ];

    if (severity === 'significant') {
      return severeWeather[Math.floor(Math.random() * severeWeather.length)];
    }
    return weather[Math.floor(Math.random() * weather.length)];
  }

  private getEncounterEvent(severity: string, location?: TimeAdvancementRequest['location']): string {
    const minor = [
      'You spot a deer in the distance, watching you cautiously.',
      'A merchant passes by, offering a brief greeting.',
      'Local villagers glance your way before continuing their work.',
      'A curious bird follows you for a time before flying off.'
    ];
    const moderate = [
      'A group of travelers shares their fire and news from distant lands.',
      'You encounter a patrol, but they let you pass after questioning.',
      'A wild animal crosses your path but keeps its distance.',
      'Someone calls out a warning about bandits in the area.'
    ];
    const significant = [
      'Armed strangers approach with hostile intent, but withdraw when they see you\'re prepared.',
      'A desperate refugee begs for food and shelter.',
      'You narrowly avoid a dangerous predator stalking the area.',
      'Local authorities demand to see your papers and ask many questions.'
    ];

    if (severity === 'significant') return significant[Math.floor(Math.random() * significant.length)];
    if (severity === 'moderate') return moderate[Math.floor(Math.random() * moderate.length)];
    return minor[Math.floor(Math.random() * minor.length)];
  }

  private getObservationEvent(severity: string, location?: TimeAdvancementRequest['location']): string {
    const observations = [
      'You notice interesting cloud formations in the sky.',
      'The sound of distant bells carries on the wind.',
      'Wild flowers bloom along the path.',
      'You observe the daily rhythms of life around you.',
      'The changing light creates beautiful patterns.',
      'A particular tree catches your attention with its unusual shape.',
      'You spot signs of recent activity - footprints, a cold campfire.',
      'The stars are especially brilliant tonight.'
    ];
    return observations[Math.floor(Math.random() * observations.length)];
  }

  private getDreamEvent(severity: string): string {
    const dreams = [
      'You have a vivid dream of places you\'ve never been.',
      'Strange visions visit your sleep - symbols and faces you don\'t recognize.',
      'You dream of your past, memories both clear and distorted.',
      'A prophetic dream troubles you, though its meaning is unclear.',
      'You sleep deeply, dreamless and restorative.',
      'Nightmares wake you briefly, but fade quickly from memory.'
    ];
    return dreams[Math.floor(Math.random() * dreams.length)];
  }

  private getHealthEvent(severity: string): string {
    const minor = [
      'You feel a slight headache but it passes.',
      'Your muscles ache from the exertion.',
      'You notice a small cut that must have happened earlier.',
      'A brief dizzy spell passes quickly.'
    ];
    const moderate = [
      'You develop a persistent cough.',
      'An old injury flares up, causing discomfort.',
      'You feel feverish for a few hours.',
      'Stomach troubles plague you for a time.'
    ];

    if (severity === 'significant' || severity === 'moderate') {
      return moderate[Math.floor(Math.random() * moderate.length)];
    }
    return minor[Math.floor(Math.random() * minor.length)];
  }

  private getResourceEvent(severity: string, activity: string): string {
    const events = [
      'You find some edible berries growing nearby.',
      'A clear spring provides fresh water.',
      'You manage to catch some small game.',
      'Foraging yields herbs and roots.',
      'You discover a cache left by previous travelers.',
      'Your supplies hold up better than expected.',
      'Some of your provisions spoil in the heat.',
      'You realize you\'ve been consuming more water than planned.'
    ];
    return events[Math.floor(Math.random() * events.length)];
  }

  private randomSeverity(): TimeEvent['severity'] {
    const rand = Math.random();
    if (rand < 0.7) return 'minor';
    if (rand < 0.95) return 'moderate';
    return 'significant';
  }

  /**
   * Calculate resource changes based on time and activity
   */
  private calculateResourceChanges(
    request: TimeAdvancementRequest,
    hours: number,
    playerCharacter: PlayerCharacter
  ): TimeAdvancementResult['resourceChanges'] {
    const changes: TimeAdvancementResult['resourceChanges'] = {};

    // Resting improves health and reduces fatigue
    if (request.activity === 'resting' || request.activity === 'camping') {
      const sleepHours = Math.min(hours, 8);
      changes.health = Math.floor(sleepHours * 2); // Heal 2 HP per hour of sleep, max 8 hours
      changes.fatigue = -Math.floor(sleepHours * 3); // Reduce fatigue
    } else {
      // Other activities increase fatigue
      changes.fatigue = Math.floor(hours * 0.5);
    }

    // Hunger and thirst increase over time
    changes.hunger = Math.floor(hours * 2);
    changes.thirst = Math.floor(hours * 3);

    return changes;
  }

  /**
   * Generate natural language summary using LLM
   */
  private async generateSummary(
    request: TimeAdvancementRequest,
    hours: number,
    days: number,
    events: TimeEvent[],
    playerCharacter: PlayerCharacter
  ): Promise<string> {
    // Build event descriptions for LLM
    const eventDescriptions = events.map(e => {
      const when = days > 0
        ? `On day ${e.day + 1}${e.hour ? ` at hour ${e.hour}` : ''}`
        : `After ${e.hour || 1} hour(s)`;
      return `${when}: ${e.description}`;
    }).join('\n');

    const durationDesc = days > 0
      ? `${days} day${days > 1 ? 's' : ''}`
      : `${hours} hour${hours > 1 ? 's' : ''}`;

    const prompt = `You are the narrator of a historical simulation game. The player has advanced time by ${durationDesc} while ${request.activity || 'waiting'}.

Events that occurred:
${eventDescriptions || 'No significant events occurred.'}

Write a brief, atmospheric 2-3 sentence summary of this time period from the narrator's perspective. Focus on the most interesting or significant events. Keep it concise and evocative. Use past tense.`;

    try {
      const summary = await minigameLLMService.quickResponse(prompt, {
        temperature: 0.8,
        maxTokens: 150
      });
      return summary.trim();
    } catch (error) {
      console.error('[TimeAdvancement] LLM summary failed:', error);
      // Fallback summary
      if (events.length === 0) {
        return `${durationDesc} passed quietly as you ${request.activity || 'waited'}.`;
      }
      const significantEvent = events.find(e => e.severity === 'significant') || events[0];
      return `Over the course of ${durationDesc}, ${significantEvent.description}`;
    }
  }
}

export const timeAdvancementService = new TimeAdvancementService();
