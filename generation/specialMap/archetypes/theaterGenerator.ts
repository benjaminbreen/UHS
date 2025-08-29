/**
 * generation/specialMap/archetypes/theaterGenerator.ts
 * Generator for theater special maps
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateTheater(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Determine theater type based on era and culture
  const theaterType = getTheaterType(config);
  
  // Create perimeter walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'south', offset: Math.floor(size.width / 2) - 5 },
    { side: 'south', offset: Math.floor(size.width / 2) + 5 }
  ]);
  
  // Fill with appropriate flooring
  const floorType = config.era === 'ANTIQUITY' ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_WOOD;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  if (theaterType === 'amphitheater') {
    generateAmphitheater(tiles, size, config);
  } else if (theaterType === 'proscenium') {
    generateProsceniumTheater(tiles, size, config);
  } else if (theaterType === 'kabuki') {
    generateKabukiTheater(tiles, size, config);
  } else {
    generateGlobeTheater(tiles, size, config);
  }
  
  // Stage interaction zone
  const stageY = Math.floor(size.height * 0.2);
  interactionZones.push({
    id: 'stage',
    bounds: { 
      x: Math.floor(size.width * 0.3), 
      y: stageY - 3,
      width: Math.floor(size.width * 0.4), 
      height: 6 
    },
    type: 'stage',
    interactions: ['perform', 'watch', 'applaud']
  });
  
  // Exit zones at south
  exitZones.push(
    { id: 'main_exit', location: [Math.floor(size.width / 2), size.height - 1], 
      label: 'Main Entrance', destination: 'parent_map' },
    { id: 'west_exit', location: [Math.floor(size.width / 2) - 5, size.height - 1], 
      label: 'West Door', destination: 'parent_map' },
    { id: 'east_exit', location: [Math.floor(size.width / 2) + 5, size.height - 1], 
      label: 'East Door', destination: 'parent_map' }
  );
  
  return { tiles, interactionZones, exitZones };
}

function getTheaterType(config: SpecialMapConfig): string {
  if (config.culturalZone === 'EUROPEAN' && config.era === 'ANTIQUITY') {
    return 'amphitheater';
  } else if (config.culturalZone === 'EAST_ASIAN' && config.era !== 'MODERN_ERA') {
    return 'kabuki';
  } else if (config.culturalZone === 'EUROPEAN' && 
             (config.era === 'RENAISSANCE_EARLY_MODERN' || config.era === 'MEDIEVAL')) {
    return 'globe';
  }
  return 'proscenium';
}

function generateAmphitheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Greek/Roman style semicircular seating
  const centerX = Math.floor(size.width / 2);
  const stageY = Math.floor(size.height * 0.2);
  
  // Orchestra (stage) area
  for (let y = stageY - 3; y <= stageY + 3; y++) {
    for (let x = centerX - 10; x <= centerX + 10; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.STAGE;
      }
    }
  }
  
  // Tiered seating in semicircle
  for (let tier = 1; tier <= 12; tier++) {
    const radius = 12 + tier * 2;
    for (let angle = 0; angle <= Math.PI; angle += 0.1) {
      const x = Math.floor(centerX + radius * Math.cos(angle));
      const y = Math.floor(stageY + radius * Math.sin(angle));
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  }
}

function generateProsceniumTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Modern theater with stage and rows of seats
  const stageY = Math.floor(size.height * 0.15);
  
  // Stage area
  for (let y = 1; y <= stageY; y++) {
    for (let x = Math.floor(size.width * 0.2); x < Math.floor(size.width * 0.8); x++) {
      tiles[y][x].biome = BiomeType.STAGE;
    }
  }
  
  // Proscenium arch (walls)
  for (let y = stageY; y <= stageY + 2; y++) {
    tiles[y][Math.floor(size.width * 0.2) - 1].biome = BiomeType.WALL;
    tiles[y][Math.floor(size.width * 0.8)].biome = BiomeType.WALL;
  }
  
  // Seating rows
  for (let row = 0; row < 15; row++) {
    const y = stageY + 5 + row * 2;
    if (y >= size.height - 2) break;
    
    for (let x = Math.floor(size.width * 0.15); x < Math.floor(size.width * 0.85); x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Side boxes for wealthy patrons (if appropriate era)
  if (config.era === 'INDUSTRIAL_ERA' || config.era === 'RENAISSANCE_EARLY_MODERN') {
    // West boxes
    for (let y = stageY + 5; y < size.height - 5; y += 5) {
      for (let x = 2; x < 5; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
    // East boxes
    for (let y = stageY + 5; y < size.height - 5; y += 5) {
      for (let x = size.width - 5; x < size.width - 2; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  }
}

function generateKabukiTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Japanese theater with hanamichi runway
  const stageY = Math.floor(size.height * 0.2);
  const centerX = Math.floor(size.width / 2);
  
  // Main stage
  for (let y = 1; y <= stageY; y++) {
    for (let x = Math.floor(size.width * 0.25); x < Math.floor(size.width * 0.75); x++) {
      tiles[y][x].biome = BiomeType.STAGE;
    }
  }
  
  // Hanamichi (runway through audience) - distinctive feature
  for (let y = stageY; y < size.height - 1; y++) {
    tiles[y][Math.floor(size.width * 0.25)].biome = BiomeType.STAGE;
    tiles[y][Math.floor(size.width * 0.25) + 1].biome = BiomeType.STAGE;
  }
  
  // Seating areas (tatami style in historical periods)
  const seatType = config.era === 'MODERN_ERA' ? BiomeType.CHAIR : BiomeType.FLOOR_WOOD;
  
  // Left seating
  for (let y = stageY + 3; y < size.height - 3; y += 2) {
    for (let x = 3; x < Math.floor(size.width * 0.25) - 2; x += 2) {
      tiles[y][x].biome = seatType;
    }
  }
  
  // Right seating
  for (let y = stageY + 3; y < size.height - 3; y += 2) {
    for (let x = Math.floor(size.width * 0.25) + 3; x < size.width - 3; x += 2) {
      tiles[y][x].biome = seatType;
    }
  }
  
  // Decorative pillars
  tiles[stageY][Math.floor(size.width * 0.25) - 2].biome = BiomeType.COLUMN;
  tiles[stageY][Math.floor(size.width * 0.75) + 1].biome = BiomeType.COLUMN;
}

function generateGlobeTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Elizabethan open-air theater
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central stage (thrust stage)
  for (let y = centerY - 5; y <= centerY + 2; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.STAGE;
      }
    }
  }
  
  // Pit area (standing room)
  for (let y = centerY + 3; y < centerY + 8; y++) {
    for (let x = centerX - 10; x <= centerX + 10; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // Galleries (three levels represented as rings)
  for (let ring = 1; ring <= 3; ring++) {
    const radius = 12 + ring * 3;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const x = Math.floor(centerX + radius * Math.cos(angle));
      const y = Math.floor(centerY + radius * Math.sin(angle));
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        // Skip the stage area
        if (y > centerY - 6) {
          tiles[y][x].biome = BiomeType.CHAIR;
        }
      }
    }
  }
  
  // Stage pillars (supporting the "heavens" canopy)
  tiles[centerY - 5][centerX - 6].biome = BiomeType.COLUMN;
  tiles[centerY - 5][centerX + 6].biome = BiomeType.COLUMN;
}