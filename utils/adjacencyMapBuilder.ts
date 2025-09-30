/**
 * Build a proper hex map using adjacency data
 * Areas are positioned based on their actual connections
 */

import { ADJACENCIES } from '../constants/gameData/adjacencies';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export interface HexPosition {
  name: string;
  x: number;
  y: number;
  type: 'area' | 'liminal' | 'ocean';
  region?: string;
  zone?: string;
  climate?: string;
}

interface QueueItem {
  area: string;
  x: number;
  y: number;
  from?: string;
}

/**
 * Build hex positions based on adjacency connections
 */
export function buildAdjacencyMap(): HexPosition[] {
  const positions: HexPosition[] = [];
  const placed = new Map<string, { x: number; y: number }>();
  const queue: QueueItem[] = [];

  // Get area metadata
  const areaMetadata = new Map<string, { region: string; zone: string; climate: string }>();
  Object.entries(GEOGRAPHICAL_DATA).forEach(([zone, zoneData]) => {
    Object.entries(zoneData).forEach(([regionName, regionData]) => {
      if (typeof regionData === 'object' && !Array.isArray(regionData)) {
        Object.entries(regionData).forEach(([areaKey, area]) => {
          if (area && typeof area === 'object' && 'name' in area) {
            areaMetadata.set(area.name, {
              region: regionName,
              zone: zone,
              climate: area.climate || 'temperate'
            });
          }
        });
      }
    });
  });

  // Seed positions for major regions (spread across the world)
  const seeds: QueueItem[] = [
    // Europe
    { area: 'London', x: 50, y: 30 },
    { area: 'Paris Basin', x: 55, y: 35 },
    { area: 'Roman Campagna', x: 60, y: 40 },
    { area: 'Berlin', x: 65, y: 32 },
    { area: 'Stockholm Archipelago', x: 68, y: 25 },
    { area: 'Madrid', x: 52, y: 42 },

    // MENA
    { area: 'Cairo', x: 75, y: 45 },
    { area: 'Jerusalem Hills', x: 78, y: 43 },
    { area: 'Baghdad', x: 82, y: 42 },
    { area: 'Mecca', x: 80, y: 48 },

    // Africa
    { area: 'Timbuktu Basin', x: 55, y: 55 },
    { area: 'Gold Coast Savanna', x: 52, y: 60 },
    { area: 'Swahili Coast', x: 75, y: 65 },
    { area: 'Cape Coast', x: 65, y: 75 },

    // Asia
    { area: 'Beijing Basin', x: 100, y: 35 },
    { area: 'Edo Plain', x: 115, y: 37 },
    { area: 'Delhi Region', x: 90, y: 45 },
    { area: 'Gangetic Plain', x: 95, y: 47 },
    { area: 'Mekong River Basin', x: 105, y: 52 },

    // Americas
    { area: 'Hudson River Valley', x: 20, y: 35 },
    { area: 'Valley of Mexico', x: 15, y: 50 },
    { area: 'Amazon Basin', x: 25, y: 65 },
    { area: 'Cuzco Valley', x: 22, y: 70 },

    // Oceania
    { area: 'Sydney Basin', x: 115, y: 70 },
    { area: 'Canterbury Plains', x: 125, y: 75 }
  ];

  // Start with seed areas
  seeds.forEach(seed => {
    if (ADJACENCIES[seed.area]) {
      queue.push(seed);
      placed.set(seed.area, { x: seed.x, y: seed.y });

      const meta = areaMetadata.get(seed.area);
      positions.push({
        name: seed.area,
        x: seed.x,
        y: seed.y,
        type: 'area',
        region: meta?.region,
        zone: meta?.zone,
        climate: meta?.climate
      });
    }
  });

  // Direction offsets for hex grid (flat-top orientation)
  const getNeighborPos = (x: number, y: number, direction: string): { x: number; y: number } => {
    // Even columns
    if (x % 2 === 0) {
      switch(direction) {
        case 'N': return { x, y: y - 1 };
        case 'S': return { x, y: y + 1 };
        case 'E': return { x: x + 1, y };
        case 'W': return { x: x - 1, y };
        case 'NE': return { x: x + 1, y: y - 1 };
        case 'NW': return { x: x - 1, y: y - 1 };
        case 'SE': return { x: x + 1, y };
        case 'SW': return { x: x - 1, y };
        default: return { x, y };
      }
    } else {
      // Odd columns (offset down)
      switch(direction) {
        case 'N': return { x, y: y - 1 };
        case 'S': return { x, y: y + 1 };
        case 'E': return { x: x + 1, y };
        case 'W': return { x: x - 1, y };
        case 'NE': return { x: x + 1, y };
        case 'NW': return { x: x - 1, y };
        case 'SE': return { x: x + 1, y: y + 1 };
        case 'SW': return { x: x - 1, y: y + 1 };
        default: return { x, y };
      }
    }
  };

  // Process queue - breadth-first placement
  let processed = new Set<string>();
  let liminalCounter = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (processed.has(current.area)) continue;
    processed.add(current.area);

    const adjacency = ADJACENCIES[current.area];
    if (!adjacency) continue;

    // Check each direction
    ['N', 'S', 'E', 'W'].forEach(dir => {
      const neighbor = adjacency[dir as 'N' | 'S' | 'E' | 'W'];
      if (!neighbor) return;

      // Handle LIMINAL zones - create buffer hex
      if (neighbor.startsWith('LIMINAL')) {
        const liminalPos = getNeighborPos(current.x, current.y, dir);
        const liminalName = `${neighbor}_${liminalCounter++}`;

        if (!placed.has(liminalName)) {
          placed.set(liminalName, liminalPos);
          positions.push({
            name: liminalName,
            x: liminalPos.x,
            y: liminalPos.y,
            type: 'liminal'
          });
        }
        return;
      }

      // Regular area placement
      if (placed.has(neighbor)) {
        // Already placed - check if we need to adjust position
        return;
      }

      // Calculate position for this neighbor
      const newPos = getNeighborPos(current.x, current.y, dir);

      // Check if this position conflicts with another area
      const conflict = positions.find(p => p.x === newPos.x && p.y === newPos.y);

      if (!conflict) {
        // Place the area
        placed.set(neighbor, newPos);

        const meta = areaMetadata.get(neighbor);
        const isWater = neighbor.includes('Sea') || neighbor.includes('Ocean') ||
                       neighbor.includes('Bay') || neighbor.includes('Strait') ||
                       neighbor.includes('Channel') || neighbor.includes('Gulf');

        positions.push({
          name: neighbor,
          x: newPos.x,
          y: newPos.y,
          type: isWater ? 'ocean' : 'area',
          region: meta?.region,
          zone: meta?.zone,
          climate: meta?.climate || (isWater ? 'oceanic' : 'temperate')
        });

        // Add to queue to process its neighbors
        queue.push({
          area: neighbor,
          x: newPos.x,
          y: newPos.y,
          from: current.area
        });
      } else {
        // Position conflict - find nearest free spot
        let found = false;
        for (let radius = 1; radius <= 3 && !found; radius++) {
          const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          for (const altDir of directions) {
            const altPos = getNeighborPos(current.x, current.y, altDir);
            const altConflict = positions.find(p => p.x === altPos.x && p.y === altPos.y);

            if (!altConflict) {
              placed.set(neighbor, altPos);

              const meta = areaMetadata.get(neighbor);
              const isWater = neighbor.includes('Sea') || neighbor.includes('Ocean');

              positions.push({
                name: neighbor,
                x: altPos.x,
                y: altPos.y,
                type: isWater ? 'ocean' : 'area',
                region: meta?.region,
                zone: meta?.zone,
                climate: meta?.climate || (isWater ? 'oceanic' : 'temperate')
              });

              queue.push({
                area: neighbor,
                x: altPos.x,
                y: altPos.y,
                from: current.area
              });

              found = true;
              break;
            }
          }
        }
      }
    });
  }

  return positions;
}

/**
 * Get region boundaries for drawing outlines
 */
export function getRegionBoundaries(positions: HexPosition[]): Map<string, HexPosition[]> {
  const regions = new Map<string, HexPosition[]>();

  positions.forEach(pos => {
    if (pos.region && pos.type === 'area') {
      if (!regions.has(pos.region)) {
        regions.set(pos.region, []);
      }
      regions.get(pos.region)!.push(pos);
    }
  });

  return regions;
}