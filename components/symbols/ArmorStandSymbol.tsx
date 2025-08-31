/**
 * ArmorStandSymbol.tsx - Culturally and historically accurate armor displays
 * From ancient bronze armor to modern tactical gear
 */
import React from 'react';

interface ArmorStandSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const ArmorStandSymbol: React.FC<ArmorStandSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  opacity = 1.0 
}) => {
  const getMaterials = () => {
    return {
      wood: '#3e2e1c',
      bronze: '#cd7f32',
      iron: '#4a4a4a',
      steel: '#c0c0c0',
      leather: '#8b4513',
      cloth: '#d2b48c',
      gold: '#ffd700',
      lacquer: '#8b0000',
      chainmail: '#9a9a9a',
      scale: '#7a7a7a'
    };
  };

  const materials = getMaterials();

  const renderArmorStand = () => {
    const zone = culturalZone?.toUpperCase();
    
    // Prehistoric - simple hide/leather armor
    if (era < -3000) {
      return (
        <g>
          {/* Wooden stand */}
          <rect x={size*0.48} y={size*0.2} width={4} height={size*0.7} fill={materials.wood} />
          <rect x={size*0.35} y={size*0.85} width={size*0.3} height={4} fill={materials.wood} />
          
          {/* Hide armor */}
          <ellipse cx={size/2} cy={size*0.35} rx={size*0.18} ry={size*0.12} fill="#6b4423" />
          <rect x={size*0.35} y={size*0.35} width={size*0.3} height={size*0.25} fill="#6b4423" />
          
          {/* Bone decorations */}
          <circle cx={size*0.42} cy={size*0.4} r={1.5} fill="#f5f5dc" />
          <circle cx={size*0.58} cy={size*0.4} r={1.5} fill="#f5f5dc" />
          <circle cx={size*0.5} cy={size*0.48} r={1.5} fill="#f5f5dc" />
          
          {/* Fur trim */}
          <rect x={size*0.35} y={size*0.35} width={size*0.3} height={3} fill="#3a2a1a" opacity={0.6} />
        </g>
      );
    }
    
    // Ancient period
    if (era < 500) {
      switch (zone) {
        case 'EAST_ASIAN':
          // Ancient Chinese lamellar armor
          return (
            <g>
              {/* Stand */}
              <rect x={size*0.48} y={size*0.15} width={4} height={size*0.75} fill="#4a2c1c" />
              <rect x={size*0.35} y={size*0.85} width={size*0.3} height={3} fill="#4a2c1c" />
              
              {/* Helmet */}
              <path d={`M ${size*0.4} ${size*0.2} Q ${size*0.5} ${size*0.15}, ${size*0.6} ${size*0.2} L ${size*0.6} ${size*0.25} L ${size*0.4} ${size*0.25} Z`} 
                    fill={materials.bronze} />
              <rect x={size*0.48} y={size*0.13} width={4} height={8} fill="#ff0000" opacity={0.7} />
              
              {/* Lamellar plates */}
              <rect x={size*0.35} y={size*0.3} width={size*0.3} height={size*0.28} fill={materials.bronze} />
              {/* Plate rows */}
              {[0.32, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56].map(yPos => (
                <g key={yPos}>
                  {[0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64].map(xPos => (
                    <rect key={xPos} x={size*xPos} y={size*yPos} width={3} height={3} 
                          fill={materials.bronze} stroke="#9a6f32" strokeWidth={0.3} />
                  ))}
                </g>
              ))}
              
              {/* Shoulder guards */}
              <ellipse cx={size*0.32} cy={size*0.32} rx={4} ry={6} fill={materials.bronze} />
              <ellipse cx={size*0.68} cy={size*0.32} rx={4} ry={6} fill={materials.bronze} />
              
              {/* Tassets (thigh guards) */}
              <rect x={size*0.38} y={size*0.58} width={size*0.1} height={size*0.12} fill={materials.leather} />
              <rect x={size*0.52} y={size*0.58} width={size*0.1} height={size*0.12} fill={materials.leather} />
            </g>
          );
        
        case 'MENA':
        case 'NORTH_AFRICAN':
          // Ancient Middle Eastern scale armor
          return (
            <g>
              {/* Stand */}
              <rect x={size*0.48} y={size*0.18} width={4} height={size*0.72} fill={materials.wood} />
              <ellipse cx={size/2} cy={size*0.88} rx={size*0.15} ry={3} fill={materials.wood} />
              
              {/* Conical helmet */}
              <polygon points={`${size*0.5},${size*0.15} ${size*0.42},${size*0.23} ${size*0.58},${size*0.23}`} 
                       fill={materials.bronze} />
              <ellipse cx={size/2} cy={size*0.23} rx={8} ry={2} fill={materials.bronze} />
              
              {/* Scale mail */}
              <rect x={size*0.35} y={size*0.28} width={size*0.3} height={size*0.3} fill={materials.scale} />
              {/* Scale pattern */}
              {[0.29, 0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.53, 0.56].map(yPos => (
                <g key={yPos}>
                  {[0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.57, 0.6, 0.63].map(xPos => (
                    <ellipse key={xPos} cx={size*xPos} cy={size*yPos} rx={1.5} ry={2} 
                            fill={materials.bronze} stroke="#8a5f2f" strokeWidth={0.3} />
                  ))}
                </g>
              ))}
              
              {/* Arm guards */}
              <rect x={size*0.3} y={size*0.32} width={4} height={size*0.15} fill={materials.leather} />
              <rect x={size*0.66} y={size*0.32} width={4} height={size*0.15} fill={materials.leather} />
              
              {/* Decorative belt */}
              <rect x={size*0.35} y={size*0.5} width={size*0.3} height={3} fill={materials.gold} opacity={0.7} />
            </g>
          );
        
        default: // Greek/Roman
          // Classical bronze/iron armor
          return (
            <g>
              {/* Stand */}
              <rect x={size*0.48} y={size*0.15} width={4} height={size*0.75} fill={materials.wood} />
              <rect x={size*0.35} y={size*0.85} width={size*0.3} height={4} fill={materials.wood} />
              
              {/* Corinthian helmet */}
              <path d={`M ${size*0.42} ${size*0.18} Q ${size*0.5} ${size*0.14}, ${size*0.58} ${size*0.18} L ${size*0.58} ${size*0.26} L ${size*0.42} ${size*0.26} Z`} 
                    fill={materials.bronze} />
              <rect x={size*0.45} y={size*0.2} width={size*0.1} height={4} fill="none" stroke="#2a2a2a" strokeWidth={1} />
              <path d={`M ${size*0.48} ${size*0.14} Q ${size*0.5} ${size*0.12}, ${size*0.52} ${size*0.14}`} 
                    stroke="#ff0000" strokeWidth={2} fill="none" />
              
              {/* Muscle cuirass */}
              <ellipse cx={size/2} cy={size*0.35} rx={size*0.17} ry={size*0.08} fill={materials.bronze} />
              <path d={`M ${size*0.33} ${size*0.35} Q ${size*0.35} ${size*0.45}, ${size*0.33} ${size*0.55} L ${size*0.67} ${size*0.55} Q ${size*0.65} ${size*0.45}, ${size*0.67} ${size*0.35}`} 
                    fill={materials.bronze} />
              {/* Muscle definition */}
              <ellipse cx={size*0.43} cy={size*0.38} rx={3} ry={4} fill="none" stroke="#9a6f32" strokeWidth={0.5} />
              <ellipse cx={size*0.57} cy={size*0.38} rx={3} ry={4} fill="none" stroke="#9a6f32" strokeWidth={0.5} />
              <line x1={size/2} y1={size*0.35} x2={size/2} y2={size*0.5} stroke="#9a6f32" strokeWidth={0.5} />
              
              {/* Pteruges (leather strips) */}
              {[0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65].map(xPos => (
                <rect key={xPos} x={size*xPos-1} y={size*0.55} width={2} height={size*0.08} fill={materials.leather} />
              ))}
              
              {/* Greaves (leg armor) */}
              <rect x={size*0.42} y={size*0.65} width={4} height={size*0.15} fill={materials.bronze} />
              <rect x={size*0.54} y={size*0.65} width={4} height={size*0.15} fill={materials.bronze} />
            </g>
          );
      }
    }
    
    // Medieval period
    if (era < 1500) {
      switch (zone) {
        case 'EAST_ASIAN':
          // Samurai armor
          return (
            <g>
              {/* Stand */}
              <rect x={size*0.48} y={size*0.12} width={4} height={size*0.78} fill="#4a2c1c" />
              <rect x={size*0.3} y={size*0.85} width={size*0.4} height={3} fill="#4a2c1c" />
              
              {/* Kabuto (helmet) */}
              <ellipse cx={size/2} cy={size*0.18} rx={size*0.12} ry={size*0.06} fill="#3a3a3a" />
              <path d={`M ${size*0.35} ${size*0.2} Q ${size*0.3} ${size*0.25}, ${size*0.35} ${size*0.28}`} 
                    stroke={materials.iron} strokeWidth={1.5} fill="none" />
              <path d={`M ${size*0.65} ${size*0.2} Q ${size*0.7} ${size*0.25}, ${size*0.65} ${size*0.28}`} 
                    stroke={materials.iron} strokeWidth={1.5} fill="none" />
              {/* Horns (maedate) */}
              <path d={`M ${size*0.45} ${size*0.15} L ${size*0.42} ${size*0.1}`} stroke={materials.gold} strokeWidth={1} />
              <path d={`M ${size*0.55} ${size*0.15} L ${size*0.58} ${size*0.1}`} stroke={materials.gold} strokeWidth={1} />
              
              {/* Do (chest armor) */}
              <rect x={size*0.32} y={size*0.28} width={size*0.36} height={size*0.25} fill={materials.lacquer} />
              {/* Lacing pattern */}
              {[0.34, 0.38, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.66].map(xPos => (
                <line key={xPos} x1={size*xPos} y1={size*0.28} x2={size*xPos} y2={size*0.53} 
                      stroke="#4a0000" strokeWidth={0.5} />
              ))}
              
              {/* Sode (shoulder guards) */}
              <rect x={size*0.25} y={size*0.3} width={size*0.08} height={size*0.18} fill={materials.lacquer} />
              <rect x={size*0.67} y={size*0.3} width={size*0.08} height={size*0.18} fill={materials.lacquer} />
              
              {/* Kusazuri (tassets) */}
              <polygon points={`${size*0.35},${size*0.53} ${size*0.38},${size*0.65} ${size*0.32},${size*0.65}`} fill={materials.lacquer} />
              <polygon points={`${size*0.45},${size*0.53} ${size*0.48},${size*0.65} ${size*0.42},${size*0.65}`} fill={materials.lacquer} />
              <polygon points={`${size*0.55},${size*0.53} ${size*0.58},${size*0.65} ${size*0.52},${size*0.65}`} fill={materials.lacquer} />
              <polygon points={`${size*0.65},${size*0.53} ${size*0.68},${size*0.65} ${size*0.62},${size*0.65}`} fill={materials.lacquer} />
              
              {/* Suneate (shin guards) */}
              <rect x={size*0.42} y={size*0.68} width={4} height={size*0.12} fill="#3a3a3a" />
              <rect x={size*0.54} y={size*0.68} width={4} height={size*0.12} fill="#3a3a3a" />
            </g>
          );
        
        default: // European
          // Full plate armor
          return (
            <g>
              {/* Stand */}
              <rect x={size*0.48} y={size*0.1} width={4} height={size*0.8} fill={materials.wood} />
              <rect x={size*0.35} y={size*0.85} width={size*0.3} height={4} fill={materials.wood} />
              
              {/* Great helm */}
              <rect x={size*0.42} y={size*0.13} width={size*0.16} height={size*0.12} fill={materials.steel} />
              <rect x={size*0.44} y={size*0.17} width={3} height={2} fill="#1a1a1a" />
              <rect x={size*0.53} y={size*0.17} width={3} height={2} fill="#1a1a1a" />
              <line x1={size*0.42} y1={size*0.2} x2={size*0.58} y2={size*0.2} stroke="#1a1a1a" strokeWidth={0.5} />
              
              {/* Breastplate */}
              <path d={`M ${size*0.35} ${size*0.28} Q ${size*0.5} ${size*0.25}, ${size*0.65} ${size*0.28} L ${size*0.65} ${size*0.5} Q ${size*0.5} ${size*0.52}, ${size*0.35} ${size*0.5} Z`} 
                    fill={materials.steel} />
              <line x1={size/2} y1={size*0.28} x2={size/2} y2={size*0.5} stroke="#a0a0a0" strokeWidth={0.5} />
              
              {/* Pauldrons */}
              <ellipse cx={size*0.3} cy={size*0.3} rx={5} ry={7} fill={materials.steel} />
              <ellipse cx={size*0.7} cy={size*0.3} rx={5} ry={7} fill={materials.steel} />
              
              {/* Faulds (hip protection) */}
              <rect x={size*0.35} y={size*0.5} width={size*0.3} height={4} fill={materials.steel} />
              {[0.36, 0.42, 0.48, 0.54, 0.6].map(xPos => (
                <rect key={xPos} x={size*xPos} y={size*0.54} width={4} height={6} fill={materials.steel} stroke="#a0a0a0" strokeWidth={0.3} />
              ))}
              
              {/* Gauntlets */}
              <ellipse cx={size*0.28} cy={size*0.45} rx={3} ry={4} fill={materials.steel} />
              <ellipse cx={size*0.72} cy={size*0.45} rx={3} ry={4} fill={materials.steel} />
              
              {/* Sabatons (foot armor) */}
              <polygon points={`${size*0.42},${size*0.8} ${size*0.46},${size*0.8} ${size*0.46},${size*0.84} ${size*0.42},${size*0.83}`} fill={materials.steel} />
              <polygon points={`${size*0.54},${size*0.8} ${size*0.58},${size*0.8} ${size*0.58},${size*0.83} ${size*0.54},${size*0.84}`} fill={materials.steel} />
            </g>
          );
      }
    }
    
    // Early Modern period (1500-1800)
    if (era < 1800) {
      return (
        <g>
          {/* Stand */}
          <rect x={size*0.48} y={size*0.12} width={4} height={size*0.78} fill={materials.wood} />
          <rect x={size*0.35} y={size*0.85} width={size*0.3} height={4} fill={materials.wood} />
          
          {/* Morion helmet */}
          <path d={`M ${size*0.38} ${size*0.18} Q ${size*0.5} ${size*0.14}, ${size*0.62} ${size*0.18}`} 
                stroke={materials.steel} strokeWidth={2} fill={materials.steel} />
          <ellipse cx={size/2} cy={size*0.18} rx={size*0.12} ry={3} fill={materials.steel} />
          
          {/* Cuirass with decorative etching */}
          <path d={`M ${size*0.35} ${size*0.28} L ${size*0.65} ${size*0.28} L ${size*0.63} ${size*0.48} L ${size*0.37} ${size*0.48} Z`} 
                fill={materials.steel} />
          <circle cx={size/2} cy={size*0.38} r={4} fill="none" stroke="#808080" strokeWidth={0.5} />
          <path d={`M ${size*0.45} ${size*0.35} L ${size*0.55} ${size*0.35} L ${size*0.55} ${size*0.41} L ${size*0.45} ${size*0.41} Z`} 
                fill="none" stroke="#808080" strokeWidth={0.3} />
          
          {/* Buff coat (leather) */}
          <rect x={size*0.32} y={size*0.48} width={size*0.36} height={size*0.2} fill={materials.leather} />
          <rect x={size*0.28} y={size*0.48} width={size*0.08} height={size*0.15} fill={materials.leather} />
          <rect x={size*0.64} y={size*0.48} width={size*0.08} height={size*0.15} fill={materials.leather} />
          
          {/* Sword belt */}
          <rect x={size*0.32} y={size*0.52} width={size*0.36} height={2} fill="#2a1a0a" />
          <rect x={size*0.48} y={size*0.51} width={4} height={3} fill={materials.bronze} />
        </g>
      );
    }
    
    // Modern period (1800+)
    return (
      <g>
        {/* Stand */}
        <rect x={size*0.48} y={size*0.15} width={4} height={size*0.75} fill={materials.iron} />
        <ellipse cx={size/2} cy={size*0.88} rx={size*0.15} ry={3} fill={materials.iron} />
        
        {/* Modern helmet */}
        <path d={`M ${size*0.42} ${size*0.16} Q ${size*0.5} ${size*0.13}, ${size*0.58} ${size*0.16} L ${size*0.58} ${size*0.22} L ${size*0.42} ${size*0.22} Z`} 
              fill="#4a5a3a" />
        <rect x={size*0.44} y={size*0.22} width={size*0.12} height={2} fill="#3a4a2a" />
        
        {/* Tactical vest */}
        <rect x={size*0.33} y={size*0.28} width={size*0.34} height={size*0.28} fill="#3a4a3a" />
        {/* MOLLE webbing */}
        {[0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65].map(xPos => (
          <g key={xPos}>
            <line x1={size*xPos} y1={size*0.3} x2={size*xPos} y2={size*0.54} stroke="#2a3a2a" strokeWidth={0.5} />
            <line x1={size*(xPos-0.02)} y1={size*0.35} x2={size*(xPos+0.02)} y2={size*0.35} stroke="#2a3a2a" strokeWidth={0.5} />
            <line x1={size*(xPos-0.02)} y1={size*0.42} x2={size*(xPos+0.02)} y2={size*0.42} stroke="#2a3a2a" strokeWidth={0.5} />
            <line x1={size*(xPos-0.02)} y1={size*0.49} x2={size*(xPos+0.02)} y2={size*0.49} stroke="#2a3a2a" strokeWidth={0.5} />
          </g>
        ))}
        
        {/* Magazine pouches */}
        <rect x={size*0.38} y={size*0.45} width={4} height={6} fill="#2a3a2a" />
        <rect x={size*0.46} y={size*0.45} width={4} height={6} fill="#2a3a2a" />
        <rect x={size*0.54} y={size*0.45} width={4} height={6} fill="#2a3a2a" />
        
        {/* Knee pads */}
        <ellipse cx={size*0.43} cy={size*0.7} rx={3} ry={4} fill="#3a3a3a" />
        <ellipse cx={size*0.57} cy={size*0.7} rx={3} ry={4} fill="#3a3a3a" />
        
        {/* Combat boots */}
        <rect x={size*0.41} y={size*0.78} width={6} height={8} fill="#2a2a2a" />
        <rect x={size*0.53} y={size*0.78} width={6} height={8} fill="#2a2a2a" />
      </g>
    );
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
        {renderArmorStand()}
        
        {/* Shadow */}
        <ellipse cx={size/2} cy={size*0.92} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.3} />
      </g>
    </svg>
  );
};

export default ArmorStandSymbol;