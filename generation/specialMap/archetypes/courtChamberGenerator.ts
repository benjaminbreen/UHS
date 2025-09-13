/**
 * generation/specialMap/archetypes/courtChamberGenerator.ts
 * Generator for court chambers - legal and judicial buildings
 * 
 * Features:
 * - Judge's bench at north
 * - Witness stand in center
 * - Gallery seating for observers
 * - Clerk's desk for records
 * - Formal, symmetrical layout
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

export function generateCourtChamber(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  const centerX = Math.floor(size.width / 2);
  
  // Create walls with formal entrance
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: centerX } // Main entrance
    ]);
  
  // Culturally appropriate floor
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);
  
  // Add back wall to north edge for SNES RPG dollhouse view
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: true,  // Courts often have windows for natural light
    windowSpacing: 4
  });
  
  // JUDGE'S BENCH - Elevated platform at north end
  const benchY = 2;
  const benchWidth = Math.min(6, size.width - 4);
  const benchStart = centerX - Math.floor(benchWidth / 2);
  
  // Create raised platform for judge
  for (let x = benchStart; x < benchStart + benchWidth; x++) {
    safeTileSet(tiles, benchY, x, { 
      biome: BiomeType.FLOOR_MARBLE,
      materialSubtype: getJudicialMaterial(config.culturalZone, config.era, 'elevated')
    });
  }
  
  // Judge's chair - center of bench
  if (safeTileSet(tiles, benchY, centerX, { biome: BiomeType.CHAIR })) {
    tiles[benchY][centerX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 180, // Facing south toward court
      variant: getJudicialSeat(config.culturalZone, config.era)
    };
    tiles[benchY][centerX].materialSubtype = getJudicialMaterial(config.culturalZone, config.era, 'seat');
    tiles[benchY][centerX].isBlocking = true;
  }
  
  // Judicial symbols (scales of justice, etc.)
  if (safeTileSet(tiles, benchY - 1, centerX, { biome: BiomeType.FLOOR_STONE })) {
    tiles[benchY - 1][centerX].overlayObject = {
      type: OverlayObjectType.SCALES_OF_JUSTICE,
      rotation: 0,
      variant: 'ceremonial'
    };
  }
  
  // WITNESS STAND - Center of court
  const witnessY = Math.floor(size.height / 2);
  const witnessX = centerX + 2; // Slightly offset
  
  if (safeTileSet(tiles, witnessY, witnessX, { biome: BiomeType.CHAIR })) {
    tiles[witnessY][witnessX].materialSubtype = 'witness_chair';
    tiles[witnessY][witnessX].isBlocking = true;
    tiles[witnessY][witnessX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 270 // Facing west toward the judge
    };
  }
  
  // Small railing around witness stand
  const railPositions = [
    [witnessY - 1, witnessX], [witnessY + 1, witnessX],
    [witnessY, witnessX - 1], [witnessY, witnessX + 1]
  ];
  
  railPositions.forEach(([y, x]) => {
    safeTileSet(tiles, y, x, {
      biome: BiomeType.WALL_LOW,
      materialSubtype: 'wooden_rail'
    });
  });
  
  // CLERK'S DESK - Side of court for record keeping
  const clerkY = witnessY;
  const clerkX = centerX - 3;
  
  if (safeTileSet(tiles, clerkY, clerkX, { biome: BiomeType.TABLE })) {
    tiles[clerkY][clerkX].materialSubtype = 'clerk_desk';
    tiles[clerkY][clerkX].overlayObject = {
      type: OverlayObjectType.WRITING_DESK,
      rotation: 90, // Facing the court
      variant: 'legal_records'
    };
  }
  
  // Clerk's chair
  if (safeTileSet(tiles, clerkY, clerkX - 1, { 
    biome: BiomeType.CHAIR,
    materialSubtype: 'clerk_chair'
  })) {
    tiles[clerkY][clerkX - 1].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 90 // Facing east toward the court
    };
  }
  
  // GALLERY SEATING - South end for public observers
  const galleryStartY = witnessY + 3;
  const seatingRows = Math.min(3, size.height - galleryStartY - 2);
  
  for (let row = 0; row < seatingRows; row++) {
    const rowY = galleryStartY + row;
    const seatsInRow = Math.min(8, size.width - 4);
    const seatStart = centerX - Math.floor(seatsInRow / 2);
    
    for (let seat = 0; seat < seatsInRow; seat += 2) { // Space between seats
      const seatX = seatStart + seat;
      if (safeTileSet(tiles, rowY, seatX, {
        biome: BiomeType.CHAIR,
        materialSubtype: 'gallery_bench'
      })) {
        tiles[rowY][seatX].overlayObject = {
          type: OverlayObjectType.CHAIR,
          rotation: 0 // Facing north toward the judge
        };
      }
    }
  }
  
  // Add cultural legal symbols
  addLegalSymbols(tiles, config, size);
  
  // Exit zones
  exitZones.push(
    { id: 'main_exit', location: [centerX, size.height - 1], label: 'Exit Court', destination: 'parent_map' }
  );
  
  // Interaction zones
  interactionZones.push(
    {
      id: 'judges_bench',
      location: [centerX, benchY],
      label: "Judge's Bench",
      action: 'examine',
      description: 'The elevated seat where justice is administered'
    },
    {
      id: 'witness_stand',
      location: [witnessX, witnessY],
      label: 'Witness Stand', 
      action: 'examine',
      description: 'Where testimony is given under oath'
    },
    {
      id: 'clerks_desk',
      location: [clerkX, clerkY],
      label: "Clerk's Desk",
      action: 'examine', 
      description: 'Records and legal documents are maintained here'
    }
  );
  
  // Define room areas for NPC placement
  rooms.push(
    {
      id: 'judicial_chamber',
      name: 'Court Chamber',
      bounds: { x: 1, y: 1, width: size.width - 2, height: benchY + 2 },
      description: 'The formal area where legal proceedings take place',
      roomType: 'courtroom',
      accessLevel: 'restricted',
      npcDensity: 'low' // Judge, clerk only
    },
    {
      id: 'gallery',
      name: 'Public Gallery', 
      bounds: { x: 1, y: galleryStartY, width: size.width - 2, height: size.height - galleryStartY - 1 },
      description: 'Seating area for court observers',
      roomType: 'gallery',
      accessLevel: 'public',
      npcDensity: 'normal' // Citizens observing
    }
  );
  
  return { tiles, interactionZones, exitZones, rooms };
}

function getJudicialMaterial(culturalZone: string, era: HistoricalEra, element: 'elevated' | 'seat'): string {
  switch (culturalZone) {
    case 'EUROPEAN':
      return element === 'elevated' ? 'marble_platform' : 'carved_oak';
    case 'EAST_ASIAN':
      return element === 'elevated' ? 'jade_platform' : 'lacquered_wood';
    case 'MENA':
      return element === 'elevated' ? 'sandstone_platform' : 'cedar_chair';
    case 'SUB_SAHARAN_AFRICAN':
      return element === 'elevated' ? 'stone_platform' : 'carved_ebony';
    default:
      return element === 'elevated' ? 'stone_platform' : 'wooden_chair';
  }
}

function getJudicialSeat(culturalZone: string, era: HistoricalEra): string {
  switch (culturalZone) {
    case 'EUROPEAN':
      return era === HistoricalEra.MEDIEVAL ? 'high_seat' : 'judicial_throne';
    case 'EAST_ASIAN': 
      return 'magistrate_chair';
    case 'MENA':
      return 'qadi_seat';
    case 'SUB_SAHARAN_AFRICAN':
      return 'chief_judgement_seat';
    default:
      return 'high_seat';
  }
}

function addLegalSymbols(
  tiles: Tile[][],
  config: SpecialMapConfig,
  size: { width: number, height: number }
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Add era-appropriate legal symbols on walls
  switch (config.culturalZone) {
    case 'EUROPEAN':
      // Coat of arms or royal seal behind judge
      if (safeTileSet(tiles, 1, centerX, { biome: BiomeType.WALL })) {
        tiles[1][centerX].overlayObject = {
          type: OverlayObjectType.ROYAL_SEAL,
          rotation: 0,
          variant: 'legal_authority'
        };
      }
      
      // Add statues of justice in corners (if space permits)
      if (size.width >= 12) {
        // Left statue
        if (safeTileSet(tiles, 2, 2, { biome: tiles[2][2].biome })) {
          tiles[2][2].overlayObject = {
            type: OverlayObjectType.STATUE,
            rotation: 0,
            variant: 'justice_figure'
          };
        }
        // Right statue
        if (safeTileSet(tiles, 2, size.width - 3, { biome: tiles[2][size.width - 3].biome })) {
          tiles[2][size.width - 3].overlayObject = {
            type: OverlayObjectType.STATUE,
            rotation: 0,
            variant: 'justice_figure'
          };
        }
      }
      
      // Add columns for grandeur (Classical/Renaissance)
      if (config.era !== HistoricalEra.MEDIEVAL && size.width >= 14) {
        [4, size.width - 5].forEach(x => {
          if (safeTileSet(tiles, 3, x, { biome: tiles[3][x].biome })) {
            tiles[3][x].overlayObject = {
              type: OverlayObjectType.COLUMN,
              rotation: 0,
              variant: 'marble'
            };
          }
        });
      }
      break;
      
    case 'MENA':
      // Quranic legal inscription
      if (safeTileSet(tiles, 1, centerX, { biome: BiomeType.WALL })) {
        tiles[1][centerX].materialSubtype = 'calligraphy_justice';
      }
      
      // Add geometric patterns on side walls
      [2, size.width - 2].forEach(x => {
        if (safeTileSet(tiles, centerY, x, { biome: BiomeType.WALL })) {
          tiles[centerY][x].overlayObject = {
            type: OverlayObjectType.GEOMETRIC_PANEL,
            rotation: 0,
            variant: 'islamic_star'
          };
        }
      });
      
      // Add lanterns for lighting
      if (size.height >= 10) {
        [3, size.height - 3].forEach(y => {
          if (safeTileSet(tiles, y, 1, { biome: tiles[y][1].biome })) {
            tiles[y][1].overlayObject = {
              type: OverlayObjectType.LANTERN,
              rotation: 0,
              variant: 'brass'
            };
          }
        });
      }
      break;
      
    case 'EAST_ASIAN':
      // Imperial legal decree
      if (safeTileSet(tiles, 1, centerX, { biome: BiomeType.WALL })) {
        tiles[1][centerX].overlayObject = {
          type: OverlayObjectType.SCROLL,
          rotation: 0,
          variant: 'legal_mandate'
        };
      }
      
      // Add decorative screens
      if (size.width >= 12) {
        [3, size.width - 4].forEach(x => {
          if (safeTileSet(tiles, 2, x, { biome: tiles[2][x].biome })) {
            tiles[2][x].overlayObject = {
              type: OverlayObjectType.SCREEN,
              rotation: 0,
              variant: 'lacquered'
            };
          }
        });
      }
      
      // Add vases or ceremonial objects
      [2, size.height - 2].forEach(y => {
        if (safeTileSet(tiles, y, 2, { biome: tiles[y][2].biome })) {
          tiles[y][2].overlayObject = {
            type: OverlayObjectType.VASE,
            rotation: 0,
            variant: 'porcelain'
          };
        }
      });
      break;
      
    case 'SUB_SAHARAN_AFRICAN':
      // Traditional symbols of authority
      if (safeTileSet(tiles, 1, centerX, { biome: BiomeType.WALL })) {
        tiles[1][centerX].overlayObject = {
          type: OverlayObjectType.MASK,
          rotation: 0,
          variant: 'judicial'
        };
      }
      
      // Add carved pillars
      if (size.width >= 10) {
        [3, size.width - 4].forEach(x => {
          if (safeTileSet(tiles, 3, x, { biome: tiles[3][x].biome })) {
            tiles[3][x].overlayObject = {
              type: OverlayObjectType.CARVED_POST,
              rotation: 0,
              variant: 'ceremonial'
            };
          }
        });
      }
      break;
      
    case 'SOUTH_AMERICAN':
      // Incan/Aztec symbols
      if (safeTileSet(tiles, 1, centerX, { biome: BiomeType.WALL })) {
        tiles[1][centerX].overlayObject = {
          type: OverlayObjectType.STONE_CARVING,
          rotation: 0,
          variant: 'legal_glyph'
        };
      }
      
      // Add stone braziers
      [2, size.width - 3].forEach(x => {
        if (safeTileSet(tiles, 3, x, { biome: tiles[3][x].biome })) {
          tiles[3][x].overlayObject = {
            type: OverlayObjectType.BRAZIER,
            rotation: 0,
            variant: 'stone'
          };
        }
      });
      break;
      
    default:
      // Generic torch lighting
      if (size.width >= 8) {
        [2, size.width - 3].forEach(x => {
          if (safeTileSet(tiles, 2, x, { biome: tiles[2][x].biome })) {
            tiles[2][x].overlayObject = {
              type: OverlayObjectType.TORCH,
              rotation: 0
            };
          }
        });
      }
      break;
  }
  
  // Add flags or banners for all cultures (if space permits)
  if (size.height >= 12 && config.era !== HistoricalEra.ANTIQUITY) {
    const bannerY = 2;
    [3, size.width - 4].forEach(x => {
      if (safeTileSet(tiles, bannerY, x, { biome: tiles[bannerY][x].biome })) {
        tiles[bannerY][x].overlayObject = {
          type: OverlayObjectType.BANNER,
          rotation: 0,
          variant: 'legal_authority'
        };
      }
    });
  }
}