/**
 * TrainSymbol.tsx - Animated train that follows SVG railroad paths
 */
import React, { useEffect, useState } from 'react';
import { TILE_SIZE_PX } from '../../constants';

interface TrainSymbolProps {
  pathData: string; // SVG path d attribute
  speed?: number; // 0-1, progress per second
  numCars?: number; // Number of train cars
}

// Parse SVG path to get points
function parseSVGPath(pathData: string): Array<{x: number; y: number}> {
  const points: Array<{x: number; y: number}> = [];
  const commands = pathData.match(/[MLQ]\s*[\d.\s,]+/g) || [];
  
  for (const cmd of commands) {
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    if (cmd.startsWith('M') || cmd.startsWith('L')) {
      points.push({ x: coords[0], y: coords[1] });
    } else if (cmd.startsWith('Q')) {
      // Quadratic curve: control point + end point
      points.push({ x: coords[2], y: coords[3] });
    }
  }
  
  return points;
}

// Get position along path based on progress (0-1)
function getPositionAtProgress(points: Array<{x: number; y: number}>, progress: number): {x: number; y: number; angle: number} | null {
  if (points.length < 2) return null;
  
  const totalLength = points.length - 1;
  const targetIndex = Math.min(Math.floor(progress * totalLength), totalLength - 1);
  const localProgress = (progress * totalLength) - targetIndex;
  
  const p1 = points[targetIndex];
  const p2 = points[targetIndex + 1] || p1;
  
  const x = p1.x + (p2.x - p1.x) * localProgress;
  const y = p1.y + (p2.y - p1.y) * localProgress;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  
  return { x, y, angle };
}

const TrainSymbol: React.FC<TrainSymbolProps> = React.memo(({ pathData, speed = 0.02, numCars = 2 }) => {
  const [progress, setProgress] = useState(0);
  const points = React.useMemo(() => parseSVGPath(pathData), [pathData]);
  
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;

      // PERFORMANCE FIX: Only update at 15 FPS instead of 60 FPS
      if (delta < 1/15) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      lastTime = now;

      setProgress(prev => {
        const newProgress = prev + speed * delta;
        // Loop back to start when reaching end
        return newProgress >= 1 ? 0 : newProgress;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [speed]);
  
  const position = getPositionAtProgress(points, progress);
  if (!position) return null;
  
  const trainSize = TILE_SIZE_PX * 0.35; // Much smaller trains
  
  return (
    <g transform={`translate(${position.x - trainSize/2}, ${position.y - trainSize/2}) rotate(${position.angle}, ${trainSize/2}, ${trainSize/2})`}>
      {/* Engine */}
      <rect
        x={trainSize * 0.05}
        y={trainSize * 0.3}
        width={trainSize * 0.4}
        height={trainSize * 0.4}
        fill="#1a1a1a"
        stroke="#000"
        strokeWidth={trainSize * 0.02}
        rx={trainSize * 0.05}
      />
      
      {/* Cabin */}
      <rect
        x={trainSize * 0.1}
        y={trainSize * 0.35}
        width={trainSize * 0.15}
        height={trainSize * 0.2}
        fill="#3a3a3a"
      />
      
      {/* Smoke stack */}
      <rect
        x={trainSize * 0.35}
        y={trainSize * 0.2}
        width={trainSize * 0.08}
        height={trainSize * 0.15}
        fill="#2a2a2a"
      />
      
      {/* Wheels */}
      <circle cx={trainSize * 0.15} cy={trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
      <circle cx={trainSize * 0.35} cy={trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
      
      {/* Car */}
      <rect
        x={trainSize * 0.5}
        y={trainSize * 0.3}
        width={trainSize * 0.4}
        height={trainSize * 0.4}
        fill="#2a2a2a"
        stroke="#000"
        strokeWidth={trainSize * 0.02}
        rx={trainSize * 0.05}
      />
      
      {/* Car wheels */}
      <circle cx={trainSize * 0.6} cy={trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
      <circle cx={trainSize * 0.8} cy={trainSize * 0.7} r={trainSize * 0.08} fill="#222" />
    </g>
  );
});

TrainSymbol.displayName = 'TrainSymbol';

export default TrainSymbol;
