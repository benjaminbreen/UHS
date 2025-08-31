/**
 * CabinetSymbol.tsx - Culturally and historically accurate storage furniture
 * From ancient chests to modern cabinets across all cultures
 */
import React from 'react';

interface CabinetSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
}

const CabinetSymbol: React.FC<CabinetSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  opacity = 1.0 
}) => {
  // Determine cabinet style based on culture and era
  const getCabinetStyle = () => {
    if (era < -1000) return 'storage_jar';
    if (era < 500) return 'chest';
    if (era < 1200) return 'armoire';
    if (era < 1700) return 'cabinet';
    if (era < 1900) return 'dresser';
    return 'modern_cabinet';
  };
  
  const style = getCabinetStyle();
  const zone = culturalZone?.toUpperCase();
  const rotation = { north: 180, south: 0, east: 270, west: 90 }[facing];
  
  // Get materials based on culture
  const getMaterials = () => {
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          wood: '#3a2418',
          woodLight: '#4a3428',
          woodDark: '#2a1408',
          metal: '#cd7f32',
          lacquer: '#8b0000',
          paper: '#f4f0e8'
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          wood: '#5c3a24',
          woodLight: '#7a4e32',
          woodDark: '#4c2a14',
          metal: '#daa520',
          inlay: '#fffaf0',
          fabric: '#8b4513'
        };
      
      case 'SOUTH_ASIAN':
        return {
          wood: '#4a3020',
          woodLight: '#5a4030',
          woodDark: '#3a2010',
          metal: '#cd853f',
          carving: '#8b6f47',
          textile: '#ff6b35'
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          wood: '#3e2818',
          woodLight: '#4e3828',
          woodDark: '#2e1808',
          metal: '#b87333',
          pattern: '#daa520',
          weave: '#d2691e'
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          wood: '#654321',
          woodLight: '#754531',
          woodDark: '#553211',
          metal: '#ffd700',
          paint: '#ff4500',
          textile: '#00ff7f'
        };
      
      case 'OCEANIA':
        return {
          wood: '#4a3525',
          woodLight: '#5a4535',
          woodDark: '#3a2515',
          shell: '#fffaf0',
          rope: '#d2b48c',
          pattern: '#ff8c00'
        };
      
      default: // EUROPEAN
        return {
          wood: '#3e2e1c',
          woodLight: '#5c452b',
          woodDark: '#2e1e0c',
          metal: '#4a4a4a',
          brass: '#b8860b',
          fabric: '#8b4513'
        };
    }
  };
  
  const materials = getMaterials();
  
  const renderCabinet = () => {
    switch (style) {
      case 'storage_jar':
        // Ancient storage vessels
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Large ceramic jar */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.25} ry={size*0.15} fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            <rect x={size*0.25} y={size*0.45} width={size*0.5} height={size*0.3} fill="#8b7355" />
            <ellipse cx={size/2} cy={size*0.45} rx={size*0.25} ry={size*0.1} fill="#9b8365" stroke="#7b6355" strokeWidth={0.5} />
            <ellipse cx={size/2} cy={size*0.35} rx={size*0.18} ry={size*0.08} fill="#8b7355" stroke="#6b5345" strokeWidth={0.5} />
            
            {/* Lid */}
            <ellipse cx={size/2} cy={size*0.35} rx={size*0.2} ry={size*0.08} fill="#7b6345" stroke="#5b4335" strokeWidth={0.5} />
            <circle cx={size/2} cy={size*0.32} r={size*0.03} fill="#6b5335" />
            
            {/* Decorative bands */}
            <rect x={size*0.25} y={size*0.5} width={size*0.5} height={2} fill="#6b5345" />
            <rect x={size*0.25} y={size*0.65} width={size*0.5} height={2} fill="#6b5345" />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.28} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'chest':
        // Medieval chest
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Chest body */}
            <rect x={size*0.2} y={size*0.5} width={size*0.6} height={size*0.3} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1} />
            
            {/* Lid */}
            <rect x={size*0.18} y={size*0.45} width={size*0.64} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
            
            {/* Metal reinforcements */}
            <rect x={size*0.18} y={size*0.48} width={size*0.64} height={2} fill={materials.metal} />
            <rect x={size*0.18} y={size*0.75} width={size*0.64} height={2} fill={materials.metal} />
            <rect x={size*0.25} y={size*0.45} width={2} height={size*0.35} fill={materials.metal} />
            <rect x={size*0.73} y={size*0.45} width={2} height={size*0.35} fill={materials.metal} />
            
            {/* Lock */}
            <rect x={size*0.47} y={size*0.6} width={size*0.06} height={size*0.08} fill={materials.metal} stroke="#2a2a2a" strokeWidth={0.5} />
            <circle cx={size/2} cy={size*0.65} r={size*0.015} fill="#2a2a2a" />
            
            {/* Handles */}
            <circle cx={size*0.3} cy={size*0.6} r={size*0.025} fill="none" stroke={materials.metal} strokeWidth={2} />
            <circle cx={size*0.7} cy={size*0.6} r={size*0.025} fill="none" stroke={materials.metal} strokeWidth={2} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'armoire':
        // Large wardrobe
        if (zone === 'EAST_ASIAN') {
          // Tansu chest
          return (
            <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
              {/* Main body */}
              <rect x={size*0.15} y={size*0.25} width={size*0.7} height={size*0.55} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1} />
              
              {/* Drawers */}
              <rect x={size*0.2} y={size*0.3} width={size*0.6} height={size*0.12} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.2} y={size*0.44} width={size*0.28} height={size*0.12} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.52} y={size*0.44} width={size*0.28} height={size*0.12} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.2} y={size*0.58} width={size*0.6} height={size*0.12} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Side cabinet */}
              <rect x={size*0.2} y={size*0.72} width={size*0.25} height={size*0.06} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Metal handles */}
              <circle cx={size*0.5} cy={size*0.36} r={size*0.015} fill={materials.metal} />
              <circle cx={size*0.34} cy={size*0.5} r={size*0.015} fill={materials.metal} />
              <circle cx={size*0.66} cy={size*0.5} r={size*0.015} fill={materials.metal} />
              <circle cx={size*0.5} cy={size*0.64} r={size*0.015} fill={materials.metal} />
              <rect x={size*0.31} y={size*0.74} width={size*0.03} height={size*0.01} fill={materials.metal} />
              
              {/* Decorative metal corners */}
              <path d={`M ${size*0.15} ${size*0.25} L ${size*0.2} ${size*0.25} L ${size*0.15} ${size*0.3}`} fill={materials.metal} />
              <path d={`M ${size*0.85} ${size*0.25} L ${size*0.8} ${size*0.25} L ${size*0.85} ${size*0.3}`} fill={materials.metal} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.85} rx={size*0.38} ry={size*0.08} fill="black" opacity={0.35} />
            </g>
          );
        } else if (zone === 'MENA' || zone === 'NORTH_AFRICAN') {
          // Moroccan/Middle Eastern cabinet
          return (
            <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
              {/* Main structure */}
              <rect x={size*0.2} y={size*0.2} width={size*0.6} height={size*0.6} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1} />
              
              {/* Carved arch doors */}
              <path d={`M ${size*0.25} ${size*0.75} L ${size*0.25} ${size*0.35} Q ${size*0.35} ${size*0.25} ${size*0.45} ${size*0.35} L ${size*0.45} ${size*0.75}`} 
                    fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <path d={`M ${size*0.55} ${size*0.75} L ${size*0.55} ${size*0.35} Q ${size*0.65} ${size*0.25} ${size*0.75} ${size*0.35} L ${size*0.75} ${size*0.75}`} 
                    fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Geometric inlay pattern */}
              <g opacity={0.7}>
                <circle cx={size*0.35} cy={size*0.5} r={size*0.04} fill="none" stroke={materials.inlay} strokeWidth={0.5} />
                <rect x={size*0.31} y={size*0.46} width={size*0.08} height={size*0.08} fill="none" stroke={materials.inlay} strokeWidth={0.5} transform={`rotate(45 ${size*0.35} ${size*0.5})`} />
                <circle cx={size*0.65} cy={size*0.5} r={size*0.04} fill="none" stroke={materials.inlay} strokeWidth={0.5} />
                <rect x={size*0.61} y={size*0.46} width={size*0.08} height={size*0.08} fill="none" stroke={materials.inlay} strokeWidth={0.5} transform={`rotate(45 ${size*0.65} ${size*0.5})`} />
              </g>
              
              {/* Ornate handles */}
              <circle cx={size*0.42} cy={size*0.55} r={size*0.02} fill={materials.metal} stroke="#b8860b" strokeWidth={0.5} />
              <circle cx={size*0.58} cy={size*0.55} r={size*0.02} fill={materials.metal} stroke="#b8860b" strokeWidth={0.5} />
              
              {/* Base */}
              <rect x={size*0.18} y={size*0.75} width={size*0.64} height={size*0.05} fill={materials.woodDark} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.35} />
            </g>
          );
        } else {
          // European armoire
          return (
            <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
              {/* Main cabinet */}
              <rect x={size*0.15} y={size*0.15} width={size*0.7} height={size*0.65} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1.5} />
              
              {/* Crown molding */}
              <rect x={size*0.12} y={size*0.12} width={size*0.76} height={size*0.05} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Doors */}
              <rect x={size*0.18} y={size*0.25} width={size*0.3} height={size*0.45} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.52} y={size*0.25} width={size*0.3} height={size*0.45} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Door panels */}
              <rect x={size*0.22} y={size*0.3} width={size*0.22} height={size*0.15} fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.3} />
              <rect x={size*0.22} y={size*0.5} width={size*0.22} height={size*0.15} fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.3} />
              <rect x={size*0.56} y={size*0.3} width={size*0.22} height={size*0.15} fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.3} />
              <rect x={size*0.56} y={size*0.5} width={size*0.22} height={size*0.15} fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.3} />
              
              {/* Handles */}
              <ellipse cx={size*0.45} cy={size*0.47} rx={size*0.01} ry={size*0.02} fill={materials.brass} />
              <ellipse cx={size*0.55} cy={size*0.47} rx={size*0.01} ry={size*0.02} fill={materials.brass} />
              
              {/* Bottom drawers */}
              <rect x={size*0.18} y={size*0.72} width={size*0.64} height={size*0.06} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <circle cx={size*0.5} cy={size*0.75} r={size*0.015} fill={materials.brass} />
              
              {/* Feet */}
              <rect x={size*0.2} y={size*0.78} width={size*0.05} height={size*0.04} fill={materials.woodDark} />
              <rect x={size*0.75} y={size*0.78} width={size*0.05} height={size*0.04} fill={materials.woodDark} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.88} rx={size*0.4} ry={size*0.08} fill="black" opacity={0.35} />
            </g>
          );
        }
      
      case 'cabinet':
      case 'dresser':
        // Renaissance/Colonial cabinet
        if (zone === 'SOUTH_ASIAN') {
          // Indian carved cabinet
          return (
            <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
              {/* Main body */}
              <rect x={size*0.2} y={size*0.3} width={size*0.6} height={size*0.5} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1} />
              
              {/* Carved top section */}
              <rect x={size*0.18} y={size*0.25} width={size*0.64} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <path d={`M ${size*0.25} ${size*0.28} Q ${size*0.5} ${size*0.26} ${size*0.75} ${size*0.28}`} stroke={materials.carving} strokeWidth={0.5} fill="none" />
              
              {/* Doors with lattice */}
              <rect x={size*0.25} y={size*0.38} width={size*0.22} height={size*0.32} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.53} y={size*0.38} width={size*0.22} height={size*0.32} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Lattice pattern */}
              <g opacity={0.5}>
                <line x1={size*0.3} y1={size*0.42} x2={size*0.42} y2={size*0.42} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.3} y1={size*0.48} x2={size*0.42} y2={size*0.48} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.3} y1={size*0.54} x2={size*0.42} y2={size*0.54} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.33} y1={size*0.4} x2={size*0.33} y2={size*0.58} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.39} y1={size*0.4} x2={size*0.39} y2={size*0.58} stroke={materials.woodDark} strokeWidth={0.5} />
                
                <line x1={size*0.58} y1={size*0.42} x2={size*0.7} y2={size*0.42} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.58} y1={size*0.48} x2={size*0.7} y2={size*0.48} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.58} y1={size*0.54} x2={size*0.7} y2={size*0.54} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.61} y1={size*0.4} x2={size*0.61} y2={size*0.58} stroke={materials.woodDark} strokeWidth={0.5} />
                <line x1={size*0.67} y1={size*0.4} x2={size*0.67} y2={size*0.58} stroke={materials.woodDark} strokeWidth={0.5} />
              </g>
              
              {/* Brass knobs */}
              <circle cx={size*0.43} cy={size*0.54} r={size*0.012} fill={materials.metal} />
              <circle cx={size*0.57} cy={size*0.54} r={size*0.012} fill={materials.metal} />
              
              {/* Bottom drawer */}
              <rect x={size*0.25} y={size*0.72} width={size*0.5} height={size*0.06} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <ellipse cx={size*0.5} cy={size*0.75} rx={size*0.025} ry={size*0.01} fill={materials.metal} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.35} />
            </g>
          );
        } else {
          // European/American dresser
          return (
            <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
              {/* Main body */}
              <rect x={size*0.18} y={size*0.35} width={size*0.64} height={size*0.45} fill={materials.wood} stroke={materials.woodDark} strokeWidth={1} />
              
              {/* Mirror frame (if dresser) */}
              {style === 'dresser' && (
                <>
                  <rect x={size*0.3} y={size*0.15} width={size*0.4} height={size*0.25} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
                  <rect x={size*0.33} y={size*0.18} width={size*0.34} height={size*0.19} fill="#87ceeb" opacity={0.5} />
                </>
              )}
              
              {/* Drawers */}
              <rect x={size*0.22} y={size*0.4} width={size*0.56} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.22} y={size*0.5} width={size*0.56} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.22} y={size*0.6} width={size*0.26} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.52} y={size*0.6} width={size*0.26} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.22} y={size*0.7} width={size*0.26} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              <rect x={size*0.52} y={size*0.7} width={size*0.26} height={size*0.08} fill={materials.woodLight} stroke={materials.woodDark} strokeWidth={0.5} />
              
              {/* Handles */}
              <ellipse cx={size*0.5} cy={size*0.44} rx={size*0.03} ry={size*0.01} fill={materials.brass} />
              <ellipse cx={size*0.5} cy={size*0.54} rx={size*0.03} ry={size*0.01} fill={materials.brass} />
              <ellipse cx={size*0.35} cy={size*0.64} rx={size*0.02} ry={size*0.008} fill={materials.brass} />
              <ellipse cx={size*0.65} cy={size*0.64} rx={size*0.02} ry={size*0.008} fill={materials.brass} />
              <ellipse cx={size*0.35} cy={size*0.74} rx={size*0.02} ry={size*0.008} fill={materials.brass} />
              <ellipse cx={size*0.65} cy={size*0.74} rx={size*0.02} ry={size*0.008} fill={materials.brass} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.35} />
            </g>
          );
        }
      
      default: // modern_cabinet
        // Modern cabinet
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Main body - sleek design */}
            <rect x={size*0.2} y={size*0.25} width={size*0.6} height={size*0.55} fill={era > 1980 ? '#f0f0f0' : materials.wood} stroke="#d0d0d0" strokeWidth={0.5} />
            
            {/* Glass doors (if modern) */}
            {era > 1950 && (
              <>
                <rect x={size*0.23} y={size*0.3} width={size*0.25} height={size*0.3} fill="#87ceeb" opacity={0.3} stroke="#6a6a6a" strokeWidth={0.5} />
                <rect x={size*0.52} y={size*0.3} width={size*0.25} height={size*0.3} fill="#87ceeb" opacity={0.3} stroke="#6a6a6a" strokeWidth={0.5} />
              </>
            )}
            
            {/* Drawers */}
            <rect x={size*0.23} y={size*0.65} width={size*0.54} height={size*0.05} fill={era > 1980 ? '#e0e0e0' : materials.woodLight} stroke="#a0a0a0" strokeWidth={0.5} />
            <rect x={size*0.23} y={size*0.72} width={size*0.54} height={size*0.05} fill={era > 1980 ? '#e0e0e0' : materials.woodLight} stroke="#a0a0a0" strokeWidth={0.5} />
            
            {/* Minimal handles */}
            <rect x={size*0.37} y={size*0.45} width={size*0.04} height={size*0.01} fill="#6a6a6a" />
            <rect x={size*0.59} y={size*0.45} width={size*0.04} height={size*0.01} fill="#6a6a6a" />
            <rect x={size*0.48} y={size*0.665} width={size*0.04} height={size*0.008} fill="#6a6a6a" />
            <rect x={size*0.48} y={size*0.735} width={size*0.04} height={size*0.008} fill="#6a6a6a" />
            
            {/* Metal legs (if very modern) */}
            {era > 2000 && (
              <>
                <rect x={size*0.25} y={size*0.78} width={size*0.02} height={size*0.05} fill="#4a4a4a" />
                <rect x={size*0.73} y={size*0.78} width={size*0.02} height={size*0.05} fill="#4a4a4a" />
              </>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.32} ry={size*0.06} fill="black" opacity={0.25} />
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
        {renderCabinet()}
      </g>
    </svg>
  );
};

export default CabinetSymbol;