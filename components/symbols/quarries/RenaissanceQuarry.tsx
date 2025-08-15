/**
 * components/symbols/quarries/RenaissanceQuarry.tsx - Renaissance quarry with improved techniques
 */
import React from 'react';

interface RenaissanceQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const RenaissanceQuarry: React.FC<RenaissanceQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Terraced quarry */}
      <polygon points={`${size * 0.1},${size * 0.3} ${size * 0.9},${size * 0.3} ${size * 0.85},${size * 0.4} ${size * 0.15},${size * 0.4}`} fill="#D4C5B0" />
      <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.85},${size * 0.4} ${size * 0.8},${size * 0.5} ${size * 0.2},${size * 0.5}`} fill="#C8B9A4" />
      <polygon points={`${size * 0.2},${size * 0.5} ${size * 0.8},${size * 0.5} ${size * 0.75},${size * 0.6} ${size * 0.25},${size * 0.6}`} fill="#BCAD98" />
      
      {/* Derrick crane */}
      <line x1={size * 0.6} y1={size * 0.15} x2={size * 0.55} y2={size * 0.55} stroke="#6B5641" strokeWidth="2" />
      <line x1={size * 0.6} y1={size * 0.15} x2={size * 0.65} y2={size * 0.55} stroke="#6B5641" strokeWidth="2" />
      <line x1={size * 0.6} y1={size * 0.15} x2={size * 0.6} y2={size * 0.55} stroke="#6B5641" strokeWidth="2" />
      {/* Crane arm */}
      <line x1={size * 0.6} y1={size * 0.2} x2={size * 0.45} y2={size * 0.25} stroke="#8B6F47" strokeWidth="1.5">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 0 0; 20 0 0; 0 0 0"
          dur="6s"
          repeatCount="indefinite"
          additive="sum"
        />
      </line>
      
      {/* Pulley system */}
      <circle cx={size * 0.45} cy={size * 0.25} r={size * 0.015} fill="none" stroke="#5A4A3A" strokeWidth="1" />
      <line x1={size * 0.45} y1={size * 0.27} x2={size * 0.45} y2={size * 0.48} stroke="#8B7355" strokeWidth="0.8">
        <animate attributeName="y2" values="0.48; 0.58; 0.48" dur="6s" repeatCount="indefinite" />
      </line>
      
      {/* Fine marble block */}
      <rect width={size * 0.1} height={size * 0.07} fill="#F5F5F5" stroke="#AAA" strokeWidth="0.5">
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${size * 0.4} ${size * 0.48}; ${size * 0.4} ${size * 0.38}; ${size * 0.4} ${size * 0.48}`}
          dur="6s"
          repeatCount="indefinite"
        />
      </rect>
      
      {/* Water-powered saw */}
      <rect x={size * 0.25} y={size * 0.65} width={size * 0.2} height={size * 0.08} fill="#8B7355" />
      <circle cx={size * 0.2} cy={size * 0.69} r={size * 0.04} fill="none" stroke="#6B5641" strokeWidth="1.5">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="4s"
          repeatCount="indefinite"
          additive="sum"
        />
      </circle>
      {/* Saw blade */}
      <line x1={size * 0.35} y1={size * 0.67} x2={size * 0.35} y2={size * 0.71} stroke="#5A5A5A" strokeWidth="1">
        <animate attributeName="x1" values="0.35; 0.33; 0.35" dur="0.3s" repeatCount="indefinite" />
        <animate attributeName="x2" values="0.35; 0.33; 0.35" dur="0.3s" repeatCount="indefinite" />
      </line>
      
      {/* Master mason with plans */}
      <ellipse cx={size * 0.75} cy={size * 0.65} rx={size * 0.02} ry={size * 0.025} fill="#8B6F47" />
      <rect x={size * 0.73} y={size * 0.67} width={size * 0.04} height={size * 0.03} fill="#F0E6D2" stroke="#8B7355" strokeWidth="0.3" />
      
      {/* Finished blocks ready for transport */}
      <rect x={size * 0.7} y={size * 0.75} width={size * 0.08} height={size * 0.06} fill="#F0F0F0" stroke="#999" strokeWidth="0.5" />
      <rect x={size * 0.79} y={size * 0.75} width={size * 0.08} height={size * 0.06} fill="#EFEFEF" stroke="#999" strokeWidth="0.5" />
      <rect x={size * 0.75} y={size * 0.69} width={size * 0.08} height={size * 0.06} fill="#F2F2F2" stroke="#999" strokeWidth="0.5" />
    </g>
  );
};

export default RenaissanceQuarry;