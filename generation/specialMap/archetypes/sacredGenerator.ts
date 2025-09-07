/**
 * generation/specialMap/archetypes/sacredGenerator.ts
 * Generator for sacred complex special maps (temples, churches, mosques, shrines, etc.)
 * Enhanced with sophisticated layouts, overlay system, and cultural authenticity
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import { 
  generateCruciformFloor, 
  generateOctagonalFloor, 
  generateCircularFloor,
  generateMandalaFloor,
  generateGreekCrossFloor,
  generateBasilicaFloor,
  generatePagodaFloor,
  generateHexagonalFloor,
  carveShapeWithWalls
} from '../sacredShapeUtils';
import { 
  lightRoom,
  placeChandelier,
  placeWallSconce,
  getCulturalLighting
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  getCulturalStorage
} from '../storageUtilitySystem';
import {
  placeBenchWithOrientation,
  placeBookshelfAgainstWall,
  placeCulturalDecoration
} from '../directionalFurniturePlacement';

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
 * Generate a European medieval/renaissance church with sophisticated layout
 */
function generateChurch(
  tiles: Tile[][], 
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Fill with walls first
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.WALL);
  
  // Carve out cruciform shape
  const naveLength = Math.min(size.height - 10, 30);
  const transeptLength = Math.min(size.width - 10, 25);
  const armWidth = Math.min(10, size.width / 4);
  
  generateCruciformFloor(tiles, centerX, centerY, naveLength, transeptLength, armWidth, BiomeType.FLOOR_STONE);
  
  // Checkered floor pattern in nave
  const naveWidth = Math.min(size.width - 10, 24);
  const naveStartX = Math.floor((size.width - naveWidth) / 2);
  for (let y = 10; y < size.height - 5; y++) {
    for (let x = naveStartX; x < naveStartX + naveWidth; x++) {
      if ((x + y) % 2 === 0) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Create transept (cross shape)
  if (size.width >= 30) {
    const transeptY = Math.floor(size.height / 3);
    const transeptWidth = size.width - 10;
    const transeptStartX = 5;
    
    for (let x = transeptStartX; x < transeptStartX + transeptWidth; x++) {
      for (let y = transeptY - 2; y < transeptY + 3; y++) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
    
    // Side chapels with carpets
    tiles[transeptY][6].overlayObject = { type: OverlayObjectType.RUG, rotation: 0 };
    tiles[transeptY][size.width - 7].overlayObject = { type: OverlayObjectType.RUG, rotation: 0 };
  }
  
  // Ornate columns with bases using overlays
  for (let y = 8; y < size.height - 10; y += 5) {
    // Left colonnade
    tiles[y][naveStartX + 3].overlayObject = { 
      type: OverlayObjectType.COLUMN, 
      rotation: 0 
    };
    tiles[y][naveStartX + 3].isBlocking = true;
    
    // Right colonnade
    tiles[y][naveStartX + naveWidth - 3].overlayObject = { 
      type: OverlayObjectType.COLUMN, 
      rotation: 0 
    };
    tiles[y][naveStartX + naveWidth - 3].isBlocking = true;
  }
  
  // Create choir stalls using benches
  const choirY = 6;
  for (let x = naveStartX + 5; x < naveStartX + naveWidth - 5; x += 2) {
    tiles[choirY][x].biome = BiomeType.BENCH;
    tiles[choirY + 2][x].biome = BiomeType.BENCH;
  }
  
  // Elaborate altar area with steps
  const altarY = 3;
  const altarX = Math.floor(size.width / 2);
  
  // Raised dais for altar
  for (let y = altarY - 1; y <= altarY + 1; y++) {
    for (let x = altarX - 2; x <= altarX + 2; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  // Main altar with overlay
  tiles[altarY][altarX].biome = BiomeType.ALTAR;
  
  // Golden cross behind altar
  tiles[altarY - 1][altarX].overlayObject = { 
    type: OverlayObjectType.STATUE, 
    rotation: 0,
    variant: 'cross'
  };
  
  // Ceremonial armor stands flanking altar
  if (config.era === HistoricalEra.MEDIEVAL) {
    tiles[altarY][altarX - 4].overlayObject = {
      type: OverlayObjectType.ARMOR_STAND,
      rotation: 0
    };
    tiles[altarY][altarX - 4].isBlocking = true;
    
    tiles[altarY][altarX + 4].overlayObject = {
      type: OverlayObjectType.ARMOR_STAND,
      rotation: 0
    };
    tiles[altarY][altarX + 4].isBlocking = true;
  }
  
  // Candelabras near altar
  tiles[altarY + 1][altarX - 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA_FLOOR,
    rotation: 0,
    variant: 'candles_7'
  };
  tiles[altarY + 1][altarX + 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA_FLOOR,
    rotation: 0,
    variant: 'candles_7'
  };
  
  // Light the church properly
  const era = config.specificYear || 1400;
  lightRoom(tiles, naveStartX, 3, naveWidth, size.height - 8,
            'EUROPEAN', era, 'religious', true);
  
  // Add chandelier if appropriate era
  if (era >= 1200 && era < 1900) {
    placeChandelier(tiles, centerX, centerY - 5, 'EUROPEAN', era, true);
  }
  
  // Side chapels with shrines
  if (size.width >= 25) {
    const era = config.specificYear || 1400;
    
    // Left chapel
    tiles[8][3].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
    tiles[8][3].isBlocking = true;
    
    // Use proper bookshelf placement
    placeBookshelfAgainstWall(tiles, 3, 10, 3, 5, 'west', 'EUROPEAN', 'oak');
    
    // Use cultural storage for religious items
    placeCulturalStorage(tiles, 3, 12, 'EUROPEAN', era, 'religious');
    
    // Add prayer cushions
    tiles[9][4].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    tiles[9][5].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    
    // Right chapel
    tiles[8][size.width - 4].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
    tiles[8][size.width - 4].isBlocking = true;
    
    // Use proper bookshelf placement
    placeBookshelfAgainstWall(tiles, size.width - 4, 10, 3, 5, 'east', 'EUROPEAN', 'oak');
    
    // Use cultural storage for religious items
    placeCulturalStorage(tiles, size.width - 4, 12, 'EUROPEAN', era, 'religious');
    
    // Add prayer cushions
    tiles[9][size.width - 5].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    tiles[9][size.width - 6].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    
    // Add wall sconces for ambient lighting
    placeWallSconce(tiles, 2, 8, 'EUROPEAN', era);
    placeWallSconce(tiles, size.width - 3, 8, 'EUROPEAN', era);
  }
  
  // Pews with better spacing and arrangement using proper bench placement
  for (let y = size.height - 12; y > choirY + 6; y -= 3) {
    // Left side pews
    if (naveStartX + 5 < altarX - 3) {
      placeBenchWithOrientation(tiles, naveStartX + 5, y, 4, 1, 'EUROPEAN', 'oak');
    }
    // Right side pews  
    if (altarX + 3 < naveStartX + naveWidth - 9) {
      placeBenchWithOrientation(tiles, altarX + 3, y, 4, 1, 'EUROPEAN', 'oak');
    }
  }
  
  // Add decorative vases with flowers
  tiles[5][2].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };
  tiles[5][size.width - 3].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };
  
  // Incense burners
  tiles[choirY][altarX - 3].overlayObject = { 
    type: OverlayObjectType.INCENSE_BURNER, 
    rotation: 0 
  };
  tiles[choirY][altarX + 3].overlayObject = { 
    type: OverlayObjectType.INCENSE_BURNER, 
    rotation: 0 
  };
  
  // Stained glass windows (marked in material subtype)
  for (let x = 1; x < size.width - 1; x += 4) {
    tiles[1][x].materialSubtype = 'stained_glass';
    if (tiles[1][x].biome === BiomeType.WALL) {
      tiles[1][x].biome = BiomeType.WALL_WINDOW;
    }
  }
  
  // Path from entrance to altar
  for (let y = size.height - 2; y > altarY + 2; y--) {
    tiles[y][altarX].biome = BiomeType.PATH;
  }
  
  // Confessional booth (Catholic)
  if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    const confessionalX = 2;
    const confessionalY = Math.floor(size.height / 2);
    
    placeWallRectangle(tiles, confessionalX, confessionalY, 3, 4);
    tiles[confessionalY + 2][confessionalX + 1].biome = BiomeType.DOOR;
    tiles[confessionalY + 1][confessionalX + 1].biome = BiomeType.CHAIR;
    tiles[confessionalY + 1][confessionalX + 1].overlayObject = {
      type: OverlayObjectType.STOOL,
      rotation: 0
    };
    
    interactionZones.push({
      id: 'confessional',
      bounds: { x: confessionalX, y: confessionalY, width: 3, height: 4 },
      type: 'religious',
      interactions: ['confess']
    });
  }
  
  // Bell tower if space permits
  if (size.width >= 35 && size.height >= 35) {
    const towerX = size.width - 8;
    const towerY = 2;
    placeWallRectangle(tiles, towerX, towerY, 6, 6);
    fillArea(tiles, towerX + 1, towerY + 1, 4, 4, BiomeType.FLOOR_STONE);
    tiles[towerY + 2][towerX + 2].overlayObject = {
      type: OverlayObjectType.BELL,
      rotation: 0
    };
    tiles[towerY + 2][towerX + 2].isBlocking = true;
  }
  
  // Create interaction zones
  interactionZones.push({
    id: 'altar',
    bounds: { x: altarX - 3, y: altarY - 2, width: 7, height: 5 },
    type: 'religious',
    interactions: ['pray', 'offering', 'blessing']
  });
}

/**
 * Generate a mosque with beautiful geometric patterns
 */
function generateMosque(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Fill with walls first
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.WALL);
  
  // Create octagonal prayer hall
  const radius = Math.min(size.width, size.height) / 2 - 4;
  generateOctagonalFloor(tiles, centerX, centerY, radius, BiomeType.RUG);
  
  // Add door
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  
  // Add border tiles around the Persian rugs
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (tiles[y][x].biome === BiomeType.RUG) {
        // Check if this is an edge tile
        const neighbors = [
          tiles[y-1]?.[x]?.biome,
          tiles[y+1]?.[x]?.biome,
          tiles[y]?.[x-1]?.biome,
          tiles[y]?.[x+1]?.biome
        ];
        
        // If any neighbor is a wall, this should be a border rug
        if (neighbors.includes(BiomeType.WALL)) {
          tiles[y][x].materialSubtype = 'persian_rug_border';
        } else if ((x === 2 || x === size.width - 3) && (y === 2 || y === size.height - 3)) {
          // Corner pieces
          tiles[y][x].materialSubtype = 'persian_rug_corner';
        }
      }
    }
  }
  
  // Prayer hall with beautiful columns
  const hallWidth = size.width - 8;
  const hallHeight = size.height - 12;
  const hallStartX = 4;
  const hallStartY = 6;
  
  // Forest of columns in hyperstyle hall
  for (let x = hallStartX; x < hallStartX + hallWidth; x += 4) {
    for (let y = hallStartY; y < hallStartY + hallHeight; y += 4) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'islamic'
      };
      tiles[y][x].isBlocking = true;
      
      // Decorative arches between columns (visual only)
      if (x + 4 < hallStartX + hallWidth) {
        tiles[y][x + 2].materialSubtype = 'arch';
      }
    }
  }
  
  // Mihrab (prayer niche) - elaborate design
  const mihrabX = size.width - 3;
  const mihrabY = Math.floor(size.height / 2);
  
  // Create recessed mihrab area
  for (let y = mihrabY - 2; y <= mihrabY + 2; y++) {
    for (let x = mihrabX - 1; x <= mihrabX; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
    }
  }
  
  tiles[mihrabY][mihrabX].biome = BiomeType.ALTAR;
  tiles[mihrabY][mihrabX].materialSubtype = 'mihrab';
  
  // Decorative elements around mihrab
  tiles[mihrabY - 1][mihrabX - 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0
  };
  tiles[mihrabY + 1][mihrabX - 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0
  };
  
  // Minbar (pulpit) with steps
  const minbarX = mihrabX - 4;
  const minbarY = mihrabY - 3;
  
  // Base platform
  tiles[minbarY][minbarX].biome = BiomeType.DAIS;
  tiles[minbarY + 1][minbarX].biome = BiomeType.STAIRS_UP;
  
  // Pulpit
  tiles[minbarY][minbarX].overlayObject = {
    type: OverlayObjectType.PODIUM,
    rotation: 0
  };
  tiles[minbarY][minbarX].isBlocking = true;
  
  // Individual prayer cushions throughout the hall
  for (let y = hallStartY + 2; y < hallStartY + hallHeight; y += 3) {
    for (let x = hallStartX + 2; x < hallStartX + hallWidth - 2; x += 3) {
      if (!tiles[y][x].overlayObject && !tiles[y][x].isBlocking) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.CUSHION,
          rotation: 90, // Facing east (mihrab)
          material: 'silk'
        };
      }
    }
  }
  
  // Ablution fountain in courtyard (if space)
  if (size.width > 40) {
    const fountainX = Math.floor(size.width / 4);
    const fountainY = Math.floor(size.height / 2);
    
    // Create courtyard area
    for (let y = fountainY - 4; y <= fountainY + 4; y++) {
      for (let x = fountainX - 4; x <= fountainX + 4; x++) {
        tiles[y][x].biome = BiomeType.PLAZA;
      }
    }
    
    // Central fountain
    tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
    
    // Water basins around fountain using overlay system
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0) {
          tiles[fountainY + dy][fountainX + dx].overlayObject = {
            type: OverlayObjectType.BASIN,
            rotation: 0,
            material: 'marble'
          };
          tiles[fountainY + dy][fountainX + dx].isBlocking = false;
        }
      }
    }
    
    // Benches around courtyard using proper placement
    placeBenchWithOrientation(tiles, fountainX - 3, fountainY - 3, 2, 1, 'MENA', 'cedar');
    placeBenchWithOrientation(tiles, fountainX + 2, fountainY - 3, 2, 1, 'MENA', 'cedar');
    placeBenchWithOrientation(tiles, fountainX - 3, fountainY + 3, 2, 1, 'MENA', 'cedar');
    placeBenchWithOrientation(tiles, fountainX + 2, fountainY + 3, 2, 1, 'MENA', 'cedar');
  }
  
  // Shoe storage area near entrance using cultural storage
  const shoeAreaY = size.height - 4;

  for (let x = Math.floor(size.width / 2) - 3; x <= Math.floor(size.width / 2) + 3; x += 2) {
    placeCulturalStorage(tiles, x, shoeAreaY, 'MENA', era, 'general');
  }
  
  // Chandelier in main hall using proper placement
  const chandY = Math.floor(hallStartY + hallHeight / 2);
  const chandX = Math.floor(size.width / 2);
  const era = config.specificYear || 1400;
  if (!tiles[chandY][chandX].isBlocking && era >= 1200) {
    placeChandelier(tiles, chandX, chandY, 'MENA', era, true);
  }
  
  // Light the mosque properly with lanterns and sconces
  lightRoom(tiles, hallStartX, hallStartY, hallWidth, hallHeight,
            'MENA', era, 'religious', true);
  
  // Add hanging lanterns for additional lighting
  if (era >= 900 && era < 1900) {
    for (let x = hallStartX + 6; x < hallStartX + hallWidth - 6; x += 8) {
      for (let y = hallStartY + 6; y < hallStartY + hallHeight - 6; y += 8) {
        if (!tiles[y][x].isBlocking) {
          tiles[y][x].overlayObject = {
            type: OverlayObjectType.HANGING_LANTERN,
            rotation: 0,
            material: 'brass'
          };
        }
      }
    }
  }
  
  // Islamic calligraphy decoration (marked as subtype)
  for (let x = 2; x < size.width - 2; x += 6) {
    tiles[2][x].materialSubtype = 'calligraphy';
  }
  
  interactionZones.push({
    id: 'prayer_hall',
    bounds: { x: hallStartX, y: hallStartY, width: hallWidth, height: hallHeight },
    type: 'religious',
    interactions: ['pray', 'meditate', 'ablution']
  });
}

