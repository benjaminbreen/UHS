/**
 * generation/specialMap/archetypes/universityGenerator.ts
 * Generator for university and academy special maps with comprehensive procedural system
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { CulturalZone } from '../../../types';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import { addCulturalLighting } from '../culturalFurnitureSystem';
import { addStorageFurniture } from '../../../components/symbols/architecture/specialMap/index';
import { addFurnitureToArea, addDecorativeElements } from '../../../generation/specialMap/specialMapGenerator';
import { 
  placeDeskWithChair, 
  placeBookshelfAgainstWall, 
  placeBenchWithOrientation,
  placeBedWithOrientation 
} from '../directionalFurniturePlacement';
import { 
  placeRoundTable, 
  placeBanquetTable,
  placeSmartTable 
} from '../advancedFurnitureSystem';
import { 
  lightRoom,
  placeChandelier,
  placeHangingLantern,
  placeWallSconce 
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  getCulturalStorage
} from '../storageUtilitySystem';

/**
 * University zone types for spatial analysis and procedural furnishing
 */
enum UniversityZoneType {
  LECTURE_HALL = 'LECTURE_HALL',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  STUDY_ROOMS = 'STUDY_ROOMS',
  ADMINISTRATION = 'ADMINISTRATION',
  FACULTY_OFFICES = 'FACULTY_OFFICES',
  COMMON_AREA = 'COMMON_AREA',
  CEREMONIAL_HALL = 'CEREMONIAL_HALL',
  ACCOMMODATION = 'ACCOMMODATION',
  ENTRANCE_FOYER = 'ENTRANCE_FOYER'
}

/**
 * Cultural university configuration interface
 */
interface UniversityConfig {
  name: string;
  institutionType: 'university' | 'academy' | 'madrasa' | 'monastery' | 'gurukula';
  layoutStyle: 'quadrangle' | 'courtyard' | 'linear' | 'circular' | 'pavilion';
  culturalElements: string[];
  lightingType: 'torches' | 'lanterns' | 'candles' | 'oil_lamps' | 'electric';
  hasAccommodation: boolean;
  primarySubjects: string[];
  decorativeTheme: string;
  floorMaterial: BiomeType;
  architecturalFeatures: string[];
}

/**
 * Get culturally appropriate university configuration based on zone and era
 */
