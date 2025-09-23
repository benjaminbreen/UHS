/**
 * WorldWeaver NPC Service
 * Handles spawning of quest-specific NPCs for WorldWeaver quests
 */

import { QuestNPC } from './worldWeaverService';
import { NpcEntity } from '../types/npcTypes';
import { MapData } from '../types';
import { generateId } from '../utils/idGenerator';
import { imageGenerationService } from './imageGenerationService';

interface SpawnContext {
  mapData: MapData;
  playerLocation: { x: number; y: number };
  culturalZone: string;
  era: string;
}

class WorldWeaverNpcService {

  /**
   * Spawn quest NPCs near the player with appropriate placement
   */
  async spawnQuestNPCs(questNPCs: QuestNPC[], context: SpawnContext): Promise<string[]> {
    const spawnedIds: string[] = [];

    for (const questNPC of questNPCs) {
      try {
        const spawnedNPC = await this.spawnSingleQuestNPC(questNPC, context);
        if (spawnedNPC) {
          spawnedIds.push(spawnedNPC.id);
          console.log(`[WorldWeaverNPC] Spawned ${questNPC.name} at (${spawnedNPC.x}, ${spawnedNPC.y})`);
        }
      } catch (error) {
        console.error(`[WorldWeaverNPC] Failed to spawn ${questNPC.name}:`, error);
      }
    }

    return spawnedIds;
  }

  /**
   * Spawn a single quest NPC with smart placement and AI portrait
   */
  private async spawnSingleQuestNPC(questNPC: QuestNPC, context: SpawnContext): Promise<NpcEntity | null> {
    const spawnLocation = this.findSuitableSpawnLocation(questNPC, context);
    if (!spawnLocation) {
      console.warn(`[WorldWeaverNPC] Could not find suitable spawn location for ${questNPC.name}`);
      return null;
    }

    // Create NPC entity based on quest NPC data
    const npcEntity: NpcEntity = {
      id: generateId(),
      name: questNPC.name,
      x: spawnLocation.x,
      y: spawnLocation.y,
      profession: questNPC.profession || this.guessProfessionFromRole(questNPC.role),
      socialClass: this.guessSocialClassFromRole(questNPC.role),
      stats: this.generateStatsForRole(questNPC.role),
      inventory: [],

      // Quest-specific properties
      isQuestNPC: true,
      questId: questNPC.id,
      originalQuestData: questNPC,

      // Memory system
      memory: {
        opinionOfPlayer: 0,
        knownFactsAboutPlayer: new Set(),
        relationships: new Map(),
        conversationSummaries: []
      },

      // Basic AI state
      aiState: 'idle',
      isMoving: false,

      // Appearance based on description
      gender: this.guessGenderFromName(questNPC.name),
      age: this.guessAgeFromRole(questNPC.role),

      // Historical context
      culturalZone: context.culturalZone as any,
      historicalEra: context.era as any
    };

    // Generate AI portrait for this quest NPC
    try {
      console.log(`[WorldWeaverNPC] Generating AI portrait for ${questNPC.name}...`);

      const portraitContext = {
        npc: questNPC,
        culturalZone: context.culturalZone,
        era: context.era,
        location: context.mapData.localArea || 'countryside'
      };

      const { imageUrl, prompt } = await imageGenerationService.generateQuestNPCPortrait(portraitContext);

      if (imageUrl) {
        // Add AI portrait data to NPC
        npcEntity.aiPortrait = imageUrl;
        npcEntity.portraitType = 'ai';
        npcEntity.portraitPrompt = prompt;

        console.log(`[WorldWeaverNPC] ✨ Generated AI portrait for ${questNPC.name}: ${imageUrl}`);

        // Emit event for notifications
        window.dispatchEvent(new CustomEvent('worldWeaverNPCPortraitGenerated', {
          detail: {
            npcName: questNPC.name,
            imageUrl,
            prompt
          }
        }));
      } else {
        console.warn(`[WorldWeaverNPC] Failed to generate portrait for ${questNPC.name}, using procedural`);
        npcEntity.portraitType = 'procedural';
      }
    } catch (error) {
      console.error(`[WorldWeaverNPC] Error generating portrait for ${questNPC.name}:`, error);
      npcEntity.portraitType = 'procedural';
    }

    // Add to map's NPC array
    if (context.mapData.npcs) {
      context.mapData.npcs.push(npcEntity);
    } else {
      context.mapData.npcs = [npcEntity];
    }

    return npcEntity;
  }

  /**
   * Find suitable spawn location based on NPC role
   */
  private findSuitableSpawnLocation(questNPC: QuestNPC, context: SpawnContext): { x: number; y: number } | null {
    const { mapData, playerLocation } = context;
    const mapWidth = mapData.tiles[0].length;
    const mapHeight = mapData.tiles.length;

    // Define search preferences based on role
    const rolePreferences = this.getRoleLocationPreferences(questNPC.role);

    // Try preferred biomes first
    for (const biomeType of rolePreferences.preferredBiomes) {
      const location = this.findLocationNearBiome(biomeType, playerLocation, mapData);
      if (location) return location;
    }

    // Fallback: find any walkable location near player (within 5-15 tiles)
    for (let attempts = 0; attempts < 50; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 10; // 5-15 tiles away

      const x = Math.round(playerLocation.x + Math.cos(angle) * distance);
      const y = Math.round(playerLocation.y + Math.sin(angle) * distance);

      if (this.isValidSpawnLocation(x, y, mapData)) {
        return { x, y };
      }
    }

    console.warn(`[WorldWeaverNPC] Could not find valid spawn location for ${questNPC.name}`);
    return null;
  }

