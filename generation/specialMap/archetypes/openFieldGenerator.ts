/**
 * generation/specialMap/archetypes/openFieldGenerator.ts
 * Generator for open field special maps (parade grounds, festival spaces, etc.)
 */

import { Tile, BiomeType } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import {
  lightRoom,
  placeChandelier,
  placeWallSconce,
  getCulturalLighting
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  placeSpiceStorage
} from '../storageUtilitySystem';
import {
  placeSmartTable,
  placeRoundTable,
  placeBanquetTable
} from '../advancedFurnitureSystem';
import {
  placeBenchWithOrientation,
  placeCulturalDecoration
} from '../directionalFurniturePlacement';

/**
 * Outdoor zone types for procedural placement
 */
enum OutdoorZoneType {
  PERFORMANCE = 'performance',     // Stages, speakers areas
  AUDIENCE = 'audience',           // Seating, viewing areas
  ACTIVITY = 'activity',           // Playing fields, dance floors
  VENDOR = 'vendor',               // Market stalls, food vendors
  CEREMONIAL = 'ceremonial',       // Altars, ritual spaces
  ENTRANCE = 'entrance',           // Gates, welcoming areas
  PERIPHERY = 'periphery',         // Edges, boundaries
  PATHWAY = 'pathway'              // Movement corridors
}

/**
 * Cultural outdoor activity types
 */
interface CulturalActivity {
  name: string;
  zones: OutdoorZoneType[];
  groundType: BiomeType;
  furniture: string[];
  decorations: string[];
  lighting: string;
  era?: [number, number]; // Optional era range
}

export function generateOpenField(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms?: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log('[OpenFieldGenerator] Generating field for:', {
    culturalZone: config.culturalZone,
    era: config.era,
    year: config.specificYear,
    size: size
  });
  
  // Determine cultural outdoor activity
  const activity = getCulturalOutdoorActivity(config);
  console.log('[OpenFieldGenerator] Selected activity:', activity);
  
  // Fill with appropriate ground cover
  fillArea(tiles, 0, 0, size.width, size.height, activity.groundType);
  
  // Define outdoor zones based on activity
  const zones = defineOutdoorZones(size, activity);
  
  // Generate the outdoor space procedurally
  procedurallyFurnishOutdoorSpace(tiles, zones, config, activity, size);
  
  // Add cultural decorations and atmosphere
  addCulturalOutdoorDecorations(tiles, zones, config, activity);
  
  // Create interaction zones
  createOutdoorInteractionZones(zones, activity, interactionZones);
  
  // Create room definition for the entire field
  rooms.push({
    id: 'outdoor_space',
    name: activity.name,
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'outdoor',
    accessLevel: 'public'
  });
  
  // Main interaction zone
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  interactionZones.push({
    id: 'main_field',
    bounds: { 
      x: centerX - 20, 
      y: centerY - 15,
      width: 40, 
      height: 30 
    },
    type: 'open_field',
    interactions: ['gather', 'celebrate', 'compete', 'speak']
  });
  
  // Exit zones (multiple for open fields)
  if (activity.name.includes('Parade') || activity.name.includes('Plaza')) {
    exitZones.push(
      { id: 'north_1', location: [Math.floor(size.width * 0.25), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'north_2', location: [Math.floor(size.width * 0.5), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'north_3', location: [Math.floor(size.width * 0.75), 0], 
        label: 'North Exit', destination: 'parent_map' },
      { id: 'south_1', location: [Math.floor(size.width * 0.25), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' },
      { id: 'south_2', location: [Math.floor(size.width * 0.5), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' },
      { id: 'south_3', location: [Math.floor(size.width * 0.75), size.height - 1], 
        label: 'South Exit', destination: 'parent_map' }
    );
  } else {
    // Open fields typically have no walls, so exits at edges
    exitZones.push(
      { id: 'north', location: [centerX, 0], label: 'North', destination: 'parent_map' },
      { id: 'south', location: [centerX, size.height - 1], label: 'South', destination: 'parent_map' },
      { id: 'east', location: [size.width - 1, centerY], label: 'East', destination: 'parent_map' },
      { id: 'west', location: [0, centerY], label: 'West', destination: 'parent_map' }
    );
  }
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Get culturally appropriate outdoor activity based on era and location
 */
function getCulturalOutdoorActivity(config: SpecialMapConfig): CulturalActivity {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.specificYear || 1400;
  const season = 'summer'; // Could be dynamic
  
  // Define comprehensive cultural activities by era and region
  const activities: Record<string, CulturalActivity[]> = {
    'EUROPEAN': [
      // Medieval & Renaissance
      { name: 'Tournament Field', zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.GRASS, furniture: ['pavilion', 'banner', 'throne'], decorations: ['heraldic_shields', 'flags'], 
        lighting: 'torches', era: [1000, 1600] },
      { name: 'May Festival Green', zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.ACTIVITY, OutdoorZoneType.VENDOR], 
        groundType: BiomeType.GRASS, furniture: ['maypole', 'stalls', 'benches'], decorations: ['flowers', 'ribbons'], 
        lighting: 'lanterns', era: [1200, 1700] },
      // Industrial & Modern
      { name: 'Military Parade Ground', zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.PLAZA, furniture: ['reviewing_stand', 'flagpoles'], decorations: ['flags', 'monuments'], 
        lighting: 'electric', era: [1800, 1950] },
      { name: "Speakers' Corner", zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.AUDIENCE], 
        groundType: BiomeType.PLAZA, furniture: ['podium', 'benches'], decorations: ['signs', 'banners'], 
        lighting: 'electric', era: [1850, 2000] },
      { name: 'Garden Party Lawn', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.ACTIVITY], 
        groundType: BiomeType.GRASS, furniture: ['pavilions', 'tables', 'chairs'], decorations: ['flowers', 'topiaries'], 
        lighting: 'lanterns', era: [1700, 1950] }
    ],
    'EAST_ASIAN': [
      { name: 'Temple Courtyard', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.PATHWAY, OutdoorZoneType.PERIPHERY], 
        groundType: BiomeType.FLOOR_STONE, furniture: ['altars', 'incense_burners', 'stone_lanterns'], decorations: ['gardens', 'sculptures'], 
        lighting: 'lanterns', era: [500, 1900] },
      { name: 'Tea Garden', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PERIPHERY], 
        groundType: BiomeType.GRASS, furniture: ['pavilions', 'tea_tables', 'benches'], decorations: ['cherry_blossoms', 'rocks'], 
        lighting: 'paper_lanterns', era: [1000, 1800] },
      { name: 'Mongolian Naadam', zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE, OutdoorZoneType.VENDOR], 
        groundType: BiomeType.GRASS, furniture: ['yurts', 'archery_targets'], decorations: ['flags', 'horses'], 
        lighting: 'fires', era: [1200, 1800] },
      { name: 'Imperial Garden', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.PATHWAY, OutdoorZoneType.PERIPHERY], 
        groundType: BiomeType.PLAZA, furniture: ['pavilions', 'bridges', 'thrones'], decorations: ['dragons', 'phoenixes'], 
        lighting: 'lanterns', era: [1400, 1900] }
    ],
    'MENA': [
      { name: 'Desert Oasis Gathering', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.SAND, furniture: ['tents', 'carpets', 'water_basins'], decorations: ['palm_trees', 'geometrics'], 
        lighting: 'braziers', era: [500, 1800] },
      { name: 'Palace Courtyard', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PERIPHERY], 
        groundType: BiomeType.FLOOR_TILE, furniture: ['fountains', 'pavilions', 'cushions'], decorations: ['mosaics', 'arches'], 
        lighting: 'hanging_lanterns', era: [800, 1600] },
      { name: 'Bedouin Camp', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.ACTIVITY], 
        groundType: BiomeType.SAND, furniture: ['tents', 'fire_pits', 'carpets'], decorations: ['camels', 'stars'], 
        lighting: 'fires', era: [500, 1900] }
    ],
    'NORTH_AMERICAN_PRE_COLUMBIAN': [
      { name: 'Ball Court', zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.FLOOR_STONE, furniture: ['stone_seats', 'altars'], decorations: ['carvings', 'feathers'], 
        lighting: 'torches', era: [500, 1500] },
      { name: 'Pow Wow Circle', zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.SAND, furniture: ['drums', 'totems', 'fire_pit'], decorations: ['feathers', 'beads'], 
        lighting: 'fires', era: [1000, 1800] },
      { name: 'Sacred Grove', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.PERIPHERY], 
        groundType: BiomeType.GRASS, furniture: ['altars', 'medicine_wheels'], decorations: ['trees', 'stones'], 
        lighting: 'natural', era: [500, 1900] }
    ],
    'NORTH_AMERICAN_COLONIAL': [
      { name: 'Town Common', zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.AUDIENCE, OutdoorZoneType.VENDOR], 
        groundType: BiomeType.GRASS, furniture: ['podium', 'benches'], decorations: ['flags', 'trees'], 
        lighting: 'lanterns', era: [1600, 1900] },
      { name: 'Military Drill Ground', zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE], 
        groundType: BiomeType.SAND, furniture: ['reviewing_stand'], decorations: ['flags', 'cannon'], 
        lighting: 'torches', era: [1700, 1850] }
    ],
    'SUB_SAHARAN_AFRICAN': [
      { name: 'Village Meeting Ground', zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.SAND, furniture: ['drums', 'stools', 'fire_pit'], decorations: ['masks', 'totems'], 
        lighting: 'fires', era: [500, 1800] },
      { name: 'Royal Court Yard', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.AUDIENCE, OutdoorZoneType.VENDOR], 
        groundType: BiomeType.PLAZA, furniture: ['thrones', 'pavilions', 'stools'], decorations: ['ivory', 'gold'], 
        lighting: 'torches', era: [1000, 1800] },
      { name: 'Market Square', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PATHWAY], 
        groundType: BiomeType.SAND, furniture: ['stalls', 'baskets', 'mats'], decorations: ['textiles', 'pottery'], 
        lighting: 'fires', era: [800, 1900] }
    ],
    'SOUTH_AMERICAN': [
      { name: 'Inca Ceremonial Plaza', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PERFORMANCE], 
        groundType: BiomeType.FLOOR_STONE, furniture: ['altars', 'throne'], decorations: ['gold', 'textiles'], 
        lighting: 'torches', era: [1200, 1600] },
      { name: 'Colonial Plaza', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.CEREMONIAL], 
        groundType: BiomeType.PLAZA, furniture: ['fountain', 'benches'], decorations: ['crosses', 'statues'], 
        lighting: 'lanterns', era: [1500, 1800] }
    ],
    'OCEANIA': [
      { name: 'Marae Courtyard', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PERFORMANCE], 
        groundType: BiomeType.GRASS, furniture: ['stone_platform', 'totems'], decorations: ['carvings', 'feathers'], 
        lighting: 'fires', era: [800, 1800] },
      { name: 'Beach Gathering', zones: [OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE, OutdoorZoneType.ACTIVITY], 
        groundType: BiomeType.SAND, furniture: ['mats', 'fire_pit'], decorations: ['shells', 'nets'], 
        lighting: 'fires', era: [500, 1900] }
    ],
    'SOUTH_ASIAN': [
      { name: 'Temple Festival Ground', zones: [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.VENDOR, OutdoorZoneType.AUDIENCE], 
        groundType: BiomeType.FLOOR_STONE, furniture: ['pavilions', 'altars', 'carpets'], decorations: ['elephants', 'flowers'], 
        lighting: 'oil_lamps', era: [500, 1800] },
      { name: 'Palace Durbar', zones: [OutdoorZoneType.CEREMONIAL, OutdoorZoneType.AUDIENCE, OutdoorZoneType.PERFORMANCE], 
        groundType: BiomeType.FLOOR_MARBLE, furniture: ['thrones', 'pavilions', 'cushions'], decorations: ['jewels', 'silks'], 
        lighting: 'chandeliers', era: [1400, 1800] }
    ]
  };
  
  // Find appropriate activity for culture and era
  const culturalActivities = activities[culturalZone] || activities['EUROPEAN'];
  
  for (const activity of culturalActivities) {
    if (activity.era && era >= activity.era[0] && era <= activity.era[1]) {
      return activity;
    }
  }
  
  // Default fallback
  return culturalActivities[0] || {
    name: 'Open Field',
    zones: [OutdoorZoneType.ACTIVITY, OutdoorZoneType.AUDIENCE],
    groundType: BiomeType.GRASS,
    furniture: ['benches'],
    decorations: ['flowers'],
    lighting: 'natural'
  };
}

