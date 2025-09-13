/**
 * services/npcAwarenessService.ts
 * Handles NPC awareness of player actions, particularly item collection/theft
 */

import { NpcEntity, Tile, Item } from '../types';
import { eventBus } from './eventBus';

export interface ItemCollectionEvent {
  playerPos: { x: number; y: number };
  item: Item;
  containerOwner?: string;
  isTheft: boolean;
  action: 'collected' | 'stolen' | 'found' | 'looted';
}

export interface NpcReaction {
  npc: NpcEntity;
  reactionType: 'saw_theft' | 'saw_collection' | 'suspicious' | 'confronting';
  distance: number;
  hasLineOfSight: boolean;
  dialogue?: string;
  reputationImpact?: number;
}

// Detection ranges by NPC role
const DETECTION_RANGES = {
  guard: 12,        // Guards are very observant
  merchant: 8,      // Merchants watch their goods
  noble: 6,         // Nobles notice impropriety
  priest: 8,        // Religious figures are watchful
  commoner: 5,      // Regular people less observant
  default: 5
};

// Reaction severity by NPC role
const REACTION_SEVERITY = {
  guard: 1.5,       // Guards react strongly
  merchant: 1.2,    // Merchants protect their interests
  noble: 1.3,       // Nobles demand respect
  priest: 1.1,      // Religious figures judge morally
  default: 1.0
};

/**
 * Calculate Euclidean distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if there's a clear line of sight between two points
 * Uses Bresenham's line algorithm to check for walls
 */
