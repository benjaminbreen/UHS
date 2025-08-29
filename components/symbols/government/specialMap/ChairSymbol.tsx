/**
 * components/symbols/government/specialMap/ChairSymbol.tsx
 * Chair symbols for special maps that vary by cultural zone and era
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface ChairSymbolProps {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  variant?: 'simple' | 'throne' | 'cushion' | 'bench';
}

export const ChairSymbol: React.FC<ChairSymbolProps> = ({ 
  culturalZone, 
  era, 
  variant = 'simple' 
}) => {
  const getChairStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'ANTIQUITY') {
          // Roman curule chair or klismos
          return {
            type: 'curved-legs',
            color: '#8B4513',
            material: 'bronze-wood',
            hasBack: true,
            hasCushion: true
          };
        } else if (era === 'MEDIEVAL') {
          // Heavy wooden chair or throne
          return {
            type: variant === 'throne' ? 'high-backed-throne' : 'wooden-chair',
            color: '#654321',
            material: 'oak',
            hasBack: true,
            hasArms: variant === 'throne'
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN') {
          // Ornate upholstered chair
          return {
            type: 'upholstered',
            color: '#8B0000',
            material: 'velvet-wood',
            hasBack: true,
            hasArms: true,
            decorative: true
          };
        } else {
          // Modern chair
          return {
            type: 'modern',
            color: '#696969',
            material: 'metal-plastic',
            hasBack: true
          };
        }

      case 'EAST_ASIAN':
        if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
          // Floor cushions or low stools
          return {
            type: variant === 'cushion' ? 'zabuton' : 'low-stool',
            color: variant === 'cushion' ? '#DC143C' : '#8B4513',
            material: variant === 'cushion' ? 'silk' : 'bamboo',
            hasBack: false
          };
        } else {
          return {
            type: 'modern',
            color: '#2F4F4F',
            material: 'modern',
            hasBack: true
          };
        }

      case 'MENA':
        // Floor cushions, divans, or low stools
        if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
          return {
            type: variant === 'bench' ? 'divan' : 'cushion',
            color: '#8B008B',
            material: 'cushioned',
            hasBack: variant === 'bench',
            decorative: true
          };
        } else {
          return {
            type: 'modern',
            color: '#696969',
            material: 'modern',
            hasBack: true
          };
        }

      case 'SOUTH_ASIAN':
        // Floor seating or low carved chairs
        return {
          type: era === 'MODERN_ERA' ? 'chair' : 'floor-cushion',
          color: '#DC143C',
          material: 'silk-cotton',
          hasBack: era === 'MODERN_ERA',
          decorative: true
        };

      case 'SUB_SAHARAN_AFRICAN':
        // Carved stools or modern chairs
        return {
          type: era === 'MODERN_ERA' ? 'chair' : 'carved-stool',
          color: '#654321',
          material: 'carved-wood',
          hasBack: era === 'MODERN_ERA',
          decorative: true
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        // Stone seats or woven seats
        return {
          type: variant === 'throne' ? 'stone-throne' : 'woven-seat',
          color: variant === 'throne' ? '#696969' : '#DEB887',
          material: variant === 'throne' ? 'stone' : 'woven-reed',
          hasBack: variant === 'throne'
        };

      case 'OCEANIA':
        // Woven mats or carved stools
        return {
          type: 'mat',
          color: '#D2B48C',
          material: 'woven',
          hasBack: false
        };

      default:
        return {
          type: 'simple-chair',
          color: '#8B4513',
          material: 'wood',
          hasBack: true
        };
    }
  };

  const style = getChairStyle();

  // Render different chair types
  if (style.type === 'cushion' || style.type === 'zabuton' || style.type === 'floor-cushion') {
    // Floor cushion
    return (
      <g className="chair-symbol">
        {/* Cushion base */}
        <ellipse 
          cx={25} 
          cy={28} 
          rx={12} 
          ry={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Cushion detail */}
        <ellipse 
          cx={25} 
          cy={26} 
          rx={10} 
          ry={6} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.3}
          opacity={0.8}
        />
        
        {/* Decorative pattern */}
        {style.decorative && (
          <circle cx={25} cy={26} r={3} fill="none" stroke="#FFD700" strokeWidth={0.3} opacity={0.6} />
        )}
      </g>
    );
  } else if (style.type === 'mat') {
    // Woven mat
    return (
      <g className="chair-symbol">
        <rect 
          x={15} 
          y={20} 
          width={20} 
          height={15} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Weave pattern */}
        {[22, 25, 28, 31].map(y => (
          <line key={y} x1={15} y1={y} x2={35} y2={y} stroke="#8B7355" strokeWidth={0.3} opacity={0.5} />
        ))}
        {[18, 21, 24, 27, 30, 33].map(x => (
          <line key={x} x1={x} y1={20} x2={x} y2={35} stroke="#8B7355" strokeWidth={0.3} opacity={0.5} />
        ))}
      </g>
    );
  } else if (style.type === 'carved-stool' || style.type === 'low-stool') {
    // African/Asian carved stool
    return (
      <g className="chair-symbol">
        {/* Seat */}
        <ellipse 
          cx={25} 
          cy={22} 
          rx={10} 
          ry={6} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Carved legs */}
        <path 
          d="M 20 24 L 19 32 M 30 24 L 31 32 M 25 24 L 25 32"
          stroke={style.color}
          strokeWidth={2}
          opacity={0.8}
        />
        
        {/* Carved decoration */}
        {style.decorative && (
          <>
            <circle cx={20} cy={22} r={1.5} fill="none" stroke="#4A3C2A" strokeWidth={0.3} opacity={0.5} />
            <circle cx={30} cy={22} r={1.5} fill="none" stroke="#4A3C2A" strokeWidth={0.3} opacity={0.5} />
          </>
        )}
      </g>
    );
  } else if (style.type === 'high-backed-throne') {
    // Medieval/royal throne
    return (
      <g className="chair-symbol">
        {/* High back */}
        <rect 
          x={18} 
          y={8} 
          width={14} 
          height={20} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Seat */}
        <rect 
          x={17} 
          y={25} 
          width={16} 
          height={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Arms */}
        <rect x={15} y={23} width={3} height={8} fill={style.color} opacity={0.8} />
        <rect x={32} y={23} width={3} height={8} fill={style.color} opacity={0.8} />
        
        {/* Decorative crown on top */}
        <polygon 
          points="20,8 22,5 25,7 28,5 30,8"
          fill="#FFD700"
          stroke="#000000"
          strokeWidth={0.3}
        />
        
        {/* Legs */}
        <rect x={18} y={33} width={2} height={5} fill={style.color} opacity={0.7} />
        <rect x={30} y={33} width={2} height={5} fill={style.color} opacity={0.7} />
      </g>
    );
  } else if (style.type === 'divan') {
    // Middle Eastern divan/bench
    return (
      <g className="chair-symbol">
        {/* Long cushioned seat */}
        <rect 
          x={10} 
          y={24} 
          width={30} 
          height={10} 
          rx={2}
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Back cushions */}
        <rect 
          x={10} 
          y={18} 
          width={30} 
          height={7} 
          rx={2}
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
          opacity={0.8}
        />
        
        {/* Decorative pattern */}
        <path 
          d="M 15 28 Q 25 26 35 28"
          stroke="#FFD700"
          strokeWidth={0.3}
          fill="none"
          opacity={0.6}
        />
        
        {/* Ornate legs */}
        <ellipse cx={15} cy={35} rx={2} ry={1} fill={style.color} opacity={0.7} />
        <ellipse cx={35} cy={35} rx={2} ry={1} fill={style.color} opacity={0.7} />
      </g>
    );
  } else {
    // Standard chair with back
    return (
      <g className="chair-symbol">
        {/* Back */}
        {style.hasBack && (
          <rect 
            x={20} 
            y={15} 
            width={10} 
            height={12} 
            fill={style.color}
            stroke="#000000"
            strokeWidth={0.5}
          />
        )}
        
        {/* Seat */}
        <rect 
          x={18} 
          y={25} 
          width={14} 
          height={8} 
          fill={style.color}
          stroke="#000000"
          strokeWidth={0.5}
        />
        
        {/* Arms */}
        {style.hasArms && (
          <>
            <rect x={16} y={23} width={3} height={8} fill={style.color} opacity={0.8} />
            <rect x={31} y={23} width={3} height={8} fill={style.color} opacity={0.8} />
          </>
        )}
        
        {/* Upholstery detail */}
        {style.type === 'upholstered' && (
          <>
            <rect x={19} y={26} width={12} height={6} fill={style.color} opacity={0.6} rx={1} />
            <circle cx={25} cy={20} r={1} fill="#FFD700" opacity={0.5} />
          </>
        )}
        
        {/* Legs */}
        <rect x={19} y={33} width={2} height={5} fill={style.color} opacity={0.7} />
        <rect x={29} y={33} width={2} height={5} fill={style.color} opacity={0.7} />
      </g>
    );
  }
};