/**
 * Generate a Buddhist temple with zen gardens
 */
function generateBuddhistTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Fill with walls first
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.WALL);
  
  // Create circular meditation hall with mandala pattern
  const radius = Math.min(size.width, size.height) / 2 - 4;
  generateMandalaFloor(tiles, centerX, centerY, radius, 3);
  
  // Add entrance
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  
  // Main hall setup
  const hallCenterX = Math.floor(size.width / 2);
  const hallCenterY = Math.floor(size.height / 3);
  
  // Create raised platform for Buddha statue
  for (let y = hallCenterY - 2; y <= hallCenterY + 2; y++) {
    for (let x = hallCenterX - 3; x <= hallCenterX + 3; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  // Large Buddha statue using overlay
  tiles[hallCenterY][hallCenterX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    variant: 'buddha'
  };
  tiles[hallCenterY][hallCenterX].isBlocking = true;
  
  // Offering tables with items
  tiles[hallCenterY + 3][hallCenterX - 2].biome = BiomeType.TABLE;
  tiles[hallCenterY + 3][hallCenterX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0
  };
  
  tiles[hallCenterY + 3][hallCenterX].biome = BiomeType.TABLE;
  tiles[hallCenterY + 3][hallCenterX].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  
  tiles[hallCenterY + 3][hallCenterX + 2].biome = BiomeType.TABLE;
  tiles[hallCenterY + 3][hallCenterX + 2].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0
  };
  
  // Meditation area with cushions
  const meditationStartY = hallCenterY + 6;
  for (let y = meditationStartY; y < size.height - 5; y += 3) {
    for (let x = 5; x < size.width - 5; x += 3) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: noise.random() * 360
      };
      
      // Add meditation mats under some cushions
      if (noise.random() > 0.5) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.MEDITATION_MAT,
          rotation: 0
        };
        tiles[y][x + 1].overlayObject = {
          type: OverlayObjectType.CUSHION,
          rotation: 0
        };
      }
    }
  }
  
  // Side altars with smaller statues
  if (size.width >= 30) {
    // Left altar
    tiles[hallCenterY][4].overlayObject = {
      type: OverlayObjectType.SHRINE,
      rotation: 0
    };
    tiles[hallCenterY][4].isBlocking = true;
    
    // Right altar
    tiles[hallCenterY][size.width - 5].overlayObject = {
      type: OverlayObjectType.SHRINE,
      rotation: 0
    };
    tiles[hallCenterY][size.width - 5].isBlocking = true;
  }
  
  // Incense and candles
  for (let x = hallCenterX - 5; x <= hallCenterX + 5; x += 2) {
    if (x !== hallCenterX) {
      tiles[hallCenterY + 1][x].overlayObject = {
        type: OverlayObjectType.CANDELABRA,
        rotation: 0
      };
    }
  }
  
  // Gongs for ceremonies
  tiles[hallCenterY][hallCenterX - 6].overlayObject = {
    type: OverlayObjectType.GONG,
    rotation: 0
  };
  tiles[hallCenterY][hallCenterX - 6].isBlocking = true;
  
  tiles[hallCenterY][hallCenterX + 6].overlayObject = {
    type: OverlayObjectType.BELL,
    rotation: 0
  };
  tiles[hallCenterY][hallCenterX + 6].isBlocking = true;
  
  // Hanging lanterns along walls
  for (let y = 4; y < size.height - 4; y += 5) {
    tiles[y][2].biome = BiomeType.LANTERN;
    tiles[y][size.width - 3].biome = BiomeType.LANTERN;
  }
  
  // Red entrance lanterns
  tiles[size.height - 3][hallCenterX - 3].biome = BiomeType.LANTERN;
  tiles[size.height - 3][hallCenterX - 3].materialSubtype = 'red_paper';
  tiles[size.height - 3][hallCenterX + 3].biome = BiomeType.LANTERN;
  tiles[size.height - 3][hallCenterX + 3].materialSubtype = 'red_paper';
  
  // Zen garden area if space permits
  if (size.width > 45) {
    const gardenX = size.width - 12;
    const gardenY = 5;
    const gardenSize = 10;
    
    // Sand/gravel base
    for (let y = gardenY; y < gardenY + gardenSize; y++) {
      for (let x = gardenX; x < gardenX + gardenSize; x++) {
        tiles[y][x].biome = BiomeType.PLAZA;
        tiles[y][x].materialSubtype = 'zen_gravel';
      }
    }
    
    // Rock arrangements
    tiles[gardenY + 2][gardenX + 2].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'rock'
    };
    tiles[gardenY + 5][gardenX + 7].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'rock'
    };
    
    // Small pond
    fillArea(tiles, gardenX + 4, gardenY + 6, 3, 3, BiomeType.WATER);
    
    // Bamboo fountain
    tiles[gardenY + 7][gardenX + 3].biome = BiomeType.FOUNTAIN;
    tiles[gardenY + 7][gardenX + 3].materialSubtype = 'bamboo';
  }
  
  // Scroll racks with sutras
  tiles[5][2].overlayObject = {
    type: OverlayObjectType.SCROLL_RACK,
    rotation: 0
  };
  tiles[5][2].isBlocking = true;
  
  tiles[5][size.width - 3].overlayObject = {
    type: OverlayObjectType.SCROLL_RACK,
    rotation: 0
  };
  tiles[5][size.width - 3].isBlocking = true;
  
  interactionZones.push({
    id: 'buddha_shrine',
    bounds: { x: hallCenterX - 4, y: hallCenterY - 3, width: 9, height: 7 },
    type: 'religious',
    interactions: ['pray', 'offering', 'meditate']
  });
  
  interactionZones.push({
    id: 'meditation_hall',
    bounds: { x: 4, y: meditationStartY, width: size.width - 8, height: size.height - meditationStartY - 4 },
    type: 'religious',
    interactions: ['meditate', 'chant']
  });
}

