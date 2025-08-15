/**
 * Improved Government Building symbols with consistent 2.5D perspective and animations
 */
import React from 'react';

interface GovernmentSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  date?: string;
  zone?: string;
}

// Shared shadow component
const GovernmentShadow: React.FC<{cx: number, cy: number, size: number}> = ({cx, cy, size}) => (
  <ellipse 
    cx={cx} 
    cy={cy} 
    rx={size * 0.4} 
    ry={size * 0.15} 
    fill="rgba(0,0,0,0.25)"
    filter="blur(2px)"
  />
);

// City Hall with animated clock
export const CityHallSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed, date }) => {
  const uniqueId = `cityhall-${x}-${y}-${seed}`;
  
  // Parse time from date for clock hands
  const hour = ((seed * 7) % 12) || 12;
  const minute = (seed * 13) % 60;
  const hourAngle = (hour % 12) * 30 + (minute / 60) * 30;
  const minuteAngle = minute * 6;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`hallGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d8c8" />
          <stop offset="50%" stopColor="#d8c8b8" />
          <stop offset="100%" stopColor="#c0b0a0" />
        </linearGradient>
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
      <GovernmentShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front face */}
        <rect x={size * 0.25} y={size * 0.4} 
              width={size * 0.5} height={size * 0.35} 
              fill={`url(#hallGrad-${uniqueId})`} />
        
        {/* Top face */}
        <polygon points={`${size * 0.25},${size * 0.4} ${size * 0.35},${size * 0.32} ${size * 0.85},${size * 0.32} ${size * 0.75},${size * 0.4}`}
                 fill="#e8d8c8" />
        
        {/* Right face */}
        <polygon points={`${size * 0.75},${size * 0.4} ${size * 0.85},${size * 0.32} ${size * 0.85},${size * 0.67} ${size * 0.75},${size * 0.75}`}
                 fill="#c8b8a8" />
        
        {/* Clock tower */}
        <rect x={size * 0.45} y={size * 0.2} 
              width={size * 0.1} height={size * 0.25} 
              fill="#d0c0b0" />
        
        {/* Clock face */}
        <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.04} 
                fill="#f8f8f8" stroke="#888888" strokeWidth="0.5" />
        
        {/* Animated clock hands */}
        <g transform={`translate(${size * 0.5}, ${size * 0.28})`}>
          {/* Hour hand */}
          <line x1={0} y1={0} 
                x2={0} y2={-size * 0.02}
                stroke="#333333" strokeWidth="0.8"
                transform={`rotate(${hourAngle})`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`${hourAngle}`}
              to={`${hourAngle + 360}`}
              dur="120s"
              repeatCount="indefinite"
            />
          </line>
          
          {/* Minute hand */}
          <line x1={0} y1={0} 
                x2={0} y2={-size * 0.03}
                stroke="#333333" strokeWidth="0.5"
                transform={`rotate(${minuteAngle})`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`${minuteAngle}`}
              to={`${minuteAngle + 360}`}
              dur="10s"
              repeatCount="indefinite"
            />
          </line>
          
          {/* Center dot */}
          <circle cx={0} cy={0} r={size * 0.003} fill="#333333" />
        </g>
        
        {/* Windows */}
        {[0.35, 0.5, 0.65].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.02} 
                y={size * 0.5} 
                width={size * 0.04} height={size * 0.06} 
                fill="#4a7a9a" opacity="0.7" />
        ))}
        
        {/* Main entrance */}
        <rect x={size * 0.47} y={size * 0.65} 
              width={size * 0.06} height={size * 0.1} 
              fill="#4a3a2a" />
      </g>
      
      {/* Flag pole with animated flag */}
      <g transform={`translate(${size * 0.3}, ${size * 0.32})`}>
        <line x1={0} y1={0} x2={0} y2={-size * 0.12} 
              stroke="#5a4a3a" strokeWidth="1" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-2;0;2;0"
            dur="3s"
            repeatCount="indefinite"
          />
          <rect x={0} y={-size * 0.12} 
                width={size * 0.08} height={size * 0.05} 
                fill="#4444cc" opacity="0.8" />
        </g>
      </g>
    </g>
  );
};

