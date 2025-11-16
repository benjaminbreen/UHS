import React from 'react';
import { Item } from '../../types';
import GenerativeItemIcon from './GenerativeItemIcon';

interface DroppedItemMarkerProps {
  item: Item;
  x: number;  // Pixel x position
  y: number;  // Pixel y position
  cellSize: number;  // Size of one tile in pixels
}

/**
 * DroppedItemMarker - Renders a dropped item icon on the map
 * Uses the same GenerativeItemIcon system as the inventory
 */
export default function DroppedItemMarker({ item, x, y, cellSize }: DroppedItemMarkerProps) {
  // Calculate centered position within the tile - larger icon now (90% of tile)
  const iconSize = Math.floor(cellSize * 0.9);
  const offset = (cellSize - iconSize) / 2;

  return (
    <g transform={`translate(${x + offset}, ${y + offset})`}>
      {/* Subtle glow effect using SVG filter */}
      <defs>
        <filter id={`item-glow-${item.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="0" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Item icon container with glow */}
      <foreignObject
        x={0}
        y={0}
        width={iconSize}
        height={iconSize}
        filter={`url(#item-glow-${item.id})`}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))',
          }}
        >
          <GenerativeItemIcon
            item={item}
            size={iconSize}
          />
        </div>
      </foreignObject>
    </g>
  );
}
