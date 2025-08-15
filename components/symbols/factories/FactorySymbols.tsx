/**
 * Factory symbol components for different historical production facilities
 * Enhanced with 2.5D isometric perspective and improved details
 */
import React from 'react';

interface FactorySymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

// Plantation (sugar, coffee, tobacco, cotton)
export const PlantationSymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.15; // 3D depth
  const uniqueId = `plantation-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0522d" />
          <stop offset="100%" stopColor="#8b4513" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5 + depth * 0.3} cy={size * 0.65} rx={size * 0.35} ry={size * 0.12} 
               fill="rgba(0,0,0,0.2)" />
      
      {/* Main house - 3D */}
      <path d={`M ${size * 0.3} ${size * 0.3} 
                L ${size * 0.7} ${size * 0.3}
                L ${size * 0.7 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.3 + depth} ${size * 0.3 - depth * 0.5}
                Z`}
            fill="#f5f5dc" stroke="#8b7355" strokeWidth="0.5" />
      <rect x={size * 0.3} y={size * 0.3} width={size * 0.4} height={size * 0.3} 
            fill="#f5f5dc" stroke="#8b7355" strokeWidth="1" />
      <path d={`M ${size * 0.7} ${size * 0.3} 
                L ${size * 0.7 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.7 + depth} ${size * 0.6 - depth * 0.5}
                L ${size * 0.7} ${size * 0.6}
                Z`}
            fill="#e6e6c7" stroke="#8b7355" strokeWidth="0.5" />
            
      {/* Roof - 3D */}
      <path d={`M ${size * 0.25} ${size * 0.3} 
                L ${size * 0.5} ${size * 0.15}
                L ${size * 0.75} ${size * 0.3}
                L ${size * 0.75 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.5 + depth} ${size * 0.15 - depth * 0.5}
                L ${size * 0.25 + depth} ${size * 0.3 - depth * 0.5}
                Z`}
            fill={`url(#roofGrad-${uniqueId})`} stroke="#654321" strokeWidth="1" />
            
      {/* Columns with shadows */}
      {[0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
        <g key={i}>
          <rect x={size * xPos} y={size * 0.35} width={size * 0.03} height={size * 0.25} 
                fill="#ffffff" stroke="#ddd" strokeWidth="0.3" />
          <ellipse cx={size * xPos + size * 0.015} cy={size * 0.35} 
                   rx={size * 0.02} ry={size * 0.01} fill="#f0f0f0" />
        </g>
      ))}
      
      {/* Fields with perspective */}
      <path d={`M ${size * 0.1} ${size * 0.65}
                L ${size * 0.45} ${size * 0.65}
                L ${size * 0.48} ${size * 0.62}
                L ${size * 0.13} ${size * 0.62}
                Z`}
            fill="#7caf3f" stroke="#5a8030" strokeWidth="0.5" />
      <path d={`M ${size * 0.55} ${size * 0.65}
                L ${size * 0.9} ${size * 0.65}
                L ${size * 0.87} ${size * 0.62}
                L ${size * 0.52} ${size * 0.62}
                Z`}
            fill="#7caf3f" stroke="#5a8030" strokeWidth="0.5" />
            
      {/* Field rows with perspective */}
      {[0.7, 0.75, 0.8, 0.85].map((yPos, i) => (
        <g key={i}>
          <line x1={size * 0.1} y1={size * yPos} x2={size * 0.45} y2={size * yPos} 
                stroke="#5a8030" strokeWidth="0.5" opacity={0.7 - i * 0.1} />
          <line x1={size * 0.55} y1={size * yPos} x2={size * 0.9} y2={size * yPos} 
                stroke="#5a8030" strokeWidth="0.5" opacity={0.7 - i * 0.1} />
        </g>
      ))}
    </g>
  );
};

