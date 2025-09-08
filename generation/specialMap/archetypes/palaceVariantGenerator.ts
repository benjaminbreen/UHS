/**
 * Palace Variant Generator
 * Generates culturally and historically specific palace/government building layouts
 * based on districtType from governmentDistricts data
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';

// Import furniture and lighting systems
import { placePillar, placeTable, placeLightSource, placeFirepit } from '../multiTileSystem';
import { placeDeskWithChair, placeBookshelfAgainstWall, placeBenchWithOrientation, placeCulturalDecoration } from '../directionalFurniturePlacement';
import { placeRoundTable, placeLShapedTable, placeBanquetTable, placeSmartTable } from '../advancedFurnitureSystem';
import { lightRoom, placeChandelier, placeFireplace, getCulturalLighting } from '../advancedLightingSystem';
import { placeCulturalStorage, getCulturalStorage } from '../storageUtilitySystem';

export interface PalaceVariantConfig extends SpecialMapConfig {
  districtType?: string;
  customName?: string;
}

/**
 * Palace layout variants based on districtType
 */
export enum PalaceVariant {
  // Royal palaces (traditional monarchy)
  ROYAL_PALACE = 'royal_palace',
  THRONE_ROOM = 'throne_room',
  
  // Government forums (democracy/republic)
  FORUM = 'forum',
  SENATE = 'senate',
  PARLIAMENT = 'parliament',
  
  // Religious governance
  SACRED_COUNCIL = 'sacred_council',
  ROYAL_TEMPLE = 'royal_temple',
  
  // Military command
  MILITARY_COUNCIL = 'military_council',
  WAR_ROOM = 'war_room',
  FORTRESS_COMMAND = 'fortress_command',
  
  // Tribal/traditional
  COUNCIL = 'council',
  ELDERS_CHAMBER = 'elders_chamber',
  CHIEFLY_COURT = 'chiefly_court',
  COMPOUND = 'compound',
  
  // Colonial
  COLONIAL_OFFICE = 'colonial_office',
  ADMINISTRATION = 'administration',
  
  // Specialized
  MERCHANT_HALL = 'merchant_hall',
  GUILD_PALACE = 'guild_palace',
  ACADEMY_SENATE = 'academy_senate'
}

/**
 * Map districtType to palace variant
 */
function getPalaceVariant(districtType?: string): PalaceVariant {
  if (!districtType) return PalaceVariant.ROYAL_PALACE;
  
  const mapping: Record<string, PalaceVariant> = {
    // Royal
    'palace': PalaceVariant.ROYAL_PALACE,
    'castle': PalaceVariant.THRONE_ROOM,
    'royal_hall': PalaceVariant.THRONE_ROOM,
    
    // Democratic
    'forum': PalaceVariant.FORUM,
    'senate': PalaceVariant.SENATE,
    'parliament': PalaceVariant.PARLIAMENT,
    'assembly': PalaceVariant.FORUM,
    
    // Religious
    'sacred_council': PalaceVariant.SACRED_COUNCIL,
    'royal_temple': PalaceVariant.ROYAL_TEMPLE,
    'sacred_assembly': PalaceVariant.SACRED_COUNCIL,
    
    // Military
    'military_council': PalaceVariant.MILITARY_COUNCIL,
    'fortress': PalaceVariant.FORTRESS_COMMAND,
    'hillfort': PalaceVariant.WAR_ROOM,
    
    // Tribal
    'council': PalaceVariant.COUNCIL,
    'settlement_council': PalaceVariant.COUNCIL,
    'chiefly_court': PalaceVariant.CHIEFLY_COURT,
    'compound': PalaceVariant.COMPOUND,
    
    // Colonial
    'colonial_office': PalaceVariant.COLONIAL_OFFICE,
    'administration': PalaceVariant.ADMINISTRATION,
    
    // Merchant
    'merchant_council': PalaceVariant.MERCHANT_HALL,
    'guild_hall': PalaceVariant.GUILD_PALACE
  };
  
  return mapping[districtType.toLowerCase()] || PalaceVariant.ROYAL_PALACE;
}

/**
 * Get layout configuration for a palace variant
 */
