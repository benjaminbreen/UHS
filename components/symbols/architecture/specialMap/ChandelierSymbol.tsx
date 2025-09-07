/**
 * Chandelier Symbol Component
 * Hanging ceiling lights with cultural and era variations
 */

import React from 'react';
import { PIXEL_SHADOWS } from '../../PixelArtStyleGuide';

interface ChandelierSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'crystal' | 'iron' | 'wooden' | 'basic';
  scale?: 'small' | 'medium' | 'large';
  isLit?: boolean;
  culturalZone?: string;
}

const ChandelierSymbol: React.FC<ChandelierSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'basic',
  scale = 'medium',
  isLit = true,
  culturalZone = 'EUROPEAN'
}) => {
  const scaleMultiplier = scale === 'large' ? 1.2 : scale === 'small' ? 0.8 : 1;
  const actualSize = size * scaleMultiplier;
  
  // Crystal chandelier (wealthy European/MENA)
  if (variant === 'crystal') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Chain/mount */}
        <line 
          x1={size/2} 
          y1={0} 
          x2={size/2} 
          y2={size * 0.2}
          stroke="#4a4a4a"
          strokeWidth={1}
        />
        
        {/* Main frame */}
        <circle 
          cx={size/2} 
          cy={size * 0.35} 
          r={actualSize * 0.25}
          fill="none"
          stroke="#d4af37"
          strokeWidth={2}
        />
        
        {/* Crystal drops - outer ring */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = size/2 + Math.cos(rad) * actualSize * 0.25;
          const cy = size * 0.35 + Math.sin(rad) * actualSize * 0.25;
          
          return (
            <g key={i}>
              {/* Crystal */}
              <polygon
                points={`${cx},${cy} ${cx-2},${cy+6} ${cx},${cy+8} ${cx+2},${cy+6}`}
                fill="#e6f3ff"
                stroke="#a8c8e6"
                strokeWidth={0.5}
              />
              {/* Light reflection */}
              {isLit && (
                <rect 
                  x={cx - 1} 
                  y={cy + 2} 
                  width={2} 
                  height={2}
                  fill="#ffffff"
                  opacity={0.8}
                />
              )}
            </g>
          );
        })}
        
        {/* Candles/lights */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = size/2 + Math.cos(rad) * actualSize * 0.15;
          const cy = size * 0.35 + Math.sin(rad) * actualSize * 0.15;
          
          return (
            <g key={i}>
              {/* Candle */}
              <rect 
                x={cx - 1} 
                y={cy - 3} 
                width={2} 
                height={6}
                fill="#fffacd"
              />
              {/* Flame */}
              {isLit && (
                <ellipse 
                  cx={cx} 
                  cy={cy - 5} 
                  rx={2} 
                  ry={3}
                  fill="#ffd700"
                  opacity={0.9}
                />
              )}
            </g>
          );
        })}
        
        {/* Light glow effect */}
        {isLit && (
          <circle 
            cx={size/2} 
            cy={size * 0.35} 
            r={actualSize * 0.4}
            fill="#ffd700"
            opacity={0.15}
          />
        )}
      </g>
    );
  }
  
  // Iron chandelier (medieval/gothic)
  if (variant === 'iron') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Chain */}
        <rect 
          x={size/2 - 1} 
          y={0} 
          width={2} 
          height={size * 0.25}
          fill="#2c2c2c"
        />
        
        {/* Wheel frame */}
        <circle 
          cx={size/2} 
          cy={size * 0.4} 
          r={actualSize * 0.3}
          fill="none"
          stroke="#2c2c2c"
          strokeWidth={3}
        />
        
        {/* Spokes */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = size/2 + Math.cos(rad) * actualSize * 0.3;
          const y2 = size * 0.4 + Math.sin(rad) * actualSize * 0.3;
          
          return (
            <line
              key={i}
              x1={size/2}
              y1={size * 0.4}
              x2={x2}
              y2={y2}
              stroke="#2c2c2c"
              strokeWidth={2}
            />
          );
        })}
        
        {/* Candle holders */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = size/2 + Math.cos(rad) * actualSize * 0.3;
          const cy = size * 0.4 + Math.sin(rad) * actualSize * 0.3;
          
          return (
            <g key={i}>
              {/* Holder */}
              <rect 
                x={cx - 2} 
                y={cy - 1} 
                width={4} 
                height={3}
                fill="#2c2c2c"
              />
              {/* Candle */}
              <rect 
                x={cx - 1} 
                y={cy - 4} 
                width={2} 
                height={4}
                fill="#f5f5dc"
              />
              {/* Flame */}
              {isLit && (
                <ellipse 
                  cx={cx} 
                  cy={cy - 6} 
                  rx={2} 
                  ry={3}
                  fill="#ff6b35"
                  opacity={0.9}
                />
              )}
            </g>
          );
        })}
        
        {/* Light glow */}
        {isLit && (
          <circle 
            cx={size/2} 
            cy={size * 0.4} 
            r={actualSize * 0.45}
            fill="#ff6b35"
            opacity={0.1}
          />
        )}
      </g>
    );
  }
  
  // Wooden chandelier (rustic/colonial)
  if (variant === 'wooden') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Rope/chain */}
        <line 
          x1={size/2} 
          y1={0} 
          x2={size/2} 
          y2={size * 0.25}
          stroke="#8b6f47"
          strokeWidth={2}
          strokeDasharray="2,1"
        />
        
        {/* Wooden beams cross */}
        <rect 
          x={size * 0.15} 
          y={size * 0.38} 
          width={size * 0.7} 
          height={size * 0.08}
          fill="#8b6f47"
        />
        <rect 
          x={size * 0.46} 
          y={size * 0.15} 
          width={size * 0.08} 
          height={size * 0.5}
          fill="#8b6f47"
        />
        
        {/* Wood grain */}
        <line 
          x1={size * 0.2} 
          y1={size * 0.4} 
          x2={size * 0.8} 
          y2={size * 0.4}
          stroke="#6b5637"
          strokeWidth={0.5}
        />
        
        {/* Candle holders at beam ends */}
        {[
          [size * 0.15, size * 0.42],
          [size * 0.85, size * 0.42],
          [size * 0.5, size * 0.15],
          [size * 0.5, size * 0.65]
        ].map(([cx, cy], i) => (
          <g key={i}>
            {/* Metal holder */}
            <circle 
              cx={cx} 
              cy={cy} 
              r={3}
              fill="#4a4a4a"
            />
            {/* Candle */}
            <rect 
              x={cx - 1} 
              y={cy - 3} 
              width={2} 
              height={3}
              fill="#fffacd"
            />
            {/* Flame */}
            {isLit && (
              <ellipse 
                cx={cx} 
                cy={cy - 5} 
                rx={1.5} 
                ry={2.5}
                fill="#ffa500"
                opacity={0.9}
              />
            )}
          </g>
        ))}
        
        {/* Light glow */}
        {isLit && (
          <circle 
            cx={size/2} 
            cy={size * 0.4} 
            r={actualSize * 0.4}
            fill="#ffa500"
            opacity={0.12}
          />
        )}
      </g>
    );
  }
  
  // Basic chandelier (default)
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Simple chain */}
      <line 
        x1={size/2} 
        y1={0} 
        x2={size/2} 
        y2={size * 0.3}
        stroke="#666"
        strokeWidth={1}
      />
      
      {/* Ring */}
      <circle 
        cx={size/2} 
        cy={size * 0.4} 
        r={actualSize * 0.2}
        fill="none"
        stroke="#666"
        strokeWidth={2}
      />
      
      {/* Simple lights */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = size/2 + Math.cos(rad) * actualSize * 0.2;
        const cy = size * 0.4 + Math.sin(rad) * actualSize * 0.2;
        
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={2}
            fill={isLit ? "#ffeb3b" : "#999"}
          />
        );
      })}
      
      {/* Glow */}
      {isLit && (
        <circle 
          cx={size/2} 
          cy={size * 0.4} 
          r={actualSize * 0.35}
          fill="#ffeb3b"
          opacity={0.1}
        />
      )}
    </g>
  );
};

export default ChandelierSymbol;