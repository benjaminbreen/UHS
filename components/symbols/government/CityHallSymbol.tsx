/**
 * components/symbols/government/CityHallSymbol.tsx - Industrial era municipal buildings
 * Enhanced with 3D isometric perspective, animated clock, and cultural variants
 */
import React from 'react';
import { Tile } from '../../../types';

interface CityHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'victorian' | 'neoclassical' | 'colonial' | 'beaux_arts' | 'germanic' | 'scandinavian';
}

const CityHallSymbol: React.FC<CityHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'victorian' 
}) => {
  const uniqueId = `cityhall-${x}-${y}-${seed}`;
  
  // Parse time from seed for clock hands
  const hour = ((seed * 7) % 12) || 12;
  const minute = (seed * 13) % 60;
  const hourAngle = (hour % 12) * 30 + (minute / 60) * 30;
  const minuteAngle = minute * 6;
  
  // Get variant-specific colors and details
  const getDetails = () => {
    switch (variant) {
      case 'neoclassical':
        return {
          wall: '#FFFACD', // Lemon chiffon (white stone)
          roof: '#696969', // Dim gray
          accent: '#2F4F4F', // Dark slate gray
          window: '#4a7a9a',
          clockTower: true,
          dome: false
        };
      case 'colonial':
        return {
          wall: '#DEB887', // Burlywood (red brick)
          roof: '#8B0000', // Dark red
          accent: '#F5F5DC', // Beige (white trim)
          window: '#4169E1',
          clockTower: true,
          dome: false
        };
      case 'beaux_arts':
        return {
          wall: '#F5F5DC', // Beige (limestone)
          roof: '#2F4F4F', // Dark slate gray
          accent: '#DAA520', // Goldenrod
          window: '#5a8a9a',
          clockTower: false,
          dome: true
        };
      case 'germanic':
        return {
          wall: '#d8c8b8', // Light stone
          roof: '#8B0000', // Dark red tiles
          accent: '#654321', // Dark brown
          window: '#6a8a9a',
          clockTower: true,
          dome: false
        };
      case 'scandinavian':
        return {
          wall: '#e8e0d8', // Light gray stone
          roof: '#2F4F4F', // Dark slate
          accent: '#708090', // Slate gray
          window: '#87CEEB',
          clockTower: true,
          dome: false
        };
      default: // victorian
        return {
          wall: '#e8d8c8',
          roof: '#d0c0b0',
          accent: '#c8b8a8',
          window: '#4a7a9a',
          clockTower: true,
          dome: false
        };
    }
  };
  
  const details = getDetails();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`hallGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={details.wall} />
          <stop offset="50%" stopColor={details.wall} stopOpacity="0.9" />
          <stop offset="100%" stopColor={details.accent} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.75} 
        rx={size * 0.4} 
        ry={size * 0.15} 
        fill="rgba(0,0,0,0.25)"
        filter="blur(2px)"
      />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front face */}
        <rect x={size * 0.25} y={size * 0.4} 
              width={size * 0.5} height={size * 0.35} 
              fill={`url(#hallGrad-${uniqueId})`} />
        
        {/* Top face - 3D perspective */}
        <polygon points={`${size * 0.25},${size * 0.4} ${size * 0.35},${size * 0.32} ${size * 0.85},${size * 0.32} ${size * 0.75},${size * 0.4}`}
                 fill={details.wall} opacity="0.9" />
        
        {/* Right face - 3D depth */}
        <polygon points={`${size * 0.75},${size * 0.4} ${size * 0.85},${size * 0.32} ${size * 0.85},${size * 0.67} ${size * 0.75},${size * 0.75}`}
                 fill={details.accent} />
        
        {/* Clock tower or dome based on variant */}
        {details.clockTower && (
          <>
            {/* Clock tower */}
            <rect x={size * 0.45} y={size * 0.2} 
                  width={size * 0.1} height={size * 0.25} 
                  fill={details.wall} stroke={details.accent} strokeWidth="0.5" />
            
            {/* Clock tower roof */}
            <polygon points={`${size * 0.44},${size * 0.2} ${size * 0.5},${size * 0.15} ${size * 0.56},${size * 0.2}`}
                     fill={details.roof} />
            
            {/* Clock face */}
            <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.04} 
                    fill="#f8f8f8" stroke="#888888" strokeWidth="0.5" />
            
            {/* Animated clock hands */}
            <g transform={`translate(${size * 0.5}, ${size * 0.28})`}>
              {/* Hour hand */}
              <line x1={0} y1={0} 
                    x2={0} y2={-size * 0.02}
                    stroke="#333333" strokeWidth="0.8"
                    transform={`rotate(${hourAngle})`}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${hourAngle}`}
                  to={`${hourAngle + 360}`}
                  dur="120s"
                  repeatCount="indefinite"
                />
              </line>
              
              {/* Minute hand */}
              <line x1={0} y1={0} 
                    x2={0} y2={-size * 0.03}
                    stroke="#333333" strokeWidth="0.5"
                    transform={`rotate(${minuteAngle})`}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${minuteAngle}`}
                  to={`${minuteAngle + 360}`}
                  dur="10s"
                  repeatCount="indefinite"
                />
              </line>
              
              {/* Center dot */}
              <circle cx={0} cy={0} r={size * 0.003} fill="#333333" />
            </g>
          </>
        )}
        
        {details.dome && (
          <>
            {/* Beaux-arts dome */}
            <ellipse cx={size * 0.5} cy={size * 0.35} 
                     rx={size * 0.12} ry={size * 0.1} 
                     fill={details.roof} stroke={details.accent} strokeWidth="0.5" />
            <ellipse cx={size * 0.5} cy={size * 0.33} 
                     rx={size * 0.09} ry={size * 0.07} 
                     fill={details.roof} opacity="0.8" />
            {/* Dome finial */}
            <rect x={size * 0.495} y={size * 0.26} 
                  width={size * 0.01} height={size * 0.07} 
                  fill={details.accent} />
            <circle cx={size * 0.5} cy={size * 0.25} 
                    r={size * 0.015} fill="#DAA520" />
          </>
        )}
        
        {/* Windows - different styles by variant */}
        {variant === 'victorian' || variant === 'colonial' ? (
          // Tall Victorian windows
          [0.35, 0.5, 0.65].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.02} 
                    y={size * 0.48} 
                    width={size * 0.04} height={size * 0.08} 
                    fill={details.window} opacity="0.7" />
              {/* Window arch */}
              <path d={`M ${size * xPos - size * 0.02} ${size * 0.48}
                        Q ${size * xPos} ${size * 0.46}, ${size * xPos + size * 0.02} ${size * 0.48}`}
                    fill={details.window} opacity="0.7" />
            </g>
          ))
        ) : variant === 'neoclassical' || variant === 'beaux_arts' ? (
          // Classical windows with pediments
          [0.32, 0.42, 0.58, 0.68].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.018} 
                    y={size * 0.5} 
                    width={size * 0.036} height={size * 0.06} 
                    fill={details.window} opacity="0.7" />
              {/* Pediment */}
              <polygon points={`${size * xPos - size * 0.02},${size * 0.5} ${size * xPos},${size * 0.48} ${size * xPos + size * 0.02},${size * 0.5}`}
                       fill={details.accent} opacity="0.5" />
            </g>
          ))
        ) : (
          // Germanic/Scandinavian grid windows
          [0.35, 0.5, 0.65].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.025} 
                    y={size * 0.5} 
                    width={size * 0.05} height={size * 0.06} 
                    fill={details.window} opacity="0.7" />
              {/* Window grid */}
              <line x1={size * xPos} y1={size * 0.5} 
                    x2={size * xPos} y2={size * 0.56} 
                    stroke={details.accent} strokeWidth="0.3" />
              <line x1={size * xPos - size * 0.025} y1={size * 0.53} 
                    x2={size * xPos + size * 0.025} y2={size * 0.53} 
                    stroke={details.accent} strokeWidth="0.3" />
            </g>
          ))
        )}
        
        {/* Main entrance - culturally appropriate */}
        {variant === 'neoclassical' || variant === 'beaux_arts' ? (
          // Grand columned entrance
          <g>
            {[0.44, 0.48, 0.52, 0.56].map((xPos, i) => (
              <rect key={i} 
                    x={size * xPos - size * 0.008} 
                    y={size * 0.6} 
                    width={size * 0.016} height={size * 0.15} 
                    fill={details.wall} stroke={details.accent} strokeWidth="0.3" />
            ))}
            <rect x={size * 0.47} y={size * 0.68} 
                  width={size * 0.06} height={size * 0.07} 
                  fill="#2a2a2a" />
          </g>
        ) : (
          // Standard entrance
          <rect x={size * 0.47} y={size * 0.65} 
                width={size * 0.06} height={size * 0.1} 
                fill="#4a3a2a" />
        )}
      </g>
      
      {/* Flag pole with animated flag */}
      <g transform={`translate(${size * 0.3}, ${size * 0.32})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.12} 
              stroke="#5a4a3a" strokeWidth="1" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-2;0;2;0"
            dur="3s"
            repeatCount="indefinite"
          />
          <rect x={0} y={-size * 0.12} 
                width={size * 0.08} height={size * 0.05} 
                fill={variant === 'colonial' ? '#cc4444' : 
                      variant === 'germanic' ? '#000000' :
                      variant === 'scandinavian' ? '#4169E1' : '#4444cc'} 
                opacity="0.8" />
        </g>
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(CityHallSymbol);