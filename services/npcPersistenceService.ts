/**
 * services/npcPersistenceService.ts
 * Handles saving and loading NPC state including conversation history, opinions, and memories
 */

import { NpcEntity, NpcMemory } from '../types';

interface PersistedNpcData {
  id: string;
  name: string;
  memory: {
    opinionOfPlayer: number;
    knownFactsAboutPlayer: string[]; // Convert Set to Array for JSON
    relationships: Array<[string, { opinion: number; type: 'family' | 'friend' | 'rival' }]>; // Convert Map to Array
    conversationSummaries: string[];
  };
  // Add other important persistent fields
  x: number;
  y: number;
  health: any; // CharacterHealth
  currency: number;
  inventory: any[]; // Item[]
  attributes?: any[]; // AttributeBadge[]
}

interface PersistedNpcStore {
  version: number;
  lastSaved: string;
  mapSeed: number;
  npcs: Record<string, PersistedNpcData>;
}

class NpcPersistenceService {
  private readonly STORAGE_KEY = 'uhs_npc_persistence';
  private readonly CURRENT_VERSION = 1;
  private readonly MAX_NPCS_PER_MAP = 200; // Limit to prevent storage bloat

  /**
   * Save NPCs to localStorage
   */
  saveNpcs(npcs: NpcEntity[], mapSeed: number): void {
    try {
      // Convert NPCs to persistable format
      const persistedNpcs: Record<string, PersistedNpcData> = {};
      
      // Limit number of NPCs to save (prioritize those with conversation history)
      const npcsToSave = this.prioritizeNpcs(npcs);
      
      for (const npc of npcsToSave) {
        persistedNpcs[npc.id] = this.convertNpcToPersistedData(npc);
      }

      const store: PersistedNpcStore = {
        version: this.CURRENT_VERSION,
        lastSaved: new Date().toISOString(),
        mapSeed,
        npcs: persistedNpcs
      };

      // Save to localStorage
      localStorage.setItem(this.getStorageKey(mapSeed), JSON.stringify(store));
      
      // Also save a list of all map seeds with saved NPCs
      this.updateSavedMapsList(mapSeed);
      
      console.log(`[NPC Persistence] Saved ${Object.keys(persistedNpcs).length} NPCs for map ${mapSeed}`);
    } catch (error) {
      console.error('[NPC Persistence] Failed to save NPCs:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded(mapSeed);
      }
    }
  }

  /**
   * Load NPCs from localStorage and merge with newly generated NPCs
   */
  loadAndMergeNpcs(newNpcs: NpcEntity[], mapSeed: number): NpcEntity[] {
    try {
      const storeJson = localStorage.getItem(this.getStorageKey(mapSeed));
      if (!storeJson) {
        console.log(`[NPC Persistence] No saved NPCs for map ${mapSeed}`);
        return newNpcs;
      }

      const store: PersistedNpcStore = JSON.parse(storeJson);
      
      // Check version compatibility
      if (store.version !== this.CURRENT_VERSION) {
        console.warn(`[NPC Persistence] Version mismatch. Expected ${this.CURRENT_VERSION}, got ${store.version}`);
        // Could implement migration here if needed
      }

      // Create a map of new NPCs by position for matching
      const npcsByPosition = new Map<string, NpcEntity>();
      for (const npc of newNpcs) {
        const posKey = `${npc.x},${npc.y}`;
        npcsByPosition.set(posKey, npc);
      }

      // Merge saved data into NPCs
      let mergedCount = 0;
      for (const savedNpc of Object.values(store.npcs)) {
        const posKey = `${savedNpc.x},${savedNpc.y}`;
        const matchingNpc = npcsByPosition.get(posKey);
        
        if (matchingNpc) {
          // Merge saved data into the newly generated NPC
          this.mergePersistedData(matchingNpc, savedNpc);
          mergedCount++;
        }
      }

      console.log(`[NPC Persistence] Restored memories for ${mergedCount} NPCs from map ${mapSeed}`);
      return newNpcs;
    } catch (error) {
      console.error('[NPC Persistence] Failed to load NPCs:', error);
      return newNpcs;
    }
  }

  /**
   * Clear saved NPCs for a specific map
   */
  clearMapNpcs(mapSeed: number): void {
    localStorage.removeItem(this.getStorageKey(mapSeed));
    this.updateSavedMapsList(mapSeed, true);
    console.log(`[NPC Persistence] Cleared NPCs for map ${mapSeed}`);
  }

  /**
   * Clear all saved NPCs
   */
  clearAllNpcs(): void {
    const savedMaps = this.getSavedMapsList();
    for (const mapSeed of savedMaps) {
      localStorage.removeItem(this.getStorageKey(mapSeed));
    }
    localStorage.removeItem('uhs_saved_maps_list');
    console.log('[NPC Persistence] Cleared all saved NPCs');
  }

  /**
   * Get storage size info
   */
  getStorageInfo(): { usedKB: number; mapsCount: number } {
    const savedMaps = this.getSavedMapsList();
    let totalSize = 0;
    
    for (const mapSeed of savedMaps) {
      const data = localStorage.getItem(this.getStorageKey(mapSeed));
      if (data) {
        totalSize += data.length * 2; // Approximate bytes (UTF-16)
      }
    }

    return {
      usedKB: Math.round(totalSize / 1024),
      mapsCount: savedMaps.length
    };
  }

  // Private helper methods

  private getStorageKey(mapSeed: number): string {
    return `${this.STORAGE_KEY}_${mapSeed}`;
  }

