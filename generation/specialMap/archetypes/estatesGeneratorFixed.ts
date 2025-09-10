/**
 * Fixed Estate Generator with Symmetrical Room-Based Architecture
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
// Simple landscape border size - removed specialMapAugmentation dependency
const LANDSCAPE_BORDER_ROWS = 3; // Default border size for estates

type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel' | 'earth' | 'hide';
import { placePillar, placeTable, placeLightSource, placeFirepit } from '../multiTileSystem';
import { 
  placeDeskWithChair, 
  placeBookshelfAgainstWall, 
  placeBenchWithOrientation,
  placeBedWithOrientation,
  placeCulturalDecoration
} from '../directionalFurniturePlacement';
import { 
  placeRoundTable,
  placeLShapedTable,
  placeBanquetTable,
  placeFourPosterBed,
  placeSmartTable
} from '../advancedFurnitureSystem';
import { 
  lightRoom,
  placeChandelier,
  placeFireplace,
  getCulturalLighting,
  placeWallSconce
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  getCulturalStorage,
  createBathroom,
  placeWineRack
} from '../storageUtilitySystem';

/**
 * Zone types for procedural placement
 */
enum ZoneType {
  PERIMETER = 'perimeter',
  CORNER = 'corner',
  CENTER = 'center',
  FOCUS = 'focus',
  TRAFFIC = 'traffic'
}

/**
 * Furniture cluster types
 */
enum ClusterType {
  OFFICE = 'office',
  MEETING = 'meeting',
  AUTHORITY = 'authority',
  BEDROOM = 'bedroom',
  STORAGE = 'storage',
  GUARD = 'guard'
}

/**
 * Get culturally appropriate wall opening based on culture and era
 */
function getCulturalOpening(config: SpecialMapConfig): BiomeType {
  const { culturalZone, era } = config;
  
  // Modern era uses regular doors everywhere
  if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
    return BiomeType.DOOR;
  }
  
  // MENA uses archways in appropriate periods
  if (culturalZone === 'MENA' && era !== 'PREHISTORY') {
    return BiomeType.DOOR; // Use door with arched style instead
  }
  
  // East Asian uses different door styles
  if (culturalZone === 'EAST_ASIAN') {
    if (era === 'PREHISTORY' || era === 'ANTIQUITY') {
      return BiomeType.DOOR; // Simple wooden doors
    }
    // Medieval and later could use sliding doors (represented as regular doors)
    return BiomeType.DOOR;
  }
  
  // European styles
  if (culturalZone === 'EUROPEAN') {
    if (era === 'ANTIQUITY') {
      return BiomeType.DOOR; // Roman doors with arched style
    }
    if (era === 'MEDIEVAL') {
      return BiomeType.DOOR; // Heavy wooden doors
    }
    if (era === 'RENAISSANCE_EARLY_MODERN') {
      return BiomeType.DOOR; // Ornate doors
    }
  }
  
  // Indigenous/prehistoric uses simple openings
  if (era === 'PREHISTORY') {
    return BiomeType.DOOR; // Hide flaps, simple barriers
  }
  
  // Default
  return BiomeType.DOOR;
}

/**
 * Determine if this should be a great hall configuration
 */
function shouldGenerateGreatHall(config: SpecialMapConfig): boolean {
  const { culturalZone, era, specificYear } = config;
  
  // Viking great halls (800-1100 CE)
  const isViking = culturalZone === 'EUROPEAN' && 
                   era === 'MEDIEVAL' &&
                   specificYear && specificYear >= 800 && specificYear <= 1100;
  
  // Indigenous longhouses
  const isIndigenous = (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' ||
                        culturalZone === 'AMERICAS') &&
                       (era === 'PREHISTORY' || era === 'ANTIQUITY' || era === 'MEDIEVAL');
  
  // Oceanic meeting houses
  const isOceanic = culturalZone === 'OCEANIA' && 
                    (era === 'PREHISTORY' || era === 'ANTIQUITY');
  
  return isViking || isIndigenous || isOceanic;
}

/**
 * Main estate generation function
 */
export function generateEstates(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: any, // ValueNoise parameter, not used but needed for signature
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
  
  // Determine estate type based on districtType
  let estateType = 'palace'; // default
  if (config.districtType) {
    switch (config.districtType) {
      case 'palace':
      case 'royal_hall':
        estateType = 'royal_palace'; // Grand monarchy
        break;
      case 'castle':
      case 'hillfort':
        estateType = 'fortress_palace'; // Military stronghold
        break;
      case 'royal_temple':
      case 'sacred_council':
        estateType = 'temple_palace'; // Religious compound
        break;
      case 'chiefly_court':
      case 'compound':
        estateType = 'tribal_compound'; // Tribal chief's residence
        break;
      case 'settlement_council':
        estateType = 'manor_house'; // Small settlement leader
        break;
      default:
        estateType = 'palace';
    }
  }
  
  // Determine landscape border
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'medium'] : 0;
  
  // Calculate building bounds
  const buildingLeft = borderSize;
  const buildingRight = size.width - borderSize;
  const buildingTop = borderSize;
  const buildingBottom = size.height - borderSize;
  const buildingWidth = buildingRight - buildingLeft;
  const buildingHeight = buildingBottom - buildingTop;
  
  // Fill landscape border FIRST if enabled
  if (config.hasLandscape && config.landscapeClimate) {
    fillLandscapeBorder(tiles, size, borderSize, config.landscapeClimate);
  }
  
  // THEN fill building interior area with floors
  const floorMaterial = config.floorMaterial || 'grey_stone';
  for (let y = borderSize; y < size.height - borderSize; y++) {
    for (let x = borderSize; x < size.width - borderSize; x++) {
      // Use era and culture appropriate flooring
      if (config.culturalZone === 'EUROPEAN' && config.era >= 'RENAISSANCE_EARLY_MODERN') {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      } else if (config.era === 'PREHISTORY' || config.era === 'ANTIQUITY') {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      } else {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      }
      applyMaterial(tiles[y][x], floorMaterial);
    }
  }
  
  // Add plaza paths to main entrance
  if (config.hasLandscape) {
    addPlazaPathToEntrance(tiles, size, borderSize, config.landscapeClimate);
  }
  
  // Check if this should be a great hall (viking/indigenous longhouse style)
  const isGreatHall = shouldGenerateGreatHall(config);
  
  // Get culturally appropriate opening type
  const openingType = getCulturalOpening(config);
  
  if (isGreatHall && (config.mapSize === 'large' || config.mapSize === 'xl')) {
    // Generate great hall layout for large/xl maps
    generateGreatHall(
      tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
      config, interactionZones, exitZones, rooms
    );
  } else {
    // Generate standard estate based on size
    switch (config.mapSize) {
      case 'xs':
      case 'small':
        generateSmallEstate(
          tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
          config, interactionZones, exitZones, rooms
        );
        break;
        
      case 'medium':
        generateMediumEstate(
          tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
          config, interactionZones, exitZones, rooms
        );
        break;
        
      case 'large':
        generateLargeEstate(
          tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
          config, interactionZones, exitZones, rooms
        );
        break;
        
      case 'xl':
        generateXLEstate(
          tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
          config, interactionZones, exitZones, rooms
        );
        break;
        
      default:
        generateLargeEstate(
          tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
          config, interactionZones, exitZones, rooms
        );
    }
  }
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Procedurally place furniture based on zones and density
 */
