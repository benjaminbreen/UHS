/**
 * MapDisplayOptimized - Performance-optimized version of MapDisplay
 * This addresses the critical performance issues by replacing the expensive canvas rendering
 * with the MapCanvasPerformance component and optimized dependency management
 */

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { MapData, Tile, BiomeType, ClimateType, DevTooltipDisplayData, AnimalEntity, NpcEntity, VegetationEntity, LensMode, TerrainStructure, Season, PlayerCharacter } from '../types/index';
import { 
    TILE_SIZE_PX as TILE_SIZE_PX_CONST,
    MAP_WIDTH_TILES, 
    MAP_HEIGHT_TILES,
    STRUCTURE_BLUEPRINTS,
    METALS
} from '../constants/index';
import { ValueNoise } from '../utils/noise'; 
import { interpolateColor } from '../utils/colorUtils';
import { RuinsSymbol, PalaceSymbol, HolyPlaceSymbol, UrbanSymbol, CliffSymbol, PineTreeSymbol, PalmTreeSymbol, DeciduousTreeSymbol, CactusSymbol, BushSymbol, PlayerIcon, ShipIcon, FarmSymbol, NpcIcon, EstuarySymbol, HillSymbol, MarketplaceSymbol, MangroveSymbol, SaltFlatsSymbol, CoralReefSymbol } from './symbols';
import CoastlineOverlay from './CoastlineOverlay';
import Minimap from './Minimap';
import MapCanvasPerformance from './MapCanvasPerformance';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;
const ICON_ANIMATION_DURATION = 100;
const INITIAL_ZOOM_LEVEL = 1.4;

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
                        filter: 'blur(0.5px)',
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
                        filter: 'blur(0.5px) drop-shadow(0 0 1px rgba(255,255,255,0.8))'
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
  onDevHover: (data: DevTooltipDisplayData | null) => void;
  onDevCommandClick: (data: DevTooltipDisplayData) => void;
  onStructureClick: (structure: TerrainStructure) => void;
  onPoiClick: (poi: TerrainStructure) => void;
  onSettlementClick: (tile: Tile) => void;
  activeLens: LensMode;
  logicalControlledIconX: number | null; 
  logicalControlledIconY: number | null; 
  onIconAnimationComplete: () => void;
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
}

