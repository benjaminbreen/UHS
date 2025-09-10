/**
 * generation/specialMap/archetypes/cultures/oceaniaGenerators.ts
 * Oceania architectural generators
 * Includes Polynesian, Melanesian, Micronesian, and Australian Aboriginal structures
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
 * Generate a Polynesian meeting house (fale/whare/hale)
 */
export function generatePolynesianMeetingHouse(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with packed earth floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  // Create open-air structure with posts (no walls)
  // Corner posts
  const posts = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 }
  ];

  // Add center posts for larger structures
  if (width > 12) {
    posts.push(
      { x: Math.floor(width / 2), y: 2 },
      { x: Math.floor(width / 2), y: height - 3 }
    );
  }

  for (const post of posts) {
    if (post.x >= 0 && post.x < width && post.y >= 0 && post.y < height) {
      tiles[post.y][post.x].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'wooden_post'
      };
    }
  }

  // Create raised platform area with woven mats
  const platformStart = { x: 3, y: 3 };
  const platformEnd = { x: width - 3, y: height - 3 };
  
  for (let y = platformStart.y; y < platformEnd.y; y++) {
    for (let x = platformStart.x; x < platformEnd.x; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      }
    }
  }

  // Central fire pit for cooking and ceremonies
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'stone_lined'
    };
  }

  // Tiki/totem posts at entrance
  const entranceY = height - 2;
  if (entranceY >= 0 && entranceY < height && centerX - 2 >= 0 && centerX + 2 < width) {
    tiles[entranceY][centerX - 2].overlayObject = {
      type: OverlayObjectType.TOTEM_POLE,
      rotation: 0,
      variant: 'polynesian_tiki'
    };
    tiles[entranceY][centerX + 2].overlayObject = {
      type: OverlayObjectType.TOTEM_POLE,
      rotation: 0,
      variant: 'polynesian_tiki'
    };
  }

  // Woven mats for sitting
  const matPositions = [
    { x: centerX - 3, y: centerY },
    { x: centerX + 3, y: centerY },
    { x: centerX, y: centerY - 3 },
    { x: centerX, y: centerY + 3 }
  ];

  for (const pos of matPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        variant: 'woven_mat'
      };
    }
  }

  // Storage baskets and gourds
  if (4 < height && 4 < width && width - 5 >= 0) {
    tiles[4][4].overlayObject = {
      type: OverlayObjectType.CRATE,
      rotation: 0,
      variant: 'woven_basket'
    };
    tiles[4][width - 5].overlayObject = {
      type: OverlayObjectType.BARREL,
      rotation: 0,
      variant: 'water_gourd'
    };
  }

  // Define rooms
  rooms.push({
    id: 'meeting_house',
    name: 'Fale Fono',
    bounds: { 
      x: platformStart.x, 
      y: platformStart.y, 
      width: platformEnd.x - platformStart.x, 
      height: platformEnd.y - platformStart.y 
    },
    type: 'public',
    description: 'Community meeting house'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'FIRE',
    name: 'Central Hearth',
    description: 'Communal fire for cooking and gatherings'
  });
}

/**
 * Generate a Maori marae (meeting ground with wharenui)
 */
