/**
 * University/Monastery/Academy Generator V2 - COMPLETE OVERLAY IMPLEMENTATION
 * Features culturally-specific educational buildings with proper overlay system
 * Medieval monasteries, Islamic madrasas, Confucian academies, modern universities
 */

import { Tile, BiomeType, OverlayObjectType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';

export function generateUniversityAcademy(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { 
  tiles: Tile[][], 
  interactionZones: InteractionZone[], 
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
} {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Create base structure with proper walls
  createCompleteBaseStructure(tiles, 0, 0, size.width, size.height, config);
  
  const era = config.specificYear || 1500;
  
  // Route to appropriate generator based on culture and era
  if (config.culturalZone === 'EUROPEAN') {
    if (era < 500) {
      generateClassicalAcademy(tiles, size, config, era, interactionZones, rooms);
    } else if (era < 1500) {
      generateMedievalMonastery(tiles, size, config, era, interactionZones, rooms);
    } else if (era < 1800) {
      generateRenaissanceAcademy(tiles, size, config, era, interactionZones, rooms);
    } else {
      generateModernUniversity(tiles, size, config, era, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'MENA') {
    generateIslamicMadrasa(tiles, size, config, era, interactionZones, rooms);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.region === 'china' || config.region === 'korea') {
      generateConfucianAcademy(tiles, size, config, era, interactionZones, rooms);
    } else {
      generateBuddhistMonastery(tiles, size, config, era, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    if (era < 1800) {
      generateGurukula(tiles, size, config, era, interactionZones, rooms);
    } else {
      generateModernUniversity(tiles, size, config, era, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    if (era < 1800) {
      generateAfricanLearningCenter(tiles, size, config, era, interactionZones, rooms);
    } else {
      generateModernUniversity(tiles, size, config, era, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'INDIGENOUS_AMERICAN') {
    generateMesoamericanCalmecac(tiles, size, config, era, interactionZones, rooms);
  } else {
    // Default to modern university for unknown cultures
    generateModernUniversity(tiles, size, config, era, interactionZones, rooms);
  }
  
  // Main exit
  exitZones.push({
    id: 'main_exit',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Exit Academy',
    destination: 'parent_map'
  });
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Create complete base structure with ALL walls and proper floors
 */
function createCompleteBaseStructure(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  const floorType = getFloorType(config.culturalZone, config.specificYear || 1500);
  
  // Fill entire area with floor first
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      tiles[y][x].biome = floorType;
      tiles[y][x].isBlocking = false;
    }
  }
  
  // Add proper walls on ALL perimeter tiles
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      // North wall (back wall with windows)
      if (y === startY) {
        tiles[y][x].biome = BiomeType.WALL_BACK;
        tiles[y][x].isBlocking = true;
      }
      // South wall (front wall)
      else if (y === startY + height - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
      // West wall
      else if (x === startX) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
      // East wall
      else if (x === startX + width - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Add windows to back wall
  const windowSpacing = Math.max(4, Math.floor(width / 4));
  for (let i = 1; i * windowSpacing < width - 1; i++) {
    const windowX = startX + i * windowSpacing;
    tiles[startY][windowX].biome = BiomeType.WALL_BACK_WINDOW;
  }
  
  // Main entrance at bottom center
  const entranceX = Math.floor(width / 2);
  tiles[startY + height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][entranceX].isBlocking = false;
}

/**
 * Medieval European monastery with scriptorium and cloister
 */
function generateMedievalMonastery(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  // Central cloister courtyard
  const cloisSize = Math.min(size.width - 12, size.height - 12, 20);
  const cloisX = Math.floor((size.width - cloisSize) / 2);
  const cloisY = Math.floor((size.height - cloisSize) / 2);
  
  // Create cloister garden
  for (let y = cloisY; y < cloisY + cloisSize; y++) {
    for (let x = cloisX; x < cloisX + cloisSize; x++) {
      tiles[y][x].biome = BiomeType.PARK;
    }
  }
  
  // Covered walkway with columns around cloister
  for (let i = 0; i < cloisSize; i += 3) {
    // North colonnade
    tiles[cloisY - 1][cloisX + i].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'stone'
    };
    // South colonnade
    tiles[cloisY + cloisSize][cloisX + i].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'stone'
    };
    // East colonnade
    tiles[cloisY + i][cloisX + cloisSize].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'stone'
    };
    // West colonnade
    tiles[cloisY + i][cloisX - 1].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'stone'
    };
  }
  
  // Scriptorium (north side) - where manuscripts are copied
  const scripWidth = Math.min(16, size.width - 6);
  const scripHeight = 6;
  const scripX = Math.floor((size.width - scripWidth) / 2);
  const scripY = 2;
  
  // Create room division
  for (let x = scripX; x < scripX + scripWidth; x++) {
    tiles[scripY + scripHeight][x].biome = BiomeType.WALL;
    tiles[scripY + scripHeight][x].isBlocking = true;
  }
  
  // Writing desks with proper overlays
  for (let x = scripX + 2; x < scripX + scripWidth - 2; x += 3) {
    // Desk
    tiles[scripY + 2][x].overlayObject = {
      type: OverlayObjectType.DESK,
      rotation: 0,
      material: 'oak'
    };
    tiles[scripY + 2][x].isBlocking = true;
    
    // Chair
    tiles[scripY + 3][x].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0,
      material: 'oak'
    };
    
    // Lectern for copying
    tiles[scripY + 2][x + 1].overlayObject = {
      type: OverlayObjectType.LECTERN,
      rotation: 0,
      material: 'oak'
    };
  }
  
  // Candles for lighting
  tiles[scripY + 1][scripX + 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'brass'
  };
  tiles[scripY + 1][scripX + scripWidth - 3].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'brass'
  };
  
  // Library (west side)
  const libWidth = 8;
  const libHeight = Math.min(12, cloisY - 3);
  const libX = 2;
  const libY = cloisY - libHeight - 1;
  
  // Room division
  for (let y = libY; y < libY + libHeight; y++) {
    tiles[y][libX + libWidth].biome = BiomeType.WALL;
    tiles[y][libX + libWidth].isBlocking = true;
  }
  
  // Bookshelves along walls
  for (let y = libY + 1; y < libY + libHeight - 1; y += 2) {
    tiles[y][libX + 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 90,
      material: 'oak'
    };
    tiles[y][libX + 1].isBlocking = true;
    
    tiles[y][libX + libWidth - 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 270,
      material: 'oak'
    };
    tiles[y][libX + libWidth - 1].isBlocking = true;
  }
  
  // Reading desk in center
  tiles[libY + Math.floor(libHeight / 2)][libX + Math.floor(libWidth / 2)].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'oak'
  };
  
  // Chapel (east side) 
  const chapWidth = 8;
  const chapHeight = Math.min(12, cloisY - 3);
  const chapX = size.width - chapWidth - 2;
  const chapY = cloisY - chapHeight - 1;
  
  // Room division
  for (let y = chapY; y < chapY + chapHeight; y++) {
    tiles[y][chapX - 1].biome = BiomeType.WALL;
    tiles[y][chapX - 1].isBlocking = true;
  }
  
  // Altar at north end
  tiles[chapY + 1][chapX + Math.floor(chapWidth / 2)].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'stone'
  };
  tiles[chapY + 1][chapX + Math.floor(chapWidth / 2)].isBlocking = true;
  
  // Candelabras
  tiles[chapY + 1][chapX + 1].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'gold'
  };
  tiles[chapY + 1][chapX + chapWidth - 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'gold'
  };
  
  // Prayer benches
  for (let y = chapY + 3; y < chapY + chapHeight - 1; y += 2) {
    for (let x = chapX + 1; x < chapX + chapWidth - 1; x++) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 0,
        material: 'oak'
      };
    }
  }
  
  // Refectory (south side) - dining hall
  const refWidth = Math.min(20, size.width - 6);
  const refHeight = 6;
  const refX = Math.floor((size.width - refWidth) / 2);
  const refY = size.height - refHeight - 2;
  
  // Long dining tables
  placeMultiTileTable(tiles, refX + 2, refY + 2, Math.min(7, refWidth - 4), 'horizontal', 'oak');
  placeMultiTileTable(tiles, refX + 2, refY + 4, Math.min(7, refWidth - 4), 'horizontal', 'oak');
  
  // Benches
  for (let x = refX + 2; x < refX + Math.min(9, refWidth - 2); x++) {
    tiles[refY + 1][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'oak'
    };
    tiles[refY + 3][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'oak'
    };
  }
  
  rooms.push(
    {
      id: 'scriptorium',
      name: 'Scriptorium',
      bounds: { x: scripX, y: scripY, width: scripWidth, height: scripHeight },
      type: 'academic',
      accessLevel: 'restricted'
    },
    {
      id: 'library',
      name: 'Library',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'academic',
      accessLevel: 'public'
    },
    {
      id: 'chapel',
      name: 'Chapel',
      bounds: { x: chapX, y: chapY, width: chapWidth, height: chapHeight },
      type: 'religious',
      accessLevel: 'public'
    },
    {
      id: 'cloister',
      name: 'Cloister Garden',
      bounds: { x: cloisX, y: cloisY, width: cloisSize, height: cloisSize },
      type: 'garden',
      accessLevel: 'public'
    }
  );
}

