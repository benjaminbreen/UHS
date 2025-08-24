/**
 * Mill symbol components for different historical periods and cultural zones
 * Rendered in 2.5D isometric perspective
 */
import React from 'react';

interface MillSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  millType?: string;
}

// Hand quern - prehistoric/ancient grinding stone
export const HandQuernSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `quern-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <radialGradient id={`stoneGrad-${uniqueId}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#9a8a7a" />
          <stop offset="100%" stopColor="#7a6a5a" />
        </radialGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.75} rx={size * 0.35} ry={size * 0.12} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Lower grinding stone */}
      <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.35} ry={size * 0.28} 
               fill={`url(#stoneGrad-${uniqueId})`} stroke="#5a4a3a" strokeWidth="1" />
      
      {/* Grinding surface depression */}
      <ellipse cx={size * 0.5} cy={size * 0.58} rx={size * 0.25} ry={size * 0.18} 
               fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="0.5" />
      
      {/* Upper grinding stone - animated rotation */}
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`0 ${size * 0.48} ${size * 0.5}`}
          to={`360 ${size * 0.48} ${size * 0.5}`}
          dur="6s"
          repeatCount="indefinite"/>
        <ellipse cx={size * 0.48} cy={size * 0.5} rx={size * 0.2} ry={size * 0.15} 
                 fill="#a89888" stroke="#7a6a5a" strokeWidth="0.8" />
      </g>
      
      {/* Handle hole */}
      <circle cx={size * 0.48} cy={size * 0.5} r={size * 0.03} 
              fill="#4a3a2a" />
      
      {/* Wooden handle */}
      <rect x={size * 0.47} y={size * 0.35} width={size * 0.02} height={size * 0.15} 
            fill="#6a4a2a" stroke="#4a2a0a" strokeWidth="0.3" />
      <ellipse cx={size * 0.48} cy={size * 0.34} rx={size * 0.04} ry={size * 0.02} 
               fill="#7a5a3a" />
      
      {/* Grain scatter */}
      {[0.3, 0.4, 0.6, 0.65].map((pos, i) => (
        <circle key={i} cx={size * (0.35 + pos * 0.3)} cy={size * (0.55 + (i % 2) * 0.05)} 
                r={0.5} fill="#d4b896" opacity="0.7" />
      ))}
    </g>
  );
};

// Animal-powered mill with millstones
export const AnimalMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `animal-mill-${x}-${y}`;
  const depth = size * 0.15;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`millStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8b8a8" />
          <stop offset="100%" stopColor="#a89888" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5 + depth * 0.2} cy={size * 0.7 + depth * 0.1} 
               rx={size * 0.4} ry={size * 0.15} fill="rgba(0,0,0,0.3)" />
      
      {/* Mill house base */}
      <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.35} 
            fill="#d4c4b0" stroke="#9a8a7a" strokeWidth="1" />
      
      {/* Roof */}
      <polygon points={`${size * 0.22},${size * 0.4} ${size * 0.5},${size * 0.25} ${size * 0.78},${size * 0.4}`}
               fill="#8a6a4a" stroke="#6a4a2a" strokeWidth="0.5" />
      
      {/* Central pivot post */}
      <rect x={size * 0.48} y={size * 0.3} width={size * 0.04} height={size * 0.4} 
            fill="#6a5a4a" stroke="#4a3a2a" strokeWidth="0.5" />
      
      {/* Rotating beam for animal - animated */}
      <g transform={`rotate(${seed % 360} ${size * 0.5} ${size * 0.5})`}>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`${seed % 360} ${size * 0.5} ${size * 0.5}`}
          to={`${(seed % 360) + 360} ${size * 0.5} ${size * 0.5}`}
          dur="15s"
          repeatCount="indefinite"/>
        <rect x={size * 0.25} y={size * 0.48} width={size * 0.5} height={size * 0.03} 
              fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.3" />
      </g>
      
      {/* Millstones */}
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.18} ry={size * 0.14} 
               fill={`url(#millStone-${uniqueId})`} stroke="#7a6a5a" strokeWidth="0.8" />
      <ellipse cx={size * 0.5} cy={size * 0.52} rx={size * 0.15} ry={size * 0.11} 
               fill="#b8a898" stroke="#8a7a6a" strokeWidth="0.5" />
      
      {/* Door */}
      <rect x={size * 0.47} y={size * 0.6} width={size * 0.06} height={size * 0.15} 
            fill="#5a4a3a" stroke="#3a2a1a" strokeWidth="0.3" />
    </g>
  );
};

