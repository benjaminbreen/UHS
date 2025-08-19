/**
 * hooks/useMapState.ts - Manages map data, generation, and transitions.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapData, AnimalEntity, NpcEntity, MapAnalysisData, MapArchetype, ClimateType, AltitudeSetting, EdgeTileInfo, GameDate, AdjacencyDirection, Item, MapAreaDefinition, PlayerCharacter, BiomeType, MapGenerationParams, SocietalProfile, HistoricalEra, TerrainStructure } from '../types';
import { proceduralGenerateMap } from '../generation/standardMap/standardMapGenerator';
import { deriveMapSeed } from '../utils/mapUtils';
import { findMapAreaDefinition, getNextMapArea } from '../utils/geographyUtils';
import { ValueNoise } from '../utils/noise';
import {  GEOGRAPHICAL_DATA, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, SOCIETAL_PROFILES } from '../constants/index';
import { generateCharacter, generateCharacterWithSpec } from '../services/characterGenerator';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

/**
 * Convert MapArchetype enum to a readable area name for display
 */
function getArchetypeName(archetype: MapArchetype): string {
    switch (archetype) {
        case MapArchetype.SHOALS: return "Shoals";
        case MapArchetype.OPEN_OCEAN: return "Open Ocean";
        case MapArchetype.ISLAND: return "Island";
        case MapArchetype.BAY: return "Bay";
        case MapArchetype.STRAITS: return "Straits";
        case MapArchetype.DELTA: return "River Delta";
        case MapArchetype.RIVER_PORT: return "River Port";
        case MapArchetype.FRESHWATER_LAKE: return "Lake";
        case MapArchetype.PENINSULA: return "Peninsula";
        case MapArchetype.ALL_LAND: return "Mainland";
        case MapArchetype.ATOLL: return "Atoll";
        default: return "Unknown Waters";
    }
}

/**
 * Get the opposite direction for liminal travel
 */
function getOppositeDirection(direction: AdjacencyDirection): AdjacencyDirection {
    switch (direction) {
        case 'N': return 'S';
        case 'S': return 'N';
        case 'E': return 'W';
        case 'W': return 'E';
        default: return direction;
    }
}

interface CachedMapEntry {
  mapData: MapData;
  animals: AnimalEntity[];
  npcs: NpcEntity[];
  seed: number;
  archetype: MapArchetype; 
  climate: ClimateType;   
  worldX: number;
  worldY: number;
  region: string;
  localArea: string;
}

interface useMapStateProps {
    playerState: {
        playerCharacter: PlayerCharacter | null;
        controlledIconX: number | null;
        controlledIconY: number | null;
        playerMode: 'ship' | 'onFoot';
        lastExitingEdgeData: EdgeTileInfo[] | null;
        pendingIconTransitionInfo: any | null;
    };
    setPlayerState: {
        setPlayerCharacter: React.Dispatch<React.SetStateAction<PlayerCharacter | null>>;
        setControlledIconX: React.Dispatch<React.SetStateAction<number | null>>;
        setControlledIconY: React.Dispatch<React.SetStateAction<number | null>>;
        setPlayerMode: React.Dispatch<React.SetStateAction<'ship' | 'onFoot'>>;
        setPendingIconTransitionInfo: React.Dispatch<React.SetStateAction<any | null>>;
        findInitialIconPosition: (tiles: any[][], mode: 'ship' | 'onFoot') => { x: number; y: number; mode: 'ship' | 'onFoot' } | null;
    };
    gameState: {
        gameDate: GameDate;
        liminalTravelState: any | null;
    };
    setGameState: {
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
        setIsLoadingFromCache: React.Dispatch<React.SetStateAction<boolean>>;
        setLiminalTravelState: React.Dispatch<React.SetStateAction<any | null>>;
        setCurrentZone: React.Dispatch<React.SetStateAction<string>>;
        setCurrentRegion: React.Dispatch<React.SetStateAction<string>>;
        onMapConfigDateChange: (newDate: Partial<GameDate>) => void;
    };
}

