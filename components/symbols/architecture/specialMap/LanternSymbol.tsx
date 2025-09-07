/**
 * LanternSymbol.tsx - Beautiful SNES RPG-style lanterns with cultural variations
 * Consistent 3/4 perspective with 45-degree shadows
 * Features hanging and standing lanterns with era-appropriate designs
 */
import React from 'react';

interface LanternSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  variant?: 'hanging' | 'standing' | 'wall' | 'festival';
  lit?: boolean;
  opacity?: number;
}

const LanternSymbol: React.FC<LanternSymbolProps> = ({ 
  x, 
  y, 
  size = 32,
  culturalZone = 'EUROPEAN',
  era = 1500,
  variant,
  lit = true,
  opacity = 1.0 
}) => {
  // Beautiful pixel size for detailed art
  const pixelSize = size / 32;
  
  // Auto-select variant based on culture if not specified
  const getLanternVariant = () => {
    if (variant) return variant;
    
    const zone = culturalZone?.toUpperCase();
    if (zone === 'EAST_ASIAN') {
      return era < 1900 ? 'hanging' : 'standing';
    } else if (zone === 'MENA') {
      return 'hanging';
    } else if (zone === 'EUROPEAN') {
      return era < 1800 ? 'wall' : 'standing';
    }
    return 'standing';
  };
  
  const lanternVariant = getLanternVariant();
  
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
  
  // Cultural material and color schemes
  const getMaterials = () => {
    const zone = culturalZone?.toUpperCase();
    
    let frame = '#8B4513'; // Default brown wood
    let paper = '#FFF8DC'; // Default cream paper
    let accent = '#DAA520'; // Default gold accent
    let glass = '#E6F3FF'; // Glass for European
    
    if (zone === 'EAST_ASIAN') {
      // Beautiful Chinese/Japanese lanterns
      frame = '#8B0000'; // Dark red frame
      paper = '#FFE4E1'; // Light pink/white paper
      accent = '#FFD700'; // Gold tassels and details
      if (variant === 'festival') {
        paper = '#DC143C'; // Bright red for festivals
      }
    } else if (zone === 'MENA') {
      // Islamic geometric lanterns
      frame = '#CD7F32'; // Bronze/brass
      paper = '#FFF8DC'; // Cream
      accent = '#FFD700'; // Gold filigree
      glass = '#4169E1'; // Colored glass
    } else if (zone === 'EUROPEAN') {
      // Medieval/Renaissance lanterns
      frame = '#2F4F4F'; // Dark metal
      paper = '#FFFACD'; // Pale yellow (candle glow)
      accent = '#696969'; // Iron details
      glass = '#F0F8FF'; // Clear glass
    } else if (zone === 'SOUTH_ASIAN') {
      // Diwali-style lamps
      frame = '#B8860B'; // Brass
      paper = '#FFA500'; // Orange glow
      accent = '#FF6347'; // Decorative red
    }
    
    return {
      frame,
      frameLight: lightenColor(frame, 20),
      frameDark: darkenColor(frame, 20),
      paper,
      paperGlow: lit ? lightenColor(paper, 30) : paper,
      accent,
      glass,
      shadow: '#000000',
      flame: '#FFA500',
      flameCore: '#FFFF00'
    };
  };

  const materials = getMaterials();
  
  // Render different lantern types
  const renderHangingLantern = () => {
    const zone = culturalZone?.toUpperCase();
    
    if (zone === 'EAST_ASIAN') {
      // Beautiful Chinese red lantern
      return (
        <g>
          {/* Hanging cord/chain */}
          <line
            x1={pixelSize * 16}
            y1={pixelSize * 2}
            x2={pixelSize * 16}
            y2={pixelSize * 8}
            stroke={materials.accent}
            strokeWidth={pixelSize * 0.5}
          />
          
          {/* Top cap */}
          <ellipse
            cx={pixelSize * 16}
            cy={pixelSize * 8}
            rx={pixelSize * 4}
            ry={pixelSize * 1}
            fill={materials.frame}
          />
          
          {/* Main lantern body - cylindrical with bulge */}
          <g>
            {/* Back layer */}
            <ellipse
              cx={pixelSize * 16}
              cy={pixelSize * 16}
              rx={pixelSize * 6}
              ry={pixelSize * 8}
              fill={materials.frameDark}
            />
            
            {/* Paper body */}
            <ellipse
              cx={pixelSize * 16}
              cy={pixelSize * 16}
              rx={pixelSize * 5.5}
              ry={pixelSize * 7.5}
              fill={lit ? materials.paperGlow : materials.paper}
            />
            
            {/* Vertical ribs */}
            {[-2, 0, 2].map(offset => (
              <line
                key={offset}
                x1={pixelSize * (16 + offset)}
                y1={pixelSize * 9}
                x2={pixelSize * (16 + offset)}
                y2={pixelSize * 23}
                stroke={materials.frame}
                strokeWidth={pixelSize * 0.3}
                opacity={0.5}
              />
            ))}
            
            {/* Horizontal rings */}
            <ellipse
              cx={pixelSize * 16}
              cy={pixelSize * 12}
              rx={pixelSize * 5}
              ry={pixelSize * 2}
              fill="none"
              stroke={materials.frame}
              strokeWidth={pixelSize * 0.3}
            />
            <ellipse
              cx={pixelSize * 16}
              cy={pixelSize * 20}
              rx={pixelSize * 5}
              ry={pixelSize * 2}
              fill="none"
              stroke={materials.frame}
              strokeWidth={pixelSize * 0.3}
            />
          </g>
          
          {/* Bottom cap with tassel */}
          <ellipse
            cx={pixelSize * 16}
            cy={pixelSize * 24}
            rx={pixelSize * 4}
            ry={pixelSize * 1}
            fill={materials.frame}
          />
          
          {/* Golden tassel */}
          <g>
            {/* Tassel base */}
            <rect
              x={pixelSize * 15}
              y={pixelSize * 24}
              width={pixelSize * 2}
              height={pixelSize * 1}
              fill={materials.accent}
            />
            {/* Tassel strands */}
            {[0, 0.5, 1, 1.5].map(offset => (
              <line
                key={offset}
                x1={pixelSize * (15.5 + offset * 0.5)}
                y1={pixelSize * 25}
                x2={pixelSize * (15.5 + offset * 0.5)}
                y2={pixelSize * 27}
                stroke={materials.accent}
                strokeWidth={pixelSize * 0.2}
              />
            ))}
          </g>
          
          {/* Chinese characters (decorative) */}
          {zone === 'EAST_ASIAN' && era < 1900 && (
            <text
              x={pixelSize * 16}
              y={pixelSize * 16}
              fontSize={pixelSize * 3}
              fill={materials.frame}
              textAnchor="middle"
              opacity={0.3}
            >
              福
            </text>
          )}
          
          {/* Inner glow effect when lit */}
          {lit && (
            <ellipse
              cx={pixelSize * 16}
              cy={pixelSize * 16}
              rx={pixelSize * 3}
              ry={pixelSize * 4}
              fill={materials.flame}
              opacity={0.3}
              filter="blur(1px)"
            />
          )}
        </g>
      );
    } else {
      // Default hanging lantern (European/MENA style)
      return (
        <g>
          {/* Chain */}
          <line
            x1={pixelSize * 16}
            y1={pixelSize * 4}
            x2={pixelSize * 16}
            y2={pixelSize * 10}
            stroke={materials.frame}
            strokeWidth={pixelSize * 0.5}
          />
          
          {/* Top cone */}
          <polygon
            points={`${pixelSize * 16},${pixelSize * 10} 
                    ${pixelSize * 12},${pixelSize * 12}
                    ${pixelSize * 20},${pixelSize * 12}`}
            fill={materials.frame}
          />
          
          {/* Glass panels */}
          <rect
            x={pixelSize * 13}
            y={pixelSize * 12}
            width={pixelSize * 6}
            height={pixelSize * 8}
            fill={materials.glass}
            opacity={0.6}
          />
          
          {/* Frame edges */}
          <rect
            x={pixelSize * 12}
            y={pixelSize * 12}
            width={pixelSize * 1}
            height={pixelSize * 8}
            fill={materials.frame}
          />
          <rect
            x={pixelSize * 19}
            y={pixelSize * 12}
            width={pixelSize * 1}
            height={pixelSize * 8}
            fill={materials.frame}
          />
          
          {/* Candle inside */}
          {lit && (
            <g>
              <rect
                x={pixelSize * 15.5}
                y={pixelSize * 17}
                width={pixelSize * 1}
                height={pixelSize * 3}
                fill="#F5DEB3"
              />
              <ellipse
                cx={pixelSize * 16}
                cy={pixelSize * 16}
                rx={pixelSize * 0.5}
                ry={pixelSize * 1}
                fill={materials.flame}
              />
            </g>
          )}
          
          {/* Bottom */}
          <rect
            x={pixelSize * 12}
            y={pixelSize * 20}
            width={pixelSize * 8}
            height={pixelSize * 1}
            fill={materials.frame}
          />
        </g>
      );
    }
  };
  
  const renderStandingLantern = () => {
    return (
      <g>
        {/* Base/pole */}
        <rect
          x={pixelSize * 15}
          y={pixelSize * 20}
          width={pixelSize * 2}
          height={pixelSize * 8}
          fill={materials.frame}
        />
        
        {/* Base plate */}
        <ellipse
          cx={pixelSize * 16}
          cy={pixelSize * 28}
          rx={pixelSize * 3}
          ry={pixelSize * 1}
          fill={materials.frameDark}
        />
        
        {/* Lantern housing */}
        <rect
          x={pixelSize * 12}
          y={pixelSize * 10}
          width={pixelSize * 8}
          height={pixelSize * 10}
          fill={materials.frameDark}
        />
        
        {/* Glass/paper panels */}
        <rect
          x={pixelSize * 13}
          y={pixelSize * 11}
          width={pixelSize * 6}
          height={pixelSize * 8}
          fill={lit ? materials.paperGlow : materials.glass}
          opacity={0.7}
        />
        
        {/* Top */}
        <polygon
          points={`${pixelSize * 16},${pixelSize * 8} 
                  ${pixelSize * 11},${pixelSize * 10}
                  ${pixelSize * 21},${pixelSize * 10}`}
          fill={materials.frame}
        />
        
        {/* Light source */}
        {lit && (
          <ellipse
            cx={pixelSize * 16}
            cy={pixelSize * 15}
            rx={pixelSize * 2}
            ry={pixelSize * 2}
            fill={materials.flame}
            opacity={0.5}
          />
        )}
      </g>
    );
  };
  
  const renderWallLantern = () => {
    return (
      <g>
        {/* Wall bracket */}
        <path
          d={`M ${pixelSize * 10} ${pixelSize * 14}
              L ${pixelSize * 10} ${pixelSize * 16}
              L ${pixelSize * 14} ${pixelSize * 16}`}
          stroke={materials.frame}
          strokeWidth={pixelSize * 1}
          fill="none"
        />
        
        {/* Lantern body */}
        <rect
          x={pixelSize * 14}
          y={pixelSize * 12}
          width={pixelSize * 6}
          height={pixelSize * 8}
          fill={materials.frameDark}
        />
        
        {/* Glass front */}
        <rect
          x={pixelSize * 15}
          y={pixelSize * 13}
          width={pixelSize * 4}
          height={pixelSize * 6}
          fill={lit ? materials.paperGlow : materials.glass}
          opacity={0.7}
        />
        
        {/* Flame */}
        {lit && (
          <ellipse
            cx={pixelSize * 17}
            cy={pixelSize * 16}
            rx={pixelSize * 1}
            ry={pixelSize * 1.5}
            fill={materials.flame}
          />
        )}
      </g>
    );
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g opacity={opacity}>
        {/* 45-degree shadow */}
        <ellipse 
          cx={pixelSize * 16} 
          cy={pixelSize * 29} 
          rx={pixelSize * 4} 
          ry={pixelSize * 2} 
          fill={materials.shadow} 
          opacity={0.3}
        />
        
        {/* Render appropriate lantern type */}
        {lanternVariant === 'hanging' && renderHangingLantern()}
        {lanternVariant === 'standing' && renderStandingLantern()}
        {lanternVariant === 'wall' && renderWallLantern()}
        {lanternVariant === 'festival' && renderHangingLantern()}
        
        {/* Glow effect around lantern when lit */}
        {lit && (
          <circle
            cx={pixelSize * 16}
            cy={pixelSize * 16}
            r={pixelSize * 12}
            fill={materials.flame}
            opacity={0.1}
            filter="blur(3px)"
          />
        )}
      </g>
    </g>
  );
};

export default LanternSymbol;