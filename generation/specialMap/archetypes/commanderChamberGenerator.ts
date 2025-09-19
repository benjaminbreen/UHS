/**
 * generation/specialMap/archetypes/commanderChamberGenerator.ts
 * Fortress Commander Inner Sanctum Generator
 * Creates intimate 8x8 chambers with fixed commander NPCs
 */

import { Tile, BiomeType, HistoricalEra, CulturalZone } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ArchitecturalBiome } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { createRoom } from '../types/roomHelpers';

export function generateCommanderChamber(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log(`[CommanderChamberGenerator] Generating fortress commander chamber for culture: ${config.culturalZone}, era: ${config.era}`);
  
  // Set all tiles to floor initially with cultural-specific flooring
  const floorType = getCulturalFloorType(config.culturalZone, config.era);
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x] = {
        x,
        y,
        type: BiomeType.PLAINS,
        variant: 'floor',
        subtype: floorType,
        elevation: 0,
        moisture: 0,
        temperature: 0.5,
        isWalkable: true,
        discovered: false,
        lastSeen: 0
      };
    }
  }
  
  // Create walls around perimeter with cultural-specific materials
  const wallType = getCulturalWallType(config.culturalZone, config.era);
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (x === 0 || x === size.width - 1 || y === 0 || y === size.height - 1) {
        tiles[y][x].type = BiomeType.MOUNTAINS;
        tiles[y][x].variant = 'wall';
        tiles[y][x].subtype = wallType;
        tiles[y][x].isWalkable = false;
      }
    }
  }
  
  // Create entrance at bottom center
  const entranceX = Math.floor(size.width / 2);
  tiles[size.height - 1][entranceX].type = BiomeType.PLAINS;
  tiles[size.height - 1][entranceX].variant = 'door';
  tiles[size.height - 1][entranceX].subtype = ArchitecturalBiome.DOOR;
  tiles[size.height - 1][entranceX].isWalkable = true;
  
  // Add cultural-specific decorations
  addCulturalDecorations(tiles, config, size);
  
  // Add commander's throne/seat at top center
  const commanderX = Math.floor(size.width / 2);
  const commanderY = 1;
  
  tiles[commanderY][commanderX].overlayObjects = [{
    type: OverlayObjectType.THRONE,
    variant: getCulturalThroneVariant(config.culturalZone, config.era),
    scale: 1.2,
    rotation: 180 // Facing south towards entrance
  }];
  
  // Add war table in center with cultural styling
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);

  tiles[centerY][centerX].overlayObjects = [{
    type: OverlayObjectType.TABLE,
    variant: getCulturalTableVariant(config.culturalZone),
    scale: 1.5
  }];
  tiles[centerY][centerX].isWalkable = false;

  // Add rugs/carpets for better aesthetics
  if (config.culturalZone === 'MENA' || config.culturalZone === 'SOUTH_ASIAN') {
    tiles[centerY - 1][centerX].overlayObjects = [{
      type: OverlayObjectType.RUG,
      variant: 'ornate_carpet',
      culturalStyle: config.culturalZone.toLowerCase()
    }];
    tiles[centerY + 1][centerX].overlayObjects = [{
      type: OverlayObjectType.RUG,
      variant: 'ornate_carpet',
      culturalStyle: config.culturalZone.toLowerCase()
    }];
  }
  
  // Add weapon racks and chests on sides for better aesthetics
  if (size.width > 6) {
    // Weapon racks
    tiles[2][1].overlayObjects = [{
      type: OverlayObjectType.WEAPON_RACK,
      variant: getCulturalWeaponRackVariant(config.culturalZone),
      rotation: 90
    }];

    tiles[2][size.width - 2].overlayObjects = [{
      type: OverlayObjectType.WEAPON_RACK,
      variant: getCulturalWeaponRackVariant(config.culturalZone),
      rotation: 270
    }];

    // Add storage chests in corners for visual interest
    tiles[size.height - 3][1].overlayObjects = [{
      type: OverlayObjectType.CHEST,
      variant: 'military_chest'
    }];
    tiles[size.height - 3][1].isWalkable = false;

    tiles[size.height - 3][size.width - 2].overlayObjects = [{
      type: OverlayObjectType.CHEST,
      variant: 'military_chest'
    }];
    tiles[size.height - 3][size.width - 2].isWalkable = false;
  }
  
  // Add torches for lighting
  if (config.era !== HistoricalEra.MODERN && config.era !== HistoricalEra.FUTURE) {
    tiles[1][1].overlayObjects = tiles[1][1].overlayObjects || [];
    tiles[1][1].overlayObjects.push({
      type: OverlayObjectType.TORCH,
      variant: 'wall_mounted'
    });
    
    tiles[1][size.width - 2].overlayObjects = tiles[1][size.width - 2].overlayObjects || [];
    tiles[1][size.width - 2].overlayObjects.push({
      type: OverlayObjectType.TORCH,
      variant: 'wall_mounted'
    });
  }
  
  // Create interaction zones
  interactionZones.push({
    id: 'commander_audience',
    bounds: { 
      x: commanderX - 1, 
      y: commanderY, 
      width: 3, 
      height: 2 
    },
    type: 'dialogue',
    interactions: ['speak_commander', 'receive_orders', 'report_mission'],
    requiredStatus: ['soldier', 'noble', 'messenger']
  });
  
  interactionZones.push({
    id: 'war_table',
    bounds: { 
      x: centerX - 1, 
      y: centerY - 1, 
      width: 3, 
      height: 3 
    },
    type: 'examination',
    interactions: ['examine_maps', 'strategic_planning'],
    requiredStatus: ['officer', 'noble']
  });
  
  // Main exit - Move player spawn point up to avoid being stuck
  exitZones.push({
    id: 'main_exit',
    location: [entranceX, size.height - 1],
    label: 'Exit to Fortress',
    destination: 'parent_map',
    playerSpawnOffset: { x: 0, y: -2 } // Spawn player 2 tiles up from the exit
  });
  
  // Define the room for NPC spawning
  rooms.push(createRoom({
    id: 'commander_chamber',
    name: 'Commander\'s Chamber',
    bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    roomType: 'military_command',
    accessLevel: 'restricted',
    allowedSocialClasses: ['noble', 'military_officer'],
    npcDensity: 'sparse', // Just the commander and maybe 1-2 guards
    genderRestriction: 'any',
    // Add custom data to indicate fixed commander position
    customData: {
      fixedNpc: {
        position: { x: commanderX, y: commanderY + 1 }, // Just in front of throne
        profession: getCommanderTitle(config.culturalZone, config.era),
        isCommander: true
      }
    }
  }));
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Get culturally appropriate commander title
 */
