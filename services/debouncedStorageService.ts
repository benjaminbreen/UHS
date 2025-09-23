/**
 * Debounced localStorage service to prevent performance issues
 * Batches and delays localStorage writes to avoid blocking the main thread
 */

type PendingWrite = {
  key: string;
  data: any;
  timestamp: number;
};

class DebouncedStorageService {
  private pendingWrites: Map<string, PendingWrite> = new Map();
  private writeTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 2000; // 2 seconds default
  private readonly MAX_BATCH_SIZE = 10; // Process max 10 writes at once
  private isWriting = false;

  /**
   * Queue a write operation to be executed after debounce delay
   * @param key localStorage key
   * @param data Data to store (will be JSON stringified)
   * @param immediate If true, writes immediately (use sparingly)
   */
  setItem(key: string, data: any, immediate = false): void {
    if (immediate) {
      // For critical saves that must happen immediately
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`[DebouncedStorage] Immediate write failed for ${key}:`, error);
      }
      return;
    }

    // Queue the write
    this.pendingWrites.set(key, {
      key,
      data,
      timestamp: Date.now()
    });

    // Reset the debounce timer
    this.scheduleWrite();
  }

  /**
   * Get an item from localStorage (immediate, no debouncing needed)
   */
  getItem<T = any>(key: string): T | null {
    // First check if there's a pending write for this key
    const pending = this.pendingWrites.get(key);
    if (pending) {
      return pending.data;
    }

    // Otherwise get from localStorage
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[DebouncedStorage] Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): void {
    // Remove from pending writes if exists
    this.pendingWrites.delete(key);

    // Remove from localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[DebouncedStorage] Failed to remove item ${key}:`, error);
    }
  }

  /**
   * Force flush all pending writes immediately
   * Use when critical data must be saved (e.g., before page unload)
   */
  flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.executePendingWrites();
  }

  /**
   * Clear all pending writes without saving
   */
  clearPending(): void {
    this.pendingWrites.clear();
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
  }

  /**
   * Get the number of pending writes
   */
  getPendingCount(): number {
    return this.pendingWrites.size;
  }

  private scheduleWrite(): void {
    // Clear existing timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    // Schedule new write
    this.writeTimer = setTimeout(() => {
      this.executePendingWrites();
    }, this.DEBOUNCE_DELAY);
  }

  private executePendingWrites(): void {
    if (this.isWriting || this.pendingWrites.size === 0) {
      return;
    }

    this.isWriting = true;
    const startTime = performance.now();

    // Get writes to process (limit batch size)
    const writesToProcess = Array.from(this.pendingWrites.entries())
      .slice(0, this.MAX_BATCH_SIZE);

    // Execute writes
    let successCount = 0;
    let errorCount = 0;

    for (const [key, pending] of writesToProcess) {
      try {
        localStorage.setItem(pending.key, JSON.stringify(pending.data));
        this.pendingWrites.delete(key);
        successCount++;
      } catch (error) {
        console.error(`[DebouncedStorage] Failed to write ${key}:`, error);
        errorCount++;
        // Keep in pending for retry
      }
    }

    const elapsed = performance.now() - startTime;

    // Only log in development or if there were errors
    if (errorCount > 0 || elapsed > 50) {
      console.log(
        `[DebouncedStorage] Batch write complete: ${successCount} success, ${errorCount} errors, ${elapsed.toFixed(1)}ms`
      );
    }

    this.isWriting = false;

    // If there are more pending writes, schedule another batch
    if (this.pendingWrites.size > 0) {
      this.scheduleWrite();
    }
  }
}

// Create singleton instances for both localStorage and sessionStorage
export const debouncedStorage = new DebouncedStorageService();

// Create a sessionStorage version that uses sessionStorage instead of localStorage
class DebouncedSessionStorageService {
  private pendingWrites: Map<string, PendingWrite> = new Map();
  private writeTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 2000;
  private readonly MAX_BATCH_SIZE = 10;
  private isWriting = false;

  setItem(key: string, data: any, immediate = false): void {
    if (immediate) {
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`[DebouncedSessionStorage] Immediate write failed for ${key}:`, error);
      }
      return;
    }

    // Queue the write
    this.pendingWrites.set(key, {
      key,
      data,
      timestamp: Date.now()
    });

    // Reset the debounce timer
    this.scheduleWrite();
  }

  getItem<T = any>(key: string): T | null {
    // First check if there's a pending write for this key
    const pending = this.pendingWrites.get(key);
    if (pending) {
      return pending.data;
    }

    // Otherwise get from sessionStorage
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[DebouncedSessionStorage] Failed to get item ${key}:`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    // Remove from pending writes if exists
    this.pendingWrites.delete(key);

    // Remove from sessionStorage
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[DebouncedSessionStorage] Failed to remove item ${key}:`, error);
    }
  }

  flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.executePendingWrites();
  }

  clearPending(): void {
    this.pendingWrites.clear();
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
  }

  getPendingCount(): number {
    return this.pendingWrites.size;
  }

  private scheduleWrite(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      this.executePendingWrites();
    }, this.DEBOUNCE_DELAY);
  }

  private executePendingWrites(): void {
    if (this.isWriting || this.pendingWrites.size === 0) {
      return;
    }

    this.isWriting = true;
    const startTime = performance.now();

    // Get writes to process (limit batch size)
    const writesToProcess = Array.from(this.pendingWrites.entries())
      .slice(0, this.MAX_BATCH_SIZE);

    // Execute writes to sessionStorage
    let successCount = 0;
    let errorCount = 0;

    for (const [key, pending] of writesToProcess) {
      try {
        sessionStorage.setItem(pending.key, JSON.stringify(pending.data));
        this.pendingWrites.delete(key);
        successCount++;
      } catch (error) {
        console.error(`[DebouncedSessionStorage] Failed to write ${key}:`, error);
        errorCount++;
      }
    }

    const elapsed = performance.now() - startTime;

    if (errorCount > 0 || elapsed > 50) {
      console.log(
        `[DebouncedSessionStorage] Batch write complete: ${successCount} success, ${errorCount} errors, ${elapsed.toFixed(1)}ms`
      );
    }

    this.isWriting = false;

    // If there are more pending writes, schedule another batch
    if (this.pendingWrites.size > 0) {
      this.scheduleWrite();
    }
  }
}

export const debouncedSessionStorage = new DebouncedSessionStorageService();

// Add event listener to flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    debouncedStorage.flush();
  });

  // Also flush on visibility change (mobile background)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      debouncedStorage.flush();
    }
  });
}

// Export convenience functions
export const setDebouncedItem = (key: string, data: any, immediate = false) =>
  debouncedStorage.setItem(key, data, immediate);

export const getDebouncedItem = <T = any>(key: string): T | null =>
  debouncedStorage.getItem<T>(key);

export const flushDebouncedStorage = () =>
  debouncedStorage.flush();

// Export session storage convenience functions
export const setDebouncedSessionItem = (key: string, data: any, immediate = false) =>
  debouncedSessionStorage.setItem(key, data, immediate);

export const getDebouncedSessionItem = <T = any>(key: string): T | null =>
  debouncedSessionStorage.getItem<T>(key);

export const flushDebouncedSessionStorage = () =>
  debouncedSessionStorage.flush();