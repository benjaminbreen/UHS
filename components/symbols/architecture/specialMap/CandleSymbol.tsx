/**
 * CandleSymbol.tsx - Beautiful Stardew Valley/FF6 style candle
 * Warm lighting with proper flame animation and wax drips
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS } from '../../PixelArtStyleGuide';

interface CandleSymbolProps {
  x: number;
  y: number;
  size: number;
  lit?: boolean;
  culturalZone?: string;
  variant?: 'single' | 'candelabra' | 'lantern' | 'altar';
}

export const CandleSymbol: React.FC<CandleSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  lit = true,
  culturalZone = 'EUROPEAN',
  variant = 'single'
}) => {
  const getCandleStyle = () => {
    const baseWax = getPixelColors('#F5DEB3'); // Wheat/beeswax color
    const flamePalette = {
      core: '#FFFFFF',
      inner: '#FFEB3B',
      middle: '#FFA726',
      outer: '#FF6F00',
      glow: '#FFD700'
    };
    
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          wax: getPixelColors('#DC143C'), // Red candles for festivals
          holder: getPixelColors('#8B4513'), // Wood holder
          flame: flamePalette,
          hasHolder: true
        };
      case 'MENA':
        return {
          wax: baseWax,
          holder: getPixelColors('#B8860B'), // Brass
          flame: flamePalette,
          hasHolder: true
        };
      case 'EUROPEAN':
        return {
          wax: baseWax,
          holder: getPixelColors('#C0C0C0'), // Silver
          flame: flamePalette,
          hasHolder: variant !== 'single'
        };
      default:
        return {
          wax: baseWax,
          holder: getPixelColors('#8B7355'),
          flame: flamePalette,
          hasHolder: false
        };
    }
  };
  
  const style = getCandleStyle();
  
  const renderFlame = () => {
    if (!lit) return null;
    
    return (
      <g>
        {/* Glow effect around flame */}
        <defs>
          <radialGradient id={`candle-glow-${x}-${y}`}>
            <stop offset="0%" stopColor={style.flame.glow} stopOpacity="0.4" />
            <stop offset="50%" stopColor={style.flame.glow} stopOpacity="0.2" />
            <stop offset="100%" stopColor={style.flame.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.2} fill={`url(#candle-glow-${x}-${y})`} />
        
        {/* Flame with multiple layers for realism */}
        <ellipse cx={size * 0.5} cy={size * 0.3} rx={size * 0.06} ry={size * 0.12} fill={style.flame.outer} opacity={0.8} />
        <ellipse cx={size * 0.5} cy={size * 0.31} rx={size * 0.04} ry={size * 0.09} fill={style.flame.middle} />
        <ellipse cx={size * 0.5} cy={size * 0.32} rx={size * 0.025} ry={size * 0.06} fill={style.flame.inner} />
        <ellipse cx={size * 0.5} cy={size * 0.33} rx={size * 0.015} ry={size * 0.03} fill={style.flame.core} />
        
        {/* Wick */}
        <rect x={size * 0.49} y={size * 0.36} width={size * 0.02} height={size * 0.04} fill="#2C1810" />
      </g>
    );
  };
  
  const renderSingleCandle = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.15} ry={size * 0.05} fill="#000000" opacity={0.3} />
      
      {/* Candle holder if applicable */}
      {style.hasHolder && (
        <>
          <ellipse cx={size * 0.5} cy={size * 0.8} rx={size * 0.18} ry={size * 0.06} fill={style.holder.dark} />
          <ellipse cx={size * 0.5} cy={size * 0.78} rx={size * 0.15} ry={size * 0.05} fill={style.holder.base} />
          <ellipse cx={size * 0.5} cy={size * 0.77} rx={size * 0.12} ry={size * 0.04} fill={style.holder.light} />
        </>
      )}
      
      {/* Candle body */}
      <rect x={size * 0.42} y={size * 0.4} width={size * 0.16} height={size * 0.38} fill={style.wax.base} />
      <rect x={size * 0.42} y={size * 0.4} width={size * 0.04} height={size * 0.38} fill={style.wax.light} opacity={0.6} />
      <rect x={size * 0.54} y={size * 0.4} width={size * 0.04} height={size * 0.38} fill={style.wax.dark} opacity={0.5} />
      
      {/* Wax drips for realism */}
      <ellipse cx={size * 0.44} cy={size * 0.5} rx={size * 0.02} ry={size * 0.06} fill={style.wax.light} />
      <ellipse cx={size * 0.56} cy={size * 0.55} rx={size * 0.015} ry={size * 0.04} fill={style.wax.light} />
      
      {/* Top rim */}
      <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.08} ry={size * 0.03} fill={style.wax.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.39} rx={size * 0.06} ry={size * 0.02} fill={style.wax.base} />
      
      {/* Melted wax pool at top */}
      {lit && (
        <ellipse cx={size * 0.5} cy={size * 0.38} rx={size * 0.05} ry={size * 0.015} fill={style.wax.light} opacity={0.8} />
      )}
      
      {renderFlame()}
    </g>
  );
  
  const renderCandelabra = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.3} ry={size * 0.08} fill="#000000" opacity={0.3} />
      
      {/* Base */}
      <ellipse cx={size * 0.5} cy={size * 0.8} rx={size * 0.2} ry={size * 0.06} fill={style.holder.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.78} rx={size * 0.18} ry={size * 0.05} fill={style.holder.base} />
      
      {/* Central stem */}
      <rect x={size * 0.48} y={size * 0.5} width={size * 0.04} height={size * 0.28} fill={style.holder.base} />
      <rect x={size * 0.48} y={size * 0.5} width={size * 0.01} height={size * 0.28} fill={style.holder.light} />
      
      {/* Arms */}
      <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.02} fill={style.holder.base} />
      <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.01} fill={style.holder.light} />
      
      {/* Three candles */}
      {[0.3, 0.5, 0.7].map((xPos, i) => (
        <g key={i}>
          {/* Candle */}
          <rect x={size * (xPos - 0.04)} y={size * 0.35} width={size * 0.08} height={size * 0.15} fill={style.wax.base} />
          <rect x={size * (xPos - 0.04)} y={size * 0.35} width={size * 0.02} height={size * 0.15} fill={style.wax.light} opacity={0.6} />
          
          {/* Cup holder */}
          <ellipse cx={size * xPos} cy={size * 0.5} rx={size * 0.05} ry={size * 0.02} fill={style.holder.dark} />
          <ellipse cx={size * xPos} cy={size * 0.49} rx={size * 0.04} ry={size * 0.015} fill={style.holder.base} />
          
          {/* Flame */}
          {lit && (
            <g>
              <ellipse cx={size * xPos} cy={size * 0.3} rx={size * 0.04} ry={size * 0.08} fill={style.flame.outer} opacity={0.8} />
              <ellipse cx={size * xPos} cy={size * 0.31} rx={size * 0.025} ry={size * 0.05} fill={style.flame.inner} />
              <ellipse cx={size * xPos} cy={size * 0.32} rx={size * 0.015} ry={size * 0.025} fill={style.flame.core} />
            </g>
          )}
        </g>
      ))}
    </g>
  );
  
  const renderAltarCandles = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Two tall candles side by side */}
      {[0.35, 0.65].map((xPos, i) => (
        <g key={i}>
          {/* Shadow */}
          <ellipse cx={size * (xPos + 0.02)} cy={size * 0.85} rx={size * 0.1} ry={size * 0.04} fill="#000000" opacity={0.3} />
          
          {/* Tall candle */}
          <rect x={size * (xPos - 0.06)} y={size * 0.3} width={size * 0.12} height={size * 0.5} fill={style.wax.base} />
          <rect x={size * (xPos - 0.06)} y={size * 0.3} width={size * 0.03} height={size * 0.5} fill={style.wax.light} opacity={0.6} />
          <rect x={size * (xPos + 0.03)} y={size * 0.3} width={size * 0.03} height={size * 0.5} fill={style.wax.dark} opacity={0.5} />
          
          {/* Multiple wax drips */}
          <ellipse cx={size * (xPos - 0.04)} cy={size * 0.45} rx={size * 0.015} ry={size * 0.08} fill={style.wax.light} />
          <ellipse cx={size * (xPos + 0.04)} cy={size * 0.5} rx={size * 0.012} ry={size * 0.06} fill={style.wax.light} />
          
          {/* Flame */}
          {lit && (
            <g>
              <circle cx={size * xPos} cy={size * 0.22} r={size * 0.12} fill={style.flame.glow} opacity={0.3} />
              <ellipse cx={size * xPos} cy={size * 0.25} rx={size * 0.05} ry={size * 0.1} fill={style.flame.outer} opacity={0.8} />
              <ellipse cx={size * xPos} cy={size * 0.26} rx={size * 0.03} ry={size * 0.07} fill={style.flame.middle} />
              <ellipse cx={size * xPos} cy={size * 0.27} rx={size * 0.02} ry={size * 0.04} fill={style.flame.inner} />
              <ellipse cx={size * xPos} cy={size * 0.28} rx={size * 0.01} ry={size * 0.02} fill={style.flame.core} />
            </g>
          )}
        </g>
      ))}
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {variant === 'single' && renderSingleCandle()}
      {variant === 'candelabra' && renderCandelabra()}
      {variant === 'altar' && renderAltarCandles()}
    </svg>
  );
};