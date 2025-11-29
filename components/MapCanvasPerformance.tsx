/**
 * MapCanvasPerformance - Optimized canvas rendering component
 * - Eliminates repeated NW corner "mini-islands" via endpoint taper + per-edge jitter
 * - Batched coastline halo (fast) with nicer blending
 * - Device-pixel-ratio aware drawing for crisp output
 * - Subtle pattern alpha jitter to avoid moiré/banding
 * - Edge tiles no longer treated as water
 * - Organic/scalloped shoreline + shallow-water overlay
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { MapData, Tile, BiomeType, ClimateType } from '../types';
import { TILE_SIZE_PX as TILE_SIZE_PX_CONST } from '../constants';
import { ValueNoise } from '../utils/noise';
import { getTileRenderColor } from '../utils/colorUtils';
import { useTilePatterns } from './TilePatterns';
import { isTransitionablePair } from '../utils/biomeTransitionUtils';

const TILE_SIZE_PX = TILE_SIZE_PX_CONST;

// ========== FEATURE TOGGLES ==========
/**
 * ALTITUDE SHADING: Adds subtle lighting based on elevation
 * Higher altitude = slightly brighter (more sun exposure)
 * Lower altitude = slightly darker (more shadow)
 * Set to FALSE to disable if it looks bad
 */
const ENABLE_ALTITUDE_SHADING = true;

/**
 * EDGE BLENDING: Smooths biome transitions by blending colors at boundaries
 * Only processes visible tiles (~150 tiles, 600 neighbor checks per frame)
 * Set to FALSE to disable if it impacts performance or looks bad
 */
const ENABLE_EDGE_BLENDING = true;
const EDGE_BLEND_STRENGTH = 0.20; // 20% blend with neighbors (subtle)

/** Edge perturbation controls (shoreline organics) */
const NOISE_SCALE_COASTLINE_PERTURB = 0.2;
const COASTLINE_PERTURB_AMOUNT = TILE_SIZE_PX * 0.25;
/** Adds subtle scalloping along water edges */
const SCALLOP_FREQ = 5.0;               // how many scallops per edge
const SCALLOP_AMPL = TILE_SIZE_PX * 0.05;