interface LayoutConfig {
  centralFeature: 'throne' | 'council_table' | 'altar' | 'firepit' | 'desk' | 'platform';
  seatingArrangement: 'throne_focused' | 'circular' | 'semicircular' | 'opposing' | 'hierarchical' | 'amphitheater';
  hasAudienceChamber: boolean;
  hasPrivateQuarters: boolean;
  hasSacredSpace: boolean;
  hasWarRoom: boolean;
  hasTreasury: boolean;
  hasCouncilChamber: boolean;
  lightingStyle: 'ceremonial' | 'functional' | 'sacred' | 'military';
  decorationStyle: 'ornate' | 'austere' | 'sacred' | 'military' | 'tribal' | 'colonial';
}

function getLayoutConfig(variant: PalaceVariant, culturalZone: string): LayoutConfig {
  const configs: Record<PalaceVariant, LayoutConfig> = {
    [PalaceVariant.ROYAL_PALACE]: {
      centralFeature: 'throne',
      seatingArrangement: 'throne_focused',
      hasAudienceChamber: true,
      hasPrivateQuarters: true,
      hasSacredSpace: culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN',
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: true,
      lightingStyle: 'ceremonial',
      decorationStyle: 'ornate'
    },
    
    [PalaceVariant.FORUM]: {
      centralFeature: 'platform',
      seatingArrangement: 'amphitheater',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'austere'
    },
    
    [PalaceVariant.PARLIAMENT]: {
      centralFeature: 'platform',
      seatingArrangement: 'opposing',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: culturalZone === 'EUROPEAN' ? 'ornate' : 'austere'
    },
    
    [PalaceVariant.SACRED_COUNCIL]: {
      centralFeature: 'altar',
      seatingArrangement: 'circular',
      hasAudienceChamber: false,
      hasPrivateQuarters: true,
      hasSacredSpace: true,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: true,
      lightingStyle: 'sacred',
      decorationStyle: 'sacred'
    },
    
    [PalaceVariant.MILITARY_COUNCIL]: {
      centralFeature: 'council_table',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: true,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'military',
      decorationStyle: 'military'
    },
    
    [PalaceVariant.COUNCIL]: {
      centralFeature: culturalZone === 'INDIGENOUS_AMERICAN' ? 'firepit' : 'council_table',
      seatingArrangement: 'circular',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: culturalZone === 'INDIGENOUS_AMERICAN',
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'tribal'
    },
    
    [PalaceVariant.CHIEFLY_COURT]: {
      centralFeature: 'platform',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: true,
      hasPrivateQuarters: true,
      hasSacredSpace: true,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: false,
      lightingStyle: 'ceremonial',
      decorationStyle: 'tribal'
    },
    
    [PalaceVariant.COLONIAL_OFFICE]: {
      centralFeature: 'desk',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'colonial'
    },
    
    // Add other variants with appropriate configs
    [PalaceVariant.THRONE_ROOM]: {
      centralFeature: 'throne',
      seatingArrangement: 'throne_focused',
      hasAudienceChamber: true,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: false,
      lightingStyle: 'ceremonial',
      decorationStyle: 'ornate'
    },
    
    [PalaceVariant.SENATE]: {
      centralFeature: 'platform',
      seatingArrangement: 'semicircular',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'austere'
    },
    
    [PalaceVariant.ROYAL_TEMPLE]: {
      centralFeature: 'altar',
      seatingArrangement: 'throne_focused',
      hasAudienceChamber: true,
      hasPrivateQuarters: true,
      hasSacredSpace: true,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: false,
      lightingStyle: 'sacred',
      decorationStyle: 'sacred'
    },
    
    [PalaceVariant.WAR_ROOM]: {
      centralFeature: 'council_table',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: true,
      hasTreasury: false,
      hasCouncilChamber: false,
      lightingStyle: 'military',
      decorationStyle: 'military'
    },
    
    [PalaceVariant.FORTRESS_COMMAND]: {
      centralFeature: 'platform',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: false,
      hasPrivateQuarters: true,
      hasSacredSpace: false,
      hasWarRoom: true,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'military',
      decorationStyle: 'military'
    },
    
    [PalaceVariant.ELDERS_CHAMBER]: {
      centralFeature: 'firepit',
      seatingArrangement: 'circular',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: true,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'sacred',
      decorationStyle: 'tribal'
    },
    
    [PalaceVariant.COMPOUND]: {
      centralFeature: 'platform',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: true,
      hasPrivateQuarters: true,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: false,
      lightingStyle: 'functional',
      decorationStyle: 'tribal'
    },
    
    [PalaceVariant.ADMINISTRATION]: {
      centralFeature: 'desk',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'austere'
    },
    
    [PalaceVariant.MERCHANT_HALL]: {
      centralFeature: 'council_table',
      seatingArrangement: 'circular',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'ornate'
    },
    
    [PalaceVariant.GUILD_PALACE]: {
      centralFeature: 'platform',
      seatingArrangement: 'hierarchical',
      hasAudienceChamber: true,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: true,
      hasCouncilChamber: true,
      lightingStyle: 'ceremonial',
      decorationStyle: 'ornate'
    },
    
    [PalaceVariant.ACADEMY_SENATE]: {
      centralFeature: 'platform',
      seatingArrangement: 'semicircular',
      hasAudienceChamber: false,
      hasPrivateQuarters: false,
      hasSacredSpace: false,
      hasWarRoom: false,
      hasTreasury: false,
      hasCouncilChamber: true,
      lightingStyle: 'functional',
      decorationStyle: 'austere'
    }
  };
  
  return configs[variant];
}

