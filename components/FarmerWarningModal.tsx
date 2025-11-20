/**
 * components/FarmerWarningModal.tsx
 * Modal for when farmer confronts player working too late (after 8pm)
 */

import React from 'react';
import { FarmFamilyMember } from '../services/farmService';

interface FarmerWarningModalProps {
  farmer: FarmFamilyMember;
  currentHour: number;
  onLeaveFarm: () => void;
  onGoToBed: () => void;
}

const FarmerWarningModal: React.FC<FarmerWarningModalProps> = ({
  farmer,
  currentHour,
  onLeaveFarm,
  onGoToBed
}) => {
  // Generate contextual dialogue based on how late it is
  const getDialogue = () => {
    if (currentHour >= 22) {
      return `It's past ${currentHour}:00! You're going to exhaust yourself working this late. You need to either go to bed or leave for the night.`;
    } else if (currentHour >= 21) {
      return `It's getting very late - past ${currentHour}:00. I can't let you keep working at this hour. You'll hurt yourself from fatigue.`;
    } else {
      return `It's after ${currentHour}:00 now. The work day is over. You need to rest - either go to bed or head home for the night.`;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-slate-900/95 border-2 border-amber-600 rounded-lg shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="bg-amber-900/50 border-b border-amber-700 px-6 py-4">
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Working Too Late!
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Farmer Section */}
          <div className="flex items-start gap-4 mb-6">
            {/* Farmer Icon */}
            <div className="w-16 h-16 bg-slate-800 rounded-lg border-2 border-amber-600 flex items-center justify-center text-4xl">
              👨‍🌾
            </div>

            {/* Farmer Info & Dialogue */}
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-2">
                {farmer.name} • {farmer.role}
              </div>
              <div className="text-white bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="italic text-amber-100">"{getDialogue()}"</p>
              </div>
            </div>
          </div>

          {/* Time Warning */}
          <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-red-300">
              <span className="text-xl">🕐</span>
              <div className="text-sm">
                <div className="font-semibold">Current time: {currentHour}:00</div>
                <div className="text-xs text-red-400 mt-1">
                  Working past 8pm risks serious fatigue and injury
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Go to Bed Option */}
            <button
              onClick={onGoToBed}
              className="w-full px-4 py-4 rounded-lg text-left bg-blue-900/50 hover:bg-blue-900/70 border border-blue-600 text-blue-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛏️</span>
                  <div>
                    <div className="font-semibold">Go to Bed</div>
                    <div className="text-xs text-blue-300 opacity-80">
                      Rest until morning in the farmhouse
                    </div>
                  </div>
                </div>
                <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </button>

            {/* Leave Farm Option */}
            <button
              onClick={onLeaveFarm}
              className="w-full px-4 py-4 rounded-lg text-left bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 text-slate-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚪</span>
                  <div>
                    <div className="font-semibold">Leave the Farm</div>
                    <div className="text-xs text-slate-400 opacity-80">
                      Return to the world map
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center italic">
              The farmer won't let you continue working at this hour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerWarningModal;
