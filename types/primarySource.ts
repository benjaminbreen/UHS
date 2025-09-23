/**
 * Types for the primary source discussion system
 */

import { HistoricalEra, CulturalZone } from './index';

export type SourceType = 'pasted_text' | 'journal_entry' | 'pdf_extracted';

export interface SubmittedSource {
  id: string;
  title: string;
  content: string;
  type: SourceType;
  playerNotes?: string; // "I want to discuss this because..."
  submittedAt: number;
  era: HistoricalEra;
  culturalZone: CulturalZone;
}

export interface SourceDiscussion {
  sourceId: string;
  npcId: string;
  npcName: string;
  npcProfession: string;
  dialogue: string[];
  timestamp: number;
  location: string;
}

export interface SourceSubmissionState {
  isSubmitting: boolean;
  currentSource: SubmittedSource | null;
  discussions: SourceDiscussion[];
}