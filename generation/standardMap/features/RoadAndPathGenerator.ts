/**
 * generation/standardMap/features/RoadAndPathGenerator.ts
 * Terrain-aware roads & paths with junction snapping and clean bridge crossings.
 */

import { Tile, BiomeType, PathType, Point, MapData, HistoricalEra } from '../../../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE_PX } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';

/* ------------------------------ Visual constants ------------------------------ */
// Earthy dirt/stone roads
const ROAD_STROKE_COLOR = '#855a40';
const ROAD_SHADOW = 'rgba(0,0,0,0.18)';
// Footpaths
const PATH_STROKE_COLOR = '#a67b5b';
// Modern asphalt
const MODERN_ROAD_COLOR = '#2a2a2a';
const MODERN_CENTER_HILITE = 'rgba(255,255,255,0.14)';
// Rail - SimCity/Cities Skylines style thin lines
const RAILROAD_COLOR = '#4a4a4a'; // Dark gray steel
const RAILROAD_SHADOW_COLOR = 'rgba(0,0,0,0.3)'; // Subtle shadow for depth

// Width hierarchy
const MAJOR_ROAD_WIDTH        = TILE_SIZE_PX * 0.25;
const ROAD_STROKE_WIDTH_BASE  = TILE_SIZE_PX * 0.20;
const MINOR_ROAD_WIDTH        = TILE_SIZE_PX * 0.12;
const PATH_STROKE_WIDTH_BASE  = TILE_SIZE_PX * 0.08;
const MODERN_ROAD_WIDTH       = TILE_SIZE_PX * 0.30;
const RAILROAD_WIDTH          = TILE_SIZE_PX * 0.05; // Very thin line like SimCity

const ROAD_OPACITY            = 0.95;
const PATH_OPACITY            = 0.75;
const MODERN_ROAD_OPACITY     = 0.95;
const RAILROAD_OPACITY        = 0.9; // Slightly transparent

// Bridge deck (timber/stone)
const BRIDGE_DECK_COLOR       = '#cbb79a';
const BRIDGE_SHADOW           = 'rgba(0,0,0,0.25)';

/* --------------------------------- Helpers --------------------------------- */

const inBounds = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < MAP_WIDTH_TILES && y < MAP_HEIGHT_TILES;

const CARD4: ReadonlyArray<[number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const D8: ReadonlyArray<[number, number]> = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
];

const isWater = (t: Tile) => !t.isLand;
const isRiverOrLake = (t: Tile) =>
  t.biome === BiomeType.RIVER || t.biome === BiomeType.MAJOR_RIVER || t.biome === BiomeType.FRESHWATER_LAKE || t.biome === BiomeType.ESTUARY;

const isUrban = (b: BiomeType) =>
  [BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER, BiomeType.PLAZA, BiomeType.HARBOR_DISTRICT].includes(b);

const isImpassable = (t: Tile) =>
  [BiomeType.ACTIVE_LAVA, BiomeType.CLIFF, BiomeType.HIGH_PEAK, BiomeType.SNOW].includes(t.biome);

/* ------------------------------ Path utilities ------------------------------ */

function manhattan(a: Tile, b: Tile) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function euclid(a: Tile, b: Tile) { return Math.hypot(a.x - b.x, a.y - b.y); }

function centersFromTiles(path: Tile[]): Point[] {
  return path.map((t) => ({
    x: t.x * TILE_SIZE_PX + TILE_SIZE_PX / 2,
    y: t.y * TILE_SIZE_PX + TILE_SIZE_PX / 2,
  }));
}

// Organic offset along local normal (for dirt roads / paths)
function displaceAlongNormal(points: Point[], noise: ValueNoise, scale = 0.55, amp = TILE_SIZE_PX * 0.16): Point[] {
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

// Smooth quadratic chain
function svgQuadratic(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (points.length === 2) return d + ` L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 2; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${xc.toFixed(2)} ${yc.toFixed(2)}`;
  }
  d += ` Q ${points[points.length - 2].x.toFixed(2)} ${points[points.length - 2].y.toFixed(2)} ${points[points.length - 1].x.toFixed(2)} ${points[points.length - 1].y.toFixed(2)}`;
  return d;
}

/* ----------------------------- Cost & A* search ----------------------------- */

function biomeFriction(b: BiomeType, kind: PathType): number {
  switch (b) {
    case BiomeType.GRASSLAND:
    case BiomeType.STEPPE:
    case BiomeType.BEACH:
    case BiomeType.SALT_FLATS:
    case BiomeType.TUNDRA:
    case BiomeType.DESERT:
    case BiomeType.VOLCANIC_SOIL: return 1;
    case BiomeType.FOREST:        return kind === PathType.PATH ? 2 : 6;
    case BiomeType.DENSE_FOREST:
    case BiomeType.JUNGLE:        return kind === PathType.PATH ? 5 : 12;
    case BiomeType.HILLS:         return kind === PathType.PATH ? 3 : 8;
    case BiomeType.MOUNTAIN:      return kind === PathType.PATH ? 8 : 30;
    case BiomeType.VOLCANIC_ROCK: return kind === PathType.PATH ? 10 : 25;
    case BiomeType.WETLANDS:
    case BiomeType.MANGROVE:      return kind === PathType.PATH ? 15 : 40;
    case BiomeType.FARMLAND:      return kind === PathType.PATH ? 3 : 8;
    case BiomeType.RIVERBANK:     return kind === PathType.PATH ? 2 : 3;
    case BiomeType.RUINS:         return kind === PathType.PATH ? 1 : 10;
    default:                      return kind === PathType.PATH ? 2 : 5;
  }
}

function canBridge(from: Tile, to: Tile, tiles: Tile[][]): boolean {
  // Allow crossing water on a straight cardinal step if opposite side is land.
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false; // cardinal only
  const ox = to.x + dx, oy = to.y + dy;
  if (!inBounds(ox, oy)) return false;
  return tiles[oy][ox].isLand;
}

function movementCost(from: Tile, to: Tile, kind: PathType, tiles: Tile[][], cameFrom: Map<Tile, Tile>): number {
  // Impassables
  if (isImpassable(to)) return Infinity;

  // Water rules
  if (isWater(to)) {
    if (isRiverOrLake(to) && canBridge(from, to, tiles)) {
      // expensive but permitted
      const base = kind === PathType.MODERN_ROAD ? 18 : kind === PathType.RAILROAD ? 28 : kind === PathType.ROAD ? 22 : 14; // paths can ford
      return base;
    }
    return Infinity;
  }

  let cost = 1;

  // Slope
  const dh = Math.abs(to.altitude - from.altitude);
  cost += dh * (kind === PathType.PATH ? 18 : 28);

  // Terrain friction
  cost += biomeFriction(to.biome, kind);

  // Straight-line inertia for roads (prefer fewer turns)
  const parent = cameFrom.get(from) ?? null;
  if (parent) {
    const ax = from.x - parent.x, ay = from.y - parent.y;
    const bx = to.x - from.x,    by = to.y - from.y;
    const magA = Math.hypot(ax, ay) || 1;
    const magB = Math.hypot(bx, by) || 1;
    const cos  = (ax * bx + ay * by) / (magA * magB);
    const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
    if (kind === PathType.ROAD || kind === PathType.MODERN_ROAD || kind === PathType.RAILROAD) {
      cost += 0.35 * (angle / Math.PI); // discourage sharp turns
    } else {
      // Paths: tiny *reward* for a bit of winding
      cost -= 0.10 * (angle / Math.PI);
    }
  }

  // Slight penalty for diagonals so streets prefer orthogonal grids
  if (kind === PathType.MODERN_ROAD || kind === PathType.RAILROAD) {
    if (from.x !== to.x && from.y !== to.y) cost += 0.35;
  }

  return Math.max(0.05, cost);
}

