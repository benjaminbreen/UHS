/**
 * components/symbols/overlays/NativeAmericanSymbols.tsx
 * Beautiful pixel art symbols for Native American/Indigenous special maps
 * Styled like Stardew Valley with rich colors and clear pixel definition
 */

import React from 'react';

interface NativeSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: string;
}

/**
 * Totem Pole - Tall carved wooden pole with faces/animals
 */
export const TotemPoleSymbol: React.FC<NativeSymbolProps> = ({ x, y, size, variant = 'standard' }) => {
  const scale = size / 32;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base */}
      <rect x={size * 0.35} y={size * 0.85} width={size * 0.3} height={size * 0.15} 
            fill="#654321" stroke="#4a3018" strokeWidth="0.5" />
      
      {/* Main pole - wood grain effect */}
      <rect x={size * 0.4} y={size * 0.1} width={size * 0.2} height={size * 0.75} 
            fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
      <rect x={size * 0.42} y={size * 0.1} width={size * 0.02} height={size * 0.75} 
            fill="#A0522D" opacity="0.6" />
      <rect x={size * 0.56} y={size * 0.1} width={size * 0.02} height={size * 0.75} 
            fill="#6B3410" opacity="0.6" />
      
      {/* Top figure - Eagle */}
      <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.12} ry={size * 0.08} 
               fill="#CD853F" stroke="#8B4513" strokeWidth="0.5" />
      {/* Eagle beak */}
      <polygon points={`${size * 0.5},${size * 0.15} ${size * 0.55},${size * 0.14} ${size * 0.52},${size * 0.17}`}
               fill="#FFD700" stroke="#DAA520" strokeWidth="0.3" />
      {/* Eagle eyes */}
      <circle cx={size * 0.47} cy={size * 0.14} r={size * 0.015} fill="#000" />
      <circle cx={size * 0.53} cy={size * 0.14} r={size * 0.015} fill="#000" />
      
      {/* Middle figure - Bear */}
      <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.11} ry={size * 0.09} 
               fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
      {/* Bear snout */}
      <ellipse cx={size * 0.5} cy={size * 0.37} rx={size * 0.06} ry={size * 0.04} 
               fill="#654321" stroke="#4a3018" strokeWidth="0.3" />
      {/* Bear eyes */}
      <circle cx={size * 0.47} cy={size * 0.33} r={size * 0.02} fill="#FFF" />
      <circle cx={size * 0.53} cy={size * 0.33} r={size * 0.02} fill="#FFF" />
      <circle cx={size * 0.47} cy={size * 0.33} r={size * 0.01} fill="#000" />
      <circle cx={size * 0.53} cy={size * 0.33} r={size * 0.01} fill="#000" />
      
      {/* Bottom figure - Wolf */}
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.11} ry={size * 0.09} 
               fill="#A0522D" stroke="#8B4513" strokeWidth="0.5" />
      {/* Wolf mouth */}
      <path d={`M ${size * 0.45} ${size * 0.56} Q ${size * 0.5} ${size * 0.58} ${size * 0.55} ${size * 0.56}`}
            fill="none" stroke="#4a3018" strokeWidth="0.5" />
      {/* Wolf teeth */}
      <polygon points={`${size * 0.47},${size * 0.56} ${size * 0.48},${size * 0.54} ${size * 0.49},${size * 0.56}`}
               fill="#FFF" stroke="#DDD" strokeWidth="0.2" />
      <polygon points={`${size * 0.51},${size * 0.56} ${size * 0.52},${size * 0.54} ${size * 0.53},${size * 0.56}`}
               fill="#FFF" stroke="#DDD" strokeWidth="0.2" />
      
      {/* Decorative patterns */}
      <rect x={size * 0.38} y={size * 0.25} width={size * 0.24} height={size * 0.02} 
            fill="#DC143C" opacity="0.8" />
      <rect x={size * 0.38} y={size * 0.45} width={size * 0.24} height={size * 0.02} 
            fill="#4169E1" opacity="0.8" />
      <rect x={size * 0.38} y={size * 0.65} width={size * 0.24} height={size * 0.02} 
            fill="#FFD700" opacity="0.8" />
    </g>
  );
};

