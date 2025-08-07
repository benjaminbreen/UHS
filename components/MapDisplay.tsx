import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { MapData, Tile, BiomeType, ClimateType, MapArchetype, PathObject, PathType, DevTooltipDisplayData, AnimalEntity, NpcEntity, SunPosition, VegetationEntity, LensMode, TerrainStructure, Season, PlayerCharacter } from '../types/index';
import { 
    TILE_SIZE_PX as TILE_SIZE_PX_CONST,
    CLIMATE_WATER_COLORS,
    MAP_WIDTH_TILES, 
    MAP_HEIGHT_TILES,
    STRUCTURE_BLUEPRINTS,
    METALS
} from '../constants/index';
import { ValueNoise } from '../utils/noise'; 
import { getTileRenderColor, interpolateColor } from '../utils/colorUtils';
import { RuinsSymbol, PalaceSymbol, HolyPlaceSymbol, UrbanSymbol, CliffSymbol, PineTreeSymbol, PalmTreeSymbol, DeciduousTreeSymbol, CactusSymbol, BushSymbol, PlayerIcon, ShipIcon, FarmSymbol, NpcIcon, EstuarySymbol, HillSymbol, MarketplaceSymbol, MangroveSymbol, SaltFlatsSymbol, CoralReefSymbol } from './symbols';
import { useTilePatterns } from './TilePatterns';
import CoastlineOverlay from './CoastlineOverlay';
import Minimap from './Minimap';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;
const ICON_ANIMATION_DURATION = 100;
const INITIAL_ZOOM_LEVEL = 1.4;
const NOISE_SCALE_COASTLINE_PERTURB = 0.07; 
const COASTLINE_PERTURB_AMOUNT = TILE_SIZE_PX * 0.25;

type PlayerMode = 'ship' | 'onFoot';

// Enhanced memoized components for better performance with React.memo comparison
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

// Enhanced water animations with better visual effects
const MemoizedCoralReefAnimation = memo<{x: number, y: number, size: number, seed: number}>(({ x, y, size, seed }) => {
    const localRand = useMemo(() => new ValueNoise(seed + x * 13 + y * 17).random, [seed, x, y]);
    
    if (localRand() > 0.4) return null;
    
    return (
        <g opacity="0.85">
            {/* Coral reef emoji with water overlay effect */}
            <text
                x={x + size * 0.5}
                y={y + size * 0.7}
                fontSize={size * 0.8}
                textAnchor="middle"
                opacity="0.7"
                filter="blur(0.3px)"
                style={{
                    mixBlendMode: 'normal'
                }}
            >
                🪸
            </text>
            {/* Water ripple overlay */}
            <circle
                cx={x + size * 0.5}
                cy={y + size * 0.5}
                r={size * 0.4}
                fill="url(#waterRippleGradient)"
                opacity="0.4"
                style={{
                    mixBlendMode: 'overlay'
                }}
            />
            {/* Fish animations */}
            <text
                x={x + size * 0.3}
                y={y + size * 0.4}
                fontSize={size * 0.4}
                className="animate-reefFishSwim"
                style={{
                    '--fish-delay': `${localRand() * 2}s`,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                } as React.CSSProperties}
            >
                🐠
            </text>
            {localRand() > 0.7 && (
                <text
                    x={x + size * 0.7}
                    y={y + size * 0.6}
                    fontSize={size * 0.35}
                    className="animate-reefFishSwim"
                    style={{
                        '--fish-delay': `${localRand() * 3}s`,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    } as React.CSSProperties}
                >
                    🐟
                </text>
            )}
        </g>
    );
});

const MemoizedHotSpringAnimation = memo<{x: number, y: number, size: number, seed: number}>(({ x, y, size, seed }) => {
    const localRand = useMemo(() => new ValueNoise(seed + x * 37 + y * 41).random, [seed, x, y]);
    
    if (localRand() > 0.5) return null;
    
    return (
        <g opacity="0.75">
            <circle
                cx={x + size * 0.3}
                cy={y + size * 0.5}
                r={size * 0.12}
                fill="url(#steamGradient)"
                className="animate-riseSteam"
                filter="blur(1px)"
            />
            <circle
                cx={x + size * 0.7}
                cy={y + size * 0.6}
                r={size * 0.06}
                fill="rgba(173,216,230,0.8)"
                className="animate-bubbleRise"
                filter="url(#bubbleGlow)"
            />
        </g>
    );
});

