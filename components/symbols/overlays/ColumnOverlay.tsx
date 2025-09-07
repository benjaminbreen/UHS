/**
 * ColumnOverlay.tsx - SNES RPG-style column overlay
 * Classical architectural columns with cultural variations
 */
import React from 'react';

interface ColumnOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  rotation?: number;
}

const ColumnOverlay: React.FC<ColumnOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  rotation = 0
}) => {
  const getColumnStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era < 500) {
          return {
            base: '#F5F5DC', // Beige marble
            shaft: '#FFFAF0', // Floral white
            capital: '#FFD700', // Gold accent
            type: 'corinthian'
          };
        } else if (era < 1500) {
          return {
            base: '#808080', // Gray stone
            shaft: '#A9A9A9', // Dark gray
            capital: '#696969', // Dim gray
            type: 'romanesque'
          };
        }
        return {
          base: '#FFF8DC', // Cornsilk
          shaft: '#FFFFF0', // Ivory
          capital: '#B8860B', // Dark goldenrod
          type: 'ionic'
        };
      
      case 'MENA':
        return {
          base: '#DEB887', // Burlywood
          shaft: '#F5DEB3', // Wheat
          capital: '#4169E1', // Royal blue
          type: 'islamic'
        };
      
      case 'EAST_ASIAN':
        return {
          base: '#8B0000', // Dark red
          shaft: '#DC143C', // Crimson
          capital: '#FFD700', // Gold
          type: 'pagoda'
        };
      
      case 'SOUTH_ASIAN':
        return {
          base: '#CD5C5C', // Indian red
          shaft: '#F08080', // Light coral
          capital: '#FFD700', // Gold
          type: 'hindu'
        };
      
      default:
        return {
          base: '#808080', // Gray
          shaft: '#A9A9A9', // Dark gray
          capital: '#696969', // Dim gray
          type: 'simple'
        };
    }
  };
  
  const style = getColumnStyle();
  const centerX = x + size / 2;
  
  return (
    <g transform={`rotate(${rotation} ${centerX} ${y + size/2})`}>
      {/* Shadow at 45 degrees */}
      <ellipse 
        cx={centerX + size * 0.05} 
        cy={y + size * 0.85} 
        rx={size * 0.2} 
        ry={size * 0.06} 
        fill="#000000" 
        opacity={0.3} 
      />
      
      {/* Base platform */}
      <rect 
        x={centerX - size * 0.25} 
        y={y + size * 0.75} 
        width={size * 0.5} 
        height={size * 0.08} 
        fill={style.base}
        stroke="#000000"
        strokeWidth={0.5}
      />
      
      {style.type === 'corinthian' ? (
        <>
          {/* Fluted shaft */}
          <rect 
            x={centerX - size * 0.18} 
            y={y + size * 0.25} 
            width={size * 0.36} 
            height={size * 0.5} 
            fill={style.shaft}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Flutes */}
          {[-0.12, -0.06, 0, 0.06, 0.12].map((offset, i) => (
            <line 
              key={i}
              x1={centerX + size * offset} 
              y1={y + size * 0.25} 
              x2={centerX + size * offset} 
              y2={y + size * 0.75}
              stroke="#000000"
              strokeWidth={0.3}
              opacity={0.3}
            />
          ))}
          {/* Ornate capital */}
          <rect 
            x={centerX - size * 0.22} 
            y={y + size * 0.2} 
            width={size * 0.44} 
            height={size * 0.05} 
            fill={style.capital}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Scrolls */}
          <circle cx={centerX - size * 0.2} cy={y + size * 0.18} r={size * 0.03} fill={style.capital} stroke="#000000" strokeWidth={0.3} />
          <circle cx={centerX + size * 0.2} cy={y + size * 0.18} r={size * 0.03} fill={style.capital} stroke="#000000" strokeWidth={0.3} />
        </>
      ) : style.type === 'islamic' ? (
        <>
          {/* Twisted shaft */}
          <path 
            d={`M ${centerX - size * 0.15} ${y + size * 0.75}
                Q ${centerX - size * 0.18} ${y + size * 0.5} ${centerX - size * 0.15} ${y + size * 0.25}
                L ${centerX + size * 0.15} ${y + size * 0.25}
                Q ${centerX + size * 0.18} ${y + size * 0.5} ${centerX + size * 0.15} ${y + size * 0.75} Z`}
            fill={style.shaft}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Geometric patterns */}
          <rect x={centerX - size * 0.08} y={y + size * 0.4} width={size * 0.16} height={size * 0.08} fill={style.capital} opacity={0.5} />
          <rect x={centerX - size * 0.08} y={y + size * 0.55} width={size * 0.16} height={size * 0.08} fill={style.capital} opacity={0.5} />
          {/* Horseshoe arch capital */}
          <path 
            d={`M ${centerX - size * 0.2} ${y + size * 0.25}
                Q ${centerX} ${y + size * 0.15} ${centerX + size * 0.2} ${y + size * 0.25}`}
            fill={style.capital}
            stroke="#000000"
            strokeWidth={0.5}
          />
        </>
      ) : style.type === 'pagoda' ? (
        <>
          {/* Octagonal shaft */}
          <path 
            d={`M ${centerX - size * 0.12} ${y + size * 0.75}
                L ${centerX - size * 0.15} ${y + size * 0.65}
                L ${centerX - size * 0.15} ${y + size * 0.35}
                L ${centerX - size * 0.12} ${y + size * 0.25}
                L ${centerX + size * 0.12} ${y + size * 0.25}
                L ${centerX + size * 0.15} ${y + size * 0.35}
                L ${centerX + size * 0.15} ${y + size * 0.65}
                L ${centerX + size * 0.12} ${y + size * 0.75} Z`}
            fill={style.shaft}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Bracket capital */}
          <rect x={centerX - size * 0.25} y={y + size * 0.22} width={size * 0.5} height={size * 0.03} fill={style.capital} />
          <rect x={centerX - size * 0.22} y={y + size * 0.19} width={size * 0.44} height={size * 0.03} fill={style.capital} />
          {/* Gold accent */}
          <circle cx={centerX} cy={y + size * 0.5} r={size * 0.02} fill={style.capital} />
        </>
      ) : (
        <>
          {/* Simple cylindrical shaft */}
          <rect 
            x={centerX - size * 0.15} 
            y={y + size * 0.25} 
            width={size * 0.3} 
            height={size * 0.5} 
            fill={style.shaft}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Simple capital */}
          <rect 
            x={centerX - size * 0.18} 
            y={y + size * 0.22} 
            width={size * 0.36} 
            height={size * 0.03} 
            fill={style.capital}
            stroke="#000000"
            strokeWidth={0.5}
          />
        </>
      )}
      
      {/* Top surface */}
      <ellipse 
        cx={centerX} 
        cy={y + size * 0.23} 
        rx={size * 0.18} 
        ry={size * 0.05} 
        fill={style.shaft}
        stroke="#000000"
        strokeWidth={0.5}
      />
    </g>
  );
};

export default ColumnOverlay;