export function generateMaoriMarae(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with grass/earth floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  // Create wharenui (meeting house) structure
  const whareWidth = Math.min(12, Math.floor(width * 0.6));
  const whareHeight = Math.min(8, Math.floor(height * 0.4));
  const whareX = Math.floor((width - whareWidth) / 2);
  const whareY = 2;

  // Wharenui walls
  for (let y = whareY; y < whareY + whareHeight; y++) {
    for (let x = whareX; x < whareX + whareWidth; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (y === whareY || y === whareY + whareHeight - 1 ||
            x === whareX || x === whareX + whareWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL_LOW;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
  }

  // Entrance
  const entranceX = Math.floor(width / 2);
  tiles[whareY + whareHeight - 1][entranceX].biome = BiomeType.DOOR;

  // Carved pou (posts) with ancestors
  const pouPositions = [
    { x: whareX + 2, y: whareY + 2 },
    { x: whareX + whareWidth - 3, y: whareY + 2 },
    { x: whareX + 2, y: whareY + whareHeight - 3 },
    { x: whareX + whareWidth - 3, y: whareY + whareHeight - 3 }
  ];

  for (const pos of pouPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'carved_ancestor'
      };
    }
  }

  // Central meeting area (marae atea) - open courtyard
  const maraeStartY = whareY + whareHeight + 2;
  const maraeEndY = Math.min(height - 2, maraeStartY + 8);
  
  for (let y = maraeStartY; y < maraeEndY; y++) {
    for (let x = 3; x < width - 3; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Paepae (threshold stones) at entrance to marae
  for (let x = whareX; x < whareX + whareWidth; x++) {
    if (x >= 0 && x < width && maraeStartY - 1 >= 0 && maraeStartY - 1 < height) {
      if ((x - whareX) % 2 === 0) {
        tiles[maraeStartY - 1][x].overlayObject = {
          type: OverlayObjectType.STONE_SLAB,
          rotation: 0,
          variant: 'threshold'
        };
      }
    }
  }

  // Define rooms
  rooms.push({
    id: 'wharenui',
    name: 'Wharenui',
    bounds: { 
      x: whareX, 
      y: whareY, 
      width: whareWidth, 
      height: whareHeight 
    },
    type: 'sacred',
    description: 'Ancestral meeting house'
  });

  rooms.push({
    id: 'marae_atea',
    name: 'Marae Atea',
    bounds: { 
      x: 3, 
      y: maraeStartY, 
      width: width - 6, 
      height: maraeEndY - maraeStartY 
    },
    type: 'public',
    description: 'Sacred courtyard for ceremonies'
  });

  // Add interaction zones
  interactionZones.push({
    x: entranceX,
    y: whareY + 2,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Ancestral Altar',
    description: 'Honor the ancestors'
  });
}

/**
 * Generate an Australian Aboriginal meeting place
 */
export function generateAboriginalMeetingPlace(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with natural ground
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  // Create circular ceremonial ground (no built structures, natural space)
  const radius = Math.min(Math.floor(width / 3), Math.floor(height / 3));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (dist <= radius) {
        // Packed earth for dancing/ceremonies
        tiles[y][x].biome = BiomeType.FLOOR_DIRT;
      }
    }
  }

  // Central fire
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'ceremonial'
    };
  }

  // Rock art/sacred stones around perimeter
  const stoneAngle = Math.PI / 4; // Every 45 degrees
  for (let angle = 0; angle < Math.PI * 2; angle += stoneAngle) {
    const stoneX = Math.floor(centerX + (radius + 1) * Math.cos(angle));
    const stoneY = Math.floor(centerY + (radius + 1) * Math.sin(angle));
    
    if (stoneX >= 0 && stoneX < width && stoneY >= 0 && stoneY < height) {
      tiles[stoneY][stoneX].overlayObject = {
        type: OverlayObjectType.STONE_SLAB,
        rotation: 0,
        variant: angle < Math.PI ? 'painted_rock' : 'sacred_stone'
      };
    }
  }

  // Message sticks storage area
  if (3 < height && 3 < width) {
    tiles[3][3].overlayObject = {
      type: OverlayObjectType.WEAPON_RACK,
      rotation: 0,
      variant: 'message_sticks'
    };
  }

  // Didgeridoo and ceremonial objects
  if (height - 4 >= 0 && width - 4 >= 0) {
    tiles[height - 4][width - 4].overlayObject = {
      type: OverlayObjectType.INSTRUMENT,
      rotation: 0,
      variant: 'didgeridoo'
    };
  }

  // Define rooms
  rooms.push({
    id: 'ceremonial_ground',
    name: 'Ceremonial Ground',
    bounds: { 
      x: centerX - radius, 
      y: centerY - radius, 
      width: radius * 2, 
      height: radius * 2 
    },
    type: 'sacred',
    description: 'Sacred ceremonial space'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'FIRE',
    name: 'Sacred Fire',
    description: 'Central ceremonial fire'
  });
}

/**
 * Generate a Melanesian men's house (haus tambaran)
 */