// Tribal Council with fire and smoke
export const TribalCouncilSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `tribal-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <radialGradient id={`fireGrad-${uniqueId}`} cx="50%" cy="80%">
          <stop offset="0%" stopColor="#ffff00" />
          <stop offset="30%" stopColor="#ff8800" />
          <stop offset="60%" stopColor="#ff4400" />
          <stop offset="100%" stopColor="#cc0000" />
        </radialGradient>
        <filter id={`glow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Ground circle */}
      <ellipse cx={size * 0.5} cy={size * 0.7} 
               rx={size * 0.45} ry={size * 0.2} 
               fill="rgba(180,140,100,0.3)" />
      
      {/* Shadow */}
      <GovernmentShadow cx={size * 0.5} cy={size * 0.72} size={size} />
      
      {/* Stone circle for council */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const stoneX = size * 0.5 + Math.cos(angle) * size * 0.35;
        const stoneY = size * 0.6 + Math.sin(angle) * size * 0.2;
        return (
          <ellipse key={i} 
                   cx={stoneX} cy={stoneY} 
                   rx={size * 0.04} ry={size * 0.03} 
                   fill="#8a7a6a" stroke="#6a5a4a" strokeWidth="0.5" />
        );
      })}
      
      {/* Central fire pit */}
      <ellipse cx={size * 0.5} cy={size * 0.6} 
               rx={size * 0.08} ry={size * 0.05} 
               fill="#4a3a2a" />
      
      {/* Animated fire */}
      <g filter={`url(#glow-${uniqueId})`}>
        <g transform={`translate(${size * 0.5}, ${size * 0.58})`}>
          {/* Flame 1 */}
          <ellipse cx={-size * 0.02} cy={0} 
                   rx={size * 0.03} ry={size * 0.05}
                   fill={`url(#fireGrad-${uniqueId})`}>
            <animate attributeName="ry" 
                     values={`${size * 0.05};${size * 0.07};${size * 0.05}`}
                     dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="rx" 
                     values={`${size * 0.03};${size * 0.025};${size * 0.03}`}
                     dur="0.8s" repeatCount="indefinite" />
          </ellipse>
          
          {/* Flame 2 */}
          <ellipse cx={size * 0.02} cy={0} 
                   rx={size * 0.025} ry={size * 0.045}
                   fill={`url(#fireGrad-${uniqueId})`}>
            <animate attributeName="ry" 
                     values={`${size * 0.045};${size * 0.065};${size * 0.045}`}
                     dur="1s" repeatCount="indefinite" />
          </ellipse>
          
          {/* Central flame */}
          <ellipse cx={0} cy={-size * 0.01} 
                   rx={size * 0.035} ry={size * 0.06}
                   fill={`url(#fireGrad-${uniqueId})`}>
            <animate attributeName="ry" 
                     values={`${size * 0.06};${size * 0.08};${size * 0.06}`}
                     dur="1.2s" repeatCount="indefinite" />
          </ellipse>
        </g>
      </g>
      
      {/* Animated smoke */}
      <g opacity="0.4">
        {[0, 1, 2].map((i) => (
          <circle key={i} 
                  cx={size * 0.5} 
                  cy={size * 0.5}
                  r={size * 0.02}
                  fill="#888888">
            <animate attributeName="cy" 
                     values={`${size * 0.5};${size * 0.3};${size * 0.1}`}
                     dur={`${3 + i}s`} 
                     repeatCount="indefinite" />
            <animate attributeName="r" 
                     values={`${size * 0.02};${size * 0.04};${size * 0.06}`}
                     dur={`${3 + i}s`} 
                     repeatCount="indefinite" />
            <animate attributeName="opacity" 
                     values="0.4;0.3;0"
                     dur={`${3 + i}s`} 
                     repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      
      {/* Totem pole or central post */}
      <rect x={size * 0.48} y={size * 0.35} 
            width={size * 0.04} height={size * 0.25} 
            fill="#6a4a2a" stroke="#4a2a0a" strokeWidth="0.5" />
      
      {/* Carved details */}
      <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.015} 
              fill="#8a6a4a" />
    </g>
  );
};

