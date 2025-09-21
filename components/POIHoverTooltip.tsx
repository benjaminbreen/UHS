/**
 * components/POIHoverTooltip.tsx
 * Hover tooltip for Points of Interest on the map
 */

import React, { useEffect, useState } from 'react';
import { TerrainStructure, NpcEntity } from '../types';
import { getReligionDisplay, detectReligion } from '../constants/gameData/religionIcons';
import { calculateHolySiteWealth } from '../constants/gameData/religiousEconomy';
import { getClergyRoles } from '../constants/characterData/religionClergyRoles';

interface POIHoverTooltipProps {
  structure: TerrainStructure;
  x: number;
  y: number;
  npcs: NpcEntity[];
  culturalZone: string;
  era: string;
  visible: boolean;
}

const POIHoverTooltip: React.FC<POIHoverTooltipProps> = ({
  structure,
  x,
  y,
  npcs,
  culturalZone,
  era,
  visible
}) => {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    if (visible) {
      // Fade in
      const timer = setTimeout(() => setOpacity(1), 10);
      return () => clearTimeout(timer);
    } else {
      // Fade out
      setOpacity(0);
    }
  }, [visible]);

  if (!structure) return null;

  // Get key figure (highest ranking NPC at this location)
  const keyFigure = npcs
    .filter(npc => npc.workplaceId === structure.id)
    .sort((a, b) => {
      // Sort by role importance (simplified)
      const importantRoles = ['King', 'Queen', 'Lord', 'Lady', 'Bishop', 'Imam', 'Rabbi', 'Abbot', 'Chief', 'Captain', 'Master'];
      const aImportance = importantRoles.findIndex(r => a.role.includes(r));
      const bImportance = importantRoles.findIndex(r => b.role.includes(r));
      if (aImportance !== -1 && bImportance !== -1) return aImportance - bImportance;
      if (aImportance !== -1) return -1;
      if (bImportance !== -1) return 1;
      return 0;
    })[0];

  // Get structure-specific information
  const getStructureInfo = () => {
    switch (structure.structureType) {
      case 'holy_site': {
        const religion = (structure as any).religion || detectReligion(structure.name, culturalZone, era);
        const religionDisplay = getReligionDisplay(religion);
        const wealthLevel = calculateHolySiteWealth(0.3, era as any, culturalZone); // Simplified calculation
        
        return {
          icon: religionDisplay.icon,
          color: religionDisplay.color,
          title: religionDisplay.name,
          subtitle: `Wealth: ${wealthLevel}/10`,
          details: keyFigure ? `${keyFigure.name}, ${keyFigure.role}` : 'No clergy present'
        };
      }
      
      case 'palace': {
        const treasuryValue = structure.treasury ? 
          Object.values(structure.treasury).reduce((sum, val) => sum + val, 0) : 0;
        
        return {
          icon: '🏰',
          color: '#FFD700',
          title: structure.name,
          subtitle: structure.allegianceGroup || 'Independent',
          details: keyFigure ? `${keyFigure.name}, ${keyFigure.role}` : `Treasury: ${treasuryValue} items`
        };
      }
      
      case 'fortress': {
        return {
          icon: '🛡️',
          color: '#708090',
          title: structure.name,
          subtitle: structure.allegianceGroup || 'Ungarrisoned',
          details: keyFigure ? `Commander: ${keyFigure.name}` : `State: ${structure.state}`
        };
      }
      
      case 'mill': {
        const production = structure.outputGoods?.join(', ') || 'grain';
        return {
          icon: '🌾',
          color: '#8B7355',
          title: structure.name,
          subtitle: `Produces: ${production}`,
          details: keyFigure ? `Miller: ${keyFigure.name}` : `State: ${structure.state}`
        };
      }
      
      case 'fishing_hut': {
        return {
          icon: '🎣',
          color: '#4682B4',
          title: structure.name,
          subtitle: 'Produces: fish, shellfish',
          details: keyFigure ? `Fisher: ${keyFigure.name}` : `State: ${structure.state}`
        };
      }
      
      case 'mining_colony': {
        const minerals = structure.mineralDeposits ? 
          Object.keys(structure.mineralDeposits).join(', ') : 'ore';
        return {
          icon: '⛏️',
          color: '#696969',
          title: structure.name,
          subtitle: `Mining: ${minerals}`,
          details: keyFigure ? `Foreman: ${keyFigure.name}` : `State: ${structure.state}`
        };
      }
      
      case 'quarry': {
        return {
          icon: '🪨',
          color: '#8B7D6B',
          title: structure.name,
          subtitle: 'Produces: stone blocks',
          details: keyFigure ? `Quarry Master: ${keyFigure.name}` : `State: ${structure.state}`
        };
      }
      
      case 'factory': {
        const production = structure.outputGoods?.join(', ') || 'goods';
        return {
          icon: '🏭',
          color: '#595959',
          title: structure.name,
          subtitle: `Produces: ${production}`,
          details: keyFigure ? `Manager: ${keyFigure.name}` : `Workers: ${npcs.filter(n => n.workplaceId === structure.id).length}`
        };
      }
      
      case 'marketplace': {
        const goods = structure.outputGoods?.join(', ') || 'various goods';
        return {
          icon: '🏪',
          color: '#FFB347',
          title: structure.name,
          subtitle: `Trading: ${goods}`,
          details: keyFigure ? `Head Merchant: ${keyFigure.name}` : `Population: ${structure.population || 0}`
        };
      }
      
      case 'ruin': {
        return {
          icon: '🏚️',
          color: '#8B7355',
          title: structure.name,
          subtitle: 'Ancient ruins',
          details: structure.treasury ? 'Contains treasures' : 'Abandoned'
        };
      }
      
      default: {
        return {
          icon: '📍',
          color: '#808080',
          title: structure.name,
          subtitle: structure.structureType.replace(/_/g, ' '),
          details: `State: ${structure.state}`
        };
      }
    }
  };

  const info = getStructureInfo();

  // Calculate position to keep tooltip on screen
  const tooltipWidth = 240; // Approximate width
  const tooltipHeight = 120; // Approximate height
  const offset = 10; // Distance from cursor

  // Check if we're on the right side of the screen
  const isRightSide = x > window.innerWidth / 2;

  // Apply offset based on screen position
  let adjustedX;
  if (isRightSide) {
    // On right side: offset to the left of cursor
    adjustedX = x - 400;  // Larger leftward offset for right side
  } else {
    // On left side: smaller offset works fine
    adjustedX = x - 200;
  }

  let adjustedY = y - offset;

  // Simple bounds checking
  if (adjustedX < 10) {
    adjustedX = 10;
  } else if (adjustedX > window.innerWidth - tooltipWidth - 10) {
    adjustedX = window.innerWidth - tooltipWidth - 10;
  }

  if (adjustedY < 10) {
    adjustedY = y + offset; // Show below if no room above
  }
  
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        opacity,
        transition: 'opacity 0.2s ease-in-out',
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/50 rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: info.color }} className="text-lg">
            {info.icon}
          </span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white truncate">{structure.name}</h4>
            <p className="text-xs text-amber-400">{info.title}</p>
          </div>
        </div>
        
        {/* Info sections */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status:</span>
            <span className="text-white">{info.subtitle}</span>
          </div>
          <div className="pt-1 border-t border-slate-700/50">
            <p className="text-slate-300">{info.details}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POIHoverTooltip;