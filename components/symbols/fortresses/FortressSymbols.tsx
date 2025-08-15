/**
 * Fortress symbol components for different historical periods and cultural zones
 * Rendered in 2.5D isometric perspective
 */
import React from 'react';

interface FortressSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  fortressType?: string;
}

// Prehistoric hillfort with earthworks and palisades
export const HillfortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.2;
  const uniqueId = `hillfort-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`earthGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7355" />
          <stop offset="100%" stopColor="#6d5940" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.8} rx={size * 0.4} ry={size * 0.15} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Earthwork mound - circular */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.4} ry={size * 0.35} 
               fill={`url(#earthGrad-${uniqueId})`} stroke="#5a4a3a" strokeWidth="1" />
      
      {/* Inner plateau */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.3} ry={size * 0.25} 
               fill="#9b8976" stroke="#6d5940" strokeWidth="0.5" />
      
      {/* Wooden palisade posts in circle */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const postX = size * 0.5 + Math.cos(angle) * size * 0.25;
        const postY = size * 0.45 + Math.sin(angle) * size * 0.2;
        return (
          <rect key={i} x={postX - 1} y={postY - size * 0.08} 
                width={2} height={size * 0.08} 
                fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.3" />
        );
      })}
      
      {/* Central structure */}
      <rect x={size * 0.45} y={size * 0.4} width={size * 0.1} height={size * 0.1} 
            fill="#7a6a5a" stroke="#4a3a2a" strokeWidth="0.5" />
      <polygon points={`${size * 0.43},${size * 0.4} ${size * 0.5},${size * 0.35} ${size * 0.57},${size * 0.4}`}
               fill="#5a4a3a" stroke="#3a2a1a" strokeWidth="0.3" />
    </g>
  );
};

// Roman castrum/fort with stone walls
export const CastrumSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.25;
  const uniqueId = `castrum-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4c4b0" />
          <stop offset="100%" stopColor="#b8a890" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <rect x={size * 0.15 + depth * 0.3} y={size * 0.25 + depth * 0.3} 
            width={size * 0.7} height={size * 0.6} 
            fill="rgba(0,0,0,0.3)" rx={2} />
      
      {/* Main walls - rectangular fort */}
      <rect x={size * 0.15} y={size * 0.25} width={size * 0.7} height={size * 0.6} 
            fill={`url(#stoneGrad-${uniqueId})`} stroke="#8a7a60" strokeWidth="1.5" rx={2} />
      
      {/* 3D depth - right wall */}
      <path d={`M ${size * 0.85} ${size * 0.25}
                L ${size * 0.85 + depth} ${size * 0.25 - depth * 0.5}
                L ${size * 0.85 + depth} ${size * 0.85 - depth * 0.5}
                L ${size * 0.85} ${size * 0.85} Z`}
            fill="#a89880" stroke="#8a7a60" strokeWidth="1" />
      
      {/* Corner towers */}
      {[
        {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
        {x: 0.15, y: 0.85}, {x: 0.85, y: 0.85}
      ].map((pos, i) => (
        <g key={i}>
          <circle cx={size * pos.x} cy={size * pos.y} r={size * 0.06} 
                  fill="#c4b4a0" stroke="#8a7a60" strokeWidth="0.5" />
          <circle cx={size * pos.x} cy={size * pos.y} r={size * 0.04} 
                  fill="#9a8a70" />
        </g>
      ))}
      
      {/* Gates */}
      <rect x={size * 0.47} y={size * 0.23} width={size * 0.06} height={size * 0.04} 
            fill="#4a3a2a" />
      <rect x={size * 0.47} y={size * 0.83} width={size * 0.06} height={size * 0.04} 
            fill="#4a3a2a" />
      
      {/* Inner buildings */}
      <rect x={size * 0.35} y={size * 0.45} width={size * 0.3} height={size * 0.2} 
            fill="#b8a890" stroke="#8a7a60" strokeWidth="0.3" />
      <polygon points={`${size * 0.35},${size * 0.45} ${size * 0.5},${size * 0.38} ${size * 0.65},${size * 0.45}`}
               fill="#9a8a70" stroke="#7a6a50" strokeWidth="0.3" />
    </g>
  );
};

