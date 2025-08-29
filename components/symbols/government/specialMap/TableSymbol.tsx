/**
 * components/symbols/government/specialMap/TableSymbol.tsx
 * Table symbols for special maps that vary by cultural zone and era
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface TableSymbolProps {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  variant?: 'dining' | 'work' | 'ceremonial' | 'market';
}

export const TableSymbol: React.FC<TableSymbolProps> = ({ 
  culturalZone, 
  era, 
  variant = 'dining' 
}) => {
  const getTableStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'ANTIQUITY') {
          // Roman triclinium style
          return {
            shape: 'rectangular',
            color: '#8B4513',
            material: 'marble',
            height: 'low'
          };
        } else if (era === 'MEDIEVAL') {
          // Medieval trestle table
          return {
            shape: 'long-rectangular',
            color: '#654321',
            material: 'oak',
            height: 'standard'
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN') {
          // Ornate baroque table
          return {
            shape: 'rectangular',
            color: '#4B2F20',
            material: 'walnut',
            height: 'standard',
            decorative: true
          };
        } else {
          // Modern table
          return {
            shape: variant === 'work' ? 'rectangular' : 'round',
            color: '#D2691E',
            material: 'modern',
            height: 'standard'
          };
        }

      case 'EAST_ASIAN':
        if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
          // Low Japanese/Chinese table
          return {
            shape: 'rectangular',
            color: '#8B0000',
            material: 'lacquer',
            height: 'very-low'
          };
        } else {
          return {
            shape: 'rectangular',
            color: '#2F4F4F',
            material: 'modern',
            height: 'standard'
          };
        }

      case 'MENA':
        // Low brass tray tables or floor dining
        return {
          shape: variant === 'ceremonial' ? 'octagonal' : 'round',
          color: '#B8860B',
          material: 'brass',
          height: era === 'MODERN_ERA' ? 'standard' : 'low'
        };

      case 'SOUTH_ASIAN':
        // Chowki (low wooden platform)
        return {
          shape: 'square',
          color: '#8B4513',
          material: 'carved-wood',
          height: 'very-low',
          decorative: true
        };

      case 'SUB_SAHARAN_AFRICAN':
        // Woven or carved wooden tables
        return {
          shape: 'round',
          color: '#654321',
          material: 'carved-wood',
          height: era === 'MODERN_ERA' ? 'standard' : 'low'
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        // Stone altar tables or wooden platforms
        return {
          shape: variant === 'ceremonial' ? 'rectangular' : 'square',
          color: variant === 'ceremonial' ? '#696969' : '#8B4513',
          material: variant === 'ceremonial' ? 'stone' : 'wood',
          height: 'low'
        };

      case 'OCEANIA':
        // Woven mat platforms
        return {
          shape: 'rectangular',
          color: '#DEB887',
          material: 'woven',
          height: 'very-low'
        };

      default:
        return {
          shape: 'rectangular',
          color: '#8B4513',
          material: 'wood',
          height: 'standard'
        };
    }
  };

  const style = getTableStyle();

  // Render different table shapes and styles
  if (style.shape === 'round') {
    return (
      <g className="table-symbol">
        {/* Table top */}
        <ellipse 
          cx={25} 
          cy={25} 
          rx={18} 
          ry={12} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Table surface detail */}
        {style.material === 'brass' && (
          <ellipse 
            cx={25} 
            cy={25} 
            rx={14} 
            ry={9} 
            fill="none"
            stroke="#FFD700"
            strokeWidth={0.3}
            opacity={0.6}
          />
        )}
        
        {/* Legs for standard height tables */}
        {style.height === 'standard' && (
          <>
            <rect x={15} y={25} width={2} height={8} fill={style.color} opacity={0.7} />
            <rect x={33} y={25} width={2} height={8} fill={style.color} opacity={0.7} />
          </>
        )}
      </g>
    );
  } else if (style.shape === 'octagonal') {
    return (
      <g className="table-symbol">
        {/* Octagonal table (common in Islamic design) */}
        <polygon 
          points="25,10 35,15 40,25 35,35 25,40 15,35 10,25 15,15"
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Islamic geometric pattern */}
        <polygon 
          points="25,18 30,21 30,29 25,32 20,29 20,21"
          fill="none"
          stroke="#FFD700"
          strokeWidth={0.3}
          opacity={0.5}
        />
      </g>
    );
  } else if (style.shape === 'long-rectangular') {
    // Medieval feast table
    return (
      <g className="table-symbol">
        {/* Long table top */}
        <rect 
          x={8} 
          y={20} 
          width={34} 
          height={10} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Wood grain */}
        <line x1={8} y1={23} x2={42} y2={23} stroke="#4A3C2A" strokeWidth={0.3} opacity={0.5} />
        <line x1={8} y1={25} x2={42} y2={25} stroke="#4A3C2A" strokeWidth={0.3} opacity={0.5} />
        <line x1={8} y1={27} x2={42} y2={27} stroke="#4A3C2A" strokeWidth={0.3} opacity={0.5} />
        
        {/* Trestle supports */}
        <polygon points="15,30 13,35 17,35" fill={style.color} opacity={0.7} />
        <polygon points="35,30 33,35 37,35" fill={style.color} opacity={0.7} />
      </g>
    );
  } else {
    // Standard rectangular table
    return (
      <g className="table-symbol">
        {/* Table top */}
        <rect 
          x={12} 
          y={18} 
          width={26} 
          height={14} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Material-specific details */}
        {style.material === 'marble' && (
          /* Marble veining */
          <>
            <path d="M 15 22 Q 25 24 35 20" stroke="#FFFFFF" strokeWidth={0.2} opacity={0.3} />
            <path d="M 14 28 Q 20 26 30 29" stroke="#FFFFFF" strokeWidth={0.2} opacity={0.3} />
          </>
        )}
        
        {style.material === 'lacquer' && (
          /* Lacquer shine */
          <rect 
            x={14} 
            y={20} 
            width={22} 
            height={10} 
            fill="url(#lacquerGradient)"
            opacity={0.3}
          />
        )}
        
        {style.material === 'carved-wood' && style.decorative && (
          /* Carved details */
          <>
            <circle cx={18} cy={25} r={2} fill="none" stroke="#654321" strokeWidth={0.3} opacity={0.5} />
            <circle cx={32} cy={25} r={2} fill="none" stroke="#654321" strokeWidth={0.3} opacity={0.5} />
          </>
        )}
        
        {/* Legs based on height */}
        {style.height === 'standard' && (
          <>
            <rect x={14} y={32} width={2} height={6} fill={style.color} opacity={0.7} />
            <rect x={34} y={32} width={2} height={6} fill={style.color} opacity={0.7} />
          </>
        )}
        
        {style.height === 'low' && (
          <>
            <rect x={15} y={32} width={3} height={3} fill={style.color} opacity={0.7} />
            <rect x={32} y={32} width={3} height={3} fill={style.color} opacity={0.7} />
          </>
        )}
        
        {/* Market variant - display items */}
        {variant === 'market' && (
          <>
            <circle cx={20} cy={25} r={2} fill="#FF6347" opacity={0.8} />
            <circle cx={25} cy={25} r={2} fill="#FFD700" opacity={0.8} />
            <circle cx={30} cy={25} r={2} fill="#90EE90" opacity={0.8} />
          </>
        )}
        
        {/* Work variant - scrolls/books */}
        {variant === 'work' && (
          <>
            <rect x={18} y={23} width={4} height={3} fill="#F5DEB3" opacity={0.8} />
            <rect x={24} y={24} width={4} height={3} fill="#F5DEB3" opacity={0.8} />
          </>
        )}
        
        {/* Define gradient for lacquer effect */}
        <defs>
          <linearGradient id="lacquerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>
      </g>
    );
  }
};