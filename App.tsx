/**
 * App.tsx - Main application component for the Map Voyager Engine
 */
import React from 'react';
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
import ModalHub from './components/ModalHub';
import DebugOverlay from './components/DebugOverlay';
import FPSCounter from './components/FPSCounter';
import { EventModal } from './components/EventModal';
import { EventNotification, EventBadge } from './components/EventNotification';
import { GameModeSelector } from './components/GameModeSelector';
import { suggestGameMode } from './constants/gameData/gameModes';
import InitialScenarioModal from './components/InitialScenarioModal';
import { eventService } from './services/eventService';
import QuestRewardNotification from './components/QuestRewardNotification';

const AppContent: React.FC = () => {
    useCoreLoops();
    const { isLeftSidebarExpanded, setIsLeftSidebarExpanded, debugSettings, isTestModeEnabled } = useUI();
    const { playerCharacter } = usePlayer();
    const { gameDate, currentZone, currentRegion } = useGame();
    const { localArea } = useMap();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);
    const [showInitialScenarioModal, setShowInitialScenarioModal] = React.useState(false);
    const [hasShownInitialScenario, setHasShownInitialScenario] = React.useState(false);
    
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
    
    // Reset event system when starting new games, then set game mode
    React.useEffect(() => {
        if (playerCharacter) {
            console.log('[GameMode] New character detected, resetting event system');
            resetForNewGame();
            // Reset initial scenario modal state for new character
            setHasShownInitialScenario(false);
            
            // Use character attributes to suggest mode with weighted probability
            // This happens for EVERY game start, not just World Weaver
            const mode = suggestGameMode(
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
            
            // Set mode immediately after reset to avoid race condition
            setGameMode(mode);
            
            console.log('═══════════════════════════════════════════════════════');
            console.log('[GameMode] PROCEDURAL MODE SELECTION FOR ALL GAMES');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Selected Mode:', mode.name);
            console.log('Character:', playerCharacter.name, '|', playerCharacter.occupation);
            console.log('Era:', playerCharacter.historicalEra);
            console.log('Character Stats:', {
                health: playerCharacter.health,
                intelligence: playerCharacter.stats.intelligence,
                charisma: playerCharacter.stats.charisma,
                strength: playerCharacter.stats.strength,
                privilege: playerCharacter.socialContext.privilege,
                constitution: playerCharacter.stats.constitution
            });
            console.log('Mode Description:', mode.description);
            console.log('Victory Conditions:', mode.victoryConditions.map(v => v.description));
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
            <TopNavBarPolished />
            <div className="relative flex-1 flex items-stretch overflow-hidden p-0 sm:p-1 md:p-2 lg:p-3 xl:p-4 gap-0 sm:gap-1 md:gap-2 lg:gap-3 xl:gap-4 h-full max-h-full">
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
                        <LeftSidebar />
                    </div>
                </div>
                
                <MapViewport />
                
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