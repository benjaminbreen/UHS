/**
 * services/npcItemDetectionService.ts - NPC item detection and pickup logic
 */
import { NpcEntity, Item, Point } from '../types';

const DETECTION_RADIUS = 8; // Tiles within which NPCs can detect dropped items

/**
 * Scan for nearby dropped items and return the closest one
 */
export function detectNearbyDroppedItems(
  npc: NpcEntity,
  droppedItems: Array<{ x: number; y: number; item: Item; timestamp: number }>
): { x: number; y: number; item: Item } | null {
  if (!droppedItems || droppedItems.length === 0) {
    return null;
  }

  let closestItem: { x: number; y: number; item: Item } | null = null;
  let closestDistance = DETECTION_RADIUS;

  for (const dropped of droppedItems) {
    const distance = Math.hypot(dropped.x - npc.x, dropped.y - npc.y);

    // Check if within detection range
    if (distance <= DETECTION_RADIUS && distance < closestDistance) {
      closestDistance = distance;
      closestItem = { x: dropped.x, y: dropped.y, item: dropped.item };
    }
  }

  return closestItem;
}

/**
 * Check if NPC is adjacent to target item (can pick it up)
 */
export function isAdjacentToItem(npc: NpcEntity, targetItem: { x: number; y: number }): boolean {
  const distance = Math.hypot(npc.x - targetItem.x, npc.y - targetItem.y);
  return distance <= 1.0; // Adjacent means distance of 1 or less
}

/**
 * Add item to NPC's pickup history
 */
export function recordItemPickup(
  npc: NpcEntity,
  item: Item,
  location: { x: number; y: number }
): void {
  if (!npc.pickupHistory) {
    npc.pickupHistory = [];
  }

  npc.pickupHistory.push({
    item,
    timestamp: Date.now(),
    location
  });

  // Limit history to last 10 items to prevent memory bloat
  if (npc.pickupHistory.length > 10) {
    npc.pickupHistory = npc.pickupHistory.slice(-10);
  }
}

/**
 * Check if NPC should be interested in this item based on their profession/personality
 * For now, all NPCs are interested in all items. Can be enhanced later.
 */
export function isInterestedInItem(npc: NpcEntity, item: Item): boolean {
  // Future enhancement: filter by profession, wealth level, personal goals, etc.
  // For now, all NPCs pick up all items they find
  return true;
}