function procedurallyFurnishRoom(
  tiles: Tile[][],
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  roomType: string,
  config: SpecialMapConfig
): void {
  const era = config.specificYear || 1400;
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const material = getMaterialForCulture(culturalZone);
  
  // Calculate target furniture density (15-25% of floor tiles)
  const totalTiles = roomWidth * roomHeight;
  const targetFurnitureCount = Math.floor(totalTiles * 0.20);
  let placedFurnitureCount = 0;
  
  // Define zones
  const zones = defineRoomZones(roomX, roomY, roomWidth, roomHeight);
  
  // 1. FOCUS ZONE - Skip if throne already placed
  // Note: Throne is placed separately in throne rooms before this function is called
  
  // 2. PERIMETER ZONE - Wall furniture
  placePerimeterFurniture(tiles, zones.perimeter, config, roomType);
  placedFurnitureCount += zones.perimeter.length / 4;
  
  // 3. CORNER ZONE - Decorative items
  placeCornerDecorations(tiles, zones.corner, config, roomType);
  placedFurnitureCount += zones.corner.length;
  
  // 4. CENTER ZONE - Main furniture clusters
  const clustersNeeded = Math.max(1, Math.floor((targetFurnitureCount - placedFurnitureCount) / 5));
  placeFurnitureClusters(tiles, zones.center, config, roomType, clustersNeeded);
  
  // 5. LIGHTING PASS - Ensure adequate lighting
  ensureAdequateLighting(tiles, roomX, roomY, roomWidth, roomHeight, config);
  
  // 6. DECORATION PASS - Add cultural decorations
  addCulturalDecorations(tiles, zones, config, roomType);
}

/**
 * Define zones within a room for furniture placement
 */
function defineRoomZones(
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number
): { [key in ZoneType]: Array<{x: number, y: number}> } {
  const zones = {
    [ZoneType.PERIMETER]: [] as Array<{x: number, y: number}>,
    [ZoneType.CORNER]: [] as Array<{x: number, y: number}>,
    [ZoneType.CENTER]: [] as Array<{x: number, y: number}>,
    [ZoneType.FOCUS]: [] as Array<{x: number, y: number}>,
    [ZoneType.TRAFFIC]: [] as Array<{x: number, y: number}>
  };
  
  for (let y = roomY; y < roomY + roomHeight; y++) {
    for (let x = roomX; x < roomX + roomWidth; x++) {
      const distFromLeft = x - roomX;
      const distFromRight = (roomX + roomWidth - 1) - x;
      const distFromTop = y - roomY;
      const distFromBottom = (roomY + roomHeight - 1) - y;
      
      // Corner zones (2x2 in each corner)
      if ((distFromLeft < 2 && distFromTop < 2) ||
          (distFromRight < 2 && distFromTop < 2) ||
          (distFromLeft < 2 && distFromBottom < 2) ||
          (distFromRight < 2 && distFromBottom < 2)) {
        zones[ZoneType.CORNER].push({x, y});
      }
      // Perimeter zones (along walls but not corners)
      else if (distFromLeft === 0 || distFromRight === 0 || 
               distFromTop === 0 || distFromBottom === 0) {
        zones[ZoneType.PERIMETER].push({x, y});
      }
      // Focus zone (throne/podium area)
      else if (distFromTop < 3 && Math.abs(x - (roomX + roomWidth/2)) < 2) {
        zones[ZoneType.FOCUS].push({x, y});
      }
      // Traffic zones (main pathways)
      else if (Math.abs(x - (roomX + roomWidth/2)) < 1 || 
               distFromBottom < 2) {
        zones[ZoneType.TRAFFIC].push({x, y});
      }
      // Center zones (everything else)
      else {
        zones[ZoneType.CENTER].push({x, y});
      }
    }
  }
  
  return zones;
}

/**
 * Place appropriate furniture along walls
 */
function placePerimeterFurniture(
  tiles: Tile[][],
  perimeterZone: Array<{x: number, y: number}>,
  config: SpecialMapConfig,
  roomType: string
): void {
  const era = config.specificYear || 1400;
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const material = getMaterialForCulture(culturalZone);
  
  // Place furniture every 3-4 tiles along perimeter
  for (let i = 0; i < perimeterZone.length; i += 4) {
    const pos = perimeterZone[i];
    if (!tiles[pos.y]?.[pos.x] || tiles[pos.y][pos.x].isBlocking) continue;
    
    const furnitureChoice = i % 3;
    
    switch (furnitureChoice) {
      case 0: // Bench
        if (roomType === 'throne_room' || roomType === 'assembly') {
          placeBenchWithOrientation(tiles, pos.x, pos.y, 2, 1, culturalZone, material);
        }
        break;
      case 1: // Storage
        placeCulturalStorage(tiles, pos.x, pos.y, culturalZone, era, 
                           roomType === 'throne_room' ? 'valuables' : 'general');
        break;
      case 2: // Decorative
        if (era < 1900) {
          placeWallSconce(tiles, pos.x, pos.y, culturalZone, era);
        }
        break;
    }
  }
}

/**
 * Place decorations in corners
 */
