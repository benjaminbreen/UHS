/**
 * hooks/useCoreLoops.ts - Encapsulates the main game loops for time, AI, and ambiance.
 */
import { useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useUI } from '../contexts/UIContext';
import { getDaysInMonth, parseDateString, formatDateWithSeason, getSeasonFromDate } from '../utils/dateUtils';
import { getNextMapArea } from '../utils/geographyUtils';
import { calculateAnimalUpdate, calculateNpcUpdate } from '../services/npcAIService';
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
import { generateAmbianceText } from '../services/ambianceGenerator';
import { AmbianceContext, BiomeType, Item, PlayerContext, TerrainStructureType, TerrainStructure } from '../types';
import { mapLocationToCulture } from '../utils/mapUtils';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { LogService } from '../services/logService';
import DiseaseService from '../services/diseaseService';
import { questService } from '../services/questService';
import { questTriggerService } from '../services/questTriggerService';
import { isTerrainPassable, getTerrainBlockMessage, getTerrainDamage } from '../constants/terrainPassability';
import gameSounds from '../services/gameSoundsService';
import { getFootstepMaterial } from '../services/biomeFootstepService';
import { calculateDiseaseGameplayRestrictions, shouldPlayerDieFromDisease, checkDiseaseStageChanges } from '../services/diseaseProgressionService';
import { DiseaseProgressionEvent } from '../services/diseaseNotificationService';
import { Disease } from '../types/diseaseTypes';
import { NpcEntity } from '../types/npcTypes';

interface DeathInfo {
  type: 'disease' | 'starvation' | 'violence' | 'accident' | 'old_age' | 'combat' | 'terrain' | 'drowning' | 'exhaustion' | 'poison';
  disease?: any;
  description?: string;
  terrain?: string;
}

