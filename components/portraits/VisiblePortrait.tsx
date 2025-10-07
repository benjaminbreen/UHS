/**
 * VisiblePortrait - Intersection Observer wrapper for lazy portrait rendering
 * Only renders portraits when they're visible in the viewport
 * Significantly improves performance when rendering large lists of NPCs
 */

import React, { useRef, useState, useEffect } from 'react';
import LazyPortrait from './LazyPortrait';
import type { NpcEntity, PlayerCharacter } from '../../types';

interface VisiblePortraitProps {
  npc: NpcEntity | PlayerCharacter;
  size?: number;
  className?: string;
  type?: 'procedural' | 'animated';
  staticMode?: boolean;
}

export const VisiblePortrait: React.FC<VisiblePortraitProps> = ({
  npc,
  size = 48,
  className = '',
  type = 'procedural',
  staticMode = true
}) => {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Use Intersection Observer to detect when portrait enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true); // Once visible, keep it rendered
        }
      },
      {
        // Start loading slightly before it becomes visible
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: size, height: size }}
    >
      {hasBeenVisible ? (
        <LazyPortrait
          character={npc}
          size={size}
          type={type}
          staticMode={staticMode}
        />
      ) : (
        // Lightweight placeholder while portrait is off-screen
        <div
          className="flex items-center justify-center bg-slate-700/30 rounded-md"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-slate-500">👤</span>
        </div>
      )}
    </div>
  );
};

export default VisiblePortrait;
