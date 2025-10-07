/**
 * Improved Holy Site symbols with consistent 2.5D perspective and shadows
 */
import React from 'react';

interface HolySiteSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

// Import for missing dependency
import { ValueNoise } from '../../../utils/noise';

// Shared shadow component - enhanced for bigger symbols
const HolySiteShadow: React.FC<{cx: number, cy: number, size: number}> = ({cx, cy, size}) => (
  <ellipse 
    cx={cx} 
    cy={cy} 
    rx={size * 0.45} 
    ry={size * 0.18} 
    fill="rgba(0,0,0,0.25)"
    filter="blur(3px)"
  />
);

// Ziggurat with incense smoke and palm trees
export const ZigguratSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `ziggurat-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3; // 30% bigger
  const treeCount = seed % 3; // 0, 1, or 2 trees
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`zigStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4b896" />
          <stop offset="100%" stopColor="#b89968" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={scaledSize * 0.5} cy={scaledSize * 0.8} size={scaledSize} />
      
      {/* Palm trees for scale */}
      {treeCount > 0 && (
        <g opacity="0.8">
          <rect x={scaledSize * 0.08} y={scaledSize * 0.65} 
                width={scaledSize * 0.015} height={size * 0.2} 
                fill="#7a5a3a" />
          <g transform={`translate(${scaledSize * 0.088}, ${scaledSize * 0.63})`}>
            {[0, 60, 120, 240, 300].map((angle, i) => (
              <path key={i}
                    d={`M 0,0 Q ${Math.cos(angle * Math.PI / 180) * scaledSize * 0.06},${-size * 0.015} 
                        ${Math.cos(angle * Math.PI / 180) * scaledSize * 0.08},${Math.sin(angle * Math.PI / 180) * scaledSize * 0.06}`}
                    fill="#4a6a4a" stroke="#3a5a3a" strokeWidth="0.2" />
            ))}
          </g>
        </g>
      )}
      
      {treeCount > 1 && (
        <g opacity="0.8">
          <rect x={size * 0.88} y={size * 0.68} 
                width={scaledSize * 0.012} height={size * 0.15} 
                fill="#7a5a3a" />
          <g transform={`translate(${scaledSize * 0.886}, ${scaledSize * 0.66})`}>
            {[30, 90, 150, 210, 270].map((angle, i) => (
              <path key={i}
                    d={`M 0,0 Q ${Math.cos(angle * Math.PI / 180) * scaledSize * 0.05},${-size * 0.012} 
                        ${Math.cos(angle * Math.PI / 180) * scaledSize * 0.07},${Math.sin(angle * Math.PI / 180) * scaledSize * 0.05}`}
                    fill="#4a6a4a" stroke="#3a5a3a" strokeWidth="0.2" />
            ))}
          </g>
        </g>
      )}
      
      {/* Ziggurat tiers - proper 2.5D */}
      {[0, 1, 2, 3].map((tier) => {
        const tierSize = 1 - tier * 0.15;
        const tierY = 0.7 - tier * 0.1;
        const s = scaledSize; // shorter var for readability
        return (
          <g key={tier}>
            {/* Front face */}
            <rect x={s * (0.5 - 0.3 * tierSize)} 
                  y={s * tierY} 
                  width={scaledSize * 0.6 * tierSize} 
                  height={scaledSize * 0.1} 
                  fill={`url(#zigStone-${uniqueId})`} />
            
            {/* Top face */}
            <polygon points={`${s * (0.5 - 0.3 * tierSize)},${s * tierY} 
                              ${s * (0.5 - 0.25 * tierSize)},${s * (tierY - 0.03)} 
                              ${s * (0.5 + 0.35 * tierSize)},${s * (tierY - 0.03)} 
                              ${s * (0.5 + 0.3 * tierSize)},${s * tierY}`}
                     fill="#e4c8a6" />
            
            {/* Right face */}
            <polygon points={`${s * (0.5 + 0.3 * tierSize)},${s * tierY} 
                              ${s * (0.5 + 0.35 * tierSize)},${s * (tierY - 0.03)} 
                              ${s * (0.5 + 0.35 * tierSize)},${s * (tierY + 0.07)} 
                              ${s * (0.5 + 0.3 * tierSize)},${s * (tierY + 0.1)}`}
                     fill="#c8a886" />
          </g>
        );
      })}
      
      {/* Temple at top */}
      <rect x={scaledSize * 0.47} y={scaledSize * 0.28} 
            width={scaledSize * 0.06} height={scaledSize * 0.08} 
            fill="#e8d4b0" stroke="#b89968" strokeWidth="0.5" />
      
      {/* Stairs */}
      <rect x={scaledSize * 0.48} y={scaledSize * 0.36} 
            width={scaledSize * 0.04} height={scaledSize * 0.44} 
            fill="#c8a886" opacity="0.7" />
      
      {/* Incense smoke */}
      <g opacity="0.5">
        {[0, 1].map((i) => (
          <circle key={i} 
                  cx={scaledSize * 0.5} 
                  cy={scaledSize * 0.25}
                  r={scaledSize * 0.02}
                  fill="#888888">
            <animate attributeName="cy" 
                     values={`${scaledSize * 0.25};${scaledSize * 0.15};${scaledSize * 0.05}`}
                     dur={`${4 + i}s`}
                     begin={`${i * 0.8}s`}
                     repeatCount="indefinite" />
            <animate attributeName="r" 
                     values={`${scaledSize * 0.02};${scaledSize * 0.03};${scaledSize * 0.04}`}
                     dur={`${4 + i}s`}
                     begin={`${i * 0.8}s`}
                     repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.5;0.3;0"
                     dur={`${4 + i}s`}
                     begin={`${i * 0.8}s`}
                     repeatCount="indefinite" />
          </circle>
        ))}
      </g>
    </g>
  );
};

// Pyramid with proper 2.5D perspective
export const PyramidSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `pyramid-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`pyrStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d4b0" />
          <stop offset="100%" stopColor="#c8a886" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.55} cy={size * 0.75} size={size} />
      
      {/* Pyramid - proper 2.5D */}
      <g>
        {/* Front face */}
        <polygon points={`${size * 0.2},${size * 0.7} ${size * 0.5},${size * 0.3} ${size * 0.8},${size * 0.7}`}
                 fill={`url(#pyrStone-${uniqueId})`} />
        
        {/* Right face (lighter) */}
        <polygon points={`${size * 0.8},${size * 0.7} ${size * 0.5},${size * 0.3} ${size * 0.75},${size * 0.25}`}
                 fill="#d8c4a0" />
        
        {/* Entrance */}
        <rect x={size * 0.48} y={size * 0.6} 
              width={size * 0.04} height={size * 0.1} 
              fill="#1a1a1a" />
      </g>
      
      {/* Small palm tree */}
      {seed % 2 === 0 && (
        <g opacity="0.7" transform={`translate(${size * 0.15}, ${size * 0.7})`}>
          <rect x={0} y={0} width={size * 0.01} height={size * 0.1} fill="#6a4a3a" />
          <circle cx={size * 0.005} cy={-size * 0.02} r={size * 0.04} fill="#4a6a4a" />
        </g>
      )}
    </g>
  );
};

