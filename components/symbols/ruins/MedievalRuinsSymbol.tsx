/**
 * components/symbols/ruins/MedievalRuinsSymbol.tsx
 * Renders medieval ruins with towers, battlements, and arrow slits
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface MedievalRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
}

const MedievalRuinsSymbol: React.FC<MedievalRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel 
}) => {
  const rng = new ValueNoise(seed + tile.x * 19 + tile.y * 23);
  const elements: JSX.Element[] = [];
  
  // Stone colors
  const stoneColor = preservationLevel > 0.5 ? '#8B8682' : '#696969';
  const darkStone = '#4A4A4A';
  const mossColor = '#4A5D23';
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.4}
      ry={size * 0.12}
      fill="rgba(0,0,0,0.4)"
    />
  );
  
  // Main keep/tower structure
  const towerHeight = size * (0.3 + preservationLevel * 0.4);
  const towerWidth = size * 0.35;
  const towerX = x + size * 0.32;
  const towerY = y + size * 0.85 - towerHeight;
  
  // Tower base
  elements.push(
    <rect
      key="tower-base"
      x={towerX}
      y={towerY}
      width={towerWidth}
      height={towerHeight}
      fill={stoneColor}
      stroke={darkStone}
      strokeWidth="0.5"
    />
  );
  
  // Stone texture
  const numStones = 8 + Math.floor(rng.random() * 6);
  for (let i = 0; i < numStones; i++) {
    const stoneX = towerX + rng.random() * (towerWidth - size * 0.04);
    const stoneY = towerY + rng.random() * (towerHeight - size * 0.03);
    const stoneW = size * (0.03 + rng.random() * 0.03);
    const stoneH = size * (0.02 + rng.random() * 0.02);
    
    elements.push(
      <rect
        key={`stone-${i}`}
        x={stoneX}
        y={stoneY}
        width={stoneW}
        height={stoneH}
        fill={darkStone}
        opacity={0.3}
      />
    );
  }
  
  // Arrow slits
  if (preservationLevel > 0.3) {
    const numSlits = 2 + Math.floor(rng.random() * 2);
    for (let i = 0; i < numSlits; i++) {
      const slitX = towerX + towerWidth * (0.25 + i * 0.25);
      const slitY = towerY + towerHeight * 0.3;
      
      elements.push(
        <rect
          key={`arrow-slit-${i}`}
          x={slitX}
          y={slitY}
          width={size * 0.01}
          height={size * 0.08}
          fill="rgba(0,0,0,0.7)"
        />
      );
    }
  }
  
  // Battlements (if preserved)
  if (preservationLevel > 0.5) {
    const crenelWidth = towerWidth / 6;
    for (let i = 0; i < 5; i += 2) {
      const crenelX = towerX + i * crenelWidth;
      const crenelHeight = size * 0.03;
      
      elements.push(
        <rect
          key={`crenel-${i}`}
          x={crenelX}
          y={towerY - crenelHeight}
          width={crenelWidth}
          height={crenelHeight}
          fill={stoneColor}
          stroke={darkStone}
          strokeWidth="0.3"
        />
      );
    }
  } else {
    // Broken top
    elements.push(
      <polygon
        key="broken-top"
        points={`${towerX},${towerY} ${towerX + towerWidth * 0.3},${towerY - size * 0.02} ${towerX + towerWidth * 0.7},${towerY + size * 0.01} ${towerX + towerWidth},${towerY}`}
        fill={stoneColor}
        stroke={darkStone}
        strokeWidth="0.3"
      />
    );
  }
  
  // Curtain wall remnant
  if (rng.random() < 0.7) {
    const wallHeight = size * (0.15 + preservationLevel * 0.15);
    const wallWidth = size * (0.25 + rng.random() * 0.2);
    const wallX = towerX + towerWidth;
    const wallY = y + size * 0.85 - wallHeight;
    
    elements.push(
      <g key="curtain-wall">
        <polygon
          points={`${wallX},${wallY + wallHeight} ${wallX},${wallY} ${wallX + wallWidth},${wallY + size * 0.05} ${wallX + wallWidth},${wallY + wallHeight}`}
          fill={stoneColor}
          stroke={darkStone}
          strokeWidth="0.4"
        />
        {/* Wall walk */}
        {preservationLevel > 0.4 && (
          <line
            x1={wallX}
            y1={wallY + size * 0.02}
            x2={wallX + wallWidth}
            y2={wallY + size * 0.06}
            stroke={darkStone}
            strokeWidth="0.5"
          />
        )}
      </g>
    );
  }
  
  // Gateway arch (if visible)
  if (preservationLevel > 0.3) {
    const archX = towerX + towerWidth * 0.3;
    const archY = y + size * 0.65;
    const archWidth = towerWidth * 0.4;
    const archHeight = size * 0.15;
    
    elements.push(
      <g key="gateway">
        <path
          d={`M ${archX} ${archY + archHeight} 
              L ${archX} ${archY + archHeight * 0.4}
              Q ${archX + archWidth/2} ${archY} ${archX + archWidth} ${archY + archHeight * 0.4}
              L ${archX + archWidth} ${archY + archHeight}`}
          fill="rgba(0,0,0,0.6)"
          stroke={darkStone}
          strokeWidth="0.4"
        />
        {/* Portcullis grooves */}
        <line x1={archX} y1={archY + archHeight * 0.4} x2={archX} y2={archY + archHeight} 
          stroke={darkStone} strokeWidth="0.3" />
        <line x1={archX + archWidth} y1={archY + archHeight * 0.4} x2={archX + archWidth} y2={archY + archHeight} 
          stroke={darkStone} strokeWidth="0.3" />
      </g>
    );
  }
  
  // Rubble pile
  const numRubble = 4 + Math.floor(rng.random() * 5);
  for (let i = 0; i < numRubble; i++) {
    const rubbleSize = size * (0.02 + rng.random() * 0.05);
    const rubbleX = x + size * (0.1 + rng.random() * 0.8);
    const rubbleY = y + size * (0.7 + rng.random() * 0.15);
    const rotation = rng.random() * 360;
    
    elements.push(
      <rect
        key={`rubble-${i}`}
        x={rubbleX}
        y={rubbleY}
        width={rubbleSize}
        height={rubbleSize * (0.7 + rng.random() * 0.3)}
        fill={i % 3 === 0 ? darkStone : stoneColor}
        stroke="#3A3A3A"
        strokeWidth="0.1"
        transform={`rotate(${rotation} ${rubbleX + rubbleSize/2} ${rubbleY + rubbleSize/2})`}
        opacity={0.6 + rng.random() * 0.4}
      />
    );
  }
  
  // Moss patches
  if (preservationLevel < 0.7) {
    const numMoss = 3 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numMoss; i++) {
      const mossX = towerX + rng.random() * towerWidth;
      const mossY = towerY + rng.random() * towerHeight;
      const mossSize = size * (0.02 + rng.random() * 0.03);
      
      elements.push(
        <ellipse
          key={`moss-${i}`}
          cx={mossX}
          cy={mossY}
          rx={mossSize}
          ry={mossSize * 0.7}
          fill={mossColor}
          opacity={0.4}
        />
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(MedievalRuinsSymbol);