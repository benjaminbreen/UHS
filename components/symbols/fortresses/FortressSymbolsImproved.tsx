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

// East Asian fortress with improved architecture
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
        <polygon points={`${size * 0.25},${size * 0.65} ${size * 0.75},${size * 0.65} ${size * 0.85},${size * 0.55} ${size * 0.35},${size * 0.55}`}
                 fill={`url(#japStone-${uniqueId})`} />
        
        {/* Top of base */}
        <polygon points={`${size * 0.35},${size * 0.55} ${size * 0.85},${size * 0.55} ${size * 0.8},${size * 0.5} ${size * 0.3},${size * 0.5}`}
                 fill="#f0f0f0" />
        
        {/* Multi-tiered keep */}
        {[0, 1, 2].map((tier) => {
          const tierSize = 1 - tier * 0.15;
          const tierY = 0.5 - tier * 0.1;
          return (
            <g key={tier}>
              {/* Building tier */}
              <rect x={size * (0.5 - 0.12 * tierSize)} 
                    y={size * tierY - size * 0.05} 
                    width={size * 0.24 * tierSize} 
                    height={size * 0.08} 
                    fill="#f8f8f8" />
              
              {/* Curved roof */}
              <path d={`M ${size * (0.5 - 0.15 * tierSize)} ${size * (tierY - 0.05)}
                        Q ${size * 0.5} ${size * (tierY - 0.09)}
                        ${size * (0.5 + 0.15 * tierSize)} ${size * (tierY - 0.05)}`}
                    fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
              
              {/* Roof edge detail */}
              <path d={`M ${size * (0.5 - 0.15 * tierSize)} ${size * (tierY - 0.05)}
                        Q ${size * 0.5} ${size * (tierY - 0.08)}
                        ${size * (0.5 + 0.15 * tierSize)} ${size * (tierY - 0.05)}`}
                    fill="none" stroke="#6a6a6a" strokeWidth="0.3" />
            </g>
          );
        })}
        
        {/* Windows */}
        {[0.42, 0.5, 0.58].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos} y={size * 0.42} 
                width={size * 0.015} height={size * 0.025} 
                fill="#1a1a1a" />
        ))}
        
        {/* Defensive walls extending from base */}
        <rect x={size * 0.15} y={size * 0.68} 
              width={size * 0.7} height={size * 0.04} 
              fill="#d0d0d0" stroke="#a0a0a0" strokeWidth="0.5" />
        
        {/* Gate */}
        <rect x={size * 0.47} y={size * 0.68} 
              width={size * 0.06} height={size * 0.04} 
              fill="#3a2a1a" />
      </g>
    </g>
  );
};

// Export function to get appropriate fortress type with cultural fallbacks
export const getFortressSymbol = (fortressType: string, era?: string, culturalZone?: string) => {
  const type = fortressType?.toLowerCase() || '';
  
  // First check for specific fortress types in the name
  if (type.includes('hillfort') || type.includes('enclosure')) {
    return HillfortSymbol;
  }
  if (type.includes('castrum') || type.includes('roman')) {
    return CastrumSymbol;
  }
  if (type.includes('star') || type.includes('bastion')) {
    return StarFortSymbol;
  }
  if (type.includes('presidio') || type.includes('colonial')) {
    return PresidioSymbol;
  }
  if (type.includes('castle') || type.includes('keep') || type.includes('citadel')) {
    return MedievalCastleSymbol;
  }
  if (type.includes('modern') || type.includes('base') || type.includes('bunker')) {
    return ModernFortSymbol;
  }
  if (type.includes('japanese') || type.includes('tenshu')) {
    return JapaneseFortressSymbol;
  }
  
  // Era and cultural zone based selection
  if (era && culturalZone) {
    const zone = culturalZone.toUpperCase();
    
    // Era-specific fortress selection by culture
    if (era.includes('prehistoric')) {
      return HillfortSymbol; // Universal for prehistoric
    }
    
    if (era.includes('ancient')) {
      // Ancient era fortresses
      if (zone.includes('ROMAN') || zone.includes('GREEK') || zone.includes('MEDITERRANEAN')) {
        return CastrumSymbol;
      }
      if (zone.includes('EAST_ASIAN') || zone.includes('CHINESE')) {
        return JapaneseFortressSymbol; // Chinese-style walls
      }
      return HillfortSymbol; // Default ancient
    }
    
    if (era.includes('medieval')) {
      // Medieval era fortresses
      if (zone.includes('EUROPEAN') || zone.includes('BYZANTINE') || zone.includes('SLAVIC')) {
        return MedievalCastleSymbol;
      }
      if (zone.includes('EAST_ASIAN') || zone.includes('JAPANESE')) {
        return JapaneseFortressSymbol;
      }
      if (zone.includes('MENA') || zone.includes('SOUTH_ASIAN')) {
        return StarFortSymbol; // Islamic/Mughal style
      }
      return MedievalCastleSymbol; // Default medieval
    }
    
    if (era.includes('renaissance') || era.includes('early_modern')) {
      // Renaissance/Early Modern fortresses
      if (zone.includes('NORTH_AMERICAN_COLONIAL') || zone.includes('SOUTH_AMERICAN')) {
        return PresidioSymbol; // Colonial fortifications
      }
      if (zone.includes('EAST_ASIAN')) {
        return JapaneseFortressSymbol;
      }
      return StarFortSymbol; // Bastion fort is default for this era
    }
    
    if (era.includes('modern') || era.includes('contemporary')) {
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
    if (era.includes('prehistoric')) return HillfortSymbol;
    if (era.includes('ancient')) return CastrumSymbol;
    if (era.includes('medieval')) return MedievalCastleSymbol;
    if (era.includes('renaissance') || era.includes('early_modern')) return StarFortSymbol;
    if (era.includes('modern') || era.includes('contemporary')) return ModernFortSymbol;
  }
  
  // Final fallback - medieval castle is most recognizable
  return MedievalCastleSymbol;
};