  private prioritizeNpcs(npcs: NpcEntity[]): NpcEntity[] {
    // Sort NPCs by importance (those with conversation history first)
    const sorted = [...npcs].sort((a, b) => {
      const aImportance = this.calculateNpcImportance(a);
      const bImportance = this.calculateNpcImportance(b);
      return bImportance - aImportance;
    });

    return sorted.slice(0, this.MAX_NPCS_PER_MAP);
  }

  private calculateNpcImportance(npc: NpcEntity): number {
    let score = 0;
    
    // Has conversation history
    if (npc.memory.conversationSummaries && npc.memory.conversationSummaries.length > 0) {
      score += 100 * npc.memory.conversationSummaries.length;
    }
    
    // Has opinion different from default
    if (npc.memory.opinionOfPlayer !== 50) {
      score += Math.abs(npc.memory.opinionOfPlayer - 50);
    }
    
    // Has known facts about player
    if (npc.memory.knownFactsAboutPlayer && npc.memory.knownFactsAboutPlayer.size > 0) {
      score += 50 * npc.memory.knownFactsAboutPlayer.size;
    }
    
    // Has name (was interacted with)
    if (npc.name && npc.name !== 'Stranger' && npc.name !== 'Villager') {
      score += 50;
    }

    return score;
  }

  private convertNpcToPersistedData(npc: NpcEntity): PersistedNpcData {
    return {
      id: npc.id,
      name: npc.name,
      memory: {
        opinionOfPlayer: npc.memory.opinionOfPlayer,
        knownFactsAboutPlayer: Array.from(npc.memory.knownFactsAboutPlayer || new Set()),
        relationships: Array.from(npc.memory.relationships?.entries() || []),
        conversationSummaries: npc.memory.conversationSummaries || []
      },
      x: npc.x,
      y: npc.y,
      health: npc.health,
      currency: npc.currency,
      inventory: npc.inventory,
      attributes: npc.attributes
    };
  }

  private mergePersistedData(npc: NpcEntity, saved: PersistedNpcData): void {
    // Restore memory
    npc.memory = {
      opinionOfPlayer: saved.memory.opinionOfPlayer,
      knownFactsAboutPlayer: new Set(saved.memory.knownFactsAboutPlayer),
      relationships: new Map(saved.memory.relationships),
      conversationSummaries: saved.memory.conversationSummaries
    };

    // Restore name if it was set
    if (saved.name && saved.name !== 'Stranger' && saved.name !== 'Villager') {
      npc.name = saved.name;
    }

    // Optionally restore other persistent data
    if (saved.health) {
      npc.health = saved.health;
    }
    if (saved.currency !== undefined) {
      npc.currency = saved.currency;
    }
    if (saved.inventory) {
      npc.inventory = saved.inventory;
    }
    if (saved.attributes) {
      npc.attributes = saved.attributes;
    }
  }

  private getSavedMapsList(): number[] {
    try {
      const list = localStorage.getItem('uhs_saved_maps_list');
      return list ? JSON.parse(list) : [];
    } catch {
      return [];
    }
  }

  private updateSavedMapsList(mapSeed: number, remove = false): void {
    try {
      let list = this.getSavedMapsList();
      
      if (remove) {
        list = list.filter(seed => seed !== mapSeed);
      } else if (!list.includes(mapSeed)) {
        list.push(mapSeed);
        // Keep only last 10 maps
        if (list.length > 10) {
          const removed = list.shift();
          if (removed) {
            localStorage.removeItem(this.getStorageKey(removed));
          }
        }
      }
      
      localStorage.setItem('uhs_saved_maps_list', JSON.stringify(list));
    } catch (error) {
      console.error('[NPC Persistence] Failed to update saved maps list:', error);
    }
  }

  private handleStorageQuotaExceeded(mapSeed: number): void {
    console.warn('[NPC Persistence] Storage quota exceeded, clearing old data...');
    
    // Clear oldest saved maps
    const savedMaps = this.getSavedMapsList();
    if (savedMaps.length > 0) {
      const toRemove = Math.floor(savedMaps.length / 2); // Remove half
      for (let i = 0; i < toRemove; i++) {
        const oldSeed = savedMaps[i];
        if (oldSeed !== mapSeed) {
          localStorage.removeItem(this.getStorageKey(oldSeed));
        }
      }
      
      // Update the list
      const remaining = savedMaps.slice(toRemove);
      localStorage.setItem('uhs_saved_maps_list', JSON.stringify(remaining));
      
      // Try saving again
      console.log('[NPC Persistence] Retrying save after clearing old data...');
    }
  }

  /**
   * Save NPC state to sessionStorage for temporary persistence
   * Useful for preserving state during modal transitions
   */
  saveNpcToSession(npc: NpcEntity): void {
    try {
      const key = `uhs_npc_session_${npc.id}`;
      const data = this.convertNpcToPersistedData(npc);
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`[NPC Persistence] Failed to save NPC ${npc.id} to session:`, error);
    }
  }

  /**
   * Load NPC state from sessionStorage
   */
  loadNpcFromSession(npcId: string): PersistedNpcData | null {
    try {
      const key = `uhs_npc_session_${npcId}`;
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`[NPC Persistence] Failed to load NPC ${npcId} from session:`, error);
      return null;
    }
  }

  /**
   * Clear session storage for NPCs
   */
  clearSessionNpcs(): void {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.startsWith('uhs_npc_session_')) {
        sessionStorage.removeItem(key);
      }
    }
  }
}

// Export singleton instance
export const npcPersistenceService = new NpcPersistenceService();