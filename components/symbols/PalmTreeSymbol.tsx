/**
 * components/symbols/PalmTreeSymbol.tsx - Renders a defined palm tree with highlighted fronds
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface PalmTreeSymbolProps {
  seed: number;
}

const PalmTreeSymbol: React.FC<PalmTreeSymbolProps> = React.memo(({ seed }) => {
  const localRand = React.useMemo(() => new ValueNoise(seed).random, [seed]);
  
  // Tree variations (rare alternatives)
  const variant = localRand();
  const isCoconutPalm = variant < 0.7; // 70% coconut palms
  const isDatePalm = variant >= 0.7 && variant < 0.9; // 20% date palms
  const isFanPalm = variant >= 0.9; // 10% fan palms
  
  const trunkSegments = 6 + Math.floor(localRand() * 2);
  const trunkBaseWidth = isDatePalm ? 2.2 : isFanPalm ? 1.4 : 1.6 + localRand() * 0.4;
  const trunkTopWidth = isDatePalm ? 1.8 : isFanPalm ? 1.2 : 1.0 + localRand() * 0.2;
  const trunkLean = (localRand() - 0.5) * (isDatePalm ? 10 : 15);
  
  const trunkColor = isDatePalm ? `hsl(20, 50%, 35%)` : `hsl(25, 45%, 38%)`;
  const trunkHighlight = isDatePalm ? `hsl(20, 40%, 55%)` : `hsl(25, 35%, 58%)`;
  
  // Enhanced trunk generation
  const trunkPath = [];
  for (let i = 0; i <= trunkSegments; i++) {
    const t = i / trunkSegments;
    const width = trunkBaseWidth * (1 - t * 0.4) + trunkTopWidth * (t * 0.4);
    const height = 22 - t * 16;
    const x = 12 + Math.sin(trunkLean * Math.PI / 180) * t * 4;
    
    if (i === 0) {
      trunkPath.push(`M ${x - width/2} ${height}`);
    } else {
      trunkPath.push(`L ${x - width/2} ${height}`);
    }
  }
  
  for (let i = trunkSegments; i >= 0; i--) {
    const t = i / trunkSegments;
    const width = trunkBaseWidth * (1 - t * 0.4) + trunkTopWidth * (t * 0.4);
    const height = 22 - t * 16;
    const x = 12 + Math.sin(trunkLean * Math.PI / 180) * t * 4;
    trunkPath.push(`L ${x + width/2} ${height}`);
  }
  trunkPath.push('Z');
  
  const trunkTopX = 12 + Math.sin(trunkLean * Math.PI / 180) * 4;
  const trunkTopY = 6;
  
  // Enhanced fronds with better definition
  const numFronds = isFanPalm ? 8 + Math.floor(localRand() * 4) : 
                   isDatePalm ? 10 + Math.floor(localRand() * 6) : 
                   6 + Math.floor(localRand() * 4);
  
  const fronds = [];
  
  for (let i = 0; i < numFronds; i++) {
    const baseAngle = (i / numFronds) * 360;
    const angle = (baseAngle + (localRand() - 0.5) * 30) * Math.PI / 180;
    
    let length, segments, frondColor, strokeWidth;
    
    if (isFanPalm) {
      length = 6 + localRand() * 2;
      segments = 3;
      frondColor = `hsl(${85 + localRand() * 15}, 65%, 40%)`;
      strokeWidth = 2.5;
    } else if (isDatePalm) {
      length = 8 + localRand() * 3;
      segments = 5;
      frondColor = `hsl(${95 + localRand() * 20}, 55%, 35%)`;
      strokeWidth = 1.8;
    } else {
      length = 7 + localRand() * 2;
      segments = 4;
      frondColor = `hsl(${90 + localRand() * 20}, 60%, 38%)`;
      strokeWidth = 2;
    }
    
    const endX = trunkTopX + Math.cos(angle) * length;
    const endY = trunkTopY + Math.sin(angle) * length * 0.5 + Math.abs(Math.sin(angle)) * 2;
    
    // Main frond path
    const frondPath = `M ${trunkTopX} ${trunkTopY} Q ${trunkTopX + Math.cos(angle) * length * 0.6} ${trunkTopY + Math.sin(angle) * length * 0.2} ${endX} ${endY}`;
    
    // Create highlight path (offset for visibility)
    const highlightOffset = 0.8;
    const highlightEndX = endX - Math.sin(angle) * highlightOffset;
    const highlightEndY = endY + Math.cos(angle) * highlightOffset;
    const highlightPath = `M ${trunkTopX} ${trunkTopY} Q ${trunkTopX + Math.cos(angle) * length * 0.6 - Math.sin(angle) * highlightOffset} ${trunkTopY + Math.sin(angle) * length * 0.2 + Math.cos(angle) * highlightOffset} ${highlightEndX} ${highlightEndY}`;
    
    fronds.push({
      zIndex: Math.sin(angle) > 0 ? 20 + i : 10 - i,
      elements: (
        <g key={`frond-${i}`}>
          {/* Shadow/depth */}
          <path
            d={frondPath}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={strokeWidth + 0.5}
            fill="none"
            strokeLinecap="round"
            transform={`translate(0.5, 0.5)`}
          />
          {/* Main frond */}
          <path
            d={frondPath}
            stroke={frondColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Highlight for definition */}
          <path
            d={highlightPath}
            stroke={`hsl(${90 + localRand() * 20}, 70%, 55%)`}
            strokeWidth={strokeWidth * 0.4}
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Frond segments for detail */}
          {Array.from({length: segments}).map((_, segIndex) => {
            const segT = (segIndex + 1) / (segments + 1);
            const segX = trunkTopX + Math.cos(angle) * length * segT;
            const segY = trunkTopY + Math.sin(angle) * length * segT * 0.5 + Math.abs(Math.sin(angle)) * 2 * segT;
            const leafAngle = angle + Math.PI/2;
            const leafLength = strokeWidth * 0.8;
            
            return (
              <path
                key={`segment-${segIndex}`}
                d={`M ${segX - Math.cos(leafAngle) * leafLength} ${segY - Math.sin(leafAngle) * leafLength} 
                    L ${segX + Math.cos(leafAngle) * leafLength} ${segY + Math.sin(leafAngle) * leafLength}`}
                stroke={frondColor}
                strokeWidth="0.3"
                opacity="0.6"
              />
            );
          })}
        </g>
      )
    });
  }

  return (
    <g filter="url(#symbolShadow)">
      {/* Enhanced trunk with segments */}
      <path d={trunkPath.join(' ')} fill={trunkColor} />
      
      {/* Trunk texture/segments */}
      {Array.from({length: trunkSegments}).map((_, i) => {
        const y = 22 - (i / trunkSegments) * 16;
        return (
          <ellipse
            key={`segment-${i}`}
            cx={12 + Math.sin(trunkLean * Math.PI / 180) * (i / trunkSegments) * 4}
            cy={y}
            rx={trunkBaseWidth * (1 - (i / trunkSegments) * 0.3) / 2}
            ry="0.8"
            fill="none"
            stroke={trunkHighlight}
            strokeWidth="0.3"
            opacity="0.6"
          />
        );
      })}
      
      {/* Trunk highlight */}
      <path
        d={`M ${12 - trunkBaseWidth/4} 21 Q ${12 + Math.sin(trunkLean * Math.PI / 180) * 2 - trunkTopWidth/4} 14 ${trunkTopX - trunkTopWidth/4} ${trunkTopY + 1}`}
        stroke={trunkHighlight}
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      />
      
      {/* Fronds with proper layering */}
      {fronds.sort((a,b) => a.zIndex - b.zIndex).map(f => f.elements)}
      
      {/* Optional coconuts for coconut palms */}
      {isCoconutPalm && localRand() > 0.3 && (
        <g>
          <circle cx={trunkTopX - 1.5} cy={trunkTopY + 1} r="1" fill="#8B4513" opacity="0.8" />
          <circle cx={trunkTopX + 1} cy={trunkTopY + 0.5} r="0.8" fill="#A0522D" opacity="0.8" />
        </g>
      )}
    </g>
  );
});

export default PalmTreeSymbol;