/**
 * Generate throne room with cultural variations
 */
function generateThroneRoom(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  config: PalaceVariantConfig,
  layoutConfig: LayoutConfig,
  interactionZones: InteractionZone[]
): void {
  // Clear the throne room area
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.STONE_FLOOR;
        tiles[y][x].overlay = undefined;
      }
    }
  }
  
  // Place throne/central feature based on layout
  const centerX = left + Math.floor(width / 2);
  const throneY = top + 2;
  
  switch (layoutConfig.centralFeature) {
    case 'throne':
      tiles[throneY][centerX].overlay = { type: OverlayObjectType.THRONE };
      // Add throne guards
      if (centerX - 2 >= left) {
        tiles[throneY][centerX - 2].overlay = { type: OverlayObjectType.GUARD_POST };
      }
      if (centerX + 2 < left + width) {
        tiles[throneY][centerX + 2].overlay = { type: OverlayObjectType.GUARD_POST };
      }
      break;
      
    case 'altar':
      tiles[throneY][centerX].overlay = { type: OverlayObjectType.ALTAR };
      // Add sacred items
      tiles[throneY][centerX - 1].overlay = { type: OverlayObjectType.SHRINE };
      tiles[throneY][centerX + 1].overlay = { type: OverlayObjectType.SHRINE };
      break;
      
    case 'firepit':
      placeFirepit(tiles, centerX, throneY + 2, 'large');
      break;
      
    case 'platform':
      // Create raised platform
      for (let px = centerX - 2; px <= centerX + 2; px++) {
        if (tiles[throneY]?.[px]) {
          tiles[throneY][px].biome = BiomeType.MARBLE_FLOOR;
        }
      }
      tiles[throneY][centerX].overlay = { type: OverlayObjectType.PODIUM };
      break;
      
    case 'council_table':
      placeSmartTable(tiles, centerX - 2, throneY + 2, 5, 3, config.culturalZone || 'EUROPEAN');
      break;
      
    case 'desk':
      placeDeskWithChair(tiles, centerX - 1, throneY, 'south', config.culturalZone || 'EUROPEAN');
      break;
  }
  
  // Add seating arrangement
  generateSeatingArrangement(
    tiles,
    left,
    top + 4,
    width,
    height - 6,
    layoutConfig.seatingArrangement,
    config
  );
  
  // Add interaction zone
  interactionZones.push({
    x: centerX - 1,
    y: throneY,
    width: 3,
    height: 3,
    type: 'throne',
    description: `The seat of power`
  });
}

/**
 * Generate seating arrangement based on government type
 */
