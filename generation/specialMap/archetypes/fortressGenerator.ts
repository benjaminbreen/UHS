/**
 * generation/specialMap/archetypes/fortressGenerator.ts
 * Generator for military fortress special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateMilitaryFortress(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Fortress type varies by culture and era
  if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.MEDIEVAL) {
      generateMedievalCastle(tiles, size, config, interactionZones, noise);
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generateStarFort(tiles, size, config, interactionZones, noise);
    } else if (config.era === HistoricalEra.ANTIQUITY) {
      generateRomanCastrum(tiles, size, config, interactionZones, noise);
    } else {
      generateModernBase(tiles, size, config, interactionZones, noise);
    }
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.region === 'japan') {
      generateJapaneseCastle(tiles, size, config, interactionZones, noise);
    } else {
      generateChineseFortress(tiles, size, config, interactionZones, noise);
    }
  } else if (config.culturalZone === 'MENA') {
    generateCitadel(tiles, size, config, interactionZones, noise);
  } else {
    // Default fortress layout
    generateBasicFort(tiles, size, config, interactionZones, noise);
  }
  
  // Main gate exit
  exitZones.push({
    id: 'main_gate',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Main Gate',
    destination: 'parent_map'
  });
  
  // Postern gate (secret exit) if large enough
  if (size.width > 40) {
    exitZones.push({
      id: 'postern_gate',
      location: [2, Math.floor(size.height / 2)],
      label: 'Postern Gate',
      destination: 'parent_map'
    });
  }
  
  return { tiles, interactionZones, exitZones };
}

/**
 * Generate a medieval European castle
 */
function generateMedievalCastle(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Outer walls with towers at corners
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Stone courtyard
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Corner towers (thicker walls)
  const towerSize = 5;
  // NW tower
  fillArea(tiles, 0, 0, towerSize, towerSize, BiomeType.WALL);
  // NE tower
  fillArea(tiles, size.width - towerSize, 0, towerSize, towerSize, BiomeType.WALL);
  // SW tower
  fillArea(tiles, 0, size.height - towerSize, towerSize, towerSize, BiomeType.WALL);
  // SE tower
  fillArea(tiles, size.width - towerSize, size.height - towerSize, towerSize, towerSize, BiomeType.WALL);
  
  // Keep (central fortified residence)
  const keepSize = 12;
  const keepX = Math.floor((size.width - keepSize) / 2);
  const keepY = 5;
  
  placeWallRectangle(tiles, keepX, keepY, keepSize, keepSize, [
    { side: 'south', offset: Math.floor(keepSize / 2) }
  ]);
  fillArea(tiles, keepX + 1, keepY + 1, keepSize - 2, keepSize - 2, BiomeType.FLOOR_WOOD);
  
  // Great hall in keep
  tiles[keepY + 3][keepX + Math.floor(keepSize / 2)].biome = BiomeType.THRONE;
  
  // Long table
  for (let x = keepX + 3; x < keepX + keepSize - 3; x++) {
    tiles[keepY + 5][x].biome = BiomeType.TABLE;
    tiles[keepY + 4][x].biome = BiomeType.CHAIR;
    tiles[keepY + 6][x].biome = BiomeType.CHAIR;
  }
  
  // Barracks
  const barracksX = 5;
  const barracksY = size.height - 15;
  placeWallRectangle(tiles, barracksX, barracksY, 10, 10);
  fillArea(tiles, barracksX + 1, barracksY + 1, 8, 8, BiomeType.FLOOR_WOOD);
  
  // Beds in barracks
  for (let y = barracksY + 2; y < barracksY + 8; y += 2) {
    for (let x = barracksX + 2; x < barracksX + 8; x += 2) {
      tiles[y][x].biome = BiomeType.BED;
    }
  }
  
  // Armory
  const armoryX = size.width - 15;
  const armoryY = size.height - 15;
  placeWallRectangle(tiles, armoryX, armoryY, 10, 10);
  fillArea(tiles, armoryX + 1, armoryY + 1, 8, 8, BiomeType.FLOOR_STONE);
  
  // Weapon racks (tables)
  for (let x = armoryX + 2; x < armoryX + 8; x++) {
    tiles[armoryY + 2][x].biome = BiomeType.TABLE;
    tiles[armoryY + 2][x].materialSubtype = 'weapon_rack';
  }
  
  // Well in courtyard
  tiles[Math.floor(size.height * 0.7)][Math.floor(size.width / 2)].biome = BiomeType.FOUNTAIN;
  tiles[Math.floor(size.height * 0.7)][Math.floor(size.width / 2)].materialSubtype = 'well';
  
  // Gatehouse
  const gateY = size.height - 3;
  const gateX = Math.floor(size.width / 2);
  tiles[gateY][gateX - 1].biome = BiomeType.WALL;
  tiles[gateY][gateX + 1].biome = BiomeType.WALL;
  tiles[gateY][gateX].materialSubtype = 'portcullis';
  
  interactionZones.push(
    {
      id: 'great_hall',
      bounds: { x: keepX, y: keepY, width: keepSize, height: keepSize },
      type: 'throne',
      interactions: ['audience', 'feast', 'council']
    },
    {
      id: 'barracks',
      bounds: { x: barracksX, y: barracksY, width: 10, height: 10 },
      type: 'military',
      interactions: ['recruit', 'train', 'rest']
    },
    {
      id: 'armory',
      bounds: { x: armoryX, y: armoryY, width: 10, height: 10 },
      type: 'military',
      interactions: ['equip', 'repair', 'inspect']
    }
  );
}

