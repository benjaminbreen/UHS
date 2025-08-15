/**
 * Improved Palace symbols with consistent 2.5D perspective and shadows
 */
import React from 'react';

interface PalaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

// Shared shadow component for consistency
const PalaceShadow: React.FC<{cx: number, cy: number, size: number}> = ({cx, cy, size}) => (
  <ellipse 
    cx={cx} 
    cy={cy} 
    rx={size * 0.45} 
    ry={size * 0.18} 
    fill="rgba(0,0,0,0.25)"
    filter="blur(2px)"
  />
);

// Generic Palace with 2.5D perspective
export const GenericPalaceSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `palace-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`palaceGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e4d4" />
          <stop offset="50%" stopColor="#e8d8c8" />
          <stop offset="100%" stopColor="#d4c4b0" />
        </linearGradient>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc9966" />
          <stop offset="100%" stopColor="#996633" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <PalaceShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main palace body - 2.5D */}
      <g filter="url(#shadow)">
        {/* Front face */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.6} height={size * 0.35} 
              fill={`url(#palaceGrad-${uniqueId})`} />
        
        {/* Top face (roof base) */}
        <polygon points={`${size * 0.2},${size * 0.4} ${size * 0.3},${size * 0.33} ${size * 0.9},${size * 0.33} ${size * 0.8},${size * 0.4}`}
                 fill="#e0d0c0" />
        
        {/* Right face */}
        <polygon points={`${size * 0.8},${size * 0.4} ${size * 0.9},${size * 0.33} ${size * 0.9},${size * 0.68} ${size * 0.8},${size * 0.75}`}
                 fill="#d0c0b0" />
        
        {/* Roof */}
        <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.5},${size * 0.25} ${size * 0.95},${size * 0.25} ${size * 0.85},${size * 0.4}`}
                 fill={`url(#roofGrad-${uniqueId})`} />
        
        {/* Columns */}
        {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.015} 
                y={size * 0.45} 
                width={size * 0.03} height={size * 0.3} 
                fill="#f0e0d0" stroke="#d0c0b0" strokeWidth="0.5" />
        ))}
        
        {/* Central dome */}
        <ellipse cx={size * 0.5} cy={size * 0.3} 
                 rx={size * 0.12} ry={size * 0.08} 
                 fill="#cc9966" />
        
        {/* Windows */}
        {[0.35, 0.5, 0.65].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.03} 
                y={size * 0.52} 
                width={size * 0.06} height={size * 0.08} 
                fill="#4a7a9a" opacity="0.7" />
        ))}
      </g>
      
      {/* Animated flag */}
      <g transform={`translate(${size * 0.85}, ${size * 0.25})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.15} 
              stroke="#8a6a4a" strokeWidth="1" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-3;0;3;0"
            dur="4s"
            repeatCount="indefinite"
          />
          <rect x={0} y={-size * 0.15} 
                width={size * 0.08} height={size * 0.05} 
                fill="#cc3333" opacity="0.9" />
        </g>
      </g>
    </g>
  );
};

// Japanese Castle with proper 2.5D perspective
export const JapaneseCastleSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `japcastle-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`japWall-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f8f0" />
          <stop offset="100%" stopColor="#e0e0d8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <PalaceShadow cx={size * 0.51} cy={size * 0.78} size={size} />
      
      {/* Stone base - 2.5D */}
      <polygon points={`${size * 0.25},${size * 0.7} ${size * 0.75},${size * 0.7} ${size * 0.85},${size * 0.6} ${size * 0.35},${size * 0.6}`}
               fill="#c0c0c0" stroke="#888888" strokeWidth="1" />
      
      {/* Multi-tiered keep with proper perspective */}
      {[0, 1, 2, 3].map((tier) => {
        const tierSize = 1 - tier * 0.12;
        const tierY = 0.6 - tier * 0.1;
        return (
          <g key={tier}>
            {/* Building tier */}
            <rect x={size * (0.5 - 0.15 * tierSize)} 
                  y={size * (tierY - 0.05)} 
                  width={size * 0.3 * tierSize} 
                  height={size * 0.08} 
                  fill={`url(#japWall-${uniqueId})`} />
            
            {/* 3D side */}
            <polygon points={`${size * (0.5 + 0.15 * tierSize)},${size * (tierY - 0.05)} 
                              ${size * (0.5 + 0.18 * tierSize)},${size * (tierY - 0.08)} 
                              ${size * (0.5 + 0.18 * tierSize)},${size * (tierY + 0.03)} 
                              ${size * (0.5 + 0.15 * tierSize)},${size * (tierY + 0.03)}`}
                     fill="#d0d0c8" />
            
            {/* Curved roof */}
            <path d={`M ${size * (0.5 - 0.18 * tierSize)} ${size * (tierY - 0.05)}
                      Q ${size * 0.5} ${size * (tierY - 0.1)}
                      ${size * (0.5 + 0.18 * tierSize)} ${size * (tierY - 0.05)}`}
                  fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
          </g>
        );
      })}
      
      {/* Windows */}
      {[0.42, 0.5, 0.58].map((xPos, i) => (
        <rect key={i} 
              x={size * xPos} y={size * 0.48} 
              width={size * 0.02} height={size * 0.03} 
              fill="#1a1a1a" />
      ))}
      
      {/* Cherry blossom tree (seasonal) */}
      {seed % 4 === 0 && (
        <g transform={`translate(${size * 0.15}, ${size * 0.65})`}>
          <rect x={0} y={0} width={size * 0.02} height={size * 0.15} fill="#6a4a3a" />
          <circle cx={size * 0.01} cy={-size * 0.05} r={size * 0.08} 
                  fill="rgba(255,182,193,0.8)" />
        </g>
      )}
    </g>
  );
};

