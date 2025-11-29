/**
 * SuspenseFallback.tsx
 * Polished loading fallback for React Suspense boundaries
 * Designed to blend smoothly with the app's dark overlays
 */
import React from 'react';

interface SuspenseFallbackProps {
  /** Whether to show as a full-screen overlay */
  fullScreen?: boolean;
  /** Whether to use a completely transparent background (invisible fallback) */
  invisible?: boolean;
  /** Optional custom message */
  message?: string;
}

/**
 * ModalSuspenseFallback - For lazy-loaded modals
 * Uses a subtle dark overlay that matches the modal backdrop
 * The loading indicator is minimal to reduce visual jarring
 */
export const ModalSuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  fullScreen = true,
  invisible = false,
  message
}) => {
  if (invisible) {
    // Completely invisible fallback - prevents flash while maintaining layout
    return <div className="fixed inset-0 z-50" aria-hidden="true" />;
  }

  return (
    <div
      className={`
        ${fullScreen ? 'fixed inset-0' : 'absolute inset-0'}
        bg-black/70 backdrop-blur-sm
        flex items-center justify-center
        z-50
        animate-in fade-in duration-150
      `}
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Elegant pulsing circles instead of spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
          <div className="absolute inset-4 rounded-full bg-white/40" />
        </div>
        {message && (
          <span className="text-white/70 text-sm font-medium tracking-wide">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * InlineSuspenseFallback - For lazy-loaded components within the page
 * Smaller, less intrusive loading state
 */
export const InlineSuspenseFallback: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`} role="status" aria-label="Loading">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

/**
 * InitialLoadFallback - Special fallback for the very first app load
 * Completely invisible to prevent any flash between loading screen and content
 */
export const InitialLoadFallback: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[100] bg-[#070b14] pointer-events-none"
      style={{
        // Match the initial loading screen background exactly
        background: 'linear-gradient(135deg, #070b14 0%, #0a1628 50%, #070b14 100%)'
      }}
      aria-hidden="true"
    />
  );
};

export default ModalSuspenseFallback;
