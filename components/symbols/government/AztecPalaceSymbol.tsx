/**
 * Aztec/Mesoamerican government palace - for pre-Columbian Americas
 * Rendered in 2.5D isometric perspective to match mill and fortress symbols
 */
import React from 'react';

interface AztecPalaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: any;
  buildingName?: string;
  variant?: string;
}

const AztecPalaceSymbol: React.FC<AztecPalaceSymbolProps> = ({ x, y, size, seed, buildingName = "Tecpan" }) => {
  const uniqueId = `aztec-${x}-${y}-${seed}`;
  const depth = size * 0.2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4c4a8" />
          <stop offset="100%" stopColor="#b4a488" />
        </linearGradient>
        <linearGradient id={`redGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc4444" />
          <stop offset="100%" stopColor="#aa3333" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.55} cy={size * 0.85} 
               rx={size * 0.5} ry={size * 0.2} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Stepped pyramid base in isometric 3D */}
      <g>
        {/* Bottom tier */}
        <g>
          {/* Top face */}
          <polygon points={`${size * 0.2},${size * 0.7} 
                           ${size * 0.2 + depth * 0.6},${size * 0.7 - depth * 0.3}
                           ${size * 0.8 + depth * 0.6},${size * 0.7 - depth * 0.3}
                           ${size * 0.8},${size * 0.7}`}
                   fill="#c4b498" stroke="#a49484" strokeWidth="0.5" />
          
          {/* Front face */}
          <rect x={size * 0.2} y={size * 0.7} 
                width={size * 0.6} height={size * 0.08} 
                fill={`url(#stoneGrad-${uniqueId})`} 
                stroke="#948474" strokeWidth="0.8" />
          
          {/* Right side */}
          <path d={`M ${size * 0.8} ${size * 0.7}
                    L ${size * 0.8 + depth * 0.6} ${size * 0.7 - depth * 0.3}
                    L ${size * 0.8 + depth * 0.6} ${size * 0.78 - depth * 0.3}
                    L ${size * 0.8} ${size * 0.78} Z`}
                fill="#a49484" stroke="#847464" strokeWidth="0.5" />
        </g>
        
        {/* Middle tier */}
        <g>
          {/* Top face */}
          <polygon points={`${size * 0.3},${size * 0.6} 
                           ${size * 0.3 + depth * 0.4},${size * 0.6 - depth * 0.2}
                           ${size * 0.7 + depth * 0.4},${size * 0.6 - depth * 0.2}
                           ${size * 0.7},${size * 0.6}`}
                   fill="#d4c4a8" stroke="#b4a488" strokeWidth="0.5" />
          
          {/* Front face */}
          <rect x={size * 0.3} y={size * 0.6} 
                width={size * 0.4} height={size * 0.1} 
                fill={`url(#stoneGrad-${uniqueId})`} 
                stroke="#948474" strokeWidth="0.8" />
          
          {/* Right side */}
          <path d={`M ${size * 0.7} ${size * 0.6}
                    L ${size * 0.7 + depth * 0.4} ${size * 0.6 - depth * 0.2}
                    L ${size * 0.7 + depth * 0.4} ${size * 0.7 - depth * 0.2}
                    L ${size * 0.7} ${size * 0.7} Z`}
                fill="#b4a488" stroke="#948474" strokeWidth="0.5" />
        </g>
        
        {/* Top tier */}
        <g>
          {/* Top face */}
          <polygon points={`${size * 0.4},${size * 0.48} 
                           ${size * 0.4 + depth * 0.2},${size * 0.48 - depth * 0.1}
                           ${size * 0.6 + depth * 0.2},${size * 0.48 - depth * 0.1}
                           ${size * 0.6},${size * 0.48}`}
                   fill="#e4d4b8" stroke="#c4b498" strokeWidth="0.5" />
          
          {/* Front face */}
          <rect x={size * 0.4} y={size * 0.48} 
                width={size * 0.2} height={size * 0.12} 
                fill={`url(#stoneGrad-${uniqueId})`} 
                stroke="#948474" strokeWidth="0.8" />
          
          {/* Right side */}
          <path d={`M ${size * 0.6} ${size * 0.48}
                    L ${size * 0.6 + depth * 0.2} ${size * 0.48 - depth * 0.1}
                    L ${size * 0.6 + depth * 0.2} ${size * 0.6 - depth * 0.1}
                    L ${size * 0.6} ${size * 0.6} Z`}
                fill="#c4b498" stroke="#a49484" strokeWidth="0.5" />
        </g>
      </g>
      
      {/* Palace structure on top with 3D depth */}
      <g>
        {/* Main building front */}
        <rect x={size * 0.35} y={size * 0.28} 
              width={size * 0.3} height={size * 0.2} 
              fill="#d4c4a8" stroke="#a49484" strokeWidth="1" />
        
        {/* Decorative red band */}
        <rect x={size * 0.35} y={size * 0.32} 
              width={size * 0.3} height={size * 0.03} 
              fill={`url(#redGrad-${uniqueId})`} />
        
        {/* Right side 3D depth */}
        <path d={`M ${size * 0.65} ${size * 0.28}
                  L ${size * 0.65 + depth * 0.4} ${size * 0.28 - depth * 0.2}
                  L ${size * 0.65 + depth * 0.4} ${size * 0.48 - depth * 0.2}
                  L ${size * 0.65} ${size * 0.48} Z`}
              fill="#b4a488" stroke="#948474" strokeWidth="0.5" />
        
        {/* Flat roof */}
        <polygon points={`${size * 0.35},${size * 0.28} 
                         ${size * 0.35 + depth * 0.4},${size * 0.28 - depth * 0.2}
                         ${size * 0.65 + depth * 0.4},${size * 0.28 - depth * 0.2}
                         ${size * 0.65},${size * 0.28}`}
                 fill="#c4b498" stroke="#a49484" strokeWidth="0.5" />
        
        {/* Stone columns with cylindrical effect */}
        {[0.4, 0.48, 0.56].map((xPos, i) => (
          <g key={`col-${i}`}>
            <rect x={size * xPos - 2} y={size * 0.35} 
                  width="4" height={size * 0.13} 
                  fill="#e4d4b8" stroke="#b4a488" strokeWidth="0.5" />
            {/* Column capital */}
            <ellipse cx={size * xPos} cy={size * 0.35} 
                     rx="3" ry="1.5" 
                     fill="#f4e4c8" stroke="#c4b498" strokeWidth="0.3" />
            {/* Column base */}
            <ellipse cx={size * xPos} cy={size * 0.48} 
                     rx="3" ry="1.5" 
                     fill="#d4c4a8" stroke="#a49484" strokeWidth="0.3" />
          </g>
        ))}
      </g>
      
      {/* Serpent head decorations (Quetzalcoatl) at corners */}
      <g>
        {/* Left serpent */}
        <g>
          <ellipse cx={size * 0.32} cy={size * 0.26} 
                   rx="4" ry="3" 
                   fill={`url(#redGrad-${uniqueId})`} stroke="#883333" strokeWidth="0.5" />
          <circle cx={size * 0.31} cy={size * 0.25} r="1" fill="#fff" />
          <circle cx={size * 0.31} cy={size * 0.25} r="0.5" fill="#000" />
          {/* Feathers */}
          <path d={`M ${size * 0.32} ${size * 0.23}
                    Q ${size * 0.29} ${size * 0.21}, ${size * 0.3} ${size * 0.19}
                    Q ${size * 0.31} ${size * 0.21}, ${size * 0.32} ${size * 0.23}`}
                fill="#44aa44" stroke="#338833" strokeWidth="0.3" opacity="0.8" />
        </g>
        
        {/* Right serpent */}
        <g>
          <ellipse cx={size * 0.68} cy={size * 0.26} 
                   rx="4" ry="3" 
                   fill={`url(#redGrad-${uniqueId})`} stroke="#883333" strokeWidth="0.5" />
          <circle cx={size * 0.69} cy={size * 0.25} r="1" fill="#fff" />
          <circle cx={size * 0.69} cy={size * 0.25} r="0.5" fill="#000" />
          {/* Feathers */}
          <path d={`M ${size * 0.68} ${size * 0.23}
                    Q ${size * 0.71} ${size * 0.21}, ${size * 0.7} ${size * 0.19}
                    Q ${size * 0.69} ${size * 0.21}, ${size * 0.68} ${size * 0.23}`}
                fill="#44aa44" stroke="#338833" strokeWidth="0.3" opacity="0.8" />
        </g>
      </g>
      
      {/* Central doorway with depth */}
      <g>
        <rect x={size * 0.47} y={size * 0.38} 
              width={size * 0.06} height={size * 0.1} 
              fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="0.8" />
        
        {/* Doorway depth */}
        <path d={`M ${size * 0.53} ${size * 0.38}
                  L ${size * 0.53 + 2} ${size * 0.38 - 1}
                  L ${size * 0.53 + 2} ${size * 0.48 - 1}
                  L ${size * 0.53} ${size * 0.48} Z`}
              fill="#1a1a1a" strokeWidth="0.3" />
      </g>
      
      {/* Decorative glyphs on front */}
      <g opacity="0.6">
        {[0.38, 0.44, 0.56, 0.62].map((xPos, i) => (
          <rect key={`glyph-${i}`} 
                x={size * xPos} y={size * 0.4} 
                width="3" height="3" 
                fill="#aa3333" />
        ))}
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(AztecPalaceSymbol);