import React, { useState, useEffect, useRef } from 'react';
import ProceduralPortrait from './ProceduralPortrait';
import { PortraitExpression, mapTileToExpr, mapStatusToExpr } from '../../hooks/usePortraitExpression';
import { BiomeType } from '../../types';

interface AnimatedPortraitProps {
  character: any;
  size?: number;
  className?: string;
  trackChanges?: boolean; // Enable state tracking for animations
  currentTile?: any; // Current tile the player is standing on
  contextualMessage?: string; // Game context messages
  gameTimeHours?: number; // For time-based expressions
  temperature?: number; // For temperature reactions
  isInCombat?: boolean; // Combat status
}

/**
 * Wrapper component for ProceduralPortrait that adds reactive animations
 * when character state changes (reputation increase, new items, etc.)
 */
const AnimatedPortrait: React.FC<AnimatedPortraitProps> = ({ 
  character, 
  size = 192, 
  className = '',
  trackChanges = true,
  currentTile,
  contextualMessage,
  gameTimeHours,
  temperature,
  isInCombat
}) => {
  const [temporaryExpression, setTemporaryExpression] = useState<PortraitExpression | null>(null);
  
  // Track previous values to detect changes
  const prevReputationRef = useRef(character?.mapReputation);
  const prevInventoryLengthRef = useRef(character?.inventory?.length);
  const prevHealthRef = useRef(character?.health);
  
  // Queue for expressions to avoid overlapping
  const expressionQueueRef = useRef<Array<PortraitExpression>>([]);
  const isShowingExpressionRef = useRef(false);
  
  // Track previous values for new features
  const prevTileRef = useRef(currentTile?.biome);
  const prevTemperatureRef = useRef(temperature);
  const prevTimeRef = useRef(gameTimeHours);
  const prevCombatRef = useRef(isInCombat);
  
  // Process expression queue
  const processExpressionQueue = () => {
    if (expressionQueueRef.current.length > 0 && !isShowingExpressionRef.current) {
      const nextExpression = expressionQueueRef.current.shift();
      if (nextExpression) {
        isShowingExpressionRef.current = true;
        setTemporaryExpression(nextExpression);
      }
    }
  };
  
  // Handle expression completion
  const handleExpressionComplete = () => {
    setTemporaryExpression(null);
    isShowingExpressionRef.current = false;
    // Process next expression in queue after a short delay
    setTimeout(() => {
      processExpressionQueue();
    }, 300);
  };
  
  // Track reputation changes
  useEffect(() => {
    if (!trackChanges || !character) return;
    
    const currentReputation = character.mapReputation;
    const previousReputation = prevReputationRef.current;
    
    if (previousReputation !== undefined && currentReputation !== undefined) {
      if (currentReputation > previousReputation) {
        // Reputation increased - add smile to queue
        expressionQueueRef.current.push('smile');
        processExpressionQueue();
      }
    }
    
    prevReputationRef.current = currentReputation;
  }, [character?.mapReputation, trackChanges]);
  
  // Track inventory changes
  useEffect(() => {
    if (!trackChanges || !character?.inventory) return;
    
    const currentInventoryLength = character.inventory.length;
    const previousInventoryLength = prevInventoryLengthRef.current;
    
    if (previousInventoryLength !== undefined && currentInventoryLength !== undefined) {
      // Check if we got new items (not just reorganization)
      if (currentInventoryLength > previousInventoryLength) {
        // New item found - add surprise then smile to queue
        expressionQueueRef.current.push('surprise');
        expressionQueueRef.current.push('smile');
        processExpressionQueue();
      }
    }
    
    prevInventoryLengthRef.current = currentInventoryLength;
  }, [character?.inventory?.length, trackChanges]);
  
  // Track health increases (healing)
  useEffect(() => {
    if (!trackChanges || !character) return;
    
    const currentHealth = character.health;
    const previousHealth = prevHealthRef.current;
    
    if (previousHealth !== undefined && currentHealth !== undefined) {
      // Significant health increase (more than 10 points)
      if (currentHealth > previousHealth + 10) {
        // Healed significantly - add smile
        expressionQueueRef.current.push('smile');
        processExpressionQueue();
      } else if (currentHealth < previousHealth - 10) {
        // Hurt significantly - add concern
        expressionQueueRef.current.push('concern');
        processExpressionQueue();
      }
    }
    
    prevHealthRef.current = currentHealth;
  }, [character?.health, trackChanges]);
  
  // Track tile changes
  useEffect(() => {
    if (!trackChanges || !currentTile) return;
    
    const currentBiome = currentTile.biome;
    const previousBiome = prevTileRef.current;
    
    if (previousBiome !== undefined && currentBiome !== previousBiome) {
      // Get expression for new tile type
      const tileExpression = mapTileToExpr(currentBiome);
      if (tileExpression) {
        expressionQueueRef.current.push(tileExpression);
        processExpressionQueue();
      }
    }
    
    prevTileRef.current = currentBiome;
  }, [currentTile?.biome, trackChanges]);
  
  // Track temperature changes
  useEffect(() => {
    if (!trackChanges || temperature === undefined) return;
    
    const prevTemp = prevTemperatureRef.current;
    
    if (prevTemp !== undefined && prevTemp !== temperature) {
      // Check for extreme temperatures
      if (temperature < -10 || temperature > 40) {
        expressionQueueRef.current.push('tired');
        processExpressionQueue();
      } else if ((temperature < 0 || temperature > 30) && Math.abs(temperature - prevTemp) > 5) {
        expressionQueueRef.current.push('annoyed');
        processExpressionQueue();
      }
    }
    
    prevTemperatureRef.current = temperature;
  }, [temperature, trackChanges]);
  
  // Track combat status
  useEffect(() => {
    if (!trackChanges || isInCombat === undefined) return;
    
    const wasCombat = prevCombatRef.current;
    
    if (wasCombat !== undefined && wasCombat !== isInCombat) {
      if (isInCombat) {
        // Entering combat
        expressionQueueRef.current.push('scowl');
        processExpressionQueue();
      } else if (wasCombat) {
        // Exiting combat (survived)
        expressionQueueRef.current.push('excited');
        processExpressionQueue();
      }
    }
    
    prevCombatRef.current = isInCombat;
  }, [isInCombat, trackChanges]);
  
  // Track time of day (fatigue)
  useEffect(() => {
    if (!trackChanges || gameTimeHours === undefined) return;
    
    const prevTime = prevTimeRef.current;
    
    // Check if it's late night/early morning (tired time)
    if (prevTime !== undefined && prevTime !== gameTimeHours) {
      if ((gameTimeHours >= 0 && gameTimeHours <= 5) || gameTimeHours >= 23) {
        // Late night - occasionally show tired
        if (Math.random() < 0.3) { // 30% chance to show tired at night
          expressionQueueRef.current.push('tired');
          processExpressionQueue();
        }
      }
    }
    
    prevTimeRef.current = gameTimeHours;
  }, [gameTimeHours, trackChanges]);
  
  // Track character status (hunger, thirst, disease)
  useEffect(() => {
    if (!trackChanges || !character) return;
    
    // Check various status conditions
    const statusExpression = mapStatusToExpr({
      health: character.health,
      maxHealth: character.maxHealth,
      hunger: character.hunger,
      thirst: character.thirst,
      fatigue: character.fatigue
    });
    
    if (statusExpression) {
      // Add status expression but don't spam (only occasionally)
      if (Math.random() < 0.1) { // 10% chance per check
        expressionQueueRef.current.push(statusExpression);
        processExpressionQueue();
      }
    }
  }, [character?.hunger, character?.thirst, character?.fatigue, trackChanges]);
  
  // Don't render if no character
  if (!character) return null;
  
  return (
    <ProceduralPortrait
      character={character}
      size={size}
      className={className}
      temporaryExpression={temporaryExpression}
      onExpressionComplete={handleExpressionComplete}
    />
  );
};

export default AnimatedPortrait;