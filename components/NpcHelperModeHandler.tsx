/**
 * components/NpcHelperModeHandler.tsx - Handles NPC helper mode UI elements
 */

import React, { useEffect, useState } from 'react';
import { NpcEntity } from '../types';
import { getHelperMode, checkPlayerArrival, HelperModeData } from '../services/npcHelperService';
import { eventBus } from '../services/eventBus';
import { Home, Gift, MapPin, UserPlus } from 'lucide-react';

interface NpcHelperOverlayProps {
    npc: NpcEntity;
    playerX: number;
    playerY: number;
}

/**
 * Renders helper mode indicators on NPCs
 */
export function NpcHelperOverlay({ npc, playerX, playerY }: NpcHelperOverlayProps) {
    const [helperMode, setHelperMode] = useState<HelperModeData | undefined>();

    useEffect(() => {
        // Check for helper mode on mount and updates
        const mode = getHelperMode(npc.id);
        setHelperMode(mode);

        // Listen for helper mode changes
        const handleHelperModeStart = (event: any) => {
            if (event.npc.id === npc.id) {
                setHelperMode(event.helperData);
            }
        };

        const handleHelperModeEnd = (event: any) => {
            if (event.npcId === npc.id) {
                setHelperMode(undefined);
            }
        };

        eventBus.on('npcHelperModeStarted', handleHelperModeStart);
        eventBus.on('npcHelperModeEnded', handleHelperModeEnd);

        return () => {
            eventBus.off('npcHelperModeStarted', handleHelperModeStart);
            eventBus.off('npcHelperModeEnded', handleHelperModeEnd);
        };
    }, [npc.id]);

    // Check for player arrival
    useEffect(() => {
        if (helperMode) {
            checkPlayerArrival({ x: playerX, y: playerY }, npc.id);
        }
    }, [playerX, playerY, helperMode, npc.id]);

    if (!helperMode) return null;

    return (
        <>
            {/* Glowing ring around NPC - much more visible */}
            <g className="pointer-events-none">
                {/* Outer glow ring */}
                <circle
                    cx={0}
                    cy={0}
                    r={35}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth="4"
                    opacity={0.8}
                >
                    <animate
                        attributeName="r"
                        values="30;40;30"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.8;0.3;0.8"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>

                {/* Inner bright ring */}
                <circle
                    cx={0}
                    cy={0}
                    r={25}
                    fill="none"
                    stroke="rgba(147, 197, 253, 0.8)"
                    strokeWidth="2"
                >
                    <animate
                        attributeName="r"
                        values="25;30;25"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </circle>

                {/* Glow effect */}
                <circle
                    cx={0}
                    cy={0}
                    r={30}
                    fill="rgba(59, 130, 246, 0.2)"
                    filter="blur(8px)"
                >
                    <animate
                        attributeName="r"
                        values="25;35;25"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>
            </g>

            {/* Dialogue bubble above NPC - SVG based */}
            {helperMode.dialogueBubble && (
                <g className="pointer-events-none">
                    {/* Bubble background - dark themed like game UI */}
                    <rect
                        x={-80}
                        y={-60}
                        width={160}
                        height={30}
                        rx={5}
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke="rgba(16, 185, 129, 0.8)"
                        strokeWidth="2"
                    />

                    {/* Bubble tail */}
                    <polygon
                        points="0,-30 -10,-20 10,-20"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke="rgba(16, 185, 129, 0.8)"
                        strokeWidth="2"
                    />

                    {/* Icon */}
                    <text
                        x={-70}
                        y={-40}
                        fontSize="18"
                        textAnchor="middle"
                    >
                        {helperMode.mode === 'lead' ? '🗺️' :
                         helperMode.mode === 'gift' ? '🎁' :
                         helperMode.mode === 'show' ? '🏠' : '👥'}
                    </text>

                    {/* Text - green like game UI */}
                    <text
                        x={0}
                        y={-40}
                        fontSize="14"
                        fontFamily="ui-monospace, 'SF Mono', Monaco, monospace"
                        fontWeight="bold"
                        fill="rgba(134, 239, 172, 0.9)"
                        textAnchor="middle"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                    >
                        {helperMode.dialogueBubble}
                    </text>

                    {/* Animated bounce effect */}
                    <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0,-5;0,0;0,-5"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </g>
            )}
        </>
    );
}

function getHelperIcon(mode: HelperModeData['mode']) {
    switch (mode) {
        case 'lead':
            return <MapPin className="w-4 h-4 text-blue-500" />;
        case 'gift':
            return <Gift className="w-4 h-4 text-green-500" />;
        case 'show':
            return <Home className="w-4 h-4 text-purple-500" />;
        case 'follow':
            return <UserPlus className="w-4 h-4 text-orange-500" />;
        default:
            return null;
    }
}

/**
 * Hook to handle helper mode initiation from EncounterModal
 */
export function useNpcHelperMode() {
    const initiateFollowMe = (
        npc: NpcEntity,
        destination: { x: number; y: number },
        destinationName: string,
        onArrival: () => void
    ) => {
        // Import dynamically to avoid circular deps
        import('../services/npcHelperService').then((module) => {
            module.initiateHelperMode(npc, 'lead', {
                destination,
                destinationName,
                dialogueBubble: `Follow me to ${destinationName}!`,
                completionCallback: onArrival
            });
        });
    };

    const initiateGiftGiving = (
        npc: NpcEntity,
        gift: any,
        message: string = "I have something for you"
    ) => {
        import('../services/npcHelperService').then((module) => {
            module.initiateHelperMode(npc, 'gift', {
                gift,
                dialogueBubble: message,
                completionCallback: () => {
                    // Trigger gift transfer
                    eventBus.emit('npcGiftTransferred', { npc, gift });
                }
            });
        });
    };

    return {
        initiateFollowMe,
        initiateGiftGiving
    };
}