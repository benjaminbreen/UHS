/**
 * components/EncounterModalUpdated.tsx - Updated UI design for entity encounters
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EncounterableEntity, NpcEntity, DialogueEntry, PlayerCharacter, MapData } from '../types';
import type { HistoryLensMessage } from '../types/historyLens';
import { Item } from '../types/itemTypes';
import { generateEncounterDialogue, attemptTheft, handleTheftResponse, TheftAttempt, shouldEscalateToCombat, updateNpcEscalationLevel } from '../services/encounterService';
import { summarizeConversation, generateInternalMonologue, generateNpcQuestOffer, generateGiftReaction } from '../services/llmService';
import { TypewriterText } from '../hooks/useTypewriter';
import NpcTradeInterface from './NpcTradeInterface';
import { ProceduralPortrait, AnimatedPortrait } from './portraits';
import AnimalPortrait from './AnimalPortrait';
import { HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';
import { GameModeType } from '../types/eventTypes';
import { spatialDescriptionService } from '../services/spatialDescriptionService';
import { Sparkles, Target, MapPin, Info, AlertTriangle, Heart, Clock, Send, User, Home, ShoppingBag, ScrollText, ChevronDown } from 'lucide-react';
import NpcQuestPanel from './NpcQuestPanel';
import NpcMedicalPanel from './NpcMedicalPanel';
import { learningObjectivesService } from '../services/learningObjectivesService';
import { LogService } from '../services/logService';
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
import { eventBus } from '../services/eventBus';
import { getLanguageForCharacter, getLanguageComprehension, LANGUAGES } from '../constants/gameData/languages';
import { triggerArrest, ArrestScenario } from '../services/arrestService';
import { usePortraitExpression, mapRepDeltaToExpr, mapEventToExpr, mapPersonalityToExpr } from '../hooks/usePortraitExpression';
import { diseaseService } from '../services/diseaseService';
import { crisisDetectionService } from '../services/crisisDetectionService';
import gameSounds from '../services/gameSoundsService';
import { HighlightedText } from '../hooks/usePrimarySourceKeywords';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString } from '../utils/dateUtils';
import TranslatableWord from './ui/TranslatableWord';
import { calculateDiseaseGameplayRestrictions } from '../services/diseaseProgressionService';
import { generateSourceDiscussion, createSubmittedSource, createSourceDiscussion } from '../services/sourceDiscussionService';
import { SubmittedSource, SourceDiscussion } from '../types/primarySource';
import { FileText, Book } from 'lucide-react';
import { addDiscussionToHistory } from '../services/sourceDiscussionPersistence';
import { isSafari } from '../utils/safariUtils';
import { useNpcHelperMode } from './NpcHelperModeHandler';
import { initiateHelperMode } from '../services/npcHelperService';
import { LanguageFamilyTree } from './LanguageFamilyTree';
import { WorkOffer } from '../types/workOffer';
import { detectWorkRequest, generateWorkOffer, MAX_OFFERS_PER_NPC, deliverItemsToWorkOffer, calculateProactiveWorkContext, checkWorkCompletion, completeWorkOffer, checkWorkOfferWillingness } from '../services/workOfferService';
import { addWorkOffer, getWorkOffersForNpc, updateWorkOffer } from '../services/workOfferStorage';
import { getPlayerCurrency } from '../utils/currencyUtils';

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
  width: 5px;
}

.conversation-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-normal);
  border-radius: 10px;
}

.conversation-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--border-subtle);
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
  background-color: var(--text-muted);
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
  onUpdatePlayer?: (updatedPlayer: PlayerCharacter) => void;
  historyLensContext?: HistoryLensMessage[];
}

/**
 * Helper function to parse dialogue text and render foreign words with translations
 */