/**
 * Define zones within outdoor space based on activity type
 */
function defineOutdoorZones(
  size: { width: number, height: number },
  activity: CulturalActivity
): { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> } {
  const zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> } = {};
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Initialize all zone types
  Object.values(OutdoorZoneType).forEach(zoneType => {
    zones[zoneType] = [];
  });
  
  // Define zones based on activity requirements
  activity.zones.forEach((zoneType, index) => {
    switch (zoneType) {
      case OutdoorZoneType.PERFORMANCE:
        // Stage/performance area - usually north or center
        zones[zoneType]!.push({
          x: centerX - 12,
          y: Math.floor(size.height * 0.1),
          width: 24,
          height: Math.floor(size.height * 0.2)
        });
        break;
        
      case OutdoorZoneType.AUDIENCE:
        // Seating areas - face performance area
        zones[zoneType]!.push(
          {
            x: Math.floor(size.width * 0.1),
            y: Math.floor(size.height * 0.4),
            width: Math.floor(size.width * 0.35),
            height: Math.floor(size.height * 0.5)
          },
          {
            x: Math.floor(size.width * 0.55),
            y: Math.floor(size.height * 0.4),
            width: Math.floor(size.width * 0.35),
            height: Math.floor(size.height * 0.5)
          }
        );
        break;
        
      case OutdoorZoneType.ACTIVITY:
        // Main activity area - center
        zones[zoneType]!.push({
          x: Math.floor(size.width * 0.25),
          y: Math.floor(size.height * 0.25),
          width: Math.floor(size.width * 0.5),
          height: Math.floor(size.height * 0.5)
        });
        break;
        
      case OutdoorZoneType.VENDOR:
        // Market stalls - periphery
        zones[zoneType]!.push(
          {
            x: 2,
            y: Math.floor(size.height * 0.3),
            width: Math.floor(size.width * 0.15),
            height: Math.floor(size.height * 0.4)
          },
          {
            x: size.width - Math.floor(size.width * 0.15) - 2,
            y: Math.floor(size.height * 0.3),
            width: Math.floor(size.width * 0.15),
            height: Math.floor(size.height * 0.4)
          }
        );
        break;
        
      case OutdoorZoneType.CEREMONIAL:
        // Altar/ceremonial area - usually elevated north
        zones[zoneType]!.push({
          x: centerX - 6,
          y: 2,
          width: 12,
          height: 8
        });
        break;
        
      case OutdoorZoneType.ENTRANCE:
        // Entrance areas - south
        zones[zoneType]!.push({
          x: centerX - 10,
          y: size.height - 8,
          width: 20,
          height: 6
        });
        break;
        
      case OutdoorZoneType.PATHWAY:
        // Connecting pathways
        zones[zoneType]!.push(
          {
            x: centerX - 2,
            y: 0,
            width: 4,
            height: size.height
          },
          {
            x: 0,
            y: centerY - 2,
            width: size.width,
            height: 4
          }
        );
        break;
        
      case OutdoorZoneType.PERIPHERY:
        // Edge decorations
        zones[zoneType]!.push(
          { x: 0, y: 0, width: size.width, height: 5 },
          { x: 0, y: size.height - 5, width: size.width, height: 5 },
          { x: 0, y: 5, width: 5, height: size.height - 10 },
          { x: size.width - 5, y: 5, width: 5, height: size.height - 10 }
        );
        break;
    }
  });
  
  return zones;
}

/**
 * Procedurally furnish outdoor space with era and culture appropriate elements
 */
function procedurallyFurnishOutdoorSpace(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity,
  size: { width: number, height: number }
): void {
  console.log('[OpenField] Starting monumental plaza creation:', activity.name);
  
  // Create ceremonial plaza with axial symmetry and monumental features
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // 1. Create main ceremonial axis (north-south)
  createCeremonialAxis(tiles, size, config, activity);
  
  // 2. Add monumental centerpiece
  createMonumentalCenterpiece(tiles, centerX, centerY, config, activity, size);
  
  // 3. Create processional approach
  createProcessionalApproach(tiles, size, config, activity);
  
  // 4. Add flanking monuments and pillars
  addFlankingMonuments(tiles, size, config, activity);
  
  // 5. Create gathering spaces and viewing areas
  createGatheringSpaces(tiles, zones, config, activity, size);
  
  // 6. Add cultural-specific ceremonial elements
  addCulturalCeremonialElements(tiles, size, config, activity);
  
  // 7. Add overlay pillars and multi-tile columns
  addOverlayPillarsAndColumns(tiles, size, config, activity);
  
  // 8. Create memorial and commemorative elements
  createMemorialElements(tiles, size, config, activity);
  
  // Legacy zone processing for any remaining specific zones
  Object.entries(zones).forEach(([zoneType, zoneAreas]) => {
    if (!zoneAreas || zoneAreas.length === 0) return;
    
    zoneAreas.forEach(zone => {
      switch (zoneType as OutdoorZoneType) {
        case OutdoorZoneType.VENDOR:
          furnishVendorZone(tiles, zone, config, activity);
          break;
      }
    });
  });
  
  // Ensure adequate outdoor lighting
  ensureAdequateOutdoorLighting(tiles, zones, config, activity, size);
}

