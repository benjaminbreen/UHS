/**
 * components/symbols/poi/MesoamericanPyramidSymbol.tsx - Renders a Mesoamerican-style Pyramid
 */
import React from 'react';
import { Tile } from '../../../types';

interface MesoamericanPyramidSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const MesoamericanPyramidSymbol: React.FC<MesoamericanPyramidSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `mesopyramid-${x}-${y}-${seed}`;
    const scaledSize = size * 1.2;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                <linearGradient id={`stone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4b5a0" />
                    <stop offset="50%" stopColor="#a89a85" />
                    <stop offset="100%" stopColor="#8c7e6a" />
                </linearGradient>

                <linearGradient id={`shadow-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7a6c58" />
                    <stop offset="100%" stopColor="#5e5042" />
                </linearGradient>

                <pattern id={`blocks-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="3">
                    <rect width="4" height="3" fill="#a89a85"/>
                    <rect x="0" y="0" width="3.8" height="2.8" fill="#b4a590" />
                </pattern>

                <filter id={`blur-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="1.5" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx={scaledSize * 0.55}
                cy={scaledSize * 0.88}
                rx={scaledSize * 0.4}
                ry={scaledSize * 0.1}
                fill="rgba(0,0,0,0.3)"
                filter={`url(#blur-${uniqueId})`}
            />

            {/* Stepped pyramid tiers */}
            {[0, 1, 2, 3].map(tier => {
                const tierWidth = scaledSize * (0.85 - tier * 0.18);
                const tierHeight = scaledSize * 0.12;
                const tierX = (scaledSize - tierWidth) / 2;
                const tierY = scaledSize * (0.75 - tier * 0.15);
                const sideOffset = scaledSize * 0.08;

                return (
                    <g key={`tier-${tier}`}>
                        {/* Right side face */}
                        <path
                            d={`M ${tierX + tierWidth} ${tierY}
                                L ${tierX + tierWidth + sideOffset} ${tierY - sideOffset * 0.5}
                                L ${tierX + tierWidth + sideOffset} ${tierY + tierHeight - sideOffset * 0.5}
                                L ${tierX + tierWidth} ${tierY + tierHeight}
                                Z`}
                            fill={`url(#shadow-${uniqueId})`}
                            stroke="#5e5042"
                            strokeWidth="0.3"
                        />

                        {/* Front face */}
                        <rect
                            x={tierX}
                            y={tierY}
                            width={tierWidth}
                            height={tierHeight}
                            fill={`url(#blocks-${uniqueId})`}
                            stroke="#7a6c58"
                            strokeWidth="0.4"
                        />

                        {/* Top surface */}
                        <path
                            d={`M ${tierX} ${tierY}
                                L ${tierX + sideOffset} ${tierY - sideOffset * 0.5}
                                L ${tierX + tierWidth + sideOffset} ${tierY - sideOffset * 0.5}
                                L ${tierX + tierWidth} ${tierY}
                                Z`}
                            fill={`url(#stone-${uniqueId})`}
                            stroke="#7a6c58"
                            strokeWidth="0.3"
                            opacity="0.9"
                        />

                        {/* Decorative carvings */}
                        {tier === 0 && (
                            <g opacity="0.4">
                                <circle cx={tierX + tierWidth * 0.25} cy={tierY + tierHeight * 0.5} r="1.5" fill="#5e5042" />
                                <circle cx={tierX + tierWidth * 0.5} cy={tierY + tierHeight * 0.5} r="1.5" fill="#5e5042" />
                                <circle cx={tierX + tierWidth * 0.75} cy={tierY + tierHeight * 0.5} r="1.5" fill="#5e5042" />
                            </g>
                        )}
                    </g>
                );
            })}

            {/* Central staircase */}
            <g>
                <path
                    d={`M ${scaledSize * 0.42} ${scaledSize * 0.87}
                        L ${scaledSize * 0.58} ${scaledSize * 0.87}
                        L ${scaledSize * 0.54} ${scaledSize * 0.28}
                        L ${scaledSize * 0.46} ${scaledSize * 0.28}
                        Z`}
                    fill="#8c7e6a"
                    stroke="#5e5042"
                    strokeWidth="0.4"
                />

                {/* Stair steps */}
                {Array.from({length: 12}, (_, i) => (
                    <line
                        key={`step-${i}`}
                        x1={scaledSize * (0.42 + i * 0.013)}
                        y1={scaledSize * (0.87 - i * 0.049)}
                        x2={scaledSize * (0.58 - i * 0.013)}
                        y2={scaledSize * (0.87 - i * 0.049)}
                        stroke="#5e5042"
                        strokeWidth="0.3"
                        opacity="0.5"
                    />
                ))}

                {/* Stair railings */}
                <rect x={scaledSize * 0.41} y={scaledSize * 0.28} width={scaledSize * 0.01} height={scaledSize * 0.59} fill="#7a6c58" />
                <rect x={scaledSize * 0.58} y={scaledSize * 0.28} width={scaledSize * 0.01} height={scaledSize * 0.59} fill="#7a6c58" />
            </g>

            {/* Temple structure on top */}
            <g>
                {/* Temple base */}
                <rect
                    x={scaledSize * 0.38}
                    y={scaledSize * 0.18}
                    width={scaledSize * 0.24}
                    height={scaledSize * 0.08}
                    fill={`url(#stone-${uniqueId})`}
                    stroke="#5e5042"
                    strokeWidth="0.4"
                />

                {/* Temple columns */}
                <rect x={scaledSize * 0.4} y={scaledSize * 0.12} width={scaledSize * 0.03} height={scaledSize * 0.06} fill="#8c7e6a" />
                <rect x={scaledSize * 0.485} y={scaledSize * 0.12} width={scaledSize * 0.03} height={scaledSize * 0.06} fill="#8c7e6a" />
                <rect x={scaledSize * 0.57} y={scaledSize * 0.12} width={scaledSize * 0.03} height={scaledSize * 0.06} fill="#8c7e6a" />

                {/* Temple roof */}
                <path
                    d={`M ${scaledSize * 0.35} ${scaledSize * 0.12}
                        L ${scaledSize * 0.5} ${scaledSize * 0.05}
                        L ${scaledSize * 0.65} ${scaledSize * 0.12}
                        Z`}
                    fill="#7a6c58"
                    stroke="#5e5042"
                    strokeWidth="0.4"
                />

                {/* Temple entrance */}
                <rect
                    x={scaledSize * 0.47}
                    y={scaledSize * 0.2}
                    width={scaledSize * 0.06}
                    height={scaledSize * 0.06}
                    fill="#2a2a2a"
                />
            </g>

            {/* Serpent head decorations at stair base */}
            <g>
                <ellipse cx={scaledSize * 0.39} cy={scaledSize * 0.86} rx={scaledSize * 0.025} ry={scaledSize * 0.02} fill="#7a6c58" />
                <ellipse cx={scaledSize * 0.61} cy={scaledSize * 0.86} rx={scaledSize * 0.025} ry={scaledSize * 0.02} fill="#7a6c58" />
            </g>
        </g>
    );
};

export default React.memo(MesoamericanPyramidSymbol);