/**
 * App.tsx - Main application component for the Map Voyager Engine
 */
import React, { lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { UIProvider, useUI } from './contexts/UIContext';
import { MapProvider, useMap } from './contexts/MapContext';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import { GameProvider, useGame } from './contexts/GameContext';
import useCoreLoops from './hooks/useCoreLoops';
import { useEventSystem } from './hooks/useEventSystem';
import TopNavBarPolished from './components/TopNavBarPolished';
import LeftSidebar from './components/LeftSidebar';
import MapViewport from './components/MapViewport';
import RightSidebar from './components/RightSidebar';
import { isMobileDevice } from './utils/deviceUtils';
import { isSafari } from './utils/safariUtils';
import MobileHeader from './components/mobile/MobileHeader';
import MobileQuickStats from './components/mobile/MobileQuickStats';
import MobileSidebar from './components/mobile/MobileSidebar';
import ModalHub from './components/ModalHub';
import PauseModal from './components/PauseModal';
import DebugOverlay from './components/DebugOverlay';
import FPSCounter from './components/FPSCounter';
import { EventNotification, EventBadge } from './components/EventNotification';
import { GameModeSelector } from './components/GameModeSelector';
import { suggestGameMode, GAME_MODES, getGameModeById } from './constants/gameData/gameModes';
import { themeService } from './services/themeService';
import { eventService } from './services/eventService';
import QuestRewardNotification from './components/QuestRewardNotification';
import TransitionOverlay from './components/TransitionOverlay';
import StudyStarsOverlay from './components/StudyStarsOverlay';
import QuestNotificationToast from './components/QuestNotification';
import StatusWarningToast from './components/ui/StatusWarningToast';
import ContainerPrompt from './components/ContainerPrompt';
import { parseURLConfig, URLGameConfig } from './services/urlConfigService';
import { SeedManager } from './services/seedService';
import { shareableStateService } from './services/shareableStateService';
import { LogService } from './services/logService';
import { findZoneForMapArea, findSimilarMapArea } from './services/zoneDetectionService';
import { worldWeaverObjectiveHandler } from './services/worldWeaverObjectiveHandler';
import { worldWeaverNotificationService } from './services/worldWeaverNotificationService';
import { useURLGameConfig } from './hooks/useURLGameConfig';
import FactionTooltip from './components/FactionTooltip';
import PlayerTooltip from './components/PlayerTooltip';
import { DiseaseProgressionEvent } from './services/diseaseNotificationService';
import { SavedGame } from './services/saveGameService';
import FloatingText from './components/ui/FloatingText';
import GameSetupScreen from './components/GameSetupScreen';
import RailroadStationModal from './components/RailroadStationModal';
import { railroadNetworkService } from './services/railroadNetworkService';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import AssessmentModal from './components/AssessmentModal';
import SessionCompletionModal from './components/SessionCompletionModal';
import JournalViewport from './components/JournalViewport';
import QuestsPanel from './components/QuestsPanel';
import { GameModePanel } from './components/GameModePanel';
import { LanguageFamilyTree } from './components/LanguageFamilyTree';

// Lazy load heavy modals that are used infrequently
const EventModal = lazy(() => import('./components/EventModal').then(m => ({ default: m.EventModal })));
const InitialScenarioModal = lazy(() => import('./components/InitialScenarioModal'));
const FactionsModal = lazy(() => import('./components/FactionsModal'));
const GameOverModal = lazy(() => import('./components/GameOverModal'));
const NpcDeathModal = lazy(() => import('./components/NpcDeathModal'));
const DiseaseProgressionModal = lazy(() => import('./components/DiseaseProgressionModal'));
const CampModal = lazy(() => import('./components/CampModal'));

const AppContent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Show loading skeleton until core systems initialize
    const [isInitializing, setIsInitializing] = React.useState(true);
    const [uiVisible, setUiVisible] = React.useState(false);

    // Detect Safari for conditional optimizations
    const isSafariBrowser = React.useMemo(() => isSafari(), []);

    // Initialize theme on app startup
    React.useEffect(() => {
        themeService.initializeTheme();
        // Initialize WorldWeaver systems
        worldWeaverObjectiveHandler.initialize();
        worldWeaverNotificationService.initialize();

        // Wait for stylesheets to fully load before hiding loading skeleton
        // This prevents the flash of unstyled content (FOUC)
        const ensureStylesLoaded = () => {
            // Check if document stylesheets are loaded
            const stylesheetsLoaded = document.styleSheets.length > 0;

            if (stylesheetsLoaded) {
                // Add extra delay to ensure Tailwind classes are fully applied
                const timer = setTimeout(() => {
                    setIsInitializing(false);
                    // Trigger Safari fade-in after skeleton is hidden
                    setTimeout(() => setUiVisible(true), 50);
                }, 500); // Increased from 300ms to 500ms

                return () => clearTimeout(timer);
            } else {
                // Retry if stylesheets haven't loaded yet
                const retryTimer = setTimeout(ensureStylesLoaded, 50);
                return () => clearTimeout(retryTimer);
            }
        };

        const cleanup = ensureStylesLoaded();
        return () => { if (cleanup) cleanup(); };
    }, []);

    // Parse URL config FIRST, before any hooks that use game state
    const urlConfig = React.useMemo(() => {
        // Check for pending save load FIRST
        const pendingSaveLoadString = localStorage.getItem('pendingSaveLoad');
        if (pendingSaveLoadString) {
            try {
                const savedGame: SavedGame = JSON.parse(pendingSaveLoadString);
                localStorage.removeItem('pendingSaveLoad'); // Clear it immediately
                
                console.log('╔═══════════════════════════════════════════════════════');
                console.log('║ LOADING SAVED GAME');
                console.log('╠═══════════════════════════════════════════════════════');
                console.log('║ Save Name:', savedGame.name);
                console.log('║ Character:', savedGame.playerCharacter.name);
                console.log('║ Location:', savedGame.mapArea);
                console.log('║ Date: Year', savedGame.year, 'Month', savedGame.month, 'Day', savedGame.day);
                console.log('╚═══════════════════════════════════════════════════════');
                
                // Store the full saved game data for restoration
                localStorage.setItem('restoringFromSave', 'true');
                localStorage.setItem('savedGameData', JSON.stringify(savedGame));
                
                // Initialize seed manager with the saved seed
                SeedManager.getInstance(savedGame.mapSeed);
                
                // Store character and game mode for restoration
                localStorage.setItem('urlCharacterData', JSON.stringify(savedGame.playerCharacter));
                localStorage.setItem('urlGameMode', savedGame.gameMode);
                
                // Return a config that will trigger the proper map generation
                return {
                    dateRange: {
                        startYear: savedGame.year,
                        endYear: savedGame.year
                    },
                    geography: {
                        culturalZone: savedGame.zone as any,
                        region: savedGame.region as any
                    },
                    gameMode: savedGame.gameMode as any,
                    seed: savedGame.mapSeed,
                    savedGame: savedGame
                } as URLGameConfig & { savedGame?: SavedGame };
            } catch (error) {
                console.error('[App] Error loading saved game:', error);
                localStorage.removeItem('pendingSaveLoad');
            }
        }
        
        // Then check for new state parameter format
        const searchParams = new URLSearchParams(location.search);
        const stateParam = searchParams.get('state');
        
        if (stateParam) {
            // Try to decode the comprehensive state
            const decodedState = shareableStateService.decodeGameState(stateParam);
            if (decodedState) {
                // Validate and repair the state to ensure all fields are valid
                const fullState = shareableStateService.validateAndRepairState(decodedState);
                
                console.log('╔═══════════════════════════════════════════════════════');
                console.log('║ URL RESTORATION - STEP 1: STATE DECODED & VALIDATED');
                console.log('╠═══════════════════════════════════════════════════════');
                console.log('║ Year:', fullState.year);
                console.log('║ Map Area:', fullState.mapArea);
                console.log('║ Zone:', fullState.zone, '(validated/repaired)');
                console.log('║ Region:', fullState.region);
                console.log('║ Game Mode:', fullState.gameMode, '(validated)');
                console.log('║ Map Seed:', fullState.mapSeed, '(validated)');
                console.log('║ Character:', fullState.character?.name, '|', fullState.character?.profession);
                console.log('╚═══════════════════════════════════════════════════════');
                
                // Initialize seed manager with the validated map seed
                console.log('[URL_RESTORE] Step 2: Initializing SeedManager with seed:', fullState.mapSeed);
                SeedManager.getInstance(fullState.mapSeed);
                
                // Store character data for later restoration
                console.log('[URL_RESTORE] Step 3: Storing character data in localStorage');
                localStorage.setItem('urlCharacterData', JSON.stringify(fullState.character));

                // PHASE 3: Use unified game mode restoration
                shareableStateService.setGameModeForRestoration(fullState.gameMode);

                // Store educational mode setting (Phase 1)
                if (fullState.educationalMode) {
                    localStorage.setItem('educationalMode', 'true');
                    console.log('[URL_RESTORE] Educational mode enabled from URL');

                    // Phase 2: Initialize learning objectives if present
                    if (fullState.learningObjectives && fullState.learningObjectives.length > 0) {
                        (async () => {
                            const { learningObjectivesService } = await import('./services/learningObjectivesService');
                            const educationalSettings = {
                                learningObjectives: fullState.learningObjectives as any[],
                                assessmentFrequency: fullState.assessmentFrequency as any || 'occasional',
                                difficulty: fullState.difficulty as any || 'realistic',
                                sessionLength: fullState.sessionLength as any || 'extended',
                                trackingEnabled: true
                            };
                            learningObjectivesService.initializeSession(educationalSettings);
                            console.log('[URL_RESTORE] Learning objectives initialized:', fullState.learningObjectives);
                        })();
                    }
                }
                
                // Convert to URLGameConfig format for compatibility
                const config: URLGameConfig & { fullState?: any } = {
                    dateRange: {
                        startYear: fullState.year,
                        endYear: fullState.year
                    },
                    geography: {
                        // We'll need to determine cultural zone from the map area
                        // This is a simplified mapping - you may need to expand this
                        culturalZone: fullState.zone as any,
                        region: fullState.region as any
                    },
                    gameMode: fullState.gameMode as any,
                    seed: fullState.mapSeed,
                    fullState: fullState
                };

                // PHASE 3: Use unified game mode restoration
                if (fullState.gameMode) {
                    shareableStateService.setGameModeForRestoration(fullState.gameMode);
                }

                return config;
            }
        }
        
        // Fall back to old URL parsing
        const config = parseURLConfig(location.pathname);

        // Initialize seed if provided in URL
        if (config.seed) {
            SeedManager.getInstance(config.seed);
            console.log('[App] Initialized seed from URL:', config.seed);
        }

        // PHASE 3: Store game mode preference if provided using unified restoration
        if (config.gameMode) {
            shareableStateService.setGameModeForRestoration(config.gameMode);
            console.log('[App] Stored game mode preference:', config.gameMode);
        }

        // NEW: Store educational mode if detected from /edu suffix in URL
        if (config.educationalMode) {
            localStorage.setItem('educationalMode', 'true');
            console.log('[App] Educational mode enabled from /edu URL suffix');

            // Initialize learning objectives service with default settings
            // Using setTimeout to ensure this runs after the component mounts
            setTimeout(() => {
                (async () => {
                    try {
                        const { learningObjectivesService } = await import('./services/learningObjectivesService');
                        learningObjectivesService.initializeSession({
                            learningObjectives: ['historical-thinking', 'cultural-comparison', 'social-structures'],
                            assessmentFrequency: 'occasional',
                            difficulty: 'realistic',
                            sessionLength: 'extended',
                            trackingEnabled: true
                        });
                        console.log('[App] Learning objectives service initialized with default educational settings');
                    } catch (error) {
                        console.error('[App] Failed to initialize educational mode:', error);
                    }
                })();
            }, 0);
        }

        return config;
    }, []); // Only parse once on mount
    
    // Death modal state (modal visibility now in useUI, but data stays here)
    const [deathCause, setDeathCause] = React.useState<any>(null);
    const [npcDeathData, setNpcDeathData] = React.useState<{ npc: any; disease: any } | null>(null);
    const [diseaseProgressionQueue, setDiseaseProgressionQueue] = React.useState<DiseaseProgressionEvent[]>([]);
    const [currentDiseaseProgression, setCurrentDiseaseProgression] = React.useState<DiseaseProgressionEvent | null>(null);

    // Status warning toast state
    const [statusWarning, setStatusWarning] = React.useState<{
        type: 'health' | 'fatigue';
        severity: 'warning' | 'danger' | 'critical';
        currentValue: number;
        maxValue: number;
    } | null>(null);

    // Handle status warnings (health/fatigue)
    const handleStatusWarning = React.useCallback((
        type: 'health' | 'fatigue',
        severity: 'warning' | 'danger' | 'critical',
        currentValue: number,
        maxValue: number
    ) => {
        setStatusWarning({ type, severity, currentValue, maxValue });
    }, []);

    // Handle disease progression events
    const handleDiseaseProgression = React.useCallback((events: DiseaseProgressionEvent[]) => {
        setDiseaseProgressionQueue(prev => [...prev, ...events]);
    }, []);

    // Get hooks FIRST before defining callbacks that depend on them
    const {
        isLeftSidebarExpanded,
        setIsLeftSidebarExpanded,
        isRightSidebarVisible,
        debugSettings,
        isTestModeEnabled,
        floatingTextMessages,
        removeFloatingText,
        containerPrompt,
        hideContainerPrompt,
        isPauseModalOpen,
        setIsPauseModalOpen,
        isCampModalOpen,
        setIsCampModalOpen,
        showToast,
        showJournal,
        setShowJournal,
        showQuestsPanel,
        setShowQuestsPanel,
        highlightedWorkOfferId,
        showGameModePanel,
        setShowGameModePanel,
        showInitialScenarioModal,
        setShowInitialScenarioModal,
        showDeathModal,
        setShowDeathModal,
        showNpcDeathModal,
        setShowNpcDeathModal,
        showDiseaseProgressionModal,
        setShowDiseaseProgressionModal,
        showEventModal,
        setShowEventModal,
        showFactionsModal,
        setShowFactionsModal,
        showLanguageTree,
        setShowLanguageTree,
        selectedLanguageId,
        setSelectedLanguageId,
        showSessionSummaryModal,
        setShowSessionSummaryModal,
        showFactoryPanel,
        showAssessmentModal,
        closeAssessmentModal,
        assessmentSession,
        assessmentLogs,
        assessmentSummary,
        getAssessmentRequest,
        triggerAssessmentReview
    } = useUI();
    const { playerCharacter, setPlayerCharacter, controlledIconX, controlledIconY } = usePlayer();
    const { gameDate, currentZone, currentRegion, isLoading, addGameLogEntry, formattedTime, gameTimeHours, setGameTimeHours, setGameDate, gameLog } = useGame();
    const gameDateString = React.useMemo(() => {
        if (!gameDate) return undefined;
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${gameDate.year}-${pad(gameDate.month)}-${pad(gameDate.day)} ${formattedTime ?? ''}`.trim();
    }, [gameDate, formattedTime]);

    // Handle death callback
    const handleDeath = React.useCallback((deathInfo: any) => {
        setDeathCause(deathInfo);
        triggerAssessmentReview({ initiatedBy: 'system', trigger: 'death', reason: deathInfo?.cause ?? 'death' }, { openModal: false });
        setShowSessionSummaryModal(false);
        setShowDeathModal(true);
    }, [setShowDeathModal, triggerAssessmentReview, setShowSessionSummaryModal]);

    // Handle NPC death callback
    const handleNpcDeath = React.useCallback((npc: any, disease: any) => {
        setNpcDeathData({ npc, disease });
        setShowNpcDeathModal(true);
    }, [setShowNpcDeathModal]);

    const handleAssessmentModalClose = React.useCallback((restart = true) => {
        closeAssessmentModal(showDeathModal ? false : restart);
        setShowSessionSummaryModal(false);
    }, [closeAssessmentModal, showDeathModal, setShowSessionSummaryModal]);

    const openAssessmentModal = React.useCallback((metadata?: Record<string, unknown>) => {
        setShowSessionSummaryModal(false);
        triggerAssessmentReview(metadata, { openModal: true });
    }, [setShowSessionSummaryModal, triggerAssessmentReview]);

    const handleSessionSummaryClose = React.useCallback(() => {
        setShowSessionSummaryModal(false);
        closeAssessmentModal(true);
    }, [setShowSessionSummaryModal, closeAssessmentModal]);

    // Camp modal handlers (defined AFTER hooks)
    const handleRest = React.useCallback((healingPercent: number, fatiguePercent: number) => {
        if (!playerCharacter || !gameDate) return;

        // Apply healing
        const healAmount = Math.floor(playerCharacter.maxHealth * (healingPercent / 100));
        const newHealth = Math.min(playerCharacter.health + healAmount, playerCharacter.maxHealth);

        // Apply fatigue restoration
        const restoreAmount = Math.floor(playerCharacter.maxFatigue * (fatiguePercent / 100));
        const newFatigue = Math.max(playerCharacter.fatigue - restoreAmount, 0);

        setPlayerCharacter({
            ...playerCharacter,
            health: newHealth,
            fatigue: newFatigue
        });

        // Advance time to dawn (6 AM next day)
        const nextDay = new Date(gameDate.year, gameDate.month - 1, gameDate.day + 1);
        setGameDate({
            year: nextDay.getFullYear(),
            month: nextDay.getMonth() + 1,
            day: nextDay.getDate()
        });
        setGameTimeHours(6);

        showToast('You wake feeling refreshed at dawn.');
    }, [playerCharacter, setPlayerCharacter, gameDate, setGameDate, setGameTimeHours, showToast]);

    const handleExploreCampground = React.useCallback(() => {
        console.log('[App] Explore campground - feature not yet implemented');
        showToast('Campground exploration coming soon!');
        setIsCampModalOpen(false);
    }, [setIsCampModalOpen, showToast]);

    // Farm rest state and handler
    const [isPlayerOnFarm, setIsPlayerOnFarm] = React.useState(false);

    const handleFarmRest = React.useCallback(() => {
        if (!playerCharacter || !gameDate) return;

        // Fully restore health and fatigue
        setPlayerCharacter({
            ...playerCharacter,
            health: playerCharacter.maxHealth,
            fatigue: 0
        });

        // Advance time to dawn (6 AM next day)
        const nextDay = new Date(gameDate.year, gameDate.month - 1, gameDate.day + 1);
        setGameDate({
            year: nextDay.getFullYear(),
            month: nextDay.getMonth() + 1,
            day: nextDay.getDate()
        });
        setGameTimeHours(6);

        showToast('You wake in the farmhouse at dawn, fully refreshed.');
    }, [playerCharacter, setPlayerCharacter, gameDate, setGameDate, setGameTimeHours, showToast]);

    // Study stars mode state
    const [isStudyingStars, setIsStudyingStars] = React.useState(false);

    const handleStudyStarsToggle = React.useCallback((isActive: boolean) => {
        setIsStudyingStars(isActive);
    }, []);

    const handleReturnToCamp = React.useCallback(() => {
        setIsStudyingStars(false);
        // This will trigger the callback in CampModal to sync its state
        handleStudyStarsToggle(false);
    }, [handleStudyStarsToggle]);

    useCoreLoops(handleDeath, handleNpcDeath, handleDiseaseProgression, handleStatusWarning, isPlayerOnFarm);

    // Handle disease progression queue
    React.useEffect(() => {
        if (diseaseProgressionQueue.length > 0 && !showDiseaseProgressionModal && !currentDiseaseProgression) {
            const nextEvent = diseaseProgressionQueue[0];
            setCurrentDiseaseProgression(nextEvent);
            setShowDiseaseProgressionModal(true);
            setDiseaseProgressionQueue(prev => prev.slice(1));
        }
    }, [diseaseProgressionQueue, showDiseaseProgressionModal, currentDiseaseProgression]);
    const mapContext = useMap();
    const { localArea, mapData, currentMapSeed, onStartNewWorldAtZoneRegion, onStartNewWorldAtLocation, isSpecialMap, isEnteringSpecialMap } = mapContext;
    
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
    const isMobile = isMobileDevice();
    const [hasShownInitialScenario, setHasShownInitialScenario] = React.useState(false);
    const [hasInitializedFromURL, setHasInitializedFromURL] = React.useState(false);
    const [delayInitialMap, setDelayInitialMap] = React.useState(true);
    const [isGeneratingMap, setIsGeneratingMap] = React.useState(false);
    const [mapVisible, setMapVisible] = React.useState(true); // Easter egg state
    const [isProcessingWorldWeaver, setIsProcessingWorldWeaver] = React.useState(false); // WorldWeaver loading state
    const [worldWeaverData, setWorldWeaverData] = React.useState<{
        settingDescription?: string;
        characterDescription?: string;
        quest?: any;
    } | null>(null);
    const [showTransitionOverlay, setShowTransitionOverlay] = React.useState(false); // Full-screen overlay state

    // Use a ref to ensure we only generate once from URL
    const hasGeneratedFromURLRef = React.useRef(false);
    
    // Store whether we should wait for URL config
    const shouldWaitForURLConfig = React.useMemo(() => {
        return !!(urlConfig.geography?.culturalZone || urlConfig.dateRange);
    }, [urlConfig]);
    
    // Add a delay before generating any map to prevent double generation
    // Increased delay to give WorldWeaver a chance to set its flag
    React.useEffect(() => {
        const timer = setTimeout(() => {
            // Use startTransition to make map generation non-blocking (helps Safari performance)
            React.startTransition(() => {
                setDelayInitialMap(false);
            });
        }, 100); // Reduced delay - UI will render first via startTransition
        return () => clearTimeout(timer);
    }, []);

    // Manage transition overlay timing for WorldWeaver
    React.useEffect(() => {
        let overlayTimer: NodeJS.Timeout;

        if (isProcessingWorldWeaver) {
            // Delay overlay appearance to coordinate with sidebar fadeout
            overlayTimer = setTimeout(() => {
                setShowTransitionOverlay(true);
            }, 3500);
        } else {
            // Immediately start hiding overlay when processing ends
            setShowTransitionOverlay(false);
        }

        return () => {
            if (overlayTimer) clearTimeout(overlayTimer);
        };
    }, [isProcessingWorldWeaver]);
    
    // Generate initial world - handles both URL config and default random generation
    React.useEffect(() => {
        // Only run once
        if (hasInitializedFromURL) {
            return;
        }

        // Wait for delay to prevent double generation
        if (delayInitialMap) {
            return;
        }

        // Don't generate if already generating or loading
        if (isGeneratingMap || isLoading) {
            return;
        }

        // Don't generate if WorldWeaver is processing - it will handle map generation
        if (isProcessingWorldWeaver) {
            console.log('[App] WorldWeaver is processing, skipping default map generation');
            return;
        }

        // Don't generate if we're entering or in a special map
        if (isSpecialMap || isEnteringSpecialMap) {
            return;
        }

        // Don't generate if we already have a map AND it's not a placeholder
        // Check if mapData exists and has actual tiles (not just empty/placeholder)
        if (mapData && mapData.tiles && mapData.tiles.length > 0) {
            console.log('[App] Map already exists with tiles, skipping generation');
            return;
        }

        // Additional guard using ref to prevent double generation
        if (hasGeneratedFromURLRef.current) {
            console.log('[App] Already generated from URL, skipping duplicate generation');
            return;
        }
        
        console.log('[App] Initiating world generation...');
        setHasInitializedFromURL(true);
        hasGeneratedFromURLRef.current = true;

        // Wrap heavy generation in startTransition for better perceived performance
        React.startTransition(() => {
            setIsGeneratingMap(true);
        });

        // If we have URL config, generate based on that
        if (shouldWaitForURLConfig) {
            console.log('[URL_RESTORE] Step 3.5: Starting world generation from URL config');
            
            // Map cultural zone to the actual zone key used in GEOGRAPHICAL_DATA
            // IMPORTANT: These must match the exact keys in constants/gameData/geography.ts
            const zoneMapping: Record<string, string> = {
                'EUROPEAN': 'Europe',
                'MENA': 'MENA',  // Fixed: was 'Middle East and North Africa'
                'EAST_ASIAN': 'East Asia',
                'SOUTH_ASIAN': 'South Asia',
                'SUB_SAHARAN_AFRICAN': 'Sub Saharan Africa',  // Fixed: space not hyphen
                'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',  // Fixed: no (Pre-Columbian) suffix
                'NORTH_AMERICAN_COLONIAL': 'North America',
                'SOUTH_AMERICAN': 'South America',
                'OCEANIA': 'Oceania'
            };
            
            // Check if we have full state data from new URL format
            const fullState = (urlConfig as any).fullState;
            
            let targetZone: string;
            let targetRegion: string;
            let characterSpec: any;
            
            if (fullState) {
                // Use the specific map area from the full state
                console.log('[App] Using full state from URL:', fullState);
                
                // Intelligently determine zone and region
                let finalZone = fullState.zone;
                let finalRegion = fullState.region;
                const mapArea = fullState.mapArea;
                
                // If zone is empty or invalid, detect it from map area
                if (!finalZone || finalZone === '' || finalZone === '...') {
                    console.log('[URL_RESTORE] Zone is empty/invalid, detecting from map area:', mapArea);
                    const detected = findZoneForMapArea(mapArea);
                    if (detected) {
                        finalZone = detected.zone;
                        finalRegion = detected.region;
                        console.log('[URL_RESTORE] Detected zone:', finalZone, 'region:', finalRegion);
                    } else {
                        // Try fuzzy matching
                        console.log('[URL_RESTORE] Exact match failed, trying similar areas...');
                        const similar = findSimilarMapArea(mapArea);
                        if (similar) {
                            finalZone = similar.zone;
                            finalRegion = similar.region;
                            console.log('[URL_RESTORE] Found similar area in zone:', finalZone);
                        } else {
                            console.error('[URL_RESTORE] Could not find zone for map area:', mapArea);
                            finalZone = 'Europe'; // Ultimate fallback
                            finalRegion = '';
                        }
                    }
                }
                
                // Store complete generation context for character
                const generationContext = {
                    date: String(fullState.year),
                    location: finalZone,
                    region: finalRegion,
                    mapArea: mapArea
                };
                localStorage.setItem('urlGenerationContext', JSON.stringify(generationContext));
                
                targetZone = finalZone;
                targetRegion = finalRegion;
                characterSpec = {
                    year: fullState.year,
                    mapArea: mapArea,
                    zone: finalZone,
                    region: finalRegion
                };

                // Add profession and health status from URL if present
                if (urlConfig.profession) {
                    characterSpec.profession = urlConfig.profession;
                }
                if (urlConfig.healthStatus) {
                    characterSpec.health = urlConfig.healthStatus;
                }

                // If we have profession or health status, store character data
                if (urlConfig.profession || urlConfig.healthStatus) {
                    const characterData: any = {
                        profession: urlConfig.profession,
                        health: urlConfig.healthStatus
                    };
                    console.log('[URL] Storing character specs:', characterData);
                    localStorage.setItem('urlCharacterData', JSON.stringify(characterData));
                }

                // PHASE 3: Store game mode using unified restoration
                if (fullState.gameMode) {
                    shareableStateService.setGameModeForRestoration(fullState.gameMode);
                    console.log('[URL_RESTORE] Stored game mode for restoration:', fullState.gameMode);
                }
                
                console.log('[URL_RESTORE] Final world generation params:');
                console.log('[URL_RESTORE]   - Zone:', targetZone);
                console.log('[URL_RESTORE]   - Map Area:', mapArea);
                console.log('[URL_RESTORE]   - Region:', targetRegion);
                console.log('[URL_RESTORE]   - Year:', fullState.year);
                
                // Try to use onStartNewWorldAtLocation if available
                if (typeof onStartNewWorldAtLocation === 'function') {
                    console.log('[URL_RESTORE] Step 4: Calling onStartNewWorldAtLocation');
                    onStartNewWorldAtLocation(targetZone, mapArea, characterSpec, fullState.year);
                } else {
                    // Fallback: use onStartNewWorldAtZoneRegion
                    console.log('[URL_RESTORE] Step 4 FALLBACK: onStartNewWorldAtLocation not available');
                    onStartNewWorldAtZoneRegion(targetZone, targetRegion || '', characterSpec);
                }
            } else if (urlConfig.geography?.culturalZone || urlConfig.geography?.region || urlConfig.geography?.mapArea) {
                // Fall back to old URL parsing with zone/region/mapArea
                const mapArea = urlConfig.geography?.mapArea;

                // If we only have map area (no zone), detect it
                if (mapArea && !urlConfig.geography?.culturalZone) {
                    console.log('[App] Detecting zone from map area in URL:', mapArea);
                    const detected = findZoneForMapArea(mapArea);
                    if (detected) {
                        targetZone = detected.zone;
                        targetRegion = detected.region;
                        console.log('[App] Detected zone:', targetZone, 'region:', targetRegion);
                    } else {
                        console.warn('[App] Could not detect zone for map area:', mapArea);
                        targetZone = 'Europe'; // Fallback
                        targetRegion = '';
                    }
                } else {
                    targetZone = urlConfig.geography?.culturalZone
                        ? (zoneMapping[urlConfig.geography.culturalZone] || 'Europe')
                        : currentZone;
                    targetRegion = urlConfig.geography?.region || '';
                }

                // Generate random year within the date range
                let selectedYear: number | undefined;
                if (urlConfig.dateRange) {
                    const { startYear, endYear } = urlConfig.dateRange;
                    selectedYear = startYear === endYear
                        ? startYear
                        : Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
                }

                characterSpec = selectedYear ? { year: selectedYear } : undefined;

                // Add profession and health status from URL if present
                if (urlConfig.profession || urlConfig.healthStatus) {
                    if (!characterSpec) characterSpec = {};
                    if (urlConfig.profession) {
                        characterSpec.profession = urlConfig.profession;
                    }
                    if (urlConfig.healthStatus) {
                        characterSpec.health = urlConfig.healthStatus;
                    }

                    // Store character data for the generator
                    const characterData: any = {
                        profession: urlConfig.profession,
                        health: urlConfig.healthStatus
                    };
                    console.log('[URL] Storing character specs:', characterData);
                    localStorage.setItem('urlCharacterData', JSON.stringify(characterData));
                }

                console.log('[App] Legacy URL world generation - Zone:', targetZone, 'Region:', targetRegion, 'MapArea:', mapArea, 'Year:', selectedYear, 'Profession:', urlConfig.profession, 'Health:', urlConfig.healthStatus);

                // If we have a specific map area, use onStartNewWorldAtLocation
                if (mapArea && typeof onStartNewWorldAtLocation === 'function') {
                    console.log('[App] Using map area from URL:', mapArea);
                    onStartNewWorldAtLocation(targetZone, mapArea, characterSpec, selectedYear);
                } else {
                    // Use onStartNewWorldAtZoneRegion for legacy URLs without map area
                    console.log('[App] Generating random location in zone:', targetZone, 'region:', targetRegion || '(any)');
                    onStartNewWorldAtZoneRegion(targetZone, targetRegion, characterSpec);
                }
            } else {
                // No geography in URL - generate a default random map
                console.log('[App] Generating default random world (no URL geography)');
                onStartNewWorldAtZoneRegion('', ''); // Empty strings will trigger random selection
            }
        } else {
            // No URL config - generate a default random map
            console.log('[App] Generating default random world (no URL config)');
            onStartNewWorldAtZoneRegion('', ''); // Empty strings will trigger random selection
        }
        
        // Reset generating flag after a delay
        setTimeout(() => setIsGeneratingMap(false), 5000);
    }, [hasInitializedFromURL, delayInitialMap, shouldWaitForURLConfig, urlConfig, onStartNewWorldAtZoneRegion, onStartNewWorldAtLocation, currentZone, isGeneratingMap, isLoading, mapData, isSpecialMap, isEnteringSpecialMap, isProcessingWorldWeaver]);
    
    // Initialize event system
    const { 
        currentEvent, 
        eventHistory, 
        currentMode,
        victoryProgress,
        handleEventChoice, 
        dismissEvent,
        setGameMode,
        resetForNewGame,
        hasShownInitialEvent 
    } = useEventSystem();

    const [showModeSelector, setShowModeSelector] = React.useState(false);
    const [notificationEvent, setNotificationEvent] = React.useState(currentEvent);

    // Faction modal and tooltip state
    const [showFactionTooltip, setShowFactionTooltip] = React.useState(false);
    const [factionTooltipPosition, setFactionTooltipPosition] = React.useState({ x: 0, y: 0 });
    const [factionData, setFactionData] = React.useState<any>(null);
    
    // Update notification when new event arrives
    React.useEffect(() => {
        if (currentEvent && !showEventModal) {
            // For initial event, show modal immediately
            if (!hasShownInitialEvent) {
                setShowEventModal(true);
            } else {
                setNotificationEvent(currentEvent);
            }
        }
    }, [currentEvent, showEventModal, hasShownInitialEvent]);
    
    // Track if this is the first character for URL mode application
    // Using a ref to prevent reset during re-renders (e.g., when entering special maps)
    const hasAppliedURLModeRef = React.useRef(false);
    
    // Reset event system when starting new games, then set game mode
    const processedCharacterRef = React.useRef<string | null>(null);
    
    React.useEffect(() => {
        if (playerCharacter) {
            // Don't reset if we're entering a special map - the game mode should persist
            const isEnteringSpecial = localStorage.getItem('isEnteringSpecialMap') === 'true';
            if (isEnteringSpecial) {
                console.log('[GameMode] Entering special map, skipping game mode reset');
                return;
            }
            
            // Only process if this is a new character
            if (processedCharacterRef.current === playerCharacter.name) {
                return; // Already processed this character
            }
            processedCharacterRef.current = playerCharacter.name;

            // Add initial game start log entry
            if (addGameLogEntry && gameDate && formattedTime) {
                const mapArea = localArea || mapData?.name || 'Unknown location';
                addGameLogEntry({
                    id: `game-start-${Date.now()}`,
                    timestamp: { ...gameDate },
                    timeString: formattedTime,
                    type: 'MAP_ENTRY',
                    icon: '🗺️',
                    summary: `Started new game as ${playerCharacter.name} traversing ${mapArea}`,
                    details: undefined,
                });
            }

            console.log('[GameMode] New character detected, resetting event system');
            resetForNewGame();
            // Reset initial scenario modal state for new character
            setHasShownInitialScenario(false);
            
            // PHASE 3: Check for unified game mode restoration
            const urlGameMode = shareableStateService.getGameModeForRestoration();

            if (urlGameMode && !hasAppliedURLModeRef.current) {
                // Use the URL-specified game mode
                const mode = getGameModeById(urlGameMode);
                if (mode) {
                    console.log('[URL_RESTORE] Successfully restored game mode from URL:', urlGameMode);
                    setGameMode(mode);
                    hasAppliedURLModeRef.current = true;
                    // Note: getGameModeForRestoration() auto-clears the stored value
                } else {
                    console.warn('[GameMode] Invalid game mode from URL:', urlGameMode);
                    // Fall through to suggested mode
                    const suggestedMode = suggestGameMode(
                        playerCharacter.occupation,
                        undefined,
                        playerCharacter.historicalEra,
                        {
                            health: playerCharacter.health,
                            intelligence: playerCharacter.stats.intelligence,
                            charisma: playerCharacter.stats.charisma,
                            strength: playerCharacter.stats.strength,
                            privilege: playerCharacter.socialContext.privilege,
                            constitution: playerCharacter.stats.constitution
                        }
                    );
                    console.log('[GameMode] Using suggested mode after invalid URL mode:', suggestedMode?.name);
                    setGameMode(suggestedMode);
                }
            } else {
                // No URL mode, use suggested mode immediately
                const suggestedMode = suggestGameMode(
                    playerCharacter.occupation,
                    undefined,
                    playerCharacter.historicalEra,
                    {
                        health: playerCharacter.health,
                        intelligence: playerCharacter.stats.intelligence,
                        charisma: playerCharacter.stats.charisma,
                        strength: playerCharacter.stats.strength,
                        privilege: playerCharacter.socialContext.privilege,
                        constitution: playerCharacter.stats.constitution
                    }
                );
                console.log('[GameMode] Using suggested mode for new game:', suggestedMode?.name);
                setGameMode(suggestedMode);
            }
        }
    }, [playerCharacter?.name, resetForNewGame, setGameMode]); // Only reset when character name changes (new character)
    
    // Show InitialScenarioModal for all games (only once per character)
    React.useEffect(() => {
        if (!hasShownInitialScenario && playerCharacter && gameDate && currentZone && localArea) {
            // Show for all games if no other modals are open
            if (!showEventModal && !currentEvent) {
                setShowInitialScenarioModal(true);
                // Mark as shown immediately to prevent re-triggering
                setHasShownInitialScenario(true);
            }
        }
    }, [playerCharacter, currentMode, gameDate, currentZone, localArea, hasShownInitialScenario, showEventModal, currentEvent]);
    
    // Handle swipe gestures for mobile sidebars
    React.useEffect(() => {
        if (!mobileMenuOpen) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        let sidebarEl: HTMLElement | null = null;
        
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        
        const handleTouchEnd = (e: TouchEvent) => {
            if (!sidebarEl) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Check if horizontal swipe is dominant
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (mobileMenuOpen === 'left' && deltaX < -50) {
                    setMobileMenuOpen(null);
                } else if (mobileMenuOpen === 'right' && deltaX > 50) {
                    setMobileMenuOpen(null);
                }
            }
        };
        
        // Find the sidebar element
        const timer = setTimeout(() => {
            if (mobileMenuOpen === 'left') {
                sidebarEl = document.querySelector('.animate-slideInLeft');
            } else if (mobileMenuOpen === 'right') {
                sidebarEl = document.querySelector('.animate-slideInRight');
            }
            
            if (sidebarEl) {
                sidebarEl.addEventListener('touchstart', handleTouchStart, { passive: true });
                sidebarEl.addEventListener('touchend', handleTouchEnd, { passive: true });
            }
        }, 100);
        
        return () => {
            clearTimeout(timer);
            if (sidebarEl) {
                sidebarEl.removeEventListener('touchstart', handleTouchStart);
                sidebarEl.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [mobileMenuOpen]);

    // Show loading skeleton while initializing
    if (isInitializing) {
        return <LoadingSkeleton />;
    }

    return (
      <div
        data-surface="app-shell"
        className="app-shell theme-surface flex flex-col h-screen overflow-hidden transition-colors duration-300"
      >
        {/* Quest Notifications */}
        <QuestNotificationToast />

        {/* Status Warning Toasts (Health & Fatigue) */}
        {statusWarning && (
          <StatusWarningToast
            type={statusWarning.type}
            severity={statusWarning.severity}
            currentValue={statusWarning.currentValue}
            maxValue={statusWarning.maxValue}
            onClose={() => setStatusWarning(null)}
            onMakeCamp={() => setIsCampModalOpen(true)}
            onReturnToFarmhouse={handleFarmRest}
            isOnFarm={isPlayerOnFarm}
            duration={statusWarning.severity === 'critical' ? 0 : statusWarning.severity === 'danger' ? 8000 : 5000}
          />
        )}

        {/* Container Prompt */}
        <ContainerPrompt
          message={containerPrompt.message}
          isVisible={containerPrompt.isVisible}
          onClose={hideContainerPrompt}
        />
        
        <div className="relative flex flex-col h-full">
            {/* Desktop Navigation */}
            {!isMobile && <div className={`${isSafariBrowser ? `safari-fade-in ${uiVisible ? 'visible' : ''}` : 'animate-fade-in'} transition-opacity duration-500 ${isStudyingStars ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <TopNavBarPolished
                    onWorldWeaverLoadingChange={setIsProcessingWorldWeaver}
                    onWorldWeaverDataReceived={setWorldWeaverData}
                />
            </div>}
            
            {/* Mobile Header */}
            {isMobile && playerCharacter && (
                <MobileHeader
                    currentDate={gameDate.year}
                    location={`${currentZone || 'Unknown'} - ${currentRegion || ''}`}
                    player={playerCharacter}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />
            )}
            <div className="relative flex-1 flex items-stretch overflow-hidden p-0 sm:p-0 md:p-0 lg:p-0 xl:p-0 gap-0 sm:gap-0 md:gap-0 lg:gap-0 xl:gap-0 h-full max-h-full">
                {/* Desktop sidebar toggle */}
                {!isLeftSidebarExpanded && (
                    <button 
                        onClick={() => setIsLeftSidebarExpanded(true)}
                        className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-2 z-30 w-8 h-16 items-center justify-center surface-muted text-text-secondary rounded-r-lg border border-surface-muted hover:shadow-md transition-all shadow-lg animate-pulseGlow"
                        aria-label="Expand Sidebar"
                        title="Expand Sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
                
                {/* Mobile menu buttons - larger and better positioned */}
                <button 
                    onClick={() => setMobileMenuOpen(mobileMenuOpen === 'left' ? null : 'left')}
                    className="sm:hidden fixed top-16 left-0 z-40 w-12 h-12 flex items-center justify-center surface-muted text-text-primary rounded-r-lg border border-surface-muted hover:shadow-md shadow-xl backdrop-blur-sm"
                    aria-label="Toggle Left Menu"
                >
                    {mobileMenuOpen === 'left' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
                
                <button 
                    onClick={() => setMobileMenuOpen(mobileMenuOpen === 'right' ? null : 'right')}
                    className="sm:hidden fixed top-16 right-0 z-40 w-12 h-12 flex items-center justify-center surface-muted text-text-primary rounded-l-lg border border-surface-muted hover:shadow-md shadow-xl backdrop-blur-sm"
                    aria-label="Toggle Right Menu"
                >
                    {mobileMenuOpen === 'right' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} fill="none" />
                        </svg>
                    )}
                </button>
                
                {/* Left Sidebar with mobile overlay and slide animation - hidden when factory panel is open */}
                {!showFactoryPanel && (
                <div className={`${mobileMenuOpen === 'left' ? 'fixed inset-0 z-30 sm:relative sm:inset-auto sm:flex' : 'hidden sm:flex'} sm:h-full transition-opacity duration-500 ${isStudyingStars ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {mobileMenuOpen === 'left' && (
                        <div className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(null)} />
                    )}
                    <div className={`${mobileMenuOpen === 'left' ? 'absolute left-0 top-0 h-full animate-slideInLeft sidebar-content' : `h-full ${isSafariBrowser ? `safari-slide-left ${uiVisible ? 'visible' : ''}` : 'animate-slide-in-left delay-100'}`} max-w-[85vw] sm:max-w-none overflow-y-auto`}>
                        <LeftSidebar
                    onShowFactionsModal={(data) => {
                        setFactionData(data);
                        setShowFactionsModal(true);
                    }}
                    onShowFactionTooltip={(data, x, y) => {
                        setFactionData(data);
                        setFactionTooltipPosition({ x, y });
                        setShowFactionTooltip(true);
                    }}
                    onHideFactionTooltip={() => setShowFactionTooltip(false)}
                    onToggleMapVisibility={() => setMapVisible(!mapVisible)}
                    isProcessingWorldWeaver={isProcessingWorldWeaver}
                />
                    </div>
                </div>
                )}

                <MapViewport
                    key={currentMapSeed || 'default'}
                    mapVisible={mapVisible}
                    isProcessingWorldWeaver={isProcessingWorldWeaver}
                    onPlayerDeath={handleDeath}
                    onFarmPanelChange={setIsPlayerOnFarm}
                    className={`${isSafariBrowser ? `safari-fade-in-scale ${uiVisible ? 'visible' : ''}` : 'animate-fade-in-scale delay-200'}`}
                    isStudyingStars={isStudyingStars}
                />
                
                {/* Right Sidebar with mobile overlay and slide animation */}
                {isRightSidebarVisible && (
                    <div className={`${mobileMenuOpen === 'right' ? 'fixed inset-0 z-30 sm:relative sm:inset-auto sm:flex' : 'hidden sm:flex'} sm:h-full transition-all duration-500 ${isStudyingStars ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {mobileMenuOpen === 'right' && (
                            <div className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(null)} />
                        )}
                        <div className={`${mobileMenuOpen === 'right' ? 'absolute right-0 top-0 h-full animate-slideInRight sidebar-content' : `h-full ${isSafariBrowser ? '' : 'animate-slide-in-right delay-100'}`} max-w-[85vw] sm:max-w-none overflow-y-auto`}>
                            <RightSidebar isProcessingWorldWeaver={isProcessingWorldWeaver} />
                        </div>
                    </div>
                )}
            </div>
        </div>
        <ModalHub />
        <PauseModal
          isOpen={isPauseModalOpen}
          onClose={() => setIsPauseModalOpen(false)}
        />
        <TransitionOverlay
          isVisible={showTransitionOverlay}
          isProcessing={isProcessingWorldWeaver}
        />
        <StudyStarsOverlay
          isVisible={isStudyingStars}
          gameTimeHours={gameTimeHours}
          gameDate={gameDate}
          climate={mapData?.climate}
          season={mapData?.season}
          onReturnToCamp={handleReturnToCamp}
        />
        <DebugOverlay />
        {isTestModeEnabled && debugSettings.showFPS && !debugSettings.logPerformanceMetrics && (
          <FPSCounter position="top-right" />
        )}
        
        {/* Quest Reward Notifications */}
        <QuestRewardNotification />
        
        {/* Event System Components */}
        {showEventModal && currentEvent && playerCharacter && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <EventModal
              event={currentEvent}
              player={playerCharacter}
              onChoice={(choice) => {
                handleEventChoice(choice);
                setShowEventModal(false);
                setNotificationEvent(null);
              }}
              onClose={() => {
                setShowEventModal(false);
              }}
            />
          </Suspense>
        )}
        
        <EventNotification
          event={notificationEvent}
          onOpen={() => {
            setShowEventModal(true);
            setNotificationEvent(null);
          }}
          onDismiss={() => {
            dismissEvent();
            setNotificationEvent(null);
          }}
        />
        
        <EventBadge
          hasEvent={!!currentEvent && !showEventModal && !notificationEvent}
          onClick={() => setShowEventModal(true)}
        />
        
        {/* Victory progress is now shown in the game mode dropdown in TopNavBar */}
        
        {/* Mode Selector Modal */}
        {showModeSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full p-6">
              <GameModeSelector
                currentMode={currentMode}
                onModeSelect={(mode) => {
                  setGameMode(mode);
                  setShowModeSelector(false);
                }}
              />
              <button
                onClick={() => setShowModeSelector(false)}
                className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 
                         text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Faction Modal */}
        {showFactionsModal && factionData && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <FactionsModal
              onClose={() => setShowFactionsModal(false)}
              currentZone={localArea}
              currentRegion={currentRegion}
              dominantPower={factionData.dominantPower}
              dominantPowerDescription={factionData.dominantPowerDescription}
              allegianceGroups={factionData.allegianceGroups}
              gameYear={gameDate?.year}
            />
          </Suspense>
        )}
        
        {/* Faction Tooltip */}
        {showFactionTooltip && factionData && (
          <FactionTooltip
            dominantPower={factionData.dominantPower || "Local Tribes"}
            allegianceGroups={factionData.allegianceGroups || []}
            x={factionTooltipPosition.x}
            y={factionTooltipPosition.y}
          />
        )}
        
        {/* Initial Scenario Modal for all games */}
        {showInitialScenarioModal && playerCharacter && gameDate && currentZone && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <InitialScenarioModal
              isOpen={showInitialScenarioModal}
              onClose={() => {
                setShowInitialScenarioModal(false);
                // Clear WorldWeaver data after use
                if (worldWeaverData) {
                  setWorldWeaverData(null);
                }
              }}
              playerCharacter={playerCharacter}
              gameDate={gameDate}
              currentZone={currentZone}
              worldWeaverData={worldWeaverData}
              currentRegion={currentRegion || currentZone} // Use actual region, fallback to zone
              localArea={localArea || 'Unknown Region'} // Use actual localArea from map
              gameMode={currentMode}
              urlConfig={urlConfig}
              isProcessingWorldWeaver={isProcessingWorldWeaver}
            />
          </Suspense>
        )}

        {/* Floating Text System */}
        <FloatingText
          messages={floatingTextMessages}
          onMessageComplete={removeFloatingText}
        />

        <SessionCompletionModal
          isOpen={showSessionSummaryModal}
          session={assessmentSession}
          summary={assessmentSummary}
          onClose={handleSessionSummaryClose}
          onViewAssessment={() => openAssessmentModal({ trigger: 'manual_end', initiatedBy: 'player' })}
        />

        <AssessmentModal
          isOpen={showAssessmentModal}
          onClose={handleAssessmentModalClose}
          session={assessmentSession}
          summary={assessmentSummary}
          logs={assessmentLogs}
          buildRequest={getAssessmentRequest}
          player={playerCharacter}
          gameDateString={gameDateString}
        />

        {/* Death Modal */}
        {playerCharacter && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <GameOverModal
              isOpen={showDeathModal}
              causeOfDeath={deathCause || { type: 'accident' }}
              playerStats={{
                name: playerCharacter.name,
                age: playerCharacter.age,
                daysAlive: gameDate ? (gameDate.year * 365 + gameDate.month * 30 + gameDate.day) : 0,
                location: localArea || currentZone || 'Unknown',
                year: gameDate?.year,
                profession: playerCharacter.profession,
                culturalZone: currentZone,
                distanceTraveled: playerCharacter.distanceTraveled || 0,
                itemsCollected: playerCharacter.inventory?.length || 0,
                questsCompleted: playerCharacter.questsCompleted || 0,
                npcsMetTotal: playerCharacter.npcsMetTotal || 0
              }}
              achievements={playerCharacter.achievements || []}
              onRestart={() => {
                setShowDeathModal(false);
                window.location.reload(); // Simple restart for now
              }}
              onMainMenu={() => {
                setShowDeathModal(false);
                navigate('/'); // Navigate to main menu
              }}
              onViewAssessment={() => openAssessmentModal({ trigger: 'death', initiatedBy: 'system' })}
              assessmentSummary={assessmentSummary}
            />
          </Suspense>
        )}

        {/* NPC Death Modal */}
        {showNpcDeathModal && npcDeathData && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <NpcDeathModal
              isOpen={showNpcDeathModal}
              npc={npcDeathData.npc}
              disease={npcDeathData.disease}
              onClose={() => {
                setShowNpcDeathModal(false);
                setNpcDeathData(null);
              }}
            />
          </Suspense>
        )}

        {/* Disease Progression Modal */}
        {showDiseaseProgressionModal && currentDiseaseProgression && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <DiseaseProgressionModal
              isOpen={showDiseaseProgressionModal}
              title={currentDiseaseProgression.title}
              description={currentDiseaseProgression.description}
              icon={currentDiseaseProgression.icon}
              diseaseName={currentDiseaseProgression.diseaseName}
              stage={currentDiseaseProgression.stage}
              onClose={() => {
                setShowDiseaseProgressionModal(false);
                setCurrentDiseaseProgression(null);
            }}
          />
          </Suspense>
        )}

        {/* Tooltip Portal Container - Renders tooltips above all other UI elements */}
        <div id="tooltip-portal" className="pointer-events-none fixed inset-0 z-[9999]" />

        {/* Camp Modal */}
        {isCampModalOpen && playerCharacter && mapData && controlledIconX !== null && controlledIconY !== null && (
          <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
            <CampModal
              isOpen={isCampModalOpen}
              onClose={() => setIsCampModalOpen(false)}
              playerCharacter={playerCharacter}
              currentBiome={mapData.tiles[controlledIconY]?.[controlledIconX]?.biome || 'GRASSLAND' as any}
              mapData={mapData}
              onRest={handleRest}
              onExploreCampground={handleExploreCampground}
              timeOfDay={gameTimeHours}
              gamelog={gameLog}
              onStudyStarsToggle={handleStudyStarsToggle}
              isStudyingStarsFromParent={isStudyingStars}
            />
          </Suspense>
        )}

        {/* Journal Viewport - rendered at App level for proper z-index */}
        <JournalViewport
          visible={showJournal}
          onClose={() => setShowJournal(false)}
          currentLocation={currentZone || 'Unknown Location'}
          currentDate={gameDate ? `${gameDate.month}/${gameDate.day}/${gameDate.year}` : 'Unknown Date'}
          currentCulturalZone={playerCharacter?.culturalZone}
        />

        {/* Quests Panel - rendered at App level for proper z-index */}
        <QuestsPanel
          isOpen={showQuestsPanel}
          onClose={() => setShowQuestsPanel(false)}
          highlightedWorkOfferId={highlightedWorkOfferId}
          currentGameHours={gameTimeHours}
          currentMapSeed={currentMapSeed?.toString()}
          playerCharacter={playerCharacter}
          onUpdatePlayer={setPlayerCharacter}
          onNavigateToQuest={(x, y) => {
            console.log('Centering map on quest at:', x, y);
            // Center the map view on the quest location WITHOUT moving the player
            const centerEvent = new CustomEvent('centerMapOnLocation', {
              detail: { x, y }
            });
            window.dispatchEvent(centerEvent);
            setShowQuestsPanel(false);
            // Show a notification that we're centering the view
            const notification = document.createElement('div');
            notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[60] animate-in fade-in slide-in-from-top-4 duration-300';
            notification.textContent = `Showing quest objective at (${x}, ${y})`;
            document.body.appendChild(notification);
            setTimeout(() => {
              notification.classList.add('animate-out', 'fade-out', 'slide-out-to-top-4');
              setTimeout(() => notification.remove(), 300);
            }, 2000);
          }}
        />

        {/* Game Mode Panel - rendered at App level for proper z-index */}
        <GameModePanel
          isOpen={showGameModePanel}
          onClose={() => setShowGameModePanel(false)}
        />

        {/* Language Family Tree - rendered at App level for proper z-index */}
        {showLanguageTree && selectedLanguageId && (
          <LanguageFamilyTree
            isOpen={showLanguageTree}
            onClose={() => {
              setShowLanguageTree(false);
              setSelectedLanguageId(null);
            }}
            initialLanguageId={selectedLanguageId}
            currentYear={gameDate?.year || 1500}
          />
        )}
      </div>
    );
};


const App: React.FC = () => {
  return (
    <Routes>
      {/* Educational Setup Screen */}
      <Route path="/home" element={<GameSetupScreen />} />

      {/* Main Game - All other routes */}
      <Route path="/*" element={
        <GameProvider>
          <PlayerProvider>
            <MapProvider>
              <UIProvider>
                <AppContent />
              </UIProvider>
            </MapProvider>
          </PlayerProvider>
        </GameProvider>
      } />
    </Routes>
  );
};

export default App;
