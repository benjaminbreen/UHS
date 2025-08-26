/**
 * Ultra-simple boat service - ONE boat, proper water pathfinding, maximum performance
 */

import { MapData, BiomeType } from '../types';

export interface SimpleBoat {
  path: Array<{x: number, y: number}>; // Pre-calculated water path
  currentIndex: number; // Current position along path
  progress: number; // Progress between current and next point (0-1)
  forward: boolean; // Direction along path
}

class SimpleBoatService {
  private boat: SimpleBoat | null = null;
  private mapData: MapData | null = null;

  initialize(mapData: MapData): void {
    // Reset on new map
    this.boat = null;
    this.mapData = mapData;
    
    // Find exactly 2 harbor districts
    const harbors: Array<[number, number]> = [];
    
    for (let y = 0; y < mapData.tiles.length && harbors.length < 2; y++) {
      for (let x = 0; x < mapData.tiles[y].length && harbors.length < 2; x++) {
        if (mapData.tiles[y][x].biome === BiomeType.HARBOR_DISTRICT) {
          harbors.push([x, y]);
        }
      }
    }

    // Only create boat if we have exactly 2 harbors
    if (harbors.length === 2) {
      const path = this.findWaterPath(harbors[0], harbors[1], mapData);
      if (path && path.length >= 2) {
        this.boat = {
          path: path,
          currentIndex: 0,
          progress: 0,
          forward: true
        };
        console.log('[SimpleBoatService] Created boat with', path.length, 'waypoints');
      }
    }
  }

  private findWaterPath(start: [number, number], end: [number, number], mapData: MapData): Array<{x: number, y: number}> | null {
    // Super simple: just create a straight line and keep only water tiles
    const path: Array<{x: number, y: number}> = [];
    const steps = 20; // Fixed number of steps for performance
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(start[0] + (end[0] - start[0]) * t);
      const y = Math.round(start[1] + (end[1] - start[1]) * t);
      
      // Check if this tile is water or coast
      if (x >= 0 && x < mapData.tiles[0].length && y >= 0 && y < mapData.tiles.length) {
        const tile = mapData.tiles[y][x];
        if (!tile.isLand || tile.isCoast || 
            tile.biome === BiomeType.RIVER || 
            tile.biome === BiomeType.HARBOR_DISTRICT) {
          // Avoid duplicates
          if (path.length === 0 || path[path.length - 1].x !== x || path[path.length - 1].y !== y) {
            path.push({x, y});
          }
        }
      }
    }
    
    // Only return path if it's mostly water (at least 50% of the direct line)
    return path.length >= steps / 2 ? path : null;
  }

  update(): void {
    if (!this.boat || this.boat.path.length < 2) return;
    
    const speed = 0.04; // Doubled speed for faster movement
    
    this.boat.progress += this.boat.forward ? speed : -speed;
    
    // Handle reaching waypoints
    if (this.boat.progress >= 1) {
      this.boat.progress = 0;
      if (this.boat.forward) {
        this.boat.currentIndex++;
        if (this.boat.currentIndex >= this.boat.path.length - 1) {
          this.boat.currentIndex = this.boat.path.length - 2;
          this.boat.forward = false;
        }
      }
    } else if (this.boat.progress < 0) {
      this.boat.progress = 1;
      if (!this.boat.forward) {
        this.boat.currentIndex--;
        if (this.boat.currentIndex < 0) {
          this.boat.currentIndex = 0;
          this.boat.forward = true;
          this.boat.progress = 0;
        }
      }
    }
  }

  getBoatPosition(): { x: number, y: number, rotation: number } | null {
    if (!this.boat || this.boat.path.length < 2) return null;
    
    const current = this.boat.path[this.boat.currentIndex];
    const next = this.boat.path[Math.min(this.boat.currentIndex + 1, this.boat.path.length - 1)];
    
    // Interpolate between waypoints
    const x = current.x + (next.x - current.x) * this.boat.progress;
    const y = current.y + (next.y - current.y) * this.boat.progress;
    
    // Calculate rotation to face direction of travel
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    let rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Flip if going backward
    if (!this.boat.forward) {
      rotation += 180;
    }
    
    return { x, y, rotation };
  }

  hasBoat(): boolean {
    return this.boat !== null;
  }

  reset(): void {
    this.boat = null;
    this.mapData = null;
  }
}

export const simpleBoatService = new SimpleBoatService();