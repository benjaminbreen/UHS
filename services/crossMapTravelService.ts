/**
 * crossMapTravelService.ts - Unified cross-map travel service for railroads and harbors
 *
 * Phase 1: Railroad network (land adjacencies only)
 * Phase 2: Harbor network (liminal ocean crossings) - TODO
 */

import { ADJACENCIES, LIMINAL_SEQUENCES } from '../constants/gameData/adjacencies';
import { CITIES_DATA, CityDefinition } from '../constants/gameData/cities';
import { HistoricalEra, CulturalZone } from '../types';
import type { LiminalSequence } from '../types/geography';
import { mapLocationToCulture } from '../utils/mapUtils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum TravelMode {
  RAILROAD = 'railroad',
  SHIP = 'ship',
  CARAVAN = 'caravan'
}

export interface TravelDestination {
  mapAreaName: string;
  cityName: string;
  distance: number; // In miles
  distanceInHops: number; // Number of map areas traversed (land) or sequence stages (ocean)
  travelTime: number; // In hours
  travelTimeMin?: number; // Minimum travel time (for ocean voyages with weather variability)
  travelTimeMax?: number; // Maximum travel time (for ocean voyages with weather variability)
  fare: number; // In coins
  travelMode: TravelMode;
  routePath?: string[]; // Map areas traversed, e.g., ["California Coast", "Sacramento Valley", "Sierra Nevada"]
  routeDescription?: string; // Human-readable route, e.g., "via Sacramento Valley"
  liminalSequenceKey?: string; // Liminal crossing key if applicable
  liminalSequence?: string[]; // Liminal crossing stages (for ocean voyages)
  shipTypeRequired?: 'coastal' | 'ocean-going' | 'steam-powered'; // Ship technology requirement
  dangerLevel?: 'low' | 'moderate' | 'high' | 'extreme'; // Journey danger rating

  // Cultural/Era-specific theming
  culturalTravelName?: string; // e.g., "Silk Road Caravan", "Greyhound Bus", "Llama Train"
  culturalIcon?: string; // emoji icon
  culturalDescription?: string; // flavor text
}

export interface TravelOptions {
  mode: TravelMode;
  maxHops?: number; // Maximum map areas to traverse (default: 4 for railroads)
  currentYear: number;
  currentEra: HistoricalEra;
  playerWealth?: number; // For filtering affordable routes
}

