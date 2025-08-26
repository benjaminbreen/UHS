/**
 * generation/standardMap/features/StreamGenerator.ts
 * Realistic small streams that join the river network.
 * - Distance-to-water map (BFS)
 * - Flow field (D8) + accumulation
 * - A* with closed set + anti-reversal (no lassos)
 * - Loop pruning
 * - Oxbow meanders via arclength noise (slope/accum aware)
 * - Confluence snapping
 * - ENSURED MOUTH CONNECTION: extend last segment into nearest water/sink
 * - OPAQUE CORE to bridge joins (lighter color, fully opaque)
 * - SEAMLESS JOINS: trim rim/shadow/highlight before confluences (no dark borders)
 */

import {
  Tile,
  MapData,
  Point,
  BiomeType,
  PathType,
  ClimateType,
  MapArchetype,
} from '../../../types/index';
import {
  MAP_WIDTH_TILES,
  MAP_HEIGHT_TILES,
  TILE_SIZE_PX,
  CLIMATE_WATER_COLORS,
} from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';

/* ----------------------------- Small utilities ---------------------------- */

const inBounds = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < MAP_WIDTH_TILES && y < MAP_HEIGHT_TILES;

const CARD4: ReadonlyArray<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const D8: ReadonlyArray<[number, number]> = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const isSinkBiome = (b: BiomeType) =>
  b === BiomeType.RIVER ||
  b === BiomeType.MAJOR_RIVER ||
  b === BiomeType.FRESHWATER_LAKE ||
  b === BiomeType.ESTUARY;

const isUrban = (b: BiomeType) =>
  [
    BiomeType.HAMLET,
    BiomeType.DENSE_CITY,
    BiomeType.LOW_DENSITY_CITY,
    BiomeType.MARKETPLACE,
    BiomeType.GOVERNMENT_DISTRICT,
    BiomeType.CITY_CENTER,
    BiomeType.PLAZA,
    BiomeType.HARBOR_DISTRICT,
    BiomeType.INDUSTRIAL_DISTRICT,
  ].includes(b);

const isBlocked = (t: Tile) =>
  [
    BiomeType.MOUNTAIN,
    BiomeType.HIGH_PEAK,
    BiomeType.SNOW,
    BiomeType.ACTIVE_LAVA,
    BiomeType.CLIFF,
  ].includes(t.biome) || isUrban(t.biome);

const isWaterOrSink = (t: Tile) => !t.isLand || isSinkBiome(t.biome);

/* --------------------------- Distance to water (BFS) --------------------------- */

function buildDistanceToWaterMap(tiles: Tile[][]): number[][] {
  const w = MAP_WIDTH_TILES;
  const h = MAP_HEIGHT_TILES;
  const dist = Array.from({ length: h }, () => Array(w).fill(Infinity));
  const q: Array<[number, number]> = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y][x];
      if (!t.isLand || isSinkBiome(t.biome)) {
        dist[y][x] = 0;
        q.push([x, y]);
      }
    }
  }

  while (q.length) {
    const [x, y] = q.shift()!;
    const nd = dist[y][x] + 1;
    for (const [dx, dy] of CARD4) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      if (nd < dist[ny][nx]) {
        dist[ny][nx] = nd;
        q.push([nx, ny]);
      }
    }
  }

  return dist;
}

/* ---------------------------- Flow field (D8 + acc) ---------------------------- */

type FlowCell = {
  dir: [number, number] | null;
  accum: number;
  slopeDown: number;
};

function buildFlowField(tiles: Tile[][]): FlowCell[][] {
  const w = MAP_WIDTH_TILES;
  const h = MAP_HEIGHT_TILES;
  const field: FlowCell[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ dir: null, accum: 1, slopeDown: 0 }))
  );

  // Choose downslope direction
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y][x];
      if (!t.isLand || isBlocked(t)) {
        field[y][x].dir = null;
        continue;
      }
      let bestDrop = 0;
      let best: [number, number] | null = null;

      for (const [dx, dy] of D8) {
        const nx = x + dx,
          ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        const n = tiles[ny][nx];
        if (!n.isLand && !isSinkBiome(n.biome)) continue;
        if (isBlocked(n)) continue;

        const drop = t.altitude - n.altitude;
        if (drop > bestDrop) {
          bestDrop = drop;
          best = [dx, dy];
        }
      }

      field[y][x].dir = best;
      field[y][x].slopeDown = Math.max(0, bestDrop);
    }
  }

  // Accumulation: high → low
  const indices: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) indices.push([x, y]);
  indices.sort((a, b) => tiles[b[1]][b[0]].altitude - tiles[a[1]][a[0]].altitude);

  for (const [x, y] of indices) {
    const d = field[y][x].dir;
    if (!d) continue;
    const nx = x + d[0], ny = y + d[1];
    if (inBounds(nx, ny)) field[ny][nx].accum += field[y][x].accum;
  }

  return field;
}

