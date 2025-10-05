/**
 * Fixed Government Forum Generator
 * Creates organized council chambers with proper room structure
 */

import { Tile, OverlayObjectType } from '../../../types/core/tile';
import { BiomeType } from '../../../types/biomes/base';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/valueNoise';
// Removed specialMapAugmentation dependency - cultural layouts handled by generators
const LANDSCAPE_BORDER_ROWS = 2; // Default border for government buildings
import { MultiTileObjectManager } from '../../../services/multiTileObjectService';
import { getFurnitureMaterial } from '../../../services/materialMappingService';
import { 
  getCulturalFurnitureSet,
  getCulturalFloorPattern,
  getSeatingArrangement,
  getCulturalLighting,
  getCulturalStorage,
  getCulturalReligiousElements
} from '../culturalFurnitureSystem';
import {
  lightRoom,
  placeChandelier,
  placeWallSconce,
  placeFireplace
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  createBathroom,
  placeKitchenUtility
} from '../storageUtilitySystem';
import {
  placeBanquetTable,
  placeRoundTable,
  placeLShapedTable,
  placeSmartTable
} from '../advancedFurnitureSystem';
import {
  placeDeskWithChair,
  placeBookshelfAgainstWall,
  placeBenchWithOrientation
} from '../directionalFurniturePlacement';


export function generateGovernmentForumFixed(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { 
  tiles: Tile[][], 
  interactionZones: InteractionZone[], 
  exitZones: ExitZone[], 
  rooms: RoomDefinition[],
  multiTileObjects?: any[] 
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  const multiTileManager = new MultiTileObjectManager();
  
  // Get cultural layout pattern
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const layoutPattern = CULTURAL_LAYOUT_PATTERNS.GOVERNMENT[culturalZone as keyof typeof CULTURAL_LAYOUT_PATTERNS.GOVERNMENT] || 
                       CULTURAL_LAYOUT_PATTERNS.GOVERNMENT.EUROPEAN;
  
  // Determine landscape border
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'medium'] : 0;
  
  // Initialize ALL tiles with floor first - this prevents outdoor biomes from leaking in
  const baseFloor = BiomeType.FLOOR_STONE;
  
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = baseFloor;
      tiles[y][x].isBlocking = false;
    }
  }
  
  // THEN add landscape border if enabled (will overwrite only the edge tiles)
  if (config.hasLandscape && config.landscapeClimate) {
    fillLandscapeBorder(tiles, size, borderSize, config.landscapeClimate, config);
    
    // Add inner wall to separate courtyard from interior
    // This creates a proper boundary between the garden/courtyard and the building
    for (let y = borderSize; y < size.height - borderSize; y++) {
      // Left wall
      tiles[y][borderSize].biome = BiomeType.WALL;
      tiles[y][borderSize].isBlocking = true;
      // Right wall  
      tiles[y][size.width - borderSize - 1].biome = BiomeType.WALL;
      tiles[y][size.width - borderSize - 1].isBlocking = true;
    }
    
    for (let x = borderSize; x < size.width - borderSize; x++) {
      // Top wall
      tiles[borderSize][x].biome = BiomeType.WALL;
      tiles[borderSize][x].isBlocking = true;
      // Bottom wall
      tiles[size.height - borderSize - 1][x].biome = BiomeType.WALL;
      tiles[size.height - borderSize - 1][x].isBlocking = true;
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Add plaza paths to main entrance
  if (config.hasLandscape) {
    addPlazaPathToEntrance(tiles, size, borderSize, config.landscapeClimate);
    
    // Add paths leading to all entrances (exterior)
    // Path from bottom to main entrance
    for (let y = size.height - 5; y < size.height - borderSize; y++) {
      tiles[y][centerX].biome = BiomeType.PATH;
      tiles[y][centerX].isBlocking = false;
    }
    
    // Path to left entrance
    for (let x = 0; x < borderSize; x++) {
      tiles[Math.floor(size.height / 2)][x].biome = BiomeType.PATH;
      tiles[Math.floor(size.height / 2)][x].isBlocking = false;
    }
    
    // Path to right entrance
    for (let x = size.width - borderSize; x < size.width; x++) {
      tiles[Math.floor(size.height / 2)][x].biome = BiomeType.PATH;
      tiles[Math.floor(size.height / 2)][x].isBlocking = false;
    }
    
    // Add entrance door through the inner wall
    const entranceX = centerX;
    const entranceY = size.height - borderSize - 1;
    tiles[entranceY][entranceX].biome = BiomeType.DOOR;
    tiles[entranceY][entranceX].isBlocking = false;
    // Add flanking doorway for wider entrance
    if (size.width >= 16) {
      tiles[entranceY][entranceX - 1].biome = BiomeType.DOOR;
      tiles[entranceY][entranceX - 1].isBlocking = false;
      tiles[entranceY][entranceX + 1].biome = BiomeType.DOOR;
      tiles[entranceY][entranceX + 1].isBlocking = false;
    }
    
    // Add side entrance doors
    tiles[Math.floor(size.height / 2)][borderSize].biome = BiomeType.DOOR;
    tiles[Math.floor(size.height / 2)][borderSize].isBlocking = false;
    tiles[Math.floor(size.height / 2)][size.width - borderSize - 1].biome = BiomeType.DOOR;
    tiles[Math.floor(size.height / 2)][size.width - borderSize - 1].isBlocking = false;
  }
  
  // Calculate building bounds (interior area excluding landscape border AND inner wall)
  const buildingLeft = config.hasLandscape ? borderSize + 1 : borderSize;
  const buildingRight = config.hasLandscape ? size.width - borderSize - 1 : size.width - borderSize;
  const buildingTop = config.hasLandscape ? borderSize + 1 : borderSize;
  const buildingBottom = config.hasLandscape ? size.height - borderSize - 1 : size.height - borderSize;
  const buildingWidth = buildingRight - buildingLeft;
  const buildingHeight = buildingBottom - buildingTop;
  
  // Check if this is a modern era building
  const isModern = config.era === 'INDUSTRIAL_ERA' || config.era === 'MODERN_ERA' || config.era === 'FUTURE_ERA';
  
  // Adapt layout to building size and era
  if (isModern && size.width >= 20) {
    // Modern government complex with offices, bathrooms, conference rooms
    createModernGovernmentComplex(tiles, size, config, rooms, interactionZones, exitZones, multiTileManager);
  } else if (buildingWidth <= 10) {
    // XS/Small: Simple single room
    createSimpleCouncilRoom(tiles, size, config, rooms, interactionZones, layoutPattern);
  } else if (size.width <= 16) {
    // Medium: Main chamber with small foyer
    if (layoutPattern.shape === 'circular') {
      createCircularChamber(tiles, size, config, rooms, interactionZones, layoutPattern);
    } else {
      createMainChamber(tiles, size, config, rooms, interactionZones, layoutPattern, multiTileManager);
    }
  } else {
    // Large/XL: Full complex with offices and foyer
    if (layoutPattern.shape === 'circular') {
      createCircularChamber(tiles, size, config, rooms, interactionZones, layoutPattern);
    } else {
      createMainChamber(tiles, size, config, rooms, interactionZones, layoutPattern, multiTileManager);
      
      // Add glowing entrance portal to inner sanctum at top
      const portalY = buildingTop + 2;
      tiles[portalY][centerX].biome = BiomeType.ENTRANCE_PORTAL;
      tiles[portalY][centerX].isBlocking = false;
    }
    createFoyer(tiles, size, rooms);
    // Add symmetrical columns in the foyer with better spacing
    addFoyerColumns(tiles, size, config);
    if (size.width >= 20) {
      createSideOfficesWithTileFloor(tiles, size, rooms, config);
    }
    
    // Enhance the forum with new decorative and functional elements
    const chamberArea = {
      x: buildingLeft + 2,
      y: buildingTop + 2,
      width: buildingWidth - 4,
      height: Math.floor(buildingHeight * 0.6)
    };
    
    // Add cultural decorations
    addCulturalGovernmentDecorations(tiles, size, config, chamberArea);
    
    // Add advanced lighting
    addGovernmentLighting(tiles, size, config, chamberArea);
    
    // Add ceremonial objects based on government type
    addCeremonialObjects(tiles, size, config, chamberArea);
    
    // Enhance the foyer with reception furniture
    const foyerArea = {
      x: buildingLeft + 2,
      y: buildingTop + Math.floor(buildingHeight * 0.65),
      width: buildingWidth - 4,
      height: Math.floor(buildingHeight * 0.25)
    };
    enhanceFoyer(tiles, size, config, foyerArea);
    
    // Enhance offices if they exist
    if (size.width >= 20) {
      const officeArea = {
        x: buildingLeft + 2,
        y: buildingTop + 2,
        width: Math.floor(buildingWidth * 0.25),
        height: Math.floor(buildingHeight * 0.6)
      };
      enhanceOffices(tiles, size, config, officeArea);
    }
  }
  
  // Add main exit - place it in the foyer's bottom wall, not at map edge
  const exitY = size.height - borderSize - 2; // Inside the building
  tiles[exitY][centerX].biome = BiomeType.DOOR;
  tiles[exitY][centerX].isBlocking = false;
  // Clear path to exit
  tiles[exitY - 1][centerX].biome = BiomeType.FLOOR_MARBLE;
  tiles[exitY - 1][centerX].isBlocking = false;
  tiles[exitY + 1][centerX].biome = BiomeType.FLOOR_MARBLE; 
  tiles[exitY + 1][centerX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, exitY],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  const multiTileObjects = multiTileManager.getObjects();
  console.log(`[MultiTile Debug] Government forum returning ${multiTileObjects.length} multi-tile objects:`, multiTileObjects);

  return {
    tiles,
    interactionZones,
    exitZones,
    rooms,
    multiTileObjects
  };
}

/**
 * Create the main council chamber with seating
 */
function createMainChamber(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any,
  multiTileManager: MultiTileObjectManager
): void {
  // Scale chamber dimensions based on map size
  const padding = Math.max(2, Math.floor(size.width * 0.15));
  const chamberX = padding;
  const chamberY = Math.floor(size.height * 0.1);
  const chamberWidth = size.width - (padding * 2);
  const chamberHeight = Math.floor(size.height * 0.6);
  
  // Outer walls of chamber with windows
  drawWallsWithWindows(tiles, chamberX, chamberY, chamberWidth, chamberHeight, config.culturalZone || 'EUROPEAN');
  
  // Create raised platform for speaker/leader
  const platformX = chamberX + Math.floor(chamberWidth / 2) - 3;
  const platformY = chamberY + 2;
  const platformWidth = 6;
  const platformHeight = 3;
  
  // Dais/platform area with cultural floor pattern
  const floorPattern = getCulturalFloorPattern(config, 'ceremonial');
  for (let y = platformY; y < platformY + platformHeight; y++) {
    for (let x = platformX; x < platformX + platformWidth; x++) {
      // Use pattern for platform or default to dais
      if (floorPattern && floorPattern.length > 0) {
        const patternIndex = ((x - platformX) + (y - platformY)) % floorPattern.length;
        tiles[y][x].biome = floorPattern[patternIndex];
      } else {
        tiles[y][x].biome = BiomeType.DAIS;
      }
    }
  }
  
  // Central feature based on district type first, then culture
  const furnitureSet = getCulturalFurnitureSet(config, 'government');
  const podiumX = chamberX + Math.floor(chamberWidth / 2);
  
  // Determine central feature based on district type
  let centralFeature = furnitureSet.centralFeature || layoutPattern.centralFeature;
  
  // Override with district-specific features
  if (config.districtType) {
    switch (config.districtType) {
      case 'sacred_council':
      case 'royal_temple':
      case 'sacred_assembly':
        centralFeature = 'altar'; // Religious councils have altars
        break;
      case 'military_council':
      case 'castle':
        centralFeature = 'weapon_rack'; // Military councils display weapons
        break;
      case 'palace':
      case 'royal_hall':
        centralFeature = 'throne'; // Monarchies have thrones
        break;
      case 'forum':
      case 'parliament':
      case 'council':
        centralFeature = 'podium'; // Democratic assemblies have speaker podiums
        break;
      case 'merchant_council':
      case 'trading_house':
      case 'commercial_guild':
        centralFeature = 'table'; // Merchant councils use tables for contract negotiations
        break;
      case 'chiefly_court':
      case 'compound':
        centralFeature = 'firepit'; // Tribal councils gather around fire
        break;
    }
  }
  
  if (centralFeature === 'throne') {
    tiles[platformY + 1][podiumX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 0,
      variant: config.culturalZone
    };
    tiles[platformY + 1][podiumX].isBlocking = true;
  } else if (centralFeature === 'fountain') {
    tiles[platformY + 1][podiumX].biome = BiomeType.FOUNTAIN;
    // Add decorative floor pattern around fountain
    const decorPattern = getCulturalFloorPattern(config, 'decorative');
    if (decorPattern && decorPattern.length > 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx !== 0 || dy !== 0) {
            const fx = podiumX + dx;
            const fy = platformY + 1 + dy;
            if (tiles[fy] && tiles[fy][fx] && !tiles[fy][fx].isBlocking) {
              tiles[fy][fx].biome = decorPattern[0];
            }
          }
        }
      }
    }
  } else if (centralFeature === 'hearth') {
    tiles[platformY + 1][podiumX].biome = BiomeType.HEARTH;
  } else if (centralFeature === 'altar') {
    // Religious altar for theocracies
    tiles[platformY + 1][podiumX].biome = BiomeType.ALTAR;
    tiles[platformY + 1][podiumX].isBlocking = true;
    // Add decorative elements around altar
    for (let dx = -1; dx <= 1; dx += 2) {
      const candleX = podiumX + dx;
      if (tiles[platformY + 1][candleX]) {
        tiles[platformY + 1][candleX].overlayObject = {
          type: OverlayObjectType.TORCH,
          rotation: 0,
          variant: 'candle'
        };
      }
    }
  } else if (centralFeature === 'weapon_rack') {
    // Military display for military councils
    tiles[platformY + 1][podiumX].overlayObject = {
      type: OverlayObjectType.WEAPON_RACK,
      rotation: 0,
      variant: config.culturalZone
    };
    tiles[platformY + 1][podiumX].isBlocking = true;
    // Add armor stands on sides
    for (let dx = -2; dx <= 2; dx += 4) {
      const armorX = podiumX + dx;
      if (tiles[platformY + 1][armorX]) {
        tiles[platformY + 1][armorX].overlayObject = {
          type: OverlayObjectType.ARMOR_STAND,
          rotation: 0,
          variant: config.culturalZone
        };
        tiles[platformY + 1][armorX].isBlocking = true;
      }
    }
  } else if (centralFeature === 'firepit') {
    // Central fire for tribal councils
    tiles[platformY + 1][podiumX].biome = BiomeType.FIRE_PIT;
    // Add seating stones around fire
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const fx = podiumX + Math.round(Math.cos(angle) * 2);
      const fy = platformY + 1 + Math.round(Math.sin(angle) * 2);
      if (tiles[fy] && tiles[fy][fx] && !tiles[fy][fx].isBlocking) {
        tiles[fy][fx].biome = BiomeType.FLOOR_STONE;
      }
    }
  } else if (centralFeature === 'table') {
    // Large negotiation table for merchant councils
    tiles[platformY + 1][podiumX].overlayObject = {
      type: OverlayObjectType.TABLE,
      rotation: 0,
      variant: config.culturalZone
    };
    tiles[platformY + 1][podiumX].isBlocking = true;
    
    // Add chairs around the table for merchants
    const chairPositions = [
      { x: podiumX - 1, y: platformY + 1 },     // Left
      { x: podiumX + 1, y: platformY + 1 },     // Right  
      { x: podiumX, y: platformY },             // Top
      { x: podiumX, y: platformY + 2 }          // Bottom
    ];
    
    for (const pos of chairPositions) {
      if (tiles[pos.y] && tiles[pos.y][pos.x] && !tiles[pos.y][pos.x].isBlocking) {
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.CHAIR,
          rotation: 0,
          variant: config.culturalZone
        };
      }
    }
  } else {
    // Default to podium
    tiles[platformY + 1][podiumX].biome = BiomeType.PODIUM;
  }
  
  // Set blocking for all except firepit
  if (centralFeature !== 'firepit') {
    tiles[platformY + 1][podiumX].isBlocking = true;
  }
  
  // Use district type to determine seating arrangement if available
  let seatingArrangement = 'semicircular'; // default
  
  // Override with district-specific layout if available
  if (config.districtType) {
    switch (config.districtType) {
      case 'sacred_council':
      case 'royal_temple':
      case 'chiefly_court':
      case 'hillfort':
      case 'sacred_assembly':
        seatingArrangement = 'circular'; // Religious/tribal gatherings in the round
        break;
      case 'parliament':
      case 'colonial_office':
      case 'administration':
        seatingArrangement = 'parallel'; // Modern parliamentary opposing benches
        break;
      case 'military_council':
      case 'palace':
      case 'royal_hall':
      case 'castle':
      case 'compound':
        seatingArrangement = 'tiered'; // Hierarchical command structure
        break;
      case 'forum':
      case 'council':
      case 'settlement_council':
      case 'assembly':
        seatingArrangement = 'semicircular'; // Classical senate/forum style
        break;
      case 'merchant_council':
      case 'trading_house':
      case 'commercial_guild':
        seatingArrangement = 'rectangular'; // Business meetings around large tables
        break;
      default:
        // Fall back to cultural patterns
        const seatingInfo = getSeatingArrangement(config, 'government', chamberWidth * chamberHeight);
        seatingArrangement = seatingInfo.arrangement;
        break;
    }
  } else {
    // No district type, use cultural patterns
    const seatingInfo = getSeatingArrangement(config, 'government', chamberWidth * chamberHeight);
    seatingArrangement = seatingInfo.arrangement;
  }
  
  // Get furniture type from cultural system
  const furnitureInfo = getSeatingArrangement(config, 'government', chamberWidth * chamberHeight);
  
  // Create the appropriate seating arrangement
  if (seatingArrangement === 'semicircular') {
    createSemicircularSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8, furnitureInfo.furniture);
  } else if (seatingArrangement === 'parallel') {
    createParallelSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8, furnitureInfo.furniture);
  } else if (seatingArrangement === 'circular') {
    createCircularSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8, furnitureInfo.furniture);
  } else if (seatingArrangement === 'tiered') {
    createTieredSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8, furnitureInfo.furniture);
  }
  
  // Central carpet runner - use culture-specific carpet
  const carpetType = config.culturalZone === 'MENA' ? BiomeType.PERSIAN_RUG : 
                    config.culturalZone === 'EAST_ASIAN' ? BiomeType.CARPET :
                    BiomeType.CARPET;
  for (let y = platformY + platformHeight + 1; y < chamberY + chamberHeight - 2; y++) {
    const centerX = chamberX + Math.floor(chamberWidth / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      tiles[y][x].biome = carpetType;
    }
  }
  
  // Add luxury cushions and enhanced seating for wealthy governments
  if ((config.wealthLevel === 'wealthy' || config.wealthLevel === 'rich') && seatingInfo.furniture.primary) {
    enhanceSeatingWithLuxuryMaterials(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8, config);
  }
  
  // Add procedural columns for grandeur
  addProceduralColumns(tiles, chamberX, chamberY, chamberWidth, chamberHeight, config, multiTileManager);
  
  // Add procedural furniture
  addProceduralFurniture(tiles, chamberX, chamberY, chamberWidth, chamberHeight, config);
  
  // Light the chamber properly
  const era = config.specificYear || 1500;
  lightRoom(tiles, chamberX, chamberY, chamberWidth, chamberHeight,
           config.culturalZone || 'EUROPEAN', era, 'formal', true);
  
  // Add chandelier for grand chambers
  if (chamberWidth >= 12 && era >= 1200 && era < 1900) {
    placeChandelier(tiles, chamberX + Math.floor(chamberWidth / 2),
                   chamberY + Math.floor(chamberHeight / 2),
                   config.culturalZone || 'EUROPEAN', era, true);
  }
  
  // Add room definition
  rooms.push({
    id: 'council_chamber',
    name: 'Council Chamber',
    bounds: { x: chamberX, y: chamberY, width: chamberWidth, height: chamberHeight },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
  
  // Interaction zone for speaking
  interactionZones.push({
    id: 'speaker_podium',
    bounds: { x: platformX, y: platformY, width: platformWidth, height: platformHeight },
    type: 'podium',
    interactions: ['speak', 'address_council']
  });
}

/**
 * Create semicircular seating like a parliament
 */
function createSemicircularSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  furniture: { primary: BiomeType, secondary?: BiomeType }
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  // Create three rows of benches
  for (let row = 0; row < 3; row++) {
    const radius = 6 + row * 2;
    const angleStep = Math.PI / 12; // Seats every 15 degrees
    
    for (let angle = Math.PI * 0.25; angle < Math.PI * 0.75; angle += angleStep) {
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * (radius / 2));
      
      if (x > startX + 1 && x < startX + width - 1 && 
          y > startY && y < startY + height - 1) {
        // Use overlay system for benches
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.BENCH,
          rotation: Math.round(angle * 180 / Math.PI), // Face center
          material: 'oak'
        };
        tiles[y][x].isBlocking = true;
        
        // Add secondary furniture (desk/table) if specified using overlay
        if (furniture.secondary && y > startY + 1) {
          tiles[y - 1][x].overlayObject = {
            type: OverlayObjectType.DESK,
            rotation: Math.round(angle * 180 / Math.PI),
            material: 'oak'
          };
          tiles[y - 1][x].isBlocking = true;
        }
      }
    }
  }
}

