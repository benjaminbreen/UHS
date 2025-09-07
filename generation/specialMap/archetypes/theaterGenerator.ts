/**
 * generation/specialMap/archetypes/theaterGenerator.ts
 * Generator for theater special maps with comprehensive procedural system
 */

import { Tile, BiomeType } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { CulturalZone, HistoricalEra } from '../../../types/ambiance';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import { addCulturalLighting } from '../culturalFurnitureSystem';
import { addStorageFurniture } from '../../../components/symbols/architecture/specialMap/index';
import { addFurnitureToArea, addDecorativeElements } from '../../../generation/specialMap/specialMapGenerator';

/**
 * Theater zone types for spatial analysis and procedural furnishing
 */
enum TheaterZoneType {
  MAIN_STAGE = 'MAIN_STAGE',
  BACKSTAGE = 'BACKSTAGE',
  AUDIENCE_FLOOR = 'AUDIENCE_FLOOR',
  BALCONY_TIER1 = 'BALCONY_TIER1',
  BALCONY_TIER2 = 'BALCONY_TIER2',
  VIP_BOX = 'VIP_BOX',
  ORCHESTRA_PIT = 'ORCHESTRA_PIT',
  FOYER_LOBBY = 'FOYER_LOBBY',
  SERVICE_AREA = 'SERVICE_AREA',
  ENTRANCE_VESTIBULE = 'ENTRANCE_VESTIBULE'
}

/**
 * Cultural theater configuration interface
 */
interface TheaterConfig {
  name: string;
  stageType: 'thrust' | 'proscenium' | 'arena' | 'platform' | 'amphitheater';
  seatingStyle: 'benches' | 'chairs' | 'mats' | 'standing' | 'tiered_stone';
  culturalElements: string[];
  lightingType: 'torches' | 'lanterns' | 'candles' | 'oil_lamps' | 'electric';
  hasOrchestra: boolean;
  hasBalconies: boolean;
  decorativeTheme: string;
  floorMaterial: BiomeType;
  acousticFeatures: string[];
}

/**
 * Get culturally appropriate theater configuration based on zone and era
 */