interface ReachableArea {
  areaName: string;
  hops: number;
  path: string[]; // Full path from start to this area
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RAILROAD_CONFIG = {
  DEFAULT_MAX_HOPS: 4,
  MILES_PER_HOP: 75, // Average distance per map area
  TRAIN_SPEED_MPH: 30, // Steam locomotive average speed
  BASE_FARE: 5, // Base ticket cost
  FARE_PER_HOP: 3, // Additional cost per map hop
  MIN_YEAR: 1830 // Railroads available from 1830 onwards
};

const HARBOR_CONFIG = {
  MIN_YEAR: -3000, // Ships available from antiquity
  MILES_PER_STAGE: 500, // Average distance per liminal sequence stage

  // Ship speeds by era (miles per day)
  COASTAL_SHIP_SPEED: 30, // Ancient/Medieval coastal vessels
  OCEAN_GOING_SHIP_SPEED: 50, // Renaissance/Early Modern ocean-going vessels
  STEAM_SHIP_SPEED: 150, // Industrial/Modern steam-powered vessels

  // Weather variability (multiply base time by these factors)
  GOOD_WEATHER: 0.8, // Good winds, favorable conditions
  BAD_WEATHER: 1.5, // Storms, contrary winds

  // Fare calculation
  BASE_FARE: 50, // Base ticket cost
  FARE_PER_STAGE: 25, // Additional cost per sequence stage
  COASTAL_MULTIPLIER: 0.5, // Coastal routes are cheaper
  OCEAN_MULTIPLIER: 1.5, // Ocean routes more expensive
  STEAM_MULTIPLIER: 2.0 // Steam ships cost more
};

// ============================================================================
// CULTURAL TRAVEL THEMING - Era & Culture-Specific Travel Modes
// ============================================================================

interface CulturalTravelTheme {
  name: string;
  icon: string;
  description: string;
  speedMultiplier?: number; // Optional speed modifier
}

type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' |
  'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

// Map culture zones and eras to specific travel modes
const CULTURAL_TRAVEL_THEMES: Record<CulturalZone, Record<HistoricalEra, CulturalTravelTheme>> = {
  EUROPEAN: {
    PREHISTORY: { name: 'Trading Party', icon: '🚶', description: 'Join a group of traders traveling on foot between settlements' },
    ANTIQUITY: { name: 'Merchant Wagon', icon: '🛒', description: 'Book passage on a Roman merchant wagon along paved roads' },
    MEDIEVAL: { name: 'Trade Caravan', icon: '🐴', description: 'Travel with a merchant caravan protected by armed guards' },
    RENAISSANCE_EARLY_MODERN: { name: 'Stagecoach Route', icon: '🎭', description: 'Secure a seat on a scheduled stagecoach service', speedMultiplier: 1.2 },
    INDUSTRIAL_ERA: { name: 'Mail Coach Service', icon: '📬', description: 'Travel aboard a swift mail coach with multiple horse changes', speedMultiplier: 1.5 },
    MODERN_ERA: { name: 'Motor Coach', icon: '🚌', description: 'Purchase a ticket for an inter-city bus route', speedMultiplier: 3.0 },
    FUTURE_ERA: { name: 'Hyperloop Pod', icon: '🚄', description: 'Reserve a seat in a high-speed vacuum tube transport', speedMultiplier: 10.0 }
  },
  EAST_ASIAN: {
    PREHISTORY: { name: 'Trading Expedition', icon: '🎒', description: 'Join traders following ancient pathways between villages' },
    ANTIQUITY: { name: 'Silk Road Caravan', icon: '🐫', description: 'Travel with a caravan along the legendary Silk Road' },
    MEDIEVAL: { name: 'Tea Horse Caravan', icon: '🍵', description: 'Join merchants trading tea for horses along mountain routes' },
    RENAISSANCE_EARLY_MODERN: { name: 'Imperial Courier Route', icon: '📜', description: 'Travel via the imperial postal relay system' },
    INDUSTRIAL_ERA: { name: 'Rickshaw Network', icon: '🛺', description: 'Arrange transport through connected rickshaw stations', speedMultiplier: 1.3 },
    MODERN_ERA: { name: 'High-Speed Rail', icon: '🚄', description: 'Board a bullet train connecting major cities', speedMultiplier: 4.0 },
    FUTURE_ERA: { name: 'Maglev Express', icon: '🚅', description: 'Travel via magnetic levitation train network', speedMultiplier: 8.0 }
  },
  MENA: {
    PREHISTORY: { name: 'Nomadic Band', icon: '🏕️', description: 'Travel with nomads moving between seasonal camps' },
    ANTIQUITY: { name: 'Desert Caravan', icon: '🐪', description: 'Join a camel caravan crossing the desert wastes' },
    MEDIEVAL: { name: 'Hajj Caravan', icon: '🌙', description: 'Travel with pilgrims on the sacred pilgrimage routes' },
    RENAISSANCE_EARLY_MODERN: { name: 'Spice Merchant Convoy', icon: '⚜️', description: 'Join merchants trading in precious spices and incense' },
    INDUSTRIAL_ERA: { name: 'Desert Railway', icon: '🚂', description: 'Ride the new railway lines crossing ancient trade routes', speedMultiplier: 2.0 },
    MODERN_ERA: { name: 'Shared Taxi Service', icon: '🚗', description: 'Share a long-distance taxi with other travelers', speedMultiplier: 3.0 },
    FUTURE_ERA: { name: 'Solar Caravan', icon: '☀️', description: 'Travel in solar-powered autonomous vehicles', speedMultiplier: 5.0 }
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    PREHISTORY: { name: 'Trading Party', icon: '🏃', description: 'Join traders following traditional pathways' },
    ANTIQUITY: { name: 'Runner Network', icon: '🏃‍♂️', description: 'Send word ahead via relay runners and follow their path' },
    MEDIEVAL: { name: 'Canoe Voyage', icon: '🛶', description: 'Travel by canoe along river and lake routes' },
    RENAISSANCE_EARLY_MODERN: { name: 'Trade Route Journey', icon: '🎪', description: 'Follow established inter-tribal trade routes' },
    INDUSTRIAL_ERA: { name: 'Wagon Trail', icon: '🐂', description: 'Travel routes now traversed by European settlers' },
    MODERN_ERA: { name: 'Reservation Bus', icon: '🚌', description: 'Use modern bus services connecting native communities' },
    FUTURE_ERA: { name: 'Autonomous Route', icon: '🚗', description: 'Self-driving vehicles on traditional pathways' }
  },
  NORTH_AMERICAN_COLONIAL: {
    PREHISTORY: { name: 'Wilderness Trail', icon: '🌲', description: 'Follow trails through the wilderness' },
    ANTIQUITY: { name: 'Colonial Road', icon: '🐴', description: 'Travel colonial roads between settlements' },
    MEDIEVAL: { name: 'Frontier Path', icon: '🏔️', description: 'Journey along frontier trading paths' },
    RENAISSANCE_EARLY_MODERN: { name: 'Wagon Train', icon: '🐂', description: 'Join a wagon train heading west across the frontier' },
    INDUSTRIAL_ERA: { name: 'Transcontinental Railroad', icon: '🚂', description: 'Ride the railroad spanning the continent', speedMultiplier: 2.5 },
    MODERN_ERA: { name: 'Greyhound Bus', icon: '🚌', description: 'Book a long-distance bus ticket', speedMultiplier: 3.5 },
    FUTURE_ERA: { name: 'Self-Driving Ride Share', icon: '🚙', description: 'Hitch a ride with an autonomous vehicle network', speedMultiplier: 4.0 }
  },
  OCEANIA: {
    PREHISTORY: { name: 'Coastal Journey', icon: '🛶', description: 'Travel by outrigger canoe along the coast' },
    ANTIQUITY: { name: 'Island Voyaging', icon: '⛵', description: 'Sail traditional voyaging canoes between islands' },
    MEDIEVAL: { name: 'Trading Fleet', icon: '⛵', description: 'Join inter-island trading expeditions' },
    RENAISSANCE_EARLY_MODERN: { name: 'Trading Proa', icon: '⛵', description: 'Sail swift outrigger vessels between islands' },
    INDUSTRIAL_ERA: { name: 'Steam Ferry', icon: '🚢', description: 'Board a steam-powered ferry service', speedMultiplier: 2.0 },
    MODERN_ERA: { name: 'Island Hopper Flight', icon: '✈️', description: 'Fly on small planes connecting remote islands', speedMultiplier: 8.0 },
    FUTURE_ERA: { name: 'Hydrofoil Express', icon: '🚤', description: 'Travel on high-speed hydrofoil vessels', speedMultiplier: 6.0 }
  },
  SOUTH_ASIAN: {
    PREHISTORY: { name: 'Trading Band', icon: '🚶', description: 'Journey with traders along ancient routes' },
    ANTIQUITY: { name: 'Bullock Cart Caravan', icon: '🐂', description: 'Travel slowly but steadily with ox-drawn carts' },
    MEDIEVAL: { name: 'Elephant Caravan', icon: '🐘', description: 'Join a prestigious elephant-borne trading expedition' },
    RENAISSANCE_EARLY_MODERN: { name: 'Merchant Caravan', icon: '🎪', description: 'Travel with merchants along established trade routes' },
    INDUSTRIAL_ERA: { name: 'Railway Carriage', icon: '🚂', description: 'Ride the expanding railway network', speedMultiplier: 2.0 },
    MODERN_ERA: { name: 'Bus & Auto-Rickshaw', icon: '🛺', description: 'Multi-modal journey by bus and three-wheeler', speedMultiplier: 2.5 },
    FUTURE_ERA: { name: 'Smart Transit Network', icon: '🚄', description: 'Integrated high-tech public transport', speedMultiplier: 5.0 }
  },
  SOUTH_AMERICAN: {
    PREHISTORY: { name: 'Mountain Trail', icon: '🏔️', description: 'Follow ancient pathways through the mountains' },
    ANTIQUITY: { name: 'Llama Caravan', icon: '🦙', description: 'Travel with llama trains carrying goods through the Andes' },
    MEDIEVAL: { name: 'Chasqui Runner Route', icon: '🏃', description: 'Follow the Inca relay runner system routes' },
    RENAISSANCE_EARLY_MODERN: { name: 'Mule Train', icon: '🐴', description: 'Join a mule train navigating mountain passes' },
    INDUSTRIAL_ERA: { name: 'Andean Railway', icon: '🚂', description: 'Ride spectacular mountain railways', speedMultiplier: 1.8 },
    MODERN_ERA: { name: 'Colectivo Bus', icon: '🚌', description: 'Shared bus service connecting distant towns', speedMultiplier: 3.0 },
    FUTURE_ERA: { name: 'Cable Transit', icon: '🚠', description: 'Advanced cable car and transit systems', speedMultiplier: 4.0 }
  },
  SUB_SAHARAN_AFRICAN: {
    PREHISTORY: { name: 'Trading Party', icon: '🚶', description: 'Travel with traders between settlements' },
    ANTIQUITY: { name: 'Savanna Caravan', icon: '🐘', description: 'Journey across grasslands with trading caravans' },
    MEDIEVAL: { name: 'Trans-Saharan Caravan', icon: '🐫', description: 'Cross vast deserts with salt and gold traders' },
    RENAISSANCE_EARLY_MODERN: { name: 'Merchant Convoy', icon: '🎪', description: 'Join merchants trading along established routes' },
    INDUSTRIAL_ERA: { name: 'Colonial Railway', icon: '🚂', description: 'Travel on newly built railway lines', speedMultiplier: 2.0 },
    MODERN_ERA: { name: 'Bush Taxi / Matatu', icon: '🚙', description: 'Shared minibus service connecting towns', speedMultiplier: 2.5 },
    FUTURE_ERA: { name: 'Solar Transport Network', icon: '☀️', description: 'Renewable energy-powered transit', speedMultiplier: 4.0 }
  }
};

/**
 * Convert year to historical era
 */
function yearToEra(year: number): HistoricalEra {
  if (year < -3000) return 'PREHISTORY';
  if (year < 500) return 'ANTIQUITY';
  if (year < 1450) return 'MEDIEVAL';
  if (year < 1800) return 'RENAISSANCE_EARLY_MODERN';
  if (year < 1900) return 'INDUSTRIAL_ERA';
  if (year < 2000) return 'MODERN_ERA';
  return 'FUTURE_ERA';
}

/**
 * Get culturally appropriate travel theme based on zone and era
 */
function getCulturalTravelTheme(zone: string, era: HistoricalEra): CulturalTravelTheme {
  const normalizedZone = zone.toUpperCase().replace(/ /g, '_') as CulturalZone;
  const themes = CULTURAL_TRAVEL_THEMES[normalizedZone];

  if (!themes) {
    // Fallback to generic caravan
    return {
      name: 'Trade Caravan',
      icon: '🐴',
      description: 'Join a merchant caravan traveling between settlements'
    };
  }

  return themes[era] || themes.MEDIEVAL; // Default to Medieval if era not found
}

const CARAVAN_CONFIG = {
  MIN_YEAR: -10000, // Caravans available throughout all eras
  DEFAULT_MAX_HOPS: 6, // Caravans can travel further than trains
  MAX_DESTINATIONS: 3, // Show up to 3 random destinations
  MILES_PER_HOP: 60, // Slower than trains, more direct than foot
  CARAVAN_SPEED_MPH: 2.5, // Walking speed with pack animals
  BASE_FARE: 15, // More expensive than trains
  FARE_PER_HOP: 8, // Higher cost per hop
  MIN_DISTANCE_HOPS: 3 // Minimum distance to qualify as a caravan route
};

// Ocean/water areas that should be skipped in land traversal
const WATER_AREAS = new Set([
  'North Sea', 'Irish Sea', 'English Channel', 'Bay of Biscay', 'Atlantic Ocean',
  'Western Mediterranean', 'Eastern Mediterranean', 'Tyrrhenian Sea', 'Adriatic Sea', 'Aegean Sea',
  'Baltic Sea', 'Black Sea', 'Caspian Sea', 'Arabian Sea', 'Red Sea', 'Persian Gulf',
  'Bay of Bengal', 'South China Sea', 'East China Sea', 'Yellow Sea', 'Sea of Japan',
  'Pacific Ocean', 'Indian Ocean', 'Caribbean Sea', 'Gulf of Mexico',
  'Bosporus Straits', 'Strait of Gibraltar', 'Strait of Malacca', 'Bering Strait',
  'Thames Estuary', 'Rhine-Meuse Delta', 'Øresund Strait'
]);

// ============================================================================
// CORE PATHFINDING - BFS LAND TRAVERSAL
// ============================================================================

/**
 * Find all map areas reachable via land adjacencies (no liminal crossings)
 * Uses breadth-first search to ensure shortest paths
 */
function findAdjacentLandAreas(startArea: string, maxHops: number): ReachableArea[] {
  const visited = new Set<string>();
  const reachable: ReachableArea[] = [];
  const queue: ReachableArea[] = [{
    areaName: startArea,
    hops: 0,
    path: [startArea]
  }];

  visited.add(startArea);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Don't expand beyond max hops
    if (current.hops >= maxHops) {
      continue;
    }

    // Get adjacencies for current area
    const adjacencies = ADJACENCIES[current.areaName];
    if (!adjacencies) {
      console.warn(`[CrossMapTravel] No adjacencies found for: ${current.areaName}`);
      continue;
    }

    // Check all four directions
    const directions: Array<'N' | 'S' | 'E' | 'W'> = ['N', 'S', 'E', 'W'];
    for (const dir of directions) {
      const neighborName = adjacencies[dir];
      if (!neighborName) continue;

      // Skip if already visited
      if (visited.has(neighborName)) continue;

      // Skip liminal crossings (Phase 1 only does land travel)
      if (neighborName.startsWith('LIMINAL_')) {
        continue;
      }

      // Skip pure water areas (oceans, seas)
      if (WATER_AREAS.has(neighborName)) {
        continue;
      }

      // Add to visited and queue
      visited.add(neighborName);
      const neighborArea: ReachableArea = {
        areaName: neighborName,
        hops: current.hops + 1,
        path: [...current.path, neighborName]
      };

      reachable.push(neighborArea);
      queue.push(neighborArea);
    }
  }