// Medieval castle with keep and walls
export const MedievalCastleSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.3;
  const uniqueId = `castle-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`castleStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b0a090" />
          <stop offset="100%" stopColor="#908070" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <path d={`M ${size * 0.2 + depth * 0.4} ${size * 0.8 + depth * 0.3}
                L ${size * 0.8 + depth * 0.4} ${size * 0.8 + depth * 0.3}
                L ${size * 0.85} ${size * 0.85}
                L ${size * 0.25} ${size * 0.85} Z`}
            fill="rgba(0,0,0,0.35)" />
      
      {/* Outer walls */}
      <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.45} 
            fill={`url(#castleStone-${uniqueId})`} stroke="#706050" strokeWidth="1.5" />
      
      {/* Crenellations */}
      {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
        <rect key={i} x={size * xPos} y={size * 0.33} width={size * 0.04} height={size * 0.03} 
              fill="#b0a090" stroke="#706050" strokeWidth="0.3" />
      ))}
      
      {/* Central keep - tall tower */}
      <rect x={size * 0.4} y={size * 0.2} width={size * 0.2} height={size * 0.5} 
            fill="#a89880" stroke="#706050" strokeWidth="1" />
      
      {/* Keep 3D effect */}
      <path d={`M ${size * 0.6} ${size * 0.2}
                L ${size * 0.6 + depth * 0.5} ${size * 0.2 - depth * 0.25}
                L ${size * 0.6 + depth * 0.5} ${size * 0.7 - depth * 0.25}
                L ${size * 0.6} ${size * 0.7} Z`}
            fill="#988870" stroke="#706050" strokeWidth="0.5" />
      
      {/* Keep roof */}
      <polygon points={`${size * 0.4},${size * 0.2} ${size * 0.5},${size * 0.12} ${size * 0.6},${size * 0.2}`}
               fill="#7a6a5a" stroke="#5a4a3a" strokeWidth="0.5" />
      
      {/* Corner towers */}
      {[{x: 0.2, y: 0.35}, {x: 0.8, y: 0.35}].map((pos, i) => (
        <g key={i}>
          <rect x={size * pos.x - size * 0.04} y={size * pos.y - size * 0.05} 
                width={size * 0.08} height={size * 0.25} 
                fill="#b0a090" stroke="#706050" strokeWidth="0.5" />
          <polygon points={`${size * (pos.x - 0.04)},${size * (pos.y - 0.05)} ${size * pos.x},${size * (pos.y - 0.1)} ${size * (pos.x + 0.04)},${size * (pos.y - 0.05)}`}
                   fill="#8a7a6a" stroke="#5a4a3a" strokeWidth="0.3" />
        </g>
      ))}
      
      {/* Gate with portcullis */}
      <rect x={size * 0.47} y={size * 0.65} width={size * 0.06} height={size * 0.15} 
            fill="#3a2a1a" stroke="#706050" strokeWidth="0.5" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={size * (0.475 + i * 0.015)} y1={size * 0.65} 
              x2={size * (0.475 + i * 0.015)} y2={size * 0.8} 
              stroke="#5a4a3a" strokeWidth="0.3" />
      ))}
      
      {/* Banner */}
      <line x1={size * 0.5} y1={size * 0.12} x2={size * 0.5} y2={size * 0.05} 
            stroke="#4a3a2a" strokeWidth="0.5" />
      <polygon points={`${size * 0.5},${size * 0.05} ${size * 0.55},${size * 0.07} ${size * 0.5},${size * 0.09}`}
               fill="#cc3333" stroke="#8a1111" strokeWidth="0.2" />
    </g>
  );
};

// Renaissance star fort with bastions
export const StarFortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `starfort-${x}-${y}`;
  const centerX = size * 0.5;
  const centerY = size * 0.5;
  
  // Generate star points
  const points = [];
  const numPoints = 5;
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? size * 0.4 : size * 0.25;
    points.push(`${centerX + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`);
  }
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`fortStone-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c8b8a8" />
          <stop offset="100%" stopColor="#a89888" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <polygon points={points.join(' ')} 
               fill="rgba(0,0,0,0.3)" 
               transform="translate(3, 3)" />
      
      {/* Main star fort */}
      <polygon points={points.join(' ')} 
               fill={`url(#fortStone-${uniqueId})`} 
               stroke="#806858" strokeWidth="1.5" />
      
      {/* Inner star */}
      <polygon points={points.map((p, i) => {
                const [px, py] = p.split(',').map(Number);
                const scale = 0.7;
                return `${centerX + (px - centerX) * scale},${centerY + (py - centerY) * scale}`;
               }).join(' ')} 
               fill="#b8a898" stroke="#907868" strokeWidth="0.5" />
      
      {/* Central citadel */}
      <rect x={centerX - size * 0.08} y={centerY - size * 0.08} 
            width={size * 0.16} height={size * 0.16} 
            fill="#a89888" stroke="#806858" strokeWidth="0.8" />
      
      {/* Moat indication */}
      <polygon points={points.join(' ')} 
               fill="none" 
               stroke="rgba(100,150,200,0.3)" strokeWidth="3" 
               strokeDasharray="2,2" />
      
      {/* Cannon positions at star points */}
      {Array.from({ length: numPoints }).map((_, i) => {
        const angle = (i * 2 / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
        const px = centerX + Math.cos(angle) * size * 0.35;
        const py = centerY + Math.sin(angle) * size * 0.35;
        return (
          <circle key={i} cx={px} cy={py} r={size * 0.02} 
                  fill="#4a3a2a" stroke="#2a1a0a" strokeWidth="0.3" />
        );
      })}
    </g>
  );
};