/**
 * Generate a Shinto shrine with torii gates
 */
function generateShinto(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Open air design - mostly outdoor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  // Add gravel paths
  const pathX = Math.floor(size.width / 2);
  
  // Main approach path
  for (let y = size.height - 1; y > 3; y--) {
    tiles[y][pathX].biome = BiomeType.PATH;
    tiles[y][pathX - 1].biome = BiomeType.PATH;
    tiles[y][pathX + 1].biome = BiomeType.PATH;
  }
  
  // Multiple torii gates along approach
  const toriiPositions = [size.height - 5, size.height - 12, size.height - 19];
  toriiPositions.forEach(toriiY => {
    if (toriiY > 0) {
      // Torii pillars using column overlay
      tiles[toriiY][pathX - 4].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'torii'
      };
      tiles[toriiY][pathX - 4].isBlocking = true;
      tiles[toriiY][pathX - 4].materialSubtype = 'vermillion';
      
      tiles[toriiY][pathX + 4].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'torii'
      };
      tiles[toriiY][pathX + 4].isBlocking = true;
      tiles[toriiY][pathX + 4].materialSubtype = 'vermillion';
      
      // Crossbeam (visual marker)
      for (let x = pathX - 3; x <= pathX + 3; x++) {
        tiles[toriiY - 1][x].materialSubtype = 'torii_beam';
      }
    }
  });
  
  // Stone lanterns along path
  for (let y = size.height - 7; y > 10; y -= 6) {
    // Traditional stone lanterns
    tiles[y][pathX - 5].biome = BiomeType.LANTERN;
    tiles[y][pathX - 5].isBlocking = true;
    tiles[y][pathX - 5].materialSubtype = 'stone';
    
    tiles[y][pathX + 5].biome = BiomeType.LANTERN;
    tiles[y][pathX + 5].isBlocking = true;
    tiles[y][pathX + 5].materialSubtype = 'stone';
  }
  
  // Main shrine building (haiden)
  const shrineY = 4;
  const shrineWidth = 14;
  const shrineHeight = 10;
  const shrineX = Math.floor((size.width - shrineWidth) / 2);
  
  // Raised foundation
  for (let y = shrineY; y < shrineY + shrineHeight; y++) {
    for (let x = shrineX; x < shrineX + shrineWidth; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  // Shrine walls
  placeWallRectangle(tiles, shrineX + 1, shrineY + 1, shrineWidth - 2, shrineHeight - 2);
  fillArea(tiles, shrineX + 2, shrineY + 2, shrineWidth - 4, shrineHeight - 4, BiomeType.FLOOR_WOOD);
  
  // Main altar (kamidana)
  tiles[shrineY + 3][pathX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0,
    variant: 'shinto'
  };
  tiles[shrineY + 3][pathX].isBlocking = true;
  
  // Offering table
  tiles[shrineY + 5][pathX].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  tiles[shrineY + 5][pathX].isBlocking = true;
  
  // Sacred mirror and objects
  tiles[shrineY + 3][pathX - 2].overlayObject = {
    type: OverlayObjectType.MIRROR,
    rotation: 0,
    variant: 'sacred'
  };
  
  tiles[shrineY + 3][pathX + 2].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    variant: 'sake'
  };
  
  // Purification fountain (temizuya)
  const fountainX = pathX - 8;
  const fountainY = size.height - 15;
  
  tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
  tiles[fountainY][fountainX].materialSubtype = 'purification';
  
  // Basin for water
  tiles[fountainY][fountainX + 1].biome = BiomeType.BASIN;
  tiles[fountainY - 1][fountainX].biome = BiomeType.BASIN;
  tiles[fountainY + 1][fountainX].biome = BiomeType.BASIN;
  
  // Ladles (marked as overlay)
  tiles[fountainY][fountainX - 1].overlayObject = {
    type: OverlayObjectType.STOOL,
    rotation: 0,
    variant: 'ladle_stand'
  };
  
  // Ema (wooden plaques) display
  if (size.width >= 40) {
    const emaX = pathX + 10;
    const emaY = fountainY;
    
    tiles[emaY][emaX].overlayObject = {
      type: OverlayObjectType.DISPLAY_CASE,
      rotation: 0,
      variant: 'ema_rack'
    };
    tiles[emaY][emaX].isBlocking = true;
  }
  
  // Sacred trees (shinboku) with shimenawa rope
  if (noise.random() > 0.3) {
    tiles[10][4].biome = BiomeType.FOREST;
    tiles[10][4].materialSubtype = 'sacred_tree';
    tiles[10][4].overlayObject = {
      type: OverlayObjectType.BANNER,
      rotation: 0,
      variant: 'shimenawa'
    };
  }
  
  if (noise.random() > 0.3) {
    tiles[10][size.width - 5].biome = BiomeType.FOREST;
    tiles[10][size.width - 5].materialSubtype = 'sacred_tree';
    tiles[10][size.width - 5].overlayObject = {
      type: OverlayObjectType.BANNER,
      rotation: 0,
      variant: 'shimenawa'
    };
  }
  
  // Fortune telling booth (omikuji)
  tiles[shrineY + shrineHeight + 2][shrineX + 2].overlayObject = {
    type: OverlayObjectType.STALL,
    rotation: 0,
    variant: 'omikuji'
  };
  tiles[shrineY + shrineHeight + 2][shrineX + 2].isBlocking = true;
  
  interactionZones.push({
    id: 'main_shrine',
    bounds: { x: shrineX, y: shrineY, width: shrineWidth, height: shrineHeight },
    type: 'religious',
    interactions: ['pray', 'offering', 'fortune']
  });
  
  interactionZones.push({
    id: 'purification',
    bounds: { x: fountainX - 1, y: fountainY - 1, width: 3, height: 3 },
    type: 'religious',
    interactions: ['purify']
  });
}

