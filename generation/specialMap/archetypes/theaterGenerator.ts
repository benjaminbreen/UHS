/**
 * generation/specialMap/archetypes/theaterGenerator.ts
 * Generator for theater special maps
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

/**
 * Generate simple theater for tiny maps
 */
function generateSimpleTheater(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  const centerX = Math.floor(size.width / 2);
  
  // Tiny stage at top
  for (let x = 2; x < size.width - 2; x++) {
    tiles[1][x].biome = BiomeType.STAGE;
    tiles[1][x].isBlocking = true;
  }
  
  // Few benches for audience
  for (let y = 3; y < size.height - 2; y += 2) {
    for (let x = 2; x < size.width - 2; x += 2) {
      tiles[y][x].biome = BiomeType.BENCH;
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Stage interaction zone
  interactionZones.push({
    id: 'stage',
    bounds: { x: 2, y: 1, width: size.width - 4, height: 1 },
    type: 'stage',
    interactions: ['perform', 'speak']
  });
}

export function generateTheater(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Create perimeter walls with main entrance at south
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Fill with appropriate flooring
  const floorType = config.era === 'ANTIQUITY' ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_WOOD;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  // Always use improved standard layout
  generateImprovedTheater(tiles, size, config, interactionZones, exitZones);
  
  return { tiles, interactionZones, exitZones };
}

function generateImprovedTheater(
  tiles: Tile[][], 
  size: any, 
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  const centerX = Math.floor(size.width / 2);
  
  // Handle tiny maps (XS: 8x8) with minimal layout
  if (size.width <= 10 || size.height <= 10) {
    generateSimpleTheater(tiles, size, config, interactionZones, exitZones);
    return;
  }
  
  // STAGE AREA - Top middle (raised platform)
  const stageWidth = Math.floor(size.width * 0.6);
  const stageStartX = Math.floor((size.width - stageWidth) / 2);
  const stageDepth = Math.min(6, Math.max(2, Math.floor(size.height * 0.25)));
  
  // Main stage platform
  for (let y = 2; y < 2 + stageDepth; y++) {
    for (let x = stageStartX; x < stageStartX + stageWidth; x++) {
      tiles[y][x].biome = BiomeType.STAGE;
    }
  }
  
  // Stage backdrop/wall
  for (let x = stageStartX - 1; x <= stageStartX + stageWidth; x++) {
    tiles[1][x].biome = BiomeType.WALL;
  }
  
  // BACKSTAGE ENTRANCE - Top center (door to interior map)
  const backstageX = centerX;
  const backstageY = 0;
  tiles[backstageY][backstageX].biome = BiomeType.DOOR;
  
  // Add backstage exit zone
  exitZones.push({
    id: 'backstage_entrance',
    location: [backstageX, backstageY],
    label: 'Backstage',
    destination: 'theater_backstage_interior'
  });
  
  // BENCHES - Left and right sides (tiered seating)
  const benchStartY = stageDepth + 4;
  const benchEndY = size.height - 6;
  
  // Left side benches (3 columns)
  for (let col = 0; col < 3; col++) {
    const x = 2 + col * 2;
    for (let y = benchStartY; y < benchEndY; y += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
      // Add small table between some benches
      if (y % 4 === 0 && col < 2) {
        tiles[y][x + 1].biome = BiomeType.TABLE;
      }
    }
  }
  
  // Right side benches (3 columns)
  for (let col = 0; col < 3; col++) {
    const x = size.width - 3 - col * 2;
    for (let y = benchStartY; y < benchEndY; y += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
      // Add small table between some benches
      if (y % 4 === 0 && col < 2) {
        tiles[y][x - 1].biome = BiomeType.TABLE;
      }
    }
  }
  
  // GROUNDLINGS AREA - Bottom center (standing area for common folk)
  const groundlingsStartX = Math.floor(size.width * 0.25);
  const groundlingsEndX = Math.floor(size.width * 0.75);
  const groundlingsStartY = size.height - 7;
  const groundlingsEndY = size.height - 2;
  
  // Mark groundlings area with different floor type
  for (let y = groundlingsStartY; y < groundlingsEndY; y++) {
    for (let x = groundlingsStartX; x < groundlingsEndX; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE; // Dirt/stone for standing area
    }
  }
  
  // Add some decorative elements based on culture
  if (config.culturalZone === 'EUROPEAN') {
    // Columns supporting upper galleries
    tiles[benchStartY - 1][1].biome = BiomeType.COLUMN;
    tiles[benchStartY - 1][size.width - 2].biome = BiomeType.COLUMN;
    tiles[benchEndY][1].biome = BiomeType.COLUMN;
    tiles[benchEndY][size.width - 2].biome = BiomeType.COLUMN;
  } else if (config.culturalZone === 'EAST_ASIAN') {
    // Paper lanterns on walls
    tiles[stageDepth + 2][1].biome = BiomeType.TORCH;
    tiles[stageDepth + 2][size.width - 2].biome = BiomeType.TORCH;
  }
  
  // VIP boxes near stage (for wealthy patrons)
  if (config.era === 'RENAISSANCE_EARLY_MODERN' || config.era === 'INDUSTRIAL_ERA') {
    // Left VIP box
    for (let x = 2; x < 5; x++) {
      tiles[stageDepth + 2][x].biome = BiomeType.CHAIR;
    }
    tiles[stageDepth + 2][5].biome = BiomeType.WALL; // Divider
    
    // Right VIP box
    for (let x = size.width - 5; x < size.width - 2; x++) {
      tiles[stageDepth + 2][x].biome = BiomeType.CHAIR;
    }
    tiles[stageDepth + 2][size.width - 6].biome = BiomeType.WALL; // Divider
  }
  
  // Add interaction zones
  interactionZones.push({
    id: 'stage',
    bounds: { 
      x: stageStartX, 
      y: 2,
      width: stageWidth, 
      height: stageDepth 
    },
    type: 'stage',
    interactions: ['perform', 'watch', 'applaud']
  });
  
  interactionZones.push({
    id: 'groundlings',
    bounds: { 
      x: groundlingsStartX, 
      y: groundlingsStartY,
      width: groundlingsEndX - groundlingsStartX, 
      height: groundlingsEndY - groundlingsStartY
    },
    type: 'standing_area',
    interactions: ['cheer', 'jeer', 'throw_tomatoes']
  });
  
  // Main entrance at bottom
  exitZones.push({
    id: 'main_entrance',
    location: [centerX, size.height - 1],
    label: 'Exit to Street',
    destination: 'parent_map'
  });
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