// Classic water mill with wheel
export const WaterMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `water-mill-${x}-${y}`;
  const depth = size * 0.2;
  const wheelRotation = (seed % 360);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`buildingGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d4c0" />
          <stop offset="100%" stopColor="#c8b4a0" />
        </linearGradient>
        <linearGradient id={`wheelGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6a4a" />
          <stop offset="100%" stopColor="#6a4a2a" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <polygon points={`${size * 0.25},${size * 0.85} ${size * 0.75},${size * 0.85} 
                        ${size * 0.8},${size * 0.8} ${size * 0.3},${size * 0.8}`}
               fill="rgba(0,0,0,0.35)" />
      
      {/* Mill building */}
      <rect x={size * 0.35} y={size * 0.35} width={size * 0.4} height={size * 0.45} 
            fill={`url(#buildingGrad-${uniqueId})`} stroke="#9a8a7a" strokeWidth="1.2" />
      
      {/* 3D depth - right wall */}
      <path d={`M ${size * 0.75} ${size * 0.35}
                L ${size * 0.75 + depth * 0.7} ${size * 0.35 - depth * 0.35}
                L ${size * 0.75 + depth * 0.7} ${size * 0.8 - depth * 0.35}
                L ${size * 0.75} ${size * 0.8} Z`}
            fill="#b8a490" stroke="#8a7a6a" strokeWidth="0.5" />
      
      {/* Roof */}
      <polygon points={`${size * 0.32},${size * 0.35} ${size * 0.55},${size * 0.2} ${size * 0.78},${size * 0.35}`}
               fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.5" />
      
      {/* Roof 3D depth */}
      <path d={`M ${size * 0.78} ${size * 0.35}
                L ${size * 0.55} ${size * 0.2}
                L ${size * 0.55 + depth * 0.7} ${size * 0.2 - depth * 0.35}
                L ${size * 0.78 + depth * 0.7} ${size * 0.35 - depth * 0.35} Z`}
            fill="#6a4a2a" stroke="#4a2a0a" strokeWidth="0.3" />
      
      {/* Water wheel - animated */}
      <g transform={`rotate(${wheelRotation} ${size * 0.25} ${size * 0.6})`}>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`${wheelRotation} ${size * 0.25} ${size * 0.6}`}
          to={`${wheelRotation + 360} ${size * 0.25} ${size * 0.6}`}
          dur="8s"
          repeatCount="indefinite"/>
        <circle cx={size * 0.25} cy={size * 0.6} r={size * 0.22} 
                fill="none" stroke="#6a4a2a" strokeWidth="2" />
        <circle cx={size * 0.25} cy={size * 0.6} r={size * 0.18} 
                fill="none" stroke="#7a5a3a" strokeWidth="1" />
        
        {/* Wheel spokes and paddles */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = size * 0.25 + Math.cos(angle) * size * 0.05;
          const y1 = size * 0.6 + Math.sin(angle) * size * 0.05;
          const x2 = size * 0.25 + Math.cos(angle) * size * 0.22;
          const y2 = size * 0.6 + Math.sin(angle) * size * 0.22;
          
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#5a3a1a" strokeWidth="1.5" />
              <rect x={x2 - size * 0.03} y={y2 - size * 0.01} 
                    width={size * 0.06} height={size * 0.02} 
                    fill={`url(#wheelGrad-${uniqueId})`} stroke="#4a2a0a" strokeWidth="0.3"
                    transform={`rotate(${i * 45} ${x2} ${y2})`} />
            </g>
          );
        })}
        
        {/* Central hub */}
        <circle cx={size * 0.25} cy={size * 0.6} r={size * 0.05} 
                fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.5" />
      </g>
      
      {/* Windows */}
      <rect x={size * 0.45} y={size * 0.45} width={size * 0.05} height={size * 0.06} 
            fill="#3a3a3a" stroke="#5a4a3a" strokeWidth="0.3" />
      <rect x={size * 0.6} y={size * 0.45} width={size * 0.05} height={size * 0.06} 
            fill="#3a3a3a" stroke="#5a4a3a" strokeWidth="0.3" />
      
      {/* Door */}
      <rect x={size * 0.52} y={size * 0.6} width={size * 0.06} height={size * 0.2} 
            fill="#5a4a3a" stroke="#3a2a1a" strokeWidth="0.5" />
      
      {/* Water indication */}
      <path d={`M ${size * 0.05} ${size * 0.75}
                Q ${size * 0.15} ${size * 0.73} ${size * 0.25} ${size * 0.75}
                Q ${size * 0.35} ${size * 0.77} ${size * 0.45} ${size * 0.75}`}
            fill="none" stroke="rgba(100,150,200,0.4)" strokeWidth="2" />
    </g>
  );
};