function getCommanderTitle(zone: CulturalZone, era: HistoricalEra): string {
  const titles: Record<string, Record<string, string>> = {
    EUROPEAN: {
      ancient: 'Centurion',
      medieval: 'Knight Commander',
      earlyModern: 'Fortress Captain',
      modern: 'Base Commander'
    },
    MENA: {
      ancient: 'Garrison Chief',
      medieval: 'Qaid',
      earlyModern: 'Janissary Commander',
      modern: 'Military Commander'
    },
    EAST_ASIAN: {
      ancient: 'Garrison General',
      medieval: 'Samurai Commander',
      earlyModern: 'Fortress Magistrate',
      modern: 'Base Commander'
    },
    SOUTH_ASIAN: {
      ancient: 'Fort Commander',
      medieval: 'Rajput Captain',
      earlyModern: 'Mughal Commander',
      modern: 'Military Commander'
    },
    SUB_SAHARAN_AFRICAN: {
      ancient: 'War Chief',
      medieval: 'Military Chief',
      earlyModern: 'Fort Captain',
      modern: 'Base Commander'
    },
    INDIGENOUS_AMERICAN: {
      ancient: 'War Chief',
      medieval: 'War Captain',
      earlyModern: 'Fort Commander',
      modern: 'Military Chief'
    },
    OCEANIC: {
      ancient: 'War Chief',
      medieval: 'Warrior Leader',
      earlyModern: 'Fort Captain',
      modern: 'Base Commander'
    }
  };
  
  const eraKey = era.toLowerCase().replace(/\s+/g, '');
  const zoneTitles = titles[zone] || titles.EUROPEAN;
  return zoneTitles[eraKey] || 'Fortress Commander';
}

/**
 * Add cultural-specific decorative elements
 */
