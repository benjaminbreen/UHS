/**
 * types/societal.ts - Defines types for the historical/cultural generation parameters.
 */
import { CulturalZone } from './characterData';
import { TerrainStructureType } from './structures';

/**
 * Defines the user-configurable parameters for generating a new map.
 */
export interface MapGenerationParams {
    isAgricultural?: boolean;
    isPastoral?: boolean;
    economicActivityLevel?: number; // e.g., 0 (none) to 4 (very high)
}

/**
 * NEW: Defines a group within a faction's sphere of influence
 */
export interface AllegianceGroup {
    name: string;
    type: 'primary' | 'secondary' | 'rebel' | 'mercenary' | 'religious' | 'trade_company';
    description: string;
}


/**
 * NEW: Defines faction data for a specific era and region
 */
export interface FactionData {
    dominantPower: string;
    dominantPowerDescription: string;
    allegianceGroups: AllegianceGroup[]; // Replaces secondaryPowers
    structureNames?: Partial<Record<TerrainStructureType, string[]>>; // Changed to string[]
    courtRoles?: Partial<Record<TerrainStructureType, string[]>>; // NEW: For "Living Courts"
    eraContextSentence: string;
    mapAreaOverrides?: { [mapAreaName: string]: Partial<FactionData> };
}

// NEW: Database structures for FactionData
export type EraFactionMap = { [eraKey: string]: FactionData };
export type RegionFactionMap = { [regionName: string]: EraFactionMap };
export type FactionDatabase = Partial<Record<CulturalZone, RegionFactionMap>>;


/**
 * A data structure that defines the technological, economic, and cultural
 * characteristics of a society for a given cultural zone and historical era.
 * This is the core of the historically-aware generation system.
 */
export interface SocietalProfile {
  isAgricultural: boolean;
  isPastoral: boolean;
  allowedStructures: TerrainStructureType[];
  allowedMineTypes: string[]; // Array of metal IDs from constants/metals.ts
  fortressNames: string[]; // Culturally appropriate names for 'fortress' structures
  holyPlaceNames: string[]; // Culturally appropriate names for 'holy_site' structures
  palaceNames: string[];
  ruinNames: string[];

  // Economic tie-ins for holy places
  holyPlaceConsumes?: string[]; // Item IDs
  holyPlaceProduces?: string[]; // Item IDs
  courtRoles?: Partial<Record<TerrainStructureType, string[]>>;

  // Region-specific overrides for within same cultural zone (e.g., Australian Outback vs Polynesian islands)
  regionOverrides?: Record<string, Partial<SocietalProfile>>;
}