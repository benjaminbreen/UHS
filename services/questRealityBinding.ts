/**
 * Quest Reality Binding Service
 * Binds quest objectives to actual game world entities
 */

import { Quest, QuestObjective } from '../types/questTypes';
import { worldEntityRegistry, RegisteredEntity } from './worldEntityRegistry';
import { Ruler } from '../types/rulerTypes';
import { NpcEntity } from '../types/npcTypes';

export interface BoundQuestObjective extends QuestObjective {
  boundEntityId?: string;
  boundEntityName?: string;
  boundEntityType?: RegisteredEntity['type'];
  originalDescription?: string;
}

export interface BoundQuest extends Omit<Quest, 'objectives'> {
  objectives: BoundQuestObjective[];
  boundEntities: string[]; // Entity IDs this quest is bound to
}

class QuestRealityBinding {
  /**
   * Bind a quest to real world entities
   */
  public bindQuestToReality(
    quest: Quest,
    playerLocation: { x: number; y: number },
    zone: string,
    era: string
  ): BoundQuest {
    const boundEntities: string[] = [];
    const boundObjectives: BoundQuestObjective[] = [];

    // Update registry with player location for distance calculations
    worldEntityRegistry.updatePlayerLocation(playerLocation);

    // Ensure objectives is an array
    if (!quest.objectives || !Array.isArray(quest.objectives)) {
      console.warn('[QuestRealityBinding] Quest has no objectives array, initializing empty array');
      quest.objectives = [];
    }

    for (const objective of quest.objectives) {
      const boundObjective = this.bindObjective(objective, zone, era);
      boundObjectives.push(boundObjective);
      
      if (boundObjective.boundEntityId) {
        boundEntities.push(boundObjective.boundEntityId);
      }
    }

    // Update quest description with real names
    const boundQuest: BoundQuest = {
      ...quest,
      description: this.updateDescriptionWithEntities(quest.description, boundEntities),
      objectives: boundObjectives,
      boundEntities
    };

    return boundQuest;
  }

  /**
   * Bind a single objective to a real entity
   */
  private bindObjective(
    objective: QuestObjective,
    zone: string,
    era: string
  ): BoundQuestObjective {
    const boundObjective: BoundQuestObjective = { ...objective };

    // Store original description
    boundObjective.originalDescription = objective.description;

    switch (objective.type) {
      case 'talk_to_npc':
      case 'deliver_to_npc':
      case 'negotiate_with_npc':
        this.bindToNpc(boundObjective, zone);
        break;

      case 'visit_location':
      case 'explore_area':
      case 'defend_location':
        this.bindToStructure(boundObjective, zone);
        break;

      case 'talk_to_ruler':
      case 'deliver_to_ruler':
        this.bindToRuler(boundObjective, zone);
        break;

      case 'trade_with_merchant':
        this.bindToMerchant(boundObjective, zone);
        break;

      case 'investigate_landmark':
      case 'discover_landmark':
        this.bindToLandmark(boundObjective, zone);
        break;

      case 'raid_settlement':
      case 'defend_settlement':
      case 'visit_settlement':
        this.bindToSettlement(boundObjective, zone);
        break;
    }

    return boundObjective;
  }

  /**
   * Bind objective to a specific NPC
   */
  private bindToNpc(objective: BoundQuestObjective, zone: string): void {
    // Find appropriate NPCs based on objective context
    const query = {
      type: 'npc' as const,
      zone,
      maxDistance: 30,
      active: true
    };

    // If objective mentions specific profession, filter for it
    const professionMatch = objective.description.match(
      /(?:talk to|deliver to|find|meet|negotiate with) (?:the |a |an )?([\w\s]+?)(?:\s+at|\s+in|\s+near|$)/i
    );
    
    if (professionMatch) {
      const profession = professionMatch[1].toLowerCase();
      query.attributes = { profession };
    }

    const npcs = worldEntityRegistry.queryEntities(query);
    
    if (npcs.length > 0) {
      // Prefer NPCs with special roles
      const specialNpc = npcs.find(n => n.attributes.specialRole);
      const selectedNpc = specialNpc || npcs[0];
      
      objective.boundEntityId = selectedNpc.id;
      objective.boundEntityName = selectedNpc.name;
      objective.boundEntityType = 'npc';
      objective.targetLocation = selectedNpc.location;

      // Update description with actual NPC name
      objective.description = objective.description.replace(
        /(?:the |a |an )?(?:local |nearby |village |town )?[\w\s]+$/i,
        selectedNpc.name
      );

      // Add profession context if relevant
      if (selectedNpc.attributes.profession) {
        objective.description += ` (${selectedNpc.attributes.profession})`;
      }
    }
  }