// Classic windmill with rotating blades
export const WindmillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `windmill-${x}-${y}`;
  const depth = size * 0.15;
  const bladeRotation = (seed % 360);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`towerGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e0d0" />
          <stop offset="100%" stopColor="#d0c0b0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5 + depth * 0.3} cy={size * 0.85} 
               rx={size * 0.25} ry={size * 0.1} fill="rgba(0,0,0,0.3)" />
      
      {/* Tower base - cylindrical */}
      <path d={`M ${size * 0.35} ${size * 0.8}
                L ${size * 0.37} ${size * 0.3}
                L ${size * 0.63} ${size * 0.3}
                L ${size * 0.65} ${size * 0.8} Z`}
            fill={`url(#towerGrad-${uniqueId})`} stroke="#a89888" strokeWidth="1.2" />
      
      {/* 3D depth */}
      <path d={`M ${size * 0.63} ${size * 0.3}
                Q ${size * 0.7} ${size * 0.32} ${size * 0.7} ${size * 0.4}
                L ${size * 0.68} ${size * 0.82}
                L ${size * 0.65} ${size * 0.8} Z`}
            fill="#c8b8a8" stroke="#9a8a7a" strokeWidth="0.5" />
      
      {/* Cap/roof */}
      <ellipse cx={size * 0.5} cy={size * 0.3} rx={size * 0.15} ry={size * 0.08} 
               fill="#8a6a4a" stroke="#6a4a2a" strokeWidth="0.5" />
      <path d={`M ${size * 0.35} ${size * 0.3}
                Q ${size * 0.5} ${size * 0.15} ${size * 0.65} ${size * 0.3}`}
            fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.5" />
      
      {/* Windmill blades - animated */}
      <g transform={`rotate(${bladeRotation} ${size * 0.5} ${size * 0.35})`}>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`${bladeRotation} ${size * 0.5} ${size * 0.35}`}
          to={`${bladeRotation + 360} ${size * 0.5} ${size * 0.35}`}
          dur="10s"
          repeatCount="indefinite"/>
        {/* Blade arms */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2;
          const x1 = size * 0.5;
          const y1 = size * 0.35;
          const x2 = size * 0.5 + Math.cos(angle) * size * 0.35;
          const y2 = size * 0.35 + Math.sin(angle) * size * 0.35;
          
          return (
            <g key={i}>
              {/* Main beam */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#5a3a1a" strokeWidth="2" />
              
              {/* Sail/blade */}
              <path d={`M ${x1 + Math.cos(angle) * size * 0.1} ${y1 + Math.sin(angle) * size * 0.1}
                        L ${x2} ${y2}
                        L ${x2 + Math.cos(angle + Math.PI/2) * size * 0.08} ${y2 + Math.sin(angle + Math.PI/2) * size * 0.08}
                        L ${x1 + Math.cos(angle) * size * 0.1 + Math.cos(angle + Math.PI/2) * size * 0.04} 
                          ${y1 + Math.sin(angle) * size * 0.1 + Math.sin(angle + Math.PI/2) * size * 0.04} Z`}
                    fill="rgba(250,240,230,0.8)" stroke="#8a7a6a" strokeWidth="0.5" />
              
              {/* Cross beams on sail */}
              <line x1={x1 + Math.cos(angle) * size * 0.15} 
                    y1={y1 + Math.sin(angle) * size * 0.15}
                    x2={x1 + Math.cos(angle) * size * 0.15 + Math.cos(angle + Math.PI/2) * size * 0.06}
                    y2={y1 + Math.sin(angle) * size * 0.15 + Math.sin(angle + Math.PI/2) * size * 0.06}
                    stroke="#6a5a4a" strokeWidth="0.3" />
            </g>
          );
        })}
        
        {/* Central hub */}
        <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.03} 
                fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.5" />
      </g>
      
      {/* Windows */}
      <rect x={size * 0.47} y={size * 0.45} width={size * 0.04} height={size * 0.05} 
            fill="#2a2a2a" stroke="#4a3a2a" strokeWidth="0.3" />
      <rect x={size * 0.47} y={size * 0.6} width={size * 0.04} height={size * 0.05} 
            fill="#2a2a2a" stroke="#4a3a2a" strokeWidth="0.3" />
      
      {/* Door */}
      <rect x={size * 0.47} y={size * 0.72} width={size * 0.06} height={size * 0.08} 
            fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.5" />
    </g>
  );
};