/* ----------------------------------- A* ----------------------------------- */

function heuristic(a: Tile, b: Tile): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function movementCost(
  from: Tile,
  to: Tile,
  tiles: Tile[][],
  distToWater: number[][]
): number {
  const toIsSink = isSinkBiome(to.biome);
  if (!to.isLand && !toIsSink) return Infinity;
  if (isBlocked(to)) return Infinity;

  let cost = 1;

  const dh = to.altitude - from.altitude; // uphill positive
  const fromD = distToWater[from.y][from.x];
  const toD = distToWater[to.y][to.x];

  if (dh > 0.002) {
    cost += 4000 * dh;
    if (toD >= fromD) cost += 6; // don't climb if not helping
  } else {
    cost += 400 * dh; // downhill reward (negative)
  }

  if (fromD <= 5 || toD <= 5) {
    if (toD < fromD) cost *= 0.2;
    else if (toD > fromD) cost *= 4.0;
  }

  if (to.biome === BiomeType.HILLS) cost += 6;
  if (to.biome === BiomeType.FOREST || to.biome === BiomeType.DENSE_FOREST) cost += 3;
  if (to.biome === BiomeType.DESERT) cost += 12;

  return Math.max(0.05, cost);
}

function turnPenalty(prev: Tile | null, cur: Tile, nxt: Tile): number {
  if (!prev) return 0;
  const ax = cur.x - prev.x, ay = cur.y - prev.y;
  const bx = nxt.x - cur.x,  by = nxt.y - cur.y;
  const magA = Math.hypot(ax, ay) || 1, magB = Math.hypot(bx, by) || 1;
  const cos = Math.max(-1, Math.min(1, (ax*bx + ay*by) / (magA*magB)));
  const angle = Math.acos(cos);
  return 0.25 * (angle / Math.PI); // 0..0.25
}

// A* with closed set and anti-reversal
function astarStream(
  start: Tile,
  goal: Tile,
  tiles: Tile[][],
  distToWater: number[][],
  isStream: boolean[][]
): Tile[] | null {
  const open = new Set<Tile>([start]);
  const closed = new Set<Tile>();
  const cameFrom = new Map<Tile, Tile>();
  const gScore = new Map<Tile, number>([[start, 0]]);
  const fScore = new Map<Tile, number>([[start, heuristic(start, goal)]]);
  const maxIterations = (MAP_WIDTH_TILES + MAP_HEIGHT_TILES) * 10;
  let it = 0;

  const isNearReversal = (prev: Tile | null, cur: Tile, nxt: Tile) => {
    if (!prev) return false;
    const ax = cur.x - prev.x, ay = cur.y - prev.y;
    const bx = nxt.x - cur.x,  by = nxt.y - cur.y;
    const magA = Math.hypot(ax, ay) || 1, magB = Math.hypot(bx, by) || 1;
    const cos = (ax*bx + ay*by) / (magA*magB);
    return cos < -0.6; // forbid > ~126° turn
  };

  while (open.size > 0 && it++ < maxIterations) {
    let current: Tile | null = null;
    let lowest = Infinity;
    for (const t of open) {
      const f = fScore.get(t) ?? Infinity;
      if (f < lowest) { lowest = f; current = t; }
    }
    if (!current) return null;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Tile[] = [current];
      while (cameFrom.has(current)) { current = cameFrom.get(current)!; path.unshift(current); }
      return path;
    }

    open.delete(current);
    closed.add(current);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = current.x + dx, ny = current.y + dy;
        if (!inBounds(nx, ny)) continue;

        const neighbor = tiles[ny][nx];
        if (closed.has(neighbor)) continue;

        // snap to an existing stream (confluence)
        if (isStream[ny]?.[nx]) {
          cameFrom.set(neighbor, current);
          const path: Tile[] = [neighbor];
          let cur = neighbor;
          while (cameFrom.has(cur)) { cur = cameFrom.get(cur)!; path.unshift(cur); }
          return path;
        }

        if (isNearReversal(cameFrom.get(current) ?? null, current, neighbor)) continue;

        const move = movementCost(current, neighbor, tiles, distToWater);
        if (move === Infinity) continue;

        const stepBase = dx === 0 || dy === 0 ? 1 : Math.SQRT2;
        const tentative =
          (gScore.get(current) ?? Infinity) +
          move * stepBase +
          turnPenalty(cameFrom.get(current) ?? null, current, neighbor) * 2.0; // stronger inertia

        if (tentative < (gScore.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentative);
          fScore.set(neighbor, tentative + heuristic(neighbor, goal));
          open.add(neighbor);
        }
      }
    }
  }
  return null;
}

