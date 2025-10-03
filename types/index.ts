/**
 * types/index.ts - Main entry point for core map generation type definitions
 */

export * from './enums'; // Export enums first (zero dependencies)
export * from './core/tile';
export * from './core/map';
export * from './core/geometry';
export * from './biomes/base';
export * from './biomes/climate';
export * from './ambiance';
export * from './interiorMapTypes';
export * from './animalTypes';
export * from './skillTypes';
export * from './itemTypes';
export * from './npcTypes';
export * from './playerCharacter';
export * from './ui';
export * from './vegetationTypes';
export * from './characterData'; // NEW: Export character data
export * from './geography'; // NEW: Export geography types
export * from './structures'; // NEW: Export structure types
export * from './metals'; // NEW: Export metal types
export * from './combat'; // NEW: Export combat types
export * from './journal'; // NEW: Export journal types
export * from './knowledge'; // NEW: Export beliefs and technology types
export * from './societal'; // NEW: Export societal profiles
export * from './goals'; // NEW: Export goal types
export * from './diseaseTypes'; // NEW: Export disease types
export * from './vesselTypes'; // NEW: Export vessel types
export * from './regionalHistory'; // NEW: Export regional history types

// Removed export of deleted SimplifiedArchetype - now using SpecialMapArchetype

import { Tile } from './core/tile';
import { InteriorTile, InteriorEntity } from './interiorMapTypes';
import { AnimalEntity } from './animalTypes';
import { Item } from './itemTypes';
import { NpcEntity } from './npcTypes';
import { VegetationEntity } from './vegetationTypes';
import { DeployedVessel } from './vesselTypes';
import { TerrainStructure } from './structures';
import { ViewMode, Season, LensMode } from './ui'; 
import { PartyMember, GameEvent, PlayerCharacter } from './playerCharacter';
import { EncounterableEntity } from './combat';
import { PrimarySource } from './journal';

export type { ViewMode, PartyMember, GameEvent, Season, LensMode, TerrainStructure, PrimarySource };

// NEW: Universal Dev Tooltip Types
export type AnyTile = Tile | InteriorTile;
export type AnyEntity = InteriorEntity | AnimalEntity | NpcEntity | VegetationEntity | DeployedVessel;

export type NpcModalData = EncounterableEntity | null;

export interface LootModalData {
    opponent: NpcEntity;
    items: Item[];
}

export interface PortraitModalData {
    character: PlayerCharacter | NpcEntity;
}

export interface CraftingModalData {
    items: Item[];
    method: 'COMBINE' | 'DISAGGREGATE';
}

// NEW: Type Guards
export const isAnimal = (entity: EncounterableEntity | null | undefined): entity is AnimalEntity => {
    return !!entity && 'speciesName' in entity;
};
export const isNpc = (entity: EncounterableEntity | null | undefined): entity is NpcEntity => {
    return !!entity && 'role' in entity;
};
export const isStandardTile = (tile: AnyTile): tile is Tile => 'isLand' in tile;


export interface DevTooltipDisplayData {
    viewMode: ViewMode;
    tile: AnyTile;
    entity?: AnyEntity | null;
    animal?: AnimalEntity | null;
    vegetation?: VegetationEntity | null;
    structure?: TerrainStructure | null;
    mapContext?: {
        climate: import('./biomes/climate').ClimateType;
        archetype: import('./core/map').MapArchetype;
        tiles: Tile[][];
    } | null;
    componentInfo?: {
        fileName?: string;
        symbolName?: string;
        variant?: string;
    } | null;
}


// NEW: State management for multi-floor interiors
export interface InteriorViewState {
    buildingId: string;
    currentFloor: number;
    discoveredFloors: Set<number>;
    maps: Map<number, import('./interiorMapTypes').InteriorMapData>; // Cache for floors of a building
}

// UPDATED: Type for the modal that displays item contents
export interface InteractionModalData {
    title: string;
    entityId: string;
    items: Item[] | null;
    isLoading: boolean;
}

// NEW: Type for the Tile Information Modal props
export interface TileInfoModalProps {
    data: DevTooltipDisplayData;
    parentTile: Tile | null;
}
  
// NEW: For map analysis summary
export interface MapAnalysisData {
  biomeCount: number;
  urbanTileCount: number;
  specialFeatureCount: number;
}

// NEW: Combat Log Message Type
export interface CombatLogMessage {
    id: string;
    message: string;
    actor: 'player' | 'opponent' | 'system';
    round: number;
}

// NEW: Dialogue Entry Type for Encounter Modal
export interface DialogueEntry {
    speaker: 'player' | 'npc' | 'system';
    text: string;
    timestamp: Date;
    typed?: boolean;
    translations?: Record<string, string>; // Foreign word translations: { "manoomin": "wild rice" }
    language?: string; // Native language name (e.g., "Proto-Algonquian")
}


// NEW: Player Stats Type for combat calculations
export interface PlayerStats {
    attack: number;
    defense: number;
    luck: number;
}

// NEW: Type for Dynamic Lighting
export interface SunPosition {
    dx: number;
    dy: number;
    blur: number;
    opacity: number;
    ambientColor: string;
    ambientOpacity: number;
}

// NEW: For Farm Modal
export interface FarmDetails {
    farmName: string;
    farmerName: string;
    farmerAge: number;
    farmDescription: string;
    economicStatus: string; // e.g., "humble", "prosperous"
}

// NEW: Game Date structure
export interface GameDate {
    year: number;
    month: number;
    day: number;
}
