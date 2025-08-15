/**
 * components/symbols/poi/StupaSymbol.tsx - Buddhist Stupa symbol
 * Used for Buddhist holy sites, especially in South and Southeast Asia
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface StupaSymbolProps {
  x: number; 
  y: number; 
  size: number; 
  seed: number; 
  tile?: Tile;
}

const StupaSymbol: React.FC<StupaSymbolProps> = ({ x, y, size, seed, tile }) => {
  const tileX = tile?.x ?? Math.floor(x / size);
  const tileY = tile?.y ?? Math.floor(y / size);
  const rng = new ValueNoise(seed + tileX * 17 + tileY * 31);
  const scaledSize = size * 1.3;
  
  // Stupa colors
  const baseColor = "#D4A76A"; // Sandstone
  const domeColor = "#F5DEB3"; // Lighter sandstone
  const spireColor = "#CD853F"; // Darker brown
  const decorColor = "#FFD700"; // Gold accents
  
  // Variations
  const hasFlags = rng.random() > 0.3;
  const hasPrayerWheels = rng.random() > 0.5;
  const numTiers = 3 + Math.floor(rng.random() * 2); // 3-4 tiers
  
  return (
    <g filter="url(#symbolShadow)">
      {/* Ground/Platform shadow */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.8} 
        rx={scaledSize * 0.45} 
        ry={scaledSize * 0.15} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {/* Square base platform */}
      <rect 
        x={x + scaledSize * 0.2} 
        y={y + scaledSize * 0.7} 
        width={scaledSize * 0.6} 
        height={scaledSize * 0.08} 
        fill={baseColor} 
        stroke="#8B7355" 
        strokeWidth="0.5" 
      />
      
      {/* Tiered square base (Medhi) */}
      {Array.from({length: numTiers}).map((_, i) => {
        const tierWidth = scaledSize * (0.55 - i * 0.05);
        const tierX = x + (scaledSize - tierWidth) / 2;
        const tierY = y + scaledSize * (0.68 - i * 0.03);
        const tierHeight = scaledSize * 0.025;
        
        return (
          <rect 
            key={`tier-${i}`}
            x={tierX} 
            y={tierY} 
            width={tierWidth} 
            height={tierHeight} 
            fill={baseColor} 
            stroke="#8B7355" 
            strokeWidth="0.3" 
          />
        );
      })}
      
      {/* Main dome (Anda) */}
      <ellipse 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.5} 
        rx={scaledSize * 0.25} 
        ry={scaledSize * 0.22} 
        fill={domeColor} 
        stroke="#8B7355" 
        strokeWidth="0.5" 
      />
      
      {/* Dome highlight */}
      <ellipse 
        cx={x + scaledSize * 0.48} 
        cy={y + scaledSize * 0.45} 
        rx={scaledSize * 0.08} 
        ry={scaledSize * 0.06} 
        fill="#FFFAF0" 
        opacity="0.5" 
      />
      
      {/* Square harmika (relic chamber) on top of dome */}
      <rect 
        x={x + scaledSize * 0.45} 
        y={y + scaledSize * 0.32} 
        width={scaledSize * 0.1} 
        height={scaledSize * 0.06} 
        fill={spireColor} 
        stroke="#6B4423" 
        strokeWidth="0.3" 
      />
      
      {/* Spire (Yasti) with umbrella tiers (Chattra) */}
      <line 
        x1={x + scaledSize * 0.5} 
        y1={y + scaledSize * 0.32} 
        x2={x + scaledSize * 0.5} 
        y2={y + scaledSize * 0.18} 
        stroke={spireColor} 
        strokeWidth="1.5" 
      />
      
      {/* Umbrella tiers */}
      {[0, 1, 2].map(i => {
        const umbrellaY = y + scaledSize * (0.24 - i * 0.02);
        const umbrellaWidth = scaledSize * (0.08 - i * 0.015);
        
        return (
          <ellipse 
            key={`umbrella-${i}`}
            cx={x + scaledSize * 0.5} 
            cy={umbrellaY} 
            rx={umbrellaWidth} 
            ry={scaledSize * 0.01} 
            fill={decorColor} 
            stroke="#B8860B" 
            strokeWidth="0.2" 
          />
        );
      })}
      
      {/* Top finial */}
      <circle 
        cx={x + scaledSize * 0.5} 
        cy={y + scaledSize * 0.17} 
        r={scaledSize * 0.015} 
        fill={decorColor} 
        stroke="#B8860B" 
        strokeWidth="0.3" 
      />
      
      {/* Prayer flags (optional) */}
      {hasFlags && (
        <>
          {/* Left flag line */}
          <line 
            x1={x + scaledSize * 0.5} 
            y1={y + scaledSize * 0.2} 
            x2={x + scaledSize * 0.15} 
            y2={y + scaledSize * 0.5} 
            stroke="#8B4513" 
            strokeWidth="0.5" 
          />
          {/* Right flag line */}
          <line 
            x1={x + scaledSize * 0.5} 
            y1={y + scaledSize * 0.2} 
            x2={x + scaledSize * 0.85} 
            y2={y + scaledSize * 0.5} 
            stroke="#8B4513" 
            strokeWidth="0.5" 
          />
          
          {/* Small prayer flags */}
          {[0.2, 0.3, 0.4].map(pos => (
            <g key={`flag-${pos}`}>
              <rect 
                x={x + scaledSize * pos} 
                y={y + scaledSize * (0.2 + pos * 0.6)} 
                width={scaledSize * 0.02} 
                height={scaledSize * 0.03} 
                fill={['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E77E', '#FFF'][Math.floor(rng.random() * 5)]} 
                opacity="0.8" 
              />
              <rect 
                x={x + scaledSize * (1 - pos)} 
                y={y + scaledSize * (0.2 + pos * 0.6)} 
                width={scaledSize * 0.02} 
                height={scaledSize * 0.03} 
                fill={['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E77E', '#FFF'][Math.floor(rng.random() * 5)]} 
                opacity="0.8" 
              />
            </g>
          ))}
        </>
      )}
      
      {/* Prayer wheels at base (optional) */}
      {hasPrayerWheels && (
        <>
          {[-0.15, -0.05, 0.05, 0.15].map(offset => (
            <g key={`wheel-${offset}`}>
              <rect 
                x={x + scaledSize * (0.5 + offset) - scaledSize * 0.01} 
                y={y + scaledSize * 0.72} 
                width={scaledSize * 0.02} 
                height={scaledSize * 0.04} 
                fill="#8B4513" 
                stroke="#6B3413" 
                strokeWidth="0.2" 
              />
              <ellipse 
                cx={x + scaledSize * (0.5 + offset)} 
                cy={y + scaledSize * 0.72} 
                rx={scaledSize * 0.012} 
                ry={scaledSize * 0.008} 
                fill="#CD853F" 
              />
            </g>
          ))}
        </>
      )}
      
      {/* Entrance gate/torana (simplified) */}
      <rect 
        x={x + scaledSize * 0.48} 
        y={y + scaledSize * 0.68} 
        width={scaledSize * 0.04} 
        height={scaledSize * 0.06} 
        fill="#4B3621" 
        stroke="#2B1611" 
        strokeWidth="0.3" 
      />
    </g>
  );
};

export default React.memo(StupaSymbol);