// Mesoamerican Pyramid with proper perspective
export const MesoamericanPyramidSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `mesopyramid-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`mesoStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0a080" />
          <stop offset="100%" stopColor="#907050" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.52} cy={size * 0.78} size={size} />
      
      {/* Stepped pyramid - 2.5D */}
      {[0, 1, 2, 3, 4].map((step) => {
        const stepSize = 1 - step * 0.12;
        const stepY = 0.7 - step * 0.08;
        return (
          <g key={step}>
            {/* Front face */}
            <rect x={size * (0.5 - 0.25 * stepSize)} 
                  y={size * stepY} 
                  width={scaledSize * 0.5 * stepSize} 
                  height={scaledSize * 0.08} 
                  fill={`url(#mesoStone-${uniqueId})`} />
            
            {/* Top */}
            <polygon points={`${size * (0.5 - 0.25 * stepSize)},${size * stepY} 
                              ${size * (0.5 - 0.22 * stepSize)},${size * (stepY - 0.02)} 
                              ${size * (0.5 + 0.28 * stepSize)},${size * (stepY - 0.02)} 
                              ${size * (0.5 + 0.25 * stepSize)},${size * stepY}`}
                     fill="#d0b090" />
            
            {/* Right */}
            <polygon points={`${size * (0.5 + 0.25 * stepSize)},${size * stepY} 
                              ${size * (0.5 + 0.28 * stepSize)},${size * (stepY - 0.02)} 
                              ${size * (0.5 + 0.28 * stepSize)},${size * (stepY + 0.06)} 
                              ${size * (0.5 + 0.25 * stepSize)},${size * (stepY + 0.08)}`}
                     fill="#a08060" />
          </g>
        );
      })}
      
      {/* Temple at top */}
      <rect x={size * 0.46} y={size * 0.25} 
            width={size * 0.08} height={size * 0.06} 
            fill="#b09070" />
      
      {/* Central stairway */}
      <polygon points={`${size * 0.47},${size * 0.7} ${size * 0.49},${size * 0.3} ${size * 0.51},${size * 0.3} ${size * 0.53},${size * 0.7}`}
               fill="#a08060" opacity="0.8" />
      
      {/* Decorative elements */}
      <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.015} 
              fill="#cc6633" opacity="0.8" />
    </g>
  );
};

// Catholic Church - smaller, simpler than cathedral
export const CatholicChurchSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `catholic-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`catholicStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8c8b8" />
          <stop offset="100%" stopColor="#b8a898" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size * 0.8} />
      
      {/* Main church body - simpler than cathedral */}
      <g>
        {/* Base */}
        <rect x={size * 0.38} y={size * 0.45} 
              width={size * 0.24} height={size * 0.3} 
              fill={`url(#catholicStone-${uniqueId})`} />
        
        {/* Roof */}
        <polygon points={`${size * 0.38},${size * 0.45} ${size * 0.5},${size * 0.35} ${size * 0.62},${size * 0.45}`}
                 fill="#a08070" />
        
        {/* Bell tower */}
        <rect x={size * 0.47} y={size * 0.25} 
              width={size * 0.06} height={size * 0.2} 
              fill="#c8b8a8" />
        
        {/* Cross on top */}
        <line x1={size * 0.5} y1={size * 0.22} x2={size * 0.5} y2={size * 0.28} 
              stroke="#7a5a3a" strokeWidth="1" />
        <line x1={size * 0.48} y1={size * 0.24} x2={size * 0.52} y2={size * 0.24} 
              stroke="#7a5a3a" strokeWidth="1" />
        
        {/* Arched door */}
        <path d={`M ${size * 0.48} ${size * 0.75} 
                  L ${size * 0.48} ${size * 0.65}
                  A ${size * 0.02} ${size * 0.02} 0 0 1 ${size * 0.52} ${size * 0.65}
                  L ${size * 0.52} ${size * 0.75} Z`}
              fill="#4a3a2a" />
        
        {/* Round window */}
        <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.025} 
                fill="none" stroke="#5a4a3a" strokeWidth="0.5" />
        <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.02} 
                fill="#6a5a4a" opacity="0.5" />
      </g>
    </g>
  );
};

// Protestant Church - simpler, less ornate
export const ProtestantChurchSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `protestant-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`protStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e0d0" />
          <stop offset="100%" stopColor="#d0c0b0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size * 0.75} />
      
      {/* Simple church building */}
      <g>
        {/* Main building */}
        <rect x={size * 0.4} y={size * 0.5} 
              width={size * 0.2} height={size * 0.25} 
              fill={`url(#protStone-${uniqueId})`} />
        
        {/* Simple peaked roof */}
        <polygon points={`${size * 0.4},${size * 0.5} ${size * 0.5},${size * 0.4} ${size * 0.6},${size * 0.5}`}
                 fill="#8a7a6a" />
        
        {/* Steeple - tall and simple */}
        <rect x={size * 0.48} y={size * 0.3} 
              width={size * 0.04} height={size * 0.2} 
              fill="#e0d0c0" />
        
        {/* Pointed top */}
        <polygon points={`${size * 0.48},${size * 0.3} ${size * 0.5},${size * 0.25} ${size * 0.52},${size * 0.3}`}
                 fill="#9a8a7a" />
        
        {/* Simple cross */}
        <line x1={size * 0.5} y1={size * 0.23} x2={size * 0.5} y2={size * 0.27} 
              stroke="#5a4a3a" strokeWidth="0.8" />
        <line x1={size * 0.49} y1={size * 0.24} x2={size * 0.51} y2={size * 0.24} 
              stroke="#5a4a3a" strokeWidth="0.8" />
        
        {/* Simple rectangular door */}
        <rect x={size * 0.48} y={size * 0.65} 
              width={size * 0.04} height={size * 0.1} 
              fill="#3a2a1a" />
        
        {/* Plain windows */}
        <rect x={size * 0.44} y={size * 0.55} 
              width={size * 0.02} height={size * 0.04} 
              fill="#5a4a3a" opacity="0.7" />
        <rect x={size * 0.54} y={size * 0.55} 
              width={size * 0.02} height={size * 0.04} 
              fill="#5a4a3a" opacity="0.7" />
      </g>
    </g>
  );
};

