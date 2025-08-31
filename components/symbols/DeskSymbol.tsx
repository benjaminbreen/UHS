/**
 * DeskSymbol.tsx - Culturally and historically accurate desk/writing surface
 * From ancient scribal tables to modern office desks
 */
import React from 'react';

interface DeskSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
}

const DeskSymbol: React.FC<DeskSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  opacity = 1.0 
}) => {
  // Determine desk style based on culture and era
  const getDeskStyle = () => {
    if (era < -2000) return 'stone_slab'; // Ancient
    if (era < 500) return 'scribal_table';
    if (era < 1500) return 'writing_desk';
    if (era < 1900) return 'bureau';
    return 'office_desk';
  };

  const style = getDeskStyle();

  // Get materials based on culture
  const getMaterials = () => {
    const zone = culturalZone?.toUpperCase();
    
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          wood: '#3a2418',
          woodLight: '#4a3428',
          ink: '#1a1a1a',
          paper: '#f4f0e8',
          accent: '#8b0000', // Red lacquer
          metal: '#cd7f32'   // Bronze
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          wood: '#5c3a24',
          woodLight: '#7a4e32',
          ink: '#0a0a0a',
          paper: '#f8f4e0',
          accent: '#d4af37', // Gold
          metal: '#c0c0c0'   // Silver
        };
      
      case 'SOUTH_ASIAN':
        return {
          wood: '#4a3020',
          woodLight: '#5a4030',
          ink: '#1a0a00',
          paper: '#fff8dc',
          accent: '#ff6347',
          metal: '#cd7f32'
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          wood: '#3e2818',
          woodLight: '#4e3828',
          ink: '#000000',
          paper: '#f5deb3',
          accent: '#daa520',
          metal: '#b87333'
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          wood: '#654321',
          woodLight: '#754531',
          ink: '#2a1a0a',
          paper: '#e8dcc0', // Bark paper
          accent: '#cd853f',
          metal: '#ffd700'
        };
      
      case 'OCEANIA':
        return {
          wood: '#4a3525',
          woodLight: '#5a4535',
          ink: '#1a1a1a',
          paper: '#f0e68c', // Tapa cloth color
          accent: '#ff8c00',
          metal: '#708090'
        };
      
      default: // EUROPEAN
        return {
          wood: '#3e2e1c',
          woodLight: '#5c452b',
          ink: '#000000',
          paper: '#faf8f3',
          accent: '#8b4513',
          metal: '#4a4a4a'
        };
    }
  };

  const materials = getMaterials();
  const rotation = { north: 180, south: 0, east: 270, west: 90 }[facing];

  const renderDesk = () => {
    switch (style) {
      case 'stone_slab':
        // Ancient stone writing surface
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Stone slab */}
            <rect x={size*0.1} y={size*0.3} width={size*0.8} height={size*0.5} fill="#8a8578" />
            <rect x={size*0.1} y={size*0.3} width={size*0.8} height={size*0.45} fill="#9a9588" />
            
            {/* Carved edges */}
            <rect x={size*0.1} y={size*0.3} width={size*0.8} height={2} fill="#7a7568" />
            <rect x={size*0.1} y={size*0.75} width={size*0.8} height={3} fill="#6a6558" />
            
            {/* Clay tablets or papyrus */}
            {culturalZone === 'MENA' ? (
              // Papyrus scroll
              <g>
                <ellipse cx={size*0.3} cy={size*0.5} rx={4} ry={3} fill={materials.paper} />
                <rect x={size*0.3} y={size*0.47} width={size*0.4} height={6} fill={materials.paper} />
                <ellipse cx={size*0.7} cy={size*0.5} rx={4} ry={3} fill={materials.paper} />
              </g>
            ) : (
              // Clay tablet
              <rect x={size*0.35} y={size*0.45} width={size*0.3} height={size*0.2} fill="#a08070" />
            )}
            
            {/* Stylus */}
            <line x1={size*0.2} y1={size*0.6} x2={size*0.25} y2={size*0.4} stroke="#4a4a4a" strokeWidth={1} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'scribal_table':
        // Ancient/Classical writing table
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Table top */}
            <rect x={size*0.15} y={size*0.25} width={size*0.7} height={size*0.4} fill={materials.wood} />
            <rect x={size*0.15} y={size*0.25} width={size*0.7} height={size*0.35} fill={materials.woodLight} />
            
            {/* Writing implements */}
            {culturalZone === 'EAST_ASIAN' ? (
              <g>
                {/* Ink stone */}
                <rect x={size*0.6} y={size*0.35} width={size*0.15} height={size*0.12} fill="#2a2a2a" />
                {/* Brushes */}
                <line x1={size*0.25} y1={size*0.45} x2={size*0.35} y2={size*0.35} stroke={materials.wood} strokeWidth={2} />
                <circle cx={size*0.35} cy={size*0.35} r={1} fill={materials.ink} />
                {/* Paper/silk */}
                <rect x={size*0.35} y={size*0.4} width={size*0.2} height={size*0.15} fill={materials.paper} />
              </g>
            ) : (
              <g>
                {/* Inkwell */}
                <circle cx={size*0.7} cy={size*0.4} r={3} fill="#3a3a3a" />
                <circle cx={size*0.7} cy={size*0.4} r={2} fill={materials.ink} />
                {/* Quill */}
                <line x1={size*0.25} y1={size*0.5} x2={size*0.35} y2={size*0.35} stroke="#f0f0f0" strokeWidth={1} />
                {/* Parchment */}
                <rect x={size*0.35} y={size*0.4} width={size*0.25} height={size*0.15} fill={materials.paper} />
              </g>
            )}
            
            {/* Legs */}
            <rect x={size*0.2} y={size*0.6} width={3} height={size*0.25} fill={materials.wood} />
            <rect x={size*0.77} y={size*0.6} width={3} height={size*0.25} fill={materials.wood} />
            
            {/* Cross support */}
            <rect x={size*0.2} y={size*0.7} width={size*0.6} height={2} fill={materials.wood} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.32} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'writing_desk':
        // Medieval/Renaissance desk
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Slanted writing surface */}
            <polygon 
              points={`${size*0.12},${size*0.35} ${size*0.88},${size*0.35} ${size*0.88},${size*0.55} ${size*0.12},${size*0.65}`}
              fill={materials.wood}
            />
            <polygon 
              points={`${size*0.12},${size*0.35} ${size*0.88},${size*0.35} ${size*0.88},${size*0.52} ${size*0.12},${size*0.62}`}
              fill={materials.woodLight}
            />
            
            {/* Book rest ledge */}
            <rect x={size*0.12} y={size*0.62} width={size*0.76} height={3} fill={materials.wood} />
            
            {/* Manuscript/book */}
            <rect x={size*0.35} y={size*0.42} width={size*0.3} height={size*0.15} fill="#8b4513" />
            <rect x={size*0.36} y={size*0.43} width={size*0.28} height={size*0.13} fill={materials.paper} />
            
            {/* Illumination detail */}
            {culturalZone === 'EUROPEAN' && era < 1500 && (
              <rect x={size*0.37} y={size*0.44} width={2} height={2} fill="#d4af37" opacity={0.7} />
            )}
            
            {/* Inkwell and quill */}
            <circle cx={size*0.75} cy={size*0.45} r={2} fill="#2a2a2a" />
            <line x1={size*0.72} y1={size*0.48} x2={size*0.68} y2={size*0.38} stroke="#f0f0f0" strokeWidth={0.8} />
            
            {/* Ornate legs */}
            <rect x={size*0.18} y={size*0.65} width={4} height={size*0.25} fill={materials.wood} />
            <rect x={size*0.78} y={size*0.65} width={4} height={size*0.25} fill={materials.wood} />
            
            {/* Carved details */}
            {era > 1000 && (
              <g opacity={0.3}>
                <circle cx={size*0.2} cy={size*0.85} r={1.5} fill={materials.accent} />
                <circle cx={size*0.8} cy={size*0.85} r={1.5} fill={materials.accent} />
              </g>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.92} rx={size*0.38} ry={size*0.12} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'bureau':
        // 17th-19th century writing bureau
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Main body */}
            <rect x={size*0.1} y={size*0.3} width={size*0.8} height={size*0.5} fill={materials.wood} />
            
            {/* Drop-down writing surface */}
            <rect x={size*0.15} y={size*0.35} width={size*0.7} height={size*0.25} fill={materials.woodLight} />
            
            {/* Drawers */}
            <rect x={size*0.15} y={size*0.65} width={size*0.3} height={size*0.1} fill={materials.wood} stroke={materials.accent} strokeWidth={0.5} />
            <rect x={size*0.55} y={size*0.65} width={size*0.3} height={size*0.1} fill={materials.wood} stroke={materials.accent} strokeWidth={0.5} />
            
            {/* Drawer handles */}
            <circle cx={size*0.3} cy={size*0.7} r={1} fill={materials.metal} />
            <circle cx={size*0.7} cy={size*0.7} r={1} fill={materials.metal} />
            
            {/* Writing implements */}
            <rect x={size*0.4} y={size*0.42} width={size*0.2} height={size*0.12} fill={materials.paper} />
            <circle cx={size*0.7} cy={size*0.45} r={2} fill="#3a3a3a" />
            <line x1={size*0.25} y1={size*0.5} x2={size*0.32} y2={size*0.4} stroke="#4a4a4a" strokeWidth={1} />
            
            {/* Ornate top decoration */}
            {culturalZone === 'EUROPEAN' && (
              <path d={`M ${size*0.1} ${size*0.3} Q ${size*0.5} ${size*0.25}, ${size*0.9} ${size*0.3}`} 
                    fill="none" stroke={materials.accent} strokeWidth={1} opacity={0.5} />
            )}
            
            {/* Legs */}
            <rect x={size*0.15} y={size*0.78} width={3} height={size*0.12} fill={materials.wood} />
            <rect x={size*0.82} y={size*0.78} width={3} height={size*0.12} fill={materials.wood} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.92} rx={size*0.4} ry={size*0.1} fill="black" opacity={0.35} />
          </g>
        );
      
      default: // office_desk
        // Modern desk
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Desktop */}
            <rect x={size*0.05} y={size*0.3} width={size*0.9} height={size*0.4} fill={era > 1980 ? '#4a4a4a' : materials.wood} />
            <rect x={size*0.05} y={size*0.3} width={size*0.9} height={size*0.35} fill={era > 1980 ? '#5a5a5a' : materials.woodLight} />
            
            {/* Computer/typewriter */}
            {era > 1980 ? (
              <g>
                {/* Monitor */}
                <rect x={size*0.4} y={size*0.35} width={size*0.2} height={size*0.15} fill="#2a2a2a" />
                <rect x={size*0.41} y={size*0.36} width={size*0.18} height={size*0.13} fill="#1a4a6a" />
                {/* Keyboard */}
                <rect x={size*0.35} y={size*0.52} width={size*0.3} height={size*0.08} fill="#3a3a3a" />
              </g>
            ) : (
              // Typewriter
              <rect x={size*0.35} y={size*0.4} width={size*0.3} height={size*0.15} fill="#2a2a2a" />
            )}
            
            {/* Papers */}
            <rect x={size*0.15} y={size*0.45} width={size*0.15} height={size*0.1} fill={materials.paper} />
            <rect x={size*0.7} y={size*0.42} width={size*0.12} height={size*0.08} fill={materials.paper} />
            
            {/* Metal legs */}
            <rect x={size*0.1} y={size*0.68} width={2} height={size*0.22} fill={materials.metal} />
            <rect x={size*0.88} y={size*0.68} width={2} height={size*0.22} fill={materials.metal} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.92} rx={size*0.42} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
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
        {renderDesk()}
      </g>
    </svg>
  );
};

export default DeskSymbol;