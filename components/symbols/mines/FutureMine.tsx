/**
 * components/symbols/mines/FutureMine.tsx - Future era automated mine
 */
import React from 'react';

interface FutureMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const FutureMine: React.FC<FutureMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sleek dome structure */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.4} ry={size * 0.25} fill="url(#futureGradient)" />
      <defs>
        <linearGradient id="futureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#808080" />
        </linearGradient>
      </defs>
      
      {/* Holographic display */}
      <rect x={size * 0.45} y={size * 0.35} width={size * 0.1} height={size * 0.15} fill="#00FFFF" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
      
      {/* Automated drones */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <circle r={size * 0.02} fill="#00FF00" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${size * 0.2} ${size * 0.3}; ${size * 0.8} ${size * 0.4}; ${size * 0.5} ${size * 0.6}; ${size * 0.2} ${size * 0.3}`}
              dur={`${4 + i}s`}
              begin={`${i * 1.5}s`}
              repeatCount="indefinite"
            />
          </circle>
          {/* Drone propellers */}
          <circle r={size * 0.01} fill="none" stroke="#00FF00" strokeWidth="0.5" opacity="0.4">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${size * 0.2} ${size * 0.3}; ${size * 0.8} ${size * 0.4}; ${size * 0.5} ${size * 0.6}; ${size * 0.2} ${size * 0.3}`}
              dur={`${4 + i}s`}
              begin={`${i * 1.5}s`}
              repeatCount="indefinite"
            />
            <animate attributeName="r" values={`${size * 0.01}; ${size * 0.025}; ${size * 0.01}`} dur="0.1s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      
      {/* Laser drilling beam */}
      <line x1={size * 0.5} y1={size * 0.5} x2={size * 0.5} y2={size * 0.9} stroke="#FF00FF" strokeWidth="2" opacity="0.8">
        <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
      </line>
      
      {/* Energy shield effect */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.45} ry={size * 0.3} fill="none" stroke="#00FFFF" strokeWidth="1" opacity="0.3">
        <animate attributeName="stroke-width" values="1;2;1" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
      </ellipse>
      
      {/* Automated transport pods */}
      <rect width={size * 0.08} height={size * 0.04} rx="2" fill="#A0A0A0">
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`${size * 0.1} ${size * 0.7}; ${size * 0.9} ${size * 0.7}; ${size * 0.1} ${size * 0.7}`}
          dur="5s"
          repeatCount="indefinite"
        />
      </rect>
      
      {/* Solar panels */}
      <rect x={size * 0.7} y={size * 0.3} width={size * 0.15} height={size * 0.1} fill="#001A66" />
      <line x1={size * 0.72} y1={size * 0.3} x2={size * 0.72} y2={size * 0.4} stroke="#003399" strokeWidth="0.5" />
      <line x1={size * 0.77} y1={size * 0.3} x2={size * 0.77} y2={size * 0.4} stroke="#003399" strokeWidth="0.5" />
      <line x1={size * 0.82} y1={size * 0.3} x2={size * 0.82} y2={size * 0.4} stroke="#003399" strokeWidth="0.5" />
      
      {/* Status lights */}
      {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
        <circle key={i} cx={size * xPos} cy={size * 0.6} r={size * 0.005} fill="#00FF00">
          <animate 
            attributeName="fill" 
            values="#00FF00;#00AA00;#00FF00" 
            dur={`${0.5 + i * 0.1}s`} 
            repeatCount="indefinite" 
          />
        </circle>
      ))}
    </g>
  );
};

export default FutureMine;