function placeCornerDecorations(
  tiles: Tile[][],
  cornerZone: Array<{x: number, y: number}>,
  config: SpecialMapConfig,
  roomType: string
): void {
  const era = config.specificYear || 1400;
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  // Group corners
  const corners = [
    cornerZone.filter(p => p.x < cornerZone[0].x + 2 && p.y < cornerZone[0].y + 2),
    cornerZone.filter(p => p.x > cornerZone[0].x + 2 && p.y < cornerZone[0].y + 2),
    cornerZone.filter(p => p.x < cornerZone[0].x + 2 && p.y > cornerZone[0].y + 2),
    cornerZone.filter(p => p.x > cornerZone[0].x + 2 && p.y > cornerZone[0].y + 2)
  ];
  
  corners.forEach((corner, index) => {
    if (corner.length === 0) return;
    const mainPos = corner[0];
    if (!tiles[mainPos.y]?.[mainPos.x] || tiles[mainPos.y][mainPos.x].isBlocking) return;
    
    switch (index % 4) {
      case 0: // Statue/armor stand
        if (roomType === 'throne_room' && (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN')) {
          tiles[mainPos.y][mainPos.x].overlayObject = {
            type: OverlayObjectType.ARMOR_STAND,
            rotation: 0,
            variant: culturalZone
          };
          tiles[mainPos.y][mainPos.x].isBlocking = true;
        }
        break;
      case 1: // Plant/vase
        tiles[mainPos.y][mainPos.x].overlayObject = {
          type: OverlayObjectType.VASE,
          rotation: 0,
          material: culturalZone === 'EAST_ASIAN' ? 'porcelain' : 'ceramic'
        };
        tiles[mainPos.y][mainPos.x].isBlocking = true;
        break;
      case 2: // Brazier/lighting
        if (era < 1900) {
          tiles[mainPos.y][mainPos.x].overlayObject = {
            type: OverlayObjectType.BRAZIER,
            rotation: 0,
            variant: 'flame'
          };
          tiles[mainPos.y][mainPos.x].isBlocking = true;
        }
        break;
      case 3: // Storage
        placeCulturalStorage(tiles, mainPos.x, mainPos.y, culturalZone, era, 'valuables');
        break;
    }
  });
}

/**
 * Place furniture clusters in center areas
 */
function placeFurnitureClusters(
  tiles: Tile[][],
  centerZone: Array<{x: number, y: number}>,
  config: SpecialMapConfig,
  roomType: string,
  numClusters: number
): void {
  const era = config.specificYear || 1400;
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const material = getMaterialForCulture(culturalZone);
  
  // Divide center zone into cluster areas
  const clusterSize = Math.max(4, Math.floor(centerZone.length / numClusters));
  
  for (let i = 0; i < numClusters && i * clusterSize < centerZone.length; i++) {
    const clusterStart = i * clusterSize;
    const clusterPoints = centerZone.slice(clusterStart, clusterStart + clusterSize);
    
    if (clusterPoints.length < 4) continue;
    
    // Find center of cluster
    const centerX = Math.floor(clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length);
    const centerY = Math.floor(clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length);
    
    // Place appropriate cluster based on room type
    if (roomType === 'throne_room') {
      // Meeting table cluster
      if (i === 0 && tiles[centerY]?.[centerX] && !tiles[centerY][centerX].isBlocking) {
        placeSmartTable(tiles, centerX - 1, centerY, 3, 2, 'meeting', culturalZone, material);
        // Add chairs around table
        placeBenchWithOrientation(tiles, centerX - 2, centerY, 1, 2, culturalZone, material);
        placeBenchWithOrientation(tiles, centerX + 2, centerY, 1, 2, culturalZone, material);
      }
    } else if (roomType === 'bedroom') {
      // Bedroom cluster
      if (i === 0) {
        placeFourPosterBed(tiles, centerX - 1, centerY - 1, culturalZone, material);
      }
    }
  }
}

/**
 * Ensure room has adequate lighting
 */
function ensureAdequateLighting(
  tiles: Tile[][],
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
  config: SpecialMapConfig
): void {
  const era = config.specificYear || 1400;
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  // Calculate lighting needs (1 light per 25 tiles)
  const tilesPerLight = 25;
  const lightsNeeded = Math.ceil((roomWidth * roomHeight) / tilesPerLight);
  let lightsPlaced = 0;
  
  // Count existing lights
  for (let y = roomY; y < roomY + roomHeight; y++) {
    for (let x = roomX; x < roomX + roomWidth; x++) {
      const overlay = tiles[y]?.[x]?.overlayObject;
      if (overlay && (
        overlay.type === OverlayObjectType.TORCH ||
        overlay.type === OverlayObjectType.BRAZIER ||
        overlay.type === OverlayObjectType.CANDELABRA_FLOOR ||
        overlay.type === OverlayObjectType.CHANDELIER ||
        overlay.type === OverlayObjectType.HANGING_LANTERN
      )) {
        lightsPlaced++;
      }
    }
  }
  
  // Add more lights if needed
  const additionalLightsNeeded = lightsNeeded - lightsPlaced;
  if (additionalLightsNeeded > 0) {
    // Place lights in a grid pattern
    const spacing = Math.floor(Math.sqrt(tilesPerLight));
    
    for (let y = roomY + spacing; y < roomY + roomHeight && lightsPlaced < lightsNeeded; y += spacing) {
      for (let x = roomX + spacing; x < roomX + roomWidth && lightsPlaced < lightsNeeded; x += spacing) {
        if (tiles[y]?.[x] && !tiles[y][x].isBlocking && !tiles[y][x].overlayObject) {
          // Choose appropriate light type
          const lightType = getCulturalLighting(culturalZone, era, 'formal', true);
          tiles[y][x].overlayObject = {
            type: lightType,
            rotation: 0,
            variant: era >= 1900 ? 'electric' : 'flame'
          };
          if (lightType !== OverlayObjectType.CHANDELIER && lightType !== OverlayObjectType.HANGING_LANTERN) {
            tiles[y][x].isBlocking = true;
          }
          lightsPlaced++;
        }
      }
    }
  }
}

/**
 * Add cultural decorations to zones
 */
function addCulturalDecorations(
  tiles: Tile[][],
  zones: { [key in ZoneType]: Array<{x: number, y: number}> },
  config: SpecialMapConfig,
  roomType: string
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.specificYear || 1400;
  
  // Add rugs in center areas
  if (culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN') {
    const rugPositions = zones[ZoneType.CENTER].filter((_, i) => i % 8 === 0);
    rugPositions.forEach(pos => {
      if (tiles[pos.y]?.[pos.x] && !tiles[pos.y][pos.x].overlayObject) {
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.RUG,
          rotation: 0,
          variant: 'persian'
        };
      }
    });
  }
  
  // Add wall decorations
  const wallDecorations = zones[ZoneType.PERIMETER].filter((_, i) => i % 6 === 0);
  wallDecorations.forEach(pos => {
    if (tiles[pos.y]?.[pos.x] && !tiles[pos.y][pos.x].overlayObject && !tiles[pos.y][pos.x].isBlocking) {
      placeCulturalDecoration(tiles, pos.x, pos.y, culturalZone, roomType);
    }
  });
}

/**
 * Small estate - single throne room with antechamber
 */
function generateSmallEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  const openingType = getCulturalOpening(config);
  
  // Single-tile thick walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Throne at north with dais platform (place before procedural furnishing)
  placeThroneWithDais(tiles, centerX, startY + 2, config);
  
  // Use new procedural furnishing system (will add everything else)
  procedurallyFurnishRoom(tiles, startX + 1, startY + 1, width - 2, height - 2, 'throne_room', config);
  
  // Entrance at south
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    roomType: 'throne_room',
    accessLevel: 'public'
  });
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * Medium estate - throne room, antechamber, side chambers
 */
function generateMediumEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  const openingType = getCulturalOpening(config);
  const era = config.specificYear || 1400;
  const isWealthy = true;
  
  // Outer walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Symmetrical room division
  const throneRoomHeight = Math.floor(height * 0.5);
  const antechamberY = startY + throneRoomHeight;
  
  // Horizontal dividing wall with central archway
  for (let x = startX + 1; x < startX + width - 1; x++) {
    if (Math.abs(x - centerX) > 1) {
      // This is a horizontal wall at the top of a room, use back wall
      tiles[antechamberY][x].biome = BiomeType.WALL_BACK;
      tiles[antechamberY][x].isBlocking = true;
      applyMaterial(tiles[antechamberY][x], wallMaterial);
    }
  }
  
  // Archway with door
  tiles[antechamberY][centerX].biome = BiomeType.DOOR;
  tiles[antechamberY][centerX].isBlocking = false;
  
  // Place central feature based on district type
  if (config.districtType) {
    switch (config.districtType) {
      case 'royal_temple':
      case 'sacred_council':
        // Temple palace: altar instead of throne
        const altarY = startY + 3;
        tiles[altarY][centerX].biome = BiomeType.ALTAR;
        tiles[altarY][centerX].isBlocking = true;
        // Add religious decorations
        for (let dx = -2; dx <= 2; dx += 4) {
          tiles[altarY][centerX + dx].overlayObject = {
            type: OverlayObjectType.TORCH,
            rotation: 0,
            variant: 'candle'
          };
        }
        break;
        
      case 'castle':
      case 'hillfort':
        // Military fortress: weapon displays
        placeThroneWithDais(tiles, centerX, startY + 2, config);
        // Add weapon racks on sides
        tiles[startY + 3][centerX - 4].overlayObject = {
          type: OverlayObjectType.WEAPON_RACK,
          rotation: 0,
          variant: config.culturalZone
        };
        tiles[startY + 3][centerX + 4].overlayObject = {
          type: OverlayObjectType.WEAPON_RACK,
          rotation: 0,
          variant: config.culturalZone
        };
        break;
        
      case 'chiefly_court':
      case 'compound':
        // Tribal compound: central firepit with seating
        tiles[startY + 4][centerX].biome = BiomeType.FIREPIT;
        // Stone seating around fire
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
          const fx = centerX + Math.round(Math.cos(angle) * 3);
          const fy = startY + 4 + Math.round(Math.sin(angle) * 2);
          if (tiles[fy] && tiles[fy][fx]) {
            tiles[fy][fx].overlayObject = {
              type: OverlayObjectType.BENCH,
              rotation: 0,
              variant: 'stone'
            };
          }
        }
        break;
        
      case 'settlement_council':
        // Manor house: modest throne with table
        placeThroneWithDais(tiles, centerX, startY + 2, config);
        // Add council table
        for (let x = centerX - 2; x <= centerX + 2; x++) {
          tiles[startY + 6][x].overlayObject = {
            type: OverlayObjectType.TABLE,
            rotation: 0,
            variant: 'wood'
          };
        }
        break;
        
      default:
        // Default royal palace: grand throne
        placeThroneWithDais(tiles, centerX, startY + 2, config);
        break;
    }
  } else {
    // No district type, use default throne
    placeThroneWithDais(tiles, centerX, startY + 2, config);
  }
  
  // Use procedural furnishing for throne room (will add everything else)
  procedurallyFurnishRoom(tiles, startX + 1, startY + 1, width - 2, throneRoomHeight - 1, 'throne_room', config);
  
  // Use procedural furnishing for antechamber
  procedurallyFurnishRoom(tiles, startX + 1, antechamberY + 1, width - 2, height - throneRoomHeight - 2, 'foyer', config);
  
  // Add symmetrical pillars for grandeur
  if (width >= 12) {
    placePillar(tiles, centerX - 3, startY + 4, wallMaterial, config.specificYear || 1200);
    placePillar(tiles, centerX + 3, startY + 4, wallMaterial, config.specificYear || 1200);
  }
  
  // Main entrance (culturally appropriate)
  tiles[startY + height - 1][centerX].biome = openingType;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: throneRoomHeight - 1 },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });
  
  rooms.push({
    id: 'antechamber',
    name: 'Antechamber',
    bounds: { x: startX + 1, y: antechamberY + 1, width: width - 2, height: height - throneRoomHeight - 2 },
    roomType: 'foyer',
    accessLevel: 'public'
  });
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * Large estate - multiple rooms with symmetrical layout
 */
function generateLargeEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  const openingType = getCulturalOpening(config);
  
  // Outer walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Create symmetrical room layout
  // Reception hall at bottom (30%)
  // Side hallways (20% each side)
  // Throne room at top center (40%)
  // Side chambers
  
  const receptionHeight = Math.floor(height * 0.3);
  const throneRoomHeight = Math.floor(height * 0.4);
  const hallwayWidth = Math.floor(width * 0.2);
  
  // Reception/Foyer dividing wall
  const receptionY = startY + height - receptionHeight;
  for (let x = startX + 1; x < startX + width - 1; x++) {
    if (Math.abs(x - centerX) > 2) { // Leave space for double doors
      // This is a horizontal wall at the top of a room, use back wall
      tiles[receptionY][x].biome = BiomeType.WALL_BACK;
      tiles[receptionY][x].isBlocking = true;
      applyMaterial(tiles[receptionY][x], wallMaterial);
    }
  }
  
  // Side hallway walls (vertical)
  for (let y = startY + 1; y < receptionY; y++) {
    // Left hallway wall
    tiles[y][startX + hallwayWidth].biome = BiomeType.WALL;
    tiles[y][startX + hallwayWidth].isBlocking = true;
    applyMaterial(tiles[y][startX + hallwayWidth], wallMaterial);
    
    // Right hallway wall
    tiles[y][startX + width - hallwayWidth - 1].biome = BiomeType.WALL;
    tiles[y][startX + width - hallwayWidth - 1].isBlocking = true;
    applyMaterial(tiles[y][startX + width - hallwayWidth - 1], wallMaterial);
  }
  
  // Throne room back wall
  const throneY = startY + throneRoomHeight;
  for (let x = startX + hallwayWidth + 1; x < startX + width - hallwayWidth - 1; x++) {
    if (Math.abs(x - centerX) > 1) { // Leave space for door to private chambers
      // This is a horizontal wall at the top of a room, use back wall
      tiles[throneY][x].biome = BiomeType.WALL_BACK;
      tiles[throneY][x].isBlocking = true;
      applyMaterial(tiles[throneY][x], wallMaterial);
    }
  }
  
  // Doors
  // Main entrance (culturally appropriate)
  tiles[startY + height - 1][centerX].biome = openingType;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  // Reception to throne room
  tiles[receptionY][centerX].biome = BiomeType.DOOR;
  tiles[receptionY][centerX].isBlocking = false;
  
  // Hallway doors
  tiles[receptionY - 2][startX + hallwayWidth].biome = BiomeType.DOOR;
  tiles[receptionY - 2][startX + hallwayWidth].isBlocking = false;
  
  tiles[receptionY - 2][startX + width - hallwayWidth - 1].biome = BiomeType.DOOR;
  tiles[receptionY - 2][startX + width - hallwayWidth - 1].isBlocking = false;
  
  // Throne with dais platform
  placeThroneWithDais(tiles, centerX, startY + 2, config);
  
  // Use procedural furnishing for all rooms
  // Throne room
  procedurallyFurnishRoom(tiles, startX + hallwayWidth + 1, startY + 1,
                         width - (2 * hallwayWidth) - 2, throneRoomHeight - 1,
                         'throne_room', config);
  
  // Reception hall
  procedurallyFurnishRoom(tiles, startX + 1, receptionY + 1,
                         width - 2, receptionHeight - 2,
                         'reception', config);
  
  // Left corridor
  procedurallyFurnishRoom(tiles, startX + 1, startY + 1,
                         hallwayWidth - 1, receptionY - startY - 1,
                         'corridor', config);
  
  // Right corridor
  procedurallyFurnishRoom(tiles, startX + width - hallwayWidth, startY + 1,
                         hallwayWidth - 1, receptionY - startY - 1,
                         'corridor', config);
  
  // Symmetrical pillars in throne room
  const throneRoomWidth = width - (2 * hallwayWidth) - 2;
  if (throneRoomWidth >= 8) {
    const pillarY = startY + Math.floor(throneRoomHeight / 2);
    const pillarMaterial = getCulturalPillarMaterial(config);
    placePillar(tiles, centerX - 3, pillarY, pillarMaterial, config.specificYear || 1500);
    placePillar(tiles, centerX + 3, pillarY, pillarMaterial, config.specificYear || 1500);
  }
  
  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { 
      x: startX + hallwayWidth + 1, 
      y: startY + 1, 
      width: width - (2 * hallwayWidth) - 2, 
      height: throneRoomHeight - 1 
    },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });
  
  rooms.push({
    id: 'reception',
    name: 'Reception Hall',
    bounds: { 
      x: startX + 1, 
      y: receptionY + 1, 
      width: width - 2, 
      height: receptionHeight - 2 
    },
    roomType: 'foyer',
    accessLevel: 'public'
  });
  
  rooms.push({
    id: 'left_hallway',
    name: 'West Corridor',
    bounds: { 
      x: startX + 1, 
      y: startY + 1, 
      width: hallwayWidth - 1, 
      height: receptionY - startY - 1 
    },
    roomType: 'corridor',
    accessLevel: 'semi-public'
  });
  
  rooms.push({
    id: 'right_hallway',
    name: 'East Corridor',
    bounds: { 
      x: startX + width - hallwayWidth, 
      y: startY + 1, 
      width: hallwayWidth - 1, 
      height: receptionY - startY - 1 
    },
    roomType: 'corridor',
    accessLevel: 'semi-public'
  });
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * XL estate - grand palace with many rooms
 */
function generateXLEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  // Start with large estate base
  generateLargeEstate(tiles, startX, startY, width, height, config, interactionZones, exitZones, rooms);
  
  const centerX = startX + Math.floor(width / 2);
  const era = config.specificYear || 1700;
  const material = getMaterialForCulture(config.culturalZone);
  const hallwayWidth = Math.floor(width * 0.2);
  const throneRoomHeight = Math.floor(height * 0.4);
  
  // Add grand colonnade of pillars in throne room
  if (width >= 24) {
    const pillarMaterial = getCulturalPillarMaterial(config);
    // Double row of pillars
    for (let i = 0; i < 3; i++) {
      const pillarX1 = centerX - 8 + (i * 4);
      const pillarX2 = centerX + 2 + (i * 4);
      const pillarY = startY + 6 + (i * 3);
      
      if (pillarX1 > startX + hallwayWidth && pillarX1 < startX + width - hallwayWidth - 1) {
        placePillar(tiles, pillarX1, pillarY, pillarMaterial, era);
      }
      if (pillarX2 > startX + hallwayWidth && pillarX2 < startX + width - hallwayWidth - 1) {
        placePillar(tiles, pillarX2, pillarY, pillarMaterial, era);
      }
    }
  }
  
  // Add royal bedchamber with four-poster bed behind throne room
  if (height >= 30 && width >= 20) {
    const bedchamberY = startY + 1;
    const bedchamberX = centerX - 4;
    const bedchamberWidth = 9;
    const bedchamberHeight = 6;
    
    // Create doorway from throne room to bedchamber
    tiles[startY + throneRoomHeight][centerX].biome = BiomeType.DOOR;
    tiles[startY + throneRoomHeight][centerX].isBlocking = false;
    
    // Use procedural furnishing for royal bedchamber
    procedurallyFurnishRoom(tiles, bedchamberX, bedchamberY,
                           bedchamberWidth, bedchamberHeight,
                           'bedroom', config);
    
    // Add room definition
    rooms.push({
      id: 'royal_bedchamber',
      name: 'Royal Bedchamber',
      bounds: { x: bedchamberX, y: bedchamberY, width: bedchamberWidth, height: bedchamberHeight },
      roomType: 'bedroom',
      accessLevel: 'private'
    });
  }
  
  // Add library/study in left wing
  if (hallwayWidth >= 6) {
    const libraryY = startY + 2;
    const libraryHeight = Math.floor(throneRoomHeight / 2) - 2;
    
    // Use procedural furnishing for library
    procedurallyFurnishRoom(tiles, startX + 1, libraryY,
                           hallwayWidth - 1, libraryHeight,
                           'library', config);
    
    rooms.push({
      id: 'library',
      name: 'Royal Library',
      bounds: { x: startX + 1, y: libraryY, width: hallwayWidth - 1, height: libraryHeight },
      roomType: 'library',
      accessLevel: 'restricted'
    });
  }
  
  // Add guard quarters in right wing
  if (hallwayWidth >= 6) {
    const guardY = startY + 2;
    const guardHeight = Math.floor(throneRoomHeight / 2) - 2;
    const guardX = startX + width - hallwayWidth;
    
    // Use procedural furnishing for guard quarters
    procedurallyFurnishRoom(tiles, guardX, guardY,
                           hallwayWidth - 1, guardHeight,
                           'barracks', config);
    
    rooms.push({
      id: 'guard_quarters',
      name: 'Guard Quarters',
      bounds: { x: guardX, y: guardY, width: hallwayWidth - 1, height: guardHeight },
      roomType: 'barracks',
      accessLevel: 'restricted'
    });
  }
  
  // Add bathroom for modern estates
  if (era >= 1800 && width >= 24) {
    const bathX = startX + 2;
    const bathY = startY + height - 8;
    const bathWidth = 6;
    const bathHeight = 6;
    
    createBathroom(tiles, bathX, bathY, bathWidth, bathHeight, era, true);
    
    rooms.push({
      id: 'bathroom',
      name: 'Royal Bathroom',
      bounds: { x: bathX, y: bathY, width: bathWidth, height: bathHeight },
      roomType: 'bathroom',
      accessLevel: 'private'
    });
  }
  
  // Add wine cellar representation (storage area)
  if (width >= 20) {
    const cellarX = startX + width - 8;
    const cellarY = startY + height - 8;
    
    placeWineRack(tiles, cellarX, cellarY, 'large', material);
    placeCulturalStorage(tiles, cellarX + 3, cellarY,
                        config.culturalZone || 'EUROPEAN', era, 'commercial');
  }
}

/**
 * Draw single-tile thick walls
 */
function drawWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  material: MaterialType
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      // Only edges, single tile thick
      if (y === startY) {
        // North wall - use back wall for 3/4 perspective
        tiles[y][x].biome = BiomeType.WALL_BACK;
        tiles[y][x].isBlocking = true;
        applyMaterial(tiles[y][x], material);
      } else if (y === startY + height - 1 ||
                 x === startX || x === startX + width - 1) {
        // Other walls - use regular walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
        applyMaterial(tiles[y][x], material);
      }
    }
  }
}

/**
 * Place a throne with proper dais platform and surrounding decorations
 */