function addCulturalDecorations(tiles: Tile[][], config: SpecialMapConfig, size: { width: number, height: number }) {
  switch (config.culturalZone) {
    case 'EUROPEAN':
      // Add heraldic shields or banners
      if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.EARLY_MODERN) {
        tiles[1][Math.floor(size.width / 2) - 1].overlayObjects = [{
          type: OverlayObjectType.BANNER,
          variant: 'heraldic_shield',
          culturalStyle: 'european_medieval'
        }];
        tiles[1][Math.floor(size.width / 2) + 1].overlayObjects = [{
          type: OverlayObjectType.BANNER,
          variant: 'heraldic_shield',
          culturalStyle: 'european_medieval'
        }];
      }
      break;
      
    case 'MENA':
      // Add Islamic geometric patterns or calligraphy
      for (let x = 2; x < size.width - 2; x += 2) {
        if (tiles[0][x]) {
          tiles[0][x].overlayObjects = [{
            type: OverlayObjectType.DECORATIVE_PANEL,
            variant: 'geometric_pattern',
            culturalStyle: 'islamic'
          }];
        }
      }
      break;
      
    case 'EAST_ASIAN':
      // Add scroll paintings or weapon displays
      tiles[2][0].overlayObjects = [{
        type: OverlayObjectType.SCROLL,
        variant: 'hanging_scroll',
        culturalStyle: 'chinese'
      }];
      tiles[2][size.width - 1].overlayObjects = [{
        type: OverlayObjectType.SCROLL,
        variant: 'hanging_scroll',
        culturalStyle: 'chinese'
      }];
      break;
      
    case 'SOUTH_ASIAN':
      // Add tapestries or carved panels
      tiles[1][2].overlayObjects = [{
        type: OverlayObjectType.TAPESTRY,
        variant: 'ornate',
        culturalStyle: 'indian'
      }];
      tiles[1][size.width - 3].overlayObjects = [{
        type: OverlayObjectType.TAPESTRY,
        variant: 'ornate',
        culturalStyle: 'indian'
      }];
      break;
      
    case 'SUB_SAHARAN_AFRICAN':
      // Add shields and spears
      tiles[3][1].overlayObjects = [{
        type: OverlayObjectType.WEAPON_DISPLAY,
        variant: 'shield_spear',
        culturalStyle: 'african'
      }];
      tiles[3][size.width - 2].overlayObjects = [{
        type: OverlayObjectType.WEAPON_DISPLAY,
        variant: 'shield_spear',
        culturalStyle: 'african'
      }];
      break;
      
    case 'INDIGENOUS_AMERICAN':
    case 'NORTH_AMERICAN':
      // Add war trophies or totems
      tiles[2][1].overlayObjects = [{
        type: OverlayObjectType.TOTEM,
        variant: 'war_totem',
        culturalStyle: 'native_american'
      }];
      break;
      
    case 'OCEANIC':
      // Add tapa cloth or war clubs
      tiles[1][1].overlayObjects = [{
        type: OverlayObjectType.TAPESTRY,
        variant: 'tapa_cloth',
        culturalStyle: 'polynesian'
      }];
      tiles[1][size.width - 2].overlayObjects = [{
        type: OverlayObjectType.WEAPON_DISPLAY,
        variant: 'war_club',
        culturalStyle: 'polynesian'
      }];
      break;
  }
}

/**
 * Get culturally appropriate throne variant
 */
