/**
 * components/symbols/ShipIcon.tsx - Enhanced ship with flapping sail and better hull shape
 */
import React from 'react';

interface ShipIconProps {
  x: number;
  y: number;
  rotation: number;
  velocity?: { x: number; y: number };
}

const ShipIcon: React.FC<ShipIconProps> = React.memo(({ x, y, rotation, velocity = { x: 0, y: 0 } }) => {
  const shipSize = 12;
  
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const normalizedSpeed = Math.min(speed / 2, 1);
  
  // Wind direction for sail and pennant
  const windAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) - rotation;
  const sailDirection = Math.sin(windAngle * Math.PI / 180) * 12;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <defs>
        {/* Player glow filter */}
        <filter id="playerShipGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
          <feOffset dx="0" dy="0" result="offsetblur"/>
          <feFlood floodColor="#3b82f6" floodOpacity="0.9"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Enhanced gradients */}
        <linearGradient id="shipHullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#654321'}} />
          <stop offset="20%" style={{stopColor: '#8B4513'}} />
          <stop offset="40%" style={{stopColor: '#A0522D'}} />
          <stop offset="60%" style={{stopColor: '#8B4513'}} />
          <stop offset="100%" style={{stopColor: '#654321'}} />
        </linearGradient>
        
        <linearGradient id="deckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor: '#DEB887'}} />
          <stop offset="50%" style={{stopColor: '#D2B48C'}} />
          <stop offset="100%" style={{stopColor: '#BC9A6A'}} />
        </linearGradient>
        
        <radialGradient id="sailGrad" cx="40%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="40%" stopColor="#f8f8ff" stopOpacity="0.95" />
          <stop offset="80%" stopColor="#f0f0f0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e8e8e8" stopOpacity="0.85" />
        </radialGradient>
        
        <linearGradient id="mastGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="50%" stopColor="#654321" />
          <stop offset="100%" stopColor="#4a3018" />
        </linearGradient>
        
        {/* Shadow filter */}
        <filter id="shipShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/>
          <feOffset dx="1.5" dy="2" result="offsetblur"/>
          <feFlood floodColor="#000000" floodOpacity="0.5"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#playerShipGlow)">
        <g filter="url(#shipShadow)">
          {/* More realistic hull shape with proper ship-like stern */}
          <path 
            d={`M 0,${-shipSize * 1.1}
                C ${shipSize * 0.2},-${shipSize * 1.1} ${shipSize * 0.4},-${shipSize * 0.8} ${shipSize * 0.5},-${shipSize * 0.3}
                L ${shipSize * 0.55},${shipSize * 0.2}
                Q ${shipSize * 0.5},${shipSize * 0.6} ${shipSize * 0.3},${shipSize * 0.9}
                C ${shipSize * 0.15},${shipSize * 1.0} 0,${shipSize * 1.05} 0,${shipSize * 1.05}
                C 0,${shipSize * 1.05} -${shipSize * 0.15},${shipSize * 1.0} -${shipSize * 0.3},${shipSize * 0.9}
                Q -${shipSize * 0.5},${shipSize * 0.6} -${shipSize * 0.55},${shipSize * 0.2}
                L -${shipSize * 0.5},-${shipSize * 0.3}
                C -${shipSize * 0.4},-${shipSize * 0.8} -${shipSize * 0.2},-${shipSize * 1.1} 0,-${shipSize * 1.1} Z`}
            fill="url(#shipHullGrad)"
            stroke="#5D4037"
            strokeWidth="1"
          />
          
          {/* Deck with better proportions */}
          <path 
            d={`M 0,${-shipSize * 1.0}
                C ${shipSize * 0.18},-${shipSize * 0.95} ${shipSize * 0.35},-${shipSize * 0.7} ${shipSize * 0.42},-${shipSize * 0.2}
                L ${shipSize * 0.45},${shipSize * 0.1}
                Q ${shipSize * 0.4},${shipSize * 0.4} ${shipSize * 0.2},${shipSize * 0.6}
                L 0,${shipSize * 0.7}
                L -${shipSize * 0.2},${shipSize * 0.6}
                Q -${shipSize * 0.4},${shipSize * 0.4} -${shipSize * 0.45},${shipSize * 0.1}
                L -${shipSize * 0.42},-${shipSize * 0.2}
                C -${shipSize * 0.35},-${shipSize * 0.7} -${shipSize * 0.18},-${shipSize * 0.95} 0,-${shipSize * 1.0} Z`}
            fill="url(#deckGrad)"
            opacity="0.95"
          />
          
          {/* Deck planks and details */}
          <line x1={-shipSize * 0.35} y1={-shipSize * 0.2} x2={shipSize * 0.35} y2={-shipSize * 0.2} stroke="#A0826D" strokeWidth="0.4" opacity="0.7" />
          <line x1={-shipSize * 0.3} y1={-shipSize * 0.5} x2={shipSize * 0.3} y2={-shipSize * 0.5} stroke="#A0826D" strokeWidth="0.4" opacity="0.7" />
          <line x1={-shipSize * 0.25} y1={-shipSize * 0.8} x2={shipSize * 0.25} y2={-shipSize * 0.8} stroke="#A0826D" strokeWidth="0.4" opacity="0.7" />
          
          {/* Bow detail */}
          <path d={`M 0,${-shipSize * 1.1} L 0,${-shipSize * 0.9}`} stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Mast with better proportions */}
          <rect 
            x="-1.5" 
            y={-shipSize * 0.8} 
            width="3" 
            height={shipSize * 1.3} 
            fill="url(#mastGrad)" 
            rx="1.5"
          />
          
          {/* Mast bands */}
          <rect x="-1.8" y={-shipSize * 0.6} width="3.6" height="0.8" fill="#654321" rx="0.4" opacity="0.8" />
          <rect x="-1.8" y={-shipSize * 0.2} width="3.6" height="0.8" fill="#654321" rx="0.4" opacity="0.8" />
          
          {/* Animated flapping sail */}
          <g transform={`translate(0, ${-shipSize * 0.3}) rotate(${sailDirection})`}>
            <path 
              d={`M 1.5,${-shipSize * 0.5}
                  Q ${shipSize * 0.25},${-shipSize * 0.2} ${shipSize * 0.7},${-shipSize * 0.1}
                  Q ${shipSize * 0.85},${shipSize * 0.15} ${shipSize * 0.8},${shipSize * 0.4}
                  Q ${shipSize * 0.65},${shipSize * 0.6} ${shipSize * 0.4},${shipSize * 0.55}
                  Q ${shipSize * 0.2},${shipSize * 0.5} 1.5,${shipSize * 0.45}
                  Q 1,${shipSize * 0.3} 1,${shipSize * 0.1}
                  Q 1.2,${-shipSize * 0.1} 1.5,${-shipSize * 0.5} Z`}
              fill="url(#sailGrad)"
              stroke="rgba(220, 220, 220, 0.9)"
              strokeWidth="0.6"
              opacity={0.92 + normalizedSpeed * 0.08}
            >
              {/* Slow flapping animation */}
              <animateTransform
                attributeName="transform"
                type="skewX"
                values="0; 3; 0; -2; 0"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Sail rigging lines */}
            <line x1="1.5" y1={-shipSize * 0.45} x2={shipSize * 0.7} y2={-shipSize * 0.05} stroke="#8B6B47" strokeWidth="0.4" opacity="0.8" />
            <line x1="1.5" y1="0" x2={shipSize * 0.75} y2={shipSize * 0.25} stroke="#8B6B47" strokeWidth="0.4" opacity="0.8" />
            <line x1="1.5" y1={shipSize * 0.4} x2={shipSize * 0.6} y2={shipSize * 0.5} stroke="#8B6B47" strokeWidth="0.4" opacity="0.8" />
          </g>
          
          {/* Crow's nest */}
          <rect x={-shipSize * 0.2} y={-shipSize * 0.85} width={shipSize * 0.4} height={shipSize * 0.12} fill="#8B4513" rx="2" />
          <line x1={-shipSize * 0.25} y1={-shipSize * 0.79} x2={shipSize * 0.25} y2={-shipSize * 0.79} stroke="#654321" strokeWidth="0.8" />
          
          {/* Red pennant with swaying animation */}
          <g transform={`translate(0, ${-shipSize * 0.8})`}>
            <path 
              d={`M 0,0 L ${shipSize * 0.3},-${shipSize * 0.1} L ${shipSize * 0.26},-${shipSize * 0.05} L ${shipSize * 0.3},0 L 0,0`}
              fill="#dc2626"
              opacity="0.95"
              transform={`rotate(${windAngle + 90})`}
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`${windAngle + 85}; ${windAngle + 95}; ${windAngle + 85}`}
                dur="2.2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          
          {/* Wake effect when moving */}
          {speed > 0.1 && (
            <g opacity={normalizedSpeed * 0.8}>
              <path
                d={`M 0,${-shipSize * 1.1} 
                    Q -${shipSize * 0.25},-${shipSize * 1.25} -${shipSize * 0.5},-${shipSize * 1.0}
                    M 0,${-shipSize * 1.1}
                    Q ${shipSize * 0.25},-${shipSize * 1.25} ${shipSize * 0.5},-${shipSize * 1.0}`}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M -${shipSize * 0.15},${-shipSize * 1.05} 
                    Q -${shipSize * 0.3},-${shipSize * 1.15} -${shipSize * 0.6},-${shipSize * 0.95}
                    M ${shipSize * 0.15},${-shipSize * 1.05}
                    Q ${shipSize * 0.3},-${shipSize * 1.15} ${shipSize * 0.6},-${shipSize * 0.95}`}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}
          
          {/* Stern detail */}
          <path 
            d={`M -${shipSize * 0.25},${shipSize * 0.85} Q 0,${shipSize * 1.1} ${shipSize * 0.25},${shipSize * 0.85}`}
            stroke="#5D4037"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
});

export default ShipIcon;