function getCulturalTheaterConfig(culturalZone: CulturalZone, era: HistoricalEra): TheaterConfig {
  // European theaters
  if (culturalZone === 'EUROPEAN') {
    if (era === 'ANTIQUITY') {
      return {
        name: 'Roman Amphitheater',
        stageType: 'amphitheater',
        seatingStyle: 'tiered_stone',
        culturalElements: ['columns', 'statues', 'imperial_box'],
        lightingType: 'oil_lamps',
        hasOrchestra: true,
        hasBalconies: false,
        decorativeTheme: 'classical',
        floorMaterial: BiomeType.FLOOR_STONE,
        acousticFeatures: ['resonance_chambers', 'marble_backing']
      };
    } else if (era === 'MEDIEVAL') {
      return {
        name: 'Medieval Performance Hall',
        stageType: 'platform',
        seatingStyle: 'benches',
        culturalElements: ['tapestries', 'heraldic_banners', 'minstrel_gallery'],
        lightingType: 'torches',
        hasOrchestra: false,
        hasBalconies: true,
        decorativeTheme: 'gothic',
        floorMaterial: BiomeType.FLOOR_STONE,
        acousticFeatures: ['vaulted_ceiling', 'stone_walls']
      };
    } else if (era === 'RENAISSANCE_EARLY_MODERN') {
      return {
        name: 'Elizabethan Playhouse',
        stageType: 'thrust',
        seatingStyle: 'benches',
        culturalElements: ['galleries', 'painted_ceiling', 'stage_pillars'],
        lightingType: 'candles',
        hasOrchestra: false,
        hasBalconies: true,
        decorativeTheme: 'renaissance',
        floorMaterial: BiomeType.FLOOR_WOOD,
        acousticFeatures: ['timber_frame', 'open_roof']
      };
    } else {
      return {
        name: 'Opera House',
        stageType: 'proscenium',
        seatingStyle: 'chairs',
        culturalElements: ['crystal_chandeliers', 'gilded_boxes', 'velvet_curtains'],
        lightingType: 'electric',
        hasOrchestra: true,
        hasBalconies: true,
        decorativeTheme: 'baroque',
        floorMaterial: BiomeType.FLOOR_WOOD,
        acousticFeatures: ['horseshoe_design', 'sound_reflectors']
      };
    }
  }
  
  // East Asian theaters
  if (culturalZone === 'EAST_ASIAN') {
    if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
      return {
        name: 'Noh Theater',
        stageType: 'platform',
        seatingStyle: 'mats',
        culturalElements: ['pine_backdrop', 'hashigakari', 'sacred_pillars'],
        lightingType: 'lanterns',
        hasOrchestra: false,
        hasBalconies: false,
        decorativeTheme: 'minimalist',
        floorMaterial: BiomeType.FLOOR_WOOD,
        acousticFeatures: ['resonance_jars', 'pine_acoustics']
      };
    } else {
      return {
        name: 'Kabuki Theater',
        stageType: 'platform',
        seatingStyle: era === 'MODERN_ERA' ? 'chairs' : 'mats',
        culturalElements: ['hanamichi', 'revolving_stage', 'painted_screens'],
        lightingType: era === 'MODERN_ERA' ? 'electric' : 'lanterns',
        hasOrchestra: false,
        hasBalconies: true,
        decorativeTheme: 'theatrical',
        floorMaterial: BiomeType.FLOOR_WOOD,
        acousticFeatures: ['wooden_clappers', 'resonance_boards']
      };
    }
  }
  
  // Middle Eastern/North African theaters
  if (culturalZone === 'MENA') {
    return {
      name: 'Court Performance Space',
      stageType: 'arena',
      seatingStyle: 'mats',
      culturalElements: ['geometric_patterns', 'arabesque_decoration', 'fountain'],
      lightingType: 'oil_lamps',
      hasOrchestra: false,
      hasBalconies: false,
      decorativeTheme: 'islamic',
      floorMaterial: BiomeType.FLOOR_STONE,
      acousticFeatures: ['courtyard_acoustics', 'tile_reflection']
    };
  }
  
  // South Asian theaters
  if (culturalZone === 'SOUTH_ASIAN') {
    return {
      name: 'Kathakali Performance Hall',
      stageType: 'platform',
      seatingStyle: era === 'MODERN_ERA' ? 'chairs' : 'mats',
      culturalElements: ['carved_pillars', 'oil_lamps', 'deity_statues'],
      lightingType: 'oil_lamps',
      hasOrchestra: false,
      hasBalconies: false,
      decorativeTheme: 'temple_style',
      floorMaterial: BiomeType.FLOOR_STONE,
      acousticFeatures: ['stone_columns', 'temple_acoustics']
    };
  }
  
  // Pre-Columbian American theaters
  if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || culturalZone === 'SOUTH_AMERICAN') {
    return {
      name: 'Ceremonial Amphitheater',
      stageType: 'amphitheater',
      seatingStyle: 'tiered_stone',
      culturalElements: ['stone_carvings', 'feathered_banners', 'ritual_altars'],
      lightingType: 'torches',
      hasOrchestra: false,
      hasBalconies: false,
      decorativeTheme: 'ceremonial',
      floorMaterial: BiomeType.FLOOR_STONE,
      acousticFeatures: ['stepped_design', 'natural_acoustics']
    };
  }
  
  // Sub-Saharan African theaters
  if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return {
      name: 'Community Performance Circle',
      stageType: 'arena',
      seatingStyle: 'mats',
      culturalElements: ['carved_masks', 'drums', 'fabric_hangings'],
      lightingType: 'torches',
      hasOrchestra: false,
      hasBalconies: false,
      decorativeTheme: 'tribal',
      floorMaterial: BiomeType.FLOOR_STONE,
      acousticFeatures: ['circular_design', 'drum_resonance']
    };
  }
  
  // Oceanian theaters
  if (culturalZone === 'OCEANIA') {
    return {
      name: 'Sacred Performance Ground',
      stageType: 'platform',
      seatingStyle: 'mats',
      culturalElements: ['carved_totems', 'woven_screens', 'shell_decorations'],
      lightingType: 'torches',
      hasOrchestra: false,
      hasBalconies: false,
      decorativeTheme: 'natural',
      floorMaterial: BiomeType.FLOOR_WOOD,
      acousticFeatures: ['bamboo_resonance', 'natural_amphitheater']
    };
  }
  
  // Colonial American (fallback)
  return {
    name: 'Colonial Playhouse',
    stageType: 'platform',
    seatingStyle: 'benches',
    culturalElements: ['simple_decoration', 'wooden_galleries'],
    lightingType: 'candles',
    hasOrchestra: false,
    hasBalconies: true,
    decorativeTheme: 'colonial',
    floorMaterial: BiomeType.FLOOR_WOOD,
    acousticFeatures: ['wooden_construction', 'simple_acoustics']
  };
}

