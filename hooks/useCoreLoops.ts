/**
 * hooks/useCoreLoops.ts - Encapsulates the main game loops for time and AI.
 */
import { useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useUI } from '../contexts/UIContext';
import { getDaysInMonth, parseDateString, formatDateWithSeason, getSeasonFromDate } from '../utils/dateUtils';
import { getNextMapArea } from '../utils/geographyUtils';
import { calculateAnimalUpdate } from '../services/animalAIService';
import { safeCalculateNpcUpdate, shouldRemoveNpc } from '../services/safeNpcService';
import { crossMapNpcService } from '../services/crossMapNpcService';
import { spawnSingleAnimal } from '../generation/standardMap/features/animalGenerator';
import { 
  checkReputationBasedApproach, 
  generateLowReputationDialogue,
  checkNPCApproaches,
  generateApproachDialogue,
  estimatePlayerWealth,
  ApproachContext
} from '../services/npcInitiatedEncounterService';
import { generateNPCApproachNarration } from '../services/llmService';
import { fireService } from '../services/fireService';
import { weatherService } from '../services/weatherService';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ANIMAL_DATA, ITEM_DEFINITIONS } from '../constants/index';
import { BiomeType, Item, PlayerContext, TerrainStructureType, TerrainStructure } from '../types';
import { mapLocationToCulture } from '../utils/mapUtils';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { LogService } from '../services/logService';
import DiseaseService from '../services/diseaseService';
import { isTerrainPassable, getTerrainBlockMessage, getTerrainDamage } from '../constants/terrainPassability';
import gameSounds from '../services/gameSoundsService';
import { getFootstepMaterial } from '../services/biomeFootstepService';
import { calculateDiseaseGameplayRestrictions, shouldPlayerDieFromDisease, checkDiseaseStageChanges } from '../services/diseaseProgressionService';
import { DiseaseProgressionEvent } from '../services/diseaseNotificationService';
import { Disease } from '../types/diseaseTypes';
import { NpcEntity } from '../types/npcTypes';
import { getActiveWorkOffers, updateWorkOffer, cleanupOrphanedWorkOffers } from '../services/workOfferStorage';
import { cleanupOldWitnessedEvents } from '../services/npcWitnessService';
import { checkWorkCompletion, completeWorkOffer } from '../services/workOfferService';
import { checkForEvent, getGlobalEventsLLMContext, cleanupExpiredEvents } from '../services/globalEventService';
import { eventBus } from '../services/eventBus';
import { describeMovement, describeEmbark, describeDisembark } from '../services/historyLensNarrationService';
import { findHistoryLensPath, findReachableCoastalTile, isDestinationOnLand } from '../services/historyLensPathfinding';

interface DeathInfo {
  type: 'disease' | 'starvation' | 'violence' | 'accident' | 'old_age' | 'combat' | 'terrain' | 'drowning' | 'exhaustion' | 'poison';
  disease?: any;
  description?: string;
  terrain?: string;
}