function generateSeatingArrangement(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  arrangement: string,
  config: SpecialMapConfig
): void {
  const centerX = left + Math.floor(width / 2);
  const centerY = top + Math.floor(height / 2);
  
  switch (arrangement) {
    case 'circular':
      // Place benches in a circle
      const radius = Math.min(width, height) / 3;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const x = Math.round(centerX + Math.cos(angle) * radius);
        const y = Math.round(centerY + Math.sin(angle) * radius);
        if (tiles[y]?.[x] && tiles[y][x].biome === BiomeType.STONE_FLOOR) {
          const facing = angle < Math.PI ? 'north' : 'south';
          placeBenchWithOrientation(tiles, x, y, facing);
        }
      }
      break;
      
    case 'semicircular':
      // Senate-style semicircle
      for (let angle = Math.PI; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = Math.round(centerX + Math.cos(angle) * (width / 3));
        const y = Math.round(centerY + Math.sin(angle) * (height / 3));
        if (tiles[y]?.[x] && tiles[y][x].biome === BiomeType.STONE_FLOOR) {
          placeBenchWithOrientation(tiles, x, y, 'north');
        }
      }
      break;
      
    case 'opposing':
      // Parliament-style opposing benches
      for (let row = 0; row < height - 2; row += 2) {
        // Left side
        if (tiles[top + row]?.[left + 2]) {
          placeBenchWithOrientation(tiles, left + 2, top + row, 'east');
        }
        // Right side
        if (tiles[top + row]?.[left + width - 3]) {
          placeBenchWithOrientation(tiles, left + width - 3, top + row, 'west');
        }
      }
      break;
      
    case 'hierarchical':
      // Tiered seating by rank
      for (let tier = 0; tier < 3; tier++) {
        const y = top + tier * 3;
        for (let x = left + 3; x < left + width - 3; x += 3) {
          if (tiles[y]?.[x]) {
            placeBenchWithOrientation(tiles, x, y, 'north');
          }
        }
      }
      break;
      
    case 'amphitheater':
      // Curved rows facing center
      for (let row = 0; row < 4; row++) {
        const y = centerY + row * 2;
        const rowWidth = width - row * 4;
        const rowLeft = left + row * 2;
        for (let x = rowLeft; x < rowLeft + rowWidth; x += 3) {
          if (tiles[y]?.[x] && tiles[y][x].biome === BiomeType.STONE_FLOOR) {
            placeBenchWithOrientation(tiles, x, y, 'north');
          }
        }
      }
      break;
      
    case 'throne_focused':
    default:
      // Traditional throne room with side benches
      for (let y = top + 2; y < top + height - 2; y += 3) {
        if (tiles[y]?.[left + 2]) {
          placeBenchWithOrientation(tiles, left + 2, y, 'east');
        }
        if (tiles[y]?.[left + width - 3]) {
          placeBenchWithOrientation(tiles, left + width - 3, y, 'west');
        }
      }
      break;
  }
}

/**
 * Main palace variant generation function
 */
