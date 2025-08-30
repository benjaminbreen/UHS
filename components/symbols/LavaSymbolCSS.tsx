/**
 * components/symbols/LavaSymbolCSS.tsx
 * CSS-based lava effect using animated gradients for performance
 */
import React from 'react';

interface LavaSymbolCSSProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const LavaSymbolCSS: React.FC<LavaSymbolCSSProps> = React.memo(
  ({ x, y, size, seed }) => {
    // Create a unique animation delay based on position
    const animationDelay = ((x + y) * 0.1) % 3;
    
    return (
      <foreignObject x={x} y={y} width={size} height={size}>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(
                circle at ${25 + (seed % 25)}% ${30 + (seed % 35)}%,
                rgba(255, 200, 100, 0.9) 0%,
                rgba(255, 133, 51, 0.7) 15%,
                rgba(255, 102, 51, 0.5) 25%,
                transparent 40%
              ),
              radial-gradient(
                circle at ${70 - (seed % 20)}% ${65 + (seed % 25)}%,
                rgba(255, 153, 51, 0.8) 0%,
                rgba(255, 102, 51, 0.6) 20%,
                transparent 35%
              ),
              radial-gradient(
                circle at ${45 + (seed % 30)}% ${20 + (seed % 40)}%,
                rgba(255, 133, 51, 0.7) 0%,
                rgba(204, 51, 17, 0.4) 25%,
                transparent 40%
              ),
              radial-gradient(
                circle at ${60 - (seed % 25)}% ${80 - (seed % 20)}%,
                rgba(255, 102, 51, 0.8) 0%,
                transparent 30%
              )
            `,
            backgroundSize: '200% 200%',
            animation: `lavaFlow${seed % 3} ${5 + (seed % 3)}s ease-in-out infinite`,
            animationDelay: `${animationDelay}s`,
            position: 'relative',
            overflow: 'hidden',
            // No background color - transparent to show the base lava red from canvas
            backgroundColor: 'transparent'
          }}
        >
        </div>
        
        <style>
          {`
            @keyframes lavaFlow0 {
              0%, 100% { background-position: 0% 0%; }
              50% { background-position: 100% 100%; }
            }
            @keyframes lavaFlow1 {
              0%, 100% { background-position: 100% 0%; }
              50% { background-position: 0% 100%; }
            }
            @keyframes lavaFlow2 {
              0%, 100% { background-position: 50% 0%; }
              50% { background-position: 50% 100%; }
            }
          `}
        </style>
      </foreignObject>
    );
  }
);

export default LavaSymbolCSS;