/**
 * Create entrance foyer
 */
function createFoyer(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[]
): void {
  const borderSize = 2; // Account for landscape border if present
  const foyerY = Math.floor(size.height * 0.65);
  const foyerHeight = size.height - foyerY - borderSize - 1; // Leave space for exit
  const padding = Math.max(2, Math.floor(size.width * 0.2));
  const foyerX = padding;
  const foyerWidth = size.width - (padding * 2);
  
  // Foyer walls with entrance gap
  drawWallsWithEntrance(tiles, foyerX, foyerY, foyerWidth, foyerHeight);
  
  // Doorway to chamber
  const centerX = Math.floor(size.width / 2);
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    tiles[foyerY][x].biome = BiomeType.DOOR;
    tiles[foyerY][x].isBlocking = false;
  }
  
  // Reception desk using overlay system
  tiles[foyerY + 2][foyerX + 2].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'wood'
  };
  tiles[foyerY + 2][foyerX + 2].isBlocking = true;
  tiles[foyerY + 2][foyerX + 3].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 0,
    material: 'wood'
  };
  tiles[foyerY + 2][foyerX + 3].isBlocking = true;
  
  // Waiting benches using overlay system
  for (let x = foyerX + foyerWidth - 5; x < foyerX + foyerWidth - 2; x++) {
    tiles[foyerY + 2][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'wood'
    };
    tiles[foyerY + 2][x].isBlocking = true;
  }
  
  rooms.push({
    id: 'foyer',
    name: 'Reception Foyer',
    bounds: { x: foyerX, y: foyerY, width: foyerWidth, height: foyerHeight },
    roomType: 'foyer',
    accessLevel: 'public'
  });
}

/**
 * Create side offices with tile flooring
 */
