/**
 * components/factory/FactoryTaskCard.tsx
 * Individual task card for factory work (like farm work cards)
 */

import React from 'react';
import { Clock, Zap, AlertTriangle, TrendingUp } from 'lucide-react';

export interface FactoryTask {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // minutes
  outputValue: number; // units toward quota
  fatigueIncrease: number;
  injuryRisk: number; // 0-1
  requiresTimedAction?: boolean; // Does it need button press?
  skillCheck?: {
    attribute: 'strength' | 'dexterity' | 'intelligence';
    difficulty: number;
  };
}

interface FactoryTaskCardProps {
  task: FactoryTask;
  disabled: boolean;
  onClick: () => void;
}

export const FactoryTaskCard: React.FC<FactoryTaskCardProps> = ({
  task,
  disabled,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4
        border-2 transition-all text-left
        ${
          disabled
            ? 'border-slate-700/30 opacity-50 cursor-not-allowed'
            : 'border-slate-600/30 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 cursor-pointer'
        }
      `}
    >
      {/* Icon */}
      <div className="text-4xl mb-2 text-center">{task.icon}</div>

      {/* Name */}
      <h3 className="text-md font-bold text-white mb-1 text-center group-hover:text-amber-300 transition-colors">
        {task.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-3 text-center leading-tight">
        {task.description}
      </p>

      {/* Stats */}
      <div className="space-y-1.5 text-xs">
        {/* Duration */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Time:</span>
          </span>
          <span className="text-white font-semibold">{task.duration} min</span>
        </div>

        {/* Output */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <TrendingUp className="w-3 h-3" />
            <span>Output:</span>
          </span>
          <span className="text-amber-400 font-semibold">+{task.outputValue}</span>
        </div>

        {/* Fatigue */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <Zap className="w-3 h-3" />
            <span>Fatigue:</span>
          </span>
          <span className="text-purple-400 font-semibold">+{task.fatigueIncrease}</span>
        </div>

        {/* Injury Risk */}
        {task.injuryRisk > 0.05 && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Risk:</span>
            </span>
            <span className={`font-semibold ${task.injuryRisk > 0.15 ? 'text-red-400' : 'text-yellow-400'}`}>
              {task.injuryRisk > 0.15 ? 'High' : 'Moderate'}
            </span>
          </div>
        )}
      </div>

      {/* Special badges */}
      <div className="mt-3 flex gap-1 flex-wrap">
        {task.requiresTimedAction && (
          <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 rounded text-xs font-bold border border-green-400/50 shadow-lg shadow-green-500/20 animate-pulse">
            ⚡ TIMING CHALLENGE
          </span>
        )}

        {task.skillCheck && (
          <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs font-bold border border-blue-500/30">
            💪 SKILL
          </span>
        )}
      </div>

      {/* Hover glow effect */}
      {!disabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:to-amber-500/5 transition-all pointer-events-none" />
      )}
    </button>
  );
};

export default FactoryTaskCard;
