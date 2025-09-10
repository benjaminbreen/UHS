/**
 * generation/specialMap/types/roomHelpers.ts
 * Standardized utilities for creating and validating room definitions
 * Ensures all special map generators properly define rooms for NPC spawning
 */

import { RoomDefinition, ProfessionCategory } from '../../../types/specialMapTypes';

/**
 * Standard room creator that ALL generators must use
 * Ensures consistent room structure across all special maps
 */
export function createRoom(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: string,
  density: 'empty' | 'sparse' | 'normal' | 'crowded' = 'normal',
  accessLevel: 'public' | 'semi-public' | 'private' | 'restricted' = 'public'
): RoomDefinition {
  return {
    id,
    name,
    bounds: { x, y, width, height },
    roomType: type,
    npcDensity: density,
    accessLevel,
    description: `${name} area`
  };
}

/**
 * Create a room with profession filters
 */
export function createRestrictedRoom(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: string,
  allowedCategories: ProfessionCategory[],
  density: 'empty' | 'sparse' | 'normal' | 'crowded' = 'sparse'
): RoomDefinition {
  const room = createRoom(id, name, x, y, width, height, type, density, 'restricted');
  room.professionFilter = {
    category: allowedCategories
  };
  return room;
}

/**
 * Convert legacy room format (from palaceVariantGenerator) to standard format
 */
export function convertLegacyRoom(legacyRoom: any): RoomDefinition | null {
  // Handle legacy format: { x, y, width, height, name, type }
  if (legacyRoom.x !== undefined && legacyRoom.width !== undefined) {
    return {
      id: legacyRoom.id || `legacy_${legacyRoom.name?.toLowerCase().replace(/\s+/g, '_')}`,
      name: legacyRoom.name || 'Unnamed Room',
      bounds: {
        x: legacyRoom.x,
        y: legacyRoom.y,
        width: legacyRoom.width,
        height: legacyRoom.height
      },
      roomType: legacyRoom.type || legacyRoom.roomType || 'hall',
      description: legacyRoom.description || `${legacyRoom.name || 'Unnamed'} area`,
      accessLevel: legacyRoom.accessLevel || 'public',
      npcDensity: legacyRoom.npcDensity || 'normal'
    };
  }
  
  // Handle format with bounds already defined
  if (legacyRoom.bounds) {
    return legacyRoom as RoomDefinition;
  }
  
  console.warn('[RoomHelper] Unable to convert legacy room format:', legacyRoom);
  return null;
}

/**
 * Ensure generator has at least one room defined
 * This prevents NPCs from failing to spawn
 */
export function ensureRoomsDefined(
  rooms: RoomDefinition[],
  archetype: string,
  size: { width: number, height: number }
): RoomDefinition[] {
  if (!rooms || rooms.length === 0) {
    console.warn(`[RoomHelper] No rooms defined for ${archetype}, creating default room`);
    
    // Create a default room that covers most of the map
    const defaultRoom = createRoom(
      'default_hall',
      'Main Hall',
      2, // Leave 2 tiles from edges for walls
      2,
      size.width - 4,
      size.height - 4,
      'hall',
      'normal'
    );
    
    return [defaultRoom];
  }
  
  // Convert any legacy rooms to standard format
  const standardRooms: RoomDefinition[] = [];
  for (const room of rooms) {
    if (!room.bounds && (room as any).x !== undefined) {
      const converted = convertLegacyRoom(room);
      if (converted) {
        standardRooms.push(converted);
      }
    } else {
      standardRooms.push(room);
    }
  }
  
  return standardRooms;
}

/**
 * Helper to create standard room types with appropriate defaults
 */
export const RoomTemplates = {
  throneRoom: (centerX: number, centerY: number, width = 10, height = 8) =>
    createRestrictedRoom(
      'throne_room',
      'Throne Room',
      centerX - Math.floor(width / 2),
      centerY - Math.floor(height / 2),
      width,
      height,
      'throne_room',
      [ProfessionCategory.NOBILITY, ProfessionCategory.MILITARY],
      'sparse'
    ),
    
  sanctuary: (centerX: number, centerY: number, radius = 6) =>
    createRestrictedRoom(
      'sanctuary',
      'Sacred Sanctuary',
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
      'sanctuary',
      [ProfessionCategory.CLERGY],
      'sparse'
    ),
    
  marketplace: (x: number, y: number, width: number, height: number) =>
    createRoom(
      'marketplace',
      'Market Square',
      x,
      y,
      width,
      height,
      'marketplace',
      'crowded',
      'public'
    ),
    
  councilChamber: (centerX: number, centerY: number, width = 12, height = 10) =>
    createRoom(
      'council',
      'Council Chamber',
      centerX - Math.floor(width / 2),
      centerY - Math.floor(height / 2),
      width,
      height,
      'council',
      'normal',
      'semi-public'
    ),
    
  courtyard: (x: number, y: number, width: number, height: number) =>
    createRoom(
      'courtyard',
      'Courtyard',
      x,
      y,
      width,
      height,
      'courtyard',
      'sparse',
      'public'
    )
};

/**
 * Debug helper to log room information
 */
export function debugLogRooms(rooms: RoomDefinition[], archetype: string): void {
  console.log(`[RoomHelper] ${archetype} defined ${rooms.length} rooms:`);
  rooms.forEach(room => {
    console.log(`  - ${room.name}: ${room.bounds.width}x${room.bounds.height} at (${room.bounds.x},${room.bounds.y}) [${room.npcDensity}]`);
  });
}