// Enhanced RAF throttle with better performance
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
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

interface MapDisplayProps {
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
  sunPosition: SunPosition;
  formattedDate: string;
  season: Season;
  currentLocation: string;
  iconRotation: number;
  velocity: { x: number; y: number };
  playerCharacter: PlayerCharacter | null;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ 
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
  sunPosition,
  formattedDate,
  season,
  currentLocation,
  iconRotation,
  velocity,
  playerCharacter
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
  const renderFrameId = useRef<number | null>(null);

  // NEW: Refs for direct transform manipulation to optimize dragging
  const currentPanX = useRef(panX);
  const currentPanY = useRef(panY);

  // Display state
  const [displayPixelIconX, setDisplayPixelIconX] = useState<number | null>(null);
  const [displayPixelIconY, setDisplayPixelIconY] = useState<number | null>(null);
  
  const patterns = useTilePatterns({ mapData });

  // Memoized noise generators
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


  // Container dimension tracking with debounce
  useEffect(() => {
    let timeoutId: number;
    const updateDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setContainerDimensions({ width: rect.width, height: rect.height });
        }
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

  // Enhanced canvas rendering with better visuals and performance
  useEffect(() => {
    if (!mapData || !canvasRef.current || canvasSize.width === 0 || !noiseGenerators) return;

    // Cancel any pending render frame
    if (renderFrameId.current) {
      cancelAnimationFrame(renderFrameId.current);
    }

    renderFrameId.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
      });
      if (!ctx) return;

      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Beautiful seamless tropical ocean background with climate variations
      const createSeamlessTropicalWater = () => {
        let deepOceanColor = '#2563eb';
        let midOceanColor = '#1e40af';
        let shallowTint = 'rgba(34, 197, 194, 0.2)';
        let foamColor = 'rgba(255, 255, 255, 0.12)';
        
        if (mapData.climate === ClimateType.TROPICAL || mapData.climate === ClimateType.SEMITROPICAL) {
          deepOceanColor = '#1e40af';
          midOceanColor = '#1e3a8a';
          shallowTint = 'rgba(34, 211, 238, 0.35)';
          foamColor = 'rgba(255, 255, 255, 0.18)';
        } else if (mapData.climate === ClimateType.ARID) {
          deepOceanColor = '#1e3a8a';
          midOceanColor = '#172554';
          shallowTint = 'rgba(14, 165, 233, 0.3)';
        } else if (mapData.climate === ClimateType.COLD) {
          deepOceanColor = '#1e3a8a';
          midOceanColor = '#172554';
          shallowTint = 'rgba(100, 116, 139, 0.25)';
          foamColor = 'rgba(200, 220, 240, 0.12)';
        }
        
        // Multi-layer ocean rendering for depth
        ctx.fillStyle = deepOceanColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add depth gradient with better blending
        const depthGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
        );
        depthGradient.addColorStop(0, shallowTint);
        depthGradient.addColorStop(0.3, 'rgba(37, 99, 235, 0.18)');
        depthGradient.addColorStop(0.7, 'rgba(30, 58, 138, 0.12)');
        depthGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = depthGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle wave patterns with better layering
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 4; i++) {
          const waveGradient = ctx.createLinearGradient(0, i * 120, canvas.width, i * 120 + 250);
          waveGradient.addColorStop(0, foamColor);
          waveGradient.addColorStop(0.5, 'transparent');
          waveGradient.addColorStop(1, foamColor);
          ctx.fillStyle = waveGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1.0;
      };

      createSeamlessTropicalWater();