// Feudal Keep with improved 2.5D
export const FeudalKeepSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `keep-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`keepStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0b0a0" />
          <stop offset="100%" stopColor="#908070" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <PalaceShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main keep structure - 2.5D */}
      <g>
        {/* Front wall */}
        <rect x={size * 0.3} y={size * 0.25} 
              width={size * 0.4} height={size * 0.5} 
              fill={`url(#keepStone-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.3},${size * 0.25} ${size * 0.4},${size * 0.18} ${size * 0.8},${size * 0.18} ${size * 0.7},${size * 0.25}`}
                 fill="#d0c0b0" />
        
        {/* Right face */}
        <polygon points={`${size * 0.7},${size * 0.25} ${size * 0.8},${size * 0.18} ${size * 0.8},${size * 0.68} ${size * 0.7},${size * 0.75}`}
                 fill="#a09080" />
        
        {/* Crenellations */}
        {[0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.02} 
                y={size * 0.23} 
                width={size * 0.04} height={size * 0.03} 
                fill="#b0a090" />
        ))}
        
        {/* Arrow slits */}
        {[0.4, 0.5, 0.6].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.005} 
                y={size * 0.35 + i * size * 0.1} 
                width={size * 0.01} height={size * 0.04} 
                fill="#1a1a1a" />
        ))}
        
        {/* Gate */}
        <rect x={size * 0.47} y={size * 0.6} 
              width={size * 0.06} height={size * 0.15} 
              fill="#3a2a1a" />
        
        {/* Portcullis */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} 
                x1={size * (0.475 + i * 0.015)} y1={size * 0.6} 
                x2={size * (0.475 + i * 0.015)} y2={size * 0.75} 
                stroke="#2a1a0a" strokeWidth="0.5" />
        ))}
      </g>
      
      {/* Banner */}
      <g transform={`translate(${size * 0.5}, ${size * 0.18})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.1} 
              stroke="#5a4a3a" strokeWidth="0.8" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-2;0;2;0"
            dur="3.5s"
            repeatCount="indefinite"
          />
          <polygon points={`0,${-size * 0.1} ${size * 0.06},${-size * 0.08} ${size * 0.06},${-size * 0.04} 0,${-size * 0.06}`}
                   fill="#4444cc" opacity="0.9" />
        </g>
      </g>
    </g>
  );
};

// Roman Villa with proper perspective
export const RomanVillaSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `villa-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`villaGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f0e8" />
          <stop offset="100%" stopColor="#e8d8c8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <PalaceShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Main villa structure */}
      <g>
        {/* Central building */}
        <rect x={size * 0.25} y={size * 0.35} 
              width={size * 0.5} height={size * 0.35} 
              fill={`url(#villaGrad-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.25},${size * 0.35} ${size * 0.35},${size * 0.28} ${size * 0.85},${size * 0.28} ${size * 0.75},${size * 0.35}`}
                 fill="#f0e8e0" />
        
        {/* Right wing */}
        <polygon points={`${size * 0.75},${size * 0.35} ${size * 0.85},${size * 0.28} ${size * 0.85},${size * 0.63} ${size * 0.75},${size * 0.7}`}
                 fill="#e0d0c0" />
        
        {/* Columns */}
        {[0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
          <g key={i}>
            <rect x={size * xPos - size * 0.015} 
                  y={size * 0.4} 
                  width={size * 0.03} height={size * 0.25} 
                  fill="#f8f0e8" />
            <ellipse cx={size * xPos} cy={size * 0.4} 
                     rx={size * 0.02} ry={size * 0.01} 
                     fill="#ffffff" />
          </g>
        ))}
        
        {/* Red tile roof */}
        <polygon points={`${size * 0.2},${size * 0.35} ${size * 0.5},${size * 0.22} ${size * 0.9},${size * 0.22} ${size * 0.8},${size * 0.35}`}
                 fill="#cc6644" opacity="0.9" />
        
        {/* Courtyard fountain */}
        <ellipse cx={size * 0.5} cy={size * 0.85} 
                 rx={size * 0.08} ry={size * 0.04} 
                 fill="#4a7a9a" opacity="0.6" />
      </g>
    </g>
  );
};

