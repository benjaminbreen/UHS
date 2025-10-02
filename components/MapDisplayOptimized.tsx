/**
 * MapDisplayOptimized - Performance-optimized version of MapDisplay
 * This addresses the critical performance issues by replacing the expensive canvas rendering
 * with the MapCanvasPerformance component and optimized dependency management
 */

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import * as ReactDOM from 'react-dom';
import { MapData, Tile, BiomeType, ClimateType, DevTooltipDisplayData, AnimalEntity, NpcEntity, VegetationEntity, LensMode, TerrainStructure, Season, PlayerCharacter, HistoricalEra, DeployedVessel, PathType } from '../types/index';
import { useUnifiedAnimations, ENABLE_UNIFIED_ANIMATIONS } from '../hooks/useUnifiedAnimations';
import { loadTamedAnimals, TamedAnimal } from '../services/animalTamingService';
import { fireService } from '../services/fireService';
import { isMobileDevice } from '../utils/deviceUtils';
import MobileControls from './mobile/MobileControls';
import MobileHeader from './mobile/MobileHeader';
import MobileQuickStats from './mobile/MobileQuickStats';
import MobileSidebar from './mobile/MobileSidebar';
import { 
    TILE_SIZE_PX as TILE_SIZE_PX_CONST,
    MAP_WIDTH_TILES, 
    MAP_HEIGHT_TILES,
    STRUCTURE_BLUEPRINTS,
    METALS
} from '../constants/index';
import { ANIMAL_DATA } from '../constants/gameData/animals';
import { ValueNoise } from '../utils/noise'; 
import { interpolateColor, getLensColor, getMineralColor } from '../utils/colorUtils';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { selectBuilding } from '../utils/buildingSelectionSystem';
import { getLocationCulturalStyle } from '../utils/culturalMappingUtils';
import { CliffSymbol, PineTreeSymbol, PalmTreeSymbol, DeciduousTreeSymbol, CactusSymbol, BushSymbol, PlayerIcon, ShipIcon, FarmSymbol, NpcIcon, EstuarySymbol, HillSymbol, MarketplaceSymbol, MangroveSymbol, SaltFlatsSymbol, CoralReefSymbol, FishingHutSymbol, SteamSymbol, GovernmentDistrictSymbol, FireflySymbol, MineralGlintSymbol, OasisSymbol, PlazaSymbol, ParkSymbol, HarborDistrictSymbol, IndustrialDistrictSymbol, PaddockSymbol, LavaSymbol, LavaSymbolCSS, MountainSymbol, SnowSymbol, BridgeSymbol } from './symbols';
import DugEarthSymbol from './symbols/DugEarthSymbol';
import RuinsSymbolNew from './symbols/ruins/RuinsSymbolNew';
import VesselSymbol from './symbols/VesselSymbol';
import SpaceSymbol from './symbols/SpaceSymbol';
import UnderseaSymbol from './symbols/UnderseaSymbol';
import CloudSymbol from './symbols/CloudSymbol';
import ShipTooltip from './ShipTooltip';
import PlayerTooltip from './PlayerTooltip';
import { StairsUpPixel } from './symbols/architecture/specialMap/StairsUpPixel';
import TrainSymbol from './symbols/TrainSymbol';
import LumberCampSymbol from './symbols/structures/LumberCampSymbol';
import NpcAlertIndicator from './NpcAlertIndicator';
import UrbanSymbol from './symbols/UrbanSymbolSimplified';
import { getPalaceSymbol } from './symbols/poi/PalaceSymbolsImproved';
import { getHolySiteSymbol } from './symbols/poi/getHolySiteSymbol';
import SimpleBoatSymbol from './symbols/SimpleBoatSymbol';
import { simpleBoatService } from '../services/simpleBoatService';
import { 
  PlantationSymbol, 
  WarehouseSymbol, 
  ManufactorySymbol, 
  RefinerySymbol, 
  Factory19thSymbol, 
  Factory20thSymbol 
} from './symbols/factories/FactorySymbols';
import { getMillSymbol } from './symbols/mills/MillSymbols';
import { getMineSymbol } from './symbols/mines/MineSymbols';
import { getQuarrySymbol } from './symbols/quarries/QuarrySymbols';
import { getFortressSymbol } from './symbols/fortresses/FortressSymbolsImproved';
import { SpecialMapSymbolRenderer } from './symbols/specialMap/SpecialMapSymbolRenderer';
import { OverlayRenderer } from './symbols/architecture/specialMap/OverlayRenderer';
import { MultiTilePillar } from './symbols/architecture/specialMap/MultiTilePillar';
import {
  CityHallSymbol,
  TribalCouncilSymbol,
  MandateHallSymbol,
  CaliphCourtSymbol,
  ColonialOfficeSymbol,
  RomanForumSymbol
} from './symbols/government/GovernmentSymbolsImproved';
// import CoastlineOverlay from './CoastlineOverlay'; // Removed - using context-aware enhancements instead
import Minimap from './Minimap';
import MapCanvasPerformance from './MapCanvasPerformance';
import POIHoverTooltip from './POIHoverTooltip';
import TileHoverTooltip from './TileHoverTooltip';
import QuestMarkers from './QuestMarkers';
import { NpcHelperOverlay } from './NpcHelperModeHandler';
import { getHelperMode } from '../services/npcHelperService';
import { getSafariOptimizedClassName, getSafariOptimizedStyle, getSafariGPUStyle, getSafariOptimizedTransform, isSafari } from '../utils/safariUtils';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;
const ICON_ANIMATION_DURATION = 200; // Back to 200ms for smoother, more controlled animation

// Safari optimization: Start more zoomed in to render fewer tiles
const isSafariBrowser = isSafari(); // Call the function from safariUtils
const INITIAL_ZOOM_LEVEL = isSafariBrowser ? 2.5 : 2;

type PlayerMode = 'ship' | 'onFoot';

// Helper function to get bounding box of an SVG path for viewport culling
function getPathBounds(svgD: string): { minX: number, minY: number, maxX: number, maxY: number } | null {
  const numbers = svgD.match(/[\d.-]+/g);
  if (!numbers || numbers.length < 2) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = parseFloat(numbers[i]);
    const y = parseFloat(numbers[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  
  return { minX, minY, maxX, maxY };
}

// Simple check if path crosses water (for bridge rendering)
function pathCrossesWater(pathD: string, tiles: Tile[][]): boolean {
  const numbers = pathD.match(/[\d.-]+/g);
  if (!numbers || numbers.length < 2) return false;
  
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = Math.floor(parseFloat(numbers[i]) / TILE_SIZE_PX_CONST);
    const y = Math.floor(parseFloat(numbers[i + 1]) / TILE_SIZE_PX_CONST);
    
    if (x >= 0 && x < MAP_WIDTH_TILES && y >= 0 && y < MAP_HEIGHT_TILES) {
      const tile = tiles[y][x];
      if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
        return true;
      }
    }
  }
  return false;
}

// Enhanced memoized components for better performance
const MemoizedDustEffect = memo<{x: number, y: number, size: number, seed: number}>(({ x, y, size, seed }) => {
    const localRand = useMemo(() => new ValueNoise(seed + x * 73 + y * 97).random, [seed, x, y]);
    
    const dustParticles = useMemo(() => {
        const particles = [];
        const numParticles = 3 + Math.floor(localRand() * 3); // 3-5 particles
        
        for (let i = 0; i < numParticles; i++) {
            const particleX = x + localRand() * size;
            const particleY = y + localRand() * size;
            const particleSize = 2 + localRand() * 2; // 2-4px
            const animationDelay = localRand() * 5; // Random delay up to 5s
            const driftDistance = 10 + localRand() * 20; // 10-30px drift
            
            particles.push(
                <circle
                    key={`dust-${i}`}
                    cx={particleX}
                    cy={particleY}
                    r={particleSize}
                    fill="rgba(210, 180, 140, 0.4)" // Tan color with transparency
                    className="animate-dust-drift"
                    style={{
                        '--delay': `${animationDelay}s`,
                        '--drift': `${driftDistance}px`,
                        '--duration': `${8 + localRand() * 4}s`, // 8-12s duration
                        ...getSafariGPUStyle(getSafariOptimizedStyle({ filter: 'blur(0.5px)' })),
                    } as React.CSSProperties}
                />
            );
        }
        return particles;
    }, [localRand, x, y, size]);
    
    return <g opacity="0.6">{dustParticles}</g>;
}, (prev, next) => prev.x === next.x && prev.y === next.y && prev.size === next.size && prev.seed === next.seed);

const MemoizedSnowEffect = memo<{x: number, y: number, size: number, seed: number}>(({ x, y, size, seed }) => {
    const localRand = useMemo(() => new ValueNoise(seed + x * 45 + y * 67).random, [seed, x, y]);
    
    const snowflakes = useMemo(() => {
        const flakes = [];
        const numFlakes = 4 + Math.floor(localRand() * 4);
        
        for (let i = 0; i < numFlakes; i++) {
            flakes.push(
                <circle
                    key={`snowflake-${i}`}
                    cx={x + localRand() * size}
                    cy={y + localRand() * size}
                    r={size * 0.02}
                    fill="rgba(255,255,255,0.9)"
                    className="animate-snow"
                    style={{
                        '--delay': i,
                        ...getSafariGPUStyle(getSafariOptimizedStyle({ filter: 'blur(0.5px) drop-shadow(0 0 1px rgba(255,255,255,0.8))' })),
                    } as React.CSSProperties}
                />
            );
        }
        return flakes;
    }, [localRand, x, y, size]);
    
    return <g opacity="0.95">{snowflakes}</g>;
}, (prev, next) => prev.x === next.x && prev.y === next.y && prev.size === next.size && prev.seed === next.seed);

// RAF throttle with better performance
const rafThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 0
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;
  let lastTime = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = performance.now();
    if (now - lastTime >= delay) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        lastTime = now;
        rafId = null;
      });
    }
  };
};

// Optimized easing function - linear for most predictable movement
const easeInOutCubic = (t: number): number => {
  // Using linear interpolation for consistent, predictable movement
  return t;
};

interface MapDisplayOptimizedProps {
  mapData: MapData | null;
  currentMapSeed?: string | null;
  animals: AnimalEntity[];
  npcs: NpcEntity[];
  deployedVessels: DeployedVessel[];
  onDevHover: (data: DevTooltipDisplayData | null) => void;
  onDevCommandClick: (data: DevTooltipDisplayData) => void;
  onStructureClick: (structure: TerrainStructure) => void;
  onPoiClick: (poi: TerrainStructure) => void;
  onSettlementClick: (tile: Tile) => void;
  onVesselClick?: (vessel: DeployedVessel) => void;
  onPlayerMove?: (dx: number, dy: number) => void;
  activeLens: LensMode;
  logicalControlledIconX: number | null; 
  logicalControlledIconY: number | null; 
  onIconAnimationComplete: () => void;
  currentVessel?: Item | null;
  playerMode: PlayerMode;
  shipDockX: number | null;
  shipDockY: number | null;
  onAnimalClick: (animal: AnimalEntity) => void;
  onNpcClick: (npc: NpcEntity) => void;
  selectedAnimalId?: string | null;
  selectedNpcId?: string | null;
  formattedDate: string;
  season: Season;
  currentLocation: string;
  iconRotation: number;
  velocity: { x: number; y: number };
  playerCharacter: PlayerCharacter | null;
  gameTimeHours: number;
  gameTimeMinutes: number;
  debugSettings?: {
    showFPS: boolean;
    showRenderCount: boolean;
    disableBlurEffects: boolean;
    disableAnimations: boolean;
    disableShadows: boolean;
    disableParticles: boolean;
    reduceSVGComplexity: boolean;
    disableCanvasSmoothing: boolean;
    throttleAnimationFPS: boolean;
    showMemoryUsage: boolean;
    logPerformanceMetrics: boolean;
  };
  onPlayerIconClick?: () => void;
  onShipClick?: () => void;
  onCompanionClick?: (animal: TamedAnimal) => void;
  onMapEdgeCrossing?: (direction: 'north' | 'south' | 'east' | 'west') => void;
  isSpecialMap?: boolean;
  guardAlerts?: Map<string, 'detecting' | 'warning' | 'pursuing'>;
  onContainerClick?: (x: number, y: number, tile: Tile) => void;
}

