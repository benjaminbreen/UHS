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
  const { showToast } = useUI();
  
  // Track last time we applied effects (every game minute)
  const lastEffectTime = useRef<string>('');
  
  useEffect(() => {
    if (!weather || !playerCharacter) return;
    
    // Create time key to trigger once per game minute
    const timeKey = `${gameTimeHours}:${gameTimeMinutes}`;
    if (timeKey === lastEffectTime.current) return;
    lastEffectTime.current = timeKey;
    
    const updates: Partial<PlayerCharacter> = {};
    let shouldUpdate = false;
    
    // Get current status effects
    const currentEffects = playerCharacter.statusEffects || [];
    const newEffects: StatusEffect[] = [...currentEffects];
    
    // Remove expired weather effects
    const weatherEffectTypes = ['feeling_cold', 'feeling_hot', 'feeling_wet'];
    const activeWeatherEffects = newEffects.filter(e => 
      weatherEffectTypes.includes(e.type)
    );
    
    // Clear old weather effects
    const filteredEffects = newEffects.filter(e => 
      !weatherEffectTypes.includes(e.type)
    );
    
    // Apply cold damage (below 20°F)
    if (weather.condition === 'cold') {
      // Add feeling_cold status
      if (!activeWeatherEffects.find(e => e.type === 'feeling_cold')) {
        filteredEffects.push({
          type: 'feeling_cold',
          duration: -1, // Permanent until weather changes
          source: 'Cold Weather'
        });
        showToast('❄️ You are feeling cold! Find shelter or warm clothing.', 'warning');
      }
      
      // Apply cold damage every minute
      const coldDamage = 1; // 1 health per game minute
      updates.health = Math.max(0, (playerCharacter.health || 100) - coldDamage);
      shouldUpdate = true;
      
      // Warning at low health
      if (updates.health < 20 && updates.health > 0) {
        showToast('⚠️ You are freezing! Your health is critically low!', 'error');
      }
    } else {
      // Remove feeling_cold if weather improved
      const coldIndex = filteredEffects.findIndex(e => e.type === 'feeling_cold');
      if (coldIndex >= 0) {
        filteredEffects.splice(coldIndex, 1);
      }
    }
    
    // Apply hot effects (increased fatigue)
    if (weather.condition === 'hot') {
      // Add feeling_hot status
      if (!activeWeatherEffects.find(e => e.type === 'feeling_hot')) {
        filteredEffects.push({
          type: 'feeling_hot',
          duration: -1,
          source: 'Hot Weather'
        });
        showToast('🌡️ You are feeling hot! Movement will be more tiring.', 'warning');
      }
      
      // Extra fatigue every minute in hot weather
      const extraFatigue = 0.5;
      updates.fatigue = Math.min(100, (playerCharacter.fatigue || 0) + extraFatigue);
      shouldUpdate = true;
    } else {
      // Remove feeling_hot
      const hotIndex = filteredEffects.findIndex(e => e.type === 'feeling_hot');
      if (hotIndex >= 0) {
        filteredEffects.splice(hotIndex, 1);
      }
    }
    
    // Apply humidity/rain effects
    if (weather.condition === 'humid' || 
        (weather.precipitation === 'rain' && weather.intensity > 0.2)) {
      // Add feeling_wet status
      if (!activeWeatherEffects.find(e => e.type === 'feeling_wet')) {
        filteredEffects.push({
          type: 'feeling_wet',
          duration: -1,
          source: weather.precipitation === 'rain' ? 'Rain' : 'Humidity'
        });
        showToast('💧 You are feeling wet! Movement will be more tiring.', 'info');
      }
      
      // Extra fatigue in wet conditions
      const extraFatigue = 0.3;
      updates.fatigue = Math.min(100, (playerCharacter.fatigue || 0) + extraFatigue);
      shouldUpdate = true;
    } else {
      // Remove feeling_wet
      const wetIndex = filteredEffects.findIndex(e => e.type === 'feeling_wet');
      if (wetIndex >= 0) {
        filteredEffects.splice(wetIndex, 1);
      }
    }
    
    // Update status effects if changed
    if (JSON.stringify(filteredEffects) !== JSON.stringify(currentEffects)) {
      updates.statusEffects = filteredEffects;
      shouldUpdate = true;
    }
    
    // Apply updates
    if (shouldUpdate) {
      setPlayerCharacter(prev => ({
        ...prev,
        ...updates
      }));
    }
    
  }, [weather, playerCharacter, gameTimeMinutes, gameTimeHours, setPlayerCharacter, showToast]);
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