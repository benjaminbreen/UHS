/**
 * Improved Fortress symbols with consistent 2.5D perspective, shadows, and animations
 */
import React from 'react';

interface FortressSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  fortressType?: string;
}

// Shared shadow component for consistency
const FortressShadow: React.FC<{cx: number, cy: number, size: number}> = ({cx, cy, size}) => (
  <ellipse 
    cx={cx} 
    cy={cy} 
    rx={size * 0.45} 
    ry={size * 0.18} 
    fill="rgba(0,0,0,0.25)"
    filter="blur(2px)"
  />
);

// Shared grass patches for environmental context
const GrassPatches: React.FC<{size: number, seed: number}> = ({size, seed}) => {
  const grassPositions = [
    {x: 0.15, y: 0.85}, {x: 0.8, y: 0.88}, {x: 0.3, y: 0.9}, 
    {x: 0.65, y: 0.87}, {x: 0.1, y: 0.8}
  ];
  
  return (
    <g opacity="0.7">
      {grassPositions.map((pos, i) => (
        <ellipse 
          key={i}
          cx={size * pos.x} 
          cy={size * pos.y}
          rx={2 + (seed + i) % 2} 
          ry={1}
          fill={`hsl(${100 + (seed + i * 7) % 20}, 50%, ${35 + (seed + i * 3) % 10}%)`}
        />
      ))}
    </g>
  );
};

// Prehistoric hillfort with earthworks and palisades
export const HillfortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `hillfort-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`earthGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9b8976" />
          <stop offset="50%" stopColor="#8b7355" />
          <stop offset="100%" stopColor="#6d5940" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Environmental grass */}
      <GrassPatches size={size} seed={seed} />
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Earthwork mound - isometric view */}
      <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.42} ry={size * 0.28} 
               fill={`url(#earthGrad-${uniqueId})`} 
               filter={`url(#shadow-${uniqueId})`} />
      
      {/* Inner plateau */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.32} ry={size * 0.2} 
               fill="#a89888" opacity="0.9" />
      
      {/* Wooden palisade posts in isometric circle */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const postX = size * 0.5 + Math.cos(angle) * size * 0.28;
        const postY = size * 0.5 + Math.sin(angle) * size * 0.16;
        return (
          <g key={i}>
            <rect x={postX - 1.5} y={postY - size * 0.12} 
                  width={3} height={size * 0.12} 
                  fill="#5a4a3a" />
            <rect x={postX - 1.5} y={postY - size * 0.12} 
                  width={3} height={2} 
                  fill="#4a3a2a" />
          </g>
        );
      })}
      
      {/* Central structure with proper perspective */}
      <g transform={`translate(${size * 0.5}, ${size * 0.45})`}>
        <rect x={-size * 0.06} y={-size * 0.05} 
              width={size * 0.12} height={size * 0.1} 
              fill="#7a6a5a" />
        <polygon points={`${-size * 0.06},${-size * 0.05} 0,${-size * 0.1} ${size * 0.06},${-size * 0.05}`}
                 fill="#6a5a4a" />
      </g>
    </g>
  );
};

