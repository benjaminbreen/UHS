/**
 * useEventSystem Hook
 * Manages event system state and integrates with game state
 */

import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services/eventService';
import { 
  EventInstance, 
  EventContext, 
  GameMode,
  EventEffect,
  EventSettings,
  VictoryCondition
} from '../types/eventTypes';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { questService } from '../services/questService';
import { useGame } from '../contexts/GameContext';
import { getSeasonFromDate } from '../utils/dateUtils';

export function useEventSystem() {
  const [currentEvent, setCurrentEvent] = useState<EventInstance | null>(null);
  const [eventHistory, setEventHistory] = useState(eventService.getEventHistory());
  const [currentMode, setCurrentMode] = useState<GameMode | null>(eventService.getGameMode());
  const [victoryProgress, setVictoryProgress] = useState<VictoryCondition[]>([]);
  const [settings, setSettings] = useState<EventSettings>(eventService.getSettings());
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const [hasShownInitialEvent, setHasShownInitialEvent] = useState(eventService.hasShownInitialEvent());
  const [diseaseEventsAdded, setDiseaseEventsAdded] = useState(false);
  
  // Sync currentMode with eventService periodically in case of updates
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const serviceMode = eventService.getGameMode();
      if (serviceMode && serviceMode !== currentMode) {
        console.log('[EventSystem] Syncing mode from service:', serviceMode.name);
        setCurrentMode(serviceMode);
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(syncInterval);
  }, [currentMode]);
  
  const { playerCharacter, updatePlayerCharacter } = usePlayer();
  const { currentTile, worldData } = useMap();
  const { gameDate, currentZone } = useGame();
  
  // Initialize disease events once
  useEffect(() => {
    if (!diseaseEventsAdded) {
      eventService.addDiseaseEvents();
      setDiseaseEventsAdded(true);
      console.log('[EventSystem] Disease events added to event system');
    }
  }, [diseaseEventsAdded]);

  /**
   * Check for initial event on game start
   */
  useEffect(() => {
    if (!playerCharacter || !currentTile || !worldData || !currentMode) return;
    if (hasShownInitialEvent) return;
    if (currentEvent) return; // Already showing an event
    
    // Create context from current game state
    const context: EventContext = {
      era: playerCharacter.historicalEra || 'medieval',
      culturalZone: currentZone || 'european',
      biome: currentTile.biome,
      season: getSeasonFromDate(gameDate),
      nearCity: currentTile.structureType !== null,
      playerWealth: getWealthLevel(playerCharacter.inventory),
      playerProfession: playerCharacter.occupation
    };
    
    // Check if this is a WorldWeaver scenario (has custom events)
    const isWorldWeaver = eventService.getCustomEventArchetypes().length > 0;
    
    // Get map structures for quest generation
    const mapStructures = worldData?.terrainStructures || [];
    const currentLocation = {
      x: playerCharacter.x || 0,
      y: playerCharacter.y || 0
    };
    
    // Generate initial event with quest creation
    const initialEvent = eventService.generateInitialEvent(
      context, 
      isWorldWeaver,
      mapStructures,
      currentLocation
    );
    
    if (initialEvent) {
      console.log('[EventSystem] Showing initial event:', initialEvent);
      setCurrentEvent(initialEvent);
      setHasShownInitialEvent(true);
    }
    
    // ALWAYS generate initial procedural quests (1-2 quests) for ANY game mode
    // This happens for ALL games, not just World Weaver scenarios
    if (currentMode && mapStructures && mapStructures.length > 0) {
      const initialQuests = questService.generateInitialQuests(
        currentMode.name,
        mapStructures,
        currentLocation,
        context.culturalZone,
        context.era,
        worldData // Pass full worldData to access animals
      );
      console.log('[EventSystem] Generated initial quests for', currentMode.name, ':', initialQuests.length, 'quests');
      
      // Log quest details for debugging
      initialQuests.forEach((quest, index) => {
        console.log(`[Quest ${index + 1}]`, quest.title, '-', quest.description);
        if (quest.objectives && quest.objectives[0]) {
          const obj = quest.objectives[0];
          if (obj.targetLocation) {
            console.log(`  Target: ${obj.targetType} at (${obj.targetLocation.x}, ${obj.targetLocation.y})`);
          }
        }
      });
    }
  }, [playerCharacter, currentTile, worldData, currentMode, hasShownInitialEvent, currentEvent, currentZone, gameDate]);

  /**
   * Check quest progress when player moves
   */
  useEffect(() => {
    if (!playerCharacter || playerCharacter.x === undefined || playerCharacter.y === undefined) return;
    
    // Check quest progress at current location
    questService.checkQuestProgress(playerCharacter.x, playerCharacter.y);
  }, [playerCharacter?.x, playerCharacter?.y]);

  /**
   * Check for event triggers periodically
   */
  useEffect(() => {
    if (!playerCharacter || !currentTile || !worldData) return;
    
    // Don't check if there's already an event pending
    if (currentEvent) return;
    
    // Don't start checking until initial event has been shown
    if (!hasShownInitialEvent) return;

    const checkInterval = setInterval(() => {
      // Create context from current game state
      const context: EventContext = {
        era: playerCharacter.historicalEra || 'medieval',
        culturalZone: currentZone || 'european',
        biome: currentTile.biome,
        season: getSeasonFromDate(gameDate),
        nearCity: currentTile.structureType !== null,
        playerWealth: getWealthLevel(playerCharacter.inventory),
        playerProfession: playerCharacter.occupation
      };

      // Check for triggered events
      const triggeredEvent = eventService.checkTriggers(
        playerCharacter,
        currentTile,
        Date.now(),
        context
      );

      if (triggeredEvent) {
        setCurrentEvent(triggeredEvent);
        
        // Auto-pause if enabled
        if (settings.autoPauseOnEvent) {
          // TODO: Implement pause functionality when game loop is added
          console.log('[EventSystem] Auto-pause triggered');
        }
      }

      setLastCheckTime(Date.now());
    }, 10000); // Check every 10 seconds for better performance

    return () => clearInterval(checkInterval);
  }, [playerCharacter, currentTile, worldData, settings.autoPauseOnEvent, currentZone, gameDate, currentEvent, hasShownInitialEvent]);

  /**
   * Handle player choice for an event
   */
  const handleEventChoice = useCallback((choiceIndex: number) => {
    if (!currentEvent || !playerCharacter) return;

    // Get effects from the choice
    const effects = eventService.resolveOutcome(currentEvent, choiceIndex);

    // Apply effects to player character
    applyEffectsToPlayer(effects);

    // Update history
    setEventHistory(eventService.getEventHistory());

    // Clear current event
    setCurrentEvent(null);

    // Check victory conditions
    updateVictoryProgress();
  }, [currentEvent, playerCharacter]);

  /**
   * Apply event effects to player character
   */
  const applyEffectsToPlayer = (effects: EventEffect[]) => {
    if (!playerCharacter) return;

    const updates: any = {};

    effects.forEach(effect => {
      switch (effect.type) {
        case 'health':
          updates.health = Math.max(0, Math.min(100, 
            (playerCharacter.health || 50) + (effect.value as number)
          ));
          break;
          
        case 'fatigue':
          updates.fatigue = Math.max(0, Math.min(100,
            (playerCharacter.fatigue || 50) + (effect.value as number)
          ));
          break;
          
        case 'stat_change':
          const stat = effect.target as keyof typeof playerCharacter;
          if (typeof playerCharacter[stat] === 'number') {
            updates[stat] = Math.max(0, Math.min(20,
              (playerCharacter[stat] as number) + (effect.value as number)
            ));
          }
          break;
          
        case 'item_add':
          // Add item to inventory
          const newInventory = [...(playerCharacter.inventory || [])];
          newInventory.push({
            id: `item_${Date.now()}`,
            name: effect.target,
            type: 'generic',
            quantity: 1
          });
          updates.inventory = newInventory;
          break;
          
        case 'item_remove':
          // Remove item from inventory
          const filteredInventory = (playerCharacter.inventory || [])
            .filter(item => item.name !== effect.target);
          updates.inventory = filteredInventory;
          break;
          
        case 'reputation':
          updates.mapReputation = Math.max(-100, Math.min(100,
            (playerCharacter.mapReputation || 0) + (effect.value as number)
          ));
          break;
          
        // Location and quest effects would be handled by other systems
        case 'location':
        case 'quest':
          console.log(`[EventSystem] Effect ${effect.type} needs integration:`, effect);
          break;
      }
    });

    // Apply all updates at once
    if (Object.keys(updates).length > 0) {
      updatePlayerCharacter(updates);
    }
  };

  /**
   * Determine player's wealth level from inventory
   */
  const getWealthLevel = (inventory: any[]): 'poor' | 'modest' | 'wealthy' => {
    if (!inventory || inventory.length === 0) return 'poor';
    
    // Simple heuristic based on inventory size and valuable items
    const valuableItems = inventory.filter(item => 
      item.name?.toLowerCase().includes('gold') ||
      item.name?.toLowerCase().includes('silver') ||
      item.name?.toLowerCase().includes('jewel') ||
      item.type === 'valuable'
    );
    
    if (valuableItems.length > 5 || inventory.length > 20) return 'wealthy';
    if (valuableItems.length > 0 || inventory.length > 10) return 'modest';
    return 'poor';
  };

  /**
   * Update victory progress for current mode
   */
  const updateVictoryProgress = useCallback(() => {
    if (!currentMode) return;
    
    const progress = eventService.getVictoryProgress();
    setVictoryProgress(progress);
    
    // Check if any victory conditions are met
    const victoryAchieved = progress.some(condition => {
      if (condition.type === 'survival_days' && condition.target) {
        // Check days survived (would need to track this)
        return false; // TODO: Implement day tracking
      }
      if (condition.type === 'accumulate_wealth' && condition.target) {
        // Check wealth accumulated
        const wealth = playerCharacter?.inventory?.length || 0;
        return wealth >= condition.target;
      }
      // Add more victory condition checks...
      return false;
    });

    if (victoryAchieved) {
      console.log('[EventSystem] Victory achieved!');
      // TODO: Show victory modal
    }
  }, [currentMode, playerCharacter]);

  /**
   * Set game mode
   */
  const setGameMode = useCallback((mode: GameMode) => {
    eventService.setGameMode(mode);
    setCurrentMode(mode);
    setVictoryProgress(mode.victoryConditions);
  }, []);

  /**
   * Update event settings
   */
  const updateSettings = useCallback((newSettings: Partial<EventSettings>) => {
    eventService.updateSettings(newSettings);
    setSettings(eventService.getSettings());
  }, []);

  /**
   * Clear event history
   */
  const clearHistory = useCallback(() => {
    eventService.clearHistory();
    setEventHistory([]);
  }, []);

  /**
   * Dismiss current event without choosing
   */
  const dismissEvent = useCallback(() => {
    setCurrentEvent(null);
  }, []);
  
  /**
   * Reset for new game
   */
  const resetForNewGame = useCallback(() => {
    eventService.resetInitialEventFlag();
    eventService.clearCustomEvents();
    eventService.clearGameMode(); // Clear game mode for new games
    setHasShownInitialEvent(false);
    setCurrentEvent(null);
    setEventHistory([]);
    setCurrentMode(null); // Clear mode in hook state too
  }, []);

  return {
    // State
    currentEvent,
    eventHistory,
    currentMode,
    victoryProgress,
    settings,
    hasShownInitialEvent,
    
    // Actions
    handleEventChoice,
    dismissEvent,
    setGameMode,
    updateSettings,
    clearHistory,
    resetForNewGame,
    
    // Info
    lastCheckTime
  };
}

/**
 * Helper to get season from game date
 */
function getSeasonFromDate(gameDate: any): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = gameDate?.month || 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}