/* ------------------------------ Path shaping ------------------------------ */

function centersFromTiles(path: Tile[]): Point[] {
  return path.map((t) => ({
    x: t.x * TILE_SIZE_PX + TILE_SIZE_PX / 2,
    y: t.y * TILE_SIZE_PX + TILE_SIZE_PX / 2,
  }));
}

// (kept for reference; not used after meanderize swap)
function displaceAlongNormal(
  points: Point[],
  noise: ValueNoise,
  scale = 0.6,
  amp = TILE_SIZE_PX * 0.22
): Point[] {
  if (points.length < 3) return points.slice();
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const n = noise.noise(p.x * scale, p.y * scale) - 0.5;
    out.push({ x: p.x + nx * n * amp, y: p.y + ny * n * amp });
  }
  return out;
}

function generateSvgDFromPoints(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (points.length === 2) {
    d += ` L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
    return d;
  }
  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)},${points[i].y.toFixed(2)} ${xc.toFixed(
      2
    )},${yc.toFixed(2)}`;
  }
  d += ` Q ${points[points.length - 2].x.toFixed(2)},${
    points[points.length - 2].y.toFixed(2)
  } ${points[points.length - 1].x.toFixed(2)},${
    points[points.length - 1].y.toFixed(2)
  }`;
  return d;
}

/* -------------------- Oxbow meander helpers (1D along arc) -------------------- */

function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function cumulativeLengths(points: Point[]): number[] {
  const L = [0];
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    L.push(L[i - 1] + d);
  }
  return L;
}

function meanderize(
  points: Point[],
  noise: ValueNoise,
  ampPx: number,
  wavelengthPx: number
): Point[] {
  if (points.length < 3) return points.slice();
  const Ls = cumulativeLengths(points);
  const total = Ls[Ls.length - 1] || 1;
  const k = (2 * Math.PI) / Math.max(24, wavelengthPx); // cycles per pixel
  const phase = noise.random() * Math.PI * 2;

  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;

    const s = Ls[i] / total;
    const taper = smoothstep(0.05, 0.95, s); // gentle near source & mouth
    const m = Math.sin(phase + k * Ls[i]) * 0.7 + (noise.noise(s * 1.3, 0) - 0.5) * 0.3;

    out.push({ x: p.x + nx * ampPx * taper * m, y: p.y + ny * ampPx * taper * m });
  }
  return out;
}

/* ----------------------- Hydrology-aware stream width ---------------------- */

function widthFromHydrology(
  progress: number, // 0..1 along path
  accum: number, // contributing area near mouth
  slope: number // slope near mouth (0..~1)
): number {
  const base =
    TILE_SIZE_PX * 0.04 + TILE_SIZE_PX * 0.10 * Math.pow(progress, 1.2);
  const wAcc = Math.sqrt(Math.max(1, accum)) * 0.06 * TILE_SIZE_PX;
  const wSlope = 1 / (1 + 6 * Math.max(0, slope));
  return Math.min(TILE_SIZE_PX * 0.18, base + wAcc) * wSlope;
}

/* --------------------------- Flow tracing & helpers ------------------------ */

