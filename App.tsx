/**
 * App.tsx - Main application component for the Map Voyager Engine
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import MobileHeader from './components/mobile/MobileHeader';
import MobileQuickStats from './components/mobile/MobileQuickStats';
import MobileSidebar from './components/mobile/MobileSidebar';
import ModalHub from './components/ModalHub';
import DebugOverlay from './components/DebugOverlay';
import FPSCounter from './components/FPSCounter';
import { EventModal } from './components/EventModal';
import { EventNotification, EventBadge } from './components/EventNotification';
import { GameModeSelector } from './components/GameModeSelector';
import { suggestGameMode, GAME_MODES, getGameModeById } from './constants/gameData/gameModes';
import InitialScenarioModal from './components/InitialScenarioModal';
import { eventService } from './services/eventService';
import QuestRewardNotification from './components/QuestRewardNotification';
import { parseURLConfig, URLGameConfig } from './services/urlConfigService';
import { SeedManager } from './services/seedService';
import { shareableStateService } from './services/shareableStateService';
import { findZoneForMapArea, findSimilarMapArea } from './services/zoneDetectionService';
import { useURLGameConfig } from './hooks/useURLGameConfig';
import FactionsModal from './components/FactionsModal';
import FactionTooltip from './components/FactionTooltip';

const AppContent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse URL config FIRST, before any hooks that use game state
    const urlConfig = React.useMemo(() => {
        // First check for new state parameter format
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
                localStorage.setItem('urlGameMode', fullState.gameMode);
                
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
                
                // Store game mode preference
                localStorage.setItem('urlConfigGameMode', fullState.gameMode);
                
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
        
        // Store game mode preference if provided
        if (config.gameMode) {
            localStorage.setItem('urlConfigGameMode', config.gameMode);
            console.log('[App] Stored game mode preference:', config.gameMode);
        }
        
        return config;
    }, []); // Only parse once on mount
    
    useCoreLoops();
    const { isLeftSidebarExpanded, setIsLeftSidebarExpanded, debugSettings, isTestModeEnabled } = useUI();
    const { playerCharacter } = usePlayer();
    const { gameDate, currentZone, currentRegion, isLoading } = useGame();
    const mapContext = useMap();
    const { localArea, mapData, onStartNewWorldAtZoneRegion, onStartNewWorldAtLocation, isSpecialMap, isEnteringSpecialMap } = mapContext;
    
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
    const [showInitialScenarioModal, setShowInitialScenarioModal] = React.useState(false);
    const isMobile = isMobileDevice();
    const [hasShownInitialScenario, setHasShownInitialScenario] = React.useState(false);
    const [hasInitializedFromURL, setHasInitializedFromURL] = React.useState(false);
    const [delayInitialMap, setDelayInitialMap] = React.useState(true);
    const [isGeneratingMap, setIsGeneratingMap] = React.useState(false);
    const [mapVisible, setMapVisible] = React.useState(true); // Easter egg state
    
    // Use a ref to ensure we only generate once from URL
    const hasGeneratedFromURLRef = React.useRef(false);
    
    // Store whether we should wait for URL config
    const shouldWaitForURLConfig = React.useMemo(() => {
        return !!(urlConfig.geography?.culturalZone || urlConfig.dateRange);
    }, [urlConfig]);
    
    // Add a delay before generating any map to prevent double generation
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDelayInitialMap(false);
        }, 100); // Small delay to let React settle
        return () => clearTimeout(timer);
    }, []);
    
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
        
        // Don't generate if we're entering or in a special map
        if (isSpecialMap || isEnteringSpecialMap) {
            return;
        }
        
        // Don't generate if we already have a map
        if (mapData) {
            return;
        }
        
        // Additional guard using ref to prevent double generation
        if (hasGeneratedFromURLRef.current) {
            console.log('[App] Already generated from URL, skipping duplicate generation');
            return;
        }
        
        console.log('[App] Initiating world generation...');
        setHasInitializedFromURL(true);
        setIsGeneratingMap(true);
        hasGeneratedFromURLRef.current = true;
        
        // If we have URL config, generate based on that
        if (shouldWaitForURLConfig) {
            console.log('[URL_RESTORE] Step 3.5: Starting world generation from URL config');
            
            // Map cultural zone to the actual zone key used in GEOGRAPHICAL_DATA
            const zoneMapping: Record<string, string> = {
                'EUROPEAN': 'Europe',
                'MENA': 'Middle East and North Africa',
                'EAST_ASIAN': 'East Asia',
                'SOUTH_ASIAN': 'South Asia',
                'SUB_SAHARAN_AFRICAN': 'Sub-Saharan Africa',
                'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America (Pre-Columbian)',
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
                
                // Store game mode in localStorage for restoration after character creation
                if (fullState.gameMode) {
                    localStorage.setItem('urlConfigGameMode', fullState.gameMode);
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
            } else if (urlConfig.geography?.culturalZone || urlConfig.geography?.region) {
                // Fall back to old URL parsing with zone/region
                targetZone = urlConfig.geography?.culturalZone 
                    ? (zoneMapping[urlConfig.geography.culturalZone] || 'Europe')
                    : currentZone;
                targetRegion = urlConfig.geography?.region || '';
                characterSpec = urlConfig.dateRange ? { year: urlConfig.dateRange.startYear } : undefined;
                
                console.log('[App] Legacy URL world generation - Zone:', targetZone, 'Region:', targetRegion);
                
                // Use onStartNewWorldAtZoneRegion for legacy URLs
                onStartNewWorldAtZoneRegion(targetZone, targetRegion, characterSpec);
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
    }, [hasInitializedFromURL, delayInitialMap, shouldWaitForURLConfig, urlConfig, onStartNewWorldAtZoneRegion, onStartNewWorldAtLocation, currentZone, isGeneratingMap, isLoading, mapData, isSpecialMap, isEnteringSpecialMap]);
    
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
    
    const [showEventModal, setShowEventModal] = React.useState(false);
    const [showModeSelector, setShowModeSelector] = React.useState(false);
    const [notificationEvent, setNotificationEvent] = React.useState(currentEvent);
    
    // Faction modal and tooltip state
    const [showFactionsModal, setShowFactionsModal] = React.useState(false);
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
            
            console.log('[GameMode] New character detected, resetting event system');
            resetForNewGame();
            // Reset initial scenario modal state for new character
            setHasShownInitialScenario(false);
            
            // Try to get URL game mode with retries
            const attemptGameModeRestore = (attemptNum: number = 0) => {
                // Check if we have a URL-configured game mode (only apply once)
                const urlGameMode = 
                    localStorage.getItem('urlConfigGameMode') ||
                    localStorage.getItem('urlGameMode') ||
                    localStorage.getItem('pendingGameMode');
                
                if (urlGameMode && !hasAppliedURLModeRef.current) {
                    // Use the URL-specified game mode
                    const mode = getGameModeById(urlGameMode);
                    if (mode) {
                        console.log('[URL_RESTORE] Successfully restored game mode from URL:', urlGameMode);
                        setGameMode(mode);
                        hasAppliedURLModeRef.current = true;
                        
                        // Clear storage after successful application
                        setTimeout(() => {
                            localStorage.removeItem('urlConfigGameMode');
                            localStorage.removeItem('urlGameMode');
                            localStorage.removeItem('pendingGameMode');
                        }, 2000);
                        return true;
                    } else {
                        console.warn('[GameMode] Invalid game mode from URL:', urlGameMode);
                    }
                } else if (attemptNum < 5 && !hasAppliedURLModeRef.current) {
                    // Retry after a delay
                    setTimeout(() => attemptGameModeRestore(attemptNum + 1), 500);
                    return false;
                }
                
                // If no URL mode or all attempts failed, use suggested mode
                if (!hasAppliedURLModeRef.current) {
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
                    console.log('[GameMode] Using suggested mode:', suggestedMode?.name);
                    setGameMode(suggestedMode);
                }
                return false;
            };
            
            // Start the game mode restoration attempt
            attemptGameModeRestore();
        }
    }, [playerCharacter?.name, resetForNewGame, setGameMode]); // Only reset when character name changes (new character)
    
    // Show InitialScenarioModal for non-WorldWeaver games (only once per character)
    React.useEffect(() => {
        // Only run this check if we haven't shown the modal yet
        if (!hasShownInitialScenario && playerCharacter && currentMode && gameDate && currentZone && localArea) {
            // Check if this is NOT a WorldWeaver game (no custom events from LLM)
            const customEvents = eventService.getCustomEventArchetypes();
            const isWorldWeaver = customEvents && customEvents.length > 0;
            
            // Only show if it's not WorldWeaver and no other modals are open
            if (!isWorldWeaver && !showEventModal && !currentEvent) {
                console.log('[InitialScenario] Showing scenario modal for non-WorldWeaver game');
                console.log('[InitialScenario] Region:', currentRegion, 'LocalArea:', localArea);
                setShowInitialScenarioModal(true);
                // Mark as shown immediately to prevent re-triggering
                setHasShownInitialScenario(true);
            }
        }
    }, [playerCharacter, currentMode, gameDate, currentZone, currentRegion, localArea, hasShownInitialScenario, showEventModal, currentEvent]);
    
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

    return (
      <div className="bg-slate-900 text-gray-100 flex flex-col h-screen overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
            {/* Desktop Navigation */}
            {!isMobile && <TopNavBarPolished />}
            
            {/* Mobile Header */}
            {isMobile && playerCharacter && (
                <MobileHeader
                    currentDate={gameDate.year}
                    location={`${currentZone || 'Unknown'} - ${currentRegion || ''}`}
                    player={playerCharacter}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />
            )}
            <div className="relative flex-1 flex items-stretch overflow-hidden p-0 sm:p-0 md:p-0 lg:p-1 xl:p-0 gap-0 sm:gap-1 md:gap-1 lg:gap-1 xl:gap-1 h-full max-h-full">
                {/* Desktop sidebar toggle */}
                {!isLeftSidebarExpanded && (
                    <button 
                        onClick={() => setIsLeftSidebarExpanded(true)}
                        className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-2 z-30 w-8 h-16 items-center justify-center bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 rounded-r-lg border-y border-r border-slate-600/80 transition-all shadow-lg animate-pulseGlow"
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
                    className="sm:hidden fixed top-16 left-0 z-40 w-12 h-12 flex items-center justify-center bg-slate-900/95 active:bg-slate-700 text-slate-200 rounded-r-lg border border-slate-500/60 shadow-xl backdrop-blur-sm"
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
                    className="sm:hidden fixed top-16 right-0 z-40 w-12 h-12 flex items-center justify-center bg-slate-900/95 active:bg-slate-700 text-slate-200 rounded-l-lg border border-slate-500/60 shadow-xl backdrop-blur-sm"
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
                
                {/* Left Sidebar with mobile overlay and slide animation */}
                <div className={`${mobileMenuOpen === 'left' ? 'fixed inset-0 z-30 sm:relative sm:inset-auto sm:flex' : 'hidden sm:flex'} sm:h-full`}>
                    {mobileMenuOpen === 'left' && (
                        <div className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(null)} />
                    )}
                    <div className={`${mobileMenuOpen === 'left' ? 'absolute left-0 top-0 h-full animate-slideInLeft sidebar-content' : 'h-full'} max-w-[85vw] sm:max-w-none overflow-y-auto`}>
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
                />
                    </div>
                </div>
                
                <MapViewport mapVisible={mapVisible} />
                
                {/* Right Sidebar with mobile overlay and slide animation */}
                <div className={`${mobileMenuOpen === 'right' ? 'fixed inset-0 z-30 sm:relative sm:inset-auto sm:flex' : 'hidden sm:flex'} sm:h-full`}>
                    {mobileMenuOpen === 'right' && (
                        <div className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(null)} />
                    )}
                    <div className={`${mobileMenuOpen === 'right' ? 'absolute right-0 top-0 h-full animate-slideInRight sidebar-content' : 'h-full'} max-w-[85vw] sm:max-w-none overflow-y-auto`}>
                        <RightSidebar />
                    </div>
                </div>
            </div>
        </div>
        <ModalHub />
        <DebugOverlay />
        {isTestModeEnabled && debugSettings.showFPS && !debugSettings.logPerformanceMetrics && (
          <FPSCounter position="top-right" />
        )}
        
        {/* Quest Reward Notifications */}
        <QuestRewardNotification />
        
        {/* Event System Components */}
        {showEventModal && currentEvent && playerCharacter && (
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
          <FactionsModal
            onClose={() => setShowFactionsModal(false)}
            currentZone={localArea}
            currentRegion={currentRegion}
            dominantPower={factionData.dominantPower}
            dominantPowerDescription={factionData.dominantPowerDescription}
            allegianceGroups={factionData.allegianceGroups}
            gameYear={gameDate?.year}
          />
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
        
        {/* Initial Scenario Modal for non-WorldWeaver games */}
        {showInitialScenarioModal && playerCharacter && gameDate && currentZone && (
          <InitialScenarioModal
            isOpen={showInitialScenarioModal}
            onClose={() => {
              setShowInitialScenarioModal(false);
              // Don't need to set hasShownInitialScenario here as it's already set when showing
            }}
            playerCharacter={playerCharacter}
            gameDate={gameDate}
            currentZone={currentZone}
            currentRegion={currentRegion || currentZone} // Use actual region, fallback to zone
            localArea={localArea || 'Unknown Region'} // Use actual localArea from map
            gameMode={currentMode}
            urlConfig={urlConfig}
          />
        )}
      </div>
    );
};


const App: React.FC = () => {
  return (
    <GameProvider>
      <PlayerProvider>
        <MapProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </MapProvider>
      </PlayerProvider>
    </GameProvider>
  );
};

export default App;