const useCoreLoops = (
  onDeath?: (deathInfo: DeathInfo) => void,
  onNpcDeath?: (npc: NpcEntity, disease: Disease) => void,
  onDiseaseProgression?: (events: DiseaseProgressionEvent[]) => void,
  onStatusWarning?: (type: 'health' | 'fatigue', severity: 'warning' | 'danger' | 'critical', currentValue: number, maxValue: number) => void,
  isPlayerOnFarm?: boolean,
  onGlobalEventTriggered?: (event: any) => void,
  onDismissStatusWarning?: () => void,
  onEntityItemPickup?: (entityName: string, item: Item, entityType: 'npc' | 'animal') => void
) => {
  const {
    setGameTimeMinutes,
    gameTimeMinutes,
    setGameTimeHours,
    setGameDate,
    gameTimeHours,
    gameDate,
    currentTimeOfDay,
    moveCount,
    setMoveCount,
    currentZone,
    contextualMessage,
    setContextualMessage,
    actionableTile,
    setActionableTile,
    addGameLogEntry,
    formattedTime,
    setNarrationHistory,
    narrationHistory,
    liminalTravelState,
  } = useGame();

  const {
    playerCharacter,
    controlledIconX,
    controlledIconY,
    isIconMoving,
    activeKeys,
    playerMode,
    shipDockX,
    shipDockY,
    pendingIconTransitionInfo,
    setPlayerMode,
    setShipDockX,
    setShipDockY,
    setControlledIconX,
    setControlledIconY,
    setIconRotation,
    setVelocity,
    setPlayerCharacter,
    setCurrentVessel,
    onPlayerMove,
    viewMode,
    interiorViewState,
    interiorMapPlayerPos,
    handleExitInteriorView,
  } = usePlayer();

  const {
    mapData,
    animals,
    setAnimals,
    animalSpawnNoise,
    npcs,
    setNpcs,
    localArea,
    visibleAnimals,
    currentMapArchetype,
    currentMapClimate,
    currentMapSeed,
    handleMapTransition,
    updateStructureData,
    removeDroppedItem,
    isSpecialMap,
    isEnteringSpecialMap,
    exitSpecialMap,
    deployedVessels,
    setDeployedVessels,
  } = useMap();

  const {
    isAnyModalOpen,
    combatant,
    handleEncounter,
    handleInitiateCombat,
    showToast,
    closeAllModals,
    togglePinnedTooltip,
    setPanelNotificationItem,
    setPanelNotificationMode,
    setRareItemFoundToast,
    setActiveMiningModal,
    setStructureModalTarget,
    setActiveGovernmentModal,
    inRuinRoguelike,
    inMiningRoguelike,
    centralMode,
  } = useUI();

  const moveLoopId = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const moveIntervalMs = 250; // Consistent movement speed - slightly slower but smoother
  const lastDiseaseCheckMove = useRef<number>(0);
  const nextMoveAllowed = useRef<number>(0); // Track when next move is allowed
  const npcNarrationHistory = useRef<Set<string>>(new Set()); // Track NPCs who have had narration generated
  const lastNarrationTime = useRef<number>(0); // Track last narration generation time

  // Health/Fatigue warning tracking to prevent duplicate warnings
  const healthWarningShown = useRef<40 | 20 | 5 | null>(null);
  const fatigueWarningShown = useRef<60 | 80 | 95 | null>(null);

  // Repeat control for movement (time-based; replaces setTimeout gating)
  const repeatRef = useRef({ holdStart: 0, nextStepAt: 0, isRepeating: false });
  const INITIAL_REPEAT_DELAY_MS = 200; // delay after the very first step of a hold
  const CONTINUOUS_REPEAT_MS = 400; // cadence while key is held
  const queuedMovesRef = useRef<Array<{ dx: number; dy: number }>>([]);
  const historyLensMoveActiveRef = useRef(false);
  const historyLensMoveEndNotifiedRef = useRef(false);
  const historyLensNavTargetRef = useRef<{ x: number; y: number; label: string; kind: string } | null>(null);
  const historyLensNavDetourNotifiedRef = useRef(false);
  const historyLensPathRef = useRef<Array<{ x: number; y: number }>>([]);
  // Store post-disembark navigation target for ship-to-land navigation
  const postDisembarkTargetRef = useRef<{ x: number; y: number; label: string; kind: string } | null>(null);
  // Store interrupted journey target so we can offer to resume after encounters
  const interruptedJourneyRef = useRef<{ destination: { x: number; y: number; label: string; kind: string }; interruptedBy: 'npc' | 'animal'; entityName?: string } | null>(null);

  // Game Clock - Reduced frequency for better performance
  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (isAnyModalOpen) return;
      setGameTimeMinutes((prevMinutes) => {
        const newMinutes = (prevMinutes + 1) % 60;
        
        // Fire spread check every 10 game minutes
        if (newMinutes % 10 === 0 && mapData && controlledIconX !== null && controlledIconY !== null) {
          // Get weather conditions for fire spread
          const centerX = Math.floor(mapData.tiles[0].length / 2);
          const centerY = Math.floor(mapData.tiles.length / 2);
          const centerTile = mapData.tiles[centerY]?.[centerX];
          
          let isRaining = false;
          let windDirection = 0;
          
          if (centerTile) {
            const weather = weatherService.getWeather(
              mapData.climate,
              centerTile.biome,
              gameDate.season,
              currentTimeOfDay,
              centerTile.altitude || 0.5,
              gameDate.dayOfYear,
              { x: centerX, y: centerY }
            );
            
            isRaining = weather.precipitation === 'rain' || weather.precipitation === 'drizzle';
            windDirection = weather.windDirection;
          }
          
          // Process fire spread
          const gameTimeInMinutes = ((gameDate.dayOfYear - 1) * 24 * 60) + (gameTimeHours * 60) + newMinutes;
          const spreadEvents = fireService.processFireSpread(
            mapData,
            gameTimeInMinutes,
            windDirection,
            isRaining
          );
          
          // Show toast notifications for fire spread
          const timeouts: NodeJS.Timeout[] = [];
          spreadEvents.forEach((event, index) => {
            const timeout = setTimeout(() => {
              showToast(
                `🔥 Fire spreading at [${event.toX}, ${event.toY}]. ${event.biomeName} is now aflame!`,
                'warning'
              );
            }, index * 500); // Stagger toasts by 0.5s
            timeouts.push(timeout);
          });
          
          // Store timeouts for cleanup if needed
          // Note: These are short-lived (max 2-3 seconds) so cleanup in main interval is sufficient
        }
        
        if (newMinutes === 0) {
          setGameTimeHours((prevHours) => {
            const newHours = (prevHours + 1) % 24;

            // Check work offer completion EVERY HOUR (not just at midnight)
            const currentGameHours = (gameDate.year * 365 * 24) + (gameDate.month * 30 * 24) + (gameDate.day * 24) + newHours;
            const activeOffers = getActiveWorkOffers();

            activeOffers.forEach(offer => {
              // Find the NPC who gave the quest for conversation tracking
              const questGiverNpc = npcs.find(npc => npc.id === offer.npcId);

              const status = checkWorkCompletion(
                offer,
                playerCharacter,
                { x: controlledIconX, y: controlledIconY },
                currentGameHours,
                questGiverNpc // Pass the NPC for conversation tracking
              );

              if (status === 'completed' && !offer.completed) {
                // Mark as completed (use spread operator to avoid mutation)
                const updatedOffer = {
                  ...offer,
                  completed: true
                };

                // Remove items immediately to prevent consumption
                completeWorkOffer(
                  updatedOffer,
                  playerCharacter,
                  (newInventory) => {
                    setPlayerCharacter(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        inventory: newInventory
                      };
                    });
                    // Dispatch inventory update event for progress tracking
                    window.dispatchEvent(new CustomEvent('inventoryUpdated'));
                  }
                );

                updateWorkOffer(updatedOffer);
                showToast(`Task complete! Return to ${offer.npcName} at (${offer.npcLocation.x}, ${offer.npcLocation.y}) for payment.`);

                // Dispatch event for quest panel refresh
                window.dispatchEvent(new CustomEvent('workOfferCompleted', { detail: { offerId: offer.id } }));
              } else if (status === 'failed' && !offer.failed) {
                // Mark as failed (use spread operator to avoid mutation)
                const updatedOffer = {
                  ...offer,
                  failed: true
                };
                updateWorkOffer(updatedOffer);
                showToast(`Task failed: ${offer.description}`);

                // Dispatch event for quest panel refresh
                window.dispatchEvent(new CustomEvent('workOfferFailed', { detail: { offerId: offer.id } }));
              }
            });

            if (newHours === 0) {
              setGameDate((prevDate) => {
                let { day, month, year } = prevDate;
                day++;
                if (day > getDaysInMonth(year, month)) {
                  day = 1;
                  month++;
                  if (month > 12) {
                    month = 1;
                    year++;
                  }
                }

                // Cleanup orphaned work offers once per day (NPCs that no longer exist)
                // Pass current map seed to avoid false positives when player travels between maps
                const orphanedCount = cleanupOrphanedWorkOffers(npcs, currentMapSeed);
                if (orphanedCount > 0) {
                  showToast(`${orphanedCount} work offer${orphanedCount > 1 ? 's' : ''} failed due to NPC disappearance.`);
                }

                // Cleanup old witnessed events once per day (events older than 24 hours)
                const currentGameTime = Date.now();
                const cleanedNpcs = cleanupOldWitnessedEvents(npcs, currentGameTime, 24);
                if (cleanedNpcs !== npcs) {
                  setNpcs(cleanedNpcs);
                }

                // Disease progression on new day for player character
                if (playerCharacter?.diseaseHealth?.currentDiseases?.length > 0) {
                  const diseaseService = DiseaseService.getInstance();
                  const result = diseaseService.updateDiseaseProgression(playerCharacter, year);

                  result.progressionEvents.forEach((event) => {
                    // console.log(`[DISEASE] ${event}`);
                  });

                  result.recoveryEvents.forEach((event) => {
                    // console.log(`[DISEASE RECOVERY] ${event}`);
                    if (typeof window !== 'undefined' && (window as any).showNotification) {
                      (window as any).showNotification('You have recovered from your illness!', 'success');
                    }
                  });

                  // Check if player died from disease (determined in diseaseService)
                  if (result.isDead && playerCharacter.diseaseHealth.currentDiseases.length > 0) {
                    const mostSevere = playerCharacter.diseaseHealth.currentDiseases.reduce((worst: any, current: any) => {
                      const currentMortality = current.disease.mortalityRate * current.severity;
                      const worstMortality = worst.disease.mortalityRate * worst.severity;
                      return currentMortality > worstMortality ? current : worst;
                    });

                    // console.log(`[DISEASE DEATH] Player has died from ${mostSevere.disease.name}!`);
                    if (onDeath) {
                      onDeath({
                        type: 'disease',
                        disease: mostSevere.disease,
                        description: `Succumbed to ${mostSevere.disease.name}`
                      });
                    } else {
                      // Fallback to alert if no handler provided
                      alert(`Death feature to be implemented.\n\nYour character has succumbed to ${mostSevere.disease.name}.`);
                    }
                  }

                  // Check for disease stage changes and trigger notifications
                  if (onDiseaseProgression) {
                    const progressionEvents = checkDiseaseStageChanges(
                      playerCharacter.name || 'player',
                      playerCharacter.diseaseHealth
                    );
                    if (progressionEvents.length > 0) {
                      onDiseaseProgression(progressionEvents);
                    }
                  }

                  setPlayerCharacter({ ...playerCharacter });
                }

                // Check for global historical events
                if (playerCharacter && mapData && onGlobalEventTriggered) {
                  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const culturalZone = playerCharacter.culturalZone;

                  // Clean up any expired events first
                  cleanupExpiredEvents(dateString);

                  // Check if a new global event should trigger
                  const triggeredEvent = checkForEvent({
                    currentDate: dateString,
                    culturalZone,
                    randomChance: Math.random()
                  });

                  if (triggeredEvent) {
                    // Trigger the modal callback
                    onGlobalEventTriggered(triggeredEvent);
                  }
                }

                // Add day passing log entry
                const newDate = { day, month, year };
                const currentSeason = getSeasonFromDate(newDate);
                addGameLogEntry(LogService.createMapEntryLog(
                  'time',
                  `A new day begins: ${formatDateWithSeason(newDate, currentSeason)}`,
                  newDate,
                  '00:00',
                  'Night' // Midnight
                ));

                return { day, month, year };
              });
            }
            return newHours;
          });
        }
        return newMinutes;
      });
    }, 2000); // Reduced from 1000ms for better performance
    return () => clearInterval(clockInterval);
  }, [isAnyModalOpen]); // Remove playerCharacter to prevent frequent recreations

  // Play Time Tracking - increment every minute
  useEffect(() => {
    // Initialize session start time if not set
    if (playerCharacter && !playerCharacter.sessionStartTime) {
      setPlayerCharacter(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sessionStartTime: Date.now(),
          totalPlayTimeMinutes: prev.totalPlayTimeMinutes || 0
        };
      });
    }

    const playTimeInterval = setInterval(() => {
      if (!playerCharacter) return;

      setPlayerCharacter(prev => {
        if (!prev || !prev.sessionStartTime) return prev;

        // Calculate session duration in minutes
        const sessionDurationMs = Date.now() - prev.sessionStartTime;
        const sessionMinutes = Math.floor(sessionDurationMs / 60000);

        return {
          ...prev,
          totalPlayTimeMinutes: (prev.totalPlayTimeMinutes || 0) + 1
        };
      });
    }, 60000); // Every 60 seconds (1 minute)

    return () => clearInterval(playTimeInterval);
  }, [playerCharacter?.id]); // Only re-run if player character changes

  // Drowning system - check when player is in water
  useEffect(() => {
    const drowningInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter || viewMode !== 'standard') return;
      if (controlledIconX === null || controlledIconY === null || !mapData) return;

      // Check if player is in water and not on a boat
      const currentTile = mapData.tiles[controlledIconY][controlledIconX];
      const isInWater = ['RIVER', 'STREAM', 'LAKE', 'OCEAN', 'SHALLOW_OCEAN', 'DEEP_OCEAN',].includes(currentTile.biome as any);
      const isOnBoat = playerMode === 'ship' || playerCharacter.currentVessel;

      if (isInWater && !isOnBoat) {
        // Player is drowning - apply damage every second
        let drowningDamage = 2; // Base drowning damage per second

        // Increase damage based on water type
        if (currentTile.biome === 'DEEP_OCEAN' || currentTile.biome === 'OCEAN') {
          drowningDamage = 4; // More dangerous in deep water
        }

        // Apply drowning damage
        setPlayerCharacter(prev => {
          if (!prev) return null;
          const newHealth = Math.max(0, prev.health - drowningDamage);

          // Check for death
          if (newHealth <= 0 && onDeath) {
            onDeath({
              type: 'drowning',
              description: `You drowned in the ${currentTile.biome.toLowerCase().replace(/_/g, ' ')}.`
            });
          }

          return { ...prev, health: newHealth };
        });

        // Add drowning message to narration (throttled)
        if (Math.random() < 0.1) { // Only 10% chance per second to avoid spam
          const drowningMessages = [
            "You struggle to stay afloat as the water pulls you under.",
            "Your lungs burn as you fight against the current.",
            "The cold water saps your strength with each passing moment.",
            "You gasp for air as waves wash over your head.",
            "Your body grows numb as hypothermia sets in."
          ];
          const randomMessage = drowningMessages[Math.floor(Math.random() * drowningMessages.length)];

          setNarrationHistory(prev => [...prev, {
            sender: 'narrator',
            text: randomMessage
          }]);
        }
      }
    }, 2000); // Reduced frequency for better performance

    return () => clearInterval(drowningInterval);
  }, [isAnyModalOpen, playerCharacter, viewMode, controlledIconX, controlledIconY, mapData, playerMode, onDeath, setPlayerCharacter, setNarrationHistory]);

  // Health/Fatigue warning system - Check thresholds and trigger warnings
  useEffect(() => {
    if (!playerCharacter || isAnyModalOpen || isPlayerOnFarm) return;

    const healthPercent = (playerCharacter.health / playerCharacter.maxHealth) * 100;
    const fatiguePercent = (playerCharacter.fatigue / 100) * 100; // Assuming max fatigue is 100

    // Health warnings (40%, 20%, 5%)
    if (healthPercent <= 5 && healthWarningShown.current !== 5) {
      healthWarningShown.current = 5;
      if (onStatusWarning) {
        onStatusWarning('health', 'critical', playerCharacter.health, playerCharacter.maxHealth);
      }
    } else if (healthPercent <= 20 && healthWarningShown.current !== 20 && healthWarningShown.current !== 5) {
      healthWarningShown.current = 20;
      if (onStatusWarning) {
        onStatusWarning('health', 'danger', playerCharacter.health, playerCharacter.maxHealth);
      }
    } else if (healthPercent <= 40 && healthWarningShown.current !== 40 && healthWarningShown.current !== 20 && healthWarningShown.current !== 5) {
      healthWarningShown.current = 40;
      if (onStatusWarning) {
        onStatusWarning('health', 'warning', playerCharacter.health, playerCharacter.maxHealth);
      }
      // Add narration panel message for initial warning
      setNarrationHistory(prev => [...prev, {
        sender: 'narrator',
        text: "Your wounds are taking their toll. You should rest when you have a chance."
      }]);
    }

    // Reset health warning when health recovers above all thresholds
    if (healthPercent > 40) {
      if (healthWarningShown.current !== null) {
        // Dismiss the toast when health recovers
        if (onDismissStatusWarning) {
          onDismissStatusWarning();
        }
      }
      healthWarningShown.current = null;
    }

    // Fatigue warnings (60%, 80%, 95%)
    if (fatiguePercent >= 95 && fatigueWarningShown.current !== 95) {
      fatigueWarningShown.current = 95;
      if (onStatusWarning) {
        onStatusWarning('fatigue', 'critical', playerCharacter.fatigue, 100);
      }
    } else if (fatiguePercent >= 80 && fatigueWarningShown.current !== 80 && fatigueWarningShown.current !== 95) {
      fatigueWarningShown.current = 80;
      if (onStatusWarning) {
        onStatusWarning('fatigue', 'danger', playerCharacter.fatigue, 100);
      }
    } else if (fatiguePercent >= 60 && fatigueWarningShown.current !== 60 && fatigueWarningShown.current !== 80 && fatigueWarningShown.current !== 95) {
      fatigueWarningShown.current = 60;
      if (onStatusWarning) {
        onStatusWarning('fatigue', 'warning', playerCharacter.fatigue, 100);
      }
      // Add narration panel message for initial warning
      setNarrationHistory(prev => [...prev, {
        sender: 'narrator',
        text: "Exhaustion is beginning to set in. Consider making camp to rest."
      }]);
    }

    // Reset fatigue warning when fatigue drops below all thresholds
    if (fatiguePercent < 60) {
      if (fatigueWarningShown.current !== null) {
        // Dismiss the toast when fatigue recovers
        if (onDismissStatusWarning) {
          onDismissStatusWarning();
        }
      }
      fatigueWarningShown.current = null;
    }
  }, [playerCharacter?.health, playerCharacter?.fatigue, isAnyModalOpen, isPlayerOnFarm, onStatusWarning, onDismissStatusWarning, setNarrationHistory]);

  // Clear animals when entering special or interior maps
  useEffect(() => {
    if (mapData?.mapType === 'special' || viewMode === 'interior') {
      setAnimals([]);
    }
  }, [mapData?.mapType, viewMode]);

  // Animal AI Tick
  useEffect(() => {
    const MIN_ANIMALS = 5;
    const AI_UPDATE_RADIUS = 30;
    // Reduce animal AI update frequency for better performance
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const ANIMAL_TICK_INTERVAL = isSafari ? 4000 : 2500; // Safari: 4s, Others: 2.5s (increased for performance)

    const tickInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter) return;

      // Skip animal spawning for special and interior maps
      const isSpecialOrInteriorMap = mapData?.mapType === 'special' || viewMode === 'interior';
      
      if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null && !isSpecialOrInteriorMap) {
        setAnimals(produce((draft) => {
          if (!draft || draft.length === 0) return;
          const playerPos = { x: controlledIconX, y: controlledIconY };

          // Update animals within radius
          for (let i = 0; i < draft.length; i++) {
            const animal = draft[i];
            if (Math.hypot(animal.x - playerPos.x, animal.y - playerPos.y) <= AI_UPDATE_RADIUS) {
              // Get dropped items for animal food seeking
              const droppedItems = mapData?.terrainModifications?.droppedItems || [];
              const update = calculateAnimalUpdate(animal, draft, playerPos, mapData, npcs, droppedItems);

              // Check if animal "ate" a food item (is on same tile as dropped food)
              const foodAtPosition = droppedItems.find(
                dropped => dropped.x === animal.x && dropped.y === animal.y &&
                (dropped.item.category === 'Food' || dropped.item.category === 'Consumable')
              );
              if (foodAtPosition && removeDroppedItem) {
                const animalData = ANIMAL_DATA[animal.baseId];
                const animalName = animalData?.name || animal.baseId;
                console.log(`[Animal AI] ${animal.baseId} consumed ${foodAtPosition.item.name}`);

                // Notify about animal picking up food
                if (onEntityItemPickup) {
                  onEntityItemPickup(animalName, foodAtPosition.item, 'animal');
                }

                removeDroppedItem(foodAtPosition.x, foodAtPosition.y);
              }

              Object.assign(draft[i], update);
            }
          }

          // Filter out animals that are out of bounds
          for (let i = draft.length - 1; i >= 0; i--) {
            const animal = draft[i];
            if (animal.x < 0 || animal.x >= MAP_WIDTH_TILES || animal.y < 0 || animal.y >= MAP_HEIGHT_TILES) {
              draft.splice(i, 1);
            }
          }

          // Spawn new animals if needed
          if (draft.length < MIN_ANIMALS && Math.random() < 0.25) {
            const occupiedTiles = new Set(draft.map((a) => `${a.x},${a.y}`));
            const culturalZone = mapLocationToCulture(currentZone, gameDate.year);
            const newAnimal = spawnSingleAnimal(mapData, animalSpawnNoise, occupiedTiles, culturalZone, mapData.localArea || 'Unknown');
            if (newAnimal) {
              draft.push(newAnimal);
            }
          }
        }));
      }
    }, ANIMAL_TICK_INTERVAL);

    return () => clearInterval(tickInterval);
  }, [mapData, playerCharacter, controlledIconX, controlledIconY, viewMode, animalSpawnNoise, isAnyModalOpen, currentZone]); // Remove setAnimals to prevent recreation

  // NPC AI Tick - Staggered updates for better performance and organic movement
  useEffect(() => {
    const AI_UPDATE_RADIUS = 30;
    const UPDATE_BUCKETS = 4; // Spread NPCs across 4 update buckets
    // Reduce update frequency for better performance
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const TICK_INTERVAL = isSafari ? 3000 : 2000; // Safari: 3s, Others: 2s (increased for performance)

    const tickInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter) return;

      if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null) {
        // Calculate which bucket to update this tick
        const currentBucket = Math.floor(Date.now() / TICK_INTERVAL) % UPDATE_BUCKETS;

        setNpcs(produce((draft) => {
          // Count NPCs being updated this tick for debugging
          let updateCount = 0;
          const npcsToRemove: number[] = [];

          draft.forEach((npc, index) => {
            // Check if NPC should be removed (transferring, dead, invalid)
            if (shouldRemoveNpc(npc)) {
              npcsToRemove.push(index);
              return;
            }

            // Hash NPC ID to a bucket (0-3) for consistent assignment
            const npcBucket = npc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % UPDATE_BUCKETS;

            // Only update NPCs in the current bucket
            if (npcBucket !== currentBucket) return;

            updateCount++;

            // Only update NPCs within range
            if (Math.hypot(npc.x - controlledIconX, npc.y - controlledIconY) <= AI_UPDATE_RADIUS) {
              try {
                // Get dropped items from map
                const droppedItems = mapData.terrainModifications?.droppedItems || [];

                // Use safe wrapper to handle proxy issues
                const updates = safeCalculateNpcUpdate(npc, { x: controlledIconX, y: controlledIconY }, mapData, gameTimeHours, undefined, droppedItems, animals);

                // Check if NPC picked up an item
                if ((updates as any)._itemPickedUp) {
                  const pickup = (updates as any)._itemPickedUp;
                  // Remove item from dropped items list
                  if (mapData.terrainModifications?.droppedItems) {
                    const itemIndex = mapData.terrainModifications.droppedItems.findIndex(
                      dropped => dropped.x === pickup.x && dropped.y === pickup.y
                    );
                    if (itemIndex !== -1) {
                      const pickedUpItem = mapData.terrainModifications.droppedItems[itemIndex].item;

                      // Notify about NPC picking up item
                      if (onEntityItemPickup) {
                        onEntityItemPickup(npc.name, pickedUpItem, 'npc');
                      }

                      // Use removeDroppedItem from map context to properly update cache
                      if (removeDroppedItem) {
                        removeDroppedItem(pickup.x, pickup.y);
                      }
                    }
                  }
                  // Remove the signal property before applying updates
                  delete (updates as any)._itemPickedUp;
                }

                // Check if NPC is leaving the map - BUT ONLY ON STANDARD MAPS, NOT SPECIAL MAPS
                if (updates.isLeavingMap && updates.mapExitDirection && mapData.mapType !== 'special') {
                  // Queue NPC for transfer to adjacent map
                  crossMapNpcService.queueNpcForTransfer(npc, updates.mapExitDirection);
                  // Mark for removal
                  npcsToRemove.push(index);
                } else {
                  // Apply updates directly to draft
                  Object.assign(npc, updates);
                }
              } catch (error: any) {
                // Silently handle proxy errors for individual NPCs
                if (error.message?.includes('revoked') || error.message?.includes('perform')) {
                  console.debug(`[CoreLoops] Skipping NPC ${npc.id || index} due to proxy error`);
                } else {
                  console.error('[CoreLoops] Unexpected NPC update error:', error);
                }
              }
            }
          });

          // Remove NPCs that left the map (in reverse order to maintain indices)
          npcsToRemove.reverse().forEach(index => {
            draft.splice(index, 1);
          });
          
          // Check for reputation-based NPC approaches (only if reputation < 20)
          if (playerCharacter.mapReputation < 20) {
            const approachingNPCs = checkReputationBasedApproach(
              playerCharacter,
              draft,
              controlledIconX,
              controlledIconY
            );

            // If any NPCs approached, trigger dialogue
            if (approachingNPCs.length > 0) {
              const closestNPC = approachingNPCs[0];

              // CRITICAL FIX: Extract data from Immer draft BEFORE async operation
              // The draft will be revoked after produce() completes
              const npcSnapshot = {
                name: closestNPC.name,
                id: closestNPC.id,
                age: closestNPC.age,
                role: closestNPC.role,
                memory: closestNPC.memory
              };

              // Generate hostile dialogue asynchronously (using snapshot, not draft)
              generateLowReputationDialogue(npcSnapshot as any, playerCharacter, mapData).then(dialogue => {
                // Add to narration history
                setNarrationHistory(prev => [...prev, {
                  sender: 'narrator',
                  text: `${npcSnapshot.name} approaches you with a hostile expression: "${dialogue}"`
                }]);
              }).catch(err => {
                console.error('Failed to generate low reputation dialogue:', err);
                // Fallback message
                setNarrationHistory(prev => [...prev, {
                  sender: 'narrator',
                  text: `${npcSnapshot.name} approaches you with a hostile expression: "You're not welcome here. Leave!"`
                }]);
              });
            }
          }
          
          // Enhanced NPC-Initiated Encounter System (Performance Optimized)
          // Only run comprehensive approach checks if no immediate hostile approaches
          if (playerCharacter.mapReputation >= 20) {
            // Get only visible NPCs for performance (within 12 tiles)
            const visibleNPCs = draft.filter(npc => {
              const distance = Math.sqrt(
                Math.pow(npc.x - controlledIconX, 2) +
                Math.pow(npc.y - controlledIconY, 2)
              );
              return distance <= 12;
            });
            
            // Build approach context
            const approachContext: ApproachContext = {
              playerReputation: playerCharacter.mapReputation,
              timeOfDay: gameTimeHours,
              playerWealth: estimatePlayerWealth(playerCharacter),
              playerHealth: playerCharacter.health || 100,
              isInTown: mapData.urbanCenters?.some(uc => 
                Math.abs(uc.x - controlledIconX) <= 3 && Math.abs(uc.y - controlledIconY) <= 3
              ) || false,
              isNearStructure: mapData.structures?.some(s => 
                Math.abs(s.x! - controlledIconX) <= 2 && Math.abs(s.y! - controlledIconY) <= 2
              ) || false
            };
            
            // Check for NPC approaches (performance throttled internally)
            const approachResults = checkNPCApproaches(
              playerCharacter,
              visibleNPCs,
              controlledIconX,
              controlledIconY,
              approachContext
            );
            
            // Handle approach results with enhanced narrator LLM integration
            if (approachResults.length > 0) {
              const approach = approachResults[0];
              const approachingNPC = draft.find(npc => npc.id === approach.npcId);
              
              if (approachingNPC) {
                // Extract values from proxy before async operations to prevent revocation errors
                const npcName = approachingNPC.name;
                const npcData = { ...approachingNPC }; // Shallow copy for async operations

                const currentTime = Date.now();
                const canGenerateNarration = !npcNarrationHistory.current.has(approach.npcId) &&
                                           currentTime - lastNarrationTime.current > 60000; // 1 minute throttle

                // Show immediate toast notification
                const approachIcon = approach.isHostile ? '⚠️' : '💬';
                const toastType = approach.isHostile ? 'error' : 'info';
                showToast(`${approachIcon} ${npcName} approaches`, toastType);
                
                if (canGenerateNarration) {
                  // Generate rich LLM narration (once per NPC, max 1 per minute)
                  generateNPCApproachNarration(
                    npcData,
                    playerCharacter,
                    approach.approachType,
                    approach.distance
                  ).then(narration => {
                    setNarrationHistory(prev => [...prev, {
                      sender: 'narrator',
                      text: narration
                    }]);

                    // Track this NPC and update last narration time
                    npcNarrationHistory.current.add(approach.npcId);
                    lastNarrationTime.current = currentTime;

                    console.log(`[NPCNarration] Generated for ${npcName}: ${narration}`);
                  }).catch(err => {
                    console.error('Failed to generate approach narration:', err);
                    // Fallback to basic narration
                    setNarrationHistory(prev => [...prev, {
                      sender: 'narrator',
                      text: `${npcName} approaches you with ${approach.isHostile ? 'hostile' : 'curious'} intent.`
                    }]);
                  });
                } else {
                  // Basic fallback for throttled cases
                  setNarrationHistory(prev => [...prev, {
                    sender: 'narrator',
                    text: `${npcName} draws closer to you.`
                  }]);
                }
                
                // Move NPC slightly toward player to show approach
                const dx = Math.sign(controlledIconX - approachingNPC.x);
                const dy = Math.sign(controlledIconY - approachingNPC.y);
                
                // Only move if it would bring them closer (don't overshoot)
                if (Math.abs(approachingNPC.x - controlledIconX) > 1) {
                  approachingNPC.x += dx;
                }
                if (Math.abs(approachingNPC.y - controlledIconY) > 1) {
                  approachingNPC.y += dy;
                }
                
                // Automatically open encounter modal for different approach types
                if (approach.approachType === 'quest' || approach.approachType === 'theft' || 
                    approach.approachType === 'hostile' || approach.approachType === 'guard') {
                  setTimeout(() => {
                    // Only trigger if no other modal is open
                    if (!isAnyModalOpen) {
                      console.log(`[NPCApproach] ${approachingNPC.name} approaching with ${approach.approachType}, opening encounter modal`);
                      handleEncounter(approachingNPC);
                    }
                  }, approach.approachType === 'theft' ? 1000 : 2000); // Quicker for theft attempts
                }
              }
            }
          }
          
          // Clean up old narration history every 10 minutes (to prevent memory leaks)
          const cleanupTime = Date.now();
          if (cleanupTime % 600000 < 3000) { // Check every 10 minutes (within 3 second window)
            npcNarrationHistory.current.clear();
            console.log('[NPCNarration] Cleared narration history to prevent memory leaks');
          }

          // Debug logging removed - too spammy
        }));
      }
    }, TICK_INTERVAL); // Update every 1000ms, but each NPC only updates every 4 seconds (in their bucket)

    return () => clearInterval(tickInterval);
  }, [mapData, playerCharacter, controlledIconX, controlledIconY, viewMode, isAnyModalOpen, gameTimeHours]); // Remove setNpcs to prevent recreation

  // Disease Spreading Tick - runs every 10 seconds
  useEffect(() => {
    const SPREAD_RADIUS = 30; // Only check disease spread near player

    const diseaseInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter || viewMode !== 'standard') return;
      if (controlledIconX === null || controlledIconY === null) return;

      // Handle NPC-to-NPC and Animal-to-Animal spreading
      setNpcs(produce((draft) => {
        for (let i = 0; i < draft.length; i++) {
          const npc1 = draft[i];

          if (Math.hypot(npc1.x - controlledIconX, npc1.y - controlledIconY) > SPREAD_RADIUS) continue;

          if (!npc1.health?.currentDiseases?.length) continue;

          const disease = npc1.health.currentDiseases[0];

          // Safety check to prevent proxy revocation errors
          if (!disease?.disease) continue;

          for (let j = 0; j < draft.length; j++) {
            if (i === j) continue;
            const npc2 = draft[j];

            if (npc2.health?.currentDiseases?.length) continue;

            const distance = Math.hypot(npc1.x - npc2.x, npc1.y - npc2.y);
            if (distance <= 2) {
              let baseChance = distance <= 1 ? 0.1 : 0.05;

              // Safe access to prevent proxy revocation errors
              const virality = disease?.disease?.transmissionRate ?? 1.0;
              baseChance *= virality;

              const constitution = npc2.stats?.constitution || 10;
              if (constitution > 14) baseChance *= 0.7;
              if (constitution < 8) baseChance *= 1.3;

              if (Math.random() < baseChance) {
                // Directly mutate the draft
                npc2.health = {
                  currentDiseases: [
                    {
                      ...disease,
                      contractedDate: Date.now(),
                      stage: 'early',
                    },
                  ],
                  exposureHistory: [],
                  immunities: [],
                  overallHealthStatus: 'sick',
                  lastHealthUpdate: { year: parseInt(mapData?.timeSlice || '1500'), month: 1, day: 1 }
                };
                
                // Show notification about disease spread
                const notification = `⚠️ ${npc1.name}'s ${disease.disease.name} has spread to ${npc2.name}!`;
                showToast(notification);
                
                console.log(
                  `[NPC→NPC Disease Spread] ${npc1.name}'s ${disease.disease.name} spread to ${npc2.name} at distance ${distance.toFixed(
                    1
                  )} tiles (${(baseChance * 100).toFixed(1)}% chance)`
                );
              }
            }
          }
        }

        // Check for NPC deaths from disease progression
        const npcDeaths: { npc: NpcEntity; disease: Disease }[] = [];
        const npcsToRemove: number[] = [];

        for (let i = draft.length - 1; i >= 0; i--) {
          const npc = draft[i];

          if (npc.health?.currentDiseases?.length) {
            const activeDiseases = npc.health.currentDiseases;

            // Check each disease for potential death
            for (const activeDisease of activeDiseases) {
              const disease = activeDisease.disease;

              // Calculate death chance based on disease mortality rate and NPC constitution
              const constitution = npc.stats?.constitution || 10;
              const constitutionMultiplier = constitution < 8 ? 1.5 : constitution > 14 ? 0.5 : 1.0;
              const mortalityRate = disease.mortalityRate * constitutionMultiplier;

              // Daily death check (very small chance per update tick)
              const deathChance = mortalityRate * 0.001; // Scale down for frequent checks

              if (Math.random() < deathChance) {
                // NPC has died from disease
                npcDeaths.push({ npc, disease });
                updatedNpcs.splice(i, 1); // Remove from NPC array
                break; // Stop checking other diseases for this NPC
              }
            }
          }
        }

        // Show death notifications
        npcDeaths.forEach(({ npc, disease }) => {
          if (onNpcDeath) {
            onNpcDeath(npc, disease);
          }

          const notification = `💀 ${npc.name} has died from ${disease.name}`;
          showToast(notification);

          console.log(`[NPC Death] ${npc.name} (age ${npc.age}) died from ${disease.name} (${(disease.mortalityRate * 100).toFixed(1)}% mortality rate)`);
        });

        // Remove dead NPCs
        npcsToRemove.reverse().forEach(index => {
          draft.splice(index, 1);
        });
      }));

      // Handle animal-to-animal and cross-species spreading
      setAnimals(produce((draft) => {
        // Get current NPCs from state
        const currentNpcs = [...(npcs || [])];

        // Animal-to-animal spreading
        for (let i = 0; i < draft.length; i++) {
          const animal1 = draft[i];

          if (Math.hypot(animal1.x - controlledIconX, animal1.y - controlledIconY) > SPREAD_RADIUS) continue;

          if (!animal1.diseaseHealth?.currentDiseases?.length) continue;

          const disease = animal1.diseaseHealth.currentDiseases[0];

          for (let j = 0; j < draft.length; j++) {
            if (i === j) continue;
            const animal2 = draft[j];

            if (animal2.diseaseHealth?.currentDiseases?.length) continue;

            const distance = Math.hypot(animal1.x - animal2.x, animal1.y - animal2.y);
            if (distance <= 2) {
              const sameSpecies = animal1.speciesName === animal2.speciesName;
              let baseChance = distance <= 1 ? (sameSpecies ? 0.1 : 0.05) : sameSpecies ? 0.05 : 0.02;

              const virality = disease.disease.transmissionRate || 1.0;
              baseChance *= virality;

              if (Math.random() < baseChance) {
                // Directly mutate the draft
                animal2.diseaseHealth = {
                  currentDiseases: [
                    {
                      ...disease,
                      contractedDate: Date.now(),
                      stage: 'early',
                    },
                  ],
                  exposureHistory: [],
                  resistances: {},
                };
                console.log(
                  `[Animal→Animal Disease Spread] ${animal1.speciesName}'s ${disease.disease.name} spread to ${animal2.speciesName} at distance ${distance.toFixed(
                    1
                  )} tiles (${(baseChance * 100).toFixed(1)}% chance)`
                );
              }
            }
          }

          // Check for cross-species transmission to NPCs
          currentNpcs.forEach((npc) => {
            if (npc.health?.currentDiseases?.length) return;

            const distance = Math.hypot(animal1.x - npc.x, animal1.y - npc.y);
            if (distance <= 1.5) {
              let baseChance = distance <= 1 ? 0.03 : 0.015;

              const virality = disease.disease.transmissionRate || 1.0;
              baseChance *= virality * 0.5;

              if (Math.random() < baseChance) {
                // Show notification about zoonotic transmission
                const notification = `🦠 ${animal1.speciesName}'s ${disease.disease.name} has jumped to ${npc.name}!`;
                showToast(notification);
                
                setNpcs((prevNpcs) =>
                  prevNpcs.map((n) => {
                    if (n.id === npc.id) {
                      console.log(
                        `[Animal→Human Disease Spread] ${animal1.speciesName}'s ${disease.disease.name} jumped to ${npc.name} at distance ${distance.toFixed(
                          1
                        )} tiles (${(baseChance * 100).toFixed(1)}% chance)`
                      );
                      return {
                        ...n,
                        health: {
                          currentDiseases: [
                            {
                              ...disease,
                              contractedDate: Date.now(),
                              stage: 'early',
                            },
                          ],
                          exposureHistory: [],
                          immunities: [],
                          overallHealthStatus: 'sick',
                          lastHealthUpdate: { year: parseInt(mapData?.timeSlice || '1500'), month: 1, day: 1 }
                        },
                      };
                    }
                    return n;
                  })
                );
              }
            }
          });
        };

        // Human-to-animal transmission
        currentNpcs.forEach((npc) => {
          if (!npc.health?.currentDiseases?.length) return;

          const disease = npc.health.currentDiseases[0];

          for (let i = 0; i < draft.length; i++) {
            const animal = draft[i];

            if (animal.diseaseHealth?.currentDiseases?.length) continue;

            const distance = Math.hypot(npc.x - animal.x, npc.y - animal.y);
            if (distance <= 1.5) {
              let baseChance = distance <= 1 ? 0.02 : 0.01;

              const virality = disease.disease.transmissionRate || 1.0;
              baseChance *= virality * 0.3;

              if (Math.random() < baseChance) {
                // Show notification about reverse zoonotic transmission
                const notification = `🐾 ${npc.name}'s ${disease.disease.name} has infected a ${animal.speciesName}!`;
                showToast(notification);

                // Directly mutate the draft
                draft[i].diseaseHealth = {
                  currentDiseases: [
                    {
                      ...disease,
                      contractedDate: Date.now(),
                      stage: 'early',
                    },
                  ],
                  exposureHistory: [],
                  resistances: {},
                };
                console.log(
                  `[Human→Animal Disease Spread] ${npc.name}'s ${disease.disease.name} jumped to ${animal.speciesName} at distance ${distance.toFixed(
                    1
                  )} tiles (${(baseChance * 100).toFixed(1)}% chance)`
                );
              }
            }
          }
        });
      }));
    }, 10000);

    return () => clearInterval(diseaseInterval);
  }, [isAnyModalOpen, playerCharacter, viewMode, controlledIconX, controlledIconY]); // Remove npcs, animals, and setters to prevent recreation

  // Economy Tick (Taxation)
  useEffect(() => {
    if (!mapData?.terrainStructures || isAnyModalOpen) return;

    const controllingStructures = mapData.terrainStructures.filter((s) => s.structureType === 'fortress' || s.structureType === 'palace');
    if (controllingStructures.length === 0) return;

    const productionStructures = mapData.terrainStructures.filter((s) => s.economicRole === 'extraction' || s.economicRole === 'processing');

    productionStructures.forEach((prodStruct) => {
      if (prodStruct.state !== 'active' || !prodStruct.outputGoods || prodStruct.outputGoods.length === 0) return;

      let closestController: { id: string; dist: number } | null = null;
      controllingStructures.forEach((conStruct) => {
        const dist = Math.hypot(prodStruct.location[0] - conStruct.location[0], prodStruct.location[1] - conStruct.location[1]);
        if (!closestController || dist < closestController.dist) {
          closestController = { id: conStruct.id, dist: dist };
        }
      });

      if (closestController) {
        const controller = controllingStructures.find((s) => s.id === closestController!.id);
        if (controller) {
          const taxedGoodId = prodStruct.outputGoods[0];
          const taxAmount = 1;

          const newTreasury = { ...(controller.treasury || {}) };
          newTreasury[taxedGoodId] = (newTreasury[taxedGoodId] || 0) + taxAmount;

          updateStructureData(controller.id, { treasury: newTreasury });
        }
      }
    });
  }, [gameDate.day]); // Reruns every time the game day changes

  // Actionable Tiles - Must run on every position change for entry button to work
  useEffect(() => {
    // Don't clear actionable tile just because we're moving - only check viewMode and data availability
    if (viewMode !== 'standard' || controlledIconX === null || controlledIconY === null || !mapData) {
      if (actionableTile) setActionableTile(null);
      return;
    }

    // Allow a small delay after movement to set actionable tile
    const checkActionableTile = () => {
      if (!mapData.tiles || !mapData.tiles[controlledIconY] || !mapData.tiles[controlledIconY][controlledIconX]) {
        return;
      }
      
      const currentTile = mapData.tiles[controlledIconY][controlledIconX];

      // Actionable Tile Logic
      const structureOnTile = mapData.terrainStructures?.find((s) => s.location[0] === currentTile.x && s.location[1] === currentTile.y);

      if (structureOnTile) {
        const structureType: TerrainStructureType = structureOnTile.structureType;
        if (structureType === 'mining_colony') {
          setActionableTile({ type: 'mine', tile: currentTile, structure: structureOnTile });
          return;
        }
        if (structureType === 'fishing_hut') {
          console.log('[useCoreLoops] Detected fishing hut structure, setting actionable tile');
          setActionableTile({ type: 'fishing_hut', tile: currentTile, structure: structureOnTile });
          return;
        }
        // Auto-open government district modal when walking on it
        if (structureType === 'government_district' && !structureOnTile.isRuined) {
          // Only set the modal target if it's not already open
          setStructureModalTarget(prev => {
            if (!prev || prev.id !== structureOnTile.id) {
              return structureOnTile;
            }
            return prev;
          });
        }
      }
      
      // PRIORITY CHECK: Government districts should be handled FIRST before any other tile type
      // This ensures they are never confused with LOW_DENSITY_CITY or DENSE_CITY tiles
      if (currentTile.biome === BiomeType.GOVERNMENT_DISTRICT) {
        // Government districts are special and should ALWAYS open their modal
        // Create a pseudo-structure for government district tiles
        const pseudoStructure = {
          id: `gov_district_${currentTile.x}_${currentTile.y}`,
          structureType: 'government_district' as const,
          location: [currentTile.x, currentTile.y] as [number, number],
          materialType: 'stone',
          isRuined: false,
          biome: BiomeType.GOVERNMENT_DISTRICT,
          name: 'Government District'
        } as any as TerrainStructure;
        
        // Use activeGovernmentModal for proper rendering like RuinStructureModal
        setActiveGovernmentModal(prev => {
          if (!prev || prev.structure.id !== pseudoStructure.id) {
            console.log('[GovernmentDistrict] Setting activeGovernmentModal for tile at', currentTile.x, currentTile.y);
            return { structure: pseudoStructure, tile: currentTile };
          }
          return prev;
        });
        
        // IMPORTANT: Don't set actionable tile and don't check other tile types
        // Government districts are unique and should never be treated as buildings
        setActionableTile(null);
        return;
      }

      // Check for urban tiles (should be treated as cities)
      const isUrbanTile = [
        BiomeType.HAMLET,
        BiomeType.LOW_DENSITY_CITY,
        BiomeType.DENSE_CITY,
        BiomeType.CITY_CENTER,
      ].includes(currentTile.biome);

      // Double-check to ensure government districts are never treated as regular buildings
      const isBuildingTile = currentTile.biome !== BiomeType.GOVERNMENT_DISTRICT && [
        BiomeType.PALACE,
        BiomeType.HOLY_SITE,
        // Urban tiles are now handled separately
        // GOVERNMENT_DISTRICT is explicitly excluded and handled separately above
      ].includes(currentTile.biome);

      if (currentTile.biome === BiomeType.FARMLAND) {
        setActionableTile({ type: 'farm', tile: currentTile });
      } else if (currentTile.biome === BiomeType.MARKETPLACE) {
        setActionableTile({ type: 'marketplace', tile: currentTile });
      } else if (currentTile.biome === BiomeType.RUINS) {
        setActionableTile({ type: 'ruin', tile: currentTile });
      } else if (currentTile.biome === BiomeType.RAILROAD_STATION) {
        setActionableTile({ type: 'railroad_station', tile: currentTile });
      } else if (currentTile.biome === BiomeType.HARBOR_DISTRICT) {
        setActionableTile({ type: 'harbor_district', tile: currentTile });
      } else if (isUrbanTile) {
        setActionableTile({ type: 'city', tile: currentTile });
      } else if (isBuildingTile) {
        setActionableTile({ type: 'building', tile: currentTile });
      } else {
        setActionableTile(null);
      }
    };
    
    // Check immediately and also after a small delay to account for movement animation
    checkActionableTile();
    const timeoutId = setTimeout(checkActionableTile, 250);
    
    return () => clearTimeout(timeoutId);
  }, [controlledIconX, controlledIconY, viewMode, mapData, setActionableTile]);

  // Contextual Messages - THROTTLED for performance  
  useEffect(() => {
    if (isIconMoving.current || viewMode !== 'standard' || controlledIconX === null || controlledIconY === null || !mapData) {
      if (contextualMessage) setContextualMessage(null);
      return;
    }

    // Throttle this expensive check - only run every 3rd move to prevent stutter
    if (moveCount % 3 !== 0) {
      return;
    }

    // Contextual Message Logic (Borders, nearby entities)
    const nearbyAnimal = visibleAnimals.find((a) => Math.hypot(a.x - controlledIconX, a.y - controlledIconY) <= 1.5);
    if (nearbyAnimal) {
      setContextualMessage(`A ${nearbyAnimal.speciesName} is nearby.`);
      return;
    }
    const nearbyNpc = npcs.find((n) => Math.hypot(n.x - controlledIconX, n.y - controlledIconY) <= 1.5);
    if (nearbyNpc) {
      setContextualMessage(`${nearbyNpc.name} is nearby.`);
      return;
    }

    // Skip border detection on Safari for performance
    if (typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      setContextualMessage(null);
    } else {
      const BORDER_THRESHOLD = 2;
      if (controlledIconX < BORDER_THRESHOLD) setContextualMessage(`You are near the western border.`);
      else if (controlledIconX >= MAP_WIDTH_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the eastern border.`);
      else if (controlledIconY < BORDER_THRESHOLD) setContextualMessage(`You are near the northern border.`);
      else if (controlledIconY >= MAP_HEIGHT_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the southern border.`);
      else setContextualMessage(null);
    }
  }, [controlledIconX, controlledIconY, viewMode, visibleAnimals, npcs, mapData, isIconMoving, moveCount])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAnyModalOpen) {
          e.preventDefault();
          closeAllModals();
          return;
        }
        if (viewMode === 'interior') {
          e.preventDefault();
          handleExitInteriorView();
          return;
        }
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Don't handle arrow keys if in roguelike modes
        if (inRuinRoguelike || inMiningRoguelike) {
          // Clear any active keys when entering roguelike modes
          activeKeys.current.clear();
          return;
        }
        if (isAnyModalOpen && !combatant) return;
        if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        // Check if player is in elevated state and prevent movement
        if (playerCharacter?.elevatedState && viewMode === 'standard') {
          e.preventDefault();
          // Add a narration message about being elevated
          if (setNarrationHistory) {
            setNarrationHistory(prev => [...prev, {
              sender: 'narrator',
              text: `You are ${playerCharacter.elevationDescription || 'in an elevated position'}! You need to climb down before you can move elsewhere.`
            }]);
          }
          return;
        }

        e.preventDefault();
        if (viewMode === 'standard') {
          activeKeys.current.add(e.key);
        } else if (viewMode === 'interior' && interiorMapPlayerPos) {
          let newX = interiorMapPlayerPos.x;
          let newY = interiorMapPlayerPos.y;
          if (e.key === 'ArrowUp') newY -= 1;
          else if (e.key === 'ArrowDown') newY += 1;
          else if (e.key === 'ArrowLeft') newX -= 1;
          else if (e.key === 'ArrowRight') newX += 1;
          onPlayerMove({ x: newX, y: newY });
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        togglePinnedTooltip();
        return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        activeKeys.current.delete(e.key);
      }
    };
    const onBlur = () => {
      // prevent stuck-movement if window/tab loses focus while holding a key
      activeKeys.current.clear();
      repeatRef.current.holdStart = 0;
      repeatRef.current.nextStepAt = 0;
      repeatRef.current.isRepeating = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    viewMode,
    handleExitInteriorView,
    interiorMapPlayerPos,
    onPlayerMove,
    isAnyModalOpen,
    combatant,
    closeAllModals,
    togglePinnedTooltip,
    activeKeys,
  ]);

  useEffect(() => {
    const handleHistoryLensMove = (payload: { dx?: number; dy?: number; steps?: number }) => {
      if (!payload) return;
      let dx = Number(payload.dx || 0);
      let dy = Number(payload.dy || 0);

      if (dx !== 0 && dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          dy = 0;
        } else {
          dx = 0;
        }
      }

      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));

      if (dx === 0 && dy === 0) return;

      const steps = Math.max(1, Math.min(5, Number(payload.steps || 1)));
      for (let i = 0; i < steps; i += 1) {
        queuedMovesRef.current.push({ dx, dy });
      }
      activeKeys.current.clear();
      historyLensMoveActiveRef.current = true;
      historyLensMoveEndNotifiedRef.current = false;
      historyLensNavTargetRef.current = null;
      historyLensNavDetourNotifiedRef.current = false;
      historyLensPathRef.current = [];
    };

    eventBus.on('historylens:move', handleHistoryLensMove);
    const handleHistoryLensNavigate = (payload: { x: number; y: number; label: string; kind: string }) => {
      if (!payload) return;
      if (!mapData || controlledIconX == null || controlledIconY == null) return;
      historyLensNavTargetRef.current = payload;
      historyLensMoveActiveRef.current = true;
      historyLensMoveEndNotifiedRef.current = false;
      historyLensNavDetourNotifiedRef.current = false;
      postDisembarkTargetRef.current = null; // Clear any previous post-disembark target
      queuedMovesRef.current = [];
      activeKeys.current.clear();

      let path = findHistoryLensPath(
        mapData,
        { x: controlledIconX, y: controlledIconY },
        { x: payload.x, y: payload.y },
        playerMode,
        5000
      );

      // If path is null and we're on a ship trying to reach land, find a reachable coastal route
      if (!path && playerMode === 'ship' && isDestinationOnLand(mapData, { x: payload.x, y: payload.y })) {
        const coastalResult = findReachableCoastalTile(
          mapData,
          { x: controlledIconX, y: controlledIconY },
          { x: payload.x, y: payload.y }
        );
        if (coastalResult) {
          // Use the pre-computed path to the coastal tile
          path = coastalResult.path;
          // Store the original destination for after we disembark
          postDisembarkTargetRef.current = payload;
          // Update the immediate nav target to the coastal tile
          historyLensNavTargetRef.current = {
            ...payload,
            x: coastalResult.coastalTile.x,
            y: coastalResult.coastalTile.y,
            label: `coast near ${payload.label}`
          };
          eventBus.emit('historylens:append', {
            sender: 'system',
            text: `Sailing toward the coast near ${payload.label}...`
          });
        }
      }

      if (!path) {
        eventBus.emit('historylens:append', {
          sender: 'system',
          text: 'That route is blocked from here.'
        });
        historyLensNavTargetRef.current = null;
        historyLensMoveActiveRef.current = false;
        historyLensMoveEndNotifiedRef.current = false;
        historyLensNavDetourNotifiedRef.current = false;
        historyLensPathRef.current = [];
        postDisembarkTargetRef.current = null;
        return;
      }
      historyLensPathRef.current = path;
    };
    eventBus.on('historylens:navigate', handleHistoryLensNavigate);
    return () => {
      eventBus.off('historylens:move', handleHistoryLensMove);
      eventBus.off('historylens:navigate', handleHistoryLensNavigate);
    };
  }, [activeKeys, mapData, controlledIconX, controlledIconY, playerMode]);

 // Movement loop — simplified and consistent