function aStarSnapToNetwork(
  start: Tile,
  goal: Tile,
  kind: PathType,
  tiles: Tile[][],
  isOnNetwork: boolean[][]
): Tile[] | null {
  const open = new Set<Tile>([start]);
  const cameFrom = new Map<Tile, Tile>();
  const g = new Map<Tile, number>([[start, 0]]);
  const f = new Map<Tile, number>([[start, euclid(start, goal)]]);
  const MAX_ITERS = (MAP_WIDTH_TILES + MAP_HEIGHT_TILES) * 20;
  let it = 0;

  while (open.size && it++ < MAX_ITERS) {
    let current: Tile | null = null;
    let best = Infinity;
    for (const t of open) {
      const ft = f.get(t) ?? Infinity;
      if (ft < best) { best = ft; current = t; }
    }
    if (!current) return null;

    // join existing network quickly (builds junctions naturally)
    if (current !== start && isOnNetwork[current.y]?.[current.x]) {
      const path: Tile[] = [current];
      while (cameFrom.has(current)) { current = cameFrom.get(current)!; path.unshift(current); }
      return path;
    }

    if (current.x === goal.x && current.y === goal.y) {
      const path: Tile[] = [current];
      while (cameFrom.has(current)) { current = cameFrom.get(current)!; path.unshift(current); }
      return path;
    }

    open.delete(current);
    for (let k = 0; k < D8.length; k++) {
      const [dx, dy] = D8[k];
      const nx = current.x + dx, ny = current.y + dy;
      if (!inBounds(nx, ny)) continue;
      const n = tiles[ny][nx];

      const stepCost = movementCost(current, n, kind, tiles, cameFrom);
      if (stepCost === Infinity) continue;

      const stepBase = (dx === 0 || dy === 0) ? 1 : Math.SQRT2;
      const score = (g.get(current) ?? Infinity) + stepCost * stepBase;

      if (score < (g.get(n) ?? Infinity)) {
        cameFrom.set(n, current);
        g.set(n, score);
        f.set(n, score + euclid(n, goal));
        open.add(n);
      }
    }
  }
  return null;
}

/* -------------------------- Geometry & bridge passes -------------------------- */

function contiguousWaterSegments(path: Tile[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let i = 0;
  while (i < path.length) {
    while (i < path.length && !isWater(path[i])) i++;
    if (i >= path.length) break;
    const start = i;
    while (i < path.length && isWater(path[i])) i++;
    const end = i - 1;
    if (end > start) out.push([start, end]); // at least 2 tiles of water
  }
  return out;
}

/* ----------------------------- City grid helpers ---------------------------- */

function findCityClusters(urbanAreas: Tile[], tiles: Tile[][]): Tile[][] {
  const visited = new Set<string>();
  const clusters: Tile[][] = [];
  for (const start of urbanAreas) {
    const key = `${start.x},${start.y}`;
    if (visited.has(key)) continue;
    const q = [start];
    const cluster: Tile[] = [];
    while (q.length) {
      const t = q.shift()!;
      const k = `${t.x},${t.y}`;
      if (visited.has(k)) continue;
      visited.add(k);
      cluster.push(t);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = t.x + dx, ny = t.y + dy;
          if (!inBounds(nx, ny)) continue;
          const n = tiles[ny][nx];
          if ((n.biome === BiomeType.DENSE_CITY || n.biome === BiomeType.LOW_DENSITY_CITY || n.biome === BiomeType.HAMLET) && !visited.has(`${nx},${ny}`)) {
            q.push(n);
          }
        }
      }
    }
    if (cluster.length) clusters.push(cluster);
  }
  return clusters;
}

function getClusterBounds(cluster: Tile[]) {
  let minX = MAP_WIDTH_TILES, maxX = 0, minY = MAP_HEIGHT_TILES, maxY = 0;
  for (const t of cluster) {
    minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x);
    minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y);
  }
  return {
    minX: Math.max(0, minX - 2),
    maxX: Math.min(MAP_WIDTH_TILES - 1, maxX + 2),
    minY: Math.max(0, minY - 2),
    maxY: Math.min(MAP_HEIGHT_TILES - 1, maxY + 2),
  };
}

function svgFromRow(points: Point[]): string { return svgQuadratic(points); }

/* ------------------------- Railroad Edge Utilities ------------------------- */

/**
 * Record railroad crossings at map edges for cross-map continuity
 */
function recordRailroadEdges(mapData: MapData): void {
  if (!mapData.pathObjects || !mapData.edgeDataSet) {
    console.warn('[Railroad Edges] No pathObjects or edgeDataSet available');
    return;
  }

  const railroads = mapData.pathObjects.filter(p => p.type === PathType.RAILROAD);
  if (railroads.length === 0) {
    console.log('[Railroad Edges] No railroads to record');
    return;
  }

  const edgeData = mapData.edgeDataSet;
  console.log(`[Railroad Edges] Processing ${railroads.length} railroad path objects`);

  // Helper to check if a point is near a map edge
  const isNearEdge = (x: number, y: number, edge: 'north' | 'south' | 'east' | 'west'): boolean => {
    const tolerance = TILE_SIZE_PX * 2; // Within 2 tiles of edge
    switch (edge) {
      case 'north': return y <= tolerance;
      case 'south': return y >= (MAP_HEIGHT_TILES - 1) * TILE_SIZE_PX - tolerance;
      case 'east': return x >= (MAP_WIDTH_TILES - 1) * TILE_SIZE_PX - tolerance;
      case 'west': return x <= tolerance;
    }
  };

  // Helper to extract direction from SVG path at a point
  const getDirectionAtPoint = (svgPath: string, edge: 'north' | 'south' | 'east' | 'west'): 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW' => {
    // Simple heuristic: check if path crosses edge horizontally or vertically
    // For now, use edge to determine primary direction
    if (edge === 'north') return 'N';
    if (edge === 'south') return 'S';
    if (edge === 'east') return 'E';
    if (edge === 'west') return 'W';
    return 'N';
  };

  // Track how many edge crossings we find
  let northCount = 0, southCount = 0, eastCount = 0, westCount = 0;

  // Scan each railroad path for edge crossings
  for (const railroad of railroads) {
    const pathStr = railroad.svgD;

    // Extract coordinates from SVG path (parse M and L commands)
    const coordMatches = pathStr.matchAll(/([ML])\s*([\d.]+)\s+([\d.]+)/g);
    const points: Point[] = [];
    for (const match of coordMatches) {
      points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
    }

    // Check each point against edges
    for (const point of points) {
      const tileX = Math.floor(point.x / TILE_SIZE_PX);
      const tileY = Math.floor(point.y / TILE_SIZE_PX);

      // North edge (y = 0)
      if (tileY === 0 && edgeData.north && edgeData.north[tileX]) {
        edgeData.north[tileX].hasRailroad = true;
        edgeData.north[tileX].railroadDirection = getDirectionAtPoint(pathStr, 'north');
        northCount++;
      }

      // South edge (y = MAP_HEIGHT_TILES - 1)
      if (tileY === MAP_HEIGHT_TILES - 1 && edgeData.south && edgeData.south[tileX]) {
        edgeData.south[tileX].hasRailroad = true;
        edgeData.south[tileX].railroadDirection = getDirectionAtPoint(pathStr, 'south');
        southCount++;
      }

      // East edge (x = MAP_WIDTH_TILES - 1)
      if (tileX === MAP_WIDTH_TILES - 1 && edgeData.east && edgeData.east[tileY]) {
        edgeData.east[tileY].hasRailroad = true;
        edgeData.east[tileY].railroadDirection = getDirectionAtPoint(pathStr, 'east');
        eastCount++;
      }

      // West edge (x = 0)
      if (tileX === 0 && edgeData.west && edgeData.west[tileY]) {
        edgeData.west[tileY].hasRailroad = true;
        edgeData.west[tileY].railroadDirection = getDirectionAtPoint(pathStr, 'west');
        westCount++;
      }
    }
  }

  const totalEdgeCrossings = northCount + southCount + eastCount + westCount;
  console.log(`[Railroad Edges] Recorded ${totalEdgeCrossings} edge crossings - North: ${northCount}, South: ${southCount}, East: ${eastCount}, West: ${westCount}`);
}

