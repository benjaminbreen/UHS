/**
 * TorchSymbol.tsx - Culturally and historically accurate torches and braziers
 * From ancient fire bowls to modern lighting across cultures
 */
import React from 'react';

interface TorchSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  type?: 'torch' | 'brazier';
  lit?: boolean;
  opacity?: number;
}

const TorchSymbol: React.FC<TorchSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  type = 'torch',
  lit = true,
  opacity = 1.0 
}) => {
  const zone = culturalZone?.toUpperCase();
  
  // Get materials based on culture
  const getMaterials = () => {
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          holder: '#3a2418',
          metal: '#cd7f32',
          flame: '#ff6347',
          flameLight: '#ffa500',
          paper: '#f4f0e8'
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          holder: '#daa520',
          metal: '#cd853f',
          flame: '#ff4500',
          flameLight: '#ff8c00',
          oil: '#2a2a2a'
        };
      
      case 'SOUTH_ASIAN':
        return {
          holder: '#cd853f',
          metal: '#b8860b',
          flame: '#ff6b35',
          flameLight: '#ffaa00',
          decoration: '#ff1493'
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          holder: '#8b4513',
          metal: '#b87333',
          flame: '#ff4500',
          flameLight: '#ff6347',
          pattern: '#daa520'
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          holder: '#654321',
          metal: '#cd7f32',
          flame: '#ff6347',
          flameLight: '#ffa500',
          feather: '#f0e68c'
        };
      
      case 'OCEANIA':
        return {
          holder: '#8b4513',
          metal: '#a0522d',
          flame: '#ff4500',
          flameLight: '#ff8c00',
          shell: '#fffaf0'
        };
      
      default: // EUROPEAN
        return {
          holder: '#4a4a4a',
          metal: '#2a2a2a',
          flame: '#ff6347',
          flameLight: '#ffd700',
          wood: '#8b4513'
        };
    }
  };
  
  const materials = getMaterials();
  
  const renderFlame = (cx: number, cy: number, scale: number = 1) => {
    if (!lit) return null;
    
    return (
      <g>
        {/* Outer flame */}
        <ellipse cx={cx} cy={cy} rx={size*0.04*scale} ry={size*0.08*scale} fill={materials.flame} opacity={0.8}>
          <animate attributeName="ry" 
                   values={`${size*0.08*scale};${size*0.1*scale};${size*0.08*scale}`} 
                   dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" 
                   values="0.8;0.6;0.8" 
                   dur="0.5s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Inner flame */}
        <ellipse cx={cx} cy={cy + size*0.01} rx={size*0.02*scale} ry={size*0.05*scale} fill={materials.flameLight} opacity={0.9}>
          <animate attributeName="ry" 
                   values={`${size*0.05*scale};${size*0.06*scale};${size*0.05*scale}`} 
                   dur="0.3s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Flame tip */}
        <path d={`M ${cx} ${cy - size*0.03*scale} l -${size*0.01*scale} ${size*0.02*scale} l ${size*0.02*scale} 0 Z`} 
              fill={materials.flameLight} opacity={0.7}>
          <animate attributeName="d" 
                   values={`M ${cx} ${cy - size*0.03*scale} l -${size*0.01*scale} ${size*0.02*scale} l ${size*0.02*scale} 0 Z;
                          M ${cx} ${cy - size*0.04*scale} l -${size*0.01*scale} ${size*0.02*scale} l ${size*0.02*scale} 0 Z;
                          M ${cx} ${cy - size*0.03*scale} l -${size*0.01*scale} ${size*0.02*scale} l ${size*0.02*scale} 0 Z`} 
                   dur="0.4s" repeatCount="indefinite" />
        </path>
        
        {/* Glow effect */}
        <circle cx={cx} cy={cy} r={size*0.12*scale} fill={materials.flameLight} opacity={0.15} />
      </g>
    );
  };
  
  const renderTorch = () => {
    if (type === 'brazier') {
      // Brazier/fire bowl
      if (zone === 'EAST_ASIAN') {
        // Asian lantern-style brazier
        return (
          <g>
            {/* Base */}
            <rect x={size*0.35} y={size*0.7} width={size*0.3} height={size*0.1} fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            
            {/* Bowl */}
            <ellipse cx={size/2} cy={size*0.65} rx={size*0.2} ry={size*0.08} fill={materials.metal} stroke="#8b5a2b" strokeWidth={0.5} />
            <path d={`M ${size*0.3} ${size*0.65} Q ${size*0.3} ${size*0.75} ${size*0.4} ${size*0.7} L ${size*0.6} ${size*0.7} Q ${size*0.7} ${size*0.75} ${size*0.7} ${size*0.65}`} 
                  fill={materials.metal} stroke="#8b5a2b" strokeWidth={0.5} />
            
            {/* Decorative legs */}
            <rect x={size*0.35} y={size*0.7} width={size*0.02} height={size*0.1} fill={materials.holder} />
            <rect x={size*0.63} y={size*0.7} width={size*0.02} height={size*0.1} fill={materials.holder} />
            
            {/* Paper/silk shade (if indoor) */}
            {era > 500 && (
              <g opacity={0.6}>
                <rect x={size*0.32} y={size*0.45} width={size*0.36} height={size*0.25} fill="none" stroke={materials.holder} strokeWidth={0.5} />
                <rect x={size*0.34} y={size*0.47} width={size*0.32} height={size*0.21} fill={materials.paper} opacity={0.4} />
                {/* Character */}
                <text x={size*0.5} y={size*0.58} fontSize={size*0.08} fill="#8b0000" textAnchor="middle">福</text>
              </g>
            )}
            
            {/* Fire */}
            {renderFlame(size/2, size*0.6, 1.2)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      } else if (zone === 'MENA' || zone === 'NORTH_AFRICAN') {
        // Middle Eastern oil lamp brazier
        return (
          <g>
            {/* Ornate base */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.18} ry={size*0.06} fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            
            {/* Bowl with geometric patterns */}
            <path d={`M ${size*0.28} ${size*0.6} Q ${size*0.28} ${size*0.72} ${size*0.38} ${size*0.75} L ${size*0.62} ${size*0.75} Q ${size*0.72} ${size*0.72} ${size*0.72} ${size*0.6}`} 
                  fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            <ellipse cx={size/2} cy={size*0.6} rx={size*0.22} ry={size*0.08} fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            
            {/* Geometric decoration */}
            <g opacity={0.6}>
              <circle cx={size*0.35} cy={size*0.68} r={size*0.02} fill="none" stroke={materials.metal} strokeWidth={0.3} />
              <circle cx={size*0.5} cy={size*0.7} r={size*0.02} fill="none" stroke={materials.metal} strokeWidth={0.3} />
              <circle cx={size*0.65} cy={size*0.68} r={size*0.02} fill="none" stroke={materials.metal} strokeWidth={0.3} />
            </g>
            
            {/* Oil pool */}
            <ellipse cx={size/2} cy={size*0.62} rx={size*0.15} ry={size*0.05} fill={materials.oil} opacity={0.5} />
            
            {/* Multiple flames */}
            {renderFlame(size*0.42, size*0.58, 0.8)}
            {renderFlame(size*0.5, size*0.56, 1)}
            {renderFlame(size*0.58, size*0.58, 0.8)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.28} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      } else {
        // European/default brazier
        return (
          <g>
            {/* Metal tripod legs */}
            <line x1={size*0.4} y1={size*0.65} x2={size*0.35} y2={size*0.8} stroke={materials.metal} strokeWidth={2} />
            <line x1={size*0.5} y1={size*0.65} x2={size*0.5} y2={size*0.8} stroke={materials.metal} strokeWidth={2} />
            <line x1={size*0.6} y1={size*0.65} x2={size*0.65} y2={size*0.8} stroke={materials.metal} strokeWidth={2} />
            
            {/* Fire bowl */}
            <ellipse cx={size/2} cy={size*0.6} rx={size*0.18} ry={size*0.08} fill={materials.metal} stroke="#1a1a1a" strokeWidth={0.5} />
            <path d={`M ${size*0.32} ${size*0.6} Q ${size*0.32} ${size*0.68} ${size*0.4} ${size*0.65} L ${size*0.6} ${size*0.65} Q ${size*0.68} ${size*0.68} ${size*0.68} ${size*0.6}`} 
                  fill="#3a3a3a" stroke="#1a1a1a" strokeWidth={0.5} />
            
            {/* Coal/wood */}
            <ellipse cx={size*0.45} cy={size*0.62} rx={size*0.03} ry={size*0.02} fill="#2a2a2a" />
            <ellipse cx={size*0.55} cy={size*0.61} rx={size*0.03} ry={size*0.02} fill="#2a2a2a" />
            <ellipse cx={size*0.5} cy={size*0.63} rx={size*0.04} ry={size*0.02} fill="#3a3a3a" />
            
            {/* Fire */}
            {renderFlame(size/2, size*0.55, 1.3)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.35} />
          </g>
        );
      }
    } else {
      // Wall torch
      if (zone === 'EAST_ASIAN') {
        // Paper lantern torch
        return (
          <g>
            {/* Wall bracket */}
            <rect x={size*0.48} y={size*0.5} width={size*0.04} height={size*0.2} fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            <path d={`M ${size*0.5} ${size*0.5} L ${size*0.45} ${size*0.45} L ${size*0.45} ${size*0.4}`} stroke={materials.holder} strokeWidth={2} fill="none" />
            
            {/* Lantern frame */}
            <rect x={size*0.38} y={size*0.25} width={size*0.24} height={size*0.25} fill="none" stroke={materials.holder} strokeWidth={1} />
            
            {/* Paper panels */}
            <rect x={size*0.4} y={size*0.27} width={size*0.2} height={size*0.21} fill={materials.paper} opacity={0.6} />
            
            {/* Top and bottom */}
            <rect x={size*0.36} y={size*0.23} width={size*0.28} height={size*0.04} fill={materials.holder} />
            <rect x={size*0.36} y={size*0.48} width={size*0.28} height={size*0.04} fill={materials.holder} />
            
            {/* Internal flame */}
            {lit && (
              <g opacity={0.7}>
                {renderFlame(size/2, size*0.38, 0.8)}
              </g>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.15} ry={size*0.05} fill="black" opacity={0.25} />
          </g>
        );
      } else if (zone === 'MENA' || zone === 'NORTH_AFRICAN') {
        // Islamic oil lamp
        return (
          <g>
            {/* Wall hook */}
            <path d={`M ${size*0.5} ${size*0.65} Q ${size*0.48} ${size*0.6} ${size*0.5} ${size*0.55}`} 
                  stroke={materials.metal} strokeWidth={2} fill="none" />
            
            {/* Lamp body */}
            <ellipse cx={size/2} cy={size*0.45} rx={size*0.12} ry={size*0.15} fill={materials.holder} stroke={materials.metal} strokeWidth={0.5} />
            
            {/* Spout */}
            <path d={`M ${size*0.62} ${size*0.42} L ${size*0.68} ${size*0.38} L ${size*0.65} ${size*0.4}`} fill={materials.holder} />
            
            {/* Handle */}
            <ellipse cx={size*0.35} cy={size*0.45} rx={size*0.04} ry={size*0.06} fill="none" stroke={materials.metal} strokeWidth={1} />
            
            {/* Decorative patterns */}
            <circle cx={size/2} cy={size*0.45} r={size*0.05} fill="none" stroke={materials.metal} strokeWidth={0.3} opacity={0.5} />
            <rect x={size*0.47} y={size*0.42} width={size*0.06} height={size*0.06} fill="none" stroke={materials.metal} strokeWidth={0.3} opacity={0.5} transform={`rotate(45 ${size*0.5} ${size*0.45})`} />
            
            {/* Wick flame */}
            {renderFlame(size*0.66, size*0.36, 0.7)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.18} ry={size*0.06} fill="black" opacity={0.25} />
          </g>
        );
      } else if (zone === 'SUB_SAHARAN_AFRICAN' || zone === 'OCEANIA') {
        // Tribal torch
        return (
          <g>
            {/* Wooden handle */}
            <rect x={size*0.48} y={size*0.45} width={size*0.04} height={size*0.35} fill={materials.holder} stroke="#654321" strokeWidth={0.5} />
            
            {/* Binding */}
            <g opacity={0.7}>
              <line x1={size*0.47} y1={size*0.5} x2={size*0.53} y2={size*0.52} stroke={materials.pattern} strokeWidth={1} />
              <line x1={size*0.53} y1={size*0.5} x2={size*0.47} y2={size*0.52} stroke={materials.pattern} strokeWidth={1} />
              <line x1={size*0.47} y1={size*0.54} x2={size*0.53} y2={size*0.56} stroke={materials.pattern} strokeWidth={1} />
              <line x1={size*0.53} y1={size*0.54} x2={size*0.47} y2={size*0.56} stroke={materials.pattern} strokeWidth={1} />
            </g>
            
            {/* Torch head - bundled reeds/grass */}
            <ellipse cx={size/2} cy={size*0.38} rx={size*0.08} ry={size*0.1} fill="#8b6914" stroke="#6b4914" strokeWidth={0.5} />
            <line x1={size*0.44} y1={size*0.38} x2={size*0.44} y2={size*0.45} stroke="#6b4914" strokeWidth={0.5} />
            <line x1={size*0.47} y1={size*0.38} x2={size*0.47} y2={size*0.45} stroke="#6b4914" strokeWidth={0.5} />
            <line x1={size*0.53} y1={size*0.38} x2={size*0.53} y2={size*0.45} stroke="#6b4914" strokeWidth={0.5} />
            <line x1={size*0.56} y1={size*0.38} x2={size*0.56} y2={size*0.45} stroke="#6b4914" strokeWidth={0.5} />
            
            {/* Decorative feathers/shells */}
            {zone === 'OCEANIA' ? (
              <g>
                <ellipse cx={size*0.42} cy={size*0.48} rx={size*0.02} ry={size*0.03} fill={materials.shell} opacity={0.8} />
                <ellipse cx={size*0.58} cy={size*0.48} rx={size*0.02} ry={size*0.03} fill={materials.shell} opacity={0.8} />
              </g>
            ) : (
              <g>
                <path d={`M ${size*0.42} ${size*0.48} L ${size*0.38} ${size*0.52}`} stroke="#f0e68c" strokeWidth={1} opacity={0.7} />
                <path d={`M ${size*0.58} ${size*0.48} L ${size*0.62} ${size*0.52}`} stroke="#f0e68c" strokeWidth={1} opacity={0.7} />
              </g>
            )}
            
            {/* Fire */}
            {renderFlame(size/2, size*0.32, 1)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.15} ry={size*0.05} fill="black" opacity={0.25} />
          </g>
        );
      } else {
        // European medieval torch
        return (
          <g>
            {/* Wall bracket */}
            <rect x={size*0.48} y={size*0.6} width={size*0.04} height={size*0.15} fill={materials.metal} stroke="#1a1a1a" strokeWidth={0.5} />
            <path d={`M ${size*0.5} ${size*0.6} L ${size*0.45} ${size*0.55} L ${size*0.45} ${size*0.5}`} stroke={materials.metal} strokeWidth={2} fill="none" />
            
            {/* Torch handle */}
            <rect x={size*0.47} y={size*0.35} width={size*0.06} height={size*0.25} fill={materials.wood} stroke="#654321" strokeWidth={0.5} />
            
            {/* Metal bands */}
            <rect x={size*0.46} y={size*0.4} width={size*0.08} height={size*0.02} fill={materials.metal} />
            <rect x={size*0.46} y={size*0.48} width={size*0.08} height={size*0.02} fill={materials.metal} />
            
            {/* Torch head - wrapped cloth/pitch */}
            <ellipse cx={size/2} cy={size*0.32} rx={size*0.07} ry={size*0.05} fill="#3a3a3a" />
            <ellipse cx={size/2} cy={size*0.3} rx={size*0.06} ry={size*0.04} fill="#4a4a4a" />
            
            {/* Fire */}
            {renderFlame(size/2, size*0.25, 1.1)}
            
            {/* Dripping pitch (if lit) */}
            {lit && (
              <g opacity={0.5}>
                <ellipse cx={size*0.47} cy={size*0.35} rx={size*0.005} ry={size*0.01} fill="#2a2a2a" />
                <ellipse cx={size*0.53} cy={size*0.36} rx={size*0.005} ry={size*0.01} fill="#2a2a2a" />
              </g>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.15} ry={size*0.05} fill="black" opacity={0.25} />
          </g>
        );
      }
    }
  };
  
  return (
    <svg 
      x={x} 
      y={y} 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g opacity={opacity}>
        {renderTorch()}
      </g>
    </svg>
  );
};

export default TorchSymbol;