      // Enhanced tile rendering with improved shoal blending
      const generateOrganicLandPath = (tile: Tile, expand: number = 0): Path2D => {
        const path = new Path2D();
        const { x, y } = tile;
        const tileX_base = x * TILE_SIZE_PX - expand;
        const tileY_base = y * TILE_SIZE_PX - expand;
        const expandedSize = TILE_SIZE_PX + expand * 2;

        const getNeighbor = (nx: number, ny: number): Tile | null => {
          if (nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height) {
            return mapData.tiles[ny][nx];
          }
          return null;
        };
        
        const getFractalNoise = (px: number, py: number): number => {
          let value = 0;
          let amplitude = 0.8; 
          let frequency = 1.5; 
          for (let i = 0; i < 3; i++) {
            value += noiseGenerators.shoreline.noise(px * frequency, py * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
          }
          return value;
        };

        const edges = [
          { x1: tileX_base, y1: tileY_base, x2: tileX_base + expandedSize, y2: tileY_base, nx: 0, ny: -1, edgeName: 'top' },
          { x1: tileX_base + expandedSize, y1: tileY_base, x2: tileX_base + expandedSize, y2: tileY_base + expandedSize, nx: 1, ny: 0, edgeName: 'right' },
          { x1: tileX_base + expandedSize, y1: tileY_base + expandedSize, x2: tileX_base, y2: tileY_base + expandedSize, nx: 0, ny: 1, edgeName: 'bottom' },
          { x1: tileX_base, y1: tileY_base + expandedSize, x2: tileX_base, y2: tileY_base, nx: -1, ny: 0, edgeName: 'left' }
        ];

        path.moveTo(edges[0].x1, edges[0].y1);

        edges.forEach(edge => {
          const neighbor = getNeighbor(x + edge.nx, y + edge.ny);
          const neighborIsWater = !neighbor || !neighbor.isLand;

          if (!neighborIsWater) {
            path.lineTo(edge.x2, edge.y2);
          } else {
            const segments = 6;
            
            for (let i = 0; i <= segments; i++) {
              const t_local = i / segments;
              const baseX = edge.x1 + (edge.x2 - edge.x1) * t_local;
              const baseY = edge.y1 + (edge.y2 - edge.y1) * t_local;

              const isHorizontalEdge = edge.y1 === edge.y2;
              
              let t_canonical = t_local;
              if (edge.edgeName === 'bottom' || edge.edgeName === 'left') {
                t_canonical = 1.0 - t_local;
              }

              let noiseSampleX, noiseSampleY;
              if (isHorizontalEdge) {
                const neighborY_logical = y + edge.ny;
                noiseSampleX = x + t_canonical;
                noiseSampleY = Math.min(y, neighborY_logical) + 1;
              } else {
                const neighborX_logical = x + edge.nx;
                noiseSampleX = Math.min(x, neighborX_logical) + 1;
                noiseSampleY = y + t_canonical;
              }
              
              const fractalPerturb = getFractalNoise(
                (noiseSampleX + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB,
                (noiseSampleY + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB
              ) * COASTLINE_PERTURB_AMOUNT;

              const perturbedX = isHorizontalEdge ? baseX : baseX + fractalPerturb;
              const perturbedY = isHorizontalEdge ? baseY + fractalPerturb : baseY;

              if (i === 0) path.lineTo(perturbedX, perturbedY);
              else path.lineTo(perturbedX, perturbedY);
            }
          }
        });
        
        path.closePath();
        return path;
      };

      // Enhanced shoal rendering with gradient blending
      const renderShoals = () => {
        for (let y = 0; y < mapData.height; y++) {
          for (let x = 0; x < mapData.width; x++) {
            const tile = mapData.tiles[y][x];
            if (tile.biome === BiomeType.SHOALS_TILE) {
              const tileX = x * TILE_SIZE_PX;
              const tileY = y * TILE_SIZE_PX;
              
              // Create gradient for shoal blending
              const gradient = ctx.createRadialGradient(
                tileX + TILE_SIZE_PX / 2,
                tileY + TILE_SIZE_PX / 2,
                0,
                tileX + TILE_SIZE_PX / 2,
                tileY + TILE_SIZE_PX / 2,
                TILE_SIZE_PX * 0.8
              );
              
              // Blend from light turquoise center to transparent edges
              gradient.addColorStop(0, 'rgba(94, 234, 212, 0.3)');
              gradient.addColorStop(0.5, 'rgba(94, 234, 212, 0.15)');
              gradient.addColorStop(0.8, 'rgba(94, 234, 212, 0.05)');
              gradient.addColorStop(1, 'transparent');
              
              ctx.fillStyle = gradient;
              ctx.fillRect(tileX - TILE_SIZE_PX * 0.5, tileY - TILE_SIZE_PX * 0.5, TILE_SIZE_PX * 2, TILE_SIZE_PX * 2);
              
              // Add subtle noise texture
              ctx.globalAlpha = 0.1;
              const noiseValue = noiseGenerators.shoalBlend.noise(x * 0.1, y * 0.1);
              if (noiseValue > 0.5) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(tileX, tileY, TILE_SIZE_PX, TILE_SIZE_PX);
              }
              ctx.globalAlpha = 1.0;
            }
          }
        }
      };

      // Render shoals first
      renderShoals();

      // Batch similar tiles for rendering with better grouping
      const tileBatches = new Map<string, { tiles: Tile[], color: string }>();
      
      // First pass: group tiles by render properties
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const tile = mapData.tiles[y][x];
          if (tile.isLand) {
            const color = getTileRenderColor(tile, mapData.climate, mapData.seed);
            const key = `${tile.biome}-${color}`;
            if (!tileBatches.has(key)) {
              tileBatches.set(key, { tiles: [], color });
            }
            tileBatches.get(key)!.tiles.push(tile);
          }
        }
      }

