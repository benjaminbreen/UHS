/**
 * components/ui/ReputationNotification.tsx
 * Shows reputation changes as floating notifications
 */

import React, { useEffect, useState } from 'react';

interface ReputationNotificationProps {
  change: number;
  reason: string;
  witnesses?: string[];
  onComplete?: () => void;
}

const ReputationNotification: React.FC<ReputationNotificationProps> = ({
  change,
  reason,
  witnesses,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  const isPositive = change > 0;
  const isMajor = Math.abs(change) >= 10;

  return (
    <div
      className={`
        fixed top-20 right-4 z-[9999]
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        flex items-start gap-3 px-4 py-3
        bg-gray-900/95 backdrop-blur-md
        border-2 rounded-lg shadow-2xl
        ${isPositive ? 'border-green-500' : 'border-red-500'}
        ${isMajor ? 'animate-pulse' : ''}
        min-w-[280px] max-w-[400px]
      `}>
        {/* Icon */}
        <div className={`
          w-10 h-10 flex items-center justify-center rounded-full
          ${isPositive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}
          font-bold text-lg flex-shrink-0
        `}>
          {isPositive ? '↑' : '↓'}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Reputation Change */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Reputation
            </span>
            <span className={`
              text-sm font-bold
              ${isPositive ? 'text-green-400' : 'text-red-400'}
            `}>
              {isPositive ? '+' : ''}{change}
            </span>
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-300 mb-1">
            {reason}
          </div>

          {/* Witnesses */}
          {witnesses && witnesses.length > 0 && (
            <div className="text-xs text-gray-500 italic">
              Witnessed by: {witnesses.slice(0, 3).join(', ')}
              {witnesses.length > 3 && ` and ${witnesses.length - 3} others`}
            </div>
          )}
        </div>

        {/* Severity Indicator */}
        {isMajor && (
          <div className={`
            absolute -top-1 -right-1
            w-3 h-3 rounded-full
            ${isPositive ? 'bg-green-400' : 'bg-red-400'}
            animate-ping
          `} />
        )}
      </div>
    </div>
  );
};

export default ReputationNotification;