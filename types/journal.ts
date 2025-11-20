/**
 * types/journal.ts - Type definitions for the player journal and gamelog system.
 */
import { GameDate, DialogueEntry } from './index';

export type GameLogEntryType =
    // Original types
    | 'DIALOGUE'
    | 'COMBAT'
    | 'MAP_ENTRY'
    | 'SKILL_USE'
    | 'ITEM_ACQUIRED'
    | 'TRADE'
    | 'REST'
    | 'MILESTONE_COMBAT'
    | 'MILESTONE_EXPLORATION'
    | 'MILESTONE_ACHIEVEMENT'
    | 'QUEST_START'
    | 'QUEST_COMPLETE'
    | 'STUDY'
    // Phase 2: Enhanced logging types
    | 'PRIMARY_SOURCE_READ'      // Player opened/read a primary source
    | 'PRIMARY_SOURCE_QUOTED'    // Player added quote to journal
    | 'DIALOGUE_CHOICE'          // Player made dialogue decision
    | 'LEARNING_MOMENT'          // Educational insight or discovery
    | 'HISTORICAL_DISCOVERY'     // Found historical artifact or learned historical fact
    // Phase 3: Comprehensive logging types
    | 'LOCATION_ENTRY'           // Entered a special location (fortress, palace, market, etc.)
    | 'BUILDING_ENTRY'           // Entered a specific building
    | 'CONTAINER_OPENED'         // Opened a container (chest, barrel, etc.)
    | 'NPC_ENCOUNTER'            // Met or interacted with an NPC
    | 'WORK_TASK_ACCEPTED'       // Accepted a work task from an NPC
    | 'WORK_TASK_COMPLETED';     // Completed a work task

export type GameLogCategory =
    | 'combat'           // Combat-related events
    | 'exploration'      // Travel and discovery
    | 'social'           // Dialogue and NPC interactions
    | 'trade'            // Commerce and trading
    | 'education'        // Learning and primary sources
    | 'progression'      // Quests and achievements
    | 'survival';        // Rest, health, etc.

export interface GameLogEntry {
    id: string;
    timestamp: GameDate;
    timeString: string; // e.g., "14:30"
    type: GameLogEntryType;
    icon: string;
    summary: string;
    details?: string | DialogueEntry[]; // For expandable content like full dialogue or combat stats

    // Phase 2: Enhanced contextual data
    location?: string;          // Where this event happened
    npcsInvolved?: string[];    // Names of NPCs involved in event
    timeOfDay?: string;         // Morning, Afternoon, Evening, Night
    tags?: string[];            // Auto-categorized tags for filtering
    category?: GameLogCategory; // Primary category for this log entry
    educationalValue?: number;  // 0-100 score for educational content (for teacher reports)
}

export interface PlayerJournalEntry {
    id: string;
    timestamp: GameDate;
    timeString: string;
    text: string;
}

export interface PrimarySource {
    title: string;
    author: string;
    year: number;
    excerpt: string;
}

// Study-specific journal entries
export interface StudyJournalEntry {
    id: string;
    timestamp: number;
    type: 'study';
    action: string; // 'Examine', 'Question', etc.
    actionEmoji: string;
    itemName: string;
    itemEmoji?: string;
    studentInput: string;
    analysisResponse: string;
    location: string;
    date: string;
}

// Generic journal entry (for manual entries)
export interface JournalEntry {
    id: string;
    timestamp: number;
    type: 'manual' | 'study';
    title?: string;
    content: string;
    location: string;
    date: string;

    // Study-specific fields (when type === 'study')
    action?: string;
    actionEmoji?: string;
    itemName?: string;
    itemEmoji?: string;
    studentInput?: string;
    analysisResponse?: string;
}

// Primary Source Quote entries
export interface JournalQuote {
    id: string;
    quote: string;           // Selected text from primary source
    sourceTitle: string;     // e.g., "The Rihla - Asian Chapters"
    author: string;          // e.g., "Ibn Battuta"
    year: number;           // e.g., 1345
    era: string;            // e.g., "MEDIEVAL"
    culturalZone: string;   // e.g., "MENA"
    dateAdded: Date;        // When added to journal
    gameContext?: {         // Optional: where/when player found this
        location: string;
        gameDate: { year: number; month: number; day: number };
    };
    tags?: string[];        // Auto-extracted from keywords
}

export interface TooltipPosition {
    x: number;
    y: number;
}

export interface TextSelectionData {
    text: string;
    range: Range;
    rect: DOMRect;
}