export function generatePalaceVariant(
  tiles: Tile[][],
  config: PalaceVariantConfig,
  noise: any,
  size: { width: number; height: number }
): {
  tiles: Tile[][];
  interactionZones: InteractionZone[];
  exitZones: ExitZone[];
  rooms: RoomDefinition[];
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Determine palace variant and layout
  const variant = getPalaceVariant(config.districtType);
  const layoutConfig = getLayoutConfig(variant, config.culturalZone || 'EUROPEAN');
  
  // Calculate building dimensions
  const borderSize = 3;
  const buildingLeft = borderSize;
  const buildingTop = borderSize;
  const buildingWidth = size.width - borderSize * 2;
  const buildingHeight = size.height - borderSize * 2;
  
  // Initialize floor
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (!tiles[y]) tiles[y] = [];
      if (!tiles[y][x]) {
        tiles[y][x] = {
          x,
          y,
          biome: BiomeType.GRASS,
          overlay: undefined
        };
      }
    }
  }
  
  // Create building foundation
  for (let y = buildingTop; y < buildingTop + buildingHeight; y++) {
    for (let x = buildingLeft; x < buildingLeft + buildingWidth; x++) {
      tiles[y][x].biome = BiomeType.STONE_FLOOR;
    }
  }
  
  // Add walls
  for (let y = buildingTop; y < buildingTop + buildingHeight; y++) {
    tiles[y][buildingLeft].biome = BiomeType.WALL;
    tiles[y][buildingLeft + buildingWidth - 1].biome = BiomeType.WALL;
  }
  for (let x = buildingLeft; x < buildingLeft + buildingWidth; x++) {
    tiles[buildingTop][x].biome = BiomeType.WALL;
    tiles[buildingTop + buildingHeight - 1][x].biome = BiomeType.WALL;
  }
  
  // Generate main hall based on layout config
  const mainHallWidth = Math.floor(buildingWidth * 0.6);
  const mainHallHeight = Math.floor(buildingHeight * 0.5);
  const mainHallLeft = buildingLeft + Math.floor((buildingWidth - mainHallWidth) / 2);
  const mainHallTop = buildingTop + 2;
  
  generateThroneRoom(
    tiles,
    mainHallLeft,
    mainHallTop,
    mainHallWidth,
    mainHallHeight,
    config,
    layoutConfig,
    interactionZones
  );
  
  rooms.push({
    name: 'Main Hall',
    x: mainHallLeft,
    y: mainHallTop,
    width: mainHallWidth,
    height: mainHallHeight,
    purpose: 'main_hall',
    description: `The central ${layoutConfig.centralFeature} room`
  });
  
  // Add side chambers based on layout config
  let roomY = mainHallTop;
  
  if (layoutConfig.hasPrivateQuarters) {
    const quarterWidth = Math.floor(buildingWidth * 0.25);
    const quarterHeight = Math.floor(buildingHeight * 0.25);
    const quarterX = buildingLeft + 2;
    
    generatePrivateQuarters(
      tiles,
      quarterX,
      roomY,
      quarterWidth,
      quarterHeight,
      config,
      interactionZones
    );
    
    rooms.push({
      name: 'Private Quarters',
      x: quarterX,
      y: roomY,
      width: quarterWidth,
      height: quarterHeight,
      purpose: 'bedroom',
      description: 'Private living space'
    });
    
    roomY += quarterHeight + 2;
  }
  
  if (layoutConfig.hasCouncilChamber) {
    const councilWidth = Math.floor(buildingWidth * 0.3);
    const councilHeight = Math.floor(buildingHeight * 0.25);
    const councilX = buildingLeft + buildingWidth - councilWidth - 2;
    
    generateCouncilChamber(
      tiles,
      councilX,
      roomY,
      councilWidth,
      councilHeight,
      config,
      interactionZones
    );
    
    rooms.push({
      name: 'Council Chamber',
      x: councilX,
      y: roomY,
      width: councilWidth,
      height: councilHeight,
      purpose: 'meeting',
      description: 'Private meeting room'
    });
  }
  
  if (layoutConfig.hasSacredSpace) {
    const sacredWidth = Math.floor(buildingWidth * 0.25);
    const sacredHeight = Math.floor(buildingHeight * 0.2);
    const sacredX = buildingLeft + Math.floor((buildingWidth - sacredWidth) / 2);
    const sacredY = buildingTop + buildingHeight - sacredHeight - 2;
    
    generateSacredSpace(
      tiles,
      sacredX,
      sacredY,
      sacredWidth,
      sacredHeight,
      config,
      interactionZones
    );
    
    rooms.push({
      name: 'Sacred Space',
      x: sacredX,
      y: sacredY,
      width: sacredWidth,
      height: sacredHeight,
      purpose: 'shrine',
      description: 'Sacred chamber'
    });
  }
  
  if (layoutConfig.hasWarRoom) {
    const warWidth = Math.floor(buildingWidth * 0.3);
    const warHeight = Math.floor(buildingHeight * 0.25);
    const warX = buildingLeft + 2;
    const warY = buildingTop + buildingHeight - warHeight - 2;
    
    generateWarRoom(
      tiles,
      warX,
      warY,
      warWidth,
      warHeight,
      config,
      interactionZones
    );
    
    rooms.push({
      name: 'War Room',
      x: warX,
      y: warY,
      width: warWidth,
      height: warHeight,
      purpose: 'meeting',
      description: 'Military planning chamber'
    });
  }
  
  // Add entrance
  const entranceX = buildingLeft + Math.floor(buildingWidth / 2);
  const entranceY = buildingTop + buildingHeight - 1;
  tiles[entranceY][entranceX].biome = BiomeType.DOOR;
  
  exitZones.push({
    x: entranceX,
    y: entranceY,
    width: 1,
    height: 1,
    targetMap: 'overworld',
    description: 'Exit to the outside'
  });
  
  // Add lighting based on style
  addPalaceLighting(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, layoutConfig.lightingStyle, config);
  
  // Add decorations based on style
  addPalaceDecorations(tiles, rooms, layoutConfig.decorationStyle, config);
  
  return {
    tiles,
    interactionZones,
    exitZones,
    rooms
  };
}