function getCulturalUniversityConfig(culturalZone: CulturalZone, era: HistoricalEra): UniversityConfig {
  // European institutions
  if (culturalZone === 'EUROPEAN') {
    if (era === 'ANTIQUITY') {
      return {
        name: 'Classical Academy',
        institutionType: 'academy',
        layoutStyle: 'courtyard',
        culturalElements: ['columns', 'statues', 'peristyle', 'exedra'],
        lightingType: 'oil_lamps',
        hasAccommodation: false,
        primarySubjects: ['philosophy', 'rhetoric', 'mathematics', 'astronomy'],
        decorativeTheme: 'classical',
        floorMaterial: BiomeType.FLOOR_MARBLE,
        architecturalFeatures: ['marble_columns', 'mosaic_floors', 'stoa_walkways']
      };
    } else if (era === 'MEDIEVAL') {
      return {
        name: 'Medieval University',
        institutionType: 'university',
        layoutStyle: 'quadrangle',
        culturalElements: ['cloister', 'chapter_house', 'scriptorium', 'bell_tower'],
        lightingType: 'candles',
        hasAccommodation: true,
        primarySubjects: ['theology', 'canon_law', 'medicine', 'liberal_arts'],
        decorativeTheme: 'gothic',
        floorMaterial: BiomeType.FLOOR_STONE,
        architecturalFeatures: ['stone_arches', 'pointed_windows', 'ribbed_vaulting']
      };
    } else if (era === 'RENAISSANCE_EARLY_MODERN') {
      return {
        name: 'Renaissance Academy',
        institutionType: 'academy',
        layoutStyle: 'courtyard',
        culturalElements: ['rotunda', 'galleries', 'anatomical_theater', 'observatory'],
        lightingType: 'candles',
        hasAccommodation: false,
        primarySubjects: ['natural_philosophy', 'anatomy', 'arts', 'mathematics'],
        decorativeTheme: 'renaissance',
        floorMaterial: BiomeType.FLOOR_MARBLE,
        architecturalFeatures: ['classical_revival', 'symmetrical_design', 'dome_structures']
      };
    } else {
      return {
        name: 'Modern University',
        institutionType: 'university',
        layoutStyle: 'linear',
        culturalElements: ['lecture_theaters', 'laboratories', 'libraries', 'student_union'],
        lightingType: 'electric',
        hasAccommodation: true,
        primarySubjects: ['sciences', 'humanities', 'technology', 'social_sciences'],
        decorativeTheme: 'modern',
        floorMaterial: BiomeType.FLOOR_TILE,
        architecturalFeatures: ['brick_construction', 'large_windows', 'functional_design']
      };
    }
  }
  
  // Middle Eastern/North African institutions
  if (culturalZone === 'MENA') {
    return {
      name: 'Madrasa',
      institutionType: 'madrasa',
      layoutStyle: 'courtyard',
      culturalElements: ['iwans', 'mihrab', 'fountain', 'geometric_patterns'],
      lightingType: 'oil_lamps',
      hasAccommodation: true,
      primarySubjects: ['islamic_jurisprudence', 'theology', 'arabic', 'mathematics'],
      decorativeTheme: 'islamic',
      floorMaterial: BiomeType.FLOOR_TILE,
      architecturalFeatures: ['pointed_arches', 'muqarnas', 'geometric_decoration', 'calligraphy']
    };
  }
  
  // East Asian institutions
  if (culturalZone === 'EAST_ASIAN') {
    if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
      return {
        name: 'Confucian Academy',
        institutionType: 'academy',
        layoutStyle: 'courtyard',
        culturalElements: ['ancestral_hall', 'examination_halls', 'scholars_garden', 'pagoda'],
        lightingType: 'lanterns',
        hasAccommodation: true,
        primarySubjects: ['classics', 'poetry', 'calligraphy', 'administration'],
        decorativeTheme: 'confucian',
        floorMaterial: BiomeType.FLOOR_STONE,
        architecturalFeatures: ['upturned_roofs', 'wooden_columns', 'courtyard_gardens']
      };
    } else {
      return {
        name: 'Buddhist Monastery',
        institutionType: 'monastery',
        layoutStyle: 'pavilion',
        culturalElements: ['temples', 'meditation_halls', 'pagodas', 'lotus_ponds'],
        lightingType: 'lanterns',
        hasAccommodation: true,
        primarySubjects: ['buddhist_philosophy', 'meditation', 'sutras', 'medicine'],
        decorativeTheme: 'buddhist',
        floorMaterial: BiomeType.FLOOR_WOOD,
        architecturalFeatures: ['wooden_construction', 'curved_roofs', 'zen_gardens']
      };
    }
  }
  
  // South Asian institutions
  if (culturalZone === 'SOUTH_ASIAN') {
    return {
      name: 'Gurukula',
      institutionType: 'gurukula',
      layoutStyle: 'pavilion',
      culturalElements: ['sacred_tree', 'ashram', 'fire_altar', 'hermitages'],
      lightingType: 'oil_lamps',
      hasAccommodation: true,
      primarySubjects: ['vedas', 'sanskrit', 'philosophy', 'astronomy'],
      decorativeTheme: 'vedic',
      floorMaterial: BiomeType.SAVANNA,
      architecturalFeatures: ['natural_setting', 'simple_construction', 'open_spaces']
    };
  }
  
  // Pre-Columbian American institutions
  if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || culturalZone === 'SOUTH_AMERICAN') {
    return {
      name: 'Temple School',
      institutionType: 'academy',
      layoutStyle: 'courtyard',
      culturalElements: ['pyramids', 'ceremonial_plazas', 'observatories', 'codex_halls'],
      lightingType: 'torches',
      hasAccommodation: false,
      primarySubjects: ['astronomy', 'calendar', 'hieroglyphs', 'ritual'],
      decorativeTheme: 'ceremonial',
      floorMaterial: BiomeType.FLOOR_STONE,
      architecturalFeatures: ['stone_construction', 'stepped_pyramids', 'carved_reliefs']
    };
  }
  
  // Sub-Saharan African institutions
  if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return {
      name: 'Council of Elders',
      institutionType: 'academy',
      layoutStyle: 'circular',
      culturalElements: ['palaver_tree', 'storytelling_circle', 'ancestral_shrine', 'drums'],
      lightingType: 'torches',
      hasAccommodation: false,
      primarySubjects: ['oral_tradition', 'law', 'medicine', 'crafts'],
      decorativeTheme: 'tribal',
      floorMaterial: BiomeType.FLOOR_STONE,
      architecturalFeatures: ['natural_materials', 'circular_design', 'open_structures']
    };
  }
  
  // Oceanian institutions
  if (culturalZone === 'OCEANIA') {
    return {
      name: 'Navigation School',
      institutionType: 'academy',
      layoutStyle: 'pavilion',
      culturalElements: ['star_maps', 'canoe_workshops', 'sacred_grove', 'navigation_stones'],
      lightingType: 'torches',
      hasAccommodation: false,
      primarySubjects: ['navigation', 'astronomy', 'boat_building', 'ocean_lore'],
      decorativeTheme: 'maritime',
      floorMaterial: BiomeType.FLOOR_WOOD,
      architecturalFeatures: ['bamboo_construction', 'thatched_roofs', 'raised_platforms']
    };
  }
  
  // Colonial American (fallback)
  return {
    name: 'Colonial College',
    institutionType: 'university',
    layoutStyle: 'quadrangle',
    culturalElements: ['colonial_architecture', 'chapel', 'commons', 'dormitories'],
    lightingType: 'candles',
    hasAccommodation: true,
    primarySubjects: ['theology', 'classical_languages', 'natural_philosophy', 'rhetoric'],
    decorativeTheme: 'colonial',
    floorMaterial: BiomeType.FLOOR_WOOD,
    architecturalFeatures: ['brick_construction', 'georgian_style', 'simple_decoration']
  };
}

