/**
 * components/symbols/government/MandateHallSymbol.tsx - Chinese imperial and administrative buildings
 */
import React from 'react';
import { Tile } from '../../../types';

interface MandateHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'han' | 'tang' | 'ming' | 'qing' | 'indian';
}

const MandateHallSymbol: React.FC<MandateHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'tang' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.8;
  
  // Color variations by dynasty and region
  const getColors = () => {
    switch (variant) {
      case 'han':
        return {
          base: '#F4A460', // Sandy brown
          roof: '#8B0000', // Dark red
          accent: '#DAA520', // Goldenrod
          details: '#FF6347' // Tomato
        };
      case 'ming':
        return {
          base: '#FFFACD', // Lemon chiffon (white stone)
          roof: '#FFD700', // Gold (yellow glazed tiles)
          accent: '#B8860B', // Dark goldenrod
          details: '#DC143C' // Crimson
        };
      case 'qing':
        return {
          base: '#F5DEB3', // Wheat
          roof: '#4169E1', // Royal blue (Qing colors)
          accent: '#DAA520', // Goldenrod
          details: '#FFFF00' // Yellow (imperial color)
        };
      case 'indian':
        return {
          base: '#DEB887', // Burlywood (sandstone)
          roof: '#CD853F', // Peru (terracotta)
          accent: '#B8860B', // Dark goldenrod
          details: '#FF1493' // Deep pink
        };
      default: // tang
        return {
          base: '#DEB887', // Burlywood
          roof: '#8B4513', // Saddle brown
          accent: '#DAA520', // Goldenrod
          details: '#FF4500' // Orange red
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main hall building (Chinese architectural proportions)
  elements.push(
    <rect
      key="main-hall"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/4}
      width={buildingSize}
      height={buildingSize/2}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Traditional Chinese curved roofline (pagoda style)
  elements.push(
    <path
      key="curved-roof"
      d={`M ${centerX - buildingSize/2 - 6} ${centerY - buildingSize/4}
          Q ${centerX - buildingSize/4} ${centerY - buildingSize/2.5}
          ${centerX} ${centerY - buildingSize/3}
          Q ${centerX + buildingSize/4} ${centerY - buildingSize/2.5}
          ${centerX + buildingSize/2 + 6} ${centerY - buildingSize/4}`}
      fill={colors.roof}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Upturned roof corners (characteristic of Chinese architecture)
  elements.push(
    <g key="roof-corners">
      <path
        d={`M ${centerX - buildingSize/2 - 6} ${centerY - buildingSize/4}
            Q ${centerX - buildingSize/2 - 2} ${centerY - buildingSize/3}
            ${centerX - buildingSize/2 + 2} ${centerY - buildingSize/4 + 2}`}
        fill={colors.roof}
      />
      <path
        d={`M ${centerX + buildingSize/2 + 6} ${centerY - buildingSize/4}
            Q ${centerX + buildingSize/2 + 2} ${centerY - buildingSize/3}
            ${centerX + buildingSize/2 - 2} ${centerY - buildingSize/4 + 2}`}
        fill={colors.roof}
      />
    </g>
  );

  // Central main entrance with ornate doorway
  elements.push(
    <g key="main-entrance">
      <rect
        x={centerX - size * 0.12}
        y={centerY - buildingSize/6}
        width={size * 0.24}
        height={buildingSize/2.5}
        fill={colors.accent}
        stroke={colors.details}
        strokeWidth="2"
      />
      {/* Double doors */}
      <line
        x1={centerX}
        y1={centerY - buildingSize/6}
        x2={centerX}
        y2={centerY + buildingSize/6}
        stroke={colors.details}
        strokeWidth="2"
      />
    </g>
  );

  // Pillar/column support structure
  const pillarPositions = [
    centerX - buildingSize/3,
    centerX - buildingSize/6,
    centerX + buildingSize/6,
    centerX + buildingSize/3
  ];

  pillarPositions.forEach((pillarX, i) => {
    if (Math.abs(pillarX - centerX) > size * 0.12) { // Skip entrance area
      elements.push(
        <rect
          key={`pillar-${i}`}
          x={pillarX - 3}
          y={centerY - buildingSize/4}
          width="6"
          height={buildingSize/2}
          fill={colors.accent}
        />
      );
    }
  });

  // Decorative brackets under roof (Chinese architectural detail)
  elements.push(
    <g key="brackets">
      {pillarPositions.map((pillarX, i) => (
        <g key={`bracket-${i}`}>
          <rect
            x={pillarX - 4}
            y={centerY - buildingSize/4 - 3}
            width="8"
            height="3"
            fill={colors.details}
          />
          <rect
            x={pillarX - 6}
            y={centerY - buildingSize/4 - 6}
            width="12"
            height="3"
            fill={colors.details}
          />
        </g>
      ))}
    </g>
  );

  // Imperial or administrative symbol (dragon for Chinese, lotus for Indian)
  elements.push(
    <g key="imperial-symbol">
      {variant === 'indian' ? (
        // Lotus symbol for Indian raja courts
        <g transform={`translate(${centerX}, ${centerY - buildingSize/6})`}>
          <ellipse cx="0" cy="0" rx="6" ry="3" fill={colors.details} />
          <ellipse cx="0" cy="-2" rx="4" ry="2" fill={colors.roof} />
        </g>
      ) : (
        // Simplified dragon or imperial symbol for Chinese
        <g transform={`translate(${centerX}, ${centerY - buildingSize/6})`}>
          <circle cx="0" cy="0" r="4" fill={colors.details} />
          <rect x="-1" y="-6" width="2" height="4" fill={colors.details} />
          <polygon points="-3,-6 0,-9 3,-6" fill={colors.details} />
        </g>
      )}
    </g>
  );

  // Side wings or courtyards (typical of Chinese administrative complexes)
  elements.push(
    <g key="side-wings">
      <rect
        x={centerX - buildingSize/2 - size * 0.1}
        y={centerY - buildingSize/8}
        width={size * 0.1}
        height={buildingSize/4}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.8"
      />
      <rect
        x={centerX + buildingSize/2}
        y={centerY - buildingSize/8}
        width={size * 0.1}
        height={buildingSize/4}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.8"
      />
    </g>
  );

  // Stepped platform base (characteristic of important Chinese buildings)
  elements.push(
    <g key="platform-base">
      <rect
        x={centerX - buildingSize/2 - 2}
        y={centerY + buildingSize/4}
        width={buildingSize + 4}
        height="3"
        fill={colors.accent}
        opacity="0.7"
      />
      <rect
        x={centerX - buildingSize/2 - 4}
        y={centerY + buildingSize/4 + 3}
        width={buildingSize + 8}
        height="2"
        fill={colors.accent}
        opacity="0.5"
      />
    </g>
  );

  return (
    <g>
      {elements}
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(MandateHallSymbol);