/**
 * components/EncounterModal.tsx - A universal, detailed modal for entity encounters.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EncounterableEntity, NpcEntity, DialogueEntry, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue } from '../services/encounterService';
import { summarizeConversation, generateInternalMonologue, generateNpcQuestOffer } from '../services/llmService';
import { TypewriterText } from '../hooks/useTypewriter';
import NpcTradeInterface from './NpcTradeInterface';
import { ProceduralPortrait, AnimatedPortrait } from './portraits';
import { questService } from '../services/questService';
import { Quest } from '../types/questTypes';
import { questCompletionService } from '../services/questCompletionService';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import { GameModeType } from '../types/eventTypes';
import { spatialDescriptionService } from '../services/spatialDescriptionService';
import { Sparkles, Target, MapPin, Info, AlertTriangle, Heart } from 'lucide-react';
import NpcQuestPanel from './NpcQuestPanel';
import NpcMedicalPanel from './NpcMedicalPanel';
import NpcHouseholdPanel from './NpcHouseholdPanel';
import DiseaseContractedModal from './DiseaseContractedModal';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { 
    attemptTaming, 
    checkAnimalOwnership, 
    createTamedAnimal, 
    addToParty,
    calculateAnimalValue 
} from '../services/animalTamingService';
import { eventService } from '../services/eventService';
import { getLanguageForCharacter, getLanguageComprehension, LANGUAGES } from '../constants/gameData/languages';
import { triggerArrest, ArrestScenario } from '../services/arrestService';
import { usePortraitExpression, mapRepDeltaToExpr, mapEventToExpr } from '../hooks/usePortraitExpression';

function isNpc(target: EncounterableEntity): target is NpcEntity {
    return 'role' in target;
}

function getHistoricalLanguage(npc: NpcEntity, mapData: MapData | null): string {
    if (!mapData) return 'Native Language';
    
    const year = parseInt(mapData.timeSlice || '1500');
    const language = getLanguageForCharacter(
        npc.culturalZone || mapData.culturalZone || 'EUROPEAN',
        year,
        mapData.region,
        mapData.localArea
    );
    
    return language?.name || 'Native Language';
}

/**
 * Get language comprehension level between speaker and listener
 */
function calculateComprehension(npc: NpcEntity, player: PlayerCharacter, mapData: MapData | null): number {
    if (!mapData) return 1.0; // Full comprehension if no context
    
    const year = parseInt(mapData.timeSlice || '1500');
    
    // Get languages
    const npcLang = getLanguageForCharacter(
        npc.culturalZone || mapData.culturalZone || 'EUROPEAN',
        year,
        mapData.region,
        mapData.localArea
    );
    
    const playerLang = getLanguageForCharacter(
        player.culturalZone || mapData.culturalZone || 'EUROPEAN',
        year,
        mapData.region,
        mapData.localArea
    );
    
    if (!npcLang || !playerLang) return 1.0;
    
    return getLanguageComprehension(npcLang, playerLang);
}

interface EncounterModalProps {
  target: EncounterableEntity;
  playerCharacter: PlayerCharacter;
  allNpcs: NpcEntity[];
  mapData: MapData | null;
  onClose: (history: DialogueEntry[]) => void;
  onInitiateCombat: (target: EncounterableEntity) => void;
  onOpenInfo: (target: EncounterableEntity) => void;
}