/**
 * Furnish performance areas with stages, platforms, and focal points
 */
function furnishPerformanceZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = zone.x + Math.floor(zone.width / 2);
  const centerY = zone.y + Math.floor(zone.height / 2);
  
  // Main performance platform
  const platformSize = Math.min(zone.width, zone.height) * 0.6;
  for (let y = centerY - Math.floor(platformSize/2); y <= centerY + Math.floor(platformSize/2); y++) {
    for (let x = centerX - Math.floor(platformSize/2); x <= centerX + Math.floor(platformSize/2); x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        // Use era-appropriate stage material
        if (config.specificYear && config.specificYear < 1200) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        } else if (config.specificYear && config.specificYear < 1800) {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        } else {
          tiles[y][x].biome = BiomeType.STAGE;
        }
      }
    }
  }
  
  // Cultural performance elements
  if (activity.furniture.includes('throne')) {
    // Place throne at center for ceremonial performances
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 180,
      variant: config.culturalZone
    };
  } else if (activity.furniture.includes('drums')) {
    // Place drums for music performances
    tiles[centerY][centerX - 1].overlayObject = { type: OverlayObjectType.DRUM };
    tiles[centerY][centerX + 1].overlayObject = { type: OverlayObjectType.DRUM };
  }
}

/**
 * Furnish audience areas with seating arrangements
 */
function furnishAudienceZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Create tiered seating based on cultural context
  const rows = Math.floor(zone.height / 3);
  const seatsPerRow = Math.floor(zone.width / 2);
  
  for (let row = 0; row < rows; row++) {
    const y = zone.y + row * 3 + 1;
    for (let seat = 0; seat < seatsPerRow; seat++) {
      const x = zone.x + seat * 2 + 1;
      
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        // Era-appropriate seating
        if (activity.furniture.includes('cushions')) {
          tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION };
        } else if (activity.furniture.includes('benches')) {
          placeBenchWithOrientation(tiles, x, y, 'east', config.culturalZone || 'EUROPEAN');
        } else {
          tiles[y][x].biome = BiomeType.CHAIR;
        }
      }
    }
  }
}

/**
 * Furnish activity zones with playing fields, dance floors, etc.
 */
function furnishActivityZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Clear and flatten the activity area
  for (let y = zone.y; y < zone.y + zone.height; y++) {
    for (let x = zone.x; x < zone.x + zone.width; x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        // Activity-appropriate ground surface
        if (activity.name.includes('Ball Court')) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        } else if (activity.name.includes('Dance') || activity.name.includes('Festival')) {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        } else {
          tiles[y][x].biome = activity.groundType;
        }
      }
    }
  }
  
  // Add activity-specific elements
  if (activity.furniture.includes('archery_targets')) {
    // Place archery targets at edges
    const targetY = zone.y + Math.floor(zone.height / 2);
    tiles[targetY][zone.x + zone.width - 2].overlayObject = { type: OverlayObjectType.TARGET };
    tiles[targetY][zone.x + 1].overlayObject = { type: OverlayObjectType.TARGET };
  }
  
  if (activity.furniture.includes('fire_pit')) {
    // Central fire pit for gatherings
    const centerX = zone.x + Math.floor(zone.width / 2);
    const centerY = zone.y + Math.floor(zone.height / 2);
    tiles[centerY][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT };
  }
}

/**
 * Furnish vendor zones with market stalls and trading posts
 */
function furnishVendorZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Create market stall rows
  const stallWidth = 3;
  const stallDepth = 4;
  const stalls = Math.floor(zone.width / (stallWidth + 1));
  
  for (let stall = 0; stall < stalls; stall++) {
    const stallX = zone.x + stall * (stallWidth + 1);
    const stallY = zone.y;
    
    // Stall structure
    for (let y = stallY; y < stallY + stallDepth && y < zone.y + zone.height; y++) {
      for (let x = stallX; x < stallX + stallWidth; x++) {
        if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
          if (y === stallY || y === stallY + stallDepth - 1 || 
              x === stallX || x === stallX + stallWidth - 1) {
            tiles[y][x].biome = BiomeType.PAVILION; // Stall frame
          } else {
            tiles[y][x].overlayObject = { type: OverlayObjectType.TABLE }; // Display tables
          }
        }
      }
    }
    
    // Add cultural storage appropriate to era
    if (stallX + 1 >= 0 && stallX + 1 < tiles[0].length && 
        stallY + 1 >= 0 && stallY + 1 < tiles.length) {
      placeCulturalStorage(tiles, stallX + 1, stallY + 1, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
    }
  }
}

/**
 * Furnish ceremonial zones with altars and ritual spaces
 */
function furnishCeremonialZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = zone.x + Math.floor(zone.width / 2);
  const centerY = zone.y + Math.floor(zone.height / 2);
  
  // Central altar or sacred element
  if (activity.furniture.includes('altars')) {
    tiles[centerY][centerX].overlayObject = { 
      type: OverlayObjectType.ALTAR,
      rotation: 0,
      variant: config.culturalZone
    };
  } else if (activity.furniture.includes('fountains')) {
    // Sacred fountain for purification
    for (let y = centerY - 1; y <= centerY + 1; y++) {
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
          tiles[y][x].biome = BiomeType.FOUNTAIN;
        }
      }
    }
  }
  
  // Sacred boundary markers
  const boundary = [
    { x: zone.x, y: zone.y },
    { x: zone.x + zone.width - 1, y: zone.y },
    { x: zone.x, y: zone.y + zone.height - 1 },
    { x: zone.x + zone.width - 1, y: zone.y + zone.height - 1 }
  ];
  
  boundary.forEach(pos => {
    if (pos.x >= 0 && pos.x < tiles[0].length && pos.y >= 0 && pos.y < tiles.length) {
      tiles[pos.y][pos.x].biome = BiomeType.COLUMN; // Sacred pillars
    }
  });
}

/**
 * Furnish entrance zones with gates and welcoming areas
 */
function furnishEntranceZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = zone.x + Math.floor(zone.width / 2);
  
  // Create entrance pathway
  for (let x = zone.x; x < zone.x + zone.width; x++) {
    const pathY = zone.y + Math.floor(zone.height / 2);
    if (x >= 0 && x < tiles[0].length && pathY >= 0 && pathY < tiles.length) {
      tiles[pathY][x].biome = BiomeType.ROAD;
    }
  }
  
  // Gate posts or markers
  const gateY = zone.y + Math.floor(zone.height / 2);
  if (centerX - 3 >= 0 && centerX + 3 < tiles[0].length && gateY >= 0 && gateY < tiles.length) {
    tiles[gateY][centerX - 3].biome = BiomeType.COLUMN;
    tiles[gateY][centerX + 3].biome = BiomeType.COLUMN;
  }
  
  // Welcome area with seating
  for (let i = 0; i < 4; i++) {
    const seatX = zone.x + 2 + i * 2;
    const seatY = zone.y + 1;
    if (seatX >= 0 && seatX < tiles[0].length && seatY >= 0 && seatY < tiles.length) {
      tiles[seatY][seatX].biome = BiomeType.CHAIR;
    }
  }
}

/**
 * Furnish pathway zones with roads and movement corridors
 */
function furnishPathwayZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Create pathway based on zone dimensions
  for (let y = zone.y; y < zone.y + zone.height; y++) {
    for (let x = zone.x; x < zone.x + zone.width; x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        // Era-appropriate pathway material
        if (config.specificYear && config.specificYear < 1000) {
          tiles[y][x].biome = BiomeType.SAND; // Ancient paths
        } else if (config.specificYear && config.specificYear < 1700) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE; // Medieval stone
        } else {
          tiles[y][x].biome = BiomeType.ROAD; // Modern roads
        }
      }
    }
  }
  
  // Add pathway lighting at intervals
  const lightingInterval = 8;
  for (let x = zone.x; x < zone.x + zone.width; x += lightingInterval) {
    const lightY = zone.y + Math.floor(zone.height / 2);
    if (x >= 0 && x < tiles[0].length && lightY >= 0 && lightY < tiles.length) {
      getCulturalLighting(tiles, x, lightY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
    }
  }
}

/**
 * Furnish periphery zones with boundary decorations
 */
function furnishPeripheryZone(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Add boundary elements at intervals
  const elementInterval = 6;
  
  // Top and bottom edges
  for (let x = zone.x; x < zone.x + zone.width; x += elementInterval) {
    if (x >= 0 && x < tiles[0].length) {
      if (zone.y >= 0 && zone.y < tiles.length) {
        addPeripheryElement(tiles, x, zone.y, config, activity);
      }
      const bottomY = zone.y + zone.height - 1;
      if (bottomY >= 0 && bottomY < tiles.length) {
        addPeripheryElement(tiles, x, bottomY, config, activity);
      }
    }
  }
  
  // Left and right edges
  for (let y = zone.y; y < zone.y + zone.height; y += elementInterval) {
    if (y >= 0 && y < tiles.length) {
      if (zone.x >= 0 && zone.x < tiles[0].length) {
        addPeripheryElement(tiles, zone.x, y, config, activity);
      }
      const rightX = zone.x + zone.width - 1;
      if (rightX >= 0 && rightX < tiles[0].length) {
        addPeripheryElement(tiles, rightX, y, config, activity);
      }
    }
  }
}

