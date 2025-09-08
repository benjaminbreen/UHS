import { useState, useEffect } from 'react';
import { RoomDefinition } from '../types/specialMapTypes';

/**
 * Hook to track current room in special maps based on player position
 */
export function useSpecialMapLocation(
  playerX: number | null,
  playerY: number | null,
  rooms: RoomDefinition[] | undefined
) {
  const [currentRoom, setCurrentRoom] = useState<RoomDefinition | null>(null);
  
  useEffect(() => {
    if (playerX === null || playerY === null || !rooms || rooms.length === 0) {
      setCurrentRoom(null);
      return;
    }
    
    // Find the room that contains the player's position
    // Handle both new format (r.bounds) and legacy format (r.x, r.y)
    const room = rooms.find(r => {
      // New format: room has bounds property
      if (r.bounds) {
        return (
          playerX >= r.bounds.x &&
          playerX < r.bounds.x + r.bounds.width &&
          playerY >= r.bounds.y &&
          playerY < r.bounds.y + r.bounds.height
        );
      }
      // Legacy format: room has x, y directly
      else if (typeof r.x === 'number' && typeof r.y === 'number') {
        return (
          playerX >= r.x &&
          playerX < r.x + (r.width || 0) &&
          playerY >= r.y &&
          playerY < r.y + (r.height || 0)
        );
      }
      // Malformed room data
      return false;
    });
    
    // Only update if room has changed (to avoid unnecessary re-renders)
    if (room?.id !== currentRoom?.id) {
      setCurrentRoom(room || null);
      
      // Log room transitions for debugging
      if (room && currentRoom) {
        console.log(`[SpecialMapLocation] Moved from "${currentRoom.name}" to "${room.name}"`);
      } else if (room && !currentRoom) {
        console.log(`[SpecialMapLocation] Entered "${room.name}"`);
      } else if (!room && currentRoom) {
        console.log(`[SpecialMapLocation] Left "${currentRoom.name}" - now in undefined area`);
      }
    }
  }, [playerX, playerY, rooms, currentRoom?.id]);
  
  return currentRoom;
}