export function generateMelanesianMensHouse(
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

  // Create tall peaked house structure
  const houseWidth = Math.min(14, Math.floor(width * 0.7));
  const houseHeight = Math.min(10, Math.floor(height * 0.6));
  const houseX = Math.floor((width - houseWidth) / 2);
  const houseY = Math.floor((height - houseHeight) / 2);

  // House walls (woven bamboo/sago)
  for (let y = houseY; y < houseY + houseHeight; y++) {
    for (let x = houseX; x < houseX + houseWidth; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (y === houseY || y === houseY + houseHeight - 1 ||
            x === houseX || x === houseX + houseWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL_LOW;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
  }

  // Entrance (small, restricted)
  const entranceX = Math.floor(width / 2);
  tiles[houseY + houseHeight - 1][entranceX].biome = BiomeType.DOOR;

  // Spirit masks and carvings on walls
  const maskPositions = [
    { x: houseX + 2, y: houseY + 1 },
    { x: houseX + houseWidth - 3, y: houseY + 1 },
    { x: houseX + Math.floor(houseWidth / 2), y: houseY + 1 }
  ];

  for (const pos of maskPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.AFRICAN_DECORATIVE_MASK,
        rotation: 0,
        variant: 'spirit_mask'
      };
    }
  }

  // Central posts with crocodile carvings
  const centerX = Math.floor(width / 2);
  const postY = [houseY + 3, houseY + houseHeight - 4];
  
  for (const y of postY) {
    if (y >= 0 && y < height && centerX >= 0 && centerX < width) {
      tiles[y][centerX].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'crocodile_totem'
      };
    }
  }

  // Sacred flutes and drums storage
  if (houseY + 2 < height && houseX + 1 < width) {
    tiles[houseY + 2][houseX + 1].overlayObject = {
      type: OverlayObjectType.INSTRUMENT,
      rotation: 0,
      variant: 'sacred_flute'
    };
  }
  
  if (houseY + 2 < height && houseX + houseWidth - 2 >= 0 && houseX + houseWidth - 2 < width) {
    tiles[houseY + 2][houseX + houseWidth - 2].overlayObject = {
      type: OverlayObjectType.DRUM,
      rotation: 0,
      variant: 'slit_drum'
    };
  }

  // Define rooms
  rooms.push({
    id: 'haus_tambaran',
    name: 'Haus Tambaran',
    bounds: { 
      x: houseX, 
      y: houseY, 
      width: houseWidth, 
      height: houseHeight 
    },
    type: 'sacred',
    description: 'Sacred men\'s house'
  });

  // Add interaction zones
  interactionZones.push({
    x: entranceX,
    y: houseY + Math.floor(houseHeight / 2),
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Spirit Shrine',
    description: 'Sacred spirit dwelling'
  });
}

// Register all Oceania generators
registerCulturalGenerator('GOVERNMENT_FORUM', 'OCEANIA', generatePolynesianMeetingHouse);
registerCulturalGenerator('GOVERNMENT_FORUM', 'POLYNESIAN', generatePolynesianMeetingHouse);
registerCulturalGenerator('GOVERNMENT_FORUM', 'MAORI', generateMaoriMarae);
registerCulturalGenerator('GOVERNMENT_FORUM', 'ABORIGINAL', generateAboriginalMeetingPlace);
registerCulturalGenerator('GOVERNMENT_FORUM', 'MELANESIAN', generateMelanesianMensHouse);

registerCulturalGenerator('SACRED_COMPLEX', 'OCEANIA', generateMaoriMarae);
registerCulturalGenerator('SACRED_COMPLEX', 'POLYNESIAN', generatePolynesianMeetingHouse);
registerCulturalGenerator('SACRED_COMPLEX', 'ABORIGINAL', generateAboriginalMeetingPlace);
registerCulturalGenerator('SACRED_COMPLEX', 'MELANESIAN', generateMelanesianMensHouse);

registerCulturalGenerator('TRIBAL_COUNCIL', 'OCEANIA', generatePolynesianMeetingHouse);
registerCulturalGenerator('TRIBAL_COUNCIL', 'POLYNESIAN', generatePolynesianMeetingHouse);
registerCulturalGenerator('TRIBAL_COUNCIL', 'MAORI', generateMaoriMarae);
registerCulturalGenerator('TRIBAL_COUNCIL', 'ABORIGINAL', generateAboriginalMeetingPlace);

registerCulturalGenerator('PALACE_COMPLEX', 'OCEANIA', generateMaoriMarae);
registerCulturalGenerator('PALACE_COMPLEX', 'POLYNESIAN', generatePolynesianMeetingHouse);

// Export for direct use
export {
  generatePolynesianMeetingHouse as generateOceaniaGovernment,
  generateMaoriMarae as generateOceaniaSacred,
  generateAboriginalMeetingPlace as generateOceaniaCouncil,
  generateMelanesianMensHouse as generateOceaniaTemple
};