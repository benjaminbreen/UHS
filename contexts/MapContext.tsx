/**
 * contexts/MapContext.tsx - Provides map state and handlers to the application.
 */
import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useMapState } from '../hooks/useMapState';
import { usePlayer } from './PlayerContext';
import { useGame } from './GameContext';
import type { LiminalEncounter } from '../services/liminalEncounterService';
import { getPlayerCurrency } from '../utils/currencyUtils';

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

    // Handle liminal travel encounters
    const handleLiminalEncounter = useCallback((encounter: LiminalEncounter) => {
        // Apply health effects
        if (encounter.effects.health) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newHealth = Math.max(0, Math.min(prev.maxHealth,
                    prev.health + encounter.effects.health!
                ));
                return { ...prev, health: newHealth };
            });
        }

        // Apply fatigue effects
        if (encounter.effects.fatigue) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newFatigue = Math.max(0, Math.min(prev.maxFatigue,
                    prev.fatigue + encounter.effects.fatigue!
                ));
                return { ...prev, fatigue: newFatigue };
            });
        }

        // Apply gold effects
        if (encounter.effects.gold) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newCurrency = Math.max(0, getPlayerCurrency(prev) + encounter.effects.gold!);
                return { ...prev, currency: newCurrency };
            });
        }

        // Apply time delay effects
        if (encounter.effects.timeDelay) {
            gameState.setGameTimeHours(prev => (prev + encounter.effects.timeDelay!) % 24);
        }

        // Add to game log
        gameState.addGameLogEntry({
            id: `encounter-${Date.now()}`,
            timestamp: gameState.gameDate,
            timeString: gameState.formattedTime,
            type: 'ENCOUNTER',
            icon: '⚠️',
            summary: encounter.title,
            details: encounter.message,
        });
    }, [playerState.setPlayerCharacter, gameState.setGameTimeHours, gameState.addGameLogEntry, gameState.gameDate, gameState.formattedTime]);

    // Memoize objects passed to useMapState to prevent new references every render.
    // playerState values change when the player moves/updates, so those are the deps.
    const memoizedPlayerState = useMemo(() => ({
        playerCharacter: playerState.playerCharacter,
        controlledIconX: playerState.controlledIconX,
        controlledIconY: playerState.controlledIconY,
        playerMode: playerState.playerMode,
        lastExitingEdgeData: playerState.lastExitingEdgeData,
        pendingIconTransitionInfo: playerState.pendingIconTransitionInfo,
    }), [
        playerState.playerCharacter,
        playerState.controlledIconX,
        playerState.controlledIconY,
        playerState.playerMode,
        playerState.lastExitingEdgeData,
        playerState.pendingIconTransitionInfo,
    ]);

    // Setter functions are stable (from useState), so this object rarely changes.
    const memoizedSetPlayerState = useMemo(() => ({
        setPlayerCharacter: playerState.setPlayerCharacter,
        setControlledIconX: playerState.setControlledIconX,
        setControlledIconY: playerState.setControlledIconY,
        setPlayerMode: playerState.setPlayerMode,
        setPendingIconTransitionInfo: playerState.setPendingIconTransitionInfo,
        findInitialIconPosition: playerState.findInitialIconPosition,
    }), [
        playerState.setPlayerCharacter,
        playerState.setControlledIconX,
        playerState.setControlledIconY,
        playerState.setPlayerMode,
        playerState.setPendingIconTransitionInfo,
        playerState.findInitialIconPosition,
    ]);

    const memoizedGameState = useMemo(() => ({
        gameDate: gameState.gameDate,
        liminalTravelState: gameState.liminalTravelState,
        homeAnchor: gameState.homeAnchor,
    }), [
        gameState.gameDate,
        gameState.liminalTravelState,
        gameState.homeAnchor,
    ]);

    const memoizedSetGameState = useMemo(() => ({
        setIsLoading: gameState.setIsLoading,
        setIsLoadingFromCache: gameState.setIsLoadingFromCache,
        setLiminalTravelState: gameState.setLiminalTravelState,
        setCurrentZone: gameState.setCurrentZone,
        setCurrentRegion: gameState.setCurrentRegion,
        onMapConfigDateChange: gameState.onMapConfigDateChange,
        setHomeAnchor: gameState.setHomeAnchor,
    }), [
        gameState.setIsLoading,
        gameState.setIsLoadingFromCache,
        gameState.setLiminalTravelState,
        gameState.setCurrentZone,
        gameState.setCurrentRegion,
        gameState.onMapConfigDateChange,
        gameState.setHomeAnchor,
    ]);

    const mapState = useMapState({
        playerState: memoizedPlayerState,
        setPlayerState: memoizedSetPlayerState,
        gameState: memoizedGameState,
        setGameState: memoizedSetGameState,
        onLiminalEncounter: handleLiminalEncounter,
    });

    return (
        <MapContext.Provider value={mapState}>
            {children}
        </MapContext.Provider>
    );
};
