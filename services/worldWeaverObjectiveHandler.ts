/**
 * WorldWeaver Objective Handler
 * Enhanced handlers for WorldWeaver quest objectives
 */

import { questService } from './questService';
import { worldWeaverQuestService } from './worldWeaverQuestService';
import { WorldWeaverQuest, QuestStage } from './worldWeaverService';

class WorldWeaverObjectiveHandler {

  /**
   * Handle NPC dialogue objectives for WorldWeaver quests
   */
  handleDialogueObjective(npcId: string, questId: string): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return; // Not a WorldWeaver quest, use standard handling
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    // Find the NPC in the quest data
    const questNPC = originalQuest.specialNPCs.find(npc =>
      npc.name.toLowerCase().includes(npcId.toLowerCase()) ||
      npcId.toLowerCase().includes(npc.name.toLowerCase())
    );

    if (questNPC) {
      console.log(`[WorldWeaverObjective] Handling dialogue with ${questNPC.name} for quest ${originalQuest.title}`);

      // Check if this dialogue triggers quest progression
      const currentStage = this.getCurrentQuestStage(originalQuest, questId);
      if (currentStage && this.isDialogueProgression(currentStage, questNPC)) {
        this.progressQuestStage(questId, currentStage.id);
      }
    }
  }

  /**
   * Handle location-based objectives with proximity checking
   */
  handleLocationObjective(playerLocation: { x: number; y: number }, questId: string): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'reach_location') return;

    // Check if player is near quest NPCs for location-based objectives
    const spawnedNPCs = worldWeaverQuestService.getSpawnedNPCs(questId);
    if (spawnedNPCs.length > 0) {
      const isNearQuestArea = this.isPlayerNearQuestArea(playerLocation, spawnedNPCs);

      if (isNearQuestArea) {
        console.log(`[WorldWeaverObjective] Player reached quest location for stage: ${currentStage.objective}`);
        this.progressQuestStage(questId, currentStage.id);
      }
    } else {
      // If no NPCs spawned yet, quest location objectives can't be checked
      console.warn(`[WorldWeaverObjective] No NPCs spawned for quest ${questId} - cannot check location objective`);
    }
  }

  /**
   * Handle time-based survival objectives
   */
  handleTimeObjective(questId: string, timeElapsed: number): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'survive_days') return;

    // Check if enough time has passed (basic implementation)
    // This could be enhanced to track specific quest start times
    console.log(`[WorldWeaverObjective] Checking time objective: ${timeElapsed}ms elapsed`);

    // For now, consider any significant time passage as completion
    // This could be made more sophisticated based on the specific quest requirements
    if (timeElapsed > 60000) { // 1 minute as placeholder for "one night"
      console.log(`[WorldWeaverObjective] Time objective completed for stage: ${currentStage.objective}`);
      this.progressQuestStage(questId, currentStage.id);
    }
  }

  /**
   * Handle item collection objectives
   */
  handleItemObjective(questId: string, itemId: string, quantity: number): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'obtain_item') return;

    // Check if the collected item matches quest requirements
    if (currentStage.targetId && currentStage.targetId.toLowerCase().includes(itemId.toLowerCase())) {
      console.log(`[WorldWeaverObjective] Item objective completed: ${itemId} x${quantity}`);
      this.progressQuestStage(questId, currentStage.id);
    }
  }

  /**
   * Handle observation objectives via journal entries
   */
  handleObservationObjective(questId: string, journalEntry: any): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'make_observations') return;

    // Check if journal entry contains relevant observations
    // Store observation count in quest progress
    const progressKey = `observations_${questId}_${currentStage.id}`;
    const currentCount = parseInt(localStorage.getItem(progressKey) || '0');
    const newCount = currentCount + 1;

    localStorage.setItem(progressKey, newCount.toString());

    // Check if target reached (default 3 observations)
    const targetCount = currentStage.targetAmount || 3;
    if (newCount >= targetCount) {
      console.log(`[WorldWeaverObjective] Observation objective completed: ${newCount}/${targetCount}`);
      this.progressQuestStage(questId, currentStage.id);
      localStorage.removeItem(progressKey); // Cleanup
    } else {
      console.log(`[WorldWeaverObjective] Observation progress: ${newCount}/${targetCount}`);
    }
  }

  /**
   * Handle journal reflection objectives
   */
  handleJournalReflectionObjective(questId: string, journalEntry: any): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'journal_reflection') return;

    // Check if journal entry contains reflection content
    // For now, any journal entry counts as reflection
    console.log(`[WorldWeaverObjective] Journal reflection objective completed`);
    this.progressQuestStage(questId, currentStage.id);
  }

  /**
   * Handle resource collection objectives
   */
  handleResourceObjective(questId: string, resourceId: string, quantity: number): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest, questId);
    if (!currentStage || currentStage.completionTrigger !== 'collect_resource') return;

    // Track resource collection progress
    const progressKey = `resources_${questId}_${currentStage.id}`;
    const currentAmount = parseInt(localStorage.getItem(progressKey) || '0');
    const newAmount = currentAmount + quantity;

    localStorage.setItem(progressKey, newAmount.toString());

    // Check if target reached
    const targetAmount = currentStage.targetAmount || 5;
    if (newAmount >= targetAmount) {
      console.log(`[WorldWeaverObjective] Resource collection objective completed: ${newAmount}/${targetAmount}`);
      this.progressQuestStage(questId, currentStage.id);
      localStorage.removeItem(progressKey); // Cleanup
    } else {
      console.log(`[WorldWeaverObjective] Resource collection progress: ${newAmount}/${targetAmount}`);
    }
  }

  /**
   * Get the current active stage for a WorldWeaver quest with progression tracking
   */
  private getCurrentQuestStage(quest: WorldWeaverQuest, questId: string): QuestStage | null {
    // Get the quest entry with progression data
    const entry = worldWeaverQuestService.getQuestEntry(questId);

    if (!entry) {
      console.warn('[WorldWeaverObjective] No quest entry found for', questId, '- defaulting to stage 0');
      return quest.stages[0] || null;
    }

    const currentIndex = entry.currentStageIndex || 0;

    if (currentIndex < quest.stages.length) {
      console.log(`[WorldWeaverObjective] Quest ${questId} is on stage ${currentIndex + 1}/${quest.stages.length}`);
      return quest.stages[currentIndex];
    }

    console.warn('[WorldWeaverObjective] Stage index out of bounds:', currentIndex, '- quest may be complete');
    return null;
  }

  /**
   * Check if dialogue with this NPC should progress the quest
   */
  private isDialogueProgression(stage: QuestStage, npc: any): boolean {
    return stage.completionTrigger === 'talk_to_npc' &&
           stage.targetId === npc.id;
  }

  /**
   * Progress to the next quest stage
   */
  private progressQuestStage(questId: string, stageId: string): void {
    // Update the quest progress in the standard quest system
    const quest = questService.getQuest(questId);
    if (quest && quest.objectives.length > 0) {
      const currentObjective = quest.objectives[quest.currentObjectiveIndex];
      if (currentObjective && !currentObjective.completed) {
        questService.completeObjective(questId, currentObjective.id);
        console.log(`[WorldWeaverObjective] Completed stage: ${stageId}`);

        // Advance to next stage
        const hasNextStage = worldWeaverQuestService.advanceToNextStage(questId);

        if (hasNextStage) {
          console.log(`[WorldWeaverObjective] Moving to next stage for quest ${questId}`);
          this.addStageCompletionJournalEntry(questId, stageId);
        } else {
          console.log(`[WorldWeaverObjective] Quest ${questId} completed - all stages done`);
          this.addStageCompletionJournalEntry(questId, stageId);
        }
      }
    }
  }

  /**
   * Add a journal entry when a quest stage is completed
   */
  private addStageCompletionJournalEntry(questId: string, stageId: string): void {
    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const stage = originalQuest.stages.find(s => s.id === stageId);
    if (!stage) return;

    const journalEntry = {
      id: `quest_progress_${questId}_${stageId}`,
      title: `📖 Quest Progress: ${originalQuest.title}`,
      content: `**Stage Completed:** ${stage.objective}\n\n${stage.description}\n\n*Continue following the quest details in your journal to proceed.*`,
      location: 'Quest Progress',
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      isQuestEntry: true,
      questId: questId
    };

    // Add to journal
    const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    existingEntries.unshift(journalEntry);
    localStorage.setItem('journalEntries', JSON.stringify(existingEntries));

    console.log(`[WorldWeaverObjective] Added stage completion journal entry: ${stage.objective}`);
  }

  /**
   * Check if player is near quest area using NPC positions from localStorage
   */
  private isPlayerNearQuestArea(playerLocation: { x: number; y: number }, npcIds: string[]): boolean {
    if (npcIds.length === 0) return false;

    // Get NPCs from MapContext via localStorage (fallback method)
    // In production, this should be passed as a parameter from the event
    const mapNpcsJson = localStorage.getItem('mapNpcs');
    if (!mapNpcsJson) {
      console.warn('[WorldWeaverObjective] No NPC data available for location check');
      return false;
    }

    try {
      const mapNpcs = JSON.parse(mapNpcsJson);

      // Check proximity to any quest NPC (within 10 tiles = close enough)
      const PROXIMITY_RADIUS = 10;

      for (const npcId of npcIds) {
        const npc = mapNpcs.find((n: any) => n.id === npcId);
        if (npc && npc.x !== undefined && npc.y !== undefined) {
          const distance = Math.sqrt(
            Math.pow(npc.x - playerLocation.x, 2) +
            Math.pow(npc.y - playerLocation.y, 2)
          );

          if (distance <= PROXIMITY_RADIUS) {
            console.log(`[WorldWeaverObjective] Player within ${distance.toFixed(1)} tiles of quest NPC ${npcId}`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('[WorldWeaverObjective] Error checking NPC proximity:', error);
      return false;
    }
  }

  /**
   * Initialize WorldWeaver objective handlers
   * Should be called when the game starts to register event listeners
   */
  initialize(): void {
    // Listen for NPC dialogue events
    window.addEventListener('npcDialogueCompleted', (event: any) => {
      const { npcId, questId } = event.detail;
      if (questId) {
        this.handleDialogueObjective(npcId, questId);
      }
    });

    // Listen for location changes
    window.addEventListener('playerLocationChanged', (event: any) => {
      const { location, activeQuests } = event.detail;
      activeQuests?.forEach((questId: string) => {
        this.handleLocationObjective(location, questId);
      });
    });

    // Listen for item acquisition
    window.addEventListener('itemAcquired', (event: any) => {
      const { itemId, quantity, activeQuests } = event.detail;
      activeQuests?.forEach((questId: string) => {
        this.handleItemObjective(questId, itemId, quantity);
        this.handleResourceObjective(questId, itemId, quantity);
      });
    });

    // Listen for journal entry events
    window.addEventListener('journalEntryAdded', (event: any) => {
      const { entry, activeQuests } = event.detail;
      if (activeQuests && Array.isArray(activeQuests)) {
        activeQuests.forEach((questId: string) => {
          this.handleObservationObjective(questId, entry);
          this.handleJournalReflectionObjective(questId, entry);
        });
      }
    });

    console.log('[WorldWeaverObjective] Initialized enhanced objective handlers with journal support');
  }
}

// Export singleton instance
export const worldWeaverObjectiveHandler = new WorldWeaverObjectiveHandler();