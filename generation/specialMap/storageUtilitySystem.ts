/**
 * Storage & Utility Furniture System
 * Phase 2.3 Implementation - Culturally-aware storage and utility furniture
 */

import { Tile } from '../../types/mapTypes';
import { OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';

/**
 * Get culturally appropriate storage type
 */
export function getCulturalStorage(
  culturalZone: string,
  era: number,
  storageType: 'general' | 'food' | 'clothing' | 'documents' | 'valuables' | 'tools'
): OverlayObjectType {
  // Modern era uses specialized furniture
  if (era >= 1900) {
    switch (storageType) {
      case 'documents': return OverlayObjectType.FILING_CABINET;
      case 'food': return OverlayObjectType.REFRIGERATOR;
      case 'clothing': return OverlayObjectType.WARDROBE;
      case 'tools': return OverlayObjectType.TOOL_CABINET;
      default: return OverlayObjectType.CABINET;
    }
  }
  
  // Historical storage by culture
  switch (culturalZone) {
    case 'EUROPEAN':
      if (era >= 1500) {
        switch (storageType) {
          case 'valuables': return OverlayObjectType.CHEST_ORNATE;
          case 'clothing': return OverlayObjectType.ARMOIRE;
          case 'food': return OverlayObjectType.PANTRY_CABINET;
          case 'documents': return OverlayObjectType.BOOKSHELF;
          default: return OverlayObjectType.CABINET;
        }
      } else {
        // Medieval
        switch (storageType) {
          case 'valuables': return OverlayObjectType.CHEST_REINFORCED;
          case 'food': return OverlayObjectType.BARREL;
          case 'tools': return OverlayObjectType.TOOL_RACK;
          default: return OverlayObjectType.CHEST;
        }
      }
      
    case 'EAST_ASIAN':
      switch (storageType) {
        case 'clothing': return OverlayObjectType.TANSU;
        case 'food': return OverlayObjectType.RICE_CHEST;
        case 'documents': return OverlayObjectType.SCROLL_RACK;
        case 'valuables': return OverlayObjectType.LACQUER_BOX;
        default: return OverlayObjectType.CHEST;
      }
      
    case 'MENA':
      switch (storageType) {
        case 'clothing': return OverlayObjectType.CEDAR_CHEST;
        case 'food': return OverlayObjectType.SPICE_CABINET;
        case 'valuables': return OverlayObjectType.CHEST_ORNATE;
        default: return OverlayObjectType.CHEST;
      }
      
    case 'AFRICAN':
      switch (storageType) {
        case 'food': return OverlayObjectType.GRANARY_BASKET;
        case 'clothing': return OverlayObjectType.WOVEN_CHEST;
        case 'tools': return OverlayObjectType.TOOL_RACK;
        default: return OverlayObjectType.BASKET;
      }
      
    default:
      return OverlayObjectType.CHEST;
  }
}

/**
 * Place wine rack
 */
export function placeWineRack(
  tiles: Tile[][],
  x: number,
  y: number,
  size: 'small' | 'large' = 'small',
  material: string = 'oak'
): void {
  if (size === 'large') {
    // Large wine rack is 2 tiles wide
    for (let dx = 0; dx < 2; dx++) {
      if (tiles[y]?.[x + dx]) {
        tiles[y][x + dx].overlayObject = {
          type: OverlayObjectType.WINE_RACK,
          rotation: 0,
          material,
          variant: dx === 0 ? 'left' : 'right'
        };
        tiles[y][x + dx].isBlocking = true;
      }
    }
  } else {
    // Small wine rack is single tile
    if (tiles[y]?.[x]) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.WINE_RACK,
        rotation: 0,
        material,
        variant: 'small'
      };
      tiles[y][x].isBlocking = true;
    }
  }
}

/**
 * Place spice cabinet/rack
 */
export function placeSpiceStorage(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  wallMounted: boolean = false
): void {
  const spiceType = culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN' ? 
                    OverlayObjectType.SPICE_CABINET : 
                    OverlayObjectType.SPICE_RACK;
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: spiceType,
      rotation: 0,
      variant: wallMounted ? 'wall' : 'standing'
    };
    tiles[y][x].isBlocking = !wallMounted;
  }
}

/**
 * Place tool storage
 */
