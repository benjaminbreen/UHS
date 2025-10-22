/**
 * types/workOffer.ts - Simple work offer system types
 * Bypasses complex quest system for immediate, functional NPC work requests
 */

export type WorkTaskType =
  | 'fetch_item'           // "Bring me water"
  | 'deliver_to_location'  // "Take this to the quarry"
  | 'buy_from_location'    // "Buy marble from quarry"
  | 'kill_animal'          // "Kill the wolf bothering my sheep"
  | 'gather_resource'      // "Collect 5 pieces of wood"
  | 'explore_location'     // "Investigate the old ruins and bring back anything interesting"
  | 'collect_animal_products';  // "Bring me 3 wolf pelts"

export interface WorkOffer {
  id: string;                     // Unique ID
  npcId: string;                  // Who offered it
  npcName: string;                // For display
  npcLocation: {                  // Where NPC was when offering work
    x: number;
    y: number;
    mapSeed?: string;             // Which map they're on
  };
  taskType: WorkTaskType;
  description: string;            // "Fetch me some water by end of day"

  // SIMPLE requirements - only ONE of these is used per task
  requiredItem?: string;          // Item name (e.g., "Water") - undefined for explore_location (accepts any item)
  requiredQuantity?: number;      // How many (default 1)
  deliveredQuantity?: number;     // How many have been delivered so far (partial delivery)
  targetLocation?: {              // Where to go
    x: number;
    y: number;
    name: string;                 // "Southeast Quarry"
    radius: number;               // How close player needs to be (in tiles)
  };
  targetAnimal?: string;          // Animal type to hunt (e.g., "wolf")
  acceptsAnyItem?: boolean;       // For explore_location - any item completes the quest

  payment: number;                // Coins to pay
  deadline?: number;              // Game hours from offer time
  offerTime: number;              // When was this offered (game hours)

  accepted: boolean;
  completed: boolean;
  failed: boolean;
}
