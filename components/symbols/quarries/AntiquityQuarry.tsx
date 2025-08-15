/**
 * components/symbols/quarries/AntiquityQuarry.tsx - Classical marble/limestone quarry
 */
import React from 'react';

interface AntiquityQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const AntiquityQuarry: React.FC<AntiquityQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stepped quarry face */}
      <rect x={size * 0.1} y={size * 0.2} width={size * 0.8} height={size * 0.1} fill="#E8E8E8" />
      <rect x={size * 0.15} y={size * 0.3} width={size * 0.7} height={size * 0.1} fill="#D8D8D8" />
      <rect x={size * 0.2} y={size * 0.4} width={size * 0.6} height={size * 0.1} fill="#C8C8C8" />
      <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.1} fill="#B8B8B8" />
      
      {/* Marble/limestone blocks */}
      <rect x={size * 0.7} y={size * 0.65} width={size * 0.15} height={size * 0.1} fill="#F0F0F0" stroke="#AAA" strokeWidth="0.5" />
      <rect x={size * 0.72} y={size * 0.55} width={size * 0.12} height={size * 0.09} fill="#EFEFEF" stroke="#AAA" strokeWidth="0.5" />
      <rect x={size * 0.15} y={size * 0.65} width={size * 0.14} height={size * 0.08} fill="#F2F2F2" stroke="#AAA" strokeWidth="0.5" />
      
      {/* Wooden crane structure */}
      <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.45} y2={size * 0.6} stroke="#8B6F47" strokeWidth="2" />
      <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.55} y2={size * 0.6} stroke="#8B6F47" strokeWidth="2" />
      <line x1={size * 0.45} y1={size * 0.3} x2={size * 0.55} y2={size * 0.3} stroke="#8B6F47" strokeWidth="1.5" />
      
      {/* Pulley and rope */}
      <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.02} fill="none" stroke="#6B5641" strokeWidth="1" />
      <line x1={size * 0.5} y1={size * 0.2} x2={size * 0.5} y2={size * 0.5} stroke="#8B7355" strokeWidth="1">
        <animate attributeName="y2" values={`${size * 0.5}; ${size * 0.7}; ${size * 0.5}`} dur="5s" repeatCount="indefinite" />
      </line>
      
      {/* Stone block being lifted */}
      <rect width={size * 0.08} height={size * 0.06} fill="#E0E0E0" stroke="#999" strokeWidth="0.5">
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${size * 0.46} ${size * 0.5}; ${size * 0.46} ${size * 0.3}; ${size * 0.46} ${size * 0.5}`}
          dur="5s"
          repeatCount="indefinite"
        />
      </rect>
      
      {/* Workers with chisels */}
      <g>
        <ellipse cx={size * 0.3} cy={size * 0.55} rx={size * 0.02} ry={size * 0.03} fill="#8B6F47" />
        <line x1={size * 0.28} y1={size * 0.53} x2={size * 0.25} y2={size * 0.5} stroke="#5A4A3A" strokeWidth="1">
          <animate attributeName="x2" values={`${size * 0.25}; ${size * 0.24}; ${size * 0.25}`} dur="0.5s" repeatCount="indefinite" />
        </line>
      </g>
      
      {/* Sledge for transporting blocks */}
      <rect x={size * 0.4} y={size * 0.75} width={size * 0.2} height={size * 0.03} fill="#6B5641" />
      <rect x={size * 0.42} y={size * 0.72} width={size * 0.16} height={size * 0.03} fill="#D0D0D0" stroke="#999" strokeWidth="0.5" />
      {/* Sledge runners */}
      <line x1={size * 0.38} y1={size * 0.78} x2={size * 0.62} y2={size * 0.78} stroke="#4A3C2A" strokeWidth="2" />
      
      {/* Lapis lazuli vein (for special quarries) */}
      <path d={`M ${size * 0.8} ${size * 0.35} Q ${size * 0.82} ${size * 0.38} ${size * 0.85} ${size * 0.4}`} 
            stroke="#4169E1" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  );
};

export default AntiquityQuarry;