function createSideOfficesWithTileFloor(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[],
  config: SpecialMapConfig
): void {
  const era = config.specificYear || 1500;
  
  // Left office
  const leftOfficeX = 1;
  const leftOfficeY = 4;
  const officeWidth = 5;
  const officeHeight = 6;
  
  // Fill with tile flooring first
  for (let y = leftOfficeY; y < leftOfficeY + officeHeight; y++) {
    for (let x = leftOfficeX; x < leftOfficeX + officeWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
      tiles[y][x].isBlocking = false;
    }
  }
  
  drawWalls(tiles, leftOfficeX, leftOfficeY, officeWidth, officeHeight);
  
  // Door to courtyard/main area
  tiles[leftOfficeY + Math.floor(officeHeight / 2)][leftOfficeX + officeWidth - 1].biome = BiomeType.DOOR;
  tiles[leftOfficeY + Math.floor(officeHeight / 2)][leftOfficeX + officeWidth - 1].isBlocking = false;
  
  // Desk and chair using directional placement
  placeDeskWithChair(tiles, leftOfficeX + 2, leftOfficeY + 2, 3, 3,
                    'north', config.culturalZone || 'EUROPEAN',
                    config.culturalZone === 'EAST_ASIAN' ? 'lacquered_wood' : 'oak');
  
  // Bookshelf using proper placement against wall
  placeBookshelfAgainstWall(tiles, leftOfficeX + 1, leftOfficeY + 1, officeWidth - 2, officeHeight - 2,
                           'west', config.culturalZone || 'EUROPEAN', 'oak');
  
  // Add cultural storage for documents
  placeCulturalStorage(tiles, leftOfficeX + officeWidth - 2, leftOfficeY + 1,
                      config.culturalZone || 'EUROPEAN', era, 'documents');
  
  // Light the office
  lightRoom(tiles, leftOfficeX, leftOfficeY, officeWidth, officeHeight,
           config.culturalZone || 'EUROPEAN', era, 'work', false);
  
  rooms.push({
    id: 'left_office',
    name: 'Clerk Office',
    bounds: { x: leftOfficeX, y: leftOfficeY, width: officeWidth, height: officeHeight },
    roomType: 'office',
    accessLevel: 'restricted'
  });
  
  // Right office (mirror)
  const rightOfficeX = size.width - officeWidth - 1;
  
  // Fill with tile flooring first
  for (let y = leftOfficeY; y < leftOfficeY + officeHeight; y++) {
    for (let x = rightOfficeX; x < rightOfficeX + officeWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
      tiles[y][x].isBlocking = false;
    }
  }
  
  drawWalls(tiles, rightOfficeX, leftOfficeY, officeWidth, officeHeight);
  
  // Door to courtyard/main area
  tiles[leftOfficeY + Math.floor(officeHeight / 2)][rightOfficeX].biome = BiomeType.DOOR;
  tiles[leftOfficeY + Math.floor(officeHeight / 2)][rightOfficeX].isBlocking = false;
  
  // Desk and chair using directional placement
  placeDeskWithChair(tiles, rightOfficeX + 2, leftOfficeY + 2, 3, 3,
                    'north', config.culturalZone || 'EUROPEAN',
                    config.culturalZone === 'EAST_ASIAN' ? 'lacquered_wood' : 'oak');
  
  // Cabinet using cultural storage
  placeCulturalStorage(tiles, rightOfficeX + officeWidth - 2, leftOfficeY + 1,
                      config.culturalZone || 'EUROPEAN', era, 'documents');
  
  // Add bookshelf for documents
  placeBookshelfAgainstWall(tiles, rightOfficeX + officeWidth - 2, leftOfficeY + 1, officeWidth - 2, officeHeight - 2,
                           'east', config.culturalZone || 'EUROPEAN', 'oak');
  
  // Light the office
  lightRoom(tiles, rightOfficeX, leftOfficeY, officeWidth, officeHeight,
           config.culturalZone || 'EUROPEAN', era, 'work', false);
  
  rooms.push({
    id: 'right_office',
    name: 'Secretary Office',
    bounds: { x: rightOfficeX, y: leftOfficeY, width: officeWidth, height: officeHeight },
    roomType: 'office',
    accessLevel: 'restricted'
  });
}

/**
 * Create simple council room for small maps
 */
function createSimpleCouncilRoom(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any
): void {
  // Draw walls
  drawWalls(tiles, 0, 0, size.width, size.height);
  
  // Central feature
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  if (layoutPattern.centralFeature === 'firepit') {
    tiles[centerY][centerX].biome = BiomeType.FIREPLACE;
  } else if (layoutPattern.centralFeature === 'fountain') {
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  } else {
    tiles[centerY][centerX].biome = BiomeType.PODIUM;
  }
  tiles[centerY][centerX].isBlocking = true;
  
  // Simple seating around edges
  for (let x = 2; x < size.width - 2; x += 2) {
    if (x !== centerX) {
      tiles[2][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 180, // Face south
        material: 'wood'
      };
      tiles[2][x].isBlocking = true;
      tiles[size.height - 3][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 0, // Face north
        material: 'wood'
      };
      tiles[size.height - 3][x].isBlocking = true;
    }
  }
  
  // Door
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 1][centerX].isBlocking = false;
  
  rooms.push({
    id: 'council_room',
    name: 'Council Room',
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
}

/**
 * Create circular chamber for cultures with round buildings
 */
function createCircularChamber(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const radius = Math.min(size.width, size.height) / 2 - 2;
  
  // Draw circular walls
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (Math.abs(dist - radius) < 1.5) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Central feature
  if (layoutPattern.centralFeature === 'firepit') {
    tiles[centerY][centerX].biome = BiomeType.FIREPLACE;
  } else if (layoutPattern.centralFeature === 'fountain') {
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  } else {
    tiles[centerY][centerX].biome = BiomeType.PODIUM;
  }
  tiles[centerY][centerX].isBlocking = true;
  
  // Circular seating with cultural furniture
  const seatingInfo = getSeatingArrangement(config, 'government', size.width * size.height);
  createCircularSeating(tiles, 2, 2, size.width - 4, size.height - 4, seatingInfo.furniture);
  
  // Add room definition
  rooms.push({
    id: 'circular_council',
    name: 'Council Circle',
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
}

/**
 * Create parallel seating (East Asian style)
 */
function createParallelSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  furniture: { primary: BiomeType, secondary?: BiomeType }
): void {
  // Two parallel rows of seats facing each other
  const leftX = startX + Math.floor(width * 0.2);
  const rightX = startX + Math.floor(width * 0.8);
  
  for (let y = startY + 2; y < startY + height - 2; y += 3) {
    // Left side seating
    tiles[y][leftX].overlayObject = {
      type: furniture.primary.replace('BIOME_', '') as any,
      rotation: 0, // Face upward
      material: 'wood'
    };
    tiles[y][leftX].isBlocking = true;
    if (furniture.secondary) {
      tiles[y][leftX + 1].overlayObject = {
        type: furniture.secondary.replace('BIOME_', '') as any,
        rotation: 0,
        material: 'wood'
      };
      tiles[y][leftX + 1].isBlocking = true;
    }
    
    // Right side seating
    tiles[y][rightX].overlayObject = {
      type: furniture.primary.replace('BIOME_', '') as any,
      rotation: 0, // Face upward
      material: 'wood'
    };
    tiles[y][rightX].isBlocking = true;
    if (furniture.secondary) {
      tiles[y][rightX - 1].biome = furniture.secondary;
      tiles[y][rightX - 1].isBlocking = true;
    }
  }
}

/**
 * Create circular seating arrangement
 */
function createCircularSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  furniture: { primary: BiomeType, secondary?: BiomeType }
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  const radius = Math.min(width, height) / 3;
  
  // Create circle of benches
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);
    
    if (x > startX + 1 && x < startX + width - 1 && 
        y > startY + 1 && y < startY + height - 1) {
      tiles[y][x].biome = furniture.primary;
      tiles[y][x].isBlocking = true;
    }
  }
}

/**
 * Create tiered seating (amphitheater style)
 */
function createTieredSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  furniture: { primary: BiomeType, secondary?: BiomeType }
): void {
  // Create ascending tiers
  for (let tier = 0; tier < 4; tier++) {
    const tierY = startY + tier * 3;
    for (let x = startX + 2 + tier; x < startX + width - 2 - tier; x += 2) {
      if (tierY < startY + height - 1) {
        tiles[tierY][x].biome = furniture.primary;
        tiles[tierY][x].isBlocking = true;
      }
    }
  }
}

/**
 * Add procedural columns based on map size and cultural style
 */
function addProceduralColumns(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  config: SpecialMapConfig,
  multiTileManager: MultiTileObjectManager
): void {
  // Determine number of columns based on map size
  const mapArea = chamberWidth * chamberHeight;
  let numColumns: number;
  
  if (mapArea < 80) {
    numColumns = 4; // Small maps: 4 columns
  } else if (mapArea < 200) {
    numColumns = 6; // Medium maps: 6 columns  
  } else if (mapArea < 400) {
    numColumns = 8; // Large maps: 8 columns
  } else {
    numColumns = 12; // XL maps: 12 columns
  }
  
  // Different column patterns based on culture
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  if (culturalZone === 'EUROPEAN' && numColumns >= 6) {
    // Classical colonnade style - two parallel rows
    addClassicalColonnade(tiles, chamberX, chamberY, chamberWidth, chamberHeight, numColumns, multiTileManager, config);
  } else if (culturalZone === 'EAST_ASIAN') {
    // Symmetrical placement around center
    addSymmetricalColumns(tiles, chamberX, chamberY, chamberWidth, chamberHeight, numColumns);
  } else if (numColumns >= 8) {
    // Perimeter columns for larger spaces
    addPerimeterColumns(tiles, chamberX, chamberY, chamberWidth, chamberHeight, Math.min(numColumns, 8));
  } else {
    // Simple four-corner pattern
    addCornerColumns(tiles, chamberX, chamberY, chamberWidth, chamberHeight);
  }
}

/**
 * Add classical Roman/Greek colonnade
 */
function addClassicalColonnade(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  numColumns: number,
  multiTileManager: MultiTileObjectManager,
  config: SpecialMapConfig
): void {
  const pillarMaterial = MultiTileObjectManager.getMaterialForContext(config);
  const pillarHeight = MultiTileObjectManager.getPillarHeight(config);
  const columnsPerSide = Math.floor(numColumns / 2);
  
  // Left colonnade
  const leftX = chamberX + 3;
  const spacing = Math.max(3, Math.floor((chamberHeight - 8) / (columnsPerSide - 1)));
  
  for (let i = 0; i < columnsPerSide; i++) {
    const y = chamberY + 4 + (i * spacing);
    if (y < chamberY + chamberHeight - 3) {
      if (pillarHeight > 1 && y - pillarHeight + 1 >= chamberY) {
        const success = multiTileManager.placePillar(tiles, leftX, y, pillarHeight, pillarMaterial);
        console.log(`[MultiTile Debug] Left pillar placed at (${leftX}, ${y}) height=${pillarHeight} material=${pillarMaterial} success=${success}`);
      } else {
        tiles[y][leftX].biome = BiomeType.COLUMN;
        tiles[y][leftX].isBlocking = true;
      }
    }
  }
  
  // Right colonnade (mirror)
  const rightX = chamberX + chamberWidth - 4;
  for (let i = 0; i < columnsPerSide; i++) {
    const y = chamberY + 4 + (i * spacing);
    if (y < chamberY + chamberHeight - 3) {
      if (pillarHeight > 1 && y - pillarHeight + 1 >= chamberY) {
        const success = multiTileManager.placePillar(tiles, rightX, y, pillarHeight, pillarMaterial);
        console.log(`[MultiTile Debug] Right pillar placed at (${rightX}, ${y}) height=${pillarHeight} material=${pillarMaterial} success=${success}`);
      } else {
        tiles[y][rightX].biome = BiomeType.COLUMN;
        tiles[y][rightX].isBlocking = true;
      }
    }
  }
}

/**
 * Add symmetrical columns around center
 */
function addSymmetricalColumns(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  numColumns: number
): void {
  const centerX = chamberX + Math.floor(chamberWidth / 2);
  const centerY = chamberY + Math.floor(chamberHeight / 2);
  const radius = Math.min(chamberWidth, chamberHeight) / 3;
  
  for (let i = 0; i < numColumns; i++) {
    const angle = (2 * Math.PI * i) / numColumns;
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);
    
    if (x > chamberX + 2 && x < chamberX + chamberWidth - 2 &&
        y > chamberY + 2 && y < chamberY + chamberHeight - 2) {
      tiles[y][x].biome = BiomeType.COLUMN;
      tiles[y][x].isBlocking = true;
    }
  }
}

/**
 * Add columns around chamber perimeter
 */