  console.log(`[CrossMapTravel] Found ${reachable.length} reachable land areas from ${startArea} within ${maxHops} hops`);
  return reachable;
}

// ============================================================================
// CITY FILTERING & LOOKUP
// ============================================================================

/**
 * Get all cities in a map area that exist in the given year
 */
function getCitiesInArea(mapAreaName: string, currentYear: number): CityDefinition[] {
  const citiesInArea = CITIES_DATA[mapAreaName] || [];

  return citiesInArea.filter(city => {
    // City must be founded by current year
    if (city.foundingYear > currentYear) {
      return false;
    }

    // City must not be declined/abandoned
    if (city.declineYear && city.declineYear <= currentYear) {
      return false;
    }

    return true;
  });
}

/**
 * Check if railroads are available in the given year/era
 */
function hasRailroadInEra(year: number, era: HistoricalEra): boolean {
  // Railroads only available from Industrial Era onwards (1830+)
  if (year < RAILROAD_CONFIG.MIN_YEAR) {
    return false;
  }

  const railroadEras = [
    HistoricalEra.INDUSTRIAL_ERA,
    HistoricalEra.MODERN_ERA,
    HistoricalEra.FUTURE_ERA
  ];

  return railroadEras.includes(era);
}

/**
 * Determine required ship technology based on year and era
 */
function getAvailableShipTechnology(year: number, era: HistoricalEra): 'coastal' | 'ocean-going' | 'steam-powered' {
  // Steam-powered ships (1850+, Industrial Era onwards)
  if (year >= 1850 && (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA)) {
    return 'steam-powered';
  }

  // Ocean-going vessels (1450+, Renaissance onwards)
  if (year >= 1450 && (era === HistoricalEra.RENAISSANCE_EARLY_MODERN || era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA)) {
    return 'ocean-going';
  }

  // Coastal vessels (all eras)
  return 'coastal';
}

/**
 * Check if a liminal route is accessible with available ship technology
 */
function canAccessLiminalRoute(
  sequenceLength: number,
  shipTech: 'coastal' | 'ocean-going' | 'steam-powered'
): boolean {
  // Coastal ships: Only short crossings (≤3 stages)
  if (shipTech === 'coastal') {
    return sequenceLength <= 3;
  }

  // Ocean-going ships: Medium to long crossings (≤6 stages)
  if (shipTech === 'ocean-going') {
    return sequenceLength <= 6;
  }

  // Steam-powered ships: Any distance
  return true;
}

/**
 * Calculate danger level based on route length and era
 */
function calculateDangerLevel(
  sequenceLength: number,
  shipTech: 'coastal' | 'ocean-going' | 'steam-powered'
): 'low' | 'moderate' | 'high' | 'extreme' {
  // Shorter routes and better technology = safer
  if (shipTech === 'steam-powered') {
    if (sequenceLength <= 3) return 'low';
    if (sequenceLength <= 5) return 'moderate';
    return 'high';
  }

  if (shipTech === 'ocean-going') {
    if (sequenceLength <= 3) return 'moderate';
    if (sequenceLength <= 5) return 'high';
    return 'extreme';
  }

  // Coastal ships
  if (sequenceLength <= 2) return 'moderate';
  if (sequenceLength <= 3) return 'high';
  return 'extreme';
}

