/**
 * components/symbols/SaltFlatsSymbol.tsx - Renders a cracked earth pattern for salt flats.
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface SaltFlatsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tileX: number;
  tileY: number;
}

const SaltFlatsSymbol: React.FC<SaltFlatsSymbolProps> = React.memo(({ x, y, size, seed, tileX, tileY }) => {
    const uniqueId = `salt-flats-${tileX}-${tileY}`;
    const crackColor = `rgba(200, 200, 210, 0.6)`;
    
    // Generate some points for Voronoi-like cracks
    const points = Array.from({ length: 5 }, (_, index) => ({
        x: new ValueNoise(seed + tileX * 11 + tileY * 13 + index).random() * size,
        y: new ValueNoise(seed + tileX * 17 + tileY * 19 + index * 2).random() * size,
    }));

    const pathD = points.map((p, i) => {
        const next = points[(i + 1) % points.length];
        const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 };
        return `M ${mid.x} ${mid.y} L ${size / 2} ${size / 2}`;
    }).join(' ');

    return (
      <g>
        <defs>
          <pattern id={uniqueId} patternUnits="userSpaceOnUse" width={size} height={size}>
            <rect width={size} height={size} fill="transparent" />
            <path d={pathD} stroke={crackColor} strokeWidth={size * 0.02} fill="none"/>
          </pattern>
        </defs>
        <rect x={x} y={y} width={size} height={size} fill={`url(#${uniqueId})`} />
      </g>
    );
});

export default SaltFlatsSymbol;