/**
 * generation/specialMap/archetypes/tribalCouncilGenerator.ts
 * Generator for tribal council spaces - indigenous governance structures
 * 
 * Features:
 * - Circular/oval gathering spaces
 * - Central fire pit
 * - Natural materials (no marble/columns)
 * - Seating arranged in circles
 * - Open-air design
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { 
  fillArea, 
  placeCulturalSymbol
} from '../mapLayoutUtils';

// Utility function to safely set tile properties with bounds checking
function safeTileSet(tiles: Tile[][], y: number, x: number, updates: Partial<Tile>): boolean {
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    Object.assign(tiles[y][x], updates);
    return true;
  }
  return false;
}

export function generateTribalCouncil(
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
  
  // NOTE: Surrounding terrain is handled by specialMapGenerator.ts
  // It preserves edge tiles from parent map, so we only need to define the structure
  
  // Determine structure shape based on culture
  const isLonghouse = config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
                      config.culturalZone === 'NORTH_AMERICAN_COLONIAL';
  
  if (isLonghouse) {
    // LONGHOUSE STYLE - Rectangular structure with wooden walls
    const longWidth = Math.min(size.width - 6, 20);
    const longHeight = Math.min(size.height - 6, 10);
    const startX = centerX - Math.floor(longWidth / 2);
    const startY = centerY - Math.floor(longHeight / 2);
    
    // Create wooden walls
    for (let y = startY; y < startY + longHeight; y++) {
      for (let x = startX; x < startX + longWidth; x++) {
        if (y === startY || y === startY + longHeight - 1 || 
            x === startX || x === startX + longWidth - 1) {
          // Walls
          if (safeTileSet(tiles, y, x, { biome: BiomeType.WALL_LOW })) {
            tiles[y][x].materialSubtype = 'wooden_palisade';
          }
        } else {
          // Floor inside
          safeTileSet(tiles, y, x, { 
            biome: BiomeType.FLOOR_DIRT,
            materialSubtype: 'packed_earth'
          });
        }
      }
    }
    
    // Entrances at ends
    safeTileSet(tiles, centerY, startX, { biome: BiomeType.DOOR });
    safeTileSet(tiles, centerY, startX + longWidth - 1, { biome: BiomeType.DOOR });
    
  } else {
    // CIRCULAR COUNCIL - Round structure with low walls or open
    const radius = Math.min(Math.floor(size.width / 3), Math.floor(size.height / 3));
    
    // Create circular area
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (dist <= radius) {
          if (Math.abs(dist - radius) < 1) {
            // Low circular wall
            safeTileSet(tiles, y, x, { 
              biome: BiomeType.WALL_LOW,
              materialSubtype: 'stone_circle'
            });
          } else {
            // Interior floor
            safeTileSet(tiles, y, x, { 
              biome: BiomeType.FLOOR_DIRT,
              materialSubtype: 'ceremonial_ground'
            });
          }
        }
      }
    }
    
    // Create entrance gaps
    safeTileSet(tiles, centerY + radius, centerX, { biome: BiomeType.DIRT_PATH });
    safeTileSet(tiles, centerY - radius, centerX, { biome: BiomeType.DIRT_PATH });
    safeTileSet(tiles, centerY, centerX + radius, { biome: BiomeType.DIRT_PATH });
    safeTileSet(tiles, centerY, centerX - radius, { biome: BiomeType.DIRT_PATH });
  }
  
  // Central fire pit - the heart of tribal governance
  if (safeTileSet(tiles, centerY, centerX, { biome: BiomeType.FLOOR_DIRT })) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'council_fire'
    };
    tiles[centerY][centerX].isBlocking = false; // People can gather around
  }
  
  // Create circular seating arrangement around fire pit
  const seatRadius = Math.min(4, Math.floor(Math.min(size.width, size.height) / 4));
  
  for (let angle = 0; angle < 360; angle += 45) { // 8 seats in circle
    const radians = (angle * Math.PI) / 180;
    const seatX = Math.round(centerX + seatRadius * Math.cos(radians));
    const seatY = Math.round(centerY + seatRadius * Math.sin(radians));
    
    if (safeTileSet(tiles, seatY, seatX, { biome: BiomeType.CHAIR })) {
      tiles[seatY][seatX].materialSubtype = getTribalSeating(config.culturalZone);
      tiles[seatY][seatX].isBlocking = true;
    }
  }
  
  // Add cultural elements based on region
  addCulturalElements(tiles, config, size, noise);
  
  // Create entrance paths (no formal exits, just natural pathways)
  const pathWidth = 2;
  
  // South entrance (main approach)
  for (let y = size.height - pathWidth; y < size.height; y++) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      safeTileSet(tiles, y, x, { 
        biome: BiomeType.DIRT_PATH,
        materialSubtype: 'worn_earth'
      });
    }
  }
  
  // Exit zones (multiple directions for natural flow)
  exitZones.push(
    { id: 'south_path', location: [centerX, size.height - 1], label: 'Leave Council', destination: 'parent_map' },
    { id: 'north_path', location: [centerX, 0], label: 'Northern Path', destination: 'parent_map' },
    { id: 'east_path', location: [size.width - 1, centerY], label: 'Eastern Path', destination: 'parent_map' },
    { id: 'west_path', location: [0, centerY], label: 'Western Path', destination: 'parent_map' }
  );
  
  // Interaction zones
  interactionZones.push(
    {
      id: 'council_fire',
      location: [centerX, centerY],
      label: 'Sacred Council Fire',
      action: 'examine',
      description: 'The sacred fire around which the community gathers for important decisions'
    }
  );
  
  // Define the main gathering area as a room for NPC placement
  const gatheringRadius = seatRadius + 2;
  rooms.push({
    id: 'council_circle',
    name: 'Council Circle', 
    bounds: {
      x: Math.max(0, centerX - gatheringRadius),
      y: Math.max(0, centerY - gatheringRadius),
      width: Math.min(size.width, gatheringRadius * 2),
      height: Math.min(size.height, gatheringRadius * 2)
    },
    description: 'The sacred circle where tribal elders and community members gather',
    roomType: 'council',
    accessLevel: 'public',
    npcDensity: 'high'
  });
  
  return { tiles, interactionZones, exitZones, rooms };
}

function getTribalSeating(culturalZone: string): string {
  switch (culturalZone) {
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
    case 'NORTH_AMERICAN_COLONIAL':
      return 'log_seat';
    case 'SUB_SAHARAN_AFRICAN':
      return 'carved_stool';
    case 'SOUTH_AMERICAN':
      return 'stone_seat';
    case 'OCEANIAN':
      return 'woven_mat';
    default:
      return 'log_seat';
  }
}

function addCulturalElements(
  tiles: Tile[][],
  config: SpecialMapConfig, 
  size: { width: number, height: number },
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  switch (config.culturalZone) {
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
    case 'NORTH_AMERICAN_COLONIAL':
      // Add totems or prayer poles
      if (safeTileSet(tiles, 2, centerX, { biome: BiomeType.GRASSLAND })) {
        tiles[2][centerX].overlayObject = {
          type: OverlayObjectType.TOTEM_POLE,
          rotation: 0,
          variant: 'ceremonial'
        };
      }
      break;
      
    case 'SUB_SAHARAN_AFRICAN':
      // Add drums and ritual objects
      if (safeTileSet(tiles, centerY - 2, centerX - 2, { biome: BiomeType.GRASSLAND })) {
        tiles[centerY - 2][centerX - 2].overlayObject = {
          type: OverlayObjectType.DRUM,
          rotation: 0,
          variant: 'talking_drum'
        };
      }
      break;
      
    case 'SOUTH_AMERICAN':
      // Add ceremonial stones
      if (safeTileSet(tiles, centerY + 3, centerX, { biome: BiomeType.FLOOR_STONE })) {
        tiles[centerY + 3][centerX].overlayObject = {
          type: OverlayObjectType.ALTAR_STONE,
          rotation: 0,
          variant: 'ceremonial'
        };
      }
      break;
      
    case 'OCEANIAN':
      // Add meeting stones
      for (let i = 0; i < 3; i++) {
        const stoneX = centerX + (i - 1) * 2;
        const stoneY = size.height - 3;
        safeTileSet(tiles, stoneY, stoneX, { 
          biome: BiomeType.FLOOR_STONE,
          materialSubtype: 'ritual_stone'
        });
      }
      break;
  }
}