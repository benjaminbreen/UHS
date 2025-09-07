/**
 * StatueOverlay.tsx - Magnificent Stardew Valley/FF6 style statue overlay
 * Tall, impressive statues that extend beyond tile boundaries with rich detail
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../PixelArtStyleGuide';

interface StatueOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  year?: number;
  rotation?: number;
}

const StatueOverlay: React.FC<StatueOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  year = 1500,
  rotation = 0
}) => {
  const zone = culturalZone?.toUpperCase();
  
  const getStatueStyle = () => {
    if (zone.includes('ASIA')) {
      if (year < 0) return 'terracotta_warrior';
      if (year < 800) return 'buddha_statue';
      if (year < 1500) return 'guardian_lion';
      return 'jade_emperor';
    } else if (zone.includes('MENA')) {
      if (year < -2000) return 'sphinx';
      if (year < 0) return 'pharaoh';
      if (year < 1500) return 'islamic_scholar';
      return 'modern_mena';
    } else if (zone.includes('EUROPEAN')) {
      if (year < -500) return 'kouros';
      if (year < 500) return 'roman_emperor';
      if (year < 1400) return 'medieval_knight';
      if (year < 1700) return 'renaissance_david';
      if (year < 1900) return 'neoclassical';
      return 'modern_abstract';
    } else if (zone.includes('AFRICAN')) {
      if (year < 1000) return 'benin_bronze';
      return 'ancestral_figure';
    } else if (zone.includes('AMERICA')) {
      if (year < 1500) return 'olmec_head';
      return 'totem_pole';
    }
    return 'simple';
  };
  
  const statueStyle = getStatueStyle();
  
  // Statues are tall - extend 40% above tile
  const statueHeight = size * 1.4;
  const yOffset = -size * 0.4;
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Enhanced shadow with gradient for height */}
      <defs>
        <radialGradient id={`statue-shadow-${x}-${y}`}>
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </radialGradient>
        <linearGradient id={`marble-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F5F5" />
          <stop offset="50%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#D3D3D3" />
        </linearGradient>
        <linearGradient id={`bronze-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
        <linearGradient id={`gold-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC125" />
          <stop offset="100%" stopColor="#DAA520" />
        </linearGradient>
      </defs>
      
      <ellipse 
        cx={size * 0.55} 
        cy={size * 0.9} 
        rx={size * 0.35} 
        ry={size * 0.15} 
        fill={`url(#statue-shadow-${x}-${y})`}
      />
      
      {/* Ornate 3D pedestal with carved details */}
      <g filter={PIXEL_SHADOWS.hard}>
        {/* Pedestal top face */}
        <path
          d={`M ${size * 0.2} ${size * 0.75}
              L ${size * 0.8} ${size * 0.75}
              L ${size * 0.75} ${size * 0.78}
              L ${size * 0.25} ${size * 0.78} Z`}
          fill="#9B8365"
        />
        {/* Pedestal front face with carved detail */}
        <rect x={size * 0.25} y={size * 0.78} width={size * 0.5} height={size * 0.15} fill="#8B7355" />
        {/* Carved inscription */}
        <rect x={size * 0.3} y={size * 0.82} width={size * 0.4} height={size * 0.02} fill="#6B5345" opacity={0.5} />
        <rect x={size * 0.3} y={size * 0.86} width={size * 0.4} height={size * 0.02} fill="#6B5345" opacity={0.5} />
        {/* Right side (3/4 perspective) */}
        <path
          d={`M ${size * 0.75} ${size * 0.78}
              L ${size * 0.8} ${size * 0.75}
              L ${size * 0.8} ${size * 0.9}
              L ${size * 0.75} ${size * 0.93} Z`}
          fill="#6B5345"
        />
        {/* Highlight on edges */}
        <line x1={size * 0.2} y1={size * 0.75} x2={size * 0.8} y2={size * 0.75} stroke="#AB9375" strokeWidth={2} />
        <line x1={size * 0.25} y1={size * 0.78} x2={size * 0.25} y2={size * 0.93} stroke="#AB9375" strokeWidth={1} />
      </g>
      
      {statueStyle === 'buddha_statue' && (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Lotus base */}
          <ellipse cx={size * 0.5} cy={size * 0.72} rx={size * 0.25} ry={size * 0.08} fill="#FF69B4" opacity={0.6} />
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.2} ry={size * 0.06} fill="#FFB6C1" />
          
          {/* Main body with golden gradient - extends upward */}
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.22} ry={size * 0.35} fill={`url(#gold-gradient-${x}-${y})`} />
          {/* Body robes with folds */}
          <path d={`M ${size * 0.35} ${size * 0.5} Q ${size * 0.4} ${size * 0.45} ${size * 0.35} ${size * 0.4}`} 
                stroke="#B8860B" strokeWidth={1} fill="none" opacity={0.6} />
          <path d={`M ${size * 0.65} ${size * 0.5} Q ${size * 0.6} ${size * 0.45} ${size * 0.65} ${size * 0.4}`} 
                stroke="#B8860B" strokeWidth={1} fill="none" opacity={0.6} />
          
          {/* Head with serene expression - extends above tile */}
          <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.12} fill={`url(#gold-gradient-${x}-${y})`} />
          {/* Face details */}
          <path d={`M ${size * 0.46} ${size * 0.14} Q ${size * 0.48} ${size * 0.13} ${size * 0.46} ${size * 0.12}`} 
                stroke="#8B4513" strokeWidth={0.5} fill="none" /> {/* Left eye */}
          <path d={`M ${size * 0.54} ${size * 0.14} Q ${size * 0.52} ${size * 0.13} ${size * 0.54} ${size * 0.12}`} 
                stroke="#8B4513" strokeWidth={0.5} fill="none" /> {/* Right eye */}
          <path d={`M ${size * 0.48} ${size * 0.18} Q ${size * 0.5} ${size * 0.19} ${size * 0.52} ${size * 0.18}`} 
                stroke="#8B4513" strokeWidth={0.5} fill="none" /> {/* Smile */}
          
          {/* Ushnisha (crown protrusion) */}
          <ellipse cx={size * 0.5} cy={size * 0.05} rx={size * 0.06} ry={size * 0.08} fill="#FFD700" />
          <circle cx={size * 0.5} cy={size * 0.02} r={size * 0.02} fill="#FFA500" /> {/* Top jewel */}
          
          {/* Aureole/halo */}
          <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.18} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.4} />
          <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.2} fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.3} />
          
          {/* Meditation hands with detail */}
          <ellipse cx={size * 0.5} cy={size * 0.58} rx={size * 0.1} ry={size * 0.05} fill="#FFD700" />
          <circle cx={size * 0.48} cy={size * 0.57} r={size * 0.02} fill="#FFA500" />
          <circle cx={size * 0.52} cy={size * 0.57} r={size * 0.02} fill="#FFA500" />
        </g>
      )}
      
      {statueStyle === 'roman_emperor' && (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Marble toga with realistic folds - full height */}
          <path 
            d={`M ${size * 0.35} ${size * 0.7}
                Q ${size * 0.5} ${size * 0.65} ${size * 0.65} ${size * 0.7}
                L ${size * 0.62} ${size * 0.25}
                Q ${size * 0.5} ${size * 0.2} ${size * 0.38} ${size * 0.25} Z`}
            fill={`url(#marble-gradient-${x}-${y})`}
          />
          {/* Toga folds and shadows */}
          <path d={`M ${size * 0.4} ${size * 0.3} Q ${size * 0.45} ${size * 0.4} ${size * 0.4} ${size * 0.5}`} 
                stroke="#C0C0C0" strokeWidth={1.5} fill="none" />
          <path d={`M ${size * 0.6} ${size * 0.3} Q ${size * 0.55} ${size * 0.4} ${size * 0.6} ${size * 0.5}`} 
                stroke="#C0C0C0" strokeWidth={1.5} fill="none" />
          <path d={`M ${size * 0.45} ${size * 0.5} Q ${size * 0.5} ${size * 0.55} ${size * 0.55} ${size * 0.5}`} 
                stroke="#C0C0C0" strokeWidth={1} fill="none" />
          
          {/* Head with noble features - extends above */}
          <circle cx={size * 0.5} cy={size * 0.1} r={size * 0.1} fill={`url(#marble-gradient-${x}-${y})`} />
          {/* Face details */}
          <rect x={size * 0.47} y={size * 0.08} width={size * 0.02} height={size * 0.03} fill="#A9A9A9" /> {/* Left eye */}
          <rect x={size * 0.51} y={size * 0.08} width={size * 0.02} height={size * 0.03} fill="#A9A9A9" /> {/* Right eye */}
          <rect x={size * 0.48} y={size * 0.09} width={size * 0.04} height={size * 0.01} fill="#A9A9A9" /> {/* Nose */}
          <rect x={size * 0.47} y={size * 0.12} width={size * 0.06} height={size * 0.01} fill="#A9A9A9" /> {/* Mouth */}
          
          {/* Laurel wreath crown */}
          <ellipse cx={size * 0.5} cy={size * 0.05} rx={size * 0.12} ry={size * 0.04} fill="none" stroke="#228B22" strokeWidth={2} />
          {/* Laurel leaves */}
          {[0.38, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62].map((xPos, i) => (
            <ellipse key={i} cx={size * xPos} cy={size * 0.05} rx={size * 0.02} ry={size * 0.015} fill="#32CD32" transform={`rotate(${i * 25} ${size * xPos} ${size * 0.05})`} />
          ))}
          
          {/* Raised arm with scroll - extends outward */}
          <rect x={size * 0.62} y={size * 0.2} width={size * 0.06} height={size * 0.25} fill={`url(#marble-gradient-${x}-${y})`} transform={`rotate(25 ${size * 0.65} ${size * 0.32})`} />
          {/* Hand holding scroll */}
          <circle cx={size * 0.72} cy={size * 0.15} r={size * 0.04} fill="#E8E8E8" />
          <rect x={size * 0.7} y={size * 0.08} width={size * 0.08} height={size * 0.12} fill="#F5DEB3" /> {/* Scroll */}
          <rect x={size * 0.71} y={size * 0.1} width={size * 0.06} height={size * 0.01} fill="#8B7355" /> {/* Scroll text */}
          <rect x={size * 0.71} y={size * 0.12} width={size * 0.06} height={size * 0.01} fill="#8B7355" />
        </g>
      )}
      
      {statueStyle === 'medieval_knight' && (
        <g filter={PIXEL_SHADOWS.hard}>
          {/* Full plate armor - imposing height */}
          <rect x={size * 0.38} y={size * 0.25} width={size * 0.24} height={size * 0.45} fill="#708090" />
          {/* Chest plate with rivets */}
          <rect x={size * 0.38} y={size * 0.35} width={size * 0.24} height={size * 0.2} fill="#778899" />
          <circle cx={size * 0.42} cy={size * 0.38} r={size * 0.01} fill="#2F4F4F" />
          <circle cx={size * 0.58} cy={size * 0.38} r={size * 0.01} fill="#2F4F4F" />
          <circle cx={size * 0.42} cy={size * 0.52} r={size * 0.01} fill="#2F4F4F" />
          <circle cx={size * 0.58} cy={size * 0.52} r={size * 0.01} fill="#2F4F4F" />
          {/* Armor highlights */}
          <rect x={size * 0.38} y={size * 0.25} width={size * 0.08} height={size * 0.45} fill="#87CEEB" opacity={0.3} />
          {/* Armor shadows */}
          <rect x={size * 0.54} y={size * 0.25} width={size * 0.08} height={size * 0.45} fill="#2F4F4F" opacity={0.4} />
          
          {/* Great helm - extends above */}
          <rect x={size * 0.42} y={size * 0.08} width={size * 0.16} height={size * 0.18} fill="#708090" />
          <rect x={size * 0.42} y={size * 0.08} width={size * 0.06} height={size * 0.18} fill="#87CEEB" opacity={0.3} />
          <rect x={size * 0.52} y={size * 0.08} width={size * 0.06} height={size * 0.18} fill="#2F4F4F" opacity={0.4} />
          {/* Breathing holes */}
          <circle cx={size * 0.46} cy={size * 0.18} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.54} cy={size * 0.18} r={size * 0.008} fill="#000000" />
          {/* Eye slit */}
          <rect x={size * 0.44} y={size * 0.14} width={size * 0.12} height={size * 0.02} fill="#000000" />
          {/* Plume on helmet */}
          <path d={`M ${size * 0.5} ${size * 0.05} Q ${size * 0.48} ${size * 0.02} ${size * 0.5} ${size * 0}`} 
                fill="#DC143C" opacity={0.8} />
          <path d={`M ${size * 0.5} ${size * 0.05} Q ${size * 0.52} ${size * 0.02} ${size * 0.5} ${size * 0}`} 
                fill="#DC143C" opacity={0.8} />
          
          {/* Kite shield with heraldry */}
          <path 
            d={`M ${size * 0.28} ${size * 0.3}
                L ${size * 0.28} ${size * 0.6}
                Q ${size * 0.25} ${size * 0.65} ${size * 0.2} ${size * 0.6}
                L ${size * 0.2} ${size * 0.3} Z`}
            fill="#4169E1"
          />
          {/* Shield cross */}
          <rect x={size * 0.23} y={size * 0.4} width={size * 0.02} height={size * 0.15} fill="#FFD700" />
          <rect x={size * 0.2} y={size * 0.45} width={size * 0.08} height={size * 0.02} fill="#FFD700" />
          {/* Shield highlights */}
          <path 
            d={`M ${size * 0.28} ${size * 0.3}
                L ${size * 0.28} ${size * 0.6}
                Q ${size * 0.26} ${size * 0.63} ${size * 0.24} ${size * 0.6}
                L ${size * 0.24} ${size * 0.3} Z`}
            fill="#6495ED"
            opacity={0.4}
          />
          
          {/* Two-handed sword - massive */}
          <rect x={size * 0.66} y={size * 0.1} width={size * 0.04} height={size * 0.6} fill="#C0C0C0" />
          <rect x={size * 0.66} y={size * 0.1} width={size * 0.02} height={size * 0.6} fill="#E5E5E5" opacity={0.7} />
          {/* Crossguard */}
          <rect x={size * 0.62} y={size * 0.35} width={size * 0.12} height={size * 0.04} fill="#708090" />
          {/* Pommel */}
          <circle cx={size * 0.68} cy={size * 0.68} r={size * 0.03} fill="#8B4513" />
        </g>
      )}
      
      {statueStyle === 'pharaoh' && (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Pharaoh body with gold and lapis */}
          <rect x={size * 0.38} y={size * 0.3} width={size * 0.24} height={size * 0.4} fill={`url(#gold-gradient-${x}-${y})`} />
          {/* Nemes headdress - extends tall */}
          <path d={`M ${size * 0.35} ${size * 0.15} L ${size * 0.65} ${size * 0.15} L ${size * 0.6} ${size * 0.3} L ${size * 0.4} ${size * 0.3} Z`} 
                fill="#4169E1" />
          <path d={`M ${size * 0.38} ${size * 0.15} L ${size * 0.62} ${size * 0.15} L ${size * 0.58} ${size * 0.3} L ${size * 0.42} ${size * 0.3} Z`} 
                fill="#FFD700" opacity={0.7} />
          {/* Uraeus (cobra) on forehead */}
          <circle cx={size * 0.5} cy={size * 0.12} r={size * 0.03} fill="#FFD700" />
          <path d={`M ${size * 0.5} ${size * 0.1} Q ${size * 0.48} ${size * 0.08} ${size * 0.5} ${size * 0.06}`} 
                fill="#FFD700" />
          
          {/* Face with Egyptian features */}
          <rect x={size * 0.42} y={size * 0.18} width={size * 0.16} height={size * 0.12} fill="#DEB887" />
          <rect x={size * 0.46} y={size * 0.2} width={size * 0.03} height={size * 0.02} fill="#000000" /> {/* Left eye */}
          <rect x={size * 0.51} y={size * 0.2} width={size * 0.03} height={size * 0.02} fill="#000000" /> {/* Right eye */}
          <rect x={size * 0.48} y={size * 0.24} width={size * 0.04} height={size * 0.01} fill="#8B4513" /> {/* Mouth */}
          {/* False beard */}
          <rect x={size * 0.48} y={size * 0.28} width={size * 0.04} height={size * 0.08} fill="#000000" />
          
          {/* Crossed arms holding crook and flail */}
          <path d={`M ${size * 0.38} ${size * 0.4} L ${size * 0.62} ${size * 0.5}`} stroke="#FFD700" strokeWidth={3} />
          <path d={`M ${size * 0.62} ${size * 0.4} L ${size * 0.38} ${size * 0.5}`} stroke="#FFD700" strokeWidth={3} />
          {/* Crook */}
          <path d={`M ${size * 0.35} ${size * 0.38} Q ${size * 0.32} ${size * 0.35} ${size * 0.35} ${size * 0.32}`} 
                stroke="#FFD700" strokeWidth={2} fill="none" />
          {/* Flail */}
          <rect x={size * 0.63} y={size * 0.35} width={size * 0.02} height={size * 0.08} fill="#FFD700" />
          <circle cx={size * 0.64} cy={size * 0.44} r={size * 0.015} fill="#4169E1" />
          
          {/* Hieroglyphic cartouche on base */}
          <rect x={size * 0.4} y={size * 0.65} width={size * 0.2} height={size * 0.05} fill="#F5DEB3" />
          <rect x={size * 0.42} y={size * 0.66} width={size * 0.02} height={size * 0.03} fill="#000000" />
          <rect x={size * 0.45} y={size * 0.66} width={size * 0.02} height={size * 0.03} fill="#000000" />
          <rect x={size * 0.48} y={size * 0.66} width={size * 0.02} height={size * 0.03} fill="#000000" />
        </g>
      )}
      
      {statueStyle === 'renaissance_david' && (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Michelangelo's David - nude classical form in marble */}
          <path 
            d={`M ${size * 0.42} ${size * 0.7}
                L ${size * 0.42} ${size * 0.35}
                Q ${size * 0.45} ${size * 0.3} ${size * 0.5} ${size * 0.3}
                Q ${size * 0.55} ${size * 0.3} ${size * 0.58} ${size * 0.35}
                L ${size * 0.58} ${size * 0.7} Z`}
            fill={`url(#marble-gradient-${x}-${y})`}
          />
          {/* Musculature details */}
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.06} ry={size * 0.08} fill="#D3D3D3" opacity={0.5} />
          <path d={`M ${size * 0.44} ${size * 0.4} Q ${size * 0.46} ${size * 0.42} ${size * 0.44} ${size * 0.44}`} 
                stroke="#C0C0C0" strokeWidth={1} fill="none" />
          <path d={`M ${size * 0.56} ${size * 0.4} Q ${size * 0.54} ${size * 0.42} ${size * 0.56} ${size * 0.44}`} 
                stroke="#C0C0C0" strokeWidth={1} fill="none" />
          
          {/* Head with curly hair - extends above */}
          <circle cx={size * 0.5} cy={size * 0.08} r={size * 0.1} fill={`url(#marble-gradient-${x}-${y})`} />
          {/* Curly hair detail */}
          {[0.44, 0.48, 0.52, 0.56].map((xPos, i) => (
            <circle key={i} cx={size * xPos} cy={size * 0.02} r={size * 0.02} fill="#D3D3D3" />
          ))}
          {/* Face - determined expression */}
          <rect x={size * 0.47} y={size * 0.06} width={size * 0.02} height={size * 0.02} fill="#A9A9A9" />
          <rect x={size * 0.51} y={size * 0.06} width={size * 0.02} height={size * 0.02} fill="#A9A9A9" />
          <path d={`M ${size * 0.47} ${size * 0.04} L ${size * 0.49} ${size * 0.03}`} stroke="#A9A9A9" strokeWidth={0.5} />
          <path d={`M ${size * 0.53} ${size * 0.04} L ${size * 0.51} ${size * 0.03}`} stroke="#A9A9A9" strokeWidth={0.5} />
          
          {/* Contrapposto pose - weight on right leg */}
          <rect x={size * 0.44} y={size * 0.55} width={size * 0.05} height={size * 0.15} fill={`url(#marble-gradient-${x}-${y})`} />
          <rect x={size * 0.51} y={size * 0.55} width={size * 0.05} height={size * 0.15} fill={`url(#marble-gradient-${x}-${y})`} transform={`rotate(5 ${size * 0.53} ${size * 0.55})`} />
          
          {/* Left arm with sling over shoulder */}
          <rect x={size * 0.36} y={size * 0.3} width={size * 0.04} height={size * 0.2} fill={`url(#marble-gradient-${x}-${y})`} />
          <path d={`M ${size * 0.38} ${size * 0.28} Q ${size * 0.4} ${size * 0.25} ${size * 0.45} ${size * 0.28}`} 
                stroke="#A9A9A9" strokeWidth={1} fill="none" />
          
          {/* Right arm lowered with stone in hand */}
          <rect x={size * 0.6} y={size * 0.35} width={size * 0.04} height={size * 0.25} fill={`url(#marble-gradient-${x}-${y})`} />
          <circle cx={size * 0.62} cy={size * 0.62} r={size * 0.03} fill="#C0C0C0" />
        </g>
      )}
      
      {/* Default impressive statue for other styles */}
      {!['buddha_statue', 'roman_emperor', 'medieval_knight', 'pharaoh', 'renaissance_david'].includes(statueStyle) && (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Generic but imposing figure - full height */}
          <rect x={size * 0.4} y={size * 0.2} width={size * 0.2} height={size * 0.5} fill={`url(#bronze-gradient-${x}-${y})`} />
          {/* Body details */}
          <rect x={size * 0.4} y={size * 0.2} width={size * 0.07} height={size * 0.5} fill="#D2691E" opacity={0.4} />
          <rect x={size * 0.53} y={size * 0.2} width={size * 0.07} height={size * 0.5} fill="#8B4513" opacity={0.5} />
          
          {/* Arms outstretched */}
          <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.06} fill={`url(#bronze-gradient-${x}-${y})`} />
          <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.02} fill="#D2691E" opacity={0.4} />
          
          {/* Head - extends above tile */}
          <circle cx={size * 0.5} cy={size * 0.08} r={size * 0.1} fill={`url(#bronze-gradient-${x}-${y})`} />
          <circle cx={size * 0.47} cy={size * 0.06} r={size * 0.04} fill="#D2691E" opacity={0.4} />
          <circle cx={size * 0.53} cy={size * 0.1} r={size * 0.04} fill="#8B4513" opacity={0.5} />
          
          {/* Crown or headdress */}
          <path d={`M ${size * 0.42} ${size * 0} L ${size * 0.46} ${size * -0.05} L ${size * 0.5} ${size * 0} L ${size * 0.54} ${size * -0.05} L ${size * 0.58} ${size * 0} L ${size * 0.58} ${size * 0.03} L ${size * 0.42} ${size * 0.03} Z`} 
                fill="#FFD700" />
          
          {/* Decorative base inscription */}
          <rect x={size * 0.35} y={size * 0.65} width={size * 0.3} height={size * 0.05} fill="#8B4513" />
          <rect x={size * 0.37} y={size * 0.66} width={size * 0.26} height={size * 0.01} fill="#D2691E" />
          <rect x={size * 0.37} y={size * 0.68} width={size * 0.26} height={size * 0.01} fill="#D2691E" />
        </g>
      )}
    </g>
  );
};

export default StatueOverlay;