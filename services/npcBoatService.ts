/**
 * services/npcBoatService.ts - Manages animated NPC boats that travel between harbors and fishing huts
 * Features curved paths and strict water-only navigation
 */

import { MapData, Tile, BiomeType, TerrainStructure } from '../types';

export interface NPCBoat {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  rotation: number;
  boatType: 'fishing' | 'cargo' | 'ferry';
  era: string;
  culture: string;
  progress: number; // 0-1 for journey completion
  path: Array<[number, number]>; // Waypoints for curved path
  currentSegment: number; // Current path segment
  size: number; // Size multiplier (1.0 to 2.0)
}

class NPCBoatService {
  private boats: NPCBoat[] = [];
  private maxBoats = 3;
  private mapData: MapData | null = null;
  private structures: TerrainStructure[] = [];
  private lastUpdate = Date.now();

  initialize(mapData: MapData, structures: TerrainStructure[]) {
    console.log('[NPCBoatService] Initializing with structures:', structures.length);
    this.mapData = mapData;
    this.structures = structures;
    this.boats = [];
    this.spawnInitialBoats();
  }

  private isWaterTile(x: number, y: number, allowBeach: boolean = false): boolean {
    if (!this.mapData || x < 0 || y < 0 || 
        y >= this.mapData.tiles.length || 
        x >= this.mapData.tiles[0].length) {
      return false;
    }
    
    const tile = this.mapData.tiles[y][x];
    
    // STRICT water check - only true water tiles for paths
    // Beach allowed only for destination finding, not paths
    if (tile.biome === BiomeType.SHALLOW_OCEAN ||
        tile.biome === BiomeType.DEEP_OCEAN ||
        tile.biome === BiomeType.RIVER ||
        tile.biome === BiomeType.MAJOR_RIVER ||
        tile.biome === BiomeType.FRESHWATER_LAKE ||
        tile.biome === BiomeType.ESTUARY) {
      return true;
    }
    
    // Allow beach tiles only when explicitly requested (for finding water near fishing huts)
    if (allowBeach && tile.biome === BiomeType.BEACH) {
      return true;
    }
    
    // Special case: harbor districts and adjacent tiles only
    if (tile.biome === BiomeType.HARBOR_DISTRICT) {
      return true;
    }
    
    // Strictly check isLand flag - must be false AND not a land biome
    if (!tile.isLand && 
        tile.biome !== BiomeType.GRASSLAND &&
        tile.biome !== BiomeType.FOREST &&
        tile.biome !== BiomeType.TEMPERATE_FOREST &&
        tile.biome !== BiomeType.CONIFEROUS_FOREST &&
        tile.biome !== BiomeType.DECIDUOUS_FOREST &&
        tile.biome !== BiomeType.TROPICAL_FOREST &&
        tile.biome !== BiomeType.SAVANNA &&
        tile.biome !== BiomeType.DESERT &&
        tile.biome !== BiomeType.ROCKY_PEAKS &&
        tile.biome !== BiomeType.ALPINE_MEADOW &&
        tile.biome !== BiomeType.TAIGA &&
        tile.biome !== BiomeType.TUNDRA) {
      return true;
    }
    
    return false;
  }

  private generateCurvedPath(start: [number, number], end: [number, number]): Array<[number, number]> | null {
    if (!this.mapData) return null;
    
    const path: Array<[number, number]> = [];
    const segments = 30; // More segments for smoother curves
    
    // Calculate the midpoint
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    
    // Calculate perpendicular offset for curve
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular vector (rotated 90 degrees)
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Curve amount (20% of distance for gentle arc)
    const curveAmount = distance * 0.2;
    const controlX = midX + perpX * curveAmount;
    const controlY = midY + perpY * curveAmount;
    
    // Generate quadratic Bezier curve points
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      
      // Bezier formula: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const x = Math.floor(mt2 * start[0] + 2 * mt * t * controlX + t2 * end[0]);
      const y = Math.floor(mt2 * start[1] + 2 * mt * t * controlY + t2 * end[1]);
      
      // Check if this point is on water
      if (!this.isWaterTile(x, y)) {
        // Try the opposite curve direction
        const altControlX = midX - perpX * curveAmount;
        const altControlY = midY - perpY * curveAmount;
        
        const altX = Math.floor(mt2 * start[0] + 2 * mt * t * altControlX + t2 * end[0]);
        const altY = Math.floor(mt2 * start[1] + 2 * mt * t * altControlY + t2 * end[1]);
        
        if (!this.isWaterTile(altX, altY)) {
          // Neither curve works, path is blocked
          console.log('[NPCBoatService] Path blocked at', x, y, '- tile is land');
          return null;
        }
        
        // Use the alternative curve point
        path.push([altX, altY]);
      } else {
        path.push([x, y]);
      }
    }
    