/**
 * Islamic madrasa with fountain courtyard and iwans
 */
function generateIslamicMadrasa(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central courtyard with geometric tile patterns
  const courtSize = Math.min(size.width - 16, size.height - 16, 20);
  const courtX = Math.floor((size.width - courtSize) / 2);
  const courtY = Math.floor((size.height - courtSize) / 2);
  
  // Create geometric floor pattern
  for (let y = courtY; y < courtY + courtSize; y++) {
    for (let x = courtX; x < courtX + courtSize; x++) {
      const pattern = ((x - courtX) + (y - courtY)) % 2 === 0;
      tiles[y][x].biome = pattern ? BiomeType.FLOOR_TILE : BiomeType.FLOOR_MARBLE;
    }
  }
  
  // Central fountain
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FOUNTAIN,
    rotation: 0,
    material: 'marble'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Decorative pools around fountain
  const poolPositions = [
    [centerX - 2, centerY], [centerX + 2, centerY],
    [centerX, centerY - 2], [centerX, centerY + 2]
  ];
  poolPositions.forEach(([x, y]) => {
    tiles[y][x].biome = BiomeType.WATER;
  });
  
  // North iwan - main lecture hall
  const iwanDepth = 8;
  const iwanWidth = 14;
  const northIwanX = Math.floor((size.width - iwanWidth) / 2);
  const northIwanY = courtY - iwanDepth - 1;
  
  // Create iwan space
  for (let y = northIwanY; y < northIwanY + iwanDepth; y++) {
    for (let x = northIwanX; x < northIwanX + iwanWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_CARPET;
    }
  }
  
  // Teacher's position (mihrab-style niche)
  tiles[northIwanY + 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    material: 'carved_wood'
  };
  tiles[northIwanY + 1][centerX].isBlocking = true;
  
  // Lectern for Quran
  tiles[northIwanY + 2][centerX - 1].overlayObject = {
    type: OverlayObjectType.LECTERN,
    rotation: 0,
    material: 'brass'
  };
  
  // Student seating (prayer rugs/cushions)
  for (let y = northIwanY + 4; y < northIwanY + iwanDepth - 1; y++) {
    for (let x = northIwanX + 2; x < northIwanX + iwanWidth - 2; x += 2) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        material: 'fabric'
      };
    }
  }
  
  // Oil lamps for lighting
  tiles[northIwanY + 1][northIwanX + 1].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'brass'
  };
  tiles[northIwanY + 1][northIwanX + iwanWidth - 2].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'brass'
  };
  
  // South iwan - library
  const southIwanX = northIwanX;
  const southIwanY = courtY + courtSize + 1;
  
  for (let y = southIwanY; y < southIwanY + iwanDepth && y < size.height - 1; y++) {
    for (let x = southIwanX; x < southIwanX + iwanWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
    }
  }
  
  // Book niches and shelves
  for (let x = southIwanX + 1; x < southIwanX + iwanWidth - 1; x += 3) {
    tiles[southIwanY + iwanDepth - 2][x].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 180,
      material: 'cedar'
    };
    tiles[southIwanY + iwanDepth - 2][x].isBlocking = true;
  }
  
  // Reading desk
  tiles[southIwanY + 3][centerX].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'cedar'
  };
  tiles[southIwanY + 4][centerX].overlayObject = {
    type: OverlayObjectType.CHAIR,
    rotation: 0,
    material: 'cedar'
  };
  
  // East iwan - study cells
  const eastIwanX = courtX + courtSize + 1;
  const eastIwanY = Math.floor((size.height - iwanWidth) / 2);
  
  // Individual study alcoves
  for (let y = eastIwanY + 1; y < eastIwanY + iwanWidth - 1 && y < size.height - 1; y += 3) {
    if (eastIwanX + 4 < size.width - 1) {
      // Small desk
      tiles[y][eastIwanX + 2].overlayObject = {
        type: OverlayObjectType.DESK,
        rotation: 90,
        material: 'cedar'
      };
      tiles[y][eastIwanX + 2].isBlocking = true;
      
      // Cushion for sitting
      tiles[y][eastIwanX + 3].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 270,
        material: 'fabric'
      };
      
      // Oil lamp
      tiles[y][eastIwanX + 1].overlayObject = {
        type: OverlayObjectType.LANTERN,
        rotation: 0,
        material: 'brass'
      };
    }
  }
  
  // West iwan - ablution area and entrance
  const westIwanX = courtX - iwanDepth - 1;
  const westIwanY = eastIwanY;
  
  if (westIwanX > 0) {
    // Water basins for ablution
    for (let y = westIwanY + 2; y < westIwanY + iwanWidth - 2 && y < size.height - 1; y += 4) {
      tiles[y][westIwanX + 3].overlayObject = {
        type: OverlayObjectType.BASIN,
        rotation: 0,
        material: 'marble'
      };
      tiles[y][westIwanX + 3].isBlocking = true;
    }
    
    // Shoe racks
    for (let y = westIwanY + 1; y < westIwanY + iwanWidth - 1 && y < size.height - 1; y += 2) {
      tiles[y][westIwanX + 1].overlayObject = {
        type: OverlayObjectType.CABINET,
        rotation: 90,
        material: 'wood'
      };
    }
  }
  
  // Decorative elements
  // Incense burners in corners
  tiles[courtY + 1][courtX + 1].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'brass'
  };
  tiles[courtY + 1][courtX + courtSize - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'brass'
  };
  
  rooms.push(
    {
      id: 'lecture_iwan',
      name: 'Lecture Hall',
      bounds: { x: northIwanX, y: northIwanY, width: iwanWidth, height: iwanDepth },
      type: 'academic',
      accessLevel: 'public'
    },
    {
      id: 'library_iwan',
      name: 'Library',
      bounds: { x: southIwanX, y: southIwanY, width: iwanWidth, height: iwanDepth },
      type: 'academic',
      accessLevel: 'public'
    },
    {
      id: 'courtyard',
      name: 'Central Courtyard',
      bounds: { x: courtX, y: courtY, width: courtSize, height: courtSize },
      type: 'garden',
      accessLevel: 'public'
    }
  );
}

