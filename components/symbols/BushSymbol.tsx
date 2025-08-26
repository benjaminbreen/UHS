/**
 * components/symbols/BushSymbol.tsx - Renders various types of bushes and shrubs with enhanced visuals
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface BushSymbolProps {
  seed: number;
}

const BushSymbol: React.FC<BushSymbolProps> = React.memo(({ seed }) => {
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
    // Rounded leafy bush - enhanced with better depth and shadows
    const numClusters = 5 + Math.floor(localRand() * 4); // More clusters
    const baseHue = 100 + localRand() * 35;
    const baseColor = `hsl(${baseHue}, ${45 + localRand() * 20}%, ${38 + localRand() * 12}%)`;
    const shadowColor = `hsl(${baseHue - 5}, ${50 + localRand() * 15}%, ${22 + localRand() * 8}%)`;
    const highlightColor = `hsl(${baseHue + 5}, ${35 + localRand() * 15}%, ${55 + localRand() * 10}%)`;
    const darkShadowColor = `hsl(${baseHue - 10}, ${55 + localRand() * 10}%, ${15 + localRand() * 5}%)`;
    
    const clusters = [];
    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2 + localRand() * 0.6;
      const distance = size * 0.45 * (0.6 + localRand() * 0.4);
      const clusterSize = size * 0.55 * (0.8 + localRand() * 0.4);
      const cx = 12 + Math.cos(angle) * distance;
      const cy = 20 - size * 0.3 + Math.sin(angle) * distance * 0.7;
      
      clusters.push(
        <g key={`cluster-${i}`}>
          {/* Base shadow for depth */}
          <circle
            cx={cx + 0.3}
            cy={cy + 0.4}
            r={clusterSize * 1.1}
            fill={darkShadowColor}
            opacity={density * 0.3}
          />
          {/* Main cluster */}
          <circle
            cx={cx}
            cy={cy}
            r={clusterSize}
            fill={i % 3 === 0 ? baseColor : (i % 3 === 1 ? shadowColor : baseColor)}
            opacity={density}
          />
          {/* Highlight */}
          <circle
            cx={cx - clusterSize * 0.35}
            cy={cy - clusterSize * 0.35}
            r={clusterSize * 0.45}
            fill={highlightColor}
            opacity={density * 0.6}
          />
          {/* Small detail highlights */}
          <circle
            cx={cx + clusterSize * 0.2}
            cy={cy - clusterSize * 0.15}
            r={clusterSize * 0.15}
            fill={highlightColor}
            opacity={density * 0.4}
          />
        </g>
      );
    }
    
    return (
      <g>
        {/* Enhanced ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size * 1.2}
          ry={size * 0.35}
          fill="rgba(0,0,0,0.35)"
        />
        
        {/* Secondary shadow for depth */}
        <ellipse
          cx="12"
          cy="22"
          rx={size * 0.9}
          ry={size * 0.25}
          fill="rgba(0,0,0,0.2)"
        />
        
        {/* Central mass with enhanced shadow */}
        <circle
          cx="12.2"
          cy={20.2 - size * 0.3}
          r={size * 0.7}
          fill={darkShadowColor}
          opacity={density * 0.5}
        />
        
        <circle
          cx="12"
          cy={20 - size * 0.3}
          r={size * 0.65}
          fill={shadowColor}
          opacity={density * 0.9}
        />
        
        {/* Clusters */}
        {clusters}
        
        {/* Enhanced branches with varying thickness */}
        {Array.from({ length: 4 }).map((_, i) => {
          const branchAngle = (i / 4) * Math.PI * 2 + Math.PI / 8 + localRand() * 0.3;
          const branchLength = size * 0.4;
          const branchThickness = 0.5 + localRand() * 0.3;
          return (
            <line
              key={`branch-${i}`}
              x1="12"
              y1={20}
              x2={12 + Math.cos(branchAngle) * branchLength}
              y2={20 + Math.sin(branchAngle) * branchLength * 0.6}
              stroke="hsl(25, 40%, 28%)"
              strokeWidth={branchThickness}
              strokeLinecap="round"
              opacity="0.8"
            />
          );
        })}
        
        {/* Texture details */}
        {Array.from({ length: 3 }).map((_, i) => {
          const detailX = 12 + (localRand() - 0.5) * size * 0.8;
          const detailY = 20 - size * 0.3 + (localRand() - 0.5) * size * 0.6;
          return (
            <circle
              key={`detail-${i}`}
              cx={detailX}
              cy={detailY}
              r={0.3 + localRand() * 0.2}
              fill={highlightColor}
              opacity={density * 0.3}
            />
          );
        })}
      </g>
    );
  } else if (bushType < 0.66) {
    // Spiky desert shrub - enhanced with more dramatic spikes
    const numSpikes = 10 + Math.floor(localRand() * 8); // More spikes
    const baseHue = 85 + localRand() * 30;
    const baseColor = `hsl(${baseHue}, ${35 + localRand() * 20}%, ${42 + localRand() * 15}%)`;
    const tipColor = `hsl(${baseHue + 10}, ${30 + localRand() * 15}%, ${60 + localRand() * 10}%)`;
    const shadowColor = `hsl(${baseHue - 15}, ${40 + localRand() * 15}%, ${25 + localRand() * 8}%)`;
    
    const spikes = [];
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i / numSpikes) * Math.PI * 2 + (localRand() - 0.5) * 0.4;
      const length = size * (0.7 + localRand() * 0.5); // Longer spikes
      const thickness = 1.2 - i * 0.06; // More varied thickness
      const baseX = 12 + Math.cos(angle) * 1.2;
      const baseY = 20.5 + Math.sin(angle) * 0.6;
      const tipX = 12 + Math.cos(angle) * length;
      const tipY = 20.5 - Math.abs(Math.sin(angle)) * length * 0.9;
      
      spikes.push(
        <g key={`spike-${i}`}>
          {/* Spike shadow */}
          <line
            x1={baseX + 0.2}
            y1={baseY + 0.3}
            x2={tipX + 0.2}
            y2={tipY + 0.3}
            stroke={shadowColor}
            strokeWidth={thickness * 1.1}
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Main spike */}
          <line
            x1={baseX}
            y1={baseY}
            x2={tipX}
            y2={tipY}
            stroke={baseColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {/* Spike tip highlight */}
          <circle
            cx={tipX}
            cy={tipY}
            r="0.4"
            fill={tipColor}
            opacity="0.8"
          />
          {/* Small thorns along spike */}
          {length > size * 0.8 && (
            <circle
              key={`thorn-${i}`}
              cx={baseX + Math.cos(angle) * length * 0.6}
              cy={baseY - Math.abs(Math.sin(angle)) * length * 0.5}
              r="0.2"
              fill={tipColor}
              opacity="0.6"
            />
          )}
        </g>
      );
    }
    
    return (
      <g>
        {/* Enhanced ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size * 1.1}
          ry={size * 0.3}
          fill="rgba(0,0,0,0.3)"
        />
        
        {/* Central base with more depth */}
        <ellipse
          cx="12.1"
          cy="20.6"
          rx="2"
          ry="1.2"
          fill={shadowColor}
          opacity="0.6"
        />
        
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
        
        {/* Base texture */}
        {Array.from({ length: 3 }).map((_, i) => {
          const textureX = 12 + (localRand() - 0.5) * 2.5;
          const textureY = 20.5 + (localRand() - 0.5) * 1.5;
          return (
            <circle
              key={`texture-${i}`}
              cx={textureX}
              cy={textureY}
              r={0.15 + localRand() * 0.1}
              fill={tipColor}
              opacity="0.4"
            />
          );
        })}
      </g>
    );
  } else {
    // Flowering bush - enhanced with more flowers and better depth
    const numFlowers = 7 + Math.floor(localRand() * 5); // More flowers
    const leafHue = 110 + localRand() * 25;
    const leafColor = `hsl(${leafHue}, ${40 + localRand() * 20}%, ${38 + localRand() * 10}%)`;
    const leafShadowColor = `hsl(${leafHue - 10}, ${45 + localRand() * 15}%, ${25 + localRand() * 8}%)`;
    const flowerHue = localRand() > 0.5 ? 300 + localRand() * 60 : localRand() * 60; // Purple/pink or yellow/orange
    const flowerColor = `hsl(${flowerHue}, ${65 + localRand() * 20}%, ${68 + localRand() * 10}%)`;
    const flowerCenterColor = `hsl(${50 + localRand() * 20}, 75%, 65%)`;
    
    const elements = [];
    
    // Enhanced leafy base with shadows
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const leafX = 12 + Math.cos(angle) * size * 0.5;
      const leafY = 20 - size * 0.2 + Math.sin(angle) * size * 0.25;
      const leafSize = size * 0.5 * (0.8 + localRand() * 0.4);
      
      // Leaf shadow
      elements.push(
        <ellipse
          key={`leaf-shadow-${i}`}
          cx={leafX + 0.2}
          cy={leafY + 0.3}
          rx={leafSize * 1.1}
          ry={leafSize * 0.7}
          fill={leafShadowColor}
          opacity="0.3"
          transform={`rotate(${angle * 180 / Math.PI} ${leafX + 0.2} ${leafY + 0.3})`}
        />
      );
      
      // Main leaf
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
    
    // Enhanced flowers with better detail
    for (let i = 0; i < numFlowers; i++) {
      const angle = (i / numFlowers) * Math.PI * 2 + localRand() * 0.6;
      const distance = size * 0.6 * (0.6 + localRand() * 0.4);
      const flowerX = 12 + Math.cos(angle) * distance;
      const flowerY = 20 - size * 0.5 + Math.sin(angle) * distance * 0.6;
      const flowerSize = 0.8 + localRand() * 0.5; // Larger flowers
      
      // Flower shadow
      elements.push(
        <circle
          key={`flower-shadow-${i}`}
          cx={flowerX + 0.1}
          cy={flowerY + 0.2}
          r={flowerSize * 0.6}
          fill="rgba(0,0,0,0.2)"
        />
      );
      
      // Flower petals with more detail
      for (let j = 0; j < 6; j++) { // More petals
        const petalAngle = (j / 6) * Math.PI * 2;
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
      
      // Flower center with more detail
      elements.push(
        <circle
          key={`center-${i}`}
          cx={flowerX}
          cy={flowerY}
          r={flowerSize * 0.3}
          fill={flowerCenterColor}
          opacity="0.95"
        />
      );
      
      // Tiny center detail
      elements.push(
        <circle
          key={`center-detail-${i}`}
          cx={flowerX}
          cy={flowerY}
          r={flowerSize * 0.15}
          fill="hsl(45, 80%, 80%)"
          opacity="0.8"
        />
      );
    }
    
    return (
      <g>
        {/* Enhanced ground shadow */}
        <ellipse
          cx="12"
          cy="22.5"
          rx={size * 1.1}
          ry={size * 0.3}
          fill="rgba(0,0,0,0.3)"
        />
        
        {/* Secondary shadow */}
        <ellipse
          cx="12"
          cy="22"
          rx={size * 0.8}
          ry={size * 0.2}
          fill="rgba(0,0,0,0.2)"
        />
        
        {elements}
        
        {/* Small stems and details */}
        {Array.from({ length: numFlowers }).map((_, i) => {
          const stemX = 12 + (localRand() - 0.5) * size * 0.8;
          const stemY = 20 + (localRand() - 0.5) * size * 0.3;
          const stemEndY = stemY - size * 0.4;
          return (
            <line
              key={`stem-${i}`}
              x1={stemX}
              y1={stemY}
              x2={stemX + (localRand() - 0.5) * 0.5}
              y2={stemEndY}
              stroke="hsl(90, 35%, 35%)"
              strokeWidth="0.3"
              opacity="0.6"
            />
          );
        })}
      </g>
    );
  }
});

export default BushSymbol;