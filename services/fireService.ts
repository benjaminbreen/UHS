/**
 * services/fireService.ts - Handles fire mechanics, spreading, and effects
 */

import { FireState, FireIntensity, BurnResult, FireSpreadEvent } from '../types/fireTypes';
import { Tile, BiomeType, MapData, PlayerCharacter } from '../types';
import { weatherService } from './weatherService';
import { FLAMMABILITY_CONFIG } from '../constants/mapGeneration/qualities/tileQualities';

/**
 * Main fire management service
 */
class FireService {
  private activeFires: Map<string, FireState> = new Map();
  private fireSpreadListeners: ((event: FireSpreadEvent) => void)[] = [];
  private fireChangeListeners: (() => void)[] = [];

  /**
   * Get key for fire map from coordinates
   */
  private getFireKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Check if a tile is currently on fire
   */
  public isOnFire(x: number, y: number): boolean {
    return this.activeFires.has(this.getFireKey(x, y));
  }

  /**
   * Get fire state at specific coordinates
   */
  public getFireAt(x: number, y: number): FireState | undefined {
    return this.activeFires.get(this.getFireKey(x, y));
  }

  /**
   * Get all active fires
   */
  public getAllFires(): FireState[] {
    return Array.from(this.activeFires.values());
  }

  /**
   * Attempt to start a fire at the given coordinates
   */
  public startFire(
    x: number,
    y: number,
    tile: Tile,
    gameTime: number,
    player?: PlayerCharacter
  ): BurnResult {
    // Check if already on fire
    if (this.isOnFire(x, y)) {
      return {
        success: false,
        message: "This area is already ablaze!"
      };
    }

    // Check if tile is flammable - look in qualities object OR use biome defaults
    let flammability = tile.qualities?.flammability;
    
    // If no flammability in qualities, use biome defaults
    if (flammability === undefined || flammability === null) {
      flammability = FLAMMABILITY_CONFIG.BASE_VALUES[tile.biome] ?? 0.5;
    }
    
    if (flammability <= 0.05) { // Allow very small flammability values
      const terrainName = this.getBiomeName(tile.biome);
      return {
        success: false,
        message: `You cannot set fire to ${terrainName}.`
      };
    }

    // Check for water tiles
    if (this.isWaterTile(tile.biome)) {
      return {
        success: false,
        message: "You cannot set fire to water!"
      };
    }

    // For now, 100% success rate as requested
    // Later can add checks for items (torch/tinderbox) and weather
    
    // Create the fire
    const fire: FireState = {
      x,
      y,
      intensity: FireIntensity.SMALL,
      startTime: gameTime,
      spreadAttempts: 0,
      burnDuration: 0
    };

    // Add to active fires
    this.activeFires.set(this.getFireKey(x, y), fire);
    
    // Notify listeners that fires have changed
    this.notifyFireChange();

    const biomeName = this.getBiomeName(tile.biome);
    return {
      success: true,
      message: `You set fire to the ${biomeName}. Flames begin to spread!`,
      fireStarted: fire
    };
  }

  /**
   * Process fire spread for all active fires
   */
  public processFireSpread(
    mapData: MapData,
    gameTime: number,
    windDirection?: number,
    isRaining?: boolean
  ): FireSpreadEvent[] {
    const spreadEvents: FireSpreadEvent[] = [];
    
    // Process each active fire
    this.activeFires.forEach((fire, key) => {
      // Update burn duration
      fire.burnDuration += 10; // 10 minutes per spread check
      fire.spreadAttempts++;

      // Increase intensity over time (max at LARGE)
      if (fire.spreadAttempts % 3 === 0 && fire.intensity < FireIntensity.LARGE) {
        fire.intensity++;
      }

      // Check for burnout (fires die after 60-90 minutes)
      const maxBurnTime = 60 + (fire.intensity * 10); // Larger fires burn longer
      if (fire.burnDuration >= maxBurnTime) {
        this.extinguishFire(fire.x, fire.y);
        return;
      }

      // Try to spread to neighbors
      const neighbors = this.getNeighbors(fire.x, fire.y, mapData);
      
      for (const neighbor of neighbors) {
        // Skip if already on fire
        if (this.isOnFire(neighbor.x, neighbor.y)) continue;

        // Calculate spread chance
        const spreadChance = this.calculateSpreadChance(
          fire,
          neighbor.tile,
          neighbor.direction,
          windDirection,
          isRaining
        );

        // Roll for spread
        if (Math.random() < spreadChance) {
          // Start new fire
          const newFire: FireState = {
            x: neighbor.x,
            y: neighbor.y,
            intensity: FireIntensity.SMALL,
            startTime: gameTime,
            spreadAttempts: 0,
            burnDuration: 0
          };

          this.activeFires.set(this.getFireKey(neighbor.x, neighbor.y), newFire);
          
          // Notify change
          this.notifyFireChange();

          // Record spread event
          spreadEvents.push({
            fromX: fire.x,
            fromY: fire.y,
            toX: neighbor.x,
            toY: neighbor.y,
            biomeName: this.getBiomeName(neighbor.tile.biome)
          });
        }
      }
    });

    // Notify listeners of spread events
    spreadEvents.forEach(event => {
      this.fireSpreadListeners.forEach(listener => listener(event));
    });

    return spreadEvents;
  }