/**
 * Confucian academy with examination halls
 */
function generateConfucianAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  
  // Main ceremonial axis
  for (let y = 2; y < size.height - 2; y++) {
    tiles[y][centerX].biome = BiomeType.PATH;
    tiles[y][centerX - 1].biome = BiomeType.PATH;
    tiles[y][centerX + 1].biome = BiomeType.PATH;
  }
  
  // Main lecture hall (Ming Tang) at north
  const hallWidth = 16;
  const hallHeight = 8;
  const hallX = Math.floor((size.width - hallWidth) / 2);
  const hallY = 2;
  
  // Hall interior
  for (let y = hallY; y < hallY + hallHeight; y++) {
    for (let x = hallX; x < hallX + hallWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Confucius statue/shrine
  tiles[hallY + 1][centerX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'jade'
  };
  tiles[hallY + 1][centerX].isBlocking = true;
  
  // Altar with offerings
  tiles[hallY + 2][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'lacquered_wood'
  };
  tiles[hallY + 2][centerX].isBlocking = true;
  
  // Incense burners flanking altar
  tiles[hallY + 2][centerX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[hallY + 2][centerX + 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  
  // Teacher's seat
  tiles[hallY + 4][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    material: 'lacquered_wood'
  };
  
  // Student seating mats
  for (let y = hallY + 5; y < hallY + hallHeight - 1; y++) {
    for (let x = hallX + 2; x < hallX + hallWidth - 2; x += 2) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        material: 'silk'
      };
    }
  }
  
  // East study pavilion
  const pavWidth = 8;
  const pavHeight = 10;
  const eastPavX = size.width - pavWidth - 2;
  const eastPavY = Math.floor((size.height - pavHeight) / 2);
  
  // Create pavilion room
  for (let y = eastPavY; y < eastPavY + pavHeight; y++) {
    tiles[y][eastPavX - 1].biome = BiomeType.WALL;
    tiles[y][eastPavX - 1].isBlocking = true;
  }
  
  // Study desks with Four Treasures (brush, ink, paper, inkstone)
  for (let y = eastPavY + 1; y < eastPavY + pavHeight - 1; y += 3) {
    // Low writing desk
    tiles[y][eastPavX + 2].overlayObject = {
      type: OverlayObjectType.DESK,
      rotation: 90,
      material: 'lacquered_wood'
    };
    tiles[y][eastPavX + 2].isBlocking = true;
    
    // Floor cushion
    tiles[y][eastPavX + 3].overlayObject = {
      type: OverlayObjectType.CUSHION,
      rotation: 270,
      material: 'silk'
    };
    
    // Bookshelf for classics
    tiles[y][eastPavX + pavWidth - 2].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 270,
      material: 'bamboo'
    };
    tiles[y][eastPavX + pavWidth - 2].isBlocking = true;
  }
  
  // Paper lanterns
  tiles[eastPavY + 1][eastPavX + 1].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'paper'
  };
  
  // West study pavilion (mirror of east)
  const westPavX = 2;
  const westPavY = eastPavY;
  
  // Create pavilion room
  for (let y = westPavY; y < westPavY + pavHeight; y++) {
    tiles[y][westPavX + pavWidth].biome = BiomeType.WALL;
    tiles[y][westPavX + pavWidth].isBlocking = true;
  }
  
  // Similar furnishing to east pavilion
  for (let y = westPavY + 1; y < westPavY + pavHeight - 1; y += 3) {
    tiles[y][westPavX + pavWidth - 3].overlayObject = {
      type: OverlayObjectType.DESK,
      rotation: 270,
      material: 'lacquered_wood'
    };
    tiles[y][westPavX + pavWidth - 3].isBlocking = true;
    
    tiles[y][westPavX + pavWidth - 4].overlayObject = {
      type: OverlayObjectType.CUSHION,
      rotation: 90,
      material: 'silk'
    };
    
    tiles[y][westPavX + 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 90,
      material: 'bamboo'
    };
    tiles[y][westPavX + 1].isBlocking = true;
  }
  
  // Examination hall at south
  const examWidth = 20;
  const examHeight = 8;
  const examX = Math.floor((size.width - examWidth) / 2);
  const examY = size.height - examHeight - 2;
  
  // Individual examination cells with privacy screens
  for (let y = examY + 1; y < examY + examHeight - 1; y += 2) {
    for (let x = examX + 1; x < examX + examWidth - 1; x += 3) {
      // Small individual desk
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.DESK,
        rotation: 0,
        material: 'pine'
      };
      tiles[y][x].isBlocking = true;
      
      // Chair
      tiles[y + 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0,
        material: 'pine'
      };
      
      // Privacy screen (using cabinet as divider)
      if (x + 2 < examX + examWidth - 1) {
        tiles[y][x + 2].overlayObject = {
          type: OverlayObjectType.CABINET,
          rotation: 0,
          material: 'bamboo'
        };
        tiles[y][x + 2].isBlocking = true;
      }
    }
  }
  
  // Decorative elements - traditional garden rocks
  tiles[hallY + hallHeight + 2][centerX - 4].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  tiles[hallY + hallHeight + 2][centerX + 4].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  
  rooms.push(
    {
      id: 'main_hall',
      name: 'Confucius Hall',
      bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
      type: 'ceremonial',
      accessLevel: 'public'
    },
    {
      id: 'east_pavilion',
      name: 'East Study Pavilion',
      bounds: { x: eastPavX, y: eastPavY, width: pavWidth, height: pavHeight },
      type: 'academic',
      accessLevel: 'restricted'
    },
    {
      id: 'west_pavilion',
      name: 'West Study Pavilion',
      bounds: { x: westPavX, y: westPavY, width: pavWidth, height: pavHeight },
      type: 'academic',
      accessLevel: 'restricted'
    },
    {
      id: 'examination_hall',
      name: 'Examination Hall',
      bounds: { x: examX, y: examY, width: examWidth, height: examHeight },
      type: 'examination',
      accessLevel: 'restricted'
    }
  );
}

