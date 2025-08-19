/**
 * Event Notification Component
 * Shows toast notifications when events trigger
 */

import React, { memo, useEffect, useState } from 'react';
import { Bell, AlertCircle, Scroll, X } from 'lucide-react';
import { EventInstance } from '../types/eventTypes';

interface EventNotificationProps {
  event: EventInstance | null;
  onOpen: () => void;
  onDismiss: () => void;
  autoDismissTime?: number; // milliseconds
}

export const EventNotification = memo(({ 
  event, 
  onOpen, 
  onDismiss,
  autoDismissTime = 10000 // 10 seconds default
}: EventNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-dismiss timer
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissTime);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [event, autoDismissTime]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss();
    }, 300); // Match animation duration
  };

  const handleOpen = () => {
    handleDismiss(); // Dismiss notification
    onOpen(); // Open full modal
  };

  if (!isVisible || !event) return null;

  // Determine urgency/type for styling
  const getNotificationStyle = () => {
    if (event.title.toLowerCase().includes('crisis') || 
        event.title.toLowerCase().includes('emergency')) {
      return 'from-red-600 to-orange-600 border-red-500';
    }
    if (event.title.toLowerCase().includes('opportunity') || 
        event.title.toLowerCase().includes('discovery')) {
      return 'from-green-600 to-emerald-600 border-green-500';
    }
    return 'from-blue-600 to-indigo-600 border-blue-500';
  };

  const getIcon = () => {
    if (event.title.toLowerCase().includes('crisis') || 
        event.title.toLowerCase().includes('emergency')) {
      return <AlertCircle className="w-5 h-5" />;
    }
    if (event.title.toLowerCase().includes('discovery') || 
        event.title.toLowerCase().includes('opportunity')) {
      return <Scroll className="w-5 h-5" />;
    }
    return <Bell className="w-5 h-5" />;
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-40
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${!isExiting && isVisible ? 'animate-slideInRight' : ''}
      `}
      style={{
        animation: !isExiting && isVisible ? 'slideInRight 0.3s ease-out' : undefined
      }}
    >
      <div className={`
        bg-gradient-to-r ${getNotificationStyle()}
        rounded-lg shadow-2xl border-l-4
        max-w-sm w-80
        overflow-hidden
        backdrop-blur-sm bg-opacity-95
      `}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-semibold text-sm">
              {event.title}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3 bg-black/20">
          <p className="text-xs text-white/90 line-clamp-2 mb-3">
            {event.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 
                       text-white text-xs font-medium rounded
                       transition-colors duration-200
                       backdrop-blur-sm"
            >
              View Event
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-black/20 hover:bg-black/30
                       text-white/70 hover:text-white text-xs rounded
                       transition-colors duration-200"
            >
              Later
            </button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="h-1 bg-black/20">
          <div 
            className="h-full bg-white/30 transition-all"
            style={{
              animation: `shrinkWidth ${autoDismissTime}ms linear`,
              width: '0%'
            }}
          />
        </div>
      </div>
    </div>
  );
});

EventNotification.displayName = 'EventNotification';

// Add keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes shrinkWidth {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
document.head.appendChild(style);

/**
 * Event Badge Component - Shows on map when event is available
 */
export const EventBadge = memo(({ 
  hasEvent, 
  onClick 
}: { 
  hasEvent: boolean; 
  onClick: () => void;
}) => {
  if (!hasEvent) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-20 right-4 z-30
                 bg-gradient-to-r from-amber-500 to-orange-500
                 text-white rounded-full p-3
                 shadow-lg hover:shadow-xl
                 transform hover:scale-110
                 transition-all duration-200
                 animate-pulse"
      aria-label="View pending event"
    >
      <Bell className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 
                       bg-red-500 text-white text-xs 
                       rounded-full w-5 h-5 
                       flex items-center justify-center
                       font-bold">
        !
      </span>
    </button>
  );
});

EventBadge.displayName = 'EventBadge';

/**
 * Victory Progress Bar - Shows progress toward current mode victory
 */
export const VictoryProgressBar = memo(({ 
  modeName, 
  conditions 
}: { 
  modeName: string;
  conditions: Array<{ description: string; progress: number; target?: number }>;
}) => {
  const overallProgress = conditions.reduce((sum, c) => {
    if (c.target) {
      return sum + (c.progress / c.target) * (100 / conditions.length);
    }
    return sum + (c.progress ? 100 / conditions.length : 0);
  }, 0);

  return (
    <div className="fixed top-20 left-4 z-30
                    bg-slate-800/90 backdrop-blur-sm
                    rounded-lg shadow-lg p-3
                    max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-white">
          {modeName}
        </h4>
        <span className="text-xs text-gray-400">
          {Math.round(overallProgress)}%
        </span>
      </div>
      
      {/* Overall progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 
                     transition-all duration-500 ease-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Individual conditions */}
      <div className="space-y-1">
        {conditions.map((condition, index) => {
          const progress = condition.target 
            ? (condition.progress / condition.target) * 100
            : condition.progress ? 100 : 0;
            
          return (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                progress >= 100 ? 'bg-green-400' : 'bg-slate-600'
              }`} />
              <span className="text-[10px] text-gray-400 flex-1">
                {condition.description}
              </span>
              {condition.target && (
                <span className="text-[10px] text-gray-500">
                  {condition.progress}/{condition.target}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VictoryProgressBar.displayName = 'VictoryProgressBar';