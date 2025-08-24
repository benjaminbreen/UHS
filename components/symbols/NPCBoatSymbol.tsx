/**
 * components/symbols/NPCBoatSymbol.tsx - Simple animated boat for NPC boats traveling between harbors
 */
import React from 'react';

interface NPCBoatSymbolProps {
  x: number;
  y: number;
  size: number;
  rotation: number;
  boatType: 'fishing' | 'cargo' | 'ferry';
  era?: string;
  culture?: string;
}

const NPCBoatSymbol: React.FC<NPCBoatSymbolProps> = ({ 
  x, y, size, rotation, boatType, era, culture 
}) => {
  // Boat colors based on type
  const colors = {
    fishing: { hull: '#8b6914', sail: '#f5f5dc' },
    cargo: { hull: '#5a4a3a', sail: '#d4d4d4' },
    ferry: { hull: '#6b5d54', sail: '#e8e8e8' }
  };
  
  const { hull, sail } = colors[boatType];
  const boatWidth = size * 0.8;
  const boatHeight = size * 0.3;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Wake effect */}
      <path 
        d={`M ${-boatWidth/2},0 Q ${-boatWidth/3},${boatHeight/4} ${-boatWidth/2},${boatHeight/2}`}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />
      
      {/* Hull */}
      <path
        d={`M ${-boatWidth/2},0 L ${boatWidth/2},0 L ${boatWidth/3},${boatHeight} L ${-boatWidth/3},${boatHeight} Z`}
        fill={hull}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.5}
      />
      
      {/* Sail or cabin based on era */}
      {era === 'modern' || era === 'industrial' ? (
        // Cabin for modern boats
        <rect 
          x={-boatWidth/6} 
          y={-boatHeight/2} 
          width={boatWidth/3} 
          height={boatHeight/2}
          fill="#e0e0e0"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
        />
      ) : (
        // Sail for older boats
        <>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-boatHeight * 1.5}
            stroke="#4a3a2a"
            strokeWidth={1}
          />
          <path
            d={`M 0,${-boatHeight * 1.4} Q ${boatWidth/3},${-boatHeight * 0.7} 0,0`}
            fill={sail}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={0.5}
          />
        </>
      )}
      
      {/* Small flag */}
      <rect
        x={boatWidth/3}
        y={-boatHeight * 0.8}
        width={size * 0.15}
        height={size * 0.1}
        fill="#ff6b6b"
        opacity={0.7}
      />
    </g>
  );
};

export default NPCBoatSymbol;