function parseDialogueWithTranslations(
    text: string,
    translations?: Record<string, string>,
    language?: string
): React.ReactNode[] {
    if (!translations || Object.keys(translations).length === 0) {
        // No translations, just return text as-is (with italics preserved)
        return [text];
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex to find italicized words: *word*
    const regex = /\*([^*]+)\*/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const foreignWord = match[1];
        const matchStart = match.index;
        const matchEnd = regex.lastIndex;

        // Add text before the match
        if (matchStart > lastIndex) {
            parts.push(text.substring(lastIndex, matchStart));
        }

        // Add TranslatableWord component for the foreign word
        parts.push(
            <TranslatableWord
                key={matchStart}
                word={foreignWord}
                translation={translations[foreignWord]}
                language={language}
            />
        );

        lastIndex = matchEnd;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
}

const EncounterModalUpdated: React.FC<EncounterModalProps> = ({
    target,
    playerCharacter,
    allNpcs,
    mapData,
    onClose,
    onInitiateCombat,
    onOpenInfo,
    onUpdateNpc,
    onUpdatePlayer,
    historyLensContext
}) => {
    const { showToast, setCurrentEvent, setSelectedPrimarySource, openQuestPanelWithWorkOffer, showFloatingText } = useUI();
    const { worldData } = useMap();
    const { gameDate, currentZone, currentRegion, addGameLogEntry, formattedTime, currentTimeOfDay } = useGame();

    // Get the most up-to-date NPC from allNpcs UNLESS target has hostile flags (which are time-sensitive)
    const hasHostileFlags = isNpc(target) && (
        ('isHostile' in target && target.isHostile) ||
        ('wasThreatenedByWeapon' in target && target.wasThreatenedByWeapon) ||
        ('aiState' in target && target.aiState === 'attacking_chasing')
    );

    if (hasHostileFlags && isNpc(target)) {
        console.log(`[ENCOUNTER MODAL] ⚔️ Using hostile ${target.name} directly (has hostile flags: isHostile=${target.isHostile}, wasThreatenedByWeapon=${target.wasThreatenedByWeapon}, aiState=${target.aiState})`);
    }

    const currentTarget = isNpc(target) && !hasHostileFlags
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
    
    // Language tree modal state
    const [showLanguageTree, setShowLanguageTree] = useState(false);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);

    // Gift giving state
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [isGiftingInProgress, setIsGiftingInProgress] = useState(false);

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

    // Work offer states (simple quest system)
    const [workOffer, setWorkOffer] = useState<WorkOffer | null>(null);
    const [isGeneratingWork, setIsGeneratingWork] = useState(false);
    const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});

    // Internal monologue states
    const [showMonologue, setShowMonologue] = useState(false);
    const [monologueText, setMonologueText] = useState('');

    // Exit notification state (for NPC walking away or attacking)
    const [exitingNpc, setExitingNpc] = useState<{
        npcName: string;
        reason: 'disgust' | 'fear' | 'offense' | 'attack';
        countdown: number;
    } | null>(null);
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

    // UI state
    const [isCharacterPanelCollapsed, setIsCharacterPanelCollapsed] = useState(false);
    
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

    // Calculate proactive work context for initial greeting
    const workContext = useMemo(() => {
        if (!isNpc(currentTarget) || !mapData) {
            return { shouldOffer: false, contextHint: "", probability: 0 };
        }

        const npcPos = { x: currentTarget.x, y: currentTarget.y };

        // Get nearby animals (within 50 tiles)
        const nearbyAnimals = mapData.animals?.filter(animal => {
            const dx = animal.x - npcPos.x;
            const dy = animal.y - npcPos.y;
            return Math.sqrt(dx * dx + dy * dy) <= 50;
        }) || [];

        // Get nearby structures (already available in mapData)
        const nearbyStructures = mapData.terrainStructures || [];

        return calculateProactiveWorkContext(currentTarget, mapData, nearbyAnimals, nearbyStructures);
    }, [currentTarget, mapData]);

    // Check for completable work offers
    const completableOffers = useMemo(() => {
        if (!isNpc(currentTarget) || !playerCharacter || !mapData) return [];

        const npcOffers = getWorkOffersForNpc(currentTarget.id);
        const playerPos = { x: playerCharacter.x || currentTarget.x, y: playerCharacter.y || currentTarget.y }; // Use actual player position for quest completion checks
        const currentGameHours = gameDate ? (gameDate.year * 365 * 24 + gameDate.month * 30 * 24 + gameDate.day * 24) : 0;

        return npcOffers
            .filter(offer => offer.accepted && !offer.completed && !offer.failed)
            .filter(offer => {
                const status = checkWorkCompletion(
                    offer,
                    playerCharacter,
                    playerPos,
                    currentGameHours,
                    currentTarget // Pass the NPC for conversation tracking
                );
                return status === 'completed';
            });
    }, [currentTarget, playerCharacter, mapData, gameDate]);

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
                const tamedAnimal = createTamedAnimal(target, playerCharacter, gameDate);
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
    // Quest system removed - no active quests
    const relevantQuests: any[] = [];

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

            // Auto-trigger combat for hostile farm NPCs
            if (isNpc(target) && target.id?.startsWith('farm_') && target.isHostile) {
                console.log('[Combat] Auto-triggering combat with hostile farm defender:', target.name);
                setTimeout(() => {
                    onInitiateCombat(target);
                }, 100);
                return;
            }

            setIsLoading(true);

            if (isNpc(target)) {
                // Check if NPC is hostile (was threatened/attacked)
                const isHostileNpc = hasHostileFlags;

                // Generate appropriate greeting based on whether NPC knows the player
                const hasMetBefore = currentTarget.memory?.conversationSummaries && currentTarget.memory.conversationSummaries.length > 0;

                // If NPC is hostile, use a confrontational greeting
                let baseGreeting: string;
                if (isHostileNpc) {
                    baseGreeting = "[The confrontation begins - you stand face to face after the altercation]";
                    console.log('[Encounter] Using hostile confrontation greeting');
                } else {
                    baseGreeting = hasMetBefore ? "I approach again." : "Hello.";
                }

                // Add context hint if NPC should proactively offer work (but not if hostile)
                const greeting = (workContext.shouldOffer && !isHostileNpc)
                    ? `${baseGreeting} ${workContext.contextHint}`
                    : baseGreeting;

                // Log proactive offer probability for debugging
                if (workContext.shouldOffer) {
                    console.log(`[Proactive Work] ${currentTarget.name} (${currentTarget.profession}) offering work at ${workContext.probability}% probability`);
                }

                generateEncounterDialogue(currentTarget, currentTarget.memory?.conversationSummaries || [], greeting, playerCharacter, allNpcs, mapData, useRealLanguage, historyLensContext)
                    .then(response => {
                        const initialEntry: DialogueEntry = {
                            speaker: 'npc',
                            text: response.text,
                            timestamp: new Date(),
                            translations: response.translations,
                            language: response.language
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

    // Set initial "curious" expression for NPCs when modal opens, then fade to neutral
    useEffect(() => {
        if (isNpc(target)) {
            // NPC starts with curious expression (wondering who approached them)
            flashPortrait('curious', 8000); // 8 seconds of curiosity, then neutral
        }
    }, []); // Only run once when modal opens

    // Quest system removed - no quest completion checking

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

    // Handle partial item delivery for work offers
    const handlePartialDelivery = (offer: WorkOffer) => {
        if (!playerCharacter || !onUpdatePlayer) return;

        const quantityToDeliver = deliveryQuantities[offer.id] || 1;

        const result = deliverItemsToWorkOffer(
            offer,
            playerCharacter,
            quantityToDeliver,
            (newInventory) => {
                onUpdatePlayer({
                    ...playerCharacter,
                    inventory: newInventory
                });
            }
        );

        if (result.success) {
            // Update the work offer in storage
            updateWorkOffer(result.updatedOffer);

            // Add delivery to conversation history
            const deliveryEntry: DialogueEntry = {
                speaker: 'system',
                text: result.isComplete
                    ? `${playerCharacter.name} delivered the final ${quantityToDeliver} ${offer.requiredItem}, completing the work order. Payment: ${offer.payment} coins.`
                    : `${playerCharacter.name} delivered ${quantityToDeliver} ${offer.requiredItem} (${result.updatedOffer.deliveredQuantity}/${offer.requiredQuantity} total).`,
                timestamp: new Date()
            };
            setHistory(prev => [...prev, deliveryEntry]);

            // Show feedback
            showToast(result.message, result.isComplete ? 'success' : 'info');

            // If work is complete, pay the player
            if (result.isComplete) {
                const newCurrency = getPlayerCurrency(playerCharacter) + offer.payment;
                onUpdatePlayer({
                    ...playerCharacter,
                    currency: newCurrency
                });
                showToast(`+${offer.payment} coins earned!`, 'success');

                // Dispatch event for quest panel refresh
                window.dispatchEvent(new CustomEvent('workOfferCompleted', { detail: { offerId: offer.id } }));
            } else {
                // Dispatch event for quest panel update
                window.dispatchEvent(new CustomEvent('workOfferUpdated', { detail: { offerId: offer.id } }));
            }

            // Reset quantity input for this offer
            setDeliveryQuantities(prev => ({ ...prev, [offer.id]: 1 }));
        } else {
            showToast(result.message, 'error');
        }
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

        // Check for work request BEFORE processing dialogue
        if (isNpc(currentTarget) && detectWorkRequest(playerInput)) {
            setIsGeneratingWork(true);
            try {
                // First check if NPC is willing to offer work based on relationship/conversation
                const conversationForCheck = history.map(h => ({
                    speaker: h.speaker,
                    text: h.text
                }));
                const willingness = checkWorkOfferWillingness(
                    currentTarget as NpcEntity,
                    conversationForCheck,
                    playerCharacter.mapReputation
                );

                if (!willingness.willing) {
                    // NPC refuses to offer work - use their specific reason
                    const rejectionEntry: DialogueEntry = {
                        speaker: 'npc',
                        text: willingness.reason || "I don't have any work for someone like you.",
                        timestamp: new Date()
                    };
                    setHistory(prev => [...prev, rejectionEntry]);
                    setPlayerInput('');
                    setIsGeneratingWork(false);
                    return;
                }

                // Get nearby animals for hunting quests (use NPC position as reference since player is near them)
                const npcPos = { x: (currentTarget as NpcEntity).x, y: (currentTarget as NpcEntity).y };
                const nearbyAnimals = mapData?.animals?.filter(animal => {
                    const dx = animal.x - npcPos.x;
                    const dy = animal.y - npcPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance <= 50; // Within 50 tiles
                }) || [];

                const offer = await generateWorkOffer(
                    currentTarget as NpcEntity,
                    playerCharacter,
                    mapData,
                    mapData?.terrainStructures || [],
                    gameDate ? (gameDate.year * 365 * 24 + gameDate.month * 30 * 24 + gameDate.day * 24) : 0,
                    npcPos,
                    nearbyAnimals,
                    conversationForCheck // Pass conversation history to LLM generator
                );

                if (offer) {
                    setWorkOffer(offer);
                    setPlayerInput('');
                    setIsGeneratingWork(false);
                    return; // Don't generate normal dialogue
                } else {
                    // Could be max offers OR generation failure
                    // Check which one to provide better feedback
                    const npcOffers = getWorkOffersForNpc((currentTarget as NpcEntity).id);
                    const activeCount = npcOffers.filter(o => o.accepted && !o.completed && !o.failed).length;

                    let rejectionText: string;
                    if (activeCount >= MAX_OFFERS_PER_NPC) {
                        // Max offers reached
                        rejectionText = `I appreciate your interest, but I already have you working on some tasks. Please complete those before I can offer you more work.`;
                    } else {
                        // Generation failure or NPC genuinely has no work
                        rejectionText = `I don't have any work for you right now. Perhaps check back later?`;
                    }

                    const rejectionEntry: DialogueEntry = {
                        speaker: 'npc',
                        text: rejectionText,
                        timestamp: new Date()
                    };
                    setHistory(prev => [...prev, rejectionEntry]);
                    setPlayerInput('');
                    setIsGeneratingWork(false);
                    return; // Don't continue to normal dialogue
                }
            } catch (error) {
                console.error('Error generating work offer:', error);
                // Show error feedback to player
                const errorEntry: DialogueEntry = {
                    speaker: 'npc',
                    text: `I'm having trouble thinking of work right now. Perhaps try again in a moment?`,
                    timestamp: new Date()
                };
                setHistory(prev => [...prev, errorEntry]);
                setPlayerInput('');
                setIsGeneratingWork(false);
                return;
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
            setTimeout(() => setReputationChange(null), 30000);
        }
        
        try {
            const response = await generateEncounterDialogue(currentTarget, newHistory, currentInput, playerCharacter, allNpcs, mapData, useRealLanguage, historyLensContext);
            const newNpcEntry: DialogueEntry = {
                speaker: 'npc',
                text: response.text,
                timestamp: new Date(),
                translations: response.translations,
                language: response.language
            };
            setHistory(prev => [...prev, newNpcEntry]);

            // NEW: Track educational interactions
            if (learningObjectivesService.isEducationalMode()) {
                const objectives: ('historical-thinking' | 'cultural-comparison' | 'social-structures')[] = [];

                // Analyze player input for educational markers
                const inputLower = currentInput.toLowerCase();

                if (inputLower.match(/why|how|because|caused|resulted/)) {
                    objectives.push('historical-thinking');
                }
                if (inputLower.match(/different|compare|contrast|perspective/)) {
                    objectives.push('cultural-comparison');
                }
                if (inputLower.match(/class|noble|peasant|power|authority/)) {
                    objectives.push('social-structures');
                }

                if (objectives.length > 0) {
                    try {
                        learningObjectivesService.trackAction(
                            `Engaged with ${currentTarget.name} (${currentTarget.profession || currentTarget.role})`,
                            `Discussed: ${currentInput.substring(0, 100)}...`,
                            objectives
                        );
                    } catch (error) {
                        console.warn('[Educational Tracking] Failed to track action:', error);
                    }
                }
            }

            // NEW: Track conversationCount for educational quests
            if ('id' in currentTarget && currentTarget.id) {
                try {
                    const npcWorkOffers = getWorkOffersForNpc(currentTarget.id);
                    const educationalOffers = npcWorkOffers.filter(offer =>
                        offer.requiresDialogue &&
                        offer.accepted &&
                        !offer.completed
                    );

                    educationalOffers.forEach(offer => {
                        const updatedOffer = {
                            ...offer,
                            conversationCount: (offer.conversationCount || 0) + 1
                        };
                        updateWorkOffer(updatedOffer);
                        console.log(`[Educational Quest] Incremented conversation count for ${offer.taskType}: ${updatedOffer.conversationCount}`);
                    });
                } catch (error) {
                    console.warn('[Educational Quest] Failed to update conversation count:', error);
                }
            }

            // Handle reputation changes from LLM response
            if (response.reputationChange && playerCharacter) {
                setReputationChange(response.reputationChange);
                const expr = mapRepDeltaToExpr(response.reputationChange);
                if (expr) flashPortrait(expr);

                const oldReputation = playerCharacter.mapReputation || 50;
                const newReputation = Math.max(0, Math.min(100, oldReputation + response.reputationChange));

                // Update player character reputation - use callback to trigger re-render
                const updatedCharacter = {
                    ...playerCharacter,
                    mapReputation: newReputation,
                    reputation: Math.min(100, (playerCharacter.reputation || 50) + response.reputationChange)
                };

                // Show floating text for reputation gain
                if (response.reputationChange > 0) {
                    const screenCenterX = window.innerWidth / 2;
                    const screenCenterY = window.innerHeight / 2;
                    showFloatingText(`+${response.reputationChange} Reputation`, 'success', screenCenterX, screenCenterY - 20, 3000);

                    // Show toast for reputation gain
                    showToast(`+${response.reputationChange} Reputation in this area`, 'success');
                }

                // Log significant reputation changes
                if (Math.abs(response.reputationChange) >= 50) {
                    console.log(`[REPUTATION] Major change: ${response.reputationChange}`);
                }

                // Show reputation change for 30 seconds to match expression duration
                setTimeout(() => setReputationChange(null), 30000);

                // Handle work offer payment (coins earned) - add to updatedCharacter
                if ((response as any).coinsEarned) {
                    updatedCharacter.currency = (playerCharacter.currency || 0) + (response as any).coinsEarned;

                    const screenCenterX = window.innerWidth / 2;
                    const screenCenterY = window.innerHeight / 2;
                    showFloatingText(`+${(response as any).coinsEarned} Coins`, 'gold', screenCenterX, screenCenterY + 20, 3000);
                }

                // Handle work task completion
                if ((response as any).workTaskCompleted && gameDate && formattedTime) {
                    const taskData = (response as any).workTaskCompleted;
                    const location = currentRegion || currentZone || 'Unknown';

                    // Log work task completion
                    const logEntry = LogService.createWorkTaskCompletedLog(
                        taskData.taskDescription,
                        taskData.taskType,
                        taskData.payment,
                        taskData.npcName,
                        location,
                        gameDate,
                        formattedTime,
                        currentTimeOfDay
                    );
                    addGameLogEntry(logEntry);

                    // Show success toast
                    showToast(`✅ Work Task Completed: "${taskData.taskDescription}" (+${taskData.payment} coins, +${taskData.trustGained} trust)`, 'success');
                }

                // Handle NPC-specific trust change
                if ((response as any).npcTrustChange && isNpc(currentTarget)) {
                    const trustChange = (response as any).npcTrustChange;
                    const npcEntity = currentTarget as NpcEntity;

                    // Update NPC's opinion of player
                    const currentOpinion = npcEntity.memory?.opinionOfPlayer || 0;
                    const newOpinion = Math.max(-100, Math.min(100, currentOpinion + trustChange));

                    const updatedNpc = {
                        ...npcEntity,
                        memory: {
                            ...npcEntity.memory,
                            opinionOfPlayer: newOpinion
                        }
                    };

                    // Update NPC via callback
                    if (onUpdateNpc) {
                        onUpdateNpc(updatedNpc);
                    }

                    // Show floating text for trust gain
                    const screenCenterX = window.innerWidth / 2;
                    const screenCenterY = window.innerHeight / 2 + 40;
                    showFloatingText(`+${trustChange} Trust with ${npcEntity.name}`, 'info', screenCenterX, screenCenterY, 3000);
                }

                // Update player character via callback
                if (onUpdatePlayer) {
                    onUpdatePlayer(updatedCharacter);
                }

                // Check if reputation has hit zero - trigger jail scenario
                if (newReputation <= 0 && response.shouldCallAuthorities) {
                    setTimeout(() => {
                        onClose(history);
                        // TODO: Trigger arrest scenario
                    }, 2000);
                }
            } else if ((response as any).coinsEarned) {
                // Handle work payment without reputation change
                const updatedCharacter = {
                    ...playerCharacter,
                    currency: (playerCharacter.currency || 0) + (response as any).coinsEarned
                };

                const screenCenterX = window.innerWidth / 2;
                const screenCenterY = window.innerHeight / 2;
                showFloatingText(`+${(response as any).coinsEarned} Coins`, 'gold', screenCenterX, screenCenterY + 20, 3000);

                if (onUpdatePlayer) {
                    onUpdatePlayer(updatedCharacter);
                }
            }
            
            // Handle NPC wanting to attack or leave with countdown
            if (response.shouldAttack || response.shouldLeave) {
                const currentReputation = isNpc(currentTarget) ? (currentTarget.memory?.opinionOfPlayer || 0) : 0;
                const repChange = response.reputationChange || 0;

                // Determine if this should escalate to combat
                const shouldAttack = response.shouldAttack ||
                    (isNpc(currentTarget) && shouldEscalateToCombat(currentTarget, repChange, currentReputation));

                // Determine the reason for leaving/attacking
                let reason: 'disgust' | 'fear' | 'offense' | 'attack';
                if (shouldAttack) {
                    reason = 'attack';
                    flashPortrait('scowl', 2000);
                } else if (repChange <= -30) {
                    reason = 'disgust';
                } else if (repChange <= -20) {
                    reason = 'offense';
                } else {
                    reason = 'fear';
                }

                console.log(`[Exit Countdown] ${currentTarget.name} ${shouldAttack ? 'attacking' : 'leaving'} due to ${reason}`);

                // Update NPC escalation level
                if (isNpc(currentTarget)) {
                    const updatedNpc = updateNpcEscalationLevel(currentTarget, repChange, currentReputation);

                    // Mark that NPC has walked away (if not attacking)
                    if (!shouldAttack) {
                        updatedNpc.hasWalkedAway = true;
                        updatedNpc.lastConfrontationTimestamp = Date.now();
                        updatedNpc.isHostile = false;
                        updatedNpc.wasThreatenedByWeapon = false;
                        updatedNpc.aiState = 'hostile_fleeing';
                    }

                    // Update the NPC in game state
                    if (onUpdateNpc) {
                        onUpdateNpc(updatedNpc);
                    }
                }

                // Show exit countdown
                setExitingNpc({
                    npcName: currentTarget.name,
                    reason,
                    countdown: 3
                });

                // Start countdown timer
                let currentCount = 3;
                const countdownInterval = setInterval(() => {
                    currentCount--;
                    if (currentCount <= 0) {
                        clearInterval(countdownInterval);

                        // After countdown, take action
                        if (shouldAttack) {
                            onInitiateCombat(target);
                        }
                        onClose(history);
                        setExitingNpc(null);
                    } else {
                        setExitingNpc(prev => prev ? { ...prev, countdown: currentCount } : null);
                    }
                }, 1000);
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

                    // Use NPC's actual home or workplace location
                    let destination = target.homeLocation ||
                                    target.workplaceLocation ||
                                    { x: target.x + 5, y: target.y }; // Fallback to nearby location

                    let destinationName = 'my favorite spot';

                    // Determine destination based on dialogue context
                    if (target.homeLocation && (lowerResponse.includes('home') || lowerResponse.includes('house') || lowerResponse.includes('place'))) {
                        destination = target.homeLocation;
                        destinationName = `${target.name}'s home`;
                    } else if (target.workplaceLocation && (lowerResponse.includes('shop') || lowerResponse.includes('workshop') || lowerResponse.includes('work'))) {
                        destination = target.workplaceLocation;
                        destinationName = `${target.name}'s workshop`;
                    } else if (target.homeLocation) {
                        // Default to home if they have one
                        destination = target.homeLocation;
                        destinationName = `${target.name}'s home`;
                    } else if (target.workplaceLocation) {
                        // Otherwise workplace
                        destination = target.workplaceLocation;
                        destinationName = `${target.name}'s workplace`;
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

                // Check for gift-giving patterns (note to self, fix or cut this, its badly implemented)
                if (lowerResponse.includes('have a gift for you') ||
                    lowerResponse.includes('give you this') ||
                    lowerResponse.includes('take this gift') ||
                    lowerResponse.includes('here\'s a gift')) {

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
    
    // Handle giving a gift to the NPC
    const handleGiveGift = useCallback(async (item: Item) => {
        if (!isNpc(currentTarget) || !playerCharacter || !mapData) return;

        setIsGiftingInProgress(true);
        setShowGiftModal(false);

        try {
            // Generate LLM reaction
            const reaction = await generateGiftReaction(
                currentTarget as NpcEntity,
                item,
                playerCharacter,
                mapData,
                history.length
            );

            // Map reputation change to expression
            const expr = mapRepDeltaToExpr(reaction.reputationChange);
            if (expr) flashPortrait(expr, 30000);

            // Update reputation
            if (reaction.reputationChange !== 0) {
                setReputationChange(reaction.reputationChange);
                setTimeout(() => setReputationChange(null), 30000);
            }

            // Calculate new inventories (without mutation)
            let newPlayerInventory = playerCharacter.inventory ? [...playerCharacter.inventory] : [];
            const itemIndex = newPlayerInventory.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
                if (item.quantity && item.quantity > 1) {
                    // Decrement quantity
                    newPlayerInventory[itemIndex] = {
                        ...newPlayerInventory[itemIndex],
                        quantity: (newPlayerInventory[itemIndex].quantity || 1) - 1
                    };
                } else {
                    // Remove item completely
                    newPlayerInventory.splice(itemIndex, 1);
                }
            }

            // Calculate new NPC inventory
            const npcTarget = currentTarget as NpcEntity;
            let newNpcInventory = npcTarget.inventory ? [...npcTarget.inventory] : [];
            const existingItemIndex = newNpcInventory.findIndex(i => i.id === item.id);
            if (existingItemIndex !== -1) {
                // Item exists, increment quantity
                newNpcInventory[existingItemIndex] = {
                    ...newNpcInventory[existingItemIndex],
                    quantity: (newNpcInventory[existingItemIndex].quantity || 1) + 1
                };
            } else {
                // Item doesn't exist, add it
                newNpcInventory.push({ ...item, quantity: 1 });
            }

            // Create updated player character with new reputation and inventory
            const oldReputation = playerCharacter.mapReputation || 50;
            const newReputation = Math.max(0, Math.min(100, oldReputation + reaction.reputationChange));

            const updatedPlayerCharacter = {
                ...playerCharacter,
                mapReputation: newReputation,
                reputation: Math.min(100, (playerCharacter.reputation || 50) + reaction.reputationChange),
                inventory: newPlayerInventory
            };

            // Create updated NPC with new inventory
            const updatedNpc: NpcEntity = {
                ...npcTarget,
                inventory: newNpcInventory
            };

            // Update player state through parent callback
            if (onUpdatePlayer) {
                onUpdatePlayer(updatedPlayerCharacter);
            }

            // Add gift interaction to history
            const playerGiftEntry: DialogueEntry = {
                speaker: 'player',
                text: `[Gives ${item.name} to ${currentTarget.name}]`,
                timestamp: new Date()
            };

            const npcReactionEntry: DialogueEntry = {
                speaker: 'npc',
                text: reaction.text,
                timestamp: new Date()
            };

            setHistory(prev => [...prev, playerGiftEntry, npcReactionEntry]);

            // Update NPC in parent state
            if (onUpdateNpc) {
                onUpdateNpc(updatedNpc);
            }

        } catch (error) {
            console.error('[Gift] Error handling gift transaction:', error);
            console.error('[Gift] Context:', {
                npcName: currentTarget.name,
                itemName: item.name,
                hasMapData: !!mapData,
                hasPlayerCharacter: !!playerCharacter
            });

            const errorEntry: DialogueEntry = {
                speaker: 'npc',
                text: `${currentTarget.name} looks confused.`,
                timestamp: new Date()
            };
            setHistory(prev => [...prev, errorEntry]);
        } finally {
            setIsGiftingInProgress(false);
        }
    }, [currentTarget, playerCharacter, mapData, flashPortrait, onUpdateNpc]);

    const handleClose = useCallback(() => {
        onClose(history);

        // Generate summary asynchronously after modal closes
        // Changed from > 1 to >= 1 to include brief single-exchange encounters (Issue #3)
        if (isNpc(target) && history.length >= 1) {
            setTimeout(async () => {
                try {
                    const summary = await summarizeConversation(history);

                    // Extract topics from conversation for quest tracking
                    const conversationText = history.map(h => h.text.toLowerCase()).join(' ');
                    const detectedTopics = new Set<string>(currentTarget.memory?.topicsDiscussed || []);

                    // Detect common quest-related topics
                    const topicKeywords = [
                        'trade', 'merchant', 'goods', 'market',
                        'war', 'battle', 'conflict', 'politics',
                        'religion', 'faith', 'temple', 'prayer',
                        'family', 'children', 'spouse', 'parents',
                        'farm', 'harvest', 'crops', 'food',
                        'illness', 'disease', 'health', 'medicine',
                        'travel', 'journey', 'road', 'distance',
                        'work', 'labor', 'craft', 'skill'
                    ];

                    topicKeywords.forEach(keyword => {
                        if (conversationText.includes(keyword)) {
                            detectedTopics.add(keyword);
                        }
                    });

                    // Create a mutable copy of the NPC to avoid frozen object errors
                    const updatedNpc = {
                        ...currentTarget,
                        memory: {
                            ...(currentTarget.memory || {}),
                            conversationSummaries: [
                                ...(currentTarget.memory?.conversationSummaries || []),
                                summary.summary
                            ].slice(-5), // Keep only last 5 conversations
                            opinionOfPlayer: summary.sentiment === 'positive'
                                ? Math.min(100, (currentTarget.memory?.opinionOfPlayer || 50) + 10)
                                : summary.sentiment === 'negative'
                                ? Math.max(0, (currentTarget.memory?.opinionOfPlayer || 50) - 10)
                                : (currentTarget.memory?.opinionOfPlayer || 50),

                            // Conversation tracking for quest system
                            conversationCount: (currentTarget.memory?.conversationCount || 0) + 1,
                            topicsDiscussed: detectedTopics,
                            lastConversationTime: Date.now()
                        }
                    };

                    // Save NPC to session storage
                    npcPersistenceService.saveNpcToSession(updatedNpc);

                    // Update the NPC in parent component
                    if (onUpdateNpc) {
                        onUpdateNpc(updatedNpc);
                    }

                    // Emit encounter_ended event for HistoryLens to pick up
                    eventBus.emit('encounter_ended', {
                        npcId: currentTarget.id,
                        npcName: currentTarget.name,
                        npcRole: currentTarget.role || currentTarget.profession,
                        summary: summary.summary,
                        sentiment: summary.sentiment,
                        exchangeCount: history.length,
                        topicsDiscussed: Array.from(detectedTopics)
                    });
                } catch (error) {
                    console.error('Failed to save conversation summary:', error);
                }
            }, 0);
        }
    }, [target, history, onClose, onUpdateNpc, currentTarget]);
    
    // Handle opening info modal without closing encounter modal
    const handleOpenInfo = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenInfo(target);
    }, [target, onOpenInfo]);
    
    return (
        <>
            <style>{styles}</style>
            <div
                data-surface="modal-overlay"
                className="modal-overlay theme-surface flex items-center justify-center p-0 sm:p-2 md:p-4"
                onClick={handleClose}
            >
                <div
                    data-surface="modal-panel"
                    className="surface-card border sm:rounded-2xl max-w-5xl w-full h-[100vh] h-[100dvh] sm:h-[95vh] sm:h-[95dvh] md:h-[90vh] transition-all duration-300 overflow-hidden flex flex-col shadow-modal"
                    style={{
                        borderColor: 'var(--border-subtle)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Exit Countdown Overlay */}
                    {exitingNpc && (
                        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in">
                            <div className="text-center space-y-6 p-8">
                                {exitingNpc.reason === 'attack' ? (
                                    <>
                                        <div className="text-4xl sm:text-5xl md:text-6xl text-red-500 font-bold animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                                            {exitingNpc.npcName} attacks you!
                                        </div>
                                        <div className="text-7xl sm:text-8xl md:text-9xl text-red-400 font-mono font-extrabold animate-pulse drop-shadow-[0_0_30px_rgba(248,113,113,0.6)]">
                                            {exitingNpc.countdown}
                                        </div>
                                        <div className="text-xl sm:text-2xl text-red-300 font-semibold">
                                            Prepare for combat!
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-3xl sm:text-4xl md:text-5xl text-yellow-400 font-bold drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                                            {exitingNpc.npcName} walks away in {exitingNpc.reason}!
                                        </div>
                                        <div className="text-6xl sm:text-7xl md:text-8xl text-yellow-300 font-mono font-extrabold drop-shadow-[0_0_25px_rgba(253,224,71,0.5)]">
                                            {exitingNpc.countdown}
                                        </div>
                                        <div className="text-lg sm:text-xl text-yellow-200 font-medium">
                                            {exitingNpc.reason === 'disgust' && 'They refuse to talk to you further.'}
                                            {exitingNpc.reason === 'offense' && 'You have offended them deeply.'}
                                            {exitingNpc.reason === 'fear' && 'They are too frightened to continue.'}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Header with reputation and language */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center gap-2 sm:gap-3 text-sm">
                            <span className="text-xl">⭐</span>
                            <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Reputation:</span>
                            <span className={`text-sm sm:text-base font-bold ${
                                playerCharacter.mapReputation >= 50 ? 'text-green-400' :
                                playerCharacter.mapReputation >= 0 ? 'text-amber-500' : 'text-red-400'
                            }`}>
                                {playerCharacter.mapReputation || 0}
                            </span>
                            <span className={`hidden sm:inline text-xs font-medium ${
                                playerCharacter.mapReputation >= 50 ? 'text-green-400' :
                                playerCharacter.mapReputation >= 0 ? 'text-amber-500' : 'text-red-400'
                            }`}>
                                {playerCharacter.mapReputation >= 50 ? 'Friendly' :
                                 playerCharacter.mapReputation >= 0 ? 'Neutral' : 'Hostile'}
                            </span>
                        </div>
                        {isNpc(target) && (
                            <button
                                onClick={() => setUseRealLanguage(p => !p)}
                                className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold tracking-wide hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                                title={`Toggle between English and ${getHistoricalLanguage(target, mapData)}`}
                            >
                                <span className="text-base">{useRealLanguage ? '🌐' : '🇬🇧'}</span>
                                <span className="hidden sm:inline">{useRealLanguage ? getHistoricalLanguage(target, mapData) : 'English'}</span>
                            </button>
                        )}
                    </div>
                    
                    {/* Main content area - responsive layout */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 flex-1 min-h-0 overflow-hidden">

                        {/* Left column - Portrait and NPC info (collapsible on mobile) */}
                        <div className={`flex flex-col gap-2.5 sm:gap-2.5 sm:min-w-[260px] sm:max-w-[300px] flex-shrink-0 transition-all duration-300`}>

                            {/* Mobile collapse button */}
                            <button
                                onClick={() => setIsCharacterPanelCollapsed(!isCharacterPanelCollapsed)}
                                className="sm:hidden flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
                                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}
                            >
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {targetName}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCharacterPanelCollapsed ? '' : 'rotate-180'}`} style={{ color: 'var(--text-secondary)' }} />
                            </button>

                            {/* Collapsed minimal view (mobile only) */}
                            {isCharacterPanelCollapsed && isNpc(target) && (
                                <div className="sm:hidden px-3">
                                    {target.memory && typeof target.memory.opinionOfPlayer === 'number' && (
                                        <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-track-bg)' }}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    target.memory.opinionOfPlayer >= 70 ? 'bg-gradient-to-r from-green-600 to-green-500' :
                                                    target.memory.opinionOfPlayer >= 50 ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                                                    target.memory.opinionOfPlayer >= 30 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
                                                    target.memory.opinionOfPlayer >= 10 ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
                                                    'bg-gradient-to-r from-red-600 to-red-500'
                                                }`}
                                                style={{ width: `${target.memory.opinionOfPlayer}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Full character panel (hidden when collapsed on mobile) */}
                            <div className={`flex flex-col gap-3 sm:gap-4 transition-all duration-300 overflow-hidden ${
                                isCharacterPanelCollapsed ? 'max-h-0 sm:max-h-none opacity-0 sm:opacity-100' : 'max-h-[2000px] opacity-100'
                            }`}>

                            {/* Portrait with quest indicator and animations */}
                            <div className="relative group">
                                <div
                                    className={`w-full aspect-square rounded-xl overflow-hidden border-3 transition-all duration-500 cursor-pointer relative ${
                                        questOffer?.hasQuest || relevantQuests.length > 0
                                            ? 'border-amber-500 shadow-lg shadow-amber-500/20 animate-pulse-subtle'
                                            : 'hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20'
                                    }`}
                                    style={(() => {
                                        // Calculate glow effect based on reputation change
                                        if (reputationChange !== null && reputationChange !== 0) {
                                            const isPositive = reputationChange > 0;
                                            const magnitude = Math.abs(reputationChange);

                                            // Determine intensity: subtle (0-15), medium (15-30), intense (30+)
                                            const glowSize = magnitude < 15 ? 8 : magnitude < 30 ? 16 : 24;
                                            const glowOpacity = magnitude < 15 ? 0.4 : magnitude < 30 ? 0.6 : 0.8;

                                            // Color: positive = emerald/green, negative = red/orange
                                            const glowColor = isPositive
                                                ? `34, 197, 94` // emerald-500 RGB
                                                : `239, 68, 68`; // red-500 RGB

                                            const borderColor = isPositive
                                                ? `rgb(34, 197, 94)` // emerald-500
                                                : `rgb(239, 68, 68)`; // red-500

                                            return {
                                                borderColor: borderColor,
                                                boxShadow: `0 0 ${glowSize}px ${glowSize / 2}px rgba(${glowColor}, ${glowOpacity}), 0 0 ${glowSize * 2}px ${glowSize}px rgba(${glowColor}, ${glowOpacity / 2})`
                                            };
                                        }

                                        // Default style when no reputation change
                                        return {
                                            borderColor: (questOffer?.hasQuest || relevantQuests.length > 0) ? undefined : 'var(--border-normal)'
                                        };
                                    })()}
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
                                            size={300}
                                            temporaryExpression={portraitExpr}
                                            onExpressionComplete={clearPortrait}
                                            isTalking={isLoading}
                                        />
                                    ) : (
                                        <AnimalPortrait
                                            animal={target as AnimalEntity}
                                            size={300}
                                            className="bg-[var(--surface-elevated)]"
                                        />
                                    )}
                                </div>
                                
                                {/* Hover tooltip */}
                                {isNpc(target) && (
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                                        Click for inner thoughts
                                    </div>
                                )}
                            </div>

                            {/* NPC Info Panel */}
                            {isNpc(target) && (
                                <div className="flex-1 sm:flex-none rounded-xl p-2.5 sm:p-2.5 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h2 className="text-lg sm:text-xl font-bold text-amber-400 dark:text-amber-300 text-center mb-2 sm:mb-2.5" style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.05em', textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
                                        {targetName}
                                    </h2>
                                    <div className="space-y-0.5 text-xs sm:text-sm">
                                        <div className="flex justify-between px-2 py-0.5 rounded transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Age:</span>
                                            <span>{target.age || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between px-2 py-0.5 rounded transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Gender:</span>
                                            <span className="capitalize">{target.gender || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between px-2 py-0.5 rounded transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Faith:</span>
                                            <span>{target.religiousAffiliation || 'Local Beliefs'}</span>
                                        </div>
                                        <div className="flex justify-between px-2 py-0.5 rounded transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Social Class:</span>
                                            <span className={`capitalize font-semibold ${
                                                (target.socialClass || 'Commoner').toLowerCase().includes('noble') || (target.socialClass || '').toLowerCase().includes('royal') ? 'text-purple-400' :
                                                (target.socialClass || '').toLowerCase().includes('merchant') || (target.socialClass || '').toLowerCase().includes('wealthy') ? 'text-blue-400' :
                                                (target.socialClass || '').toLowerCase().includes('artisan') || (target.socialClass || '').toLowerCase().includes('craftsman') ? 'text-cyan-400' :
                                                (target.socialClass || '').toLowerCase().includes('clergy') || (target.socialClass || '').toLowerCase().includes('scholar') ? 'text-amber-400' :
                                                'text-slate-300'
                                            }`}>
                                                {target.socialClass || 'Commoner'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between px-2 py-0.5 rounded transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Profession:</span>
                                            <span className={`font-medium ${
                                                (target.occupation || target.role || '').toLowerCase().includes('king') || (target.occupation || target.role || '').toLowerCase().includes('queen') || (target.occupation || target.role || '').toLowerCase().includes('emperor') ? 'text-purple-400' :
                                                (target.occupation || target.role || '').toLowerCase().includes('scholar') || (target.occupation || target.role || '').toLowerCase().includes('priest') || (target.occupation || target.role || '').toLowerCase().includes('mage') ? 'text-amber-400' :
                                                (target.occupation || target.role || '').toLowerCase().includes('merchant') || (target.occupation || target.role || '').toLowerCase().includes('trader') ? 'text-blue-400' :
                                                (target.occupation || target.role || '').toLowerCase().includes('smith') || (target.occupation || target.role || '').toLowerCase().includes('artisan') || (target.occupation || target.role || '').toLowerCase().includes('craftsman') ? 'text-cyan-400' :
                                                (target.occupation || target.role || '').toLowerCase().includes('guard') || (target.occupation || target.role || '').toLowerCase().includes('soldier') ? 'text-red-400' :
                                                'text-green-400'
                                            }`}>
                                                {target.occupation || target.role || 'Unknown'}
                                            </span>
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
                                            <div className="mt-3 p-2 rounded-lg border" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-subtle)' }}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-amber-600/80">Language:</span>
                                                    <span
                                                        className="text-xs font-medium cursor-pointer hover:text-amber-600 transition-colors underline decoration-dotted"
                                                        style={{ color: 'var(--text-primary)' }}
                                                        onClick={() => {
                                                            setSelectedLanguageId(language.id);
                                                            setShowLanguageTree(true);
                                                        }}
                                                        title="Click to explore language family tree"
                                                    >
                                                        {language.name}
                                                    </span>
                                                </div>
                                                {language.historicalContext && (
                                                    <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)', color: 'var(--text-secondary)' }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            title="View Profile (P)"
                                        >
                                            <span className="text-lg">👤</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                                                Profile (P)
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('trade')}
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)', color: 'var(--text-secondary)' }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            title="Trade Items (T)"
                                        >
                                            <span className="text-lg">💰</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                                                Trade (T)
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => onInitiateCombat(target)}
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-600 transition-all hover:-translate-y-0.5 hover:scale-105 group relative"
                                            style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}
                                            title="Attack (A)"
                                        >
                                            <span className="text-lg">⚔️</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                                                Attack (A)
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Animal Info */}
                            {!isNpc(target) && (
                                <div className="flex-1 sm:flex-none rounded-xl p-3 sm:p-4 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                    <h2 className="text-lg sm:text-2xl font-bold text-amber-600 text-center mb-2 sm:mb-3 tracking-wide">
                                        {targetName}
                                    </h2>
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between px-2 py-1 rounded transition-colors" style={{ ['--tw-bg-opacity' as any]: 1 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-card-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                                            <span style={{ color: 'var(--text-primary)' }}>Animal</span>
                                        </div>
                                        <div className="flex justify-between px-2 py-1 rounded transition-colors" onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-card-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ color: 'var(--text-muted)' }}>Species:</span>
                                            <span style={{ color: 'var(--text-primary)' }}>{target.speciesName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between px-2 py-1 rounded transition-colors" onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-card-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ color: 'var(--text-muted)' }}>Behavior:</span>
                                            <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{target.behavior || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Icons for Animals - Hidden on mobile */}
                                    <div className="hidden sm:flex justify-center gap-2 mt-4">
                                        <button 
                                            onClick={handleOpenInfo}
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-105 hover:brightness-125 group relative" style={{ background: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)', color: 'var(--text-muted)' }} data-token=""
                                            title="View Profile (P)"
                                        >
                                            <span className="text-lg">👤</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Profile (P)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('taming')}
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:scale-105 hover:brightness-125 group relative" style={{ background: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)', color: 'var(--text-muted)' }} data-token=""
                                            title="Tame Animal (T)"
                                        >
                                            <span className="text-lg">🦴</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Tame (T)
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => onInitiateCombat(target)}
                                            className="w-10 h-10 border rounded-lg flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-600 transition-all hover:-translate-y-0.5 hover:scale-105 group relative" style={{ background: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }} data-token=""
                                            title="Hunt Animal (A)"
                                        >
                                            <span className="text-lg">🏹</span>
                                            <span className="absolute -top-8 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                Hunt (A)
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            </div>
                            {/* End of collapsible wrapper */}
                        </div>

                        {/* Right column - Conversation and interactions */}
                        <div className="flex-1 flex flex-col min-h-0 h-full">
                            
                            {/* Tab Navigation - Show for both NPCs and animals */}
                                <nav className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide" style={{ paddingBottom: '1px' }}>
                                    <button
                                        onClick={() => setActiveTab('dialogue')}
                                        className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all relative whitespace-nowrap rounded-t-xl ${
                                            activeTab === 'dialogue'
                                                ? 'z-10'
                                                : 'opacity-75 hover:opacity-100'
                                        }`}
                                        style={
                                            activeTab === 'dialogue'
                                                ? {
                                                    backgroundColor: 'var(--surface-card-bg)',
                                                    color: 'var(--text-primary)',
                                                    borderTop: '2px solid var(--border-normal)',
                                                    borderLeft: '1px solid var(--border-normal)',
                                                    borderRight: '1px solid var(--border-normal)',
                                                    borderBottom: '2px solid var(--surface-card-bg)',
                                                    marginBottom: '-2px',
                                                    boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                }
                                                : {
                                                    backgroundColor: 'var(--surface-elevated)',
                                                    color: 'var(--text-secondary)',
                                                    borderTop: '1px solid var(--border-subtle)',
                                                    borderLeft: '1px solid var(--border-subtle)',
                                                    borderRight: '1px solid var(--border-subtle)',
                                                    borderBottom: '1px solid var(--border-normal)'
                                                }
                                        }
                                        onMouseEnter={e => {
                                            if (activeTab !== 'dialogue') {
                                                e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (activeTab !== 'dialogue') {
                                                e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }
                                        }}
                                    >
                                        {isNpc(target) ? 'Dialogue' : 'Communicate'}
                                    </button>
                                    {isNpc(target) && (
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                                                activeTab === 'history'
                                                    ? 'z-10'
                                                    : 'opacity-75 hover:opacity-100'
                                            }`}
                                            style={
                                                activeTab === 'history'
                                                    ? {
                                                        backgroundColor: 'var(--surface-card-bg)',
                                                        color: 'var(--text-primary)',
                                                        borderTop: '2px solid var(--border-normal)',
                                                        borderLeft: '1px solid var(--border-normal)',
                                                        borderRight: '1px solid var(--border-normal)',
                                                        borderBottom: '2px solid var(--surface-card-bg)',
                                                        marginBottom: '-2px',
                                                        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                    }
                                                    : {
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        color: 'var(--text-secondary)',
                                                        borderTop: '1px solid var(--border-subtle)',
                                                        borderLeft: '1px solid var(--border-subtle)',
                                                        borderRight: '1px solid var(--border-subtle)',
                                                        borderBottom: '1px solid var(--border-normal)'
                                                    }
                                            }
                                            onMouseEnter={e => {
                                                if (activeTab !== 'history') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                    e.currentTarget.style.color = 'var(--text-primary)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (activeTab !== 'history') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                }
                                            }}
                                        >
                                            History
                                        </button>
                                    )}
                                    {isNpc(target) && (
                                        <button
                                            onClick={() => setActiveTab('household')}
                                            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                                                activeTab === 'household'
                                                    ? 'z-10'
                                                    : 'opacity-75 hover:opacity-100'
                                            }`}
                                            style={
                                                activeTab === 'household'
                                                    ? {
                                                        backgroundColor: 'var(--surface-card-bg)',
                                                        color: 'var(--text-primary)',
                                                        borderTop: '2px solid var(--border-normal)',
                                                        borderLeft: '1px solid var(--border-normal)',
                                                        borderRight: '1px solid var(--border-normal)',
                                                        borderBottom: '2px solid var(--surface-card-bg)',
                                                        marginBottom: '-2px',
                                                        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                    }
                                                    : {
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        color: 'var(--text-secondary)',
                                                        borderTop: '1px solid var(--border-subtle)',
                                                        borderLeft: '1px solid var(--border-subtle)',
                                                        borderRight: '1px solid var(--border-subtle)',
                                                        borderBottom: '1px solid var(--border-normal)'
                                                    }
                                            }
                                            onMouseEnter={e => {
                                                if (activeTab !== 'household') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                    e.currentTarget.style.color = 'var(--text-primary)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (activeTab !== 'household') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                                }
                                            }}
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
                                        className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all relative whitespace-nowrap rounded-t-xl ${
                                            activeTab === 'trade' || activeTab === 'taming'
                                                ? 'z-10'
                                                : 'opacity-75 hover:opacity-100'
                                        } ${
                                            isNpc(target) && !tradeEnabled ? 'cursor-not-allowed !opacity-50' : ''
                                        } ${showTradeUnlockAnimation && isNpc(target) ? 'amber-glow-animation' : ''}`}
                                        style={
                                            activeTab === 'trade' || activeTab === 'taming'
                                                ? {
                                                    backgroundColor: 'var(--surface-card-bg)',
                                                    color: isNpc(target) ? '#f59e0b' : 'var(--text-primary)',
                                                    borderTop: '2px solid var(--border-normal)',
                                                    borderLeft: '1px solid var(--border-normal)',
                                                    borderRight: '1px solid var(--border-normal)',
                                                    borderBottom: '2px solid var(--surface-card-bg)',
                                                    marginBottom: '-2px',
                                                    boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                }
                                                : {
                                                    backgroundColor: 'var(--surface-elevated)',
                                                    color: isNpc(target) && !tradeEnabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                                                    borderTop: '1px solid var(--border-subtle)',
                                                    borderLeft: '1px solid var(--border-subtle)',
                                                    borderRight: '1px solid var(--border-subtle)',
                                                    borderBottom: '1px solid var(--border-normal)'
                                                }
                                        }
                                        onMouseEnter={e => {
                                            if ((activeTab !== 'trade' && activeTab !== 'taming') && (!isNpc(target) || tradeEnabled)) {
                                                e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if ((activeTab !== 'trade' && activeTab !== 'taming') && (!isNpc(target) || tradeEnabled)) {
                                                e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }
                                        }}
                                        title={isNpc(target) && !tradeEnabled ? 'Trade not available yet' : undefined}
                                    >
                                        {isNpc(target) ? (
                                            <>
                                                <span>Trade</span>
                                                {!tradeEnabled && !showTradeUnlockAnimation && (
                                                    <span className="ml-1 text-xs">🔒</span>
                                                )}
                                                {showTradeUnlockAnimation && (
                                                    <span className="ml-1 text-xs unlock-animation absolute">🔒</span>
                                                )}
                                            </>
                                        ) : 'Tame'}
                                    </button>
                                    {(questOffer?.hasQuest || relevantQuests.length > 0) && (
                                        <button
                                            onClick={() => setActiveTab('quest')}
                                            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap rounded-t-xl ${
                                                activeTab === 'quest'
                                                    ? 'z-10'
                                                    : 'opacity-75 hover:opacity-100'
                                            }`}
                                            style={
                                                activeTab === 'quest'
                                                    ? {
                                                        backgroundColor: 'var(--surface-card-bg)',
                                                        color: '#f59e0b',
                                                        borderTop: '2px solid var(--border-normal)',
                                                        borderLeft: '1px solid var(--border-normal)',
                                                        borderRight: '1px solid var(--border-normal)',
                                                        borderBottom: '2px solid var(--surface-card-bg)',
                                                        marginBottom: '-2px',
                                                        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                    }
                                                    : {
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        color: '#fbbf24',
                                                        borderTop: '1px solid var(--border-subtle)',
                                                        borderLeft: '1px solid var(--border-subtle)',
                                                        borderRight: '1px solid var(--border-subtle)',
                                                        borderBottom: '1px solid var(--border-normal)'
                                                    }
                                            }
                                            onMouseEnter={e => {
                                                if (activeTab !== 'quest') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                    e.currentTarget.style.color = '#f59e0b';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (activeTab !== 'quest') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                    e.currentTarget.style.color = '#fbbf24';
                                                }
                                            }}
                                        >
                                            <span className="text-base">⚡</span>
                                            Quests
                                        </button>
                                    )}
                                    {isNpc(target) && (
                                        <button
                                            onClick={() => setActiveTab('source')}
                                            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap rounded-t-xl ${
                                                activeTab === 'source'
                                                    ? 'z-10'
                                                    : 'opacity-75 hover:opacity-100'
                                            }`}
                                            style={
                                                activeTab === 'source'
                                                    ? {
                                                        backgroundColor: 'var(--surface-card-bg)',
                                                        color: '#a78bfa',
                                                        borderTop: '2px solid var(--border-normal)',
                                                        borderLeft: '1px solid var(--border-normal)',
                                                        borderRight: '1px solid var(--border-normal)',
                                                        borderBottom: '2px solid var(--surface-card-bg)',
                                                        marginBottom: '-2px',
                                                        boxShadow: '0 -2px 12px rgba(0,0,0,0.15)'
                                                    }
                                                    : {
                                                        backgroundColor: 'var(--surface-elevated)',
                                                        color: '#c4b5fd',
                                                        borderTop: '1px solid var(--border-subtle)',
                                                        borderLeft: '1px solid var(--border-subtle)',
                                                        borderRight: '1px solid var(--border-subtle)',
                                                        borderBottom: '1px solid var(--border-normal)'
                                                    }
                                            }
                                            onMouseEnter={e => {
                                                if (activeTab !== 'source') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-hover-bg)';
                                                    e.currentTarget.style.color = '#a78bfa';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (activeTab !== 'source') {
                                                    e.currentTarget.style.backgroundColor = 'var(--surface-muted-bg)';
                                                    e.currentTarget.style.color = '#c4b5fd';
                                                }
                                            }}
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
                            <div className="flex-1 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 overflow-y-auto conversation-scrollbar min-h-0 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                {activeTab === 'dialogue' && (
                                    <div className="space-y-5">
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
                                                {/* NPC Memory Banner - shows at conversation start if NPC remembers player */}
                                                {isNpc(currentTarget) && currentTarget.memory && (
                                                  currentTarget.memory.conversationSummaries?.length > 0 ||
                                                  currentTarget.memory.knownFactsAboutPlayer?.size > 0
                                                ) && (
                                                  <div className="mb-4 p-3 rounded-lg border bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border-indigo-500/30">
                                                    <div className="flex items-start gap-2">
                                                      <span className="text-indigo-400 text-lg">🧠</span>
                                                      <div className="flex-1">
                                                        <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                                                          {currentTarget.name} remembers you
                                                        </p>
                                                        <p className="text-sm text-indigo-200/80 italic">
                                                          {(() => {
                                                            // Generate contextual memory summary
                                                            const opinion = currentTarget.memory.opinionOfPlayer ?? 50;
                                                            const summaries = currentTarget.memory.conversationSummaries || [];
                                                            const facts = currentTarget.memory.knownFactsAboutPlayer ? Array.from(currentTarget.memory.knownFactsAboutPlayer) : [];

                                                            // Check for specific facts
                                                            const wasThreated = facts.some(f => f.includes('THREATENED'));
                                                            const wasAttacked = facts.some(f => f.includes('ATTACKED'));
                                                            const fledCombat = facts.some(f => f.includes('FLED_COMBAT'));
                                                            const wasHelped = facts.some(f => f.includes('HELPED'));
                                                            const tradeHistory = facts.some(f => f.includes('TRADE'));

                                                            // Build memory description
                                                            if (wasAttacked) {
                                                              return "Eyes you with fear and hostility - you attacked " + (currentTarget.gender === 'female' ? 'her' : 'him') + " before.";
                                                            } else if (wasThreated) {
                                                              return "Watches you warily - you threatened " + (currentTarget.gender === 'female' ? 'her' : 'him') + " in the past.";
                                                            } else if (fledCombat) {
                                                              return "Remembers when you fled from a confrontation.";
                                                            } else if (opinion >= 70) {
                                                              return "Greets you warmly - you have built a good relationship." + (tradeHistory ? " You have traded before." : "");
                                                            } else if (opinion >= 50) {
                                                              return "Recognizes you from previous conversations." + (tradeHistory ? " You have done business together." : "");
                                                            } else if (opinion >= 30) {
                                                              return "Regards you with some caution - your past interactions were not entirely positive.";
                                                            } else {
                                                              return "Clearly dislikes you based on previous encounters.";
                                                            }
                                                          })()}
                                                        </p>
                                                        {/* Last conversation summary if available */}
                                                        {currentTarget.memory.conversationSummaries && currentTarget.memory.conversationSummaries.length > 0 && (
                                                          <p className="text-xs text-indigo-300/60 mt-1.5">
                                                            Last spoke: "{currentTarget.memory.conversationSummaries[currentTarget.memory.conversationSummaries.length - 1].slice(0, 80)}..."
                                                          </p>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                {history.map((entry, index) => (
                                                    <div key={index} className="dialogue-entry">
                                                        {entry.speaker === 'system' ? (
                                                            // System messages (trades, etc.)
                                                            <div className="flex justify-center my-3">
                                                                <div className="px-3 py-1 border rounded text-xs font-mono uppercase tracking-wider" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)', color: 'var(--text-secondary)' }}>
                                                                    {entry.text}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Regular dialogue
                                                            <div className="flex items-start gap-3 pb-5 border-b border-opacity-30" style={{ borderColor: 'var(--border-subtle)' }}>
                                                                <div className="flex-1">
                                                                    <div className="flex items-baseline gap-2 mb-2.5">
                                                                        <span className={`font-bold ${
                                                                            entry.speaker === 'player'
                                                                                ? 'text-emerald-400 dark:text-emerald-300 text-base'
                                                                                : 'text-amber-500 dark:text-amber-400 text-sm'
                                                                        }`} style={{
                                                                            fontFamily: entry.speaker === 'player' ? 'system-ui, -apple-system, sans-serif' : '"Press Start 2P", monospace',
                                                                            letterSpacing: entry.speaker === 'player' ? 'normal' : '0.05em',
                                                                            textShadow: entry.speaker === 'player' ? 'none' : '1px 1px 0px rgba(0,0,0,0.2)'
                                                                        }}>
                                                                            {entry.speaker === 'player' ? 'You' : targetName}
                                                                        </span>
                                                                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                                            <Clock className="w-3 h-3" />
                                                                            {getTimeAgo(entry.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-base sm:text-[17px] leading-relaxed" style={{
                                                                        color: 'var(--text-primary)',
                                                                        lineHeight: '1.75',
                                                                        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                                                                        letterSpacing: '0.01em'
                                                                    }}>
                                                                        {entry.translations && entry.language ? (
                                                                            // Render with translatable words
                                                                            parseDialogueWithTranslations(entry.text, entry.translations, entry.language)
                                                                        ) : (
                                                                            // Regular highlighted text
                                                                            <HighlightedText
                                                                                text={entry.text}
                                                                                era={currentEra}
                                                                                zone={culturalZone}
                                                                                onKeywordClick={(source) => setSelectedPrimarySource(source)}
                                                                            />
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Quest hint for relevant dialogue */}
                                                        {relevantQuests.length > 0 && entry.speaker === 'npc' && index === history.length - 1 && (
                                                            <div className="mt-2 pl-4 border-l-2 border-amber-500/50">
                                                                <p className="text-xs text-amber-600/80">
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
                                                                <p className="text-sm text-amber-600 flex items-center gap-2">
                                                                    <span className="text-amber-500">💰</span>
                                                                    {tradeStatusMessage}
                                                                    <span className="text-xs text-amber-600/70 ml-auto">(Click to open trade)</span>
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
                                        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-normal)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                                                    <Heart className="w-6 h-6 text-green-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-green-400">
                                                        Taming {targetName}
                                                    </h3>
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        Build trust through careful approach
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Attempts</p>
                                                <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{tamingAttempts}/2</p>
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
                                        <div className="rounded-lg p-4" style={{ background: 'var(--surface-card-bg)', border: '1px solid var(--surface-card-border)' }}>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Species</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {target.emoji} {target.speciesName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Estimated Value</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>
                                                        {calculateAnimalValue(target, playerCharacter?.year || 1500)} coins
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Temperament</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {target.health && target.health > 70 ? 'Healthy' :
                                                         target.health && target.health > 40 ? 'Cautious' : 'Nervous'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Difficulty</p>
                                                    <div className="flex gap-1">
                                                        {[1,2,3].map(i => (
                                                            <div
                                                                key={i}
                                                                className={`w-2 h-2 rounded-full ${
                                                                    i <= (target.level || 1)
                                                                        ? 'bg-orange-400'
                                                                        : ''
                                                                }`}
                                                                style={i > (target.level || 1) ? { background: 'var(--border-normal)' } : undefined}
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
                                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                Describe your taming approach:
                                            </label>
                                            <div className="flex-1 min-h-[100px] relative">
                                                <textarea
                                                    value={tamingApproach}
                                                    onChange={(e) => setTamingApproach(e.target.value)}
                                                    className="w-full h-full px-4 py-3 rounded-lg resize-none focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                                                    style={{ background: 'var(--surface-card-bg)', border: '1px solid var(--border-normal)', color: 'var(--text-primary)' }}
                                                    placeholder={
                                                        tamingAttempts === 0 
                                                            ? "e.g., 'I slowly approach with open palms, speaking softly and offering food...'"
                                                            : "The animal seems interested. Try a different approach..."
                                                    }
                                                    disabled={tamingInProgress}
                                                />
                                                {tamingApproach.length > 0 && (
                                                    <div className="absolute bottom-2 right-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        {tamingApproach.length} characters
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Tips */}
                                            <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-normal)' }}>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    💡 <span className="font-medium">Tips:</span> Mention food, gentle movements, 
                                                    patience, and understanding of the animal's nature. Different species respond 
                                                    to different approaches!
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-normal)' }}>
                                            <button
                                                onClick={handleTame}
                                                disabled={!tamingApproach.trim() || tamingInProgress}
                                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                                    !tamingApproach.trim() || tamingInProgress
                                                        ? 'cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:scale-[1.02] active:scale-[0.98]'
                                                }`}
                                                style={!tamingApproach.trim() || tamingInProgress ? { background: 'var(--surface-muted-bg)', color: 'var(--text-muted)' } : undefined}
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
                                                className="px-6 py-3 rounded-lg font-medium transition-all hover:brightness-110"
                                                style={{ background: 'var(--surface-muted-bg)', color: 'var(--text-secondary)' }}
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
                                        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-normal)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                                                    <Book className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-purple-400">
                                                        Present a Document
                                                    </h3>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        Share a text for {targetName} to discuss
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Source submission form */}
                                        {!sourceDiscussionResult ? (
                                            <div className="space-y-4">
                                                {/* Source type toggle */}
                                                <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-muted-bg)' }}>
                                                    <button
                                                        onClick={() => setSourceType('text')}
                                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                                            sourceType === 'text'
                                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                                : ''
                                                        }`}
                                                        style={sourceType !== 'text' ? { color: 'var(--text-secondary)' } : undefined}
                                                        onMouseEnter={e => { if (sourceType !== 'text') e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                        onMouseLeave={e => { if (sourceType !== 'text') e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                    >
                                                        <FileText className="w-4 h-4 inline mr-2" />
                                                        New Text
                                                    </button>
                                                    <button
                                                        onClick={() => setSourceType('journal')}
                                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                                            sourceType === 'journal'
                                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                                                                : ''
                                                        }`}
                                                        style={sourceType !== 'journal' ? { color: 'var(--text-secondary)' } : undefined}
                                                        onMouseEnter={e => { if (sourceType !== 'journal') e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                        onMouseLeave={e => { if (sourceType !== 'journal') e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                                    >
                                                        <Book className="w-4 h-4 inline mr-2" />
                                                        Journal Entry
                                                    </button>
                                                </div>

                                                {sourceType === 'text' ? (
                                                    <>
                                                        {/* Title input */}
                                                        <div>
                                                            <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Document Title</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g., 'Magna Carta' or 'Ancient Scroll'"
                                                                value={sourceTitle}
                                                                onChange={(e) => setSourceTitle(e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-400"
                                                                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}
                                                            />
                                                        </div>

                                                        {/* Content textarea */}
                                                        <div>
                                                            <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                                                                Document Text (paste or type)
                                                            </label>
                                                            <textarea
                                                                placeholder="Paste the text you want to discuss..."
                                                                value={sourceContent}
                                                                onChange={(e) => setSourceContent(e.target.value)}
                                                                rows={8}
                                                                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-400 resize-none"
                                                                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Journal entry selection */
                                                    <div>
                                                        <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Select Journal Entry</label>
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
                                                                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-400"
                                                                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}
                                                            >
                                                                <option value="">Choose an entry...</option>
                                                                {availableJournalEntries.map(entry => (
                                                                    <option key={entry.id} value={entry.id}>
                                                                        {entry.title || `${entry.date} - ${entry.location}`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="text-sm italic p-4 rounded-lg" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-muted-bg)' }}>
                                                                No journal entries yet. Write in your journal first!
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Notes input - shown for both types */}
                                                <div>
                                                    <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                                                        Your Notes (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Why you want to discuss this..."
                                                        value={sourceNotes}
                                                        onChange={(e) => setSourceNotes(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-purple-400"
                                                        style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}
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
                                                <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <span className="text-2xl">{target.emoji || '👤'}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-amber-600 mb-2">
                                                                {targetName} responds:
                                                            </p>
                                                            <p className="leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
                                                                "{sourceDiscussionResult}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Follow-up questions for multi-turn conversation */}
                                                {followUpQuestions.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ask a follow-up question:</p>
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
                                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:text-purple-400 hover:border-purple-500/50 transition-all hover:brightness-110"
                                                                style={{ color: 'var(--text-secondary)', background: 'var(--surface-card-bg)', border: '1px solid var(--border-normal)' }}
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
                                    <div className="space-y-4" style={{ color: 'var(--text-primary)' }}>
                                        {/* Opinion Meter - Relationship Status */}
                                        {(() => {
                                            // TODO: Implement per-NPC opinion tracking in social graph
                                            // For now, initialize from reputation (48 = neutral) and store in target.memory.opinionOfPlayer
                                            // Future: Track relationship changes over time, store in dedicated relationship system
                                            const opinionValue = currentTarget.memory?.opinionOfPlayer ?? (playerCharacter.mapReputation || 48);

                                            return (
                                                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Heart className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                            Their Opinion of You
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className={`text-lg font-bold ${
                                                                opinionValue >= 70 ? 'text-green-400' :
                                                                opinionValue >= 50 ? 'text-blue-400' :
                                                                opinionValue >= 30 ? 'text-yellow-400' :
                                                                opinionValue >= 10 ? 'text-orange-400' :
                                                                'text-red-400'
                                                            }`}>
                                                                {opinionValue >= 70 ? 'Friendly' :
                                                                 opinionValue >= 50 ? 'Warm' :
                                                                 opinionValue >= 30 ? 'Neutral' :
                                                                 opinionValue >= 10 ? 'Cold' :
                                                                 'Hostile'}
                                                            </span>
                                                            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                                                                {opinionValue}/100
                                                            </span>
                                                        </div>

                                                        {/* Opinion bar (0-100 scale) */}
                                                        <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-track-bg)' }}>
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    opinionValue >= 70 ? 'bg-gradient-to-r from-green-600 to-green-500' :
                                                                    opinionValue >= 50 ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                                                                    opinionValue >= 30 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
                                                                    opinionValue >= 10 ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
                                                                    'bg-gradient-to-r from-red-600 to-red-500'
                                                                }`}
                                                                style={{ width: `${opinionValue}%` }}
                                                            />
                                                        </div>

                                                        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                                                            {opinionValue >= 70 ? 'They genuinely like you and trust you.' :
                                                             opinionValue >= 50 ? 'They have a positive impression of you.' :
                                                             opinionValue >= 30 ? 'They are neutral toward you.' :
                                                             opinionValue >= 10 ? 'They are wary or suspicious of you.' :
                                                             'They actively dislike you.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Conversation History */}
                                        {currentTarget.memory?.conversationSummaries && currentTarget.memory.conversationSummaries.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-normal)' }}>
                                                    <ScrollText className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                        Previous Conversations
                                                    </h3>
                                                </div>
                                                {currentTarget.memory.conversationSummaries.map((summary, index) => (
                                                    <div key={index} className="rounded-lg p-4 text-sm border transition-colors hover:border-opacity-100" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-subtle)' }}>
                                                        <div className="flex items-start gap-2">
                                                            <span style={{ color: 'var(--text-muted)' }} className="mt-0.5">•</span>
                                                            <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{summary}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
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
                                let inputClassName = "flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all input-glow";
                                let inputStyle = {
                                    color: 'var(--text-primary)',
                                    backgroundColor: 'var(--surface-muted-bg)',
                                    borderColor: 'var(--border-normal)'
                                };

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

                                        {/* Work Offer UI */}
                                        {workOffer && !workOffer.accepted && (
                                            <div className="mb-3 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg animate-slide-up">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <span className="text-2xl">💼</span>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-blue-300 mb-1">Work Offer</h3>
                                                        <p className="text-sm text-slate-200 mb-2">{workOffer.description}</p>

                                                        <div className="space-y-1 text-xs text-slate-400 mb-3">
                                                            {workOffer.targetLocation && (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin size={12} />
                                                                    <span>Location: {workOffer.targetLocation.name}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <span>💰</span>
                                                                <span className="text-amber-600 font-semibold">Payment: {workOffer.payment} coins</span>
                                                            </div>
                                                            {workOffer.deadline && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    <span>Deadline: {workOffer.deadline} hours</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    workOffer.accepted = true;
                                                                    addWorkOffer(workOffer);
                                                                    const workOfferId = workOffer.id;
                                                                    showToast(`Accepted work from ${workOffer.npcName}`);

                                                                    // Add work acceptance to conversation history
                                                                    const acceptanceEntry: DialogueEntry = {
                                                                        speaker: 'system',
                                                                        text: `${playerCharacter.name} accepted the work offer: "${workOffer.description}"`,
                                                                        timestamp: new Date()
                                                                    };
                                                                    const updatedHistory = [...history, acceptanceEntry];

                                                                    setWorkOffer(null);

                                                                    // Dispatch event for quest panel refresh
                                                                    window.dispatchEvent(new CustomEvent('workOfferAccepted', { detail: { offerId: workOfferId } }));

                                                                    // Close encounter modal with full history and open quest panel with highlight
                                                                    onClose(updatedHistory);
                                                                    openQuestPanelWithWorkOffer(workOfferId);
                                                                }}
                                                                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                                            >
                                                                ✓ Accept
                                                            </button>
                                                            <button
                                                                onClick={() => setWorkOffer(null)}
                                                                className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors hover:brightness-110"
                                                                style={{ background: 'var(--surface-muted-bg)', color: 'var(--text-primary)' }}
                                                            >
                                                                ✗ Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Completable Work Offers */}
                                        {isNpc(currentTarget) && completableOffers.map(offer => (
                                            <div key={offer.id} className="mb-3 p-4 bg-green-900/20 border border-green-500/50 rounded-lg animate-slide-up">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-green-300 font-semibold flex items-center gap-2">
                                                        <span className="text-2xl">✓</span>
                                                        <span>Work Complete!</span>
                                                    </h4>
                                                    <span className="text-yellow-300 font-mono text-lg">+{offer.payment} coins</span>
                                                </div>

                                                <p className="text-green-200/80 text-sm mb-3">{offer.description}</p>

                                                {/* Show what will be taken for exploration quests */}
                                                {offer.taskType === 'explore_location' && playerCharacter.inventory && playerCharacter.inventory.length > 0 && (
                                                    <div className="text-xs text-green-300/70 mb-3 flex items-center gap-1">
                                                        <span>📦</span>
                                                        <span>Will take: {playerCharacter.inventory[playerCharacter.inventory.length - 1]?.name || 'most recent item from inventory'}</span>
                                                    </div>
                                                )}

                                                {/* Show what will be taken for item-based quests */}
                                                {offer.requiredItem && (
                                                    <div className="text-xs text-green-300/70 mb-3 flex items-center gap-1">
                                                        <span>📦</span>
                                                        <span>Will take: {offer.requiredQuantity || 1}x {offer.requiredItem}</span>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        const result = completeWorkOffer(
                                                            offer,
                                                            playerCharacter,
                                                            (newInventory) => {
                                                                onUpdatePlayer?.({
                                                                    ...playerCharacter,
                                                                    inventory: newInventory
                                                                });
                                                            }
                                                        );

                                                        if (result.success) {
                                                            // Add coins
                                                            const newCurrency = getPlayerCurrency(playerCharacter) + result.coinsEarned;
                                                            onUpdatePlayer?.({
                                                                ...playerCharacter,
                                                                currency: newCurrency
                                                            });

                                                            // Mark as completed
                                                            updateWorkOffer({ ...offer, completed: true });

                                                            // Add to history
                                                            const completionEntry: DialogueEntry = {
                                                                speaker: 'system',
                                                                text: `${playerCharacter.name} completed the work: "${offer.description}". Payment: ${offer.payment} coins.${result.itemTaken ? ` (Took ${result.itemTaken})` : ''}`,
                                                                timestamp: new Date()
                                                            };
                                                            setHistory(prev => [...prev, completionEntry]);

                                                            // Show toast
                                                            showToast(result.message, 'success');

                                                            // Dispatch event
                                                            window.dispatchEvent(new CustomEvent('workOfferCompleted', {
                                                                detail: { offerId: offer.id }
                                                            }));
                                                        } else {
                                                            showToast(result.message, 'error');
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <span>✓</span>
                                                    <span>Complete Work & Collect {offer.payment} Coins</span>
                                                </button>
                                            </div>
                                        ))}

                                        {/* Active Work Offers - Partial Delivery UI */}
                                        {isNpc(currentTarget) && (() => {
                                            const activeOffers = getWorkOffersForNpc(currentTarget.id).filter(
                                                offer => offer.accepted && !offer.completed && !offer.failed && offer.requiredItem
                                            );

                                            if (activeOffers.length === 0) return null;

                                            return activeOffers.map(offer => {
                                                const deliveredSoFar = offer.deliveredQuantity || 0;
                                                const totalRequired = offer.requiredQuantity || 1;
                                                const remaining = totalRequired - deliveredSoFar;

                                                // Calculate how many the player has
                                                const playerHas = playerCharacter.inventory?.filter(
                                                    item => item.name.toLowerCase() === offer.requiredItem?.toLowerCase()
                                                ).reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

                                                const maxCanDeliver = Math.min(playerHas, remaining);
                                                const currentQuantity = deliveryQuantities[offer.id] || 1;

                                                return (
                                                    <div key={offer.id} className="mb-3 p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg animate-slide-up">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-2xl">📦</span>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-purple-300 mb-1">Active Work: {offer.description}</h3>

                                                                <div className="space-y-2 text-sm">
                                                                    {/* Progress Bar */}
                                                                    <div>
                                                                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                                                                            <span>Progress: {deliveredSoFar} / {totalRequired} {offer.requiredItem}</span>
                                                                            <span>{Math.round((deliveredSoFar / totalRequired) * 100)}%</span>
                                                                        </div>
                                                                        <div className="w-full rounded-full h-2" style={{ background: 'var(--surface-track-bg, var(--border-normal))' }}>
                                                                            <div
                                                                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                                                                style={{ width: `${(deliveredSoFar / totalRequired) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Player Inventory Status */}
                                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                                        You have: <span className="font-semibold" style={{ color: 'var(--color-info)' }}>{playerHas} {offer.requiredItem}</span>
                                                                        {playerHas < remaining && (
                                                                            <span className="text-amber-600 ml-2">(Need {remaining - playerHas} more)</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Delivery Controls */}
                                                                    {playerHas > 0 && remaining > 0 && (
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Deliver:</label>
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                max={maxCanDeliver}
                                                                                value={currentQuantity}
                                                                                onChange={(e) => {
                                                                                    const val = parseInt(e.target.value) || 1;
                                                                                    const clamped = Math.max(1, Math.min(maxCanDeliver, val));
                                                                                    setDeliveryQuantities(prev => ({ ...prev, [offer.id]: clamped }));
                                                                                }}
                                                                                className="w-20 px-2 py-1 rounded text-sm"
                                                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-normal)', color: 'var(--text-primary)' }}
                                                                            />
                                                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {maxCanDeliver} available</span>
                                                                            <button
                                                                                onClick={() => handlePartialDelivery(offer)}
                                                                                disabled={currentQuantity > maxCanDeliver || currentQuantity < 1}
                                                                                className="ml-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                                                            >
                                                                                Deliver Items
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {/* Payment Info */}
                                                                    <div className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                                                                        <span>💰</span>
                                                                        <span>Payment when complete: {offer.payment} coins</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}

                                        {isGeneratingWork && (
                                            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                                                <div className="text-sm text-blue-300 flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                                    <span>Considering work opportunities...</span>
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
                                                style={inputStyle}
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
                    
                    {/* Footer bar with Gift and Leave buttons */}
                    <div className="border-t px-3 sm:px-6 flex-shrink-0" style={{
                        paddingTop: '6px',
                        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
                        backgroundColor: 'var(--surface-muted-bg)',
                        borderColor: 'var(--border-normal)'
                    }}>
                        <div className="flex justify-between items-center gap-3">
                            {/* Gift button (only for NPCs) */}
                            {isNpc(target) && (
                                <button
                                    onClick={() => setShowGiftModal(true)}
                                    disabled={npcWantsToLeave || isGiftingInProgress}
                                    className="ff-action-button bg-purple-600 hover:bg-purple-500 disabled:opacity-40"
                                    style={{
                                        minWidth: '100px'
                                    }}
                                >
                                    🎁 Give Gift
                                </button>
                            )}
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
                        <div className="rounded-xl p-6 max-w-md animate-slide-up" style={{ background: 'var(--surface-modal-panel-bg)', border: '1px solid rgba(251, 191, 36, 0.35)' }} onClick={e => e.stopPropagation()}>
                            <h3 className="font-semibold mb-3 text-center" style={{ color: 'var(--accent-secondary)' }}>Inner Thoughts</h3>
                            {isLoadingMonologue ? (
                                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                    <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p>Reading their mind...</p>
                                </div>
                            ) : (
                                <p className="italic leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-narrative, Georgia, serif)' }}>
                                    "{monologueText}"
                                </p>
                            )}
                            <div className="text-center mt-4">
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Click {3 - monologueClickCount} more time{3 - monologueClickCount !== 1 ? 's' : ''} for deeper thoughts
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Language Family Tree Modal */}
            {showLanguageTree && selectedLanguageId && (
                <LanguageFamilyTree
                    isOpen={showLanguageTree}
                    onClose={() => {
                        setShowLanguageTree(false);
                        setSelectedLanguageId(null);
                    }}
                    initialLanguageId={selectedLanguageId}
                    currentYear={playerCharacter?.year || 1500}
                />
            )}

            {/* Gift Selection Modal */}
            {showGiftModal && (
                <div
                    className="modal-overlay theme-surface flex items-center justify-center p-4"
                    onClick={() => setShowGiftModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        zIndex: 10000
                    }}
                >
                    <div
                        className="surface-card border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        style={{ borderColor: 'var(--border-normal)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between" style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderColor: 'var(--border-subtle)'
                        }}>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                🎁 Choose a Gift for {isNpc(currentTarget) ? currentTarget.name : 'them'}
                            </h2>
                            <button
                                onClick={() => setShowGiftModal(false)}
                                className="text-2xl hover:opacity-70 transition-opacity"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Inventory Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {playerCharacter?.inventory && playerCharacter.inventory.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {playerCharacter.inventory.map((item, idx) => (
                                        <button
                                            key={item.id || idx}
                                            onClick={() => handleGiveGift(item)}
                                            className="p-4 rounded-lg border-2 hover:border-purple-500 transition-all hover:shadow-lg group"
                                            style={{
                                                backgroundColor: 'var(--surface-elevated)',
                                                borderColor: 'var(--border-normal)',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl">{item.emoji || '📦'}</span>
                                                <div className="text-center">
                                                    <div className="font-semibold text-sm line-clamp-2">
                                                        {item.name}
                                                    </div>
                                                    {item.quantity && item.quantity > 1 && (
                                                        <div className="text-xs text-purple-400 mt-1">
                                                            ×{item.quantity}
                                                        </div>
                                                    )}
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        {item.value || 0} 💰
                                                    </div>
                                                    {item.rarity && item.rarity !== 'Common' && (
                                                        <div className={`text-xs mt-1 font-medium ${
                                                            item.rarity === 'Rare' ? 'text-blue-400' :
                                                            item.rarity === 'Ultra-rare' ? 'text-purple-400' :
                                                            item.rarity === 'Unique' ? 'text-amber-400' :
                                                            'text-gray-400'
                                                        }`}>
                                                            {item.rarity}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                                    <p className="text-lg mb-2">You have no items to give</p>
                                    <p className="text-sm">Explore the world to find items you can gift to NPCs</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t flex justify-end" style={{
                            backgroundColor: 'var(--surface-muted-bg)',
                            borderColor: 'var(--border-normal)'
                        }}>
                            <button
                                onClick={() => setShowGiftModal(false)}
                                className="ff-action-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EncounterModalUpdated;
