
import { Tile, MapArchetype, ClimateType, BiomeType, TileQualities, Point, InteriorMapData } from './index'; // Assuming other types are in the main index

export enum HistoricalEra {
  PREHISTORY = 'PREHISTORY',
  ANTIQUITY = 'ANTIQUITY',
  MEDIEVAL = 'MEDIEVAL',
  RENAISSANCE_EARLY_MODERN = 'RENAISSANCE_EARLY_MODERN',
  INDUSTRIAL_ERA = 'INDUSTRIAL_ERA',
  MODERN_ERA = 'MODERN_ERA',
  FUTURE_ERA = 'FUTURE_ERA',
}

export type TimeOfDay = 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night';

export interface VisibleLandInfo {
  biome: BiomeType;
  direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  distance: number; // Tiles
}

export interface AmbianceContext {
  currentTile: Tile;
  neighboringTiles: Tile[]; // Tiles immediately adjacent (8 directions)
  mapArchetype: MapArchetype;
  climate: ClimateType;
  timeOfDay: TimeOfDay;
  historicalEra: HistoricalEra;
  century: number;
  decade?: number;
  locationString: string; // User-provided location context
  mapSeed: number; // For seeded randomness in fragment selection
  gameHour: number; // For hourly updates and potentially time-specific sub-fragments
  visibleLandDirection: VisibleLandInfo | null; // Added for contextual land descriptions
  
  // New interior context
  interiorMapData?: InteriorMapData;
  interiorPlayerPos?: Point;
}

// For structuring the constant fragment files
export type AmbianceTextFragmentCategory = {
  [key: string]: string[] | Partial<Record<TimeOfDayLowercase, string[]>>;
};
type TimeOfDayLowercase = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night' | 'general';