// ============================================================================
// DISTANCE & COST CALCULATION
// ============================================================================

/**
 * Calculate journey details for a railroad trip
 */
function calculateRailroadJourney(
  city: CityDefinition,
  reachableArea: ReachableArea
): Omit<TravelDestination, 'cityName' | 'mapAreaName'> {
  const distanceInMiles = reachableArea.hops * RAILROAD_CONFIG.MILES_PER_HOP;
  const travelTimeHours = Math.ceil(distanceInMiles / RAILROAD_CONFIG.TRAIN_SPEED_MPH);
  const fare = RAILROAD_CONFIG.BASE_FARE + (reachableArea.hops * RAILROAD_CONFIG.FARE_PER_HOP);

  // Create route description (skip first element since it's the starting area)
  const routeDescription = reachableArea.path.length > 2
    ? `via ${reachableArea.path.slice(1, -1).join(', ')}`
    : undefined;

  return {
    distance: distanceInMiles,
    distanceInHops: reachableArea.hops,
    travelTime: travelTimeHours,
    fare,
    travelMode: TravelMode.RAILROAD,
    routePath: reachableArea.path,
    routeDescription
  };
}

/**
 * Calculate journey details for a land voyage (caravan, wagon, etc.)
 */
function calculateLandVoyage(
  hops: number,
  path: string[],
  milesPerHop: number,
  speedMph: number,
  baseFare: number,
  farePerHop: number
): Omit<TravelDestination, 'cityName' | 'mapAreaName' | 'travelMode' | 'culturalTravelName' | 'culturalIcon' | 'culturalDescription'> {
  const distanceInMiles = hops * milesPerHop;
  const travelTimeHours = Math.ceil(distanceInMiles / speedMph);
  const fare = baseFare + (hops * farePerHop);

  // Create route description (skip first element since it's the starting area)
  const routeDescription = path.length > 2
    ? `via ${path.slice(1, -1).join(', ')}`
    : undefined;

  return {
    distance: distanceInMiles,
    distanceInHops: hops,
    travelTime: travelTimeHours,
    fare,
    routePath: path,
    routeDescription
  };
}