// Roman castrum with masonry texture
export const CastrumSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `castrum-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8c8b8" />
          <stop offset="50%" stopColor="#c8b8a8" />
          <stop offset="100%" stopColor="#a89888" />
        </linearGradient>
        <pattern id={`masonry-${uniqueId}`} x="0" y="0" width={size * 0.08} height={size * 0.04} patternUnits="userSpaceOnUse">
          <rect width={size * 0.08} height={size * 0.04} fill="#c8b8a8" />
          <rect x="0" y="0" width={size * 0.075} height={size * 0.035} fill="#d0c0b0" />
          <line x1="0" y1={size * 0.02} x2={size * 0.08} y2={size * 0.02} stroke="#a89888" strokeWidth="0.5" />
          <line x1={size * 0.04} y1="0" x2={size * 0.04} y2={size * 0.02} stroke="#a89888" strokeWidth="0.5" />
          <line x1={size * 0.02} y1={size * 0.02} x2={size * 0.02} y2={size * 0.04} stroke="#a89888" strokeWidth="0.5" />
          <line x1={size * 0.06} y1={size * 0.02} x2={size * 0.06} y2={size * 0.04} stroke="#a89888" strokeWidth="0.5" />
        </pattern>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.52} cy={size * 0.68} size={size * 1.2} />
      
      {/* Main fort body - isometric rectangle - BIGGER */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front face with masonry pattern */}
        <rect x={size * 0.15} y={size * 0.3} 
              width={size * 0.7} height={size * 0.4} 
              fill={`url(#masonry-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.15},${size * 0.3} ${size * 0.3},${size * 0.2} ${size * 1.0},${size * 0.2} ${size * 0.85},${size * 0.3}`}
                 fill="#e0d0c0" />
        
        {/* Right face */}
        <polygon points={`${size * 0.85},${size * 0.3} ${size * 1.0},${size * 0.2} ${size * 1.0},${size * 0.6} ${size * 0.85},${size * 0.7}`}
                 fill="#b8a898" />
        
        {/* Stone texture lines on front */}
        {[0.35, 0.45, 0.55, 0.65].map((yPos, i) => (
          <line key={i} x1={size * 0.15} y1={size * yPos} x2={size * 0.85} y2={size * yPos}
                stroke="#a09080" strokeWidth="0.3" opacity="0.5" />
        ))}
      </g>
      
      {/* Corner towers - bigger */}
      {[
        {x: 0.15, y: 0.3}, {x: 0.85, y: 0.3},
        {x: 0.15, y: 0.7}, {x: 0.85, y: 0.7}
      ].map((pos, i) => (
        <g key={i}>
          <ellipse cx={size * pos.x} cy={size * pos.y} 
                   rx={size * 0.08} ry={size * 0.05} 
                   fill="#d8c8b8" />
          <rect x={size * pos.x - size * 0.08} y={size * pos.y - size * 0.12} 
                width={size * 0.16} height={size * 0.12} 
                fill={`url(#masonry-${uniqueId})`} />
        </g>
      ))}
      
      {/* Simple Roman eagle standard */}
      <g transform={`translate(${size * 0.5}, ${size * 0.2})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.12} 
              stroke="#8a6a4a" strokeWidth="1.5" />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 0 -10;3 0 -10;0 0 -10"
            dur="3s"
            repeatCount="indefinite"
          />
          <rect x={-size * 0.06} y={-size * 0.12} width={size * 0.12} height={size * 0.08}
                fill="#cc3333" opacity="0.9" />
          {/* Eagle symbol */}
          <path d={`M 0,${-size * 0.08} 
                    m ${-size * 0.03},0 
                    l ${size * 0.015},${-size * 0.015} 
                    l ${size * 0.015},0 
                    l ${size * 0.015},${size * 0.015} 
                    l ${size * 0.015},0 
                    l ${-size * 0.015},${-size * 0.015} 
                    l ${-size * 0.015},0 
                    l ${-size * 0.015},${size * 0.015}`}
                fill="#ffcc00" />
        </g>
      </g>
      
      {/* Gate */}
      <rect x={size * 0.47} y={size * 0.58} 
            width={size * 0.06} height={size * 0.12} 
            fill="#3a2a1a" />
    </g>
  );
};

// Medieval castle with slit windows and randomization
export const MedievalCastleSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `castle-${x}-${y}-${seed}`;
  const hasTwoTowers = seed % 3 !== 0; // 2/3 chance of two towers
  const hasExtraKeep = seed % 4 === 0; // 1/4 chance of extra keep
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`castleStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0b0a0" />
          <stop offset="50%" stopColor="#a89888" />
          <stop offset="100%" stopColor="#908070" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="3" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.52} cy={size * 0.72} size={size * 1.3} />
      
      {/* Main castle structure - BIGGER */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Outer walls - isometric view */}
        <rect x={size * 0.15} y={size * 0.4} 
              width={size * 0.7} height={size * 0.32} 
              fill={`url(#castleStone-${uniqueId})`} />
        
        {/* Wall top */}
        <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.28},${size * 0.32} ${size * 0.98},${size * 0.32} ${size * 0.85},${size * 0.4}`}
                 fill="#b8a898" />
        
        {/* Wall right */}
        <polygon points={`${size * 0.85},${size * 0.4} ${size * 0.98},${size * 0.32} ${size * 0.98},${size * 0.64} ${size * 0.85},${size * 0.72}`}
                 fill="#a09080" />
        
        {/* Crenellations */}
        {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.02} 
                y={size * 0.38} 
                width={size * 0.04} 
                height={size * 0.03} 
                fill="#b0a090" />
        ))}
        
        {/* Arrow slit windows in wall */}
        {[0.25, 0.35, 0.5, 0.65, 0.75].map((xPos, i) => (
          <g key={i}>
            <rect x={size * xPos - size * 0.003} 
                  y={size * 0.48} 
                  width={size * 0.006} 
                  height={size * 0.08} 
                  fill="#1a1a1a" />
            <rect x={size * xPos - size * 0.015} 
                  y={size * 0.52} 
                  width={size * 0.03} 
                  height={size * 0.006} 
                  fill="#1a1a1a" />
          </g>
        ))}
        
        {/* Central keep tower */}
        <rect x={size * 0.42} y={size * 0.18} 
              width={size * 0.16} height={size * 0.4} 
              fill="#a89888" />
        
        {/* Keep top */}
        <polygon points={`${size * 0.42},${size * 0.18} ${size * 0.5},${size * 0.1} ${size * 0.66},${size * 0.1} ${size * 0.58},${size * 0.18}`}
                 fill="#b8a898" />
        
        {/* Keep right */}
        <polygon points={`${size * 0.58},${size * 0.18} ${size * 0.66},${size * 0.1} ${size * 0.66},${size * 0.5} ${size * 0.58},${size * 0.58}`}
                 fill="#988878" />
        
        {/* Keep roof */}
        <polygon points={`${size * 0.42},${size * 0.18} ${size * 0.5},${size * 0.08} ${size * 0.66},${size * 0.08} ${size * 0.58},${size * 0.18}`}
                 fill="#7a5a3a" />
        
        {/* Arrow slits in keep */}
        {[0.46, 0.5, 0.54].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.003} 
                y={size * 0.3 + i * size * 0.08} 
                width={size * 0.006} 
                height={size * 0.05} 
                fill="#1a1a1a" />
        ))}
        
        {/* Second tower if random seed allows */}
        {hasTwoTowers && (
          <g>
            <rect x={size * 0.22} y={size * 0.22} 
                  width={size * 0.12} height={size * 0.3} 
                  fill="#a89888" />
            <polygon points={`${size * 0.22},${size * 0.22} ${size * 0.28},${size * 0.16} ${size * 0.4},${size * 0.16} ${size * 0.34},${size * 0.22}`}
                     fill="#b8a898" />
            <polygon points={`${size * 0.22},${size * 0.22} ${size * 0.28},${size * 0.12} ${size * 0.4},${size * 0.12} ${size * 0.34},${size * 0.22}`}
                     fill="#8a6a4a" />
          </g>
        )}
        
        {/* Extra keep structure if random allows */}
        {hasExtraKeep && (
          <rect x={size * 0.68} y={size * 0.35} 
                width={size * 0.1} height={size * 0.15} 
                fill="#b0a090" />
        )}
      </g>
      
      {/* Animated banner */}
      <g transform={`translate(${size * 0.5}, ${size * 0.15})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.08} 
              stroke="#5a4a3a" strokeWidth="1" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-3;0;3;0"
            dur="4s"
            repeatCount="indefinite"
          />
          <polygon points={`0,${-size * 0.08} ${size * 0.08},${-size * 0.06} ${size * 0.08},${-size * 0.02} 0,${-size * 0.04}`}
                   fill="#4444cc" opacity="0.9" />
        </g>
      </g>
      
      {/* Gate with portcullis */}
      <rect x={size * 0.47} y={size * 0.58} 
            width={size * 0.06} height={size * 0.12} 
            fill="#2a1a0a" />
      <g opacity="0.7">
        {[0, 1, 2, 3].map(i => (
          <line key={i} 
                x1={size * (0.475 + i * 0.015)} y1={size * 0.58} 
                x2={size * (0.475 + i * 0.015)} y2={size * 0.7} 
                stroke="#4a3a2a" strokeWidth="0.5" />
        ))}
      </g>
    </g>
  );
};