// Colonial presidio fort
export const PresidioSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.2;
  const uniqueId = `presidio-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`adobeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d4b0" />
          <stop offset="100%" stopColor="#d4b896" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <rect x={size * 0.15 + depth * 0.3} y={size * 0.25 + depth * 0.3} 
            width={size * 0.7} height={size * 0.6} 
            fill="rgba(0,0,0,0.25)" />
      
      {/* Adobe walls - square fort */}
      <rect x={size * 0.15} y={size * 0.25} width={size * 0.7} height={size * 0.6} 
            fill={`url(#adobeGrad-${uniqueId})`} stroke="#b89668" strokeWidth="1.2" />
      
      {/* 3D depth */}
      <path d={`M ${size * 0.85} ${size * 0.25}
                L ${size * 0.85 + depth} ${size * 0.25 - depth * 0.5}
                L ${size * 0.85 + depth} ${size * 0.85 - depth * 0.5}
                L ${size * 0.85} ${size * 0.85} Z`}
            fill="#d4b090" stroke="#b89668" strokeWidth="0.5" />
      
      {/* Corner bastions */}
      {[
        {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
        {x: 0.15, y: 0.85}, {x: 0.85, y: 0.85}
      ].map((pos, i) => (
        <rect key={i} x={size * pos.x - size * 0.05} y={size * pos.y - size * 0.05} 
              width={size * 0.1} height={size * 0.1} 
              fill="#e0c8a8" stroke="#b89668" strokeWidth="0.5" />
      ))}
      
      {/* Church/chapel with bell tower */}
      <rect x={size * 0.35} y={size * 0.4} width={size * 0.2} height={size * 0.25} 
            fill="#f0e0c8" stroke="#b89668" strokeWidth="0.5" />
      <rect x={size * 0.38} y={size * 0.3} width={size * 0.05} height={size * 0.15} 
            fill="#e8d4b0" stroke="#b89668" strokeWidth="0.3" />
      <polygon points={`${size * 0.38},${size * 0.3} ${size * 0.405},${size * 0.25} ${size * 0.43},${size * 0.3}`}
               fill="#c8a878" stroke="#986848" strokeWidth="0.3" />
      
      {/* Cross on chapel */}
      <line x1={size * 0.405} y1={size * 0.23} x2={size * 0.405} y2={size * 0.27} 
            stroke="#8a6a4a" strokeWidth="0.5" />
      <line x1={size * 0.395} y1={size * 0.24} x2={size * 0.415} y2={size * 0.24} 
            stroke="#8a6a4a" strokeWidth="0.5" />
      
      {/* Gates */}
      <rect x={size * 0.47} y={size * 0.23} width={size * 0.06} height={size * 0.04} 
            fill="#6a4a2a" stroke="#4a2a0a" strokeWidth="0.3" />
      
      {/* Parade ground (empty center) */}
      <rect x={size * 0.3} y={size * 0.5} width={size * 0.4} height={size * 0.25} 
            fill="rgba(200,180,140,0.3)" stroke="#b89668" strokeWidth="0.2" 
            strokeDasharray="2,1" />
    </g>
  );
};

