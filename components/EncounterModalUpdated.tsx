/**
 * components/EncounterModalUpdated.tsx - Updated UI design for entity encounters
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EncounterableEntity, NpcEntity, DialogueEntry, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue, attemptTheft, handleTheftResponse, TheftAttempt } from '../services/encounterService';
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
import { Sparkles, Target, MapPin, Info, AlertTriangle, Heart, Clock, Send, User, Home, ShoppingBag, ScrollText } from 'lucide-react';
import NpcQuestPanel from './NpcQuestPanel';
import NpcMedicalPanel from './NpcMedicalPanel';
import NpcHouseholdPanel from './NpcHouseholdPanel';
import DiseaseContractedModal from './DiseaseContractedModal';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { getAnimalTexts } from '../constants/gameData/animalTexts';
import { useGame } from '../contexts/GameContext';
import { npcPersistenceService } from '../services/npcPersistenceService';
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
import { usePortraitExpression, mapRepDeltaToExpr, mapEventToExpr, mapPersonalityToExpr } from '../hooks/usePortraitExpression';
import { diseaseService } from '../services/diseaseService';
import { crisisDetectionService } from '../services/crisisDetectionService';
import gameSounds from '../services/gameSoundsService';
import { HighlightedText } from '../hooks/usePrimarySourceKeywords';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString } from '../utils/dateUtils';
import { calculateDiseaseGameplayRestrictions } from '../services/diseaseProgressionService';
import { generateSourceDiscussion, createSubmittedSource, createSourceDiscussion } from '../services/sourceDiscussionService';
import { SubmittedSource, SourceDiscussion } from '../types/primarySource';
import { FileText, Book } from 'lucide-react';
import { addDiscussionToHistory } from '../services/sourceDiscussionPersistence';
import { isSafari } from '../utils/safariUtils';
import { useNpcHelperMode } from './NpcHelperModeHandler';
import { initiateHelperMode } from '../services/npcHelperService';

// Styles for animations
const styles = `
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 3s ease-in-out infinite;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.dialogue-entry {
  animation: slide-up 0.3s ease-out;
}

@keyframes unlock-puff {
  0% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2) rotate(180deg);
    filter: blur(2px);
  }
  100% {
    opacity: 0;
    transform: scale(0.3) rotate(360deg);
    filter: blur(8px);
  }
}

@keyframes amber-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(251, 191, 36, 0.6);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
  }
}

.unlock-animation {
  animation: unlock-puff 0.6s ease-out forwards;
}

.amber-glow-animation {
  animation: amber-glow 1s ease-out;
}

/* Custom scrollbar */
.conversation-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.conversation-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 4px;
}

.conversation-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.8);
  border-radius: 4px;
}

.conversation-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.8);
}

/* Loading dots animation */
@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.loading-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #64748b;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0;
}

