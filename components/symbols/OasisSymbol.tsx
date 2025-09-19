/**
 * components/symbols/OasisSymbol.tsx - Renders a beautiful oasis with gradient and palm trees
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { Tile } from '../../types';

interface OasisSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: Tile;
  tileX?: number;
  tileY?: number;
}

const OasisSymbol: React.FC<OasisSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, tileX, tileY 
}) => {
  const localRand = new ValueNoise(seed + (tileX || tile?.x || 0) * 45 + (tileY || tile?.y || 0) * 67).random;
  const elements = [];
  
  // Create gradient definition for desert to green to water
  const gradientId = `oasisGradient-${x}-${y}`;
  elements.push(
    <defs key="defs">
      <radialGradient id={gradientId}>
        <stop offset="0%" stopColor="#4a90e2" stopOpacity="0.9" /> {/* Water blue center */}
        <stop offset="25%" stopColor="#3d7c47" stopOpacity="0.85" /> {/* Deep green */}
        <stop offset="50%" stopColor="#5a9638" stopOpacity="0.8" /> {/* Lush green */}
        <stop offset="70%" stopColor="#8ab85a" stopOpacity="0.7" /> {/* Yellow-green transition */}
        <stop offset="85%" stopColor="#c8b88b" stopOpacity="0.6" /> {/* Sandy transition */}
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0.4" /> {/* Desert sand edge */}
      </radialGradient>
    </defs>
  );
  
  // Base oasis shape - irregular circle
  const centerX = x + size/2;
  const centerY = y + size/2;
  const baseRadius = size * 0.45;
  
  // Create organic shape for the oasis
  let oasisPath = '';
  const points = 12;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const radiusVariation = baseRadius * (0.85 + localRand() * 0.3);
    const px = centerX + Math.cos(angle) * radiusVariation;
    const py = centerY + Math.sin(angle) * radiusVariation;
    
    if (i === 0) {
      oasisPath = `M ${px} ${py}`;
    } else {
      // Use quadratic curves for smoother shape
      const prevAngle = ((i - 1) / points) * Math.PI * 2;
      const prevRadius = baseRadius * (0.85 + localRand() * 0.3);
      const prevX = centerX + Math.cos(prevAngle) * prevRadius;
      const prevY = centerY + Math.sin(prevAngle) * prevRadius;
      const cpX = (prevX + px) / 2 + (localRand() - 0.5) * 3;
      const cpY = (prevY + py) / 2 + (localRand() - 0.5) * 3;
      oasisPath += ` Q ${cpX} ${cpY}, ${px} ${py}`;
    }
  }
  oasisPath += ' Z';
  
  // Main oasis gradient fill
  elements.push(
    <path
      key="oasis-base"
      d={oasisPath}
      fill={`url(#${gradientId})`}
      opacity="0.9"
    />
  );
  
  // Water pool in center with ripples
  const waterRadius = baseRadius * 0.35;
  elements.push(
    <ellipse
      key="water-pool"
      cx={centerX + (localRand() - 0.5) * 2}
      cy={centerY + (localRand() - 0.5) * 2}
      rx={waterRadius * (0.9 + localRand() * 0.2)}
      ry={waterRadius * (0.85 + localRand() * 0.15)}
      fill="#4a90e2"
      opacity="0.8"
    />
  );
  
  // Water ripples
  for (let i = 0; i < 2; i++) {
    const rippleRadius = waterRadius * (0.5 + i * 0.3);
    elements.push(
      <circle
        key={`ripple-${i}`}
        cx={centerX}
        cy={centerY}
        r={rippleRadius}
        fill="none"
        stroke="#6bb6ff"
        strokeWidth="0.5"
        opacity={0.3 - i * 0.1}
      />
    );
  }
  
  // Palm trees around the oasis
  const numPalms = 3 + Math.floor(localRand() * 3); // 3-5 palm trees
  for (let i = 0; i < numPalms; i++) {
    const palmAngle = (i / numPalms) * Math.PI * 2 + localRand() * 0.5;
    const palmDistance = baseRadius * (0.6 + localRand() * 0.3);
    const palmX = centerX + Math.cos(palmAngle) * palmDistance;
    const palmY = centerY + Math.sin(palmAngle) * palmDistance;
    
    // Palm trunk - curved
    const trunkHeight = 8 + localRand() * 4;
    const trunkCurve = (localRand() - 0.5) * 3;
    
    elements.push(
      <path
        key={`palm-trunk-${i}`}
        d={`M ${palmX} ${palmY} Q ${palmX + trunkCurve} ${palmY - trunkHeight/2}, ${palmX + trunkCurve*1.5} ${palmY - trunkHeight}`}
        stroke="#8B4513"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    );
    
    // Palm fronds
    const frondCount = 5 + Math.floor(localRand() * 3);
    const frondTop = palmY - trunkHeight;
    const frondCenterX = palmX + trunkCurve * 1.5;
    
    for (let j = 0; j < frondCount; j++) {
      const frondAngle = (j / frondCount) * Math.PI * 2;
      const frondLength = 4 + localRand() * 2;
      const frondEndX = frondCenterX + Math.cos(frondAngle) * frondLength;
      const frondEndY = frondTop + Math.sin(frondAngle) * frondLength * 0.5;
      const frondDroop = 2 + localRand();
      
      // Main frond stem
      elements.push(
        <path
          key={`frond-${i}-${j}`}
          d={`M ${frondCenterX} ${frondTop} Q ${(frondCenterX + frondEndX)/2} ${frondTop + frondDroop}, ${frondEndX} ${frondEndY}`}
          stroke="#2d5016"
          strokeWidth="1"
          fill="none"
        />
      );
      
      // Frond leaves
      const leafSegments = 4;
      for (let k = 0; k < leafSegments; k++) {
        const t = (k + 1) / (leafSegments + 1);
        const leafX = frondCenterX + (frondEndX - frondCenterX) * t;
        const leafY = frondTop + (frondEndY - frondTop) * t + frondDroop * Math.sin(t * Math.PI);
        
        // Small leaves on each side
        elements.push(
          <line
            key={`leaf-${i}-${j}-${k}-l`}
            x1={leafX}
            y1={leafY}
            x2={leafX - 1}
            y2={leafY + 1}
            stroke="#3a6b1f"
            strokeWidth="0.8"
          />
        );
        elements.push(
          <line
            key={`leaf-${i}-${j}-${k}-r`}
            x1={leafX}
            y1={leafY}
            x2={leafX + 1}
            y2={leafY + 1}
            stroke="#3a6b1f"
            strokeWidth="0.8"
          />
        );
      }
    }
    
    // Small shadow under palm
    elements.push(
      <ellipse
        key={`palm-shadow-${i}`}
        cx={palmX}
        cy={palmY + 1}
        rx="2"
        ry="1"
        fill="#000000"
        opacity="0.2"
      />
    );
  }
  
  // Add some small vegetation/grass tufts around the water
  const numGrass = 8 + Math.floor(localRand() * 5);
  for (let i = 0; i < numGrass; i++) {
    const grassAngle = localRand() * Math.PI * 2;
    const grassDistance = waterRadius * (1.2 + localRand() * 0.8);
    const grassX = centerX + Math.cos(grassAngle) * grassDistance;
    const grassY = centerY + Math.sin(grassAngle) * grassDistance;
    
    // Only place grass within the oasis area
    if (grassDistance < baseRadius * 0.8) {
      elements.push(
        <circle
          key={`grass-${i}`}
          cx={grassX}
          cy={grassY}
          r="0.8"
          fill="#4a7c2e"
          opacity="0.6"
        />
      );
    }
  }
  
  return <g filter="url(#symbolShadow)">{elements}</g>;
});

export default OasisSymbol;