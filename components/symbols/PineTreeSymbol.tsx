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
  const showSnow = season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE);

  return (
    <g>
      <polygon points={`12,${y1} ${p1_x1},${p1_y1} ${p1_x2},${p1_y2}`} fill="#22543d" />
      <polygon points={`12,${y1} ${p2_x1},${p2_y1} ${p2_x2},${p2_y2}`} fill="#2f855a" />
      <polygon points={`12,${y1} ${p3_x1},${p3_y1} ${p3_x2},${p3_y2}`} fill="#48bb78" />
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