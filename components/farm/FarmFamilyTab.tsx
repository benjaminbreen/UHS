/**
 * components/farm/FarmFamilyTab.tsx
 * Family members tab
 */

import React from 'react';
import { FarmState } from '../../services/farmService';
import { ProceduralPortrait } from '../portraits';

interface FarmFamilyTabProps {
  farmState: FarmState;
  llmHooks: any;
  combatHooks: any;
  useLlm: boolean;
}

export const FarmFamilyTab: React.FC<FarmFamilyTabProps> = ({
  farmState,
  llmHooks,
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      <h3 className="text-xl font-semibold text-amber-400">Family Members</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farmState.family.members.map((member) => {
          const healthPct = (member.health / Math.max(1, member.maxHealth)) * 100;
          const energyPct = ((member.maxFatigue - member.fatigue) / Math.max(1, member.maxFatigue)) * 100;

          return (
            <button
              key={member.id}
              onClick={() => llmHooks.setSelectedMember(member)}
              className={`text-left bg-slate-900/60 rounded-xl p-4 border transition-all hover:shadow-lg ${
                llmHooks.selectedMember?.id === member.id
                  ? 'border-amber-400 shadow-amber-900/20 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-700">
                  <ProceduralPortrait
                    character={{
                      ...member,
                      stats: {
                        strength: 10,
                        intelligence: 10,
                        charisma: 10,
                        constitution: 10,
                      },
                      appearance: member.appearance,
                    } as any}
                    size={96}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-bold">{member.name}</h4>
                    <div className="text-xs text-slate-400">
                      {member.age} yrs • {member.role}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Health</span>
                      <span>{member.health}/{member.maxHealth}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                        style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Energy</span>
                      <span>{member.maxFatigue - member.fatigue}/{member.maxFatigue}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
                        style={{ width: `${Math.max(0, Math.min(100, energyPct))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {llmHooks.selectedMember && (
        <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700">
          <h4 className="text-lg font-semibold text-amber-400 mb-3">
            Chat with {llmHooks.selectedMember.name}
          </h4>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {llmHooks.chatHistory.map((entry: any, i: number) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  entry.speaker === 'player'
                    ? 'bg-blue-900/20 ml-8'
                    : 'bg-slate-700/40 mr-8'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {entry.speaker === 'player' ? 'You' : llmHooks.selectedMember.name}
                </div>
                <div className="text-sm text-slate-200">{entry.text}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={llmHooks.chatInput}
              onChange={(e) => llmHooks.setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && llmHooks.handleFarmerChat()}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              disabled={llmHooks.isChatting}
            />
            <button
              onClick={llmHooks.handleFarmerChat}
              disabled={llmHooks.isChatting || !llmHooks.chatInput.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmFamilyTab;