function hasLineOfSight(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  tiles: Tile[][]
): boolean {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  while (x !== x2 || y !== y2) {
    // Check if current tile blocks sight (walls, etc.)
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[y].length) {
      const tile = tiles[y][x];
      // Check if tile blocks line of sight
      if (tile.isBlocking || tile.biome === 'WALL' || tile.biome === 'DOOR_LOCKED') {
        // Don't block if it's the starting or ending position
        if ((x !== x1 || y !== y1) && (x !== x2 || y !== y2)) {
          return false;
        }
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return true;
}

/**
 * Get NPC's detection range based on their role
 */
function getNpcDetectionRange(npc: NpcEntity): number {
  const role = npc.role?.toLowerCase() || '';
  
  // Check for specific roles
  for (const [key, range] of Object.entries(DETECTION_RANGES)) {
    if (role.includes(key)) {
      return range;
    }
  }
  
  return DETECTION_RANGES.default;
}

/**
 * Generate contextual dialogue for NPC reaction
 */
function generateReactionDialogue(
  npc: NpcEntity,
  reaction: NpcReaction['reactionType'],
  item: Item
): string {
  const role = npc.role?.toLowerCase() || 'person';
  const npcName = npc.name || 'Someone';
  
  switch (reaction) {
    case 'saw_theft':
      if (role.includes('guard')) {
        return `Stop right there! You can't just take ${item.name}! That's theft!`;
      } else if (role.includes('merchant')) {
        return `Hey! Put that ${item.name} back! I saw you take it!`;
      } else if (role.includes('noble')) {
        return `How dare you! Taking ${item.name} right in front of me!`;
      } else {
        return `I saw that! You just stole ${item.name}!`;
      }
      
    case 'suspicious':
      if (role.includes('guard')) {
        return `What are you doing there? That ${item.name} doesn't belong to you...`;
      } else {
        return `That ${item.name}... where did you get that?`;
      }
      
    case 'confronting':
      if (role.includes('guard')) {
        return `You're under arrest for stealing ${item.name}!`;
      } else {
        return `Thief! Guards! This person stole ${item.name}!`;
      }
      
    case 'saw_collection':
    default:
      if (item.value > 100) {
        return `Quite a valuable ${item.name} you found there...`;
      } else {
        return `I see you found ${item.name}.`;
      }
  }
}

/**
 * Calculate reputation impact based on action and witnesses
 */
function calculateReputationImpact(
  action: ItemCollectionEvent['action'],
  item: Item,
  witnesses: NpcReaction[]
): number {
  let impact = 0;
  
  // Base impact from action type
  switch (action) {
    case 'stolen':
      impact = -10; // Base theft penalty
      break;
    case 'looted':
      impact = -5;  // Taking from containers
      break;
    case 'found':
    case 'collected':
      impact = 0;   // No penalty for finding items
      break;
  }
  
  // Modify by item value
  if (item.value > 500) {
    impact *= 2;    // Double penalty for very valuable items
  } else if (item.value > 100) {
    impact *= 1.5;  // 50% more penalty for valuable items
  }
  
  // Modify by number of witnesses
  const witnessMultiplier = 1 + (witnesses.length * 0.2); // +20% per witness
  impact *= witnessMultiplier;
  
  // Apply role severity for witnesses
  witnesses.forEach(witness => {
    const role = witness.npc.role?.toLowerCase() || '';
    const severity = REACTION_SEVERITY[role as keyof typeof REACTION_SEVERITY] || REACTION_SEVERITY.default;
    impact *= severity;
  });
  
  return Math.floor(impact);
}

/**
 * Main function to check NPC awareness of item collection
 */
export function checkNpcAwareness(
  event: ItemCollectionEvent,
  npcs: NpcEntity[],
  tiles: Tile[][]
): NpcReaction[] {
  const reactions: NpcReaction[] = [];
  
  npcs.forEach(npc => {
    // Skip if NPC doesn't have position
    if (typeof npc.x !== 'number' || typeof npc.y !== 'number') {
      return;
    }
    
    // Calculate distance
    const distance = calculateDistance(
      event.playerPos.x,
      event.playerPos.y,
      npc.x,
      npc.y
    );
    
    // Check if within detection range
    const detectionRange = getNpcDetectionRange(npc);
    if (distance > detectionRange) {
      return; // Too far away
    }
    
    // Check line of sight
    const canSee = hasLineOfSight(
      npc.x,
      npc.y,
      event.playerPos.x,
      event.playerPos.y,
      tiles
    );
    
    if (!canSee && distance > 3) {
      return; // Can't see and not very close
    }
    
    // Determine reaction type
    let reactionType: NpcReaction['reactionType'];
    
    if (event.isTheft && canSee) {
      // Directly saw theft
      reactionType = 'saw_theft';
    } else if (event.isTheft && distance <= 3) {
      // Very close, suspicious even without sight
      reactionType = 'suspicious';
    } else if (event.action === 'stolen' && canSee && distance <= 5) {
      // Close enough to confront
      reactionType = 'confronting';
    } else {
      // Just saw collection
      reactionType = 'saw_collection';
    }
    
    // Generate dialogue
    const dialogue = generateReactionDialogue(npc, reactionType, event.item);
    
    // Create reaction
    reactions.push({
      npc,
      reactionType,
      distance,
      hasLineOfSight: canSee,
      dialogue,
      reputationImpact: reactionType === 'saw_theft' || reactionType === 'confronting' ? -5 : 0
    });
  });
  
  return reactions;
}

/**
 * Process NPC reactions and trigger appropriate events
 */
export function processNpcReactions(
  event: ItemCollectionEvent,
  npcs: NpcEntity[],
  tiles: Tile[][],
  playerReputation: number
): {
  reactions: NpcReaction[];
  reputationChange: number;
  triggerCombat: boolean;
  alertGuards: boolean;
} {
  const reactions = checkNpcAwareness(event, npcs, tiles);
  
  // Filter for witnesses who actually saw something bad
  const witnesses = reactions.filter(r => 
    r.reactionType === 'saw_theft' || 
    r.reactionType === 'confronting'
  );
  
  // Calculate reputation impact
  const reputationChange = calculateReputationImpact(
    event.action,
    event.item,
    witnesses
  );
  
  // Check if guards should be alerted
  const alertGuards = witnesses.some(w => 
    w.npc.role?.toLowerCase().includes('guard') ||
    (w.reactionType === 'confronting' && w.distance <= 5)
  );
  
  // Check if combat should be triggered
  const triggerCombat = reactions.some(r => 
    r.reactionType === 'confronting' && 
    r.distance <= 2 &&
    r.npc.role?.toLowerCase().includes('guard')
  );
  
  // Emit events for UI to handle
  reactions.forEach(reaction => {
    if (reaction.reactionType === 'saw_theft' || reaction.reactionType === 'confronting') {
      eventBus.emit('npc:reaction', {
        npc: reaction.npc,
        type: reaction.reactionType,
        dialogue: reaction.dialogue,
        position: { x: reaction.npc.x, y: reaction.npc.y }
      });
    }
  });
  
  // Emit guard alert if needed
  if (alertGuards) {
    eventBus.emit('guards:alerted', {
      position: event.playerPos,
      reason: 'theft',
      item: event.item,
      witnesses: witnesses.map(w => w.npc.name || 'Unknown')
    });
  }
  
  return {
    reactions,
    reputationChange,
    triggerCombat,
    alertGuards
  };
}

/**
 * Get appropriate NPC dialogue for witnessing theft
 */
export function getTheftWitnessDialogue(
  npc: NpcEntity,
  item: Item,
  severity: 'minor' | 'major'
): string[] {
  const role = npc.role?.toLowerCase() || '';
  
  if (role.includes('guard')) {
    return severity === 'major' ? [
      `Halt! You're under arrest for grand theft!`,
      `Drop the ${item.name} and surrender!`,
      `Stealing valuable items is a serious crime!`
    ] : [
      `Stop! Return that ${item.name} immediately!`,
      `I saw you take that. Put it back.`,
      `Petty theft is still a crime, you know.`
    ];
  }
  
  if (role.includes('merchant')) {
    return severity === 'major' ? [
      `Thief! That ${item.name} is worth a fortune!`,
      `Guards! Stop that thief!`,
      `You'll pay for stealing from me!`
    ] : [
      `Hey! That ${item.name} isn't free!`,
      `Put that back or I'll call the guards!`,
      `I run an honest business here!`
    ];
  }
  
  if (role.includes('noble')) {
    return severity === 'major' ? [
      `How dare you! That ${item.name} is priceless!`,
      `Guards! Arrest this common thief!`,
      `Such audacity! Stealing right before my eyes!`
    ] : [
      `Such impropriety! Return that at once!`,
      `A thief in my presence? Unacceptable!`,
      `Your lack of manners is astounding.`
    ];
  }
  
  // Default dialogue for commoners
  return severity === 'major' ? [
    `Someone stop them! They stole ${item.name}!`,
    `Thief! Thief! Guards!`,
    `I can't believe you'd steal something so valuable!`
  ] : [
    `I saw that... you took ${item.name}.`,
    `That doesn't belong to you...`,
    `You shouldn't take things that aren't yours.`
  ];
}