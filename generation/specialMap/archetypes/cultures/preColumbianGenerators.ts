/**
 * generation/specialMap/archetypes/cultures/preColumbianGenerators.ts
 * Pre-Columbian American architectural generators
 * Includes Aztec, Maya, Inca, and North American indigenous structures
 */

import { Tile, BiomeType } from '../../../../types';
import { 
  SpecialMapConfig, 
  InteractionZone, 
  RoomDefinition
} from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';

/**
 * Generate an Aztec temple (teocalli) with stepped pyramid
 */
export function generateAztecTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with stone floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Create stepped pyramid structure
  const maxLevel = 4;
  const baseSize = Math.min(width - 4, height - 4);
  
  for (let level = 0; level < maxLevel; level++) {
    const levelSize = baseSize - (level * 4);
    const levelStart = {
      x: centerX - Math.floor(levelSize / 2),
      y: centerY - Math.floor(levelSize / 2)
    };
    
    // Create platform for this level
    for (let y = levelStart.y; y < levelStart.y + levelSize; y++) {
      for (let x = levelStart.x; x < levelStart.x + levelSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          // Edges are walls/steps
          if (x === levelStart.x || x === levelStart.x + levelSize - 1 ||
              y === levelStart.y || y === levelStart.y + levelSize - 1) {
            tiles[y][x].interiorTileType = level % 2 === 0 ? 
              InteriorTileType.WALL : InteriorTileType.ALTAR;
          } else if (level === 0) {
            // Base level floor
            tiles[y][x].biome = BiomeType.FLOOR_STONE;
          }
        }
      }
    }
  }

  // Temple structure at top
  const templeSize = 5;
  const templeStart = {
    x: centerX - 2,
    y: centerY - 2
  };
  
  for (let y = templeStart.y; y < templeStart.y + templeSize; y++) {
    for (let x = templeStart.x; x < templeStart.x + templeSize; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (x === templeStart.x || x === templeStart.x + templeSize - 1 ||
            y === templeStart.y || y === templeStart.y + templeSize - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }

  // Sacrificial altar at center
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.ALTAR,
      rotation: 0,
      variant: 'sacrificial'
    };
  }

  // Stairs on south side
  for (let y = centerY; y < height - 1; y++) {
    if (y >= 0 && y < height && centerX >= 0 && centerX < width) {
      tiles[y][centerX].biome = BiomeType.FLOOR_STONE;
      if (centerX - 1 >= 0) tiles[y][centerX - 1].biome = BiomeType.FLOOR_STONE;
      if (centerX + 1 < width) tiles[y][centerX + 1].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Eagle and jaguar warrior statues
  const statuePositions = [
    { x: centerX - 4, y: centerY, variant: 'eagle_warrior' },
    { x: centerX + 4, y: centerY, variant: 'jaguar_warrior' },
    { x: centerX, y: centerY - 4, variant: 'feathered_serpent' },
    { x: centerX, y: centerY + 4, variant: 'sun_stone' }
  ];
  
  for (const pos of statuePositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.STATUE,
      rotation: 0,
        variant: pos.variant
      };
    }
  }

  // Braziers with copal incense
  const brazierPositions = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 }
  ];

  for (const pos of brazierPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'copal_burner'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'temple_top',
    name: 'Temple Summit',
    bounds: { 
      x: templeStart.x, 
      y: templeStart.y, 
      width: templeSize, 
      height: templeSize 
    },
    type: 'sacred',
    description: 'Sacred temple at pyramid summit'
  });

  rooms.push({
    id: 'pyramid_base',
    name: 'Temple Plaza',
    bounds: { 
      x: 1, 
      y: 1, 
      width: width - 2, 
      height: height - 2 
    },
    type: 'public',
    description: 'Ceremonial plaza around pyramid'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'ALTAR',
    name: 'Sacred Altar',
    description: 'Altar to the gods'
  });
}

/**
 * Generate a Maya palace complex
 */
