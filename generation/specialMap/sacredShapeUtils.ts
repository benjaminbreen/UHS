/**
 * Sacred shape utilities for generating culturally-appropriate temple layouts
 * Cruciform for churches, octagonal for Islamic/Byzantine, circular for pagodas, etc.
 */

import { Tile, BiomeType } from '../../types';

/**
 * Generate a cruciform (cross-shaped) floor plan
 * Common in Christian churches
 */
export function generateCruciformFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  naveLength: number,
  transeptLength: number,
  width: number,
  floorType: BiomeType = BiomeType.FLOOR_STONE
) {
  // Main nave (vertical)
  for (let y = centerY - naveLength/2; y <= centerY + naveLength/2; y++) {
    for (let x = centerX - width/2; x <= centerX + width/2; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
  
  // Transept (horizontal crossbar)
  const transeptY = centerY - Math.floor(naveLength/4);
  for (let x = centerX - transeptLength/2; x <= centerX + transeptLength/2; x++) {
    for (let y = transeptY - width/2; y <= transeptY + width/2; y++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
  
  // Apse (semicircular end) - simplified as rectangular
  const apseY = centerY - naveLength/2 - width;
  for (let y = apseY; y < centerY - naveLength/2; y++) {
    for (let x = centerX - width/2; x <= centerX + width/2; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
}

/**
 * Generate an octagonal floor plan
 * Common in Islamic mosques, Byzantine churches, baptisteries
 */
export function generateOctagonalFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  radius: number,
  floorType: BiomeType = BiomeType.FLOOR_TILE
) {
  // Approximate octagon using 8 sides
  const angleStep = Math.PI / 4; // 45 degrees
  
  // Fill the octagon
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (!tiles[y] || !tiles[y][x]) continue;
      
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Check if point is inside octagon using distance from edges
      let inside = true;
      for (let i = 0; i < 8; i++) {
        const angle = i * angleStep;
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        const edgeDistance = radius * Math.cos(angleStep / 2);
        
        if (dx * nx + dy * ny > edgeDistance) {
          inside = false;
          break;
        }
      }
      
      if (inside) {
        tiles[y][x].biome = floorType;
      }
    }
  }
}

/**
 * Generate a circular floor plan
 * Common in Buddhist stupas, round churches, pantheons
 */
export function generateCircularFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  radius: number,
  floorType: BiomeType = BiomeType.FLOOR_MARBLE
) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (!tiles[y] || !tiles[y][x]) continue;
      
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        tiles[y][x].biome = floorType;
      }
    }
  }
}

/**
 * Generate a mandala pattern floor
 * Common in Hindu and Buddhist temples
 */
export function generateMandalaFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  outerRadius: number,
  rings: number = 3
) {
  // Concentric circles with different floor types
  const floorTypes = [BiomeType.FLOOR_MARBLE, BiomeType.FLOOR_MOSAIC, BiomeType.FLOOR_TILE];
  
  for (let ring = 0; ring < rings; ring++) {
    const radius = outerRadius * (1 - ring / rings);
    const floorType = floorTypes[ring % floorTypes.length];
    
    for (let y = centerY - outerRadius; y <= centerY + outerRadius; y++) {
      for (let x = centerX - outerRadius; x <= centerX + outerRadius; x++) {
        if (!tiles[y] || !tiles[y][x]) continue;
        
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const nextRadius = ring < rings - 1 ? outerRadius * (1 - (ring + 1) / rings) : 0;
        
        if (distance <= radius && distance > nextRadius) {
          tiles[y][x].biome = floorType;
          
          // Add radial pattern
          const angle = Math.atan2(y - centerY, x - centerX);
          if (Math.abs(Math.sin(angle * 8)) < 0.1) {
            tiles[y][x].materialSubtype = 'mandala_line';
          }
        }
      }
    }
  }
}

/**
 * Generate a Greek cross (equal arms) floor plan
 * Common in Byzantine and Eastern Orthodox churches
 */
