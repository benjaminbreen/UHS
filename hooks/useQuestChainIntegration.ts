/**
 * Quest Chain Integration Hook
 * Integrates WorldWeaver quest chains with the game's core systems
 */

import { useEffect, useCallback } from 'react';
import { worldWeaverQuestChain } from '../services/worldWeaverQuestChain';
import { worldWeaverService } from '../services/worldWeaverService';
import { MapData } from '../types';

interface UseQuestChainIntegrationProps {
  mapData?: MapData;
  playerLocation?: { x: number; y: number };
  culturalZone?: string;
  era?: string;
  year?: number;
  isGameActive: boolean;
}

export const useQuestChainIntegration = ({
  mapData,
  playerLocation,
  culturalZone,
  era,
  year,
  isGameActive
}: UseQuestChainIntegrationProps) => {

  // Initialize quest chain system when game becomes active
  useEffect(() => {
    if (!isGameActive) return;

    console.log('[QuestChainIntegration] Initializing quest chain system...');

    // Initialize the quest chain system
    worldWeaverQuestChain.initialize();

    // Cleanup on unmount
    return () => {
      worldWeaverQuestChain.cleanup();
    };
  }, [isGameActive]);

  // Enhanced quest generation function that supports chaining
  const generateQuestWithChaining = useCallback(async (
    prompt: string,
    location?: string
  ): Promise<string | null> => {
    if (!mapData || !playerLocation || !culturalZone || !era || !year) {
      console.warn('[QuestChainIntegration] Missing required context for quest generation');
      return null;
    }

    try {
      console.log('[QuestChainIntegration] Generating quest with chaining support...');

      // Create quest chain context
      const chainContext = {
        mapData,
        playerLocation,
        culturalZone,
        era,
        year,
        location: location || `${culturalZone} region, ${year}`
      };

      // Create a new quest chain
      const chainId = await worldWeaverQuestChain.createQuestChain(prompt, chainContext);
      console.log('[QuestChainIntegration] Created quest chain:', chainId);

      return chainId;

    } catch (error) {
      console.error('[QuestChainIntegration] Failed to generate quest with chaining:', error);

      // Fallback to regular quest generation
      try {
        const fallbackQuest = await worldWeaverService.generateQuest(
          prompt,
          year || 1473,
          location || 'Medieval Village',
          undefined,
          undefined,
          mapData,
          playerLocation
        );

        if (fallbackQuest) {
          console.log('[QuestChainIntegration] Created fallback quest (no chaining)');
          return 'fallback'; // Signal that a non-chained quest was created
        }
      } catch (fallbackError) {
        console.error('[QuestChainIntegration] Fallback quest generation also failed:', fallbackError);
      }

      return null;
    }
  }, [mapData, playerLocation, culturalZone, era, year]);

  // Get quest chain statistics
  const getQuestChainStats = useCallback(() => {
    try {
      const activeChains = worldWeaverQuestChain.getAllActiveChains();
      return {
        activeChainCount: activeChains.length,
        totalQuestsInChains: activeChains.reduce((sum, chain) => sum + chain.questIds.length, 0),
        totalCompletedQuests: activeChains.reduce((sum, chain) => sum + chain.completedQuests.length, 0)
      };
    } catch (error) {
      console.error('[QuestChainIntegration] Failed to get chain stats:', error);
      return {
        activeChainCount: 0,
        totalQuestsInChains: 0,
        totalCompletedQuests: 0
      };
    }
  }, []);

  // Manual chain cleanup (can be called from UI)
  const performManualCleanup = useCallback(async () => {
    try {
      console.log('[QuestChainIntegration] Performing manual cleanup...');
      worldWeaverQuestChain.cleanupExpiredChains();

      // Also trigger storage cleanup
      const { questStorageCleanupService } = await import('../services/questStorageCleanupService');
      await questStorageCleanupService.performMaintenanceCleanup();

      console.log('[QuestChainIntegration] Manual cleanup completed');
      return true;
    } catch (error) {
      console.error('[QuestChainIntegration] Manual cleanup failed:', error);
      return false;
    }
  }, []);

  // Check if context is ready for quest generation
  const isReadyForQuestGeneration = useCallback(() => {
    return !!(mapData && playerLocation && culturalZone && era && year && isGameActive);
  }, [mapData, playerLocation, culturalZone, era, year, isGameActive]);

  return {
    generateQuestWithChaining,
    getQuestChainStats,
    performManualCleanup,
    isReadyForQuestGeneration: isReadyForQuestGeneration(),
    contextInfo: {
      hasMapData: !!mapData,
      hasPlayerLocation: !!playerLocation,
      culturalZone,
      era,
      year,
      isGameActive
    }
  };
};

export default useQuestChainIntegration;