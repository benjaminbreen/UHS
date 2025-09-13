/**
 * Quest System Types
 * Defines quests that are tied to actual game world locations and mechanics
 */

import { MapTile } from './index';

export interface QuestObjective {
  id: string;
  type: 'visit_location' | 'talk_to_npc' | 'deliver_item' | 'collect_item' | 
        'reach_destination' | 'defeat_entity' | 'survive_duration' | 'explore_area' |
        'solve_puzzle' | 'make_choice' | 'gather_information' | 'escort_npc' |
        'travel_distance' | 'collect_resource' | 'survive_time' | 'craft_item' |
        'trade' | 'observe_event' | 'patrol_area' | 'prepare_defenses' |
        'defeat_enemies' | 'create_document' | 'deliver_message' | 'negotiate' |
        'observe_outcome' | 'complete_task' | 'social_interaction' | 'follow_path';
  description: string;
  targetLocation?: {
    x: number;
    y: number;
    radius?: number; // For area exploration
    locationType?: 'marketplace' | 'city_center' | 'palace' | 'holy_site' | 'ruins' | 'farm';
  };
  targetNPC?: string;
  targetEntity?: string; // For hunting/combat quests
  targetItem?: string;
  targetType?: string; // For flexible targeting
  targetDistance?: number; // For travel_distance objectives
  targetAmount?: number; // For collection objectives
  targetDays?: number; // For survival time objectives
  resourceType?: string; // For resource collection
  itemsToCollect?: Array<{ name: string; quantity: number }>; // For collection quests
  startLocation?: { x: number; y: number }; // For travel distance tracking
  requiredChoice?: string; // For decision-based objectives
  timeLimit?: number; // In game minutes
  completed: boolean;
  progress?: number;
  total?: number;
  hidden?: boolean; // Hidden objectives revealed through play
  optional?: boolean; // Optional objectives for bonus rewards
  isLLMEnabled?: boolean; // Enable LLM interaction for this objective
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'main' | 'trade' | 'exploration' | 'social' | 'survival' | 'combat' | 
            'scholarship' | 'mystery' | 'diplomatic';
  objectives: QuestObjective[];
  currentObjectiveIndex: number;
  rewards: QuestReward[];
  bonusRewards?: QuestReward[]; // For completing optional objectives
  startLocation?: { x: number; y: number };
  startTime: number;
  completedTime?: number;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  historicalContext?: string;
  isLLMGenerated?: boolean;
  isProceduralQuest?: boolean;
  chainId?: string; // Part of a quest chain
  prerequisiteQuests?: string[]; // Must complete these first
  followUpQuests?: string[]; // Unlocked after completion
  difficulty?: 'easy' | 'medium' | 'hard' | 'legendary';
  recommendedLevel?: number;
  expiryTime?: number; // Quest expires after this time
  failureConditions?: QuestFailureCondition[];
  dialogueOptions?: QuestDialogue[]; // Special dialogue for this quest
  dynamicElements?: DynamicQuestElement[]; // Elements that change based on player actions
  culturalZone?: string; // For culturally appropriate rewards
  era?: string; // Historical era for context-appropriate rewards
  isActiveQuest?: boolean; // Whether this is the currently active quest for notifications/markers
}

export interface QuestReward {
  type: 'item' | 'reputation' | 'knowledge' | 'money' | 'health' | 'experience' |
        'skill' | 'blessing' | 'curse' | 'title' | 'relationship' | 'map_reveal' |
        'quest_unlock' | 'special_ability';
  value: any;
  description: string;
  itemId?: string; // Specific item ID for item rewards
  quantity?: number;
  guaranteed?: boolean; // Is this reward guaranteed or chance-based?
  chance?: number; // Probability of receiving (0-1)
}

export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: Quest[];
  currentQuestIndex: number;
  completed: boolean;
}

export interface QuestMarker {
  x: number;
  y: number;
  questId: string;
  objectiveId: string;
  type: 'primary' | 'secondary' | 'optional';
  label: string;
}

// For connecting quests to existing game modals
export interface LocationInteraction {
  locationType: 'marketplace' | 'city_center' | 'palace' | 'holy_site' | 'ruins' | 'farm';
  x: number;
  y: number;
  questId?: string;
  specialAction?: {
    label: string;
    description: string;
    handler: () => void;
  };
}

export interface QuestFailureCondition {
  type: 'time_limit' | 'npc_death' | 'item_lost' | 'reputation_too_low' | 'player_death';
  value?: any;
  description: string;
}

export interface QuestDialogue {
  npcId?: string;
  trigger: 'on_start' | 'on_progress' | 'on_complete' | 'on_fail';
  text: string;
  responses?: {
    text: string;
    effect?: string;
  }[];
}

export interface DynamicQuestElement {
  id: string;
  type: 'branching_path' | 'scaling_difficulty' | 'random_encounter' | 'weather_dependent';
  conditions: any;
  variations: any[];
}

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  minDistance?: number; // Minimum distance from player for quest location
  maxDistance?: number; // Maximum distance from player
  requiredStructures?: string[]; // Required structure types on map
  culturalVariants?: Record<string, any>; // Culture-specific variations
  eraVariants?: Record<string, any>; // Era-specific variations
  baseRewards: QuestReward[];
  difficultyScaling?: {
    easy: number;
    medium: number;
    hard: number;
    legendary: number;
  };
}