// Renaissance star fort - properly flat perspective
export const StarFortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `starfort-${x}-${y}-${seed}`;
  const centerX = size * 0.5;
  const centerY = size * 0.6;
  
  // Generate star points for a flat, top-down view with slight isometric tilt
  const starPoints = [];
  const numPoints = 5;
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? size * 0.45 : size * 0.3;
    // Very subtle isometric squash - almost flat
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY + Math.sin(angle) * radius * 0.85; // Just slightly compressed
    starPoints.push(`${px},${py}`);
  }
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`fortStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8c8b8" />
          <stop offset="50%" stopColor="#c8b8a8" />
          <stop offset="100%" stopColor="#b0a090" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={centerX} cy={centerY + size * 0.15} size={size * 1.3} />
      
      {/* Water moat around the fort */}
      <polygon points={starPoints.map((p) => {
                const [px, py] = p.split(',').map(Number);
                const scale = 1.15;
                return `${centerX + (px - centerX) * scale},${centerY + (py - centerY) * scale}`;
               }).join(' ')}
               fill="none" 
               stroke="rgba(100,150,200,0.4)" 
               strokeWidth="4" 
               strokeDasharray="3,2" />
      
      {/* Main star fort - flat with subtle depth */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Ramparts - just a subtle raised edge */}
        <polygon points={starPoints.join(' ')} 
                 fill="#b8a898" 
                 stroke="#908070" strokeWidth="1" />
        
        {/* Inner wall face - slightly inset */}
        <polygon points={starPoints.map((p) => {
                  const [px, py] = p.split(',').map(Number);
                  const scale = 0.92;
                  return `${centerX + (px - centerX) * scale},${centerY + (py - centerY) * scale}`;
                 }).join(' ')} 
                 fill={`url(#fortStone-${uniqueId})`} 
                 stroke="#a09080" strokeWidth="0.8" />
        
        {/* Bastion platforms at each point */}
        {Array.from({ length: numPoints }).map((_, i) => {
          const angle = (i * 2 / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
          const px = centerX + Math.cos(angle) * size * 0.4;
          const py = centerY + Math.sin(angle) * size * 0.4 * 0.85;
          return (
            <polygon key={i}
                     points={`${px - size * 0.06},${py - size * 0.04} 
                              ${px + size * 0.06},${py - size * 0.04}
                              ${px + size * 0.06},${py + size * 0.04}
                              ${px - size * 0.06},${py + size * 0.04}`}
                     fill="#c8b8a8" stroke="#908070" strokeWidth="0.5" />
          );
        })}
        
        {/* Inner courtyard */}
        <polygon points={starPoints.map((p) => {
                  const [px, py] = p.split(',').map(Number);
                  const scale = 0.6;
                  return `${centerX + (px - centerX) * scale},${centerY + (py - centerY) * scale}`;
                 }).join(' ')} 
                 fill="#d0c0b0" 
                 stroke="#a09080" strokeWidth="0.5" />
        
        {/* Central keep - smaller and flatter */}
        <rect x={centerX - size * 0.06} y={centerY - size * 0.05} 
              width={size * 0.12} height={size * 0.1} 
              fill="#b8a898" stroke="#908070" strokeWidth="0.8" />
        
        {/* Small tower on keep */}
        <rect x={centerX - size * 0.02} y={centerY - size * 0.02} 
              width={size * 0.04} height={size * 0.04} 
              fill="#a89888" />
      </g>
      
      {/* Cannon positions at star points */}
      {Array.from({ length: numPoints }).map((_, i) => {
        const angle = (i * 2 / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
        const px = centerX + Math.cos(angle) * size * 0.32;
        const py = centerY + Math.sin(angle) * size * 0.32 * 0.6;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={size * 0.02} 
                    fill="#2a1a0a" stroke="#1a0a0a" strokeWidth="0.5" />
            {/* Cannon barrel pointing outward */}
            <line x1={px} y1={py} 
                  x2={px + Math.cos(angle) * size * 0.04} 
                  y2={py + Math.sin(angle) * size * 0.04 * 0.6}
                  stroke="#1a0a0a" strokeWidth="1.5" />
          </g>
        );
      })}
    </g>
  );
};

