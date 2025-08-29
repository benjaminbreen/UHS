/**
 * generation/specialMap/archetypes/sacredGenerator.ts
 * Generator for sacred complex special maps (temples, churches, mosques, shrines, etc.)
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateSacredComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Sacred complex layout depends on culture and era
  if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.MEDIEVAL || 
        config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generateChurch(tiles, size, config, interactionZones, noise);
    } else if (config.era === HistoricalEra.ANTIQUITY) {
      generateClassicalTemple(tiles, size, config, interactionZones, noise);
    } else {
      generateModernChurch(tiles, size, config, interactionZones);
    }
  } else if (config.culturalZone === 'MENA') {
    generateMosque(tiles, size, config, interactionZones, noise);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.region === 'japan') {
      generateShinto(tiles, size, config, interactionZones, noise);
    } else {
      generateBuddhistTemple(tiles, size, config, interactionZones, noise);
    }
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    generateHinduTemple(tiles, size, config, interactionZones, noise);
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    generateAfricanShrine(tiles, size, config, interactionZones, noise);
  } else if (config.culturalZone === 'INDIGENOUS_AMERICAN') {
    generatePyramidTemple(tiles, size, config, interactionZones, noise);
  } else {
    // Default: simple shrine
    generateGenericShrine(tiles, size, config, interactionZones, noise);
  }
  
  // Main exit
  exitZones.push({
    id: 'main_exit',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  return { tiles, interactionZones, exitZones };
}

/**
 * Generate a European medieval/renaissance church
 */
function generateChurch(
  tiles: Tile[][], 
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Create perimeter walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Stone floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Create nave (main hall)
  const naveWidth = Math.min(size.width - 10, 20);
  const naveStartX = Math.floor((size.width - naveWidth) / 2);
  
  // Columns along the nave
  for (let y = 5; y < size.height - 10; y += 4) {
    tiles[y][naveStartX + 2].biome = BiomeType.COLUMN;
    tiles[y][naveStartX + naveWidth - 2].biome = BiomeType.COLUMN;
  }
  
  // Pews
  for (let y = size.height - 12; y > 10; y -= 3) {
    for (let x = naveStartX + 4; x < naveStartX + naveWidth - 4; x++) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Altar at north end
  const altarY = 3;
  const altarX = Math.floor(size.width / 2);
  tiles[altarY][altarX].biome = BiomeType.ALTAR;
  
  // Stained glass effect (marked in material subtype)
  for (let x = 1; x < size.width - 1; x += 4) {
    tiles[1][x].materialSubtype = 'stained_glass';
  }
  
  // Create interaction zones
  interactionZones.push({
    id: 'altar',
    bounds: { x: altarX - 1, y: altarY - 1, width: 3, height: 3 },
    type: 'religious',
    interactions: ['pray', 'offering', 'blessing']
  });
  
  // Confessional booth (Catholic)
  if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    const confessionalX = naveStartX - 3;
    const confessionalY = Math.floor(size.height / 2);
    placeWallRectangle(tiles, confessionalX, confessionalY, 3, 3);
    tiles[confessionalY + 1][confessionalX + 1].biome = BiomeType.CHAIR;
    
    interactionZones.push({
      id: 'confessional',
      bounds: { x: confessionalX, y: confessionalY, width: 3, height: 3 },
      type: 'religious',
      interactions: ['confess']
    });
  }
}

/**
 * Generate a mosque
 */
function generateMosque(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Create perimeter walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Tile floor with geometric patterns
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      tiles[y][x].materialSubtype = 'geometric';
    }
  }
  
  // Prayer hall - open space
  const hallWidth = size.width - 6;
  const hallHeight = size.height - 10;
  const hallStartX = 3;
  const hallStartY = 5;
  
  // Columns in prayer hall
  for (let x = hallStartX; x < hallStartX + hallWidth; x += 5) {
    for (let y = hallStartY; y < hallStartY + hallHeight; y += 5) {
      tiles[y][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Mihrab (prayer niche) pointing towards Mecca (east in game)
  const mihrabX = size.width - 3;
  const mihrabY = Math.floor(size.height / 2);
  tiles[mihrabY][mihrabX].biome = BiomeType.ALTAR;
  tiles[mihrabY][mihrabX].materialSubtype = 'mihrab';
  
  // Minbar (pulpit)
  tiles[mihrabY - 2][mihrabX - 2].biome = BiomeType.THRONE;
  tiles[mihrabY - 2][mihrabX - 2].materialSubtype = 'minbar';
  
  // Ablution fountain in courtyard
  if (size.width > 40) {
    const fountainX = Math.floor(size.width / 4);
    const fountainY = Math.floor(size.height / 2);
    tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
    
    // Water around fountain
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0) {
          tiles[fountainY + dy][fountainX + dx].biome = BiomeType.WATER;
        }
      }
    }
  }
  
  interactionZones.push({
    id: 'prayer_hall',
    bounds: { x: hallStartX, y: hallStartY, width: hallWidth, height: hallHeight },
    type: 'religious',
    interactions: ['pray', 'meditate']
  });
}

