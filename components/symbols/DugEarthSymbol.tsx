import React from 'react';

interface DugEarthSymbolProps {
  x: number;
  y: number;
  cellSize: number;
}

/**
 * Symbol for showing a dug-up pile of earth on a tile.
 * Appears after a player uses the DIG action on a tile.
 */
const DugEarthSymbol: React.FC<DugEarthSymbolProps> = ({ x, y, cellSize }) => {
  const symbolSize = cellSize * 0.4; // 40% of tile size
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Shadow */}
      <ellipse
        cx="0"
        cy={symbolSize * 0.15}
        rx={symbolSize * 0.45}
        ry={symbolSize * 0.15}
        fill="rgba(0, 0, 0, 0.3)"
      />

      {/* Main earth pile - darker base */}
      <path
        d={`
          M ${-symbolSize * 0.4} ${symbolSize * 0.1}
          Q ${-symbolSize * 0.3} ${-symbolSize * 0.15}, ${-symbolSize * 0.15} ${-symbolSize * 0.2}
          Q ${0} ${-symbolSize * 0.25}, ${symbolSize * 0.15} ${-symbolSize * 0.2}
          Q ${symbolSize * 0.3} ${-symbolSize * 0.15}, ${symbolSize * 0.4} ${symbolSize * 0.1}
          Q ${symbolSize * 0.35} ${symbolSize * 0.15}, ${symbolSize * 0.2} ${symbolSize * 0.15}
          L ${-symbolSize * 0.2} ${symbolSize * 0.15}
          Q ${-symbolSize * 0.35} ${symbolSize * 0.15}, ${-symbolSize * 0.4} ${symbolSize * 0.1}
          Z
        `}
        fill="#5C4033"
        stroke="#3E2723"
        strokeWidth="1"
      />

      {/* Lighter earth highlights */}
      <path
        d={`
          M ${-symbolSize * 0.25} ${-symbolSize * 0.05}
          Q ${-symbolSize * 0.1} ${-symbolSize * 0.15}, ${0} ${-symbolSize * 0.12}
          Q ${symbolSize * 0.1} ${-symbolSize * 0.1}, ${symbolSize * 0.2} ${0}
          L ${symbolSize * 0.15} ${symbolSize * 0.05}
          Q ${0} ${-symbolSize * 0.02}, ${-symbolSize * 0.15} ${symbolSize * 0.05}
          Z
        `}
        fill="#6D4C41"
        opacity="0.8"
      />

      {/* Small dirt clumps */}
      <circle cx={-symbolSize * 0.15} cy={-symbolSize * 0.08} r={symbolSize * 0.04} fill="#795548" />
      <circle cx={symbolSize * 0.1} cy={-symbolSize * 0.05} r={symbolSize * 0.03} fill="#6D4C41" />
      <circle cx={0} cy={-symbolSize * 0.1} r={symbolSize * 0.035} fill="#5C4033" />

      {/* Texture dots */}
      <circle cx={-symbolSize * 0.05} cy={symbolSize * 0.05} r={symbolSize * 0.015} fill="#3E2723" opacity="0.5" />
      <circle cx={symbolSize * 0.08} cy={symbolSize * 0.03} r={symbolSize * 0.015} fill="#3E2723" opacity="0.5" />
      <circle cx={-symbolSize * 0.12} cy={0} r={symbolSize * 0.015} fill="#3E2723" opacity="0.5" />
      <circle cx={symbolSize * 0.15} cy={-symbolSize * 0.02} r={symbolSize * 0.015} fill="#3E2723" opacity="0.5" />
    </g>
  );
};

export default DugEarthSymbol;