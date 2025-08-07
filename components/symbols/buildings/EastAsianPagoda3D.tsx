/**
 * components/symbols/buildings/EastAsianPagoda3D.tsx - Renders a detailed, painterly East Asian pagoda.
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface EastAsianPagoda3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  era: HistoricalEra;
}

// Helper function to determine era progression
const getEraLevel = (era: HistoricalEra): number => {
  switch (era) {
    case HistoricalEra.PREHISTORY: return 0;
    case HistoricalEra.ANTIQUITY: return 1;
    case HistoricalEra.MEDIEVAL: return 2;
    case HistoricalEra.RENAISSANCE_EARLY_MODERN: return 3;
    case HistoricalEra.INDUSTRIAL_ERA: return 4;
    case HistoricalEra.MODERN_ERA: return 5;
    case HistoricalEra.FUTURE_ERA: return 6;
    default: return 2;
  }
};

const EastAsianPagoda3D: React.FC<EastAsianPagoda3DProps> = React.memo(({ x, y, size, era, seed, tile }) => {
  // Memoize random values to ensure they're truly static
  const staticValues = React.useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + offset).random();
    return {
      localRand,
      tiers: tile.biome === BiomeType.CITY_CENTER ? 5 : 2 + Math.floor(localRand() * 2)
    };
  }, [seed, tile.biome]);
  
  const eraLevel = getEraLevel(era);
  const { tiers, localRand } = staticValues;
  
  return (
    <g className="buddhist-temple-3d">
      <defs>
        <filter id={`templeGlow-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`templeRoof-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DC143C" />
          <stop offset="50%" stopColor="#B22222" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
        <linearGradient id={`templeWall-${seed}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF8DC" />
          <stop offset="50%" stopColor="#F5DEB3" />
          <stop offset="100%" stopColor="#DEB887" />
        </linearGradient>
        <radialGradient id={`lotus-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB6C1" />
          <stop offset="70%" stopColor="#FF69B4" />
          <stop offset="100%" stopColor="#DC143C" />
        </radialGradient>
      </defs>

      <g filter={`url(#templeGlow-${seed})`}>
        {/* Main temple building */}
        <rect
          x={x + size * 0.2}
          y={y + size * 0.3}
          width={size * 0.6}
          height={size * 0.5}
          fill={`url(#templeWall-${seed})`}
          stroke="#D2691E"
          strokeWidth="0.5"
        />
        
        {/* Multi-tiered pagoda roof */}
        {Array.from({ length: tiers }).map((_, tier) => {
          const roofY = y + size * (0.3 - tier * 0.08);
          const roofWidth = size * (0.7 - tier * 0.1);
          const roofX = x + (size - roofWidth) / 2;
          
          return (
            <g key={`roof-tier-${tier}`}>
              <path
                d={`M ${roofX - size * 0.05} ${roofY} L ${roofX + roofWidth/2} ${roofY - size * 0.08} L ${roofX + roofWidth + size * 0.05} ${roofY} Z`}
                fill={`url(#templeRoof-${seed})`}
                stroke="#8B0000"
                strokeWidth="0.3"
              />
              {/* Upturned edges */}
              <path
                d={`M ${roofX - size * 0.05} ${roofY} Q ${roofX - size * 0.03} ${roofY - size * 0.02} ${roofX - size * 0.01} ${roofY - size * 0.01}`}
                fill="none"
                stroke="#FFD700"
                strokeWidth="0.5"
              />
              <path
                d={`M ${roofX + roofWidth + size * 0.05} ${roofY} Q ${roofX + roofWidth + size * 0.03} ${roofY - size * 0.02} ${roofX + roofWidth + size * 0.01} ${roofY - size * 0.01}`}
                fill="none"
                stroke="#FFD700"
                strokeWidth="0.5"
              />
            </g>
          );
        })}
        
        {/* Temple entrance */}
        <rect
          x={x + size * 0.45}
          y={y + size * 0.65}
          width={size * 0.1}
          height={size * 0.15}
          fill="rgba(0,0,0,0.6)"
          rx={size * 0.02}
        />
        
        {/* Guardian lion statues (if advanced era) */}
        {eraLevel >= 2 && (
          <g>
            <circle cx={x + size * 0.3} cy={y + size * 0.75} r={size * 0.04} fill="#A0522D" />
            <circle cx={x + size * 0.7} cy={y + size * 0.75} r={size * 0.04} fill="#A0522D" />
          </g>
        )}
        
        {/* Incense burner */}
        <rect
          x={x + size * 0.47}
          y={y + size * 0.8}
          width={size * 0.06}
          height={size * 0.04}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="0.2"
        />
        
        {/* Incense smoke */}
        {Array.from({ length: 3 }).map((_, i) => (
          <circle
            key={`smoke-${i}`}
            cx={x + size * 0.5 + (localRand(i) - 0.5) * size * 0.05}
            cy={y + size * (0.78 - i * 0.05)}
            r={size * (0.01 + i * 0.005)}
            fill="rgba(200,200,200,0.6)"
            className="animate-smoke"
          />
        ))}
        
        {/* Lotus pond (if space allows) */}
        {size > 20 && (
          <g>
            <ellipse
              cx={x + size * 0.15}
              cy={y + size * 0.85}
              rx={size * 0.1}
              ry={size * 0.06}
              fill="rgba(70, 130, 180, 0.6)"
            />
            <circle
              cx={x + size * 0.15}
              cy={y + size * 0.85}
              r={size * 0.03}
              fill={`url(#lotus-${seed})`}
            />
          </g>
        )}
        
        {/* Prayer flags (if appropriate era) */}
        {eraLevel >= 1 && Array.from({ length: 5 }).map((_, i) => {
          const flagColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
          return (
            <rect
              key={`flag-${i}`}
              x={x + size * 0.1 + i * size * 0.15}
              y={y + size * 0.05}
              width={size * 0.08}
              height={size * 0.06}
              fill={flagColors[i]}
              opacity="0.7"
              stroke="#000"
              strokeWidth="0.2"
            />
          );
        })}
      </g>
    </g>
  );
});


export default EastAsianPagoda3D;