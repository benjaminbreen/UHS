/**
 * hooks/useFarmState.ts
 * Centralized farm state management hook
 *
 * Phase 2 of Farm Panel refactoring - extracts state management logic
 * from FarmPanelImproved.tsx into a reusable hook
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Tile, MapData, TimeOfDay, HistoricalEra, CulturalZone } from '../types';
import { getFarmState, updateFarmState, FarmState, FarmFamilyMember } from '../services/farmService';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { useUI } from '../contexts/UIContext';
import { loadFarmState as loadPersistedFarmState, saveFarmState as savePersistedFarmState } from '../services/farmPersistenceService';

interface UseFarmStateOptions {
  tile: Tile;
  mapData: MapData;
  gameTimeHours: number;
  currentGameDay: number;
}

interface UseFarmStateReturn {
  // State
  farmState: FarmState | null;
  setFarmState: (state: FarmState | null) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
  centerWidth: number;

  // Derived values
  culturalZone: CulturalZone;
  era: HistoricalEra;
  year: number;
  timeOfDay: TimeOfDay;
  headFarmer: FarmFamilyMember | null;

  // Refs
  centerRef: React.RefObject<HTMLDivElement>;

  // Loading state
  isLoading: boolean;
  error: Error | null;

  // Persistence
  saveFarmState: () => void;
}

export function useFarmState({
  tile,
  mapData,
  gameTimeHours,
  currentGameDay,
}: UseFarmStateOptions): UseFarmStateReturn {
  // UI context for sidebar management
  const {
    isLeftSidebarExpanded,
    setIsLeftSidebarExpanded,
    isRightSidebarVisible,
    setIsRightSidebarVisible
  } = useUI();

  // Core state
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [centerWidth, setCenterWidth] = useState<number>(1200);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const centerRef = useRef<HTMLDivElement>(null);
  const [previousLeftSidebarState, setPreviousLeftSidebarState] = useState<boolean | null>(null);
  const [previousRightSidebarState, setPreviousRightSidebarState] = useState<boolean | null>(null);

  // Derive cultural zone early for use in callbacks
  const culturalZone = useMemo(
    () => mapLocationToCulture(mapData?.timeSlice || 'Europe 1650', mapData?.continent || 'Europe'),
    [mapData?.timeSlice, mapData?.continent]
  );

  // Historical context with defensive proxy access
  const { era, year } = useMemo(() => {
    try {
      const dateInfo = parseDateString(mapData?.timeSlice || '1650');
      return {
        era: dateInfo.era as HistoricalEra,
        year: dateInfo.year,
      };
    } catch (error) {
      console.warn('Map data access error, using fallback:', error);
      return {
        era: HistoricalEra.MEDIEVAL,
        year: 1650,
      };
    }
  }, [mapData?.timeSlice]);

  // Time of day
  const timeOfDay = useMemo((): TimeOfDay => {
    if (gameTimeHours >= 5 && gameTimeHours < 12) return 'Morning';
    if (gameTimeHours >= 12 && gameTimeHours < 17) return 'Afternoon';
    if (gameTimeHours >= 17 && gameTimeHours < 20) return 'Dusk';
    return 'Night';
  }, [gameTimeHours]);

  // Head farmer (owner or first adult member)
  const headFarmer = useMemo(() => {
    if (!farmState?.family?.members) return null;
    return (
      farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
      farmState.family.members.find(m => m.role === 'Farmer') ||
      farmState.family.members.find(m => m.age >= 18) ||
      farmState.family.members[0]
    );
  }, [farmState]);

  // Auto-collapse left sidebar and hide right sidebar when farm panel opens
  useEffect(() => {
    // Store current states and collapse/hide on mount
    const wasLeftExpanded = isLeftSidebarExpanded;
    const wasRightVisible = isRightSidebarVisible;
    setPreviousLeftSidebarState(wasLeftExpanded);
    setPreviousRightSidebarState(wasRightVisible);

    if (wasLeftExpanded) {
      setIsLeftSidebarExpanded(false);
    }
    if (wasRightVisible) {
      setIsRightSidebarVisible(false);
    }

    // Restore previous states when component unmounts
    return () => {
      if (wasLeftExpanded) {
        setIsLeftSidebarExpanded(true);
      }
      if (wasRightVisible) {
        setIsRightSidebarVisible(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Window resize handler
  useEffect(() => {
    const PANEL_RIGHT_W = 340;
    const handleResize = () => {
      const total = window.innerWidth - PANEL_RIGHT_W - 2; // borders
      setCenterWidth(Math.max(total, 600));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load farm state (with persistence support)
  useEffect(() => {
    let isMounted = true;

    const loadFarmState = async () => {
      // Validate required data
      if (!mapData) {
        console.error('Cannot load farm state: mapData is undefined');
        setError(new Error('Map data not available'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to load persisted state first
        const mapSeed = mapData.seed || undefined;
        const persistedState = loadPersistedFarmState(tile.x, tile.y, mapSeed);

        let state: FarmState;
        if (persistedState) {
          console.log('[useFarmState] Loaded persisted farm state for', tile.x, tile.y);
          state = persistedState;
        } else {
          console.log('[useFarmState] No persisted state found, generating new farm for', tile.x, tile.y);
          // getFarmState expects (tile, mapData, npcs) - it's a synchronous function
          state = getFarmState(tile, mapData, []);
        }

        if (isMounted) {
          setFarmState(state);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load farm state:', err);
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadFarmState();

    return () => {
      isMounted = false;
    };
  }, [tile, mapData]);

  // Save farm state to persistence
  const saveFarmState = () => {
    if (farmState && mapData) {
      const mapSeed = mapData.seed || undefined;
      savePersistedFarmState(farmState, tile.x, tile.y, mapSeed);
      console.log('[useFarmState] Saved farm state for', tile.x, tile.y);
    }
  };

  return {
    // State
    farmState,
    setFarmState,
    isTransitioning,
    setIsTransitioning,
    centerWidth,

    // Derived values
    culturalZone,
    era,
    year,
    timeOfDay,
    headFarmer,

    // Refs
    centerRef,

    // Loading state
    isLoading,
    error,

    // Persistence
    saveFarmState,
  };
}
