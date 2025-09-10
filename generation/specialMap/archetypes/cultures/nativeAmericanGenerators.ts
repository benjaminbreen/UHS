/**
 * generation/specialMap/archetypes/cultures/nativeAmericanGenerators.ts
 * Culture-specific generators for Native American special maps
 * Includes sacred sites, council grounds, and other culturally appropriate structures
 */

import { Tile, BiomeType, HistoricalEra } from '../../../../types';
import { OverlayObjectType } from '../../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../../../types/specialMapTypes';
import { ValueNoise } from '../../../../utils/noise';
import { fillArea } from '../../mapLayoutUtils';
import { createRoom } from '../../types/roomHelpers';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';

/**
 * Generate a Native American medicine wheel sacred site
 */
export function generateNativeAmericanSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  console.log(`[NativeGen] Generating Native American sacred site for era ${config.era}`);
  
  // Determine specific type based on region and era
  if (config.region?.includes('plains') || config.region?.includes('prairie')) {
    generateMedicineWheel(tiles, size, centerX, centerY, config, interactionZones, rooms);
  } else if (config.region?.includes('southwest') || config.era === HistoricalEra.MEDIEVAL) {
    generateKiva(tiles, size, centerX, centerY, config, interactionZones, rooms);
  } else if (config.region?.includes('mound') || config.era === HistoricalEra.ANTIQUITY) {
    generateSacredMound(tiles, size, centerX, centerY, config, interactionZones, rooms);
  } else {
    // Default to medicine wheel for most eras
    generateMedicineWheel(tiles, size, centerX, centerY, config, interactionZones, rooms);
  }
}

/**
 * Medicine Wheel - Plains tribes sacred circle
 */