const EncounterModal: React.FC<EncounterModalProps> = ({ target, playerCharacter, allNpcs, mapData, onClose, onInitiateCombat, onOpenInfo }) => {
    const { showToast, setCurrentEvent } = useUI();
    const { worldData } = useMap();
    const { gameDate } = useGame();
    
    // Portrait expression management
    const { expr: portraitExpr, flash: flashPortrait, clear: clearPortrait } = usePortraitExpression();
    
    const [history, setHistory] = useState<DialogueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playerInput, setPlayerInput] = useState('');
    const [activeTab, setActiveTab] = useState<'dialogue' | 'history' | 'trade' | 'medical' | 'household' | 'quest'>('dialogue');
    
    const [useRealLanguage, setUseRealLanguage] = useState(false);
    const [showTradeInterface, setShowTradeInterface] = useState(false);
    const [showNegotiationPanel, setShowNegotiationPanel] = useState(false);
    const [negotiationResponse, setNegotiationResponse] = useState('');
    const [reputationChange, setReputationChange] = useState<number | null>(null);
    const [npcWantsToLeave, setNpcWantsToLeave] = useState(false);
    const [diseaseTransmissionResult, setDiseaseTransmissionResult] = useState<{
        transmitted: boolean;
        exposures: any[];
        symptomDescriptions: string[];
    } | null>(null);
    const [showDiseaseWarning, setShowDiseaseWarning] = useState(false);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);
    const [contractedDisease, setContractedDisease] = useState<any>(null);
    
    // Taming states
    const [showTamingInterface, setShowTamingInterface] = useState(false);
    const [tamingApproach, setTamingApproach] = useState('');
    const [tamingInProgress, setTamingInProgress] = useState(false);
    const [tamingAttempts, setTamingAttempts] = useState(0);
    const [tamingResult, setTamingResult] = useState<string | null>(null);
    const [animalOwner, setAnimalOwner] = useState<NpcEntity | null>(null);
    const [isTheft, setIsTheft] = useState(false);
    
    // Internal monologue states
    const [showMonologue, setShowMonologue] = useState(false);
    const [monologueText, setMonologueText] = useState('');
    const [monologueClickCount, setMonologueClickCount] = useState(0);
    const [isLoadingMonologue, setIsLoadingMonologue] = useState(false);
    const monologueCache = useRef<Map<number, string>>(new Map());
    
    // Quest states
    const [hasCheckedForQuest, setHasCheckedForQuest] = useState(false);
    const [isLoadingQuest, setIsLoadingQuest] = useState(false);
    const [questOffer, setQuestOffer] = useState<any>(null);
    const [canCompleteQuest, setCanCompleteQuest] = useState<{ quest: Quest; objective: any } | null>(null);
    const [useHistoricalQuests, setUseHistoricalQuests] = useState(true); // Default to historical system
    
    const hasFetchedInitialDialogue = useRef(false);
    const dialogueLogRef = useRef<HTMLDivElement>(null);

    const targetName = isNpc(target) ? target.name : target.speciesName;
    
    /**
     * Trigger arrest scenario when reputation hits zero
     */
    const triggerArrestScenario = useCallback(() => {
        if (!playerCharacter || !worldData) return;
        
        // Find nearest city, palace, or fortress
        const structures = worldData.terrainStructures || [];
        const playerPos = { x: playerCharacter.x || 0, y: playerCharacter.y || 0 };
        
        // Filter for cities, palaces, and fortresses
        const jailableStructures = structures.filter(s => 
            s.type === 'city' || 
            s.type === 'palace' || 
            s.type === 'fortress' ||
            s.type === 'urban'
        );
        
        if (jailableStructures.length === 0) {
            console.log('[JAIL] No suitable structures found for arrest');
            // Fallback: just show arrest event without teleportation
            const arrestEvent = {
                id: 'arrest_wilderness',
                title: 'Captured by Local Militia!',
                description: `Your reputation has become so infamous that a militia has been dispatched to apprehend you. You are bound and taken to face justice.`,
                context: {
                    era: mapData?.timeSlice || 'medieval',
                    culturalZone: mapData?.culturalZone || 'european'
                },
                outcomes: [
                    {
                        buttonText: 'Submit to your fate',
                        effects: [
                            { type: 'reputation' as const, value: 30 }, // Reset reputation to 30
                            { type: 'currency' as const, value: -Math.floor((playerCharacter.currency || 0) / 2) }, // Lose half money
                            { type: 'health' as const, value: -10 }
                        ],
                        historicalNote: 'In this era, criminals faced harsh justice. You spend several days in stocks.'
                    },
                    {
                        buttonText: 'Attempt to escape',
                        statCheck: { stat: 'dexterity' as const, difficulty: 18 },
                        successEffects: [
                            { type: 'reputation' as const, value: -20 }, // Become even more infamous
                            { type: 'wisdom' as const, value: 1 }
                        ],
                        failureEffects: [
                            { type: 'health' as const, value: -25 },
                            { type: 'reputation' as const, value: 30 }, // Reset reputation
                            { type: 'currency' as const, value: -(playerCharacter.currency || 0) } // Lose all money
                        ],
                        historicalNote: 'Escaping custody was a serious crime, often punishable by death.'
                    }
                ]
            };
            
            setCurrentEvent(arrestEvent);
            return;
        }
        
        // Find nearest structure
        let nearestStructure = jailableStructures[0];
        let minDistance = Number.MAX_VALUE;
        
        for (const structure of jailableStructures) {
            const dx = structure.x - playerPos.x;
            const dy = structure.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestStructure = structure;
            }
        }
        
        console.log(`[JAIL] Arresting player and teleporting to ${nearestStructure.type} at (${nearestStructure.x}, ${nearestStructure.y})`);
        
        // Teleport player to the structure
        if (playerCharacter.x !== undefined && playerCharacter.y !== undefined) {
            playerCharacter.x = nearestStructure.x;
            playerCharacter.y = nearestStructure.y;
        }
        
        // Create arrest event based on structure type
        const locationName = nearestStructure.type === 'city' ? 'city jail' :
                           nearestStructure.type === 'palace' ? 'palace dungeon' :
                           nearestStructure.type === 'fortress' ? 'fortress prison' :
                           'local garrison';
        
        const arrestEvent = {
            id: 'arrest_jail',
            title: 'Arrested and Imprisoned!',
            description: `The authorities have apprehended you due to your criminal reputation. You are dragged to the ${locationName} to face justice. ${nearestStructure.type === 'palace' ? 'The royal guards show no mercy.' : 'The local constables treat you roughly.'}`,
            context: {
                era: mapData?.timeSlice || 'medieval',
                culturalZone: mapData?.culturalZone || 'european'
            },
            outcomes: [
                {
                    buttonText: 'Accept your punishment',
                    effects: [
                        { type: 'reputation' as const, value: 30 }, // Reset reputation to 30
                        { type: 'currency' as const, value: -Math.floor((playerCharacter.currency || 0) * 0.75) }, // Lose 75% of money
                        { type: 'health' as const, value: -15 },
                        { type: 'fatigue' as const, value: -20 }
                    ],
                    historicalNote: `In ${mapData?.timeSlice || 'this era'}, imprisonment often included hard labor and confiscation of assets. You spend a week in the ${locationName}.`
                },
                {
                    buttonText: 'Bribe the guards',
                    statCheck: { stat: 'charisma' as const, difficulty: 15 },
                    requiresCurrency: Math.max(50, Math.floor((playerCharacter.currency || 0) * 0.5)),
                    successEffects: [
                        { type: 'currency' as const, value: -Math.max(50, Math.floor((playerCharacter.currency || 0) * 0.5)) },
                        { type: 'reputation' as const, value: 10 } // Small reputation gain for "paying your debt"
                    ],
                    failureEffects: [
                        { type: 'currency' as const, value: -(playerCharacter.currency || 0) }, // Lose all money
                        { type: 'reputation' as const, value: 30 }, // Reset reputation
                        { type: 'health' as const, value: -20 }
                    ],
                    historicalNote: 'Corruption was common in medieval justice systems, but failed bribes led to harsher punishments.'
                },
                {
                    buttonText: 'Demand trial by combat',
                    statCheck: { stat: 'strength' as const, difficulty: 16 },
                    successEffects: [
                        { type: 'reputation' as const, value: 50 }, // Gain respect
                        { type: 'health' as const, value: -10 },
                        { type: 'strength' as const, value: 1 }
                    ],
                    failureEffects: [
                        { type: 'health' as const, value: -30 },
                        { type: 'reputation' as const, value: 20 }, // Some reset
                        { type: 'fatigue' as const, value: -30 }
                    ],
                    historicalNote: 'Trial by combat was a legitimate legal option in many medieval societies, though risky.'
                }
            ]
        };
        
        // Show the arrest event modal
        setCurrentEvent(arrestEvent);
        
        // Force update player position in the UI
        showToast(`You have been arrested and taken to the ${locationName}!`);
    }, [playerCharacter, worldData, mapData, setCurrentEvent, showToast]);
    
    // Generate household data once using useMemo
    const npcHousehold = useMemo(() => {
        if (!isNpc(target)) return [];
        
        const household = [];
        const age = target.age || 30;
        const seed = target.id ? target.id.charCodeAt(0) : 0; // Use NPC id as seed for consistency
        
        // Use seeded random for consistency
        const seededRandom = (index: number) => {
            const x = Math.sin(seed + index) * 10000;
            return x - Math.floor(x);
        };
        
        // Spouse (50% chance if over 20)
        if (age > 20 && seededRandom(1) > 0.5) {
            household.push({
                relation: 'Spouse',
                name: `${target.name}'s spouse`,
                age: age + Math.floor(seededRandom(2) * 10 - 5),
                profession: 'Homemaker',
                health: seededRandom(3) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
            });
        }
        
        // Children (if over 25)
        if (age > 25) {
            const numChildren = Math.floor(seededRandom(4) * 4);
            for (let i = 0; i < numChildren; i++) {
                const childAge = Math.max(1, Math.min(age - 18, Math.floor(seededRandom(5 + i) * (age - 20))));
                household.push({
                    relation: seededRandom(6 + i) > 0.5 ? 'Son' : 'Daughter',
                    name: `Child ${i + 1}`,
                    age: childAge,
                    profession: childAge > 14 ? 'Apprentice' : 'Child',
                    health: seededRandom(7 + i) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
                });
            }
        }
        
        // Parents (30% chance if under 40)
        if (age < 40 && seededRandom(20) > 0.7) {
            household.push({
                relation: 'Mother',
                name: `${target.name}'s mother`,
                age: age + 20 + Math.floor(seededRandom(21) * 10),
                profession: 'Elder',
                health: seededRandom(22) < 0.4 ? 'Sick (Chronic illness)' : 'Frail'
            });
        }
        
        return household;
    }, [target.id, target.age, target.name]);
    
    const handleClose = useCallback(() => {
        // Close immediately for better UX
        onClose(history);
        
        // Generate summary asynchronously after modal closes
        if (isNpc(target) && history.length > 1) {
            // Use setTimeout to ensure this happens after the modal closes
            setTimeout(async () => {
                try {
                    const summary = await summarizeConversation(history);
                    if (!target.memory.conversationSummaries) {
                        target.memory.conversationSummaries = [];
                    }
                    target.memory.conversationSummaries.push(summary.summary);
                    // Keep only last 5 conversations
                    if (target.memory.conversationSummaries.length > 5) {
                        target.memory.conversationSummaries = target.memory.conversationSummaries.slice(-5);
                    }
                    
                    // Update opinion based on sentiment
                    if (summary.sentiment === 'positive') {
                        target.memory.opinionOfPlayer = Math.min(100, (target.memory.opinionOfPlayer || 50) + 10);
                    } else if (summary.sentiment === 'negative') {
                        target.memory.opinionOfPlayer = Math.max(0, (target.memory.opinionOfPlayer || 50) - 10);
                    }
                } catch (error) {
                    console.error('Failed to save conversation summary:', error);
                }
            }, 0);
        }
    }, [target, history, onClose]);


    // Check animal ownership on mount
    useEffect(() => {
        if (!isNpc(target) && allNpcs && allNpcs.length > 0) {
            const ownership = checkAnimalOwnership(target, allNpcs);
            if (ownership.isOwned && ownership.owner) {
                setAnimalOwner(ownership.owner);
                setIsTheft(true);
                console.log(`This ${target.speciesName} belongs to ${ownership.owner.name}!`);
            }
        }
    }, [target, allNpcs]);
    
    // Check if this NPC can complete any active quests
    useEffect(() => {
        if (isNpc(target) && playerCharacter) {
            const activeQuests = questService.getActiveQuests();
            const completion = questCompletionService.checkQuestCompletion(
                target,
                playerCharacter,
                activeQuests
            );
            
            if (completion.canComplete && completion.quest && completion.objective) {
                setCanCompleteQuest({ quest: completion.quest, objective: completion.objective });
                console.log(`[Quest] This NPC can complete quest: ${completion.quest.title}`);
            }
        }
    }, [target, playerCharacter]);

    useEffect(() => {
        if (!playerCharacter) return;
        if (!hasFetchedInitialDialogue.current && isNpc(target)) {
            hasFetchedInitialDialogue.current = true;
            setIsLoading(true);
            
            // Generate appropriate greeting based on whether NPC knows the player
            const hasMetBefore = target.memory.conversationSummaries && target.memory.conversationSummaries.length > 0;
            const greeting = hasMetBefore ? 
                "I approach again." : 
                "Hello.";
            
            generateEncounterDialogue(target, target.memory.conversationSummaries || [], greeting, playerCharacter, allNpcs, mapData, useRealLanguage).then(response => {
                const initialEntry: DialogueEntry = { speaker: 'npc', text: response.text, timestamp: new Date() };
                setHistory([initialEntry]);
                
                // Check for hostile or dismissive response
                checkNpcReaction(response);
                setIsLoading(false);
            }).catch(err => {
                console.error("Failed to get initial dialogue:", err);
                const fallbackText = isNpc(target) ? `${targetName} watches you silently.` : `The ${targetName.toLowerCase()} lets out a low growl.`;
                setHistory([{ speaker: 'npc', text: fallbackText, timestamp: new Date() }]);
                setIsLoading(false);
            });
        } else if (!isNpc(target)) {
            const fallbackText = `The ${targetName.toLowerCase()} watches you warily.`;
            setHistory([{ speaker: 'npc', text: fallbackText, timestamp: new Date() }]);
            setIsLoading(false);
        }
    }, [target, targetName, playerCharacter, allNpcs, mapData, useRealLanguage]);

    useEffect(() => {
        if (dialogueLogRef.current) {
            dialogueLogRef.current.scrollTop = dialogueLogRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // Check for disease transmission on encounter start (bidirectional)
    useEffect(() => {
        if (!playerCharacter || !mapData) return;
        
        const currentYear = parseInt(mapData.timeSlice || '1500');
        
        // Initialize player's diseaseHealth if needed
        if (!playerCharacter.diseaseHealth) {
            playerCharacter.diseaseHealth = {
                currentDiseases: [],
                immunities: [],
                exposureHistory: [],
                overallHealthStatus: 'healthy',
                lastHealthUpdate: { year: currentYear, month: 1, day: 1 }
            };
        }
        
        // Check for disease transmission FROM NPC/animal TO player
        if (isNpc(target) || (target as any).speciesName) {
            try {
                const result = diseaseService.checkDirectContactTransmission(
                    target,
                    playerCharacter,
                    currentYear
                );
                
                setDiseaseTransmissionResult(result);
                
                // Show warning if there are visible symptoms or transmission occurred
                if (result.symptomDescriptions.length > 0 || result.transmitted) {
                    setShowDiseaseWarning(true);
                    setTimeout(() => setShowDiseaseWarning(false), 5000);
                    
                    // Show disease modal if player contracted a disease
                    if (result.transmitted && playerCharacter.diseaseHealth?.currentDiseases?.length > 0) {
                        const newDisease = playerCharacter.diseaseHealth.currentDiseases[playerCharacter.diseaseHealth.currentDiseases.length - 1];
                        setContractedDisease(newDisease.disease);
                        setShowDiseaseModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking disease transmission from target:', error);
            }
        }
        
        // Check for disease transmission FROM player TO NPC/animal
        if (playerCharacter.diseaseHealth?.currentDiseases?.length > 0) {
            try {
                const playerDiseasesResult = diseaseService.checkDirectContactTransmission(
                    playerCharacter,
                    target,
                    currentYear
                );
                
                if (playerDiseasesResult.transmitted) {
                    // Update the target's health data
                    if (isNpc(target)) {
                        // Initialize NPC health if needed
                        if (!target.health) {
                            target.health = {
                                currentDiseases: [],
                                immunities: [],
                                exposureHistory: [],
                                overallHealthStatus: 'healthy',
                                lastHealthUpdate: { year: currentYear, month: 1, day: 1 }
                            };
                        }
                        
                        // Show notification
                        const diseaseName = playerCharacter.diseaseHealth.currentDiseases[0].disease.name;
                        showToast(`⚠️ Your ${diseaseName} has spread to ${target.name}!`);
                        console.log(`[Player→NPC Disease Spread] Player's ${diseaseName} transmitted to ${target.name}`);
                    } else if ((target as any).speciesName) {
                        // It's an animal
                        const animal = target as any;
                        if (!animal.diseaseHealth) {
                            animal.diseaseHealth = {
                                currentDiseases: [],
                                immunities: [],
                                exposureHistory: [],
                                overallHealthStatus: 'healthy',
                                lastHealthUpdate: { year: currentYear, month: 1, day: 1 }
                            };
                        }
                        
                        // Show notification
                        const diseaseName = playerCharacter.diseaseHealth.currentDiseases[0].disease.name;
                        showToast(`🐾 Your ${diseaseName} has spread to the ${animal.speciesName}!`);
                        console.log(`[Player→Animal Disease Spread] Player's ${diseaseName} transmitted to ${animal.speciesName}`);
                    }
                }
            } catch (error) {
                console.error('Error checking disease transmission from player:', error);
            }
        }
    }, [target, playerCharacter, mapData, showToast]);
    
    // Taming handler
    const handleTamingAttempt = async () => {
        if (!tamingApproach.trim() || tamingInProgress || !playerCharacter) return;
        
        setTamingInProgress(true);
        
        try {
            const result = await attemptTaming(
                target,
                tamingApproach,
                playerCharacter,
                tamingAttempts > 0 // Is second attempt
            );
            
            setTamingAttempts(prev => prev + 1);
            
            if (result.success === 'tamed') {
                // Success! Add to party
                const tamedAnimal = createTamedAnimal(
                    target,
                    playerCharacter,
                    { year: playerCharacter.year || 1500, month: 1, day: 1 }
                );
                addToParty(tamedAnimal);
                
                // Handle theft consequences
                if (isTheft && animalOwner) {
                    const reputationLoss = -30;
                    setReputationChange(reputationLoss);
                    playerCharacter.mapReputation = Math.max(0, (playerCharacter.mapReputation || 50) + reputationLoss);
                    
                    setTamingResult(`${result.message}\n\n⚠️ WARNING: You stole ${animalOwner.name}'s ${target.speciesName}! Your reputation has plummeted!`);
                } else {
                    setTamingResult(result.message);
                }
                
                // Update history with success
                setHistory(prev => [...prev, {
                    speaker: 'npc',
                    text: result.animalResponse,
                    timestamp: new Date()
                }]);
                
                // Close taming interface but keep modal open to show success
                setTimeout(() => {
                    setShowTamingInterface(false);
                }, 5000);
                
            } else if (result.success === 'partial') {
                // Partial success - can try again
                setTamingResult(result.message);
                setHistory(prev => [...prev, {
                    speaker: 'npc',
                    text: result.animalResponse,
                    timestamp: new Date()
                }]);
                setTamingApproach(''); // Clear for next attempt
                
            } else {
                // Failed - animal flees
                setTamingResult(result.message);
                setHistory(prev => [...prev, {
                    speaker: 'npc',
                    text: result.animalResponse,
                    timestamp: new Date()
                }]);
                
                // Close modal after delay
                setTimeout(() => {
                    handleClose();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Taming attempt failed:', error);
            setTamingResult('The animal seems confused by your approach.');
        } finally {
            setTamingInProgress(false);
        }
    };

    // Check NPC reaction for hostility or desire to leave
    const checkNpcReaction = (response: { 
        text: string, 
        reputationChange?: number, 
        shouldLeave?: boolean, 
        shouldAttack?: boolean,
        shouldCallAuthorities?: boolean,
        reasoning?: string 
    }) => {
        // Check for reputation change and trigger expression
        if (response.reputationChange) {
            setReputationChange(response.reputationChange);
            const expr = mapRepDeltaToExpr(response.reputationChange);
            if (expr) flashPortrait(expr);
            
            if (playerCharacter) {
                const oldReputation = playerCharacter.mapReputation || 50;
                const newReputation = Math.max(0, Math.min(100, oldReputation + response.reputationChange));
                playerCharacter.mapReputation = newReputation;
                
                // Log significant reputation changes
                if (Math.abs(response.reputationChange) >= 50) {
                    console.log(`[REPUTATION] Major change: ${response.reputationChange} (${response.reasoning || 'No reason provided'})`);
                }
                
                // Check if reputation has hit zero - trigger jail scenario
                if (newReputation <= 0 && response.shouldCallAuthorities) {
                    setTimeout(() => {
                        onClose(history);
                        // Trigger jail event
                        triggerArrestScenario();
                    }, 2000);
                }
            }
            // Show reputation change for longer if it's significant
            const displayDuration = Math.abs(response.reputationChange) >= 50 ? 5000 : 3000;
            setTimeout(() => setReputationChange(null), displayDuration);
        }
        
        // Check if NPC wants to call authorities
        if (response.shouldCallAuthorities) {
            // Brief shock before any scowl/concern appears later
            flashPortrait('surprise', 1200);
            
            // NPC is reporting the player!
            setTimeout(() => {
                setNpcWantsToLeave(true);
                flashPortrait('scowl');
                // Add warning message
                const warningEntry: DialogueEntry = { 
                    speaker: 'system', 
                    text: '[The authorities are being summoned!]', 
                    timestamp: new Date() 
                };
                setHistory(prev => [...prev, warningEntry]);
            }, 1000);
        }
        // Check if NPC wants to leave
        else if (response.shouldLeave) {
            // NPC ends conversation
            setNpcWantsToLeave(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        }
    };
    
    const handleSend = async () => {
        if (!isNpc(target) || !playerInput.trim() || isLoading || !playerCharacter || npcWantsToLeave) return;

        const newPlayerEntry: DialogueEntry = { speaker: 'player', text: playerInput, timestamp: new Date() };
        const newHistory = [...history, newPlayerEntry];
        setHistory(newHistory);
        const currentInput = playerInput;
        setPlayerInput('');
        setIsLoading(true);
        
        // Check for threatening language and apply immediate reputation penalty
        const threatWords = ['kill', 'murder', 'attack', 'hurt', 'harm', 'destroy', 'beat', 'strike', 'stab', 'slash'];
        const inputLower = currentInput.toLowerCase();
        const isThreatening = threatWords.some(word => inputLower.includes(word));
        
        if (isThreatening) {
            // Immediate reputation penalty for threats
            flashPortrait('scowl', 2200);
            const threatPenalty = -50;
            setReputationChange(threatPenalty);
            if (playerCharacter.mapReputation !== undefined) {
                const oldReputation = playerCharacter.mapReputation || 50;
                const newReputation = Math.max(0, oldReputation + threatPenalty);
                playerCharacter.mapReputation = newReputation;
                
                console.log(`[REPUTATION] Threat detected! -50 reputation for threatening language`);
                
                // Check if this drops reputation to zero
                if (newReputation <= 0) {
                    setTimeout(() => {
                        onClose(history);
                        triggerArrestScenario();
                    }, 2000);
                    return; // Don't process response if arrested
                }
            }
            setTimeout(() => setReputationChange(null), 5000); // Show for longer
        }
        
        try {
            const response = await generateEncounterDialogue(target, newHistory, currentInput, playerCharacter, allNpcs, mapData, useRealLanguage);
            const newNpcEntry: DialogueEntry = { speaker: 'npc', text: response.text, timestamp: new Date() };
            setHistory(prev => [...prev, newNpcEntry]);
            
            // Check NPC's reaction (may add additional reputation changes)
            checkNpcReaction(response);
        } catch(e) {
            console.error("Error generating dialogue:", e);
            const fallbackEntry: DialogueEntry = { speaker: 'npc', text: "...", timestamp: new Date() };
            setHistory(prev => [...prev, fallbackEntry]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4" onClick={handleClose}>
            <div className={`bg-slate-900 border border-slate-700 rounded-xl ${showNegotiationPanel ? 'max-w-5xl' : 'max-w-2xl'} w-full max-h-[95vh] md:max-h-[80vh] flex ${showNegotiationPanel ? 'flex-col lg:flex-row gap-2 md:gap-4' : 'flex-col'} p-3 md:p-4 transition-all duration-300 overflow-hidden`} onClick={e => e.stopPropagation()}>
                {/* Main content area */}
                <div className={`flex-1 flex flex-col min-h-0 ${showNegotiationPanel ? '' : 'w-full'}`}>
                <header className="flex items-center gap-2 md:gap-4 mb-2 md:mb-3 pb-2 md:pb-3 border-b border-blue-500/30">
                    {/* Replace emoji with procedural portrait */}
                    {isNpc(target) ? (
                        <div 
                            className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-slate-600 cursor-pointer transition-all hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20"
                            onClick={async () => {
                                if (monologueClickCount >= 3) return;
                                const nextCount = monologueClickCount + 1;
                                setMonologueClickCount(nextCount);
                                
                                // Check cache first
                                if (monologueCache.current.has(nextCount)) {
                                    setMonologueText(monologueCache.current.get(nextCount)!);
                                    setShowMonologue(true);
                                    return;
                                }
                                
                                setIsLoadingMonologue(true);
                                setShowMonologue(true);
                                
                                try {
                                    const monologue = await generateInternalMonologue(target, {
                                        currentDialogue: history[history.length - 1]?.text,
                                        playerCharacter,
                                        mapData,
                                        clickCount: nextCount,
                                        recentHistory: history.slice(-4)
                                    });
                                    
                                    monologueCache.current.set(nextCount, monologue);
                                    setMonologueText(monologue);
                                } catch (error) {
                                    console.error('Failed to generate monologue:', error);
                                    setMonologueText('*Their thoughts remain a mystery...*');
                                } finally {
                                    setIsLoadingMonologue(false);
                                }
                            }}
                            title="Click to see what they're really thinking..."
                        >
                            <ProceduralPortrait 
                                character={target as any} 
                                size={70}
                                temporaryExpression={portraitExpr}
                                onExpressionComplete={clearPortrait}
                            />
                        </div>
                    ) : (
                        <div 
                            className="text-3xl md:text-5xl flex-shrink-0 cursor-pointer transition-transform hover:scale-110"
                            onClick={async () => {
                                if (monologueClickCount >= 3) return;
                                const nextCount = monologueClickCount + 1;
                                setMonologueClickCount(nextCount);
                                
                                // Check cache first
                                if (monologueCache.current.has(nextCount)) {
                                    setMonologueText(monologueCache.current.get(nextCount)!);
                                    setShowMonologue(true);
                                    return;
                                }
                                
                                setIsLoadingMonologue(true);
                                setShowMonologue(true);
                                
                                try {
                                    const monologue = await generateInternalMonologue(target, {
                                        currentDialogue: history[history.length - 1]?.text,
                                        playerCharacter,
                                        mapData,
                                        clickCount: nextCount,
                                        recentHistory: history.slice(-4)
                                    });
                                    
                                    monologueCache.current.set(nextCount, monologue);
                                    setMonologueText(monologue);
                                } catch (error) {
                                    console.error('Failed to generate monologue:', error);
                                    setMonologueText('*Their instincts remain hidden...*');
                                } finally {
                                    setIsLoadingMonologue(false);
                                }
                            }}
                            title="Click to sense what they're feeling..."
                        >
                            {target.emoji}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-2xl font-bold truncate" style={{ color: 'var(--ff-header-text)' }}>{targetName}</h3>
                        <p className="text-xs md:text-sm text-slate-300 capitalize truncate">
                            {isNpc(target) ? `${target.class} - ${target.role}${target.religion ? ` • ${target.religion}` : ''}` : target.type}
                        </p>
                    </div>
                    {isNpc(target) && (
                        <button 
                            onClick={() => setUseRealLanguage(p => !p)} 
                            className="ff-action-button text-xs"
                            title={`Toggle between English and ${getHistoricalLanguage(target, mapData)}`}
                        >
                            {useRealLanguage ? `🌐 ${getHistoricalLanguage(target, mapData)}` : '🇬🇧 English'}
                        </button>
                    )}
                </header>

                {/* Disease Warning and Symptoms Display */}
                {diseaseTransmissionResult && (diseaseTransmissionResult.symptomDescriptions.length > 0 || diseaseTransmissionResult.transmitted) && (
                    <div className={`mb-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                        diseaseTransmissionResult.transmitted 
                            ? 'border-red-500 bg-red-900/20' 
                            : 'border-yellow-500 bg-yellow-900/20'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 ${diseaseTransmissionResult.transmitted ? 'text-red-400' : 'text-yellow-400'}`} />
                            <h4 className={`text-sm font-semibold ${diseaseTransmissionResult.transmitted ? 'text-red-400' : 'text-yellow-400'}`}>
                                {diseaseTransmissionResult.transmitted ? 'Disease Exposure!' : 'Visible Symptoms'}
                            </h4>
                        </div>
                        
                        {diseaseTransmissionResult.symptomDescriptions.length > 0 && (
                            <div className="mb-2">
                                <p className="text-xs text-slate-300 mb-1">You notice:</p>
                                {diseaseTransmissionResult.symptomDescriptions.map((symptom, index) => (
                                    <p key={index} className="text-sm text-slate-200 ml-2">• {symptom}</p>
                                ))}
                            </div>
                        )}
                        
                        {diseaseTransmissionResult.transmitted && (
                            <p className="text-xs text-red-300">
                                ⚠️ You may have been exposed to disease through close contact.
                            </p>
                        )}
                    </div>
                )}

                {/* Disease Transmission Animation */}
                {showDiseaseWarning && diseaseTransmissionResult?.transmitted && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Disease Transmission Risk!</span>
                        </div>
                    </div>
                )}

                {isNpc(target) && (
                    <div className="flex bg-slate-800/60 rounded-t-lg border-x border-t border-slate-700/50 shrink-0 shadow-sm">
                        <button onClick={() => setActiveTab('dialogue')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'dialogue' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Dialogue</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'history' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>History</button>
                        <button onClick={() => setActiveTab('household')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'household' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Household</button>
                        <button onClick={() => setActiveTab('trade')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'trade' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>Trade</button>
                        <button onClick={() => setActiveTab('quest')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'quest' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>
                            <span className="flex items-center justify-center gap-1">
                                <Target className="w-3 h-3" />
                                Quests
                            </span>
                        </button>
                        {/* Show medical tab if NPC is a healer or player has diseases */}
                        {((target.role && (target.role.toLowerCase().includes('healer') || target.role.toLowerCase().includes('physician') || target.role.toLowerCase().includes('apothecary'))) || 
                          (playerCharacter?.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0)) && (
                            <button onClick={() => setActiveTab('medical')} className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-200 border-b-2 ${activeTab === 'medical' ? 'text-white border-blue-400 bg-slate-700/50' : 'text-slate-300 border-transparent hover:bg-slate-700/40 hover:text-white'}`}>
                                <span className="flex items-center justify-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    Medical
                                </span>
                            </button>
                        )}
                    </div>
                )}

                <main className="flex-1 min-h-0 max-h-[400px] p-3 mb-3 overflow-y-auto bg-black/25 rounded-b-md border-x border-b border-slate-600/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" ref={dialogueLogRef}>
                     {activeTab === 'dialogue' && (
                        <>
                            {isLoading && history.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
                                    Loading...
                                </div>
                            ) : history.map((msg, index) => (
                                <div key={index} className="mb-3">
                                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/40">
                                        <strong className="block mb-1 text-sm font-semibold" style={{color: msg.speaker === 'player' ? '#81e6d9' : 'var(--ff-header-text)'}}>{msg.speaker === 'player' ? (playerCharacter?.name || 'You') : targetName}</strong>
                                        <p className="text-base leading-relaxed text-slate-200">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && history.length > 0 && (
                                <div className="mb-3">
                                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/40">
                                        <strong className="block mb-1 text-sm font-semibold" style={{color: 'var(--ff-header-text)'}}>{targetName}</strong>
                                        <p className="text-base text-slate-200"><span className="animate-pulse">●●●</span></p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Quest Completion UI */}
                            {canCompleteQuest && (
                                <div className="mb-3 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/50 animate-in slide-in-from-top duration-300">
                                    <div className="flex items-start gap-3">
                                        <Target className="w-6 h-6 text-purple-400 mt-1 animate-pulse" />
                                        <div className="flex-1">
                                            <h4 className="text-purple-300 font-semibold mb-1">Quest Objective Available!</h4>
                                            <p className="text-sm text-slate-300 mb-2">
                                                {canCompleteQuest.objective.description}
                                            </p>
                                            <p className="text-xs text-slate-400 mb-3">
                                                From quest: "{canCompleteQuest.quest.title}"
                                            </p>
                                            
                                            {canCompleteQuest.objective.type === 'deliver_item' ? (
                                                <button
                                                    onClick={() => {
                                                        const result = questCompletionService.completeObjective(
                                                            canCompleteQuest.quest,
                                                            canCompleteQuest.objective,
                                                            playerCharacter
                                                        );
                                                        
                                                        if (result.success) {
                                                            showToast(result.message);
                                                            
                                                            // Add completion dialogue to history
                                                            setHistory(prev => [...prev, {
                                                                speaker: 'npc',
                                                                text: "Thank you! This is exactly what I needed. Here's your reward as promised.",
                                                                timestamp: new Date()
                                                            }]);
                                                            
                                                            // Clear quest completion if quest is done
                                                            if (result.questComplete) {
                                                                setCanCompleteQuest(null);
                                                            } else {
                                                                // Update to next objective
                                                                const nextObj = canCompleteQuest.quest.objectives[canCompleteQuest.quest.currentObjectiveIndex];
                                                                if (nextObj) {
                                                                    setCanCompleteQuest({
                                                                        quest: canCompleteQuest.quest,
                                                                        objective: nextObj
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <span>📦</span>
                                                    Deliver Package
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const result = questCompletionService.completeObjective(
                                                            canCompleteQuest.quest,
                                                            canCompleteQuest.objective,
                                                            playerCharacter
                                                        );
                                                        
                                                        if (result.success) {
                                                            showToast(result.message);
                                                            
                                                            // Add completion dialogue to history
                                                            setHistory(prev => [...prev, {
                                                                speaker: 'npc',
                                                                text: "Good, you made it here. Let me tell you what I need...",
                                                                timestamp: new Date()
                                                            }]);
                                                            
                                                            // Clear or update quest completion
                                                            if (result.questComplete) {
                                                                setCanCompleteQuest(null);
                                                            } else {
                                                                const nextObj = canCompleteQuest.quest.objectives[canCompleteQuest.quest.currentObjectiveIndex];
                                                                if (nextObj) {
                                                                    setCanCompleteQuest({
                                                                        quest: canCompleteQuest.quest,
                                                                        objective: nextObj
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                                >
                                                    Complete Objective
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                     )}
                     {activeTab === 'history' && isNpc(target) && (
                         <div className="space-y-3">
                             <h4 className="text-lg font-semibold text-amber-300">Conversation History</h4>
                             {(target.memory.conversationSummaries && target.memory.conversationSummaries.length > 0) ? (
                                 target.memory.conversationSummaries.map((summary, index) => (
                                    <div key={index} className="p-3 text-sm italic text-slate-400 border-l-2 border-amber-500/50 bg-slate-800/40 rounded-r-md">
                                        "{summary}"
                                    </div>
                                 ))
                             ) : (
                                <p className="text-slate-500 italic">You have no significant past conversations with {targetName}.</p>
                             )}
                         </div>
                     )}
                     {activeTab === 'household' && isNpc(target) && (
                         <NpcHouseholdPanel npc={target} />
                     )}
                     {activeTab === 'trade' && isNpc(target) && playerCharacter && (
                         <NpcTradeInterface
                             npc={target}
                             player={playerCharacter}
                             mapData={mapData}
                             onTrade={(traded) => {
                                 if (traded) {
                                     // Successful trade
                                     // Update NPC relationship after successful trade
                                     if (target.memory) {
                                         target.memory.opinionOfPlayer = Math.min(100, 
                                             (target.memory.opinionOfPlayer || 50) + 5
                                         );
                                     }
                                     setNegotiationResponse("Pleasure doing business with you!");
                                     setReputationChange(5);
                                     setTimeout(() => setReputationChange(null), 3000);
                                 } else {
                                     // Failed trade - open negotiation panel
                                     setShowNegotiationPanel(true);
                                     setNegotiationResponse("That offer is insulting! You'll need to do better than that.");
                                 }
                             }}
                             onClose={() => setActiveTab('dialogue')}
                             onUpdatePlayer={(updates) => {
                                 // Update player state
                                 if (updates.currency !== undefined) {
                                     playerCharacter.currency = updates.currency;
                                 }
                                 if (updates.inventory) {
                                     playerCharacter.inventory = updates.inventory;
                                 }
                             }}
                         />
                     )}
                     {activeTab === 'medical' && isNpc(target) && playerCharacter && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                Medical Treatment
                            </h4>
                            
                            {/* Check if NPC is a healer */}
                            {target.role && (target.role.toLowerCase().includes('healer') || 
                                           target.role.toLowerCase().includes('physician') || 
                                           target.role.toLowerCase().includes('apothecary')) ? (
                                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                                    <p className="text-green-300 text-sm mb-3">
                                        🏥 This {target.role.toLowerCase()} can provide medical treatment.
                                    </p>
                                    
                                    {/* Show player's current diseases */}
                                    {playerCharacter.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 ? (
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-semibold text-red-300">Your Current Ailments:</h5>
                                            {playerCharacter.health.currentDiseases.map((activeDisease, index) => {
                                                const availableTreatments = mapData ? diseaseService.getAvailableTreatments(
                                                    activeDisease.disease.type,
                                                    mapData.timeSlice ? 
                                                        (parseInt(mapData.timeSlice) < 500 ? 'ANCIENT' :
                                                         parseInt(mapData.timeSlice) < 1000 ? 'MEDIEVAL' :
                                                         parseInt(mapData.timeSlice) < 1500 ? 'EARLY_MODERN' :
                                                         parseInt(mapData.timeSlice) < 1800 ? 'INDUSTRIAL' : 'MODERN') : 'MEDIEVAL',
                                                    mapData.culturalZone || 'EUROPEAN'
                                                ) : [];
                                                
                                                return (
                                                    <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium flex items-center gap-1">
                                                                {activeDisease.disease.badgeIcon} {activeDisease.disease.name}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                activeDisease.stage === 'critical' ? 'bg-red-600 text-white' :
                                                                activeDisease.stage === 'symptomatic' ? 'bg-yellow-600 text-white' :
                                                                activeDisease.stage === 'recovering' ? 'bg-green-600 text-white' :
                                                                'bg-blue-600 text-white'
                                                            }`}>
                                                                {activeDisease.stage}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-300 mb-2">
                                                            Severity: {Math.round(activeDisease.severity * 100)}% • Days remaining: {activeDisease.daysRemaining}
                                                        </div>
                                                        
                                                        {availableTreatments.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <h6 className="text-xs font-semibold text-green-300">Available Treatments:</h6>
                                                                {availableTreatments.map((medicine, medIndex) => (
                                                                    <div key={medIndex} className="flex items-center justify-between bg-slate-900/50 rounded p-2">
                                                                        <div className="flex-1">
                                                                            <div className="text-xs text-white">{medicine.name}</div>
                                                                            <div className="text-xs text-slate-400">{medicine.description}</div>
                                                                            <div className="text-xs text-green-300">
                                                                                Effectiveness: {Math.round((medicine.effectiveness[activeDisease.disease.type] || 0) * 100)}%
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const result = diseaseService.applyTreatment(
                                                                                    playerCharacter,
                                                                                    activeDisease.disease.id,
                                                                                    medicine.id,
                                                                                    parseInt(mapData?.timeSlice || '1500')
                                                                                );
                                                                                console.log(result.message);
                                                                                // Force re-render by updating state
                                                                                setNegotiationResponse(result.message);
                                                                                setTimeout(() => setNegotiationResponse(''), 3000);
                                                                            }}
                                                                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                                                        >
                                                                            Apply (${medicine.cost})
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-red-300">No treatments available for this disease in this era/region.</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-green-300 text-sm">✅ You appear to be in good health.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                                    <p className="text-yellow-300 text-sm">
                                        ⚠️ This person is not a trained healer, but they might know folk remedies or can direct you to someone who can help.
                                    </p>
                                    
                                    {playerCharacter.health?.currentDiseases && playerCharacter.health.currentDiseases.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-slate-300 mb-2">Your current ailments:</p>
                                            {playerCharacter.health.currentDiseases.map((activeDisease, index) => (
                                                <div key={index} className="text-xs text-red-300 mb-1">
                                                    {activeDisease.disease.badgeIcon} {activeDisease.disease.name} ({activeDisease.stage})
                                                </div>
                                            ))}
                                            <p className="text-xs text-slate-400 mt-2 italic">
                                                "Perhaps you should seek a trained physician or healer..."
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Treatment feedback */}
                            {negotiationResponse && (
                                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                                    <p className="text-blue-300 text-sm">{negotiationResponse}</p>
                                </div>
                            )}
                        </div>
                     )}
                     
                     {/* Quest Tab Content */}
                     {activeTab === 'quest' && isNpc(target) && playerCharacter && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Available Work
                            </h4>
                            
                            {!hasCheckedForQuest ? (
                                <div className="text-center py-8">
                                    {/* Toggle between quest systems */}
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="text-xs text-slate-400">Historical</span>
                                        <button
                                            onClick={() => setUseHistoricalQuests(!useHistoricalQuests)}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                                useHistoricalQuests ? 'bg-amber-600' : 'bg-purple-600'
                                            }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                                useHistoricalQuests ? 'left-1' : 'left-7'
                                            }`} />
                                        </button>
                                        <span className="text-xs text-slate-400">AI Generated</span>
                                    </div>
                                    
                                    <button 
                                        onClick={async () => {
                                            setIsLoadingQuest(true);
                                            setHasCheckedForQuest(true);
                                            
                                            if (useHistoricalQuests) {
                                                // Use historical quest system
                                                const year = parseInt(mapData?.timeSlice || '1500');
                                                const era = year < -3000 ? HistoricalEra.PREHISTORY :
                                                           year < 500 ? HistoricalEra.ANTIQUITY :
                                                           year < 1400 ? HistoricalEra.MEDIEVAL :
                                                           year < 1800 ? HistoricalEra.RENAISSANCE_EARLY_MODERN :
                                                           year < 1950 ? HistoricalEra.INDUSTRIAL_ERA :
                                                           year < 2100 ? HistoricalEra.MODERN_ERA :
                                                           HistoricalEra.FUTURE_ERA;
                                                
                                                const culturalZone = (mapData?.culturalZone || 'EUROPEAN') as CulturalZone;
                                                const gameMode = 'exploration' as GameModeType; // Default for now
                                                
                                                const quest = questService.generateHistoricalQuest(
                                                    era,
                                                    culturalZone,
                                                    gameMode,
                                                    mapData!,
                                                    allNpcs,
                                                    { x: playerCharacter.x, y: playerCharacter.y },
                                                    target
                                                );
                                                
                                                if (quest) {
                                                    // Create a quest offer from the generated quest
                                                    const spatialDesc = quest.objectives[0]?.spatialDescription || 'a nearby location';
                                                    setQuestOffer({
                                                        hasQuest: true,
                                                        questTitle: quest.title,
                                                        questDescription: quest.description,
                                                        questType: quest.category,
                                                        questDialogue: `I need someone to help with a task. ${quest.description} The destination is ${spatialDesc}.`,
                                                        questReward: quest.rewards?.map(r => r.description).join(', '),
                                                        urgency: 'medium',
                                                        _generatedQuest: quest // Store the quest for later
                                                    });
                                                } else {
                                                    setQuestOffer({
                                                        hasQuest: false,
                                                        questDialogue: "I don't have any work for you right now."
                                                    });
                                                }
                                            } else {
                                                // Use LLM system
                                                const nearbyStructures: any[] = [];
                                                const questData = await generateNpcQuestOffer(target, {
                                                    playerCharacter,
                                                    mapData: mapData!,
                                                    nearbyStructures,
                                                    gameDate: { year: parseInt(mapData?.timeSlice || '1500'), month: 6, day: 15 },
                                                    playerReputation: playerCharacter.mapReputation || 50
                                                });
                                                setQuestOffer(questData);
                                            }
                                            
                                            setIsLoadingQuest(false);
                                        }}
                                        disabled={isLoadingQuest}
                                        className={`${
                                            useHistoricalQuests 
                                                ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800' 
                                                : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800'
                                        } text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto`}
                                    >
                                        {isLoadingQuest ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                {useHistoricalQuests ? 'Generating...' : 'Thinking...'}
                                            </>
                                        ) : (
                                            <>
                                                {useHistoricalQuests ? (
                                                    <Target className="w-4 h-4" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                                Ask for Work
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {useHistoricalQuests 
                                            ? `Get a historically accurate ${mapData?.culturalZone || 'period'} quest.`
                                            : `See if ${target.name} has any unique tasks or problems.`
                                        }
                                    </p>
                                </div>
                            ) : questOffer === null && isLoadingQuest ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-purple-300">Generating quest offer...</p>
                                </div>
                            ) : questOffer ? (
                                <div className="space-y-4">
                                    {questOffer.hasQuest ? (
                                        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h5 className="text-white font-semibold text-lg">{questOffer.questTitle}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            questOffer.urgency === 'high' ? 'bg-red-600 text-white' :
                                                            questOffer.urgency === 'medium' ? 'bg-yellow-600 text-white' :
                                                            'bg-green-600 text-white'
                                                        }`}>
                                                            {questOffer.urgency} priority
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                                                            {questOffer.questType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                                                    "{questOffer.questDialogue}"
                                                </p>
                                                
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <h6 className="text-sm font-semibold text-amber-300 mb-2">Quest Details:</h6>
                                                    <p className="text-sm text-slate-300 mb-2">{questOffer.questDescription}</p>
                                                    
                                                    {questOffer.questReward && (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <span className="text-xs text-amber-400 font-semibold">Reward:</span>
                                                            <span className="text-xs text-white">{questOffer.questReward}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        // Check if we already have a generated quest (historical system)
                                                        if ((questOffer as any)._generatedQuest) {
                                                            const quest = (questOffer as any)._generatedQuest as Quest;
                                                            // Quest is already created and added to service
                                                            // Just need to add quest items if needed
                                                            if (quest.objectives[0]?.targetItem) {
                                                                questCompletionService.addQuestItem(
                                                                    playerCharacter,
                                                                    quest.title,
                                                                    quest.objectives[0].targetItem
                                                                );
                                                            }
                                                            setQuestOffer(null);
                                                            setHasCheckedForQuest(false);
                                                            return;
                                                        }
                                                        
                                                        // Original LLM quest acceptance logic
                                                        const questDesc = questOffer.questDescription || questOffer.questDialogue || '';
                                                        let targetNpc = null;
                                                        let targetLocation = null;
                                                        
                                                        // Look for delivery quests and find/create target NPC
                                                        if (questOffer.questType === 'delivery' && questDesc.toLowerCase().includes('sister')) {
                                                            const result = questCompletionService.findOrCreateQuestNPC(
                                                                target,
                                                                'sister',
                                                                allNpcs,
                                                                mapData!
                                                            );
                                                            if (result) {
                                                                targetNpc = result.npc;
                                                                targetLocation = result.location;
                                                            }
                                                        } else if (questOffer.questType === 'delivery') {
                                                            // Find any other NPC for generic deliveries
                                                            const otherNpc = allNpcs.find(npc => 
                                                                npc.id !== target.id && 
                                                                (npc.x !== target.x || npc.y !== target.y)
                                                            );
                                                            if (otherNpc) {
                                                                targetNpc = otherNpc;
                                                                targetLocation = { x: otherNpc.x, y: otherNpc.y };
                                                            }
                                                        }
                                                        
                                                        // If no target found, use nearest structure
                                                        if (!targetLocation && mapData?.terrainStructures) {
                                                            const nearestStructure = mapData.terrainStructures
                                                                .filter(s => s.x !== undefined && s.y !== undefined)
                                                                .sort((a, b) => {
                                                                    const distA = Math.sqrt(Math.pow(a.x! - target.x, 2) + Math.pow(a.y! - target.y, 2));
                                                                    const distB = Math.sqrt(Math.pow(b.x! - target.x, 2) + Math.pow(b.y! - target.y, 2));
                                                                    return distA - distB;
                                                                })[1]; // Get second nearest (first is likely where quest giver is)
                                                            
                                                            if (nearestStructure) {
                                                                targetLocation = { x: nearestStructure.x!, y: nearestStructure.y! };
                                                            }
                                                        }
                                                        
                                                        // Create quest with proper target location
                                                        const newQuest: Quest = {
                                                            id: `llm-quest-${Date.now()}`,
                                                            title: questOffer.questTitle || 'Untitled Task',
                                                            description: questOffer.questDescription || questOffer.questDialogue || 'A task for you to complete.',
                                                            category: questOffer.questType === 'delivery' ? 'trade' : 
                                                                     questOffer.questType === 'gathering' ? 'survival' :
                                                                     questOffer.questType === 'investigation' ? 'exploration' :
                                                                     questOffer.questType === 'protection' ? 'survival' :
                                                                     questOffer.questType === 'trade' ? 'trade' :
                                                                     questOffer.questType === 'social' ? 'social' : 'main',
                                                            objectives: [{
                                                                id: `obj-${Date.now()}`,
                                                                type: questOffer.questType === 'delivery' ? 'deliver_item' :
                                                                      questOffer.questType === 'gathering' ? 'collect_item' :
                                                                      questOffer.questType === 'social' ? 'talk_to_npc' : 'visit_location',
                                                                description: targetNpc ? 
                                                                    `Deliver the package to ${targetNpc.name} at (${targetLocation?.x}, ${targetLocation?.y})` :
                                                                    questOffer.questDescription || 'Complete the requested task',
                                                                completed: false,
                                                                targetLocation: targetLocation || { x: target.x + 10, y: target.y },
                                                                targetNPC: targetNpc?.name
                                                            }],
                                                            currentObjectiveIndex: 0,
                                                            rewards: questOffer.questReward ? [{
                                                                type: 'currency',
                                                                amount: 50,
                                                                description: questOffer.questReward
                                                            }] : [],
                                                            giver: isNpc(target) ? target.name : 'Unknown',
                                                            status: 'active',
                                                            createdTime: Date.now(),
                                                            historicalContext: `Quest from ${isNpc(target) ? target.name : 'NPC'} in ${mapData?.localArea || 'the local area'} during ${mapData?.timeSlice || 'ancient times'}.`,
                                                            isLLMGenerated: true
                                                        };
                                                        
                                                        // Add quest item to inventory for delivery quests
                                                        if (questOffer.questType === 'delivery') {
                                                            const questItem = questCompletionService.addQuestItem(
                                                                playerCharacter,
                                                                newQuest.title,
                                                                'package'
                                                            );
                                                            showToast(`Received quest item: ${questItem.name}`);
                                                        }
                                                        
                                                        // Add quest to the service
                                                        questService.addQuest(newQuest);
                                                        
                                                        // Show success message and close quest interface
                                                        showToast(`Quest "${newQuest.title}" accepted! Check your Quests panel to track progress.`);
                                                        setQuestOffer(null);
                                                        setHasCheckedForQuest(false);
                                                    }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold transition-colors"
                                                >
                                                    Accept Quest
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setQuestOffer(null);
                                                        setHasCheckedForQuest(false);
                                                    }}
                                                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded font-semibold transition-colors"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                                            <p className="text-slate-300 mb-2">"{questOffer.questDialogue}"</p>
                                            <p className="text-xs text-slate-400">
                                                {target.name} doesn't have any work available right now.
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    setQuestOffer(null);
                                                    setHasCheckedForQuest(false);
                                                }}
                                                className="mt-3 bg-slate-600 hover:bg-slate-700 text-white py-1 px-3 rounded text-sm transition-colors"
                                            >
                                                Ask Again Later
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                    <p className="text-slate-300">No quest information available.</p>
                                </div>
                            )}
                        </div>
                     )}
                </main>

                {isNpc(target) && activeTab === 'dialogue' && (
                     <div className="flex gap-2 mb-4 flex-shrink-0">
                        <input 
                          type="text" 
                          placeholder={isLoading ? "..." : "Say something..."} 
                          value={playerInput} 
                          onChange={(e) => setPlayerInput(e.target.value)} 
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                          disabled={isLoading}
                          className="flex-1 px-4 py-3 text-base text-white placeholder-gray-400 transition-all duration-150 bg-slate-800/80 border-2 border-slate-600/60 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-slate-700/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button 
                          onClick={handleSend} 
                          disabled={isLoading || !playerInput.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white transition-all duration-150 bg-amber-600 rounded-lg hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                    </div>
                )}

                {/* Quest Hints Section - Contextually Dependent */}
                {(() => {
                    const activeQuests = questService.getActiveQuests();
                    const relevantQuests = activeQuests.filter(quest => {
                        // Check if this NPC or location is relevant to any quest
                        if (isNpc(target)) {
                            const npcName = target.name.toLowerCase();
                            const npcRole = target.role?.toLowerCase() || '';
                            
                            return quest.objectives.some(obj => {
                                if (obj.description.toLowerCase().includes(npcName)) return true;
                                if (obj.description.toLowerCase().includes(npcRole)) return true;
                                if (obj.type === 'talk_to_npc' && !obj.completed) return true;
                                if (obj.type === 'deliver_item' && npcRole.includes('merchant')) return true;
                                return false;
                            });
                        } else {
                            // For animals, check if they're relevant to hunting quests
                            const animalType = target.behavior?.toLowerCase() || '';
                            return quest.objectives.some(obj => {
                                if (obj.type === 'collect_item' && animalType) return true;
                                if (obj.description.toLowerCase().includes('hunt')) return true;
                                if (obj.description.toLowerCase().includes('animal')) return true;
                                return false;
                            });
                        }
                    });

                    // Generate contextual hints based on entity type and quests
                    const generateHints = () => {
                        const hints = [];
                        
                        if (isNpc(target)) {
                            // NPC-specific hints
                            if (target.role?.includes('merchant') || target.role?.includes('trader')) {
                                hints.push({ icon: '💰', text: 'This merchant might have valuable items for trade' });
                            }
                            if (target.role?.includes('scholar') || target.role?.includes('sage')) {
                                hints.push({ icon: '📚', text: 'Scholars often know about local history and secrets' });
                            }
                            if (target.role?.includes('guard') || target.role?.includes('soldier')) {
                                hints.push({ icon: '⚔️', text: 'Guards might have information about local threats' });
                            }
                            if (target.specialKnowledge) {
                                hints.push({ icon: '✨', text: 'This person seems to have special knowledge' });
                            }
                        } else {
                            // Animal-specific hints
                            if (target.behavior === 'aggressive') {
                                hints.push({ icon: '⚠️', text: 'This creature is dangerous - prepare for combat' });
                            }
                            if (target.behavior === 'peaceful') {
                                hints.push({ icon: '🕊️', text: 'This animal seems peaceful and might be tameable' });
                            }
                            if (target.species?.includes('rare')) {
                                hints.push({ icon: '💎', text: 'Rare creatures often drop valuable materials' });
                            }
                        }
                        
                        return hints;
                    };

                    const hints = generateHints();
                    const hasContent = relevantQuests.length > 0 || hints.length > 0;

                    if (!hasContent) return null;

                    return (
                        <div className="mb-3 p-3 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-lg border border-slate-700/50">
                            {relevantQuests.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Related Quests
                                    </h4>
                                    <div className="space-y-1">
                                        {relevantQuests.slice(0, 2).map(quest => (
                                            <div key={quest.id} className="text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1 flex items-start gap-1">
                                                <MapPin className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <span className="font-medium text-white">{quest.title}:</span>
                                                    {' '}
                                                    {quest.objectives.find(o => !o.completed)?.description || 'Quest in progress'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {hints.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Hints & Tips
                                    </h4>
                                    <div className="space-y-1">
                                        {hints.map((hint, index) => (
                                            <div key={index} className="text-xs text-slate-400 flex items-center gap-2">
                                                <span className="text-sm">{hint.icon}</span>
                                                <span>{hint.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isNpc(target) && playerCharacter && (
                                <div className="mt-2 pt-2 border-t border-slate-700/50">
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        <span>
                                            Reputation: {playerCharacter.mapReputation || 0} | 
                                            {playerCharacter.mapReputation >= 50 ? ' Friendly' : 
                                             playerCharacter.mapReputation >= 0 ? ' Neutral' : ' Hostile'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <footer className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
                    <button onClick={() => onOpenInfo(target)} className="ff-action-button">Profile</button>
                    {isNpc(target) ? (
                        <button 
                            onClick={() => setActiveTab('trade')} 
                            className="ff-action-button"
                        >
                            Trade
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                setShowTamingInterface(true);
                                setTamingResult(null);
                            }} 
                            className="ff-action-button flex items-center justify-center gap-1"
                        >
                            <Heart className="w-4 h-4" />
                            Tame
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            // Apply reputation penalty for attacking
                            if (isNpc(target) && playerCharacter) {
                                const attackPenalty = -30; // Less than threats but still significant
                                setReputationChange(attackPenalty);
                                if (playerCharacter.mapReputation !== undefined) {
                                    const oldReputation = playerCharacter.mapReputation || 50;
                                    const newReputation = Math.max(0, oldReputation + attackPenalty);
                                    playerCharacter.mapReputation = newReputation;
                                    console.log(`[REPUTATION] Attack initiated! -30 reputation for unprovoked violence`);
                                    
                                    // Show warning
                                    setTimeout(() => setReputationChange(null), 4000);
                                    
                                    // Check if this drops reputation to zero
                                    if (newReputation <= 0) {
                                        setTimeout(() => {
                                            onClose(history);
                                            triggerArrestScenario();
                                        }, 2000);
                                        return; // Don't initiate combat if arrested
                                    }
                                }
                            }
                            onInitiateCombat(target);
                        }} 
                        className="ff-action-button"
                    >
                        Attack
                    </button>
                    <button onClick={handleClose} className="ff-action-button" disabled={npcWantsToLeave}>
                        {npcWantsToLeave ? 'Leaving...' : 'Leave'}
                    </button>
                </footer>
                </div>
                
                {/* Reputation change indicator */}
                {reputationChange !== null && (
                    <div className={`absolute top-20 right-8 animate-in fade-in slide-in-from-right duration-300 ${
                        Math.abs(reputationChange) >= 50 ? 'scale-125' : ''
                    }`}>
                        <div className={`px-3 py-2 rounded-lg font-bold shadow-lg ${
                            reputationChange > 0 
                                ? 'bg-green-900/80 text-green-300 border border-green-500/50' 
                                : Math.abs(reputationChange) >= 50
                                    ? 'bg-red-900/90 text-red-300 border-2 border-red-500 animate-pulse'
                                    : 'bg-red-900/80 text-red-300 border border-red-500/50'
                        }`}>
                            <div className="flex items-center gap-2">
                                {Math.abs(reputationChange) >= 50 && (
                                    <AlertTriangle className="w-4 h-4" />
                                )}
                                <span className="text-lg">
                                    {reputationChange > 0 ? '+' : ''}{reputationChange}
                                </span>
                                <span className="text-sm opacity-90">reputation</span>
                            </div>
                            {Math.abs(reputationChange) >= 100 && (
                                <div className="text-xs mt-1 opacity-80">
                                    Authorities alerted!
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Trade Negotiation Panel */}
                {showNegotiationPanel && (
                    <div className="w-80 flex flex-col bg-slate-800/50 rounded-lg border border-slate-600/50 p-4">
                        <h3 className="text-lg font-semibold text-amber-400 mb-3">Negotiation</h3>
                        <div className="flex-1 overflow-y-auto mb-3">
                            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                <strong className="block mb-2 text-sm text-white">{targetName}:</strong>
                                <p className="text-sm text-slate-200">{negotiationResponse || "Make me an offer..."}</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Convince them..."
                            className="px-3 py-2 mb-2 text-sm bg-slate-700/50 border border-slate-600 rounded focus:outline-none focus:border-blue-400"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    // Handle negotiation
                                    setNegotiationResponse("Hmm, let me think about that...");
                                }
                            }}
                        />
                        <button
                            onClick={() => setShowNegotiationPanel(false)}
                            className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                        >
                            Close Negotiation
                        </button>
                    </div>
                )}
                
                {/* Taming Interface Panel */}
                {showTamingInterface && !isNpc(target) && (
                    <div className="w-80 flex flex-col bg-slate-800/50 rounded-lg border border-slate-600/50 p-4">
                        <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                            <Heart className="w-5 h-5" />
                            Taming {targetName}
                        </h3>
                        
                        {/* Ownership warning */}
                        {isTheft && animalOwner && (
                            <div className="mb-3 p-2 bg-red-900/30 border border-red-600/50 rounded">
                                <p className="text-xs text-red-300 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    Warning: This {target.speciesName} belongs to {animalOwner.name}!
                                </p>
                                <p className="text-xs text-red-200 mt-1">
                                    Stealing it will severely damage your reputation (-30 points)
                                </p>
                            </div>
                        )}
                        
                        {/* Animal value info */}
                        <div className="mb-3 p-2 bg-slate-900/50 rounded">
                            <p className="text-xs text-slate-300">
                                Estimated Value: {calculateAnimalValue(target, playerCharacter?.year || 1500)} coins
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {tamingAttempts === 0 ? 
                                    'Approach carefully - your method matters!' :
                                    'The animal seems interested... try again!'}
                            </p>
                        </div>
                        
                        {/* Taming result message */}
                        {tamingResult && (
                            <div className={`mb-3 p-3 rounded-lg border ${
                                tamingResult.includes('Success') ? 
                                    'bg-green-900/30 border-green-600/50 text-green-200' :
                                tamingResult.includes('cautiously') ?
                                    'bg-yellow-900/30 border-yellow-600/50 text-yellow-200' :
                                    'bg-red-900/30 border-red-600/50 text-red-200'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap">{tamingResult}</p>
                            </div>
                        )}
                        
                        {/* Approach input */}
                        <div className="flex-1">
                            <label className="block text-xs text-slate-400 mb-1">
                                Describe your approach:
                            </label>
                            <textarea
                                value={tamingApproach}
                                onChange={(e) => setTamingApproach(e.target.value)}
                                placeholder="e.g., 'I slowly approach with an outstretched hand, offering fresh grass...'"
                                className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded 
                                         focus:outline-none focus:border-green-400 resize-none"
                                rows={3}
                                disabled={tamingInProgress}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleTamingAttempt();
                                    }
                                }}
                            />
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleTamingAttempt}
                                disabled={!tamingApproach.trim() || tamingInProgress}
                                className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-slate-600 
                                         disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-1"
                            >
                                {tamingInProgress ? 'Attempting...' : 
                                 tamingAttempts > 0 ? 'Try Again' : 'Attempt Taming'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowTamingInterface(false);
                                    setTamingResult(null);
                                    setTamingApproach('');
                                }}
                                className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Internal Monologue Slide-out Panel */}
            <div className={`absolute top-0 right-0 h-full bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900/80 border-l border-slate-600/50 shadow-2xl transition-all duration-500 ${showMonologue ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} overflow-hidden`}>
                <div className="p-4 h-full flex flex-col">
                    {/* Close button */}
                    <button 
                        onClick={() => setShowMonologue(false)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white text-xl"
                    >
                        ×
                    </button>
                    
                    {/* Monologue header */}
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-amber-400 mb-1">Inner Thoughts</h3>
                        <p className="text-sm text-slate-400">
                            Click {3 - monologueClickCount} more time{3 - monologueClickCount !== 1 ? 's' : ''} for deeper thoughts
                        </p>
                    </div>
                    
                    {/* Portrait */}
                    <div className="mb-4 flex justify-center">
                        {isNpc(target) ? (
                            <div className="w-100 h-100 rounded-lg overflow-hidden border-2 border-amber-500/50 shadow-lg">
                                <ProceduralPortrait 
                                    character={target as any} 
                                    size={100}
                                    temporaryExpression={portraitExpr}
                                    onExpressionComplete={clearPortrait}
                                />
                            </div>
                        ) : (
                            <div className="text-7xl">{target.emoji}</div>
                        )}
                    </div>
                    
                    {/* Monologue text with typewriter effect */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingMonologue ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
                            </div>
                        ) : (
                            <div className="text-lg italic text-slate-200 leading-loose font-serif">
                                <TypewriterText 
                                    text={monologueText} 
                                    speed={30}
                                    wordMode={true}
                                    showCursor={true}
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Contrast indicator */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 italic">
                            {isNpc(target) ? 
                                "What they say and what they think are often very different..." :
                                "Animals perceive the world in ways we can only imagine..."
                            }
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Disease Contracted Modal */}
            {showDiseaseModal && contractedDisease && playerCharacter && (
                <DiseaseContractedModal
                    isOpen={showDiseaseModal}
                    onClose={() => setShowDiseaseModal(false)}
                    disease={contractedDisease}
                    playerCharacter={playerCharacter}
                />
            )}
        </div>
    );
};

export default EncounterModal;