// Steam-powered industrial mill
export const SteamMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `steam-mill-${x}-${y}`;
  const depth = size * 0.2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`brickGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c87868" />
          <stop offset="100%" stopColor="#a85848" />
        </linearGradient>
        <linearGradient id={`metalGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#989898" />
          <stop offset="100%" stopColor="#686868" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <rect x={size * 0.15 + depth * 0.3} y={size * 0.4 + depth * 0.3} 
            width={size * 0.65} height={size * 0.45} 
            fill="rgba(0,0,0,0.35)" />
      
      {/* Main factory building */}
      <rect x={size * 0.15} y={size * 0.4} width={size * 0.65} height={size * 0.45} 
            fill={`url(#brickGrad-${uniqueId})`} stroke="#784838" strokeWidth="1.5" />
      
      {/* 3D depth */}
      <path d={`M ${size * 0.8} ${size * 0.4}
                L ${size * 0.8 + depth} ${size * 0.4 - depth * 0.5}
                L ${size * 0.8 + depth} ${size * 0.85 - depth * 0.5}
                L ${size * 0.8} ${size * 0.85} Z`}
            fill="#985848" stroke="#684838" strokeWidth="0.5" />
      
      {/* Roof */}
      <rect x={size * 0.15} y={size * 0.38} width={size * 0.65} height={size * 0.04} 
            fill="#4a3a2a" />
      
      {/* Smokestacks */}
      <rect x={size * 0.25} y={size * 0.15} width={size * 0.08} height={size * 0.25} 
            fill={`url(#brickGrad-${uniqueId})`} stroke="#584838" strokeWidth="0.8" />
      <rect x={size * 0.6} y={size * 0.2} width={size * 0.06} height={size * 0.2} 
            fill={`url(#brickGrad-${uniqueId})`} stroke="#584838" strokeWidth="0.8" />
      
      {/* Smoke - animated */}
      <g>
        <ellipse cx={size * 0.29} cy={size * 0.12} rx={size * 0.06} ry={size * 0.03} 
                 fill="rgba(80,80,80,0.4)">
          <animate attributeName="cy" 
                   values={`${size * 0.12};${size * 0.08};${size * 0.12}`}
                   dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" 
                   values="0.4;0.2;0.4"
                   dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx={size * 0.63} cy={size * 0.18} rx={size * 0.05} ry={size * 0.025} 
                 fill="rgba(80,80,80,0.3)">
          <animate attributeName="cy" 
                   values={`${size * 0.18};${size * 0.14};${size * 0.18}`}
                   dur="3.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" 
                   values="0.3;0.15;0.3"
                   dur="3.5s" repeatCount="indefinite"/>
        </ellipse>
      </g>
      
      {/* Windows - industrial style */}
      {[0.25, 0.4, 0.55, 0.7].map((xPos, i) => (
        <g key={i}>
          <rect x={size * xPos} y={size * 0.48} width={size * 0.08} height={size * 0.1} 
                fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
          {/* Window panes */}
          <line x1={size * xPos} y1={size * 0.53} x2={size * (xPos + 0.08)} y2={size * 0.53} 
                stroke="#2a2a2a" strokeWidth="0.3" />
          <line x1={size * (xPos + 0.04)} y1={size * 0.48} x2={size * (xPos + 0.04)} y2={size * 0.58} 
                stroke="#2a2a2a" strokeWidth="0.3" />
        </g>
      ))}
      
      {/* Loading dock */}
      <rect x={size * 0.35} y={size * 0.7} width={size * 0.15} height={size * 0.15} 
            fill="#5a4a3a" stroke="#3a2a1a" strokeWidth="0.5" />
      
      {/* Steam engine house attachment */}
      <rect x={size * 0.05} y={size * 0.55} width={size * 0.15} height={size * 0.25} 
            fill={`url(#metalGrad-${uniqueId})`} stroke="#484848" strokeWidth="0.8" />
      
      {/* Flywheel - animated */}
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`0 ${size * 0.125} ${size * 0.67}`}
          to={`360 ${size * 0.125} ${size * 0.67}`}
          dur="2s"
          repeatCount="indefinite"/>
        <circle cx={size * 0.125} cy={size * 0.67} r={size * 0.05} 
                fill="none" stroke="#383838" strokeWidth="1.5" />
        {/* Spokes for visual rotation effect */}
        <line x1={size * 0.125} y1={size * 0.62} x2={size * 0.125} y2={size * 0.72}
              stroke="#484848" strokeWidth="0.5"/>
        <line x1={size * 0.075} y1={size * 0.67} x2={size * 0.175} y2={size * 0.67}
              stroke="#484848" strokeWidth="0.5"/>
        <circle cx={size * 0.125} cy={size * 0.67} r={size * 0.02} 
                fill="#282828" />
      </g>
    </g>
  );
};