// Mandate Hall (Chinese administrative building)
export const MandateHallSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `mandate-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc4444" />
          <stop offset="50%" stopColor="#aa3333" />
          <stop offset="100%" stopColor="#882222" />
        </linearGradient>
        <linearGradient id={`wallGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8e8d8" />
          <stop offset="100%" stopColor="#e8d8c8" />
        </linearGradient>
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
      <GovernmentShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main building structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Base platform */}
        <rect x={size * 0.2} y={size * 0.65} 
              width={size * 0.6} height={size * 0.08} 
              fill="#c8b8a8" />
        
        {/* Main building */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.5} height={size * 0.25} 
              fill={`url(#wallGrad-${uniqueId})`} />
        
        {/* Pillars */}
        {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.015} 
                y={size * 0.45} 
                width={size * 0.03} height={size * 0.25} 
                fill="#cc3333" />
        ))}
        
        {/* Traditional curved roof - main */}
        <path d={`M ${size * 0.18} ${size * 0.45}
                  Q ${size * 0.15} ${size * 0.38}, ${size * 0.25} ${size * 0.35}
                  L ${size * 0.75} ${size * 0.35}
                  Q ${size * 0.85} ${size * 0.38}, ${size * 0.82} ${size * 0.45}
                  Z`}
              fill={`url(#roofGrad-${uniqueId})`} />
        
        {/* Roof ridge */}
        <rect x={size * 0.25} y={size * 0.33} 
              width={size * 0.5} height={size * 0.02} 
              fill="#aa2222" />
        
        {/* Upper tier roof */}
        <path d={`M ${size * 0.3} ${size * 0.35}
                  Q ${size * 0.28} ${size * 0.3}, ${size * 0.35} ${size * 0.28}
                  L ${size * 0.65} ${size * 0.28}
                  Q ${size * 0.72} ${size * 0.3}, ${size * 0.7} ${size * 0.35}
                  Z`}
              fill="#cc4444" opacity="0.9" />
        
        {/* Decorative roof ornaments */}
        <circle cx={size * 0.18} cy={size * 0.42} r={size * 0.015} fill="#ffcc00" />
        <circle cx={size * 0.82} cy={size * 0.42} r={size * 0.015} fill="#ffcc00" />
      </g>
      
      {/* Imperial banner */}
      <g transform={`translate(${size * 0.15}, ${size * 0.5})`}>
        <rect x={0} y={0} width={size * 0.02} height={size * 0.25} 
              fill="#5a4a3a" />
        <rect x={size * 0.02} y={0} 
              width={size * 0.08} height={size * 0.12} 
              fill="#ffcc00" opacity="0.8" />
        <text x={size * 0.06} y={size * 0.06} 
              fontSize={size * 0.04} fill="#cc0000" textAnchor="middle">
          令
        </text>
      </g>
    </g>
  );
};

// Caliph Court with minaret
export const CaliphCourtSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `caliph-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`domeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4488cc" />
          <stop offset="50%" stopColor="#3377bb" />
          <stop offset="100%" stopColor="#2266aa" />
        </linearGradient>
        <linearGradient id={`wallGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8e8d0" />
          <stop offset="100%" stopColor="#e8d8c0" />
        </linearGradient>
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
      <GovernmentShadow cx={size * 0.52} cy={size * 0.75} size={size} />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Main structure */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.5} height={size * 0.3} 
              fill={`url(#wallGrad-${uniqueId})`} />
        
        {/* Central dome */}
        <ellipse cx={size * 0.5} cy={size * 0.45} 
                 rx={size * 0.15} ry={size * 0.12} 
                 fill={`url(#domeGrad-${uniqueId})`} />
        
        {/* Dome top */}
        <ellipse cx={size * 0.5} cy={size * 0.42} 
                 rx={size * 0.12} ry={size * 0.08} 
                 fill="#5599dd" />
        
        {/* Minaret */}
        <rect x={size * 0.75} y={size * 0.25} 
              width={size * 0.06} height={size * 0.35} 
              fill="#e8d8c0" />
        
        {/* Minaret top */}
        <polygon points={`${size * 0.75},${size * 0.25} ${size * 0.78},${size * 0.2} ${size * 0.81},${size * 0.25}`}
                 fill="#4488cc" />
        
        {/* Crescent moon on minaret */}
        <g transform={`translate(${size * 0.78}, ${size * 0.18})`}>
          <path d={`M 0,${-size * 0.02} 
                    A ${size * 0.02} ${size * 0.02} 0 1 1 0,${size * 0.02}
                    A ${size * 0.015} ${size * 0.015} 0 1 0 0,${-size * 0.02}`}
                fill="#ffcc00" />
        </g>
        
        {/* Arched entrance */}
        <path d={`M ${size * 0.45} ${size * 0.75}
                  L ${size * 0.45} ${size * 0.6}
                  Q ${size * 0.5} ${size * 0.55}, ${size * 0.55} ${size * 0.6}
                  L ${size * 0.55} ${size * 0.75}
                  Z`}
              fill="#3a2a1a" />
        
        {/* Windows */}
        {[0.35, 0.65].map((xPos, i) => (
          <path key={i}
                d={`M ${size * xPos} ${size * 0.55}
                    Q ${size * (xPos + 0.025)} ${size * 0.52}, ${size * (xPos + 0.05)} ${size * 0.55}
                    L ${size * (xPos + 0.05)} ${size * 0.6}
                    L ${size * xPos} ${size * 0.6}
                    Z`}
                fill="#4a7a9a" opacity="0.7" />
        ))}
      </g>
    </g>
  );
};

