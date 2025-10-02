/**
 * components/farm/FarmFieldsTab.tsx
 * Fields management tab - simplified version
 */

import React from 'react';
import { Season } from '../../types';
import { FarmState, FarmFamilyMember } from '../../services/farmService';
import { PlayerStateChanges, CROP_EMOJIS } from './types';

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
          const healthColor = field.health > 70 ? 'border-emerald-500/50' :
                             field.health > 40 ? 'border-yellow-500/50' :
                             'border-red-500/50';

          return (
            <div key={idx} className={`bg-slate-700/40 rounded-lg p-4 border ${healthColor}`}>
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">{cropEmoji}</div>
                <div className="text-sm font-medium text-slate-200 capitalize">
                  {field.crop || 'Fallow'}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Health</span>
                  <span className={field.health > 70 ? 'text-green-400' : field.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                    {field.health}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stage</span>
                  <span className="text-slate-300 capitalize">{field.growthStage}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {!field.crop && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'plant', fieldHooks.validCrops[0])}
                    className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded"
                  >
                    Plant
                  </button>
                )}
                {field.crop && field.growthStage === 'mature' && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'harvest')}
                    className="flex-1 px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded"
                  >
                    Harvest
                  </button>
                )}
                {field.crop && field.growthStage !== 'mature' && (
                  <button
                    onClick={() => fieldHooks.handleFieldAction(idx, 'water')}
                    className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                  >
                    Water
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
