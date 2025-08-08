/**
 * Beautiful Interior Map Display - renders architectural layouts with NPCs and interactions
 */
import React, { useState, useCallback, useEffect } from 'react';
import BeautifulInteriorRenderer from './BeautifulInteriorRenderer';
import { generateBeautifulInterior, checkSpaceAccess, getSpaceAtPosition } from '../../generation/interiorMap/beautifulInteriorGenerator';
import { generateEliteDialogue } from '../../services/buildingElites';
import { InteriorGenerationConfig } from '../../types/interiorMapTypes';
import { BuildingLayout } from '../../generation/interiorMap/architecturalLayouts';
import { NpcEntity } from '../../types/npcTypes';
import { Point, PlayerCharacter } from '../../types';

interface BeautifulInteriorMapDisplayProps {
    config: InteriorGenerationConfig;
    playerCharacter: PlayerCharacter;
    playerReligion: string;
    playerClass: string;
    playerReputation: number;
    onExit: () => void;
    onNpcInteraction: (npc: NpcEntity, dialogue: string[]) => void;
    onReputationChange: (change: number, reason: string) => void;
    onNpcClick?: (npc: NpcEntity) => void;
}

interface InteriorData {
    layout: BuildingLayout;
    namedElite?: NpcEntity;
    guardNpcs: NpcEntity[];
    npcs: NpcEntity[];
}