/** Shallow-water halo controls (drawn into water only; land covers inner half) */
const HALO_BASE_WIDTH = TILE_SIZE_PX * 0.4;   // starting width (px)
const HALO_STEPS = 4;                         // number of feathered strokes
const HALO_DECAY = 0.4;                       // alpha decay per step

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
    shallowTint: 'rgba(34, 197, 194, 0.39)',
    foam: 'rgba(237, 255, 255,0.3)',
    haloNear: 'rgba(94, 234, 212, 0.3)',
    haloFar: 'rgba(59, 130, 246, 0.15)',
  };

  if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
    p = {
      deep: '#1e40af',
      mid: '#1e3a8a',
      shallowTint: 'rgba(34, 211, 238, 0.45)',
      foam: 'rgba(237, 255, 255,0.35)',
      haloNear: 'rgba(45, 212, 191, 0.24)',
      haloFar: 'rgba(56, 189, 248, 0.05)',
    };
  } else if (climate === ClimateType.ARID) {
    p = {
      deep: '#1e3a8a',
      mid: '#172554',
      shallowTint: 'rgba(113, 254, 250, 0.22)',
      foam: 'rgba(237, 255, 255,0.19)',
      haloNear: 'rgba(56, 189, 248, 0.38)',
      haloFar: 'rgba(37, 99, 235, 0.15)',
    };
  } else if (climate === ClimateType.COLD) {
    p = {
      deep: '#1e3a8a',
      mid: '#172554',
      shallowTint: 'rgba(113, 254, 250, 0.4)',
      foam: 'rgba(200,220,240,0.41)',
      haloNear: 'rgba(148, 163, 184, 0.37)',
      haloFar: 'rgba(30, 58, 138, 0.05)',
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
  /** Hour of day (0-24) for dynamic lighting direction */
  timeOfDay?: number;
}

/** Small integer hash → [0,1) for stable per-tile jitter */
function hashToUnit(x: number, y: number, seed: number) {
  // 32-bit mix (x,y,seed)
  let h = (x | 0) * 374761393 + ((y | 0) ^ (seed | 0)) * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  // Convert to [0,1). >>>0 ensures unsigned
  return (h >>> 0) / 4294967296;
}

/**
 * Attempt to adjust color brightness based on altitude for subtle 3D effect
 * Uses smooth easing + dithering to eliminate visible banding on flat biomes
 * altitude: 0-1 (from tile data)
 * x, y: tile coordinates for stable dither pattern
 * returns: adjusted hex color
 */
function applyAltitudeShading(baseColor: string, altitude: number, x: number = 0, y: number = 0): string {
  if (!ENABLE_ALTITUDE_SHADING) return baseColor;

  // Parse hex color to RGB
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Smooth easing instead of linear - reduces visible contour lines
  // easeInOutCubic makes the transition gentler at extremes
  const eased = altitude < 0.5
    ? 4 * altitude * altitude * altitude
    : 1 - Math.pow(-2 * altitude + 2, 3) / 2;

  // Base altitude factor with smooth easing
  const baseFactor = 1 + ((eased - 0.5) * 0.2); // 0.9 to 1.1 range

  // Add subtle ordered dithering to break banding (Bayer-like pattern)
  // This creates imperceptible per-tile variation that smooths gradients
  const ditherMatrix = ((x & 1) + ((y & 1) << 1)) / 4; // 0, 0.25, 0.5, or 0.75
  const dither = (ditherMatrix - 0.375) * 0.015; // ±0.75% subtle variation
  const altitudeFactor = baseFactor + dither;

  // Apply factor with clamping to 0-255
  const newR = Math.min(255, Math.max(0, Math.round(r * altitudeFactor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * altitudeFactor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * altitudeFactor)));

  // Convert back to hex
  return '#' +
    newR.toString(16).padStart(2, '0') +
    newG.toString(16).padStart(2, '0') +
    newB.toString(16).padStart(2, '0');
}

/**
 * Calculates shadow offset based on time of day
 * Creates the illusion that the sun moves across the sky
 * Returns { offsetX, offsetY, opacity } for shadow rendering
 */
function calculateLightDirection(timeOfDay: number = 12): { offsetX: number; offsetY: number; opacity: number } {
  // Normalize to 0-24 range
  const hour = ((timeOfDay % 24) + 24) % 24;

  // Sun position: rises in east (6am), peaks at noon, sets in west (18pm)
  // Map 6-18 to angle 0-PI (sunrise to sunset)
  // Outside this range (night), use a fixed dim moonlight from above

  if (hour < 6 || hour > 18) {
    // Night: very subtle shadow from above (moonlight)
    return { offsetX: 0, offsetY: 0.8, opacity: 0.08 };
  }

  // Day: sun arc from east to west
  const dayProgress = (hour - 6) / 12; // 0 at 6am, 1 at 6pm
  const angle = dayProgress * Math.PI; // 0 to PI

  // Shadow falls opposite to sun direction
  // At sunrise (angle=0): sun in east, shadow falls west (positive X)
  // At noon (angle=PI/2): sun above, shadow falls south (positive Y)
  // At sunset (angle=PI): sun in west, shadow falls east (negative X)
  const distance = 1.5;
  const offsetX = Math.cos(angle) * distance;
  const offsetY = 0.8 + Math.sin(angle) * 0.6; // Always slightly down, more at noon

  // Shadow is strongest at noon, weaker at dawn/dusk
  const opacity = 0.1 + Math.sin(angle) * 0.08; // 0.1 to 0.18

  return { offsetX, offsetY, opacity };
}

/**
 * Blends tile color with neighboring biomes for smooth transitions
 * Only checks 4 cardinal neighbors (N, S, E, W) for performance
 * Returns blended color or original if no valid transitions
 */
function applyEdgeBlending(
  baseColor: string,
  tile: Tile,
  x: number,
  y: number,
  tiles: Tile[][],
  mapData: MapData,
  season?: 'spring' | 'summer' | 'fall' | 'winter'
): string {
  if (!ENABLE_EDGE_BLENDING) return baseColor;

  const currentBiome = tile.biome;
  const neighborColors: string[] = [];

  // Check 4 cardinal neighbors only (not diagonals for performance)
  const neighbors = [
    { dx: 0, dy: -1 }, // North
    { dx: 1, dy: 0 },  // East
    { dx: 0, dy: 1 },  // South
    { dx: -1, dy: 0 }  // West
  ];

  for (const { dx, dy } of neighbors) {
    const nx = x + dx;
    const ny = y + dy;

    // Check bounds
    if (ny >= 0 && ny < tiles.length && nx >= 0 && nx < tiles[0].length) {
      const neighborTile = tiles[ny][nx];

      // Only blend if biomes can transition together
      if (isTransitionablePair(currentBiome, neighborTile.biome)) {
        const neighborColor = getTileRenderColor(
          neighborTile,
          mapData.climate,
          mapData.seed,
          season,
          mapData.mapAreaName
        );
        neighborColors.push(neighborColor);
      }
    }
  }

  // No valid neighbors to blend with
  if (neighborColors.length === 0) return baseColor;

  // Parse base color
  const baseHex = baseColor.replace('#', '');
  let r = parseInt(baseHex.substr(0, 2), 16);
  let g = parseInt(baseHex.substr(2, 2), 16);
  let b = parseInt(baseHex.substr(4, 2), 16);

  // Blend with neighbor colors
  const blendAmount = EDGE_BLEND_STRENGTH / neighborColors.length;

  for (const neighborColor of neighborColors) {
    const neighborHex = neighborColor.replace('#', '');
    const nr = parseInt(neighborHex.substr(0, 2), 16);
    const ng = parseInt(neighborHex.substr(2, 2), 16);
    const nb = parseInt(neighborHex.substr(4, 2), 16);

    // Linear blend
    r = r * (1 - blendAmount) + nr * blendAmount;
    g = g * (1 - blendAmount) + ng * blendAmount;
    b = b * (1 - blendAmount) + nb * blendAmount;
  }

  // Convert back to hex
  return '#' +
    Math.round(r).toString(16).padStart(2, '0') +
    Math.round(g).toString(16).padStart(2, '0') +
    Math.round(b).toString(16).padStart(2, '0');
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

  // ---- Helpers for anti-corner-bulge + per-edge variation ----
  private static TAU = Math.PI * 2;

  /** 0 at endpoints, 1 at mid-edge; power>1 narrows the active mid */
  private endTaper(t: number, power = 1.25) {
    t = Math.max(0, Math.min(1, t));
    return Math.pow(Math.sin(Math.PI * t), power);
  }

  /** Tiny, stable, per-edge jitter so scallop phase/freq isn't aligned */
  private edgeJitter(noise: ValueNoise, x: number, y: number, edgeIdx: number) {
    const phase = noise.noise(
      (x + 0.5) * 0.37 + edgeIdx * 3.11,
      (y + 0.5) * 0.37 - edgeIdx * 2.71
    ) * MapCanvasRenderer.TAU;
    const freq  = 1 + 0.25 * noise.noise(
      (x + 18) * 0.2 + edgeIdx,
      (y - 11) * 0.2 - edgeIdx
    );
    return { phase, freq };
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas
      ? (canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false,
          powerPreference: 'high-performance',
        }) as CanvasRenderingContext2D | null)
      : null;

    // TESTING: Disabled backfaceVisibility to fix Safari blur issue
    // This was causing Safari to render the canvas with lower quality
    // if (this.canvas && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    //   this.canvas.style.backfaceVisibility = 'hidden';
    // }
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
    season?: 'spring' | 'summer' | 'fall' | 'winter',
    timeOfDay: number = 12
  ) {
    if (!this.canvas || !this.ctx || !this.shouldRender(mapData, canvasSize)) return;

    if (this.renderFrameId) cancelAnimationFrame(this.renderFrameId);

    this.renderFrameId = requestAnimationFrame(() => {
      this.performRender(mapData, canvasSize, patterns, isNight, playerX, playerY, disableSmoothing, season, timeOfDay);
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
    season?: 'spring' | 'summer' | 'fall' | 'winter',
    timeOfDay: number = 12
  ) {
    if (!this.canvas || !this.ctx) return;

    // Device-pixel-ratio scaling for crisp output
    const dpr = (window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.floor(canvasSize.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(canvasSize.height * dpr));
    this.canvas.style.width = `${canvasSize.width}px`;
    this.canvas.style.height = `${canvasSize.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Coordinates now in CSS px

    this.ctx.imageSmoothingEnabled = !disableSmoothing;
    if (!disableSmoothing && 'imageSmoothingQuality' in this.ctx) {
      this.ctx.imageSmoothingQuality = 'high';
    }

    this.ctx.globalCompositeOperation = 'source-over';

    const noise = {
      shoreline: new ValueNoise(mapData.seed + 300),
    };

    this.renderOceanBackground(mapData, canvasSize);
    this.renderShoals(mapData, canvasSize);
    this.renderCoastlineHalo(mapData, noise);     // batched + fast
    this.renderLandTiles(mapData, patterns, noise, season, canvasSize, timeOfDay);

    if (isNight && playerX !== undefined && playerY !== undefined) {
      this.renderPlayerCenteredVignette(playerX, playerY, canvasSize);
    }
  }

  private renderOceanBackground(mapData: MapData, canvasSize: { width: number; height: number }) {
    if (!this.ctx) return;
    const p = getOceanPalette(mapData.climate);

    // Keep beautiful blue ocean background everywhere
    this.ctx.fillStyle = p.deep;
    this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Mild depth gradient (CSS px coords after DPR transform)
    const depthGradient = this.ctx.createRadialGradient(
      canvasSize.width / 2,
      canvasSize.height / 2,
      0,
      canvasSize.width / 2,
      canvasSize.height / 2,
      Math.max(canvasSize.width, canvasSize.height) * 0.8
    );
    depthGradient.addColorStop(0, p.shallowTint);
    depthGradient.addColorStop(0.35, 'rgba(37, 99, 235, 0.26)');
    depthGradient.addColorStop(0.75, 'rgba(30, 58, 138, 0.10)');
    depthGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = depthGradient;
    this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }

  private renderShoals(mapData: MapData, canvasSize: { width: number; height: number }) {
    if (!this.ctx) return;

    // Simple LOD: skip obvious off-canvas tiles (coordinates are in map space starting at 0,0)
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        if (tile.biome !== BiomeType.SHOALS_TILE) continue;

        const tileX = x * TILE_SIZE_PX;
        const tileY = y * TILE_SIZE_PX;

        if (tileX > canvasSize.width || tileY > canvasSize.height || (tileX + TILE_SIZE_PX) < 0 || (tileY + TILE_SIZE_PX) < 0) {
          continue;
        }

        const g = this.ctx!.createRadialGradient(
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

        this.ctx!.fillStyle = g;
        this.ctx!.fillRect(
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
      const edgeIdx = dir === 'top' ? 0 : dir === 'right' ? 1 : dir === 'bottom' ? 2 : 3;
      const { phase, freq } = this.edgeJitter(noiseGenerators.shoreline, x, y, edgeIdx);

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;

        let bx = 0, by = 0, isH = false;
        if (dir === 'top')    { bx = baseX + size * t;        by = baseY;           isH = true; }
        if (dir === 'bottom') { bx = baseX + size * (1 - t);  by = baseY + size;    isH = true; }
        if (dir === 'right')  { bx = baseX + size;            by = baseY + size*t;  }
        if (dir === 'left')   { bx = baseX;                   by = baseY + size*(1 - t); }

        // canonical t for noise direction
        const tCanon = dir === 'bottom' || dir === 'left' ? 1 - t : t;

        // sample positions to keep noise continuous across tiles
        const nx = x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0);
        const ny = y + (dir === 'bottom' ? 1 : dir === 'top' ? -1 : 0);
        const sampleX = isH ? x + tCanon : Math.min(x, nx) + 1;
        const sampleY = isH ? Math.min(y, ny) + 1 : y + tCanon;

        let perturbNoise = noiseGenerators.shoreline.noise(
          (sampleX + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB,
          (sampleY + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB
        );

        // Fade perturbation at the ends so corners stay pinned
        const endT = this.endTaper(tCanon, 1.2);

        let perturb = perturbNoise * COASTLINE_PERTURB_AMOUNT * endT;

        // Edge-specific scallop with phase/freq jitter, also tapered at ends
        perturb += Math.sin(
          tCanon * Math.PI * SCALLOP_FREQ * freq + phase
        ) * SCALLOP_AMPL * endT;

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
    // Softer than 'lighter' and prevents additive blowout
    this.ctx.globalCompositeOperation = 'lighten';
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    let alpha = 0.95; // start subtle; decays per step
    for (let i = 0; i < HALO_STEPS; i++) {
      const w = HALO_BASE_WIDTH * (1 + i * 0.9);
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = pal.haloNear;
      this.ctx.lineWidth = w;
      this.ctx.stroke(coast);
      alpha *= HALO_DECAY;
    }

    // very thin foam highlight at the edge
    this.ctx.globalAlpha = 0.99;
    this.ctx.lineWidth = Math.max(1, TILE_SIZE_PX * 0.1);
    this.ctx.strokeStyle = pal.foam;
    this.ctx.stroke(coast);

    this.ctx.restore();
  }

  private renderLandTiles(
    mapData: MapData,
    patterns: any,
    noiseGenerators: any,
    season: 'spring' | 'summer' | 'fall' | 'winter' | undefined,
    canvasSize: { width: number; height: number },
    timeOfDay: number = 12
  ) {
    if (!this.ctx) return;

    // Calculate light direction once per frame (not per tile)
    const lightDir = calculateLightDirection(timeOfDay);

    const tileBatches = new Map<string, { tiles: Tile[]; color: string }>();

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        if (!tile.isLand) continue;
        const baseColor = getTileRenderColor(tile, mapData.climate, mapData.seed, season, mapData.mapAreaName);
        // Apply edge blending for smooth biome transitions (can be disabled via ENABLE_EDGE_BLENDING flag)
        const blendedColor = applyEdgeBlending(baseColor, tile, x, y, mapData.tiles, mapData, season);
        // Apply altitude shading with dithering for subtle 3D effect (can be disabled via ENABLE_ALTITUDE_SHADING flag)
        const color = applyAltitudeShading(blendedColor, tile.altitude, x, y);
        const key = `${tile.biome}-${color}`;
        if (!tileBatches.has(key)) tileBatches.set(key, { tiles: [], color });
        tileBatches.get(key)!.tiles.push(tile);
      }
    }

    this.ctx.save();
    tileBatches.forEach(({ tiles, color }) => {
      tiles.forEach((tile) => {
        const organicPath = this.generateOrganicLandPath(tile, mapData, noiseGenerators);

        // Cull obviously off-canvas polygons (cheap bbox test)
        const tileX = tile.x * TILE_SIZE_PX;
        const tileY = tile.y * TILE_SIZE_PX;
        if (tileX > canvasSize.width || tileY > canvasSize.height || (tileX + TILE_SIZE_PX) < 0 || (tileY + TILE_SIZE_PX) < 0) {
          return;
        }

        // LAND BACKGROUND RECTANGLES: Fill grid square with brown color to prevent blue bleed-through
        // This only affects land tiles - water areas keep their beautiful blue
        this.ctx!.fillStyle = '#bd9d6c'; // Light sandy brown color
        this.ctx!.fillRect(tileX, tileY, TILE_SIZE_PX, TILE_SIZE_PX);

        // FEATURE TOGGLE: Edge feathering to fix blue background bleed-through
        const ENABLE_EDGE_FEATHERING = true;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Edge feathering (glow effect to fill gaps between organic edges)
        if (ENABLE_EDGE_FEATHERING) {
          this.ctx!.save();

          if (isSafari) {
            // Safari: Skip glow effect entirely for performance
            // Just a simple thin stroke if needed
            this.ctx!.strokeStyle = color;
            this.ctx!.lineWidth = 0.5;
            this.ctx!.globalAlpha = 0.3;
            this.ctx!.stroke(organicPath);
            this.ctx!.globalAlpha = 1;
          } else {
            // Chrome/Firefox: Use shadow blur
            this.ctx!.shadowColor = color;
            this.ctx!.shadowBlur = 4;
            this.ctx!.shadowOffsetX = 0;
            this.ctx!.shadowOffsetY = 0;

          }

          this.ctx!.fillStyle = color;
          this.ctx!.fill(organicPath);
          this.ctx!.restore();
        }

        // Base fill with time-of-day aware shadows (NO shadows on Safari for performance)
        this.ctx!.save();
        if (!isSafari) {
          // Dynamic shadow direction based on sun position
          this.ctx!.shadowColor = `rgba(0,0,0,${lightDir.opacity})`;
          this.ctx!.shadowBlur = 2.5;
          this.ctx!.shadowOffsetX = lightDir.offsetX;
          this.ctx!.shadowOffsetY = lightDir.offsetY;
        }
        this.ctx!.fillStyle = color;
        this.ctx!.fill(organicPath);
        this.ctx!.restore();

        // Texture overlay with tiny jitter to avoid moiré/banding
        const terrainPattern = patterns.terrain.get(tile.biome);
        if (terrainPattern) {
          let patternOpacity = 0.25;
          if ([BiomeType.DESERT, BiomeType.GRASSLAND, BiomeType.BEACH, BiomeType.SCRUB].includes(tile.biome)) {
            patternOpacity = 0.45;
          } else if ([BiomeType.SNOW, BiomeType.TUNDRA, BiomeType.HILLS].includes(tile.biome)) {
            patternOpacity = 0.22;
          } else if ([BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.JUNGLE].includes(tile.biome)) {
            patternOpacity = 0.35;
          } else if ([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.VOLCANIC_ROCK].includes(tile.biome)) {
            patternOpacity = 0.4;
          }
          // ±0.02 jitter, seeded per tile
          const jitter = hashToUnit(tile.x, tile.y, mapData.seed) * 0.04 - 0.03;
          const finalAlpha = Math.max(0, Math.min(1, patternOpacity + jitter));
          this.ctx!.globalAlpha = finalAlpha;
          this.ctx!.fillStyle = terrainPattern;
          this.ctx!.fill(organicPath);
          this.ctx!.globalAlpha = 1;
        }

        // Ambient occlusion vignette (gentler)
        const g = this.ctx!.createRadialGradient(
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          TILE_SIZE_PX * 0.8,
          tileX + TILE_SIZE_PX / 2,
          tileY + TILE_SIZE_PX / 2,
          TILE_SIZE_PX * 0.94
        );
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.75, 'rgba(0,0,0,0.24)');
        g.addColorStop(1, 'rgba(0,0,0,0.31)'); // was 0.18
        this.ctx!.fillStyle = g;
        this.ctx!.fill(organicPath);
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

    // FEATURE TOGGLE: Enable/disable organic biome boundaries
    // Set to false to restore original hard rectangular boundaries between biomes
    const ENABLE_ORGANIC_BIOME_BOUNDARIES = true;

    // EXPANSION: Slightly expand organic shapes to better cover brown background
    const expansion = TILE_SIZE_PX * 0.05; // 8% expansion for better coverage
    const expandedTileX = tileX - expansion / 2;
    const expandedTileY = tileY - expansion / 2;
    const expandedSize = TILE_SIZE_PX + expansion;

    // Handle urban biomes (roads, plazas, parks) as hard rectangles
    if ([BiomeType.ROAD, BiomeType.PLAZA, BiomeType.PARK].includes(tile.biome)) {
      path.rect(tileX, tileY, TILE_SIZE_PX, TILE_SIZE_PX);
      return path;
    }

    const getNeighbor = (nx: number, ny: number): Tile | null =>
      nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height ? mapData.tiles[ny][nx] : null;

    path.moveTo(expandedTileX, expandedTileY); // start at expanded top-left

    const edges = [
      { x1: expandedTileX, y1: expandedTileY, x2: expandedTileX + expandedSize, y2: expandedTileY, nx: 0, ny: -1, edgeName: 'top' as const },
      { x1: expandedTileX + expandedSize, y1: expandedTileY, x2: expandedTileX + expandedSize, y2: expandedTileY + expandedSize, nx: 1, ny: 0, edgeName: 'right' as const },
      { x1: expandedTileX + expandedSize, y1: expandedTileY + expandedSize, x2: expandedTileX, y2: expandedTileY + expandedSize, nx: 0, ny: 1, edgeName: 'bottom' as const },
      { x1: expandedTileX, y1: expandedTileY + expandedSize, x2: expandedTileX, y2: expandedTileY, nx: -1, ny: 0, edgeName: 'left' as const },
    ];

    edges.forEach((edge) => {
      const neighbor = getNeighbor(x + edge.nx, y + edge.ny);
      // OOB is NOT water (edge fix)
      const neighborIsWater = neighbor ? !neighbor.isLand : false;

      // NEW: Check for different biome neighbors (organic biome boundaries)
      const neighborIsDifferentBiome = ENABLE_ORGANIC_BIOME_BOUNDARIES &&
        neighbor && neighbor.isLand && neighbor.biome !== tile.biome;

      // Use organic edge for water boundaries OR different biome boundaries
      const shouldUseOrganicEdge = neighborIsWater || neighborIsDifferentBiome;

      if (!shouldUseOrganicEdge) {
        path.lineTo(edge.x2, edge.y2);
      } else {
        const segments = 4;
        const edgeIdx = edge.edgeName === 'top' ? 0 : edge.edgeName === 'right' ? 1 : edge.edgeName === 'bottom' ? 2 : 3;
        const { phase, freq } = this.edgeJitter(noiseGenerators.shoreline, x, y, edgeIdx);

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

          // Multi-octave shoreline noise (fractal)
          let f = 0, amp = 0.9, fq = 1.5;
          for (let o = 0; o < 4; o++) {
            f += noiseGenerators.shoreline.noise(
              (noiseSampleX + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB * fq,
              (noiseSampleY + mapData.seed) * NOISE_SCALE_COASTLINE_PERTURB * fq
            ) * amp;
            amp *= 0.4; fq *= 2;
          }

          // Taper to zero at endpoints so corners are anchored
          const endT = this.endTaper(tCanon, 1.2);

          // Reduce perturbation for biome boundaries (subtler than coastlines)
          const perturbationScale = neighborIsWater ? 1.0 : 0.4; // 60% intensity for biome boundaries

          let perturb = f * COASTLINE_PERTURB_AMOUNT * endT * perturbationScale;

          // Per-edge phase/freq jitter (breaks "same NW nub")
          perturb += Math.sin(tCanon * Math.PI * SCALLOP_FREQ * freq + phase) * SCALLOP_AMPL * endT * perturbationScale;

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
    if (!this.ctx) return;

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
      timeOfDay = 12,
    },
    ref
  ) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref as React.MutableRefObject<HTMLCanvasElement | null>) || internalCanvasRef;
    const rendererRef = useRef<MapCanvasRenderer>(new MapCanvasRenderer());

    const patterns = useTilePatterns({ mapData, season });
    // Recompute patterns when seed or season changes (stable otherwise)
    const memoizedPatterns = useMemo(() => patterns, [mapData.seed, season]);

    // Quantize timeOfDay to 1-hour intervals to prevent excessive re-renders
    const quantizedTimeOfDay = Math.floor(timeOfDay);

    useEffect(() => {
      const renderer = rendererRef.current;
      const canvasElement = typeof canvasRef === 'function' ? null : canvasRef.current;
      renderer.setCanvas(canvasElement);

      if (mapData) {
        renderer.render(mapData, canvasSize, memoizedPatterns, isNight, playerX, playerY, disableSmoothing, season, quantizedTimeOfDay);
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
      quantizedTimeOfDay,
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
          imageRendering: /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            ? '-webkit-optimize-contrast'
            : (zoomLevel >= 3 ? 'pixelated' : 'auto'),
          WebkitImageRendering: '-webkit-optimize-contrast', // Safari-specific property
          filter:
            mapData.climate === ClimateType.TROPICAL ||
            mapData.climate === ClimateType.SEMITROPICAL ||
            mapData.climate === ClimateType.ARID
              ? 'contrast(1.01) saturate(1.02) brightness(1.00) hue-rotate(0deg)'
              : mapData.climate === ClimateType.COLD
              ? 'contrast(1) saturate(0.98) brightness(1.01) hue-rotate(0deg)'
              : 'contrast(1.0) saturate(1.0) brightness(1.0)',
          transition: 'filter 0.1s ease-out'
          // contain: 'strict' // Disabled - may cause Safari blur issues
          // willChange: 'transform', // Disabled - causes Safari to render at lower resolution
        }}
      />
    );
  }
);

MapCanvasPerformance.displayName = 'MapCanvasPerformance';

export default MapCanvasPerformance;