/**
 * Define university zones based on cultural configuration and map size
 */
function defineUniversityZones(tiles: Tile[][], size: { width: number, height: number }, config: UniversityConfig): Map<UniversityZoneType, { x: number, y: number, width: number, height: number }[]> {
  const zones = new Map<UniversityZoneType, { x: number, y: number, width: number, height: number }[]>();
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Handle tiny maps differently
  if (size.width <= 12 || size.height <= 12) {
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: 2, y: 2, width: size.width - 4, height: Math.floor(size.height * 0.4) }]);
    zones.set(UniversityZoneType.LIBRARY, [{ x: 2, y: Math.floor(size.height * 0.6), width: size.width - 4, height: size.height - Math.floor(size.height * 0.6) - 2 }]);
    zones.set(UniversityZoneType.ENTRANCE_FOYER, [{ x: centerX - 1, y: size.height - 2, width: 2, height: 1 }]);
    return zones;
  }
  
  // Configure based on layout style
  if (config.layoutStyle === 'quadrangle') {
    // Medieval university style with central quadrangle
    const quadSize = Math.min(size.width - 20, size.height - 20);
    const quadX = Math.floor((size.width - quadSize) / 2);
    const quadY = Math.floor((size.height - quadSize) / 2);
    
    // Central courtyard
    zones.set(UniversityZoneType.COMMON_AREA, [{ x: quadX + 3, y: quadY + 3, width: quadSize - 6, height: quadSize - 6 }]);
    
    // Buildings around quadrangle
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: quadX - 8, y: quadY - 8, width: quadSize + 16, height: 8 }]); // North
    zones.set(UniversityZoneType.LIBRARY, [{ x: quadX - 8, y: quadY, width: 8, height: quadSize }]); // West
    zones.set(UniversityZoneType.ADMINISTRATION, [{ x: quadX + quadSize, y: quadY, width: 8, height: quadSize }]); // East
    if (config.hasAccommodation) {
      zones.set(UniversityZoneType.ACCOMMODATION, [{ x: quadX, y: quadY + quadSize, width: quadSize, height: 8 }]); // South
    }
    
  } else if (config.layoutStyle === 'courtyard') {
    // Islamic/Classical style with central courtyard
    const courtSize = Math.min(size.width - 16, size.height - 16);
    const courtX = Math.floor((size.width - courtSize) / 2);
    const courtY = Math.floor((size.height - courtSize) / 2);
    
    zones.set(UniversityZoneType.COMMON_AREA, [{ x: courtX, y: courtY, width: courtSize, height: courtSize }]);
    
    // Four halls around courtyard
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: courtX, y: courtY - 10, width: courtSize, height: 10 }]); // North
    zones.set(UniversityZoneType.LIBRARY, [{ x: courtX, y: courtY + courtSize, width: courtSize, height: 10 }]); // South
    zones.set(UniversityZoneType.STUDY_ROOMS, [{ x: courtX - 10, y: courtY, width: 10, height: courtSize }]); // West
    zones.set(UniversityZoneType.FACULTY_OFFICES, [{ x: courtX + courtSize, y: courtY, width: 10, height: courtSize }]); // East
    
  } else if (config.layoutStyle === 'linear') {
    // Modern university with linear arrangement
    const hallWidth = Math.floor(size.width * 0.8);
    const hallHeight = Math.floor(size.height * 0.15);
    
    zones.set(UniversityZoneType.ENTRANCE_FOYER, [{ x: Math.floor((size.width - hallWidth) / 2), y: size.height - 8, width: hallWidth, height: 6 }]);
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: 5, y: 5, width: Math.floor(size.width * 0.4), height: hallHeight }]);
    zones.set(UniversityZoneType.LABORATORY, [{ x: Math.floor(size.width * 0.55), y: 5, width: Math.floor(size.width * 0.4), height: hallHeight }]);
    zones.set(UniversityZoneType.LIBRARY, [{ x: 5, y: 5 + hallHeight + 5, width: size.width - 10, height: hallHeight }]);
    zones.set(UniversityZoneType.COMMON_AREA, [{ x: Math.floor(size.width * 0.2), y: centerY, width: Math.floor(size.width * 0.6), height: 8 }]);
    
  } else if (config.layoutStyle === 'circular') {
    // African/Indigenous circular arrangement
    const radius = Math.min(size.width, size.height) * 0.3;
    zones.set(UniversityZoneType.COMMON_AREA, [{ x: centerX - radius/2, y: centerY - radius/2, width: radius, height: radius }]);
    
    // Surrounding structures
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: centerX - 10, y: centerY - radius - 8, width: 20, height: 8 }]);
    zones.set(UniversityZoneType.STUDY_ROOMS, [{ x: centerX + radius, y: centerY - 4, width: 8, height: 8 }]);
    zones.set(UniversityZoneType.LIBRARY, [{ x: centerX - radius - 8, y: centerY - 4, width: 8, height: 8 }]);
    
  } else { // pavilion
    // Asian/Indigenous pavilion style
    const pavilionSize = 12;
    
    zones.set(UniversityZoneType.CEREMONIAL_HALL, [{ x: centerX - pavilionSize/2, y: 5, width: pavilionSize, height: pavilionSize }]);
    zones.set(UniversityZoneType.LECTURE_HALL, [{ x: 5, y: centerY - 6, width: pavilionSize, height: 12 }]);
    zones.set(UniversityZoneType.LIBRARY, [{ x: size.width - pavilionSize - 5, y: centerY - 6, width: pavilionSize, height: 12 }]);
    zones.set(UniversityZoneType.COMMON_AREA, [{ x: centerX - 8, y: size.height - 12, width: 16, height: 8 }]);
    
    if (config.hasAccommodation) {
      // Small hermitages/cells
      zones.set(UniversityZoneType.ACCOMMODATION, [
        { x: 2, y: size.height - 8, width: 6, height: 6 },
        { x: size.width - 8, y: size.height - 8, width: 6, height: 6 }
      ]);
    }
  }
  
  // Always add entrance
  if (!zones.has(UniversityZoneType.ENTRANCE_FOYER)) {
    zones.set(UniversityZoneType.ENTRANCE_FOYER, [{ x: centerX - 2, y: size.height - 2, width: 4, height: 1 }]);
  }
  
  return zones;
}

