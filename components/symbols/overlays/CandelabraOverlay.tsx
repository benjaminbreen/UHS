/**
 * CandelabraOverlay.tsx - SNES RPG-style candelabra overlay
 * Multi-candle holders with cultural variations
 */
import React from 'react';

interface CandelabraOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
}

const CandelabraOverlay: React.FC<CandelabraOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0
}) => {
  const getCandelabraStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          base: '#B8860B', // Dark goldenrod
          candles: '#FFFACD', // Lemon chiffon
          flame: '#FFA500', // Orange
          type: 'gothic'
        };
      case 'MENA':
      case 'SOUTH_ASIAN':
        return {
          base: '#CD7F32', // Bronze
          candles: '#F5DEB3', // Wheat (oil lamps)
          flame: '#FF6347', // Tomato
          type: 'oil_lamp'
        };
      case 'EAST_ASIAN':
        return {
          base: '#8B0000', // Dark red
          candles: '#FFE4B5', // Moccasin
          flame: '#FFD700', // Gold
          type: 'lantern'
        };
      default:
        return {
          base: '#696969',
          candles: '#F5F5F5',
          flame: '#FF8C00',
          type: 'simple'
        };
    }
  };
  
  const style = getCandelabraStyle();
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Shadow at 45 degrees */}
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.85} 
        rx={size * 0.15} 
        ry={size * 0.05} 
        fill="#000000" 
        opacity={0.2} 
      />
      
      {style.type === 'gothic' ? (
        <>
          {/* Gothic candelabra with 3 candles */}
          {/* Base */}
          <rect x={size * 0.35} y={size * 0.75} width={size * 0.3} height={size * 0.05} fill={style.base} />
          <rect x={size * 0.45} y={size * 0.7} width={size * 0.1} height={size * 0.1} fill={style.base} />
          
          {/* Arms */}
          <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.03} fill={style.base} />
          
          {/* Candles */}
          <rect x={size * 0.28} y={size * 0.5} width={size * 0.04} height={size * 0.15} fill={style.candles} />
          <rect x={size * 0.48} y={size * 0.45} width={size * 0.04} height={size * 0.2} fill={style.candles} />
          <rect x={size * 0.68} y={size * 0.5} width={size * 0.04} height={size * 0.15} fill={style.candles} />
          
          {/* Flames */}
          <ellipse cx={size * 0.3} cy={size * 0.47} rx={size * 0.025} ry={size * 0.04} fill={style.flame} />
          <ellipse cx={size * 0.5} cy={size * 0.42} rx={size * 0.025} ry={size * 0.04} fill={style.flame} />
          <ellipse cx={size * 0.7} cy={size * 0.47} rx={size * 0.025} ry={size * 0.04} fill={style.flame} />
          
          {/* Inner flame */}
          <ellipse cx={size * 0.3} cy={size * 0.48} rx={size * 0.01} ry={size * 0.02} fill="#FFFF00" />
          <ellipse cx={size * 0.5} cy={size * 0.43} rx={size * 0.01} ry={size * 0.02} fill="#FFFF00" />
          <ellipse cx={size * 0.7} cy={size * 0.48} rx={size * 0.01} ry={size * 0.02} fill="#FFFF00" />
        </>
      ) : style.type === 'oil_lamp' ? (
        <>
          {/* Middle Eastern/Indian oil lamp (diya) */}
          {/* Bowl shape */}
          <path 
            d={`M ${size * 0.3} ${size * 0.65}
                Q ${size * 0.3} ${size * 0.75} ${size * 0.5} ${size * 0.75}
                Q ${size * 0.7} ${size * 0.75} ${size * 0.7} ${size * 0.65}
                L ${size * 0.65} ${size * 0.6}
                L ${size * 0.35} ${size * 0.6} Z`}
            fill={style.base}
            stroke="#000000"
            strokeWidth={0.5}
          />
          
          {/* Oil surface */}
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.15} ry={size * 0.05} fill={style.candles} opacity={0.7} />
          
          {/* Multiple wicks */}
          <circle cx={size * 0.4} cy={size * 0.63} r={size * 0.01} fill="#654321" />
          <circle cx={size * 0.5} cy={size * 0.63} r={size * 0.01} fill="#654321" />
          <circle cx={size * 0.6} cy={size * 0.63} r={size * 0.01} fill="#654321" />
          
          {/* Flames */}
          <ellipse cx={size * 0.4} cy={size * 0.58} rx={size * 0.02} ry={size * 0.03} fill={style.flame} />
          <ellipse cx={size * 0.5} cy={size * 0.58} rx={size * 0.02} ry={size * 0.03} fill={style.flame} />
          <ellipse cx={size * 0.6} cy={size * 0.58} rx={size * 0.02} ry={size * 0.03} fill={style.flame} />
        </>
      ) : style.type === 'lantern' ? (
        <>
          {/* East Asian paper lantern style */}
          {/* Stand */}
          <rect x={size * 0.48} y={size * 0.7} width={size * 0.04} height={size * 0.1} fill={style.base} />
          <rect x={size * 0.4} y={size * 0.78} width={size * 0.2} height={size * 0.02} fill={style.base} />
          
          {/* Lantern frame */}
          <rect x={size * 0.35} y={size * 0.45} width={size * 0.3} height={size * 0.25} fill={style.base} stroke="#000000" strokeWidth={0.5} />
          
          {/* Paper panels */}
          <rect x={size * 0.37} y={size * 0.47} width={size * 0.26} height={size * 0.21} fill={style.candles} opacity={0.8} />
          
          {/* Inner glow */}
          <circle cx={size * 0.5} cy={size * 0.58} r={size * 0.08} fill={style.flame} opacity={0.5} />
          
          {/* Candle inside */}
          <rect x={size * 0.49} y={size * 0.6} width={size * 0.02} height={size * 0.05} fill="#FFFFFF" opacity={0.8} />
          <ellipse cx={size * 0.5} cy={size * 0.58} rx={size * 0.015} ry={size * 0.025} fill={style.flame} />
        </>
      ) : (
        <>
          {/* Simple candelabra */}
          <rect x={size * 0.4} y={size * 0.7} width={size * 0.2} height={size * 0.1} fill={style.base} />
          <rect x={size * 0.48} y={size * 0.5} width={size * 0.04} height={size * 0.2} fill={style.candles} />
          <ellipse cx={size * 0.5} cy={size * 0.47} rx={size * 0.025} ry={size * 0.04} fill={style.flame} />
        </>
      )}
    </g>
  );
};

export default CandelabraOverlay;