/**
 * components/farm/FarmFamilyTab.tsx
 * Family members tab - View family members and chat with them
 */

import React from 'react';
import { FarmState } from '../../services/farmService';
import { ProceduralPortrait } from '../portraits';
import { Heart, Zap, User, MessageCircle, Send, Sparkles } from 'lucide-react';

interface FarmFamilyTabProps {
  farmState: FarmState;
  llmHooks: any;
  combatHooks: any;
  useLlm: boolean;
  highlightedMemberId?: string | null;
}

export const FarmFamilyTab: React.FC<FarmFamilyTabProps> = ({
  farmState,
  llmHooks,
  highlightedMemberId,
  useLlm,
}) => {
  return (
    <div className="animate-fadeIn flex gap-6 h-full">
      {/* Left Side - Family Members Grid */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-amber-400 flex items-center gap-3">
            <User className="w-7 h-7" />
            Household Members
          </h3>
          <div className="text-sm text-slate-400">
            {farmState.family.members.length} {farmState.family.members.length === 1 ? 'member' : 'members'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {farmState.family.members.map((member) => {
            const healthPct = (member.health / Math.max(1, member.maxHealth)) * 100;
            const energyPct = ((member.maxFatigue - member.fatigue) / Math.max(1, member.maxFatigue)) * 100;

            const isHighlighted = highlightedMemberId === member.id;
            const isSelected = llmHooks.selectedMember?.id === member.id;

            // Status badge color based on health
            const statusColor = healthPct > 80 ? 'text-green-400' : healthPct > 50 ? 'text-yellow-400' : 'text-red-400';

            return (
              <button
                key={member.id}
                onClick={() => llmHooks.setSelectedMember(member)}
                className={`text-left bg-gradient-to-br rounded-xl p-5 border-2 transition-all duration-200 hover:shadow-xl ${
                  isSelected
                    ? 'from-amber-900/40 to-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-900/30 scale-[1.02]'
                    : 'from-slate-800/60 to-slate-900/60 border-slate-700/50 hover:border-slate-600/50'
                } ${
                  isHighlighted
                    ? 'ring-2 ring-yellow-400 border-yellow-400 animate-pulse'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Portrait */}
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-700/50 ring-2 ring-slate-600/50 flex-shrink-0">
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
                      size={112}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name and Age */}
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white leading-tight">{member.name}</h4>
                      <div className="text-sm text-slate-400 flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className={statusColor}>●</span>
                        {member.age}y
                      </div>
                    </div>

                    {/* Role and Relationship */}
                    <div className="flex items-center gap-2 text-sm mb-3">
                      {member.relationshipToHead && (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-600/40 rounded-lg font-medium">
                          {member.relationshipToHead}
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 border border-slate-600/40 rounded-lg">
                        {member.role}
                      </span>
                    </div>

                    {/* Health Bar */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-medium">Health</span>
                        </div>
                        <span className="font-semibold">{member.health}/{member.maxHealth}</span>
                      </div>
                      <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }}
                        />
                      </div>
                    </div>

                    {/* Energy Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-sky-400" />
                          <span className="font-medium">Energy</span>
                        </div>
                        <span className="font-semibold">{member.maxFatigue - member.fatigue}/{member.maxFatigue}</span>
                      </div>
                      <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, energyPct))}%` }}
                        />
                      </div>
                    </div>

                    {/* Chat Indicator */}
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 font-medium">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chatting with {member.name} →</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side - Chat Panel */}
      {llmHooks.selectedMember && (
        <div className="w-96 flex-shrink-0 flex flex-col bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Chat Header */}
          <div className="p-5 border-b border-slate-700/50 bg-slate-900/70">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-amber-300">
                  Chat with {llmHooks.selectedMember.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {llmHooks.selectedMember.role} • {llmHooks.selectedMember.age} years old
                </p>
              </div>
            </div>
            {!useLlm && (
              <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-600/40 rounded-lg text-xs text-red-300">
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                LLM disabled - Enable in settings to chat
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {llmHooks.chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-base font-medium text-slate-400 mb-2">Start a Conversation</div>
                <div className="text-sm text-slate-500 max-w-xs">
                  Ask {llmHooks.selectedMember.name} about their day, the farm, or anything else.
                </div>
              </div>
            ) : (
              llmHooks.chatHistory.map((entry: any, i: number) => (
                <div
                  key={i}
                  className={`flex ${entry.speaker === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 ${
                      entry.speaker === 'player'
                        ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80 text-white'
                        : entry.speaker === 'system'
                        ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                        : 'bg-gradient-to-br from-slate-700/60 to-slate-800/60 text-slate-200 border border-slate-600/50'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1.5 opacity-75">
                      {entry.speaker === 'player' ? 'You' : entry.speaker === 'system' ? 'System' : llmHooks.selectedMember.name}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {typeof entry.text === 'string' ? entry.text : entry.text?.text || JSON.stringify(entry.text)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {llmHooks.isChatting && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 rounded-xl p-3 border border-slate-600/50">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="italic">{llmHooks.selectedMember.name} is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/70">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!llmHooks.isChatting && llmHooks.chatInput.trim() && useLlm) {
                  llmHooks.handleFarmerChat();
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={llmHooks.chatInput}
                onChange={(e) => llmHooks.setChatInput(e.target.value)}
                placeholder={useLlm ? "Type your message..." : "LLM disabled"}
                disabled={llmHooks.isChatting || !useLlm}
                className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-4 py-2.5 text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={llmHooks.isChatting || !llmHooks.chatInput.trim() || !useLlm}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
            <div className="mt-2 text-xs text-slate-500">
              Conversations are tracked. NPCs remember your last 10 exchanges.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmFamilyTab;