/**
 * Main procedural university furnishing orchestrator
 */
function procedurallyFurnishUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  universityConfig: UniversityConfig,
  zones: Map<UniversityZoneType, { x: number, y: number, width: number, height: number }[]>,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Furnish each zone type
  for (const [zoneType, areas] of zones.entries()) {
    for (const area of areas) {
      switch (zoneType) {
        case UniversityZoneType.LECTURE_HALL:
          furnishLectureHall(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.LIBRARY:
          furnishLibrary(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.LABORATORY:
          furnishLaboratory(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.STUDY_ROOMS:
          furnishStudyRooms(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.ADMINISTRATION:
          furnishAdministration(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.FACULTY_OFFICES:
          furnishFacultyOffices(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.COMMON_AREA:
          furnishCommonArea(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.CEREMONIAL_HALL:
          furnishCeremonialHall(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.ACCOMMODATION:
          furnishAccommodation(tiles, area, universityConfig, interactionZones);
          break;
        case UniversityZoneType.ENTRANCE_FOYER:
          furnishEntrance(tiles, area, universityConfig, exitZones);
          break;
      }
    }
  }
  
  // Add cultural decorations and lighting
  addCulturalUniversityDecorations(tiles, size, config, universityConfig);
  addUniversityLighting(tiles, size, universityConfig);
}

export function generateUniversityAcademy(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Create perimeter walls with main entrance at south
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Get cultural university configuration
  const universityConfig = getCulturalUniversityConfig(config.culturalZone, config.era);
  
  // Fill with culturally appropriate flooring
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, universityConfig.floorMaterial);
  
  // Define university zones based on cultural configuration
  const zones = defineUniversityZones(tiles, size, universityConfig);
  
  // Procedurally furnish the university
  procedurallyFurnishUniversity(tiles, size, config, universityConfig, zones, interactionZones, exitZones);
  
  return { tiles, interactionZones, exitZones };
}

/**
 * Furnish lecture hall with seating and teaching elements
 */
function furnishLectureHall(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  // Create walls for the hall
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Add podium/lectern
  const podiumX = area.x + Math.floor(area.width / 2);
  const podiumY = area.y + 2;
  tiles[podiumY][podiumX].overlayObject = { type: OverlayObjectType.PODIUM, rotation: 0 };
  
  // Add seating based on cultural style
  if (config.culturalElements.includes('cushions')) {
    // Traditional floor seating
    for (let y = area.y + 4; y < area.y + area.height - 2; y += 2) {
      for (let x = area.x + 2; x < area.x + area.width - 2; x += 2) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
        }
      }
    }
  } else {
    // Western-style seating
    for (let y = area.y + 4; y < area.y + area.height - 2; y += 2) {
      for (let x = area.x + 2; x < area.x + area.width - 2; x += 3) {
        if (tiles[y] && tiles[y][x]) {
          placeDeskWithChair(tiles, x, y, config.decorativeTheme as any, 'oak');
        }
      }
    }
  }
  
  interactionZones.push({
    id: 'lecture_hall',
    bounds: area,
    type: 'academic',
    interactions: ['lecture', 'study', 'debate', 'examination']
  });
}

/**
 * Furnish library with books and reading areas
 */
function furnishLibrary(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Bookshelves along walls
  for (let y = area.y + 2; y < area.y + area.height - 2; y += 2) {
    if (tiles[y] && tiles[y][area.x + 1]) {
      placeBookshelfAgainstWall(tiles, area.x + 1, y, config.decorativeTheme as any, 'oak');
    }
    if (tiles[y] && tiles[y][area.x + area.width - 2]) {
      placeBookshelfAgainstWall(tiles, area.x + area.width - 2, y, config.decorativeTheme as any, 'oak');
    }
  }
  
  // Reading tables in center
  if (area.width > 8 && area.height > 6) {
    const tableX = area.x + Math.floor(area.width / 2);
    const tableY = area.y + Math.floor(area.height / 2);
    
    // Multi-part table
    tiles[tableY][tableX - 1].overlayObject = { type: OverlayObjectType.TABLE_LEFT, material: 'oak' };
    tiles[tableY][tableX].overlayObject = { type: OverlayObjectType.TABLE_CENTER, material: 'oak' };
    tiles[tableY][tableX + 1].overlayObject = { type: OverlayObjectType.TABLE_RIGHT, material: 'oak' };
    
    // Chairs around table
    tiles[tableY - 1][tableX].overlayObject = { type: OverlayObjectType.CHAIR, rotation: 180 };
    tiles[tableY + 1][tableX].overlayObject = { type: OverlayObjectType.CHAIR, rotation: 0 };
    tiles[tableY][tableX - 2].overlayObject = { type: OverlayObjectType.CHAIR, rotation: 90 };
    tiles[tableY][tableX + 2].overlayObject = { type: OverlayObjectType.CHAIR, rotation: 270 };
  }
  
  interactionZones.push({
    id: 'library',
    bounds: area,
    type: 'academic',
    interactions: ['read', 'study', 'research', 'copy_manuscripts']
  });
}

/**
 * Furnish laboratory with equipment
 */
function furnishLaboratory(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Lab benches with equipment
  for (let y = area.y + 2; y < area.y + area.height - 2; y += 3) {
    for (let x = area.x + 2; x < area.x + area.width - 2; x += 3) {
      if (tiles[y] && tiles[y][x]) {
        placeDeskWithChair(tiles, x, y, config.decorativeTheme as any, 'formica');
      }
    }
  }
  
  // Storage cabinets
  if (area.width > 4) {
    tiles[area.y + 1][area.x + 1].overlayObject = { type: OverlayObjectType.FILING_CABINET, material: 'metal' };
    tiles[area.y + 1][area.x + area.width - 2].overlayObject = { type: OverlayObjectType.FILING_CABINET, material: 'metal' };
  }
  
  interactionZones.push({
    id: 'laboratory',
    bounds: area,
    type: 'academic',
    interactions: ['experiment', 'research', 'analyze', 'demonstrate']
  });
}

/**
 * Furnish study rooms
 */
function furnishStudyRooms(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Small study carrels
  const carrelSize = 3;
  for (let y = area.y + 1; y < area.y + area.height - carrelSize; y += carrelSize + 1) {
    for (let x = area.x + 1; x < area.x + area.width - carrelSize; x += carrelSize + 1) {
      // Carrel walls
      placeWallRectangle(tiles, x, y, carrelSize, carrelSize);
      fillArea(tiles, x + 1, y + 1, carrelSize - 2, carrelSize - 2, config.floorMaterial);
      
      // Desk and chair
      if (carrelSize > 2) {
        placeDeskWithChair(tiles, x + 1, y + 1, config.decorativeTheme as any, 'oak');
      }
    }
  }
  
  interactionZones.push({
    id: 'study_rooms',
    bounds: area,
    type: 'academic',
    interactions: ['study', 'concentrate', 'write', 'contemplate']
  });
}

/**
 * Furnish administration area
 */
function furnishAdministration(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Administrator's desk
  const deskX = area.x + Math.floor(area.width / 2);
  const deskY = area.y + 2;
  placeDeskWithChair(tiles, deskX, deskY, config.decorativeTheme as any, 'oak');
  
  // Filing cabinets for records
  for (let x = area.x + 1; x < area.x + area.width - 1; x += 2) {
    if (tiles[area.y + area.height - 2] && tiles[area.y + area.height - 2][x]) {
      tiles[area.y + area.height - 2][x].overlayObject = { type: OverlayObjectType.CABINET, material: 'oak' };
    }
  }
  
  interactionZones.push({
    id: 'administration',
    bounds: area,
    type: 'administrative',
    interactions: ['enroll', 'pay_fees', 'meet_chancellor', 'register']
  });
}

/**
 * Furnish faculty offices
 */
function furnishFacultyOffices(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Individual offices
  const officeHeight = Math.max(4, Math.floor(area.height / 3));
  for (let i = 0; i < 3; i++) {
    const officeY = area.y + i * officeHeight;
    if (officeY + officeHeight < area.y + area.height) {
      // Office walls
      for (let x = area.x + 1; x < area.x + area.width - 1; x++) {
        if (i > 0) tiles[officeY][x].biome = BiomeType.WALL;
      }
      
      // Faculty desk and chair
      placeDeskWithChair(tiles, area.x + 2, officeY + 2, config.decorativeTheme as any, 'oak');
      
      // Bookshelf
      if (area.width > 4) {
        placeBookshelfAgainstWall(tiles, area.x + area.width - 2, officeY + 1, config.decorativeTheme as any, 'oak');
      }
    }
  }
  
  interactionZones.push({
    id: 'faculty_offices',
    bounds: area,
    type: 'academic',
    interactions: ['meet_professor', 'academic_consultation', 'office_hours']
  });
}

/**
 * Furnish common area
 */
function furnishCommonArea(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  // Open space with appropriate ground type
  let groundType: BiomeType;
  if (config.culturalElements.includes('courtyard')) {
    groundType = BiomeType.PLAZA;
  } else if (config.culturalElements.includes('garden')) {
    groundType = BiomeType.PARK;
  } else if (config.institutionType === 'gurukula') {
    groundType = BiomeType.SAVANNA;
  } else {
    groundType = config.floorMaterial;
  }
  
  fillArea(tiles, area.x, area.y, area.width, area.height, groundType);
  
  // Add cultural features
  if (config.culturalElements.includes('fountain')) {
    const centerX = area.x + Math.floor(area.width / 2);
    const centerY = area.y + Math.floor(area.height / 2);
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
    
    // Water around fountain
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          tiles[centerY + dy][centerX + dx].biome = BiomeType.WATER;
        }
      }
    }
  }
  
  if (config.culturalElements.includes('sacred_tree')) {
    const treeX = area.x + Math.floor(area.width / 2);
    const treeY = area.y + Math.floor(area.height / 3);
    tiles[treeY][treeX].biome = BiomeType.FOREST;
  }
  
  // Add seating for gatherings
  if (config.culturalElements.includes('columns')) {
    // Classical columns
    for (let x = area.x + 3; x < area.x + area.width - 3; x += 6) {
      tiles[area.y + 2][x].biome = BiomeType.COLUMN;
      tiles[area.y + area.height - 3][x].biome = BiomeType.COLUMN;
    }
  }
  
  interactionZones.push({
    id: 'common_area',
    bounds: area,
    type: 'social',
    interactions: ['socialize', 'debate', 'relax', 'walk']
  });
}

/**
 * Furnish ceremonial hall
 */
function furnishCeremonialHall(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  const centerX = area.x + Math.floor(area.width / 2);
  const centerY = area.y + Math.floor(area.height / 2);
  
  // Cultural ceremonial elements
  if (config.institutionType === 'monastery') {
    // Buddha statue and altar
    tiles[area.y + 2][centerX].overlayObject = { type: OverlayObjectType.STATUE, variant: 'buddha' };
    tiles[area.y + 3][centerX].overlayObject = { type: OverlayObjectType.ALTAR };
  } else if (config.institutionType === 'academy') {
    // Scholar statue
    tiles[area.y + 2][centerX].overlayObject = { type: OverlayObjectType.STATUE, variant: 'scholar' };
  } else if (config.culturalElements.includes('mihrab')) {
    // Islamic prayer direction
    tiles[area.y + 1][centerX].overlayObject = { type: OverlayObjectType.MIHRAB };
  }
  
  // Seating arrangement
  if (config.culturalElements.includes('cushions')) {
    for (let y = area.y + 5; y < area.y + area.height - 2; y += 2) {
      for (let x = area.x + 2; x < area.x + area.width - 2; x += 2) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION };
      }
    }
  } else {
    for (let y = area.y + 5; y < area.y + area.height - 2; y += 2) {
      for (let x = area.x + 2; x < area.x + area.width - 2; x += 3) {
        placeBenchWithOrientation(tiles, x, y, area.width, area.height, config.decorativeTheme as any, 'oak');
      }
    }
  }
  
  interactionZones.push({
    id: 'ceremonial_hall',
    bounds: area,
    type: 'ceremonial',
    interactions: ['worship', 'ceremony', 'meditation', 'graduation']
  });
}

