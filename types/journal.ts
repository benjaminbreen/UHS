/**
 * types/journal.ts - Type definitions for the player journal and gamelog system.
 */
import { GameDate, DialogueEntry } from './index';

export type GameLogEntryType = 'DIALOGUE' | 'COMBAT' | 'MAP_ENTRY' | 'SKILL_USE' | 'ITEM_ACQUIRED' | 'TRADE' | 'REST' | 'MILESTONE_COMBAT' | 'MILESTONE_EXPLORATION' | 'MILESTONE_ACHIEVEMENT' | 'QUEST_START' | 'QUEST_COMPLETE' | 'STUDY';

export interface GameLogEntry {
    id: string;
    timestamp: GameDate;
    timeString: string; // e.g., "14:30"
    type: GameLogEntryType;
    icon: string;
    summary: string;
    details?: string | DialogueEntry[]; // For expandable content like full dialogue or combat stats
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
