export type HistoryLensActionType =
  | 'move'
  | 'navigate_nearest'
  | 'navigate_edge'
  | 'navigate_home'
  | 'seek_npc'
  | 'advance_time'
  | 'inventory_add'
  | 'inventory_remove'
  | 'player_damage'
  | 'game_over'
  | 'npc_create'
  | 'propose_enter';

export type HistoryLensAction = {
  type: HistoryLensActionType;
  params?: Record<string, unknown>;
};

export type HistoryLensResponse = {
  narration: string;
  actions: HistoryLensAction[];
  suggestedActions?: string[];
  debugPrompt?: string;
  rawResponse?: string;
  model?: string;
};

// Structure types that can appear as interactive cards in HistoryLens
export type StructureCardType =
  | 'city' | 'fortress' | 'mine' | 'quarry' | 'fishing_hut'
  | 'palace' | 'holy_site' | 'ruins' | 'government'
  | 'farm' | 'market' | 'harbor' | 'woodcutter';

// Interactive card data for structure entry prompts
export type StructureCard = {
  type: 'enter_structure';
  structureId: string;
  structureName: string;
  structureType: StructureCardType;
  description?: string;
  location: { x: number; y: number };
  resolved?: boolean;
};

// Interactive card for continuing an interrupted journey
export type JourneyCard = {
  type: 'continue_journey';
  destination: {
    x: number;
    y: number;
    label: string;
    kind: string;
  };
  interruptedBy: 'npc' | 'animal';
  entityName?: string;
  resolved?: boolean;
};

// Union type for all card types
export type HistoryLensCard = StructureCard | JourneyCard;

export type HistoryLensMessage = {
  id: string;
  sender: 'system' | 'player' | 'narrator';
  text: string;
  meta?: string;
  style?: 'scene' | 'standard';
  card?: HistoryLensCard;
};
