/**
 * hooks/useUIState.ts - Custom hook to manage all UI-related state and logic.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import {
    DevTooltipDisplayData, TileInfoModalProps, SkillResult, Item,
    EncounterableEntity, Tile, LensMode, TerrainStructure, isNpc, isAnimal, DialogueEntry,
    PlayerContext, ForageSkillResult, ChopSkillResult, SkillID, NarrationMessage, AmbianceContext, NpcEntity,
    LootModalData, PlayerCharacter, PortraitModalData, CraftingModalData, CraftingResult, DigSkillResult
} from '../types';
import { LogService } from '../services/logService';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { dispatchItemAcquired } from '../utils/itemEventDispatcher';
import { executeSkill } from '../services/skillService';
import { generateDmResponse, summarizeConversation } from '../services/llmService';
import { executeCrafting } from '../services/craftingService';
import { executeEating } from '../services/eatingService';
import { EatingResult } from '../types/eatingTypes';
import { calculateDiseaseGameplayRestrictions } from '../services/diseaseProgressionService';
import { diseaseService } from '../services/diseaseService';
import { parseDateString } from '../utils/dateUtils';
import { ANIMAL_DATA } from '../constants/index';
import { isSafari } from '../utils/safariUtils';
import { TamedAnimal } from '../services/animalTamingService';
import { specialMapNpcBehaviorService, isGuardType } from '../services/specialMapNpcBehaviorService';
import { eventBus } from '../services/eventBus';
import { broadcastEventToWitnesses, determineEventSeverity } from '../services/npcWitnessService';
import { FloatingTextMessage } from '../components/ui/FloatingText';
import gameSoundsService from '../services/gameSoundsService';
import { getDaysInMonth } from '../utils/dateUtils';
import { TimeAdvancementRequest } from '../services/timeAdvancementService';
import { railroadNetworkService } from '../services/railroadNetworkService';
import { getActiveWorkOffers, recordAnimalKill } from '../services/workOfferStorage';
import { buildAssessmentSummary, buildAssessmentRequest } from '../services/assessmentService';
import {
    AssessmentSession,
    AssessmentLogState,
    AssessmentNpcEncounterLog,
    AssessmentPrimarySourceLog,
    AssessmentPlayerInputLog
} from '../types/assessment';
import { GlobalEvent } from '../services/globalEventService';
import type { HistoryLensMessage } from '../types/historyLens';

const ASSESSMENT_STORAGE_KEY = 'uhs-assessment-session';

/**
 * Parse time advancement commands from player input
 */
function parseTimeCommand(input: string): Pick<TimeAdvancementRequest, 'duration' | 'durationType' | 'activity'> | null {
    const lower = input.toLowerCase().trim();

    // Match patterns for time commands
    const patterns = [
        // Rest commands
        { regex: /\b(rest|sleep|nap)\s+(?:for\s+)?(\d+)\s+hours?\b/i, activity: 'resting' as const, unit: 'hours' as const },
        { regex: /\b(rest|sleep|nap)\s+(?:for\s+)?(\d+)\s+days?\b/i, activity: 'resting' as const, unit: 'days' as const },
        { regex: /\b(rest|sleep|nap)\s+until\s+(dawn|morning|dusk)\b/i, activity: 'resting' as const, special: true },

        // Camp commands
        { regex: /\b(camp|make\s+camp|set\s+up\s+camp)\s+(?:for\s+)?(\d+)\s+hours?\b/i, activity: 'camping' as const, unit: 'hours' as const },
        { regex: /\b(camp|make\s+camp|set\s+up\s+camp)\s+(?:for\s+)?(\d+)\s+days?\b/i, activity: 'camping' as const, unit: 'days' as const },
        { regex: /\b(camp|make\s+camp|set\s+up\s+camp)\s+(?:for\s+)?(\d+)\s+weeks?\b/i, activity: 'camping' as const, unit: 'weeks' as const },
        { regex: /\b(camp|make\s+camp|set\s+up\s+camp)\s+(?:here|for\s+the\s+night)\b/i, activity: 'camping' as const, default: 8 },

        // Wait commands
        { regex: /\b(wait|stay|remain)\s+(?:for\s+)?(\d+)\s+hours?\b/i, activity: 'waiting' as const, unit: 'hours' as const },
        { regex: /\b(wait|stay|remain)\s+(?:for\s+)?(\d+)\s+days?\b/i, activity: 'waiting' as const, unit: 'days' as const },
        { regex: /\b(wait|stay|remain)\s+until\s+(dawn|morning|dusk)\b/i, activity: 'waiting' as const, special: true },

        // Skip time commands
        { regex: /\b(skip|pass|advance)\s+(?:time\s+)?(?:by\s+)?(\d+)\s+hours?\b/i, activity: 'waiting' as const, unit: 'hours' as const },
        { regex: /\b(skip|pass|advance)\s+(?:time\s+)?(?:by\s+)?(\d+)\s+days?\b/i, activity: 'waiting' as const, unit: 'days' as const },
        { regex: /\b(skip|pass|advance)\s+(?:time\s+)?(?:by\s+)?(\d+)\s+weeks?\b/i, activity: 'waiting' as const, unit: 'weeks' as const },

        // Simple time advancement
        { regex: /\buntil\s+(dawn|morning|dusk)\b/i, activity: 'waiting' as const, special: true }
    ];

    for (const pattern of patterns) {
        const match = lower.match(pattern.regex);
        if (match) {
            // Handle special time-of-day commands
            if (pattern.special) {
                const timeOfDay = match[2] || match[1];
                let durationType: TimeAdvancementRequest['durationType'];

                if (timeOfDay === 'dawn') durationType = 'until-dawn';
                else if (timeOfDay === 'morning') durationType = 'until-morning';
                else if (timeOfDay === 'dusk') durationType = 'until-dusk';
                else durationType = 'until-dawn'; // fallback

                return {
                    duration: 1, // Will be calculated by service
                    durationType,
                    activity: pattern.activity
                };
            }

            // Handle default durations
            if (pattern.default) {
                return {
                    duration: pattern.default,
                    durationType: 'hours',
                    activity: pattern.activity
                };
            }

            // Handle numeric durations
            const duration = parseInt(match[2]);
            if (!isNaN(duration) && duration > 0 && duration <= 365) {
                return {
                    duration,
                    durationType: pattern.unit!,
                    activity: pattern.activity
                };
            }
        }
    }

    return null;
}

export interface VictoryDetails {
    xpGained: number;
    itemsGained: Item[];
    opponentName: string;
    opponentEmoji: string;
    opponent: EncounterableEntity;
}

