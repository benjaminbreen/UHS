/**
 * generation/specialMap/archetypes/cultures/africanGenerators.ts
 * Cultural generators for Sub-Saharan African special maps
 * Includes various African architectural styles (round huts, compounds, meeting places)
 */

import { Tile, BiomeType } from '../../../../types';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';
import { createRoom } from '../../types/roomHelpers';

/**
 * African Sacred Complex - Ancestor shrine with round huts
 */
export function generateAfricanSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create packed earth ground
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_DIRT;
      tiles[y][x].materialSubtype = 'packed_earth';
    }
  }
  
  // Main shrine hut (circular)
  const shrineRadius = Math.min(4, Math.floor(Math.min(size.width, size.height) / 4));
  
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (dist <= shrineRadius) {
        if (Math.abs(dist - shrineRadius) < 1) {
          // Mud walls
          tiles[y][x].biome = BiomeType.WALL_LOW;
          tiles[y][x].materialSubtype = 'mud_brick';
        } else {
          // Interior floor
          tiles[y][x].biome = BiomeType.FLOOR_DIRT;
          tiles[y][x].materialSubtype = 'smooth_clay';
        }
      }
    }
  }
  
  // Central altar/shrine
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    variant: 'ancestor_shrine'
  };
  
  // Carved totems around shrine
  const totemPositions = [
    [centerX - 2, centerY - 2],
    [centerX + 2, centerY - 2],
    [centerX - 2, centerY + 2],
    [centerX + 2, centerY + 2]
  ];
  
  for (const [tx, ty] of totemPositions) {
    if (tx >= 0 && tx < size.width && ty >= 0 && ty < size.height &&
        tiles[ty][tx].biome === BiomeType.FLOOR_DIRT) {
      tiles[ty][tx].overlayObject = {
        type: OverlayObjectType.STATUE,
        rotation: 0,
        variant: 'ancestor_figure'
      };
    }
  }
  
  // Sacred drums
  if (centerY + shrineRadius + 2 < size.height) {
    tiles[centerY + shrineRadius + 2][centerX - 1].overlayObject = {
      type: OverlayObjectType.DRUM,
      rotation: 0,
      variant: 'djembe'
    };
    tiles[centerY + shrineRadius + 2][centerX + 1].overlayObject = {
      type: OverlayObjectType.DRUM,
      rotation: 0,
      variant: 'talking_drum'
    };
  }
  
  // Decorative masks on walls
  tiles[centerY - shrineRadius + 1][centerX].overlayObject = {
    type: OverlayObjectType.AFRICAN_DECORATIVE_MASK,
    rotation: 0,
    variant: 'ceremonial'
  };
  
  // Fire pit outside
  if (centerY + shrineRadius + 4 < size.height) {
    tiles[centerY + shrineRadius + 4][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'ritual_fire'
    };
  }
  
  // Entrance gap in circle
  tiles[centerY + shrineRadius][centerX].biome = BiomeType.DIRT_PATH;
  
  // Secondary huts (smaller)
  const hutPositions = [
    [5, 5, 2], [size.width - 6, 5, 2],
    [5, size.height - 6, 2], [size.width - 6, size.height - 6, 2]
  ];
  
  for (const [hutX, hutY, hutRadius] of hutPositions) {
    if (hutX - hutRadius >= 0 && hutX + hutRadius < size.width &&
        hutY - hutRadius >= 0 && hutY + hutRadius < size.height) {
      for (let y = hutY - hutRadius; y <= hutY + hutRadius; y++) {
        for (let x = hutX - hutRadius; x <= hutX + hutRadius; x++) {
          const dist = Math.sqrt(Math.pow(x - hutX, 2) + Math.pow(y - hutY, 2));
          if (Math.abs(dist - hutRadius) < 1) {
            tiles[y][x].biome = BiomeType.WALL_LOW;
            tiles[y][x].materialSubtype = 'thatch';
          } else if (dist < hutRadius) {
            tiles[y][x].biome = BiomeType.FLOOR_DIRT;
            tiles[y][x].materialSubtype = 'packed_earth';
          }
        }
      }
      // Entrance
      tiles[hutY + hutRadius][hutX].biome = BiomeType.DIRT_PATH;
    }
  }
  
  // Define rooms
  rooms.push(createRoom(
    'main_shrine',
    'Ancestor Shrine',
    centerX - shrineRadius,
    centerY - shrineRadius,
    shrineRadius * 2,
    shrineRadius * 2,
    'sanctuary',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'sacred_grounds',
    'Sacred Grounds',
    0,
    0,
    size.width,
    size.height,
    'courtyard',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'ancestor_shrine',
    location: [centerX, centerY],
    label: 'Ancestor Shrine',
    action: 'honor',
    description: 'A sacred shrine to honor the ancestors'
  });
  
  interactionZones.push({
    id: 'ritual_drums',
    location: [centerX, centerY + shrineRadius + 2],
    label: 'Sacred Drums',
    action: 'play',
    description: 'Ceremonial drums used in rituals'
  });
}