// Cathedral with proper 2.5D - for large cities only
export const CathedralSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `cathedral-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`cathStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0d0c0" />
          <stop offset="100%" stopColor="#c0b0a0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main cathedral body - 2.5D */}
      <g>
        {/* Nave */}
        <rect x={size * 0.35} y={size * 0.4} 
              width={size * 0.3} height={size * 0.35} 
              fill={`url(#cathStone-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.35},${size * 0.4} ${size * 0.42},${size * 0.35} ${size * 0.72},${size * 0.35} ${size * 0.65},${size * 0.4}`}
                 fill="#e8d8c8" />
        
        {/* Right face */}
        <polygon points={`${size * 0.65},${size * 0.4} ${size * 0.72},${size * 0.35} ${size * 0.72},${size * 0.7} ${size * 0.65},${size * 0.75}`}
                 fill="#d0c0b0" />
        
        {/* Tower */}
        <rect x={size * 0.45} y={size * 0.15} 
              width={size * 0.1} height={size * 0.35} 
              fill="#d8c8b8" />
        
        {/* Spire */}
        <polygon points={`${size * 0.45},${size * 0.15} ${size * 0.5},${size * 0.05} ${size * 0.55},${size * 0.15}`}
                 fill="#b0a090" />
        
        {/* Cross */}
        <line x1={size * 0.5} y1={size * 0.02} x2={size * 0.5} y2={size * 0.08} 
              stroke="#8a6a4a" strokeWidth="0.8" />
        <line x1={size * 0.48} y1={size * 0.04} x2={size * 0.52} y2={size * 0.04} 
              stroke="#8a6a4a" strokeWidth="0.8" />
        
        {/* Gothic windows */}
        {[0.42, 0.5, 0.58].map((xPos, i) => (
          <path key={i}
                d={`M ${size * xPos} ${size * 0.55} 
                    L ${size * xPos} ${size * 0.48} 
                    Q ${size * (xPos + 0.02)} ${size * 0.45} ${size * (xPos + 0.04)} ${size * 0.48}
                    L ${size * (xPos + 0.04)} ${size * 0.55}
                    Z`}
                fill="#4a7a9a" opacity="0.7" />
        ))}
        
        {/* Main door */}
        <path d={`M ${size * 0.48} ${size * 0.75} 
                  L ${size * 0.48} ${size * 0.65} 
                  Q ${size * 0.5} ${size * 0.62} ${size * 0.52} ${size * 0.65}
                  L ${size * 0.52} ${size * 0.75}
                  Z`}
              fill="#3a2a1a" />
      </g>
    </g>
  );
};

// Generic Mosque with minaret and dome
export const GenericMosqueSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `mosque-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`mosqueWall-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0e0d0" />
          <stop offset="100%" stopColor="#e0d0c0" />
        </linearGradient>
        <radialGradient id={`dome-${uniqueId}`}>
          <stop offset="0%" stopColor="#5599dd" />
          <stop offset="100%" stopColor="#3377bb" />
        </radialGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Main mosque structure */}
      <g>
        {/* Main building */}
        <rect x={size * 0.3} y={size * 0.45} 
              width={size * 0.4} height={size * 0.3} 
              fill={`url(#mosqueWall-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.3},${size * 0.45} ${size * 0.38},${size * 0.4} ${size * 0.78},${size * 0.4} ${size * 0.7},${size * 0.45}`}
                 fill="#f8e8d8" />
        
        {/* Right face */}
        <polygon points={`${size * 0.7},${size * 0.45} ${size * 0.78},${size * 0.4} ${size * 0.78},${size * 0.7} ${size * 0.7},${size * 0.75}`}
                 fill="#e8d8c8" />
        
        {/* Central dome */}
        <ellipse cx={size * 0.5} cy={size * 0.42} 
                 rx={size * 0.15} ry={size * 0.12} 
                 fill={`url(#dome-${uniqueId})`} />
        
        {/* Dome top */}
        <ellipse cx={size * 0.5} cy={size * 0.39} 
                 rx={size * 0.12} ry={size * 0.08} 
                 fill="#66aaee" />
        
        {/* Minaret */}
        <rect x={size * 0.75} y={size * 0.2} 
              width={size * 0.05} height={size * 0.35} 
              fill="#e8d8c8" />
        
        {/* Minaret top */}
        <polygon points={`${size * 0.75},${size * 0.2} ${size * 0.775},${size * 0.15} ${size * 0.8},${size * 0.2}`}
                 fill="#4488cc" />
        
        {/* Crescent */}
        <g transform={`translate(${size * 0.775}, ${scaledSize * 0.13})`}>
          <path d={`M 0,${-size * 0.015} 
                    A ${size * 0.015} ${size * 0.015} 0 1 1 0,${size * 0.015}
                    A ${size * 0.01} ${size * 0.01} 0 1 0 0,${-size * 0.015}`}
                fill="#ffcc00" />
        </g>
        
        {/* Arched entrance */}
        <path d={`M ${size * 0.47} ${size * 0.75}
                  L ${size * 0.47} ${size * 0.62}
                  Q ${size * 0.5} ${size * 0.58}, ${scaledSize * 0.53} ${size * 0.62}
                  L ${size * 0.53} ${size * 0.75}
                  Z`}
              fill="#2a1a0a" />
      </g>
    </g>
  );
};