/**
 * Generate Hindu temple with intricate design
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
  
  // Colorful floor patterns
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  // Create rangoli patterns on floor
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Circular mandala pattern
  const radius = 8;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(centerY + Math.sin(angle) * radius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.FLOOR_MOSAIC;
      tiles[y][x].materialSubtype = 'rangoli';
    }
  }
  
  // Mandapa (pillared hall) with ornate columns
  const mandapaSize = Math.min(24, size.width - 10);
  const mandapaX = Math.floor((size.width - mandapaSize) / 2);
  const mandapaY = Math.floor(size.height / 2) - 2;
  
  // Grid of ornate pillars
  for (let x = mandapaX; x < mandapaX + mandapaSize; x += 4) {
    for (let y = mandapaY; y < mandapaY + 12; y += 4) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'hindu'
      };
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Garbhagriha (inner sanctum)
  const sanctumX = centerX;
  const sanctumY = 5;
  const sanctumSize = 7;
  
  // Ornate entrance
  placeWallRectangle(tiles, sanctumX - 3, sanctumY, sanctumSize, sanctumSize);
  fillArea(tiles, sanctumX - 2, sanctumY + 1, sanctumSize - 2, sanctumSize - 2, BiomeType.FLOOR_MARBLE);
  
  // Door with carvings
  tiles[sanctumY + sanctumSize - 1][sanctumX].biome = BiomeType.DOOR;
  tiles[sanctumY + sanctumSize - 1][sanctumX].materialSubtype = 'carved';
  
  // Main deity statue
  tiles[sanctumY + 3][sanctumX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    variant: 'hindu_deity'
  };
  tiles[sanctumY + 3][sanctumX].isBlocking = true;
  
  // Idol platform
  tiles[sanctumY + 4][sanctumX].biome = BiomeType.DAIS;
  tiles[sanctumY + 4][sanctumX].materialSubtype = 'gold';
  
  // Secondary deities
  tiles[sanctumY + 3][sanctumX - 2].overlayObject = {
    type: OverlayObjectType.IDOL,
    rotation: 0
  };
  tiles[sanctumY + 3][sanctumX + 2].overlayObject = {
    type: OverlayObjectType.IDOL,
    rotation: 0
  };
  
  // Sacred fire altar (havan kund)
  tiles[mandapaY + 6][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'sacred'
  };
  tiles[mandapaY + 6][centerX].isBlocking = true;
  
  // Offering tables with flowers and prasad
  tiles[mandapaY + 8][centerX - 3].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  tiles[mandapaY + 8][centerX - 3].isBlocking = true;
  
  tiles[mandapaY + 8][centerX + 3].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  tiles[mandapaY + 8][centerX + 3].isBlocking = true;
  
  // Flower garlands
  tiles[mandapaY + 8][centerX - 3].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    variant: 'flower'
  };
  
  tiles[mandapaY + 8][centerX + 3].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    variant: 'flower'
  };
  
  // Bells for worship
  tiles[sanctumY + 2][sanctumX - 4].overlayObject = {
    type: OverlayObjectType.BELL,
    rotation: 0,
    variant: 'temple'
  };
  tiles[sanctumY + 2][sanctumX - 4].isBlocking = true;
  
  tiles[sanctumY + 2][sanctumX + 4].overlayObject = {
    type: OverlayObjectType.BELL,
    rotation: 0,
    variant: 'temple'
  };
  tiles[sanctumY + 2][sanctumX + 4].isBlocking = true;
  
  // Deepa (oil lamps) throughout
  for (let x = mandapaX + 2; x < mandapaX + mandapaSize - 2; x += 6) {
    tiles[mandapaY + 2][x].overlayObject = {
      type: OverlayObjectType.CANDELABRA,
      rotation: 0,
      variant: 'oil_lamp'
    };
  }
  
  // Pradakshina path (circumambulation)
  for (let x = sanctumX - 4; x <= sanctumX + 4; x++) {
    tiles[sanctumY - 1][x].biome = BiomeType.PATH;
    tiles[sanctumY + sanctumSize][x].biome = BiomeType.PATH;
  }
  for (let y = sanctumY; y < sanctumY + sanctumSize; y++) {
    tiles[y][sanctumX - 4].biome = BiomeType.PATH;
    tiles[y][sanctumX + 4].biome = BiomeType.PATH;
  }
  
  // Nandi statue (for Shiva temples)
  if (noise.random() > 0.5) {
    tiles[mandapaY + 4][centerX].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'nandi'
    };
    tiles[mandapaY + 4][centerX].isBlocking = true;
  }
  
  interactionZones.push({
    id: 'sanctum',
    bounds: { x: sanctumX - 3, y: sanctumY, width: sanctumSize, height: sanctumSize },
    type: 'religious',
    interactions: ['darshan', 'offering', 'pray']
  });
  
  interactionZones.push({
    id: 'fire_altar',
    bounds: { x: centerX - 2, y: mandapaY + 5, width: 5, height: 3 },
    type: 'religious',
    interactions: ['havan', 'ritual']
  });
}

/**
 * Generate Classical temple (Greek/Roman) with columns
 */
function generateClassicalTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Open plaza around temple
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  // Raised platform (stereobate) with steps
  const platformWidth = Math.min(size.width - 12, 32);
  const platformHeight = Math.min(size.height - 12, 24);
  const platformX = Math.floor((size.width - platformWidth) / 2);
  const platformY = Math.floor((size.height - platformHeight) / 2);
  
  // Three-step platform
  for (let step = 0; step < 3; step++) {
    const stepSize = 2 * (3 - step);
    fillArea(
      tiles, 
      platformX - step, 
      platformY - step, 
      platformWidth + stepSize, 
      platformHeight + stepSize, 
      BiomeType.FLOOR_MARBLE
    );
  }
  
  // Peristyle (surrounding columns) - double row for important temples
  for (let x = platformX; x < platformX + platformWidth; x += 3) {
    tiles[platformY][x].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      variant: 'corinthian'
    };
    tiles[platformY][x].isBlocking = true;
    
    tiles[platformY + platformHeight - 1][x].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      variant: 'corinthian'
    };
    tiles[platformY + platformHeight - 1][x].isBlocking = true;
  }
  
  for (let y = platformY + 3; y < platformY + platformHeight - 3; y += 3) {
    tiles[y][platformX].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      variant: 'corinthian'
    };
    tiles[y][platformX].isBlocking = true;
    
    tiles[y][platformX + platformWidth - 1].overlayObject = {
      type: OverlayObjectType.COLUMN,
      rotation: 0,
      variant: 'corinthian'
    };
    tiles[y][platformX + platformWidth - 1].isBlocking = true;
  }
  
  // Cella (inner chamber)
  const cellaWidth = platformWidth - 10;
  const cellaHeight = platformHeight - 10;
  const cellaX = platformX + 5;
  const cellaY = platformY + 5;
  
  placeWallRectangle(tiles, cellaX, cellaY, cellaWidth, cellaHeight, [
    { side: 'south', offset: Math.floor(cellaWidth / 2) }
  ]);
  fillArea(tiles, cellaX + 1, cellaY + 1, cellaWidth - 2, cellaHeight - 2, BiomeType.FLOOR_MARBLE);
  
  // Monumental cult statue
  const statueX = Math.floor(size.width / 2);
  const statueY = cellaY + 3;
  
  // Large statue base
  for (let y = statueY - 1; y <= statueY + 1; y++) {
    for (let x = statueX - 1; x <= statueX + 1; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  tiles[statueY][statueX].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    variant: 'apollo' // or zeus, athena, etc.
  };
  tiles[statueY][statueX].isBlocking = true;
  
  // Treasury room (opisthodomos)
  if (cellaHeight > 12) {
    const treasuryY = cellaY + cellaHeight - 5;
    placeWallRectangle(tiles, cellaX + 2, treasuryY, cellaWidth - 4, 3);
    tiles[treasuryY + 1][statueX].biome = BiomeType.DOOR;
    tiles[treasuryY + 1][statueX - 2].biome = BiomeType.CHEST;
    tiles[treasuryY + 1][statueX + 2].biome = BiomeType.CHEST;
  }
  
  // Altar outside temple
  const altarY = platformY + platformHeight + 4;
  const altarX = statueX;
  
  tiles[altarY][altarX].biome = BiomeType.ALTAR;
  tiles[altarY][altarX].materialSubtype = 'sacrifice';
  
  // Tripods and braziers
  tiles[altarY][altarX - 3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'tripod'
  };
  tiles[altarY][altarX - 3].isBlocking = true;
  
  tiles[altarY][altarX + 3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'tripod'
  };
  tiles[altarY][altarX + 3].isBlocking = true;
  
  // Votive offerings
  for (let x = altarX - 5; x <= altarX + 5; x += 2) {
    if (Math.abs(x - altarX) > 3) {
      tiles[altarY + 2][x].overlayObject = {
        type: OverlayObjectType.VASE,
        rotation: 0,
        variant: 'amphora'
      };
    }
  }
  
  // Sacred grove trees (if space)
  if (size.width > 50) {
    for (let i = 0; i < 6; i++) {
      const treeX = 3 + Math.floor(noise.random() * 8);
      const treeY = 3 + Math.floor(noise.random() * (size.height - 6));
      tiles[treeY][treeX].biome = BiomeType.FOREST;
      tiles[treeY][treeX].materialSubtype = 'olive';
    }
    
    for (let i = 0; i < 6; i++) {
      const treeX = size.width - 11 + Math.floor(noise.random() * 8);
      const treeY = 3 + Math.floor(noise.random() * (size.height - 6));
      tiles[treeY][treeX].biome = BiomeType.FOREST;
      tiles[treeY][treeX].materialSubtype = 'laurel';
    }
  }
  
  interactionZones.push({
    id: 'cella',
    bounds: { x: cellaX, y: cellaY, width: cellaWidth, height: cellaHeight },
    type: 'religious',
    interactions: ['worship', 'offering', 'oracle']
  });
  
  interactionZones.push({
    id: 'altar',
    bounds: { x: altarX - 5, y: altarY - 1, width: 11, height: 4 },
    type: 'religious',
    interactions: ['sacrifice', 'libation']
  });
}

