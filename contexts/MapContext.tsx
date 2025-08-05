/**
 * contexts/MapContext.tsx - Provides map state and handlers to the application.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useMapState } from '../hooks/useMapState';
import { usePlayer } from './PlayerContext';
import { useGame } from './GameContext';

type MapContextType = ReturnType<typeof useMapState>;
const MapContext = createContext<MapContextType | null>(null);

export const useMap = () => {
    const context = useContext(MapContext);
    if (!context) throw new Error('useMap must be used within a MapProvider');
    return context;
};

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playerState = usePlayer();
    const gameState = useGame();
    
    const mapState = useMapState({
        playerState: {
            playerCharacter: playerState.playerCharacter,
            controlledIconX: playerState.controlledIconX,
            controlledIconY: playerState.controlledIconY,
            playerMode: playerState.playerMode,
            lastExitingEdgeData: playerState.lastExitingEdgeData,
            pendingIconTransitionInfo: playerState.pendingIconTransitionInfo,
        },
        setPlayerState: {
            setPlayerCharacter: playerState.setPlayerCharacter,
            setControlledIconX: playerState.setControlledIconX,
            setControlledIconY: playerState.setControlledIconY,
            setPlayerMode: playerState.setPlayerMode,
            setPendingIconTransitionInfo: playerState.setPendingIconTransitionInfo,
            findInitialIconPosition: playerState.findInitialIconPosition,
        },
        gameState: {
            gameDate: gameState.gameDate,
            liminalTravelState: gameState.liminalTravelState,
        },
        setGameState: {
            setIsLoading: gameState.setIsLoading,
            setIsLoadingFromCache: gameState.setIsLoadingFromCache,
            setLiminalTravelState: gameState.setLiminalTravelState,
            setCurrentZone: gameState.setCurrentZone,
            setCurrentRegion: gameState.setCurrentRegion,
        },
    });

    return (
        <MapContext.Provider value={mapState}>
            {children}
        </MapContext.Provider>
    );
};