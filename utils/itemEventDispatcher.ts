/**
 * Item Event Dispatcher
 * Centralized utility for dispatching item-related events to quest system
 */

import { questService } from '../services/questService';

export interface ItemAcquiredEvent {
  itemId: string;
  quantity: number;
  activeQuests: string[];
}

/**
 * Dispatch itemAcquired event with active quest context
 */
export function dispatchItemAcquired(itemId: string, quantity: number = 1): void {
  const activeQuests = questService.getActiveQuests().map(q => q.id);

  window.dispatchEvent(new CustomEvent('itemAcquired', {
    detail: { itemId, quantity, activeQuests }
  }));

  console.log('[ItemEventDispatcher] Dispatched itemAcquired event for', itemId, 'x', quantity);
}

/**
 * Add item to inventory and dispatch event
 */
export function addItemWithEvent(item: any, quantity: number = 1): void {
  // Add to inventory via localStorage
  const existingInventory = JSON.parse(localStorage.getItem('playerInventory') || '[]');

  // Check if item already exists in inventory
  const existingItemIndex = existingInventory.findIndex((i: any) => i.id === item.id);

  if (existingItemIndex >= 0) {
    // Increment quantity if item exists
    existingInventory[existingItemIndex].quantity = (existingInventory[existingItemIndex].quantity || 1) + quantity;
  } else {
    // Add new item with quantity
    existingInventory.push({ ...item, quantity });
  }

  localStorage.setItem('playerInventory', JSON.stringify(existingInventory));

  // Dispatch event
  dispatchItemAcquired(item.id, quantity);
}