/**
 * Ceremonial Drum - Large drum with decorative patterns
 */
export const DrumSymbol: React.FC<NativeSymbolProps> = ({ x, y, size, variant = 'standard' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Drum body - cylindrical */}
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.25} ry={size * 0.1} 
               fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
      <rect x={size * 0.25} y={size * 0.45} width={size * 0.5} height={size * 0.2} 
            fill="#A0522D" stroke="#654321" strokeWidth="0.5" />
      
      {/* Drum head - stretched hide */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.25} ry={size * 0.1} 
               fill="#DEB887" stroke="#8B4513" strokeWidth="0.8" />
      
      {/* Decorative pattern on drum head */}
      <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.08} 
              fill="none" stroke="#8B4513" strokeWidth="0.5" />
      <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.04} 
              fill="#DC143C" opacity="0.7" />
      
      {/* Side decorations */}
      <path d={`M ${size * 0.3} ${size * 0.5} L ${size * 0.35} ${size * 0.55} L ${size * 0.3} ${size * 0.6}`}
            fill="none" stroke="#FFD700" strokeWidth="0.5" />
      <path d={`M ${size * 0.7} ${size * 0.5} L ${size * 0.65} ${size * 0.55} L ${size * 0.7} ${size * 0.6}`}
            fill="none" stroke="#FFD700" strokeWidth="0.5" />
      
      {/* Drum sticks */}
      <line x1={size * 0.35} y1={size * 0.4} x2={size * 0.45} y2={size * 0.45} 
            stroke="#654321" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={size * 0.35} cy={size * 0.4} r={size * 0.03} fill="#DEB887" stroke="#8B4513" strokeWidth="0.3" />
      
      <line x1={size * 0.65} y1={size * 0.4} x2={size * 0.55} y2={size * 0.45} 
            stroke="#654321" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={size * 0.65} cy={size * 0.4} r={size * 0.03} fill="#DEB887" stroke="#8B4513" strokeWidth="0.3" />
    </g>
  );
};

/**
 * Sacred Rock - Ceremonial stone with markings
 */
export const SacredRockSymbol: React.FC<NativeSymbolProps> = ({ x, y, size, variant = 'standard' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Main rock shape */}
      <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.35} ry={size * 0.25} 
               fill="#808080" stroke="#696969" strokeWidth="0.5" />
      
      {/* Rock texture/shading */}
      <ellipse cx={size * 0.45} cy={size * 0.55} rx={size * 0.25} ry={size * 0.18} 
               fill="#A9A9A9" opacity="0.5" />
      <ellipse cx={size * 0.55} cy={size * 0.65} rx={size * 0.15} ry={size * 0.12} 
               fill="#696969" opacity="0.3" />
      
      {/* Sacred markings - sun symbol */}
      {variant === 'sacred_stone' && (
        <>
          <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.08} 
                  fill="none" stroke="#DC143C" strokeWidth="0.8" opacity="0.8" />
          {/* Sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = size * 0.5 + Math.cos(rad) * size * 0.08;
            const y1 = size * 0.55 + Math.sin(rad) * size * 0.08;
            const x2 = size * 0.5 + Math.cos(rad) * size * 0.12;
            const y2 = size * 0.55 + Math.sin(rad) * size * 0.12;
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#DC143C" strokeWidth="0.5" opacity="0.8" />
            );
          })}
        </>
      )}
      
      {/* Moss/lichen patches */}
      <ellipse cx={size * 0.35} cy={size * 0.5} rx={size * 0.06} ry={size * 0.04} 
               fill="#556B2F" opacity="0.4" />
      <ellipse cx={size * 0.6} cy={size * 0.65} rx={size * 0.05} ry={size * 0.03} 
               fill="#556B2F" opacity="0.3" />
    </g>
  );
};