/**
 * Define theater zones based on cultural configuration and map size
 */
function defineTheaterZones(tiles: Tile[][], size: { width: number, height: number }, config: TheaterConfig): Map<TheaterZoneType, { x: number, y: number, width: number, height: number }[]> {
  const zones = new Map<TheaterZoneType, { x: number, y: number, width: number, height: number }[]>();
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Handle tiny maps differently
  if (size.width <= 10 || size.height <= 10) {
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: 2, y: 1, width: size.width - 4, height: 2 }]);
    zones.set(TheaterZoneType.AUDIENCE_FLOOR, [{ x: 1, y: 4, width: size.width - 2, height: size.height - 6 }]);
    zones.set(TheaterZoneType.ENTRANCE_VESTIBULE, [{ x: centerX - 1, y: size.height - 2, width: 2, height: 1 }]);
    return zones;
  }
  
  // Configure based on stage type
  if (config.stageType === 'amphitheater') {
    // Amphitheater: semicircular seating around central stage
    const stageRadius = Math.min(8, Math.floor(size.width * 0.2));
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: centerX - stageRadius, y: centerY - stageRadius/2, width: stageRadius * 2, height: stageRadius }]);
    
    // Tiered seating in semicircle
    for (let tier = 1; tier <= 3; tier++) {
      const tierType = tier === 1 ? TheaterZoneType.AUDIENCE_FLOOR : tier === 2 ? TheaterZoneType.BALCONY_TIER1 : TheaterZoneType.BALCONY_TIER2;
      const radius = stageRadius + tier * 6;
      zones.set(tierType, [{ x: centerX - radius, y: centerY, width: radius * 2, height: radius }]);
    }
  } else if (config.stageType === 'thrust') {
    // Thrust stage: stage extends into audience
    const stageWidth = Math.floor(size.width * 0.4);
    const stageDepth = Math.floor(size.height * 0.3);
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: centerX - stageWidth/2, y: 2, width: stageWidth, height: stageDepth }]);
    zones.set(TheaterZoneType.BACKSTAGE, [{ x: centerX - stageWidth/2, y: 1, width: stageWidth, height: 1 }]);
    
    // Audience wraps around three sides
    zones.set(TheaterZoneType.AUDIENCE_FLOOR, [
      { x: 2, y: stageDepth + 4, width: centerX - stageWidth/2 - 3, height: size.height - stageDepth - 8 },
      { x: centerX + stageWidth/2 + 1, y: stageDepth + 4, width: size.width - centerX - stageWidth/2 - 3, height: size.height - stageDepth - 8 }
    ]);
    
    if (config.hasBalconies) {
      zones.set(TheaterZoneType.BALCONY_TIER1, [
        { x: 1, y: stageDepth + 2, width: 3, height: size.height - stageDepth - 6 },
        { x: size.width - 4, y: stageDepth + 2, width: 3, height: size.height - stageDepth - 6 }
      ]);
    }
  } else if (config.stageType === 'proscenium') {
    // Proscenium: traditional theater with stage at front
    const stageWidth = Math.floor(size.width * 0.6);
    const stageDepth = Math.floor(size.height * 0.2);
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: centerX - stageWidth/2, y: 2, width: stageWidth, height: stageDepth }]);
    zones.set(TheaterZoneType.BACKSTAGE, [{ x: centerX - stageWidth/2, y: 1, width: stageWidth, height: 1 }]);
    
    if (config.hasOrchestra) {
      zones.set(TheaterZoneType.ORCHESTRA_PIT, [{ x: centerX - stageWidth/2, y: stageDepth + 2, width: stageWidth, height: 2 }]);
    }
    
    // Audience in rows
    const audienceStartY = config.hasOrchestra ? stageDepth + 5 : stageDepth + 3;
    zones.set(TheaterZoneType.AUDIENCE_FLOOR, [{ x: Math.floor(size.width * 0.15), y: audienceStartY, width: Math.floor(size.width * 0.7), height: size.height - audienceStartY - 4 }]);
    
    if (config.hasBalconies) {
      zones.set(TheaterZoneType.VIP_BOX, [
        { x: 2, y: audienceStartY, width: 4, height: 6 },
        { x: size.width - 6, y: audienceStartY, width: 4, height: 6 }
      ]);
    }
  } else if (config.stageType === 'arena') {
    // Arena style: central performance area with audience around
    const stageRadius = Math.min(6, Math.floor(Math.min(size.width, size.height) * 0.25));
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: centerX - stageRadius, y: centerY - stageRadius, width: stageRadius * 2, height: stageRadius * 2 }]);
    zones.set(TheaterZoneType.AUDIENCE_FLOOR, [{ x: 3, y: 3, width: size.width - 6, height: size.height - 6 }]);
  } else { // platform
    // Platform stage: simple raised platform
    const stageWidth = Math.floor(size.width * 0.5);
    const stageDepth = Math.floor(size.height * 0.25);
    zones.set(TheaterZoneType.MAIN_STAGE, [{ x: centerX - stageWidth/2, y: 2, width: stageWidth, height: stageDepth }]);
    zones.set(TheaterZoneType.AUDIENCE_FLOOR, [{ x: 3, y: stageDepth + 4, width: size.width - 6, height: size.height - stageDepth - 8 }]);
  }
  
  // Common zones
  zones.set(TheaterZoneType.ENTRANCE_VESTIBULE, [{ x: centerX - 2, y: size.height - 2, width: 4, height: 1 }]);
  zones.set(TheaterZoneType.SERVICE_AREA, [{ x: 1, y: size.height - 4, width: 3, height: 2 }]);
  
  return zones;
}

