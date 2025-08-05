/**
 * contexts/GameContext.tsx - Provides global game state and handlers.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';

type GameContextType = ReturnType<typeof useGameState>;
const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const gameState = useGameState();
    return (
        <GameContext.Provider value={gameState}>
            {children}
        </GameContext.Provider>
    );
};