/**
 * Find railroad continuation points from neighboring map edges
 */
function findRailroadContinuationPoints(neighboringEdges: any): Point[] {
  const continuationPoints: Point[] = [];

  if (!neighboringEdges) {
    console.log('[Railroad Continuations] No neighboring edges provided');
    return continuationPoints;
  }

  const edgeDirections = Object.keys(neighboringEdges);
  console.log(`[Railroad Continuations] Checking ${edgeDirections.length} edge(s): ${edgeDirections.join(', ')}`);

  // Check north edge for railroads coming from the north
  if (neighboringEdges.north) {
    let northRailroads = 0;
    neighboringEdges.north.forEach((tile: any, x: number) => {
      if (tile.hasRailroad) {
        continuationPoints.push({ x, y: 0 });
        northRailroads++;
        console.log(`  [Railroad Continuations] Found railroad at north edge x=${x}`);
      }
    });
    if (northRailroads === 0) {
      console.log(`  [Railroad Continuations] No railroads found on north edge (checked ${neighboringEdges.north.length} tiles)`);
    }
  }

  // Check south edge for railroads coming from the south
  if (neighboringEdges.south) {
    let southRailroads = 0;
    neighboringEdges.south.forEach((tile: any, x: number) => {
      if (tile.hasRailroad) {
        continuationPoints.push({ x, y: MAP_HEIGHT_TILES - 1 });
        southRailroads++;
        console.log(`  [Railroad Continuations] Found railroad at south edge x=${x}`);
      }
    });
    if (southRailroads === 0) {
      console.log(`  [Railroad Continuations] No railroads found on south edge (checked ${neighboringEdges.south.length} tiles)`);
    }
  }

  // Check east edge for railroads coming from the east
  if (neighboringEdges.east) {
    let eastRailroads = 0;
    neighboringEdges.east.forEach((tile: any, y: number) => {
      if (tile.hasRailroad) {
        continuationPoints.push({ x: MAP_WIDTH_TILES - 1, y });
        eastRailroads++;
        console.log(`  [Railroad Continuations] Found railroad at east edge y=${y}`);
      }
    });
    if (eastRailroads === 0) {
      console.log(`  [Railroad Continuations] No railroads found on east edge (checked ${neighboringEdges.east.length} tiles)`);
    }
  }

  // Check west edge for railroads coming from the west
  if (neighboringEdges.west) {
    let westRailroads = 0;
    neighboringEdges.west.forEach((tile: any, y: number) => {
      if (tile.hasRailroad) {
        continuationPoints.push({ x: 0, y });
        westRailroads++;
        console.log(`  [Railroad Continuations] Found railroad at west edge y=${y}`);
      }
    });
    if (westRailroads === 0) {
      console.log(`  [Railroad Continuations] No railroads found on west edge (checked ${neighboringEdges.west.length} tiles)`);
    }
  }

  console.log(`[Railroad Continuations] Total continuation points found: ${continuationPoints.length}`);
  return continuationPoints;
}

/* ------------------------------- Main export -------------------------------- */

let pathIdCounter = 0;

