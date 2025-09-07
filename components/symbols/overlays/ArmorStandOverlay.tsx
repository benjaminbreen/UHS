/**
 * ArmorStandOverlay.tsx - SNES RPG-style armor stand overlay
 * 3/4 perspective with consistent 45-degree shadows
 */
import React from 'react';

interface ArmorStandOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  rotation?: number;
}

const ArmorStandOverlay: React.FC<ArmorStandOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  rotation = 0
}) => {
  const getArmorStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          helmet: '#8B0000', // Samurai red
          chest: '#2F4F4F', // Dark slate gray
          accent: '#FFD700', // Gold trim
          type: 'samurai'
        };
      case 'MENA':
        return {
          helmet: '#C0C0C0', // Silver
          chest: '#4682B4', // Steel blue
          accent: '#FFD700', // Gold
          type: 'mamluk'
        };
      case 'EUROPEAN':
        if (era < 1000) {
          return {
            helmet: '#696969', // Chain mail gray
            chest: '#8B4513', // Leather brown
            accent: '#C0C0C0', // Silver
            type: 'medieval'
          };
        }
        return {
          helmet: '#C0C0C0', // Plate silver
          chest: '#778899', // Light slate gray
          accent: '#FFD700', // Gold
          type: 'knight'
        };
      default:
        return {
          helmet: '#8B4513', // Leather
          chest: '#654321', // Dark brown
          accent: '#CD853F', // Tan
          type: 'leather'
        };
    }
  };
  
  const style = getArmorStyle();
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Stand base - wooden cross */}
      <rect x={size * 0.45} y={size * 0.2} width={size * 0.1} height={size * 0.6} fill="#654321" />
      <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.08} fill="#654321" />
      
      {/* Shadow at 45 degrees */}
      <ellipse 
        cx={size * 0.55} 
        cy={size * 0.85} 
        rx={size * 0.25} 
        ry={size * 0.08} 
        fill="#000000" 
        opacity={0.3} 
      />
      
      {style.type === 'samurai' ? (
        <>
          {/* Samurai helmet */}
          <path 
            d={`M ${size * 0.35} ${size * 0.25} 
                Q ${size * 0.5} ${size * 0.15} ${size * 0.65} ${size * 0.25}
                L ${size * 0.65} ${size * 0.35}
                L ${size * 0.35} ${size * 0.35} Z`}
            fill={style.helmet}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Helmet horns */}
          <path d={`M ${size * 0.3} ${size * 0.25} L ${size * 0.25} ${size * 0.15}`} stroke={style.accent} strokeWidth={2} />
          <path d={`M ${size * 0.7} ${size * 0.25} L ${size * 0.75} ${size * 0.15}`} stroke={style.accent} strokeWidth={2} />
          
          {/* Chest armor - lamellar plates */}
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.25} fill={style.chest} stroke="#000000" strokeWidth={0.5} />
          {/* Plate lines */}
          {[0, 1, 2, 3].map(i => (
            <line 
              key={i}
              x1={size * 0.35} 
              y1={size * (0.42 + i * 0.05)} 
              x2={size * 0.65} 
              y2={size * (0.42 + i * 0.05)}
              stroke="#000000"
              strokeWidth={0.3}
            />
          ))}
          {/* Shoulder guards */}
          <rect x={size * 0.28} y={size * 0.38} width={size * 0.08} height={size * 0.15} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
          <rect x={size * 0.64} y={size * 0.38} width={size * 0.08} height={size * 0.15} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
        </>
      ) : style.type === 'knight' ? (
        <>
          {/* Knight helmet */}
          <rect x={size * 0.4} y={size * 0.2} width={size * 0.2} height={size * 0.15} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
          {/* Visor slit */}
          <rect x={size * 0.42} y={size * 0.25} width={size * 0.16} height={size * 0.02} fill="#000000" />
          {/* Plume */}
          <ellipse cx={size * 0.5} cy={size * 0.18} rx={size * 0.05} ry={size * 0.08} fill="#DC143C" opacity={0.7} />
          
          {/* Chest plate */}
          <path 
            d={`M ${size * 0.35} ${size * 0.4}
                Q ${size * 0.5} ${size * 0.38} ${size * 0.65} ${size * 0.4}
                L ${size * 0.65} ${size * 0.65}
                Q ${size * 0.5} ${size * 0.68} ${size * 0.35} ${size * 0.65} Z`}
            fill={style.chest}
            stroke="#000000"
            strokeWidth={0.5}
          />
          {/* Center ridge */}
          <line x1={size * 0.5} y1={size * 0.4} x2={size * 0.5} y2={size * 0.65} stroke={style.accent} strokeWidth={1} />
          {/* Pauldrons */}
          <circle cx={size * 0.3} cy={size * 0.4} r={size * 0.06} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
          <circle cx={size * 0.7} cy={size * 0.4} r={size * 0.06} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
        </>
      ) : (
        <>
          {/* Simple helmet */}
          <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.08} fill={style.helmet} stroke="#000000" strokeWidth={0.5} />
          
          {/* Simple chest piece */}
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.25} fill={style.chest} stroke="#000000" strokeWidth={0.5} />
          {/* Buckles */}
          <rect x={size * 0.48} y={size * 0.45} width={size * 0.04} height={size * 0.04} fill={style.accent} />
          <rect x={size * 0.48} y={size * 0.55} width={size * 0.04} height={size * 0.04} fill={style.accent} />
        </>
      )}
      
      {/* Stand details */}
      <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.015} fill="#000000" opacity={0.5} />
    </g>
  );
};

export default ArmorStandOverlay;