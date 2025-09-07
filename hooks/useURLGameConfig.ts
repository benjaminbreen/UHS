/**
 * Hook for applying URL configuration to game state
 */
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { parseURLConfig } from '../services/urlConfigService';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';

export function useURLGameConfig() {
  const location = useLocation();
  const { onMapConfigDateChange, setCurrentZone } = useGame();
  const { onStartNewWorldAtZoneRegion, onStartNewWorldWithCurrentSettings } = useMap();
  const hasAppliedConfig = useRef(false);
  const [isWaitingForInit, setIsWaitingForInit] = React.useState(true);
  
  useEffect(() => {
    // Small delay to ensure game systems are initialized
    const timer = setTimeout(() => {
      setIsWaitingForInit(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // This hook is disabled - URL config is now handled in initial state
    // in useGameState.ts and App.tsx
    return;
    
    // The code below is kept for reference but is unreachable
    /*
    const config = parseURLConfig(location.pathname);
    
    if (!config || hasAppliedConfig.current || isWaitingForInit) {
      return;
    }
    
    hasAppliedConfig.current = true;
    console.log('[URLGameConfig] Applying URL configuration:', config);
    
    let targetYear: number | undefined;
    
    // Apply date range
    if (config.dateRange) {
      targetYear = config.dateRange.startYear;
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1; // Safe for all months
      
      console.log('[URLGameConfig] Setting date to:', { year: targetYear, month, day });
      
      // Update game date immediately
      onMapConfigDateChange({ year: targetYear, month, day });
    }
    
    // Apply game mode preference
    if (config.gameMode) {
      console.log('[URLGameConfig] Game mode preference:', config.gameMode);
      // Store in localStorage for the event system to pick up after character generation
      localStorage.setItem('urlConfigGameMode', config.gameMode);
    }
    
    // Apply geography and trigger world generation
    if (config.geography?.culturalZone) {
      console.log('[URLGameConfig] Setting cultural zone to:', config.geography.culturalZone);
      
      // Map cultural zone to the actual zone key used in GEOGRAPHICAL_DATA
      const zoneMapping: Record<string, string> = {
        'EUROPEAN': 'Europe',
        'MENA': 'Middle East and North Africa',
        'EAST_ASIAN': 'East Asia',
        'SOUTH_ASIAN': 'South Asia',
        'SUB_SAHARAN_AFRICAN': 'Sub-Saharan Africa',
        'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America (Pre-Columbian)',
        'SOUTH_AMERICAN': 'South America',
        'OCEANIA': 'Oceania'
      };
      
      const targetZone = zoneMapping[config.geography.culturalZone] || 'Europe';
      
      // Create character spec with the configured year
      const characterSpec = targetYear ? { year: targetYear } : undefined;
      
      // Delay to ensure date is set first
      setTimeout(() => {
        console.log('[URLGameConfig] Starting new world in zone:', targetZone);
        // This will pick a random region within the zone
        onStartNewWorldAtZoneRegion(targetZone, '', characterSpec);
      }, 100);
    } else if (config.dateRange) {
      // If we only have a date range, trigger world generation with that date
      const characterSpec = { year: targetYear };
      
      setTimeout(() => {
        console.log('[URLGameConfig] Starting new world with year:', targetYear);
        // We'll need to import and call the right function
        window.location.reload(); // For now, just reload to apply the date
      }, 100);
    }
    */
  }, [isWaitingForInit, location.pathname, onMapConfigDateChange, onStartNewWorldAtZoneRegion]); // Re-run when initialization is complete or URL changes
}