const useCoreLoops = (
  onDeath?: (deathInfo: DeathInfo) => void,
  onNpcDeath?: (npc: NpcEntity, disease: Disease) => void,
  onDiseaseProgression?: (events: DiseaseProgressionEvent[]) => void
) => {
  const {
    setGameTimeMinutes,
    gameTimeMinutes,
    setGameTimeHours,
    setGameDate,
    gameTimeHours,
    gameDate,
    lastAmbianceUpdateHour,
    setLastAmbianceUpdateHour,
    setAmbianceText,
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
    isSpecialMap,
    isEnteringSpecialMap,
    exitSpecialMap,
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
    setActiveMiningModal,
    setStructureModalTarget,
    setActiveGovernmentModal,
    inRuinRoguelike,
    inMiningRoguelike,
  } = useUI();

  const moveLoopId = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const moveIntervalMs = 250; // Consistent movement speed - slightly slower but smoother
  const questsInitialized = useRef<boolean>(false);
  const lastDiseaseCheckMove = useRef<number>(0);
  const nextMoveAllowed = useRef<number>(0); // Track when next move is allowed
  const npcNarrationHistory = useRef<Set<string>>(new Set()); // Track NPCs who have had narration generated
  const lastNarrationTime = useRef<number>(0); // Track last narration generation time

  // Repeat control for movement (time-based; replaces setTimeout gating)
  const repeatRef = useRef({ holdStart: 0, nextStepAt: 0, isRepeating: false });
  const INITIAL_REPEAT_DELAY_MS = 200; // delay after the very first step of a hold
  const CONTINUOUS_REPEAT_MS = 400; // cadence while key is held

  // Reset quest initialization when map changes
  useEffect(() => {
    questsInitialized.current = false;
    // console.log('[QuestInit] Reset questsInitialized flag for new map');
  }, [mapData]);
  
  // Update quest service context when game data changes
  useEffect(() => {
    if (!mapData || !playerCharacter || !currentZone) return;
    
    const culturalZone = mapLocationToCulture(currentZone, gameDate.year);
    const dateInfo = parseDateString(String(gameDate.year));
    const playerLocation = { 
      x: controlledIconX || 50, 
      y: controlledIconY || 50 
    };
    
    // Update quest service with current context
    questService.updateContext(culturalZone, dateInfo.era, playerLocation);
    
    // console.log('[QuestService] Context updated:', { zone: culturalZone, era: dateInfo.era, location: playerLocation });
  }, [mapData, currentZone, gameDate.year, controlledIconX, controlledIconY]);
  
  // Quest Initialization - Generate quests when map and player are ready
  useEffect(() => {
    if (!mapData || !playerCharacter || questsInitialized.current) return;
    
    // Always reset quest service for fresh game starts
    // console.log('[QuestInit] Resetting quest service for fresh game start');
    questService.resetQuestService();
    questTriggerService.reset(); // Reset quest trigger state for new game
    
    // Don't initialize quests for special maps
    if (isSpecialMap) {
      // console.log('[QuestInit] Skipping quest generation for special map');
      return;
    }

    // Defer quest generation by 1 second to improve initial load performance
    const questGenerationTimeout = setTimeout(async () => {
      try {
        const culturalZone = mapLocationToCulture(currentZone, gameDate.year);
        const dateInfo = parseDateString(String(gameDate.year));

        const playerStats = playerCharacter ? {
          health: playerCharacter.health || 50,
          reputation: playerCharacter.reputation || 10,
          wealth: playerCharacter.inventory?.filter(item => item.value).reduce((sum, item) => sum + (item.value || 0), 0) || 10,
          intelligence: playerCharacter.stats?.intelligence || 10,
          strength: playerCharacter.stats?.strength || 10
        } : undefined;
        
        const generatedQuests = await questService.generateInitialQuests(
          'standard',
          mapData.terrainStructures || [],
          { x: controlledIconX || 50, y: controlledIconY || 50 },
          culturalZone,
          dateInfo.era,
          mapData,
          playerStats
        );

        // DEPRECATED: This code was trying to add additional procedural quests
        // but numQuests and validStructures are undefined, causing runtime errors
        // The unified quest pipeline now handles all quest generation

        const finalQuestCount = questService.getActiveQuests().length;
        // console.log(`[QuestInit] Successfully initialized ${finalQuestCount} quests`);
        questsInitialized.current = true;
      } catch (error) {
        console.error('[QuestInit] Failed to generate initial quests:', error);
      }
    }, 1000);

    // Cleanup timeout if component unmounts
    return () => clearTimeout(questGenerationTimeout);
  }, [mapData, playerCharacter, controlledIconX, controlledIconY, currentZone, gameDate, isSpecialMap]);

  // Game Clock
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

                  if (result.mortalityRisk && playerCharacter.diseaseHealth.currentDiseases.length > 0) {
                    const mostSevere = playerCharacter.diseaseHealth.currentDiseases.reduce((worst: any, current: any) => {
                      const currentMortality = current.disease.mortalityRate * current.severity;
                      const worstMortality = worst.disease.mortalityRate * worst.severity;
                      return currentMortality > worstMortality ? current : worst;
                    });

                    const deathChance = mostSevere.disease.mortalityRate * mostSevere.severity;

                    if (Math.random() < deathChance) {
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

                // Add day passing log entry
                const newDate = { day, month, year };
                const currentSeason = getSeasonFromDate(newDate);
                addGameLogEntry(LogService.createMapEntryLog(
                  'time',
                  `A new day begins: ${formatDateWithSeason(newDate, currentSeason)}`,
                  newDate,
                  '00:00'
                ));

                return { day, month, year };
              });
            }
            return newHours;
          });
        }
        return newMinutes;
      });
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [isAnyModalOpen]); // Remove playerCharacter to prevent frequent recreations

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
    // Reduce animal AI update frequency on Safari
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const ANIMAL_TICK_INTERVAL = isSafari ? 3000 : 1500; // Safari: 3s, Others: 1.5s

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
              const update = calculateAnimalUpdate(animal, draft, playerPos, mapData, npcs);
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
    // Reduce update frequency on Safari for better performance
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const TICK_INTERVAL = isSafari ? 2000 : 1000; // Safari: 2s, Others: 1s

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
            // Hash NPC ID to a bucket (0-3) for consistent assignment
            const npcBucket = npc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % UPDATE_BUCKETS;

            // Only update NPCs in the current bucket
            if (npcBucket !== currentBucket) return;

            updateCount++;

            // Only update NPCs within range
            if (Math.hypot(npc.x - controlledIconX, npc.y - controlledIconY) <= AI_UPDATE_RADIUS) {
              // Don't pass the draft directly - it's a revocable proxy
              // Pass undefined instead since calculateNpcUpdate can handle it
              const updates = calculateNpcUpdate(npc, { x: controlledIconX, y: controlledIconY }, mapData, gameTimeHours, undefined);

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
              
              // Generate hostile dialogue asynchronously
              generateLowReputationDialogue(closestNPC, playerCharacter, mapData).then(dialogue => {
                // Add to narration history
                setNarrationHistory(prev => [...prev, {
                  sender: 'narrator',
                  text: `${closestNPC.name} approaches you with a hostile expression: "${dialogue}"`
                }]);
              }).catch(err => {
                console.error('Failed to generate low reputation dialogue:', err);
                // Fallback message
                setNarrationHistory(prev => [...prev, {
                  sender: 'narrator',
                  text: `${closestNPC.name} approaches you with a hostile expression: "You're not welcome here. Leave!"`
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
                const currentTime = Date.now();
                const canGenerateNarration = !npcNarrationHistory.current.has(approach.npcId) && 
                                           currentTime - lastNarrationTime.current > 60000; // 1 minute throttle
                
                // Show immediate toast notification
                const approachIcon = approach.isHostile ? '⚠️' : '💬';
                const toastType = approach.isHostile ? 'error' : 'info';
                showToast(`${approachIcon} ${approachingNPC.name} approaches`, toastType);
                
                if (canGenerateNarration) {
                  // Generate rich LLM narration (once per NPC, max 1 per minute)
                  generateNPCApproachNarration(
                    approachingNPC,
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
                    
                    console.log(`[NPCNarration] Generated for ${approachingNPC.name}: ${narration}`);
                  }).catch(err => {
                    console.error('Failed to generate approach narration:', err);
                    // Fallback to basic narration
                    setNarrationHistory(prev => [...prev, {
                      sender: 'narrator', 
                      text: `${approachingNPC.name} approaches you with ${approach.isHostile ? 'hostile' : 'curious'} intent.`
                    }]);
                  });
                } else {
                  // Basic fallback for throttled cases
                  setNarrationHistory(prev => [...prev, {
                    sender: 'narrator',
                    text: `${approachingNPC.name} draws closer to you.`
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

          for (let j = 0; j < draft.length; j++) {
            if (i === j) continue;
            const npc2 = draft[j];

            if (npc2.health?.currentDiseases?.length) continue;

            const distance = Math.hypot(npc1.x - npc2.x, npc1.y - npc2.y);
            if (distance <= 2) {
              let baseChance = distance <= 1 ? 0.1 : 0.05;

              const virality = disease.disease.transmissionRate || 1.0;
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

  // Ambiance Refresh
  useEffect(() => {
    // Update every 6 hours (4 times per day: 0, 6, 12, 18)
    const shouldUpdateByTime = gameTimeHours % 6 === 0 && gameTimeHours !== lastAmbianceUpdateHour;
    const shouldUpdateOnMove = moveCount > 0 && moveCount % 500 === 0; // Only update every 500 moves to prevent any stutter

    if (!shouldUpdateOnMove && !shouldUpdateByTime) return;

    let contextTile: AmbianceContext['currentTile'] | null = null;
    let interiorDataForAmbiance: AmbianceContext['interiorMapData'] | undefined = undefined;
    let interiorPosForAmbiance: AmbianceContext['interiorPlayerPos'] | undefined = undefined;

    if (viewMode === 'interior' && interiorViewState && interiorMapPlayerPos) {
      contextTile = mapData?.tiles[0][0] ?? null;
      interiorDataForAmbiance = interiorViewState.maps.get(interiorViewState.currentFloor);
      interiorPosForAmbiance = interiorMapPlayerPos;
    } else if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null) {
      contextTile = mapData.tiles[controlledIconY]?.[controlledIconX];
    }

    if (contextTile) {
      const dateInfo = parseDateString(String(gameDate.year));
      const ambianceContext: AmbianceContext = {
        currentTile: contextTile,
        neighboringTiles: [],
        mapArchetype: currentMapArchetype,
        climate: currentMapClimate,
        timeOfDay: currentTimeOfDay,
        historicalEra: dateInfo.era,
        century: dateInfo.century,
        decade: dateInfo.decade,
        locationString: currentZone,
        mapSeed: currentMapSeed,
        gameHour: gameTimeHours,
        visibleLandDirection: null,
        interiorMapData: interiorDataForAmbiance,
        interiorPlayerPos: interiorPosForAmbiance,
      };
      setAmbianceText(''); // Ambiance system deprecated - no longer generating text
      if (shouldUpdateByTime) setLastAmbianceUpdateHour(gameTimeHours);
    } else if (viewMode !== 'interior' && shouldUpdateByTime) {
      setAmbianceText('');
    }
  }, [
    viewMode,
    mapData,
    interiorViewState,
    controlledIconX,
    controlledIconY,
    interiorMapPlayerPos,
    gameTimeHours,
    lastAmbianceUpdateHour,
    currentMapArchetype,
    currentMapClimate,
    currentTimeOfDay,
    gameDate,
    currentZone,
    currentMapSeed,
    moveCount,
    setAmbianceText,
    setLastAmbianceUpdateHour,
  ]);

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

 // Movement loop — simplified and consistent
useEffect(() => {
  const BASE_MOVE_ANIM_MS = 250; // Base movement interval
  // Reduce animation frequency on Safari for better performance
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  let frameSkipCounter = 0;

  const moveLoop = (currentTime: number) => {
    // Skip frames on Safari to reduce load (run at 30fps instead of 60fps)
    if (isSafari) {
      frameSkipCounter++;
      if (frameSkipCounter % 2 !== 0) {
        moveLoopId.current = requestAnimationFrame(moveLoop);
        return;
      }
    }

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

    // Basic guards - don't check isIconMoving here to avoid blocking
    if (
      viewMode !== 'standard' ||
      activeKeys.current.size === 0 ||
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

    // direction from keys
    let dx = 0, dy = 0;
    if (activeKeys.current.has('ArrowUp')) dy -= 1;
    if (activeKeys.current.has('ArrowDown')) dy += 1;
    if (activeKeys.current.has('ArrowLeft')) dx -= 1;
    if (activeKeys.current.has('ArrowRight')) dx += 1;
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
          exitSpecialMap();
          return;
        }
      } else {
        // Normal map edge transitions
        if (newLogicalX < 0) {
          // Get destination for proper logging
          const nextMapResult = getNextMapArea(localArea, 'W');
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
          handleMapTransition('W', MAP_WIDTH_TILES - 1, controlledIconY);
          return;
        }
        if (newLogicalX >= MAP_WIDTH_TILES) {
          // Get destination for proper logging
          const nextMapResult = getNextMapArea(localArea, 'E');
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
          handleMapTransition('E', 0, controlledIconY);
          return;
        }
        if (newLogicalY < 0) {
          // Get destination for proper logging
          const nextMapResult = getNextMapArea(localArea, 'N');
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
          handleMapTransition('N', controlledIconX, MAP_HEIGHT_TILES - 1);
          return;
        }
        if (newLogicalY >= MAP_HEIGHT_TILES) {
          // Get destination for proper logging
          const nextMapResult = getNextMapArea(localArea, 'S');
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
          handleMapTransition('S', controlledIconX, 0);
          return;
        }
      }
    }

    // animal interaction
    const animalOnTile = visibleAnimals?.find(a => a.x === newLogicalX && a.y === newLogicalY);
    if (animalOnTile) {
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
            addGameLogEntry(LogService.createItemAcquiredLog(newItem.name, 1, 'from the water', gameDate, formattedTime));
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

        // Log map entry for every 5th movement to avoid spam
        if (moveCount % 5 === 0) {
          addGameLogEntry(LogService.createMapEntryLog(
            `${newLogicalX > controlledIconX ? 'east' : newLogicalX < controlledIconX ? 'west' : newLogicalY > controlledIconY ? 'south' : 'north'}`,
            localArea || 'Unknown location',
            gameDate,
            formattedTime
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
    if (npcOnTile) { handleEncounter(npcOnTile); return; }

    // impassable terrain check with damage and narration
    const targetTile = mapData.tiles[newLogicalY][newLogicalX];
    
    if (!isTerrainPassable(targetTile.biome)) {
      // Stop movement
      setVelocity(prev => (prev.x !== 0 || prev.y !== 0) ? { x: 0, y: 0 } : prev);
      
      // Get and display terrain block message
      const blockMessage = getTerrainBlockMessage(targetTile.biome);
      if (blockMessage) {
        // Add to game log
        addGameLogEntry(LogService.createSkillUseLog(
          'Movement',
          `Blocked: ${blockMessage}`,
          localArea || 'Unknown location',
          gameDate,
          formattedTime
        ));
        
        // Add to narration panel
        setNarrationHistory(prev => [...prev, {
          sender: 'narrator',
          text: blockMessage
        }]);
        
        // Play damage sound for impassable terrain (light damage for bumping into things)
        gameSounds.playDamageSound('light');
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

    if (playerMode === 'ship') {
      if (targetTile.isLand && targetTile.biome !== BiomeType.ESTUARY) {
        setPlayerMode('onFoot');
        setShipDockX(controlledIconX);
        setShipDockY(controlledIconY);
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        gameSounds.playEmbarkSound(); // Disembark sound (same as embark but improved)
        showToast('Disembarked!');
      } else {
        // Ship movement on water - play splash sound
        gameSounds.playShipMovementSplash();
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
      }
    } else {
      if (newLogicalX === shipDockX && newLogicalY === shipDockY) {
        setPlayerMode('ship');
        setControlledIconX(shipDockX!);
        setControlledIconY(shipDockY!);
        setShipDockX(null);
        setShipDockY(null);
        gameSounds.playEmbarkSound(); // Embark sound (improved with higher pitched footsteps)
        showToast('Embarked!');
      } else if (targetTile.isLand) {
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        
        // Play footstep sound for special maps based on floor type
        if (isSpecialMap) {
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
        } else {
          // Standard map footstep sounds based on biome
          const footstepMaterial = getFootstepMaterial(targetTile.biome);
          gameSounds.playFootstepSound(footstepMaterial);
        }
        
        // Check if player stepped on stairs - exit special map
        if (isSpecialMap && targetTile.biome === BiomeType.STAIRS_UP) {
          console.log('[useCoreLoops] Player stepped on stairs - exiting special map');
          showToast('Going back up...');
          setTimeout(() => exitSpecialMap(), 500); // Small delay for immersion
        }
      } else {
        // water while on foot: don't move
        return;
      }
    }

    // disease proximity - only check every 20 moves OR once per minute to prevent stutter
    const shouldCheckDisease = moveCount % 20 === 0 || (gameTimeMinutes % 1 === 0 && moveCount === lastDiseaseCheckMove.current + 1);
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
