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
      const currentStage = this.getCurrentQuestStage(originalQuest);
      if (currentStage && this.isDialogueProgression(currentStage, questNPC)) {
        this.progressQuestStage(questId, currentStage.id);
      }
    }
  }

  /**
   * Handle location-based objectives with fuzzy matching
   */
  handleLocationObjective(playerLocation: { x: number; y: number }, questId: string): void {
    if (!worldWeaverQuestService.isWorldWeaverQuest(questId)) {
      return;
    }

    const originalQuest = worldWeaverQuestService.getOriginalQuest(questId);
    if (!originalQuest) return;

    const currentStage = this.getCurrentQuestStage(originalQuest);
    if (!currentStage || currentStage.completionTrigger !== 'reach_location') return;

    // Check if player is in the general area for location-based objectives
    const spawnedNPCs = worldWeaverQuestService.getSpawnedNPCs(questId);
    if (spawnedNPCs.length > 0) {
      // Use NPC locations as reference points for quest locations
      // This is a simple approximation - could be enhanced with actual coordinate mapping
      const isNearQuestArea = this.isPlayerNearQuestArea(playerLocation, spawnedNPCs);

      if (isNearQuestArea) {
        console.log(`[WorldWeaverObjective] Player reached quest location for stage: ${currentStage.objective}`);
        this.progressQuestStage(questId, currentStage.id);
      }
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

    const currentStage = this.getCurrentQuestStage(originalQuest);
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

    const currentStage = this.getCurrentQuestStage(originalQuest);
    if (!currentStage || currentStage.completionTrigger !== 'obtain_item') return;

    // Check if the collected item matches quest requirements
    if (currentStage.targetId && currentStage.targetId.toLowerCase().includes(itemId.toLowerCase())) {
      console.log(`[WorldWeaverObjective] Item objective completed: ${itemId} x${quantity}`);
      this.progressQuestStage(questId, currentStage.id);
    }
  }

  /**
   * Get the current active stage for a WorldWeaver quest
   */
  private getCurrentQuestStage(quest: WorldWeaverQuest): QuestStage | null {
    // For now, return the first stage - this could be enhanced to track actual progression
    // In a full implementation, we'd store which stage the player is currently on
    if (quest.stages.length > 0) {
      return quest.stages[0];
    }
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
        console.log(`[WorldWeaverObjective] Progressed quest stage: ${stageId}`);

        // Add journal entry for stage completion
        this.addStageCompletionJournalEntry(questId, stageId);
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
   * Check if player is near quest area (simple proximity check)
   */
  private isPlayerNearQuestArea(playerLocation: { x: number; y: number }, npcIds: string[]): boolean {
    // This is a simplified implementation
    // In a full version, we'd check proximity to actual quest NPCs or marked locations
    // For now, assume any location change could trigger location objectives
    return true; // Placeholder - would need actual NPC position checking
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
      });
    });

    console.log('[WorldWeaverObjective] Initialized enhanced objective handlers');
  }
}

// Export singleton instance
export const worldWeaverObjectiveHandler = new WorldWeaverObjectiveHandler();