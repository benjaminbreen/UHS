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
  | 'concern';

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

  const flash = useCallback((e: PortraitExpression, ms = 2000) => {
    // last-wins: cancel prior timer and set a new one
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setExpr(e);
    timerRef.current = window.setTimeout(() => {
      setExpr(null);
      timerRef.current = null;
    }, ms + 50); // slightly > portrait's own internal 2000ms
  }, []);

  useEffect(() => () => timerRef.current && window.clearTimeout(timerRef.current), []);

  return { expr, flash, clear };
}

/**
 * Map reputation delta to a short-lived facial expression
 */
export function mapRepDeltaToExpr(delta: number): PortraitExpression | null {
  if (delta >= 25) return 'approve';   // strong positive
  if (delta > 0)  return 'smile';      // mild positive
  if (delta <= -40) return 'scowl';    // strong negative / hostility
  if (delta < 0)  return 'concern';    // mild negative / worry
  return null;
}

/**
 * Map event types to appropriate expressions
 */
export function mapEventToExpr(eventType: string): PortraitExpression | null {
  switch (eventType) {
    case 'quest_accept': return 'approve';
    case 'quest_decline': return 'sad';
    case 'trade_success': return 'approve';
    case 'trade_fail': return 'concern';
    case 'threat': return 'scowl';
    case 'attack': return 'scowl';
    case 'disease': return 'concern';
    case 'greeting': return 'smile';
    case 'confusion': return 'concern';
    case 'understanding': return 'smirk';
    case 'authorities': return 'sad';
    case 'hostile': return 'scowl';
    default: return null;
  }
}