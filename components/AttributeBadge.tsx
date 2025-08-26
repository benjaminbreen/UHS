/**
 * components/AttributeBadge.tsx - Displays character attribute badges with tooltips
 */

import React, { useState } from 'react';
import { AttributeBadge as AttributeBadgeType, RARITY_COLORS } from '../types/attributeTypes';
import * as FaIcons from 'react-icons/fa';
import * as GiIcons from 'react-icons/gi';
import { Tooltip } from './Tooltip'; // Assuming we have a tooltip component

interface AttributeBadgeProps {
  badge: AttributeBadgeType;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showTooltip?: boolean;
}

const AttributeBadge: React.FC<AttributeBadgeProps> = ({
  badge,
  size = 'small',
  onClick,
  showTooltip = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get the icon component
  const getIcon = () => {
    const allIcons = { ...FaIcons, ...GiIcons };
    const IconComponent = allIcons[badge.icon as keyof typeof allIcons] as React.ElementType;
    
    if (!IconComponent) {
      // Fallback icon if not found
      return FaIcons.FaQuestionCircle;
    }
    
    return IconComponent;
  };
  
  const Icon = getIcon();
  const color = RARITY_COLORS[badge.rarity];
  
  // Size configurations
  const sizeConfig = {
    small: {
      badge: 'w-6 h-6',
      icon: 'w-3 h-3',
      border: 'border-2'
    },
    medium: {
      badge: 'w-8 h-8',
      icon: 'w-4 h-4',
      border: 'border-2'
    },
    large: {
      badge: 'w-10 h-10',
      icon: 'w-5 h-5',
      border: 'border-3'
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <div className="relative inline-block">
      <button
        className={`
          ${config.badge}
          ${config.border}
          rounded-full
          flex items-center justify-center
          bg-slate-900/80
          backdrop-blur-sm
          transition-all duration-200
          hover:scale-110
          cursor-pointer
          shadow-lg
        `}
        style={{ 
          borderColor: color,
          boxShadow: `0 0 10px ${color}40`
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Icon 
          className={config.icon}
          style={{ color }}
        />
      </button>
      
      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border border-slate-700 whitespace-nowrap">
            <div className="text-sm font-semibold" style={{ color }}>
              {badge.name}
            </div>
            <div className="text-xs text-slate-300 max-w-xs">
              {badge.description}
            </div>
            {badge.effect && (
              <div className="text-xs text-blue-400 mt-1">
                Effect: {badge.effect}
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95" />
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display multiple badges
interface AttributeBadgeListProps {
  badges: AttributeBadgeType[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
  onBadgeClick?: (badge: AttributeBadgeType) => void;
}

export const AttributeBadgeList: React.FC<AttributeBadgeListProps> = ({
  badges,
  maxDisplay = 3,
  size = 'small',
  onBadgeClick
}) => {
  const displayBadges = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;
  
  return (
    <div className="flex items-center gap-1">
      {displayBadges.map((badge, index) => (
        <AttributeBadge
          key={badge.id}
          badge={badge}
          size={size}
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
      {hasMore && (
        <div className="text-xs text-slate-400 ml-1">
          +{badges.length - maxDisplay}
        </div>
      )}
    </div>
  );
};

export default AttributeBadge;