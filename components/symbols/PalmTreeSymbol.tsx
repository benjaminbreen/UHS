/**
 * components/symbols/PalmTreeSymbol.tsx - Simplified palm tree
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface PalmTreeSymbolProps {
  seed: number;
}

const PalmTreeSymbol: React.FC<PalmTreeSymbolProps> = ({ seed }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);
  
  const trunkLean = (localRand() - 0.5) * 15;
  const trunkColor = `hsl(25, 45%, 38%)`;
  const frondColor = `hsl(${90 + localRand() * 20}, 60%, 38%)`;
  
  const trunkTopX = 12 + Math.sin(trunkLean * Math.PI / 180) * 4;
  const trunkTopY = 6;
  
  // Simplified fronds - reduced from 6-16 to 4-6
  const numFronds = 4 + Math.floor(localRand() * 2);
  const fronds = [];
  
  for (let i = 0; i < numFronds; i++) {
    const angle = ((i / numFronds) * 360 + (localRand() - 0.5) * 20) * Math.PI / 180;
    const length = 7 + localRand() * 2;
    const endX = trunkTopX + Math.cos(angle) * length;
    const endY = trunkTopY + Math.sin(angle) * length * 0.5 + Math.abs(Math.sin(angle)) * 2;
    
    fronds.push(
      <path
        key={`frond-${i}`}
        d={`M ${trunkTopX} ${trunkTopY} Q ${trunkTopX + Math.cos(angle) * length * 0.6} ${trunkTopY + Math.sin(angle) * length * 0.2} ${endX} ${endY}`}
        stroke={frondColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  return (
    <g>
      {/* Simplified trunk - just a single path */}
      <path 
        d={`M 11 22 L ${trunkTopX - 0.5} ${trunkTopY} L ${trunkTopX + 0.5} ${trunkTopY} L 13 22 Z`}
        fill={trunkColor} 
      />
      
      {/* Fronds */}
      {fronds}
      
      {/* Optional simple coconuts */}
      {localRand() > 0.5 && (
        <circle cx={trunkTopX} cy={trunkTopY + 1} r="0.9" fill="#8B4513" opacity="0.8" />
      )}
    </g>
  );
};

// Custom comparison to prevent re-renders
const arePropsEqual = (prevProps: PalmTreeSymbolProps, nextProps: PalmTreeSymbolProps): boolean => {
  return prevProps.seed === nextProps.seed;
};

export default React.memo(PalmTreeSymbol, arePropsEqual);