// Colonial presidio with improved features
export const PresidioSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `presidio-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`adobeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0dcc8" />
          <stop offset="50%" stopColor="#e8d4b0" />
          <stop offset="100%" stopColor="#d4b896" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Dusty ground context */}
      <ellipse cx={size * 0.5} cy={size * 0.75} 
               rx={size * 0.5} ry={size * 0.15} 
               fill="rgba(200,180,140,0.3)" />
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.51} cy={size * 0.72} size={size} />
      
      {/* Main presidio structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front wall */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.6} height={size * 0.3} 
              fill={`url(#adobeGrad-${uniqueId})`} />
        
        {/* Top */}
        <polygon points={`${size * 0.2},${size * 0.4} ${size * 0.32},${size * 0.32} ${size * 0.92},${size * 0.32} ${size * 0.8},${size * 0.4}`}
                 fill="#f4e0cc" />
        
        {/* Right side */}
        <polygon points={`${size * 0.8},${size * 0.4} ${size * 0.92},${size * 0.32} ${size * 0.92},${size * 0.62} ${size * 0.8},${size * 0.7}`}
                 fill="#e0ccb0" />
        
        {/* Corner bastions with arrow slits */}
        {[
          {x: 0.2, y: 0.4}, {x: 0.8, y: 0.4},
          {x: 0.2, y: 0.7}, {x: 0.8, y: 0.7}
        ].map((pos, i) => (
          <g key={i}>
            <rect x={size * pos.x - size * 0.04} 
                  y={size * pos.y - size * 0.04} 
                  width={size * 0.08} height={size * 0.08} 
                  fill="#e8d4b0" />
            {/* Arrow slit */}
            <rect x={size * pos.x - size * 0.003} 
                  y={size * pos.y - size * 0.02} 
                  width={size * 0.006} height={size * 0.04} 
                  fill="#1a1a1a" />
          </g>
        ))}
        
        {/* Chapel with bell tower */}
        <g transform={`translate(${size * 0.35}, ${size * 0.35})`}>
          <rect x={0} y={size * 0.05} 
                width={size * 0.15} height={size * 0.2} 
                fill="#f8e8d8" />
          <rect x={size * 0.025} y={-size * 0.05} 
                width={size * 0.04} height={size * 0.15} 
                fill="#f0dcc8" />
          <polygon points={`${size * 0.025},${-size * 0.05} ${size * 0.045},${-size * 0.08} ${size * 0.065},${-size * 0.05}`}
                   fill="#d8c4b0" />
          
          {/* Cross */}
          <line x1={size * 0.045} y1={-size * 0.1} x2={size * 0.045} y2={-size * 0.06} 
                stroke="#8a6a4a" strokeWidth="0.8" />
          <line x1={size * 0.035} y1={-size * 0.08} x2={size * 0.055} y2={-size * 0.08} 
                stroke="#8a6a4a" strokeWidth="0.8" />
        </g>
      </g>
      
      {/* Main gate */}
      <rect x={size * 0.47} y={size * 0.6} 
            width={size * 0.06} height={size * 0.1} 
            fill="#5a3a1a" />
      
      {/* Spanish/Portuguese flag */}
      <g transform={`translate(${size * 0.7}, ${size * 0.32})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.12} 
              stroke="#6a5a4a" strokeWidth="0.8" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-2.5;0;2.5;0"
            dur="3.8s"
            repeatCount="indefinite"
          />
          <rect x={0} y={-size * 0.12} 
                width={size * 0.08} height={size * 0.05} 
                fill="#cc0000" />
          <rect x={0} y={-size * 0.105} 
                width={size * 0.08} height={size * 0.02} 
                fill="#ffcc00" />
        </g>
      </g>
      
      {/* Smoke from chimney */}
      <g opacity="0.5">
        <circle cx={size * 0.38} cy={-size * 0.08} r={size * 0.02} fill="#666666">
          <animate attributeName="cy" 
                   values={`${-size * 0.08};${-size * 0.15};${-size * 0.22}`}
                   dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" 
                   values="0.5;0.3;0"
                   dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
};

// Modern military base with realistic features
export const ModernFortSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `modernfort-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`concreteGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8c8c8" />
          <stop offset="50%" stopColor="#b0b0b0" />
          <stop offset="100%" stopColor="#989898" />
        </linearGradient>
        <radialGradient id={`searchlight-${uniqueId}`}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="30%" stopColor="#ffffcc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffff99" stopOpacity="0" />
        </radialGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.51} cy={size * 0.72} size={size} />
      
      {/* Main bunker structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Main body */}
        <rect x={size * 0.15} y={size * 0.4} 
              width={size * 0.7} height={size * 0.3} 
              fill={`url(#concreteGrad-${uniqueId})`} />
        
        {/* Top surface */}
        <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.25},${size * 0.33} ${size * 0.95},${size * 0.33} ${size * 0.85},${size * 0.4}`}
                 fill="#d0d0d0" />
        
        {/* Right side */}
        <polygon points={`${size * 0.85},${size * 0.4} ${size * 0.95},${size * 0.33} ${size * 0.95},${size * 0.63} ${size * 0.85},${size * 0.7}`}
                 fill="#a8a8a8" />
        
        {/* Reinforced sections */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.12} height={size * 0.2} 
              fill="#a0a0a0" />
        <rect x={size * 0.63} y={size * 0.45} 
              width={size * 0.12} height={size * 0.2} 
              fill="#a0a0a0" />
        
        {/* Observation slits */}
        {[0.3, 0.45, 0.55, 0.7].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos} y={size * 0.52} 
                width={size * 0.06} height={size * 0.015} 
                fill="#1a1a1a" />
        ))}
      </g>
      
      {/* Animated radar antenna */}
      <g transform={`translate(${size * 0.5}, ${size * 0.33})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.12} 
              stroke="#606060" strokeWidth="1.5" />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 -6"
            to="360 0 -6"
            dur="8s"
            repeatCount="indefinite"
          />
          <ellipse cx={0} cy={-size * 0.12} 
                   rx={size * 0.05} ry={size * 0.02} 
                   fill="none" stroke="#606060" strokeWidth="1" />
          <line x1={-size * 0.05} y1={-size * 0.12} 
                x2={size * 0.05} y2={-size * 0.12} 
                stroke="#606060" strokeWidth="0.8" />
        </g>
      </g>
      
      {/* Chain-link fence perimeter with better rendering */}
      <g opacity="0.8">
        {/* Fence posts */}
        {[0.05, 0.25, 0.45, 0.65, 0.85, 0.95].map((xPos, i) => (
          <rect key={i} x={size * xPos} y={size * 0.15} 
                width={size * 0.015} height={size * 0.65} 
                fill="#606060" />
        ))}
        
        {/* Chain-link pattern */}
        <path d={`M ${size * 0.05} ${size * 0.2} 
                  L ${size * 0.95} ${size * 0.2} 
                  L ${size * 0.95} ${size * 0.75} 
                  L ${size * 0.05} ${size * 0.75} Z`}
              fill="none" stroke="#808080" strokeWidth="0.5" />
        
        {/* Diamond pattern */}
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
              <path key={col}
                    d={`M ${size * (0.1 + col * 0.1)} ${size * (0.25 + row * 0.1)}
                        l ${size * 0.05} ${-size * 0.05}
                        l ${size * 0.05} ${size * 0.05}
                        l ${-size * 0.05} ${size * 0.05}
                        l ${-size * 0.05} ${-size * 0.05}`}
                    fill="none" stroke="#909090" strokeWidth="0.3" opacity="0.6" />
            ))}
          </g>
        ))}
        
        {/* Barbed wire on top */}
        <line x1={size * 0.05} y1={size * 0.18} 
              x2={size * 0.95} y2={size * 0.18} 
              stroke="#505050" strokeWidth="0.8" strokeDasharray="2,1" />
      </g>
      
      {/* Guard towers */}
      <g>
        <rect x={size * 0.08} y={size * 0.12} 
              width={size * 0.08} height={size * 0.1} 
              fill="#a0a0a0" stroke="#606060" strokeWidth="0.5" />
        <rect x={size * 0.84} y={size * 0.12} 
              width={size * 0.08} height={size * 0.1} 
              fill="#a0a0a0" stroke="#606060" strokeWidth="0.5" />
      </g>
      
      {/* Searchlight effect */}
      <g opacity="0.6">
        <ellipse cx={size * 0.12} cy={size * 0.15} 
                 rx={size * 0.25} ry={size * 0.15} 
                 fill={`url(#searchlight-${uniqueId})`}
                 transform={`rotate(30 ${size * 0.12} ${size * 0.15})`}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="30 ${size * 0.12} ${size * 0.15}"
            to="-30 ${size * 0.12} ${size * 0.15}"
            dur="8s"
            repeatCount="indefinite"
            keyTimes="0;0.5;1"
            values="30;-30;30"
          />
        </ellipse>
      </g>
      
      {/* Blinking red warning light */}
      <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.015} fill="#ff0000">
        <animate attributeName="opacity" 
                 values="1;0.2;1" 
                 dur="2s" 
                 repeatCount="indefinite" />
      </circle>
    </g>
  );
};