export const MapDisplayOptimized: React.FC<MapDisplayOptimizedProps> = ({ 
  mapData, 
  animals,
  npcs,
  onDevHover,
  onDevCommandClick, 
  onStructureClick,
  onPoiClick,
  onSettlementClick,
  activeLens, 
  logicalControlledIconX, 
  logicalControlledIconY,
  onIconAnimationComplete,
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
  gameTimeMinutes
}) => {
  // State management with performance considerations
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM_LEVEL);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isFreePanMode, setIsFreePanMode] = useState(false);
  
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
        // Check if mobile based on screen size and touch capability
        const isMobileDevice = window.innerWidth <= 768 || 
                              ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0);
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
  }, [mapData]);

  // When player moves, disable free pan to re-engage camera follow
  useEffect(() => {
    if (logicalControlledIconX !== null || logicalControlledIconY !== null) {
      setIsFreePanMode(false);
    }
  }, [logicalControlledIconX, logicalControlledIconY]);

  // Refactored smooth camera loop for performance
  useEffect(() => {
    const CAMERA_SMOOTH_FACTOR = 0.08;
    const CAMERA_SNAP_THRESHOLD = 0.1;

    let isLooping = true;
    
    const smoothCameraLoop = () => {
        if (!isLooping || !containerRef.current || !mapData) return;

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
  }, [mapData, displayPixelIconX, displayPixelIconY, isDragging, isFreePanMode, zoomLevel, panX, panY]);

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

  // Initial camera centering
  useEffect(() => {
    if (mapData && logicalControlledIconX !== null && logicalControlledIconY !== null && containerRef.current) {
      if (prevMapDataRef.current !== mapData || !hasCenteredOnCurrentMap.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const iconSvgX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
        const iconSvgY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;

        const initialPanX = containerWidth / 2 - iconSvgX * INITIAL_ZOOM_LEVEL;
        const initialPanY = containerHeight / 2 - iconSvgY * INITIAL_ZOOM_LEVEL;

        setZoomLevel(INITIAL_ZOOM_LEVEL);
        setPanX(initialPanX);
        setPanY(initialPanY);
        targetPanX.current = initialPanX;
        targetPanY.current = initialPanY;
        
        hasCenteredOnCurrentMap.current = true;
        prevMapDataRef.current = mapData;
      }
    }
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
        throttledOnDevHover({
          viewMode: 'standard',
          tile: tile,
          vegetation: vegetation,
          structure: structure,
          mapContext: { climate: mapData.climate, archetype: mapData.archetype, tiles: mapData.tiles }
        });
      } else {
        throttledOnDevHover(null);
      }
    }
  }, [isDragging, lastMousePos, getTileFromMouseEvent, mapData, throttledOnDevHover, isFreePanMode, zoomLevel]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const tile = getTileFromMouseEvent(e);
    if (!tile) return;

    const structure = mapData?.terrainStructures?.find(s => s.location[0] === tile.x && s.location[1] === tile.y) || tile.structure;
    const isPoi = structure && ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
    
    const settlementBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.FARMLAND]);

    if (isPoi) {
        onPoiClick(structure);
    } else if (structure) {
        onStructureClick(structure);
    } else if (settlementBiomes.has(tile.biome)) {
        onSettlementClick(tile);
    } else if (e.metaKey || e.ctrlKey) { 
        const vegetation = tile.vegetationId ? mapData?.vegetation?.find(v => v.id === tile.vegetationId) : null;
        onDevCommandClick({
            viewMode: 'standard',
            tile,
            vegetation,
            structure,
            mapContext: { climate: mapData.climate, archetype: mapData.archetype, tiles: mapData.tiles }
        });
    }
  }, [onDevCommandClick, onStructureClick, onPoiClick, onSettlementClick, getTileFromMouseEvent, mapData]);

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
    const panAmount = 100; // pixels to pan
    
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
  }, [mapData, zoomLevel]);

  // Performance-based rendering decisions with Safari optimizations
  const shouldRenderDetailedSymbols = zoomLevel > 0.8;
  const shouldRenderVegetation = zoomLevel > 0.5;
  const shouldRenderAnimations = zoomLevel > 0.6;
  const shouldUseBlurEffects = !isSafari || zoomLevel > 1.2; // Reduce blur effects on Safari

  // Helper to check if a tile is water (including shoals)
  const isWaterTile = useCallback((tile: Tile) => {
    return !tile.isLand || [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.SHOALS_TILE].includes(tile.biome);
  }, []);

  // Enhanced day/night cycle with smooth hour-by-hour transitions
  const timeOfDayData = useMemo(() => {
    const hour = gameTimeHours;
    const minute = gameTimeMinutes || 0;
    const fractionalHour = hour + (minute / 60);
    
    // Calculate smooth nightIntensity based on fractional hour
    let nightIntensity = 0;
    let colorShift = { r: 1, g: 1, b: 1 }; // RGB multipliers for color toning
    
    if (fractionalHour < 5) {
      // Deep night (midnight to 5am)
      nightIntensity = 0.75;
      colorShift = { r: 0.7, g: 0.75, b: 0.9 }; // Cool blue tint
    } else if (fractionalHour < 6) {
      // Pre-dawn (5am to 6am)
      const t = fractionalHour - 5;
      nightIntensity = 0.75 - (t * 0.25);
      colorShift = { r: 0.7 + (t * 0.15), g: 0.75 + (t * 0.1), b: 0.9 - (t * 0.1) };
    } else if (fractionalHour < 7) {
      // Dawn (6am to 7am)
      const t = fractionalHour - 6;
      nightIntensity = 0.5 - (t * 0.3);
      colorShift = { r: 0.85 + (t * 0.1), g: 0.85 + (t * 0.05), b: 0.8 + (t * 0.15) };
    } else if (fractionalHour < 8) {
      // Early morning (7am to 8am)
      const t = fractionalHour - 7;
      nightIntensity = 0.2 - (t * 0.2);
      colorShift = { r: 0.95 + (t * 0.05), g: 0.9 + (t * 0.1), b: 0.95 + (t * 0.05) };
    } else if (fractionalHour < 17) {
      // Full daylight (8am to 5pm)
      nightIntensity = 0;
      colorShift = { r: 1, g: 1, b: 1 };
    } else if (fractionalHour < 18) {
      // Late afternoon (5pm to 6pm)
      const t = fractionalHour - 17;
      nightIntensity = t * 0.1;
      colorShift = { r: 1, g: 0.98 - (t * 0.03), b: 0.95 - (t * 0.05) };
    } else if (fractionalHour < 19) {
      // Golden hour (6pm to 7pm)
      const t = fractionalHour - 18;
      nightIntensity = 0.1 + (t * 0.15);
      colorShift = { r: 1, g: 0.95 - (t * 0.1), b: 0.9 - (t * 0.15) };
    } else if (fractionalHour < 20) {
      // Dusk (7pm to 8pm)
      const t = fractionalHour - 19;
      nightIntensity = 0.25 + (t * 0.25);
      colorShift = { r: 1 - (t * 0.15), g: 0.85 - (t * 0.1), b: 0.75 - (t * 0.05) };
    } else if (fractionalHour < 21) {
      // Twilight (8pm to 9pm)
      const t = fractionalHour - 20;
      nightIntensity = 0.5 + (t * 0.15);
      colorShift = { r: 0.85 - (t * 0.1), g: 0.75, b: 0.7 + (t * 0.1) };
    } else {
      // Night (9pm to midnight)
      const t = Math.min((fractionalHour - 21) / 3, 1);
      nightIntensity = 0.65 + (t * 0.1);
      colorShift = { r: 0.75 - (t * 0.05), g: 0.75, b: 0.8 + (t * 0.1) };
    }
    
    const isNight = fractionalHour < 6 || fractionalHour >= 20;
    const isDawn = fractionalHour >= 5 && fractionalHour < 7;
    const isDusk = fractionalHour >= 18 && fractionalHour < 21;
    const isDay = fractionalHour >= 8 && fractionalHour < 18;

    return { isNight, isDawn, isDusk, isDay, nightIntensity, colorShift };
  }, [gameTimeHours, gameTimeMinutes]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Enhanced zoom controls */}
      <div className="absolute top-6 left-6 z-30 flex flex-col space-y-3">
        <button 
          onClick={zoomIn} 
          className="group w-12 h-12 flex items-center justify-center rounded-xl border border-gray-500/30 bg-gray-800/60 text-2xl font-bold text-white shadow-xl transition-all duration-200 backdrop-blur-md hover:border-blue-400/50 hover:bg-blue-700/60 hover:shadow-glow-primary"
          title="Zoom In (+)"
        >
          <span className="text-3xl leading-none transition-transform group-hover:scale-110">+</span>
        </button>
        <button 
          onClick={zoomOut} 
          className="group w-12 h-12 flex items-center justify-center rounded-xl border border-gray-500/30 bg-gray-800/60 text-2xl font-bold text-white shadow-xl transition-all duration-200 backdrop-blur-md hover:border-blue-400/50 hover:bg-blue-700/60 hover:shadow-glow-primary"
          title="Zoom Out (-)"
        >
          <span className="text-3xl leading-none transition-transform group-hover:scale-110">−</span>
        </button>
        <button 
          onClick={resetZoomAndCenter} 
          className="group w-12 h-12 flex items-center justify-center rounded-xl border border-gray-500/30 bg-gray-800/60 text-xl font-bold text-white shadow-xl transition-all duration-200 backdrop-blur-md hover:border-green-400/50 hover:bg-green-700/60 hover:shadow-glow-primary"
          title="Center on Player (0)"
        >
          <span className="text-2xl transition-transform group-hover:scale-110">⌂</span>
        </button>
      </div>

      {/* Enhanced zoom indicator */}
      <div className="absolute top-6 left-20 z-30 rounded-xl border border-gray-600/30 bg-gray-900/80 px-3 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-md">
        <div className="text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{Math.round(zoomLevel * 100)}%</div>
        <div className="text-xs text-gray-300">Zoom</div>
      </div>

      {/* Performance indicator */}
      <div className="absolute top-6 right-6 z-30 rounded-xl border border-green-600/30 bg-green-900/80 px-3 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-md">
        <div className="text-lg text-green-400">⚡ OPTIMIZED</div>
        <div className="text-xs text-green-300">High Performance</div>
      </div>

      {/* Mobile Direction Controls */}
      {isMobile && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-2">
          {/* Up button */}
          <button
            onClick={() => panMap('up')}
            className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
            aria-label="Pan Up"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          {/* Middle row with left, center, right */}
          <div className="flex items-center space-x-2">
            {/* Left button */}
            <button
              onClick={() => panMap('left')}
              className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
              aria-label="Pan Left"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Center/Reset button */}
            <button
              onClick={resetZoomAndCenter}
              className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-green-400/60 hover:bg-green-700/70 active:scale-95"
              aria-label="Center on Player"
            >
              <span className="text-2xl">⌂</span>
            </button>
            
            {/* Right button */}
            <button
              onClick={() => panMap('right')}
              className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
              aria-label="Pan Right"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Down button */}
          <button
            onClick={() => panMap('down')}
            className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
            aria-label="Pan Down"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile Zoom Controls - positioned differently on mobile */}
      {isMobile && (
        <div className="absolute bottom-24 right-6 z-30 flex flex-col space-y-3">
          <button 
            onClick={zoomIn} 
            className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-2xl font-bold text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
            aria-label="Zoom In"
          >
            <span className="text-3xl leading-none">+</span>
          </button>
          <button 
            onClick={zoomOut} 
            className="group w-14 h-14 flex items-center justify-center rounded-full border border-gray-500/40 bg-gray-800/70 text-2xl font-bold text-white shadow-lg transition-all duration-200 backdrop-blur-md hover:border-blue-400/60 hover:bg-blue-700/70 active:scale-95"
            aria-label="Zoom Out"
          >
            <span className="text-3xl leading-none">−</span>
          </button>
        </div>
      )}

      {/* Enhanced minimap */}
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
          nightIntensity={timeOfDayData.nightIntensity}
          colorShift={timeOfDayData.colorShift}
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

          {noiseGenerators && <CoastlineOverlay mapData={mapData} noise={noiseGenerators.shoreline} />}

          {/* Rendering layers */}
          <g>
            {/* Strategic Lens Overlay */}
            {activeLens !== 'none' && (
                <g key="strategic-lens" opacity="0.6" style={{ mixBlendMode: 'multiply' }}>
                    {tiles.flat().map(tile => {
                        let value = 0;
                        let color = 'transparent';

                        if (tile.isLand) {
                            switch(activeLens) {
                                case 'safety':
                                    value = tile.qualities.safety;
                                    color = interpolateColor('#ff4d4d', '#4dff4d', value);
                                    break;
                                case 'biodiversity':
                                    value = tile.qualities.biodiversity;
                                    color = interpolateColor('#a0ffff', '#006400', value);
                                    break;
                                case 'minerals':
                                    value = Math.max(tile.qualities.geologicalStress || 0, tile.qualities.thermalActivity || 0);
                                    if (value > 0.3) {
                                      color = interpolateColor('#ffff00', '#800080', (value - 0.3) / 0.7);
                                    }
                                    break;
                            }
                        }

                        if (value > 0.1 && color !== 'transparent') {
                            return (
                                <rect
                                    key={`lens-${tile.x}-${tile.y}`}
                                    x={tile.x * TILE_SIZE_PX}
                                    y={tile.y * TILE_SIZE_PX}
                                    width={TILE_SIZE_PX}
                                    height={TILE_SIZE_PX}
                                    fill={color}
                                    fillOpacity={value * 0.9}
                                />
                            );
                        }
                        return null;
                    })}
                </g>
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
                    filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.7))', 
                    pointerEvents: 'none'
                  }}
                >
                  {veg.symbol}
                </text>
              );
            })}
            
            {/* Enhanced symbols layer */}
            {shouldRenderDetailedSymbols && (
              <g filter="url(#symbolShadow)">
                {tiles.flat().map((tile) => {
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  // Create position-specific seed for each symbol to ensure static randomization
                  const tileSeed = seed + tile.x * 31 + tile.y * 37;
                  const elements = [];
                  
                  if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER].includes(tile.biome)) {
                    elements.push(<UrbanSymbol key={`urban-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} nightIntensity={timeOfDayData.nightIntensity} />);
                  } else if(tile.biome === BiomeType.MARKETPLACE) {
                    elements.push(<MarketplaceSymbol key={`marketplace-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} nightIntensity={timeOfDayData.nightIntensity} date={formattedDate} zone={currentLocation} />);
                  } else if(tile.biome === BiomeType.PALACE) {
                    elements.push(<PalaceSymbol key={`palace-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} nightIntensity={timeOfDayData.nightIntensity} />);
                  } else if(tile.biome === BiomeType.RUINS) {
                    elements.push(<RuinsSymbol key={`ruins-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />);
                  } else if(tile.biome === BiomeType.HOLY_SITE) {
                    elements.push(<HolyPlaceSymbol key={`holy-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} />);
                  } else if(tile.biome === BiomeType.CLIFF) {
                    elements.push(<CliffSymbol key={`cliff-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />);
                  } else if(tile.biome === BiomeType.MANGROVE) {
                    elements.push(<MangroveSymbol key={`mangrove-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.SALT_FLATS) {
                    elements.push(<SaltFlatsSymbol key={`saltflats-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.HILLS) {
                    elements.push(<HillSymbol key={`hill-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} climate={climate} season={season}/>);
                  } else if(tile.biome === BiomeType.FARMLAND) {
                    elements.push(<FarmSymbol key={`farm-${tile.x}-${tile.y}`} tile={tile} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} />);
                  } else if(tile.biome === BiomeType.ESTUARY) {
                    elements.push(<EstuarySymbol key={`estuary-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  } else if(tile.biome === BiomeType.REEF) {
                    elements.push(<CoralReefSymbol key={`reef-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  }

                  return elements;
                })}

                {/* Terrain Structures  */}
                {terrainStructures?.map(structure => {
                  const blueprint = STRUCTURE_BLUEPRINTS[structure.structureType];
                  if (!blueprint) return null;
                  const isPoi = ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
                  if(isPoi) return null;

                  const structX = structure.location[0] * TILE_SIZE_PX + TILE_SIZE_PX / 2;
                  const structY = structure.location[1] * TILE_SIZE_PX + TILE_SIZE_PX / 2;
                  const isRuined = structure.state === 'ruined';
                  return (
                    <g key={structure.id} className="transition-transform duration-200">
                      <text
                        x={structX}
                        y={structY}
                        fontSize={TILE_SIZE_PX * 1.3}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ 
                          cursor: 'pointer',
                          filter: isRuined ? 'grayscale(1) drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' : 'drop-shadow(2px 3px 4px rgba(0,0,0,0.9))',
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

            {/* Animals and NPCs layer  */}
            <g>
              {animals.map(animal => (
                <g key={animal.id} 
                   onClick={(e) => { e.stopPropagation(); onAnimalClick(animal); }} 
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}>
                  {/* Shadow beneath animal */}
                  <ellipse
                    cx={animal.x * TILE_SIZE_PX + TILE_SIZE_PX/2}
                    cy={animal.y * TILE_SIZE_PX + TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.4}
                    rx={TILE_SIZE_PX * 0.3}
                    ry={TILE_SIZE_PX * 0.1}
                    fill="rgba(0,0,0,0.3)"
                    filter={shouldUseBlurEffects ? "blur(2px)" : "none"}
                  />
                  <text
                    x={animal.x * TILE_SIZE_PX + TILE_SIZE_PX/2}
                    y={animal.y * TILE_SIZE_PX + TILE_SIZE_PX/2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={TILE_SIZE_PX * 1.2}
                    className={selectedAnimalId === animal.id ? 'animate-ff6-idle-bob' : ''}
                    style={{
                      filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.8))',
                      stroke: selectedAnimalId === animal.id ? 'yellow' : 'none',
                      strokeWidth: selectedAnimalId === animal.id ? 2 : 0
                    }}
                  >
                    {animal.emoji}
                  </text>
                </g>
              ))}
              {npcs.map(npc => (
                <g key={npc.id} 
                   onClick={(e) => { e.stopPropagation(); onNpcClick(npc); }} 
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}
                   className={selectedNpcId === npc.id ? 'animate-ff6-idle-bob' : ''}>
                  {/* Shadow beneath NPC */}
                  <ellipse
                    cx={npc.x * TILE_SIZE_PX + TILE_SIZE_PX/2}
                    cy={npc.y * TILE_SIZE_PX + TILE_SIZE_PX/2 + TILE_SIZE_PX * 0.4}
                    rx={TILE_SIZE_PX * 0.35}
                    ry={TILE_SIZE_PX * 0.12}
                    fill="rgba(0,0,0,0.35)"
                    filter={shouldUseBlurEffects ? "blur(2px)" : "none"}
                  />
                  
                  {/* NPC glow completely removed - no lighting effects at all */}
                  {false && (() => {
                    const currentEra = (() => {
                      const year = parseInt(formattedDate.split(' ')[0]);
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
                          cx={npc.x * TILE_SIZE_PX + TILE_SIZE_PX/2}
                          cy={npc.y * TILE_SIZE_PX + TILE_SIZE_PX/2}
                          r={TILE_SIZE_PX * lightSize * 0.7 * sizeVariation}
                          fill={subtleAmberColor}
                          opacity={staticGlowOpacity * 0.5}
                          filter="blur(10px)"
                        />
                        
                        {/* Gentle inner glow */}
                        <circle
                          cx={npc.x * TILE_SIZE_PX + TILE_SIZE_PX/2}
                          cy={npc.y * TILE_SIZE_PX + TILE_SIZE_PX/2}
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
                  <ShipIcon
                    x={shipDockX * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                    y={shipDockY * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                    rotation={0}
                    velocity={{ x: 0, y: 0 }}
                  />
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
                      <ShipIcon
                        x={displayPixelIconX}
                        y={displayPixelIconY}
                        rotation={iconRotation}
                        velocity={velocity}
                      />
                    ) : playerCharacter && (
                      <PlayerIcon
                        x={displayPixelIconX}
                        y={displayPixelIconY}
                        character={playerCharacter}
                      />
                    )}
                  </g>
                </g>
              )}
            </g>

            {/* Desert dust particles - atmospheric effect */}
            {shouldRenderDetailedSymbols && (
              <g>
                {tiles.flat()
                  .filter(tile => tile.biome === BiomeType.DESERT && tile.isLand)
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
    </div>
  );
};

// Export memoized version for performance
export default memo(MapDisplayOptimized);