export function placeToolStorage(
  tiles: Tile[][],
  x: number,
  y: number,
  storageType: 'chest' | 'cabinet' | 'rack' | 'bench',
  era: number
): void {
  let toolStorageType: OverlayObjectType;
  
  switch (storageType) {
    case 'rack':
      toolStorageType = OverlayObjectType.TOOL_RACK;
      break;
    case 'cabinet':
      toolStorageType = era >= 1800 ? OverlayObjectType.TOOL_CABINET : OverlayObjectType.CHEST;
      break;
    case 'bench':
      toolStorageType = OverlayObjectType.WORKBENCH;
      break;
    default:
      toolStorageType = OverlayObjectType.TOOL_CHEST;
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: toolStorageType,
      rotation: 0,
      material: 'oak'
    };
    tiles[y][x].isBlocking = true;
  }
}

/**
 * Kitchen utility placement system
 */
export function placeKitchenUtility(
  tiles: Tile[][],
  x: number,
  y: number,
  utilityType: 'stove' | 'sink' | 'counter' | 'oven' | 'refrigerator',
  culturalZone: string,
  era: number
): void {
  let kitchenType: OverlayObjectType;
  let material = 'wood';
  
  // Era-based kitchen technology
  if (era >= 1950) {
    switch (utilityType) {
      case 'stove':
        kitchenType = OverlayObjectType.STOVE_ELECTRIC;
        material = 'steel';
        break;
      case 'sink':
        kitchenType = OverlayObjectType.KITCHEN_SINK_MODERN;
        material = 'steel';
        break;
      case 'refrigerator':
        kitchenType = OverlayObjectType.REFRIGERATOR;
        material = 'white';
        break;
      case 'oven':
        kitchenType = OverlayObjectType.OVEN_ELECTRIC;
        material = 'steel';
        break;
      default:
        kitchenType = OverlayObjectType.KITCHEN_COUNTER;
        material = 'formica';
    }
  } else if (era >= 1800) {
    switch (utilityType) {
      case 'stove':
        kitchenType = OverlayObjectType.STOVE_COAL;
        material = 'iron';
        break;
      case 'sink':
        kitchenType = OverlayObjectType.KITCHEN_SINK;
        material = 'ceramic';
        break;
      case 'oven':
        kitchenType = OverlayObjectType.OVEN_BRICK;
        material = 'brick';
        break;
      default:
        kitchenType = OverlayObjectType.KITCHEN_COUNTER;
        material = 'wood';
    }
  } else {
    // Pre-industrial
    switch (utilityType) {
      case 'stove':
      case 'oven':
        kitchenType = OverlayObjectType.HEARTH_COOKING;
        material = 'stone';
        break;
      case 'sink':
        kitchenType = OverlayObjectType.BASIN;
        material = culturalZone === 'EAST_ASIAN' ? 'ceramic' : 'stone';
        break;
      default:
        kitchenType = OverlayObjectType.KITCHEN_COUNTER;
        material = 'wood';
    }
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: kitchenType,
      rotation: 0,
      material
    };
    tiles[y][x].isBlocking = true;
  }
}

/**
 * Place kitchen work triangle
 */
export function placeKitchenWorkTriangle(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  culturalZone: string,
  era: number
): void {
  // Place stove on one wall
  placeKitchenUtility(tiles, x + 1, y, 'stove', culturalZone, era);
  
  // Place sink on adjacent wall
  placeKitchenUtility(tiles, x + width - 2, y + 1, 'sink', culturalZone, era);
  
  // Place refrigerator/cold storage if era appropriate
  if (era >= 1920) {
    placeKitchenUtility(tiles, x + width - 2, y + height - 2, 'refrigerator', culturalZone, era);
  } else if (era >= 1500) {
    // Ice box or pantry
    if (tiles[y + height - 2]?.[x + width - 2]) {
      tiles[y + height - 2][x + width - 2].overlayObject = {
        type: OverlayObjectType.ICE_BOX,
        rotation: 0,
        material: 'oak'
      };
      tiles[y + height - 2][x + width - 2].isBlocking = true;
    }
  }
  
  // Fill in with counters
  for (let dx = 2; dx < width - 2; dx++) {
    if (!tiles[y]?.[x + dx]?.overlayObject) {
      placeKitchenUtility(tiles, x + dx, y, 'counter', culturalZone, era);
    }
  }
  for (let dy = 2; dy < height - 2; dy++) {
    if (!tiles[y + dy]?.[x + width - 2]?.overlayObject) {
      placeKitchenUtility(tiles, x + width - 2, y + dy, 'counter', culturalZone, era);
    }
  }
}

/**
 * Bathroom fixtures placement
 */
