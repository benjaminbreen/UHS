/**
 * components/symbols/MarketplaceSymbol.tsx - Enhanced marketplace with era/cultural variations and 3D perspective.
 */
import React, { useMemo } from 'react';
import { Tile } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface MarketplaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  nightIntensity?: number;
  date?: string;
  zone?: string;
}

const MarketplaceSymbol: React.FC<MarketplaceSymbolProps> = React.memo(({ x, y, size, seed, tile, nightIntensity = 0, date = "1000 CE", zone = "Europe" }) => {
    // Memoize the random function and all static values
    const staticValues = useMemo(() => {
        const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 17 + tile.y * 19 + offset).random();
        const numStalls = 1 + Math.floor(localRand(0) * 4); // 1 to 4 stalls
        const stallStripes = Array.from({ length: 8 }, (_, i) => localRand(i * 7) > 0.5); // Pre-compute all stall stripes
        return {
            localRand,
            numStalls,
            stallStripes,
            stallColors: ["#c11d1d", "#16a34a", "#0369a1", "#ca8a04"]
        };
    }, [seed, tile.x, tile.y]);
    
    // Determine era and culture
    const { era, culture } = useMemo(() => {
        const year = parseInt(date.split(' ')[0]) || 1000;
        let currentEra: string;
        if (year < 500) currentEra = 'PREHISTORY';
        else if (year < 1450) currentEra = 'ANTIQUITY_MEDIEVAL'; 
        else if (year < 1800) currentEra = 'EARLY_MODERN';
        else if (year < 1900) currentEra = 'INDUSTRIAL';
        else currentEra = 'MODERN';
        
        const zoneStr = zone.toLowerCase();
        let currentCulture = 'EUROPEAN';
        if (zoneStr.includes('asia') || zoneStr.includes('china') || zoneStr.includes('japan')) currentCulture = 'EAST_ASIAN';
        else if (zoneStr.includes('middle east') || zoneStr.includes('arabia') || zoneStr.includes('mena')) currentCulture = 'MENA';
        else if (zoneStr.includes('africa')) currentCulture = 'AFRICAN';
        else if (zoneStr.includes('america')) currentCulture = 'AMERICAN';
        
        return { era: currentEra, culture: currentCulture };
    }, [date, zone]);

    const renderPrehistoricMarket = () => {
        const elements: JSX.Element[] = [];
        const { localRand } = staticValues;
        const numSites = 2 + Math.floor(localRand() * 2);
        
        for (let i = 0; i < numSites; i++) {
            const tentW = size * (0.35 + localRand(i*2) * 0.15);
            const tentH = size * (0.25 + localRand(i*3) * 0.1);
            const tentX = x + localRand(i*4) * (size - tentW);
            const tentY = y + localRand(i*5) * (size - tentH);
            const tentColor = culture === 'AMERICAN' ? '#8B4513' : '#654321';
            
            elements.push(
                <g key={`tent-${i}`}>
                    {/* Ground shadow */}
                    <ellipse
                        cx={tentX + tentW/2}
                        cy={tentY + tentH + size * 0.02}
                        rx={tentW * 0.6}
                        ry={size * 0.03}
                        fill="rgba(0,0,0,0.25)"
                        filter="blur(2px)"
                    />
                    {/* Hide/skin tent */}
                    <path
                        d={`M ${tentX} ${tentY + tentH} L ${tentX + tentW/2} ${tentY} L ${tentX + tentW} ${tentY + tentH} Z`}
                        fill={tentColor}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="1"
                    />
                    {/* Tent texture/seams */}
                    <path
                        d={`M ${tentX + tentW/2} ${tentY} L ${tentX + tentW/2} ${tentY + tentH}`}
                        stroke="rgba(0,0,0,0.4)"
                        strokeWidth="0.5"
                    />
                    {/* Goods on ground */}
                    <circle cx={tentX + tentW * 0.3} cy={tentY + tentH * 0.8} r={size * 0.02} fill="#8B4513" />
                    <circle cx={tentX + tentW * 0.7} cy={tentY + tentH * 0.9} r={size * 0.015} fill="#CD853F" />
                </g>
            );
        }
        return elements;
    };

    const renderTraditionalMarket = () => {
        const elements: JSX.Element[] = [];
        const { numStalls, stallColors, stallStripes, localRand } = staticValues;
        
        // Grid arrangement with guaranteed spacing
        const stallPositions = [];
        const padding = size * 0.15; // Minimum space between stalls
        const maxStallSize = size * 0.35; // Maximum stall size
        
        if (numStalls === 1) {
            // Center single stall
            stallPositions.push({ x: x + size * 0.5, y: y + size * 0.5 });
        } else if (numStalls === 2) {
            // Two stalls side by side
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.5 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.5 });
        } else if (numStalls === 3) {
            // Triangle arrangement
            stallPositions.push({ x: x + size * 0.5, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.65 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.65 });
        } else {
            // Four stalls in corners with center space
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.7 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.7 });
        }
        
        for (let i = 0; i < numStalls; i++) {
            const pos = stallPositions[i];
            
            // Smaller, consistent stall sizes to ensure no overlap
            const stallW = size * 0.22; // Fixed smaller width
            const stallH = size * 0.18; // Fixed smaller height
            
            const stallX = pos.x - stallW/2;
            const stallY = pos.y - stallH/2;
            const awningH = size * 0.15;
            const depth = size * 0.08;
            
            // More varied awning colors - always include one purple for identity
            const awningColors = [
                ["#6B46C1", "#DC2626", "#059669", "#0284C7"], // Purple, red, green, blue
                ["#7C3AED", "#EA580C", "#0891B2", "#DC2626"], // Light purple, orange, cyan, red
                ["#5B21B6", "#16A34A", "#DC2626", "#CA8A04"], // Dark purple, green, red, yellow
            ];
            const colorSet = awningColors[Math.floor(localRand(i * 14) * awningColors.length)];
            const stallColor = i === 0 ? colorSet[0] : colorSet[i % colorSet.length]; // First stall always purple
            const hasStripes = stallStripes[i] && localRand(i * 15) > 0.3; // Some striped awnings
            
            // Cultural building variations (same colors, different shapes)
            let buildingElement;
            if (culture === 'MENA' || culture === 'AFRICAN') {
                // Rounded tent-like structures
                buildingElement = (
                    <>
                        {/* Rounded tent top */}
                        <path
                            d={`M ${stallX} ${stallY + awningH} 
                                Q ${stallX + stallW/2} ${stallY - size*0.05} 
                                ${stallX + stallW} ${stallY + awningH} 
                                Z`}
                            fill={stallColor}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="0.3"
                        />
                        {/* Curved sides */}
                        <path
                            d={`M ${stallX} ${stallY + awningH} 
                                Q ${stallX - size*0.02} ${stallY + awningH/2} 
                                ${stallX} ${stallY + awningH + stallH} 
                                Q ${stallX + stallW/2} ${stallY + awningH + stallH + size*0.02}
                                ${stallX + stallW} ${stallY + awningH + stallH}
                                Q ${stallX + stallW + size*0.02} ${stallY + awningH/2}
                                ${stallX + stallW} ${stallY + awningH}
                                Z`}
                            fill={stallColor}
                            fillOpacity="0.8"
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth="0.2"
                        />
                    </>
                );
            } else if (culture === 'EAST_ASIAN') {
                // Pagoda-style with curved roofs
                buildingElement = (
                    <>
                        {/* Curved pagoda roof */}
                        <path
                            d={`M ${stallX - size*0.03} ${stallY + awningH} 
                                Q ${stallX + stallW/2} ${stallY - size*0.02} 
                                ${stallX + stallW + size*0.03} ${stallY + awningH}
                                Q ${stallX + stallW/2} ${stallY + size*0.01}
                                Z`}
                            fill={stallColor}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="0.3"
                        />
                        {/* Upturned eaves */}
                        <path
                            d={`M ${stallX - size*0.03} ${stallY + awningH} 
                                Q ${stallX - size*0.01} ${stallY + awningH - size*0.02} 
                                ${stallX + size*0.01} ${stallY + awningH - size*0.01}`}
                            fill="none"
                            stroke="#FFD700"
                            strokeWidth="0.4"
                        />
                        <path
                            d={`M ${stallX + stallW + size*0.03} ${stallY + awningH} 
                                Q ${stallX + stallW + size*0.01} ${stallY + awningH - size*0.02} 
                                ${stallX + stallW - size*0.01} ${stallY + awningH - size*0.01}`}
                            fill="none"
                            stroke="#FFD700"
                            strokeWidth="0.4"
                        />
                    </>
                );
            } else {
                // European-style peaked roof
                buildingElement = (
                    <>
                        {/* Traditional peaked awning */}
                        <path 
                            d={`M ${stallX - size*0.05} ${stallY + awningH} 
                                L ${stallX + stallW + size*0.05} ${stallY + awningH} 
                                L ${stallX + stallW + size*0.03} ${stallY} 
                                L ${stallX - size*0.03} ${stallY} Z`}
                            fill={stallColor}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="0.3"
                        />
                    </>
                );
            }

            elements.push(
                <g key={`stall-${i}`}>
                    {/* Ground shadow */}
                    <ellipse
                        cx={stallX + stallW/2 + depth/2}
                        cy={stallY + awningH + stallH + size * 0.02}
                        rx={stallW * 0.6}
                        ry={size * 0.04}
                        fill="rgba(0,0,0,0.25)"
                        filter="blur(2px)"
                    />
                    
                    {/* 3D Table base */}
                    <rect 
                        x={stallX} 
                        y={stallY + awningH} 
                        width={stallW} 
                        height={stallH}
                        fill="#8B4513"
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.3"
                    />
                    
                    {/* 3D depth sides */}
                    <path
                        d={`M ${stallX + stallW} ${stallY + awningH} 
                            L ${stallX + stallW + depth} ${stallY + awningH - depth*0.4} 
                            L ${stallX + stallW + depth} ${stallY + awningH + stallH - depth*0.4}
                            L ${stallX + stallW} ${stallY + awningH + stallH} Z`}
                        fill="#654321"
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.2"
                    />
                    
                    {/* Cultural building variation */}
                    {buildingElement}
                    
                    {/* Stripes - white alternating with color */}
                    {hasStripes && (
                        <g>
                            {Array.from({ length: 8 }).map((_, stripeIndex) => {
                                const stripeWidth = (stallW + size*0.1) / 8;
                                return (
                                    <rect
                                        key={`stripe-${stripeIndex}`}
                                        x={stallX - size*0.05 + (stripeIndex * stripeWidth)}
                                        y={stallY}
                                        width={stripeWidth}
                                        height={awningH}
                                        fill={stripeIndex % 2 === 0 ? stallColor : "rgba(255,255,255,0.9)"}
                                        opacity={stripeIndex % 2 === 0 ? 0.9 : 1}
                                    />
                                );
                            })}
                        </g>
                    )}
                    
                    {/* Support posts */}
                    <rect x={stallX + size*0.02} y={stallY} width={size*0.025} height={awningH + stallH} fill="#654321" />
                    <rect x={stallX + stallW - size*0.045} y={stallY} width={size*0.025} height={awningH + stallH} fill="#654321" />
                    
                    {/* Cultural goods display */}
                    {culture === 'EAST_ASIAN' && (
                        <>
                            <rect x={stallX + stallW*0.1} y={stallY + awningH + stallH*0.2} width={stallW*0.3} height={size*0.03} fill="#DEB887" rx={size*0.01} />
                            <circle cx={stallX + stallW*0.8} cy={stallY + awningH + stallH*0.4} r={size*0.015} fill="#FF4500" />
                        </>
                    )}
                    {culture === 'MENA' && (
                        <>
                            <ellipse cx={stallX + stallW*0.2} cy={stallY + awningH + stallH*0.3} rx={stallW*0.12} ry={size*0.02} fill="#DAA520" />
                            <circle cx={stallX + stallW*0.7} cy={stallY + awningH + stallH*0.4} r={size*0.012} fill="#DC143C" />
                        </>
                    )}
                    {(culture === 'EUROPEAN' || culture === 'AFRICAN') && (
                        <>
                            <rect x={stallX + stallW*0.1} y={stallY + awningH + stallH*0.3} width={stallW*0.35} height={size*0.025} fill="#DEB887" />
                            <circle cx={stallX + stallW*0.7} cy={stallY + awningH + stallH*0.4} r={size*0.015} fill="#228B22" />
                        </>
                    )}
                </g>
            );
        }
        return elements;
    };

    const renderModernMarket = () => {
        const elements: JSX.Element[] = [];
        const { localRand, numStalls } = staticValues;
        
        // Use same positioning logic as traditional markets
        const stallPositions = [];
        if (numStalls === 1) {
            stallPositions.push({ x: x + size * 0.5, y: y + size * 0.5 });
        } else if (numStalls === 2) {
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.5 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.5 });
        } else if (numStalls === 3) {
            stallPositions.push({ x: x + size * 0.5, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.65 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.65 });
        } else {
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.3 });
            stallPositions.push({ x: x + size * 0.3, y: y + size * 0.7 });
            stallPositions.push({ x: x + size * 0.7, y: y + size * 0.7 });
        }
        
        for (let i = 0; i < numStalls; i++) {
            const pos = stallPositions[i];
            
            const stallW = size * 0.22; // Smaller width
            const stallH = size * 0.25; // Slightly taller for modern
            const depth = size * 0.06;
            
            const stallX = pos.x - stallW/2;
            const stallY = pos.y - stallH/2;
            
            elements.push(
                <g key={`modern-stall-${i}`}>
                    {/* Ground shadow */}
                    <ellipse
                        cx={stallX + stallW/2 + depth/2}
                        cy={stallY + stallH + size * 0.02}
                        rx={stallW * 0.6}
                        ry={size * 0.04}
                        fill="rgba(0,0,0,0.2)"
                        filter="blur(2px)"
                    />
                    
                    {/* Tall modern building structure */}
                    <rect
                        x={stallX}
                        y={stallY}
                        width={stallW}
                        height={stallH}
                        fill="rgba(250,250,250,0.9)"
                        stroke="#666666"
                        strokeWidth="0.4"
                        rx={size * 0.008}
                    />
                    
                    {/* 3D side depth - taller */}
                    <path
                        d={`M ${stallX + stallW} ${stallY} 
                            L ${stallX + stallW + depth} ${stallY - depth*0.4} 
                            L ${stallX + stallW + depth} ${stallY + stallH - depth*0.4}
                            L ${stallX + stallW} ${stallY + stallH} Z`}
                        fill="rgba(220,220,220,0.85)"
                        stroke="#666666"
                        strokeWidth="0.3"
                    />
                    
                    {/* 3D top depth */}
                    <path
                        d={`M ${stallX} ${stallY} 
                            L ${stallX + depth} ${stallY - depth*0.4} 
                            L ${stallX + stallW + depth} ${stallY - depth*0.4}
                            L ${stallX + stallW} ${stallY} Z`}
                        fill="rgba(255,255,255,0.95)"
                        stroke="#666666"
                        strokeWidth="0.3"
                    />
                    
                    {/* Modern glass windows in rows */}
                    {Array.from({ length: 3 }).map((_, floor) => (
                        <g key={`floor-${floor}`}>
                            {Array.from({ length: 2 }).map((_, windowIndex) => (
                                <rect
                                    key={`window-${floor}-${windowIndex}`}
                                    x={stallX + stallW * (0.2 + windowIndex * 0.4)}
                                    y={stallY + stallH * (0.15 + floor * 0.25)}
                                    width={stallW * 0.15}
                                    height={stallH * 0.12}
                                    fill="rgba(100, 150, 200, 0.6)"
                                    stroke="#333"
                                    strokeWidth="0.2"
                                    rx={size * 0.005}
                                />
                            ))}
                        </g>
                    ))}
                    
                    {/* Modern steel frame structure */}
                    <rect x={stallX} y={stallY} width={size*0.015} height={stallH} fill="#333333" />
                    <rect x={stallX + stallW - size*0.015} y={stallY} width={size*0.015} height={stallH} fill="#333333" />
                    <rect x={stallX} y={stallY} width={stallW} height={size*0.015} fill="#333333" />
                    <rect x={stallX} y={stallY + stallH - size*0.015} width={stallW} height={size*0.015} fill="#333333" />
                    
                    {/* Modern signage */}
                    <rect 
                        x={stallX + stallW*0.1} 
                        y={stallY + stallH*0.85} 
                        width={stallW*0.8} 
                        height={size*0.03} 
                        fill="#2563eb" 
                        stroke="#1d4ed8" 
                        strokeWidth="0.2" 
                    />
                    
                    {/* Glass entrance doors */}
                    <rect
                        x={stallX + stallW*0.35}
                        y={stallY + stallH*0.7}
                        width={stallW*0.3}
                        height={stallH*0.15}
                        fill="rgba(150, 200, 255, 0.4)"
                        stroke="#444"
                        strokeWidth="0.3"
                        rx={size * 0.005}
                    />
                </g>
            );
        }
        return elements;
    };

    const renderNightLighting = () => {
        // No night lighting for marketplaces
        return [];
    };

    const elements: JSX.Element[] = [];
    
    // Semi-transparent purple ground to identify marketplace
    elements.push(
        <rect key="ground" x={x} y={y} width={size} height={size} 
              fill="rgba(139, 69, 139, 0.15)" // Semi-transparent purple tint
              stroke="rgba(75, 0, 130, 0.3)" // Indigo border
              strokeWidth="0.5"
        />
    );
    
    // Era-specific marketplace structures
    if (era === 'PREHISTORY') {
        elements.push(...renderPrehistoricMarket());
    } else if (era === 'MODERN') {
        elements.push(...renderModernMarket());
    } else {
        elements.push(...renderTraditionalMarket());
    }
    
    // Night lighting
    elements.push(...renderNightLighting());
    
    return <>{elements}</>;
});

export default MarketplaceSymbol;
