/**
 * hooks/useCoreLoops.ts - Encapsulates the main game loops for time, AI, and ambiance.
 */
import { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useUI } from '../contexts/UIContext';
import { getDaysInMonth, parseDateString } from '../utils/dateUtils';
import { calculateAnimalUpdate } from '../services/animalAIService';
import { calculateNpcUpdate } from '../services/npcAIService';
import { spawnSingleAnimal } from '../generation/standardMap/features/animalGenerator';
import { checkReputationBasedApproach, generateLowReputationDialogue } from '../services/npcInitiatedEncounterService';
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
import { isTerrainPassable, getTerrainBlockMessage, getTerrainDamage } from '../constants/terrainPassability';

const useCoreLoops = () => {
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
  } = useUI();

  const moveLoopId = useRef<number | null>(null);
  const lastMoveTime = useRef<number>(0);
  const moveIntervalMs = 250; // Consistent movement speed - slightly slower but smoother
  const questsInitialized = useRef<boolean>(false);
  const lastDiseaseCheckMove = useRef<number>(0);
  const nextMoveAllowed = useRef<number>(0); // Track when next move is allowed

  // Repeat control for movement (time-based; replaces setTimeout gating)
  const repeatRef = useRef({ holdStart: 0, nextStepAt: 0, isRepeating: false });
  const INITIAL_REPEAT_DELAY_MS = 200; // delay after the very first step of a hold
  const CONTINUOUS_REPEAT_MS = 400; // cadence while key is held

  // Quest Initialization - Generate quests when map and player are ready
  useEffect(() => {
    if (!mapData || !playerCharacter || questsInitialized.current) return;
    
    // Don't initialize quests for special maps
    if (isSpecialMap) {
      console.log('[QuestInit] Skipping quest generation for special map');
      return;
    }

    const validStructures =
      mapData.terrainStructures?.filter((s) => ['ruins', 'palace', 'marketplace', 'urban', 'holy_site', 'farm'].includes(s.structureType)) ||
      [];

    if (validStructures.length === 0) {
      console.log('[QuestInit] No valid structures for quest generation');
      return;
    }

    const numQuests = Math.min(10, Math.max(1, Math.floor(validStructures.length / 3)));
    console.log(`[QuestInit] Generating ${numQuests} initial quests from ${validStructures.length} structures`);

    try {
      const culturalZone = mapLocationToCulture(currentZone, gameDate.year);
      const dateInfo = parseDateString(String(gameDate.year));

      const generatedQuests = questService.generateInitialQuests(
        'standard',
        mapData.terrainStructures || [],
        { x: controlledIconX || 50, y: controlledIconY || 50 },
        culturalZone,
        dateInfo.era,
        mapData
      );

      const currentQuestCount = questService.getActiveQuests().length;
      if (currentQuestCount < numQuests) {
        const additionalNeeded = numQuests - currentQuestCount;
        const shuffledStructures = [...validStructures].sort(() => Math.random() - 0.5);

        for (let i = 0; i < additionalNeeded && i < shuffledStructures.length; i++) {
          const structure = shuffledStructures[i];
          const simpleQuest = {
            id: `quest_explore_${structure.id}_${Date.now()}`,
            title: `Investigate the ${structure.structureType.replace('_', ' ')}`,
            description: `There's a ${structure.structureType.replace('_', ' ')} nearby that might be worth investigating.`,
            category: 'exploration' as const,
            objectives: [
              {
                id: 'obj_1',
                description: `Visit the ${structure.structureType.replace('_', ' ')}`,
                type: 'visit_location' as const,
                targetLocation: { x: structure.location[0], y: structure.location[1] },
                targetType: structure.structureType as any,
                completed: false,
              },
            ],
            currentObjectiveIndex: 0,
            rewards: [
              {
                type: 'reputation' as const,
                value: 5,
                description: 'Reputation +5',
              },
            ],
            startLocation: { x: controlledIconX || 50, y: controlledIconY || 50 },
            startTime: Date.now(),
            status: 'active' as const,
            isProceduralQuest: true,
          };
          questService.addQuest(simpleQuest);
        }
      }

      const finalQuestCount = questService.getActiveQuests().length;
      console.log(`[QuestInit] Successfully initialized ${finalQuestCount} quests`);
      questsInitialized.current = true;
    } catch (error) {
      console.error('[QuestInit] Failed to generate initial quests:', error);
    }
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
                    console.log(`[DISEASE] ${event}`);
                  });

                  result.recoveryEvents.forEach((event) => {
                    console.log(`[DISEASE RECOVERY] ${event}`);
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
                      console.log(`[DISEASE DEATH] Player has died from ${mostSevere.disease.name}!`);
                      // Use immediate alert without setTimeout to avoid memory leak
                      alert(`Death feature to be implemented.\n\nYour character has succumbed to ${mostSevere.disease.name}.`);
                    }
                  }

                  setPlayerCharacter({ ...playerCharacter });
                }

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

    const tickInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter) return;

      // Skip animal spawning for special and interior maps
      const isSpecialOrInteriorMap = mapData?.mapType === 'special' || viewMode === 'interior';
      
      if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null && !isSpecialOrInteriorMap) {
        setAnimals((prevAnimals) => {
          if (!prevAnimals) return [];
          const playerPos = { x: controlledIconX, y: controlledIconY };
          const updatedAnimals = prevAnimals
            .map((animal) => {
              if (Math.hypot(animal.x - playerPos.x, animal.y - playerPos.y) <= AI_UPDATE_RADIUS) {
                return { ...animal, ...calculateAnimalUpdate(animal, prevAnimals, playerPos, mapData, npcs) };
              }
              return animal;
            })
            .filter((animal) => animal.x >= 0 && animal.x < MAP_WIDTH_TILES && animal.y >= 0 && animal.y < MAP_HEIGHT_TILES);

          if (updatedAnimals.length < MIN_ANIMALS && Math.random() < 0.25) {
            const occupiedTiles = new Set(updatedAnimals.map((a) => `${a.x},${a.y}`));
            const culturalZone = mapLocationToCulture(currentZone, gameDate.year);
            const newAnimal = spawnSingleAnimal(mapData, animalSpawnNoise, occupiedTiles, culturalZone, mapData.localArea || 'Unknown');
            if (newAnimal) {
              updatedAnimals.push(newAnimal);
            }
          }
          return updatedAnimals;
        });
      }
    }, 2000);

    return () => clearInterval(tickInterval);
  }, [mapData, playerCharacter, controlledIconX, controlledIconY, viewMode, animalSpawnNoise, isAnyModalOpen, currentZone]); // Remove setAnimals to prevent recreation

  // NPC AI Tick
  useEffect(() => {
    const AI_UPDATE_RADIUS = 30;

    const tickInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter) return;

      if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null) {
        setNpcs((prevNpcs) => {
          let updatedNpcs = prevNpcs.map((npc) => {
            if (Math.hypot(npc.x - controlledIconX, npc.y - controlledIconY) <= AI_UPDATE_RADIUS) {
              return { ...npc, ...calculateNpcUpdate(npc, { x: controlledIconX, y: controlledIconY }, mapData, gameTimeHours) };
            }
            return npc;
          });
          
          // Check for reputation-based NPC approaches (only if reputation < 20)
          if (playerCharacter.mapReputation < 20) {
            const approachingNPCs = checkReputationBasedApproach(
              playerCharacter,
              updatedNpcs,
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
          
          return updatedNpcs;
        });
      }
    }, 3000);

    return () => clearInterval(tickInterval);
  }, [mapData, playerCharacter, controlledIconX, controlledIconY, viewMode, isAnyModalOpen, gameTimeHours]); // Remove setNpcs to prevent recreation

  // Disease Spreading Tick - runs every 10 seconds
  useEffect(() => {
    const SPREAD_RADIUS = 30; // Only check disease spread near player

    const diseaseInterval = setInterval(() => {
      if (isAnyModalOpen || !playerCharacter || viewMode !== 'standard') return;
      if (controlledIconX === null || controlledIconY === null) return;

      // Handle NPC-to-NPC and Animal-to-Animal spreading
      setNpcs((prevNpcs) => {
        const updatedNpcs = [...prevNpcs];

        for (let i = 0; i < updatedNpcs.length; i++) {
          const npc1 = updatedNpcs[i];

          if (Math.hypot(npc1.x - controlledIconX, npc1.y - controlledIconY) > SPREAD_RADIUS) continue;

          if (!npc1.health?.currentDiseases?.length) continue;

          const disease = npc1.health.currentDiseases[0];

          for (let j = 0; j < updatedNpcs.length; j++) {
            if (i === j) continue;
            const npc2 = updatedNpcs[j];

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
                updatedNpcs[j] = {
                  ...npc2,
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

        return updatedNpcs;
      });

      // Handle animal-to-animal and cross-species spreading
      setAnimals((prevAnimals) => {
        const updatedAnimals = [...prevAnimals];
        // Get current NPCs from state
        const currentNpcs = [...(npcs || [])];

        // Animal-to-animal spreading
        for (let i = 0; i < updatedAnimals.length; i++) {
          const animal1 = updatedAnimals[i];

          if (Math.hypot(animal1.x - controlledIconX, animal1.y - controlledIconY) > SPREAD_RADIUS) continue;

          if (!animal1.diseaseHealth?.currentDiseases?.length) continue;

          const disease = animal1.diseaseHealth.currentDiseases[0];

          for (let j = 0; j < updatedAnimals.length; j++) {
            if (i === j) continue;
            const animal2 = updatedAnimals[j];

            if (animal2.diseaseHealth?.currentDiseases?.length) continue;

            const distance = Math.hypot(animal1.x - animal2.x, animal1.y - animal2.y);
            if (distance <= 2) {
              const sameSpecies = animal1.speciesName === animal2.speciesName;
              let baseChance = distance <= 1 ? (sameSpecies ? 0.1 : 0.05) : sameSpecies ? 0.05 : 0.02;

              const virality = disease.disease.transmissionRate || 1.0;
              baseChance *= virality;

              if (Math.random() < baseChance) {
                updatedAnimals[j] = {
                  ...animal2,
                  diseaseHealth: {
                    currentDiseases: [
                      {
                        ...disease,
                        contractedDate: Date.now(),
                        stage: 'early',
                      },
                    ],
                    exposureHistory: [],
                    resistances: {},
                  },
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

          for (let i = 0; i < updatedAnimals.length; i++) {
            const animal = updatedAnimals[i];

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
                
                updatedAnimals[i] = {
                  ...animal,
                  diseaseHealth: {
                    currentDiseases: [
                      {
                        ...disease,
                        contractedDate: Date.now(),
                        stage: 'early',
                      },
                    ],
                    exposureHistory: [],
                    resistances: {},
                  },
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

        return updatedAnimals;
      });
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
    const hasHourChanged = gameTimeHours !== lastAmbianceUpdateHour;
    const shouldUpdateOnMove = moveCount > 0 && moveCount % 200 === 0; // Only update every 200 moves to prevent any stutter

    if (!shouldUpdateOnMove && !hasHourChanged) return;

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
      setAmbianceText(generateAmbianceText(ambianceContext));
      if (hasHourChanged) setLastAmbianceUpdateHour(gameTimeHours);
    } else if (viewMode !== 'interior' && hasHourChanged) {
      setAmbianceText('Exploring the unknown...');
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

      // Double-check to ensure government districts are never treated as regular buildings
      const isBuildingTile = currentTile.biome !== BiomeType.GOVERNMENT_DISTRICT && [
        BiomeType.PALACE,
        BiomeType.HOLY_SITE,
        BiomeType.HAMLET,
        BiomeType.LOW_DENSITY_CITY,
        BiomeType.DENSE_CITY,
        // GOVERNMENT_DISTRICT is explicitly excluded and handled separately above
      ].includes(currentTile.biome);

      if (currentTile.biome === BiomeType.FARMLAND) {
        setActionableTile({ type: 'farm', tile: currentTile });
      } else if (currentTile.biome === BiomeType.MARKETPLACE) {
        setActionableTile({ type: 'marketplace', tile: currentTile });
      } else if (currentTile.biome === BiomeType.RUINS) {
        setActionableTile({ type: 'ruin', tile: currentTile });
      } else if (currentTile.biome === BiomeType.CITY_CENTER) {
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

    const BORDER_THRESHOLD = 2;
    if (controlledIconX < BORDER_THRESHOLD) setContextualMessage(`You are near the western border.`);
    else if (controlledIconX >= MAP_WIDTH_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the eastern border.`);
    else if (controlledIconY < BORDER_THRESHOLD) setContextualMessage(`You are near the northern border.`);
    else if (controlledIconY >= MAP_HEIGHT_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the southern border.`);
    else setContextualMessage(null);
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
        if (isAnyModalOpen && !combatant) return;
        if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
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
  const MOVE_ANIM_MS = 250; // Match the movement interval for consistency

  const moveLoop = (currentTime: number) => {
    moveLoopId.current = requestAnimationFrame(moveLoop);

    // Check if we're allowed to move yet
    if (currentTime < nextMoveAllowed.current) return;

    // Basic guards - don't check isIconMoving here to avoid blocking
    if (
      viewMode !== 'standard' ||
      activeKeys.current.size === 0 ||
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

    // edge transitions (but not in special maps or when entering one)
    if (!isSpecialMap && !isEnteringSpecialMap) {
      if (newLogicalX < 0) { handleMapTransition('W', MAP_WIDTH_TILES - 1, controlledIconY); return; }
      if (newLogicalX >= MAP_WIDTH_TILES) { handleMapTransition('E', 0, controlledIconY); return; }
      if (newLogicalY < 0) { handleMapTransition('N', controlledIconX, MAP_HEIGHT_TILES - 1); return; }
      if (newLogicalY >= MAP_HEIGHT_TILES) { handleMapTransition('S', controlledIconX, 0); return; }
    }

    // animal interaction
    const animalOnTile = visibleAnimals?.find(a => a.x === newLogicalX && a.y === newLogicalY);
    if (animalOnTile) {
      const animalData = ANIMAL_DATA[animalOnTile.baseId];
      const isAquaticCollectable = playerMode === 'ship' && animalData?.habitat === 'aquatic';

      if (isAquaticCollectable) {
        const drop = animalData.drops.find(d => Math.random() < d.chance);
        if (drop) {
          const newItem = createItemInstance(drop.name);
          if (newItem) {
            setPlayerCharacter(prev => prev ? { ...prev, inventory: addItemToInventory(prev.inventory, newItem) } : null);
            setPanelNotificationItem(newItem);
            // Use a ref to track timeout for cleanup
            const notificationTimeout = setTimeout(() => setPanelNotificationItem(null), 2500);
            addGameLogEntry(LogService.createItemAcquiredLog(newItem.name, 1, 'from the water', gameDate, formattedTime));
            
            // Store timeout for potential cleanup (though this is short-lived)
            return () => clearTimeout(notificationTimeout);
          }
        }
        setAnimals(prev => prev.filter(a => a.id !== animalOnTile.id));

        // commit move and set next allowed move time
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        nextMoveAllowed.current = currentTime + MOVE_ANIM_MS;
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
        addGameLogEntry({
          id: `terrain-blocked-${Date.now()}`,
          message: blockMessage,
          type: 'warning',
          timestamp: formattedTime,
          gameDate
        });
        
        // Add to narration panel
        setNarrationHistory(prev => [...prev, {
          sender: 'narrator',
          text: blockMessage
        }]);
      }
      
      // Apply damage if applicable
      const terrainDamage = getTerrainDamage(targetTile.biome);
      if (terrainDamage && playerCharacter) {
        const newHealth = Math.max(0, playerCharacter.health - terrainDamage.damage);
        setPlayerCharacter(prev => prev ? { ...prev, health: newHealth } : null);
        
        // Show damage notification
        const damageMessage = terrainDamage.type === 'heat' ? 'The intense heat burns you!' :
                             terrainDamage.type === 'cold' ? 'The freezing cold damages you!' :
                             terrainDamage.type === 'drowning' ? 'You struggle to breathe!' :
                             'You take damage from the terrain!';
        
        showToast(damageMessage, 'error');
        
        // Add to game log
        addGameLogEntry({
          id: `terrain-damage-${Date.now()}`,
          message: `${damageMessage} (-${terrainDamage.damage} health)`,
          type: 'damage',
          timestamp: formattedTime,
          gameDate
        });
        
        // Check for death
        if (newHealth <= 0) {
          // Use immediate alert without setTimeout to avoid memory leak
          alert(`Death feature to be implemented.\n\nYour character has perished from the harsh terrain.`);
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
        addGameLogEntry({
          id: `disease-contracted-${Date.now()}`,
          message: terrainResult.message || `Contracted ${terrainResult.disease.name}`,
          type: 'disease',
          timestamp: formattedTime,
          gameDate
        });
        
        // Show disease modal if available
        if (typeof window !== 'undefined' && (window as any).showDiseaseModal) {
          (window as any).showDiseaseModal(terrainResult.disease);
        }
      }
    }

    // commit move and set next allowed move time
    nextMoveAllowed.current = currentTime + MOVE_ANIM_MS;

    if (playerMode === 'ship') {
      if (targetTile.isLand && targetTile.biome !== BiomeType.ESTUARY) {
        setPlayerMode('onFoot');
        setShipDockX(controlledIconX);
        setShipDockY(controlledIconY);
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
        showToast('Disembarked!');
      } else {
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
        showToast('Embarked!');
      } else if (targetTile.isLand) {
        setControlledIconX(newLogicalX);
        setControlledIconY(newLogicalY);
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
              addGameLogEntry({
                id: `disease-hint-${Date.now()}-${Math.random()}`,
                message: hint,
                type: 'observation',
                timestamp: formattedTime,
                gameDate
              });
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
