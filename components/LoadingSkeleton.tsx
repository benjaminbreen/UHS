/**
 * LoadingSkeleton.tsx
 * Beautiful initial loading screen with full theme awareness
 * Shows while the app is initializing
 * GPU-accelerated, Safari-optimized
 */
import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="loading-skeleton-container">
      <div className="text-center max-w-md px-6">
        {/* Animated logo container with glow */}
        <div className="mb-8 relative">
          <div className="loading-skeleton-logo">
            {/* Spinning border effect - Safari optimized */}
            <div className="loading-skeleton-spinner" />

            {/* Inner content */}
            <div className="relative z-10">
              <svg className="w-14 h-14 text-white dark:text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text - theme aware */}
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
          Universal History Simulator
        </h2>
        <p className="text-[var(--text-secondary)] text-base mb-8 leading-relaxed">
          Preparing your journey through time...
        </p>

        {/* Beautiful progress bar */}
        <div className="progress-bar h-2 mb-4">
          <div className="progress-bar-fill" />
        </div>

        {/* Loading dots - theme aware */}
        <div className="flex justify-center">
          <div className="dots-loader">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* Subtle hint text */}
        <p className="text-[var(--text-tertiary)] text-xs mt-8 italic">
          Generating a hyper-specific historical scenario
        </p>
      </div>
    </div>
  );
};