/**
 * Generate a Buddhist temple
 */
function generateBuddhistTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Create perimeter walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Wood floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_WOOD);
  
  // Main hall
  const hallCenterX = Math.floor(size.width / 2);
  const hallCenterY = Math.floor(size.height / 3);
  
  // Buddha statue
  tiles[hallCenterY][hallCenterX].biome = BiomeType.STATUE;
  tiles[hallCenterY][hallCenterX].materialSubtype = 'buddha';
  
  // Offering table
  tiles[hallCenterY + 2][hallCenterX].biome = BiomeType.TABLE;
  
  // Meditation mats
  for (let y = hallCenterY + 5; y < size.height - 5; y += 2) {
    for (let x = 5; x < size.width - 5; x += 3) {
      tiles[y][x].biome = BiomeType.BED;
      tiles[y][x].materialSubtype = 'mat';
    }
  }
  
  // Incense burners
  tiles[hallCenterY + 1][hallCenterX - 3].biome = BiomeType.BRAZIER;
  tiles[hallCenterY + 1][hallCenterX + 3].biome = BiomeType.BRAZIER;
  
  // Garden area if space permits
  if (size.width > 50) {
    const gardenX = size.width - 10;
    const gardenY = 5;
    fillArea(tiles, gardenX, gardenY, 8, 8, BiomeType.PARK);
    
    // Small pond
    fillArea(tiles, gardenX + 2, gardenY + 2, 3, 3, BiomeType.WATER);
  }
  
  interactionZones.push({
    id: 'buddha_shrine',
    bounds: { x: hallCenterX - 2, y: hallCenterY - 1, width: 5, height: 4 },
    type: 'religious',
    interactions: ['pray', 'offering', 'meditate']
  });
}

/**
 * Generate a Shinto shrine
 */
function generateShinto(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // No outer walls - open structure
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  // Torii gate at entrance
  const toriiX = Math.floor(size.width / 2);
  const toriiY = size.height - 5;
  tiles[toriiY][toriiX - 3].biome = BiomeType.COLUMN;
  tiles[toriiY][toriiX - 3].materialSubtype = 'torii';
  tiles[toriiY][toriiX + 3].biome = BiomeType.COLUMN;
  tiles[toriiY][toriiX + 3].materialSubtype = 'torii';
  
  // Path to shrine
  for (let y = toriiY; y > 5; y--) {
    tiles[y][toriiX].biome = BiomeType.ROAD;
  }
  
  // Main shrine building
  const shrineY = 5;
  const shrineWidth = 12;
  const shrineHeight = 8;
  const shrineX = Math.floor((size.width - shrineWidth) / 2);
  
  placeWallRectangle(tiles, shrineX, shrineY, shrineWidth, shrineHeight);
  fillArea(tiles, shrineX + 1, shrineY + 1, shrineWidth - 2, shrineHeight - 2, BiomeType.FLOOR_WOOD);
  
  // Shrine altar
  tiles[shrineY + 2][toriiX].biome = BiomeType.ALTAR;
  tiles[shrineY + 2][toriiX].materialSubtype = 'kami';
  
  // Purification fountain
  tiles[toriiY - 3][toriiX - 5].biome = BiomeType.FOUNTAIN;
  tiles[toriiY - 3][toriiX - 5].materialSubtype = 'purification';
  
  // Sacred trees (if space)
  if (noise.random() > 0.5) {
    tiles[10][5].biome = BiomeType.FOREST;
    tiles[10][5].materialSubtype = 'sacred_tree';
  }
  if (noise.random() > 0.5) {
    tiles[10][size.width - 5].biome = BiomeType.FOREST;
    tiles[10][size.width - 5].materialSubtype = 'sacred_tree';
  }
  
  interactionZones.push({
    id: 'shrine',
    bounds: { x: shrineX, y: shrineY, width: shrineWidth, height: shrineHeight },
    type: 'religious',
    interactions: ['pray', 'offering', 'fortune']
  });
}

