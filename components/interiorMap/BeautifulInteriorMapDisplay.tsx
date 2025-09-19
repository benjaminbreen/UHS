/**
 * Beautiful Interior Map Display - renders architectural layouts with NPCs and interactions
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import BeautifulInteriorRenderer from './BeautifulInteriorRenderer';
import { generateBeautifulInterior, checkSpaceAccess, getSpaceAtPosition } from '../../generation/interiorMap/beautifulInteriorGenerator';
import { generateEliteDialogue } from '../../services/buildingElites';
import { generateFortressCommanderDialogue } from '../../services/llmService';
import { InteriorGenerationConfig } from '../../types/interiorMapTypes';
import { BuildingLayout } from '../../generation/interiorMap/architecturalLayouts';
import { NpcEntity } from '../../types/npcTypes';
import { Point, PlayerCharacter, MapData } from '../../types';
import { ProceduralPortrait } from '../portraits';
import { generateHistoricalName } from '../../constants/characterData/names';
import { generateBaseProfile } from '../../generation/common/npcUtils';
import { ValueNoise } from '../../utils/noise';

/** Deterministic seeded "random" for stable UI mock values. */
const seeded = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  const next = () => {
    s = (s + 1) % 10000;
    return (s - Math.floor(s));
  };
  const rangeInt = (min: number, max: number) => Math.floor(next() * (max - min)) + min;
  return { next, rangeInt };
};

