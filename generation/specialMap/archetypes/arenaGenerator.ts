/**
 * generation/specialMap/archetypes/arenaGenerator.ts
 * Generator for arena/sports venue special maps
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateArena(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Determine arena type based on culture and era
  const arenaType = getArenaType(config);
  
  // Create perimeter walls with multiple gates
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'north', offset: Math.floor(size.width / 4) },
    { side: 'north', offset: Math.floor(size.width * 3 / 4) },
    { side: 'south', offset: Math.floor(size.width / 4) },
    { side: 'south', offset: Math.floor(size.width * 3 / 4) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Fill with base flooring
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Generate based on arena type
  switch (arenaType) {
    case 'colosseum':
      generateColosseum(tiles, size, config, noise);
      break;
    case 'ballcourt':
      generateBallCourt(tiles, size, config);
      break;
    case 'tournament':
      generateTournamentField(tiles, size, config);
      break;
    case 'sumo':
      generateSumoRing(tiles, size, config);
      break;
    case 'hippodrome':
      generateHippodrome(tiles, size, config);
      break;
    case 'polo':
      generatePoloField(tiles, size, config);
      break;
    default:
      generateGenericArena(tiles, size, config);
  }
  
  // Arena floor interaction zone - scale with map size
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const arenaWidth = Math.min(30, Math.floor(size.width * 0.7));
  const arenaHeight = Math.min(20, Math.floor(size.height * 0.6));
  interactionZones.push({
    id: 'arena_floor',
    bounds: { 
      x: centerX - Math.floor(arenaWidth / 2), 
      y: centerY - Math.floor(arenaHeight / 2),
      width: arenaWidth, 
      height: arenaHeight 
    },
    type: 'arena',
    interactions: ['compete', 'spectate', 'challenge']
  });
  
  // Exit zones
  exitZones.push(
    { id: 'north_gate_1', location: [Math.floor(size.width / 4), 0], 
      label: 'North Gate', destination: 'parent_map' },
    { id: 'north_gate_2', location: [Math.floor(size.width * 3 / 4), 0], 
      label: 'North Gate', destination: 'parent_map' },
    { id: 'south_gate_1', location: [Math.floor(size.width / 4), size.height - 1], 
      label: 'South Gate', destination: 'parent_map' },
    { id: 'south_gate_2', location: [Math.floor(size.width * 3 / 4), size.height - 1], 
      label: 'South Gate', destination: 'parent_map' }
  );
  
  return { tiles, interactionZones, exitZones };
}

function getArenaType(config: SpecialMapConfig): string {
  if (config.culturalZone === 'EUROPEAN' && config.era === 'ANTIQUITY') {
    return 'colosseum';
  } else if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
             (config.culturalZone === 'SOUTH_AMERICAN' && config.era === 'MEDIEVAL')) {
    return 'ballcourt';
  } else if (config.culturalZone === 'EUROPEAN' && config.era === 'MEDIEVAL') {
    return 'tournament';
  } else if (config.culturalZone === 'EAST_ASIAN' && config.region === 'japan') {
    return 'sumo';
  } else if (config.culturalZone === 'MENA' && config.era === 'ANTIQUITY') {
    return 'hippodrome';
  } else if ((config.culturalZone === 'SOUTH_ASIAN' || config.culturalZone === 'MENA') && 
             config.era !== 'PREHISTORY') {
    return 'polo';
  }
  return 'generic';
}

function generateColosseum(tiles: Tile[][], size: any, config: SpecialMapConfig, noise: ValueNoise) {
  // Roman colosseum with oval shape and tiered seating
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const radiusX = Math.floor(size.width * 0.35);
  const radiusY = Math.floor(size.height * 0.3);
  
  // Arena floor (sand)
  for (let y = centerY - 8; y <= centerY + 8; y++) {
    for (let x = centerX - 12; x <= centerX + 12; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        // Elliptical check
        const dx = (x - centerX) / 12;
        const dy = (y - centerY) / 8;
        if (dx * dx + dy * dy <= 1) {
          tiles[y][x].biome = BiomeType.SAND;
        }
      }
    }
  }
  
  // Tiered seating in oval pattern - scale with map size
  const maxTiers = size.width <= 10 ? 2 : size.width <= 16 ? 3 : 4;
  for (let tier = 1; tier <= maxTiers; tier++) {
    const tierRadiusX = Math.floor(size.width * 0.2) + tier * Math.floor(size.width * 0.1);
    const tierRadiusY = Math.floor(size.height * 0.2) + tier * Math.floor(size.height * 0.08);
    
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const x = Math.floor(centerX + tierRadiusX * Math.cos(angle));
      const y = Math.floor(centerY + tierRadiusY * Math.sin(angle));
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  }
  
  // Hypogeum (underground areas) represented by cells
  if (config.era === 'ANTIQUITY' && noise.random() > 0.5) {
    // Add some cell markers in the center
    tiles[centerY][centerX - 5].biome = BiomeType.CELL;
    tiles[centerY][centerX + 5].biome = BiomeType.CELL;
  }
  
  // Imperial box
  tiles[centerY][1].biome = BiomeType.THRONE;
  tiles[centerY][size.width - 2].biome = BiomeType.THRONE;
}

function generateBallCourt(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Mesoamerican I-shaped ball court
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Playing alley (I-shape) - scale with map size
  // Main alley
  const alleyLength = Math.min(12, Math.floor(size.height * 0.4));
  const alleyWidth = Math.min(3, Math.floor(size.width * 0.15));
  for (let y = centerY - alleyLength; y <= centerY + alleyLength; y++) {
    for (let x = centerX - alleyWidth; x <= centerX + alleyWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // End zones (wider parts of the I)
  // North end zone
  for (let y = centerY - 15; y < centerY - 12; y++) {
    for (let x = centerX - 6; x <= centerX + 6; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // South end zone  
  for (let y = centerY + 12; y <= centerY + 15; y++) {
    for (let x = centerX - 6; x <= centerX + 6; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // Slanted walls (represented by walls along the court)
  for (let y = centerY - 12; y <= centerY + 12; y++) {
    tiles[y][centerX - 4].biome = BiomeType.WALL;
    tiles[y][centerX + 4].biome = BiomeType.WALL;
  }
  
  // Ring goals (represented as special markers)
  tiles[centerY][centerX - 4].biome = BiomeType.STATUE; // Ring on west wall
  tiles[centerY][centerX + 4].biome = BiomeType.STATUE; // Ring on east wall
  
  // Viewing platforms
  for (let y = centerY - 10; y <= centerY + 10; y += 4) {
    tiles[y][centerX - 8].biome = BiomeType.PAVILION;
    tiles[y][centerX + 8].biome = BiomeType.PAVILION;
  }
}

function generateTournamentField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Medieval tournament grounds with lists (barriers)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Jousting lists (barrier down the middle)
  for (let y = centerY - 15; y <= centerY + 15; y++) {
    if (y > 0 && y < size.height - 1) {
      tiles[y][centerX].biome = BiomeType.WALL;
    }
  }
  
  // Lanes on either side
  for (let y = centerY - 15; y <= centerY + 15; y++) {
    for (let x = centerX - 6; x < centerX; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
    for (let x = centerX + 1; x <= centerX + 6; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
  }
  
  // Royal pavilion at north
  for (let x = centerX - 5; x <= centerX + 5; x++) {
    tiles[3][x].biome = BiomeType.PAVILION;
  }
  tiles[4][centerX].biome = BiomeType.THRONE;
  
  // Spectator pavilions along sides
  for (let y = 8; y < size.height - 8; y += 6) {
    tiles[y][5].biome = BiomeType.PAVILION;
    tiles[y][size.width - 6].biome = BiomeType.PAVILION;
  }
  
  // Weapon racks at ends of lists
  tiles[centerY - 15][centerX - 3].biome = BiomeType.TABLE;
  tiles[centerY - 15][centerX + 3].biome = BiomeType.TABLE;
  tiles[centerY + 15][centerX - 3].biome = BiomeType.TABLE;
  tiles[centerY + 15][centerX + 3].biome = BiomeType.TABLE;
}

function generateSumoRing(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Japanese sumo dohyo (ring)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Sacred dohyo (raised clay ring)
  const ringRadius = 4;
  for (let y = centerY - ringRadius; y <= centerY + ringRadius; y++) {
    for (let x = centerX - ringRadius; x <= centerX + ringRadius; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= ringRadius * ringRadius) {
        tiles[y][x].biome = BiomeType.SAND; // Clay represented as sand
      }
    }
  }
  
  // Sacred roof pillars (4 corners)
  tiles[centerY - 8][centerX - 8].biome = BiomeType.COLUMN;
  tiles[centerY - 8][centerX + 8].biome = BiomeType.COLUMN;
  tiles[centerY + 8][centerX - 8].biome = BiomeType.COLUMN;
  tiles[centerY + 8][centerX + 8].biome = BiomeType.COLUMN;
  
  // Seating areas (traditional style)
  const seatType = config.era === 'MODERN_ERA' ? BiomeType.CHAIR : BiomeType.FLOOR_WOOD;
  
  // Square seating arrangement around the ring
  for (let dist = 10; dist <= 14; dist += 2) {
    // North and South
    for (let x = centerX - dist; x <= centerX + dist; x += 2) {
      if (x > 0 && x < size.width - 1) {
        if (centerY - dist > 0) tiles[centerY - dist][x].biome = seatType;
        if (centerY + dist < size.height - 1) tiles[centerY + dist][x].biome = seatType;
      }
    }
    // East and West
    for (let y = centerY - dist + 1; y < centerY + dist; y += 2) {
      if (y > 0 && y < size.height - 1) {
        if (centerX - dist > 0) tiles[y][centerX - dist].biome = seatType;
        if (centerX + dist < size.width - 1) tiles[y][centerX + dist].biome = seatType;
      }
    }
  }
  
  // Judges' positions
  tiles[centerY - 6][centerX].biome = BiomeType.CHAIR;
  tiles[centerY + 6][centerX].biome = BiomeType.CHAIR;
  tiles[centerY][centerX - 6].biome = BiomeType.CHAIR;
  tiles[centerY][centerX + 6].biome = BiomeType.CHAIR;
}

function generateHippodrome(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Byzantine/Roman chariot racing track
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Track (elongated U-shape)
  // Straight sections
  for (let y = 5; y < size.height - 5; y++) {
    for (let x = centerX - 12; x <= centerX - 8; x++) {
      if (x > 0) tiles[y][x].biome = BiomeType.SAND;
    }
    for (let x = centerX + 8; x <= centerX + 12; x++) {
      if (x < size.width - 1) tiles[y][x].biome = BiomeType.SAND;
    }
  }
  
  // Curved ends
  for (let angle = 0; angle <= Math.PI; angle += 0.1) {
    // North curve
    const xn = Math.floor(centerX + 10 * Math.cos(angle));
    const yn = Math.floor(5 + 3 * Math.sin(angle));
    if (xn > 0 && xn < size.width - 1 && yn > 0 && yn < size.height - 1) {
      tiles[yn][xn].biome = BiomeType.SAND;
    }
    
    // South curve
    const xs = Math.floor(centerX + 10 * Math.cos(angle + Math.PI));
    const ys = Math.floor(size.height - 5 - 3 * Math.sin(angle));
    if (xs > 0 && xs < size.width - 1 && ys > 0 && ys < size.height - 1) {
      tiles[ys][xs].biome = BiomeType.SAND;
    }
  }
  
  // Spina (central barrier with monuments)
  for (let y = 8; y < size.height - 8; y++) {
    tiles[y][centerX].biome = BiomeType.WALL;
  }
  
  // Turning posts
  tiles[8][centerX].biome = BiomeType.COLUMN;
  tiles[size.height - 9][centerX].biome = BiomeType.COLUMN;
  
  // Obelisk and statues on spina
  tiles[centerY][centerX].biome = BiomeType.STATUE;
  tiles[centerY - 5][centerX].biome = BiomeType.STATUE;
  tiles[centerY + 5][centerX].biome = BiomeType.STATUE;
  
  // Spectator seating
  for (let y = 3; y < size.height - 3; y += 2) {
    for (let x = 2; x < centerX - 13; x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
    for (let x = centerX + 14; x < size.width - 2; x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Imperial box (kathisma)
  tiles[centerY][2].biome = BiomeType.THRONE;
  tiles[centerY - 1][2].biome = BiomeType.CHAIR;
  tiles[centerY + 1][2].biome = BiomeType.CHAIR;
}

function generatePoloField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Open polo ground
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Grass field
  fillArea(tiles, 3, 3, size.width - 6, size.height - 6, BiomeType.GRASS);
  
  // Goal posts at ends
  tiles[5][centerX - 3].biome = BiomeType.COLUMN;
  tiles[5][centerX + 3].biome = BiomeType.COLUMN;
  tiles[size.height - 6][centerX - 3].biome = BiomeType.COLUMN;
  tiles[size.height - 6][centerX + 3].biome = BiomeType.COLUMN;
  
  // Center line
  for (let x = centerX - 15; x <= centerX + 15; x++) {
    if (x > 0 && x < size.width - 1) {
      tiles[centerY][x].biome = BiomeType.ROAD;
    }
  }
  
  // Spectator pavilions
  for (let y = 10; y < size.height - 10; y += 8) {
    tiles[y][2].biome = BiomeType.PAVILION;
    tiles[y][size.width - 3].biome = BiomeType.PAVILION;
  }
  
  // Royal viewing area
  for (let x = centerX - 4; x <= centerX + 4; x++) {
    tiles[2][x].biome = BiomeType.PAVILION;
  }
  tiles[3][centerX].biome = BiomeType.THRONE;
}

function generateGenericArena(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Simple rectangular arena with seating
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Arena floor
  fillArea(tiles, centerX - 12, centerY - 8, 24, 16, BiomeType.SAND);
  
  // Seating around perimeter
  for (let y = 2; y < size.height - 2; y += 2) {
    for (let x = 2; x < centerX - 14; x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
    for (let x = centerX + 14; x < size.width - 2; x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  for (let x = 2; x < size.width - 2; x += 2) {
    for (let y = 2; y < centerY - 10; y += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
    for (let y = centerY + 10; y < size.height - 2; y += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}