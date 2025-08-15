/**
 * components/symbols/mines/AntiquityMine.tsx - Classical era mine with slaves/workers
 */
import React from 'react';

interface AntiquityMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const AntiquityMine: React.FC<AntiquityMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stone entrance structure */}
      <rect x={size * 0.2} y={size * 0.15} width={size * 0.6} height={size * 0.4} fill="#9B8B7A" />
      <rect x={size * 0.25} y={size * 0.2} width={size * 0.5} height={size * 0.3} fill="#7A6B5F" />
      
      {/* Mine entrance */}
      <rect x={size * 0.35} y={size * 0.25} width={size * 0.3} height={size * 0.25} fill="#1A0F08" />
      <rect x={size * 0.35} y={size * 0.25} width={size * 0.3} height={size * 0.05} fill="#2C1810" />
      
      {/* Stone pillars */}
      <rect x={size * 0.3} y={size * 0.2} width={size * 0.05} height={size * 0.3} fill="#B8A89A" />
      <rect x={size * 0.65} y={size * 0.2} width={size * 0.05} height={size * 0.3} fill="#B8A89A" />
      
      {/* Cart tracks */}
      <line x1={size * 0.4} y1={size * 0.5} x2={size * 0.4} y2={size * 0.9} stroke="#4A3426" strokeWidth="1" />
      <line x1={size * 0.6} y1={size * 0.5} x2={size * 0.6} y2={size * 0.9} stroke="#4A3426" strokeWidth="1" />
      
      {/* Mining cart */}
      <g>
        <rect fill="#5A4A3A" width={size * 0.15} height={size * 0.08}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.42} ${size * 0.55}; ${size * 0.42} ${size * 0.85}; ${size * 0.42} ${size * 0.55}`}
            dur="6s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Cart wheels */}
        <circle r={size * 0.02} fill="#3A2A1A">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.45} ${size * 0.63}; ${size * 0.45} ${size * 0.93}; ${size * 0.45} ${size * 0.63}`}
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r={size * 0.02} fill="#3A2A1A">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.55} ${size * 0.63}; ${size * 0.55} ${size * 0.93}; ${size * 0.55} ${size * 0.63}`}
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      {/* Workers with pickaxes */}
      <g>
        <ellipse rx={size * 0.015} ry={size * 0.025} fill="#8B6F47">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.25} ${size * 0.6}; ${size * 0.25} ${size * 0.58}; ${size * 0.25} ${size * 0.6}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Pickaxe */}
        <line stroke="#4A3426" strokeWidth="1">
          <animate
            attributeName="x1"
            values={`${size * 0.22}; ${size * 0.22}; ${size * 0.22}`}
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y1"
            values={`${size * 0.58}; ${size * 0.56}; ${size * 0.58}`}
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values={`${size * 0.2}; ${size * 0.19}; ${size * 0.2}`}
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="y2"
            values={`${size * 0.55}; ${size * 0.52}; ${size * 0.55}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </line>
      </g>
      
      {/* Oil lamps for lighting */}
      <circle cx={size * 0.32} cy={size * 0.3} r={size * 0.015} fill="#FFD700" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={size * 0.68} cy={size * 0.3} r={size * 0.015} fill="#FFD700" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
      
      {/* Ore pile */}
      <ellipse cx={size * 0.75} cy={size * 0.65} rx={size * 0.08} ry={size * 0.04} fill="#6B5D54" />
      <ellipse cx={size * 0.73} cy={size * 0.63} rx={size * 0.05} ry={size * 0.03} fill="#7A6B5F" />
    </g>
  );
};

export default AntiquityMine;