/**
 * generation/specialMap/archetypes/colonialAdministrationGenerator.ts
 * Generator for colonial administration buildings - reflecting cultural synthesis
 *
 * Features:
 * - European formal administrative areas
 * - Local traditional spaces for indigenous interaction
 * - Cultural artifacts from both colonizer and colonized
 * - Trading post elements and document archives
 * - Layout reflects power dynamics and cultural adaptation
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import {
  placeWallRectangle,
  fillArea,
  placeCulturalWallRectangle,
  fillCulturalFloor
} from '../mapLayoutUtils';
import { applyNorthBackWall } from '../backWallUtils';
import { placePillar } from '../multiTileSystem';

// Utility function to safely set tile properties with bounds checking
function safeTileSet(tiles: Tile[][], y: number, x: number, updates: Partial<Tile>): boolean {
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    Object.assign(tiles[y][x], updates);
    return true;
  }
  return false;
}

export function generateColonialAdministration(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {

  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];

  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);

  // Create walls with formal entrance - European architectural style
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    'EUROPEAN', config.era, [
      { side: 'south', offset: centerX }
    ]);

  // Mixed flooring - European formal in administrative areas, local materials elsewhere
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);

  // EUROPEAN ADMINISTRATIVE SECTION (North half)
  // Governor/Administrator's office - formal European style
  const adminOfficeY = 2;
  const adminOfficeX = centerX - 3;

  // Administrator's desk (European style)
  safeTileSet(tiles, adminOfficeY, adminOfficeX, {
    biome: BiomeType.TABLE,
    materialSubtype: 'european_desk'
  });

  if (safeTileSet(tiles, adminOfficeY, adminOfficeX, { biome: BiomeType.TABLE })) {
    tiles[adminOfficeY][adminOfficeX].overlayObject = {
      type: OverlayObjectType.DOCUMENT_TABLE,
      rotation: 0,
      variant: 'colonial_papers'
    };
  }

  // European-style chair
  safeTileSet(tiles, adminOfficeY + 1, adminOfficeX, {
    biome: BiomeType.CHAIR,
    materialSubtype: 'european_chair'
  });

  // Filing cabinets with colonial records
  safeTileSet(tiles, adminOfficeY, adminOfficeX + 3, {
    biome: BiomeType.FILING_CABINET,
    materialSubtype: 'colonial_records'
  });

  safeTileSet(tiles, adminOfficeY + 1, adminOfficeX + 3, {
    biome: BiomeType.FILING_CABINET,
    materialSubtype: 'tax_records'
  });

  // INDIGENOUS/LOCAL CONSULTATION AREA (South section)
  // This represents spaces where colonizers met with local leaders
  const consultY = size.height - 4;

  // Traditional seating arrangement (cultural synthesis)
  if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' ||
      config.culturalZone === 'SUB_SAHARAN_AFRICAN' ||
      config.culturalZone === 'OCEANIA') {
    // Circular meeting area with traditional elements
    const consultCenterX = centerX - 1;

    // Traditional mat/rug for meetings
    safeTileSet(tiles, consultY, consultCenterX, {
      biome: BiomeType.RUG,
      materialSubtype: 'traditional_meeting_mat'
    });

    // Seating around the meeting space
    const seatPositions = [
      [consultY - 1, consultCenterX],
      [consultY, consultCenterX - 1],
      [consultY, consultCenterX + 1],
      [consultY + 1, consultCenterX]
    ];

    seatPositions.forEach(([y, x]) => {
      safeTileSet(tiles, y, x, {
        biome: BiomeType.CHAIR,
        materialSubtype: 'traditional_seat'
      });
    });

  } else {
    // For Asian/Middle Eastern cultures, use low table meeting style
    safeTileSet(tiles, consultY, centerX, {
      biome: BiomeType.TABLE_CENTER,
      materialSubtype: 'low_meeting_table'
    });

    // Cushions/mats around table
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx !== 0 || dy !== 0) {
          safeTileSet(tiles, consultY + dy, centerX + dx, {
            biome: BiomeType.CARPET,
            materialSubtype: 'meeting_cushion'
          });
        }
      }
    }
  }

  // TRADING POST ELEMENTS (West side)
  // Colonial buildings often had commercial functions
  const tradeX = 2;
  const tradeY = centerY;

  // Storage for trade goods
  safeTileSet(tiles, tradeY, tradeX, {
    biome: BiomeType.CHEST,
    materialSubtype: 'trade_goods_chest'
  });

  safeTileSet(tiles, tradeY + 1, tradeX, {
    biome: BiomeType.BARREL,
    materialSubtype: 'colonial_supplies'
  });

  // Scale/measuring table for trade
  safeTileSet(tiles, tradeY, tradeX + 1, {
    biome: BiomeType.TABLE,
    materialSubtype: 'merchant_scale'
  });

  // CULTURAL ARTIFACTS DISPLAY (East side)
  // Represents both cultures - colonizer showing power, local items as trophies/curiosities
  const artifactX = size.width - 3;
  const artifactY = centerY - 1;

  // European coat of arms/royal portrait
  safeTileSet(tiles, artifactY, artifactX, {
    biome: BiomeType.WALL_BACK,
    materialSubtype: 'royal_portrait'
  });

  // Display case with local artifacts (often taken as symbols of conquest)
  safeTileSet(tiles, artifactY + 1, artifactX, {
    biome: BiomeType.CABINET,
    materialSubtype: 'artifact_display'
  });

  // Traditional local item (weapon, tool, or ceremonial object)
  safeTileSet(tiles, artifactY + 2, artifactX, {
    biome: BiomeType.STATUE,
    materialSubtype: 'local_artifact'
  });

  // GUARD/SECURITY AREA (Near entrance)
  // Colonial buildings needed security due to tensions
  const guardX = centerX + 2;
  const guardY = size.height - 2;

  safeTileSet(tiles, guardY, guardX, {
    biome: BiomeType.WEAPON_RACK,
    materialSubtype: 'colonial_weapons'
  });

  safeTileSet(tiles, guardY, guardX + 1, {
    biome: BiomeType.CHAIR,
    materialSubtype: 'guard_chair'
  });

  // MAP TABLE - Colonial administration needed maps for territorial control
  const mapTableX = centerX - 1;
  const mapTableY = adminOfficeY + 2;

  safeTileSet(tiles, mapTableY, mapTableX, {
    biome: BiomeType.TABLE_CENTER,
    materialSubtype: 'map_table'
  });

  if (safeTileSet(tiles, mapTableY, mapTableX, { biome: BiomeType.TABLE_CENTER })) {
    tiles[mapTableY][mapTableX].overlayObject = {
      type: OverlayObjectType.DOCUMENT_TABLE,
      rotation: 0,
      variant: 'territorial_maps'
    };
  }

  // Define rooms with cultural context
  rooms.push({
    id: 'colonial_admin_office',
    name: 'Colonial Administrator Office',
    bounds: { x: 1, y: 1, width: size.width - 2, height: Math.floor(size.height / 2) },
    description: 'European-style administrative office for colonial governance',
    roomType: 'office',
    accessLevel: 'restricted',
    npcDensity: 'medium'
  });

  rooms.push({
    id: 'indigenous_consultation_area',
    name: 'Local Consultation Area',
    bounds: { x: 1, y: Math.floor(size.height / 2), width: size.width - 2, height: Math.floor(size.height / 2) - 1 },
    description: 'Meeting space for interactions with local leaders and communities',
    roomType: 'meeting',
    accessLevel: 'public',
    npcDensity: 'low'
  });

  // Add interaction zones
  interactionZones.push({
    id: 'colonial_records',
    bounds: { x: adminOfficeX + 3, y: adminOfficeY, width: 1, height: 2 },
    type: 'container',
    description: 'Colonial administrative records and tax documents'
  });

  interactionZones.push({
    id: 'trade_goods',
    bounds: { x: tradeX, y: tradeY, width: 2, height: 2 },
    type: 'container',
    description: 'Trading post supplies and colonial goods'
  });

  interactionZones.push({
    id: 'cultural_artifacts',
    bounds: { x: artifactX, y: artifactY, width: 1, height: 3 },
    type: 'display',
    description: 'Display of cultural artifacts from both colonizing and colonized cultures'
  });

  return { tiles, interactionZones, exitZones, rooms };
}