interface BeautifulInteriorMapDisplayProps {
    config: InteriorGenerationConfig;
    playerCharacter: PlayerCharacter;
    playerReligion: string;
    playerClass: string;
    playerReputation: number;
    mapData?: MapData; // Optional for fortress commander dialogue context
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
    mapData,
    onExit,
    onNpcInteraction,
    onReputationChange,
    onNpcClick
}) => {
    const [playerPosition, setPlayerPosition] = useState<Point>({ x: 15, y: 25 });
    const [interiorData, setInteriorData] = useState<InteriorData | null>(null);
    const [hasBeenWarned, setHasBeenWarned] = useState(false);
    const [confrontedNpcs, setConfrontedNpcs] = useState<Set<string>>(new Set());
    
    // Inline dialogue state (FF6-style)
    const [currentDialogue, setCurrentDialogue] = useState<{ text: string; speaker: string; npc: NpcEntity; visible: boolean } | null>(null);
    const [dialogueHistory, setDialogueHistory] = useState<{ speaker: string; text: string }[]>([]);
    const [dialogueGenerated, setDialogueGenerated] = useState<Set<string>>(new Set());
    const [playerInput, setPlayerInput] = useState('');
    const [isSubmittingInput, setIsSubmittingInput] = useState(false);
    
    // Track if fortress commander dialogue has been triggered (prevent infinite loops)
    const hasFetchedFortressDialogue = useRef(false);
    
    // Helper to show inline dialogue (only once per NPC)
    const showDialogue = useCallback((speaker: string, text: string, npc: NpcEntity) => {
        if (dialogueGenerated.has(npc.id)) {
            // Already generated dialogue for this NPC, just show existing
            setCurrentDialogue({ text, speaker, npc, visible: true });
            return;
        }
        
        console.log(`💬 [Interior] Showing dialogue from ${speaker}: ${text}`);
        setCurrentDialogue({ text, speaker, npc, visible: true });
        setDialogueHistory(prev => [...prev, { speaker, text }]);
        setDialogueGenerated(prev => new Set([...prev, npc.id]));
        
        // Don't auto-hide - dialogue stays until player responds or leaves
    }, [dialogueGenerated]);
    
    // Handle player response
    const handlePlayerResponse = useCallback(async () => {
        if (!currentDialogue || !playerInput.trim()) return;
        
        setIsSubmittingInput(true);
        console.log(`🗣️ [Interior] Player responds: ${playerInput}`);
        
        try {
            if (config.buildingType === 'fortress' && mapData) {
                const { dialogue } = await generateFortressCommanderDialogue(
                    playerCharacter,
                    mapData,
                    currentDialogue.npc,
                    playerInput
                );
                
                // Fade out current dialogue and show response
                setCurrentDialogue(prev => prev ? { ...prev, visible: false } : null);
                setTimeout(() => {
                    setCurrentDialogue({
                        text: dialogue,
                        speaker: currentDialogue.npc.name,
                        npc: currentDialogue.npc,
                        visible: true
                    });
                    setDialogueHistory(prev => [...prev, { speaker: 'You', text: playerInput }, { speaker: currentDialogue.npc.name, text: dialogue }]);
                }, 300);
            }
        } catch (error) {
            console.error('Failed to generate response:', error);
            // Show a cold dismissal as fallback
            setCurrentDialogue(prev => prev ? { ...prev, text: 'I have no time for this.', visible: true } : null);
        }
        
        setPlayerInput('');
        setIsSubmittingInput(false);
    }, [currentDialogue, playerInput, config.buildingType, mapData, playerCharacter]);
    
    // Create procedural portrait for fortress commander (similar to GovernmentDistrictModal)
    const commanderPortrait = useMemo(() => {
        if (!interiorData?.namedElite || config.buildingType !== 'fortress') return null;
        
        const npc = interiorData.namedElite;
        const year = parseInt(mapData?.timeSlice || '1500');
        
        // Generate seed from NPC ID and location for consistency
        const npcIdHash = npc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const portraitSeed = (npc.x * 7919 + npc.y * 6271 + npcIdHash * 31 + year) % 1000000;
        const rng = seeded(portraitSeed);
        
        // Use existing NPC data or generate enhanced version for portrait
        const culturalZone = mapData?.culturalZone || 'EUROPEAN';
        
        // Generate name if not present or enhance existing
        const nameData = generateHistoricalName(
            culturalZone,
            mapData?.region || '',
            year,
            npc.gender?.toLowerCase() as 'male' | 'female' || 'male'
        );
        
        // Create pseudo-noise for consistent generation
        const pseudoNoise: ValueNoise = {
            random: () => rng.next(),
            get: (x: number, y: number) => rng.next(),
            getNormalized: (x: number, y: number) => rng.next()
        };
        
        // Generate enhanced profile for commander
        const baseProfile = generateBaseProfile(pseudoNoise, {
            era: year < 500 ? 'antiquity' : year < 1400 ? 'medieval' : 'renaissance',
            culturalZone,
            region: mapData?.region || ''
        });
        
        // Enhanced commander character with better stats
        return {
            ...npc,
            name: npc.name || `${nameData.firstName} ${nameData.surname}`,
            age: npc.age || (35 + rng.rangeInt(0, 20)),
            appearance: {
                ...baseProfile.appearance,
                clothing: {
                    ...baseProfile.appearance.clothing,
                    quality: 'fine' as const, // Commanders wear fine clothing
                    wealth: 'wealthy' as const
                }
            },
            stats: {
                ...baseProfile.stats,
                intelligence: Math.min(10, (baseProfile.stats.intelligence || 5) + 2),
                charisma: Math.min(10, (baseProfile.stats.charisma || 5) + 2),
                strength: Math.min(10, (baseProfile.stats.strength || 5) + 3)
            }
        };
    }, [interiorData?.namedElite, config.buildingType, mapData]);
    
    // Handle player movement - MUST be defined before useEffect that uses it
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
                        
                        // Show inline dialogue instead of encounter modal
                        const combinedDialogue = Array.isArray(dialogue) ? dialogue.join(' ') : dialogue;
                        showDialogue(confrontingNpc.name, combinedDialogue, confrontingNpc);
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
            
            if (interiorData.namedElite && npc.id === interiorData.namedElite.id) {
                // Handle fortress commander with LLM dialogue
                if (config.buildingType === 'fortress' && mapData) {
                    console.log('🏰 [BeautifulInteriorMapDisplay] Generating fortress commander dialogue...');
                    generateFortressCommanderDialogue(
                        playerCharacter,
                        mapData,
                        npc
                    ).then(({ greeting, dialogue: mainDialogue }) => {
                        const fullDialogue = `${greeting} ${mainDialogue}`;
                        showDialogue(npc.name, fullDialogue, npc);
                    }).catch(error => {
                        console.error('Failed to generate fortress commander dialogue:', error);
                        // Fallback dialogue
                        const fallbackDialogue = `Welcome, ${playerCharacter.name}. I am ${npc.name}. What brings you to seek an audience with me?`;
                        showDialogue(npc.name, fallbackDialogue, npc);
                    });
                    return; // Exit early for async handling
                }
                
                // Handle palace/holy site elites with existing system
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
                
                let dialogue: string[];
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
                // Use inline dialogue for elite NPCs
                const combinedDialogue = dialogue.join(' ');
                showDialogue(npc.name, combinedDialogue, npc);
            } else {
                // Regular NPC dialogue
                const dialogue = [
                    `I am ${npc.name}, ${npc.occupation?.toLowerCase()}.`,
                    config.buildingType === 'fortress' ? 'State your business here.' : 'Please respect this sacred space.',
                    'Is there something you need?'
                ];
                // Use inline dialogue for regular NPCs
                const combinedDialogue = dialogue.join(' ');
                showDialogue(npc.name, combinedDialogue, npc);
            }
        }
    }, [interiorData, playerReligion, playerClass, playerReputation, hasBeenWarned, confrontedNpcs, config, onNpcInteraction, onReputationChange, playerCharacter, mapData, showDialogue]);
    
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
        
        // For fortress, automatically trigger commander dialogue on entry (only once)
        if (config.buildingType === 'fortress' && data.namedElite && mapData && !hasFetchedFortressDialogue.current) {
            hasFetchedFortressDialogue.current = true;
            console.log('🏰 [BeautifulInteriorMapDisplay] Auto-triggering fortress commander dialogue on entry');
            generateFortressCommanderDialogue(
                playerCharacter,
                mapData,
                data.namedElite
            ).then(({ greeting, dialogue: mainDialogue }) => {
                const fullDialogue = `${greeting} ${mainDialogue}`;
                // Direct state update instead of using showDialogue to avoid dependency issues
                setCurrentDialogue({ text: fullDialogue, speaker: data.namedElite.name, npc: data.namedElite, visible: true });
                setDialogueHistory(prev => [...prev, { speaker: data.namedElite.name, text: fullDialogue }]);
                setDialogueGenerated(prev => new Set([...prev, data.namedElite.id]));
            }).catch(error => {
                console.error('Failed to generate fortress commander dialogue on entry:', error);
                // Fallback dialogue
                const fallbackDialogue = `Welcome, ${playerCharacter.name}. I am ${data.namedElite.name}. State your business in my fortress.`;
                setCurrentDialogue({ text: fallbackDialogue, speaker: data.namedElite.name, npc: data.namedElite, visible: true });
                setDialogueHistory(prev => [...prev, { speaker: data.namedElite.name, text: fallbackDialogue }]);
                setDialogueGenerated(prev => new Set([...prev, data.namedElite.id]));
            });
        }
    }, [config.buildingId, config.buildingType]); // Minimal dependencies - removed playerCharacter, mapData, showDialogue
    
    // Handle keyboard movement
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!playerPosition) return;
            
            let newX = playerPosition.x;
            let newY = playerPosition.y;
            
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    newY -= 1;
                    break;
                case 's':
                case 'arrowdown':
                    newY += 1;
                    break;
                case 'a':
                case 'arrowleft':
                    newX -= 1;
                    break;
                case 'd':
                case 'arrowright':
                    newX += 1;
                    break;
                case 'escape':
                    onExit();
                    return;
                default:
                    return;
            }
            
            handlePlayerMove({ x: newX, y: newY });
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [playerPosition, handlePlayerMove, onExit]);
    
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
            
            {/* FF6-Style Dialogue Box with Portrait */}
            {currentDialogue?.visible && (
                <div
                    className="ff6-dialogue-box"
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 1000,
                        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        border: '3px solid #4a90e2',
                        borderRadius: '12px',
                        padding: '20px',
                        maxWidth: 'min(400px, calc(100vw - 40px))',
                        minWidth: 'min(300px, calc(100vw - 40px))',
                        boxShadow: '0 8px 32px rgba(74, 144, 226, 0.3), inset 0 2px 4px rgba(74, 144, 226, 0.2)',
                        animation: 'dialogueFadeIn 0.3s ease-out',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                    }}
                >
                    {/* Commander Portrait */}
                    {commanderPortrait && (
                        <div style={{ flexShrink: 0 }}>
                            <ProceduralPortrait
                                character={commanderPortrait}
                                size={80}
                                className="rounded-lg border-2 border-amber-500/30"
                            />
                        </div>
                    )}
                    
                    {/* Dialogue Content */}
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#60a5fa',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {currentDialogue.speaker}
                        </div>
                        <div style={{
                            color: '#e2e8f0',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            fontFamily: "'Segoe UI', system-ui, sans-serif",
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                        }}>
                            {currentDialogue.text}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Player Input Box (FF6-style, positioned at bottom right) */}
            {currentDialogue?.visible && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        width: 'min(400px, calc(100vw - 40px))',
                        zIndex: 1000
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(145deg, #0f1419, #1a2332)',
                        border: '3px solid #60a5fa',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: 'inset 0 2px 4px rgba(96, 165, 250, 0.2), 0 4px 12px rgba(0,0,0,0.6), 0 0 15px rgba(96, 165, 250, 0.3)'
                    }}>
                        <input
                            type="text"
                            value={playerInput}
                            onChange={(e) => setPlayerInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePlayerResponse();
                                if (e.key === 'Escape') setCurrentDialogue(prev => prev ? { ...prev, visible: false } : null);
                            }}
                            placeholder="Type your response..."
                            disabled={isSubmittingInput}
                            style={{
                                width: '100%',
                                background: '#0f1419',
                                border: '2px solid #60a5fa',
                                borderRadius: '4px',
                                color: '#e2e8f0',
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '10px',
                                padding: '8px',
                                marginBottom: '12px',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(96, 165, 250, 0.2)',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handlePlayerResponse}
                            disabled={isSubmittingInput || !playerInput.trim()}
                            style={{
                                background: 'linear-gradient(145deg, #0f1419, #1a2332)',
                                border: '2px solid #60a5fa',
                                borderRadius: '4px',
                                color: '#e2e8f0',
                                fontFamily: "'Press Start 2P', monospace",
                                fontSize: '9px',
                                padding: '8px 16px',
                                cursor: isSubmittingInput || !playerInput.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: 'inset 0 2px 4px rgba(96, 165, 250, 0.2), 0 2px 8px rgba(0,0,0,0.3)',
                                opacity: isSubmittingInput || !playerInput.trim() ? 0.5 : 1
                            }}
                        >
                            {isSubmittingInput ? 'Sending...' : 'Speak'}
                        </button>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes dialogueFadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
            
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
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg border border-red-400 transition-colors text-sm font-semibold"
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