import React from 'react';

interface PathSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'stone' | 'dirt' | 'brick' | 'marble';
  isNight?: boolean;
}

const PathSymbol: React.FC<PathSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'stone',
  isNight = false 
}) => {
  // Color schemes for different path types
  const pathColors = {
    stone: { main: '#8a8a8a', dark: '#6a6a6a', light: '#a5a5a5' },
    dirt: { main: '#8b7355', dark: '#6b5335', light: '#ab9375' },
    brick: { main: '#a06050', dark: '#804030', light: '#c08070' },
    marble: { main: '#e8e8e8', dark: '#c8c8c8', light: '#f5f5f5' }
  };
  
  const colors = pathColors[variant];
  
  // Generate semi-random stone pattern based on position
  const seed = x * 7 + y * 13;
  const stonePattern = [];
  
  // Create irregular stone/brick pattern
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const stoneX = x + (j * size * 0.25) + ((seed + i + j) % 3) * 2;
      const stoneY = y + (i * size * 0.25) + ((seed + i * j) % 2) * 2;
      const stoneW = size * 0.22 + ((seed + i) % 3) * 2;
      const stoneH = size * 0.22 + ((seed + j) % 3) * 2;
      
      stonePattern.push({
        x: stoneX,
        y: stoneY,
        width: stoneW,
        height: stoneH,
        color: (i + j) % 2 === 0 ? colors.main : colors.dark
      });
    }
  }
  
  return (
    <g>
      {/* Base path fill */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={colors.dark}
      />
      
      {/* Stone/brick pattern */}
      {stonePattern.map((stone, index) => (
        <rect
          key={index}
          x={stone.x}
          y={stone.y}
          width={stone.width}
          height={stone.height}
          fill={stone.color}
          stroke={colors.dark}
          strokeWidth={0.5}
          rx={variant === 'stone' ? 2 : 0}
        />
      ))}
      
      {/* Wear and weathering for realism */}
      {variant === 'stone' && (
        <>
          <ellipse
            cx={x + size * 0.3}
            cy={y + size * 0.4}
            rx={size * 0.05}
            ry={size * 0.03}
            fill={colors.dark}
            opacity={0.3}
          />
          <ellipse
            cx={x + size * 0.7}
            cy={y + size * 0.6}
            rx={size * 0.04}
            ry={size * 0.04}
            fill={colors.dark}
            opacity={0.2}
          />
        </>
      )}
      
      {/* Dirt accumulation in corners */}
      {variant !== 'marble' && (
        <>
          <path
            d={`M ${x} ${y} L ${x + size * 0.1} ${y} L ${x} ${y + size * 0.1} Z`}
            fill="#5a4a3a"
            opacity={0.2}
          />
          <path
            d={`M ${x + size} ${y + size} L ${x + size * 0.9} ${y + size} L ${x + size} ${y + size * 0.9} Z`}
            fill="#5a4a3a"
            opacity={0.2}
          />
        </>
      )}
      
      {/* Subtle highlights for marble */}
      {variant === 'marble' && (
        <>
          <rect
            x={x + size * 0.1}
            y={y + size * 0.1}
            width={size * 0.3}
            height={size * 0.02}
            fill={colors.light}
            opacity={0.4}
          />
          <rect
            x={x + size * 0.6}
            y={y + size * 0.7}
            width={size * 0.2}
            height={size * 0.02}
            fill={colors.light}
            opacity={0.3}
          />
        </>
      )}
      
      {/* Night time darkening */}
      {isNight && (
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          fill="#000033"
          opacity={0.3}
        />
      )}
    </g>
  );
};

export default PathSymbol;