// East Asian fortress with improved architecture (FIXED)
export const JapaneseFortressSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `eastfort-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`japStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.51} cy={size * 0.75} size={size} />
      
      {/* Stone base with proper perspective */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Sloped stone foundation walls */}
        <polygon points={`${size * 0.2},${size * 0.7} ${size * 0.8},${size * 0.7} ${size * 0.75},${size * 0.55} ${size * 0.25},${size * 0.55}`}
                 fill={`url(#japStone-${uniqueId})`} />
        
        {/* Top of foundation */}
        <polygon points={`${size * 0.25},${size * 0.55} ${size * 0.75},${size * 0.55} ${size * 0.72},${size * 0.52} ${size * 0.28},${size * 0.52}`}
                 fill="#f5f5f5" />
        
        {/* Multi-tiered tenshu (keep) */}
        {[0, 1, 2].map((tier) => {
          const tierSize = 1 - tier * 0.2;
          const tierY = 0.48 - tier * 0.08;
          const tierWidth = 0.22 * tierSize;
          const tierHeight = 0.07;
          
          return (
            <g key={tier}>
              {/* White walls with dark trim */}
              <rect x={size * (0.5 - tierWidth/2)} 
                    y={size * tierY} 
                    width={size * tierWidth} 
                    height={size * tierHeight} 
                    fill="#fafafa" 
                    stroke="#3a3a3a" 
                    strokeWidth="0.5" />
              
              {/* Traditional curved roof with upturned edges */}
              <path d={`M ${size * (0.5 - tierWidth * 0.6)} ${size * tierY}
                        Q ${size * (0.5 - tierWidth * 0.55)} ${size * (tierY - 0.03)}
                          ${size * (0.5 - tierWidth * 0.5)} ${size * (tierY - 0.02)}
                        L ${size * (0.5 + tierWidth * 0.5)} ${size * (tierY - 0.02)}
                        Q ${size * (0.5 + tierWidth * 0.55)} ${size * (tierY - 0.03)}
                          ${size * (0.5 + tierWidth * 0.6)} ${size * tierY}
                        Z`}
                    fill="#2a2a2a" />
              
              {/* Roof ridge decoration */}
              <line x1={size * (0.5 - tierWidth * 0.5)} 
                    y1={size * (tierY - 0.02)} 
                    x2={size * (0.5 + tierWidth * 0.5)} 
                    y2={size * (tierY - 0.02)}
                    stroke="#4a4a4a" 
                    strokeWidth="0.8" />
              
              {/* Windows on each floor */}
              {tier === 0 && [
                -0.06, -0.02, 0.02, 0.06
              ].map((offset, i) => (
                <rect key={i} 
                      x={size * (0.5 + offset)} 
                      y={size * (tierY + tierHeight * 0.3)} 
                      width={size * 0.012} 
                      height={size * 0.025} 
                      fill="#1a1a1a" />
              ))}
            </g>
          );
        })}
        
        {/* Stone wall with crenellations */}
        <rect x={size * 0.15} y={size * 0.65} 
              width={size * 0.7} height={size * 0.05} 
              fill="#d8d8d8" />
        
        {/* Wall crenellations */}
        {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.02} 
                y={size * 0.64} 
                width={size * 0.03} 
                height={size * 0.02} 
                fill="#d8d8d8" />
        ))}
        
        {/* Main gate with traditional design */}
        <rect x={size * 0.46} y={size * 0.65} 
              width={size * 0.08} height={size * 0.05} 
              fill="#4a3a2a" />
        <rect x={size * 0.47} y={size * 0.66} 
              width={size * 0.06} height={size * 0.04} 
              fill="#2a1a0a" />
      </g>
      
      {/* Golden shachihoko (roof ornament) on top */}
      <circle cx={size * 0.5} cy={size * 0.24} r={size * 0.015} fill="#d4af37" />
    </g>
  );
};

