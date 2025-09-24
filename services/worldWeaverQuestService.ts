/**
 * WorldWeaver Quest Integration Service
 * Bridges WorldWeaver's narrative quests with the game's quest tracking system
 */

import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { WorldWeaverQuest, QuestNPC } from './worldWeaverService';
import { questService } from './questService';
import { LogService } from './logService';
import { generateId } from '../utils/idGenerator';
import { questStorageCleanupService } from './questStorageCleanupService';
import { worldWeaverQuestIntegrator } from './worldWeaverQuestIntegrator';
import { MapData } from '../types';

export interface WorldWeaverQuestEntry {
  questId: string;
  originalQuest: WorldWeaverQuest;
  spawnedNPCs: string[]; // IDs of NPCs spawned for this quest
  progressData?: { [stageId: string]: any }; // Progress tracking for each stage
}

class WorldWeaverQuestService {
  private activeWorldWeaverQuests: Map<string, WorldWeaverQuestEntry> = new Map();

  constructor() {
    // Load existing WorldWeaver quests on initialization
    this.loadWorldWeaverQuests();
  }

  /**
   * Add a WorldWeaver quest to the game's quest system (enhanced version)
   */
  async addWorldWeaverQuest(
    weaverQuest: WorldWeaverQuest,
    mapData?: MapData,
    playerLocation?: { x: number; y: number },
    culturalZone?: string,
    era?: string
  ): Promise<string> {
    console.log(`[WorldWeaverQuest] Adding quest: "${weaverQuest.title}"`);

    // If map data is provided, use the enhanced integrator
    if (mapData && playerLocation && culturalZone && era) {
      return this.addEnhancedWorldWeaverQuest(weaverQuest, mapData, playerLocation, culturalZone, era);
    }

    // Otherwise, fall back to the legacy method
    return this.addLegacyWorldWeaverQuest(weaverQuest);
  }

  /**
   * Enhanced quest integration using map-aware coordinates
   */
  private async addEnhancedWorldWeaverQuest(
    weaverQuest: WorldWeaverQuest,
    mapData: MapData,
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string
  ): Promise<string> {
    try {
      console.log('[WorldWeaverQuest] Using enhanced integration with map coordinates');

      // Use the enhanced integrator to create a fully functional quest
      const context = { mapData, playerLocation, culturalZone, era };
      const questId = await worldWeaverQuestIntegrator.integrateQuest(weaverQuest, context);

      // Store the WorldWeaver quest data for reference
      const weaverEntry: WorldWeaverQuestEntry = {
        questId,
        originalQuest: weaverQuest,
        spawnedNPCs: [] // Will be populated by the integrator
      };

      this.activeWorldWeaverQuests.set(questId, weaverEntry);

      // Use minimal localStorage storage
      this.storeQuestDataMinimal(questId, weaverQuest);

      console.log(`[WorldWeaverQuest] Successfully integrated enhanced quest: "${weaverQuest.title}"`);
      return questId;

    } catch (error) {
      console.error('[WorldWeaverQuest] Enhanced integration failed, falling back to legacy:', error);
      return this.addLegacyWorldWeaverQuest(weaverQuest);
    }
  }

  /**
   * Legacy quest integration (fallback)
   */
  private addLegacyWorldWeaverQuest(weaverQuest: WorldWeaverQuest): string {
    try {
      console.log('[WorldWeaverQuest] Using legacy integration method');

      // 1. Create minimal quest entry for quest system
      const questEntry = this.createMinimalQuest(weaverQuest);

      // 2. Add to quest system
      questService.addQuest(questEntry);

      // 3. Add detailed journal entry
      this.createQuestJournalEntry(weaverQuest, questEntry.id);

      // 4. Store original data for reference
      const weaverEntry: WorldWeaverQuestEntry = {
        questId: questEntry.id,
        originalQuest: weaverQuest,
        spawnedNPCs: []
      };

      this.activeWorldWeaverQuests.set(questEntry.id, weaverEntry);
      this.storeQuestDataMinimal(questEntry.id, weaverQuest);

      console.log('[WorldWeaverQuest] Successfully added legacy quest:', weaverQuest.title);
      return questEntry.id;

    } catch (error) {
      console.error('[WorldWeaverQuest] Failed to add quest:', error);
      throw error;
    }
  }

