/**
 * WorldWeaver Quest Integrator
 * Converts WorldWeaver quest data into fully functional game quests
 */

import { WorldWeaverQuest, QuestStage } from './worldWeaverService';
import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { MapData } from '../types';
import { questService } from './questService';
import { worldWeaverNpcService } from './worldWeaverNpcService';
import { generateId } from '../utils/idGenerator';

interface GameContext {
  mapData: MapData;
  playerLocation: { x: number; y: number };
  culturalZone: string;
  era: string;
}

export class WorldWeaverQuestIntegrator {

  /**
   * Convert a WorldWeaver quest into a fully functional game quest
   */
  async integrateQuest(weaverQuest: WorldWeaverQuest, context: GameContext): Promise<string> {
    console.log(`[WorldWeaverIntegrator] Integrating quest: "${weaverQuest.title}"`);

    try {
      // Handle both specialNPC (singular) and specialNPCs (plural) formats
      const npcsToSpawn = weaverQuest.specialNPCs || (weaverQuest.specialNPC ? [weaverQuest.specialNPC] : []);

      if (npcsToSpawn.length === 0) {
        console.warn('[WorldWeaverIntegrator] No special NPCs defined for quest');
      }

      // 1. Spawn all special NPCs
      const spawnedNPCIds: string[] = [];
      for (const npc of npcsToSpawn) {
        try {
          const npcId = await this.spawnQuestNPC(npc, context);
          spawnedNPCIds.push(npcId);
          console.log(`[WorldWeaverIntegrator] Spawned NPC: ${npc.name} with ID: ${npcId}`);
        } catch (error) {
          console.error(`[WorldWeaverIntegrator] Failed to spawn NPC ${npc.name}:`, error);
        }
      }

      // 2. Create the game quest with real objectives
      const quest = await this.createGameQuest(weaverQuest, spawnedNPCIds[0] || 'unknown', context);

      // 3. Register quest with quest service
      questService.addQuest(quest);
      console.log(`[WorldWeaverIntegrator] Registered quest: ${quest.id}`);

      // 4. Create quest markers on the map
      this.createQuestMarkers(quest);

      console.log(`[WorldWeaverIntegrator] Successfully integrated quest: "${quest.title}"`);
      return quest.id;

    } catch (error) {
      console.error(`[WorldWeaverIntegrator] Failed to integrate quest "${weaverQuest.title}":`, error);
      throw error;
    }
  }

  /**
   * Spawn the quest NPC at the exact specified coordinates
   */
  private async spawnQuestNPC(specialNPC: any, context: GameContext): Promise<string> {
    // Handle location as either array [x, y] or object {x, y}
    let npcLocation: { x: number; y: number };
    if (Array.isArray(specialNPC.location)) {
      npcLocation = { x: specialNPC.location[0], y: specialNPC.location[1] };
    } else {
      npcLocation = specialNPC.location;
    }

    // Validate coordinates are on the map and on land
    if (!this.validateSpawnLocation(npcLocation, context.mapData)) {
      console.warn(`[WorldWeaverIntegrator] Invalid spawn location: ${npcLocation.x}, ${npcLocation.y}`);
      // Find nearest valid spawn location
      const validLocation = this.findNearestValidSpawnLocation(npcLocation, context.mapData);
      if (validLocation) {
        npcLocation = validLocation;
        console.log(`[WorldWeaverIntegrator] Corrected NPC spawn to: ${validLocation.x}, ${validLocation.y}`);
      } else {
        throw new Error(`Cannot find valid spawn location near ${npcLocation.x}, ${npcLocation.y}`);
      }
    }

    // Use existing NPC service to spawn the NPC
    const spawnContext = {
      mapData: context.mapData,
      playerLocation: context.playerLocation,
      culturalZone: context.culturalZone,
      era: context.era
    };

    // Convert to QuestNPC format for compatibility
    const questNPC = {
      id: specialNPC.id || generateId(),
      name: specialNPC.name,
      role: specialNPC.role || 'Quest Giver',
      personality: specialNPC.personality,
      profession: specialNPC.profession,
      appearance: specialNPC.appearance,
      location: [npcLocation.x, npcLocation.y] as [number, number],
      stages: specialNPC.stages || {}
    };

    const spawnedIds = await worldWeaverNpcService.spawnQuestNPCs([questNPC], spawnContext);

    if (spawnedIds.length === 0) {
      throw new Error(`Failed to spawn NPC: ${specialNPC.name}`);
    }

    return spawnedIds[0];
  }

