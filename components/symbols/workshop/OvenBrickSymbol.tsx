/**
 * OvenBrickSymbol.tsx - Brick oven/kiln for bakeries and pottery
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface OvenBrickSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  isLit?: boolean;
  type?: 'oven' | 'kiln';
  opacity?: number;
}

const OvenBrickSymbol: React.FC<OvenBrickSymbolProps> = ({
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  isLit = true,
  type = 'oven',
  opacity = 1.0
}) => {
  // Get materials/colors based on culture and type
  const getMaterials = () => {
    const baseColors = {
      brick: '#8B4513',
      brickLight: '#A0522D',
      brickDark: '#654321',
      mortar: '#D2B48C',
      metal: '#2F4F4F',
      fire: '#FF4500',
      fireGlow: '#FFA500',
      smoke: '#696969'
    };

    // Cultural variations
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        // Ceramic/clay style
        return {
          ...baseColors,
          brick: '#704214',
          brickLight: '#8B5A2B',
          special: '#CD853F' // Terracotta
        };
      case 'MENA':
      case 'SOUTH_ASIAN':
        // Adobe/tandoor style
        return {
          ...baseColors,
          brick: '#DEB887',
          brickLight: '#F4E4C1',
          brickDark: '#D2691E',
          special: '#FFE4B5'
        };
      case 'SUB_SAHARAN_AFRICAN':
        // Clay/earth oven
        return {
          ...baseColors,
          brick: '#8B4513',
          brickLight: '#A0522D',
          special: '#CD853F'
        };
      default:
        return baseColors;
    }
  };

  const materials = getMaterials();

  // Oven style based on culture and era
  const getOvenStyle = () => {
    if (culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN') {
      return 'dome'; // Tandoor/dome oven
    } else if (culturalZone === 'EAST_ASIAN' && type === 'kiln') {
      return 'climbing'; // Climbing kiln style
    } else if (era < 0) {
      return 'primitive'; // Ancient clay oven
    } else if (era > 1800) {
      return 'industrial'; // Industrial brick oven
    }
    return 'traditional'; // Traditional European brick oven
  };

  const style = getOvenStyle();

  const renderOven = () => {
    return (
      <g>
        {/* Base platform */}
        <rect
          x={size * 0.15}
          y={size * 0.7}
          width={size * 0.7}
          height={size * 0.2}
          fill={materials.brickDark}
        />

        {/* Main oven body */}
        {style === 'dome' ? (
          // Dome/tandoor style
          <ellipse
            cx={size * 0.5}
            cy={size * 0.55}
            rx={size * 0.35}
            ry={size * 0.3}
            fill={materials.brick}
          />
        ) : (
          // Rectangular brick oven
          <rect
            x={size * 0.2}
            y={size * 0.3}
            width={size * 0.6}
            height={size * 0.45}
            fill={materials.brick}
          />
        )}

        {/* Brick pattern */}
        {style !== 'primitive' && (
          <>
            {/* Horizontal mortar lines */}
            {[0.35, 0.42, 0.49, 0.56, 0.63].map((yPos, i) => (
              <rect
                key={`h-mortar-${i}`}
                x={size * 0.2}
                y={size * yPos}
                width={size * 0.6}
                height={1}
                fill={materials.mortar}
                opacity={0.5}
              />
            ))}
            {/* Vertical mortar lines */}
            {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
              <rect
                key={`v-mortar-${i}`}
                x={size * xPos}
                y={size * 0.3}
                width={1}
                height={size * 0.45}
                fill={materials.mortar}
                opacity={0.3}
              />
            ))}
          </>
        )}

        {/* Oven opening */}
        <path
          d={style === 'dome'
            ? `M ${size * 0.4} ${size * 0.65}
               Q ${size * 0.4} ${size * 0.5}, ${size * 0.5} ${size * 0.5}
               Q ${size * 0.6} ${size * 0.5}, ${size * 0.6} ${size * 0.65}
               Z`
            : `M ${size * 0.4} ${size * 0.65}
               L ${size * 0.4} ${size * 0.5}
               Q ${size * 0.4} ${size * 0.45}, ${size * 0.45} ${size * 0.45}
               L ${size * 0.55} ${size * 0.45}
               Q ${size * 0.6} ${size * 0.45}, ${size * 0.6} ${size * 0.5}
               L ${size * 0.6} ${size * 0.65}
               Z`}
          fill="black"
        />

        {/* Fire inside (if lit) */}
        {isLit && (
          <>
            {/* Fire glow */}
            <ellipse
              cx={size * 0.5}
              cy={size * 0.58}
              rx={size * 0.08}
              ry={size * 0.06}
              fill={materials.fireGlow}
              opacity={0.8}
            >
              <animate
                attributeName="opacity"
                values="0.6;0.9;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </ellipse>

            {/* Fire flames */}
            <path
              d={`M ${size * 0.47} ${size * 0.6}
                  Q ${size * 0.47} ${size * 0.55}, ${size * 0.48} ${size * 0.52}
                  Q ${size * 0.5} ${size * 0.55}, ${size * 0.5} ${size * 0.6}
                  Q ${size * 0.5} ${size * 0.55}, ${size * 0.52} ${size * 0.52}
                  Q ${size * 0.53} ${size * 0.55}, ${size * 0.53} ${size * 0.6}
                  Z`}
              fill={materials.fire}
              opacity={0.9}
            >
              <animate
                attributeName="d"
                values={`M ${size * 0.47} ${size * 0.6} Q ${size * 0.47} ${size * 0.55}, ${size * 0.48} ${size * 0.52} Q ${size * 0.5} ${size * 0.55}, ${size * 0.5} ${size * 0.6} Q ${size * 0.5} ${size * 0.55}, ${size * 0.52} ${size * 0.52} Q ${size * 0.53} ${size * 0.55}, ${size * 0.53} ${size * 0.6} Z;
                        M ${size * 0.47} ${size * 0.6} Q ${size * 0.47} ${size * 0.56}, ${size * 0.48} ${size * 0.53} Q ${size * 0.5} ${size * 0.54}, ${size * 0.5} ${size * 0.6} Q ${size * 0.5} ${size * 0.54}, ${size * 0.52} ${size * 0.53} Q ${size * 0.53} ${size * 0.56}, ${size * 0.53} ${size * 0.6} Z;
                        M ${size * 0.47} ${size * 0.6} Q ${size * 0.47} ${size * 0.55}, ${size * 0.48} ${size * 0.52} Q ${size * 0.5} ${size * 0.55}, ${size * 0.5} ${size * 0.6} Q ${size * 0.5} ${size * 0.55}, ${size * 0.52} ${size * 0.52} Q ${size * 0.53} ${size * 0.55}, ${size * 0.53} ${size * 0.6} Z`}
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {/* Chimney */}
        {style !== 'primitive' && (
          <>
            <rect
              x={size * 0.65}
              y={size * 0.15}
              width={size * 0.12}
              height={size * 0.25}
              fill={materials.brick}
            />
            {/* Chimney top */}
            <rect
              x={size * 0.63}
              y={size * 0.13}
              width={size * 0.16}
              height={size * 0.04}
              fill={materials.brickDark}
            />
          </>
        )}

        {/* Smoke (if lit) */}
        {isLit && style !== 'primitive' && (
          <g>
            <ellipse
              cx={size * 0.71}
              cy={size * 0.08}
              rx={size * 0.04}
              ry={size * 0.06}
              fill={materials.smoke}
              opacity={0.3}
            >
              <animate
                attributeName="cy"
                values={`${size * 0.08};${size * 0.0};${size * 0.08}`}
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0.1;0.3"
                dur="4s"
                repeatCount="indefinite"
              />
            </ellipse>
          </g>
        )}

        {/* Metal door/tools for industrial era */}
        {era > 1800 && (
          <rect
            x={size * 0.38}
            y={size * 0.45}
            width={size * 0.24}
            height={size * 0.2}
            fill={materials.metal}
            opacity={0.7}
          />
        )}

        {/* Cultural decorations */}
        {culturalZone === 'MENA' && (
          // Geometric pattern
          <g opacity={0.3}>
            <path
              d={`M ${size * 0.3} ${size * 0.35}
                  L ${size * 0.35} ${size * 0.3}
                  L ${size * 0.4} ${size * 0.35}
                  L ${size * 0.35} ${size * 0.4}
                  Z`}
              fill={materials.special}
            />
          </g>
        )}

        {/* Type-specific details */}
        {type === 'kiln' && (
          // Kiln shelving visible through opening
          <>
            <rect
              x={size * 0.42}
              y={size * 0.52}
              width={size * 0.16}
              height={1}
              fill={materials.metal}
              opacity={0.5}
            />
            <rect
              x={size * 0.42}
              y={size * 0.57}
              width={size * 0.16}
              height={1}
              fill={materials.metal}
              opacity={0.5}
            />
          </>
        )}

        {/* Shadow */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.88}
          rx={size * 0.4}
          ry={size * 0.1}
          fill="black"
          opacity={0.4}
        />

        {/* Highlights */}
        <rect
          x={size * 0.2}
          y={size * 0.3}
          width={size * 0.58}
          height={2}
          fill="white"
          opacity={0.1}
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
        {renderOven()}
      </g>
    </svg>
  );
};

export default OvenBrickSymbol;