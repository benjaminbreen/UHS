/**
 * components/symbols/government/ColonialOfficeSymbol.tsx - Colonial administrative buildings
 * Enhanced with palm tree context and Union Jack flag
 */
import React from 'react';
import { Tile } from '../../../types';

interface ColonialOfficeSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'british' | 'french' | 'dutch' | 'spanish' | 'portuguese' | 'raj' | 'eastern' | 'australian' | 'pacific' | 'coastal';
}

const ColonialOfficeSymbol: React.FC<ColonialOfficeSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'british' 
}) => {
  const uniqueId = `colonial-${x}-${y}-${seed}`;
  
  // Get variant-specific colors and flag details
  const getDetails = () => {
    switch (variant) {
      case 'french':
        return {
          wall: '#f8f0e8',
          roof: '#7a5a3a',
          accent: '#e8e0d8',
          flagColors: ['#002395', '#ffffff', '#ED2939'] // French tricolor
        };
      case 'dutch':
        return {
          wall: '#f5e8d8',
          roof: '#ff8c00',
          accent: '#d8c8b8',
          flagColors: ['#C8102E', '#ffffff', '#003DA5'] // Dutch horizontal tricolor
        };
      case 'spanish':
        return {
          wall: '#faf0e0',
          roof: '#cc6633',
          accent: '#e8d8c8',
          flagColors: ['#c60b1e', '#ffc400'] // Spanish red and gold
        };
      case 'portuguese':
        return {
          wall: '#f8e8d0',
          roof: '#8b4513',
          accent: '#e0d0c0',
          flagColors: ['#006600', '#FF0000'] // Portuguese green and red
        };
      case 'raj':
      case 'eastern':
      case 'australian':
      case 'pacific':
      case 'coastal':
        return {
          wall: '#f8f0e8',
          roof: '#8a6a4a',
          accent: '#e8e0d8',
          flagColors: ['union-jack'] // British territories
        };
      default: // british
        return {
          wall: '#f8f0e8',
          roof: '#8a6a4a',
          accent: '#e8e0d8',
          flagColors: ['union-jack'] // Special case for Union Jack
        };
    }
  };
  
  const details = getDetails();
  const isTropical = ['raj', 'eastern', 'pacific', 'coastal'].includes(variant || 'british');
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`colonialGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={details.wall} />
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
      
      {/* Palm tree context for tropical variants */}
      {isTropical && (
        <g opacity="0.6">
          <rect x={size * 0.85} y={size * 0.4} 
                width={size * 0.02} height={size * 0.35} 
                fill="#8a6a4a" />
          <g transform={`translate(${size * 0.86}, ${size * 0.38})`}>
            {[0, 60, 120, 240, 300].map((angle, i) => (
              <path key={i}
                    d={`M 0,0 Q ${Math.cos(angle * Math.PI / 180) * size * 0.08},${-size * 0.02} 
                        ${Math.cos(angle * Math.PI / 180) * size * 0.12},${Math.sin(angle * Math.PI / 180) * size * 0.08}`}
                    fill="#4a7a4a" stroke="#3a5a3a" strokeWidth="0.3" />
            ))}
          </g>
        </g>
      )}
      
      {/* Shadow */}
      <ellipse 
        cx={size * 0.45} 
        cy={size * 0.75} 
        rx={size * 0.4} 
        ry={size * 0.15} 
        fill="rgba(0,0,0,0.3)"
      />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Main structure with columns */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.5} height={size * 0.35} 
              fill={`url(#colonialGrad-${uniqueId})`} />
        
        {/* Columns */}
        {[0.25, 0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.015} 
                y={size * 0.4} 
                width={size * 0.03} height={size * 0.35} 
                fill="#f0e8e0" stroke="#d0c8c0" strokeWidth="0.3" />
        ))}
        
        {/* Roof */}
        <polygon points={`${size * 0.18},${size * 0.4} ${size * 0.45},${size * 0.28} ${size * 0.72},${size * 0.4}`}
                 fill={details.roof} stroke={details.accent} strokeWidth="0.5" />
        
        {/* Upper balcony for tropical variants */}
        {isTropical && (
          <rect x={size * 0.25} y={size * 0.52} 
                width={size * 0.4} height={size * 0.02} 
                fill="#d0c0b0" />
        )}
        
        {/* Windows with shutters */}
        {[0.3, 0.45, 0.6].map((xPos, i) => (
          <g key={i}>
            <rect x={size * xPos - size * 0.03} 
                  y={size * 0.58} 
                  width={size * 0.06} height={size * 0.08} 
                  fill="#4a7a9a" opacity="0.7" />
            {isTropical && (
              <>
                <rect x={size * xPos - size * 0.035} 
                      y={size * 0.58} 
                      width={size * 0.005} height={size * 0.08} 
                      fill="#6a5a4a" />
                <rect x={size * xPos + size * 0.03} 
                      y={size * 0.58} 
                      width={size * 0.005} height={size * 0.08} 
                      fill="#6a5a4a" />
              </>
            )}
          </g>
        ))}
        
        {/* Main entrance */}
        <rect x={size * 0.42} y={size * 0.65} 
              width={size * 0.06} height={size * 0.1} 
              fill="#4a3a2a" />
      </g>
      
      {/* Flag with animation */}
      <g transform={`translate(${size * 0.3}, ${size * 0.28})`}>
        <rect x={0} y={0} width={size * 0.02} height={size * 0.15} 
              fill="#5a4a3a" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-3;0;3;0"
            dur="4s"
            repeatCount="indefinite"
          />
          {details.flagColors[0] === 'union-jack' ? (
            // Union Jack for British
            <g>
              <rect x={size * 0.02} y={0} 
                    width={size * 0.1} height={size * 0.06} 
                    fill="#002868" />
              <rect x={size * 0.02} y={size * 0.025} 
                    width={size * 0.1} height={size * 0.01} 
                    fill="#ffffff" />
              <rect x={size * 0.065} y={0} 
                    width={size * 0.01} height={size * 0.06} 
                    fill="#ffffff" />
              <path d={`M ${size * 0.02} 0 L ${size * 0.12} ${size * 0.06}`}
                    stroke="#cc0000" strokeWidth="0.5" />
              <path d={`M ${size * 0.02} ${size * 0.06} L ${size * 0.12} 0`}
                    stroke="#cc0000" strokeWidth="0.5" />
            </g>
          ) : details.flagColors.length === 3 ? (
            // Tricolor flags
            <g>
              {details.flagColors.map((color, i) => (
                <rect key={i}
                      x={variant === 'french' ? size * 0.02 + i * size * 0.033 : size * 0.02}
                      y={variant === 'french' ? 0 : i * size * 0.02}
                      width={variant === 'french' ? size * 0.033 : size * 0.1}
                      height={variant === 'french' ? size * 0.06 : size * 0.02}
                      fill={color} />
              ))}
            </g>
          ) : (
            // Two-color flags (Spanish, Portuguese)
            <g>
              <rect x={size * 0.02} y={0}
                    width={size * 0.1} height={size * 0.03}
                    fill={details.flagColors[0]} />
              <rect x={size * 0.02} y={size * 0.03}
                    width={size * 0.1} height={size * 0.03}
                    fill={details.flagColors[1]} />
              {variant === 'spanish' && (
                // Spanish coat of arms placeholder
                <circle cx={size * 0.07} cy={size * 0.03} 
                        r={size * 0.01} 
                        fill="#c60b1e" opacity="0.5" />
              )}
            </g>
          )}
        </g>
      </g>
      
      {/* Secondary palm tree for tropical effect */}
      {isTropical && (
        <g opacity="0.4">
          <rect x={size * 0.12} y={size * 0.5} 
                width={size * 0.015} height={size * 0.25} 
                fill="#7a5a3a" />
          <g transform={`translate(${size * 0.128}, ${size * 0.48})`}>
            {[45, 135, 225, 315].map((angle, i) => (
              <path key={i}
                    d={`M 0,0 Q ${Math.cos(angle * Math.PI / 180) * size * 0.06},${-size * 0.015} 
                        ${Math.cos(angle * Math.PI / 180) * size * 0.08},${Math.sin(angle * Math.PI / 180) * size * 0.06}`}
                    fill="#3a6a3a" stroke="#2a4a2a" strokeWidth="0.2" />
            ))}
          </g>
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(ColonialOfficeSymbol);