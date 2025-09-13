/**
 * components/FactionTooltip.tsx
 * Hover tooltip for faction information in LeftSidebar
 */
import React from 'react';
// Lazy load faction icons to improve startup performance
let factionIconsModule: any = null;
let factionIconsPromise: Promise<any> | null = null;

const ensureFactionIcons = () => {
  if (!factionIconsPromise && !factionIconsModule) {
    factionIconsPromise = import('../constants/gameData/factionIcons').then(module => {
      factionIconsModule = module;
      return module;
    });
  }
};

interface FactionTooltipProps {
  dominantPower: string;
  allegianceGroups: (string | { name: string; type: string; description: string })[];
  x: number;
  y: number;
}

const FactionTooltip: React.FC<FactionTooltipProps> = ({ 
  dominantPower, 
  allegianceGroups,
  x, 
  y 
}) => {
  // Get faction icon
  ensureFactionIcons();
  const factionData = (factionIconsModule?.FACTION_ICONS || {})[dominantPower] || {
    name: dominantPower,
    color: '#808080',
    icon: null
  };
  const FactionIcon = factionData.icon;
  
  // Position tooltip aligned with the faction panel
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${x + 10}px`,
    top: `${y}px`, // Removed the upward offset
    zIndex: 100000, // Very high z-index to ensure it renders above everything
    pointerEvents: 'none', // Prevent tooltip from interfering with mouse events
  };

  return (
    <div 
      style={tooltipStyle}
      className="pointer-events-none animate-fadeIn"
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 max-w-xs shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          {FactionIcon && (
            <div className="flex-shrink-0">
              <FactionIcon size={20} className="text-amber-400" />
            </div>
          )}
          <span className="font-bold text-amber-400 text-base">{dominantPower}</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          Controls this region.
        </p>
        {allegianceGroups.length > 0 && (
          <p className="text-sm text-slate-300 mt-2">
            Other local powers include{' '}
            <span className="text-slate-100">
              {allegianceGroups.slice(0, 3).map(g => typeof g === 'string' ? g : g.name).join(', ')}
              {allegianceGroups.length > 3 && `, and ${allegianceGroups.length - 3} others`}
            </span>.
          </p>
        )}
        <p className="text-xs text-slate-400 mt-2 italic">
          Click for additional information.
        </p>
      </div>
    </div>
  );
};

export default FactionTooltip;