// Modern electric mill
export const ElectricMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `electric-mill-${x}-${y}`;
  const depth = size * 0.18;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`modernGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </linearGradient>
        <linearGradient id={`siloGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <rect x={size * 0.1 + depth * 0.3} y={size * 0.45 + depth * 0.3} 
            width={size * 0.75} height={size * 0.4} 
            fill="rgba(0,0,0,0.3)" />
      
      {/* Main processing building */}
      <rect x={size * 0.1} y={size * 0.45} width={size * 0.75} height={size * 0.4} 
            fill={`url(#modernGrad-${uniqueId})`} stroke="#888888" strokeWidth="1.2" />
      
      {/* 3D depth */}
      <path d={`M ${size * 0.85} ${size * 0.45}
                L ${size * 0.85 + depth} ${size * 0.45 - depth * 0.5}
                L ${size * 0.85 + depth} ${size * 0.85 - depth * 0.5}
                L ${size * 0.85} ${size * 0.85} Z`}
            fill="#b8b8b8" stroke="#787878" strokeWidth="0.5" />
      
      {/* Flat modern roof */}
      <rect x={size * 0.1} y={size * 0.43} width={size * 0.75} height={size * 0.03} 
            fill="#989898" />
      
      {/* Grain silos */}
      <ellipse cx={size * 0.25} cy={size * 0.3} rx={size * 0.1} ry={size * 0.08} 
               fill={`url(#siloGrad-${uniqueId})`} stroke="#787878" strokeWidth="0.8" />
      <rect x={size * 0.15} y={size * 0.3} width={size * 0.2} height={size * 0.35} 
            fill={`url(#siloGrad-${uniqueId})`} stroke="#787878" strokeWidth="0.8" />
      
      <ellipse cx={size * 0.45} cy={size * 0.25} rx={size * 0.08} ry={size * 0.06} 
               fill={`url(#siloGrad-${uniqueId})`} stroke="#787878" strokeWidth="0.8" />
      <rect x={size * 0.37} y={size * 0.25} width={size * 0.16} height={size * 0.3} 
            fill={`url(#siloGrad-${uniqueId})`} stroke="#787878" strokeWidth="0.8" />
      
      {/* Modern windows - horizontal strip */}
      <rect x={size * 0.15} y={size * 0.55} width={size * 0.65} height={size * 0.06} 
            fill="#5a7a9a" stroke="#3a5a7a" strokeWidth="0.5" />
      
      {/* Loading bays */}
      <rect x={size * 0.3} y={size * 0.7} width={size * 0.1} height={size * 0.15} 
            fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
      <rect x={size * 0.5} y={size * 0.7} width={size * 0.1} height={size * 0.15} 
            fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
      
      {/* Electrical equipment - pulsing glow */}
      <rect x={size * 0.7} y={size * 0.35} width={size * 0.08} height={size * 0.08} 
            fill="#686868" stroke="#484848" strokeWidth="0.5">
        <animate attributeName="fill" 
                 values="#686868;#787878;#686868"
                 dur="2s" repeatCount="indefinite"/>
      </rect>
      {/* Power lines */}
      <line x1={size * 0.74} y1={size * 0.35} x2={size * 0.74} y2={size * 0.25} 
            stroke="#484848" strokeWidth="0.5" />
      <line x1={size * 0.72} y1={size * 0.25} x2={size * 0.76} y2={size * 0.25} 
            stroke="#484848" strokeWidth="0.3" />
      
      {/* Company sign/logo area */}
      <rect x={size * 0.35} y={size * 0.48} width={size * 0.2} height={size * 0.04} 
            fill="#f0f0f0" stroke="#a8a8a8" strokeWidth="0.3" />
    </g>
  );
};