/**
 * Main procedural theater furnishing orchestrator
 */
function procedurallyFurnishTheater(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  theaterConfig: TheaterConfig,
  zones: Map<TheaterZoneType, { x: number, y: number, width: number, height: number }[]>,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Furnish each zone type
  for (const [zoneType, areas] of zones.entries()) {
    for (const area of areas) {
      switch (zoneType) {
        case TheaterZoneType.MAIN_STAGE:
          furnishMainStage(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.BACKSTAGE:
          furnishBackstage(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.AUDIENCE_FLOOR:
          furnishAudienceArea(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.BALCONY_TIER1:
        case TheaterZoneType.BALCONY_TIER2:
          furnishBalcony(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.VIP_BOX:
          furnishVipBox(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.ORCHESTRA_PIT:
          furnishOrchestraPit(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.FOYER_LOBBY:
          furnishFoyer(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.SERVICE_AREA:
          furnishServiceArea(tiles, area, theaterConfig, interactionZones);
          break;
        case TheaterZoneType.ENTRANCE_VESTIBULE:
          furnishEntrance(tiles, area, theaterConfig, exitZones);
          break;
      }
    }
  }
  
  // Add cultural decorations and lighting
  addCulturalTheaterDecorations(tiles, size, config, theaterConfig);
  addTheaterLighting(tiles, size, theaterConfig);
}

/**
 * Furnish main stage area with performance elements
 */
function furnishMainStage(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Fill stage area with stage biome
  for (let y = area.y; y < area.y + area.height; y++) {
    for (let x = area.x; x < area.x + area.width; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = BiomeType.STAGE;
        tiles[y][x].isBlocking = false;
      }
    }
  }
  
  // Add stage-specific elements based on cultural context
  if (config.culturalElements.includes('stage_pillars')) {
    // Add pillars for Elizabethan theaters
    if (area.width > 8) {
      tiles[area.y][area.x + 2].biome = BiomeType.COLUMN;
      tiles[area.y][area.x + area.width - 3].biome = BiomeType.COLUMN;
    }
  }
  
  if (config.culturalElements.includes('hanamichi')) {
    // Add hanamichi runway for Kabuki theaters - extends from stage into audience
    const runwayY = area.y + area.height;
    for (let i = 0; i < 6; i++) {
      if (tiles[runwayY + i] && tiles[runwayY + i][area.x + 1]) {
        tiles[runwayY + i][area.x + 1].biome = BiomeType.STAGE;
        tiles[runwayY + i][area.x + 2].biome = BiomeType.STAGE;
      }
    }
  }
  
  // Add interaction zone
  interactionZones.push({
    id: 'main_stage',
    bounds: area,
    type: 'stage',
    interactions: ['perform', 'recite', 'dance', 'sing']
  });
}

/**
 * Furnish backstage area with storage and preparation spaces
 */
function furnishBackstage(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Add dressing room elements
  for (let x = area.x; x < area.x + area.width; x += 3) {
    if (tiles[area.y] && tiles[area.y][x]) {
      tiles[area.y][x].biome = BiomeType.CABINET;
    }
  }
  
  // Add mirrors and costume storage
  if (area.width > 4) {
    tiles[area.y][area.x + 1].overlayObject = { type: OverlayObjectType.MIRROR, rotation: 0 };
    tiles[area.y][area.x + area.width - 2].overlayObject = { type: OverlayObjectType.MIRROR, rotation: 0 };
  }
  
  interactionZones.push({
    id: 'backstage',
    bounds: area,
    type: 'preparation',
    interactions: ['change_costume', 'apply_makeup', 'rehearse']
  });
}

/**
 * Furnish audience seating area
 */
function furnishAudienceArea(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Determine seating type based on cultural configuration
  let seatBiome: BiomeType;
  switch (config.seatingStyle) {
    case 'chairs': seatBiome = BiomeType.CHAIR; break;
    case 'benches': seatBiome = BiomeType.BENCH; break;
    case 'mats': seatBiome = config.floorMaterial; break;
    case 'tiered_stone': seatBiome = BiomeType.FLOOR_STONE; break;
    case 'standing': seatBiome = config.floorMaterial; break;
    default: seatBiome = BiomeType.CHAIR;
  }
  
  if (config.seatingStyle === 'standing') {
    // Groundlings area - just floor
    for (let y = area.y; y < area.y + area.height; y++) {
      for (let x = area.x; x < area.x + area.width; x++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        }
      }
    }
  } else if (config.seatingStyle === 'mats') {
    // Traditional floor seating - place mats occasionally
    for (let y = area.y; y < area.y + area.height; y += 2) {
      for (let x = area.x; x < area.x + area.width; x += 2) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x].overlayObject = { type: OverlayObjectType.MAT, rotation: 0 };
        }
      }
    }
  } else {
    // Placed seating - rows of chairs/benches
    for (let y = area.y; y < area.y + area.height; y += 2) {
      for (let x = area.x; x < area.x + area.width; x += 2) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x].biome = seatBiome;
          tiles[y][x].isBlocking = true;
        }
      }
    }
  }
  
  interactionZones.push({
    id: 'audience_seating',
    bounds: area,
    type: 'seating',
    interactions: ['watch', 'applaud', 'cheer', 'boo']
  });
}