// Colonial warehouse (spice, VOC, trading company)
export const WarehouseSymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.2;
  const uniqueId = `warehouse-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`wallGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d2b48c" />
          <stop offset="100%" stopColor="#c8a882" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d={`M ${size * 0.2 + depth * 0.5} ${size * 0.8 + depth * 0.2} 
                L ${size * 0.8 + depth * 0.5} ${size * 0.8 + depth * 0.2}
                L ${size * 0.85} ${size * 0.85}
                L ${size * 0.25} ${size * 0.85}
                Z`}
            fill="rgba(0,0,0,0.25)" />
      
      {/* Main building - 3D */}
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.5} 
            fill={`url(#wallGrad-${uniqueId})`} stroke="#8b6914" strokeWidth="1.5" />
      <path d={`M ${size * 0.8} ${size * 0.3}
                L ${size * 0.8 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.8 + depth} ${size * 0.8 - depth * 0.5}
                L ${size * 0.8} ${size * 0.8}
                Z`}
            fill="#c8a882" stroke="#8b6914" strokeWidth="1" />
            
      {/* Stepped gable roof (Dutch style) - 3D */}
      <path d={`M ${size * 0.2} ${size * 0.3} 
                L ${size * 0.3} ${size * 0.2} 
                L ${size * 0.4} ${size * 0.15} 
                L ${size * 0.5} ${size * 0.1} 
                L ${size * 0.6} ${size * 0.15} 
                L ${size * 0.7} ${size * 0.2} 
                L ${size * 0.8} ${size * 0.3}
                L ${size * 0.8 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.7 + depth} ${size * 0.2 - depth * 0.5}
                L ${size * 0.6 + depth} ${size * 0.15 - depth * 0.5}
                L ${size * 0.5 + depth} ${size * 0.1 - depth * 0.5}
                L ${size * 0.5} ${size * 0.1}
                Z`}
            fill="#8b4513" stroke="#654321" strokeWidth="1" />
            
      {/* Windows with depth */}
      {[0.3, 0.45, 0.6].map((xPos, i) => (
        <g key={i}>
          <rect x={size * xPos} y={size * 0.4} width={size * 0.1} height={size * 0.15} 
                fill="#87ceeb" stroke="#4682b4" strokeWidth="0.5" />
          <line x1={size * (xPos + 0.05)} y1={size * 0.4} 
                x2={size * (xPos + 0.05)} y2={size * 0.55} 
                stroke="#4682b4" strokeWidth="0.3" />
          <line x1={size * xPos} y1={size * 0.475} 
                x2={size * (xPos + 0.1)} y2={size * 0.475} 
                stroke="#4682b4" strokeWidth="0.3" />
        </g>
      ))}
      
      {/* Large doors with depth */}
      <rect x={size * 0.35} y={size * 0.6} width={size * 0.3} height={size * 0.2} 
            fill="#654321" stroke="#4a3018" strokeWidth="1" />
      <rect x={size * 0.35} y={size * 0.6} width={size * 0.3} height={size * 0.02} 
            fill="#4a3018" />
            
      {/* Barrels/crates with 3D */}
      <ellipse cx={size * 0.15} cy={size * 0.75} rx={size * 0.05} ry={size * 0.025} 
               fill="#6b5914" />
      <rect x={size * 0.1} y={size * 0.7} width={size * 0.1} height={size * 0.05} 
            fill="#8b6914" stroke="#654321" strokeWidth="0.5" />
      <path d={`M ${size * 0.82} ${size * 0.7}
                L ${size * 0.9} ${size * 0.7}
                L ${size * 0.92} ${size * 0.68}
                L ${size * 0.84} ${size * 0.68}
                Z`}
            fill="#8b6914" stroke="#654321" strokeWidth="0.5" />
    </g>
  );
};

