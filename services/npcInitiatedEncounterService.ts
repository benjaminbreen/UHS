/**
 * services/npcInitiatedEncounterService.ts
 * Handles NPCs initiating encounters with the player
 * Performance-optimized with throttling and spatial indexing
 */

import { NpcEntity, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue } from './llmService';

/**
 * Check if two religions have historical conflicts
 */
function checkReligiousConflict(playerReligion: string, npcReligion: string): boolean {
  const conflicts = [
    ['Christian', 'Muslim'],
    ['Christian', 'Pagan'],
    ['Muslim', 'Pagan'],
    ['Catholic', 'Protestant'],
    ['Sunni', 'Shia'],
    ['Buddhist', 'Hindu'],
    ['Traditional', 'Christian'],
    ['Traditional', 'Muslim']
  ];
  
  return conflicts.some(([rel1, rel2]) => 
    (playerReligion.includes(rel1) && npcReligion.includes(rel2)) ||
    (playerReligion.includes(rel2) && npcReligion.includes(rel1))
  );
}

/**
 * Check if two factions have conflicts
 */
function checkFactionalConflict(playerFaction: string, npcFaction: string): boolean {
  const conflicts = [
    ['Royalist', 'Republican'],
    ['Imperial', 'Rebel'],
    ['Conservative', 'Revolutionary'],
    ['Nobility', 'Peasantry'],
    ['Merchant', 'Artisan'],
    ['Urban', 'Rural'],
    ['Military', 'Civilian'],
    ['Tribal', 'Settler']
  ];
  
  return conflicts.some(([fac1, fac2]) => 
    (playerFaction.includes(fac1) && npcFaction.includes(fac2)) ||
    (playerFaction.includes(fac2) && npcFaction.includes(fac1))
  );
}

export interface NPCApproachResult {
  npcId: string;
  npcName: string;
  dialogue: string;
  distance: number;
  isHostile: boolean;
  approachType: 'hostile' | 'friendly' | 'merchant' | 'quest' | 'beggar' | 'guard' | 'theft';
  priority: number; // Higher priority approaches happen first
}

export interface ApproachContext {
  playerReputation: number;
  timeOfDay: number; // 0-23
  playerWealth: number; // Estimate based on inventory
  playerHealth: number; // 0-100
  isInTown: boolean;
  isNearStructure: boolean;
}

// Performance optimization: Track last approach times to prevent spam
const npcLastApproachTimes: Map<string, number> = new Map();
const APPROACH_COOLDOWN_MS = 30000; // 30 second cooldown per NPC

// Performance optimization: Track last approach check to throttle system
let lastSystemCheck = 0;
const SYSTEM_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

/**
 * Calculate approach probability for an NPC based on multiple factors
 * Returns 0-1 probability and approach type
 */
