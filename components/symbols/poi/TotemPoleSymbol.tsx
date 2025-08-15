/**
 * components/symbols/poi/TotemPoleSymbol.tsx - Totem Pole for Pacific Northwest religions
 * Used for Totemism, Pacific Coast Shamanism, and similar traditions
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface TotemPoleSymbolProps {
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile?: Tile;
}

const TotemPoleSymbol: React.FC<TotemPoleSymbolProps> = ({ x, y, size, seed, tile }) => {
  const tileX = tile?.x ?? Math.floor(x / size);
  const tileY = tile?.y ?? Math.floor(y / size);
  const rng = new ValueNoise(seed + tileX * 23 + tileY * 41);
  const scaledSize = size * 1.3;
  
  // Totem colors (Pacific Northwest palette)
  const red = "#B22222";
  const black = "#1C1C1C";
  const white = "#F5F5DC";
  const turquoise = "#40E0D0";
  const yellow = "#FFD700";
  
  // Random variations
  const numSections = 3 + Math.floor(rng.random() * 2); // 3-4 sections
  const hasWings = rng.random() > 0.5;
  const hasBeaks = rng.random() > 0.6;
  
  // Generate section data
  const sections = Array.from({length: numSections}, () => ({
    eyeType: Math.floor(rng.random() * 3), // 0: round, 1: almond, 2: square
    mouthType: Math.floor(rng.random() * 3), // 0: grimace, 1: open, 2: beak
    hasWings: rng.random() > 0.7,
    primaryColor: [red, black, turquoise][Math.floor(rng.random() * 3)]
  }));
  
  return (
    <g filter="url(#symbolShadow)">
      {/* Ground shadow */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.85} 
        rx={scaledSize * 0.15} 
        ry={scaledSize * 0.08} 
        fill="rgba(0,0,0,0.3)" 
      />
      
      {/* Main pole */}
      <rect 
        x={x + scaledSize * 0.42} 
        y={y + scaledSize * 0.2} 
        width={scaledSize * 0.16} 
        height={scaledSize * 0.65} 
        fill="#8B4513" 
        stroke="#654321" 
        strokeWidth="0.5" 
      />
      
      {/* Totem sections */}
      {sections.map((section, i) => {
        const sectionY = y + scaledSize * (0.25 + i * 0.15);
        const sectionHeight = scaledSize * 0.12;
        
        return (
          <g key={`section-${i}`}>
            {/* Face background */}
            <rect 
              x={x + scaledSize * 0.42} 
              y={sectionY} 
              width={scaledSize * 0.16} 
              height={sectionHeight} 
              fill={section.primaryColor} 
              stroke={black} 
              strokeWidth="0.5" 
            />
            
            {/* Wings (optional) */}
            {section.hasWings && (
              <>
                {/* Left wing */}
                <path 
                  d={`M ${x + scaledSize * 0.42} ${sectionY + sectionHeight * 0.3}
                      L ${x + scaledSize * 0.35} ${sectionY + sectionHeight * 0.2}
                      L ${x + scaledSize * 0.32} ${sectionY + sectionHeight * 0.5}
                      L ${x + scaledSize * 0.35} ${sectionY + sectionHeight * 0.7}
                      L ${x + scaledSize * 0.42} ${sectionY + sectionHeight * 0.6}`}
                  fill={section.primaryColor === red ? black : red} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
                {/* Right wing */}
                <path 
                  d={`M ${x + scaledSize * 0.58} ${sectionY + sectionHeight * 0.3}
                      L ${x + scaledSize * 0.65} ${sectionY + sectionHeight * 0.2}
                      L ${x + scaledSize * 0.68} ${sectionY + sectionHeight * 0.5}
                      L ${x + scaledSize * 0.65} ${sectionY + sectionHeight * 0.7}
                      L ${x + scaledSize * 0.58} ${sectionY + sectionHeight * 0.6}`}
                  fill={section.primaryColor === red ? black : red} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
              </>
            )}
            
            {/* Eyes */}
            {section.eyeType === 0 && (
              <>
                {/* Round eyes */}
                <circle 
                  cx={x + scaledSize * 0.46} 
                  cy={sectionY + sectionHeight * 0.3} 
                  r={scaledSize * 0.015} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
                <circle 
                  cx={x + scaledSize * 0.54} 
                  cy={sectionY + sectionHeight * 0.3} 
                  r={scaledSize * 0.015} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
                {/* Pupils */}
                <circle 
                  cx={x + scaledSize * 0.46} 
                  cy={sectionY + sectionHeight * 0.3} 
                  r={scaledSize * 0.008} 
                  fill={black} 
                />
                <circle 
                  cx={x + scaledSize * 0.54} 
                  cy={sectionY + sectionHeight * 0.3} 
                  r={scaledSize * 0.008} 
                  fill={black} 
                />
              </>
            )}
            
            {section.eyeType === 1 && (
              <>
                {/* Almond eyes */}
                <ellipse 
                  cx={x + scaledSize * 0.46} 
                  cy={sectionY + sectionHeight * 0.3} 
                  rx={scaledSize * 0.02} 
                  ry={scaledSize * 0.01} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
                <ellipse 
                  cx={x + scaledSize * 0.54} 
                  cy={sectionY + sectionHeight * 0.3} 
                  rx={scaledSize * 0.02} 
                  ry={scaledSize * 0.01} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
              </>
            )}
            
            {section.eyeType === 2 && (
              <>
                {/* Square eyes */}
                <rect 
                  x={x + scaledSize * 0.44} 
                  y={sectionY + sectionHeight * 0.25} 
                  width={scaledSize * 0.025} 
                  height={scaledSize * 0.02} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
                <rect 
                  x={x + scaledSize * 0.52} 
                  y={sectionY + sectionHeight * 0.25} 
                  width={scaledSize * 0.025} 
                  height={scaledSize * 0.02} 
                  fill={white} 
                  stroke={black} 
                  strokeWidth="0.3" 
                />
              </>
            )}
            
            {/* Mouth/Beak */}
            {section.mouthType === 0 && (
              /* Grimace */
              <rect 
                x={x + scaledSize * 0.45} 
                y={sectionY + sectionHeight * 0.6} 
                width={scaledSize * 0.1} 
                height={scaledSize * 0.015} 
                fill={section.primaryColor === white ? black : white} 
                stroke={black} 
                strokeWidth="0.3" 
              />
            )}
            
            {section.mouthType === 1 && (
              /* Open mouth */
              <ellipse 
                cx={x + scaledSize * 0.5} 
                cy={sectionY + sectionHeight * 0.65} 
                rx={scaledSize * 0.03} 
                ry={scaledSize * 0.02} 
                fill={black} 
                stroke={white} 
                strokeWidth="0.3" 
              />
            )}
            
            {section.mouthType === 2 && (
              /* Beak */
              <path 
                d={`M ${x + scaledSize * 0.5} ${sectionY + sectionHeight * 0.55}
                    L ${x + scaledSize * 0.45} ${sectionY + sectionHeight * 0.7}
                    L ${x + scaledSize * 0.5} ${sectionY + sectionHeight * 0.75}
                    L ${x + scaledSize * 0.55} ${sectionY + sectionHeight * 0.7}
                    Z`}
                fill={yellow} 
                stroke={black} 
                strokeWidth="0.3" 
              />
            )}
            
            {/* Decorative patterns */}
            {i === 0 && (
              /* Top section gets special pattern */
              <>
                <circle 
                  cx={x + scaledSize * 0.5} 
                  cy={sectionY + sectionHeight * 0.85} 
                  r={scaledSize * 0.008} 
                  fill={turquoise} 
                />
                <circle 
                  cx={x + scaledSize * 0.47} 
                  cy={sectionY + sectionHeight * 0.85} 
                  r={scaledSize * 0.005} 
                  fill={white} 
                />
                <circle 
                  cx={x + scaledSize * 0.53} 
                  cy={sectionY + sectionHeight * 0.85} 
                  r={scaledSize * 0.005} 
                  fill={white} 
                />
              </>
            )}
          </g>
        );
      })}
      
      {/* Top decoration (thunderbird or raven) */}
      {hasWings && (
        <g>
          {/* Thunderbird wings at top */}
          <path 
            d={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.22}
                L ${x + scaledSize * 0.35} ${y + scaledSize * 0.18}
                L ${x + scaledSize * 0.3} ${y + scaledSize * 0.15}
                L ${x + scaledSize * 0.35} ${y + scaledSize * 0.13}
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.17}`}
            fill={red} 
            stroke={black} 
            strokeWidth="0.5" 
          />
          <path 
            d={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.22}
                L ${x + scaledSize * 0.65} ${y + scaledSize * 0.18}
                L ${x + scaledSize * 0.7} ${y + scaledSize * 0.15}
                L ${x + scaledSize * 0.65} ${y + scaledSize * 0.13}
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.17}`}
            fill={red} 
            stroke={black} 
            strokeWidth="0.5" 
          />
          
          {/* Head */}
          <circle 
            cx={x + scaledSize * 0.5} 
            cy={y + scaledSize * 0.18} 
            r={scaledSize * 0.025} 
            fill={black} 
            stroke={white} 
            strokeWidth="0.3" 
          />
        </g>
      )}
    </g>
  );
};

export default React.memo(TotemPoleSymbol);