/**
 * Furnish balcony area
 */
function furnishBalcony(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Add seating to balcony
  for (let y = area.y; y < area.y + area.height; y += 2) {
    for (let x = area.x; x < area.x + area.width; x += 2) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Add balcony railing (wall along front edge)
  for (let x = area.x; x < area.x + area.width; x++) {
    if (tiles[area.y - 1] && tiles[area.y - 1][x]) {
      tiles[area.y - 1][x].biome = BiomeType.WALL;
    }
  }
  
  interactionZones.push({
    id: 'balcony',
    bounds: area,
    type: 'elevated_seating',
    interactions: ['watch', 'lean_over', 'wave']
  });
}

/**
 * Furnish VIP box for wealthy patrons
 */
function furnishVipBox(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Luxury seating
  for (let y = area.y; y < area.y + area.height; y += 2) {
    for (let x = area.x; x < area.x + area.width; x += 2) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Add luxury furnishings
  if (area.width > 2 && area.height > 2) {
    tiles[area.y + 1][area.x + 1].biome = BiomeType.TABLE;
  }
  
  // VIP box walls for privacy
  for (let y = area.y; y < area.y + area.height; y++) {
    if (tiles[y] && tiles[y][area.x - 1]) tiles[y][area.x - 1].biome = BiomeType.WALL;
    if (tiles[y] && tiles[y][area.x + area.width]) tiles[y][area.x + area.width].biome = BiomeType.WALL;
  }
  
  interactionZones.push({
    id: 'vip_box',
    bounds: area,
    type: 'luxury_seating',
    interactions: ['watch', 'social_display', 'private_conversation']
  });
}

/**
 * Furnish orchestra pit
 */
function furnishOrchestraPit(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Lower level for orchestra
  for (let y = area.y; y < area.y + area.height; y++) {
    for (let x = area.x; x < area.x + area.width; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].isBlocking = false;
      }
    }
  }
  
  // Add music stands/instruments
  for (let x = area.x + 1; x < area.x + area.width; x += 3) {
    if (tiles[area.y + 1] && tiles[area.y + 1][x]) {
      tiles[area.y + 1][x].biome = BiomeType.DESK; // Music stands
    }
  }
  
  interactionZones.push({
    id: 'orchestra_pit',
    bounds: area,
    type: 'musical',
    interactions: ['play_music', 'conduct', 'tune_instrument']
  });
}