/* Micro-interactions */
.hover-lift {
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.input-glow:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`;

function isNpc(target: EncounterableEntity): target is NpcEntity {
    return 'role' in target;
}

// Helper function to get historical language for the target
function getHistoricalLanguage(target: EncounterableEntity, mapData: MapData | null): string {
    if (!isNpc(target) || !mapData) return 'Historical Language';

    try {
        const year = parseInt(mapData.timeSlice || '1500');
        const language = getLanguageForCharacter(
            target.culturalZone || mapData.culturalZone || 'EUROPEAN',
            year,
            mapData.region,
            mapData.localArea,
            target.name,  // Pass NPC's name for name-based detection
            target.profession  // Pass profession for clergy/scholar detection
        );

        return language?.name || 'Historical Language';
    } catch (error) {
        console.warn('Error getting historical language:', error);
        return 'Historical Language';
    }
}

interface EncounterModalProps {
  target: EncounterableEntity;
  playerCharacter: PlayerCharacter;
  allNpcs: NpcEntity[];
  mapData: MapData | null;
  onClose: (history: DialogueEntry[]) => void;
  onInitiateCombat: (target: EncounterableEntity) => void;
  onOpenInfo: (target: EncounterableEntity) => void;
  onUpdateNpc?: (updatedNpc: NpcEntity) => void;
}

const EncounterModalUpdated: React.FC<EncounterModalProps> = ({
    target,
    playerCharacter,
    allNpcs,
    mapData,
    onClose,
    onInitiateCombat,
    onOpenInfo,
    onUpdateNpc
}) => {
    const { showToast, setCurrentEvent, setSelectedPrimarySource } = useUI();
    const { worldData } = useMap();
    const { gameDate, currentZone, currentRegion } = useGame();

    // Get the most up-to-date NPC from allNpcs (in case memory was updated)
    const currentTarget = isNpc(target)
        ? allNpcs.find(npc => npc.id === target.id) || target
        : target;

    // Portrait expression management
    const { expr: portraitExpr, flash: flashPortrait, clear: clearPortrait } = usePortraitExpression();
    
    const [history, setHistory] = useState<DialogueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [playerInput, setPlayerInput] = useState('');
    const [activeTab, setActiveTab] = useState<'dialogue' | 'history' | 'trade' | 'taming' | 'medical' | 'household' | 'quest' | 'source'>('dialogue');
    const [useRealLanguage, setUseRealLanguage] = useState(false);
    const [reputationChange, setReputationChange] = useState<number | null>(null);
    const [npcWantsToLeave, setNpcWantsToLeave] = useState(false);

    // Trade availability state
    const [tradeEnabled, setTradeEnabled] = useState(false);
    const [tradeStatusMessage, setTradeStatusMessage] = useState<string | null>(null);
    const [showTradeUnlockAnimation, setShowTradeUnlockAnimation] = useState(false);
    
    // Taming states
    const [tamingApproach, setTamingApproach] = useState('');
    const [tamingInProgress, setTamingInProgress] = useState(false);
    const [tamingAttempts, setTamingAttempts] = useState(0);
    const [tamingResult, setTamingResult] = useState<string | null>(null);
    const [animalOwner, setAnimalOwner] = useState<NpcEntity | null>(null);
    
    // Quest states
    const [questOffer, setQuestOffer] = useState<any>(null);
    const [hasCheckedForQuest, setHasCheckedForQuest] = useState(false);
    const [isLoadingQuest, setIsLoadingQuest] = useState(false);
    const [canCompleteQuest, setCanCompleteQuest] = useState<{ quest: Quest; objective: any } | null>(null);
    
    // Internal monologue states
    const [showMonologue, setShowMonologue] = useState(false);
    const [monologueText, setMonologueText] = useState('');
    const [monologueClickCount, setMonologueClickCount] = useState(0);
    const [isLoadingMonologue, setIsLoadingMonologue] = useState(false);
    const monologueCache = useRef<Map<number, string>>(new Map());

    // Source submission states
    const [sourceTitle, setSourceTitle] = useState('');
    const [sourceContent, setSourceContent] = useState('');
    const [sourceNotes, setSourceNotes] = useState('');
    const [sourceDiscussionResult, setSourceDiscussionResult] = useState<string | null>(null);
    const [isSubmittingSource, setIsSubmittingSource] = useState(false);
    const [sourceType, setSourceType] = useState<'text' | 'journal'>('text');
    const [selectedJournalEntry, setSelectedJournalEntry] = useState<string | null>(null);
    const [availableJournalEntries, setAvailableJournalEntries] = useState<any[]>([]);
    const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
    
    // Load journal entries from localStorage on mount
    useEffect(() => {
        const storedEntries = localStorage.getItem('journalEntries');
        if (storedEntries) {
            try {
                const entries = JSON.parse(storedEntries);
                setAvailableJournalEntries(entries);
            } catch (error) {
                console.error('Failed to load journal entries:', error);
            }
        }
    }, []);

    // Derive current era and cultural zone for keyword highlighting
    const currentEra = useMemo(() => {
        const dateInfo = parseDateString(String(gameDate.year));
        return dateInfo.era;
    }, [gameDate.year]);
    
    const culturalZone = useMemo(() => {
        return mapLocationToCulture(currentZone || 'Europe', gameDate.year) as CulturalZone;
    }, [currentZone, gameDate.year]);
    
    const hasFetchedInitialDialogue = useRef(false);
    const targetName = isNpc(target) ? (target.name || 'Unknown NPC') : (target.speciesName || 'Unknown Creature');
    
    // Taming handler
    const handleTame = async () => {
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
                const tamedAnimal = createTamedAnimal(target, playerCharacter);
                addToParty(tamedAnimal);
                
                // Check if this was theft
                const isTheft = animalOwner !== null;
                if (isTheft) {
                    // Apply reputation penalty
                    eventService.updateReputation(-30);
                    showToast(`You stole ${animalOwner?.name}'s ${target.speciesName}! Your reputation suffers greatly.`, 'error');
                } else {
                    showToast(`${targetName} has joined your party!`, 'success');
                }
                
                setTamingResult(`Success! ${targetName} now trusts you and will follow you on your journey.`);
                
                // Close modal after short delay
                setTimeout(() => {
                    onClose(history);
                }, 2000);
            } else if (result.success === 'partial') {
                setTamingResult(result.message || 'The animal seems interested but needs more convincing...');
                setTamingApproach('');
            } else {
                setTamingResult(result.message || 'The animal fled!');
                // Close modal if animal fled
                if (result.message?.includes('fled')) {
                    setTimeout(() => {
                        onClose(history);
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Taming error:', error);
            setTamingResult('Something went wrong with the taming attempt.');
        } finally {
            setTamingInProgress(false);
        }
    };
    
    // Get active quests
    const activeQuests = questService.getActiveQuests();
    const relevantQuests = activeQuests.filter(quest => {
        if (isNpc(target)) {
            const npcName = target.name.toLowerCase();
            return quest.objectives.some(obj =>
                obj.description.toLowerCase().includes(npcName)
            );
        }
        return false;
    });

    // Initialize helper mode hooks
    const { initiateFollowMe, initiateGiftGiving } = useNpcHelperMode();
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            
            if (e.key === 'Escape') {
                onClose(history);
            } else if (e.key === 'p' || e.key === 'P') {
                e.stopPropagation();
                onOpenInfo(target);
            } else if (e.key === 't' || e.key === 'T') {
                setActiveTab(isNpc(target) ? 'trade' : 'taming');
            } else if (e.key === 'a' || e.key === 'A') {
                onInitiateCombat(target);
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [history, onClose, onInitiateCombat, onOpenInfo, target]);
    
    // Fetch initial dialogue on mount
    useEffect(() => {
        if (!playerCharacter) return;
        if (!hasFetchedInitialDialogue.current) {
            hasFetchedInitialDialogue.current = true;
            setIsLoading(true);
            
            if (isNpc(target)) {
                // Generate appropriate greeting based on whether NPC knows the player
                const hasMetBefore = currentTarget.memory?.conversationSummaries && currentTarget.memory.conversationSummaries.length > 0;
                const greeting = hasMetBefore ? "I approach again." : "Hello.";
                
                generateEncounterDialogue(currentTarget, currentTarget.memory?.conversationSummaries || [], greeting, playerCharacter, allNpcs, mapData, useRealLanguage)
                    .then(response => {
                        const initialEntry: DialogueEntry = {
                            speaker: 'npc',
                            text: response.text,
                            timestamp: new Date()
                        };
                        setHistory([initialEntry]);

                        // Check initial trade availability
                        if (response.tradeAvailable !== undefined) {
                            setTradeEnabled(response.tradeAvailable);
                            if (response.tradeAvailable) {
                                console.log(`[Trade] ${target.name} is willing to trade from the start`);
                            }
                        }

                        setIsLoading(false);
                    })
                    .catch(err => {
                        console.error("Failed to get initial dialogue:", err);
                        const fallbackText = `${targetName} watches you silently.`;
                        setHistory([{ 
                            speaker: 'npc', 
                            text: fallbackText, 
                            timestamp: new Date() 
                        }]);
                        setIsLoading(false);
                    });
            } else {
                // Animal encounter
                const animalTexts = getAnimalTexts(targetName || 'creature');
                const fallbackText = animalTexts.encounterText;
                setHistory([{ 
                    speaker: 'npc', 
                    text: fallbackText, 
                    timestamp: new Date() 
                }]);
                setIsLoading(false);
            }
        }
    }, [target, playerCharacter, allNpcs, mapData, useRealLanguage]);
    
    // Play animal sound when modal opens for animals
    useEffect(() => {
        // Check if target is an animal (has speciesName property)
        if ((target as any).speciesName) {
            const species = (target as any).speciesName?.toUpperCase();
            
            // Play appropriate animal sound based on species
            switch(species) {
                case 'SHEEP':
                case 'GOAT':
                    gameSounds.playSheepSound();
                    break;
                case 'COW':
                case 'MULE':
                case 'WATER_BUFFALO':
                case 'YAK':
                case 'GAUR':
                    gameSounds.playCowSound();
                    break;
                case 'HORSE':
                case 'WILD_HORSE':
                case 'DONKEY':
                    gameSounds.playHorseSound();
                    break;
                case 'DOG':
                    gameSounds.playDogSound();
                    break;
                case 'CAT':
                    gameSounds.playCatSound();
                    break;
                case 'PIG':
                case 'BOAR':
                case 'WARTHOG':
                case 'PECCARY':
                    gameSounds.playPigSound();
                    break;
                case 'CHICKEN':
                case 'TURKEY':
                    gameSounds.playBirdSound();
                    break;
                case 'DUCK':
                    gameSounds.playDuckSound();
                    break;
                case 'ROOSTER':
                    gameSounds.playRoosterSound();
                    break;
                case 'WOLF':
                case 'HYENA':
                    gameSounds.playWolfSound();
                    break;
                case 'BEAR':
                case 'PANDA':
                    gameSounds.playBearSound();
                    break;
                case 'TIGER':
                case 'LION':
                case 'LEOPARD':
                case 'CHEETAH':
                case 'JAGUAR':
                case 'PUMA':
                    gameSounds.playTigerSound();
                    break;
                case 'ELEPHANT':
                case 'HIPPOPOTAMUS':
                case 'RHINOCEROS':
                    gameSounds.playElephantSound();
                    break;
                case 'MONKEY':
                case 'GORILLA':
                case 'BABOON':
                case 'ORANGUTAN':
                    gameSounds.playMonkeySound();
                    break;
                case 'SNAKE':
                    gameSounds.playSnakeSound();
                    break;
                case 'CROCODILE':
                    gameSounds.playCrocodileSound();
                    break;
                case 'EAGLE':
                case 'PEACOCK':
                case 'PARROT':
                case 'FLAMINGO':
                    gameSounds.playEagleSound();
                    break;
                case 'OWL':
                    gameSounds.playOwlSound();
                    break;
                case 'FROG':
                    gameSounds.playFrogSound();
                    break;
                case 'CRICKET':
                    gameSounds.playCricketSound();
                    break;
                case 'FISH':
                case 'WHALE':
                case 'JELLYFISH':
                case 'LOBSTER':
                case 'OCTOPUS':
                    gameSounds.playFishSound();
                    break;
                case 'CAMEL':
                    gameSounds.playCamelSound();
                    break;
                case 'RABBIT':
                case 'HEDGEHOG':
                case 'SQUIRREL':
                    gameSounds.playRabbitSound();
                    break;
                case 'DEER':
                case 'MOOSE':
                case 'ELK':
                case 'CARIBOU':
                case 'LLAMA':
                case 'GIRAFFE':
                case 'ZEBRA':
                case 'KANGAROO':
                case 'ANTELOPE':
                case 'WILDEBEEST':
                case 'IBEX':
                    // Use dog sound as a placeholder for deer-like animals
                    gameSounds.playDogSound();
                    break;
            }
        }
    }, []); // Only run once when modal opens
    
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
    
    // Check for animal ownership
    useEffect(() => {
        if (!isNpc(target) && allNpcs) {
            const owner = checkAnimalOwnership(target, allNpcs);
            setAnimalOwner(owner);
        }
    }, [target, allNpcs]);
    
    // Handle portrait click for internal monologue
    const handlePortraitClick = async () => {
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
    };
    
    // Calculate time ago for messages
    const getTimeAgo = (timestamp: Date) => {
        const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 120) return '1 minute ago';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        return 'Earlier';
    };
    
    // Handle sending message
    const handleSend = async () => {
        if (!playerInput.trim() || isLoading || !playerCharacter || npcWantsToLeave) return;

        // Check for voice loss from disease
        const diseaseRestrictions = calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);
        let displayText = playerInput;
        let actualInput = playerInput;

        if (diseaseRestrictions.voiceLossLevel > 0) {
            // Apply voice loss restrictions to what the player actually says
            if (diseaseRestrictions.voiceLossLevel === 1) {
                // Weak voice - show in dialogue but modify what NPC hears
                displayText = `[Weakly] ${playerInput}`;
                actualInput = `[Speaking in a weak, barely audible voice] ${playerInput}`;
            } else if (diseaseRestrictions.voiceLossLevel === 2) {
                // Whispers only - severely limit what can be said
                const whisperText = playerInput.substring(0, Math.min(15, playerInput.length));
                displayText = `[Whispers] ${whisperText}${whisperText.length < playerInput.length ? '...' : ''}`;
                actualInput = `[Whispering very quietly] ${whisperText}`;
            } else if (diseaseRestrictions.voiceLossLevel >= 3) {
                // Complete voice loss - can only make gestures
                displayText = "[You try to speak but only manage incoherent whispers and gestures]";
                actualInput = "[The person is trying to communicate but appears to have lost their voice - they can only make gestures and very quiet sounds]";
            }
        }

        const newPlayerEntry: DialogueEntry = {
            speaker: 'player',
            text: displayText,
            timestamp: new Date()
        };
        const newHistory = [...history, newPlayerEntry];
        setHistory(newHistory);
        const currentInput = actualInput; // Use modified input for NPC response
        setPlayerInput('');
        setIsLoading(true);
        
        // Check for threatening language
        const threatWords = ['kill', 'murder', 'attack', 'hurt', 'harm', 'destroy', 'beat', 'strike', 'stab', 'slash'];
        const inputLower = currentInput.toLowerCase();
        const isThreatening = threatWords.some(word => inputLower.includes(word));
        
        if (isThreatening) {
            flashPortrait('scowl', 2200);
            const threatPenalty = -50;
            setReputationChange(threatPenalty);
            if (playerCharacter.mapReputation !== undefined) {
                const oldReputation = playerCharacter.mapReputation || 50;
                const newReputation = Math.max(0, oldReputation + threatPenalty);
                playerCharacter.mapReputation = newReputation;
                console.log(`[REPUTATION] Threat detected! -50 reputation for threatening language`);
            }
            setTimeout(() => setReputationChange(null), 5000);
        }
        
        try {
            const response = await generateEncounterDialogue(currentTarget, newHistory, currentInput, playerCharacter, allNpcs, mapData, useRealLanguage);
            const newNpcEntry: DialogueEntry = { 
                speaker: 'npc', 
                text: response.text, 
                timestamp: new Date() 
            };
            setHistory(prev => [...prev, newNpcEntry]);
            
            // Handle reputation changes from LLM response
            if (response.reputationChange && playerCharacter) {
                setReputationChange(response.reputationChange);
                const expr = mapRepDeltaToExpr(response.reputationChange);
                if (expr) flashPortrait(expr);
                
                const oldReputation = playerCharacter.mapReputation || 50;
                const newReputation = Math.max(0, Math.min(100, oldReputation + response.reputationChange));
                
                // Update player character reputation directly
                playerCharacter.mapReputation = newReputation;
                
                // Log significant reputation changes
                if (Math.abs(response.reputationChange) >= 50) {
                    console.log(`[REPUTATION] Major change: ${response.reputationChange}`);
                }
                
                // Show reputation change for longer if it's significant
                const displayDuration = Math.abs(response.reputationChange) >= 50 ? 5000 : 3000;
                setTimeout(() => setReputationChange(null), displayDuration);
                
                // Check if reputation has hit zero - trigger jail scenario
                if (newReputation <= 0 && response.shouldCallAuthorities) {
                    setTimeout(() => {
                        onClose(history);
                        // TODO: Trigger arrest scenario
                    }, 2000);
                }
            }
            
            // Handle NPC wanting to attack
            if (response.shouldAttack) {
                flashPortrait('scowl', 2000);
                setTimeout(() => {
                    onInitiateCombat(target);
                }, 1000);
            }
            
            // Handle NPC wanting to leave
            if (response.shouldLeave) {
                setNpcWantsToLeave(true);
                setTimeout(() => {
                    onClose(history);
                }, 2000);
            }
            
            // Handle trade availability from response
            if (response.tradeAvailable !== undefined) {
                const wasEnabled = tradeEnabled;
                setTradeEnabled(response.tradeAvailable);

                // Show notification when trade status changes
                if (!wasEnabled && response.tradeAvailable) {
                    setTradeStatusMessage(`${target.name} is now willing to trade with you!`);
                    showToast(`💰 ${target.name} is willing to trade!`, 'success');
                    setShowTradeUnlockAnimation(true);
                    // Animation will auto-clear after playing
                    setTimeout(() => setShowTradeUnlockAnimation(false), 1000);
                } else if (wasEnabled && !response.tradeAvailable) {
                    setTradeStatusMessage(response.tradeReason || `${target.name} no longer wants to trade.`);
                    showToast(`🚫 Trade unavailable: ${response.tradeReason || 'The NPC refuses'}`, 'error');
                    setTimeout(() => setTradeStatusMessage(null), 3000);

                    // If trade tab is active, switch back to dialogue
                    if (activeTab === 'trade') {
                        setActiveTab('dialogue');
                    }
                }
            }

            // Check for crisis mentions
            if (mapData && isNpc(target)) {
                const location = { x: target.x, y: target.y };
                const crisis = crisisDetectionService.detectCrisis(response.text, target, location);
                if (crisis) {
                    console.log(`[Crisis] Detected crisis from ${target.name}: ${crisis.pattern.id}`);
                    showToast(`⚠️ ${target.name} speaks of ${crisis.pattern.flavorText.toLowerCase()}`);
                }
            }

            // Check for helper mode triggers in NPC response
            if (isNpc(target)) {
                const lowerResponse = response.text.toLowerCase();

                // Check for "follow me" / "lead you" patterns
                if (lowerResponse.includes('follow me') ||
                    lowerResponse.includes('lead you') ||
                    lowerResponse.includes('show you where') ||
                    lowerResponse.includes('come with me') ||
                    lowerResponse.includes('i\'ll show you') ||
                    lowerResponse.includes('let me show you')) {

                    // Extract destination from context (home, shop, place of interest)
                    let destination = { x: target.x + Math.floor(Math.random() * 10) - 5, y: target.y + Math.floor(Math.random() * 10) - 5 };
                    let destinationName = 'my place';

                    if (lowerResponse.includes('home') || lowerResponse.includes('house')) {
                        destinationName = `${target.name}'s home`;
                    } else if (lowerResponse.includes('shop') || lowerResponse.includes('workshop')) {
                        destinationName = `${target.name}'s workshop`;
                    } else if (lowerResponse.includes('live') || lowerResponse.includes('stay')) {
                        destinationName = 'where I live';
                    }

                    // Initiate helper mode FIRST, then close modal
                    initiateFollowMe(target, destination, destinationName, () => {
                        // Callback when player arrives
                        showToast(`🎉 You've arrived at ${destinationName}!`, 'success');
                        // Could trigger new interaction here
                    });

                    // Close modal after a short delay
                    setTimeout(() => {
                        onClose(history);
                    }, 500);
                }

                // Check for gift-giving patterns
                if (lowerResponse.includes('have something for you') ||
                    lowerResponse.includes('give you') ||
                    lowerResponse.includes('take this') ||
                    lowerResponse.includes('here\'s a')) {

                    // Generate a simple gift (would be better to extract from context)
                    const gift = {
                        id: `gift-${Date.now()}`,
                        name: 'Small Gift',
                        category: 'Special' as any,
                        value: 10
                    };

                    setTimeout(() => {
                        initiateGiftGiving(target, gift, "I have something for you!");
                    }, 500);
                }
            }
        } catch (err) {
            console.error("Failed to generate dialogue:", err);
            const errorEntry: DialogueEntry = { 
                speaker: 'npc', 
                text: "I'm not sure how to respond to that.", 
                timestamp: new Date() 
            };
            setHistory(prev => [...prev, errorEntry]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = useCallback(() => {
        onClose(history);
        
        // Generate summary asynchronously after modal closes
        if (isNpc(target) && history.length > 1) {
            setTimeout(async () => {
                try {
                    const summary = await summarizeConversation(history);
                    if (!currentTarget.memory) {
                        currentTarget.memory = {
                            conversationSummaries: [],
                            opinionOfPlayer: 50
                        };
                    }
                    if (!currentTarget.memory.conversationSummaries) {
                        currentTarget.memory.conversationSummaries = [];
                    }
                    // Create a new array to avoid frozen array issues
                    const updatedSummaries = [...(currentTarget.memory.conversationSummaries || []), summary.summary];
                    // Keep only last 5 conversations
                    currentTarget.memory.conversationSummaries = updatedSummaries.slice(-5);

                    // Update opinion based on sentiment
                    if (summary.sentiment === 'positive') {
                        currentTarget.memory.opinionOfPlayer = Math.min(100, (currentTarget.memory.opinionOfPlayer || 50) + 10);
                    } else if (summary.sentiment === 'negative') {
                        currentTarget.memory.opinionOfPlayer = Math.max(0, (currentTarget.memory.opinionOfPlayer || 50) - 10);
                    }
                    
                    // Save NPC to session storage
                    npcPersistenceService.saveNpcToSession(currentTarget);
                    
                    // Update the NPC in parent component
                    if (onUpdateNpc) {
                        onUpdateNpc(currentTarget);
                    }
                } catch (error) {
                    console.error('Failed to save conversation summary:', error);
                }
            }, 0);
        }
    }, [target, history, onClose, onUpdateNpc]);
    
    // Handle opening info modal without closing encounter modal
    const handleOpenInfo = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenInfo(target);
    }, [target, onOpenInfo]);
    
    return (
        <>
            <style>{styles}</style>
            <div className={`fixed inset-0 ${isSafari() ? 'bg-black/80' : 'bg-black/60'} flex items-center justify-center z-50 p-0 sm:p-2 md:p-4`} onClick={handleClose}>
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700 sm:rounded-2xl max-w-5xl w-full h-[100vh] h-[100dvh] sm:h-[95vh] sm:h-[95dvh] md:h-[85vh] shadow-2xl transition-all duration-300 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    
                    {/* Header with reputation and language */}
                    <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-700/50 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-amber-400">⭐</span>
                            <span className="text-slate-400">Reputation:</span>
                            <span className={`font-semibold ${
                                playerCharacter.mapReputation >= 50 ? 'text-green-400' : 
                                playerCharacter.mapReputation >= 0 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                {playerCharacter.mapReputation || 0} | {
                                    playerCharacter.mapReputation >= 50 ? 'Friendly' : 
                                    playerCharacter.mapReputation >= 0 ? 'Neutral' : 'Hostile'
                                }
                            </span>
                        </div>
                        {isNpc(target) && (
                            <button 
                                onClick={() => setUseRealLanguage(p => !p)} 
                                className="px-5 py-2 bg-blue-600 text-white rounded-full font-['Press_Start_2P'] text-xs tracking-wider shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all hover:shadow-blue-500/40 flex items-center gap-2"
                                title={`Toggle between English and ${getHistoricalLanguage(target, mapData)}`}
                            >
                                {useRealLanguage ? (
                                    <>
                                        <span>🌐</span>
                                        <span>{getHistoricalLanguage(target, mapData)}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🇬🇧</span>
                                        <span>English</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    
                    {/* Main content area - responsive layout */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-3 sm:p-6 flex-1 min-h-0 overflow-hidden">
                        
                        {/* Left column - Portrait and NPC info */}
                        <div className="flex flex-row sm:flex-col gap-3 sm:gap-4 sm:w-[220px] flex-shrink-0">
                            
                            {/* Portrait with quest indicator and animations */}
                            <div className="relative group">
                                <div
                                    className={`w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] rounded-xl overflow-hidden border-3 transition-all duration-300 cursor-pointer relative ${
                                        questOffer?.hasQuest || relevantQuests.length > 0 
                                            ? 'border-amber-500 shadow-lg shadow-amber-500/20 animate-pulse-subtle' 
                                            : 'border-slate-600 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20'
                                    }`}
                                    onClick={handlePortraitClick}
                                    title={`Click to see inner thoughts... (${3 - monologueClickCount} clicks remaining)`}
                                >
                                    {/* Inner shadow/vignette */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none z-10" />
                                    
                                    {/* Quest indicator badge */}
                                    {(questOffer?.hasQuest || relevantQuests.length > 0) && (
                                        <div className="absolute top-3 right-3 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-20 animate-bounce shadow-lg">
                                            !
                                        </div>
                                    )}
                                    
                                    {isNpc(target) ? (
                                        <ProceduralPortrait
                                            character={target as any}
                                            size={typeof window !== 'undefined' && window.innerWidth <= 640 ? 100 : 200}
                                            temporaryExpression={portraitExpr}
                                            onExpressionComplete={clearPortrait}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                            <span className="text-8xl">{target.emoji || '🦌'}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Hover tooltip */}
                                {isNpc(target) && (
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs text-slate-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        Click for inner thoughts
                                    </div>
                                )}
                            </div>
                            
                            {/* NPC Info Panel */}
                            {isNpc(target) && (
                                <div className="flex-1 sm:flex-none bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
                                    <h2 className="text-lg sm:text-2xl font-bold text-amber-400 text-center mb-2 sm:mb-3 tracking-wide" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                                        {targetName}
                                    </h2>
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Age:</span>
                                            <span className="text-slate-200">{target.age || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Gender:</span>
                                            <span className="text-slate-200 capitalize">{target.gender || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Faith:</span>
                                            <span className="text-slate-200">{target.religiousAffiliation || 'Local Beliefs'}</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Social Class:</span>
                                            <span className="text-slate-200 capitalize">{target.socialClass || 'Commoner'}</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Profession:</span>
                                            <span className="text-slate-200">{target.occupation || target.role || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    {/* Language Historical Context - Subtle educational note */}
                                    {isNpc(target) && (() => {
                                        const language = getLanguageForCharacter(
                                            target.culturalZone || mapData?.culturalZone || 'EUROPEAN',
                                            parseInt(mapData?.timeSlice || '1500'),
                                            mapData?.region,
                                            mapData?.localArea,
                                            target.name,
                                            target.profession
                                        );
                                        return language ? (
                                            <div className="mt-3 p-2 bg-slate-900/40 rounded-lg border border-slate-700/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-amber-400/80">Language:</span>
                                                    <span className="text-xs font-medium text-slate-300">{language.name}</span>
                                                </div>
                                                {language.historicalContext && (
                                                    <p className="text-xs text-slate-400 italic leading-relaxed">
                                                        {language.historicalContext}
                                                    </p>
                                                )}
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Action Icons - Hidden on mobile, shown in tabs instead */}
                                    <div className="hidden sm:flex justify-center gap-2 mt-4">
                                        <button 
                                            onClick={handleOpenInfo}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 hover:border-slate-500 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="View Profile (P)"
                                        >
                                            <span className="text-lg">👤</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Profile (P)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('trade')}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 hover:border-slate-500 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="Trade Items (T)"
                                        >
                                            <span className="text-lg">💰</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Trade (T)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => onInitiateCombat(target)}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-600 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="Attack (A)"
                                        >
                                            <span className="text-lg">⚔️</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Attack (A)
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Animal Info */}
                            {!isNpc(target) && (
                                <div className="flex-1 sm:flex-none bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
                                    <h2 className="text-lg sm:text-2xl font-bold text-amber-400 text-center mb-2 sm:mb-3 tracking-wide">
                                        {targetName}
                                    </h2>
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Type:</span>
                                            <span className="text-slate-200">Animal</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Species:</span>
                                            <span className="text-slate-200">{target.speciesName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between hover:bg-slate-700/30 px-2 py-1 rounded transition-colors">
                                            <span className="text-slate-500">Behavior:</span>
                                            <span className="text-slate-200 capitalize">{target.behavior || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Icons for Animals - Hidden on mobile */}
                                    <div className="hidden sm:flex justify-center gap-2 mt-4">
                                        <button 
                                            onClick={handleOpenInfo}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 hover:border-slate-500 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="View Profile (P)"
                                        >
                                            <span className="text-lg">👤</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Profile (P)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('taming')}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 hover:border-slate-500 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="Tame Animal (T)"
                                        >
                                            <span className="text-lg">🦴</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Tame (T)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => onInitiateCombat(target)}
                                            className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-600 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            title="Hunt Animal (A)"
                                        >
                                            <span className="text-lg">🏹</span>
                                            <span className="absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Hunt (A)
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Right column - Conversation and interactions */}
                        <div className="flex-1 flex flex-col min-h-0 h-full">
                            
                            {/* Tab Navigation - Show for both NPCs and animals */}
                                <nav className="flex gap-0 border-b border-slate-700 mb-3 sm:mb-4 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setActiveTab('dialogue')}
                                        className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                                            activeTab === 'dialogue' 
                                                ? 'text-blue-400 border-b-2 border-blue-400' 
                                                : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                                        }`}
                                    >
                                        {isNpc(target) ? 'Dialogue' : 'Communicate'}
                                    </button>
                                    {isNpc(target) && (
                                        <button 
                                            onClick={() => setActiveTab('history')} 
                                            className={`px-4 py-2.5 text-sm font-medium transition-all ${
                                                activeTab === 'history' 
                                                    ? 'text-blue-400 border-b-2 border-blue-400' 
                                                    : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                                            }`}
                                        >
                                            History
                                        </button>
                                    )}
                                    {isNpc(target) && (
                                        <button 
                                            onClick={() => setActiveTab('household')} 
                                            className={`px-4 py-2.5 text-sm font-medium transition-all ${
                                                activeTab === 'household' 
                                                    ? 'text-blue-400 border-b-2 border-blue-400' 
                                                    : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                                            }`}
                                        >
                                            Household
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isNpc(target)) {
                                                if (tradeEnabled) {
                                                    setActiveTab('trade');
                                                } else {
                                                    showToast('💰 This NPC is not willing to trade yet. Try talking to them!', 'info');
                                                }
                                            } else {
                                                setActiveTab('taming');
                                            }
                                        }}
                                        className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
                                            activeTab === 'trade' || activeTab === 'taming'
                                                ? isNpc(target) ? 'text-amber-400 border-b-2 border-amber-400' : 'text-blue-400 border-b-2 border-blue-400'
                                                : isNpc(target) && !tradeEnabled
                                                    ? 'text-slate-600 hover:text-slate-500 border-b-2 border-transparent cursor-not-allowed'
                                                    : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
                                        } ${showTradeUnlockAnimation && isNpc(target) ? 'amber-glow-animation' : ''}`}
                                        title={isNpc(target) && !tradeEnabled ? 'Trade not available yet' : undefined}
                                    >
                                        {isNpc(target) ? (
                                            <>
                                                <span className={tradeEnabled ? 'text-amber-400' : ''}>Trade</span>
                                                {!tradeEnabled && !showTradeUnlockAnimation && (
                                                    <span className="ml-1 text-xs text-slate-600">🔒</span>
                                                )}
                                                {showTradeUnlockAnimation && (
                                                    <span className="ml-1 text-xs text-amber-400 unlock-animation absolute">🔒</span>
                                                )}
                                            </>
                                        ) : 'Tame'}
                                    </button>
                                    {(questOffer?.hasQuest || relevantQuests.length > 0) && (
                                        <button
                                            onClick={() => setActiveTab('quest')}
                                            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                                activeTab === 'quest'
                                                    ? 'text-amber-400 border-b-2 border-amber-400'
                                                    : 'text-amber-500 hover:text-amber-400 border-b-2 border-transparent'
                                            }`}
                                        >
                                            <span className="text-base">⚡</span>
                                            Quests
                                        </button>
                                    )}
                                    {isNpc(target) && (
                                        <button
                                            onClick={() => setActiveTab('source')}
                                            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                                activeTab === 'source'
                                                    ? 'text-purple-400 border-b-2 border-purple-400'
                                                    : 'text-purple-500 hover:text-purple-400 border-b-2 border-transparent'
                                            }`}
                                        >
                                            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Present Document</span>
                                            <span className="sm:hidden">Document</span>
                                        </button>
                                    )}

                                    {/* Mobile-only action buttons */}
                                    <div className="flex sm:hidden ml-auto">
                                        <button
                                            onClick={handleOpenInfo}
                                            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-300 border-b-2 border-transparent transition-all whitespace-nowrap"
                                            title="Profile"
                                        >
                                            👤
                                        </button>
                                        <button
                                            onClick={() => onInitiateCombat(target)}
                                            className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 border-b-2 border-transparent transition-all whitespace-nowrap"
                                            title="Attack"
                                        >
                                            ⚔️
                                        </button>
                                    </div>
                                </nav>
                            
                            {/* Conversation Area */}
                            <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 overflow-y-auto conversation-scrollbar min-h-0">
                                {activeTab === 'dialogue' && (
                                    <div className="space-y-4">
                                        {history.length === 0 && isLoading ? (
                                            <div className="flex items-center justify-center py-20">
                                                <div className="flex gap-2">
                                                    <div className="loading-dot"></div>
                                                    <div className="loading-dot"></div>
                                                    <div className="loading-dot"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {history.map((entry, index) => (
                                                    <div key={index} className="dialogue-entry">
                                                        {entry.speaker === 'system' ? (
                                                            // System messages (trades, etc.)
                                                            <div className="flex justify-center my-3">
                                                                <div className="px-3 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs font-mono text-slate-400 uppercase tracking-wider">
                                                                    {entry.text}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Regular dialogue
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-baseline gap-2 mb-1">
                                                                        <span className="font-semibold text-amber-400">
                                                                            {entry.speaker === 'player' ? 'You' : targetName}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {getTimeAgo(entry.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-slate-200 leading-relaxed">
                                                                        <HighlightedText
                                                                            text={entry.text}
                                                                            era={currentEra}
                                                                            zone={culturalZone}
                                                                            onKeywordClick={(source) => setSelectedPrimarySource(source)}
                                                                        />
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Quest hint for relevant dialogue */}
                                                        {relevantQuests.length > 0 && entry.speaker === 'npc' && index === history.length - 1 && (
                                                            <div className="mt-2 pl-4 border-l-2 border-amber-500/50">
                                                                <p className="text-xs text-amber-400/80">
                                                                    ↳ Related to active quest: {relevantQuests[0].title}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Trade availability notification */}
                                                        {tradeEnabled && tradeStatusMessage && entry.speaker === 'npc' && index === history.length - 1 && (
                                                            <div
                                                                className="mt-3 p-3 bg-amber-900/20 border border-amber-600/40 rounded-lg cursor-pointer hover:bg-amber-900/30 transition-all"
                                                                onClick={() => {
                                                                    setActiveTab('trade');
                                                                    setTradeStatusMessage(null);
                                                                }}
                                                            >
                                                                <p className="text-sm text-amber-400 flex items-center gap-2">
                                                                    <span className="text-amber-500">💰</span>
                                                                    {tradeStatusMessage}
                                                                    <span className="text-xs text-amber-400/70 ml-auto">(Click to open trade)</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                {/* Typing indicator */}
                                                {isLoading && history.length > 0 && (
                                                    <div className="flex items-center justify-start py-2">
                                                        <div className="flex gap-2">
                                                            <div className="loading-dot"></div>
                                                            <div className="loading-dot"></div>
                                                            <div className="loading-dot"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                
                                {/* Trade tab */}
                                {activeTab === 'trade' && isNpc(target) && mapData && (
                                    tradeEnabled ? (
                                        <NpcTradeInterface
                                            npc={target}
                                            playerCharacter={playerCharacter}
                                            mapData={mapData}
                                            onClose={() => setActiveTab('dialogue')}
                                            onTradeComplete={(tradeDetails) => {
                                                // Add trade completion to dialogue history
                                                if (tradeDetails) {
                                                    let tradeText = 'TRADE: ';
                                                    if (tradeDetails.bought && tradeDetails.bought.length > 0) {
                                                        tradeText += `BOUGHT ${tradeDetails.bought.join(', ').toUpperCase()}`;
                                                    }
                                                    if (tradeDetails.sold && tradeDetails.sold.length > 0) {
                                                        if (tradeDetails.bought && tradeDetails.bought.length > 0) tradeText += ' | ';
                                                        tradeText += `SOLD ${tradeDetails.sold.join(', ').toUpperCase()}`;
                                                    }
                                                    if (tradeDetails.coins && tradeDetails.coins > 0) {
                                                        if ((tradeDetails.bought && tradeDetails.bought.length > 0) ||
                                                            (tradeDetails.sold && tradeDetails.sold.length > 0)) {
                                                            tradeText += ' | ';
                                                        }
                                                        tradeText += `PAID ${tradeDetails.coins} COINS`;
                                                    }

                                                    const tradeEntry: DialogueEntry = {
                                                        speaker: 'system',
                                                        text: tradeText,
                                                        timestamp: new Date()
                                                    };
                                                    setHistory(prev => [...prev, tradeEntry]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="p-4 text-center text-slate-400">
                                            <p className="text-lg mb-2">Trade Not Available</p>
                                            <p className="text-sm">{tradeStatusMessage || 'This NPC is not willing to trade at the moment.'}</p>
                                            <button
                                                onClick={() => setActiveTab('dialogue')}
                                                className="ff-action-button mt-4"
                                            >
                                                Return to Dialogue
                                            </button>
                                        </div>
                                    )
                                )}
                                
                                {/* Taming tab */}
                                {activeTab === 'taming' && !isNpc(target) && (
                                    <div className="flex flex-col h-full p-6 space-y-4 animate-slide-up">
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                                                    <Heart className="w-6 h-6 text-green-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-green-400">
                                                        Taming {targetName}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Build trust through careful approach
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Attempts</p>
                                                <p className="text-lg font-bold text-slate-300">{tamingAttempts}/2</p>
                                            </div>
                                        </div>
                                        
                                        {/* Ownership Warning */}
                                        {animalOwner && (
                                            <div className="p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-600/30 rounded-lg animate-pulse-subtle">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-red-300">
                                                            Owned Animal Warning
                                                        </p>
                                                        <p className="text-xs text-red-200 mt-1">
                                                            This {target.speciesName} belongs to {animalOwner.name}.
                                                            Stealing it will severely damage your reputation (-30 points).
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Animal Info Card */}
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Species</p>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {target.emoji} {target.speciesName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Estimated Value</p>
                                                    <p className="text-sm font-medium text-amber-400">
                                                        {calculateAnimalValue(target, playerCharacter?.year || 1500)} coins
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Temperament</p>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {target.health && target.health > 70 ? 'Healthy' : 
                                                         target.health && target.health > 40 ? 'Cautious' : 'Nervous'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Difficulty</p>
                                                    <div className="flex gap-1">
                                                        {[1,2,3].map(i => (
                                                            <div 
                                                                key={i}
                                                                className={`w-2 h-2 rounded-full ${
                                                                    i <= (target.level || 1) 
                                                                        ? 'bg-orange-400' 
                                                                        : 'bg-slate-700'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Taming Result */}
                                        {tamingResult && (
                                            <div className={`p-4 rounded-lg border animate-slide-up ${
                                                tamingResult.includes('Success') 
                                                    ? 'bg-green-900/20 border-green-600/30 text-green-200'
                                                    : tamingResult.includes('interested')
                                                        ? 'bg-yellow-900/20 border-yellow-600/30 text-yellow-200'
                                                        : 'bg-red-900/20 border-red-600/30 text-red-200'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{tamingResult}</p>
                                            </div>
                                        )}
                                        
                                        {/* Approach Input */}
                                        <div className="flex-1 flex flex-col">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Describe your taming approach:
                                            </label>
                                            <div className="flex-1 min-h-[100px] relative">
                                                <textarea
                                                    value={tamingApproach}
                                                    onChange={(e) => setTamingApproach(e.target.value)}
                                                    className="w-full h-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                                                    placeholder={
                                                        tamingAttempts === 0 
                                                            ? "e.g., 'I slowly approach with open palms, speaking softly and offering food...'"
                                                            : "The animal seems interested. Try a different approach..."
                                                    }
                                                    disabled={tamingInProgress}
                                                />
                                                {tamingApproach.length > 0 && (
                                                    <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                                                        {tamingApproach.length} characters
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Tips */}
                                            <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                                <p className="text-xs text-slate-400">
                                                    💡 <span className="font-medium">Tips:</span> Mention food, gentle movements, 
                                                    patience, and understanding of the animal's nature. Different species respond 
                                                    to different approaches!
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4 border-t border-slate-700">
                                            <button
                                                onClick={handleTame}
                                                disabled={!tamingApproach.trim() || tamingInProgress}
                                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                                    !tamingApproach.trim() || tamingInProgress
                                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:scale-[1.02] active:scale-[0.98]'
                                                }`}
                                            >
                                                {tamingInProgress ? (
                                                    <>
                                                        <div className="loading-dot"></div>
                                                        <div className="loading-dot"></div>
                                                        <div className="loading-dot"></div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Heart className="w-4 h-4" />
                                                        Attempt Taming
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('dialogue')}
                                                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Household tab */}
                                {activeTab === 'household' && isNpc(target) && (
                                    <div className="space-y-4">
                                        <NpcHouseholdPanel 
                                            npc={target}
                                            playerCharacter={playerCharacter}
                                        />
                                    </div>
                                )}
                                
                                {/* Quest tab */}
                                {activeTab === 'quest' && isNpc(target) && (
                                    <NpcQuestPanel
                                        npc={target}
                                        playerCharacter={playerCharacter}
                                        mapData={mapData}
                                        onQuestAccepted={() => {}}
                                    />
                                )}

                                {/* Source/Document tab */}
                                {activeTab === 'source' && isNpc(target) && (
                                    <div className="flex flex-col h-full p-4 sm:p-6 space-y-4 animate-slide-up">
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                                                    <Book className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-purple-400">
                                                        Present a Document
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Share a text for {targetName} to discuss
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Source submission form */}
                                        {!sourceDiscussionResult ? (
                                            <div className="space-y-4">
                                                {/* Source type toggle */}
                                                <div className="flex gap-2 p-1 bg-slate-800/40 rounded-lg">
                                                    <button
                                                        onClick={() => setSourceType('text')}
                                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                                            sourceType === 'text'
                                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                                : 'text-slate-400 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        <FileText className="w-4 h-4 inline mr-2" />
                                                        New Text
                                                    </button>
                                                    <button
                                                        onClick={() => setSourceType('journal')}
                                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                                            sourceType === 'journal'
                                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                                : 'text-slate-400 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        <Book className="w-4 h-4 inline mr-2" />
                                                        Journal Entry
                                                    </button>
                                                </div>

                                                {sourceType === 'text' ? (
                                                    <>
                                                        {/* Title input */}
                                                        <div>
                                                            <label className="text-sm text-slate-400 mb-1 block">Document Title</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g., 'Magna Carta' or 'Ancient Scroll'"
                                                                value={sourceTitle}
                                                                onChange={(e) => setSourceTitle(e.target.value)}
                                                                className="w-full px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-400"
                                                            />
                                                        </div>

                                                        {/* Content textarea */}
                                                        <div>
                                                            <label className="text-sm text-slate-400 mb-1 block">
                                                                Document Text (paste or type)
                                                            </label>
                                                            <textarea
                                                                placeholder="Paste the text you want to discuss..."
                                                                value={sourceContent}
                                                                onChange={(e) => setSourceContent(e.target.value)}
                                                                rows={8}
                                                                className="w-full px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-400 resize-none"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Journal entry selection */
                                                    <div>
                                                        <label className="text-sm text-slate-400 mb-1 block">Select Journal Entry</label>
                                                        {availableJournalEntries.length > 0 ? (
                                                            <select
                                                                value={selectedJournalEntry || ''}
                                                                onChange={(e) => {
                                                                    setSelectedJournalEntry(e.target.value);
                                                                    const entry = availableJournalEntries.find(j => j.id === e.target.value);
                                                                    if (entry) {
                                                                        setSourceTitle(entry.title || `Journal Entry - ${entry.date}`);
                                                                        setSourceContent(entry.content);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 text-sm text-white bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-400"
                                                            >
                                                                <option value="">Choose an entry...</option>
                                                                {availableJournalEntries.map(entry => (
                                                                    <option key={entry.id} value={entry.id}>
                                                                        {entry.title || `${entry.date} - ${entry.location}`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="text-sm text-slate-500 italic p-4 bg-slate-800/40 rounded-lg">
                                                                No journal entries yet. Write in your journal first!
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Notes input - shown for both types */}
                                                <div>
                                                    <label className="text-sm text-slate-400 mb-1 block">
                                                        Your Notes (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Why you want to discuss this..."
                                                        value={sourceNotes}
                                                        onChange={(e) => setSourceNotes(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-purple-400"
                                                    />
                                                </div>

                                                {/* Submit button */}
                                                <button
                                                    onClick={async () => {
                                                        if (!sourceContent.trim()) return;

                                                        setIsSubmittingSource(true);
                                                        try {
                                                            const source = createSubmittedSource(
                                                                sourceTitle || 'Untitled Document',
                                                                sourceContent,
                                                                sourceType === 'journal' ? 'journal_entry' : 'pasted_text',
                                                                sourceNotes,
                                                                currentEra,
                                                                culturalZone
                                                            );

                                                            const response = await generateSourceDiscussion(
                                                                source,
                                                                target,
                                                                sourceNotes,
                                                                mapData?.area || 'unknown',
                                                                gameDate.year,
                                                                playerCharacter,
                                                                mapData
                                                            );

                                                            setSourceDiscussionResult(response);

                                                            // Generate follow-up questions for multi-turn conversation
                                                            const questions = [
                                                                "What do you think is the most important part?",
                                                                "How does this relate to our current situation?",
                                                                "Have you seen anything similar before?"
                                                            ];
                                                            setFollowUpQuestions(questions);

                                                            // Add to dialogue history
                                                            const newHistory: DialogueEntry[] = [
                                                                ...history,
                                                                {
                                                                    speaker: 'player',
                                                                    text: `[Presents document: "${sourceTitle || 'Untitled Document'}"]`,
                                                                    timestamp: Date.now()
                                                                },
                                                                {
                                                                    speaker: 'npc',
                                                                    text: response,
                                                                    timestamp: Date.now()
                                                                }
                                                            ];
                                                            setHistory(newHistory);
                                                        } catch (error) {
                                                            console.error('[EncounterModal] Failed to discuss source:', error);
                                                            console.error('[EncounterModal] Error details:', {
                                                                error,
                                                                sourceContent: sourceContent?.slice(0, 100),
                                                                target: target?.name,
                                                                mapData: mapData?.area,
                                                                playerCharacter: playerCharacter?.name
                                                            });
                                                            // Show more descriptive error message
                                                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                                            setSourceDiscussionResult(`The document is difficult to understand... (Error: ${errorMessage})`);
                                                        } finally {
                                                            setIsSubmittingSource(false);
                                                        }
                                                    }}
                                                    disabled={!sourceContent.trim() || isSubmittingSource}
                                                    className="w-full ff-action-button"
                                                >
                                                    {isSubmittingSource ? 'Presenting...' : 'Present Document'}
                                                </button>
                                            </div>
                                        ) : (
                                            /* Discussion result */
                                            <div className="space-y-4">
                                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <span className="text-2xl">{target.emoji || '👤'}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-amber-400 mb-2">
                                                                {targetName} responds:
                                                            </p>
                                                            <p className="text-slate-200 leading-relaxed italic">
                                                                "{sourceDiscussionResult}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Follow-up questions for multi-turn conversation */}
                                                {followUpQuestions.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-slate-400">Ask a follow-up question:</p>
                                                        {followUpQuestions.map((question, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={async () => {
                                                                    setIsSubmittingSource(true);
                                                                    try {
                                                                        // Generate follow-up response
                                                                        const followUpResponse = await generateSourceDiscussion(
                                                                            createSubmittedSource(
                                                                                sourceTitle,
                                                                                sourceContent,
                                                                                sourceType === 'journal' ? 'journal_entry' : 'pasted_text',
                                                                                question,
                                                                                currentEra,
                                                                                culturalZone
                                                                            ),
                                                                            target,
                                                                            question,
                                                                            mapData?.area || 'unknown',
                                                                            gameDate.year,
                                                                            playerCharacter,
                                                                            mapData
                                                                        );

                                                                        // Append to existing discussion
                                                                        setSourceDiscussionResult(prev =>
                                                                            `${prev}\n\nYou asked: "${question}"\n\n${targetName} replies: "${followUpResponse}"`
                                                                        );

                                                                        // Clear follow-up questions after asking one
                                                                        setFollowUpQuestions([]);
                                                                    } catch (error) {
                                                                        console.error('Failed to get follow-up response:', error);
                                                                    } finally {
                                                                        setIsSubmittingSource(false);
                                                                    }
                                                                }}
                                                                disabled={isSubmittingSource}
                                                                className="w-full text-left px-3 py-2 text-sm text-slate-300 bg-slate-800/40 border border-slate-700 rounded-lg hover:bg-slate-700/40 hover:text-purple-400 hover:border-purple-500/50 transition-all"
                                                            >
                                                                → {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSourceDiscussionResult(null);
                                                        setSourceTitle('');
                                                        setSourceContent('');
                                                        setSourceNotes('');
                                                        setFollowUpQuestions([]);
                                                        setSelectedJournalEntry(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-sm text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-500/10 transition-colors"
                                                >
                                                    Present Another Document
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* History tab */}
                                {activeTab === 'history' && isNpc(target) && (
                                    <div className="text-slate-300">
                                        {currentTarget.memory?.conversationSummaries && currentTarget.memory.conversationSummaries.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
                                                    <ScrollText className="w-4 h-4 text-slate-400" />
                                                    <h3 className="text-sm font-semibold text-slate-400">Previous Conversations</h3>
                                                </div>
                                                {currentTarget.memory.conversationSummaries.map((summary, index) => (
                                                    <div key={index} className="bg-slate-700/30 rounded-lg p-4 text-sm hover:bg-slate-700/40 transition-colors">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-slate-500 mt-0.5">•</span>
                                                            <p className="leading-relaxed">{summary}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="text-xs text-slate-500 text-center pt-2">
                                                    Opinion of you: {currentTarget.memory.opinionOfPlayer || 50}/100
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                                <ScrollText className="w-8 h-8 mb-3 opacity-50" />
                                                <p>No previous conversations</p>
                                                <p className="text-xs mt-1">Start talking to build a history</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Input Area - Available for both NPCs and animals */}
                            {activeTab === 'dialogue' && (() => {
                                const diseaseRestrictions = calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);

                                let placeholder = isLoading ? "Waiting for response..." : isNpc(target) ? "Say something..." : "Try to communicate...";
                                let inputClassName = "flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-slate-500 bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all input-glow";

                                // Modify placeholder and styling based on voice loss
                                if (diseaseRestrictions.voiceLossLevel === 1) {
                                    placeholder = isLoading ? "Waiting for response..." : "[Weak voice] Say something...";
                                    inputClassName += " border-yellow-600/50 bg-yellow-900/20";
                                } else if (diseaseRestrictions.voiceLossLevel === 2) {
                                    placeholder = isLoading ? "Waiting for response..." : "[Whispers only] Try to whisper...";
                                    inputClassName += " border-orange-600/50 bg-orange-900/20";
                                } else if (diseaseRestrictions.voiceLossLevel >= 3) {
                                    placeholder = isLoading ? "Waiting for response..." : "[No voice] Try to gesture...";
                                    inputClassName += " border-red-600/50 bg-red-900/20";
                                }

                                return (
                                    <div className="flex-shrink-0">
                                        {diseaseRestrictions.voiceLossLevel > 0 && (
                                            <div className="mb-2">
                                                <div className="text-xs text-yellow-400 mb-1 flex items-center gap-1">
                                                    <span>⚠️</span>
                                                    {diseaseRestrictions.voiceLossLevel === 1 && "Your voice is weak from illness"}
                                                    {diseaseRestrictions.voiceLossLevel === 2 && "Your illness reduces you to whispers"}
                                                    {diseaseRestrictions.voiceLossLevel >= 3 && "Your illness has robbed you of speech"}
                                                </div>
                                            </div>
                                        )}
                                        {npcWantsToLeave && (
                                            <div className="mb-3 p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg animate-pulse">
                                                <div className="text-sm text-orange-300 flex items-center gap-2">
                                                    <span className="text-lg">👋</span>
                                                    <span className="font-medium">{target.name} is leaving the conversation...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-2 sm:gap-3">
                                            <input
                                                type="text"
                                                placeholder={npcWantsToLeave ? "The conversation is ending..." : placeholder}
                                                value={playerInput}
                                                onChange={(e) => setPlayerInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                disabled={isLoading || npcWantsToLeave}
                                                className={npcWantsToLeave ? `${inputClassName} opacity-50 cursor-not-allowed` : inputClassName}
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={isLoading || !playerInput.trim() || npcWantsToLeave}
                                                className="ff-action-button"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                    
                    {/* Footer bar with Leave button */}
                    <div className="border-t border-slate-700/50 px-3 sm:px-6 bg-slate-900/50 flex-shrink-0" style={{
                        paddingTop: '12px',
                        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
                    }}>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleClose}
                                className="ff-action-button"
                            >
                                Leave Conversation
                            </button>
                        </div>
                    </div>
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
                
                {/* Internal Monologue Modal */}
                {showMonologue && (
                    <div className={`fixed inset-0 ${isSafari() ? 'bg-black/80' : 'bg-black/50'} flex items-center justify-center z-[60] p-4`} onClick={() => setShowMonologue(false)}>
                        <div className="bg-slate-900 border border-amber-500/50 rounded-xl p-6 max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
                            <h3 className="text-amber-400 font-semibold mb-3 text-center">Inner Thoughts</h3>
                            {isLoadingMonologue ? (
                                <div className="text-center text-slate-400 py-4">
                                    <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p>Reading their mind...</p>
                                </div>
                            ) : (
                                <p className="text-slate-300 italic leading-relaxed">
                                    "{monologueText}"
                                </p>
                            )}
                            <div className="text-center mt-4">
                                <span className="text-xs text-slate-500">
                                    Click {3 - monologueClickCount} more time{3 - monologueClickCount !== 1 ? 's' : ''} for deeper thoughts
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default EncounterModalUpdated;