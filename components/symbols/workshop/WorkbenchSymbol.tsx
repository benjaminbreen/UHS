/**
 * WorkbenchSymbol.tsx - Carpentry workbench with tools
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface WorkbenchSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  hasTools?: boolean;
  opacity?: number;
}

const WorkbenchSymbol: React.FC<WorkbenchSymbolProps> = ({
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  hasTools = true,
  opacity = 1.0
}) => {
  // Get materials/colors based on culture
  const getMaterials = () => {
    const base = {
      wood: '#654321',
      woodLight: '#8B5A3C',
      woodDark: '#4A3020',
      metal: '#4A4A4A',
      metalLight: '#6B6B6B',
      sawdust: '#D2B48C',
      vise: '#2F4F4F'
    };

    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        // Japanese woodworking bench
        return {
          ...base,
          wood: '#5C4033',
          woodLight: '#704214',
          woodDark: '#3E2818',
          accent: '#8B0000'
        };
      case 'SOUTH_ASIAN':
        // Teak wood
        return {
          ...base,
          wood: '#8B6914',
          woodLight: '#B8860B',
          woodDark: '#6B5A00'
        };
      case 'SUB_SAHARAN_AFRICAN':
        // African hardwood
        return {
          ...base,
          wood: '#3E2818',
          woodLight: '#5C3D28',
          woodDark: '#2A1A10'
        };
      case 'NORTH_AMERICAN_COLONIAL':
        // Oak/pine
        return {
          ...base,
          wood: '#8B7355',
          woodLight: '#A0826D',
          woodDark: '#6B5B45'
        };
      default:
        return base;
    }
  };

  const materials = getMaterials();

  // Bench style based on culture and era
  const getBenchStyle = () => {
    if (culturalZone === 'EAST_ASIAN') {
      return 'japanese'; // Lower, simpler design
    } else if (era < 1000) {
      return 'primitive'; // Simple plank bench
    } else if (era > 1800) {
      return 'industrial'; // With vises and modern tools
    }
    return 'traditional';
  };

  const style = getBenchStyle();

  const renderWorkbench = () => {
    return (
      <g>
        {/* Bench top */}
        <rect
          x={size * 0.15}
          y={size * 0.45}
          width={size * 0.7}
          height={size * 0.12}
          fill={materials.wood}
        />

        {/* Wood grain on top */}
        {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((xPos, i) => (
          <line
            key={`grain-${i}`}
            x1={size * xPos}
            y1={size * 0.45}
            x2={size * xPos}
            y2={size * 0.57}
            stroke={materials.woodDark}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Bench edge detail */}
        <rect
          x={size * 0.15}
          y={size * 0.55}
          width={size * 0.7}
          height={size * 0.02}
          fill={materials.woodDark}
        />

        {/* Legs */}
        <rect
          x={size * 0.18}
          y={size * 0.57}
          width={size * 0.06}
          height={size * 0.28}
          fill={materials.woodDark}
        />
        <rect
          x={size * 0.76}
          y={size * 0.57}
          width={size * 0.06}
          height={size * 0.28}
          fill={materials.woodDark}
        />

        {/* Cross braces */}
        <rect
          x={size * 0.18}
          y={size * 0.7}
          width={size * 0.64}
          height={size * 0.03}
          fill={materials.wood}
        />
        <rect
          x={size * 0.18}
          y={size * 0.8}
          width={size * 0.64}
          height={size * 0.03}
          fill={materials.wood}
        />

        {/* Tool well/groove */}
        <rect
          x={size * 0.2}
          y={size * 0.46}
          width={size * 0.6}
          height={size * 0.015}
          fill={materials.woodDark}
          opacity={0.5}
        />

        {/* Vise (for industrial/traditional) */}
        {style !== 'primitive' && style !== 'japanese' && (
          <g>
            {/* Vise body */}
            <rect
              x={size * 0.15}
              y={size * 0.42}
              width={size * 0.08}
              height={size * 0.15}
              fill={materials.vise}
            />
            {/* Vise screw */}
            <circle
              cx={size * 0.11}
              cy={size * 0.5}
              r={size * 0.02}
              fill={materials.metal}
            />
            {/* Vise handle */}
            <rect
              x={size * 0.08}
              y={size * 0.49}
              width={size * 0.06}
              height={size * 0.02}
              fill={materials.metalLight}
            />
          </g>
        )}

        {/* Tools (if present) */}
        {hasTools && (
          <>
            {/* Saw hanging on side */}
            <g transform={`translate(${size * 0.87}, ${size * 0.5})`}>
              <path
                d="M 0 0 L 15 0 L 15 5 L 0 8 Z"
                fill={materials.metal}
                transform="scale(0.8)"
              />
              <rect x={0} y={6} width={3} height={8} fill={materials.woodDark} />
            </g>

            {/* Hammer on bench */}
            <g transform={`translate(${size * 0.35}, ${size * 0.43})`}>
              <rect x={0} y={0} width={size * 0.06} height={size * 0.02} fill={materials.metal} />
              <rect x={size * 0.02} y={size * 0.02} width={size * 0.02} height={size * 0.06} fill={materials.woodDark} />
            </g>

            {/* Chisel set */}
            <g>
              {[0.5, 0.52, 0.54].map((xPos, i) => (
                <rect
                  key={`chisel-${i}`}
                  x={size * xPos}
                  y={size * 0.44}
                  width={size * 0.01}
                  height={size * 0.05}
                  fill={materials.metal}
                />
              ))}
            </g>

            {/* Plane */}
            <g transform={`translate(${size * 0.65}, ${size * 0.43})`}>
              <rect x={0} y={0} width={size * 0.08} height={size * 0.03} fill={materials.wood} />
              <rect x={size * 0.02} y={size * 0.025} width={size * 0.04} height={size * 0.003} fill={materials.metal} />
            </g>

            {/* Square/ruler */}
            <g>
              <rect
                x={size * 0.25}
                y={size * 0.44}
                width={size * 0.08}
                height={size * 0.01}
                fill={materials.metal}
              />
              <rect
                x={size * 0.25}
                y={size * 0.44}
                width={size * 0.01}
                height={size * 0.04}
                fill={materials.metal}
              />
            </g>
          </>
        )}

        {/* Japanese style additions */}
        {style === 'japanese' && (
          <>
            {/* Lower profile, no vise */}
            <rect
              x={size * 0.15}
              y={size * 0.52}
              width={size * 0.7}
              height={size * 0.05}
              fill={materials.woodLight}
            />
            {/* Planing stop */}
            <rect
              x={size * 0.8}
              y={size * 0.43}
              width={size * 0.02}
              height={size * 0.02}
              fill={materials.woodDark}
            />
          </>
        )}

        {/* Wood shavings/sawdust */}
        <g opacity={0.5}>
          <ellipse
            cx={size * 0.3}
            cy={size * 0.86}
            rx={size * 0.08}
            ry={size * 0.02}
            fill={materials.sawdust}
          />
          <ellipse
            cx={size * 0.7}
            cy={size * 0.87}
            rx={size * 0.06}
            ry={size * 0.015}
            fill={materials.sawdust}
          />
        </g>

        {/* Shelf underneath (for storage) */}
        <rect
          x={size * 0.2}
          y={size * 0.75}
          width={size * 0.6}
          height={size * 0.02}
          fill={materials.wood}
        />

        {/* Items on shelf */}
        {hasTools && (
          <>
            <rect
              x={size * 0.25}
              y={size * 0.72}
              width={size * 0.15}
              height={size * 0.03}
              fill={materials.woodLight}
              opacity={0.7}
            />
            <rect
              x={size * 0.45}
              y={size * 0.73}
              width={size * 0.1}
              height={size * 0.02}
              fill={materials.metal}
              opacity={0.7}
            />
          </>
        )}

        {/* Industrial additions */}
        {style === 'industrial' && era > 1800 && (
          <>
            {/* Metal reinforcements */}
            <rect
              x={size * 0.15}
              y={size * 0.57}
              width={size * 0.7}
              height={size * 0.005}
              fill={materials.metal}
            />
            {/* Bench dogs (work holding) */}
            <circle cx={size * 0.3} cy={size * 0.5} r={size * 0.01} fill={materials.metal} />
            <circle cx={size * 0.7} cy={size * 0.5} r={size * 0.01} fill={materials.metal} />
          </>
        )}

        {/* Shadow */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.88}
          rx={size * 0.4}
          ry={size * 0.08}
          fill="black"
          opacity={0.4}
        />

        {/* Highlights */}
        <rect
          x={size * 0.15}
          y={size * 0.45}
          width={size * 0.68}
          height={size * 0.01}
          fill="white"
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
        {renderWorkbench()}
      </g>
    </svg>
  );
};

export default WorkbenchSymbol;