// Tidal mill with water gate
export const TidalMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `tidal-mill-${x}-${y}`;
  const depth = size * 0.15;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`tidalStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8c8d0" />
          <stop offset="100%" stopColor="#98a8b0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5 + depth * 0.2} cy={size * 0.8} 
               rx={size * 0.35} ry={size * 0.12} fill="rgba(0,0,0,0.3)" />
      
      {/* Mill pond/reservoir indication */}
      <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.4} ry={size * 0.15} 
               fill="rgba(100,150,200,0.2)" stroke="rgba(80,130,180,0.4)" strokeWidth="0.5" />
      
      {/* Mill building */}
      <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.4} 
            fill={`url(#tidalStone-${uniqueId})`} stroke="#687888" strokeWidth="1" />
      
      {/* Roof */}
      <polygon points={`${size * 0.28},${size * 0.35} ${size * 0.5},${size * 0.22} ${size * 0.72},${size * 0.35}`}
               fill="#6a7a8a" stroke="#4a5a6a" strokeWidth="0.5" />
      
      {/* Horizontal water wheel (under building) - animated */}
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`0 ${size * 0.5} ${size * 0.65}`}
          to={`360 ${size * 0.5} ${size * 0.65}`}
          dur="12s"
          repeatCount="indefinite"/>
        <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.15} ry={size * 0.08} 
                 fill="none" stroke="#5a4a3a" strokeWidth="1" strokeDasharray="2,1" />
        {/* Paddle indicators */}
        <line x1={size * 0.35} y1={size * 0.65} x2={size * 0.65} y2={size * 0.65}
              stroke="#4a3a2a" strokeWidth="0.5"/>
        <line x1={size * 0.5} y1={size * 0.57} x2={size * 0.5} y2={size * 0.73}
              stroke="#4a3a2a" strokeWidth="0.5"/>
      </g>
      
      {/* Sluice gates */}
      <rect x={size * 0.25} y={size * 0.6} width={size * 0.04} height={size * 0.15} 
            fill="#4a5a6a" stroke="#2a3a4a" strokeWidth="0.5" />
      <rect x={size * 0.71} y={size * 0.6} width={size * 0.04} height={size * 0.15} 
            fill="#4a5a6a" stroke="#2a3a4a" strokeWidth="0.5" />
      
      {/* Windows */}
      <rect x={size * 0.4} y={size * 0.45} width={size * 0.05} height={size * 0.06} 
            fill="#3a4a5a" stroke="#5a6a7a" strokeWidth="0.3" />
      <rect x={size * 0.55} y={size * 0.45} width={size * 0.05} height={size * 0.06} 
            fill="#3a4a5a" stroke="#5a6a7a" strokeWidth="0.3" />
      
      {/* Door */}
      <rect x={size * 0.47} y={size * 0.58} width={size * 0.06} height={size * 0.17} 
            fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.5" />
      
      {/* Tidal flow indicators */}
      <path d={`M ${size * 0.1} ${size * 0.72}
                Q ${size * 0.2} ${size * 0.7} ${size * 0.3} ${size * 0.72}`}
            fill="none" stroke="rgba(100,150,200,0.5)" strokeWidth="1.5" />
      <path d={`M ${size * 0.7} ${size * 0.72}
                Q ${size * 0.8} ${size * 0.7} ${size * 0.9} ${size * 0.72}`}
            fill="none" stroke="rgba(100,150,200,0.5)" strokeWidth="1.5" />
    </g>
  );
};