      // Render expanded base layer to prevent gaps
      ctx.save();
      tileBatches.forEach(({ tiles, color }) => {
        ctx.fillStyle = color;
        tiles.forEach(tile => {
          const expandedPath = generateOrganicLandPath(tile, 2);
          ctx.fill(expandedPath);
        });
      });
      ctx.restore();

      // Render normal tiles with patterns and ambient occlusion
      ctx.save();
      tileBatches.forEach(({ tiles, color }) => {
        tiles.forEach(tile => {
          const organicPath = generateOrganicLandPath(tile, 0);
          
          // Base color with slight shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = color;
          ctx.fill(organicPath);
          ctx.restore();
          
          // Terrain pattern with varying opacity
          const terrainPattern = patterns.terrain.get(tile.biome);
          if (terrainPattern) {
            let patternOpacity = 0.15;
            if ([BiomeType.DESERT, BiomeType.GRASSLAND, BiomeType.BEACH, BiomeType.SCRUB].includes(tile.biome)) {
              patternOpacity = 0.38;
            } else if ([BiomeType.SNOW, BiomeType.TUNDRA].includes(tile.biome)) {
              patternOpacity = 0.28;
            }
            ctx.globalAlpha = patternOpacity;
            ctx.fillStyle = terrainPattern;
            ctx.fill(organicPath);
            ctx.globalAlpha = 1.0;
          }
          
          // Enhanced ambient occlusion at edges
          const gradient = ctx.createRadialGradient(
            tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2,
            tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2,
            TILE_SIZE_PX * 0.25,
            tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2,
            tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2,
            TILE_SIZE_PX * 0.75
          );
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
          ctx.fillStyle = gradient;
          ctx.fill(organicPath);
        });
      });
      ctx.restore();
      
