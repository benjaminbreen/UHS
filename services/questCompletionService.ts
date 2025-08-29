/**
 * Quest Completion Service
 * Handles quest completion logic, NPC interactions, and item management for quests
 */

import { Quest, QuestObjective } from '../types/questTypes';
import { NpcEntity, PlayerCharacter, MapData, Item } from '../types';
import { questService } from './questService';
import { createItemInstance } from '../utils/inventoryUtils';

export class QuestCompletionService {
  /**
   * Find or create a related NPC for delivery quests
   */
  findOrCreateQuestNPC(
    questGiver: NpcEntity,
    relationship: string,
    allNpcs: NpcEntity[],
    mapData: MapData
  ): { npc: NpcEntity; location: { x: number; y: number } } | null {
    // Parse relationship (e.g., "sister", "brother", "merchant friend")
    const relationLower = relationship.toLowerCase();
    
    // First, try to find an existing NPC with the same last name for family
    if (relationLower.includes('sister') || relationLower.includes('brother') || 
        relationLower.includes('parent') || relationLower.includes('cousin')) {
      
      const lastName = questGiver.name.split(' ').pop();
      const familyMember = allNpcs.find(npc => 
        npc.id !== questGiver.id && 
        npc.name.includes(lastName!) &&
        this.isAppropriateAge(questGiver, npc, relationLower)
      );
      
      if (familyMember) {
        return {
          npc: familyMember,
          location: { x: familyMember.x, y: familyMember.y }
        };
      }
      
      // Create a new family member NPC
      return this.createFamilyMemberNPC(questGiver, relationLower, mapData);
    }
    
    // For non-family relationships, find appropriate NPCs by role
    if (relationLower.includes('merchant') || relationLower.includes('trader')) {
      const merchant = allNpcs.find(npc => 
        npc.role?.toLowerCase().includes('merchant') ||
        npc.role?.toLowerCase().includes('trader')
      );
      
      if (merchant) {
        return {
          npc: merchant,
          location: { x: merchant.x, y: merchant.y }
        };
      }
    }
    
    // Default: find any NPC at a different location
    const otherNpc = allNpcs.find(npc => 
      npc.id !== questGiver.id &&
      (npc.x !== questGiver.x || npc.y !== questGiver.y)
    );
    
    if (otherNpc) {
      return {
        npc: otherNpc,
        location: { x: otherNpc.x, y: otherNpc.y }
      };
    }
    
    return null;
  }
  
  /**
   * Check if age is appropriate for relationship
   */
  private isAppropriateAge(npc1: NpcEntity, npc2: NpcEntity, relationship: string): boolean {
    const age1 = npc1.age || 30;
    const age2 = npc2.age || 30;
    const ageDiff = Math.abs(age1 - age2);
    
    if (relationship.includes('sister') || relationship.includes('brother')) {
      return ageDiff < 15; // Siblings usually within 15 years
    }
    if (relationship.includes('parent')) {
      return Math.abs(age1 - age2) > 15 && Math.abs(age1 - age2) < 50;
    }
    if (relationship.includes('cousin')) {
      return ageDiff < 20;
    }
    
    return true;
  }
  
