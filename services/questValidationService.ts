/**
 * Dynamic Quest Validation Service
 * Validates quests remain achievable as world state changes
 */

import { Quest, QuestObjective } from '../types/questTypes';
import { worldEntityRegistry } from './worldEntityRegistry';
import { BoundQuest } from './questRealityBinding';
import { MapData, NpcEntity, TerrainStructure } from '../types';

export interface ValidationResult {
  isValid: boolean;
  invalidReasons: string[];
  suggestions: string[];
  repairableObjectives: QuestObjective[];
}

export interface WorldState {
  mapData: MapData;
  npcs: NpcEntity[];
  structures: TerrainStructure[];
  playerLocation: { x: number; y: number };
  timeOfDay: number;
  season: string;
}

class QuestValidationService {
  /**
   * Validate a quest against current world state
   */
  public validateQuest(quest: Quest | BoundQuest, worldState: WorldState): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      invalidReasons: [],
      suggestions: [],
      repairableObjectives: []
    };

    // Check if this is a bound quest with entity references
    const boundQuest = quest as BoundQuest;
    if (boundQuest.boundEntities) {
      this.validateBoundEntities(boundQuest, result);
    }

    // Validate each objective
    for (const objective of quest.objectives) {
      this.validateObjective(objective, worldState, result);
    }

    // Check time-sensitive quests
    if (quest.timeLimit) {
      this.validateTimeConstraints(quest, worldState, result);
    }

    // Check location accessibility
    this.validateLocationAccessibility(quest, worldState, result);

    // Generate repair suggestions if invalid
    if (result.invalidReasons.length > 0) {
      result.isValid = false;
      this.generateRepairSuggestions(quest, worldState, result);
    }

    return result;
  }

  /**
   * Validate bound entities still exist and are accessible
   */
  private validateBoundEntities(quest: BoundQuest, result: ValidationResult): void {
    for (const entityId of quest.boundEntities) {
      const entity = worldEntityRegistry.getEntity(entityId);
      
      if (!entity) {
        result.invalidReasons.push(`Entity ${entityId} no longer exists`);
        continue;
      }
      
      if (!entity.active) {
        result.invalidReasons.push(`Entity ${entity.name} is no longer active`);
        
        // Find objectives that reference this entity
        const affectedObjectives = quest.objectives.filter(obj => {
          const boundObj = obj as any;
          return boundObj.boundEntityId === entityId;
        });
        
        result.repairableObjectives.push(...affectedObjectives);
      }
    }
  }

  /**
   * Validate a single objective
   */
  private validateObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Skip if already completed
    if (objective.completed) return;

    switch (objective.type) {
      case 'visit_location':
      case 'explore_area':
        this.validateLocationObjective(objective, worldState, result);
        break;

      case 'talk_to_npc':
      case 'deliver_to_npc':
      case 'negotiate_with_npc':
        this.validateNpcObjective(objective, worldState, result);
        break;

      case 'collect_resource':
      case 'collect_items':
        this.validateResourceObjective(objective, worldState, result);
        break;

      case 'defeat_entity':
      case 'defeat_enemies':
        this.validateCombatObjective(objective, worldState, result);
        break;

      case 'survive_duration':
      case 'survive_time':
        this.validateSurvivalObjective(objective, worldState, result);
        break;
    }
  }

  /**
   * Validate location-based objectives
   */
  private validateLocationObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    if (!objective.targetLocation) {
      result.invalidReasons.push(`Objective "${objective.description}" has no target location`);
      return;
    }

    const { x, y } = objective.targetLocation;
    
    // Check if location is within map bounds
    if (x < 0 || x >= worldState.mapData.tiles[0].length ||
        y < 0 || y >= worldState.mapData.tiles.length) {
      result.invalidReasons.push(`Target location (${x}, ${y}) is outside map bounds`);
      return;
    }

    // Check if location is accessible (not in ocean, lava, etc.)
    const tile = worldState.mapData.tiles[y][x];
    if (!tile.isLand && tile.biome !== 'SHALLOW_OCEAN') {
      result.invalidReasons.push(`Target location (${x}, ${y}) is inaccessible (${tile.biome})`);
      result.suggestions.push('Consider providing a boat or alternative path');
    }

    // Check distance from player
    const distance = Math.sqrt(
      Math.pow(x - worldState.playerLocation.x, 2) +
      Math.pow(y - worldState.playerLocation.y, 2)
    );
    
    if (distance > 100) {
      result.suggestions.push(`Target is ${Math.round(distance)} tiles away - consider adding waypoints`);
    }
  }

  /**
   * Validate NPC-based objectives
   */
  private validateNpcObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    const boundObj = objective as any;
    
    // Check if this objective is bound to a specific NPC
    if (boundObj.boundEntityId) {
      const entity = worldEntityRegistry.getEntity(boundObj.boundEntityId);
      
      if (!entity) {
        result.invalidReasons.push(`NPC ${boundObj.boundEntityName || 'target'} no longer exists`);
        result.repairableObjectives.push(objective);
        return;
      }
      
      if (!entity.active) {
        result.invalidReasons.push(`NPC ${entity.name} is no longer available`);
        result.repairableObjectives.push(objective);
        return;
      }
      
      // Update location if NPC moved
      if (entity.location && objective.targetLocation) {
        const moved = entity.location.x !== objective.targetLocation.x ||
                     entity.location.y !== objective.targetLocation.y;
        if (moved) {
          result.suggestions.push(`NPC ${entity.name} has moved to (${entity.location.x}, ${entity.location.y})`);
        }
      }
    } else {
      // Generic NPC objective - check if any suitable NPCs exist
      const suitableNpcs = worldState.npcs.filter(npc => {
        // Check if NPC matches objective requirements
        if (objective.description.toLowerCase().includes('merchant')) {
          return npc.profession?.toLowerCase().includes('merchant');
        }
        if (objective.description.toLowerCase().includes('guard')) {
          return npc.profession?.toLowerCase().includes('guard');
        }
        return true; // Any NPC works
      });
      
      if (suitableNpcs.length === 0) {
        result.invalidReasons.push('No suitable NPCs available for this objective');
        result.suggestions.push('Wait for NPCs to spawn or travel to populated areas');
      }
    }
  }

  /**
   * Validate resource collection objectives
   */
  private validateResourceObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Check if resource type exists in current biome
    if (objective.resourceType) {
      const availableInBiome = this.isResourceAvailableInArea(
        objective.resourceType,
        worldState
      );
      
      if (!availableInBiome) {
        result.invalidReasons.push(
          `Resource "${objective.resourceType}" not available in current area`
        );
        result.suggestions.push('Travel to a different biome or trade for resources');
      }
    }
  }

  /**
   * Validate combat objectives
   */
  private validateCombatObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Check if enemies exist in the area
    const hostileEntities = worldState.npcs.filter(npc => 
      npc.isHostile || npc.faction === 'bandit'
    );
    
    if (hostileEntities.length === 0 && objective.targetAmount && objective.targetAmount > 0) {
      result.suggestions.push('No hostile entities in area - explore dangerous regions');
    }
  }

  /**
   * Validate survival objectives
   */
  private validateSurvivalObjective(
    objective: QuestObjective,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Check environmental hazards
    const currentTile = worldState.mapData.tiles[
      worldState.playerLocation.y
    ]?.[worldState.playerLocation.x];
    
    if (currentTile?.biome === 'ACTIVE_LAVA') {
      result.invalidReasons.push('Cannot survive in lava!');
      result.suggestions.push('Move to a safe location immediately');
    }
  }

  /**
   * Validate time constraints
   */
  private validateTimeConstraints(
    quest: Quest,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    if (!quest.timeLimit || !quest.startTime) return;
    
    const elapsed = Date.now() - quest.startTime;
    const remaining = quest.timeLimit - elapsed;
    
    if (remaining < 0) {
      result.invalidReasons.push('Quest time limit has expired');
    } else if (remaining < 60000) { // Less than 1 minute
      result.suggestions.push('Hurry! Less than 1 minute remaining');
    }
  }

  /**
   * Validate location accessibility
   */
  private validateLocationAccessibility(
    quest: Quest,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Check if all objective locations are reachable
    for (const objective of quest.objectives) {
      if (objective.targetLocation && !objective.completed) {
        const path = this.checkPathExists(
          worldState.playerLocation,
          objective.targetLocation,
          worldState.mapData
        );
        
        if (!path) {
          result.suggestions.push(
            `Objective "${objective.description}" may be unreachable - find alternative route`
          );
        }
      }
    }
  }

  /**
   * Generate suggestions to repair invalid quests
   */
  private generateRepairSuggestions(
    quest: Quest,
    worldState: WorldState,
    result: ValidationResult
  ): void {
    // Suggest alternative NPCs for NPC objectives
    for (const objective of result.repairableObjectives) {
      if (objective.type.includes('npc')) {
        const alternativeNpcs = worldEntityRegistry.queryEntities({
          type: 'npc',
          maxDistance: 30,
          active: true
        });
        
        if (alternativeNpcs.length > 0) {
          result.suggestions.push(
            `Alternative: ${alternativeNpcs[0].name} at (${alternativeNpcs[0].location.x}, ${alternativeNpcs[0].location.y})`
          );
        }
      }
    }
    
    // Suggest abandoning if too many issues
    if (result.invalidReasons.length > 3) {
      result.suggestions.push('Consider abandoning this quest and finding another');
    }
  }

  /**
   * Check if a resource is available in the current area
   */
  private isResourceAvailableInArea(
    resourceType: string,
    worldState: WorldState
  ): boolean {
    // Simplified check - would need full resource availability data
    const biomeResources: Record<string, string[]> = {
      'FOREST': ['wood', 'berries', 'mushrooms'],
      'PLAINS': ['wheat', 'grass', 'flowers'],
      'DESERT': ['cactus', 'sand', 'stones'],
      'MOUNTAIN': ['ore', 'stone', 'gems'],
      'SWAMP': ['herbs', 'fish', 'mud'],
      'TUNDRA': ['ice', 'fur', 'fish']
    };
    
    // Check tiles around player for resource availability
    const radius = 10;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = worldState.playerLocation.x + dx;
        const y = worldState.playerLocation.y + dy;
        
        if (x >= 0 && x < worldState.mapData.tiles[0].length &&
            y >= 0 && y < worldState.mapData.tiles.length) {
          const tile = worldState.mapData.tiles[y][x];
          const resources = biomeResources[tile.biome] || [];
          
          if (resources.includes(resourceType.toLowerCase())) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Simple path existence check
   */
  private checkPathExists(
    start: { x: number; y: number },
    end: { x: number; y: number },
    mapData: MapData
  ): boolean {
    // Very simplified - just check if both points are on land
    // Real implementation would use A* or similar
    const startTile = mapData.tiles[start.y]?.[start.x];
    const endTile = mapData.tiles[end.y]?.[end.x];
    
    return startTile?.isLand && endTile?.isLand;
  }

  /**
   * Validate all active quests
   */
  public validateAllQuests(
    quests: Quest[],
    worldState: WorldState
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    for (const quest of quests) {
      if (quest.status === 'active') {
        results.set(quest.id, this.validateQuest(quest, worldState));
      }
    }
    
    return results;
  }

  /**
   * Auto-repair quests if possible
   */
  public autoRepairQuest(quest: BoundQuest, worldState: WorldState): BoundQuest | null {
    const validation = this.validateQuest(quest, worldState);
    
    if (validation.isValid) {
      return quest; // No repair needed
    }
    
    // Try to repair by finding alternative entities
    const repairedQuest = { ...quest };
    let repaired = false;
    
    for (const objective of validation.repairableObjectives) {
      const boundObj = objective as any;
      
      if (boundObj.boundEntityId) {
        // Find alternative entity of same type
        const originalEntity = worldEntityRegistry.getEntity(boundObj.boundEntityId);
        
        if (originalEntity) {
          const alternatives = worldEntityRegistry.queryEntities({
            type: originalEntity.type,
            maxDistance: 50,
            active: true
          });
          
          if (alternatives.length > 0) {
            // Update objective with new entity
            boundObj.boundEntityId = alternatives[0].id;
            boundObj.boundEntityName = alternatives[0].name;
            boundObj.targetLocation = alternatives[0].location;
            repaired = true;
          }
        }
      }
    }
    
    return repaired ? repairedQuest : null;
  }
}

// Export singleton instance
export const questValidationService = new QuestValidationService();

// Also export class for testing
export default QuestValidationService;