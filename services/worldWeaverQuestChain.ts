/**
 * WorldWeaver Quest Chain System
 * Handles automatic quest chaining, follow-up generation, and narrative continuity
 */

import { WorldWeaverQuest } from './worldWeaverService';
import { Quest } from '../types/questTypes';
import { MapData } from '../types';
import { questService } from './questService';
import { worldWeaverService } from './worldWeaverService';
import { worldWeaverQuestIntegrator } from './worldWeaverQuestIntegrator';
import { mapQuestAnalyzer } from './mapQuestAnalyzer';
import { generateId } from '../utils/idGenerator';
import { questStorageCleanupService } from './questStorageCleanupService';

interface QuestChainEntry {
  chainId: string;
  questIds: string[];
  currentQuestIndex: number;
  originalPrompt: string;
  context: ChainContext;
  completedQuests: CompletedQuestSummary[];
  status: 'active' | 'completed' | 'failed';
}

interface ChainContext {
  mapData: MapData;
  playerLocation: { x: number; y: number };
  culturalZone: string;
  era: string;
  year: number;
  location: string;
}

interface CompletedQuestSummary {
  questId: string;
  title: string;
  outcome: string;
  choicesMade: string[];
  npcsInteracted: string[];
}

export class WorldWeaverQuestChain {
  private activeChains: Map<string, QuestChainEntry> = new Map();
  private questToChainMap: Map<string, string> = new Map(); // questId -> chainId

  constructor() {
    // Initialization will be done explicitly via initialize() method
    // to ensure other services are ready first
  }

  /**
   * Create a new quest chain starting with an initial prompt
   */
  async createQuestChain(
    initialPrompt: string,
    context: ChainContext
  ): Promise<string> {
    const chainId = generateId();

    console.log(`[WorldWeaverChain] Creating new quest chain: ${chainId}`);
    console.log(`[WorldWeaverChain] Initial prompt: "${initialPrompt}"`);

    try {
      // Generate the first quest in the chain
      const firstQuest = await this.generateChainQuest(initialPrompt, context, []);

      if (!firstQuest) {
        throw new Error('Failed to generate initial quest');
      }

      // Integrate the first quest
      const questId = await worldWeaverQuestIntegrator.integrateQuest(firstQuest, context);

      // Create chain entry
      const chainEntry: QuestChainEntry = {
        chainId,
        questIds: [questId],
        currentQuestIndex: 0,
        originalPrompt: initialPrompt,
        context,
        completedQuests: [],
        status: 'active'
      };

      this.activeChains.set(chainId, chainEntry);
      this.questToChainMap.set(questId, chainId);

      // Mark the quest as part of a chain
      const gameQuest = questService.getQuestById(questId);
      if (gameQuest) {
        gameQuest.chainId = chainId;
        gameQuest.followUpQuests = ['auto_generate']; // Signal for auto-generation
      }

      this.storeChainData(chainId, chainEntry);

      console.log(`[WorldWeaverChain] Created chain ${chainId} with initial quest: "${firstQuest.title}"`);
      return chainId;

    } catch (error) {
      console.error(`[WorldWeaverChain] Failed to create quest chain:`, error);
      throw error;
    }
  }

  /**
   * Handle quest completion and generate follow-up quests
   */
  async handleQuestCompletion(completedQuestId: string): Promise<void> {
    const chainId = this.questToChainMap.get(completedQuestId);
    if (!chainId) {
      console.log(`[WorldWeaverChain] Quest ${completedQuestId} is not part of a chain`);
      return;
    }

    const chainEntry = this.activeChains.get(chainId);
    if (!chainEntry || chainEntry.status !== 'active') {
      console.log(`[WorldWeaverChain] Chain ${chainId} is not active`);
      return;
    }

    console.log(`[WorldWeaverChain] Handling completion of quest ${completedQuestId} in chain ${chainId}`);

    try {
      // Record the completed quest
      const completedQuest = questService.getQuestById(completedQuestId);
      if (completedQuest) {
        const questSummary: CompletedQuestSummary = {
          questId: completedQuestId,
          title: completedQuest.title,
          outcome: 'completed', // Could be enhanced with specific outcomes
          choicesMade: [], // Could track player choices
          npcsInteracted: this.getInteractedNPCs(completedQuest)
        };

        chainEntry.completedQuests.push(questSummary);
        chainEntry.currentQuestIndex++;
      }

      // Check if we should generate a follow-up quest
      const shouldContinue = this.shouldGenerateFollowUp(chainEntry);

      if (shouldContinue && chainEntry.completedQuests.length < 5) { // Limit chain length
        await this.generateFollowUpQuest(chainEntry);
      } else {
        // Complete the chain
        chainEntry.status = 'completed';
        console.log(`[WorldWeaverChain] Chain ${chainId} completed with ${chainEntry.completedQuests.length} quests`);
      }

      this.storeChainData(chainId, chainEntry);

    } catch (error) {
      console.error(`[WorldWeaverChain] Error handling quest completion:`, error);
      chainEntry.status = 'failed';
      this.storeChainData(chainId, chainEntry);
    }
  }