/**
 * Generate Hindu temple
 */
function generateHinduTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Create perimeter walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Stone floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Mandapa (pillared hall)
  const mandapaSize = Math.min(20, size.width - 10);
  const mandapaX = Math.floor((size.width - mandapaSize) / 2);
  const mandapaY = Math.floor(size.height / 2);
  
  // Columns in grid pattern
  for (let x = mandapaX; x < mandapaX + mandapaSize; x += 3) {
    for (let y = mandapaY; y < mandapaY + mandapaSize / 2; y += 3) {
      tiles[y][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Garbhagriha (sanctum)
  const sanctumX = Math.floor(size.width / 2);
  const sanctumY = 5;
  const sanctumSize = 5;
  
  placeWallRectangle(tiles, sanctumX - 2, sanctumY, sanctumSize, sanctumSize);
  fillArea(tiles, sanctumX - 1, sanctumY + 1, sanctumSize - 2, sanctumSize - 2, BiomeType.FLOOR_MARBLE);
  
  // Deity statue
  tiles[sanctumY + 2][sanctumX].biome = BiomeType.STATUE;
  tiles[sanctumY + 2][sanctumX].materialSubtype = 'deity';
  
  // Sacred fire
  tiles[mandapaY + 5][sanctumX].biome = BiomeType.BRAZIER;
  tiles[mandapaY + 5][sanctumX].materialSubtype = 'sacred_fire';
  
  interactionZones.push({
    id: 'sanctum',
    bounds: { x: sanctumX - 2, y: sanctumY, width: sanctumSize, height: sanctumSize },
    type: 'religious',
    interactions: ['pray', 'offering', 'darshan']
  });
}

/**
 * Generate Classical temple (Greek/Roman)
 */
function generateClassicalTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // No outer walls - classical temple with columns
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  // Raised platform (stereobate)
  const platformWidth = Math.min(size.width - 10, 30);
  const platformHeight = Math.min(size.height - 10, 20);
  const platformX = Math.floor((size.width - platformWidth) / 2);
  const platformY = Math.floor((size.height - platformHeight) / 2);
  
  fillArea(tiles, platformX, platformY, platformWidth, platformHeight, BiomeType.FLOOR_MARBLE);
  
  // Peristyle (surrounding columns)
  for (let x = platformX; x < platformX + platformWidth; x += 3) {
    tiles[platformY][x].biome = BiomeType.COLUMN;
    tiles[platformY + platformHeight - 1][x].biome = BiomeType.COLUMN;
  }
  for (let y = platformY; y < platformY + platformHeight; y += 3) {
    tiles[y][platformX].biome = BiomeType.COLUMN;
    tiles[y][platformX + platformWidth - 1].biome = BiomeType.COLUMN;
  }
  
  // Cella (inner chamber)
  const cellaWidth = platformWidth - 8;
  const cellaHeight = platformHeight - 8;
  const cellaX = platformX + 4;
  const cellaY = platformY + 4;
  
  placeWallRectangle(tiles, cellaX, cellaY, cellaWidth, cellaHeight, [
    { side: 'south', offset: Math.floor(cellaWidth / 2) }
  ]);
  fillArea(tiles, cellaX + 1, cellaY + 1, cellaWidth - 2, cellaHeight - 2, BiomeType.FLOOR_MARBLE);
  
  // Cult statue
  const statueX = Math.floor(size.width / 2);
  const statueY = cellaY + 2;
  tiles[statueY][statueX].biome = BiomeType.STATUE;
  tiles[statueY][statueX].materialSubtype = 'deity';
  
  // Altar outside
  tiles[platformY + platformHeight + 2][statueX].biome = BiomeType.ALTAR;
  
  interactionZones.push({
    id: 'cella',
    bounds: { x: cellaX, y: cellaY, width: cellaWidth, height: cellaHeight },
    type: 'religious',
    interactions: ['worship', 'offering', 'oracle']
  });
}

/**
 * Generate Mesoamerican pyramid temple
 */
function generatePyramidTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  // Stepped pyramid
  const pyramidBase = Math.min(size.width - 10, size.height - 10);
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const levels = 4;
  
  for (let level = 0; level < levels; level++) {
    const levelSize = pyramidBase - (level * 6);
    const levelX = centerX - Math.floor(levelSize / 2);
    const levelY = centerY - Math.floor(levelSize / 2);
    
    if (levelSize > 0) {
      fillArea(tiles, levelX, levelY, levelSize, levelSize, BiomeType.FLOOR_STONE);
      
      // Stairs on south side
      for (let i = 0; i < 3; i++) {
        tiles[levelY + levelSize - 1][centerX + i - 1].biome = BiomeType.ROAD;
      }
    }
  }
  
  // Temple at top
  const templeX = centerX - 2;
  const templeY = centerY - 2;
  placeWallRectangle(tiles, templeX, templeY, 5, 5);
  fillArea(tiles, templeX + 1, templeY + 1, 3, 3, BiomeType.FLOOR_STONE);
  
  // Altar
  tiles[templeY + 2][centerX].biome = BiomeType.ALTAR;
  tiles[templeY + 2][centerX].materialSubtype = 'sacrificial';
  
  // Braziers at corners
  tiles[centerY - pyramidBase/2][centerX - pyramidBase/2].biome = BiomeType.BRAZIER;
  tiles[centerY - pyramidBase/2][centerX + pyramidBase/2].biome = BiomeType.BRAZIER;
  tiles[centerY + pyramidBase/2][centerX - pyramidBase/2].biome = BiomeType.BRAZIER;
  tiles[centerY + pyramidBase/2][centerX + pyramidBase/2].biome = BiomeType.BRAZIER;
  
  interactionZones.push({
    id: 'temple_summit',
    bounds: { x: templeX, y: templeY, width: 5, height: 5 },
    type: 'religious',
    interactions: ['ritual', 'offering', 'astronomy']
  });
}

