/**
 * services/itemCollectionService.ts
 * Handles item collection from tiles in special maps
 */

import { Tile, Item, PlayerCharacter } from '../types';
import { addItemToInventory } from '../utils/inventoryUtils';
import { shouldTriggerTheftAwareness } from './specialMapContainerService';

export interface CollectionResult {
  success: boolean;
  item?: Item;
  action: 'collected' | 'stolen' | 'found' | 'looted';
  triggerTheftAwareness: boolean;
  message?: string;
}

/**
 * Check if player can collect item from a tile
 */
export function checkItemCollection(
  tile: Tile,
  playerX: number,
  playerY: number
): CollectionResult | null {
  // Check if tile has a collectible item
  if (!tile.collectibleItem || tile.collectibleItem.collected) {
    return null;
  }
  
  // Check if player is on the same tile
  if (tile.x !== playerX || tile.y !== playerY) {
    return null;
  }
  
  const { item, containerType, ownerNpc, isValuable } = tile.collectibleItem;
  
  // Determine action type based on context
  let action: CollectionResult['action'] = 'collected';
  
  if (containerType) {
    // Item was in a container
    action = ownerNpc ? 'stolen' : 'looted';
  } else {
    // Item was on the floor
    action = 'found';
  }
  
  // Check if this should trigger theft awareness
  const triggerTheft = shouldTriggerTheftAwareness(
    item,
    ownerNpc,
    ownerNpc ? 'private' : 'public'
  );
  
  return {
    success: true,
    item,
    action,
    triggerTheftAwareness: triggerTheft || isValuable || false,
    message: getCollectionMessage(item, action)
  };
}

/**
 * Collect item from tile and add to player inventory
 */
export function collectItemFromTile(
  tile: Tile,
  playerCharacter: PlayerCharacter
): { 
  updatedInventory: Item[];
  collectionResult: CollectionResult | null;
} {
  const result = checkItemCollection(tile, tile.x, tile.y);
  
  if (!result || !result.item) {
    return { 
      updatedInventory: playerCharacter.inventory || [],
      collectionResult: null 
    };
  }
  
  // Mark item as collected
  if (tile.collectibleItem) {
    tile.collectibleItem.collected = true;
  }
  
  // Add to player inventory
  const updatedInventory = addItemToInventory(
    playerCharacter.inventory || [],
    result.item
  );
  
  return {
    updatedInventory,
    collectionResult: result
  };
}

/**
 * Get collection message based on item and action
 */
function getCollectionMessage(item: Item, action: string): string {
  switch (action) {
    case 'stolen':
      return `You stole ${item.name}. Someone might have seen you...`;
    case 'looted':
      return `You found ${item.name} in a container.`;
    case 'found':
      return `You picked up ${item.name} from the ground.`;
    default:
      return `You collected ${item.name}.`;
  }
}

/**
 * Check all tiles around player for collectible items
 * Used for showing nearby items
 */
export function getNearbyCollectibles(
  tiles: Tile[][],
  playerX: number,
  playerY: number,
  radius: number = 1
): Array<{ tile: Tile; item: Item; distance: number }> {
  const collectibles: Array<{ tile: Tile; item: Item; distance: number }> = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const y = playerY + dy;
      const x = playerX + dx;
      
      if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[y].length) {
        const tile = tiles[y][x];
        
        if (tile.collectibleItem && !tile.collectibleItem.collected) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          collectibles.push({
            tile,
            item: tile.collectibleItem.item,
            distance
          });
        }
      }
    }
  }
  
  return collectibles.sort((a, b) => a.distance - b.distance);
}

/**
 * Process collection for special map movement
 */
export function processSpecialMapCollection(
  tiles: Tile[][],
  playerX: number,
  playerY: number,
  playerCharacter: PlayerCharacter
): {
  collectedItem?: Item;
  action?: 'collected' | 'stolen' | 'found' | 'looted';
  updatedInventory?: Item[];
  triggerTheftAwareness?: boolean;
} {
  // Get the tile the player is on
  if (playerY >= 0 && playerY < tiles.length && 
      playerX >= 0 && playerX < tiles[playerY].length) {
    
    const currentTile = tiles[playerY][playerX];
    
    // Check if there's a collectible item
    if (currentTile.collectibleItem && !currentTile.collectibleItem.collected) {
      const result = collectItemFromTile(currentTile, playerCharacter);
      
      if (result.collectionResult) {
        return {
          collectedItem: result.collectionResult.item,
          action: result.collectionResult.action,
          updatedInventory: result.updatedInventory,
          triggerTheftAwareness: result.collectionResult.triggerTheftAwareness
        };
      }
    }
  }
  
  return {};
}