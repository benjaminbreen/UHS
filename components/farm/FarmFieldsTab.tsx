/**
 * components/farm/FarmFieldsTab.tsx
 * Fields management tab - simplified version
 */

import React from 'react';
import { Season } from '../../types';
import { FarmState, FarmFamilyMember } from '../../services/farmService';
import { PlayerStateChanges, CROP_EMOJIS } from './types';
import { Sprout, Droplets, Wheat, Pill } from 'lucide-react';

interface FarmFieldsTabProps {
  farmState: FarmState;
  headFarmer: FarmFamilyMember | null;
  fieldHooks: any;
  llmHooks: any;
  season: Season;
  useLlm: boolean;
  onPlayerStateChange?: (changes: PlayerStateChanges) => void;
}

export const FarmFieldsTab: React.FC<FarmFieldsTabProps> = ({
  farmState,
  fieldHooks,
}) => {
  return (
    <div className="animate-fadeIn space-y-4">
      <h3 className="text-xl font-semibold text-amber-400">Fields Management</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {farmState.fields.map((field, idx) => {
          const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
          const isDiseased = field.diseaseSeverity > 50;
          const healthColor = isDiseased ? 'border-red-500 border-2' :
                             field.health > 70 ? 'border-emerald-500/50' :
                             field.health > 40 ? 'border-yellow-500/50' :
                             'border-red-500/50';

          return (
            <div key={idx} className={`bg-slate-700/40 rounded-lg p-4 border ${healthColor} ${isDiseased ? 'animate-pulse' : ''} relative`}>
              {/* Field number label (#1) */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-xs text-slate-400 font-mono">
                Field {idx + 1}
              </div>

              <div className="text-center mb-3 mt-2">
                <div className="text-4xl mb-2">{cropEmoji}</div>
                <div className="text-sm font-medium text-slate-200 capitalize">
                  {field.crop || 'Fallow'}
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Health with progress bar (#2) */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Health</span>
                    <span className={field.health > 70 ? 'text-green-400' : field.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                      {field.health}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        field.health > 70 ? 'bg-green-400' :
                        field.health > 40 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${field.health}%` }}
                    />
                  </div>
                </div>

                {/* Stage with days remaining (#4) */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Stage</span>
                  <span className="text-slate-300 capitalize">
                    {field.growthStage === 'growing' && field.daysToHarvest > 0
                      ? `Growing (${field.daysToHarvest}d)`
                      : field.growthStage === 'planted'
                      ? `Planted (${field.daysToHarvest}d)`
                      : field.growthStage}
                  </span>
                </div>

                {/* Disease with progress bar (#2) */}
                {field.diseaseSeverity > 0 && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Disease</span>
                      <span className="text-red-400">{field.diseaseSeverity}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${field.diseaseSeverity}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {/* Add icons to buttons (#3) */}
                {!field.crop && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'plant', fieldHooks.validCrops[0])}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
                  >
                    <Sprout className="w-3 h-3" />
                    Plant
                  </button>
                )}
                {field.crop && field.growthStage === 'mature' && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'harvest')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded transition-colors"
                  >
                    <Wheat className="w-3 h-3" />
                    Harvest
                  </button>
                )}
                {field.crop && field.growthStage !== 'mature' && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'water')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  >
                    <Droplets className="w-3 h-3" />
                    Water
                  </button>
                )}
                {field.diseaseSeverity > 20 && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'treat')}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded mt-1 transition-colors"
                    title="Costs 10 coins - Reduces disease by 40%"
                  >
                    <Pill className="w-3 h-3" />
                    Treat Disease (10¢)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FarmFieldsTab;
