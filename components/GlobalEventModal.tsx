/**
 * Modal for displaying global historical events with player choices
 */

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { GlobalEvent, EventChoice, activateGlobalEvent } from '../services/globalEventService';
import { PlayerCharacter } from '../types/playerCharacter';

interface GlobalEventModalProps {
  event: GlobalEvent;
  onClose: () => void;
  playerCharacter: PlayerCharacter;
  onApplyEffects: (choice: EventChoice) => void;
}

const GlobalEventModal: React.FC<GlobalEventModalProps> = ({
  event,
  onClose,
  playerCharacter,
  onApplyEffects
}) => {
  const [showHistoricalContext, setShowHistoricalContext] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const handleChoiceSelect = (choice: EventChoice) => {
    setSelectedChoiceId(choice.id);

    // Activate the global event with player's choice
    activateGlobalEvent(event, choice.id);

    // Apply immediate effects to player
    onApplyEffects(choice);

    // Close modal after short delay
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const getCategoryColor = (category: GlobalEvent['category']) => {
    switch (category) {
      case 'catastrophe':
        return 'text-red-800 dark:text-red-300 border-red-600 dark:border-red-600/30 bg-red-100 dark:bg-red-900/10';
      case 'economic':
        return 'text-amber-800 dark:text-amber-300 border-amber-600 dark:border-amber-600/30 bg-amber-100 dark:bg-amber-900/10';
      case 'technological':
        return 'text-blue-800 dark:text-blue-300 border-blue-600 dark:border-blue-600/30 bg-blue-100 dark:bg-blue-900/10';
      case 'political':
        return 'text-purple-800 dark:text-purple-300 border-purple-600 dark:border-purple-600/30 bg-purple-100 dark:bg-purple-900/10';
      case 'religious':
        return 'text-yellow-800 dark:text-yellow-300 border-yellow-600 dark:border-yellow-600/30 bg-yellow-100 dark:bg-yellow-900/10';
      case 'natural':
        return 'text-green-800 dark:text-green-300 border-green-600 dark:border-green-600/30 bg-green-100 dark:bg-green-900/10';
      default:
        return 'text-slate-700 dark:text-slate-400 border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800';
    }
  };

  const getCategoryLabel = (category: GlobalEvent['category']) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  const getEffectDescription = (choice: EventChoice): string[] => {
    const effects: string[] = [];

    if (choice.effects.healthRisk) {
      effects.push(`${Math.round(choice.effects.healthRisk * 100)}% risk of severe illness`);
    }
    if (choice.effects.currencyChange) {
      const sign = choice.effects.currencyChange > 0 ? '+' : '';
      effects.push(`${sign}${choice.effects.currencyChange} coins`);
    }
    if (choice.effects.reputationChange) {
      const sign = choice.effects.reputationChange > 0 ? '+' : '';
      effects.push(`${sign}${choice.effects.reputationChange} reputation`);
    }
    if (choice.effects.itemsGained && choice.effects.itemsGained.length > 0) {
      effects.push(`Gain: ${choice.effects.itemsGained.map(i => i.name).join(', ')}`);
    }
    if (choice.effects.skillGain) {
      effects.push(`+${choice.effects.skillGain.amount} ${choice.effects.skillGain.skill}`);
    }

    return effects;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#f5f1e8] dark:bg-[#1a1a1a] border-2 border-slate-400 dark:border-slate-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#f5f1e8] dark:bg-[#1a1a1a] border-b border-slate-300 dark:border-slate-700 p-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {event.title}
              </h2>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(event.category)}`}>
              {getCategoryLabel(event.category)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-4 bg-[#f5f1e8] dark:bg-[#1a1a1a]">
          {/* Main Description */}
          <div className="bg-[#e8dfc8] dark:bg-[#2a2a2a] rounded-lg p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Historical Context (Collapsible) */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-[#e8dfc8] dark:bg-[#2a2a2a]">
            <button
              onClick={() => setShowHistoricalContext(!showHistoricalContext)}
              className="w-full px-4 py-3 flex items-center justify-between bg-[#e8dfc8] dark:bg-[#2a2a2a] hover:bg-[#d4cbb3] dark:hover:bg-[#333333] transition-colors"
            >
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📚 Historical Context
              </span>
              {showHistoricalContext ? (
                <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>
            {showHistoricalContext && (
              <div className="px-4 py-3 bg-[#d4cbb3] dark:bg-[#222222] border-t border-slate-300 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {event.historicalContext}
                </p>
              </div>
            )}
          </div>

          {/* Choices */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              How will you respond?
            </h3>
            <div className="grid gap-3">
              {event.choices.map((choice) => {
                const effects = getEffectDescription(choice);
                const isSelected = selectedChoiceId === choice.id;

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={!!selectedChoiceId}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-amber-600 dark:border-amber-500 bg-amber-100 dark:bg-[#8b7355]/20 shadow-lg'
                        : 'border-slate-300 dark:border-slate-700 bg-[#e8dfc8] dark:bg-[#2a2a2a] hover:border-amber-500 dark:hover:border-amber-600 hover:bg-[#d4cbb3] dark:hover:bg-[#333333]'
                      }
                      ${selectedChoiceId && !isSelected ? 'opacity-50' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{choice.label.split(' ')[0]}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1">
                          {choice.label.substring(choice.label.indexOf(' ') + 1)}
                        </div>
                        {effects.length > 0 && (
                          <div className="space-y-1">
                            {effects.map((effect, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1"
                              >
                                <span className="text-amber-700 dark:text-amber-400">•</span>
                                {effect}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 dark:bg-amber-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effects Warning */}
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-600/30 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 italic font-medium">
              ⚠️ This event will affect the entire world for {event.durationDays} days.
              NPCs will be aware of it and react accordingly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalEventModal;
