/**
 * components/symbols/quarries/ModernQuarry.tsx - Modern quarry with heavy machinery
 */
import React from 'react';

interface ModernQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const ModernQuarry: React.FC<ModernQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Massive open pit */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.45} ry={size * 0.3} fill="#7A6A5A" />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.38} ry={size * 0.25} fill="#6A5A4A" />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.3} ry={size * 0.18} fill="#5A4A3A" />
      
      {/* Spiral road around pit */}
      <path d={`M ${size * 0.85} ${size * 0.5} Q ${size * 0.7} ${size * 0.35} ${size * 0.5} ${size * 0.32} T ${size * 0.2} ${size * 0.45}`} 
            stroke="#8B8B8B" strokeWidth="2" fill="none" />
      
      {/* Excavator */}
      <g transform={`translate(${size * 0.65}, ${size * 0.4})`}>
        {/* Body */}
        <rect x={0} y={0} width={size * 0.08} height={size * 0.06} fill="#FFD700" />
        {/* Cab */}
        <rect x={size * 0.02} y={-size * 0.02} width={size * 0.04} height={size * 0.04} fill="#FFA500" />
        {/* Arm */}
        <line x1={size * 0.08} y1={size * 0.02} x2={size * 0.15} y2={-size * 0.02} stroke="#FFD700" strokeWidth="2">
          <animate attributeName="y2" values={`${-size * 0.02}; ${size * 0.02}; ${-size * 0.02}`} dur="3s" repeatCount="indefinite" />
        </line>
        {/* Bucket */}
        <path d={`M ${size * 0.14} ${-size * 0.02} L ${size * 0.17} ${0} L ${size * 0.16} ${size * 0.02} L ${size * 0.13} ${0} Z`} fill="#FFA500">
          <animate attributeName="d" 
                   values={`M ${size * 0.14} ${-size * 0.02} L ${size * 0.17} ${0} L ${size * 0.16} ${size * 0.02} L ${size * 0.13} ${0} Z;
                           M ${size * 0.14} ${size * 0.02} L ${size * 0.17} ${size * 0.04} L ${size * 0.16} ${size * 0.06} L ${size * 0.13} ${size * 0.04} Z;
                           M ${size * 0.14} ${-size * 0.02} L ${size * 0.17} ${0} L ${size * 0.16} ${size * 0.02} L ${size * 0.13} ${0} Z`} 
                   dur="3s" repeatCount="indefinite" />
        </path>
        {/* Tracks */}
        <rect x={-size * 0.01} y={size * 0.06} width={size * 0.1} height={size * 0.02} fill="#333" rx="1" />
      </g>
      
      {/* Dump truck */}
      <g>
        <rect fill="#FF6B35" width={size * 0.12} height={size * 0.07}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.2} ${size * 0.6}; ${size * 0.7} ${size * 0.6}; ${size * 0.2} ${size * 0.6}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Cab */}
        <rect fill="#FF4500" width={size * 0.04} height={size * 0.05}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.2} ${size * 0.62}; ${size * 0.7} ${size * 0.62}; ${size * 0.2} ${size * 0.62}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Wheels */}
        <circle r={size * 0.015} fill="#333">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.23} ${size * 0.68}; ${size * 0.73} ${size * 0.68}; ${size * 0.23} ${size * 0.68}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r={size * 0.015} fill="#333">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.29} ${size * 0.68}; ${size * 0.79} ${size * 0.68}; ${size * 0.29} ${size * 0.68}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      {/* Conveyor system */}
      <rect x={size * 0.05} y={size * 0.75} width={size * 0.4} height={size * 0.03} fill="#6A6A6A" />
      <rect x={size * 0.05} y={size * 0.78} width={size * 0.4} height={size * 0.02} fill="#5A5A5A" />
      
      {/* Control tower */}
      <rect x={size * 0.85} y={size * 0.65} width={size * 0.08} height={size * 0.12} fill="#9B9B9B" />
      <rect x={size * 0.86} y={size * 0.67} width={size * 0.06} height={size * 0.03} fill="#ADD8E6" opacity="0.7" />
      
      {/* Warning lights */}
      <circle cx={size * 0.1} cy={size * 0.3} r={size * 0.01} fill="#FF0000">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx={size * 0.9} cy={size * 0.3} r={size * 0.01} fill="#FF0000">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.5s" />
      </circle>
    </g>
  );
};

export default ModernQuarry;