/**
 * hooks/useReputationSystem.ts
 * Hook for managing player reputation and consequences
 */

import { useState, useCallback, useEffect } from 'react';
import { eventBus } from '../services/eventBus';

export interface ReputationChange {
  amount: number;
  reason: string;
  timestamp: number;
  witnesses?: string[];
}

export interface ReputationState {
  current: number;
  history: ReputationChange[];
  standing: 'criminal' | 'suspicious' | 'neutral' | 'respected' | 'honored';
}

// Reputation thresholds for different standings
const REPUTATION_THRESHOLDS = {
  criminal: -50,
  suspicious: -20,
  neutral: 0,
  respected: 50,
  honored: 100
};

export function useReputationSystem(initialReputation: number = 0) {
  const [reputation, setReputation] = useState<ReputationState>({
    current: initialReputation,
    history: [],
    standing: getStanding(initialReputation)
  });

  // Function to determine standing based on reputation value
  function getStanding(rep: number): ReputationState['standing'] {
    if (rep <= REPUTATION_THRESHOLDS.criminal) return 'criminal';
    if (rep <= REPUTATION_THRESHOLDS.suspicious) return 'suspicious';
    if (rep < REPUTATION_THRESHOLDS.respected) return 'neutral';
    if (rep < REPUTATION_THRESHOLDS.honored) return 'respected';
    return 'honored';
  }

  // Change reputation with reason tracking
  const changeReputation = useCallback((
    amount: number, 
    reason: string, 
    witnesses?: string[]
  ) => {
    setReputation(prev => {
      const newValue = Math.max(-100, Math.min(100, prev.current + amount));
      const change: ReputationChange = {
        amount,
        reason,
        timestamp: Date.now(),
        witnesses
      };

      return {
        current: newValue,
        history: [...prev.history, change].slice(-20), // Keep last 20 changes
        standing: getStanding(newValue)
      };
    });

    // Emit event for UI feedback
    eventBus.emit('reputation:changed', {
      newValue: reputation.current + amount,
      change: amount,
      reason,
      witnesses
    });

    // Log significant changes
    if (Math.abs(amount) >= 10) {
      console.log(`[Reputation] Major change: ${amount > 0 ? '+' : ''}${amount} for ${reason}`);
    }
  }, [reputation.current]);

  // Get reputation modifiers for interactions
  const getReputationModifiers = useCallback(() => {
    const standing = reputation.standing;
    
    return {
      // Price modifiers for trading
      priceModifier: standing === 'criminal' ? 1.5 :
                     standing === 'suspicious' ? 1.2 :
                     standing === 'respected' ? 0.9 :
                     standing === 'honored' ? 0.8 : 1.0,
      
      // NPC reaction modifier
      reactionModifier: standing === 'criminal' ? -30 :
                       standing === 'suspicious' ? -10 :
                       standing === 'respected' ? 10 :
                       standing === 'honored' ? 20 : 0,
      
      // Guard hostility
      guardHostility: standing === 'criminal' ? 'hostile' :
                     standing === 'suspicious' ? 'watchful' :
                     'neutral',
      
      // Access to special areas
      hasSpecialAccess: standing === 'respected' || standing === 'honored'
    };
  }, [reputation.standing]);

  // Listen for theft events
  useEffect(() => {
    const handleTheftDetected = (data: any) => {
      const severity = data.item.value > 100 ? 'major' : 'minor';
      const amount = severity === 'major' ? -20 : -10;
      changeReputation(
        amount,
        `Caught stealing ${data.item.name}`,
        data.witnesses
      );
    };

    const handleGoodDeed = (data: any) => {
      changeReputation(
        data.amount || 5,
        data.reason || 'Good deed',
        data.witnesses
      );
    };

    eventBus.on('theft:detected', handleTheftDetected);
    eventBus.on('reputation:good_deed', handleGoodDeed);

    return () => {
      eventBus.off('theft:detected', handleTheftDetected);
      eventBus.off('reputation:good_deed', handleGoodDeed);
    };
  }, [changeReputation]);

  return {
    reputation,
    changeReputation,
    getReputationModifiers,
    isHostile: reputation.standing === 'criminal',
    canAccessRestrictedAreas: reputation.standing === 'respected' || reputation.standing === 'honored'
  };
}