/**
 * CabinetSymbol.tsx - Beautiful SNES RPG-style storage cabinet
 * Consistent 3/4 perspective with 45-degree shadows
 * Rich cultural variations with pixel art aesthetic
 */
import React from 'react';

interface CabinetSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  variant?: 'storage' | 'display' | 'medicine' | 'scroll';
  opacity?: number;
}

const CabinetSymbol: React.FC<CabinetSymbolProps> = ({ 
  x, 
  y, 
  size = 32,
  culturalZone = 'EUROPEAN',
  era = 1500,
  variant = 'storage',
  opacity = 1.0 
}) => {
  // Beautiful pixel size for Stardew Valley/FF6 style detail
  const pixelSize = size / 32;
  
  // Helper functions for color manipulation
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = ((num >> 16) + amt) < 255 ? ((num >> 16) + amt) : 255;
    const G = (((num >> 8) & 0x00FF) + amt) < 255 ? (((num >> 8) & 0x00FF) + amt) : 255;
    const B = ((num & 0x0000FF) + amt) < 255 ? ((num & 0x0000FF) + amt) : 255;
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };
  
  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = ((num >> 16) - amt) > 0 ? ((num >> 16) - amt) : 0;
    const G = (((num >> 8) & 0x00FF) - amt) > 0 ? (((num >> 8) & 0x00FF) - amt) : 0;
    const B = ((num & 0x0000FF) - amt) > 0 ? ((num & 0x0000FF) - amt) : 0;
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };
  
  // Rich material palette based on culture
  const getMaterials = () => {
    const zone = culturalZone?.toUpperCase();
    
    let baseWood = '#6B4423';
    let accent = '#CD7F32';
    
    if (zone === 'EAST_ASIAN') {
      baseWood = '#4A2819'; // Dark lacquered wood
      accent = '#DC143C'; // Red lacquer accent
    } else if (zone === 'MENA') {
      baseWood = '#5C3A24'; // Cedar wood
      accent = '#FFD700'; // Gold accent
    } else if (zone === 'SOUTH_ASIAN') {
      baseWood = '#8B4513'; // Teak wood
      accent = '#FF6347'; // Coral accent
    } else if (zone === 'SUB_SAHARAN_AFRICAN') {
      baseWood = '#3E2818'; // Ebony wood
      accent = '#DAA520'; // Brass accent
    }
    
    return {
      wood: baseWood,
      woodLight: lightenColor(baseWood, 20),
      woodDark: darkenColor(baseWood, 20),
      metal: '#8A8A8A',
      metalLight: '#B0B0B0',
      metalDark: '#5A5A5A',
      accent: accent,
      glass: '#E6F3FF',
      shadow: '#000000'
    };
  };

  const materials = getMaterials();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g opacity={opacity}>
        {/* 45-degree shadow underneath */}
        <ellipse 
          cx={pixelSize * 16} 
          cy={pixelSize * 28} 
          rx={pixelSize * 10} 
          ry={pixelSize * 3} 
          fill={materials.shadow} 
          opacity={0.3}
        />
        
        {/* Main cabinet body with 3/4 perspective */}
        <g>
          {/* Front face */}
          <rect 
            x={pixelSize * 8} 
            y={pixelSize * 6} 
            width={pixelSize * 16} 
            height={pixelSize * 20} 
            fill={materials.wood}
          />
          
          {/* Top surface (3/4 perspective) */}
          <polygon
            points={`${pixelSize * 8},${pixelSize * 6} 
                    ${pixelSize * 24},${pixelSize * 6}
                    ${pixelSize * 26},${pixelSize * 4}
                    ${pixelSize * 10},${pixelSize * 4}`}
            fill={materials.woodLight}
          />
          
          {/* Right side (3D depth) */}
          <polygon
            points={`${pixelSize * 24},${pixelSize * 6} 
                    ${pixelSize * 26},${pixelSize * 4}
                    ${pixelSize * 26},${pixelSize * 24}
                    ${pixelSize * 24},${pixelSize * 26}`}
            fill={materials.woodDark}
          />
          
          {/* Left edge highlight */}
          <rect 
            x={pixelSize * 8} 
            y={pixelSize * 6} 
            width={pixelSize * 0.5} 
            height={pixelSize * 20} 
            fill={materials.woodLight}
            opacity={0.5}
          />
        </g>
        
        {/* Doors/Drawers based on variant */}
        {variant === 'storage' && (
          <g>
            {/* Two doors with handles */}
            {/* Left door */}
            <rect 
              x={pixelSize * 9} 
              y={pixelSize * 8} 
              width={pixelSize * 7} 
              height={pixelSize * 16} 
              fill={materials.wood}
              stroke={materials.woodDark}
              strokeWidth={pixelSize * 0.2}
            />
            <rect 
              x={pixelSize * 9.5} 
              y={pixelSize * 8.5} 
              width={pixelSize * 6} 
              height={pixelSize * 15} 
              fill={materials.woodLight}
              opacity={0.2}
            />
            {/* Left handle */}
            <circle 
              cx={pixelSize * 14.5} 
              cy={pixelSize * 16} 
              r={pixelSize * 0.6} 
              fill={materials.metal}
            />
            
            {/* Right door */}
            <rect 
              x={pixelSize * 16.5} 
              y={pixelSize * 8} 
              width={pixelSize * 7} 
              height={pixelSize * 16} 
              fill={materials.wood}
              stroke={materials.woodDark}
              strokeWidth={pixelSize * 0.2}
            />
            <rect 
              x={pixelSize * 17} 
              y={pixelSize * 8.5} 
              width={pixelSize * 6} 
              height={pixelSize * 15} 
              fill={materials.woodLight}
              opacity={0.2}
            />
            {/* Right handle */}
            <circle 
              cx={pixelSize * 17.5} 
              cy={pixelSize * 16} 
              r={pixelSize * 0.6} 
              fill={materials.metal}
            />
            
            {/* Cultural decorations */}
            {culturalZone === 'EAST_ASIAN' && (
              <g>
                {/* Decorative panel */}
                <rect 
                  x={pixelSize * 11} 
                  y={pixelSize * 12} 
                  width={pixelSize * 10} 
                  height={pixelSize * 4} 
                  fill={materials.accent}
                  opacity={0.3}
                />
              </g>
            )}
            
            {culturalZone === 'MENA' && (
              <g>
                {/* Geometric pattern */}
                <polygon
                  points={`${pixelSize * 16},${pixelSize * 12} 
                          ${pixelSize * 18},${pixelSize * 14}
                          ${pixelSize * 16},${pixelSize * 16}
                          ${pixelSize * 14},${pixelSize * 14}`}
                  fill={materials.accent}
                  opacity={0.4}
                />
              </g>
            )}
          </g>
        )}
        
        {variant === 'display' && (
          <g>
            {/* Glass doors for display */}
            {/* Left glass door */}
            <rect 
              x={pixelSize * 9} 
              y={pixelSize * 8} 
              width={pixelSize * 7} 
              height={pixelSize * 16} 
              fill={materials.glass}
              opacity={0.3}
              stroke={materials.wood}
              strokeWidth={pixelSize * 0.3}
            />
            {/* Right glass door */}
            <rect 
              x={pixelSize * 16.5} 
              y={pixelSize * 8} 
              width={pixelSize * 7} 
              height={pixelSize * 16} 
              fill={materials.glass}
              opacity={0.3}
              stroke={materials.wood}
              strokeWidth={pixelSize * 0.3}
            />
            
            {/* Shelves visible through glass */}
            <line 
              x1={pixelSize * 10} y1={pixelSize * 13}
              x2={pixelSize * 22} y2={pixelSize * 13}
              stroke={materials.woodDark}
              strokeWidth={pixelSize * 0.5}
            />
            <line 
              x1={pixelSize * 10} y1={pixelSize * 18}
              x2={pixelSize * 22} y2={pixelSize * 18}
              stroke={materials.woodDark}
              strokeWidth={pixelSize * 0.5}
            />
            
            {/* Display items */}
            {/* Vase */}
            <ellipse 
              cx={pixelSize * 12} 
              cy={pixelSize * 11} 
              rx={pixelSize * 1.5} 
              ry={pixelSize * 2} 
              fill={materials.accent}
              opacity={0.7}
            />
            {/* Artifact */}
            <rect 
              x={pixelSize * 18} 
              y={pixelSize * 10} 
              width={pixelSize * 2} 
              height={pixelSize * 2.5} 
              fill="#FFD700"
              opacity={0.6}
            />
          </g>
        )}
        
        {variant === 'medicine' && (
          <g>
            {/* Multiple small drawers */}
            {[0, 1, 2, 3].map((row) => 
              [0, 1].map((col) => (
                <g key={`${row}-${col}`}>
                  <rect 
                    x={pixelSize * (9.5 + col * 7)} 
                    y={pixelSize * (8 + row * 4)} 
                    width={pixelSize * 6} 
                    height={pixelSize * 3.5} 
                    fill={materials.wood}
                    stroke={materials.woodDark}
                    strokeWidth={pixelSize * 0.2}
                  />
                  {/* Drawer pull */}
                  <rect 
                    x={pixelSize * (11.5 + col * 7)} 
                    y={pixelSize * (9.5 + row * 4)} 
                    width={pixelSize * 2} 
                    height={pixelSize * 0.4} 
                    fill={materials.metal}
                  />
                  {/* Label area */}
                  <rect 
                    x={pixelSize * (10.5 + col * 7)} 
                    y={pixelSize * (8.5 + row * 4)} 
                    width={pixelSize * 4} 
                    height={pixelSize * 1} 
                    fill="#F5F5DC"
                    opacity={0.7}
                  />
                </g>
              ))
            )}
          </g>
        )}
        
        {variant === 'scroll' && (
          <g>
            {/* Open shelving for scrolls */}
            {/* Horizontal shelves */}
            {[0, 1, 2].map((shelf) => (
              <g key={shelf}>
                <rect 
                  x={pixelSize * 9} 
                  y={pixelSize * (9 + shelf * 5)} 
                  width={pixelSize * 14} 
                  height={pixelSize * 1} 
                  fill={materials.wood}
                />
                {/* Scrolls on shelf */}
                {[0, 1, 2, 3].map((scroll) => (
                  <circle 
                    key={scroll}
                    cx={pixelSize * (11 + scroll * 3)} 
                    cy={pixelSize * (8.5 + shelf * 5)} 
                    r={pixelSize * 0.8} 
                    fill="#D4C4A0"
                    stroke="#8B7355"
                    strokeWidth={pixelSize * 0.1}
                  />
                ))}
              </g>
            ))}
            
            {/* Vertical dividers */}
            <rect 
              x={pixelSize * 16} 
              y={pixelSize * 8} 
              width={pixelSize * 0.5} 
              height={pixelSize * 16} 
              fill={materials.woodDark}
            />
          </g>
        )}
        
        {/* Base/legs */}
        <g>
          {/* Left leg */}
          <rect 
            x={pixelSize * 9} 
            y={pixelSize * 26} 
            width={pixelSize * 2} 
            height={pixelSize * 2} 
            fill={materials.woodDark}
          />
          {/* Right leg */}
          <rect 
            x={pixelSize * 21} 
            y={pixelSize * 26} 
            width={pixelSize * 2} 
            height={pixelSize * 2} 
            fill={materials.woodDark}
          />
        </g>
      </g>
    </g>
  );
};

export default CabinetSymbol;