function calculateApproachProbability(
  npc: NpcEntity, 
  context: ApproachContext,
  distance: number
): { probability: number; type: NPCApproachResult['approachType']; priority: number } {
  
  let baseProbability = 0.02; // 2% base chance per check
  let approachType: NPCApproachResult['approachType'] = 'friendly';
  let priority = 1;

  // Distance modifier - closer NPCs more likely to approach
  const distanceModifier = Math.max(0.1, 1 - (distance / 8)); // Drops to 10% at 8 tiles
  baseProbability *= distanceModifier;

  // Occupation-based modifiers
  const occupation = npc.occupation?.toLowerCase() || '';
  
  if (occupation.includes('merchant') || occupation.includes('trader')) {
    baseProbability *= 3; // Merchants 3x more likely
    approachType = 'merchant';
    priority = 2;
    
    // Merchants approach wealthy players more
    if (context.playerWealth > 50) baseProbability *= 1.5;
  }
  
  else if (occupation.includes('guard') || occupation.includes('soldier')) {
    if (context.playerReputation < 30) {
      baseProbability *= 8; // Guards very likely to approach troublemakers
      approachType = 'guard';
      priority = 5; // Highest priority
    } else {
      baseProbability *= 0.3; // Less likely to approach good citizens
    }
  }
  
  else if (occupation.includes('beggar') || (npc.health && npc.health < 30)) {
    baseProbability *= 2;
    approachType = 'beggar';
    priority = 1;
    
    // Beggars approach wealthy players more
    if (context.playerWealth > 30) baseProbability *= 2;
  }
  
  else if (occupation.includes('thief') || (npc.personality && npc.personality.agreeableness < 0.3)) { // Low agreeableness = greedy
    if (context.playerWealth > 40) {
      baseProbability *= 1.5;
      approachType = 'theft';
      priority = 3;
    }
    
    // More likely at night
    if (context.timeOfDay > 20 || context.timeOfDay < 6) {
      baseProbability *= 2;
    }
  }

  // Quest approach logic - NPCs with urgent needs or interesting information
  else if (
    // Scholars, nobles, officials might have quests
    occupation.includes('scholar') || occupation.includes('noble') || 
    occupation.includes('official') || occupation.includes('priest') ||
    occupation.includes('elder') || occupation.includes('captain') ||
    // Or any NPC with high charisma/reputation who might need help
    (npc.charisma && npc.charisma > 12) ||
    // Or NPCs in distress (low health)
    (npc.health && npc.health < 50)
  ) {
    // Base 4% chance for quest approaches
    baseProbability = Math.max(baseProbability, 0.04);
    approachType = 'quest';
    priority = 4; // High priority - quests are important
    
    // Higher reputation players get more quest offers
    if (context.playerReputation > 60) {
      baseProbability *= 2.5;
    } else if (context.playerReputation > 30) {
      baseProbability *= 1.5;
    }
    
    // NPCs with very low health approach more often
    if (npc.health && npc.health < 30) baseProbability *= 3;
  }

  // Religion/Faction confrontation logic
  if (context.playerReligion && npc.religion && 
      context.playerReligion !== npc.religion) {
    
    // Check for known religious conflicts
    const hasReligiousConflict = checkReligiousConflict(
      context.playerReligion, 
      npc.religion
    );
    
    if (hasReligiousConflict) {
      baseProbability *= 3; // 3x more likely to approach
      approachType = 'hostile';
      priority = 4;
    }
  }

  // Faction conflict logic
  if (context.playerFaction && npc.faction && 
      context.playerFaction !== npc.faction) {
    
    const hasFactionalConflict = checkFactionalConflict(
      context.playerFaction, 
      npc.faction
    );
    
    if (hasFactionalConflict) {
      baseProbability *= 2.5;
      approachType = 'hostile';
      priority = 3;
    }
  }

  // Personality-based confrontation (using numeric traits)
  if (npc.personality) {
    // Low agreeableness and high neuroticism = aggressive/confrontational
    if (npc.personality.agreeableness < 0.3 && npc.personality.neuroticism > 0.6) {
      baseProbability *= 2;
      if (Math.random() < 0.3) approachType = 'hostile';
    }
    
    // High extraversion = social/extroverted
    if (npc.personality.extraversion > 0.7) {
      baseProbability *= 1.5; // More likely to approach
    }
  }

  // Reputation modifiers
  if (context.playerReputation < 20) {
    baseProbability *= 2; // Bad reputation draws attention
    if (approachType === 'friendly') {
      approachType = 'hostile';
      priority = 4;
    }
  } else if (context.playerReputation > 80) {
    baseProbability *= 1.3; // Good reputation draws friendly approaches
  }

  // Time of day modifiers
  if (context.timeOfDay > 22 || context.timeOfDay < 6) {
    baseProbability *= 0.5; // Less activity at night
    
    if (approachType === 'merchant') baseProbability *= 0.2; // Merchants don't approach at night
    if (approachType === 'theft') baseProbability *= 3; // But thieves do
  }

  // Health-based modifiers
  if (context.playerHealth < 30) {
    baseProbability *= 1.4; // Injured players draw attention
    if (approachType === 'friendly') approachType = 'friendly'; // Keep as concerned approach
  }

  // Location modifiers
  if (context.isInTown) {
    baseProbability *= 1.2; // More social interactions in towns
    if (approachType === 'theft') baseProbability *= 0.3; // Less theft in towns
  }

  return { 
    probability: Math.min(0.15, baseProbability), // Cap at 15% to prevent spam
    type: approachType, 
    priority 
  };
}

/**
 * Performance-optimized approach detection
 * Only checks visible NPCs and uses spatial filtering
 */