// Sugar mill with crushing rollers
export const SugarMillSymbol: React.FC<MillSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `sugar-mill-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`sugarBuild-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d8c0" />
          <stop offset="100%" stopColor="#d0b8a0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.82} rx={size * 0.4} ry={size * 0.12} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Open-sided shelter structure */}
      <rect x={size * 0.2} y={size * 0.4} width={size * 0.6} height={size * 0.4} 
            fill="none" stroke="#8a6a4a" strokeWidth="1.5" />
      
      {/* Support posts */}
      <rect x={size * 0.2} y={size * 0.4} width={size * 0.04} height={size * 0.4} 
            fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.5" />
      <rect x={size * 0.76} y={size * 0.4} width={size * 0.04} height={size * 0.4} 
            fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.5" />
      <rect x={size * 0.48} y={size * 0.4} width={size * 0.04} height={size * 0.4} 
            fill="#7a5a3a" stroke="#5a3a1a" strokeWidth="0.5" />
      
      {/* Thatched roof */}
      <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.5},${size * 0.2} ${size * 0.85},${size * 0.4}`}
               fill="#c8a868" stroke="#a88848" strokeWidth="0.5" />
      {/* Roof texture lines */}
      {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
        <line key={i} x1={size * xPos} y1={size * (0.4 - (0.5 - Math.abs(xPos - 0.5)) * 0.4)} 
              x2={size * xPos} y2={size * 0.4} 
              stroke="#a88848" strokeWidth="0.3" opacity="0.5" />
      ))}
      
      {/* Crushing rollers - animated rotation */}
      <g>
        <g>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${size * 0.4} ${size * 0.6}`}
            to={`-360 ${size * 0.4} ${size * 0.6}`}
            dur="4s"
            repeatCount="indefinite"/>
          <ellipse cx={size * 0.4} cy={size * 0.6} rx={size * 0.06} ry={size * 0.12} 
                   fill="#686868" stroke="#484848" strokeWidth="0.8" />
          <line x1={size * 0.4} y1={size * 0.48} x2={size * 0.4} y2={size * 0.72}
                stroke="#585858" strokeWidth="0.3"/>
        </g>
        <g>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${size * 0.5} ${size * 0.6}`}
            to={`360 ${size * 0.5} ${size * 0.6}`}
            dur="4s"
            repeatCount="indefinite"/>
          <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.06} ry={size * 0.12} 
                   fill="#686868" stroke="#484848" strokeWidth="0.8" />
          <line x1={size * 0.5} y1={size * 0.48} x2={size * 0.5} y2={size * 0.72}
                stroke="#585858" strokeWidth="0.3"/>
        </g>
        <g>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${size * 0.6} ${size * 0.6}`}
            to={`-360 ${size * 0.6} ${size * 0.6}`}
            dur="4s"
            repeatCount="indefinite"/>
          <ellipse cx={size * 0.6} cy={size * 0.6} rx={size * 0.06} ry={size * 0.12} 
                   fill="#686868" stroke="#484848" strokeWidth="0.8" />
          <line x1={size * 0.6} y1={size * 0.48} x2={size * 0.6} y2={size * 0.72}
                stroke="#585858" strokeWidth="0.3"/>
        </g>
      </g>
      
      {/* Drive beam for animal power */}
      <rect x={size * 0.3} y={size * 0.58} width={size * 0.4} height={size * 0.03} 
            fill="#6a4a2a" stroke="#4a2a0a" strokeWidth="0.3" />
      
      {/* Juice collection trough */}
      <rect x={size * 0.35} y={size * 0.72} width={size * 0.3} height={size * 0.05} 
            fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="0.5" />
      
      {/* Boiling house chimney in background */}
      <rect x={size * 0.1} y={size * 0.25} width={size * 0.06} height={size * 0.2} 
            fill="#985848" stroke="#684838" strokeWidth="0.5" />
      <ellipse cx={size * 0.13} cy={size * 0.23} rx={size * 0.04} ry={size * 0.02} 
               fill="rgba(80,80,80,0.4)">
        <animate attributeName="cy" 
                 values={`${size * 0.23};${size * 0.20};${size * 0.23}`}
                 dur="4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" 
                 values="0.4;0.2;0.4"
                 dur="4s" repeatCount="indefinite"/>
      </ellipse>
    </g>
  );
};

