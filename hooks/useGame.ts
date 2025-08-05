/**
 * hooks/useGameState.ts - Manages the game's clock, logs, and overall state.
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { GameDate, Season, TimeOfDay, SunPosition, GameLogEntry, PlayerJournalEntry, NarrationMessage, Tile, AdjacencyDirection, MapArchetype } from '../types';
import { getDaysInMonth, formatDateWithSeason } from '../utils/dateUtils';
import { LogService } from '../services/logService';
import { CULTURE_ZONES } from '../constants/index';

interface LiminalTravelState {
    sequence: MapArchetype[];
    progress: number;
    destination: string;
    originArea: string;
    originDirection: AdjacencyDirection;
}

const getInitialDate = (): GameDate => {
    const randomYear = Math.floor(Math.random() * (2050 - -700 + 1)) - 700;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const maxDaysInMonth = getDaysInMonth(randomYear, randomMonth);
    const randomDay = Math.floor(Math.random() * maxDaysInMonth) + 1;
    return { year: randomYear, month: randomMonth, day: randomDay };
};

export const useGameState = () => {
    // Time & Date State
    const initialDateRef = useRef<GameDate>(getInitialDate());
    const [gameDate, setGameDate] = useState<GameDate>(initialDateRef.current);
    const [gameTimeHours, setGameTimeHours] = useState<number>(() => Math.floor(Math.random() * 24));
    const [gameTimeMinutes, setGameTimeMinutes] = useState<number>(() => Math.floor(Math.random() * 60));
    const [sunPosition, setSunPosition] = useState<SunPosition>({ dx: 0, dy: 0, blur: 0, opacity: 0, ambientColor: 'rgba(255,255,255,0)', ambientOpacity: 0 });
    
    // Game Flow State
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingFromCache, setIsLoadingFromCache] = useState<boolean>(false);
    const [liminalTravelState, setLiminalTravelState] = useState<LiminalTravelState | null>(null);
    const [moveCount, setMoveCount] = useState(0);

    // Log & Narration State
    const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
    const [playerJournal, setPlayerJournal] = useState<PlayerJournalEntry[]>([]);
    const journalEntryIdCounter = useRef(0);
    const [isNarratorLoading, setIsNarratorLoading] = useState<boolean>(false);
    const [narrationHistory, setNarrationHistory] = useState<NarrationMessage[]>([ { sender: 'narrator-special', text: 'You can ask "What do I see?" or describe an action like "I check the desk for hidden drawers."' } ]);
    const [playerInput, setPlayerInput] = useState<string>('');
    const [ambianceText, setAmbianceText] = useState<string>("Loading ambiance...");
    const [lastAmbianceUpdateHour, setLastAmbianceUpdateHour] = useState<number>(-1);
    
    // UI Context State
    const [actionableTile, setActionableTile] = useState<{ type: 'farm' | 'city' | 'marketplace' | 'building' | 'explore'; tile: Tile } | null>(null);
    const [contextualMessage, setContextualMessage] = useState<string | null>(null);

    // Location State - LIFTED HERE
    const [currentZone, setCurrentZone] = useState<string>(() => CULTURE_ZONES[Math.floor(Math.random() * CULTURE_ZONES.length)]);
    const [currentRegion, setCurrentRegion] = useState<string>('...');
    
    // Derived Time State
    const season = useMemo((): Season => {
        if (gameDate.month >= 3 && gameDate.month <= 5) return 'spring';
        if (gameDate.month >= 6 && gameDate.month <= 8) return 'summer';
        if (gameDate.month >= 9 && gameDate.month <= 11) return 'fall';
        return 'winter';
    }, [gameDate.month]);

    const currentTimeOfDay = useMemo((): TimeOfDay => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);

    const formattedTime = useMemo(() => `${String(gameTimeHours).padStart(2, '0')}:${String(gameTimeMinutes).padStart(2, '0')}`, [gameTimeHours, gameTimeMinutes]);
    const formattedDate = useMemo(() => formatDateWithSeason(gameDate, season), [gameDate, season]);

    // Log Handlers
    const addGameLogEntry = useCallback((entry: GameLogEntry) => {
        setGameLog(prev => [...prev, entry]);
    }, []);

    const onAddPlayerJournalEntry = useCallback((text: string) => {
        const newEntry: PlayerJournalEntry = {
            id: `pj-${Date.now()}-${journalEntryIdCounter.current++}`,
            timestamp: gameDate,
            timeString: formattedTime,
            text
        };
        setPlayerJournal(prev => [...prev, newEntry]);
    }, [gameDate, formattedTime]);
    
    const onPlayerInputChange = useCallback((value: string) => {
        setPlayerInput(value);
    }, []);

    const onMapConfigDateChange = useCallback((newDate: Partial<GameDate>) => {
        setGameDate(prevDate => ({...prevDate, ...newDate}));
    }, []);
    
    return {
        // State
        gameDate,
        gameTimeHours,
        gameTimeMinutes,
        sunPosition,
        isLoading,
        isLoadingFromCache,
        liminalTravelState,
        moveCount,
        gameLog,
        playerJournal,
        isNarratorLoading,
        narrationHistory,
        playerInput,
        ambianceText,
        lastAmbianceUpdateHour,
        actionableTile,
        contextualMessage,
        season,
        currentTimeOfDay,
        formattedTime,
        formattedDate,
        currentZone,
        currentRegion,
        
        // Setters
        setGameDate,
        setGameTimeHours,
        setGameTimeMinutes,
        setSunPosition,
        setIsLoading,
        setIsLoadingFromCache,
        setLiminalTravelState,
        setMoveCount,
        setGameLog,
        setPlayerJournal,
        setIsNarratorLoading,
        setNarrationHistory,
        setPlayerInput,
        setAmbianceText,
        setLastAmbianceUpdateHour,
        setActionableTile,
        setContextualMessage,
        setCurrentZone,
        setCurrentRegion,
        
        // Handlers
        addGameLogEntry,
        onAddPlayerJournalEntry,
        onPlayerInputChange,
        onMapConfigDateChange,
        onLocationChange: setCurrentZone,
    };
};