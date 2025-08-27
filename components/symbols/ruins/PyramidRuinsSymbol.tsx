/**
 * components/symbols/ruins/PyramidRuinsSymbol.tsx
 * Renders pyramid ruins (Egyptian, Mayan, Aztec style) with steps, hieroglyphs
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface PyramidRuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  preservationLevel: number;
  culturalZone?: string;
}

const PyramidRuinsSymbol: React.FC<PyramidRuinsSymbolProps> = ({ 
  x, y, size, seed, tile, preservationLevel, culturalZone = 'MENA' 
}) => {
  const rng = new ValueNoise(seed + tile.x * 29 + tile.y * 31);
  const elements: JSX.Element[] = [];
  
  // Different colors for different pyramid cultures
  const isEgyptian = culturalZone === 'MENA';
  const isMesoamerican = culturalZone === 'MESOAMERICAN';
  
  const stoneColor = isEgyptian ? '#DEB887' : '#CD853F'; // Sandstone vs limestone
  const darkStone = isEgyptian ? '#D2691E' : '#8B4513';
  const accentColor = isEgyptian ? '#DAA520' : '#A0522D';
  
  // Base shadow
  elements.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.45}
      ry={size * 0.15}
      fill="rgba(0,0,0,0.35)"
    />
  );
  
  // Pyramid structure
  const pyramidHeight = size * (0.4 + preservationLevel * 0.25);
  const baseWidth = size * 0.7;
  const topWidth = preservationLevel > 0.5 ? baseWidth * 0.15 : baseWidth * 0.3;
  const pyramidX = x + size * 0.15;
  const pyramidY = y + size * 0.85 - pyramidHeight;
  
  if (isMesoamerican) {
    // Stepped pyramid (Mayan/Aztec style)
    const numSteps = Math.floor(3 + preservationLevel * 3);
    
    for (let i = 0; i < numSteps; i++) {
      const stepRatio = i / numSteps;
      const stepWidth = baseWidth - (baseWidth - topWidth) * stepRatio;
      const stepHeight = pyramidHeight / numSteps;
      const stepX = pyramidX + (baseWidth - stepWidth) / 2;
      const stepY = pyramidY + pyramidHeight - (i + 1) * stepHeight;
      
      // Check if this step is collapsed
      const isCollapsed = rng.random() > preservationLevel + 0.2;
      
      if (!isCollapsed) {
        elements.push(
          <g key={`step-${i}`}>
            <rect
              x={stepX}
              y={stepY}
              width={stepWidth}
              height={stepHeight}
              fill={stoneColor}
              stroke={darkStone}
              strokeWidth="0.4"
            />
            {/* Step face detail */}
            <line
              x1={stepX}
              y1={stepY + stepHeight * 0.5}
              x2={stepX + stepWidth}
              y2={stepY + stepHeight * 0.5}
              stroke={darkStone}
              strokeWidth="0.2"
              opacity={0.5}
            />
          </g>
        );
      } else {
        // Collapsed section
        elements.push(
          <polygon
            key={`collapsed-${i}`}
            points={`${stepX},${stepY + stepHeight} ${stepX + stepWidth * 0.3},${stepY + stepHeight * 0.7} ${stepX + stepWidth * 0.7},${stepY + stepHeight * 0.8} ${stepX + stepWidth},${stepY + stepHeight}`}
            fill={stoneColor}
            stroke={darkStone}
            strokeWidth="0.3"
            opacity={0.8}
          />
        );
      }
    }
    
    // Temple structure on top (if preserved)
    if (preservationLevel > 0.6) {
      const templeWidth = topWidth * 0.8;
      const templeHeight = size * 0.08;
      const templeX = pyramidX + (baseWidth - templeWidth) / 2;
      const templeY = pyramidY - templeHeight;
      
      elements.push(
        <g key="temple-top">
          <rect
            x={templeX}
            y={templeY}
            width={templeWidth}
            height={templeHeight}
            fill={darkStone}
            stroke={accentColor}
            strokeWidth="0.3"
          />
          {/* Doorway */}
          <rect
            x={templeX + templeWidth * 0.4}
            y={templeY + templeHeight * 0.3}
            width={templeWidth * 0.2}
            height={templeHeight * 0.7}
            fill="rgba(0,0,0,0.7)"
          />
        </g>
      );
    }
    
  } else {
    // Smooth pyramid (Egyptian style)
    const pyramidPath = preservationLevel > 0.6 ?
      // Intact pyramid
      `M ${pyramidX} ${pyramidY + pyramidHeight}
       L ${pyramidX + baseWidth/2} ${pyramidY}
       L ${pyramidX + baseWidth} ${pyramidY + pyramidHeight}
       Z` :
      // Partially collapsed
      `M ${pyramidX} ${pyramidY + pyramidHeight}
       L ${pyramidX + baseWidth * 0.3} ${pyramidY + pyramidHeight * 0.4}
       L ${pyramidX + baseWidth * 0.5} ${pyramidY + pyramidHeight * 0.2}
       L ${pyramidX + baseWidth * 0.7} ${pyramidY + pyramidHeight * 0.3}
       L ${pyramidX + baseWidth} ${pyramidY + pyramidHeight}
       Z`;
    
    elements.push(
      <path
        key="pyramid-body"
        d={pyramidPath}
        fill={stoneColor}
        stroke={darkStone}
        strokeWidth="0.5"
      />
    );
    
    // Casing stones pattern
    if (preservationLevel > 0.4) {
      const numLines = 4 + Math.floor(preservationLevel * 4);
      for (let i = 1; i < numLines; i++) {
        const lineY = pyramidY + (pyramidHeight * i) / numLines;
        const lineWidth = baseWidth * (1 - i / numLines);
        const lineX = pyramidX + (baseWidth - lineWidth) / 2;
        
        elements.push(
          <line
            key={`casing-${i}`}
            x1={lineX}
            y1={lineY}
            x2={lineX + lineWidth}
            y2={lineY}
            stroke={darkStone}
            strokeWidth="0.2"
            opacity={0.4}
          />
        );
      }
    }
  }
  
  // Hieroglyphs or carvings
  if (preservationLevel > 0.3 && rng.random() < 0.7) {
    const glyphX = pyramidX + baseWidth * (0.3 + rng.random() * 0.4);
    const glyphY = pyramidY + pyramidHeight * 0.6;
    
    if (isEgyptian) {
      // Egyptian hieroglyphs
      elements.push(
        <g key="hieroglyphs" opacity={0.6}>
          <circle cx={glyphX} cy={glyphY} r={size * 0.015} fill={accentColor} />
          <path d={`M ${glyphX + size * 0.03} ${glyphY} L ${glyphX + size * 0.05} ${glyphY - size * 0.02} L ${glyphX + size * 0.05} ${glyphY + size * 0.02}`} 
            stroke={accentColor} strokeWidth="0.5" fill="none" />
          <rect x={glyphX - size * 0.03} y={glyphY + size * 0.02} width={size * 0.02} height={size * 0.01} fill={accentColor} />
        </g>
      );
    } else {
      // Mesoamerican glyphs
      elements.push(
        <g key="glyphs" opacity={0.5}>
          <rect x={glyphX} y={glyphY} width={size * 0.03} height={size * 0.03} 
            fill="none" stroke={accentColor} strokeWidth="0.5" />
          <circle cx={glyphX + size * 0.015} cy={glyphY + size * 0.015} r={size * 0.008} fill={accentColor} />
        </g>
      );
    }
  }
  
  // Entrance/burial chamber
  if (rng.random() < 0.6) {
    const entranceX = pyramidX + baseWidth * 0.45;
    const entranceY = pyramidY + pyramidHeight * 0.75;
    
    elements.push(
      <rect
        key="entrance"
        x={entranceX}
        y={entranceY}
        width={baseWidth * 0.1}
        height={pyramidHeight * 0.2}
        fill="rgba(0,0,0,0.7)"
        stroke={darkStone}
        strokeWidth="0.3"
      />
    );
  }
  
  // Fallen blocks
  const numBlocks = 3 + Math.floor((1 - preservationLevel) * 5);
  for (let i = 0; i < numBlocks; i++) {
    const blockSize = size * (0.03 + rng.random() * 0.05);
    const blockX = x + size * (0.05 + rng.random() * 0.9);
    const blockY = y + size * (0.7 + rng.random() * 0.15);
    const rotation = rng.random() * 45;
    
    elements.push(
      <rect
        key={`block-${i}`}
        x={blockX}
        y={blockY}
        width={blockSize}
        height={blockSize * 0.8}
        fill={i % 2 === 0 ? stoneColor : darkStone}
        stroke="#8B7355"
        strokeWidth="0.1"
        transform={`rotate(${rotation} ${blockX + blockSize/2} ${blockY + blockSize/2})`}
        opacity={0.7}
      />
    );
  }
  
  // Sand accumulation (for desert pyramids)
  if (isEgyptian || (isMesoamerican && preservationLevel < 0.6)) {
    elements.push(
      <ellipse
        key="sand-drift"
        cx={x + size * 0.5}
        cy={y + size * 0.82}
        rx={size * 0.5}
        ry={size * 0.08}
        fill={isEgyptian ? '#F4A460' : '#DEB887'}
        opacity={0.3}
      />
    );
  }
  
  return <g>{elements}</g>;
};

export default React.memo(PyramidRuinsSymbol);