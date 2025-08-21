/**
 * MapDisplayOptimized - Performance-optimized version of MapDisplay
 * This addresses the critical performance issues by replacing the expensive canvas rendering
 * with the MapCanvasPerformance component and optimized dependency management
 */

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { MapData, Tile, BiomeType, ClimateType, DevTooltipDisplayData, AnimalEntity, NpcEntity, VegetationEntity, LensMode, TerrainStructure, Season, PlayerCharacter, HistoricalEra, DeployedVessel } from '../types/index';
import { loadTamedAnimals, TamedAnimal } from '../services/animalTamingService';
import { 
    TILE_SIZE_PX as TILE_SIZE_PX_CONST,
    MAP_WIDTH_TILES, 
    MAP_HEIGHT_TILES,
    STRUCTURE_BLUEPRINTS,
    METALS
} from '../constants/index';
import { ValueNoise } from '../utils/noise'; 
import { interpolateColor, getLensColor, getMineralColor } from '../utils/colorUtils';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { selectBuilding } from '../utils/buildingSelectionSystem';
import { getLocationCulturalStyle } from '../utils/culturalMappingUtils';
import { RuinsSymbol, CliffSymbol, PineTreeSymbol, PalmTreeSymbol, DeciduousTreeSymbol, CactusSymbol, BushSymbol, PlayerIcon, ShipIcon, FarmSymbol, NpcIcon, EstuarySymbol, HillSymbol, MarketplaceSymbol, MangroveSymbol, SaltFlatsSymbol, CoralReefSymbol, FishingHutSymbol, SteamSymbol, GovernmentDistrictSymbol, FireflySymbol, MineralGlintSymbol, OasisSymbol } from './symbols';
import VesselSymbol from './symbols/VesselSymbol';
import LumberCampSymbol from './symbols/structures/LumberCampSymbol';
import UrbanSymbol from './symbols/UrbanSymbolSimplified';
import { getPalaceSymbol } from './symbols/poi/PalaceSymbolsImproved';
import { getHolySiteSymbol } from './symbols/poi/getHolySiteSymbol';
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
import { 
  CityHallSymbol,
  TribalCouncilSymbol,
  MandateHallSymbol,
  CaliphCourtSymbol,
  ColonialOfficeSymbol,
  RomanForumSymbol
} from './symbols/government/GovernmentSymbolsImproved';
import CoastlineOverlay from './CoastlineOverlay';
import Minimap from './Minimap';
import MapCanvasPerformance from './MapCanvasPerformance';
import POIHoverTooltip from './POIHoverTooltip';
import TileHoverTooltip from './TileHoverTooltip';
import { getSafariOptimizedClassName, getSafariOptimizedStyle } from '../utils/safariUtils';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;
const ICON_ANIMATION_DURATION = 200;
const INITIAL_ZOOM_LEVEL = 2;

type PlayerMode = 'ship' | 'onFoot';

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
                        ...getSafariOptimizedStyle({ filter: 'blur(0.5px)' }),
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
                        ...getSafariOptimizedStyle({ filter: 'blur(0.5px) drop-shadow(0 0 1px rgba(255,255,255,0.8))' }),
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

// Optimized easing functions
const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface MapDisplayOptimizedProps {
  mapData: MapData | null;
  animals: AnimalEntity[];
  npcs: NpcEntity[];
  deployedVessels: DeployedVessel[];
  onDevHover: (data: DevTooltipDisplayData | null) => void;
  onDevCommandClick: (data: DevTooltipDisplayData) => void;
  onStructureClick: (structure: TerrainStructure) => void;
  onPoiClick: (poi: TerrainStructure) => void;
  onSettlementClick: (tile: Tile) => void;
  onVesselClick?: (vessel: DeployedVessel) => void;
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
  onCompanionClick?: (animal: TamedAnimal) => void;
  onMapEdgeCrossing?: (direction: 'north' | 'south' | 'east' | 'west') => void;
}