export function placeBathroomFixture(
  tiles: Tile[][],
  x: number,
  y: number,
  fixtureType: 'toilet' | 'sink' | 'bath' | 'shower',
  era: number,
  isLuxury: boolean = false
): void {
  let fixtureOverlayType: OverlayObjectType;
  let material = 'ceramic';
  
  if (era >= 1900) {
    // Modern fixtures
    switch (fixtureType) {
      case 'toilet':
        fixtureOverlayType = OverlayObjectType.TOILET;
        break;
      case 'sink':
        fixtureOverlayType = OverlayObjectType.SINK_MODERN;
        material = isLuxury ? 'marble' : 'ceramic';
        break;
      case 'bath':
        fixtureOverlayType = isLuxury ? OverlayObjectType.BATH_CLAWFOOT : OverlayObjectType.BATH_MODERN;
        break;
      case 'shower':
        fixtureOverlayType = OverlayObjectType.SHOWER;
        material = 'glass';
        break;
      default:
        fixtureOverlayType = OverlayObjectType.BASIN;
    }
  } else if (era >= 1700) {
    // Early modern
    switch (fixtureType) {
      case 'toilet':
        fixtureOverlayType = OverlayObjectType.CHAMBER_POT;
        material = 'ceramic';
        break;
      case 'sink':
      case 'bath':
        fixtureOverlayType = OverlayObjectType.BASIN;
        material = isLuxury ? 'marble' : 'ceramic';
        break;
      default:
        fixtureOverlayType = OverlayObjectType.BASIN;
    }
  } else {
    // Pre-modern (no indoor plumbing)
    fixtureOverlayType = OverlayObjectType.BASIN;
    material = 'stone';
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: fixtureOverlayType,
      rotation: 0,
      material
    };
    tiles[y][x].isBlocking = true;
  }
}

/**
 * Create complete bathroom
 */
export function createBathroom(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  era: number,
  isLuxury: boolean = false
): void {
  // Only create bathrooms for appropriate eras
  if (era < 1800 && !isLuxury) return;
  if (era < 1500) return; // No indoor bathrooms
  
  // Place toilet in corner
  if (era >= 1850) {
    placeBathroomFixture(tiles, x + 1, y + 1, 'toilet', era, isLuxury);
  }
  
  // Place sink
  placeBathroomFixture(tiles, x + width - 2, y + 1, 'sink', era, isLuxury);
  
  // Place bath/shower if room is large enough
  if (width >= 4 && height >= 4) {
    if (era >= 1950 && !isLuxury) {
      // Modern shower
      placeBathroomFixture(tiles, x + 1, y + height - 2, 'shower', era, isLuxury);
    } else if (era >= 1700) {
      // Bathtub
      placeBathroomFixture(tiles, x + Math.floor(width/2), y + height - 2, 'bath', era, isLuxury);
    }
  }
  
  // Add mirror above sink
  if (tiles[y + 1]?.[x + width - 2] && era >= 1600) {
    tiles[y][x + width - 2].overlayObject = {
      type: OverlayObjectType.MIRROR,
      rotation: 0,
      material: isLuxury ? 'gold_frame' : 'wood_frame'
    };
    tiles[y][x + width - 2].isBlocking = false;
  }
}

/**
 * Place specialized cultural storage
 */
export function placeCulturalStorage(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  era: number,
  purpose: 'residential' | 'commercial' | 'religious' | 'military'
): void {
  let storageType: OverlayObjectType;
  let material = 'wood';
  
  switch (culturalZone) {
    case 'EAST_ASIAN':
      if (purpose === 'religious') {
        storageType = OverlayObjectType.SCROLL_RACK;
        material = 'lacquered_wood';
      } else if (purpose === 'residential') {
        storageType = OverlayObjectType.TANSU;
        material = 'cedar';
      } else {
        storageType = OverlayObjectType.CHEST;
      }
      break;
      
    case 'MENA':
      if (purpose === 'commercial') {
        storageType = OverlayObjectType.SPICE_CABINET;
        material = 'cedar';
      } else if (purpose === 'religious') {
        storageType = OverlayObjectType.SCROLL_RACK;
        material = 'carved_wood';
      } else {
        storageType = OverlayObjectType.CEDAR_CHEST;
      }
      break;
      
    case 'EUROPEAN':
      if (purpose === 'military') {
        storageType = OverlayObjectType.WEAPON_RACK;
        material = 'oak';
      } else if (purpose === 'commercial' && era >= 1800) {
        storageType = OverlayObjectType.FILING_CABINET;
        material = 'steel';
      } else if (purpose === 'residential' && era >= 1600) {
        storageType = OverlayObjectType.ARMOIRE;
        material = 'walnut';
      } else {
        storageType = OverlayObjectType.CHEST;
      }
      break;
      
    default:
      storageType = getCulturalStorage(culturalZone, era, 'general');
  }
  
  if (tiles[y]?.[x]) {
    tiles[y][x].overlayObject = {
      type: storageType,
      rotation: 0,
      material
    };
    tiles[y][x].isBlocking = true;
  }
}