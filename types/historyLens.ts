export type HistoryLensActionType =
  | 'move'
  | 'navigate_nearest'
  | 'seek_npc'
  | 'advance_time'
  | 'inventory_add'
  | 'inventory_remove'
  | 'player_damage'
  | 'game_over'
  | 'npc_create';

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

export type HistoryLensMessage = {
  id: string;
  sender: 'system' | 'player' | 'narrator';
  text: string;
  meta?: string;
  style?: 'scene' | 'standard';
};
