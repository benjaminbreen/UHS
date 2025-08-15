/**
 * App.tsx - Main application component for the Map Voyager Engine
 */
import React from 'react';
import { UIProvider, useUI } from './contexts/UIContext';
import { MapProvider } from './contexts/MapContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { GameProvider } from './contexts/GameContext';
import useCoreLoops from './hooks/useCoreLoops';
import TopNavBar from './components/TopNavBar';
import LeftSidebar from './components/LeftSidebar';
import MapViewport from './components/MapViewport';
import RightSidebar from './components/RightSidebar';
import ModalHub from './components/ModalHub';
import DebugOverlay from './components/DebugOverlay';
import FPSCounter from './components/FPSCounter';

const AppContent: React.FC = () => {
    useCoreLoops();
    const { isLeftSidebarExpanded, setIsLeftSidebarExpanded, debugSettings, isTestModeEnabled } = useUI();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);
    
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
            <TopNavBar />
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