/**
 * Furnish foyer/lobby area
 */
function furnishFoyer(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Open social space
  for (let y = area.y; y < area.y + area.height; y++) {
    for (let x = area.x; x < area.x + area.width; x++) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].biome = config.floorMaterial;
      }
    }
  }
  
  // Add some seating for socializing
  if (area.width > 4 && area.height > 4) {
    tiles[area.y + 2][area.x + 2].biome = BiomeType.CHAIR;
    tiles[area.y + 2][area.x + area.width - 3].biome = BiomeType.CHAIR;
  }
  
  interactionZones.push({
    id: 'foyer',
    bounds: area,
    type: 'social',
    interactions: ['mingle', 'discuss_performance', 'buy_refreshments']
  });
}

/**
 * Furnish service area
 */
function furnishServiceArea(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, interactionZones: InteractionZone[]) {
  // Storage and utility space
  for (let x = area.x; x < area.x + area.width; x++) {
    for (let y = area.y; y < area.y + area.height; y++) {
      if (tiles[y] && tiles[y][x] && x % 2 === 0) {
        tiles[y][x].biome = BiomeType.CABINET;
      }
    }
  }
  
  interactionZones.push({
    id: 'service_area',
    bounds: area,
    type: 'utility',
    interactions: ['store_props', 'maintenance']
  });
}