// Colonial Office with flag
export const ColonialOfficeSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `colonial-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`colonialGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f0e8" />
          <stop offset="100%" stopColor="#e8e0d8" />
        </linearGradient>
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
      
      {/* Palm tree context */}
      <g opacity="0.6">
        <rect x={size * 0.85} y={size * 0.4} 
              width={size * 0.02} height={size * 0.35} 
              fill="#8a6a4a" />
        <g transform={`translate(${size * 0.86}, ${size * 0.38})`}>
          {[0, 60, 120, 240, 300].map((angle, i) => (
            <path key={i}
                  d={`M 0,0 Q ${Math.cos(angle * Math.PI / 180) * size * 0.08},${-size * 0.02} 
                      ${Math.cos(angle * Math.PI / 180) * size * 0.12},${Math.sin(angle * Math.PI / 180) * size * 0.08}`}
                  fill="#4a7a4a" stroke="#3a5a3a" strokeWidth="0.3" />
          ))}
        </g>
      </g>
      
      {/* Shadow */}
      <GovernmentShadow cx={size * 0.45} cy={size * 0.75} size={size} />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Main structure with columns */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.5} height={size * 0.35} 
              fill={`url(#colonialGrad-${uniqueId})`} />
        
        {/* Columns */}
        {[0.25, 0.35, 0.45, 0.55, 0.65].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.015} 
                y={size * 0.4} 
                width={size * 0.03} height={size * 0.35} 
                fill="#f0e8e0" stroke="#d0c8c0" strokeWidth="0.3" />
        ))}
        
        {/* Roof */}
        <polygon points={`${size * 0.18},${size * 0.4} ${size * 0.45},${size * 0.28} ${size * 0.72},${size * 0.4}`}
                 fill="#8a6a4a" />
        
        {/* Upper balcony */}
        <rect x={size * 0.25} y={size * 0.52} 
              width={size * 0.4} height={size * 0.02} 
              fill="#d0c0b0" />
        
        {/* Windows with shutters */}
        {[0.3, 0.45, 0.6].map((xPos, i) => (
          <g key={i}>
            <rect x={size * xPos - size * 0.03} 
                  y={size * 0.58} 
                  width={size * 0.06} height={size * 0.08} 
                  fill="#4a7a9a" opacity="0.7" />
            <rect x={size * xPos - size * 0.035} 
                  y={size * 0.58} 
                  width={size * 0.005} height={size * 0.08} 
                  fill="#6a5a4a" />
            <rect x={size * xPos + size * 0.03} 
                  y={size * 0.58} 
                  width={size * 0.005} height={size * 0.08} 
                  fill="#6a5a4a" />
          </g>
        ))}
      </g>
      
      {/* Union Jack flag */}
      <g transform={`translate(${size * 0.3}, ${size * 0.28})`}>
        <rect x={0} y={0} width={size * 0.02} height={size * 0.15} 
              fill="#5a4a3a" />
        <g>
          <animateTransform
            attributeName="transform"
            type="skewX"
            values="0;-3;0;3;0"
            dur="4s"
            repeatCount="indefinite"
          />
          <rect x={size * 0.02} y={0} 
                width={size * 0.1} height={size * 0.06} 
                fill="#002868" />
          <rect x={size * 0.02} y={size * 0.025} 
                width={size * 0.1} height={size * 0.01} 
                fill="#ffffff" />
          <rect x={size * 0.065} y={0} 
                width={size * 0.01} height={size * 0.06} 
                fill="#ffffff" />
          <path d={`M ${size * 0.02} 0 L ${size * 0.12} ${size * 0.06}`}
                stroke="#cc0000" strokeWidth="0.5" />
          <path d={`M ${size * 0.02} ${size * 0.06} L ${size * 0.12} 0`}
                stroke="#cc0000" strokeWidth="0.5" />
        </g>
      </g>
    </g>
  );
};

