/**
 * Advanced Lighting & Atmosphere System
 * Phase 2.2 Implementation - Dynamic lighting and cultural atmosphere
 */

import { Tile } from '../../types/mapTypes';
import { OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';

/**
 * Get culturally and era-appropriate lighting
 */
export function getCulturalLighting(
  culturalZone: string,
  era: number,
  roomType: 'formal' | 'casual' | 'religious' | 'work' | 'bedroom',
  isWealthy: boolean = false
): OverlayObjectType {
  // Modern era (post-1900) uses electric lighting
  if (era >= 1900) {
    if (roomType === 'formal' && isWealthy) return OverlayObjectType.CHANDELIER_CRYSTAL;
    if (roomType === 'work') return OverlayObjectType.FLOOR_LAMP;
    return OverlayObjectType.ELECTRIC_LAMP;
  }
  
  // Pre-electric era lighting by culture
  switch (culturalZone) {
    case 'EUROPEAN':
      if (era >= 1500 && era < 1900) {
        // Renaissance to Industrial
        if (roomType === 'formal' && isWealthy) return OverlayObjectType.CHANDELIER_CRYSTAL;
        if (roomType === 'religious') return OverlayObjectType.CANDELABRA_FLOOR;
        if (roomType === 'bedroom') return OverlayObjectType.CANDLE;
        return OverlayObjectType.CANDELABRA_TABLE;
      } else if (era >= 500 && era < 1500) {
        // Medieval
        if (roomType === 'formal') return OverlayObjectType.CHANDELIER_IRON;
        if (roomType === 'religious') return OverlayObjectType.CANDELABRA_FLOOR;
        return OverlayObjectType.WALL_TORCH;
      } else {
        // Ancient
        return OverlayObjectType.OIL_LAMP;
      }
      
    case 'EAST_ASIAN':
      if (roomType === 'formal' || roomType === 'religious') {
        return OverlayObjectType.PAPER_LANTERN;
      }
      if (era >= 1000) {
        return OverlayObjectType.HANGING_LANTERN;
      }
      return OverlayObjectType.OIL_LAMP;
      
    case 'MENA':
      if (roomType === 'formal' && isWealthy && era >= 700) {
        return OverlayObjectType.CHANDELIER;
      }
      if (roomType === 'religious') {
        return OverlayObjectType.HANGING_LANTERN;
      }
      return OverlayObjectType.OIL_LAMP;
      
    case 'SOUTH_ASIAN':
      if (roomType === 'religious') {
        return OverlayObjectType.OIL_LAMP; // Diya lamps
      }
      if (roomType === 'formal' && isWealthy) {
        return OverlayObjectType.CHANDELIER;
      }
      return OverlayObjectType.HANGING_LANTERN;
      
    case 'AFRICAN':
      if (roomType === 'formal' || roomType === 'religious') {
        return OverlayObjectType.BRAZIER;
      }
      return OverlayObjectType.TORCH;
      
    case 'NORTH_AMERICAN':
    case 'SOUTH_AMERICAN':
      if (era < 1500) {
        // Pre-Columbian
        return OverlayObjectType.TORCH;
      }
      // Post-contact follows European patterns
      if (roomType === 'formal' && isWealthy) {
        return OverlayObjectType.CHANDELIER_WOODEN;
      }
      return OverlayObjectType.CANDLE;
      
    case 'OCEANIA':
      return OverlayObjectType.TORCH;
      
    default:
      return OverlayObjectType.TORCH;
  }
}

/**
 * Place chandelier (hanging from ceiling)
 */
export function placeChandelier(
  tiles: Tile[][],
  x: number,
  y: number,
  type: 'crystal' | 'iron' | 'wooden' | 'basic',
  size: 'small' | 'medium' | 'large' = 'medium'
): void {
  let chandelierType: OverlayObjectType;
  
  switch (type) {
    case 'crystal':
      chandelierType = OverlayObjectType.CHANDELIER_CRYSTAL;
      break;
    case 'iron':
      chandelierType = OverlayObjectType.CHANDELIER_IRON;
      break;
    case 'wooden':
      chandelierType = OverlayObjectType.CHANDELIER_WOODEN;
      break;
    default:
      chandelierType = OverlayObjectType.CHANDELIER;
  }
  
  // Chandelier occupies ceiling space (doesn't block movement)
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: chandelierType,
      rotation: 0,
      variant: size
    };
    tiles[y][x].isBlocking = false;
    tiles[y][x].isLightSource = true;
    tiles[y][x].lightRadius = size === 'large' ? 5 : size === 'medium' ? 3 : 2;
  }
}

