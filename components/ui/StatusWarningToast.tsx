/**
 * components/ui/StatusWarningToast.tsx
 * Graduated warning system for health and fatigue thresholds
 */

import React, { useEffect, useState } from 'react';
import { FaHeartBroken, FaBed, FaSkull, FaExclamationTriangle } from 'react-icons/fa';
import { IoWarning } from 'react-icons/io5';
import { GiNightSleep } from 'react-icons/gi';
import { Tent } from 'lucide-react';

interface StatusWarningToastProps {
  type: 'health' | 'fatigue';
  severity: 'warning' | 'danger' | 'critical';
  currentValue: number;
  maxValue: number;
  onClose: () => void;
  onMakeCamp?: () => void; // Callback to open camping modal
  duration?: number; // milliseconds before auto-dismiss (0 = no auto-dismiss)
}

const StatusWarningToast: React.FC<StatusWarningToastProps> = ({
  type,
  severity,
  currentValue,
  maxValue,
  onClose,
  onMakeCamp,
  duration = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration (if > 0)
    let hideTimer: NodeJS.Timeout | null = null;
    if (duration > 0) {
      hideTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 400); // Wait for exit animation
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 400);
  };

  const percentage = Math.round((currentValue / maxValue) * 100);

  // Check if fatigue has reached 100% (collapsed)
  const isCollapsed = type === 'fatigue' && currentValue >= 100;

  // Get severity-specific styles
  const getSeverityConfig = () => {
    if (type === 'health') {
      switch (severity) {
        case 'critical':
          return {
            icon: <FaSkull className="w-8 h-8" />,
            iconColor: 'text-red-500',
            title: 'CRITICAL CONDITION',
            message: 'Death is imminent',
            advice: 'Bed down for the night to recover your health',
            bgGradient: 'from-red-900/95 via-red-800/95 to-red-900/95',
            borderColor: 'border-red-500',
            textColor: 'text-red-200',
            titleSize: 'text-xl',
            animation: 'animate-critical-pulse',
            progressColor: 'bg-red-600',
            glowColor: 'shadow-red-500/50'
          };
        case 'danger':
          return {
            icon: <FaHeartBroken className="w-7 h-7" />,
            iconColor: 'text-orange-500',
            title: 'Severely Injured',
            message: 'Your wounds are critical',
            advice: 'Make camp soon to rest and heal your injuries',
            bgGradient: 'from-orange-900/90 via-orange-800/90 to-red-900/90',
            borderColor: 'border-orange-500',
            textColor: 'text-orange-100',
            titleSize: 'text-lg',
            animation: 'animate-danger-shake',
            progressColor: 'bg-orange-600',
            glowColor: 'shadow-orange-500/40'
          };
        case 'warning':
          return {
            icon: <IoWarning className="w-6 h-6" />,
            iconColor: 'text-yellow-500',
            title: 'Wounded',
            message: 'Your injuries need attention',
            advice: 'Consider bedding down for the night to recover',
            bgGradient: 'from-yellow-900/85 via-yellow-800/85 to-orange-900/85',
            borderColor: 'border-yellow-500',
            textColor: 'text-yellow-100',
            titleSize: 'text-base',
            animation: 'animate-warning-fade',
            progressColor: 'bg-yellow-600',
            glowColor: 'shadow-yellow-500/30'
          };
      }
    } else {
      // Fatigue
      switch (severity) {
        case 'critical':
          return {
            icon: <GiNightSleep className="w-8 h-8" />,
            iconColor: 'text-purple-500',
            title: isCollapsed ? 'COLLAPSED' : 'EXTREME EXHAUSTION',
            message: isCollapsed ? 'You have collapsed from exhaustion' : 'You may collapse at any moment',
            advice: isCollapsed ? 'You will be unable to move until you rest.' : 'Bed down for the night immediately to replenish your energy',
            bgGradient: 'from-purple-900/95 via-indigo-900/95 to-purple-900/95',
            borderColor: 'border-purple-500',
            textColor: 'text-purple-200',
            titleSize: 'text-xl',
            animation: 'animate-critical-pulse',
            progressColor: 'bg-purple-600',
            glowColor: 'shadow-purple-500/50'
          };
        case 'danger':
          return {
            icon: <FaBed className="w-7 h-7" />,
            iconColor: 'text-indigo-500',
            title: 'Dangerously Tired',
            message: 'Exhaustion is overwhelming you',
            advice: 'Make camp soon to rest and restore your energy',
            bgGradient: 'from-indigo-900/90 via-indigo-800/90 to-purple-900/90',
            borderColor: 'border-indigo-500',
            textColor: 'text-indigo-100',
            titleSize: 'text-lg',
            animation: 'animate-danger-shake',
            progressColor: 'bg-indigo-600',
            glowColor: 'shadow-indigo-500/40'
          };
        case 'warning':
          return {
            icon: <FaExclamationTriangle className="w-6 h-6" />,
            iconColor: 'text-blue-500',
            title: 'Getting Tired',
            message: 'Fatigue is setting in',
            advice: 'Consider bedding down for the night to recover',
            bgGradient: 'from-blue-900/85 via-blue-800/85 to-indigo-900/85',
            borderColor: 'border-blue-500',
            textColor: 'text-blue-100',
            titleSize: 'text-base',
            animation: 'animate-warning-fade',
            progressColor: 'bg-blue-600',
            glowColor: 'shadow-blue-500/30'
          };
      }
    }
  };

  const config = getSeverityConfig();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '6rem',
          left: '50%',
          transform: isVisible && !isExiting
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(2rem)',
          opacity: isVisible && !isExiting ? 1 : 0,
          zIndex: 9999,
          transition: 'all 0.4s ease-out'
        }}
        className={config.animation}
      >
        <div
          className={`
            flex items-center gap-4 px-6 py-4
            bg-gradient-to-r ${config.bgGradient}
            backdrop-blur-lg
            border-2 ${config.borderColor} rounded-xl
            shadow-2xl ${config.glowColor}
            w-[90vw] sm:w-auto sm:min-w-[420px] sm:max-w-[580px]
          `}
        >
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 flex items-center justify-center
              ${config.iconColor}
              ${severity === 'critical' ? 'animate-pulse' : ''}
            `}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div
              className={`
                ${config.titleSize} font-extrabold uppercase tracking-wide
                ${config.textColor} mb-1
              `}
            >
              {config.title}
            </div>

            {/* Message */}
            <div className="text-sm font-semibold text-white mb-2">
              {config.message}
            </div>

            {/* Advice */}
            <div className="text-xs italic text-gray-300 leading-relaxed">
              {config.advice}
            </div>

            {/* Make Camp Button - only show if callback provided and not collapsed */}
            {onMakeCamp && !isCollapsed && (
              <button
                onClick={() => {
                  onMakeCamp();
                  handleManualClose();
                }}
                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500
                         text-white text-sm font-semibold rounded-lg transition-all
                         border border-blue-400/30 hover:border-blue-400/50
                         hover:shadow-lg hover:shadow-blue-500/20"
              >
                <Tent className="w-4 h-4" />
                <span>Make Camp</span>
              </button>
            )}

            {/* Progress Bar */}
            <div className="mt-3 w-full bg-gray-800/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full ${config.progressColor} transition-all duration-300 rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Stat Display */}
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(currentValue)} / {Math.round(maxValue)} ({percentage}%)
            </div>
          </div>

          {/* Close Button (only show for critical warnings or manual-close) */}
          {(severity === 'critical' || duration === 0) && (
            <button
              onClick={handleManualClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              aria-label="Close"
            >
              <div className="text-lg text-gray-300 group-hover:text-white transition-colors">
                ×
              </div>
            </button>
          )}
        </div>

        {/* Auto-dismiss progress indicator (for non-critical) */}
        {duration > 0 && severity !== 'critical' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50 rounded-b-xl overflow-hidden">
            <div
              className={`h-full ${config.progressColor} opacity-60 transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes critical-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }

        @keyframes warning-fade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-critical-pulse {
          animation: critical-pulse 0.8s ease-in-out infinite;
        }

        .animate-danger-shake {
          /* Shake animation removed - was causing layout shifts */
        }

        .animate-warning-fade {
          animation: warning-fade 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default StatusWarningToast;
