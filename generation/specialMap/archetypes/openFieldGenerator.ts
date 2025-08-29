/**
 * generation/specialMap/archetypes/openFieldGenerator.ts
 * Generator for open field special maps (parade grounds, festival spaces, etc.)
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateOpenField(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Determine field type based on purpose and era
  const fieldPurpose = getFieldPurpose(config);
  
  // Most open fields don't have walls, but some do
  if (fieldPurpose === 'parade_ground' || fieldPurpose === 'plaza') {
    // Minimal walls with many gates
    placeWallRectangle(tiles, 0, 0, size.width, size.height, [
      { side: 'north', offset: Math.floor(size.width * 0.25) },
      { side: 'north', offset: Math.floor(size.width * 0.5) },
      { side: 'north', offset: Math.floor(size.width * 0.75) },
      { side: 'south', offset: Math.floor(size.width * 0.25) },
      { side: 'south', offset: Math.floor(size.width * 0.5) },
      { side: 'south', offset: Math.floor(size.width * 0.75) },
      { side: 'east', offset: Math.floor(size.height * 0.5) },
      { side: 'west', offset: Math.floor(size.height * 0.5) }
    ]);
  }
  
  // Fill with appropriate ground cover
  const groundType = getGroundType(fieldPurpose, config);
  fillArea(tiles, 0, 0, size.width, size.height, groundType);
  
  // Generate based on purpose
  switch (fieldPurpose) {
    case 'parade_ground':
      generateParadeGround(tiles, size, config);
      break;
    case 'festival':
      generateFestivalGround(tiles, size, config, noise);
      break;
    case 'plaza':
      generatePlaza(tiles, size, config);
      break;
    case 'dueling':
      generateDuelingGround(tiles, size, config);
      break;
    case 'naadam':
      generateNaadamField(tiles, size, config);
      break;
    case 'training':
      generateTrainingGround(tiles, size, config);
      break;
    case 'speakers_corner':
      generateSpeakersCorner(tiles, size, config);
      break;
    default:
      generateGenericField(tiles, size, config);
  }
  
  // Main interaction zone
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  interactionZones.push({
    id: 'main_field',
    bounds: { 
      x: centerX - 20, 
      y: centerY - 15,
      width: 40, 
      height: 30 
    },
    type: 'open_field',
    interactions: ['gather', 'celebrate', 'compete', 'speak']
  });
  
  // Exit zones (multiple for open fields)
  if (fieldPurpose === 'parade_ground' || fieldPurpose === 'plaza') {
    exitZones.push(
      { id: 'north_1', location: [Math.floor(size.width * 0.25), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'north_2', location: [Math.floor(size.width * 0.5), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'north_3', location: [Math.floor(size.width * 0.75), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'south_1', location: [Math.floor(size.width * 0.25), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' },
      { id: 'south_2', location: [Math.floor(size.width * 0.5), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' },
      { id: 'south_3', location: [Math.floor(size.width * 0.75), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' }
    );
  } else {
    // Open fields typically have no walls, so exits at edges
    exitZones.push(
      { id: 'north', location: [centerX, 0], label: 'North', destination: 'parent_map' },
      { id: 'south', location: [centerX, size.height - 1], label: 'South', destination: 'parent_map' },
      { id: 'east', location: [size.width - 1, centerY], label: 'East', destination: 'parent_map' },
      { id: 'west', location: [0, centerY], label: 'West', destination: 'parent_map' }
    );
  }
  
  return { tiles, interactionZones, exitZones };
}

function getFieldPurpose(config: SpecialMapConfig): string {
  if (config.culturalZone === 'EUROPEAN' && 
      (config.era === 'INDUSTRIAL_ERA' || config.era === 'MODERN_ERA')) {
    if (config.specificYear && config.specificYear >= 1850 && config.specificYear <= 1950) {
      return 'parade_ground';
    }
    return 'speakers_corner';
  } else if (config.culturalZone === 'EAST_ASIAN' && config.region === 'mongolia') {
    return 'naadam';
  } else if (config.culturalZone === 'EUROPEAN' && 
             (config.era === 'RENAISSANCE_EARLY_MODERN' || config.era === 'INDUSTRIAL_ERA')) {
    return 'dueling';
  } else if (config.culturalZone === 'MENA' && config.era === 'MEDIEVAL') {
    return 'training';
  } else if (config.era === 'MODERN_ERA') {
    return 'festival';
  } else if (config.era === 'ANTIQUITY') {
    return 'training';
  }
  return 'plaza';
}

function getGroundType(purpose: string, config: SpecialMapConfig): BiomeType {
  switch (purpose) {
    case 'parade_ground':
      return BiomeType.ROAD;
    case 'plaza':
      return BiomeType.FLOOR_STONE;
    case 'training':
      return BiomeType.SAND;
    case 'naadam':
    case 'festival':
    case 'dueling':
      return BiomeType.GRASS;
    default:
      return BiomeType.GRASS;
  }
}

function generateParadeGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Military parade ground with reviewing stand
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main parade route (wide road down center)
  for (let y = 5; y < size.height - 5; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      if (x > 0 && x < size.width - 1) {
        tiles[y][x].biome = BiomeType.ROAD;
      }
    }
  }
  
  // Reviewing stand at north
  for (let x = centerX - 10; x <= centerX + 10; x++) {
    for (let y = 2; y <= 4; y++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.PAVILION;
      }
    }
  }
  
  // VIP seating in reviewing stand
  for (let x = centerX - 8; x <= centerX + 8; x += 2) {
    tiles[3][x].biome = BiomeType.CHAIR;
  }
  tiles[3][centerX].biome = BiomeType.THRONE; // Central position for leader
  
  // Flag poles along parade route
  for (let y = 10; y < size.height - 10; y += 8) {
    tiles[y][centerX - 10].biome = BiomeType.COLUMN;
    tiles[y][centerX + 10].biome = BiomeType.COLUMN;
  }
  
  // Spectator areas on sides
  for (let y = 8; y < size.height - 8; y += 3) {
    for (let x = 3; x < centerX - 12; x += 3) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
    for (let x = centerX + 13; x < size.width - 3; x += 3) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generateFestivalGround(tiles: Tile[][], size: any, config: SpecialMapConfig, noise: ValueNoise) {
  // Festival ground with tents and stages
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main stage at north
  for (let x = centerX - 12; x <= centerX + 12; x++) {
    for (let y = 3; y <= 8; y++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.STAGE;
      }
    }
  }
  
  // Dance floor/gathering area in center
  for (let y = centerY - 8; y <= centerY + 8; y++) {
    for (let x = centerX - 10; x <= centerX + 10; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      }
    }
  }
  
  // Food and vendor tents (pavilions) scattered around
  const tentPositions = [
    { x: 5, y: 15 },
    { x: size.width - 10, y: 15 },
    { x: 5, y: size.height - 10 },
    { x: size.width - 10, y: size.height - 10 },
    { x: 15, y: centerY },
    { x: size.width - 15, y: centerY }
  ];
  
  tentPositions.forEach(pos => {
    for (let y = pos.y; y < pos.y + 5 && y < size.height - 1; y++) {
      for (let x = pos.x; x < pos.x + 5 && x < size.width - 1; x++) {
        if (x > 0 && y > 0) {
          if (x === pos.x || x === pos.x + 4 || y === pos.y || y === pos.y + 4) {
            tiles[y][x].biome = BiomeType.PAVILION;
          } else {
            tiles[y][x].biome = BiomeType.TABLE; // Vendor tables
          }
        }
      }
    }
  });
  
  // Scattered seating areas
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(noise.random() * (size.width - 4)) + 2;
    const y = Math.floor(noise.random() * (size.height - 15)) + 12;
    if (tiles[y][x].biome === BiomeType.GRASS) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generatePlaza(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Urban plaza with fountain and monuments
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Paved plaza floor
  fillArea(tiles, 2, 2, size.width - 4, size.height - 4, BiomeType.FLOOR_STONE);
  
  // Central fountain
  for (let y = centerY - 3; y <= centerY + 3; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= 9) {
        tiles[y][x].biome = BiomeType.FOUNTAIN;
      }
    }
  }
  
  // Monument/statue at key positions
  tiles[8][centerX].biome = BiomeType.STATUE;
  tiles[size.height - 9][centerX].biome = BiomeType.STATUE;
  
  // Trees/gardens in corners
  const gardenCorners = [
    { x: 5, y: 5 },
    { x: size.width - 8, y: 5 },
    { x: 5, y: size.height - 8 },
    { x: size.width - 8, y: size.height - 8 }
  ];
  
  gardenCorners.forEach(corner => {
    for (let y = corner.y; y < corner.y + 3; y++) {
      for (let x = corner.x; x < corner.x + 3; x++) {
        if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.PARK;
        }
      }
    }
  });
  
  // Benches around plaza
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const x = Math.floor(centerX + 12 * Math.cos(angle));
    const y = Math.floor(centerY + 12 * Math.sin(angle));
    if (x > 1 && x < size.width - 2 && y > 1 && y < size.height - 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generateDuelingGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Formal dueling ground
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Dueling strip in center
  for (let y = centerY - 15; y <= centerY + 15; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
  }
  
  // Starting positions marked
  tiles[centerY - 10][centerX].biome = BiomeType.FLOOR_STONE;
  tiles[centerY + 10][centerX].biome = BiomeType.FLOOR_STONE;
  
  // Witness pavilions on sides
  tiles[centerY][10].biome = BiomeType.PAVILION;
  tiles[centerY][size.width - 11].biome = BiomeType.PAVILION;
  
  // Seconds' positions
  tiles[centerY - 10][centerX - 6].biome = BiomeType.CHAIR;
  tiles[centerY - 10][centerX + 6].biome = BiomeType.CHAIR;
  tiles[centerY + 10][centerX - 6].biome = BiomeType.CHAIR;
  tiles[centerY + 10][centerX + 6].biome = BiomeType.CHAIR;
  
  // Trees for privacy (dueling often done at dawn in secluded spots)
  for (let y = 3; y < size.height - 3; y += 5) {
    tiles[y][3].biome = BiomeType.FOREST;
    tiles[y][size.width - 4].biome = BiomeType.FOREST;
  }
}

function generateNaadamField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Mongolian Naadam festival ground (three manly sports)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Wrestling circle in center
  for (let y = centerY - 8; y <= centerY + 8; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= 64) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
  }
  
  // Archery range on west side
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = 5; x < centerX - 12; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Archery targets
  tiles[centerY][8].biome = BiomeType.TABLE; // Target stand
  
  // Horse racing track markers (around perimeter)
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const x = Math.floor(centerX + 20 * Math.cos(angle));
    const y = Math.floor(centerY + 15 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.COLUMN; // Marker posts
    }
  }
  
  // Spectator yurts (represented as pavilions)
  const yurtPositions = [
    { x: 5, y: 5 },
    { x: size.width - 8, y: 5 },
    { x: 5, y: size.height - 8 },
    { x: size.width - 8, y: size.height - 8 }
  ];
  
  yurtPositions.forEach(pos => {
    for (let y = pos.y; y < pos.y + 3; y++) {
      for (let x = pos.x; x < pos.x + 3; x++) {
        if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.PAVILION;
        }
      }
    }
  });
}

function generateTrainingGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Military training ground
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Sparring circles
  const circles = [
    { x: centerX - 10, y: centerY - 8 },
    { x: centerX + 10, y: centerY - 8 },
    { x: centerX - 10, y: centerY + 8 },
    { x: centerX + 10, y: centerY + 8 }
  ];
  
  circles.forEach(circle => {
    for (let y = circle.y - 4; y <= circle.y + 4; y++) {
      for (let x = circle.x - 4; x <= circle.x + 4; x++) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        if (dx * dx + dy * dy <= 16 && x > 0 && x < size.width - 1 && 
            y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.SAND;
        }
      }
    }
  });
  
  // Weapon racks
  for (let x = 5; x < size.width - 5; x += 10) {
    tiles[3][x].biome = BiomeType.TABLE;
    tiles[size.height - 4][x].biome = BiomeType.TABLE;
  }
  
  // Training dummies (represented as columns)
  for (let x = centerX - 15; x <= centerX + 15; x += 5) {
    tiles[centerY][x].biome = BiomeType.COLUMN;
  }
  
  // Observation platform
  for (let x = centerX - 5; x <= centerX + 5; x++) {
    tiles[size.height - 8][x].biome = BiomeType.PAVILION;
  }
}

function generateSpeakersCorner(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Hyde Park style speakers' corner
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main speaking platform
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      tiles[y][x].biome = BiomeType.STAGE;
    }
  }
  
  // Secondary speaking spots (soap boxes)
  const speakingSpots = [
    { x: 10, y: 10 },
    { x: size.width - 11, y: 10 },
    { x: 10, y: size.height - 11 },
    { x: size.width - 11, y: size.height - 11 }
  ];
  
  speakingSpots.forEach(spot => {
    tiles[spot.y][spot.x].biome = BiomeType.TABLE; // Soapbox
  });
  
  // Gathering areas (circles of chairs)
  speakingSpots.forEach(spot => {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const x = Math.floor(spot.x + 3 * Math.cos(angle));
      const y = Math.floor(spot.y + 3 * Math.sin(angle));
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  });
  
  // Park benches scattered around
  for (let i = 0; i < 10; i++) {
    const x = 5 + Math.floor(Math.random() * (size.width - 10));
    const y = 5 + Math.floor(Math.random() * (size.height - 10));
    if (tiles[y][x].biome === BiomeType.GRASS) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Trees for atmosphere
  for (let y = 2; y < size.height - 2; y += 8) {
    for (let x = 2; x < size.width - 2; x += 8) {
      if (tiles[y][x].biome === BiomeType.GRASS) {
        tiles[y][x].biome = BiomeType.PARK;
      }
    }
  }
}

function generateGenericField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Simple open field
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Some scattered features
  tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  
  // Boundary markers
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const x = Math.floor(centerX + 15 * Math.cos(angle));
    const y = Math.floor(centerY + 12 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Some seating
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const x = Math.floor(centerX + 8 * Math.cos(angle));
    const y = Math.floor(centerY + 8 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}