      renderFrameId.current = null;
    });

    return () => {
      if (renderFrameId.current) {
        cancelAnimationFrame(renderFrameId.current);
      }
    };
  }, [mapData, canvasSize, patterns, noiseGenerators]);

  // When player moves, disable free pan to re-engage camera follow
  useEffect(() => {
    if (logicalControlledIconX !== null || logicalControlledIconY !== null) {
      setIsFreePanMode(false);
    }
  }, [logicalControlledIconX, logicalControlledIconY]);

  // Refactored smooth camera loop for performance
  useEffect(() => {
    const CAMERA_SMOOTH_FACTOR = 0.08; // Adjusted for snappier feel
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
        
        // This part is the "controller" - it decides *where* the camera should go.
        if (focusX !== null && focusY !== null && !isDragging && !isFreePanMode) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const margin = 4 * TILE_SIZE_PX * zoomLevel;
            const deadZoneXMin = Math.min(margin, containerWidth * 0.4);
            const deadZoneXMax = Math.max(containerWidth - margin, containerWidth * 0.6);
            const deadZoneYMin = Math.min(margin, containerHeight * 0.4);
            const deadZoneYMax = Math.max(containerHeight - margin, containerHeight * 0.6);
            
            // Read from the ref for current position, not the state, to avoid dependency loop.
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

        // This part is the "animator" - it moves the camera.
        const deltaX = targetPanX.current - currentPanX.current;
        const deltaY = targetPanY.current - currentPanY.current;

        // Only animate if not dragging and camera needs to move
        if (!isDragging && !isFreePanMode && (Math.abs(deltaX) > CAMERA_SNAP_THRESHOLD || Math.abs(deltaY) > CAMERA_SNAP_THRESHOLD)) {
            currentPanX.current += deltaX * CAMERA_SMOOTH_FACTOR;
            currentPanY.current += deltaY * CAMERA_SMOOTH_FACTOR;

            const newTransform = `translate(${currentPanX.current}px, ${currentPanY.current}px) scale(${zoomLevel})`;
            if (canvasRef.current) canvasRef.current.style.transform = newTransform;
            if (svgRef.current) svgRef.current.style.transform = newTransform;
        } else if (!isDragging && !isFreePanMode) {
            // Animation is complete or delta is too small. Snap to final position and sync with React state.
            currentPanX.current = targetPanX.current;
            currentPanY.current = targetPanY.current;

            // Only call setState if the ref and state are out of sync.
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


  // Detect player movement for camera centering
  const prevLogicalX = useRef<number | null>(null);
  const prevLogicalY = useRef<number | null>(null);
  
  useEffect(() => {
    if (logicalControlledIconX !== null && logicalControlledIconY !== null) {
      if (prevLogicalX.current !== null && prevLogicalY.current !== null) {
        const moved = prevLogicalX.current !== logicalControlledIconX || 
                      prevLogicalY.current !== logicalControlledIconY;
        
        if (moved && containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;
          const playerPixelX = logicalControlledIconX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
          const playerPixelY = logicalControlledIconY * TILE_SIZE_PX + TILE_SIZE_PX / 2;
          
          targetPanX.current = containerWidth / 2 - playerPixelX * zoomLevel;
          targetPanY.current = containerHeight / 2 - playerPixelY * zoomLevel;
        }
      }
      prevLogicalX.current = logicalControlledIconX;
      prevLogicalY.current = logicalControlledIconY;
    }
  }, [logicalControlledIconX, logicalControlledIconY, zoomLevel]);
  
  // Global mouse event handling
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Enhanced icon animation with spring physics
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

  const { width, height, tiles, seed, climate, pathObjects, continent, timeSlice, vegetation, terrainStructures } = mapData;
  const svgWidth = width * TILE_SIZE_PX;
  const svgHeight = height * TILE_SIZE_PX;

  const minZoom = 0.4;
  const maxZoom = 12;

  // Optimized interaction handlers with debouncing
  const handleWheel = useCallback(rafThrottle((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !mapData) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const svgMouseX = (mouseX - panX) / zoomLevel;
    const svgMouseY = (mouseY - panY) / zoomLevel;
    const zoomDelta = e.deltaY > 0 ? 0.82 : 1.22;
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

      if (canvasRef.current) {
        canvasRef.current.style.transform = newTransform;
      }
      if (svgRef.current) {
        svgRef.current.style.transform = newTransform;
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
  }, [isDragging, lastMousePos, onDevHover, getTileFromMouseEvent, mapData, throttledOnDevHover, isFreePanMode, zoomLevel]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const tile = getTileFromMouseEvent(e);
    if (!tile) return;

    // A structure is a POI if its type is holy_site, palace, or ruin.
    // The structure can be on the tile itself (from older generation) or in the terrainStructures array.
    const structure = mapData?.terrainStructures?.find(s => s.location[0] === tile.x && s.location[1] === tile.y) || tile.structure;
    const isPoi = structure && ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
    
    const settlementBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.FARMLAND]);

    if (isPoi) {
        onPoiClick(structure);
    } 
    // Prioritize clicking on any other structure object if it exists
    else if (structure) {
        onStructureClick(structure);
    } 
    // Then check for settlements
    else if (settlementBiomes.has(tile.biome)) {
        onSettlementClick(tile);
    } 
    // Finally, handle dev command clicks
    else if (e.metaKey || e.ctrlKey) { 
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

  // Enhanced zoom controls
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return; 
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 't') {
        return; 
      }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); } 
      else if (e.key === '-') { e.preventDefault(); zoomOut(); } 
      else if (e.key === '0') { e.preventDefault(); resetZoomAndCenter(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoomAndCenter]);
  
  // Performance-based rendering decisions
  const shouldRenderDetailedSymbols = zoomLevel > 0.8;
  const shouldRenderVegetation = zoomLevel > 0.5;
  const shouldRenderAnimations = zoomLevel > 0.6;

  // Helper to check if a tile is water (including shoals)
  const isWaterTile = useCallback((tile: Tile) => {
    // Handle shoals tiles specially - they can be either land or water
    if (tile.biome === BiomeType.SHOALS_TILE) {
      return !tile.isLand;
    }
    return !tile.isLand || [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN].includes(tile.biome);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl">
      {/* Enhanced zoom controls with glass morphism */}
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

      {/* Main map container with better containment */}
      <div 
        ref={containerRef}
        className="relative h-full w-full overflow-hidden rounded-3xl bg-transparent"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          contain: 'layout style paint'
        }}
        onWheel={handleWheel} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Enhanced canvas with filters */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            imageRendering: zoomLevel > 3 ? 'crisp-edges' : 'auto',
            filter: mapData.climate === ClimateType.TROPICAL || mapData.climate === ClimateType.SEMITROPICAL || mapData.climate === ClimateType.ARID
              ? 'contrast(1.02) saturate(1.04) brightness(1.02) hue-rotate(-2deg)' // Enhanced vivid colors
              : mapData.climate === ClimateType.COLD 
              ? 'contrast(1.01) saturate(0.99) brightness(1.1) hue-rotate(-12deg)' // Cooler, more dramatic
              : 'contrast(1.0) saturate(1.0) brightness(1.0)',
            transition: 'filter 0.2s ease-out',
            willChange: 'transform'
          }}
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
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feFlood floodColor="#000000" floodOpacity="0.7"/>
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
            
            <filter id="bubbleGlow">
              <feGaussianBlur stdDeviation="2.5" result="glow"/>
              <feSpecularLighting result="specOut" in="glow" specularConstant="1.5" specularExponent="20" lighting-color="white">
                <fePointLight x="-50" y="30" z="200"/>
              </feSpecularLighting>
              <feComposite in="glow" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
              <feMerge>
                <feMergeNode in="specOut"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <linearGradient id="steamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            
            <radialGradient id="waterRippleGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(173,216,230,0.4)" />
              <stop offset="50%" stopColor="rgba(135,206,235,0.2)" />
              <stop offset="100%" stopColor="rgba(70,130,180,0.1)" />
            </radialGradient>
            
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
            {/* Mineral Deposit Visuals */}
            <g key="mineral-deposits">
                {tiles.flat().map(tile => {
                    if (!tile.mineralDeposit || tile.mineralDeposit.quantity <= 0) return null;
                    const metalDef = METALS[tile.mineralDeposit.metalId];
                    if (!metalDef?.visual) return null;

                    const tileX = tile.x * TILE_SIZE_PX;
                    const tileY = tile.y * TILE_SIZE_PX;
                    const elements = [];
                    const rand = new ValueNoise(seed + tile.x * 23 + tile.y * 53).random;

                    switch(metalDef.visual.type) {
                        case 'streaks':
                            for(let i=0; i < 3; i++) {
                                const startX = tileX + rand() * TILE_SIZE_PX;
                                const startY = tileY + rand() * TILE_SIZE_PX;
                                const endX = startX + (rand() - 0.5) * TILE_SIZE_PX * 1.2;
                                const endY = startY + (rand() - 0.5) * TILE_SIZE_PX * 1.2;
                                elements.push(<path key={`streak-${i}`} d={`M ${startX} ${startY} Q ${startX + (rand()-0.5)*5} ${startY + (rand()-0.5)*5}, ${endX} ${endY}`} stroke={metalDef.visual.color} strokeWidth="1.2" fill="none" opacity="0.8" />);
                            }
                            break;
                        case 'patches':
                             for(let i=0; i < 4; i++) {
                                elements.push(<circle key={`patch-${i}`} cx={tileX + rand() * TILE_SIZE_PX} cy={tileY + rand() * TILE_SIZE_PX} r={1 + rand() * 2} fill={metalDef.visual.color} opacity="0.6" />);
                            }
                            break;
                        case 'sparkles':
                             for(let i=0; i < 5; i++) {
                                elements.push(<circle key={`sparkle-${i}`} cx={tileX + rand() * TILE_SIZE_PX} cy={tileY + rand() * TILE_SIZE_PX} r={0.8} fill={metalDef.visual.color} className="animate-pulse" />);
                            }
                            break;
                    }
                    return <g key={`deposit-${tile.x}-${tile.y}`}>{elements}</g>;
                })}
            </g>

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
                                    color = interpolateColor('#ff4d4d', '#4dff4d', value); // Red to Green
                                    break;
                                case 'biodiversity':
                                    value = tile.qualities.biodiversity;
                                    color = interpolateColor('#a0ffff', '#006400', value); // Light Blue to Deep Green
                                    break;
                                case 'minerals':
                                    value = Math.max(tile.qualities.geologicalStress || 0, tile.qualities.thermalActivity || 0);
                                    if (value > 0.3) {
                                      color = interpolateColor('#ffff00', '#800080', (value - 0.3) / 0.7); // Yellow to Purple
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
                     {/* Mineral Deposit Highlights on Minerals Lens */}
                    {activeLens === 'minerals' && tiles.flat().map(tile => {
                        if (tile.mineralDeposit && tile.mineralDeposit.quantity > 0) {
                            return (
                                <circle
                                    key={`mineral-highlight-${tile.x}-${tile.y}`}
                                    cx={tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                                    cy={tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                                    r={TILE_SIZE_PX * 0.6}
                                    fill="none"
                                    stroke="#ff00ff"
                                    strokeWidth="2"
                                    strokeDasharray="3 2"
                                    className="animate-pulseGlow"
                                />
                            )
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

                  {/* Animated water features */}
            {shouldRenderAnimations && tiles.flat().map((tile) => {
              if (tile.biome === BiomeType.REEF) {
                return (
                  <CoralReefSymbol
                    key={`coral-${tile.x}-${tile.y}`}
                    x={tile.x * TILE_SIZE_PX}
                    y={tile.y * TILE_SIZE_PX}
                    size={TILE_SIZE_PX}
                    seed={seed}
                    tileX={tile.x}
                    tileY={tile.y}
                  />
                );
              } else if (tile.biome === BiomeType.HOT_SPRINGS) {
                return (
                  <MemoizedHotSpringAnimation
                    key={`hotspring-${tile.x}-${tile.y}`}
                    x={tile.x * TILE_SIZE_PX}
                    y={tile.y * TILE_SIZE_PX}
                    size={TILE_SIZE_PX}
                    seed={seed + tile.x * 61 + tile.y * 67}
                  />
                );
              } else if (tile.biome === BiomeType.ESTUARY) {
                return (
                  <EstuarySymbol
                    key={`estuary-anim-${tile.x}-${tile.y}`}
                    x={tile.x * TILE_SIZE_PX}
                    y={tile.y * TILE_SIZE_PX}
                    size={TILE_SIZE_PX}
                    seed={seed}
                    tileX={tile.x}
                    tileY={tile.y}
                  />
                );
              }
              return null;
            })}

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
                     transform={`translate(${renderX}, ${renderY}) scale(${TILE_SIZE_PX / 24})`}
                     className="">
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
                  className="transition-transform duration-300"
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
                    elements.push(<UrbanSymbol key={`urban-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} />);
                  } else if(tile.biome === BiomeType.MARKETPLACE) {
                    elements.push(<MarketplaceSymbol key={`marketplace-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} />);
                  } else if(tile.biome === BiomeType.PALACE) {
                    elements.push(<PalaceSymbol key={`palace-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tile={tile} date={formattedDate} zone={currentLocation} />);
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
                  } else if(tile.biome === BiomeType.ESTUARY && !shouldRenderAnimations) {
                    elements.push(<EstuarySymbol key={`estuary-${tile.x}-${tile.y}`} x={symbolX} y={symbolY} size={TILE_SIZE_PX} seed={tileSeed} tileX={tile.x} tileY={tile.y} />);
                  }

                  if (climate === ClimateType.ARID && (tile.biome === BiomeType.HILLS || tile.biome === BiomeType.DESERT || tile.biome === BiomeType.SCRUB)) {
                    if (noiseGenerators) {
                      const noiseValue = noiseGenerators.cactusPlacement.noise(tile.x * 0.1, tile.y * 0.1);
                      const cactusChance = tile.biome === BiomeType.DESERT ? 0.08 : 0.12;
                      if (noiseValue < cactusChance) {
                        elements.push(
                          <g key={`cactus-wrapper-${tile.x}-${tile.y}`} 
                             transform={`translate(${symbolX}, ${symbolY}) scale(${TILE_SIZE_PX / 24})`}
                             className="transition-transform duration-300">
                            <CactusSymbol seed={seed + tile.y * 19 + tile.x * 5} />
                          </g>
                        );
                      }
                    }
                  }

                  return elements;
                })}

                {/* Terrain Structures  */}
                {terrainStructures?.map(structure => {
                  const blueprint = STRUCTURE_BLUEPRINTS[structure.structureType];
                  if (!blueprint) return null;
                  const isPoi = ['holy_site', 'palace', 'ruin'].includes(structure.structureType);
                  if(isPoi) return null; // Don't render POI emojis, they have SVG symbols from biomes

                  const structX = structure.location[0] * TILE_SIZE_PX + TILE_SIZE_PX / 2;
                  const structY = structure.location[1] * TILE_SIZE_PX + TILE_SIZE_PX / 2;
                  const isRuined = structure.state === 'ruined';
                  return (
                    <g key={structure.id} className="transition-transform duration-200 ">
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
                
                {/* Enhanced snow effects */}
                {shouldRenderAnimations && tiles.flat().map((tile) => {
                  let shouldHaveSnow = false;
                  
                  if (tile.biome === BiomeType.SNOW || 
                      (tile.biome === BiomeType.HIGH_PEAK && climate === ClimateType.COLD)) {
                    shouldHaveSnow = true;
                  }
                  else if (tile.biome === BiomeType.TUNDRA) {
                    const snowChance = noiseGenerators ? noiseGenerators.ambientDetail.noise(tile.x * 0.3, tile.y * 0.3) : 0;
                    shouldHaveSnow = snowChance > 0.8;
                  }
                  
                  if (!shouldHaveSnow) return null;
                  
                  const symbolX = tile.x * TILE_SIZE_PX;
                  const symbolY = tile.y * TILE_SIZE_PX;
                  
                  return (
                    <MemoizedSnowEffect 
                      key={`snow-${tile.x}-${tile.y}`}
                      x={symbolX} 
                      y={symbolY} 
                      size={TILE_SIZE_PX} 
                      seed={seed + tile.x + tile.y} 
                    />
                  );
                })}
              </g>
            )}

            {/* Animals and NPCs layer  */}
            <g>
              {animals.map(animal => (
                <g key={animal.id} 
                   onClick={(e) => { e.stopPropagation(); onAnimalClick(animal); }} 
                   style={{cursor: 'pointer', pointerEvents: 'auto'}}
                   className="">
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
                   className={` ${selectedNpcId === npc.id ? 'animate-ff6-idle-bob' : ''}`}>
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
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Enhanced vignette effect with multiple layers */}
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
export default memo(MapDisplay);