export function generateMayaPalace(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with stone floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Create outer walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[height - 1][x].biome = BiomeType.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][width - 1].biome = BiomeType.WALL;
  }

  // Corbel arch entrance
  const entranceX = Math.floor(width / 2);
  tiles[height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX - 1].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX + 1].biome = BiomeType.DOOR;

  // Throne room with raised platform
  const throneY = 3;
  const throneX = entranceX;
  const platformWidth = 9;
  const platformDepth = 5;
  
  // Raised platform
  const platformStart = {
    x: throneX - 4,
    y: throneY
  };
  
  for (let y = platformStart.y; y < platformStart.y + platformDepth; y++) {
    for (let x = platformStart.x; x < platformStart.x + platformWidth; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Jade throne
  if (throneY + 2 < height && throneX < width) {
    tiles[throneY + 2][throneX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 0,
      variant: 'jade'
    };
  }

  // Stelae with hieroglyphs
  const stelaePositions = [
    { x: 3, y: Math.floor(height / 2) },
    { x: width - 4, y: Math.floor(height / 2) }
  ];
  
  for (const pos of stelaePositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.STELA,
      rotation: 0,
        variant: 'hieroglyphic'
      };
    }
  }

  // Carved pillars
  for (let y = 8; y < height - 8; y += 4) {
    for (let x = 5; x < width - 5; x += 4) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          variant: 'maya_carved'
        };
      }
    }
  }

  // Ball court markers (if space allows)
  const courtY = Math.floor(height * 0.7);
  if (courtY >= 0 && courtY < height && entranceX - 3 >= 0 && entranceX + 3 < width) {
    tiles[courtY][entranceX - 3].overlayObject = {
      type: OverlayObjectType.RING_STONE,
      rotation: 0,
      variant: 'ball_court'
    };
    tiles[courtY][entranceX + 3].overlayObject = {
      type: OverlayObjectType.RING_STONE,
      rotation: 0,
      variant: 'ball_court'
    };
  }

  // Cacao storage vessels
  if (height - 3 >= 0 && 2 < width && width - 3 < width) {
    tiles[height - 3][2].overlayObject = {
      type: OverlayObjectType.CRATE,
      rotation: 0,
      variant: 'cacao'
    };
    tiles[height - 3][width - 3].overlayObject = {
      type: OverlayObjectType.CRATE,
      rotation: 0,
      variant: 'cacao'
    };
  }

  // Define rooms
  rooms.push({
    id: 'throne_room',
    name: 'Royal Chamber',
    bounds: { 
      x: platformStart.x, 
      y: platformStart.y, 
      width: platformWidth, 
      height: platformDepth 
    },
    type: 'throne',
    description: 'Ajaw\'s throne room'
  });

  rooms.push({
    id: 'court_area',
    name: 'Palace Court',
    bounds: { 
      x: 2, 
      y: platformStart.y + platformDepth + 1, 
      width: width - 4, 
      height: height - platformStart.y - platformDepth - 3 
    },
    type: 'public',
    description: 'Ceremonial court'
  });

  // Add interaction zones
  interactionZones.push({
    x: throneX,
    y: throneY + 2,
    width: 1,
    height: 1,
    type: 'THRONE',
    name: 'Jade Throne',
    description: 'Seat of the Ajaw'
  });
}

/**
 * Generate an Inca administrative center (kallanka)
 */
export function generateIncaKallanka(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with stone floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Create outer walls with Inca polygonal masonry style
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[height - 1][x].biome = BiomeType.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][width - 1].biome = BiomeType.WALL;
  }

  // Trapezoidal doorways (characteristic of Inca architecture)
  const entranceX = Math.floor(width / 2);
  tiles[height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[0][entranceX].biome = BiomeType.DOOR;
  
  // Side entrances
  const sideY = Math.floor(height / 2);
  tiles[sideY][0].biome = BiomeType.DOOR;
  tiles[sideY][width - 1].biome = BiomeType.DOOR;

  // Central open hall (kallanka were large open halls)
  // No interior walls, just support columns
  
  // Wooden support columns
  for (let y = 4; y < height - 4; y += 4) {
    for (let x = 4; x < width - 4; x += 4) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          variant: 'wooden_post'
        };
      }
    }
  }

  // Niches in walls for idols and storage
  const nichePositions = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 },
    { x: Math.floor(width / 2), y: 2 }
  ];
  
  for (const pos of nichePositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.NICHE,
      rotation: 0,
        variant: 'trapezoidal'
      };
    }
  }

  // Quipu (record keeping device) storage area
  if (3 < height && 3 < width) {
    tiles[3][3].overlayObject = {
      type: OverlayObjectType.QUIPU_RACK,
      rotation: 0,
      variant: 'administrative'
    };
  }

  // Llama wool textile storage
  if (3 < height && width - 4 >= 0 && width - 4 < width) {
    tiles[3][width - 4].overlayObject = {
      type: OverlayObjectType.CRATE,
      rotation: 0,
      variant: 'textiles'
    };
  }

  // Central ceremonial area with offerings
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.ALTAR,
      rotation: 0,
      variant: 'offerings'
    };
  }

  // Chicha (corn beer) vessels
  const chichaPositions = [
    { x: centerX - 3, y: centerY },
    { x: centerX + 3, y: centerY }
  ];
  
  for (const pos of chichaPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BARREL,
      rotation: 0,
        variant: 'chicha'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'main_hall',
    name: 'Kallanka Hall',
    bounds: { 
      x: 1, 
      y: 1, 
      width: width - 2, 
      height: height - 2 
    },
    type: 'public',
    description: 'Large administrative hall'
  });

  // Add interaction zones
  interactionZones.push({
    x: 3,
    y: 3,
    width: 1,
    height: 1,
    type: 'RECORDS',
    name: 'Quipu Records',
    description: 'Administrative records'
  });

  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'ALTAR',
    name: 'Offering Table',
    description: 'Ceremonial offerings'
  });
}

/**
 * Generate a Pueblo/Anasazi kiva (ceremonial chamber)
 */