  /**
   * Create a minimal quest entry that works with the existing quest system
   */
  private createMinimalQuest(weaverQuest: WorldWeaverQuest): Quest {
    const questId = generateId();

    // Create a single narrative objective that directs players to journal
    const narrativeObjective: QuestObjective = {
      id: `${questId}_narrative`,
      type: 'gather_information',
      description: `Check your journal for detailed quest information about "${weaverQuest.title}"`,
      completed: false
    };

    // Create basic rewards from first stage
    const rewards: QuestReward[] = [
      {
        type: 'reputation',
        value: 10,
        description: 'Gained reputation for helping the community',
        guaranteed: true
      }
    ];

    const quest: Quest = {
      id: questId,
      title: weaverQuest.title,
      description: weaverQuest.description,
      category: 'social', // WorldWeaver quests are typically social/narrative focused
      objectives: [narrativeObjective],
      currentObjectiveIndex: 0,
      rewards,
      startTime: Date.now(),
      status: 'active',
      historicalContext: weaverQuest.historicalContext,
      isLLMGenerated: true,
      difficulty: 'medium'
    };

    return quest;
  }

  /**
   * Add detailed quest information to journal
   */
  private createQuestJournalEntry(weaverQuest: WorldWeaverQuest, questId: string): void {
    // Format quest stages for journal
    const stageText = weaverQuest.stages.map((stage, index) => {
      const stageNum = index + 1;
      let stageContent = `**Stage ${stageNum}: ${stage.objective}**\n`;
      stageContent += `${stage.description}\n`;

      if (stage.locationHint) {
        stageContent += `*Location: ${stage.locationHint}*\n`;
      }

      if (stage.dialogue && stage.dialogue.length > 0) {
        stageContent += `\n*Expected dialogue:*\n`;
        stage.dialogue.forEach(line => {
          stageContent += `> ${line}\n`;
        });
      }

      return stageContent;
    }).join('\n---\n\n');

    // Format NPCs
    const npcText = weaverQuest.specialNPCs.map(npc => {
      return `**${npc.name}** - ${npc.profession || npc.role}\n${npc.personality}\n`;
    }).join('\n');

    const journalContent = `# ${weaverQuest.title}

${weaverQuest.description}

## Historical Context
${weaverQuest.historicalContext}

## Key Characters
${npcText}

## Quest Stages
${stageText}

---
*This is an AI-generated historical quest. Use this information to guide your interactions in the world.*`;

    // Add to journal using the existing journal service
    const journalEntry = {
      id: `quest_${questId}`,
      title: `📜 ${weaverQuest.title}`,
      content: journalContent,
      location: 'Quest Journal',
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      isQuestEntry: true,
      questId: questId
    };

    // Store in localStorage (matching existing journal pattern)
    const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    existingEntries.unshift(journalEntry); // Add to beginning
    localStorage.setItem('journalEntries', JSON.stringify(existingEntries));

    console.log('[WorldWeaverQuest] Added journal entry for quest:', weaverQuest.title);
  }

  /**
   * Get the original WorldWeaver quest data
   */
  getOriginalQuest(questId: string): WorldWeaverQuest | null {
    const entry = this.activeWorldWeaverQuests.get(questId);
    if (entry) {
      return entry.originalQuest;
    }

    // Try loading from localStorage
    try {
      const stored = localStorage.getItem(`ww_quest_${questId}`);
      if (stored) {
        const parsedEntry: WorldWeaverQuestEntry = JSON.parse(stored);
        this.activeWorldWeaverQuests.set(questId, parsedEntry);
        return parsedEntry.originalQuest;
      }
    } catch (error) {
      console.error('[WorldWeaverQuest] Error loading quest from storage:', error);
    }

    return null;
  }

  /**
   * Check if a quest is a WorldWeaver quest
   */
  isWorldWeaverQuest(questId: string): boolean {
    return this.activeWorldWeaverQuests.has(questId) ||
           localStorage.getItem(`ww_quest_${questId}`) !== null;
  }

  /**
   * Add NPC ID to quest's spawned NPCs list
   */
  addSpawnedNPC(questId: string, npcId: string): void {
    const entry = this.activeWorldWeaverQuests.get(questId);
    if (entry) {
      entry.spawnedNPCs.push(npcId);
      localStorage.setItem(`ww_quest_${questId}`, JSON.stringify(entry));
    }
  }

  /**
   * Get spawned NPC IDs for a quest
   */
  getSpawnedNPCs(questId: string): string[] {
    const entry = this.activeWorldWeaverQuests.get(questId);
    return entry ? entry.spawnedNPCs : [];
  }