/**
 * Furnish accommodation
 */
function furnishAccommodation(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, interactionZones: InteractionZone[]) {
  placeWallRectangle(tiles, area.x, area.y, area.width, area.height);
  fillArea(tiles, area.x + 1, area.y + 1, area.width - 2, area.height - 2, config.floorMaterial);
  
  // Divide into individual rooms
  const roomWidth = Math.max(4, Math.floor(area.width / 3));
  for (let i = 0; i < 3; i++) {
    const roomX = area.x + i * roomWidth;
    if (roomX + roomWidth < area.x + area.width) {
      // Room divider
      if (i > 0) {
        for (let y = area.y + 1; y < area.y + area.height - 1; y++) {
          tiles[y][roomX].biome = BiomeType.WALL;
        }
      }
      
      // Bed
      placeBedWithOrientation(tiles, roomX + 1, area.y + 1, roomWidth, area.height, config.decorativeTheme as any, 'simple');
      
      // Desk for study
      if (roomWidth > 3) {
        placeDeskWithChair(tiles, roomX + 2, area.y + area.height - 3, config.decorativeTheme as any, 'simple');
      }
      
      // Storage
      if (roomWidth > 2) {
        tiles[area.y + 2][roomX + roomWidth - 2].overlayObject = { type: OverlayObjectType.CABINET, material: 'simple' };
      }
    }
  }
  
  interactionZones.push({
    id: 'accommodation',
    bounds: area,
    type: 'residential',
    interactions: ['sleep', 'study_privately', 'store_belongings']
  });
}

