/**
 * MapCanvasPerformance - Optimized canvas rendering component
 * - Batched coastline halo (fast)
 * - Edge tiles no longer treated as water
 * - Organic/scalloped shoreline + subtle shallow-water overlay
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { MapData, Tile, BiomeType, ClimateType } from '../types';
import { TILE_SIZE_PX as TILE_SIZE_PX_CONST } from '../constants';
import { ValueNoise } from '../utils/noise';
import { getTileRenderColor } from '../utils/colorUtils';
import { useTilePatterns } from './TilePatterns';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;

/** Edge perturbation controls (shoreline organics) */
const NOISE_SCALE_COASTLINE_PERTURB = 0.2;
const COASTLINE_PERTURB_AMOUNT = TILE_SIZE_PX * 0.25;
/** Adds subtle scalloping along water edges */
const SCALLOP_FREQ = 5.0;               // how many scallops per edge
const SCALLOP_AMPL = TILE_SIZE_PX * 0.04;

/** Shallow-water halo controls (drawn into water only; land covers inner half) */
const HALO_BASE_WIDTH = TILE_SIZE_PX * 0.6;   // starting width (px)
const HALO_STEPS = 3;                         // number of feathered strokes
const HALO_DECAY = 0.4;                      // alpha decay per step

type OceanPalette = {
  deep: string;
  mid: string;
  shallowTint: string;
  foam: string;
  haloNear: string;
  haloFar: string;
};

function getOceanPalette(climate: ClimateType): OceanPalette {
  // Temperate default (kept subtle)
  let p: OceanPalette = {
    deep: '#2563eb',
    mid: '#1e40af',
    shallowTint: 'rgba(34, 197, 194, 0.18)',
    foam: 'rgba(255,255,255,0.10)',
    haloNear: 'rgba(94, 234, 212, 0.18)',
    haloFar: 'rgba(59, 130, 246, 0.00)',
  };

  if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
    p = {
      deep: '#1e40af',
      mid: '#1e3a8a',
      shallowTint: 'rgba(34, 211, 238, 0.25)',
      foam: 'rgba(255,255,255,0.10)',
      haloNear: 'rgba(45, 212, 191, 0.22)',
      haloFar: 'rgba(56, 189, 248, 0.00)',
    };
  } else if (climate === ClimateType.ARID) {
    p = {
      deep: '#1e3a8a',
      mid: '#172554',
      shallowTint: 'rgba(14, 165, 233, 0.22)',
      foam: 'rgba(255,255,255,0.09)',
      haloNear: 'rgba(56, 189, 248, 0.18)',
      haloFar: 'rgba(37, 99, 235, 0.00)',
    };
  } else if (climate === ClimateType.COLD) {
    p = {
      deep: '#1e3a8a',
      mid: '#172554',
      shallowTint: 'rgba(148, 163, 184, 0.20)',
      foam: 'rgba(200,220,240,0.10)',
      haloNear: 'rgba(148, 163, 184, 0.17)',
      haloFar: 'rgba(30, 58, 138, 0.00)',
    };
  }
  return p;
}

interface MapCanvasProps {
  mapData: MapData;
  canvasSize: { width: number; height: number };
  panX: number;
  panY: number;
  zoomLevel: number;
  isNight?: boolean;
  playerX?: number;
  playerY?: number;
  disableSmoothing?: boolean;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

class MapCanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastMapSeed: number | null = null;
  private lastCanvasWidth = 0;
  private lastCanvasHeight = 0;
  private renderFrameId: number | null = null;