// Arabic/Islamic fortress with distinctive architecture
export const IslamicFortressSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `islamicfort-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`sandstone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e4c1" />
          <stop offset="50%" stopColor="#e8d4a0" />
          <stop offset="100%" stopColor="#d4b896" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.5} cy={size * 0.72} size={size * 1.1} />
      
      {/* Main fortress structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Outer walls with battered base */}
        <polygon points={`${size * 0.15},${size * 0.7} ${size * 0.85},${size * 0.7} ${size * 0.8},${size * 0.4} ${size * 0.2},${size * 0.4}`}
                 fill={`url(#sandstone-${uniqueId})`} />
        
        {/* Wall top */}
        <polygon points={`${size * 0.2},${size * 0.4} ${size * 0.8},${size * 0.4} ${size * 0.75},${size * 0.35} ${size * 0.25},${size * 0.35}`}
                 fill="#f8e8c8" />
        
        {/* Crenellated battlements with pointed merlons */}
        {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
          <polygon key={i}
                   points={`${size * xPos - size * 0.02},${size * 0.4} 
                            ${size * xPos},${size * 0.36} 
                            ${size * xPos + size * 0.02},${size * 0.4}`}
                   fill="#e8d4a0" />
        ))}
        
        {/* Central tower with dome */}
        <rect x={size * 0.42} y={size * 0.25} 
              width={size * 0.16} height={size * 0.25} 
              fill="#f0dcc8" />
        
        {/* Dome */}
        <ellipse cx={size * 0.5} cy={size * 0.25} 
                 rx={size * 0.1} ry={size * 0.08} 
                 fill="#6aa84f" />
        
        {/* Horseshoe arch gate */}
        <path d={`M ${size * 0.45} ${size * 0.7}
                  L ${size * 0.45} ${size * 0.55}
                  Q ${size * 0.45} ${size * 0.5} ${size * 0.5} ${size * 0.5}
                  Q ${size * 0.55} ${size * 0.5} ${size * 0.55} ${size * 0.55}
                  L ${size * 0.55} ${size * 0.7}
                  Z`}
              fill="#2a1a0a" />
        
        {/* Decorative geometric patterns */}
        {[0.3, 0.5, 0.7].map((xPos, i) => (
          <g key={i}>
            <rect x={size * xPos - size * 0.015} 
                  y={size * 0.45} 
                  width={size * 0.03} 
                  height={size * 0.03} 
                  fill="none" 
                  stroke="#c8b490" 
                  strokeWidth="0.5" />
            <circle cx={size * xPos} 
                    cy={size * 0.465} 
                    r={size * 0.01} 
                    fill="none" 
                    stroke="#c8b490" 
                    strokeWidth="0.3" />
          </g>
        ))}
        
        {/* Minaret */}
        <rect x={size * 0.72} y={size * 0.15} 
              width={size * 0.04} height={size * 0.35} 
              fill="#e8d4a0" />
        <polygon points={`${size * 0.72},${size * 0.15} ${size * 0.74},${size * 0.12} ${size * 0.76},${size * 0.15}`}
                 fill="#6aa84f" />
        
        {/* Crescent on minaret */}
        <path d={`M ${size * 0.74} ${size * 0.1}
                  Q ${size * 0.735} ${size * 0.095} ${size * 0.74} ${size * 0.09}
                  Q ${size * 0.745} ${size * 0.095} ${size * 0.74} ${size * 0.1}`}
              fill="#d4af37" strokeWidth="0" />
      </g>
    </g>
  );
};