// Buddhist Temple with pagoda style
export const BuddhistTempleSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `buddhist-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`templeRed-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc4444" />
          <stop offset="100%" stopColor="#aa3333" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.78} size={size} />
      
      {/* Multi-tiered pagoda */}
      {[0, 1, 2, 3, 4].map((tier) => {
        const tierSize = 1 - tier * 0.12;
        const tierY = 0.65 - tier * 0.1;
        return (
          <g key={tier}>
            {/* Building tier */}
            <rect x={size * (0.5 - 0.12 * tierSize)} 
                  y={size * tierY} 
                  width={scaledSize * 0.24 * tierSize} 
                  height={scaledSize * 0.06} 
                  fill="#f0e0d0" />
            
            {/* Curved roof */}
            <path d={`M ${size * (0.5 - 0.15 * tierSize)} ${size * tierY}
                      Q ${size * 0.5} ${size * (tierY - 0.04)}
                      ${size * (0.5 + 0.15 * tierSize)} ${size * tierY}`}
                  fill={`url(#templeRed-${uniqueId})`} />
          </g>
        );
      })}
      
      {/* Top ornament */}
      <circle cx={size * 0.5} cy={size * 0.22} r={size * 0.02} fill="#ffcc00" />
      
      {/* Entrance */}
      <rect x={size * 0.47} y={size * 0.65} 
            width={size * 0.06} height={size * 0.1} 
            fill="#2a1a0a" />
      
      {/* Incense burner */}
      <rect x={size * 0.48} y={size * 0.78} 
            width={size * 0.04} height={size * 0.03} 
            fill="#8a6a4a" />
      
      {/* Incense smoke */}
      <g opacity="0.4">
        <circle cx={size * 0.5} cy={size * 0.76} r={size * 0.015} fill="#888888">
          <animate attributeName="cy" 
                   values={`${size * 0.76};${size * 0.7};${size * 0.64}`}
                   dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" 
                   values="0.4;0.2;0"
                   dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
};

// Hindu Temple with proper 2.5D
export const HinduTempleSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `hindu-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`hinduStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d0b0" />
          <stop offset="100%" stopColor="#d0b090" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Temple structure */}
      <g>
        {/* Base platform */}
        <rect x={size * 0.55} y={size * 0.85} 
              width={size * 0.5} height={size * 0.1} 
              fill="#c0a080" />
        
        {/* Main shrine */}
        <rect x={size * 0.55} y={size * 0.65} 
              width={size * 0.3} height={size * 0.25} 
              fill={`url(#hinduStone-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.35},${size * 0.45} ${size * 0.42},${size * 0.4} ${size * 0.72},${size * 0.4} ${size * 0.65},${size * 0.45}`}
                 fill="#f8d8b8" />
        
        {/* Right face */}
        <polygon points={`${size * 0.65},${size * 0.45} ${size * 0.72},${size * 0.4} ${size * 0.72},${size * 0.65} ${size * 0.65},${size * 0.7}`}
                 fill="#e0c0a0" />
        
        {/* Shikhara (tower) */}
        <polygon points={`${size * 0.4},${size * 0.45} ${size * 0.5},${size * 0.2} ${size * 0.6},${size * 0.45}`}
                 fill="#d0a080" />
        
        {/* Decorative bands */}
        {[0.35, 0.3, 0.25].map((yPos, i) => (
          <rect key={i} 
                x={size * 0.45} y={size * yPos} 
                width={scaledSize * 0.1} height={size * 0.02} 
                fill="#cc6633" />
        ))}
        
        {/* Om symbol */}
        <text x={size * 0.5} y={size * 0.55} 
              fontSize={size * 0.08} fill="#cc6633" textAnchor="middle">
          ॐ
        </text>
        
        {/* Entrance */}
        <rect x={size * 0.47} y={size * 0.6} 
              width={size * 0.06} height={size * 0.1} 
              fill="#2a1a0a" />
      </g>
    </g>
  );
};

// Shinto Shrine with torii gate
export const ShintoShrineSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `shinto-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`shrineRed-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ee4444" />
          <stop offset="100%" stopColor="#cc3333" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Torii gate */}
      <g>
        {/* Vertical posts */}
        <rect x={size * 0.35} y={size * 0.45} 
              width={size * 0.05} height={size * 0.5} 
              fill={`url(#shrineRed-${uniqueId})`} />
        <rect x={size * 0.81} y={size * 0.35} 
              width={size * 0.04} height={size * 0.4} 
              fill={`url(#shrineRed-${uniqueId})`} />
        
        {/* Top beam (kasagi) */}
        <rect x={size * 0.15} y={size * 0.32} 
              width={size * 0.7} height={size * 0.04} 
              fill={`url(#shrineRed-${uniqueId})`} />
        
        {/* Second beam (nuki) */}
        <rect x={size * 0.2} y={size * 0.42} 
              width={size * 0.6} height={size * 0.03} 
              fill="#cc3333" />
      </g>
      
      {/* Shrine building behind */}
      <g opacity="0.9">
        {/* Main building */}
        <rect x={size * 0.4} y={size * 0.5} 
              width={size * 0.2} height={size * 0.15} 
              fill="#f0e0d0" />
        
        {/* Roof */}
        <polygon points={`${size * 0.35},${size * 0.5} ${size * 0.5},${size * 0.42} ${size * 0.65},${size * 0.5}`}
                 fill="#8a6a4a" />
        
        {/* Door */}
        <rect x={size * 0.48} y={size * 0.58} 
              width={size * 0.04} height={size * 0.07} 
              fill="#3a2a1a" />
      </g>
    </g>
  );
};

// Synagogue with Star of David
export const SynagogueSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `synagogue-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`synStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d8c8" />
          <stop offset="100%" stopColor="#d0c0b0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Main synagogue structure */}
      <g>
        {/* Main building */}
        <rect x={size * 0.3} y={size * 0.4} 
              width={size * 0.4} height={size * 0.35} 
              fill={`url(#synStone-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.3},${size * 0.4} ${size * 0.38},${size * 0.35} ${size * 0.78},${size * 0.35} ${size * 0.7},${size * 0.4}`}
                 fill="#f0e0d0" />
        
        {/* Right face */}
        <polygon points={`${size * 0.7},${size * 0.4} ${size * 0.78},${size * 0.35} ${size * 0.78},${size * 0.7} ${size * 0.7},${size * 0.75}`}
                 fill="#d8c8b8" />
        
        {/* Dome */}
        <ellipse cx={size * 0.5} cy={size * 0.38} 
                 rx={size * 0.12} ry={size * 0.08} 
                 fill="#c0b0a0" />
        
        {/* Star of David */}
        <g transform={`translate(${size * 0.5}, ${scaledSize * 0.28})`}>
          <polygon points={`0,${-size * 0.04} ${size * 0.035},${size * 0.02} ${-size * 0.035},${size * 0.02}`}
                   fill="none" stroke="#4444cc" strokeWidth="1" />
          <polygon points={`0,${size * 0.04} ${size * 0.035},${-size * 0.02} ${-size * 0.035},${-size * 0.02}`}
                   fill="none" stroke="#4444cc" strokeWidth="1" />
        </g>
        
        {/* Windows */}
        {[0.4, 0.5, 0.6].map((xPos, i) => (
          <path key={i}
                d={`M ${size * xPos} ${size * 0.55} 
                    L ${size * xPos} ${size * 0.48} 
                    Q ${size * (xPos + 0.025)} ${size * 0.45} ${size * (xPos + 0.05)} ${size * 0.48}
                    L ${size * (xPos + 0.05)} ${size * 0.55}
                    Z`}
                fill="#4a7a9a" opacity="0.7" />
        ))}
        
        {/* Entrance */}
        <rect x={size * 0.47} y={size * 0.65} 
              width={size * 0.06} height={size * 0.1} 
              fill="#3a2a1a" />
      </g>
    </g>
  );
};