/**
 * Buddhist monastery with meditation hall
 */
function generateBuddhistMonastery(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main temple/shrine room
  const templeWidth = 14;
  const templeHeight = 10;
  const templeX = Math.floor((size.width - templeWidth) / 2);
  const templeY = 2;
  
  // Temple floor
  for (let y = templeY; y < templeY + templeHeight; y++) {
    for (let x = templeX; x < templeX + templeWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Buddha statue
  tiles[templeY + 1][centerX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'gold'
  };
  tiles[templeY + 1][centerX].isBlocking = true;
  
  // Altar with offerings
  tiles[templeY + 2][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'lacquered_wood'
  };
  tiles[templeY + 2][centerX].isBlocking = true;
  
  // Incense burners
  tiles[templeY + 2][centerX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[templeY + 2][centerX + 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  
  // Candles
  for (let x = templeX + 1; x < templeX + templeWidth - 1; x += 3) {
    tiles[templeY + 1][x].overlayObject = {
      type: OverlayObjectType.CANDELABRA,
      rotation: 0,
      material: 'brass'
    };
  }
  
  // Meditation hall
  const medWidth = 20;
  const medHeight = 10;
  const medX = Math.floor((size.width - medWidth) / 2);
  const medY = centerY;
  
  // Meditation floor with tatami pattern
  for (let y = medY; y < medY + medHeight; y++) {
    for (let x = medX; x < medX + medWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Meditation cushions in rows
  for (let y = medY + 2; y < medY + medHeight - 2; y += 2) {
    for (let x = medX + 2; x < medX + medWidth - 2; x += 2) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        material: 'fabric'
      };
    }
  }
  
  // Bell for meditation
  tiles[medY + 1][centerX].overlayObject = {
    type: OverlayObjectType.BELL,
    rotation: 0,
    material: 'bronze'
  };
  
  // Library/Sutra hall
  const libWidth = 10;
  const libHeight = 8;
  const libX = 2;
  const libY = centerY;
  
  // Room division
  for (let y = libY; y < libY + libHeight; y++) {
    tiles[y][libX + libWidth].biome = BiomeType.WALL;
    tiles[y][libX + libWidth].isBlocking = true;
  }
  
  // Sutra shelves
  for (let y = libY + 1; y < libY + libHeight - 1; y += 2) {
    tiles[y][libX + 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 90,
      material: 'bamboo'
    };
    tiles[y][libX + 1].isBlocking = true;
    
    tiles[y][libX + libWidth - 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 270,
      material: 'bamboo'
    };
    tiles[y][libX + libWidth - 1].isBlocking = true;
  }
  
  // Reading desk
  tiles[libY + Math.floor(libHeight / 2)][libX + Math.floor(libWidth / 2)].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'bamboo'
  };
  
  // Garden area at bottom
  const gardenY = size.height - 6;
  for (let y = gardenY; y < size.height - 1; y++) {
    for (let x = 3; x < size.width - 3; x++) {
      tiles[y][x].biome = BiomeType.PARK;
    }
  }
  
  // Garden decorations
  tiles[gardenY + 2][centerX - 3].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  tiles[gardenY + 2][centerX + 3].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  
  rooms.push(
    {
      id: 'temple',
      name: 'Buddha Hall',
      bounds: { x: templeX, y: templeY, width: templeWidth, height: templeHeight },
      type: 'religious',
      accessLevel: 'public'
    },
    {
      id: 'meditation_hall',
      name: 'Meditation Hall',
      bounds: { x: medX, y: medY, width: medWidth, height: medHeight },
      type: 'meditation',
      accessLevel: 'public'
    },
    {
      id: 'library',
      name: 'Sutra Library',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'academic',
      accessLevel: 'restricted'
    }
  );
}

/**
 * Indian gurukula - outdoor learning under trees
 */
function generateGurukula(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central teaching area under banyan tree
  // Create raised platform
  const platWidth = 10;
  const platHeight = 10;
  const platX = Math.floor((size.width - platWidth) / 2);
  const platY = Math.floor((size.height - platHeight) / 2) - 2;
  
  for (let y = platY; y < platY + platHeight; y++) {
    for (let x = platX; x < platX + platWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Sacred tree representation (pillar)
  tiles[platY + 2][centerX].overlayObject = {
    type: OverlayObjectType.PILLAR_BASE,
    rotation: 0,
    material: 'wood'
  };
  tiles[platY + 2][centerX].isBlocking = true;
  
  // Guru's seat
  tiles[platY + 4][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    material: 'wood'
  };
  tiles[platY + 4][centerX].isBlocking = true;
  
  // Student mats in semicircle
  const radius = 4;
  for (let angle = 0; angle < Math.PI; angle += 0.3) {
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(platY + 6 + Math.sin(angle) * radius);
    if (x > platX && x < platX + platWidth && y > platY && y < platY + platHeight) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        material: 'jute'
      };
    }
  }
  
  // Sacred fire pit (havan kund)
  tiles[platY + platHeight + 2][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    material: 'stone'
  };
  tiles[platY + platHeight + 2][centerX].isBlocking = true;
  
  // Simple huts for students (ashram kutirs)
  const hutSize = 4;
  const hutSpacing = 2;
  
  // West side huts
  for (let i = 0; i < 3; i++) {
    const hutX = 2;
    const hutY = 4 + i * (hutSize + hutSpacing);
    
    if (hutY + hutSize < size.height - 2) {
      // Hut walls
      for (let y = hutY; y < hutY + hutSize; y++) {
        tiles[y][hutX + hutSize].biome = BiomeType.WALL;
        tiles[y][hutX + hutSize].isBlocking = true;
      }
      
      // Simple bed (mat)
      tiles[hutY + 1][hutX + 1].overlayObject = {
        type: OverlayObjectType.BED,
        rotation: 0,
        material: 'jute'
      };
      tiles[hutY + 1][hutX + 1].isBlocking = true;
      
      // Small chest for belongings
      tiles[hutY + 2][hutX + 1].overlayObject = {
        type: OverlayObjectType.CHEST,
        rotation: 0,
        material: 'wood'
      };
      tiles[hutY + 2][hutX + 1].isBlocking = true;
      
      // Oil lamp
      tiles[hutY + 1][hutX + 2].overlayObject = {
        type: OverlayObjectType.LANTERN,
        rotation: 0,
        material: 'clay'
      };
    }
  }
  
  // East side huts (mirror)
  for (let i = 0; i < 3; i++) {
    const hutX = size.width - hutSize - 2;
    const hutY = 4 + i * (hutSize + hutSpacing);
    
    if (hutY + hutSize < size.height - 2) {
      // Hut walls
      for (let y = hutY; y < hutY + hutSize; y++) {
        tiles[y][hutX - 1].biome = BiomeType.WALL;
        tiles[y][hutX - 1].isBlocking = true;
      }
      
      // Simple bed
      tiles[hutY + 1][hutX + hutSize - 2].overlayObject = {
        type: OverlayObjectType.BED,
        rotation: 0,
        material: 'jute'
      };
      tiles[hutY + 1][hutX + hutSize - 2].isBlocking = true;
      
      // Small chest
      tiles[hutY + 2][hutX + hutSize - 2].overlayObject = {
        type: OverlayObjectType.CHEST,
        rotation: 0,
        material: 'wood'
      };
      tiles[hutY + 2][hutX + hutSize - 2].isBlocking = true;
    }
  }
  
  // Library/manuscript room
  const libWidth = 8;
  const libHeight = 6;
  const libX = Math.floor((size.width - libWidth) / 2);
  const libY = 2;
  
  // Room walls
  for (let x = libX; x < libX + libWidth; x++) {
    tiles[libY + libHeight][x].biome = BiomeType.WALL;
    tiles[libY + libHeight][x].isBlocking = true;
  }
  
  // Palm leaf manuscript storage
  for (let x = libX + 1; x < libX + libWidth - 1; x += 2) {
    tiles[libY + 1][x].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 0,
      material: 'bamboo'
    };
    tiles[libY + 1][x].isBlocking = true;
  }
  
  // Writing desk
  tiles[libY + 3][libX + Math.floor(libWidth / 2)].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'wood'
  };
  
  rooms.push(
    {
      id: 'teaching_platform',
      name: 'Teaching Platform',
      bounds: { x: platX, y: platY, width: platWidth, height: platHeight },
      type: 'outdoor_classroom',
      accessLevel: 'public'
    },
    {
      id: 'library',
      name: 'Manuscript Room',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'academic',
      accessLevel: 'restricted'
    }
  );
}

/**
 * Modern university with lecture halls and labs
 */
function generateModernUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  
  // Central hallway
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
    }
  }
  
  // Lecture hall 1 (left side)
  const lec1Width = 10;
  const lec1Height = 8;
  const lec1X = 2;
  const lec1Y = 3;
  
  // Room walls
  for (let y = lec1Y; y < lec1Y + lec1Height; y++) {
    tiles[y][lec1X + lec1Width].biome = BiomeType.WALL;
    tiles[y][lec1X + lec1Width].isBlocking = true;
  }
  for (let x = lec1X; x < lec1X + lec1Width; x++) {
    tiles[lec1Y + lec1Height][x].biome = BiomeType.WALL;
    tiles[lec1Y + lec1Height][x].isBlocking = true;
  }
  
  // Podium/lectern
  tiles[lec1Y + 1][lec1X + Math.floor(lec1Width / 2)].overlayObject = {
    type: OverlayObjectType.PODIUM,
    rotation: 180,
    material: 'wood'
  };
  tiles[lec1Y + 1][lec1X + Math.floor(lec1Width / 2)].isBlocking = true;
  
  // Whiteboard (represented as cabinet)
  tiles[lec1Y + 1][lec1X + Math.floor(lec1Width / 2) - 1].overlayObject = {
    type: OverlayObjectType.CABINET,
    rotation: 0,
    material: 'plastic'
  };
  
  // Modern chairs in rows
  for (let y = lec1Y + 3; y < lec1Y + lec1Height - 1; y++) {
    for (let x = lec1X + 1; x < lec1X + lec1Width - 1; x++) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0,
        material: 'plastic'
      };
    }
  }
  
  // Computer lab (right side)
  const labWidth = 10;
  const labHeight = 8;
  const labX = size.width - labWidth - 2;
  const labY = 3;
  
  // Room walls
  for (let y = labY; y < labY + labHeight; y++) {
    tiles[y][labX - 1].biome = BiomeType.WALL;
    tiles[y][labX - 1].isBlocking = true;
  }
  for (let x = labX; x < labX + labWidth; x++) {
    tiles[labY + labHeight][x].biome = BiomeType.WALL;
    tiles[labY + labHeight][x].isBlocking = true;
  }
  
  // Computer desks in rows
  for (let y = labY + 1; y < labY + labHeight - 1; y += 2) {
    for (let x = labX + 1; x < labX + labWidth - 1; x += 2) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.DESK,
        rotation: 0,
        material: 'metal'
      };
      tiles[y][x].isBlocking = true;
      
      tiles[y + 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0,
        material: 'plastic'
      };
    }
  }
  
  // Library (bottom section)
  const libWidth = size.width - 6;
  const libHeight = 6;
  const libX = 3;
  const libY = size.height - libHeight - 2;
  
  // Library shelves
  for (let x = libX; x < libX + libWidth; x += 3) {
    for (let y = libY + 1; y < libY + libHeight - 1; y++) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.BOOKSHELF,
        rotation: x < centerX ? 90 : 270,
        material: 'metal'
      };
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Study tables between shelves
  for (let x = libX + 1; x < libX + libWidth - 1; x += 3) {
    tiles[libY + Math.floor(libHeight / 2)][x].overlayObject = {
      type: OverlayObjectType.DESK,
      rotation: 0,
      material: 'wood'
    };
    tiles[libY + Math.floor(libHeight / 2)][x].isBlocking = true;
  }
  
  // Modern lighting (represented as candelabras but understood as electric)
  tiles[lec1Y + 1][lec1X + 1].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'steel'
  };
  tiles[labY + 1][labX + labWidth - 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    material: 'steel'
  };
  
  rooms.push(
    {
      id: 'lecture_hall_1',
      name: 'Lecture Hall A',
      bounds: { x: lec1X, y: lec1Y, width: lec1Width, height: lec1Height },
      type: 'classroom',
      accessLevel: 'public'
    },
    {
      id: 'computer_lab',
      name: 'Computer Lab',
      bounds: { x: labX, y: labY, width: labWidth, height: labHeight },
      type: 'laboratory',
      accessLevel: 'restricted'
    },
    {
      id: 'library',
      name: 'Library',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'library',
      accessLevel: 'public'
    }
  );
}

