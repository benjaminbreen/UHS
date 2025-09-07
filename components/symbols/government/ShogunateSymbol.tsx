/**
 * Japanese Shogunate administrative building - for feudal Japan
 * Rendered in 2.5D isometric perspective to match mill and fortress symbols
 */
import React from 'react';

interface ShogunateSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: any;
  buildingName?: string;
  variant?: string;
}

const ShogunateSymbol: React.FC<ShogunateSymbolProps> = ({ x, y, size, seed, buildingName = "Bakufu" }) => {
  const uniqueId = `shogunate-${x}-${y}-${seed}`;
  const depth = size * 0.18;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`woodGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b6841" />
          <stop offset="100%" stopColor="#6a4829" />
        </linearGradient>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a5568" />
          <stop offset="100%" stopColor="#2a3548" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.82} 
               rx={size * 0.45} ry={size * 0.18} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Raised platform (engawa) in isometric view */}
      <g>
        {/* Platform top */}
        <polygon points={`${size * 0.2},${size * 0.7} 
                         ${size * 0.2 + depth * 0.7},${size * 0.7 - depth * 0.35}
                         ${size * 0.8 + depth * 0.7},${size * 0.7 - depth * 0.35}
                         ${size * 0.8},${size * 0.7}`}
                 fill="#7a5835" stroke="#5a3815" strokeWidth="0.5" />
        
        {/* Platform front */}
        <rect x={size * 0.2} y={size * 0.7} 
              width={size * 0.6} height={size * 0.08} 
              fill="#6a4829" stroke="#4a2809" strokeWidth="0.5" />
        
        {/* Platform right side */}
        <path d={`M ${size * 0.8} ${size * 0.7}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.7 - depth * 0.35}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.78 - depth * 0.35}
                  L ${size * 0.8} ${size * 0.78} Z`}
              fill="#5a3819" stroke="#3a1809" strokeWidth="0.3" />
      </g>
      
      {/* Main building structure with proper 3D depth */}
      <g>
        {/* Front face */}
        <rect x={size * 0.25} y={size * 0.4} 
              width={size * 0.5} height={size * 0.3} 
              fill={`url(#woodGrad-${uniqueId})`} 
              stroke="#5a3819" strokeWidth="1" />
        
        {/* White plaster panels (shoji/fusuma style) */}
        <rect x={size * 0.28} y={size * 0.44} 
              width={size * 0.44} height={size * 0.22} 
              fill="#f8f4e8" stroke="#6a4829" strokeWidth="0.8" />
        
        {/* Grid pattern on panels */}
        {[0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
          <line key={`v-grid-${i}`} 
                x1={size * xPos} y1={size * 0.44} 
                x2={size * xPos} y2={size * 0.66}
                stroke="#d8d4c8" strokeWidth="0.5" />
        ))}
        {[0.5, 0.56, 0.62].map((yPos, i) => (
          <line key={`h-grid-${i}`} 
                x1={size * 0.28} y1={size * yPos} 
                x2={size * 0.72} y2={size * yPos}
                stroke="#d8d4c8" strokeWidth="0.5" />
        ))}
        
        {/* Right side 3D depth */}
        <path d={`M ${size * 0.75} ${size * 0.4}
                  L ${size * 0.75 + depth * 0.7} ${size * 0.4 - depth * 0.35}
                  L ${size * 0.75 + depth * 0.7} ${size * 0.7 - depth * 0.35}
                  L ${size * 0.75} ${size * 0.7} Z`}
              fill="#6a4829" stroke="#4a2809" strokeWidth="0.5" />
        
        {/* Vertical support posts */}
        {[0.25, 0.4, 0.6, 0.75].map((xPos, i) => (
          <rect key={`post-${i}`} 
                x={size * xPos - 2} y={size * 0.4} 
                width="4" height={size * 0.3} 
                fill="#5a3819" stroke="#3a1809" strokeWidth="0.5" />
        ))}
      </g>
      
      {/* Traditional curved roof with proper 3D layers */}
      <g>
        {/* Main roof */}
        <path d={`M ${size * 0.15} ${size * 0.42}
                  Q ${size * 0.12} ${size * 0.35}, ${size * 0.2} ${size * 0.3}
                  L ${size * 0.8} ${size * 0.3}
                  Q ${size * 0.88} ${size * 0.35}, ${size * 0.85} ${size * 0.42}
                  Z`}
              fill={`url(#roofGrad-${uniqueId})`} 
              stroke="#1a2538" strokeWidth="0.8" />
        
        {/* Roof 3D depth - right side */}
        <path d={`M ${size * 0.85} ${size * 0.42}
                  Q ${size * 0.88} ${size * 0.35}, ${size * 0.8} ${size * 0.3}
                  L ${size * 0.8 + depth * 0.6} ${size * 0.3 - depth * 0.3}
                  Q ${size * 0.88 + depth * 0.6} ${size * 0.35 - depth * 0.3}, 
                    ${size * 0.85 + depth * 0.6} ${size * 0.42 - depth * 0.3}
                  Z`}
              fill="#3a4558" stroke="#1a2538" strokeWidth="0.5" />
        
        {/* Ridge line with ornamental tiles */}
        <path d={`M ${size * 0.2} ${size * 0.3}
                  L ${size * 0.8 + depth * 0.6} ${size * 0.3 - depth * 0.3}`}
              stroke="#1a2538" strokeWidth="1.5" />
        
        {/* Upper tier roof (pagoda style) */}
        <path d={`M ${size * 0.3} ${size * 0.32}
                  Q ${size * 0.28} ${size * 0.26}, ${size * 0.33} ${size * 0.22}
                  L ${size * 0.67} ${size * 0.22}
                  Q ${size * 0.72} ${size * 0.26}, ${size * 0.7} ${size * 0.32}
                  Z`}
              fill="#5a6578" stroke="#2a3548" strokeWidth="0.5" />
        
        {/* Upper roof 3D depth */}
        <path d={`M ${size * 0.7} ${size * 0.32}
                  Q ${size * 0.72} ${size * 0.26}, ${size * 0.67} ${size * 0.22}
                  L ${size * 0.67 + depth * 0.4} ${size * 0.22 - depth * 0.2}
                  Q ${size * 0.72 + depth * 0.4} ${size * 0.26 - depth * 0.2}, 
                    ${size * 0.7 + depth * 0.4} ${size * 0.32 - depth * 0.2}
                  Z`}
              fill="#4a5568" stroke="#2a3548" strokeWidth="0.3" />
      </g>
      
      {/* Entrance with proper depth */}
      <g>
        <rect x={size * 0.47} y={size * 0.55} 
              width={size * 0.06} height={size * 0.15} 
              fill="#3a2819" stroke="#2a1809" strokeWidth="0.8" />
        
        {/* Door frame depth */}
        <path d={`M ${size * 0.53} ${size * 0.55}
                  L ${size * 0.53 + 2} ${size * 0.55 - 1}
                  L ${size * 0.53 + 2} ${size * 0.7 - 1}
                  L ${size * 0.53} ${size * 0.7} Z`}
              fill="#2a1809" strokeWidth="0.3" />
      </g>
      
      {/* Traditional lantern */}
      <g>
        <rect x={size * 0.78} y={size * 0.65} 
              width={size * 0.03} height={size * 0.05} 
              fill="#8a6a4a" stroke="#6a4a2a" strokeWidth="0.3" />
        <ellipse cx={size * 0.795} cy={size * 0.64} 
                 rx="2" ry="1" 
                 fill="#f8e8a8" stroke="#8a6a4a" strokeWidth="0.3" />
      </g>
      
      {/* Small decorative tree/bonsai */}
      <g>
        <ellipse cx={size * 0.15} cy={size * 0.75} 
                 rx="3" ry="1.5" 
                 fill="#4a3a2a" />
        <ellipse cx={size * 0.15} cy={size * 0.72} 
                 rx="5" ry="3" 
                 fill="#6a8a4a" opacity="0.8" />
        <ellipse cx={size * 0.15} cy={size * 0.69} 
                 rx="4" ry="2.5" 
                 fill="#7a9a5a" opacity="0.8" />
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(ShogunateSymbol);