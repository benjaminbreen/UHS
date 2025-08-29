/**
 * generation/specialMap/archetypes/exhibitionGenerator.ts
 * Generator for exhibition/museum/fair special maps
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateExhibition(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Determine exhibition type based on era
  const exhibitionType = getExhibitionType(config);
  
  // Create perimeter walls
  const gates = exhibitionType === 'world_fair' ? 
    [
      { side: 'north', offset: Math.floor(size.width / 2) },
      { side: 'south', offset: Math.floor(size.width / 2) },
      { side: 'east', offset: Math.floor(size.height / 2) },
      { side: 'west', offset: Math.floor(size.height / 2) }
    ] : 
    [
      { side: 'south', offset: Math.floor(size.width / 2) }
    ];
  
  placeWallRectangle(tiles, 0, 0, size.width, size.height, gates);
  
  // Fill with appropriate flooring
  const floorType = exhibitionType === 'world_fair' ? BiomeType.ROAD : BiomeType.FLOOR_MARBLE;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  // Generate based on type
  switch (exhibitionType) {
    case 'world_fair':
      generateWorldFair(tiles, size, config, noise);
      break;
    case 'museum':
      generateMuseum(tiles, size, config, noise);
      break;
    case 'gallery':
      generateGallery(tiles, size, config);
      break;
    default:
      generateGenericExhibition(tiles, size, config);
  }
  
  // Exit zones
  if (exhibitionType === 'world_fair') {
    exitZones.push(
      { id: 'north_gate', location: [Math.floor(size.width / 2), 0], 
        label: 'North Gate', destination: 'parent_map' },
      { id: 'south_gate', location: [Math.floor(size.width / 2), size.height - 1], 
        label: 'South Gate', destination: 'parent_map' },
      { id: 'east_gate', location: [size.width - 1, Math.floor(size.height / 2)], 
        label: 'East Gate', destination: 'parent_map' },
      { id: 'west_gate', location: [0, Math.floor(size.height / 2)], 
        label: 'West Gate', destination: 'parent_map' }
    );
  } else {
    exitZones.push(
      { id: 'main_exit', location: [Math.floor(size.width / 2), size.height - 1], 
        label: 'Main Entrance', destination: 'parent_map' }
    );
  }
  
  return { tiles, interactionZones, exitZones };
}

function getExhibitionType(config: SpecialMapConfig): string {
  if (config.era === 'INDUSTRIAL_ERA' || 
      (config.era === 'MODERN_ERA' && config.specificYear && config.specificYear < 1950)) {
    return 'world_fair';
  } else if (config.era === 'MODERN_ERA') {
    return 'museum';
  } else if (config.era === 'RENAISSANCE_EARLY_MODERN') {
    return 'gallery';
  }
  return 'generic';
}

function generateWorldFair(tiles: Tile[][], size: any, config: SpecialMapConfig, noise: ValueNoise) {
  // World's Fair with national pavilions
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main boulevards (cross pattern)
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      tiles[y][x].biome = BiomeType.ROAD;
    }
  }
  for (let x = 1; x < size.width - 1; x++) {
    for (let y = centerY - 2; y <= centerY + 2; y++) {
      tiles[y][x].biome = BiomeType.ROAD;
    }
  }
  
  // Central feature (Crystal Palace, Eiffel Tower equivalent)
  const centralSize = 8;
  for (let y = centerY - centralSize; y <= centerY + centralSize; y++) {
    for (let x = centerX - centralSize; x <= centerX + centralSize; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        // Create an impressive central structure
        const dx = Math.abs(x - centerX);
        const dy = Math.abs(y - centerY);
        
        if (dx === centralSize || dy === centralSize) {
          tiles[y][x].biome = BiomeType.COLUMN; // Pillars
        } else if (dx < 2 && dy < 2) {
          tiles[y][x].biome = BiomeType.FOUNTAIN; // Central fountain
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        }
      }
    }
  }
  
  // National pavilions in quadrants
  const pavilions = [
    { x: 8, y: 8, name: 'British Empire' },
    { x: size.width - 16, y: 8, name: 'France' },
    { x: 8, y: size.height - 16, name: 'United States' },
    { x: size.width - 16, y: size.height - 16, name: 'Germany' }
  ];
  
  pavilions.forEach((pav, index) => {
    createPavilion(tiles, pav.x, pav.y, 12, 10, noise);
  });
  
  // Gardens and fountains
  if (config.culturalZone === 'EUROPEAN' && config.era === 'INDUSTRIAL_ERA') {
    // Victorian-style gardens
    tiles[10][10].biome = BiomeType.PARK;
    tiles[10][size.width - 11].biome = BiomeType.PARK;
    tiles[size.height - 11][10].biome = BiomeType.PARK;
    tiles[size.height - 11][size.width - 11].biome = BiomeType.PARK;
  }
}

function generateMuseum(tiles: Tile[][], size: any, config: SpecialMapConfig, noise: ValueNoise) {
  // Modern museum with gallery rooms
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central atrium
  for (let y = centerY - 6; y <= centerY + 6; y++) {
    for (let x = centerX - 6; x <= centerX + 6; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        if (Math.abs(x - centerX) === 6 || Math.abs(y - centerY) === 6) {
          tiles[y][x].biome = BiomeType.COLUMN;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        }
      }
    }
  }
  
  // Gallery wings
  const galleries = [
    { x: 3, y: 3, w: 15, h: 10, theme: 'Ancient' },
    { x: size.width - 18, y: 3, w: 15, h: 10, theme: 'Medieval' },
    { x: 3, y: size.height - 13, w: 15, h: 10, theme: 'Renaissance' },
    { x: size.width - 18, y: size.height - 13, w: 15, h: 10, theme: 'Modern' }
  ];
  
  galleries.forEach(gallery => {
    // Gallery walls
    for (let y = gallery.y; y < gallery.y + gallery.h; y++) {
      for (let x = gallery.x; x < gallery.x + gallery.w; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          if (y === gallery.y || y === gallery.y + gallery.h - 1 ||
              x === gallery.x || x === gallery.x + gallery.w - 1) {
            // Leave openings for doorways
            if (!((x === gallery.x + Math.floor(gallery.w / 2)) || 
                  (y === gallery.y + Math.floor(gallery.h / 2)))) {
              tiles[y][x].biome = BiomeType.WALL;
            }
          } else {
            tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
          }
        }
      }
    }
    
    // Display cases along walls
    for (let x = gallery.x + 2; x < gallery.x + gallery.w - 2; x += 3) {
      if (gallery.y + 1 < size.height) {
        tiles[gallery.y + 1][x].biome = BiomeType.TABLE; // Display case
      }
      if (gallery.y + gallery.h - 2 >= 0) {
        tiles[gallery.y + gallery.h - 2][x].biome = BiomeType.TABLE;
      }
    }
    
    // Central sculptures
    const centerGalX = gallery.x + Math.floor(gallery.w / 2);
    const centerGalY = gallery.y + Math.floor(gallery.h / 2);
    if (centerGalX < size.width && centerGalY < size.height) {
      tiles[centerGalY][centerGalX].biome = BiomeType.STATUE;
    }
  });
  
  // Corridors connecting galleries to atrium
  // North corridor
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    for (let y = 13; y < centerY - 6; y++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  // South corridor
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    for (let y = centerY + 7; y < size.height - 13; y++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
}

function generateGallery(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Renaissance/Early Modern art gallery
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Long gallery hall
  for (let y = 5; y < size.height - 5; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      if (x > 0 && x < size.width - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Columns along the gallery
  for (let y = 8; y < size.height - 8; y += 6) {
    tiles[y][centerX - 6].biome = BiomeType.COLUMN;
    tiles[y][centerX + 6].biome = BiomeType.COLUMN;
  }
  
  // Paintings on walls (represented by tables as display surfaces)
  for (let y = 7; y < size.height - 7; y += 4) {
    tiles[y][centerX - 8].biome = BiomeType.TABLE;
    tiles[y][centerX + 8].biome = BiomeType.TABLE;
  }
  
  // Sculptures in center
  for (let y = 10; y < size.height - 10; y += 8) {
    tiles[y][centerX].biome = BiomeType.STATUE;
  }
  
  // Side chambers for special collections
  // West chamber
  for (let y = centerY - 4; y <= centerY + 4; y++) {
    for (let x = 3; x < centerX - 9; x++) {
      if (x > 0 && y > 0 && y < size.height - 1) {
        if (x === 3 || x === centerX - 10 || 
            y === centerY - 4 || y === centerY + 4) {
          if (!(x === centerX - 10 && Math.abs(y - centerY) < 2)) {
            tiles[y][x].biome = BiomeType.WALL;
          }
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
  }
  
  // East chamber
  for (let y = centerY - 4; y <= centerY + 4; y++) {
    for (let x = centerX + 10; x < size.width - 3; x++) {
      if (x < size.width - 1 && y > 0 && y < size.height - 1) {
        if (x === size.width - 4 || x === centerX + 9 || 
            y === centerY - 4 || y === centerY + 4) {
          if (!(x === centerX + 9 && Math.abs(y - centerY) < 2)) {
            tiles[y][x].biome = BiomeType.WALL;
          }
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
  }
  
  // Benches for viewing
  for (let y = centerY - 2; y <= centerY + 2; y += 4) {
    tiles[y][centerX - 3].biome = BiomeType.CHAIR;
    tiles[y][centerX].biome = BiomeType.CHAIR;
    tiles[y][centerX + 3].biome = BiomeType.CHAIR;
  }
}

function generateGenericExhibition(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Simple exhibition hall
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main exhibition floor
  fillArea(tiles, 3, 3, size.width - 6, size.height - 6, BiomeType.FLOOR_MARBLE);
  
  // Display areas along walls
  for (let x = 5; x < size.width - 5; x += 4) {
    tiles[4][x].biome = BiomeType.TABLE;
    tiles[size.height - 5][x].biome = BiomeType.TABLE;
  }
  
  for (let y = 5; y < size.height - 5; y += 4) {
    tiles[y][4].biome = BiomeType.TABLE;
    tiles[y][size.width - 5].biome = BiomeType.TABLE;
  }
  
  // Central display
  for (let y = centerY - 3; y <= centerY + 3; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      if (Math.abs(x - centerX) === 3 || Math.abs(y - centerY) === 3) {
        tiles[y][x].biome = BiomeType.TABLE;
      }
    }
  }
  
  tiles[centerY][centerX].biome = BiomeType.STATUE;
}

function createPavilion(tiles: Tile[][], startX: number, startY: number, 
                        width: number, height: number, noise: ValueNoise) {
  // Create a pavilion structure
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        // Walls
        if (y === startY || y === startY + height - 1 || 
            x === startX || x === startX + width - 1) {
          // Leave entrance
          if (!((x === startX + Math.floor(width / 2)) && y === startY + height - 1)) {
            tiles[y][x].biome = BiomeType.PAVILION;
          }
        } else {
          // Interior floor
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
          
          // Add some display tables
          if (noise.random() > 0.8 && 
              x > startX + 1 && x < startX + width - 2 &&
              y > startY + 1 && y < startY + height - 2) {
            tiles[y][x].biome = BiomeType.TABLE;
          }
        }
      }
    }
  }
}