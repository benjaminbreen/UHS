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

    // Add white caps to all estuary tiles as indicators
    const whiteCaps = (
        <g key="white-caps">
            {/* First white cap */}
            <path
                d={`M ${size * 0.3} ${size * 0.4} Q ${size * 0.35} ${size * 0.38} ${size * 0.4} ${size * 0.4}`}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={size * 0.01}
                fill="none"
                strokeLinecap="round"
            />
            {/* Second white cap */}
            <path
                d={`M ${size * 0.6} ${size * 0.6} Q ${size * 0.65} ${size * 0.58} ${size * 0.7} ${size * 0.6}`}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={size * 0.008}
                fill="none"
                strokeLinecap="round"
            />
        </g>
    );

    // Bird element - only spawn occasionally (roughly 1 in 12 estuary tiles)
    let birdElement = null;
    if ((tileX + tileY + Math.floor(seed/10)) % 22 === 0) {
        const animationDuration = 15 + (localRand() * 10); // Slower
        const animationDelay = -(localRand() * animationDuration); 
        const scaleVariation = 0.5 + (localRand() * 1.0); // More size variation (0.5 to 1.5) for height effect 
        
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

        // Create the animated seagull group
        birdElement = (
            <g 
                key="circling-seagull-wrapper" 
                transform={`translate(${size / 2}, ${size / 2}) scale(${scaleVariation})`}
                className="circling-bird"
                style={{
                    '--bird-duration': `${animationDuration}s`,
                    '--bird-delay': `${animationDelay}s`
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
    
    // Return properly positioned group with all elements
    return (
        <g transform={`translate(${x}, ${y})`}>
            {whiteCaps}
            {birdElement}
        </g>
    );
});

export default EstuarySymbol;