  /**
   * Store minimal quest data to prevent localStorage bloat
   */
  private storeQuestDataMinimal(questId: string, weaverQuest: WorldWeaverQuest): void {
    try {
      // Store only essential data to prevent quota exceeded errors
      const minimalData = {
        title: weaverQuest.title,
        npcName: weaverQuest.specialNPC?.name || 'Quest Giver',
        stages: weaverQuest.stages.length,
        timestamp: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Check data size before storing
      const dataSize = JSON.stringify(minimalData).length;
      if (dataSize > 2000) { // 2KB limit per quest
        console.warn(`[WorldWeaverQuest] Quest data too large: ${dataSize} bytes, skipping storage`);
        return;
      }

      const success = questStorageCleanupService.safeSetItem(`ww_quest_${questId}`, JSON.stringify(minimalData));
      if (success) {
        console.log(`[WorldWeaverQuest] Stored minimal quest data (${dataSize} bytes)`);
      } else {
        console.warn(`[WorldWeaverQuest] Failed to store quest data for ${questId} - storage full`);
      }

    } catch (error) {
      console.error('[WorldWeaverQuest] Failed to store minimal quest data:', error);
      // Continue without storing - quest will still work
    }
  }

  /**
   * Clean up quest data when quest is completed/abandoned
   */
  cleanupQuest(questId: string): void {
    this.activeWorldWeaverQuests.delete(questId);
    localStorage.removeItem(`ww_quest_${questId}`);

    // Remove journal entry
    const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const filteredEntries = existingEntries.filter(
      (entry: any) => entry.questId !== questId
    );
    localStorage.setItem('journalEntries', JSON.stringify(filteredEntries));
  }

  /**
   * Load WorldWeaver quests from localStorage on startup
   */
  private loadWorldWeaverQuests(): void {
    try {
      // Get all localStorage keys that match WorldWeaver quest pattern
      const wwQuestKeys = Object.keys(localStorage).filter(key => key.startsWith('ww_quest_'));

      for (const key of wwQuestKeys) {
        try {
          const questEntry = JSON.parse(localStorage.getItem(key) || '{}');
          if (questEntry.questId && questEntry.originalQuest) {
            this.activeWorldWeaverQuests.set(questEntry.questId, questEntry);
            console.log(`[WorldWeaverQuest] Restored quest: ${questEntry.originalQuest.title}`);
          }
        } catch (error) {
          console.error(`[WorldWeaverQuest] Failed to load quest from ${key}:`, error);
          // Clean up corrupted entry
          localStorage.removeItem(key);
        }
      }

      console.log(`[WorldWeaverQuest] Loaded ${this.activeWorldWeaverQuests.size} WorldWeaver quests from storage`);
    } catch (error) {
      console.error('[WorldWeaverQuest] Failed to load WorldWeaver quests:', error);
    }
  }

  /**
   * Restore WorldWeaver quest NPCs after game reload
   */
  restoreQuestNPCs(questId: string, mapData: any, playerLocation: { x: number; y: number }): string[] {
    const entry = this.activeWorldWeaverQuests.get(questId);
    if (!entry || !entry.originalQuest) return [];

    // Check if NPCs are already spawned
    if (entry.spawnedNPCs.length > 0) {
      const existingNPCs = entry.spawnedNPCs.filter(npcId =>
        mapData.npcs?.some((npc: any) => npc.id === npcId)
      );

      if (existingNPCs.length === entry.originalQuest.specialNPCs.length) {
        console.log(`[WorldWeaverQuest] All NPCs already exist for quest: ${entry.originalQuest.title}`);
        return existingNPCs;
      }
    }

    // Re-spawn missing NPCs
    console.log(`[WorldWeaverQuest] Re-spawning NPCs for quest: ${entry.originalQuest.title}`);

    // This would need the worldWeaverNpcService, but to avoid circular imports,
    // we'll emit an event that can be handled externally
    window.dispatchEvent(new CustomEvent('worldWeaverQuestRestore', {
      detail: {
        questId,
        originalQuest: entry.originalQuest,
        playerLocation
      }
    }));

    return entry.spawnedNPCs;
  }

  /**
   * Update quest progress tracking
   */
  updateQuestProgress(questId: string, stageId: string, progressData: any): void {
    const entry = this.activeWorldWeaverQuests.get(questId);
    if (!entry) return;

    // Store progress data for this stage
    if (!entry.progressData) {
      entry.progressData = {};
    }
    entry.progressData[stageId] = {
      ...progressData,
      timestamp: Date.now()
    };

    // Update localStorage
    localStorage.setItem(`ww_quest_${questId}`, JSON.stringify(entry));
    console.log(`[WorldWeaverQuest] Updated progress for quest ${questId}, stage ${stageId}`);
  }

  /**
   * Get quest progress for a specific stage
   */
  getQuestProgress(questId: string, stageId: string): any {
    const entry = this.activeWorldWeaverQuests.get(questId);
    return entry?.progressData?.[stageId] || null;
  }

  /**
   * Get all WorldWeaver quests (for debugging/admin purposes)
   */
  getAllWorldWeaverQuests(): WorldWeaverQuestEntry[] {
    return Array.from(this.activeWorldWeaverQuests.values());
  }
}

// Export singleton instance
export const worldWeaverQuestService = new WorldWeaverQuestService();