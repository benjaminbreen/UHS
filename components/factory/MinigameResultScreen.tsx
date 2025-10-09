/**
 * components/factory/MinigameResultScreen.tsx
 * Shows graded result feedback after minigame completion
 * REFACTORED: Responsive, performant, with click/keyboard handlers
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MinigameResult, RESULT_THEMES, getScoringInfo } from './minigameConstants';
import { useMinigameKeyboard } from './minigameHooks';

interface MinigameResultScreenProps {
  result: MinigameResult;
  taskName: string;
  themeColor: string;
  onDismiss: () => void;
  duration?: number; // Auto-dismiss after this many ms
}

export const MinigameResultScreen: React.FC<MinigameResultScreenProps> = ({
  result,
  taskName,
  themeColor,
  onDismiss,
  duration = 1500
}) => {
  const [visible, setVisible] = useState(false);
  const scoringInfo = getScoringInfo(result);
  const theme = RESULT_THEMES[result];

  // Dismiss handler
  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  // Keyboard support (SPACE or ESC to dismiss)
  useMinigameKeyboard(handleDismiss, handleDismiss, true);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  // Memoized particles (performance optimization)
  const particles = useMemo(() => {
    if (result !== MinigameResult.PERFECT) return null;

    return Array.from({ length: 30 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 500
    }));
  }, [result]);

  // Render particles (only if PERFECT)
  const renderParticles = () => {
    if (!particles) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}ms`,
              animationDuration: '1s'
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.color }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 cursor-pointer ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.90)' }}
      onClick={handleDismiss}
    >
      <div
        className={`relative bg-gradient-to-br ${theme.bgGradient} rounded-2xl sm:rounded-3xl border-4 ${theme.borderColor} shadow-2xl p-4 sm:p-8 md:p-12 w-full max-w-xs sm:max-w-sm md:max-w-md mx-4 ${
          result === MinigameResult.PERFECT ? 'animate-bounce' : ''
        }`}
        style={{ borderColor: theme.color }}
      >
        {/* Particles for perfect */}
        {renderParticles()}

        {/* Emoji Icon */}
        <div className="text-center mb-3 sm:mb-4">
          <div
            className={`text-5xl sm:text-6xl md:text-8xl ${result === MinigameResult.PERFECT ? 'animate-pulse' : ''}`}
          >
            {theme.emoji}
          </div>
        </div>

        {/* Result Text */}
        <div className="text-center mb-4 sm:mb-6">
          <div
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
            style={{ color: theme.textColor }}
          >
            {theme.message}
          </div>
          <div className="text-sm sm:text-base md:text-lg text-slate-300">{taskName}</div>
        </div>

        {/* Stats */}
        <div className="space-y-2 sm:space-y-3">
          {/* Output Bonus */}
          <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 sm:px-4 py-2">
            <span className="text-sm sm:text-base text-slate-300">Output:</span>
            <span
              className="font-bold text-base sm:text-lg"
              style={{ color: scoringInfo.outputMultiplier >= 1 ? '#10b981' : '#ef4444' }}
            >
              {scoringInfo.outputMultiplier >= 1 ? '+' : ''}
              {((scoringInfo.outputMultiplier - 1) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Fatigue */}
          {scoringInfo.fatigueMultiplier !== 1.0 && (
            <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 sm:px-4 py-2">
              <span className="text-sm sm:text-base text-slate-300">Fatigue:</span>
              <span
                className="font-bold text-base sm:text-lg"
                style={{ color: scoringInfo.fatigueMultiplier < 1 ? '#10b981' : '#ef4444' }}
              >
                {scoringInfo.fatigueMultiplier < 1 ? '-' : '+'}
                {(Math.abs(scoringInfo.fatigueMultiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress bar (auto-dismiss countdown) */}
        <div className="mt-4 sm:mt-6 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              backgroundColor: theme.color,
              width: visible ? '0%' : '100%',
              transition: `width ${duration}ms linear`
            }}
          />
        </div>

        {/* Hint text */}
        <div className="mt-2 sm:mt-3 text-center text-xs text-slate-400">
          Press SPACE, ESC, or click to continue
        </div>
      </div>
    </div>
  );
};

export default MinigameResultScreen;
