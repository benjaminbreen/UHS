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

import React, { useState, useEffect, useRef } from 'react';
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
    currentFarmTime: number;
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
  const [isLivestockCollapsed, setIsLivestockCollapsed] = useState(false);

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

  // Phase 3.3: Enhanced narrative formatting
  const formatMessage = (text: string): JSX.Element => {
    let formatted = text;

    // Highlight field references (Field 1, Field 2, etc.)
    formatted = formatted.replace(/Field (\d+)/g,
      '<span class="px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded font-semibold">Field $1</span>');

    // Highlight family member names
    farmState.family.members.forEach(member => {
      const regex = new RegExp(`\\b${member.name}\\b`, 'g');
      formatted = formatted.replace(regex,
        `<span class="text-blue-400 font-medium">${member.name}</span>`);
    });

    // Highlight crop types
    Object.keys(CROP_EMOJIS).forEach(crop => {
      const regex = new RegExp(`\\b${crop}\\b`, 'gi');
      formatted = formatted.replace(regex,
        `<span class="text-green-400">${crop}</span>`);
    });

    // Highlight warnings/dangers
    formatted = formatted.replace(/\b(waterlogged|damage|damaged|failed|rot|died|death|injury|injured|hurt|pain)\b/gi,
      '<span class="text-red-400 font-semibold">$1</span>');

    // Highlight success/positive outcomes
    formatted = formatted.replace(/\b(success|successful|perfectly|excellent|thriving|healthy|abundant)\b/gi,
      '<span class="text-green-400 font-semibold">$1</span>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="leading-relaxed" />;
  };

  // Phase 3.2: Animated state transitions for fields
  const prevFieldsRef = useRef(farmState.fields);

  useEffect(() => {
    const prev = prevFieldsRef.current;

    farmState.fields.forEach((field, idx) => {
      const oldField = prev[idx];

      if (oldField) {
        // Detect moisture change
        if (oldField.moisture !== field.moisture) {
          const fieldEl = document.querySelector(`[data-field="${idx}"]`);
          if (fieldEl) {
            fieldEl.classList.add('scale-110', 'ring-2', 'ring-blue-400');
            setTimeout(() => {
              fieldEl.classList.remove('scale-110', 'ring-2', 'ring-blue-400');
            }, 1000);
          }
        }

        // Detect health change (crop damage/improvement)
        if (oldField.health !== field.health) {
          const fieldEl = document.querySelector(`[data-field="${idx}"]`);
          if (fieldEl) {
            const healthDiff = field.health - oldField.health;
            if (healthDiff < 0) {
              // Damage - red flash
              fieldEl.classList.add('ring-2', 'ring-red-500', 'animate-pulse');
              setTimeout(() => {
                fieldEl.classList.remove('ring-2', 'ring-red-500', 'animate-pulse');
              }, 1500);
            } else {
              // Improvement - green flash
              fieldEl.classList.add('ring-2', 'ring-green-400');
              setTimeout(() => {
                fieldEl.classList.remove('ring-2', 'ring-green-400');
              }, 1000);
            }
          }
        }
      }
    });

    prevFieldsRef.current = farmState.fields;
  }, [farmState.fields]);

  // Animated state transitions for livestock
  const prevLivestockRef = useRef(farmState.livestock);

  useEffect(() => {
    const prev = prevLivestockRef.current || [];
    const current = farmState.livestock || [];

    current.forEach((animal, idx) => {
      const oldAnimal = prev[idx];

      if (oldAnimal) {
        const animalEl = document.querySelector(`[data-livestock="${idx}"]`);

        // Detect feeding (lastFed changed)
        if (oldAnimal.lastFed !== animal.lastFed) {
          if (animalEl) {
            animalEl.classList.add('scale-105', 'ring-2', 'ring-green-400');
            setTimeout(() => {
              animalEl.classList.remove('scale-105', 'ring-2', 'ring-green-400');
            }, 1200);
          }
        }

        // Detect health change
        if (oldAnimal.health !== animal.health) {
          if (animalEl) {
            const healthDiff = animal.health - oldAnimal.health;
            if (healthDiff > 0) {
              // Health improved - green pulse
              animalEl.classList.add('ring-2', 'ring-emerald-400');
              setTimeout(() => {
                animalEl.classList.remove('ring-2', 'ring-emerald-400');
              }, 1000);
            } else {
              // Health decreased - red pulse
              animalEl.classList.add('ring-2', 'ring-red-500', 'animate-pulse');
              setTimeout(() => {
                animalEl.classList.remove('ring-2', 'ring-red-500', 'animate-pulse');
              }, 1500);
            }
          }
        }

        // Detect productivity change
        if (oldAnimal.productivity !== animal.productivity) {
          if (animalEl) {
            const prodDiff = animal.productivity - oldAnimal.productivity;
            if (prodDiff > 0) {
              // Productivity improved - amber glow
              animalEl.classList.add('ring-2', 'ring-amber-400');
              setTimeout(() => {
                animalEl.classList.remove('ring-2', 'ring-amber-400');
              }, 800);
            }
          }
        }
      }
    });

    prevLivestockRef.current = current;
  }, [farmState.livestock]);

  return (
    <div className="animate-fadeIn flex gap-4 h-full">
      {/* Left Sidebar - Field Status, Livestock & Action Log (wider for better visibility) */}
      <div className="w-96 flex flex-col gap-4">
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

                  // Phase 3.1: Moisture overlay effects
                  const moistureOverlay = field.moisture === 'flooded'
                    ? 'bg-blue-400/30 animate-pulse'
                    : field.moisture === 'wet'
                    ? 'bg-blue-400/10'
                    : '';

                  // Weather overlay effects
                  const weatherOverlay = farmState.activeWeather?.event === 'drought'
                    ? 'bg-orange-400/20'
                    : farmState.activeWeather?.event === 'heavy_rain'
                    ? 'bg-blue-500/30 animate-pulse'
                    : farmState.activeWeather?.event === 'early_frost'
                    ? 'bg-cyan-400/20'
                    : '';

                  // Disease overlay effects
                  const isDiseased = field.diseaseSeverity > 50;
                  const diseaseOverlay = isDiseased ? 'bg-red-500/20 animate-pulse' : '';
                  const diseaseBorder = isDiseased ? 'border-red-500' : '';

                  return (
                    <div
                      key={idx}
                      data-field={idx}
                      className={`relative bg-slate-800/40 rounded p-2 text-center border transition-all duration-500 ${diseaseBorder || 'border-slate-700/40'}`}
                    >
                      {/* Moisture visual effect overlay */}
                      {moistureOverlay && (
                        <div className={`absolute inset-0 ${moistureOverlay} rounded z-0 pointer-events-none`} />
                      )}

                      {/* Weather visual effect overlay */}
                      {weatherOverlay && (
                        <div className={`absolute inset-0 ${weatherOverlay} rounded z-0 pointer-events-none`} />
                      )}

                      {/* Disease visual effect overlay */}
                      {diseaseOverlay && (
                        <div className={`absolute inset-0 ${diseaseOverlay} rounded z-0 pointer-events-none`} />
                      )}

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="text-2xl mb-1">{cropEmoji}</div>

                        {/* Moisture indicator dots (Phase 3.1) */}
                        <div className="flex gap-0.5 justify-center mb-1">
                          {['dry', 'moist', 'wet', 'flooded'].map((level, i) => {
                            const moistureLevels = ['dry', 'moist', 'wet', 'flooded'];
                            const currentIndex = moistureLevels.indexOf(field.moisture);
                            return (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                  currentIndex >= i ? 'bg-blue-400' : 'bg-slate-600'
                                }`}
                              />
                            );
                          })}
                        </div>

                        <div className="text-[9px] text-slate-500">Field {idx + 1}</div>
                        <div className={`text-[9px] font-medium ${healthColor}`}>
                          {field.crop ? `${field.health}%` : 'Empty'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Livestock Section */}
        {farmState.livestock && farmState.livestock.length > 0 && (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden">
            <button
              onClick={() => setIsLivestockCollapsed(!isLivestockCollapsed)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors"
            >
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                Livestock
              </h4>
              {isLivestockCollapsed ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {!isLivestockCollapsed && (
              <div className="p-3 pt-0 space-y-2">
                {farmState.livestock.map((animal, idx) => {
                  const healthColor = animal.health > 70 ? 'text-green-400' :
                                     animal.health > 40 ? 'text-yellow-400' :
                                     'text-red-400';

                  const productivityColor = animal.productivity > 70 ? 'text-emerald-400' :
                                           animal.productivity > 40 ? 'text-yellow-400' :
                                           'text-orange-400';

                  // Animal emojis
                  const animalEmojis: Record<string, string> = {
                    'chickens': '🐔',
                    'cattle': '🐄',
                    'pigs': '🐷',
                    'sheep': '🐑',
                    'goats': '🐐',
                    'horses': '🐴',
                    'ducks': '🦆',
                    'geese': '🦢',
                  };

                  const emoji = animalEmojis[animal.type] || '🐾';

                  // Days since fed - use game time hours, not real-world timestamp
                  // animal.lastFed is game time hours since farm creation
                  const daysSinceFed = animal.lastFed !== undefined && animal.lastFed !== null
                    ? Math.floor((llmHooks.currentFarmTime - animal.lastFed) / 24) // Convert hours to days
                    : null;

                  const fedStatus = daysSinceFed === null ? 'Never fed' :
                                   daysSinceFed === 0 ? 'Fed today' :
                                   daysSinceFed === 1 ? 'Fed yesterday' :
                                   daysSinceFed > 100 ? 'Starving!' :
                                   `${daysSinceFed} days unfed`;
                  const fedColor = daysSinceFed === null || daysSinceFed === 0 ? 'text-green-400' :
                                  daysSinceFed === 1 ? 'text-yellow-400' :
                                  'text-red-400';

                  return (
                    <div
                      key={idx}
                      data-livestock={idx}
                      className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-200 capitalize">
                            {animal.type}
                          </div>
                          <div className={`text-[9px] ${fedColor}`}>
                            {fedStatus}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Health</span>
                          <span className={healthColor}>{animal.health}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Productivity</span>
                          <span className={productivityColor}>{animal.productivity}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-slate-700/40">
                  <div className="text-[9px] text-slate-500 italic text-center">
                    Try: "feed the {farmState.livestock[0]?.type}", "check on animals"
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Available Resources moved to right sidebar */}

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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <Sprout className="w-5 h-5" />
              A Day's Farm Work
            </h3>
            <p className="text-xs text-slate-400">
              Enter commands to work the farm. Be specific! ({hoursWorkedToday.toFixed(1)} hours worked today)
            </p>
          </div>
        </div>

        {/* Contract Status Banner (if player has a contract) */}
        {farmState.residencyStatus?.currentContract && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide">
                    {farmState.residencyStatus.currentContract.type} Contract
                  </div>
                  {farmState.residencyStatus.currentContract.tasksToday &&
                   farmState.residencyStatus.currentContract.tasksToday.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {farmState.residencyStatus.currentContract.tasksToday.map((task, idx) => {
                        // Check if task is urgent
                        const isUrgent = task.startsWith('[URGENT]');
                        const displayTask = isUrgent ? task.replace('[URGENT] ', '') : task;

                        // Check if task is completed based on action log
                        const isCompleted = farmActionLog.some(log =>
                          log.action.toLowerCase().includes(displayTask.toLowerCase().split(' ')[0]) ||
                          (displayTask.toLowerCase().includes('harvest') && log.action.toLowerCase().includes('harvest')) ||
                          (displayTask.toLowerCase().includes('livestock') && log.action.toLowerCase().includes('feed')) ||
                          (displayTask.toLowerCase().includes('barn') && log.action.toLowerCase().includes('repair'))
                        );

                        return (
                          <div
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                              isCompleted
                                ? 'text-green-400 bg-green-900/30 border-green-600/30 line-through'
                                : isUrgent
                                ? 'text-red-300 bg-red-900/40 border-red-500/50 animate-pulse font-bold'
                                : 'text-slate-200 bg-amber-900/30 border-amber-600/30'
                            }`}
                          >
                            {isCompleted && <span className="text-green-400 text-xs">✓</span>}
                            {isUrgent && !isCompleted && <span className="text-red-400 text-xs">⚠</span>}
                            {displayTask}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  {farmState.residencyStatus.currentContract.payment.coins ? `${farmState.residencyStatus.currentContract.payment.coins} coins` : ''}
                  {farmState.residencyStatus.currentContract.payment.lodging && (farmState.residencyStatus.currentContract.payment.coins ? ' + ' : '') + 'lodging'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase mb-0.5">Trust</div>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        (farmState.residencyStatus.trustLevel || 0) > 70 ? 'bg-green-400' :
                        (farmState.residencyStatus.trustLevel || 0) > 40 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${farmState.residencyStatus.trustLevel || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-sky-400">
                    {farmState.residencyStatus.trustLevel || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
              {/* Phase 3.3: Apply formatting to narrator messages */}
              {entry.type === 'narrator' ? (
                <div className="text-sm text-slate-200">{formatMessage(entry.text)}</div>
              ) : (
                <div className="text-sm text-slate-200">{entry.text}</div>
              )}
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