export const useMapState = (props: useMapStateProps) => {
    const { playerState, setPlayerState, gameState, setGameState } = props;

    // Map Configuration
    const [initialGameSeed, setInitialGameSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
    const [userSelectedBaseArchetype, setUserSelectedBaseArchetype] = useState<MapArchetype>(MapArchetype.ISLAND);
    const [userSelectedBaseClimate, setUserSelectedBaseClimate] = useState<ClimateType>(ClimateType.TEMPERATE);
    const [userSelectedBaseAltitude, setUserSelectedBaseAltitude] = useState<AltitudeSetting>('standard');
    const [forceVolcanicActivity, setForceVolcanicActivity] = useState<boolean>(false);
    const [generateHarbor, setGenerateHarbor] = useState<boolean>(false);
    const [generateLargeCity, setGenerateLargeCity] = useState<boolean>(false);
    // NEW: Societal parameters
    const [isAgricultural, setIsAgricultural] = useState<boolean | undefined>(undefined);
    const [isPastoral, setIsPastoral] = useState<boolean | undefined>(undefined);
    const [economicActivityLevel, setEconomicActivityLevel] = useState<number>(2); // 0: None, 1: Low, 2: Medium, 3: High, 4: Very High

    // Map State
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [animals, setAnimals] = useState<AnimalEntity[]>([]);
    const [npcs, setNpcs] = useState<NpcEntity[]>([]);
    const [mapDataCache, setMapDataCache] = useState<Map<string, CachedMapEntry>>(new Map());
    const [currentWorldCoords, setCurrentWorldCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [localArea, setLocalArea] = useState<string>('');
    const [worldItems, setWorldItems] = useState<Map<string, Item[]>>(new Map());
    const [mapAnalysisData, setMapAnalysisData] = useState<MapAnalysisData | null>(null);
    const [pendingScenarioData, setPendingScenarioData] = useState<any>(null);
    
    // Derived State
    const currentMapSeed = useMemo(() => deriveMapSeed(initialGameSeed, currentWorldCoords.x, currentWorldCoords.y), [initialGameSeed, currentWorldCoords]);
    const currentMapArchetype = useMemo(() => mapData?.archetype || userSelectedBaseArchetype, [mapData, userSelectedBaseArchetype]);
    const currentMapClimate = useMemo(() => mapData?.climate || userSelectedBaseClimate, [mapData, userSelectedBaseClimate]);
    
    const animalSpawnNoise = useMemo(() => new ValueNoise(currentMapSeed + 50), [currentMapSeed]);

    const visibleAnimals = useMemo(() => animals, [animals]);
    const visibleNpcs = useMemo(() => npcs, [npcs]);

    const societalProfile = useMemo((): SocietalProfile => {
        if (!mapData) return SOCIETAL_PROFILES.DEFAULT;
        const { era } = parseDateString(mapData.timeSlice || '1650');
        const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', parseInt(mapData.timeSlice || '1650'));
        
        let profile = SOCIETAL_PROFILES[culturalZone]?.[era] 
            || SOCIETAL_PROFILES[culturalZone]?.[HistoricalEra.MEDIEVAL] // Fallback to medieval
            || SOCIETAL_PROFILES.DEFAULT;

        // Apply user overrides
        const finalProfile = { ...profile };
        if (isAgricultural !== undefined) finalProfile.isAgricultural = isAgricultural;
        if (isPastoral !== undefined) finalProfile.isPastoral = isPastoral;

        return finalProfile;
    }, [mapData, isAgricultural, isPastoral]);

    useEffect(() => {
        if (mapData) {
            const biomeCounts = new Map<BiomeType, number>();
            mapData.tiles.flat().forEach(tile => {
                biomeCounts.set(tile.biome, (biomeCounts.get(tile.biome) || 0) + 1);
            });

            const urbanBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.PALACE, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER]);
            let urbanTileCount = 0;
            biomeCounts.forEach((count, biome) => {
                if (urbanBiomes.has(biome)) {
                    urbanTileCount += count;
                }
            });
            
            const specialFeatureCount = (mapData.terrainStructures?.length || 0) + 
                mapData.tiles.flat().filter(t => t.biome === BiomeType.RUINS || t.biome === BiomeType.HOLY_SITE).length;

            setMapAnalysisData({
                biomeCount: biomeCounts.size,
                urbanTileCount,
                specialFeatureCount,
            });
        }
    }, [mapData]);

    const removeVegetation = useCallback((vegetationId: string) => {
        setMapData(prevMapData => {
            if (!prevMapData) return null;

            const vegetationToRemove = prevMapData.vegetation?.find(v => v.id === vegetationId);
            if (!vegetationToRemove) return prevMapData;

            // Create deep copies for immutable update
            const newTiles = JSON.parse(JSON.stringify(prevMapData.tiles));
            
            // Update tile
            newTiles[vegetationToRemove.y][vegetationToRemove.x].vegetationId = undefined;

            // Update vegetation list
            const newVegetation = prevMapData.vegetation?.filter(v => v.id !== vegetationId);

            return {
                ...prevMapData,
                tiles: newTiles,
                vegetation: newVegetation,
            };
        });
    }, []);

    const updateMineralDeposit = useCallback((x: number, y: number, amountToDecrement: number) => {
        setMapData(prevMapData => {
            if (!prevMapData) return null;

            const newTiles = JSON.parse(JSON.stringify(prevMapData.tiles));
            const tile = newTiles[y]?.[x];

            if (tile && tile.mineralDeposit) {
                const newQuantity = tile.mineralDeposit.quantity - amountToDecrement;
                if (newQuantity <= 0) {
                    delete tile.mineralDeposit;
                } else {
                    tile.mineralDeposit.quantity = newQuantity;
                }

                // Also update the cache for this map
                const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
                const cachedEntry = mapDataCache.get(cacheKey);
                if(cachedEntry) {
                    const newCachedMapData = {...cachedEntry.mapData, tiles: newTiles};
                    setMapDataCache(prevCache => new Map(prevCache).set(cacheKey, {...cachedEntry, mapData: newCachedMapData}));
                }

                return { ...prevMapData, tiles: newTiles };
            }
            
            return prevMapData;
        });
    }, [currentWorldCoords.x, currentWorldCoords.y, mapDataCache]);


    const _selectRandomMapArea = useCallback(() => {
        const zones = Object.keys(GEOGRAPHICAL_DATA);
        const randomZoneName = zones[Math.floor(Math.random() * zones.length)];
        const regionsInZone = GEOGRAPHICAL_DATA[randomZoneName];
        const regionNames = Object.keys(regionsInZone);
        const randomRegionName = regionNames[Math.floor(Math.random() * regionNames.length)];
        const mapAreasInRegion = Object.values(regionsInZone[randomRegionName]);
        const randomMapAreaDef = mapAreasInRegion[Math.floor(Math.random() * mapAreasInRegion.length)];
        return { areaDef: randomMapAreaDef, region: randomRegionName, zone: randomZoneName };
    }, []);

    const generateAndCacheMapInternal = useCallback(( seedToUse: number, archetypeToUse: MapArchetype, climateToUse: ClimateType, worldX: number, worldY: number, localAreaToUse: string, regionToUse: string, zoneToUse: string, neighboringEdges?: any, altitudeOverride?: 'standard' | 'high' | 'low', hasLakes?: boolean, areaEconomicActivityLevel?: number ): CachedMapEntry => { 
        // Use area-specific economicActivityLevel if provided, otherwise fall back to state value
        const effectiveEconomicLevel = areaEconomicActivityLevel !== undefined ? areaEconomicActivityLevel : economicActivityLevel;
        const generationParams: MapGenerationParams = { isAgricultural, isPastoral, economicActivityLevel: effectiveEconomicLevel };
        const newMap = proceduralGenerateMap( seedToUse, archetypeToUse, climateToUse,  generateHarbor, generateLargeCity,  altitudeOverride || userSelectedBaseAltitude, forceVolcanicActivity, zoneToUse, regionToUse, localAreaToUse, String(gameState.gameDate.year), generationParams, neighboringEdges, hasLakes ); 
        const newAnimals = newMap.animals || []; const newNpcs = newMap.npcs || [];
        delete newMap.animals; delete newMap.npcs;
        const newCacheEntry = { mapData: newMap, animals: newAnimals, npcs: newNpcs, seed: seedToUse, archetype: archetypeToUse, climate: climateToUse, worldX, worldY, region: regionToUse, localArea: localAreaToUse };
        setMapDataCache(prevCache => new Map(prevCache).set(`${worldX},${worldY}`, newCacheEntry)); 
        return newCacheEntry;
    }, [generateHarbor, generateLargeCity, userSelectedBaseAltitude, forceVolcanicActivity, gameState.gameDate, isAgricultural, isPastoral, economicActivityLevel]);

    const validateAndPlacePlayerOnNewMap = useCallback((targetMap: MapData, transitionInfo: any) => {
        let finalX = transitionInfo.entryX;
        let finalY = transitionInfo.entryY;
        let finalMode = transitionInfo.mode;
        const targetTile = targetMap.tiles[finalY]?.[finalX];

        if (!targetTile) {
            const fallbackPos = setPlayerState.findInitialIconPosition(targetMap.tiles, finalMode) || { x: MAP_WIDTH_TILES / 2, y: MAP_HEIGHT_TILES / 2, mode: finalMode };
            finalX = fallbackPos.x;
            finalY = fallbackPos.y;
        } else if (finalMode === 'ship' && targetTile.isLand && targetTile.biome !== BiomeType.ESTUARY) {
            // Find nearby water tile if player exits into land while on ship
            let foundWater = false;
            for (let r = 1; r <= 3; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (Math.abs(dx) < r && Math.abs(dy) < r) continue;
                        const searchX = transitionInfo.entryX + dx;
                        const searchY = transitionInfo.entryY + dy;
                        if (searchX >= 0 && searchX < MAP_WIDTH_TILES && searchY >= 0 && searchY < MAP_HEIGHT_TILES) {
                            const adjTile = targetMap.tiles[searchY][searchX];
                            if (!adjTile.isLand) {
                                finalX = searchX; finalY = searchY; foundWater = true; break;
                            }
                        }
                    }
                    if (foundWater) break;
                }
                if (foundWater) break;
            }
            if (!foundWater) { // Disembark if no water found
                finalMode = 'onFoot';
            }
        }
        
        setPlayerState.setControlledIconX(finalX);
        setPlayerState.setControlledIconY(finalY);
        setPlayerState.setPlayerMode(finalMode);
        setPlayerState.setPendingIconTransitionInfo(null);
    }, [setPlayerState]);


    // Initial world generation
    useEffect(() => {
        if (mapData || playerState.playerCharacter) return; // Only run once on initial load

        setGameState.setIsLoading(true);
        const { areaDef, region, zone } = _selectRandomMapArea();

        // Use area-specific economicActivityLevel if defined, otherwise use state value
        const effectiveEconomicLevel = areaDef.economicActivityLevel !== undefined ? areaDef.economicActivityLevel : economicActivityLevel;
        
        const newMapData = proceduralGenerateMap(
            initialGameSeed, areaDef.archetype, areaDef.climate, generateHarbor, generateLargeCity,
            areaDef.altitude || userSelectedBaseAltitude, forceVolcanicActivity,
            zone, region, areaDef.name,
            String(gameState.gameDate.year), { isAgricultural, isPastoral, economicActivityLevel: effectiveEconomicLevel }, {},
            areaDef.hasLakes
        );
        
        setMapData(newMapData);
        setAnimals(newMapData.animals || []);
        setNpcs(newMapData.npcs || []);
        setLocalArea(areaDef.name);
        setGameState.setCurrentZone(zone);
        setGameState.setCurrentRegion(region);

        const charContext = { 
            date: String(gameState.gameDate.year), 
            location: zone, 
            region: region
        };
        const newChar = generateCharacter(charContext);
        setPlayerState.setPlayerCharacter(newChar);

        const initialPos = setPlayerState.findInitialIconPosition(newMapData.tiles, 'ship');
        if (initialPos) {
            setPlayerState.setControlledIconX(initialPos.x);
            setPlayerState.setControlledIconY(initialPos.y);
            setPlayerState.setPlayerMode(initialPos.mode);
        }
        setGameState.setIsLoading(false);

    }, [initialGameSeed, mapData, playerState.playerCharacter, isAgricultural, isPastoral, economicActivityLevel]);

    // Map transitions based on world coordinates change
    useEffect(() => {
        const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
        const cachedEntry = mapDataCache.get(cacheKey);

        // If the current mapData doesn't match the coordinates, we need to load a new one.
        if (mapData && (mapData.seed !== currentMapSeed)) {
             setGameState.setIsLoading(true);

            if (cachedEntry) {
                setMapData(cachedEntry.mapData);
                setAnimals(cachedEntry.animals);
                setNpcs(cachedEntry.npcs);
                setLocalArea(cachedEntry.localArea);
                setGameState.setCurrentZone(cachedEntry.mapData.continent || '');
                setGameState.setCurrentRegion(cachedEntry.region);
                if (playerState.pendingIconTransitionInfo) {
                    validateAndPlacePlayerOnNewMap(cachedEntry.mapData, playerState.pendingIconTransitionInfo);
                }
                setGameState.setIsLoading(false);
            } else {
                // Generate new map
                const neighboringEdges: any = {};
                const north = mapDataCache.get(`${currentWorldCoords.x},${currentWorldCoords.y - 1}`);
                if (north) neighboringEdges.north = north.mapData.edgeDataSet.south;
                const east = mapDataCache.get(`${currentWorldCoords.x + 1},${currentWorldCoords.y}`);
                if (east) neighboringEdges.east = east.mapData.edgeDataSet.west;
                const south = mapDataCache.get(`${currentWorldCoords.x},${currentWorldCoords.y + 1}`);
                if (south) neighboringEdges.south = south.mapData.edgeDataSet.north;
                const west = mapDataCache.get(`${currentWorldCoords.x - 1},${currentWorldCoords.y}`);
                if (west) neighboringEdges.west = west.mapData.edgeDataSet.west;

                // Check if we're in a liminal zone first
                let mapToGenerate = null;
                
                if (gameState.liminalTravelState) {
                    // We're in a liminal zone - generate based on current archetype
                    const currentArchetype = gameState.liminalTravelState.sequence[gameState.liminalTravelState.progress];
                    console.log(`[Map Generation] Generating liminal map for archetype: ${currentArchetype}`);
                    
                    // Determine climate based on origin area
                    const originAreaInfo = findMapAreaDefinition(gameState.liminalTravelState.originArea);
                    const climate = originAreaInfo ? originAreaInfo.areaDef.climate : ClimateType.TEMPERATE;
                    
                    mapToGenerate = {
                        archetype: currentArchetype,
                        climate: climate,
                        name: getArchetypeName(currentArchetype),
                        region: "Liminal Waters",
                        zone: "Ocean"
                    };
                } else {
                    // Normal area - find it in geographical data
                    const areaInfo = findMapAreaDefinition(localArea);
                    if (areaInfo) {
                        mapToGenerate = {
                            archetype: areaInfo.areaDef.archetype,
                            climate: areaInfo.areaDef.climate,
                            name: areaInfo.areaDef.name,
                            region: areaInfo.region,
                            zone: areaInfo.zone,
                            altitude: areaInfo.areaDef.altitude,
                            hasLakes: areaInfo.areaDef.hasLakes,
                            economicActivityLevel: areaInfo.areaDef.economicActivityLevel
                        };
                    }
                }
                
                if (mapToGenerate) {
                    const newMapData = generateAndCacheMapInternal(
                        currentMapSeed, mapToGenerate.archetype, mapToGenerate.climate,
                        currentWorldCoords.x, currentWorldCoords.y,
                        mapToGenerate.name, mapToGenerate.region, mapToGenerate.zone, neighboringEdges,
                        mapToGenerate.altitude, mapToGenerate.hasLakes, mapToGenerate.economicActivityLevel
                    );
                    setMapData(newMapData.mapData);
                    setAnimals(newMapData.animals);
                    setNpcs(newMapData.npcs);
                    if (playerState.pendingIconTransitionInfo) {
                        validateAndPlacePlayerOnNewMap(newMapData.mapData, playerState.pendingIconTransitionInfo);
                    }
                }
                setGameState.setIsLoading(false);
            }
        }
    }, [currentWorldCoords, gameState.liminalTravelState, mapData, currentMapSeed, mapDataCache, setGameState, setLocalArea, playerState.pendingIconTransitionInfo, generateAndCacheMapInternal, validateAndPlacePlayerOnNewMap, localArea]);


    const handleMapTransition = useCallback((direction: AdjacencyDirection, entryX: number, entryY: number) => {
        console.log(`[Map Transition] Initiated. Direction: ${direction}, From: ${localArea}`);
        if (playerState.pendingIconTransitionInfo) {
            console.warn("[Map Transition] Aborted: Icon transition already in progress.");
            return;
        }
        
        // Handle liminal travel progression
        if (gameState.liminalTravelState) {
            console.log(`[Liminal Travel] Continuing in liminal sequence. Current progress: ${gameState.liminalTravelState.progress}`);
            const { sequence, progress, destination, originArea, originDirection } = gameState.liminalTravelState;
            
            // If we're moving in the original direction, advance through sequence
            if (direction === originDirection) {
                const nextProgress = progress + 1;
                
                if (nextProgress >= sequence.length) {
                    // End of sequence - arrive at destination
                    console.log(`[Liminal Travel] Sequence complete. Arriving at: ${destination}`);
                    setGameState.setLiminalTravelState(null);
                    setLocalArea(destination);
                } else {
                    // Move to next archetype in sequence
                    const nextArchetype = sequence[nextProgress];
                    console.log(`[Liminal Travel] Advancing to: ${getArchetypeName(nextArchetype)} (${nextProgress + 1}/${sequence.length})`);
                    setGameState.setLiminalTravelState({
                        ...gameState.liminalTravelState,
                        progress: nextProgress
                    });
                    setLocalArea(getArchetypeName(nextArchetype));
                }
            } else if (direction === getOppositeDirection(originDirection)) {
                // Moving backwards through sequence
                const nextProgress = progress - 1;
                
                if (nextProgress < 0) {
                    // Back to origin
                    console.log(`[Liminal Travel] Returning to origin: ${originArea}`);
                    setGameState.setLiminalTravelState(null);
                    setLocalArea(originArea);
                } else {
                    // Move to previous archetype in sequence  
                    const prevArchetype = sequence[nextProgress];
                    console.log(`[Liminal Travel] Retreating to: ${getArchetypeName(prevArchetype)} (${nextProgress + 1}/${sequence.length})`);
                    setGameState.setLiminalTravelState({
                        ...gameState.liminalTravelState,
                        progress: nextProgress
                    });
                    setLocalArea(getArchetypeName(prevArchetype));
                }
            } else {
                // Invalid direction in liminal space
                console.warn(`[Liminal Travel] Invalid direction ${direction} in liminal space. Can only move ${originDirection} or ${getOppositeDirection(originDirection)}.`);
                return;
            }
        } else {
            // Normal map transition logic
            const nextMapResult = getNextMapArea(localArea, direction);
            let targetWorldX = currentWorldCoords.x;
            let targetWorldY = currentWorldCoords.y;
            
            if (direction === 'N') targetWorldY--;
            else if (direction === 'S') targetWorldY++;
            else if (direction === 'W') targetWorldX--;
            else if (direction === 'E') targetWorldX++;

            if (nextMapResult.type === 'liminal') {
                console.log(`[Map Transition] Entering liminal sequence: ${nextMapResult.key}`);
                const firstArchetype = nextMapResult.sequence[0];
                console.log(`[Map Transition] Starting with archetype: ${firstArchetype}`);
                setGameState.setLiminalTravelState({ 
                    sequence: nextMapResult.sequence, 
                    progress: 0, 
                    destination: nextMapResult.destination, 
                    originArea: localArea, 
                    originDirection: direction 
                });
                // Set to the first archetype in sequence (should be SHOALS)
                setLocalArea(getArchetypeName(firstArchetype));
            } else if (nextMapResult.type === 'adjacent') {
                console.log(`[Map Transition] Moving to adjacent area: ${nextMapResult.areaDef.name}`);
                setGameState.setCurrentZone(nextMapResult.zone);
                setGameState.setCurrentRegion(nextMapResult.region);
                setLocalArea(nextMapResult.areaDef.name);
            } else if (nextMapResult.type === 'random') {
                const { zone, region, areaDef } = _selectRandomMapArea();
                console.log(`[Map Transition] Moving to random new area: ${areaDef.name}`);
                setGameState.setCurrentZone(zone);
                setGameState.setCurrentRegion(region);
                setLocalArea(areaDef.name);
            }
            
            setCurrentWorldCoords({ x: targetWorldX, y: targetWorldY });
            setPlayerState.setPendingIconTransitionInfo({ targetWorldX, targetWorldY, entryX, entryY, mode: playerState.playerMode });
        }

    }, [currentWorldCoords, playerState.playerMode, gameState.liminalTravelState, playerState.pendingIconTransitionInfo, localArea, setPlayerState, setGameState, _selectRandomMapArea]);

    const handleSeedChangeFromSettings = useCallback((newSeed: number) => {
        setInitialGameSeed(newSeed);
        setMapDataCache(new Map());
        setCurrentWorldCoords({ x: 0, y: 0 });
        setMapData(null);
        setPlayerState.setPlayerCharacter(null);
    }, [setPlayerState]);

    const onRegenerateMapWithCurrentSettings = useCallback(() => {
        if (!mapData) return;
        setGameState.setIsLoading(true);
        const { continent, localArea: currentLocalArea, region: currentRegion } = mapData;
        const newMapEntry = generateAndCacheMapInternal(
            currentMapSeed, userSelectedBaseArchetype, userSelectedBaseClimate, 
            currentWorldCoords.x, currentWorldCoords.y, 
            currentLocalArea!, currentRegion!, continent!, {}
        );
        setMapData(newMapEntry.mapData);
        setAnimals(newMapEntry.animals);
        setNpcs(newMapEntry.npcs);
        const initialPos = setPlayerState.findInitialIconPosition(newMapEntry.mapData.tiles, playerState.playerMode);
        if (initialPos) {
            setPlayerState.setControlledIconX(initialPos.x);
            setPlayerState.setControlledIconY(initialPos.y);
        }
        setGameState.setIsLoading(false);
    }, [mapData, currentMapSeed, userSelectedBaseArchetype, userSelectedBaseClimate, currentWorldCoords, generateAndCacheMapInternal, setPlayerState, playerState.playerMode, setGameState]);

    const onStartNewWorldWithCurrentSettings = useCallback((characterSpec?: any) => {
        const newSeed = Math.floor(Math.random() * 1000000);
        setInitialGameSeed(newSeed);
        setMapDataCache(new Map());
        setCurrentWorldCoords({ x: 0, y: 0 });
        
        // Generate a random map area
        const { areaDef, region, zone } = _selectRandomMapArea();
        setGameState.setCurrentZone(zone);
        setGameState.setCurrentRegion(region);
        setLocalArea(areaDef.name);
        
        // Generate the map
        setGameState.setIsLoading(true);
        const effectiveEconomicLevel = areaDef.economicActivityLevel !== undefined ? 
            areaDef.economicActivityLevel : economicActivityLevel;
        
        const newMapData = proceduralGenerateMap(
            newSeed, 
            areaDef.archetype, 
            areaDef.climate, 
            generateHarbor, 
            generateLargeCity,
            areaDef.altitude || userSelectedBaseAltitude, 
            forceVolcanicActivity,
            zone, 
            region, 
            areaDef.name,
            String(gameState.gameDate.year), 
            { isAgricultural, isPastoral, economicActivityLevel: effectiveEconomicLevel }, 
            {},
            areaDef.hasLakes
        );
        
        // Extract animals and npcs
        const newAnimals = newMapData.animals || [];
        const newNpcs = newMapData.npcs || [];
        delete newMapData.animals;
        delete newMapData.npcs;
        
        setMapData(newMapData);
        setAnimals(newAnimals);
        setNpcs(newNpcs);
        
        // Generate the player character
        const charContext = { 
            date: String(gameState.gameDate.year), 
            location: zone, 
            region: region
        };
        
        try {
            const newChar = characterSpec 
                ? generateCharacterWithSpec(charContext, characterSpec)
                : generateCharacter(charContext);
            
            setPlayerState.setPlayerCharacter(newChar);
        } catch (error) {
            console.error('[onStartNewWorldWithCurrentSettings] Failed to generate character with spec, falling back to random:', error);
            // Fallback to random character generation if custom spec fails
            const fallbackChar = generateCharacter(charContext);
            setPlayerState.setPlayerCharacter(fallbackChar);
        }
        
        // Set initial player position
        const initialPos = setPlayerState.findInitialIconPosition(newMapData.tiles, 'ship');
        if (initialPos) {
            setPlayerState.setControlledIconX(initialPos.x);
            setPlayerState.setControlledIconY(initialPos.y);
            setPlayerState.setPlayerMode(initialPos.mode);
        }
        
        setGameState.setIsLoading(false);
    }, [setPlayerState, setGameState, _selectRandomMapArea, generateHarbor, generateLargeCity, 
        userSelectedBaseAltitude, forceVolcanicActivity, gameState.gameDate.year, 
        isAgricultural, isPastoral, economicActivityLevel]);


    const onStartNewWorldAtLocation = useCallback((targetZone: string, targetMapArea: string, characterSpec?: any, overrideYear?: number) => {
        console.log('[onStartNewWorldAtLocation] Called with zone:', targetZone, 'area:', targetMapArea, 'characterSpec:', characterSpec, 'overrideYear:', overrideYear);
        
        // Find the specific area definition
        const zoneData = GEOGRAPHICAL_DATA[targetZone];
        console.log('[onStartNewWorldAtLocation] Zone data found:', !!zoneData);
        
        if (!zoneData) {
            console.error(`[onStartNewWorldAtLocation] Zone not found: ${targetZone}`);
            console.log('[onStartNewWorldAtLocation] Available zones:', Object.keys(GEOGRAPHICAL_DATA));
            return onStartNewWorldWithCurrentSettings(characterSpec); // Fallback to random
        }
        
        let foundAreaDef = null;
        let foundRegion = null;
        
        // Search all regions in the zone for the target map area
        console.log('[onStartNewWorldAtLocation] Searching for area in regions...');
        for (const [regionName, regionData] of Object.entries(zoneData)) {
            console.log(`[onStartNewWorldAtLocation] Checking region ${regionName}`);
            for (const areaDef of Object.values(regionData)) {
                console.log(`[onStartNewWorldAtLocation] - Area: ${areaDef.name}`);
                if (areaDef.name === targetMapArea) {
                    foundAreaDef = areaDef;
                    foundRegion = regionName;
                    console.log('[onStartNewWorldAtLocation] Found match!');
                    break;
                }
            }
            if (foundAreaDef) break;
        }
        
        if (!foundAreaDef || !foundRegion) {
            console.error(`[onStartNewWorldAtLocation] Map area not found: ${targetMapArea} in zone ${targetZone}`);
            return onStartNewWorldWithCurrentSettings(characterSpec); // Fallback to random
        }
        
        console.log('[onStartNewWorldAtLocation] Success! Found area:', foundAreaDef.name, 'in region:', foundRegion);
        
        // Generate new seed and reset
        const newSeed = Math.floor(Math.random() * 1000000);
        setInitialGameSeed(newSeed);
        setMapDataCache(new Map());
        setCurrentWorldCoords({ x: 0, y: 0 });
        
        // Set the location
        setGameState.setCurrentZone(targetZone);
        setGameState.setCurrentRegion(foundRegion);
        setLocalArea(targetMapArea);
        
        // Generate the map at this specific location
        setGameState.setIsLoading(true);
        const effectiveEconomicLevel = foundAreaDef.economicActivityLevel !== undefined ? 
            foundAreaDef.economicActivityLevel : economicActivityLevel;
        
        // Use override year if provided, otherwise use current game date
        const yearToUse = overrideYear !== undefined ? overrideYear : gameState.gameDate.year;
        
        const newMapData = proceduralGenerateMap(
            newSeed, 
            foundAreaDef.archetype, 
            foundAreaDef.climate, 
            generateHarbor, 
            generateLargeCity,
            foundAreaDef.altitude || userSelectedBaseAltitude, 
            forceVolcanicActivity,
            targetZone, 
            foundRegion, 
            foundAreaDef.name,
            String(yearToUse), 
            { isAgricultural, isPastoral, economicActivityLevel: effectiveEconomicLevel }, 
            {},
            foundAreaDef.hasLakes
        );
        
        // Extract animals and npcs before setting map data
        const newAnimals = newMapData.animals || [];
        const newNpcs = newMapData.npcs || [];
        delete newMapData.animals;
        delete newMapData.npcs;
        
        setMapData(newMapData);
        setAnimals(newAnimals);
        setNpcs(newNpcs);
        setMapDataCache(new Map([[`0,0`, { 
            mapData: newMapData, 
            animals: newAnimals,
            npcs: newNpcs,
            seed: newSeed,
            archetype: foundAreaDef.archetype, 
            climate: foundAreaDef.climate,
            worldX: 0,
            worldY: 0,
            region: foundRegion,
            localArea: foundAreaDef.name
        }]]));
        
        // Generate the player character immediately
        const charContext = { 
            date: String(yearToUse), 
            location: targetZone, 
            region: foundRegion
        };
        
        try {
            const newChar = characterSpec 
                ? generateCharacterWithSpec(charContext, characterSpec)
                : generateCharacter(charContext);
            
            setPlayerState.setPlayerCharacter(newChar);
        } catch (error) {
            console.error('[onStartNewWorldAtLocation] Failed to generate character with spec, falling back to random:', error);
            // Fallback to random character generation if custom spec fails
            const fallbackChar = generateCharacter(charContext);
            setPlayerState.setPlayerCharacter(fallbackChar);
        }
        
        // Set initial player position
        const initialPos = setPlayerState.findInitialIconPosition(newMapData.tiles, 'ship');
        if (initialPos) {
            setPlayerState.setControlledIconX(initialPos.x);
            setPlayerState.setControlledIconY(initialPos.y);
            setPlayerState.setPlayerMode(initialPos.mode);
        }
        
        // Update the game date if an override year was provided
        if (overrideYear !== undefined) {
            setGameState.onMapConfigDateChange({ year: overrideYear });
        }
        
        setGameState.setIsLoading(false);
    }, [setPlayerState, setGameState, generateHarbor, generateLargeCity, userSelectedBaseAltitude, 
        forceVolcanicActivity, gameState.gameDate, isAgricultural, isPastoral, 
        economicActivityLevel, onStartNewWorldWithCurrentSettings]);

    const onStartNewWorldAtZoneRegion = useCallback((targetZone: string, targetRegion: string, characterSpec?: any) => {
        console.log('[onStartNewWorldAtZoneRegion] Called with zone:', targetZone, 'region:', targetRegion, 'characterSpec:', characterSpec);
        
        // Find the zone data
        const zoneData = GEOGRAPHICAL_DATA[targetZone];
        if (!zoneData) {
            console.error(`[onStartNewWorldAtZoneRegion] Zone not found: ${targetZone}`);
            return onStartNewWorldWithCurrentSettings(characterSpec); // Fallback to random
        }
        
        // Find the region data
        const regionData = zoneData[targetRegion];
        if (!regionData) {
            console.error(`[onStartNewWorldAtZoneRegion] Region not found: ${targetRegion} in zone ${targetZone}`);
            // Try to find any region in the zone as fallback
            const regionNames = Object.keys(zoneData);
            if (regionNames.length > 0) {
                const fallbackRegion = regionNames[0];
                console.log(`[onStartNewWorldAtZoneRegion] Using fallback region: ${fallbackRegion}`);
                const areas = Object.values(zoneData[fallbackRegion]) as MapAreaDefinition[];
                if (areas.length > 0) {
                    const randomArea = areas[Math.floor(Math.random() * areas.length)];
                    return onStartNewWorldAtLocation(targetZone, randomArea.name, characterSpec);
                }
            }
            return onStartNewWorldWithCurrentSettings(characterSpec);
        }
        
        // Pick a random area from the region
        const areasInRegion = Object.values(regionData) as MapAreaDefinition[];
        if (areasInRegion.length === 0) {
            console.error(`[onStartNewWorldAtZoneRegion] No areas found in region: ${targetRegion}`);
            return onStartNewWorldWithCurrentSettings(characterSpec);
        }
        
        const randomArea = areasInRegion[Math.floor(Math.random() * areasInRegion.length)];
        console.log(`[onStartNewWorldAtZoneRegion] Selected random area: ${randomArea.name} from region ${targetRegion}`);
        
        // Use the existing onStartNewWorldAtLocation with the selected area
        return onStartNewWorldAtLocation(targetZone, randomArea.name, characterSpec);
    }, [onStartNewWorldWithCurrentSettings, onStartNewWorldAtLocation]);

    const updateStructureData = useCallback((structureId: string, updatedData: Partial<TerrainStructure>) => {
        setMapData(prevMapData => {
            if (!prevMapData?.terrainStructures) return prevMapData;

            const newStructures = prevMapData.terrainStructures.map(s => {
                if (s.id === structureId) {
                    return { ...s, ...updatedData };
                }
                return s;
            });

            const newMapData = { ...prevMapData, terrainStructures: newStructures };

            const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
            const cachedEntry = mapDataCache.get(cacheKey);
            if (cachedEntry) {
                setMapDataCache(prevCache => new Map(prevCache).set(cacheKey, { ...cachedEntry, mapData: newMapData }));
            }

            return newMapData;
        });
    }, [currentWorldCoords, mapDataCache]);

    return {
        mapData, setMapData,
        animals, setAnimals,
        npcs, setNpcs,
        mapDataCache, setMapDataCache,
        currentWorldCoords, setCurrentWorldCoords,
        localArea, setLocalArea,
        worldItems, setWorldItems,
        mapAnalysisData, setMapAnalysisData,
        currentMapSeed,
        currentMapArchetype,
        currentMapClimate,
        animalSpawnNoise,
        visibleAnimals,
        visibleNpcs,
        initialGameSeed, setInitialGameSeed,
        userSelectedBaseArchetype, onBaseArchetypeChange: setUserSelectedBaseArchetype,
        userSelectedBaseClimate, onBaseClimateChange: setUserSelectedBaseClimate,
        userSelectedBaseAltitude, onBaseAltitudeChange: setUserSelectedBaseAltitude,
        forceVolcanicActivity, onForceVolcanicActivityToggle: setForceVolcanicActivity,
        generateHarbor, onGenerateHarborToggle: setGenerateHarbor,
        generateLargeCity, onGenerateLargeCityToggle: setGenerateLargeCity,
        terrainStructures: mapData?.terrainStructures,
        societalProfile, // EXPOSE THIS
        isAgricultural, setIsAgricultural,
        isPastoral, setIsPastoral,
        economicActivityLevel, setEconomicActivityLevel,
        
        handleMapTransition,
        handleSeedChangeFromSettings,
        onRegenerateMapWithCurrentSettings,
        onStartNewWorldWithCurrentSettings,
        onStartNewWorldAtLocation,
        onStartNewWorldAtZoneRegion,
        removeVegetation,
        updateMineralDeposit,
        updateStructureData,
        pendingScenarioData,
        setPendingScenarioData,
    };
};