/**
 * Ladder - Wooden ladder for kivas
 */
export const LadderSymbol: React.FC<NativeSymbolProps> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Side rails */}
      <rect x={size * 0.35} y={size * 0.1} width={size * 0.04} height={size * 0.8} 
            fill="#8B4513" stroke="#654321" strokeWidth="0.3" />
      <rect x={size * 0.61} y={size * 0.1} width={size * 0.04} height={size * 0.8} 
            fill="#8B4513" stroke="#654321" strokeWidth="0.3" />
      
      {/* Rungs */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map(yPos => (
        <rect key={yPos} x={size * 0.35} y={size * yPos} width={size * 0.3} height={size * 0.03} 
              fill="#A0522D" stroke="#654321" strokeWidth="0.3" />
      ))}
      
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.92} rx={size * 0.15} ry={size * 0.05} 
               fill="#000" opacity="0.2" />
    </g>
  );
};

/**
 * Sacred Well/Sipapu - Ceremonial opening
 */
export const WellSymbol: React.FC<NativeSymbolProps> = ({ x, y, size, variant = 'well' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer ring - stone/earth */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.3} ry={size * 0.2} 
               fill="#8B7355" stroke="#654321" strokeWidth="0.8" />
      
      {/* Inner opening - dark */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.2} ry={size * 0.13} 
               fill="#2F1F1F" stroke="#1A0F0F" strokeWidth="0.5" />
      
      {/* Depth gradient */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.15} ry={size * 0.09} 
               fill="#000" opacity="0.7" />
      
      {/* Sacred markings for sipapu */}
      {variant === 'sipapu' && (
        <>
          {/* Four directional marks */}
          <rect x={size * 0.48} y={size * 0.25} width={size * 0.04} height={size * 0.08} 
                fill="#DC143C" opacity="0.6" />
          <rect x={size * 0.48} y={size * 0.67} width={size * 0.04} height={size * 0.08} 
                fill="#FFD700" opacity="0.6" />
          <rect x={size * 0.25} y={size * 0.48} width={size * 0.08} height={size * 0.04} 
                fill="#000" opacity="0.6" />
          <rect x={size * 0.67} y={size * 0.48} width={size * 0.08} height={size * 0.04} 
                fill="#FFF" opacity="0.6" />
        </>
      )}
    </g>
  );
};

/**
 * Buffalo Skull - Sacred buffalo skull
 */
export const BuffaloSkullSymbol: React.FC<NativeSymbolProps> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Main skull */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.25} ry={size * 0.2} 
               fill="#F5F5DC" stroke="#D2B48C" strokeWidth="0.5" />
      
      {/* Snout */}
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.12} ry={size * 0.08} 
               fill="#FFFACD" stroke="#D2B48C" strokeWidth="0.5" />
      
      {/* Eye sockets */}
      <ellipse cx={size * 0.42} cy={size * 0.42} rx={size * 0.05} ry={size * 0.07} 
               fill="#2F2F2F" stroke="#1A1A1A" strokeWidth="0.3" />
      <ellipse cx={size * 0.58} cy={size * 0.42} rx={size * 0.05} ry={size * 0.07} 
               fill="#2F2F2F" stroke="#1A1A1A" strokeWidth="0.3" />
      
      {/* Horns */}
      <path d={`M ${size * 0.25} ${size * 0.4} Q ${size * 0.2} ${size * 0.35} ${size * 0.18} ${size * 0.38}`}
            fill="none" stroke="#8B7D6B" strokeWidth="2" strokeLinecap="round" />
      <path d={`M ${size * 0.75} ${size * 0.4} Q ${size * 0.8} ${size * 0.35} ${size * 0.82} ${size * 0.38}`}
            fill="none" stroke="#8B7D6B" strokeWidth="2" strokeLinecap="round" />
      
      {/* Nostril holes */}
      <ellipse cx={size * 0.47} cy={size * 0.55} rx={size * 0.015} ry={size * 0.02} fill="#000" />
      <ellipse cx={size * 0.53} cy={size * 0.55} rx={size * 0.015} ry={size * 0.02} fill="#000" />
      
      {/* Decorative feathers */}
      <line x1={size * 0.2} y1={size * 0.38} x2={size * 0.15} y2={size * 0.5} 
            stroke="#8B4513" strokeWidth="0.5" />
      <ellipse cx={size * 0.15} cy={size * 0.52} rx={size * 0.02} ry={size * 0.05} 
               fill="#DC143C" stroke="#8B0000" strokeWidth="0.2" />
      <line x1={size * 0.8} y1={size * 0.38} x2={size * 0.85} y2={size * 0.5} 
            stroke="#8B4513" strokeWidth="0.5" />
      <ellipse cx={size * 0.85} cy={size * 0.52} rx={size * 0.02} ry={size * 0.05} 
               fill="#4169E1" stroke="#191970" strokeWidth="0.2" />
    </g>
  );
};