// Additional cultural variations

/**
 * Classical Greek/Roman academy with peristyle
 */
function generateClassicalAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Peristyle courtyard with columns
  const courtSize = Math.min(size.width - 10, size.height - 10, 20);
  const courtX = Math.floor((size.width - courtSize) / 2);
  const courtY = Math.floor((size.height - courtSize) / 2);
  
  // Central garden
  for (let y = courtY + 3; y < courtY + courtSize - 3; y++) {
    for (let x = courtX + 3; x < courtX + courtSize - 3; x++) {
      tiles[y][x].biome = BiomeType.PARK;
    }
  }
  
  // Columns around courtyard
  for (let i = 0; i < courtSize; i += 3) {
    tiles[courtY][courtX + i].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'marble'
    };
    tiles[courtY + courtSize - 1][courtX + i].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'marble'
    };
    tiles[courtY + i][courtX].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'marble'
    };
    tiles[courtY + i][courtX + courtSize - 1].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      material: 'marble'
    };
  }
  
  // Philosopher's exedra (semicircular seating)
  const exedraRadius = 4;
  for (let angle = 0; angle < Math.PI; angle += 0.3) {
    const x = Math.floor(centerX + Math.cos(angle) * exedraRadius);
    const y = Math.floor(courtY - 3 - Math.sin(angle) * exedraRadius);
    if (x > 0 && x < size.width && y > 0) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: Math.floor((angle * 180) / Math.PI),
        material: 'marble'
      };
    }
  }
  
  // Statues of philosophers
  tiles[courtY + 4][courtX + 4].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'marble'
  };
  tiles[courtY + 4][courtX + courtSize - 5].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'marble'
  };
  
  rooms.push({
    id: 'peristyle',
    name: 'Peristyle Court',
    bounds: { x: courtX, y: courtY, width: courtSize, height: courtSize },
    type: 'courtyard',
    accessLevel: 'public'
  });
}

