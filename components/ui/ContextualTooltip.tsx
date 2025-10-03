/**
 * ContextualTooltip - Educational tooltip component for first-time user guidance
 * Appears once for key UI elements and can be toggled off in settings
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ContextualTooltipProps {
  id: string;
  title: string;
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  onDismiss: () => void;
  autoDismissDelay?: number; // milliseconds, 0 = no auto-dismiss
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  id,
  title,
  message,
  position = 'right',
  onDismiss,
  autoDismissDelay = 10000 // Default: 10 seconds
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in after mount
    const fadeInTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss if delay is set
    let autoDismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissDelay > 0) {
      autoDismissTimer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);
    }

    return () => {
      clearTimeout(fadeInTimer);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, [autoDismissDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for fade-out animation
  };

  // Position-specific styles
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3'
  };

  // Arrow position styles
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-800 border-x-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-800 border-y-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-800 border-y-transparent border-r-transparent'
  };

  return (
    <div
      className={`
        absolute z-[70] w-72 pointer-events-auto
        ${positionClasses[position]}
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      `}
      role="tooltip"
      aria-label={title}
    >
      {/* Arrow */}
      <div
        className={`
          absolute w-0 h-0
          border-8
          ${arrowClasses[position]}
        `}
      />

      {/* Tooltip content */}
      <div className="relative bg-slate-800 border-2 border-blue-500/50 rounded-lg shadow-2xl overflow-hidden">
        {/* Subtle pulse animation on the border */}
        <div className="absolute inset-0 border-2 border-blue-400/30 rounded-lg animate-pulse pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 bg-gradient-to-r from-blue-900/40 to-blue-800/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg">💡</span>
            <h3 className="text-sm font-semibold text-blue-200">{title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
            aria-label="Dismiss tooltip"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-200 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer with dismiss button */}
        <div className="px-4 pb-3 flex justify-end">
          <button
            onClick={handleDismiss}
            className="
              px-3 py-1.5 text-xs font-medium
              bg-blue-600 hover:bg-blue-500
              text-white rounded
              transition-colors
              shadow-sm
            "
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextualTooltip;
