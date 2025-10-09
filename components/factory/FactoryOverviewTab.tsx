/**
 * components/factory/FactoryOverviewTab.tsx
 * Overview tab for factory panel - shows factory info and shift summary
 */

import React from 'react';
import { Clock, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { FactoryType } from '../../constants/gameData/factoryTypes';
import { FactoryContract } from './FactoryLaborPanel';

interface FactoryOverviewTabProps {
  factoryType: FactoryType;
  factoryName: string;
  contract: FactoryContract | null;
  elapsedMinutes: number;
  wagesEarned: number;
  outputProgress: number;
  eventLog: Array<{ type: string; message: string }>;
  taskHistory: Array<{ action: string; timeElapsed: number }>;
}

export const FactoryOverviewTab: React.FC<FactoryOverviewTabProps> = ({
  factoryType,
  factoryName,
  contract,
  elapsedMinutes,
  wagesEarned,
  outputProgress,
  eventLog,
  taskHistory
}) => {
  const quotaPercent = contract ? (outputProgress / contract.quotaRequired) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Factory Info Card */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-300 mb-2">{factoryName}</h2>
            <p className="text-slate-400 text-sm mb-4">{factoryType.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">Type: <span className="text-white">{factoryType.name}</span></span>
              <span className="text-slate-500">Era: <span className="text-white">{factoryType.era}</span></span>
              <span className="text-slate-500">Industry: <span className="text-white">{factoryType.industry}</span></span>
            </div>
          </div>
          <div className="text-6xl opacity-50">{factoryType.icon}</div>
        </div>
      </div>

      {/* Shift Progress Summary */}
      {contract && (
        <div className="grid grid-cols-3 gap-4">
          {/* Time Card */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-5 border border-blue-500/30">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-blue-400" />
              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Time Worked</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
            </div>
            <div className="text-sm text-slate-400">
              of {contract.shiftLength}h shift
            </div>
            <div className="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                style={{ width: `${(elapsedMinutes / (contract.shiftLength * 60)) * 100}%` }}
              />
            </div>
          </div>

          {/* Wages Card */}
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-5 border border-green-500/30">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h3 className="text-sm font-bold text-green-300 uppercase tracking-wider">Wages Earned</h3>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">
              ${wagesEarned.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">
              Rate: ${contract.hourlyWage.toFixed(2)}/hour
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Projected: ${(contract.hourlyWage * contract.shiftLength).toFixed(2)}
            </div>
          </div>

          {/* Output/Quota Card */}
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl p-5 border border-amber-500/30">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Output Progress</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {outputProgress} <span className="text-xl text-slate-400">/ {contract.quotaRequired}</span>
            </div>
            <div className="text-sm text-slate-400">
              {quotaPercent.toFixed(0)}% of quota
            </div>
            <div className="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  quotaPercent >= 100
                    ? 'bg-gradient-to-r from-green-600 to-green-400'
                    : quotaPercent >= 80
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task History */}
      {taskHistory.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4">Tasks Completed</h3>
          <div className="space-y-2">
            {taskHistory.slice(-10).reverse().map((task, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{task.action}</span>
                <span className="text-slate-500">{task.timeElapsed} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {eventLog.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Events</h3>
          <div className="space-y-2">
            {eventLog.slice(-8).reverse().map((event, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-lg text-sm ${
                  event.type === 'success'
                    ? 'bg-green-900/20 border border-green-700/30 text-green-300'
                    : event.type === 'warning'
                    ? 'bg-amber-900/20 border border-amber-700/30 text-amber-300'
                    : event.type === 'danger'
                    ? 'bg-red-900/20 border border-red-700/30 text-red-300'
                    : 'bg-slate-800/40 border border-slate-700/30 text-slate-300'
                }`}
              >
                {event.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryOverviewTab;
