/**
 * components/farm/FarmAdvisorTab.tsx
 * Advisor tab - Farming guide and AI advisor chat
 */

import React, { useState, useMemo } from 'react';
import { MapData, Season } from '../../types';
import { FarmState } from '../../services/farmService';
import { CROP_DATA } from '../../constants/gameData/cropData';
import {
  ScrollText,
  Brain,
  MessageSquare,
  CalendarClock,
  BookOpen,
  Sprout,
  Droplets,
  Sun,
  Snowflake,
  Send,
  Lightbulb,
  Wheat,
  Apple
} from 'lucide-react';

interface FarmAdvisorTabProps {
  llmHooks: any;
  farmState: FarmState;
  mapData: MapData;
  season: Season;
  year: number;
  useLlm: boolean;
  validCrops: string[];
}

export const FarmAdvisorTab: React.FC<FarmAdvisorTabProps> = ({
  llmHooks,
  farmState,
  mapData,
  season,
  year,
  useLlm,
  validCrops,
}) => {
  const [activeGuideSection, setActiveGuideSection] = useState<'planting' | 'watering' | 'harvesting' | 'seasons'>('planting');

  // Generate crop-specific tips from CROP_DATA
  const cropTips = useMemo(() => {
    return validCrops.map(cropName => {
      const cropInfo = CROP_DATA[cropName.toLowerCase()];
      if (!cropInfo) return null;

      return {
        icon: cropInfo.emoji,
        text: `${cropInfo.name}: ${cropInfo.tip || cropInfo.description}`,
        importance: 'high' as const,
        cropName: cropInfo.name
      };
    }).filter(Boolean);
  }, [validCrops]);

  // Season-specific tips
  const seasonalTips = useMemo(() => {
    const allSeasonalTips = [
      { season: 'Spring', icon: '🌸', text: 'Best time for planting - warm weather, good rainfall', importance: 'high' },
      { season: 'Summer', icon: '☀️', text: 'Focus on watering and tending established crops', importance: 'high' },
      { season: 'Fall', icon: '🍂', text: 'Harvest time - gather crops before winter', importance: 'high' },
      { season: 'Winter', icon: '❄️', text: 'Rest period - plan for next year, repair tools', importance: 'medium' },
    ];

    // Filter to show current season first, then general tips
    const currentSeasonTip = allSeasonalTips.find(tip => tip.season === season);
    const otherTips = [
      { season: 'General', icon: '📅', text: 'Each season lasts 3 months in the farming calendar', importance: 'low' },
      { season: 'General', icon: '🌍', text: 'Rotate crops between seasons to maintain soil health', importance: 'medium' },
      { season: 'General', icon: '🌾', text: 'Choose crops appropriate for your climate and season', importance: 'high' },
    ];

    return [
      currentSeasonTip,
      ...allSeasonalTips.filter(tip => tip.season !== season).slice(0, 2),
      ...otherTips
    ].filter(Boolean).map(tip => ({
      icon: tip!.icon,
      text: tip!.season === 'General' ? tip!.text : `${tip!.season}: ${tip!.text}`,
      importance: tip!.importance as 'high' | 'medium' | 'low'
    }));
  }, [season]);

  // Farming guide content
  const farmingGuide = {
    planting: {
      icon: <Sprout className="w-5 h-5" />,
      title: 'Planting Crops',
      tips: cropTips.length > 0 ? cropTips : [
        { icon: '🌱', text: 'Plant seeds in Spring for best yields', importance: 'high' },
        { icon: '🌾', text: 'Choose crops appropriate for your climate and cultural zone', importance: 'high' },
        { icon: '📏', text: 'Space seeds properly - crowded fields reduce productivity', importance: 'medium' },
        { icon: '🌍', text: 'Rotate crops between seasons to maintain soil health', importance: 'medium' },
        { icon: '⏰', text: 'Plant early in the season to maximize growth time', importance: 'low' }
      ]
    },
    watering: {
      icon: <Droplets className="w-5 h-5" />,
      title: 'Watering & Irrigation',
      tips: [
        { icon: '💧', text: 'Water fields regularly - dry fields reduce crop health', importance: 'high' },
        { icon: '🌊', text: 'Avoid over-watering - flooded fields can damage crops', importance: 'high' },
        { icon: '🌧️', text: 'Check weather - rain provides natural watering', importance: 'medium' },
        { icon: '🏞️', text: 'Fields near water sources are easier to irrigate', importance: 'medium' },
        { icon: '☀️', text: 'Water in early morning or evening to reduce evaporation', importance: 'low' }
      ]
    },
    harvesting: {
      icon: <Wheat className="w-5 h-5" />,
      title: 'Harvesting',
      tips: [
        { icon: '🌾', text: 'Harvest when crop health reaches 100% for maximum yield', importance: 'high' },
        { icon: '⏳', text: 'Don\'t wait too long - overripe crops may spoil', importance: 'high' },
        { icon: '🎒', text: 'Harvested crops are added to your inventory', importance: 'medium' },
        { icon: '💰', text: 'Sell surplus harvest in the Trade tab for coins', importance: 'medium' },
        { icon: '🗓️', text: 'Harvest before winter to preserve crops', importance: 'low' }
      ]
    },
    seasons: {
      icon: <Sun className="w-5 h-5" />,
      title: 'Seasonal Farming',
      tips: seasonalTips
    }
  };

  const currentGuide = farmingGuide[activeGuideSection];

  return (
    <div className="animate-fadeIn flex gap-6 h-full">
      {/* Left Side - Farming Guide */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-amber-400 flex items-center gap-3">
            <BookOpen className="w-7 h-7" />
            Farming Guide & Advisor
          </h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">
              {season} {year} • {mapData.localArea || mapData.continent}
            </span>
          </div>
        </div>

        {/* Farming Guide Tabs */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Tab Headers */}
          <div className="grid grid-cols-4 border-b border-slate-700/50 bg-slate-900/70">
            {Object.entries(farmingGuide).map(([key, guide]) => (
              <button
                key={key}
                onClick={() => setActiveGuideSection(key as any)}
                className={`flex items-center justify-center gap-2 px-4 py-3 transition-all ${
                  activeGuideSection === key
                    ? 'bg-amber-600/20 text-amber-300 border-b-2 border-amber-500'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {guide.icon}
                <span className="text-sm font-medium hidden lg:inline">{guide.title}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <h4 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
              {currentGuide.icon}
              {currentGuide.title}
            </h4>
            <div className="space-y-3">
              {currentGuide.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    tip.importance === 'high'
                      ? 'bg-amber-900/20 border-amber-700/40'
                      : tip.importance === 'medium'
                      ? 'bg-blue-900/20 border-blue-700/40'
                      : 'bg-slate-800/40 border-slate-700/40'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-relaxed">{tip.text}</p>
                    {tip.importance === 'high' && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                        Important
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Summary Section */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-5 border-b border-slate-700/50 bg-slate-900/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-purple-300">Historical Context</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Learn about farming in your region and era</p>
                </div>
              </div>
              <button
                onClick={llmHooks.runAdvisorSummary}
                disabled={!useLlm || llmHooks.isAdvisorBusy}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {llmHooks.isAdvisorBusy ? 'Loading...' : 'Generate Summary'}
              </button>
            </div>
          </div>
          {llmHooks.advisorSummary && (
            <div className="p-5 bg-slate-900/40">
              <p className="text-base text-slate-200 leading-relaxed">{llmHooks.advisorSummary}</p>
            </div>
          )}
          {!llmHooks.advisorSummary && !llmHooks.isAdvisorBusy && (
            <div className="p-5 text-center">
              <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Click "Generate Summary" to learn about farming practices in {mapData.localArea || mapData.continent} during this era</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - AI Advisor Chat */}
      <div className="w-96 flex-shrink-0 flex flex-col bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Chat Header */}
        <div className="p-5 border-b border-slate-700/50 bg-slate-900/70">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-emerald-300">Village Elder</h4>
              <p className="text-xs text-slate-400 mt-0.5">Ask for farming advice and guidance</p>
            </div>
          </div>
          {!useLlm && (
            <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-600/40 rounded-lg text-xs text-red-300">
              <Brain className="w-3.5 h-3.5 inline mr-1.5" />
              LLM disabled - Enable in settings to chat
            </div>
          )}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {llmHooks.advisorLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-slate-600" />
              </div>
              <div className="text-base font-medium text-slate-400 mb-2">Ask the Elder</div>
              <div className="text-sm text-slate-500 max-w-xs">
                The village elder has decades of farming wisdom. Ask about crops, seasons, or local conditions.
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500 text-left max-w-xs">
                <div className="flex items-start gap-2">
                  <span>💡</span>
                  <span>"What crop should I plant this {season}?"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>💡</span>
                  <span>"How can I improve my harvest yield?"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>💡</span>
                  <span>"What are the dangers this season?"</span>
                </div>
              </div>
            </div>
          ) : (
            llmHooks.advisorLog.map((line: string, i: number) => {
              const isPlayer = line.startsWith('You:');
              const text = isPlayer ? line.substring(5) : line.substring(7);

              return (
                <div
                  key={i}
                  className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 ${
                      isPlayer
                        ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80 text-white'
                        : 'bg-gradient-to-br from-emerald-700/60 to-emerald-800/60 text-slate-200 border border-emerald-600/50'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1.5 opacity-75">
                      {isPlayer ? 'You' : 'Elder'}
                    </div>
                    <div className="text-sm leading-relaxed">{text}</div>
                  </div>
                </div>
              );
            })
          )}
          {llmHooks.isAdvisorBusy && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-emerald-700/60 to-emerald-800/60 rounded-xl p-3 border border-emerald-600/50">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="italic text-emerald-200">Elder is thinking...</span>
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
              if (!llmHooks.isAdvisorBusy && llmHooks.advisorChat.trim() && useLlm) {
                llmHooks.runAdvisorChat();
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={llmHooks.advisorChat}
              onChange={(e) => llmHooks.setAdvisorChat(e.target.value)}
              placeholder={useLlm ? "Ask the elder for advice..." : "LLM disabled"}
              disabled={llmHooks.isAdvisorBusy || !useLlm}
              className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-4 py-2.5 text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={llmHooks.isAdvisorBusy || !llmHooks.advisorChat.trim() || !useLlm}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Ask
            </button>
          </form>
          <div className="mt-2 text-xs text-slate-500">
            The elder remembers your conversation history
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmAdvisorTab;
