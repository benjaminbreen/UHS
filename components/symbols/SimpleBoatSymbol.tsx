/**
 * SimpleBoatSymbol - Exact copy of harbor boats for NPC movement
 */
import React from 'react';

interface SimpleBoatSymbolProps {
  x: number;
  y: number;
  rotation: number;
}

const SimpleBoatSymbol: React.FC<SimpleBoatSymbolProps> = ({ x, y, rotation }) => {
  // Size matching harbor boats exactly
  const w = 8; // Boat width (was size*0.22, with size ~= 36)
  const h = 2; // Boat height (was size*0.05)
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Wake effect */}
      <path 
        d={`M ${-w*0.35},${h*0.05} Q 0,${h*0.14} ${w*0.35},${h*0.05}`} 
        fill="none" 
        stroke="rgba(170,210,255,0.35)" 
        strokeWidth={0.5} 
      />
      
      {/* Boat hull - simple medieval style */}
      <path
        d={`M ${-w/2},0 L ${w/2},0 L ${w*0.33},${h} L ${-w*0.33},${h} Z`}
        fill="#a4744d"
        stroke="#4e2e1b"
        strokeWidth={0.5}
      />
      
      {/* Mast */}
      <line 
        x1={0} 
        y1={0} 
        x2={0} 
        y2={-h*1.5}
        stroke="#4e2e1b"
        strokeWidth={0.5}
      />
      
      {/* Sail */}
      <path 
        d={`M 0,${-h*1.45} Q ${w*0.1},${-h*0.7} 0,0`} 
        fill="#ede1c8" 
        stroke="#c7b48f" 
        strokeWidth={0.4}
      />
    </g>
  );
};

export default SimpleBoatSymbol;