/**
 * Generate other temple types...
 */
function generatePyramidTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PLAZA);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const pyramidBase = Math.min(size.width - 10, size.height - 10, 30);
  const levels = 5;
  
  // Build stepped pyramid
  for (let level = 0; level < levels; level++) {
    const levelSize = pyramidBase - (level * 4);
    if (levelSize > 0) {
      const levelX = centerX - Math.floor(levelSize / 2);
      const levelY = centerY - Math.floor(levelSize / 2);
      
      fillArea(tiles, levelX, levelY, levelSize, levelSize, BiomeType.FLOOR_STONE);
      
      // Add decorative elements on each level
      if (level === 0) {
        // Base level - stone serpent heads at corners
        tiles[levelY][levelX].overlayObject = {
          type: OverlayObjectType.STATUE,
          rotation: 0,
          variant: 'serpent'
        };
        tiles[levelY][levelX + levelSize - 1].overlayObject = {
          type: OverlayObjectType.STATUE,
          rotation: 90,
          variant: 'serpent'
        };
      }
    }
  }
  
  // Central stairway
  for (let y = centerY + pyramidBase/2; y >= centerY - levels * 2; y--) {
    tiles[y][centerX].biome = BiomeType.STAIRS_UP;
    tiles[y][centerX - 1].biome = BiomeType.STAIRS_UP;
    tiles[y][centerX + 1].biome = BiomeType.STAIRS_UP;
  }
  
  // Temple at summit
  const templeSize = 7;
  const templeX = centerX - 3;
  const templeY = centerY - levels * 2 - 2;
  
  placeWallRectangle(tiles, templeX, templeY, templeSize, templeSize);
  fillArea(tiles, templeX + 1, templeY + 1, templeSize - 2, templeSize - 2, BiomeType.FLOOR_STONE);
  
  // Sacrificial altar
  tiles[templeY + 3][centerX].biome = BiomeType.ALTAR;
  tiles[templeY + 3][centerX].materialSubtype = 'obsidian';
  tiles[templeY + 3][centerX].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0,
    variant: 'sacrificial'
  };
  
  // Jade masks and gold ornaments
  tiles[templeY + 2][centerX - 2].overlayObject = {
    type: OverlayObjectType.IDOL,
    rotation: 0,
    variant: 'jade_mask'
  };
  tiles[templeY + 2][centerX + 2].overlayObject = {
    type: OverlayObjectType.IDOL,
    rotation: 0,
    variant: 'gold_disk'
  };
  
  // Braziers at pyramid corners
  const brazierPositions = [
    [centerY - pyramidBase/2 + 1, centerX - pyramidBase/2 + 1],
    [centerY - pyramidBase/2 + 1, centerX + pyramidBase/2 - 1],
    [centerY + pyramidBase/2 - 1, centerX - pyramidBase/2 + 1],
    [centerY + pyramidBase/2 - 1, centerX + pyramidBase/2 - 1]
  ];
  
  brazierPositions.forEach(([y, x]) => {
    tiles[y][x].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'ceremonial'
    };
    tiles[y][x].isBlocking = true;
  });
  
  interactionZones.push({
    id: 'temple_summit',
    bounds: { x: templeX, y: templeY, width: templeSize, height: templeSize },
    type: 'religious',
    interactions: ['ritual', 'sacrifice', 'astronomy']
  });
}