function generateMedicineWheel(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Medicine Wheel sacred site`);
  
  // Natural ground
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.GRASSLAND);
  
  const radius = Math.min(7, Math.floor(Math.min(size.width, size.height) / 3));
  
  // Create stone circle
  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(centerX + radius * Math.cos(rad));
    const y = Math.round(centerY + radius * Math.sin(rad));
    
    if (tiles[y]?.[x]) {
      tiles[y][x].biome = BiomeType.ROCK;
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.ROCK,
        rotation: 0,
        variant: 'sacred_stone'
      };
    }
  }
  
  // Create spokes to cardinal directions
  const directions = [
    { dx: 0, dy: -1, name: 'North', color: 'white' },
    { dx: 1, dy: 0, name: 'East', color: 'yellow' },
    { dx: 0, dy: 1, name: 'South', color: 'red' },
    { dx: -1, dy: 0, name: 'West', color: 'black' }
  ];
  
  for (const dir of directions) {
    // Create stone line from center to edge
    for (let i = 1; i < radius; i++) {
      const x = centerX + dir.dx * i;
      const y = centerY + dir.dy * i;
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.DIRT_PATH;
        tiles[y][x].materialSubtype = 'stone_path';
      }
    }
    
    // Place directional altar
    const altarX = centerX + dir.dx * (radius - 1);
    const altarY = centerY + dir.dy * (radius - 1);
    if (tiles[altarY]?.[altarX]) {
      tiles[altarY][altarX].overlayObject = {
        type: OverlayObjectType.ALTAR,
        rotation: 0,
        variant: `${dir.color}_stone`
      };
      
      interactionZones.push({
        id: `altar_${dir.name.toLowerCase()}`,
        bounds: { x: altarX, y: altarY, width: 1, height: 1 },
        type: 'altar',
        interactions: ['pray', 'offer', 'meditate']
      });
    }
  }
  
  // Central sacred fire pit
  tiles[centerY][centerX].biome = BiomeType.FLOOR_DIRT;
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'sacred_fire'
  };
  
  interactionZones.push({
    id: 'sacred_fire',
    bounds: { x: centerX, y: centerY, width: 1, height: 1 },
    type: 'fire',
    interactions: ['tend_fire', 'add_offering', 'receive_vision']
  });
  
  // Buffalo skulls or totems at sub-cardinal points
  const subCardinal = [
    { x: centerX + 5, y: centerY + 5 },
    { x: centerX + 5, y: centerY - 5 },
    { x: centerX - 5, y: centerY + 5 },
    { x: centerX - 5, y: centerY - 5 }
  ];
  
  for (const pos of subCardinal) {
    if (tiles[pos.y]?.[pos.x]) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.TOTEM,
        rotation: 0,
        variant: 'buffalo_skull'
      };
    }
  }
  
  // Define sacred circle room for NPCs
  rooms.push(createRoom(
    'medicine_wheel',
    'Medicine Wheel Circle',
    centerX - radius - 2,
    centerY - radius - 2,
    radius * 2 + 4,
    radius * 2 + 4,
    'sanctuary',
    'normal'
  ));
}

/**
 * Kiva - Southwestern ceremonial chamber
 */
function generateKiva(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Kiva ceremonial chamber`);
  
  // Adobe/sandstone floor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.SANDSTONE);
  
  const radius = Math.min(6, Math.floor(Math.min(size.width, size.height) / 3));
  
  // Create circular sunken chamber
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (dist <= radius) {
        if (Math.abs(dist - radius) < 1) {
          // Circular wall
          tiles[y][x].biome = BiomeType.WALL;
          tiles[y][x].materialSubtype = 'adobe';
          tiles[y][x].isBlocking = true;
        } else if (dist < radius - 2) {
          // Sunken floor
          tiles[y][x].biome = BiomeType.FLOOR_EARTH;
          tiles[y][x].altitude = -1; // Sunken
        } else {
          // Bench area
          tiles[y][x].biome = BiomeType.STONE;
          tiles[y][x].overlayObject = {
            type: OverlayObjectType.BENCH,
            rotation: 0,
            variant: 'stone_bench'
          };
        }
      }
    }
  }
  
  // Sipapu (ceremonial hole) at center
  tiles[centerY][centerX].biome = BiomeType.FLOOR_EARTH;
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.WELL,
    rotation: 0,
    variant: 'sipapu'
  };
  
  interactionZones.push({
    id: 'sipapu',
    bounds: { x: centerX, y: centerY, width: 1, height: 1 },
    type: 'spiritual',
    interactions: ['pray', 'commune_with_ancestors']
  });
  
  // Fire pit offset from center
  tiles[centerY][centerX - 2].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'ceremonial'
  };
  
  // Ladder entrance from above
  tiles[centerY - radius + 1][centerX].biome = BiomeType.DOOR;
  tiles[centerY - radius + 1][centerX].overlayObject = {
    type: OverlayObjectType.LADDER,
    rotation: 0
  };
  
  // Altar niche
  tiles[centerY + radius - 2][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    variant: 'kachina_shrine'
  };
  
  // Define kiva room
  rooms.push(createRoom(
    'kiva',
    'Sacred Kiva',
    centerX - radius,
    centerY - radius,
    radius * 2,
    radius * 2,
    'sanctuary',
    'sparse' // Sacred space, fewer NPCs
  ));
}

/**
 * Sacred Mound - Mississippian/Woodland platform mound
 */
