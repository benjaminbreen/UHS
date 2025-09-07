/**
 * WeaponRackSymbol.tsx - Beautiful SNES RPG-style weapon storage
 * Consistent 3/4 perspective with 45-degree shadows
 * Rich detail while maintaining pixel art aesthetic
 */
import React from 'react';

interface WeaponRackSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const WeaponRackSymbol: React.FC<WeaponRackSymbolProps> = ({ 
  x, 
  y, 
  size = 32,
  culturalZone = 'EUROPEAN',
  era = 1500,
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
  
  // Rich material palette with consistent lighting
  const getMaterials = () => {
    const baseWood = culturalZone === 'EAST_ASIAN' ? '#4a2c1c' : 
                     culturalZone === 'MENA' ? '#5c3a24' : '#6B4423';
    return {
      wood: baseWood,
      woodLight: lightenColor(baseWood, 20),
      woodDark: darkenColor(baseWood, 20),
      metal: '#8A8A8A',
      metalLight: '#B0B0B0',
      metalDark: '#5A5A5A',
      bronze: '#CD7F32',
      bronzeLight: '#E4A853',
      bronzeDark: '#A66528',
      leather: '#8B4513',
      rope: '#D2691E',
      shadow: '#000000'
    };
  };

  const materials = getMaterials();
  
  // Beautiful 3/4 perspective rack frame
  const renderRackFrame = () => (
    <g>
      {/* 45-degree shadow underneath */}
      <ellipse 
        cx={pixelSize * 16} 
        cy={pixelSize * 28} 
        rx={pixelSize * 12} 
        ry={pixelSize * 3} 
        fill={materials.shadow} 
        opacity={0.3}
      />
      
      {/* Back support beam (3/4 perspective) */}
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 4} 
        width={pixelSize * 24} 
        height={pixelSize * 2} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 4} 
        width={pixelSize * 24} 
        height={pixelSize * 0.5} 
        fill={materials.woodLight}
      />
      
      {/* Left vertical support with 3D depth */}
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 4} 
        width={pixelSize * 2} 
        height={pixelSize * 20} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 4} 
        width={pixelSize * 0.5} 
        height={pixelSize * 20} 
        fill={materials.woodLight}
      />
      
      {/* Right vertical support with 3D depth */}
      <rect 
        x={pixelSize * 26} 
        y={pixelSize * 4} 
        width={pixelSize * 2} 
        height={pixelSize * 20} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 27.5} 
        y={pixelSize * 4} 
        width={pixelSize * 0.5} 
        height={pixelSize * 20} 
        fill={materials.woodDark}
      />
      
      {/* Middle horizontal support */}
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 12} 
        width={pixelSize * 24} 
        height={pixelSize * 1.5} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 4} 
        y={pixelSize * 12} 
        width={pixelSize * 24} 
        height={pixelSize * 0.4} 
        fill={materials.woodLight}
      />
    </g>
  );
  
  // Render weapons based on era and culture
  const renderWeapons = () => {
    const zone = culturalZone?.toUpperCase();
    
    // Medieval European weapons (default)
    if ((zone === 'EUROPEAN' && era >= 500 && era < 1500) || 
        (era >= 500 && era < 1500 && !zone)) {
      return (
        <g>
          {/* Longsword - beautiful gradient blade */}
          <g transform={`translate(${pixelSize * 8}, ${pixelSize * 6})`}>
            <rect x={0} y={0} width={pixelSize * 1.5} height={pixelSize * 14} fill={materials.metalLight} />
            <rect x={pixelSize * 0.25} y={0} width={pixelSize * 0.5} height={pixelSize * 14} fill={materials.metal} />
            <rect x={pixelSize * 1} y={0} width={pixelSize * 0.5} height={pixelSize * 14} fill={materials.metalDark} />
            {/* Crossguard */}
            <rect x={-pixelSize} y={pixelSize * 11} width={pixelSize * 3.5} height={pixelSize * 0.8} fill={materials.bronze} />
            {/* Pommel */}
            <circle cx={pixelSize * 0.75} cy={pixelSize * 13} r={pixelSize * 0.8} fill={materials.bronze} />
          </g>
          
          {/* Battle axe with detailed head */}
          <g transform={`translate(${pixelSize * 14}, ${pixelSize * 6})`}>
            <rect x={0} y={pixelSize * 2} width={pixelSize * 1.2} height={pixelSize * 12} fill={materials.woodDark} />
            <rect x={0} y={pixelSize * 2} width={pixelSize * 0.3} height={pixelSize * 12} fill={materials.woodLight} />
            {/* Axe head */}
            <path d={`M ${-pixelSize} ${pixelSize * 2} 
                     L ${pixelSize * 2} ${pixelSize * 2}
                     L ${pixelSize * 2.5} ${pixelSize * 3.5}
                     L ${pixelSize * 2} ${pixelSize * 5}
                     L ${-pixelSize} ${pixelSize * 5}
                     Z`} 
                  fill={materials.metal} />
            <path d={`M ${-pixelSize} ${pixelSize * 2} 
                     L ${pixelSize * 2} ${pixelSize * 2}
                     L ${pixelSize * 2} ${pixelSize * 2.5}
                     L ${-pixelSize} ${pixelSize * 2.5}
                     Z`} 
                  fill={materials.metalLight} />
          </g>
          
          {/* Spear with ornate tip */}
          <g transform={`translate(${pixelSize * 20}, ${pixelSize * 4})`}>
            <rect x={0} y={pixelSize * 3} width={pixelSize} height={pixelSize * 16} fill={materials.woodDark} />
            <rect x={0} y={pixelSize * 3} width={pixelSize * 0.3} height={pixelSize * 16} fill={materials.wood} />
            {/* Spearhead */}
            <polygon points={`${pixelSize * 0.5},${0} 
                            ${0},${pixelSize * 3} 
                            ${pixelSize},${pixelSize * 3}`} 
                    fill={materials.metal} />
            <polygon points={`${pixelSize * 0.5},${0} 
                            ${pixelSize * 0.5},${pixelSize * 2.5} 
                            ${pixelSize},${pixelSize * 3}`} 
                    fill={materials.metalDark} />
          </g>
        </g>
      );
    }
    
    // Asian weapons
    if (zone === 'EAST_ASIAN') {
      return (
        <g>
          {/* Katana with curved blade */}
          <g transform={`translate(${pixelSize * 8}, ${pixelSize * 6})`}>
            <path d={`M ${0} ${0} 
                     Q ${pixelSize * 0.5} ${pixelSize * 7}, ${pixelSize * 0.3} ${pixelSize * 14}`} 
                  stroke={materials.metalLight} 
                  strokeWidth={pixelSize * 1.2} 
                  fill="none" />
            <path d={`M ${pixelSize * 0.2} ${0} 
                     Q ${pixelSize * 0.7} ${pixelSize * 7}, ${pixelSize * 0.5} ${pixelSize * 14}`} 
                  stroke={materials.metal} 
                  strokeWidth={pixelSize * 0.4} 
                  fill="none" />
            {/* Tsuba (guard) */}
            <circle cx={pixelSize * 0.3} cy={pixelSize * 12} r={pixelSize * 1.5} fill={materials.bronzeDark} />
            <circle cx={pixelSize * 0.3} cy={pixelSize * 12} r={pixelSize * 0.8} fill="none" stroke={materials.bronze} strokeWidth={pixelSize * 0.2} />
            {/* Handle wrap */}
            <rect x={-pixelSize * 0.2} y={pixelSize * 12} width={pixelSize} height={pixelSize * 2.5} fill={materials.leather} />
          </g>
          
          {/* Naginata (pole weapon) */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 4})`}>
            <rect x={0} y={pixelSize * 4} width={pixelSize} height={pixelSize * 16} fill={materials.woodDark} />
            <rect x={0} y={pixelSize * 4} width={pixelSize * 0.3} height={pixelSize * 16} fill={materials.wood} />
            {/* Curved blade */}
            <path d={`M ${pixelSize * 0.5} ${0} 
                     Q ${pixelSize * 1.5} ${pixelSize * 2}, ${pixelSize * 2} ${pixelSize * 4}`} 
                  stroke={materials.metal} 
                  strokeWidth={pixelSize * 0.8} 
                  fill="none" />
          </g>
          
          {/* Bow with elegant curve */}
          <g transform={`translate(${pixelSize * 22}, ${pixelSize * 5})`}>
            <path d={`M ${0} ${0} 
                     Q ${pixelSize * 2} ${pixelSize * 7}, ${0} ${pixelSize * 14}`} 
                  stroke={materials.woodDark} 
                  strokeWidth={pixelSize * 1.2} 
                  fill="none" />
            <line x1={0} y1={0} x2={0} y2={pixelSize * 14} 
                  stroke={materials.rope} 
                  strokeWidth={pixelSize * 0.3} />
          </g>
        </g>
      );
    }
    
    // Middle Eastern weapons
    if (zone === 'MENA') {
      return (
        <g>
          {/* Scimitar with curved blade */}
          <g transform={`translate(${pixelSize * 8}, ${pixelSize * 6})`}>
            <path d={`M ${0} ${0} 
                     Q ${pixelSize * 1.5} ${pixelSize * 5}, ${pixelSize * 1} ${pixelSize * 12}`} 
                  stroke={materials.metalLight} 
                  strokeWidth={pixelSize * 1.5} 
                  fill="none" />
            <path d={`M ${pixelSize * 0.2} ${0} 
                     Q ${pixelSize * 1.7} ${pixelSize * 5}, ${pixelSize * 1.2} ${pixelSize * 12}`} 
                  stroke={materials.metalDark} 
                  strokeWidth={pixelSize * 0.5} 
                  fill="none" />
            {/* Ornate guard */}
            <ellipse cx={pixelSize * 1} cy={pixelSize * 11} rx={pixelSize * 1.5} ry={pixelSize * 0.8} fill={materials.bronze} />
            {/* Jeweled pommel */}
            <circle cx={pixelSize * 1} cy={pixelSize * 13} r={pixelSize * 0.6} fill="#FF6B6B" />
          </g>
          
          {/* Jambiya (dagger) */}
          <g transform={`translate(${pixelSize * 15}, ${pixelSize * 10})`}>
            <path d={`M ${0} ${0} 
                     Q ${pixelSize * 0.5} ${pixelSize * 2}, ${0} ${pixelSize * 4}`} 
                  stroke={materials.metal} 
                  strokeWidth={pixelSize} 
                  fill="none" />
            {/* Ornate sheath */}
            <rect x={-pixelSize * 0.5} y={pixelSize * 3.5} width={pixelSize} height={pixelSize * 3} fill={materials.bronze} />
            <rect x={-pixelSize * 0.3} y={pixelSize * 4} width={pixelSize * 0.6} height={pixelSize * 0.5} fill="#FF6B6B" />
          </g>
          
          {/* Composite bow */}
          <g transform={`translate(${pixelSize * 21}, ${pixelSize * 6})`}>
            <path d={`M ${0} ${pixelSize * 2} 
                     Q ${pixelSize * 3} ${0}, ${pixelSize * 3} ${pixelSize * 2}
                     L ${pixelSize * 3} ${pixelSize * 10}
                     Q ${pixelSize * 3} ${pixelSize * 12}, ${0} ${pixelSize * 10}`} 
                  stroke={materials.woodDark} 
                  strokeWidth={pixelSize} 
                  fill="none" />
            <line x1={0} y1={pixelSize * 2} x2={0} y2={pixelSize * 10} 
                  stroke={materials.rope} 
                  strokeWidth={pixelSize * 0.3} />
          </g>
        </g>
      );
    }
    
    // Default/Modern: Simple display
    return (
      <g>
        {/* Modern rifle */}
        <g transform={`translate(${pixelSize * 7}, ${pixelSize * 7})`}>
          <rect x={0} y={0} width={pixelSize * 2} height={pixelSize * 12} fill={materials.metalDark} />
          <rect x={0} y={0} width={pixelSize * 0.5} height={pixelSize * 12} fill={materials.metal} />
          <rect x={pixelSize * 0.5} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 2} fill={materials.woodDark} />
        </g>
        
        {/* Pistol */}
        <g transform={`translate(${pixelSize * 14}, ${pixelSize * 10})`}>
          <rect x={0} y={0} width={pixelSize * 4} height={pixelSize * 2} fill={materials.metalDark} />
          <rect x={0} y={0} width={pixelSize * 4} height={pixelSize * 0.5} fill={materials.metal} />
          <rect x={pixelSize} y={pixelSize * 2} width={pixelSize * 1.5} height={pixelSize * 2} fill={materials.metalDark} />
        </g>
        
        {/* Knife */}
        <g transform={`translate(${pixelSize * 22}, ${pixelSize * 9})`}>
          <rect x={0} y={0} width={pixelSize} height={pixelSize * 5} fill={materials.metalLight} />
          <rect x={pixelSize * 0.3} y={0} width={pixelSize * 0.4} height={pixelSize * 5} fill={materials.metal} />
          <rect x={-pixelSize * 0.3} y={pixelSize * 4} width={pixelSize * 1.6} height={pixelSize * 2} fill={materials.leather} />
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g opacity={opacity}>
        {renderRackFrame()}
        {renderWeapons()}
      </g>
    </g>
  );
};

export default WeaponRackSymbol;