/**
 * Medicine Bundle - Sacred wrapped bundle
 */
export const MedicineBundleSymbol: React.FC<NativeSymbolProps> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Main bundle - wrapped hide */}
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.2} ry={size * 0.15} 
               fill="#8B7355" stroke="#654321" strokeWidth="0.5" />
      
      {/* Wrapping cords */}
      <path d={`M ${size * 0.3} ${size * 0.5} Q ${size * 0.5} ${size * 0.45} ${size * 0.7} ${size * 0.5}`}
            fill="none" stroke="#654321" strokeWidth="0.8" />
      <path d={`M ${size * 0.3} ${size * 0.6} Q ${size * 0.5} ${size * 0.65} ${size * 0.7} ${size * 0.6}`}
            fill="none" stroke="#654321" strokeWidth="0.8" />
      
      {/* Sacred items sticking out */}
      {/* Feathers */}
      <line x1={size * 0.35} y1={size * 0.45} x2={size * 0.25} y2={size * 0.35} 
            stroke="#8B4513" strokeWidth="0.5" />
      <ellipse cx={size * 0.23} cy={size * 0.33} rx={size * 0.03} ry={size * 0.06} 
               fill="#FFF" stroke="#DDD" strokeWidth="0.2" transform={`rotate(-45 ${size * 0.23} ${size * 0.33})`} />
      
      <line x1={size * 0.65} y1={size * 0.45} x2={size * 0.75} y2={size * 0.35} 
            stroke="#8B4513" strokeWidth="0.5" />
      <ellipse cx={size * 0.77} cy={size * 0.33} rx={size * 0.03} ry={size * 0.06} 
               fill="#000" stroke="#333" strokeWidth="0.2" transform={`rotate(45 ${size * 0.77} ${size * 0.33})`} />
      
      {/* Sage/herbs */}
      <rect x={size * 0.48} y={size * 0.35} width={size * 0.04} height={size * 0.15} 
            fill="#556B2F" stroke="#3A4F2A" strokeWidth="0.3" />
      
      {/* Beads */}
      <circle cx={size * 0.4} cy={size * 0.65} r={size * 0.02} fill="#4169E1" stroke="#191970" strokeWidth="0.2" />
      <circle cx={size * 0.45} cy={size * 0.67} r={size * 0.02} fill="#DC143C" stroke="#8B0000" strokeWidth="0.2" />
      <circle cx={size * 0.5} cy={size * 0.68} r={size * 0.02} fill="#FFD700" stroke="#DAA520" strokeWidth="0.2" />
      <circle cx={size * 0.55} cy={size * 0.67} r={size * 0.02} fill="#FFF" stroke="#DDD" strokeWidth="0.2" />
      <circle cx={size * 0.6} cy={size * 0.65} r={size * 0.02} fill="#000" stroke="#333" strokeWidth="0.2" />
    </g>
  );
};

