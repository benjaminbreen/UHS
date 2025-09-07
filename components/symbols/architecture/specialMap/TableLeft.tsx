import React from 'react';

interface TableLeftProps {
  x: number;
  y: number;
  size: number;
  material?: string;  // Now accepts any material type with fallback
  culturalZone?: string;
  era?: number;
}

export const TableLeft: React.FC<TableLeftProps> = ({ 
  x, 
  y, 
  size, 
  material = 'wood',
  culturalZone = 'EUROPEAN',
  era = 1000 
}) => {
  // Material colors with extended variations
  const materialColors: Record<string, { surface: string; leg: string; grain: string }> = {
    wood: { surface: '#8b4513', leg: '#654321', grain: '#6b3410' },
    oak: { surface: '#8b4513', leg: '#654321', grain: '#6b3410' },
    pine: { surface: '#a0522d', leg: '#8b4513', grain: '#7b3f00' },
    lacquered_wood: { surface: '#8b0000', leg: '#5c0000', grain: '#3c0000' },
    stone: { surface: '#808080', leg: '#696969', grain: '#757575' },
    marble: { surface: '#f0f0f0', leg: '#e0e0e0', grain: '#e8e8e8' },
    metal: { surface: '#708090', leg: '#536878', grain: '#6a7b8c' },
    steel: { surface: '#c0c0c0', leg: '#a8a8a8', grain: '#b8b8b8' },
    brass: { surface: '#b8860b', leg: '#8b6914', grain: '#6b4e00' },
    bronze: { surface: '#cd7f32', leg: '#8b5a00', grain: '#704214' },
    formica: { surface: '#f5f5dc', leg: '#708090', grain: '#e8e8d8' },
    vinyl: { surface: '#dc143c', leg: '#8b0000', grain: '#a52a2a' }
  };
  
  // Fallback to wood if material not found
  const colors = materialColors[material] || materialColors.wood;
  
  // Cultural variations
  const getCulturalStyle = () => {
    if (culturalZone === 'EAST_ASIAN' && era < 1500) {
      // Low Japanese/Chinese table
      return { height: 0.3, legWidth: 0.15, hasApron: true };
    } else if (culturalZone === 'MENA') {
      // Middle Eastern low table with ornate legs
      return { height: 0.35, legWidth: 0.12, hasApron: false };
    } else if (era < 1000) {
      // Medieval trestle table
      return { height: 0.4, legWidth: 0.2, hasApron: false };
    } else {
      // Standard Western table
      return { height: 0.4, legWidth: 0.1, hasApron: true };
    }
  };
  
  const style = getCulturalStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Gray background */}
      <rect x={0} y={0} width={size} height={size} fill="#8a8a8a" />
      
      {/* Table surface */}
      <rect 
        x={size * 0.05} 
        y={size * (0.3 - style.height/2)} 
        width={size * 0.9} 
        height={size * style.height} 
        fill={colors.surface}
        stroke={colors.leg}
        strokeWidth="1"
      />
      
      {/* Wood grain pattern */}
      {material === 'wood' && (
        <>
          <line x1={size * 0.1} y1={size * 0.35} x2={size * 0.85} y2={size * 0.35} stroke={colors.grain} strokeWidth="0.5" opacity="0.5" />
          <line x1={size * 0.1} y1={size * 0.45} x2={size * 0.85} y2={size * 0.45} stroke={colors.grain} strokeWidth="0.5" opacity="0.5" />
          <line x1={size * 0.1} y1={size * 0.55} x2={size * 0.85} y2={size * 0.55} stroke={colors.grain} strokeWidth="0.5" opacity="0.5" />
        </>
      )}
      
      {/* Left leg (only on left end) */}
      <rect 
        x={size * 0.1} 
        y={size * (0.3 + style.height/2)} 
        width={size * style.legWidth} 
        height={size * 0.35} 
        fill={colors.leg}
        stroke={colors.grain}
        strokeWidth="0.5"
      />
      
      {/* Table apron (decorative board under table) */}
      {style.hasApron && (
        <rect 
          x={size * 0.05} 
          y={size * (0.3 + style.height/2 - 0.05)} 
          width={size * 0.9} 
          height={size * 0.05} 
          fill={colors.leg}
          opacity="0.8"
        />
      )}
      
      {/* Cultural decorations */}
      {culturalZone === 'EAST_ASIAN' && (
        <rect 
          x={size * 0.1} 
          y={size * 0.25} 
          width={size * 0.02} 
          height={size * 0.5} 
          fill="#8b0000"
          opacity="0.3"
        />
      )}
    </g>
  );
};

export default TableLeft;