  /**
   * Generate a follow-up quest based on chain context and completed quests
   */
  private async generateFollowUpQuest(chainEntry: QuestChainEntry): Promise<void> {
    console.log(`[WorldWeaverChain] Generating follow-up quest for chain ${chainEntry.chainId}`);

    // Create context-aware prompt for follow-up
    const followUpPrompt = this.createFollowUpPrompt(chainEntry);

    // Generate new locations for variety (refresh the map analysis)
    const currentLocations = mapQuestAnalyzer.extractQuestLocations(
      chainEntry.context.mapData,
      chainEntry.context.playerLocation
    );

    // Update context with fresh map data
    const updatedContext = {
      ...chainEntry.context,
      playerLocation: this.estimatePlayerLocation(chainEntry) // Estimate where player might be now
    };

    try {
      // Generate the follow-up quest
      const followUpQuest = await this.generateChainQuest(
        followUpPrompt,
        updatedContext,
        chainEntry.completedQuests
      );

      if (followUpQuest) {
        // Integrate the new quest
        const questId = await worldWeaverQuestIntegrator.integrateQuest(followUpQuest, updatedContext);

        // Add to chain
        chainEntry.questIds.push(questId);
        this.questToChainMap.set(questId, chainEntry.chainId);

        // Mark as part of chain
        const gameQuest = questService.getQuestById(questId);
        if (gameQuest) {
          gameQuest.chainId = chainEntry.chainId;
          gameQuest.followUpQuests = ['auto_generate'];
        }

        console.log(`[WorldWeaverChain] Generated follow-up quest: "${followUpQuest.title}"`);

        // Delay the quest start slightly for narrative flow
        setTimeout(() => {
          this.showQuestChainNotification(followUpQuest.title, chainEntry.completedQuests.length + 1);
        }, 2000);

      } else {
        console.warn(`[WorldWeaverChain] Failed to generate follow-up quest for chain ${chainEntry.chainId}`);
        chainEntry.status = 'completed';
      }

    } catch (error) {
      console.error(`[WorldWeaverChain] Error generating follow-up quest:`, error);
      chainEntry.status = 'completed'; // End chain on error
    }
  }

  /**
   * Generate a quest for the chain with context awareness
   */
  private async generateChainQuest(
    prompt: string,
    context: ChainContext,
    previousQuests: CompletedQuestSummary[]
  ): Promise<WorldWeaverQuest | undefined> {

    // Use the enhanced chain-aware quest generation
    const questSummaries = previousQuests.map(pq => ({
      questId: pq.questId,
      title: pq.title,
      outcome: pq.outcome
    }));

    return await worldWeaverService.generateQuestForChain(
      prompt,
      context.year,
      context.location,
      context.mapData,
      context.playerLocation,
      questSummaries.length > 0 ? questSummaries : undefined
    );
  }

