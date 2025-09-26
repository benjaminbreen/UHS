/**
 * components/symbols/poi/GenericChurchSymbol.tsx - Renders a detailed church with cross
 */
import React from 'react';
import { Tile } from '../../../types';

interface GenericChurchSymbolProps {
  x: number; y: number; size: number; seed: number; tile: Tile;
}

const GenericChurchSymbol: React.FC<GenericChurchSymbolProps> = ({ x, y, size, seed }) => {
    const uniqueId = `church-${x}-${y}-${seed}`;
    const scaledSize = size * 1.2;
    const random = (seed + x * 137 + y * 149) % 100 / 100;
    const hasRoseWindow = random > 0.4;

    return (
        <g transform={`translate(${x}, ${y})`}>
            <defs>
                <linearGradient id={`stone-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0f0f0" />
                    <stop offset="50%" stopColor="#e0e0e0" />
                    <stop offset="100%" stopColor="#c0c0c0" />
                </linearGradient>

                <linearGradient id={`roof-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b4513" />
                    <stop offset="100%" stopColor="#654321" />
                </linearGradient>

                <pattern id={`bricks-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="2">
                    <rect width="4" height="2" fill="#e0e0e0"/>
                    <rect x="0" y="0" width="3.8" height="0.9" fill="#f0f0f0" />
                    <rect x="0" y="1" width="1.8" height="0.9" fill="#f0f0f0" />
                    <rect x="2" y="1" width="1.8" height="0.9" fill="#f0f0f0" />
                </pattern>

                <filter id={`shadow-${uniqueId}`}>
                    <feGaussianBlur stdDeviation="1" />
                </filter>
            </defs>

            {/* Ground shadow */}
            <ellipse
                cx={scaledSize * 0.52}
                cy={scaledSize * 0.88}
                rx={scaledSize * 0.35}
                ry={scaledSize * 0.08}
                fill="rgba(0,0,0,0.2)"
                filter={`url(#shadow-${uniqueId})`}
            />

            {/* Main church body */}
            <rect
                x={scaledSize * 0.2}
                y={scaledSize * 0.45}
                width={scaledSize * 0.6}
                height={scaledSize * 0.4}
                fill={`url(#bricks-${uniqueId})`}
                stroke="#696969"
                strokeWidth="0.3"
            />

            {/* Side wall with perspective */}
            <path
                d={`M ${scaledSize * 0.8} ${scaledSize * 0.45}
                    L ${scaledSize * 0.88} ${scaledSize * 0.4}
                    L ${scaledSize * 0.88} ${scaledSize * 0.78}
                    L ${scaledSize * 0.8} ${scaledSize * 0.85}
                    Z`}
                fill="#c0c0c0"
                stroke="#696969"
                strokeWidth="0.3"
            />

            {/* Bell tower/steeple */}
            <rect
                x={scaledSize * 0.42}
                y={scaledSize * 0.15}
                width={scaledSize * 0.16}
                height={scaledSize * 0.35}
                fill={`url(#stone-${uniqueId})`}
                stroke="#696969"
                strokeWidth="0.3"
            />

            {/* Bell tower windows */}
            <rect
                x={scaledSize * 0.47}
                y={scaledSize * 0.22}
                width={scaledSize * 0.06}
                height={scaledSize * 0.1}
                fill="#2a2a2a"
                stroke="#696969"
                strokeWidth="0.2"
            />

            {/* Bell visible in tower */}
            <ellipse
                cx={scaledSize * 0.5}
                cy={scaledSize * 0.27}
                rx={scaledSize * 0.02}
                ry={scaledSize * 0.015}
                fill="#8b7355"
            />

            {/* Steeple roof */}
            <path
                d={`M ${scaledSize * 0.4} ${scaledSize * 0.15}
                    L ${scaledSize * 0.5} ${scaledSize * 0.05}
                    L ${scaledSize * 0.6} ${scaledSize * 0.15}
                    Z`}
                fill={`url(#roof-${uniqueId})`}
                stroke="#654321"
                strokeWidth="0.3"
            />

            {/* Cross on top */}
            <g>
                {/* Vertical beam */}
                <rect
                    x={scaledSize * 0.49}
                    y={scaledSize * -0.02}
                    width={scaledSize * 0.02}
                    height={scaledSize * 0.08}
                    fill="#ffd700"
                    stroke="#b8860b"
                    strokeWidth="0.15"
                />
                {/* Horizontal beam */}
                <rect
                    x={scaledSize * 0.47}
                    y={scaledSize * 0.01}
                    width={scaledSize * 0.06}
                    height={scaledSize * 0.02}
                    fill="#ffd700"
                    stroke="#b8860b"
                    strokeWidth="0.15"
                />
            </g>

            {/* Main roof */}
            <path
                d={`M ${scaledSize * 0.13} ${scaledSize * 0.45}
                    L ${scaledSize * 0.5} ${scaledSize * 0.25}
                    L ${scaledSize * 0.87} ${scaledSize * 0.45}
                    L ${scaledSize * 0.8} ${scaledSize * 0.47}
                    L ${scaledSize * 0.5} ${scaledSize * 0.3}
                    L ${scaledSize * 0.2} ${scaledSize * 0.47}
                    Z`}
                fill={`url(#roof-${uniqueId})`}
                stroke="#654321"
                strokeWidth="0.4"
            />

            {/* Roof shingles detail */}
            {Array.from({length: 4}, (_, i) => (
                <line
                    key={`shingle-${i}`}
                    x1={scaledSize * (0.2 + i * 0.15)}
                    y1={scaledSize * (0.47 - i * 0.05)}
                    x2={scaledSize * (0.8 - i * 0.15)}
                    y2={scaledSize * (0.47 - i * 0.05)}
                    stroke="#654321"
                    strokeWidth="0.2"
                    opacity="0.3"
                />
            ))}

            {/* Arched entrance door */}
            <path
                d={`M ${scaledSize * 0.45} ${scaledSize * 0.85}
                    L ${scaledSize * 0.45} ${scaledSize * 0.7}
                    Q ${scaledSize * 0.5} ${scaledSize * 0.65}, ${scaledSize * 0.55} ${scaledSize * 0.7}
                    L ${scaledSize * 0.55} ${scaledSize * 0.85}
                    Z`}
                fill="#4a2c2a"
                stroke="#2a1a1a"
                strokeWidth="0.3"
            />

            {/* Door handle */}
            <circle
                cx={scaledSize * 0.52}
                cy={scaledSize * 0.78}
                r={scaledSize * 0.005}
                fill="#8b7355"
            />

            {/* Rose window or regular windows */}
            {hasRoseWindow ? (
                <g>
                    {/* Rose window */}
                    <circle
                        cx={scaledSize * 0.5}
                        cy={scaledSize * 0.55}
                        r={scaledSize * 0.08}
                        fill="none"
                        stroke="#696969"
                        strokeWidth="0.3"
                    />
                    {/* Rose window pattern */}
                    {Array.from({length: 8}, (_, i) => {
                        const angle = (i * Math.PI * 2) / 8;
                        return (
                            <line
                                key={`spoke-${i}`}
                                x1={scaledSize * 0.5}
                                y1={scaledSize * 0.55}
                                x2={scaledSize * (0.5 + Math.cos(angle) * 0.08)}
                                y2={scaledSize * (0.55 + Math.sin(angle) * 0.08)}
                                stroke="#696969"
                                strokeWidth="0.2"
                            />
                        );
                    })}
                    <circle
                        cx={scaledSize * 0.5}
                        cy={scaledSize * 0.55}
                        r={scaledSize * 0.03}
                        fill="#4169e1"
                        opacity="0.3"
                    />
                </g>
            ) : (
                <g>
                    {/* Regular arched windows */}
                    <path
                        d={`M ${scaledSize * 0.3} ${scaledSize * 0.65}
                            L ${scaledSize * 0.3} ${scaledSize * 0.55}
                            Q ${scaledSize * 0.33} ${scaledSize * 0.52}, ${scaledSize * 0.36} ${scaledSize * 0.55}
                            L ${scaledSize * 0.36} ${scaledSize * 0.65}
                            Z`}
                        fill="#2a2a2a"
                        stroke="#696969"
                        strokeWidth="0.2"
                    />
                    <path
                        d={`M ${scaledSize * 0.64} ${scaledSize * 0.65}
                            L ${scaledSize * 0.64} ${scaledSize * 0.55}
                            Q ${scaledSize * 0.67} ${scaledSize * 0.52}, ${scaledSize * 0.7} ${scaledSize * 0.55}
                            L ${scaledSize * 0.7} ${scaledSize * 0.65}
                            Z`}
                        fill="#2a2a2a"
                        stroke="#696969"
                        strokeWidth="0.2"
                    />
                </g>
            )}

            {/* Foundation stones */}
            <rect
                x={scaledSize * 0.18}
                y={scaledSize * 0.83}
                width={scaledSize * 0.64}
                height={scaledSize * 0.04}
                fill="#8b8b8b"
                stroke="#696969"
                strokeWidth="0.2"
            />
        </g>
    );
};

export default React.memo(GenericChurchSymbol);