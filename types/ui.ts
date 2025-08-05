/**
 * types/ui.ts - UI-specific type definitions
 */
import { Tile, NpcEntity, Item, TerrainStructure } from './index';

export type AltitudeSetting = 'standard' | 'high' | 'low';
export type ViewMode = 'standard' | 'detail' | 'interior';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type LensMode = 'none' | 'flammability' | 'biodiversity' | 'healthiness' | 'sacrality' | 'safety' | 'minerals';

export interface NarrationMessage {
  sender: 'player' | 'narrator' | 'narrator-special';
  text: string;
}

export interface EconomyModalData {
    tile: Tile;
}

export interface LootModalData {
    opponent: NpcEntity;
    items: Item[];
}

export type ActionableTileType = 'farm' | 'city' | 'marketplace' | 'building' | 'explore' | 'mine';

export interface ActionableTile {
    type: ActionableTileType;
    tile: Tile;
    structure?: TerrainStructure;
}

export interface UIContext {
    activePoi: TerrainStructure | null;
}