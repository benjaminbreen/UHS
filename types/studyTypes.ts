/**
 * types/studyTypes.ts - Type definitions for the Study system
 */

export interface StudyAction {
  id: string;
  name: string;
  emoji: string;
  prompt: string;
  category: 'analytical' | 'creative';
  minInputLength: number;
  exampleInput?: string;
}

export interface StudyContext {
  item: any; // Flexible for StudiedItem | AnimalEntity | Manuscript
  action: StudyAction;
  studentInput: string;
  historicalContext: {
    year: number;
    location: string;
    culturalZone: string;
    season: string;
  };
}

export interface StudyEntry {
  id: string;
  timestamp: number;
  type: 'study';
  action: string;
  actionEmoji: string;
  itemName: string;
  itemEmoji?: string;
  studentInput: string;
  analysisResponse: string;
  location: string;
  date: string;
}