/**
 * components/symbols/government/specialMap/StatueSymbol.tsx
 * Statue symbols for special maps that vary by cultural zone and era
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface StatueSymbolProps {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  variant?: 'figure' | 'bust' | 'monument' | 'totem' | 'obelisk';
}

export const StatueSymbol: React.FC<StatueSymbolProps> = ({ 
  culturalZone, 
  era, 
  variant = 'figure' 
}) => {
  const getStatueStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === HistoricalEra.ANTIQUITY) {
          // Greco-Roman statuary
          return {
            type: variant === 'bust' ? 'classical-bust' : 'classical-figure',
            color: '#F5F5DC', // Marble white
            material: 'marble',
            style: 'classical'
          };
        } else if (era === HistoricalEra.MEDIEVAL) {
          // Religious statuary
          return {
            type: 'religious-figure',
            color: '#808080',
            material: 'stone',
            style: 'gothic'
          };
        } else if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
          // Renaissance sculpture
          return {
            type: 'renaissance-figure',
            color: '#F5F5DC',
            material: 'marble',
            style: 'renaissance'
          };
        } else {
          // Modern sculpture
          return {
            type: 'abstract',
            color: '#708090',
            material: 'metal',
            style: 'modern'
          };
        }

      case 'EAST_ASIAN':
        // Buddhist/Taoist statuary
        return {
          type: variant === 'figure' ? 'buddha' : 'guardian-lion',
          color: era === 'MODERN_ERA' ? '#708090' : '#CD853F',
          material: era === 'MODERN_ERA' ? 'metal' : 'bronze',
          style: 'asian'
        };

      case 'MENA':
        // Islamic geometric monuments (no figures)
        return {
          type: 'geometric-monument',
          color: '#F5DEB3',
          material: 'sandstone',
          style: 'islamic'
        };

      case 'SOUTH_ASIAN':
        // Hindu/Buddhist statuary
        return {
          type: variant === 'figure' ? 'deity' : 'temple-guardian',
          color: '#8B7355',
          material: 'sandstone',
          style: 'hindu-buddhist'
        };

      case 'SUB_SAHARAN_AFRICAN':
        // Carved figures and totems
        return {
          type: 'carved-figure',
          color: '#654321',
          material: 'wood',
          style: 'african'
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        // Stone monoliths and carved heads
        return {
          type: variant === 'monument' ? 'monolith' : 'carved-head',
          color: '#696969',
          material: 'stone',
          style: 'pre-columbian'
        };

      case 'OCEANIA':
        // Tiki and moai
        return {
          type: 'tiki',
          color: '#8B7355',
          material: variant === 'monument' ? 'stone' : 'wood',
          style: 'polynesian'
        };

      default:
        return {
          type: 'figure',
          color: '#808080',
          material: 'stone',
          style: 'generic'
        };
    }
  };

  const style = getStatueStyle();

  // Render different statue types
  if (style.type === 'classical-figure' || style.type === 'renaissance-figure') {
    // Classical human figure
    return (
      <g className="statue-symbol">
        {/* Pedestal */}
        <rect 
          x={20} 
          y={32} 
          width={10} 
          height={6} 
          fill="#696969"
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Figure body */}
        <ellipse 
          cx={25} 
          cy={24} 
          rx={4} 
          ry={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head */}
        <circle 
          cx={25} 
          cy={14} 
          r={3} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Arms */}
        <line x1={21} y1={20} x2={18} y2={24} stroke={style.color} strokeWidth={2} />
        <line x1={29} y1={20} x2={32} y2={24} stroke={style.color} strokeWidth={2} />
        
        {/* Classical drapery detail */}
        <path d="M 22 22 Q 25 26 28 22" stroke="#000000" strokeWidth={0.3} fill="none" opacity={0.5} />
      </g>
    );
  } else if (style.type === 'classical-bust') {
    // Bust on pedestal
    return (
      <g className="statue-symbol">
        {/* Pedestal */}
        <rect 
          x={19} 
          y={28} 
          width={12} 
          height={10} 
          fill="#696969"
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Bust base */}
        <rect 
          x={20} 
          y={24} 
          width={10} 
          height={4} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Shoulders */}
        <ellipse 
          cx={25} 
          cy={22} 
          rx={5} 
          ry={3} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head */}
        <circle 
          cx={25} 
          cy={16} 
          r={4} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Face detail */}
        <circle cx={23} cy={16} r={0.5} fill="#000000" opacity={0.5} />
        <circle cx={27} cy={16} r={0.5} fill="#000000" opacity={0.5} />
      </g>
    );
  } else if (style.type === 'buddha') {
    // Buddha statue
    return (
      <g className="statue-symbol">
        {/* Base/lotus */}
        <ellipse 
          cx={25} 
          cy={35} 
          rx={8} 
          ry={3} 
          fill="#FFD700"
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Body in meditation pose */}
        <ellipse 
          cx={25} 
          cy={26} 
          rx={6} 
          ry={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head with ushnisha */}
        <circle 
          cx={25} 
          cy={16} 
          r={4} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        <ellipse 
          cx={25} 
          cy={12} 
          rx={2} 
          ry={1} 
          fill={style.color}
        />
        
        {/* Hands in dhyana mudra */}
        <ellipse 
          cx={25} 
          cy={28} 
          rx={3} 
          ry={2} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.3}
        />
        
        {/* Halo */}
        <circle 
          cx={25} 
          cy={16} 
          r={6} 
          fill="none"
          stroke="#FFD700"
          strokeWidth={0.3}
          opacity={0.5}
        />
      </g>
    );
  } else if (style.type === 'geometric-monument') {
    // Islamic geometric monument
    return (
      <g className="statue-symbol">
        {/* Base */}
        <rect 
          x={18} 
          y={34} 
          width={14} 
          height={4} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Geometric pattern structure */}
        <polygon 
          points="25,10 32,20 32,34 18,34 18,20"
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Islamic geometric pattern */}
        <polygon 
          points="25,15 28,20 25,25 22,20"
          fill="none"
          stroke="#FFD700"
          strokeWidth={0.3}
        />
        <circle 
          cx={25} 
          cy={20} 
          r={3} 
          fill="none"
          stroke="#FFD700"
          strokeWidth={0.3}
        />
        
        {/* Calligraphy suggestion */}
        <line x1={20} y1={30} x2={30} y2={30} stroke="#000000" strokeWidth={0.3} opacity={0.5} />
        <line x1={21} y1={32} x2={29} y2={32} stroke="#000000" strokeWidth={0.3} opacity={0.5} />
      </g>
    );
  } else if (style.type === 'guardian-lion') {
    // Chinese guardian lion
    return (
      <g className="statue-symbol">
        {/* Base */}
        <rect 
          x={20} 
          y={34} 
          width={10} 
          height={4} 
          fill="#696969"
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Body */}
        <ellipse 
          cx={25} 
          cy={28} 
          rx={6} 
          ry={5} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head with mane */}
        <circle 
          cx={25} 
          cy={20} 
          r={5} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Mane curls */}
        <circle cx={21} cy={18} r={1.5} fill="none" stroke="#000000" strokeWidth={0.3} />
        <circle cx={29} cy={18} r={1.5} fill="none" stroke="#000000" strokeWidth={0.3} />
        <circle cx={25} cy={16} r={1.5} fill="none" stroke="#000000" strokeWidth={0.3} />
        
        {/* Ball under paw */}
        <circle 
          cx={22} 
          cy={32} 
          r={2} 
          fill="#FFD700"
          stroke="#000000"
          strokeWidth={0.3}
        />
      </g>
    );
  } else if (style.type === 'tiki') {
    // Polynesian tiki
    return (
      <g className="statue-symbol">
        {/* Body/post */}
        <rect 
          x={21} 
          y={20} 
          width={8} 
          height={18} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head */}
        <rect 
          x={19} 
          y={12} 
          width={12} 
          height={10} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Eyes */}
        <circle cx={22} cy={16} r={1.5} fill="#000000" />
        <circle cx={28} cy={16} r={1.5} fill="#000000" />
        
        {/* Mouth */}
        <rect x={23} y={19} width={4} height={1} fill="#000000" />
        
        {/* Carved patterns */}
        <path d="M 21 25 L 29 25 M 21 30 L 29 30 M 21 35 L 29 35" 
          stroke="#000000" 
          strokeWidth={0.3} 
          opacity={0.5} 
        />
      </g>
    );
  } else if (style.type === 'carved-figure') {
    // African carved figure
    return (
      <g className="statue-symbol">
        {/* Base */}
        <rect 
          x={22} 
          y={35} 
          width={6} 
          height={3} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Body with elongated proportions */}
        <ellipse 
          cx={25} 
          cy={27} 
          rx={3} 
          ry={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Head */}
        <ellipse 
          cx={25} 
          cy={16} 
          rx={3} 
          ry={4} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Geometric patterns */}
        <line x1={23} y1={24} x2={27} y2={24} stroke="#000000" strokeWidth={0.3} />
        <line x1={23} y1={27} x2={27} y2={27} stroke="#000000" strokeWidth={0.3} />
        <line x1={23} y1={30} x2={27} y2={30} stroke="#000000" strokeWidth={0.3} />
        
        {/* Eyes */}
        <circle cx={23.5} cy={15} r={0.5} fill="#000000" />
        <circle cx={26.5} cy={15} r={0.5} fill="#000000" />
      </g>
    );
  } else {
    // Abstract modern sculpture
    return (
      <g className="statue-symbol">
        {/* Base */}
        <rect 
          x={20} 
          y={35} 
          width={10} 
          height={3} 
          fill="#696969"
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Abstract form */}
        <path 
          d="M 25 10 Q 20 20 25 25 Q 30 30 25 35"
          fill="none"
          stroke={style.color}
          strokeWidth={4}
        />
        <circle 
          cx={25} 
          cy={20} 
          r={5} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        <rect 
          x={22} 
          y={17} 
          width={6} 
          height={6} 
          fill="#000000"
          opacity={0.3}
        />
      </g>
    );
  }
};