/**
 * components/symbols/government/RomanForumSymbol.tsx - Roman Forum and civic center building
 * Enhanced with classical architecture and SPQR inscription - improved 3D perspective
 */
import React from 'react';
import { Tile } from '../../../types';

interface RomanForumSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'roman' | 'persian' | 'greek';
}

const RomanForumSymbol: React.FC<RomanForumSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'roman' 
}) => {
  const uniqueId = `forum-${x}-${y}-${seed}`;
  const depth = size * 0.25; // Added depth for 3D perspective
  
  // Get variant-specific colors with enhanced contrast
  const getColors = () => {
    switch (variant) {
      case 'persian':
        return {
          marble: '#E5C494', // Lighter sandstone
          accent: '#9A6F0B', // Darker gold
          shadow: '#7A5A3B', // Dark shadow
          inscription: '#4A2A0A', // Very dark brown
          standard: '#CC4422',
          highlight: '#F5D4A4' // Light highlight
        };
      case 'greek':
        return {
          marble: '#FAFAF5', // Brighter white marble
          accent: '#B8753F', // Darker tan
          shadow: '#8A5A2F', // Dark shadow
          inscription: '#4A3A2A', // Dark gray-brown
          standard: '#2266AA',
          highlight: '#FFFFFF' // Pure white highlight
        };
      default: // roman
        return {
          marble: '#FAFAF8', // Bright white marble
          accent: '#C0C0B8', // Medium gray
          shadow: '#8A8A80', // Dark gray shadow
          inscription: '#5A5A5A', // Dark gray
          standard: '#DD2222',
          highlight: '#FFFFFF' // Pure white highlight
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`marbleGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="20%" stopColor={colors.marble} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <linearGradient id={`columnGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="30%" stopColor={colors.marble} />
          <stop offset="70%" stopColor={colors.marble} />
          <stop offset="100%" stopColor={colors.shadow} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
          <feOffset dx="3" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <pattern id={`stepsPattern-${uniqueId}`} x="0" y="0" width="100%" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="100%" y2="0" stroke={colors.shadow} strokeWidth="0.3" opacity="0.5"/>
        </pattern>
      </defs>
      
      {/* Enhanced shadow with gradient */}
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.78} 
        rx={size * 0.5} 
        ry={size * 0.2} 
        fill="rgba(0,0,0,0.4)"
        filter="blur(4px)"
      />
      
      {/* Main forum structure with enhanced 3D perspective */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Base platform with 3D depth */}
        <g>
          {/* Platform top surface */}
          <polygon points={`${size * 0.15},${size * 0.65} 
                           ${size * 0.15 + depth * 0.7},${size * 0.65 - depth * 0.35}
                           ${size * 0.85 + depth * 0.7},${size * 0.65 - depth * 0.35}
                           ${size * 0.85},${size * 0.65}`}
                   fill={colors.accent} 
                   stroke={colors.shadow} 
                   strokeWidth="0.5" />
          
          {/* Platform front face */}
          <rect x={size * 0.15} y={size * 0.65} 
                width={size * 0.7} height={size * 0.08} 
                fill={`url(#marbleGrad-${uniqueId})`} 
                stroke={colors.shadow} 
                strokeWidth="0.8" />
          
          {/* Platform right side */}
          <path d={`M ${size * 0.85} ${size * 0.65}
                    L ${size * 0.85 + depth * 0.7} ${size * 0.65 - depth * 0.35}
                    L ${size * 0.85 + depth * 0.7} ${size * 0.73 - depth * 0.35}
                    L ${size * 0.85} ${size * 0.73} Z`}
                fill={colors.shadow} 
                opacity="0.6" />
        </g>
        
        {/* Steps with 3D effect and texture */}
        <g>
          <rect x={size * 0.2} y={size * 0.68} 
                width={size * 0.6} height={size * 0.02} 
                fill={colors.marble} 
                stroke={colors.shadow} 
                strokeWidth="0.3" />
          <rect x={size * 0.25} y={size * 0.7} 
                width={size * 0.5} height={size * 0.02} 
                fill={colors.marble} 
                stroke={colors.shadow} 
                strokeWidth="0.3" />
          <rect x={size * 0.3} y={size * 0.72} 
                width={size * 0.4} height={size * 0.01} 
                fill={colors.accent} 
                stroke={colors.shadow} 
                strokeWidth="0.2" />
        </g>
        
        {/* Columns with cylindrical 3D effect and proper shading */}
        {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
          <g key={i}>
            {/* Column shaft with gradient for cylindrical effect */}
            <rect x={size * xPos - size * 0.025} 
                  y={size * 0.35} 
                  width={size * 0.05} height={size * 0.3} 
                  fill={`url(#columnGrad-${uniqueId})`} 
                  stroke={colors.shadow} 
                  strokeWidth="0.5" />
            
            {/* Column fluting lines */}
            {[-0.015, -0.005, 0.005, 0.015].map((offset, j) => (
              <line key={`flute-${j}`}
                    x1={size * xPos + size * offset} 
                    y1={size * 0.36}
                    x2={size * xPos + size * offset} 
                    y2={size * 0.64}
                    stroke={colors.shadow} 
                    strokeWidth="0.2" 
                    opacity="0.3" />
            ))}
            
            {/* Column capital - Ionic/Corinthian style */}
            <g>
              <rect x={size * xPos - size * 0.03} 
                    y={size * 0.33} 
                    width={size * 0.06} height={size * 0.02} 
                    fill={colors.marble} 
                    stroke={colors.shadow} 
                    strokeWidth="0.4" />
              <ellipse cx={size * xPos} cy={size * 0.34} 
                       rx={size * 0.03} ry={size * 0.01} 
                       fill={colors.highlight} 
                       opacity="0.8" />
            </g>
            
            {/* Column base with detail */}
            <g>
              <rect x={size * xPos - size * 0.03} 
                    y={size * 0.64} 
                    width={size * 0.06} height={size * 0.01} 
                    fill={colors.accent} />
              <rect x={size * xPos - size * 0.025} 
                    y={size * 0.65} 
                    width={size * 0.05} height={size * 0.01} 
                    fill={colors.shadow} 
                    opacity="0.5" />
            </g>
          </g>
        ))}
        
        {/* Pediment with 3D depth */}
        <g>
          {/* Front triangular pediment */}
          <polygon points={`${size * 0.2},${size * 0.33} ${size * 0.5},${size * 0.23} ${size * 0.8},${size * 0.33}`}
                   fill={`url(#marbleGrad-${uniqueId})`} 
                   stroke={colors.shadow} 
                   strokeWidth="1" />
          
          {/* Pediment depth - right side */}
          <polygon points={`${size * 0.8},${size * 0.33} 
                           ${size * 0.5},${size * 0.23}
                           ${size * 0.5 + depth * 0.6},${size * 0.23 - depth * 0.3}
                           ${size * 0.8 + depth * 0.6},${size * 0.33 - depth * 0.3}`}
                   fill={colors.shadow} 
                   opacity="0.4" />
          
          {/* Pediment relief decoration */}
          <circle cx={size * 0.5} cy={size * 0.28} 
                  r={size * 0.02} 
                  fill={colors.accent} 
                  opacity="0.5" />
        </g>
        
        {/* Inscription area with depth */}
        <g>
          <rect x={size * 0.3} y={size * 0.27} 
                width={size * 0.4} height={size * 0.05} 
                fill={colors.marble} 
                stroke={colors.shadow} 
                strokeWidth="0.5" />
          <text x={size * 0.5} y={size * 0.3} 
                fontSize={size * 0.03} 
                fill={colors.inscription} 
                textAnchor="middle" 
                fontWeight="bold"
                fontFamily="serif">
            {variant === 'persian' ? 'شاه' : variant === 'greek' ? 'ΒΟΥΛΗ' : 'SPQR'}
          </text>
        </g>
        
        {/* Central entrance with depth */}
        <g>
          <rect x={size * 0.47} y={size * 0.55} 
                width={size * 0.06} height={size * 0.1} 
                fill="#0a0a0a" />
          <path d={`M ${size * 0.53} ${size * 0.55}
                    L ${size * 0.53 + 2} ${size * 0.55 - 1}
                    L ${size * 0.53 + 2} ${size * 0.65 - 1}
                    L ${size * 0.53} ${size * 0.65} Z`}
                fill="#000000" 
                opacity="0.5" />
        </g>
        
        {/* Side entrances with arched tops */}
        {[0.35, 0.65].map((xPos, i) => (
          <g key={`entrance-${i}`}>
            <rect x={size * xPos - size * 0.025} 
                  y={size * 0.58} 
                  width={size * 0.05} height={size * 0.07} 
                  fill="#1a1a1a" />
            <path d={`M ${size * xPos - size * 0.025} ${size * 0.58}
                      Q ${size * xPos} ${size * 0.56}
                      ${size * xPos + size * 0.025} ${size * 0.58}`}
                  fill={colors.accent} 
                  stroke={colors.shadow} 
                  strokeWidth="0.3" />
          </g>
        ))}
      </g>
      
      {/* Roman/Persian/Greek standard */}
      <g transform={`translate(${size * 0.85}, ${size * 0.5})`}>
        <rect x={0} y={0} width={size * 0.015} height={size * 0.25} 
              fill="#8a6a4a" />
        <rect x={size * 0.015} y={0} 
              width={size * 0.06} height={size * 0.08} 
              fill={colors.standard} />
        {variant === 'roman' && (
          // Roman eagle
          <circle cx={size * 0.045} cy={size * 0.04} 
                  r={size * 0.02} fill="#ffcc00" />
        )}
        {variant === 'persian' && (
          // Persian winged disc
          <ellipse cx={size * 0.045} cy={size * 0.04} 
                   rx={size * 0.025} ry={size * 0.015} 
                   fill="#ffcc00" />
        )}
        {variant === 'greek' && (
          // Greek laurel
          <g>
            <circle cx={size * 0.045} cy={size * 0.04} 
                    r={size * 0.018} fill="none" 
                    stroke="#4a7a4a" strokeWidth="1" />
          </g>
        )}
      </g>
      
      {/* Side buildings for larger forums */}
      {variant === 'roman' && (
        <g opacity="0.8">
          {/* Left basilica */}
          <rect x={size * 0.08} y={size * 0.5} 
                width={size * 0.06} height={size * 0.15} 
                fill={colors.accent} stroke="#b8b8b0" strokeWidth="0.5" />
          {/* Right basilica */}
          <rect x={size * 0.86} y={size * 0.5} 
                width={size * 0.06} height={size * 0.15} 
                fill={colors.accent} stroke="#b8b8b0" strokeWidth="0.5" />
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(RomanForumSymbol);