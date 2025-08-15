/**
 * components/symbols/quarries/PrehistoricQuarry.tsx - Stone age quarry for flint/obsidian
 */
import React from 'react';

interface PrehistoricQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const PrehistoricQuarry: React.FC<PrehistoricQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Open pit quarry */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.4} ry={size * 0.25} fill="#8B7355" />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.35} ry={size * 0.2} fill="#6B5D54" />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.12} fill="#4A3C2A" />
      
      {/* Rock layers visible on sides */}
      <line x1={size * 0.15} y1={size * 0.45} x2={size * 0.25} y2={size * 0.48} stroke="#7A6B5F" strokeWidth="1" />
      <line x1={size * 0.75} y1={size * 0.48} x2={size * 0.85} y2={size * 0.45} stroke="#7A6B5F" strokeWidth="1" />
      <line x1={size * 0.2} y1={size * 0.52} x2={size * 0.3} y2={size * 0.54} stroke="#6B5D54" strokeWidth="1" />
      <line x1={size * 0.7} y1={size * 0.54} x2={size * 0.8} y2={size * 0.52} stroke="#6B5D54" strokeWidth="1" />
      
      {/* Ochre/obsidian deposits (colored patches) */}
      <ellipse cx={size * 0.35} cy={size * 0.48} rx={size * 0.04} ry={size * 0.02} fill="#B8860B" opacity="0.7" />
      <ellipse cx={size * 0.65} cy={size * 0.52} rx={size * 0.03} ry={size * 0.02} fill="#1C1C1C" opacity="0.8" />
      <ellipse cx={size * 0.45} cy={size * 0.55} rx={size * 0.05} ry={size * 0.02} fill="#CD853F" opacity="0.6" />
      
      {/* Stone tools and knapping debris */}
      <polygon points={`${size * 0.2},${size * 0.35} ${size * 0.22},${size * 0.33} ${size * 0.21},${size * 0.37}`} fill="#5A4A3A" />
      <polygon points={`${size * 0.78},${size * 0.38} ${size * 0.8},${size * 0.36} ${size * 0.79},${size * 0.4}`} fill="#4A3C2A" />
      <circle cx={size * 0.25} cy={size * 0.4} r={size * 0.015} fill="#6B5D54" />
      <circle cx={size * 0.75} cy={size * 0.42} r={size * 0.012} fill="#7A6B5F" />
      
      {/* Workers with stone hammers */}
      {[0, 1].map(i => (
        <g key={i}>
          <circle r={size * 0.025} fill="#8B6F47">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${size * (0.3 + i * 0.4)} ${size * 0.4}; ${size * (0.3 + i * 0.4)} ${size * 0.38}; ${size * (0.3 + i * 0.4)} ${size * 0.4}`}
              dur="1.5s"
              begin={`${i * 0.75}s`}
              repeatCount="indefinite"
            />
          </circle>
          {/* Stone hammer */}
          <ellipse rx={size * 0.015} ry={size * 0.01} fill="#5A4A3A">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${size * (0.28 + i * 0.4)} ${size * 0.37}; ${size * (0.28 + i * 0.4)} ${size * 0.35}; ${size * (0.28 + i * 0.4)} ${size * 0.37}`}
              dur="1.5s"
              begin={`${i * 0.75}s`}
              repeatCount="indefinite"
            />
          </ellipse>
        </g>
      ))}
      
      {/* Baskets for collecting */}
      <ellipse cx={size * 0.15} cy={size * 0.6} rx={size * 0.03} ry={size * 0.02} fill="#8B7355" />
      <ellipse cx={size * 0.85} cy={size * 0.6} rx={size * 0.03} ry={size * 0.02} fill="#8B7355" />
    </g>
  );
};

export default PrehistoricQuarry;