  /**
   * Calculate chance of fire spreading to a tile
   */
  private calculateSpreadChance(
    sourceFire: FireState,
    targetTile: Tile,
    direction: string,
    windDirection?: number,
    isRaining?: boolean
  ): number {
    // Base chance from tile flammability - check qualities first, then biome defaults
    let chance = targetTile.qualities?.flammability;
    if (chance === undefined || chance === null) {
      chance = FLAMMABILITY_CONFIG.BASE_VALUES[targetTile.biome] ?? 0;
    }

    // Can't spread to non-flammable tiles
    if (chance <= 0) return 0;

    // Fire intensity modifier
    chance += (sourceFire.intensity - 1) * 0.15; // +15% per intensity level above 1

    // Wind modifier
    if (windDirection !== undefined) {
      const windBonus = this.getWindBonus(direction, windDirection);
      chance += windBonus;
    }

    // Weather modifiers
    if (isRaining) {
      chance -= 0.5; // Rain significantly reduces spread
    }

    // Adjacent fire bonus (fire spreads faster when surrounded)
    const adjacentFires = this.countAdjacentFires(targetTile.x, targetTile.y);
    chance += adjacentFires * 0.1;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, chance));
  }

  /**
   * Get wind bonus based on direction
   */
  private getWindBonus(tileDirection: string, windDegrees: number): number {
    // Convert wind degrees to cardinal direction
    const windCardinal = this.degreesToCardinal(windDegrees);
    
    // Same direction as wind: high bonus
    if (tileDirection === windCardinal) return 0.3;
    
    // Perpendicular to wind: no bonus
    if (this.isPerpendicular(tileDirection, windCardinal)) return 0;
    
    // Opposite to wind: penalty
    if (this.isOpposite(tileDirection, windCardinal)) return -0.2;
    
    // Diagonal: small bonus
    return 0.1;
  }

  /**
   * Get neighboring tiles
   */
  private getNeighbors(x: number, y: number, mapData: MapData): Array<{x: number, y: number, tile: Tile, direction: string}> {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1, dir: 'N' },   // North
      { dx: 1, dy: -1, dir: 'NE' },  // Northeast
      { dx: 1, dy: 0, dir: 'E' },    // East
      { dx: 1, dy: 1, dir: 'SE' },   // Southeast
      { dx: 0, dy: 1, dir: 'S' },    // South
      { dx: -1, dy: 1, dir: 'SW' },  // Southwest
      { dx: -1, dy: 0, dir: 'W' },   // West
      { dx: -1, dy: -1, dir: 'NW' }  // Northwest
    ];

    for (const { dx, dy, dir } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // Check bounds
      if (nx >= 0 && nx < mapData.tiles[0].length && 
          ny >= 0 && ny < mapData.tiles.length) {
        const tile = mapData.tiles[ny][nx];
        if (tile) {
          neighbors.push({ x: nx, y: ny, tile, direction: dir });
        }
      }
    }

    return neighbors;
  }

  /**
   * Count adjacent fires
   */
  private countAdjacentFires(x: number, y: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (this.isOnFire(x + dx, y + dy)) count++;
      }
    }
    return count;
  }

  /**
   * Extinguish a fire
   */
  public extinguishFire(x: number, y: number): void {
    const deleted = this.activeFires.delete(this.getFireKey(x, y));
    if (deleted) {
      this.notifyFireChange();
    }
  }

  /**
   * Extinguish all fires
   */
  public extinguishAllFires(): void {
    this.activeFires.clear();
  }

  /**
   * Add listener for fire spread events
   */
  public onFireSpread(listener: (event: FireSpreadEvent) => void): void {
    this.fireSpreadListeners.push(listener);
  }
  
  /**
   * Add listener for any fire changes
   */
  public onFireChange(listener: () => void): () => void {
    this.fireChangeListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.fireChangeListeners.indexOf(listener);
      if (index > -1) {
        this.fireChangeListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners that fires have changed
   */
  private notifyFireChange(): void {
    this.fireChangeListeners.forEach(listener => listener());
  }

  /**
   * Convert degrees to cardinal direction
   */
  private degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * Check if directions are perpendicular
   */
  private isPerpendicular(dir1: string, dir2: string): boolean {
    const perpendiculars: Record<string, string[]> = {
      'N': ['E', 'W'],
      'S': ['E', 'W'],
      'E': ['N', 'S'],
      'W': ['N', 'S'],
      'NE': ['SE', 'NW'],
      'NW': ['NE', 'SW'],
      'SE': ['NE', 'SW'],
      'SW': ['SE', 'NW']
    };
    return perpendiculars[dir1]?.includes(dir2) || false;
  }

  /**
   * Check if directions are opposite
   */
  private isOpposite(dir1: string, dir2: string): boolean {
    const opposites: Record<string, string> = {
      'N': 'S', 'S': 'N',
      'E': 'W', 'W': 'E',
      'NE': 'SW', 'SW': 'NE',
      'NW': 'SE', 'SE': 'NW'
    };
    return opposites[dir1] === dir2;
  }

  /**
   * Check if a biome is water
   */
  private isWaterTile(biome: BiomeType): boolean {
    return [
      BiomeType.RIVER,
      BiomeType.MAJOR_RIVER,
      BiomeType.SHALLOW_OCEAN,
      BiomeType.DEEP_OCEAN,
      BiomeType.FRESHWATER_LAKE,
      BiomeType.ESTUARY,
      BiomeType.HOT_SPRINGS
    ].includes(biome);
  }

  /**
   * Get human-readable biome name
   */
  private getBiomeName(biome: BiomeType): string {
    return biome.toLowerCase().replace(/_/g, ' ');
  }

  /**
   * Clear all state (for cleanup)
   */
  public reset(): void {
    this.activeFires.clear();
    this.fireSpreadListeners = [];
  }
}

// Export singleton instance
export const fireService = new FireService();