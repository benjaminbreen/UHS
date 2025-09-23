/**
 * components/PlayerTooltip.tsx - Tooltip that appears when clicking the player character
 */
import React from 'react';

interface PlayerTooltipProps {
  x: number;
  y: number;
  onRest: () => void;
  onStatus: () => void;
  onClose: () => void;
}

const PlayerTooltip: React.FC<PlayerTooltipProps> = ({
  x,
  y,
  onRest,
  onStatus,
  onClose
}) => {
  return (
    <div
      className="absolute z-50 bg-slate-800/95 backdrop-blur-sm border border-yellow-400/50 rounded-lg shadow-xl min-w-[160px]"
      style={{
        left: `${x + 20}px`,
        top: `${y - 10}px`,
        pointerEvents: 'all'
      }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-400">⛺</span>
          <h3 className="text-sm font-semibold text-white">Camp Options</h3>
        </div>

        <div className="space-y-2">
          <button
            onClick={onRest}
            className="w-full text-left bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 hover:text-white py-2 px-3 rounded text-sm font-medium transition-colors border border-blue-500/30 hover:border-blue-400/60"
          >
            Rest for the night
          </button>

          <button
            onClick={onStatus}
            className="w-full text-left bg-green-600/20 hover:bg-green-600/40 text-green-200 hover:text-white py-2 px-3 rounded text-sm font-medium transition-colors border border-green-500/30 hover:border-green-400/60"
          >
            Check status
          </button>

          <button
            onClick={onClose}
            className="w-full text-left bg-slate-600/20 hover:bg-slate-600/40 text-slate-300 hover:text-white py-1 px-3 rounded text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerTooltip;