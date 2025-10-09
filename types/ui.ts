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

export type ActionableTileType = 'farm' | 'city' | 'marketplace' | 'building' | 'explore' | 'mine' | 'fishing_hut' | 'ruin' | 'railroad_station' | 'harbor_district';

export interface ActionableTile {
    type: ActionableTileType;
    tile: Tile;
    structure?: TerrainStructure;
}

export interface UIContext {
    activePoi: TerrainStructure | null;
    poiToastData: {
        structure: TerrainStructure;
        description: string;
        dialogue: any;
    } | null;
}