/**
 * Place hanging lanterns (East Asian style)
 */
export function placeHangingLantern(
  tiles: Tile[][],
  x: number,
  y: number,
  style: 'paper' | 'metal' | 'silk' = 'paper',
  color: string = 'red'
): void {
  const lanternType = style === 'paper' ? OverlayObjectType.PAPER_LANTERN : OverlayObjectType.HANGING_LANTERN;
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: lanternType,
      rotation: 0,
      material: color,
      variant: style
    };
    tiles[y][x].isBlocking = false;
    tiles[y][x].isLightSource = true;
    tiles[y][x].lightRadius = 2;
  }
}

/**
 * Place fireplace/hearth
 */
export function placeFireplace(
  tiles: Tile[][],
  x: number,
  y: number,
  wallSide: 'north' | 'south' | 'east' | 'west',
  type: 'stone' | 'brick' | 'marble' | 'hearth',
  includeMantle: boolean = true
): void {
  // Fireplace is 3 tiles wide
  const width = 3;
  const depth = type === 'hearth' ? 2 : 1;
  
  // Determine fireplace orientation and position
  let startX = x;
  let startY = y;
  
  if (wallSide === 'north' || wallSide === 'south') {
    startX = x - 1; // Center the 3-wide fireplace
  } else {
    startY = y - 1; // Center vertically for east/west walls
  }
  
  // Place fireplace base
  for (let i = 0; i < width; i++) {
    const tileX = wallSide === 'east' || wallSide === 'west' ? startX : startX + i;
    const tileY = wallSide === 'north' || wallSide === 'south' ? startY : startY + i;
    
    if (tiles[tileY]?.[tileX]) {
      let fireplaceType: OverlayObjectType;
      
      if (type === 'hearth') {
        fireplaceType = i === 1 ? OverlayObjectType.HEARTH_COOKING : OverlayObjectType.HEARTH;
      } else {
        switch (type) {
          case 'stone':
            fireplaceType = OverlayObjectType.FIREPLACE_STONE;
            break;
          case 'brick':
            fireplaceType = OverlayObjectType.FIREPLACE_BRICK;
            break;
          case 'marble':
            fireplaceType = OverlayObjectType.FIREPLACE_MARBLE;
            break;
          default:
            fireplaceType = OverlayObjectType.FIREPLACE;
        }
      }
      
      tiles[tileY][tileX].overlayObject = {
        type: fireplaceType,
        rotation: getWallRotation(wallSide),
        variant: i === 0 ? 'left' : i === width - 1 ? 'right' : 'center'
      };
      tiles[tileY][tileX].isBlocking = true;
      tiles[tileY][tileX].isLightSource = true;
      tiles[tileY][tileX].lightRadius = 3;
    }
  }
  
  // Add chimney/flue indication if not a hearth
  if (type !== 'hearth' && includeMantle) {
    const mantleY = wallSide === 'north' ? startY - 1 : wallSide === 'south' ? startY + 1 : startY;
    const mantleX = wallSide === 'west' ? startX - 1 : wallSide === 'east' ? startX + 1 : startX + 1;
    
    if (tiles[mantleY]?.[mantleX]) {
      tiles[mantleY][mantleX].overlayObject = {
        type: OverlayObjectType.MANTLE,
        rotation: getWallRotation(wallSide),
        material: type
      };
      tiles[mantleY][mantleX].isBlocking = false;
    }
  }
}

/**
 * Place wall-mounted lighting
 */
export function placeWallSconce(
  tiles: Tile[][],
  x: number,
  y: number,
  wallSide: 'north' | 'south' | 'east' | 'west',
  type: 'torch' | 'sconce' | 'lamp',
  material: string = 'iron'
): void {
  let sconceType: OverlayObjectType;
  
  switch (type) {
    case 'torch':
      sconceType = OverlayObjectType.WALL_TORCH;
      break;
    case 'lamp':
      sconceType = OverlayObjectType.ELECTRIC_LAMP;
      break;
    default:
      sconceType = OverlayObjectType.WALL_SCONCE;
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: sconceType,
      rotation: getWallRotation(wallSide),
      material
    };
    tiles[y][x].isBlocking = false;
    tiles[y][x].isLightSource = true;
    tiles[y][x].lightRadius = 2;
  }
}

/**
 * Place candles and candelabras
 */