/**
 * Generate a star fort (Renaissance/Early Modern)
 */
function generateStarFort(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Create bastions in star pattern
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main fortress walls (pentagonal)
  const fortRadius = Math.min(size.width, size.height) / 3;
  const angles = 5;
  
  for (let i = 0; i < angles; i++) {
    const angle1 = (i * 2 * Math.PI) / angles - Math.PI / 2;
    const angle2 = ((i + 1) * 2 * Math.PI) / angles - Math.PI / 2;
    
    const x1 = Math.floor(centerX + Math.cos(angle1) * fortRadius);
    const y1 = Math.floor(centerY + Math.sin(angle1) * fortRadius);
    const x2 = Math.floor(centerX + Math.cos(angle2) * fortRadius);
    const y2 = Math.floor(centerY + Math.sin(angle2) * fortRadius);
    
    // Draw walls between points (simplified)
    drawLine(tiles, x1, y1, x2, y2, BiomeType.WALL);
  }
  
  // Central parade ground
  fillArea(tiles, centerX - 10, centerY - 10, 20, 20, BiomeType.PLAZA);
  
  // Headquarters
  const hqX = centerX - 4;
  const hqY = centerY - 4;
  placeWallRectangle(tiles, hqX, hqY, 8, 8);
  fillArea(tiles, hqX + 1, hqY + 1, 6, 6, BiomeType.FLOOR_WOOD);
  tiles[hqY + 3][centerX].biome = BiomeType.TABLE;
  
  // Cannon platforms at bastions
  for (let i = 0; i < angles; i++) {
    const angle = (i * 2 * Math.PI) / angles - Math.PI / 2;
    const bastionX = Math.floor(centerX + Math.cos(angle) * (fortRadius + 5));
    const bastionY = Math.floor(centerY + Math.sin(angle) * (fortRadius + 5));
    
    if (bastionX > 2 && bastionX < size.width - 2 && 
        bastionY > 2 && bastionY < size.height - 2) {
      tiles[bastionY][bastionX].biome = BiomeType.BRAZIER;
      tiles[bastionY][bastionX].materialSubtype = 'cannon';
    }
  }
  
  interactionZones.push({
    id: 'headquarters',
    bounds: { x: hqX, y: hqY, width: 8, height: 8 },
    type: 'military',
    interactions: ['command', 'plan', 'dispatch']
  });
}

/**
 * Generate a Roman castrum
 */
