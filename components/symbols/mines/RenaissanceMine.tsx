/**
 * components/symbols/mines/RenaissanceMine.tsx - Early modern mine with improved technology
 */
import React from 'react';

interface RenaissanceMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const RenaissanceMine: React.FC<RenaissanceMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stone building structure */}
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.4} fill="#9B8B7A" />
      <polygon points={`${size * 0.2},${size * 0.3} ${size * 0.5},${size * 0.15} ${size * 0.8},${size * 0.3}`} fill="#8B7355" />
      
      {/* Mine shaft entrance */}
      <rect x={size * 0.4} y={size * 0.45} width={size * 0.2} height={size * 0.25} fill="#0A0502" />
      <rect x={size * 0.38} y={size * 0.43} width={size * 0.24} height={size * 0.04} fill="#4A3426" />
      
      {/* Pulley system */}
      <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.5} y2={size * 0.43} stroke="#3A2A1A" strokeWidth="2" />
      <circle cx={size * 0.5} cy={size * 0.2} r={size * 0.03} fill="none" stroke="#4A3426" strokeWidth="2" />
      
      {/* Rope and bucket animation */}
      <line x1={size * 0.5} y1={size * 0.2} x2={size * 0.5} y2={size * 0.6} stroke="#8B7355" strokeWidth="1">
        <animate attributeName="y2" values={`${size * 0.6}; ${size * 0.8}; ${size * 0.6}`} dur="4s" repeatCount="indefinite" />
      </line>
      <rect width={size * 0.06} height={size * 0.04} fill="#5A4A3A">
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${size * 0.47} ${size * 0.6}; ${size * 0.47} ${size * 0.8}; ${size * 0.47} ${size * 0.6}`}
          dur="4s"
          repeatCount="indefinite"
        />
      </rect>
      
      {/* Horse-powered winch */}
      <g transform={`translate(${size * 0.75}, ${size * 0.55})`}>
        {/* Winch structure */}
        <circle r={size * 0.06} fill="none" stroke="#4A3426" strokeWidth="2" />
        <line x1={-size * 0.06} y1="0" x2={size * 0.06} y2="0" stroke="#5A4A3A" strokeWidth="3">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="6s"
            repeatCount="indefinite"
          />
        </line>
        {/* Horse (simplified) */}
        <ellipse cx={size * 0.1} cy="0" rx={size * 0.03} ry={size * 0.02} fill="#8B6F47">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="6s"
            repeatCount="indefinite"
            additive="sum"
          />
        </ellipse>
      </g>
      
      {/* Lanterns */}
      <rect x={size * 0.35} y={size * 0.5} width={size * 0.02} height={size * 0.03} fill="#FFD700" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x={size * 0.63} y={size * 0.5} width={size * 0.02} height={size * 0.03} fill="#FFD700" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.75s" />
      </rect>
      
      {/* Ore processing area */}
      <rect x={size * 0.1} y={size * 0.65} width={size * 0.15} height={size * 0.08} fill="#6B5D54" />
      <circle cx={size * 0.15} cy={size * 0.68} r={size * 0.02} fill="#7A6B5F" />
      <circle cx={size * 0.2} cy={size * 0.69} r={size * 0.015} fill="#8B7355" />
      
      {/* Smoke from smelting */}
      <circle r={size * 0.02} fill="#888" opacity="0.4">
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${size * 0.25} ${size * 0.3}; ${size * 0.27} ${size * 0.1}; ${size * 0.25} ${size * 0.3}`}
          dur="3s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.4;0.2;0" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

export default RenaissanceMine;