  /**
   * Check if location is valid for NPC spawning
   */
  private isValidSpawnLocation(x: number, y: number, mapData: MapData): boolean {
    const mapWidth = mapData.tiles[0].length;
    const mapHeight = mapData.tiles.length;

    // Check bounds
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;

    const tile = mapData.tiles[y][x];

    // Must be walkable
    if (!tile.walkable) return false;

    // Check for existing NPCs at this location
    if (mapData.npcs?.some(npc => npc.x === x && npc.y === y)) return false;

    // Avoid water tiles for land NPCs
    const waterBiomes = ['DEEP_OCEAN', 'SHALLOW_OCEAN', 'RIVER', 'MAJOR_RIVER'];
    if (waterBiomes.includes(tile.biome)) return false;

    return true;
  }

  /**
   * Get location preferences for different NPC roles
   */
  private getRoleLocationPreferences(role: string): { preferredBiomes: string[] } {
    const roleLower = role.toLowerCase();

    if (roleLower.includes('farmer') || roleLower.includes('olive')) {
      return { preferredBiomes: ['FARMLAND', 'GRASSLAND', 'HILLS'] };
    }

    if (roleLower.includes('merchant') || roleLower.includes('trader')) {
      return { preferredBiomes: ['MARKETPLACE', 'CITY_CENTER', 'LOW_DENSITY_CITY'] };
    }

    if (roleLower.includes('noble') || roleLower.includes('lord')) {
      return { preferredBiomes: ['PALACE', 'CITY_CENTER', 'DENSE_CITY'] };
    }

    if (roleLower.includes('brigand') || roleLower.includes('bandit')) {
      return { preferredBiomes: ['FOREST', 'DENSE_FOREST', 'HILLS', 'SCRUB'] };
    }

    if (roleLower.includes('priest') || roleLower.includes('monk')) {
      return { preferredBiomes: ['HOLY_SITE', 'CITY_CENTER'] };
    }

    // Default: prefer populated areas
    return { preferredBiomes: ['LOW_DENSITY_CITY', 'HAMLET', 'FARMLAND', 'GRASSLAND'] };
  }

  /**
   * Find location near specific biome type
   */
  private findLocationNearBiome(biomeType: string, center: { x: number; y: number }, mapData: MapData): { x: number; y: number } | null {
    const searchRadius = 15;

    for (let attempts = 0; attempts < 30; attempts++) {
      const x = center.x + Math.floor((Math.random() - 0.5) * searchRadius * 2);
      const y = center.y + Math.floor((Math.random() - 0.5) * searchRadius * 2);

      if (this.isValidSpawnLocation(x, y, mapData)) {
        const tile = mapData.tiles[y][x];
        if (tile.biome === biomeType) {
          return { x, y };
        }
      }
    }

    return null;
  }

  /**
   * Helper methods for NPC creation
   */
  private guessProfessionFromRole(role: string): string {
    const roleLower = role.toLowerCase();

    if (roleLower.includes('farmer')) return 'Farmer';
    if (roleLower.includes('merchant')) return 'Merchant';
    if (roleLower.includes('noble')) return 'Noble';
    if (roleLower.includes('brigand')) return 'Bandit';
    if (roleLower.includes('priest')) return 'Priest';
    if (roleLower.includes('guard')) return 'Guard';

    return 'Commoner';
  }

  private guessSocialClassFromRole(role: string): string {
    const roleLower = role.toLowerCase();

    if (roleLower.includes('noble') || roleLower.includes('lord')) return 'noble';
    if (roleLower.includes('merchant')) return 'merchant';
    if (roleLower.includes('brigand') || roleLower.includes('bandit')) return 'peasant';

    return 'commoner';
  }

  private generateStatsForRole(role: string): any {
    const roleLower = role.toLowerCase();

    // Base stats
    const baseStats = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    };

    // Adjust based on role
    if (roleLower.includes('brigand') || roleLower.includes('guard')) {
      baseStats.strength += 3;
      baseStats.constitution += 2;
    }

    if (roleLower.includes('merchant')) {
      baseStats.charisma += 3;
      baseStats.intelligence += 2;
    }

    if (roleLower.includes('farmer')) {
      baseStats.constitution += 2;
      baseStats.strength += 1;
    }

    return baseStats;
  }

  private guessGenderFromName(name: string): 'male' | 'female' {
    // Simple heuristics - could be enhanced
    const femaleEndings = ['a', 'e', 'ia', 'ella', 'ina'];
    const nameLower = name.toLowerCase();

    if (femaleEndings.some(ending => nameLower.endsWith(ending))) {
      return 'female';
    }

    return 'male';
  }

  private guessAgeFromRole(role: string): number {
    const roleLower = role.toLowerCase();

    if (roleLower.includes('elder') || roleLower.includes('wise')) return 50 + Math.floor(Math.random() * 20);
    if (roleLower.includes('young') || roleLower.includes('apprentice')) return 18 + Math.floor(Math.random() * 10);

    return 25 + Math.floor(Math.random() * 30); // 25-55
  }
}

// Export singleton instance
export const worldWeaverNpcService = new WorldWeaverNpcService();