// Roman Forum with classical architecture
export const RomanForumSymbol: React.FC<GovernmentSymbolProps> = ({ x, y, size, seed }) => {
  const uniqueId = `forum-${x}-${y}-${seed}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`marbleGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f8f0" />
          <stop offset="50%" stopColor="#e8e8e0" />
          <stop offset="100%" stopColor="#d8d8d0" />
        </linearGradient>
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
      <GovernmentShadow cx={size * 0.5} cy={size * 0.75} size={size} />
      
      {/* Main forum structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Base platform */}
        <rect x={size * 0.15} y={size * 0.65} 
              width={size * 0.7} height={size * 0.08} 
              fill="#c8c0b8" />
        
        {/* Steps */}
        <rect x={size * 0.2} y={size * 0.68} 
              width={size * 0.6} height={size * 0.02} 
              fill="#d0c8c0" />
        <rect x={size * 0.25} y={size * 0.7} 
              width={size * 0.5} height={size * 0.02} 
              fill="#d8d0c8" />
        
        {/* Columns */}
        {[0.25, 0.35, 0.45, 0.55, 0.65, 0.75].map((xPos, i) => (
          <g key={i}>
            {/* Column shaft */}
            <rect x={size * xPos - size * 0.02} 
                  y={size * 0.35} 
                  width={size * 0.04} height={size * 0.3} 
                  fill={`url(#marbleGrad-${uniqueId})`} />
            
            {/* Column capital */}
            <rect x={size * xPos - size * 0.025} 
                  y={size * 0.33} 
                  width={size * 0.05} height={size * 0.03} 
                  fill="#e8e8e0" />
            
            {/* Column base */}
            <rect x={size * xPos - size * 0.025} 
                  y={size * 0.64} 
                  width={size * 0.05} height={size * 0.02} 
                  fill="#d0d0c8" />
          </g>
        ))}
        
        {/* Pediment */}
        <polygon points={`${size * 0.2},${size * 0.33} ${size * 0.5},${size * 0.25} ${size * 0.8},${size * 0.33}`}
                 fill="#e8e8e0" stroke="#c8c8c0" strokeWidth="0.5" />
        
        {/* Inscription area */}
        <rect x={size * 0.3} y={size * 0.28} 
              width={size * 0.4} height={size * 0.04} 
              fill="#f0f0e8" />
        <text x={size * 0.5} y={size * 0.305} 
              fontSize={size * 0.025} fill="#888888" textAnchor="middle">
          SPQR
        </text>
      </g>
      
      {/* Roman standard */}
      <g transform={`translate(${size * 0.85}, ${size * 0.5})`}>
        <rect x={0} y={0} width={size * 0.015} height={size * 0.25} 
              fill="#8a6a4a" />
        <rect x={size * 0.015} y={0} 
              width={size * 0.06} height={size * 0.08} 
              fill="#cc3333" />
        <circle cx={size * 0.045} cy={size * 0.04} 
                r={size * 0.02} fill="#ffcc00" />
      </g>
    </g>
  );
};

// Export all improved government symbols
export default {
  CityHallSymbol,
  TribalCouncilSymbol,
  MandateHallSymbol,
  CaliphCourtSymbol,
  ColonialOfficeSymbol,
  RomanForumSymbol
};