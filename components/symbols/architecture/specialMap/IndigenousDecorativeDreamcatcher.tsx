/**
 * IndigenousDecorativeDreamcatcher.tsx - Cultural decoration symbol for Indigenous/Native American zones
 * Beautiful Stardew Valley/FF6 pixel art style traditional dreamcatcher
 * Features traditional dreamcatcher design with web pattern, feathers, and beads
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface IndigenousDecorativeDreamcatcherProps {
  x: number;
  y: number;
  size: number;
  variant?: 'traditional' | 'sacred' | 'decorative' | 'ceremonial';
}

export const IndigenousDecorativeDreamcatcher: React.FC<IndigenousDecorativeDreamcatcherProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  variant = 'traditional'
}) => {
  const getDreamcatcherStyle = () => {
    switch (variant) {
      case 'traditional':
        return {
          hoop: getPixelColors('#8B4513'), // Saddle brown willow
          web: '#F5F5DC', // Beige sinew
          feathers: ['#FFFFFF', '#8B4513', '#000000'], // White, brown, black
          beads: ['#DC143C', '#4169E1', '#FFD700'], // Red, blue, gold
          cord: '#654321' // Dark brown
        };
      case 'sacred':
        return {
          hoop: getPixelColors('#654321'), // Dark brown cedar
          web: '#FFFAF0', // Floral white
          feathers: ['#FFFFFF', '#2F4F4F', '#8B0000'], // White, slate, dark red
          beads: ['#8B0000', '#000080', '#FFFFFF'], // Dark red, navy, white
          cord: '#8B4513' // Saddle brown
        };
      case 'decorative':
        return {
          hoop: getPixelColors('#DEB887'), // Burlywood
          web: '#F0E68C', // Khaki
          feathers: ['#FFB6C1', '#98FB98', '#87CEEB'], // Light pink, pale green, sky blue
          beads: ['#FF69B4', '#32CD32', '#1E90FF'], // Hot pink, lime green, dodger blue
          cord: '#D2691E' // Chocolate
        };
      case 'ceremonial':
        return {
          hoop: getPixelColors('#A0522D'), // Sienna
          web: '#FFF8DC', // Cornsilk
          feathers: ['#000000', '#8B0000', '#FFFFFF'], // Black, dark red, white
          beads: ['#8B0000', '#000000', '#FFD700'], // Dark red, black, gold
          cord: '#000000' // Black
        };
      default:
        return {
          hoop: getPixelColors('#8B4513'),
          web: '#F5F5DC',
          feathers: ['#FFFFFF', '#8B4513', '#000000'],
          beads: ['#DC143C', '#4169E1', '#FFD700'],
          cord: '#654321'
        };
    }
  };
  
  const style = getDreamcatcherStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Wall shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.2} ry={size * 0.08} fill="#000000" opacity={0.25} />
        
        {/* Hanging cord */}
        <rect x={size * 0.49} y={size * 0.05} width={size * 0.02} height={size * 0.08} fill={style.cord} />
        
        {/* Main hoop - circular frame */}
        <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.12} fill="none" 
                stroke={style.hoop.base} strokeWidth={size * 0.02} />
        
        {/* Hoop highlights for dimensionality */}
        <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.12} fill="none" 
                stroke={style.hoop.light} strokeWidth={size * 0.008} opacity={0.6}
                strokeDasharray={`${size * 0.05} ${size * 0.15}`} />
        
        {/* Hoop binding at top */}
        <rect x={size * 0.48} y={size * 0.22} width={size * 0.04} height={size * 0.02} fill={style.cord} />
        <rect x={size * 0.485} y={size * 0.23} width={size * 0.03} height={size * 0.015} fill={style.hoop.light} />
        
        {/* Web pattern - traditional spider web design */}
        <g stroke={style.web} strokeWidth={size * 0.004} fill="none">
          {/* Radial threads */}
          <line x1={size * 0.5} y1={size * 0.23} x2={size * 0.5} y2={size * 0.47} />
          <line x1={size * 0.38} y1={size * 0.35} x2={size * 0.62} y2={size * 0.35} />
          <line x1={size * 0.415} y1={size * 0.265} x2={size * 0.585} y2={size * 0.435} />
          <line x1={size * 0.585} y1={size * 0.265} x2={size * 0.415} y2={size * 0.435} />
          
          {/* Concentric web circles */}
          <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.03} />
          <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.06} />
          <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.09} />
          
          {/* Web spiral connections */}
          <path d={`M ${size * 0.47} ${size * 0.32} Q ${size * 0.485} ${size * 0.34} ${size * 0.5} ${size * 0.32}
                    Q ${size * 0.515} ${size * 0.3} ${size * 0.53} ${size * 0.32}
                    Q ${size * 0.52} ${size * 0.36} ${size * 0.5} ${size * 0.38}
                    Q ${size * 0.48} ${size * 0.36} ${size * 0.47} ${size * 0.32}`} />
        </g>
        
        {/* Central web pattern detail */}
        <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.015} fill={style.web} opacity={0.8} />
        
        {/* Beads on the web */}
        <circle cx={size * 0.46} cy={size * 0.31} r={size * 0.008} fill={style.beads[0]} />
        <circle cx={size * 0.54} cy={size * 0.39} r={size * 0.008} fill={style.beads[1]} />
        <circle cx={size * 0.48} cy={size * 0.42} r={size * 0.006} fill={style.beads[2]} />
        
        {/* Hanging cords with feathers */}
        <g>
          {/* Left hanging cord */}
          <rect x={size * 0.43} y={size * 0.46} width={size * 0.01} height={size * 0.15} fill={style.cord} />
          
          {/* Left feather */}
          <ellipse cx={size * 0.435} cy={size * 0.65} rx={size * 0.015} ry={size * 0.08} fill={style.feathers[0]} />
          <rect x={size * 0.434} y={size * 0.58} width={size * 0.002} height={size * 0.14} fill={style.feathers[1]} />
          
          {/* Left feather details */}
          <path d={`M ${size * 0.42} ${size * 0.6} L ${size * 0.434} ${size * 0.62} L ${size * 0.42} ${size * 0.64}`}
                stroke={style.feathers[2]} strokeWidth={size * 0.002} fill="none" />
          <path d={`M ${size * 0.45} ${size * 0.63} L ${size * 0.434} ${size * 0.65} L ${size * 0.45} ${size * 0.67}`}
                stroke={style.feathers[2]} strokeWidth={size * 0.002} fill="none" />
          
          {/* Middle hanging cord */}
          <rect x={size * 0.495} y={size * 0.46} width={size * 0.01} height={size * 0.2} fill={style.cord} />
          
          {/* Middle feather - larger */}
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.02} ry={size * 0.1} fill={style.feathers[1]} />
          <rect x={size * 0.499} y={size * 0.61} width={size * 0.002} height={size * 0.18} fill={style.feathers[2]} />
          
          {/* Middle feather details */}
          <path d={`M ${size * 0.48} ${size * 0.65} L ${size * 0.499} ${size * 0.67} L ${size * 0.48} ${size * 0.69}`}
                stroke={style.feathers[0]} strokeWidth={size * 0.003} fill="none" />
          <path d={`M ${size * 0.52} ${size * 0.68} L ${size * 0.499} ${size * 0.7} L ${size * 0.52} ${size * 0.72}`}
                stroke={style.feathers[0]} strokeWidth={size * 0.003} fill="none" />
          
          {/* Right hanging cord */}
          <rect x={size * 0.56} y={size * 0.46} width={size * 0.01} height={size * 0.12} fill={style.cord} />
          
          {/* Right feather - smallest */}
          <ellipse cx={size * 0.565} cy={size * 0.62} rx={size * 0.012} ry={size * 0.06} fill={style.feathers[2]} />
          <rect x={size * 0.564} y={size * 0.57} width={size * 0.002} height={size * 0.1} fill={style.feathers[0]} />
          
          {/* Right feather details */}
          <path d={`M ${size * 0.55} ${size * 0.59} L ${size * 0.564} ${size * 0.6} L ${size * 0.55} ${size * 0.61}`}
                stroke={style.feathers[1]} strokeWidth={size * 0.002} fill="none" />
        </g>
        
        {/* Beads on hanging cords */}
        <circle cx={size * 0.435} cy={size * 0.52} r={size * 0.006} fill={style.beads[1]} />
        <circle cx={size * 0.5} cy={size * 0.54} r={size * 0.008} fill={style.beads[0]} />
        <circle cx={size * 0.5} cy={size * 0.58} r={size * 0.006} fill={style.beads[2]} />
        <circle cx={size * 0.565} cy={size * 0.52} r={size * 0.005} fill={style.beads[1]} />
        
        {/* Variant-specific decorations */}
        {variant === 'sacred' && (
          <g>
            {/* Sacred symbols on hoop */}
            <circle cx={size * 0.5} cy={size * 0.23} r={size * 0.008} fill={style.beads[0]} />
            <circle cx={size * 0.38} cy={size * 0.35} r={size * 0.006} fill={style.beads[1]} />
            <circle cx={size * 0.62} cy={size * 0.35} r={size * 0.006} fill={style.beads[1]} />
            <circle cx={size * 0.5} cy={size * 0.47} r={size * 0.008} fill={style.beads[2]} />
          </g>
        )}
        
        {variant === 'ceremonial' && (
          <g>
            {/* Additional smaller hoops */}
            <circle cx={size * 0.4} cy={size * 0.25} r={size * 0.025} fill="none" 
                    stroke={style.hoop.base} strokeWidth={size * 0.01} />
            <circle cx={size * 0.6} cy={size * 0.45} r={size * 0.02} fill="none" 
                    stroke={style.hoop.base} strokeWidth={size * 0.008} />
                    
            {/* Mini webs in small hoops */}
            <line x1={size * 0.385} y1={size * 0.235} x2={size * 0.415} y2={size * 0.265} 
                  stroke={style.web} strokeWidth={size * 0.002} />
            <line x1={size * 0.415} y1={size * 0.235} x2={size * 0.385} y2={size * 0.265} 
                  stroke={style.web} strokeWidth={size * 0.002} />
          </g>
        )}
        
        {variant === 'decorative' && (
          <g>
            {/* Colorful ribbons */}
            <rect x={size * 0.47} y={size * 0.48} width={size * 0.06} height={size * 0.01} fill={style.beads[0]} opacity={0.7} />
            <rect x={size * 0.46} y={size * 0.5} width={size * 0.08} height={size * 0.008} fill={style.beads[1]} opacity={0.7} />
            <rect x={size * 0.45} y={size * 0.52} width={size * 0.1} height={size * 0.006} fill={style.beads[2]} opacity={0.7} />
          </g>
        )}
        
        {/* Attachment point detail */}
        <circle cx={size * 0.5} cy={size * 0.13} r={size * 0.01} fill={style.hoop.dark} />
        <circle cx={size * 0.5} cy={size * 0.13} r={size * 0.006} fill={style.cord} />
      </g>
    </svg>
  );
};