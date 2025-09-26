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
  const scaledSize = size * 1.8; // Increased from 1.3 to 1.8 for more prominence
  
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
      {/* Ground shadow - centered */}
      <ellipse
        cx={x + size * 0.5}
        cy={y + size * 0.9}
        rx={size * 0.25}
        ry={size * 0.12}
        fill="rgba(0,0,0,0.3)"
        filter="blur(1px)"
      />
      
      {/* Main pole - wider and centered */}
      <rect
        x={x + size * 0.35}
        y={y + size * 0.1}
        width={size * 0.3}
        height={size * 0.8}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="1"
      />
      
      {/* Totem sections */}
      {sections.map((section, i) => {
        const sectionY = y + size * (0.15 + i * 0.18);
        const sectionHeight = size * 0.15;
        
        return (
          <g key={`section-${i}`}>
            {/* Face background - wider to match pole */}
            <rect
              x={x + size * 0.35}
              y={sectionY}
              width={size * 0.3}
              height={sectionHeight}
              fill={section.primaryColor}
              stroke={black}
              strokeWidth="0.8"
            />
            
            {/* Wings (optional) */}
            {section.hasWings && (
              <>
                {/* Left wing - adjusted for centered pole */}
                <path
                  d={`M ${x + size * 0.35} ${sectionY + sectionHeight * 0.3}
                      L ${x + size * 0.25} ${sectionY + sectionHeight * 0.2}
                      L ${x + size * 0.2} ${sectionY + sectionHeight * 0.5}
                      L ${x + size * 0.25} ${sectionY + sectionHeight * 0.7}
                      L ${x + size * 0.35} ${sectionY + sectionHeight * 0.6}`}
                  fill={section.primaryColor === red ? black : red}
                  stroke={black}
                  strokeWidth="0.5"
                />
                {/* Right wing - adjusted for centered pole */}
                <path
                  d={`M ${x + size * 0.65} ${sectionY + sectionHeight * 0.3}
                      L ${x + size * 0.75} ${sectionY + sectionHeight * 0.2}
                      L ${x + size * 0.8} ${sectionY + sectionHeight * 0.5}
                      L ${x + size * 0.75} ${sectionY + sectionHeight * 0.7}
                      L ${x + size * 0.65} ${sectionY + sectionHeight * 0.6}`}
                  fill={section.primaryColor === red ? black : red}
                  stroke={black}
                  strokeWidth="0.5"
                />
              </>
            )}
            
            {/* Eyes */}
            {section.eyeType === 0 && (
              <>
                {/* Round eyes - centered on wider pole */}
                <circle
                  cx={x + size * 0.42}
                  cy={sectionY + sectionHeight * 0.3}
                  r={size * 0.025}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
                <circle
                  cx={x + size * 0.58}
                  cy={sectionY + sectionHeight * 0.3}
                  r={size * 0.025}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
                {/* Pupils */}
                <circle
                  cx={x + size * 0.42}
                  cy={sectionY + sectionHeight * 0.3}
                  r={size * 0.015}
                  fill={black}
                />
                <circle
                  cx={x + size * 0.58}
                  cy={sectionY + sectionHeight * 0.3}
                  r={size * 0.015}
                  fill={black}
                />
              </>
            )}
            
            {section.eyeType === 1 && (
              <>
                {/* Almond eyes - centered on wider pole */}
                <ellipse
                  cx={x + size * 0.42}
                  cy={sectionY + sectionHeight * 0.3}
                  rx={size * 0.035}
                  ry={size * 0.02}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
                <ellipse
                  cx={x + size * 0.58}
                  cy={sectionY + sectionHeight * 0.3}
                  rx={size * 0.035}
                  ry={size * 0.02}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
              </>
            )}
            
            {section.eyeType === 2 && (
              <>
                {/* Square eyes - centered on wider pole */}
                <rect
                  x={x + size * 0.38}
                  y={sectionY + sectionHeight * 0.25}
                  width={size * 0.04}
                  height={size * 0.03}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
                <rect
                  x={x + size * 0.54}
                  y={sectionY + sectionHeight * 0.25}
                  width={size * 0.04}
                  height={size * 0.03}
                  fill={white}
                  stroke={black}
                  strokeWidth="0.5"
                />
              </>
            )}
            
            {/* Mouth/Beak */}
            {section.mouthType === 0 && (
              /* Grimace - centered */
              <rect
                x={x + size * 0.4}
                y={sectionY + sectionHeight * 0.6}
                width={size * 0.2}
                height={size * 0.025}
                fill={section.primaryColor === white ? black : white}
                stroke={black}
                strokeWidth="0.5"
              />
            )}
            
            {section.mouthType === 1 && (
              /* Open mouth - centered */
              <ellipse
                cx={x + size * 0.5}
                cy={sectionY + sectionHeight * 0.65}
                rx={size * 0.05}
                ry={size * 0.035}
                fill={black}
                stroke={white}
                strokeWidth="0.5"
              />
            )}
            
            {section.mouthType === 2 && (
              /* Beak - centered */
              <path
                d={`M ${x + size * 0.5} ${sectionY + sectionHeight * 0.55}
                    L ${x + size * 0.4} ${sectionY + sectionHeight * 0.7}
                    L ${x + size * 0.5} ${sectionY + sectionHeight * 0.8}
                    L ${x + size * 0.6} ${sectionY + sectionHeight * 0.7}
                    Z`}
                fill={yellow}
                stroke={black}
                strokeWidth="0.5"
              />
            )}
            
            {/* Decorative patterns */}
            {i === 0 && (
              /* Top section gets special pattern */
              <>
                <circle
                  cx={x + size * 0.5}
                  cy={sectionY + sectionHeight * 0.85}
                  r={size * 0.015}
                  fill={turquoise}
                />
                <circle
                  cx={x + size * 0.45}
                  cy={sectionY + sectionHeight * 0.85}
                  r={size * 0.01}
                  fill={white}
                />
                <circle
                  cx={x + size * 0.55}
                  cy={sectionY + sectionHeight * 0.85}
                  r={size * 0.01}
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
          {/* Thunderbird wings at top - scaled and centered */}
          <path
            d={`M ${x + size * 0.5} ${y + size * 0.12}
                L ${x + size * 0.25} ${y + size * 0.08}
                L ${x + size * 0.15} ${y + size * 0.05}
                L ${x + size * 0.25} ${y + size * 0.02}
                L ${x + size * 0.5} ${y + size * 0.06}`}
            fill={red}
            stroke={black}
            strokeWidth="0.8"
          />
          <path
            d={`M ${x + size * 0.5} ${y + size * 0.12}
                L ${x + size * 0.75} ${y + size * 0.08}
                L ${x + size * 0.85} ${y + size * 0.05}
                L ${x + size * 0.75} ${y + size * 0.02}
                L ${x + size * 0.5} ${y + size * 0.06}`}
            fill={red}
            stroke={black}
            strokeWidth="0.8"
          />

          {/* Head - bigger and centered */}
          <circle
            cx={x + size * 0.5}
            cy={y + size * 0.08}
            r={size * 0.04}
            fill={black}
            stroke={white}
            strokeWidth="0.5"
          />
        </g>
      )}
    </g>
  );
};

export default React.memo(TotemPoleSymbol);