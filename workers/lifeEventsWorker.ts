/**
 * workers/lifeEventsWorker.ts
 *
 * Web Worker for generating life events in background thread
 * to prevent blocking main UI during character history generation
 */

import {
  generateLifeHistory,
  type EnhancedLifeEvent
} from '../services/lifeHistoryService';
import type { PlayerCharacter, CulturalZone, HistoricalEra } from '../types';
import type { TamedAnimal } from '../services/animalTamingService';

export interface LifeEventsRequest {
  character: PlayerCharacter;
  currentYear: number;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  companions: TamedAnimal[];
}

export interface LifeEventsResponse {
  events: EnhancedLifeEvent[];
  generationTime: number;
}

// Worker message handler
self.onmessage = (event: MessageEvent<LifeEventsRequest>) => {
  console.log('[LifeEventsWorker] Starting life events generation...');
  const startTime = performance.now();
  const { character, currentYear, culturalZone, era, companions } = event.data;

  try {
    console.log('[LifeEventsWorker] Calling generateLifeHistory...');
    // Generate life history events
    const events = generateLifeHistory(
      character,
      currentYear,
      culturalZone,
      era
    );
    console.log(`[LifeEventsWorker] Generated ${events.length} events`);

    // Add companion acquisitions
    if (companions?.length > 0) {
      companions.forEach(animal => {
        if (animal.tamingDate && animal.tamingDate.year) {
          events.push({
            year: animal.tamingDate.year,
            kind: 'animal' as any,
            importance: 'relationship' as any,
            title: `Tamed ${animal.speciesName}`,
            text: `Formed bond with a ${animal.speciesName.toLowerCase()}, gaining a loyal companion.`,
          });
        }
      });
    }

    // Sort chronologically and filter future events
    const sortedEvents = events
      .filter((e) => e.year && e.year <= currentYear)
      .sort((a, b) => a.year - b.year);

    const generationTime = performance.now() - startTime;

    // Send results back to main thread
    const response: LifeEventsResponse = {
      events: sortedEvents,
      generationTime
    };

    console.log(`[LifeEventsWorker] Posting ${sortedEvents.length} events back to main thread (took ${generationTime.toFixed(2)}ms)`);
    self.postMessage(response);
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      error: error instanceof Error ? error.message : 'Unknown error generating life events'
    });
  }
};