/**
 * Generate African shrine
 */
function generateAfricanShrine(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Open air shrine with natural elements
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.SAVANNA);
  
  // Sacred grove
  const groveX = Math.floor(size.width / 2) - 5;
  const groveY = 5;
  for (let x = groveX; x < groveX + 10; x += 2) {
    for (let y = groveY; y < groveY + 8; y += 2) {
      if (noise.random() > 0.3) {
        tiles[y][x].biome = BiomeType.FOREST;
        tiles[y][x].materialSubtype = 'sacred_tree';
      }
    }
  }
  
  // Ancestor shrine
  const shrineX = Math.floor(size.width / 2);
  const shrineY = groveY + 10;
  tiles[shrineY][shrineX].biome = BiomeType.ALTAR;
  tiles[shrineY][shrineX].materialSubtype = 'ancestor';
  
  // Ritual circle
  const radius = 5;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
    const x = Math.floor(shrineX + Math.cos(angle) * radius);
    const y = Math.floor(shrineY + Math.sin(angle) * radius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Fire pit
  tiles[shrineY][shrineX - 3].biome = BiomeType.BRAZIER;
  tiles[shrineY][shrineX + 3].biome = BiomeType.BRAZIER;
  
  interactionZones.push({
    id: 'ritual_circle',
    bounds: { x: shrineX - radius, y: shrineY - radius, width: radius * 2, height: radius * 2 },
    type: 'religious',
    interactions: ['ritual', 'dance', 'offering']
  });
}

/**
 * Generate modern church
 */
function generateModernChurch(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  // Rows of chairs
  for (let y = size.height - 10; y > 10; y -= 2) {
    for (let x = 5; x < size.width - 5; x++) {
      if (x !== Math.floor(size.width / 2)) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  }
  
  // Pulpit
  tiles[5][Math.floor(size.width / 2)].biome = BiomeType.TABLE;
  tiles[5][Math.floor(size.width / 2)].materialSubtype = 'pulpit';
  
  interactionZones.push({
    id: 'congregation',
    bounds: { x: 5, y: 10, width: size.width - 10, height: size.height - 20 },
    type: 'religious',
    interactions: ['worship', 'sermon']
  });
}

/**
 * Generate generic shrine for fallback
 */
function generateGenericShrine(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Simple shrine
  tiles[centerY][centerX].biome = BiomeType.ALTAR;
  
  // Offerings
  tiles[centerY + 2][centerX - 1].biome = BiomeType.TABLE;
  tiles[centerY + 2][centerX + 1].biome = BiomeType.TABLE;
  
  interactionZones.push({
    id: 'shrine',
    bounds: { x: centerX - 2, y: centerY - 2, width: 5, height: 5 },
    type: 'religious',
    interactions: ['pray', 'offering']
  });
}