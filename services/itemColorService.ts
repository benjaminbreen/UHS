import { Item, CulturalZone } from '../types';
import { ensureItemHasColor } from './itemGenerationService';

/**
 * Service for applying colors to items that may not have them
 * Used to upgrade existing items or ensure color consistency
 */

export function applyColorsToInventory(
  items: Item[], 
  culture: CulturalZone, 
  privilege: number = 0.5
): Item[] {
  return items.map(item => ensureItemHasColor(item, culture, privilege));
}

export function applyColorsToEquipment(
  equippedItems: Record<string, Item | undefined>, 
  culture: CulturalZone, 
  privilege: number = 0.5
): Record<string, Item | undefined> {
  const coloredEquipment: Record<string, Item | undefined> = {};
  
  for (const [slot, item] of Object.entries(equippedItems)) {
    if (item) {
      coloredEquipment[slot] = ensureItemHasColor(item, culture, privilege);
    } else {
      coloredEquipment[slot] = item;
    }
  }
  
  return coloredEquipment;
}

export function upgradeExistingItemsWithColors(
  player: { inventory: Item[], equippedItems: Record<string, Item | undefined> },
  culture: CulturalZone,
  privilege: number = 0.5
): { inventory: Item[], equippedItems: Record<string, Item | undefined> } {
  return {
    inventory: applyColorsToInventory(player.inventory, culture, privilege),
    equippedItems: applyColorsToEquipment(player.equippedItems, culture, privilege)
  };
}