// Sacred Grove for pagan/nature religions
export const SacredGroveSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `grove-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size * 0.8} />
      
      {/* Stone circle base */}
      <ellipse cx={size * 0.5} cy={size * 0.7} 
               rx={size * 0.35} ry={size * 0.15} 
               fill="#8B7355" opacity="0.5" />
      
      {/* Standing stones in circle */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const stoneX = size * 0.5 + Math.cos(rad) * scaledSize * 0.25;
        const stoneY = size * 0.65 + Math.sin(rad) * scaledSize * 0.1;
        return (
          <g key={i}>
            <rect x={stoneX - size * 0.02} y={stoneY - size * 0.08} 
                  width={scaledSize * 0.04} height={size * 0.1} 
                  fill="#9B8B7A" stroke="#6B5D54" strokeWidth="0.5" />
            <ellipse cx={stoneX} cy={stoneY - size * 0.08} 
                     rx={size * 0.025} ry={size * 0.015} 
                     fill="#A89988" />
          </g>
        );
      })}
      
      {/* Sacred trees */}
      {[0.3, 0.7].map((xPos, i) => (
        <g key={`tree-${i}`}>
          {/* Tree trunk */}
          <rect x={size * xPos - size * 0.015} y={size * 0.45} 
                width={scaledSize * 0.03} height={size * 0.15} 
                fill="#6B4423" />
          {/* Tree foliage */}
          <ellipse cx={size * xPos} cy={size * 0.4} 
                   rx={size * 0.08} ry={size * 0.12} 
                   fill="#2D5A1E" opacity="0.9" />
          <ellipse cx={size * xPos} cy={size * 0.35} 
                   rx={size * 0.06} ry={size * 0.08} 
                   fill="#3A6B2A" opacity="0.8" />
        </g>
      ))}
      
      {/* Central altar stone */}
      <rect x={size * 0.45} y={size * 0.63} 
            width={size * 0.1} height={size * 0.05} 
            fill="#8B7355" stroke="#5B4D44" strokeWidth="1" />
      <rect x={size * 0.45} y={size * 0.61} 
            width={size * 0.1} height={size * 0.02} 
            fill="#9B8365" />
    </g>
  );
};

// Generic Shrine for edge cases
export const GenericShrineSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `shrine-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`shrineGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0c0b0" />
          <stop offset="100%" stopColor="#b0a090" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Simple shrine structure */}
      <g>
        {/* Base */}
        <rect x={size * 0.35} y={size * 0.55} 
              width={size * 0.3} height={size * 0.2} 
              fill={`url(#shrineGrad-${uniqueId})`} />
        
        {/* Roof */}
        <polygon points={`${size * 0.3},${size * 0.55} ${size * 0.5},${size * 0.4} ${size * 0.7},${size * 0.55}`}
                 fill="#907060" />
        
        {/* Sacred object/altar */}
        <rect x={size * 0.47} y={size * 0.62} 
              width={size * 0.06} height={size * 0.08} 
              fill="#cc9966" />
        
        {/* Offerings */}
        <circle cx={size * 0.45} cy={size * 0.72} r={size * 0.015} fill="#cc6633" />
        <circle cx={size * 0.55} cy={size * 0.72} r={size * 0.015} fill="#6633cc" />
        
        {/* Incense */}
        <g opacity="0.3">
          <circle cx={size * 0.5} cy={size * 0.58} r={size * 0.01} fill="#888888">
            <animate attributeName="cy" 
                     values={`${size * 0.58};${size * 0.48};${size * 0.38}`}
                     dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.3;0.15;0"
                     dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </g>
  );
};

// Pagoda symbol
export const PagodaSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  return <BuddhistTempleSymbol x={x} y={y} size={size} seed={seed} />;
};

// Ottoman Mosque with distinctive architecture
export const OttomanMosqueSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `ottoman-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`ottomanStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e0d8" />
          <stop offset="100%" stopColor="#d0c8c0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <HolySiteShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Main mosque with multiple domes */}
      <g>
        {/* Main building */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.5} height={size * 0.3} 
              fill={`url(#ottomanStone-${uniqueId})`} />
        
        {/* Central large dome */}
        <ellipse cx={size * 0.5} cy={size * 0.42} 
                 rx={size * 0.18} ry={size * 0.14} 
                 fill="#6699cc" />
        
        {/* Side domes */}
        <ellipse cx={size * 0.32} cy={size * 0.45} 
                 rx={size * 0.08} ry={size * 0.06} 
                 fill="#7799cc" />
        <ellipse cx={size * 0.68} cy={size * 0.45} 
                 rx={size * 0.08} ry={size * 0.06} 
                 fill="#7799cc" />
        
        {/* Tall minaret */}
        <rect x={size * 0.78} y={size * 0.15} 
              width={size * 0.04} height={size * 0.4} 
              fill="#e0d8d0" />
        
        {/* Minaret balcony */}
        <rect x={size * 0.77} y={size * 0.25} 
              width={size * 0.06} height={size * 0.015} 
              fill="#d0c8c0" />
        
        {/* Pointed top */}
        <polygon points={`${size * 0.78},${size * 0.15} ${size * 0.8},${size * 0.1} ${size * 0.82},${size * 0.15}`}
                 fill="#6699cc" />
        
        {/* Crescent */}
        <g transform={`translate(${size * 0.8}, ${size * 0.08})`}>
          <path d={`M 0,${-size * 0.01} 
                    A ${size * 0.01} ${size * 0.01} 0 1 1 0,${size * 0.01}
                    A ${size * 0.007} ${size * 0.007} 0 1 0 0,${-size * 0.01}`}
                fill="#ffcc00" />
        </g>
      </g>
    </g>
  );
};

