/**
 * hooks/useGameState.ts - Manages the game's clock, logs, and overall state.
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { GameDate, Season, TimeOfDay, SunPosition, GameLogEntry, PlayerJournalEntry, NarrationMessage, Tile, AdjacencyDirection, MapArchetype, ActionableTile, HistoricalEra } from '../types';
import { getDaysInMonth, formatDateWithSeason } from '../utils/dateUtils';
import { LogService } from '../services/logService';
import { CULTURE_ZONES } from '../constants/index';

interface LiminalTravelState {
    sequence: MapArchetype[];
    progress: number;
    destination: string;
    originArea: string;
    originDirection: AdjacencyDirection;
    key: string; // Added to store the liminal key for proper naming
}

const getInitialDate = (): GameDate => {
    // Check if we have a URL configuration
    if (typeof window !== 'undefined') {
        const urlPath = window.location.pathname;
        const urlSegments = urlPath.replace(/^\//, '').split('/').filter(Boolean);
        
        // Check for date in first segment (e.g., "1348" or "1348-1350")
        if (urlSegments[0]) {
            const dateSegment = urlSegments[0];
            
            // Try to parse as year or year range
            if (dateSegment.includes('-')) {
                const [start] = dateSegment.split('-').map(s => parseInt(s));
                if (!isNaN(start)) {
                    console.log('[GameState] Using year from URL:', start);
                    const month = Math.floor(Math.random() * 12) + 1;
                    const day = Math.floor(Math.random() * 28) + 1;
                    return { year: start, month, day };
                }
            } else {
                const year = parseInt(dateSegment);
                if (!isNaN(year)) {
                    console.log('[GameState] Using year from URL:', year);
                    const month = Math.floor(Math.random() * 12) + 1;
                    const day = Math.floor(Math.random() * 28) + 1;
                    return { year, month, day };
                }
            }
        }
    }
    
    // Fall back to random date
    const randomYear = Math.floor(Math.random() * (2050 - -3000 + 1)) - 3000;
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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingFromCache, setIsLoadingFromCache] = useState<boolean>(false);
    const [liminalTravelState, setLiminalTravelState] = useState<LiminalTravelState | null>(null);
    const [moveCount, setMoveCount] = useState(0);

    // Log & Narration State
    const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
    const [playerJournal, setPlayerJournal] = useState<PlayerJournalEntry[]>([]);
    const journalEntryIdCounter = useRef(0);
    const [isNarratorLoading, setIsNarratorLoading] = useState<boolean>(false);
    const [narrationHistory, setNarrationHistory] = useState<NarrationMessage[]>([ { sender: 'narrator-special', text: 'Ask the Narrator anything about this setting. For instance, try asking "What do I see?"' } ]);
    const [playerInput, setPlayerInput] = useState<string>('');
    const [ambianceText, setAmbianceText] = useState<string>("");  // Ambiance system deprecated
    const [lastAmbianceUpdateHour, setLastAmbianceUpdateHour] = useState<number>(-1);
    
    // UI Context State
    const [actionableTile, setActionableTile] = useState<ActionableTile | null>(null);
    const [contextualMessage, setContextualMessage] = useState<string | null>(null);

    // Location State - LIFTED HERE
    const [currentZone, setCurrentZone] = useState<string>(() => {
        // Check if we have a URL configuration for zone
        if (typeof window !== 'undefined') {
            const urlPath = window.location.pathname;
            const urlSegments = urlPath.replace(/^\//, '').split('/').filter(Boolean);
            
            // Check for geography in second segment (e.g., "europe", "mena")
            if (urlSegments[1]) {
                const geoSegment = urlSegments[1].toLowerCase();
                
                const zoneMapping: Record<string, string> = {
                    'europe': 'Europe',
                    'european': 'Europe',
                    'mena': 'Middle East and North Africa',
                    'middleeast': 'Middle East and North Africa',
                    'eastasia': 'East Asia',
                    'eastasian': 'East Asia',
                    'asia': 'East Asia',
                    'southasia': 'South Asia',
                    'southasian': 'South Asia',
                    'india': 'South Asia',
                    'africa': 'Sub-Saharan Africa',
                    'subsaharan': 'Sub-Saharan Africa',
                    'northamerica': 'North America (Pre-Columbian)',
                    'americas': 'North America (Pre-Columbian)',
                    'southamerica': 'South America',
                    'oceania': 'Oceania',
                    'pacific': 'Oceania'
                };
                
                const zone = zoneMapping[geoSegment];
                if (zone) {
                    console.log('[GameState] Using zone from URL:', zone);
                    return zone;
                }
            }
        }
        
        // Fall back to random zone
        return CULTURE_ZONES[Math.floor(Math.random() * CULTURE_ZONES.length)];
    });
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
    
    // Calculate current era from formatted date
    const currentEra = useMemo(() => {
        // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
        const yearMatch = formattedDate.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
        let year = yearMatch ? parseInt(yearMatch[1]) : 0;
        if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
            year = -year;
        }
        if (year < 500) return HistoricalEra.ANTIQUITY;
        if (year < 1450) return HistoricalEra.MEDIEVAL; 
        if (year < 1800) return HistoricalEra.RENAISSANCE_EARLY_MODERN;
        if (year < 1900) return HistoricalEra.INDUSTRIAL_ERA;
        return HistoricalEra.MODERN_ERA;
    }, [formattedDate]);

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
        currentEra,
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