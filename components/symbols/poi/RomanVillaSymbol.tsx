/**
 * components/symbols/poi/RomanVillaSymbol.tsx - Renders a Roman Villa with atrium
 */
import React from 'react';
import { Tile } from '../../../types';

interface RomanVillaSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const RomanVillaSymbol: React.FC<RomanVillaSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `villa-${x}-${y}-${seed}`;
    const scaledSize = size * 1.25;
    const random = (seed + x * 137 + y * 149) % 100 / 100;
    const hasGarden = random > 0.3;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                <linearGradient id={`wall-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fdf5e6" />
                    <stop offset="100%" stopColor="#f5e6d3" />
                </linearGradient>

                <linearGradient id={`roof-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d2691e" />
                    <stop offset="50%" stopColor="#b22222" />
                    <stop offset="100%" stopColor="#8b1a1a" />
                </linearGradient>

                <pattern id={`mosaic-${uniqueId}`} patternUnits="userSpaceOnUse" width="3" height="3">
                    <rect width="3" height="3" fill="#cd853f"/>
                    <rect x="0.5" y="0.5" width="2" height="2" fill="#daa520" />
                    <rect x="1" y="1" width="1" height="1" fill="#b8860b" />
                </pattern>

                <filter id={`shadow-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="1.5" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx={scaledSize * 0.55}
                cy={scaledSize * 0.88}
                rx={scaledSize * 0.45}
                ry={scaledSize * 0.1}
                fill="rgba(0,0,0,0.2)"
                filter={`url(#shadow-${uniqueId})`}
            />

            {/* Main villa structure with wings */}
            <g>
                {/* Left wing */}
                <rect
                    x={scaledSize * 0.1}
                    y={scaledSize * 0.35}
                    width={scaledSize * 0.25}
                    height={scaledSize * 0.45}
                    fill={`url(#wall-${uniqueId})`}
                    stroke="#8b4513"
                    strokeWidth="0.4"
                />

                {/* Right wing */}
                <rect
                    x={scaledSize * 0.65}
                    y={scaledSize * 0.35}
                    width={scaledSize * 0.25}
                    height={scaledSize * 0.45}
                    fill={`url(#wall-${uniqueId})`}
                    stroke="#8b4513"
                    strokeWidth="0.4"
                />

                {/* Back section */}
                <rect
                    x={scaledSize * 0.2}
                    y={scaledSize * 0.25}
                    width={scaledSize * 0.6}
                    height={scaledSize * 0.25}
                    fill={`url(#wall-${uniqueId})`}
                    stroke="#8b4513"
                    strokeWidth="0.4"
                />

                {/* Front colonnade */}
                <rect
                    x={scaledSize * 0.2}
                    y={scaledSize * 0.65}
                    width={scaledSize * 0.6}
                    height={scaledSize * 0.15}
                    fill="none"
                    stroke="#8b4513"
                    strokeWidth="0.3"
                />
            </g>

            {/* Central atrium/courtyard */}
            <g>
                <rect
                    x={scaledSize * 0.35}
                    y={scaledSize * 0.45}
                    width={scaledSize * 0.3}
                    height={scaledSize * 0.25}
                    fill={`url(#mosaic-${uniqueId})`}
                    stroke="#8b4513"
                    strokeWidth="0.3"
                    opacity="0.8"
                />

                {/* Impluvium (central pool) */}
                <rect
                    x={scaledSize * 0.43}
                    y={scaledSize * 0.53}
                    width={scaledSize * 0.14}
                    height={scaledSize * 0.09}
                    fill="#4682b4"
                    stroke="#2e5266"
                    strokeWidth="0.3"
                    opacity="0.7"
                />

                {/* Fountain in center */}
                <circle
                    cx={scaledSize * 0.5}
                    cy={scaledSize * 0.575}
                    r={scaledSize * 0.015}
                    fill="#808080"
                />
                <path
                    d={`M ${scaledSize * 0.5} ${scaledSize * 0.56}
                        Q ${scaledSize * 0.49} ${scaledSize * 0.54}, ${scaledSize * 0.48} ${scaledSize * 0.55}
                        M ${scaledSize * 0.5} ${scaledSize * 0.56}
                        Q ${scaledSize * 0.51} ${scaledSize * 0.54}, ${scaledSize * 0.52} ${scaledSize * 0.55}`}
                    stroke="#87ceeb"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.6"
                />
            </g>

            {/* Detailed columns with capitals */}
            {Array.from({ length: 6 }, (_, i) => {
                const colX = scaledSize * (0.22 + i * 0.095);
                return (
                    <g key={`column-${i}`}>
                        {/* Column base */}
                        <rect
                            x={colX - scaledSize * 0.015}
                            y={scaledSize * 0.76}
                            width={scaledSize * 0.03}
                            height={scaledSize * 0.02}
                            fill="#d3d3d3"
                            stroke="#696969"
                            strokeWidth="0.2"
                        />

                        {/* Column shaft */}
                        <rect
                            x={colX - scaledSize * 0.012}
                            y={scaledSize * 0.68}
                            width={scaledSize * 0.024}
                            height={scaledSize * 0.08}
                            fill="#fff8dc"
                            stroke="#8b7355"
                            strokeWidth="0.2"
                        />

                        {/* Ionic capital */}
                        <ellipse
                            cx={colX - scaledSize * 0.01}
                            cy={scaledSize * 0.67}
                            rx={scaledSize * 0.008}
                            ry={scaledSize * 0.006}
                            fill="#fff8dc"
                            stroke="#8b7355"
                            strokeWidth="0.15"
                        />
                        <ellipse
                            cx={colX + scaledSize * 0.01}
                            cy={scaledSize * 0.67}
                            rx={scaledSize * 0.008}
                            ry={scaledSize * 0.006}
                            fill="#fff8dc"
                            stroke="#8b7355"
                            strokeWidth="0.15"
                        />
                    </g>
                );
            })}

            {/* Red tile roofs */}
            <g>
                {/* Main roof */}
                <path
                    d={`M ${scaledSize * 0.15} ${scaledSize * 0.28}
                        L ${scaledSize * 0.5} ${scaledSize * 0.12}
                        L ${scaledSize * 0.85} ${scaledSize * 0.28}
                        L ${scaledSize * 0.8} ${scaledSize * 0.3}
                        L ${scaledSize * 0.5} ${scaledSize * 0.16}
                        L ${scaledSize * 0.2} ${scaledSize * 0.3}
                        Z`}
                    fill={`url(#roof-${uniqueId})`}
                    stroke="#8b1a1a"
                    strokeWidth="0.4"
                />

                {/* Roof tiles pattern */}
                {Array.from({length: 5}, (_, i) => (
                    <line
                        key={`tile-${i}`}
                        x1={scaledSize * (0.2 + i * 0.12)}
                        y1={scaledSize * (0.3 - i * 0.036)}
                        x2={scaledSize * (0.8 - i * 0.12)}
                        y2={scaledSize * (0.3 - i * 0.036)}
                        stroke="#8b1a1a"
                        strokeWidth="0.2"
                        opacity="0.3"
                    />
                ))}

                {/* Left wing roof */}
                <path
                    d={`M ${scaledSize * 0.08} ${scaledSize * 0.35}
                        L ${scaledSize * 0.225} ${scaledSize * 0.28}
                        L ${scaledSize * 0.37} ${scaledSize * 0.35}
                        Z`}
                    fill={`url(#roof-${uniqueId})`}
                    stroke="#8b1a1a"
                    strokeWidth="0.3"
                />

                {/* Right wing roof */}
                <path
                    d={`M ${scaledSize * 0.63} ${scaledSize * 0.35}
                        L ${scaledSize * 0.775} ${scaledSize * 0.28}
                        L ${scaledSize * 0.92} ${scaledSize * 0.35}
                        Z`}
                    fill={`url(#roof-${uniqueId})`}
                    stroke="#8b1a1a"
                    strokeWidth="0.3"
                />
            </g>

            {/* Garden elements if present */}
            {hasGarden && (
                <g opacity="0.7">
                    {/* Cypress trees */}
                    <ellipse cx={scaledSize * 0.12} cy={scaledSize * 0.5} rx={scaledSize * 0.02} ry={scaledSize * 0.06} fill="#228b22" />
                    <ellipse cx={scaledSize * 0.88} cy={scaledSize * 0.5} rx={scaledSize * 0.02} ry={scaledSize * 0.06} fill="#228b22" />

                    {/* Small shrubs */}
                    <circle cx={scaledSize * 0.25} cy={scaledSize * 0.82} r={scaledSize * 0.015} fill="#6b8e23" />
                    <circle cx={scaledSize * 0.75} cy={scaledSize * 0.82} r={scaledSize * 0.015} fill="#6b8e23" />
                </g>
            )}

            {/* Entrance with arch */}
            <path
                d={`M ${scaledSize * 0.47} ${scaledSize * 0.78}
                    L ${scaledSize * 0.47} ${scaledSize * 0.72}
                    Q ${scaledSize * 0.5} ${scaledSize * 0.69}, ${scaledSize * 0.53} ${scaledSize * 0.72}
                    L ${scaledSize * 0.53} ${scaledSize * 0.78}
                    Z`}
                fill="#2a2a2a"
                stroke="#8b4513"
                strokeWidth="0.2"
            />
        </g>
    );
};

export default React.memo(RomanVillaSymbol);