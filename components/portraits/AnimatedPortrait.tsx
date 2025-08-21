import React, { useState, useEffect, useRef } from 'react';
import ProceduralPortrait from './ProceduralPortrait';

interface AnimatedPortraitProps {
  character: any;
  size?: number;
  className?: string;
  trackChanges?: boolean; // Enable state tracking for animations
}

/**
 * Wrapper component for ProceduralPortrait that adds reactive animations
 * when character state changes (reputation increase, new items, etc.)
 */
const AnimatedPortrait: React.FC<AnimatedPortraitProps> = ({ 
  character, 
  size = 192, 
  className = '',
  trackChanges = true 
}) => {
  const [temporaryExpression, setTemporaryExpression] = useState<'smile' | 'surprise' | null>(null);
  
  // Track previous values to detect changes
  const prevReputationRef = useRef(character?.mapReputation);
  const prevInventoryLengthRef = useRef(character?.inventory?.length);
  const prevHealthRef = useRef(character?.health);
  
  // Queue for expressions to avoid overlapping
  const expressionQueueRef = useRef<Array<'smile' | 'surprise'>>([]);
  const isShowingExpressionRef = useRef(false);
  
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
      }
    }
    
    prevHealthRef.current = currentHealth;
  }, [character?.health, trackChanges]);
  
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