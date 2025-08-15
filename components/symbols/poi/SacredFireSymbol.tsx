/**
 * components/symbols/poi/SacredFireSymbol.tsx - Sacred fire circle for holy sites
 * Used for Zoroastrian fire temples, indigenous ceremonies, and fire-centered worship
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SacredFireSymbolProps {
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile?: Tile;
}

const SacredFireSymbol: React.FC<SacredFireSymbolProps> = ({ x, y, size, seed, tile }) => {
  const tileX = tile?.x ?? Math.floor(x / size);
  const tileY = tile?.y ?? Math.floor(y / size);
  const rng = new ValueNoise(seed + tileX * 19 + tileY * 53);
  const uniqueId = `sacred-fire-${tileX}-${tileY}-${seed}`;
  const scaledSize = size * 1.3;
  
  // Animation seed for consistent but varied animations
  const animSeed = seed * 0.001;
  
  return (
    <g filter="url(#symbolShadow)">
      <defs>
        {/* Fire gradient */}
        <radialGradient id={`fireGrad-${uniqueId}`}>
          <stop offset="0%" stopColor="#FFDD00" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#FF8800" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#FF4400" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#CC2200" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.75} 
        rx={scaledSize * 0.4} 
        ry={scaledSize * 0.15} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {/* Sacred circle of stones */}
      {Array.from({length: 8}, (_, i) => {
        const angle = (i * 45) * Math.PI / 180;
        const stoneX = x + scaledSize * 0.5 + Math.cos(angle) * scaledSize * 0.3;
        const stoneY = y + scaledSize * 0.65 + Math.sin(angle) * scaledSize * 0.12;
        const stoneSize = scaledSize * 0.04 * (0.8 + rng.random() * 0.4);
        
        return (
          <ellipse 
            key={i} 
            cx={stoneX} 
            cy={stoneY} 
            rx={stoneSize} 
            ry={stoneSize * 0.7} 
            fill="#8B7355" 
            stroke="#6B5345" 
            strokeWidth="0.5" 
          />
        );
      })}
      
      {/* Central fire pit */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.65} 
        rx={scaledSize * 0.08} 
        ry={scaledSize * 0.04} 
        fill="#4a3a2a" 
      />
      
      {/* Fire logs */}
      <rect 
        x={x + scaledSize * 0.44} 
        y={y + scaledSize * 0.63} 
        width={scaledSize * 0.12} 
        height={scaledSize * 0.02} 
        fill="#5D4A3C" 
        transform={`rotate(30 ${x + scaledSize * 0.5} ${y + scaledSize * 0.65})`} 
      />
      <rect 
        x={x + scaledSize * 0.44} 
        y={y + scaledSize * 0.63} 
        width={scaledSize * 0.12} 
        height={scaledSize * 0.02} 
        fill="#6B5443" 
        transform={`rotate(-30 ${x + scaledSize * 0.5} ${y + scaledSize * 0.65})`} 
      />
      
      {/* Animated fire */}
      <g opacity="0.9">
        {/* Outer glow */}
        <ellipse 
          cx={x + scaledSize * 0.5} 
          cy={y + scaledSize * 0.62} 
          rx={scaledSize * 0.06} 
          ry={scaledSize * 0.08} 
          fill="#ff6600" 
          opacity="0.4" 
          filter="blur(3px)"
        >
          <animate 
            attributeName="ry" 
            values={`${scaledSize * 0.08};${scaledSize * 0.1};${scaledSize * 0.08}`}
            dur="2s" 
            begin={`${animSeed}s`}
            repeatCount="indefinite" 
          />
        </ellipse>
        
        {/* Main flames */}
        <path 
          d={`M ${x + scaledSize * 0.48} ${y + scaledSize * 0.64} 
              Q ${x + scaledSize * 0.47} ${y + scaledSize * 0.58} ${x + scaledSize * 0.49} ${y + scaledSize * 0.55}
              Q ${x + scaledSize * 0.5} ${y + scaledSize * 0.58} ${x + scaledSize * 0.5} ${y + scaledSize * 0.64}`}
          fill="#ff4400" 
          opacity="0.8"
        >
          <animate 
            attributeName="d" 
            values={`M ${x + scaledSize * 0.48} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.47} ${y + scaledSize * 0.58} ${x + scaledSize * 0.49} ${y + scaledSize * 0.55} Q ${x + scaledSize * 0.5} ${y + scaledSize * 0.58} ${x + scaledSize * 0.5} ${y + scaledSize * 0.64};
                    M ${x + scaledSize * 0.48} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.48} ${y + scaledSize * 0.57} ${x + scaledSize * 0.485} ${y + scaledSize * 0.54} Q ${x + scaledSize * 0.49} ${y + scaledSize * 0.57} ${x + scaledSize * 0.5} ${y + scaledSize * 0.64};
                    M ${x + scaledSize * 0.48} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.47} ${y + scaledSize * 0.58} ${x + scaledSize * 0.49} ${y + scaledSize * 0.55} Q ${x + scaledSize * 0.5} ${y + scaledSize * 0.58} ${x + scaledSize * 0.5} ${y + scaledSize * 0.64}`}
            dur="1.5s" 
            begin={`${animSeed}s`}
            repeatCount="indefinite" 
          />
        </path>
        
        <path 
          d={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.64} 
              Q ${x + scaledSize * 0.51} ${y + scaledSize * 0.59} ${x + scaledSize * 0.505} ${y + scaledSize * 0.56}
              Q ${x + scaledSize * 0.52} ${y + scaledSize * 0.59} ${x + scaledSize * 0.52} ${y + scaledSize * 0.64}`}
          fill="#ffaa00" 
          opacity="0.7"
        >
          <animate 
            attributeName="d" 
            values={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.51} ${y + scaledSize * 0.59} ${x + scaledSize * 0.505} ${y + scaledSize * 0.56} Q ${x + scaledSize * 0.52} ${y + scaledSize * 0.59} ${x + scaledSize * 0.52} ${y + scaledSize * 0.64};
                    M ${x + scaledSize * 0.5} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.515} ${y + scaledSize * 0.58} ${x + scaledSize * 0.51} ${y + scaledSize * 0.55} Q ${x + scaledSize * 0.515} ${y + scaledSize * 0.58} ${x + scaledSize * 0.52} ${y + scaledSize * 0.64};
                    M ${x + scaledSize * 0.5} ${y + scaledSize * 0.64} Q ${x + scaledSize * 0.51} ${y + scaledSize * 0.59} ${x + scaledSize * 0.505} ${y + scaledSize * 0.56} Q ${x + scaledSize * 0.52} ${y + scaledSize * 0.59} ${x + scaledSize * 0.52} ${y + scaledSize * 0.64}`}
            dur="1.8s" 
            begin={`${animSeed + 0.3}s`}
            repeatCount="indefinite" 
          />
        </path>
        
        {/* Inner yellow flame */}
        <ellipse 
          cx={x + scaledSize * 0.5} 
          cy={y + scaledSize * 0.63} 
          rx={scaledSize * 0.02} 
          ry={scaledSize * 0.03} 
          fill="#ffdd00" 
          opacity="0.9" 
        />
      </g>
      
      {/* Smoke */}
      <g opacity="0.4">
        {[0, 1, 2].map((i) => (
          <circle 
            key={i} 
            cx={x + scaledSize * 0.5} 
            cy={y + scaledSize * 0.55}
            r={scaledSize * 0.02}
            fill="#888888"
          >
            <animate 
              attributeName="cy" 
              values={`${y + scaledSize * 0.55};${y + scaledSize * 0.45};${y + scaledSize * 0.35}`}
              dur={`${3 + i * 0.5}s`}
              begin={`${animSeed + i * 0.7}s`}
              repeatCount="indefinite" 
            />
            <animate 
              attributeName="r" 
              values={`${scaledSize * 0.02};${scaledSize * 0.035};${scaledSize * 0.05}`}
              dur={`${3 + i * 0.5}s`}
              begin={`${animSeed + i * 0.7}s`}
              repeatCount="indefinite" 
            />
            <animate 
              attributeName="opacity" 
              values="0.4;0.2;0"
              dur={`${3 + i * 0.5}s`}
              begin={`${animSeed + i * 0.7}s`}
              repeatCount="indefinite" 
            />
          </circle>
        ))}
      </g>
      
      {/* For Zoroastrian style - add ceremonial pillars */}
      {rng.random() > 0.5 && (
        <>
          <rect 
            x={x + scaledSize * 0.15} 
            y={y + scaledSize * 0.45} 
            width={scaledSize * 0.04} 
            height={scaledSize * 0.2} 
            fill="#8B6F47" 
            stroke="#6B5437" 
            strokeWidth="0.5" 
          />
          <rect 
            x={x + scaledSize * 0.81} 
            y={y + scaledSize * 0.45} 
            width={scaledSize * 0.04} 
            height={scaledSize * 0.2} 
            fill="#8B6F47" 
            stroke="#6B5437" 
            strokeWidth="0.5" 
          />
        </>
      )}
      
      {/* For Native American style - add totem decorations */}
      {rng.random() > 0.5 && rng.random() < 0.8 && (
        <g>
          <rect 
            x={x + scaledSize * 0.25} 
            y={y + scaledSize * 0.5} 
            width={scaledSize * 0.03} 
            height={scaledSize * 0.15} 
            fill="#7B5F3F" 
            stroke="#5B3F1F" 
            strokeWidth="0.3" 
          />
          {/* Simple carved pattern */}
          <circle 
            cx={x + scaledSize * 0.265} 
            cy={y + scaledSize * 0.53} 
            r={scaledSize * 0.01} 
            fill="#5B3F1F" 
          />
          <rect 
            x={x + scaledSize * 0.255} 
            y={y + scaledSize * 0.56} 
            width={scaledSize * 0.02} 
            height={scaledSize * 0.003} 
            fill="#4B2F0F" 
          />
        </g>
      )}
    </g>
  );
};

export default React.memo(SacredFireSymbol);