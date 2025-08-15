/**
 * components/symbols/mines/ModernMine.tsx - Modern era mine with electric lights and trucks
 */
import React from 'react';

interface ModernMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const ModernMine: React.FC<ModernMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Concrete structures */}
      <rect x={size * 0.2} y={size * 0.25} width={size * 0.6} height={size * 0.45} fill="#8B8B8B" />
      <rect x={size * 0.25} y={size * 0.3} width={size * 0.15} height={size * 0.15} fill="#ADD8E6" opacity="0.7" />
      <rect x={size * 0.6} y={size * 0.3} width={size * 0.15} height={size * 0.15} fill="#ADD8E6" opacity="0.7" />
      
      {/* Modern headframe with elevator */}
      <rect x={size * 0.45} y={size * 0.05} width={size * 0.1} height={size * 0.2} fill="#5A5A5A" />
      <rect x={size * 0.47} y={size * 0.08} width={size * 0.06} height={size * 0.04} fill="#FFD700">
        <animate attributeName="y" values={`${size * 0.08}; ${size * 0.18}; ${size * 0.08}`} dur="4s" repeatCount="indefinite" />
      </rect>
      
      {/* Electric lights */}
      {[0.3, 0.5, 0.7].map(xPos => (
        <g key={xPos}>
          <rect x={size * xPos} y={size * 0.22} width={size * 0.02} height={size * 0.03} fill="#333" />
          <circle cx={size * xPos + size * 0.01} cy={size * 0.22} r={size * 0.02} fill="#FFFF00" opacity="0.9">
            <animate attributeName="opacity" values="0.9;1;0.9" dur="0.1s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      
      {/* Conveyor belt */}
      <rect x={size * 0.1} y={size * 0.6} width={size * 0.7} height={size * 0.03} fill="#4A4A4A" />
      <rect x={size * 0.1} y={size * 0.63} width={size * 0.7} height={size * 0.02} fill="#3A3A3A" />
      {/* Moving belt segments */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} width={size * 0.05} height={size * 0.02} fill="#2A2A2A">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * (0.1 + i * 0.15)} ${size * 0.61}; ${size * (0.25 + i * 0.15)} ${size * 0.61}; ${size * (0.1 + i * 0.15)} ${size * 0.61}`}
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      ))}
      
      {/* Mining truck */}
      <g>
        {/* Truck body */}
        <rect fill="#FFD700" width={size * 0.15} height={size * 0.08}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.05} ${size * 0.75}; ${size * 0.85} ${size * 0.75}; ${size * 0.85} ${size * 0.75}; ${size * 0.05} ${size * 0.75}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Truck cab */}
        <rect fill="#FFA500" width={size * 0.05} height={size * 0.06}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.05} ${size * 0.77}; ${size * 0.85} ${size * 0.77}; ${size * 0.85} ${size * 0.77}; ${size * 0.05} ${size * 0.77}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Truck wheels */}
        <circle r={size * 0.02} fill="#333">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.08} ${size * 0.85}; ${size * 0.88} ${size * 0.85}; ${size * 0.88} ${size * 0.85}; ${size * 0.08} ${size * 0.85}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r={size * 0.02} fill="#333">
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${size * 0.17} ${size * 0.85}; ${size * 0.97} ${size * 0.85}; ${size * 0.97} ${size * 0.85}; ${size * 0.17} ${size * 0.85}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      {/* Ventilation shaft */}
      <rect x={size * 0.85} y={size * 0.4} width={size * 0.08} height={size * 0.3} fill="#6A6A6A" />
      <circle cx={size * 0.89} cy={size * 0.4} r={size * 0.04} fill="#5A5A5A">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="2s"
          repeatCount="indefinite"
          additive="sum"
        />
      </circle>
      {/* Fan blades */}
      {[0, 120, 240].map(angle => (
        <path 
          key={angle}
          d={`M ${size * 0.89} ${size * 0.4} L ${size * 0.89 + Math.cos(angle * Math.PI / 180) * size * 0.03} ${size * 0.4 + Math.sin(angle * Math.PI / 180) * size * 0.03}`}
          stroke="#4A4A4A"
          strokeWidth="2"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="2s"
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
      ))}
      
      {/* Control room */}
      <rect x={size * 0.25} y={size * 0.5} width={size * 0.2} height={size * 0.1} fill="#9B9B9B" />
      {/* Blinking control lights */}
      <circle cx={size * 0.3} cy={size * 0.55} r={size * 0.005} fill="#00FF00">
        <animate attributeName="fill" values="#00FF00;#00AA00;#00FF00" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx={size * 0.35} cy={size * 0.55} r={size * 0.005} fill="#FF0000">
        <animate attributeName="fill" values="#FF0000;#AA0000;#FF0000" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={size * 0.4} cy={size * 0.55} r={size * 0.005} fill="#FFFF00">
        <animate attributeName="fill" values="#FFFF00;#AAAA00;#FFFF00" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

export default ModernMine;