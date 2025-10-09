/**
 * components/factory/FactoryWorkTab.tsx
 * Work tab for factory panel - shows active task and available tasks
 */

import React, { useState } from 'react';
import FactoryTaskCard from './FactoryTaskCard';
import { FactoryTask } from './FactoryTaskCard';
import FactoryTimingMinigameV2 from './FactoryTimingMinigameV2';
import { MinigameResult } from './minigameConstants';

interface FactoryWorkTabProps {
  activeTask: (FactoryTask & {
    progress: number;
    remainingSeconds: number;
    timedActionResult?: MinigameResult;
  }) | null;
  availableTasks: FactoryTask[];
  playerFatigue: number;
  factoryTypeId: string;
  onStartTask: (task: FactoryTask) => void;
  onPerformTimedAction: (result: MinigameResult) => void;
  // Phase 1 enhancements
  era?: string;
  culturalZone?: string;
  playerDexterity?: number;
}

export const FactoryWorkTab: React.FC<FactoryWorkTabProps> = ({
  activeTask,
  availableTasks,
  playerFatigue,
  factoryTypeId,
  onStartTask,
  onPerformTimedAction,
  era,
  culturalZone,
  playerDexterity
}) => {
  const [showMinigame, setShowMinigame] = useState(false);

  // Show minigame when timed action is needed
  const shouldShowMinigame = activeTask?.requiresTimedAction && !activeTask?.timedActionResult && showMinigame;

  return (
    <div className="space-y-6">
      {/* Timing Minigame Modal */}
      {shouldShowMinigame && activeTask && (
        <FactoryTimingMinigameV2
          task={activeTask}
          factoryTypeId={factoryTypeId}
          onComplete={(result: MinigameResult) => {
            setShowMinigame(false);
            onPerformTimedAction(result);
          }}
          era={era}
          culturalZone={culturalZone}
          playerDexterity={playerDexterity}
          playerFatigue={playerFatigue}
        />
      )}

      {/* Active Task Display */}
      {activeTask && (
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-5 border-2 border-blue-500/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{activeTask.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-blue-300">{activeTask.name}</h3>
                <p className="text-sm text-slate-400">{activeTask.description}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {Math.floor(activeTask.remainingSeconds / 60)}:{(activeTask.remainingSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400">Time Remaining</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${activeTask.progress}%` }}
            />
          </div>

          {/* Timed action button (if applicable) - launches minigame */}
          {activeTask.requiresTimedAction && !activeTask.timedActionResult && (
            <button
              onClick={() => setShowMinigame(true)}
              className="mt-4 w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all animate-pulse shadow-lg"
            >
              ⚡ START TIMING CHALLENGE!
            </button>
          )}

          {activeTask.timedActionResult && (
            <div className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 text-emerald-300 font-bold rounded-lg text-center border border-emerald-700/40">
              ✓ Challenge Complete! ({activeTask.timedActionResult.toUpperCase()})
            </div>
          )}

          {/* Task Stats */}
          <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <div className="text-slate-400">Duration</div>
              <div className="text-white font-bold mt-1">{activeTask.duration} min</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <div className="text-slate-400">Output</div>
              <div className="text-amber-400 font-bold mt-1">+{activeTask.outputValue}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <div className="text-slate-400">Fatigue</div>
              <div className="text-purple-400 font-bold mt-1">+{activeTask.fatigueIncrease}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 text-center">
              <div className="text-slate-400">Risk</div>
              <div className="text-red-400 font-bold mt-1">{(activeTask.injuryRisk * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Tasks Grid */}
      {!activeTask && (
        <>
          {playerFatigue > 80 && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 text-amber-300 text-sm">
              ⚠️ You're extremely fatigued. Consider taking a break or continuing at reduced efficiency.
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-amber-300 mb-4">Available Tasks</h2>
            <p className="text-slate-400 text-sm mb-6">
              Select a task to begin working. Tasks with ⚡ require timing skills for maximum output.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {availableTasks.map(task => (
              <FactoryTaskCard
                key={task.id}
                task={task}
                disabled={activeTask !== null}
                onClick={() => onStartTask(task)}
              />
            ))}
          </div>
        </>
      )}

      {/* Rest option (if too fatigued) */}
      {!activeTask && playerFatigue > 70 && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-bold text-blue-300 mb-2">Take a Break?</h3>
          <p className="text-slate-400 text-sm mb-4">
            Your fatigue is high. Taking an unofficial break might help, but the overseer might notice...
          </p>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            Rest for 5 minutes
          </button>
        </div>
      )}
    </div>
  );
};

export default FactoryWorkTab;
