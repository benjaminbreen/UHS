/**
 * components/symbols/PineTreeSymbol.tsx - Renders a stylized pine tree
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { Season, ClimateType } from '../../types';

interface PineTreeSymbolProps {
  seed: number;
  season: Season;
  climate: ClimateType;
}

const PineTreeSymbol: React.FC<PineTreeSymbolProps> = React.memo(({ seed, season, climate }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);

  const y1 = 2 + localRand() * 1.5;
  
  const p1_x1 = 4 + localRand() - 0.5;
  const p1_y1 = 18 + localRand() - 0.5;
  const p1_x2 = 20 - (localRand() - 0.5);
  const p1_y2 = 18 + localRand() - 0.5;
  
  const p2_x1 = 6 + localRand() - 0.5;
  const p2_y1 = 14 + localRand() - 0.5;
  const p2_x2 = 18 - (localRand() - 0.5);
  const p2_y2 = 14 + localRand() - 0.5;
  
  const p3_x1 = 8 + localRand() - 0.5;
  const p3_y1 = 10 + localRand() - 0.5;
  const p3_x2 = 16 - (localRand() - 0.5);
  const p3_y2 = 10 + localRand() - 0.5;
  
  const trunkWidth = 3.5 + localRand();
  const trunkHeight = 4 + localRand();
  
  const trunkX = 12 - trunkWidth / 2;
  const trunkY = 18;
  const uniqueSeed = Math.round(seed);

  const showSnow = season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE);

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`pineGradient1-${uniqueSeed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#276749" />
          <stop offset="100%" stopColor="#22543d" />
        </linearGradient>
        <linearGradient id={`pineGradient2-${uniqueSeed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#38a169" />
          <stop offset="100%" stopColor="#2f855a" />
        </linearGradient>
        <linearGradient id={`pineGradient3-${uniqueSeed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#68d391" />
          <stop offset="100%" stopColor="#48bb78" />
        </linearGradient>
      </defs>
      <polygon points={`12,${y1} ${p1_x1},${p1_y1} ${p1_x2},${p1_y2}`} fill={`url(#pineGradient1-${uniqueSeed})`} />
      <polygon points={`12,${y1} ${p2_x1},${p2_y1} ${p2_x2},${p2_y2}`} fill={`url(#pineGradient2-${uniqueSeed})`} />
      <polygon points={`12,${y1} ${p3_x1},${p3_y1} ${p3_x2},${p3_y2}`} fill={`url(#pineGradient3-${uniqueSeed})`} />
      <rect x={trunkX} y={trunkY} width={trunkWidth} height={trunkHeight} fill="#693c24" />

      {showSnow && (
          <g opacity="0.85">
              <polygon points={`12,${y1 + 1} ${p1_x1 + 1},${p1_y1} ${p1_x2 - 1},${p1_y1}`} fill="white" />
              <polygon points={`12,${y1 + 1} ${p2_x1 + 1},${p2_y1} ${p2_x2 - 1},${p2_y1}`} fill="white" />
              <polygon points={`12,${y1 + 1} ${p3_x1 + 1},${p3_y1} ${p3_x2 - 1},${p3_y1}`} fill="white" />
          </g>
      )}
    </g>
  );
});

export default PineTreeSymbol;