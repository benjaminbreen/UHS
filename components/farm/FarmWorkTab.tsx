/**
 * components/farm/FarmWorkTab.tsx
 * Text-based farm work adventure tab with LLM simulation
 *
 * Features:
 * - Collapsible field visualization sidebar
 * - Available crops/tools display based on season
 * - Recent action log with time tracking
 * - Scrolling conversation history (player + narrator)
 * - Natural language command input
 * - Real-time field updates from LLM state changes
 */

import React, { useState } from 'react';
import { Season } from '../../types';
import { FarmState, FarmFamilyMember } from '../../services/farmService';
import { CROP_EMOJIS } from './types';
import {
  Sprout,
  Droplets,
  Pickaxe,
  Wheat,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FarmWorkTabProps {
  farmState: FarmState;
  headFarmer: FarmFamilyMember | null;
  llmHooks: {
    farmWorkHistory: Array<{ type: 'player' | 'narrator'; text: string }>;
    farmWorkInput: string;
    setFarmWorkInput: (input: string) => void;
    isFarmWorkProcessing: boolean;
    hoursWorkedToday: number;
    farmActionLog: Array<{ action: string; timeElapsed: number }>;
    handleFarmWorkCommand: (command: string) => Promise<void>;
  };
  fieldHooks: {
    validCrops: string[];
  };
  season: Season;
  useLlm: boolean;
}

export const FarmWorkTab: React.FC<FarmWorkTabProps> = ({
  farmState,
  llmHooks,
  fieldHooks,
  season,
  useLlm,
}) => {
  const [isFieldsCollapsed, setIsFieldsCollapsed] = useState(false);

  const {
    farmWorkHistory,
    farmWorkInput,
    setFarmWorkInput,
    isFarmWorkProcessing,
    hoursWorkedToday,
    farmActionLog,
    handleFarmWorkCommand,
  } = llmHooks;

  const { validCrops } = fieldHooks;

  return (
    <div className="animate-fadeIn flex gap-4 h-full">
      {/* Left Sidebar - Field Status & Action Log */}
      <div className="w-64 flex flex-col gap-4">
        {/* Compact Field Display */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden">
          <button
            onClick={() => setIsFieldsCollapsed(!isFieldsCollapsed)}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors"
          >
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              Fields
            </h4>
            {isFieldsCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {!isFieldsCollapsed && (
            <div className="p-3 pt-0">
              <div className="grid grid-cols-2 gap-2">
                {farmState.fields.slice(0, 8).map((field, idx) => {
                  const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
                  const healthColor = field.health > 70 ? 'text-green-400' :
                                     field.health > 40 ? 'text-yellow-400' :
                                     'text-red-400';
                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/40 rounded p-2 text-center border border-slate-700/40"
                    >
                      <div className="text-2xl mb-1">{cropEmoji}</div>
                      <div className="text-[9px] text-slate-500">Field {idx + 1}</div>
                      <div className={`text-[9px] font-medium ${healthColor}`}>
                        {field.crop ? `${field.health}%` : 'Empty'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Available Resources (Crops in Spring/Winter, Tools in Summer/Fall) */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
          <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">
            {season === 'Spring' || season === 'Winter' ? 'Available Crops' : 'Available Tools'}
          </h4>
          <div className="space-y-1">
            {season === 'Spring' || season === 'Winter' ? (
              // Show crop counts
              validCrops.slice(0, 6).map((crop) => {
                const emoji = CROP_EMOJIS[crop] || '🌱';
                return (
                  <div key={crop} className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <span>{emoji}</span>
                      <span className="capitalize">{crop}</span>
                    </span>
                    <span className="text-slate-500">Available</span>
                  </div>
                );
              })
            ) : (
              // Show tools for tending fields in Summer/Fall
              <>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    <span>Water bucket</span>
                  </span>
                  <span className="text-slate-500">Ready</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Pickaxe className="w-3 h-3" />
                    <span>Hoe</span>
                  </span>
                  <span className="text-slate-500">Ready</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Wheat className="w-3 h-3" />
                    <span>Scythe</span>
                  </span>
                  <span className="text-slate-500">Ready</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Log */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60 flex-1">
          <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">
            Recent Actions
          </h4>
          <div className="space-y-2">
            {farmActionLog.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic">No actions yet today</div>
            ) : (
              farmActionLog.map((log, idx) => (
                <div key={idx} className="text-[10px] text-slate-400 pb-2 border-b border-slate-800/40 last:border-0">
                  <div className="italic mb-1">"{log.action}"</div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {log.timeElapsed.toFixed(1)}h
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60 mb-4">
          <h3 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            A Day's Farm Work
          </h3>
          <p className="text-xs text-slate-400">
            Enter commands to work the farm. Be specific! ({hoursWorkedToday.toFixed(1)} hours worked today)
          </p>
        </div>

        {/* Conversation History */}
        <div className="flex-1 bg-slate-900/30 rounded-xl p-4 border border-slate-800/60 overflow-y-auto mb-4 space-y-3">
          {farmWorkHistory.map((entry, i) => (
            <div
              key={i}
              className={`${
                entry.type === 'player'
                  ? 'bg-blue-900/30 border-blue-700/40 ml-8'
                  : 'bg-slate-800/40 border-slate-700/40 mr-8'
              } p-3 rounded-lg border`}
            >
              <div className="text-xs text-slate-500 mb-1">
                {entry.type === 'player' ? 'You' : 'Narrator'}
              </div>
              <div className="text-sm text-slate-200">{entry.text}</div>
            </div>
          ))}
          {isFarmWorkProcessing && (
            <div className="bg-slate-800/40 border-slate-700/40 mr-8 p-3 rounded-lg border">
              <div className="text-xs text-slate-500 mb-1">Narrator</div>
              <div className="text-sm text-slate-400 italic">Considering your actions...</div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (farmWorkInput.trim() && !isFarmWorkProcessing) {
                handleFarmWorkCommand(farmWorkInput);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={farmWorkInput}
              onChange={(e) => setFarmWorkInput(e.target.value)}
              disabled={isFarmWorkProcessing || !useLlm}
              placeholder={useLlm ? "What do you do? (e.g., 'plant wheat in field 1 carefully')" : "LLM disabled"}
              className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              disabled={isFarmWorkProcessing || !useLlm || !farmWorkInput.trim()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {isFarmWorkProcessing ? 'Working...' : 'Do It'}
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-500">
            Tip: Be detailed for better results. Commands like "carefully plant wheat seeds 2 inches deep in field 1, then water gently" work better than just "plant wheat"
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmWorkTab;