/**
 * Generate private quarters
 */
function generatePrivateQuarters(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
): void {
  // Clear area
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.WOOD_FLOOR;
      }
    }
  }
  
  // Add bed
  const bedX = left + 1;
  const bedY = top + 1;
  tiles[bedY][bedX].overlay = { type: OverlayObjectType.BED };
  
  // Add storage
  placeCulturalStorage(tiles, left + width - 2, top + 1, config.culturalZone || 'EUROPEAN');
  
  // Add desk
  if (width > 6) {
    placeDeskWithChair(tiles, left + 1, top + height - 3, 'south', config.culturalZone || 'EUROPEAN');
  }
}

/**
 * Generate council chamber
 */
function generateCouncilChamber(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
): void {
  // Clear area
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.MARBLE_FLOOR;
      }
    }
  }
  
  // Add council table
  const tableX = left + Math.floor(width / 2) - 2;
  const tableY = top + Math.floor(height / 2) - 1;
  placeSmartTable(tiles, tableX, tableY, 5, 3, config.culturalZone || 'EUROPEAN');
  
  // Add chairs around table
  for (let x = tableX; x < tableX + 5; x++) {
    if (tiles[tableY - 1]?.[x]) {
      tiles[tableY - 1][x].overlay = { type: OverlayObjectType.CHAIR };
    }
    if (tiles[tableY + 3]?.[x]) {
      tiles[tableY + 3][x].overlay = { type: OverlayObjectType.CHAIR };
    }
  }
  
  interactionZones.push({
    x: tableX,
    y: tableY,
    width: 5,
    height: 3,
    type: 'meeting',
    description: 'Council meeting table'
  });
}

/**
 * Generate sacred space
 */
function generateSacredSpace(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
): void {
  // Clear area with special flooring
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.MARBLE_FLOOR;
      }
    }
  }
  
  // Add altar or shrine
  const centerX = left + Math.floor(width / 2);
  const altarY = top + 1;
  tiles[altarY][centerX].overlay = { type: OverlayObjectType.ALTAR };
  
  // Add offering tables
  if (centerX - 2 >= left) {
    tiles[altarY + 1][centerX - 2].overlay = { type: OverlayObjectType.OFFERING_TABLE };
  }
  if (centerX + 2 < left + width) {
    tiles[altarY + 1][centerX + 2].overlay = { type: OverlayObjectType.OFFERING_TABLE };
  }
  
  // Add candles or incense
  for (let x = left + 1; x < left + width - 1; x += 2) {
    if (tiles[top + height - 2]?.[x]) {
      tiles[top + height - 2][x].overlay = { type: OverlayObjectType.CANDLE };
    }
  }
  
  interactionZones.push({
    x: centerX - 1,
    y: altarY,
    width: 3,
    height: 2,
    type: 'shrine',
    description: 'Sacred altar'
  });
}

/**
 * Generate war room
 */
function generateWarRoom(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
): void {
  // Clear area with military-style flooring
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) {
      if (tiles[y]?.[x]) {
        tiles[y][x].biome = BiomeType.STONE_FLOOR;
      }
    }
  }
  
  // Add war table (map table)
  const tableX = left + Math.floor(width / 2) - 2;
  const tableY = top + Math.floor(height / 2) - 1;
  placeSmartTable(tiles, tableX, tableY, 4, 3, 'EUROPEAN');
  
  // Add weapon racks
  if (tiles[top + 1]?.[left + 1]) {
    tiles[top + 1][left + 1].overlay = { type: OverlayObjectType.WEAPON_RACK };
  }
  if (tiles[top + 1]?.[left + width - 2]) {
    tiles[top + 1][left + width - 2].overlay = { type: OverlayObjectType.WEAPON_RACK };
  }
  
  // Add armor stands
  if (tiles[top + height - 2]?.[left + 1]) {
    tiles[top + height - 2][left + 1].overlay = { type: OverlayObjectType.ARMOR_STAND };
  }
  if (tiles[top + height - 2]?.[left + width - 2]) {
    tiles[top + height - 2][left + width - 2].overlay = { type: OverlayObjectType.ARMOR_STAND };
  }
  
  interactionZones.push({
    x: tableX,
    y: tableY,
    width: 4,
    height: 3,
    type: 'table',
    description: 'Strategic planning table'
  });
}

