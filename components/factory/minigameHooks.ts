/**
 * components/factory/minigameHooks.ts
 * Shared hooks for factory timing minigames - eliminates code duplication
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages minigame timer with progress tracking
 */
export function useMinigameTimer(duration: number, onTimeout: () => void) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = now - startTimeRef.current;
      setElapsed(diff);

      if (diff >= duration) {
        onTimeout();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 16); // 60fps updates

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [duration, onTimeout]);

  return {
    elapsed,
    progress: Math.min((elapsed / duration) * 100, 100),
    remaining: Math.max(duration - elapsed, 0)
  };
}

/**
 * Handles keyboard input for minigames
 */
export function useMinigameKeyboard(
  onSpace: () => void,
  onEscape?: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onSpace();
      } else if (e.code === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSpace, onEscape, enabled]);
}

/**
 * Manages animation frame loop with cleanup
 */
export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  deps: React.DependencyList = []
) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      previousTimeRef.current = null;
    };
  }, [animate, ...deps]);

  const stop = useCallback(() => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  return { stop };
}

/**
 * Handles tab visibility changes (pause when not focused)
 */
export function useTabVisibility(onHidden?: () => void, onVisible?: () => void) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && onHidden) {
        onHidden();
      } else if (!document.hidden && onVisible) {
        onVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onHidden, onVisible]);
}

/**
 * Simple single-click handler with debounce
 */
export function useSingleClick(onClick: () => void, delay: number = 200) {
  const [clicked, setClicked] = useState(false);

  const handleClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);
    onClick();
  }, [clicked, onClick]);

  useEffect(() => {
    if (clicked) {
      const timeout = setTimeout(() => setClicked(false), delay);
      return () => clearTimeout(timeout);
    }
  }, [clicked, delay]);

  return { handleClick, clicked };
}

/**
 * Manages oscillating values (for moving bars, gauges, etc.)
 */
export function useOscillator(
  min: number,
  max: number,
  speed: number,
  startValue?: number
) {
  const [value, setValue] = useState(startValue ?? min);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => {
        let newValue = prev + direction * speed;

        if (newValue >= max) {
          newValue = max;
          setDirection(-1);
        } else if (newValue <= min) {
          newValue = min;
          setDirection(1);
        }

        return newValue;
      });
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [min, max, speed, direction]);

  return { value, direction };
}
