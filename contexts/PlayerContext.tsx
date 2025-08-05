/**
 * contexts/PlayerContext.tsx - Provides player state and handlers to the application.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { usePlayerState } from '../hooks/usePlayerState';
import { useGame } from './GameContext';

type PlayerContextType = ReturnType<typeof usePlayerState>;
const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
    return context;
};

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { gameDate, currentZone, currentRegion } = useGame();
    
    const playerState = usePlayerState({
        gameDate,
        currentZone,
        currentRegion
    });

    return (
        <PlayerContext.Provider value={playerState}>
            {children}
        </PlayerContext.Provider>
    );
};