// Byzantine/Eastern Roman fortress
export const ByzantineFortressSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `byzantine-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`byzStone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d8c8" />
          <stop offset="50%" stopColor="#d8c8b8" />
          <stop offset="100%" stopColor="#c8b8a8" />
        </linearGradient>
        <pattern id={`byzBrick-${uniqueId}`} x="0" y="0" width={size * 0.1} height={size * 0.05} patternUnits="userSpaceOnUse">
          <rect width={size * 0.1} height={size * 0.05} fill="#d8c8b8" />
          <rect x="0" y="0" width={size * 0.095} height={size * 0.045} fill="#e0d0c0" />
          <rect x="0" y={size * 0.025} width={size * 0.048} height={size * 0.02} fill="#c8b8a8" />
          <rect x={size * 0.052} y={size * 0.025} width={size * 0.043} height={size * 0.02} fill="#c8b8a8" />
        </pattern>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.52} cy={size * 0.72} size={size * 1.2} />
      
      {/* Main fortress with distinctive Byzantine architecture */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Thick outer walls with brick pattern */}
        <rect x={size * 0.15} y={size * 0.4} 
              width={size * 0.7} height={size * 0.32} 
              fill={`url(#byzBrick-${uniqueId})`} />
        
        {/* Wall top */}
        <polygon points={`${size * 0.15},${size * 0.4} ${size * 0.25},${size * 0.34} ${size * 0.95},${size * 0.34} ${size * 0.85},${size * 0.4}`}
                 fill="#e8d8c8" />
        
        {/* Distinctive round towers at corners */}
        {[
          {x: 0.15, y: 0.56},
          {x: 0.85, y: 0.56},
          {x: 0.35, y: 0.4},
          {x: 0.65, y: 0.4}
        ].map((pos, i) => (
          <g key={i}>
            <ellipse cx={size * pos.x} cy={size * pos.y} 
                     rx={size * 0.08} ry={size * 0.05} 
                     fill={`url(#byzStone-${uniqueId})`} />
            <ellipse cx={size * pos.x} cy={size * (pos.y - 0.15)} 
                     rx={size * 0.06} ry={size * 0.04} 
                     fill="#d8c8b8" />
            {/* Dome on tower */}
            <ellipse cx={size * pos.x} cy={size * (pos.y - 0.15)} 
                     rx={size * 0.05} ry={size * 0.035} 
                     fill="#8b4513" />
          </g>
        ))}
        
        {/* Central palace structure with dome */}
        <rect x={size * 0.4} y={size * 0.3} 
              width={size * 0.2} height={size * 0.15} 
              fill="#e0d0c0" />
        
        {/* Large central dome */}
        <ellipse cx={size * 0.5} cy={size * 0.3} 
                 rx={size * 0.12} ry={size * 0.09} 
                 fill="#8b4513" />
        <ellipse cx={size * 0.5} cy={size * 0.3} 
                 rx={size * 0.1} ry={size * 0.075} 
                 fill="#a0522d" />
        
        {/* Cross on dome */}
        <line x1={size * 0.5} y1={size * 0.22} x2={size * 0.5} y2={size * 0.28} 
              stroke="#d4af37" strokeWidth="1" />
        <line x1={size * 0.48} y1={size * 0.24} x2={size * 0.52} y2={size * 0.24} 
              stroke="#d4af37" strokeWidth="1" />
        
        {/* Arched windows */}
        {[0.25, 0.35, 0.5, 0.65, 0.75].map((xPos, i) => (
          <path key={i}
                d={`M ${size * xPos - size * 0.01} ${size * 0.55}
                    L ${size * xPos - size * 0.01} ${size * 0.5}
                    Q ${size * xPos} ${size * 0.48} ${size * xPos + size * 0.01} ${size * 0.5}
                    L ${size * xPos + size * 0.01} ${size * 0.55}
                    Z`}
                fill="#1a1a1a" />
        ))}
        
        {/* Main gate with rounded arch */}
        <path d={`M ${size * 0.47} ${size * 0.72}
                  L ${size * 0.47} ${size * 0.6}
                  Q ${size * 0.5} ${size * 0.57} ${size * 0.53} ${size * 0.6}
                  L ${size * 0.53} ${size * 0.72}
                  Z`}
              fill="#3a2a1a" />
      </g>
      
      {/* Byzantine double-headed eagle banner */}
      <g transform={`translate(${size * 0.5}, ${size * 0.25})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.1} 
              stroke="#5a4a3a" strokeWidth="1" />
        <rect x={0} y={-size * 0.1} width={size * 0.08} height={size * 0.06}
              fill="#8b0000" opacity="0.9" />
        <rect x={size * 0.03} y={-size * 0.08} width={size * 0.02} height={size * 0.02}
              fill="#d4af37" opacity="0.8" />
      </g>
    </g>
  );
};

// Mongol/Steppe fortress (yurt-style fortified camp)
export const SteppeFortressSymbol: React.FC<FortressSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `steppe-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`feltGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f0e8" />
          <stop offset="50%" stopColor="#e8e0d0" />
          <stop offset="100%" stopColor="#d8d0c0" />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Grass patches */}
      <GrassPatches size={size} seed={seed} />
      
      {/* Shadow */}
      <FortressShadow cx={size * 0.5} cy={size * 0.7} size={size} />
      
      {/* Wooden palisade wall */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Palisade posts in a circle */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const px = size * 0.5 + Math.cos(angle) * size * 0.35;
          const py = size * 0.55 + Math.sin(angle) * size * 0.25;
          return (
            <rect key={i}
                  x={px - 1.5} 
                  y={py - size * 0.1} 
                  width={3} 
                  height={size * 0.15} 
                  fill="#6a5a4a" />
          );
        })}
        
        {/* Central large yurt (Khan's tent) */}
        <ellipse cx={size * 0.5} cy={size * 0.55} 
                 rx={size * 0.18} ry={size * 0.12} 
                 fill={`url(#feltGrad-${uniqueId})`} />
        
        {/* Yurt dome */}
        <path d={`M ${size * 0.32} ${size * 0.55}
                  Q ${size * 0.5} ${size * 0.4} ${size * 0.68} ${size * 0.55}`}
              fill="#e8e0d0" />
        
        {/* Decorative bands on yurt */}
        <ellipse cx={size * 0.5} cy={size * 0.55} 
                 rx={size * 0.18} ry={size * 0.12} 
                 fill="none" 
                 stroke="#8b4513" 
                 strokeWidth="1" />
        <ellipse cx={size * 0.5} cy={size * 0.53} 
                 rx={size * 0.16} ry={size * 0.1} 
                 fill="none" 
                 stroke="#a0522d" 
                 strokeWidth="0.5" />
        
        {/* Smoke hole at top */}
        <ellipse cx={size * 0.5} cy={size * 0.42} 
                 rx={size * 0.02} ry={size * 0.015} 
                 fill="#2a2a2a" />
        
        {/* Smaller yurts around */}
        {[
          {x: 0.25, y: 0.6},
          {x: 0.75, y: 0.6},
          {x: 0.35, y: 0.45}
        ].map((pos, i) => (
          <g key={i}>
            <ellipse cx={size * pos.x} cy={size * pos.y} 
                     rx={size * 0.08} ry={size * 0.05} 
                     fill="#f0e8d8" />
            <path d={`M ${size * (pos.x - 0.08)} ${size * pos.y}
                      Q ${size * pos.x} ${size * (pos.y - 0.06)} 
                        ${size * (pos.x + 0.08)} ${size * pos.y}`}
                  fill="#e0d8c8" />
          </g>
        ))}
        
        {/* Gate opening in palisade */}
        <rect x={size * 0.47} y={size * 0.7} 
              width={size * 0.06} height={size * 0.08} 
              fill="#3a2a1a" />
      </g>
      
      {/* Horse-tail banner (Tugh) */}
      <g transform={`translate(${size * 0.65}, ${size * 0.35})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.15} 
              stroke="#4a3a2a" strokeWidth="1.5" />
        {/* Horse tails */}
        {[-0.02, 0, 0.02].map((offset, i) => (
          <path key={i}
                d={`M ${size * offset} ${-size * 0.15}
                    Q ${size * (offset + 0.01)} ${-size * 0.12} 
                      ${size * offset} ${-size * 0.08}`}
                stroke="#2a1a0a" 
                strokeWidth="2" 
                fill="none" />
        ))}
      </g>
      
      {/* Smoke from central yurt */}
      <g opacity="0.4">
        <circle cx={size * 0.5} cy={size * 0.38} r={size * 0.015} fill="#666666">
          <animate attributeName="cy" 
                   values={`${size * 0.38};${size * 0.3};${size * 0.22}`}
                   dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" 
                   values="0.4;0.2;0"
                   dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
};

// Export function to get appropriate fortress type with cultural fallbacks
export const getFortressSymbol = (fortressType: string, era?: string, culturalZone?: string) => {
  const type = fortressType?.toLowerCase() || '';
  
  // First check for specific fortress types in the name (case-insensitive)
  // Check exact matches from the generation code first
  if (type === 'hillfort' || type.includes('hillfort') || type.includes('hill fort') || type.includes('ring fort') || type.includes('enclosure') || type.includes('palisaded')) {
    return HillfortSymbol;
  }
  if (type === 'roman fort' || type === 'castrum' || type.includes('castrum') || type.includes('roman')) {
    return CastrumSymbol;
  }
  if (type === 'star fort' || type.includes('star fort') || type.includes('bastion')) {
    return StarFortSymbol;
  }
  if (type === 'colonial presidio' || type.includes('presidio')) {
    return PresidioSymbol;
  }
  if (type === 'medieval castle' || type.includes('medieval') || type.includes('castle') || type.includes('keep') || type.includes('citadel')) {
    return MedievalCastleSymbol;
  }
  // Modern military installations
  if (type === 'modern fort' || type.includes('modern') || type.includes('base') || type.includes('bunker') || type.includes('barracks') ||
      type.includes('nato') || type.includes('station') || type.includes('carabinieri') || type.includes('alpine fortification') ||
      type.includes('military') || type.includes('airfield') || type.includes('depot')) {
    return ModernFortSymbol;
  }
  if (type === 'japanese fortress' || type === 'chinese fort' || type.includes('japanese') || type.includes('chinese') || type.includes('tenshu')) {
    return JapaneseFortressSymbol;
  }
  if (type.includes('kasbah') || type.includes('ribat') || type.includes("qal'a") || type.includes('islamic')) {
    return IslamicFortressSymbol;
  }
  if (type.includes('byzantine') || type.includes('constantinople')) {
    return ByzantineFortressSymbol;
  }
  if (type.includes('mongol') || type.includes('yurt') || type.includes('steppe') || type.includes('ordu')) {
    return SteppeFortressSymbol;
  }
  
  // Era and cultural zone based selection
  if (era && culturalZone) {
    const zone = culturalZone.toUpperCase();
    const eraLower = era.toLowerCase();
    
    // Era-specific fortress selection by culture
    if (eraLower.includes('prehistoric') || eraLower.includes('prehistory')) {
      return HillfortSymbol; // Universal for prehistoric
    }
    
    if (eraLower.includes('ancient') || eraLower.includes('antiquity')) {
      // Ancient era fortresses
      if (zone.includes('ROMAN') || zone.includes('GREEK') || zone.includes('MEDITERRANEAN')) {
        return CastrumSymbol;
      }
      if (zone.includes('EAST_ASIAN') || zone.includes('CHINESE')) {
        return JapaneseFortressSymbol; // Chinese-style walls
      }
      return HillfortSymbol; // Default ancient
    }
    
    if (eraLower.includes('medieval')) {
      // Medieval era fortresses
      if (zone.includes('EUROPEAN') || zone.includes('BYZANTINE') || zone.includes('SLAVIC')) {
        return MedievalCastleSymbol;
      }
      if (zone.includes('EAST_ASIAN') || zone.includes('JAPANESE')) {
        return JapaneseFortressSymbol;
      }
      if (zone.includes('MENA') || zone.includes('SOUTH_ASIAN')) {
        return IslamicFortressSymbol; // Islamic/Mughal style
      }
      return MedievalCastleSymbol; // Default medieval
    }
    
    if (eraLower.includes('renaissance') || eraLower.includes('early_modern')) {
      // Renaissance/Early Modern fortresses
      if (zone.includes('NORTH_AMERICAN_COLONIAL') || zone.includes('SOUTH_AMERICAN')) {
        return PresidioSymbol; // Colonial fortifications
      }
      if (zone.includes('EAST_ASIAN')) {
        return JapaneseFortressSymbol;
      }
      return StarFortSymbol; // Bastion fort is default for this era
    }
    
    if (eraLower.includes('industrial')) {
      // Industrial era fortresses
      if (zone.includes('EUROPEAN')) {
        return StarFortSymbol; // Star forts were still common in 19th century Europe
      }
      if (zone.includes('NORTH_AMERICAN')) {
        return StarFortSymbol; // Civil War era forts
      }
      return StarFortSymbol; // Default for industrial
    }
    
    if (eraLower.includes('modern') || eraLower.includes('contemporary')) {
      return ModernFortSymbol; // Universal modern fort
    }
  }
  
  // Cultural zone fallback without era
  if (culturalZone) {
    const zone = culturalZone.toUpperCase();
    
    // Pre-columbian Americas, Oceania, Africa, and Aboriginal cultures use hillfort
    if (zone.includes('NORTH_AMERICAN_PRE_COLUMBIAN') || 
        zone.includes('SOUTH_AMERICAN') ||
        zone.includes('OCEANIA') ||
        zone.includes('ABORIGINAL') ||
        zone.includes('SUB_SAHARAN_AFRICAN') ||
        zone.includes('ARCTIC')) {
      return HillfortSymbol;
    }
    
    // East Asian cultures use Japanese fortress style
    if (zone.includes('EAST_ASIAN') || zone.includes('CHINESE') || zone.includes('JAPANESE')) {
      return JapaneseFortressSymbol;
    }
    
    // Mediterranean and classical cultures use castrum
    if (zone.includes('MEDITERRANEAN') || zone.includes('GREEK') || zone.includes('ROMAN')) {
      return CastrumSymbol;
    }
    
    // European cultures use medieval castle
    if (zone.includes('EUROPEAN') || zone.includes('VIKING') || zone.includes('SLAVIC')) {
      return MedievalCastleSymbol;
    }
    
    // Middle Eastern and South Asian use star fort style
    if (zone.includes('MENA') || zone.includes('SOUTH_ASIAN')) {
      return StarFortSymbol;
    }
  }
  
  // Era-only fallback
  if (era) {
    const eraLower = era.toLowerCase();
    if (eraLower.includes('prehistoric') || eraLower.includes('prehistory')) return HillfortSymbol;
    if (eraLower.includes('ancient') || eraLower.includes('antiquity')) return CastrumSymbol;
    if (eraLower.includes('medieval')) return MedievalCastleSymbol;
    if (eraLower.includes('renaissance') || eraLower.includes('early_modern')) return StarFortSymbol;
    if (eraLower.includes('industrial')) return StarFortSymbol; // Industrial era fortresses
    if (eraLower.includes('modern') || eraLower.includes('contemporary')) return ModernFortSymbol;
  }
  
  // Final fallback - medieval castle is most recognizable
  return MedievalCastleSymbol;
};