/**
 * TrainSymbol.tsx - Animated train that travels along railroad tracks
 */
import React, { useEffect, useState, useMemo } from 'react';
import { TILE_SIZE_PX } from '../../constants';

interface TrainSymbolProps {
  pathData: string; // SVG path data for the railroad
  speed?: number; // Speed of the train (default 0.02 = 2% per frame)
  numCars?: number; // Number of train cars (randomized if not provided)
}

const TrainSymbol: React.FC<TrainSymbolProps> = ({ 
  pathData, 
  speed = 0.02,
  numCars 
}) => {
  const [progress, setProgress] = useState(0);
  const [smokeAnimation, setSmokeAnimation] = useState(0);
  
  // Randomize number of cars if not provided
  const actualNumCars = useMemo(() => {
    return numCars ?? Math.floor(Math.random() * 4) + 2; // 2-5 cars
  }, [numCars]);

  // Create a ref for the path element
  const pathRef = React.useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(1000);

  // Get path length once mounted
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + speed;
        return next > 1 ? 0 : next; // Loop back to start
      });
      setSmokeAnimation(prev => (prev + 1) % 4);
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [speed]);

  // Calculate position along path
  const getPositionAtProgress = (offset: number) => {
    if (!pathRef.current) return { x: 0, y: 0, angle: 0 };
    
    const adjustedProgress = Math.max(0, Math.min(1, progress - offset));
    const point = pathRef.current.getPointAtLength(adjustedProgress * pathLength);
    
    // Calculate angle for rotation
    const nextPoint = pathRef.current.getPointAtLength(
      Math.min(pathLength, adjustedProgress * pathLength + 1)
    );
    const angle = Math.atan2(
      nextPoint.y - point.y,
      nextPoint.x - point.x
    ) * (180 / Math.PI);
    
    return { x: point.x, y: point.y, angle };
  };

  const locomotivePos = getPositionAtProgress(0);
  
  // Size constants
  const LOCOMOTIVE_SIZE = TILE_SIZE_PX * 0.5;
  const CAR_SIZE = TILE_SIZE_PX * 0.4;
  const CAR_SPACING = TILE_SIZE_PX * 0.02;

  return (
    <g className="train-symbol">
      {/* Hidden path for measurement */}
      <path
        ref={pathRef}
        d={pathData}
        fill="none"
        stroke="none"
        opacity="0"
      />
      {/* Train Cars (drawn first so they appear behind locomotive) */}
      {Array.from({ length: actualNumCars }).map((_, idx) => {
        const carOffset = (idx + 1) * (CAR_SIZE + CAR_SPACING) / pathLength;
        const carPos = getPositionAtProgress(carOffset);
        const isLastCar = idx === actualNumCars - 1;
        
        return (
          <g 
            key={`car-${idx}`}
            transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle})`}
          >
            {/* Train car body */}
            <rect
              x={-CAR_SIZE / 2}
              y={-CAR_SIZE / 3}
              width={CAR_SIZE}
              height={CAR_SIZE * 0.6}
              fill={isLastCar ? "#d2691e" : "#8b4513"} // Caboose is lighter brown
              stroke="#654321"
              strokeWidth="1"
              rx="2"
            />
            
            {/* Windows for passenger cars or caboose details */}
            {isLastCar ? (
              // Caboose cupola
              <rect
                x={-CAR_SIZE / 4}
                y={-CAR_SIZE / 2.5}
                width={CAR_SIZE / 2}
                height={CAR_SIZE * 0.2}
                fill="#ffd700"
                opacity="0.7"
              />
            ) : (
              // Regular car windows
              <>
                <rect
                  x={-CAR_SIZE / 3}
                  y={-CAR_SIZE / 6}
                  width={CAR_SIZE * 0.2}
                  height={CAR_SIZE * 0.2}
                  fill="#87ceeb"
                  opacity="0.6"
                />
                <rect
                  x={CAR_SIZE / 3 - CAR_SIZE * 0.2}
                  y={-CAR_SIZE / 6}
                  width={CAR_SIZE * 0.2}
                  height={CAR_SIZE * 0.2}
                  fill="#87ceeb"
                  opacity="0.6"
                />
              </>
            )}
          </g>
        );
      })}

      {/* Locomotive */}
      <g transform={`translate(${locomotivePos.x}, ${locomotivePos.y}) rotate(${locomotivePos.angle})`}>
        {/* Main body */}
        <rect
          x={-LOCOMOTIVE_SIZE / 2}
          y={-LOCOMOTIVE_SIZE / 3}
          width={LOCOMOTIVE_SIZE}
          height={LOCOMOTIVE_SIZE * 0.6}
          fill="#2c2c2c"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          rx="3"
        />
        
        {/* Smokestack */}
        <rect
          x={LOCOMOTIVE_SIZE / 4}
          y={-LOCOMOTIVE_SIZE / 2}
          width={LOCOMOTIVE_SIZE * 0.15}
          height={LOCOMOTIVE_SIZE * 0.3}
          fill="#1a1a1a"
        />
        
        {/* Cab window */}
        <rect
          x={-LOCOMOTIVE_SIZE / 3}
          y={-LOCOMOTIVE_SIZE / 4}
          width={LOCOMOTIVE_SIZE * 0.3}
          height={LOCOMOTIVE_SIZE * 0.3}
          fill="#ffd700"
          opacity="0.8"
        />
        
        {/* Cowcatcher */}
        <polygon
          points={`${LOCOMOTIVE_SIZE/2},0 ${LOCOMOTIVE_SIZE/2 + 8},-${LOCOMOTIVE_SIZE/4} ${LOCOMOTIVE_SIZE/2 + 8},${LOCOMOTIVE_SIZE/4}`}
          fill="#666"
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Animated smoke puffs */}
        <g transform={`translate(${LOCOMOTIVE_SIZE / 3}, ${-LOCOMOTIVE_SIZE / 2})`}>
          {[0, 1, 2].map(i => (
            <circle
              key={`smoke-${i}`}
              cx={-i * 5 - smokeAnimation * 2}
              cy={-i * 8 - smokeAnimation * 3}
              r={4 + i * 2}
              fill="#808080"
              opacity={Math.max(0, 0.6 - i * 0.2 - smokeAnimation * 0.1)}
              style={{
                transition: 'all 0.1s ease-out',
                filter: `blur(${1 + i}px)`
              }}
            />
          ))}
        </g>
      </g>
    </g>
  );
};

export default TrainSymbol;