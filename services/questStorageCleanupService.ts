/**
 * Quest Storage Cleanup Service
 * Manages localStorage quota and prevents storage bloat from quest data
 */

export interface StorageStats {
  totalSize: number;
  questCount: number;
  chainCount: number;
  journalEntries: number;
  oldestEntry: number;
  quotaUsage: number; // percentage
}

class QuestStorageCleanupService {
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (conservative localStorage limit)
  private readonly CLEANUP_THRESHOLD = 0.8; // 80% usage triggers cleanup
  private readonly QUEST_EXPIRY_DAYS = 14;
  private readonly CHAIN_EXPIRY_DAYS = 7;

  /**
   * Check storage usage and clean up if needed
   */
  async performMaintenanceCleanup(): Promise<void> {
    console.log('[QuestStorageCleanup] Performing maintenance cleanup...');

    const stats = this.getStorageStats();
    console.log('[QuestStorageCleanup] Current storage stats:', stats);

    if (stats.quotaUsage > this.CLEANUP_THRESHOLD) {
      console.warn(`[QuestStorageCleanup] Storage usage at ${(stats.quotaUsage * 100).toFixed(1)}%, triggering cleanup`);

      // Prioritized cleanup strategy
      await this.cleanupExpiredData();
      await this.cleanupOldJournalEntries();
      await this.cleanupLargeQuestData();

      const newStats = this.getStorageStats();
      console.log(`[QuestStorageCleanup] Cleanup complete. Usage reduced from ${(stats.quotaUsage * 100).toFixed(1)}% to ${(newStats.quotaUsage * 100).toFixed(1)}%`);

      // Emergency cleanup if still over threshold
      if (newStats.quotaUsage > 0.95) {
        console.warn('[QuestStorageCleanup] Emergency cleanup required');
        await this.emergencyCleanup();
      }
    }
  }

  /**
   * Get comprehensive storage statistics
   */
  getStorageStats(): StorageStats {
    let totalSize = 0;
    let questCount = 0;
    let chainCount = 0;
    let journalEntries = 0;
    let oldestEntry = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const item = localStorage.getItem(key);
      if (!item) continue;

      const size = key.length + item.length;
      totalSize += size;

      // Categorize storage items
      if (key.startsWith('ww_quest_')) {
        questCount++;
        try {
          const data = JSON.parse(item);
          if (data.timestamp && data.timestamp < oldestEntry) {
            oldestEntry = data.timestamp;
          }
        } catch (e) {
          // Corrupted data, will be cleaned up
        }
      } else if (key.startsWith('ww_chain_')) {
        chainCount++;
        try {
          const data = JSON.parse(item);
          if (data.expires && data.expires < oldestEntry) {
            oldestEntry = data.expires;
          }
        } catch (e) {
          // Corrupted data, will be cleaned up
        }
      } else if (key === 'journalEntries') {
        try {
          const entries = JSON.parse(item);
          journalEntries = Array.isArray(entries) ? entries.length : 0;
        } catch (e) {
          // Corrupted journal data
        }
      }
    }