/**
 * Add appropriate periphery elements based on culture and activity
 */
function addPeripheryElement(
  tiles: Tile[][],
  x: number,
  y: number,
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  if (activity.decorations.includes('flags')) {
    tiles[y][x].biome = BiomeType.COLUMN; // Flag poles
  } else if (activity.decorations.includes('trees') || activity.decorations.includes('palm_trees')) {
    tiles[y][x].biome = BiomeType.FOREST;
  } else if (activity.decorations.includes('flowers') || activity.decorations.includes('gardens')) {
    tiles[y][x].biome = BiomeType.PARK;
  } else {
    // Default boundary marker
    tiles[y][x].biome = BiomeType.COLUMN;
  }
}

/**
 * Ensure adequate outdoor lighting based on cultural and era preferences
 */
function ensureAdequateOutdoorLighting(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity,
  size: { width: number, height: number }
): void {
  const lightingType = activity.lighting;
  const minLightsPerZone = 2;
  
  // Add lighting to key zones
  [OutdoorZoneType.PERFORMANCE, OutdoorZoneType.CEREMONIAL, OutdoorZoneType.VENDOR].forEach(zoneType => {
    const zoneAreas = zones[zoneType];
    if (zoneAreas) {
      zoneAreas.forEach(zone => {
        for (let i = 0; i < minLightsPerZone; i++) {
          const lightX = zone.x + Math.floor(zone.width / (minLightsPerZone + 1)) * (i + 1);
          const lightY = zone.y + 1;
          
          if (lightX >= 0 && lightX < tiles[0].length && lightY >= 0 && lightY < tiles.length) {
            addOutdoorLighting(tiles, lightX, lightY, lightingType, config);
          }
        }
      });
    }
  });
}

/**
 * Add culturally appropriate outdoor lighting
 */
function addOutdoorLighting(
  tiles: Tile[][],
  x: number,
  y: number,
  lightingType: string,
  config: SpecialMapConfig
): void {
  switch (lightingType) {
    case 'torches':
    case 'fires':
      tiles[y][x].overlayObject = { type: OverlayObjectType.TORCH };
      break;
    case 'lanterns':
    case 'paper_lanterns':
    case 'hanging_lanterns':
      tiles[y][x].overlayObject = { type: OverlayObjectType.LANTERN };
      break;
    case 'braziers':
      tiles[y][x].overlayObject = { type: OverlayObjectType.BRAZIER };
      break;
    case 'oil_lamps':
      tiles[y][x].overlayObject = { type: OverlayObjectType.CANDLE };
      break;
    case 'electric':
      if (config.specificYear && config.specificYear > 1880) {
        tiles[y][x].biome = BiomeType.COLUMN; // Electric lamp post
      } else {
        tiles[y][x].overlayObject = { type: OverlayObjectType.LANTERN };
      }
      break;
    case 'natural':
      // No artificial lighting for natural settings
      break;
    default:
      tiles[y][x].overlayObject = { type: OverlayObjectType.TORCH };
  }
}

/**
 * Add cultural outdoor furniture clusters based on activity and era
 */
function addCulturalOutdoorFurniture(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  // Add era-specific furniture groupings
  const audienceZones = zones[OutdoorZoneType.AUDIENCE] || [];
  audienceZones.forEach(zone => {
    addOutdoorFurnitureCluster(tiles, zone, config, activity, 'seating');
  });
  
  const vendorZones = zones[OutdoorZoneType.VENDOR] || [];
  vendorZones.forEach(zone => {
    addOutdoorFurnitureCluster(tiles, zone, config, activity, 'trading');
  });
}

/**
 * Add specific outdoor furniture clusters
 */
function addOutdoorFurnitureCluster(
  tiles: Tile[][],
  zone: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  activity: CulturalActivity,
  clusterType: 'seating' | 'trading' | 'ceremonial'
): void {
  const centerX = zone.x + Math.floor(zone.width / 2);
  const centerY = zone.y + Math.floor(zone.height / 2);
  
  switch (clusterType) {
    case 'seating':
      // Cultural seating arrangements
      if (activity.furniture.includes('cushions') || config.culturalZone === 'MENA') {
        // Floor cushion clusters
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;
            if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
              tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION };
            }
          }
        }
      } else if (activity.furniture.includes('benches')) {
        // Bench arrangements
        placeBenchWithOrientation(tiles, centerX - 2, centerY, 'north', config.culturalZone || 'EUROPEAN');
        placeBenchWithOrientation(tiles, centerX + 2, centerY, 'south', config.culturalZone || 'EUROPEAN');
      }
      break;
      
    case 'trading':
      // Market table clusters
      placeSmartTable(tiles, centerX, centerY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
      if (centerX + 2 < tiles[0].length) {
        placeSmartTable(tiles, centerX + 2, centerY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
      }
      break;
      
    case 'ceremonial':
      // Sacred furniture arrangements
      if (centerX >= 0 && centerX < tiles[0].length && centerY >= 0 && centerY < tiles.length) {
        tiles[centerY][centerX].overlayObject = { 
          type: OverlayObjectType.ALTAR,
          rotation: 0,
          variant: config.culturalZone
        };
      }
      break;
  }
}

/**
 * Add cultural outdoor decorations and atmosphere
 */
function addCulturalOutdoorDecorations(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  console.log('[OpenField] Adding cultural decorations for:', activity.name);
  
  // Add decorations based on activity and cultural context
  activity.decorations.forEach(decoration => {
    addDecorationByType(tiles, zones, config, decoration);
  });
  
  // Add era-specific atmospheric elements
  addAtmosphericElements(tiles, zones, config, activity);
}

/**
 * Add specific decoration types throughout the space
 */
function addDecorationByType(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  decoration: string
): void {
  const peripheryZones = zones[OutdoorZoneType.PERIPHERY] || [];
  
  peripheryZones.forEach(zone => {
    const decorationCount = Math.floor(zone.width * zone.height / 20); // 5% decoration density
    
    for (let i = 0; i < decorationCount; i++) {
      const x = zone.x + Math.floor(Math.random() * zone.width);
      const y = zone.y + Math.floor(Math.random() * zone.height);
      
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        switch (decoration) {
          case 'flags':
          case 'banners':
            tiles[y][x].biome = BiomeType.COLUMN; // Flag poles
            break;
          case 'flowers':
          case 'cherry_blossoms':
          case 'gardens':
            tiles[y][x].biome = BiomeType.PARK;
            break;
          case 'trees':
          case 'palm_trees':
            tiles[y][x].biome = BiomeType.FOREST;
            break;
          case 'sculptures':
          case 'statues':
          case 'monuments':
            tiles[y][x].biome = BiomeType.STATUE;
            break;
          case 'heraldic_shields':
          case 'signs':
            tiles[y][x].overlayObject = { type: OverlayObjectType.BANNER };
            break;
          case 'mosaics':
          case 'geometrics':
            // Enhanced floor patterns (represented through different flooring)
            if (config.culturalZone === 'MENA') {
              tiles[y][x].biome = BiomeType.FLOOR_TILE;
            } else {
              tiles[y][x].biome = BiomeType.FLOOR_STONE;
            }
            break;
          case 'ribbons':
          case 'textiles':
            // Decorative elements on nearby furniture
            placeCulturalDecoration(tiles, x, y, config.culturalZone || 'EUROPEAN', decoration);
            break;
        }
      }
    }
  });
}

/**
 * Add atmospheric elements based on era and culture
 */
function addAtmosphericElements(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const year = config.specificYear || 1400;
  
  // Add era-specific atmospheric elements
  if (culturalZone === 'MENA' && activity.decorations.includes('camels')) {
    // Add camel representations at periphery for desert settings
    const peripheryZones = zones[OutdoorZoneType.PERIPHERY] || [];
    peripheryZones.forEach(zone => {
      const x = zone.x + 2;
      const y = zone.y + 2;
      if (x < tiles[0].length && y < tiles.length) {
        tiles[y][x].biome = BiomeType.COLUMN; // Represents hitching posts for camels
      }
    });
  }
  
  if (culturalZone === 'EAST_ASIAN' && activity.name.includes('Garden')) {
    // Add zen elements like rock gardens
    const ceremonyZones = zones[OutdoorZoneType.CEREMONIAL] || [];
    ceremonyZones.forEach(zone => {
      for (let i = 0; i < 3; i++) {
        const x = zone.x + Math.floor(zone.width / 4) * (i + 1);
        const y = zone.y + Math.floor(zone.height / 2);
        if (x < tiles[0].length && y < tiles.length) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE; // Meditation stones
        }
      }
    });
  }
  
  if (activity.decorations.includes('horses') && year < 1900) {
    // Add horse-related elements for pre-automotive eras
    const entranceZones = zones[OutdoorZoneType.ENTRANCE] || [];
    entranceZones.forEach(zone => {
      const x = zone.x + 1;
      const y = zone.y + 1;
      if (x < tiles[0].length && y < tiles.length) {
        tiles[y][x].biome = BiomeType.COLUMN; // Hitching posts
      }
    });
  }
}

