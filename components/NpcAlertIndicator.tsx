import React from 'react';
import { NpcEntity } from '../types';

interface NpcAlertIndicatorProps {
  npc: NpcEntity;
  alertLevel: 'detecting' | 'warning' | 'pursuing';
  x: number;
  y: number;
  tileSize: number;
}

const NpcAlertIndicator: React.FC<NpcAlertIndicatorProps> = ({
  npc,
  alertLevel,
  x,
  y,
  tileSize
}) => {
  const getIndicator = () => {
    switch(alertLevel) {
      case 'detecting': return '?';  // Yellow - guard notices something
      case 'warning': return '!';     // Orange - guard issues warning
      case 'pursuing': return '!!';   // Red - guard actively pursuing
    }
  };

  const getColor = () => {
    switch(alertLevel) {
      case 'detecting': return '#FFD700'; // Gold
      case 'warning': return '#FFA500';   // Orange
      case 'pursuing': return '#FF0000';  // Red
    }
  };

  const getAnimation = () => {
    switch(alertLevel) {
      case 'detecting': return 'animate-pulse';
      case 'warning': return 'animate-bounce';
      case 'pursuing': return 'animate-bounce animate-pulse'; // Combined animation
    }
  };

  // Since this will be rendered inside an SVG, use SVG elements
  return (
    <g className={`pointer-events-none ${getAnimation()}`}>
      {/* Black shadow/outline for visibility */}
      <text
        x={x + tileSize * 0.5}
        y={y - tileSize * 0.1}
        fontSize={tileSize * 0.6}
        fill="black"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
        opacity={0.8}
        strokeWidth={2}
        stroke="black"
      >
        {getIndicator()}
      </text>
      {/* Main colored indicator */}
      <text
        x={x + tileSize * 0.5}
        y={y - tileSize * 0.1}
        fontSize={tileSize * 0.6}
        fill={getColor()}
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {getIndicator()}
      </text>
    </g>
  );
};

export default NpcAlertIndicator;