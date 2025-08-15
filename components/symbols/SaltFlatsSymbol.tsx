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
        {/* Main gradient for salt flat - pure gradient without base */}
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" /> {/* Bright white center */}
          <stop offset="25%" stopColor="#fafafa" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#f5f5f5" stopOpacity="0.4" />
          <stop offset="75%" stopColor="#f0f0f0" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" /> {/* Fully transparent edges */}
        </radialGradient>
        
        {/* Mineral vein gradient if present */}
        {hasMinerals && (
          <linearGradient id={mineralGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selectedMineral.primary} stopOpacity="0.25" />
            <stop offset="50%" stopColor={selectedMineral.secondary} stopOpacity="0.35" />
            <stop offset="100%" stopColor={selectedMineral.primary} stopOpacity="0.15" />
          </linearGradient>
        )}
      </defs>
    );
    
    // Salt flat with pure radial gradient - no underlying base color
    elements.push(
      <circle
        key="salt-gradient"
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
    
    // Generate very subtle crack patterns - barely visible fissures
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    // Small irregular cracks scattered around
    const crackCount = 8 + Math.floor(noise.random() * 6);
    for (let i = 0; i < crackCount; i++) {
        // Random starting point within the salt flat
        const startX = centerX + (noise.random() - 0.5) * size * 0.6;
        const startY = centerY + (noise.random() - 0.5) * size * 0.6;
        
        // Short, subtle crack line
        const angle = noise.random() * Math.PI * 2;
        const length = size * (0.05 + noise.random() * 0.1); // Very short cracks
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        // Only draw if within visible area
        const distFromCenter = Math.sqrt(
            Math.pow(startX - centerX, 2) + Math.pow(startY - centerY, 2)
        );
        
        if (distFromCenter < size * 0.4) {
            elements.push(
              <line
                key={`crack-${i}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="rgba(200, 200, 205, 0.15)" // Very faint gray
                strokeWidth={0.3 + noise.random() * 0.2} // Very thin
                strokeLinecap="round"
              />
            );
            
            // Occasionally add a tiny branching crack
            if (noise.random() > 0.7) {
                const branchAngle = angle + (noise.random() - 0.5) * Math.PI * 0.5;
                const branchLength = length * 0.4;
                const branchX = startX + Math.cos(angle) * length * 0.6;
                const branchY = startY + Math.sin(angle) * length * 0.6;
                const branchEndX = branchX + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchY + Math.sin(branchAngle) * branchLength;
                
                elements.push(
                  <line
                    key={`crack-branch-${i}`}
                    x1={branchX}
                    y1={branchY}
                    x2={branchEndX}
                    y2={branchEndY}
                    stroke="rgba(195, 195, 200, 0.1)" // Even fainter
                    strokeWidth={0.2}
                    strokeLinecap="round"
                  />
                );
            }
        }
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