export const useUIState = () => {
    // Consume contexts for state and setters
    const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY, setControlledIconX, setControlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, onBuyItem, onSellItem, addItemsToInventory, onCharacterUpdate, removeItemsFromInventory, currentVessel, playerMode } = usePlayer();
    const { localArea, mapData, currentMapArchetype, currentMapClimate, currentMapSeed, animals, npcs, terrainStructures, setNpcs, setAnimals, removeVegetation, updateMineralDeposit, addDugTile } = useMap();
    const {
        gameDate, setGameDate, formattedTime, addGameLogEntry, gameTimeHours, setGameTimeHours, gameTimeMinutes,
        narrationHistory, setNarrationHistory, playerInput, onPlayerInputChange: setPlayerInput,
        isNarratorLoading, setIsNarratorLoading, currentTimeOfDay,
        currentZone, currentRegion, season
    } = useGame();

    // UI State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState<boolean>(false);
    const [containerPrompt, setContainerPrompt] = useState<{ message: string; isVisible: boolean }>({
        message: '',
        isVisible: false
    });
    const [isWorldMapModalOpen, setIsWorldMapModalOpen] = useState<boolean>(false);
    const [isCharacterProfileModalOpen, setIsCharacterProfileModalOpen] = useState<boolean>(false);
    const [isMapDetailsModalOpen, setIsMapDetailsModalOpen] = useState<boolean>(false);
    const [isCampModalOpen, setIsCampModalOpen] = useState<boolean>(false);
    
    // Context for narration
    const [recentNpc, setRecentNpc] = useState<NpcEntity | null>(null);
    const [recentConversationSummary, setRecentConversationSummary] = useState<string | null>(null);
    const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState<boolean>(false);
    const [levelUpCharacter, setLevelUpCharacter] = useState<PlayerCharacter | null>(null);
    const [isPortraitModalOpen, setIsPortraitModalOpen] = useState<boolean>(false);
    const [portraitModalCharacter, setPortraitModalCharacter] = useState<PlayerCharacter | NpcEntity | null>(null);
    const [isCraftingModalOpen, setIsCraftingModalOpen] = useState(false);
    const [craftingModalData, setCraftingModalData] = useState<CraftingModalData | null>(null);
    const [isEatingModalOpen, setIsEatingModalOpen] = useState(false);
    const [eatingModalData, setEatingModalData] = useState<{ item: Item } | null>(null);
    const [diseaseContractedModalData, setDiseaseContractedModalData] = useState<{
        disease: any;
        isOpen: boolean;
    } | null>(null);
    const [railroadStationModalData, setRailroadStationModalData] = useState<{
        station: any;
        connectedStations: any[];
    } | null>(null);
    const [harborModalData, setHarborModalData] = useState<{
        harbor: any;
        availableDestinations: any[];
    } | null>(null);

    // Factory labor panel state
    const [showFactoryPanel, setShowFactoryPanel] = useState<boolean>(false);
    const [showFactoryContractModal, setShowFactoryContractModal] = useState<boolean>(false);
    const [activeFactoryData, setActiveFactoryData] = useState<{
        factoryType: any;
        factoryName: string;
        factoryStructure: any;
        npcs: NpcEntity[];
        contract: any | null;
    } | null>(null);

    // App-level modals
    const [showInitialScenarioModal, setShowInitialScenarioModal] = useState<boolean>(false);
    const [showDeathModal, setShowDeathModal] = useState<boolean>(false);
    const [showNpcDeathModal, setShowNpcDeathModal] = useState<boolean>(false);
    const [showDiseaseProgressionModal, setShowDiseaseProgressionModal] = useState<boolean>(false);
    const [showEventModal, setShowEventModal] = useState<boolean>(false);
    const [showFactionsModal, setShowFactionsModal] = useState<boolean>(false);
    const [globalEventModalData, setGlobalEventModalData] = useState<GlobalEvent | null>(null);

    // Top nav panels state
    const [showJournal, setShowJournal] = useState<boolean>(false);
    const [showQuestsPanel, setShowQuestsPanel] = useState<boolean>(false);
    const [highlightedWorkOfferId, setHighlightedWorkOfferId] = useState<string | null>(null);
    const [showGameModePanel, setShowGameModePanel] = useState<boolean>(false);

    // Language Family Tree modal state
    const [showLanguageTree, setShowLanguageTree] = useState<boolean>(false);
    const [showSessionSummaryModal, setShowSessionSummaryModal] = useState<boolean>(false);
    const [showEndGameConfirm, setShowEndGameConfirm] = useState<boolean>(false);
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);

    // Dev Tooltip
    const [hoveredDevData, setHoveredDevData] = useState<DevTooltipDisplayData | null>(null);
    const [pinnedDevData, setPinnedDevData] = useState<DevTooltipDisplayData | null>(null);
    const [isTooltipPinnedOpen, setIsTooltipPinnedOpen] = useState<boolean>(false);
    const [showDevTooltip, setShowDevTooltip] = useState<boolean>(false);
    const [useLlmForDescriptions, setUseLlmForDescriptions] = useState(true);
    const [useLlmForCharacter, setUseLlmForCharacter] = useState(true);
    const [isTestModeEnabled, setIsTestModeEnabled] = useState<boolean>(false);
    const [isDevBuildingModeOpen, setIsDevBuildingModeOpen] = useState<boolean>(false);
    const [debugSettings, setDebugSettings] = useState({
        showFPS: true, // Show FPS when debug mode is on
        showRenderCount: true,
        disableBlurEffects: isSafari(), // Auto-disable blur on Safari
        disableAnimations: isSafari(), // Auto-disable animations on Safari
        disableShadows: false,
        disableParticles: false,
        reduceSVGComplexity: false,
        disableCanvasSmoothing: false,
        throttleAnimationFPS: false,
        showMemoryUsage: true,
        logPerformanceMetrics: false
    });

    // Tooltip tracking state - Load from localStorage
    const [contextualTooltipsEnabled, setContextualTooltipsEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('contextualTooltipsEnabled');
        return saved !== null ? JSON.parse(saved) : true; // Default: enabled
    });

    const [seenTooltips, setSeenTooltips] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('seenTooltips');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Persist tooltip settings to localStorage
    useEffect(() => {
        localStorage.setItem('contextualTooltipsEnabled', JSON.stringify(contextualTooltipsEnabled));
    }, [contextualTooltipsEnabled]);

    useEffect(() => {
        localStorage.setItem('seenTooltips', JSON.stringify(Array.from(seenTooltips)));
    }, [seenTooltips]);

    // Tooltip handlers
    const hasSeenTooltip = useCallback((tooltipId: string): boolean => {
        return !contextualTooltipsEnabled || seenTooltips.has(tooltipId);
    }, [contextualTooltipsEnabled, seenTooltips]);

    const markTooltipSeen = useCallback((tooltipId: string) => {
        setSeenTooltips(prev => new Set(prev).add(tooltipId));
    }, []);

    const resetAllTooltips = useCallback(() => {
        setSeenTooltips(new Set());
        localStorage.removeItem('seenTooltips');
    }, []);

    const toggleContextualTooltips = useCallback((enabled: boolean) => {
        setContextualTooltipsEnabled(enabled);
    }, []);

    // Central panel mode
    const [centralMode, setCentralMode] = useState<'map' | 'historylens'>('map');
    const [historyLensMessages, setHistoryLensMessages] = useState<HistoryLensMessage[]>([]);
    const historyLensInitializedRef = useRef(false);

    const appendHistoryLensMessage = useCallback((message: Omit<HistoryLensMessage, 'id'>) => {
        setHistoryLensMessages(prev => [
            ...prev,
            {
                id: `hl-${Date.now()}-${Math.random()}`,
                ...message
            }
        ]);
    }, []);

    useEffect(() => {
        const handleHistoryLensAppend = (payload: { sender: HistoryLensMessage['sender']; text: string }) => {
            appendHistoryLensMessage({ sender: payload.sender, text: payload.text });
        };
        eventBus.on('historylens:append', handleHistoryLensAppend);
        return () => {
            eventBus.off('historylens:append', handleHistoryLensAppend);
        };
    }, [appendHistoryLensMessage]);

    useEffect(() => {
        if (centralMode !== 'historylens') return;
        if (historyLensInitializedRef.current || historyLensMessages.length > 0) return;
        historyLensInitializedRef.current = true;
        import('../services/historyLensNarrationService').then(({ describeCurrentLocation }) => {
            if (!playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
            const text = describeCurrentLocation({
                mapData,
                playerCharacter,
                playerMode,
                playerX: controlledIconX,
                playerY: controlledIconY,
                localArea,
                currentZone,
                currentRegion
            });
            appendHistoryLensMessage({ sender: 'narrator', text });
        });
    }, [centralMode, historyLensMessages.length, playerCharacter, mapData, controlledIconX, controlledIconY, playerMode, localArea, currentZone, currentRegion, appendHistoryLensMessage]);

    // Left Sidebar
    const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState<boolean>(true);
    const [activeMapSubTab, setActiveMapSubTab] = useState<'analysis' | 'overview' | 'npcs' | 'animals'>('overview');
    const [activeLens, setActiveLens] = useState<LensMode>('none');

    // Right Sidebar
    const [isRightSidebarVisible, setIsRightSidebarVisible] = useState<boolean>(true);
    
    // Modal-specific data
    const [tileInfoModalProps, setTileInfoModalProps] = useState<TileInfoModalProps | null>(null);
    const [infoModalTarget, setInfoModalTarget] = useState<EncounterableEntity | null>(null);
    const [structureModalTarget, setStructureModalTarget] = useState<TerrainStructure | null>(null);
    const [activeSettlementInfo, setActiveSettlementInfo] = useState<{ tile: Tile } | null>(null);
    const [activeMarketplaceModal, _setActiveMarketplaceModal] = useState<{ tile: Tile } | null>(null);
    const [activeCityModal, _setActiveCityModal] = useState<{ tile: Tile } | null>(null);
    const [activeRuinModal, setActiveRuinModal] = useState<{ tile: Tile } | null>(null);
    const [inRuinRoguelike, setInRuinRoguelike] = useState(false);
    const [inMiningRoguelike, setInMiningRoguelike] = useState(false);
    const [miningRoguelikeData, setMiningRoguelikeData] = useState<{ structure: TerrainStructure } | null>(null);
    const [activeGovernmentModal, setActiveGovernmentModal] = useState<{ structure: TerrainStructure; tile: Tile } | null>(null);
    const [activeFishingHutModal, setActiveFishingHutModal] = useState<{ structure: TerrainStructure; tile: Tile } | null>(null);
    const [activeMiningModal, setActiveMiningModal] = useState<TerrainStructure | null>(null);
    const [interactionModalData, setInteractionModalData] = useState<any>(null); // For container loot
    const [encounterTarget, setEncounterTarget] = useState<EncounterableEntity | null>(null);
    const [combatant, setCombatant] = useState<EncounterableEntity | null>(null);
    const [victoryDetails, setVictoryDetails] = useState<VictoryDetails | null>(null);
    const [lootModalData, setLootModalData] = useState<LootModalData | null>(null);
    const [activePoi, setActivePoi] = useState<TerrainStructure | null>(null);
    const [cityHistoricalModalData, setCityHistoricalModalData] = useState<{ cityName: string; cityDescription: string } | null>(null);
    const [poiToastData, setPoiToastData] = useState<{
        structure: TerrainStructure;
        description: string;
        dialogue: any;
    } | null>(null);
    const [containerModalData, setContainerModalData] = useState<{
        containerType: any;
        contents: any;
        position: { x: number; y: number };
        isAnimating: boolean;
    } | null>(null);
    
    // Skills
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
    const [isSkillLoading, setIsSkillLoading] = useState<boolean>(false);
    const [skillResult, setSkillResult] = useState<SkillResult | null>(null);
    
    // Notifications
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastDurationMs, setToastDurationMs] = useState<number>(5500);
    const toastTimerRef = useRef<number | null>(null);
    const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);
    const [panelNotificationItem, setPanelNotificationItem] = useState<Item | null>(null);
    const [panelNotificationMode, setPanelNotificationMode] = useState<'acquired' | 'dropped' | 'npc_collected' | 'animal_collected'>('acquired');
    const [panelNotificationEntityName, setPanelNotificationEntityName] = useState<string | null>(null);
    const [rareItemFoundToast, setRareItemFoundToast] = useState<Item | null>(null);
    const [floatingTextMessages, setFloatingTextMessages] = useState<FloatingTextMessage[]>([]);
    const [showAssessmentModal, setShowAssessmentModal] = useState<boolean>(false);

    // IMPORTANT: Assessment logs should NOT persist across page reloads
    // Each game session should start with clean assessment state
    // Clear any stored assessment data on initialization
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    }

    const [assessmentSession, setAssessmentSession] = useState<AssessmentSession | null>(null);
    const [assessmentLogs, setAssessmentLogs] = useState<AssessmentLogState>({
        npcEncounters: [],
        primarySources: [],
        playerInputs: []
    });

    // Restore assessment data from saved game
    useEffect(() => {
        const savedGameDataString = localStorage.getItem('savedGameData');
        if (savedGameDataString) {
            try {
                const savedGame = JSON.parse(savedGameDataString);
                if (savedGame.assessmentSession) {
                    setAssessmentSession(savedGame.assessmentSession);
                    console.log('[useUIState] Restored assessment session');
                }
                if (savedGame.assessmentLogs) {
                    setAssessmentLogs(savedGame.assessmentLogs);
                    console.log('[useUIState] Restored assessment logs');
                }
                // Don't remove savedGameData yet - other hooks may need it
            } catch (error) {
                console.error('[useUIState] Error restoring assessment data:', error);
            }
        }
    }, []); // Run once on mount

    const setActiveMarketplaceModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveMarketplaceModal(data);
    }, []);

    const setActiveCityModal = useCallback((data: { tile: Tile } | null) => {
        _setActiveCityModal(data);
    }, []);


    // Auto-enable performance optimizations for Safari users
    useEffect(() => {
        if (isSafari()) {
            setDebugSettings(prev => ({
                ...prev,
                disableBlurEffects: true,
                disableAnimations: true  // Also disable animations for better Safari performance
            }));
            // Apply the classes immediately
            document.body.classList.add('disable-blur');
            document.body.classList.add('disable-animations');
            console.log('[Performance] Safari detected - automatically disabling blur effects and animations for better performance');
        }
    }, []);

    // Listen for ambient text events from MapViewport
    useEffect(() => {
        const handleAmbientText = (data: { text: string }) => {
            if (data.text) {
                // Add ambient text to narration history with special styling
                setNarrationHistory(prev => [...prev, {
                    sender: 'narrator-ambient',
                    text: `*${data.text}*` // Italicize ambient text
                }]);
            }
        };

        eventBus.on('narration:ambient', handleAmbientText);
        return () => {
            eventBus.off('narration:ambient', handleAmbientText);
        };
    }, [setNarrationHistory]);

    // Memoize if any modal is open
    const isAnyModalOpen = useMemo(() =>
        isSettingsModalOpen || isAboutModalOpen || isPauseModalOpen || isWorldMapModalOpen || isCharacterProfileModalOpen || isMapDetailsModalOpen ||
        !!tileInfoModalProps || !!infoModalTarget || !!structureModalTarget || !!activeSettlementInfo ||
        !!interactionModalData || isSkillsModalOpen || !!encounterTarget || !!combatant || !!victoryDetails || !!lootModalData || !!activeMarketplaceModal || !!activeCityModal || isLevelUpModalOpen || isPortraitModalOpen || isCraftingModalOpen || isEatingModalOpen || !!activeMiningModal || !!activePoi || !!activeRuinModal || !!activeGovernmentModal || !!activeFishingHutModal || !!containerModalData || isCampModalOpen || showJournal || showQuestsPanel || showGameModePanel ||
        showInitialScenarioModal || showDeathModal || showNpcDeathModal || showDiseaseProgressionModal || showEventModal || showFactionsModal ||
        (!!diseaseContractedModalData && diseaseContractedModalData.isOpen) || !!railroadStationModalData || !!harborModalData || showLanguageTree,
        [isSettingsModalOpen, isAboutModalOpen, isPauseModalOpen, isWorldMapModalOpen, isCharacterProfileModalOpen, isMapDetailsModalOpen,
         tileInfoModalProps, infoModalTarget, structureModalTarget, activeSettlementInfo,
         interactionModalData, isSkillsModalOpen, encounterTarget, combatant, victoryDetails, lootModalData, activeMarketplaceModal, activeCityModal, isLevelUpModalOpen, isPortraitModalOpen, isCraftingModalOpen, isEatingModalOpen, activeMiningModal, activePoi, activeRuinModal, activeGovernmentModal, activeFishingHutModal, containerModalData, isCampModalOpen, showJournal, showQuestsPanel, showGameModePanel,
         showInitialScenarioModal, showDeathModal, showNpcDeathModal, showDiseaseProgressionModal, showEventModal, showFactionsModal, diseaseContractedModalData, railroadStationModalData, harborModalData, showLanguageTree]
    );

    // Handlers
    const showContainerPrompt = useCallback((message: string) => {
        setContainerPrompt({ message, isVisible: true });
    }, []);

    const hideContainerPrompt = useCallback(() => {
        setContainerPrompt(prev => ({ ...prev, isVisible: false }));
    }, []);

    type ToastType = 'success' | 'warning' | 'error' | 'info';

    const showToast = useCallback((message: string, options?: ToastType | number | { type?: ToastType; duration?: number }, maybeDuration?: number) => {
        if (message.toLowerCase().includes('press e') && message.toLowerCase().includes('container')) {
            showContainerPrompt(message);
            return;
        }

        let resolvedDuration = 5500;

        if (typeof options === 'string') {
            if (typeof maybeDuration === 'number') {
                resolvedDuration = maybeDuration;
            }
        } else if (typeof options === 'number') {
            resolvedDuration = options;
        } else if (options && typeof options === 'object') {
            if (typeof options.duration === 'number') resolvedDuration = options.duration;
        }

        resolvedDuration = Math.max(1500, resolvedDuration);

        const now = Date.now();
        if (lastToastRef.current && lastToastRef.current.message === message && now - lastToastRef.current.timestamp < resolvedDuration) {
            return;
        }
        lastToastRef.current = { message, timestamp: now };

        import('../services/gameSoundsService').then(({ default: gameSounds }) => {
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('embarked') || lowerMessage.includes('disembarked')) {
                gameSounds.playEmbarkSound();
            } else if (lowerMessage.includes('level up') || lowerMessage.includes('level!')) {
                gameSounds.playLevelUpSound();
            } else if (lowerMessage.includes('quest complete') || lowerMessage.includes('quest accepted')) {
                gameSounds.playQuestAcceptedSound();
            } else if (lowerMessage.includes('healed') || lowerMessage.includes('health restored')) {
                gameSounds.playHealingSound();
            } else if (lowerMessage.includes('item') || lowerMessage.includes('acquired') || lowerMessage.includes('picked up')) {
                if (lowerMessage.includes('gold') || lowerMessage.includes('coin')) {
                    gameSounds.playItemPickupSound('gold');
                } else if (lowerMessage.includes('weapon') || lowerMessage.includes('sword') || lowerMessage.includes('dagger')) {
                    gameSounds.playItemPickupSound('weapon');
                } else if (lowerMessage.includes('food') || lowerMessage.includes('bread') || lowerMessage.includes('meat')) {
                    gameSounds.playItemPickupSound('food');
                } else if (lowerMessage.includes('document') || lowerMessage.includes('scroll') || lowerMessage.includes('letter')) {
                    gameSounds.playItemPickupSound('document');
                } else {
                    gameSounds.playItemPickupSound('generic');
                }
            } else if (lowerMessage.includes('trade') || lowerMessage.includes('sold') || lowerMessage.includes('bought')) {
                gameSounds.playTradeSuccessSound();
            } else if (lowerMessage.includes('combat') || lowerMessage.includes('battle') || lowerMessage.includes('fight')) {
                gameSounds.playCombatStartSound();
            } else if (lowerMessage.includes('discovered') || lowerMessage.includes('found')) {
                gameSounds.playDiscoverySound();
            }
        }).catch(err => {
            console.error('Failed to play sound:', err);
        });

        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }

        setToastDurationMs(resolvedDuration);
        setToastMessage(message);
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, resolvedDuration);
    }, [showContainerPrompt]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const getDefaultAssessmentContext = useCallback((): AssessmentSession['context'] => ({
        era: playerCharacter?.historicalEra || playerCharacter?.era,
        culturalZone: playerCharacter?.culturalZone || currentZone,
        role: playerCharacter?.profession || playerCharacter?.occupation
    }), [playerCharacter, currentZone]);

    const startAssessmentSession = useCallback((context?: AssessmentSession['context']) => {
        setAssessmentLogs({ npcEncounters: [], primarySources: [], playerInputs: [] });
        const session: AssessmentSession = {
            id: `session-${Date.now()}`,
            startedAt: new Date().toISOString(),
            context: context ?? getDefaultAssessmentContext()
        };
        setAssessmentSession(session);
    }, [getDefaultAssessmentContext]);

    const endAssessmentSession = useCallback((metadata?: AssessmentSession['metadata']) => {
        setAssessmentSession(prev => {
            if (!prev) return prev;
            const nextMetadata = metadata
                ? { ...(prev.metadata ?? {}), ...metadata }
                : prev.metadata;

            if (prev.endedAt) {
                if (!metadata) return prev;
                return {
                    ...prev,
                    metadata: nextMetadata
                };
            }
            return {
                ...prev,
                endedAt: new Date().toISOString(),
                metadata: nextMetadata
            };
        });
    }, []);

    const recordNpcEncounter = useCallback((log: Omit<AssessmentNpcEncounterLog, 'timestamp'> & { timestamp?: string }) => {
        const entry: AssessmentNpcEncounterLog = {
            timestamp: log.timestamp || new Date().toISOString(),
            npcId: log.npcId,
            npcName: log.npcName,
            location: log.location,
            playerAction: log.playerAction,
            outcome: log.outcome,
            trustDelta: log.trustDelta,
            notes: log.notes
        };
        setAssessmentLogs(prev => ({
            ...prev,
            npcEncounters: [...prev.npcEncounters, entry]
        }));
    }, []);

    const recordPrimarySourceEvent = useCallback((log: Omit<AssessmentPrimarySourceLog, 'timestamp'> & { timestamp?: string }) => {
        const entry: AssessmentPrimarySourceLog = {
            timestamp: log.timestamp || new Date().toISOString(),
            sourceId: log.sourceId,
            sourceTitle: log.sourceTitle,
            action: log.action,
            metadata: log.metadata
        };
        setAssessmentLogs(prev => ({
            ...prev,
            primarySources: [...prev.primarySources, entry]
        }));
    }, []);

    const recordPlayerInput = useCallback((log: Omit<AssessmentPlayerInputLog, 'timestamp'> & { timestamp?: string }) => {
        const entry: AssessmentPlayerInputLog = {
            timestamp: log.timestamp || new Date().toISOString(),
            channel: log.channel,
            text: log.text,
            metadata: log.metadata
        };
        setAssessmentLogs(prev => ({
            ...prev,
            playerInputs: [...prev.playerInputs, entry]
        }));
    }, []);

    const identifyPrimarySource = useCallback((source: any) => {
        if (!source) return null;
        const id =
            source?.id ??
            source?.sourceId ??
            source?.slug ??
            source?.key ??
            source?.documentId ??
            source?.title ??
            source?.name;
        const title =
            source?.title ??
            source?.name ??
            source?.heading ??
            source?.displayName ??
            id ??
            'Unknown source';

        if (!id && !title) return null;
        return {
            id: String(id ?? title ?? 'unknown-source'),
            title: String(title ?? id ?? 'Unknown source')
        };
    }, []);

    const [selectedPrimarySource, _setSelectedPrimarySource] = useState<any>(null);

    const setSelectedPrimarySource = useCallback((value: any | ((prev: any) => any)) => {
        if (typeof value === 'function') {
            _setSelectedPrimarySource(prev => {
                const next = value(prev);
                const prevIdentity = identifyPrimarySource(prev);
                const nextIdentity = identifyPrimarySource(next);

                if (prevIdentity && (!nextIdentity || nextIdentity.id !== prevIdentity.id)) {
                    recordPrimarySourceEvent({
                        sourceId: prevIdentity.id,
                        sourceTitle: prevIdentity.title,
                        action: 'close'
                    });
                }

                if (nextIdentity) {
                    recordPrimarySourceEvent({
                        sourceId: nextIdentity.id,
                        sourceTitle: nextIdentity.title,
                        action: 'open'
                    });
                }

                return next;
            });
            return;
        }

        const prevIdentity = identifyPrimarySource(selectedPrimarySource);
        const nextIdentity = identifyPrimarySource(value);

        if (prevIdentity && (!nextIdentity || nextIdentity.id !== prevIdentity.id)) {
            recordPrimarySourceEvent({
                sourceId: prevIdentity.id,
                sourceTitle: prevIdentity.title,
                action: 'close'
            });
        }

        if (nextIdentity) {
            recordPrimarySourceEvent({
                sourceId: nextIdentity.id,
                sourceTitle: nextIdentity.title,
                action: 'open'
            });
        }

        _setSelectedPrimarySource(value);
    }, [identifyPrimarySource, recordPrimarySourceEvent, selectedPrimarySource]);

    const triggerAssessmentReview = useCallback((metadata?: AssessmentSession['metadata'], options?: { openModal?: boolean }) => {
        if (!assessmentSession) {
            startAssessmentSession(getDefaultAssessmentContext());
            if (options?.openModal !== false) {
                setShowAssessmentModal(true);
            }
            return;
        }

        const mergedMetadata = {
            trigger: metadata?.trigger ?? (options?.openModal === false ? 'prepared' : 'manual_end'),
            ...metadata
        };

        endAssessmentSession(mergedMetadata);
        if (options?.openModal !== false) {
            setShowAssessmentModal(true);
        }
    }, [assessmentSession, endAssessmentSession, getDefaultAssessmentContext, startAssessmentSession]);

    const closeAssessmentModal = useCallback((restartSession: boolean = true) => {
        setShowAssessmentModal(false);
        if (!restartSession) return;
        if (assessmentSession?.endedAt) {
            startAssessmentSession(getDefaultAssessmentContext());
        }
    }, [assessmentSession, startAssessmentSession, getDefaultAssessmentContext]);

    useEffect(() => {
        if (!assessmentSession && playerCharacter) {
            startAssessmentSession(getDefaultAssessmentContext());
        }
    }, [assessmentSession, startAssessmentSession, getDefaultAssessmentContext, playerCharacter]);

    // NOTE: Removed localStorage persistence for assessment logs
    // Assessment data should only exist during the current session, not persist across reloads
    // This prevents cross-session data pollution and confusion

    const assessmentSummary = useMemo(() => {
        if (!assessmentSession) return null;
        return buildAssessmentSummary(assessmentSession, assessmentLogs);
    }, [assessmentSession, assessmentLogs]);

    const getAssessmentRequest = useCallback(() => {
        if (!assessmentSession) return null;
        return buildAssessmentRequest(assessmentSession, assessmentLogs);
    }, [assessmentSession, assessmentLogs]);

    // Function to show floating text at specific screen coordinates
    const showFloatingText = useCallback((text: string, type: FloatingTextMessage['type'], x: number, y: number, duration?: number) => {
        const id = `floating-${Date.now()}-${Math.random()}`;
        const newMessage: FloatingTextMessage = {
            id,
            text,
            type,
            x,
            y,
            duration: duration || 20000
        };
        
        setFloatingTextMessages(prev => [...prev, newMessage]);
    }, []);

    const removeFloatingText = useCallback((id: string) => {
        setFloatingTextMessages(prev => prev.filter(msg => msg.id !== id));
    }, []);

    const closeAllModals = useCallback(() => {
        setIsSettingsModalOpen(false);
        setIsWorldMapModalOpen(false);
        setIsCharacterProfileModalOpen(false);
        setIsMapDetailsModalOpen(false);
        setTileInfoModalProps(null);
        setInfoModalTarget(null);
        setStructureModalTarget(null);
        setActiveSettlementInfo(null);
        setInteractionModalData(null);
        setIsSkillsModalOpen(false);
        setEncounterTarget(null);
        setCombatant(null);
        setVictoryDetails(null);
        setLootModalData(null);
        setActiveMarketplaceModal(null);
        setActiveCityModal(null);
        setActiveGovernmentModal(null);
        setActiveFishingHutModal(null);
        setIsLevelUpModalOpen(false);
        setIsPortraitModalOpen(false);
        setPortraitModalCharacter(null);
        setIsCraftingModalOpen(false);
        setCraftingModalData(null);
        setActiveMiningModal(null);
        setActivePoi(null);
        setContainerModalData(null);
    }, []);
    
    useEffect(() => {
        if (playerCharacter && playerCharacter.experience >= playerCharacter.maxExperience && !isLevelUpModalOpen && !combatant) {
            setLevelUpCharacter(playerCharacter);
            setIsLevelUpModalOpen(true);
        }
    }, [playerCharacter, isLevelUpModalOpen, combatant]);

    // Listen for quest reward level ups
    useEffect(() => {
        const handleQuestLevelUp = (e: CustomEvent) => {
            const { levels, source } = e.detail;
            console.log(`[LevelUp] Quest reward level up: ${levels} level(s) from ${source}`);
            
            // Open the level up modal
            if (playerCharacter && !isLevelUpModalOpen) {
                setLevelUpCharacter(playerCharacter);
                setIsLevelUpModalOpen(true);
                showToast(`🎉 ${source} granted you a level up!`);
            }
        };

        window.addEventListener('playerLevelUp', handleQuestLevelUp as EventListener);
        return () => {
            window.removeEventListener('playerLevelUp', handleQuestLevelUp as EventListener);
        };
    }, [playerCharacter, isLevelUpModalOpen]);

    const handleLevelUp = useCallback((statToUpgrade?: keyof PlayerCharacter['stats'], newProfession?: string) => {
        onCharacterUpdate(prev => {
            if (!prev || !statToUpgrade) return prev;
    
            const newStats = { ...prev.stats };
            newStats[statToUpgrade] = (newStats[statToUpgrade] || 0) + 1;
            newStats.attack = (newStats.attack || 0) + 1;
            newStats.defense = (newStats.defense || 0) + 1;
    
            const newMaxExperience = Math.floor(prev.maxExperience * 1.5);
            const newMaxHealth = prev.maxHealth + 10;
            
            // Check if the new profession grants healing abilities
            const healingProfessions = [
                'Healer', 'Physician', 'Doctor', 'Herbalist', 'Apothecary',
                'Medicine Woman', 'Medicine Man', 'Medicine Person', 'Shaman',
                'Sangoma', 'Curandero', 'Hakim', 'Barber Surgeon', 'Plague Doctor',
                'Nurse', 'Mission Nurse', 'Tohunga', 'Kahuna Lapaʻau', 'Pajé',
                'Kallawaya', 'Diviner Healer', 'Traditional Healer', 'Pueblo Healer'
            ];
            
            const isBecomingHealer = newProfession && healingProfessions.includes(newProfession);
            const wasHealer = prev.profession && healingProfessions.includes(prev.profession);
            
            // Initialize or update abilities
            let abilities = { ...prev.abilities };
            let medicalSkills = { ...prev.medicalSkills };
            
            if (isBecomingHealer && !wasHealer) {
                // Grant healing abilities when becoming a healer
                abilities.canHeal = true;
                
                // Initialize medical skills based on intelligence and wisdom
                const baseSkill = Math.min(50 + (prev.stats.intelligence * 3) + (prev.stats.wisdom || 5) * 2, 80);
                medicalSkills = {
                    diagnosisAccuracy: baseSkill,
                    treatmentEffectiveness: baseSkill - 10,
                    herbalistKnowledge: newProfession === 'Herbalist' ? baseSkill + 20 : baseSkill,
                    surgicalSkill: newProfession?.includes('Surgeon') ? baseSkill + 15 : baseSkill - 20,
                    patientTrust: Math.min(50 + (prev.stats.charisma * 2), 75)
                };
                
                showToast(`🌿 You have gained healing abilities as a ${newProfession}!`);
            } else if (wasHealer && !isBecomingHealer) {
                // Remove healing abilities when changing away from healer
                abilities.canHeal = false;
                showToast(`You have lost your healing abilities.`);
            } else if (isBecomingHealer && wasHealer) {
                // Improve medical skills when continuing as healer
                medicalSkills = {
                    diagnosisAccuracy: Math.min((medicalSkills.diagnosisAccuracy || 50) + 5, 100),
                    treatmentEffectiveness: Math.min((medicalSkills.treatmentEffectiveness || 40) + 5, 100),
                    herbalistKnowledge: Math.min((medicalSkills.herbalistKnowledge || 50) + 3, 100),
                    surgicalSkill: Math.min((medicalSkills.surgicalSkill || 30) + 3, 100),
                    patientTrust: Math.min((medicalSkills.patientTrust || 50) + 2, 100)
                };
                showToast(`🌿 Your medical skills have improved!`);
            }
    
            return {
                ...prev,
                level: prev.level + 1,
                experience: 0,
                maxExperience: newMaxExperience,
                health: newMaxHealth, // Heal on level up
                maxHealth: newMaxHealth,
                stats: newStats,
                profession: newProfession || prev.profession,
                abilities,
                medicalSkills: isBecomingHealer || wasHealer ? medicalSkills : prev.medicalSkills
            };
        });
        setIsLevelUpModalOpen(false);
        setLevelUpCharacter(null);
        showToast(`Leveled up to ${playerCharacter!.level + 1}!`);
        
        // Show floating text for level up
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        showFloatingText(`Level Up! Lv.${playerCharacter!.level + 1}`, 'experience', screenCenterX, screenCenterY, 3000);
    }, [onCharacterUpdate, showToast, playerCharacter, showFloatingText]);

    const handleDevHover = useCallback((data: DevTooltipDisplayData | null) => {
        if (!isTooltipPinnedOpen) {
            setHoveredDevData(data);
        }
    }, [isTooltipPinnedOpen]);

    const togglePinnedTooltip = useCallback(() => {
        setIsTooltipPinnedOpen(prev => {
            const newPinState = !prev;
            if (newPinState && hoveredDevData) {
                setPinnedDevData(hoveredDevData);
            } else {
                setPinnedDevData(null);
            }
            return newPinState;
        });
    }, [hoveredDevData]);

    const handleCondenseTooltip = useCallback(() => {
        setIsTooltipPinnedOpen(false);
        setPinnedDevData(null);
    }, []);
    
    const handleTakeItem = useCallback((item: Item, entityId: string) => {
        if (!playerCharacter) return;

        setPlayerCharacter(prev => {
            if (!prev) return null;
            return { ...prev, inventory: addItemToInventory(prev.inventory, item) };
        });

        // Dispatch item acquired event for quest system
        dispatchItemAcquired(item.baseId, item.quantity || 1);

        setInteractionModalData((prev: any) => {
            if (!prev || prev.entityId !== entityId) return prev;
            return { ...prev, items: prev.items.filter((i: Item) => i.id !== item.id) };
        });

        addGameLogEntry(LogService.createItemAcquiredLog(item.name, item.quantity, `from a ${interactionModalData.title}`, gameDate, formattedTime));
        setPanelNotificationItem(item);
        setTimeout(() => setPanelNotificationItem(null), 3000);

    }, [playerCharacter, setPlayerCharacter, addGameLogEntry, gameDate, formattedTime, interactionModalData]);

    const onUseSkill = useCallback(async (skillId: SkillID) => {
        if (!playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;
        
        setIsSkillsModalOpen(true);
        setIsSkillLoading(true);
        
        let contextTile: any;
        if(viewMode === 'interior' && interiorViewState) {
            const currentFloor = interiorViewState.maps.get(interiorViewState.currentFloor);
            if(currentFloor && interiorMapPlayerPos)
                contextTile = currentFloor.tiles[interiorMapPlayerPos.y][interiorMapPlayerPos.x];
        } else {
            contextTile = mapData.tiles[controlledIconY][controlledIconX];
        }

        const dateInfo = parseDateString(String(gameDate.year));
        
        const ambianceContext: AmbianceContext = {
            currentTile: contextTile,
            neighboringTiles: [],
            mapArchetype: currentMapArchetype,
            climate: currentMapClimate,
            timeOfDay: currentTimeOfDay,
            historicalEra: dateInfo.era,
            century: dateInfo.century,
            decade: dateInfo.decade,
            locationString: currentZone,
            mapSeed: currentMapSeed,
            gameHour: gameTimeHours,
            visibleLandDirection: null,
        };

        const playerContext: PlayerContext = {
            viewMode,
            currentTile: contextTile,
            ambianceContext,
            playerCharacter,
            animals,
            npcs,
            terrainStructures,
            playerX: controlledIconX,
            playerY: controlledIconY,
            mapData,
            gameDate,
            gameTime: { hours: gameTimeHours || 12, minutes: gameTimeMinutes || 0 },
            season
        };

        const result = await executeSkill(skillId, playerContext);

        // Play skill sound effects immediately, regardless of success
        if (result?.type === 'forage') {
            gameSoundsService.playForageSound();
        } else if (result?.type === 'chop') {
            gameSoundsService.playChopSound();
        } else if (result?.type === 'dig') {
            gameSoundsService.playDigSound();
        } else if (skillId === 'BURN' && result?.type === 'combat') {
            gameSoundsService.playBurnSound();
        }

        if (result?.type === 'forage' && result.success && result.item) {

            // Play item pickup sound after a short delay
            setTimeout(() => {
                const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                               result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
            }, 300);

            // Use the item directly from the result (it's already created with custom names)
            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 5000);

            // Add gamelog entry for foraging
            if (addGameLogEntry && gameDate && formattedTime) {
                const location = localArea || mapData?.name || 'Unknown location';
                addGameLogEntry(LogService.createItemAcquiredLog(
                    result.item.name,
                    result.item.quantity || 1,
                    'by foraging',
                    gameDate,
                    formattedTime
                ));
            }
            
            // Show floating text for item found
            const screenX = window.innerWidth / 2 + (Math.random() - 0.5) * 200; // Add some randomness
            const screenY = window.innerHeight / 2 + 100;
            showFloatingText(`Found ${result.item.name}!`, 'success', screenX, screenY);
            
            // Remove vegetation if it was foraged from a bush
            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }
        
        if (result?.type === 'chop' && result.success && result.item) {
            // Play item pickup sound after a short delay
            setTimeout(() => {
                const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                               result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
            }, 300);

            addItemsToInventory([result.item]);
            setPanelNotificationItem(result.item);
            setTimeout(() => setPanelNotificationItem(null), 5000);

            // Add gamelog entry for chopping
            if (addGameLogEntry && gameDate && formattedTime) {
                const location = localArea || mapData?.name || 'Unknown location';
                addGameLogEntry(LogService.createItemAcquiredLog(
                    result.item.name,
                    result.item.quantity || 1,
                    'by chopping',
                    gameDate,
                    formattedTime
                ));
            }

            if (result.entityToRemoveId) {
                removeVegetation(result.entityToRemoveId);
            }
        }

        if (result?.type === 'dig' && result.success) {
            // Mark the tile as dug for visual feedback
            if (controlledIconX !== null && controlledIconY !== null) {
                addDugTile(controlledIconX, controlledIconY);
            }

            if (result.item) {
                console.log("Dig result item:", result.item);

                // Play item pickup sound after a short delay
                setTimeout(() => {
                    const isRare = result.item.rarity === 'Rare' || result.item.rarity === 'Ultra-rare' ||
                                   result.item.rarity === 'Unique' || result.item.quality === 'excellent';
                    gameSoundsService.playItemPickupSound(isRare ? 'gold' : 'generic');
                }, 300);

                addItemsToInventory([result.item]);
                setPanelNotificationItem(result.item);
                setTimeout(() => setPanelNotificationItem(null), 5000);

                // Add gamelog entry for digging
                if (addGameLogEntry && gameDate && formattedTime) {
                    const location = localArea || mapData?.name || 'Unknown location';
                    addGameLogEntry(LogService.createItemAcquiredLog(
                        result.item.name,
                        result.item.quantity || 1,
                        'by digging',
                        gameDate,
                        formattedTime
                    ));
                }
            } else {
                console.log("Dig succeeded but no item found:", result);
            }
            if (result.tileCoords && result.amountExtracted) {
                updateMineralDeposit(result.tileCoords.x, result.tileCoords.y, result.amountExtracted);
            }
        }
        
        if (result?.type === 'sing' && result.success) {
            // Apply reputation change from singing performance
            if (result.reputationChange !== 0) {
                setPlayerCharacter(p => {
                    if (!p) return p;
                    const newRep = Math.max(0, Math.min(100, p.mapReputation + result.reputationChange));
                    return { ...p, mapReputation: newRep };
                });
            }
            
            // Add a small amount of fatigue for singing
            setPlayerCharacter(p => {
                if (!p) return p;
                return { ...p, fatigue: Math.min(p.maxFatigue, p.fatigue + 2) };
            });
        }
        
        if (result?.type === 'combat' && result.message?.includes('Reputation')) {
            // Handle reputation change from intimidating shout
            const repMatch = result.message.match(/Reputation ([+-]\d+)/);
            if (repMatch) {
                const repChange = parseInt(repMatch[1]);
                setPlayerCharacter(p => {
                    if (!p) return p;
                    const newRep = Math.max(0, Math.min(100, p.mapReputation + repChange));
                    return { ...p, mapReputation: newRep };
                });
            }
            
            // Add fatigue cost for intimidating shout
            if (skillId === 'INTIMIDATING_SHOUT') {
                setPlayerCharacter(p => {
                    if (!p) return p;
                    return { ...p, fatigue: Math.min(p.maxFatigue, p.fatigue + 2) };
                });
            }
        }

        if(result?.xpGained) {
            setPlayerCharacter(p => p ? { ...p, experience: p.experience + result.xpGained! } : p);
        }

        setSkillResult(result);
        setIsSkillLoading(false);
    }, [playerCharacter, mapData, controlledIconX, controlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setPlayerCharacter, addItemsToInventory, removeVegetation, updateMineralDeposit, addDugTile, showFloatingText]);


    const onSend = useCallback(async () => {
        if (!playerInput.trim() || !playerCharacter || !mapData || controlledIconX === null || controlledIconY === null) return;

        recordPlayerInput({
            channel: 'narration',
            text: playerInput,
            metadata: {
                language: playerCharacter.culturalZone,
                tokens: playerInput.length
            }
        });

        const userMessage: NarrationMessage = { sender: 'player', text: playerInput };
        setNarrationHistory(prev => [...prev, userMessage]);
        setPlayerInput('');
        setIsNarratorLoading(true);

        // Check if user is asking about location - trigger POV viewport
        const lowerInput = playerInput.toLowerCase();
        const locationQuestions = [
            'where am i',
            'what do i see',
            'what is here',
            'look around',
            'describe this place',
            'what\'s around me',
            'what is around me',
            'show me around'
        ];

        if (locationQuestions.some(question => lowerInput.includes(question))) {
            // Emit event to show POV viewport
            eventBus.emit('pov:show');
        }

        // TEST TRIGGER: Check for "black death" to manually trigger the event
        if (lowerInput === 'black death') {
            const { GLOBAL_EVENTS } = await import('../services/globalEventService');
            const blackDeathEvent = GLOBAL_EVENTS.find(e => e.id === 'black_death_1348');
            if (blackDeathEvent) {
                setGlobalEventModalData(blackDeathEvent);
                setIsNarratorLoading(false);
                const testMessage: NarrationMessage = {
                    sender: 'narrator',
                    text: '🧪 **Test Event Triggered**: Black Death (1347-1353)'
                };
                setNarrationHistory(prev => [...prev, testMessage]);
                return;
            }
        }

        // Check if this is a time advancement command
        const timeCommand = parseTimeCommand(lowerInput);
        if (timeCommand) {
            try {
                // Import time advancement service
                const { timeAdvancementService } = await import('../services/timeAdvancementService');

                // Get current game state
                const currentTile = mapData.tiles[controlledIconY][controlledIconX];

                // Create request
                const request = {
                    duration: timeCommand.duration,
                    durationType: timeCommand.durationType,
                    activity: timeCommand.activity,
                    location: {
                        biome: currentTile.type,
                        climate: mapData.climate || 'temperate',
                        season: mapData.season || 'spring',
                        isDangerous: currentTile.type === 'MOUNTAINS' || currentTile.type === 'DEEP_OCEAN'
                    }
                };

                // Advance time and get results
                const result = await timeAdvancementService.advanceTime(
                    request,
                    playerCharacter,
                    gameTimeHours,
                    gameDate.day,
                    gameDate.month,
                    gameDate.year
                );

                // Update game time
                let newHours = gameTimeHours + result.hoursPassed;
                let newDays = gameDate.day;
                let newMonth = gameDate.month;
                let newYear = gameDate.year;

                // Handle day/month/year rollover
                while (newHours >= 24) {
                    newHours -= 24;
                    newDays++;

                    const daysInMonth = getDaysInMonth(newYear, newMonth);
                    if (newDays > daysInMonth) {
                        newDays = 1;
                        newMonth++;
                        if (newMonth > 12) {
                            newMonth = 1;
                            newYear++;
                        }
                    }
                }

                setGameTimeHours(newHours);
                setGameDate({ year: newYear, month: newMonth, day: newDays });

                // Apply resource changes to player
                const updatedCharacter = { ...playerCharacter };
                if (result.resourceChanges.health) {
                    updatedCharacter.health = Math.min(
                        updatedCharacter.maxHealth,
                        updatedCharacter.health + result.resourceChanges.health
                    );
                }
                if (result.resourceChanges.fatigue) {
                    updatedCharacter.fatigue = Math.max(
                        0,
                        Math.min(
                            updatedCharacter.maxFatigue,
                            updatedCharacter.fatigue + result.resourceChanges.fatigue
                        )
                    );
                }
                setPlayerCharacter(updatedCharacter);

                // Add summary to narration
                setNarrationHistory(prev => [...prev, {
                    sender: 'narrator',
                    text: result.summary
                }]);

                // Add detailed events if any
                if (result.events.length > 0) {
                    const significantEvents = result.events.filter(e => e.severity !== 'minor');
                    if (significantEvents.length > 0) {
                        const eventDetails = significantEvents.map(e => {
                            const when = result.daysPassed > 0
                                ? `Day ${e.day + 1}`
                                : `Hour ${e.hour || 1}`;
                            return `${when}: ${e.description}`;
                        }).join('\n');

                        setNarrationHistory(prev => [...prev, {
                            sender: 'narrator-ambient',
                            text: eventDetails
                        }]);
                    }
                }

            } catch (error) {
                console.error('[TimeAdvancement] Error:', error);
                setNarrationHistory(prev => [...prev, {
                    sender: 'narrator',
                    text: 'Time passes, though you lose track of the details.'
                }]);
            } finally {
                setIsNarratorLoading(false);
            }

            return; // Don't continue to normal narrator processing
        }

        // Check if this is a physical feat attempt
        const { detectPhysicalFeatIntent, evaluatePhysicalFeat, executePhysicalFeat } = await import('../services/physicalFeatService');
        const featAttempt = detectPhysicalFeatIntent(playerInput);
        
        if (featAttempt) {
            // Handle physical feat attempt
            const currentTile = mapData.tiles[controlledIconY][controlledIconX];
            
            // If direction is specified, get target tile
            if (featAttempt.direction) {
                let targetX = controlledIconX;
                let targetY = controlledIconY;
                
                switch (featAttempt.direction) {
                    case 'north': targetY--; break;
                    case 'south': targetY++; break;
                    case 'east': targetX++; break;
                    case 'west': targetX--; break;
                }
                
                if (targetX >= 0 && targetX < mapData.tiles[0].length && 
                    targetY >= 0 && targetY < mapData.tiles.length) {
                    featAttempt.targetTile = mapData.tiles[targetY][targetX];
                }
            }
            
            try {
                // Evaluate the feat
                const evaluation = await evaluatePhysicalFeat(featAttempt, playerCharacter, currentTile, mapData);
                
                // Add narrator's evaluation message
                setNarrationHistory(prev => [...prev, { 
                    sender: 'narrator', 
                    text: evaluation.reasoning 
                }]);
                
                if (evaluation.possible) {
                    // Execute the feat - add current position to player character
                    const playerWithLocation = {
                        ...playerCharacter,
                        location: { x: controlledIconX, y: controlledIconY }
                    };
                    const result = await executePhysicalFeat(featAttempt, evaluation, playerWithLocation, mapData);
                    
                    // Apply effects
                    if (result.effects) {
                        const newCharacter = { ...playerCharacter };
                        
                        if (result.effects.fatigue) {
                            newCharacter.fatigue = Math.min(
                                newCharacter.maxFatigue, 
                                newCharacter.fatigue + result.effects.fatigue
                            );
                        }
                        
                        if (result.effects.damage) {
                            newCharacter.health = Math.max(
                                0, 
                                newCharacter.health - result.effects.damage
                            );
                        }
                        
                        if (result.effects.lostItems) {
                            newCharacter.inventory = newCharacter.inventory.filter(
                                item => !result.effects.lostItems?.some(lost => lost.id === item.id)
                            );
                        }
                        
                        if (result.effects.newPosition && result.success) {
                            // Move the player to the new position
                            setControlledIconX(result.effects.newPosition.x);
                            setControlledIconY(result.effects.newPosition.y);
                        }

                        if (result.success && result.effects.elevatedState !== undefined) {
                            // Set or clear elevated state (like being in a tree)
                            newCharacter.elevatedState = result.effects.elevatedState || undefined;
                            newCharacter.elevationDescription = result.effects.elevationDescription || undefined;
                        }

                        if (result.effects.inWater) {
                            // Mark player as in water for drowning system
                            newCharacter.inWater = true;
                            newCharacter.waterEntryTime = result.effects.waterEntryTime || Date.now();
                        }

                        setPlayerCharacter(newCharacter);
                    }
                    
                    // Add result message
                    setNarrationHistory(prev => [...prev, { 
                        sender: 'narrator', 
                        text: result.message 
                    }]);
                } else if (evaluation.consequences?.alternativeSuggestion) {
                    // Add alternative suggestion
                    setNarrationHistory(prev => [...prev, { 
                        sender: 'narrator', 
                        text: evaluation.consequences.alternativeSuggestion 
                    }]);
                }
            } catch (error) {
                console.error('[PhysicalFeat] Error processing feat:', error);
                setNarrationHistory(prev => [...prev, { 
                    sender: 'narrator', 
                    text: 'You consider the action but decide against it for now.' 
                }]);
            } finally {
                setIsNarratorLoading(false);
            }
            
            return; // Don't continue to normal narrator processing
        }

        let contextTile: any;
        let interiorContext: any = undefined;
        
        if(viewMode === 'interior' && interiorViewState && interiorMapPlayerPos) {
             const currentFloor = interiorViewState.maps.get(interiorViewState.currentFloor);
             if (currentFloor) {
                 contextTile = currentFloor.tiles[interiorMapPlayerPos.y][interiorMapPlayerPos.x];
                 
                 // Create interior context information for the LLM
                 interiorContext = {
                     buildingType: currentFloor.buildingType || 'building',
                     buildingName: currentFloor.description || `${currentFloor.buildingType || 'Building'}`,
                     layoutName: currentFloor.npcs?.[0] ? 
                         (currentFloor.buildingType === 'palace' ? 'Royal Palace' :
                          currentFloor.buildingType === 'holy_place' ? 'Sacred Temple' : 
                          'Interior Space') : 'Simple Interior'
                 };
                 
                 // Try to find religion and cultural info from NPCs or building data
                 if (currentFloor.npcs && currentFloor.npcs.length > 0) {
                     const firstNpc = currentFloor.npcs[0];
                     if (firstNpc.religion) interiorContext.religion = firstNpc.religion;
                     if (firstNpc.culturalZone) interiorContext.culturalZone = firstNpc.culturalZone;
                 }
             }
        } else {
            contextTile = mapData.tiles[controlledIconY][controlledIconX];
        }

        const dateInfo = parseDateString(String(gameDate.year));
        const ambianceContext: AmbianceContext = { currentTile: contextTile, neighboringTiles: [], mapArchetype: currentMapArchetype, climate: currentMapClimate, timeOfDay: currentTimeOfDay, historicalEra: dateInfo.era, century: dateInfo.century, locationString: currentZone, mapSeed: currentMapSeed, gameHour: gameTimeHours, visibleLandDirection: null };

        const context: PlayerContext = {
            viewMode,
            currentTile: contextTile,
            ambianceContext,
            playerCharacter,
            animals,
            npcs,
            terrainStructures,
            playerX: controlledIconX,
            playerY: controlledIconY,
            mapData,
            interiorContext,
            currentVessel
        };
        
        // Check for voice loss from disease
        const diseaseRestrictions = calculateDiseaseGameplayRestrictions(playerCharacter?.diseaseHealth);
        let modifiedPlayerInput = playerInput;

        if (diseaseRestrictions.voiceLossLevel > 0) {
            // Apply voice loss restrictions
            if (diseaseRestrictions.voiceLossLevel === 1) {
                // Weak voice - add voice quality modifiers
                modifiedPlayerInput = `[Speaking in a weak, strained voice] ${playerInput}`;
            } else if (diseaseRestrictions.voiceLossLevel === 2) {
                // Whispers only - replace with whispered version
                modifiedPlayerInput = "..." + playerInput.substring(0, Math.min(10, playerInput.length)) + "...";
            } else if (diseaseRestrictions.voiceLossLevel >= 3) {
                // No speech - complete voice loss
                modifiedPlayerInput = "...";
                setNarrationHistory(prev => [...prev, {
                    id: `voice-loss-${Date.now()}`,
                    timestamp: gameDate,
                    timeString: formattedTime,
                    message: "You try to speak but your illness has robbed you of your voice. Only a faint whisper escapes your lips.",
                    type: 'system'
                }]);
            }
        }

        try {
            const responseText = await generateDmResponse(modifiedPlayerInput, context);
            setNarrationHistory(prev => [...prev, { sender: 'narrator', text: responseText }]);

            // Add gamelog entry for narration panel interaction
            if (addGameLogEntry && gameDate && formattedTime) {
                // Extract first sentence from response (up to first period, exclamation, or question mark)
                const firstSentenceMatch = responseText.match(/^[^.!?]+[.!?]/);
                const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : responseText.substring(0, 100) + '...';

                const location = localArea || mapData?.name || 'Unknown location';
                const summary = `Explored ${location}: "${playerInput.substring(0, 60)}${playerInput.length > 60 ? '...' : ''}"`;

                addGameLogEntry({
                    id: `narration-${Date.now()}-${Math.random()}`,
                    timestamp: { ...gameDate },
                    timeString: formattedTime,
                    type: 'MILESTONE_EXPLORATION',
                    icon: '🔍',
                    summary,
                    details: `Player: "${playerInput}"\n\nResponse: ${firstSentence}`,
                });
            }
        } catch (error) {
            console.error("Error with DM response:", error);
            setNarrationHistory(prev => [...prev, { sender: 'narrator', text: "An unexpected silence fills the air..." }]);
        } finally {
            setIsNarratorLoading(false);
        }
    }, [playerInput, playerCharacter, mapData, controlledIconX, controlledIconY, setControlledIconX, setControlledIconY, viewMode, interiorViewState, interiorMapPlayerPos, gameDate, currentMapArchetype, currentMapClimate, currentTimeOfDay, currentZone, currentMapSeed, gameTimeHours, animals, npcs, terrainStructures, setNarrationHistory, setPlayerInput, setIsNarratorLoading, setPlayerCharacter, setGameTimeHours, setGameDate, formattedTime, recordPlayerInput, addGameLogEntry, localArea]);

    const handleEncounter = useCallback((target: EncounterableEntity) => {
        // If it's an NPC, check if it has hostile flags - if so, use it directly (don't look up from stale npcs array)
        if (isNpc(target) && npcs) {
            const hasHostileFlags = 'isHostile' in target && target.isHostile ||
                                    'wasThreatenedByWeapon' in target && target.wasThreatenedByWeapon ||
                                    'aiState' in target && target.aiState === 'attacking_chasing';

            if (hasHostileFlags) {
                console.log(`[ENCOUNTER] Using hostile NPC ${target.name} directly (has hostile flags)`);
                setEncounterTarget(target);
            } else {
                // No hostile flags - look up latest version from npcs array
                const currentNpc = npcs.find(n => n.id === target.id);
                if (currentNpc) {
                    console.log(`[ENCOUNTER] Using updated NPC ${currentNpc.name}, opinion: ${currentNpc.memory.opinionOfPlayer}`);
                    setEncounterTarget(currentNpc);
                } else {
                    console.log(`[ENCOUNTER] NPC ${target.name} not found in array, using original`);
                    setEncounterTarget(target);
                }
            }
        } else {
            setEncounterTarget(target);
        }
    }, [npcs]);
    
    const handleCloseEncounter = useCallback((history: DialogueEntry[]) => {
        if (encounterTarget && isNpc(encounterTarget) && history.length > 1) {
            // Store recent NPC and conversation for narration context
            setRecentNpc(encounterTarget);

            // Check for disease transmission from NPC interaction (direct contact = 100% chance)
            if (encounterTarget.health?.currentDiseases?.length && playerCharacter) {
                const currentYear = gameDate.year;

                // Direct contact during conversation = very high transmission chance
                const transmissionResult = diseaseService.checkProximityTransmission(
                    encounterTarget,
                    playerCharacter,
                    0, // Distance 0 for direct contact
                    currentYear
                );

                // If disease was transmitted, show the disease contracted modal
                if (transmissionResult.transmitted && transmissionResult.exposures.length > 0) {
                    // Get the first transmitted disease
                    const exposedDiseaseId = transmissionResult.exposures[0].diseaseId;
                    const transmittedDisease = encounterTarget.health.currentDiseases
                        .find(d => d.disease.id === exposedDiseaseId)?.disease;

                    if (transmittedDisease) {
                        // Show disease contracted modal after a short delay so encounter modal can close first
                        setTimeout(() => {
                            setDiseaseContractedModalData({
                                disease: transmittedDisease,
                                isOpen: true
                            });

                            // Update player character with the new disease
                            if (playerCharacter.health) {
                                setPlayerCharacter(prev => prev ? { ...prev, health: playerCharacter.health } : null);
                            }
                        }, 500);
                    }
                }
            }

            // Quest system removed - no quest progress checking

            // Check if this was a guard encounter and clear the alert state
            if (isGuardType(encounterTarget)) {
                // Emit reset event to clear guard warning and alert states
                eventBus.emit('guard:resolved', { npcId: encounterTarget.id });
            }

            const targetSnapshot = encounterTarget;

            summarizeConversation(history).then(({ summary, sentiment }) => {
                setRecentConversationSummary(summary);
                
                setNpcs(prevNpcs => prevNpcs.map(npc => {
                    if (npc.id === encounterTarget.id) {
                        // Ensure memory and conversationSummaries exist
                        const currentSummaries = npc.memory?.conversationSummaries || [];
                        const newSummaries = [...currentSummaries, summary].slice(-5); // Keep last 5
                        let newOpinion = npc.memory?.opinionOfPlayer || 0;
                        if (sentiment === 'positive') newOpinion = Math.min(100, newOpinion + 10);
                        if (sentiment === 'negative') newOpinion = Math.max(-100, newOpinion - 10);
                        return { 
                            ...npc, 
                            memory: { 
                                ...npc.memory, 
                                conversationSummaries: newSummaries, 
                                opinionOfPlayer: newOpinion 
                            } 
                        };
                    }
                    return npc;
                }));

                if (targetSnapshot && isNpc(targetSnapshot)) {
                    const lastPlayerLine = [...history].reverse().find(entry => entry.speaker === 'player');
                    const location =
                        controlledIconX !== null && controlledIconY !== null
                            ? { x: controlledIconX, y: controlledIconY, mapArea: currentZone || undefined }
                            : undefined;

                    recordNpcEncounter({
                        npcId: targetSnapshot.id,
                        npcName: targetSnapshot.name,
                        playerAction: lastPlayerLine?.text || 'conversation',
                        outcome: sentiment ? `Conversation sentiment: ${sentiment}` : undefined,
                        location,
                        notes: summary
                    });
                }
            }).catch(error => {
                console.error('[Assessment] Failed to summarize conversation:', error);
                if (targetSnapshot && isNpc(targetSnapshot)) {
                    const fallbackSummary = history.map(entry => `${entry.speaker}: ${entry.text}`).join(' ');
                    const location =
                        controlledIconX !== null && controlledIconY !== null
                            ? { x: controlledIconX, y: controlledIconY, mapArea: currentZone || undefined }
                            : undefined;

                    recordNpcEncounter({
                        npcId: targetSnapshot.id,
                        npcName: targetSnapshot.name,
                        playerAction: 'conversation',
                        location,
                        notes: fallbackSummary
                    });
                }
            });

            // Add dialogue log entry with conversation memory
            if (addGameLogEntry && gameDate && formattedTime) {
                const location = localArea || mapData?.name || 'Unknown location';
                const npcName = 'name' in encounterTarget ? encounterTarget.name : encounterTarget.speciesName;

                // Get existing conversation history from NPC memory
                const existingMemories = isNpc(encounterTarget) ? encounterTarget.memory?.conversationSummaries || [] : [];
                const memoryText = existingMemories.length > 0
                    ? ` They remembered: "${existingMemories.join(' ')}"`
                    : '';

                // Create custom dialogue log with memory
                const summary = `Spoke to ${npcName} in ${location}.${memoryText}`;
                addGameLogEntry({
                    id: `dialogue-${Date.now()}-${Math.random()}`,
                    timestamp: { ...gameDate },
                    timeString: formattedTime,
                    type: 'DIALOGUE',
                    icon: '💬',
                    summary,
                    details: history,
                });
            }
        }
        setEncounterTarget(null);
    }, [encounterTarget, setNpcs, playerCharacter, addGameLogEntry, gameDate, formattedTime, localArea, mapData, setPlayerCharacter, controlledIconX, controlledIconY, currentZone, recordNpcEncounter]);

    const handleInitiateCombat = useCallback((target: EncounterableEntity) => {
        // If it's an NPC, ensure we have the latest version from the npcs array
        if (isNpc(target) && npcs) {
            const currentNpc = npcs.find(n => n.id === target.id);
            if (currentNpc) {
                // Use the current NPC from the array (which has updated memory)
                setCombatant(currentNpc);
                console.log(`[COMBAT] Starting combat with ${currentNpc.name}, opinion: ${currentNpc.memory.opinionOfPlayer}`);

                // Broadcast attack event to nearby witnesses
                if (playerCharacter && controlledIconX !== null && controlledIconY !== null) {
                    const updatedNpcs = broadcastEventToWitnesses(
                        {
                            type: 'attack',
                            perpetrator: playerCharacter.name,
                            victim: currentNpc.name,
                            severity: determineEventSeverity('attack'),
                            description: `attacked ${currentNpc.name}`,
                            wasPlayerInvolved: true
                        },
                        { x: controlledIconX, y: controlledIconY },
                        npcs,
                        [currentNpc.id] // Exclude the victim from witnessing
                    );
                    setNpcs(updatedNpcs);
                }
            } else {
                setCombatant(target);
            }
        } else {
            setCombatant(target);
        }
        setEncounterTarget(null);
    }, [npcs, playerCharacter, controlledIconX, controlledIconY, setNpcs]);

    // Contextual narration handlers
    const handleCompanionClick = useCallback(async (animal: TamedAnimal) => {
        console.log('[handleCompanionClick] Called with animal:', animal);
        if (!playerCharacter || controlledIconX === null || controlledIconY === null) {
            console.log('[handleCompanionClick] No player character or position, returning');
            return;
        }
        
        try {
            const { generateCompanionClickNarration } = await import('../services/llmService');
            
            // Get the current tile
            const currentTile = mapData?.tiles?.[controlledIconY]?.[controlledIconX] || null;
            
            // Create a simple context for the narration
            const context: PlayerContext = {
                playerCharacter,
                mapData: mapData || {} as MapData,
                npcs: [],
                animals: [],
                terrainStructures: [],
                playerX: controlledIconX,
                playerY: controlledIconY,
                viewMode: 'standard',
                interiorContext: null,
                currentTile,
                ambianceContext: {
                    timeOfDay: currentTimeOfDay || 'morning',
                    climate: mapData?.climate || 'TEMPERATE',
                    historicalEra: 'MEDIEVAL',
                    season: 'SPRING',
                    culturalZone: currentZone || 'EUROPEAN',
                    currentTile
                }
            };
            
            const narration = await generateCompanionClickNarration(
                animal.name,
                animal.type,
                animal.loyalty,
                context
            );
            
            console.log('[handleCompanionClick] Generated narration:', narration);
            
            setNarrationHistory(prev => [...prev, { 
                sender: 'narrator', 
                text: narration 
            }]);
        } catch (error) {
            console.error('[handleCompanionClick] Error:', error);
        }
    }, [playerCharacter, controlledIconX, controlledIconY, mapData, currentZone, currentTimeOfDay, setNarrationHistory]);
    
    const handlePlayerClick = useCallback(async () => {
        console.log('[handlePlayerClick] Called');
        if (!playerCharacter || controlledIconX === null || controlledIconY === null) {
            console.log('[handlePlayerClick] No player character or position, returning');
            return;
        }
        
        try {
            const { generatePlayerClickNarration } = await import('../services/llmService');
            
            // Get the current tile
            const currentTile = mapData?.tiles?.[controlledIconY]?.[controlledIconX] || null;
            
            // Create context for more varied narration
            const context: PlayerContext = {
                playerCharacter,
                mapData: mapData || {} as MapData,
                npcs: [],
                animals: [],
                terrainStructures: [],
                playerX: controlledIconX,
                playerY: controlledIconY,
                viewMode: 'standard',
                interiorContext: null,
                currentTile,
                ambianceContext: {
                    timeOfDay: currentTimeOfDay || 'morning',
                    climate: mapData?.climate || 'TEMPERATE',
                    historicalEra: 'MEDIEVAL',
                    season: 'SPRING',
                    culturalZone: currentZone || 'EUROPEAN',
                    currentTile
                }
            };
            
            const narration = await generatePlayerClickNarration(
                playerCharacter,
                recentNpc,
                context
            );
            
            console.log('[handlePlayerClick] Generated narration:', narration);
            
            setNarrationHistory(prev => [...prev, { 
                sender: 'narrator', 
                text: narration 
            }]);
        } catch (error) {
            console.error('[handlePlayerClick] Error:', error);
        }
    }, [playerCharacter, controlledIconX, controlledIconY, mapData, recentNpc, recentConversationSummary, currentZone, currentTimeOfDay, setNarrationHistory]);
    
    const handleNewAreaEntry = useCallback(async (fromDirection: 'north' | 'south' | 'east' | 'west') => {
        if (!playerCharacter) return;
        
        const { generateNewAreaNarration } = await import('../services/contextualNarrationService');
        
        const narration = await generateNewAreaNarration(fromDirection, {
            playerCharacter,
            mapData,
            currentZone,
            currentRegion: localArea,
            timeOfDay: currentTimeOfDay
        });
        
        setNarrationHistory(prev => [...prev, { 
            sender: 'narrator', 
            text: narration 
        }]);

        const { describeArrival } = await import('../services/historyLensNarrationService');
        if (mapData && controlledIconX !== null && controlledIconY !== null) {
            eventBus.emit('historylens:append', {
                sender: 'narrator',
                text: describeArrival({
                    mapData,
                    playerCharacter,
                    playerMode,
                    playerX: controlledIconX,
                    playerY: controlledIconY,
                    localArea,
                    currentZone,
                    currentRegion
                })
            });
        }
    }, [playerCharacter, mapData, currentZone, localArea, currentRegion, currentTimeOfDay, setNarrationHistory, controlledIconX, controlledIconY, playerMode]);

    const handleStationClick = useCallback((tile: Tile) => {
        const station = railroadNetworkService.findStationAt(tile.x, tile.y);
        if (station) {
            const connections = railroadNetworkService.getConnectionsWithDetails(station);
            setRailroadStationModalData({
                station,
                connectedStations: connections
            });
        }
    }, []);

    const handleHarborClick = useCallback((tile: Tile) => {
        // Import harbor service functions at top of file
        const { getHarborDestinations, TravelMode } = require('../services/crossMapTravelService');

        if (!mapData || !gameDate) return;

        const harborName = tile.cityName || mapData.majorCity?.name || 'Harbor';
        const currentMapArea = mapData.mapAreaName || mapData.localArea || '';

        // Convert year to era
        const year = gameDate.year;
        let era: any;
        if (year < 500) era = 'ANTIQUITY';
        else if (year < 1450) era = 'MEDIEVAL';
        else if (year < 1800) era = 'RENAISSANCE_EARLY_MODERN';
        else if (year < 1900) era = 'INDUSTRIAL_ERA';
        else if (year < 2000) era = 'MODERN_ERA';
        else era = 'FUTURE_ERA';

        try {
            const destinations = getHarborDestinations(currentMapArea, {
                mode: TravelMode.SHIP,
                currentYear: year,
                currentEra: era,
                playerWealth: playerCharacter?.money
            });

            setHarborModalData({
                harbor: { name: harborName, x: tile.x, y: tile.y },
                availableDestinations: destinations
            });
        } catch (error) {
            console.error('[handleHarborClick] Error getting harbor destinations:', error);
        }
    }, [mapData, gameDate, playerCharacter]);

    const handleCombatVictory = useCallback((opponent: EncounterableEntity) => {
        const xpGained = 10 * (opponent.stats.level || 1);
        let itemsGained: Item[] = [];

        if (isAnimal(opponent)) {
            const animalData = ANIMAL_DATA[opponent.baseId];
            if (animalData) {
                animalData.drops.forEach(drop => {
                    if (Math.random() < drop.chance) {
                        const newItem = createItemInstance(drop.name.toUpperCase().replace(/ /g, '_'));
                        if (newItem) itemsGained.push(newItem);
                    }
                });
            }

            // Track animal kills for active work offers
            const activeWorkOffers = getActiveWorkOffers();
            const killAnimalOffers = activeWorkOffers.filter(offer =>
                offer.taskType === 'kill_animal' &&
                offer.targetAnimal?.toLowerCase() === opponent.speciesName.toLowerCase()
            );

            killAnimalOffers.forEach(offer => {
                recordAnimalKill(offer.id, opponent.speciesName);
                console.log(`[Work Offer] Recorded ${opponent.speciesName} kill for offer ${offer.id}`);
            });
        }

        setVictoryDetails({
            xpGained,
            itemsGained,
            opponentName: isAnimal(opponent) ? opponent.speciesName : opponent.name,
            opponentEmoji: opponent.emoji,
            opponent: opponent
        });

        if (playerCharacter) {
            setPlayerCharacter(p => p ? {...p, experience: p.experience + xpGained} : p);

            // Show floating text for XP gain
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2 + 50; // Slightly below center
            showFloatingText(`+${xpGained} XP`, 'experience', screenCenterX, screenCenterY, 2500);
        }

        setCombatant(null);
    }, [playerCharacter, setPlayerCharacter, showFloatingText]);

    const handleVictoryClose = useCallback(() => {
        if (!victoryDetails) return;
        const { opponent, itemsGained } = victoryDetails;
    
        if (isNpc(opponent)) {
            const equipped = Object.values(opponent.equippedItems || {}).filter(Boolean) as Item[];
            const inventory = opponent.inventory || [];
            const allLootableItems = [...equipped, ...inventory];
            setLootModalData({ opponent, items: allLootableItems });
        } else if (isAnimal(opponent)) {
            if (itemsGained.length > 0) {
                addItemsToInventory(itemsGained);
                showToast(`Acquired ${itemsGained.length} item(s)`);
                setPanelNotificationItem(itemsGained[0]);
                setTimeout(() => setPanelNotificationItem(null), 3000);
            }
            // FIX: Remove animal from map
            setAnimals(prev => prev.filter(a => a.id !== opponent.id));
        }
        setVictoryDetails(null);
    }, [victoryDetails, addItemsToInventory, showToast, setLootModalData, setVictoryDetails, setPanelNotificationItem, setAnimals]);
    
    const handleLooting = useCallback((item: Item, opponentId: string) => {
        if(!playerCharacter) return;
        setPlayerCharacter(prev => prev ? { ...prev, inventory: addItemToInventory(prev.inventory, item) } : null);

        // Dispatch item acquired event for quest system
        dispatchItemAcquired(item.baseId, item.quantity || 1);

        // Add gamelog entry for combat loot
        if (addGameLogEntry && gameDate && formattedTime) {
            const location = localArea || mapData?.name || 'Unknown location';
            addGameLogEntry(LogService.createItemAcquiredLog(
                item.name,
                item.quantity || 1,
                'from combat loot',
                gameDate,
                formattedTime
            ));
        }
        setLootModalData((prev: LootModalData | null) => {
            if (!prev || prev.opponent.id !== opponentId) return prev;
            const newOpponentInventory = prev.opponent.inventory.filter(i => i.id !== item.id);
            const newEquipped = { ...prev.opponent.equippedItems };
            Object.entries(newEquipped).forEach(([slot, equippedItem]: [string, Item | undefined]) => {
                if(equippedItem && typeof equippedItem === 'object' && 'id' in equippedItem && equippedItem.id === item.id) {
                    delete newEquipped[slot as keyof typeof newEquipped];
                }
            });

            return { 
                ...prev, 
                opponent: { 
                    ...prev.opponent, 
                    inventory: newOpponentInventory,
                    equippedItems: newEquipped
                } 
            };
        });
    }, [playerCharacter, setPlayerCharacter, addGameLogEntry, gameDate, formattedTime, localArea, mapData]);

    const onTakeCoins = useCallback((amount: number, opponentId: string) => {
        if (!playerCharacter) return;
        setPlayerCharacter(p => p ? { ...p, currency: p.currency + amount } : p);
        setLootModalData((prev: LootModalData | null) => {
            if (!prev || prev.opponent.id !== opponentId) return prev;
            const newOpponent = {...prev.opponent, currency: 0};
            return {...prev, opponent: newOpponent};
        });
    }, [playerCharacter, setPlayerCharacter]);
    
    const handleCloseLootModal = useCallback((lootedItems: Item[]) => {
        if (lootedItems.length > 0) {
            showToast(`Looted ${lootedItems.length} item(s).`);
        }
        // FIX: Remove NPC from map after looting
        if (lootModalData) {
            setNpcs(prev => prev.filter(n => n.id !== lootModalData.opponent.id));
        }
        setLootModalData(null);
    }, [showToast, lootModalData, setNpcs]);

    const onCraft = useCallback((items: Item[], method: 'COMBINE' | 'DISAGGREGATE') => {
        setCraftingModalData({ items, method });
        setIsCraftingModalOpen(true);
    }, []);

    const handleExecuteCrafting = useCallback(async (intent: string, method: 'COMBINE' | 'DISAGGREGATE', items: Item[]): Promise<CraftingResult | null> => {
        if (!craftingModalData) return null;
        try {
            const result = await executeCrafting(method, items, intent);
            if (result.success && result.outcome.consumedItemIds.length > 0) {
                removeItemsFromInventory(result.outcome.consumedItemIds);
            }
            if (result.success && result.outcome.newItems) {
                const newItems = result.outcome.newItems.map(itemDef => createItemInstance(itemDef.baseId)).filter(Boolean) as Item[];
                addItemsToInventory(newItems);
                if (newItems.length > 0) {
                    setPanelNotificationItem(newItems[0]);
                    setTimeout(() => setPanelNotificationItem(null), 5000);
                }
            }
            showToast(result.outcome.message);
            return result;
        } catch (error) {
            console.error("Crafting execution failed:", error);
            showToast("A mysterious force prevented your crafting attempt.");
            return null;
        }
    }, [craftingModalData, removeItemsFromInventory, addItemsToInventory, showToast]);

    const onEat = useCallback((item: Item) => {
        setEatingModalData({ item });
        setIsEatingModalOpen(true);
    }, []);

    const handleExecuteEating = useCallback(async (): Promise<EatingResult | null> => {
        if (!eatingModalData) return null;
        try {
            const result = await executeEating(eatingModalData.item, playerCharacter);

            if (result.success) {
                // Apply health and fatigue changes with bounds checking
                const newHealth = Math.max(0, Math.min(
                    playerCharacter.maxHealth,
                    playerCharacter.health + result.healthChange
                ));
                const newFatigue = Math.max(0, Math.min(
                    playerCharacter.maxFatigue,
                    playerCharacter.fatigue + result.fatigueChange
                ));

                // Add +1 XP
                const newExperience = playerCharacter.experience + 1;

                // Update character
                const updatedCharacter = {
                    ...playerCharacter,
                    health: newHealth,
                    fatigue: newFatigue,
                    experience: newExperience
                };
                setPlayerCharacter(updatedCharacter);
                onCharacterUpdate?.(updatedCharacter);

                // Remove item from inventory (decrease quantity or remove completely)
                const item = eatingModalData.item;
                if (item.stackable && item.quantity > 1) {
                    // Decrease quantity
                    const updatedInventory = playerCharacter.inventory.map(invItem =>
                        invItem.id === item.id
                            ? { ...invItem, quantity: invItem.quantity - 1 }
                            : invItem
                    );
                    updatedCharacter.inventory = updatedInventory;
                    setPlayerCharacter(updatedCharacter);
                } else {
                    // Remove item completely
                    removeItemsFromInventory([item.id]);
                }

                showToast(`Ate ${item.name}. ${result.description}`);
            }

            return result;
        } catch (error) {
            console.error("Eating execution failed:", error);
            showToast("Something went wrong while trying to eat that item.");
            return null;
        }
    }, [eatingModalData, playerCharacter, setPlayerCharacter, onCharacterUpdate, removeItemsFromInventory, showToast]);

    // Function to open quest panel with highlighted work offer
    const openQuestPanelWithWorkOffer = useCallback((workOfferId: string) => {
        setHighlightedWorkOfferId(workOfferId);
        setShowQuestsPanel(true);

        // Clear highlight after 3 seconds
        setTimeout(() => {
            setHighlightedWorkOfferId(null);
        }, 3000);
    }, []);

    return {
        // State
        hoveredDevData, pinnedDevData, isTooltipPinnedOpen,
        tileInfoModalProps, infoModalTarget, structureModalTarget, activeSettlementInfo,
        isSettingsModalOpen, isAboutModalOpen, isPauseModalOpen, useLlmForDescriptions, useLlmForCharacter, showDevTooltip,
        isTestModeEnabled, debugSettings, isDevBuildingModeOpen,
        isWorldMapModalOpen, interactionModalData, isSkillsModalOpen, isSkillLoading, skillResult,
        isMapDetailsModalOpen, encounterTarget, combatant, victoryDetails, isCharacterProfileModalOpen,
        isAnyModalOpen, activeMarketplaceModal, activeCityModal, activeRuinModal, activeGovernmentModal, activeFishingHutModal, activeMiningModal,
        isCampModalOpen,
        showJournal, showQuestsPanel, highlightedWorkOfferId, showGameModePanel,
        showInitialScenarioModal, showDeathModal, showNpcDeathModal, showDiseaseProgressionModal, showEventModal, showFactionsModal,
        globalEventModalData, setGlobalEventModalData,
        showLanguageTree, selectedLanguageId, showSessionSummaryModal, showEndGameConfirm,
        isLeftSidebarExpanded, activeMapSubTab, activeLens, toastMessage, setToastMessage, toastDurationMs, panelNotificationItem, panelNotificationMode, panelNotificationEntityName, rareItemFoundToast,
        isRightSidebarVisible, setIsRightSidebarVisible,
        centralMode, setCentralMode, historyLensMessages, appendHistoryLensMessage,
        floatingTextMessages, containerPrompt,
        lootModalData, setLootModalData,
        isLevelUpModalOpen, levelUpCharacter,
        isPortraitModalOpen, portraitModalCharacter,
        isCraftingModalOpen, craftingModalData,
        isEatingModalOpen, eatingModalData,
        activePoi,
        poiToastData,
        inRuinRoguelike,
        inMiningRoguelike,
        miningRoguelikeData,
        containerModalData,
        cityHistoricalModalData,

        // Tooltip state
        contextualTooltipsEnabled,
        hasSeenTooltip,

        // Handlers
        handleDevHover, handleCondenseTooltip, togglePinnedTooltip,
        setTileInfoModalProps, setInfoModalTarget, setStructureModalTarget, setActiveSettlementInfo,
        setIsSettingsModalOpen, setIsAboutModalOpen, setIsPauseModalOpen, setUseLlmForDescriptions, setUseLlmForCharacter, setShowDevTooltip,
        setIsTestModeEnabled, setDebugSettings, setIsDevBuildingModeOpen,
        setIsWorldMapModalOpen, setInteractionModalData, handleTakeItem,
        setIsSkillsModalOpen, setSkillResult, setIsMapDetailsModalOpen,
        handleEncounter, handleCloseEncounter, handleInitiateCombat,
        setCombatant, handleCombatVictory, setVictoryDetails, setIsCharacterProfileModalOpen,
        closeAllModals, setActiveMarketplaceModal, setActiveCityModal, setActiveRuinModal, setActiveGovernmentModal, setActiveFishingHutModal, setActiveMiningModal, setInRuinRoguelike, setInMiningRoguelike, setMiningRoguelikeData,
        setIsCampModalOpen,
        setShowJournal, setShowQuestsPanel, openQuestPanelWithWorkOffer, setShowGameModePanel,
        setShowInitialScenarioModal, setShowDeathModal, setShowNpcDeathModal, setShowDiseaseProgressionModal, setShowEventModal, setShowFactionsModal,
        setShowLanguageTree, setSelectedLanguageId, setShowSessionSummaryModal, setShowEndGameConfirm,
        setIsLeftSidebarExpanded, setActiveMapSubTab, setActiveLens, showToast, setPanelNotificationItem, setPanelNotificationMode, setPanelNotificationEntityName, setRareItemFoundToast,
        showFloatingText, removeFloatingText, showContainerPrompt, hideContainerPrompt,
        handleLooting, handleCloseLootModal, onTakeCoins,
        handleVictoryClose,
        handleLevelUp,
        setIsPortraitModalOpen, setPortraitModalCharacter,
        onCraft, handleExecuteCrafting,
        onEat, handleExecuteEating, setIsEatingModalOpen,
        setActivePoi,
        setPoiToastData,
        setContainerModalData,
        setCityHistoricalModalData,
        selectedPrimarySource,
        setSelectedPrimarySource,
        diseaseContractedModalData,
        setDiseaseContractedModalData,
        railroadStationModalData,
        setRailroadStationModalData,
        handleStationClick,
        harborModalData,
        setHarborModalData,
        handleHarborClick,

        // Factory labor panel
        showFactoryPanel,
        setShowFactoryPanel,
        showFactoryContractModal,
        setShowFactoryContractModal,
        activeFactoryData,
        setActiveFactoryData,

        // Tooltip handlers
        markTooltipSeen,
        resetAllTooltips,
        toggleContextualTooltips,

        // Assessment layer (phase 1)
        assessmentSession,
        assessmentLogs,
        assessmentSummary,
        getAssessmentRequest,
        showAssessmentModal,
        setShowAssessmentModal,
        triggerAssessmentReview,
        closeAssessmentModal,
        startAssessmentSession,
        endAssessmentSession,
        recordNpcEncounter,
        recordPrimarySourceEvent,
        recordPlayerInput,

        // Actions passed down from Player/Game contexts
        onUseSkill,
        onSend,
        
        // Contextual narration handlers
        handleCompanionClick,
        handlePlayerClick,
        handleNewAreaEntry,
        onBuyItem,
        onSellItem
    };
};
