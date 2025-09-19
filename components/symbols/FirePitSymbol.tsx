import React from 'react';

interface FirePitSymbolProps {
  x: number;
  y: number;
  size: number;
  type?: 'pit' | 'hearth' | 'brazier';
  culturalZone?: string;
  era?: number;
  lit?: boolean;
}

const FirePitSymbol: React.FC<FirePitSymbolProps> = React.memo(({
  x,
  y,
  size,
  type = 'pit',
  culturalZone = 'EUROPEAN',
  era = 1000,
  lit = true
}) => {
  
  const renderFirePit = () => {
    // Outdoor fire pit with stone ring
    return (
      <g>
        {/* Gray background */}
        <rect x={0} y={0} width={size} height={size} fill="#8a8a8a" />
        
        {/* Outer stone ring */}
        <circle 
          cx={size * 0.5} 
          cy={size * 0.5} 
          r={size * 0.38} 
          fill="none" 
          stroke="#5a5a5a" 
          strokeWidth={size * 0.08} 
        />
        
        {/* Inner stones */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const stoneX = size * 0.5 + Math.cos(rad) * size * 0.35;
          const stoneY = size * 0.5 + Math.sin(rad) * size * 0.35;
          return (
            <rect 
              key={i}
              x={stoneX - size * 0.04} 
              y={stoneY - size * 0.04} 
              width={size * 0.08} 
              height={size * 0.08}
              rx={size * 0.01}
              fill="#4a4a4a"
              transform={`rotate(${angle} ${stoneX} ${stoneY})`}
            />
          );
        })}
        
        {/* Dark earth/ash center */}
        <circle 
          cx={size * 0.5} 
          cy={size * 0.5} 
          r={size * 0.25} 
          fill="#2a2a2a" 
        />
        
        {/* Charred logs */}
        <rect 
          x={size * 0.35} 
          y={size * 0.45} 
          width={size * 0.3} 
          height={size * 0.1} 
          fill="#3a2515" 
          transform={`rotate(45 ${size * 0.5} ${size * 0.5})`} 
        />
        <rect 
          x={size * 0.35} 
          y={size * 0.45} 
          width={size * 0.3} 
          height={size * 0.1} 
          fill="#4a3020" 
          transform={`rotate(-45 ${size * 0.5} ${size * 0.5})`} 
        />
        
        {/* Flames (if lit) */}
        {lit && (
          <g>
            {/* Glow effect layer */}
            <defs>
              <radialGradient id={`fireGlow-${x}-${y}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="0.3" />
                <stop offset="40%" stopColor="#ff6b35" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
              </radialGradient>
              <filter id={`fireBlur-${x}-${y}`}>
                <feGaussianBlur stdDeviation="1.5"/>
              </filter>
            </defs>
            
            {/* Localized glow circle */}
            <circle 
              cx={size * 0.5} 
              cy={size * 0.5} 
              r={size * 0.45} 
              fill={`url(#fireGlow-${x}-${y})`}
              filter={`url(#fireBlur-${x}-${y})`}
              className="animate-fireGlow"
            />
            
            {/* Multiple flame layers for realistic animation */}
            <g className="animate-fireFlicker1">
              {/* Base flame */}
              <path 
                d={`M ${size * 0.5} ${size * 0.6} 
                    Q ${size * 0.40} ${size * 0.52} ${size * 0.43} ${size * 0.40}
                    Q ${size * 0.46} ${size * 0.44} ${size * 0.5} ${size * 0.36}
                    Q ${size * 0.54} ${size * 0.44} ${size * 0.57} ${size * 0.40}
                    Q ${size * 0.60} ${size * 0.52} ${size * 0.5} ${size * 0.6}`}
                fill="#ff4500" 
                opacity="0.9"
              />
            </g>
            
            <g className="animate-fireFlicker2">
              {/* Secondary flame */}
              <path 
                d={`M ${size * 0.5} ${size * 0.58} 
                    Q ${size * 0.44} ${size * 0.50} ${size * 0.47} ${size * 0.38}
                    Q ${size * 0.50} ${size * 0.42} ${size * 0.53} ${size * 0.38}
                    Q ${size * 0.56} ${size * 0.50} ${size * 0.5} ${size * 0.58}`}
                fill="#ff6b35" 
                opacity="0.8"
              />
            </g>
            
            <g className="animate-fireFlicker3">
              {/* Inner bright flame */}
              <path 
                d={`M ${size * 0.5} ${size * 0.55} 
                    Q ${size * 0.46} ${size * 0.48} ${size * 0.48} ${size * 0.40}
                    Q ${size * 0.50} ${size * 0.43} ${size * 0.52} ${size * 0.40}
                    Q ${size * 0.54} ${size * 0.48} ${size * 0.5} ${size * 0.55}`}
                fill="#ffa500" 
                opacity="0.9"
              />
            </g>
            
            <g className="animate-fireFlicker4">
              {/* Hot center core */}
              <ellipse 
                cx={size * 0.5} 
                cy={size * 0.50} 
                rx={size * 0.06} 
                ry={size * 0.10} 
                fill="#ffff99" 
                opacity="0.95"
              />
            </g>
            
            {/* Sparks/embers */}
            <g className="animate-sparks">
              <circle cx={size * 0.45} cy={size * 0.40} r="0.5" fill="#ffaa00" opacity="0.8" />
              <circle cx={size * 0.55} cy={size * 0.42} r="0.3" fill="#ff6600" opacity="0.7" />
              <circle cx={size * 0.52} cy={size * 0.35} r="0.4" fill="#ffff99" opacity="0.6" />
            </g>
          </g>
        )}
      </g>
    );
  };
  
  const renderHearth = () => {
    // Indoor stone hearth
    const hearthStyle = culturalZone === 'EUROPEAN' && era < 1500 ? 'medieval' : 'modern';
    
    return (
      <g>
        {/* Gray background */}
        <rect x={0} y={0} width={size} height={size} fill="#8a8a8a" />
        
        {/* Stone hearth base */}
        <rect 
          x={size * 0.15} 
          y={size * 0.3} 
          width={size * 0.7} 
          height={size * 0.5} 
          fill="#696969"
          stroke="#4a4a4a"
          strokeWidth="1"
        />
        
        {/* Hearth opening */}
        <rect 
          x={size * 0.25} 
          y={size * 0.4} 
          width={size * 0.5} 
          height={size * 0.35} 
          fill="#1a1a1a" 
        />
        
        {/* Stone details */}
        <line x1={size * 0.15} y1={size * 0.5} x2={size * 0.85} y2={size * 0.5} stroke="#5a5a5a" strokeWidth="0.5" />
        <line x1={size * 0.15} y1={size * 0.65} x2={size * 0.85} y2={size * 0.65} stroke="#5a5a5a" strokeWidth="0.5" />
        <line x1={size * 0.35} y1={size * 0.3} x2={size * 0.35} y2={size * 0.8} stroke="#5a5a5a" strokeWidth="0.5" />
        <line x1={size * 0.65} y1={size * 0.3} x2={size * 0.65} y2={size * 0.8} stroke="#5a5a5a" strokeWidth="0.5" />
        
        {/* Chimney/Hood (medieval style) */}
        {hearthStyle === 'medieval' && (
          <polygon 
            points={`${size * 0.2},${size * 0.3} ${size * 0.3},${size * 0.15} ${size * 0.7},${size * 0.15} ${size * 0.8},${size * 0.3}`}
            fill="#5a5a5a"
            stroke="#3a3a3a"
            strokeWidth="1"
          />
        )}
        
        {/* Logs */}
        <rect x={size * 0.3} y={size * 0.65} width={size * 0.4} height={size * 0.08} fill="#4a3020" rx={size * 0.02} />
        <rect x={size * 0.35} y={size * 0.68} width={size * 0.3} height={size * 0.06} fill="#3a2515" rx={size * 0.02} />
        
        {/* Fire (if lit) */}
        {lit && (
          <g>
            {/* Glow effect for hearth */}
            <defs>
              <radialGradient id={`hearthGlow-${x}-${y}`} cx="50%" cy="60%">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Hearth glow */}
            <ellipse 
              cx={size * 0.5} 
              cy={size * 0.55} 
              rx={size * 0.35} 
              ry={size * 0.25} 
              fill={`url(#hearthGlow-${x}-${y})`}
              className="animate-fireGlow"
            />
            
            <g className="animate-fireFlicker1">
              <path 
                d={`M ${size * 0.5} ${size * 0.65} 
                    Q ${size * 0.38} ${size * 0.57} ${size * 0.41} ${size * 0.47}
                    Q ${size * 0.45} ${size * 0.50} ${size * 0.5} ${size * 0.44}
                    Q ${size * 0.55} ${size * 0.50} ${size * 0.59} ${size * 0.47}
                    Q ${size * 0.62} ${size * 0.57} ${size * 0.5} ${size * 0.65}`}
                fill="#ff4500" 
                opacity="0.9" 
              />
            </g>
            
            <g className="animate-fireFlicker2">
              <path 
                d={`M ${size * 0.5} ${size * 0.62} 
                    Q ${size * 0.42} ${size * 0.54} ${size * 0.44} ${size * 0.46}
                    Q ${size * 0.48} ${size * 0.48} ${size * 0.5} ${size * 0.43}
                    Q ${size * 0.52} ${size * 0.48} ${size * 0.56} ${size * 0.46}
                    Q ${size * 0.58} ${size * 0.54} ${size * 0.5} ${size * 0.62}`}
                fill="#ff6b35" 
                opacity="0.8" 
              />
            </g>
            
            <g className="animate-fireFlicker3">
              <ellipse 
                cx={size * 0.5} 
                cy={size * 0.58} 
                rx={size * 0.08} 
                ry={size * 0.12} 
                fill="#ffa500" 
                opacity="0.9" 
              />
            </g>
          </g>
        )}
        
        {/* Cultural decorations */}
        {culturalZone === 'EAST_ASIAN' && (
          <>
            {/* Asian-style decorative tiles */}
            <rect x={size * 0.2} y={size * 0.35} width={size * 0.05} height={size * 0.05} fill="#8b0000" opacity="0.5" />
            <rect x={size * 0.75} y={size * 0.35} width={size * 0.05} height={size * 0.05} fill="#8b0000" opacity="0.5" />
          </>
        )}
      </g>
    );
  };
  
  const renderBrazier = () => {
    // Metal brazier on legs
    return (
      <g>
        {/* Gray background */}
        <rect x={0} y={0} width={size} height={size} fill="#8a8a8a" />
        
        {/* Brazier legs */}
        <rect x={size * 0.25} y={size * 0.6} width={size * 0.05} height={size * 0.25} fill="#4a4a4a" />
        <rect x={size * 0.7} y={size * 0.6} width={size * 0.05} height={size * 0.25} fill="#4a4a4a" />
        
        {/* Brazier bowl */}
        <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.3} ry={size * 0.08} fill="#3a3a3a" />
        <path 
          d={`M ${size * 0.2} ${size * 0.6} 
              Q ${size * 0.2} ${size * 0.45} ${size * 0.35} ${size * 0.4}
              L ${size * 0.65} ${size * 0.4}
              Q ${size * 0.8} ${size * 0.45} ${size * 0.8} ${size * 0.6}`}
          fill="#4a4a4a"
          stroke="#2a2a2a"
          strokeWidth="1"
        />
        
        {/* Decorative rim */}
        <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.15} ry={size * 0.04} fill="none" stroke="#5a5a5a" strokeWidth="0.5" />
        
        {/* Coals */}
        <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.12} ry={size * 0.05} fill="#2a1a1a" />
        
        {/* Fire (if lit) */}
        {lit && (
          <g>
            {/* Glow effect for brazier */}
            <defs>
              <radialGradient id={`brazierGlow-${x}-${y}`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#ff6b35" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Brazier glow */}
            <ellipse 
              cx={size * 0.5} 
              cy={size * 0.42} 
              rx={size * 0.4} 
              ry={size * 0.3} 
              fill={`url(#brazierGlow-${x}-${y})`}
              className="animate-fireGlow"
            />
            
            <g className="animate-fireFlicker1">
              <path 
                d={`M ${size * 0.5} ${size * 0.50} 
                    Q ${size * 0.42} ${size * 0.44} ${size * 0.45} ${size * 0.34}
                    Q ${size * 0.48} ${size * 0.37} ${size * 0.5} ${size * 0.30}
                    Q ${size * 0.52} ${size * 0.37} ${size * 0.55} ${size * 0.34}
                    Q ${size * 0.58} ${size * 0.44} ${size * 0.5} ${size * 0.50}`}
                fill="#ff4500" 
                opacity="0.9" 
              />
            </g>
            
            <g className="animate-fireFlicker2">
              <path 
                d={`M ${size * 0.5} ${size * 0.48} 
                    Q ${size * 0.44} ${size * 0.42} ${size * 0.47} ${size * 0.33}
                    Q ${size * 0.5} ${size * 0.36} ${size * 0.53} ${size * 0.33}
                    Q ${size * 0.56} ${size * 0.42} ${size * 0.5} ${size * 0.48}`}
                fill="#ff6b35" 
                opacity="0.8" 
              />
            </g>
            
            <g className="animate-fireFlicker3">
              <ellipse 
                cx={size * 0.5} 
                cy={size * 0.43} 
                rx={size * 0.07} 
                ry={size * 0.09} 
                fill="#ffa500" 
                opacity="0.9" 
              />
            </g>
          </g>
        )}
      </g>
    );
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {type === 'hearth' && renderHearth()}
      {type === 'brazier' && renderBrazier()}
      {type === 'pit' && renderFirePit()}
    </g>
  );
});

export default FirePitSymbol;