/**
 * Calculate journey details for an ocean voyage
 */
function calculateOceanVoyage(
  liminalKey: string,
  liminalSequence: LiminalSequence,
  shipTech: 'coastal' | 'ocean-going' | 'steam-powered'
): Omit<TravelDestination, 'cityName' | 'mapAreaName'> {
  const sequenceLength = liminalSequence.sequence.length;
  const distanceInMiles = sequenceLength * HARBOR_CONFIG.MILES_PER_STAGE;

  // Calculate base speed based on ship technology
  let speedMilesPerDay: number;
  let fareMultiplier = 1.0;

  if (shipTech === 'steam-powered') {
    speedMilesPerDay = HARBOR_CONFIG.STEAM_SHIP_SPEED;
    fareMultiplier = HARBOR_CONFIG.STEAM_MULTIPLIER;
  } else if (shipTech === 'ocean-going') {
    speedMilesPerDay = HARBOR_CONFIG.OCEAN_GOING_SHIP_SPEED;
    fareMultiplier = HARBOR_CONFIG.OCEAN_MULTIPLIER;
  } else {
    speedMilesPerDay = HARBOR_CONFIG.COASTAL_SHIP_SPEED;
    fareMultiplier = HARBOR_CONFIG.COASTAL_MULTIPLIER;
  }

  // Calculate travel time in days
  const baseTravelDays = distanceInMiles / speedMilesPerDay;

  // Weather variability
  const minTravelHours = Math.ceil(baseTravelDays * HARBOR_CONFIG.GOOD_WEATHER * 24);
  const maxTravelHours = Math.ceil(baseTravelDays * HARBOR_CONFIG.BAD_WEATHER * 24);
  const avgTravelHours = Math.ceil(baseTravelDays * 24);

  // Calculate fare
  const baseFare = HARBOR_CONFIG.BASE_FARE + (sequenceLength * HARBOR_CONFIG.FARE_PER_STAGE);
  const fare = Math.ceil(baseFare * fareMultiplier);

  // Danger level
  const dangerLevel = calculateDangerLevel(sequenceLength, shipTech);

  // Route description
  const routeDescription = `Ocean voyage (${sequenceLength} stages)`;

  return {
    distance: distanceInMiles,
    distanceInHops: sequenceLength,
    travelTime: avgTravelHours,
    travelTimeMin: minTravelHours,
    travelTimeMax: maxTravelHours,
    fare,
    travelMode: TravelMode.SHIP,
    liminalSequenceKey: liminalKey,
    liminalSequence: liminalSequence.sequence.map(arch => String(arch)),
    shipTypeRequired: shipTech,
    dangerLevel,
    routeDescription
  };
}

