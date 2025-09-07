/**
 * components/ShipTooltip.tsx - Tooltip that appears when clicking the player's ship
 */
import React from 'react';

interface ShipTooltipProps {
  x: number;
  y: number;
  onGoBelow: () => void;
  onClose: () => void;
}

const ShipTooltip: React.FC<ShipTooltipProps> = ({ 
  x, 
  y, 
  onGoBelow, 
  onClose 
}) => {
  return (
    <div 
      className="absolute z-50 bg-slate-800/95 backdrop-blur-sm border border-blue-400/50 rounded-lg shadow-xl min-w-[160px]"
      style={{
        left: `${x + 20}px`,
        top: `${y - 10}px`,
        pointerEvents: 'all'
      }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-400">⚓</span>
          <h3 className="text-sm font-semibold text-white">Your Vessel</h3>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={onGoBelow}
            className="w-full text-left bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 hover:text-white py-2 px-3 rounded text-sm font-medium transition-colors border border-blue-500/30 hover:border-blue-400/60"
          >
            Go belowdecks?
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

export default ShipTooltip;