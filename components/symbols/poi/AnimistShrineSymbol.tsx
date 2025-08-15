/**
 * components/symbols/poi/AnimistShrineSymbol.tsx - Generic animist/spirit shrine
 * Used for various animistic, shamanic, and spirit worship traditions
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AnimistShrineSymbolProps {
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile?: Tile;
}

const AnimistShrineSymbol: React.FC<AnimistShrineSymbolProps> = ({ x, y, size, seed, tile }) => {
  const tileX = tile?.x ?? Math.floor(x / size);
  const tileY = tile?.y ?? Math.floor(y / size);
  const rng = new ValueNoise(seed + tileX * 29 + tileY * 37);
  const scaledSize = size * 1.3;
  
  // Variations
  const shrineType = Math.floor(rng.random() * 3); // 0: spirit house, 1: ancestor pole, 2: fetish hut
  const hasOfferings = rng.random() > 0.3;
  const hasClothStrips = rng.random() > 0.4;
  const hasSkulls = rng.random() > 0.7;
  
  return (
    <g filter="url(#symbolShadow)">
      {/* Ground shadow */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.75} 
        rx={scaledSize * 0.25} 
        ry={scaledSize * 0.1} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {shrineType === 0 && (
        /* Spirit House */
        <g>
          {/* Platform/stilts */}
          <rect x={x + scaledSize * 0.38} y={y + scaledSize * 0.6} width={scaledSize * 0.02} height={scaledSize * 0.15} fill="#6B4423" stroke="#4B2213" strokeWidth="0.3" />
          <rect x={x + scaledSize * 0.6} y={y + scaledSize * 0.6} width={scaledSize * 0.02} height={scaledSize * 0.15} fill="#6B4423" stroke="#4B2213" strokeWidth="0.3" />
          
          {/* House body */}
          <rect 
            x={x + scaledSize * 0.35} 
            y={y + scaledSize * 0.45} 
            width={scaledSize * 0.3} 
            height={scaledSize * 0.2} 
            fill="#8B7355" 
            stroke="#6B5345" 
            strokeWidth="0.5" 
          />
          
          {/* Roof */}
          <path 
            d={`M ${x + scaledSize * 0.32} ${y + scaledSize * 0.45}
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.35}
                L ${x + scaledSize * 0.68} ${y + scaledSize * 0.45}
                Z`}
            fill="#5D4E37" 
            stroke="#3D2E17" 
            strokeWidth="0.5" 
          />
          
          {/* Spirit opening */}
          <rect 
            x={x + scaledSize * 0.47} 
            y={y + scaledSize * 0.52} 
            width={scaledSize * 0.06} 
            height={scaledSize * 0.08} 
            fill="#2C2416" 
          />
          
          {/* Decorative elements */}
          {hasClothStrips && (
            <>
              <rect x={x + scaledSize * 0.36} y={y + scaledSize * 0.46} width={scaledSize * 0.01} height={scaledSize * 0.06} fill="#DC143C" opacity="0.8" />
              <rect x={x + scaledSize * 0.63} y={y + scaledSize * 0.46} width={scaledSize * 0.01} height={scaledSize * 0.06} fill="#FFD700" opacity="0.8" />
            </>
          )}
        </g>
      )}
      
      {shrineType === 1 && (
        /* Ancestor Pole */
        <g>
          {/* Main pole */}
          <rect 
            x={x + scaledSize * 0.48} 
            y={y + scaledSize * 0.35} 
            width={scaledSize * 0.04} 
            height={scaledSize * 0.4} 
            fill="#6B4423" 
            stroke="#4B2213" 
            strokeWidth="0.5" 
          />
          
          {/* Carved face */}
          <ellipse 
            cx={x + scaledSize * 0.5} 
            cy={y + scaledSize * 0.42} 
            rx={scaledSize * 0.03} 
            ry={scaledSize * 0.04} 
            fill="#8B6F47" 
            stroke="#5B3F27" 
            strokeWidth="0.3" 
          />
          
          {/* Eyes */}
          <circle cx={x + scaledSize * 0.485} cy={y + scaledSize * 0.41} r={scaledSize * 0.005} fill="#1C1C1C" />
          <circle cx={x + scaledSize * 0.515} cy={y + scaledSize * 0.41} r={scaledSize * 0.005} fill="#1C1C1C" />
          
          {/* Mouth */}
          <line 
            x1={x + scaledSize * 0.48} 
            y1={y + scaledSize * 0.435} 
            x2={x + scaledSize * 0.52} 
            y2={y + scaledSize * 0.435} 
            stroke="#1C1C1C" 
            strokeWidth="0.5" 
          />
          
          {/* Arms */}
          <rect 
            x={x + scaledSize * 0.42} 
            y={y + scaledSize * 0.48} 
            width={scaledSize * 0.16} 
            height={scaledSize * 0.02} 
            fill="#6B4423" 
            stroke="#4B2213" 
            strokeWidth="0.3" 
          />
          
          {/* Cloth offerings */}
          {hasClothStrips && (
            <>
              <path d={`M ${x + scaledSize * 0.42} ${y + scaledSize * 0.49} L ${x + scaledSize * 0.41} ${y + scaledSize * 0.55}`} stroke="#FF6347" strokeWidth="1" opacity="0.7" />
              <path d={`M ${x + scaledSize * 0.58} ${y + scaledSize * 0.49} L ${x + scaledSize * 0.59} ${y + scaledSize * 0.55}`} stroke="#4169E1" strokeWidth="1" opacity="0.7" />
              <path d={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.5} L ${x + scaledSize * 0.5} ${y + scaledSize * 0.56}`} stroke="#FFD700" strokeWidth="1" opacity="0.7" />
            </>
          )}
        </g>
      )}
      
      {shrineType === 2 && (
        /* Fetish Hut */
        <g>
          {/* Conical structure */}
          <path 
            d={`M ${x + scaledSize * 0.4} ${y + scaledSize * 0.7}
                L ${x + scaledSize * 0.5} ${y + scaledSize * 0.35}
                L ${x + scaledSize * 0.6} ${y + scaledSize * 0.7}
                A ${scaledSize * 0.1} ${scaledSize * 0.05} 0 0 1 ${x + scaledSize * 0.4} ${y + scaledSize * 0.7}`}
            fill="#8B7D6B" 
            stroke="#5B4D3B" 
            strokeWidth="0.5" 
          />
          
          {/* Entrance */}
          <ellipse 
            cx={x + scaledSize * 0.5} 
            cy={y + scaledSize * 0.62} 
            rx={scaledSize * 0.04} 
            ry={scaledSize * 0.06} 
            fill="#1C1C1C" 
          />
          
          {/* Power objects/fetishes on walls */}
          <circle cx={x + scaledSize * 0.45} cy={y + scaledSize * 0.5} r={scaledSize * 0.01} fill="#8B0000" />
          <circle cx={x + scaledSize * 0.55} cy={y + scaledSize * 0.5} r={scaledSize * 0.01} fill="#008B8B" />
          <circle cx={x + scaledSize * 0.48} cy={y + scaledSize * 0.55} r={scaledSize * 0.008} fill="#FFD700" />
          <circle cx={x + scaledSize * 0.52} cy={y + scaledSize * 0.55} r={scaledSize * 0.008} fill="#F5F5DC" />
          
          {/* Horns/tusks on top */}
          <path 
            d={`M ${x + scaledSize * 0.48} ${y + scaledSize * 0.36}
                Q ${x + scaledSize * 0.46} ${y + scaledSize * 0.33} ${x + scaledSize * 0.45} ${y + scaledSize * 0.32}`}
            stroke="#F5F5DC" 
            strokeWidth="1" 
            fill="none" 
          />
          <path 
            d={`M ${x + scaledSize * 0.52} ${y + scaledSize * 0.36}
                Q ${x + scaledSize * 0.54} ${y + scaledSize * 0.33} ${x + scaledSize * 0.55} ${y + scaledSize * 0.32}`}
            stroke="#F5F5DC" 
            strokeWidth="1" 
            fill="none" 
          />
        </g>
      )}
      
      {/* Offering platform */}
      {hasOfferings && (
        <g>
          <rect 
            x={x + scaledSize * 0.35} 
            y={y + scaledSize * 0.72} 
            width={scaledSize * 0.3} 
            height={scaledSize * 0.03} 
            fill="#6B4423" 
            stroke="#4B2213" 
            strokeWidth="0.3" 
          />
          
          {/* Offerings */}
          <circle cx={x + scaledSize * 0.4} cy={y + scaledSize * 0.71} r={scaledSize * 0.01} fill="#FF6347" opacity="0.8" />
          <circle cx={x + scaledSize * 0.45} cy={y + scaledSize * 0.705} r={scaledSize * 0.008} fill="#FFD700" opacity="0.8" />
          <ellipse cx={x + scaledSize * 0.55} cy={y + scaledSize * 0.71} rx={scaledSize * 0.015} ry={scaledSize * 0.008} fill="#8FBC8F" opacity="0.8" />
          <circle cx={x + scaledSize * 0.6} cy={y + scaledSize * 0.71} r={scaledSize * 0.01} fill="#DDA0DD" opacity="0.8" />
        </g>
      )}
      
      {/* Skulls/bones (for more intense traditions) */}
      {hasSkulls && shrineType !== 0 && (
        <g opacity="0.7">
          <ellipse 
            cx={x + scaledSize * 0.38} 
            cy={y + scaledSize * 0.73} 
            rx={scaledSize * 0.015} 
            ry={scaledSize * 0.018} 
            fill="#F5F5DC" 
            stroke="#D3D3D3" 
            strokeWidth="0.2" 
          />
          <circle cx={x + scaledSize * 0.375} cy={y + scaledSize * 0.725} r={scaledSize * 0.003} fill="#2C2416" />
          <circle cx={x + scaledSize * 0.385} cy={y + scaledSize * 0.725} r={scaledSize * 0.003} fill="#2C2416" />
        </g>
      )}
      
      {/* Sacred smoke/incense */}
      <g opacity="0.3">
        <path 
          d={`M ${x + scaledSize * 0.5} ${y + scaledSize * 0.35}
              Q ${x + scaledSize * 0.51} ${y + scaledSize * 0.3} ${x + scaledSize * 0.49} ${y + scaledSize * 0.25}
              Q ${x + scaledSize * 0.48} ${y + scaledSize * 0.2} ${x + scaledSize * 0.5} ${y + scaledSize * 0.15}`}
          stroke="#888888" 
          strokeWidth="1.5" 
          fill="none" 
        />
      </g>
    </g>
  );
};

export default React.memo(AnimistShrineSymbol);