/**
 * African Government/Council - Chief's compound with meeting area
 */
export function generateAfricanGovernment(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create compound with fence perimeter
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (y === 1 || y === size.height - 2 || x === 1 || x === size.width - 2) {
        // Wooden fence
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'wooden_fence';
      } else {
        // Packed earth
        tiles[y][x].biome = BiomeType.FLOOR_DIRT;
        tiles[y][x].materialSubtype = 'packed_earth';
      }
    }
  }
  
  // Chief's large hut (rectangular)
  const chiefHutWidth = Math.min(10, size.width - 8);
  const chiefHutHeight = Math.min(6, size.height - 10);
  const chiefHutX = centerX - Math.floor(chiefHutWidth / 2);
  const chiefHutY = 3;
  
  for (let y = chiefHutY; y < chiefHutY + chiefHutHeight; y++) {
    for (let x = chiefHutX; x < chiefHutX + chiefHutWidth; x++) {
      if (y === chiefHutY || y === chiefHutY + chiefHutHeight - 1 ||
          x === chiefHutX || x === chiefHutX + chiefHutWidth - 1) {
        // Mud brick walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'decorated_mud';
      } else {
        // Floor with rugs
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'clay_tiles';
      }
    }
  }
  
  // Chief's throne/stool
  tiles[chiefHutY + 2][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: 'chief_stool'
  };
  
  // Ceremonial weapons
  tiles[chiefHutY + 1][chiefHutX + 1].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'spears'
  };
  tiles[chiefHutY + 1][chiefHutX + chiefHutWidth - 2].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'shields'
  };
  
  // Meeting circle with logs/stones
  const meetingY = centerY + 2;
  const meetingRadius = 3;
  
  for (let angle = 0; angle < 360; angle += 45) {
    const radians = (angle * Math.PI) / 180;
    const seatX = Math.round(centerX + meetingRadius * Math.cos(radians));
    const seatY = Math.round(meetingY + meetingRadius * Math.sin(radians));
    
    if (seatX >= 0 && seatX < size.width && seatY >= 0 && seatY < size.height) {
      tiles[seatY][seatX].overlayObject = {
        type: OverlayObjectType.ROCK,
        rotation: 0,
        variant: 'seat_stone'
      };
    }
  }
  
  // Central fire pit
  tiles[meetingY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    rotation: 0,
    variant: 'council_fire'
  };
  
  // Storage huts on sides
  const storagePositions = [[4, centerY], [size.width - 5, centerY]];
  
  for (const [sx, sy] of storagePositions) {
    if (sx >= 2 && sx < size.width - 2 && sy >= 2 && sy < size.height - 2) {
      // Small storage hut
      for (let y = sy - 1; y <= sy + 1; y++) {
        for (let x = sx - 1; x <= sx + 1; x++) {
          if (y === sy - 1 || y === sy + 1 || x === sx - 1 || x === sx + 1) {
            tiles[y][x].biome = BiomeType.WALL_LOW;
            tiles[y][x].materialSubtype = 'thatch';
          } else {
            tiles[y][x].biome = BiomeType.FLOOR_DIRT;
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.BARREL,
              rotation: 0,
              variant: 'grain_basket'
            };
          }
        }
      }
    }
  }
  
  // Compound entrance
  tiles[size.height - 2][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 2][centerX].materialSubtype = 'compound_gate';
  
  // Chief's hut entrance
  tiles[chiefHutY + chiefHutHeight - 1][centerX].biome = BiomeType.DOOR;
  
  // Define rooms
  rooms.push(createRoom(
    'chiefs_hut',
    'Chief\'s Hut',
    chiefHutX + 1,
    chiefHutY + 1,
    chiefHutWidth - 2,
    chiefHutHeight - 2,
    'throne_room',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'meeting_circle',
    'Council Circle',
    centerX - meetingRadius - 1,
    meetingY - meetingRadius - 1,
    meetingRadius * 2 + 2,
    meetingRadius * 2 + 2,
    'council',
    'normal'
  ));
  
  rooms.push(createRoom(
    'compound',
    'Chief\'s Compound',
    2,
    2,
    size.width - 4,
    size.height - 4,
    'courtyard',
    'sparse'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'chiefs_stool',
    location: [centerX, chiefHutY + 2],
    label: 'Chief\'s Stool',
    action: 'audience',
    description: 'The ceremonial seat of the chief'
  });
  
  interactionZones.push({
    id: 'council_fire',
    location: [centerX, meetingY],
    label: 'Council Fire',
    action: 'gather',
    description: 'The fire around which the elders meet'
  });
}

/**
 * African Market - Open air market with stalls
 */