    return {
      totalSize,
      questCount,
      chainCount,
      journalEntries,
      oldestEntry,
      quotaUsage: totalSize / this.MAX_STORAGE_SIZE
    };
  }

  /**
   * Clean up expired quest and chain data
   */
  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    const questExpiry = now - (this.QUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const chainExpiry = now - (this.CHAIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const keysToRemove: string[] = [];

    // Find expired items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        if (key.startsWith('ww_quest_')) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expires && data.expires < now) {
            keysToRemove.push(key);
          } else if (data.timestamp && data.timestamp < questExpiry) {
            keysToRemove.push(key);
          }
        } else if (key.startsWith('ww_chain_')) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expires && data.expires < now) {
            keysToRemove.push(key);
          }
        }
      } catch (error) {
        // Corrupted data, remove it
        keysToRemove.push(key);
      }
    }

    // Remove expired items
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[QuestStorageCleanup] Removed expired item: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`[QuestStorageCleanup] Cleaned up ${keysToRemove.length} expired items`);
    }
  }

  /**
   * Clean up old journal entries (keep only last 100)
   */
  private async cleanupOldJournalEntries(): Promise<void> {
    try {
      const journalData = localStorage.getItem('journalEntries');
      if (!journalData) return;

      const entries = JSON.parse(journalData);
      if (!Array.isArray(entries)) return;

      const MAX_JOURNAL_ENTRIES = 100;
      if (entries.length > MAX_JOURNAL_ENTRIES) {
        // Keep only the most recent entries
        const trimmedEntries = entries
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, MAX_JOURNAL_ENTRIES);

        localStorage.setItem('journalEntries', JSON.stringify(trimmedEntries));
        console.log(`[QuestStorageCleanup] Trimmed journal entries from ${entries.length} to ${trimmedEntries.length}`);
      }
    } catch (error) {
      console.error('[QuestStorageCleanup] Error cleaning journal entries:', error);
      // If journal is corrupted, reset it
      localStorage.setItem('journalEntries', '[]');
    }
  }

  /**
   * Clean up oversized quest data
   */
  private async cleanupLargeQuestData(): Promise<void> {
    const MAX_ITEM_SIZE = 5000; // 5KB per quest item
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.startsWith('ww_quest_') && !key.startsWith('ww_chain_'))) continue;

      const item = localStorage.getItem(key);
      if (!item) continue;

      if (item.length > MAX_ITEM_SIZE) {
        keysToRemove.push(key);
        console.warn(`[QuestStorageCleanup] Removing oversized item: ${key} (${item.length} chars)`);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`[QuestStorageCleanup] Removed ${keysToRemove.length} oversized items`);
    }
  }

  /**
   * Emergency cleanup - remove oldest data first
   */
  private async emergencyCleanup(): Promise<void> {
    console.warn('[QuestStorageCleanup] Performing emergency cleanup');

    const questItems: Array<{key: string, timestamp: number, size: number}> = [];

    // Collect all quest-related items with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.startsWith('ww_quest_') && !key.startsWith('ww_chain_'))) continue;

      const item = localStorage.getItem(key);
      if (!item) continue;

      try {
        const data = JSON.parse(item);
        const timestamp = data.timestamp || data.expires || 0;
        questItems.push({
          key,
          timestamp,
          size: item.length
        });
      } catch (error) {
        // Remove corrupted items immediately
        localStorage.removeItem(key);
      }
    }

    // Sort by age (oldest first) and remove until under emergency threshold
    questItems.sort((a, b) => a.timestamp - b.timestamp);

    const emergencyThreshold = 0.9;
    let currentStats = this.getStorageStats();
    let removedCount = 0;

    for (const item of questItems) {
      if (currentStats.quotaUsage < emergencyThreshold) break;

      localStorage.removeItem(item.key);
      removedCount++;
      currentStats = this.getStorageStats();
    }

    console.warn(`[QuestStorageCleanup] Emergency cleanup removed ${removedCount} items. New usage: ${(currentStats.quotaUsage * 100).toFixed(1)}%`);
  }

  /**
   * Safe storage set with size checking
   */
  safeSetItem(key: string, value: string): boolean {
    try {
      // Check if adding this item would exceed quota
      const newSize = key.length + value.length;
      const stats = this.getStorageStats();

      if ((stats.totalSize + newSize) / this.MAX_STORAGE_SIZE > 0.95) {
        console.warn(`[QuestStorageCleanup] Storage nearly full, attempting cleanup before storing ${key}`);
        this.performMaintenanceCleanup();
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('[QuestStorageCleanup] Quota exceeded, performing emergency cleanup');
        this.emergencyCleanup();

        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (secondError) {
          console.error('[QuestStorageCleanup] Failed to store even after emergency cleanup:', secondError);
          return false;
        }
      } else {
        console.error('[QuestStorageCleanup] Unexpected storage error:', error);
        return false;
      }
    }
  }

  /**
   * Initialize cleanup service (run periodic maintenance)
   */
  initialize(): void {
    console.log('[QuestStorageCleanup] Initializing storage cleanup service');

    // Run initial cleanup
    this.performMaintenanceCleanup();

    // Set up periodic cleanup (every 30 minutes)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.performMaintenanceCleanup();
      }, 30 * 60 * 1000);
    }
  }

  /**
   * Get human-readable storage report for debugging
   */
  getStorageReport(): string {
    const stats = this.getStorageStats();
    const sizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
    const usagePercent = (stats.quotaUsage * 100).toFixed(1);

    return `
📊 Quest Storage Report:
• Total Size: ${sizeInMB} MB (${usagePercent}% of quota)
• Active Quests: ${stats.questCount}
• Quest Chains: ${stats.chainCount}
• Journal Entries: ${stats.journalEntries}
• Oldest Entry: ${stats.oldestEntry ? new Date(stats.oldestEntry).toLocaleDateString() : 'None'}
• Status: ${stats.quotaUsage > 0.8 ? '⚠️ High Usage' : '✅ Normal'}
    `.trim();
  }
}

// Export singleton instance
export const questStorageCleanupService = new QuestStorageCleanupService();