export const MapDisplayOptimized: React.FC<MapDisplayOptimizedProps> = ({
  mapData,
  currentMapSeed,
  animals,
  npcs,
  deployedVessels,
  onDevHover,
  onDevCommandClick, 
  onStructureClick,
  onPoiClick,
  onSettlementClick,
  onVesselClick,
  onPlayerMove,
  activeLens, 
  logicalControlledIconX, 
  logicalControlledIconY,
  onIconAnimationComplete,
  currentVessel,
  playerMode,
  shipDockX,
  shipDockY,
  onAnimalClick,
  onNpcClick,
  selectedAnimalId,
  selectedNpcId,
  formattedDate,
  season,
  currentLocation,
  iconRotation,
  velocity,
  playerCharacter,
  gameTimeHours,
  gameTimeMinutes,
  debugSettings,
  onPlayerIconClick,
  onShipClick,
  onCompanionClick,
  onMapEdgeCrossing,
  isSpecialMap = false,
  guardAlerts,
  onContainerClick
}) => {
  // State management with performance considerations
  // Start zoomed out for the zoom-in animation
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM_LEVEL * 0.7);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isFreePanMode, setIsFreePanMode] = useState(false);
  
  // POI hover state
  const [hoveredPOI, setHoveredPOI] = useState<TerrainStructure | null>(null);
  const [hoveredPOICoords, setHoveredPOICoords] = useState<{x: number, y: number} | null>(null);

  // Hover tooltip state for tiles (farms and urban areas)
  const [hoveredTile, setHoveredTile] = useState<Tile | null>(null);
  const [hoveredTileCoords, setHoveredTileCoords] = useState<{ x: number, y: number } | null>(null);
  
  // Ship tooltip state
  const [showShipTooltip, setShowShipTooltip] = useState(false);
  const [shipTooltipPos, setShipTooltipPos] = useState({ x: 0, y: 0 });

  // Player tooltip state
  const [showPlayerTooltip, setShowPlayerTooltip] = useState(false);
  const [playerTooltipPos, setPlayerTooltipPos] = useState({ x: 0, y: 0 });

  // NPC/Animal hover state
  const [hoveredNPC, setHoveredNPC] = useState<NpcEntity | null>(null);
  const [hoveredAnimal, setHoveredAnimal] = useState<AnimalEntity | null>(null);
  const [hoveredEntityCoords, setHoveredEntityCoords] = useState<{x: number, y: number} | null>(null);
  
  // Simple boat state - just a trigger for re-render
  const [boatTick, setBoatTick] = useState(0);

  // Helper functions for hostile detection
  const isNpcHostile = (npc: NpcEntity): boolean => {
    return npc.isHostile === true ||
           npc.aiState === 'hostile_fleeing' ||
           npc.aiState === 'attacking_chasing';
  };

  const isNpcAlert = (npc: NpcEntity): boolean => {
    // NPCs on patrol or investigating are alert but not hostile
    return npc.patrolRoute !== undefined && npc.patrolRoute.length > 0;
  };

  const isAnimalHostile = (animal: AnimalEntity): boolean => {
    return animal.aiState === 'attacking' ||
           animal.aiState === 'chasing' ||
           animal.aiState === 'stalking';
  };

  const isAnimalAlert = (animal: AnimalEntity): boolean => {
    return animal.aiState === 'investigating' ||
           animal.aiState === 'patrolling' ||
           animal.aiState === 'tracking';
  };
  
  // Debounce timers for hover tooltips
  const hoverDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingHoverData = useRef<{
    npc?: NpcEntity | null;
    animal?: AnimalEntity | null;
    tile?: Tile | null;
    poi?: TerrainStructure | null;
    coords?: { x: number; y: number } | null;
    structure?: TerrainStructure | null;
    vegetation?: VegetationEntity | null;
    deployedVessel?: DeployedVessel | null;
  }>({});
  
  // Refs for performance
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const animationStartTime = useRef<number | null>(null);
  const animationStartX = useRef<number | null>(null);
  const animationStartY = useRef<number | null>(null);
  const prevMapDataRef = useRef<MapData | null>(null);
  const hasCenteredOnCurrentMap = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const cameraAnimationFrame = useRef<number | null>(null);
  const targetPanX = useRef(0);
  const targetPanY = useRef(0);

  // Refs for direct transform manipulation to optimize dragging
  const currentPanX = useRef(panX);
  const currentPanY = useRef(panY);

  // Performance optimization: track if transform needs updating
  const transformDirty = useRef(false);
  const lastTransform = useRef<string>('');

  // Display state
  const [displayPixelIconX, setDisplayPixelIconX] = useState<number | null>(null);
  const [displayPixelIconY, setDisplayPixelIconY] = useState<number | null>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavSpeed, setMobileNavSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mobileControlMode, setMobileControlMode] = useState<'camera' | 'player'>('player');
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [lastMoveDirection, setLastMoveDirection] = useState<{x: number, y: number}>({ x: 0, y: -1 });

  const [fireUpdateTrigger, setFireUpdateTrigger] = useState(0); // Force re-render when fires change

  // Camera smoothing callback for unified animations
  const handleUnifiedCameraSmooth = useCallback((deltaTime: number) => {
    if (!containerRef.current || !mapData) return;

    const CAMERA_SMOOTH_FACTOR = 0.08;
    const CAMERA_SNAP_THRESHOLD = 0.1;

    let focusX: number | null = null;
    let focusY: number | null = null;

    if (displayPixelIconX !== null && displayPixelIconY !== null) {
      focusX = displayPixelIconX;
      focusY = displayPixelIconY;
    }

    if (focusX !== null && focusY !== null && !isDragging && !isFreePanMode) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const margin = 4 * TILE_SIZE_PX * zoomLevel;
      const deadZoneXMin = Math.min(margin, containerWidth * 0.4);
      const deadZoneXMax = Math.max(containerWidth - margin, containerWidth * 0.6);
      const deadZoneYMin = Math.min(margin, containerHeight * 0.4);
      const deadZoneYMax = Math.max(containerHeight - margin, containerHeight * 0.6);

      const focusScreenX = focusX * zoomLevel + currentPanX.current;
      const focusScreenY = focusY * zoomLevel + currentPanY.current;

      let newTargetPanX = targetPanX.current;
      let newTargetPanY = targetPanY.current;

      if (focusScreenX < deadZoneXMin) newTargetPanX = deadZoneXMin - focusX * zoomLevel;
      else if (focusScreenX > deadZoneXMax) newTargetPanX = deadZoneXMax - focusX * zoomLevel;
      if (focusScreenY < deadZoneYMin) newTargetPanY = deadZoneYMin - focusY * zoomLevel;
      else if (focusScreenY > deadZoneYMax) newTargetPanY = deadZoneYMax - focusY * zoomLevel;

      targetPanX.current = newTargetPanX;
      targetPanY.current = newTargetPanY;
    }

    const deltaX = targetPanX.current - currentPanX.current;
    const deltaY = targetPanY.current - currentPanY.current;

    if (!isDragging && !isFreePanMode && (Math.abs(deltaX) > CAMERA_SNAP_THRESHOLD || Math.abs(deltaY) > CAMERA_SNAP_THRESHOLD)) {
      currentPanX.current += deltaX * CAMERA_SMOOTH_FACTOR;
      currentPanY.current += deltaY * CAMERA_SMOOTH_FACTOR;

      // Add translate3d for Safari GPU acceleration
      const newTransform = `translate3d(${currentPanX.current}px, ${currentPanY.current}px, 0) scale(${zoomLevel})`;
      if (svgRef.current) {
        svgRef.current.style.transform = newTransform;
        // Safari optimization for smooth zoom/pan
        svgRef.current.style.webkitTransform = newTransform;
        svgRef.current.style.willChange = 'transform';
      }
      if (canvasRef.current) {
        canvasRef.current.style.transform = newTransform;
        // Safari optimization for smooth zoom/pan
        canvasRef.current.style.webkitTransform = newTransform;
        canvasRef.current.style.willChange = 'transform';
      }
    }
  }, [displayPixelIconX, displayPixelIconY, isDragging, isFreePanMode, zoomLevel, mapData]);

  // Unified Animation System Integration
  const unifiedAnimations = useUnifiedAnimations({
    componentId: 'map-display',

    // Fire updates
    onFireUpdate: useCallback(() => {
      setFireUpdateTrigger(prev => prev + 1);
    }, []),

    // Boat updates
    onBoatUpdate: useCallback(() => {
      setBoatTick(prev => prev + 1);
    }, []),

    // Camera smoothing (now connected)
    onCameraSmooth: ENABLE_UNIFIED_ANIMATIONS ? handleUnifiedCameraSmooth : undefined,
    cameraTargetX: targetPanX.current,
    cameraTargetY: targetPanY.current,

    // Player movement detection
    playerMoving: false, // Will be updated based on movement
  });

  // Load tamed animals on mount and when player position changes
  useEffect(() => {
    const animals = loadTamedAnimals();
    setTamedAnimals(animals);
  }, [logicalControlledIconX, logicalControlledIconY]);

  // Listen for fire changes and batch updates with RAF (OLD SYSTEM - disabled if unified enabled)
  useEffect(() => {
    if (ENABLE_UNIFIED_ANIMATIONS) return; // Skip if using unified system
    let rafId: number | null = null;
    let pendingUpdate = false;
    
    // Batch fire updates using requestAnimationFrame
    const batchedFireUpdate = () => {
      if (!pendingUpdate) return;
      pendingUpdate = false;
      setFireUpdateTrigger(prev => prev + 1);
    };
    
    // Subscribe to fire changes
    const unsubscribe = fireService.onFireChange(() => {
      pendingUpdate = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(batchedFireUpdate);
    });
    
    // Also update periodically for animation (reduced frequency with RAF batching)
    const fireUpdateInterval = setInterval(() => {
      // Force re-render if there are active fires for animation
      if (fireService.getAllFires().length > 0) {
        pendingUpdate = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(batchedFireUpdate);
      }
    }, 1000); // Reduced to once per second since RAF handles smoother updates
    
    return () => {
      clearInterval(fireUpdateInterval);
      if (rafId !== null) cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, []);
  
  // Track player movement direction
  const prevPlayerPos = useRef({ x: logicalControlledIconX, y: logicalControlledIconY });
  useEffect(() => {
    if (logicalControlledIconX !== null && logicalControlledIconY !== null &&
        prevPlayerPos.current.x !== null && prevPlayerPos.current.y !== null) {
      const dx = logicalControlledIconX - (prevPlayerPos.current.x || 0);
      const dy = logicalControlledIconY - (prevPlayerPos.current.y || 0);
      
      if (dx !== 0 || dy !== 0) {
        // Normalize the direction
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
          setLastMoveDirection({ x: dx / length, y: dy / length });
        }
      }
      
      prevPlayerPos.current = { x: logicalControlledIconX, y: logicalControlledIconY };
    }
  }, [logicalControlledIconX, logicalControlledIconY]);
  
  // Memoized noise generators - OPTIMIZED: Only recreate when mapData.seed changes
  const noiseGenerators = useMemo(() => {
    // Always return the same structure to avoid hooks count mismatch
    if (!mapData) {
      return {
        shoreline: null,
        cactusPlacement: null,
        ambientDetail: null,
        shoalBlend: null,
        watercolorEdge: null
      };
    }
    return {
      shoreline: new ValueNoise(mapData.seed + 300),
      cactusPlacement: new ValueNoise(mapData.seed + 200),
      ambientDetail: new ValueNoise(mapData.seed + 150),
      shoalBlend: new ValueNoise(mapData.seed + 400),
      watercolorEdge: new ValueNoise(mapData.seed + 999)
    };
  }, [mapData?.seed]);

  // Memoized flattened tiles array - PERFORMANCE: Avoid flattening 10k elements 14x per render
  const flatTiles = useMemo(() => {
    return mapData?.tiles?.flat() || [];
  }, [mapData?.tiles]);

  // Memoized filter operations - PERFORMANCE: Avoid filtering 10k elements every render
  const desertParticleTiles = useMemo(() => {
    if (!mapData?.seed) return [];
    return flatTiles
      .filter(tile => tile.biome === BiomeType.DESERT && tile.isLand)
      .filter(tile => (tile.x + tile.y * 7 + mapData.seed) % 5 === 0);
  }, [flatTiles, mapData?.seed]);

  const snowEffectTiles = useMemo(() => {
    if (!mapData?.seed) return [];
    return flatTiles.filter(tile =>
      (tile.biome === BiomeType.SNOW || tile.biome === BiomeType.TUNDRA) &&
      tile.isLand &&
      (tile.x + tile.y * 11 + mapData.seed) % 3 === 0
    );
  }, [flatTiles, mapData?.seed]);

  const mountainTiles = useMemo(() => {
    return flatTiles.filter(tile =>
      tile.biome === BiomeType.MOUNTAIN ||
      tile.biome === BiomeType.HIGH_PEAK
    );
  }, [flatTiles]);

  const waterTiles = useMemo(() => {
    return flatTiles.filter(tile => !tile.isLand);
  }, [flatTiles]);

  const overlayTiles = useMemo(() => {
    return flatTiles.filter(tile => tile.overlayObject);
  }, [flatTiles]);

  const lightSourceTiles = useMemo(() => {
    return flatTiles.filter(tile =>
      tile.biome === BiomeType.TORCH ||
      tile.biome === BiomeType.BRAZIER ||
      tile.biome === BiomeType.FIRE_PIT ||
      tile.biome === BiomeType.HEARTH ||
      tile.biome === BiomeType.CHANDELIER ||
      tile.biome === BiomeType.LANTERN ||
      (tile.overlayObject?.type && ['CANDELABRA', 'TORCH', 'BRAZIER'].includes(tile.overlayObject.type.toString()))
    );
  }, [flatTiles]);



  // Sync state with refs for panning
  useEffect(() => {
    currentPanX.current = panX;
    currentPanY.current = panY;
  }, [panX, panY]);

  // Container dimension tracking with debounce and mobile detection
  useEffect(() => {
    let timeoutId: number;
    const updateDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setContainerDimensions({ width: rect.width, height: rect.height });
        }
        // Check if mobile based on screen size, touch capability, or lack of mouse
        const isMobileDevice = window.innerWidth <= 768 || 
                              ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) ||
                              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                              (!window.matchMedia || window.matchMedia("(pointer: coarse)").matches);
        setIsMobile(isMobileDevice);
      }, 100);
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (mapData) {
        setCanvasSize({
            width: mapData.width * TILE_SIZE_PX,
            height: mapData.height * TILE_SIZE_PX,
        });
        
        // Reset and initialize simple boat service for new map
        simpleBoatService.reset();
        simpleBoatService.initialize(mapData);

        // Update boat position smoothly but infrequently (OLD SYSTEM - disabled if unified enabled)
        if (!ENABLE_UNIFIED_ANIMATIONS) {
          const boatInterval = setInterval(() => {
            simpleBoatService.update();
            setBoatTick(prev => prev + 1); // Just trigger a re-render
          }, 500); // Update twice per second for smoother movement

          return () => {
            clearInterval(boatInterval);
            simpleBoatService.reset(); // Clean up on unmount
          };
        } else {
          // Unified system handles boat updates
          simpleBoatService.reset();
        }
    }
  }, [mapData, isMobile]);

  // When player moves, disable free pan to re-engage camera follow
  useEffect(() => {
    if (logicalControlledIconX !== null || logicalControlledIconY !== null) {
      setIsFreePanMode(false);
    }
  }, [logicalControlledIconX, logicalControlledIconY]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (hoverDebounceTimer.current) {
        clearTimeout(hoverDebounceTimer.current);
      }
    };
  }, []);

  // Refactored smooth camera loop for performance
  useEffect(() => {
    const CAMERA_SMOOTH_FACTOR = 0.08;
    const CAMERA_SNAP_THRESHOLD = 0.1;

    // OLD SYSTEM - disabled if unified animations enabled
    if (ENABLE_UNIFIED_ANIMATIONS) {
      // Camera smoothing is handled by unified animation system
      return () => {};
    }

    let isLooping = true;
    let lastFrameTime = 0;
    const frameInterval = debugSettings?.throttleAnimationFPS ? 33 : 0; // 30fps = ~33ms per frame

    const smoothCameraLoop = (timestamp?: number) => {
        if (!isLooping || !containerRef.current || !mapData) return;

        // Throttle frame rate if enabled
        if (frameInterval > 0 && timestamp) {
            if (timestamp - lastFrameTime < frameInterval) {
                cameraAnimationFrame.current = requestAnimationFrame(smoothCameraLoop);
                return;
            }
            lastFrameTime = timestamp;
        }

        let focusX: number | null = null;
        let focusY: number | null = null;

        if (displayPixelIconX !== null && displayPixelIconY !== null) {
            focusX = displayPixelIconX;
            focusY = displayPixelIconY;
        }

        if (focusX !== null && focusY !== null && !isDragging && !isFreePanMode) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const margin = 4 * TILE_SIZE_PX * zoomLevel;
            const deadZoneXMin = Math.min(margin, containerWidth * 0.4);
            const deadZoneXMax = Math.max(containerWidth - margin, containerWidth * 0.6);
            const deadZoneYMin = Math.min(margin, containerHeight * 0.4);
            const deadZoneYMax = Math.max(containerHeight - margin, containerHeight * 0.6);

            const focusScreenX = focusX * zoomLevel + currentPanX.current;
            const focusScreenY = focusY * zoomLevel + currentPanY.current;

            let newTargetPanX = targetPanX.current;
            let newTargetPanY = targetPanY.current;

            if (focusScreenX < deadZoneXMin) newTargetPanX = deadZoneXMin - focusX * zoomLevel;
            else if (focusScreenX > deadZoneXMax) newTargetPanX = deadZoneXMax - focusX * zoomLevel;
            if (focusScreenY < deadZoneYMin) newTargetPanY = deadZoneYMin - focusY * zoomLevel;
            else if (focusScreenY > deadZoneYMax) newTargetPanY = deadZoneYMax - focusY * zoomLevel;

            targetPanX.current = newTargetPanX;
            targetPanY.current = newTargetPanY;
        }

        const deltaX = targetPanX.current - currentPanX.current;
        const deltaY = targetPanY.current - currentPanY.current;

        // Performance: only update DOM if actually moving
        const isMoving = Math.abs(deltaX) > CAMERA_SNAP_THRESHOLD || Math.abs(deltaY) > CAMERA_SNAP_THRESHOLD;

        if (!isDragging && !isFreePanMode && isMoving) {
            currentPanX.current += deltaX * CAMERA_SMOOTH_FACTOR;
            currentPanY.current += deltaY * CAMERA_SMOOTH_FACTOR;

            // Add translate3d for Safari GPU acceleration
            const newTransform = `translate3d(${currentPanX.current}px, ${currentPanY.current}px, 0) scale(${zoomLevel})`;

            // Performance: only update DOM if transform actually changed
            if (newTransform !== lastTransform.current) {
                lastTransform.current = newTransform;
                if (svgRef.current) svgRef.current.style.transform = newTransform;
                if (canvasRef.current) canvasRef.current.style.transform = newTransform;
            }

            // Continue animating
            cameraAnimationFrame.current = requestAnimationFrame(smoothCameraLoop);
        } else if (!isDragging && !isFreePanMode) {
            // Snap to final position
            currentPanX.current = targetPanX.current;
            currentPanY.current = targetPanY.current;

            if (panX !== targetPanX.current || panY !== targetPanY.current) {
                setPanX(targetPanX.current);
                setPanY(targetPanY.current);
            }

            // Performance: Stop RAF loop when not moving (will restart on next dependency change)
            isLooping = false;
        } else if (isMoving) {
            // Continue animating if still moving
            cameraAnimationFrame.current = requestAnimationFrame(smoothCameraLoop);
        }
    };
    
    cameraAnimationFrame.current = requestAnimationFrame(smoothCameraLoop);

    return () => {
        isLooping = false;
        if (cameraAnimationFrame.current) {
            cancelAnimationFrame(cameraAnimationFrame.current);
        }
    };
  }, [mapData, displayPixelIconX, displayPixelIconY, isDragging, isFreePanMode, zoomLevel, panX, panY, debugSettings?.throttleAnimationFPS]);

  // Enhanced icon animation
  useEffect(() => {
    if (logicalControlledIconX !== null && logicalControlledIconY !== null) {
      const basePixelX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const basePixelY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;

      // Apply elevation offset if player is in elevated state
      const elevationOffset = playerCharacter?.elevatedState ? -15 : 0; // Move up 15 pixels when elevated
      const targetPixelX = basePixelX;
      const targetPixelY = basePixelY + elevationOffset;

      const needsAnimation = displayPixelIconX !== targetPixelX || displayPixelIconY !== targetPixelY;

      if (displayPixelIconX === null || displayPixelIconY === null || !needsAnimation) {
        setDisplayPixelIconX(targetPixelX);
        setDisplayPixelIconY(targetPixelY);
        if (animationFrameId.current) { 
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        animationStartTime.current = null; 
        onIconAnimationComplete();
      } else { 
        if (animationFrameId.current) { 
          cancelAnimationFrame(animationFrameId.current);
        }
        animationStartTime.current = performance.now();
        animationStartX.current = displayPixelIconX; 
        animationStartY.current = displayPixelIconY;

        const animate = (currentTime: number) => {
          if (!animationStartTime.current || animationStartX.current === null || animationStartY.current === null) {
            setDisplayPixelIconX(targetPixelX); 
            setDisplayPixelIconY(targetPixelY);
            onIconAnimationComplete();
            return;
          }

          const elapsedTime = currentTime - animationStartTime.current;
          
          // If we detect a large frame skip (>50ms), just snap to position
          if (elapsedTime > ICON_ANIMATION_DURATION + 50) {
            setDisplayPixelIconX(targetPixelX);
            setDisplayPixelIconY(targetPixelY);
            animationFrameId.current = null;
            animationStartTime.current = null;
            onIconAnimationComplete();
            return;
          }
          
          const progress = Math.min(elapsedTime / ICON_ANIMATION_DURATION, 1);
          const easedProgress = easeInOutCubic(progress);

          const newX = animationStartX.current + (targetPixelX - animationStartX.current) * easedProgress;
          const newY = animationStartY.current + (targetPixelY - animationStartY.current) * easedProgress;
          
          // Direct state updates for immediate response
          setDisplayPixelIconX(newX);
          setDisplayPixelIconY(newY);

          if (progress < 1) {
            animationFrameId.current = requestAnimationFrame(animate);
          } else {
            animationFrameId.current = null;
            animationStartTime.current = null;
            onIconAnimationComplete();
          }
        };
        animationFrameId.current = requestAnimationFrame(animate);
      }
    } else { 
      setDisplayPixelIconX(null);
      setDisplayPixelIconY(null);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationStartTime.current = null;
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [logicalControlledIconX, logicalControlledIconY, onIconAnimationComplete, playerCharacter?.elevatedState]);

  // Reset centering flag when map changes
  useEffect(() => {
    if (mapData && prevMapDataRef.current !== mapData) {
      hasCenteredOnCurrentMap.current = false;
      prevMapDataRef.current = mapData;
    }
  }, [mapData]);

  // Initial camera centering with zoom animation
  useEffect(() => {
    // Wait for all required data
    if (!mapData || logicalControlledIconX === null || logicalControlledIconY === null || !containerRef.current) {
      return;
    }
    
    // Don't recenter if already centered on this map
    if (hasCenteredOnCurrentMap.current) {
      return;
    }
    
    // Small delay to ensure container is properly mounted and sized
    const timeoutId = setTimeout(() => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Only center if we have valid container dimensions
      if (containerWidth > 0 && containerHeight > 0) {
        const iconSvgX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
        const iconSvgY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;

        // Start with zoomed out view (0.7x)
        const startZoom = INITIAL_ZOOM_LEVEL * 0.7;
        const endZoom = INITIAL_ZOOM_LEVEL;
        
        // Calculate pan for the final zoom level
        const finalPanX = containerWidth / 2 - iconSvgX * endZoom;
        const finalPanY = containerHeight / 2 - iconSvgY * endZoom;
        
        // Calculate pan for the initial zoom level
        const initialPanX = containerWidth / 2 - iconSvgX * startZoom;
        const initialPanY = containerHeight / 2 - iconSvgY * startZoom;

        // Set initial position (zoomed out)
        setPanX(initialPanX);
        setPanY(initialPanY);
        targetPanX.current = initialPanX;
        targetPanY.current = initialPanY;
        
        // Mark as centered immediately to prevent other effects from interfering
        hasCenteredOnCurrentMap.current = true;
        
        // Animate zoom and pan over 2 seconds
        const animationDuration = 2000;
        const startTime = performance.now();
        
        const animate = () => {
          const now = performance.now();
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          
          // Easing function for smooth animation
          const easeInOutCubic = (t: number) => t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
          
          const easedProgress = easeInOutCubic(progress);
          
          // Interpolate zoom
          const currentZoom = startZoom + (endZoom - startZoom) * easedProgress;
          setZoomLevel(currentZoom);
          
          // Recalculate pan for current zoom level to keep player centered
          const currentPanX = containerWidth / 2 - iconSvgX * currentZoom;
          const currentPanY = containerHeight / 2 - iconSvgY * currentZoom;
          
          setPanX(currentPanX);
          setPanY(currentPanY);
          targetPanX.current = currentPanX;
          targetPanY.current = currentPanY;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        // Start the animation
        requestAnimationFrame(animate);
      }
    }, 100); // 100ms delay to ensure container is sized
    
    return () => clearTimeout(timeoutId);
  }, [logicalControlledIconX, logicalControlledIconY]); // Removed mapData dependency to prevent recentering on terrain modifications

  // Listen for center map events from quest panel
  useEffect(() => {
    const handleCenterMapOnLocation = (e: CustomEvent) => {
      const { x, y } = e.detail;
      if (!containerRef.current || !mapData) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate pan values to center the map on the target location
      const targetX = x * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const targetY = y * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      
      const newPanX = containerWidth / 2 - targetX * zoomLevel;
      const newPanY = containerHeight / 2 - targetY * zoomLevel;
      
      // Smoothly animate to the new position
      setPanX(newPanX);
      setPanY(newPanY);
      targetPanX.current = newPanX;
      targetPanY.current = newPanY;
      currentPanX.current = newPanX;
      currentPanY.current = newPanY;
      
      // Enable free pan mode so camera doesn't snap back to player
      setIsFreePanMode(true);
    };
    
    window.addEventListener('centerMapOnLocation', handleCenterMapOnLocation as EventListener);
    return () => {
      window.removeEventListener('centerMapOnLocation', handleCenterMapOnLocation as EventListener);
    };
  }, [mapData, zoomLevel]);

  const throttledOnDevHover = useCallback(rafThrottle(onDevHover, 16), [onDevHover]);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-full text-white rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div id="stars1"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-blue-400 rounded-full animate-spin shadow-glow-primary"></div>
          <div className="mb-2 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Generating World...</div>
          <div className="text-lg text-blue-300">Crafting landscapes & civilizations</div>
        </div>
      </div>
    );
  }

  const { width, height, tiles, seed, climate, pathObjects, vegetation, terrainStructures } = mapData;
  const svgWidth = width * TILE_SIZE_PX;
  const svgHeight = height * TILE_SIZE_PX;

  // Safari optimization: Adjust zoom limits to encourage better performance
  const minZoom = isSafariBrowser ? 1.5 : 0.4;  // Safari minimum zoom prevents zooming out too far
  const maxZoom = isSafariBrowser ? 8 : 12;      // Safari maximum zoom slightly reduced

  // Optimized interaction handlers
  const handleWheel = useCallback(rafThrottle((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !mapData) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const svgMouseX = (mouseX - panX) / zoomLevel;
    const svgMouseY = (mouseY - panY) / zoomLevel;
    
    // Smoother zoom increments
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1; // Smaller steps for smoother zoom
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel * zoomDelta));
    
    if (newZoom !== zoomLevel) {
      const newPanX = mouseX - svgMouseX * newZoom;
      const newPanY = mouseY - svgMouseY * newZoom;
      
      setZoomLevel(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
      targetPanX.current = newPanX;
      targetPanY.current = newPanY;
    }
  }, 16), [zoomLevel, panX, panY, mapData]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);
  
  const getTileFromMouseEvent = useCallback((e: React.MouseEvent): Tile | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !mapData) return null;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const svgX = (mouseX - panX) / zoomLevel;
    const svgY = (mouseY - panY) / zoomLevel;
    const tileX = Math.floor(svgX / TILE_SIZE_PX);
    const tileY = Math.floor(svgY / TILE_SIZE_PX);
    if (tileX >= 0 && tileX < mapData.width && tileY >= 0 && tileY < mapData.height) {
      return mapData.tiles[tileY][tileX];
    }
    return null;
  }, [zoomLevel, panX, panY, mapData]);

  // Helper to calculate correct screen position for tooltips accounting for zoom/pan
  const getTooltipPosition = useCallback((tileX: number, tileY: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };

    // The tile's position in SVG coordinates
    const svgX = tileX * TILE_SIZE_PX + TILE_SIZE_PX / 2; // Center of tile
    const svgY = tileY * TILE_SIZE_PX;

    // Apply the transform: scale first, then translate
    const transformedX = svgX * zoomLevel + panX;
    const transformedY = svgY * zoomLevel + panY;

    // Add container offset to get viewport coordinates
    return {
      x: transformedX + containerRect.left,
      y: transformedY + containerRect.top
    };
  }, [zoomLevel, panX, panY]);

  // Helper function to get component info for a tile
  const getComponentInfoForTile = (tile: Tile, structure?: TerrainStructure | null, npc?: NpcEntity | null, animal?: AnimalEntity | null) => {
    let componentInfo = null;
    
    // Check for NPCs
    if (npc) {
      // On Safari, always use simple NPC icon for performance
      if (!isSafari() && npc.tamedAnimals && npc.tamedAnimals.length > 0) {
        return { fileName: 'NpcIconEnhanced.tsx', symbolName: 'NpcIconEnhanced' };
      } else {
        return { fileName: 'NpcIcon.tsx', symbolName: 'NpcIcon' };
      }
    }
    
    // Check for animals
    if (animal) {
      return { fileName: 'AnimalIcon.tsx', symbolName: 'AnimalIcon' };
    }
    
    // Check for structures first
    if (structure) {
      switch (structure.structureType) {
        case 'palace':
          componentInfo = { 
            fileName: 'PalaceSymbolsImproved.tsx',
            symbolName: 'getPalaceSymbol',
            variant: structure.culturalStyle || 'default'
          };
          break;
        case 'holy_site':
          componentInfo = { 
            fileName: 'getHolySiteSymbol.ts',
            symbolName: 'getHolySiteSymbol (modular)',
            variant: structure.culturalStyle || 'default'
          };
          break;
        case 'marketplace':
          componentInfo = { fileName: 'MarketplaceSymbol.tsx', symbolName: 'MarketplaceSymbol' };
          break;
        case 'government_district':
          componentInfo = { fileName: 'GovernmentDistrictSymbol.tsx', symbolName: 'GovernmentDistrictSymbol' };
          break;
        case 'farm':
          componentInfo = { fileName: 'FarmSymbol.tsx', symbolName: 'FarmSymbol' };
          break;
        case 'fishing_hut':
          componentInfo = { fileName: 'FishingHutSymbol.tsx', symbolName: 'FishingHutSymbol' };
          break;
        case 'lumber_camp':
          componentInfo = { fileName: 'LumberCampSymbol.tsx', symbolName: 'LumberCampSymbol' };
          break;
        case 'mining_colony':
          componentInfo = { fileName: 'MineralSymbol.tsx', symbolName: 'getMineSymbol' };
          break;
        case 'mill':
          componentInfo = { fileName: 'MillSymbols.tsx', symbolName: 'MillSymbol' };
          break;
        case 'factory':
          componentInfo = { fileName: 'FactorySymbol.tsx', symbolName: 'ManufactorySymbol' };
          break;
        case 'fortress':
          componentInfo = { fileName: 'FortressSymbols.tsx', symbolName: 'FortressSymbol' };
          break;
        case 'ruin':
          componentInfo = { fileName: 'ruins/RuinsSymbolNew.tsx', symbolName: 'RuinsSymbolNew' };
          break;
        case 'quarry':
          componentInfo = { fileName: 'QuarrySymbol.tsx', symbolName: 'getQuarrySymbol' };
          break;
        case 'encampment':
          componentInfo = { fileName: 'EncampmentSymbol.tsx', symbolName: 'EncampmentSymbol' };
          break;
        case 'city_center':
          componentInfo = { fileName: 'CityCenterSymbol.tsx', symbolName: 'CityCenterSymbol' };
          break;
      }
    }
    
    // Check for tile-based symbols
    if (!componentInfo) {
      switch (tile.biome) {
        case BiomeType.HAMLET:
        case BiomeType.LOW_DENSITY_CITY:
        case BiomeType.DENSE_CITY:
        case BiomeType.URBAN:
        case BiomeType.CITY_CENTER:
          // For urban tiles, determine the specific building component
          if (mapData && formattedDate && currentLocation) {
            try {
              const { era } = parseDateString(formattedDate);
              const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
              let year = yearMatch ? parseInt(yearMatch[1]) : 0;
              if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                year = -year;
              }
              
              const culturalMapping = getLocationCulturalStyle(currentLocation, year);
              const culture = culturalMapping.primaryCulture;
              const uniqueTileSeed = (mapData.seed || 0) + tile.x * 137 + tile.y * 149;
              
              const selection = selectBuilding({
                year,
                location: currentLocation,
                culture,
                density: tile.biome,
                era: era as HistoricalEra,
                seed: uniqueTileSeed,
                enableLogging: false
              });
              
              // Extract the component name from the selection
              const buildingName = selection.name || 'Unknown';
              componentInfo = { 
                fileName: `${buildingName}.tsx`, 
                symbolName: buildingName,
                variant: `${culture} - ${era}`
              };
            } catch (e) {
              // Fallback if we can't determine the specific building
              componentInfo = { 
                fileName: 'UrbanSymbolSimplified.tsx', 
                symbolName: 'UrbanSymbol',
                variant: 'Unable to determine specific building'
              };
            }
          } else {
            componentInfo = { 
              fileName: 'UrbanSymbolSimplified.tsx', 
              symbolName: 'UrbanSymbol',
              variant: 'Context not available'
            };
          }
          break;
        case BiomeType.CLIFF:
          componentInfo = { fileName: 'CliffSymbol.tsx', symbolName: 'CliffSymbol' };
          break;
        case BiomeType.MANGROVE:
          componentInfo = { fileName: 'MangroveSymbol.tsx', symbolName: 'MangroveSymbol' };
          break;
        case BiomeType.SALT_FLATS:
          componentInfo = { fileName: 'SaltFlatsSymbol.tsx', symbolName: 'SaltFlatsSymbol' };
          break;
        case BiomeType.REEF:
          componentInfo = { fileName: 'CoralReefSymbol.tsx', symbolName: 'CoralReefSymbol' };
          break;
        case BiomeType.ESTUARY:
          componentInfo = { fileName: 'EstuarySymbol.tsx', symbolName: 'EstuarySymbol' };
          break;
        case BiomeType.HOT_SPRINGS:
          componentInfo = { fileName: 'SteamSymbol.tsx', symbolName: 'SteamSymbol' };
          break;
        case BiomeType.OASIS:
          componentInfo = { fileName: 'OasisSymbol.tsx', symbolName: 'OasisSymbol' };
          break;
        case BiomeType.PLAZA:
          componentInfo = { fileName: 'PlazaSymbol.tsx', symbolName: 'PlazaSymbol' };
          break;
        case BiomeType.PARK:
          componentInfo = { fileName: 'ParkSymbol.tsx', symbolName: 'ParkSymbol' };
          break;
        case BiomeType.HARBOR_DISTRICT:
          componentInfo = { fileName: 'HarborDistrictSymbol.tsx', symbolName: 'HarborDistrictSymbol' };
          break;
        case BiomeType.INDUSTRIAL_DISTRICT:
          componentInfo = { fileName: 'IndustrialDistrictSymbol.tsx', symbolName: 'IndustrialDistrictSymbol' };
          break;
        case BiomeType.STAIRS_UP:
          componentInfo = { fileName: 'StairsUpPixel.tsx', symbolName: 'StairsUpPixel' };
          break;
        case BiomeType.AIR:
          // Check climate to determine which ethereal realm we're in
          if (mapData?.climate === ClimateType.ARID) {
            // Outer Space (dark with stars)
            componentInfo = { fileName: 'SpaceSymbol.tsx', symbolName: 'SpaceSymbol' };
          } else {
            // Heaven/clouds/storm realms (fluffy white or storm clouds)
            componentInfo = { fileName: 'CloudSymbol.tsx', symbolName: 'CloudSymbol' };
          }
          break;
        case BiomeType.UNDERSEA:
          // Underwater realm
          componentInfo = { fileName: 'UnderseaSymbol.tsx', symbolName: 'UnderseaSymbol' };
          break;
      }
    }
    
    // Check for vegetation
    if (!componentInfo && tile.vegetationId && mapData?.vegetation) {
      const veg = mapData.vegetation.find(v => v.id === tile.vegetationId);
      if (veg) {
        if (veg.speciesName.includes('Pine')) {
          componentInfo = { fileName: 'PineTreeSymbol.tsx', symbolName: 'PineTreeSymbol' };
        } else if (veg.speciesName.includes('Palm')) {
          componentInfo = { fileName: 'PalmTreeSymbol.tsx', symbolName: 'PalmTreeSymbol' };
        } else if (veg.speciesName.includes('Cactus')) {
          componentInfo = { fileName: 'CactusSymbol.tsx', symbolName: 'CactusSymbol' };
        } else if (veg.type === 'shrub') {
          componentInfo = { fileName: 'BushSymbol.tsx', symbolName: 'BushSymbol' };
        } else {
          componentInfo = { fileName: 'DeciduousTreeSymbol.tsx', symbolName: 'DeciduousTreeSymbol' };
        }
      }
    }
    
    return componentInfo;
  };

  // Debounced hover update function
  const updateHoverStates = useCallback(() => {
    const data = pendingHoverData.current;
    
    if (data.npc !== undefined) {
      setHoveredNPC(data.npc);
    }
    if (data.animal !== undefined) {
      setHoveredAnimal(data.animal);
    }
    if (data.coords) {
      setHoveredEntityCoords(data.coords);
    }
    if (data.tile !== undefined) {
      setHoveredTile(data.tile);
      if (data.tile && data.coords) {
        setHoveredTileCoords(data.coords);
      } else {
        setHoveredTileCoords(null);
      }
    }
    if (data.poi !== undefined) {
      setHoveredPOI(data.poi);
      if (data.poi && data.coords) {
        setHoveredPOICoords(data.coords);
      } else {
        setHoveredPOICoords(null);
      }
    }
    
    // Clear pending data
    pendingHoverData.current = {};
  }, []);

  // Debounced hover handlers for SVG elements
  const handleSvgElementMouseEnter = useCallback((element: any, type: 'tile' | 'poi', e: React.MouseEvent) => {
    if (isDragging) return;

    // FIX: Calculate coordinates relative to the container, not the transformed SVG element
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Get mouse position relative to container (accounts for pan/zoom transforms)
    const coords = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top
    };
    
    if (type === 'tile') {
      // Only set tile for city centers, government districts, and farmland
      const shouldShowTileTooltip = element && (
        element.biome === BiomeType.CITY_CENTER ||
        element.biome === BiomeType.GOVERNMENT_DISTRICT ||
        element.biome === BiomeType.FARMLAND
      );
      
      if (shouldShowTileTooltip) {
        pendingHoverData.current = {
          ...pendingHoverData.current,
          tile: element,
          coords: coords
        };
      }
    } else if (type === 'poi') {
      pendingHoverData.current = {
        ...pendingHoverData.current,
        poi: element,
        coords: coords
      };
    }
    
    if (hoverDebounceTimer.current) {
      clearTimeout(hoverDebounceTimer.current);
    }
    hoverDebounceTimer.current = setTimeout(() => {
      updateHoverStates();
      hoverDebounceTimer.current = null;
    }, 50);
  }, [isDragging, updateHoverStates]);

  const handleSvgElementMouseLeave = useCallback((type: 'tile' | 'poi') => {
    if (type === 'tile') {
      pendingHoverData.current = {
        ...pendingHoverData.current,
        tile: null,
        coords: null
      };
    } else if (type === 'poi') {
      pendingHoverData.current = {
        ...pendingHoverData.current,
        poi: null,
        coords: null
      };
    }
    
    if (hoverDebounceTimer.current) {
      clearTimeout(hoverDebounceTimer.current);
    }
    hoverDebounceTimer.current = setTimeout(() => {
      updateHoverStates();
      hoverDebounceTimer.current = null;
    }, 50);
  }, [updateHoverStates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && mapData) {
      if (!isFreePanMode) setIsFreePanMode(true);

      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      currentPanX.current += deltaX;
      currentPanY.current += deltaY;

      // Add translate3d for Safari GPU acceleration
      const newTransform = `translate3d(${currentPanX.current}px, ${currentPanY.current}px, 0) scale(${zoomLevel})`;

      if (svgRef.current) {
        svgRef.current.style.transform = newTransform;
      }
      if (canvasRef.current) {
        canvasRef.current.style.transform = newTransform;
      }
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      const tile = getTileFromMouseEvent(e);
      if (tile) {
        const structure = mapData?.terrainStructures?.find(s => s.location[0] === tile.x && s.location[1] === tile.y);
        const vegetation = tile.vegetationId ? mapData?.vegetation?.find(v => v.id === tile.vegetationId) : null;
        
        // Check for NPCs, animals, and deployed vessels at this tile
        const npc = npcs?.find(n => n.x === tile.x && n.y === tile.y);
        const animal = animals?.find(a => a.x === tile.x && a.y === tile.y);
        const deployedVessel = deployedVessels?.find(v => v.x === tile.x && v.y === tile.y);
        
        // Only show tile tooltip for specific biomes (city centers, government districts, farms)
        const shouldShowTileTooltip = tile && (
          tile.biome === BiomeType.CITY_CENTER ||
          tile.biome === BiomeType.GOVERNMENT_DISTRICT ||
          tile.biome === BiomeType.FARMLAND
        );
        
        // Store hover data for debounced update
        pendingHoverData.current = {
          npc: npc || null,
          animal: animal || null,
          tile: shouldShowTileTooltip ? tile : null,
          poi: structure && ['holy_site', 'palace', 'ruin', 'mill', 'fortress', 'lumber_camp', 'fishing_hut'].includes(structure.structureType) ? structure : null,
          coords: { x: e.clientX, y: e.clientY },
          structure: structure || null,
          vegetation: vegetation || null,
          deployedVessel: deployedVessel || null
        };
        
        // Clear existing timer and set new one for debounced update
        if (hoverDebounceTimer.current) {
          clearTimeout(hoverDebounceTimer.current);
        }
        hoverDebounceTimer.current = setTimeout(() => {
          updateHoverStates();
          hoverDebounceTimer.current = null;
        }, 50); // 50ms debounce delay
        
        // Get component info for the tile
        const componentInfo = getComponentInfoForTile(tile, structure, npc, animal);
        
        throttledOnDevHover({
          viewMode: 'standard',
          tile: tile,
          vegetation: vegetation,
          structure: structure,
          mapContext: { climate: mapData.climate, archetype: mapData.archetype, tiles: mapData.tiles },
          componentInfo: componentInfo || undefined
        });
      } else {
        // Clear pending data and trigger debounced clear
        pendingHoverData.current = {
          npc: null,
          animal: null,
          tile: null,
          poi: null,
          coords: null,
          structure: null,
          vegetation: null,
          deployedVessel: null
        };
        
        if (hoverDebounceTimer.current) {
          clearTimeout(hoverDebounceTimer.current);
        }
        hoverDebounceTimer.current = setTimeout(() => {
          updateHoverStates();
          hoverDebounceTimer.current = null;
        }, 50);
        
        throttledOnDevHover(null);
      }
    }
  }, [isDragging, lastMousePos, getTileFromMouseEvent, mapData, throttledOnDevHover, isFreePanMode, zoomLevel, npcs, animals, updateHoverStates]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const tile = getTileFromMouseEvent(e);
    if (!tile) return;

    const structure = mapData?.terrainStructures?.find(s => s.location[0] === tile.x && s.location[1] === tile.y) || tile.structure;
    const isPoi = structure && ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
    const deployedVessel = deployedVessels?.find(v => v.x === tile.x && v.y === tile.y);
    
    const settlementBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.FARMLAND]);

    if (deployedVessel) {
        // Handle vessel click - trigger embarkation
        onVesselClick?.(deployedVessel);
    } else if (isPoi) {
        onPoiClick(structure);
    } else if (structure) {
        onStructureClick(structure);
    } else if (settlementBiomes.has(tile.biome)) {
        onSettlementClick(tile);
    } else if (e.metaKey || e.ctrlKey) { 
        const vegetation = tile.vegetationId ? mapData?.vegetation?.find(v => v.id === tile.vegetationId) : null;
        const componentInfo = getComponentInfoForTile(tile, structure, null, null);
        onDevCommandClick({
            viewMode: 'standard',
            tile,
            vegetation,
            structure,
            mapContext: { climate: mapData.climate, archetype: mapData.archetype, tiles: mapData.tiles },
            componentInfo: componentInfo || undefined
        });
    }
  }, [onDevCommandClick, onStructureClick, onPoiClick, onSettlementClick, onVesselClick, getTileFromMouseEvent, mapData, npcs, animals, deployedVessels]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPanX(currentPanX.current);
      setPanY(currentPanY.current);
      targetPanX.current = currentPanX.current;
      targetPanY.current = currentPanY.current;
    }
  }, [isDragging]);

  // Attach global mouseup and mousemove listeners when dragging to prevent losing events
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!mapData) return;
      if (!isFreePanMode) setIsFreePanMode(true);

      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      currentPanX.current += deltaX;
      currentPanY.current += deltaY;

      // Direct transform manipulation for smooth performance
      const newTransform = `translate3d(${currentPanX.current}px, ${currentPanY.current}px, 0) scale(${zoomLevel})`;

      if (svgRef.current) {
        svgRef.current.style.transform = newTransform;
      }
      if (canvasRef.current) {
        canvasRef.current.style.transform = newTransform;
      }

      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setPanX(currentPanX.current);
      setPanY(currentPanY.current);
      targetPanX.current = currentPanX.current;
      targetPanY.current = currentPanY.current;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isFreePanMode, lastMousePos, mapData, zoomLevel]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    throttledOnDevHover(null);
  }, [throttledOnDevHover]);

  // Touch event handlers for mobile
  const touchStartRef = useRef<{ x: number; y: number; distance?: number } | null>(null);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for pan
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        distance
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!touchStartRef.current || !mapData) return;
    
    if (e.touches.length === 1 && isDragging) {
      // Single touch - pan
      if (!isFreePanMode) setIsFreePanMode(true);
      
      const deltaX = e.touches[0].clientX - lastMousePos.x;
      const deltaY = e.touches[0].clientY - lastMousePos.y;
      
      currentPanX.current += deltaX;
      currentPanY.current += deltaY;

      // Add translate3d for Safari GPU acceleration
      const newTransform = `translate3d(${currentPanX.current}px, ${currentPanY.current}px, 0) scale(${zoomLevel})`;
      if (svgRef.current) {
        svgRef.current.style.transform = newTransform;
        // Safari optimization for smooth zoom/pan
        svgRef.current.style.webkitTransform = newTransform;
        svgRef.current.style.willChange = 'transform';
      }
      if (canvasRef.current) {
        canvasRef.current.style.transform = newTransform;
        // Safari optimization for smooth zoom/pan
        canvasRef.current.style.webkitTransform = newTransform;
        canvasRef.current.style.willChange = 'transform';
      }
      
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && touchStartRef.current.distance) {
      // Two touches - pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = newDistance / touchStartRef.current.distance;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel * scale));
      
      if (newZoom !== zoomLevel) {
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = centerX - rect.left;
          const mouseY = centerY - rect.top;
          const svgMouseX = (mouseX - panX) / zoomLevel;
          const svgMouseY = (mouseY - panY) / zoomLevel;
          
          const newPanX = mouseX - svgMouseX * newZoom;
          const newPanY = mouseY - svgMouseY * newZoom;
          
          setZoomLevel(newZoom);
          setPanX(newPanX);
          setPanY(newPanY);
          targetPanX.current = newPanX;
          targetPanY.current = newPanY;
          
          touchStartRef.current.distance = newDistance;
        }
      }
    }
  }, [isDragging, isFreePanMode, lastMousePos, mapData, zoomLevel, panX, panY]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPanX(currentPanX.current);
      setPanY(currentPanY.current);
      targetPanX.current = currentPanX.current;
      targetPanY.current = currentPanY.current;
    }
    touchStartRef.current = null;
  }, [isDragging]);

  // Safari detection is done at the module level (line 82)

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const svgMouseX = (centerX - panX) / zoomLevel;
    const svgMouseY = (centerY - panY) / zoomLevel;
    const newZoom = Math.min(maxZoom, zoomLevel * 1.35);
    
    if (newZoom !== zoomLevel) {
      const newPanX = centerX - svgMouseX * newZoom;
      const newPanY = centerY - svgMouseY * newZoom;
      
      setZoomLevel(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
      targetPanX.current = newPanX;
      targetPanY.current = newPanY;
    }
  }, [zoomLevel, panX, panY]);

  const zoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const svgMouseX = (centerX - panX) / zoomLevel;
    const svgMouseY = (centerY - panY) / zoomLevel;
    const newZoom = Math.max(minZoom, zoomLevel * 0.74);
    
    if (newZoom !== zoomLevel) {
      const newPanX = centerX - svgMouseX * newZoom;
      const newPanY = centerY - svgMouseY * newZoom;
      
      setZoomLevel(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
      targetPanX.current = newPanX;
      targetPanY.current = newPanY;
    }
  }, [zoomLevel, panX, panY]);

  const resetZoomAndCenter = useCallback(() => {
    setIsFreePanMode(false);
    
    if (logicalControlledIconX !== null && logicalControlledIconY !== null && containerRef.current && mapData) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const iconSvgX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const iconSvgY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;

      const newPanX = containerWidth / 2 - iconSvgX * INITIAL_ZOOM_LEVEL;
      const newPanY = containerHeight / 2 - iconSvgY * INITIAL_ZOOM_LEVEL;

      setZoomLevel(INITIAL_ZOOM_LEVEL);
      setPanX(newPanX);
      setPanY(newPanY);
      targetPanX.current = newPanX;
      targetPanY.current = newPanY;
      hasCenteredOnCurrentMap.current = true;
    }
  }, [logicalControlledIconX, logicalControlledIconY, mapData]);

  // Mobile pan controls
  const panMap = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!mapData || !containerRef.current) return;
    
    setIsFreePanMode(true);
    // Adjustable pan amount based on mobile speed setting
    const basePanAmount = isMobile ? 150 : 100;
    const speedMultiplier = mobileNavSpeed === 'slow' ? 0.5 : mobileNavSpeed === 'fast' ? 2 : 1;
    const panAmount = basePanAmount * speedMultiplier; // pixels to pan
    
    let newPanX = currentPanX.current;
    let newPanY = currentPanY.current;
    
    switch(direction) {
      case 'up':
        newPanY += panAmount;
        break;
      case 'down':
        newPanY -= panAmount;
        break;
      case 'left':
        newPanX += panAmount;
        break;
      case 'right':
        newPanX -= panAmount;
        break;
    }
    
    currentPanX.current = newPanX;
    currentPanY.current = newPanY;
    targetPanX.current = newPanX;
    targetPanY.current = newPanY;
    
    setPanX(newPanX);
    setPanY(newPanY);
    
    const newTransform = `translate(${newPanX}px, ${newPanY}px) scale(${zoomLevel})`;
    if (svgRef.current) svgRef.current.style.transform = newTransform;
    if (canvasRef.current) canvasRef.current.style.transform = newTransform;
  }, [mapData, zoomLevel, isMobile, mobileNavSpeed]);

  // Performance-based rendering decisions with Safari optimizations and debug overrides
  const shouldRenderDetailedSymbols = debugSettings?.reduceSVGComplexity ? false : zoomLevel > 0.;
  const shouldRenderVegetation = zoomLevel >= 1.0; // Hide vegetation when zoomed out for performance
  const shouldRenderAnimations = debugSettings?.disableAnimations ? false : zoomLevel > 0.6;
  const shouldUseBlurEffects = debugSettings?.disableBlurEffects ? false : !isSafari; // Completely disable blur effects on Safari for performance
  const shouldRenderParticles = !debugSettings?.disableParticles;
  const shouldRenderShadows = !debugSettings?.disableShadows;

  // Helper to check if a tile is water (including shoals)
  const isWaterTile = useCallback((tile: Tile) => {
    // Handle shoals tiles specially - they can be either land or water
    if (tile.biome === BiomeType.SHOALS_TILE) {
      return !tile.isLand;
    }
    return !tile.isLand || [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN].includes(tile.biome);
  }, []);

  // Simple day/night detection for UI purposes only (no color tinting)
  const timeOfDayData = useMemo(() => {
    const hour = gameTimeHours;
    const minute = gameTimeMinutes || 0;
    const fractionalHour = hour + (minute / 60);
    
    const isNight = fractionalHour < 6 || fractionalHour >= 20;
    const isDawn = fractionalHour >= 5 && fractionalHour < 7;
    const isDusk = fractionalHour >= 18 && fractionalHour < 21;
    const isDay = fractionalHour >= 8 && fractionalHour < 18;

    // Calculate night intensity for components that need it
    let nightIntensity = 0;
    if (isNight) {
      if (fractionalHour >= 20) {
        // Evening: fade from 0 to 1 between 20:00 and 22:00
        nightIntensity = Math.min(1, (fractionalHour - 20) / 2);
      } else if (fractionalHour < 4) {
        // Night: full intensity
        nightIntensity = 1;
      } else {
        // Early morning: fade from 1 to 0 between 4:00 and 6:00
        nightIntensity = Math.max(0, 1 - ((fractionalHour - 4) / 2));
      }
    }

    return { isNight, isDawn, isDusk, isDay, nightIntensity };
  }, [gameTimeHours, gameTimeMinutes]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Enhanced zoom controls - hide on mobile */}
      {!isMobile && (
      <div className="absolute top-6 left-6 z-30 flex flex-col space-y-2">
        <button 
          onClick={zoomIn} 
          className={getSafariOptimizedClassName("group w-11 h-11 flex items-center justify-center rounded-lg border border-gray-600/40 bg-gray-900/70 text-white shadow-lg transition-all duration-200 backdrop-blur-sm hover:border-blue-400/60 hover:bg-blue-800/70")}
          title="Zoom In (+)"
        >
          <span className="text-2xl leading-none font-bold transition-transform group-hover:scale-110">+</span>
        </button>
        <button 
          onClick={zoomOut} 
          className={getSafariOptimizedClassName("group w-11 h-11 flex items-center justify-center rounded-lg border border-gray-600/40 bg-gray-900/70 text-white shadow-lg transition-all duration-200 backdrop-blur-sm hover:border-blue-400/60 hover:bg-blue-800/70")}
          title="Zoom Out (-)"
        >
          <span className="text-2xl leading-none font-bold transition-transform group-hover:scale-110">−</span>
        </button>
        <button 
          onClick={resetZoomAndCenter} 
          className={getSafariOptimizedClassName("group w-11 h-11 flex items-center justify-center rounded-lg border border-gray-600/40 bg-gray-900/70 text-white shadow-lg transition-all duration-200 backdrop-blur-sm hover:border-green-400/60 hover:bg-green-800/70")}
          title="Center on Player (0)"
        >
          <span className="text-xl transition-transform group-hover:scale-110">⌂</span>
        </button>
      </div>
      )}

      {/* Mobile Controls - New simplified D-pad */}
      {isMobile && (
        <MobileControls 
          onMove={(direction) => {
            // Map direction names from MobileControls to keyboard keys
            const keyMap = {
              'north': 'ArrowUp',
              'south': 'ArrowDown',
              'west': 'ArrowLeft',
              'east': 'ArrowRight'
            };
            
            const key = keyMap[direction];
            if (key) {
              // Dispatch keyboard events to trigger the existing movement system
              const downEvent = new KeyboardEvent('keydown', { key, bubbles: true });
              window.dispatchEvent(downEvent);
              
              // Release the key after a short delay to allow movement
              setTimeout(() => {
                const upEvent = new KeyboardEvent('keyup', { key, bubbles: true });
                window.dispatchEvent(upEvent);
              }, 100);
            }
          }}
        />
      )}
      
      

      {/* Enhanced minimap - hide on very small mobile screens */}
      {(!isMobile || window.innerWidth > 480) && (
        <Minimap
          mapData={mapData}
          playerX={logicalControlledIconX}
          playerY={logicalControlledIconY}
          zoomLevel={zoomLevel}
          panX={panX}
          panY={panY}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
        />
      )}

      {/* Main map container */}
      <div 
        ref={containerRef}
        className="relative h-full w-full overflow-hidden rounded-3xl bg-transparent"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          contain: 'layout style paint',
          touchAction: 'none', // Prevent default touch behaviors
          // Safari optimizations
          WebkitOverflowScrolling: 'touch',
          WebkitBackfaceVisibility: 'hidden',
          WebkitPerspective: 1000,
          WebkitTransformStyle: 'preserve-3d'
        }}
        onWheel={handleWheel} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* OPTIMIZED CANVAS - Using MapCanvasPerformance instead of expensive inline rendering */}
        <MapCanvasPerformance
          key={currentMapSeed || 'default'}
          ref={canvasRef}
          mapData={mapData}
          canvasSize={canvasSize}
          panX={panX}
          panY={panY}
          zoomLevel={zoomLevel}
          isNight={timeOfDayData.isNight}
          playerX={playerCharacter?.x}
          playerY={playerCharacter?.y}
          disableSmoothing={debugSettings?.disableCanvasSmoothing}
          season={season}
        />
        
        {/* Enhanced SVG overlay */}
        <svg 
          ref={svgRef} 
          width={svgWidth} 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="pointer-events-none absolute top-0 left-0 select-none" 
          style={{
            width: svgWidth,
            height: svgHeight,
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0'
            // willChange: 'transform' // Disabled - causes Safari to render at lower resolution
          }}
        >
          <defs>
            {/* Enhanced filters and gradients - optimized for Safari */}
            {!isSafari ? (
              <>
                <filter id="fireGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="symbolShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="2" dy="2" result="offsetblur"/>
                  <feFlood floodColor="#000000" floodOpacity="0.3"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="streamFilter">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                  <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
                </filter>
              </>
            ) : (
              <>
                {/* Safari-optimized filters without blur */}
                <filter id="fireGlow">
                  {/* Simple opacity effect for Safari */}
                  <feComponentTransfer>
                    <feFuncA type="discrete" tableValues="1 0.9"/>
                  </feComponentTransfer>
                </filter>
                <filter id="symbolShadow" x="-50%" y="-50%" width="200%" height="200%">
                  {/* Simple offset shadow without blur for Safari */}
                  <feOffset in="SourceAlpha" dx="2" dy="2" result="offsetblur"/>
                  <feFlood floodColor="#000000" floodOpacity="0.2"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  {/* Simple brightness effect for Safari */}
                  <feComponentTransfer>
                    <feFuncA type="discrete" tableValues="1 0.95"/>
                  </feComponentTransfer>
                </filter>
                <filter id="streamFilter">
                  {/* Simple offset for Safari */}
                  <feOffset in="SourceGraphic" dx="1" dy="1" result="offsetBlur" />
                </filter>
              </>
            )}
            {/* Continue with rest of the original filter definition that's common to both */}
            <filter id="streamFilter2">
              <feFlood floodColor="#000000" floodOpacity="0.2" />
              <feComposite in2="offsetBlur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Water mask for paths */}
            <mask id="waterMask">
              {flatTiles.map((tile) => (
                <rect
                  key={`mask-${tile.x}-${tile.y}`}
                  x={tile.x * TILE_SIZE_PX}
                  y={tile.y * TILE_SIZE_PX}
                  width={TILE_SIZE_PX}
                  height={TILE_SIZE_PX}
                  fill={isWaterTile(tile) ? "black" : "white"}
                />
              ))}
            </mask>
            
            {/* Coastal enhancement patterns */}
            <pattern id="wavePattern" x="0" y="0" width={TILE_SIZE_PX * 2} height={TILE_SIZE_PX} patternUnits="userSpaceOnUse">
              <path 
                d={`M 0 ${TILE_SIZE_PX * 0.5} Q ${TILE_SIZE_PX * 0.5} ${TILE_SIZE_PX * 0.3} ${TILE_SIZE_PX} ${TILE_SIZE_PX * 0.5} T ${TILE_SIZE_PX * 2} ${TILE_SIZE_PX * 0.5}`}
                stroke="rgba(255,255,255,0.15)" 
                strokeWidth="1" 
                fill="none"
              />
            </pattern>
            
            <linearGradient id="beachGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,248,220,0.2)" />
              <stop offset="100%" stopColor="rgba(255,248,220,0)" />
            </linearGradient>
            
            <linearGradient id="cliffShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            
            <pattern id="marshPattern" x="0" y="0" width={TILE_SIZE_PX} height={TILE_SIZE_PX} patternUnits="userSpaceOnUse">
              <circle cx={TILE_SIZE_PX * 0.3} cy={TILE_SIZE_PX * 0.3} r="2" fill="rgba(107,142,35,0.2)" />
              <circle cx={TILE_SIZE_PX * 0.7} cy={TILE_SIZE_PX * 0.6} r="1.5" fill="rgba(85,107,47,0.2)" />
              <circle cx={TILE_SIZE_PX * 0.5} cy={TILE_SIZE_PX * 0.8} r="1" fill="rgba(107,142,35,0.15)" />
            </pattern>

            {/* Watercolor edge effect filters - optimized for Safari */}
            <filter id="watercolor-edge-blend">
              {!isSafari ? (
                <>
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.02"
                    numOctaves="3"
                    seed={seed}
                    result="turbulence"
                  />
                  <feColorMatrix in="turbulence" type="saturate" values="0" result="desaturated"/>
                  <feComponentTransfer in="desaturated" result="discrete">
                    <feFuncA type="discrete" tableValues="0 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1"/>
                  </feComponentTransfer>
                  <feGaussianBlur in="discrete" stdDeviation="1.5" result="blurred"/>
                  <feBlend mode="multiply" in="blurred" in2="SourceGraphic"/>
                </>
              ) : (
                // Simplified effect for Safari without blur
                <>
                  <feComponentTransfer>
                    <feFuncA type="discrete" tableValues="1 0.95 0.9"/>
                  </feComponentTransfer>
                </>
              )}
            </filter>
          </defs>


          {/* Rendering layers */}
          <g>
            {/* Strategic Lens Overlay */}
            {activeLens !== 'none' && (
                <g key="strategic-lens">
                    {/* Lens visualization layer */}
                    {flatTiles.map(tile => {
                        if (!tile.isLand && activeLens !== 'minerals') return null;
                        
                        let value = 0;
                        let color = 'transparent';
                        let showOverlay = false;

                        switch(activeLens) {
                            case 'safety':
                                value = tile.qualities?.safety || 0;
                                color = getLensColor('safety', value);
                                showOverlay = value > 0.1;
                                break;
                                
                            case 'biodiversity':
                                value = tile.qualities?.biodiversity || 0;
                                color = getLensColor('biodiversity', value);
                                showOverlay = value > 0.1;
                                break;
                                
                            case 'sacrality':
                                value = tile.qualities?.sacrality || 0;
                                color = getLensColor('sacrality', value);
                                showOverlay = value > 0.1;
                                break;
                                
                            case 'healthiness':
                                value = tile.qualities?.healthiness || 0;
                                color = getLensColor('healthiness', value);
                                showOverlay = value > 0.1;
                                break;
                                
                            case 'flammability':
                                value = tile.qualities?.flammability || 0;
                                color = getLensColor('flammability', value);
                                showOverlay = value > 0.1;
                                break;
                                
                            case 'minerals':
                                // Special handling for minerals - show circles for deposits
                                return tile.mineralDeposit && tile.mineralDeposit.quantity > 0 ? (
                                    <circle
                                        key={`mineral-${tile.x}-${tile.y}`}
                                        cx={tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                                        cy={tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                                        r={Math.max(3, Math.min(8, tile.mineralDeposit.quantity / 30))}
                                        fill={getMineralColor(tile.mineralDeposit.metalId)}
                                        stroke="#000000"
                                        strokeWidth="0.5"
                                        opacity={0.8}
                                    />
                                ) : null;
                        }

                        if (!showOverlay || color === 'transparent') return null;

                        return (
                            <rect
                                key={`lens-${tile.x}-${tile.y}`}
                                x={tile.x * TILE_SIZE_PX}
                                y={tile.y * TILE_SIZE_PX}
                                width={TILE_SIZE_PX}
                                height={TILE_SIZE_PX}
                                fill={color}
                                fillOpacity={Math.max(0.3, value * 0.8)}
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        );
                    })}
                </g>
            )}

            {/* Mineral Legend for Minerals Lens */}
            {activeLens === 'minerals' && (
                <foreignObject 
                    x={10} 
                    y={50}
                    width={200} 
                    height={200}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className={getSafariOptimizedClassName("bg-slate-900/90 backdrop-blur-sm border border-slate-600 rounded-lg p-3 text-white text-sm shadow-xl")}>
                        <div className="font-bold text-amber-400 mb-2">🗺️ Mineral Legend</div>
                        <div className="space-y-1 text-xs">
                            {[
                                { name: 'Iron', color: '#8B4513' },
                                { name: 'Copper', color: '#B87333' },
                                { name: 'Gold', color: '#FFD700' },
                                { name: 'Silver', color: '#C0C0C0' },
                                { name: 'Coal', color: '#36454F' },
                                { name: 'Salt', color: '#F8F8FF' },
                                { name: 'Gems', color: '#FF1493' },
                            ].map(mineral => (
                                <div key={mineral.name} className="flex items-center space-x-2">
                                    <div 
                                        className="w-3 h-3 rounded-full border border-black/50"
                                        style={{ backgroundColor: mineral.color }}
                                    />
                                    <span>{mineral.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Circle size = abundance
                        </div>
                    </div>
                </foreignObject>
            )}

            {/* Old paths layer removed - now rendered after terrain features */}

            {/* Animated trains on railroads */}
            {(() => {
              const { era } = parseDateString(mapData?.timeSlice || '1650');
              const hasRailroads = pathObjects?.some(p => p.type === PathType.RAILROAD);
              
              if ((era === HistoricalEra.INDUSTRIAL || era === HistoricalEra.MODERN) && hasRailroads) {
                // Find all railroad paths
                const railroads = pathObjects?.filter(p => p.type === PathType.RAILROAD) || [];
                
                // Spawn 1-2 trains randomly on different railroads
                const numTrains = Math.min(railroads.length, 1 + (Math.random() > 0.7 ? 1 : 0));
                const selectedRailroads = railroads
                  .sort(() => Math.random() - 0.5)
                  .slice(0, numTrains);
                
                return (
                  <g className="trains-layer">
                    {selectedRailroads.map((railroad, idx) => (
                      <TrainSymbol
                        key={`train-${railroad.id}-${idx}`}
                        pathData={railroad.svgD}
                        speed={0.015 + Math.random() * 0.01} // Variable speed
                        numCars={undefined} // Will be randomized
                      />
                    ))}
                  </g>
                );
              }
              return null;
            })()}

            {/* Vegetation layer - MOVED TO AFTER ROADS/PATHS */}
            
            {/* Terrain features layer (farms, cliffs, etc - rendered BELOW roads, but EXCLUDING hills which render above) */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {flatTiles.map((tile) => {
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  const elements = [];
                  
                  // Only render non-hill terrain features in this pass
                  if(tile.biome === BiomeType.CLIFF) {
                    elements.push(<CliffSymbol key={`cliff-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />);
                  } else if(tile.biome === BiomeType.MANGROVE) {
                    elements.push(<MangroveSymbol key={`mangrove-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.SALT_FLATS) {
                    elements.push(<SaltFlatsSymbol key={`saltflats-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.STAIRS_UP) {
                    elements.push(
                      <StairsUpPixel 
                        key={`stairs-${tile.x}-${tile.y}`} 
                        x={symbolX} 
                        y={symbolY} 
                        size={TILE_SIZE_PX} 
                      />
                    );
                  // HILLS MOVED TO AFTER ROADS
                  } else if(tile.biome === BiomeType.OASIS) {
                    elements.push(<OasisSymbol key={`oasis-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.PLAZA) {
                    elements.push(<PlazaSymbol key={`plaza-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} />);
                  } else if(tile.biome === BiomeType.PARK) {
                    elements.push(<ParkSymbol key={`park-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} />);
                  } else if(tile.biome === BiomeType.HARBOR_DISTRICT) {
                    // Get era and cultural style for harbor district
                    const { era: harborEra } = parseDateString(formattedDate);
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    const harborCulturalStyle = getLocationCulturalStyle(currentLocation, year)?.culturalStyle || 'european';
                    elements.push(<HarborDistrictSymbol key={`harbor-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} era={harborEra} culturalStyle={harborCulturalStyle} mapTiles={mapData.tiles} />);
                  } else if(tile.biome === BiomeType.INDUSTRIAL_DISTRICT) {
                    // Get era and cultural style for industrial district
                    const { era: industrialEra } = parseDateString(formattedDate);
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    const industrialCulturalStyle = getLocationCulturalStyle(currentLocation, year)?.culturalStyle || 'european';
                    elements.push(<IndustrialDistrictSymbol key={`industrial-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} era={industrialEra} culturalStyle={industrialCulturalStyle} />);
                  } else if(tile.biome === BiomeType.FARMLAND) {
                    elements.push(
                      <g
                        key={`farm-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredTile(tile);
                            setHoveredTileCoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredTile(null);
                          setHoveredTileCoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <FarmSymbol tile={tile} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} climate={climate} season={season} />
                        {hoveredTile === tile && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                            opacity="0.8"
                            rx="3"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  } else if(tile.biome === BiomeType.ESTUARY) {
                    elements.push(<EstuarySymbol key={`estuary-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.REEF) {
                    elements.push(<CoralReefSymbol key={`reef-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.HOT_SPRINGS) {
                    elements.push(<SteamSymbol key={`hotspring-steam-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} intensity="heavy" />);
                  } else if(tile.biome === BiomeType.VOLCANIC_ROCK) {
                    if ((tile.x + tile.y + Math.floor(seed/10)) % 12 === 0) {
                      elements.push(<SteamSymbol key={`volcanic-steam-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} intensity="light" />);
                    }
                  }
                  
                  // Add fireflies for swamps and temperate summer nights
                  const shouldShowFireflies = (
                    // Always show in wetlands/swamps at night
                    (tile.biome === BiomeType.WETLANDS && timeOfDayData.isNight) ||
                    // Show in temperate climates during summer nights
                    (climate === 'temperate' && season === 'summer' && timeOfDayData.isNight && 
                     (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST || 
                      tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK))
                  );
                  
                  if (shouldShowFireflies && (tile.x + tile.y + tileSeed) % 30 === 0) {
                    elements.push(<FireflySymbol key={`firefly-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />);
                  }
                  
                  return elements;
                })}
              </g>
            )}
            
            {/* Roads and paths layer - rendered BELOW buildings but ABOVE terrain */}
            <g mask="url(#waterMask)">
              {pathObjects?.map((path) => {
                // Viewport culling for performance
                const pathBounds = getPathBounds(path.svgD);
                if (pathBounds) {
                  const buffer = TILE_SIZE_PX * 2;
                  const viewLeft = -panX / zoomLevel - buffer;
                  const viewRight = (-panX + (containerRef.current?.clientWidth || 800)) / zoomLevel + buffer;
                  const viewTop = -panY / zoomLevel - buffer;
                  const viewBottom = (-panY + (containerRef.current?.clientHeight || 600)) / zoomLevel + buffer;
                  
                  // Skip if path is completely outside viewport
                  if (pathBounds.maxX < viewLeft || pathBounds.minX > viewRight || 
                      pathBounds.maxY < viewTop || pathBounds.minY > viewBottom) {
                    return null;
                  }
                }
                
                // Check if path crosses water for bridge rendering
                // But exclude streams/rivers which are already water paths
                // Streams have IDs like 'stream-0', 'stream-1' etc
                const isStreamPath = path.id && path.id.startsWith('stream-');
                
                // Also check if the path color looks like water (blue/cyan shades)
                const isWaterColoredPath = path.strokeColor && (
                  path.strokeColor.match(/#[0-9a-f]*[89abcdef][0-9a-f]*f/i) || // Blue-ish hex colors
                  path.strokeColor.includes('blue') ||
                  path.strokeColor.includes('cyan') ||
                  parseInt(path.strokeColor?.slice(-2), 16) > 200 // High blue component
                );
                
                const isWaterPath = isStreamPath || isWaterColoredPath;
                const crossesWater = !isWaterPath && pathCrossesWater(path.svgD, tiles);
                
                // Special rendering for modern roads and railroads
                if (path.type === PathType.MODERN_ROAD) {
                  return (
                    <g key={path.id}>
                      {/* Asphalt base */}
                      <path
                        d={path.svgD}
                        stroke={path.strokeColor}
                        strokeWidth={path.strokeWidth * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={path.opacity}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                      {/* White center line */}
                      <path
                        d={path.svgD}
                        stroke="#ffffff"
                        strokeWidth={path.strokeWidth * 0.05 * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={path.opacity * 0.7}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeDasharray={`${TILE_SIZE_PX * 0.5} ${TILE_SIZE_PX * 0.3}`}
                      />
                    </g>
                  );
                } else if (path.type === PathType.RAILROAD) {
                  return (
                    <g key={path.id}>
                      {/* Rail bed */}
                      <path
                        d={path.svgD}
                        stroke="#3a3a3a"
                        strokeWidth={path.strokeWidth * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={path.opacity * 0.5}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                      {/* Rails (dashed to simulate ties) */}
                      <path
                        d={path.svgD}
                        stroke={path.strokeColor}
                        strokeWidth={path.strokeWidth * 0.7 * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={path.opacity}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        strokeDasharray={`${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.05}`}
                      />
                    </g>
                  );
                }
                
                // Default rendering for regular roads and paths with simple bridges
                if (crossesWater) {
                  // Render a simple bridge
                  return (
                    <g key={path.id}>
                      {/* Bridge shadow */}
                      <path
                        d={path.svgD}
                        stroke="rgba(0, 0, 0, 0.3)"
                        strokeWidth={path.strokeWidth * 1.3 * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform="translate(2, 3)"
                      />
                      {/* Bridge deck - darker brown */}
                      <path
                        d={path.svgD}
                        stroke="#6B4423"
                        strokeWidth={path.strokeWidth * 1.1 * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={0.95}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Bridge planks */}
                      <path
                        d={path.svgD}
                        stroke="#8B5A3C"
                        strokeWidth={path.strokeWidth * 0.9 * Math.max(0.8, Math.min(1.5, zoomLevel))}
                        fill="none"
                        opacity={0.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 2"
                      />
                    </g>
                  );
                }
                
                // Regular path rendering (with special filter for streams)
                return (
                  <path
                    key={path.id}
                    d={path.svgD}
                    stroke={path.strokeColor}
                    strokeWidth={path.strokeWidth * Math.max(0.8, Math.min(1.5, zoomLevel))}
                    fill="none"
                    opacity={path.opacity * 0.88}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={path.strokeDasharray}
                    filter={isStreamPath ? "url(#streamFilter)" : undefined}
                    className="transition-opacity duration-300"
                  />
                );
              })}
            </g>
            
            {/* Bridges - render after roads but before other structures */}
            {shouldRenderDetailedSymbols && terrainStructures && (
              <g id="bridges-layer">
                {terrainStructures
                  .filter(structure => structure.structureType === 'bridge')
                  .map(bridge => {
                    const bridgeData = bridge.customData as any;
                    if (!bridgeData) return null;
                    
                    return (
                      <BridgeSymbol
                        key={bridge.id}
                        startX={bridgeData.start.x}
                        startY={bridgeData.start.y}
                        endX={bridgeData.end.x}
                        endY={bridgeData.end.y}
                        type={bridgeData.type}
                        style={bridgeData.style}
                        width={bridgeData.width}
                      />
                    );
                  })}
              </g>
            )}
            
            {/* Hills and Vegetation layer - rendered ABOVE roads/streams so they don't appear cut over */}
            {/* Hills */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {flatTiles.map((tile) => {
                  if (tile.biome !== BiomeType.HILLS) return null;
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  return <HillSymbol key={`hill-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} season={season}/>;
                })}
              </g>
            )}
            
            {/* Mountains */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {flatTiles.map((tile) => {
                  if (tile.biome !== BiomeType.MOUNTAIN) return null;
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 47 + tile.y * 53;
                  const altitude = tile.altitude || 0.7; // Use tile altitude if available
                  return <MountainSymbol key={`mountain-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} altitude={altitude} climate={climate} season={season} />;
                })}
              </g>
            )}
            
            {/* Ethereal Realms - Space, Undersea, Heaven/Clouds */}
            {shouldRenderDetailedSymbols && (
              <g>
                {flatTiles.map((tile) => {
                  // Space tiles (AIR biome in ARID climate)
                  if (tile.biome === BiomeType.AIR && climate === ClimateType.ARID) {
                    const symbolX = tile.x * TILE_SIZE_PX;
                    const symbolY = tile.y * TILE_SIZE_PX;
                    // Use stable seed based on tile position, not the map seed
                    const tileSeed = tile.x * 137 + tile.y * 149 + 12345;
                    return <SpaceSymbol key={`space-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />;
                  }

                  // Cloud/Heaven tiles (AIR biome in other climates)
                  if (tile.biome === BiomeType.AIR && climate !== ClimateType.ARID) {
                    const symbolX = tile.x * TILE_SIZE_PX;
                    const symbolY = tile.y * TILE_SIZE_PX;
                    // Use stable seed based on tile position
                    const tileSeed = tile.x * 163 + tile.y * 173 + 54321;
                    return <CloudSymbol key={`cloud-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} climate={climate} />;
                  }

                  // Undersea tiles
                  if (tile.biome === BiomeType.UNDERSEA) {
                    const symbolX = tile.x * TILE_SIZE_PX;
                    const symbolY = tile.y * TILE_SIZE_PX;
                    // Use stable seed based on tile position
                    const tileSeed = tile.x * 181 + tile.y * 191 + 98765;
                    return <UnderseaSymbol key={`undersea-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />;
                  }

                  return null;
                })}
              </g>
            )}

            {/* Snow and seasonal riverbank snow */}
            {shouldRenderDetailedSymbols && (
              <g>
                {flatTiles.map((tile) => {
                  // Regular snow tiles
                  if (tile.biome === BiomeType.SNOW) {
                    const symbolX = tile.x * TILE_SIZE_PX;
                    const symbolY = tile.y * TILE_SIZE_PX;
                    const tileSeed = seed + tile.x * 59 + tile.y * 61;
                    return <SnowSymbol key={`snow-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} gameTime={gameTimeHours} />;
                  }
                  
                  // Riverbank tiles in cold climates get seasonal snow
                  if (tile.biome === BiomeType.RIVERBANK && 
                      (climate === ClimateType.TEMPERATE || climate === ClimateType.CONTINENTAL || climate === ClimateType.ARCTIC)) {
                    // Winter = full snow, Spring/Fall = dusting of snow
                    const shouldHaveSnow = (season === 'Winter') || 
                                          (season === 'Spring' && Math.random() > 0.5) || 
                                          (season === 'Fall' && Math.random() > 0.3);
                    
                    if (shouldHaveSnow) {
                      const symbolX = tile.x * TILE_SIZE_PX;
                      const symbolY = tile.y * TILE_SIZE_PX;
                      const tileSeed = seed + tile.x * 71 + tile.y * 73;
                      
                      // Light snow overlay for riverbanks (semi-transparent)
                      return (
                        <g key={`riverbank-snow-${tile.x}-${tile.y}`}>
                          <rect 
                            x={symbolX} 
                            y={symbolY} 
                            width={TILE_SIZE_PX} 
                            height={TILE_SIZE_PX}
                            fill="rgba(250, 250, 255, 0.2)"
                            opacity={season === 'Winter' ? 0.6 : 0.3}
                          />
                          {/* Occasional sparkle on winter riverbanks */}
                          {season === 'Winter' && Math.random() > 0.8 && (
                            <circle
                              cx={symbolX + TILE_SIZE_PX / 2}
                              cy={symbolY + TILE_SIZE_PX / 2}
                              r="1"
                              fill="white"
                              opacity="0.8"
                            />
                          )}
                        </g>
                      );
                    }
                  }
                  
                  return null;
                })}
              </g>
            )}
            
            {/* Lava tiles - dramatic animated effect */}
            {shouldRenderDetailedSymbols && (
              <g>
                {flatTiles.map((tile) => {
                  if (tile.biome !== BiomeType.ACTIVE_LAVA) return null;
                  const lavaX = tile.x * TILE_SIZE_PX;
                  const lavaY = tile.y * TILE_SIZE_PX;
                  const lavaSeed = seed + tile.x * 47 + tile.y * 53;
                  return (
                    <LavaSymbolCSS 
                      key={`lava-${tile.x}-${tile.y}`}
                      x={lavaX}
                      y={lavaY}
                      size={TILE_SIZE_PX}
                      seed={lavaSeed}
                    />
                  );
                })}
              </g>
            )}
            
            {/* Animal Paddocks (fences) */}
            {shouldRenderDetailedSymbols && (
              <g>
                {flatTiles.map((tile) => {
                  if (tile.paddockType !== 'Livestock') return null;
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  
                  // Get adjacent tiles to determine which fences to draw
                  const adjacentTiles = {
                    north: tile.y > 0 ? tiles[tile.y - 1][tile.x] : undefined,
                    south: tile.y < MAP_HEIGHT_TILES - 1 ? tiles[tile.y + 1][tile.x] : undefined,
                    east: tile.x < MAP_WIDTH_TILES - 1 ? tiles[tile.y][tile.x + 1] : undefined,
                    west: tile.x > 0 ? tiles[tile.y][tile.x - 1] : undefined,
                  };

                  // Get cultural zone for paddock styling
                  const { year } = parseDateString(mapData.timeSlice || '1650');
                  const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', year);

                  return (
                    <PaddockSymbol
                      key={`paddock-${tile.x}-${tile.y}`}
                      x={symbolX}
                      y={symbolY}
                      size={TILE_SIZE_PX}
                      tile={tile}
                      adjacentTiles={adjacentTiles}
                      culturalZone={culturalZone}
                    />
                  );
                })}
              </g>
            )}
            
            {/* Vegetation (trees, bushes, etc) */}
            {shouldRenderVegetation && vegetation?.map(veg => {
              const renderX = veg.x * TILE_SIZE_PX;
              const renderY = veg.y * TILE_SIZE_PX;
              
              const symbolComponents: Record<string, React.FC<any>> = {
                'pine': PineTreeSymbol,
                'palm': PalmTreeSymbol,
                'deciduous': DeciduousTreeSymbol,
                'cactus': CactusSymbol,
                'bush': BushSymbol,
              };
              
              const SymbolComponent = symbolComponents[veg.symbol];

              if (SymbolComponent) {
                return (
                  <g key={veg.id} 
                     transform={`translate(${renderX}, ${renderY}) scale(${TILE_SIZE_PX / 24})`}>
                    <SymbolComponent seed={seed + veg.x * 13 + veg.y * 31} season={season} climate={climate} />
                  </g>
                );
              }
              return (
                <text
                  key={veg.id}
                  x={renderX + TILE_SIZE_PX / 2}
                  y={renderY + TILE_SIZE_PX / 1.5}
                  fontSize={TILE_SIZE_PX * 1.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ 
                    filter: shouldRenderShadows ? 'drop-shadow(2px 3px 4px rgba(0,0,0,0.7))' : 'none', 
                    pointerEvents: 'none'
                  }}
                >
                  {veg.symbol}
                </text>
              );
            })}
            
            {/* Urban and structure symbols layer (rendered ABOVE terrain features) */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {flatTiles.map((tile) => {
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  const elements = [];
                  
                  // Only render urban/structure symbols in this pass
                  if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(tile.biome)) {
                    elements.push(
                      <g
                        key={`urban-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredTile(tile);
                            setHoveredTileCoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredTile(null);
                          setHoveredTileCoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <UrbanSymbol x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} location={mapData.localArea || mapData.region || currentLocation} nightIntensity={timeOfDayData.isNight ? 0.6 : 0} />
                        {hoveredTile === tile && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2"
                            opacity="0.8"
                            rx="3"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  } else if (tile.biome === BiomeType.GOVERNMENT_DISTRICT) {
                    elements.push(
                      <g
                        key={`gov-district-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredTile(tile);
                            setHoveredTileCoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredTile(null);
                          setHoveredTileCoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <GovernmentDistrictSymbol 
                          x={symbolX} 
                          y={symbolY} 
                          size={TILE_SIZE_PX} 
                          seed={tileSeed} 
                          tile={tile} 
                          date={formattedDate} 
                          zone={currentLocation} 
                          nightIntensity={timeOfDayData.isNight ? 0.6 : 0} 
                        />
                      </g>
                    );
                  } else if(tile.biome === BiomeType.MARKETPLACE) {
                    // Create a pseudo-structure for marketplace hover
                    const marketplaceStructure: TerrainStructure = {
                      id: `marketplace-${tile.x}-${tile.y}`,
                      name: tile.cityName ? `${tile.cityName} Market` : 'Marketplace',
                      structureType: 'marketplace' as any,
                      location: [tile.x, tile.y],
                      state: 'active',
                      population: tile.population || 50,
                      allegianceGroup: mapData.dominantPower || 'Local Authority',
                      outputGoods: ['food', 'crafts', 'textiles', 'spices']
                    };
                    
                    elements.push(
                      <g
                        key={`marketplace-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(marketplaceStructure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <MarketplaceSymbol x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} nightIntensity={timeOfDayData.isNight ? 0.6 : 0} date={formattedDate} zone={currentLocation} />
                        {hoveredPOI?.id === marketplaceStructure.id && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="rgba(255, 191, 0, 0.8)"
                            strokeWidth="3"
                            className="animate-pulse"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  } else if(tile.biome === BiomeType.PALACE) {
                    const palaceType = tile.palaceType || 'generic';
                    const culture = currentLocation || 'Europe';
                    // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    const era = year < 500 ? 'ancient' : year < 1500 ? 'medieval' : 'modern';
                    
                    // Removed console.log to prevent infinite spam
                    const PalaceComponent = getPalaceSymbol(palaceType, culture, era);
                    
                    // Find the structure for this palace or create a fallback
                    let palaceStructure = terrainStructures?.find(s => 
                      s.location[0] === tile.x && s.location[1] === tile.y && s.structureType === 'palace'
                    );
                    
                    // Create fallback structure if not found
                    if (!palaceStructure) {
                      palaceStructure = {
                        id: `palace-${tile.x}-${tile.y}`,
                        name: 'Royal Palace',
                        structureType: 'palace' as const,
                        location: [tile.x, tile.y],
                        allegianceGroup: null,
                        state: 'active' as const,
                        treasury: { gold: 100, silver: 200, gems: 50 }
                      };
                    }
                    
                    elements.push(
                      <g 
                        key={`palace-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(palaceStructure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <PalaceComponent x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />
                        {hoveredPOI?.id === palaceStructure?.id && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="rgba(255, 191, 0, 0.8)"
                            strokeWidth="3"
                            className="animate-pulse"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  } else if(tile.biome === BiomeType.RUINS) {
                    // Find the structure for this ruin or create a fallback
                    let ruinStructure = terrainStructures?.find(s => 
                      s.location[0] === tile.x && s.location[1] === tile.y && s.structureType === 'ruin'
                    );
                    
                    // Create fallback structure if not found
                    if (!ruinStructure) {
                      ruinStructure = {
                        id: `ruin-${tile.x}-${tile.y}`,
                        name: 'Ancient Ruins',
                        structureType: 'ruin' as const,
                        location: [tile.x, tile.y],
                        allegianceGroup: null,
                        state: 'ruined' as const,
                        treasury: Math.random() > 0.5 ? { gold: 10, silver: 20 } : null
                      };
                    }
                    
                    elements.push(
                      <g 
                        key={`ruins-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(ruinStructure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <RuinsSymbolNew x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} />
                        {hoveredPOI?.id === ruinStructure?.id && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="rgba(255, 191, 0, 0.8)"
                            strokeWidth="3"
                            className="animate-pulse"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  } else if(tile.biome === BiomeType.HOLY_SITE) {
                    // Get cultural zone and year for proper selection
                    const { year, era } = parseDateString(mapData.timeSlice || '1650');
                    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', year);
                    
                    // Use assigned religion or get region-appropriate fallback
                    let religion = tile.holyPlaceReligion;
                    if (!religion || religion === 'generic') {
                      // For modern/future era, default to most common religion for the region
                      if (year >= 1900) {
                        // Regional defaults for modern era
                        if (culturalZone === 'SOUTH_AMERICAN' || culturalZone === 'MEDITERRANEAN') {
                          religion = 'Roman Catholicism';
                        } else if (culturalZone === 'MENA') {
                          religion = 'Islam';
                        } else if (culturalZone === 'SOUTH_ASIAN') {
                          religion = 'Hinduism';
                        } else if (culturalZone === 'EAST_ASIAN') {
                          religion = 'Buddhism';
                        } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
                          religion = year >= 1800 ? 'Christianity' : 'Traditional African';
                        } else {
                          religion = 'Christianity'; // Generic Christian for Europe/Americas
                        }
                      } else {
                        // Historical era fallbacks
                        religion = 'Traditional'; // Generic traditional/folk religion
                      }
                    }
                    
                    const HolySiteComponent = getHolySiteSymbol(religion, culturalZone, tile.holyPlaceType);
                    
                    // Find the structure for this holy site or create a fallback
                    let holySiteStructure = terrainStructures?.find(s => 
                      s.location[0] === tile.x && s.location[1] === tile.y && s.structureType === 'holy_site'
                    );
                    
                    // Create fallback structure if not found
                    if (!holySiteStructure) {
                      holySiteStructure = {
                        id: `holy-site-${tile.x}-${tile.y}`,
                        name: `${religion.charAt(0).toUpperCase() + religion.slice(1)} Temple`,
                        structureType: 'holy_site' as const,
                        location: [tile.x, tile.y],
                        allegianceGroup: null,
                        religion: religion,
                        state: 'active' as const,
                        treasury: null
                      };
                    }
                    
                    elements.push(
                      <g 
                        key={`holy-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(holySiteStructure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <HolySiteComponent x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />
                        {hoveredPOI?.id === holySiteStructure?.id && (
                          <rect
                            x={symbolX}
                            y={symbolY}
                            width={TILE_SIZE_PX}
                            height={TILE_SIZE_PX}
                            fill="none"
                            stroke="rgba(255, 191, 0, 0.8)"
                            strokeWidth="3"
                            className="animate-pulse"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  }

                  return elements;
                })}

                {/* Terrain Structures  */}
                {terrainStructures?.map(structure => {
                  const blueprint = STRUCTURE_BLUEPRINTS[structure.structureType];
                  if (!blueprint) return null;
                  const isPoi = ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
                  if(isPoi) return null;

                  // Check if structure is on a government district - if so, don't render it
                  const tileAtLocation = mapData?.tiles?.[structure.location[1]]?.[structure.location[0]];
                  if (tileAtLocation && tileAtLocation.biome === BiomeType.GOVERNMENT_DISTRICT) {
                    return null; // Don't render structures on government districts
                  }

                  const structX = structure.location[0] * TILE_SIZE_PX;
                  const structY = structure.location[1] * TILE_SIZE_PX;
                  const isRuined = structure.state === 'ruined';
                  
                  // Special handling for government districts with custom SVG symbols
                  if (structure.structureType === 'government_district' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    const tileAtLocation = mapData.tiles?.find(t => t.x === structure.location[0] && t.y === structure.location[1]);
                    
                    // Select the appropriate government building symbol based on name
                    let GovernmentComponent;
                    const govName = structure.name?.toLowerCase() || '';
                    // Removed console.log to prevent infinite spam
                    
                    if (govName.includes('city hall')) {
                      GovernmentComponent = CityHallSymbol;
                    } else if (govName.includes('tribal council')) {
                      GovernmentComponent = TribalCouncilSymbol;
                    } else if (govName.includes('mandate hall')) {
                      GovernmentComponent = MandateHallSymbol;
                    } else if (govName.includes('caliph court')) {
                      GovernmentComponent = CaliphCourtSymbol;
                    } else if (govName.includes('colonial office')) {
                      GovernmentComponent = ColonialOfficeSymbol;
                    } else if (govName.includes('roman forum')) {
                      GovernmentComponent = RomanForumSymbol;
                    } else {
                      GovernmentComponent = CityHallSymbol; // Default fallback
                    }
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}>
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <GovernmentComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                            date={formattedDate}
                            zone={currentLocation || "Europe"}
                          />
                        </g>
                      </g>
                    );
                  }

                  // Special handling for factory with custom SVG symbols
                  if (structure.structureType === 'factory' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    const tileAtLocation = mapData.tiles?.find(t => t.x === structure.location[0] && t.y === structure.location[1]);
                    
                    // Select the appropriate factory symbol based on subtype
                    let FactoryComponent;
                    switch (structure.factorySymbolType) {
                      case 'plantation':
                        FactoryComponent = PlantationSymbol;
                        break;
                      case 'warehouse':
                        FactoryComponent = WarehouseSymbol;
                        break;
                      case 'manufactory':
                        FactoryComponent = ManufactorySymbol;
                        break;
                      case 'refinery':
                        FactoryComponent = RefinerySymbol;
                        break;
                      case 'factory19th':
                        FactoryComponent = Factory19thSymbol;
                        break;
                      case 'factory20th':
                        FactoryComponent = Factory20thSymbol;
                        break;
                      default:
                        FactoryComponent = Factory19thSymbol; // Default fallback
                    }
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}>
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <FactoryComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                            tile={tileAtLocation || { x: structure.location[0], y: structure.location[1], elevation: 0 }}
                            date={formattedDate}
                            zone={currentLocation || "Europe"}
                            nightIntensity={timeOfDayData.nightIntensity}
                          />
                        </g>
                      </g>
                    );
                  }

                  // Special handling for fishing hut with custom SVG symbol
                  if (structure.structureType === 'fishing_hut' && !isRuined) {
                    // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    const isModern = year >= 1800; // Modern era starts around 1800
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}>
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <FishingHutSymbol 
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                            date={formattedDate}
                            isModern={isModern}
                          />
                        </g>
                      </g>
                    );
                  }

                  // Special handling for mills with custom SVG symbols
                  if (structure.structureType === 'mill' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    
                    // Removed console.log to prevent infinite spam
                    
                    // Determine mill type based on era and name
                    let era = 'medieval'; // Default
                    if (year < -2000) era = 'prehistoric';
                    else if (year < 500) era = 'ancient';
                    else if (year < 1500) era = 'medieval';
                    else if (year < 1750) era = 'renaissance';
                    else if (year < 1900) era = 'industrial';
                    else if (year < 2000) era = 'modern';
                    else era = 'contemporary';
                    
                    // Removed console.log to prevent infinite spam
                    
                    const MillComponent = getMillSymbol(structure.name || 'Water Mill', era);
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                      >
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <MillComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                            millType={structure.name}
                          />
                          {hoveredPOI?.id === structure?.id && (
                            <rect
                              x={structX}
                              y={structY}
                              width={TILE_SIZE_PX}
                              height={TILE_SIZE_PX}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="2"
                              opacity="0.8"
                              rx="3"
                            />
                          )}
                        </g>
                      </g>
                    );
                  }

                  // Special handling for mines with custom SVG symbols
                  if (structure.structureType === 'mining_colony' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 41 + structure.location[1] * 43;
                    const era = (structure as any).era || 'MEDIEVAL'; // Get era from structure
                    const MineComponent = getMineSymbol(era);
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                      >
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <MineComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                          />
                          {hoveredPOI?.id === structure?.id && (
                            <rect
                              x={structX}
                              y={structY}
                              width={TILE_SIZE_PX}
                              height={TILE_SIZE_PX}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="2"
                              opacity="0.8"
                              rx="3"
                            />
                          )}
                        </g>
                      </g>
                    );
                  }

                  // Special handling for quarries with custom SVG symbols
                  if (structure.structureType === 'quarry' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 47 + structure.location[1] * 53;
                    const era = (structure as any).era || 'MEDIEVAL'; // Get era from structure
                    const QuarryComponent = getQuarrySymbol(era);
                    
                    return (
                      <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                      >
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <QuarryComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                          />
                          {hoveredPOI?.id === structure?.id && (
                            <rect
                              x={structX}
                              y={structY}
                              width={TILE_SIZE_PX}
                              height={TILE_SIZE_PX}
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="2"
                              opacity="0.8"
                              rx="3"
                            />
                          )}
                        </g>
                      </g>
                    );
                  }

                  // Special handling for fortresses with custom SVG symbols
                  if (structure.structureType === 'fortress' && !isRuined) {
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                    
                    // Determine fortress era
                    let era = 'medieval'; // Default
                    if (year < -2000) era = 'prehistoric';
                    else if (year < 500) era = 'ancient';
                    else if (year < 1500) era = 'medieval';
                    else if (year < 1750) era = 'renaissance';
                    else if (year < 1900) era = 'early_modern';
                    else if (year < 2000) era = 'modern';
                    else era = 'contemporary';
                    
                    // Get cultural zone from structure or default
                    const culturalZone = (structure as any).culturalZone || (structure as any).culture || 'EUROPEAN';
                    
                    // Use fortress name, era and cultural zone for proper fortress selection
                    const FortressComponent = getFortressSymbol(structure.name || '', era, culturalZone);
                    
                    return (
                      <g 
                        key={structure.id} 
                        className={!isSafari ? "transition-transform duration-200" : ""}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                      >
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <FortressComponent
                            x={structX} 
                            y={structY} 
                            size={TILE_SIZE_PX} 
                            seed={tileSeed}
                            fortressType={structure.name}
                          />
                          {hoveredPOI?.id === structure?.id && (
                            <rect
                              x={structX}
                              y={structY}
                              width={TILE_SIZE_PX}
                              height={TILE_SIZE_PX}
                              fill="none"
                              stroke="rgba(255, 191, 0, 0.8)"
                              strokeWidth="3"
                              className="animate-pulse"
                              pointerEvents="none"
                            />
                          )}
                        </g>
                      </g>
                    );
                  }
                  
                  // Handle lumber camps with custom symbol
                  if (structure.structureType === 'lumber_camp') {
                    const tileSeed = seed + structure.location[0] * 31 + structure.location[1] * 37;
                    return (
                      <g 
                        key={structure.id} 
                        className={!isSafari ? "transition-transform duration-200" : ""}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            setHoveredPOICoords({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                      >
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
                          <title>{`${structure.name} (${structure.structureType})`}</title>
                          <LumberCampSymbol
                            x={structX}
                            y={structY}
                            size={TILE_SIZE_PX}
                            seed={tileSeed}
                          />
                          {hoveredPOI?.id === structure?.id && (
                            <rect
                              x={structX}
                              y={structY}
                              width={TILE_SIZE_PX}
                              height={TILE_SIZE_PX}
                              fill="none"
                              stroke="rgba(255, 191, 0, 0.8)"
                              strokeWidth="3"
                              className="animate-pulse"
                              pointerEvents="none"
                            />
                          )}
                        </g>
                      </g>
                    );
                  }
                  
                  // Default emoji rendering for other structures
                  const centerX = structX + TILE_SIZE_PX / 2;
                  const centerY = structY + TILE_SIZE_PX / 2;
                  return (
                    <g key={structure.id} className={!isSafari ? "transition-transform duration-200" : ""}>
                      <text
                        x={centerX}
                        y={centerY}
                        fontSize={TILE_SIZE_PX * 1.3}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ 
                          cursor: 'pointer',
                          filter: shouldRenderShadows 
                            ? (isRuined ? 'grayscale(1) drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' : 'drop-shadow(2px 3px 4px rgba(0,0,0,0.9))')
                            : (isRuined ? 'grayscale(1)' : 'none'),
                          opacity: isRuined ? 0.6 : 1,
                          pointerEvents: 'auto'
                        }}
                      >
                        <title>{`${structure.name} (${structure.structureType})`}</title>
                        {isRuined ? '❓' : blueprint.icon}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Special Map Symbols for Architectural Biomes */}
            {isSpecialMap && mapData && (
              <g>
                {flatTiles.filter(tile => {
                  // Render ALL special map biomes that need custom symbols
                  // This includes walls, floors, and furniture for proper 2.5D rendering
                  const specialMapBiomes = [
                    // Walls and structural elements (now with 2.5D symbols!)
                    BiomeType.WALL, BiomeType.WALL_GATE, BiomeType.WALL_WINDOW,
                    BiomeType.DOOR, BiomeType.DOOR_LOCKED, BiomeType.ARCHWAY,
                    // Back walls for 3/4 perspective
                    BiomeType.WALL_BACK, BiomeType.WALL_BACK_WINDOW, BiomeType.WALL_BACK_DOOR,
                    // Floors (with beautiful textures)
                    BiomeType.FLOOR_STONE, BiomeType.FLOOR_WOOD, BiomeType.FLOOR_MARBLE,
                    BiomeType.FLOOR_TILE, BiomeType.FLOOR_CARPET, BiomeType.FLOOR_PATTERN,
                    BiomeType.FLOOR_CHECKERED, BiomeType.FLOOR_MOSAIC,
                    BiomeType.FLOOR_MOSAIC_CENTER, BiomeType.FLOOR_MOSAIC_BORDER,
                    // Furniture and interactive items
                    BiomeType.TABLE, BiomeType.TABLE_LEFT, BiomeType.TABLE_CENTER, BiomeType.TABLE_RIGHT,
                    BiomeType.CHAIR, BiomeType.BENCH, BiomeType.BED,
                    BiomeType.THRONE, BiomeType.BOOKSHELF, BiomeType.DESK,
                    BiomeType.FOUNTAIN, BiomeType.STATUE, BiomeType.COLUMN, BiomeType.PILLAR,
                    BiomeType.CARPET, BiomeType.ALTAR, BiomeType.SHRINE,
                    BiomeType.BRAZIER, BiomeType.CHEST, BiomeType.BARREL, BiomeType.TORCH,
                    BiomeType.PODIUM, BiomeType.CABINET, BiomeType.MIRROR,
                    BiomeType.BATH, BiomeType.KITCHEN_COUNTER, BiomeType.KITCHEN_SINK,
                    BiomeType.WEAPON_RACK, BiomeType.ARMOR_STAND, BiomeType.STAIRS,
                    BiomeType.FIRE_PIT, BiomeType.HEARTH, BiomeType.CHANDELIER,
                    BiomeType.SCREEN, BiomeType.FILING_CABINET, BiomeType.TOILET, BiomeType.BASIN,
                    BiomeType.ENTRANCE_PORTAL, BiomeType.PATH, BiomeType.LANTERN
                    // Note: Landscape biomes (PARK, FOREST, etc.) are rendered by canvas, not as symbols
                  ];
                  return specialMapBiomes.includes(tile.biome);
                }).map(tile => {
                  // Get proper cultural zone from mapData or derive from location
                  const { year } = parseDateString(formattedDate);
                  const culturalZone = mapData.culturalZone || 
                                      mapLocationToCulture(mapData.continent || currentLocation || 'Europe', year);
                  
                  // Debug logging for pillar tiles
                  if (tile.biome === BiomeType.PILLAR) {
                    console.log(`[MultiTile Debug] Passing multiTileData to renderer for tile (${tile.x}, ${tile.y}):`, (tile as any).multiTileData);
                  }

                  return (
                    <SpecialMapSymbolRenderer
                      key={`special-${tile.x}-${tile.y}`}
                      biome={tile.biome}
                      x={tile.x * TILE_SIZE_PX}
                      y={tile.y * TILE_SIZE_PX}
                      size={TILE_SIZE_PX}
                      culturalZone={culturalZone}
                      era={parseDateString(formattedDate).era}
                      year={year}
                      seed={seed + tile.x * 31 + tile.y * 37}
                      multiTileData={(tile as any).multiTileData}
                      specialArchetype={(mapData as any).specialArchetype}
                      tile={tile}
                      materialSubtype={(tile as any).materialSubtype}
                    />
                  );
                })}
              </g>
            )}

            {/* Overlay objects layer - furniture and objects on top of floor tiles */}
            {isSpecialMap && mapData && (() => {
              // Using memoized overlayTiles instead of filtering every render
              // Overlay tiles found: ${overlayTiles.length} (debug log removed to reduce console spam)
              if (overlayTiles.length > 0) {
                // Container types that can be clicked to open
                const CLICKABLE_CONTAINERS = [
                  'CHEST', 'BARREL', 'CRATE', 'CABINET', 'BOOKSHELF', 'FILING_CABINET',
                  'TANSU', 'SPICE_CABINET', 'WEAPON_RACK', 'ARMOR_STAND', 'TOOL_CHEST',
                  'TOOL_CABINET', 'CHEST_ORNATE', 'CHEST_REINFORCED', 'ARMOIRE',
                  'WARDROBE', 'PANTRY_CABINET', 'RICE_CHEST', 'SCROLL_RACK',
                  'LACQUER_BOX', 'CEDAR_CHEST', 'GRANARY_BASKET', 'WOVEN_CHEST',
                  'BASKET', 'ICE_BOX', 'WINE_RACK', 'SPICE_RACK'
                ];
                
                return (
                  <g className="overlay-objects-layer">
                    {overlayTiles.map(tile => {
                      // Get proper cultural zone from mapData or derive from location
                      const { year } = parseDateString(formattedDate);
                      const culturalZone = mapData.culturalZone || 
                                          mapLocationToCulture(mapData.continent || currentLocation || 'Europe', year);
                      
                      const isClickableContainer = tile.overlayObject &&
                                                 CLICKABLE_CONTAINERS.includes(tile.overlayObject.type as string);

                      // Check if container has items - either floor items or cached container contents
                      const hasFloorItem = tile.collectibleItem && !tile.collectibleItem.collected;

                      // For containers, we'll use a simpler approach without hooks inside the map
                      // Assume containers have items by default, and valuable ones glow gold
                      const hasContainerItems = isClickableContainer; // Containers always show as having items until opened
                      const isValuable = isClickableContainer && (tile.roomPrivacy === 'private' || tile.roomPrivacy === 'restricted');

                      const hasItems = hasFloorItem || hasContainerItems;
                      
                      return (
                        <g
                          key={`overlay-${tile.x}-${tile.y}`}
                          style={{
                            cursor: isClickableContainer ? 'pointer' : 'default',
                            filter: hasItems ? (
                              isValuable ?
                                'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' : // Gold glow for valuable
                                'drop-shadow(0 0 3px rgba(135, 206, 235, 0.6))'  // Blue glow for normal
                            ) : undefined
                          }}
                          className={hasItems ? (isValuable ? 'container-with-valuable-loot' : 'container-with-loot') : ''}
                          onClick={isClickableContainer ? (e) => {
                            e.stopPropagation();
                            onContainerClick?.(tile.x, tile.y, tile);
                          } : undefined}
                        >
                          <OverlayRenderer
                            tile={tile}
                            x={tile.x * TILE_SIZE_PX}
                            y={tile.y * TILE_SIZE_PX}
                            size={TILE_SIZE_PX}
                            culturalZone={culturalZone}
                            era={parseDateString(formattedDate).era}
                            seed={seed + tile.x * 31 + tile.y * 37}
                            nightIntensity={timeOfDayData.nightIntensity}
                            specialArchetype={(mapData as any).specialArchetype}
                          />
                          {hasItems && (
                            <circle
                              cx={tile.x * TILE_SIZE_PX + TILE_SIZE_PX * 0.8}
                              cy={tile.y * TILE_SIZE_PX + TILE_SIZE_PX * 0.2}
                              r={isValuable ? 4 : 3}
                              fill={isValuable ? "gold" : "lightblue"}
                              stroke={isValuable ? "darkorange" : "steelblue"}
                              strokeWidth={1}
                              opacity={0.9}
                              className={isValuable ? "valuable-loot-indicator" : "loot-indicator"}
                            >
                              <animate
                                attributeName="opacity"
                                values={isValuable ? "0.6;1;0.6" : "0.5;0.9;0.5"}
                                dur={isValuable ? "1.5s" : "2s"}
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              }
              return null;
            })()}

            {/* Dug tiles - show earth piles where player has dug */}
            {mapData?.terrainModifications?.dugTiles?.map(dugTile => {
              const x = dugTile.x * TILE_SIZE_PX;
              const y = dugTile.y * TILE_SIZE_PX;
              return (
                <DugEarthSymbol
                  key={`dug-${dugTile.x}-${dugTile.y}`}
                  x={x}
                  y={y}
                  cellSize={TILE_SIZE_PX}
                />
              );
            })}

            {/* Multi-tile pillars layer - rendered above base tiles */}
            {isSpecialMap && (mapData as any)?.multiTileObjects && (() => {
              const multiTileObjects = (mapData as any).multiTileObjects || [];
              const pillars = multiTileObjects.filter((obj: any) => obj.type === 'pillar');
              console.log(`[MultiTile Debug] Rendering ${multiTileObjects.length} total objects, ${pillars.length} pillars:`, pillars);
              return (
                <g className="multi-tile-pillars-layer">
                  {pillars.map((pillar: any) => {
                    console.log(`[MultiTile Debug] Rendering pillar:`, pillar);
                    return (
                      <MultiTilePillar
                        key={pillar.id}
                        x={pillar.baseX}
                        y={pillar.baseY}
                        height={pillar.height}
                        material={pillar.material}
                        tileWidth={TILE_SIZE_PX}
                        tileHeight={TILE_SIZE_PX}
                        offsetX={0}
                        offsetY={0}
                      />
                    );
                  })}
                </g>
              );
            })()}

            {/* Mineral deposits layer - subtle glints on the map */}
            {mapData && shouldRenderAnimations && flatTiles.filter(tile => 
              tile.mineralDeposit && tile.mineralDeposit.quantity > 0
            ).map(tile => (
              <MineralGlintSymbol
                key={`mineral-${tile.x}-${tile.y}`}
                x={tile.x}
                y={tile.y}
                metalId={tile.mineralDeposit!.metalId}
                quantity={tile.mineralDeposit!.quantity}
                tileSize={TILE_SIZE_PX}
                shouldAnimate={false}
              />
            ))}

            {/* Deployed Vessels layer */}
            <g>
              {(deployedVessels || []).map(vessel => (
                <g key={vessel.id} 
                   onClick={(e) => { e.stopPropagation(); onVesselClick?.(vessel); }} 
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}
                   className="smooth-movement"
                   transform={`translate(${vessel.x * TILE_SIZE_PX}, ${vessel.y * TILE_SIZE_PX})`}>
                  {/* Shadow beneath vessel */}
                  <ellipse
                    cx={TILE_SIZE_PX/2}
                    cy={TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.3}
                    rx={TILE_SIZE_PX * 0.4}
                    ry={TILE_SIZE_PX * 0.15}
                    fill="rgba(0, 0, 0, 0.3)"
                    opacity="0.8"
                  />
                  <VesselSymbol 
                    vessel={vessel.vesselItem} 
                    x={TILE_SIZE_PX/2} 
                    y={TILE_SIZE_PX/2} 
                    size={TILE_SIZE_PX * 1.1} 
                  />
                  {/* Availability indicator */}
                  {vessel.isAvailable && (
                    <circle
                      cx={TILE_SIZE_PX * 0.8}
                      cy={TILE_SIZE_PX * 0.2}
                      r={TILE_SIZE_PX * 0.08}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  )}
                </g>
              ))}
            </g>

            {/* Animals and NPCs layer  */}
            <g>
              {(animals || []).filter(animal => {
                // Only show animals within 10 tiles of player
                if (logicalControlledIconX === null || logicalControlledIconY === null) return true;
                const dx = animal.x - logicalControlledIconX;
                const dy = animal.y - logicalControlledIconY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= 10;
              }).map(animal => (
                <g key={animal.id}
                   onClick={(e) => { e.stopPropagation(); onAnimalClick(animal); }}
                   onMouseEnter={(e) => {
                     if (!isDragging) {
                       setHoveredAnimal(animal);
                       setHoveredEntityCoords({ x: e.clientX, y: e.clientY });
                     }
                   }}
                   onMouseLeave={() => {
                     setHoveredAnimal(null);
                     setHoveredEntityCoords(null);
                   }}
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}
                   className="smooth-movement"
                   transform={`translate(${animal.x * TILE_SIZE_PX}, ${animal.y * TILE_SIZE_PX})`}>
                  {/* Shadow beneath animal */}
                  <ellipse
                    cx={TILE_SIZE_PX/2}
                    cy={TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.4}
                    rx={TILE_SIZE_PX * 0.3}
                    ry={TILE_SIZE_PX * 0.1}
                    fill="rgba(0,0,0,0.3)"
                    filter={shouldUseBlurEffects ? "blur(2px)" : "none"}
                  />
                  <text
                    x={TILE_SIZE_PX/2}
                    y={TILE_SIZE_PX/2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={TILE_SIZE_PX * 1.2 * (ANIMAL_DATA[animal.baseId]?.sizeMultiplier || 1.0)}
                    className={selectedAnimalId === animal.id ? 'animate-ff6-idle-bob' : ''}
                    style={{
                      filter: shouldRenderShadows ? 'drop-shadow(2px 3px 4px rgba(0,0,0,0.8))' : 'none',
                      stroke: selectedAnimalId === animal.id ? 'yellow' : 'none',
                      strokeWidth: selectedAnimalId === animal.id ? 2 : 0
                    }}
                  >
                    {animal.emoji}
                  </text>
                  {(hoveredAnimal?.id === animal.id || selectedAnimalId === animal.id) && (
                    <rect
                      x={0}
                      y={0}
                      width={TILE_SIZE_PX}
                      height={TILE_SIZE_PX}
                      fill="none"
                      stroke={isAnimalHostile(animal) ? "#ef4444" : isAnimalAlert(animal) ? "#eab308" : "#3b82f6"}
                      strokeWidth={selectedAnimalId === animal.id ? "3" : "2"}
                      opacity={selectedAnimalId === animal.id ? "1" : "0.8"}
                      rx="3"
                      pointerEvents="none"
                      className={isAnimalHostile(animal) ? "animate-pulse" : ""}
                    />
                  )}
                </g>
              ))}
              
              {/* Tamed Animals Following Player - Only show when on foot and limit to one (disabled on Safari for performance) */}
              {playerMode === 'onFoot' && !isSafari() && tamedAnimals.slice(0, 1).map((animal, index) => {
                // Calculate position behind player
                let followX = logicalControlledIconX || 0;
                let followY = logicalControlledIconY || 0;
                
                // Position the animal 1 tile behind the player
                const offsetDirection = lastMoveDirection || { x: 0, y: 1 };
                followX -= offsetDirection.x;
                followY -= offsetDirection.y;
                
                // Keep within map bounds
                followX = Math.max(0, Math.min(MAP_WIDTH_TILES - 1, followX));
                followY = Math.max(0, Math.min(MAP_HEIGHT_TILES - 1, followY));
                
                return (
                  <g key={`tamed-${animal.id}`}
                     className="smooth-movement"
                     transform={`translate(${followX * TILE_SIZE_PX}, ${followY * TILE_SIZE_PX})`}
                     onClick={() => {
                       console.log('[MapDisplay] Companion clicked:', animal);
                       onCompanionClick?.(animal);
                     }}
                     style={{ cursor: 'pointer', pointerEvents: 'all' }}>
                    {/* Shadow beneath tamed animal */}
                    <ellipse
                      cx={TILE_SIZE_PX/2}
                      cy={TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.4}
                      rx={TILE_SIZE_PX * 0.3 * (ANIMAL_DATA[animal.baseId]?.sizeMultiplier || 1.0)}
                      ry={TILE_SIZE_PX * 0.1 * (ANIMAL_DATA[animal.baseId]?.sizeMultiplier || 1.0)}
                      fill="rgba(0,0,0,0.3)"
                      filter={shouldUseBlurEffects ? "blur(2px)" : "none"}
                    />
                    {/* Green glow to indicate tamed */}
                    <circle
                      cx={TILE_SIZE_PX/2}
                      cy={TILE_SIZE_PX/2}
                      r={TILE_SIZE_PX * 0.6}
                      fill="rgba(0, 255, 0, 0.2)"
                      filter={shouldUseBlurEffects ? "blur(4px)" : "none"}
                    />
                    <text
                      x={TILE_SIZE_PX/2}
                      y={TILE_SIZE_PX/2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={TILE_SIZE_PX * 0.8 * (ANIMAL_DATA[animal.baseId]?.sizeMultiplier || 1.0)}
                      className="animate-ff6-idle-bob"
                      style={{
                        filter: shouldRenderShadows ? 'drop-shadow(2px 3px 4px rgba(0,0,0,0.8))' : 'none',
                      }}
                    >
                      {animal.emoji}
                    </text>
                    {/* Small loyalty indicator */}
                    <rect
                      x={TILE_SIZE_PX * 0.2}
                      y={TILE_SIZE_PX * 0.85}
                      width={TILE_SIZE_PX * 0.6}
                      height={2}
                      fill="rgba(0,0,0,0.5)"
                    />
                    <rect
                      x={TILE_SIZE_PX * 0.2}
                      y={TILE_SIZE_PX * 0.85}
                      width={TILE_SIZE_PX * 0.6 * (animal.loyalty / 100)}
                      height={2}
                      fill="lime"
                    />
                  </g>
                );
              })}
              
              {(npcs || []).filter(npc => {
                // Only show NPCs within 10 tiles of player
                if (logicalControlledIconX === null || logicalControlledIconY === null) return true;
                const dx = npc.x - logicalControlledIconX;
                const dy = npc.y - logicalControlledIconY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= 10;
              }).map(npc => (
                <g key={npc.id}
                   onClick={(e) => { e.stopPropagation(); onNpcClick(npc); }}
                   onMouseEnter={(e) => {
                     if (!isDragging) {
                       setHoveredNPC(npc);
                       setHoveredEntityCoords({ x: e.clientX, y: e.clientY });
                     }
                   }}
                   onMouseLeave={() => {
                     setHoveredNPC(null);
                     setHoveredEntityCoords(null);
                   }}
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}
                   className={`smooth-movement ${selectedNpcId === npc.id ? 'animate-ff6-idle-bob' : ''}`}
                   transform={`translate(${npc.x * TILE_SIZE_PX}, ${npc.y * TILE_SIZE_PX})`}>
                  {/* Shadow beneath NPC */}
                  <ellipse
                    cx={TILE_SIZE_PX/2}
                    cy={TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.4}
                    rx={TILE_SIZE_PX * 0.35}
                    ry={TILE_SIZE_PX * 0.12}
                    fill="rgba(0,0,0,0.35)"
                    filter={shouldUseBlurEffects ? "blur(2px)" : "none"}
                  />
                  
                  {/* NPC glow completely removed - no lighting effects at all */}
                  {false && (() => {
                    const currentEra = (() => {
                      // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
                    const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
                    let year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
                      year = -year;
                    }
                      if (year < 500) return 'ANTIQUITY';
                      if (year < 1450) return 'MEDIEVAL'; 
                      if (year < 1800) return 'RENAISSANCE';
                      if (year < 1900) return 'INDUSTRIAL';
                      return 'MODERN';
                    })();
                    
                    const npcCulture = currentLocation || 'Europe';
                    const isEastAsian = npcCulture.toLowerCase().includes('asia') || npcCulture.toLowerCase().includes('china') || npcCulture.toLowerCase().includes('japan');
                    const isMENA = npcCulture.toLowerCase().includes('middle east') || npcCulture.toLowerCase().includes('arabia') || npcCulture.toLowerCase().includes('mena');
                    const isAfrican = npcCulture.toLowerCase().includes('africa');
                    
                    // Determine light source and colors based on era and culture
                    let lightColor1, lightColor2, lightSize, hasLight;
                    
                    if (currentEra === 'MODERN') {
                      // Modern era - electric flashlights/lanterns (only some NPCs)
                      hasLight = Math.random() < 0.3; // Only 30% have flashlights
                      lightColor1 = 'rgba(240, 245, 255, 0.12)';
                      lightColor2 = 'rgba(220, 230, 250, 0.18)';
                      lightSize = 1.2;
                    } else if (currentEra === 'INDUSTRIAL') {
                      // Industrial era - oil lanterns
                      hasLight = Math.random() < 0.6; // 60% have lanterns
                      if (isEastAsian) {
                        lightColor1 = 'rgba(255, 200, 100, 0.15)';
                        lightColor2 = 'rgba(255, 160, 80, 0.22)';
                      } else {
                        lightColor1 = 'rgba(255, 180, 90, 0.15)';
                        lightColor2 = 'rgba(255, 140, 60, 0.2)';
                      }
                      lightSize = 1.0;
                    } else {
                      // Medieval and earlier - torches, oil lamps, lanterns
                      hasLight = Math.random() < 0.8; // 80% have some light source
                      
                      if (isEastAsian) {
                        // Paper lanterns and oil lamps
                        lightColor1 = 'rgba(255, 160, 80, 0.18)';
                        lightColor2 = 'rgba(255, 120, 60, 0.25)';
                      } else if (isMENA) {
                        // Oil lamps and braziers
                        lightColor1 = 'rgba(255, 140, 60, 0.18)';
                        lightColor2 = 'rgba(255, 100, 40, 0.25)';
                      } else if (isAfrican) {
                        // Fire torches and oil lamps
                        lightColor1 = 'rgba(255, 130, 50, 0.18)';
                        lightColor2 = 'rgba(255, 90, 30, 0.26)';
                      } else {
                        // European torches and candles
                        lightColor1 = 'rgba(255, 140, 0, 0.15)';
                        lightColor2 = 'rgba(255, 180, 60, 0.22)';
                      }
                      lightSize = 0.9;
                    }
                    
                    if (!hasLight) return null;
                    
                    // Completely static amber glow - no dynamic changes
                    const npcSeed = npc.x * 1000 + npc.y; // Unique seed per NPC for consistent variation
                    const sizeVariation = 0.9 + (npcSeed % 100) / 500; // Small consistent size variation per NPC
                    
                    // Fixed subtle glow - less noticeable, no day/night changes
                    const staticGlowOpacity = 0.3; // Reduced from dynamic system
                    const subtleAmberColor = 'rgba(255, 190, 120, 0.6)'; // Softer amber
                    const warmAmberCore = 'rgba(255, 170, 100, 0.7)'; // Slightly warmer core
                    
                    return (
                      <>
                        {/* Subtle outer glow */}
                        <circle
                          cx={TILE_SIZE_PX/2}
                          cy={TILE_SIZE_PX/2}
                          r={TILE_SIZE_PX * lightSize * 0.7 * sizeVariation}
                          fill={subtleAmberColor}
                          opacity={staticGlowOpacity * 0.5}
                          filter="blur(10px)"
                        />
                        
                        {/* Gentle inner glow */}
                        <circle
                          cx={TILE_SIZE_PX/2}
                          cy={TILE_SIZE_PX/2}
                          r={TILE_SIZE_PX * lightSize * 0.4 * sizeVariation}
                          fill={warmAmberCore}
                          opacity={staticGlowOpacity * 0.7}
                          filter="blur(5px)"
                        />
                        
                        {/* Removed special effects that caused flickering - keeping NPCs simple and static */}
                      </>
                    );
                  })()}
                  
                  <NpcIcon npc={npc} size={TILE_SIZE_PX * 1.2} tileSize={TILE_SIZE_PX} />

                  {/* NPC Helper Mode Overlay */}
                  <NpcHelperOverlay
                    npc={npc}
                    playerX={logicalControlledIconX || 0}
                    playerY={logicalControlledIconY || 0}
                  />
                  {(hoveredNPC?.id === npc.id || selectedNpcId === npc.id) && (() => {
                    const helperMode = getHelperMode(npc.id);
                    const isFollowing = helperMode?.mode === 'lead';
                    const borderColor = isFollowing ? "#10b981" :  // Bright green for following
                                       isNpcHostile(npc) ? "#ef4444" :
                                       isNpcAlert(npc) ? "#eab308" :
                                       "#3b82f6";

                    return (
                      <rect
                        x={0}
                        y={0}
                        width={TILE_SIZE_PX}
                        height={TILE_SIZE_PX}
                        fill="none"
                        stroke={borderColor}
                        strokeWidth={selectedNpcId === npc.id || isFollowing ? "3" : "2"}
                        opacity={selectedNpcId === npc.id || isFollowing ? "1" : "0.8"}
                        rx="3"
                        pointerEvents="none"
                        className={isNpcHostile(npc) ? "animate-pulse" : isFollowing ? "animate-pulse" : ""}
                      />
                    );
                  })()}
                </g>
              ))}
            </g>
            
            {/* Fire overlay layer - rendered above terrain but below NPCs/animals */}
            <g key={`fire-layer-${fireUpdateTrigger}`}>
              {fireService.getAllFires().map((fire) => {
                const fireX = fire.x * TILE_SIZE_PX;
                const fireY = fire.y * TILE_SIZE_PX;
                const opacity = fire.intensity === 1 ? 0.7 :
                               fire.intensity === 2 ? 0.85 : 1.0;
                const scale = fire.intensity === 1 ? 1.0 :
                             fire.intensity === 2 ? 1.2 : 1.4;
                
                return (
                  <g key={`fire-${fire.x}-${fire.y}`}>
                    <text
                      x={fireX + TILE_SIZE_PX / 2}
                      y={fireY + TILE_SIZE_PX / 2}
                      fontSize={TILE_SIZE_PX * 0.8 * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={opacity}
                      className="select-none pointer-events-none"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(255, 100, 0, 0.9)) drop-shadow(0 0 20px rgba(255, 50, 0, 0.6))',
                        animation: `fireFlicker ${0.3 + Math.random() * 0.4}s infinite alternate`
                      }}
                    >
                      🔥
                    </text>
                    {fire.intensity >= 3 && (
                      <text
                        x={fireX + TILE_SIZE_PX * 0.7}
                        y={fireY + TILE_SIZE_PX * 0.3}
                        fontSize={TILE_SIZE_PX * 0.6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        opacity={0.8}
                        className="select-none pointer-events-none"
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(255, 150, 0, 0.7))',
                          animation: `fireFlicker ${0.4 + Math.random() * 0.3}s infinite alternate-reverse`
                        }}
                      >
                        🔥
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            
            <g>
              {/* Docked Ship Icon */}
              {shipDockX !== null && shipDockY !== null && playerMode === 'onFoot' && (
                <g className="transition-opacity duration-300" opacity="0.85">
                  {currentVessel ? (
                    <VesselSymbol 
                      vessel={currentVessel} 
                      x={shipDockX * TILE_SIZE_PX + TILE_SIZE_PX / 2} 
                      y={shipDockY * TILE_SIZE_PX + TILE_SIZE_PX / 2} 
                      size={TILE_SIZE_PX * 1.1} 
                    />
                  ) : (
                    <ShipIcon
                      x={shipDockX * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                      y={shipDockY * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                      rotation={0}
                      velocity={{ x: 0, y: 0 }}
                    />
                  )}
                </g>
              )}
              
              {/* Controlled Player/Ship Icon with glow effect */}
              {displayPixelIconX !== null && displayPixelIconY !== null && (
                <g>
                  {/* Simple player indicator ring - removed animations and blur for performance */}
                  {playerMode === 'onFoot' && playerCharacter && (
                    <circle
                      cx={displayPixelIconX}
                      cy={displayPixelIconY}
                      r={TILE_SIZE_PX * 0.7}
                      fill="none"
                      stroke="rgba(255, 223, 150, 0.4)"
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  )}
                  
                  <g>
                    {playerMode === 'ship' ? (
                      currentVessel ? (
                        <g 
                          onClick={(e) => {
                            console.log('[MapDisplay] Ship icon clicked');
                            const rect = (e.currentTarget.parentNode as SVGSVGElement).getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            setShipTooltipPos({ x, y });
                            setShowShipTooltip(true);
                          }}
                          style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        >
                          <VesselSymbol 
                            vessel={currentVessel} 
                            x={displayPixelIconX} 
                            y={displayPixelIconY} 
                            size={TILE_SIZE_PX * 1.1} 
                          />
                        </g>
                      ) : (
                        <g
                          onClick={(e) => {
                            console.log('[MapDisplay] Ship icon clicked');
                            const rect = (e.currentTarget.parentNode as SVGSVGElement).getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            setShipTooltipPos({ x, y });
                            setShowShipTooltip(true);
                          }}
                          style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        >
                          {/* Shadow halo under basic ship */}
                          <ellipse
                            cx={displayPixelIconX}
                            cy={displayPixelIconY + TILE_SIZE_PX * 0.35}
                            rx={TILE_SIZE_PX * 0.5}
                            ry={TILE_SIZE_PX * 0.18}
                            fill="rgba(0, 0, 0, 0.3)"
                            opacity="0.6"
                          />
                          <ShipIcon
                            x={displayPixelIconX}
                            y={displayPixelIconY}
                            rotation={iconRotation}
                            velocity={velocity}
                          />
                        </g>
                      )
                    ) : playerCharacter && (
                      <g
                        onClick={(e) => {
                          console.log('[MapDisplay] Player icon clicked, showing tooltip');
                          const rect = (e.currentTarget.parentNode as SVGSVGElement).getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          setPlayerTooltipPos({ x, y });
                          setShowPlayerTooltip(true);
                        }}
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                      >
                        {/* Shadow halo under player */}
                        <ellipse
                          cx={displayPixelIconX}
                          cy={displayPixelIconY + TILE_SIZE_PX * 0.35}
                          rx={TILE_SIZE_PX * 0.35}
                          ry={TILE_SIZE_PX * 0.12}
                          fill="rgba(0, 0, 0, 0.25)"
                          opacity="0.8"
                        />
                        <PlayerIcon
                          x={displayPixelIconX}
                          y={displayPixelIconY}
                          character={playerCharacter}
                        />
                      </g>
                    )}
                  </g>
                </g>
              )}
            </g>
            
            {/* Simple NPC Boat - just one, properly sized */}
            {simpleBoatService.hasBoat() && (() => {
              const position = simpleBoatService.getBoatPosition();
              if (!position) return null;
              return (
                <SimpleBoatSymbol
                  key={`boat-${boatTick}`}
                  x={position.x * TILE_SIZE_PX + TILE_SIZE_PX / 2} // Center on tile
                  y={position.y * TILE_SIZE_PX + TILE_SIZE_PX / 2} // Center on tile
                  rotation={position.rotation}
                />
              );
            })()}

            {/* Desert dust particles - atmospheric effect (reduced to 1/5th) */}
            {/* Disable on Safari for performance */}
            {shouldRenderDetailedSymbols && !isSafari && (
              <g>
                {shouldRenderParticles && desertParticleTiles.map(tile => (
                    <MemoizedDustEffect
                      key={`dust-${tile.x}-${tile.y}`}
                      x={tile.x * TILE_SIZE_PX}
                      y={tile.y * TILE_SIZE_PX}
                      size={TILE_SIZE_PX}
                      seed={mapData.seed + tile.x * 31 + tile.y * 37}
                    />
                  ))}
              </g>
            )}

            {/* Special Map Lighting Effects - Glow around light sources */}
            {isSpecialMap && mapData && (mapData as any)?.specialArchetype !== 'ESTATES' && (() => {
              // Skip lighting effects for ESTATES to prevent NaN coordinate bugs
              // Using memoized lightSourceTiles instead of filtering every render

              // Light sources found for glow effects

              return (
                <g className="lighting-effects">
                  <defs>
                    {/* Light source glow gradients */}
                    <radialGradient id="warm-light-glow" cx="50%" cy="50%" r="100%">
                      <stop offset="0%" stopColor="#ffb347" stopOpacity="0.15" />
                      <stop offset="30%" stopColor="#ff8c00" stopOpacity="0.08" />
                      <stop offset="60%" stopColor="#ff6b35" stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#d2691e" stopOpacity="0" />
                    </radialGradient>
                    
                    <radialGradient id="cool-light-glow" cx="50%" cy="50%" r="100%">
                      <stop offset="0%" stopColor="#87ceeb" stopOpacity="0.3" />
                      <stop offset="30%" stopColor="#4682b4" stopOpacity="0.18" />
                      <stop offset="60%" stopColor="#2f4f4f" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#000080" stopOpacity="0" />
                    </radialGradient>
                    
                    <filter id="light-blur" x="-100%" y="-100%" width="300%" height="300%">
                      {!isSafari ? (
                        <feGaussianBlur in="SourceGraphic" stdDeviation="8"/>
                      ) : (
                        // Simple opacity effect for Safari
                        <feComponentTransfer>
                          <feFuncA type="discrete" tableValues="0.8 0.6 0.4 0.2"/>
                        </feComponentTransfer>
                      )}
                    </filter>
                  </defs>
                  
                  {lightSourceTiles.map(tile => {
                    const lightType = tile.biome === BiomeType.LANTERN || 
                                    (tile.overlayObject?.type === 'LANTERN') ? 'cool' : 'warm';
                    const radius = tile.biome === BiomeType.CHANDELIER ? TILE_SIZE_PX * 2.5 :
                                  tile.biome === BiomeType.HEARTH || tile.biome === BiomeType.FIRE_PIT ? TILE_SIZE_PX * 2 :
                                  TILE_SIZE_PX * 1.5;
                    
                    return (
                      <g key={`light-${tile.x}-${tile.y}`}>
                        {/* Large soft glow */}
                        <circle
                          cx={tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                          cy={tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                          r={radius}
                          fill={`url(#${lightType}-light-glow)`}
                          filter="url(#light-blur)"
                          opacity={0.2}
                        />
                        
                        {/* Smaller bright core */}
                        <circle
                          cx={tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                          cy={tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                          r={radius * 0.3}
                          fill={lightType === 'cool' ? '#add8e6' : '#ffd700'}
                          opacity={0.1}
                          filter="url(#light-blur)"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {/* Guard Alert Indicators - Render inside SVG */}
            {guardAlerts && npcs && (
              <g id="guard-alerts">
                {npcs.filter(npc => {
                  // Only show alerts for NPCs within 10 tiles of player
                  if (logicalControlledIconX === null || logicalControlledIconY === null) return false;
                  const dx = npc.x - logicalControlledIconX;
                  const dy = npc.y - logicalControlledIconY;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const hasAlert = guardAlerts.has(npc.id);
                  if (hasAlert) {
                    console.log(`[MapDisplay] Rendering alert for ${npc.name} at distance ${distance}`);
                  }
                  return distance <= 10 && hasAlert;
                }).map(npc => {
                  const alertLevel = guardAlerts.get(npc.id);
                  if (!alertLevel) return null;

                  // Calculate screen position from tile coordinates
                  const screenX = svgWidth / 2 + (npc.x - (logicalControlledIconX || 0)) * TILE_SIZE_PX;
                  const screenY = svgHeight / 2 + (npc.y - (logicalControlledIconY || 0)) * TILE_SIZE_PX;

                  return (
                    <NpcAlertIndicator
                      key={`alert-${npc.id}`}
                      npc={npc}
                      alertLevel={alertLevel}
                      x={screenX}
                      y={screenY}
                      tileSize={TILE_SIZE_PX}
                    />
                  );
                })}
              </g>
            )}
          </g>
        </svg>
      </div>
      
      {/* Quest Markers */}
      {playerCharacter && (
        <QuestMarkers
          playerX={playerCharacter.x}
          playerY={playerCharacter.y}
          tileSize={TILE_SIZE_PX}
          viewportOffsetX={svgWidth / 2}
          viewportOffsetY={svgHeight / 2}
        />
      )}

      {/* Enhanced vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'normal' }}>
        {isSpecialMap ? (
          // Special interior vignette for immersive indoor atmosphere
          <>
            {/* Subtle interior vignette - darkens edges to simulate walls */}
            <div className="absolute inset-0 opacity-35" 
                 style={{
                   background: 'radial-gradient(ellipse 75% 65% at center, transparent 45%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.4) 100%)'
                 }}
            />
            
            {/* Very subtle ambient lighting based on archetype */}
            <div className="absolute inset-0 transition-all duration-1000 opacity-20"
                 style={{
                   background: (mapData as any)?.specialArchetype === 'SACRED_COMPLEX' ? 
                     'linear-gradient(to bottom, rgba(255,215,0,0.02), transparent, rgba(139,69,19,0.03))' :
                   (mapData as any)?.specialArchetype === 'ESTATES' || (mapData as any)?.specialArchetype === 'PALACE_COMPLEX' ?
                     'linear-gradient(to bottom, rgba(255,215,0,0.025), transparent, rgba(139,69,19,0.03))' :
                   (mapData as any)?.specialArchetype === 'MARKET_BAZAAR' || (mapData as any)?.specialArchetype === 'MARKET_EXHIBITION' ?
                     'linear-gradient(to bottom, rgba(255,140,0,0.02), transparent, rgba(160,82,45,0.025))' :
                   (mapData as any)?.specialArchetype === 'UNIVERSITY' || (mapData as any)?.specialArchetype === 'UNIVERSITY_MONASTERY' ?
                     'linear-gradient(to bottom, rgba(70,130,180,0.02), transparent, rgba(25,25,112,0.025))' :
                   'linear-gradient(to bottom, rgba(128,128,128,0.015), transparent, rgba(64,64,64,0.02))'
                 }}
            />
            
            {/* Very subtle ceiling shadow */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), transparent 25%)' }}
            />
            
            {/* Very subtle floor shadow */}
            <div className="absolute inset-0 opacity-15" 
                 style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent 25%)' }}
            />
          </>
        ) : (
          // Standard outdoor vignette - using inline styles since CSS class might not exist
          <>
            <div className="absolute inset-0 opacity-80" 
                 style={{
                   background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
                 }}
            />
            
            <div className={`absolute inset-0 transition-all duration-1000 ${
              season === 'winter' ? 'opacity-30 mix-blend-overlay' : 
              season === 'fall' ? 'opacity-25 mix-blend-overlay' : 
              season === 'spring' ? 'opacity-20 mix-blend-hard-light' : 
              'opacity-0'
            }`} 
                 style={{
                   background: season === 'winter' ? 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)' :
                              season === 'fall' ? 'linear-gradient(to bottom, rgba(253,186,116,0.2), transparent)' :
                              season === 'spring' ? 'linear-gradient(to bottom, rgba(187,247,208,0.15), transparent)' :
                              'transparent'
                 }}
            />
            <div className="absolute inset-0 opacity-60" 
                 style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)' }}
            />
          </>
        )}
      </div>
      
      {/* POI Hover Tooltip - only show if no NPC/Animal is hovered */}
      {hoveredPOI && hoveredPOICoords && !hoveredNPC && !hoveredAnimal && (
        <POIHoverTooltip
          structure={hoveredPOI}
          x={hoveredPOICoords.x}
          y={hoveredPOICoords.y}
          npcs={npcs}
          culturalZone={mapData.culturalZone || 'EUROPEAN'}
          era={parseDateString(mapData.timeSlice || '1650').era}
          visible={true}
        />
      )}

      {/* Tile Hover Tooltip (for farms and urban areas) - only show if no NPC/Animal is hovered */}
      {hoveredTile && hoveredTileCoords && !hoveredNPC && !hoveredAnimal && (
        <TileHoverTooltip
          tile={hoveredTile}
          x={hoveredTileCoords.x}
          y={hoveredTileCoords.y}
          npcs={npcs}
          culturalZone={mapData.culturalZone || 'EUROPEAN'}
          era={parseDateString(mapData.timeSlice || '1650').era}
          visible={true}
        />
      )}
      
      {/* NPC/Animal hover tooltip */}
      {(hoveredNPC || hoveredAnimal) && hoveredEntityCoords && (() => {
        // Don't render tooltips on mobile devices
        const isMobile = window.innerWidth < 640;
        if (isMobile) return null;

        // Get portal element
        const portalElement = document.getElementById('tooltip-portal');
        if (!portalElement) return null;

        // Calculate position similar to POI tooltip
        const tooltipWidth = 240;
        const tooltipHeight = 120;
        const offset = 20;

        let adjustedX = hoveredEntityCoords.x + offset;
        let adjustedY = hoveredEntityCoords.y - tooltipHeight - offset;

        // Bounds checking
        if (adjustedX + tooltipWidth > window.innerWidth - 10) {
          adjustedX = hoveredEntityCoords.x - tooltipWidth - offset;
        }
        if (adjustedX < 10) {
          adjustedX = 10;
        }
        if (adjustedY < 10) {
          adjustedY = hoveredEntityCoords.y + offset;
        }

        // Determine border color based on hostile/alert state
        const isHostile = (hoveredNPC && isNpcHostile(hoveredNPC)) || (hoveredAnimal && isAnimalHostile(hoveredAnimal));
        const isAlert = (hoveredNPC && isNpcAlert(hoveredNPC)) || (hoveredAnimal && isAnimalAlert(hoveredAnimal));

        let borderColor = 'border-blue-500/50'; // Default blue
        let titleColor = 'text-blue-400';
        let warningIcon = '';

        if (isHostile) {
          borderColor = 'border-red-500/60';
          titleColor = 'text-red-400';
          warningIcon = '⚔️ ';
        } else if (isAlert) {
          borderColor = 'border-yellow-500/50';
          titleColor = 'text-yellow-400';
          warningIcon = '⚠️ ';
        }

        const tooltipContent = (
          <div
            className="fixed pointer-events-none"
            style={{
              left: `${adjustedX}px`,
              top: `${adjustedY}px`,
              opacity: 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            <div className={`bg-slate-900/95 backdrop-blur-sm border ${borderColor} rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px] ${isHostile ? 'animate-pulse' : ''}`}>
          {hoveredNPC && (
            <>
              <div className={`font-bold text-sm mb-1.5 ${titleColor}`}>{warningIcon}{hoveredNPC.name}</div>
              <div className="text-xs space-y-1 text-slate-700 dark:text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Age:</span>
                  <span>{hoveredNPC.age} years old</span>
                </div>
                {logicalControlledIconX !== null && logicalControlledIconY !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Distance:</span>
                    <span className="text-slate-300">
                      {Math.round(Math.sqrt(
                        Math.pow(hoveredNPC.x - logicalControlledIconX, 2) +
                        Math.pow(hoveredNPC.y - logicalControlledIconY, 2)
                      ))} tiles
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Gender:</span>
                  <span>{hoveredNPC.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Profession:</span>
                  <span className="text-blue-300">{hoveredNPC.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Class:</span>
                  <span className="text-purple-300">{hoveredNPC.class}</span>
                </div>
                {hoveredNPC.aiState && hoveredNPC.aiState !== 'idle' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className={`${isNpcHostile(hoveredNPC) ? 'text-red-400' : isNpcAlert(hoveredNPC) ? 'text-yellow-400' : 'text-green-400'} text-xs uppercase`}>
                      {hoveredNPC.aiState.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {hoveredNPC.stats && (
                  <>
                    <div className="border-t border-slate-700 mt-1 pt-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400">Health:</span>
                        <span>{hoveredNPC.currentHealth || hoveredNPC.maxHealth || 100}/{hoveredNPC.maxHealth || 100}</span>
                      </div>
                      {/* Health bar */}
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            ((hoveredNPC.currentHealth || hoveredNPC.maxHealth || 100) / (hoveredNPC.maxHealth || 100)) > 0.5 ? 'bg-green-500' :
                            ((hoveredNPC.currentHealth || hoveredNPC.maxHealth || 100) / (hoveredNPC.maxHealth || 100)) > 0.25 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${((hoveredNPC.currentHealth || hoveredNPC.maxHealth || 100) / (hoveredNPC.maxHealth || 100)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">TEST/CON:</span>
                        <span>{hoveredNPC.stats.strength}/{hoveredNPC.stats.constitution}</span>
                      </div>
                    </div>
                  </>
                )}
                {/* Disease display temporarily disabled - health system structure changed */}
              </div>
            </>
          )}
          {hoveredAnimal && (
            <>
              <div className={`font-bold text-sm mb-1.5 ${titleColor}`}>{warningIcon}{hoveredAnimal.speciesName || hoveredAnimal.type}</div>
              <div className="text-xs space-y-1 text-slate-700 dark:text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Type:</span>
                  <span>{hoveredAnimal.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Age:</span>
                  <span>{hoveredAnimal.age} years</span>
                </div>
                {logicalControlledIconX !== null && logicalControlledIconY !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Distance:</span>
                    <span className="text-slate-300">
                      {Math.round(Math.sqrt(
                        Math.pow(hoveredAnimal.x - logicalControlledIconX, 2) +
                        Math.pow(hoveredAnimal.y - logicalControlledIconY, 2)
                      ))} tiles
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Temperament:</span>
                  <span className="text-yellow-300">{hoveredAnimal.temperament || 'Unknown'}</span>
                </div>
                {hoveredAnimal.aiState && hoveredAnimal.aiState !== 'idle' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className={`${isAnimalHostile(hoveredAnimal) ? 'text-red-400' : isAnimalAlert(hoveredAnimal) ? 'text-yellow-400' : 'text-green-400'} text-xs uppercase`}>
                      {hoveredAnimal.aiState}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Health:</span>
                  <span>{hoveredAnimal.currentHealth || hoveredAnimal.maxHealth || 16}/{hoveredAnimal.maxHealth || 16}</span>
                </div>
                {/* Health bar */}
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ((hoveredAnimal.currentHealth || hoveredAnimal.maxHealth || 16) / (hoveredAnimal.maxHealth || 16)) > 0.5 ? 'bg-green-500' :
                      ((hoveredAnimal.currentHealth || hoveredAnimal.maxHealth || 16) / (hoveredAnimal.maxHealth || 16)) > 0.25 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${((hoveredAnimal.currentHealth || hoveredAnimal.maxHealth || 16) / (hoveredAnimal.maxHealth || 16)) * 100}%` }}
                  />
                </div>
                {hoveredAnimal.stats && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Attack/Defense:</span>
                    <span>{hoveredAnimal.stats.attack}/{hoveredAnimal.stats.defense}</span>
                  </div>
                )}
                {hoveredAnimal.diseaseHealth && hoveredAnimal.diseaseHealth.currentDiseases && hoveredAnimal.diseaseHealth.currentDiseases.length > 0 && (
                  <div className="border-t border-slate-700 mt-1 pt-1">
                    <div className="text-green-400 font-semibold">
                      ⚠️ Disease: {hoveredAnimal.diseaseHealth.currentDiseases[0].disease.name}
                    </div>
                    <div className="text-xs text-green-300 mt-0.5">
                      This animal appears sick - avoid contact!
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
            </div>
          </div>
        );

        return ReactDOM.createPortal(tooltipContent, portalElement);
      })()}

      {/* Ship Tooltip */}
      {showShipTooltip && (
        <ShipTooltip
          x={shipTooltipPos.x}
          y={shipTooltipPos.y}
          onGoBelow={() => {
            console.log('[MapDisplay] Going belowdecks');
            setShowShipTooltip(false);
            onShipClick?.();
          }}
          onClose={() => setShowShipTooltip(false)}
        />
      )}

      {/* Player Tooltip */}
      {showPlayerTooltip && (
        <PlayerTooltip
          x={playerTooltipPos.x}
          y={playerTooltipPos.y}
          onRest={() => {
            console.log('[MapDisplay] Player tooltip Rest clicked');
            setShowPlayerTooltip(false);
            // Trigger camp modal through the parent component
            if (onPlayerIconClick) {
              onPlayerIconClick();
            }
          }}
          onStatus={() => {
            console.log('[MapDisplay] Player tooltip Status clicked');
            setShowPlayerTooltip(false);
            // For now, just close the tooltip
            // Could add status narration here later
          }}
          onClose={() => setShowPlayerTooltip(false)}
        />
      )}
    </div>
  );
};

// Custom comparison function for memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: MapDisplayOptimizedProps, nextProps: MapDisplayOptimizedProps) => {
  // Calculate viewport boundaries to avoid re-rendering on every pixel movement
  const getViewportKey = (props: MapDisplayOptimizedProps) => {
    // Use logical icon positions which are the actual props passed in
    const playerGridX = Math.floor((props.logicalControlledIconX || 0) / 4); // Group by 4-tile chunks
    const playerGridY = Math.floor((props.logicalControlledIconY || 0) / 4);
    return `${playerGridX}-${playerGridY}`;
  };

  // Only re-render if these essential props changed
  return (
    // Map data comparison
    prevProps.mapData?.seed === nextProps.mapData?.seed &&

    // View and position changes (chunked to reduce sensitivity)
    getViewportKey(prevProps) === getViewportKey(nextProps) &&
    prevProps.playerMode === nextProps.playerMode &&
    prevProps.activeLens === nextProps.activeLens &&

    // Game time that affects rendering
    Math.floor(prevProps.gameTimeHours / 4) === Math.floor(nextProps.gameTimeHours / 4) && // Only update every 4 hours

    // Array length comparisons for performance (deep comparison is expensive)
    prevProps.animals?.length === nextProps.animals?.length &&
    prevProps.npcs?.length === nextProps.npcs?.length &&
    prevProps.deployedVessels?.length === nextProps.deployedVessels?.length &&

    // Selection states
    prevProps.selectedAnimalId === nextProps.selectedAnimalId &&
    prevProps.selectedNpcId === nextProps.selectedNpcId &&

    // Ship/vessel state
    prevProps.shipDockX === nextProps.shipDockX &&
    prevProps.shipDockY === nextProps.shipDockY &&
    prevProps.currentVessel === nextProps.currentVessel
  );
};

// Export memoized version with custom comparison for maximum performance
export default memo(MapDisplayOptimized, arePropsEqual);