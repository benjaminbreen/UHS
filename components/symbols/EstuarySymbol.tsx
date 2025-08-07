/**
 * components/symbols/standardMap/EstuarySymbol.tsx - Renders beautifully animated circling seagulls for estuaries.
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface EstuarySymbolProps { 
    x: number; 
    y: number; 
    size: number; 
    seed: number; 
    tileX: number; 
    tileY: number; 
}

const EstuarySymbol: React.FC<EstuarySymbolProps> = React.memo(({ x, y, size, seed, tileX, tileY }) => {
    const localRand = () => new ValueNoise(seed + tileX * 23 + tileY * 89 + (seed % 101)).random();
    const elements = [];

    // Only spawn birds occasionally - roughly 1 in 9 estuary tiles
    if ((tileX + tileY + Math.floor(seed/10)) % 9 === 0) {
        const animationDuration = 10 + (localRand() * 12); 
        const animationDelay = -(localRand() * animationDuration); 
        const scaleVariation = 0.9 + (localRand() * 0.9); 
        
        // Seagull proportions based on tile size
        const bodyLength = size * 0.18;
        const wingSpan = size * 0.16;
        const headWidth = size * 0.03;
        const bodyWidth = size * 0.025;
        const tailWidth = size * 0.04;
        
        // Detailed seagull body path
        const bodyPath = `
            M 0 -${bodyLength/2}
            Q -${headWidth} -${bodyLength/2 + size*0.01} -${headWidth} -${bodyLength/2 + size*0.02}
            Q -${bodyWidth} -${bodyLength/4} -${bodyWidth} 0
            Q -${bodyWidth} ${bodyLength/4} -${tailWidth/2} ${bodyLength/2 - size*0.01}
            Q 0 ${bodyLength/2 + size*0.01} ${tailWidth/2} ${bodyLength/2 - size*0.01}
            Q ${bodyWidth} ${bodyLength/4} ${bodyWidth} 0
            Q ${bodyWidth} -${bodyLength/4} ${headWidth} -${bodyLength/2 + size*0.02}
            Q ${headWidth} -${bodyLength/2 + size*0.01} 0 -${bodyLength/2}
            Z
        `;
        
        // Left wing path
        const leftWingPath = `
            M -${bodyWidth} -${size*0.02}
            Q -${wingSpan*0.7} -${size*0.04} -${wingSpan} -${size*0.01}
            Q -${wingSpan*0.95} ${size*0.01} -${wingSpan*0.8} ${size*0.04}
            Q -${wingSpan*0.5} ${size*0.06} -${bodyWidth} ${size*0.03}
            Z
        `;
        
        // Right wing path
        const rightWingPath = `
            M ${bodyWidth} -${size*0.02}
            Q ${wingSpan*0.7} -${size*0.04} ${wingSpan} -${size*0.01}
            Q ${wingSpan*0.95} ${size*0.01} ${wingSpan*0.8} ${size*0.04}
            Q ${wingSpan*0.5} ${size*0.06} ${bodyWidth} ${size*0.03}
            Z
        `;

        // Create the animated seagull group with inline keyframes
        elements.push(
            <g key="bird-defs">
                <defs>
                    <style>
                        {`
                            @keyframes circlingBird {
                                0% { 
                                    transform: translate(0px, 8px) rotate(0deg) scale(0.6); 
                                    opacity: 0; 
                                }
                                5% { 
                                    opacity: 0.1; 
                                }
                                20% { 
                                    opacity: 0.7; 
                                }
                                50% { 
                                    transform: translate(0px, -8px) rotate(180deg) scale(0.8); 
                                    opacity: 0.9; 
                                }
                                80% { 
                                    opacity: 0.7; 
                                }
                                95% { 
                                    opacity: 0.1; 
                                }
                                100% { 
                                    transform: translate(0px, 8px) rotate(360deg) scale(0.6); 
                                    opacity: 0; 
                                }
                            }
                        `}
                    </style>
                </defs>
            </g>
        );

        elements.push(
            <g 
                key="circling-seagull-wrapper" 
                transform={`translate(${x + size / 2}, ${y + size / 2}) scale(${scaleVariation})`}
                style={{
                    animation: `circlingBird ${animationDuration}s linear infinite ${animationDelay}s`
                } as React.CSSProperties}
            >
                {/* Seagull body */}
                <path
                    key="seagull-body"
                    d={bodyPath}
                    fill="rgba(245,245,245,0.95)"
                    stroke="rgba(60,60,60,0.8)"
                    strokeWidth={size*0.008}
                />
                
                {/* Left wing */}
                <path
                    key="seagull-left-wing"
                    d={leftWingPath}
                    fill="rgba(235,235,235,0.9)"
                    stroke="rgba(80,80,80,0.7)"
                    strokeWidth={size*0.006}
                />
                
                {/* Right wing */}
                <path
                    key="seagull-right-wing"
                    d={rightWingPath}
                    fill="rgba(235,235,235,0.9)"
                    stroke="rgba(80,80,80,0.7)"
                    strokeWidth={size*0.006}
                />
                
                {/* Left wingtip (dark spot) */}
                <circle
                    key="seagull-left-wingtip"
                    cx={-wingSpan*0.85}
                    cy={size*0.005}
                    r={size*0.015}
                    fill="rgba(40,40,40,0.6)"
                />
                
                {/* Right wingtip (dark spot) */}
                <circle
                    key="seagull-right-wingtip"
                    cx={wingSpan*0.85}
                    cy={size*0.005}
                    r={size*0.015}
                    fill="rgba(40,40,40,0.6)"
                />
                
                {/* Seagull head */}
                <circle
                    key="seagull-head"
                    cx={0}
                    cy={-bodyLength/2 + size*0.015}
                    r={size*0.02}
                    fill="rgba(250,250,250,0.95)"
                    stroke="rgba(40,40,40,0.7)"
                    strokeWidth={size*0.005}
                />
            </g>
        );
    }
    
    return <>{elements}</>;
});

export default EstuarySymbol;