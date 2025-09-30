/**
 * Lazy-loaded portrait component with progressive rendering and caching
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import ProceduralPortrait from './ProceduralPortrait';
import AnimatedPortrait from './AnimatedPortrait';
import { portraitCache } from '../../services/portraitCacheService';
import { PlayerCharacter, NpcEntity } from '../../types';

interface LazyPortraitProps {
  character: PlayerCharacter | NpcEntity;
  size: number;
  type?: 'procedural' | 'animated';
  useEquippedItems?: boolean;
  trackChanges?: boolean;
  className?: string;
  immediate?: boolean; // Skip lazy loading for critical portraits
  staticMode?: boolean; // Disable animations/expressions for lists
}

const LazyPortrait: React.FC<LazyPortraitProps> = ({
  character,
  size,
  type = 'procedural',
  useEquippedItems = false,
  trackChanges = false,
  className = '',
  immediate = false,
  staticMode = false
}) => {
  const [isLoading, setIsLoading] = useState(!immediate);
  const [portraitHtml, setPortraitHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();

  // Create a simple placeholder
  const placeholder = useMemo(() => (
    <div
      className={`bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="3" />
          <path d="M16 14s-1.5-2-4-2-4 2-4 2" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </div>
    </div>
  ), [size, className]);

  useEffect(() => {
    if (immediate) {
      loadPortrait();
      return;
    }

    // Set up intersection observer for lazy loading
    const setupObserver = () => {
      if (!containerRef.current) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            // Add small delay for progressive rendering
            renderTimeoutRef.current = setTimeout(() => {
              loadPortrait();
            }, 50);

            // Disconnect after triggering load
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '100px', // Start loading 100px before visible
          threshold: 0.01
        }
      );

      observerRef.current.observe(containerRef.current);
    };

    // Small delay to prevent blocking initial render
    const setupTimeout = setTimeout(setupObserver, 100);

    return () => {
      clearTimeout(setupTimeout);
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, [immediate, character.id, size, type]);

  const loadPortrait = async () => {
    // Check cache first (only for procedural portraits)
    if (type === 'procedural') {
      const cached = portraitCache.getCachedPortrait(
        character.id,
        size,
        useEquippedItems,
        useEquippedItems ? character.equippedItems : undefined
      );

      if (cached) {
        setPortraitHtml(cached);
        setIsLoading(false);
        return;
      }
    }

    // Render portrait in next tick to avoid blocking
    await new Promise(resolve => setTimeout(resolve, 0));

    setIsLoading(false);

    // Cache the rendered portrait (only for procedural)
    if (type === 'procedural' && containerRef.current) {
      // Wait for render to complete
      setTimeout(() => {
        const svg = containerRef.current?.querySelector('svg');
        if (svg) {
          const svgString = svg.outerHTML;
          portraitCache.setCachedPortrait(
            character.id,
            size,
            svgString,
            useEquippedItems,
            useEquippedItems ? character.equippedItems : undefined
          );
        }
      }, 100);
    }
  };

  // If we have cached HTML, render it directly
  if (portraitHtml) {
    return (
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: portraitHtml }}
      />
    );
  }

  // Show placeholder while loading
  if (isLoading) {
    return <div ref={containerRef}>{placeholder}</div>;
  }

  // Render actual portrait
  return (
    <div ref={containerRef} className={className}>
      {type === 'animated' && !staticMode ? (
        <AnimatedPortrait
          character={character}
          size={size}
          trackChanges={trackChanges}
        />
      ) : (
        <ProceduralPortrait
          character={character}
          size={size}
          useEquippedItems={useEquippedItems}
          staticMode={staticMode}
        />
      )}
    </div>
  );
};

export default LazyPortrait;