/**
 * Peace Pipe Symbol - Sacred ceremonial pipe
 */
export const PeacePipeSymbol: React.FC<SymbolProps> = ({ x, y, size, variant = 'ceremonial' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Pipe stem */}
      <rect x={size * 0.2} y={size * 0.48} width={size * 0.5} height={size * 0.04} 
            fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
      
      {/* Decorative bands on stem */}
      <rect x={size * 0.35} y={size * 0.48} width={size * 0.03} height={size * 0.04} 
            fill="#FFD700" stroke="#DAA520" strokeWidth="0.3" />
      <rect x={size * 0.5} y={size * 0.48} width={size * 0.03} height={size * 0.04} 
            fill="#DC143C" stroke="#8B0000" strokeWidth="0.3" />
      
      {/* Pipe bowl */}
      <g transform={`translate(${size * 0.7}, ${size * 0.5})`}>
        {/* Bowl base */}
        <ellipse cx={0} cy={size * 0.05} rx={size * 0.08} ry={size * 0.1} 
                 fill="#8B0000" stroke="#5C0000" strokeWidth="0.5" />
        {/* Bowl top */}
        <ellipse cx={0} cy={0} rx={size * 0.08} ry={size * 0.03} 
                 fill="#A52A2A" stroke="#8B0000" strokeWidth="0.5" />
        {/* Inner bowl */}
        <ellipse cx={0} cy={0} rx={size * 0.06} ry={size * 0.02} 
                 fill="#2F2F2F" stroke="#1A1A1A" strokeWidth="0.3" />
      </g>
      
      {/* Feathers hanging from stem */}
      {/* Feather 1 */}
      <g transform={`translate(${size * 0.3}, ${size * 0.52})`}>
        <ellipse cx={0} cy={size * 0.08} rx={size * 0.02} ry={size * 0.08} 
                 fill="#8B7355" stroke="#654321" strokeWidth="0.3" />
        <line x1={0} y1={0} x2={0} y2={size * 0.06} 
              stroke="#654321" strokeWidth="0.5" />
      </g>
      
      {/* Feather 2 */}
      <g transform={`translate(${size * 0.45}, ${size * 0.52})`}>
        <ellipse cx={0} cy={size * 0.08} rx={size * 0.02} ry={size * 0.08} 
                 fill="#D2691E" stroke="#8B4513" strokeWidth="0.3" />
        <line x1={0} y1={0} x2={0} y2={size * 0.06} 
              stroke="#8B4513" strokeWidth="0.5" />
      </g>
      
      {/* Smoke wisps (if ceremonial variant) */}
      {variant === 'ceremonial' && (
        <>
          <circle cx={size * 0.7} cy={size * 0.45} r={size * 0.015} 
                  fill="#888" opacity="0.3" />
          <circle cx={size * 0.72} cy={size * 0.42} r={size * 0.02} 
                  fill="#888" opacity="0.25" />
          <circle cx={size * 0.68} cy={size * 0.38} r={size * 0.025} 
                  fill="#888" opacity="0.2" />
        </>
      )}
    </g>
  );
};

/**
 * Dream Catcher Symbol - Traditional protective charm
 */