/**
 * Renaissance academy with art and science
 */
function generateRenaissanceAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central rotunda
  const rotRadius = 6;
  for (let y = centerY - rotRadius; y <= centerY + rotRadius; y++) {
    for (let x = centerX - rotRadius; x <= centerX + rotRadius; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= rotRadius) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        
        // Ring of columns
        if (Math.abs(dist - (rotRadius - 2)) < 0.5) {
          tiles[y][x].overlayObject = {
            type: OverlayObjectType.COLUMN,
            rotation: 0,
            material: 'marble'
          };
        }
      }
    }
  }
  
  // Central statue
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'marble'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Art gallery (west wing)
  const artWidth = 8;
  const artHeight = 12;
  const artX = 2;
  const artY = Math.floor((size.height - artHeight) / 2);
  
  for (let y = artY; y < artY + artHeight; y++) {
    tiles[y][artX + artWidth].biome = BiomeType.WALL;
    tiles[y][artX + artWidth].isBlocking = true;
  }
  
  // Artwork displays
  for (let y = artY + 1; y < artY + artHeight - 1; y += 3) {
    tiles[y][artX + 1].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 90,
      material: 'marble'
    };
    tiles[y][artX + artWidth - 1].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 270,
      material: 'bronze'
    };
  }
  
  // Anatomical theater (east wing)
  const theatX = size.width - 10;
  const theatY = centerY - 5;
  const theatSize = 8;
  
  // Demonstration table at center
  tiles[theatY + Math.floor(theatSize / 2)][theatX + Math.floor(theatSize / 2)].overlayObject = {
    type: OverlayObjectType.TABLE,
    rotation: 0,
    material: 'oak'
  };
  tiles[theatY + Math.floor(theatSize / 2)][theatX + Math.floor(theatSize / 2)].isBlocking = true;
  
  // Tiered seating in circle
  for (let r = 2; r < 4; r++) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
      const x = theatX + Math.floor(theatSize / 2) + Math.floor(Math.cos(angle) * r);
      const y = theatY + Math.floor(theatSize / 2) + Math.floor(Math.sin(angle) * r);
      if (x > theatX && x < theatX + theatSize && y > theatY && y < theatY + theatSize) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.CHAIR,
          rotation: Math.floor((angle * 180) / Math.PI),
          material: 'oak'
        };
      }
    }
  }
  
  rooms.push(
    {
      id: 'rotunda',
      name: 'Central Rotunda',
      bounds: { x: centerX - rotRadius, y: centerY - rotRadius, width: rotRadius * 2, height: rotRadius * 2 },
      type: 'hall',
      accessLevel: 'public'
    },
    {
      id: 'art_gallery',
      name: 'Art Gallery',
      bounds: { x: artX, y: artY, width: artWidth, height: artHeight },
      type: 'gallery',
      accessLevel: 'public'
    }
  );
}