function placeThroneWithDais(tiles: Tile[][], throneX: number, throneY: number, config: SpecialMapConfig): void {
  const era = config.specificYear || 1400;
  
  // Create 3x3 dais platform around throne
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = throneX + dx;
      const y = throneY + dy;
      if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
        tiles[y][x].biome = BiomeType.DAIS;
        tiles[y][x].isBlocking = false; // Allow movement on dais
      }
    }
  }
  
  // Place throne in center using overlay system
  tiles[throneY][throneX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: config.culturalZone
  };
  tiles[throneY][throneX].isBlocking = true;
  
  // Add candelabras flanking the throne for dramatic lighting
  if (era < 1900) {
    // Left candelabra
    if (tiles[throneY]?.[throneX - 2]) {
      tiles[throneY][throneX - 2].overlayObject = {
        type: OverlayObjectType.CANDELABRA_FLOOR,
        rotation: 0,
        variant: 'candles_5'
      };
      tiles[throneY][throneX - 2].isBlocking = true;
    }
    // Right candelabra
    if (tiles[throneY]?.[throneX + 2]) {
      tiles[throneY][throneX + 2].overlayObject = {
        type: OverlayObjectType.CANDELABRA_FLOOR,
        rotation: 0,
        variant: 'candles_5'
      };
      tiles[throneY][throneX + 2].isBlocking = true;
    }
  }
  
  // Add cultural decorations behind throne
  if (tiles[throneY - 1]?.[throneX]) {
    placeCulturalDecoration(tiles, throneX, throneY - 1, config.culturalZone || 'EUROPEAN', 'royal');
  }
}

/**
 * Get appropriate material for culture
 */
function getMaterialForCulture(culturalZone?: string): string {
  switch (culturalZone) {
    case 'EAST_ASIAN':
      return 'lacquered_wood';
    case 'MENA':
      return 'cedar';
    case 'AFRICAN':
      return 'ebony';
    case 'SOUTH_ASIAN':
      return 'teak';
    case 'EUROPEAN':
      return 'oak';
    default:
      return 'wood';
  }
}

/**
 * Apply material styling to a tile
 */
function applyMaterial(tile: Tile, material: MaterialType): void {
  switch (material) {
    case 'white_marble':
      tile.structureType = 'marble';
      break;
    case 'grey_stone':
      tile.structureType = 'stone';
      break;
    case 'red_lacquer':
      tile.structureType = 'lacquered';
      break;
    case 'sandstone':
      tile.structureType = 'sandstone';
      break;
    case 'wood':
      tile.structureType = 'wooden';
      break;
    case 'steel':
      tile.structureType = 'metal';
      break;
    default:
      tile.structureType = 'stone';
  }
}

/**
 * Get culturally appropriate pillar material
 */
function getCulturalPillarMaterial(config: SpecialMapConfig): MaterialType {
  if (config.culturalZone === 'SOUTH_ASIAN') {
    return config.era === 'ANTIQUITY' ? 'sandstone' : 'red_lacquer';
  } else if (config.culturalZone === 'EAST_ASIAN') {
    return 'red_lacquer';
  } else if (config.culturalZone === 'MENA') {
    return 'sandstone';
  } else if (config.culturalZone === 'EUROPEAN' && config.era >= 'RENAISSANCE_EARLY_MODERN') {
    return 'white_marble';
  }
  return 'grey_stone';
}

/**
 * Add culturally-specific decorations to estate (legacy function)
 */
function addLegacyCulturalDecorations(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  hallwayWidth: number,
  throneRoomHeight: number
): void {
  const centerX = startX + Math.floor(width / 2);
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.era || 'MEDIEVAL';
  
  if (culturalZone === 'SOUTH_ASIAN') {
    // South Asian palaces have elaborate decorations
    
    // Add fountains in the courtyard/reception area
    const receptionY = startY + height - Math.floor(height * 0.3);
    if (width >= 12) {
      tiles[receptionY + 3][centerX - 4].biome = BiomeType.FOUNTAIN;
      tiles[receptionY + 3][centerX - 4].isBlocking = true;
      tiles[receptionY + 3][centerX + 4].biome = BiomeType.FOUNTAIN;
      tiles[receptionY + 3][centerX + 4].isBlocking = true;
    }
    
    // Add statues flanking the throne
    if (throneRoomHeight >= 8) {
      tiles[startY + 3][centerX - 2].biome = BiomeType.STATUE;
      tiles[startY + 3][centerX - 2].isBlocking = true;
      tiles[startY + 3][centerX + 2].biome = BiomeType.STATUE;
      tiles[startY + 3][centerX + 2].isBlocking = true;
      
      // Add armor stands as additional ceremonial displays
      tiles[startY + 5][centerX - 3].biome = BiomeType.ARMOR_STAND;
      tiles[startY + 5][centerX - 3].isBlocking = true;
      tiles[startY + 5][centerX + 3].biome = BiomeType.ARMOR_STAND;
      tiles[startY + 5][centerX + 3].isBlocking = true;
    }
    
    // Add ornate carpets in throne room
    for (let y = startY + 4; y < startY + throneRoomHeight - 2; y++) {
      tiles[y][centerX].biome = BiomeType.CARPET;
      if (width >= 14) {
        tiles[y][centerX - 1].biome = BiomeType.CARPET;
        tiles[y][centerX + 1].biome = BiomeType.CARPET;
      }
    }
    
    // Add more pillars in hallways (South Asian architecture often has many columns)
    if (hallwayWidth >= 4) {
      for (let y = startY + 4; y < receptionY - 4; y += 4) {
        // Left hallway pillars
        tiles[y][startX + 2].biome = BiomeType.COLUMN;
        tiles[y][startX + 2].isBlocking = true;
        // Right hallway pillars
        tiles[y][startX + width - 3].biome = BiomeType.COLUMN;
        tiles[y][startX + width - 3].isBlocking = true;
      }
    }
    
    // Add braziers for lighting using overlay system
    tiles[startY + 2][centerX - 4].overlayObject = {
      type: OverlayObjectType.BRAZIER,
      rotation: 0,
      variant: config.era === 'MODERN' ? 'electric' : 'flame'
    };
    tiles[startY + 2][centerX - 4].isBlocking = true;
    tiles[startY + 2][centerX + 4].overlayObject = {
      type: OverlayObjectType.BRAZIER,
      rotation: 0,
      variant: config.era === 'MODERN' ? 'electric' : 'flame'
    };
    tiles[startY + 2][centerX + 4].isBlocking = true;
    
    // Add weapon racks in guard positions
    if (width >= 16) {
      tiles[receptionY - 2][startX + 2].biome = BiomeType.WEAPON_RACK;
      tiles[receptionY - 2][startX + 2].isBlocking = true;
      tiles[receptionY - 2][startX + width - 3].biome = BiomeType.WEAPON_RACK;
      tiles[receptionY - 2][startX + width - 3].isBlocking = true;
    }
    
  } else if (culturalZone === 'EAST_ASIAN') {
    // East Asian palaces have symmetrical gardens and screens
    
    // Add decorative screens (using cabinets as proxy)
    const receptionY = startY + height - Math.floor(height * 0.3);
    for (let x = startX + 2; x < startX + width - 2; x += 5) {
      if (Math.abs(x - centerX) > 3) {
        tiles[receptionY + 2][x].biome = BiomeType.CABINET;
        tiles[receptionY + 2][x].isBlocking = true;
      }
    }
    
    // Add planters for indoor gardens
    if (width >= 14) {
      tiles[startY + 5][startX + 3].biome = BiomeType.PLANTER;
      tiles[startY + 5][startX + 3].isBlocking = true;
      tiles[startY + 5][startX + width - 4].biome = BiomeType.PLANTER;
      tiles[startY + 5][startX + width - 4].isBlocking = true;
    }
    
  } else if (culturalZone === 'MENA') {
    // Middle Eastern palaces have geometric patterns and fountains
    
    // Central fountain in reception
    const receptionY = startY + height - Math.floor(height * 0.3);
    tiles[receptionY + 4][centerX].biome = BiomeType.FOUNTAIN;
    tiles[receptionY + 4][centerX].isBlocking = true;
    
    // Geometric carpet pattern
    for (let y = startY + 2; y < startY + throneRoomHeight - 1; y += 2) {
      for (let x = centerX - 2; x <= centerX + 2; x += 2) {
        if (tiles[y][x].biome === BiomeType.FLOOR_STONE || tiles[y][x].biome === BiomeType.FLOOR_MARBLE) {
          tiles[y][x].biome = BiomeType.FLOOR_PATTERN;
        }
      }
    }
  }
  
  // Add torches/lighting for all cultures
  addLightingToEstate(tiles, startX, startY, width, height, config);
}