function addPerimeterColumns(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  numColumns: number
): void {
  const positions: Array<{x: number, y: number}> = [];
  
  // Calculate positions along perimeter
  const perimeter = 2 * (chamberWidth + chamberHeight - 4);
  const spacing = Math.floor(perimeter / numColumns);
  
  let currentPos = 0;
  for (let i = 0; i < numColumns; i++) {
    const pos = (i * spacing) % perimeter;
    
    if (pos < chamberWidth - 2) {
      // Top edge
      positions.push({ x: chamberX + 2 + pos, y: chamberY + 2 });
    } else if (pos < chamberWidth + chamberHeight - 4) {
      // Right edge  
      positions.push({ x: chamberX + chamberWidth - 3, y: chamberY + 2 + (pos - chamberWidth + 2) });
    } else if (pos < 2 * chamberWidth + chamberHeight - 6) {
      // Bottom edge
      positions.push({ x: chamberX + chamberWidth - 3 - (pos - chamberWidth - chamberHeight + 4), y: chamberY + chamberHeight - 3 });
    } else {
      // Left edge
      positions.push({ x: chamberX + 2, y: chamberY + chamberHeight - 3 - (pos - 2 * chamberWidth - chamberHeight + 6) });
    }
  }
  
  positions.forEach(pos => {
    if (tiles[pos.y] && tiles[pos.y][pos.x]) {
      tiles[pos.y][pos.x].biome = BiomeType.COLUMN;
      tiles[pos.y][pos.x].isBlocking = true;
    }
  });
}

/**
 * Add symmetrical columns in reception foyer with improved spacing
 */