/**
 * Furnish entrance area
 */
function furnishEntrance(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: UniversityConfig, exitZones: ExitZone[]) {
  const centerX = area.x + Math.floor(area.width / 2);
  
  // Main entrance door
  if (tiles[area.y] && tiles[area.y][centerX]) {
    tiles[area.y][centerX].biome = BiomeType.DOOR;
  }
  
  // Welcome area
  if (area.width > 4 && area.height > 2) {
    fillArea(tiles, area.x, area.y + 1, area.width, area.height - 1, BiomeType.PLAZA);
  }
  
  exitZones.push({
    id: 'main_entrance',
    location: [centerX, area.y],
    label: 'Exit to Street',
    destination: 'parent_map'
  });
}

/**
 * Add cultural decorations specific to university type
 */
function addCulturalUniversityDecorations(tiles: Tile[][], size: { width: number, height: number }, config: SpecialMapConfig, universityConfig: UniversityConfig) {
  if (universityConfig.culturalElements.includes('columns')) {
    // Add Classical columns in appropriate locations
    for (let x = 5; x < size.width - 5; x += 8) {
      if (tiles[3] && tiles[3][x] && tiles[3][x].biome === BiomeType.FLOOR_MARBLE) {
        tiles[3][x].biome = BiomeType.COLUMN;
      }
    }
  }
  
  if (universityConfig.culturalElements.includes('statues')) {
    // Add decorative statues of scholars
    if (size.width > 12 && size.height > 12) {
      tiles[5][5].overlayObject = { type: OverlayObjectType.STATUE, variant: 'scholar' };
      tiles[5][size.width - 6].overlayObject = { type: OverlayObjectType.STATUE, variant: 'philosopher' };
    }
  }
  
  if (universityConfig.culturalElements.includes('geometric_patterns')) {
    // Add Islamic geometric floor patterns
    for (let y = 1; y < size.height - 1; y++) {
      for (let x = 1; x < size.width - 1; x++) {
        if (tiles[y][x].biome === BiomeType.FLOOR_TILE) {
          tiles[y][x].materialSubtype = 'geometric';
        }
      }
    }
  }
  
  if (universityConfig.culturalElements.includes('cloister')) {
    // Add Medieval cloister walkways
    const centerX = Math.floor(size.width / 2);
    const centerY = Math.floor(size.height / 2);
    const cloisterSize = Math.min(size.width - 10, size.height - 10);
    
    // Covered walkway around central area
    for (let x = centerX - cloisterSize/2; x <= centerX + cloisterSize/2; x += 3) {
      tiles[centerY - cloisterSize/2 + 2][x].biome = BiomeType.COLUMN;
      tiles[centerY + cloisterSize/2 - 2][x].biome = BiomeType.COLUMN;
    }
  }
}