// Manufactory (silk, porcelain, early workshops)
export const ManufactorySymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.18;
  const uniqueId = `manufactory-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`manufWall-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e4d0" />
          <stop offset="100%" stopColor="#e6d7c3" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d={`M ${size * 0.15 + depth * 0.4} ${size * 0.75 + depth * 0.3}
                L ${size * 0.85 + depth * 0.4} ${size * 0.75 + depth * 0.3}
                L ${size * 0.88} ${size * 0.78}
                L ${size * 0.18} ${size * 0.78}
                Z`}
            fill="rgba(0,0,0,0.2)" />
      
      {/* Main building with depth */}
      <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.4} 
            fill={`url(#manufWall-${uniqueId})`} stroke="#8b7355" strokeWidth="1" />
      <path d={`M ${size * 0.85} ${size * 0.35}
                L ${size * 0.85 + depth} ${size * 0.35 - depth * 0.5}
                L ${size * 0.85 + depth} ${size * 0.75 - depth * 0.5}
                L ${size * 0.85} ${size * 0.75}
                Z`}
            fill="#dcc8b4" stroke="#8b7355" strokeWidth="0.5" />
            
      {/* Roof with multiple sections - 3D */}
      {[
        {x: 0.15, peak: 0.3, width: 0.3},
        {x: 0.45, peak: 0.5, width: 0.1},
        {x: 0.55, peak: 0.7, width: 0.3}
      ].map((section, i) => (
        <g key={i}>
          <path d={`M ${size * section.x} ${size * 0.35}
                    L ${size * section.peak} ${size * 0.25}
                    L ${size * (section.x + section.width)} ${size * 0.35}
                    L ${size * (section.x + section.width) + depth * 0.8} ${size * 0.35 - depth * 0.4}
                    L ${size * section.peak + depth * 0.8} ${size * 0.25 - depth * 0.4}
                    L ${size * section.peak} ${size * 0.25}
                    Z`}
                fill="#a0522d" stroke="#654321" strokeWidth="0.5" />
        </g>
      ))}
      
      {/* Large workshop windows with depth */}
      {[0.2, 0.425, 0.65].map((xPos, i) => (
        <g key={i}>
          <rect x={size * xPos} y={size * 0.4} width={size * 0.15} height={size * 0.2} 
                fill="#b0e0e6" stroke="#4682b4" strokeWidth="0.5" />
          <rect x={size * xPos} y={size * 0.4} width={size * 0.15} height={size * 0.02} 
                fill="#4682b4" opacity="0.3" />
          <line x1={size * (xPos + 0.075)} y1={size * 0.4} 
                x2={size * (xPos + 0.075)} y2={size * 0.6} 
                stroke="#4682b4" strokeWidth="0.3" />
          <line x1={size * xPos} y1={size * 0.5} 
                x2={size * (xPos + 0.15)} y2={size * 0.5} 
                stroke="#4682b4" strokeWidth="0.3" />
        </g>
      ))}
    </g>
  );
};