// Viking Hall with smoke and proper 2.5D
export const VikingHallSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `viking-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`vikingWood-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b6f47" />
          <stop offset="100%" stopColor="#6b4f27" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <PalaceShadow cx={size * 0.5} cy={size * 0.78} size={size} />
      
      {/* Main longhouse structure */}
      <g>
        {/* Front wall */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.6} height={size * 0.35} 
              fill={`url(#vikingWood-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.2},${size * 0.4} ${size * 0.32},${size * 0.32} ${size * 0.92},${size * 0.32} ${size * 0.8},${size * 0.4}`}
                 fill="#9b7f57" />
        
        {/* Right face */}
        <polygon points={`${size * 0.8},${size * 0.4} ${size * 0.92},${size * 0.32} ${size * 0.92},${size * 0.67} ${size * 0.8},${size * 0.75}`}
                 fill="#7b5f37" />
        
        {/* Steep thatched roof */}
        <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.5},${size * 0.15} ${size * 0.97},${size * 0.15} ${size * 0.85},${size * 0.4}`}
                 fill="#5a4a3a" stroke="#3a2a1a" strokeWidth="0.5" />
        
        {/* Dragon head decoration */}
        <path d={`M ${size * 0.5} ${size * 0.15} 
                  L ${size * 0.48} ${size * 0.1} 
                  L ${size * 0.52} ${size * 0.1} 
                  Z`}
              fill="#cc6633" />
        
        {/* Door */}
        <rect x={size * 0.47} y={size * 0.6} 
              width={size * 0.06} height={size * 0.15} 
              fill="#4a3a2a" />
        
        {/* Shield decorations */}
        {[0.3, 0.4, 0.6, 0.7].map((xPos, i) => (
          <circle key={i} 
                  cx={size * xPos} cy={size * 0.48} 
                  r={size * 0.03} 
                  fill={i % 2 === 0 ? "#cc3333" : "#3333cc"} 
                  stroke="#2a2a2a" strokeWidth="0.5" />
        ))}
      </g>
      
      {/* Animated smoke from chimney */}
      <g opacity="0.6">
        {[0, 1, 2].map((i) => (
          <circle key={i} 
                  cx={size * 0.7} 
                  cy={size * 0.25}
                  r={size * 0.03}
                  fill="#666666">
            <animate attributeName="cy" 
                     values={`${size * 0.25};${size * 0.1};${size * -0.05}`}
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
            <animate attributeName="r" 
                     values={`${size * 0.03};${size * 0.05};${size * 0.07}`}
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.6;0.3;0"
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
          </circle>
        ))}
      </g>
    </g>
  );
};

// Export function to get appropriate palace type
export const getPalaceSymbol = (palaceType: string, culture?: string, era?: string) => {
  const type = palaceType?.toLowerCase() || '';
  
  if (type.includes('japanese') || type.includes('shogun') || type.includes('daimyo')) {
    return JapaneseCastleSymbol;
  }
  if (type.includes('feudal') || type.includes('keep') || type.includes('donjon')) {
    return FeudalKeepSymbol;
  }
  if (type.includes('roman') || type.includes('villa')) {
    return RomanVillaSymbol;
  }
  if (type.includes('viking') || type.includes('jarl') || type.includes('mead')) {
    return VikingHallSymbol;
  }
  
  // Culture-based selection
  if (culture) {
    if (culture.includes('japan') || culture.includes('east_asian')) return JapaneseCastleSymbol;
    if (culture.includes('norse') || culture.includes('viking')) return VikingHallSymbol;
    if (culture.includes('roman') || culture.includes('classical')) return RomanVillaSymbol;
    if (culture.includes('medieval') || culture.includes('feudal')) return FeudalKeepSymbol;
  }
  
  return GenericPalaceSymbol; // Default
};