function getCulturalThroneVariant(zone: CulturalZone, era: HistoricalEra): string {
  const variants: Record<string, Record<string, string>> = {
    EUROPEAN: {
      ancient: 'stone_throne',
      medieval: 'ornate_throne',
      earlyModern: 'baroque_throne',
      modern: 'command_chair'
    },
    MENA: {
      ancient: 'stone_seat',
      medieval: 'cushioned_dais',
      earlyModern: 'ottoman_throne',
      modern: 'command_chair'
    },
    EAST_ASIAN: {
      ancient: 'lacquered_seat',
      medieval: 'dragon_throne',
      earlyModern: 'imperial_chair',
      modern: 'command_chair'
    },
    SOUTH_ASIAN: {
      ancient: 'carved_seat',
      medieval: 'peacock_throne',
      earlyModern: 'mughal_throne',
      modern: 'command_chair'
    },
    SUB_SAHARAN_AFRICAN: {
      ancient: 'chief_stool',
      medieval: 'royal_stool',
      earlyModern: 'carved_throne',
      modern: 'command_chair'
    },
    INDIGENOUS_AMERICAN: {
      ancient: 'stone_seat',
      medieval: 'chief_seat',
      earlyModern: 'ceremonial_chair',
      modern: 'command_chair'
    },
    OCEANIC: {
      ancient: 'carved_stool',
      medieval: 'chief_seat',
      earlyModern: 'royal_chair',
      modern: 'command_chair'
    }
  };
  
  const eraKey = era.toLowerCase().replace(/\s+/g, '');
  const zoneVariants = variants[zone] || variants.EUROPEAN;
  return zoneVariants[eraKey] || 'simple_chair';
}

/**
 * Get culturally appropriate floor type
 */
function getCulturalFloorType(zone: CulturalZone, era: HistoricalEra): ArchitecturalBiome {
  const floorTypes: Record<string, ArchitecturalBiome> = {
    EUROPEAN: ArchitecturalBiome.FLOOR_STONE,
    MENA: ArchitecturalBiome.FLOOR_TILE,
    EAST_ASIAN: ArchitecturalBiome.FLOOR_WOOD,
    SOUTH_ASIAN: ArchitecturalBiome.FLOOR_MARBLE,
    SUB_SAHARAN_AFRICAN: ArchitecturalBiome.FLOOR_DIRT,
    INDIGENOUS_AMERICAN: ArchitecturalBiome.FLOOR_DIRT,
    OCEANIC: ArchitecturalBiome.FLOOR_WOOD
  };

  // Modern era gets concrete/modern flooring
  if (era === HistoricalEra.MODERN || era === HistoricalEra.FUTURE) {
    return ArchitecturalBiome.FLOOR_STONE;
  }

  return floorTypes[zone] || ArchitecturalBiome.FLOOR_STONE;
}

/**
 * Get culturally appropriate wall type
 */
function getCulturalWallType(zone: CulturalZone, era: HistoricalEra): ArchitecturalBiome {
  const wallTypes: Record<string, ArchitecturalBiome> = {
    EUROPEAN: ArchitecturalBiome.WALL_STONE,
    MENA: ArchitecturalBiome.WALL_SANDSTONE,
    EAST_ASIAN: ArchitecturalBiome.WALL_WOOD,
    SOUTH_ASIAN: ArchitecturalBiome.WALL_STONE,
    SUB_SAHARAN_AFRICAN: ArchitecturalBiome.WALL_MUD,
    INDIGENOUS_AMERICAN: ArchitecturalBiome.WALL_ADOBE,
    OCEANIC: ArchitecturalBiome.WALL_BAMBOO
  };

  // Modern era gets concrete walls
  if (era === HistoricalEra.MODERN || era === HistoricalEra.FUTURE) {
    return ArchitecturalBiome.WALL_CONCRETE;
  }

  return wallTypes[zone] || ArchitecturalBiome.WALL_STONE;
}

/**
 * Get culturally appropriate table variant
 */
function getCulturalTableVariant(zone: CulturalZone): string {
  const variants: Record<string, string> = {
    EUROPEAN: 'war_table',
    MENA: 'low_table',
    EAST_ASIAN: 'lacquered_table',
    SOUTH_ASIAN: 'carved_table',
    SUB_SAHARAN_AFRICAN: 'simple_table',
    INDIGENOUS_AMERICAN: 'stone_slab',
    OCEANIC: 'woven_mat'
  };

  return variants[zone] || 'war_table';
}

/**
 * Get culturally appropriate weapon rack variant
 */
function getCulturalWeaponRackVariant(zone: CulturalZone): string {
  const variants: Record<string, string> = {
    EUROPEAN: 'sword_rack',
    MENA: 'scimitar_rack',
    EAST_ASIAN: 'katana_stand',
    SOUTH_ASIAN: 'khanda_rack',
    SUB_SAHARAN_AFRICAN: 'spear_rack',
    INDIGENOUS_AMERICAN: 'bow_rack',
    OCEANIC: 'club_rack'
  };

  return variants[zone] || 'weapon_rack';
}