/**
 * Add lighting based on palace style
 */
function addPalaceLighting(
  tiles: Tile[][],
  left: number,
  top: number,
  width: number,
  height: number,
  style: string,
  config: SpecialMapConfig
): void {
  switch (style) {
    case 'ceremonial':
      // Chandeliers and torches
      placeChandelier(tiles, left + Math.floor(width / 2), top + Math.floor(height / 3));
      placeChandelier(tiles, left + Math.floor(width / 2), top + Math.floor(2 * height / 3));
      break;
      
    case 'sacred':
      // Candles and altar lighting
      for (let x = left + 2; x < left + width - 2; x += 4) {
        for (let y = top + 2; y < top + height - 2; y += 4) {
          if (tiles[y]?.[x] && !tiles[y][x].overlay) {
            tiles[y][x].overlay = { type: OverlayObjectType.CANDLE };
          }
        }
      }
      break;
      
    case 'military':
      // Functional torches
      for (let y = top + 3; y < top + height - 3; y += 6) {
        if (tiles[y]?.[left + 1]) {
          placeLightSource(tiles, left + 1, y, 'torch');
        }
        if (tiles[y]?.[left + width - 2]) {
          placeLightSource(tiles, left + width - 2, y, 'torch');
        }
      }
      break;
      
    case 'functional':
    default:
      // Basic lighting
      lightRoom(tiles, { x: left, y: top, width, height }, config.culturalZone || 'EUROPEAN', config.era || 'MEDIEVAL');
      break;
  }
}

/**
 * Add decorations based on palace style
 */
function addPalaceDecorations(
  tiles: Tile[][],
  rooms: RoomDefinition[],
  style: string,
  config: SpecialMapConfig
): void {
  for (const room of rooms) {
    switch (style) {
      case 'ornate':
        // Add pillars, tapestries, rugs
        placeCulturalDecoration(tiles, room.x + 1, room.y + 1, config.culturalZone || 'EUROPEAN', 'tapestry');
        if (room.width > 6 && room.height > 6) {
          placePillar(tiles, room.x + 2, room.y + 2, 'white_marble', 3);
          placePillar(tiles, room.x + room.width - 3, room.y + 2, 'white_marble', 3);
        }
        break;
        
      case 'austere':
        // Minimal decoration
        if (room.purpose === 'main_hall') {
          placeCulturalDecoration(tiles, room.x + Math.floor(room.width / 2), room.y + 1, config.culturalZone || 'EUROPEAN', 'banner');
        }
        break;
        
      case 'sacred':
        // Religious decorations
        placeCulturalDecoration(tiles, room.x + 1, room.y + 1, config.culturalZone || 'EUROPEAN', 'religious_icon');
        break;
        
      case 'military':
        // Weapons, banners, shields
        placeCulturalDecoration(tiles, room.x + 1, room.y + 1, config.culturalZone || 'EUROPEAN', 'shield');
        placeCulturalDecoration(tiles, room.x + room.width - 2, room.y + 1, config.culturalZone || 'EUROPEAN', 'banner');
        break;
        
      case 'tribal':
        // Totems, masks, drums
        placeCulturalDecoration(tiles, room.x + Math.floor(room.width / 2), room.y + 1, config.culturalZone || 'EUROPEAN', 'totem');
        break;
        
      case 'colonial':
        // Maps, globes, flags
        placeCulturalDecoration(tiles, room.x + 1, room.y + 1, config.culturalZone || 'EUROPEAN', 'map');
        break;
    }
  }
}