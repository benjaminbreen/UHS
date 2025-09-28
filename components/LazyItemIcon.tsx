/**
 * Lazy-loaded item icon wrapper with progressive rendering
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { Item } from '../types';

interface LazyItemIconProps {
  item: Item;
  size: number;
  className?: string;
  immediate?: boolean; // Skip lazy loading
}

// Simple cache for rendered icons
const iconCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

const LazyItemIcon: React.FC<LazyItemIconProps> = ({
  item,
  size,
  className = '',
  immediate = false
}) => {
  const [isLoaded, setIsLoaded] = useState(immediate);
  const [iconHtml, setIconHtml] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Generate cache key from item properties
  const cacheKey = useMemo(() =>
    `${item.baseId || item.id}-${item.name}-${size}`,
    [item.baseId, item.id, item.name, size]
  );

  // Placeholder while loading
  const placeholder = useMemo(() => (
    <div
      className={`bg-slate-700/50 rounded animate-pulse ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="text-slate-600 p-2"
        fill="currentColor"
      >
        <rect x="6" y="4" width="12" height="16" rx="2" opacity="0.3" />
        <circle cx="12" cy="12" r="3" opacity="0.5" />
      </svg>
    </div>
  ), [size, className]);

  useEffect(() => {
    // Check cache first
    const cached = iconCache.get(cacheKey);
    if (cached) {
      setIconHtml(cached);
      setIsLoaded(true);
      return;
    }

    if (immediate) {
      setIsLoaded(true);
      return;
    }

    // Set up intersection observer for lazy loading
    if (!containerRef.current) return;

    try {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '50px', // Start loading 50px before visible
          threshold: 0.01
        }
      );

      observerRef.current.observe(containerRef.current);
    } catch (error) {
      // Fallback if IntersectionObserver fails
      console.warn('IntersectionObserver failed, loading immediately:', error);
      setIsLoaded(true);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [immediate, cacheKey]);

  // Cache the rendered icon after it loads
  useEffect(() => {
    if (isLoaded && !iconHtml && !hasError && containerRef.current) {
      // Wait a tick for render to complete
      const timer = setTimeout(() => {
        try {
          const svg = containerRef.current?.querySelector('svg');
          if (svg) {
            const html = svg.outerHTML;

            // Manage cache size
            if (iconCache.size >= MAX_CACHE_SIZE) {
              const firstKey = iconCache.keys().next().value;
              iconCache.delete(firstKey);
            }

            iconCache.set(cacheKey, html);
            setIconHtml(html);
          }
        } catch (error) {
          console.error('Failed to cache icon:', error);
          setHasError(true);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, iconHtml, cacheKey, hasError]);

  // If we have cached HTML, render it directly
  if (iconHtml) {
    return (
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: iconHtml }}
      />
    );
  }

  // Show error state, placeholder or actual icon
  if (hasError) {
    return placeholder;
  }

  return (
    <div ref={containerRef} className={className}>
      {isLoaded ? (
        <React.Suspense fallback={placeholder}>
          <GenerativeItemIcon item={item} size={size} />
        </React.Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
};

export default LazyItemIcon;