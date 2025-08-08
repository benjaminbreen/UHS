/**
 * components/symbols/government/TribalCouncilSymbol.tsx - Indigenous and tribal government structures
 */
import React from 'react';
import { Tile } from '../../../types';

interface TribalCouncilSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'native_american' | 'african' | 'polynesian' | 'aboriginal' | 'advanced' | 'kingdom';
}

const TribalCouncilSymbol: React.FC<TribalCouncilSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'native_american' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.75;
  
  // Color variations by cultural tradition
  const getColors = () => {
    switch (variant) {
      case 'african':
        return {
          base: '#CD853F', // Peru (mud brick)
          roof: '#8B4513', // Saddle brown (thatch)
          accent: '#A0522D', // Sienna
          details: '#DAA520' // Goldenrod
        };
      case 'polynesian':
        return {
          base: '#D2B48C', // Tan (bamboo/wood)
          roof: '#8B4513', // Saddle brown (palm thatch)
          accent: '#654321', // Dark brown
          details: '#FF6347' // Tomato (decorations)
        };
      case 'aboriginal':
        return {
          base: '#DEB887', // Burlywood (bark/earth)
          roof: '#8B4513', // Saddle brown
          accent: '#A0522D', // Sienna
          details: '#FFD700' // Gold (ochre)
        };
      case 'advanced':
        return {
          base: '#F4A460', // Sandy brown (stone/adobe)
          roof: '#8B4513', // Saddle brown
          accent: '#CD853F', // Peru
          details: '#B8860B' // Dark goldenrod
        };
      case 'kingdom':
        return {
          base: '#DEB887', // Burlywood
          roof: '#8B0000', // Dark red
          accent: '#DAA520', // Goldenrod
          details: '#FF6347' // Tomato
        };
      default: // native_american
        return {
          base: '#D2B48C', // Tan (wood/hide)
          roof: '#8B4513', // Saddle brown (bark/hide)
          accent: '#A0522D', // Sienna
          details: '#FF4500' // Orange red
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  if (variant === 'polynesian') {
    // Long house style (rectangular with curved roof)
    elements.push(
      <rect
        key="longhouse-base"
        x={centerX - buildingSize/2}
        y={centerY - buildingSize/4}
        width={buildingSize}
        height={buildingSize/2}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );

    // Curved thatched roof
    elements.push(
      <path
        key="thatch-roof"
        d={`M ${centerX - buildingSize/2 - 3} ${centerY - buildingSize/4}
            Q ${centerX} ${centerY - buildingSize/2.2}
            ${centerX + buildingSize/2 + 3} ${centerY - buildingSize/4}`}
        fill={colors.roof}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );

    // Support posts
    [-buildingSize/3, 0, buildingSize/3].forEach((offset, i) => {
      elements.push(
        <rect
          key={`support-post-${i}`}
          x={centerX + offset - 2}
          y={centerY - buildingSize/4}
          width="4"
          height={buildingSize/2}
          fill={colors.accent}
        />
      );
    });

  } else if (variant === 'african' || variant === 'kingdom') {
    // Round house with conical roof (common in Africa)
    elements.push(
      <circle
        key="round-base"
        cx={centerX}
        cy={centerY}
        r={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );

    // Conical thatched roof
    elements.push(
      <polygon
        key="conical-roof"
        points={`${centerX - buildingSize/3 - 3},${centerY - buildingSize/6} ${centerX},${centerY - buildingSize/2.2} ${centerX + buildingSize/3 + 3},${centerY - buildingSize/6}`}
        fill={colors.roof}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );

    // If kingdom variant, add royal compound walls
    if (variant === 'kingdom') {
      elements.push(
        <g key="compound-wall">
          <circle
            cx={centerX}
            cy={centerY}
            r={buildingSize/2.2}
            fill="none"
            stroke={colors.accent}
            strokeWidth="3"
            opacity="0.7"
          />
          {/* Gates */}
          <rect
            x={centerX - 4}
            y={centerY - buildingSize/2.2}
            width="8"
            height="6"
            fill={colors.details}
          />
        </g>
      );
    }

  } else if (variant === 'advanced') {
    // More complex structure (Puebloan/Mississippian style)
    // Main structure
    elements.push(
      <rect
        key="main-structure"
        x={centerX - buildingSize/2}
        y={centerY - buildingSize/4}
        width={buildingSize}
        height={buildingSize/2}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );

    // Stepped levels (pyramid-like)
    elements.push(
      <rect
        key="upper-level"
        x={centerX - buildingSize/3}
        y={centerY - buildingSize/3}
        width={buildingSize * 2/3}
        height={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );

    // Flat roof with parapet
    elements.push(
      <rect
        key="parapet"
        x={centerX - buildingSize/3 - 2}
        y={centerY - buildingSize/3 - 2}
        width={buildingSize * 2/3 + 4}
        height="2"
        fill={colors.accent}
      />
    );

  } else {
    // Traditional wigwam/tipi or simple lodge
    if (variant === 'aboriginal') {
      // Simple shelter structure
      elements.push(
        <path
          key="shelter"
          d={`M ${centerX - buildingSize/2} ${centerY + buildingSize/4}
              Q ${centerX} ${centerY - buildingSize/3}
              ${centerX + buildingSize/2} ${centerY + buildingSize/4}`}
          fill={colors.base}
          stroke={colors.accent}
          strokeWidth="2"
        />
      );
    } else {
      // Dome-shaped lodge (Native American)
      elements.push(
        <ellipse
          key="lodge"
          cx={centerX}
          cy={centerY + buildingSize/8}
          rx={buildingSize/2.5}
          ry={buildingSize/3}
          fill={colors.base}
          stroke={colors.accent}
          strokeWidth="2"
        />
      );
    }
  }

  // Central fire pit or meeting circle (common to most traditions)
  elements.push(
    <circle
      key="fire-pit"
      cx={centerX}
      cy={centerY + buildingSize/6}
      r="4"
      fill={colors.details}
      stroke={colors.accent}
      strokeWidth="1"
    />
  );

  // Totem pole or ceremonial post (for some traditions)
  if (variant === 'native_american' || variant === 'polynesian' || variant === 'aboriginal') {
    elements.push(
      <g key="ceremonial-post">
        <rect
          x={centerX + buildingSize/3}
          y={centerY - buildingSize/3}
          width="4"
          height={buildingSize * 0.7}
          fill={colors.accent}
        />
        {/* Decorative top */}
        <polygon
          points={`${centerX + buildingSize/3 - 2},${centerY - buildingSize/3} ${centerX + buildingSize/3 + 2},${centerY - buildingSize/3 - 6} ${centerX + buildingSize/3 + 6},${centerY - buildingSize/3}`}
          fill={colors.details}
        />
      </g>
    );
  }

  // Meeting circle or sacred space around the structure
  elements.push(
    <circle
      key="sacred-circle"
      cx={centerX}
      cy={centerY}
      r={buildingSize/2 + 4}
      fill="none"
      stroke={colors.details}
      strokeWidth="1"
      opacity="0.5"
      strokeDasharray="3,3"
    />
  );

  // Small huts or structures around the main building (compound style)
  if (variant === 'advanced' || variant === 'kingdom' || variant === 'african') {
    const smallHuts = [
      { x: centerX - buildingSize/2 - 10, y: centerY + buildingSize/4 },
      { x: centerX + buildingSize/2 + 6, y: centerY + buildingSize/4 },
      { x: centerX, y: centerY + buildingSize/2 + 8 }
    ];

    smallHuts.forEach((hut, i) => {
      elements.push(
        <circle
          key={`small-hut-${i}`}
          cx={hut.x}
          cy={hut.y}
          r="4"
          fill={colors.base}
          stroke={colors.accent}
          strokeWidth="1"
          opacity="0.8"
        />
      );
    });
  }

  return (
    <g>
      {elements}
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(TribalCouncilSymbol);