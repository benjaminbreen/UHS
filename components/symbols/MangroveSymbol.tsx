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

  // Water surface with ripples
  elements.push(
    <ellipse
      key="water-surface"
      cx={x + size/2}
      cy={y + size - 2}
      rx={size * 0.45}
      ry={2}
      fill="#4a8090"
      opacity="0.3"
    />
  );

  for (let i = 0; i < numTrees; i++) {
    const treeX = x + 8 + localRand() * (size - 16);
    const trunkHeight = 8 + localRand() * 4;
    const trunkY = y + size - 5 - trunkHeight;

    // Complex aerial prop roots (characteristic of mangroves)
    const numRoots = 5 + Math.floor(localRand() * 4);
    for (let j = 0; j < numRoots; j++) {
      const rootStartY = trunkY + trunkHeight * (0.3 + localRand() * 0.4);
      const rootAngle = (Math.PI / 3) + (j / numRoots) * (Math.PI / 3) + (localRand() - 0.5) * 0.3;
      const rootLength = 6 + localRand() * 4;
      const rootEndX = treeX + Math.cos(rootAngle) * rootLength * (j < numRoots/2 ? -1 : 1);
      const rootEndY = y + size - 3;
      
      // Curved aerial root using quadratic bezier
      const controlX = (treeX + rootEndX) / 2 + (localRand() - 0.5) * 3;
      const controlY = rootStartY + 2;
      
      elements.push(
        <path
          key={`root-${i}-${j}`}
          d={`M ${treeX} ${rootStartY} Q ${controlX} ${controlY}, ${rootEndX} ${rootEndY}`}
          stroke="#6B5D4F"
          strokeWidth={1.5 - j * 0.1}
          fill="none"
          opacity={0.9}
        />
      );
      
      // Root reflection in water
      elements.push(
        <path
          key={`root-reflection-${i}-${j}`}
          d={`M ${treeX} ${y + size - 3} Q ${controlX} ${y + size - 1}, ${rootEndX} ${y + size}`}
          stroke="#4a6050"
          strokeWidth={1.2 - j * 0.1}
          fill="none"
          opacity={0.2}
        />
      );
    }

    // Main trunk
    elements.push(
      <rect 
        key={`trunk-${i}`} 
        x={treeX - 1.5} 
        y={trunkY} 
        width="3" 
        height={trunkHeight} 
        fill="#5C4A3D" 
        rx="0.5"
      />
    );

    // Dense mangrove canopy with multiple layers
    const canopyRadius = 5 + localRand() * 3;
    const canopyY = trunkY - 1;
    
    // Background canopy layer
    elements.push(
      <ellipse 
        key={`canopy-back-${i}`} 
        cx={treeX} 
        cy={canopyY} 
        rx={canopyRadius * 1.2} 
        ry={canopyRadius * 0.9}
        fill="#1F5F3F" 
        opacity="0.9"
      />
    );
    
    // Main canopy
    elements.push(
      <ellipse 
        key={`canopy-${i}`} 
        cx={treeX} 
        cy={canopyY - 1} 
        rx={canopyRadius} 
        ry={canopyRadius * 0.8}
        fill="#2A7A4F" 
      />
    );
    
    // Canopy highlights for depth
    elements.push(
      <ellipse 
        key={`canopy-highlight-${i}`} 
        cx={treeX - 1} 
        cy={canopyY - 2} 
        rx={canopyRadius * 0.6} 
        ry={canopyRadius * 0.4}
        fill="#3FA060" 
        opacity="0.6"
      />
    );
    
    // Small detail leaves
    for (let k = 0; k < 3; k++) {
      const leafX = treeX + (localRand() - 0.5) * canopyRadius * 1.5;
      const leafY = canopyY + (localRand() - 0.5) * canopyRadius;
      elements.push(
        <circle
          key={`leaf-${i}-${k}`}
          cx={leafX}
          cy={leafY}
          r={1.5}
          fill="#4FB570"
          opacity="0.7"
        />
      );
    }
  }

  return <g filter="url(#symbolShadow)">{elements}</g>;
});

export default MangroveSymbol;