/**
 * Add furniture to hallways for more variety
 */
function addHallwayFurniture(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  hallwayWidth: number,
  throneRoomHeight: number,
  receptionY: number,
  config: SpecialMapConfig
): void {
  // Left hallway - add storage and seating
  if (hallwayWidth >= 3) {
    // Add cabinets for storage
    for (let y = startY + 4; y < receptionY - 4; y += 6) {
      if (tiles[y] && tiles[y][startX + 2]) {
        tiles[y][startX + 2].biome = BiomeType.CABINET;
        tiles[y][startX + 2].isBlocking = true;
      }
    }
    
    // Add benches for waiting
    for (let y = startY + 7; y < receptionY - 4; y += 6) {
      if (tiles[y] && tiles[y][startX + hallwayWidth - 2]) {
        tiles[y][startX + hallwayWidth - 2].biome = BiomeType.BENCH;
        tiles[y][startX + hallwayWidth - 2].isBlocking = true;
      }
    }
  }
  
  // Right hallway - add guard equipment and beds
  if (hallwayWidth >= 3) {
    // Add weapon racks for guards
    for (let y = startY + 5; y < receptionY - 4; y += 8) {
      if (tiles[y] && tiles[y][startX + width - 3]) {
        tiles[y][startX + width - 3].biome = BiomeType.WEAPON_RACK;
        tiles[y][startX + width - 3].isBlocking = true;
      }
    }
    
    // Add beds for guard quarters (if space allows)
    if (hallwayWidth >= 4) {
      for (let y = startY + 3; y < receptionY - 4; y += 8) {
        if (tiles[y] && tiles[y][startX + width - hallwayWidth + 1]) {
          tiles[y][startX + width - hallwayWidth + 1].biome = BiomeType.BED;
          tiles[y][startX + width - hallwayWidth + 1].isBlocking = true;
        }
      }
    }
  }
  
  // Add desks in strategic positions for administration
  if (width >= 20 && hallwayWidth >= 4) {
    // Left hallway desk
    if (tiles[throneRoomHeight - 2] && tiles[throneRoomHeight - 2][startX + 2]) {
      tiles[throneRoomHeight - 2][startX + 2].biome = BiomeType.DESK;
      tiles[throneRoomHeight - 2][startX + 2].isBlocking = true;
      tiles[throneRoomHeight - 1][startX + 2].biome = BiomeType.CHAIR;
      tiles[throneRoomHeight - 1][startX + 2].isBlocking = true;
    }
    
    // Right hallway desk
    if (tiles[throneRoomHeight - 2] && tiles[throneRoomHeight - 2][startX + width - 3]) {
      tiles[throneRoomHeight - 2][startX + width - 3].biome = BiomeType.DESK;
      tiles[throneRoomHeight - 2][startX + width - 3].isBlocking = true;
      tiles[throneRoomHeight - 1][startX + width - 3].biome = BiomeType.CHAIR;
      tiles[throneRoomHeight - 1][startX + width - 3].isBlocking = true;
    }
  }
}

/**
 * Add appropriate lighting to estate
 */
function addLightingToEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  const isModern = config.era === 'MODERN' || config.era === 'FUTURE';
  const lightingType = config.era === 'PREHISTORY' || config.era === 'ANTIQUITY' ? 
    OverlayObjectType.TORCH : OverlayObjectType.BRAZIER;
  
  // Add torches along walls at regular intervals
  for (let y = startY + 2; y < startY + height - 2; y += 4) {
    // Left wall
    if (tiles[y][startX + 1].biome !== BiomeType.DOOR) {
      tiles[y][startX + 1].overlayObject = {
        type: lightingType,
        rotation: 90, // Face right into room
        variant: isModern ? 'electric' : 'flame'
      };
      tiles[y][startX + 1].isBlocking = true;
    }
    // Right wall
    if (tiles[y][startX + width - 2].biome !== BiomeType.DOOR) {
      tiles[y][startX + width - 2].overlayObject = {
        type: lightingType,
        rotation: 270, // Face left into room
        variant: isModern ? 'electric' : 'flame'
      };
      tiles[y][startX + width - 2].isBlocking = true;
    }
  }
}

/**
 * Fill landscape border with climate-appropriate terrain
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Only fill actual border area
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        
        const tile = tiles[y][x];
        
        // Add variety within climate types using position-based pseudo-random
        const variation = (x + y * size.width) % 100;
        
        switch (climate) {
          case 'arid':
            if (variation < 70) {
              tile.biome = BiomeType.DESERT;
            } else if (variation < 85) {
              tile.biome = BiomeType.SCRUB;
            } else if (variation < 95) {
              tile.biome = BiomeType.OASIS;
            } else {
              tile.biome = BiomeType.GRASSLAND;
            }
            break;
            
          case 'temperate':
            if (variation < 50) {
              tile.biome = BiomeType.GRASSLAND;
            } else if (variation < 75) {
              tile.biome = BiomeType.FOREST;
            } else if (variation < 95) {
              tile.biome = BiomeType.SCRUB;
            } else {
              tile.biome = BiomeType.WETLANDS;
            }
            break;
            
          case 'cold':
            if (variation < 70) {
              tile.biome = BiomeType.SNOW;
            } else if (variation < 85) {
              tile.biome = BiomeType.TUNDRA;
            } else if (variation < 99) {
              tile.biome = BiomeType.GRASSLAND;
            } else {
              tile.biome = BiomeType.MOUNTAIN;
            }
            break;
            
          case 'tropical':
          case 'semitropical':
            if (variation < 70) {
              tile.biome = BiomeType.JUNGLE;
            } else if (variation < 85) {
              tile.biome = BiomeType.WETLANDS;
            } else if (variation < 95) {
              tile.biome = BiomeType.RIVER;
            } else {
              tile.biome = BiomeType.GRASSLAND;
            }
            break;
            
          case 'ocean':
            if (variation < 85) {
              tile.biome = BiomeType.SHALLOW_OCEAN;
            } else {
              tile.biome = BiomeType.BEACH;
            }
            break;
            
          default:
            tile.biome = BiomeType.GRASSLAND;
        }
        
        tile.isBlocking = false;
      }
    }
  }
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
  
  // Add decorative side paths (1 tile wide) at quarter points
  const quarterLeft = Math.floor(size.width * 0.25);
  const quarterRight = Math.floor(size.width * 0.75);
  
  // Left quarter path
  for (let y = size.height - Math.floor(borderSize / 2); y < size.height; y++) {
    if (quarterLeft < borderSize || quarterLeft >= size.width - borderSize) continue;
    tiles[y][quarterLeft].biome = BiomeType.PLAZA;
    tiles[y][quarterLeft].isBlocking = false;
  }
  
  // Right quarter path
  for (let y = size.height - Math.floor(borderSize / 2); y < size.height; y++) {
    if (quarterRight < borderSize || quarterRight >= size.width - borderSize) continue;
    tiles[y][quarterRight].biome = BiomeType.PLAZA;
    tiles[y][quarterRight].isBlocking = false;
  }
}

// Duplicate function removed - already defined at line 63

/**
 * Generate a great hall layout with central fire pits and long tables
 */
