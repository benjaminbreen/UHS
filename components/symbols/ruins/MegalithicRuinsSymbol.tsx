/**
 * components/symbols/ruins/MegalithicRuinsSymbol.tsx
 * Renders prehistoric megalithic ruins (stone circles, dolmens, cairns, menhirs)
 * Historical accuracy: Based on Neolithic monuments from Europe, Asia, and Africa
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface MegalithicRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  culturalZone?: string;
}

const MegalithicRuinsSymbol: React.FC<MegalithicRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, culturalZone = 'EUROPEAN'
}) => {
  const rng = new ValueNoise(seed + tile.x * 53 + tile.y * 59);
  const elements: JSX.Element[] = [];
  
  // Stone colors vary by region
  const stoneColors = {
    EUROPEAN: ['#8B8682', '#696969', '#808080'], // Grey stones (granite, bluestone)
    MENA: ['#DEB887', '#D2691E', '#CD853F'], // Sandstone
    AFRICAN: ['#8B7355', '#6B5D54', '#5C4033'], // Laterite, brown stone
    OCEANIAN: ['#2F4F4F', '#36454F', '#414A4C'], // Volcanic basalt
  };
  
  const colors = stoneColors[culturalZone] || stoneColors.EUROPEAN;
  const primaryStone = colors[0];
  const darkStone = colors[1];
  const accentStone = colors[2];
  
  // Lichen and weathering colors
  const lichenGreen = '#7C8471';
  const mossYellow = '#9B9B7A';
  const earthBrown = '#8B7355';
  
  // Type of megalithic structure
  const structureTypes = ['stone_circle', 'dolmen', 'cairn', 'passage_tomb', 'menhir_field'];
  const structureType = structureTypes[Math.floor(rng.random() * structureTypes.length)];
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.45}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.25)"
    />
  );
  
  switch (structureType) {
    case 'stone_circle':
      // Like Stonehenge or Avebury
      const numStones = preservationLevel > 0.5 ? 8 + Math.floor(rng.random() * 4) : 4 + Math.floor(rng.random() * 3);
      const radius = size * 0.35;
      const centerX = x + size * 0.5;
      const centerY = y + size * 0.6;
      
      for (let i = 0; i < numStones; i++) {
        const angle = (i / numStones) * Math.PI * 2;
        const stoneX = centerX + Math.cos(angle) * radius;
        const stoneY = centerY + Math.sin(angle) * radius * 0.6; // Elliptical
        
        // Some stones are fallen
        const isFallen = rng.random() > preservationLevel + 0.3;
        const stoneHeight = isFallen ? size * (0.03 + rng.random() * 0.05) : size * (0.15 + preservationLevel * 0.1 + rng.random() * 0.05);
        const stoneWidth = size * (0.04 + rng.random() * 0.03);
        
        if (isFallen) {
          // Horizontal fallen stone
          elements.push(
            <g key={`fallen-stone-${i}`}>
              <rect
                x={stoneX - stoneWidth / 2}
                y={stoneY + size * 0.1}
                width={stoneWidth * 2}
                height={stoneWidth}
                fill={darkStone}
                stroke="#4A4A4A"
                strokeWidth="0.3"
                transform={`rotate(${rng.random() * 30 - 15} ${stoneX} ${stoneY + size * 0.1})`}
                opacity={0.8}
              />
            </g>
          );
        } else {
          // Standing stone
          elements.push(
            <g key={`standing-stone-${i}`}>
              {/* Stone body with irregular shape */}
              <path
                d={`M ${stoneX - stoneWidth/2} ${stoneY + size * 0.15}
                    L ${stoneX - stoneWidth/2 + rng.random() * stoneWidth * 0.2} ${stoneY + size * 0.15 - stoneHeight}
                    L ${stoneX + stoneWidth/2 - rng.random() * stoneWidth * 0.2} ${stoneY + size * 0.15 - stoneHeight}
                    L ${stoneX + stoneWidth/2} ${stoneY + size * 0.15}
                    Z`}
                fill={i % 2 === 0 ? primaryStone : accentStone}
                stroke={darkStone}
                strokeWidth="0.4"
              />
              
              {/* Lichen patches */}
              {preservationLevel < 0.8 && rng.random() < 0.6 && (
                <ellipse
                  cx={stoneX + (rng.random() - 0.5) * stoneWidth}
                  cy={stoneY + size * 0.1 - stoneHeight * (0.3 + rng.random() * 0.4)}
                  rx={stoneWidth * 0.3}
                  ry={stoneHeight * 0.15}
                  fill={rng.random() < 0.5 ? lichenGreen : mossYellow}
                  opacity={0.4}
                />
              )}
            </g>
          );
        }
      }
      
      // Trilithons (horizontal lintels) if well preserved
      if (preservationLevel > 0.6 && numStones >= 6) {
        for (let i = 0; i < numStones; i += 3) {
          if (rng.random() < preservationLevel) {
            const angle1 = (i / numStones) * Math.PI * 2;
            const angle2 = ((i + 1) / numStones) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle1) * radius;
            const y1 = centerY + Math.sin(angle1) * radius * 0.6 - size * 0.12;
            const x2 = centerX + Math.cos(angle2) * radius;
            const y2 = centerY + Math.sin(angle2) * radius * 0.6 - size * 0.12;
            
            elements.push(
              <rect
                key={`lintel-${i}`}
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2) - size * 0.02}
                width={Math.abs(x2 - x1)}
                height={size * 0.03}
                fill={primaryStone}
                stroke={darkStone}
                strokeWidth="0.3"
              />
            );
          }
        }
      }
      break;
      
    case 'dolmen':
      // Portal tomb with capstone
      const dolmenX = x + size * 0.35;
      const dolmenY = y + size * 0.65;
      const dolmenWidth = size * 0.3;
      const dolmenHeight = size * 0.15;
      
      // Support stones
      const supports = [
        { x: dolmenX, y: dolmenY },
        { x: dolmenX + dolmenWidth * 0.8, y: dolmenY }
      ];
      
      supports.forEach((sup, idx) => {
        const supportHeight = dolmenHeight * (0.7 + preservationLevel * 0.3);
        elements.push(
          <rect
            key={`support-${idx}`}
            x={sup.x}
            y={sup.y - supportHeight}
            width={size * 0.05}
            height={supportHeight}
            fill={darkStone}
            stroke="#4A4A4A"
            strokeWidth="0.4"
          />
        );
      });
      
      // Capstone (may be tilted if not well preserved)
      const tilt = preservationLevel > 0.6 ? 0 : rng.random() * 10 - 5;
      elements.push(
        <g key="capstone">
          <polygon
            points={`${dolmenX - size * 0.02},${dolmenY - dolmenHeight + size * 0.02}
                     ${dolmenX + dolmenWidth + size * 0.02},${dolmenY - dolmenHeight}
                     ${dolmenX + dolmenWidth + size * 0.02},${dolmenY - dolmenHeight - size * 0.04}
                     ${dolmenX - size * 0.02},${dolmenY - dolmenHeight - size * 0.03}`}
            fill={primaryStone}
            stroke={darkStone}
            strokeWidth="0.5"
            transform={`rotate(${tilt} ${dolmenX + dolmenWidth/2} ${dolmenY - dolmenHeight})`}
          />
          
          {/* Cup marks (prehistoric carvings) */}
          {preservationLevel > 0.4 && culturalZone === 'EUROPEAN' && (
            <>
              {[0.3, 0.5, 0.7].map((offset, idx) => (
                <circle
                  key={`cup-mark-${idx}`}
                  cx={dolmenX + dolmenWidth * offset}
                  cy={dolmenY - dolmenHeight - size * 0.02}
                  r={size * 0.006}
                  fill="rgba(0,0,0,0.3)"
                />
              ))}
            </>
          )}
        </g>
      );
      
      // Entrance passage stones
      if (preservationLevel > 0.3) {
        for (let i = 0; i < 3; i++) {
          const passageX = dolmenX + dolmenWidth * 0.4;
          const passageY = dolmenY + size * 0.05 + i * size * 0.04;
          elements.push(
            <rect
              key={`passage-${i}`}
              x={passageX - size * 0.03}
              y={passageY}
              width={size * 0.06}
              height={size * 0.025}
              fill={accentStone}
              stroke={darkStone}
              strokeWidth="0.2"
              opacity={0.7}
            />
          );
        }
      }
      break;
      
    case 'cairn':
      // Burial mound of stacked stones
      const cairnX = x + size * 0.5;
      const cairnY = y + size * 0.7;
      const cairnRadius = size * (0.25 + preservationLevel * 0.1);
      const cairnHeight = size * (0.1 + preservationLevel * 0.05);
      
      // Base mound
      elements.push(
        <ellipse
          key="cairn-base"
          cx={cairnX}
          cy={cairnY}
          rx={cairnRadius}
          ry={cairnHeight}
          fill={earthBrown}
          opacity={0.6}
        />
      );
      
      // Individual stones making up the cairn
      const numCairnStones = 15 + Math.floor(preservationLevel * 20);
      for (let i = 0; i < numCairnStones; i++) {
        const angle = rng.random() * Math.PI * 2;
        const distance = rng.random() * cairnRadius * 0.9;
        const stoneX = cairnX + Math.cos(angle) * distance;
        const stoneY = cairnY + Math.sin(angle) * distance * 0.5 - rng.random() * cairnHeight;
        const stoneSize = size * (0.015 + rng.random() * 0.02);
        
        elements.push(
          <ellipse
            key={`cairn-stone-${i}`}
            cx={stoneX}
            cy={stoneY}
            rx={stoneSize}
            ry={stoneSize * 0.7}
            fill={i % 3 === 0 ? primaryStone : i % 3 === 1 ? darkStone : accentStone}
            stroke="#4A4A4A"
            strokeWidth="0.1"
            opacity={0.8 + rng.random() * 0.2}
          />
        );
      }
      
      // Entrance (if visible)
      if (preservationLevel > 0.4 && rng.random() < 0.7) {
        elements.push(
          <rect
            key="cairn-entrance"
            x={cairnX - size * 0.03}
            y={cairnY - size * 0.02}
            width={size * 0.06}
            height={size * 0.04}
            fill="rgba(0,0,0,0.6)"
            stroke={darkStone}
            strokeWidth="0.3"
          />
        );
      }
      
      // Kerb stones around base
      if (preservationLevel > 0.5) {
        const kerbStones = 8 + Math.floor(rng.random() * 4);
        for (let i = 0; i < kerbStones; i++) {
          const kerbAngle = (i / kerbStones) * Math.PI * 2;
          const kerbX = cairnX + Math.cos(kerbAngle) * cairnRadius;
          const kerbY = cairnY + Math.sin(kerbAngle) * cairnHeight;
          
          elements.push(
            <rect
              key={`kerb-${i}`}
              x={kerbX - size * 0.02}
              y={kerbY - size * 0.01}
              width={size * 0.04}
              height={size * 0.02}
              fill={darkStone}
              stroke="#4A4A4A"
              strokeWidth="0.2"
              transform={`rotate(${kerbAngle * 180 / Math.PI} ${kerbX} ${kerbY})`}
            />
          );
        }
      }
      break;
      
    case 'menhir_field':
      // Field of standing stones (like Carnac)
      const numMenhirs = 5 + Math.floor(preservationLevel * 7);
      const arranged = rng.random() < 0.6; // Some are in rows, some random
      
      for (let i = 0; i < numMenhirs; i++) {
        let menhirX, menhirY;
        
        if (arranged) {
          // Arranged in rough rows
          const row = Math.floor(i / 4);
          const col = i % 4;
          menhirX = x + size * (0.2 + col * 0.2);
          menhirY = y + size * (0.5 + row * 0.15);
          // Add some variation
          menhirX += (rng.random() - 0.5) * size * 0.05;
          menhirY += (rng.random() - 0.5) * size * 0.03;
        } else {
          // Random placement
          menhirX = x + size * (0.1 + rng.random() * 0.8);
          menhirY = y + size * (0.4 + rng.random() * 0.35);
        }
        
        const isFallen = rng.random() > preservationLevel + 0.4;
        const menhirHeight = size * (0.08 + rng.random() * 0.07);
        const menhirWidth = size * (0.02 + rng.random() * 0.015);
        
        if (isFallen) {
          elements.push(
            <rect
              key={`fallen-menhir-${i}`}
              x={menhirX}
              y={menhirY + size * 0.08}
              width={menhirHeight}
              height={menhirWidth}
              fill={darkStone}
              stroke="#4A4A4A"
              strokeWidth="0.2"
              transform={`rotate(${rng.random() * 360} ${menhirX + menhirHeight/2} ${menhirY + size * 0.08})`}
              opacity={0.7}
            />
          );
        } else {
          // Tapered standing stone
          elements.push(
            <g key={`menhir-${i}`}>
              <polygon
                points={`${menhirX},${menhirY + size * 0.1}
                         ${menhirX - menhirWidth * 0.3},${menhirY + size * 0.1 - menhirHeight}
                         ${menhirX + menhirWidth * 0.3},${menhirY + size * 0.1 - menhirHeight}
                         ${menhirX + menhirWidth},${menhirY + size * 0.1}`}
                fill={i % 2 === 0 ? primaryStone : accentStone}
                stroke={darkStone}
                strokeWidth="0.3"
              />
              
              {/* Weathering streaks */}
              <line
                x1={menhirX}
                y1={menhirY + size * 0.1 - menhirHeight}
                x2={menhirX}
                y2={menhirY + size * 0.1}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />
            </g>
          );
        }
      }
      break;
      
    default:
      // Passage tomb
      const tombX = x + size * 0.3;
      const tombY = y + size * 0.65;
      const tombWidth = size * 0.4;
      
      // Passage
      elements.push(
        <rect
          key="passage"
          x={tombX + tombWidth * 0.4}
          y={tombY}
          width={size * 0.05}
          height={size * 0.15}
          fill="rgba(0,0,0,0.5)"
          stroke={darkStone}
          strokeWidth="0.3"
        />
      );
      
      // Chamber
      const chamberRadius = size * 0.12;
      elements.push(
        <circle
          key="chamber"
          cx={tombX + tombWidth * 0.425}
          cy={tombY - size * 0.05}
          r={chamberRadius}
          fill="rgba(0,0,0,0.4)"
          stroke={darkStone}
          strokeWidth="0.4"
        />
      );
      
      // Orthostats (wall stones)
      const numOrthostats = 6 + Math.floor(preservationLevel * 4);
      for (let i = 0; i < numOrthostats; i++) {
        const angle = (i / numOrthostats) * Math.PI * 2;
        const orthoX = tombX + tombWidth * 0.425 + Math.cos(angle) * chamberRadius;
        const orthoY = tombY - size * 0.05 + Math.sin(angle) * chamberRadius * 0.7;
        
        elements.push(
          <rect
            key={`orthostat-${i}`}
            x={orthoX - size * 0.015}
            y={orthoY - size * 0.04}
            width={size * 0.03}
            height={size * 0.05}
            fill={primaryStone}
            stroke={darkStone}
            strokeWidth="0.2"
            transform={`rotate(${angle * 180 / Math.PI + 90} ${orthoX} ${orthoY})`}
          />
        );
      }
      break;
  }
  
  // Scattered smaller stones and rubble
  const numRubble = 3 + Math.floor((1 - preservationLevel) * 5);
  for (let i = 0; i < numRubble; i++) {
    const rubbleX = x + size * (0.05 + rng.random() * 0.9);
    const rubbleY = y + size * (0.75 + rng.random() * 0.1);
    const rubbleSize = size * (0.01 + rng.random() * 0.02);
    
    elements.push(
      <ellipse
        key={`rubble-${i}`}
        cx={rubbleX}
        cy={rubbleY}
        rx={rubbleSize}
        ry={rubbleSize * 0.7}
        fill={i % 2 === 0 ? darkStone : accentStone}
        opacity={0.6}
      />
    );
  }
  
  // Grass tufts around stones
  if (preservationLevel < 0.8) {
    const numGrass = 4 + Math.floor(rng.random() * 3);
    for (let i = 0; i < numGrass; i++) {
      const grassX = x + size * (0.1 + rng.random() * 0.8);
      const grassY = y + size * (0.7 + rng.random() * 0.15);
      
      elements.push(
        <g key={`grass-${i}`} opacity={0.4}>
          {[0, 0.3, 0.6].map((offset) => (
            <line
              key={offset}
              x1={grassX + offset * size * 0.01}
              y1={grassY}
              x2={grassX + offset * size * 0.01 - size * 0.005}
              y2={grassY - size * 0.02}
              stroke="#4A5D23"
              strokeWidth="0.5"
            />
          ))}
        </g>
      );
    }
  }
  
  return <g>{elements}</g>;
};

export default React.memo(MegalithicRuinsSymbol);