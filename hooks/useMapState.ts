/**
 * hooks/useMapState.ts - Manages map data, generation, and transitions.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MapData, AnimalEntity, NpcEntity, MapAnalysisData, MapArchetype, ClimateType, AltitudeSetting, EdgeTileInfo, GameDate, AdjacencyDirection, Item, MapAreaDefinition, PlayerCharacter, BiomeType, MapGenerationParams, SocietalProfile, HistoricalEra, TerrainStructure, DeployedVessel } from '../types';
import { SpecialMapConfig, SpecialMapData, InteractionZone, ExitZone } from '../types/specialMapTypes';
import { proceduralGenerateMap } from '../generation/standardMap/standardMapGenerator';
import { generateSpecialMap } from '../generation/specialMap/specialMapGenerator';
import { deriveMapSeed } from '../utils/mapUtils';
import { findMapAreaDefinition, getNextMapArea } from '../utils/geographyUtils';
import { geography } from '../constants/gameData/geography';
import { ValueNoise } from '../utils/noise';
import {  GEOGRAPHICAL_DATA, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, SOCIETAL_PROFILES } from '../constants/index';
import { generateCharacter, generateCharacterWithSpec } from '../services/characterGenerator';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { SeedManager } from '../services/seedService';

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
  deployedVessels: DeployedVessel[];
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
    const seedManager = SeedManager.getInstance();
    const [initialGameSeed, setInitialGameSeed] = useState<number>(() => {
        // Use hash of the seed string as numeric seed for map generation
        const seedStr = seedManager.getSeed();
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            const char = seedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % 1000000;
    });
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
    const [deployedVessels, setDeployedVessels] = useState<DeployedVessel[]>([]);
    const [mapDataCache, setMapDataCache] = useState<Map<string, CachedMapEntry>>(new Map());
    const [currentWorldCoords, setCurrentWorldCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [localArea, setLocalArea] = useState<string>('');
    const [worldItems, setWorldItems] = useState<Map<string, Item[]>>(new Map());
    const [mapAnalysisData, setMapAnalysisData] = useState<MapAnalysisData | null>(null);
    const [pendingScenarioData, setPendingScenarioData] = useState<any>(null);
    const [hasGeneratedInitialMap, setHasGeneratedInitialMap] = useState(false);
    
    // Special map state
    const [isSpecialMap, setIsSpecialMap] = useState(false);
    const isSpecialMapRef = useRef(false); // Immediate ref to track special map state
    const [isEnteringSpecialMap, setIsEnteringSpecialMap] = useState(false);
    const [specialMapInteractionZones, setSpecialMapInteractionZones] = useState<InteractionZone[]>([]);
    const [specialMapExitZones, setSpecialMapExitZones] = useState<ExitZone[]>([]);
    const [specialMapReturnData, setSpecialMapReturnData] = useState<{
        mapAreaName: string;
        returnCoordinates: [number, number];
        originalMapCache?: string;
    } | null>(null);
    
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
        // Don't modify special maps (check ref for immediate value)
        if (isSpecialMapRef.current || isSpecialMap) {
            console.warn('[removeVegetation] BLOCKED - special map active, ref:', isSpecialMapRef.current, ', state:', isSpecialMap);
            return;
        }
        console.log('[removeVegetation] Running - ref:', isSpecialMapRef.current, ', state:', isSpecialMap);
        
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
    }, [isSpecialMap]);

    const updateMineralDeposit = useCallback((x: number, y: number, amountToDecrement: number) => {
        // Don't modify special maps
        if (isSpecialMap) {
            console.log('[updateMineralDeposit] Blocked - special map active');
            return;
        }
        
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
    }, [currentWorldCoords.x, currentWorldCoords.y, mapDataCache, isSpecialMap]);


    const _selectRandomMapArea = useCallback(() => {
        // Filter out "Special" zone - it's only for WorldWeaver easter eggs
        const zones = Object.keys(GEOGRAPHICAL_DATA).filter(zone => zone !== "Special");
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
        const newMap = proceduralGenerateMap( seedToUse, archetypeToUse, climateToUse,  generateHarbor, generateLargeCity,  altitudeOverride || userSelectedBaseAltitude, forceVolcanicActivity, zoneToUse, regionToUse, localAreaToUse, String(gameState.gameDate.year), generationParams, neighboringEdges, hasLakes, undefined, undefined, undefined ); 
        const newAnimals = newMap.animals || []; const newNpcs = newMap.npcs || [];
        delete newMap.animals; delete newMap.npcs;
        const newCacheEntry = { mapData: newMap, animals: newAnimals, npcs: newNpcs, deployedVessels: [], seed: seedToUse, archetype: archetypeToUse, climate: climateToUse, worldX, worldY, region: regionToUse, localArea: localAreaToUse };
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


    // Initial world generation - DISABLED to prevent double generation
    // All initial map generation is now handled in App.tsx
    // This effect was causing maps to generate twice on initial load
    // useEffect(() => {
    //     if (mapData || playerState.playerCharacter) return; // Only run once on initial load

    //     setGameState.setIsLoading(true);
    //     const { areaDef, region, zone } = _selectRandomMapArea();

    //     // Use area-specific economicActivityLevel if defined, otherwise use state value
    //     const effectiveEconomicLevel = areaDef.economicActivityLevel !== undefined ? areaDef.economicActivityLevel : economicActivityLevel;
        
    //     const newMapData = proceduralGenerateMap(
    //         initialGameSeed, areaDef.archetype, areaDef.climate, generateHarbor, generateLargeCity,
    //         areaDef.altitude || userSelectedBaseAltitude, forceVolcanicActivity,
    //         zone, region, areaDef.name,
    //         String(gameState.gameDate.year), { isAgricultural, isPastoral, economicActivityLevel: effectiveEconomicLevel }, {},
    //         areaDef.hasLakes
    //     );
        
    //     setMapData(newMapData);
    //     setAnimals(newMapData.animals || []);
    //     setNpcs(newMapData.npcs || []);
    //     setDeployedVessels([]);
    //     setLocalArea(areaDef.name);
    //     setGameState.setCurrentZone(zone);
    //     setGameState.setCurrentRegion(region);

    //     const charContext = { 
    //         date: String(gameState.gameDate.year), 
    //         location: zone, 
    //         region: region
    //     };
    //     const newChar = generateCharacter(charContext);
    //     setPlayerState.setPlayerCharacter(newChar);

    //     const initialPos = setPlayerState.findInitialIconPosition(newMapData.tiles, 'ship');
    //     if (initialPos) {
    //         setPlayerState.setControlledIconX(initialPos.x);
    //         setPlayerState.setControlledIconY(initialPos.y);
    //         setPlayerState.setPlayerMode(initialPos.mode);
    //     }
    //     setGameState.setIsLoading(false);

    // }, [initialGameSeed, mapData, playerState.playerCharacter, isAgricultural, isPastoral, economicActivityLevel]);

    // Map transitions based on world coordinates change
    useEffect(() => {
        // Don't run this effect if we're in a special map (check ref for immediate value)
        if (isSpecialMapRef.current || isSpecialMap) {
            console.log('[useEffect-MapTransition] Skipping map reload - special map is active (ref:', isSpecialMapRef.current, ', state:', isSpecialMap, ')');
            return;
        }

        const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
        const cachedEntry = mapDataCache.get(cacheKey);

        // If the current mapData doesn't match the coordinates, we need to load a new one.
        if (mapData && (mapData.seed !== currentMapSeed)) {
             setGameState.setIsLoading(true);

            if (cachedEntry) {
                setMapData(cachedEntry.mapData);
                setAnimals(cachedEntry.animals);
                setNpcs(cachedEntry.npcs);
                setDeployedVessels(cachedEntry.deployedVessels || []);
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
                    setDeployedVessels(newMapData.deployedVessels);
                    if (playerState.pendingIconTransitionInfo) {
                        validateAndPlacePlayerOnNewMap(newMapData.mapData, playerState.pendingIconTransitionInfo);
                    }
                }
                setGameState.setIsLoading(false);
            }
        }
    }, [currentWorldCoords, gameState.liminalTravelState, mapData, currentMapSeed, mapDataCache, setGameState, setLocalArea, playerState.pendingIconTransitionInfo, generateAndCacheMapInternal, validateAndPlacePlayerOnNewMap, localArea, isSpecialMap]);


    const handleMapTransition = useCallback((direction: AdjacencyDirection, entryX: number, entryY: number) => {
        console.log(`[Map Transition] Initiated. Direction: ${direction}, From: ${localArea}`);
        if (playerState.pendingIconTransitionInfo) {
            console.warn("[Map Transition] Aborted: Icon transition already in progress.");
            return;
        }
        
        // Special handling for ethereal realms - go to random map area
        const etherealRealms = ['Outer Space', 'Heaven', 'Undersea Kingdom', 'Storm Realm', 'Frozen Wastes', 'Typhoon Realm'];
        if (etherealRealms.includes(localArea)) {
            console.log(`[Ethereal Realm] Leaving ${localArea}, transitioning to random area`);
            
            // Get all available map areas except special zones
            const allAreas: string[] = [];
            Object.values(geography).forEach(zone => {
                if (zone && typeof zone === 'object' && !Array.isArray(zone)) {
                    Object.values(zone).forEach(region => {
                        if (region && typeof region === 'object' && !Array.isArray(region)) {
                            Object.values(region).forEach(area => {
                                if (area && typeof area === 'object' && 'name' in area) {
                                    const areaName = (area as any).name;
                                    // Exclude special zones from random selection
                                    if (areaName !== 'Outer Space' && areaName !== 'Heaven' && areaName !== 'Undersea Kingdom') {
                                        allAreas.push(areaName);
                                    }
                                }
                            });
                        }
                    });
                }
            });
            
            // Pick a random area
            const randomArea = allAreas[Math.floor(Math.random() * allAreas.length)];
            console.log(`[Special Zone] Randomly selected: ${randomArea}`);
            setLocalArea(randomArea);
            
            // Place player at center of new map
            setPlayerState.setPendingIconTransitionInfo({
                direction,
                entryX: Math.floor(MAP_WIDTH_TILES / 2),
                entryY: Math.floor(MAP_HEIGHT_TILES / 2),
                fromArea: localArea,
                toArea: randomArea
            });
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
        setDeployedVessels(newMapEntry.deployedVessels);
        const initialPos = setPlayerState.findInitialIconPosition(newMapEntry.mapData.tiles, playerState.playerMode);
        if (initialPos) {
            setPlayerState.setControlledIconX(initialPos.x);
            setPlayerState.setControlledIconY(initialPos.y);
        }
        setGameState.setIsLoading(false);
    }, [mapData, currentMapSeed, userSelectedBaseArchetype, userSelectedBaseClimate, currentWorldCoords, generateAndCacheMapInternal, setPlayerState, playerState.playerMode, setGameState]);

    const onStartNewWorldWithCurrentSettings = useCallback((characterSpec?: any) => {
        // If we already have a map and no explicit character spec, don't regenerate
        if (mapData && !characterSpec) {
            console.log('[onStartNewWorldWithCurrentSettings] Map already exists, skipping regeneration');
            return;
        }
        
        // If we already have a player character and no characterSpec, we're likely being called redundantly
        if (playerState.playerCharacter && !characterSpec) {
            console.log('[onStartNewWorldWithCurrentSettings] Player character already exists without new spec, skipping regeneration');
            return;
        }
        
        // Reset the seed manager with a new seed
        seedManager.reset();
        const seedStr = seedManager.getSeed();
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            const char = seedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const newSeed = Math.abs(hash) % 1000000;
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
        
        // Use the derived map seed that will match currentMapSeed after state updates
        const mapSeedToUse = deriveMapSeed(newSeed, 0, 0);
        
        const newMapData = proceduralGenerateMap(
            mapSeedToUse, 
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
            areaDef.hasLakes,
            areaDef.riverDirection,
            areaDef.bayOutlet,
            areaDef.deltaOutlet
        );
        
        // Extract animals and npcs
        const newAnimals = newMapData.animals || [];
        const newNpcs = newMapData.npcs || [];
        delete newMapData.animals;
        delete newMapData.npcs;
        
        setMapData(newMapData);
        setAnimals(newAnimals);
        setNpcs(newNpcs);
        setDeployedVessels([]);
        
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


    // Special Map Entry/Exit Functions
    const enterSpecialMap = useCallback((config: SpecialMapConfig) => {
        if (!mapData || !playerState.playerCharacter) {
            console.error('[enterSpecialMap] Cannot enter special map without map data or player character');
            return;
        }

        console.log('[enterSpecialMap] ======= SPECIAL MAP ENTRY START =======');
        console.log('[enterSpecialMap] Config:', config);
        console.log('[enterSpecialMap] Current map area:', mapData.mapAreaName);
        console.log('[enterSpecialMap] Current isSpecialMap:', isSpecialMap);
        
        // Set entering flag to prevent edge transitions during the process
        setIsEnteringSpecialMap(true);
        console.log('[enterSpecialMap] Set isEnteringSpecialMap to true');
        
        // Cache the current map state
        const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
        console.log('[enterSpecialMap] Caching current map with key:', cacheKey);
        const currentMapCache = {
            mapData,
            animals,
            npcs,
            deployedVessels,
            seed: currentMapSeed,
            archetype: currentMapArchetype,
            climate: currentMapClimate,
            worldX: currentWorldCoords.x,
            worldY: currentWorldCoords.y,
            region: mapData.region || '',
            localArea: localArea
        };
        
        // Actually add to cache!
        mapDataCache.set(cacheKey, currentMapCache);
        console.log('[enterSpecialMap] Map cached, cache size:', mapDataCache.size);
        
        // Store return data
        setSpecialMapReturnData({
            mapAreaName: localArea,
            returnCoordinates: [playerState.controlledIconX || 0, playerState.controlledIconY || 0],
            originalMapCache: cacheKey
        });

        // Generate the special map
        setGameState.setIsLoading(true);
        
        const specialMapData = generateSpecialMap(
            currentMapSeed + 999, // Different seed for special maps
            config,
            {
                mapAreaName: localArea,
                structureId: config.structureId || 'government_district',
                structureType: 'government_district',
                returnCoordinates: [playerState.controlledIconX || 0, playerState.controlledIconY || 0],
                climate: currentMapClimate  // Pass the current map climate
            }
        );

        // Set the special map data
        console.log('[enterSpecialMap] Setting special map data:', {
            width: specialMapData.width,
            height: specialMapData.height,
            mapType: specialMapData.mapType,
            specialArchetype: specialMapData.specialArchetype,
            tilesLength: specialMapData.tiles?.length,
            firstRowLength: specialMapData.tiles?.[0]?.length,
            seed: specialMapData.seed,
            currentMapSeed: currentMapSeed,
            firstTile: specialMapData.tiles?.[0]?.[0]?.biome
        });
        
        // CRITICAL: Set the ref immediately to prevent the useEffect from running
        isSpecialMapRef.current = true;
        console.log('[enterSpecialMap] Set isSpecialMapRef.current to true IMMEDIATELY');
        
        // Set isSpecialMap state as well
        setIsSpecialMap(true);
        console.log('[enterSpecialMap] Set isSpecialMap to true BEFORE setting map data');
        
        // Now set the map data
        setMapData(specialMapData);
        console.log('[enterSpecialMap] Map data set - special map should now be active');
        console.log('[enterSpecialMap] Special map has', specialMapData.npcs?.length || 0, 'NPCs');
        setSpecialMapInteractionZones(specialMapData.interactionZones || []);
        setSpecialMapExitZones(specialMapData.exitZones || []);
        
        // Set NPCs from special map data
        setAnimals([]); // Clear animals for now
        setNpcs(specialMapData.npcs || []); // Use NPCs from special map
        console.log('[enterSpecialMap] Set', specialMapData.npcs?.length || 0, 'NPCs from special map');
        setDeployedVessels([]);
        
        // Place player at entrance with bounds checking
        const entranceX = Math.min(Math.floor(specialMapData.width / 2), specialMapData.tiles[0]?.length - 1 || 0);
        const entranceY = Math.min(specialMapData.height - 2, specialMapData.tiles.length - 1);
        
        // Ensure position is valid
        if (entranceY >= 0 && entranceY < specialMapData.tiles.length && 
            entranceX >= 0 && entranceX < (specialMapData.tiles[entranceY]?.length || 0)) {
            setPlayerState.setControlledIconX(entranceX);
            setPlayerState.setControlledIconY(entranceY);
        } else {
            // Fallback to map center if entrance position is invalid
            const centerX = Math.floor(specialMapData.width / 2);
            const centerY = Math.floor(specialMapData.height / 2);
            setPlayerState.setControlledIconX(centerX);
            setPlayerState.setControlledIconY(centerY);
            console.warn('[enterSpecialMap] Invalid entrance position, using map center');
        }
        setPlayerState.setPlayerMode('onFoot');
        
        // Clear the entering flag after a short delay to ensure all state updates have propagated
        setTimeout(() => {
            setIsEnteringSpecialMap(false);
        }, 100);
        
        setGameState.setIsLoading(false);
        console.log('[enterSpecialMap] ======= SPECIAL MAP ENTRY COMPLETE =======');
    }, [mapData, playerState, currentWorldCoords, animals, npcs, deployedVessels, 
        currentMapSeed, currentMapArchetype, currentMapClimate, localArea, 
        setGameState, setPlayerState]);

    const exitSpecialMap = useCallback(() => {
        if (!specialMapReturnData || !specialMapReturnData.originalMapCache) {
            console.error('[exitSpecialMap] No return data available');
            return;
        }

        console.log('[exitSpecialMap] Exiting special map, returning to:', specialMapReturnData.mapAreaName);
        
        // Retrieve the cached map
        const cachedEntry = mapDataCache.get(specialMapReturnData.originalMapCache);
        if (cachedEntry) {
            setMapData(cachedEntry.mapData);
            setAnimals(cachedEntry.animals);
            setNpcs(cachedEntry.npcs);
            setDeployedVessels(cachedEntry.deployedVessels);
            setLocalArea(cachedEntry.localArea);
        } else {
            console.warn('[exitSpecialMap] Could not find cached map, generating new map');
            // Fallback: generate a new map at the return location
            onRegenerateMapWithCurrentSettings();
        }
        
        // Restore player position
        setPlayerState.setControlledIconX(specialMapReturnData.returnCoordinates[0]);
        setPlayerState.setControlledIconY(specialMapReturnData.returnCoordinates[1]);
        
        // Clear special map state
        setIsSpecialMap(false);
        isSpecialMapRef.current = false; // Clear the ref as well
        setSpecialMapInteractionZones([]);
        setSpecialMapExitZones([]);
        setSpecialMapReturnData(null);
    }, [specialMapReturnData, mapDataCache, setPlayerState, onRegenerateMapWithCurrentSettings]);

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
        seedManager.reset();
        const seedStr = seedManager.getSeed();
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            const char = seedStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const newSeed = Math.abs(hash) % 1000000;
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
        
        // Use the derived map seed that will match currentMapSeed after state updates
        const mapSeedToUse = deriveMapSeed(newSeed, 0, 0);
        
        const newMapData = proceduralGenerateMap(
            mapSeedToUse, 
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
            foundAreaDef.hasLakes,
            foundAreaDef.riverDirection,
            foundAreaDef.bayOutlet,
            foundAreaDef.deltaOutlet
        );
        
        // Extract animals and npcs before setting map data
        const newAnimals = newMapData.animals || [];
        const newNpcs = newMapData.npcs || [];
        delete newMapData.animals;
        delete newMapData.npcs;
        
        setMapData(newMapData);
        setAnimals(newAnimals);
        setNpcs(newNpcs);
        setDeployedVessels([]);
        setMapDataCache(new Map([[`0,0`, { 
            mapData: newMapData, 
            animals: newAnimals,
            npcs: newNpcs,
            deployedVessels: [],
            seed: mapSeedToUse,
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
        console.log('═══════════════════════════════════════════════════════');
        console.log('[onStartNewWorldAtZoneRegion] CALLED');
        console.log('Zone:', targetZone || '(empty - will randomize)');
        console.log('Region:', targetRegion || '(empty - will randomize)');
        console.log('CharacterSpec:', characterSpec);
        console.log('═══════════════════════════════════════════════════════');
        
        // If both zone and region are empty, generate a completely random world
        if (!targetZone && !targetRegion) {
            console.log('[onStartNewWorldAtZoneRegion] No zone/region specified, generating random world');
            // Directly generate a random world without the checks in onStartNewWorldWithCurrentSettings
            
            // Reset the seed manager with a new seed
            seedManager.reset();
            const seedStr = seedManager.getSeed();
            let hash = 0;
            for (let i = 0; i < seedStr.length; i++) {
                const char = seedStr.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            const newSeed = Math.abs(hash) % 1000000;
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
            
            // Use the derived map seed that will match currentMapSeed after state updates
            const mapSeedToUse = deriveMapSeed(newSeed, 0, 0);
            
            const newMapData = proceduralGenerateMap(
                mapSeedToUse, 
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
                areaDef.hasLakes,
                areaDef.riverDirection,
                areaDef.bayOutlet,
                areaDef.deltaOutlet
            );
            
            // Extract animals and npcs
            const newAnimals = newMapData.animals || [];
            const newNpcs = newMapData.npcs || [];
            delete newMapData.animals;
            delete newMapData.npcs;
            
            setMapData(newMapData);
            setAnimals(newAnimals);
            setNpcs(newNpcs);
            setDeployedVessels([]);
            
            // Cache the generated map
            setMapDataCache(new Map([[`0,0`, { 
                mapData: newMapData, 
                animals: newAnimals,
                npcs: newNpcs,
                deployedVessels: [],
                seed: mapSeedToUse,
                archetype: areaDef.archetype, 
                climate: areaDef.climate,
                worldX: 0,
                worldY: 0,
                region: region,
                localArea: areaDef.name
            }]]));
            
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
                console.error('[onStartNewWorldAtZoneRegion] Failed to generate character with spec, falling back to random:', error);
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
            return;
        }
        
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
    }, [onStartNewWorldWithCurrentSettings, onStartNewWorldAtLocation, _selectRandomMapArea, 
        setPlayerState, setGameState, generateHarbor, generateLargeCity, userSelectedBaseAltitude,
        forceVolcanicActivity, gameState.gameDate.year, isAgricultural, isPastoral, economicActivityLevel]);

    const updateStructureData = useCallback((structureId: string, updatedData: Partial<TerrainStructure>) => {
        // Don't modify special maps
        if (isSpecialMap) {
            console.log('[updateStructureData] Blocked - special map active');
            return;
        }
        
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
    }, [currentWorldCoords, mapDataCache, isSpecialMap]);

    const deployVesselToMap = useCallback((vesselItem: Item, playerX: number, playerY: number): { success: boolean, vesselPosition?: { x: number, y: number } } => {
        if (!mapData) return { success: false };

        // Find nearest water tile within 5 tiles of player
        const findNearestWaterTile = (startX: number, startY: number): { x: number, y: number } | null => {
            console.log(`[deployVesselToMap] Searching for water near player at (${startX}, ${startY})`);
            
            // Check all tiles within 5 tile radius, starting from closest
            const candidates: { x: number, y: number, distance: number }[] = [];
            
            for (let dx = -5; dx <= 5; dx++) {
                for (let dy = -5; dy <= 5; dy++) {
                    const x = startX + dx;
                    const y = startY + dy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Skip if too far or same tile as player
                    if (distance > 5 || distance === 0) continue;
                    
                    if (x >= 0 && x < MAP_WIDTH_TILES && y >= 0 && y < MAP_HEIGHT_TILES) {
                        const tile = mapData.tiles[y]?.[x];
                        console.log(`[deployVesselToMap] Checking tile (${x}, ${y}): isLand=${tile?.isLand}, biome=${tile?.biome}`);
                        
                        if (tile && !tile.isLand) {
                            // Check if spot is already occupied by another vessel
                            const isOccupied = deployedVessels.some(v => v.x === x && v.y === y);
                            if (!isOccupied) {
                                candidates.push({ x, y, distance });
                            } else {
                                console.log(`[deployVesselToMap] Water tile at (${x}, ${y}) is occupied by another vessel`);
                            }
                        }
                    }
                }
            }
            
            if (candidates.length > 0) {
                // Sort by distance and return the closest
                candidates.sort((a, b) => a.distance - b.distance);
                const chosen = candidates[0];
                console.log(`[deployVesselToMap] Found ${candidates.length} water tiles, choosing closest at (${chosen.x}, ${chosen.y}) distance ${chosen.distance.toFixed(2)}`);
                return { x: chosen.x, y: chosen.y };
            }
            
            console.log('[deployVesselToMap] No water tiles found in search area');
            return null;
        };

        const waterPosition = findNearestWaterTile(playerX, playerY);
        if (!waterPosition) {
            console.warn('[deployVesselToMap] No suitable water tile found within 5 tiles');
            return { success: false };
        }

        // Create deployed vessel
        const deployedVessel: DeployedVessel = {
            id: `vessel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vesselItem,
            x: waterPosition.x,
            y: waterPosition.y,
            deployedAt: Date.now(),
            condition: 100,
            isAvailable: true
        };

        // Add to current map
        setDeployedVessels(prevVessels => [...prevVessels, deployedVessel]);

        // Update cache
        const cacheKey = `${currentWorldCoords.x},${currentWorldCoords.y}`;
        const cachedEntry = mapDataCache.get(cacheKey);
        if (cachedEntry) {
            const updatedVessels = [...cachedEntry.deployedVessels, deployedVessel];
            setMapDataCache(prevCache => new Map(prevCache).set(cacheKey, { 
                ...cachedEntry, 
                deployedVessels: updatedVessels 
            }));
        }

        console.log(`[deployVesselToMap] Deployed ${vesselItem.name} at (${waterPosition.x}, ${waterPosition.y})`);
        return { success: true, vesselPosition: { x: waterPosition.x, y: waterPosition.y } };
    }, [mapData, deployedVessels, currentWorldCoords, mapDataCache]);

    return {
        mapData, setMapData,
        animals, setAnimals,
        npcs, setNpcs,
        deployedVessels, setDeployedVessels,
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
        deployVesselToMap,
        pendingScenarioData,
        setPendingScenarioData,
        
        // Special map functions
        enterSpecialMap,
        exitSpecialMap,
        isSpecialMap,
        isEnteringSpecialMap,
        specialMapInteractionZones,
        specialMapExitZones,
    };
};