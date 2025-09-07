/**
 * BookshelfSymbol.tsx - Culturally-specific bookshelf with 3D perspective
 * Stardew Valley inspired with rich shadows and highlights
 */
import React from 'react';

interface BookshelfSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  variant?: 'books' | 'scrolls' | 'tablets' | 'manuscripts' | 'mixed';
  opacity?: number;
}

const BookshelfSymbol: React.FC<BookshelfSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  variant,
  opacity = 1.0 
}) => {
  // Determine content type based on culture and era
  const getContentType = () => {
    if (variant) return variant;
    
    if (era < -2000) return 'tablets'; // Ancient civilizations
    
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return era < 1000 ? 'scrolls' : 'mixed';
      case 'MENA':
        return era < 800 ? 'scrolls' : 'manuscripts';
      case 'AMERICAS':
        return era < 1500 ? 'tablets' : 'books';
      case 'AFRICAN':
        return era < 1000 ? 'tablets' : 'manuscripts';
      case 'OCEANIA':
        return 'tablets'; // Bark cloth, carved tablets
      default: // EUROPEAN
        if (era < 0) return 'scrolls';         // Antiquity - scrolls
        if (era < 1000) return 'manuscripts';  // Medieval - chained manuscripts
        if (era < 1450) return 'manuscripts';  // Medieval - illuminated manuscripts
        if (era < 1800) return 'leatherbound'; // Early modern - brown leather
        if (era < 1950) return 'leatherbound'; // Industrial - brown leather
        return 'books';                        // Modern - colorful books
    }
  };

  const contentType = getContentType();

  // Wood color based on region
  const getWoodColor = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return { dark: '#4a2c1c', medium: '#6b3e2a', light: '#8a5438' }; // Dark lacquered wood
      case 'MENA':
      case 'AFRICAN':
        return { dark: '#5c3a24', medium: '#7a4e32', light: '#936240' }; // Cedar/acacia
      case 'AMERICAS':
        return { dark: '#3e2818', medium: '#5a3c24', light: '#745030' }; // Mahogany
      case 'OCEANIA':
        return { dark: '#4a3020', medium: '#644028', light: '#7e5030' }; // Tropical hardwood
      default:
        return { dark: '#3e2e1c', medium: '#5c452b', light: '#7a5d3a' }; // Oak
    }
  };

  const wood = getWoodColor();

  // SNES pixel art style - pixel size for consistent proportions
  const pixelSize = size / 16;

  const renderContent = () => {
    switch (contentType) {
      case 'scrolls':
        // Asian/Ancient scrolls - smaller and more numerous
        return (
          <g>
            {/* Top shelf scrolls */}
            <circle cx={pixelSize*2.5} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*4} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*5.5} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*7} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*8.5} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*10} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*11.5} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*13} cy={pixelSize*2.5} r={pixelSize*0.8} fill="#c4b490" />
            
            {/* Middle shelf scrolls */}
            <circle cx={pixelSize*2.8} cy={pixelSize*7} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*4.3} cy={pixelSize*7} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*5.8} cy={pixelSize*7} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*7.3} cy={pixelSize*7} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*8.8} cy={pixelSize*7} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*10.3} cy={pixelSize*7} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*11.8} cy={pixelSize*7} r={pixelSize*0.8} fill="#e4d4b0" />
            
            {/* Bottom shelf scrolls */}
            <circle cx={pixelSize*2.5} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*4} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*5.5} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*7} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*8.5} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#d4c4a0" />
            <circle cx={pixelSize*10} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#e4d4b0" />
            <circle cx={pixelSize*11.5} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#c4b490" />
            <circle cx={pixelSize*13} cy={pixelSize*11.5} r={pixelSize*0.8} fill="#d4c4a0" />
            
            {/* Scroll end caps - subtle binding */}
            {[2.5, 7, 11.5].map(yPos => (
              <g key={yPos}>
                <rect x={pixelSize*2} y={pixelSize*(yPos-0.2)} width={pixelSize*11.5} height={pixelSize*0.4} fill="#8a7050" opacity={0.4} />
              </g>
            ))}
          </g>
        );
      
      case 'tablets':
        // Stone/clay tablets - smaller, more realistic
        return (
          <g>
            {/* Top shelf tablets */}
            <rect x={pixelSize*2.5} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*4.2} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            <rect x={pixelSize*5.9} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*7.6} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#908070" />
            <rect x={pixelSize*9.3} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*11} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            <rect x={pixelSize*12.7} y={pixelSize*1.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            
            {/* Middle shelf tablets */}
            <rect x={pixelSize*2.8} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#908070" />
            <rect x={pixelSize*4.5} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*6.2} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            <rect x={pixelSize*7.9} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*9.6} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#908070" />
            <rect x={pixelSize*11.3} y={pixelSize*6} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            
            {/* Bottom shelf tablets */}
            <rect x={pixelSize*2.5} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*4.2} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#908070" />
            <rect x={pixelSize*5.9} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            <rect x={pixelSize*7.6} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            <rect x={pixelSize*9.3} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#908070" />
            <rect x={pixelSize*11} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#907060" />
            <rect x={pixelSize*12.7} y={pixelSize*10.5} width={pixelSize*1.2} height={pixelSize*2.5} fill="#a08070" />
            
            {/* Cuneiform marks - subtle texture */}
            {[2, 6.5, 11].map(yPos => (
              <g key={yPos} opacity={0.3}>
                <line x1={pixelSize*3} y1={pixelSize*yPos} x2={pixelSize*13} y2={pixelSize*yPos} stroke="#605040" strokeWidth={pixelSize*0.1} />
                <line x1={pixelSize*3} y1={pixelSize*(yPos+0.4)} x2={pixelSize*13} y2={pixelSize*(yPos+0.4)} stroke="#605040" strokeWidth={pixelSize*0.1} />
                <line x1={pixelSize*3} y1={pixelSize*(yPos+0.8)} x2={pixelSize*13} y2={pixelSize*(yPos+0.8)} stroke="#605040" strokeWidth={pixelSize*0.1} />
              </g>
            ))}
          </g>
        );
      
      case 'manuscripts':
        // Medieval manuscripts
        return (
          <g>
            {/* Top shelf - large tomes */}
            <rect x={size*0.15} y={size*0.05} width={6} height={12} fill="#8b4513" />
            <rect x={size*0.35} y={size*0.05} width={5} height={12} fill="#654321" />
            <rect x={size*0.55} y={size*0.05} width={6} height={12} fill="#704214" />
            <rect x={size*0.75} y={size*0.05} width={5} height={12} fill="#8b4513" />
            
            {/* Gold leaf decoration */}
            <rect x={size*0.15} y={size*0.09} width={6} height={1} fill="#d4af37" opacity={0.7} />
            <rect x={size*0.55} y={size*0.09} width={6} height={1} fill="#d4af37" opacity={0.7} />
            
            {/* Middle shelf */}
            <rect x={size*0.2} y={size*0.35} width={5} height={12} fill="#654321" />
            <rect x={size*0.4} y={size*0.35} width={6} height={12} fill="#8b4513" />
            <rect x={size*0.6} y={size*0.35} width={5} height={12} fill="#704214" />
            
            {/* Bottom shelf */}
            <rect x={size*0.15} y={size*0.65} width={6} height={12} fill="#704214" />
            <rect x={size*0.35} y={size*0.65} width={5} height={12} fill="#8b4513" />
            <rect x={size*0.55} y={size*0.65} width={6} height={12} fill="#654321" />
            <rect x={size*0.75} y={size*0.65} width={5} height={12} fill="#8b4513" />
          </g>
        );
      
      case 'leatherbound':
        // Early modern/Industrial era - brown leather-bound books
        return (
          <g>
            {/* Top shelf - leather books in browns and dark tones */}
            <rect x={size*0.12} y={size*0.06} width={3} height={10} fill="#654321" />
            <rect x={size*0.2} y={size*0.06} width={3} height={10} fill="#5d3a1a" />
            <rect x={size*0.28} y={size*0.06} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.36} y={size*0.06} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.44} y={size*0.06} width={3} height={10} fill="#704214" />
            <rect x={size*0.52} y={size*0.06} width={3} height={10} fill="#654321" />
            <rect x={size*0.6} y={size*0.06} width={3} height={10} fill="#5d3a1a" />
            <rect x={size*0.68} y={size*0.06} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.76} y={size*0.06} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.84} y={size*0.06} width={3} height={10} fill="#704214" />
            
            {/* Gold embossing on spines */}
            <rect x={size*0.12} y={size*0.09} width={3} height={1} fill="#d4af37" opacity={0.5} />
            <rect x={size*0.36} y={size*0.09} width={3} height={1} fill="#d4af37" opacity={0.5} />
            <rect x={size*0.6} y={size*0.09} width={3} height={1} fill="#d4af37" opacity={0.5} />
            
            {/* Middle shelf */}
            <rect x={size*0.15} y={size*0.36} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.23} y={size*0.36} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.31} y={size*0.36} width={3} height={10} fill="#704214" />
            <rect x={size*0.39} y={size*0.36} width={3} height={10} fill="#654321" />
            <rect x={size*0.47} y={size*0.36} width={3} height={10} fill="#5d3a1a" />
            <rect x={size*0.55} y={size*0.36} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.63} y={size*0.36} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.71} y={size*0.36} width={3} height={10} fill="#704214" />
            <rect x={size*0.79} y={size*0.36} width={3} height={10} fill="#654321" />
            
            {/* Bottom shelf */}
            <rect x={size*0.12} y={size*0.66} width={3} height={10} fill="#704214" />
            <rect x={size*0.2} y={size*0.66} width={3} height={10} fill="#654321" />
            <rect x={size*0.28} y={size*0.66} width={3} height={10} fill="#5d3a1a" />
            <rect x={size*0.36} y={size*0.66} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.44} y={size*0.66} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.52} y={size*0.66} width={3} height={10} fill="#704214" />
            <rect x={size*0.6} y={size*0.66} width={3} height={10} fill="#654321" />
            <rect x={size*0.68} y={size*0.66} width={3} height={10} fill="#5d3a1a" />
            <rect x={size*0.76} y={size*0.66} width={3} height={10} fill="#7b3f00" />
            <rect x={size*0.84} y={size*0.66} width={3} height={10} fill="#8b4513" />
          </g>
        );
        
      default: // books - Modern colorful books, smaller and more realistic
        return (
          <g>
            {/* Top shelf books - varied colors, smaller sizes */}
            <rect x={pixelSize*2.2} y={pixelSize*1.2} width={pixelSize*0.8} height={pixelSize*3} fill="#8b4513" />
            <rect x={pixelSize*3.2} y={pixelSize*1.2} width={pixelSize*0.9} height={pixelSize*3} fill="#2c5aa0" />
            <rect x={pixelSize*4.3} y={pixelSize*1.2} width={pixelSize*0.7} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*5.2} y={pixelSize*1.2} width={pixelSize*1.0} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*6.4} y={pixelSize*1.2} width={pixelSize*0.8} height={pixelSize*3} fill="#4b0082" />
            <rect x={pixelSize*7.4} y={pixelSize*1.2} width={pixelSize*0.9} height={pixelSize*3} fill="#ff6347" />
            <rect x={pixelSize*8.5} y={pixelSize*1.2} width={pixelSize*0.7} height={pixelSize*3} fill="#2c5aa0" />
            <rect x={pixelSize*9.4} y={pixelSize*1.2} width={pixelSize*1.0} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*10.6} y={pixelSize*1.2} width={pixelSize*0.8} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*11.6} y={pixelSize*1.2} width={pixelSize*0.9} height={pixelSize*3} fill="#4b0082" />
            <rect x={pixelSize*12.7} y={pixelSize*1.2} width={pixelSize*0.8} height={pixelSize*3} fill="#8b4513" />
            
            {/* Top shelf book spines with subtle text lines */}
            <rect x={pixelSize*2.3} y={pixelSize*1.8} width={pixelSize*0.6} height={pixelSize*0.1} fill="#ffffff" opacity={0.6} />
            <rect x={pixelSize*4.4} y={pixelSize*2.1} width={pixelSize*0.5} height={pixelSize*0.1} fill="#ffffff" opacity={0.6} />
            <rect x={pixelSize*6.5} y={pixelSize*1.9} width={pixelSize*0.6} height={pixelSize*0.1} fill="#ffffff" opacity={0.6} />
            <rect x={pixelSize*8.6} y={pixelSize*2.0} width={pixelSize*0.5} height={pixelSize*0.1} fill="#ffffff" opacity={0.6} />
            <rect x={pixelSize*10.7} y={pixelSize*1.7} width={pixelSize*0.6} height={pixelSize*0.1} fill="#ffffff" opacity={0.6} />
            
            {/* Middle shelf books */}
            <rect x={pixelSize*2.4} y={pixelSize*5.8} width={pixelSize*0.9} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*3.5} y={pixelSize*5.8} width={pixelSize*0.8} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*4.5} y={pixelSize*5.8} width={pixelSize*1.0} height={pixelSize*3} fill="#4b0082" />
            <rect x={pixelSize*5.7} y={pixelSize*5.8} width={pixelSize*0.7} height={pixelSize*3} fill="#ff6347" />
            <rect x={pixelSize*6.6} y={pixelSize*5.8} width={pixelSize*0.9} height={pixelSize*3} fill="#2c5aa0" />
            <rect x={pixelSize*7.7} y={pixelSize*5.8} width={pixelSize*0.8} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*8.7} y={pixelSize*5.8} width={pixelSize*1.0} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*9.9} y={pixelSize*5.8} width={pixelSize*0.7} height={pixelSize*3} fill="#4b0082" />
            <rect x={pixelSize*10.8} y={pixelSize*5.8} width={pixelSize*0.9} height={pixelSize*3} fill="#8b4513" />
            <rect x={pixelSize*11.9} y={pixelSize*5.8} width={pixelSize*0.8} height={pixelSize*3} fill="#ff6347" />
            
            {/* Bottom shelf books */}
            <rect x={pixelSize*2.2} y={pixelSize*10.4} width={pixelSize*1.0} height={pixelSize*3} fill="#4b0082" />
            <rect x={pixelSize*3.4} y={pixelSize*10.4} width={pixelSize*0.8} height={pixelSize*3} fill="#8b4513" />
            <rect x={pixelSize*4.4} y={pixelSize*10.4} width={pixelSize*0.9} height={pixelSize*3} fill="#2c5aa0" />
            <rect x={pixelSize*5.5} y={pixelSize*10.4} width={pixelSize*0.7} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*6.4} y={pixelSize*10.4} width={pixelSize*1.0} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*7.6} y={pixelSize*10.4} width={pixelSize*0.8} height={pixelSize*3} fill="#ff6347" />
            <rect x={pixelSize*8.6} y={pixelSize*10.4} width={pixelSize*0.9} height={pixelSize*3} fill="#8b4513" />
            <rect x={pixelSize*9.7} y={pixelSize*10.4} width={pixelSize*0.7} height={pixelSize*3} fill="#2c5aa0" />
            <rect x={pixelSize*10.6} y={pixelSize*10.4} width={pixelSize*1.0} height={pixelSize*3} fill="#228b22" />
            <rect x={pixelSize*11.8} y={pixelSize*10.4} width={pixelSize*0.8} height={pixelSize*3} fill="#8b0000" />
            <rect x={pixelSize*12.8} y={pixelSize*10.4} width={pixelSize*0.9} height={pixelSize*3} fill="#4b0082" />
            
            {/* Book spine text details - subtle lines */}
            <rect x={pixelSize*2.5} y={pixelSize*6.4} width={pixelSize*0.7} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*4.6} y={pixelSize*6.2} width={pixelSize*0.8} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*6.7} y={pixelSize*6.5} width={pixelSize*0.7} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*8.8} y={pixelSize*6.3} width={pixelSize*0.8} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            
            {/* Bottom shelf text */}
            <rect x={pixelSize*2.3} y={pixelSize*11.0} width={pixelSize*0.8} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*4.5} y={pixelSize*11.2} width={pixelSize*0.7} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*6.5} y={pixelSize*10.9} width={pixelSize*0.8} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*8.7} y={pixelSize*11.1} width={pixelSize*0.7} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
            <rect x={pixelSize*10.7} y={pixelSize*11.0} width={pixelSize*0.8} height={pixelSize*0.1} fill="#ffffff" opacity={0.5} />
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
        {/* Shadow beneath bookshelf */}
        <ellipse 
          cx={pixelSize * 8} 
          cy={pixelSize * 14} 
          rx={pixelSize * 6} 
          ry={pixelSize * 1.5} 
          fill="#000000" 
          opacity={0.3}
        />
        
        {/* Back panel - SNES 3/4 perspective */}
        <rect x={pixelSize * 1} y={0} width={pixelSize * 14} height={pixelSize * 13} fill={wood.medium} />
        
        {/* Wood grain texture - pixel-perfect */}
        <line x1={pixelSize * 1} y1={pixelSize * 3} x2={pixelSize * 15} y2={pixelSize * 3} stroke={wood.dark} strokeWidth={pixelSize * 0.1} opacity={0.3} />
        <line x1={pixelSize * 1} y1={pixelSize * 7.5} x2={pixelSize * 15} y2={pixelSize * 7.5} stroke={wood.dark} strokeWidth={pixelSize * 0.1} opacity={0.3} />
        <line x1={pixelSize * 1} y1={pixelSize * 12} x2={pixelSize * 15} y2={pixelSize * 12} stroke={wood.dark} strokeWidth={pixelSize * 0.1} opacity={0.3} />
        
        {/* Left side panel for 3D effect - SNES style */}
        <polygon 
          points={`0,${pixelSize * 0.5} ${pixelSize * 1},0 ${pixelSize * 1},${pixelSize * 13} 0,${pixelSize * 13.5}`} 
          fill={wood.dark} 
        />
        
        {/* Right side panel for 3D effect */}
        <polygon 
          points={`${pixelSize * 15},0 ${pixelSize * 16},${pixelSize * 0.5} ${pixelSize * 16},${pixelSize * 13.5} ${pixelSize * 15},${pixelSize * 13}`} 
          fill={wood.light} 
          opacity={0.8}
        />
        
        {/* Top surface - 3/4 perspective view */}
        <polygon 
          points={`0,${pixelSize * 0.5} ${pixelSize * 1},0 ${pixelSize * 15},0 ${pixelSize * 16},${pixelSize * 0.5} ${pixelSize * 15},${pixelSize * 1} ${pixelSize * 1},${pixelSize * 1}`} 
          fill={wood.light}
        />
        
        {/* Shelves with proper SNES perspective */}
        {[4, 8.5, 13].map((yPos, index) => (
          <g key={yPos}>
            {/* Shelf top surface - 3/4 perspective */}
            <polygon 
              points={`${pixelSize * 1},${pixelSize * (yPos - 0.5)} ${pixelSize * 15},${pixelSize * (yPos - 0.5)} ${pixelSize * 16},${pixelSize * yPos} ${pixelSize * 2},${pixelSize * yPos}`} 
              fill={wood.light}
            />
            
            {/* Shelf front edge */}
            <rect x={pixelSize * 2} y={pixelSize * yPos} width={pixelSize * 13} height={pixelSize * 1} fill={wood.medium} />
            
            {/* Shelf right edge (3D) */}
            <polygon 
              points={`${pixelSize * 15},${pixelSize * (yPos - 0.5)} ${pixelSize * 16},${pixelSize * yPos} ${pixelSize * 16},${pixelSize * (yPos + 1)} ${pixelSize * 15},${pixelSize * (yPos + 0.5)}`} 
              fill={wood.dark} 
              opacity={0.6}
            />
            
            {/* Shelf shadow underneath */}
            <rect x={pixelSize * 2} y={pixelSize * (yPos + 1)} width={pixelSize * 13} height={pixelSize * 0.3} fill={wood.dark} opacity={0.4} />
          </g>
        ))}
        
        {/* Content (books/scrolls/tablets) */}
        {renderContent()}
        
        {/* Left edge shadow for depth */}
        <rect x={0} y={pixelSize * 0.5} width={pixelSize * 0.5} height={pixelSize * 13} fill="black" opacity={0.3} />
        
        {/* Right edge highlight */}
        <rect x={pixelSize * 15.5} y={pixelSize * 0.5} width={pixelSize * 0.5} height={pixelSize * 13} fill="white" opacity={0.15} />
        
        {/* Bottom shadow */}
        <rect x={pixelSize * 1} y={pixelSize * 12.7} width={pixelSize * 14} height={pixelSize * 0.3} fill="black" opacity={0.2} />
        
        {/* Top edge highlight */}
        <line x1={pixelSize * 1} y1={pixelSize * 0.2} x2={pixelSize * 15} y2={pixelSize * 0.2} stroke="white" strokeWidth={pixelSize * 0.1} opacity={0.3} />
        
        {/* Cultural decorations - pixel style */}
        {culturalZone?.toUpperCase() === 'EAST_ASIAN' && (
          <g opacity={0.3}>
            {/* Asian lattice pattern */}
            <rect x={pixelSize * 0.5} y={pixelSize * 4} width={pixelSize * 0.2} height={pixelSize * 5} fill={wood.dark} />
            <rect x={pixelSize * 15.3} y={pixelSize * 4} width={pixelSize * 0.2} height={pixelSize * 5} fill={wood.dark} />
            <rect x={pixelSize * 0.3} y={pixelSize * 6} width={pixelSize * 0.6} height={pixelSize * 0.2} fill={wood.dark} />
            <rect x={pixelSize * 15.1} y={pixelSize * 6} width={pixelSize * 0.6} height={pixelSize * 0.2} fill={wood.dark} />
          </g>
        )}
        
        {culturalZone?.toUpperCase() === 'MENA' && (
          <g opacity={0.2}>
            {/* Islamic geometric pattern - simplified for pixel art */}
            <rect x={pixelSize * 7.5} y={pixelSize * 1} width={pixelSize} height={pixelSize} fill="none" stroke={wood.dark} strokeWidth={pixelSize * 0.1} />
            <circle cx={pixelSize * 8} cy={pixelSize * 1.5} r={pixelSize * 0.3} fill="none" stroke={wood.dark} strokeWidth={pixelSize * 0.1} />
          </g>
        )}
      </g>
    </svg>
  );
};

export default BookshelfSymbol;