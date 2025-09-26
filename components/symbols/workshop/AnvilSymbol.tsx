/**
 * AnvilSymbol.tsx - Blacksmith's anvil with cultural variations
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface AnvilSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const AnvilSymbol: React.FC<AnvilSymbolProps> = ({
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  opacity = 1.0
}) => {
  // Get materials/colors based on culture and era
  const getMaterials = () => {
    // Era-based materials
    if (era < -500) {
      // Bronze age - more primitive
      return {
        metal: '#8B6914',
        metalLight: '#B8860B',
        metalDark: '#654321',
        highlight: '#DAA520',
        shadow: '#3E2723'
      };
    } else if (era < 1800) {
      // Iron age to pre-industrial
      return {
        metal: '#4A4A4A',
        metalLight: '#6B6B6B',
        metalDark: '#2C2C2C',
        highlight: '#8A8A8A',
        shadow: '#1A1A1A'
      };
    } else {
      // Industrial era - refined steel
      return {
        metal: '#5C5C5C',
        metalLight: '#7D7D7D',
        metalDark: '#3A3A3A',
        highlight: '#9A9A9A',
        shadow: '#0A0A0A'
      };
    }
  };

  const materials = getMaterials();

  // Cultural style variations
  const getAnvilStyle = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        // Japanese/Chinese style - more angular
        return 'angular';
      case 'MENA':
      case 'SOUTH_ASIAN':
        // Damascus/Indian style - decorated
        return 'decorated';
      default:
        // European style - classic
        return 'classic';
    }
  };

  const style = getAnvilStyle();

  const renderAnvil = () => {
    return (
      <g>
        {/* Base/stand */}
        <rect
          x={size * 0.35}
          y={size * 0.65}
          width={size * 0.3}
          height={size * 0.25}
          fill={materials.metalDark}
        />

        {/* Base highlight */}
        <rect
          x={size * 0.35}
          y={size * 0.65}
          width={size * 0.28}
          height={2}
          fill={materials.highlight}
          opacity={0.3}
        />

        {/* Main anvil body - working surface */}
        <path
          d={`M ${size * 0.2} ${size * 0.45}
              L ${size * 0.8} ${size * 0.45}
              L ${size * 0.75} ${size * 0.65}
              L ${size * 0.25} ${size * 0.65}
              Z`}
          fill={materials.metal}
        />

        {/* Horn (pointed end) */}
        <path
          d={`M ${size * 0.2} ${size * 0.45}
              Q ${size * 0.1} ${size * 0.45}, ${size * 0.05} ${size * 0.5}
              L ${size * 0.15} ${size * 0.55}
              L ${size * 0.25} ${size * 0.55}
              Z`}
          fill={materials.metal}
        />

        {/* Heel (flat end) */}
        <rect
          x={size * 0.75}
          y={size * 0.45}
          width={size * 0.15}
          height={size * 0.15}
          fill={materials.metal}
        />

        {/* Top working surface */}
        <rect
          x={size * 0.2}
          y={size * 0.4}
          width={size * 0.6}
          height={size * 0.05}
          fill={materials.metalLight}
        />

        {/* Wear marks on working surface */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.425}
          rx={size * 0.15}
          ry={size * 0.015}
          fill={materials.metalDark}
          opacity={0.5}
        />

        {/* Cultural decorations */}
        {style === 'decorated' && (
          <>
            {/* Decorative patterns for MENA/South Asian */}
            <circle
              cx={size * 0.5}
              cy={size * 0.55}
              r={size * 0.03}
              fill="none"
              stroke={materials.highlight}
              strokeWidth={0.5}
              opacity={0.5}
            />
            <path
              d={`M ${size * 0.4} ${size * 0.55}
                  L ${size * 0.45} ${size * 0.5}
                  L ${size * 0.5} ${size * 0.55}
                  L ${size * 0.55} ${size * 0.5}
                  L ${size * 0.6} ${size * 0.55}`}
              fill="none"
              stroke={materials.highlight}
              strokeWidth={0.5}
              opacity={0.5}
            />
          </>
        )}

        {/* Hardy hole (square hole for tools) */}
        <rect
          x={size * 0.65}
          y={size * 0.42}
          width={size * 0.04}
          height={size * 0.04}
          fill={materials.shadow}
        />

        {/* Pritchel hole (round hole) */}
        <circle
          cx={size * 0.72}
          cy={size * 0.44}
          r={size * 0.015}
          fill={materials.shadow}
        />

        {/* Edge highlights */}
        <path
          d={`M ${size * 0.2} ${size * 0.4}
              L ${size * 0.8} ${size * 0.4}
              L ${size * 0.8} ${size * 0.42}`}
          fill="none"
          stroke={materials.highlight}
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Shadow */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.88}
          rx={size * 0.35}
          ry={size * 0.08}
          fill="black"
          opacity={0.4}
        />

        {/* Hammer marks (signs of use) */}
        {era > -500 && (
          <>
            <circle cx={size * 0.45} cy={size * 0.42} r={1} fill={materials.metalDark} opacity={0.3} />
            <circle cx={size * 0.52} cy={size * 0.43} r={1} fill={materials.metalDark} opacity={0.3} />
            <circle cx={size * 0.48} cy={size * 0.425} r={0.8} fill={materials.metalDark} opacity={0.3} />
            <circle cx={size * 0.55} cy={size * 0.42} r={0.9} fill={materials.metalDark} opacity={0.3} />
          </>
        )}

        {/* Angular style for East Asian */}
        {style === 'angular' && (
          <>
            {/* More angular horn */}
            <path
              d={`M ${size * 0.2} ${size * 0.45}
                  L ${size * 0.15} ${size * 0.45}
                  L ${size * 0.1} ${size * 0.5}
                  L ${size * 0.15} ${size * 0.5}
                  Z`}
              fill={materials.metal}
            />
          </>
        )}
      </g>
    );
  };

  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g opacity={opacity}>
        {renderAnvil()}
      </g>
    </svg>
  );
};

export default AnvilSymbol;