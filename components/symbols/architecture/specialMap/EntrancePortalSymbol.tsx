import React from 'react';

interface EntrancePortalSymbolProps {
  x: number;
  y: number;
  size: number;
  isNight?: boolean;
}

const EntrancePortalSymbol: React.FC<EntrancePortalSymbolProps> = ({ 
  x, 
  y, 
  size,
  isNight = false 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  // Pulsing animation values
  const pulseScale = 1 + (Math.sin(Date.now() * 0.002) * 0.05);
  const glowIntensity = 0.6 + (Math.sin(Date.now() * 0.003) * 0.2);
  
  return (
    <g>
      {/* Base portal frame - dark stone */}
      <rect
        x={x + size * 0.15}
        y={y + size * 0.1}
        width={size * 0.7}
        height={size * 0.85}
        fill="#2a2a3a"
        stroke="#1a1a2a"
        strokeWidth={2}
      />
      
      {/* Inner frame - ornate border */}
      <rect
        x={x + size * 0.2}
        y={y + size * 0.15}
        width={size * 0.6}
        height={size * 0.75}
        fill="none"
        stroke="#4a4a5a"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      
      {/* Glowing portal effect */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={size * 0.25 * pulseScale}
        ry={size * 0.35 * pulseScale}
        fill="url(#portalGradient)"
        opacity={glowIntensity}
      />
      
      {/* Central bright core */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={size * 0.15}
        ry={size * 0.25}
        fill="#e0f7ff"
        opacity={0.9}
      />
      
      {/* Mystical runes on frame */}
      <text
        x={x + size * 0.5}
        y={y + size * 0.08}
        fontSize={size * 0.06}
        fill="#7a9aff"
        textAnchor="middle"
        opacity={glowIntensity}
        style={{ fontFamily: 'serif' }}
      >
        ᚱᚢᚾᛖᛋ
      </text>
      
      {/* Energy particles floating upward */}
      {[0, 1, 2, 3].map((i) => {
        const particleY = y + size * (0.2 + (((Date.now() / 20 + i * 250) % 1000) / 1000) * 0.6);
        const particleX = centerX + Math.sin(Date.now() * 0.001 + i) * size * 0.1;
        return (
          <circle
            key={i}
            cx={particleX}
            cy={particleY}
            r={size * 0.015}
            fill="#a0d0ff"
            opacity={0.6 * glowIntensity}
          />
        );
      })}
      
      {/* Light rays emanating from portal */}
      <g opacity={0.3}>
        <path
          d={`M ${centerX} ${centerY} L ${x} ${y} L ${x} ${y + size * 0.3} Z`}
          fill="url(#lightRayGradient)"
        />
        <path
          d={`M ${centerX} ${centerY} L ${x + size} ${y} L ${x + size} ${y + size * 0.3} Z`}
          fill="url(#lightRayGradient)"
        />
      </g>
      
      {/* Shadow beneath portal */}
      <ellipse
        cx={centerX}
        cy={y + size * 0.95}
        rx={size * 0.3}
        ry={size * 0.05}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Gradient definitions */}
      <defs>
        <radialGradient id="portalGradient">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#a0d0ff" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#6090ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#4060a0" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="lightRayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a0d0ff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </g>
  );
};

export default EntrancePortalSymbol;