function generateGreatHall(
  tiles: Tile[][],
  buildingLeft: number,
  buildingTop: number,
  buildingWidth: number,
  buildingHeight: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const era = config.specificYear || 1000;
  const material = getMaterialForCulture(config.culturalZone);
  
  // Clear the interior first
  for (let y = buildingTop + 1; y < buildingTop + buildingHeight - 1; y++) {
    for (let x = buildingLeft + 1; x < buildingLeft + buildingWidth - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      tiles[y][x].isBlocking = false;
    }
  }
  
  // Add entrance at bottom center
  const entranceX = buildingLeft + Math.floor(buildingWidth / 2);
  tiles[buildingTop + buildingHeight - 1][entranceX].biome = BiomeType.DOOR;
  tiles[buildingTop + buildingHeight - 1][entranceX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [entranceX, buildingTop + buildingHeight - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  // Place fire pits/hearths down the center
  const centerX = buildingLeft + Math.floor(buildingWidth / 2);
  const numFirePits = Math.floor((buildingHeight - 6) / 8); // One fire pit every 8 tiles
  
  for (let i = 0; i < numFirePits; i++) {
    const fireY = buildingTop + 5 + (i * 8);
    if (config.culturalZone === 'EUROPEAN' && era < 1200) {
      // Viking/Medieval - use fireplace or hearth
      placeFireplace(tiles, centerX - 1, fireY, config.culturalZone || 'EUROPEAN', era, false);
    } else if (config.culturalZone === 'AMERICAS' || config.culturalZone === 'OCEANIA') {
      // Indigenous - use fire pit
      placeFirepit(tiles, centerX, fireY, material, 'flame');
    } else {
      // Others - use hearth
      placeFireplace(tiles, centerX - 1, fireY, config.culturalZone || 'EUROPEAN', era, false);
    }
  }
  
  // Use banquet tables for feast halls
  const tableOffset = 4; // Distance from walls
  
  // Left side banquet table
  if (buildingWidth >= 16 && buildingHeight >= 12) {
    placeBanquetTable(tiles, buildingLeft + tableOffset, buildingTop + 5,
                     config.culturalZone || 'EUROPEAN', material);
    
    // Add more banquet tables if space allows
    if (buildingHeight >= 20) {
      placeBanquetTable(tiles, buildingLeft + tableOffset, buildingTop + 12,
                       config.culturalZone || 'EUROPEAN', material);
    }
  }
  
  // Right side banquet table
  if (buildingWidth >= 16 && buildingHeight >= 12) {
    placeBanquetTable(tiles, buildingLeft + buildingWidth - tableOffset - 6, buildingTop + 5,
                     config.culturalZone || 'EUROPEAN', material);
    
    if (buildingHeight >= 20) {
      placeBanquetTable(tiles, buildingLeft + buildingWidth - tableOffset - 6, buildingTop + 12,
                       config.culturalZone || 'EUROPEAN', material);
    }
  }
  
  // Chief's throne at the head of the hall with dais platform
  const throneX = buildingLeft + Math.floor(buildingWidth / 2);
  const throneY = buildingTop + 2;
  placeThroneWithDais(tiles, throneX, throneY, config);
  
  // High table for chief - use smart table placement
  placeSmartTable(tiles, throneX - 3, throneY + 3, 7, 3, 'banquet',
                 config.culturalZone || 'EUROPEAN', material);
  
  // Add weapon racks along walls using overlay system
  if ((config.culturalZone === 'EUROPEAN' && era < 1500) || 
      config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    // Left wall weapon racks
    for (let y = buildingTop + 6; y < buildingTop + buildingHeight - 6; y += 6) {
      tiles[y][buildingLeft + 1].overlayObject = {
        type: OverlayObjectType.WEAPON_RACK,
        rotation: 90,
        variant: config.culturalZone
      };
      tiles[y][buildingLeft + 1].isBlocking = true;
    }
    
    // Right wall weapon racks
    for (let y = buildingTop + 6; y < buildingTop + buildingHeight - 6; y += 6) {
      tiles[y][buildingLeft + buildingWidth - 2].overlayObject = {
        type: OverlayObjectType.WEAPON_RACK,
        rotation: 270,
        variant: config.culturalZone
      };
      tiles[y][buildingLeft + buildingWidth - 2].isBlocking = true;
    }
  }
  
  // Add decorative elements for indigenous longhouses
  if (config.culturalZone === 'AMERICAS' || config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    // Add ceremonial items using overlay system
    tiles[throneY][throneX - 4].overlayObject = {
      type: OverlayObjectType.SHRINE,
      rotation: 0,
      variant: 'indigenous'
    };
    tiles[throneY][throneX - 4].isBlocking = true;
    
    tiles[throneY][throneX + 4].overlayObject = {
      type: OverlayObjectType.SHRINE,
      rotation: 0,
      variant: 'indigenous'
    };
    tiles[throneY][throneX + 4].isBlocking = true;
  }
  
  // Use procedural furnishing for the entire great hall
  procedurallyFurnishRoom(tiles, buildingLeft + 1, buildingTop + 1,
                         buildingWidth - 2, buildingHeight - 2,
                         'great_hall', config);
  
  // Create the hall as a single large room
  rooms.push({
    id: 'great_hall',
    name: config.culturalZone === 'EUROPEAN' ? 'Great Feast Hall' : 'Ceremonial Longhouse',
    bounds: {
      x: buildingLeft + 1,
      y: buildingTop + 1,
      width: buildingWidth - 2,
      height: buildingHeight - 2
    },
    roomType: 'great_hall',
    accessLevel: 'public'
  });
  
  // Add interaction zone for the throne
  interactionZones.push({
    id: 'throne',
    location: [throneX, throneY],
    label: 'The seat of power',
    type: 'throne'
  });
}