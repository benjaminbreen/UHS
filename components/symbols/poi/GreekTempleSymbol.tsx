/**
 * Greek Temple Symbol - Classical temple with Doric columns and pediment
 */
import React from 'react';

interface GreekTempleSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const GreekTempleSymbol: React.FC<GreekTempleSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `greek-temple-${x}-${y}-${seed}`;
  const scaledSize = size * 1.3; // 30% bigger
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`marble-grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#faf8f5" />
          <stop offset="100%" stopColor="#e0d8d0" />
        </linearGradient>
        
        <linearGradient id={`pediment-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e8" />
          <stop offset="100%" stopColor="#d8d0c8" />
        </linearGradient>
      </defs>
      
      {/* Shadow */}
      <ellipse 
        cx={scaledSize * 0.5} 
        cy={scaledSize * 0.82} 
        rx={scaledSize * 0.4} 
        ry={scaledSize * 0.1} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {/* Stylobate (base platform) - 3 steps */}
      <rect x={scaledSize * 0.1} y={scaledSize * 0.76} 
            width={scaledSize * 0.8} height={scaledSize * 0.025} 
            fill="#c8c0b8" stroke="#908880" strokeWidth="0.4" />
      <rect x={scaledSize * 0.15} y={scaledSize * 0.735} 
            width={scaledSize * 0.7} height={scaledSize * 0.025} 
            fill="#d0c8c0" stroke="#908880" strokeWidth="0.4" />
      <rect x={scaledSize * 0.2} y={scaledSize * 0.71} 
            width={scaledSize * 0.6} height={scaledSize * 0.025} 
            fill="#d8d0c8" stroke="#908880" strokeWidth="0.4" />
      
      {/* Six Doric columns */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const colX = scaledSize * (0.25 + i * 0.1);
        
        return (
          <g key={`col-${i}`}>
            {/* Column base */}
            <rect 
              x={colX - scaledSize * 0.02} 
              y={scaledSize * 0.7}
              width={scaledSize * 0.04} 
              height={scaledSize * 0.01}
              fill="#d0c8c0"
            />
            
            {/* Column shaft with entasis (slight bulge) */}
            <path 
              d={`M ${colX - scaledSize * 0.018} ${scaledSize * 0.7}
                  L ${colX - scaledSize * 0.016} ${scaledSize * 0.5}
                  L ${colX - scaledSize * 0.015} ${scaledSize * 0.45}
                  L ${colX + scaledSize * 0.015} ${scaledSize * 0.45}
                  L ${colX + scaledSize * 0.016} ${scaledSize * 0.5}
                  L ${colX + scaledSize * 0.018} ${scaledSize * 0.7}
                  Z`}
              fill={`url(#marble-grad-${uniqueId})`}
              stroke="#a09890"
              strokeWidth="0.4"
            />
            
            {/* Fluting (vertical grooves) */}
            {[-0.008, 0, 0.008].map((offset, j) => (
              <line 
                key={`flute-${j}`}
                x1={colX + scaledSize * offset} 
                y1={scaledSize * 0.46}
                x2={colX + scaledSize * offset} 
                y2={scaledSize * 0.69}
                stroke="#c0b8b0"
                strokeWidth="0.2"
                opacity="0.6"
              />
            ))}
            
            {/* Capital (simple Doric) */}
            <rect 
              x={colX - scaledSize * 0.022} 
              y={scaledSize * 0.44}
              width={scaledSize * 0.044} 
              height={scaledSize * 0.015}
              fill="#e8e0d8"
              stroke="#a09890"
              strokeWidth="0.3"
            />
            
            {/* Abacus (top of capital) */}
            <rect 
              x={colX - scaledSize * 0.025} 
              y={scaledSize * 0.43}
              width={scaledSize * 0.05} 
              height={scaledSize * 0.01}
              fill="#f0e8e0"
              stroke="#a09890"
              strokeWidth="0.3"
            />
          </g>
        );
      })}
      
      {/* Entablature */}
      <rect 
        x={scaledSize * 0.2} 
        y={scaledSize * 0.41}
        width={scaledSize * 0.6} 
        height={scaledSize * 0.02}
        fill="#e0d8d0"
        stroke="#908880"
        strokeWidth="0.4"
      />
      
      {/* Triglyphs and metopes (decorative elements) */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect 
          key={`triglyph-${i}`}
          x={scaledSize * (0.23 + i * 0.054)} 
          y={scaledSize * 0.395}
          width={scaledSize * 0.015} 
          height={scaledSize * 0.015}
          fill={i % 2 === 0 ? "#c0b8b0" : "#d8d0c8"}
          stroke="#908880"
          strokeWidth="0.2"
        />
      ))}
      
      {/* Pediment (triangular top) */}
      <path 
        d={`M ${scaledSize * 0.18} ${scaledSize * 0.39}
            L ${scaledSize * 0.5} ${scaledSize * 0.25}
            L ${scaledSize * 0.82} ${scaledSize * 0.39}
            Z`}
        fill={`url(#pediment-${uniqueId})`}
        stroke="#908880"
        strokeWidth="0.5"
      />
      
      {/* Pediment relief (simplified figure) */}
      <circle 
        cx={scaledSize * 0.5} 
        cy={scaledSize * 0.33}
        r={scaledSize * 0.03}
        fill="#c0b8b0"
        opacity="0.5"
      />
      
      {/* Acroterion (decorative elements at corners) */}
      <circle cx={scaledSize * 0.5} cy={scaledSize * 0.24} r={scaledSize * 0.015} fill="#d0c8c0" />
      <circle cx={scaledSize * 0.2} cy={scaledSize * 0.38} r={scaledSize * 0.012} fill="#d0c8c0" />
      <circle cx={scaledSize * 0.8} cy={scaledSize * 0.38} r={scaledSize * 0.012} fill="#d0c8c0" />
      
      {/* Entrance (dark rectangle between center columns) */}
      <rect 
        x={scaledSize * 0.43} 
        y={scaledSize * 0.55}
        width={scaledSize * 0.14} 
        height={scaledSize * 0.15}
        fill="rgba(20,20,25,0.8)"
      />
    </g>
  );
};

export default GreekTempleSymbol;