function addFoyerColumns(
  tiles: Tile[][],
  size: { width: number; height: number },
  config?: SpecialMapConfig
): void {
  const padding = size.width > 20 ? 2 : 1;
  const foyerY = Math.floor(size.height * 0.65);
  const foyerHeight = size.height - foyerY - 1;
  const foyerX = padding;
  const foyerWidth = size.width - (padding * 2);
  
  // Only add columns if foyer is large enough
  if (foyerWidth < 10 || foyerHeight < 6) return;
  
  // Add two rows of columns flanking the center path with better spacing
  const columnSpacing = 5; // Increased spacing for better colonnade look
  const startX = foyerX + 3;
  const endX = foyerX + foyerWidth - 3;
  
  // Left row of columns
  for (let x = startX; x <= endX; x += columnSpacing) {
    const y = foyerY + 2;
    if (tiles[y] && tiles[y][x] && tiles[y][x].biome === BiomeType.FLOOR_MARBLE) {
      tiles[y][x].biome = BiomeType.COLUMN;
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Right row of columns (mirrored)
  for (let x = startX; x <= endX; x += columnSpacing) {
    const y = foyerY + foyerHeight - 3;
    if (tiles[y] && tiles[y][x] && tiles[y][x].biome === BiomeType.FLOOR_MARBLE) {
      tiles[y][x].biome = BiomeType.COLUMN;
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Add decorative columns at the entrance if it's a grand building
  if (size.width >= 20) {
    const entranceX = Math.floor(size.width / 2);
    
    // Columns flanking the entrance door (inside)
    if (tiles[foyerY + 1]) {
      if (tiles[foyerY + 1][entranceX - 2]) {
        tiles[foyerY + 1][entranceX - 2].biome = BiomeType.COLUMN;
        tiles[foyerY + 1][entranceX - 2].isBlocking = true;
      }
      if (tiles[foyerY + 1][entranceX + 2]) {
        tiles[foyerY + 1][entranceX + 2].biome = BiomeType.COLUMN;
        tiles[foyerY + 1][entranceX + 2].isBlocking = true;
      }
    }
  }
}

/**
 * Add columns in four corners
 */
function addCornerColumns(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number
): void {
  const positions = [
    { x: chamberX + 3, y: chamberY + 3 },
    { x: chamberX + chamberWidth - 4, y: chamberY + 3 },
    { x: chamberX + 3, y: chamberY + chamberHeight - 4 },
    { x: chamberX + chamberWidth - 4, y: chamberY + chamberHeight - 4 }
  ];
  
  positions.forEach(pos => {
    if (pos.x > 0 && pos.y > 0 && tiles[pos.y] && tiles[pos.y][pos.x]) {
      tiles[pos.y][pos.x].biome = BiomeType.COLUMN;
      tiles[pos.y][pos.x].isBlocking = true;
    }
  });
}

/**
 * Add procedural furniture using cultural furniture system
 */
function addProceduralFurniture(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  config: SpecialMapConfig
): void {
  // Get cultural lighting elements
  const lighting = getCulturalLighting(config, 'government');
  
  // Add primary lighting along walls
  if (lighting.wall) {
    addWallLighting(tiles, chamberX, chamberY, chamberWidth, chamberHeight, lighting.wall);
  }
  
  // Add standing lighting for grandeur
  if (lighting.standing && chamberWidth >= 12 && chamberHeight >= 10) {
    addStandingLighting(tiles, chamberX, chamberY, chamberWidth, chamberHeight, lighting.standing);
  }
  
  // Add cultural storage
  const storage = getCulturalStorage(config, 'government');
  if (storage.length > 0) {
    addCulturalStorage(tiles, chamberX, chamberY, chamberWidth, chamberHeight, storage);
  }
  
  // Add guard equipment near entrances (weapon racks and armor stands)
  if (chamberWidth >= 10 && chamberHeight >= 8) {
    addGuardEquipment(tiles, chamberX, chamberY, chamberWidth, chamberHeight);
  }
  
  // Add religious/ceremonial elements
  const religious = getCulturalReligiousElements(config, 'government');
  if (religious.length > 0) {
    addReligiousElements(tiles, chamberX, chamberY, chamberWidth, chamberHeight, religious, config);
  }
  
  // Add cultural carpets in appropriate locations
  addCulturalCarpets(tiles, chamberX, chamberY, chamberWidth, chamberHeight, config);
}

/**
 * Add wall lighting based on culture
 */
function addWallLighting(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  lightingType: BiomeType
): void {
  // Left wall torches - every 3 tiles for better coverage
  for (let y = chamberY + 2; y < chamberY + chamberHeight - 2; y += 3) {
    if (tiles[y][chamberX + 1].biome !== BiomeType.WALL && 
        tiles[y][chamberX + 1].biome !== BiomeType.DOOR &&
        !tiles[y][chamberX + 1].isBlocking) {
      tiles[y][chamberX + 1].biome = lightingType;
      tiles[y][chamberX + 1].isBlocking = false;
    }
  }
  
  // Right wall torches - every 3 tiles
  for (let y = chamberY + 2; y < chamberY + chamberHeight - 2; y += 3) {
    if (tiles[y][chamberX + chamberWidth - 2].biome !== BiomeType.WALL && 
        tiles[y][chamberX + chamberWidth - 2].biome !== BiomeType.DOOR &&
        !tiles[y][chamberX + chamberWidth - 2].isBlocking) {
      tiles[y][chamberX + chamberWidth - 2].biome = lightingType;
      tiles[y][chamberX + chamberWidth - 2].isBlocking = false;
    }
  }
  
  // Top wall torches - horizontal placement
  for (let x = chamberX + 3; x < chamberX + chamberWidth - 3; x += 4) {
    if (tiles[chamberY + 1][x].biome !== BiomeType.WALL && 
        tiles[chamberY + 1][x].biome !== BiomeType.DOOR &&
        !tiles[chamberY + 1][x].overlayObject &&
        !tiles[chamberY + 1][x].isBlocking) {
      tiles[chamberY + 1][x].biome = lightingType;
      tiles[chamberY + 1][x].isBlocking = false;
    }
  }
  
  // Bottom wall torches near entrance
  for (let x = chamberX + 2; x < chamberX + chamberWidth - 2; x += 3) {
    if (tiles[chamberY + chamberHeight - 2] && 
        tiles[chamberY + chamberHeight - 2][x].biome !== BiomeType.WALL && 
        tiles[chamberY + chamberHeight - 2][x].biome !== BiomeType.DOOR &&
        !tiles[chamberY + chamberHeight - 2][x].isBlocking) {
      tiles[chamberY + chamberHeight - 2][x].biome = lightingType;
      tiles[chamberY + chamberHeight - 2][x].isBlocking = false;
    }
  }
}

/**
 * Add standing lighting (braziers, torches, etc)
 */
function addStandingLighting(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  lightingType: BiomeType
): void {
  const brazierPositions = [
    { x: chamberX + Math.floor(chamberWidth * 0.25), y: chamberY + Math.floor(chamberHeight * 0.75) },
    { x: chamberX + Math.floor(chamberWidth * 0.75), y: chamberY + Math.floor(chamberHeight * 0.75) }
  ];
  
  brazierPositions.forEach(pos => {
    if (tiles[pos.y] && tiles[pos.y][pos.x] && !tiles[pos.y][pos.x].isBlocking) {
      tiles[pos.y][pos.x].biome = lightingType;
      tiles[pos.y][pos.x].isBlocking = true;
    }
  });
}

/**
 * Add cultural storage furniture
 */
function addCulturalStorage(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  storageTypes: BiomeType[]
): void {
  const chestPositions = [
    { x: chamberX + 2, y: chamberY + 2 },
    { x: chamberX + chamberWidth - 3, y: chamberY + 2 }
  ];
  
  chestPositions.forEach((pos, index) => {
    if (tiles[pos.y] && tiles[pos.y][pos.x] && !tiles[pos.y][pos.x].isBlocking) {
      // Use different storage types from the cultural set
      const storageType = storageTypes[index % storageTypes.length];
      tiles[pos.y][pos.x].biome = storageType;
      tiles[pos.y][pos.x].isBlocking = true;
    }
  });
}

/**
 * Add religious and ceremonial elements
 */
function addReligiousElements(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  religiousTypes: BiomeType[],
  config: SpecialMapConfig
): void {
  // Position religious elements in culturally appropriate locations
  const positions: Array<{x: number, y: number}> = [];
  
  // Add positions based on cultural preferences
  if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
    // Western/Middle Eastern: corners or sides
    positions.push({ x: chamberX + chamberWidth - 4, y: chamberY + 3 });
    positions.push({ x: chamberX + 3, y: chamberY + 3 });
  } else if (config.culturalZone === 'EAST_ASIAN') {
    // East Asian: back wall center
    positions.push({ x: chamberX + Math.floor(chamberWidth / 2), y: chamberY + 2 });
    positions.push({ x: chamberX + 3, y: chamberY + chamberHeight - 4 });
  } else {
    // Default: side positions
    positions.push({ x: chamberX + 2, y: chamberY + Math.floor(chamberHeight / 2) });
    positions.push({ x: chamberX + chamberWidth - 3, y: chamberY + Math.floor(chamberHeight / 2) });
  }
  
  // Place religious elements
  positions.forEach((pos, index) => {
    if (index < religiousTypes.length && 
        tiles[pos.y] && tiles[pos.y][pos.x] && 
        !tiles[pos.y][pos.x].isBlocking) {
      tiles[pos.y][pos.x].biome = religiousTypes[index];
      tiles[pos.y][pos.x].isBlocking = true;
    }
  });
}

/**
 * Add guard equipment (weapon racks and armor stands) near entrances
 */
function addGuardEquipment(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number
): void {
  // Place weapon racks near entrance
  const entranceY = chamberY + chamberHeight - 3;
  
  // Left side weapon rack
  if (tiles[entranceY] && tiles[entranceY][chamberX + 2] && 
      !tiles[entranceY][chamberX + 2].isBlocking) {
    tiles[entranceY][chamberX + 2].biome = BiomeType.WEAPON_RACK;
    tiles[entranceY][chamberX + 2].isBlocking = true;
  }
  
  // Right side weapon rack
  if (tiles[entranceY] && tiles[entranceY][chamberX + chamberWidth - 3] && 
      !tiles[entranceY][chamberX + chamberWidth - 3].isBlocking) {
    tiles[entranceY][chamberX + chamberWidth - 3].biome = BiomeType.WEAPON_RACK;
    tiles[entranceY][chamberX + chamberWidth - 3].isBlocking = true;
  }
  
  // Place armor stands flanking throne/podium area
  const throneY = chamberY + 4;
  
  // Left armor stand
  if (tiles[throneY] && tiles[throneY][chamberX + Math.floor(chamberWidth / 2) - 3] && 
      !tiles[throneY][chamberX + Math.floor(chamberWidth / 2) - 3].isBlocking) {
    tiles[throneY][chamberX + Math.floor(chamberWidth / 2) - 3].biome = BiomeType.ARMOR_STAND;
    tiles[throneY][chamberX + Math.floor(chamberWidth / 2) - 3].isBlocking = true;
  }
  
  // Right armor stand
  if (tiles[throneY] && tiles[throneY][chamberX + Math.floor(chamberWidth / 2) + 3] && 
      !tiles[throneY][chamberX + Math.floor(chamberWidth / 2) + 3].isBlocking) {
    tiles[throneY][chamberX + Math.floor(chamberWidth / 2) + 3].biome = BiomeType.ARMOR_STAND;
    tiles[throneY][chamberX + Math.floor(chamberWidth / 2) + 3].isBlocking = true;
  }
}

/**
 * Add cultural carpets in appropriate locations
 */
function addCulturalCarpets(
  tiles: Tile[][],
  chamberX: number,
  chamberY: number,
  chamberWidth: number,
  chamberHeight: number,
  config: SpecialMapConfig
): void {
  const { culturalZone, era } = config;
  
  // Skip if prehistoric era (no carpets)
  if (era === 'PREHISTORY') return;
  
  // Determine carpet placement patterns based on culture
  if (culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN') {
    // Islamic/South Asian: More extensive carpet use
    // Create prayer area with carpets
    const prayerAreaY = chamberY + Math.floor(chamberHeight * 0.7);
    for (let y = prayerAreaY; y < prayerAreaY + 3; y++) {
      for (let x = chamberX + 3; x < chamberX + chamberWidth - 3; x++) {
        if (tiles[y] && tiles[y][x] && !tiles[y][x].isBlocking) {
          tiles[y][x].biome = BiomeType.CARPET;
        }
      }
    }
    
    // Side carpets for seating areas
    for (let y = chamberY + 4; y < chamberY + chamberHeight - 4; y += 4) {
      // Left side
      for (let x = chamberX + 2; x < chamberX + 4; x++) {
        if (tiles[y] && tiles[y][x] && !tiles[y][x].isBlocking) {
          tiles[y][x].biome = BiomeType.CARPET;
          if (tiles[y + 1] && tiles[y + 1][x]) {
            tiles[y + 1][x].biome = BiomeType.CARPET;
          }
        }
      }
      // Right side
      for (let x = chamberX + chamberWidth - 4; x < chamberX + chamberWidth - 2; x++) {
        if (tiles[y] && tiles[y][x] && !tiles[y][x].isBlocking) {
          tiles[y][x].biome = BiomeType.CARPET;
          if (tiles[y + 1] && tiles[y + 1][x]) {
            tiles[y + 1][x].biome = BiomeType.CARPET;
          }
        }
      }
    }
  } else if (culturalZone === 'EAST_ASIAN') {
    // East Asian: Smaller ceremonial carpets/mats
    const centerX = chamberX + Math.floor(chamberWidth / 2);
    
    // Small carpet areas for kneeling/sitting
    const positions = [
      { x: centerX - 4, y: chamberY + Math.floor(chamberHeight * 0.6) },
      { x: centerX + 2, y: chamberY + Math.floor(chamberHeight * 0.6) },
      { x: centerX - 4, y: chamberY + Math.floor(chamberHeight * 0.75) },
      { x: centerX + 2, y: chamberY + Math.floor(chamberHeight * 0.75) }
    ];
    
    positions.forEach(pos => {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (tiles[pos.y + dy] && tiles[pos.y + dy][pos.x + dx] && 
              !tiles[pos.y + dy][pos.x + dx].isBlocking) {
            tiles[pos.y + dy][pos.x + dx].biome = BiomeType.CARPET;
          }
        }
      }
    });
  } else if (culturalZone === 'EUROPEAN' && 
             (era === 'RENAISSANCE_EARLY_MODERN' || era === 'INDUSTRIAL_ERA' || era === 'MODERN_ERA')) {
    // European post-medieval: Decorative carpets
    const centerX = chamberX + Math.floor(chamberWidth / 2);
    
    // Large central carpet
    for (let y = chamberY + Math.floor(chamberHeight * 0.4); 
         y < chamberY + Math.floor(chamberHeight * 0.7); y++) {
      for (let x = centerX - 3; x <= centerX + 3; x++) {
        if (tiles[y] && tiles[y][x] && !tiles[y][x].isBlocking) {
          tiles[y][x].biome = BiomeType.CARPET;
        }
      }
    }
  }
  // Other cultures may have minimal or no carpet use in government buildings
}

/**
 * Fill landscape border with climate-appropriate terrain
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string,
  config?: SpecialMapConfig
): void {
  // Determine season from year if available (simple Northern Hemisphere assumption)
  let season = 'summer'; // default
  if (config?.specificYear) {
    const monthApprox = Math.abs(config.specificYear % 12); // Simple approximation
    if (monthApprox >= 11 || monthApprox <= 1) season = 'winter';
    else if (monthApprox >= 2 && monthApprox <= 4) season = 'spring';
    else if (monthApprox >= 5 && monthApprox <= 7) season = 'summer';
    else season = 'autumn';
  }

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Only fill actual border area
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        
        const tile = tiles[y][x];
        
        // Add variety within climate types using position-based pseudo-random
        const variation = (x + y * size.width) % 100;
        
        // More sophisticated climate handling
        switch (climate) {
          case 'arid':
            // Desert landscapes
            if (variation < 80) {
              tile.biome = BiomeType.DESERT;
            } else if (variation < 90) {
              tile.biome = BiomeType.SCRUB;
            } else if (variation < 95) {
              tile.biome = BiomeType.HILLS;
            } else {
              tile.biome = BiomeType.OASIS; // Rare oasis
            }
            break;
            
          case 'mediterranean':
            // Mediterranean varies by season
            if (season === 'summer') {
              // Dry summer - scrubland
              if (variation < 70) {
                tile.biome = BiomeType.SCRUB;
              } else if (variation < 85) {
                tile.biome = BiomeType.HILLS;
              } else if (variation < 95) {
                tile.biome = BiomeType.HILLS;
              } else {
                tile.biome = BiomeType.PARK; // Cultivated gardens
              }
            } else if (season === 'winter') {
              // Wet winter - more water features
              if (variation < 50) {
                tile.biome = BiomeType.RIVERBANK;
              } else if (variation < 70) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 85) {
                tile.biome = BiomeType.WETLANDS;
              } else if (variation < 95) {
                tile.biome = BiomeType.PARK;
              } else {
                tile.biome = BiomeType.RIVER;
              }
            } else {
              // Spring/autumn - mixed
              if (variation < 60) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 80) {
                tile.biome = BiomeType.SCRUB;
              } else if (variation < 90) {
                tile.biome = BiomeType.PARK;
              } else {
                tile.biome = BiomeType.RIVERBANK;
              }
            }
            break;
            
          case 'temperate':
            // Temperate forests and grasslands
            if (season === 'winter') {
              if (variation < 40) {
                tile.biome = BiomeType.SNOW;
              } else if (variation < 70) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 85) {
                tile.biome = BiomeType.FOREST;
              } else if (variation < 95) {
                tile.biome = BiomeType.PARK;
              } else {
                tile.biome = BiomeType.RIVER;
              }
            } else {
              if (variation < 50) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 75) {
                tile.biome = BiomeType.FOREST;
              } else if (variation < 85) {
                tile.biome = BiomeType.PARK;
              } else if (variation < 95) {
                tile.biome = BiomeType.HILLS;
              } else {
                tile.biome = BiomeType.RIVER;
              }
            }
            break;
            
          case 'cold':
            // Arctic/subarctic
            if (season === 'summer') {
              if (variation < 60) {
                tile.biome = BiomeType.TUNDRA;
              } else if (variation < 80) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 90) {
                tile.biome = BiomeType.SNOW;
              } else {
                tile.biome = BiomeType.HILLS;
              }
            } else {
              if (variation < 80) {
                tile.biome = BiomeType.SNOW;
              } else if (variation < 90) {
                tile.biome = BiomeType.SNOW;
              } else {
                tile.biome = BiomeType.TUNDRA;
              }
            }
            break;
            
          case 'tropical':
          case 'semitropical':
            // Tropical regions
            if (season === 'wet' || season === 'winter') {
              if (variation < 60) {
                tile.biome = BiomeType.JUNGLE;
              } else if (variation < 75) {
                tile.biome = BiomeType.WETLANDS;
              } else if (variation < 85) {
                tile.biome = BiomeType.MANGROVE;
              } else if (variation < 95) {
                tile.biome = BiomeType.PARK;
              } else {
                tile.biome = BiomeType.RIVER;
              }
            } else {
              if (variation < 70) {
                tile.biome = BiomeType.JUNGLE;
              } else if (variation < 85) {
                tile.biome = BiomeType.GRASSLAND;
              } else if (variation < 95) {
                tile.biome = BiomeType.PARK;
              } else {
                tile.biome = BiomeType.SCRUB;
              }
            }
            break;
            
          case 'ocean':
            // Coastal areas
            if (variation < 70) {
              tile.biome = BiomeType.BEACH;
            } else if (variation < 85) {
              tile.biome = BiomeType.BEACH;
            } else if (variation < 95) {
              tile.biome = BiomeType.HILLS;
            } else {
              tile.biome = BiomeType.SHALLOW_OCEAN;
            }
            break;
            
          default:
            // Fallback to temperate grassland
            if (variation < 70) {
              tile.biome = BiomeType.GRASSLAND;
            } else if (variation < 85) {
              tile.biome = BiomeType.PARK;
            } else {
              tile.biome = BiomeType.FOREST;
            }
        }
        
        tile.isBlocking = false;
      }
    }
  }
  
  // Add symmetrical parks and decorative elements for certain cultures/eras
  if (config && borderSize >= 3) {
    addSymmetricalParks(tiles, size, borderSize, config);
  }
}

/**
 * Create modern government complex with offices, bathrooms, elevators
 */
function createModernGovernmentComplex(
  tiles: Tile[][],
  size: { width: number; height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  multiTileManager: any
): void {
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'xl'] : 0;
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main lobby/reception area (bottom center)
  const lobbyY = size.height - borderSize - 8;
  const lobbyHeight = 6;
  const lobbyWidth = Math.floor((size.width - borderSize * 2) * 0.6);
  const lobbyX = centerX - Math.floor(lobbyWidth / 2);
  
  // Create lobby walls
  drawWalls(tiles, lobbyX, lobbyY, lobbyWidth, lobbyHeight);
  
  // Glass doors (modern)
  for (let x = centerX - 2; x <= centerX + 2; x++) {
    tiles[size.height - borderSize - 1][x].biome = BiomeType.DOOR;
    tiles[size.height - borderSize - 1][x].isBlocking = false;
  }
  
  // Reception desk
  tiles[lobbyY + 2][centerX - 3].biome = BiomeType.DESK;
  tiles[lobbyY + 2][centerX - 2].biome = BiomeType.DESK;
  tiles[lobbyY + 2][centerX - 1].biome = BiomeType.DESK;
  
  // Security checkpoint
  tiles[lobbyY + 2][centerX + 1].biome = BiomeType.GUARD_POST;
  tiles[lobbyY + 2][centerX + 2].biome = BiomeType.GUARD_POST;
  
  // Modern lighting (electric fixtures rendered as torches in modern era)
  for (let x = lobbyX + 2; x < lobbyX + lobbyWidth - 2; x += 4) {
    tiles[lobbyY + 1][x].overlayObject = {
      type: OverlayObjectType.TORCH,
      rotation: 0,
      variant: config.era === 'MODERN' ? 'electric' : 'flame'
    };
  }
  
  // Office wing (left side)
  const officeX = borderSize + 2;
  const officeY = borderSize + 2;
  const officeWidth = Math.floor((size.width - borderSize * 2) * 0.4) - 4;
  const officeHeight = size.height - borderSize * 2 - 12;
  
  createOfficeWing(tiles, officeX, officeY, officeWidth, officeHeight, 'left', rooms);
  
  // Conference room wing (right side)
  const confX = size.width - borderSize - officeWidth - 2;
  createOfficeWing(tiles, confX, officeY, officeWidth, officeHeight, 'right', rooms);
  
  // Central assembly hall (modern auditorium style)
  const hallX = officeX + officeWidth + 2;
  const hallWidth = confX - hallX - 2;
  const hallY = borderSize + 2;
  const hallHeight = Math.floor((size.height - borderSize * 2) * 0.5);
  
  drawWalls(tiles, hallX, hallY, hallWidth, hallHeight);
  
  // Tiered seating (modern style)
  for (let row = 0; row < 5; row++) {
    const y = hallY + hallHeight - 3 - row;
    for (let x = hallX + 2; x < hallX + hallWidth - 2; x += 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Speaker's podium
  tiles[hallY + 2][centerX].biome = BiomeType.PODIUM;
  tiles[hallY + 2][centerX].isBlocking = true;
  
  // Bathrooms (modern necessity)
  createBathrooms(tiles, lobbyX - 6, lobbyY, rooms);
  createBathrooms(tiles, lobbyX + lobbyWidth + 2, lobbyY, rooms);
  
  // Elevators (for multi-story feel)
  tiles[lobbyY + 1][lobbyX - 1].biome = BiomeType.STAIRS_UP;
  tiles[lobbyY + 1][lobbyX + lobbyWidth].biome = BiomeType.STAIRS_UP;
  
  // Add rooms
  rooms.push({
    id: 'lobby',
    name: 'Main Lobby',
    bounds: { x: lobbyX, y: lobbyY, width: lobbyWidth, height: lobbyHeight },
    roomType: 'lobby',
    accessLevel: 'public'
  });
  
  rooms.push({
    id: 'assembly_hall',
    name: 'Assembly Hall',
    bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
}

/**
 * Create office wing with individual offices
 */
function createOfficeWing(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  side: 'left' | 'right',
  rooms: RoomDefinition[]
): void {
  // Outer walls
  drawWalls(tiles, startX, startY, width, height);
  
  // Create individual offices
  const officeSize = 4;
  const numOffices = Math.floor(height / (officeSize + 1));
  
  for (let i = 0; i < numOffices; i++) {
    const officeY = startY + 1 + (i * (officeSize + 1));
    
    // Office walls
    for (let x = startX + 1; x < startX + width - 1; x++) {
      if (officeY + officeSize < startY + height - 1) {
        tiles[officeY + officeSize][x].biome = BiomeType.WALL;
        tiles[officeY + officeSize][x].isBlocking = true;
      }
    }
    
    // Door to hallway
    const doorX = side === 'left' ? startX + width - 1 : startX;
    tiles[officeY + 2][doorX].biome = BiomeType.DOOR;
    tiles[officeY + 2][doorX].isBlocking = false;
    
    // Desk and chair
    tiles[officeY + 1][startX + 2].biome = BiomeType.DESK;
    tiles[officeY + 1][startX + 2].isBlocking = true;
    tiles[officeY + 2][startX + 2].biome = BiomeType.CHAIR;
    tiles[officeY + 2][startX + 2].isBlocking = true;
    
    // Filing cabinet
    tiles[officeY + 1][startX + width - 3].biome = BiomeType.FILING_CABINET;
    tiles[officeY + 1][startX + width - 3].isBlocking = true;
    
    // Modern lighting (rendered as electric fixtures in modern era)
    tiles[officeY + 1][startX + Math.floor(width / 2)].overlayObject = {
      type: OverlayObjectType.TORCH,
      rotation: 0,
      variant: 'electric'
    };
    
    rooms.push({
      id: `office_${side}_${i}`,
      name: `Office ${i + 1}`,
      bounds: { x: startX + 1, y: officeY, width: width - 2, height: officeSize },
      roomType: 'office',
      accessLevel: 'restricted'
    });
  }
}

/**
 * Create modern bathrooms
 */
function createBathrooms(
  tiles: Tile[][],
  startX: number,
  startY: number,
  rooms: RoomDefinition[]
): void {
  const width = 5;
  const height = 4;
  
  // Walls
  drawWalls(tiles, startX, startY, width, height);
  
  // Door
  tiles[startY + height - 1][startX + 2].biome = BiomeType.DOOR;
  tiles[startY + height - 1][startX + 2].isBlocking = false;
  
  // Toilets
  tiles[startY + 1][startX + 1].biome = BiomeType.TOILET;
  tiles[startY + 1][startX + 1].isBlocking = true;
  tiles[startY + 1][startX + 3].biome = BiomeType.TOILET;
  tiles[startY + 1][startX + 3].isBlocking = true;
  
  // Sinks
  tiles[startY + 2][startX + 1].biome = BiomeType.BASIN;
  tiles[startY + 2][startX + 1].isBlocking = true;
  tiles[startY + 2][startX + 3].biome = BiomeType.BASIN;
  tiles[startY + 2][startX + 3].isBlocking = true;
  
  rooms.push({
    id: `bathroom_${startX}`,
    name: 'Restroom',
    bounds: { x: startX, y: startY, width, height },
    roomType: 'bathroom',
    accessLevel: 'public'
  });
}

/**
 * Add plaza tile paths leading to the main entrance
 */
function addPlazaPathToEntrance(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  const centerX = Math.floor(size.width / 2);
  const buildingBottom = size.height - borderSize;
  
  // Create a path from building entrance to map edge
  for (let y = buildingBottom; y < size.height; y++) {
    // Main path (3 tiles wide)
    for (let dx = -1; dx <= 1; dx++) {
      const x = centerX + dx;
      if (x >= 0 && x < size.width) {
        tiles[y][x].biome = BiomeType.PLAZA;
        tiles[y][x].isBlocking = false;
      }
    }
  }
  
  // Add ceremonial plaza in front of building (OUTSIDE the building)
  const plazaSize = Math.min(borderSize - 1, 3);
  for (let y = buildingBottom; y < buildingBottom + plazaSize; y++) {
    for (let x = centerX - plazaSize; x <= centerX + plazaSize; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.PLAZA;
        tiles[y][x].isBlocking = false;
      }
    }
  }
}

/**
 * Add symmetrical parks and decorative elements in landscape border
 */
function addSymmetricalParks(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  config: SpecialMapConfig
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.historicalEra || 1500;
  
  // Place symmetrical parks/gardens in corners
  for (let corner = 0; corner < 4; corner++) {
    let cornerX: number, cornerY: number;
    
    switch (corner) {
      case 0: // Top-left
        cornerX = Math.floor(borderSize / 2);
        cornerY = Math.floor(borderSize / 2);
        break;
      case 1: // Top-right
        cornerX = size.width - Math.floor(borderSize / 2) - 1;
        cornerY = Math.floor(borderSize / 2);
        break;
      case 2: // Bottom-left
        cornerX = Math.floor(borderSize / 2);
        cornerY = size.height - Math.floor(borderSize / 2) - 1;
        break;
      case 3: // Bottom-right
        cornerX = size.width - Math.floor(borderSize / 2) - 1;
        cornerY = size.height - Math.floor(borderSize / 2) - 1;
        break;
      default:
        continue;
    }
    
    // Place park tiles in small square
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cornerX + dx;
        const y = cornerY + dy;
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles[y][x].biome = BiomeType.PARK;
          tiles[y][x].isBlocking = false;
        }
      }
    }
    
    // Add fountains or statues based on culture/era
    if (culturalZone === 'EUROPEAN' && era >= 0 && era < 500) {
      // Roman: fountains
      tiles[cornerY][cornerX].biome = BiomeType.FOUNTAIN;
      tiles[cornerY][cornerX].isBlocking = true;
    } else if (culturalZone === 'EUROPEAN' && era >= 1400 && era < 1800) {
      // Renaissance: statues
      tiles[cornerY][cornerX].biome = BiomeType.STATUE;
      tiles[cornerY][cornerX].isBlocking = true;
    } else if (culturalZone === 'EAST_ASIAN') {
      // East Asian: decorative elements (could be shrine or fountain)
      tiles[cornerY][cornerX].biome = Math.random() > 0.5 ? BiomeType.FOUNTAIN : BiomeType.SHRINE;
      tiles[cornerY][cornerX].isBlocking = true;
    }
  }
  
  // Add symmetrical statues along the approach path for grand buildings
  if (config.mapSize === 'large' || config.mapSize === 'xl') {
    const centerX = Math.floor(size.width / 2);
    const pathY = size.height - borderSize - 2;
    
    // Place statues flanking the entrance path
    if (centerX - 4 >= borderSize && centerX + 4 < size.width - borderSize) {
      tiles[pathY][centerX - 4].biome = BiomeType.STATUE;
      tiles[pathY][centerX - 4].isBlocking = true;
      tiles[pathY][centerX + 4].biome = BiomeType.STATUE;
      tiles[pathY][centerX + 4].isBlocking = true;
    }
  }
}

/**
 * Draw single-tile thick walls and mark them as blocking
 */
function drawWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (y === startY) {
        // North wall - use back wall for 3/4 perspective
        tiles[y][x].biome = BiomeType.WALL_BACK;
        tiles[y][x].isBlocking = true;
      } else if (y === startY + height - 1 ||
                 x === startX || x === startX + width - 1) {
        // Other walls - use regular walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
    }
  }
}