// Roman Temple (Tholos style) with columns and dome
export const RomanTempleSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `roman-temple-${x}-${y}-${seed}`;
  // Make all holy sites 30% bigger
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`romanMarble-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f4f0" />
          <stop offset="100%" stopColor="#e8e0d8" />
        </linearGradient>
        <radialGradient id={`romanDome-${uniqueId}`}>
          <stop offset="0%" stopColor="#faf6f2" />
          <stop offset="100%" stopColor="#d8d0c8" />
        </radialGradient>
      </defs>
      
      {/* Enhanced shadow */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.82} 
               rx={scaledSize * 0.45} ry={scaledSize * 0.18} 
               fill="rgba(0,0,0,0.25)" filter="blur(3px)" />
      
      {/* Circular platform base */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.75} 
               rx={scaledSize * 0.42} ry={scaledSize * 0.16} 
               fill="#c8c0b8" stroke="#a89888" strokeWidth="0.5" />
      
      {/* Steps */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.73} 
               rx={scaledSize * 0.38} ry={scaledSize * 0.14} 
               fill="#d0c8c0" />
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.71} 
               rx={scaledSize * 0.34} ry={scaledSize * 0.12} 
               fill="#d8d0c8" />
      
      {/* Columns in circle (tholos style) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const colX = scaledSize * 0.5 + Math.cos(rad) * scaledSize * 0.25;
        const colY = scaledSize * 0.65 + Math.sin(rad) * scaledSize * 0.08;
        return (
          <g key={i}>
            {/* Column shaft */}
            <rect x={colX - scaledSize * 0.025} y={colY - scaledSize * 0.28} 
                  width={scaledSize * 0.05} height={scaledSize * 0.3} 
                  fill={`url(#romanMarble-${uniqueId})`} 
                  stroke="#c8c0b8" strokeWidth="0.3" />
            {/* Column capital (Corinthian style) */}
            <rect x={colX - scaledSize * 0.03} y={colY - scaledSize * 0.3} 
                  width={scaledSize * 0.06} height={scaledSize * 0.02} 
                  fill="#e8e0d8" />
            {/* Column base */}
            <rect x={colX - scaledSize * 0.03} y={colY - scaledSize * 0.02} 
                  width={scaledSize * 0.06} height={scaledSize * 0.02} 
                  fill="#d0c8c0" />
          </g>
        );
      })}
      
      {/* Circular entablature */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.37} 
               rx={scaledSize * 0.28} ry={scaledSize * 0.1} 
               fill="#e0d8d0" stroke="#b8b0a8" strokeWidth="0.5" />
      
      {/* Dome */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.35} 
               rx={scaledSize * 0.22} ry={scaledSize * 0.18} 
               fill={`url(#romanDome-${uniqueId})`} />
      
      {/* Dome oculus (opening at top) */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.28} 
               rx={scaledSize * 0.04} ry={scaledSize * 0.02} 
               fill="#87CEEB" opacity="0.6" />
      
      {/* Inner cella visible through columns */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.65} 
               rx={scaledSize * 0.15} ry={scaledSize * 0.05} 
               fill="rgba(40,30,20,0.8)" />
      
      {/* Altar inside */}
      <rect x={scaledSize * 0.47} y={scaledSize * 0.62} 
            width={scaledSize * 0.06} height={scaledSize * 0.04} 
            fill="#d4af37" opacity="0.8" />
      
      {/* Latin inscription on entablature */}
      <text x={scaledSize * 0.5} y={scaledSize * 0.38} 
            fontSize={scaledSize * 0.025} fill="#8a7a6a" textAnchor="middle" 
            fontFamily="serif" fontWeight="bold">
        SPQR
      </text>
    </g>
  );
};

// Greek Temple with proper Doric columns
export const GreekTempleSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `greek-temple-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      <defs>
        <linearGradient id={`greekMarble-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdfaf7" />
          <stop offset="100%" stopColor="#e8e4e0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={scaledSize * 0.52} cy={scaledSize * 0.78} 
               rx={scaledSize * 0.5} ry={scaledSize * 0.2} 
               fill="rgba(0,0,0,0.25)" filter="blur(3px)" />
      
      {/* Three-step platform (stereobate) */}
      <rect x={scaledSize * 0.15} y={scaledSize * 0.72} 
            width={scaledSize * 0.7} height={scaledSize * 0.06} 
            fill="#d8d4d0" stroke="#b8b4b0" strokeWidth="0.5" />
      <rect x={scaledSize * 0.17} y={scaledSize * 0.69} 
            width={scaledSize * 0.66} height={scaledSize * 0.03} 
            fill="#e0dcd8" />
      <rect x={scaledSize * 0.19} y={scaledSize * 0.66} 
            width={scaledSize * 0.62} height={scaledSize * 0.03} 
            fill="#e8e4e0" />
      
      {/* Front columns (6 Doric columns) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const colX = scaledSize * 0.22 + i * scaledSize * 0.11;
        return (
          <g key={`front-${i}`}>
            {/* Fluted column shaft */}
            <rect x={colX} y={scaledSize * 0.35} 
                  width={scaledSize * 0.06} height={scaledSize * 0.31} 
                  fill={`url(#greekMarble-${uniqueId})`} />
            {/* Vertical flutes */}
            {[0, 1, 2, 3].map((f) => (
              <line key={f} 
                    x1={colX + scaledSize * 0.015 * (f + 1)} 
                    y1={scaledSize * 0.35} 
                    x2={colX + scaledSize * 0.015 * (f + 1)} 
                    y2={scaledSize * 0.66} 
                    stroke="#d0ccc8" strokeWidth="0.3" />
            ))}
            {/* Simple Doric capital */}
            <rect x={colX - scaledSize * 0.005} y={scaledSize * 0.33} 
                  width={scaledSize * 0.07} height={scaledSize * 0.02} 
                  fill="#f0ece8" />
          </g>
        );
      })}
      
      {/* Entablature */}
      <rect x={scaledSize * 0.18} y={scaledSize * 0.30} 
            width={scaledSize * 0.64} height={scaledSize * 0.03} 
            fill="#e8e4e0" stroke="#c8c4c0" strokeWidth="0.5" />
      
      {/* Pediment (triangular top) */}
      <polygon points={`${scaledSize * 0.15},${scaledSize * 0.30} 
                        ${scaledSize * 0.5},${scaledSize * 0.18} 
                        ${scaledSize * 0.85},${scaledSize * 0.30}`}
               fill="#f0ece8" stroke="#d0ccc8" strokeWidth="0.5" />
      
      {/* Pediment relief sculpture hint */}
      <circle cx={scaledSize * 0.5} cy={scaledSize * 0.24} r={scaledSize * 0.03} 
              fill="#d8d4d0" opacity="0.5" />
      
      {/* Inner cella walls visible between columns */}
      <rect x={scaledSize * 0.28} y={scaledSize * 0.38} 
            width={scaledSize * 0.44} height={scaledSize * 0.28} 
            fill="rgba(50,40,30,0.6)" />
      
      {/* Statue of deity inside (visible through columns) */}
      <rect x={scaledSize * 0.48} y={scaledSize * 0.50} 
            width={scaledSize * 0.04} height={scaledSize * 0.12} 
            fill="#d4af37" opacity="0.7" />
      <circle cx={scaledSize * 0.5} cy={scaledSize * 0.48} r={scaledSize * 0.02} 
              fill="#d4af37" opacity="0.7" />
    </g>
  );
};

