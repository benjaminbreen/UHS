/**
 * components/symbols/SaltFlatsSymbol.tsx - Renders realistic salt flats with gradient and mineral veins
 */
import React from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface SaltFlatsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tileX: number;
  tileY: number;
}

const SaltFlatsSymbol: React.FC<SaltFlatsSymbolProps> = React.memo(({ x, y, size, seed, tileX, tileY }) => {
    const noise = new ValueNoise(seed + tileX * 11 + tileY * 13);
    const elements = [];
    
    // Gradient definitions for edge transparency
    const gradientId = `saltGradient-${tileX}-${tileY}`;
    const mineralGradientId = `mineralGradient-${tileX}-${tileY}`;
    
    // Determine if this tile has mineral coloration (30% chance)
    const hasMinerals = noise.random() < 0.3;
    const mineralType = Math.floor(noise.random() * 4);
    
    // Mineral colors based on real salt flats
    const mineralColors = [
        { primary: '#00e5ff', secondary: '#0091ea' }, // Electric blue (lithium)
        { primary: '#ffea00', secondary: '#ffc400' }, // Acid yellow (sulfur)
        { primary: '#ff6090', secondary: '#ff4081' }, // Pink (algae/bacteria)
        { primary: '#64ffda', secondary: '#00e676' }, // Turquoise (copper minerals)
    ];
    
    const selectedMineral = hasMinerals ? mineralColors[mineralType] : null;
    
    elements.push(
      <defs key="defs">
        {/* Main gradient for edge transparency */}
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#f8f8f8" stopOpacity="0.95" /> {/* Off-white center */}
          <stop offset="40%" stopColor="#f0f0f0" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#e8e8e8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e0e0e0" stopOpacity="0.1" /> {/* Transparent edges */}
        </radialGradient>
        
        {/* Mineral vein gradient if present */}
        {hasMinerals && (
          <linearGradient id={mineralGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selectedMineral.primary} stopOpacity="0.3" />
            <stop offset="50%" stopColor={selectedMineral.secondary} stopOpacity="0.5" />
            <stop offset="100%" stopColor={selectedMineral.primary} stopOpacity="0.2" />
          </linearGradient>
        )}
      </defs>
    );
    
    // Base salt flat with gradient
    elements.push(
      <circle
        key="base"
        cx={x + size/2}
        cy={y + size/2}
        r={size * 0.48}
        fill={`url(#${gradientId})`}
      />
    );
    
    // Add mineral veins/patches if present
    if (hasMinerals) {
        const veinCount = 2 + Math.floor(noise.random() * 3);
        for (let i = 0; i < veinCount; i++) {
            const veinX = x + size * (0.2 + noise.random() * 0.6);
            const veinY = y + size * (0.2 + noise.random() * 0.6);
            const veinRadius = size * (0.15 + noise.random() * 0.2);
            
            elements.push(
              <ellipse
                key={`vein-${i}`}
                cx={veinX}
                cy={veinY}
                rx={veinRadius * (0.8 + noise.random() * 0.4)}
                ry={veinRadius * (0.6 + noise.random() * 0.4)}
                fill={`url(#${mineralGradientId})`}
                transform={`rotate(${noise.random() * 360} ${veinX} ${veinY})`}
                opacity={0.4 + noise.random() * 0.3}
              />
            );
        }
    }
    
    // Generate crystalline crack patterns (polygonal)
    const crackSegments = 5 + Math.floor(noise.random() * 4);
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    for (let i = 0; i < crackSegments; i++) {
        const angle1 = (i / crackSegments) * Math.PI * 2;
        const angle2 = ((i + 1) / crackSegments) * Math.PI * 2;
        
        // Vary the radius for organic feel
        const radius1 = size * (0.35 + noise.random() * 0.1);
        const radius2 = size * (0.35 + noise.random() * 0.1);
        
        const x1 = centerX + Math.cos(angle1) * radius1;
        const y1 = centerY + Math.sin(angle1) * radius1;
        const x2 = centerX + Math.cos(angle2) * radius2;
        const y2 = centerY + Math.sin(angle2) * radius2;
        
        // Main crack from center to edge
        elements.push(
          <line
            key={`crack-radial-${i}`}
            x1={centerX}
            y1={centerY}
            x2={x1}
            y2={y1}
            stroke="rgba(180, 180, 190, 0.3)"
            strokeWidth={0.5 + noise.random() * 0.5}
          />
        );
        
        // Polygon edge cracks
        elements.push(
          <line
            key={`crack-edge-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(170, 170, 180, 0.4)"
            strokeWidth={0.7 + noise.random() * 0.3}
          />
        );
    }
    
    // Add subtle surface texture dots (salt crystals)
    const crystalCount = 8 + Math.floor(noise.random() * 8);
    for (let i = 0; i < crystalCount; i++) {
        const crystalX = x + size * (0.15 + noise.random() * 0.7);
        const crystalY = y + size * (0.15 + noise.random() * 0.7);
        const distFromCenter = Math.sqrt(
            Math.pow(crystalX - centerX, 2) + Math.pow(crystalY - centerY, 2)
        );
        
        // Only place crystals within the visible area
        if (distFromCenter < size * 0.4) {
            elements.push(
              <circle
                key={`crystal-${i}`}
                cx={crystalX}
                cy={crystalY}
                r={0.3 + noise.random() * 0.4}
                fill="rgba(255, 255, 255, 0.6)"
              />
            );
        }
    }
    
    // Add glazed shine effect in center
    elements.push(
      <ellipse
        key="glaze"
        cx={centerX - size * 0.1}
        cy={centerY - size * 0.1}
        rx={size * 0.15}
        ry={size * 0.1}
        fill="rgba(255, 255, 255, 0.25)"
        transform={`rotate(-30 ${centerX} ${centerY})`}
      />
    );

    return <g>{elements}</g>;
});

export default SaltFlatsSymbol;