/**
 * Draw walls with entrance gap at bottom center
 */
function drawWallsWithEntrance(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  const centerX = startX + Math.floor(width / 2);
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const isWall = (y === startY || y === startY + height - 1 ||
                      x === startX || x === startX + width - 1);
      // Leave gap for entrance at bottom center
      const isEntrance = (y === startY + height - 1) && 
                         (x >= centerX - 1 && x <= centerX + 1);
      if (isWall && !isEntrance) {
        // Use back wall for north edge
        if (y === startY) {
          tiles[y][x].biome = BiomeType.WALL_BACK;
        } else {
          tiles[y][x].biome = BiomeType.WALL;
        }
        tiles[y][x].isBlocking = true;
      }
    }
  }
}

/**
 * Draw walls with windows for better lighting
 */
function drawWallsWithWindows(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  culturalZone: string
): void {
  const windowSpacing = culturalZone === 'MENA' ? 3 : 4; // MENA has more windows
  const useArches = culturalZone === 'MENA' || culturalZone === 'EUROPEAN';
  
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const isWall = (y === startY || y === startY + height - 1 ||
                      x === startX || x === startX + width - 1);
      if (isWall) {
        // Add windows on side walls
        const isWindow = (x === startX || x === startX + width - 1) &&
                        y > startY + 2 && y < startY + height - 2 &&
                        (y - startY) % windowSpacing === 0;
        
        if (isWindow) {
          // Use back wall window variant for north windows
          if (y === startY) {
            tiles[y][x].biome = BiomeType.WALL_BACK_WINDOW;
          } else {
            tiles[y][x].biome = BiomeType.WALL_WINDOW;
            if (useArches) {
              tiles[y][x].materialSubtype = 'arched';
            }
          }
          tiles[y][x].isBlocking = true;
        } else {
          // Use back wall for north edge
          if (y === startY) {
            tiles[y][x].biome = BiomeType.WALL_BACK;
          } else {
            tiles[y][x].biome = BiomeType.WALL;
          }
          tiles[y][x].isBlocking = true;
        }
      }
    }
  }
}

/**
 * Add comprehensive cultural decorations specific to government buildings
 */