  // Optional caching for the batched coastline path
  private cachedCoastPath: Path2D | null = null;
  private cachedCoastSeed: number | null = null;

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas
      ? canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false,
          powerPreference: 'high-performance',
        })
      : null;

    if (this.canvas && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      this.canvas.style.backfaceVisibility = 'hidden';
    }
  }

  shouldRender(mapData: MapData, canvasSize: { width: number; height: number }) {
    return (
      this.lastMapSeed !== mapData.seed ||
      this.lastCanvasWidth !== canvasSize.width ||
      this.lastCanvasHeight !== canvasSize.height
    );
  }

  render(
    mapData: MapData,
    canvasSize: { width: number; height: number },
    patterns: any,
    isNight = false,
    playerX?: number,
    playerY?: number,
    disableSmoothing = false,
    season?: 'spring' | 'summer' | 'fall' | 'winter'
  ) {
    if (!this.canvas || !this.ctx || !this.shouldRender(mapData, canvasSize)) return;

    if (this.renderFrameId) cancelAnimationFrame(this.renderFrameId);

    this.renderFrameId = requestAnimationFrame(() => {
      this.performRender(mapData, canvasSize, patterns, isNight, playerX, playerY, disableSmoothing, season);
      this.lastMapSeed = mapData.seed;
      this.lastCanvasWidth = canvasSize.width;
      this.lastCanvasHeight = canvasSize.height;
      this.renderFrameId = null;
    });
  }

  private performRender(
    mapData: MapData,
    canvasSize: { width: number; height: number },
    patterns: any,
    isNight = false,
    playerX?: number,
    playerY?: number,
    disableSmoothing = false,
    season?: 'spring' | 'summer' | 'fall' | 'winter'
  ) {
    if (!this.canvas || !this.ctx) return;

    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    this.ctx.imageSmoothingEnabled = !disableSmoothing;
    if (!disableSmoothing && 'imageSmoothingQuality' in this.ctx) {
      this.ctx.imageSmoothingQuality = 'high';
    }

    this.ctx.globalCompositeOperation = 'source-over';

    const noise = {
      shoreline: new ValueNoise(mapData.seed + 300),
    };

    this.renderOceanBackground(mapData);
    this.renderShoals(mapData);
    this.renderCoastlineHalo(mapData, noise);     // batched + fast
    this.renderLandTiles(mapData, patterns, noise, season);

    if (isNight && playerX !== undefined && playerY !== undefined) {
      this.renderPlayerCenteredVignette(playerX, playerY, canvasSize);
    }
  }

  private renderOceanBackground(mapData: MapData) {
    if (!this.canvas || !this.ctx) return;
    const p = getOceanPalette(mapData.climate);

    this.ctx.fillStyle = p.deep;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const depthGradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) * 0.8
    );
    depthGradient.addColorStop(0, p.shallowTint);
    depthGradient.addColorStop(0.35, 'rgba(37, 99, 235, 0.16)');
    depthGradient.addColorStop(0.75, 'rgba(30, 58, 138, 0.10)');
    depthGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = depthGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderShoals(mapData: MapData) {
    if (!this.ctx) return;

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        if (tile.biome !== BiomeType.SHOALS_TILE) continue;

        const tileX = x * TILE_SIZE_PX;
        const tileY = y * TILE_SIZE_PX;
        const g = this.ctx.createRadialGradient(
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          0,
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          TILE_SIZE_PX * 0.8
        );
        g.addColorStop(0, 'rgba(94, 234, 212, 0.25)');
        g.addColorStop(0.55, 'rgba(94, 234, 212, 0.12)');
        g.addColorStop(0.85, 'rgba(94, 234, 212, 0.04)');
        g.addColorStop(1, 'transparent');

        this.ctx.fillStyle = g;
        this.ctx.fillRect(
          tileX - TILE_SIZE_PX * 0.5,
          tileY - TILE_SIZE_PX * 0.5,
          TILE_SIZE_PX * 2,
          TILE_SIZE_PX * 2
        );
      }
    }
  }

  /** Build a single Path2D containing *only* coastline segments (fast to stroke). */
  private buildCoastEdgesPath(mapData: MapData, noiseGenerators: any): Path2D {
    const p = new Path2D();
    const size = TILE_SIZE_PX;

    // OOB is **NOT** water (fixes border glow)
    const isWater = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < mapData.width && y < mapData.height
        ? !mapData.tiles[y][x].isLand
        : false;

    const addEdge = (x: number, y: number, dir: 'top' | 'right' | 'bottom' | 'left') => {
      const baseX = x * size,
        baseY = y * size;

      const segments = 4; // enough for smoothness but cheap
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;

        let bx = 0,
          by = 0,
          isH = false;
        if (dir === 'top') {
          bx = baseX + size * t;
          by = baseY;
          isH = true;
        }
        if (dir === 'bottom') {
          bx = baseX + size * (1 - t);
          by = baseY + size;
          isH = true;
        }
        if (dir === 'right') {
          bx = baseX + size;
          by = baseY + size * t;
        }
        if (dir === 'left') {
          bx = baseX;
          by = baseY + size * (1 - t);
        }

        // canonical t for noise direction
        const tCanon = dir === 'bottom' || dir === 'left' ? 1 - t : t;

        // sample positions to keep noise continuous across tiles
        const nx = x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
        const ny = y + (dir === 'bottom' ? 1 : dir === 'top' ? -1 : 0);
        const sampleX = isH ? x + tCanon : Math.min(x, nx) + 1;
        const sampleY = isH ? Math.min(y, ny) + 1 : y + tCanon;

        let perturb =
          noiseGenerators.shoreline.noise(
            (sampleX + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB,
            (sampleY + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB
          ) * COASTLINE_PERTURB_AMOUNT;

        // small scallop perpendicular to edge
        perturb += Math.sin(tCanon * Math.PI * SCALLOP_FREQ + (x + y) * 0.4) * SCALLOP_AMPL;

        const px = isH ? bx : bx + perturb;
        const py = isH ? by + perturb : by;

        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
    };

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const t = mapData.tiles[y][x];
        if (!t.isLand) continue;

        if (isWater(x, y - 1)) addEdge(x, y, 'top');
        if (isWater(x + 1, y)) addEdge(x, y, 'right');
        if (isWater(x, y + 1)) addEdge(x, y, 'bottom');
        if (isWater(x - 1, y)) addEdge(x, y, 'left');
      }
    }

    return p;
  }

  /** Subtle batched halo following the true coastline. */
  private renderCoastlineHalo(mapData: MapData, noiseGenerators: any) {
    if (!this.ctx) return;
    const pal = getOceanPalette(mapData.climate);

    // Cache per map seed (rebuild only when seed changes)
    if (this.cachedCoastSeed !== mapData.seed || !this.cachedCoastPath) {
      this.cachedCoastPath = this.buildCoastEdgesPath(mapData, noiseGenerators);
      this.cachedCoastSeed = mapData.seed;
    }
    const coast = this.cachedCoastPath!;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter'; // fastest & subtle
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    let alpha = 0.70; // start subtle; decays per step
    for (let i = 0; i < HALO_STEPS; i++) {
      const w = HALO_BASE_WIDTH * (1 + i * 0.8);
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = pal.haloNear;
      this.ctx.lineWidth = w;
      this.ctx.stroke(coast);
      alpha *= HALO_DECAY;
    }

    // very thin foam highlight at the edge
    this.ctx.globalAlpha = 0.9;
    this.ctx.lineWidth = Math.max(1, TILE_SIZE_PX * 0.2);
    this.ctx.strokeStyle = pal.foam;
    this.ctx.stroke(coast);

    this.ctx.restore();
  }

  private renderLandTiles(
    mapData: MapData,
    patterns: any,
    noiseGenerators: any,
    season?: 'spring' | 'summer' | 'fall' | 'winter'
  ) {
    if (!this.ctx) return;

    const tileBatches = new Map<string, { tiles: Tile[]; color: string }>();

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        if (!tile.isLand) continue;
        const color = getTileRenderColor(tile, mapData.climate, mapData.seed, season, mapData.mapAreaName);
        const key = `${tile.biome}-${color}`;
        if (!tileBatches.has(key)) tileBatches.set(key, { tiles: [], color });
        tileBatches.get(key)!.tiles.push(tile);
      }
    }

    this.ctx.save();
    tileBatches.forEach(({ tiles, color }) => {
      tiles.forEach((tile) => {
        const organicPath = this.generateOrganicLandPath(tile, mapData, noiseGenerators);

        // Base fill + subtle shadow
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0,0,0,0.25)';
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        this.ctx.shadowBlur = isSafari ? 1.5 : 2.5;
        this.ctx.shadowOffsetX = 1.2;
        this.ctx.shadowOffsetY = 1.2;
        this.ctx.fillStyle = color;
        this.ctx.fill(organicPath);
        this.ctx.restore();

        // Texture overlay
        const terrainPattern = patterns.terrain.get(tile.biome);
        if (terrainPattern) {
          let patternOpacity = 0.12;
          if ([BiomeType.DESERT, BiomeType.GRASSLAND, BiomeType.BEACH, BiomeType.SCRUB].includes(tile.biome)) {
            patternOpacity = 0.42;
          } else if ([BiomeType.SNOW, BiomeType.TUNDRA, BiomeType.HILLS].includes(tile.biome)) {
            patternOpacity = 0.32;
          } else if ([BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.JUNGLE].includes(tile.biome)) {
            patternOpacity = 0.25;
          } else if ([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.VOLCANIC_ROCK].includes(tile.biome)) {
            patternOpacity = 0.35;
          }
          this.ctx.globalAlpha = patternOpacity;
          this.ctx.fillStyle = terrainPattern;
          this.ctx.fill(organicPath);
          this.ctx.globalAlpha = 1.0;
        }

        // Ambient occlusion vignette
        const tileX = tile.x * TILE_SIZE_PX;
        const tileY = tile.y * TILE_SIZE_PX;
        const g = this.ctx.createRadialGradient(
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          TILE_SIZE_PX * 0.2,
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          TILE_SIZE_PX * 0.85
        );
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.75, 'rgba(0,0,0,0.01)');
        g.addColorStop(1, 'rgba(0,0,0,0.18)');
        this.ctx.fillStyle = g;
        this.ctx.fill(organicPath);
      });
    });
    this.ctx.restore();
  }

  /** Organic polygon for a land tile, with water-edge perturbation. */
  private generateOrganicLandPath(tile: Tile, mapData: MapData, noiseGenerators: any): Path2D {
    const path = new Path2D();
    const { x, y } = tile;
    const tileX = x * TILE_SIZE_PX;
    const tileY = y * TILE_SIZE_PX;

    if ([BiomeType.ROAD, BiomeType.PLAZA, BiomeType.PARK].includes(tile.biome)) {
      path.rect(tileX, tileY, TILE_SIZE_PX, TILE_SIZE_PX);
      return path;
    }

    const getNeighbor = (nx: number, ny: number): Tile | null =>
      nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height ? mapData.tiles[ny][nx] : null;

    const getFractalNoise = (px: number, py: number) => {
      let value = 0;
      let amplitude = 0.9;
      let frequency = 1.5;
      for (let i = 0; i < 3; i++) {
        value += noiseGenerators.shoreline.noise(px * frequency, py * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      return value;
    };

    const edges = [
      { x1: tileX, y1: tileY, x2: tileX + TILE_SIZE_PX, y2: tileY, nx: 0, ny: -1, edgeName: 'top' },
      { x1: tileX + TILE_SIZE_PX, y1: tileY, x2: tileX + TILE_SIZE_PX, y2: tileY + TILE_SIZE_PX, nx: 1, ny: 0, edgeName: 'right' },
      { x1: tileX + TILE_SIZE_PX, y1: tileY + TILE_SIZE_PX, x2: tileX, y2: tileY + TILE_SIZE_PX, nx: 0, ny: 1, edgeName: 'bottom' },
      { x1: tileX, y1: tileY + TILE_SIZE_PX, x2: tileX, y2: tileY, nx: -1, ny: 0, edgeName: 'left' },
    ];

    path.moveTo(edges[0].x1, edges[0].y1);

    edges.forEach((edge) => {
      const neighbor = getNeighbor(x + edge.nx, y + edge.ny);
      // OOB is NOT water (edge fix)
      const neighborIsWater = neighbor ? !neighbor.isLand : false;

      if (!neighborIsWater) {
        path.lineTo(edge.x2, edge.y2);
      } else {
        const segments = 4;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const baseX = edge.x1 + (edge.x2 - edge.x1) * t;
          const baseY = edge.y1 + (edge.y2 - edge.y1) * t;

          const isH = edge.y1 === edge.y2;

          let tCanon = t;
          if (edge.edgeName === 'bottom' || edge.edgeName === 'left') tCanon = 1 - t;

          let noiseSampleX: number, noiseSampleY: number;
          if (isH) {
            const ny = y + edge.ny;
            noiseSampleX = x + tCanon;
            noiseSampleY = Math.min(y, ny) + 1;
          } else {
            const nx = x + edge.nx;
            noiseSampleX = Math.min(x, nx) + 1;
            noiseSampleY = y + tCanon;
          }

          let perturb =
            getFractalNoise(
              (noiseSampleX + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB,
              (noiseSampleY + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB
            ) * COASTLINE_PERTURB_AMOUNT;

          perturb += Math.sin(tCanon * Math.PI * SCALLOP_FREQ + (x + y) * 0.4) * SCALLOP_AMPL;

          const px = isH ? baseX : baseX + perturb;
          const py = isH ? baseY + perturb : baseY;

          path.lineTo(px, py);
        }
      }
    });

    path.closePath();
    return path;
  }

  private renderPlayerCenteredVignette(
    playerX: number,
    playerY: number,
    canvasSize: { width: number; height: number }
  ) {
    if (!this.canvas || !this.ctx) return;

    this.ctx.save();

    const cx = playerX * TILE_SIZE_PX;
    const cy = playerY * TILE_SIZE_PX;
    const brightRadius = TILE_SIZE_PX * 10;
    const maxDarkRadius = TILE_SIZE_PX * 20;

    const gradient = this.ctx.createRadialGradient(cx, cy, brightRadius, cx, cy, maxDarkRadius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.75, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(0.85, 'rgba(0,0,0,0.35)');
    gradient.addColorStop(0.95, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');

    this.ctx.globalCompositeOperation = 'source-atop';
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    this.ctx.restore();
  }

  cleanup() {
    if (this.renderFrameId) {
      cancelAnimationFrame(this.renderFrameId);
      this.renderFrameId = null;
    }
  }
}

export const MapCanvasPerformance = React.forwardRef<HTMLCanvasElement, MapCanvasProps>(
  (
    {
      mapData,
      canvasSize,
      panX,
      panY,
      zoomLevel,
      isNight = false,
      playerX,
      playerY,
      disableSmoothing = false,
      season,
    },
    ref
  ) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref as React.MutableRefObject<HTMLCanvasElement | null>) || internalCanvasRef;
    const rendererRef = useRef<MapCanvasRenderer>(new MapCanvasRenderer());

    const patterns = useTilePatterns({ mapData });
    const memoizedPatterns = useMemo(() => patterns, [mapData.seed]);

    useEffect(() => {
      const renderer = rendererRef.current;
      const canvasElement = typeof canvasRef === 'function' ? null : canvasRef.current;
      renderer.setCanvas(canvasElement);

      if (mapData) {
        renderer.render(mapData, canvasSize, memoizedPatterns, isNight, playerX, playerY, disableSmoothing, season);
      }

      return () => renderer.cleanup();
    }, [
      mapData.seed,
      canvasSize.width,
      canvasSize.height,
      memoizedPatterns,
      isNight,
      playerX,
      playerY,
      disableSmoothing,
      season,
    ]);

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
          filter:
            mapData.climate === ClimateType.TROPICAL ||
            mapData.climate === ClimateType.SEMITROPICAL ||
            mapData.climate === ClimateType.ARID
              ? 'contrast(1.00) saturate(1.01) brightness(1.00) hue-rotate(-0deg)'
              : mapData.climate === ClimateType.COLD
              ? 'contrast(1) saturate(1) brightness(1) hue-rotate(-0deg)'
              : 'contrast(1.0) saturate(1.0) brightness(1.0)',
          transition: 'filter 0.1s ease-out',
          willChange: 'transform',
        }}
      />
    );
  }
);

MapCanvasPerformance.displayName = 'MapCanvasPerformance';

export default MapCanvasPerformance;