/**
 * Hook for managing factory system integration during gameplay
 * Handles worker behaviors, production cycles, and factory events
 */

import { useEffect, useCallback, useRef } from 'react';
import { NpcEntity, TerrainStructure, MapData } from '../types';
import { factoryEconomyService } from '../services/factoryEconomyService';
import { factoryNpcBehaviorService, WorkerBehavior } from '../services/factoryNpcBehaviors';
import { getFactoryType } from '../constants/gameData/factoryTypes';

interface UseFactorySystemProps {
  mapData: MapData | null;
  npcs: NpcEntity[];
  currentHour: number;
  currentMinute: number;
  onNpcUpdate?: (npcId: string, updates: Partial<NpcEntity>) => void;
  onFactoryEvent?: (event: string) => void;
}

export function useFactorySystem({
  mapData,
  npcs,
  currentHour,
  currentMinute,
  onNpcUpdate,
  onFactoryEvent
}: UseFactorySystemProps) {
  const lastUpdateHour = useRef<number>(-1);
  
  /**
   * Update factory workers' behaviors based on time
   */
  const updateFactoryWorkers = useCallback(() => {
    if (!mapData?.terrainStructures) return;
    
    const factories = mapData.terrainStructures.filter(s => s.structureType === 'factory');
    
    factories.forEach(factory => {
      // Get factory type
      const factoryType = factory.factorySubtype ? 
        getFactoryType(mapData.era, mapData.culturalZone, mapData.region) : null;
      
      if (!factoryType) return;
      
      // Find workers assigned to this factory
      const workers = npcs.filter(npc => npc.workplaceId === factory.id);
      
      workers.forEach(worker => {
        // Update worker behavior
        const behavior = factoryNpcBehaviorService.updateWorkerBehavior(
          worker,
          factory,
          factoryType,
          currentHour,
          currentMinute
        );
        
        // Apply behavior updates to NPC
        if (onNpcUpdate) {
          onNpcUpdate(worker.id, {
            fatigue: behavior.fatigue,
            morale: behavior.morale,
            currentActivity: behavior.currentActivity,
            targetX: behavior.destination?.x,
            targetY: behavior.destination?.y,
            activity: mapActivityToNpcActivity(behavior.currentActivity)
          });
        }
        
        // Generate worker dialogue if idle
        if (behavior.currentActivity === 'break' || behavior.currentActivity === 'leisure') {
          const dialogue = factoryNpcBehaviorService.generateWorkerDialogue(
            worker,
            behavior,
            factoryType,
            mapData.year || 1850
          );
          
          if (dialogue && onNpcUpdate) {
            onNpcUpdate(worker.id, {
              confrontationDialogue: [dialogue]
            });
          }
        }
      });
    });
  }, [mapData, npcs, currentHour, currentMinute, onNpcUpdate]);
  
  /**
   * Simulate factory production on the hour
   */
  const simulateProduction = useCallback(() => {
    if (!mapData?.terrainStructures) return;
    
    const factories = mapData.terrainStructures.filter(s => s.structureType === 'factory');
    
    factories.forEach(factory => {
      // Run production simulation
      factoryEconomyService.simulateProduction(factory, currentHour, mapData);
      
      // Check for factory events
      const event = factoryEconomyService.generateFactoryEvent(factory, mapData);
      if (event && onFactoryEvent) {
        onFactoryEvent(event);
      }
    });
  }, [mapData, currentHour, onFactoryEvent]);
  
  /**
   * Handle special factory worker events
   */
  const handleWorkerEvents = useCallback(() => {
    if (!mapData?.terrainStructures) return;
    
    const factories = mapData.terrainStructures.filter(s => s.structureType === 'factory');
    
    factories.forEach(factory => {
      const factoryType = factory.factorySubtype ? 
        getFactoryType(mapData.era, mapData.culturalZone, mapData.region) : null;
      
      if (!factoryType) return;
      
      const workers = npcs.filter(npc => npc.workplaceId === factory.id);
      
      workers.forEach(worker => {
        // Random injury chance based on danger level
        if (Math.random() < factoryType.workingConditions.dangerLevel / 100) {
          factoryNpcBehaviorService.handleWorkerEvent(
            worker,
            factory,
            factoryType,
            'injury'
          );
          
          if (onFactoryEvent) {
            onFactoryEvent(`${worker.name} was injured at ${factory.name}!`);
          }
        }
        
        // Check for strikes if morale is low
        if (worker.morale && worker.morale < 0.2 && Math.random() < 0.01) {
          factoryNpcBehaviorService.handleWorkerEvent(
            worker,
            factory,
            factoryType,
            'strike_join'
          );
          
          if (onFactoryEvent) {
            onFactoryEvent(`Workers at ${factory.name} are threatening to strike!`);
          }
        }
      });
    });
  }, [mapData, npcs, onFactoryEvent]);
  
  // Update workers every minute
  useEffect(() => {
    updateFactoryWorkers();
  }, [currentMinute, updateFactoryWorkers]);
  
  // Run production and events every hour
  useEffect(() => {
    if (currentHour !== lastUpdateHour.current) {
      lastUpdateHour.current = currentHour;
      simulateProduction();
      handleWorkerEvents();
    }
  }, [currentHour, simulateProduction, handleWorkerEvents]);
  
  return {
    updateFactoryWorkers,
    simulateProduction,
    handleWorkerEvents
  };
}

/**
 * Map worker behavior activity to NPC activity type
 */
function mapActivityToNpcActivity(activity: WorkerBehavior['currentActivity']): string {
  switch (activity) {
    case 'working':
      return 'working';
    case 'commuting':
      return 'commuting_to_work';
    case 'returning':
      return 'commuting_home';
    case 'sleeping':
    case 'leisure':
    case 'break':
      return 'idle';
    case 'strike':
      return 'patrolling';
    default:
      return 'wandering';
  }
}