/**
 * Furnish entrance area
 */
function furnishEntrance(tiles: Tile[][], area: { x: number, y: number, width: number, height: number }, config: TheaterConfig, exitZones: ExitZone[]) {
  // Main entrance door
  const centerX = area.x + Math.floor(area.width / 2);
  if (tiles[area.y] && tiles[area.y][centerX]) {
    tiles[area.y][centerX].biome = BiomeType.DOOR;
  }
  
  exitZones.push({
    id: 'main_entrance',
    location: [centerX, area.y],
    label: 'Exit to Street',
    destination: 'parent_map'
  });
}

/**
 * Add cultural decorations specific to theater type
 */
function addCulturalTheaterDecorations(tiles: Tile[][], size: { width: number, height: number }, config: SpecialMapConfig, theaterConfig: TheaterConfig) {
  if (theaterConfig.culturalElements.includes('columns')) {
    // Add Classical columns
    if (size.width > 12) {
      tiles[3][2].biome = BiomeType.COLUMN;
      tiles[3][size.width - 3].biome = BiomeType.COLUMN;
    }
  }
  
  if (theaterConfig.culturalElements.includes('statues')) {
    // Add decorative statues
    if (size.width > 10) {
      tiles[2][4].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
      tiles[2][size.width - 5].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
    }
  }
  
  if (theaterConfig.culturalElements.includes('carved_masks')) {
    // Add African masks on walls
    for (let y = 5; y < size.height - 5; y += 5) {
      if (tiles[y] && tiles[y][1]) {
        tiles[y][1].overlayObject = { type: OverlayObjectType.WALL_ART, rotation: 90, variant: 'mask' };
      }
    }
  }
  
  if (theaterConfig.culturalElements.includes('tapestries')) {
    // Add Medieval tapestries
    for (let x = 3; x < size.width - 3; x += 6) {
      if (tiles[1] && tiles[1][x]) {
        tiles[1][x].overlayObject = { type: OverlayObjectType.WALL_ART, rotation: 0, variant: 'tapestry' };
      }
    }
  }
}

/**
 * Add appropriate lighting for the theater
 */
