/**
 * components/symbols/poi/ShrineSymbol.tsx - Renders a torii gate shrine
 */
import React from 'react';
import { Tile } from '../../../types';

interface ShrineSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const ShrineSymbol: React.FC<ShrineSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `shrine-${x}-${y}-${seed}`;
    const scaledSize = size * 1.15;
    const random = (seed + x * 137 + y * 149) % 100 / 100;
    const isTorii = random > 0.3; // 70% chance of torii gate style

    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                <linearGradient id={`vermillion-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6347" />
                    <stop offset="50%" stopColor="#dc143c" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>

                <linearGradient id={`wood-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b4513" />
                    <stop offset="100%" stopColor="#5d2f0e" />
                </linearGradient>

                <filter id={`shadow-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="1" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx={scaledSize * 0.5}
                cy={scaledSize * 0.88}
                rx={scaledSize * 0.35}
                ry={scaledSize * 0.08}
                fill="rgba(0,0,0,0.2)"
                filter={`url(#shadow-${uniqueId})`}
            />

            {isTorii ? (
                // Torii gate style
                <g>
                    {/* Vertical posts (hashira) */}
                    <rect
                        x={scaledSize * 0.15}
                        y={scaledSize * 0.25}
                        width={scaledSize * 0.08}
                        height={scaledSize * 0.6}
                        fill={`url(#vermillion-${uniqueId})`}
                        stroke="#8b0000"
                        strokeWidth="0.3"
                    />
                    <rect
                        x={scaledSize * 0.77}
                        y={scaledSize * 0.25}
                        width={scaledSize * 0.08}
                        height={scaledSize * 0.6}
                        fill={`url(#vermillion-${uniqueId})`}
                        stroke="#8b0000"
                        strokeWidth="0.3"
                    />

                    {/* Top crossbeam (kasagi) with curved ends */}
                    <path
                        d={`M ${scaledSize * 0.05} ${scaledSize * 0.18}
                            Q ${scaledSize * 0.08} ${scaledSize * 0.15}, ${scaledSize * 0.12} ${scaledSize * 0.15}
                            L ${scaledSize * 0.88} ${scaledSize * 0.15}
                            Q ${scaledSize * 0.92} ${scaledSize * 0.15}, ${scaledSize * 0.95} ${scaledSize * 0.18}
                            L ${scaledSize * 0.95} ${scaledSize * 0.22}
                            Q ${scaledSize * 0.92} ${scaledSize * 0.22}, ${scaledSize * 0.88} ${scaledSize * 0.22}
                            L ${scaledSize * 0.12} ${scaledSize * 0.22}
                            Q ${scaledSize * 0.08} ${scaledSize * 0.22}, ${scaledSize * 0.05} ${scaledSize * 0.22}
                            Z`}
                        fill={`url(#vermillion-${uniqueId})`}
                        stroke="#8b0000"
                        strokeWidth="0.4"
                    />

                    {/* Lower crossbeam (nuki) */}
                    <rect
                        x={scaledSize * 0.1}
                        y={scaledSize * 0.32}
                        width={scaledSize * 0.8}
                        height={scaledSize * 0.06}
                        fill={`url(#vermillion-${uniqueId})`}
                        stroke="#8b0000"
                        strokeWidth="0.3"
                    />

                    {/* Central plaque (gakuzuka) */}
                    <rect
                        x={scaledSize * 0.4}
                        y={scaledSize * 0.24}
                        width={scaledSize * 0.2}
                        height={scaledSize * 0.12}
                        fill="#1a1a1a"
                        stroke="#8b0000"
                        strokeWidth="0.2"
                    />

                    {/* Kanji character */}
                    <text
                        x={scaledSize * 0.5}
                        y={scaledSize * 0.31}
                        fontSize={scaledSize * 0.06}
                        fill="#ffd700"
                        textAnchor="middle"
                        fontFamily="serif"
                    >神</text>

                    {/* Stone lanterns at base */}
                    <g>
                        <rect x={scaledSize * 0.28} y={scaledSize * 0.75} width={scaledSize * 0.06} height={scaledSize * 0.1} fill="#808080" />
                        <rect x={scaledSize * 0.27} y={scaledSize * 0.72} width={scaledSize * 0.08} height={scaledSize * 0.03} fill="#696969" />

                        <rect x={scaledSize * 0.66} y={scaledSize * 0.75} width={scaledSize * 0.06} height={scaledSize * 0.1} fill="#808080" />
                        <rect x={scaledSize * 0.65} y={scaledSize * 0.72} width={scaledSize * 0.08} height={scaledSize * 0.03} fill="#696969" />
                    </g>

                    {/* Decorative rope (shimenawa) */}
                    <path
                        d={`M ${scaledSize * 0.15} ${scaledSize * 0.28}
                            Q ${scaledSize * 0.3} ${scaledSize * 0.26}, ${scaledSize * 0.5} ${scaledSize * 0.28}
                            Q ${scaledSize * 0.7} ${scaledSize * 0.26}, ${scaledSize * 0.85} ${scaledSize * 0.28}`}
                        fill="none"
                        stroke="#d4a574"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />

                    {/* Paper streamers (shide) */}
                    <g opacity="0.9">
                        <path d={`M ${scaledSize * 0.3} ${scaledSize * 0.27} l 0 ${scaledSize * 0.05} l ${scaledSize * 0.02} -${scaledSize * 0.02}`} fill="#ffffff" />
                        <path d={`M ${scaledSize * 0.5} ${scaledSize * 0.27} l 0 ${scaledSize * 0.05} l ${scaledSize * 0.02} -${scaledSize * 0.02}`} fill="#ffffff" />
                        <path d={`M ${scaledSize * 0.7} ${scaledSize * 0.27} l 0 ${scaledSize * 0.05} l ${scaledSize * 0.02} -${scaledSize * 0.02}`} fill="#ffffff" />
                    </g>
                </g>
            ) : (
                // Traditional small shrine building
                <g>
                    {/* Base platform */}
                    <rect
                        x={scaledSize * 0.25}
                        y={scaledSize * 0.75}
                        width={scaledSize * 0.5}
                        height={scaledSize * 0.08}
                        fill="#808080"
                        stroke="#696969"
                        strokeWidth="0.3"
                    />

                    {/* Posts */}
                    <rect x={scaledSize * 0.3} y={scaledSize * 0.45} width={scaledSize * 0.05} height={scaledSize * 0.3} fill={`url(#wood-${uniqueId})`} />
                    <rect x={scaledSize * 0.65} y={scaledSize * 0.45} width={scaledSize * 0.05} height={scaledSize * 0.3} fill={`url(#wood-${uniqueId})`} />

                    {/* Walls */}
                    <rect
                        x={scaledSize * 0.32}
                        y={scaledSize * 0.5}
                        width={scaledSize * 0.36}
                        height={scaledSize * 0.25}
                        fill="#f5f5dc"
                        stroke="#8b4513"
                        strokeWidth="0.3"
                    />

                    {/* Roof */}
                    <path
                        d={`M ${scaledSize * 0.2} ${scaledSize * 0.48}
                            L ${scaledSize * 0.5} ${scaledSize * 0.3}
                            L ${scaledSize * 0.8} ${scaledSize * 0.48}
                            L ${scaledSize * 0.75} ${scaledSize * 0.5}
                            L ${scaledSize * 0.5} ${scaledSize * 0.35}
                            L ${scaledSize * 0.25} ${scaledSize * 0.5}
                            Z`}
                        fill="#4a4a4a"
                        stroke="#2a2a2a"
                        strokeWidth="0.4"
                    />

                    {/* Entrance */}
                    <rect
                        x={scaledSize * 0.45}
                        y={scaledSize * 0.6}
                        width={scaledSize * 0.1}
                        height={scaledSize * 0.15}
                        fill="#2a2a2a"
                    />

                    {/* Offering box */}
                    <rect
                        x={scaledSize * 0.42}
                        y={scaledSize * 0.68}
                        width={scaledSize * 0.16}
                        height={scaledSize * 0.05}
                        fill="#8b4513"
                        stroke="#5d2f0e"
                        strokeWidth="0.2"
                    />
                </g>
            )}
        </g>
    );
};

export default React.memo(ShrineSymbol);