/**
 * Create interaction zones for outdoor activities
 */
function createOutdoorInteractionZones(
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  activity: CulturalActivity,
  interactionZones: InteractionZone[]
): void {
  console.log('[OpenField] Creating interaction zones for:', activity.name);
  
  // Create interaction zones for different outdoor zone types
  Object.entries(zones).forEach(([zoneType, zoneAreas]) => {
    if (!zoneAreas || zoneAreas.length === 0) return;
    
    zoneAreas.forEach((zone, index) => {
      const zoneId = `${zoneType.toLowerCase()}_${index}`;
      
      switch (zoneType as OutdoorZoneType) {
        case OutdoorZoneType.PERFORMANCE:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'performance',
            interactions: ['speak', 'perform', 'entertain']
          });
          break;
          
        case OutdoorZoneType.ACTIVITY:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'recreation',
            interactions: ['compete', 'exercise', 'play', 'train']
          });
          break;
          
        case OutdoorZoneType.VENDOR:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'commerce',
            interactions: ['trade', 'buy', 'sell', 'negotiate']
          });
          break;
          
        case OutdoorZoneType.CEREMONIAL:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'ceremony',
            interactions: ['worship', 'pray', 'ceremony', 'ritual']
          });
          break;
          
        case OutdoorZoneType.AUDIENCE:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'social',
            interactions: ['watch', 'gather', 'socialize', 'discuss']
          });
          break;
          
        case OutdoorZoneType.ENTRANCE:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'entrance',
            interactions: ['enter', 'greet', 'welcome']
          });
          break;
      }
    });
  });
  
  // Add activity-specific interaction zones
  if (activity.furniture.includes('archery_targets')) {
    // Find activity zones and add archery interactions
    const activityZones = zones[OutdoorZoneType.ACTIVITY] || [];
    activityZones.forEach((zone, index) => {
      interactionZones.push({
        id: `archery_range_${index}`,
        bounds: {
          x: zone.x,
          y: zone.y + Math.floor(zone.height / 2) - 2,
          width: zone.width,
          height: 4
        },
        type: 'archery',
        interactions: ['shoot', 'practice', 'compete']
      });
    });
  }
  
  if (activity.furniture.includes('fire_pit')) {
    // Add gathering zones around fire pits
    const activityZones = zones[OutdoorZoneType.ACTIVITY] || [];
    activityZones.forEach((zone, index) => {
      const centerX = zone.x + Math.floor(zone.width / 2);
      const centerY = zone.y + Math.floor(zone.height / 2);
      
      interactionZones.push({
        id: `fire_gathering_${index}`,
        bounds: {
          x: centerX - 4,
          y: centerY - 4,
          width: 8,
          height: 8
        },
        type: 'gathering',
        interactions: ['gather', 'warm', 'cook', 'storytell']
      });
    });
  }
}

function generateParadeGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Military parade ground with reviewing stand
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main parade route (wide road down center)
  for (let y = 5; y < size.height - 5; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      if (x > 0 && x < size.width - 1) {
        tiles[y][x].biome = BiomeType.ROAD;
      }
    }
  }
  
  // Reviewing stand at north
  for (let x = centerX - 10; x <= centerX + 10; x++) {
    for (let y = 2; y <= 4; y++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.PAVILION;
      }
    }
  }
  
  // VIP seating in reviewing stand
  for (let x = centerX - 8; x <= centerX + 8; x += 2) {
    tiles[3][x].biome = BiomeType.CHAIR;
  }
  // Central position for leader using overlay system
  tiles[3][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: config.culturalZone
  };
  tiles[3][centerX].isBlocking = true;
  
  // Flag poles along parade route
  for (let y = 10; y < size.height - 10; y += 8) {
    tiles[y][centerX - 10].biome = BiomeType.COLUMN;
    tiles[y][centerX + 10].biome = BiomeType.COLUMN;
  }
  
  // Spectator areas on sides
  for (let y = 8; y < size.height - 8; y += 3) {
    for (let x = 3; x < centerX - 12; x += 3) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
    for (let x = centerX + 13; x < size.width - 3; x += 3) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generateFestivalGround(tiles: Tile[][], size: any, config: SpecialMapConfig, noise: ValueNoise) {
  // Festival ground with tents and stages
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main stage at north
  for (let x = centerX - 12; x <= centerX + 12; x++) {
    for (let y = 3; y <= 8; y++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.STAGE;
      }
    }
  }
  
  // Dance floor/gathering area in center
  for (let y = centerY - 8; y <= centerY + 8; y++) {
    for (let x = centerX - 10; x <= centerX + 10; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      }
    }
  }
  
  // Food and vendor tents (pavilions) scattered around
  const tentPositions = [
    { x: 5, y: 15 },
    { x: size.width - 10, y: 15 },
    { x: 5, y: size.height - 10 },
    { x: size.width - 10, y: size.height - 10 },
    { x: 15, y: centerY },
    { x: size.width - 15, y: centerY }
  ];
  
  tentPositions.forEach(pos => {
    for (let y = pos.y; y < pos.y + 5 && y < size.height - 1; y++) {
      for (let x = pos.x; x < pos.x + 5 && x < size.width - 1; x++) {
        if (x > 0 && y > 0) {
          if (x === pos.x || x === pos.x + 4 || y === pos.y || y === pos.y + 4) {
            tiles[y][x].biome = BiomeType.PAVILION;
          } else {
            tiles[y][x].biome = BiomeType.TABLE; // Vendor tables
          }
        }
      }
    }
  });
  
  // Scattered seating areas
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(noise.random() * (size.width - 4)) + 2;
    const y = Math.floor(noise.random() * (size.height - 15)) + 12;
    if (tiles[y][x].biome === BiomeType.GRASS) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generatePlaza(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Urban plaza with fountain and monuments
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Paved plaza floor
  fillArea(tiles, 2, 2, size.width - 4, size.height - 4, BiomeType.FLOOR_STONE);
  
  // Central fountain
  for (let y = centerY - 3; y <= centerY + 3; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= 9) {
        tiles[y][x].biome = BiomeType.FOUNTAIN;
      }
    }
  }
  
  // Monument/statue at key positions
  tiles[8][centerX].biome = BiomeType.STATUE;
  tiles[size.height - 9][centerX].biome = BiomeType.STATUE;
  
  // Trees/gardens in corners
  const gardenCorners = [
    { x: 5, y: 5 },
    { x: size.width - 8, y: 5 },
    { x: 5, y: size.height - 8 },
    { x: size.width - 8, y: size.height - 8 }
  ];
  
  gardenCorners.forEach(corner => {
    for (let y = corner.y; y < corner.y + 3; y++) {
      for (let x = corner.x; x < corner.x + 3; x++) {
        if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.PARK;
        }
      }
    }
  });
  
  // Benches around plaza
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const x = Math.floor(centerX + 12 * Math.cos(angle));
    const y = Math.floor(centerY + 12 * Math.sin(angle));
    if (x > 1 && x < size.width - 2 && y > 1 && y < size.height - 2) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

function generateDuelingGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Formal dueling ground
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Dueling strip in center
  for (let y = centerY - 15; y <= centerY + 15; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
  }
  
  // Starting positions marked
  tiles[centerY - 10][centerX].biome = BiomeType.FLOOR_STONE;
  tiles[centerY + 10][centerX].biome = BiomeType.FLOOR_STONE;
  
  // Witness pavilions on sides
  tiles[centerY][10].biome = BiomeType.PAVILION;
  tiles[centerY][size.width - 11].biome = BiomeType.PAVILION;
  
  // Seconds' positions
  tiles[centerY - 10][centerX - 6].biome = BiomeType.CHAIR;
  tiles[centerY - 10][centerX + 6].biome = BiomeType.CHAIR;
  tiles[centerY + 10][centerX - 6].biome = BiomeType.CHAIR;
  tiles[centerY + 10][centerX + 6].biome = BiomeType.CHAIR;
  
  // Trees for privacy (dueling often done at dawn in secluded spots)
  for (let y = 3; y < size.height - 3; y += 5) {
    tiles[y][3].biome = BiomeType.FOREST;
    tiles[y][size.width - 4].biome = BiomeType.FOREST;
  }
}