function generateRomanCastrum(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Rectangular fort with grid layout
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Via Praetoria (main north-south road)
  const viaX = Math.floor(size.width / 2);
  for (let y = 1; y < size.height - 1; y++) {
    tiles[y][viaX].biome = BiomeType.ROAD;
  }
  
  // Via Principalis (main east-west road)
  const viaY = Math.floor(size.height / 2);
  for (let x = 1; x < size.width - 1; x++) {
    tiles[viaY][x].biome = BiomeType.ROAD;
  }
  
  // Principia (headquarters) at center
  const principiaSize = 10;
  const principiaX = viaX - 5;
  const principiaY = viaY - 5;
  placeWallRectangle(tiles, principiaX, principiaY, principiaSize, principiaSize);
  fillArea(tiles, principiaX + 1, principiaY + 1, principiaSize - 2, principiaSize - 2, BiomeType.FLOOR_MARBLE);
  
  // Standards shrine
  tiles[principiaY + 2][viaX].biome = BiomeType.ALTAR;
  tiles[principiaY + 2][viaX].materialSubtype = 'standards';
  
  // Barracks blocks
  const blockSize = 8;
  // NW quadrant
  placeWallRectangle(tiles, 3, 3, blockSize, blockSize);
  fillArea(tiles, 4, 4, blockSize - 2, blockSize - 2, BiomeType.FLOOR_WOOD);
  // NE quadrant
  placeWallRectangle(tiles, size.width - blockSize - 3, 3, blockSize, blockSize);
  fillArea(tiles, size.width - blockSize - 2, 4, blockSize - 2, blockSize - 2, BiomeType.FLOOR_WOOD);
  // SW quadrant
  placeWallRectangle(tiles, 3, size.height - blockSize - 3, blockSize, blockSize);
  fillArea(tiles, 4, size.height - blockSize - 2, blockSize - 2, blockSize - 2, BiomeType.FLOOR_WOOD);
  // SE quadrant
  placeWallRectangle(tiles, size.width - blockSize - 3, size.height - blockSize - 3, blockSize, blockSize);
  fillArea(tiles, size.width - blockSize - 2, size.height - blockSize - 2, blockSize - 2, blockSize - 2, BiomeType.FLOOR_WOOD);
  
  interactionZones.push({
    id: 'principia',
    bounds: { x: principiaX, y: principiaY, width: principiaSize, height: principiaSize },
    type: 'military',
    interactions: ['command', 'ceremony', 'standards']
  });
}

/**
 * Generate a Japanese castle
 */
function generateJapaneseCastle(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Multiple concentric baileys (maru)
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  // Outer walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Inner bailey
  const innerSize = Math.min(size.width, size.height) - 20;
  const innerX = Math.floor((size.width - innerSize) / 2);
  const innerY = Math.floor((size.height - innerSize) / 2);
  placeWallRectangle(tiles, innerX, innerY, innerSize, innerSize, [
    { side: 'south', offset: Math.floor(innerSize / 2) }
  ]);
  
  // Tenshu (main keep) - multi-story represented by size
  const tenshuSize = 8;
  const tenshuX = Math.floor((size.width - tenshuSize) / 2);
  const tenshuY = innerY + 3;
  
  placeWallRectangle(tiles, tenshuX, tenshuY, tenshuSize, tenshuSize);
  fillArea(tiles, tenshuX + 1, tenshuY + 1, tenshuSize - 2, tenshuSize - 2, BiomeType.FLOOR_WOOD);
  
  // Lord's seat
  tiles[tenshuY + 2][Math.floor(size.width / 2)].biome = BiomeType.THRONE;
  tiles[tenshuY + 2][Math.floor(size.width / 2)].materialSubtype = 'daimyo_seat';
  
  // Guard houses (yagura)
  const yaguraSize = 4;
  // Corner guard houses
  placeWallRectangle(tiles, innerX + 1, innerY + 1, yaguraSize, yaguraSize);
  placeWallRectangle(tiles, innerX + innerSize - yaguraSize - 1, innerY + 1, yaguraSize, yaguraSize);
  
  // Rock garden
  if (size.width > 50) {
    const gardenX = 5;
    const gardenY = 5;
    fillArea(tiles, gardenX, gardenY, 8, 8, BiomeType.PARK);
    // Add rocks (statues)
    tiles[gardenY + 2][gardenX + 2].biome = BiomeType.STATUE;
    tiles[gardenY + 2][gardenX + 2].materialSubtype = 'rock';
    tiles[gardenY + 5][gardenX + 6].biome = BiomeType.STATUE;
    tiles[gardenY + 5][gardenX + 6].materialSubtype = 'rock';
  }
  
  interactionZones.push({
    id: 'tenshu',
    bounds: { x: tenshuX, y: tenshuY, width: tenshuSize, height: tenshuSize },
    type: 'throne',
    interactions: ['audience', 'command', 'ceremony']
  });
}