export function checkNPCApproaches(
  playerCharacter: PlayerCharacter,
  visibleNPCs: NpcEntity[], // Only pass visible NPCs for performance
  playerX: number,
  playerY: number,
  context: ApproachContext
): NPCApproachResult[] {
  
  const currentTime = Date.now();
  
  // Throttle system checks for performance
  if (currentTime - lastSystemCheck < SYSTEM_CHECK_INTERVAL_MS) {
    return [];
  }
  
  lastSystemCheck = currentTime;
  
  const approaches: NPCApproachResult[] = [];
  
  // Limit to checking max 10 NPCs per frame for performance
  const npcsToCheck = visibleNPCs.slice(0, 10);
  
  for (const npc of npcsToCheck) {
    // Skip if NPC is on cooldown
    const lastApproach = npcLastApproachTimes.get(npc.id);
    if (lastApproach && currentTime - lastApproach < APPROACH_COOLDOWN_MS) {
      continue;
    }
    
    const distance = Math.sqrt(
      Math.pow(npc.x - playerX, 2) + 
      Math.pow(npc.y - playerY, 2)
    );
    
    // Only consider NPCs within 6 tiles for performance
    if (distance > 6 || distance < 1) continue;
    
    const { probability, type, priority } = calculateApproachProbability(npc, context, distance);
    
    // Roll for approach
    if (Math.random() < probability) {
      approaches.push({
        npcId: npc.id,
        npcName: npc.name,
        dialogue: '', // Will be generated later
        distance,
        isHostile: type === 'hostile' || type === 'guard' || type === 'theft',
        approachType: type,
        priority
      });
      
      // Set cooldown
      npcLastApproachTimes.set(npc.id, currentTime);
    }
  }
  
  // Sort by priority (highest first) and only return top approach to prevent overwhelm
  approaches.sort((a, b) => b.priority - a.priority);
  return approaches.slice(0, 1); // Only one approach at a time
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

/**
 * Generate approach-specific dialogue
 * Uses fallbacks for performance when LLM is unavailable
 */
export async function generateApproachDialogue(
  npc: NpcEntity,
  playerCharacter: PlayerCharacter,
  mapData: MapData,
  approachType: NPCApproachResult['approachType']
): Promise<string> {
  
  // Fallback dialogues for performance (no LLM call needed)
  const fallbackDialogues = {
    merchant: [
      "Psst! Over here! I have some fine wares that might interest you.",
      "Good day, traveler! Care to see what I have for sale?",
      "You look like someone who appreciates quality goods. Come, take a look!",
      "Finest goods in the region! Step right up!"
    ],
    guard: [
      "Hold there! State your business in this area.",
      "You there! I need to have a word with you.",
      "Stop right there. We've been looking for someone matching your description.",
      "Halt! This area is under watch. Explain yourself."
    ],
    beggar: [
      "Kind soul, could you spare a copper for one down on their luck?",
      "Please, I haven't eaten in days. Any charity would be a blessing.",
      "You look prosperous... surely you could help a fellow human?",
      "By your fine clothes, I can see fortune has favored you. Might you share some?"
    ],
    theft: [
      "What a lovely day for a walk, don't you think?", // Casual approach before theft
      "You seem new to these parts. Need any... directions?",
      "Fine weather we're having. Say, is that a fine purse you carry?"
    ],
    friendly: [
      "Good day to you! How fares your journey?",
      "Greetings, traveler! You seem to be far from home.",
      "Hello there! It's always pleasant to meet a fellow wanderer.",
      "Peace be with you, friend. Where does your path lead you?"
    ],
    hostile: [
      "You! I know what you've done. We don't want your kind here.",
      "Turn around and leave. Now. Before there's trouble.",
      "Your reputation precedes you. Get out of here!",
      "We don't take kindly to troublemakers like you."
    ],
    quest: [
      "You there! You look capable. I have a proposition for you.",
      "Traveler! Your timing is perfect. I need someone with your skills.",
      "Excuse me! You seem like someone who can handle difficult tasks.",
      "A moment of your time? I have urgent business that requires assistance."
    ]
  };

  // Use fallback for performance in most cases
  const dialogues = fallbackDialogues[approachType];
  const fallback = dialogues[Math.floor(Math.random() * dialogues.length)];

  // Only use LLM for special cases or high-value interactions
  const shouldUseLLM = Math.random() < 0.3 && (approachType === 'quest' || approachType === 'guard');
  
  if (shouldUseLLM) {
    try {
      const contextMessage = getApproachContextMessage(approachType, playerCharacter);
      const dialogue = await generateEncounterDialogue(
        npc,
        playerCharacter,
        mapData,
        contextMessage,
        approachType === 'hostile' || approachType === 'guard' ? 'hostile' : 'neutral'
      );
      return dialogue.text;
    } catch (error) {
      console.log(`[NPCApproach] LLM failed, using fallback for ${approachType}`);
      return fallback;
    }
  }

  return fallback;
}

/**
 * Get context message for LLM dialogue generation
 */
function getApproachContextMessage(
  approachType: NPCApproachResult['approachType'],
  playerCharacter: PlayerCharacter
): string {
  switch (approachType) {
    case 'merchant':
      return `The NPC is a merchant who wants to sell goods to ${playerCharacter.name}.`;
    case 'guard':
      return `The NPC is a guard questioning ${playerCharacter.name} due to their reputation (${playerCharacter.mapReputation}/100).`;
    case 'beggar':
      return `The NPC is desperate for money or food and is asking ${playerCharacter.name} for help.`;
    case 'theft':
      return `The NPC is planning to pickpocket ${playerCharacter.name} but is approaching casually first.`;
    case 'quest':
      return `The NPC has an urgent task and believes ${playerCharacter.name} can help them.`;
    case 'hostile':
      return `The NPC dislikes ${playerCharacter.name} due to their poor reputation and wants them to leave.`;
    default:
      return `The NPC is approaching ${playerCharacter.name} for a friendly conversation.`;
  }
}

/**
 * Estimate player wealth based on inventory (performance optimized)
 */
export function estimatePlayerWealth(playerCharacter: PlayerCharacter): number {
  if (!playerCharacter.inventory) return 0;
  
  let wealth = 0;
  const itemCount = playerCharacter.inventory.length;
  
  // Quick estimation without deep analysis for performance
  wealth += Math.min(itemCount * 2, 50); // 2 points per item, cap at 50
  
  // Bonus for specific valuable items (quick check)
  const valuableItems = playerCharacter.inventory.filter(item => 
    item.name.toLowerCase().includes('gold') ||
    item.name.toLowerCase().includes('silver') ||
    item.name.toLowerCase().includes('jewel') ||
    item.name.toLowerCase().includes('gem')
  );
  
  wealth += valuableItems.length * 10;
  
  return Math.min(wealth, 100); // Cap at 100
}