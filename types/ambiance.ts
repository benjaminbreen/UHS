
import { Tile, TileQualities } from './core/tile';
import { MapArchetype } from './core/map';
import { Point } from './core/geometry';
import { ClimateType } from './biomes/climate';
import { BiomeType } from './biomes/base';
import { InteriorMapData } from './interiorMapTypes';

// Re-export HistoricalEra from enums.ts (zero-dependency file)
export { HistoricalEra } from './enums';

export type TimeOfDay = 'Predawn' | 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Late Afternoon' | 'Golden Hour' | 'Dusk' | 'Late Twilight' | 'Early Evening' | 'Night';

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