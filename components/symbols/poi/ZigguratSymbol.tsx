/**
 * components/symbols/poi/ZigguratSymbol.tsx - Renders a detailed Ziggurat
 */
import React from 'react';
import { Tile } from '../../../types';

interface ZigguratSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const ZigguratSymbol: React.FC<ZigguratSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `ziggurat-${x}-${y}-${seed}`;
    const scaledSize = size * 1.25;
    const random = (seed + x * 137 + y * 149) % 100 / 100;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                <linearGradient id={`brick-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#daa965" />
                    <stop offset="50%" stopColor="#c2955a" />
                    <stop offset="100%" stopColor="#a67c52" />
                </linearGradient>

                <linearGradient id={`shadow-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b6239" />
                    <stop offset="100%" stopColor="#6b4a2c" />
                </linearGradient>

                <pattern id={`bricks-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="3">
                    <rect width="6" height="3" fill="#c2955a"/>
                    <rect x="0" y="0" width="5.8" height="1.3" fill="#daa965" />
                    <rect x="0" y="1.5" width="2.8" height="1.3" fill="#daa965" />
                    <rect x="3" y="1.5" width="2.8" height="1.3" fill="#daa965" />
                </pattern>

                <filter id={`blur-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="1.5" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx={scaledSize * 0.55}
                cy={scaledSize * 0.85}
                rx={scaledSize * 0.42}
                ry={scaledSize * 0.1}
                fill="rgba(0,0,0,0.25)"
                filter={`url(#blur-${uniqueId})`}
            />

            {/* Ziggurat tiers */}
            {[0, 1, 2, 3, 4].map(tier => {
                const tierWidth = scaledSize * (0.9 - tier * 0.16);
                const tierHeight = scaledSize * 0.13;
                const tierX = (scaledSize - tierWidth) / 2;
                const tierY = scaledSize * (0.72 - tier * 0.14);
                const sideOffset = scaledSize * 0.1 * (1 - tier * 0.15);

                return (
                    <g key={`tier-${tier}`}>
                        {/* Right side face with correct perspective */}
                        <path
                            d={`M ${tierX + tierWidth} ${tierY}
                                L ${tierX + tierWidth + sideOffset} ${tierY - sideOffset * 0.4}
                                L ${tierX + tierWidth + sideOffset} ${tierY + tierHeight - sideOffset * 0.4}
                                L ${tierX + tierWidth} ${tierY + tierHeight}
                                Z`}
                            fill={`url(#shadow-${uniqueId})`}
                            stroke="#6b4a2c"
                            strokeWidth="0.3"
                        />

                        {/* Front face with brick pattern */}
                        <rect
                            x={tierX}
                            y={tierY}
                            width={tierWidth}
                            height={tierHeight}
                            fill={`url(#bricks-${uniqueId})`}
                            stroke="#8b6239"
                            strokeWidth="0.4"
                        />

                        {/* Top surface */}
                        <path
                            d={`M ${tierX} ${tierY}
                                L ${tierX + sideOffset} ${tierY - sideOffset * 0.4}
                                L ${tierX + tierWidth + sideOffset} ${tierY - sideOffset * 0.4}
                                L ${tierX + tierWidth} ${tierY}
                                Z`}
                            fill={`url(#brick-${uniqueId})`}
                            stroke="#8b6239"
                            strokeWidth="0.3"
                            opacity="0.95"
                        />

                        {/* Decorative elements on first tier */}
                        {tier === 0 && (
                            <g opacity="0.5">
                                {/* Mesopotamian-style reliefs */}
                                <rect x={tierX + tierWidth * 0.2} y={tierY + tierHeight * 0.3} width="2" height={tierHeight * 0.4} fill="#6b4a2c" />
                                <rect x={tierX + tierWidth * 0.4} y={tierY + tierHeight * 0.3} width="2" height={tierHeight * 0.4} fill="#6b4a2c" />
                                <rect x={tierX + tierWidth * 0.6} y={tierY + tierHeight * 0.3} width="2" height={tierHeight * 0.4} fill="#6b4a2c" />
                                <rect x={tierX + tierWidth * 0.8} y={tierY + tierHeight * 0.3} width="2" height={tierHeight * 0.4} fill="#6b4a2c" />
                            </g>
                        )}
                    </g>
                );
            })}

            {/* Central staircase with ramps */}
            <g>
                {/* Main ramp */}
                <path
                    d={`M ${scaledSize * 0.44} ${scaledSize * 0.85}
                        L ${scaledSize * 0.56} ${scaledSize * 0.85}
                        L ${scaledSize * 0.54} ${scaledSize * 0.15}
                        L ${scaledSize * 0.46} ${scaledSize * 0.15}
                        Z`}
                    fill="#a67c52"
                    stroke="#6b4a2c"
                    strokeWidth="0.4"
                />

                {/* Stair grooves */}
                {Array.from({length: 15}, (_, i) => (
                    <line
                        key={`step-${i}`}
                        x1={scaledSize * (0.44 + i * 0.008)}
                        y1={scaledSize * (0.85 - i * 0.047)}
                        x2={scaledSize * (0.56 - i * 0.008)}
                        y2={scaledSize * (0.85 - i * 0.047)}
                        stroke="#6b4a2c"
                        strokeWidth="0.2"
                        opacity="0.4"
                    />
                ))}

                {/* Side walls of staircase */}
                <rect x={scaledSize * 0.43} y={scaledSize * 0.15} width={scaledSize * 0.01} height={scaledSize * 0.7} fill="#8b6239" />
                <rect x={scaledSize * 0.56} y={scaledSize * 0.15} width={scaledSize * 0.01} height={scaledSize * 0.7} fill="#8b6239" />
            </g>

            {/* Temple structure on top */}
            <g>
                {/* Temple base platform */}
                <rect
                    x={scaledSize * 0.35}
                    y={scaledSize * 0.08}
                    width={scaledSize * 0.3}
                    height={scaledSize * 0.06}
                    fill={`url(#brick-${uniqueId})`}
                    stroke="#6b4a2c"
                    strokeWidth="0.4"
                />

                {/* Temple walls */}
                <rect
                    x={scaledSize * 0.38}
                    y={scaledSize * 0.02}
                    width={scaledSize * 0.24}
                    height={scaledSize * 0.06}
                    fill="#c2955a"
                    stroke="#6b4a2c"
                    strokeWidth="0.3"
                />

                {/* Temple entrance columns */}
                <rect x={scaledSize * 0.42} y={scaledSize * 0.02} width={scaledSize * 0.02} height={scaledSize * 0.06} fill="#8b6239" />
                <rect x={scaledSize * 0.48} y={scaledSize * 0.02} width={scaledSize * 0.02} height={scaledSize * 0.06} fill="#8b6239" />
                <rect x={scaledSize * 0.54} y={scaledSize * 0.02} width={scaledSize * 0.02} height={scaledSize * 0.06} fill="#8b6239" />

                {/* Temple entrance */}
                <rect
                    x={scaledSize * 0.47}
                    y={scaledSize * 0.04}
                    width={scaledSize * 0.06}
                    height={scaledSize * 0.04}
                    fill="#1a1a1a"
                />

                {/* Cuneiform-style decoration */}
                <g opacity="0.6">
                    <text
                        x={scaledSize * 0.4}
                        y={scaledSize * 0.12}
                        fontSize={scaledSize * 0.02}
                        fill="#6b4a2c"
                        fontFamily="monospace"
                    >𒀭𒂗𒆤</text>
                    <text
                        x={scaledSize * 0.54}
                        y={scaledSize * 0.12}
                        fontSize={scaledSize * 0.02}
                        fill="#6b4a2c"
                        fontFamily="monospace"
                    >𒀭𒌓</text>
                </g>
            </g>

            {/* Gate guardians (lamassu-inspired) at stair base */}
            <g>
                <ellipse cx={scaledSize * 0.4} cy={scaledSize * 0.83} rx={scaledSize * 0.02} ry={scaledSize * 0.025} fill="#8b6239" />
                <ellipse cx={scaledSize * 0.6} cy={scaledSize * 0.83} rx={scaledSize * 0.02} ry={scaledSize * 0.025} fill="#8b6239" />
            </g>
        </g>
    );
};

export default React.memo(ZigguratSymbol);