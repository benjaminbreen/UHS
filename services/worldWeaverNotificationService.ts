/**
 * WorldWeaver Notification Service
 * Handles notifications for WorldWeaver quest events
 */

class WorldWeaverNotificationService {

  /**
   * Show a toast notification for quest events
   */
  showQuestToast(message: string, type: 'success' | 'info' | 'warning' = 'info'): void {
    // Dispatch a custom event that can be caught by existing notification systems
    window.dispatchEvent(new CustomEvent('worldWeaverNotification', {
      detail: {
        message,
        type,
        timestamp: Date.now()
      }
    }));

    // Also log to console for debugging
    console.log(`[WorldWeaverQuest] ${type.toUpperCase()}: ${message}`);
  }

  /**
   * Show quest integration success notification
   */
  showQuestIntegrationSuccess(questTitle: string): void {
    this.showQuestToast(`✨ Quest "${questTitle}" added to your journal!`, 'success');
  }

  /**
   * Show NPC spawn notification
   */
  showNPCSpawnNotification(npcName: string, location: string): void {
    this.showQuestToast(`🎭 ${npcName} has been spotted in the ${location}`, 'info');
  }

  /**
   * Show quest stage progression notification
   */
  showStageProgression(questTitle: string, stageName: string): void {
    this.showQuestToast(`📖 Quest "${questTitle}" progressed: ${stageName}`, 'success');
  }

  /**
   * Show quest completion notification
   */
  showQuestCompletion(questTitle: string): void {
    this.showQuestToast(`🏆 Quest "${questTitle}" completed!`, 'success');
  }

  /**
   * Initialize notification handlers
   */
  initialize(): void {
    // Listen for WorldWeaver quest events
    window.addEventListener('worldWeaverQuestAdded', (event: any) => {
      const { quest } = event.detail;
      this.showQuestIntegrationSuccess(quest.title);
    });

    window.addEventListener('worldWeaverNPCSpawned', (event: any) => {
      const { npcName, location } = event.detail;
      this.showNPCSpawnNotification(npcName, location);
    });

    window.addEventListener('worldWeaverQuestProgressed', (event: any) => {
      const { questTitle, stageName } = event.detail;
      this.showStageProgression(questTitle, stageName);
    });

    window.addEventListener('worldWeaverQuestCompleted', (event: any) => {
      const { questTitle } = event.detail;
      this.showQuestCompletion(questTitle);
    });

    console.log('[WorldWeaverNotification] Initialized notification handlers');
  }
}

// Export singleton instance
export const worldWeaverNotificationService = new WorldWeaverNotificationService();