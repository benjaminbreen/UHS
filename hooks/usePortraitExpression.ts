/**
 * hooks/usePortraitExpression.ts
 * Reusable hook for managing portrait expressions across modals
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export type PortraitExpression =
  | 'smile'
  | 'surprise'
  | 'approve'
  | 'scowl'
  | 'sad'
  | 'smirk'
  | 'concern'
  | 'excited'
  | 'annoyed'
  | 'tired'
  | 'confused'
  | 'thinking'
  | 'skeptical'
  | 'determined'
  | 'curious';

export function usePortraitExpression() {
  const [expr, setExpr] = useState<PortraitExpression | null>(null);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    setExpr(null);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flash = useCallback((e: PortraitExpression, ms = 30000) => {
    // last-wins: cancel prior timer and set a new one
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setExpr(e);
    timerRef.current = window.setTimeout(() => {
      setExpr(null);
      timerRef.current = null;
    }, ms + 50); // slightly > portrait's own internal 30000ms
  }, []);

  useEffect(() => () => timerRef.current && window.clearTimeout(timerRef.current), []);

  return { expr, flash, clear };
}

/**
 * Map reputation delta to a short-lived facial expression
 */
export function mapRepDeltaToExpr(delta: number): PortraitExpression | null {
  // Extreme changes (rare but impactful)
  if (delta >= 50) return 'excited';    // exceptional positive interaction
  if (delta <= -50) return 'scowl';     // extreme hostility/anger
  
  // Large positive changes  
  if (delta >= 15) return 'approve';    // strong approval
  if (delta >= 10) return 'smile';      // clear happiness
  if (delta >= 5) return 'smirk';       // mild approval/amusement
  if (delta >= 1) return 'surprise';    // pleasant surprise, mild positive
  
  // Large negative changes
  if (delta <= -25) return 'annoyed';   // strong disapproval
  if (delta <= -15) return 'sad';       // disappointment
  if (delta <= -10) return 'concern';   // worry/unease
  if (delta <= -5) return 'skeptical';  // doubt/suspicion
  if (delta <= -1) return 'confused';   // mild confusion/displeasure
  
  return null; // exactly 0
}

/**
 * Map event types to appropriate expressions
 */
export function mapEventToExpr(eventType: string): PortraitExpression | null {
  switch (eventType) {
    case 'quest_accept': return 'approve';
    case 'quest_decline': return 'sad';
    case 'quest_complete': return 'excited';
    case 'trade_success': return 'approve';
    case 'trade_fail': return 'concern';
    case 'trade_negotiation': return 'thinking';
    case 'threat': return 'scowl';
    case 'attack': return 'scowl';
    case 'victory': return 'excited';
    case 'defeat': return 'sad';
    case 'disease': return 'tired';
    case 'healing': return 'smile';
    case 'greeting': return 'smile';
    case 'confusion': return 'confused';
    case 'understanding': return 'smirk';
    case 'authorities': return 'sad';
    case 'hostile': return 'scowl';
    case 'thinking': return 'thinking';
    case 'skeptical': return 'skeptical';
    default: return null;
  }
}

/**
 * Map tile types to appropriate expressions
 */
export function mapTileToExpr(biomeType: string): PortraitExpression | null {
  switch (biomeType) {
    case 'HOLY_SITE': return 'thinking';
    case 'MARKETPLACE': return 'smirk';
    case 'RUINS': return 'concern';
    case 'BATTLEFIELD': return 'sad';
    case 'PALACE': return 'approve';
    case 'CITY_CENTER': return 'smile';
    case 'DENSE_CITY': return 'annoyed'; // crowded
    case 'FARMLAND': return 'smile';
    case 'DESERT': return 'tired'; // harsh environment
    case 'SNOW': return 'annoyed'; // cold
    case 'SWAMP': return 'annoyed'; // unpleasant
    case 'MOUNTAIN': return 'determined'; // challenging terrain
    default: return null;
  }
}

/**
 * Map player status to expressions
 */
export function mapStatusToExpr(status: {
  health?: number;
  maxHealth?: number;
  temperature?: number;
  hunger?: number;
  thirst?: number;
  fatigue?: number;
}): PortraitExpression | null {
  const healthPercent = (status.health && status.maxHealth) 
    ? status.health / status.maxHealth 
    : 1;
  
  // Critical conditions take priority
  if (healthPercent < 0.2) return 'sad';
  if (healthPercent < 0.4) return 'concern';
  
  // Temperature extremes
  if (status.temperature !== undefined) {
    if (status.temperature < -10 || status.temperature > 40) return 'tired';
    if (status.temperature < 0 || status.temperature > 30) return 'annoyed';
  }
  
  // Hunger/thirst
  if (status.hunger !== undefined && status.hunger < 20) return 'tired';
  if (status.thirst !== undefined && status.thirst < 20) return 'tired';
  
  // Fatigue
  if (status.fatigue !== undefined && status.fatigue > 80) return 'tired';
  
  // Good health
  if (healthPercent > 0.9 && (!status.hunger || status.hunger > 80)) return 'smile';
  
  return null;
}

/**
 * Map NPC personality to default expression
 */
export function mapPersonalityToExpr(personality?: string): PortraitExpression | null {
  if (!personality || typeof personality !== 'string') return null;
  
  switch (personality.toLowerCase()) {
    case 'aggressive': return 'scowl';
    case 'friendly': return 'smile';
    case 'nervous': return 'concern';
    case 'confident': return 'smirk';
    case 'scholarly': return 'thinking';
    case 'suspicious': return 'skeptical';
    case 'tired': return 'tired';
    case 'excited': return 'excited';
    case 'sad': return 'sad';
    case 'determined': return 'determined';
    default: return null;
  }
}