export function generateAfricanMarket(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Packed earth ground
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_DIRT;
      tiles[y][x].materialSubtype = 'market_ground';
    }
  }
  
  // Create market stalls in rows
  const stallWidth = 3;
  const stallHeight = 2;
  const stallSpacing = 2;
  
  // Left row of stalls
  for (let i = 0; i < 3; i++) {
    const stallX = 3;
    const stallY = 4 + i * (stallHeight + stallSpacing);
    
    if (stallY + stallHeight < size.height - 2) {
      // Stall structure
      for (let y = stallY; y < stallY + stallHeight; y++) {
        for (let x = stallX; x < stallX + stallWidth; x++) {
          if (y === stallY) {
            // Counter
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.COUNTER,
              rotation: 0,
              variant: 'market_stall'
            };
          } else {
            // Display area
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.BASKET,
              rotation: 0,
              variant: i === 0 ? 'fruits' : i === 1 ? 'textiles' : 'crafts'
            };
          }
        }
      }
      
      // Shade cloth above
      tiles[stallY - 1][stallX + 1].overlayObject = {
        type: OverlayObjectType.BANNER,
        rotation: 0,
        variant: 'shade_cloth'
      };
    }
  }
  
  // Right row of stalls
  for (let i = 0; i < 3; i++) {
    const stallX = size.width - 6;
    const stallY = 4 + i * (stallHeight + stallSpacing);
    
    if (stallY + stallHeight < size.height - 2) {
      // Stall structure
      for (let y = stallY; y < stallY + stallHeight; y++) {
        for (let x = stallX; x < stallX + stallWidth; x++) {
          if (y === stallY) {
            // Counter
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.COUNTER,
              rotation: 0,
              variant: 'market_stall'
            };
          } else {
            // Display area
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.BASKET,
              rotation: 0,
              variant: i === 0 ? 'grains' : i === 1 ? 'pottery' : 'tools'
            };
          }
        }
      }
      
      // Shade cloth above
      tiles[stallY - 1][stallX + 1].overlayObject = {
        type: OverlayObjectType.BANNER,
        rotation: 0,
        variant: 'shade_cloth'
      };
    }
  }
  
  // Central well
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.WELL,
    rotation: 0,
    variant: 'village_well'
  };
  
  // Benches for resting
  tiles[centerY - 2][centerX - 2].overlayObject = {
    type: OverlayObjectType.BENCH,
    rotation: 0,
    variant: 'wooden'
  };
  tiles[centerY + 2][centerX + 2].overlayObject = {
    type: OverlayObjectType.BENCH,
    rotation: 0,
    variant: 'wooden'
  };
  
  // Define rooms
  rooms.push(createRoom(
    'market_square',
    'Market Square',
    1,
    1,
    size.width - 2,
    size.height - 2,
    'market',
    'crowded'
  ));
  
  // Interaction zones for each stall type
  const stallTypes = ['fruits', 'textiles', 'crafts', 'grains', 'pottery', 'tools'];
  let stallIndex = 0;
  
  for (let i = 0; i < 3; i++) {
    // Left stalls
    interactionZones.push({
      id: `stall_left_${i}`,
      location: [4, 4 + i * (stallHeight + stallSpacing)],
      label: `${stallTypes[stallIndex]} Stall`,
      action: 'trade',
      description: `A stall selling ${stallTypes[stallIndex]}`
    });
    stallIndex++;
    
    // Right stalls
    interactionZones.push({
      id: `stall_right_${i}`,
      location: [size.width - 5, 4 + i * (stallHeight + stallSpacing)],
      label: `${stallTypes[stallIndex]} Stall`,
      action: 'trade',
      description: `A stall selling ${stallTypes[stallIndex]}`
    });
    stallIndex++;
  }
  
  interactionZones.push({
    id: 'village_well',
    location: [centerX, centerY],
    label: 'Village Well',
    action: 'draw_water',
    description: 'The communal well'
  });
}

/**
 * Register all African cultural generators
 */
export function registerAfricanGenerators(): void {
  // Sacred complexes
  registerCulturalGenerator('SACRED_COMPLEX', 'SUB_SAHARAN_AFRICAN', generateAfricanSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'AFRICAN', generateAfricanSacred);
  
  // Government buildings
  registerCulturalGenerator('GOVERNMENT_FORUM', 'SUB_SAHARAN_AFRICAN', generateAfricanGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'AFRICAN', generateAfricanGovernment);
  registerCulturalGenerator('TRIBAL_COUNCIL', 'SUB_SAHARAN_AFRICAN', generateAfricanGovernment);
  registerCulturalGenerator('TRIBAL_COUNCIL', 'AFRICAN', generateAfricanGovernment);
  
  // Markets
  registerCulturalGenerator('MARKET_BAZAAR', 'SUB_SAHARAN_AFRICAN', generateAfricanMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'AFRICAN', generateAfricanMarket);
  
  console.log('[AfricanGenerators] Registered all African cultural generators');
}

// Auto-register when imported
registerAfricanGenerators();