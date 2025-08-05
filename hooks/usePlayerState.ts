/**
 * hooks/usePlayerState.ts - Manages all player character state.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
    PlayerCharacter, Item, EquipmentSlot, GameDate, ViewMode, InteriorViewState, 
    Point, EdgeTileInfo, BiomeType, NpcEntity, isNpc, isAnimal, InteriorMapData, TerrainStructure, Tile, MapData
} from '../types';
import { generateCharacter } from '../services/characterGenerator';
import { enhanceCharacterProfile } from '../services/llmService';
import { addItemToInventory, createItemInstance } from '../utils/inventoryUtils';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants/index';
import { generateInteriorMap } from '../generation/interiorMap';
import { getProceduralItemStats } from '../services/combatService';


interface usePlayerStateProps {
    gameDate: GameDate;
    currentZone: string;
    currentRegion: string;
}

export const usePlayerState = (props: usePlayerStateProps) => {
    const { gameDate, currentZone, currentRegion } = props;
    
    // Player State
    const [playerCharacter, setPlayerCharacter] = useState<PlayerCharacter | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    
    // Player Position State
    const [controlledIconX, setControlledIconX] = useState<number | null>(null);
    const [controlledIconY, setControlledIconY] = useState<number | null>(null);
    const [playerMode, setPlayerMode] = useState<'ship' | 'onFoot'>('ship');
    const [shipDockX, setShipDockX] = useState<number | null>(null);
    const [shipDockY, setShipDockY] = useState<number | null>(null);
    const [pendingIconTransitionInfo, setPendingIconTransitionInfo] = useState<any | null>(null);
    const [lastExitingEdgeData, setLastExitingEdgeData] = useState<EdgeTileInfo[] | null>(null);
    const [iconRotation, setIconRotation] = useState(0);
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const isIconMoving = useRef<boolean>(false);
    const activeKeys = useRef<Set<string>>(new Set());

    // Interior View State
    const [viewMode, setViewMode] = useState<ViewMode>('standard');
    const [interiorViewState, setInteriorViewState] = useState<InteriorViewState | null>(null);
    const [interiorMapPlayerPos, setInteriorMapPlayerPos] = useState<Point | null>(null);
    
    const handleCharacterGeneration = useCallback(async (useLlm: boolean) => {
        setIsEnhancing(true);
        const newChar = generateCharacter({ date: String(gameDate.year), location: currentZone, region: currentRegion });
        if (useLlm) {
            try {
                const enhancedData = await enhanceCharacterProfile(newChar, { date: String(gameDate.year), location: currentZone, region: currentRegion });
                setPlayerCharacter({ ...newChar, ...enhancedData });
            } catch (e) {
                console.error("Failed to enhance character, using procedural:", e);
                setPlayerCharacter(newChar);
            }
        } else {
            setPlayerCharacter(newChar);
        }
        setIsEnhancing(false);
    }, [gameDate, currentZone, currentRegion]);

    const addItemsToInventory = useCallback((itemsToAdd: Item[]) => {
        if (!itemsToAdd || itemsToAdd.length === 0) return;
        setPlayerCharacter(prev => {
            if (!prev) return null;
            let newInventory = [...prev.inventory];
            for (const item of itemsToAdd) {
                newInventory = addItemToInventory(newInventory, item);
            }
            return { ...prev, inventory: newInventory };
        });
    }, [setPlayerCharacter]);

    const removeItemsFromInventory = useCallback((itemIdsToRemove: string[]) => {
        setPlayerCharacter(prev => {
            if (!prev) return null;
            const newInventory = [...prev.inventory];
            const consumedCount: { [id: string]: number } = {};
            itemIdsToRemove.forEach(id => {
                consumedCount[id] = (consumedCount[id] || 0) + 1;
            });

            const updatedInventory = newInventory.map(item => {
                if (consumedCount[item.id]) {
                    return { ...item, quantity: item.quantity - consumedCount[item.id] };
                }
                return item;
            }).filter(item => item.quantity > 0);
            
            return { ...prev, inventory: updatedInventory };
        });
    }, [setPlayerCharacter]);

    const handleEquipItem = useCallback((itemToEquip: Item) => {
        if (!playerCharacter) return;
    
        const stats = getProceduralItemStats(itemToEquip);
        const targetSlot = stats.equipmentSlot;
    
        if (!targetSlot) {
            console.log("This item cannot be equipped."); // Can't use toast here
            return;
        }

        setPlayerCharacter(prev => {
            if (!prev) return null;
    
            const newCharacter = { ...prev };
            const oldEquippedItem = newCharacter.equippedItems[targetSlot];
            
            let newInventory = [...newCharacter.inventory];
            
            const itemIndex = newInventory.findIndex(i => i.id === itemToEquip.id);
            if (itemIndex > -1) {
                if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
                } else {
                    newInventory.splice(itemIndex, 1);
                }
            }
            
            if(oldEquippedItem) {
                newInventory = addItemToInventory(newInventory, oldEquippedItem);
            }
            
            newCharacter.equippedItems = { ...newCharacter.equippedItems, [targetSlot]: { ...itemToEquip, quantity: 1 } };
            newCharacter.inventory = newInventory;
            
            return newCharacter;
        });
      }, [playerCharacter]);
      
      const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
        if (!playerCharacter) return;
    
        setPlayerCharacter(prev => {
            if (!prev) return null;
            const itemToUnequip = prev.equippedItems[slot];
            if (!itemToUnequip) return prev;
    
            const newEquippedItems = { ...prev.equippedItems };
            delete newEquippedItems[slot];
            
            const newInventory = addItemToInventory(prev.inventory, itemToUnequip);
            
            return { ...prev, inventory: newInventory, equippedItems: newEquippedItems };
        });
      }, [playerCharacter]);
    
      const handleDropItem = useCallback((itemToDrop: Item) => {
        if(!playerCharacter) return;
        setPlayerCharacter(prev => {
            if (!prev) return null;
            let newInventory = [...prev.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === itemToDrop.id);
            if(itemIndex > -1) {
                 if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
                } else {
                    newInventory.splice(itemIndex, 1);
                }
            }
            return { ...prev, inventory: newInventory };
        });
      }, [playerCharacter]);
    
      const handleConsumeItem = useCallback((itemToConsume: Item) => {
        if(!playerCharacter) return;
        
        setPlayerCharacter(prev => {
            if (!prev) return null;
            
            const newHealth = Math.min(prev.maxHealth, prev.health + (itemToConsume.sustenance || 0));
            const newFatigue = Math.max(0, prev.fatigue - (itemToConsume.fatigueEffect || 0));
            const newExperience = prev.experience + (itemToConsume.xpEffect || 0);
    
            let newInventory = [...prev.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === itemToConsume.id);
            if (itemIndex > -1) {
                 if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
                } else {
                    newInventory.splice(itemIndex, 1);
                }
            }
            
            return { ...prev, inventory: newInventory, health: newHealth, fatigue: newFatigue, experience: newExperience };
        });
      }, [playerCharacter]);
      
      const onUseCombatItem = useCallback((itemToUse: Item) => {
        if (!playerCharacter) return;
        setPlayerCharacter(prev => {
            if (!prev) return null;
            const newInventory = [...prev.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === itemToUse.id);
            if (itemIndex > -1) {
                if (newInventory[itemIndex].quantity > 1) {
                    newInventory[itemIndex] = { ...newInventory[itemIndex], quantity: newInventory[itemIndex].quantity - 1 };
                } else {
                    newInventory.splice(itemIndex, 1);
                }
                return { ...prev, inventory: newInventory };
            }
            return prev;
        });
      }, [playerCharacter]);

    const findInitialIconPosition = useCallback((tiles: any[][], mode: 'ship' | 'onFoot'): { x: number; y: number; mode: 'ship' | 'onFoot' } | null => {
        const priorityOrderWater: BiomeType[] = [BiomeType.SHALLOW_OCEAN, BiomeType.MAJOR_RIVER, BiomeType.DEEP_OCEAN, BiomeType.RIVER, BiomeType.REEF, BiomeType.OASIS, BiomeType.SHOALS_TILE, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY]; 
        const priorityOrderLand: BiomeType[] = [BiomeType.BEACH, BiomeType.GRASSLAND, BiomeType.RIVERBANK, BiomeType.FOREST, BiomeType.HILLS]; 
        const targetOrder = mode === 'ship' ? priorityOrderWater : priorityOrderLand; 
        for (const biome of targetOrder) { 
            for (let y = 0; y < MAP_HEIGHT_TILES; y++) { 
                for (let x = 0; x < MAP_WIDTH_TILES; x++) { 
                    if (tiles[y][x].biome === biome) { 
                        if (mode === 'ship') { 
                            if ([BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.REEF, BiomeType.SHOALS_TILE, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY].includes(biome)) { 
                                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { 
                                    if (dx === 0 && dy === 0) continue; 
                                    const ny = y + dy; const nx = x + dx; 
                                    if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].isLand && tiles[ny][nx].biome !== BiomeType.ACTIVE_LAVA && tiles[ny][nx].biome !== BiomeType.SHOALS_TILE) return { x, y, mode }; 
                                } 
                            } else return { x, y, mode }; 
                        } else { 
                            if(tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.ACTIVE_LAVA) return {x,y, mode}; 
                        } 
                    } 
                } 
            } 
        } 
        const fallbackX = Math.floor(MAP_WIDTH_TILES / 2); const fallbackY = Math.floor(MAP_HEIGHT_TILES / 2); 
        if(mode === 'ship' && tiles[fallbackY]?.[fallbackX] && !tiles[fallbackY][fallbackX].isLand) return {x: fallbackX, y: fallbackY, mode}; 
        if(mode === 'onFoot' && tiles[fallbackY]?.[fallbackX] && tiles[fallbackY][fallbackX].isLand) return {x: fallbackX, y: fallbackY, mode}; 
        if(mode === 'ship') { 
            for (let y = 0; y < MAP_HEIGHT_TILES; y++) for (let x = 0; x < MAP_WIDTH_TILES; x++) if (!tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.ACTIVE_LAVA) return {x,y, mode}; 
        } else { 
            for (let y = 0; y < MAP_HEIGHT_TILES; y++) for (let x = 0; x < MAP_WIDTH_TILES; x++) if (tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.ACTIVE_LAVA) return {x,y, mode}; 
        } 
        return {x: fallbackX , y: fallbackY, mode}; 
    }, []);

    const onIconAnimationComplete = useCallback(() => { isIconMoving.current = false; }, []);

    const onEnterBuilding = useCallback((tile: Tile, mapData: MapData) => {
        if (!mapData || !tile.structure) return;
        const buildingId = tile.structure.id;
        
        setInteriorViewState(prev => {
            if (prev?.buildingId === buildingId) {
                setViewMode('interior');
                return prev;
            }
            const interiorMap = generateInteriorMap({
                buildingType: tile.structure!.structureType,
                contextTile: tile,
                standardMapContext: mapData,
                date: String(gameDate.year),
                location: currentZone,
                floor: 0,
                totalFloors: 1,
                buildingId,
            });
            const newMaps = new Map<number, InteriorMapData>();
            newMaps.set(0, interiorMap);

            setInteriorMapPlayerPos(interiorMap.player);
            setViewMode('interior');
            return {
                buildingId,
                currentFloor: 0,
                discoveredFloors: new Set([0]),
                maps: newMaps,
            };
        });
    }, [gameDate.year, currentZone]);

    const handleInteriorMove = useCallback((newPos: Point) => {
        if (!interiorViewState) return;
        const map = interiorViewState.maps.get(interiorViewState.currentFloor);
        if (map && newPos.x >= 0 && newPos.x < map.width && newPos.y >= 0 && newPos.y < map.height) {
            const targetTile = map.tiles[newPos.y][newPos.x];
            if (targetTile.isWalkable) {
                setInteriorMapPlayerPos(newPos);
            }
        }
    }, [interiorViewState]);

    const handleExitInteriorView = useCallback(() => {
        setViewMode('standard');
        setInteriorViewState(null);
        setInteriorMapPlayerPos(null);
    }, []);

    const handleEntityInteraction = useCallback((entity: any) => {}, []);

    const onPlayerMove = useCallback((newPos: Point) => {
        if (viewMode === 'interior') {
            handleInteriorMove(newPos);
        }
    }, [viewMode, handleInteriorMove]);

    const onBuyItem = useCallback((itemBaseId: string, price: number) => {
        if (!playerCharacter || playerCharacter.currency < price) return;
        const newItem = createItemInstance(itemBaseId);
        if (!newItem) return;

        setPlayerCharacter(prev => {
            if (!prev) return null;
            return {
                ...prev,
                currency: prev.currency - price,
                inventory: addItemToInventory(prev.inventory, newItem)
            };
        });
    }, [playerCharacter]);

    const onSellItem = useCallback((itemToSell: Item, price: number) => {
        if (!playerCharacter) return;
        setPlayerCharacter(prev => {
            if (!prev) return null;
            const newInventory = [...prev.inventory];
            const itemIndex = newInventory.findIndex(i => i.id === itemToSell.id);
            if (itemIndex === -1) return prev;

            if (newInventory[itemIndex].quantity > 1) {
                newInventory[itemIndex].quantity -= 1;
            } else {
                newInventory.splice(itemIndex, 1);
            }

            return {
                ...prev,
                currency: prev.currency + price,
                inventory: newInventory
            };
        });
    }, [playerCharacter]);

    return {
        playerCharacter,
        setPlayerCharacter,
        onCharacterUpdate: setPlayerCharacter,
        isEnhancing,
        controlledIconX, setControlledIconX,
        controlledIconY, setControlledIconY,
        playerMode, setPlayerMode,
        shipDockX, setShipDockX,
        shipDockY, setShipDockY,
        pendingIconTransitionInfo, setPendingIconTransitionInfo,
        lastExitingEdgeData, setLastExitingEdgeData,
        iconRotation, setIconRotation,
        velocity, setVelocity,
        isIconMoving,
        activeKeys,
        viewMode, setViewMode,
        interiorViewState, setInteriorViewState,
        interiorMapPlayerPos, setInteriorMapPlayerPos,
        addItemsToInventory,
        removeItemsFromInventory, // Export new function

        handleCharacterGeneration,
        handleEquipItem,
        handleUnequipItem,
        handleDropItem,
        handleConsumeItem,
        onUseCombatItem,
        onIconAnimationComplete,
        onPlayerMove,
        handleExitInteriorView,
        handleEntityInteraction,
        onEnterBuilding,
        findInitialIconPosition,
        onBuyItem,
        onSellItem,
    };
};