export function placeCandle(
  tiles: Tile[][],
  x: number,
  y: number,
  type: 'single' | 'candelabra_table' | 'candelabra_floor',
  candleCount: number = 1
): void {
  let candleType: OverlayObjectType;
  
  switch (type) {
    case 'candelabra_table':
      candleType = OverlayObjectType.CANDELABRA_TABLE;
      break;
    case 'candelabra_floor':
      candleType = OverlayObjectType.CANDELABRA_FLOOR;
      break;
    default:
      candleType = OverlayObjectType.CANDLE;
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: candleType,
      rotation: 0,
      variant: `candles_${candleCount}`
    };
    tiles[y][x].isBlocking = type === 'candelabra_floor';
    tiles[y][x].isLightSource = true;
    tiles[y][x].lightRadius = type === 'candelabra_floor' ? 3 : candleCount > 3 ? 2 : 1;
  }
}

/**
 * Place oil lamps (ancient/medieval lighting)
 */
export function placeOilLamp(
  tiles: Tile[][],
  x: number,
  y: number,
  style: string = 'bronze',
  isHanging: boolean = false
): void {
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: OverlayObjectType.OIL_LAMP,
      rotation: 0,
      material: style,
      variant: isHanging ? 'hanging' : 'table'
    };
    tiles[y][x].isBlocking = false;
    tiles[y][x].isLightSource = true;
    tiles[y][x].lightRadius = 2;
  }
}

/**
 * Place cooking/heating stoves
 */
export function placeStove(
  tiles: Tile[][],
  x: number,
  y: number,
  type: 'wood' | 'coal',
  size: 'small' | 'large' = 'small'
): void {
  const stoveType = type === 'wood' ? OverlayObjectType.STOVE_WOOD : OverlayObjectType.STOVE_COAL;
  
  if (size === 'large') {
    // Large stove is 2x2
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (tiles[y + dy]?.[x + dx]) {
          tiles[y + dy][x + dx].overlayObject = {
            type: stoveType,
            rotation: 0,
            variant: `${dx}_${dy}`
          };
          tiles[y + dy][x + dx].isBlocking = true;
          tiles[y + dy][x + dx].isLightSource = true;
          tiles[y + dy][x + dx].lightRadius = 2;
        }
      }
    }
  } else {
    // Small stove is single tile
    if (tiles[y]?.[x]) {
      tiles[y][x].overlayObject = {
        type: stoveType,
        rotation: 0,
        variant: 'small'
      };
      tiles[y][x].isBlocking = true;
      tiles[y][x].isLightSource = true;
      tiles[y][x].lightRadius = 2;
    }
  }
}

/**
 * Intelligent lighting placement for a room
 */
export function lightRoom(
  tiles: Tile[][],
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  culturalZone: string,
  era: number,
  roomType: 'formal' | 'casual' | 'religious' | 'work' | 'bedroom',
  isWealthy: boolean = false
): void {
  const centerX = roomX + Math.floor(roomWidth / 2);
  const centerY = roomY + Math.floor(roomHeight / 2);
  
  // Get appropriate lighting type
  const lightingType = getCulturalLighting(culturalZone, era, roomType, isWealthy);
  
  // Place central ceiling light if appropriate
  if (lightingType === OverlayObjectType.CHANDELIER ||
      lightingType === OverlayObjectType.CHANDELIER_CRYSTAL ||
      lightingType === OverlayObjectType.CHANDELIER_IRON ||
      lightingType === OverlayObjectType.CHANDELIER_WOODEN) {
    const chandelierType = lightingType === OverlayObjectType.CHANDELIER_CRYSTAL ? 'crystal' :
                           lightingType === OverlayObjectType.CHANDELIER_IRON ? 'iron' :
                           lightingType === OverlayObjectType.CHANDELIER_WOODEN ? 'wooden' : 'basic';
    const size = roomWidth > 15 ? 'large' : roomWidth > 8 ? 'medium' : 'small';
    placeChandelier(tiles, centerX, centerY, chandelierType, size);
  }
  
  // Place wall sconces for larger rooms
  if (roomWidth > 10 && era < 1900) {
    // Place sconces along walls
    const spacing = 5;
    
    // North wall
    for (let x = roomX + 2; x < roomX + roomWidth - 2; x += spacing) {
      if (lightingType === OverlayObjectType.WALL_TORCH) {
        placeWallSconce(tiles, x, roomY + 1, 'north', 'torch');
      } else if (era >= 500) {
        placeWallSconce(tiles, x, roomY + 1, 'north', 'sconce');
      }
    }
    
    // South wall
    for (let x = roomX + 2; x < roomX + roomWidth - 2; x += spacing) {
      if (lightingType === OverlayObjectType.WALL_TORCH) {
        placeWallSconce(tiles, x, roomY + roomHeight - 2, 'south', 'torch');
      } else if (era >= 500) {
        placeWallSconce(tiles, x, roomY + roomHeight - 2, 'south', 'sconce');
      }
    }
  }
  
  // Place lanterns for East Asian styles
  if (culturalZone === 'EAST_ASIAN' && (lightingType === OverlayObjectType.PAPER_LANTERN || 
      lightingType === OverlayObjectType.HANGING_LANTERN)) {
    // Place lanterns in corners
    placeHangingLantern(tiles, roomX + 2, roomY + 2, 'paper', 'red');
    placeHangingLantern(tiles, roomX + roomWidth - 3, roomY + 2, 'paper', 'red');
    placeHangingLantern(tiles, roomX + 2, roomY + roomHeight - 3, 'paper', 'red');
    placeHangingLantern(tiles, roomX + roomWidth - 3, roomY + roomHeight - 3, 'paper', 'red');
  }
  
  // Place fireplace for cold climates and appropriate eras
  if (roomType !== 'work' && era < 1950 && (culturalZone === 'EUROPEAN' || culturalZone === 'NORTH_AMERICAN')) {
    if (roomWidth > 8 && roomHeight > 8) {
      const fireplaceType = isWealthy && era >= 1500 ? 'marble' :
                            era >= 1000 ? 'brick' : 'stone';
      placeFireplace(tiles, centerX, roomY + 1, 'north', fireplaceType);
    }
  }
  
  // Place candles on tables for intimate lighting
  if (roomType === 'bedroom' || (roomType === 'casual' && era < 1900)) {
    // Add small candles near beds or seating areas
    // This would be called after furniture placement in practice
  }
}