// Sugar/oil refinery
export const RefinerySymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.2;
  const uniqueId = `refinery-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <radialGradient id={`tankGrad-${uniqueId}`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#8b9dc3" />
          <stop offset="100%" stopColor="#708090" />
        </radialGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.45 + depth * 0.3} cy={size * 0.82} 
               rx={size * 0.35} ry={size * 0.12} 
               fill="rgba(0,0,0,0.25)" />
      
      {/* Main building - 3D */}
      <rect x={size * 0.2} y={size * 0.4} width={size * 0.4} height={size * 0.4} 
            fill="#c0c0c0" stroke="#696969" strokeWidth="1" />
      <path d={`M ${size * 0.6} ${size * 0.4}
                L ${size * 0.6 + depth} ${size * 0.4 - depth * 0.5}
                L ${size * 0.6 + depth} ${size * 0.8 - depth * 0.5}
                L ${size * 0.6} ${size * 0.8}
                Z`}
            fill="#b0b0b0" stroke="#696969" strokeWidth="0.5" />
      <path d={`M ${size * 0.2} ${size * 0.4}
                L ${size * 0.6} ${size * 0.4}
                L ${size * 0.6 + depth} ${size * 0.4 - depth * 0.5}
                L ${size * 0.2 + depth} ${size * 0.4 - depth * 0.5}
                Z`}
            fill="#d0d0d0" stroke="#696969" strokeWidth="0.5" />
            
      {/* Storage tanks - cylindrical 3D */}
      <ellipse cx={size * 0.3} cy={size * 0.25} rx={size * 0.08} ry={size * 0.04} 
               fill="#8b9dc3" stroke="#2f4f4f" strokeWidth="0.5" />
      <rect x={size * 0.22} y={size * 0.25} width={size * 0.16} height={size * 0.1} 
            fill={`url(#tankGrad-${uniqueId})`} stroke="#2f4f4f" strokeWidth="0.5" />
      <ellipse cx={size * 0.3} cy={size * 0.35} rx={size * 0.08} ry={size * 0.04} 
               fill="#708090" stroke="#2f4f4f" strokeWidth="0.5" />
               
      {/* Tall chimney with 3D effect */}
      <rect x={size * 0.65} y={size * 0.15} width={size * 0.08} height={size * 0.65} 
            fill="#8b4513" stroke="#654321" strokeWidth="1" />
      <path d={`M ${size * 0.73} ${size * 0.15}
                L ${size * 0.73 + depth * 0.4} ${size * 0.15 - depth * 0.2}
                L ${size * 0.73 + depth * 0.4} ${size * 0.8 - depth * 0.2}
                L ${size * 0.73} ${size * 0.8}
                Z`}
            fill="#7a3f10" stroke="#654321" strokeWidth="0.5" />
            
      {/* Smoke with motion */}
      <ellipse cx={size * 0.69} cy={size * 0.1} rx={size * 0.06} ry={size * 0.04} 
               fill="#808080" opacity="0.6" />
      <ellipse cx={size * 0.72} cy={size * 0.05} rx={size * 0.05} ry={size * 0.03} 
               fill="#808080" opacity="0.4" />
      <ellipse cx={size * 0.70} cy={size * 0.02} rx={size * 0.04} ry={size * 0.025} 
               fill="#909090" opacity="0.3" />
    </g>
  );
};

