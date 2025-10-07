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
    // Calculate bridge direction and length (coordinates are now in pixels)
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    console.log(`[BridgeSymbol] Rendering bridge at (${startX}, ${startY}) to (${endX}, ${endY}):`, {
      dx, dy, length, angle,
      TILE_SIZE_PX,
      width: width,
      calculatedBridgeWidth: TILE_SIZE_PX * width * 0.6
    });

    // Bridge dimensions - sized appropriately for visibility
    const bridgeWidth = TILE_SIZE_PX * width * 0.6; // 0.6 = more visible bridge width
    const bridgeLength = length * 0.95; // Slightly shorter to not overhang
    
    // Use pixel coordinates directly (no multiplication needed)
    const centerStartX = startX;
    const centerStartY = startY;
    
    // Color schemes by type - adjusted to better match road browns
    const colors = {
      wooden: {
        deck: '#9B7653', // Lighter, more road-like brown
        rail: '#7A5D43',
        support: '#6B4E3A',
        shadow: 'rgba(0, 0, 0, 0.4)'
      },
      stone: {
        deck: '#A8A8A8',
        rail: '#888888',
        support: '#787878',
        shadow: 'rgba(0, 0, 0, 0.4)'
      },
      iron: {
        deck: '#6A6A6A',
        rail: '#4A4A4A',
        support: '#3A3A3A',
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
        {/* Enhanced shadow under bridge for better depth */}
        <rect
          x={1}
          y={-bridgeWidth / 2 + 2}
          width={bridgeLength}
          height={bridgeWidth}
          fill={color.shadow}
          opacity="0.4"
          rx="1"
        />
        
        {/* Bridge deck with stronger outline */}
        <rect
          x={0}
          y={-bridgeWidth / 2}
          width={bridgeLength}
          height={bridgeWidth}
          fill={color.deck}
          stroke={color.support}
          strokeWidth="1.5"
          rx="0.5"
        />

        {/* Center highlight line for better definition */}
        <line
          x1={0}
          y1={0}
          x2={bridgeLength}
          y2={0}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        
        {/* Wood textures based on style */}
        {type === 'wooden' && style === 'log' && (
          // Ancient log bridge - just parallel logs
          <>
            {Array.from({ length: 3 }, (_, i) => (
              <rect
                key={`log-${i}`}
                x={0}
                y={-bridgeWidth / 2 + (i * bridgeWidth / 3)}
                width={bridgeLength}
                height={bridgeWidth / 4}
                fill="#8B6B47"
                rx="1"
              />
            ))}
          </>
        )}
        
        {type === 'wooden' && style === 'plank' && (
          // Medieval plank bridge - enhanced visibility
          <>
            {Array.from({ length: Math.floor(bridgeLength / 6) }, (_, i) => (
              <line
                key={`plank-${i}`}
                x1={i * 6}
                y1={-bridgeWidth / 2}
                x2={i * 6}
                y2={bridgeWidth / 2}
                stroke={color.support}
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
          </>
        )}
        
        {type === 'wooden' && style === 'beam' && (
          // Classical beam bridge
          <>
            <rect
              x={0}
              y={-bridgeWidth / 2 + bridgeWidth * 0.3}
              width={bridgeLength}
              height={bridgeWidth * 0.4}
              fill={color.support}
              opacity="0.7"
            />
          </>
        )}
        
        {/* Stone textures based on style */}
        {type === 'stone' && style === 'roman' && (
          // Roman stone with large blocks
          <>
            {Array.from({ length: Math.floor(bridgeLength / 12) }, (_, i) => (
              <g key={`block-${i}`}>
                <rect
                  x={i * 12}
                  y={-bridgeWidth / 2}
                  width={11}
                  height={bridgeWidth}
                  fill="none"
                  stroke={color.support}
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                {i % 2 === 0 && (
                  <line
                    x1={i * 12}
                    y1={0}
                    x2={(i + 1) * 12}
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
        
        {type === 'stone' && style === 'beam' && (
          // Simple stone beam
          <>
            {Array.from({ length: Math.floor(bridgeLength / 8) }, (_, i) => (
              <line
                key={`seam-${i}`}
                x1={i * 8}
                y1={-bridgeWidth / 2}
                x2={i * 8}
                y2={bridgeWidth / 2}
                stroke={color.support}
                strokeWidth="0.3"
                opacity="0.2"
              />
            ))}
          </>
        )}
        
        {/* Iron styles */}
        {type === 'iron' && style === 'truss' && (
          // Industrial truss bridge
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
                {/* Rivets */}
                <circle cx={i * 10} cy={-bridgeWidth / 2} r="1" fill={color.support} />
                <circle cx={i * 10} cy={bridgeWidth / 2} r="1" fill={color.support} />
              </g>
            ))}
          </>
        )}
        
        {type === 'iron' && style === 'railroad' && (
          // Railroad bridge with heavy beams
          <>
            <rect
              x={0}
              y={-bridgeWidth / 2}
              width={bridgeLength}
              height={2}
              fill={color.support}
            />
            <rect
              x={0}
              y={bridgeWidth / 2 - 2}
              width={bridgeLength}
              height={2}
              fill={color.support}
            />
            {/* Cross beams */}
            {Array.from({ length: Math.floor(bridgeLength / 8) }, (_, i) => (
              <rect
                key={`beam-${i}`}
                x={i * 8}
                y={-bridgeWidth / 2}
                width={2}
                height={bridgeWidth}
                fill={color.support}
                opacity="0.8"
              />
            ))}
          </>
        )}
        
        {/* Modern concrete styles - enhanced visibility */}
        {type === 'modern' && (
          <>
            {/* Lighter concrete with better contrast */}
            <rect
              x={0}
              y={-bridgeWidth / 2}
              width={bridgeLength}
              height={bridgeWidth}
              fill="#D8D8D8"
              stroke="#A0A0A0"
              strokeWidth="1.5"
              rx="0.5"
            />

            {/* Concrete panel lines (expansion joints) */}
            {Array.from({ length: Math.floor(bridgeLength / 15) }, (_, i) => (
              <line
                key={`joint-${i}`}
                x1={i * 15}
                y1={-bridgeWidth / 2}
                x2={i * 15}
                y2={bridgeWidth / 2}
                stroke="#B0B0B0"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}

            {/* Edge lines for road surface */}
            <line
              x1={0}
              y1={-bridgeWidth / 2 + 2}
              x2={bridgeLength}
              y2={-bridgeWidth / 2 + 2}
              stroke="#F0F0F0"
              strokeWidth="1.5"
            />
            <line
              x1={0}
              y1={bridgeWidth / 2 - 2}
              x2={bridgeLength}
              y2={bridgeWidth / 2 - 2}
              stroke="#F0F0F0"
              strokeWidth="1.5"
            />

            {/* Center line marking */}
            <line
              x1={0}
              y1={0}
              x2={bridgeLength}
              y2={0}
              stroke="#FFD700"
              strokeWidth="1.5"
              strokeDasharray="8,8"
              opacity="0.8"
            />

            {style === 'highway' && (
              // Additional highway markings
              <>
                <line
                  x1={0}
                  y1={-bridgeWidth / 4}
                  x2={bridgeLength}
                  y2={-bridgeWidth / 4}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  strokeDasharray="12,8"
                  opacity="0.7"
                />
                <line
                  x1={0}
                  y1={bridgeWidth / 4}
                  x2={bridgeLength}
                  y2={bridgeWidth / 4}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  strokeDasharray="12,8"
                  opacity="0.7"
                />
              </>
            )}
          </>
        )}
        
        {/* Enhanced railings for better visibility */}
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

        {/* Outer edge highlight for railings */}
        <line
          x1={0}
          y1={-bridgeWidth / 2 - 1}
          x2={bridgeLength}
          y2={-bridgeWidth / 2 - 1}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="1"
        />
        <line
          x1={0}
          y1={bridgeWidth / 2 + 1}
          x2={bridgeLength}
          y2={bridgeWidth / 2 + 1}
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="1"
        />
        
        {/* More visible railing posts */}
        {Array.from({ length: Math.max(3, Math.floor(bridgeLength / 20)) }, (_, i) => {
          const spacing = bridgeLength / (Math.max(3, Math.floor(bridgeLength / 20)) - 1);
          return (
            <g key={`post-${i}`}>
              <rect
                x={i * spacing - 1}
                y={-bridgeWidth / 2 - 3}
                width="2"
                height="6"
                fill={color.rail}
              />
              <rect
                x={i * spacing - 1}
                y={bridgeWidth / 2 - 3}
                width="2"
                height="6"
                fill={color.rail}
              />
            </g>
          );
        })}
        
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
            {/* Medieval covered bridge roof */}
            <polygon
              points={`0,${-bridgeWidth/2 - 10} ${bridgeLength},${-bridgeWidth/2 - 10} ${bridgeLength},${-bridgeWidth/2} 0,${-bridgeWidth/2}`}
              fill="#654321"
              opacity="0.9"
            />
            <polygon
              points={`0,${bridgeWidth/2 + 10} ${bridgeLength},${bridgeWidth/2 + 10} ${bridgeLength},${bridgeWidth/2} 0,${bridgeWidth/2}`}
              fill="#654321"
              opacity="0.9"
            />
            {/* Roof peak */}
            <polygon
              points={`0,${-bridgeWidth/2 - 10} ${bridgeLength},${-bridgeWidth/2 - 10} ${bridgeLength},${bridgeWidth/2 + 10} 0,${bridgeWidth/2 + 10}`}
              fill="#4A3018"
              opacity="0.7"
            />
          </g>
        )}
        
        {style === 'truss' && type === 'wooden' && (
          // Early modern wooden truss
          <g>
            {Array.from({ length: Math.floor(bridgeLength / 15) }, (_, i) => (
              <g key={`wood-truss-${i}`}>
                <line
                  x1={i * 15}
                  y1={-bridgeWidth / 2}
                  x2={(i + 0.5) * 15}
                  y2={-bridgeWidth / 2 - 8}
                  stroke={color.support}
                  strokeWidth="2"
                />
                <line
                  x1={(i + 0.5) * 15}
                  y1={-bridgeWidth / 2 - 8}
                  x2={(i + 1) * 15}
                  y2={-bridgeWidth / 2}
                  stroke={color.support}
                  strokeWidth="2"
                />
              </g>
            ))}
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