/**
 * African learning center
 */
function generateAfricanLearningCenter(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central meeting area with fire pit
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    material: 'stone'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Seating circle around fire
  const radius = 5;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(centerY + Math.sin(angle) * radius);
    tiles[y][x].overlayObject = {
      type: OverlayObjectType.CUSHION,
      rotation: 0,
      material: 'leather'
    };
  }
  
  // Elder's seat
  tiles[centerY - radius - 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    material: 'carved_wood'
  };
  
  // Storage huts for scrolls/artifacts
  const hutSize = 4;
  
  // North hut
  const hutX = centerX - 2;
  const hutY = 2;
  
  for (let y = hutY; y < hutY + hutSize; y++) {
    for (let x = hutX; x < hutX + hutSize; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Artifact storage
  tiles[hutY + 1][hutX + 1].overlayObject = {
    type: OverlayObjectType.CHEST,
    rotation: 0,
    material: 'wood'
  };
  tiles[hutY + 1][hutX + 2].overlayObject = {
    type: OverlayObjectType.CABINET,
    rotation: 0,
    material: 'wood'
  };
  
  rooms.push({
    id: 'meeting_circle',
    name: 'Meeting Circle',
    bounds: { x: centerX - radius - 2, y: centerY - radius - 2, width: radius * 2 + 4, height: radius * 2 + 4 },
    type: 'outdoor_classroom',
    accessLevel: 'public'
  });
}

/**
 * Mesoamerican calmecac (Aztec school)
 */
function generateMesoamericanCalmecac(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = Math.floor(size.width / 2);
  
  // Central pyramid structure
  const pyrBase = Math.min(16, size.width - 6);
  const pyrHeight = 8;
  const pyrX = Math.floor((size.width - pyrBase) / 2);
  const pyrY = 3;
  
  // Stepped pyramid floors
  for (let level = 0; level < 3; level++) {
    const levelSize = pyrBase - (level * 4);
    const levelX = pyrX + (level * 2);
    const levelY = pyrY + (level * 2);
    
    for (let y = levelY; y < levelY + 2; y++) {
      for (let x = levelX; x < levelX + levelSize; x++) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // Temple at top with altar
  tiles[pyrY + 1][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'obsidian'
  };
  tiles[pyrY + 1][centerX].isBlocking = true;
  
  // Braziers flanking altar
  tiles[pyrY + 1][centerX - 2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'stone'
  };
  tiles[pyrY + 1][centerX + 2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'stone'
  };
  
  // Codex library room
  const libWidth = 8;
  const libHeight = 6;
  const libX = 2;
  const libY = centerX;
  
  for (let y = libY; y < libY + libHeight; y++) {
    tiles[y][libX + libWidth].biome = BiomeType.WALL;
    tiles[y][libX + libWidth].isBlocking = true;
  }
  
  // Codex storage (bookshelves)
  for (let y = libY + 1; y < libY + libHeight - 1; y++) {
    tiles[y][libX + 1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 90,
      material: 'wood'
    };
    tiles[y][libX + 1].isBlocking = true;
  }
  
  // Warrior training area
  const trainY = size.height - 8;
  
  // Weapon racks
  tiles[trainY][centerX - 3].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    material: 'wood'
  };
  tiles[trainY][centerX + 3].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    material: 'wood'
  };
  
  rooms.push(
    {
      id: 'temple',
      name: 'Temple',
      bounds: { x: pyrX, y: pyrY, width: pyrBase, height: pyrHeight },
      type: 'religious',
      accessLevel: 'restricted'
    },
    {
      id: 'codex_library',
      name: 'Codex Library',
      bounds: { x: libX, y: libY, width: libWidth, height: libHeight },
      type: 'library',
      accessLevel: 'restricted'
    }
  );
}

// Helper functions

/**
 * Place multi-tile table
 */
function placeMultiTileTable(
  tiles: Tile[][],
  startX: number,
  startY: number,
  length: number,
  orientation: 'horizontal' | 'vertical',
  material: string
): void {
  if (orientation === 'horizontal') {
    for (let i = 0; i < length; i++) {
      const x = startX + i;
      if (!tiles[startY] || !tiles[startY][x]) continue;
      
      let overlayType: OverlayObjectType;
      if (i === 0) {
        overlayType = OverlayObjectType.TABLE_LEFT;
      } else if (i === length - 1) {
        overlayType = OverlayObjectType.TABLE_RIGHT;
      } else {
        overlayType = OverlayObjectType.TABLE_CENTER;
      }
      
      tiles[startY][x].overlayObject = {
        type: overlayType,
        rotation: 0,
        material
      };
      tiles[startY][x].isBlocking = true;
    }
  } else {
    for (let i = 0; i < length; i++) {
      const y = startY + i;
      if (!tiles[y] || !tiles[y][startX]) continue;
      
      let overlayType: OverlayObjectType;
      if (i === 0) {
        overlayType = OverlayObjectType.TABLE_LEFT;
      } else if (i === length - 1) {
        overlayType = OverlayObjectType.TABLE_RIGHT;
      } else {
        overlayType = OverlayObjectType.TABLE_CENTER;
      }
      
      tiles[y][startX].overlayObject = {
        type: overlayType,
        rotation: 90,
        material
      };
      tiles[y][startX].isBlocking = true;
    }
  }
}

/**
 * Get appropriate floor type
 */
function getFloorType(culturalZone: string = 'EUROPEAN', era: number): BiomeType {
  if (culturalZone === 'MENA') {
    return era < 1000 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_TILE;
  } else if (culturalZone === 'EAST_ASIAN') {
    return BiomeType.FLOOR_WOOD;
  } else if (culturalZone === 'SOUTH_ASIAN') {
    return BiomeType.FLOOR_STONE;
  } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return BiomeType.FLOOR_WOOD;
  } else if (era >= 1900) {
    return BiomeType.FLOOR_TILE;
  } else if (era < 500) {
    return BiomeType.FLOOR_MARBLE;
  } else {
    return era < 1200 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_WOOD;
  }
}

// Export the generator function
export default generateUniversityAcademy;