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
        const numStalls = 2 + Math.floor(localRand(0) * 3);
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
        const stallsPerRow = numStalls <= 2 ? numStalls : 2;
        
        for (let i = 0; i < numStalls; i++) {
            const row = Math.floor(i / stallsPerRow);
            const col = i % stallsPerRow;
            
            const stallW = size * 0.35;
            const stallH = size * 0.25;
            const spacing = size * 0.1;
            
            const stallX = x + col * (stallW + spacing) + spacing;
            const stallY = y + row * (stallH + spacing) + spacing;
            const awningH = size * 0.15;
            const depth = size * 0.08;
            
            const stallColor = stallColors[i % stallColors.length];
            const hasStripes = stallStripes[i]; // Pre-computed static value
            
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
                    
                    {/* Vertical stripes - alternating white with color */}
                    {hasStripes && (
                        <g>
                            {Array.from({ length: 6 }).map((_, stripeIndex) => (
                                <rect
                                    key={`stripe-${stripeIndex}`}
                                    x={stallX - size*0.05 + (stripeIndex * (stallW + size*0.1) / 6)}
                                    y={stallY}
                                    width={(stallW + size*0.1) / 12}
                                    height={awningH}
                                    fill={stripeIndex % 2 === 0 ? "rgba(255,255,255,0.8)" : "transparent"}
                                />
                            ))}
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
        const { localRand } = staticValues;
        const numStalls = 2 + Math.floor(localRand(0) * 3); // Static seed
        const stallsPerRow = numStalls <= 2 ? numStalls : 2;
        
        for (let i = 0; i < numStalls; i++) {
            const row = Math.floor(i / stallsPerRow);
            const col = i % stallsPerRow;
            
            const stallW = size * 0.35; // Same width as traditional
            const stallH = size * 0.4; // Taller for modern era
            const spacing = size * 0.08;
            const depth = size * 0.08;
            
            const stallX = x + col * (stallW + spacing) + spacing;
            const stallY = y + row * (stallH + spacing) + spacing;
            
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
        if (nightIntensity < 0.2) return [];
        
        const elements: JSX.Element[] = [];
        const { localRand } = staticValues;
        const numLights = era === 'PREHISTORY' ? 1 + Math.floor(localRand(100) * 2) : 
                         era === 'MODERN' ? 2 + Math.floor(localRand(100) * 2) :
                         2 + Math.floor(localRand(100) * 4);
        
        for (let i = 0; i < numLights; i++) {
            const lightX = x + localRand(200 + i) * size;
            const lightY = y + localRand(300 + i) * size * 0.7;
            
            if (era === 'PREHISTORY') {
                // Firelight
                elements.push(
                    <g key={`fire-${i}`}>
                        <circle cx={lightX} cy={lightY} r={size * 0.15} fill="rgba(255, 120, 0, 0.3)" filter="blur(8px)" opacity={nightIntensity * 0.8} />
                        <circle cx={lightX} cy={lightY} r={size * 0.08} fill="rgba(255, 160, 40, 0.6)" filter="blur(4px)" opacity={nightIntensity} />
                        <circle cx={lightX} cy={lightY} r={size * 0.03} fill="rgba(255, 200, 60, 0.9)" opacity={nightIntensity} />
                    </g>
                );
            } else if (culture === 'EAST_ASIAN' && era !== 'MODERN') {
                // Paper lanterns
                elements.push(
                    <g key={`lantern-${i}`}>
                        <ellipse cx={lightX} cy={lightY} rx={size * 0.1} ry={size * 0.15} fill="rgba(255, 100, 100, 0.4)" filter="blur(6px)" opacity={nightIntensity * 0.7} />
                        <ellipse cx={lightX} cy={lightY} rx={size * 0.06} ry={size * 0.1} fill="rgba(255, 150, 80, 0.8)" opacity={nightIntensity} />
                        <ellipse cx={lightX} cy={lightY} rx={size * 0.04} ry={size * 0.08} fill="rgba(255, 180, 100, 0.9)" opacity={nightIntensity} />
                    </g>
                );
            } else if (era === 'MODERN') {
                // Electric lighting
                elements.push(
                    <g key={`electric-${i}`}>
                        <circle cx={lightX} cy={lightY} r={size * 0.2} fill="rgba(240, 245, 255, 0.15)" filter="blur(10px)" opacity={nightIntensity * 0.6} />
                        <circle cx={lightX} cy={lightY} r={size * 0.1} fill="rgba(255, 255, 240, 0.4)" filter="blur(5px)" opacity={nightIntensity * 0.8} />
                        <rect x={lightX - size*0.01} y={lightY + size*0.12} width={size*0.02} height={size*0.1} fill="#404040" opacity={nightIntensity} />
                    </g>
                );
            } else {
                // Traditional oil lamps/torches
                const lightColor1 = culture === 'MENA' ? 'rgba(255, 140, 60, 0.4)' : 'rgba(255, 160, 80, 0.4)';
                const lightColor2 = culture === 'MENA' ? 'rgba(255, 180, 100, 0.7)' : 'rgba(255, 200, 120, 0.8)';
                
                elements.push(
                    <g key={`torch-${i}`}>
                        <circle cx={lightX} cy={lightY} r={size * 0.14} fill={lightColor1} filter="blur(6px)" opacity={nightIntensity * 0.7} />
                        <circle cx={lightX} cy={lightY} r={size * 0.08} fill={lightColor2} filter="blur(3px)" opacity={nightIntensity * 0.9} />
                        <circle cx={lightX} cy={lightY} r={size * 0.04} fill={lightColor2} opacity={nightIntensity} />
                    </g>
                );
            }
        }
        return elements;
    };

    const elements: JSX.Element[] = [];
    
    // Ground base
    elements.push(
        <rect key="ground" x={x} y={y} width={size} height={size} fill={
            era === 'PREHISTORY' ? '#8B7355' :
            era === 'MODERN' ? '#A0A0A0' : '#CD853F'
        } />
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
