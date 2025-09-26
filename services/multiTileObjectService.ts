/**
 * multiTileObjectService.ts
 * Manages multi-tile objects like tall pillars in special maps
 */

import { Tile, BiomeType } from '../types';
import { SpecialMapConfig } from '../types/specialMapTypes';

export interface MultiTileObject {
  id: string;
  type: 'pillar' | 'table' | 'statue';
  baseX: number;
  baseY: number;
  width: number;
  height: number; // Height in tiles
  material: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';
}

export class MultiTileObjectManager {
  private objects: MultiTileObject[] = [];
  private occupiedTiles: Set<string> = new Set();
  
  /**
   * Add a multi-tile object to the map
   */
  addObject(object: MultiTileObject): boolean {
    // Check if all tiles are available
    for (let y = object.baseY; y < object.baseY + object.height; y++) {
      for (let x = object.baseX; x < object.baseX + object.width; x++) {
        const key = `${x},${y}`;
        if (this.occupiedTiles.has(key)) {
          return false; // Space already occupied
        }
      }
    }
    
    // Mark tiles as occupied
    for (let y = object.baseY; y < object.baseY + object.height; y++) {
      for (let x = object.baseX; x < object.baseX + object.width; x++) {
        this.occupiedTiles.add(`${x},${y}`);
      }
    }
    
    this.objects.push(object);
    return true;
  }
  
  /**
   * Place a pillar at the specified location
   */
  placePillar(
    tiles: Tile[][],
    x: number,
    y: number,
    height: number,
    material: MultiTileObject['material']
  ): boolean {
    // Validate position
    if (y - height + 1 < 0 || x < 0 || x >= tiles[0].length || y >= tiles.length) {
      return false;
    }
    
    // Check if all tiles are available
    for (let h = 0; h < height; h++) {
      const tileY = y - h;
      if (tiles[tileY][x].isBlocking) {
        return false; // Space already blocked
      }
    }
    
    // Create the multi-tile object
    const pillar: MultiTileObject = {
      id: `pillar_${x}_${y}_${Date.now()}`,
      type: 'pillar',
      baseX: x,
      baseY: y - height + 1, // Top of pillar
      width: 1,
      height: height,
      material: material
    };
    
    if (!this.addObject(pillar)) {
      return false;
    }
    
    // Mark tiles as pillar tiles
    for (let h = 0; h < height; h++) {
      const tileY = y - h;
      tiles[tileY][x].biome = BiomeType.PILLAR;
      tiles[tileY][x].isBlocking = true;
      // Store metadata for rendering
      const multiTileData = {
        objectId: pillar.id,
        isBase: h === 0,
        material: material,
        height: height
      };
      (tiles[tileY][x] as any).multiTileData = multiTileData;
      console.log(`[MultiTile Debug] Set multiTileData on tile (${x}, ${tileY}):`, multiTileData);
    }
    
    return true;
  }
  
  /**
   * Get all multi-tile objects
   */
  getObjects(): MultiTileObject[] {
    return this.objects;
  }
  
  /**
   * Check if a tile is occupied by a multi-tile object
   */
  isTileOccupied(x: number, y: number): boolean {
    return this.occupiedTiles.has(`${x},${y}`);
  }
  
  /**
   * Get the appropriate material based on cultural zone and era
   */
  static getMaterialForContext(
    config: SpecialMapConfig
  ): MultiTileObject['material'] {
    const { culturalZone, era } = config;
    
    // Era-based defaults
    if (era === 'PREHISTORY') return 'wood';
    if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') return 'steel';
    
    // Cultural zone specific materials
    switch (culturalZone) {
      case 'EUROPEAN':
        return era === 'MEDIEVAL' ? 'grey_stone' : 'white_marble';
      case 'EAST_ASIAN':
        return 'red_lacquer';
      case 'MENA':
      case 'AFRICAN':
        return 'sandstone';
      case 'AMERICAS':
        return era === 'ANTIQUITY' ? 'sandstone' : 'wood';
      case 'OCEANIA':
        return 'wood';
      default:
        return 'grey_stone';
    }
  }
  
  /**
   * Calculate pillar height based on era and archetype
   */
  static getPillarHeight(config: SpecialMapConfig): number {
    const { era, archetype } = config;
    
    // Era-based heights
    const eraHeights: Record<string, number> = {
      'PREHISTORY': 2,
      'ANTIQUITY': 3,
      'MEDIEVAL': 3,
      'RENAISSANCE_EARLY_MODERN': 3,
      'INDUSTRIAL_ERA': 4,
      'MODERN_ERA': 4,
      'FUTURE_ERA': 4
    };
    
    let baseHeight = eraHeights[era] || 3;
    
    // Adjust for archetype
    if (archetype === 'GOVERNMENT_FORUM' || archetype === 'PALACE_COMPLEX') {
      baseHeight = Math.min(4, baseHeight + 1); // Government buildings are grander
    } else if (archetype === 'MARKET_BAZAAR' || archetype === 'RESTAURANT_INN') {
      baseHeight = Math.max(2, baseHeight - 1); // Markets are more modest
    }
    
    return baseHeight;
  }
}

// Singleton instance for managing multi-tile objects in the current map
export const multiTileObjectManager = new MultiTileObjectManager();