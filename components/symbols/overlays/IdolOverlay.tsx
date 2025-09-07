/**
 * IdolOverlay.tsx - Magnificent Stardew Valley/FF6 style religious idols
 * Impressive height, rich cultural details, beautiful gradients and textures
 */

import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../PixelArtStyleGuide';

interface IdolOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
}

export const IdolOverlay: React.FC<IdolOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500
}) => {
  // Idols extend above tile for impressive presence
  const idolHeight = 1.35; // 35% taller than tile
  const idolTop = -size * (idolHeight - 1);
  
  const renderIdol = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        // Ornate golden crucifix with jewels
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.hard}>
              {/* Enhanced shadow gradient */}
              <defs>
                <radialGradient id={`idol-shadow-${x}-${y}`}>
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
                </radialGradient>
                <linearGradient id={`gold-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFED4E" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.25} ry={size * 0.1} fill={`url(#idol-shadow-${x}-${y})`} />
              
              {/* Ornate marble pedestal */}
              <rect x={size * 0.35} y={size * 0.95} width={size * 0.3} height={size * 0.2} fill={MATERIAL_COLORS.stone.marble.base} />
              <rect x={size * 0.35} y={size * 0.95} width={size * 0.05} height={size * 0.2} fill={MATERIAL_COLORS.stone.marble.light} opacity={0.6} />
              <rect x={size * 0.6} y={size * 0.95} width={size * 0.05} height={size * 0.2} fill={MATERIAL_COLORS.stone.marble.shadow} opacity={0.5} />
              
              {/* Pedestal top with inscription */}
              <rect x={size * 0.32} y={size * 0.92} width={size * 0.36} height={size * 0.05} fill={MATERIAL_COLORS.stone.marble.dark} />
              <rect x={size * 0.3} y={size * 0.9} width={size * 0.4} height={size * 0.04} fill={MATERIAL_COLORS.stone.marble.light} />
              <text x={size * 0.5} y={size * 1.05} fontSize={size * 0.03} fill={MATERIAL_COLORS.stone.marble.shadow} textAnchor="middle">INRI</text>
              
              {/* Massive ornate cross */}
              <rect x={size * 0.47} y={size * 0.15} width={size * 0.06} height={size * 0.75} fill={`url(#gold-gradient-${x}-${y})`} />
              <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.06} fill={`url(#gold-gradient-${x}-${y})`} />
              
              {/* Cross center jewel */}
              <circle cx={size * 0.5} cy={size * 0.38} r={size * 0.04} fill="#DC143C" />
              <circle cx={size * 0.5} cy={size * 0.37} r={size * 0.03} fill="#FF69B4" opacity={0.7} />
              <circle cx={size * 0.49} cy={size * 0.36} r={size * 0.01} fill="#FFFFFF" opacity={0.9} />
              
              {/* Ornate details on cross arms */}
              <circle cx={size * 0.25} cy={size * 0.38} r={size * 0.025} fill="#4169E1" />
              <circle cx={size * 0.75} cy={size * 0.38} r={size * 0.025} fill="#4169E1" />
              <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.025} fill="#228B22" />
              
              {/* Divine rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <line key={angle}
                  x1={size * 0.5} y1={size * 0.38}
                  x2={size * (0.5 + 0.2 * Math.cos(angle * Math.PI / 180))}
                  y2={size * (0.38 + 0.2 * Math.sin(angle * Math.PI / 180))}
                  stroke="#FFD700" strokeWidth={0.5} opacity={0.3} />
              ))}
              
              {/* Detailed engravings */}
              <path d={`M ${size * 0.48} ${size * 0.5} L ${size * 0.52} ${size * 0.5} L ${size * 0.5} ${size * 0.55} Z`}
                    fill="#B8860B" opacity={0.5} />
              <path d={`M ${size * 0.48} ${size * 0.25} L ${size * 0.52} ${size * 0.25} L ${size * 0.5} ${size * 0.2} Z`}
                    fill="#B8860B" opacity={0.5} />
            </g>
          </svg>
        );
      
      case 'MENA':
        // Magnificent Islamic geometric mihrab with calligraphy
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.medium}>
              <defs>
                <linearGradient id={`mihrab-gradient-${x}-${y}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4169E1" />
                  <stop offset="50%" stopColor="#1E90FF" />
                  <stop offset="100%" stopColor="#000080" />
                </linearGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.3} ry={size * 0.12} fill="#000000" opacity={0.25} />
              
              {/* Ornate mihrab arch structure */}
              <path d={`M ${size * 0.2} ${size * 1.1} L ${size * 0.2} ${size * 0.4} 
                        Q ${size * 0.2} ${size * 0.2} ${size * 0.5} ${size * 0.2}
                        Q ${size * 0.8} ${size * 0.2} ${size * 0.8} ${size * 0.4}
                        L ${size * 0.8} ${size * 1.1} Z`}
                    fill={`url(#mihrab-gradient-${x}-${y})`} />
              
              {/* Inner arch with gold trim */}
              <path d={`M ${size * 0.25} ${size * 1.05} L ${size * 0.25} ${size * 0.45} 
                        Q ${size * 0.25} ${size * 0.25} ${size * 0.5} ${size * 0.25}
                        Q ${size * 0.75} ${size * 0.25} ${size * 0.75} ${size * 0.45}
                        L ${size * 0.75} ${size * 1.05} Z`}
                    fill="#000080" stroke="#FFD700" strokeWidth={2} />
              
              {/* Geometric Islamic patterns */}
              {[0.3, 0.4, 0.5, 0.6, 0.7].map(y => (
                <g key={y}>
                  <rect x={size * 0.3} y={size * y} width={size * 0.4} height={size * 0.02} fill="#FFD700" opacity={0.8} />
                  {[0.35, 0.45, 0.55, 0.65].map(x => (
                    <circle key={x} cx={size * x} cy={size * (y + 0.01)} r={size * 0.015} fill="#FFFFFF" />
                  ))}
                </g>
              ))}
              
              {/* Crescent and star at apex */}
              <path d={`M ${size * 0.45} ${size * 0.15} 
                        C ${size * 0.38} ${size * 0.15}, ${size * 0.32} ${size * 0.1}, ${size * 0.32} ${size * 0.05}
                        C ${size * 0.32} ${size * 0}, ${size * 0.38} ${size * -0.05}, ${size * 0.45} ${size * -0.05}
                        C ${size * 0.42} ${size * -0.02}, ${size * 0.42} ${size * 0.12}, ${size * 0.45} ${size * 0.15}`}
                    fill="#FFD700" />
              <polygon points={`${size * 0.55},${size * 0.05} ${size * 0.56},${size * 0.08} ${size * 0.59},${size * 0.08} ${size * 0.57},${size * 0.1} ${size * 0.58},${size * 0.13} ${size * 0.55},${size * 0.11} ${size * 0.52},${size * 0.13} ${size * 0.53},${size * 0.1} ${size * 0.51},${size * 0.08} ${size * 0.54},${size * 0.08}`}
                       fill="#FFD700" />
              
              {/* Arabic calligraphy */}
              <text x={size * 0.5} y={size * 0.85} fontSize={size * 0.06} fill="#FFD700" textAnchor="middle">الله</text>
              <text x={size * 0.5} y={size * 0.95} fontSize={size * 0.04} fill="#FFFFFF" textAnchor="middle">محمد</text>
              
              {/* Decorative lamp hanging */}
              <rect x={size * 0.49} y={size * 0.3} width={size * 0.02} height={size * 0.15} fill="#8B4513" />
              <ellipse cx={size * 0.5} cy={size * 0.48} rx={size * 0.06} ry={size * 0.08} fill="#B8860B" />
              <ellipse cx={size * 0.5} cy={size * 0.47} rx={size * 0.05} ry={size * 0.06} fill="#FFD700" opacity={0.8} />
            </g>
          </svg>
        );
      
      case 'EAST_ASIAN':
        // Majestic golden Buddha with mandala backdrop
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.medium}>
              <defs>
                <radialGradient id={`buddha-gold-${x}-${y}`}>
                  <stop offset="0%" stopColor="#FFED4E" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#B8860B" />
                </radialGradient>
                <radialGradient id={`mandala-${x}-${y}`}>
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FF6347" stopOpacity="0.1" />
                </radialGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.28} ry={size * 0.1} fill="#000000" opacity={0.3} />
              
              {/* Mandala backdrop */}
              <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.4} fill={`url(#mandala-${x}-${y})`} />
              {[0.35, 0.25, 0.15].map(r => (
                <circle key={r} cx={size * 0.5} cy={size * 0.5} r={size * r} fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.4} />
              ))}
              
              {/* Lotus throne base */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <ellipse key={angle}
                  cx={size * 0.5} cy={size * 1.05}
                  rx={size * 0.08} ry={size * 0.15}
                  fill="#FFB6C1"
                  transform={`rotate(${angle} ${size * 0.5} ${size * 1.05})`} />
              ))}
              <ellipse cx={size * 0.5} cy={size * 1.05} rx={size * 0.25} ry={size * 0.08} fill="#FF69B4" />
              <ellipse cx={size * 0.5} cy={size * 1.03} rx={size * 0.22} ry={size * 0.06} fill="#FFC0CB" />
              
              {/* Buddha body with robes */}
              <ellipse cx={size * 0.5} cy={size * 0.75} rx={size * 0.2} ry={size * 0.28} fill={`url(#buddha-gold-${x}-${y})`} />
              <path d={`M ${size * 0.3} ${size * 0.85} Q ${size * 0.35} ${size * 0.75} ${size * 0.38} ${size * 0.65}`}
                    fill="#DC143C" opacity={0.7} />
              <path d={`M ${size * 0.7} ${size * 0.85} Q ${size * 0.65} ${size * 0.75} ${size * 0.62} ${size * 0.65}`}
                    fill="#DC143C" opacity={0.7} />
              
              {/* Buddha arms in meditation pose */}
              <ellipse cx={size * 0.4} cy={size * 0.75} rx={size * 0.05} ry={size * 0.12} fill={`url(#buddha-gold-${x}-${y})`} transform="rotate(-30 ${size * 0.4} ${size * 0.75})" />
              <ellipse cx={size * 0.6} cy={size * 0.75} rx={size * 0.05} ry={size * 0.12} fill={`url(#buddha-gold-${x}-${y})`} transform="rotate(30 ${size * 0.6} ${size * 0.75})" />
              
              {/* Buddha head with ushnisha */}
              <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.12} fill={`url(#buddha-gold-${x}-${y})`} />
              <ellipse cx={size * 0.5} cy={size * 0.28} rx={size * 0.08} ry={size * 0.1} fill={`url(#buddha-gold-${x}-${y})`} />
              <circle cx={size * 0.5} cy={size * 0.22} r={size * 0.04} fill="#FFD700" />
              
              {/* Serene face details */}
              <path d={`M ${size * 0.47} ${size * 0.34} Q ${size * 0.465} ${size * 0.33} ${size * 0.47} ${size * 0.32}`}
                    fill="none" stroke="#8B4513" strokeWidth={0.5} />
              <path d={`M ${size * 0.53} ${size * 0.34} Q ${size * 0.535} ${size * 0.33} ${size * 0.53} ${size * 0.32}`}
                    fill="none" stroke="#8B4513" strokeWidth={0.5} />
              <circle cx={size * 0.5} cy={size * 0.37} r={size * 0.01} fill="#8B4513" />
              <path d={`M ${size * 0.48} ${size * 0.39} Q ${size * 0.5} ${size * 0.4} ${size * 0.52} ${size * 0.39}`}
                    fill="none" stroke="#8B4513" strokeWidth={0.5} />
              
              {/* Urna (third eye) */}
              <circle cx={size * 0.5} cy={size * 0.32} r={size * 0.015} fill="#DC143C" />
              <circle cx={size * 0.5} cy={size * 0.32} r={size * 0.01} fill="#FF69B4" />
              
              {/* Aureole/halo */}
              <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.18} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.6} />
              <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.2} fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.4} />
              
              {/* Hands in dhyana mudra */}
              <ellipse cx={size * 0.5} cy={size * 0.82} rx={size * 0.08} ry={size * 0.04} fill={`url(#buddha-gold-${x}-${y})`} />
              <circle cx={size * 0.5} cy={size * 0.81} r={size * 0.02} fill="#FFD700" />
            </g>
          </svg>
        );
      
      case 'SOUTH_ASIAN':
        // Magnificent multi-armed Hindu deity (Ganesha/Vishnu style)
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.medium}>
              <defs>
                <linearGradient id={`deity-gradient-${x}-${y}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4169E1" />
                  <stop offset="50%" stopColor="#6495ED" />
                  <stop offset="100%" stopColor="#191970" />
                </linearGradient>
                <radialGradient id={`crown-gold-${x}-${y}`}>
                  <stop offset="0%" stopColor="#FFED4E" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#DAA520" />
                </radialGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.3} ry={size * 0.1} fill="#000000" opacity={0.3} />
              
              {/* Ornate temple platform */}
              <rect x={size * 0.25} y={size * 1.0} width={size * 0.5} height={size * 0.15} fill={MATERIAL_COLORS.stone.sandstone.base} />
              <rect x={size * 0.25} y={size * 1.0} width={size * 0.5} height={size * 0.02} fill={MATERIAL_COLORS.stone.sandstone.light} />
              {/* Temple carvings */}
              {[0.3, 0.4, 0.5, 0.6, 0.7].map(x => (
                <circle key={x} cx={size * x} cy={size * 1.08} r={size * 0.02} fill="#FFD700" opacity={0.6} />
              ))}
              
              {/* Deity body with traditional garments */}
              <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.22} ry={size * 0.3} fill={`url(#deity-gradient-${x}-${y})`} />
              
              {/* Multiple arms (4 arms total) */}
              {/* Upper left arm */}
              <ellipse cx={size * 0.3} cy={size * 0.55} rx={size * 0.05} ry={size * 0.15} 
                       fill="#DEB887" transform={`rotate(-45 ${size * 0.3} ${size * 0.55})`} />
              <circle cx={size * 0.25} cy={size * 0.45} r={size * 0.04} fill="#FFD700" /> {/* Chakra */}
              
              {/* Upper right arm */}
              <ellipse cx={size * 0.7} cy={size * 0.55} rx={size * 0.05} ry={size * 0.15} 
                       fill="#DEB887" transform={`rotate(45 ${size * 0.7} ${size * 0.55})`} />
              <path d={`M ${size * 0.72} ${size * 0.42} L ${size * 0.75} ${size * 0.38} L ${size * 0.78} ${size * 0.45}`} 
                    fill="#C0C0C0" stroke="#808080" strokeWidth={0.5} /> {/* Trident */}
              
              {/* Lower left arm */}
              <ellipse cx={size * 0.35} cy={size * 0.7} rx={size * 0.04} ry={size * 0.12} 
                       fill="#DEB887" transform={`rotate(-25 ${size * 0.35} ${size * 0.7})`} />
              <ellipse cx={size * 0.32} cy={size * 0.78} rx={size * 0.03} ry={size * 0.04} fill="#FF69B4" /> {/* Lotus */}
              
              {/* Lower right arm */}
              <ellipse cx={size * 0.65} cy={size * 0.7} rx={size * 0.04} ry={size * 0.12} 
                       fill="#DEB887" transform={`rotate(25 ${size * 0.65} ${size * 0.7})`} />
              <rect x={size * 0.66} y={size * 0.76} width={size * 0.02} height={size * 0.06} fill="#8B4513" /> {/* Mace */}
              
              {/* Head with third eye */}
              <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.1} fill="#DEB887" />
              <circle cx={size * 0.5} cy={size * 0.32} r={size * 0.015} fill="#DC143C" /> {/* Third eye */}
              <circle cx={size * 0.5} cy={size * 0.31} r={size * 0.01} fill="#FF69B4" />
              
              {/* Elaborate crown */}
              <path d={`M ${size * 0.38} ${size * 0.28} 
                        L ${size * 0.4} ${size * 0.18} L ${size * 0.45} ${size * 0.22} 
                        L ${size * 0.5} ${size * 0.15} L ${size * 0.55} ${size * 0.22} 
                        L ${size * 0.6} ${size * 0.18} L ${size * 0.62} ${size * 0.28}`}
                    fill={`url(#crown-gold-${x}-${y})`} stroke="#B8860B" strokeWidth={1} />
              
              {/* Crown jewels */}
              <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.02} fill="#DC143C" />
              <circle cx={size * 0.45} cy={size * 0.26} r={size * 0.015} fill="#228B22" />
              <circle cx={size * 0.55} cy={size * 0.26} r={size * 0.015} fill="#4169E1" />
              
              {/* Face details */}
              <path d={`M ${size * 0.47} ${size * 0.35} Q ${size * 0.465} ${size * 0.34} ${size * 0.47} ${size * 0.33}`}
                    fill="none" stroke="#8B4513" strokeWidth={0.5} />
              <path d={`M ${size * 0.53} ${size * 0.35} Q ${size * 0.535} ${size * 0.34} ${size * 0.53} ${size * 0.33}`}
                    fill="none" stroke="#8B4513" strokeWidth={0.5} />
              <circle cx={size * 0.5} cy={size * 0.37} r={size * 0.008} fill="#8B4513" />
              
              {/* Sacred tilaka marks */}
              <rect x={size * 0.49} y={size * 0.29} width={size * 0.02} height={size * 0.04} fill="#DC143C" />
              <rect x={size * 0.47} y={size * 0.3} width={size * 0.06} height={size * 0.01} fill="#FFFFFF" />
              
              {/* Decorative dhoti (lower garment) */}
              <path d={`M ${size * 0.35} ${size * 0.85} Q ${size * 0.5} ${size * 0.88} ${size * 0.65} ${size * 0.85}`}
                    fill="#FFD700" opacity={0.7} />
              <rect x={size * 0.4} y={size * 0.85} width={size * 0.2} height={size * 0.02} fill="#DC143C" />
              
              {/* Divine aura */}
              <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.25} ry={size * 0.3} 
                       fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.4} />
            </g>
          </svg>
        );
      
      case 'SUB_SAHARAN_AFRICAN':
        // Magnificent ancestral totem with intricate carvings
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.hard}>
              <defs>
                <linearGradient id={`totem-wood-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B4513" />
                  <stop offset="50%" stopColor="#A0522D" />
                  <stop offset="100%" stopColor="#654321" />
                </linearGradient>
                <linearGradient id={`mask-gradient-${x}-${y}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2F1B0C" />
                  <stop offset="50%" stopColor="#4A2C17" />
                  <stop offset="100%" stopColor="#1C0F05" />
                </linearGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.25} ry={size * 0.1} fill="#000000" opacity={0.35} />
              
              {/* Elaborate base with tribal patterns */}
              <rect x={size * 0.35} y={size * 1.05} width={size * 0.3} height={size * 0.1} fill="#2F1B0C" />
              {/* Geometric tribal pattern on base */}
              {[0.38, 0.44, 0.5, 0.56, 0.62].map(x => (
                <g key={x}>
                  <rect x={size * x} y={size * 1.08} width={size * 0.03} height={size * 0.04} fill="#FFFFFF" />
                  <rect x={size * (x + 0.01)} y={size * 1.09} width={size * 0.01} height={size * 0.02} fill="#000000" />
                </g>
              ))}
              
              {/* Main totem pole structure */}
              <rect x={size * 0.4} y={size * 0.15} width={size * 0.2} height={size * 0.9} fill={`url(#totem-wood-${x}-${y})`} />
              
              {/* Three ancestral faces stacked */}
              {/* Top face - elder/wisdom */}
              <ellipse cx={size * 0.5} cy={size * 0.3} rx={size * 0.15} ry={size * 0.12} fill={`url(#mask-gradient-${x}-${y})`} />
              <ellipse cx={size * 0.44} cy={size * 0.28} rx={size * 0.025} ry={size * 0.035} fill="#FFFFFF" />
              <ellipse cx={size * 0.56} cy={size * 0.28} rx={size * 0.025} ry={size * 0.035} fill="#FFFFFF" />
              <circle cx={size * 0.44} cy={size * 0.28} r={size * 0.015} fill="#000000" />
              <circle cx={size * 0.56} cy={size * 0.28} r={size * 0.015} fill="#000000" />
              {/* Scarification marks */}
              <rect x={size * 0.38} y={size * 0.25} width={size * 0.02} height={size * 0.01} fill="#8B0000" />
              <rect x={size * 0.6} y={size * 0.25} width={size * 0.02} height={size * 0.01} fill="#8B0000" />
              <rect x={size * 0.38} y={size * 0.27} width={size * 0.02} height={size * 0.01} fill="#8B0000" />
              <rect x={size * 0.6} y={size * 0.27} width={size * 0.02} height={size * 0.01} fill="#8B0000" />
              
              {/* Middle face - warrior/strength */}
              <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.14} ry={size * 0.11} fill="#4A2C17" />
              <path d={`M ${size * 0.42} ${size * 0.53} Q ${size * 0.44} ${size * 0.51} ${size * 0.46} ${size * 0.53}`}
                    fill="none" stroke="#FFFFFF" strokeWidth={2} />
              <path d={`M ${size * 0.54} ${size * 0.53} Q ${size * 0.56} ${size * 0.51} ${size * 0.58} ${size * 0.53}`}
                    fill="none" stroke="#FFFFFF" strokeWidth={2} />
              <rect x={size * 0.48} y={size * 0.56} width={size * 0.04} height={size * 0.03} fill="#654321" />
              <ellipse cx={size * 0.5} cy={size * 0.61} rx={size * 0.05} ry={size * 0.02} fill="#8B0000" />
              
              {/* Bottom face - ancestors/foundation */}
              <ellipse cx={size * 0.5} cy={size * 0.8} rx={size * 0.13} ry={size * 0.1} fill="#2F1B0C" />
              <circle cx={size * 0.46} cy={size * 0.78} r={size * 0.02} fill="#FFD700" />
              <circle cx={size * 0.54} cy={size * 0.78} r={size * 0.02} fill="#FFD700" />
              <path d={`M ${size * 0.48} ${size * 0.83} L ${size * 0.5} ${size * 0.85} L ${size * 0.52} ${size * 0.83}`}
                    fill="#FFFFFF" />
              
              {/* Decorative cowrie shells and beads */}
              <ellipse cx={size * 0.35} cy={size * 0.4} rx={size * 0.02} ry={size * 0.03} fill="#F5F5DC" />
              <ellipse cx={size * 0.65} cy={size * 0.4} rx={size * 0.02} ry={size * 0.03} fill="#F5F5DC" />
              <ellipse cx={size * 0.35} cy={size * 0.65} rx={size * 0.02} ry={size * 0.03} fill="#F5F5DC" />
              <ellipse cx={size * 0.65} cy={size * 0.65} rx={size * 0.02} ry={size * 0.03} fill="#F5F5DC" />
              
              {/* Intricate geometric patterns */}
              <rect x={size * 0.4} y={size * 0.42} width={size * 0.2} height={size * 0.02} fill="#FFD700" />
              <rect x={size * 0.4} y={size * 0.68} width={size * 0.2} height={size * 0.02} fill="#FFD700" />
              <rect x={size * 0.4} y={size * 0.93} width={size * 0.2} height={size * 0.02} fill="#FFD700" />
              
              {/* Traditional cloth draping */}
              <path d={`M ${size * 0.38} ${size * 0.9} Q ${size * 0.35} ${size * 0.95} ${size * 0.38} ${size * 1.0}`}
                    fill="#DC143C" opacity={0.7} />
              <path d={`M ${size * 0.62} ${size * 0.9} Q ${size * 0.65} ${size * 0.95} ${size * 0.62} ${size * 1.0}`}
                    fill="#DC143C" opacity={0.7} />
              
              {/* Wood grain texture */}
              <rect x={size * 0.42} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#654321" opacity={0.4} />
              <rect x={size * 0.45} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#8B4513" opacity={0.3} />
              <rect x={size * 0.48} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#654321" opacity={0.4} />
              <rect x={size * 0.51} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#8B4513" opacity={0.3} />
              <rect x={size * 0.54} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#654321" opacity={0.4} />
              <rect x={size * 0.57} y={size * 0.15} width={size * 0.01} height={size * 0.9} fill="#8B4513" opacity={0.3} />
            </g>
          </svg>
        );
      
      default:
        // Impressive mystical obelisk with runes
        return (
          <svg x={x} y={y + idolTop} width={size} height={size * idolHeight} viewBox={`0 0 ${size} ${size * idolHeight}`}>
            <g filter={PIXEL_SHADOWS.hard}>
              <defs>
                <linearGradient id={`obelisk-gradient-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#708090" />
                  <stop offset="50%" stopColor="#2F4F4F" />
                  <stop offset="100%" stopColor="#1C1C1C" />
                </linearGradient>
                <radialGradient id={`crystal-glow-${x}-${y}`}>
                  <stop offset="0%" stopColor="#9370DB" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#7B68EE" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4B0082" stopOpacity="0.1" />
                </radialGradient>
              </defs>
              
              <ellipse cx={size * 0.54} cy={size * 1.15} rx={size * 0.28} ry={size * 0.1} fill="#000000" opacity={0.4} />
              
              {/* Stone base platform */}
              <rect x={size * 0.3} y={size * 1.05} width={size * 0.4} height={size * 0.1} fill={MATERIAL_COLORS.stone.granite.dark} />
              <rect x={size * 0.3} y={size * 1.05} width={size * 0.4} height={size * 0.02} fill={MATERIAL_COLORS.stone.granite.light} />
              
              {/* Main obelisk body - tapered */}
              <path d={`M ${size * 0.38} ${size * 1.05} L ${size * 0.35} ${size * 0.2} L ${size * 0.65} ${size * 0.2} L ${size * 0.62} ${size * 1.05} Z`}
                    fill={`url(#obelisk-gradient-${x}-${y})`} />
              
              {/* Pyramidion cap */}
              <path d={`M ${size * 0.35} ${size * 0.2} L ${size * 0.5} ${size * 0.05} L ${size * 0.65} ${size * 0.2} Z`}
                    fill="#4B0082" />
              <path d={`M ${size * 0.35} ${size * 0.2} L ${size * 0.5} ${size * 0.05} L ${size * 0.5} ${size * 0.2} Z`}
                    fill="#6A0DAD" opacity={0.7} />
              
              {/* Floating crystal at apex */}
              <ellipse cx={size * 0.5} cy={size * 0.03} rx={size * 0.04} ry={size * 0.06} fill={`url(#crystal-glow-${x}-${y})`} />
              <ellipse cx={size * 0.5} cy={size * 0.03} rx={size * 0.02} ry={size * 0.04} fill="#E6E6FA" />
              
              {/* Ancient runes carved into stone */}
              <text x={size * 0.5} y={size * 0.35} fontSize={size * 0.04} fill="#9370DB" textAnchor="middle" fontFamily="serif">ᚱᚢᚾᛖ</text>
              <text x={size * 0.5} y={size * 0.5} fontSize={size * 0.04} fill="#9370DB" textAnchor="middle" fontFamily="serif">ᛋᛏᚩᚾᛖ</text>
              <text x={size * 0.5} y={size * 0.65} fontSize={size * 0.04} fill="#9370DB" textAnchor="middle" fontFamily="serif">ᛗᚪᚷᛁᚳ</text>
              <text x={size * 0.5} y={size * 0.8} fontSize={size * 0.04} fill="#9370DB" textAnchor="middle" fontFamily="serif">ᛈᚩᚹᛖᚱ</text>
              
              {/* Glowing energy lines */}
              <rect x={size * 0.36} y={size * 0.25} width={size * 0.01} height={size * 0.75} fill="#9370DB" opacity={0.6} />
              <rect x={size * 0.63} y={size * 0.25} width={size * 0.01} height={size * 0.75} fill="#9370DB" opacity={0.6} />
              
              {/* Central power core */}
              <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.08} fill="none" stroke="#9370DB" strokeWidth={1} opacity={0.5} />
              <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.06} fill="none" stroke="#9370DB" strokeWidth={0.5} opacity={0.7} />
              <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.04} fill="#9370DB" opacity={0.3} />
              
              {/* Stone texture and weathering */}
              <rect x={size * 0.4} y={size * 0.3} width={size * 0.2} height={size * 0.01} fill="#000000" opacity={0.2} />
              <rect x={size * 0.4} y={size * 0.45} width={size * 0.2} height={size * 0.01} fill="#000000" opacity={0.2} />
              <rect x={size * 0.4} y={size * 0.6} width={size * 0.2} height={size * 0.01} fill="#000000" opacity={0.2} />
              <rect x={size * 0.4} y={size * 0.75} width={size * 0.2} height={size * 0.01} fill="#000000" opacity={0.2} />
              <rect x={size * 0.4} y={size * 0.9} width={size * 0.2} height={size * 0.01} fill="#000000" opacity={0.2} />
              
              {/* Mystical aura */}
              <ellipse cx={size * 0.5} cy={size * 0.6} rx={size * 0.35} ry={size * 0.5} 
                       fill="none" stroke="#9370DB" strokeWidth={0.5} opacity={0.2} />
            </g>
          </svg>
        );
    }
  };
  
  return renderIdol();
};