function generateNaadamField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Mongolian Naadam festival ground (three manly sports)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Wrestling circle in center
  for (let y = centerY - 8; y <= centerY + 8; y++) {
    for (let x = centerX - 8; x <= centerX + 8; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= 64) {
        tiles[y][x].biome = BiomeType.SAND;
      }
    }
  }
  
  // Archery range on west side
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = 5; x < centerX - 12; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Archery targets
  tiles[centerY][8].biome = BiomeType.TABLE; // Target stand
  
  // Horse racing track markers (around perimeter)
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const x = Math.floor(centerX + 20 * Math.cos(angle));
    const y = Math.floor(centerY + 15 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.COLUMN; // Marker posts
    }
  }
  
  // Spectator yurts (represented as pavilions)
  const yurtPositions = [
    { x: 5, y: 5 },
    { x: size.width - 8, y: 5 },
    { x: 5, y: size.height - 8 },
    { x: size.width - 8, y: size.height - 8 }
  ];
  
  yurtPositions.forEach(pos => {
    for (let y = pos.y; y < pos.y + 3; y++) {
      for (let x = pos.x; x < pos.x + 3; x++) {
        if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.PAVILION;
        }
      }
    }
  });
}

function generateTrainingGround(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Military training ground
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Sparring circles
  const circles = [
    { x: centerX - 10, y: centerY - 8 },
    { x: centerX + 10, y: centerY - 8 },
    { x: centerX - 10, y: centerY + 8 },
    { x: centerX + 10, y: centerY + 8 }
  ];
  
  circles.forEach(circle => {
    for (let y = circle.y - 4; y <= circle.y + 4; y++) {
      for (let x = circle.x - 4; x <= circle.x + 4; x++) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        if (dx * dx + dy * dy <= 16 && x > 0 && x < size.width - 1 && 
            y > 0 && y < size.height - 1) {
          tiles[y][x].biome = BiomeType.SAND;
        }
      }
    }
  });
  
  // Weapon racks
  for (let x = 5; x < size.width - 5; x += 10) {
    tiles[3][x].biome = BiomeType.TABLE;
    tiles[size.height - 4][x].biome = BiomeType.TABLE;
  }
  
  // Training dummies (represented as columns)
  for (let x = centerX - 15; x <= centerX + 15; x += 5) {
    tiles[centerY][x].biome = BiomeType.COLUMN;
  }
  
  // Observation platform
  for (let x = centerX - 5; x <= centerX + 5; x++) {
    tiles[size.height - 8][x].biome = BiomeType.PAVILION;
  }
}

function generateSpeakersCorner(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Hyde Park style speakers' corner
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Main speaking platform
  for (let y = centerY - 2; y <= centerY + 2; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      tiles[y][x].biome = BiomeType.STAGE;
    }
  }
  
  // Secondary speaking spots (soap boxes)
  const speakingSpots = [
    { x: 10, y: 10 },
    { x: size.width - 11, y: 10 },
    { x: 10, y: size.height - 11 },
    { x: size.width - 11, y: size.height - 11 }
  ];
  
  speakingSpots.forEach(spot => {
    tiles[spot.y][spot.x].biome = BiomeType.TABLE; // Soapbox
  });
  
  // Gathering areas (circles of chairs)
  speakingSpots.forEach(spot => {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const x = Math.floor(spot.x + 3 * Math.cos(angle));
      const y = Math.floor(spot.y + 3 * Math.sin(angle));
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
      }
    }
  });
  
  // Park benches scattered around
  for (let i = 0; i < 10; i++) {
    const x = 5 + Math.floor(Math.random() * (size.width - 10));
    const y = 5 + Math.floor(Math.random() * (size.height - 10));
    if (tiles[y][x].biome === BiomeType.GRASS) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
  
  // Trees for atmosphere
  for (let y = 2; y < size.height - 2; y += 8) {
    for (let x = 2; x < size.width - 2; x += 8) {
      if (tiles[y][x].biome === BiomeType.GRASS) {
        tiles[y][x].biome = BiomeType.PARK;
      }
    }
  }
}

function generateGenericField(tiles: Tile[][], size: any, config: SpecialMapConfig) {
  // Simple open field
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Some scattered features
  tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  
  // Boundary markers
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const x = Math.floor(centerX + 15 * Math.cos(angle));
    const y = Math.floor(centerY + 12 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Some seating
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const x = Math.floor(centerX + 8 * Math.cos(angle));
    const y = Math.floor(centerY + 8 * Math.sin(angle));
    if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
      tiles[y][x].biome = BiomeType.CHAIR;
    }
  }
}

/**
 * Create main ceremonial axis with processional pathway
 */
function createCeremonialAxis(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  
  // Main north-south ceremonial axis
  for (let y = 0; y < size.height; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        // Use culture-appropriate ceremonial paving
        if (config.culturalZone === 'EUROPEAN') {
          tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        } else if (config.culturalZone === 'EAST_ASIAN') {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        } else if (config.culturalZone === 'MENA') {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        } else if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || config.culturalZone === 'SOUTH_AMERICAN') {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        } else {
          tiles[y][x].biome = BiomeType.PLAZA;
        }
      }
    }
  }
  
  // Secondary east-west axis for balance
  const centerY = Math.floor(size.height / 2);
  for (let x = 0; x < size.width; x++) {
    for (let y = centerY - 1; y <= centerY + 1; y++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        if (config.culturalZone === 'EUROPEAN') {
          tiles[y][x].biome = BiomeType.PLAZA;
        } else if (config.culturalZone === 'EAST_ASIAN') {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        } else {
          tiles[y][x].biome = BiomeType.PLAZA;
        }
      }
    }
  }
}

/**
 * Create monumental centerpiece based on cultural context
 */
function createMonumentalCenterpiece(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  activity: CulturalActivity,
  size: { width: number, height: number }
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.specificYear || 1400;
  
  if (culturalZone === 'EUROPEAN') {
    if (era < 500) {
      // Roman style - triumphal fountain complex
      createTriumphalFountain(tiles, centerX, centerY, config);
    } else if (era < 1500) {
      // Medieval - memorial cross or throne
      createMemorialCross(tiles, centerX, centerY, config);
    } else if (era < 1800) {
      // Renaissance - obelisk and fountains
      createRenaissanceObelisk(tiles, centerX, centerY, config);
    } else {
      // Modern - reflecting pool and monument
      createModernMonument(tiles, centerX, centerY, config);
    }
  } else if (culturalZone === 'EAST_ASIAN') {
    // Pagoda or imperial dragon platform
    createImperialPlatform(tiles, centerX, centerY, config);
  } else if (culturalZone === 'MENA') {
    // Central fountain with geometric gardens
    createIslamicFountainComplex(tiles, centerX, centerY, config);
  } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    // Sacred fire platform or ball court
    createSacredFirePlatform(tiles, centerX, centerY, config);
  } else if (culturalZone === 'SOUTH_AMERICAN') {
    // Inca ceremonial platform
    createIncaCeremonialPlatform(tiles, centerX, centerY, config);
  } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    // Royal throne platform with drums
    createRoyalThronePlatform(tiles, centerX, centerY, config);
  } else {
    // Default monument
    createDefaultMonument(tiles, centerX, centerY, config);
  }
}

/**
 * Create processional approach with grand entrance
 */
function createProcessionalApproach(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  const entranceY = size.height - 5;
  
  // Grand entrance gateway
  if (entranceY >= 0 && entranceY < size.height) {
    // Gate pillars
    if (centerX - 6 >= 0 && centerX - 6 < size.width) {
      tiles[entranceY][centerX - 6].overlayObject = {
        type: OverlayObjectType.PILLAR,
        rotation: 0,
        variant: 'entrance'
      };
    }
    if (centerX + 6 >= 0 && centerX + 6 < size.width) {
      tiles[entranceY][centerX + 6].overlayObject = {
        type: OverlayObjectType.PILLAR,
        rotation: 0,
        variant: 'entrance'
      };
    }
    
    // Archway if appropriate culture
    if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
      tiles[entranceY][centerX].overlayObject = {
        type: OverlayObjectType.ARCHWAY,
        rotation: 0
      };
    }
  }
  
  // Stepped approach leading to center
  const steps = 8;
  const stepHeight = Math.floor((size.height - 10) / steps);
  
  for (let step = 0; step < steps; step++) {
    const y = entranceY - (step * stepHeight);
    if (y >= 0 && y < size.height) {
      for (let x = centerX - 4; x <= centerX + 4; x++) {
        if (x >= 0 && x < size.width) {
          tiles[y][x].biome = BiomeType.DAIS;
        }
      }
    }
  }
}

/**
 * Add flanking monuments and commemorative pillars
 */
