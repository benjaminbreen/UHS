/**
 * components/HistoryLensStructureCard.tsx
 * Interactive card component for structure entry prompts in HistoryLens
 */
import React from 'react';
import type { StructureCard, StructureCardType } from '../types/historyLens';
import { eventBus } from '../services/eventBus';

// Icons for different structure types
const STRUCTURE_ICONS: Record<StructureCardType, string> = {
  city: '🏛️',
  fortress: '🏰',
  mine: '⛏️',
  quarry: '🪨',
  fishing_hut: '🎣',
  palace: '👑',
  holy_site: '⛪',
  ruins: '🏚️',
  government: '🏛️',
  farm: '🌾',
  market: '🏪',
  harbor: '⚓',
  woodcutter: '🪓'
};

// Human-readable labels for structure types
const STRUCTURE_LABELS: Record<StructureCardType, string> = {
  city: 'City',
  fortress: 'Fortress',
  mine: 'Mine',
  quarry: 'Quarry',
  fishing_hut: 'Fishing Hut',
  palace: 'Palace',
  holy_site: 'Sacred Site',
  ruins: 'Ruins',
  government: 'Government District',
  farm: 'Farm',
  market: 'Marketplace',
  harbor: 'Harbor',
  woodcutter: "Woodcutter's Camp"
};

interface HistoryLensStructureCardProps {
  card: StructureCard;
  onResolve: (entered: boolean) => void;
}

const HistoryLensStructureCard: React.FC<HistoryLensStructureCardProps> = ({
  card,
  onResolve
}) => {
  const icon = STRUCTURE_ICONS[card.structureType] || '📍';
  const typeLabel = STRUCTURE_LABELS[card.structureType] || 'Location';

  const handleEnter = () => {
    // Emit event for useUIState to catch and open the appropriate modal
    eventBus.emit('historylens:enter_structure', {
      structureType: card.structureType,
      structureId: card.structureId,
      structureName: card.structureName,
      location: card.location
    });
    onResolve(true);
  };

  const handleDecline = () => {
    onResolve(false);
  };

  // If already resolved, show a muted version
  if (card.resolved) {
    return (
      <div className="rounded-xl border border-white/5 bg-slate-900/20 px-5 py-4 opacity-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-50">{icon}</span>
          <div>
            <div className="text-sm font-medium text-text-secondary line-through">
              {card.structureName}
            </div>
            <div className="text-xs text-text-muted">
              {card.resolved ? 'Visited' : 'Declined'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-white/15 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden shadow-lg"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08), transparent 50%)'
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="text-lg font-semibold text-text-primary tracking-tight">
              {card.structureName}
            </div>
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {typeLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <div className="px-5 py-3 text-sm text-text-secondary leading-relaxed">
          {card.description}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 flex gap-3">
        <button
          onClick={handleEnter}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold
                     bg-gradient-to-r from-emerald-500/20 to-emerald-600/20
                     border border-emerald-400/30 text-emerald-200
                     hover:from-emerald-500/30 hover:to-emerald-600/30
                     hover:border-emerald-400/50 transition-all duration-200"
        >
          Enter {typeLabel}
        </button>
        <button
          onClick={handleDecline}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                     bg-slate-800/50 border border-white/10 text-text-secondary
                     hover:bg-slate-700/50 hover:border-white/20
                     hover:text-text-primary transition-all duration-200"
        >
          Stay Outside
        </button>
      </div>
    </div>
  );
};

export default HistoryLensStructureCard;
