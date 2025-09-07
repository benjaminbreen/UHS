/**
 * Advanced Multi-Tile Furniture System
 * Phase 2.1 Implementation - Complex furniture layouts
 */

import { Tile } from '../../types/mapTypes';
import { OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';

/**
 * L-Shaped Table Configuration
 * Creates tables that turn corners for dining areas
 */
export function placeLShapedTable(
  tiles: Tile[][],
  x: number,
  y: number,
  horizontalLength: number,
  verticalLength: number,
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  material: string = 'oak'
): void {
  // Place horizontal section
  const horizontalY = corner.includes('top') ? y : y + verticalLength - 1;
  const horizontalStartX = corner.includes('left') ? x : x - horizontalLength + 1;
  
  for (let i = 0; i < horizontalLength; i++) {
    const tileX = horizontalStartX + i;
    if (tiles[horizontalY]?.[tileX]) {
      tiles[horizontalY][tileX].overlayObject = {
        type: i === 0 ? OverlayObjectType.TABLE_LEFT :
              i === horizontalLength - 1 ? OverlayObjectType.TABLE_RIGHT :
              OverlayObjectType.TABLE_CENTER,
        rotation: 0,
        material
      };
      tiles[horizontalY][tileX].isBlocking = true;
    }
  }
  
  // Place vertical section
  const verticalX = corner.includes('left') ? x : x;
  const verticalStartY = corner.includes('top') ? y : y;
  
  for (let i = 0; i < verticalLength; i++) {
    const tileY = verticalStartY + i;
    // Skip the corner tile (already placed)
    if (tileY === horizontalY) continue;
    
    if (tiles[tileY]?.[verticalX]) {
      tiles[tileY][verticalX].overlayObject = {
        type: i === 0 ? OverlayObjectType.TABLE_LEFT :
              i === verticalLength - 1 ? OverlayObjectType.TABLE_RIGHT :
              OverlayObjectType.TABLE_CENTER,
        rotation: 90, // Vertical orientation
        material
      };
      tiles[tileY][verticalX].isBlocking = true;
    }
  }
  
  // Place special corner piece
  if (tiles[horizontalY]?.[verticalX]) {
    tiles[horizontalY][verticalX].overlayObject = {
      type: OverlayObjectType.TABLE_CORNER,
      rotation: getCornerRotation(corner),
      material
    };
    tiles[horizontalY][verticalX].isBlocking = true;
  }
}

/**
 * Round Table System
 * Creates circular tables of various sizes
 */
export function placeRoundTable(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  radius: number,
  material: string = 'oak'
): void {
  // Small round table (1 tile)
  if (radius === 0) {
    if (tiles[centerY]?.[centerX]) {
      tiles[centerY][centerX].overlayObject = {
        type: OverlayObjectType.TABLE_ROUND_SMALL,
        rotation: 0,
        material
      };
      tiles[centerY][centerX].isBlocking = true;
    }
    return;
  }
  
  // Medium round table (3x3)
  if (radius === 1) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tileX = centerX + dx;
        const tileY = centerY + dy;
        if (tiles[tileY]?.[tileX]) {
          // Determine which part of the round table this is
          let tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_CENTER;
          if (dy === -1 && dx === 0) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_TOP;
          else if (dy === 1 && dx === 0) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM;
          else if (dy === 0 && dx === -1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_LEFT;
          else if (dy === 0 && dx === 1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_RIGHT;
          else if (dy === -1 && dx === -1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_TOP_LEFT;
          else if (dy === -1 && dx === 1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_TOP_RIGHT;
          else if (dy === 1 && dx === -1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM_LEFT;
          else if (dy === 1 && dx === 1) tableType = OverlayObjectType.TABLE_ROUND_MEDIUM_BOTTOM_RIGHT;
          
          tiles[tileY][tileX].overlayObject = {
            type: tableType,
            rotation: 0,
            material
          };
          tiles[tileY][tileX].isBlocking = true;
        }
      }
    }
  }
  
  // Large round table (5x5 with rounded corners)
  if (radius === 2) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        // Skip extreme corners for round shape
        if (Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;
        
        const tileX = centerX + dx;
        const tileY = centerY + dy;
        if (tiles[tileY]?.[tileX]) {
          tiles[tileY][tileX].overlayObject = {
            type: OverlayObjectType.TABLE_ROUND_LARGE,
            rotation: 0,
            material,
            variant: `${dx}_${dy}` // Position identifier for rendering
          };
          tiles[tileY][tileX].isBlocking = true;
        }
      }
    }
  }
}

/**
 * Banquet Table System
 * Creates very long tables for feast halls
 */
export function placeBanquetTable(
  tiles: Tile[][],
  x: number,
  y: number,
  length: number,
  width: number = 2,
  material: string = 'oak'
): void {
  for (let w = 0; w < width; w++) {
    for (let l = 0; l < length; l++) {
      const tileX = x + l;
      const tileY = y + w;
      
      if (tiles[tileY]?.[tileX]) {
        let tableType: OverlayObjectType;
        
        // Determine table piece based on position
        if (width === 1) {
          // Single-width banquet table
          tableType = l === 0 ? OverlayObjectType.TABLE_LEFT :
                     l === length - 1 ? OverlayObjectType.TABLE_RIGHT :
                     OverlayObjectType.TABLE_CENTER;
        } else {
          // Double-width banquet table
          if (w === 0) {
            tableType = l === 0 ? OverlayObjectType.BANQUET_TABLE_TOP_LEFT :
                       l === length - 1 ? OverlayObjectType.BANQUET_TABLE_TOP_RIGHT :
                       OverlayObjectType.BANQUET_TABLE_TOP_CENTER;
          } else {
            tableType = l === 0 ? OverlayObjectType.BANQUET_TABLE_BOTTOM_LEFT :
                       l === length - 1 ? OverlayObjectType.BANQUET_TABLE_BOTTOM_RIGHT :
                       OverlayObjectType.BANQUET_TABLE_BOTTOM_CENTER;
          }
        }
        
        tiles[tileY][tileX].overlayObject = {
          type: tableType,
          rotation: 0,
          material
        };
        tiles[tileY][tileX].isBlocking = true;
      }
    }
  }
}

/**
 * Four-Poster Bed System
 * Creates luxury beds with posts at corners
 */
export function placeFourPosterBed(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  material: string = 'mahogany'
): void {
  // Bed is 2x3 tiles
  const bedWidth = 2;
  const bedLength = 3;
  
  for (let dy = 0; dy < bedLength; dy++) {
    for (let dx = 0; dx < bedWidth; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      
      if (tiles[tileY]?.[tileX]) {
        let bedType: OverlayObjectType;
        
        // Determine which part of the bed
        if (dy === 0 && dx === 0) bedType = OverlayObjectType.FOUR_POSTER_BED_TOP_LEFT;
        else if (dy === 0 && dx === 1) bedType = OverlayObjectType.FOUR_POSTER_BED_TOP_RIGHT;
        else if (dy === 1 && dx === 0) bedType = OverlayObjectType.FOUR_POSTER_BED_MIDDLE_LEFT;
        else if (dy === 1 && dx === 1) bedType = OverlayObjectType.FOUR_POSTER_BED_MIDDLE_RIGHT;
        else if (dy === 2 && dx === 0) bedType = OverlayObjectType.FOUR_POSTER_BED_BOTTOM_LEFT;
        else bedType = OverlayObjectType.FOUR_POSTER_BED_BOTTOM_RIGHT;
        
        tiles[tileY][tileX].overlayObject = {
          type: bedType,
          rotation: 0,
          material,
          variant: culturalZone
        };
        tiles[tileY][tileX].isBlocking = true;
      }
    }
  }
}

/**
 * Daybed/Lounge System
 * Creates reclining furniture for relaxation areas
 */
export function placeDaybed(
  tiles: Tile[][],
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical',
  culturalZone: string,
  material: string = 'silk'
): void {
  const length = 3;
  const width = 1;
  
  for (let i = 0; i < length; i++) {
    const tileX = orientation === 'horizontal' ? x + i : x;
    const tileY = orientation === 'horizontal' ? y : y + i;
    
    if (tiles[tileY]?.[tileX]) {
      let daybedType: OverlayObjectType;
      
      if (i === 0) daybedType = OverlayObjectType.DAYBED_HEAD;
      else if (i === length - 1) daybedType = OverlayObjectType.DAYBED_FOOT;
      else daybedType = OverlayObjectType.DAYBED_MIDDLE;
      
      tiles[tileY][tileX].overlayObject = {
        type: daybedType,
        rotation: orientation === 'vertical' ? 90 : 0,
        material,
        variant: culturalZone
      };
      tiles[tileY][tileX].isBlocking = true;
    }
  }
}

/**
 * Booth Seating System
 * Creates restaurant-style booth seating with integrated tables
 */
export function placeBoothSeating(
  tiles: Tile[][],
  x: number,
  y: number,
  boothLength: number = 3,
  material: string = 'vinyl_red'
): void {
  // Place back bench (against wall)
  for (let i = 0; i < boothLength; i++) {
    if (tiles[y]?.[x + i]) {
      tiles[y][x + i].overlayObject = {
        type: OverlayObjectType.BOOTH_BACK,
        rotation: 0,
        material,
        variant: i === 0 ? 'left' : i === boothLength - 1 ? 'right' : 'center'
      };
      tiles[y][x + i].isBlocking = true;
    }
  }
  
  // Place table in middle
  for (let i = 0; i < boothLength; i++) {
    if (tiles[y + 1]?.[x + i]) {
      tiles[y + 1][x + i].overlayObject = {
        type: i === 0 ? OverlayObjectType.TABLE_LEFT :
              i === boothLength - 1 ? OverlayObjectType.TABLE_RIGHT :
              OverlayObjectType.TABLE_CENTER,
        rotation: 0,
        material: 'formica'
      };
      tiles[y + 1][x + i].isBlocking = true;
    }
  }
  
  // Place front bench
  for (let i = 0; i < boothLength; i++) {
    if (tiles[y + 2]?.[x + i]) {
      tiles[y + 2][x + i].overlayObject = {
        type: OverlayObjectType.BOOTH_FRONT,
        rotation: 180,
        material,
        variant: i === 0 ? 'left' : i === boothLength - 1 ? 'right' : 'center'
      };
      tiles[y + 2][x + i].isBlocking = true;
    }
  }
}

/**
 * Theater Seating Rows
 * Creates rows of connected seats for theaters and lecture halls
 */
export function placeTheaterRow(
  tiles: Tile[][],
  x: number,
  y: number,
  seatCount: number,
  rowNumber: number,
  material: string = 'velvet_red'
): void {
  for (let i = 0; i < seatCount; i++) {
    const tileX = x + i;
    
    if (tiles[y]?.[tileX]) {
      let seatType: OverlayObjectType;
      
      // Determine seat type based on position
      if (i === 0) seatType = OverlayObjectType.THEATER_SEAT_LEFT;
      else if (i === seatCount - 1) seatType = OverlayObjectType.THEATER_SEAT_RIGHT;
      else seatType = OverlayObjectType.THEATER_SEAT_CENTER;
      
      tiles[y][tileX].overlayObject = {
        type: seatType,
        rotation: 0,
        material,
        variant: `row_${rowNumber}`
      };
      tiles[y][tileX].isBlocking = true;
    }
  }
}

/**
 * Furniture Connection Logic
 * Detects adjacent furniture and updates sprites for seamless connections
 */
export function updateFurnitureConnections(
  tiles: Tile[][],
  x: number,
  y: number
): void {
  const tile = tiles[y]?.[x];
  if (!tile?.overlayObject) return;
  
  const currentType = tile.overlayObject.type;
  
  // Check if this is a connectable furniture type
  const connectableTypes = [
    OverlayObjectType.TABLE_CENTER,
    OverlayObjectType.BENCH,
    OverlayObjectType.BENCH_EAST_WEST,
    OverlayObjectType.BENCH_NORTH_SOUTH
  ];
  
  if (!connectableTypes.includes(currentType)) return;
  
  // Check adjacent tiles for matching furniture
  const north = tiles[y - 1]?.[x]?.overlayObject;
  const south = tiles[y + 1]?.[x]?.overlayObject;
  const east = tiles[y]?.[x + 1]?.overlayObject;
  const west = tiles[y]?.[x - 1]?.overlayObject;
  
  // Determine connection pattern
  let connectionPattern = '';
  if (north?.type === currentType) connectionPattern += 'N';
  if (south?.type === currentType) connectionPattern += 'S';
  if (east?.type === currentType) connectionPattern += 'E';
  if (west?.type === currentType) connectionPattern += 'W';
  
  // Update variant based on connections
  if (connectionPattern) {
    tile.overlayObject.variant = `connected_${connectionPattern}`;
  }
}

/**
 * Helper function to get corner rotation
 */
function getCornerRotation(corner: string): number {
  switch (corner) {
    case 'top-left': return 0;
    case 'top-right': return 90;
    case 'bottom-right': return 180;
    case 'bottom-left': return 270;
    default: return 0;
  }
}

/**
 * Smart Table Placement
 * Automatically creates appropriate table configuration based on room
 */
export function placeSmartTable(
  tiles: Tile[][],
  x: number,
  y: number,
  roomWidth: number,
  roomHeight: number,
  roomType: 'dining' | 'meeting' | 'casual' | 'banquet',
  culturalZone: string,
  material?: string
): void {
  // Determine material based on culture and room type
  if (!material) {
    if (culturalZone === 'EAST_ASIAN') material = 'lacquered_wood';
    else if (culturalZone === 'MENA') material = 'cedar';
    else if (roomType === 'banquet') material = 'mahogany';
    else if (roomType === 'casual') material = 'pine';
    else material = 'oak';
  }
  
  switch (roomType) {
    case 'dining':
      // Use round table for small rooms, rectangular for larger
      if (roomWidth <= 5 && roomHeight <= 5) {
        placeRoundTable(tiles, x + Math.floor(roomWidth / 2), y + Math.floor(roomHeight / 2), 1, material);
      } else {
        const tableLength = Math.min(roomWidth - 2, 8);
        placeBanquetTable(tiles, x + 1, y + Math.floor(roomHeight / 2), tableLength, 1, material);
      }
      break;
      
    case 'meeting':
      // L-shaped or rectangular based on room shape
      if (roomWidth > 8 && roomHeight > 8) {
        placeLShapedTable(tiles, x + 2, y + 2, roomWidth - 4, roomHeight - 4, 'top-left', material);
      } else {
        placeRoundTable(tiles, x + Math.floor(roomWidth / 2), y + Math.floor(roomHeight / 2), 2, material);
      }
      break;
      
    case 'casual':
      // Multiple small tables
      const tableSpacing = 4;
      for (let ty = y + 1; ty < y + roomHeight - 2; ty += tableSpacing) {
        for (let tx = x + 1; tx < x + roomWidth - 2; tx += tableSpacing) {
          placeRoundTable(tiles, tx, ty, 0, material);
        }
      }
      break;
      
    case 'banquet':
      // Long banquet table
      const banquetLength = Math.min(roomWidth - 2, 15);
      placeBanquetTable(tiles, x + 1, y + Math.floor(roomHeight / 2) - 1, banquetLength, 2, material);
      break;
  }
}