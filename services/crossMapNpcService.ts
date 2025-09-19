/**
 * crossMapNpcService.ts - Handles NPCs moving between adjacent maps
 */
import { NpcEntity } from '../types';

interface CrossMapNpc {
    npc: NpcEntity;
    exitDirection: 'north' | 'south' | 'east' | 'west';
    exitTime: number;
    targetMapSeed?: string;
}

class CrossMapNpcService {
    private static STORAGE_KEY = 'crossMapNpcs';
    private static MAX_TRANSFER_TIME = 60000; // NPCs expire after 1 minute if not claimed

    /**
     * Queue an NPC for transfer to an adjacent map
     */
    queueNpcForTransfer(npc: NpcEntity, exitDirection: 'north' | 'south' | 'east' | 'west'): void {
        const transfers = this.getTransfers();

        // Remove the NPC ID from any existing transfers (prevent duplicates)
        const filtered = transfers.filter(t => t.npc.id !== npc.id);

        // Add the new transfer
        filtered.push({
            npc: { ...npc }, // Clone to avoid reference issues
            exitDirection,
            exitTime: Date.now()
        });

        // Save to localStorage
        try {
            localStorage.setItem(CrossMapNpcService.STORAGE_KEY, JSON.stringify(filtered));
            console.log(`[CrossMapNPC] Queued ${npc.name} for transfer ${exitDirection}`);
        } catch (error) {
            console.error('[CrossMapNPC] Failed to queue NPC for transfer:', error);
        }
    }

    /**
     * Get NPCs that should enter from a specific direction
     */
    getIncomingNpcs(fromDirection: 'north' | 'south' | 'east' | 'west'): NpcEntity[] {
        // Opposite direction mapping
        const oppositeDirection: Record<string, string> = {
            'north': 'south',
            'south': 'north',
            'east': 'west',
            'west': 'east'
        };

        const transfers = this.getTransfers();
        const now = Date.now();

        // Find NPCs that exited from the opposite direction (e.g., if we're loading from north, get NPCs that exited south)
        const incoming = transfers.filter(t =>
            t.exitDirection === oppositeDirection[fromDirection] &&
            (now - t.exitTime) < CrossMapNpcService.MAX_TRANSFER_TIME
        );

        // Remove claimed NPCs from the queue
        if (incoming.length > 0) {
            const remainingTransfers = transfers.filter(t =>
                !incoming.some(i => i.npc.id === t.npc.id)
            );
            try {
                localStorage.setItem(CrossMapNpcService.STORAGE_KEY, JSON.stringify(remainingTransfers));
            } catch (error) {
                console.error('[CrossMapNPC] Failed to update transfer queue:', error);
            }
        }

        // Adjust NPC positions for the new map
        return incoming.map(transfer => {
            const npc = transfer.npc;

            // Position NPCs at the edge they're entering from
            switch (fromDirection) {
                case 'north':
                    npc.y = 2; // Enter from top
                    break;
                case 'south':
                    npc.y = 98; // Enter from bottom (assuming 100 tile map)
                    break;
                case 'east':
                    npc.x = 98; // Enter from right
                    break;
                case 'west':
                    npc.x = 2; // Enter from left
                    break;
            }

            // Clear the leaving flag
            npc.isLeavingMap = false;
            npc.mapEntryDirection = fromDirection;

            console.log(`[CrossMapNPC] ${npc.name} entering from ${fromDirection} at (${npc.x}, ${npc.y})`);
            return npc;
        });
    }

    /**
     * Get all NPCs waiting for transfer (all directions)
     */
    getAllIncomingNpcs(): NpcEntity[] {
        const allNpcs: NpcEntity[] = [];
        const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

        for (const dir of directions) {
            allNpcs.push(...this.getIncomingNpcs(dir));
        }

        return allNpcs;
    }

    /**
     * Clean up expired transfers
     */
    cleanupExpiredTransfers(): void {
        const transfers = this.getTransfers();
        const now = Date.now();

        const validTransfers = transfers.filter(t =>
            (now - t.exitTime) < CrossMapNpcService.MAX_TRANSFER_TIME
        );

        if (validTransfers.length !== transfers.length) {
            try {
                localStorage.setItem(CrossMapNpcService.STORAGE_KEY, JSON.stringify(validTransfers));
                console.log(`[CrossMapNPC] Cleaned up ${transfers.length - validTransfers.length} expired transfers`);
            } catch (error) {
                console.error('[CrossMapNPC] Failed to cleanup transfers:', error);
            }
        }
    }

    /**
     * Clear all transfers (useful for game reset)
     */
    clearAllTransfers(): void {
        try {
            localStorage.removeItem(CrossMapNpcService.STORAGE_KEY);
            console.log('[CrossMapNPC] Cleared all NPC transfers');
        } catch (error) {
            console.error('[CrossMapNPC] Failed to clear transfers:', error);
        }
    }

    private getTransfers(): CrossMapNpc[] {
        try {
            const stored = localStorage.getItem(CrossMapNpcService.STORAGE_KEY);
            if (!stored) return [];

            const transfers = JSON.parse(stored);
            // Validate the data structure
            if (!Array.isArray(transfers)) return [];

            return transfers.filter(t => t.npc && t.exitDirection && t.exitTime);
        } catch (error) {
            console.error('[CrossMapNPC] Failed to get transfers:', error);
            return [];
        }
    }
}

export const crossMapNpcService = new CrossMapNpcService();