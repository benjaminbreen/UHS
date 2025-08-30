/**
 * services/npcInitiatedEncounterService.ts
 * Handles NPCs initiating encounters with the player
 */

import { NpcEntity, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue } from './llmService';

export interface NPCApproachResult {
  npcId: string;
  npcName: string;
  dialogue: string;
  distance: number;
  isHostile: boolean;
}

/**
 * Makes nearby NPCs approach the player after an intimidating shout
 */
export async function handleIntimidatingShout(
  playerCharacter: PlayerCharacter,
  npcs: NpcEntity[],
  playerX: number,
  playerY: number,
  mapData: MapData
): Promise<NPCApproachResult[]> {
  const results: NPCApproachResult[] = [];
  const nearbyNPCs: NpcEntity[] = [];
  
  // Find NPCs within 3 tiles
  npcs.forEach(npc => {
    const distance = Math.sqrt(
      Math.pow(npc.x - playerX, 2) + 
      Math.pow(npc.y - playerY, 2)
    );
    
    if (distance <= 3 && distance > 0) { // Within 3 tiles but not on same tile
      nearbyNPCs.push(npc);
    }
  });
  
  // Make each NPC react
  for (const npc of nearbyNPCs) {
    const distance = Math.sqrt(
      Math.pow(npc.x - playerX, 2) + 
      Math.pow(npc.y - playerY, 2)
    );
    
    try {
      // Generate contextual dialogue for the NPC's reaction
      const dialogue = await generateEncounterDialogue(
        npc,
        playerCharacter,
        mapData,
        `${playerCharacter.name} just let out a loud, intimidating shout.`,
        'confused' // Emotional state
      );
      
      results.push({
        npcId: npc.id,
        npcName: npc.name,
        dialogue: dialogue.text,
        distance,
        isHostile: false
      });
      
      // Move the NPC toward the player (they approach to investigate)
      const dx = Math.sign(playerX - npc.x);
      const dy = Math.sign(playerY - npc.y);
      
      // Update NPC position to move 1 tile closer
      npc.x += dx;
      npc.y += dy;
      
    } catch (error) {
      // Fallback dialogue if LLM fails
      const fallbackDialogues = [
        "What's wrong with you? Why are you shouting like that?",
        "Are you alright? That was quite a yell!",
        "By the gods, you startled me! What's the matter?",
        "Is there danger? Why the shouting?",
        "Calm yourself! There's no need for such noise!"
      ];
      
      results.push({
        npcId: npc.id,
        npcName: npc.name,
        dialogue: fallbackDialogues[Math.floor(Math.random() * fallbackDialogues.length)],
        distance,
        isHostile: false
      });
    }
  }
  
  return results;
}

/**
 * Check if NPCs should approach player based on reputation
 */
export function checkReputationBasedApproach(
  playerCharacter: PlayerCharacter,
  npcs: NpcEntity[],
  playerX: number,
  playerY: number
): NpcEntity[] {
  const approachingNPCs: NpcEntity[] = [];
  
  // Only trigger if reputation is very low
  if (playerCharacter.mapReputation >= 20) {
    return approachingNPCs;
  }
  
  // Find NPCs within reasonable distance (10 tiles)
  npcs.forEach(npc => {
    const distance = Math.sqrt(
      Math.pow(npc.x - playerX, 2) + 
      Math.pow(npc.y - playerY, 2)
    );
    
    if (distance <= 10 && distance > 1) {
      // Higher chance to approach with lower reputation
      const approachChance = (20 - playerCharacter.mapReputation) / 40; // 0-50% chance
      
      if (Math.random() < approachChance) {
        // Move NPC toward player
        const dx = Math.sign(playerX - npc.x);
        const dy = Math.sign(playerY - npc.y);
        
        npc.x += dx;
        npc.y += dy;
        
        approachingNPCs.push(npc);
      }
    }
  });
  
  return approachingNPCs;
}

/**
 * Generate hostile dialogue for low-reputation encounters
 */
export async function generateLowReputationDialogue(
  npc: NpcEntity,
  playerCharacter: PlayerCharacter,
  mapData: MapData
): Promise<string> {
  try {
    const dialogue = await generateEncounterDialogue(
      npc,
      playerCharacter,
      mapData,
      `${playerCharacter.name} has a terrible reputation (${playerCharacter.mapReputation}/100) in the area. The NPC wants them to leave.`,
      'hostile'
    );
    
    return dialogue.text;
  } catch (error) {
    // Fallback hostile dialogues
    const hostileDialogues = [
      "You're not welcome here. Move along before there's trouble.",
      "We know what you've done. Leave this place at once!",
      "Your reputation precedes you. Get out of here!",
      "Haven't you caused enough trouble? Leave now!",
      "You should go. People here don't take kindly to your sort."
    ];
    
    return hostileDialogues[Math.floor(Math.random() * hostileDialogues.length)];
  }
}