export function generateGreekCrossFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  armLength: number,
  armWidth: number,
  floorType: BiomeType = BiomeType.FLOOR_MARBLE
) {
  // All four arms are equal length
  // Vertical arm
  for (let y = centerY - armLength; y <= centerY + armLength; y++) {
    for (let x = centerX - armWidth/2; x <= centerX + armWidth/2; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
  
  // Horizontal arm
  for (let x = centerX - armLength; x <= centerX + armLength; x++) {
    for (let y = centerY - armWidth/2; y <= centerY + armWidth/2; y++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
  
  // Optional: Add dome area in center
  generateCircularFloor(tiles, centerX, centerY, armWidth, BiomeType.FLOOR_MOSAIC);
}

/**
 * Generate a basilica floor plan (rectangular with apse)
 * Common in Roman and early Christian architecture
 */
export function generateBasilicaFloor(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  length: number,
  hasApse: boolean = true,
  floorType: BiomeType = BiomeType.FLOOR_STONE
) {
  // Main rectangular hall
  for (let y = startY; y < startY + length; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = floorType;
      }
    }
  }
  
  // Add semicircular apse at one end
  if (hasApse) {
    const apseRadius = width / 2;
    const apseCenterX = startX + width / 2;
    const apseCenterY = startY;
    
    for (let y = apseCenterY - apseRadius; y <= apseCenterY; y++) {
      for (let x = apseCenterX - apseRadius; x <= apseCenterX + apseRadius; x++) {
        if (!tiles[y] || !tiles[y][x]) continue;
        
        const distance = Math.sqrt((x - apseCenterX) ** 2 + (y - apseCenterY) ** 2);
        if (distance <= apseRadius) {
          tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        }
      }
    }
  }
}

/**
 * Generate pagoda-style square with rounded corners
 * Common in East Asian temples
 */
export function generatePagodaFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  size: number,
  levels: number = 1,
  floorType: BiomeType = BiomeType.FLOOR_WOOD
) {
  // Each level is slightly smaller
  for (let level = 0; level < levels; level++) {
    const levelSize = size - (level * 4);
    const halfSize = Math.floor(levelSize / 2);
    
    for (let y = centerY - halfSize; y <= centerY + halfSize; y++) {
      for (let x = centerX - halfSize; x <= centerX + halfSize; x++) {
        if (!tiles[y] || !tiles[y][x]) continue;
        
        // Round the corners
        const cornerDist = 3;
        const isCorner = (
          (Math.abs(x - (centerX - halfSize)) < cornerDist && Math.abs(y - (centerY - halfSize)) < cornerDist) ||
          (Math.abs(x - (centerX + halfSize)) < cornerDist && Math.abs(y - (centerY - halfSize)) < cornerDist) ||
          (Math.abs(x - (centerX - halfSize)) < cornerDist && Math.abs(y - (centerY + halfSize)) < cornerDist) ||
          (Math.abs(x - (centerX + halfSize)) < cornerDist && Math.abs(y - (centerY + halfSize)) < cornerDist)
        );
        
        if (!isCorner) {
          tiles[y][x].biome = level === 0 ? floorType : BiomeType.DAIS;
        }
      }
    }
  }
}

/**
 * Generate hexagonal floor plan
 * Sometimes used in Islamic architecture
 */
export function generateHexagonalFloor(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  radius: number,
  floorType: BiomeType = BiomeType.FLOOR_TILE
) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (!tiles[y] || !tiles[y][x]) continue;
      
      const dx = Math.abs(x - centerX);
      const dy = Math.abs(y - centerY);
      
      // Hexagon equation
      if (dx <= radius * 0.866 && dy <= radius && (dx / 0.866 + dy <= radius * 1.5)) {
        tiles[y][x].biome = floorType;
      }
    }
  }
}

/**
 * Clear an area and create walls in specific shape
 */
export function carveShapeWithWalls(
  tiles: Tile[][],
  shape: 'cruciform' | 'octagonal' | 'circular' | 'greek-cross' | 'hexagonal',
  centerX: number,
  centerY: number,
  size: number
) {
  // First, fill everything with walls
  const radius = size + 2;
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = BiomeType.WALL;
      }
    }
  }
  
  // Then carve out the shape
  switch (shape) {
    case 'cruciform':
      generateCruciformFloor(tiles, centerX, centerY, size, size * 0.7, size * 0.4, BiomeType.FLOOR_STONE);
      break;
    case 'octagonal':
      generateOctagonalFloor(tiles, centerX, centerY, size * 0.6, BiomeType.FLOOR_TILE);
      break;
    case 'circular':
      generateCircularFloor(tiles, centerX, centerY, size * 0.6, BiomeType.FLOOR_MARBLE);
      break;
    case 'greek-cross':
      generateGreekCrossFloor(tiles, centerX, centerY, size * 0.5, size * 0.3, BiomeType.FLOOR_MARBLE);
      break;
    case 'hexagonal':
      generateHexagonalFloor(tiles, centerX, centerY, size * 0.6, BiomeType.FLOOR_TILE);
      break;
  }
}