/**
 * Soviet-era ministry building - brutalist architecture
 * Rendered in 2.5D isometric perspective to match mill and fortress symbols
 */
import React from 'react';

interface SovietMinistrySymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: any;
  buildingName?: string;
  variant?: string;
}

const SovietMinistrySymbol: React.FC<SovietMinistrySymbolProps> = ({ x, y, size, seed, buildingName = "Ministry" }) => {
  const uniqueId = `soviet-${x}-${y}-${seed}`;
  const depth = size * 0.2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`concreteGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
        <linearGradient id={`darkGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#989898" />
          <stop offset="100%" stopColor="#787878" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.55} cy={size * 0.85} 
               rx={size * 0.45} ry={size * 0.18} 
               fill="rgba(0,0,0,0.35)" />
      
      {/* Base platform in isometric view */}
      <g>
        <polygon points={`${size * 0.15},${size * 0.75} 
                         ${size * 0.15 + depth * 0.7},${size * 0.75 - depth * 0.35}
                         ${size * 0.85 + depth * 0.7},${size * 0.75 - depth * 0.35}
                         ${size * 0.85},${size * 0.75}`}
                 fill="#888888" stroke="#686868" strokeWidth="0.5" />
        
        <rect x={size * 0.15} y={size * 0.75} 
              width={size * 0.7} height={size * 0.05} 
              fill="#787878" stroke="#585858" strokeWidth="0.5" />
      </g>
      
      {/* Main brutalist tower with proper 3D depth */}
      <g>
        {/* Front face */}
        <rect x={size * 0.25} y={size * 0.25} 
              width={size * 0.5} height={size * 0.5} 
              fill={`url(#concreteGrad-${uniqueId})`} 
              stroke="#888888" strokeWidth="1.2" />
        
        {/* Right side - 3D depth */}
        <path d={`M ${size * 0.75} ${size * 0.25}
                  L ${size * 0.75 + depth * 0.7} ${size * 0.25 - depth * 0.35}
                  L ${size * 0.75 + depth * 0.7} ${size * 0.75 - depth * 0.35}
                  L ${size * 0.75} ${size * 0.75} Z`}
              fill="#989898" stroke="#787878" strokeWidth="0.5" />
        
        {/* Top face */}
        <polygon points={`${size * 0.25},${size * 0.25} 
                         ${size * 0.25 + depth * 0.7},${size * 0.25 - depth * 0.35}
                         ${size * 0.75 + depth * 0.7},${size * 0.25 - depth * 0.35}
                         ${size * 0.75},${size * 0.25}`}
                 fill="#c8c8c8" stroke="#a8a8a8" strokeWidth="0.5" />
        
        {/* Brutalist window grid on front */}
        {[0.3, 0.38, 0.46, 0.54, 0.62, 0.7].map((xPos, i) => 
          [0.32, 0.4, 0.48, 0.56, 0.64].map((yPos, j) => (
            <rect key={`window-${i}-${j}`} 
                  x={size * xPos - 4} 
                  y={size * yPos} 
                  width="8" 
                  height="10" 
                  fill="#3a5a7a" 
                  stroke="#2a4a6a" 
                  strokeWidth="0.5"
                  opacity="0.7" />
          ))
        )}
        
        {/* Vertical concrete ribs for brutalist texture */}
        {[0.35, 0.5, 0.65].map((xPos, i) => (
          <rect key={`rib-${i}`} 
                x={size * xPos - 1} 
                y={size * 0.25} 
                width="2" 
                height={size * 0.5} 
                fill="#b8b8b8" 
                opacity="0.5" />
        ))}
      </g>
      
      {/* Central entrance block with depth */}
      <g>
        {/* Front */}
        <rect x={size * 0.4} y={size * 0.6} 
              width={size * 0.2} height={size * 0.15} 
              fill={`url(#darkGrad-${uniqueId})`} 
              stroke="#686868" strokeWidth="0.8" />
        
        {/* Right side depth */}
        <path d={`M ${size * 0.6} ${size * 0.6}
                  L ${size * 0.6 + depth * 0.3} ${size * 0.6 - depth * 0.15}
                  L ${size * 0.6 + depth * 0.3} ${size * 0.75 - depth * 0.15}
                  L ${size * 0.6} ${size * 0.75} Z`}
              fill="#787878" stroke="#585858" strokeWidth="0.3" />
        
        {/* Top */}
        <polygon points={`${size * 0.4},${size * 0.6} 
                         ${size * 0.4 + depth * 0.3},${size * 0.6 - depth * 0.15}
                         ${size * 0.6 + depth * 0.3},${size * 0.6 - depth * 0.15}
                         ${size * 0.6},${size * 0.6}`}
                 fill="#989898" stroke="#787878" strokeWidth="0.3" />
        
        {/* Entrance columns */}
        {[0.44, 0.48, 0.52, 0.56].map((xPos, i) => (
          <rect key={`entrance-col-${i}`} 
                x={size * xPos - 2} 
                y={size * 0.6} 
                width="4" 
                height={size * 0.15} 
                fill="#888888" 
                stroke="#686868" 
                strokeWidth="0.3" />
        ))}
        
        {/* Main door */}
        <rect x={size * 0.47} y={size * 0.68} 
              width={size * 0.06} height={size * 0.07} 
              fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="0.5" />
      </g>
      
      {/* Soviet star at top */}
      <g>
        <polygon points={`${size * 0.5},${size * 0.18} 
                         ${size * 0.485},${size * 0.21} 
                         ${size * 0.48},${size * 0.195} 
                         ${size * 0.475},${size * 0.21} 
                         ${size * 0.46},${size * 0.205} 
                         ${size * 0.475},${size * 0.2} 
                         ${size * 0.47},${size * 0.185} 
                         ${size * 0.485},${size * 0.19} 
                         ${size * 0.5},${size * 0.17} 
                         ${size * 0.515},${size * 0.19} 
                         ${size * 0.53},${size * 0.185} 
                         ${size * 0.525},${size * 0.2} 
                         ${size * 0.54},${size * 0.205} 
                         ${size * 0.525},${size * 0.21} 
                         ${size * 0.52},${size * 0.195} 
                         ${size * 0.515},${size * 0.21}`}
                 fill="#cc3333" stroke="#aa2222" strokeWidth="0.5" />
      </g>
      
      {/* Side wing buildings */}
      <g>
        {/* Left wing */}
        <rect x={size * 0.1} y={size * 0.45} 
              width={size * 0.12} height={size * 0.3} 
              fill="#b8b8b8" stroke="#888888" strokeWidth="0.8" />
        <path d={`M ${size * 0.22} ${size * 0.45}
                  L ${size * 0.22 + depth * 0.3} ${size * 0.45 - depth * 0.15}
                  L ${size * 0.22 + depth * 0.3} ${size * 0.75 - depth * 0.15}
                  L ${size * 0.22} ${size * 0.75} Z`}
              fill="#989898" stroke="#787878" strokeWidth="0.3" />
        
        {/* Right wing */}
        <rect x={size * 0.78} y={size * 0.45} 
              width={size * 0.12} height={size * 0.3} 
              fill="#b8b8b8" stroke="#888888" strokeWidth="0.8" />
        <path d={`M ${size * 0.9} ${size * 0.45}
                  L ${size * 0.9 + depth * 0.3} ${size * 0.45 - depth * 0.15}
                  L ${size * 0.9 + depth * 0.3} ${size * 0.75 - depth * 0.15}
                  L ${size * 0.9} ${size * 0.75} Z`}
              fill="#989898" stroke="#787878" strokeWidth="0.3" />
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(SovietMinistrySymbol);