/**
 * Generate a Chinese fortress
 */
function generateChineseFortress(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Square fortress with thick walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Double walls if large enough
  if (size.width > 50) {
    placeWallRectangle(tiles, 3, 3, size.width - 6, size.height - 6, [
      { side: 'south', offset: Math.floor((size.width - 6) / 2) }
    ]);
  }
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Central command pavilion
  const pavilionSize = 12;
  const pavilionX = Math.floor((size.width - pavilionSize) / 2);
  const pavilionY = Math.floor((size.height - pavilionSize) / 2);
  
  placeWallRectangle(tiles, pavilionX, pavilionY, pavilionSize, pavilionSize);
  fillArea(tiles, pavilionX + 1, pavilionY + 1, pavilionSize - 2, pavilionSize - 2, BiomeType.FLOOR_TILE);
  
  // Command table
  tiles[pavilionY + Math.floor(pavilionSize / 2)][pavilionX + Math.floor(pavilionSize / 2)].biome = BiomeType.TABLE;
  
  // Watchtowers at corners
  const towerSize = 6;
  fillArea(tiles, 1, 1, towerSize, towerSize, BiomeType.WALL);
  fillArea(tiles, size.width - towerSize - 1, 1, towerSize, towerSize, BiomeType.WALL);
  fillArea(tiles, 1, size.height - towerSize - 1, towerSize, towerSize, BiomeType.WALL);
  fillArea(tiles, size.width - towerSize - 1, size.height - towerSize - 1, towerSize, towerSize, BiomeType.WALL);
  
  // Arrow slits in towers (marked as special)
  tiles[3][3].materialSubtype = 'arrow_slit';
  tiles[3][size.width - 4].materialSubtype = 'arrow_slit';
  tiles[size.height - 4][3].materialSubtype = 'arrow_slit';
  tiles[size.height - 4][size.width - 4].materialSubtype = 'arrow_slit';
  
  // Drum tower
  if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.ANTIQUITY) {
    tiles[pavilionY - 3][pavilionX + Math.floor(pavilionSize / 2)].biome = BiomeType.BRAZIER;
    tiles[pavilionY - 3][pavilionX + Math.floor(pavilionSize / 2)].materialSubtype = 'signal_drum';
  }
  
  interactionZones.push({
    id: 'command_pavilion',
    bounds: { x: pavilionX, y: pavilionY, width: pavilionSize, height: pavilionSize },
    type: 'military',
    interactions: ['command', 'strategy', 'dispatch']
  });
}

/**
 * Generate a Middle Eastern citadel
 */
function generateCitadel(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Irregular walls following terrain
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Central keep (qalaa)
  const keepSize = 14;
  const keepX = Math.floor((size.width - keepSize) / 2);
  const keepY = Math.floor((size.height - keepSize) / 2) - 5;
  
  placeWallRectangle(tiles, keepX, keepY, keepSize, keepSize);
  fillArea(tiles, keepX + 1, keepY + 1, keepSize - 2, keepSize - 2, BiomeType.FLOOR_TILE);
  
  // Throne room
  tiles[keepY + 3][Math.floor(size.width / 2)].biome = BiomeType.THRONE;
  
  // Courtyard with fountain
  const courtyardY = keepY + keepSize + 3;
  tiles[courtyardY][Math.floor(size.width / 2)].biome = BiomeType.FOUNTAIN;
  
  // Surrounding water
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx !== 0 || dy !== 0) {
        const fx = Math.floor(size.width / 2) + dx;
        const fy = courtyardY + dy;
        if (fx > 0 && fx < size.width && fy > 0 && fy < size.height) {
          tiles[fy][fx].biome = BiomeType.WATER;
        }
      }
    }
  }
  
  // Guard barracks
  const barracksX = 5;
  const barracksY = size.height - 12;
  placeWallRectangle(tiles, barracksX, barracksY, 8, 8);
  fillArea(tiles, barracksX + 1, barracksY + 1, 6, 6, BiomeType.FLOOR_WOOD);
  
  // Arsenal
  const arsenalX = size.width - 13;
  const arsenalY = size.height - 12;
  placeWallRectangle(tiles, arsenalX, arsenalY, 8, 8);
  fillArea(tiles, arsenalX + 1, arsenalY + 1, 6, 6, BiomeType.FLOOR_STONE);
  
  interactionZones.push(
    {
      id: 'throne_room',
      bounds: { x: keepX, y: keepY, width: keepSize, height: keepSize },
      type: 'throne',
      interactions: ['audience', 'command']
    },
    {
      id: 'courtyard',
      bounds: { x: Math.floor(size.width / 2) - 5, y: courtyardY - 2, width: 10, height: 5 },
      type: 'social',
      interactions: ['gather', 'trade']
    }
  );
}

