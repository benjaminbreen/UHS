/**
 * components/symbols/ShipSymbol.tsx
 * Simple ship symbols for NPC maritime vessels
 */
import React from 'react';

interface ShipSymbolProps {
  x: number;
  y: number;
  size: number;
  shipType: 'merchant' | 'fishing' | 'warship' | 'transport';
  shipSize: 'small' | 'medium' | 'large';
  direction?: 'north' | 'south' | 'east' | 'west';
}

const ShipSymbol: React.FC<ShipSymbolProps> = ({ 
  x, 
  y, 
  size, 
  shipType, 
  shipSize,
  direction = 'east' 
}) => {
  const scale = shipSize === 'large' ? 1.2 : shipSize === 'medium' ? 1 : 0.8;
  const actualSize = size * scale;
  
  // Rotate based on direction
  const rotation = {
    'north': -90,
    'south': 90,
    'east': 0,
    'west': 180
  }[direction];
  
  // Colors based on ship type
  const hullColor = {
    'merchant': '#8B4513',
    'fishing': '#654321',
    'warship': '#2C3E50',
    'transport': '#5D4E37'
  }[shipType];
  
  const sailColor = {
    'merchant': '#FFF8DC',
    'fishing': '#F5DEB3',
    'warship': '#DC143C',
    'transport': '#FAEBD7'
  }[shipType];
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Ship hull */}
      <path
        d={`M ${-actualSize/2} 0 
            Q ${-actualSize/3} ${actualSize/4} 0 ${actualSize/3}
            Q ${actualSize/3} ${actualSize/4} ${actualSize/2} 0
            Q ${actualSize/3} ${-actualSize/4} 0 ${-actualSize/3}
            Q ${-actualSize/3} ${-actualSize/4} ${-actualSize/2} 0 Z`}
        fill={hullColor}
        stroke="#000"
        strokeWidth="1"
      />
      
      {/* Mast */}
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={-actualSize * 0.8}
        stroke="#654321"
        strokeWidth="2"
      />
      
      {/* Main sail */}
      <path
        d={`M 2 ${-actualSize * 0.2}
            Q ${actualSize * 0.3} ${-actualSize * 0.4} 2 ${-actualSize * 0.7}
            L 2 ${-actualSize * 0.2}`}
        fill={sailColor}
        stroke="#000"
        strokeWidth="0.5"
        opacity="0.9"
      />
      
      {/* Flag for warships */}
      {shipType === 'warship' && (
        <path
          d={`M 0 ${-actualSize * 0.8}
              L ${actualSize * 0.2} ${-actualSize * 0.75}
              L 0 ${-actualSize * 0.7}`}
          fill="#DC143C"
          stroke="#000"
          strokeWidth="0.5"
        />
      )}
      
      {/* Cargo indicators for merchant ships */}
      {shipType === 'merchant' && shipSize !== 'small' && (
        <>
          <rect
            x={-actualSize/6}
            y={-actualSize/8}
            width={actualSize/6}
            height={actualSize/6}
            fill="#DEB887"
            stroke="#000"
            strokeWidth="0.5"
          />
          <rect
            x={actualSize/12}
            y={-actualSize/8}
            width={actualSize/6}
            height={actualSize/6}
            fill="#D2691E"
            stroke="#000"
            strokeWidth="0.5"
          />
        </>
      )}
      
      {/* Fishing nets for fishing boats */}
      {shipType === 'fishing' && (
        <g opacity="0.6">
          <line x1={actualSize/3} y1={0} x2={actualSize/2} y2={actualSize/4} stroke="#8B7355" strokeWidth="1" />
          <line x1={actualSize/3} y1={actualSize/6} x2={actualSize/2} y2={0} stroke="#8B7355" strokeWidth="1" />
          <line x1={actualSize/3} y1={-actualSize/6} x2={actualSize/2} y2={-actualSize/4} stroke="#8B7355" strokeWidth="1" />
        </g>
      )}
    </g>
  );
};

export default ShipSymbol;