// 19th century factory (textile mill, steel mill)
export const Factory19thSymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.25;
  const uniqueId = `factory19-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`brickGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b8976" />
          <stop offset="100%" stopColor="#8b7d6b" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d={`M ${size * 0.1 + depth * 0.5} ${size * 0.8 + depth * 0.3}
                L ${size * 0.85 + depth * 0.5} ${size * 0.8 + depth * 0.3}
                L ${size * 0.9} ${size * 0.85}
                L ${size * 0.15} ${size * 0.85}
                Z`}
            fill="rgba(0,0,0,0.3)" />
      
      {/* Main factory building - 3D brick */}
      <rect x={size * 0.1} y={size * 0.4} width={size * 0.5} height={size * 0.4} 
            fill={`url(#brickGrad-${uniqueId})`} stroke="#4a4a4a" strokeWidth="1.5" />
      <path d={`M ${size * 0.6} ${size * 0.4}
                L ${size * 0.6 + depth} ${size * 0.4 - depth * 0.5}
                L ${size * 0.6 + depth} ${size * 0.8 - depth * 0.5}
                L ${size * 0.6} ${size * 0.8}
                Z`}
            fill="#7b6d5b" stroke="#4a4a4a" strokeWidth="1" />
            
      {/* Sawtooth roof - 3D */}
      {[0.1, 0.2, 0.3, 0.4, 0.5].map((xPos, i) => (
        <g key={i}>
          <path d={`M ${size * xPos} ${size * 0.4} 
                    L ${size * (xPos + 0.05)} ${size * 0.3} 
                    L ${size * (xPos + 0.1)} ${size * 0.4}
                    L ${size * (xPos + 0.1) + depth * 0.8} ${size * 0.4 - depth * 0.4}
                    L ${size * (xPos + 0.05) + depth * 0.8} ${size * 0.3 - depth * 0.4}
                    L ${size * (xPos + 0.05)} ${size * 0.3}
                    Z`}
                fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
          {/* Skylight */}
          <path d={`M ${size * (xPos + 0.05)} ${size * 0.3}
                    L ${size * (xPos + 0.08)} ${size * 0.35}
                    L ${size * (xPos + 0.08) + depth * 0.6} ${size * 0.35 - depth * 0.3}
                    L ${size * (xPos + 0.05) + depth * 0.6} ${size * 0.3 - depth * 0.3}
                    Z`}
                fill="#87ceeb" opacity="0.7" />
        </g>
      ))}
      
      {/* Windows with industrial grid */}
      {[0.15, 0.25, 0.35, 0.45, 0.55].map((xPos, i) => (
        <g key={i}>
          <rect x={size * xPos} y={size * 0.45} width={size * 0.04} height={size * 0.06} 
                fill="#87ceeb" stroke="#4682b4" strokeWidth="0.3" />
          <rect x={size * xPos} y={size * 0.55} width={size * 0.04} height={size * 0.06} 
                fill="#87ceeb" stroke="#4682b4" strokeWidth="0.3" />
          <rect x={size * xPos} y={size * 0.65} width={size * 0.04} height={size * 0.06} 
                fill="#87ceeb" stroke="#4682b4" strokeWidth="0.3" />
        </g>
      ))}
      
      {/* Tall chimney stack - 3D */}
      <rect x={size * 0.65} y={size * 0.1} width={size * 0.1} height={size * 0.7} 
            fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="1" />
      <path d={`M ${size * 0.75} ${size * 0.1}
                L ${size * 0.75 + depth * 0.5} ${size * 0.1 - depth * 0.25}
                L ${size * 0.75 + depth * 0.5} ${size * 0.8 - depth * 0.25}
                L ${size * 0.75} ${size * 0.8}
                Z`}
            fill="#3a3a3a" stroke="#2a2a2a" strokeWidth="0.5" />
            
      {/* Animated industrial smoke */}
      <g opacity="0.7">
        {[0, 1, 2].map((i) => (
          <circle key={i} 
                  cx={size * 0.7} 
                  cy={size * 0.08}
                  r={size * 0.04}
                  fill="#3a3a3a">
            <animate attributeName="cy" 
                     values={`${size * 0.08};${size * -0.02};${size * -0.15}`}
                     dur={`${4 + i * 0.8}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
            <animate attributeName="r" 
                     values={`${size * 0.04};${size * 0.08};${size * 0.12}`}
                     dur={`${4 + i * 0.8}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.7;0.4;0"
                     dur={`${4 + i * 0.8}s`}
                     begin={`${i * 0.5}s`}
                     repeatCount="indefinite" />
          </circle>
        ))}
      </g>
               
      {/* Second smaller chimney */}
      <rect x={size * 0.78} y={size * 0.25} width={size * 0.06} height={size * 0.55} 
            fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
    </g>
  );
};