function addCulturalGovernmentDecorations(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  chamberArea: { x: number, y: number, width: number, height: number }
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  // Add wall decorations based on culture
  if (culturalZone === 'EUROPEAN') {
    // Add heraldic shields along chamber walls
    for (let x = chamberArea.x + 2; x < chamberArea.x + chamberArea.width - 2; x += 6) {
      // North wall shields
      if (tiles[chamberArea.y + 1] && tiles[chamberArea.y + 1][x]) {
        tiles[chamberArea.y + 1][x].overlayObject = {
          type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
          rotation: 0
        };
      }
      // South wall shields
      if (tiles[chamberArea.y + chamberArea.height - 2] && tiles[chamberArea.y + chamberArea.height - 2][x]) {
        tiles[chamberArea.y + chamberArea.height - 2][x].overlayObject = {
          type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
          rotation: 180
        };
      }
    }
    
    // Add tapestries between shields
    for (let x = chamberArea.x + 5; x < chamberArea.x + chamberArea.width - 5; x += 6) {
      if (tiles[chamberArea.y + 1] && tiles[chamberArea.y + 1][x]) {
        tiles[chamberArea.y + 1][x].overlayObject = {
          type: OverlayObjectType.TAPESTRY,
          rotation: 0
        };
      }
    }
  } else if (culturalZone === 'EAST_ASIAN') {
    // Add decorative scrolls
    for (let x = chamberArea.x + 3; x < chamberArea.x + chamberArea.width - 3; x += 5) {
      if (tiles[chamberArea.y + 1] && tiles[chamberArea.y + 1][x]) {
        tiles[chamberArea.y + 1][x].overlayObject = {
          type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
          rotation: 0
        };
      }
    }
    
    // Add incense burners
    const incenseX1 = chamberArea.x + 4;
    const incenseX2 = chamberArea.x + chamberArea.width - 5;
    const incenseY = chamberArea.y + 3;
    
    if (tiles[incenseY] && tiles[incenseY][incenseX1]) {
      tiles[incenseY][incenseX1].overlayObject = {
        type: OverlayObjectType.INCENSE_BURNER,
        rotation: 0
      };
    }
    if (tiles[incenseY] && tiles[incenseY][incenseX2]) {
      tiles[incenseY][incenseX2].overlayObject = {
        type: OverlayObjectType.INCENSE_BURNER,
        rotation: 0
      };
    }
  } else if (culturalZone === 'MENA') {
    // Add decorative tile panels
    for (let y = chamberArea.y + 2; y < chamberArea.y + chamberArea.height - 2; y += 4) {
      // East wall
      if (tiles[y] && tiles[y][chamberArea.x + 1]) {
        tiles[y][chamberArea.x + 1].overlayObject = {
          type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
          rotation: 90
        };
      }
      // West wall
      if (tiles[y] && tiles[y][chamberArea.x + chamberArea.width - 2]) {
        tiles[y][chamberArea.x + chamberArea.width - 2].overlayObject = {
          type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
          rotation: 270
        };
      }
    }
  } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    // Add decorative masks
    for (let x = chamberArea.x + 3; x < chamberArea.x + chamberArea.width - 3; x += 4) {
      if (tiles[chamberArea.y + 1] && tiles[chamberArea.y + 1][x]) {
        tiles[chamberArea.y + 1][x].overlayObject = {
          type: OverlayObjectType.AFRICAN_DECORATIVE_MASK,
          rotation: 0
        };
      }
    }
    
    // Add drums/gongs for announcements
    if (tiles[chamberArea.y + 2] && tiles[chamberArea.y + 2][chamberArea.x + 2]) {
      tiles[chamberArea.y + 2][chamberArea.x + 2].overlayObject = {
        type: OverlayObjectType.GONG,
        rotation: 0
      };
    }
  } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || culturalZone === 'SOUTH_AMERICAN') {
    // Add indigenous decorations
    for (let x = chamberArea.x + 4; x < chamberArea.x + chamberArea.width - 4; x += 6) {
      if (tiles[chamberArea.y + 1] && tiles[chamberArea.y + 1][x]) {
        tiles[chamberArea.y + 1][x].overlayObject = {
          type: OverlayObjectType.INDIGENOUS_DECORATIVE_DREAMCATCHER,
          rotation: 0
        };
      }
    }
    
    // Add ceremonial idol
    const idolX = chamberArea.x + Math.floor(chamberArea.width / 2);
    const idolY = chamberArea.y + 2;
    if (tiles[idolY] && tiles[idolY][idolX]) {
      tiles[idolY][idolX].overlayObject = {
        type: OverlayObjectType.IDOL,
        rotation: 0
      };
    }
  }
}

/**
 * Add advanced lighting system throughout the government building
 */
