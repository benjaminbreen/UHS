export type HistoryLensActionType =
  | 'move'
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
};

export type HistoryLensMessage = {
  id: string;
  sender: 'system' | 'player' | 'narrator';
  text: string;
};