  /**
   * Bind objective to a specific structure
   */
  private bindToStructure(objective: BoundQuestObjective, zone: string): void {
    // Extract structure type from description
    const structureTypes = [
      'marketplace', 'palace', 'temple', 'shrine', 'forge', 'mill',
      'bridge', 'fortress', 'watchtower', 'hamlet', 'church', 'mosque',
      'synagogue', 'monastery', 'castle', 'keep', 'tower', 'gate'
    ];

    let targetType: string | undefined;
    for (const type of structureTypes) {
      if (objective.description.toLowerCase().includes(type)) {
        targetType = type;
        break;
      }
    }

    const query = {
      type: 'structure' as const,
      zone,
      maxDistance: 50,
      active: true
    };

    if (targetType) {
      query.attributes = { structureType: targetType };
    }

    const structures = worldEntityRegistry.queryEntities(query);
    
    if (structures.length > 0) {
      const selectedStructure = structures[0];
      
      objective.boundEntityId = selectedStructure.id;
      objective.boundEntityName = selectedStructure.name;
      objective.boundEntityType = 'structure';
      objective.targetLocation = selectedStructure.location;

      // Update description with actual structure name if it's named
      if (selectedStructure.name !== selectedStructure.attributes.structureType) {
        const genericPattern = new RegExp(
          `(?:the |a |an )?(?:local |nearby |abandoned |old |ancient )?${targetType || 'location'}`,
          'gi'
        );
        objective.description = objective.description.replace(
          genericPattern,
          selectedStructure.name
        );
      }
    }
  }

  /**
   * Bind objective to the current ruler
   */
  private bindToRuler(objective: BoundQuestObjective, zone: string): void {
    const rulers = worldEntityRegistry.queryEntities({
      type: 'ruler',
      zone,
      active: true
    });

    if (rulers.length > 0) {
      const ruler = rulers[0];
      
      objective.boundEntityId = ruler.id;
      objective.boundEntityName = ruler.name;
      objective.boundEntityType = 'ruler';
      
      // Rulers might be in a palace or capital
      const palace = worldEntityRegistry.queryEntities({
        type: 'structure',
        attributes: { structureType: 'palace' },
        zone,
        maxDistance: 100
      })[0];
      
      if (palace) {
        objective.targetLocation = palace.location;
      }

      // Update description with ruler's actual name and title
      const rulerTitle = ruler.attributes.title || 'ruler';
      objective.description = objective.description.replace(
        /(?:the |local |regional )?(?:ruler|king|queen|emperor|sultan|chief|lord)/i,
        `${rulerTitle} ${ruler.name}`
      );
    }
  }

  /**
   * Bind objective to a merchant NPC
   */
  private bindToMerchant(objective: BoundQuestObjective, zone: string): void {
    const merchants = worldEntityRegistry.queryEntities({
      type: 'npc',
      zone,
      attributes: { profession: 'merchant' },
      maxDistance: 30,
      active: true
    });

    if (merchants.length === 0) {
      // Fallback to any trader-like profession
      const traders = worldEntityRegistry.queryEntities({
        type: 'npc',
        zone,
        maxDistance: 30,
        active: true
      }).filter(npc => {
        const prof = npc.attributes.profession?.toLowerCase() || '';
        return prof.includes('trader') || prof.includes('vendor') || 
               prof.includes('seller') || prof.includes('dealer');
      });

      if (traders.length > 0) {
        merchants.push(...traders);
      }
    }

    if (merchants.length > 0) {
      const merchant = merchants[0];
      
      objective.boundEntityId = merchant.id;
      objective.boundEntityName = merchant.name;
      objective.boundEntityType = 'npc';
      objective.targetLocation = merchant.location;

      // Update description
      objective.description = objective.description.replace(
        /(?:a |the |local )?merchant/i,
        `${merchant.name} the ${merchant.attributes.profession}`
      );
    }
  }

