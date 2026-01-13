/**
 * components/HistoryLensJourneyCard.tsx
 * Interactive card component for continuing an interrupted journey in HistoryLens
 */
import React from 'react';
import type { JourneyCard } from '../types/historyLens';
import { eventBus } from '../services/eventBus';

interface HistoryLensJourneyCardProps {
  card: JourneyCard;
  onResolve: (continued: boolean) => void;
}

const HistoryLensJourneyCard: React.FC<HistoryLensJourneyCardProps> = ({
  card,
  onResolve
}) => {
  const handleContinue = () => {
    // Re-emit the navigate event to resume pathfinding
    eventBus.emit('historylens:navigate', card.destination);
    onResolve(true);
  };

  const handleStop = () => {
    onResolve(false);
  };

  // If already resolved, show a muted version
  if (card.resolved) {
    return (
      <div className="rounded-xl border border-white/5 bg-slate-900/20 px-5 py-4 opacity-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-50">🚶</span>
          <div>
            <div className="text-sm font-medium text-text-secondary line-through">
              Journey to {card.destination.label}
            </div>
            <div className="text-xs text-text-muted">
              {card.resolved ? 'Resumed' : 'Stopped'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const interruptionText = card.interruptedBy === 'npc'
    ? card.entityName
      ? `Your encounter with ${card.entityName} has concluded.`
      : 'Your conversation has concluded.'
    : card.entityName
      ? `The ${card.entityName.toLowerCase()} moves on.`
      : 'The animal moves on.';

  return (
    <div
      className="rounded-xl border border-white/15 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden shadow-lg"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.08), transparent 50%)'
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚶</span>
          <div>
            <div className="text-lg font-semibold text-text-primary tracking-tight">
              Continue Journey?
            </div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Destination: {card.destination.label}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 text-sm text-text-secondary leading-relaxed">
        {interruptionText} Would you like to continue on your way to {card.destination.label}?
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex gap-3">
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold
                     bg-gradient-to-r from-amber-500/20 to-amber-600/20
                     border border-amber-400/30 text-amber-200
                     hover:from-amber-500/30 hover:to-amber-600/30
                     hover:border-amber-400/50 transition-all duration-200"
        >
          Continue Journey
        </button>
        <button
          onClick={handleStop}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                     bg-slate-800/50 border border-white/10 text-text-secondary
                     hover:bg-slate-700/50 hover:border-white/20
                     hover:text-text-primary transition-all duration-200"
        >
          Stay Here
        </button>
      </div>
    </div>
  );
};

export default HistoryLensJourneyCard;