function generateSacredMound(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Sacred Platform Mound`);
  
  // Grass base
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.GRASSLAND);
  
  // Create tiered mound
  const tier1Width = Math.min(14, size.width - 4);
  const tier1Height = Math.min(12, size.height - 4);
  const tier2Width = tier1Width - 4;
  const tier2Height = tier1Height - 4;
  
  // First tier - packed earth
  fillArea(
    tiles,
    centerX - Math.floor(tier1Width / 2),
    centerY - Math.floor(tier1Height / 2),
    tier1Width,
    tier1Height,
    BiomeType.DIRT
  );
  
  // Second tier - ceremonial platform
  fillArea(
    tiles,
    centerX - Math.floor(tier2Width / 2),
    centerY - Math.floor(tier2Height / 2),
    tier2Width,
    tier2Height,
    BiomeType.FLOOR_EARTH
  );
  
  // Temple structure on top
  const templeWidth = 6;
  const templeHeight = 4;
  const templeX = centerX - 3;
  const templeY = centerY - 2;
  
  // Temple posts (using pillars)
  tiles[templeY][templeX].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0, variant: 'wood_post' };
  tiles[templeY][templeX + templeWidth - 1].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0, variant: 'wood_post' };
  tiles[templeY + templeHeight - 1][templeX].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0, variant: 'wood_post' };
  tiles[templeY + templeHeight - 1][templeX + templeWidth - 1].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0, variant: 'wood_post' };
  
  // Sacred fire at center
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'eternal_flame'
  };
  
  // Chief's seat
  tiles[templeY + 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'chief_seat'
  };
  
  // Ceremonial objects
  tiles[centerY][centerX - 2].overlayObject = { type: OverlayObjectType.DRUM, rotation: 0 };
  tiles[centerY][centerX + 2].overlayObject = { type: OverlayObjectType.DRUM, rotation: 0 };
  
  // Stairs/ramp up the mound (represented as paths)
  for (let i = 0; i < 4; i++) {
    const y = centerY + Math.floor(tier1Height / 2) + i;
    if (tiles[y]?.[centerX]) {
      tiles[y][centerX].biome = BiomeType.DIRT_PATH;
    }
  }
  
  interactionZones.push({
    id: 'eternal_flame',
    bounds: { x: centerX, y: centerY, width: 1, height: 1 },
    type: 'fire',
    interactions: ['maintain_fire', 'offer_tobacco', 'seek_guidance']
  });
  
  // Define mound temple room
  rooms.push(createRoom(
    'mound_temple',
    'Temple Mound',
    centerX - Math.floor(tier2Width / 2),
    centerY - Math.floor(tier2Height / 2),
    tier2Width,
    tier2Height,
    'sanctuary',
    'normal'
  ));
}

/**
 * Generate a Native American tribal council ground
 */
export function generateNativeAmericanCouncil(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  console.log(`[NativeGen] Generating Native American council ground`);
  
  // Determine type based on region
  if (config.region?.includes('woodland') || config.region?.includes('northeast')) {
    generateLonghouse(tiles, size, centerX, centerY, config, interactionZones, rooms);
  } else if (config.region?.includes('pacific') || config.region?.includes('northwest')) {
    generatePlankhouseCouncil(tiles, size, centerX, centerY, config, interactionZones, rooms);
  } else {
    // Default to open council circle
    generateCouncilCircle(tiles, size, centerX, centerY, config, interactionZones, rooms);
  }
}

/**
 * Council Circle - Open air gathering
 */
function generateCouncilCircle(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Council Circle`);
  
  // Natural ground
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.GRASSLAND);
  
  const radius = Math.min(6, Math.floor(Math.min(size.width, size.height) / 3));
  
  // Circle of packed earth
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (dist <= radius && dist >= radius - 1) {
        tiles[y][x].biome = BiomeType.DIRT_PATH;
      } else if (dist < radius) {
        tiles[y][x].biome = BiomeType.FLOOR_DIRT;
      }
    }
  }
  
  // Central council fire
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'council_fire'
  };
  
  // Log seats in circle
  const seatRadius = radius - 2;
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(centerX + seatRadius * Math.cos(rad));
    const y = Math.round(centerY + seatRadius * Math.sin(rad));
    
    if (tiles[y]?.[x]) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: angle + 90,
        variant: 'log_seat'
      };
    }
  }
  
  // Chief's seat (larger)
  tiles[centerY - seatRadius][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'chief_seat'
  };
  
  // Speaking staff holder
  tiles[centerY + 1][centerX + 2].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'staff_holder'
  };
  
  rooms.push(createRoom(
    'council_circle',
    'Council Circle',
    centerX - radius,
    centerY - radius,
    radius * 2,
    radius * 2,
    'council',
    'normal'
  ));
}

/**
 * Longhouse - Northeastern woodland council
 */
