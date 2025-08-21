/**
 * components/symbols/structures/LumberCampSymbol.tsx - A woodcutter's hut with animated smoke
 */
import React from 'react';

interface LumberCampSymbolProps {
  x: number;
  y: number;
  size: number;
  seed?: number;
}

const LumberCampSymbol: React.FC<LumberCampSymbolProps> = ({ x, y, size, seed = 0 }) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const uniqueId = `lumber-${x}-${y}-${seed}`;
  
  return (
    <g>
      {/* Shadow */}
      <ellipse 
        cx={centerX} 
        cy={centerY + size * 0.38} 
        rx={size * 0.4} 
        ry={size * 0.1}
        fill="rgba(0,0,0,0.2)"
      />
      
      {/* Woodcutter's hut base */}
      <rect
        x={centerX - size * 0.25}
        y={centerY - size * 0.05}
        width={size * 0.5}
        height={size * 0.35}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth={1}
      />
      
      {/* Wood grain details on hut */}
      <line
        x1={centerX - size * 0.2}
        y1={centerY}
        x2={centerX - size * 0.2}
        y2={centerY + size * 0.25}
        stroke="#654321"
        strokeWidth={0.5}
        opacity={0.5}
      />
      <line
        x1={centerX}
        y1={centerY}
        x2={centerX}
        y2={centerY + size * 0.25}
        stroke="#654321"
        strokeWidth={0.5}
        opacity={0.5}
      />
      <line
        x1={centerX + size * 0.2}
        y1={centerY}
        x2={centerX + size * 0.2}
        y2={centerY + size * 0.25}
        stroke="#654321"
        strokeWidth={0.5}
        opacity={0.5}
      />
      
      {/* Hut roof */}
      <polygon
        points={`
          ${centerX - size * 0.32},${centerY - size * 0.05}
          ${centerX},${centerY - size * 0.32}
          ${centerX + size * 0.32},${centerY - size * 0.05}
        `}
        fill="#654321"
        stroke="#4A3C28"
        strokeWidth={1}
      />
      
      {/* Roof shingles */}
      <line
        x1={centerX - size * 0.16}
        y1={centerY - size * 0.18}
        x2={centerX + size * 0.16}
        y2={centerY - size * 0.18}
        stroke="#4A3C28"
        strokeWidth={0.5}
        opacity={0.5}
      />
      
      {/* Door */}
      <rect
        x={centerX - size * 0.08}
        y={centerY + size * 0.08}
        width={size * 0.16}
        height={size * 0.22}
        fill="#4A3C28"
      />
      <circle
        cx={centerX + size * 0.04}
        cy={centerY + size * 0.19}
        r={size * 0.01}
        fill="#654321"
      />
      
      {/* Window with warm glow */}
      <rect
        x={centerX + size * 0.08}
        y={centerY + size * 0.02}
        width={size * 0.12}
        height={size * 0.1}
        fill="#FFD700"
        opacity={0.7}
      />
      <rect
        x={centerX + size * 0.08}
        y={centerY + size * 0.02}
        width={size * 0.12}
        height={size * 0.1}
        fill="none"
        stroke="#4A3C28"
        strokeWidth={0.5}
      />
      
      {/* Chimney */}
      <rect
        x={centerX - size * 0.18}
        y={centerY - size * 0.28}
        width={size * 0.1}
        height={size * 0.18}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth={0.5}
      />
      
      {/* Animated smoke puffs */}
      <g>
        <circle
          cx={centerX - size * 0.13}
          cy={centerY - size * 0.32}
          r={size * 0.04}
          fill="#696969"
          opacity={0.4}
        >
          <animate
            attributeName="cy"
            values={`${centerY - size * 0.32};${centerY - size * 0.52};${centerY - size * 0.32}`}
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values={`${centerX - size * 0.13};${centerX - size * 0.11};${centerX - size * 0.13}`}
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${size * 0.04};${size * 0.06};${size * 0.04}`}
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0.15;0.4"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={centerX - size * 0.11}
          cy={centerY - size * 0.38}
          r={size * 0.05}
          fill="#808080"
          opacity={0.35}
        >
          <animate
            attributeName="cy"
            values={`${centerY - size * 0.38};${centerY - size * 0.58};${centerY - size * 0.38}`}
            dur="4.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values={`${centerX - size * 0.11};${centerX - size * 0.14};${centerX - size * 0.11}`}
            dur="4.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${size * 0.05};${size * 0.07};${size * 0.05}`}
            dur="4.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.35;0.1;0.35"
            dur="4.5s"
            begin="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={centerX - size * 0.14}
          cy={centerY - size * 0.44}
          r={size * 0.03}
          fill="#A9A9A9"
          opacity={0.3}
        >
          <animate
            attributeName="cy"
            values={`${centerY - size * 0.44};${centerY - size * 0.64};${centerY - size * 0.44}`}
            dur="5s"
            begin="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values={`${centerX - size * 0.14};${centerX - size * 0.10};${centerX - size * 0.14}`}
            dur="5s"
            begin="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${size * 0.03};${size * 0.05};${size * 0.03}`}
            dur="5s"
            begin="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.05;0.3"
            dur="5s"
            begin="3s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
      
      {/* Log pile to the side */}
      <g>
        {/* Log pile base */}
        <rect
          x={centerX + size * 0.28}
          y={centerY + size * 0.18}
          width={size * 0.25}
          height={size * 0.15}
          fill="#6B4423"
          stroke="#4A3C28"
          strokeWidth={0.5}
        />
        
        {/* Stacked logs with unique keys */}
        {[0, 1].map((row) => (
          <g key={`${uniqueId}-row-${row}`}>
            {[0, 1, 2].map((col) => (
              <circle
                key={`${uniqueId}-log-${row}-${col}`}
                cx={centerX + size * 0.32 + col * size * 0.06}
                cy={centerY + size * 0.15 - row * size * 0.05}
                r={size * 0.025}
                fill="#A0522D"
                stroke="#654321"
                strokeWidth={0.5}
              />
            ))}
          </g>
        ))}
      </g>
      
      {/* Axe leaning against hut */}
      <g transform={`translate(${centerX - size * 0.32}, ${centerY + size * 0.1})`}>
        {/* Axe handle */}
        <rect
          x={0}
          y={0}
          width={size * 0.03}
          height={size * 0.25}
          fill="#654321"
          transform="rotate(-20)"
        />
        
        {/* Axe blade */}
        <path
          d={`M${-size * 0.05} ${-size * 0.02} 
              L${size * 0.05} ${-size * 0.02} 
              L${size * 0.04} ${size * 0.04} 
              L${-size * 0.04} ${size * 0.04} Z`}
          fill="#708090"
          stroke="#2F4F4F"
          strokeWidth={0.5}
          transform="rotate(-20)"
        />
      </g>
      
      {/* Small tree stump */}
      <ellipse
        cx={centerX - size * 0.35}
        cy={centerY + size * 0.32}
        rx={size * 0.08}
        ry={size * 0.05}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth={0.5}
      />
      
      {/* Wood chips/sawdust around */}
      {[...Array(8)].map((_, i) => (
        <circle
          key={`${uniqueId}-chip-${i}`}
          cx={centerX + (Math.sin(i * 0.8 + seed) * size * 0.35)}
          cy={centerY + size * 0.33 + (Math.cos(i * 1.2) * size * 0.04)}
          r={size * 0.012}
          fill="#D2691E"
          opacity={0.5}
        />
      ))}
    </g>
  );
};

export default LumberCampSymbol;