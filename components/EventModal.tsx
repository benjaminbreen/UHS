/**
 * Event Modal Component
 * Displays event descriptions and choices to the player
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EventInstance, EventOutcome, StatCheck } from '../types/eventTypes';
import { PlayerCharacter } from '../types/playerCharacter';

interface EventModalProps {
  event: EventInstance;
  player: PlayerCharacter;
  onChoice: (choiceIndex: number) => void;
  onClose: () => void;
}

export function EventModal({ event, player, onChoice, onClose }: EventModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showHistoricalContext, setShowHistoricalContext] = useState(false);
  const choiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (choiceTimerRef.current) {
        clearTimeout(choiceTimerRef.current);
      }
    };
  }, []);

  /**
   * Check if player meets stat requirements for an outcome
   */
  const meetsStatRequirements = (outcome: EventOutcome): boolean => {
    if (!outcome.statChecks || outcome.statChecks.length === 0) return true;
    
    return outcome.statChecks.every(check => {
      const playerStat = player[check.stat];
      return playerStat >= check.minimum;
    });
  };

  /**
   * Format stat requirements for display
   */
  const formatStatRequirements = (checks: StatCheck[]): string => {
    return checks.map(check => 
      `${check.stat.charAt(0).toUpperCase() + check.stat.slice(1)} ${check.minimum}+`
    ).join(', ');
  };

  /**
   * Handle choice selection
   */
  const handleChoice = useCallback((index: number) => {
    if (!meetsStatRequirements(event.outcomes[index])) {
      return; // Can't select this choice
    }
    setSelectedChoice(index);

    // Clear any existing timer
    if (choiceTimerRef.current) {
      clearTimeout(choiceTimerRef.current);
    }

    // Brief delay for visual feedback with cleanup
    choiceTimerRef.current = setTimeout(() => {
      onChoice(index);
      onClose();
      choiceTimerRef.current = null;
    }, 200);
  }, [event.outcomes, onChoice, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Event Description */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Historical Context (if available) */}
          {event.historicalContext && (
            <div className="mb-6">
              <button
                onClick={useCallback(() => setShowHistoricalContext(prev => !prev), [])}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <span>📚</span>
                <span>Historical Context</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showHistoricalContext ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showHistoricalContext && (
                <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {event.historicalContext}
                  </p>
                  
                  {event.relatedSources && event.relatedSources.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Related sources:</span>
                      <ul className="mt-1">
                        {event.relatedSources.map((source, i) => (
                          <li key={i} className="text-blue-600 dark:text-blue-400">
                            • {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Choices */}
          <div className="space-y-3">
            {event.outcomes.map((outcome, index) => {
              const canSelect = meetsStatRequirements(outcome);
              const isSelected = selectedChoice === index;
              
              return (
                <button
                  key={index}
                  onClick={useCallback(() => handleChoice(index), [index])}
                  disabled={!canSelect}
                  className={`
                    w-full text-left p-4 rounded-lg border-2 transition-all
                    ${canSelect 
                      ? isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Choice icon/emoji */}
                    <span className="text-xl mt-0.5">
                      {getChoiceIcon(outcome.buttonText)}
                    </span>
                    
                    <div className="flex-1">
                      {/* Choice text */}
                      <div className="font-medium text-gray-900 dark:text-white">
                        {outcome.buttonText}
                      </div>
                      
                      {/* Stat requirements */}
                      {outcome.statChecks && outcome.statChecks.length > 0 && (
                        <div className={`text-sm mt-1 ${
                          canSelect 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Requires: {formatStatRequirements(outcome.statChecks)}
                        </div>
                      )}
                      
                      {/* Effects preview */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {outcome.effects.map((effect, i) => (
                          <span key={i}>
                            {formatEffect(effect)}
                            {i < outcome.effects.length - 1 && ', '}
                          </span>
                        ))}
                      </div>

                      {/* Historical note */}
                      {outcome.historicalNote && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                          ℹ️ {outcome.historicalNote}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {event.isLLMGenerated && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>✨</span>
              <span>Enhanced by WorldWeaver AI</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get an appropriate icon for a choice based on keywords
 */
function getChoiceIcon(buttonText: string): string {
  const text = buttonText.toLowerCase();
  
  if (text.includes('forage') || text.includes('gather')) return '🌾';
  if (text.includes('trade') || text.includes('barter')) return '🤝';
  if (text.includes('flee') || text.includes('run') || text.includes('escape')) return '🏃';
  if (text.includes('fight') || text.includes('attack')) return '⚔️';
  if (text.includes('negotiate') || text.includes('talk')) return '💬';
  if (text.includes('investigate') || text.includes('search')) return '🔍';
  if (text.includes('rest') || text.includes('sleep')) return '😴';
  if (text.includes('work') || text.includes('labor')) return '⚒️';
  if (text.includes('pay') || text.includes('money')) return '💰';
  if (text.includes('help') || text.includes('aid')) return '🤲';
  if (text.includes('hide') || text.includes('sneak')) return '🫥';
  if (text.includes('pray') || text.includes('religious')) return '🙏';
  
  return '▶️'; // Default
}

/**
 * Format an effect for display
 */
function formatEffect(effect: any): string {
  const sign = effect.value > 0 ? '+' : '';
  
  switch (effect.type) {
    case 'health':
      return `${sign}${effect.value} Health`;
    case 'fatigue':
      return `${sign}${effect.value} Fatigue`;
    case 'stat_change':
      return `${sign}${effect.value} ${effect.target}`;
    case 'item_add':
      return `Gain ${effect.target}`;
    case 'item_remove':
      return `Lose ${effect.target}`;
    case 'reputation':
      return `${sign}${effect.value} Reputation`;
    case 'location':
      return `Move to ${effect.target}`;
    case 'quest':
      return `New objective`;
    default:
      return effect.description || 'Unknown effect';
  }
}