export const MapDisplayOptimized: React.FC<MapDisplayOptimizedProps> = ({ 
  mapData, 
  animals,
  npcs,
  deployedVessels,
  onDevHover,
  onDevCommandClick, 
  onStructureClick,
  onPoiClick,
  onSettlementClick,
  onVesselClick,
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
  onCompanionClick,
  onMapEdgeCrossing
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
  
  // NPC/Animal hover state
  const [hoveredNPC, setHoveredNPC] = useState<NpcEntity | null>(null);
  const [hoveredAnimal, setHoveredAnimal] = useState<AnimalEntity | null>(null);
  const [hoveredEntityCoords, setHoveredEntityCoords] = useState<{x: number, y: number} | null>(null);
  
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

  // Display state
  const [displayPixelIconX, setDisplayPixelIconX] = useState<number | null>(null);
  const [displayPixelIconY, setDisplayPixelIconY] = useState<number | null>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavSpeed, setMobileNavSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mobileControlMode, setMobileControlMode] = useState<'camera' | 'player'>('player');
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [lastMoveDirection, setLastMoveDirection] = useState<{x: number, y: number}>({ x: 0, y: -1 });
  
  // Load tamed animals on mount and when player position changes
  useEffect(() => {
    const animals = loadTamedAnimals();
    setTamedAnimals(animals);
  }, [logicalControlledIconX, logicalControlledIconY]);
  
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
    if (!mapData) return null;
    return {
      shoreline: new ValueNoise(mapData.seed + 300),
      cactusPlacement: new ValueNoise(mapData.seed + 200),
      ambientDetail: new ValueNoise(mapData.seed + 150),
      shoalBlend: new ValueNoise(mapData.seed + 400)
    };
  }, [mapData?.seed]);

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

        if (!isDragging && !isFreePanMode && (Math.abs(deltaX) > CAMERA_SNAP_THRESHOLD || Math.abs(deltaY) > CAMERA_SNAP_THRESHOLD)) {
            currentPanX.current += deltaX * CAMERA_SMOOTH_FACTOR;
            currentPanY.current += deltaY * CAMERA_SMOOTH_FACTOR;

            const newTransform = `translate(${currentPanX.current}px, ${currentPanY.current}px) scale(${zoomLevel})`;
            if (svgRef.current) svgRef.current.style.transform = newTransform;
            if (canvasRef.current) canvasRef.current.style.transform = newTransform;
        } else if (!isDragging && !isFreePanMode) {
            currentPanX.current = targetPanX.current;
            currentPanY.current = targetPanY.current;

            if (panX !== targetPanX.current || panY !== targetPanY.current) {
                setPanX(targetPanX.current);
                setPanY(targetPanY.current);
            }
        }

        cameraAnimationFrame.current = requestAnimationFrame(smoothCameraLoop);
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
      const targetPixelX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const targetPixelY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;

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
          const progress = Math.min(elapsedTime / ICON_ANIMATION_DURATION, 1);
          const easedProgress = easeInOutCubic(progress);

          const newX = animationStartX.current + (targetPixelX - animationStartX.current) * easedProgress;
          const newY = animationStartY.current + (targetPixelY - animationStartY.current) * easedProgress;
          
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
  }, [logicalControlledIconX, logicalControlledIconY, onIconAnimationComplete]);

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
  }, [mapData, logicalControlledIconX, logicalControlledIconY]);

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

  const minZoom = 0.4;
  const maxZoom = 12;

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

  // Helper function to get component info for a tile
  const getComponentInfoForTile = (tile: Tile, structure?: TerrainStructure | null, npc?: NpcEntity | null, animal?: AnimalEntity | null) => {
    let componentInfo = null;
    
    // Check for NPCs
    if (npc) {
      if (npc.tamedAnimals && npc.tamedAnimals.length > 0) {
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
          componentInfo = { fileName: 'RuinsSymbol.tsx', symbolName: 'RuinsSymbol' };
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
    
    const rect = e.currentTarget.getBoundingClientRect();
    const coords = { x: rect.left + rect.width / 2, y: rect.top };
    
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

      const newTransform = `translate(${currentPanX.current}px, ${currentPanY.current}px) scale(${zoomLevel})`;

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

      const newTransform = `translate(${currentPanX.current}px, ${currentPanY.current}px) scale(${zoomLevel})`;
      if (svgRef.current) svgRef.current.style.transform = newTransform;
      if (canvasRef.current) canvasRef.current.style.transform = newTransform;
      
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

  // Detect Safari for performance optimizations
  const isSafari = useMemo(() => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }, []);

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
  const shouldRenderDetailedSymbols = debugSettings?.reduceSVGComplexity ? false : zoomLevel > 0.8;
  const shouldRenderVegetation = zoomLevel > 0.5;
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

    return { isNight, isDawn, isDusk, isDay };
  }, [gameTimeHours, gameTimeMinutes]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Enhanced zoom controls */}
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

      {/* Mobile Direction Controls */}
      {isMobile && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-1">
          {/* Control mode toggle */}
          <div className="flex items-center space-x-1 mb-2 bg-gray-900/90 rounded-lg p-1">
            <button
              onClick={() => setMobileControlMode('player')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                mobileControlMode === 'player' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700/80 text-gray-300'
              }`}
            >
              👤 Move
            </button>
            <button
              onClick={() => setMobileControlMode('camera')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                mobileControlMode === 'camera' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700/80 text-gray-300'
              }`}
            >
              📷 View
            </button>
          </div>
          {/* Up button */}
          <button
            onClick={() => {
              if (mobileControlMode === 'camera') {
                panMap('up');
              } else {
                // Simulate ArrowUp key press for player movement
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
                setTimeout(() => {
                  const upEvent = new KeyboardEvent('keyup', { key: 'ArrowUp' });
                  window.dispatchEvent(upEvent);
                }, 100);
              }
            }}
            onTouchStart={(e) => { 
              e.preventDefault(); 
              if (mobileControlMode === 'camera') {
                panMap('up');
              } else {
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                window.dispatchEvent(event);
              }
            }}
            onTouchEnd={(e) => {
              if (mobileControlMode === 'player') {
                const event = new KeyboardEvent('keyup', { key: 'ArrowUp' });
                window.dispatchEvent(event);
              }
            }}
            className={getSafariOptimizedClassName(`group w-14 h-14 flex items-center justify-center rounded-full border-2 ${
              mobileControlMode === 'player' 
                ? 'border-green-400/50 bg-green-900/80 active:bg-green-600/80' 
                : 'border-blue-400/50 bg-blue-900/80 active:bg-blue-600/80'
            } text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:scale-95`)}
            aria-label={mobileControlMode === 'player' ? "Move Up" : "Pan Up"}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          {/* Middle row with left, center, right */}
          <div className="flex items-center space-x-1">
            {/* Left button */}
            <button
              onClick={() => {
                if (mobileControlMode === 'camera') {
                  panMap('left');
                } else {
                  const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                  window.dispatchEvent(event);
                  setTimeout(() => {
                    const upEvent = new KeyboardEvent('keyup', { key: 'ArrowLeft' });
                    window.dispatchEvent(upEvent);
                  }, 100);
                }
              }}
              onTouchStart={(e) => { 
                e.preventDefault(); 
                if (mobileControlMode === 'camera') {
                  panMap('left');
                } else {
                  const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                  window.dispatchEvent(event);
                }
              }}
              onTouchEnd={(e) => {
                if (mobileControlMode === 'player') {
                  const event = new KeyboardEvent('keyup', { key: 'ArrowLeft' });
                  window.dispatchEvent(event);
                }
              }}
              className={getSafariOptimizedClassName(`group w-14 h-14 flex items-center justify-center rounded-full border-2 ${
                mobileControlMode === 'player' 
                  ? 'border-green-400/50 bg-green-900/80 active:bg-green-600/80' 
                  : 'border-blue-400/50 bg-blue-900/80 active:bg-blue-600/80'
              } text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:scale-95`)}
              aria-label={mobileControlMode === 'player' ? "Move Left" : "Pan Left"}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Center/Reset button */}
            <button
              onClick={resetZoomAndCenter}
              onTouchStart={(e) => { e.preventDefault(); resetZoomAndCenter(); }}
              className={getSafariOptimizedClassName("group w-14 h-14 flex items-center justify-center rounded-full border-2 border-amber-400/50 bg-amber-900/80 text-amber-200 shadow-xl transition-all duration-150 backdrop-blur-sm active:bg-amber-600/80 active:scale-95")}
              aria-label="Center on Player"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            </button>
            
            {/* Right button */}
            <button
              onClick={() => {
                if (mobileControlMode === 'camera') {
                  panMap('right');
                } else {
                  const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                  window.dispatchEvent(event);
                  setTimeout(() => {
                    const upEvent = new KeyboardEvent('keyup', { key: 'ArrowRight' });
                    window.dispatchEvent(upEvent);
                  }, 100);
                }
              }}
              onTouchStart={(e) => { 
                e.preventDefault(); 
                if (mobileControlMode === 'camera') {
                  panMap('right');
                } else {
                  const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                  window.dispatchEvent(event);
                }
              }}
              onTouchEnd={(e) => {
                if (mobileControlMode === 'player') {
                  const event = new KeyboardEvent('keyup', { key: 'ArrowRight' });
                  window.dispatchEvent(event);
                }
              }}
              className={getSafariOptimizedClassName(`group w-14 h-14 flex items-center justify-center rounded-full border-2 ${
                mobileControlMode === 'player' 
                  ? 'border-green-400/50 bg-green-900/80 active:bg-green-600/80' 
                  : 'border-blue-400/50 bg-blue-900/80 active:bg-blue-600/80'
              } text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:scale-95`)}
              aria-label={mobileControlMode === 'player' ? "Move Right" : "Pan Right"}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Down button */}
          <button
            onClick={() => {
              if (mobileControlMode === 'camera') {
                panMap('down');
              } else {
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                window.dispatchEvent(event);
                setTimeout(() => {
                  const upEvent = new KeyboardEvent('keyup', { key: 'ArrowDown' });
                  window.dispatchEvent(upEvent);
                }, 100);
              }
            }}
            onTouchStart={(e) => { 
              e.preventDefault(); 
              if (mobileControlMode === 'camera') {
                panMap('down');
              } else {
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                window.dispatchEvent(event);
              }
            }}
            onTouchEnd={(e) => {
              if (mobileControlMode === 'player') {
                const event = new KeyboardEvent('keyup', { key: 'ArrowDown' });
                window.dispatchEvent(event);
              }
            }}
            className={getSafariOptimizedClassName(`group w-14 h-14 flex items-center justify-center rounded-full border-2 ${
              mobileControlMode === 'player' 
                ? 'border-green-400/50 bg-green-900/80 active:bg-green-600/80' 
                : 'border-blue-400/50 bg-blue-900/80 active:bg-blue-600/80'
            } text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:scale-95`)}
            aria-label={mobileControlMode === 'player' ? "Move Down" : "Pan Down"}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile Zoom Controls - positioned differently on mobile */}
      {isMobile && (
        <div className="absolute bottom-16 right-2 z-30 flex flex-col space-y-1">
          <button 
            onClick={zoomIn}
            onTouchStart={(e) => { e.preventDefault(); zoomIn(); }}
            className={getSafariOptimizedClassName("group w-16 h-16 flex items-center justify-center rounded-full border-2 border-green-400/50 bg-green-900/80 text-3xl font-bold text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:bg-green-600/80 active:scale-95")}
            aria-label="Zoom In"
          >
            <span className="text-4xl leading-none pb-1">+</span>
          </button>
          <button 
            onClick={zoomOut}
            onTouchStart={(e) => { e.preventDefault(); zoomOut(); }}
            className={getSafariOptimizedClassName("group w-16 h-16 flex items-center justify-center rounded-full border-2 border-red-400/50 bg-red-900/80 text-3xl font-bold text-white shadow-xl transition-all duration-150 backdrop-blur-sm active:bg-red-600/80 active:scale-95")}
            aria-label="Zoom Out"
          >
            <span className="text-4xl leading-none pb-1">−</span>
          </button>
        </div>
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
          touchAction: 'none' // Prevent default touch behaviors
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
            transformOrigin: '0 0',
            willChange: 'transform'
          }}
        >
          <defs>
            {/* Enhanced filters and gradients */}
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
            
            {/* Water mask for paths */}
            <mask id="waterMask">
              {tiles.flat().map((tile) => (
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
          </defs>

          {noiseGenerators && <CoastlineOverlay mapData={mapData} noise={noiseGenerators.shoreline} disableBlur={debugSettings?.disableBlurEffects} />}

          {/* Rendering layers */}
          <g>
            {/* Strategic Lens Overlay */}
            {activeLens !== 'none' && (
                <g key="strategic-lens">
                    {/* Lens visualization layer */}
                    {tiles.flat().map(tile => {
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
                        <div className="text-xs text-slate-400 mt-2">
                            Circle size = abundance
                        </div>
                    </div>
                </foreignObject>
            )}

            {/* Paths layer */}
            <g mask="url(#waterMask)">
              {pathObjects?.map((path) => (
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
                  className="transition-opacity duration-300"
                />
              ))}
            </g>

            {/* Vegetation layer */}
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
            
            {/* Terrain features layer (farms, cliffs, etc - rendered BELOW urban symbols) */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {tiles.flat().map((tile) => {
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  const elements = [];
                  
                  // Only render terrain features in this pass
                  if(tile.biome === BiomeType.CLIFF) {
                    elements.push(<CliffSymbol key={`cliff-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />);
                  } else if(tile.biome === BiomeType.MANGROVE) {
                    elements.push(<MangroveSymbol key={`mangrove-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.SALT_FLATS) {
                    elements.push(<SaltFlatsSymbol key={`saltflats-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.HILLS) {
                    elements.push(<HillSymbol key={`hill-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} season={season}/>);
                  } else if(tile.biome === BiomeType.OASIS) {
                    elements.push(<OasisSymbol key={`oasis-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.FARMLAND) {
                    elements.push(
                      <g
                        key={`farm-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredTile(tile);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTileCoords({ x: rect.left + rect.width / 2, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredTile(null);
                          setHoveredTileCoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <FarmSymbol tile={tile} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />
                      </g>
                    );
                  } else if(tile.biome === BiomeType.ESTUARY) {
                    elements.push(<EstuarySymbol key={`estuary-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.REEF) {
                    elements.push(<CoralReefSymbol key={`reef-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.HOT_SPRINGS) {
                    elements.push(<SteamSymbol key={`hotspring-steam-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} intensity="heavy" />);
                  } else if(tile.biome === BiomeType.VOLCANIC_ROCK) {
                    if ((tile.x + tile.y + Math.floor(seed/10)) % 8 === 0) {
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
            
            {/* Urban and structure symbols layer (rendered ABOVE terrain features) */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {tiles.flat().map((tile) => {
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  const elements = [];
                  
                  // Only render urban/structure symbols in this pass
                  if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER].includes(tile.biome)) {
                    elements.push(
                      <g
                        key={`urban-${tile.x}-${tile.y}`}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredTile(tile);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTileCoords({ x: rect.left + rect.width / 2, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredTile(null);
                          setHoveredTileCoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <UrbanSymbol x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} location={mapData.localArea || mapData.region || currentLocation} nightIntensity={timeOfDayData.isNight ? 0.6 : 0} />
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
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredPOI(null);
                          setHoveredPOICoords(null);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <RuinsSymbol x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />
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
                    
                    const HolySiteComponent = getHolySiteSymbol(religion, culturalZone);
                    
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
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                      <g key={structure.id} className="transition-transform duration-200">
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
                      <g key={structure.id} className="transition-transform duration-200">
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
                            nightIntensity={nightIntensity}
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
                      <g key={structure.id} className="transition-transform duration-200">
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
                      <g key={structure.id} className="transition-transform duration-200"
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                      <g key={structure.id} className="transition-transform duration-200"
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                      <g key={structure.id} className="transition-transform duration-200"
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                    
                    // Use era and cultural zone for proper fortress selection
                    const FortressComponent = getFortressSymbol('', era, culturalZone);
                    
                    return (
                      <g 
                        key={structure.id} 
                        className="transition-transform duration-200"
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                        className="transition-transform duration-200"
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            setHoveredPOI(structure);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPOICoords({ x: rect.left + rect.width / 2, y: rect.top });
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
                    <g key={structure.id} className="transition-transform duration-200">
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

            {/* Mineral deposits layer - subtle glints on the map */}
            {mapData && shouldRenderAnimations && mapData.tiles.flat().filter(tile => 
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
                    fontSize={TILE_SIZE_PX * 1.2}
                    className={selectedAnimalId === animal.id ? 'animate-ff6-idle-bob' : ''}
                    style={{
                      filter: shouldRenderShadows ? 'drop-shadow(2px 3px 4px rgba(0,0,0,0.8))' : 'none',
                      stroke: selectedAnimalId === animal.id ? 'yellow' : 'none',
                      strokeWidth: selectedAnimalId === animal.id ? 2 : 0
                    }}
                  >
                    {animal.emoji}
                  </text>
                </g>
              ))}
              
              {/* Tamed Animals Following Player - Only show when on foot and limit to one */}
              {playerMode === 'onFoot' && tamedAnimals.slice(0, 1).map((animal, index) => {
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
                      rx={TILE_SIZE_PX * 0.3}
                      ry={TILE_SIZE_PX * 0.1}
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
                      fontSize={TILE_SIZE_PX * 0.8}
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
                </g>
              ))}
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
                  {/* Enhanced glowing halo for player when on foot */}
                  {playerMode === 'onFoot' && playerCharacter && (
                    <>
                      {/* Outer glow ring */}
                      <circle
                        cx={displayPixelIconX}
                        cy={displayPixelIconY}
                        r={TILE_SIZE_PX * 0.8}
                        fill="none"
                        stroke="rgba(255, 215, 0, 0.3)"
                        strokeWidth="3"
                        opacity="0.8"
                        className="animate-pulse"
                      />
                      {/* Inner glow ring */}
                      <circle
                        cx={displayPixelIconX}
                        cy={displayPixelIconY}
                        r={TILE_SIZE_PX * 0.6}
                        fill="none"
                        stroke="rgba(255, 255, 100, 0.5)"
                        strokeWidth="2"
                        opacity="0.9"
                        className="animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      />
                      {/* Radial glow */}
                      <circle
                        cx={displayPixelIconX}
                        cy={displayPixelIconY}
                        r={TILE_SIZE_PX * 0.5}
                        fill="rgba(255, 255, 150, 0.15)"
                        filter={shouldUseBlurEffects ? "blur(8px)" : "none"}
                      />
                    </>
                  )}
                  
                  <g filter="url(#glow)">
                    {playerMode === 'ship' ? (
                      currentVessel ? (
                        <VesselSymbol 
                          vessel={currentVessel} 
                          x={displayPixelIconX} 
                          y={displayPixelIconY} 
                          size={TILE_SIZE_PX * 1.1} 
                        />
                      ) : (
                        <ShipIcon
                          x={displayPixelIconX}
                          y={displayPixelIconY}
                          rotation={iconRotation}
                          velocity={velocity}
                        />
                      )
                    ) : playerCharacter && (
                      <g 
                        onClick={() => {
                          console.log('[MapDisplay] Player icon clicked, calling onPlayerIconClick');
                          onPlayerIconClick?.();
                        }}
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                      >
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

            {/* Desert dust particles - atmospheric effect (reduced to 1/5th) */}
            {/* Disable on Safari for performance */}
            {shouldRenderDetailedSymbols && !isSafari && (
              <g>
                {shouldRenderParticles && tiles.flat()
                  .filter(tile => tile.biome === BiomeType.DESERT && tile.isLand)
                  .filter(tile => (tile.x + tile.y * 7 + mapData.seed) % 5 === 0) // Only 1 in 5 desert tiles get particles
                  .map(tile => (
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
          </g>
        </svg>
      </div>

      {/* Enhanced vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'normal' }}>
        <div className="absolute inset-0 bg-map-vignette-gradient opacity-80" />
        
        
        <div className={`absolute inset-0 transition-all duration-1000 ${
          season === 'winter' ? 'opacity-30 bg-gradient-to-b from-blue-200/25 to-transparent mix-blend-overlay' : 
          season === 'fall' ? 'opacity-25 bg-gradient-to-b from-orange-300/20 to-transparent mix-blend-overlay' : 
          season === 'spring' ? 'opacity-20 bg-gradient-to-b from-green-200/15 to-transparent mix-blend-hard-light' : 
          'opacity-0'
        }`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />
      </div>
      
      {/* POI Hover Tooltip */}
      {hoveredPOI && hoveredPOICoords && (
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
      
      {/* Tile Hover Tooltip (for farms and urban areas) */}
      {hoveredTile && hoveredTileCoords && (
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
      {(hoveredNPC || hoveredAnimal) && hoveredEntityCoords && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${hoveredEntityCoords.x}px`,
            top: `${hoveredEntityCoords.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/50 rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]">
          {hoveredNPC && (
            <>
              <div className="font-bold text-sm mb-1.5 text-amber-300">{hoveredNPC.name}</div>
              <div className="text-xs space-y-1 text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Age:</span>
                  <span>{hoveredNPC.age} years old</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gender:</span>
                  <span>{hoveredNPC.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profession:</span>
                  <span className="text-blue-300">{hoveredNPC.profession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Class:</span>
                  <span className="text-purple-300">{hoveredNPC.socialClass}</span>
                </div>
                {hoveredNPC.stats && (
                  <>
                    <div className="border-t border-slate-700 mt-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Health:</span>
                        <span>{hoveredNPC.health}/{hoveredNPC.maxHealth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">STR/CON:</span>
                        <span>{hoveredNPC.stats.strength}/{hoveredNPC.stats.constitution}</span>
                      </div>
                    </div>
                  </>
                )}
                {hoveredNPC.diseaseHealth && hoveredNPC.diseaseHealth.currentDiseases && hoveredNPC.diseaseHealth.currentDiseases.length > 0 && (
                  <div className="border-t border-slate-700 mt-1 pt-1">
                    <div className="text-green-400 font-semibold">
                      ⚠️ Disease: {hoveredNPC.diseaseHealth.currentDiseases[0].disease.name}
                    </div>
                    {hoveredNPC.diseaseHealth.currentDiseases[0].disease.symptoms && (
                      <div className="text-xs text-green-300 mt-0.5">
                        Symptoms: {hoveredNPC.diseaseHealth.currentDiseases[0].disease.symptoms.slice(0, 2).map(s => s.name).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          {hoveredAnimal && (
            <>
              <div className="font-bold text-sm mb-1.5 text-amber-300">{hoveredAnimal.speciesName || hoveredAnimal.type}</div>
              <div className="text-xs space-y-1 text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span>{hoveredAnimal.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age:</span>
                  <span>{hoveredAnimal.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temperament:</span>
                  <span className="text-yellow-300">{hoveredAnimal.temperament || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Health:</span>
                  <span>{hoveredAnimal.health}/{hoveredAnimal.maxHealth}</span>
                </div>
                {hoveredAnimal.stats && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attack/Defense:</span>
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
      )}
    </div>
  );
};

// Export memoized version for performance
export default memo(MapDisplayOptimized);