function generateAfricanShrine(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Natural ground
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.SAVANNA);
  
  const centerX = Math.floor(size.width / 2);
  const shrineY = Math.floor(size.height / 3);
  
  // Sacred grove in semicircle
  const groveRadius = 10;
  for (let angle = 0; angle < Math.PI; angle += 0.3) {
    const x = Math.floor(centerX + Math.cos(angle) * groveRadius);
    const y = Math.floor(shrineY + Math.sin(angle) * groveRadius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      if (noise.random() > 0.3) {
        tiles[y][x].biome = BiomeType.FOREST;
        tiles[y][x].materialSubtype = 'baobab';
      }
    }
  }
  
  // Central ancestor shrine
  tiles[shrineY][centerX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0,
    variant: 'ancestor'
  };
  tiles[shrineY][centerX].isBlocking = true;
  
  // Circle of stones
  const stoneRadius = 7;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
    const x = Math.floor(centerX + Math.cos(angle) * stoneRadius);
    const y = Math.floor(shrineY + Math.sin(angle) * stoneRadius);
    if (x > 0 && x < size.width && y > 0 && y < size.height) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.STATUE,
        rotation: 0,
        variant: 'standing_stone'
      };
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Fire pits for ceremonies
  tiles[shrineY][centerX - 4].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0
  };
  tiles[shrineY][centerX + 4].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0
  };
  
  // Drum circle area
  const drumY = shrineY + 10;
  for (let x = centerX - 5; x <= centerX + 5; x += 2) {
    tiles[drumY][x].overlayObject = {
      type: OverlayObjectType.STOOL,
      rotation: 0,
      variant: 'drum'
    };
  }
  
  // Offering baskets
  tiles[shrineY + 2][centerX - 2].overlayObject = {
    type: OverlayObjectType.CRATE,
    rotation: 0,
    variant: 'basket'
  };
  tiles[shrineY + 2][centerX + 2].overlayObject = {
    type: OverlayObjectType.CRATE,
    rotation: 0,
    variant: 'basket'
  };
  
  interactionZones.push({
    id: 'ritual_circle',
    bounds: { x: centerX - stoneRadius - 1, y: shrineY - stoneRadius - 1, width: stoneRadius * 2 + 2, height: stoneRadius * 2 + 2 },
    type: 'religious',
    interactions: ['ritual', 'dance', 'drums', 'offering']
  });
}

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
  
  const centerX = Math.floor(size.width / 2);
  
  // Modern auditorium-style seating
  for (let y = size.height - 10; y > 8; y -= 2) {
    for (let x = 4; x < size.width - 4; x++) {
      if (Math.abs(x - centerX) > 1) { // Leave center aisle
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  }
  
  // Stage area
  for (let y = 3; y <= 6; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  // Modern pulpit/lectern
  tiles[5][centerX].overlayObject = {
    type: OverlayObjectType.LECTERN,
    rotation: 0
  };
  tiles[5][centerX].isBlocking = true;
  
  // Musical instruments area
  tiles[5][centerX - 5].overlayObject = {
    type: OverlayObjectType.STOOL,
    rotation: 0,
    variant: 'piano'
  };
  tiles[5][centerX + 5].overlayObject = {
    type: OverlayObjectType.STOOL,
    rotation: 0,
    variant: 'organ'
  };
  
  // Modern lighting
  for (let x = 8; x < size.width - 8; x += 8) {
    tiles[2][x].overlayObject = {
      type: OverlayObjectType.CHANDELIER,
      rotation: 0,
      variant: 'modern'
    };
  }
  
  interactionZones.push({
    id: 'congregation',
    bounds: { x: 3, y: 8, width: size.width - 6, height: size.height - 18 },
    type: 'religious',
    interactions: ['worship', 'sermon', 'music']
  });
}

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
  
  // Central shrine with overlay
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Offering tables
  tiles[centerY + 3][centerX - 2].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  tiles[centerY + 3][centerX + 2].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0
  };
  
  // Candles/incense
  for (let x = centerX - 4; x <= centerX + 4; x += 2) {
    if (x !== centerX) {
      tiles[centerY + 1][x].overlayObject = {
        type: OverlayObjectType.CANDELABRA,
        rotation: 0
      };
    }
  }
  
  // Prayer cushions
  for (let y = centerY + 5; y < size.height - 3; y += 2) {
    for (let x = centerX - 3; x <= centerX + 3; x += 2) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0
      };
    }
  }
  
  interactionZones.push({
    id: 'shrine',
    bounds: { x: centerX - 5, y: centerY - 2, width: 11, height: 10 },
    type: 'religious',
    interactions: ['pray', 'offering', 'meditate']
  });
}