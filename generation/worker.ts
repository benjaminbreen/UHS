/**
 * generation/worker.ts - Web Worker for heavy procedural generation
 * Runs map generation in a separate thread to avoid blocking the UI
 */

import { proceduralGenerateMap } from './standardMap/standardMapGenerator';
import { MapArchetype, ClimateType, AltitudeSetting, MapGenerationParams, NeighboringEdges } from '../types';

// Message types for worker communication
interface GenerateMapMessage {
  type: 'generate';
  params: {
    seed: number;
    archetype: MapArchetype;
    climate: ClimateType;
    generateHarborFlag: boolean;
    generateLargeCityFlag: boolean;
    altitudeSetting: AltitudeSetting;
    forceVolcanic: boolean;
    continent?: string;
    region?: string;
    localArea?: string;
    timeSlice?: string;
    generationParams?: MapGenerationParams;
    neighboringEdges?: NeighboringEdges;
  };
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<GenerateMapMessage>) => {
  if (event.data.type === 'generate') {
    try {
      console.log('[Worker] Starting map generation...');
      const startTime = performance.now();
      
      const { params } = event.data;
      const mapData = proceduralGenerateMap(
        params.seed,
        params.archetype,
        params.climate,
        params.generateHarborFlag,
        params.generateLargeCityFlag,
        params.altitudeSetting,
        params.forceVolcanic,
        params.continent,
        params.region,
        params.localArea,
        params.timeSlice,
        params.generationParams,
        params.neighboringEdges
      );
      
      const endTime = performance.now();
      console.log(`[Worker] Map generation completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      // Send the generated map back to the main thread
      self.postMessage({
        type: 'success',
        mapData
      });
    } catch (error) {
      console.error('[Worker] Map generation failed:', error);
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

export {};