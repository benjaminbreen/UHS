/**
 * hooks/useHelperNpcMovement.ts - Handles NPC movement in helper mode
 */

import { useEffect, useRef } from 'react';
import { NpcEntity } from '../types';
import { eventBus } from '../services/eventBus';
import { getHelperMode, updateLeadingNpc, checkPlayerArrival } from '../services/npcHelperService';

interface UseHelperNpcMovementProps {
    npcs: NpcEntity[];
    playerX: number;
    playerY: number;
    mapWidth: number;
    mapHeight: number;
    onNpcMove: (npcId: string, newX: number, newY: number) => void;
}

export function useHelperNpcMovement({
    npcs,
    playerX,
    playerY,
    mapWidth,
    mapHeight,
    onNpcMove
}: UseHelperNpcMovementProps) {
    const moveIntervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Update NPC positions every second
        const updatePositions = () => {
            npcs.forEach(npc => {
                const helperMode = getHelperMode(npc.id);
                if (helperMode && helperMode.mode === 'lead' && helperMode.destination) {
                    // Calculate new position
                    const newPos = updateLeadingNpc(
                        npc,
                        { x: playerX, y: playerY },
                        mapWidth,
                        mapHeight
                    );

                    // Only update if position changed
                    if (newPos.x !== npc.x || newPos.y !== npc.y) {
                        // Just call the callback - don't try to modify the frozen NPC
                        onNpcMove(npc.id, newPos.x, newPos.y);
                    }

                    // Check if player has arrived
                    checkPlayerArrival({ x: playerX, y: playerY }, npc.id);
                }
            });
        };

        // Start interval
        moveIntervalRef.current = setInterval(updatePositions, 1000);

        // Listen for helper mode events
        const handleHelperModeStart = () => {
            // Immediately update when helper mode starts
            updatePositions();
        };

        eventBus.on('npcHelperModeStarted', handleHelperModeStart);

        return () => {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current);
            }
            eventBus.off('npcHelperModeStarted', handleHelperModeStart);
        };
    }, [npcs, playerX, playerY, mapWidth, mapHeight, onNpcMove]);
}