const BeautifulInteriorMapDisplay: React.FC<BeautifulInteriorMapDisplayProps> = ({
    config,
    playerCharacter,
    playerReligion,
    playerClass,
    playerReputation,
    onExit,
    onNpcInteraction,
    onReputationChange,
    onNpcClick
}) => {
    const [playerPosition, setPlayerPosition] = useState<Point>({ x: 15, y: 25 });
    const [interiorData, setInteriorData] = useState<InteriorData | null>(null);
    const [hasBeenWarned, setHasBeenWarned] = useState(false);
    const [confrontedNpcs, setConfrontedNpcs] = useState<Set<string>>(new Set());
    
    // Initialize interior data
    useEffect(() => {
        const data = generateBeautifulInterior(config);
        setInteriorData({
            layout: data.layout,
            namedElite: data.namedElite,
            guardNpcs: data.guardNpcs,
            npcs: data.npcs || []
        });
        setPlayerPosition(data.layout.entrance);
    }, [config.buildingId, config.buildingType]); // More specific dependencies
    
    // Handle player movement
    const handlePlayerMove = useCallback((newPosition: Point) => {
        if (!interiorData) return;
        
        // Check if the new position is within bounds
        if (newPosition.x < 0 || newPosition.x >= interiorData.layout.totalBounds.width ||
            newPosition.y < 0 || newPosition.y >= interiorData.layout.totalBounds.height) {
            return;
        }
        
        // Check if player is trying to move into a wall (outside any architectural space)
        const targetSpace = getSpaceAtPosition(interiorData.layout, newPosition.x, newPosition.y);
        if (!targetSpace) {
            return; // Can't walk into walls (areas outside defined spaces)
        }
        
        // Check if player is trying to enter a restricted space
        if (targetSpace) {
            const accessCheck = checkSpaceAccess(targetSpace, playerReligion, playerClass, playerReputation);
            
            if (!accessCheck.canAccess) {
                // Find NPCs who would react to this transgression
                const reactingNpcs = interiorData.npcs.filter(npc => {
                    const distance = Math.sqrt(
                        Math.pow(npc.x - newPosition.x, 2) + 
                        Math.pow(npc.y - newPosition.y, 2)
                    );
                    return distance < 5; // React if within 5 tiles
                });
                
                // Handle confrontation
                if (reactingNpcs.length > 0) {
                    const confrontingNpc = reactingNpcs[0];
                    
                    if (!confrontedNpcs.has(confrontingNpc.id)) {
                        setConfrontedNpcs(prev => new Set([...prev, confrontingNpc.id]));
                        
                        let dialogue: string[];
                        let reputationChange = -10;
                        
                        if (interiorData.namedElite && confrontingNpc.id === interiorData.namedElite.id) {
                            // Elite NPC confrontation
                            const eliteDialogue = generateEliteDialogue(
                                {
                                    id: confrontingNpc.id,
                                    name: confrontingNpc.name,
                                    title: confrontingNpc.role,
                                    buildingId: config.buildingId,
                                    buildingType: config.buildingType as 'palace' | 'holy_place',
                                    religion: confrontingNpc.religion,
                                    socialClass: confrontingNpc.socialClass as 'nobility' | 'clergy',
                                    personality: 'intimidating',
                                    culturalZone: confrontingNpc.culturalZone,
                                    era: confrontingNpc.era,
                                    respectThreshold: 70,
                                    dialogueStyle: 'aggressive'
                                },
                                playerReligion,
                                playerClass,
                                playerReputation,
                                hasBeenWarned
                            );
                            
                            dialogue = hasBeenWarned ? eliteDialogue.threat : eliteDialogue.greeting.concat(eliteDialogue.demandRespect);
                            reputationChange = hasBeenWarned ? -25 : -15;
                            
                            if (!hasBeenWarned) {
                                setHasBeenWarned(true);
                            }
                        } else {
                            // Guard confrontation
                            dialogue = confrontingNpc.confrontationDialogue || [
                                'Stop right there!',
                                accessCheck.reason || 'You cannot enter this area.',
                                'Leave immediately or face the consequences.'
                            ];
                            reputationChange = -10;
                        }
                        
                        onNpcInteraction(confrontingNpc, dialogue);
                        onReputationChange(reputationChange, `Trespassing in ${targetSpace.name}`);
                        
                        // Block movement
                        return;
                    }
                }
                
                // Still block movement even if no NPCs react
                return;
            }
        }
        
        // Movement is allowed
        setPlayerPosition(newPosition);
        
        // Check if player is near an NPC for interaction
        const nearbyNpcs = interiorData.npcs.filter(npc => {
            const distance = Math.sqrt(
                Math.pow(npc.x - newPosition.x, 2) + 
                Math.pow(npc.y - newPosition.y, 2)
            );
            return distance < 2;
        });
        
        if (nearbyNpcs.length > 0 && !confrontedNpcs.has(nearbyNpcs[0].id)) {
            const npc = nearbyNpcs[0];
            let dialogue: string[];
            
            if (interiorData.namedElite && npc.id === interiorData.namedElite.id) {
                // Respectful approach to elite
                const eliteDialogue = generateEliteDialogue(
                    {
                        id: npc.id,
                        name: npc.name,
                        title: npc.role,
                        buildingId: config.buildingId,
                        buildingType: config.buildingType as 'palace' | 'holy_place',
                        religion: npc.religion,
                        socialClass: npc.socialClass as 'nobility' | 'clergy',
                        personality: 'arrogant',
                        culturalZone: npc.culturalZone,
                        era: npc.era,
                        respectThreshold: 70,
                        dialogueStyle: 'condescending'
                    },
                    playerReligion,
                    playerClass,
                    playerReputation,
                    true // Assume respectful approach
                );
                
                if (playerClass === 'commoner' || playerReputation < 50) {
                    dialogue = eliteDialogue.greeting.concat([
                        'You may speak, but be brief.',
                        'Remember your place in my presence.'
                    ]);
                } else {
                    dialogue = [
                        `Welcome. I am ${npc.name}.`,
                        'What brings you to my domain?'
                    ];
                }
            } else {
                // Regular NPC dialogue
                dialogue = [
                    `I am ${npc.name}, ${npc.occupation?.toLowerCase()}.`,
                    'Please respect this sacred space.',
                    'Is there something you need?'
                ];
            }
            
            onNpcInteraction(npc, dialogue);
        }
    }, [interiorData, playerReligion, playerClass, playerReputation, hasBeenWarned, confrontedNpcs, config, onNpcInteraction, onReputationChange]);
    
    // Handle ESC key for exit only
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 'escape') {
                onExit();
                event.preventDefault();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onExit]);
    
    if (!interiorData) {
        return (
            <div className="flex items-center justify-center w-full h-screen bg-gray-900 text-white">
                <div className="text-xl">Generating interior...</div>
            </div>
        );
    }
    
    return (
        <div className="w-full h-screen bg-black relative overflow-hidden">
            {/* Beautiful interior renderer */}
            <div className="w-full h-full flex items-center justify-center">
                <div className="max-w-4xl max-h-4xl w-full h-full p-4">
                    <BeautifulInteriorRenderer
                        layout={interiorData.layout}
                        playerPosition={playerPosition}
                        playerCharacter={playerCharacter}
                        npcs={interiorData.npcs}
                        scale={1}
                        onNpcClick={onNpcClick}
                    />
                </div>
            </div>
            
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg border border-gray-600">
                <h2 className="text-lg font-bold mb-2">{interiorData.layout.name}</h2>
                <p className="text-sm text-gray-300 mb-2">{interiorData.layout.name}</p>
                {interiorData.namedElite && (
                    <p className="text-sm text-yellow-400">
                        {interiorData.namedElite.name} is present
                    </p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                    <p>Click to interact with NPCs and objects</p>
                    <p>ESC to exit</p>
                </div>
            </div>
            
            {/* Exit button */}
            <button
                onClick={onExit}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg border border-red-400 transition-colors"
            >
                Exit
            </button>
            
            {/* Status indicators */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg border border-gray-600">
                <div className="text-sm">
                    <p>Position: ({playerPosition.x}, {playerPosition.y})</p>
                    <p>Class: {playerClass}</p>
                    <p>Religion: {playerReligion}</p>
                    <p>Reputation: {playerReputation}</p>
                </div>
            </div>
        </div>
    );
};

export default BeautifulInteriorMapDisplay;