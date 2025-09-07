/**
 * ArmorStandSymbol.tsx - Beautiful SNES RPG-style armor display
 * Consistent 3/4 perspective with 45-degree shadows
 * Rich cultural armor variations with pixel art aesthetic
 */
import React from 'react';

interface ArmorStandSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const ArmorStandSymbol: React.FC<ArmorStandSymbolProps> = ({ 
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
    const baseWood = '#6B4423';
    const baseMetal = culturalZone === 'EAST_ASIAN' ? '#4A4A4A' : 
                      culturalZone === 'MENA' ? '#CD7F32' : '#8A8A8A';
    
    return {
      wood: baseWood,
      woodLight: lightenColor(baseWood, 20),
      woodDark: darkenColor(baseWood, 20),
      metal: baseMetal,
      metalLight: lightenColor(baseMetal, 20),
      metalDark: darkenColor(baseMetal, 20),
      leather: '#8B4513',
      leatherLight: '#A0522D',
      cloth: culturalZone === 'EAST_ASIAN' ? '#DC143C' : 
             culturalZone === 'MENA' ? '#4B0082' : '#8B0000',
      gold: '#FFD700',
      shadow: '#000000'
    };
  };

  const materials = getMaterials();
  
  // Beautiful 3/4 perspective stand base
  const renderStandBase = () => (
    <g>
      {/* 45-degree shadow underneath */}
      <ellipse 
        cx={pixelSize * 16} 
        cy={pixelSize * 29} 
        rx={pixelSize * 8} 
        ry={pixelSize * 2} 
        fill={materials.shadow} 
        opacity={0.3}
      />
      
      {/* Central post with 3D depth */}
      <rect 
        x={pixelSize * 15} 
        y={pixelSize * 8} 
        width={pixelSize * 2} 
        height={pixelSize * 18} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 15} 
        y={pixelSize * 8} 
        width={pixelSize * 0.5} 
        height={pixelSize * 18} 
        fill={materials.woodLight}
      />
      
      {/* Base platform (3/4 perspective) */}
      <polygon
        points={`${pixelSize * 12},${pixelSize * 26} 
                ${pixelSize * 20},${pixelSize * 26}
                ${pixelSize * 21},${pixelSize * 27}
                ${pixelSize * 11},${pixelSize * 27}`}
        fill={materials.wood}
      />
      <polygon
        points={`${pixelSize * 12},${pixelSize * 26} 
                ${pixelSize * 20},${pixelSize * 26}
                ${pixelSize * 20},${pixelSize * 26.3}
                ${pixelSize * 12},${pixelSize * 26.3}`}
        fill={materials.woodLight}
      />
      
      {/* Crossbar for shoulders */}
      <rect 
        x={pixelSize * 10} 
        y={pixelSize * 8} 
        width={pixelSize * 12} 
        height={pixelSize * 1.5} 
        fill={materials.wood}
      />
      <rect 
        x={pixelSize * 10} 
        y={pixelSize * 8} 
        width={pixelSize * 12} 
        height={pixelSize * 0.4} 
        fill={materials.woodLight}
      />
    </g>
  );
  
  // Render armor based on culture and era
  const renderArmor = () => {
    const zone = culturalZone?.toUpperCase();
    
    // European medieval/renaissance armor
    if (zone === 'EUROPEAN' && era >= 500 && era < 1700) {
      return (
        <g>
          {/* Helmet with beautiful shading */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 5})`}>
            {/* Main helmet shape */}
            <ellipse cx={0} cy={0} rx={pixelSize * 3} ry={pixelSize * 2.5} fill={materials.metal} />
            <ellipse cx={0} cy={0} rx={pixelSize * 3} ry={pixelSize * 2.5} fill="none" stroke={materials.metalDark} strokeWidth={pixelSize * 0.2} />
            {/* Visor slit */}
            <rect x={-pixelSize * 2} y={-pixelSize * 0.3} width={pixelSize * 4} height={pixelSize * 0.6} fill={materials.metalDark} />
            {/* Top highlight */}
            <ellipse cx={0} cy={-pixelSize * 1.5} rx={pixelSize * 1.5} ry={pixelSize * 0.5} fill={materials.metalLight} opacity={0.7} />
            {/* Plume (if renaissance) */}
            {era >= 1400 && (
              <path d={`M ${0} ${-pixelSize * 2.5} 
                       Q ${pixelSize} ${-pixelSize * 3.5}, ${pixelSize * 0.5} ${-pixelSize * 4.5}`} 
                    stroke="#DC143C" 
                    strokeWidth={pixelSize * 0.8} 
                    fill="none" />
            )}
          </g>
          
          {/* Breastplate with 3/4 perspective */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 12})`}>
            {/* Main chest piece */}
            <polygon
              points={`${-pixelSize * 4},${0} 
                      ${pixelSize * 4},${0}
                      ${pixelSize * 3.5},${pixelSize * 6}
                      ${-pixelSize * 3.5},${pixelSize * 6}`}
              fill={materials.metal}
            />
            {/* Center ridge for depth */}
            <line x1={0} y1={0} x2={0} y2={pixelSize * 6} 
                  stroke={materials.metalLight} 
                  strokeWidth={pixelSize * 0.5} />
            {/* Side highlights */}
            <line x1={-pixelSize * 3.5} y1={pixelSize * 0.5} x2={-pixelSize * 3} y2={pixelSize * 5.5} 
                  stroke={materials.metalLight} 
                  strokeWidth={pixelSize * 0.3} 
                  opacity={0.7} />
            <line x1={pixelSize * 3.5} y1={pixelSize * 0.5} x2={pixelSize * 3} y2={pixelSize * 5.5} 
                  stroke={materials.metalDark} 
                  strokeWidth={pixelSize * 0.3} />
            {/* Decorative emblem */}
            {era >= 1200 && (
              <circle cx={0} cy={pixelSize * 2} r={pixelSize * 1} fill={materials.gold} opacity={0.7} />
            )}
          </g>
          
          {/* Pauldrons (shoulder armor) */}
          <g>
            {/* Left pauldron */}
            <ellipse cx={pixelSize * 10} cy={pixelSize * 9} 
                    rx={pixelSize * 2} ry={pixelSize * 1.5} 
                    fill={materials.metal} />
            <ellipse cx={pixelSize * 10} cy={pixelSize * 9} 
                    rx={pixelSize * 2} ry={pixelSize * 1.5} 
                    fill="none" 
                    stroke={materials.metalDark} 
                    strokeWidth={pixelSize * 0.2} />
            {/* Right pauldron */}
            <ellipse cx={pixelSize * 22} cy={pixelSize * 9} 
                    rx={pixelSize * 2} ry={pixelSize * 1.5} 
                    fill={materials.metal} />
            <ellipse cx={pixelSize * 22} cy={pixelSize * 9} 
                    rx={pixelSize * 2} ry={pixelSize * 1.5} 
                    fill="none" 
                    stroke={materials.metalDark} 
                    strokeWidth={pixelSize * 0.2} />
          </g>
          
          {/* Gauntlets */}
          <g>
            {/* Left gauntlet */}
            <rect x={pixelSize * 8} y={pixelSize * 14} 
                  width={pixelSize * 1.5} height={pixelSize * 3} 
                  fill={materials.metal} />
            <rect x={pixelSize * 8} y={pixelSize * 14} 
                  width={pixelSize * 0.4} height={pixelSize * 3} 
                  fill={materials.metalLight} />
            {/* Right gauntlet */}
            <rect x={pixelSize * 22.5} y={pixelSize * 14} 
                  width={pixelSize * 1.5} height={pixelSize * 3} 
                  fill={materials.metal} />
            <rect x={pixelSize * 23.6} y={pixelSize * 14} 
                  width={pixelSize * 0.4} height={pixelSize * 3} 
                  fill={materials.metalDark} />
          </g>
        </g>
      );
    }
    
    // East Asian armor (samurai style)
    if (zone === 'EAST_ASIAN') {
      return (
        <g>
          {/* Kabuto (helmet) with horns */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 5})`}>
            {/* Main helmet */}
            <ellipse cx={0} cy={0} rx={pixelSize * 3.5} ry={pixelSize * 2} fill={materials.metalDark} />
            {/* Face mask */}
            <rect x={-pixelSize * 2} y={pixelSize * 0.5} width={pixelSize * 4} height={pixelSize * 1.5} fill={materials.metal} />
            {/* Horns (maedate) */}
            <path d={`M ${-pixelSize * 2} ${-pixelSize * 1.5} L ${-pixelSize * 3} ${-pixelSize * 3}`} 
                  stroke={materials.gold} strokeWidth={pixelSize * 0.5} />
            <path d={`M ${pixelSize * 2} ${-pixelSize * 1.5} L ${pixelSize * 3} ${-pixelSize * 3}`} 
                  stroke={materials.gold} strokeWidth={pixelSize * 0.5} />
          </g>
          
          {/* Do (chest armor) with laced plates */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 12})`}>
            {/* Layered plates */}
            {[0, 1.5, 3, 4.5].map((offset, i) => (
              <rect key={i}
                    x={-pixelSize * 4} 
                    y={pixelSize * offset} 
                    width={pixelSize * 8} 
                    height={pixelSize * 1.2} 
                    fill={i % 2 === 0 ? materials.metalDark : materials.metal} />
            ))}
            {/* Lacing between plates */}
            {[0.6, 2.1, 3.6].map((offset, i) => (
              <line key={i}
                    x1={-pixelSize * 3.5} y1={pixelSize * offset}
                    x2={pixelSize * 3.5} y2={pixelSize * offset}
                    stroke={materials.cloth} 
                    strokeWidth={pixelSize * 0.2} />
            ))}
          </g>
          
          {/* Sode (shoulder guards) */}
          <g>
            {/* Left sode */}
            <rect x={pixelSize * 8} y={pixelSize * 9} 
                  width={pixelSize * 3} height={pixelSize * 4} 
                  fill={materials.metalDark} />
            <rect x={pixelSize * 8.5} y={pixelSize * 10} 
                  width={pixelSize * 2} height={pixelSize * 0.3} 
                  fill={materials.cloth} />
            {/* Right sode */}
            <rect x={pixelSize * 21} y={pixelSize * 9} 
                  width={pixelSize * 3} height={pixelSize * 4} 
                  fill={materials.metalDark} />
            <rect x={pixelSize * 21.5} y={pixelSize * 10} 
                  width={pixelSize * 2} height={pixelSize * 0.3} 
                  fill={materials.cloth} />
          </g>
          
          {/* Kote (arm guards) */}
          <g>
            {/* Left kote */}
            <rect x={pixelSize * 8} y={pixelSize * 14} 
                  width={pixelSize * 1.5} height={pixelSize * 3} 
                  fill={materials.cloth} />
            <rect x={pixelSize * 8.2} y={pixelSize * 14.5} 
                  width={pixelSize * 1.1} height={pixelSize * 0.5} 
                  fill={materials.metal} />
            {/* Right kote */}
            <rect x={pixelSize * 22.5} y={pixelSize * 14} 
                  width={pixelSize * 1.5} height={pixelSize * 3} 
                  fill={materials.cloth} />
            <rect x={pixelSize * 22.7} y={pixelSize * 14.5} 
                  width={pixelSize * 1.1} height={pixelSize * 0.5} 
                  fill={materials.metal} />
          </g>
        </g>
      );
    }
    
    // Middle Eastern armor (mamluk/ottoman style)
    if (zone === 'MENA') {
      return (
        <g>
          {/* Turban helmet with spike */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 5})`}>
            {/* Wrapped turban base */}
            <ellipse cx={0} cy={0} rx={pixelSize * 3} ry={pixelSize * 2} fill={materials.cloth} />
            {/* Metal cap underneath */}
            <ellipse cx={0} cy={pixelSize * 0.5} rx={pixelSize * 2.5} ry={pixelSize * 1.5} fill={materials.metal} />
            {/* Spike on top */}
            <polygon points={`${0},${-pixelSize * 2} 
                            ${-pixelSize * 0.3},${-pixelSize * 1}
                            ${pixelSize * 0.3},${-pixelSize * 1}`} 
                    fill={materials.metalLight} />
            {/* Face mail */}
            <rect x={-pixelSize * 1.5} y={pixelSize * 1} 
                  width={pixelSize * 3} height={pixelSize} 
                  fill={materials.metalDark} opacity={0.7} />
          </g>
          
          {/* Scale/chain mail with decorative patterns */}
          <g transform={`translate(${pixelSize * 16}, ${pixelSize * 12})`}>
            {/* Main mail shirt */}
            <rect x={-pixelSize * 4} y={0} 
                  width={pixelSize * 8} height={pixelSize * 6} 
                  fill={materials.metal} />
            {/* Scale pattern */}
            {[0, 1, 2, 3, 4, 5].map((row) => 
              [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                <circle key={`${row}-${col}`}
                        cx={-pixelSize * 3.5 + col * pixelSize} 
                        cy={pixelSize * 0.5 + row * pixelSize}
                        r={pixelSize * 0.3} 
                        fill={materials.metalDark} 
                        opacity={0.3} />
              ))
            )}
            {/* Decorative band */}
            <rect x={-pixelSize * 4} y={pixelSize * 2.5} 
                  width={pixelSize * 8} height={pixelSize * 0.8} 
                  fill={materials.gold} 
                  opacity={0.7} />
          </g>
          
          {/* Bazubands (arm guards) */}
          <g>
            {/* Left arm */}
            <rect x={pixelSize * 8} y={pixelSize * 14} 
                  width={pixelSize * 1.8} height={pixelSize * 3} 
                  fill={materials.metal} />
            <rect x={pixelSize * 8.3} y={pixelSize * 15} 
                  width={pixelSize * 1.2} height={pixelSize * 0.3} 
                  fill={materials.gold} />
            {/* Right arm */}
            <rect x={pixelSize * 22.2} y={pixelSize * 14} 
                  width={pixelSize * 1.8} height={pixelSize * 3} 
                  fill={materials.metal} />
            <rect x={pixelSize * 22.5} y={pixelSize * 15} 
                  width={pixelSize * 1.2} height={pixelSize * 0.3} 
                  fill={materials.gold} />
          </g>
        </g>
      );
    }
    
    // Default/Modern: Simple leather armor
    return (
      <g>
        {/* Simple helmet/cap */}
        <g transform={`translate(${pixelSize * 16}, ${pixelSize * 5})`}>
          <ellipse cx={0} cy={0} rx={pixelSize * 2.5} ry={pixelSize * 2} fill={materials.leather} />
          <ellipse cx={0} cy={-pixelSize * 0.5} rx={pixelSize * 1.5} ry={pixelSize * 0.5} 
                   fill={materials.leatherLight} opacity={0.5} />
        </g>
        
        {/* Leather vest */}
        <g transform={`translate(${pixelSize * 16}, ${pixelSize * 12})`}>
          <rect x={-pixelSize * 3.5} y={0} width={pixelSize * 7} height={pixelSize * 6} fill={materials.leather} />
          <rect x={-pixelSize * 3.5} y={0} width={pixelSize * 0.5} height={pixelSize * 6} fill={materials.leatherLight} />
          {/* Buckles */}
          <rect x={-pixelSize * 0.5} y={pixelSize * 1} width={pixelSize} height={pixelSize * 0.5} fill={materials.metal} />
          <rect x={-pixelSize * 0.5} y={pixelSize * 3} width={pixelSize} height={pixelSize * 0.5} fill={materials.metal} />
        </g>
        
        {/* Bracers */}
        <g>
          <rect x={pixelSize * 8} y={pixelSize * 14} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={materials.leather} />
          <rect x={pixelSize * 22.5} y={pixelSize * 14} width={pixelSize * 1.5} height={pixelSize * 2.5} fill={materials.leather} />
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g opacity={opacity}>
        {renderStandBase()}
        {renderArmor()}
      </g>
    </g>
  );
};

export default ArmorStandSymbol;