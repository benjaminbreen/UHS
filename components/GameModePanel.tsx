import React from 'react';
import { X, Trophy, Target, Shield, Compass as CompassIcon, Coins, BookOpen, Crown, Home, Users, Scale } from 'lucide-react';
import { useEventSystem } from '../hooks/useEventSystem';

// Game mode configurations with icons and colors
const GAME_MODE_CONFIG = {
  survival: {
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-600/50',
    description: 'Face existential threats and survive against all odds'
  },
  exploration: {
    icon: CompassIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-600/50',
    description: 'Discover new lands and uncover hidden secrets'
  },
  commerce: {
    icon: Coins,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-600/50',
    description: 'Build wealth through trade and business ventures'
  },
  scholarship: {
    icon: BookOpen,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-600/50',
    description: 'Pursue knowledge and intellectual achievement'
  },
  leadership: {
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-600/50',
    description: 'Lead your people through challenges and crises'
  },
  livelihood: {
    icon: Home,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-600/50',
    description: 'Make an honest living and support your community'
  },
  diplomacy: {
    icon: Users,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20',
    borderColor: 'border-cyan-600/50',
    description: 'Navigate complex political relationships'
  },
  legal: {
    icon: Scale,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-900/20',
    borderColor: 'border-indigo-600/50',
    description: 'Uphold justice and navigate legal complexities'
  }
};

interface GameModePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameModePanel: React.FC<GameModePanelProps> = ({ isOpen, onClose }) => {
  const { currentMode } = useEventSystem();

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-4 z-[9999] p-4 bg-gradient-to-br from-slate-800 to-slate-900
      border border-slate-600 rounded-lg shadow-2xl w-80 animate-in slide-in-from-top-2 duration-200">
      {currentMode ? (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className={`text-sm font-semibold flex items-center gap-1.5
                ${GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG]?.color || 'text-amber-400'}`}>
                {GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG] ?
                  React.createElement(GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG].icon, { className: "w-4 h-4" }) :
                  <Trophy className="w-4 h-4" />
                }
                {currentMode.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {GAME_MODE_CONFIG[currentMode.id as keyof typeof GAME_MODE_CONFIG]?.description || currentMode.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-1">Victory Conditions:</h4>
              <ul className="space-y-1">
                {currentMode.victoryConditions.map((condition, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                    <Target className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{condition.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-sm text-slate-400">No game mode selected</p>
          <p className="text-xs text-slate-500 mt-2">Start a new game to select a mode</p>
        </div>
      )}
    </div>
  );
};