function addFlankingMonuments(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Symmetrical monument placement
  const monumentPositions = [
    { x: centerX - 15, y: centerY - 10, name: 'northwest' },
    { x: centerX + 15, y: centerY - 10, name: 'northeast' },
    { x: centerX - 15, y: centerY + 10, name: 'southwest' },
    { x: centerX + 15, y: centerY + 10, name: 'southeast' }
  ];
  
  monumentPositions.forEach((pos, index) => {
    if (pos.x >= 2 && pos.x < size.width - 2 && pos.y >= 2 && pos.y < size.height - 2) {
      // Create monument base
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = pos.x + dx;
          const y = pos.y + dy;
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            tiles[y][x].biome = BiomeType.DAIS;
          }
        }
      }
      
      // Add monument type based on culture
      if (config.culturalZone === 'EUROPEAN') {
        // Victory columns or statues
        tiles[pos.y][pos.x].overlayObject = {
          type: index % 2 === 0 ? OverlayObjectType.STATUE : OverlayObjectType.VICTORY_COLUMN,
          rotation: 0
        };
      } else if (config.culturalZone === 'EAST_ASIAN') {
        // Stone lions or dragons
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.STONE_LION,
          rotation: index % 2 === 0 ? 45 : 315 // Face inward
        };
      } else if (config.culturalZone === 'MENA') {
        // Minaret or geometric pillars
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.MINARET,
          rotation: 0
        };
      } else {
        // Default pillars
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.PILLAR,
          rotation: 0
        };
      }
    }
  });
}

/**
 * Create gathering spaces and viewing areas
 */
function createGatheringSpaces(
  tiles: Tile[][],
  zones: { [key in OutdoorZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  activity: CulturalActivity,
  size: { width: number, height: number }
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create amphitheater-style seating areas
  const seatingSections = [
    { centerX: centerX - 20, centerY: centerY, name: 'west' },
    { centerX: centerX + 20, centerY: centerY, name: 'east' },
    { centerX: centerX, centerY: centerY - 20, name: 'north' },
    { centerX: centerX, centerY: centerY + 20, name: 'south' }
  ];
  
  seatingSections.forEach(section => {
    if (section.centerX >= 5 && section.centerX < size.width - 5 && 
        section.centerY >= 5 && section.centerY < size.height - 5) {
      
      // Create tiered seating
      for (let tier = 0; tier < 3; tier++) {
        const radius = 4 + tier * 2;
        const seatCount = 8 + tier * 4;
        
        for (let seat = 0; seat < seatCount; seat++) {
          const angle = (seat / seatCount) * Math.PI; // Semi-circle facing center
          const x = Math.floor(section.centerX + radius * Math.cos(angle));
          const y = Math.floor(section.centerY + radius * Math.sin(angle) * 0.5);
          
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.BENCH,
              rotation: Math.round((angle + Math.PI) * 180 / Math.PI), // Face toward center
              material: 'stone'
            };
          }
        }
      }
    }
  });
  
  // VIP viewing platforms
  const vipPlatforms = [
    { x: centerX, y: centerY - 25, name: 'royal_box' },
    { x: centerX, y: centerY + 25, name: 'dignitary_section' }
  ];
  
  vipPlatforms.forEach(platform => {
    if (platform.x >= 3 && platform.x < size.width - 3 &&
        platform.y >= 3 && platform.y < size.height - 3) {
      
      // Raised platform
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const x = platform.x + dx;
          const y = platform.y + dy;
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            tiles[y][x].biome = BiomeType.DAIS;
          }
        }
      }
      
      // Throne or ceremonial seating
      tiles[platform.y][platform.x].overlayObject = {
        type: OverlayObjectType.THRONE,
        rotation: platform.name === 'royal_box' ? 180 : 0,
        variant: config.culturalZone
      };
      
      // Flanking seats
      tiles[platform.y][platform.x - 2].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: platform.name === 'royal_box' ? 180 : 0,
        material: 'ornate'
      };
      tiles[platform.y][platform.x + 2].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: platform.name === 'royal_box' ? 180 : 0,
        material: 'ornate'
      };
    }
  });
}

/**
 * Add cultural-specific ceremonial elements
 */
function addCulturalCeremonialElements(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  switch (culturalZone) {
    case 'EUROPEAN':
      addEuropeanCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'EAST_ASIAN':
      addEastAsianCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'MENA':
      addMenaCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      addNativeAmericanCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'SOUTH_AMERICAN':
      addSouthAmericanCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'SUB_SAHARAN_AFRICAN':
      addAfricanCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'OCEANIA':
      addOceaniaCeremonialElements(tiles, centerX, centerY, size, config);
      break;
    case 'SOUTH_ASIAN':
      addSouthAsianCeremonialElements(tiles, centerX, centerY, size, config);
      break;
  }
}

/**
 * Add overlay pillars and multi-tile columns throughout the plaza
 */
function addOverlayPillarsAndColumns(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Colonnade along the main axis
  const columnSpacing = 8;
  for (let i = 1; i < 6; i++) {
    const x1 = centerX - i * columnSpacing;
    const x2 = centerX + i * columnSpacing;
    
    // North colonnade
    if (x1 >= 0 && x1 < size.width && centerY - 10 >= 0) {
      tiles[centerY - 10][x1].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'ceremonial'
      };
    }
    if (x2 >= 0 && x2 < size.width && centerY - 10 >= 0) {
      tiles[centerY - 10][x2].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'ceremonial'
      };
    }
    
    // South colonnade
    if (x1 >= 0 && x1 < size.width && centerY + 10 < size.height) {
      tiles[centerY + 10][x1].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'ceremonial'
      };
    }
    if (x2 >= 0 && x2 < size.width && centerY + 10 < size.height) {
      tiles[centerY + 10][x2].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'ceremonial'
      };
    }
  }
  
  // Multi-tile column complexes at key points
  const multiColumnPositions = [
    { x: centerX - 25, y: centerY, type: 'COLUMN_CLUSTER_2X2' },
    { x: centerX + 25, y: centerY, type: 'COLUMN_CLUSTER_2X2' },
    { x: centerX, y: centerY - 25, type: 'COLUMN_CLUSTER_3X3' },
    { x: centerX, y: centerY + 25, type: 'COLUMN_CLUSTER_2X2' }
  ];
  
  multiColumnPositions.forEach(pos => {
    if (pos.x >= 2 && pos.x < size.width - 2 && pos.y >= 2 && pos.y < size.height - 2) {
      addMultiTileColumnComplex(tiles, pos.x, pos.y, pos.type, config);
    }
  });
  
  // Perimeter pillars for boundary definition
  const perimeterPillars = 16;
  for (let i = 0; i < perimeterPillars; i++) {
    const angle = (i / perimeterPillars) * Math.PI * 2;
    const radius = Math.min(size.width, size.height) * 0.4;
    const x = Math.floor(centerX + radius * Math.cos(angle));
    const y = Math.floor(centerY + radius * Math.sin(angle));
    
    if (x >= 1 && x < size.width - 1 && y >= 1 && y < size.height - 1) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.PILLAR,
        rotation: 0,
        variant: 'boundary'
      };
    }
  }
}

/**
 * Create memorial and commemorative elements
 */
function createMemorialElements(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  activity: CulturalActivity
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Memorial walls with inscriptions
  const memorialPositions = [
    { x: centerX - 30, y: centerY, orientation: 'vertical' },
    { x: centerX + 30, y: centerY, orientation: 'vertical' }
  ];
  
  memorialPositions.forEach(memorial => {
    if (memorial.x >= 2 && memorial.x < size.width - 2 &&
        memorial.y >= 5 && memorial.y < size.height - 5) {
      
      const wallLength = 8;
      for (let i = 0; i < wallLength; i++) {
        let x, y;
        if (memorial.orientation === 'vertical') {
          x = memorial.x;
          y = memorial.y - Math.floor(wallLength / 2) + i;
        } else {
          x = memorial.x - Math.floor(wallLength / 2) + i;
          y = memorial.y;
        }
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles[y][x].overlayObject = {
            type: OverlayObjectType.MEMORIAL_WALL,
            rotation: memorial.orientation === 'vertical' ? 0 : 90
          };
        }
      }
    }
  });
  
  // Eternal flames or commemorative braziers
  const flamePositions = [
    { x: centerX - 12, y: centerY - 15 },
    { x: centerX + 12, y: centerY - 15 },
    { x: centerX - 12, y: centerY + 15 },
    { x: centerX + 12, y: centerY + 15 }
  ];
  
  flamePositions.forEach(flame => {
    if (flame.x >= 0 && flame.x < size.width && flame.y >= 0 && flame.y < size.height) {
      // Raised base
      tiles[flame.y][flame.x].biome = BiomeType.DAIS;
      
      // Brazier
      tiles[flame.y][flame.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
        rotation: 0,
        variant: 'eternal_flame'
      };
    }
  });
  
  // Commemorative plaques or inscriptions
  if (centerX >= 3 && centerX < size.width - 3 && centerY + 18 < size.height) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      tiles[centerY + 18][x].overlayObject = {
        type: OverlayObjectType.PLAQUE,
        rotation: 0,
        variant: 'commemorative'
      };
    }
  }
}