function generateLonghouse(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Longhouse Council`);
  
  // Forest floor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FOREST);
  
  const longWidth = Math.min(16, size.width - 4);
  const longHeight = Math.min(8, size.height - 4);
  const startX = centerX - Math.floor(longWidth / 2);
  const startY = centerY - Math.floor(longHeight / 2);
  
  // Longhouse structure
  fillArea(tiles, startX, startY, longWidth, longHeight, BiomeType.FLOOR_WOOD);
  
  // Bark walls
  for (let y = startY; y < startY + longHeight; y++) {
    for (let x = startX; x < startX + longWidth; x++) {
      if (y === startY || y === startY + longHeight - 1 || 
          x === startX || x === startX + longWidth - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'bark';
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Entrances at both ends
  tiles[centerY][startX].biome = BiomeType.DOOR;
  tiles[centerY][startX + longWidth - 1].biome = BiomeType.DOOR;
  
  // Central fire line (multiple fires)
  for (let i = 3; i < longWidth - 3; i += 4) {
    tiles[centerY][startX + i].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'hearth'
    };
  }
  
  // Sleeping platforms along sides (benches)
  for (let i = 2; i < longWidth - 2; i += 2) {
    if (tiles[startY + 1]?.[startX + i]) {
      tiles[startY + 1][startX + i].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 0,
        variant: 'sleeping_platform'
      };
    }
    if (tiles[startY + longHeight - 2]?.[startX + i]) {
      tiles[startY + longHeight - 2][startX + i].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 180,
        variant: 'sleeping_platform'
      };
    }
  }
  
  rooms.push(createRoom(
    'longhouse',
    'Longhouse',
    startX,
    startY,
    longWidth,
    longHeight,
    'hall',
    'normal'
  ));
}

/**
 * Plankhouse - Pacific Northwest council
 */
function generatePlankhouseCouncil(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  console.log(`[NativeGen] Creating Plankhouse Council`);
  
  // Beach/forest floor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.BEACH);
  
  const houseWidth = Math.min(12, size.width - 4);
  const houseHeight = Math.min(10, size.height - 4);
  const startX = centerX - Math.floor(houseWidth / 2);
  const startY = centerY - Math.floor(houseHeight / 2);
  
  // Cedar plank floor
  fillArea(tiles, startX, startY, houseWidth, houseHeight, BiomeType.FLOOR_WOOD);
  
  // Cedar plank walls
  for (let y = startY; y < startY + houseHeight; y++) {
    for (let x = startX; x < startX + houseWidth; x++) {
      if (y === startY || y === startY + houseHeight - 1 || 
          x === startX || x === startX + houseWidth - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'cedar_plank';
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Large entrance
  tiles[startY + houseHeight - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + houseHeight - 1][centerX - 1].biome = BiomeType.DOOR;
  tiles[startY + houseHeight - 1][centerX + 1].biome = BiomeType.DOOR;
  
  // Central fire pit
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'feast_fire'
  };
  
  // Totem poles
  tiles[startY + 1][centerX - 3].overlayObject = {
    type: OverlayObjectType.TOTEM_POLE,
    rotation: 0,
    variant: 'clan_totem'
  };
  tiles[startY + 1][centerX + 3].overlayObject = {
    type: OverlayObjectType.TOTEM_POLE,
    rotation: 0,
    variant: 'clan_totem'
  };
  
  // Chief's seat
  tiles[startY + 2][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'carved_seat'
  };
  
  // Storage boxes (for potlatch goods)
  tiles[startY + 1][startX + 1].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0, variant: 'bentwood_box' };
  tiles[startY + 1][startX + houseWidth - 2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0, variant: 'bentwood_box' };
  
  rooms.push(createRoom(
    'plankhouse',
    'Plankhouse',
    startX,
    startY,
    houseWidth,
    houseHeight,
    'hall',
    'normal'
  ));
}

// Register all Native American generators
registerCulturalGenerator('SACRED_COMPLEX', 'NORTH_AMERICAN_PRE_COLUMBIAN', generateNativeAmericanSacred);
registerCulturalGenerator('SACRED_COMPLEX', 'NATIVE_AMERICAN', generateNativeAmericanSacred);
registerCulturalGenerator('SACRED_COMPLEX', 'NORTH_AMERICAN_COLONIAL', generateNativeAmericanSacred);

registerCulturalGenerator('TRIBAL_COUNCIL', 'NORTH_AMERICAN_PRE_COLUMBIAN', generateNativeAmericanCouncil);
registerCulturalGenerator('TRIBAL_COUNCIL', 'NATIVE_AMERICAN', generateNativeAmericanCouncil);
registerCulturalGenerator('TRIBAL_COUNCIL', 'NORTH_AMERICAN_COLONIAL', generateNativeAmericanCouncil);

registerCulturalGenerator('GOVERNMENT_FORUM', 'NORTH_AMERICAN_PRE_COLUMBIAN', generateNativeAmericanCouncil);
registerCulturalGenerator('GOVERNMENT_FORUM', 'NATIVE_AMERICAN', generateNativeAmericanCouncil);

console.log('[NativeGen] Native American generators registered');