function traceAlongFlow(
  source: Tile,
  tiles: Tile[][],
  field: FlowCell[][],
  isStream: boolean[][],
  sinks: Tile[],
  maxSteps = MAP_WIDTH_TILES + MAP_HEIGHT_TILES
): Tile[] {
  const path: Tile[] = [source];
  let cur = source;
  let steps = 0;

  const sinkSet = new Set(sinks.map((t) => `${t.x},${t.y}`));

  while (steps++ < maxSteps) {
    for (const [dx, dy] of D8) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (inBounds(nx, ny) && isStream[ny][nx]) { path.push(tiles[ny][nx]); return path; }
    }
    if (sinkSet.has(`${cur.x},${cur.y}`)) return path;

    const dir = field[cur.y][cur.x].dir;
    if (!dir) break;

    const nx = cur.x + dir[0], ny = cur.y + dir[1];
    if (!inBounds(nx, ny)) break;

    const next = tiles[ny][nx];
    if (isBlocked(next)) break;
    if (!next.isLand && !isSinkBiome(next.biome)) break;

    path.push(next);
    cur = next;
  }
  return path;
}

function markPathTilesAsStream(path: Tile[], isStream: boolean[][]) {
  for (const t of path) isStream[t.y][t.x] = true;
}

/* -------------------------- Loop pruning for tiles ------------------------- */

function pruneLoops(path: Tile[]): Tile[] {
  const out: Tile[] = [];
  const seen = new Map<string, number>();
  for (const t of path) {
    const key = `${t.x},${t.y}`;
    if (seen.has(key)) {
      const keepUpto = seen.get(key)!;
      out.splice(keepUpto + 1);
      seen.clear();
      out.forEach((p, i) => seen.set(`${p.x},${p.y}`, i));
    } else {
      out.push(t);
      seen.set(key, out.length - 1);
    }
  }
  return out;
}

/* --------------------------- Mouth connection helpers ---------------------- */

// Follow the distance-to-water gradient to the nearest water/sink tile
function nearestWaterTileFrom(tile: Tile, distToWater: number[][], tiles: Tile[][]): Tile | null {
  let cur = tile;
  let guard = 40;
  while (guard-- > 0) {
    const d = distToWater[cur.y][cur.x];
    if (d === 0) return cur; // already water/sink
    let best: Tile | null = null;
    let bestD = d;
    for (const [dx, dy] of CARD4) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(nx, ny)) continue;
      if (distToWater[ny][nx] < bestD) {
        bestD = distToWater[ny][nx];
        best = tiles[ny][nx];
      }
    }
    if (!best) break;
    cur = best;
  }
  return null;
}

// If endpoint is still land, extend points slightly into the nearest water/sink
function extendPathToWater(points: Point[], endTile: Tile, targetTile: Tile | null) {
  if (!targetTile) return points;
  const end = points[points.length - 1];
  const cx = targetTile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2;
  const cy = targetTile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2;
  const vx = cx - end.x, vy = cy - end.y;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len, uy = vy / len;

  // Push a bit past the cell center (coastline halo-safe)
  const overshoot = TILE_SIZE_PX * 0.7;
  const newPt: Point = { x: cx + ux * overshoot, y: cy + uy * overshoot };
  const out = points.slice();
  out.push(newPt);
  return out;
}

/* --------------------------------- Styling -------------------------------- */

function lightenHex(hex: string, amt = 0.12): string {
  // hex like #2b7bb5
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return `rgb(${r}, ${g}, ${b})`;
}

function getStreamColors(climate: ClimateType) {
  const c = (CLIMATE_WATER_COLORS?.[climate] ?? {}) as any;
  const main: string = c.river || '#2b7bb5';
  const core: string = lightenHex(main, 0.18);  // fully opaque center
  const highlight = 'rgba(255, 255, 255, 0.10)';
  const shadow = 'rgba(0,0,0,0.10)';
  return { main, core, highlight, shadow };
}

/* -------------------------- Seamless-join utilities ------------------------ */

// Trim end of a polyline by a % of its point count.
function trimEndByPercent(points: Point[], pct = 0.14): Point[] {
  if (points.length <= 3) return points.slice(0, Math.max(2, points.length - 1));
  const cut = Math.max(2, Math.floor(points.length * (1 - pct)));
  return points.slice(0, cut);
}

/* ------------------------------- Main export ------------------------------- */

let streamIdCounter = 0;