/**
 * Add appropriate lighting for the university
 */
function addUniversityLighting(tiles: Tile[][], size: { width: number, height: number }, config: UniversityConfig) {
  const lightingPositions = [];
  
  // Determine lighting positions based on university layout
  for (let x = 6; x < size.width - 6; x += 8) {
    for (let y = 6; y < size.height - 6; y += 8) {
      if (tiles[y] && tiles[y][x]) {
        const tileType = tiles[y][x].biome;
        if (tileType === BiomeType.FLOOR_STONE || tileType === BiomeType.FLOOR_WOOD || 
            tileType === BiomeType.FLOOR_MARBLE || tileType === BiomeType.FLOOR_TILE) {
          lightingPositions.push({ x, y });
        }
      }
    }
  }
  
  // Add lighting based on cultural style
  let lightType: OverlayObjectType;
  let variant: string | undefined;
  
  switch (config.lightingType) {
    case 'torches':
      lightType = OverlayObjectType.TORCH;
      variant = 'wall_torch';
      break;
    case 'lanterns':
      lightType = OverlayObjectType.TORCH;
      variant = 'lantern';
      break;
    case 'candles':
      lightType = OverlayObjectType.TORCH;
      variant = 'candle';
      break;
    case 'oil_lamps':
      lightType = OverlayObjectType.TORCH;
      variant = 'oil_lamp';
      break;
    case 'electric':
      lightType = OverlayObjectType.TORCH;
      variant = 'electric';
      break;
    default:
      lightType = OverlayObjectType.TORCH;
  }
  
  // Place lighting
  for (const pos of lightingPositions.slice(0, 12)) {
    tiles[pos.y][pos.x].overlayObject = {
      type: lightType,
      rotation: 0,
      variant
    };
  }
}

