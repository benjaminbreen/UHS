/**
 * components/symbols/BushSymbol.tsx - Renders various types of bushes and shrubs with enhanced visuals
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface BushSymbolProps {
  seed: number;
}

const BushSymbol: React.FC<BushSymbolProps> = ({ seed }) => {
  // Pre-calculate all random values once
  const bushData = React.useMemo(() => {
    const noise = new ValueNoise(seed);
    const rand = () => noise.random();
    return {
      bushType: rand(),
      size: 4.5 + rand() * 3,
      density: 0.7 + rand() * 0.3,
      rand // Pass the random function for use in render
    };
  }, [seed]);
  
  const { bushType, size, density, rand: localRand } = bushData;
  
  if (bushType < 0.33) {
    // Simplified rounded leafy bush - reduced complexity
    const numClusters = 2 + Math.floor(localRand() * 2); // Reduced from 5-9 to 2-4
    const baseHue = 100 + localRand() * 35;
    const baseColor = `hsl(${baseHue}, ${45 + localRand() * 20}%, ${38 + localRand() * 12}%)`;
    const shadowColor = `hsl(${baseHue - 5}, ${50 + localRand() * 15}%, ${22 + localRand() * 8}%)`;
    const highlightColor = `hsl(${baseHue + 5}, ${35 + localRand() * 15}%, ${55 + localRand() * 10}%)`;
    
    const clusters = [];
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2 + localRand() * 0.6;
      const distance = size * 0.45 * (0.6 + localRand() * 0.4);
      const clusterSize = size * 0.55 * (0.8 + localRand() * 0.4);
      const cx = 12 + Math.cos(angle) * distance;
      const cy = 20 - size * 0.3 + Math.sin(angle) * distance * 0.7;
      
      clusters.push(
        <g key={`cluster-${i}`}>
          {/* Main cluster - removed redundant shadow layers */}
          <circle
            cx={cx}
            cy={cy}
            r={clusterSize}
            fill={i % 2 === 0 ? baseColor : shadowColor}
            opacity={density}
          />
          {/* Single highlight - removed detail highlights */}
          <circle
            cx={cx - clusterSize * 0.35}
            cy={cy - clusterSize * 0.35}
            r={clusterSize * 0.35}
            fill={highlightColor}
            opacity={density * 0.5}
          />
        </g>
      );
    }
    
    return (
      <g>
        {/* Single ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size * 1.1}
          ry={size * 0.3}
          fill="rgba(0,0,0,0.3)"
        />
        
        {/* Central mass - simplified */}
        <circle
          cx="12"
          cy={20 - size * 0.3}
          r={size * 0.65}
          fill={shadowColor}
          opacity={density * 0.9}
        />
        
        {/* Clusters */}
        {clusters}
        
        {/* Simplified branches - reduced from 4 to 2 */}
        {Array.from({ length: 2 }).map((_, i) => {
          const branchAngle = (i / 2) * Math.PI + localRand() * 0.3;
          const branchLength = size * 0.4;
          return (
            <line
              key={`branch-${i}`}
              x1="12"
              y1={20}
              x2={12 + Math.cos(branchAngle) * branchLength}
              y2={20 + Math.sin(branchAngle) * branchLength * 0.6}
              stroke="hsl(25, 40%, 28%)"
              strokeWidth="0.6"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}
      </g>
    );
  } else if (bushType < 0.66) {
    // Simplified spiky desert shrub
    const numSpikes = 5 + Math.floor(localRand() * 3); // Reduced from 10-18 to 5-8
    const baseHue = 85 + localRand() * 30;
    const baseColor = `hsl(${baseHue}, ${35 + localRand() * 20}%, ${42 + localRand() * 15}%)`;
    const tipColor = `hsl(${baseHue + 10}, ${30 + localRand() * 15}%, ${60 + localRand() * 10}%)`;
    
    const spikes = [];
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i / numSpikes) * Math.PI * 2 + (localRand() - 0.5) * 0.4;
      const length = size * (0.7 + localRand() * 0.5);
      const thickness = 1.0 - i * 0.05;
      const baseX = 12 + Math.cos(angle) * 1.2;
      const baseY = 20.5 + Math.sin(angle) * 0.6;
      const tipX = 12 + Math.cos(angle) * length;
      const tipY = 20.5 - Math.abs(Math.sin(angle)) * length * 0.9;
      
      spikes.push(
        <g key={`spike-${i}`}>
          {/* Main spike - removed shadow */}
          <line
            x1={baseX}
            y1={baseY}
            x2={tipX}
            y2={tipY}
            stroke={baseColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {/* Simple tip dot - smaller */}
          <circle
            cx={tipX}
            cy={tipY}
            r="0.3"
            fill={tipColor}
            opacity="0.7"
          />
        </g>
      );
    }
    
    return (
      <g>
        {/* Single ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size}
          ry={size * 0.25}
          fill="rgba(0,0,0,0.3)"
        />
        
        {/* Simplified central base */}
        <ellipse
          cx="12"
          cy="20.5"
          rx="1.8"
          ry="1"
          fill={baseColor}
          opacity="0.9"
        />
        
        {/* Spikes */}
        {spikes}
      </g>
    );
  } else {
    // Simplified flowering bush
    const numFlowers = 3 + Math.floor(localRand() * 2); // Reduced from 7-12 to 3-5
    const leafHue = 110 + localRand() * 25;
    const leafColor = `hsl(${leafHue}, ${40 + localRand() * 20}%, ${38 + localRand() * 10}%)`;
    const flowerHue = localRand() > 0.5 ? 300 + localRand() * 60 : localRand() * 60;
    const flowerColor = `hsl(${flowerHue}, ${65 + localRand() * 20}%, ${68 + localRand() * 10}%)`;
    const flowerCenterColor = `hsl(${50 + localRand() * 20}, 75%, 65%)`;
    
    const elements = [];
    
    // Simplified leafy base - reduced from 6 to 3
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const leafX = 12 + Math.cos(angle) * size * 0.5;
      const leafY = 20 - size * 0.2 + Math.sin(angle) * size * 0.25;
      const leafSize = size * 0.5 * (0.8 + localRand() * 0.4);
      
      // Single leaf - no shadow
      elements.push(
        <ellipse
          key={`leaf-${i}`}
          cx={leafX}
          cy={leafY}
          rx={leafSize}
          ry={leafSize * 0.65}
          fill={leafColor}
          opacity="0.85"
          transform={`rotate(${angle * 180 / Math.PI} ${leafX} ${leafY})`}
        />
      );
    }
    
    // Simplified flowers
    for (let i = 0; i < numFlowers; i++) {
      const angle = (i / numFlowers) * Math.PI * 2 + localRand() * 0.6;
      const distance = size * 0.6 * (0.6 + localRand() * 0.4);
      const flowerX = 12 + Math.cos(angle) * distance;
      const flowerY = 20 - size * 0.5 + Math.sin(angle) * distance * 0.6;
      const flowerSize = 0.8 + localRand() * 0.5;
      
      // Simplified flower - 4 petals instead of 6, no shadows
      for (let j = 0; j < 4; j++) {
        const petalAngle = (j / 4) * Math.PI * 2;
        const petalX = flowerX + Math.cos(petalAngle) * flowerSize * 0.45;
        const petalY = flowerY + Math.sin(petalAngle) * flowerSize * 0.45;
        
        elements.push(
          <ellipse
            key={`petal-${i}-${j}`}
            cx={petalX}
            cy={petalY}
            rx={flowerSize * 0.35}
            ry={flowerSize * 0.2}
            fill={flowerColor}
            opacity="0.9"
            transform={`rotate(${petalAngle * 180 / Math.PI} ${petalX} ${petalY})`}
          />
        );
      }
      
      // Single flower center - no detail layer
      elements.push(
        <circle
          key={`center-${i}`}
          cx={flowerX}
          cy={flowerY}
          r={flowerSize * 0.25}
          fill={flowerCenterColor}
          opacity="0.95"
        />
      );
    }
    
    return (
      <g>
        {/* Single ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size}
          ry={size * 0.25}
          fill="rgba(0,0,0,0.3)"
        />
        
        {elements}
      </g>
    );
  }
};

// Custom comparison to prevent re-renders
const arePropsEqual = (prevProps: BushSymbolProps, nextProps: BushSymbolProps): boolean => {
  return prevProps.seed === nextProps.seed;
};

export default React.memo(BushSymbol, arePropsEqual);