  /**
   * Bind objective to a landmark
   */
  private bindToLandmark(objective: BoundQuestObjective, zone: string): void {
    const landmarks = worldEntityRegistry.queryEntities({
      type: 'landmark',
      zone,
      maxDistance: 100,
      active: true
    });

    if (landmarks.length > 0) {
      const landmark = landmarks[0];
      
      objective.boundEntityId = landmark.id;
      objective.boundEntityName = landmark.name;
      objective.boundEntityType = 'landmark';
      objective.targetLocation = landmark.location;

      // Update description
      objective.description = objective.description.replace(
        /(?:the |a |an )?(?:mysterious |ancient |hidden )?landmark/i,
        landmark.name
      );
    }
  }

  /**
   * Bind objective to a settlement
   */
  private bindToSettlement(objective: BoundQuestObjective, zone: string): void {
    const settlements = worldEntityRegistry.queryEntities({
      type: 'settlement',
      zone,
      maxDistance: 75,
      active: true
    });

    if (settlements.length > 0) {
      // Prefer larger settlements for important quests
      const sortedSettlements = settlements.sort((a, b) => 
        (b.attributes.population || 0) - (a.attributes.population || 0)
      );
      
      const settlement = sortedSettlements[0];
      
      objective.boundEntityId = settlement.id;
      objective.boundEntityName = settlement.name;
      objective.boundEntityType = 'settlement';
      objective.targetLocation = settlement.location;

      // Update description
      objective.description = objective.description.replace(
        /(?:the |a |an )?(?:nearby |local |neighboring )?(?:settlement|village|town|city)/i,
        settlement.name
      );
    }
  }

  /**
   * Update quest description with entity names
   */
  private updateDescriptionWithEntities(description: string, entityIds: string[]): string {
    let updatedDescription = description;

    for (const entityId of entityIds) {
      const entity = worldEntityRegistry.getEntity(entityId);
      if (entity) {
        // Replace generic references with specific names
        const patterns = this.getGenericPatterns(entity.type);
        for (const pattern of patterns) {
          if (pattern.test(updatedDescription)) {
            updatedDescription = updatedDescription.replace(pattern, entity.name);
            break;
          }
        }
      }
    }

    return updatedDescription;
  }

  /**
   * Get regex patterns for generic entity references
   */
  private getGenericPatterns(type: RegisteredEntity['type']): RegExp[] {
    switch (type) {
      case 'npc':
        return [
          /(?:a |an |the )?(?:local |village |town )?(?:resident|person|individual)/i,
          /someone in (?:the |this )?(?:area|region|zone)/i
        ];
      case 'ruler':
        return [
          /(?:the |our |your )?(?:local |regional )?(?:ruler|leader|chief|king|queen)/i
        ];
      case 'structure':
        return [
          /(?:a |an |the )?(?:nearby |local )?(?:building|structure|location)/i
        ];
      case 'settlement':
        return [
          /(?:a |an |the )?(?:nearby |neighboring )?(?:settlement|village|town|city)/i
        ];
      case 'landmark':
        return [
          /(?:a |an |the )?(?:mysterious |ancient )?landmark/i
        ];
      default:
        return [];
    }
  }

  /**
   * Validate that bound entities still exist and are accessible
   */
  public validateBoundQuest(quest: BoundQuest): boolean {
    for (const entityId of quest.boundEntities) {
      const entity = worldEntityRegistry.getEntity(entityId);
      if (!entity || !entity.active) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update quest if bound entities change
   */
  public updateBoundQuest(quest: BoundQuest): BoundQuest {
    const updatedObjectives: BoundQuestObjective[] = [];

    // Ensure objectives is an array
    if (!quest.objectives || !Array.isArray(quest.objectives)) {
      console.warn('[QuestRealityBinding] BoundQuest has no objectives array');
      quest.objectives = [];
    }

    for (const objective of quest.objectives) {
      if (objective.boundEntityId) {
        const entity = worldEntityRegistry.getEntity(objective.boundEntityId);
        
        if (!entity || !entity.active) {
          // Entity no longer exists, revert to original
          updatedObjectives.push({
            ...objective,
            description: objective.originalDescription || objective.description,
            boundEntityId: undefined,
            boundEntityName: undefined,
            boundEntityType: undefined
          });
        } else {
          // Update location if entity moved
          updatedObjectives.push({
            ...objective,
            targetLocation: entity.location
          });
        }
      } else {
        updatedObjectives.push(objective);
      }
    }

    return {
      ...quest,
      objectives: updatedObjectives
    };
  }
}

// Export singleton instance
export const questRealityBinding = new QuestRealityBinding();

// Also export class for testing
export default QuestRealityBinding;