    // Verify entire path is on water
    const allWater = path.every(([x, y]) => this.isWaterTile(x, y));
    if (!allWater) {
      console.log('[NPCBoatService] Path contains non-water tiles, rejecting');
      return null;
    }
    
    return path;
  }

  private findNearestWaterTile(x: number, y: number, maxDistance: number = 3): [number, number] | null {
    // If the tile itself is water, return it
    if (this.isWaterTile(x, y)) {
      return [x, y];
    }
    
    // Search in expanding circles for nearest water
    for (let dist = 1; dist <= maxDistance; dist++) {
      for (let dy = -dist; dy <= dist; dy++) {
        for (let dx = -dist; dx <= dist; dx++) {
          // Only check tiles at exactly this distance (perimeter)
          if (Math.abs(dx) !== dist && Math.abs(dy) !== dist) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          if (this.isWaterTile(nx, ny)) {
            return [nx, ny];
          }
        }
      }
    }
    
    return null;
  }

  private spawnInitialBoats() {
    if (!this.mapData) {
      console.log('[NPCBoatService] No mapData, cannot spawn boats');
      return;
    }

    // Find all harbor district tiles and map to nearest water
    const harborTiles: Array<{location: [number, number], type: string}> = [];
    for (let y = 0; y < this.mapData.tiles.length; y++) {
      for (let x = 0; x < this.mapData.tiles[y].length; x++) {
        const tile = this.mapData.tiles[y][x];
        if (tile.biome === BiomeType.HARBOR_DISTRICT) {
          // Find nearest water tile for harbor spawn point
          const waterTile = this.findNearestWaterTile(x, y, 5);
          if (waterTile) {
            harborTiles.push({ location: waterTile, type: 'harbor' });
            console.log('[NPCBoatService] Harbor at', x, y, 'boats spawn at water', waterTile);
          }
        }
      }
    }

    // Find all fishing huts from structures and get their nearest water tiles
    const fishingHuts = this.structures.filter(s => 
      s.structureType === 'fishing_hut' && s.state === 'active'
    ).map(s => {
      const waterTile = this.findNearestWaterTile(s.location[0], s.location[1], 5);
      if (waterTile) {
        console.log('[NPCBoatService] Fishing hut at', s.location, 'using water tile at', waterTile);
        return { location: waterTile, type: 'fishing_hut', originalLocation: s.location };
      } else {
        console.log('[NPCBoatService] No water found near fishing hut at', s.location);
        return null;
      }
    }).filter(h => h !== null) as Array<{location: [number, number], type: string, originalLocation?: [number, number]}>;

    console.log('[NPCBoatService] Found harbor spawn points:', harborTiles.length, 'fishing huts with water access:', fishingHuts.length);

    // Need at least one spawn point
    const spawnPoints = [...harborTiles, ...fishingHuts];
    if (spawnPoints.length < 1) {
      console.log('[NPCBoatService] No valid spawn points found');
      return;
    }

    // Spawn up to maxBoats boats
    const boatsToSpawn = Math.min(this.maxBoats, Math.max(1, spawnPoints.length));
    console.log('[NPCBoatService] Attempting to spawn', boatsToSpawn, 'boats');
    
    for (let i = 0; i < boatsToSpawn; i++) {
      const spawn = spawnPoints[i % spawnPoints.length];
      
      // For fishing boats, create a simple patrol pattern
      if (spawn.type === 'fishing_hut' || (spawn.type === 'harbor' && Math.random() < 0.5)) {
        const patrolPath = this.generateFishingPatrol(spawn.location);
        if (patrolPath) {
          const boat = this.createFishingBoat(spawn, patrolPath);
          this.boats.push(boat);
          console.log('[NPCBoatService] Created fishing boat:', boat.id, 'with patrol pattern');
        }
      } else {
        // For cargo/ferry boats, find a destination
        const destinations = spawnPoints.filter(d => d !== spawn);
        if (destinations.length > 0) {
          const end = destinations[Math.floor(Math.random() * destinations.length)];
          const path = this.generateCurvedPath(spawn.location, end.location);
          if (path) {
            const boat = this.createBoat(spawn, end, path);
            this.boats.push(boat);
            console.log('[NPCBoatService] Created transport boat:', boat.id, 'type:', boat.boatType);
          }
        }
      }
    }
    
    console.log('[NPCBoatService] Total boats spawned:', this.boats.length);
  }

  private generateFishingPatrol(origin: [number, number]): Array<[number, number]> | null {
    if (!this.mapData) return null;
    
    const path: Array<[number, number]> = [];
    const patrolRadius = 8 + Math.floor(Math.random() * 8); // 8-16 tiles
    const points = 3 + Math.floor(Math.random() * 3); // 3-5 waypoints
    
    // Start at origin
    path.push(origin);
    
    // Generate random patrol points in water
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2 + Math.random() * 0.5;
      const dist = patrolRadius * (0.5 + Math.random() * 0.5);
      const px = Math.floor(origin[0] + Math.cos(angle) * dist);
      const py = Math.floor(origin[1] + Math.sin(angle) * dist);
      
      // Only add if it's water
      if (this.isWaterTile(px, py)) {
        path.push([px, py]);
      }
    }
    
    // Return to origin
    path.push(origin);
    
    // Need at least 3 points for a valid patrol
    if (path.length < 3) return null;
    
    // Create smooth path between waypoints
    const smoothPath: Array<[number, number]> = [];
    for (let i = 0; i < path.length - 1; i++) {
      const segment = this.generateCurvedPath(path[i], path[i + 1]);
      if (segment) {
        smoothPath.push(...segment.slice(0, -1)); // Avoid duplicating endpoints
      }
    }
    
    return smoothPath.length > 0 ? smoothPath : null;
  }

  private createFishingBoat(
    spawn: {location: [number, number], type: string},
    path: Array<[number, number]>
  ): NPCBoat {
    // Calculate initial rotation based on first path segment
    const dx = path.length > 1 ? path[1][0] - path[0][0] : 0;
    const dy = path.length > 1 ? path[1][1] - path[0][1] : 0;
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

    // Fishing boats are smaller and faster
    const size = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

    return {
      id: `boat-${Date.now()}-${Math.random()}`,
      x: spawn.location[0],
      y: spawn.location[1],
      targetX: spawn.location[0], // Will loop back
      targetY: spawn.location[1],
      speed: 0.08 + Math.random() * 0.04, // Faster: 0.08-0.12
      rotation,
      boatType: 'fishing',
      era: this.mapData?.era || 'medieval',
      culture: this.mapData?.mapAreaName || 'generic',
      progress: 0,
      path,
      currentSegment: 0,
      size
    };
  }

  private createBoat(
    start: {location: [number, number], type: string}, 
    end: {location: [number, number], type: string},
    path: Array<[number, number]>
  ): NPCBoat {
    const types: NPCBoat['boatType'][] = ['fishing', 'cargo', 'ferry'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Calculate initial rotation based on first path segment
    const dx = path[1][0] - path[0][0];
    const dy = path[1][1] - path[0][1];
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

    // Much faster speeds for visible movement
    let baseSpeed = 0.10; // Base tripled
    if (type === 'fishing') baseSpeed = 0.12;
    else if (type === 'cargo') baseSpeed = 0.08;
    else if (type === 'ferry') baseSpeed = 0.15;
    
    // Random size variation (0.75 to 1.5 for better visibility)
    const size = 0.75 + Math.random() * 0.75;

    return {
      id: `boat-${Date.now()}-${Math.random()}`,
      x: start.location[0],
      y: start.location[1],
      targetX: end.location[0],
      targetY: end.location[1],
      speed: baseSpeed + Math.random() * 0.02, // More speed variation
      rotation,
      boatType: type,
      era: this.mapData?.era || 'medieval',
      culture: this.mapData?.mapAreaName || 'generic',
      progress: 0,
      path,
      currentSegment: 0,
      size
    };
  }

  update(): NPCBoat[] {
    const now = Date.now();
    const deltaTime = Math.min((now - this.lastUpdate) / 1000, 0.1); // Cap deltaTime to prevent jumps
    this.lastUpdate = now;

    // Only log rarely to avoid console spam
    if (this.boats.length > 0 && Math.random() < 0.001) {
      console.log('[NPCBoatService] Updating', this.boats.length, 'boats');
    }

    // Update each boat's position
    this.boats = this.boats.map(boat => {
      // Move along curved path
      if (boat.path && boat.path.length > 1) {
        // Calculate progress along entire path
        const totalSegments = boat.path.length - 1;
        const overallProgress = boat.currentSegment / totalSegments + (boat.progress / totalSegments);
        
        // Simple constant speed - no acceleration needed for fishing boats
        const speedMultiplier = boat.boatType === 'fishing' ? 3 : 2; // Fishing boats move faster
        boat.progress += boat.speed * deltaTime * speedMultiplier;
        
        if (boat.progress >= 1) {
          // Move to next segment
          boat.currentSegment++;
          boat.progress = 0;
          
          if (boat.currentSegment >= totalSegments) {
            // Reached destination
            if (boat.boatType === 'fishing') {
              // Fishing boats loop their patrol
              boat.currentSegment = 0;
              boat.progress = 0;
              boat.x = boat.path[0][0];
              boat.y = boat.path[0][1];
            } else {
              // Transport boats find new destination
              this.findNewDestination(boat);
            }
          } else {
            // Update position to current segment start
            boat.x = boat.path[boat.currentSegment][0];
            boat.y = boat.path[boat.currentSegment][1];
            
            // Update rotation for next segment
            if (boat.currentSegment < totalSegments) {
              const nextPoint = boat.path[boat.currentSegment + 1];
              const dx = nextPoint[0] - boat.x;
              const dy = nextPoint[1] - boat.y;
              boat.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
            }
          }
        }
      }
      
      return boat;
    });

    // Remove boats that have no valid path
    this.boats = this.boats.filter(boat => boat.path && boat.path.length > 0);

    // Spawn new boats very rarely if needed (performance optimization)
    if (this.boats.length < this.maxBoats && Math.random() < 0.0001) {
      this.spawnInitialBoats();
    }

    return this.boats;
  }

  private findNewDestination(boat: NPCBoat) {
    if (!this.mapData) return;
    
    // Build list of all valid destinations
    const harborTiles: Array<{location: [number, number], type: string}> = [];
    for (let y = 0; y < this.mapData.tiles.length; y++) {
      for (let x = 0; x < this.mapData.tiles[y].length; x++) {
        const tile = this.mapData.tiles[y][x];
        if (tile.biome === BiomeType.HARBOR_DISTRICT) {
          harborTiles.push({ location: [x, y], type: 'harbor' });
        }
      }
    }
    
    // Find fishing huts and map them to their nearest water tiles
    const fishingHuts = this.structures.filter(s => 
      s.structureType === 'fishing_hut' && s.state === 'active'
    ).map(s => {
      const waterTile = this.findNearestWaterTile(s.location[0], s.location[1]);
      if (waterTile) {
        return { location: waterTile, type: 'fishing_hut' };
      }
      return null;
    }).filter(h => h !== null) as Array<{location: [number, number], type: string}>;
    
    const allDestinations = [...harborTiles, ...fishingHuts];
    
    // Filter out current location
    const destinations = allDestinations.filter(d => 
      d.location[0] !== boat.targetX || d.location[1] !== boat.targetY
    );
    
    if (destinations.length > 0) {
      // Try random destinations until we find a valid water path
      const shuffled = [...destinations].sort(() => Math.random() - 0.5);
      
      for (const newTarget of shuffled) {
        const path = this.generateCurvedPath([boat.targetX, boat.targetY], newTarget.location);
        if (path) {
          // Start new journey
          boat.x = boat.targetX;
          boat.y = boat.targetY;
          boat.targetX = newTarget.location[0];
          boat.targetY = newTarget.location[1];
          boat.progress = 0;
          boat.path = path;
          boat.currentSegment = 0;
          
          // Update rotation for first segment
          if (path.length > 1) {
            const dx = path[1][0] - path[0][0];
            const dy = path[1][1] - path[0][1];
            boat.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
          }
          
          console.log('[NPCBoatService] Boat', boat.id, 'found new destination with', path.length, 'waypoints');
          return;
        }
      }
      
      // No valid path found, remove boat
      console.log('[NPCBoatService] Boat', boat.id, 'could not find valid water path, removing');
      boat.path = [];
    }
  }

  getBoats(): NPCBoat[] {
    return this.boats;
  }

  getInterpolatedPosition(boat: NPCBoat): { x: number, y: number } {
    if (!boat.path || boat.currentSegment >= boat.path.length - 1) {
      return { x: boat.x, y: boat.y };
    }
    
    const currentPoint = boat.path[boat.currentSegment];
    const nextPoint = boat.path[boat.currentSegment + 1];
    
    // Smooth interpolation along current segment
    const x = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * boat.progress;
    const y = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * boat.progress;
    
    return { x, y };
  }

  removeBoat(id: string) {
    this.boats = this.boats.filter(b => b.id !== id);
  }
}

export const npcBoatService = new NPCBoatService();