  /**
   * Create a context-aware prompt for follow-up quests
   */
  private createFollowUpPrompt(chainEntry: QuestChainEntry): string {
    const lastQuest = chainEntry.completedQuests[chainEntry.completedQuests.length - 1];
    const questCount = chainEntry.completedQuests.length;

    // Create narrative progression based on completed quests
    let narrative = '';
    if (questCount === 1) {
      narrative = `Following up on "${lastQuest.title}", what happens next? The initial situation has been resolved, but new complications or opportunities have emerged.`;
    } else if (questCount === 2) {
      narrative = `The situation that began with "${chainEntry.completedQuests[0].title}" is developing further. After completing "${lastQuest.title}", what is the next logical step in this unfolding story?`;
    } else {
      narrative = `This ongoing situation has seen several developments. Most recently, "${lastQuest.title}" was resolved. What is the natural conclusion or final challenge of this story arc?`;
    }

    return `${narrative} Continue the story in ${chainEntry.context.location} during ${chainEntry.context.year}. Create a quest that builds on previous events but is still simple and completable.`;
  }

  /**
   * Determine if a follow-up quest should be generated
   */
  private shouldGenerateFollowUp(chainEntry: QuestChainEntry): boolean {
    // Generate follow-up if:
    // 1. Less than 3 quests completed (keep chains reasonably short)
    // 2. Last quest was completed successfully
    // 3. Chain hasn't been marked as complete

    const maxChainLength = 3;
    const questCount = chainEntry.completedQuests.length;

    if (questCount >= maxChainLength) {
      console.log(`[WorldWeaverChain] Chain ${chainEntry.chainId} reached max length (${maxChainLength})`);
      return false;
    }

    if (questCount === 0) {
      console.log(`[WorldWeaverChain] No completed quests in chain ${chainEntry.chainId}`);
      return false;
    }

    const lastQuest = chainEntry.completedQuests[questCount - 1];
    if (lastQuest.outcome !== 'completed') {
      console.log(`[WorldWeaverChain] Last quest in chain ${chainEntry.chainId} was not completed successfully`);
      return false;
    }

    // 70% chance to continue after first quest, 50% after second
    const continueProbability = questCount === 1 ? 0.7 : 0.5;
    const shouldContinue = Math.random() < continueProbability;

    console.log(`[WorldWeaverChain] Chain ${chainEntry.chainId} continuation decision: ${shouldContinue} (${questCount} quests completed)`);
    return shouldContinue;
  }

  /**
   * Estimate player location based on completed quests
   */
  private estimatePlayerLocation(chainEntry: QuestChainEntry): { x: number; y: number } {
    // For now, return the original location
    // Could be enhanced to track actual player movement
    return chainEntry.context.playerLocation;
  }

  /**
   * Get list of NPCs the player interacted with during a quest
   */
  private getInteractedNPCs(quest: Quest): string[] {
    // Extract NPC names from completed objectives
    const npcNames: string[] = [];

    quest.objectives.forEach(objective => {
      if (objective.type === 'talk_to_npc' && objective.completed && objective.targetNPC) {
        npcNames.push(objective.targetNPC);
      }
    });

    return npcNames;
  }

