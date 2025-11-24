/**
 * Journal Event Dispatcher
 * Centralized utility for dispatching journal-related events
 */

// Quest service removed

export interface JournalEntryEvent {
  entry: {
    id: string;
    title?: string;
    content: string;
    location: string;
    date: string;
    timestamp: number;
  };
  activeQuests: string[];
}

/**
 * Dispatch journalEntryAdded event
 */
export function dispatchJournalEntryAdded(entry: any): void {
  const activeQuests: string[] = []; // Quest system removed

  window.dispatchEvent(new CustomEvent('journalEntryAdded', {
    detail: { entry, activeQuests }
  }));

  console.log('[JournalEventDispatcher] Dispatched journalEntryAdded event for', entry.id);
}

/**
 * Add journal entry to localStorage and dispatch event
 */
export function addJournalEntryWithEvent(entry: any): void {
  // Add to localStorage
  const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
  existingEntries.unshift(entry);
  localStorage.setItem('journalEntries', JSON.stringify(existingEntries));

  // Dispatch event
  dispatchJournalEntryAdded(entry);
}