import React from 'react';
import { CulturalZone } from '../../../../types/characterData';

interface PillarOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  variant?: 'simple' | 'ornate' | 'carved';
}

const PillarOverlay: React.FC<PillarOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  variant = 'simple'
}) => {
  // Get cultural colors and styles
  const getCulturalStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          baseColor: '#8B0000', // Dark red lacquer
          highlightColor: '#DC143C', // Crimson
          shadowColor: '#4B0000', // Very dark red
          accentColor: '#FFD700', // Gold accents
          shape: 'octagonal',
          hasCarving: true
        };
      
      case 'MENA':
        return {
          baseColor: '#DEB887', // Burlywood (sandstone)
          highlightColor: '#F5DEB3', // Wheat
          shadowColor: '#8B7355', // Dark tan
          accentColor: '#4169E1', // Royal blue (tile accents)
          shape: 'arched',
          hasCarving: true
        };
      
      case 'SOUTH_ASIAN':
        return {
          baseColor: '#CD5C5C', // Indian red
          highlightColor: '#F08080', // Light coral
          shadowColor: '#8B3A3A', // Dark red
          accentColor: '#FFD700', // Gold
          shape: 'carved',
          hasCarving: true
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          baseColor: '#8B4513', // Saddle brown (wood)
          highlightColor: '#A0522D', // Sienna
          shadowColor: '#654321', // Dark brown
          accentColor: '#DAA520', // Goldenrod
          shape: 'cylindrical',
          hasCarving: true
        };
      
      case 'OCEANIA':
        return {
          baseColor: '#D2691E', // Chocolate (tropical wood)
          highlightColor: '#DEB887', // Burlywood
          shadowColor: '#8B4513', // Saddle brown
          accentColor: '#228B22', // Forest green (leaves)
          shape: 'totem',
          hasCarving: true
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        return {
          baseColor: '#A0522D', // Sienna (adobe/stone)
          highlightColor: '#BC8F8F', // Rosy brown
          shadowColor: '#704214', // Dark brown
          accentColor: '#DC143C', // Crimson
          shape: 'stepped',
          hasCarving: true
        };
      
      case 'SOUTH_AMERICAN':
        return {
          baseColor: '#696969', // Dim gray (stone)
          highlightColor: '#A9A9A9', // Dark gray
          shadowColor: '#2F4F4F', // Dark slate gray
          accentColor: '#FFD700', // Gold
          shape: 'trapezoidal',
          hasCarving: false
        };
      
      case 'EUROPEAN':
      default:
        // Era-based European styles
        if (era < 500) {
          // Classical Roman/Greek
          return {
            baseColor: '#F5F5DC', // Beige (marble)
            highlightColor: '#FFFAF0', // Floral white
            shadowColor: '#D3D3D3', // Light gray
            accentColor: '#FFD700', // Gold
            shape: 'fluted',
            hasCarving: false
          };
        } else if (era < 1500) {
          // Medieval
          return {
            baseColor: '#808080', // Gray (stone)
            highlightColor: '#A9A9A9', // Dark gray
            shadowColor: '#696969', // Dim gray
            accentColor: '#8B4513', // Saddle brown
            shape: 'round',
            hasCarving: false
          };
        } else {
          // Renaissance and later
          return {
            baseColor: '#FFF8DC', // Cornsilk (polished stone)
            highlightColor: '#FFFFF0', // Ivory
            shadowColor: '#F0E68C', // Khaki
            accentColor: '#B8860B', // Dark goldenrod
            shape: 'corinthian',
            hasCarving: true
          };
        }
    }
  };
  
  const style = getCulturalStyle();
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  // Base and top dimensions for 3D effect
  const baseWidth = size * 0.5;
  const baseHeight = size * 0.3;
  const topWidth = size * 0.45;
  const topHeight = size * 0.25;
  
  return (
    <g>
      {/* Shadow at base */}
      <ellipse
        cx={centerX}
        cy={y + size * 0.85}
        rx={baseWidth * 0.6}
        ry={baseHeight * 0.3}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Pillar shaft based on shape */}
      {style.shape === 'octagonal' ? (
        // East Asian octagonal pillar
        <>
          <path
            d={`
              M ${centerX - baseWidth * 0.4} ${y + size * 0.7}
              L ${centerX - topWidth * 0.4} ${y + size * 0.2}
              L ${centerX - topWidth * 0.2} ${y + size * 0.15}
              L ${centerX + topWidth * 0.2} ${y + size * 0.15}
              L ${centerX + topWidth * 0.4} ${y + size * 0.2}
              L ${centerX + baseWidth * 0.4} ${y + size * 0.7}
              L ${centerX + baseWidth * 0.2} ${y + size * 0.75}
              L ${centerX - baseWidth * 0.2} ${y + size * 0.75}
              Z
            `}
            fill={style.baseColor}
            stroke={style.shadowColor}
            strokeWidth={1}
          />
          {/* Highlight edge */}
          <line
            x1={centerX - topWidth * 0.4}
            y1={y + size * 0.2}
            x2={centerX - baseWidth * 0.4}
            y2={y + size * 0.7}
            stroke={style.highlightColor}
            strokeWidth={1.5}
          />
        </>
      ) : style.shape === 'fluted' ? (
        // Classical fluted column
        <>
          {/* Main shaft */}
          <rect
            x={centerX - baseWidth * 0.4}
            y={y + size * 0.2}
            width={baseWidth * 0.8}
            height={size * 0.5}
            fill={style.baseColor}
          />
          {/* Flutes (vertical grooves) */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={centerX - baseWidth * 0.3 + i * baseWidth * 0.2}
              y1={y + size * 0.2}
              x2={centerX - baseWidth * 0.35 + i * baseWidth * 0.23}
              y2={y + size * 0.7}
              stroke={style.shadowColor}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
        </>
      ) : (
        // Default cylindrical pillar
        <>
          <path
            d={`
              M ${centerX - baseWidth * 0.4} ${y + size * 0.7}
              L ${centerX - topWidth * 0.35} ${y + size * 0.2}
              L ${centerX + topWidth * 0.35} ${y + size * 0.2}
              L ${centerX + baseWidth * 0.4} ${y + size * 0.7}
              Z
            `}
            fill={style.baseColor}
            stroke={style.shadowColor}
            strokeWidth={1}
          />
          {/* Highlight on left edge */}
          <line
            x1={centerX - topWidth * 0.35}
            y1={y + size * 0.2}
            x2={centerX - baseWidth * 0.4}
            y2={y + size * 0.7}
            stroke={style.highlightColor}
            strokeWidth={1.5}
          />
        </>
      )}
      
      {/* Capital (top decoration) */}
      {style.shape === 'corinthian' && (
        // Ornate capital for Renaissance
        <>
          <rect
            x={centerX - topWidth * 0.5}
            y={y + size * 0.15}
            width={topWidth}
            height={size * 0.05}
            fill={style.accentColor}
          />
          <ellipse
            cx={centerX}
            cy={y + size * 0.15}
            rx={topWidth * 0.55}
            ry={topHeight * 0.2}
            fill={style.baseColor}
            stroke={style.shadowColor}
            strokeWidth={1}
          />
        </>
      )}
      
      {/* Base platform */}
      <rect
        x={centerX - baseWidth * 0.5}
        y={y + size * 0.7}
        width={baseWidth}
        height={size * 0.05}
        fill={style.shadowColor}
      />
      <ellipse
        cx={centerX}
        cy={y + size * 0.7}
        rx={baseWidth * 0.55}
        ry={baseHeight * 0.3}
        fill={style.baseColor}
        stroke={style.shadowColor}
        strokeWidth={1}
      />
      
      {/* Cultural decorations */}
      {style.hasCarving && variant === 'carved' && (
        <>
          {culturalZone === 'EAST_ASIAN' && (
            // Dragon or cloud pattern
            <text
              x={centerX}
              y={y + size * 0.45}
              fontSize={size * 0.1}
              fill={style.accentColor}
              textAnchor="middle"
              style={{ fontFamily: 'serif' }}
            >
              龍
            </text>
          )}
          {culturalZone === 'MENA' && (
            // Geometric pattern
            <rect
              x={centerX - topWidth * 0.15}
              y={y + size * 0.4}
              width={topWidth * 0.3}
              height={size * 0.1}
              fill={style.accentColor}
              opacity={0.6}
            />
          )}
          {culturalZone === 'SOUTH_ASIAN' && (
            // Lotus or deity carving
            <circle
              cx={centerX}
              cy={y + size * 0.45}
              r={size * 0.08}
              fill="none"
              stroke={style.accentColor}
              strokeWidth={1.5}
            />
          )}
        </>
      )}
      
      {/* Top surface */}
      <ellipse
        cx={centerX}
        cy={y + size * 0.18}
        rx={topWidth * 0.45}
        ry={topHeight * 0.2}
        fill={style.highlightColor}
        stroke={style.shadowColor}
        strokeWidth={0.5}
      />
    </g>
  );
};

export default PillarOverlay;