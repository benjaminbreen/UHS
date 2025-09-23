/**
 * Service for persisting source discussion history to localStorage
 */

import { SubmittedSource, SourceDiscussion } from '../types/primarySource';

const STORAGE_KEY = 'uhs_source_discussions';
const SOURCES_KEY = 'uhs_submitted_sources';
const MAX_DISCUSSIONS = 100;
const MAX_SOURCES = 50;

export interface SourceDiscussionHistory {
  discussions: SourceDiscussion[];
  sources: SubmittedSource[];
  lastUpdated: number;
}

/**
 * Saves source discussion history to localStorage
 */
export function saveDiscussionHistory(
  discussions: SourceDiscussion[],
  sources: SubmittedSource[]
): void {
  try {
    const history: SourceDiscussionHistory = {
      discussions: discussions.slice(-MAX_DISCUSSIONS),
      sources: sources.slice(-MAX_SOURCES),
      lastUpdated: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[SourceDiscussionPersistence] Failed to save history:', error);
  }
}

/**
 * Loads source discussion history from localStorage
 */
export function loadDiscussionHistory(): SourceDiscussionHistory | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const history = JSON.parse(stored) as SourceDiscussionHistory;
    return history;
  } catch (error) {
    console.error('[SourceDiscussionPersistence] Failed to load history:', error);
    return null;
  }
}

/**
 * Adds a new discussion to history
 */
export function addDiscussionToHistory(
  discussion: SourceDiscussion,
  source: SubmittedSource
): void {
  const history = loadDiscussionHistory() || {
    discussions: [],
    sources: [],
    lastUpdated: Date.now()
  };

  // Check if source already exists
  const existingSourceIndex = history.sources.findIndex(s => s.id === source.id);
  if (existingSourceIndex === -1) {
    history.sources.push(source);
  } else {
    history.sources[existingSourceIndex] = source;
  }

  // Add or update discussion
  const existingDiscussionIndex = history.discussions.findIndex(
    d => d.sourceId === discussion.sourceId && d.npcId === discussion.npcId
  );

  if (existingDiscussionIndex >= 0) {
    // Merge dialogue arrays
    const existingDialogue = history.discussions[existingDiscussionIndex].dialogue;
    history.discussions[existingDiscussionIndex] = {
      ...discussion,
      dialogue: [...new Set([...existingDialogue, ...discussion.dialogue])]
    };
  } else {
    history.discussions.push(discussion);
  }

  saveDiscussionHistory(history.discussions, history.sources);
}

/**
 * Clears all discussion history
 */
export function clearDiscussionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[SourceDiscussionPersistence] Failed to clear history:', error);
  }
}

/**
 * Gets discussion count for assessment
 */
export function getDiscussionMetrics(): {
  totalDiscussions: number;
  uniqueSources: number;
  uniqueNpcs: number;
  averageExchanges: number;
} {
  const history = loadDiscussionHistory();
  if (!history || history.discussions.length === 0) {
    return {
      totalDiscussions: 0,
      uniqueSources: 0,
      uniqueNpcs: 0,
      averageExchanges: 0
    };
  }

  const uniqueNpcs = new Set(history.discussions.map(d => d.npcId));
  const uniqueSources = new Set(history.discussions.map(d => d.sourceId));
  const totalExchanges = history.discussions.reduce((sum, d) => sum + d.dialogue.length, 0);

  return {
    totalDiscussions: history.discussions.length,
    uniqueSources: uniqueSources.size,
    uniqueNpcs: uniqueNpcs.size,
    averageExchanges: totalExchanges / history.discussions.length
  };
}