/**
 * MapCanvasPerformance - Optimized canvas rendering component
 * This fixes the critical performance bottleneck causing UI lag during map movement
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { MapData, Tile, BiomeType, ClimateType } from '../types';
import { TILE_SIZE_PX as TILE_SIZE_PX_CONST } from '../constants';
import { ValueNoise } from '../utils/noise';
import { getTileRenderColor } from '../utils/colorUtils';
import { useTilePatterns } from './TilePatterns';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;
const NOISE_SCALE_COASTLINE_PERTURB = 0.07; 
const COASTLINE_PERTURB_AMOUNT = TILE_SIZE_PX * 0.25;

interface MapCanvasProps {
  mapData: MapData;
  canvasSize: { width: number; height: number };
  panX: number;
  panY: number;
  zoomLevel: number;
  nightIntensity?: number;
  colorShift?: { r: number; g: number; b: number };
  disableSmoothing?: boolean;
}

// Optimized renderer class to prevent unnecessary re-renders
class MapCanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastMapSeed: number | null = null;
  private lastCanvasWidth: number = 0;
  private lastCanvasHeight: number = 0;
  private renderFrameId: number | null = null;

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
      powerPreference: 'high-performance'
    }) : null;
    
    // Safari-specific optimizations
    if (this.canvas && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      // Minimal Safari optimization
      this.canvas.style.backfaceVisibility = 'hidden';
    }
  }

  shouldRender(mapData: MapData, canvasSize: { width: number; height: number }): boolean {
    return (
      this.lastMapSeed !== mapData.seed ||
      this.lastCanvasWidth !== canvasSize.width ||
      this.lastCanvasHeight !== canvasSize.height
    );
  }

  render(mapData: MapData, canvasSize: { width: number; height: number }, patterns: any, nightIntensity: number = 0, colorShift: { r: number; g: number; b: number } = { r: 1, g: 1, b: 1 }, disableSmoothing: boolean = false) {
    if (!this.canvas || !this.ctx || !this.shouldRender(mapData, canvasSize)) return;

    // Cancel any pending render
    if (this.renderFrameId) {
      cancelAnimationFrame(this.renderFrameId);
    }

    this.renderFrameId = requestAnimationFrame(() => {
      this.performRender(mapData, canvasSize, patterns, nightIntensity, colorShift, disableSmoothing);
      this.lastMapSeed = mapData.seed;
      this.lastCanvasWidth = canvasSize.width;
      this.lastCanvasHeight = canvasSize.height;
      this.renderFrameId = null;
    });
  }

  private performRender(mapData: MapData, canvasSize: { width: number; height: number }, patterns: any, nightIntensity: number = 0, colorShift: { r: number; g: number; b: number } = { r: 1, g: 1, b: 1 }, disableSmoothing: boolean = false) {
    if (!this.canvas || !this.ctx) return;

    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    // Configure image smoothing based on debug settings
    this.ctx.imageSmoothingEnabled = !disableSmoothing;
    if (!disableSmoothing && 'imageSmoothingQuality' in this.ctx) {
      this.ctx.imageSmoothingQuality = 'high';
    }
    
    // Safari performance optimizations
    this.ctx.globalCompositeOperation = 'source-over';

    // Create noise generators (cached per map seed)
    const noiseGenerators = {
      shoreline: new ValueNoise(mapData.seed + 300),
      shoalBlend: new ValueNoise(mapData.seed + 400)
    };

    this.renderOceanBackground(mapData);
    this.renderShoals(mapData, noiseGenerators);
    this.renderLandTiles(mapData, patterns, noiseGenerators);
    
    // Apply night darkening overlay only to terrain
    if (nightIntensity > 0) {
      this.renderNightOverlay(nightIntensity, colorShift);
    }
  }

  private renderOceanBackground(mapData: MapData) {
    if (!this.canvas || !this.ctx) return;

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
    this.ctx.fillStyle = deepOceanColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add depth gradient
    const depthGradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) * 0.8
    );
    depthGradient.addColorStop(0, shallowTint);
    depthGradient.addColorStop(0.3, 'rgba(37, 99, 235, 0.18)');
    depthGradient.addColorStop(0.7, 'rgba(30, 58, 138, 0.12)');
    depthGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = depthGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderShoals(mapData: MapData, noiseGenerators: any) {
    if (!this.ctx) return;

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        if (tile.biome === BiomeType.SHOALS_TILE) {
          const tileX = x * TILE_SIZE_PX;
          const tileY = y * TILE_SIZE_PX;
          
          const gradient = this.ctx.createRadialGradient(
            tileX + TILE_SIZE_PX / 2,
            tileY + TILE_SIZE_PX / 2,
            0,
            tileX + TILE_SIZE_PX / 2,
            tileY + TILE_SIZE_PX / 2,
            TILE_SIZE_PX * 0.8
          );
          
          gradient.addColorStop(0, 'rgba(94, 234, 212, 0.3)');
          gradient.addColorStop(0.5, 'rgba(94, 234, 212, 0.15)');
          gradient.addColorStop(0.8, 'rgba(94, 234, 212, 0.05)');
          gradient.addColorStop(1, 'transparent');
          
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(tileX - TILE_SIZE_PX * 0.5, tileY - TILE_SIZE_PX * 0.5, TILE_SIZE_PX * 2, TILE_SIZE_PX * 2);
        }
      }
    }
  }

  private renderLandTiles(mapData: MapData, patterns: any, noiseGenerators: any) {
    if (!this.ctx) return;

    // Batch similar tiles for rendering
    const tileBatches = new Map<string, { tiles: Tile[], color: string }>();
    
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

    // Render tiles with optimized paths
    this.ctx.save();
    tileBatches.forEach(({ tiles, color }) => {
      this.ctx!.fillStyle = color;
      tiles.forEach(tile => {
        const organicPath = this.generateOrganicLandPath(tile, mapData, noiseGenerators);
        this.ctx!.fill(organicPath);
      });
    });
    this.ctx.restore();
  }

  private generateOrganicLandPath(tile: Tile, mapData: MapData, noiseGenerators: any): Path2D {
    const path = new Path2D();
    const { x, y } = tile;
    const tileX_base = x * TILE_SIZE_PX;
    const tileY_base = y * TILE_SIZE_PX;

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
      { x1: tileX_base, y1: tileY_base, x2: tileX_base + TILE_SIZE_PX, y2: tileY_base, nx: 0, ny: -1, edgeName: 'top' },
      { x1: tileX_base + TILE_SIZE_PX, y1: tileY_base, x2: tileX_base + TILE_SIZE_PX, y2: tileY_base + TILE_SIZE_PX, nx: 1, ny: 0, edgeName: 'right' },
      { x1: tileX_base + TILE_SIZE_PX, y1: tileY_base + TILE_SIZE_PX, x2: tileX_base, y2: tileY_base + TILE_SIZE_PX, nx: 0, ny: 1, edgeName: 'bottom' },
      { x1: tileX_base, y1: tileY_base + TILE_SIZE_PX, x2: tileX_base, y2: tileY_base, nx: -1, ny: 0, edgeName: 'left' }
    ];

    path.moveTo(edges[0].x1, edges[0].y1);

    edges.forEach(edge => {
      const neighbor = getNeighbor(x + edge.nx, y + edge.ny);
      const neighborIsWater = !neighbor || !neighbor.isLand;

      if (!neighborIsWater) {
        path.lineTo(edge.x2, edge.y2);
      } else {
        const segments = 4; // Reduced for performance
        
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

          path.lineTo(perturbedX, perturbedY);
        }
      }
    });
    
    path.closePath();
    return path;
  }

  private renderNightOverlay(nightIntensity: number, colorShift: { r: number; g: number; b: number } = { r: 1, g: 1, b: 1 }) {
    if (!this.canvas || !this.ctx) return;

    // Apply darkening effect
    this.ctx.save();
    
    // First apply color shift using multiply blend
    this.ctx.globalCompositeOperation = 'multiply';
    
    // Calculate darkness level (inverse of brightness)
    const darkness = 1 - (1 - nightIntensity * 0.85); // Max darkness is 85%
    
    // Apply color-shifted darkening
    const r = Math.floor(255 * (1 - darkness * (1 - colorShift.r)));
    const g = Math.floor(255 * (1 - darkness * (1 - colorShift.g)));
    const b = Math.floor(255 * (1 - darkness * (1 - colorShift.b)));
    
    this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle atmospheric gradient for depth
    if (nightIntensity > 0.2) {
      this.ctx.globalCompositeOperation = 'multiply';
      const gradient = this.ctx.createRadialGradient(
        this.canvas.width / 2, 
        this.canvas.height / 2, 
        0,
        this.canvas.width / 2, 
        this.canvas.height / 2, 
        Math.max(this.canvas.width, this.canvas.height) * 0.8
      );
      
      // Subtle vignette effect
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, `rgba(240, 240, 255, ${1 - nightIntensity * 0.1})`);
      gradient.addColorStop(1, `rgba(180, 190, 220, ${1 - nightIntensity * 0.3})`);
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    this.ctx.restore();
  }

  cleanup() {
    if (this.renderFrameId) {
      cancelAnimationFrame(this.renderFrameId);
      this.renderFrameId = null;
    }
  }
}

export const MapCanvasPerformance = React.forwardRef<HTMLCanvasElement, MapCanvasProps>(({ 
  mapData, 
  canvasSize, 
  panX, 
  panY, 
  zoomLevel,
  nightIntensity = 0,
  colorShift = { r: 1, g: 1, b: 1 },
  disableSmoothing = false
}, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref as React.MutableRefObject<HTMLCanvasElement | null>) || internalCanvasRef;
  const rendererRef = useRef<MapCanvasRenderer>(new MapCanvasRenderer());
  
  // Memoize patterns to prevent unnecessary re-creation
  const patterns = useTilePatterns({ mapData });
  const memoizedPatterns = useMemo(() => patterns, [mapData.seed]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const canvasElement = typeof canvasRef === 'function' ? null : canvasRef.current;
    renderer.setCanvas(canvasElement);

    if (mapData) {
      renderer.render(mapData, canvasSize, memoizedPatterns, nightIntensity, colorShift, disableSmoothing);
    }

    return () => renderer.cleanup();
  }, [mapData.seed, canvasSize.width, canvasSize.height, memoizedPatterns, nightIntensity, colorShift.r, colorShift.g, colorShift.b, disableSmoothing]);

  return (
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
          ? 'contrast(1.02) saturate(1.04) brightness(1.02) hue-rotate(-2deg)'
          : mapData.climate === ClimateType.COLD 
          ? 'contrast(1.01) saturate(0.99) brightness(1.1) hue-rotate(-12deg)'
          : 'contrast(1.0) saturate(1.0) brightness(1.0)',
        transition: 'filter 0.2s ease-out',
        willChange: 'transform'
      }}
    />
  );
});

MapCanvasPerformance.displayName = 'MapCanvasPerformance';

export default MapCanvasPerformance;