/**
 * Helper function to get wall rotation
 */
function getWallRotation(wallSide: string): number {
  switch (wallSide) {
    case 'north': return 180;
    case 'south': return 0;
    case 'east': return 270;
    case 'west': return 90;
    default: return 0;
  }
}

/**
 * Create ambient lighting patterns
 */
export function createAmbientLighting(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  pattern: 'perimeter' | 'grid' | 'corners' | 'pathway',
  lightType: OverlayObjectType,
  spacing: number = 4
): void {
  switch (pattern) {
    case 'perimeter':
      // Lights around the edge
      for (let dx = 0; dx < width; dx += spacing) {
        placeLightAtPosition(tiles, x + dx, y, lightType);
        placeLightAtPosition(tiles, x + dx, y + height - 1, lightType);
      }
      for (let dy = spacing; dy < height - spacing; dy += spacing) {
        placeLightAtPosition(tiles, x, y + dy, lightType);
        placeLightAtPosition(tiles, x + width - 1, y + dy, lightType);
      }
      break;
      
    case 'grid':
      // Regular grid of lights
      for (let dy = spacing / 2; dy < height; dy += spacing) {
        for (let dx = spacing / 2; dx < width; dx += spacing) {
          placeLightAtPosition(tiles, x + dx, y + dy, lightType);
        }
      }
      break;
      
    case 'corners':
      // Lights in corners only
      placeLightAtPosition(tiles, x + 1, y + 1, lightType);
      placeLightAtPosition(tiles, x + width - 2, y + 1, lightType);
      placeLightAtPosition(tiles, x + 1, y + height - 2, lightType);
      placeLightAtPosition(tiles, x + width - 2, y + height - 2, lightType);
      break;
      
    case 'pathway':
      // Lights along a central path
      const pathX = x + Math.floor(width / 2);
      for (let dy = 1; dy < height - 1; dy += spacing) {
        placeLightAtPosition(tiles, pathX - 1, y + dy, lightType);
        placeLightAtPosition(tiles, pathX + 1, y + dy, lightType);
      }
      break;
  }
}

/**
 * Helper to place a light at a position
 */
function placeLightAtPosition(
  tiles: Tile[][],
  x: number,
  y: number,
  lightType: OverlayObjectType
): void {
  if (!tiles[y]?.[x] || tiles[y][x].overlayObject) return;
  
  switch (lightType) {
    case OverlayObjectType.CANDLE:
      placeCandle(tiles, x, y, 'single', 1);
      break;
    case OverlayObjectType.OIL_LAMP:
      placeOilLamp(tiles, x, y, 'bronze', false);
      break;
    case OverlayObjectType.ELECTRIC_LAMP:
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.ELECTRIC_LAMP,
        rotation: 0
      };
      tiles[y][x].isLightSource = true;
      tiles[y][x].lightRadius = 2;
      break;
    case OverlayObjectType.TORCH:
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.TORCH,
        rotation: 0
      };
      tiles[y][x].isBlocking = true;
      tiles[y][x].isLightSource = true;
      tiles[y][x].lightRadius = 3;
      break;
  }
}