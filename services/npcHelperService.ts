/**
 * services/npcHelperService.ts - Manages NPC helper mode and follow-me behavior
 */

import { NpcEntity, Point, DialogueEntry } from '../types';
import { eventBus } from './eventBus';
import { Item } from '../types';

export interface HelperModeData {
    npcId: string;
    mode: 'follow' | 'lead' | 'gift' | 'show' | null;
    destination?: Point; // Where NPC wants to lead player
    destinationName?: string; // Human-readable name like "my home"
    gift?: Item; // Item NPC wants to give
    startTime: number;
    dialogueBubble?: string; // Text to show above NPC on map
    completionCallback?: () => void; // What happens when player arrives
}

// Store helper mode state for NPCs
const helperModes = new Map<string, HelperModeData>();

/**
 * Initiates helper mode for an NPC after positive interaction
 */
export function initiateHelperMode(
    npc: NpcEntity,
    mode: HelperModeData['mode'],
    options: {
        destination?: Point;
        destinationName?: string;
        gift?: Item;
        dialogueBubble?: string;
        completionCallback?: () => void;
    } = {}
): HelperModeData {
    const helperData: HelperModeData = {
        npcId: npc.id,
        mode,
        destination: options.destination,
        destinationName: options.destinationName,
        gift: options.gift,
        startTime: Date.now(),
        dialogueBubble: options.dialogueBubble || getDefaultBubbleText(mode),
        completionCallback: options.completionCallback
    };

    helperModes.set(npc.id, helperData);

    // Emit event for UI to handle
    eventBus.emit('npcHelperModeStarted', { npc, helperData });

    return helperData;
}

/**
 * Gets default dialogue bubble text based on mode
 */
function getDefaultBubbleText(mode: HelperModeData['mode']): string {
    switch (mode) {
        case 'lead':
            return "Follow me!";
        case 'show':
            return "Let me show you";
        case 'gift':
            return "I have something for you";
        case 'follow':
            return "I'll come with you";
        default:
            return "";
    }
}

/**
 * Checks if NPC is in helper mode
 */
export function isInHelperMode(npcId: string): boolean {
    return helperModes.has(npcId) && helperModes.get(npcId)?.mode !== null;
}

/**
 * Gets helper mode data for an NPC
 */
export function getHelperMode(npcId: string): HelperModeData | undefined {
    return helperModes.get(npcId);
}

/**
 * Updates NPC position when in lead mode
 */
export function updateLeadingNpc(
    npc: NpcEntity,
    playerPos: Point,
    mapWidth: number,
    mapHeight: number
): Point {
    const helperData = helperModes.get(npc.id);
    if (!helperData || helperData.mode !== 'lead' || !helperData.destination) {
        return { x: npc.x, y: npc.y };
    }

    const currentPos = { x: npc.x, y: npc.y };
    const destination = helperData.destination;

    // Check if player is following (within 5 tiles)
    const playerDistance = Math.sqrt(
        Math.pow(playerPos.x - currentPos.x, 2) +
        Math.pow(playerPos.y - currentPos.y, 2)
    );

    if (playerDistance > 5) {
        // Player too far, NPC waits
        return currentPos;
    }

    // Move towards destination
    const dx = destination.x - currentPos.x;
    const dy = destination.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
        // Reached destination
        handleDestinationReached(npc, helperData);
        return destination;
    }

    // Move one step towards destination
    const step = 1;
    const newX = currentPos.x + Math.round((dx / distance) * step);
    const newY = currentPos.y + Math.round((dy / distance) * step);

    // Bounds checking
    return {
        x: Math.max(0, Math.min(mapWidth - 1, newX)),
        y: Math.max(0, Math.min(mapHeight - 1, newY))
    };
}

/**
 * Handles when NPC reaches their destination
 */
function handleDestinationReached(npc: NpcEntity, helperData: HelperModeData) {
    // Check if player is nearby (within 3 tiles)
    eventBus.emit('npcReachedDestination', {
        npc,
        destination: helperData.destination,
        checkPlayerProximity: true
    });

    // The actual completion (gift giving, new dialogue) happens when player arrives
}

/**
 * Checks if player has arrived at helper destination
 */
export function checkPlayerArrival(
    playerPos: Point,
    npcId: string
): boolean {
    const helperData = helperModes.get(npcId);
    if (!helperData || !helperData.destination) return false;

    const distance = Math.sqrt(
        Math.pow(playerPos.x - helperData.destination.x, 2) +
        Math.pow(playerPos.y - helperData.destination.y, 2)
    );

    if (distance <= 2) {
        // Player has arrived!

        // Emit toast event for UI to handle
        eventBus.emit('showToast', {
            message: `🎉 Welcome to ${helperData.destinationName || 'the destination'}!`,
            type: 'success'
        });

        // Get NPC for additional context
        eventBus.emit('npcInteraction', {
            npc: { id: npcId },
            type: 'arrival',
            location: helperData.destination
        });

        // If NPC has a home here, try to trigger POI modal
        if (helperData.destinationName?.includes('home')) {
            // Emit event to open a dwelling/interior modal
            eventBus.emit('openPOIModal', {
                type: 'dwelling',
                ownerId: npcId,
                location: helperData.destination
            });
        }

        if (helperData.completionCallback) {
            helperData.completionCallback();
        }

        eventBus.emit('playerArrivedAtHelperDestination', {
            npcId,
            helperData
        });

        // Clear helper mode after completion
        clearHelperMode(npcId);
        return true;
    }

    return false;
}

/**
 * Clears helper mode for an NPC
 */
export function clearHelperMode(npcId: string) {
    helperModes.delete(npcId);
    eventBus.emit('npcHelperModeEnded', { npcId });
}

/**
 * Gets all NPCs currently in helper mode
 */
export function getAllHelperNpcs(): string[] {
    return Array.from(helperModes.keys());
}

/**
 * Generates a gift-giving action
 */
export function generateGiftAction(
    npc: NpcEntity,
    gift: Item,
    context: string = "Here, take this"
): void {
    eventBus.emit('npcGiftOffered', {
        npc,
        gift,
        dialogue: context
    });
}

/**
 * Clean up helper modes older than 10 minutes
 */
export function cleanupStaleHelperModes() {
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    for (const [npcId, data] of helperModes.entries()) {
        if (now - data.startTime > TEN_MINUTES) {
            clearHelperMode(npcId);
        }
    }
}