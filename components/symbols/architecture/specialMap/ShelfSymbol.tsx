/**
 * ShelfSymbol.tsx - Storage shelf with cultural variations
 * For workshop and storage areas
 */
import React from 'react';

interface ShelfSymbolProps {
  culturalZone?: string;
  era?: number;
  hasItems?: boolean;
}

const ShelfSymbol: React.FC<ShelfSymbolProps> = ({
  culturalZone = 'EUROPEAN',
  era = 1500,
  hasItems = true
}) => {
  // Get wood colors based on culture
  const getWoodColors = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return {
          wood: '#3E2723',
          woodLight: '#5D4037',
          woodDark: '#1B0000',
          accent: '#8B4513'
        };
      case 'MENA':
      case 'SOUTH_ASIAN':
        return {
          wood: '#8B6914',
          woodLight: '#B8860B',
          woodDark: '#654321',
          accent: '#DAA520'
        };
      default:
        return {
          wood: '#6D4C41',
          woodLight: '#8D6E63',
          woodDark: '#4E342E',
          accent: '#A1887F'
        };
    }
  };

  const colors = getWoodColors();

  // Item colors for shelf contents
  const itemColors = ['#8B7355', '#A0826D', '#6B5D52', '#9C8671'];

  return (
    <g>
      {/* Back panel */}
      <rect
        x="10%"
        y="15%"
        width="80%"
        height="70%"
        fill={colors.woodDark}
        opacity={0.3}
      />

      {/* Side supports */}
      <rect
        x="10%"
        y="15%"
        width="8%"
        height="70%"
        fill={colors.wood}
      />
      <rect
        x="82%"
        y="15%"
        width="8%"
        height="70%"
        fill={colors.wood}
      />

      {/* Side support highlights */}
      <rect
        x="10%"
        y="15%"
        width="4%"
        height="70%"
        fill={colors.woodLight}
        opacity={0.4}
      />
      <rect
        x="82%"
        y="15%"
        width="4%"
        height="70%"
        fill={colors.woodLight}
        opacity={0.4}
      />

      {/* Bottom shelf */}
      <rect
        x="10%"
        y="75%"
        width="80%"
        height="8%"
        fill={colors.wood}
      />
      <rect
        x="10%"
        y="75%"
        width="80%"
        height="3%"
        fill={colors.woodLight}
      />

      {/* Middle shelf */}
      <rect
        x="10%"
        y="48%"
        width="80%"
        height="8%"
        fill={colors.wood}
      />
      <rect
        x="10%"
        y="48%"
        width="80%"
        height="3%"
        fill={colors.woodLight}
      />

      {/* Top shelf */}
      <rect
        x="10%"
        y="21%"
        width="80%"
        height="8%"
        fill={colors.wood}
      />
      <rect
        x="10%"
        y="21%"
        width="80%"
        height="3%"
        fill={colors.woodLight}
      />

      {/* Items on shelves */}
      {hasItems && (
        <>
          {/* Top shelf items */}
          <rect x="15%" y="25%" width="10%" height="8%" fill={itemColors[0]} rx="1" />
          <rect x="28%" y="24%" width="8%" height="9%" fill={itemColors[1]} rx="1" />
          <rect x="40%" y="26%" width="12%" height="7%" fill={itemColors[2]} rx="1" />
          <rect x="55%" y="25%" width="9%" height="8%" fill={itemColors[3]} rx="1" />
          <rect x="68%" y="24%" width="10%" height="9%" fill={itemColors[0]} rx="1" />

          {/* Middle shelf items */}
          <rect x="18%" y="52%" width="11%" height="9%" fill={itemColors[2]} rx="1" />
          <rect x="33%" y="51%" width="9%" height="10%" fill={itemColors[3]} rx="1" />
          <rect x="46%" y="53%" width="13%" height="8%" fill={itemColors[0]} rx="1" />
          <rect x="62%" y="52%" width="10%" height="9%" fill={itemColors[1]} rx="1" />

          {/* Bottom shelf items (larger) */}
          <rect x="15%" y="60%" width="15%" height="12%" fill={itemColors[1]} rx="1" />
          <rect x="35%" y="59%" width="13%" height="13%" fill={itemColors[3]} rx="1" />
          <rect x="52%" y="61%" width="16%" height="11%" fill={itemColors[0]} rx="1" />
          <rect x="72%" y="60%" width="12%" height="12%" fill={itemColors[2]} rx="1" />
        </>
      )}

      {/* Front edge shadows */}
      <rect
        x="10%"
        y="29%"
        width="80%"
        height="1%"
        fill="black"
        opacity={0.3}
      />
      <rect
        x="10%"
        y="56%"
        width="80%"
        height="1%"
        fill="black"
        opacity={0.3}
      />
      <rect
        x="10%"
        y="83%"
        width="80%"
        height="1%"
        fill="black"
        opacity={0.3}
      />
    </g>
  );
};

export default ShelfSymbol;