// Modern military base/bunker
export const ModernFortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const depth = size * 0.15;
  const uniqueId = `modernfort-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`concreteGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8b8b8" />
          <stop offset="100%" stopColor="#989898" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <rect x={size * 0.1 + depth * 0.3} y={size * 0.3 + depth * 0.3} 
            width={size * 0.8} height={size * 0.5} 
            fill="rgba(0,0,0,0.3)" />
      
      {/* Main bunker structure */}
      <rect x={size * 0.1} y={size * 0.3} width={size * 0.8} height={size * 0.5} 
            fill={`url(#concreteGrad-${uniqueId})`} stroke="#606060" strokeWidth="1" />
      
      {/* 3D depth */}
      <path d={`M ${size * 0.9} ${size * 0.3}
                L ${size * 0.9 + depth} ${size * 0.3 - depth * 0.5}
                L ${size * 0.9 + depth} ${size * 0.8 - depth * 0.5}
                L ${size * 0.9} ${size * 0.8} Z`}
            fill="#888888" stroke="#606060" strokeWidth="0.5" />
      
      {/* Reinforced sections */}
      <rect x={size * 0.2} y={size * 0.35} width={size * 0.15} height={size * 0.4} 
            fill="#a0a0a0" stroke="#707070" strokeWidth="0.5" />
      <rect x={size * 0.65} y={size * 0.35} width={size * 0.15} height={size * 0.4} 
            fill="#a0a0a0" stroke="#707070" strokeWidth="0.5" />
      
      {/* Observation slits */}
      {[0.25, 0.45, 0.55, 0.75].map((xPos, i) => (
        <rect key={i} x={size * xPos} y={size * 0.45} width={size * 0.08} height={size * 0.02} 
              fill="#303030" stroke="#202020" strokeWidth="0.3" />
      ))}
      
      {/* Radar/antenna */}
      <line x1={size * 0.5} y1={size * 0.3} x2={size * 0.5} y2={size * 0.15} 
            stroke="#606060" strokeWidth="1" />
      <circle cx={size * 0.5} cy={size * 0.12} r={size * 0.04} 
              fill="none" stroke="#606060" strokeWidth="0.8" />
      <line x1={size * 0.46} y1={size * 0.12} x2={size * 0.54} y2={size * 0.12} 
            stroke="#606060" strokeWidth="0.5" />
      <line x1={size * 0.5} y1={size * 0.08} x2={size * 0.5} y2={size * 0.16} 
            stroke="#606060" strokeWidth="0.5" />
      
      {/* Fence perimeter */}
      <rect x={size * 0.05} y={size * 0.2} width={size * 0.9} height={size * 0.7} 
            fill="none" stroke="#808080" strokeWidth="0.5" 
            strokeDasharray="3,1" />
    </g>
  );
};

// Japanese castle
export const JapaneseFortressSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `japfort-${x}-${y}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`japStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#c0c0c0" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <polygon points={`${size * 0.3},${size * 0.8} ${size * 0.7},${size * 0.8} ${size * 0.75},${size * 0.75} ${size * 0.25},${size * 0.75}`}
               fill="rgba(0,0,0,0.3)" />
      
      {/* Stone base - sloped */}
      <polygon points={`${size * 0.25},${size * 0.7} ${size * 0.75},${size * 0.7} ${size * 0.7},${size * 0.5} ${size * 0.3},${size * 0.5}`}
               fill={`url(#japStone-${uniqueId})`} stroke="#888888" strokeWidth="1" />
      
      {/* Main keep - multi-tiered */}
      {[0, 1, 2].map((tier) => {
        const tierSize = 1 - tier * 0.15;
        const tierY = 0.5 - tier * 0.12;
        return (
          <g key={tier}>
            <rect x={size * (0.5 - 0.15 * tierSize)} y={size * tierY} 
                  width={size * 0.3 * tierSize} height={size * 0.1} 
                  fill="#f0f0f0" stroke="#888888" strokeWidth="0.5" />
            {/* Curved roof */}
            <path d={`M ${size * (0.5 - 0.18 * tierSize)} ${size * tierY}
                      Q ${size * 0.5} ${size * (tierY - 0.05)}
                      ${size * (0.5 + 0.18 * tierSize)} ${size * tierY}`}
                  fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.3" />
          </g>
        );
      })}
      
      {/* Windows */}
      {[0.42, 0.5, 0.58].map((xPos, i) => (
        <rect key={i} x={size * xPos} y={size * 0.52} width={size * 0.02} height={size * 0.03} 
              fill="#303030" />
      ))}
    </g>
  );
};

// Export function to get appropriate fortress type
export const getFortressSymbol = (fortressType: string, era?: string) => {
  const type = fortressType?.toLowerCase() || '';
  
  if (type.includes('hillfort') || type.includes('enclosure')) {
    return HillfortSymbol;
  }
  if (type.includes('castrum') || type.includes('roman')) {
    return CastrumSymbol;
  }
  if (type.includes('star') || type.includes('bastion')) {
    return StarFortSymbol;
  }
  if (type.includes('presidio') || type.includes('colonial')) {
    return PresidioSymbol;
  }
  if (type.includes('castle') || type.includes('keep') || type.includes('citadel')) {
    return MedievalCastleSymbol;
  }
  if (type.includes('modern') || type.includes('base') || type.includes('bunker')) {
    return ModernFortSymbol;
  }
  if (type.includes('japanese') || type.includes('tenshu')) {
    return JapaneseFortressSymbol;
  }
  
  // Default based on era
  if (era) {
    if (era.includes('prehistoric')) return HillfortSymbol;
    if (era.includes('ancient')) return CastrumSymbol;
    if (era.includes('medieval')) return MedievalCastleSymbol;
    if (era.includes('renaissance') || era.includes('early_modern')) return StarFortSymbol;
    if (era.includes('modern')) return ModernFortSymbol;
  }
  
  return MedievalCastleSymbol; // Default
};