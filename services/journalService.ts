/**
 * services/journalService.ts - Service for managing journal entries and auto-slide behavior
 */

// Use the same interface as JournalViewport
interface JournalEntry {
    id: string;
    title?: string;
    content: string;
    location: string;
    date: string;
    timestamp: number;
    type?: 'study';
    action?: string;
    actionEmoji?: string;
    itemName?: string;
    itemEmoji?: string;
    studentInput?: string;
}

// Event listeners for journal management
type JournalEventListener = (entry: JournalEntry) => void;
type JournalOpenListener = () => void;

class JournalService {
    private entryListeners: JournalEventListener[] = [];
    private openListeners: JournalOpenListener[] = [];

    // Add a new journal entry and trigger auto-slide
    addEntry(entry: JournalEntry) {
        console.log('[JournalService] Adding study entry:', entry.title);

        // Notify all listeners of the new entry
        this.entryListeners.forEach(listener => {
            try {
                listener(entry);
            } catch (error) {
                console.error('Journal entry listener error:', error);
            }
        });

        // Auto-open the journal
        this.openJournal();
    }

    // Trigger journal auto-slide open
    openJournal() {
        console.log('[JournalService] Auto-opening journal');
        this.openListeners.forEach(listener => {
            try {
                listener();
            } catch (error) {
                console.error('Journal open listener error:', error);
            }
        });
    }

    // Subscribe to new journal entries
    onNewEntry(listener: JournalEventListener) {
        this.entryListeners.push(listener);
        return () => {
            const index = this.entryListeners.indexOf(listener);
            if (index > -1) {
                this.entryListeners.splice(index, 1);
            }
        };
    }

    // Subscribe to journal open events
    onJournalOpen(listener: JournalOpenListener) {
        this.openListeners.push(listener);
        return () => {
            const index = this.openListeners.indexOf(listener);
            if (index > -1) {
                this.openListeners.splice(index, 1);
            }
        };
    }
}

// Export singleton instance
export const journalService = new JournalService();
export type { JournalEntry };