// Export function to get appropriate mill type with cultural fallbacks
export const getMillSymbol = (millType: string, era?: string, culturalZone?: string) => {
  const type = millType?.toLowerCase() || '';
  const zone = culturalZone?.toUpperCase() || '';
  
  // First check for specific mill types
  if (type.includes('quern') || type.includes('hand')) {
    return HandQuernSymbol;
  }
  if (type.includes('animal') || type.includes('ox') || type.includes('donkey')) {
    return AnimalMillSymbol;
  }
  if (type.includes('water')) {
    return WaterMillSymbol;
  }
  if (type.includes('wind')) {
    return WindmillSymbol;
  }
  if (type.includes('tidal') || type.includes('tide')) {
    return TidalMillSymbol;
  }
  if (type.includes('steam')) {
    return SteamMillSymbol;
  }
  if (type.includes('electric') || type.includes('modern')) {
    return ElectricMillSymbol;
  }
  if (type.includes('sugar') || type.includes('cane')) {
    return SugarMillSymbol;
  }
  
  // Cultural zone-specific fallbacks
  if (zone) {
    // Pre-columbian Americas, Oceania, and Africa default to hand quern
    if (zone.includes('NORTH_AMERICAN_PRE_COLUMBIAN') || 
        zone.includes('SOUTH_AMERICAN') ||
        zone.includes('OCEANIA') ||
        zone.includes('ABORIGINAL') ||
        zone.includes('SUB_SAHARAN_AFRICAN') ||
        zone.includes('ARCTIC')) {
      return HandQuernSymbol;
    }
    
    // East Asian and South Asian cultures often used water mills early
    if (zone.includes('EAST_ASIAN') || zone.includes('SOUTH_ASIAN')) {
      if (era && (era.includes('modern') || era.includes('industrial'))) {
        return ElectricMillSymbol;
      }
      return WaterMillSymbol;
    }
    
    // Middle Eastern cultures used animal mills commonly
    if (zone.includes('MENA')) {
      if (era && (era.includes('modern') || era.includes('industrial'))) {
        return ElectricMillSymbol;
      }
      return AnimalMillSymbol;
    }
  }
  
  // Era-based defaults if no cultural zone provided
  if (era) {
    if (era.includes('prehistoric') || era.includes('ancient')) return HandQuernSymbol;
    if (era.includes('medieval')) return WaterMillSymbol;
    if (era.includes('renaissance') || era.includes('early_modern')) return WindmillSymbol;
    if (era.includes('industrial')) return SteamMillSymbol;
    if (era.includes('modern') || era.includes('contemporary')) return ElectricMillSymbol;
  }
  
  // Final fallback - hand quern is most universal
  return HandQuernSymbol;
};