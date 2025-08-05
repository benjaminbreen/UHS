/**
 * types/journal.ts - Type definitions for the player journal and gamelog system.
 */
import { GameDate, DialogueEntry } from './index';

export type GameLogEntryType = 'DIALOGUE' | 'COMBAT' | 'MAP_ENTRY' | 'SKILL_USE' | 'ITEM_ACQUIRED' | 'TRADE' | 'REST';

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
