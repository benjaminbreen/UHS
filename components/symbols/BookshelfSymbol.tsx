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

  const renderContent = () => {
    switch (contentType) {
      case 'scrolls':
        // Asian/Ancient scrolls
        return (
          <g>
            {/* Top shelf scrolls */}
            <circle cx={size*0.2} cy={size*0.15} r={3} fill="#d4c4a0" />
            <circle cx={size*0.35} cy={size*0.15} r={3} fill="#c4b490" />
            <circle cx={size*0.5} cy={size*0.15} r={3} fill="#e4d4b0" />
            <circle cx={size*0.65} cy={size*0.15} r={3} fill="#d4c4a0" />
            <circle cx={size*0.8} cy={size*0.15} r={3} fill="#c4b490" />
            
            {/* Middle shelf scrolls */}
            <circle cx={size*0.25} cy={size*0.45} r={3} fill="#e4d4b0" />
            <circle cx={size*0.4} cy={size*0.45} r={3} fill="#d4c4a0" />
            <circle cx={size*0.55} cy={size*0.45} r={3} fill="#c4b490" />
            <circle cx={size*0.7} cy={size*0.45} r={3} fill="#e4d4b0" />
            
            {/* Bottom shelf scrolls */}
            <circle cx={size*0.2} cy={size*0.75} r={3} fill="#c4b490" />
            <circle cx={size*0.35} cy={size*0.75} r={3} fill="#d4c4a0" />
            <circle cx={size*0.5} cy={size*0.75} r={3} fill="#e4d4b0" />
            <circle cx={size*0.65} cy={size*0.75} r={3} fill="#c4b490" />
            <circle cx={size*0.8} cy={size*0.75} r={3} fill="#d4c4a0" />
            
            {/* Scroll end caps */}
            {[0.15, 0.45, 0.75].map(yPos => (
              <g key={yPos}>
                <rect x={size*0.15} y={size*yPos-1} width={size*0.7} height={2} fill="#8a7050" opacity={0.6} />
              </g>
            ))}
          </g>
        );
      
      case 'tablets':
        // Stone/clay tablets
        return (
          <g>
            {/* Top shelf tablets */}
            <rect x={size*0.15} y={size*0.08} width={4} height={8} fill="#a08070" />
            <rect x={size*0.3} y={size*0.08} width={4} height={8} fill="#907060" />
            <rect x={size*0.45} y={size*0.08} width={4} height={8} fill="#a08070" />
            <rect x={size*0.6} y={size*0.08} width={4} height={8} fill="#908070" />
            <rect x={size*0.75} y={size*0.08} width={4} height={8} fill="#a08070" />
            
            {/* Middle shelf tablets */}
            <rect x={size*0.2} y={size*0.38} width={4} height={8} fill="#908070" />
            <rect x={size*0.35} y={size*0.38} width={4} height={8} fill="#a08070" />
            <rect x={size*0.5} y={size*0.38} width={4} height={8} fill="#907060" />
            <rect x={size*0.65} y={size*0.38} width={4} height={8} fill="#a08070" />
            
            {/* Bottom shelf tablets */}
            <rect x={size*0.15} y={size*0.68} width={4} height={8} fill="#a08070" />
            <rect x={size*0.3} y={size*0.68} width={4} height={8} fill="#908070" />
            <rect x={size*0.45} y={size*0.68} width={4} height={8} fill="#907060" />
            <rect x={size*0.6} y={size*0.68} width={4} height={8} fill="#a08070" />
            <rect x={size*0.75} y={size*0.68} width={4} height={8} fill="#908070" />
            
            {/* Cuneiform marks */}
            {[0.12, 0.42, 0.72].map(yPos => (
              <g key={yPos} opacity={0.4}>
                <line x1={size*0.2} y1={size*yPos} x2={size*0.75} y2={size*yPos} stroke="#605040" strokeWidth={0.5} />
                <line x1={size*0.2} y1={size*yPos+2} x2={size*0.75} y2={size*yPos+2} stroke="#605040" strokeWidth={0.5} />
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
        
      default: // books - Modern colorful books
        return (
          <g>
            {/* Top shelf books - varied colors for modern era */}
            <rect x={size*0.12} y={size*0.06} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.2} y={size*0.06} width={3} height={10} fill="#2c5aa0" />
            <rect x={size*0.28} y={size*0.06} width={3} height={10} fill="#228b22" />
            <rect x={size*0.36} y={size*0.06} width={3} height={10} fill="#8b0000" />
            <rect x={size*0.44} y={size*0.06} width={3} height={10} fill="#4b0082" />
            <rect x={size*0.52} y={size*0.06} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.6} y={size*0.06} width={3} height={10} fill="#2c5aa0" />
            <rect x={size*0.68} y={size*0.06} width={3} height={10} fill="#228b22" />
            <rect x={size*0.76} y={size*0.06} width={3} height={10} fill="#8b0000" />
            <rect x={size*0.84} y={size*0.06} width={3} height={10} fill="#4b0082" />
            
            {/* Middle shelf books */}
            <rect x={size*0.15} y={size*0.36} width={3} height={10} fill="#228b22" />
            <rect x={size*0.23} y={size*0.36} width={3} height={10} fill="#8b0000" />
            <rect x={size*0.31} y={size*0.36} width={3} height={10} fill="#4b0082" />
            <rect x={size*0.39} y={size*0.36} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.47} y={size*0.36} width={3} height={10} fill="#2c5aa0" />
            <rect x={size*0.55} y={size*0.36} width={3} height={10} fill="#228b22" />
            <rect x={size*0.63} y={size*0.36} width={3} height={10} fill="#8b0000" />
            <rect x={size*0.71} y={size*0.36} width={3} height={10} fill="#4b0082" />
            <rect x={size*0.79} y={size*0.36} width={3} height={10} fill="#8b4513" />
            
            {/* Bottom shelf books */}
            <rect x={size*0.12} y={size*0.66} width={3} height={10} fill="#4b0082" />
            <rect x={size*0.2} y={size*0.66} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.28} y={size*0.66} width={3} height={10} fill="#2c5aa0" />
            <rect x={size*0.36} y={size*0.66} width={3} height={10} fill="#228b22" />
            <rect x={size*0.44} y={size*0.66} width={3} height={10} fill="#8b0000" />
            <rect x={size*0.52} y={size*0.66} width={3} height={10} fill="#4b0082" />
            <rect x={size*0.6} y={size*0.66} width={3} height={10} fill="#8b4513" />
            <rect x={size*0.68} y={size*0.66} width={3} height={10} fill="#2c5aa0" />
            <rect x={size*0.76} y={size*0.66} width={3} height={10} fill="#228b22" />
            <rect x={size*0.84} y={size*0.66} width={3} height={10} fill="#8b0000" />
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
        {/* Back panel with wood grain */}
        <rect x={0} y={0} width={size} height={size} fill={wood.medium} />
        
        {/* Wood grain texture */}
        <line x1={0} y1={size*0.2} x2={size} y2={size*0.18} stroke={wood.dark} strokeWidth={0.5} opacity={0.3} />
        <line x1={0} y1={size*0.5} x2={size} y2={size*0.48} stroke={wood.dark} strokeWidth={0.5} opacity={0.3} />
        <line x1={0} y1={size*0.8} x2={size} y2={size*0.78} stroke={wood.dark} strokeWidth={0.5} opacity={0.3} />
        
        {/* Side panels for 3D effect */}
        <polygon 
          points={`0,0 3,3 3,${size-3} 0,${size}`} 
          fill={wood.dark} 
          opacity={0.8}
        />
        <polygon 
          points={`${size},0 ${size-3},3 ${size-3},${size-3} ${size},${size}`} 
          fill={wood.dark} 
          opacity={0.8}
        />
        
        {/* Shelves with perspective */}
        {[0.25, 0.55, 0.85].map(yPos => (
          <g key={yPos}>
            {/* Shelf top */}
            <rect x={3} y={size*yPos-2} width={size-6} height={2} fill={wood.light} />
            {/* Shelf front edge */}
            <rect x={3} y={size*yPos} width={size-6} height={3} fill={wood.medium} />
            {/* Shelf shadow */}
            <rect x={3} y={size*yPos+3} width={size-6} height={1} fill={wood.dark} opacity={0.5} />
          </g>
        ))}
        
        {/* Top of bookshelf */}
        <rect x={0} y={0} width={size} height={3} fill={wood.light} />
        
        {/* Content (books/scrolls/tablets) */}
        {renderContent()}
        
        {/* Corner shadows for depth */}
        <rect x={0} y={0} width={3} height={size} fill="black" opacity={0.2} />
        <rect x={size-3} y={0} width={3} height={size} fill="black" opacity={0.15} />
        <rect x={0} y={size-3} width={size} height={3} fill="black" opacity={0.25} />
        
        {/* Highlight on top edge */}
        <rect x={3} y={0} width={size-6} height={1} fill="white" opacity={0.2} />
        
        {/* Cultural decorations */}
        {culturalZone?.toUpperCase() === 'EAST_ASIAN' && (
          // Asian lattice pattern on sides
          <g opacity={0.3}>
            <line x1={1} y1={size*0.3} x2={1} y2={size*0.7} stroke={wood.dark} strokeWidth={1} />
            <line x1={size-1} y1={size*0.3} x2={size-1} y2={size*0.7} stroke={wood.dark} strokeWidth={1} />
          </g>
        )}
        
        {culturalZone?.toUpperCase() === 'MENA' && (
          // Islamic geometric pattern
          <g opacity={0.2}>
            <polygon 
              points={`${size/2},2 ${size-4},${size/4} ${size-4},${3*size/4} ${size/2},${size-2} 4,${3*size/4} 4,${size/4}`}
              fill="none" 
              stroke={wood.dark} 
              strokeWidth={0.5}
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export default BookshelfSymbol;