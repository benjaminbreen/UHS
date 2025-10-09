/**
 * TrainSymbol.tsx - Animated train that follows SVG railroad paths
 * PERFORMANCE OPTIMIZED: Uses CSS animations instead of React state updates
 */
import React from 'react';
import { TILE_SIZE_PX } from '../../constants';

interface TrainSymbolProps {
  pathData: string; // SVG path d attribute
  speed?: number; // 0-1, progress per second
  numCars?: number; // Number of train cars
}

const TrainSymbol: React.FC<TrainSymbolProps> = React.memo(({ pathData, speed = 0.02, numCars = 2 }) => {
  const trainSize = TILE_SIZE_PX * 0.35; // Much smaller trains
  const animationDuration = (1 / speed).toFixed(1); // Convert speed to duration in seconds

  // Generate unique ID for this path to avoid animation conflicts
  const pathId = React.useMemo(() => `train-path-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <g>
      {/* Define the path for animation */}
      <defs>
        <path id={pathId} d={pathData} />
      </defs>

      {/* Animated train group using animateMotion */}
      <g>
        <animateMotion
          dur={`${animationDuration}s`}
          repeatCount="indefinite"
          rotate="auto"
        >
          <mpath href={`#${pathId}`} />
        </animateMotion>

        {/* Engine */}
        <rect
          x={-trainSize/2 + trainSize * 0.05}
          y={-trainSize/2 + trainSize * 0.3}
          width={trainSize * 0.4}
          height={trainSize * 0.4}
          fill="#1a1a1a"
          stroke="#000"
          strokeWidth={trainSize * 0.02}
          rx={trainSize * 0.05}
        />

        {/* Cabin */}
        <rect
          x={-trainSize/2 + trainSize * 0.1}
          y={-trainSize/2 + trainSize * 0.35}
          width={trainSize * 0.15}
          height={trainSize * 0.2}
          fill="#3a3a3a"
        />

        {/* Smoke stack */}
        <rect
          x={-trainSize/2 + trainSize * 0.35}
          y={-trainSize/2 + trainSize * 0.2}
          width={trainSize * 0.08}
          height={trainSize * 0.15}
          fill="#2a2a2a"
        />

        {/* Wheels */}
        <circle cx={-trainSize/2 + trainSize * 0.15} cy={-trainSize/2 + trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
        <circle cx={-trainSize/2 + trainSize * 0.35} cy={-trainSize/2 + trainSize * 0.7} r={trainSize * 0.08} fill="#222" />

        {/* Car */}
        <rect
          x={-trainSize/2 + trainSize * 0.5}
          y={-trainSize/2 + trainSize * 0.3}
          width={trainSize * 0.4}
          height={trainSize * 0.4}
          fill="#2a2a2a"
          stroke="#000"
          strokeWidth={trainSize * 0.02}
          rx={trainSize * 0.05}
        />

        {/* Car wheels */}
        <circle cx={-trainSize/2 + trainSize * 0.6} cy={-trainSize/2 + trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
        <circle cx={-trainSize/2 + trainSize * 0.8} cy={-trainSize/2 + trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
      </g>
    </g>
  );
});

TrainSymbol.displayName = 'TrainSymbol';

export default TrainSymbol;