// ============================================================================
// PHASE 1: RAILROAD DESTINATIONS
// ============================================================================

/**
 * Get all railroad destinations reachable from current map area
 * Phase 1: Land adjacencies only, no ocean crossings
 */
export function getRailroadDestinations(
  currentMapArea: string,
  options: TravelOptions
): TravelDestination[] {
  const maxHops = options.maxHops || RAILROAD_CONFIG.DEFAULT_MAX_HOPS;

  // Check if railroads exist in this era
  if (!hasRailroadInEra(options.currentYear, options.currentEra)) {
    console.log(`[CrossMapTravel] Railroads not available in year ${options.currentYear}`);
    return [];
  }

  // Find all reachable land areas
  const reachableAreas = findAdjacentLandAreas(currentMapArea, maxHops);

  // Get cities in each reachable area
  const destinations: TravelDestination[] = [];

  for (const area of reachableAreas) {
    const cities = getCitiesInArea(area.areaName, options.currentYear);

    for (const city of cities) {
      const journeyDetails = calculateRailroadJourney(city, area);

      // Filter by player wealth if provided
      if (options.playerWealth !== undefined && journeyDetails.fare > options.playerWealth) {
        continue;
      }

      destinations.push({
        mapAreaName: area.areaName,
        cityName: city.name,
        ...journeyDetails
      });
    }
  }

  console.log(`[CrossMapTravel] Found ${destinations.length} railroad destinations from ${currentMapArea}`);
  return destinations;
}

// ============================================================================
// PHASE 2: HARBOR DESTINATIONS
// ============================================================================

/**
 * Get all harbor/ship destinations reachable via liminal crossings
 * Phase 2: Implements liminal sequence traversal for ocean voyages
 */
export function getHarborDestinations(
  currentMapArea: string,
  options: TravelOptions
): TravelDestination[] {
  // Determine available ship technology
  const shipTech = getAvailableShipTechnology(options.currentYear, options.currentEra);

  console.log(`[CrossMapTravel] Finding harbor destinations from ${currentMapArea} with ${shipTech} technology`);

  // Get adjacencies for current area
  const adjacencies = ADJACENCIES[currentMapArea];
  if (!adjacencies) {
    console.warn(`[CrossMapTravel] No adjacencies found for: ${currentMapArea}`);
    return [];
  }

  const destinations: TravelDestination[] = [];

  // Check all four directions for liminal crossings
  const directions: Array<'N' | 'S' | 'E' | 'W'> = ['N', 'S', 'E', 'W'];

  for (const dir of directions) {
    const adjacentKey = adjacencies[dir];
    if (!adjacentKey) continue;

    // Only process liminal crossings
    if (!adjacentKey.startsWith('LIMINAL_')) {
      continue;
    }

    // Look up the liminal sequence
    const liminalSequence = LIMINAL_SEQUENCES[adjacentKey];
    if (!liminalSequence) {
      console.warn(`[CrossMapTravel] No liminal sequence found for: ${adjacentKey}`);
      continue;
    }

    const sequenceLength = liminalSequence.sequence.length;

    // Check if player's ship technology can handle this route
    if (!canAccessLiminalRoute(sequenceLength, shipTech)) {
      console.log(`[CrossMapTravel] Route ${adjacentKey} requires better ship technology (length: ${sequenceLength}, tech: ${shipTech})`);
      continue;
    }

    // Get the destination map area
    const destinationArea = liminalSequence.destination;

    // Get cities in the destination area
    const cities = getCitiesInArea(destinationArea, options.currentYear);

    if (cities.length === 0) {
      console.log(`[CrossMapTravel] No cities found in destination area: ${destinationArea}`);
      continue;
    }

    // Calculate voyage details
    const voyageDetails = calculateOceanVoyage(adjacentKey, liminalSequence, shipTech);

    // Create destinations for each city
    for (const city of cities) {
      // Filter by player wealth if provided
      if (options.playerWealth !== undefined && voyageDetails.fare > options.playerWealth) {
        continue;
      }

      destinations.push({
        mapAreaName: destinationArea,
        cityName: city.name,
        ...voyageDetails
      });
    }
  }

  console.log(`[CrossMapTravel] Found ${destinations.length} harbor destinations from ${currentMapArea}`);
  return destinations;
}