function addGovernmentLighting(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  chamberArea: { x: number, y: number, width: number, height: number },
  foyerArea: { x: number, y: number, width: number, height: number } | null
): void {
  const era = config.era || 'MEDIEVAL';
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const wealthLevel = config.wealthLevel || 'moderate';
  
  // Chamber lighting - most impressive
  if (wealthLevel === 'wealthy' || wealthLevel === 'noble') {
    // Central chandelier
    const chandelierX = chamberArea.x + Math.floor(chamberArea.width / 2);
    const chandelierY = chamberArea.y + Math.floor(chamberArea.height / 2);
    
    let chandelierType = OverlayObjectType.CHANDELIER;
    if (era === 'INDUSTRIAL_ERA' || era === 'MODERN_ERA') {
      chandelierType = OverlayObjectType.CHANDELIER_CRYSTAL;
    } else if (culturalZone === 'EUROPEAN' && era === 'RENAISSANCE_EARLY_MODERN') {
      chandelierType = OverlayObjectType.CHANDELIER_IRON;
    } else if (culturalZone === 'EAST_ASIAN') {
      chandelierType = OverlayObjectType.PAPER_LANTERN;
    }
    
    tiles[chandelierY][chandelierX].overlayObject = {
      type: chandelierType,
      rotation: 0
    };
    
    // Wall sconces around chamber
    for (let y = chamberArea.y + 4; y < chamberArea.y + chamberArea.height - 4; y += 4) {
      // West wall
      if (tiles[y] && tiles[y][chamberArea.x + 1]) {
        tiles[y][chamberArea.x + 1].overlayObject = {
          type: OverlayObjectType.WALL_SCONCE,
          rotation: 90
        };
      }
      // East wall
      if (tiles[y] && tiles[y][chamberArea.x + chamberArea.width - 2]) {
        tiles[y][chamberArea.x + chamberArea.width - 2].overlayObject = {
          type: OverlayObjectType.WALL_SCONCE,
          rotation: 270
        };
      }
    }
  } else {
    // Simpler lighting for less wealthy governments
    // Standing candelabras or torches
    const lightType = era === 'MODERN_ERA' ? OverlayObjectType.FLOOR_LAMP : 
                     culturalZone === 'EAST_ASIAN' ? OverlayObjectType.PAPER_LANTERN :
                     OverlayObjectType.CANDELABRA_FLOOR;
    
    // Corner lighting
    const positions = [
      { x: chamberArea.x + 2, y: chamberArea.y + 2 },
      { x: chamberArea.x + chamberArea.width - 3, y: chamberArea.y + 2 },
      { x: chamberArea.x + 2, y: chamberArea.y + chamberArea.height - 3 },
      { x: chamberArea.x + chamberArea.width - 3, y: chamberArea.y + chamberArea.height - 3 }
    ];
    
    for (const pos of positions) {
      if (tiles[pos.y] && tiles[pos.y][pos.x]) {
        tiles[pos.y][pos.x].overlayObject = {
          type: lightType,
          rotation: 0
        };
      }
    }
  }
  
  // Foyer lighting
  if (foyerArea) {
    // Hanging lanterns in foyer
    const foyerLightType = culturalZone === 'MENA' ? OverlayObjectType.HANGING_LANTERN :
                           culturalZone === 'EAST_ASIAN' ? OverlayObjectType.PAPER_LANTERN :
                           OverlayObjectType.LANTERN;
    
    const foyerCenterX = foyerArea.x + Math.floor(foyerArea.width / 2);
    const foyerCenterY = foyerArea.y + Math.floor(foyerArea.height / 2);
    
    tiles[foyerCenterY][foyerCenterX].overlayObject = {
      type: foyerLightType,
      rotation: 0
    };
  }
  
  // Add fireplace if appropriate
  if (culturalZone === 'EUROPEAN' && (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN')) {
    const fireplaceX = chamberArea.x + Math.floor(chamberArea.width / 2);
    const fireplaceY = chamberArea.y + chamberArea.height - 2;
    
    if (tiles[fireplaceY] && tiles[fireplaceY][fireplaceX]) {
      const fireplaceType = wealthLevel === 'wealthy' ? OverlayObjectType.FIREPLACE_MARBLE :
                            wealthLevel === 'noble' ? OverlayObjectType.FIREPLACE_STONE :
                            OverlayObjectType.FIREPLACE_BRICK;
      
      tiles[fireplaceY][fireplaceX].overlayObject = {
        type: fireplaceType,
        rotation: 0
      };
      tiles[fireplaceY][fireplaceX].isBlocking = true;
    }
  }
}

/**
 * Add ceremonial and functional objects to the main chamber
 */
function addCeremonialObjects(
  tiles: Tile[][],
  chamberArea: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const governmentType = config.governmentType || 'council';
  
  // Add lectern for speakers
  const lecternX = chamberArea.x + Math.floor(chamberArea.width / 2) - 2;
  const lecternY = chamberArea.y + 4;
  
  if (tiles[lecternY] && tiles[lecternY][lecternX]) {
    tiles[lecternY][lecternX].overlayObject = {
      type: OverlayObjectType.LECTERN,
      rotation: 0
    };
    tiles[lecternY][lecternX].isBlocking = true;
  }
  
  // Add scale for justice (law courts)
  if (governmentType === 'court' || governmentType === 'justice') {
    const scaleX = chamberArea.x + Math.floor(chamberArea.width / 2) + 2;
    const scaleY = chamberArea.y + 4;
    
    if (tiles[scaleY] && tiles[scaleY][scaleX]) {
      tiles[scaleY][scaleX].overlayObject = {
        type: OverlayObjectType.SCALE,
        rotation: 0
      };
    }
  }
  
  // Add weapon racks for military governments
  if (governmentType === 'military' || culturalZone === 'EUROPEAN') {
    // Weapon racks flanking the throne/podium
    const weaponY = chamberArea.y + 3;
    const weaponX1 = chamberArea.x + 3;
    const weaponX2 = chamberArea.x + chamberArea.width - 4;
    
    if (tiles[weaponY] && tiles[weaponY][weaponX1]) {
      tiles[weaponY][weaponX1].overlayObject = {
        type: OverlayObjectType.WEAPON_RACK,
        rotation: 0
      };
      tiles[weaponY][weaponX1].isBlocking = true;
    }
    
    if (tiles[weaponY] && tiles[weaponY][weaponX2]) {
      tiles[weaponY][weaponX2].overlayObject = {
        type: OverlayObjectType.WEAPON_RACK,
        rotation: 0
      };
      tiles[weaponY][weaponX2].isBlocking = true;
    }
    
    // Armor stands
    if (tiles[weaponY + 1] && tiles[weaponY + 1][weaponX1]) {
      tiles[weaponY + 1][weaponX1].overlayObject = {
        type: OverlayObjectType.ARMOR_STAND,
        rotation: 0
      };
      tiles[weaponY + 1][weaponX1].isBlocking = true;
    }
    
    if (tiles[weaponY + 1] && tiles[weaponY + 1][weaponX2]) {
      tiles[weaponY + 1][weaponX2].overlayObject = {
        type: OverlayObjectType.ARMOR_STAND,
        rotation: 0
      };
      tiles[weaponY + 1][weaponX2].isBlocking = true;
    }
  }
  
  // Add bell or gong for announcements
  const announcementX = chamberArea.x + 2;
  const announcementY = chamberArea.y + 2;
  
  if (tiles[announcementY] && tiles[announcementY][announcementX]) {
    const announcementType = culturalZone === 'EAST_ASIAN' ? OverlayObjectType.GONG :
                            culturalZone === 'EUROPEAN' ? OverlayObjectType.BELL :
                            OverlayObjectType.GONG;
    
    tiles[announcementY][announcementX].overlayObject = {
      type: announcementType,
      rotation: 0
    };
  }
  
  // Add religious elements for theocracies
  if (governmentType === 'theocracy' || governmentType === 'religious') {
    const altarX = chamberArea.x + Math.floor(chamberArea.width / 2);
    const altarY = chamberArea.y + 5;
    
    if (tiles[altarY] && tiles[altarY][altarX]) {
      tiles[altarY][altarX].overlayObject = {
        type: OverlayObjectType.ALTAR,
        rotation: 0
      };
      tiles[altarY][altarX].isBlocking = true;
    }
    
    // Add shrine or idol
    if (culturalZone === 'EAST_ASIAN' || culturalZone === 'SOUTH_ASIAN') {
      if (tiles[altarY - 1] && tiles[altarY - 1][altarX]) {
        tiles[altarY - 1][altarX].overlayObject = {
          type: OverlayObjectType.SHRINE,
          rotation: 0
        };
      }
    }
    
    // Add prayer mats for Islamic governments
    if (culturalZone === 'MENA') {
      for (let x = altarX - 2; x <= altarX + 2; x++) {
        if (tiles[altarY + 2] && tiles[altarY + 2][x]) {
          tiles[altarY + 2][x].overlayObject = {
            type: OverlayObjectType.PRAYER_MAT,
            rotation: 0
          };
        }
      }
    }
  }
}

/**
 * Enhance foyer with reception furniture and displays
 */
function enhanceFoyer(
  tiles: Tile[][],
  foyerArea: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.era || 'MEDIEVAL';
  
  // Add reception counter
  const counterY = foyerArea.y + Math.floor(foyerArea.height / 2);
  const counterX = foyerArea.x + 2;
  
  if (tiles[counterY] && tiles[counterY][counterX]) {
    tiles[counterY][counterX].overlayObject = {
      type: OverlayObjectType.COUNTER,
      rotation: 0
    };
    tiles[counterY][counterX].isBlocking = true;
  }
  
  // Add coat rack near entrance
  const coatRackX = foyerArea.x + foyerArea.width - 3;
  const coatRackY = foyerArea.y + 2;
  
  if (tiles[coatRackY] && tiles[coatRackY][coatRackX]) {
    tiles[coatRackY][coatRackX].overlayObject = {
      type: OverlayObjectType.COAT_RACK,
      rotation: 0
    };
  }
  
  // Add display cases for civic artifacts
  const displayY = foyerArea.y + Math.floor(foyerArea.height / 2);
  for (let x = foyerArea.x + 4; x < foyerArea.x + foyerArea.width - 4; x += 3) {
    if (tiles[displayY] && tiles[displayY][x]) {
      tiles[displayY][x].overlayObject = {
        type: OverlayObjectType.DISPLAY_CASE,
        rotation: 0
      };
      tiles[displayY][x].isBlocking = true;
    }
  }
  
  // Add mirror for dignity checks
  const mirrorX = foyerArea.x + 1;
  const mirrorY = foyerArea.y + Math.floor(foyerArea.height / 2);
  
  if (tiles[mirrorY] && tiles[mirrorY][mirrorX]) {
    tiles[mirrorY][mirrorX].overlayObject = {
      type: OverlayObjectType.MIRROR,
      rotation: 90
    };
  }
  
  // Add statues of founders/leaders
  if (foyerArea.width > 8) {
    const statueY = foyerArea.y + 1;
    const statueX1 = foyerArea.x + 3;
    const statueX2 = foyerArea.x + foyerArea.width - 4;
    
    if (tiles[statueY] && tiles[statueY][statueX1]) {
      tiles[statueY][statueX1].overlayObject = {
        type: OverlayObjectType.STATUE,
        rotation: 0
      };
      tiles[statueY][statueX1].isBlocking = true;
    }
    
    if (tiles[statueY] && tiles[statueY][statueX2]) {
      tiles[statueY][statueX2].overlayObject = {
        type: OverlayObjectType.STATUE,
        rotation: 0
      };
      tiles[statueY][statueX2].isBlocking = true;
    }
  }
  
  // Add planters or vases for decoration
  const decorY = foyerArea.y + foyerArea.height - 2;
  for (let x = foyerArea.x + 2; x < foyerArea.x + foyerArea.width - 2; x += 4) {
    if (tiles[decorY] && tiles[decorY][x]) {
      const decorType = culturalZone === 'EAST_ASIAN' ? OverlayObjectType.VASE :
                       culturalZone === 'EUROPEAN' ? OverlayObjectType.PLANTER :
                       OverlayObjectType.VASE;
      
      tiles[decorY][x].overlayObject = {
        type: decorType,
        rotation: 0
      };
    }
  }
  
  // Add filing cabinet for modern governments
  if (era === 'MODERN_ERA' || era === 'INDUSTRIAL_ERA') {
    const filingX = foyerArea.x + 2;
    const filingY = foyerArea.y + 3;
    
    if (tiles[filingY] && tiles[filingY][filingX]) {
      tiles[filingY][filingX].overlayObject = {
        type: OverlayObjectType.FILING_CABINET,
        rotation: 0
      };
      tiles[filingY][filingX].isBlocking = true;
    }
  }
}

/**
 * Enhance offices with proper equipment and storage
 */
function enhanceOffices(
  tiles: Tile[][],
  officeArea: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  side: 'left' | 'right'
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.era || 'MEDIEVAL';
  
  // Determine desk facing direction based on side
  const deskType = side === 'left' ? OverlayObjectType.DESK_FACING_EAST : OverlayObjectType.DESK_FACING_WEST;
  
  // Place desk in center of office
  const deskX = officeArea.x + Math.floor(officeArea.width / 2);
  const deskY = officeArea.y + Math.floor(officeArea.height / 2);
  
  if (tiles[deskY] && tiles[deskY][deskX]) {
    tiles[deskY][deskX].overlayObject = {
      type: deskType,
      rotation: 0
    };
    tiles[deskY][deskX].isBlocking = true;
  }
  
  // Add chair at desk
  const chairX = side === 'left' ? deskX - 1 : deskX + 1;
  if (tiles[deskY] && tiles[deskY][chairX]) {
    tiles[deskY][chairX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: side === 'left' ? 90 : 270
    };
    tiles[deskY][chairX].isBlocking = true;
  }
  
  // Add bookshelf against wall
  const bookshelfType = side === 'left' ? 
    OverlayObjectType.BOOKSHELF_AGAINST_WEST_WALL : 
    OverlayObjectType.BOOKSHELF_AGAINST_EAST_WALL;
  
  const bookshelfX = side === 'left' ? officeArea.x : officeArea.x + officeArea.width - 1;
  const bookshelfY = officeArea.y + 2;
  
  if (tiles[bookshelfY] && tiles[bookshelfY][bookshelfX]) {
    tiles[bookshelfY][bookshelfX].overlayObject = {
      type: bookshelfType,
      rotation: 0
    };
    tiles[bookshelfY][bookshelfX].isBlocking = true;
  }
  
  // Add storage based on culture and era
  if (era === 'MODERN_ERA' || era === 'INDUSTRIAL_ERA') {
    // Filing cabinet
    const filingX = side === 'left' ? officeArea.x + 1 : officeArea.x + officeArea.width - 2;
    const filingY = officeArea.y + officeArea.height - 2;
    
    if (tiles[filingY] && tiles[filingY][filingX]) {
      tiles[filingY][filingX].overlayObject = {
        type: OverlayObjectType.FILING_CABINET,
        rotation: 0
      };
      tiles[filingY][filingX].isBlocking = true;
    }
  } else if (culturalZone === 'EAST_ASIAN') {
    // Scroll rack or tansu
    const storageX = side === 'left' ? officeArea.x + 1 : officeArea.x + officeArea.width - 2;
    const storageY = officeArea.y + 3;
    
    if (tiles[storageY] && tiles[storageY][storageX]) {
      const storageType = era === 'MEDIEVAL' ? OverlayObjectType.SCROLL_RACK : OverlayObjectType.TANSU;
      tiles[storageY][storageX].overlayObject = {
        type: storageType,
        rotation: 0
      };
      tiles[storageY][storageX].isBlocking = true;
    }
    
    // Lacquer box for valuables
    const boxX = deskX;
    const boxY = deskY - 1;
    if (tiles[boxY] && tiles[boxY][boxX]) {
      tiles[boxY][boxX].overlayObject = {
        type: OverlayObjectType.LACQUER_BOX,
        rotation: 0
      };
    }
  } else {
    // Ornate chest for documents
    const chestX = side === 'left' ? officeArea.x + 1 : officeArea.x + officeArea.width - 2;
    const chestY = officeArea.y + officeArea.height - 2;
    
    if (tiles[chestY] && tiles[chestY][chestX]) {
      tiles[chestY][chestX].overlayObject = {
        type: OverlayObjectType.CHEST_ORNATE,
        rotation: 0
      };
      tiles[chestY][chestX].isBlocking = true;
    }
  }
  
  // Add desk lamp or candle
  const lampX = deskX;
  const lampY = deskY - 1;
  
  if (tiles[lampY] && tiles[lampY][lampX] && !tiles[lampY][lampX].overlayObject) {
    const lampType = era === 'MODERN_ERA' ? OverlayObjectType.ELECTRIC_LAMP :
                    era === 'INDUSTRIAL_ERA' ? OverlayObjectType.OIL_LAMP :
                    OverlayObjectType.CANDLE;
    
    tiles[lampY][lampX].overlayObject = {
      type: lampType,
      rotation: 0
    };
  }
}

/**
 * Enhance seating with luxury materials based on culture and wealth
 */
function enhanceSeatingWithLuxuryMaterials(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  // Find all bench/chair tiles and enhance them
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (tiles[y] && tiles[y][x] && tiles[y][x].overlayObject) {
        const obj = tiles[y][x].overlayObject;
        
        // Enhance benches and chairs with cushions or luxury materials
        if (obj.type === OverlayObjectType.BENCH || obj.type === OverlayObjectType.CHAIR) {
          // Add material variant based on culture
          if (culturalZone === 'EUROPEAN') {
            obj.material = 'mahogany';
            obj.variant = 'cushioned';
          } else if (culturalZone === 'MENA') {
            obj.material = 'cedar';
            obj.variant = 'ornate';
          } else if (culturalZone === 'EAST_ASIAN') {
            obj.material = 'bamboo';
            obj.variant = 'lacquered';
          } else if (culturalZone === 'SOUTH_ASIAN') {
            obj.material = 'teak';
            obj.variant = 'carved';
          }
        }
        
        // Enhance desks with inlay or carving
        if (obj.type === OverlayObjectType.DESK) {
          if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') {
            obj.variant = 'inlaid';
          } else if (culturalZone === 'EAST_ASIAN' || culturalZone === 'SOUTH_ASIAN') {
            obj.variant = 'carved';
          }
        }
      }
    }
  }
}

/**
 * Add multi-tile table configurations for large meetings
 */
function addMultiTableConfiguration(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  config: SpecialMapConfig
): void {
  // Create a large meeting table using TABLE_LEFT, TABLE_CENTER, TABLE_RIGHT
  const tableLength = 5; // 5-tile long table
  const startX = centerX - Math.floor(tableLength / 2);
  
  for (let i = 0; i < tableLength; i++) {
    const x = startX + i;
    let tableType: OverlayObjectType;
    
    if (i === 0) {
      tableType = OverlayObjectType.TABLE_LEFT;
    } else if (i === tableLength - 1) {
      tableType = OverlayObjectType.TABLE_RIGHT;
    } else {
      tableType = OverlayObjectType.TABLE_CENTER;
    }
    
    if (tiles[centerY] && tiles[centerY][x]) {
      tiles[centerY][x].overlayObject = {
        type: tableType,
        rotation: 0,
        material: config.wealthLevel === 'rich' ? 'mahogany' : 'oak'
      };
      tiles[centerY][x].isBlocking = true;
    }
  }
  
  // Add chairs around the table
  for (let i = 0; i < tableLength; i++) {
    const x = startX + i;
    
    // North side chairs
    if (tiles[centerY - 1] && tiles[centerY - 1][x]) {
      tiles[centerY - 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 180, // Face south
        material: config.wealthLevel === 'rich' ? 'mahogany' : 'oak'
      };
      tiles[centerY - 1][x].isBlocking = true;
    }
    
    // South side chairs
    if (tiles[centerY + 1] && tiles[centerY + 1][x]) {
      tiles[centerY + 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0, // Face north
        material: config.wealthLevel === 'rich' ? 'mahogany' : 'oak'
      };
      tiles[centerY + 1][x].isBlocking = true;
    }
  }
}