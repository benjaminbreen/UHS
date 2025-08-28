/**
 * types/structures.ts - Defines the core data structures for terrain structures.
 */

// An enumeration of all possible structure types.
export type TerrainStructureType = 
    'fortress' | 'mill' | 'mining_colony' | 'lumber_camp' | 
    'fishing_hut' | 'farm' | 'marketplace' | 'factory' | 
    'government_district' | 'city_center' |
    'encampment' | 'quarry' | 'holy_site' | 'palace' | 'ruin' | 'bridge';

// The economic role a structure plays in the simulation.
export type EconomicRole = 'extraction' | 'processing' | 'defensive' | 'commerce' | 'subsistence';

// Defines the allegiance of a structure, for future conflict/faction systems.
export type Allegiance = string;

// The current operational state of a structure.
export type StructureState = 'active' | 'ruined' | 'under_construction';

/**
 * Represents a significant, procedurally placed structure on the map.
 * These are the engines of the game world, driving economy, conflict, and NPC behavior.
 */
export interface TerrainStructure {
  id: string;
  structureType: TerrainStructureType;
  name: string; // The specific name, e.g., "Westmarch Keep"
  location: [number, number]; // [x, y] coordinates of the structure's main tile
  economicRole: EconomicRole;
  npcAnchor: string; // Profession type it attracts, e.g., "soldier", "miner"
  allegianceGroup?: Allegiance;
  state: StructureState;
  cropType?: string; // For Farm structures
  fortressType?: string; // For Fortress structures - specific variant type

  // --- Linked Data ---
  // For Mining Colonies
  mineralDeposits?: { [metal: string]: number; }; // e.g., { IRON: 15000, COPPER: 8000 }
  
  // For Processing Structures
  inputGoods?: string[];  // e.g., ['GRAIN'] for a Mill
  outputGoods?: string[]; // e.g., ['FLOUR'] for a Mill

  // NEW: For Palaces/Fortresses to accumulate wealth
  treasury?: Record<string, number>;

  // NEW: For procedural descriptions
  constructionYear?: number;
  dimensions?: {
    height: number;
    width?: number;
    depth?: number;
    terraces?: number;
  };
  
  // For factory subtypes
  factorySubtype?: string;
  factorySymbolType?: 'plantation' | 'warehouse' | 'manufactory' | 'mill' | 'refinery' | 'factory19th' | 'factory20th';
  
  // For ruins - culture and era specific rendering
  culturalZone?: string;
  era?: string;
  
  // For bridges and other custom structures
  customData?: any;
}
