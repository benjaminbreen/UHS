/**
 * components/symbols/NpcIconEnhanced.tsx
 * Enhanced NPC rendering with tamed animals, work states, and attitude indicators
 */
import React from 'react';
import { NpcEntity } from '../../types';
import NpcIcon from './NpcIcon';

interface NpcIconEnhancedProps {
  npc: NpcEntity;
  size: number;
  tileSize: number;
  showWorkState?: boolean;
  showAttitude?: boolean;
}

const NpcIconEnhanced: React.FC<NpcIconEnhancedProps> = React.memo(({ 
  npc, 
  size, 
  tileSize,
  showWorkState = true,
  showAttitude = true
}) => {
  // Don't render if NPC is inside a building
  if (npc.isInsideBuilding) {
    return null;
  }
  
  // Calculate attitude indicator color
  const getAttitudeColor = () => {
    if (!npc.playerRelationship) return null;
    const attitude = npc.playerRelationship.attitude;
    if (attitude < -50) return '#ff0000'; // Hostile
    if (attitude < -20) return '#ff8800'; // Unfriendly
    if (attitude > 50) return '#00ff00'; // Friendly
    if (attitude > 20) return '#88ff00'; // Positive
    return null; // Neutral
  };
  
  const attitudeColor = getAttitudeColor();
  
  return (
    <g>
      {/* Work state indicator */}
      {showWorkState && npc.currentActivity && npc.currentActivity !== 'idle' && (
        <g opacity={0.7}>
          {npc.currentActivity === 'working' && (
            <circle cx={tileSize/2} cy={tileSize/2 - size * 0.7} r={3} fill="#ffcc00">
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
          {npc.currentActivity === 'traveling' && (
            <path
              d={`M ${tileSize/2 - 5} ${tileSize/2 - size * 0.7} L ${tileSize/2 + 5} ${tileSize/2 - size * 0.7}`}
              stroke="#8888ff"
              strokeWidth="2"
              strokeDasharray="2,2"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;4"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </g>
      )}
      
      {/* Attitude indicator */}
      {showAttitude && attitudeColor && (
        <circle
          cx={tileSize/2 + size * 0.4}
          cy={tileSize/2 - size * 0.4}
          r={4}
          fill={attitudeColor}
          opacity={0.8}
        />
      )}
      
      {/* Main NPC sprite */}
      <NpcIcon npc={npc} size={size} tileSize={tileSize} />
      
      {/* Tamed animals following behind */}
      {npc.tamedAnimals && npc.tamedAnimals.map((animal, index) => {
        const offsetX = -size * (0.8 + index * 0.5) * 
          (npc.direction === 'left' ? -1 : npc.direction === 'right' ? 1 : 0);
        const offsetY = -size * (0.8 + index * 0.5) * 
          (npc.direction === 'up' ? -1 : npc.direction === 'down' ? 1 : 0);
        
        return (
          <g key={index} transform={`translate(${offsetX}, ${offsetY})`}>
            {renderAnimal(animal.type, tileSize * 0.6)}
          </g>
        );
      })}
      
      {/* Confrontation indicator */}
      {npc.playerRelationship?.willConfront && (
        <text
          x={tileSize/2}
          y={tileSize/2 - size * 0.9}
          fontSize="14"
          fill="#ff0000"
          textAnchor="middle"
          fontWeight="bold"
        >
          !
        </text>
      )}
    </g>
  );
});

// Simple animal renderers
function renderAnimal(type: string, size: number): JSX.Element {
  const s = size / 20; // Scale factor
  
  switch(type) {
    case 'camel':
      return (
        <g>
          <ellipse cx={0} cy={s * 8} rx={s * 3} ry={s * 1} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={-s * 3} cy={0} rx={s * 5} ry={s * 4} fill="#C4915C" />
          <ellipse cx={s * 2} cy={-s * 2} rx={s * 3} ry={s * 5} fill="#C4915C" />
          <ellipse cx={s * 2} cy={-s * 6} rx={s * 2} ry={s * 2} fill="#C4915C" />
          <rect x={-s * 5} y={0} width={s * 1.5} height={s * 6} fill="#B8824F" />
          <rect x={-s * 2} y={0} width={s * 1.5} height={s * 6} fill="#B8824F" />
          <rect x={s * 1} y={0} width={s * 1.5} height={s * 6} fill="#B8824F" />
          <rect x={s * 3} y={0} width={s * 1.5} height={s * 6} fill="#B8824F" />
        </g>
      );
      
    case 'horse':
      return (
        <g>
          <ellipse cx={0} cy={s * 8} rx={s * 3} ry={s * 1} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 5} ry={s * 3} fill="#8B4513" />
          <rect x={s * 3} y={-s * 2} width={s * 3} height={s * 2} fill="#8B4513" />
          <rect x={-s * 4} y={0} width={s * 1.5} height={s * 6} fill="#654321" />
          <rect x={-s * 1} y={0} width={s * 1.5} height={s * 6} fill="#654321" />
          <rect x={s * 2} y={0} width={s * 1.5} height={s * 6} fill="#654321" />
          <rect x={s * 4} y={0} width={s * 1.5} height={s * 6} fill="#654321" />
          <path d={`M ${s * 5} ${-s * 3} Q ${s * 7} ${-s * 2} ${s * 6} ${0}`} stroke="#333" strokeWidth="1" fill="none" />
        </g>
      );
      
    case 'ox':
      return (
        <g>
          <ellipse cx={0} cy={s * 8} rx={s * 3} ry={s * 1} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 6} ry={s * 4} fill="#8B7355" />
          <rect x={s * 3} y={-s * 3} width={s * 3} height={s * 3} fill="#8B7355" />
          <path d={`M ${s * 4} ${-s * 4} L ${s * 5} ${-s * 5}`} stroke="#FFF" strokeWidth="1.5" />
          <path d={`M ${s * 5} ${-s * 4} L ${s * 6} ${-s * 5}`} stroke="#FFF" strokeWidth="1.5" />
          <rect x={-s * 4} y={0} width={s * 2} height={s * 6} fill="#6B5D4F" />
          <rect x={s * 2} y={0} width={s * 2} height={s * 6} fill="#6B5D4F" />
        </g>
      );
      
    case 'sheep':
      return (
        <g>
          <ellipse cx={0} cy={s * 6} rx={s * 2.5} ry={s * 1} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 4} ry={s * 3} fill="#F5F5DC" stroke="#DDD" strokeWidth="0.5" />
          <ellipse cx={s * 3} cy={-s * 1} rx={s * 2} ry={s * 1.5} fill="#F5F5DC" />
          <rect x={-s * 2} y={0} width={s * 1} height={s * 4} fill="#333" />
          <rect x={s * 1} y={0} width={s * 1} height={s * 4} fill="#333" />
        </g>
      );
      
    case 'dog':
      return (
        <g>
          <ellipse cx={0} cy={s * 5} rx={s * 2} ry={s * 0.8} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 3} ry={s * 2} fill="#8B4513" />
          <ellipse cx={s * 2.5} cy={-s * 1} rx={s * 1.5} ry={s * 1.2} fill="#8B4513" />
          <path d={`M ${s * 2} ${-s * 2} L ${s * 2.5} ${-s * 2.5} L ${s * 3} ${-s * 2}`} fill="#8B4513" />
          <path d={`M ${-s * 3} ${0} Q ${-s * 4} ${-s * 1} ${-s * 3.5} ${-s * 2}`} stroke="#8B4513" strokeWidth="2" fill="none" />
          <rect x={-s * 2} y={0} width={s * 0.8} height={s * 3} fill="#654321" />
          <rect x={s * 1} y={0} width={s * 0.8} height={s * 3} fill="#654321" />
        </g>
      );
      
    case 'chicken':
      return (
        <g>
          <ellipse cx={0} cy={s * 4} rx={s * 1.5} ry={s * 0.5} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 2} ry={s * 1.8} fill="#FFF" />
          <path d={`M 0 ${-s * 1.5} L ${s * 0.5} ${-s * 2.5} L ${-s * 0.5} ${-s * 2.5} Z`} fill="#FF0000" />
          <circle cx={s * 1.5} cy={-s * 0.5} r={s * 0.3} fill="#000" />
          <path d={`M ${s * 2} ${-s * 0.5} L ${s * 2.5} ${-s * 0.3}`} stroke="#FFA500" strokeWidth="1" />
          <rect x={-s * 0.5} y={0} width={s * 0.5} height={s * 2} fill="#FFA500" />
          <rect x={s * 0.5} y={0} width={s * 0.5} height={s * 2} fill="#FFA500" />
        </g>
      );
      
    case 'donkey':
      return (
        <g>
          <ellipse cx={0} cy={s * 6} rx={s * 2.5} ry={s * 1} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 4} ry={s * 2.5} fill="#999" />
          <rect x={s * 2.5} y={-s * 2} width={s * 2.5} height={s * 2} fill="#999" />
          <path d={`M ${s * 4} ${-s * 3} L ${s * 4.5} ${-s * 4} M ${s * 5} ${-s * 3} L ${s * 5.5} ${-s * 4}`} stroke="#999" strokeWidth="1.5" />
          <rect x={-s * 3} y={0} width={s * 1.2} height={s * 5} fill="#777" />
          <rect x={s * 1.5} y={0} width={s * 1.2} height={s * 5} fill="#777" />
        </g>
      );
      
    case 'goat':
      return (
        <g>
          <ellipse cx={0} cy={s * 5} rx={s * 2} ry={s * 0.8} fill="rgba(0,0,0,0.3)" />
          <ellipse cx={0} cy={0} rx={s * 3.5} ry={s * 2.5} fill="#D2B48C" />
          <ellipse cx={s * 3} cy={-s * 1} rx={s * 1.8} ry={s * 1.5} fill="#D2B48C" />
          <path d={`M ${s * 3} ${-s * 2} L ${s * 2.5} ${-s * 3} M ${s * 4} ${-s * 2} L ${s * 4.5} ${-s * 3}`} stroke="#FFF" strokeWidth="1" />
          <path d={`M ${s * 3.5} ${s * 0.5} L ${s * 4} ${s * 1.5}`} stroke="#999" strokeWidth="1" fill="none" />
          <rect x={-s * 2} y={0} width={s * 1} height={s * 4} fill="#A0826D" />
          <rect x={s * 1.5} y={0} width={s * 1} height={s * 4} fill="#A0826D" />
        </g>
      );
      
    default:
      return <circle cx={0} cy={0} r={size/4} fill="#888" />;
  }
}

NpcIconEnhanced.displayName = 'NpcIconEnhanced';

export default NpcIconEnhanced;