// Tribal Fire Circle - improved for indigenous cultures
export const TribalFireSymbol: React.FC<HolySiteSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `tribal-fire-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3;
  const rng = new ValueNoise(seed);
  
  return (
    <g transform={`translate(${x - size * 0.15}, ${y - size * 0.15})`}>
      {/* Shadow */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.75} 
               rx={scaledSize * 0.4} ry={scaledSize * 0.15} 
               fill="rgba(0,0,0,0.2)" filter="blur(2px)" />
      
      {/* Sacred circle of stones */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const stoneX = scaledSize * 0.5 + Math.cos(rad) * scaledSize * 0.3;
        const stoneY = scaledSize * 0.65 + Math.sin(rad) * scaledSize * 0.12;
        const stoneSize = scaledSize * 0.04 * (0.8 + rng.random() * 0.4);
        return (
          <ellipse key={i} 
                   cx={stoneX} cy={stoneY} 
                   rx={stoneSize} ry={stoneSize * 0.7} 
                   fill="#8B7355" stroke="#6B5345" strokeWidth="0.5" />
        );
      })}
      
      {/* Central fire pit */}
      <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.65} 
               rx={scaledSize * 0.08} ry={scaledSize * 0.04} 
               fill="#4a3a2a" />
      
      {/* Fire logs */}
      <rect x={scaledSize * 0.44} y={scaledSize * 0.63} 
            width={scaledSize * 0.12} height={scaledSize * 0.02} 
            fill="#5D4A3C" transform={`rotate(30 ${scaledSize * 0.5} ${scaledSize * 0.65})`} />
      <rect x={scaledSize * 0.44} y={scaledSize * 0.63} 
            width={scaledSize * 0.12} height={scaledSize * 0.02} 
            fill="#6B5443" transform={`rotate(-30 ${scaledSize * 0.5} ${scaledSize * 0.65})`} />
      
      {/* Animated fire */}
      <g opacity="0.9">
        {/* Outer glow */}
        <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.62} 
                 rx={scaledSize * 0.06} ry={scaledSize * 0.08} 
                 fill="#ff6600" opacity="0.4" filter="blur(3px)">
          <animate attributeName="ry" 
                   values={`${scaledSize * 0.08};${scaledSize * 0.1};${scaledSize * 0.08}`}
                   dur="2s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Main flames */}
        <path d={`M ${scaledSize * 0.48} ${scaledSize * 0.64} 
                  Q ${scaledSize * 0.47} ${scaledSize * 0.58} ${scaledSize * 0.49} ${scaledSize * 0.55}
                  Q ${scaledSize * 0.5} ${scaledSize * 0.58} ${scaledSize * 0.5} ${scaledSize * 0.64}`}
              fill="#ff4400" opacity="0.8">
          <animate attributeName="d" 
                   values={`M ${scaledSize * 0.48} ${scaledSize * 0.64} Q ${scaledSize * 0.47} ${scaledSize * 0.58} ${scaledSize * 0.49} ${scaledSize * 0.55} Q ${scaledSize * 0.5} ${scaledSize * 0.58} ${scaledSize * 0.5} ${scaledSize * 0.64};
                           M ${scaledSize * 0.48} ${scaledSize * 0.64} Q ${scaledSize * 0.48} ${scaledSize * 0.57} ${scaledSize * 0.485} ${scaledSize * 0.54} Q ${scaledSize * 0.49} ${scaledSize * 0.57} ${scaledSize * 0.5} ${scaledSize * 0.64};
                           M ${scaledSize * 0.48} ${scaledSize * 0.64} Q ${scaledSize * 0.47} ${scaledSize * 0.58} ${scaledSize * 0.49} ${scaledSize * 0.55} Q ${scaledSize * 0.5} ${scaledSize * 0.58} ${scaledSize * 0.5} ${scaledSize * 0.64}`}
                   dur="1.5s" repeatCount="indefinite" />
        </path>
        
        <path d={`M ${scaledSize * 0.5} ${scaledSize * 0.64} 
                  Q ${scaledSize * 0.51} ${scaledSize * 0.59} ${scaledSize * 0.505} ${scaledSize * 0.56}
                  Q ${scaledSize * 0.52} ${scaledSize * 0.59} ${scaledSize * 0.52} ${scaledSize * 0.64}`}
              fill="#ffaa00" opacity="0.7">
          <animate attributeName="d" 
                   values={`M ${scaledSize * 0.5} ${scaledSize * 0.64} Q ${scaledSize * 0.51} ${scaledSize * 0.59} ${scaledSize * 0.505} ${scaledSize * 0.56} Q ${scaledSize * 0.52} ${scaledSize * 0.59} ${scaledSize * 0.52} ${scaledSize * 0.64};
                           M ${scaledSize * 0.5} ${scaledSize * 0.64} Q ${scaledSize * 0.515} ${scaledSize * 0.58} ${scaledSize * 0.51} ${scaledSize * 0.55} Q ${scaledSize * 0.515} ${scaledSize * 0.58} ${scaledSize * 0.52} ${scaledSize * 0.64};
                           M ${scaledSize * 0.5} ${scaledSize * 0.64} Q ${scaledSize * 0.51} ${scaledSize * 0.59} ${scaledSize * 0.505} ${scaledSize * 0.56} Q ${scaledSize * 0.52} ${scaledSize * 0.59} ${scaledSize * 0.52} ${scaledSize * 0.64}`}
                   dur="1.8s" repeatCount="indefinite" />
        </path>
        
        {/* Inner yellow flame */}
        <ellipse cx={scaledSize * 0.5} cy={scaledSize * 0.63} 
                 rx={scaledSize * 0.02} ry={scaledSize * 0.03} 
                 fill="#ffdd00" opacity="0.9" />
      </g>
      
      {/* Smoke */}
      <g opacity="0.4">
        {[0, 1, 2].map((i) => (
          <circle key={i} 
                  cx={scaledSize * 0.5} 
                  cy={scaledSize * 0.55}
                  r={scaledSize * 0.02}
                  fill="#888888">
            <animate attributeName="cy" 
                     values={`${scaledSize * 0.55};${scaledSize * 0.45};${scaledSize * 0.35}`}
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.7}s`}
                     repeatCount="indefinite" />
            <animate attributeName="r" 
                     values={`${scaledSize * 0.02};${scaledSize * 0.035};${scaledSize * 0.05}`}
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.7}s`}
                     repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.4;0.2;0"
                     dur={`${3 + i * 0.5}s`}
                     begin={`${i * 0.7}s`}
                     repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      
      {/* Totem poles or ceremonial posts */}
      {seed % 3 === 0 && (
        <g>
          <rect x={scaledSize * 0.15} y={scaledSize * 0.45} 
                width={scaledSize * 0.04} height={scaledSize * 0.2} 
                fill="#8B6F47" stroke="#6B5437" strokeWidth="0.5" />
          {/* Carved faces/patterns */}
          <circle cx={scaledSize * 0.17} cy={scaledSize * 0.48} r={scaledSize * 0.015} 
                  fill="#6B5437" />
          <rect x={scaledSize * 0.16} y={scaledSize * 0.52} 
                width={scaledSize * 0.02} height={scaledSize * 0.005} 
                fill="#5B4327" />
        </g>
      )}
    </g>
  );
};

// Export function to get appropriate holy site type
export const getHolySiteSymbol = (religion: string, culture?: string) => {
  const rel = religion?.toLowerCase() || '';
  const cult = culture?.toUpperCase() || '';
  
  // Roman religions - properly matched now
  if (rel.includes('roman polytheism') || rel.includes('roman pagan') || 
      rel.includes('jupiter') || rel.includes('mars') || rel.includes('minerva') ||
      rel.includes('vesta') || rel.includes('roman gods')) {
    return RomanTempleSymbol;
  }
  
  // Greek religions
  if (rel.includes('greek') || rel.includes('hellenic') || rel.includes('zeus') || 
      rel.includes('apollo') || rel.includes('athena') || rel.includes('olymp') ||
      rel.includes('poseidon') || rel.includes('hera')) {
    return GreekTempleSymbol;
  }
  
  // Christian denominations
  if (rel.includes('protestant') || rel.includes('lutheran') || rel.includes('calvin') || 
      rel.includes('puritan') || rel.includes('anglican') || rel.includes('methodist') ||
      rel.includes('baptist') || rel.includes('presbyterian')) {
    return ProtestantChurchSymbol;
  }
  if (rel.includes('catholic') || rel.includes('roman catholic') || rel.includes('papist')) {
    return CatholicChurchSymbol;
  }
  if (rel.includes('orthodox') || rel.includes('byzantine')) {
    return CathedralSymbol;
  }
  if (rel.includes('early christianity') || rel.includes('christian') || rel.includes('church') || 
      rel.includes('christ') || rel.includes('pentecostal')) {
    // Early Christianity gets simple church
    if (cult.includes('EUROPEAN') || cult.includes('NORTH_AMERICAN')) {
      return ProtestantChurchSymbol;
    }
    return CatholicChurchSymbol;
  }
  
  // Islamic variations
  if (rel.includes('islam') || rel.includes('muslim') || rel.includes('allah') || 
      rel.includes('muhammad') || rel.includes('mosque')) {
    if (cult.includes('MENA') || cult.includes('OTTOMAN') || cult.includes('TURKISH')) {
      return OttomanMosqueSymbol;
    }
    return GenericMosqueSymbol;
  }
  
  // Eastern religions
  if (rel.includes('buddhist') || rel.includes('buddha') || rel.includes('dharma') || 
      rel.includes('sangha') || rel.includes('zen')) {
    return BuddhistTempleSymbol;
  }
  if (rel.includes('hindu') || rel.includes('vedic') || rel.includes('brahma') || 
      rel.includes('vishnu') || rel.includes('shiva')) {
    return HinduTempleSymbol;
  }
  if (rel.includes('shinto') || rel.includes('kami')) {
    return ShintoShrineSymbol;
  }
  
  // Abrahamic
  if (rel.includes('jewish') || rel.includes('judaism') || rel.includes('hebrew') || 
      rel.includes('torah') || rel.includes('synagogue')) {
    return SynagogueSymbol;
  }
  
  // Ancient religions
  if (rel.includes('mesopotamian') || rel.includes('sumerian') || rel.includes('babylonian') || 
      rel.includes('akkadian') || rel.includes('assyrian')) {
    return ZigguratSymbol;
  }
  if (rel.includes('egyptian') || rel.includes('pharaoh') || rel.includes('osiris') || 
      rel.includes('isis') || rel.includes('ra') || rel.includes('anubis')) {
    return PyramidSymbol;
  }
  if (rel.includes('maya') || rel.includes('aztec') || rel.includes('inca') || 
      rel.includes('olmec') || rel.includes('toltec') || rel.includes('mesoamerican')) {
    return MesoamericanPyramidSymbol;
  }
  
  // Nature religions
  if (rel.includes('druid') || rel.includes('celtic') || rel.includes('pagan') || 
      rel.includes('nature') || rel.includes('animist') || rel.includes('shamanic') ||
      rel.includes('folk') || rel.includes('traditional')) {
    return SacredGroveSymbol;
  }
  if (rel.includes('norse') || rel.includes('odin') || rel.includes('thor') || 
      rel.includes('viking') || rel.includes('germanic pagan')) {
    return SacredGroveSymbol;
  }
  
  // Cultural fallbacks when religion is unknown
  if (cult.includes('NORTH_AMERICAN_PRE_COLUMBIAN') || 
      cult.includes('OCEANIA') || 
      cult.includes('SUB_SAHARAN_AFRICAN') ||
      cult.includes('ABORIGINAL') ||
      cult.includes('ARCTIC')) {
    return TribalFireSymbol;
  }
  
  if (cult.includes('EAST_ASIAN')) {
    return BuddhistTempleSymbol;
  }
  
  if (cult.includes('SOUTH_ASIAN')) {
    return HinduTempleSymbol;
  }
  
  if (cult.includes('MENA')) {
    return GenericMosqueSymbol;
  }
  
  if (cult.includes('SOUTH_AMERICAN')) {
    return MesoamericanPyramidSymbol;
  }
  
  if (cult.includes('MEDITERRANEAN') || cult.includes('GREEK') || cult.includes('ROMAN')) {
    // Default to Greek temple for classical Mediterranean
    return GreekTempleSymbol;
  }
  
  return GenericShrineSymbol; // Final fallback
};