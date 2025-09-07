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
import { useURLGameConfig } from './hooks/useURLGameConfig';
import FactionsModal from './components/FactionsModal';
import FactionTooltip from './components/FactionTooltip';

const AppContent: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse URL config FIRST, before any hooks that use game state
    const urlConfig = React.useMemo(() => {
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
    const { localArea, mapData, onStartNewWorldAtZoneRegion, isSpecialMap, isEnteringSpecialMap } = useMap();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
    const [showInitialScenarioModal, setShowInitialScenarioModal] = React.useState(false);
    const isMobile = isMobileDevice();
    const [hasShownInitialScenario, setHasShownInitialScenario] = React.useState(false);
    const [hasInitializedFromURL, setHasInitializedFromURL] = React.useState(false);
    const [delayInitialMap, setDelayInitialMap] = React.useState(true);
    const [isGeneratingMap, setIsGeneratingMap] = React.useState(false);
    const [mapVisible, setMapVisible] = React.useState(true); // Easter egg state
    
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
        
        console.log('[App] Initiating world generation...');
        setHasInitializedFromURL(true);
        setIsGeneratingMap(true);
        
        // If we have URL config, generate based on that
        if (shouldWaitForURLConfig) {
            console.log('[App] Generating initial world from URL config');
            
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
            
            const targetZone = urlConfig.geography?.culturalZone 
                ? (zoneMapping[urlConfig.geography.culturalZone] || 'Europe')
                : currentZone; // Use the zone from initial state if no geography in URL
            const targetRegion = urlConfig.geography?.region || '';
            
            // Create character spec if we have date config
            const characterSpec = urlConfig.dateRange ? { year: urlConfig.dateRange.startYear } : undefined;
            
            console.log('[App] Starting world generation from URL:', targetZone, targetRegion, characterSpec);
            
            // Start world generation immediately
            onStartNewWorldAtZoneRegion(targetZone, targetRegion, characterSpec);
        } else {
            // No URL config - generate a default random map
            console.log('[App] Generating default random world (no URL config)');
            onStartNewWorldAtZoneRegion('', ''); // Empty strings will trigger random selection
        }
        
        // Reset generating flag after a delay
        setTimeout(() => setIsGeneratingMap(false), 5000);
    }, [hasInitializedFromURL, delayInitialMap, shouldWaitForURLConfig, urlConfig, onStartNewWorldAtZoneRegion, currentZone, isGeneratingMap, isLoading, mapData, isSpecialMap, isEnteringSpecialMap]);
    
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
    React.useEffect(() => {
        if (playerCharacter) {
            // Don't reset if we're entering a special map - the game mode should persist
            const isEnteringSpecial = localStorage.getItem('isEnteringSpecialMap') === 'true';
            if (isEnteringSpecial) {
                console.log('[GameMode] Entering special map, skipping game mode reset');
                return;
            }
            
            console.log('[GameMode] New character detected, resetting event system');
            resetForNewGame();
            // Reset initial scenario modal state for new character
            setHasShownInitialScenario(false);
            
            // Check if we have a URL-configured game mode (only apply once)
            const urlGameMode = localStorage.getItem('urlConfigGameMode');
            let mode;
            
            if (urlGameMode && !hasAppliedURLModeRef.current) {
                // Use the URL-specified game mode using the getGameModeById function
                mode = getGameModeById(urlGameMode);
                if (mode) {
                    console.log('[GameMode] Using URL-configured mode:', urlGameMode);
                    hasAppliedURLModeRef.current = true;
                    // Don't clear it yet - let it persist for the correct character
                } else {
                    console.warn('[GameMode] Invalid game mode from URL:', urlGameMode);
                }
            }
            
            if (!mode) {
                // Fall back to procedural mode selection
                mode = suggestGameMode(
                    playerCharacter.occupation,
                    undefined, // location
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
            }
            
            // Set mode immediately after reset to avoid race condition
            setGameMode(mode);
            
            console.log('═══════════════════════════════════════════════════════');
            console.log('[GameMode] MODE SELECTION COMPLETE');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Selected Mode:', mode?.name || 'NONE');
            console.log('Mode was from URL:', !!urlGameMode && hasAppliedURLModeRef.current);
            console.log('Character:', playerCharacter.name, '|', playerCharacter.occupation);
            console.log('Era:', playerCharacter.historicalEra);
            if (mode) {
                console.log('Mode ID:', mode.id);
                console.log('Mode Description:', mode.description);
                console.log('Victory Conditions:', mode.victoryConditions?.map(v => v.description) || 'None');
            } else {
                console.error('[GameMode] ERROR: No mode was selected!');
            }
            console.log('═══════════════════════════════════════════════════════');
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