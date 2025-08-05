/**
 * components/symbols/MangroveSymbol.tsx - Renders a stylized mangrove symbol
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { Tile } from '../../types';

interface MangroveSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: Tile;
  tileX?: number;
  tileY?: number;
}

const MangroveSymbol: React.FC<MangroveSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, tileX, tileY 
}) => {
  const localRand = new ValueNoise(seed + (x || 0) * 45 + (y || 0) * 67).random;
  const elements = [];
  const numTrees = 2 + Math.floor(localRand() * 2);

  for (let i = 0; i < numTrees; i++) {
    const treeX = x + 5 + localRand() * (size - 10);
    const trunkHeight = 6 + localRand() * 4;
    const trunkY = y + size - 4 - trunkHeight;

    // Prop roots
    for (let j = 0; j < 3 + Math.floor(localRand() * 3); j++) {
      const rootAngle = (Math.PI / 2) + (localRand() - 0.5) * 1.5;
      const rootLength = 4 + localRand() * 3;
      elements.push(
        <line
          key={`root-${i}-${j}`}
          x1={treeX}
          y1={y + size - 4}
          x2={treeX + Math.cos(rootAngle) * rootLength}
          y2={y + size - 4 - Math.sin(rootAngle) * rootLength}
          stroke="#8B7355"
          strokeWidth="1.2"
        />
      );
    }

    // Trunk
    elements.push(
      <rect 
        key={`trunk-${i}`} 
        x={treeX - 1} 
        y={trunkY} 
        width="2" 
        height={trunkHeight} 
        fill="#70543E" 
      />
    );

    // Canopy
    const canopyRadius = 4 + localRand() * 2;
    elements.push(
      <circle 
        key={`canopy-${i}`} 
        cx={treeX} 
        cy={trunkY} 
        r={canopyRadius} 
        fill="#2E8B57" 
      />
    );
    elements.push(
      <circle 
        key={`canopy-highlight-${i}`} 
        cx={treeX - 1} 
        cy={trunkY - 1} 
        r={canopyRadius * 0.5} 
        fill="#3CB371" 
        opacity="0.7"
      />
    );
  }

  return <g filter="url(#symbolShadow)">{elements}</g>;
});

export default MangroveSymbol;