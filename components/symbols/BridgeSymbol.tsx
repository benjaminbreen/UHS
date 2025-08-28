/**
 * components/symbols/BridgeSymbol.tsx
 * Bridge rendering for water crossings
 */
import React, { useMemo } from 'react';
import { TILE_SIZE_PX } from '../../constants';

interface BridgeSymbolProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'wooden' | 'stone' | 'iron' | 'modern';
  style: string;
  width?: number;
}

const BridgeSymbol: React.FC<BridgeSymbolProps> = ({
  startX,
  startY,
  endX,
  endY,
  type,
  style,
  width = 1
}) => {
  const bridgeElements = useMemo(() => {
    // Calculate bridge direction and length
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Bridge dimensions
    const bridgeWidth = TILE_SIZE_PX * width * 0.8;
    const bridgeLength = length;
    
    // Center points for tiles
    const centerStartX = startX * TILE_SIZE_PX + TILE_SIZE_PX / 2;
    const centerStartY = startY * TILE_SIZE_PX + TILE_SIZE_PX / 2;
    
    // Color schemes by type
    const colors = {
      wooden: {
        deck: '#8B6B47',
        rail: '#6B5637',
        support: '#5C4A3A',
        shadow: 'rgba(0, 0, 0, 0.3)'
      },
      stone: {
        deck: '#A0A0A0',
        rail: '#808080',
        support: '#707070',
        shadow: 'rgba(0, 0, 0, 0.4)'
      },
      iron: {
        deck: '#5A5A5A',
        rail: '#3A3A3A',
        support: '#2A2A2A',
        shadow: 'rgba(0, 0, 0, 0.5)'
      },
      modern: {
        deck: '#B0B0B0',
        rail: '#909090',
        support: '#808080',
        shadow: 'rgba(0, 0, 0, 0.3)'
      }
    };
    
    const color = colors[type];
    
    return (
      <g transform={`translate(${centerStartX}, ${centerStartY}) rotate(${angle})`}>
        {/* Shadow under bridge */}
        <rect
          x={-bridgeWidth / 2}
          y={-bridgeWidth / 2 + 2}
          width={bridgeLength}
          height={bridgeWidth}
          fill={color.shadow}
          opacity="0.5"
        />
        
        {/* Bridge deck */}
        <rect
          x={-bridgeWidth / 2}
          y={-bridgeWidth / 2}
          width={bridgeLength}
          height={bridgeWidth}
          fill={color.deck}
          stroke={color.support}
          strokeWidth="1"
        />
        
        {/* Wooden planks texture */}
        {type === 'wooden' && (
          <>
            {Array.from({ length: Math.floor(bridgeLength / 4) }, (_, i) => (
              <line
                key={`plank-${i}`}
                x1={i * 4}
                y1={-bridgeWidth / 2}
                x2={i * 4}
                y2={bridgeWidth / 2}
                stroke={color.support}
                strokeWidth="0.5"
                opacity="0.5"
              />
            ))}
          </>
        )}
        
        {/* Stone blocks texture */}
        {type === 'stone' && (
          <>
            {Array.from({ length: Math.floor(bridgeLength / 8) }, (_, i) => (
              <g key={`block-${i}`}>
                <line
                  x1={i * 8}
                  y1={-bridgeWidth / 2}
                  x2={i * 8}
                  y2={bridgeWidth / 2}
                  stroke={color.support}
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                {i % 2 === 0 && (
                  <line
                    x1={i * 8}
                    y1={0}
                    x2={(i + 1) * 8}
                    y2={0}
                    stroke={color.support}
                    strokeWidth="0.3"
                    opacity="0.2"
                  />
                )}
              </g>
            ))}
          </>
        )}
        
        {/* Iron truss structure */}
        {type === 'iron' && (
          <>
            {/* Diagonal supports */}
            {Array.from({ length: Math.floor(bridgeLength / 10) }, (_, i) => (
              <g key={`truss-${i}`}>
                <line
                  x1={i * 10}
                  y1={-bridgeWidth / 2}
                  x2={(i + 1) * 10}
                  y2={bridgeWidth / 2}
                  stroke={color.support}
                  strokeWidth="1.5"
                />
                <line
                  x1={i * 10}
                  y1={bridgeWidth / 2}
                  x2={(i + 1) * 10}
                  y2={-bridgeWidth / 2}
                  stroke={color.support}
                  strokeWidth="1.5"
                />
              </g>
            ))}
          </>
        )}
        
        {/* Railings */}
        <line
          x1={0}
          y1={-bridgeWidth / 2}
          x2={bridgeLength}
          y2={-bridgeWidth / 2}
          stroke={color.rail}
          strokeWidth="2"
        />
        <line
          x1={0}
          y1={bridgeWidth / 2}
          x2={bridgeLength}
          y2={bridgeWidth / 2}
          stroke={color.rail}
          strokeWidth="2"
        />
        
        {/* Railing posts */}
        {Array.from({ length: Math.floor(bridgeLength / 15) + 1 }, (_, i) => (
          <g key={`post-${i}`}>
            <rect
              x={i * 15 - 1}
              y={-bridgeWidth / 2 - 3}
              width="2"
              height="6"
              fill={color.rail}
            />
            <rect
              x={i * 15 - 1}
              y={bridgeWidth / 2 - 3}
              width="2"
              height="6"
              fill={color.rail}
            />
          </g>
        ))}
        
        {/* Support pillars for longer bridges */}
        {bridgeLength > TILE_SIZE_PX * 2 && (
          <>
            {Array.from({ length: Math.floor(bridgeLength / (TILE_SIZE_PX * 2)) }, (_, i) => (
              <g key={`pillar-${i}`}>
                <rect
                  x={(i + 1) * bridgeLength / (Math.floor(bridgeLength / (TILE_SIZE_PX * 2)) + 1) - 3}
                  y={-bridgeWidth / 2}
                  width="6"
                  height={bridgeWidth + 8}
                  fill={color.support}
                  opacity="0.8"
                />
                {/* Pillar base in water */}
                <ellipse
                  cx={(i + 1) * bridgeLength / (Math.floor(bridgeLength / (TILE_SIZE_PX * 2)) + 1)}
                  cy={bridgeWidth / 2 + 4}
                  rx="5"
                  ry="3"
                  fill={color.support}
                  opacity="0.6"
                />
              </g>
            ))}
          </>
        )}
        
        {/* Special features by style */}
        {style === 'covered' && type === 'wooden' && (
          <g>
            {/* Roof */}
            <polygon
              points={`0,${-bridgeWidth/2 - 8} ${bridgeLength},${-bridgeWidth/2 - 8} ${bridgeLength},${-bridgeWidth/2} 0,${-bridgeWidth/2}`}
              fill="#654321"
              opacity="0.8"
            />
            <polygon
              points={`0,${bridgeWidth/2 + 8} ${bridgeLength},${bridgeWidth/2 + 8} ${bridgeLength},${bridgeWidth/2} 0,${bridgeWidth/2}`}
              fill="#654321"
              opacity="0.8"
            />
            <polygon
              points={`0,${-bridgeWidth/2 - 8} ${bridgeLength},${-bridgeWidth/2 - 8} ${bridgeLength},${bridgeWidth/2 + 8} 0,${bridgeWidth/2 + 8}`}
              fill="#543210"
              opacity="0.6"
            />
          </g>
        )}
        
        {style === 'arch' && type === 'stone' && bridgeLength > TILE_SIZE_PX && (
          <g>
            {/* Arches under the bridge */}
            {Array.from({ length: Math.ceil(bridgeLength / TILE_SIZE_PX) }, (_, i) => (
              <ellipse
                key={`arch-${i}`}
                cx={i * TILE_SIZE_PX + TILE_SIZE_PX / 2}
                cy={bridgeWidth / 2}
                rx={TILE_SIZE_PX / 2 - 2}
                ry={bridgeWidth / 3}
                fill="none"
                stroke={color.support}
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </g>
    );
  }, [startX, startY, endX, endY, type, style, width]);
  
  return <>{bridgeElements}</>;
};

export default React.memo(BridgeSymbol);