/**
 * safeNpcService.ts - Safe wrapper for NPC operations that handles proxy revocation
 *
 * This service provides proxy-safe wrappers for NPC operations that can fail
 * in React development mode due to hot module replacement and Immer proxies.
 */

import { NpcEntity, MapData, Item } from '../types';
import { calculateNpcUpdate as unsafeCalculateNpcUpdate } from './npcAIService';

/**
 * Safe wrapper for calculateNpcUpdate that handles proxy revocation gracefully
 * Returns empty update object if any proxy-related errors occur
 */
export function safeCalculateNpcUpdate(
    npc: NpcEntity | null | undefined,
    playerPos: { x: number; y: number },
    map: MapData,
    gameTimeHours: number,
    allNpcs?: NpcEntity[],
    droppedItems?: Array<{ x: number; y: number; item: Item; timestamp: number }>
): Partial<NpcEntity> {
    // Input validation
    if (!npc || typeof npc !== 'object') {
        console.debug('[SafeNPC] Skipping update - invalid NPC object');
        return {};
    }

    // Check if NPC is in transfer state
    if ((npc as any).isTransferring) {
        console.debug(`[SafeNPC] Skipping update - NPC ${npc.id} is transferring`);
        return {};
    }

    // Try to get a clean copy of the NPC to avoid proxy issues
    let cleanNpc: NpcEntity;
    try {
        // Create a shallow copy to break proxy reference
        cleanNpc = {
            ...npc,
            // Deep copy nested objects that might cause issues
            memory: npc.memory ? { ...npc.memory } : undefined,
            behavior: npc.behavior ? { ...npc.behavior } : {},
            homeLocation: npc.homeLocation ? { ...npc.homeLocation } : undefined,
            workplaceLocation: npc.workplaceLocation ? { ...npc.workplaceLocation } : undefined
        };
    } catch (error: any) {
        if (error.message?.includes('revoked') || error.message?.includes('proxy')) {
            console.debug(`[SafeNPC] Proxy already revoked for NPC ${npc.id || 'unknown'}`);
            return {};
        }
        // If we can't even copy the NPC, it's too corrupted to use
        console.warn('[SafeNPC] Failed to create clean NPC copy:', error.message);
        return {};
    }

    // Call the actual update function with error handling
    try {
        const updates = unsafeCalculateNpcUpdate(cleanNpc, playerPos, map, gameTimeHours, allNpcs, droppedItems);

        // Validate the updates before returning
        if (!updates || typeof updates !== 'object') {
            return {};
        }

        // Check for invalid coordinates
        if (updates.x !== undefined && (updates.x < 0 || updates.x >= map.width)) {
            console.warn(`[SafeNPC] Invalid X coordinate ${updates.x} for NPC ${cleanNpc.id}`);
            delete updates.x;
        }
        if (updates.y !== undefined && (updates.y < 0 || updates.y >= map.height)) {
            console.warn(`[SafeNPC] Invalid Y coordinate ${updates.y} for NPC ${cleanNpc.id}`);
            delete updates.y;
        }

        return updates;
    } catch (error: any) {
        // Handle different types of errors gracefully
        if (error.message?.includes('revoked')) {
            console.debug(`[SafeNPC] Proxy revoked during update for NPC ${cleanNpc.id}`);
        } else if (error.message?.includes('Cannot perform')) {
            console.debug(`[SafeNPC] Proxy operation failed for NPC ${cleanNpc.id}`);
        } else if (error.message?.includes('extensible')) {
            console.debug(`[SafeNPC] Object frozen/sealed error for NPC ${cleanNpc.id}`);
        } else {
            // Unexpected error - log it but don't crash
            console.error('[SafeNPC] Unexpected error in NPC update:', error);
        }

        // Return empty update to keep the game running
        return {};
    }
}

/**
 * Safely check if an NPC should be removed from the map
 */
export function shouldRemoveNpc(npc: NpcEntity | null | undefined): boolean {
    if (!npc) return true;

    try {
        // Check for transfer flag
        if ((npc as any).isTransferring) {
            return true;
        }

        // Check for invalid state
        if (!npc.id || npc.health <= 0) {
            return true;
        }

        return false;
    } catch (error) {
        // If we can't even check the NPC, it should be removed
        console.debug('[SafeNPC] Error checking NPC removal status:', error);
        return true;
    }
}

/**
 * Safely get NPC position
 */
export function getNpcPosition(npc: NpcEntity | null | undefined): { x: number; y: number } | null {
    if (!npc) return null;

    try {
        const x = npc.x;
        const y = npc.y;

        if (typeof x === 'number' && typeof y === 'number' &&
            !isNaN(x) && !isNaN(y) &&
            isFinite(x) && isFinite(y)) {
            return { x, y };
        }

        return null;
    } catch (error) {
        console.debug('[SafeNPC] Error getting NPC position:', error);
        return null;
    }
}

/**
 * Create a safe copy of NPC array for iteration
 */
export function createSafeNpcArray(npcs: NpcEntity[] | null | undefined): NpcEntity[] {
    if (!npcs || !Array.isArray(npcs)) {
        return [];
    }

    try {
        // Filter out invalid NPCs and create clean copies
        return npcs
            .filter(npc => npc && typeof npc === 'object' && npc.id)
            .map(npc => {
                try {
                    // Create a shallow copy
                    return { ...npc };
                } catch (e) {
                    // If we can't copy it, skip it
                    return null;
                }
            })
            .filter((npc): npc is NpcEntity => npc !== null);
    } catch (error) {
        console.error('[SafeNPC] Error creating safe NPC array:', error);
        return [];
    }
}