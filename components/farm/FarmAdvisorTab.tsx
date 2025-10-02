/**
 * components/farm/FarmAdvisorTab.tsx
 * Advisor tab for historical summaries and advice
 */

import React from 'react';
import { MapData, Season } from '../../types';
import { FarmState } from '../../services/farmService';
import { ScrollText, Brain, MessageSquare, CalendarClock } from 'lucide-react';

interface FarmAdvisorTabProps {
  llmHooks: any;
  farmState: FarmState;
  mapData: MapData;
  season: Season;
  year: number;
  useLlm: boolean;
}

export const FarmAdvisorTab: React.FC<FarmAdvisorTabProps> = ({
  llmHooks,
  mapData,
  season,
  year,
  useLlm,
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-amber-400 font-bold flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Farm Advisor
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CalendarClock className="w-4 h-4" />
            {season} {year} • {mapData.localArea || mapData.continent}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <button
            onClick={llmHooks.runAdvisorSummary}
            disabled={!useLlm}
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs border border-slate-700 disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {llmHooks.isAdvisorBusy ? 'Working…' : 'Get Historical Summary'}
          </button>
          {llmHooks.advisorSummary && (
            <div className="mt-3 text-sm text-slate-200 bg-slate-950/70 border border-slate-800 rounded p-3">
              {llmHooks.advisorSummary}
            </div>
          )}
        </div>

        {/* Advisor chat */}
        <div>
          <div className="text-xs text-slate-400 mb-2">
            Ask the village elder for advice about farming, politics, dangers, or trade.
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={llmHooks.advisorChat}
              onChange={(e) => llmHooks.setAdvisorChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && llmHooks.runAdvisorChat()}
              placeholder="e.g., 'Which crop should I plant before winter?'"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              disabled={!useLlm || llmHooks.isAdvisorBusy}
            />
            <button
              onClick={llmHooks.runAdvisorChat}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50"
              disabled={!useLlm || llmHooks.isAdvisorBusy || !llmHooks.advisorChat.trim()}
            >
              <MessageSquare className="w-4 h-4" />
              Ask
            </button>
          </div>
          {llmHooks.advisorLog.length > 0 && (
            <div className="space-y-2">
              {llmHooks.advisorLog.map((line: string, i: number) => (
                <div
                  key={i}
                  className={`text-sm ${
                    line.startsWith('You:') ? 'text-slate-300' : 'text-emerald-200'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
          {!useLlm && (
            <div className="mt-2 text-xs text-slate-400">
              LLM is disabled. Enable it to chat with the advisor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmAdvisorTab;
