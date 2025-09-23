/**
 * Game Mode Selector Component
 * Allows players to choose their game mode
 */

import React, { memo, useState, useCallback } from 'react';
import { 
  Shield, 
  Compass, 
  TrendingUp, 
  BookOpen, 
  Crown, 
  Hammer, 
  Handshake, 
  Scale,
  ChevronDown,
  Info
} from 'lucide-react';
import { GameMode } from '../types/eventTypes';
import { GAME_MODES } from '../constants/gameData/gameModes';

interface GameModeSelectorProps {
  currentMode: GameMode | null;
  onModeSelect: (mode: GameMode) => void;
  compact?: boolean;
}

export const GameModeSelector = memo(({ 
  currentMode, 
  onModeSelect,
  compact = false 
}: GameModeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const getModeIcon = (modeId: string) => {
    switch(modeId) {
      case 'survival': return <Shield className="w-4 h-4" />;
      case 'exploration': return <Compass className="w-4 h-4" />;
      case 'commerce': return <TrendingUp className="w-4 h-4" />;
      case 'scholarship': return <BookOpen className="w-4 h-4" />;
      case 'leadership': return <Crown className="w-4 h-4" />;
      case 'livelihood': return <Hammer className="w-4 h-4" />;
      case 'diplomacy': return <Handshake className="w-4 h-4" />;
      case 'legal': return <Scale className="w-4 h-4" />;
      default: return null;
    }
  };

  const getModeColor = (modeId: string) => {
    switch(modeId) {
      case 'survival': return 'from-red-500 to-orange-500';
      case 'exploration': return 'from-blue-500 to-cyan-500';
      case 'commerce': return 'from-yellow-500 to-amber-500';
      case 'scholarship': return 'from-purple-500 to-indigo-500';
      case 'leadership': return 'from-emerald-500 to-green-500';
      case 'livelihood': return 'from-gray-500 to-slate-500';
      case 'diplomacy': return 'from-pink-500 to-rose-500';
      case 'legal': return 'from-indigo-500 to-purple-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (compact) {
    // Compact version for sidebar
    return (
      <div className="relative">
        <button
          onClick={useCallback(() => setIsOpen(prev => !prev), [])}
          className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg
                     text-white text-sm font-medium
                     flex items-center justify-between
                     transition-colors duration-200"
        >
          <div className="flex items-center gap-2">
            {currentMode && getModeIcon(currentMode.id)}
            <span>{currentMode?.name || 'Select Mode'}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50
                          bg-slate-800 rounded-lg shadow-xl border border-slate-600
                          overflow-hidden">
            {GAME_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={useCallback(() => {
                  onModeSelect(mode);
                  setIsOpen(false);
                }, [mode, onModeSelect])}
                className={`w-full px-3 py-2 text-left text-sm
                           hover:bg-slate-700 transition-colors
                           ${currentMode?.id === mode.id ? 'bg-slate-700' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {getModeIcon(mode.id)}
                  <span className="text-white">{mode.name}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 pl-6">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full version for modal
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Choose Your Path
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {GAME_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={useCallback(() => onModeSelect(mode), [mode, onModeSelect])}
            onMouseEnter={useCallback(() => setHoveredMode(mode.id), [mode.id])}
            onMouseLeave={useCallback(() => setHoveredMode(null), [])}
            className={`
              relative p-4 rounded-lg
              bg-gradient-to-br ${getModeColor(mode.id)}
              ${currentMode?.id === mode.id 
                ? 'ring-2 ring-white shadow-lg scale-105' 
                : 'hover:scale-105 opacity-90 hover:opacity-100'
              }
              transition-all duration-200
              text-white
            `}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {getModeIcon(mode.id)}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-sm">{mode.name}</h4>
                <p className="text-xs opacity-90 mt-1">
                  {mode.description}
                </p>
              </div>
            </div>

            {currentMode?.id === mode.id && (
              <div className="absolute top-2 right-2 
                              bg-white text-black text-xs font-bold 
                              px-2 py-1 rounded">
                Active
              </div>
            )}
          </button>
        ))}
      </div>

      {hoveredMode && (
        <div className="p-3 bg-slate-700 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">
            Victory Conditions:
          </h4>
          <ul className="space-y-1">
            {GAME_MODES.find(m => m.id === hoveredMode)?.victoryConditions.map((condition, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                {condition.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
        <Info className="w-4 h-4 text-blue-400 mt-0.5" />
        <p className="text-xs text-blue-300">
          Your game mode determines what types of events you'll encounter and how you win. 
          You can change modes at any time, but victory progress will reset.
        </p>
      </div>
    </div>
  );
});

GameModeSelector.displayName = 'GameModeSelector';

/**
 * Floating Mode Button - Shows current mode and allows quick access
 */
export const FloatingModeButton = memo(({ 
  currentMode, 
  onClick 
}: { 
  currentMode: GameMode | null;
  onClick: () => void;
}) => {
  if (!currentMode) return null;

  const getModeIcon = (modeId: string) => {
    switch(modeId) {
      case 'survival': return <Shield className="w-5 h-5" />;
      case 'exploration': return <Compass className="w-5 h-5" />;
      case 'commerce': return <TrendingUp className="w-5 h-5" />;
      case 'scholarship': return <BookOpen className="w-5 h-5" />;
      case 'leadership': return <Crown className="w-5 h-5" />;
      case 'livelihood': return <Hammer className="w-5 h-5" />;
      case 'diplomacy': return <Handshake className="w-5 h-5" />;
      case 'legal': return <Scale className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-4 z-30
                 bg-slate-800/90 backdrop-blur-sm
                 hover:bg-slate-700/90
                 text-white rounded-full
                 px-4 py-2
                 shadow-lg hover:shadow-xl
                 transform hover:scale-105
                 transition-all duration-200
                 flex items-center gap-2
                 border border-slate-600"
      title={`Current mode: ${currentMode.name}`}
    >
      {getModeIcon(currentMode.id)}
      <span className="text-sm font-medium hidden sm:inline">
        {currentMode.name}
      </span>
    </button>
  );
});

FloatingModeButton.displayName = 'FloatingModeButton';