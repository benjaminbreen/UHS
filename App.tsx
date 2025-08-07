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

const AppContent: React.FC = () => {
    useCoreLoops();
    const { isLeftSidebarExpanded, setIsLeftSidebarExpanded } = useUI();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<'left' | 'right' | null>(null);

    return (
      <div className="bg-slate-900 text-gray-100 flex flex-col h-screen overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
            <TopNavBar />
            <div className="relative flex-1 flex items-stretch overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4 h-full max-h-full">
                {/* Desktop sidebar toggle */}
                {!isLeftSidebarExpanded && (
                    <button 
                        onClick={() => setIsLeftSidebarExpanded(true)}
                        className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-2 z-30 w-8 h-16 items-center justify-center bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 rounded-r-lg border-y border-r border-slate-600/80 transition-all shadow-lg animate-pulseGlow"
                        aria-label="Expand Sidebar"
                        title="Expand Sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
                
                {/* Mobile menu buttons */}
                <button 
                    onClick={() => setMobileMenuOpen(mobileMenuOpen === 'left' ? null : 'left')}
                    className="md:hidden fixed bottom-4 left-4 z-40 w-12 h-12 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600/80 shadow-lg"
                    aria-label="Toggle Left Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                <button 
                    onClick={() => setMobileMenuOpen(mobileMenuOpen === 'right' ? null : 'right')}
                    className="md:hidden fixed bottom-4 right-4 z-40 w-12 h-12 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600/80 shadow-lg"
                    aria-label="Toggle Right Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                
                {/* Sidebars with mobile overlay */}
                <div className={`${mobileMenuOpen === 'left' ? 'fixed inset-0 z-30 md:relative md:inset-auto md:flex' : 'hidden md:flex'} md:h-full`}>
                    {mobileMenuOpen === 'left' && (
                        <div className="md:hidden absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(null)} />
                    )}
                    <div className={`${mobileMenuOpen === 'left' ? 'absolute left-0 top-0 h-full' : 'h-full'}`}>
                        <LeftSidebar />
                    </div>
                </div>
                
                <MapViewport />
                
                <div className={`${mobileMenuOpen === 'right' ? 'fixed inset-0 z-30 md:relative md:inset-auto md:flex' : 'hidden md:flex'} md:h-full`}>
                    {mobileMenuOpen === 'right' && (
                        <div className="md:hidden absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(null)} />
                    )}
                    <div className={`${mobileMenuOpen === 'right' ? 'absolute right-0 top-0 h-full' : 'h-full'}`}>
                        <RightSidebar />
                    </div>
                </div>
            </div>
        </div>
        <ModalHub />
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