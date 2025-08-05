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

    return (
      <div className="bg-slate-900 text-gray-100 flex flex-col h-screen overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
            <TopNavBar />
            <div className="relative flex-1 flex items-stretch overflow-hidden p-4 gap-4 h-full max-h-full">
                {!isLeftSidebarExpanded && (
                    <button 
                        onClick={() => setIsLeftSidebarExpanded(true)}
                        className="absolute top-1/2 -translate-y-1/2 left-2 z-30 w-8 h-16 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 rounded-r-lg border-y border-r border-slate-600/80 transition-all shadow-lg animate-pulseGlow"
                        aria-label="Expand Sidebar"
                        title="Expand Sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
                <LeftSidebar />
                <MapViewport />
                <RightSidebar />
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