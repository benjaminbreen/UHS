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
   * Spawn quest NPCs near the player with appropriate placement (main map)
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
   * Spawn a quest NPC in a building (interior/special map)
   * Returns the spawned NPC entity or null if failed
   */
  async spawnQuestNPCInBuilding(
    questNPC: QuestNPC,
    buildingId: string,
    culturalZone: string,
    era: string,
    position?: { x: number; y: number }
  ): Promise<NpcEntity | null> {
    console.log(`[WorldWeaverNPC] Spawning quest NPC ${questNPC.name} in building ${buildingId}`);

    // Create NPC entity based on quest NPC data
    const npcEntity: NpcEntity = {
      id: generateId(),
      name: questNPC.name,
      x: position?.x || 0, // Position will be set by generator if not provided
      y: position?.y || 0,
      profession: questNPC.profession || this.guessProfessionFromRole(questNPC.role),
      socialClass: this.guessSocialClassFromRole(questNPC.role),
      stats: this.generateStatsForRole(questNPC.role),
      inventory: [],

      // Quest-specific properties
      isQuestNPC: true,
      questId: questNPC.id,
      originalQuestData: questNPC,

      // Building association
      buildingId,

      // Memory system
      memory: this.createSafeNpcMemory(),

      // Basic AI state
      aiState: 'idle',
      isMoving: false,

      // Appearance based on description
      gender: this.guessGenderFromName(questNPC.name),
      age: this.guessAgeFromRole(questNPC.role),

      // Historical context
      culturalZone: ((questNPC as any).ethnicity || culturalZone) as any,
      historicalEra: era as any
    };

    // Add ethnicCulturalZone if different from geographic zone
    const questEthnicity = (questNPC as any).ethnicity;
    if (questEthnicity && questEthnicity !== culturalZone) {
      (npcEntity as any).ethnicCulturalZone = questEthnicity;
    }

    // Generate AI portrait for this quest NPC
    try {
      console.log(`[WorldWeaverNPC] Generating AI portrait for ${questNPC.name} in building...`);

      const portraitContext = {
        npc: questNPC,
        culturalZone: questEthnicity || culturalZone,
        era,
        location: 'interior'
      };

      const { imageUrl, prompt } = await imageGenerationService.generateQuestNPCPortrait(portraitContext);

      if (imageUrl) {
        npcEntity.aiPortrait = imageUrl;
        npcEntity.portraitType = 'ai';
        npcEntity.portraitPrompt = prompt;
        console.log(`[WorldWeaverNPC] ✨ Generated AI portrait for ${questNPC.name}: ${imageUrl}`);
      } else {
        npcEntity.portraitType = 'procedural';
      }
    } catch (error) {
      console.error(`[WorldWeaverNPC] Error generating portrait for ${questNPC.name}:`, error);
      npcEntity.portraitType = 'procedural';
    }

    console.log(`[WorldWeaverNPC] Successfully spawned quest NPC ${questNPC.name} in building ${buildingId}`);
    return npcEntity;
  }

  /**
   * Load quest NPCs for a specific building
   * Checks if any active quests have NPCs that should be in this building
   */
  async loadQuestNPCsForBuilding(
    buildingId: string,
    culturalZone: string,
    era: string
  ): Promise<NpcEntity[]> {
    console.log(`[WorldWeaverNPC] Loading quest NPCs for building ${buildingId}`);

    // TODO: Integrate with quest system to find active quests
    // For now, return empty array - will be wired up when quest system is ready
    // The quest system will need to track which NPCs belong to which buildings

    return [];
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

      // Memory system - Use helper to avoid proxy issues
      memory: this.createSafeNpcMemory(),

      // Basic AI state
      aiState: 'idle',
      isMoving: false,

      // Appearance based on description
      gender: this.guessGenderFromName(questNPC.name),
      age: this.guessAgeFromRole(questNPC.role),

      // Historical context - use ethnicity if provided, otherwise geographic zone
      culturalZone: ((questNPC as any).ethnicity || context.culturalZone) as any,
      historicalEra: context.era as any
    };

    // Add ethnicCulturalZone if different from geographic zone
    const questEthnicity = (questNPC as any).ethnicity;
    if (questEthnicity && questEthnicity !== context.culturalZone) {
      (npcEntity as any).ethnicCulturalZone = questEthnicity;
      console.log(`[WorldWeaverNPC] Set ethnicCulturalZone '${questEthnicity}' for ${questNPC.name} (geographic zone: ${context.culturalZone})`);
    }

    // Generate AI portrait for this quest NPC
    try {
      console.log(`[WorldWeaverNPC] Generating AI portrait for ${questNPC.name}...`);

      const portraitContext = {
        npc: questNPC,
        culturalZone: questEthnicity || context.culturalZone, // Use ethnicity for portrait generation
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

    console.log(`[WorldWeaverNPC] Finding spawn for ${questNPC.name}:`, {
      playerLoc: playerLocation,
      mapSize: `${mapWidth}x${mapHeight}`,
      role: questNPC.role
    });

    // Define search preferences based on role
    const rolePreferences = this.getRoleLocationPreferences(questNPC.role);
    console.log(`[WorldWeaverNPC] Role preferences:`, rolePreferences);

    // Try preferred biomes first
    for (const biomeType of rolePreferences.preferredBiomes) {
      const location = this.findLocationNearBiome(biomeType, playerLocation, mapData);
      if (location) {
        console.log(`[WorldWeaverNPC] Found location at preferred biome ${biomeType}:`, location);
        return location;
      }
    }

    // Fallback 1: find any walkable location near player (within 5-15 tiles)
    console.log(`[WorldWeaverNPC] Trying fallback: 50 random attempts near player (5-15 tiles)`);
    for (let attempts = 0; attempts < 50; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 10; // 5-15 tiles away

      const x = Math.round(playerLocation.x + Math.cos(angle) * distance);
      const y = Math.round(playerLocation.y + Math.sin(angle) * distance);

      // Enable debug logging for first 10 attempts
      if (this.isValidSpawnLocation(x, y, mapData, attempts < 10)) {
        console.log(`[WorldWeaverNPC] Found valid fallback location at (${x}, ${y}) after ${attempts + 1} attempts`);
        return { x, y };
      }
    }

    // Fallback 2: Expand search radius to entire map if nearby search failed
    console.log(`[WorldWeaverNPC] Nearby search failed, trying wider search across entire map`);
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * mapWidth);
      const y = Math.floor(Math.random() * mapHeight);

      if (this.isValidSpawnLocation(x, y, mapData)) {
        console.log(`[WorldWeaverNPC] Found valid location at (${x}, ${y}) after ${attempts + 1} wider attempts`);
        return { x, y };
      }
    }

    // Diagnostic: Count total valid spawn locations on entire map
    let validTileCount = 0;
    let sampleValidTiles: string[] = [];
    for (let scanY = 0; scanY < mapHeight; scanY++) {
      for (let scanX = 0; scanX < mapWidth; scanX++) {
        if (this.isValidSpawnLocation(scanX, scanY, mapData, false)) {
          validTileCount++;
          if (sampleValidTiles.length < 5) {
            sampleValidTiles.push(`(${scanX}, ${scanY})`);
          }
        }
      }
    }

    console.error(`[WorldWeaverNPC] CRITICAL: Could not find ANY valid spawn location for ${questNPC.name} after 150 attempts on ${mapWidth}x${mapHeight} map`);
    console.error(`[WorldWeaverNPC] DIAGNOSTIC: Total valid tiles on map: ${validTileCount}/${mapWidth * mapHeight} (${(validTileCount / (mapWidth * mapHeight) * 100).toFixed(1)}%)`);
    console.error(`[WorldWeaverNPC] DIAGNOSTIC: Sample valid tiles: ${sampleValidTiles.join(', ')}`);
    console.error(`[WorldWeaverNPC] DIAGNOSTIC: Total NPCs on map: ${mapData.npcs?.length || 0}`);
    return null;
  }

  /**
   * Check if location is valid for NPC spawning
   * Uses same logic as regular NPC generator - checks isLand and excludes water biomes
   */
  private isValidSpawnLocation(x: number, y: number, mapData: MapData, debugMode: boolean = false): boolean {
    const mapWidth = mapData.tiles[0].length;
    const mapHeight = mapData.tiles.length;

    // Check bounds
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
      if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - OUT OF BOUNDS`);
      return false;
    }

    const tile = mapData.tiles[y][x];

    // Must be land (matches regular NPC generator logic)
    if (!tile.isLand) {
      if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - NOT LAND (biome: ${tile.biome})`);
      return false;
    }

    // Check for existing NPCs at this location
    if (mapData.npcs?.some(npc => npc.x === x && npc.y === y)) {
      if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - NPC ALREADY HERE`);
      return false;
    }

    // Avoid water biomes (matches regular NPC generator logic)
    const waterBiomes = ['DEEP_OCEAN', 'SHALLOW_OCEAN', 'RIVER', 'MAJOR_RIVER'];
    if (waterBiomes.includes(tile.biome)) {
      if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - WATER BIOME (${tile.biome})`);
      return false;
    }

    // Check if tile is blocking (from overlay objects like walls, furniture)
    if (tile.isBlocking) {
      if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - BLOCKING (overlayObject or base biome blocks movement)`);
      return false;
    }

    if (debugMode) console.log(`[ValidSpawn] (${x}, ${y}) - ✅ VALID (biome: ${tile.biome}, isLand: ${tile.isLand})`);
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
   * Create safe NPC memory to avoid proxy revocation issues
   */
  private createSafeNpcMemory(): any {
    return {
      opinionOfPlayer: 0,
      knownFactsAboutPlayer: new Set<string>(),
      relationships: new Map<string, { opinion: number; type: 'family' | 'friend' | 'rival' }>(),
      conversationSummaries: []
    };
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