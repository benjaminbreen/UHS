/**
 * hooks/useSpecialMapItemCollection.ts
 * Hook that handles item collection when player moves in special maps
 */

import { useEffect, useCallback, useRef } from 'react';
import { Tile, PlayerCharacter, Item } from '../types';
import { processSpecialMapCollection } from '../services/itemCollectionService';
import { useInventoryToast } from './useInventoryToast';
import { eventBus } from '../services/eventBus';

interface UseSpecialMapItemCollectionProps {
  tiles: Tile[][] | undefined;
  playerX: number;
  playerY: number;
  playerCharacter: PlayerCharacter | null;
  isSpecialMap: boolean;
  onInventoryUpdate?: (inventory: Item[]) => void;
  onTheftDetected?: (item: Item) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export function useSpecialMapItemCollection({
  tiles,
  playerX,
  playerY,
  playerCharacter,
  isSpecialMap,
  onInventoryUpdate,
  onTheftDetected,
  onShowToast
}: UseSpecialMapItemCollectionProps) {
  const { showToast } = useInventoryToast();
  const lastPositionRef = useRef({ x: -1, y: -1 });
  
  // Process item collection when player moves
  const checkForItems = useCallback(() => {
    // Only process in special maps with valid data
    if (!isSpecialMap || !tiles || !playerCharacter) {
      return;
    }
    
    // Check if player has moved to a new tile
    if (lastPositionRef.current.x === playerX && lastPositionRef.current.y === playerY) {
      return; // Haven't moved
    }
    
    // Update last position
    lastPositionRef.current = { x: playerX, y: playerY };
    
    // Get the current tile
    const currentTile = tiles[playerY]?.[playerX];

    // Check if there's a container on this tile
    if (currentTile?.overlayObject) {
      const containerTypes = [
        'CHEST', 'BARREL', 'CRATE', 'CABINET', 'BOOKSHELF',
        'WEAPON_RACK', 'ARMOR_STAND', 'TANSU', 'SPICE_CABINET'
      ];

      const overlayType = String(currentTile.overlayObject.type);
      const isContainer = containerTypes.some(type => overlayType.includes(type));

      if (isContainer) {
        console.log('[ItemCollection] Standing on container, showing toast');
        // Show a toast prompt to open the container
        if (onShowToast) {
          console.log('[ItemCollection] Calling onShowToast with container message');
          onShowToast('📦 Press E or click to open container', 'info');
        } else {
          console.log('[ItemCollection] onShowToast not available');
        }
      }
    }

    // Process collection of floor items
    const result = processSpecialMapCollection(
      tiles,
      playerX,
      playerY,
      playerCharacter
    );

    if (result.collectedItem && result.action) {
      // Show toast notification
      showToast(result.collectedItem, result.action);
      
      // Update inventory if handler provided
      if (result.updatedInventory && onInventoryUpdate) {
        onInventoryUpdate(result.updatedInventory);
      }
      
      // Emit collection event for other systems to react
      eventBus.emit('item:collected', {
        item: result.collectedItem,
        action: result.action,
        playerX,
        playerY,
        triggerTheft: result.triggerTheftAwareness
      });
      
      // Handle theft detection
      if (result.triggerTheftAwareness && onTheftDetected) {
        onTheftDetected(result.collectedItem);
      }
      
      // Log collection for debugging
      console.log('[ItemCollection] Collected item:', {
        item: result.collectedItem.name,
        action: result.action,
        position: { x: playerX, y: playerY },
        theft: result.triggerTheftAwareness
      });
    }
  }, [tiles, playerX, playerY, playerCharacter, isSpecialMap, showToast, onInventoryUpdate, onTheftDetected, onShowToast]);
  
  // Check for items whenever player position changes
  useEffect(() => {
    checkForItems();
  }, [playerX, playerY, checkForItems]);
  
  // Also listen for manual collection trigger (e.g., pressing 'E' or clicking)
  useEffect(() => {
    const handleManualCollection = () => {
      checkForItems();
    };
    
    eventBus.on('player:collect', handleManualCollection);
    
    return () => {
      eventBus.off('player:collect', handleManualCollection);
    };
  }, [checkForItems]);
  
  return {
    checkForItems
  };
}