export function generateRoadAndPathNetwork(mapData: MapData, noise: ValueNoise, era?: HistoricalEra, neighboringEdges?: any): void {
  const tiles = mapData.tiles;
  mapData.pathObjects = mapData.pathObjects || [];

  // Get current year from mapData for more precise era detection
  const year = mapData.timeSlice ? parseInt(mapData.timeSlice) : 1650;
  
  // Era-based road system flags
  const useModernGrid = era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA || year >= 1920;
  //const useUrbanGrids = year >= 1750; // Urban grids appear with proper planning
const useUrbanGrids = false;
  const hasRailroads = era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA || year >= 1850;

  /* --------- collect nodes --------- */
  const urban: Tile[] = [];
  const hamlets: Tile[] = [];
  const farms: Tile[] = [];
  const palaces: Tile[] = [];
  const govt: Tile[] = [];
  const ruins: Tile[] = [];
  const mills: Tile[] = [];
  const mines: Tile[] = [];
  const factories: Tile[] = [];
  const lumber: Tile[] = [];

  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const t = tiles[y][x];
      t.pathObjectRef = undefined; // clear any stale refs
      if (t.biome === BiomeType.DENSE_CITY || t.biome === BiomeType.LOW_DENSITY_CITY) urban.push(t);
      else if (t.biome === BiomeType.HAMLET) hamlets.push(t);
      else if (t.biome === BiomeType.FARMLAND) farms.push(t);
      else if (t.biome === BiomeType.PALACE) palaces.push(t);
      else if (t.biome === BiomeType.GOVERNMENT_DISTRICT) govt.push(t);
      else if (t.biome === BiomeType.RUINS) ruins.push(t);
    }
  }

  // terrainStructures (optional)
  if (mapData.terrainStructures) {
    for (const s of mapData.terrainStructures) {
      const [x, y] = s.location;
      if (!inBounds(x, y)) continue;
      const t = tiles[y][x];
      switch (s.structureType) {
        case 'mill':         mills.push(t); break;
        case 'mining_colony':mines.push(t); break;
        case 'factory':      factories.push(t); break;
        case 'lumber_camp':  lumber.push(t); break;
        case 'palace':       palaces.push(t); break;
        case 'fortress':     ruins.push(t); break; // use as POI
      }
    }
  }

  /* --------- optional: generate urban grids (era-aware) --------- */
  // Only generate grids in cities after proper urban planning era
  if (useUrbanGrids && urban.length && year >= 1750) {
    // Pre-20th century: use brown roads for grids
    // 20th century+: use modern black roads
    const gridRoadType = useModernGrid ? PathType.MODERN_ROAD : PathType.ROAD;
    const gridRoadColor = useModernGrid ? MODERN_ROAD_COLOR : ROAD_STROKE_COLOR;
    const gridRoadWidth = useModernGrid ? MODERN_ROAD_WIDTH : ROAD_STROKE_WIDTH_BASE;
    const gridOpacity = useModernGrid ? MODERN_ROAD_OPACITY : ROAD_OPACITY * 0.6; // Reduce opacity for grid roads
    
    // Helper to check if tile has important structure
    const hasImportantStructure = (x: number, y: number): boolean => {
      if (!inBounds(x, y)) return false;
      const tile = tiles[y][x];
      // Skip tiles with marketplaces, palaces, holy sites, government districts
      if ([BiomeType.MARKETPLACE, BiomeType.PALACE, BiomeType.GOVERNMENT_DISTRICT].includes(tile.biome)) {
        return true;
      }
      // Check for terrain structures
      if (mapData.terrainStructures?.some(s => s.location[0] === x && s.location[1] === y)) {
        return true;
      }
      return false;
    };
    
    const clusters = findCityClusters(urban, tiles);
    for (const cluster of clusters) {
      const b = getClusterBounds(cluster);
      const gridSpacing = 4;
      
      // major boulevards - break into segments to avoid structures
      for (let i = 1; i <= 2; i++) {
        const y = b.minY + Math.floor(((b.maxY - b.minY) / 3) * i);
        let pts: Point[] = [];
        for (let x = b.minX; x <= b.maxX; x++) {
          // If we hit a structure, emit the current segment and start a new one
          if (hasImportantStructure(x, y)) {
            if (pts.length > 1) {
              const d = svgFromRow(pts);
              mapData.pathObjects!.push({
                id: `boulevard-h-${pathIdCounter++}`, type: gridRoadType,
                svgD: d, strokeWidth: gridRoadWidth * 1.4, strokeColor: gridRoadColor, opacity: gridOpacity,
              });
            }
            pts = []; // Start new segment
          } else {
            pts.push({ x: x * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: y * TILE_SIZE_PX + TILE_SIZE_PX / 2 });
          }
        }
        // Emit final segment if any
        if (pts.length > 1) {
          const d = svgFromRow(pts);
          mapData.pathObjects!.push({
            id: `boulevard-h-${pathIdCounter++}`, type: gridRoadType,
            svgD: d, strokeWidth: gridRoadWidth * 1.4, strokeColor: gridRoadColor, opacity: gridOpacity,
          });
        }
      }
      
      // Vertical boulevards
      for (let i = 1; i <= 2; i++) {
        const x = b.minX + Math.floor(((b.maxX - b.minX) / 3) * i);
        let pts: Point[] = [];
        for (let y = b.minY; y <= b.maxY; y++) {
          if (hasImportantStructure(x, y)) {
            if (pts.length > 1) {
              const d = svgFromRow(pts);
              mapData.pathObjects!.push({
                id: `boulevard-v-${pathIdCounter++}`, type: gridRoadType,
                svgD: d, strokeWidth: gridRoadWidth * 1.4, strokeColor: gridRoadColor, opacity: gridOpacity,
              });
            }
            pts = [];
          } else {
            pts.push({ x: x * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: y * TILE_SIZE_PX + TILE_SIZE_PX / 2 });
          }
        }
        if (pts.length > 1) {
          const d = svgFromRow(pts);
          mapData.pathObjects!.push({
            id: `boulevard-v-${pathIdCounter++}`, type: gridRoadType,
            svgD: d, strokeWidth: gridRoadWidth * 1.4, strokeColor: gridRoadColor, opacity: gridOpacity,
          });
        }
      }
      
      // local grid streets
      for (let x = b.minX; x <= b.maxX; x += gridSpacing) {
        let pts: Point[] = [];
        for (let y = b.minY; y <= b.maxY; y++) {
          if (hasImportantStructure(x, y)) {
            if (pts.length > 1) {
              const d = svgFromRow(pts);
              mapData.pathObjects!.push({
                id: `street-v-${pathIdCounter++}`, type: gridRoadType,
                svgD: d, strokeWidth: gridRoadWidth * 0.85, strokeColor: gridRoadColor, opacity: gridOpacity,
              });
            }
            pts = [];
          } else {
            pts.push({ x: x * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: y * TILE_SIZE_PX + TILE_SIZE_PX / 2 });
          }
        }
        if (pts.length > 1) {
          const d = svgFromRow(pts);
          mapData.pathObjects!.push({
            id: `street-v-${pathIdCounter++}`, type: gridRoadType,
            svgD: d, strokeWidth: gridRoadWidth * 0.85, strokeColor: gridRoadColor, opacity: gridOpacity,
          });
        }
      }
      
      for (let y = b.minY; y <= b.maxY; y += gridSpacing) {
        let pts: Point[] = [];
        for (let x = b.minX; x <= b.maxX; x++) {
          if (hasImportantStructure(x, y)) {
            if (pts.length > 1) {
              const d = svgFromRow(pts);
              mapData.pathObjects!.push({
                id: `street-h-${pathIdCounter++}`, type: gridRoadType,
                svgD: d, strokeWidth: gridRoadWidth * 0.85, strokeColor: gridRoadColor, opacity: gridOpacity,
              });
            }
            pts = [];
          } else {
            pts.push({ x: x * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: y * TILE_SIZE_PX + TILE_SIZE_PX / 2 });
          }
        }
        if (pts.length > 1) {
          const d = svgFromRow(pts);
          mapData.pathObjects!.push({
            id: `street-h-${pathIdCounter++}`, type: gridRoadType,
            svgD: d, strokeWidth: gridRoadWidth * 0.85, strokeColor: gridRoadColor, opacity: gridOpacity,
          });
        }
      }
    }
  }

  /* --------- road/footpath network with snapping & bridges --------- */

  // occupancy grid for snapping
  const onNetwork = Array.from({ length: MAP_HEIGHT_TILES }, () => Array(MAP_WIDTH_TILES).fill(false));
  function stamp(path: Tile[]) { for (const t of path) onNetwork[t.y][t.x] = true; }

  function emitLinearFeature(kind: PathType, tilePath: Tile[], width: number, color: string, opacity: number, organic = false) {
    let pts = centersFromTiles(tilePath);
    if (organic) pts = displaceAlongNormal(pts, noise, 0.55, kind === PathType.PATH ? TILE_SIZE_PX * 0.22 : TILE_SIZE_PX * 0.12);
    const d = svgQuadratic(pts);

    // Subtle ground shadow for depth (not for rail)
    if (kind !== PathType.RAILROAD) {
      mapData.pathObjects!.push({
        id: `shadow-${pathIdCounter++}`, type: kind, svgD: d,
        strokeWidth: width + TILE_SIZE_PX * 0.02, strokeColor: ROAD_SHADOW, opacity: 0.2,
      } as any);
    }

    // Main stroke
    mapData.pathObjects!.push({
      id: `road-${pathIdCounter++}`, type: kind, svgD: d,
      strokeWidth: width, strokeColor: color, opacity,
    } as any);

    // Modern center highlight
    if (kind === PathType.MODERN_ROAD) {
      mapData.pathObjects!.push({
        id: `center-${pathIdCounter++}`, type: kind, svgD: d,
        strokeWidth: Math.max(1, width * 0.22), strokeColor: MODERN_CENTER_HILITE, opacity: 1.0,
      } as any);
    }

    // Bridge deck passes (only where the path actually steps over water)
    const waterSpans = contiguousWaterSegments(tilePath);
    for (const [s, e] of waterSpans) {
      const segPts = pts.slice(s, e + 1);
      if (segPts.length < 2) continue;
      const dd = svgQuadratic(segPts);
      mapData.pathObjects!.push({
        id: `bridge-shadow-${pathIdCounter++}`, type: kind, svgD: dd,
        strokeWidth: width + TILE_SIZE_PX * 0.10, strokeColor: BRIDGE_SHADOW, opacity: 0.28,
      } as any);
      mapData.pathObjects!.push({
        id: `bridge-${pathIdCounter++}`, type: kind, svgD: dd,
        strokeWidth: width * 1.04, strokeColor: BRIDGE_DECK_COLOR, opacity: 0.95,
      } as any);
      // Overpaint main color as very thin to tie the deck in visually
      mapData.pathObjects!.push({
        id: `bridge-top-${pathIdCounter++}`, type: kind, svgD: dd,
        strokeWidth: Math.max(1, width * 0.40), strokeColor: color, opacity,
      } as any);
    }
  }

  // Connect a pair via A* with snapping to existing network
  function connect(kind: PathType, a: Tile, b: Tile): Tile[] | null {
    const path = aStarSnapToNetwork(a, b, kind, tiles, onNetwork);
    if (!path || path.length < 2) return null;
    stamp(path);
    return path;
  }

  // Helper to check if a tile is near an urban area
  const isNearUrban = (tile: Tile, distance: number = 5): boolean => {
    for (let dy = -distance; dy <= distance; dy++) {
      for (let dx = -distance; dx <= distance; dx++) {
        const nx = tile.x + dx;
        const ny = tile.y + dy;
        if (inBounds(nx, ny)) {
          const nearbyTile = tiles[ny][nx];
          if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, 
               BiomeType.CITY_CENTER, BiomeType.GOVERNMENT_DISTRICT].includes(nearbyTile.biome)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Build backbone between major nodes (Prim-like)
  const hubs: Tile[] = [...urban, ...palaces, ...govt];
  if (hubs.length > 1) {
    const connected = new Set<Tile>();
    let cur = hubs.reduce((p, c) => (p.altitude > c.altitude ? p : c)); // start at a high/central hub
    connected.add(cur);
    const remaining = new Set(hubs.filter((h) => h !== cur));
    
    // Store major routes for potential highway conversion
    const majorRoutes: Tile[][] = [];
    
    while (remaining.size) {
      let bestPair: { t: Tile; to: Tile; d: number } | null = null;
      for (const t of connected) {
        for (const to of remaining) {
          const d = euclid(t, to);
          if (!bestPair || d < bestPair.d) bestPair = { t, to, d };
        }
      }
      if (!bestPair) break;
      const path = connect(PathType.ROAD, bestPair.t, bestPair.to);
      if (path) {
        majorRoutes.push(path);
        
        // In 20th century, major routes become highways
        if (useModernGrid && path.length > 10) {
          // This is a long-distance route - make it a highway
          emitLinearFeature(PathType.MODERN_ROAD, path, MODERN_ROAD_WIDTH * 1.2, MODERN_ROAD_COLOR, MODERN_ROAD_OPACITY, false);
        } else if (!useModernGrid || !isNearUrban(bestPair.t) || !isNearUrban(bestPair.to)) {
          // Only render brown roads if not in modern era near urban areas
          emitLinearFeature(PathType.ROAD, path, ROAD_STROKE_WIDTH_BASE, ROAD_STROKE_COLOR, ROAD_OPACITY, false);
        }
        connected.add(bestPair.to);
        remaining.delete(bestPair.to);
      } else {
        // If fails, just mark connected to avoid infinite loop
        connected.add(bestPair.to);
        remaining.delete(bestPair.to);
      }
    }
    
    // Add interstate highways in modern era - connect distant cities
    if (useModernGrid && urban.length > 2) {
      // Find pairs of distant cities for highway connections
      const cityPairs: Array<{from: Tile, to: Tile, dist: number}> = [];
      for (let i = 0; i < urban.length; i++) {
        for (let j = i + 1; j < urban.length; j++) {
          const dist = euclid(urban[i], urban[j]);
          if (dist > 30 && dist < 80) { // Medium to long distance
            cityPairs.push({from: urban[i], to: urban[j], dist});
          }
        }
      }
      
      // Sort by distance and connect top pairs with highways
      cityPairs.sort((a, b) => b.dist - a.dist);
      const highwayCount = Math.min(3, Math.floor(cityPairs.length / 2));
      for (let i = 0; i < highwayCount && i < cityPairs.length; i++) {
        const {from, to} = cityPairs[i];
        const path = connect(PathType.ROAD, from, to);
        if (path && path.length > 15) {
          // Major interstate highway
          emitLinearFeature(PathType.MODERN_ROAD, path, MODERN_ROAD_WIDTH * 1.5, MODERN_ROAD_COLOR, MODERN_ROAD_OPACITY, false);
        }
      }
    }
  }

  // Palace ↔ govt priority (use major width)
  for (const p of palaces) {
    for (const g of govt) {
      if (euclid(p, g) > 2) {
        const path = connect(PathType.ROAD, p, g);
        if (path) emitLinearFeature(PathType.ROAD, path, MAJOR_ROAD_WIDTH, ROAD_STROKE_COLOR, ROAD_OPACITY, false);
      }
    }
  }

  // Industrial nodes → nearest hub/network
  const industry = [...mills, ...mines, ...factories, ...lumber];
  for (const s of industry) {
    // nearest already-connected tile on network (scan small window)
    let best: Tile | null = null;
    let bestD = Infinity;
    for (let r = 1; r <= 12 && !best; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = s.x + dx, ny = s.y + dy;
        if (!inBounds(nx, ny)) continue;
        if (onNetwork[ny][nx]) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < bestD) { bestD = d; best = tiles[ny][nx]; }
        }
      }
    }
    if (!best && urban.length) {
      best = urban.reduce((p, c) => (euclid(s, c) < euclid(s, p) ? c : p), urban[0]);
    }
    if (!best) continue;
    const path = connect(PathType.ROAD, s, best);
    if (path) emitLinearFeature(PathType.ROAD, path, ROAD_STROKE_WIDTH_BASE, ROAD_STROKE_COLOR, ROAD_OPACITY, false);
  }

  // Hamlets / minor POIs → nearest network
  const minors = [...hamlets, ...ruins];
  for (const s of minors) {
    // Skip if in modern era and near urban area
    if (useModernGrid && isNearUrban(s)) continue;
    
    // connect to nearest network cell or city
    let target: Tile | null = null;
    let dBest = Infinity;
    for (let r = 1; r <= 12 && !target; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = s.x + dx, ny = s.y + dy;
        if (!inBounds(nx, ny)) continue;
        if (onNetwork[ny][nx]) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < dBest) { dBest = d; target = tiles[ny][nx]; }
        }
      }
    }
    if (!target && urban.length) {
      target = urban.reduce((p, c) => (euclid(s, c) < euclid(s, p) ? c : p), urban[0]);
    }
    if (!target) continue;

    // hamlet gets a minor road, ruins get a footpath
    const isHamlet = s.biome === BiomeType.HAMLET;
    const kind = isHamlet ? PathType.ROAD : PathType.PATH;
    const path = connect(kind, s, target);
    if (!path) continue;
    
    // Skip if path goes through urban areas in modern era
    if (useModernGrid && path.some(tile => isNearUrban(tile, 3))) continue;
    
    if (isHamlet) {
      emitLinearFeature(PathType.ROAD, path, MINOR_ROAD_WIDTH, ROAD_STROKE_COLOR, ROAD_OPACITY * 0.95, true);
    } else {
      emitLinearFeature(PathType.PATH, path, PATH_STROKE_WIDTH_BASE, PATH_STROKE_COLOR, PATH_OPACITY, true);
    }
  }

  // Farm footpaths (probabilistic)
  for (const f of farms) {
    if (noise.random() < 0.55) continue;
    
    // Skip if in modern era and near urban area
    if (useModernGrid && isNearUrban(f)) continue;
    
    // nearest hamlet or urban or network
    let target: Tile | null = null;
    let best = Infinity;
    const candidates = [...hamlets, ...urban];
    if (candidates.length) {
      for (const c of candidates) {
        const d = euclid(f, c);
        if (d < best) { best = d; target = c; }
      }
    } else {
      // fall back to nearest network cell
      for (let r = 1; r <= 10 && !target; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const nx = f.x + dx, ny = f.y + dy;
          if (!inBounds(nx, ny)) continue;
          if (onNetwork[ny][nx]) { target = tiles[ny][nx]; break; }
        }
      }
    }
    if (!target) continue;
    const path = connect(PathType.PATH, f, target);
    
    // Skip if path goes through urban areas in modern era  
    if (path && (!useModernGrid || !path.some(tile => isNearUrban(tile, 3)))) {
      emitLinearFeature(PathType.PATH, path, PATH_STROKE_WIDTH_BASE * 0.85, PATH_STROKE_COLOR, PATH_OPACITY * 0.9, true);
    }
  }

  /* ------------------------- Railroads (industrial/modern) ------------------------- */
  if (hasRailroads) {
    console.log(`[RoadGen] Generating railroads for era ${era} (year ${year})`);

    // STEP 1: Find railroad continuation points from neighboring maps
    const railroadContinuations = findRailroadContinuationPoints(neighboringEdges);

    // STEP 2: Connect continuation points across the map (cross-map trunk lines)
    if (railroadContinuations.length > 0) {
      console.log(`[RoadGen] Connecting ${railroadContinuations.length} cross-map railroad continuations`);

      for (let i = 0; i < railroadContinuations.length; i++) {
        const entryPoint = railroadContinuations[i];

        // Find exit point: either opposite edge or nearest other continuation point
        let exitPoint: Point | null = null;

        if (railroadContinuations.length > 1) {
          // Connect to another continuation point
          const otherPoints = railroadContinuations.filter((_, idx) => idx !== i);
          const nearest = otherPoints.reduce((best, curr) => {
            const distCurr = Math.hypot(curr.x - entryPoint.x, curr.y - entryPoint.y);
            const distBest = best ? Math.hypot(best.x - entryPoint.x, best.y - entryPoint.y) : Infinity;
            return distCurr < distBest ? curr : best;
          }, null as Point | null);
          exitPoint = nearest;
        } else {
          // Single continuation: route to opposite edge or nearest city
          if (entryPoint.y === 0) exitPoint = { x: entryPoint.x, y: MAP_HEIGHT_TILES - 1 };
          else if (entryPoint.y === MAP_HEIGHT_TILES - 1) exitPoint = { x: entryPoint.x, y: 0 };
          else if (entryPoint.x === 0) exitPoint = { x: MAP_WIDTH_TILES - 1, y: entryPoint.y };
          else if (entryPoint.x === MAP_WIDTH_TILES - 1) exitPoint = { x: 0, y: entryPoint.y };
        }

        if (exitPoint) {
          const entryTile = tiles[entryPoint.y][entryPoint.x];
          const exitTile = tiles[exitPoint.y][exitPoint.x];
          const path = aStarSnapToNetwork(entryTile, exitTile, PathType.RAILROAD, tiles, onNetwork);

          if (path) {
            const pts = centersFromTiles(path);
            const d = svgQuadratic(pts);

            // Use consistent sleeper + rail rendering
            mapData.pathObjects!.push({
              id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
              strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
            } as any);
            mapData.pathObjects!.push({
              id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
            } as any);
          }
        }
      }
    }

    // STEP 3: Generate map-spanning trunk lines
    const railroadNetwork = Array.from({ length: MAP_HEIGHT_TILES }, () => Array(MAP_WIDTH_TILES).fill(false));

    // Sort cities by population to find major hubs
    const sortedCities = [...urban].sort((a, b) => (b.population || 0) - (a.population || 0));

    // Create trunk lines connecting major cities across the entire map
    if (sortedCities.length >= 2) {
      // Connect the 2-3 largest cities with trunk lines
      const majorHubs = sortedCities.slice(0, Math.min(3, sortedCities.length));

      for (let i = 0; i < majorHubs.length - 1; i++) {
        const start = majorHubs[i];
        const end = majorHubs[i + 1];

        // Create long trunk line between major hubs
        const path = aStarSnapToNetwork(start, end, PathType.RAILROAD, tiles, railroadNetwork);
        if (!path || path.length < 5) continue;

        // Stamp this trunk line into railroad network
        for (const tile of path) railroadNetwork[tile.y][tile.x] = true;

        let pts = centersFromTiles(path);
        const d = svgQuadratic(pts);

        // Simple 2-layer railroad: brown ties + black rails
        // 1. Brown wooden sleepers (dashed, perpendicular appearance with butt caps)
        mapData.pathObjects!.push({
          id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
          strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
          strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`, // Thicker, more spaced sleepers
        } as any);

        // 2. Black steel rails on top
        mapData.pathObjects!.push({
          id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
          strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
        } as any);

        console.log(`[RoadGen] Created trunk line: ${path.length} tiles from ${start.cityName || 'City'} to ${end.cityName || 'City'}`);
      }

      // Add branch lines from smaller cities to nearest trunk
      const industrialDistricts = tiles.flat().filter(t =>
        t.biome === BiomeType.GOVERNMENT_DISTRICT ||
        t.structures?.some(s => s.structureType === 'factory' || s.structureType === 'mill')
      );
      const branchTargets = [...factories, ...mills, ...lumber, ...industrialDistricts];

      // Connect remaining cities to the railroad network
      for (const city of sortedCities.slice(3)) {
        // Find nearest point on existing railroad network
        let nearestRailTile: Tile | null = null;
        let minDist = Infinity;

        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
          for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            if (railroadNetwork[y][x]) {
              const dist = euclid(city, tiles[y][x]);
              if (dist < minDist && dist < 40) {
                minDist = dist;
                nearestRailTile = tiles[y][x];
              }
            }
          }
        }

        if (nearestRailTile) {
          const path = aStarSnapToNetwork(city, nearestRailTile, PathType.RAILROAD, tiles, railroadNetwork);
          if (path && path.length >= 3) {
            for (const tile of path) railroadNetwork[tile.y][tile.x] = true;

            let pts = centersFromTiles(path);
            const d = svgQuadratic(pts);

            mapData.pathObjects!.push({
              id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
              strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
            } as any);

            mapData.pathObjects!.push({
              id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
            } as any);
          }
        }
      }
    }

    // Add railroad stations at cities that have rail connections
    // Limit: Max 2 stations per map, separated by at least 20 tiles
    const MIN_STATION_SEPARATION = 20;
    const MAX_STATIONS = 2;
    const stationCandidates: Tile[] = [];

    // Find all cities with nearby railroads using the railroad network
    for (const city of urban) {
      let hasNearbyRail = false;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = city.x + dx, ny = city.y + dy;
          if (inBounds(nx, ny) && railroadNetwork[ny][nx]) {
            hasNearbyRail = true;
            break;
          }
        }
        if (hasNearbyRail) break;
      }

      if (hasNearbyRail) {
        stationCandidates.push(city);
      }
    }

    // Sort candidates by population (prefer larger cities)
    stationCandidates.sort((a, b) => (b.population || 0) - (a.population || 0));

    // Select stations with minimum separation requirement
    const selectedStations: Tile[] = [];
    for (const candidate of stationCandidates) {
      if (selectedStations.length >= MAX_STATIONS) break;

      // Check if this candidate is far enough from all selected stations
      const isFarEnough = selectedStations.every(station => {
        const distance = Math.hypot(candidate.x - station.x, candidate.y - station.y);
        return distance >= MIN_STATION_SEPARATION;
      });

      if (isFarEnough || selectedStations.length === 0) {
        selectedStations.push(candidate);
        candidate.biome = BiomeType.RAILROAD_STATION as any;
      }
    }

    console.log(`[RoadGen] Created ${selectedStations.length} railroad stations (max ${MAX_STATIONS}, min separation ${MIN_STATION_SEPARATION} tiles)`);

    // STEP 3.5: Extend railroads to map edges (ALWAYS!)
    // Find all railroad endpoints and extend them to nearest map edge
    const extendRailroadToEdge = (startTile: Tile, railNetwork: boolean[][]): void => {
      // Determine which edge is nearest
      const distanceToEdges = {
        north: startTile.y,
        south: MAP_HEIGHT_TILES - 1 - startTile.y,
        east: MAP_WIDTH_TILES - 1 - startTile.x,
        west: startTile.x
      };

      // Sort edges by distance and try each until we find a valid path
      const sortedEdges = Object.entries(distanceToEdges)
        .sort((a, b) => a[1] - b[1])
        .map(([edge]) => edge as 'north' | 'south' | 'east' | 'west');

      for (const edge of sortedEdges) {
        // Calculate target edge point
        let edgeX = startTile.x;
        let edgeY = startTile.y;

        switch (edge) {
          case 'north': edgeY = 0; break;
          case 'south': edgeY = MAP_HEIGHT_TILES - 1; break;
          case 'east': edgeX = MAP_WIDTH_TILES - 1; break;
          case 'west': edgeX = 0; break;
        }

        // Don't try to extend if already at edge
        if (edgeX === startTile.x && edgeY === startTile.y) continue;

        const edgeTile = tiles[edgeY][edgeX];
        const extensionPath = aStarSnapToNetwork(startTile, edgeTile, PathType.RAILROAD, tiles, railNetwork);

        if (extensionPath && extensionPath.length >= 3) {
          // Stamp extension into railroad network
          for (const tile of extensionPath) railNetwork[tile.y][tile.x] = true;

          let pts = centersFromTiles(extensionPath);

          // CRITICAL FIX: ALWAYS extend past the TARGET edge, regardless of where path actually ends
          // This ensures visual edge crossing even if A* didn't quite reach the edge tile
          const lastPoint = pts[pts.length - 1];

          // Force extension in the direction of the target edge
          switch (edge) {
            case 'north':
              // Always extend north past y=0
              pts.push({ x: lastPoint.x, y: -TILE_SIZE_PX * 0.5 });
              break;
            case 'south':
              // Always extend south past y=MAP_HEIGHT-1
              pts.push({ x: lastPoint.x, y: (MAP_HEIGHT_TILES - 0.5) * TILE_SIZE_PX });
              break;
            case 'east':
              // Always extend east past x=MAP_WIDTH-1
              pts.push({ x: (MAP_WIDTH_TILES - 0.5) * TILE_SIZE_PX, y: lastPoint.y });
              break;
            case 'west':
              // Always extend west past x=0
              pts.push({ x: -TILE_SIZE_PX * 0.5, y: lastPoint.y });
              break;
          }

          const d = svgQuadratic(pts);

          // Render railroad extension
          mapData.pathObjects!.push({
            id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
            strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
            strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
          } as any);

          mapData.pathObjects!.push({
            id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
            strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
          } as any);

          console.log(`[RoadGen] Extended railroad ${extensionPath.length} tiles to ${edge} edge`);
          return; // Successfully extended, don't try other edges
        }
      }
    };

    // Extend trunk lines to edges
    if (sortedCities.length >= 2) {
      const majorHubs = sortedCities.slice(0, Math.min(3, sortedCities.length));

      // Extend from each major hub to an edge
      for (const hub of majorHubs) {
        extendRailroadToEdge(hub, railroadNetwork);
      }
    }

    // STEP 3.6: Industrial railroad logic (post-1880)
    // If map has mills/mines/factories after 1880, create railroad lines to map edge
    const currentYear = mapData.timeSlice ? parseInt(mapData.timeSlice.split(',')[0]) : 1500;

    if (currentYear >= 1880) {
      const industrialBuildings = [...mills, ...mines, ...factories, ...lumber];

      if (industrialBuildings.length > 0) {
        console.log(`[RoadGen] Post-1880 map with ${industrialBuildings.length} industrial buildings - creating industrial railroads`);

        // Strategy: Create cross-map trunk lines that pass through industrial sites
        // Group industrial buildings by horizontal/vertical proximity
        const horizontalCandidates = industrialBuildings.filter(b => {
          const midY = MAP_HEIGHT_TILES / 2;
          return Math.abs(b.y - midY) < MAP_HEIGHT_TILES / 3;
        });

        const verticalCandidates = industrialBuildings.filter(b => {
          const midX = MAP_WIDTH_TILES / 2;
          return Math.abs(b.x - midX) < MAP_WIDTH_TILES / 3;
        });

        // Create horizontal cross-map line if we have horizontally-aligned buildings
        if (horizontalCandidates.length > 0) {
          const avgY = Math.floor(horizontalCandidates.reduce((sum, b) => sum + b.y, 0) / horizontalCandidates.length);
          const westEdge = tiles[avgY][0];
          const eastEdge = tiles[avgY][MAP_WIDTH_TILES - 1];

          const horizontalPath = aStarSnapToNetwork(westEdge, eastEdge, PathType.RAILROAD, tiles, railroadNetwork);

          if (horizontalPath && horizontalPath.length >= 10) {
            for (const tile of horizontalPath) railroadNetwork[tile.y][tile.x] = true;

            let pts = centersFromTiles(horizontalPath);

            // Extend to BOTH edges (west and east) - use exact edge tile coordinates for proper edge detection
            const firstPoint = pts[0];
            const lastPoint = pts[pts.length - 1];

            // Prepend extension to west edge (tile 0)
            pts.unshift({ x: 0, y: firstPoint.y });

            // Append extension to east edge (tile MAP_WIDTH_TILES - 1)
            pts.push({ x: (MAP_WIDTH_TILES - 1) * TILE_SIZE_PX, y: lastPoint.y });

            const d = svgQuadratic(pts);

            mapData.pathObjects!.push({
              id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
              strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
            } as any);

            mapData.pathObjects!.push({
              id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
            } as any);

            console.log(`[RoadGen] Created horizontal cross-map industrial railroad: ${horizontalPath.length} tiles`);
          }
        }

        // Create vertical cross-map line if we have vertically-aligned buildings
        if (verticalCandidates.length > 0) {
          const avgX = Math.floor(verticalCandidates.reduce((sum, b) => sum + b.x, 0) / verticalCandidates.length);
          const northEdge = tiles[0][avgX];
          const southEdge = tiles[MAP_HEIGHT_TILES - 1][avgX];

          const verticalPath = aStarSnapToNetwork(northEdge, southEdge, PathType.RAILROAD, tiles, railroadNetwork);

          if (verticalPath && verticalPath.length >= 10) {
            for (const tile of verticalPath) railroadNetwork[tile.y][tile.x] = true;

            let pts = centersFromTiles(verticalPath);

            // Extend to BOTH edges (north and south) - use exact edge tile coordinates for proper edge detection
            const firstPoint = pts[0];
            const lastPoint = pts[pts.length - 1];

            // Prepend extension to north edge (tile 0)
            pts.unshift({ x: firstPoint.x, y: 0 });

            // Append extension to south edge (tile MAP_HEIGHT_TILES - 1)
            pts.push({ x: lastPoint.x, y: (MAP_HEIGHT_TILES - 1) * TILE_SIZE_PX });

            const d = svgQuadratic(pts);

            mapData.pathObjects!.push({
              id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
              strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
            } as any);

            mapData.pathObjects!.push({
              id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
              strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
            } as any);

            console.log(`[RoadGen] Created vertical cross-map industrial railroad: ${verticalPath.length} tiles`);
          }
        }

        // CRITICAL: Connect ALL industrial buildings to railroads, not just isolated ones
        for (const building of industrialBuildings) {
          // Check if building is already ON or immediately adjacent to a railroad (within 2 tiles)
          let nearRailroad = false;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = building.x + dx, ny = building.y + dy;
              if (inBounds(nx, ny) && railroadNetwork[ny][nx]) {
                nearRailroad = true;
                break;
              }
            }
            if (nearRailroad) break;
          }

          // If NOT already connected to railroad network, create spur line
          if (!nearRailroad) {
            // Find nearest railroad tile
            let nearestRailTile: Tile | null = null;
            let minDist = Infinity;

            for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
              for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                if (railroadNetwork[y][x]) {
                  const dist = Math.hypot(building.x - x, building.y - y);
                  if (dist < minDist) {
                    minDist = dist;
                    nearestRailTile = tiles[y][x];
                  }
                }
              }
            }

            // If there's no existing railroad network at all, connect to edge
            if (!nearestRailTile || minDist > 30) {
              extendRailroadToEdge(building, railroadNetwork);
            } else {
              // Create spur line to existing railroad
              const spurPath = aStarSnapToNetwork(building, nearestRailTile, PathType.RAILROAD, tiles, railroadNetwork);

              if (spurPath && spurPath.length >= 2) {
                for (const tile of spurPath) railroadNetwork[tile.y][tile.x] = true;

                const pts = centersFromTiles(spurPath);
                const d = svgQuadratic(pts);

                mapData.pathObjects!.push({
                  id: `rail-ties-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
                  strokeWidth: RAILROAD_WIDTH * 3.5, strokeColor: '#4a3c28', opacity: 0.9,
                  strokeDasharray: `${TILE_SIZE_PX * 0.15} ${TILE_SIZE_PX * 0.25}`,
                } as any);

                mapData.pathObjects!.push({
                  id: `rail-${pathIdCounter++}`, type: PathType.RAILROAD, svgD: d,
                  strokeWidth: RAILROAD_WIDTH * 1.2, strokeColor: '#2a2a2a', opacity: 0.95,
                } as any);

                console.log(`[RoadGen] Connected industrial building at (${building.x}, ${building.y}) to railroad network`);
              }
            }
          }
        }
      }
    }

    // STEP 4: Detect railroad junctions for signal lights
    mapData.railroadJunctions = [];
    const junctionCandidates = new Map<string, number>(); // key -> count

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        if (!railroadNetwork[y][x]) continue;

        // Count adjacent railroad tiles
        let adjacentCount = 0;
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dx, dy] of directions) {
          const nx = x + dx, ny = y + dy;
          if (inBounds(nx, ny) && railroadNetwork[ny][nx]) {
            adjacentCount++;
          }
        }

        // Junction = 3+ adjacent railroad tiles (T-junction or cross)
        if (adjacentCount >= 3) {
          junctionCandidates.set(`${x},${y}`, adjacentCount);
        }
      }
    }

    // Add junctions with some spacing (min 10 tiles apart)
    const MIN_JUNCTION_SEPARATION = 10;
    for (const [key, _] of junctionCandidates) {
      const [x, y] = key.split(',').map(Number);

      // Check if too close to existing junction
      const tooClose = mapData.railroadJunctions.some(j => {
        const dist = Math.hypot(j.x - x, j.y - y);
        return dist < MIN_JUNCTION_SEPARATION;
      });

      if (!tooClose) {
        mapData.railroadJunctions.push({ x, y });
      }
    }

    console.log(`[RoadGen] Detected ${mapData.railroadJunctions.length} railroad junctions for signal lights`);

    // STEP 5: Generate trains on railroad routes
    mapData.trains = [];

    // Create trains on trunk lines (1-2 trains per major route)
    if (sortedCities.length >= 2) {
      const majorHubs = sortedCities.slice(0, Math.min(3, sortedCities.length));

      for (let i = 0; i < majorHubs.length - 1; i++) {
        const start = majorHubs[i];
        const end = majorHubs[i + 1];

        // Find railroad path between these hubs
        const trainPath: Array<{x: number; y: number}> = [];
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
          for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            if (railroadNetwork[y][x]) {
              // Check if this tile is on the route between start and end
              const distToStart = Math.hypot(x - start.x, y - start.y);
              const distToEnd = Math.hypot(x - end.x, y - end.y);
              const directDist = Math.hypot(end.x - start.x, end.y - start.y);

              // If tile is roughly on the line between start and end
              if (Math.abs(distToStart + distToEnd - directDist) < 5) {
                trainPath.push({ x, y });
              }
            }
          }
        }

        // Sort path by distance from start
        trainPath.sort((a, b) => {
          const distA = Math.hypot(a.x - start.x, a.y - start.y);
          const distB = Math.hypot(b.x - start.x, b.y - start.y);
          return distA - distB;
        });

        if (trainPath.length > 10) {
          mapData.trains.push({
            id: `train-${i}`,
            path: trainPath,
            currentProgress: Math.random(), // Random starting position
            speed: 0.5, // 0.5 tiles per second
            direction: 1
          });
        }
      }
    }

    console.log(`[RoadGen] Created ${mapData.trains.length} trains on railroad routes`);

    // Count total railroad path objects for performance monitoring
    const railroadPaths = mapData.pathObjects?.filter(p => p.type === PathType.RAILROAD) || [];
    console.log(`[RoadGen] ⚡ Total railroad path objects: ${railroadPaths.length} (${railroadPaths.length / 2} railroad segments)`);

    // STEP 6: Record railroad edge data for neighboring maps
    recordRailroadEdges(mapData);
  }
}
