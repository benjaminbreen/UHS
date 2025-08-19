/**
 * components/symbols/vessels/RaftSymbol.tsx - Simple log raft symbol
 */
import React from 'react';

interface RaftSymbolProps {
  x: number;
  y: number;
  rotation?: number;
  size?: number;
}

const RaftSymbol: React.FC<RaftSymbolProps> = React.memo(({ x, y, rotation = 0, size = 10 }) => {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <defs>
        <linearGradient id="logGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor: '#D2B48C'}} />
          <stop offset="50%" style={{stopColor: '#8B7355'}} />
          <stop offset="100%" style={{stopColor: '#654321'}} />
        </linearGradient>
      </defs>
      
      {/* Log raft - multiple parallel logs */}
      <rect x={-size} y={-size * 0.15} width={size * 2} height={size * 0.1} fill="url(#logGrad)" rx="2" />
      <rect x={-size} y={-size * 0.05} width={size * 2} height={size * 0.1} fill="url(#logGrad)" rx="2" />
      <rect x={-size} y={size * 0.05} width={size * 2} height={size * 0.1} fill="url(#logGrad)" rx="2" />
      
      {/* Rope bindings */}
      <line x1={-size * 0.6} y1={-size * 0.2} x2={-size * 0.6} y2={size * 0.2} stroke="#8B4513" strokeWidth="1.5" />
      <line x1={0} y1={-size * 0.2} x2={0} y2={size * 0.2} stroke="#8B4513" strokeWidth="1.5" />
      <line x1={size * 0.6} y1={-size * 0.2} x2={size * 0.6} y2={size * 0.2} stroke="#8B4513" strokeWidth="1.5" />
      
      {/* Small platform detail */}
      <rect x={-size * 0.3} y={-size * 0.08} width={size * 0.6} height={size * 0.16} fill="#A0522D" opacity="0.8" />
    </g>
  );
});

export default RaftSymbol;