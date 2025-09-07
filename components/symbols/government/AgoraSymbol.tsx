/**
 * Ancient Greek Agora - public square and government center
 * Rendered in 2.5D isometric perspective to match mill and fortress symbols
 */
import React from 'react';

interface AgoraSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: any;
  buildingName?: string;
  variant?: string;
}

const AgoraSymbol: React.FC<AgoraSymbolProps> = ({ x, y, size, seed, buildingName = "Agora" }) => {
  const uniqueId = `agora-${x}-${y}-${seed}`;
  const depth = size * 0.2;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`marbleGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f5f0" />
          <stop offset="100%" stopColor="#e8e5e0" />
        </linearGradient>
        <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d5d0" />
          <stop offset="100%" stopColor="#c8c5c0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.55} cy={size * 0.85} 
               rx={size * 0.5} ry={size * 0.2} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Plaza floor in isometric perspective */}
      <g>
        <polygon points={`${size * 0.15},${size * 0.65} 
                         ${size * 0.15 + depth * 0.7},${size * 0.65 - depth * 0.35}
                         ${size * 0.85 + depth * 0.7},${size * 0.65 - depth * 0.35}
                         ${size * 0.85},${size * 0.65}`}
                 fill="#f0ede8" stroke="#d8d5d0" strokeWidth="0.5" />
        
        {/* Marble pattern lines on floor */}
        {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
          <line key={`floor-line-${i}`}
                x1={size * xPos} y1={size * 0.65}
                x2={size * xPos + depth * 0.7} y2={size * 0.65 - depth * 0.35}
                stroke="#e0ddd8" strokeWidth="0.3" opacity="0.5" />
        ))}
      </g>
      
      {/* Back colonnade - Stoa with proper 3D depth */}
      <g>
        {/* Main structure */}
        <rect x={size * 0.2} y={size * 0.3} 
              width={size * 0.6} height={size * 0.25} 
              fill={`url(#marbleGrad-${uniqueId})`} 
              stroke="#b8b5b0" strokeWidth="1" />
        
        {/* 3D depth - right side */}
        <path d={`M ${size * 0.8} ${size * 0.3}
                  L ${size * 0.8 + depth * 0.5} ${size * 0.3 - depth * 0.25}
                  L ${size * 0.8 + depth * 0.5} ${size * 0.55 - depth * 0.25}
                  L ${size * 0.8} ${size * 0.55} Z`}
              fill="#d8d5d0" stroke="#a8a5a0" strokeWidth="0.5" />
        
        {/* Roof */}
        <polygon points={`${size * 0.18},${size * 0.3} ${size * 0.5},${size * 0.18} ${size * 0.82},${size * 0.3}`}
                 fill="#b87355" stroke="#985435" strokeWidth="0.5" />
        
        {/* Roof 3D depth */}
        <path d={`M ${size * 0.82} ${size * 0.3}
                  L ${size * 0.5} ${size * 0.18}
                  L ${size * 0.5 + depth * 0.5} ${size * 0.18 - depth * 0.25}
                  L ${size * 0.82 + depth * 0.5} ${size * 0.3 - depth * 0.25} Z`}
              fill="#a86345" stroke="#884325" strokeWidth="0.3" />
        
        {/* Columns with proper cylindrical shape */}
        {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
          <g key={`column-${i}`}>
            {/* Column shaft */}
            <rect x={size * xPos - 3} y={size * 0.35} 
                  width="6" height={size * 0.2} 
                  fill="#f8f5f0" stroke="#d8d5d0" strokeWidth="0.8" />
            {/* Fluting lines */}
            <line x1={size * xPos - 1} y1={size * 0.35} 
                  x2={size * xPos - 1} y2={size * 0.55}
                  stroke="#e8e5e0" strokeWidth="0.3" />
            <line x1={size * xPos + 1} y1={size * 0.35} 
                  x2={size * xPos + 1} y2={size * 0.55}
                  stroke="#e8e5e0" strokeWidth="0.3" />
            {/* Column capital */}
            <ellipse cx={size * xPos} cy={size * 0.35} 
                     rx="4" ry="2.5" 
                     fill="#f8f5f0" stroke="#d8d5d0" strokeWidth="0.5" />
            {/* Column base */}
            <ellipse cx={size * xPos} cy={size * 0.55} 
                     rx="4" ry="2" 
                     fill="#e8e5e0" stroke="#c8c5c0" strokeWidth="0.5" />
          </g>
        ))}
      </g>
      
      {/* Left side colonnade - angled in isometric view */}
      <g>
        <path d={`M ${size * 0.2} ${size * 0.55}
                  L ${size * 0.15} ${size * 0.5}
                  L ${size * 0.15} ${size * 0.65}
                  L ${size * 0.2} ${size * 0.7} Z`}
              fill={`url(#stoneGrad-${uniqueId})`} 
              stroke="#a8a5a0" strokeWidth="0.8" />
        
        {/* Side roof */}
        <path d={`M ${size * 0.15} ${size * 0.5}
                  L ${size * 0.2} ${size * 0.45}
                  L ${size * 0.2} ${size * 0.55} Z`}
              fill="#b87355" stroke="#985435" strokeWidth="0.3" />
      </g>
      
      {/* Central altar/monument with proper 3D */}
      <g>
        {/* Base platform */}
        <rect x={size * 0.44} y={size * 0.58} 
              width={size * 0.12} height={size * 0.08} 
              fill="#e8e5e0" stroke="#b8b5b0" strokeWidth="0.8" />
        
        {/* 3D depth for platform */}
        <path d={`M ${size * 0.56} ${size * 0.58}
                  L ${size * 0.56 + depth * 0.3} ${size * 0.58 - depth * 0.15}
                  L ${size * 0.56 + depth * 0.3} ${size * 0.66 - depth * 0.15}
                  L ${size * 0.56} ${size * 0.66} Z`}
              fill="#d8d5d0" stroke="#a8a5a0" strokeWidth="0.5" />
        
        {/* Altar top */}
        <polygon points={`${size * 0.44},${size * 0.58} 
                         ${size * 0.44 + depth * 0.3},${size * 0.58 - depth * 0.15}
                         ${size * 0.56 + depth * 0.3},${size * 0.58 - depth * 0.15}
                         ${size * 0.56},${size * 0.58}`}
                 fill="#f0ede8" stroke="#c8c5c0" strokeWidth="0.5" />
        
        {/* Sacred flame or offering bowl */}
        <ellipse cx={size * 0.5 + depth * 0.15} cy={size * 0.58 - depth * 0.075} 
                 rx="3" ry="2" 
                 fill="#8a6a4a" stroke="#6a4a2a" strokeWidth="0.5" />
      </g>
      
      {/* Small statue on pedestal */}
      <g>
        <rect x={size * 0.72} y={size * 0.52} 
              width={size * 0.04} height={size * 0.06} 
              fill="#d8d5d0" stroke="#a8a5a0" strokeWidth="0.5" />
        {/* Simple figure */}
        <ellipse cx={size * 0.74} cy={size * 0.49} 
                 rx="2" ry="3" 
                 fill="#e8e5e0" stroke="#b8b5b0" strokeWidth="0.3" />
      </g>
      
      {/* Some market stalls/tents to show it's a public space */}
      <g>
        {/* Simple awning */}
        <polygon points={`${size * 0.25},${size * 0.7} ${size * 0.3},${size * 0.65} ${size * 0.35},${size * 0.7}`}
                 fill="#c89a7a" stroke="#a87a5a" strokeWidth="0.5" opacity="0.8" />
        <rect x={size * 0.26} y={size * 0.7} 
              width="2" height={size * 0.05} 
              fill="#7a5a3a" />
        <rect x={size * 0.33} y={size * 0.7} 
              width="2" height={size * 0.05} 
              fill="#7a5a3a" />
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(AgoraSymbol);