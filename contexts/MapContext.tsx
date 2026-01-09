/**
 * contexts/MapContext.tsx - Provides map state and handlers to the application.
 */
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useMapState } from '../hooks/useMapState';
import { usePlayer } from './PlayerContext';
import { useGame } from './GameContext';
import type { LiminalEncounter } from '../services/liminalEncounterService';

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
        console.log(`[Liminal Encounter] Processing: ${encounter.title}`);

        // Apply health effects
        if (encounter.effects.health && playerState.playerCharacter) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newHealth = Math.max(0, Math.min(prev.stats.maxHealth,
                    prev.stats.health + encounter.effects.health!
                ));
                return {
                    ...prev,
                    stats: { ...prev.stats, health: newHealth }
                };
            });
        }

        // Apply fatigue effects
        if (encounter.effects.fatigue && playerState.playerCharacter) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newFatigue = Math.max(0, Math.min(100,
                    prev.stats.fatigue + encounter.effects.fatigue!
                ));
                return {
                    ...prev,
                    stats: { ...prev.stats, fatigue: newFatigue }
                };
            });
        }

        // Apply gold effects
        if (encounter.effects.gold && playerState.playerCharacter) {
            playerState.setPlayerCharacter(prev => {
                if (!prev) return prev;
                const newGold = Math.max(0, prev.stats.gold + encounter.effects.gold!);
                return {
                    ...prev,
                    stats: { ...prev.stats, gold: newGold }
                };
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
    }, [playerState, gameState]);

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
            homeAnchor: gameState.homeAnchor,
        },
        setGameState: {
            setIsLoading: gameState.setIsLoading,
            setIsLoadingFromCache: gameState.setIsLoadingFromCache,
            setLiminalTravelState: gameState.setLiminalTravelState,
            setCurrentZone: gameState.setCurrentZone,
            setCurrentRegion: gameState.setCurrentRegion,
            onMapConfigDateChange: gameState.onMapConfigDateChange,
            setHomeAnchor: gameState.setHomeAnchor,
        },
        onLiminalEncounter: handleLiminalEncounter,
    });

    return (
        <MapContext.Provider value={mapState}>
            {children}
        </MapContext.Provider>
    );
};
