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
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ANIMAL_DATA, ITEM_DEFINITIONS } from '../constants/index';
import { generateAmbianceText } from '../services/ambianceGenerator';
import { AmbianceContext, BiomeType, Item, PlayerContext, TerrainStructureType } from '../types';
import { mapLocationToCulture } from '../utils/mapUtils';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { LogService } from '../services/logService';


const useCoreLoops = () => {
    const { 
        setGameTimeMinutes, setGameTimeHours, setGameDate, gameTimeHours, gameDate,
        lastAmbianceUpdateHour, setLastAmbianceUpdateHour,
        setAmbianceText,
        currentTimeOfDay,
        moveCount, setMoveCount,
        currentZone,
        contextualMessage,
        setContextualMessage,
        actionableTile,
        setActionableTile,
        addGameLogEntry,
        formattedTime,
    } = useGame();
    
    const { 
        playerCharacter, controlledIconX, controlledIconY, 
        isIconMoving, activeKeys,
        playerMode, shipDockX, shipDockY, pendingIconTransitionInfo,
        setPlayerMode, setShipDockX, setShipDockY, setControlledIconX, setControlledIconY,
        setIconRotation, setVelocity, setPlayerCharacter,
        onPlayerMove, viewMode, interiorViewState, interiorMapPlayerPos, handleExitInteriorView,
    } = usePlayer();

    const { 
        mapData, setAnimals, animalSpawnNoise, npcs, setNpcs, localArea,
        visibleAnimals,
        currentMapArchetype, currentMapClimate, currentMapSeed,
        handleMapTransition,
        updateStructureData,
    } = useMap();

    const { 
        isAnyModalOpen, combatant,
        handleEncounter, handleInitiateCombat,
        showToast,
        closeAllModals, togglePinnedTooltip, setPanelNotificationItem, setActiveMiningModal
    } = useUI();

    const moveLoopId = useRef<number | null>(null);
    const lastMoveTime = useRef<number>(0);
    const moveIntervalMs = 80;

    // Game Clock
    useEffect(() => {
        const clockInterval = setInterval(() => {
            if (isAnyModalOpen) return;
            setGameTimeMinutes(prevMinutes => {
                const newMinutes = (prevMinutes + 1) % 60;
                if (newMinutes === 0) {
                    setGameTimeHours(prevHours => {
                        const newHours = (prevHours + 1) % 24;
                        if (newHours === 0) {
                            setGameDate(prevDate => {
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
    }, [setGameTimeMinutes, setGameTimeHours, setGameDate, isAnyModalOpen]);

    // Animal AI Tick
    useEffect(() => {
        const MIN_ANIMALS = 5;
        const AI_UPDATE_RADIUS = 30;

        const tickInterval = setInterval(() => {
            if (isAnyModalOpen || !playerCharacter) return;

            if (viewMode === 'standard' && mapData && controlledIconX !== null && controlledIconY !== null) {
                setAnimals(prevAnimals => {
                    if (!prevAnimals) return [];
                    const playerPos = { x: controlledIconX, y: controlledIconY };
                    const updatedAnimals = prevAnimals.map(animal => {
                        if (Math.hypot(animal.x - playerPos.x, animal.y - playerPos.y) <= AI_UPDATE_RADIUS) {
                            return { ...animal, ...calculateAnimalUpdate(animal, prevAnimals, playerPos, mapData) };
                        }
                        return animal;
                    }).filter(animal => animal.x >= 0 && animal.x < MAP_WIDTH_TILES && animal.y >= 0 && animal.y < MAP_HEIGHT_TILES);
                    
                    if (updatedAnimals.length < MIN_ANIMALS && Math.random() < 0.25) { 
                        const occupiedTiles = new Set(updatedAnimals.map(a => `${a.x},${a.y}`));
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
    }, [mapData, playerCharacter, controlledIconX, controlledIconY, viewMode, animalSpawnNoise, isAnyModalOpen, setAnimals, currentZone, gameDate]);

    // NPC AI Tick
    useEffect(() => {
        const AI_UPDATE_RADIUS = 30;

        const tickInterval = setInterval(() => {
            if (isAnyModalOpen || !playerCharacter) return;
            
            if (viewMode === 'standard' && mapData && npcs.length > 0 && controlledIconX !== null && controlledIconY !== null) {
                setNpcs(prevNpcs => {
                    return prevNpcs.map(npc => {
                        if (Math.hypot(npc.x - controlledIconX, npc.y - controlledIconY) <= AI_UPDATE_RADIUS) {
                           return { ...npc, ...calculateNpcUpdate(npc, { x: controlledIconX, y: controlledIconY }, mapData, gameTimeHours) };
                        }
                        return npc;
                    });
                });
            }
        }, 3000);

        return () => clearInterval(tickInterval);
    }, [mapData, npcs, playerCharacter, controlledIconX, controlledIconY, viewMode, isAnyModalOpen, setNpcs, gameTimeHours]);

     // Economy Tick (Taxation)
    useEffect(() => {
        if (!mapData?.terrainStructures || isAnyModalOpen) return;

        const controllingStructures = mapData.terrainStructures.filter(s => s.structureType === 'fortress' || s.structureType === 'palace');
        if (controllingStructures.length === 0) return;

        const productionStructures = mapData.terrainStructures.filter(s => 
            s.economicRole === 'extraction' || s.economicRole === 'processing'
        );

        productionStructures.forEach(prodStruct => {
            if (prodStruct.state !== 'active' || !prodStruct.outputGoods || prodStruct.outputGoods.length === 0) return;
            
            let closestController: { id: string, dist: number } | null = null;
            controllingStructures.forEach(conStruct => {
                const dist = Math.hypot(prodStruct.location[0] - conStruct.location[0], prodStruct.location[1] - conStruct.location[1]);
                if (!closestController || dist < closestController.dist) {
                    closestController = { id: conStruct.id, dist: dist };
                }
            });

            if (closestController) {
                const controller = controllingStructures.find(s => s.id === closestController!.id);
                if (controller) {
                    const taxedGoodId = prodStruct.outputGoods[0]; // Simple: tax the first output good
                    const taxAmount = 1; // Simple: 1 unit per day
                    
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
        const shouldUpdateOnMove = moveCount > 0 && moveCount % 10 === 0;

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
                currentTile: contextTile, neighboringTiles: [], mapArchetype: currentMapArchetype,
                climate: currentMapClimate, timeOfDay: currentTimeOfDay, historicalEra: dateInfo.era, 
                century: dateInfo.century, decade: dateInfo.decade, locationString: currentZone, 
                mapSeed: currentMapSeed, gameHour: gameTimeHours, visibleLandDirection: null,
                interiorMapData: interiorDataForAmbiance, interiorPlayerPos: interiorPosForAmbiance,
            };
            setAmbianceText(generateAmbianceText(ambianceContext));
            if (hasHourChanged) setLastAmbianceUpdateHour(gameTimeHours);
        } else if (viewMode !== 'interior' && hasHourChanged) {
            setAmbianceText("Exploring the unknown...");
        }
    }, [viewMode, mapData, interiorViewState, controlledIconX, controlledIconY, interiorMapPlayerPos, gameTimeHours, lastAmbianceUpdateHour, currentMapArchetype, currentMapClimate, currentTimeOfDay, gameDate, currentZone, currentMapSeed, moveCount, setAmbianceText, setLastAmbianceUpdateHour]);

     // Contextual Messages & Actionable Tiles
    useEffect(() => {
        if (isIconMoving.current || viewMode !== 'standard' || controlledIconX === null || controlledIconY === null || !mapData) {
            if (contextualMessage) setContextualMessage(null);
            if (actionableTile) setActionableTile(null);
            return;
        }

        const currentTile = mapData.tiles[controlledIconY][controlledIconX];
        
        // Actionable Tile Logic
        const structureOnTile = mapData.terrainStructures?.find(s => s.location[0] === currentTile.x && s.location[1] === currentTile.y);
        
        if (structureOnTile) {
            const structureType: TerrainStructureType = structureOnTile.structureType;
            if (structureType === 'mining_colony') {
                setActionableTile({ type: 'mine', tile: currentTile, structure: structureOnTile });
                return;
            }
        }
        
        const isBuildingTile = [BiomeType.PALACE, BiomeType.RUINS, BiomeType.HOLY_SITE, BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.GOVERNMENT_DISTRICT].includes(currentTile.biome);
      
        if (currentTile.biome === BiomeType.FARMLAND) {
          setActionableTile({ type: 'farm', tile: currentTile });
        } else if (currentTile.biome === BiomeType.MARKETPLACE) {
          setActionableTile({ type: 'marketplace', tile: currentTile });
        } else if (currentTile.biome === BiomeType.CITY_CENTER) {
          setActionableTile({ type: 'city', tile: currentTile });
        } else if (isBuildingTile) {
          setActionableTile({ type: 'building', tile: currentTile });
        } else {
          setActionableTile(null);
        }

        // Contextual Message Logic (Borders, nearby entities)
        const nearbyAnimal = visibleAnimals.find(a => Math.hypot(a.x - controlledIconX, a.y - controlledIconY) <= 1.5);
        if(nearbyAnimal) {
            setContextualMessage(`A ${nearbyAnimal.speciesName} is nearby.`);
            return;
        }
        const nearbyNpc = npcs.find(n => Math.hypot(n.x - controlledIconX, n.y - controlledIconY) <= 1.5);
        if(nearbyNpc) {
            setContextualMessage(`${nearbyNpc.name} is nearby.`);
            return;
        }

        const BORDER_THRESHOLD = 2;
        if (controlledIconX < BORDER_THRESHOLD) setContextualMessage(`You are near the western border.`);
        else if (controlledIconX >= MAP_WIDTH_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the eastern border.`);
        else if (controlledIconY < BORDER_THRESHOLD) setContextualMessage(`You are near the northern border.`);
        else if (controlledIconY >= MAP_HEIGHT_TILES - BORDER_THRESHOLD) setContextualMessage(`You are near the southern border.`);
        else setContextualMessage(null);
        
    }, [controlledIconX, controlledIconY, viewMode, visibleAnimals, npcs, mapData, isIconMoving, setActionableTile, setContextualMessage, actionableTile, contextualMessage]);


    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isAnyModalOpen) { e.preventDefault(); closeAllModals(); return; }
                if (viewMode === 'interior') { e.preventDefault(); handleExitInteriorView(); return; }
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (isAnyModalOpen && !combatant) return;
                if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
                e.preventDefault();
                if (viewMode === 'standard') {
                    activeKeys.current.add(e.key);
                } else if (viewMode === 'interior' && interiorMapPlayerPos) {
                    let newX = interiorMapPlayerPos.x; let newY = interiorMapPlayerPos.y;
                    if (e.key === 'ArrowUp') newY -= 1; else if (e.key === 'ArrowDown') newY += 1;
                    else if (e.key === 'ArrowLeft') newX -= 1; else if (e.key === 'ArrowRight') newX += 1;
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
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [viewMode, handleExitInteriorView, interiorMapPlayerPos, onPlayerMove, isAnyModalOpen, combatant, closeAllModals, togglePinnedTooltip]);

    // Movement loop
    useEffect(() => {
        const moveLoop = (currentTime: number) => {
            moveLoopId.current = requestAnimationFrame(moveLoop);
            const elapsed = currentTime - lastMoveTime.current;
            if (elapsed < moveIntervalMs) return;
            lastMoveTime.current = currentTime - (elapsed % moveIntervalMs);
            if (viewMode !== 'standard' || isIconMoving.current || activeKeys.current.size === 0 || !mapData || controlledIconX === null || controlledIconY === null || isAnyModalOpen || pendingIconTransitionInfo) {
                setVelocity({ x: 0, y: 0 });
                return;
            }
            setMoveCount(prev => prev + 1);
            let dx = 0; let dy = 0;
            if (activeKeys.current.has('ArrowUp')) dy -= 1; if (activeKeys.current.has('ArrowDown')) dy += 1;
            if (activeKeys.current.has('ArrowLeft')) dx -= 1; if (activeKeys.current.has('ArrowRight')) dx += 1;
            setVelocity({ x: dx, y: dy });
            if (dx === 0 && dy === 0) return;
            const newRotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            setIconRotation(newRotation);
            let newLogicalX = controlledIconX + dx; let newLogicalY = controlledIconY + dy;

            if (newLogicalX < 0) { handleMapTransition('W', MAP_WIDTH_TILES - 1, controlledIconY); return; } 
            else if (newLogicalX >= MAP_WIDTH_TILES) { handleMapTransition('E', 0, controlledIconY); return; } 
            else if (newLogicalY < 0) { handleMapTransition('N', controlledIconX, MAP_HEIGHT_TILES - 1); return; } 
            else if (newLogicalY >= MAP_HEIGHT_TILES) { handleMapTransition('S', controlledIconX, 0); return; }
            
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
                            setTimeout(() => setPanelNotificationItem(null), 2500);
                            addGameLogEntry(LogService.createItemAcquiredLog(newItem.name, 1, `from the water`, gameDate, formattedTime));
                        }
                    }
                    setAnimals(prev => prev.filter(a => a.id !== animalOnTile.id));
                    setControlledIconX(newLogicalX);
                    setControlledIconY(newLogicalY);
                    isIconMoving.current = true;
                } else {
                    if (animalOnTile.type === 'Predator') handleInitiateCombat(animalOnTile); else handleEncounter(animalOnTile);
                } return;
            }
            const npcOnTile = npcs?.find(n => n.x === newLogicalX && n.y === newLogicalY);
            if (npcOnTile) { handleEncounter(npcOnTile); return; }
            
            const targetTile = mapData.tiles[newLogicalY][newLogicalX];
            if (targetTile.biome === BiomeType.ACTIVE_LAVA) { isIconMoving.current = false; return; }
            
            isIconMoving.current = true;
            if (playerMode === 'ship') {
                if (targetTile.isLand && targetTile.biome !== BiomeType.ESTUARY) {
                    setPlayerMode('onFoot'); setShipDockX(controlledIconX); setShipDockY(controlledIconY);
                    setControlledIconX(newLogicalX); setControlledIconY(newLogicalY); showToast("Disembarked!");
                } else { setControlledIconX(newLogicalX); setControlledIconY(newLogicalY); }
            } else {
                if (newLogicalX === shipDockX && newLogicalY === shipDockY) {
                    setPlayerMode('ship'); setControlledIconX(shipDockX); setControlledIconY(shipDockY);
                    setShipDockX(null); setShipDockY(null); showToast("Embarked!");
                } else if (targetTile.isLand) { setControlledIconX(newLogicalX); setControlledIconY(newLogicalY); } 
                else { isIconMoving.current = false; }
            }
        };
        moveLoopId.current = requestAnimationFrame(moveLoop);
        return () => { if (moveLoopId.current) cancelAnimationFrame(moveLoopId.current); };
    }, [viewMode, mapData, controlledIconX, controlledIconY, isAnyModalOpen, playerMode, shipDockX, shipDockY, handleEncounter, handleInitiateCombat, showToast, addGameLogEntry, gameDate, formattedTime, localArea, handleMapTransition, activeKeys, isIconMoving, pendingIconTransitionInfo, setControlledIconX, setControlledIconY, setIconRotation, setMoveCount, setPlayerMode, setShipDockX, setShipDockY, setVelocity, visibleAnimals, npcs, setAnimals, setPlayerCharacter, setPanelNotificationItem]);

};

export default useCoreLoops;