  /**
   * Create a new family member NPC
   */
  private createFamilyMemberNPC(
    questGiver: NpcEntity,
    relationship: string,
    mapData: MapData
  ): { npc: NpcEntity; location: { x: number; y: number } } | null {
    const lastName = questGiver.name.split(' ').pop();
    const firstNames = ['Anna', 'Maria', 'John', 'William', 'Sarah', 'Elizabeth', 'Thomas', 'Margaret'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    
    // Find a nearby structure to place the NPC
    const structures = mapData.terrainStructures || [];
    const nearbyStructures = structures.filter(s => {
      const distance = Math.sqrt(
        Math.pow((s.x || 0) - questGiver.x, 2) + 
        Math.pow((s.y || 0) - questGiver.y, 2)
      );
      return distance > 5 && distance < 30; // Not too close, not too far
    });
    
    if (nearbyStructures.length === 0) return null;
    
    const targetStructure = nearbyStructures[0];
    
    // Calculate appropriate age
    let age = questGiver.age || 30;
    if (relationship.includes('sister') || relationship.includes('brother')) {
      age += Math.floor(Math.random() * 10) - 5; // ±5 years
    } else if (relationship.includes('parent')) {
      age += 25; // Parent is older
    } else if (relationship.includes('child')) {
      age -= 20; // Child is younger
    }
    
    const newNpc: NpcEntity = {
      id: `quest_npc_${Date.now()}`,
      name: `${firstName} ${lastName}`,
      type: 'human',
      emoji: relationship.includes('sister') || relationship.includes('mother') ? '👩' : '👨',
      x: targetStructure.x || 0,
      y: targetStructure.y || 0,
      age: Math.max(18, Math.min(80, age)),
      role: 'Citizen',
      class: questGiver.class || 'Common',
      level: 1,
      health: 100,
      currency: 50,
      inventory: [],
      memory: {
        conversationSummaries: [`I am ${questGiver.name}'s ${relationship.replace('_', ' ')}.`],
        opinionOfPlayer: 50,
        relationshipToQuestGiver: relationship,
        questRelated: true
      },
      isQuestTarget: true
    };
    
    // Add to map NPCs
    if (!mapData.npcs) mapData.npcs = [];
    mapData.npcs.push(newNpc);
    
    console.log(`[QuestCompletion] Created quest NPC: ${newNpc.name} at (${newNpc.x}, ${newNpc.y})`);
    
    return {
      npc: newNpc,
      location: { x: newNpc.x, y: newNpc.y }
    };
  }
  
  /**
   * Check if player can complete quest objective with this NPC
   */
  checkQuestCompletion(
    npc: NpcEntity,
    player: PlayerCharacter,
    activeQuests: Quest[]
  ): { canComplete: boolean; quest?: Quest; objective?: QuestObjective } {
    for (const quest of activeQuests) {
      const currentObj = quest.objectives[quest.currentObjectiveIndex];
      
      if (!currentObj || currentObj.completed) continue;
      
      // Check if this NPC is the target for the objective
      if (currentObj.type === 'talk_to_npc' || currentObj.type === 'deliver_item') {
        // Check by location proximity
        if (currentObj.targetLocation) {
          const distance = Math.sqrt(
            Math.pow(npc.x - currentObj.targetLocation.x, 2) +
            Math.pow(npc.y - currentObj.targetLocation.y, 2)
          );
          
          if (distance < 3) { // Within 3 tiles
            // For delivery, check if player has the item
            if (currentObj.type === 'deliver_item') {
              const hasItem = player.inventory.some(item => 
                item.baseId === currentObj.targetItem ||
                item.name?.toLowerCase().includes('package') ||
                item.name?.toLowerCase().includes('letter') ||
                item.isQuestItem
              );
              
              if (!hasItem) {
                console.log('[QuestCompletion] Player missing quest item for delivery');
                return { canComplete: false };
              }
            }
            
            return {
              canComplete: true,
              quest,
              objective: currentObj
            };
          }
        }
        
        // Check by NPC name/role
        if (currentObj.targetNPC) {
          if (npc.name.toLowerCase().includes(currentObj.targetNPC.toLowerCase()) ||
              npc.role?.toLowerCase().includes(currentObj.targetNPC.toLowerCase()) ||
              npc.isQuestTarget) {
            return {
              canComplete: true,
              quest,
              objective: currentObj
            };
          }
        }
      }
    }
    
    return { canComplete: false };
  }
  
  /**
   * Complete a quest objective
   */
  completeObjective(
    quest: Quest,
    objective: QuestObjective,
    player: PlayerCharacter
  ): { success: boolean; message: string; questComplete: boolean } {
    // Mark objective as complete
    objective.completed = true;
    objective.completedTime = Date.now();
    
    // Remove quest item from inventory if it was a delivery
    if (objective.type === 'deliver_item') {
      const itemIndex = player.inventory.findIndex(item =>
        item.baseId === objective.targetItem ||
        item.isQuestItem
      );
      
      if (itemIndex !== -1) {
        player.inventory.splice(itemIndex, 1);
      }
    }
    
    // Check if there are more objectives
    if (quest.currentObjectiveIndex < quest.objectives.length - 1) {
      quest.currentObjectiveIndex++;
      
      return {
        success: true,
        message: `Objective complete! Next: ${quest.objectives[quest.currentObjectiveIndex].description}`,
        questComplete: false
      };
    }
    
    // Quest is complete!
    quest.status = 'completed';
    quest.completedTime = Date.now();
    
    // Grant rewards
    if (quest.rewards) {
      quest.rewards.forEach(reward => {
        switch (reward.type) {
          case 'currency':
            player.currency = (player.currency || 0) + (reward.amount || 0);
            break;
          case 'reputation':
            player.mapReputation = (player.mapReputation || 50) + (reward.amount || 0);
            break;
          case 'item':
            if (reward.itemId) {
              const item = createItemInstance(reward.itemId);
              if (item) {
                player.inventory.push(item);
              }
            }
            break;
          case 'experience':
            player.experience = (player.experience || 0) + (reward.amount || 0);
            break;
        }
      });
    }
    
    // Move quest to completed
    questService.completeQuest(quest.id);
    
    return {
      success: true,
      message: `Quest "${quest.title}" completed! ${quest.rewards?.map(r => r.description).join(', ') || 'No rewards'}`,
      questComplete: true
    };
  }
  
  /**
   * Add quest item to player inventory when accepting quest
   */
  addQuestItem(
    player: PlayerCharacter,
    questTitle: string,
    itemType: string = 'package'
  ): Item {
    // Create a quest-specific item
    const questItem: Item = {
      id: `quest_item_${Date.now()}`,
      baseId: `QUEST_${itemType.toUpperCase()}`,
      name: this.getQuestItemName(itemType, questTitle),
      description: `A quest item for: ${questTitle}`,
      quantity: 1,
      category: 'quest',
      weight: 0.5,
      value: 0, // Quest items have no sell value
      isQuestItem: true,
      questId: questTitle
    };
    
    // Add to player inventory
    player.inventory.push(questItem);
    
    console.log(`[QuestCompletion] Added quest item: ${questItem.name}`);
    
    return questItem;
  }
  
  /**
   * Generate appropriate quest item name
   */
  private getQuestItemName(itemType: string, questTitle: string): string {
    const lower = itemType.toLowerCase();
    
    if (lower.includes('package')) {
      return 'Sealed Package';
    }
    if (lower.includes('letter')) {
      return 'Important Letter';
    }
    if (lower.includes('message')) {
      return 'Urgent Message';
    }
    if (lower.includes('parcel')) {
      return 'Wrapped Parcel';
    }
    if (lower.includes('goods')) {
      return 'Trade Goods';
    }
    if (lower.includes('medicine')) {
      return 'Medicine Bundle';
    }
    if (lower.includes('supplies')) {
      return 'Supply Crate';
    }
    
    return 'Quest Item';
  }
}

// Export singleton instance
export const questCompletionService = new QuestCompletionService();