/**
 * hooks/useMapWorker.ts - Hook for managing Web Worker-based map generation
 */
import { useCallback, useRef, useEffect } from 'react';
import { MapData, MapArchetype, ClimateType, AltitudeSetting, MapGenerationParams, NeighboringEdges } from '../types';

interface WorkerGenerateParams {
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
}

interface WorkerResponse {
  type: 'success' | 'error';
  mapData?: MapData;
  error?: string;
}

export const useMapWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbackRef = useRef<((data: MapData | null, error?: string) => void) | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        // Use Vite's special syntax for importing a Web Worker
        workerRef.current = new Worker(
          new URL('../generation/worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message handler
        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const { type, mapData, error } = event.data;
          
          if (pendingCallbackRef.current) {
            if (type === 'success' && mapData) {
              pendingCallbackRef.current(mapData);
            } else {
              pendingCallbackRef.current(null, error || 'Unknown error');
            }
            pendingCallbackRef.current = null;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('[MapWorker] Worker error:', error);
          if (pendingCallbackRef.current) {
            pendingCallbackRef.current(null, 'Worker error');
            pendingCallbackRef.current = null;
          }
        };
      } catch (error) {
        console.error('[MapWorker] Failed to create worker:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const generateMapAsync = useCallback((
    params: WorkerGenerateParams,
    callback: (mapData: MapData | null, error?: string) => void
  ) => {
    if (!workerRef.current) {
      console.warn('[MapWorker] Web Worker not available, falling back to synchronous generation');
      // Fallback to importing and running synchronously if worker isn't available
      import('../generation/standardMap/standardMapGenerator').then(({ proceduralGenerateMap }) => {
        try {
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
          callback(mapData);
        } catch (error) {
          callback(null, error instanceof Error ? error.message : 'Unknown error');
        }
      });
      return;
    }

    // Store the callback
    pendingCallbackRef.current = callback;

    // Send message to worker
    workerRef.current.postMessage({
      type: 'generate',
      params
    });
  }, []);

  return { generateMapAsync };
};