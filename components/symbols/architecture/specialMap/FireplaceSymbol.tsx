/**
 * Fireplace Symbol Component
 * Stone, brick, and marble fireplaces with animated fire
 */

import React from 'react';
import { PIXEL_SHADOWS } from '../../PixelArtStyleGuide';

interface FireplaceSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'stone' | 'brick' | 'marble' | 'hearth';
  position?: 'left' | 'center' | 'right';
  isLit?: boolean;
  wallSide?: 'north' | 'south' | 'east' | 'west';
}

const FireplaceSymbol: React.FC<FireplaceSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'stone',
  position = 'center',
  isLit = true,
  wallSide = 'north'
}) => {
  // Rotation based on wall side
  const rotation = wallSide === 'south' ? 0 : 
                  wallSide === 'north' ? 180 :
                  wallSide === 'east' ? 270 : 90;
  
  // Material colors
  const materials = {
    stone: { base: '#8b8680', dark: '#696963', light: '#a8a29e', mortar: '#d3d3d3' },
    brick: { base: '#b85450', dark: '#8b3a3a', light: '#cd5c5c', mortar: '#d3d3d3' },
    marble: { base: '#f8f8f8', dark: '#d0d0d0', light: '#ffffff', vein: '#c0c0c0' },
    hearth: { base: '#4a4a4a', dark: '#2c2c2c', light: '#666666', mortar: '#8b8680' }
  };
  
  const mat = materials[variant] || materials.stone;
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Fireplace structure based on position */}
      {position === 'left' && (
        <>
          {/* Left side pillar */}
          <rect 
            x={0} 
            y={size * 0.2} 
            width={size * 0.3} 
            height={size * 0.8}
            fill={mat.base}
          />
          {/* Mortar lines */}
          {variant === 'brick' && (
            <>
              <line x1={0} y1={size * 0.4} x2={size * 0.3} y2={size * 0.4} stroke={mat.mortar} strokeWidth={0.5} />
              <line x1={0} y1={size * 0.6} x2={size * 0.3} y2={size * 0.6} stroke={mat.mortar} strokeWidth={0.5} />
              <line x1={0} y1={size * 0.8} x2={size * 0.3} y2={size * 0.8} stroke={mat.mortar} strokeWidth={0.5} />
            </>
          )}
          {/* Stone texture */}
          {variant === 'stone' && (
            <>
              <rect x={size * 0.05} y={size * 0.25} width={size * 0.2} height={size * 0.15} fill={mat.dark} />
              <rect x={size * 0.1} y={size * 0.5} width={size * 0.15} height={size * 0.2} fill={mat.light} />
            </>
          )}
          {/* Marble veining */}
          {variant === 'marble' && (
            <>
              <path d={`M ${size * 0.05} ${size * 0.3} Q ${size * 0.15} ${size * 0.5} ${size * 0.25} ${size * 0.7}`} 
                    stroke={mat.vein} strokeWidth={0.5} fill="none" opacity={0.4} />
            </>
          )}
        </>
      )}
      
      {position === 'center' && (
        <>
          {/* Fire chamber opening */}
          <rect 
            x={size * 0.15} 
            y={size * 0.3} 
            width={size * 0.7} 
            height={size * 0.7}
            fill="#1a1a1a"
          />
          
          {/* Hearth base */}
          <rect 
            x={size * 0.1} 
            y={size * 0.85} 
            width={size * 0.8} 
            height={size * 0.15}
            fill={mat.dark}
          />
          
          {/* Mantle shelf */}
          {variant !== 'hearth' && (
            <rect 
              x={size * 0.05} 
              y={size * 0.25} 
              width={size * 0.9} 
              height={size * 0.08}
              fill={mat.base}
            />
          )}
          
          {/* Fire and logs */}
          {isLit && (
            <>
              {/* Logs */}
              <rect x={size * 0.3} y={size * 0.75} width={size * 0.4} height={size * 0.08} fill="#4a2c2a" />
              <rect x={size * 0.25} y={size * 0.78} width={size * 0.5} height={size * 0.06} fill="#3a1c1a" />
              
              {/* Fire - animated with multiple flame tongues */}
              <g className="fire-animation">
                {/* Base flames */}
                <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.15} ry={size * 0.2} fill="#ff4500" opacity={0.9} />
                <ellipse cx={size * 0.45} cy={size * 0.6} rx={size * 0.08} ry={size * 0.15} fill="#ff6347" opacity={0.8} />
                <ellipse cx={size * 0.55} cy={size * 0.62} rx={size * 0.08} ry={size * 0.12} fill="#ff6347" opacity={0.8} />
                
                {/* Flame tips */}
                <ellipse cx={size * 0.48} cy={size * 0.5} rx={size * 0.04} ry={size * 0.08} fill="#ffd700" opacity={0.7} />
                <ellipse cx={size * 0.52} cy={size * 0.52} rx={size * 0.04} ry={size * 0.06} fill="#ffff00" opacity={0.6} />
                
                {/* Embers */}
                <circle cx={size * 0.35} cy={size * 0.8} r={1} fill="#ff4500" opacity={0.8} />
                <circle cx={size * 0.65} cy={size * 0.79} r={1} fill="#ff6347" opacity={0.7} />
                <circle cx={size * 0.5} cy={size * 0.82} r={1.5} fill="#ff8c00" opacity={0.9} />
              </g>
              
              {/* Glow effect */}
              <ellipse 
                cx={size * 0.5} 
                cy={size * 0.6} 
                rx={size * 0.35} 
                ry={size * 0.3}
                fill="#ff6347"
                opacity={0.2}
              />
            </>
          )}
          
          {/* Soot marks */}
          <rect 
            x={size * 0.15} 
            y={size * 0.3} 
            width={size * 0.7} 
            height={size * 0.1}
            fill="#000"
            opacity={0.3}
          />
        </>
      )}
      
      {position === 'right' && (
        <>
          {/* Right side pillar */}
          <rect 
            x={size * 0.7} 
            y={size * 0.2} 
            width={size * 0.3} 
            height={size * 0.8}
            fill={mat.base}
          />
          {/* Details similar to left side */}
          {variant === 'brick' && (
            <>
              <line x1={size * 0.7} y1={size * 0.4} x2={size} y2={size * 0.4} stroke={mat.mortar} strokeWidth={0.5} />
              <line x1={size * 0.7} y1={size * 0.6} x2={size} y2={size * 0.6} stroke={mat.mortar} strokeWidth={0.5} />
              <line x1={size * 0.7} y1={size * 0.8} x2={size} y2={size * 0.8} stroke={mat.mortar} strokeWidth={0.5} />
            </>
          )}
          {variant === 'stone' && (
            <>
              <rect x={size * 0.75} y={size * 0.25} width={size * 0.2} height={size * 0.15} fill={mat.dark} />
              <rect x={size * 0.75} y={size * 0.5} width={size * 0.15} height={size * 0.2} fill={mat.light} />
            </>
          )}
        </>
      )}
      
      {/* Hearth-specific details */}
      {variant === 'hearth' && position === 'center' && (
        <>
          {/* Cooking pot hook */}
          <line 
            x1={size * 0.5} 
            y1={size * 0.35} 
            x2={size * 0.5} 
            y2={size * 0.55}
            stroke="#2c2c2c"
            strokeWidth={2}
          />
          {/* Pot */}
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.58} 
            rx={size * 0.12} 
            ry={size * 0.08}
            fill="#3a3a3a"
          />
          {/* Pot handles */}
          <line 
            x1={size * 0.38} 
            y1={size * 0.58} 
            x2={size * 0.35} 
            y2={size * 0.56}
            stroke="#3a3a3a"
            strokeWidth={1.5}
          />
          <line 
            x1={size * 0.62} 
            y1={size * 0.58} 
            x2={size * 0.65} 
            y2={size * 0.56}
            stroke="#3a3a3a"
            strokeWidth={1.5}
          />
        </>
      )}
    </g>
  );
};

export default FireplaceSymbol;