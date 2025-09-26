/**
 * SpinningWheelSymbol.tsx - Spinning wheel for textile production
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface SpinningWheelSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  isSpinning?: boolean;
  opacity?: number;
}

const SpinningWheelSymbol: React.FC<SpinningWheelSymbolProps> = ({
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  isSpinning = false,
  opacity = 1.0
}) => {
  // Get materials/colors based on culture
  const getMaterials = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        // Bamboo/lacquered wood
        return {
          wood: '#8B7355',
          woodLight: '#A0826D',
          woodDark: '#6B5B45',
          thread: '#FFFFFF',
          accent: '#8B0000',
          metal: '#4A4A4A'
        };
      case 'SOUTH_ASIAN':
        // Charkha style
        return {
          wood: '#8B4513',
          woodLight: '#A0522D',
          woodDark: '#654321',
          thread: '#F5DEB3',
          accent: '#FF6347',
          metal: '#5C4033'
        };
      case 'MENA':
        return {
          wood: '#8B6914',
          woodLight: '#B8860B',
          woodDark: '#6B5A00',
          thread: '#FFFAFA',
          accent: '#4169E1',
          metal: '#4A4A4A'
        };
      default: // European
        return {
          wood: '#654321',
          woodLight: '#8B5A3C',
          woodDark: '#4A3020',
          thread: '#FFF8DC',
          accent: '#8B4513',
          metal: '#2F4F4F'
        };
    }
  };

  const materials = getMaterials();

  // Wheel style based on culture
  const getWheelStyle = () => {
    if (culturalZone === 'SOUTH_ASIAN' && era < 1900) {
      return 'charkha'; // Gandhi's charkha style
    } else if (culturalZone === 'EAST_ASIAN') {
      return 'asian'; // Simpler, more vertical
    } else if (era < 1200) {
      return 'simple'; // Early medieval
    } else if (era > 1700) {
      return 'saxony'; // Saxony wheel
    }
    return 'standard'; // Standard spinning wheel
  };

  const style = getWheelStyle();

  const renderWheel = () => {
    const wheelRotation = isSpinning ? (
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from={`0 ${size * 0.3} ${size * 0.4}`}
        to={`360 ${size * 0.3} ${size * 0.4}`}
        dur="3s"
        repeatCount="indefinite"
      />
    ) : null;

    return (
      <g>
        {/* Base/stand */}
        <rect
          x={size * 0.15}
          y={size * 0.75}
          width={size * 0.7}
          height={size * 0.05}
          fill={materials.woodDark}
        />

        {/* Vertical supports */}
        <rect
          x={size * 0.18}
          y={size * 0.5}
          width={size * 0.04}
          height={size * 0.28}
          fill={materials.wood}
        />
        <rect
          x={size * 0.78}
          y={size * 0.5}
          width={size * 0.04}
          height={size * 0.28}
          fill={materials.wood}
        />

        {/* Main wheel */}
        <g>
          {/* Wheel rim */}
          <circle
            cx={size * 0.3}
            cy={size * 0.4}
            r={size * 0.2}
            fill="none"
            stroke={materials.wood}
            strokeWidth={3}
          >
            {wheelRotation}
          </circle>

          {/* Wheel spokes */}
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1={size * 0.3}
                y1={size * 0.4}
                x2={size * 0.3 + Math.cos(angle * Math.PI / 180) * size * 0.18}
                y2={size * 0.4 + Math.sin(angle * Math.PI / 180) * size * 0.18}
                stroke={materials.woodLight}
                strokeWidth={1}
              />
            ))}
            {wheelRotation}
          </g>

          {/* Wheel hub */}
          <circle
            cx={size * 0.3}
            cy={size * 0.4}
            r={size * 0.03}
            fill={materials.woodDark}
          >
            {wheelRotation}
          </circle>
        </g>

        {/* Flyer assembly */}
        <g>
          {/* Flyer support */}
          <rect
            x={size * 0.55}
            y={size * 0.35}
            width={size * 0.25}
            height={size * 0.03}
            fill={materials.wood}
          />

          {/* Bobbin */}
          <rect
            x={size * 0.62}
            y={size * 0.32}
            width={size * 0.06}
            height={size * 0.12}
            fill={materials.woodLight}
          />

          {/* Thread on bobbin */}
          <rect
            x={size * 0.63}
            y={size * 0.34}
            width={size * 0.04}
            height={size * 0.08}
            fill={materials.thread}
            opacity={0.9}
          />

          {/* Spindle */}
          <rect
            x={size * 0.64}
            y={size * 0.28}
            width={size * 0.02}
            height={size * 0.2}
            fill={materials.metal}
          />
        </g>

        {/* Drive band (connecting wheel to flyer) */}
        <path
          d={`M ${size * 0.3} ${size * 0.2}
              Q ${size * 0.45} ${size * 0.25}, ${size * 0.65} ${size * 0.32}
              L ${size * 0.65} ${size * 0.35}
              Q ${size * 0.45} ${size * 0.42}, ${size * 0.3} ${size * 0.6}`}
          fill="none"
          stroke={materials.thread}
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Treadle (foot pedal) */}
        <rect
          x={size * 0.25}
          y={size * 0.72}
          width={size * 0.15}
          height={size * 0.03}
          fill={materials.wood}
        />

        {/* Connecting rod (treadle to wheel) */}
        <line
          x1={size * 0.32}
          y1={size * 0.72}
          x2={size * 0.3}
          y2={size * 0.6}
          stroke={materials.woodDark}
          strokeWidth={2}
        />

        {/* Distaff (holds unspun fiber) */}
        {style !== 'charkha' && (
          <>
            <rect
              x={size * 0.72}
              y={size * 0.25}
              width={size * 0.02}
              height={size * 0.35}
              fill={materials.wood}
            />
            {/* Fiber bundle */}
            <ellipse
              cx={size * 0.73}
              cy={size * 0.28}
              rx={size * 0.04}
              ry={size * 0.08}
              fill={materials.thread}
              opacity={0.7}
            />
          </>
        )}

        {/* Cultural decorations */}
        {culturalZone === 'EAST_ASIAN' && (
          // Lacquered details
          <g>
            <circle
              cx={size * 0.3}
              cy={size * 0.4}
              r={size * 0.05}
              fill="none"
              stroke={materials.accent}
              strokeWidth={0.5}
              opacity={0.5}
            />
          </g>
        )}

        {culturalZone === 'SOUTH_ASIAN' && style === 'charkha' && (
          // Charkha specific design
          <g>
            <rect
              x={size * 0.4}
              y={size * 0.45}
              width={size * 0.3}
              height={size * 0.02}
              fill={materials.wood}
            />
          </g>
        )}

        {/* Thread being spun (if spinning) */}
        {isSpinning && (
          <line
            x1={size * 0.65}
            y1={size * 0.38}
            x2={size * 0.73}
            y2={size * 0.32}
            stroke={materials.thread}
            strokeWidth={0.5}
            opacity={0.8}
          >
            <animate
              attributeName="x2"
              values={`${size * 0.73};${size * 0.72};${size * 0.73}`}
              dur="0.5s"
              repeatCount="indefinite"
            />
          </line>
        )}

        {/* Bench/seat */}
        <rect
          x={size * 0.5}
          y={size * 0.65}
          width={size * 0.15}
          height={size * 0.03}
          fill={materials.wood}
        />
        <rect
          x={size * 0.52}
          y={size * 0.65}
          width={size * 0.02}
          height={size * 0.1}
          fill={materials.woodDark}
        />
        <rect
          x={size * 0.61}
          y={size * 0.65}
          width={size * 0.02}
          height={size * 0.1}
          fill={materials.woodDark}
        />

        {/* Shadow */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.85}
          rx={size * 0.4}
          ry={size * 0.08}
          fill="black"
          opacity={0.3}
        />

        {/* Highlights */}
        <circle
          cx={size * 0.3}
          cy={size * 0.4}
          r={size * 0.18}
          fill="none"
          stroke="white"
          strokeWidth={0.5}
          opacity={0.2}
        />
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
        {renderWheel()}
      </g>
    </svg>
  );
};

export default SpinningWheelSymbol;