// ============================================================================
// PHASE 3: CARAVAN DESTINATIONS
// ============================================================================

/**
 * Get random caravan trade route destinations (up to 3)
 * Available in all eras, uses land adjacencies
 */
export function getCaravanDestinations(
  currentMapArea: string,
  options: TravelOptions
): TravelDestination[] {
  console.log(`[CrossMapTravel] Finding caravan destinations from ${currentMapArea}`);

  // Get all reachable areas via land (same as railroad logic)
  const maxHops = options.maxHops || CARAVAN_CONFIG.DEFAULT_MAX_HOPS;
  const reachableAreas = findAdjacentLandAreas(currentMapArea, maxHops);

  // Filter for distant destinations only (at least MIN_DISTANCE_HOPS away)
  const distantAreas = reachableAreas.filter(
    area => area.hops >= CARAVAN_CONFIG.MIN_DISTANCE_HOPS
  );

  if (distantAreas.length === 0) {
    console.log(`[CrossMapTravel] No distant areas found for caravan routes`);
    return [];
  }

  // Shuffle and take up to MAX_DESTINATIONS random areas
  const shuffled = distantAreas.sort(() => Math.random() - 0.5);
  const selectedAreas = shuffled.slice(0, CARAVAN_CONFIG.MAX_DESTINATIONS);

  const destinations: TravelDestination[] = [];

  for (const area of selectedAreas) {
    // Get cities in this area
    const cities = getCitiesInArea(area.areaName, options.currentYear);

    if (cities.length === 0) {
      continue;
    }

    // Pick a random city
    const city = cities[Math.floor(Math.random() * cities.length)];

    // Determine cultural zone and era for theming
    const culturalZone = mapLocationToCulture(area.areaName, options.currentYear || 1400);
    const era = yearToEra(options.currentYear || 1400);
    const culturalTheme = getCulturalTravelTheme(culturalZone, era);

    // Calculate journey details
    const baseSpeed = CARAVAN_CONFIG.CARAVAN_SPEED_MPH;
    const adjustedSpeed = baseSpeed * (culturalTheme.speedMultiplier || 1.0);

    const voyageDetails = calculateLandVoyage(
      area.hops,
      area.path,
      CARAVAN_CONFIG.MILES_PER_HOP,
      adjustedSpeed,
      CARAVAN_CONFIG.BASE_FARE,
      CARAVAN_CONFIG.FARE_PER_HOP
    );

    // Filter by wealth if provided
    if (options.playerWealth !== undefined && voyageDetails.fare > options.playerWealth) {
      continue;
    }

    destinations.push({
      mapAreaName: area.areaName,
      cityName: city.name,
      ...voyageDetails,
      travelMode: TravelMode.CARAVAN,
      culturalTravelName: culturalTheme.name,
      culturalIcon: culturalTheme.icon,
      culturalDescription: culturalTheme.description
    });
  }

  console.log(`[CrossMapTravel] Found ${destinations.length} caravan destinations from ${currentMapArea}`);
  return destinations;
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Get all available destinations from current map area
 * Routes to appropriate service based on travel mode
 */
export function getAvailableDestinations(
  currentMapArea: string,
  options: TravelOptions
): TravelDestination[] {
  if (!currentMapArea) {
    console.warn('[CrossMapTravel] No current map area provided');
    return [];
  }

  if (options.mode === TravelMode.RAILROAD) {
    return getRailroadDestinations(currentMapArea, options);
  } else if (options.mode === TravelMode.SHIP) {
    return getHarborDestinations(currentMapArea, options);
  } else if (options.mode === TravelMode.CARAVAN) {
    return getCaravanDestinations(currentMapArea, options);
  }

  console.warn(`[CrossMapTravel] Unknown travel mode: ${options.mode}`);
  return [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get readable description for a travel destination
 */
export function getDestinationDescription(destination: TravelDestination): string {
  const { cityName, distance, travelTime, fare, routeDescription } = destination;

  let desc = `${cityName} - ${distance} miles, ${travelTime} hours, ${fare} coins`;
  if (routeDescription) {
    desc += ` (${routeDescription})`;
  }

  return desc;
}

/**
 * Check if a map area has railroad stations (for UI purposes)
 */
export function mapAreaHasRailroad(mapAreaName: string, year: number, era: HistoricalEra): boolean {
  if (!hasRailroadInEra(year, era)) {
    return false;
  }

  // Check if area has cities
  const cities = getCitiesInArea(mapAreaName, year);
  return cities.length > 0;
}