function addTheaterLighting(tiles: Tile[][], size: { width: number, height: number }, config: TheaterConfig) {
  const lightingPositions = [];
  
  // Determine lighting positions based on theater layout
  for (let x = 4; x < size.width - 4; x += 6) {
    for (let y = 4; y < size.height - 4; y += 6) {
      if (tiles[y] && tiles[y][x] && tiles[y][x].biome === BiomeType.WALL) {
        lightingPositions.push({ x, y });
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
  for (const pos of lightingPositions.slice(0, 8)) {
    tiles[pos.y][pos.x].overlayObject = {
      type: lightType,
      rotation: 0,
      variant
    };
  }
}

export function generateTheater(
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
  
  // Get cultural theater configuration
  const theaterConfig = getCulturalTheaterConfig(config.culturalZone, config.era);
  
  // Fill with culturally appropriate flooring
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, theaterConfig.floorMaterial);
  
  // Define theater zones based on cultural configuration
  const zones = defineTheaterZones(tiles, size, theaterConfig);
  
  // Procedurally furnish the theater
  procedurallyFurnishTheater(tiles, size, config, theaterConfig, zones, interactionZones, exitZones);
  
  return { tiles, interactionZones, exitZones };
}

// ========================================
// LEGACY FUNCTION WRAPPERS FOR BACKWARD COMPATIBILITY
// ========================================

/**
 * Legacy wrapper for specific theater type generation
 * @deprecated Use generateTheater() with cultural configuration instead
 */
export function generateAmphitheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Use new system with amphitheater configuration
  const theaterConfig: TheaterConfig = {
    name: 'Roman Amphitheater',
    stageType: 'amphitheater',
    seatingStyle: 'tiered_stone',
    culturalElements: ['columns', 'statues'],
    lightingType: 'oil_lamps',
    hasOrchestra: true,
    hasBalconies: false,
    decorativeTheme: 'classical',
    floorMaterial: BiomeType.FLOOR_STONE,
    acousticFeatures: ['resonance_chambers']
  };
  
  const zones = defineTheaterZones(tiles, size, theaterConfig);
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  procedurallyFurnishTheater(tiles, size, config, theaterConfig, zones, interactionZones, exitZones);
}

/**
 * Legacy wrapper for proscenium theater generation
 * @deprecated Use generateTheater() with cultural configuration instead
 */
export function generateProsceniumTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Use new system with proscenium configuration
  const theaterConfig: TheaterConfig = {
    name: 'Proscenium Theater',
    stageType: 'proscenium',
    seatingStyle: 'chairs',
    culturalElements: ['velvet_curtains', 'gilded_boxes'],
    lightingType: 'electric',
    hasOrchestra: true,
    hasBalconies: true,
    decorativeTheme: 'baroque',
    floorMaterial: BiomeType.FLOOR_WOOD,
    acousticFeatures: ['horseshoe_design']
  };
  
  const zones = defineTheaterZones(tiles, size, theaterConfig);
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  procedurallyFurnishTheater(tiles, size, config, theaterConfig, zones, interactionZones, exitZones);
}

/**
 * Legacy wrapper for Kabuki theater generation
 * @deprecated Use generateTheater() with cultural configuration instead
 */
export function generateKabukiTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Use new system with Kabuki configuration
  const theaterConfig: TheaterConfig = {
    name: 'Kabuki Theater',
    stageType: 'platform',
    seatingStyle: config.era === 'MODERN_ERA' ? 'chairs' : 'mats',
    culturalElements: ['hanamichi', 'painted_screens'],
    lightingType: config.era === 'MODERN_ERA' ? 'electric' : 'lanterns',
    hasOrchestra: false,
    hasBalconies: true,
    decorativeTheme: 'theatrical',
    floorMaterial: BiomeType.FLOOR_WOOD,
    acousticFeatures: ['resonance_boards']
  };
  
  const zones = defineTheaterZones(tiles, size, theaterConfig);
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  procedurallyFurnishTheater(tiles, size, config, theaterConfig, zones, interactionZones, exitZones);
}

/**
 * Legacy wrapper for Globe theater generation
 * @deprecated Use generateTheater() with cultural configuration instead
 */
export function generateGlobeTheater(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Use new system with Elizabethan configuration
  const theaterConfig: TheaterConfig = {
    name: 'Globe Theater',
    stageType: 'thrust',
    seatingStyle: 'benches',
    culturalElements: ['galleries', 'stage_pillars'],
    lightingType: 'candles',
    hasOrchestra: false,
    hasBalconies: true,
    decorativeTheme: 'renaissance',
    floorMaterial: BiomeType.FLOOR_WOOD,
    acousticFeatures: ['timber_frame', 'open_roof']
  };
  
  const zones = defineTheaterZones(tiles, size, theaterConfig);
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  procedurallyFurnishTheater(tiles, size, config, theaterConfig, zones, interactionZones, exitZones);
}

/**
 * Legacy theater type determination
 * @deprecated Cultural configuration is now handled automatically
 */
export function getTheaterType(config: SpecialMapConfig): string {
  const theaterConfig = getCulturalTheaterConfig(config.culturalZone, config.era);
  return theaterConfig.stageType;
}