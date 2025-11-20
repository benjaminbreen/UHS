/**
 * Shared types and interfaces for Farm Panel components
 * Extracted from FarmPanelImproved.tsx (Phase 1 of refactoring)
 */

import {
  Tile,
  MapData,
  PlayerCharacter,
  Item,
  Season,
  NpcEntity,
  TimeOfDay,
  HistoricalEra,
  DialogueEntry,
  CulturalZone,
} from '../../types';
import { FarmState, FarmFamilyMember } from '../../services/farmService';

// ============================================================================
// CORE PANEL PROPS
// ============================================================================

export interface FarmPanelProps {
  tile: Tile;
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  npcs: NpcEntity[];
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  season: Season;
  gameTimeHours: number;
  onProgressTime?: (months: number) => void;
  onTimeAdvance?: (hours: number) => void;
  onShowEvent?: (event: any) => void;
  currentGameDay: number;
  useLlm?: boolean;
  gameDate: any;
  onInitiateEncounter?: (target: any) => void;
  onPlayerStateChange?: (changes: PlayerStateChanges) => void;
}

export interface PlayerStateChanges {
  health?: number;
  fatigue?: number;
  currency?: number; // Coins earned or spent
  statusEffects?: Array<{
    type: string;
    name: string;
    duration: number;
    severity?: 'mild' | 'moderate' | 'severe';
  }>;
  inventory?: { add?: Item[]; remove?: string[] };
}

// ============================================================================
// TAB TYPES
// ============================================================================

export type TabType = 'overview' | 'fields' | 'work' | 'household' | 'trade' | 'advisor';

// ============================================================================
// FARM CONTEXT VALUE
// ============================================================================

export interface FarmContextValue {
  farmState: FarmState | null;
  setFarmState: (state: FarmState | null) => void;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  year: number;
  season: Season;
  timeOfDay: TimeOfDay;
  currentFarmTime: number;
  setCurrentFarmTime: (time: number) => void;
  headFarmer: FarmFamilyMember | null;
  primaryCrop: string;
  dynamicFarmName: string;
  validCrops: string[];
  harvestLedger: Record<string, number>;
  addHarvestToLedger: (crop: string, qty: number) => void;
  persistFields: (fields: FarmState['fields']) => void;
}

// ============================================================================
// FIELD PLANNING & RESOURCES
// ============================================================================

export interface FieldPlan {
  action: 'plant' | 'water' | 'harvest' | 'manure' | 'fallow';
  crop?: string;
  resourcesAllocated?: {
    water?: number;
    manure?: number;
  };
}

export interface ResourceAllocation {
  water: {
    available: number;
    allocated: Map<number, number>;
  };
  manure: {
    available: number;
    allocated: Map<number, number>;
  };
  seeds: string[];
}

// ============================================================================
// FARMER TOAST
// ============================================================================

export interface FarmerToast {
  message: string;
  type: 'advice' | 'warning' | 'quest' | 'news' | 'greeting';
}

// ============================================================================
// WORK HISTORY
// ============================================================================

export interface WorkHistoryEntry {
  type: 'player' | 'narrator';
  text: string;
}

// ============================================================================
// PROSPERITY INFO
// ============================================================================

export interface ProsperityInfo {
  label: string;
  color: string;
  bg: string;
  emoji: string;
}

// ============================================================================
// CROP EMOJIS
// ============================================================================

export const CROP_EMOJIS: Record<string, string> = {
  wheat: '🌾',
  barley: '🌾',
  rice: '🌾',
  oats: '🌾',
  rye: '🌾',
  quinoa: '🌾',
  maize: '🌽',
  corn: '🌽',
  potatoes: '🥔',
  potato: '🥔',
  tomatoes: '🍅',
  tomato: '🍅',
  peas: '🟢',
  beans: '🫘',
  soybeans: '🫘',
  vegetables: '🥬',
  cabbage: '🥬',
  'bok choy': '🥬',
  turnips: '🟣',
  radishes: '🔴',
  onions: '🧅',
  carrots: '🥕',
  melons: '🍈',
  squash: '🎃',
  dates: '🌴',
  coconut: '🥥',
  tea: '🍵',
  coffee: '☕',
  cotton: '☁️',
  tobacco: '🍂',
  sugarcane: '🎋',
  sugar: '🎋',
  apples: '🍎',
  apple: '🍎',
  pears: '🍐',
  pear: '🍐',
  plums: '🍑',
  plum: '🍑',
  cherries: '🍒',
  cherry: '🍒',
  dates: '🌴',
  date: '🌴',
};

// Mapping from crop names to item base IDs for inventory integration
export const CROP_TO_ITEM_BASE_ID: Record<string, string> = {
  wheat: 'WHEAT',
  barley: 'BARLEY',
  rice: 'RICE',
  millet: 'MILLET',
  corn: 'CORN',
  maize: 'CORN',
  cotton: 'COTTON',
  flax: 'COTTON', // Flax item doesn't exist yet, using cotton as fallback
  beans: 'PEAS', // Beans item doesn't exist yet, using peas as fallback
  peas: 'PEAS',
  lentils: 'LENTILS',
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const PANEL_RIGHT_W = 340;
