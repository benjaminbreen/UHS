/**
 * hooks/useWeatherEffects.ts
 * Handles weather effects on player health and fatigue
 */

import { useEffect, useRef } from 'react';
import { WeatherState } from '../services/weatherService';
import { PlayerCharacter, StatusEffect } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';

export const useWeatherEffects = (weather: WeatherState | null) => {
  const { playerCharacter, setPlayerCharacter } = usePlayer();
  const { gameTimeMinutes, gameTimeHours } = useGame();
  const { showToast, isAnyModalOpen } = useUI();

  // Track last time we applied effects (every game minute)
  const lastEffectTime = useRef<string>('');
  const toastTracker = useRef<{ cold: boolean; hot: boolean; wet: boolean }>({
    cold: false,
    hot: false,
    wet: false
  });

  useEffect(() => {
    if (!weather || !playerCharacter) {
      toastTracker.current = { cold: false, hot: false, wet: false };
      return;
    }

    // Don't apply weather effects when modals are open (player is "paused")
    if (isAnyModalOpen) return;
    
    // Create time key to trigger once per game minute
    const timeKey = `${gameTimeHours}:${gameTimeMinutes}`;
    if (timeKey === lastEffectTime.current) return;
    lastEffectTime.current = timeKey;
    
    const updates: Partial<PlayerCharacter> = {};
    let shouldUpdate = false;
    
    // Get current status effects
    const currentEffects = playerCharacter.statusEffects || [];
    let updatedEffects: StatusEffect[] = [...currentEffects];
    let effectsChanged = false;

    const hasEffect = (type: StatusEffect['type']) =>
      updatedEffects.some(effect => effect.type === type);

    const addEffect = (effect: StatusEffect, trackerKey: 'cold' | 'hot' | 'wet', toastMessage: string, toastType: 'warning' | 'info') => {
      if (!hasEffect(effect.type)) {
        updatedEffects = [...updatedEffects, effect];
        effectsChanged = true;
      }
      if (!toastTracker.current[trackerKey]) {
        showToast(toastMessage, toastType);
        toastTracker.current[trackerKey] = true;
      }
    };

    const removeEffect = (type: StatusEffect['type'], trackerKey: 'cold' | 'hot' | 'wet') => {
      if (hasEffect(type)) {
        updatedEffects = updatedEffects.filter(effect => effect.type !== type);
        effectsChanged = true;
      }
      toastTracker.current[trackerKey] = false;
    };
    
    // Apply cold damage (below 20°F)
    if (weather.condition === 'cold') {
      addEffect(
        {
          type: 'feeling_cold',
          duration: -1,
          source: 'Cold Weather'
        },
        'cold',
        '❄️ You are cold! Find shelter.',
        'warning'
      );

      // Apply cold damage every minute (reduced from 1 to 0.2)
      const coldDamage = 0.2; // ~12 health/hour instead of 60/hour
      updates.health = Math.max(0, (playerCharacter.health || 100) - coldDamage);
      shouldUpdate = true;
      
      // Warning at low health
      if (updates.health < 20 && updates.health > 0) {
        showToast('⚠️ You are freezing!', 'error');
      }
    } else {
      removeEffect('feeling_cold', 'cold');
    }
    
    // Apply hot effects (increased fatigue)
    if (weather.condition === 'hot') {
      addEffect(
        {
          type: 'feeling_hot',
          duration: -1,
          source: 'Hot Weather'
        },
        'hot',
        '🌡️ You are hot! Movement will be slow.',
        'warning'
      );
      
      // Extra fatigue every minute in hot weather (reduced from 0.5 to 0.1)
      const extraFatigue = 0.1; // 6 fatigue/hour instead of 30/hour
      updates.fatigue = Math.min(100, (playerCharacter.fatigue || 0) + extraFatigue);
      shouldUpdate = true;
    } else {
      removeEffect('feeling_hot', 'hot');
    }
    
    // Apply humidity/rain effects
    if (weather.condition === 'humid' || 
        (weather.precipitation === 'rain' && weather.intensity > 0.9)) {
      addEffect(
        {
          type: 'feeling_wet',
          duration: -1,
          source: weather.precipitation === 'rain' ? 'Rain' : 'Humidity'
        },
        'wet',
        '💧 You are wet!',
        'info'
      );
      
      // Extra fatigue in wet conditions (reduced from 0.3 to 0.08)
      const extraFatigue = 0.08; // ~5 fatigue/hour instead of 18/hour
      updates.fatigue = Math.min(100, (playerCharacter.fatigue || 0) + extraFatigue);
      shouldUpdate = true;
    } else {
      removeEffect('feeling_wet', 'wet');
    }
    
    // Update status effects if changed
    if (effectsChanged) {
      updates.statusEffects = updatedEffects;
      shouldUpdate = true;
    }
    
    // Apply updates
    if (shouldUpdate) {
      setPlayerCharacter(prev => ({
        ...prev,
        ...updates
      }));
    }
    
  }, [weather, playerCharacter, gameTimeMinutes, gameTimeHours, setPlayerCharacter, showToast, isAnyModalOpen]);
};

// Hook to modify movement fatigue based on weather
export const useWeatherMovementCost = (weather: WeatherState | null): number => {
  if (!weather) return 1;
  
  let fatigueMultiplier = 1;
  
  // Hot weather increases fatigue cost
  if (weather.condition === 'hot') {
    fatigueMultiplier *= 1.5; // 50% more fatigue
  }
  
  // Wet/humid conditions increase fatigue
  if (weather.condition === 'humid' || 
      (weather.precipitation === 'rain' && weather.intensity > 0.2)) {
    fatigueMultiplier *= 1.3; // 30% more fatigue
  }
  
  // Heavy snow increases fatigue
  if (weather.precipitation === 'snow' && weather.intensity > 0.5) {
    fatigueMultiplier *= 1.4; // 40% more fatigue
  }
  
  // Strong winds increase fatigue
  if (weather.windSpeed > 30) {
    fatigueMultiplier *= 1.2; // 20% more fatigue
  }
  
  return fatigueMultiplier;
};
