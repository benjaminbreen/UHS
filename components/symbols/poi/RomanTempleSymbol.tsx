/**
 * Roman Temple Symbol (Tholos style) - Circular temple with columns
 */
import React from 'react';

interface RomanTempleSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const RomanTempleSymbol: React.FC<RomanTempleSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `roman-temple-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3; // 30% bigger as requested
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Gradients for depth */}
        <linearGradient id={`marble-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f4f0" />
          <stop offset="50%" stopColor="#e8e0d8" />
          <stop offset="100%" stopColor="#d0c4b8" />
        </linearGradient>
        
        <radialGradient id={`dome-${uniqueId}`} cx="50%" cy="30%">
          <stop offset="0%" stopColor="#e0d8d0" />
          <stop offset="100%" stopColor="#c0b0a0" />
        </radialGradient>
        
        <linearGradient id={`column-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0e8e0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8d0c8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse 
        cx={scaledSize * 0.5} 
        cy={scaledSize * 0.85} 
        rx={scaledSize * 0.35} 
        ry={scaledSize * 0.12} 
        fill="rgba(0,0,0,0.2)" 
        filter={`url(#blur-${uniqueId})`}
      />
      
      {/* Base platform (3 steps) */}
      <rect x={scaledSize * 0.15} y={scaledSize * 0.78} 
            width={scaledSize * 0.7} height={scaledSize * 0.03} 
            fill="#c8b8a8" stroke="#a09080" strokeWidth="0.5" />
      <rect x={scaledSize * 0.2} y={scaledSize * 0.75} 
            width={scaledSize * 0.6} height={scaledSize * 0.03} 
            fill="#d0c0b0" stroke="#a09080" strokeWidth="0.5" />
      <rect x={scaledSize * 0.25} y={scaledSize * 0.72} 
            width={scaledSize * 0.5} height={scaledSize * 0.03} 
            fill="#d8c8b8" stroke="#a09080" strokeWidth="0.5" />
      
      {/* Circular colonnade - 8 columns */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const colX = scaledSize * 0.5 + Math.cos(rad) * scaledSize * 0.22;
        const colY = scaledSize * 0.5 + Math.sin(rad) * scaledSize * 0.15;
        const visible = angle >= 0 && angle <= 180; // Front-facing columns
        
        return (
          <g key={`column-${i}`} opacity={visible ? 1 : 0.6}>
            {/* Column shaft */}
            <rect 
              x={colX - scaledSize * 0.015} 
              y={colY - scaledSize * 0.05}
              width={scaledSize * 0.03} 
              height={scaledSize * 0.25}
              fill={`url(#column-${uniqueId})`}
              stroke="#a09080"
              strokeWidth="0.3"
            />
            
            {/* Capital (Corinthian style - simplified) */}
            <rect 
              x={colX - scaledSize * 0.02} 
              y={colY - scaledSize * 0.055}
              width={scaledSize * 0.04} 
              height={scaledSize * 0.015}
              fill="#f0e8e0"
              stroke="#a09080"
              strokeWidth="0.3"
            />
            
            {/* Fluting lines */}
            <line x1={colX - scaledSize * 0.005} y1={colY - scaledSize * 0.04} 
                  x2={colX - scaledSize * 0.005} y2={colY + scaledSize * 0.19}
                  stroke="#c0b0a0" strokeWidth="0.2" opacity="0.5" />
            <line x1={colX + scaledSize * 0.005} y1={colY - scaledSize * 0.04} 
                  x2={colX + scaledSize * 0.005} y2={colY + scaledSize * 0.19}
                  stroke="#c0b0a0" strokeWidth="0.2" opacity="0.5" />
          </g>
        );
      })}
      
      {/* Circular entablature */}
      <ellipse 
        cx={scaledSize * 0.5} 
        cy={scaledSize * 0.45}
        rx={scaledSize * 0.25} 
        ry={scaledSize * 0.08}
        fill={`url(#marble-${uniqueId})`}
        stroke="#a09080"
        strokeWidth="0.5"
      />
      
      {/* Dome */}
      <path 
        d={`M ${scaledSize * 0.25} ${scaledSize * 0.45}
            Q ${scaledSize * 0.5} ${scaledSize * 0.25}
              ${scaledSize * 0.75} ${scaledSize * 0.45}`}
        fill={`url(#dome-${uniqueId})`}
        stroke="#a09080"
        strokeWidth="0.5"
      />
      
      {/* Dome ribs */}
      {[0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
        <path 
          key={`rib-${i}`}
          d={`M ${scaledSize * xPos} ${scaledSize * 0.45}
              Q ${scaledSize * 0.5} ${scaledSize * 0.28}
                ${scaledSize * 0.5} ${scaledSize * 0.28}`}
          fill="none"
          stroke="#b0a090"
          strokeWidth="0.3"
          opacity="0.5"
        />
      ))}
      
      {/* Oculus (top opening) */}
      <circle 
        cx={scaledSize * 0.5} 
        cy={scaledSize * 0.28}
        r={scaledSize * 0.02}
        fill="#87CEEB"
        stroke="#a09080"
        strokeWidth="0.3"
      />
      
      {/* Central statue pedestal (visible through columns) */}
      <rect 
        x={scaledSize * 0.47} 
        y={scaledSize * 0.68}
        width={scaledSize * 0.06} 
        height={scaledSize * 0.04}
        fill="#c0b0a0"
        opacity="0.6"
      />
      
      {/* Decorative frieze text (SPQR) */}
      <text 
        x={scaledSize * 0.5} 
        y={scaledSize * 0.42}
        fontSize={scaledSize * 0.025}
        fill="#908070"
        textAnchor="middle"
        fontFamily="serif"
        fontWeight="bold"
      >
        SPQR
      </text>
      
      <filter id={`blur-${uniqueId}`}>
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </g>
  );
};

export default RomanTempleSymbol;