// ========================================
// LEGACY FUNCTION WRAPPERS FOR BACKWARD COMPATIBILITY
// ========================================

/**
 * Legacy wrapper for medieval university generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateMedievalUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  // Use new system with medieval configuration
  const medievalConfig = config;
  medievalConfig.era = HistoricalEra.MEDIEVAL;
  medievalConfig.culturalZone = 'EUROPEAN';
  
  const result = generateUniversityAcademy(tiles, medievalConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for madrasa generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateMadrasa(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const madrasaConfig = config;
  madrasaConfig.culturalZone = 'MENA';
  
  const result = generateUniversityAcademy(tiles, madrasaConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for Confucian academy generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateConfucianAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const confucianConfig = config;
  confucianConfig.culturalZone = 'EAST_ASIAN';
  confucianConfig.region = 'china';
  
  const result = generateUniversityAcademy(tiles, confucianConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for Renaissance academy generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateRenaissanceAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const renaissanceConfig = config;
  renaissanceConfig.era = HistoricalEra.RENAISSANCE_EARLY_MODERN;
  renaissanceConfig.culturalZone = 'EUROPEAN';
  
  const result = generateUniversityAcademy(tiles, renaissanceConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for Buddhist monastery generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateBuddhistMonastery(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const buddhistConfig = config;
  buddhistConfig.culturalZone = 'EAST_ASIAN';
  buddhistConfig.era = HistoricalEra.MEDIEVAL;
  
  const result = generateUniversityAcademy(tiles, buddhistConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for gurukula generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateGurukula(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const gurukulaConfig = config;
  gurukulaConfig.culturalZone = 'SOUTH_ASIAN';
  
  const result = generateUniversityAcademy(tiles, gurukulaConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for modern university generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateModernUniversity(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const modernConfig = config;
  modernConfig.era = HistoricalEra.MODERN_ERA;
  modernConfig.culturalZone = 'EUROPEAN';
  
  const result = generateUniversityAcademy(tiles, modernConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for classical academy generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateClassicalAcademy(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const classicalConfig = config;
  classicalConfig.era = HistoricalEra.ANTIQUITY;
  classicalConfig.culturalZone = 'EUROPEAN';
  
  const result = generateUniversityAcademy(tiles, classicalConfig, noise, size);
  interactionZones.push(...result.interactionZones);
}

/**
 * Legacy wrapper for library generation
 * @deprecated Use generateUniversityAcademy() with cultural configuration instead
 */
export function generateLibrary(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  noise: ValueNoise
) {
  const result = generateUniversityAcademy(tiles, config, noise, size);
  interactionZones.push(...result.interactionZones);
}