/**
 * Generate a modern military base
 */
function generateModernBase(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Perimeter fence
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.ROAD);
  
  // Command center
  const commandSize = 12;
  const commandX = Math.floor((size.width - commandSize) / 2);
  const commandY = 5;
  placeWallRectangle(tiles, commandX, commandY, commandSize, commandSize);
  fillArea(tiles, commandX + 1, commandY + 1, commandSize - 2, commandSize - 2, BiomeType.FLOOR_TILE);
  
  // Communications equipment (tables)
  for (let x = commandX + 2; x < commandX + commandSize - 2; x += 2) {
    tiles[commandY + 2][x].biome = BiomeType.TABLE;
    tiles[commandY + 2][x].materialSubtype = 'console';
  }
  
  // Barracks buildings
  const barracksWidth = 15;
  const barracksHeight = 8;
  // Left barracks
  placeWallRectangle(tiles, 3, Math.floor(size.height / 2), barracksWidth, barracksHeight);
  fillArea(tiles, 4, Math.floor(size.height / 2) + 1, barracksWidth - 2, barracksHeight - 2, BiomeType.FLOOR_TILE);
  // Right barracks  
  placeWallRectangle(tiles, size.width - barracksWidth - 3, Math.floor(size.height / 2), barracksWidth, barracksHeight);
  fillArea(tiles, size.width - barracksWidth - 2, Math.floor(size.height / 2) + 1, barracksWidth - 2, barracksHeight - 2, BiomeType.FLOOR_TILE);
  
  // Motor pool
  const motorY = size.height - 10;
  fillArea(tiles, 10, motorY, size.width - 20, 8, BiomeType.PLAZA);
  tiles[motorY + 4][Math.floor(size.width / 2)].materialSubtype = 'parking';
  
  interactionZones.push(
    {
      id: 'command_center',
      bounds: { x: commandX, y: commandY, width: commandSize, height: commandSize },
      type: 'military',
      interactions: ['command', 'intelligence', 'communications']
    },
    {
      id: 'motor_pool',
      bounds: { x: 10, y: motorY, width: size.width - 20, height: 8 },
      type: 'military',
      interactions: ['vehicle', 'maintenance']
    }
  );
}

/**
 * Generate a basic fort for other cultures
 */
function generateBasicFort(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Simple rectangular fort
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Central structure
  const centerSize = 10;
  const centerX = Math.floor((size.width - centerSize) / 2);
  const centerY = Math.floor((size.height - centerSize) / 2);
  
  placeWallRectangle(tiles, centerX, centerY, centerSize, centerSize);
  fillArea(tiles, centerX + 1, centerY + 1, centerSize - 2, centerSize - 2, BiomeType.FLOOR_WOOD);
  
  // Command post
  tiles[centerY + Math.floor(centerSize / 2)][centerX + Math.floor(centerSize / 2)].biome = BiomeType.TABLE;
  
  // Watchtowers at corners
  tiles[2][2].biome = BiomeType.COLUMN;
  tiles[2][size.width - 3].biome = BiomeType.COLUMN;
  tiles[size.height - 3][2].biome = BiomeType.COLUMN;
  tiles[size.height - 3][size.width - 3].biome = BiomeType.COLUMN;
  
  interactionZones.push({
    id: 'command_post',
    bounds: { x: centerX, y: centerY, width: centerSize, height: centerSize },
    type: 'military',
    interactions: ['command', 'defend']
  });
}

/**
 * Helper function to draw a line of tiles
 */
function drawLine(tiles: Tile[][], x1: number, y1: number, x2: number, y2: number, biome: BiomeType) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    if (x1 >= 0 && x1 < tiles[0].length && y1 >= 0 && y1 < tiles.length) {
      tiles[y1][x1].biome = biome;
    }
    
    if (x1 === x2 && y1 === y2) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
  }
}