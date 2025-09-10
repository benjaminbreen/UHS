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

import { Tile, BiomeType, HistoricalEra, ClimateType } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { 
  fillArea, 
  placeCulturalSymbol
} from '../mapLayoutUtils';
import { getCulturalGenerator } from '../culturalGeneratorRegistry';

// Import cultural generators to ensure they register
import './cultures/nativeAmericanGenerators';

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
  
  // Check for registered cultural generator first
  const culturalGenerator = getCulturalGenerator('TRIBAL_COUNCIL', config.culturalZone);
  if (culturalGenerator) {
    console.log(`[TribalCouncil] Using registered cultural generator for ${config.culturalZone}`);
    culturalGenerator(tiles, size, config, interactionZones, rooms, noise);
    
    // Add exit zones if not already added
    if (exitZones.length === 0) {
      exitZones.push(
        { id: 'south_path', location: [centerX, size.height - 1], label: 'Leave Council', destination: 'parent_map' },
        { id: 'north_path', location: [centerX, 0], label: 'Northern Path', destination: 'parent_map' }
      );
    }
    
    return { tiles, interactionZones, exitZones, rooms };
  }
  
  console.log(`[TribalCouncil] No registered generator, using built-in for ${config.culturalZone}`);
  
  // Fill entire area with natural ground (grass, dirt, or sand based on climate)
  const groundType = getNaturalGroundType(config);
  fillArea(tiles, 0, 0, size.width, size.height, groundType);
  
  // Determine structure shape based on culture
  const isLonghouse = config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' && 
                      config.region?.includes('woodland');
  const isOpenCouncil = !isLonghouse;
  
  if (isLonghouse) {
    // LONGHOUSE STYLE - Indoor structure with wooden walls
    const longWidth = Math.min(size.width - 6, 20);
    const longHeight = Math.min(size.height - 6, 10);
    const startX = centerX - Math.floor(longWidth / 2);
    const startY = centerY - Math.floor(longHeight / 2);
    
    // Create wooden floor inside
    fillArea(tiles, startX, startY, longWidth, longHeight, BiomeType.FLOOR_WOOD);
    
    // Create wooden walls
    for (let y = startY; y < startY + longHeight; y++) {
      for (let x = startX; x < startX + longWidth; x++) {
        if (y === startY || y === startY + longHeight - 1 || 
            x === startX || x === startX + longWidth - 1) {
          // Walls
          if (safeTileSet(tiles, y, x, { biome: BiomeType.WALL_LOW })) {
            tiles[y][x].materialSubtype = 'wooden_palisade';
          }
        }
      }
    }
    
    // Entrances at ends
    safeTileSet(tiles, centerY, startX, { biome: BiomeType.DOOR });
    safeTileSet(tiles, centerY, startX + longWidth - 1, { biome: BiomeType.DOOR });
    
  } else {
    // OPEN COUNCIL - Outdoor gathering space with natural ground
    const councilRadius = Math.min(Math.floor(size.width / 4), Math.floor(size.height / 4), 6);
    
    // Create packed dirt circle for the main council area
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (dist <= councilRadius) {
          // Packed earth in the council circle
          safeTileSet(tiles, y, x, { 
            biome: BiomeType.FLOOR_DIRT,
            materialSubtype: 'ceremonial_ground'
          });
        } else if (dist <= councilRadius + 1) {
          // Natural stone ring marking the boundary (optional)
          if (Math.random() > 0.3) { // Some gaps for natural look
            if (tiles[y]?.[x]) {
              tiles[y][x].overlayObject = {
                type: OverlayObjectType.ROCK,
                rotation: 0,
                variant: 'boundary_stone'
              };
            }
          }
        }
        // Everything else remains natural ground from fillArea above
      }
    }
    
    // Create natural pathways to the council area
    const pathDirections = [
      { dx: 0, dy: 1 },  // South
      { dx: 0, dy: -1 }, // North
      { dx: 1, dy: 0 },  // East
      { dx: -1, dy: 0 }  // West
    ];
    
    for (const dir of pathDirections) {
      for (let i = councilRadius; i < Math.max(size.width, size.height); i++) {
        const px = centerX + dir.dx * i;
        const py = centerY + dir.dy * i;
        if (safeTileSet(tiles, py, px, { biome: BiomeType.DIRT_PATH })) {
          tiles[py][px].materialSubtype = 'worn_earth';
        }
        // Widen path near council
        if (i <= councilRadius + 2) {
          safeTileSet(tiles, py + dir.dx, px - dir.dy, { biome: BiomeType.DIRT_PATH });
          safeTileSet(tiles, py - dir.dx, px + dir.dy, { biome: BiomeType.DIRT_PATH });
        }
      }
    }
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
  const seatRadius = isLonghouse ? 3 : Math.min(4, Math.floor(Math.min(size.width, size.height) / 5));
  
  for (let angle = 0; angle < 360; angle += 45) { // 8 seats in circle
    const radians = (angle * Math.PI) / 180;
    const seatX = Math.round(centerX + seatRadius * Math.cos(radians));
    const seatY = Math.round(centerY + seatRadius * Math.sin(radians));
    
    // Use log seats or stones based on culture
    const seatType = getTribalSeatingType(config.culturalZone);
    if (safeTileSet(tiles, seatY, seatX, { biome: seatType.biome })) {
      // Material subtype removed - not supported on tiles
      tiles[seatY][seatX].isBlocking = seatType.blocking;
      if (seatType.overlay) {
        tiles[seatY][seatX].overlayObject = seatType.overlay;
      }
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
        biome: BiomeType.DIRT_PATH
      });
    }
  }
  
  // Exit zones (multiple directions for natural flow)
  exitZones.push(
    { id: 'south_path', bounds: { x: centerX - 1, y: size.height - 1, width: 3, height: 1 }, type: 'exit', interactions: ['leave'] },
    { id: 'north_path', bounds: { x: centerX - 1, y: 0, width: 3, height: 1 }, type: 'exit', interactions: ['leave'] },
    { id: 'east_path', bounds: { x: size.width - 1, y: centerY - 1, width: 1, height: 3 }, type: 'exit', interactions: ['leave'] },
    { id: 'west_path', bounds: { x: 0, y: centerY - 1, width: 1, height: 3 }, type: 'exit', interactions: ['leave'] }
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

function getTribalSeatingType(culturalZone: string): { biome: BiomeType, material: string, blocking: boolean, overlay?: any } {
  switch (culturalZone) {
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
    case 'NORTH_AMERICAN_COLONIAL':
      return { 
        biome: BiomeType.FLOOR_DIRT, 
        material: 'sitting_spot',
        blocking: false,
        overlay: { type: OverlayObjectType.BENCH, rotation: 0, variant: 'log_seat' }
      };
    case 'SUB_SAHARAN_AFRICAN':
      return { 
        biome: BiomeType.FLOOR_DIRT,
        material: 'sitting_spot',
        blocking: false,
        overlay: { type: OverlayObjectType.STOOL, rotation: 0, variant: 'carved_stool' }
      };
    case 'SOUTH_AMERICAN':
      return { 
        biome: BiomeType.FLOOR_DIRT,
        material: 'sitting_stone',
        blocking: false,
        overlay: { type: OverlayObjectType.ROCK, rotation: 0, variant: 'sitting_stone' }
      };
    case 'OCEANIAN':
      return { 
        biome: BiomeType.FLOOR_DIRT,
        material: 'sitting_spot',
        blocking: false,
        overlay: { type: OverlayObjectType.RUG, rotation: 0, variant: 'woven_mat' }
      };
    default:
      return { 
        biome: BiomeType.FLOOR_DIRT,
        material: 'sitting_spot',
        blocking: false,
        overlay: { type: OverlayObjectType.BENCH, rotation: 0, variant: 'log_seat' }
      };
  }
}

function getNaturalGroundType(config: SpecialMapConfig): BiomeType {
  // Determine natural ground based on climate/region
  if (config.climate) {
    switch (config.climate) {
      case ClimateType.ARCTIC:
      case ClimateType.SUBARCTIC:
        return BiomeType.SNOW;
      case ClimateType.ARID:
      case ClimateType.SEMIARID:
        return BiomeType.DESERT;
      case ClimateType.TROPICAL:
        return BiomeType.JUNGLE;
      case ClimateType.OCEANIC:
        return BiomeType.BEACH;
      case ClimateType.TEMPERATE:
        return BiomeType.GRASSLAND;
      case ClimateType.MEDITERRANEAN:
        return BiomeType.SCRUB;
      default:
        return BiomeType.GRASSLAND;
    }
  }
  
  // Fallback based on cultural zone
  switch (config.culturalZone) {
    case 'MENA':
    case 'SUB_SAHARAN_AFRICAN':
      return BiomeType.DESERT;
    case 'OCEANIAN':
      return BiomeType.BEACH;
    case 'SOUTH_AMERICAN':
      return BiomeType.JUNGLE;
    default:
      return BiomeType.GRASSLAND;
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
      // Add totems or prayer poles (keep existing ground type)
      if (tiles[2]?.[centerX]) {
        tiles[2][centerX].overlayObject = {
          type: OverlayObjectType.TOTEM_POLE,
          rotation: 0,
          variant: 'ceremonial'
        };
      }
      break;
      
    case 'SUB_SAHARAN_AFRICAN':
      // Add drums and ritual objects (keep existing ground type)
      if (tiles[centerY - 2]?.[centerX - 2]) {
        tiles[centerY - 2][centerX - 2].overlayObject = {
          type: OverlayObjectType.DRUM,
          rotation: 0,
          variant: 'talking_drum'
        };
      }
      break;
      
    case 'SOUTH_AMERICAN':
      // Add ceremonial stones (keep existing ground type)
      if (tiles[centerY + 3]?.[centerX]) {
        tiles[centerY + 3][centerX].overlayObject = {
          type: OverlayObjectType.ROCK,
          rotation: 0,
          variant: 'ceremonial'
        };
      }
      break;
      
    case 'OCEANIA':
      // Add meeting stones
      for (let i = 0; i < 3; i++) {
        const stoneX = centerX + (i - 1) * 2;
        const stoneY = size.height - 3;
        safeTileSet(tiles, stoneY, stoneX, { 
          biome: BiomeType.FLOOR_STONE
        });
      }
      break;
  }
}