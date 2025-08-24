/**
 * services/npcBoatService.ts - Manages animated NPC boats that travel between harbors and fishing huts
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

  private spawnInitialBoats() {
    if (!this.mapData) {
      console.log('[NPCBoatService] No mapData, cannot spawn boats');
      return;
    }

    // Find all harbor district tiles
    const harborTiles: Array<{location: [number, number], type: string}> = [];
    for (let y = 0; y < this.mapData.tiles.length; y++) {
      for (let x = 0; x < this.mapData.tiles[y].length; x++) {
        const tile = this.mapData.tiles[y][x];
        if (tile.biome === BiomeType.HARBOR_DISTRICT) {
          harborTiles.push({ location: [x, y], type: 'harbor' });
          console.log('[NPCBoatService] Found harbor at', x, y);
        }
      }
    }

    // Find all fishing huts from structures
    const fishingHuts = this.structures.filter(s => 
      s.structureType === 'fishing_hut' && s.state === 'active'
    ).map(s => ({ location: s.location, type: 'fishing_hut' }));

    console.log('[NPCBoatService] Found harbor tiles:', harborTiles.length, 'fishing huts:', fishingHuts.length);

    const destinations = [...harborTiles, ...fishingHuts];
    if (destinations.length < 2) {
      console.log('[NPCBoatService] Not enough destinations (need at least 2):', destinations.length);
      return;
    }

    // Spawn up to maxBoats boats
    const boatsToSpawn = Math.min(this.maxBoats, Math.floor(destinations.length / 2));
    console.log('[NPCBoatService] Attempting to spawn', boatsToSpawn, 'boats');
    
    for (let i = 0; i < boatsToSpawn; i++) {
      const start = destinations[Math.floor(Math.random() * destinations.length)];
      const end = destinations.filter(d => d !== start)[Math.floor(Math.random() * (destinations.length - 1))];
      
      console.log('[NPCBoatService] Testing route from', start.type, 'at', start.location, 'to', end.type, 'at', end.location);
      
      if (this.canTravel(start.location, end.location)) {
        const boat = this.createBoat(start, end);
        this.boats.push(boat);
        console.log('[NPCBoatService] Created boat:', boat.id, 'type:', boat.boatType);
      } else {
        console.log('[NPCBoatService] Route not viable (not enough water)');
      }
    }
    
    console.log('[NPCBoatService] Total boats spawned:', this.boats.length);
  }

  private createBoat(start: {location: [number, number], type: string}, end: {location: [number, number], type: string}): NPCBoat {
    const types: NPCBoat['boatType'][] = ['fishing', 'cargo', 'ferry'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Calculate rotation based on direction
    const dx = end.location[0] - start.location[0];
    const dy = end.location[1] - start.location[1];
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      id: `boat-${Date.now()}-${Math.random()}`,
      x: start.location[0],
      y: start.location[1],
      targetX: end.location[0],
      targetY: end.location[1],
      speed: 0.02 + Math.random() * 0.02, // Varying speeds
      rotation,
      boatType: type,
      era: this.mapData?.era || 'medieval',
      culture: this.mapData?.mapAreaName || 'generic',
      progress: 0
    };
  }

  private canTravel(start: [number, number], end: [number, number]): boolean {
    if (!this.mapData) return false;
    
    // Simple check: ensure path is mostly water
    const steps = 20;
    const dx = (end[0] - start[0]) / steps;
    const dy = (end[1] - start[1]) / steps;
    
    let waterTiles = 0;
    let landTiles = 0;
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(start[0] + dx * i);
      const y = Math.floor(start[1] + dy * i);
      
      if (x >= 0 && x < this.mapData.tiles[0].length && 
          y >= 0 && y < this.mapData.tiles.length) {
        const tile = this.mapData.tiles[y][x];
        if (!tile.isLand || 
            tile.biome === BiomeType.RIVER || 
            tile.biome === BiomeType.MAJOR_RIVER ||
            tile.biome === BiomeType.FRESHWATER_LAKE) {
          waterTiles++;
        } else {
          landTiles++;
        }
      }
    }
    
    const percentWater = waterTiles / (steps + 1);
    console.log('[NPCBoatService] Path check: water tiles:', waterTiles, 'land tiles:', landTiles, 'percent water:', percentWater);
    return percentWater > 0.7; // 70% of path must be water
  }

  update(): NPCBoat[] {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    if (this.boats.length > 0 && Math.random() < 0.01) { // Log occasionally
      console.log('[NPCBoatService] Updating', this.boats.length, 'boats');
    }

    // Update each boat's position
    this.boats = this.boats.map(boat => {
      boat.progress += boat.speed * deltaTime;
      
      if (boat.progress >= 1) {
        // Boat has reached destination, find new target
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
        
        const fishingHuts = this.structures.filter(s => 
          s.structureType === 'fishing_hut' && s.state === 'active'
        ).map(s => ({ location: s.location, type: 'fishing_hut' }));
        
        const allDestinations = [...harborTiles, ...fishingHuts];
        
        // Filter out current location
        const destinations = allDestinations.filter(d => 
          d.location[0] !== boat.targetX || d.location[1] !== boat.targetY
        );
        
        if (destinations.length > 0) {
          const newTarget = destinations[Math.floor(Math.random() * destinations.length)];
          if (this.canTravel([boat.targetX, boat.targetY], newTarget.location)) {
            // Start new journey
            boat.x = boat.targetX;
            boat.y = boat.targetY;
            boat.targetX = newTarget.location[0];
            boat.targetY = newTarget.location[1];
            boat.progress = 0;
            
            // Update rotation
            const dx = boat.targetX - boat.x;
            const dy = boat.targetY - boat.y;
            boat.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
          }
        }
      }
      
      return boat;
    }).filter(boat => boat.progress < 1);

    // Spawn new boats if needed
    if (this.boats.length < this.maxBoats && Math.random() < 0.01) {
      this.spawnInitialBoats();
    }

    return this.boats;
  }

  getBoats(): NPCBoat[] {
    return this.boats;
  }

  getInterpolatedPosition(boat: NPCBoat): { x: number, y: number } {
    const x = boat.x + (boat.targetX - boat.x) * boat.progress;
    const y = boat.y + (boat.targetY - boat.y) * boat.progress;
    return { x, y };
  }

  removeBoat(id: string) {
    this.boats = this.boats.filter(b => b.id !== id);
  }
}

export const npcBoatService = new NPCBoatService();