  /**
   * Create a game quest from WorldWeaver quest data
   */
  private async createGameQuest(weaverQuest: WorldWeaverQuest, npcId: string, context: GameContext): Promise<Quest> {
    const questId = generateId();

    // Convert stages to game objectives
    const objectives = this.convertToGameObjectives(weaverQuest.stages, npcId, questId);

    // Create appropriate rewards
    const rewards = this.createRewards(weaverQuest, context);

    const quest: Quest = {
      id: questId,
      title: weaverQuest.title,
      description: weaverQuest.description,
      category: 'social', // WorldWeaver quests are typically social/narrative focused
      objectives,
      currentObjectiveIndex: 0,
      rewards,
      startTime: Date.now(),
      status: 'active',
      historicalContext: weaverQuest.historicalContext,
      isLLMGenerated: true,
      difficulty: 'medium',
      culturalZone: context.culturalZone,
      era: context.era
    };

    return quest;
  }

  /**
   * Convert WorldWeaver stages to game quest objectives
   */
  private convertToGameObjectives(stages: QuestStage[], npcId: string, questId: string): QuestObjective[] {
    return stages.map((stage, index) => {
      const objectiveId = `${questId}_obj_${index}`;

      const objective: QuestObjective = {
        id: objectiveId,
        type: this.mapTriggerToObjectiveType(stage.completionTrigger),
        description: stage.objective,
        completed: false
      };

      // Add target information based on trigger type
      if (stage.completionTrigger === 'talk_to_npc') {
        objective.targetNPC = npcId;
      }

      if (stage.targetLocation) {
        objective.targetLocation = {
          x: stage.targetLocation.x,
          y: stage.targetLocation.y,
          radius: 3 // Small interaction radius
        };
      }

      if (stage.completionTrigger === 'obtain_item' && stage.targetId) {
        objective.targetItem = stage.targetId;
        objective.targetAmount = 1;
      }

      if (stage.completionTrigger === 'obtain_item' && stage.targetId) {
        objective.targetItem = stage.targetId;
      }

      console.log(`[WorldWeaverIntegrator] Created objective: ${objective.type} - ${objective.description}`);
      return objective;
    });
  }

  /**
   * Map WorldWeaver completion triggers to game objective types
   */
  private mapTriggerToObjectiveType(trigger: string): QuestObjective['type'] {
    const mapping = {
      'talk_to_npc': 'talk_to_npc',
      'visit_location': 'visit_location',
      'reach_location': 'reach_destination',
      'collect_item': 'collect_item',
      'deliver_item': 'deliver_item',
      'obtain_item': 'collect_item'
    } as const;

    return mapping[trigger as keyof typeof mapping] || 'visit_location';
  }

  /**
   * Create appropriate rewards for the quest
   */
  private createRewards(weaverQuest: WorldWeaverQuest, context: GameContext): QuestReward[] {
    const rewards: QuestReward[] = [
      {
        type: 'reputation',
        value: 15,
        description: 'Gained reputation for helping the community',
        guaranteed: true
      }
    ];

    // Add era-appropriate rewards
    if (context.era === 'MEDIEVAL' || context.era === 'RENAISSANCE_EARLY_MODERN') {
      rewards.push({
        type: 'money',
        value: 25,
        description: 'Payment for services rendered',
        guaranteed: true
      });
    }

    // Add cultural zone specific rewards
    if (context.culturalZone === 'EUROPEAN' || context.culturalZone === 'MENA') {
      rewards.push({
        type: 'knowledge',
        value: 'local_customs',
        description: 'Knowledge of local customs and traditions',
        guaranteed: true
      });
    }

    return rewards;
  }

  /**
   * Create quest markers for the map display
   */
  private createQuestMarkers(quest: Quest): void {
    // Quest markers are automatically created by questService.addQuest()
    // through the updateQuestMarkers method
    console.log(`[WorldWeaverIntegrator] Quest markers will be created by questService for quest: ${quest.id}`);
  }

  /**
   * Validate that a spawn location is valid on the map
   */
  private validateSpawnLocation(location: { x: number; y: number }, mapData: MapData): boolean {
    const { x, y } = location;

    // Check bounds
    if (x < 0 || y < 0 || y >= mapData.tiles.length || x >= mapData.tiles[0].length) {
      return false;
    }

    const tile = mapData.tiles[y][x];

    // Must be on land and not water
    return tile && tile.isLand === true;
  }

  /**
   * Find the nearest valid spawn location to a given point
   */
  private findNearestValidSpawnLocation(target: { x: number; y: number }, mapData: MapData): { x: number; y: number } | null {
    const maxSearchRadius = 10;

    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check the perimeter of the current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const testLocation = {
            x: target.x + dx,
            y: target.y + dy
          };

          if (this.validateSpawnLocation(testLocation, mapData)) {
            return testLocation;
          }
        }
      }
    }

    return null; // No valid location found within search radius
  }
}

// Export singleton instance
export const worldWeaverQuestIntegrator = new WorldWeaverQuestIntegrator();