export const DreamCatcherSymbol: React.FC<SymbolProps> = ({ x, y, size, variant = 'traditional' }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer hoop */}
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.25} 
              fill="none" stroke="#8B4513" strokeWidth="2" />
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.23} 
              fill="none" stroke="#A0522D" strokeWidth="1" />
      
      {/* Web pattern */}
      {/* Center to edges */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x1 = size * 0.5;
        const y1 = size * 0.4;
        const x2 = size * 0.5 + Math.cos(rad) * size * 0.22;
        const y2 = size * 0.4 + Math.sin(rad) * size * 0.22;
        return (
          <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="#D2691E" strokeWidth="0.5" opacity="0.8" />
        );
      })}
      
      {/* Inner web circles */}
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.08} 
              fill="none" stroke="#D2691E" strokeWidth="0.5" opacity="0.8" />
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.15} 
              fill="none" stroke="#D2691E" strokeWidth="0.5" opacity="0.8" />
      
      {/* Center bead */}
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.03} 
              fill="#4169E1" stroke="#191970" strokeWidth="0.5" />
      
      {/* Feathers hanging down */}
      {/* Left feather */}
      <g transform={`translate(${size * 0.35}, ${size * 0.65})`}>
        <ellipse cx={0} cy={0} rx={size * 0.03} ry={size * 0.12} 
                 fill="#8B7355" stroke="#654321" strokeWidth="0.5" />
        <line x1={0} y1={-size * 0.08} x2={0} y2={size * 0.08} 
              stroke="#654321" strokeWidth="0.3" />
        {/* Feather markings */}
        <line x1={-size * 0.02} y1={-size * 0.04} x2={0} y2={-size * 0.02} 
              stroke="#FFF" strokeWidth="0.3" opacity="0.6" />
        <line x1={size * 0.02} y1={0} x2={0} y2={size * 0.02} 
              stroke="#000" strokeWidth="0.3" opacity="0.4" />
      </g>
      
      {/* Center feather */}
      <g transform={`translate(${size * 0.5}, ${size * 0.7})`}>
        <ellipse cx={0} cy={0} rx={size * 0.04} ry={size * 0.15} 
                 fill="#D2691E" stroke="#8B4513" strokeWidth="0.5" />
        <line x1={0} y1={-size * 0.1} x2={0} y2={size * 0.1} 
              stroke="#8B4513" strokeWidth="0.3" />
        {/* Feather markings */}
        <line x1={-size * 0.02} y1={-size * 0.05} x2={0} y2={-size * 0.03} 
              stroke="#FFF" strokeWidth="0.3" opacity="0.6" />
        <line x1={size * 0.02} y1={0} x2={0} y2={size * 0.03} 
              stroke="#000" strokeWidth="0.3" opacity="0.4" />
      </g>
      
      {/* Right feather */}
      <g transform={`translate(${size * 0.65}, ${size * 0.65})`}>
        <ellipse cx={0} cy={0} rx={size * 0.03} ry={size * 0.12} 
                 fill="#8B7355" stroke="#654321" strokeWidth="0.5" />
        <line x1={0} y1={-size * 0.08} x2={0} y2={size * 0.08} 
              stroke="#654321" strokeWidth="0.3" />
        {/* Feather markings */}
        <line x1={-size * 0.02} y1={-size * 0.04} x2={0} y2={-size * 0.02} 
              stroke="#FFF" strokeWidth="0.3" opacity="0.6" />
        <line x1={size * 0.02} y1={0} x2={0} y2={size * 0.02} 
              stroke="#000" strokeWidth="0.3" opacity="0.4" />
      </g>
      
      {/* Connecting strings */}
      <line x1={size * 0.35} y1={size * 0.58} x2={size * 0.35} y2={size * 0.53} 
            stroke="#8B4513" strokeWidth="0.5" />
      <line x1={size * 0.5} y1={size * 0.63} x2={size * 0.5} y2={size * 0.55} 
            stroke="#8B4513" strokeWidth="0.5" />
      <line x1={size * 0.65} y1={size * 0.58} x2={size * 0.65} y2={size * 0.53} 
            stroke="#8B4513" strokeWidth="0.5" />
      
      {/* Beads on strings */}
      <circle cx={size * 0.35} cy={size * 0.55} r={size * 0.015} 
              fill="#DC143C" stroke="#8B0000" strokeWidth="0.3" />
      <circle cx={size * 0.5} cy={size * 0.57} r={size * 0.015} 
              fill="#4169E1" stroke="#191970" strokeWidth="0.3" />
      <circle cx={size * 0.65} cy={size * 0.55} r={size * 0.015} 
              fill="#FFD700" stroke="#DAA520" strokeWidth="0.3" />
    </g>
  );
};