// Cultural-specific helper functions
function addEuropeanCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Heraldic banners
  const bannerPositions = [
    { x: centerX - 8, y: centerY - 12 },
    { x: centerX + 8, y: centerY - 12 },
    { x: centerX - 8, y: centerY + 12 },
    { x: centerX + 8, y: centerY + 12 }
  ];
  
  bannerPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.HERALDIC_BANNER,
        rotation: 0
      };
    }
  });
  
  // Coat of arms displays
  if (centerX >= 0 && centerX < size.width && centerY - 8 >= 0) {
    tiles[centerY - 8][centerX].overlayObject = {
      type: OverlayObjectType.COAT_OF_ARMS,
      rotation: 0
    };
  }
}

function addEastAsianCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Dragon statues
  const dragonPositions = [
    { x: centerX - 6, y: centerY - 6 },
    { x: centerX + 6, y: centerY - 6 },
    { x: centerX - 6, y: centerY + 6 },
    { x: centerX + 6, y: centerY + 6 }
  ];
  
  dragonPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.DRAGON_STATUE,
        rotation: 0
      };
    }
  });
  
  // Incense burners
  if (centerX >= 0 && centerX < size.width && centerY - 4 >= 0) {
    tiles[centerY - 4][centerX].overlayObject = {
      type: OverlayObjectType.INCENSE_BURNER,
      rotation: 0
    };
  }
}

function addMenaCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Islamic geometric patterns using floor tiles
  const patternSize = 6;
  for (let dy = -patternSize; dy <= patternSize; dy++) {
    for (let dx = -patternSize; dx <= patternSize; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        if ((Math.abs(dx) + Math.abs(dy)) % 3 === 0) {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  // Minarets at corners
  const minaretPositions = [
    { x: centerX - 15, y: centerY - 15 },
    { x: centerX + 15, y: centerY - 15 },
    { x: centerX - 15, y: centerY + 15 },
    { x: centerX + 15, y: centerY + 15 }
  ];
  
  minaretPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.MINARET,
        rotation: 0
      };
    }
  });
}

function addNativeAmericanCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Medicine wheel pattern
  const wheelRadius = 8;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    const x = Math.floor(centerX + wheelRadius * Math.cos(angle));
    const y = Math.floor(centerY + wheelRadius * Math.sin(angle));
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.SACRED_STONE,
        rotation: 0
      };
    }
  }
  
  // Totem poles
  const totemPositions = [
    { x: centerX, y: centerY - 20 },
    { x: centerX, y: centerY + 20 }
  ];
  
  totemPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.TOTEM_POLE,
        rotation: 0
      };
    }
  });
}

function addSouthAmericanCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Inca sun disc
  if (centerX >= 0 && centerX < size.width && centerY - 6 >= 0) {
    tiles[centerY - 6][centerX].overlayObject = {
      type: OverlayObjectType.SUN_DISC,
      rotation: 0
    };
  }
  
  // Ceremonial terraces
  for (let tier = 1; tier <= 3; tier++) {
    const radius = 4 + tier * 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = Math.floor(centerX + radius * Math.cos(angle));
      const y = Math.floor(centerY + radius * Math.sin(angle));
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.DAIS;
      }
    }
  }
}

function addAfricanCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Ceremonial drums in circle
  const drumRadius = 6;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.floor(centerX + drumRadius * Math.cos(angle));
    const y = Math.floor(centerY + drumRadius * Math.sin(angle));
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.DRUM,
        rotation: 0,
        variant: 'ceremonial'
      };
    }
  }
  
  // Ancestral masks
  if (centerX >= 0 && centerX < size.width && centerY - 10 >= 0) {
    tiles[centerY - 10][centerX].overlayObject = {
      type: OverlayObjectType.ANCESTRAL_MASK,
      rotation: 0
    };
  }
}

function addOceaniaCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Tiki statues
  const tikiPositions = [
    { x: centerX - 8, y: centerY - 8 },
    { x: centerX + 8, y: centerY - 8 },
    { x: centerX - 8, y: centerY + 8 },
    { x: centerX + 8, y: centerY + 8 }
  ];
  
  tikiPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.TIKI_STATUE,
        rotation: 0
      };
    }
  });
}

function addSouthAsianCeremonialElements(tiles: Tile[][], centerX: number, centerY: number, size: { width: number, height: number }, config: SpecialMapConfig): void {
  // Lotus mandala pattern
  const mandalaPetals = 8;
  for (let i = 0; i < mandalaPetals; i++) {
    const angle = (i / mandalaPetals) * Math.PI * 2;
    const x = Math.floor(centerX + 5 * Math.cos(angle));
    const y = Math.floor(centerY + 5 * Math.sin(angle));
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.LOTUS_FOUNTAIN,
        rotation: 0
      };
    }
  }
  
  // Temple elephants
  if (centerX - 6 >= 0 && centerX - 6 < size.width && centerY >= 0 && centerY < size.height) {
    tiles[centerY][centerX - 6].overlayObject = {
      type: OverlayObjectType.ELEPHANT_STATUE,
      rotation: 90
    };
  }
  if (centerX + 6 >= 0 && centerX + 6 < size.width && centerY >= 0 && centerY < size.height) {
    tiles[centerY][centerX + 6].overlayObject = {
      type: OverlayObjectType.ELEPHANT_STATUE,
      rotation: 270
    };
  }
}

// Monument creation helper functions
function createTriumphalFountain(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Large circular fountain complex
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        if (dx * dx + dy * dy <= 9) {
          tiles[y][x].biome = BiomeType.FOUNTAIN;
        }
      }
    }
  }
  
  // Central triumph statue
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.TRIUMPH_STATUE,
    rotation: 0
  };
}

function createMemorialCross(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Stone cross base
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.DAIS;
      }
    }
  }
  
  // Memorial cross
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.MEMORIAL_CROSS,
    rotation: 0
  };
}

function createRenaissanceObelisk(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Square base
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Obelisk
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.OBELISK,
    rotation: 0
  };
  
  // Corner fountains
  const corners = [
    { x: centerX - 2, y: centerY - 2 },
    { x: centerX + 2, y: centerY - 2 },
    { x: centerX - 2, y: centerY + 2 },
    { x: centerX + 2, y: centerY + 2 }
  ];
  
  corners.forEach(corner => {
    if (corner.x >= 0 && corner.x < tiles[0].length && corner.y >= 0 && corner.y < tiles.length) {
      tiles[corner.y][corner.x].biome = BiomeType.FOUNTAIN;
    }
  });
}

function createModernMonument(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Reflecting pool
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.FOUNTAIN;
      }
    }
  }
  
  // Modern monument
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.MODERN_MONUMENT,
    rotation: 0
  };
}

function createImperialPlatform(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Stepped platform
  for (let tier = 0; tier < 3; tier++) {
    const size = 4 - tier;
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
          tiles[y][x].biome = BiomeType.DAIS;
        }
      }
    }
  }
  
  // Dragon throne
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.DRAGON_THRONE,
    rotation: 0
  };
}

function createIslamicFountainComplex(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Geometric fountain pattern
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        if (Math.abs(dx) + Math.abs(dy) <= 2) {
          tiles[y][x].biome = BiomeType.FOUNTAIN;
        }
      }
    }
  }
  
  // Central fountain feature
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.ISLAMIC_FOUNTAIN,
    rotation: 0
  };
}

function createSacredFirePlatform(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Circular platform
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        if (dx * dx + dy * dy <= 9) {
          tiles[y][x].biome = BiomeType.DAIS;
        }
      }
    }
  }
  
  // Sacred fire
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.SACRED_FIRE,
    rotation: 0
  };
}

function createIncaCeremonialPlatform(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Stepped pyramid base
  for (let tier = 0; tier < 3; tier++) {
    const size = 4 - tier;
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        }
      }
    }
  }
  
  // Sun temple
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.SUN_TEMPLE,
    rotation: 0
  };
}

function createRoyalThronePlatform(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Raised throne platform
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.DAIS;
      }
    }
  }
  
  // Royal throne
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: 'african'
  };
}

function createDefaultMonument(tiles: Tile[][], centerX: number, centerY: number, config: SpecialMapConfig): void {
  // Simple monument base
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.DAIS;
      }
    }
  }
  
  // Generic monument
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.MONUMENT,
    rotation: 0
  };
}

function addMultiTileColumnComplex(tiles: Tile[][], centerX: number, centerY: number, type: string, config: SpecialMapConfig): void {
  switch (type) {
    case 'COLUMN_CLUSTER_2X2':
      // 2x2 column cluster
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.COLUMN,
              rotation: 0,
              variant: 'cluster'
            };
          }
        }
      }
      break;
      
    case 'COLUMN_CLUSTER_3X3':
      // 3x3 column cluster
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].overlayObject = {
              type: OverlayObjectType.COLUMN,
              rotation: 0,
              variant: 'grand'
            };
          }
        }
      }
      break;
  }
}