export function generateStreams(mapData: MapData, noise: ValueNoise, archetype?: MapArchetype, oceanEdge?: number) {
  if (!mapData.pathObjects) mapData.pathObjects = [];
  const { tiles, climate } = mapData;

  if (climate === ClimateType.ARID) return;

  const w = MAP_WIDTH_TILES, h = MAP_HEIGHT_TILES;

  // Precompute helpers
  const distToWater = buildDistanceToWaterMap(tiles);
  const flowField = buildFlowField(tiles);

  // Identify sinks & candidate sources
  const sinks: Tile[] = [];
  const candidates: Tile[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y][x];
      if (isSinkBiome(t.biome)) sinks.push(t);

      if (
        t.isLand &&
        !isBlocked(t) &&
        !isUrban(t.biome) &&
        (t.biome === BiomeType.HILLS || t.biome === BiomeType.WETLANDS) &&
        flowField[y][x].accum <= 8 &&
        distToWater[y][x] > 2
      ) {
        candidates.push(t);
      }
    }
  }
  if (sinks.length === 0 || candidates.length === 0) return;

  // Stream occupancy for confluence snapping
  const isStream = Array.from({ length: h }, () => Array(w).fill(false));

  // Colors
  const { main: mainColor, core: coreColor, highlight: hiColor, shadow: shColor } =
    getStreamColors(climate);

  // Count - more streams for delta archetype
  const isDelta = archetype === MapArchetype.DELTA;
  const maxStreams = isDelta ? 
    Math.max(8, Math.min(20, Math.floor((w + h) / 15) + Math.floor(noise.random() * 5))) :
    Math.max(3, Math.min(10, Math.floor((w + h) / 20) + Math.floor(noise.random() * 3)));

  // For delta archetype, add specific distributary streams
  if (isDelta && oceanEdge !== undefined) {
    // Generate distributary channels that branch off from main rivers
    const distributaries: Tile[] = [];
    
    // Find river tiles to branch from
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = tiles[y][x];
        if (t.biome === BiomeType.RIVER || t.biome === BiomeType.MAJOR_RIVER) {
          // Check distance to ocean edge
          let distToOcean = 0;
          if (oceanEdge === 0) distToOcean = (h - y) / h; // South ocean
          else if (oceanEdge === 1) distToOcean = y / h; // North ocean  
          else if (oceanEdge === 2) distToOcean = (w - x) / w; // East ocean
          else if (oceanEdge === 3) distToOcean = x / w; // West ocean
          
          // More likely to branch near the ocean (delta fan effect)
          if (noise.random() < distToOcean * 0.3) {
            distributaries.push(t);
          }
        }
      }
    }
    
    // Add distributary sources to candidates
    candidates.push(...distributaries);
  }
  
  for (let i = 0; i < maxStreams && candidates.length > 0; i++) {
    // pick a candidate biased high for normal streams, or from distributaries for delta
    if (isDelta && i < candidates.length / 2) {
      // For delta, prioritize distributary branches
      const idx = Math.floor(noise.random() * candidates.length);
      const start = candidates.splice(idx, 1)[0];
      if (!start) continue;
    } else {
      candidates.sort((a, b) => b.altitude - a.altitude || noise.random() - 0.5);
    }
    const start = candidates.shift()!;
    if (!start) break;

    // nearest sink
    let end: Tile | null = null;
    let best = Infinity;
    for (const s of sinks) {
      const d = heuristic(start, s);
      if (d < best) { best = d; end = s; }
    }
    if (!end) continue;

    // Flow trace
    let traced = traceAlongFlow(start, tiles, flowField, isStream, sinks);

    // A* tail if needed
    const last = traced[traced.length - 1];
    if (last.x !== end.x || last.y !== end.y) {
      const tail = astarStream(last, end, tiles, distToWater, isStream);
      if (!tail || tail.length < 2) continue;
      traced = traced.concat(tail.slice(1));
    }
    if (traced.length < 2) continue;

    // Prune any loops/rewalks
    traced = pruneLoops(traced);
    if (traced.length < 2) continue;

    // Mark occupancy (for later confluences)
    markPathTilesAsStream(traced, isStream);

    // Build points and apply oxbow meanders
    let points = centersFromTiles(traced);

    // Compute meander parameters from local hydrology
    const avgSlope =
      traced.reduce((s, t) => s + flowField[t.y][t.x].slopeDown, 0) / traced.length || 0;
    const mouthTile = traced[Math.max(0, traced.length - 2)];
    const mouthCell = flowField[mouthTile.y][mouthTile.x];
    const acc = Math.max(1, mouthCell.accum);

    // amplitude: bigger in flatter, higher-accum areas
    const ampPx =
      TILE_SIZE_PX *
      (0.05 + 0.22 * (1 / (1 + 10 * avgSlope))) *
      Math.min(1.0, 0.45 + Math.log2(acc + 1) / 5);
    // wavelength grows with size of stream
    const wavelengthPx = TILE_SIZE_PX * (10 + Math.min(18, Math.sqrt(acc) * 2));

    points = meanderize(points, noise, ampPx, wavelengthPx);

    // Detect if the last tile is actually water/sink; if not, extend to water
    const endTile = traced[traced.length - 1];

    // Set of tiles belonging to THIS stream (to avoid self-counting)
    const currentPathSet = new Set(traced.map((t) => `${t.x},${t.y}`));

    let isConfluence = false;
    let joinTile: Tile | null = null;

    if (isWaterOrSink(endTile)) {
      // connected to river/lake/ocean sink naturally
    } else {
      // Is it touching another (already-drawn) stream? (true confluence)
      for (const [dx, dy] of D8) {
        const nx = endTile.x + dx, ny = endTile.y + dy;
        if (!inBounds(nx, ny)) continue;
        if (isStream[ny][nx] && !currentPathSet.has(`${nx},${ny}`)) {
          isConfluence = true;
          joinTile = tiles[ny][nx];
          break;
        }
      }
      // If not a confluence, force connection into nearest water/sink
      if (!isConfluence) {
        const target = nearestWaterTileFrom(endTile, distToWater, tiles);
        if (target) {
          points = extendPathToWater(points, endTile, target);
        }
      }
    }

    const svgFull = generateSvgDFromPoints(points);
    if (!svgFull) continue;

    // Widths
    const mouthSlope = mouthCell.slopeDown;
    const baseWidth = widthFromHydrology(0.9, mouthCell.accum, mouthSlope);

    // If confluence, trim rim/shadow/highlight near the join
    const trimmedPoints = isConfluence ? trimEndByPercent(points, 0.16) : points;
    const dTrim = generateSvgDFromPoints(trimmedPoints);

    /* ------------------------- Emit path objects ------------------------- */

    const id = streamIdCounter++;

    // 1) soft shadow (trimmed at confluences)
    mapData.pathObjects.push({
      id: `stream-shadow-${id}`,
      type: PathType.PATH,
      svgD: isConfluence ? dTrim : svgFull,
      strokeWidth: baseWidth + TILE_SIZE_PX * 0.02,
      strokeColor: shColor,
      opacity: 0.10,
      isStream: true,
      renderOrder: -1,
    });

    // 2) main water rim (semi-opaque). Use trimmed path at confluences.
    mapData.pathObjects.push({
      id: `stream-main-${id}`,
      type: PathType.PATH,
      svgD: isConfluence ? dTrim : svgFull,
      strokeWidth: baseWidth,
      strokeColor: mainColor,
      opacity: 1.0,
      isStream: true,
      renderOrder: 0,
    });

    // 3) opaque core (fully solid, lighter) — always full, bridges the join cleanly
    mapData.pathObjects.push({
      id: `stream-core-${id}`,
      type: PathType.PATH,
      svgD: svgFull,
      strokeWidth: Math.max(1, baseWidth * 0.55),
      strokeColor: coreColor,
      opacity: 1.0,
      isStream: true,
      renderOrder: 1,
    });

    // 4) light specular highlight — also trimmed at confluence
    mapData.pathObjects.push({
      id: `stream-hi-${id}`,
      type: PathType.PATH,
      svgD: isConfluence ? dTrim : svgFull,
      strokeWidth: Math.max(1, baseWidth * 0.35),
      strokeColor: 'rgba(255,255,255,0.10)',
      opacity: 1.0,
      isStream: true,
      renderOrder: 2,
    });

    // Optional micro-bulb to ensure no hairline seam on harsh diagonals
    if (isConfluence && joinTile) {
      const cx = joinTile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const cy = joinTile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2;
      const bulb = `M ${cx - 0.01} ${cy - 0.01} L ${cx + 0.01} ${cy + 0.01}`;
      mapData.pathObjects.push({
        id: `stream-core-bulb-${id}`,
        type: PathType.PATH,
        svgD: bulb,
        strokeWidth: Math.max(baseWidth * 0.70, TILE_SIZE_PX * 0.20),
        strokeColor: coreColor,
        opacity: 1.0,
        isStream: true,
        renderOrder: 1,
      });
    }
  }
}
