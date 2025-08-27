/**
 * components/symbols/ruins/AsianRuinsSymbol.tsx  
 * Renders Asian ruins (pagodas, temples) with curved roofs and ornate details
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AsianRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
}

const AsianRuinsSymbol: React.FC<AsianRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel 
}) => {
  const rng = new ValueNoise(seed + tile.x * 37 + tile.y * 41);
  const elements: JSX.Element[] = [];
  
  // Traditional colors
  const woodColor = preservationLevel > 0.5 ? '#8B4513' : '#6B4423';
  const roofColor = preservationLevel > 0.5 ? '#B22222' : '#8B1A1A';
  const stoneColor = '#808080';
  const goldAccent = '#DAA520';
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.4}
      ry={size * 0.12}
      fill="rgba(0,0,0,0.35)"
    />
  );
  
  // Stone foundation
  const foundationHeight = size * 0.08;
  const foundationWidth = size * 0.6;
  const foundationX = x + size * 0.2;
  const foundationY = y + size * 0.77;
  
  elements.push(
    <rect
      key="foundation"
      x={foundationX}
      y={foundationY}
      width={foundationWidth}
      height={foundationHeight}
      fill={stoneColor}
      stroke="#696969"
      strokeWidth="0.4"
    />
  );
  
  // Pagoda tiers (variable based on preservation)
  const numTiers = preservationLevel > 0.7 ? 3 : preservationLevel > 0.4 ? 2 : 1;
  
  for (let tier = 0; tier < numTiers; tier++) {
    const tierY = foundationY - (tier + 1) * size * 0.15;
    const tierWidth = foundationWidth * (1 - tier * 0.2);
    const tierX = x + size * 0.5 - tierWidth / 2;
    const tierHeight = size * 0.12;
    
    // Check if tier is intact
    const tierIntact = tier === 0 || rng.random() < preservationLevel + 0.3;
    
    if (tierIntact) {
      // Tier body
      elements.push(
        <rect
          key={`tier-body-${tier}`}
          x={tierX + tierWidth * 0.1}
          y={tierY}
          width={tierWidth * 0.8}
          height={tierHeight * 0.6}
          fill={woodColor}
          stroke="#4A2511"
          strokeWidth="0.3"
        />
      );
      
      // Curved roof with upturned edges
      const roofY = tierY - tierHeight * 0.3;
      const roofPath = `
        M ${tierX - tierWidth * 0.05} ${tierY}
        Q ${tierX} ${roofY - size * 0.02} ${tierX + tierWidth * 0.25} ${roofY}
        L ${tierX + tierWidth * 0.75} ${roofY}
        Q ${tierX + tierWidth} ${roofY - size * 0.02} ${tierX + tierWidth * 1.05} ${tierY}
        L ${tierX + tierWidth * 0.9} ${tierY}
        Q ${tierX + tierWidth * 0.5} ${roofY + size * 0.01} ${tierX + tierWidth * 0.1} ${tierY}
        Z
      `;
      
      elements.push(
        <path
          key={`roof-${tier}`}
          d={roofPath}
          fill={roofColor}
          stroke="#6B1515"
          strokeWidth="0.4"
        />
      );
      
      // Roof tiles pattern
      if (preservationLevel > 0.4) {
        for (let i = 0; i < 3; i++) {
          const tileY = roofY + i * size * 0.008;
          elements.push(
            <line
              key={`tile-${tier}-${i}`}
              x1={tierX}
              y1={tileY}
              x2={tierX + tierWidth}
              y2={tileY}
              stroke="#6B1515"
              strokeWidth="0.2"
              opacity={0.4}
            />
          );
        }
      }
      
      // Decorative brackets
      if (tier === 0 && preservationLevel > 0.5) {
        [-0.05, 0.25, 0.75, 1.05].forEach((offset, idx) => {
          const bracketX = tierX + tierWidth * offset;
          elements.push(
            <rect
              key={`bracket-${idx}`}
              x={bracketX - size * 0.01}
              y={tierY - size * 0.01}
              width={size * 0.02}
              height={size * 0.03}
              fill={goldAccent}
              opacity={0.6}
            />
          );
        });
      }
    } else {
      // Collapsed tier - just debris
      elements.push(
        <polygon
          key={`collapsed-tier-${tier}`}
          points={`${tierX},${tierY + tierHeight} ${tierX + tierWidth * 0.3},${tierY + tierHeight * 0.7} ${tierX + tierWidth * 0.7},${tierY + tierHeight * 0.8} ${tierX + tierWidth},${tierY + tierHeight}`}
          fill={woodColor}
          stroke="#4A2511"
          strokeWidth="0.3"
          opacity={0.7}
        />
      );
    }
  }
  
  // Doorway or entrance
  if (preservationLevel > 0.3) {
    const doorX = foundationX + foundationWidth * 0.4;
    const doorY = foundationY - size * 0.12;
    const doorWidth = foundationWidth * 0.2;
    const doorHeight = size * 0.1;
    
    // Traditional moon gate shape
    elements.push(
      <g key="entrance">
        <ellipse
          cx={doorX + doorWidth / 2}
          cy={doorY + doorHeight / 2}
          rx={doorWidth / 2}
          ry={doorHeight / 2}
          fill="rgba(0,0,0,0.7)"
          stroke={woodColor}
          strokeWidth="0.3"
        />
      </g>
    );
  }
  
  // Stone lantern or statue base
  if (rng.random() < 0.5 && preservationLevel > 0.3) {
    const lanternX = x + size * (0.1 + rng.random() * 0.2);
    const lanternY = y + size * 0.75;
    
    elements.push(
      <g key="lantern">
        <rect
          x={lanternX}
          y={lanternY}
          width={size * 0.04}
          height={size * 0.06}
          fill={stoneColor}
          stroke="#696969"
          strokeWidth="0.2"
        />
        <polygon
          points={`${lanternX - size * 0.01},${lanternY} ${lanternX + size * 0.025},${lanternY - size * 0.03} ${lanternX + size * 0.05},${lanternY}`}
          fill={stoneColor}
          stroke="#696969"
          strokeWidth="0.2"
        />
      </g>
    );
  }
  
  // Fallen roof tiles and wood beams
  const numDebris = 4 + Math.floor((1 - preservationLevel) * 6);
  for (let i = 0; i < numDebris; i++) {
    const debrisX = x + size * (0.05 + rng.random() * 0.9);
    const debrisY = y + size * (0.72 + rng.random() * 0.13);
    
    if (i % 2 === 0) {
      // Roof tile
      const tileSize = size * (0.02 + rng.random() * 0.03);
      elements.push(
        <rect
          key={`tile-debris-${i}`}
          x={debrisX}
          y={debrisY}
          width={tileSize}
          height={tileSize * 0.6}
          fill={roofColor}
          stroke="#6B1515"
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 360} ${debrisX + tileSize/2} ${debrisY + tileSize/2})`}
          opacity={0.7}
        />
      );
    } else {
      // Wood beam
      const beamLength = size * (0.04 + rng.random() * 0.06);
      elements.push(
        <rect
          key={`beam-${i}`}
          x={debrisX}
          y={debrisY}
          width={beamLength}
          height={size * 0.01}
          fill={woodColor}
          stroke="#4A2511"
          strokeWidth="0.1"
          transform={`rotate(${rng.random() * 180} ${debrisX + beamLength/2} ${debrisY})`}
          opacity={0.6}
        />
      );
    }
  }
  
  // Vegetation (bamboo or vines)
  if (preservationLevel < 0.7) {
    const numPlants = 2 + Math.floor(rng.random() * 2);
    for (let i = 0; i < numPlants; i++) {
      const plantX = x + size * (0.15 + rng.random() * 0.7);
      const plantY = y + size * (0.6 + rng.random() * 0.15);
      
      // Bamboo stalks
      elements.push(
        <g key={`bamboo-${i}`} opacity={0.4}>
          <line
            x1={plantX}
            y1={plantY + size * 0.1}
            x2={plantX}
            y2={plantY}
            stroke="#4A5D23"
            strokeWidth="1.5"
          />
          <line
            x1={plantX}
            y1={plantY + size * 0.03}
            x2={plantX}
            y2={plantY + size * 0.04}
            stroke="#2F3F1F"
            strokeWidth="1.8"
          />
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(AsianRuinsSymbol);