export function generatePuebloKiva(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with dirt floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = Math.min(Math.floor(width / 3), Math.floor(height / 3));

  // Create circular kiva structure
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (dist <= radius + 0.5 && dist >= radius - 0.5) {
        // Circular wall
        tiles[y][x].biome = BiomeType.WALL;
      } else if (dist < radius - 0.5) {
        // Interior floor
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Entrance ladder (represented as opening)
  if (centerY - radius >= 0 && centerY - radius < height && centerX < width) {
    tiles[centerY - radius][centerX].biome = BiomeType.DOOR;
  }

  // Central fire pit
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'ceremonial'
    };
  }

  // Sipapu (symbolic entrance to underworld) - small hole near center
  if (centerY + 2 < height && centerX < width) {
    tiles[centerY + 2][centerX].overlayObject = {
      type: OverlayObjectType.SACRED_HOLE,
      rotation: 0,
      variant: 'sipapu'
    };
  }

  // Deflector stone between fire and sipapu
  if (centerY + 1 < height && centerX < width) {
    tiles[centerY + 1][centerX].overlayObject = {
      type: OverlayObjectType.STONE_SLAB,
      rotation: 0,
      variant: 'deflector'
    };
  }

  // Bench around perimeter
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const benchX = Math.floor(centerX + (radius - 2) * Math.cos(angle));
    const benchY = Math.floor(centerY + (radius - 2) * Math.sin(angle));
    
    if (benchX >= 0 && benchX < width && benchY >= 0 && benchY < height) {
      if (tiles[benchY][benchX].biome === BiomeType.FLOOR_STONE) {
        tiles[benchY][benchX].overlayObject = {
          type: OverlayObjectType.BENCH,
      rotation: 0,
          variant: 'stone'
        };
      }
    }
  }

  // Kachina figures and ceremonial items
  const ceremonialPositions = [
    { x: centerX - 3, y: centerY - 3, variant: 'kachina' },
    { x: centerX + 3, y: centerY - 3, variant: 'kachina' },
    { x: centerX - 3, y: centerY + 3, variant: 'pottery' },
    { x: centerX + 3, y: centerY + 3, variant: 'pottery' }
  ];
  
  for (const pos of ceremonialPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      const dist = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
      if (dist < radius - 1) {
        tiles[pos.y][pos.x].overlayObject = {
          type: pos.variant === 'kachina' ? OverlayObjectType.STATUE : OverlayObjectType.CRATE,
          variant: pos.variant
        };
      }
    }
  }

  // Define rooms
  rooms.push({
    id: 'kiva',
    name: 'Ceremonial Kiva',
    bounds: { 
      x: centerX - radius, 
      y: centerY - radius, 
      width: radius * 2, 
      height: radius * 2 
    },
    type: 'sacred',
    description: 'Underground ceremonial chamber'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'FIRE',
    name: 'Sacred Fire',
    description: 'Ceremonial fire pit'
  });

  interactionZones.push({
    x: centerX,
    y: centerY + 2,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Sipapu',
    description: 'Portal to the underworld'
  });
}

// Register all Pre-Columbian generators
registerCulturalGenerator('SACRED_COMPLEX', 'AZTEC', generateAztecTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'MAYA', generateAztecTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'INCA', generateIncaKallanka);
registerCulturalGenerator('SACRED_COMPLEX', 'PUEBLO', generatePuebloKiva);
registerCulturalGenerator('SACRED_COMPLEX', 'PRE_COLUMBIAN', generateAztecTemple);

registerCulturalGenerator('PALACE_COMPLEX', 'MAYA', generateMayaPalace);
registerCulturalGenerator('PALACE_COMPLEX', 'AZTEC', generateAztecTemple);
registerCulturalGenerator('PALACE_COMPLEX', 'PRE_COLUMBIAN', generateMayaPalace);

registerCulturalGenerator('GOVERNMENT_FORUM', 'INCA', generateIncaKallanka);
registerCulturalGenerator('GOVERNMENT_FORUM', 'AZTEC', generateAztecTemple);
registerCulturalGenerator('GOVERNMENT_FORUM', 'PRE_COLUMBIAN', generateIncaKallanka);

registerCulturalGenerator('TRIBAL_COUNCIL', 'PUEBLO', generatePuebloKiva);
registerCulturalGenerator('TRIBAL_COUNCIL', 'PRE_COLUMBIAN', generatePuebloKiva);

// Register South American to use Inca/Andean styles
registerCulturalGenerator('SACRED_COMPLEX', 'SOUTH_AMERICAN', generateIncaKallanka);
registerCulturalGenerator('PALACE_COMPLEX', 'SOUTH_AMERICAN', generateIncaKallanka);
registerCulturalGenerator('GOVERNMENT_FORUM', 'SOUTH_AMERICAN', generateIncaKallanka);
registerCulturalGenerator('TRIBAL_COUNCIL', 'SOUTH_AMERICAN', generateIncaKallanka);

// Export for direct use
export {
  generateAztecTemple as generatePreColumbianSacred,
  generateMayaPalace as generatePreColumbianPalace,
  generateIncaKallanka as generatePreColumbianGovernment,
  generatePuebloKiva as generatePreColumbianCouncil
};