/**
 * components/factory/FactoryEventModal.tsx
 * Modal for timed/random factory events requiring quick decisions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

export interface FactoryEvent {
  id: string;
  type: 'timed' | 'choice' | 'button_mash';
  title: string;
  description: string;
  icon: string;
  timeLimit?: number; // seconds for timed events
  choices?: Array<{
    id: string;
    text: string;
    effects: {
      health?: number;
      fatigue?: number;
      output?: number;
      wages?: number;
      coworkerRelation?: number;
    };
  }>;
  buttonMashTarget?: number; // number of clicks needed
}

interface FactoryEventModalProps {
  event: FactoryEvent;
  onChoiceMade: (choiceId: string) => void;
}

export const FactoryEventModal: React.FC<FactoryEventModalProps> = ({
  event,
  onChoiceMade
}) => {
  const [timeRemaining, setTimeRemaining] = useState(event.timeLimit || 10);
  const [buttonMashCount, setButtonMashCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer for timed events
  useEffect(() => {
    if (event.type === 'timed' && !isComplete) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up! Auto-fail
            setTimeout(() => onChoiceMade('timeout'), 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [event.type, isComplete, onChoiceMade]);

  // Button mash handling
  const handleButtonMash = () => {
    if (event.type === 'button_mash' && event.buttonMashTarget) {
      const newCount = buttonMashCount + 1;
      setButtonMashCount(newCount);

      if (newCount >= event.buttonMashTarget) {
        setIsComplete(true);
        setTimeout(() => onChoiceMade('success'), 200);
      }
    }
  };

  // Handle keyboard for button mash
  useEffect(() => {
    if (event.type === 'button_mash') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !isComplete) {
          e.preventDefault();
          handleButtonMash();
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [event.type, isComplete, buttonMashCount]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-red-500/60 shadow-2xl w-full max-w-xl mx-4 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/60 to-red-800/60 px-6 py-4 border-b border-red-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{event.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-red-300 flex items-center gap-2">
                {event.title}
                {event.type === 'timed' && <Clock className="w-5 h-5 animate-pulse" />}
                {event.type === 'button_mash' && <Zap className="w-5 h-5" />}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">Factory Emergency Event</p>
            </div>
          </div>

          {/* Timer */}
          {event.type === 'timed' && (
            <div className={`text-3xl font-bold ${timeRemaining <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeRemaining}s
            </div>
          )}

          {/* Button mash progress */}
          {event.type === 'button_mash' && event.buttonMashTarget && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {buttonMashCount}/{event.buttonMashTarget}
              </div>
              <div className="text-xs text-slate-400">clicks</div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-6 py-5">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-5">
            <p className="text-slate-200 leading-relaxed">{event.description}</p>
          </div>

          {/* Button Mash Interface */}
          {event.type === 'button_mash' && !isComplete && (
            <button
              onClick={handleButtonMash}
              className="w-full py-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-2xl font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/50 animate-pulse"
            >
              <Zap className="w-8 h-8 inline mb-1" />
              <br />
              CLICK FAST!
              <br />
              <span className="text-sm opacity-75">(or press SPACE)</span>
            </button>
          )}

          {/* Choice Buttons */}
          {event.type === 'choice' && event.choices && (
            <div className="space-y-3">
              {event.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => onChoiceMade(choice.id)}
                  className="w-full text-left px-5 py-4 bg-slate-700/50 hover:bg-slate-600/70 border-2 border-slate-600/50 hover:border-amber-500/60 rounded-xl transition-all group"
                >
                  <div className="text-white font-semibold mb-2 group-hover:text-amber-300 transition-colors">
                    {choice.text}
                  </div>

                  {/* Effects Preview */}
                  <div className="flex gap-3 text-xs">
                    {choice.effects.health && (
                      <span className={choice.effects.health > 0 ? 'text-green-400' : 'text-red-400'}>
                        ❤️ {choice.effects.health > 0 ? '+' : ''}{choice.effects.health}
                      </span>
                    )}
                    {choice.effects.fatigue && (
                      <span className={choice.effects.fatigue < 0 ? 'text-green-400' : 'text-purple-400'}>
                        😴 {choice.effects.fatigue > 0 ? '+' : ''}{choice.effects.fatigue}
                      </span>
                    )}
                    {choice.effects.output && (
                      <span className={choice.effects.output > 0 ? 'text-amber-400' : 'text-red-400'}>
                        📦 {choice.effects.output > 0 ? '+' : ''}{choice.effects.output}
                      </span>
                    )}
                    {choice.effects.wages && (
                      <span className={choice.effects.wages > 0 ? 'text-green-400' : 'text-red-400'}>
                        💰 {choice.effects.wages > 0 ? '+' : ''}${choice.effects.wages.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Timed Event Choices */}
          {event.type === 'timed' && event.choices && (
            <div className="space-y-3">
              {event.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => onChoiceMade(choice.id)}
                  className="w-full text-left px-5 py-4 bg-red-700/30 hover:bg-red-600/50 border-2 border-red-600/50 hover:border-red-500/80 rounded-xl transition-all group text-white font-semibold text-lg shadow-lg"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {/* Warning for timed events */}
          {event.type === 'timed' && timeRemaining <= 5 && (
            <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-lg p-3 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300 font-semibold">
                Make a decision quickly! Time is running out!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactoryEventModal;
