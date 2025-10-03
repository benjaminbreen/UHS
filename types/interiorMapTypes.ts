/**
 * types/interiorMapTypes.ts - Type definitions for the Interior Map view.
 */
import { Point } from './core/geometry';
import { Tile } from './core/tile';
import { MapData } from './core/map';

export interface InteriorTileQualities {
    flammability: number; // 0-1, How likely to burn
    cleanliness: number;  // 0-1, 1 is pristine, 0 is filthy
    value: number;        // 0-1, Represents material/intrinsic value
}

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  purpose: 'living' | 'bedroom' | 'kitchen' | 'storage' | 'hallway' | 'special' | 
           'tavern_main' | 'private_chamber' | 'throne_room' | 'great_hall' | 'guard_room' |
           // Religious rooms
           'sanctuary' | 'nave' | 'vestry' | 'crypt' | 'bell_tower' |
           'prayer_hall' | 'mihrab' | 'minaret' | 'ablution' | 'library' |
           'ark_room' | 'study' | 'mikvah' |
           'meditation_hall' | 'shrine_room' | 'living_quarters' |
           'sanctum' | 'mandapa' |
           'worship_hall' | 'offering_hall' | 'purification' |
           'sacred_chamber' | 'ritual_room' | 'offering_room';
}

export interface InteriorTile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door';
  material: 'wood' | 'stone' | 'dirt' | 'metal' | 'fabric';
  texture: string; // e.g., 'wood_plank', 'stone_tile', 'dirt'
  isWalkable: boolean;
  color: string;
  isOccupiedBy?: string; // ID of the entity occupying this tile
  qualities: InteriorTileQualities; // NEW: Richer tile data
}

export type FurnitureQuality = 'humble' | 'standard' | 'lavish';
export type FurnitureSubType = 'bed' | 'table' | 'chair' | 'desk' | 'kitchen_hearth' | 'sewing_machine' | 'fireplace' | 'bookshelf' | 'barrel' | 'bar_counter' | 'stool' | 'rug' | 'cabinet' | 'window' | 'chest' | 'throne' | 'armor_stand' | 'tapestry' | 'grand_table' | 'staircase' | 'ruin_entrance' | 'altar' | 'torii_gate' | 'well' | 'lantern_post' | 'electric_lamp_post' | 'fountain' | 'market_stall' | 'scarecrow';


export interface InteriorEntity {
  id: string;
  type: 'furniture' | 'decor' | 'structure' | 'feature';
  subType: FurnitureSubType;
  x: number; // pixel x
  y: number; // pixel y
  width: number;
  height: number;
  rotation?: number;
  isInteractable?: boolean;
  contents?: any[]; // Can hold Item objects including PrimarySourceTexts
  quality?: FurnitureQuality;
  description?: string;
  // NEW: Staircase properties
  targetFloor?: number;
  direction?: 'up' | 'down';
}

export interface InteriorPlayerData {
  x: number; // grid x
  y: number; // grid y
  emoji: string;
}

export interface InteriorGenerationConfig {
    buildingType: string;
    contextTile: Tile; // The standard map tile we're entering from
    standardMapContext: MapData;
    date: string;
    location: string;
    floor: number;
    totalFloors: number;
    buildingId: string;
}

export interface InteriorMapData {
  width: number;
  height: number;
  description: string;
  tiles: InteriorTile[][];
  rooms: Room[];
  entities: InteriorEntity[];
  player: InteriorPlayerData;
  entrance?: Point;
  buildingType: string;
  // NEW: Floor context
  floor: number;
  buildingId: string;
  totalFloors: number;
  // NEW: NPCs in interior
  npcs?: any[]; // NpcEntity[]
  restrictions?: any[]; // RoomRestriction[]
}