useEffect(() => {
  const BASE_MOVE_ANIM_MS = 250; // Base movement interval (locked at 250ms for smooth feel)

  const moveLoop = (currentTime: number) => {
    moveLoopId.current = requestAnimationFrame(moveLoop);

    // Calculate disease-based movement penalty
    const diseaseRestrictions = calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);
    const MOVE_ANIM_MS = Math.round(BASE_MOVE_ANIM_MS * diseaseRestrictions.movementPenaltyMultiplier);

    // Check for terminal disease progression
    const deathCheck = shouldPlayerDieFromDisease(playerCharacter?.diseaseHealth);
    if (deathCheck.shouldDie && deathCheck.cause) {
      const deathInfo: DeathInfo = {
        type: 'disease',
        disease: deathCheck.cause.disease,
        description: `Succumbed to ${deathCheck.cause.disease.name} after ${deathCheck.cause.daysSinceContraction} days of illness`
      };
      onDeath?.(deathInfo);
      return;
    }

    // Check if we're allowed to move yet (with disease penalty applied)
    if (currentTime < nextMoveAllowed.current) return;

    // Add movement restriction narration for severe illness
    if (diseaseRestrictions.movementPenaltyMultiplier > 10.0 && moveCount % 3 === 0) {
      const restrictionMessages = [
        "Your illness makes every step a struggle.",
        "You move slowly, weakened by disease.",
        "Each movement requires tremendous effort.",
        "Your body can barely respond to your will."
      ];
      const randomMessage = restrictionMessages[Math.floor(Math.random() * restrictionMessages.length)];

      setNarrationHistory(prev => [
        ...prev,
        {
          id: `illness-movement-${Date.now()}`,
          timestamp: gameDate,
          timeString: formattedTime,
          message: randomMessage,
          type: 'system'
        }
      ]);
    }

    const hasQueuedMove = queuedMovesRef.current.length > 0;
    const hasNavTarget = Boolean(historyLensNavTargetRef.current);
    const clearQueuedMoves = () => {
      if (queuedMovesRef.current.length) {
        queuedMovesRef.current = [];
      }
    };
    const clearHistoryLensNavigation = () => {
      historyLensNavTargetRef.current = null;
      historyLensNavDetourNotifiedRef.current = false;
      historyLensPathRef.current = [];
    };
    const emitHistoryLensSystem = (text: string) => {
      if (!text) return;
      if (centralMode === 'historylens' || historyLensMoveActiveRef.current) {
        eventBus.emit('historylens:append', { sender: 'system', text });
      }
    };

    const shouldEndHistoryLensMove =
      historyLensMoveActiveRef.current &&
      !hasQueuedMove &&
      !hasNavTarget &&
      activeKeys.current.size === 0;

    if (shouldEndHistoryLensMove && !historyLensMoveEndNotifiedRef.current) {
      eventBus.emit('historylens:movement_end');
      historyLensMoveEndNotifiedRef.current = true;
      historyLensMoveActiveRef.current = false;
    }

    // Basic guards - don't check isIconMoving here to avoid blocking
    if (
      viewMode !== 'standard' ||
      (!hasQueuedMove && !hasNavTarget && activeKeys.current.size === 0) ||
      inRuinRoguelike ||
      inMiningRoguelike ||
      !mapData ||
      controlledIconX == null ||
      controlledIconY == null ||
      isAnyModalOpen ||
      pendingIconTransitionInfo
    ) {
      // Only reset velocity if it's not already zero
      setVelocity(prev => (prev.x !== 0 || prev.y !== 0) ? { x: 0, y: 0 } : prev);
      return;
    }

    // Populate queue from navigation target if needed
    if (!hasQueuedMove && activeKeys.current.size === 0 && historyLensNavTargetRef.current) {
      const target = historyLensNavTargetRef.current;
      if (controlledIconX === target.x && controlledIconY === target.y) {
        clearHistoryLensNavigation();
        // Emit a rich arrival event that HistoryLensPanel can use to trigger an LLM description
        eventBus.emit('historylens:destination_reached', {
          target: {
            x: target.x,
            y: target.y,
            label: target.label,
            kind: target.kind
          },
          playerX: controlledIconX,
          playerY: controlledIconY
        });
      } else {
        if (historyLensPathRef.current.length) {
          const nextStep = historyLensPathRef.current.shift();
          if (nextStep) {
            const stepDx = Math.sign(nextStep.x - controlledIconX);
            const stepDy = Math.sign(nextStep.y - controlledIconY);
            queuedMovesRef.current.push({ dx: stepDx, dy: stepDy });
          }
        } else {
          emitHistoryLensSystem('The route seems blocked from here.');
          clearHistoryLensNavigation();
          clearQueuedMoves();
        }
      }
    }

    // direction from queued moves or keys
    let dx = 0, dy = 0;
    const hasQueuedMoveNow = queuedMovesRef.current.length > 0;
    if (hasQueuedMoveNow) {
      const queuedMove = queuedMovesRef.current.shift();
      dx = queuedMove?.dx || 0;
      dy = queuedMove?.dy || 0;
    } else {
      if (activeKeys.current.has('ArrowUp')) dy -= 1;
      if (activeKeys.current.has('ArrowDown')) dy += 1;
      if (activeKeys.current.has('ArrowLeft')) dx -= 1;
      if (activeKeys.current.has('ArrowRight')) dx += 1;
    }
    // Only update velocity if it actually changed to reduce React re-renders
    setVelocity(prev => (prev.x !== dx || prev.y !== dy) ? { x: dx, y: dy } : prev);
    if (dx === 0 && dy === 0) return;

    setMoveCount(prev => prev + 1);

    // Only update rotation if it actually changed
    const newRotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    setIconRotation(prev => prev !== newRotation ? newRotation : prev);

    // candidate position
    let newLogicalX = controlledIconX + dx;
    let newLogicalY = controlledIconY + dy;

    // edge transitions 
    if (!isEnteringSpecialMap) {
      if (isSpecialMap && mapData) {
        // In special maps, reaching any edge returns to the standard map
        const mapWidth = mapData.width || mapData.tiles[0]?.length || MAP_WIDTH_TILES;
        const mapHeight = mapData.height || mapData.tiles.length || MAP_HEIGHT_TILES;
        
        if (newLogicalX < 0 || newLogicalX >= mapWidth || 
            newLogicalY < 0 || newLogicalY >= mapHeight) {
          console.log('[Edge Exit] Exiting special map via edge at:', newLogicalX, newLogicalY, 'map size:', mapWidth + 'x' + mapHeight);
          clearQueuedMoves();
          clearHistoryLensNavigation();
          exitSpecialMap();
          return;
        }
      } else {
        // Normal map edge transitions
        if (newLogicalX < 0) {
          // Get destination for proper logging
          // Use original liminal key if in liminal space, otherwise use localArea
          const lookupKey = liminalTravelState?.key || localArea;
          const nextMapResult = getNextMapArea(lookupKey, 'W');
          const destination = nextMapResult.type === 'adjacent' ? nextMapResult.areaDef.name :
                            nextMapResult.type === 'liminal' ? nextMapResult.destination :
                            'Unknown destination';
          addGameLogEntry({
            id: `map-transition-${Date.now()}`,
            timestamp: { ...gameDate },
            timeString: formattedTime,
            type: 'MAP_ENTRY',
            icon: '🗺️',
            summary: `Travelled west from ${localArea || 'current area'} to ${destination}`,
            details: undefined,
          });
          // Advance time by 1 hour for map transition
          setGameTimeHours(prevHours => (prevHours + 1) % 24);
          clearQueuedMoves();
          clearHistoryLensNavigation();
          handleMapTransition('W', MAP_WIDTH_TILES - 1, controlledIconY);
          return;
        }
        if (newLogicalX >= MAP_WIDTH_TILES) {
          // Get destination for proper logging
          // Use original liminal key if in liminal space, otherwise use localArea
          const lookupKey = liminalTravelState?.key || localArea;
          const nextMapResult = getNextMapArea(lookupKey, 'E');
          const destination = nextMapResult.type === 'adjacent' ? nextMapResult.areaDef.name :
                            nextMapResult.type === 'liminal' ? nextMapResult.destination :
                            'Unknown destination';
          addGameLogEntry({
            id: `map-transition-${Date.now()}`,
            timestamp: { ...gameDate },
            timeString: formattedTime,
            type: 'MAP_ENTRY',
            icon: '🗺️',
            summary: `Travelled east from ${localArea || 'current area'} to ${destination}`,
            details: undefined,
          });
          // Advance time by 1 hour for map transition
          setGameTimeHours(prevHours => (prevHours + 1) % 24);
          clearQueuedMoves();
          clearHistoryLensNavigation();
          handleMapTransition('E', 0, controlledIconY);
          return;
        }
        if (newLogicalY < 0) {
          // Get destination for proper logging
          // Use original liminal key if in liminal space, otherwise use localArea
          const lookupKey = liminalTravelState?.key || localArea;
          const nextMapResult = getNextMapArea(lookupKey, 'N');
          const destination = nextMapResult.type === 'adjacent' ? nextMapResult.areaDef.name :
                            nextMapResult.type === 'liminal' ? nextMapResult.destination :
                            'Unknown destination';
          addGameLogEntry({
            id: `map-transition-${Date.now()}`,
            timestamp: { ...gameDate },
            timeString: formattedTime,
            type: 'MAP_ENTRY',
            icon: '🗺️',
            summary: `Travelled north from ${localArea || 'current area'} to ${destination}`,
            details: undefined,
          });
          // Advance time by 1 hour for map transition
          setGameTimeHours(prevHours => (prevHours + 1) % 24);
          clearQueuedMoves();
          clearHistoryLensNavigation();
          handleMapTransition('N', controlledIconX, MAP_HEIGHT_TILES - 1);
          return;
        }
        if (newLogicalY >= MAP_HEIGHT_TILES) {
          // Get destination for proper logging
          // Use original liminal key if in liminal space, otherwise use localArea
          const lookupKey = liminalTravelState?.key || localArea;
          const nextMapResult = getNextMapArea(lookupKey, 'S');
          const destination = nextMapResult.type === 'adjacent' ? nextMapResult.areaDef.name :
                            nextMapResult.type === 'liminal' ? nextMapResult.destination :
                            'Unknown destination';
          addGameLogEntry({
            id: `map-transition-${Date.now()}`,
            timestamp: { ...gameDate },
            timeString: formattedTime,
            type: 'MAP_ENTRY',
            icon: '🗺️',
            summary: `Travelled south from ${localArea || 'current area'} to ${destination}`,
            details: undefined,
          });
          // Advance time by 1 hour for map transition
          setGameTimeHours(prevHours => (prevHours + 1) % 24);
          clearQueuedMoves();
          clearHistoryLensNavigation();
          handleMapTransition('S', controlledIconX, 0);
          return;
        }
      }
    }

    // animal interaction
    const animalOnTile = visibleAnimals?.find(a => a.x === newLogicalX && a.y === newLogicalY);
    if (animalOnTile) {
      // Save journey target before clearing so we can resume after encounter
      if (historyLensNavTargetRef.current) {
        const journeyData = {
          destination: { ...historyLensNavTargetRef.current },
          interruptedBy: 'animal' as const,
          entityName: animalOnTile.speciesName || animalOnTile.baseId
        };
        interruptedJourneyRef.current = journeyData;
        // Emit event so HistoryLensPanel can show continuation card after encounter
        eventBus.emit('historylens:journey_interrupted', journeyData);
      }
      clearQueuedMoves();
      clearHistoryLensNavigation();
      const animalData = ANIMAL_DATA[animalOnTile.baseId];
      const isAquaticCollectable = playerMode === 'ship' && animalData?.habitat === 'aquatic';

      if (isAquaticCollectable) {
        // Remove the animal FIRST to prevent re-triggering
        setAnimals(produce((draft) => {
          const index = draft.findIndex(a => a.id === animalOnTile.id);
          if (index !== -1) {
            draft.splice(index, 1);
          }
        }));

        // Then collect the drop
        const drop = animalData.drops.find(d => Math.random() < d.chance);
        if (drop) {
          const newItem = createItemInstance(drop.name);
          if (newItem) {
            setPlayerCharacter(prev => prev ? { ...prev, inventory: addItemToInventory(prev.inventory, newItem) } : null);
            setPanelNotificationItem(newItem);
            setTimeout(() => setPanelNotificationItem(null), 2500);
            addGameLogEntry(LogService.createItemAcquiredLog(newItem.name, 1, 'from the water', gameDate, formattedTime, localArea, currentTimeOfDay));
          }
        }

        // commit move and set next allowed move time (with disease penalty)
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        nextMoveAllowed.current = currentTime + MOVE_ANIM_MS;

        // Advance game time by 5 minutes for each movement
        setGameTimeMinutes(prev => {
          const newMinutes = (prev + 5) % 60;
          if (newMinutes < prev) {
            // We wrapped around, increment the hour
            setGameTimeHours(prevHours => (prevHours + 1) % 24);
          }
          return newMinutes;
        });

        // Log map entry for every 20th movement to avoid spam (was 5th, too frequent)
        if (moveCount % 20 === 0) {
          addGameLogEntry(LogService.createMapEntryLog(
            `${newLogicalX > controlledIconX ? 'east' : newLogicalX < controlledIconX ? 'west' : newLogicalY > controlledIconY ? 'south' : 'north'}`,
            localArea || 'Unknown location',
            gameDate,
            formattedTime,
            currentTimeOfDay
          ));
        }
        return;
      } else {
        if (animalOnTile.type === 'Predator') handleInitiateCombat(animalOnTile);
        else handleEncounter(animalOnTile);
      }
      return;
    }

    // NPC interaction
    const npcOnTile = npcs?.find(n => n.x === newLogicalX && n.y === newLogicalY);
    if (npcOnTile) {
      // Save journey target before clearing so we can resume after encounter
      if (historyLensNavTargetRef.current) {
        const journeyData = {
          destination: { ...historyLensNavTargetRef.current },
          interruptedBy: 'npc' as const,
          entityName: npcOnTile.name
        };
        interruptedJourneyRef.current = journeyData;
        // Emit event so HistoryLensPanel can show continuation card after encounter
        eventBus.emit('historylens:journey_interrupted', journeyData);
      }
      clearQueuedMoves();
      clearHistoryLensNavigation();
      handleEncounter(npcOnTile);
      return;
    }

    // impassable terrain check with damage and narration
    const targetTile = mapData.tiles[newLogicalY][newLogicalX];
    
    if (!isTerrainPassable(targetTile.biome)) {
      // Stop movement
      setVelocity(prev => (prev.x !== 0 || prev.y !== 0) ? { x: 0, y: 0 } : prev);
      clearQueuedMoves();
      clearHistoryLensNavigation();
      
      // Get and display terrain block message
      const blockMessage = getTerrainBlockMessage(targetTile.biome);
      if (blockMessage) {
        // Add to game log
        addGameLogEntry(LogService.createSkillUseLog(
          'Movement',
          `Blocked: ${blockMessage}`,
          localArea || 'Unknown location',
          gameDate,
          formattedTime,
          currentTimeOfDay
        ));
        
        // Add to narration panel
        setNarrationHistory(prev => [...prev, {
          sender: 'narrator',
          text: blockMessage
        }]);
        
        // Play damage sound for impassable terrain (light damage for bumping into things)
        gameSounds.playDamageSound('light');
        emitHistoryLensSystem(`Movement blocked: ${blockMessage}`);
      }
      
      // Apply damage if applicable
      const terrainDamage = getTerrainDamage(targetTile.biome);
      if (terrainDamage && playerCharacter) {
        const newHealth = Math.max(0, playerCharacter.health - terrainDamage.damage);
        setPlayerCharacter(prev => prev ? { ...prev, health: newHealth } : null);
        
        // Play damage sound based on severity
        const severity = terrainDamage.damage >= 20 ? 'heavy' : 
                        terrainDamage.damage >= 10 ? 'medium' : 'light';
        gameSounds.playDamageSound(severity);
        
        // Show damage notification
        const damageMessage = terrainDamage.type === 'heat' ? 'The intense heat burns you!' :
                             terrainDamage.type === 'cold' ? 'The freezing cold damages you!' :
                             terrainDamage.type === 'drowning' ? 'You struggle to breathe!' :
                             'You take damage from the terrain!';
        
        showToast(damageMessage, 'error');
        
        // Add to game log
        addGameLogEntry(LogService.createSkillUseLog(
          'Movement',
          `${damageMessage} (-${terrainDamage.damage} health)`,
          localArea || 'Unknown location',
          gameDate,
          formattedTime
        ));
        
        // Check for death
        if (newHealth <= 0) {
          if (onDeath) {
            const terrainName = mapData?.tiles[controlledIconY]?.[controlledIconX]?.biome || 'harsh terrain';
            onDeath({
              type: 'terrain',
              terrain: terrainName,
              description: `Perished from the harsh ${terrainName}`
            });
          } else {
            // Fallback to alert if no handler provided
            alert(`Death feature to be implemented.\n\nYour character has perished from the harsh terrain.`);
          }
        }
      }
      
      return;
    }

    // Check for terrain-based disease transmission (wetlands, cities)
    if (playerCharacter) {
      const diseaseService = DiseaseService.getInstance();
      const terrainResult = diseaseService.checkTerrainTransmission(
        targetTile.biome,
        playerCharacter,
        gameDate.year
      );
      
      if (terrainResult.transmitted && terrainResult.disease) {
        // Show disease notification
        showToast(terrainResult.message || `You have contracted ${terrainResult.disease.name}!`, 'error');
        
        // Update player character with new disease
        setPlayerCharacter({ ...playerCharacter });
        
        // Add to game log
        addGameLogEntry(LogService.createSkillUseLog(
          'Movement',
          terrainResult.message || `Contracted ${terrainResult.disease.name}`,
          localArea || 'Unknown location',
          gameDate,
          formattedTime
        ));
        
        // Show disease modal if available
        if (typeof window !== 'undefined' && (window as any).showDiseaseModal) {
          (window as any).showDiseaseModal(terrainResult.disease);
        }
      }
    }

    // commit move and set next allowed move time (with disease penalty)
    nextMoveAllowed.current = currentTime + MOVE_ANIM_MS;

    // Advance game time by 5 minutes for each movement
    setGameTimeMinutes(prev => {
      const newMinutes = (prev + 5) % 60;
      if (newMinutes < prev) {
        // We wrapped around, increment the hour
        setGameTimeHours(prevHours => (prevHours + 1) % 24);
      }
      return newMinutes;
    });

    const movementDirection: 'north' | 'south' | 'east' | 'west' =
      dx > 0 ? 'east' : dx < 0 ? 'west' : dy > 0 ? 'south' : 'north';
    const shouldEmitHistoryLens =
      (moveCount + 1) % 5 === 0 &&
      (centralMode === 'historylens' || historyLensMoveActiveRef.current);

    if (playerMode === 'ship') {
      if ((targetTile.isLand || targetTile.hasBridge) && targetTile.biome !== BiomeType.ESTUARY) {
        setPlayerMode('onFoot');
        setShipDockX(controlledIconX);
        setShipDockY(controlledIconY);
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        gameSounds.playEmbarkSound(); // Disembark sound (same as embark but improved)
        showToast('Disembarked!');
        if (shouldEmitHistoryLens && mapData && playerCharacter) {
          eventBus.emit('historylens:append', {
            sender: 'system',
            text: describeDisembark({
              mapData,
              playerCharacter,
              playerMode: 'onFoot',
              playerX: newLogicalX,
              playerY: newLogicalY,
              localArea,
              currentZone,
              currentRegion: localArea
            })
          });
        }

        // Check if we have a post-disembark navigation target (ship-to-land navigation)
        if (postDisembarkTargetRef.current) {
          const target = postDisembarkTargetRef.current;
          postDisembarkTargetRef.current = null; // Clear it so we don't re-trigger

          // Small delay to let the disembark complete, then navigate on foot
          setTimeout(() => {
            const landPath = findHistoryLensPath(
              mapData,
              { x: newLogicalX, y: newLogicalY },
              { x: target.x, y: target.y },
              'onFoot',
              5000
            );
            if (landPath && landPath.length > 0) {
              historyLensNavTargetRef.current = target;
              historyLensPathRef.current = landPath;
              historyLensMoveActiveRef.current = true;
              historyLensMoveEndNotifiedRef.current = false;
              eventBus.emit('historylens:append', {
                sender: 'system',
                text: `Continuing toward ${target.label} on foot...`
              });
            }
          }, 100);
        }
      } else {
        // Ship movement on water - play splash sound
        gameSounds.playShipMovementSplash();
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        if (shouldEmitHistoryLens && mapData && playerCharacter) {
          eventBus.emit('historylens:append', {
            sender: 'narrator',
            text: describeMovement({
              mapData,
              playerCharacter,
              playerMode: 'ship',
              playerX: newLogicalX,
              playerY: newLogicalY,
              localArea,
              currentZone,
              currentRegion: localArea,
              direction: movementDirection
            })
          });
        }
      }
    } else {
      if (newLogicalX === shipDockX && newLogicalY === shipDockY) {
        // Remove the deployed vessel from the map when embarking
        setDeployedVessels(prev => prev.filter(v => !(v.x === shipDockX && v.y === shipDockY)));

        setPlayerMode('ship');
        setControlledIconX(shipDockX!);
        setControlledIconY(shipDockY!);
        setShipDockX(null);
        setShipDockY(null);
        gameSounds.playEmbarkSound(); // Embark sound (improved with higher pitched footsteps)
        showToast('Embarked!');
        if (shouldEmitHistoryLens && mapData && playerCharacter) {
          eventBus.emit('historylens:append', {
            sender: 'system',
            text: describeEmbark({
              mapData,
              playerCharacter,
              playerMode: 'ship',
              playerX: newLogicalX,
              playerY: newLogicalY,
              localArea,
              currentZone,
              currentRegion: localArea
            })
          });
        }
      } else if (targetTile.isLand || targetTile.hasBridge) {
        // Batch position updates to reduce re-renders
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);

        // Check for dropped items on this tile and auto-pickup
        const droppedItems = mapData?.terrainModifications?.droppedItems || [];
        const itemAtPosition = droppedItems.find(dropped => dropped.x === newLogicalX && dropped.y === newLogicalY);
        if (itemAtPosition && removeDroppedItem) {
          const pickedUpItem = removeDroppedItem(newLogicalX, newLogicalY);
          if (pickedUpItem && playerCharacter) {
            // Add to inventory
            setPlayerCharacter(prev => prev ? { ...prev, inventory: addItemToInventory(prev.inventory, pickedUpItem) } : null);

            // Check if item is rare or valuable for special toast
            const isRare = pickedUpItem.rarity === 'Rare' || pickedUpItem.rarity === 'Ultra-rare' || pickedUpItem.rarity === 'Unique';
            const isValuable = pickedUpItem.value >= 20;

            if (isRare || isValuable) {
              // Show special rare item toast
              setRareItemFoundToast(pickedUpItem);
              setTimeout(() => setRareItemFoundToast(null), 5000);
            } else {
              // Show normal notification
              setPanelNotificationMode('acquired');
              setPanelNotificationItem(pickedUpItem);
              setTimeout(() => setPanelNotificationItem(null), 2500);
            }

            // Play pickup sound
            gameSounds.playItemPickupSound('generic');
            // Add to game log
            addGameLogEntry(LogService.createItemAcquiredLog(pickedUpItem.name, 1, 'from the ground', gameDate, formattedTime));
          }
        }

        // Check if crossing a bridge and add narration
        if (targetTile.hasBridge) {
          // Play sand footstep sound for bridges (wooden creaking effect) - throttled
          if (moveCount % 3 === 0) {
            gameSounds.playFootstepSound('sand');
          }

          // Add bridge crossing narration (only once per bridge to avoid spam)
          if (setNarrationHistory) {
            const bridgeNarrationKey = `bridge-${targetTile.bridgeId}-${Math.floor(Date.now() / 10000)}`; // Cache for ~10 seconds
            if (!npcNarrationHistory.current.has(bridgeNarrationKey)) {
              npcNarrationHistory.current.add(bridgeNarrationKey);
              setNarrationHistory(prev => [...prev, {
                sender: 'narrator',
                text: 'Crossing bridge...'
              }]);
            }
          }
        }
        // Play footstep sound for special maps based on floor type - THROTTLED (every 3rd move)
        else if (isSpecialMap && moveCount % 3 === 0) {
          const floorType = targetTile.biome;
          switch(floorType) {
            case BiomeType.FLOOR_STONE:
              gameSounds.playFootstepSound('stone');
              break;
            case BiomeType.FLOOR_MARBLE:
              gameSounds.playFootstepSound('marble');
              break;
            case BiomeType.FLOOR_WOOD:
              gameSounds.playFootstepSound('wood');
              break;
            case BiomeType.FLOOR_CARPET:
              gameSounds.playFootstepSound('carpet');
              break;
            case BiomeType.FLOOR_TILE:
            case BiomeType.FLOOR_MOSAIC:
            case BiomeType.FLOOR_MOSAIC_CENTER:
            case BiomeType.FLOOR_MOSAIC_BORDER:
            case BiomeType.FLOOR_CHECKERED:
              gameSounds.playFootstepSound('tile');
              break;
            case BiomeType.FLOOR_PATTERN:
              gameSounds.playFootstepSound('tatami');
              break;
            case BiomeType.SAND:
            case BiomeType.BEACH:
              gameSounds.playFootstepSound('sand');
              break;
            default:
              // Default step sound for special maps (no specific floor type)
              gameSounds.playStepSound();
              break;
          }
        } else if (moveCount % 3 === 0) {
          // Standard map footstep sounds based on biome - THROTTLED
          const footstepMaterial = getFootstepMaterial(targetTile.biome);
          gameSounds.playFootstepSound(footstepMaterial);
        }

        if (shouldEmitHistoryLens && mapData && playerCharacter) {
          eventBus.emit('historylens:append', {
            sender: 'narrator',
            text: describeMovement({
              mapData,
              playerCharacter,
              playerMode: 'onFoot',
              playerX: newLogicalX,
              playerY: newLogicalY,
              localArea,
              currentZone,
              currentRegion: localArea,
              direction: movementDirection
            })
          });
        }
        
        // Check if player stepped on stairs - exit special map
        if (isSpecialMap && targetTile.biome === BiomeType.STAIRS_UP) {
          console.log('[useCoreLoops] Player stepped on stairs - exiting special map');
          showToast('Going back up...');
          setTimeout(() => exitSpecialMap(), 500); // Small delay for immersion
        }
      } else {
        // water while on foot: don't move
        clearQueuedMoves();
        clearHistoryLensNavigation();
        emitHistoryLensSystem('You cannot move onto open water on foot.');
        return;
      }
    }

    // disease proximity - only check every 50 moves to prevent stutter (was 20, too frequent)
    const shouldCheckDisease = moveCount % 50 === 0;
    if (playerCharacter && playerCharacter.health && shouldCheckDisease) {
      lastDiseaseCheckMove.current = moveCount;
      const diseaseService = DiseaseService.getInstance();
      const currentYear = gameDate.year;
      // Use squared distance to avoid expensive sqrt calculation
      const nearby = [...(npcs || []), ...(visibleAnimals || [])]
        .filter(e => {
          const distSq = (e.x - newLogicalX) * (e.x - newLogicalX) + (e.y - newLogicalY) * (e.y - newLogicalY);
          return distSq <= 2.25; // 1.5 * 1.5
        });

      for (const entity of nearby) {
        if (entity.health?.currentDiseases?.length) {
          const res = diseaseService.checkProximityTransmission(
            entity,
            playerCharacter,
            Math.hypot(entity.x - newLogicalX, entity.y - newLogicalY),
            currentYear
          );
          if (res.narrativeHints.length) {
            for (const hint of res.narrativeHints) {
              addGameLogEntry(LogService.createSkillUseLog(
                'Health',
                hint,
                localArea || 'Unknown location',
                gameDate,
                formattedTime
              ));
            }
          }
          if (res.transmitted) {
            setPlayerCharacter(prev => prev ? { ...prev, health: playerCharacter.health } : null);
            const transmitted = res.exposures
              .filter(ex => playerCharacter.health?.currentDiseases?.some(d => d.disease.id === ex.diseaseId))
              .map(ex => ex.diseaseId);
            if (transmitted.length) showToast('You may have been exposed to disease', 'warning');
          }
        }
      }
    }
  };

  moveLoopId.current = requestAnimationFrame(moveLoop);
  return () => { if (moveLoopId.current) cancelAnimationFrame(moveLoopId.current); };
}, [
  viewMode,
  mapData,
  isAnyModalOpen,
  playerMode,
  handleEncounter,
  handleInitiateCombat,
  showToast,
  addGameLogEntry,
  gameDate,
  formattedTime,
  localArea,
  handleMapTransition,
  pendingIconTransitionInfo,
  // Removed controlledIconX, controlledIconY, shipDockX, shipDockY to prevent recreating loop on every move
  // Also removed visibleAnimals and npcs as they change frequently
]);// Fixed dependencies to prevent loop recreation
};

export default useCoreLoops;
