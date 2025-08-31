/**
 * WeaponRackSymbol.tsx - Culturally and historically accurate weapon storage
 * From stone age spears to modern firearms
 */
import React from 'react';

interface WeaponRackSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const WeaponRackSymbol: React.FC<WeaponRackSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  opacity = 1.0 
}) => {
  // Get rack and weapon materials
  const getMaterials = () => {
    return {
      wood: '#3e2e1c',
      woodDark: '#2e1e0c',
      metal: '#7a7a7a',
      bronze: '#cd7f32',
      iron: '#4a4a4a',
      steel: '#c0c0c0',
      leather: '#8b4513',
      rope: '#d2691e'
    };
  };

  const materials = getMaterials();

  const renderWeaponRack = () => {
    const zone = culturalZone?.toUpperCase();
    
    // Prehistoric (before -3000)
    if (era < -3000) {
      return (
        <g>
          {/* Simple wooden frame */}
          <rect x={size*0.15} y={size*0.1} width={3} height={size*0.8} fill={materials.wood} />
          <rect x={size*0.82} y={size*0.1} width={3} height={size*0.8} fill={materials.wood} />
          <rect x={size*0.15} y={size*0.25} width={size*0.7} height={3} fill={materials.wood} />
          
          {/* Stone spears */}
          <line x1={size*0.25} y1={size*0.2} x2={size*0.25} y2={size*0.7} stroke={materials.woodDark} strokeWidth={2} />
          <polygon points={`${size*0.25},${size*0.15} ${size*0.23},${size*0.2} ${size*0.27},${size*0.2}`} fill="#5a5a5a" />
          
          {/* Clubs */}
          <rect x={size*0.4} y={size*0.3} width={4} height={size*0.35} fill={materials.woodDark} />
          <ellipse cx={size*0.42} cy={size*0.28} rx={3} ry={4} fill={materials.wood} />
          
          {/* Stone axes */}
          <line x1={size*0.6} y1={size*0.25} x2={size*0.6} y2={size*0.65} stroke={materials.woodDark} strokeWidth={2} />
          <path d={`M ${size*0.55} ${size*0.22} L ${size*0.65} ${size*0.22} L ${size*0.62} ${size*0.18} L ${size*0.58} ${size*0.18} Z`} fill="#6a6a6a" />
          
          {/* Atlatl */}
          <line x1={size*0.75} y1={size*0.3} x2={size*0.75} y2={size*0.6} stroke={materials.woodDark} strokeWidth={1.5} />
          <circle cx={size*0.75} cy={size*0.58} r={1.5} fill={materials.woodDark} />
        </g>
      );
    }
    
    // Ancient (before 500 CE)
    if (era < 500) {
      switch (zone) {
        case 'EAST_ASIAN':
          return (
            <g>
              {/* Ornate wooden rack */}
              <rect x={size*0.1} y={size*0.15} width={size*0.8} height={4} fill="#4a2c1c" />
              <rect x={size*0.12} y={size*0.2} width={3} height={size*0.65} fill="#4a2c1c" />
              <rect x={size*0.85} y={size*0.2} width={3} height={size*0.65} fill="#4a2c1c" />
              
              {/* Dao (Chinese saber) */}
              <path d={`M ${size*0.25} ${size*0.25} Q ${size*0.28} ${size*0.5}, ${size*0.25} ${size*0.75}`} 
                    stroke={materials.steel} strokeWidth={2} fill="none" />
              <rect x={size*0.24} y={size*0.72} width={3} height={6} fill="#2a1a0a" />
              
              {/* Jian (straight sword) */}
              <line x1={size*0.4} y1={size*0.25} x2={size*0.4} y2={size*0.7} stroke={materials.steel} strokeWidth={2} />
              <rect x={size*0.38} y={size*0.68} width={4} height={2} fill={materials.bronze} />
              
              {/* Spear */}
              <line x1={size*0.55} y1={size*0.2} x2={size*0.55} y2={size*0.8} stroke="#3a2a1a" strokeWidth={2} />
              <polygon points={`${size*0.55},${size*0.15} ${size*0.53},${size*0.2} ${size*0.57},${size*0.2}`} fill={materials.steel} />
              
              {/* Bow */}
              <path d={`M ${size*0.7} ${size*0.25} Q ${size*0.75} ${size*0.5}, ${size*0.7} ${size*0.75}`} 
                    stroke="#4a3a2a" strokeWidth={2} fill="none" />
              <line x1={size*0.7} y1={size*0.25} x2={size*0.7} y2={size*0.75} stroke={materials.rope} strokeWidth={0.5} />
            </g>
          );
        
        case 'MENA':
        case 'NORTH_AFRICAN':
          return (
            <g>
              {/* Decorative metal rack */}
              <rect x={size*0.1} y={size*0.2} width={size*0.8} height={3} fill={materials.bronze} />
              <path d={`M ${size*0.1} ${size*0.23} L ${size*0.9} ${size*0.23}`} stroke="#8a6f3f" strokeWidth={1} />
              
              {/* Khopesh (curved sword) */}
              <path d={`M ${size*0.25} ${size*0.3} L ${size*0.25} ${size*0.6} Q ${size*0.28} ${size*0.65}, ${size*0.32} ${size*0.63}`} 
                    stroke={materials.bronze} strokeWidth={2.5} fill="none" />
              <circle cx={size*0.25} cy={size*0.68} r={2} fill="#5a3a2a" />
              
              {/* Scimitar */}
              <path d={`M ${size*0.45} ${size*0.3} Q ${size*0.48} ${size*0.5}, ${size*0.45} ${size*0.7}`} 
                    stroke={materials.steel} strokeWidth={2} fill="none" />
              <ellipse cx={size*0.45} cy={size*0.72} rx={2} ry={3} fill={materials.leather} />
              
              {/* Javelin */}
              <line x1={size*0.6} y1={size*0.25} x2={size*0.6} y2={size*0.75} stroke="#4a3a2a" strokeWidth={1.5} />
              <polygon points={`${size*0.6},${size*0.22} ${size*0.58},${size*0.25} ${size*0.62},${size*0.25}`} fill={materials.iron} />
              
              {/* Composite bow */}
              <path d={`M ${size*0.75} ${size*0.3} Q ${size*0.72} ${size*0.5}, ${size*0.75} ${size*0.7} Q ${size*0.78} ${size*0.5}, ${size*0.75} ${size*0.3}`} 
                    stroke="#3a2a1a" strokeWidth={2} fill="none" />
            </g>
          );
        
        default: // Greek/Roman
          return (
            <g>
              {/* Stone/marble rack */}
              <rect x={size*0.1} y={size*0.2} width={size*0.8} height={4} fill="#9a9588" />
              <rect x={size*0.15} y={size*0.24} width={3} height={size*0.6} fill="#8a8578" />
              <rect x={size*0.82} y={size*0.24} width={3} height={size*0.6} fill="#8a8578" />
              
              {/* Gladius (short sword) */}
              <rect x={size*0.24} y={size*0.3} width={3} height={size*0.4} fill={materials.iron} />
              <polygon points={`${size*0.255},${size*0.28} ${size*0.24},${size*0.3} ${size*0.27},${size*0.3}`} fill={materials.iron} />
              <ellipse cx={size*0.255} cy={size*0.72} rx={3} ry={2} fill={materials.leather} />
              
              {/* Pilum (javelin) */}
              <line x1={size*0.4} y1={size*0.25} x2={size*0.4} y2={size*0.8} stroke={materials.wood} strokeWidth={2} />
              <rect x={size*0.39} y={size*0.25} width={2} height={size*0.25} fill={materials.iron} />
              <polygon points={`${size*0.4},${size*0.22} ${size*0.38},${size*0.25} ${size*0.42},${size*0.25}`} fill={materials.iron} />
              
              {/* Hasta (spear) */}
              <line x1={size*0.55} y1={size*0.2} x2={size*0.55} y2={size*0.85} stroke={materials.wood} strokeWidth={2} />
              <polygon points={`${size*0.55},${size*0.17} ${size*0.53},${size*0.2} ${size*0.57},${size*0.2}`} fill={materials.bronze} />
              
              {/* Shield */}
              <ellipse cx={size*0.75} cy={size*0.5} rx={size*0.08} ry={size*0.15} fill="#8b4513" />
              <ellipse cx={size*0.75} cy={size*0.5} rx={size*0.06} ry={size*0.12} fill={materials.bronze} />
            </g>
          );
      }
    }
    
    // Medieval (500-1500)
    if (era < 1500) {
      switch (zone) {
        case 'EAST_ASIAN':
          return (
            <g>
              {/* Lacquered rack */}
              <rect x={size*0.08} y={size*0.18} width={size*0.84} height={4} fill="#8b0000" />
              <rect x={size*0.1} y={size*0.22} width={size*0.8} height={2} fill="#6b0000" />
              
              {/* Katana */}
              <path d={`M ${size*0.2} ${size*0.28} Q ${size*0.22} ${size*0.5}, ${size*0.2} ${size*0.72}`} 
                    stroke={materials.steel} strokeWidth={2} fill="none" />
              <rect x={size*0.18} y={size*0.7} width={4} height={8} fill="#2a1a0a" />
              <ellipse cx={size*0.2} cy={size*0.74} rx={3} ry={1.5} fill={materials.iron} />
              
              {/* Naginata (polearm) */}
              <line x1={size*0.35} y1={size*0.2} x2={size*0.35} y2={size*0.85} stroke="#3a2a1a" strokeWidth={2} />
              <path d={`M ${size*0.33} ${size*0.15} Q ${size*0.35} ${size*0.18}, ${size*0.37} ${size*0.2}`} 
                    stroke={materials.steel} strokeWidth={2} fill="none" />
              
              {/* Yumi (bow) */}
              <path d={`M ${size*0.5} ${size*0.25} Q ${size*0.48} ${size*0.45}, ${size*0.5} ${size*0.8}`} 
                    stroke="#4a3a2a" strokeWidth={2.5} fill="none" />
              
              {/* Tanto (dagger) */}
              <line x1={size*0.65} y1={size*0.4} x2={size*0.65} y2={size*0.6} stroke={materials.steel} strokeWidth={1.5} />
              <rect x={size*0.63} y={size*0.58} width={4} height={4} fill="#2a1a0a" />
              
              {/* Shuriken holder */}
              <circle cx={size*0.8} cy={size*0.4} r={3} fill="#3a3a3a" />
              <polygon points={`${size*0.8},${size*0.37} ${size*0.77},${size*0.42} ${size*0.83},${size*0.42} ${size*0.8},${size*0.37}`} fill={materials.iron} />
            </g>
          );
        
        default: // European
          return (
            <g>
              {/* Wooden rack with metal brackets */}
              <rect x={size*0.1} y={size*0.15} width={size*0.8} height={5} fill={materials.wood} />
              <rect x={size*0.12} y={size*0.17} width={2} height={2} fill={materials.iron} />
              <rect x={size*0.86} y={size*0.17} width={2} height={2} fill={materials.iron} />
              
              {/* Longsword */}
              <line x1={size*0.25} y1={size*0.22} x2={size*0.25} y2={size*0.75} stroke={materials.steel} strokeWidth={2.5} />
              <rect x={size*0.23} y={size*0.7} width={5} height={2} fill={materials.iron} />
              <circle cx={size*0.25} cy={size*0.77} r={2} fill={materials.leather} />
              
              {/* Mace */}
              <line x1={size*0.4} y1={size*0.35} x2={size*0.4} y2={size*0.65} stroke={materials.wood} strokeWidth={2} />
              <ellipse cx={size*0.4} cy={size*0.32} rx={4} ry={3} fill={materials.iron} />
              
              {/* Halberd */}
              <line x1={size*0.55} y1={size*0.15} x2={size*0.55} y2={size*0.85} stroke={materials.wood} strokeWidth={2} />
              <path d={`M ${size*0.52} ${size*0.12} L ${size*0.58} ${size*0.12} L ${size*0.58} ${size*0.18} L ${size*0.52} ${size*0.18} Z`} fill={materials.iron} />
              <path d={`M ${size*0.58} ${size*0.14} L ${size*0.62} ${size*0.16}`} stroke={materials.iron} strokeWidth={1.5} />
              
              {/* Crossbow */}
              <line x1={size*0.68} y1={size*0.45} x2={size*0.78} y2={size*0.45} stroke={materials.wood} strokeWidth={2} />
              <path d={`M ${size*0.73} ${size*0.4} Q ${size*0.68} ${size*0.45}, ${size*0.73} ${size*0.5}`} 
                    stroke={materials.steel} strokeWidth={1} fill="none" />
              <line x1={size*0.73} y1={size*0.45} x2={size*0.73} y2={size*0.55} stroke={materials.wood} strokeWidth={1.5} />
            </g>
          );
      }
    }
    
    // Early Modern (1500-1800)
    if (era < 1800) {
      return (
        <g>
          {/* Ornate rack */}
          <rect x={size*0.08} y={size*0.15} width={size*0.84} height={5} fill={materials.wood} />
          <path d={`M ${size*0.08} ${size*0.15} Q ${size*0.5} ${size*0.12}, ${size*0.92} ${size*0.15}`} 
                stroke={materials.woodDark} strokeWidth={1} fill="none" />
          
          {/* Rapier */}
          <line x1={size*0.2} y1={size*0.22} x2={size*0.2} y2={size*0.78} stroke={materials.steel} strokeWidth={1.5} />
          <ellipse cx={size*0.2} cy={size*0.75} rx={4} ry={2} fill={materials.iron} />
          <circle cx={size*0.2} cy={size*0.75} r={3} fill="none" stroke={materials.iron} strokeWidth={0.5} />
          
          {/* Musket */}
          <rect x={size*0.32} y={size*0.25} width={3} height={size*0.5} fill="#4a3a2a" />
          <rect x={size*0.31} y={size*0.25} width={5} height={size*0.15} fill={materials.iron} />
          <circle cx={size*0.335} cy={size*0.6} r={1} fill={materials.iron} />
          
          {/* Pistol */}
          <rect x={size*0.48} y={size*0.45} width={8} height={3} fill="#3a2a1a" />
          <rect x={size*0.48} y={size*0.45} width={5} height={2} fill={materials.iron} />
          <circle cx={size*0.54} cy={size*0.48} r={1.5} fill={materials.wood} />
          
          {/* Cavalry saber */}
          <path d={`M ${size*0.7} ${size*0.25} Q ${size*0.73} ${size*0.5}, ${size*0.7} ${size*0.75}`} 
                stroke={materials.steel} strokeWidth={2} fill="none" />
          <ellipse cx={size*0.7} cy={size*0.77} rx={3} ry={2} fill={materials.brass} />
          
          {/* Powder horn */}
          <path d={`M ${size*0.85} ${size*0.4} Q ${size*0.88} ${size*0.5}, ${size*0.85} ${size*0.6}`} 
                fill="#f5deb3" stroke="#d2b48c" strokeWidth={1} />
        </g>
      );
    }
    
    // Industrial/Modern (1800+)
    return (
      <g>
        {/* Metal rack */}
        <rect x={size*0.1} y={size*0.15} width={size*0.8} height={4} fill={materials.metal} />
        <rect x={size*0.12} y={size*0.19} width={3} height={size*0.6} fill="#5a5a5a" />
        <rect x={size*0.85} y={size*0.19} width={3} height={size*0.6} fill="#5a5a5a" />
        
        {/* Rifle */}
        <rect x={size*0.2} y={size*0.2} width={2} height={size*0.65} fill="#3a3a3a" />
        <rect x={size*0.19} y={size*0.2} width={4} height={size*0.12} fill={materials.metal} />
        <rect x={size*0.19} y={size*0.75} width={4} height={size*0.08} fill="#2a1a0a" />
        
        {/* Shotgun */}
        <rect x={size*0.35} y={size*0.25} width={2} height={size*0.55} fill="#4a3a2a" />
        <rect x={size*0.34} y={size*0.25} width={4} height={size*0.1} fill={materials.steel} />
        
        {/* Pistol */}
        <rect x={size*0.5} y={size*0.5} width={8} height={4} fill="#2a2a2a" />
        <rect x={size*0.5} y={size*0.5} width={6} height={3} fill={materials.metal} />
        
        {/* Combat knife */}
        <rect x={size*0.65} y={size*0.4} width={2} height={size*0.2} fill={materials.steel} />
        <rect x={size*0.64} y={size*0.58} width={4} height={5} fill="#1a1a1a" />
        
        {/* Ammunition box */}
        <rect x={size*0.75} y={size*0.65} width={size*0.12} height={size*0.08} fill="#5a5a3a" />
        <text x={size*0.81} y={size*0.7} fontSize={2} fill="#3a3a2a" textAnchor="middle">AMMO</text>
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
        {renderWeaponRack()}
        
        {/* Shadow */}
        <ellipse cx={size/2} cy={size*0.92} rx={size*0.4} ry={size*0.08} fill="black" opacity={0.3} />
      </g>
    </svg>
  );
};

export default WeaponRackSymbol;