// 20th century factory (automobile, electronics)
export const Factory20thSymbol: React.FC<FactorySymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.2;
  const uniqueId = `factory20-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`modernWall-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#d3d3d3" />
        </linearGradient>
        <linearGradient id={`glassGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cde8f0" />
          <stop offset="50%" stopColor="#add8e6" />
          <stop offset="100%" stopColor="#9dc8d6" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d={`M ${size * 0.1 + depth * 0.4} ${size * 0.8 + depth * 0.25}
                L ${size * 0.8 + depth * 0.4} ${size * 0.8 + depth * 0.25}
                L ${size * 0.85} ${size * 0.85}
                L ${size * 0.15} ${size * 0.85}
                Z`}
            fill="rgba(0,0,0,0.2)" />
      
      {/* Modern factory building - 3D */}
      <rect x={size * 0.1} y={size * 0.35} width={size * 0.7} height={size * 0.45} 
            fill={`url(#modernWall-${uniqueId})`} stroke="#808080" strokeWidth="1.5" />
      <path d={`M ${size * 0.8} ${size * 0.35}
                L ${size * 0.8 + depth} ${size * 0.35 - depth * 0.5}
                L ${size * 0.8 + depth} ${size * 0.8 - depth * 0.5}
                L ${size * 0.8} ${size * 0.8}
                Z`}
            fill="#c3c3c3" stroke="#808080" strokeWidth="1" />
            
      {/* Flat roof with equipment - 3D */}
      <path d={`M ${size * 0.1} ${size * 0.35}
                L ${size * 0.8} ${size * 0.35}
                L ${size * 0.8 + depth} ${size * 0.35 - depth * 0.5}
                L ${size * 0.1 + depth} ${size * 0.35 - depth * 0.5}
                Z`}
            fill="#696969" stroke="#505050" strokeWidth="0.5" />
            
      {/* Roof equipment */}
      <rect x={size * 0.3 + depth * 0.5} y={size * 0.32 - depth * 0.25} 
            width={size * 0.05} height={size * 0.03} 
            fill="#505050" />
      <rect x={size * 0.5 + depth * 0.5} y={size * 0.31 - depth * 0.25} 
            width={size * 0.08} height={size * 0.04} 
            fill="#606060" />
            
      {/* Large modern windows with reflections */}
      <rect x={size * 0.15} y={size * 0.42} width={size * 0.6} height={size * 0.15} 
            fill={`url(#glassGrad-${uniqueId})`} stroke="#4682b4" strokeWidth="0.5" />
      <rect x={size * 0.15} y={size * 0.42} width={size * 0.6} height={size * 0.02} 
            fill="#ffffff" opacity="0.3" />
            
      {/* Window grid - modern style */}
      {[0.25, 0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
        <line key={i} x1={size * xPos} y1={size * 0.42} x2={size * xPos} y2={size * 0.57} 
              stroke="#4682b4" strokeWidth="0.3" />
      ))}
      <line x1={size * 0.15} y1={size * 0.495} x2={size * 0.75} y2={size * 0.495} 
            stroke="#4682b4" strokeWidth="0.3" />
            
      {/* Loading dock - 3D */}
      <rect x={size * 0.2} y={size * 0.65} width={size * 0.5} height={size * 0.15} 
            fill="#a9a9a9" stroke="#696969" strokeWidth="0.5" />
      <path d={`M ${size * 0.7} ${size * 0.65}
                L ${size * 0.7 + depth * 0.7} ${size * 0.65 - depth * 0.35}
                L ${size * 0.7 + depth * 0.7} ${size * 0.8 - depth * 0.35}
                L ${size * 0.7} ${size * 0.8}
                Z`}
            fill="#999999" stroke="#696969" strokeWidth="0.5" />
            
      {/* Parking lot with perspective */}
      <path d={`M ${size * 0.05} ${size * 0.85}
                L ${size * 0.85} ${size * 0.85}
                L ${size * 0.8} ${size * 0.82}
                L ${size * 0.1} ${size * 0.82}
                Z`}
            fill="#666666" opacity="0.5" />
      {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((xPos, i) => (
        <line key={i} x1={size * xPos} y1={size * 0.85} x2={size * (xPos - 0.02)} y2={size * 0.82} 
              stroke="#ffff00" strokeWidth="0.5" opacity="0.6" />
      ))}
      
      {/* Small modern vent */}
      <rect x={size * 0.82} y={size * 0.25} width={size * 0.05} height={size * 0.15} 
            fill="#808080" stroke="#4a4a4a" strokeWidth="0.5" />
      <ellipse cx={size * 0.845} cy={size * 0.25} rx={size * 0.025} ry={size * 0.015} 
               fill="#606060" />
    </g>
  );
};

// Export a function to get the right symbol based on type
export const getFactorySymbol = (symbolType: string) => {
  switch (symbolType) {
    case 'plantation':
      return PlantationSymbol;
    case 'warehouse':
      return WarehouseSymbol;
    case 'manufactory':
      return ManufactorySymbol;
    case 'refinery':
      return RefinerySymbol;
    case 'factory19th':
      return Factory19thSymbol;
    case 'factory20th':
      return Factory20thSymbol;
    default:
      return Factory19thSymbol; // Default fallback
  }
};