  /**
   * Show notification about new quest in chain
   */
  private showQuestChainNotification(questTitle: string, questNumber: number): void {
    console.log(`[WorldWeaverChain] 🔗 New quest available: "${questTitle}" (Quest ${questNumber} in chain)`);

    // Could dispatch a custom event for UI notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questChainProgression', {
        detail: {
          questTitle,
          questNumber,
          message: `A new quest "${questTitle}" has emerged from recent events...`
        }
      }));
    }
  }

  /**
   * Register handler for quest completion events
   */
  private registerQuestCompletionHandler(): void {
    if (typeof window !== 'undefined') {
      const handler = (event: CustomEvent) => {
        const questId = event.detail?.quest?.id;
        if (questId) {
          console.log(`[WorldWeaverChain] Received quest completion event for: ${questId}`);
          this.handleQuestCompletion(questId);
        }
      };

      window.addEventListener('questCompleted', handler as EventListener);

      // Store handler reference for cleanup
      (this as any)._completionHandler = handler;
    }
  }

  /**
   * Store chain data with size optimization
   */
  private storeChainData(chainId: string, chainEntry: QuestChainEntry): void {
    try {
      // Store minimal chain data
      const minimalChainData = {
        chainId: chainEntry.chainId,
        questIds: chainEntry.questIds,
        currentIndex: chainEntry.currentQuestIndex,
        status: chainEntry.status,
        questCount: chainEntry.completedQuests.length,
        expires: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 days
      };

      const dataSize = JSON.stringify(minimalChainData).length;
      if (dataSize > 3000) { // 3KB limit
        console.warn(`[WorldWeaverChain] Chain data too large: ${dataSize} bytes`);
        return;
      }

      const success = questStorageCleanupService.safeSetItem(`ww_chain_${chainId}`, JSON.stringify(minimalChainData));
      if (success) {
        console.log(`[WorldWeaverChain] Stored chain data (${dataSize} bytes)`);
      } else {
        console.warn(`[WorldWeaverChain] Failed to store chain data for ${chainId} - storage full`);
      }

    } catch (error) {
      console.error('[WorldWeaverChain] Failed to store chain data:', error);
    }
  }

  /**
   * Load chain data from localStorage
   */
  private loadChainData(): void {
    try {
      const chainKeys = Object.keys(localStorage).filter(key => key.startsWith('ww_chain_'));

      for (const key of chainKeys) {
        try {
          const chainData = JSON.parse(localStorage.getItem(key) || '{}');

          // Check if data has expired
          if (chainData.expires && chainData.expires < Date.now()) {
            localStorage.removeItem(key);
            continue;
          }

          if (chainData.chainId && chainData.questIds) {
            console.log(`[WorldWeaverChain] Restored chain: ${chainData.chainId} with ${chainData.questCount} completed quests`);

            // Create minimal chain entry (full context would need to be rebuilt)
            chainData.questIds.forEach((questId: string) => {
              this.questToChainMap.set(questId, chainData.chainId);
            });
          }
        } catch (error) {
          console.error(`[WorldWeaverChain] Failed to load chain from ${key}:`, error);
          localStorage.removeItem(key);
        }
      }

      console.log(`[WorldWeaverChain] Loaded ${chainKeys.length} quest chains`);
    } catch (error) {
      console.error('[WorldWeaverChain] Failed to load chain data:', error);
    }
  }

  /**
   * Get chain information for debugging
   */
  getChainInfo(chainId: string): QuestChainEntry | null {
    return this.activeChains.get(chainId) || null;
  }

  /**
   * Get all active chains
   */
  getAllActiveChains(): QuestChainEntry[] {
    return Array.from(this.activeChains.values()).filter(chain => chain.status === 'active');
  }

  /**
   * Clean up expired chains
   */
  cleanupExpiredChains(): void {
    const now = Date.now();
    const expiredChains: string[] = [];

    this.activeChains.forEach((chain, chainId) => {
      // Remove chains that have been inactive for over 7 days
      const lastActivity = chain.completedQuests.length > 0 ?
        Math.max(...chain.completedQuests.map(q => Date.now())) : // Would need actual completion timestamps
        now - (8 * 24 * 60 * 60 * 1000); // 8 days ago as fallback

      if (now - lastActivity > (7 * 24 * 60 * 60 * 1000)) {
        expiredChains.push(chainId);
      }
    });

    expiredChains.forEach(chainId => {
      this.activeChains.delete(chainId);
      localStorage.removeItem(`ww_chain_${chainId}`);
      console.log(`[WorldWeaverChain] Cleaned up expired chain: ${chainId}`);
    });

    if (expiredChains.length > 0) {
      console.log(`[WorldWeaverChain] Cleaned up ${expiredChains.length} expired chains`);
    }
  }

  /**
   * Initialize the quest chain system (call this after quest service is ready)
   */
  initialize(): void {
    console.log('[WorldWeaverChain] Initializing quest chain system...');

    // Initialize storage cleanup first
    questStorageCleanupService.initialize();

    this.loadChainData();
    this.registerQuestCompletionHandler();
    this.cleanupExpiredChains();
    console.log('[WorldWeaverChain] Quest chain system initialized');

    // Show storage stats in debug mode
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(questStorageCleanupService.getStorageReport());
    }
  }

  /**
   * Cleanup quest chain system
   */
  cleanup(): void {
    if (typeof window !== 'undefined' && (this as any)._completionHandler) {
      window.removeEventListener('questCompleted', (this as any)._completionHandler);
      delete (this as any)._completionHandler;
    }
    console.log('[WorldWeaverChain] Quest chain system cleaned up');
  }
}

// Export singleton instance
export const worldWeaverQuestChain = new WorldWeaverQuestChain();