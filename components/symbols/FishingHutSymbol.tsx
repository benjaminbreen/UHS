/**
 * components/symbols/FishingHutSymbol.tsx - Culturally customized fishing hut structures
 * Renders beautiful isometric 3D fishing huts with period and culture-appropriate designs
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface FishingHutSymbolProps {
    x: number;
    y: number;
    size: number;
    seed: number;
    date?: string;
    isModern?: boolean;
    culturalZone?: string; // Could be passed from map context
}

const FishingHutSymbol: React.FC<FishingHutSymbolProps> = React.memo(({ 
    x, 
    y, 
    size, 
    seed, 
    date, 
    isModern = false,
    culturalZone = 'European' // Default to European style
}) => {
    const elements: JSX.Element[] = [];
    const hutSize = size * 0.7;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Check if modern era
    const year = date ? parseInt(date.split(' ')[0]) : 1800;
    const hasModernFeatures = isModern || year >= 1900;
    
    // Generate unique ID for gradients
    const uniqueId = `fishing-hut-${x}-${y}-${seed}`;
    
    // Determine cultural style based on zone
    const getCulturalStyle = () => {
        const lowerZone = culturalZone?.toLowerCase() || 'european';
        if (lowerZone.includes('north america') || lowerZone.includes('pre-columbian')) {
            return 'preColumbian';
        } else if (lowerZone.includes('south america')) {
            return 'caribbean';
        } else if (lowerZone.includes('asia') || lowerZone.includes('oceania')) {
            return 'asian';
        } else if (lowerZone.includes('africa')) {
            return 'african';
        } else if (lowerZone.includes('mena') || lowerZone.includes('middle east')) {
            return 'mediterranean';
        }
        return 'european';
    };
    
    const culturalStyle = getCulturalStyle();
    
    // Define gradients for 3D effect
    elements.push(
        <defs key="gradients">
            <linearGradient id={`${uniqueId}-wall`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={culturalStyle === 'caribbean' ? '#D2B48C' : culturalStyle === 'asian' ? '#C8A882' : '#B8956F'} />
                <stop offset="100%" stopColor={culturalStyle === 'caribbean' ? '#A0826D' : culturalStyle === 'asian' ? '#9B7E5A' : '#8B6F47'} />
            </linearGradient>
            <linearGradient id={`${uniqueId}-roof`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={culturalStyle === 'caribbean' ? '#8B7355' : culturalStyle === 'asian' ? '#4A4A4A' : '#6B4E3D'} />
                <stop offset="100%" stopColor={culturalStyle === 'caribbean' ? '#6B5D47' : culturalStyle === 'asian' ? '#2C2C2C' : '#4A342A'} />
            </linearGradient>
            <linearGradient id={`${uniqueId}-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
            </linearGradient>
        </defs>
    );
    
    // Ground shadow
    elements.push(
        <ellipse
            key="shadow"
            cx={centerX + hutSize * 0.08}
            cy={centerY + hutSize * 0.55}
            rx={hutSize * 0.5}
            ry={hutSize * 0.15}
            fill="rgba(0,0,0,0.25)"
        />
    );
    
    // Render different styles based on cultural zone
    if (culturalStyle === 'caribbean' || culturalStyle === 'preColumbian') {
        // Caribbean/Pre-Columbian style - Thatched hut on stilts
        
        // Stilts
        const stiltPositions = [
            { x: -0.35, y: 0.2 },
            { x: 0.35, y: 0.2 },
            { x: -0.35, y: -0.1 },
            { x: 0.35, y: -0.1 }
        ];
        
        stiltPositions.forEach((pos, i) => {
            elements.push(
                <rect
                    key={`stilt-${i}`}
                    x={centerX + hutSize * pos.x - hutSize * 0.02}
                    y={centerY + hutSize * pos.y}
                    width={hutSize * 0.04}
                    height={hutSize * 0.35}
                    fill="#654321"
                    stroke="#4A3018"
                    strokeWidth={size * 0.003}
                />
            );
        });
        
        // Platform
        elements.push(
            <g key="platform" transform={`translate(${centerX}, ${centerY})`}>
                <path
                    d={`M ${-hutSize * 0.4} ${hutSize * 0.15}
                        L ${hutSize * 0.4} ${hutSize * 0.15}
                        L ${hutSize * 0.45} ${hutSize * 0.05}
                        L ${-hutSize * 0.35} ${hutSize * 0.05}
                        Z`}
                    fill="#8B6F47"
                    stroke="#654321"
                    strokeWidth={size * 0.004}
                />
            </g>
        );
        
        // Main hut body
        elements.push(
            <g key="hut-body" transform={`translate(${centerX}, ${centerY})`}>
                {/* Back wall */}
                <path
                    d={`M ${-hutSize * 0.35} ${hutSize * 0.05}
                        L ${-hutSize * 0.35} ${-hutSize * 0.25}
                        L ${hutSize * 0.35} ${-hutSize * 0.25}
                        L ${hutSize * 0.35} ${hutSize * 0.05}
                        Z`}
                    fill="#D2B48C"
                    stroke="#A0826D"
                    strokeWidth={size * 0.004}
                />
                
                {/* Front wall with perspective */}
                <path
                    d={`M ${-hutSize * 0.35} ${hutSize * 0.05}
                        L ${-hutSize * 0.35} ${-hutSize * 0.25}
                        L ${-hutSize * 0.3} ${-hutSize * 0.3}
                        L ${-hutSize * 0.3} ${0}
                        Z`}
                    fill="#E5D4B1"
                    stroke="#A0826D"
                    strokeWidth={size * 0.003}
                />
                
                {/* Thatched roof - conical */}
                <path
                    d={`M ${-hutSize * 0.45} ${-hutSize * 0.2}
                        L ${0} ${-hutSize * 0.5}
                        L ${hutSize * 0.45} ${-hutSize * 0.2}
                        L ${hutSize * 0.4} ${-hutSize * 0.15}
                        L ${0} ${-hutSize * 0.4}
                        L ${-hutSize * 0.4} ${-hutSize * 0.15}
                        Z`}
                    fill="#8B7355"
                    stroke="#6B5D47"
                    strokeWidth={size * 0.004}
                />
                
                {/* Thatch texture lines */}
                {[0, 0.1, 0.2].map((offset, i) => (
                    <path
                        key={`thatch-${i}`}
                        d={`M ${-hutSize * (0.35 - offset)} ${-hutSize * (0.25 + offset)}
                            L ${hutSize * (0.35 - offset)} ${-hutSize * (0.25 + offset)}`}
                        stroke="#6B5D47"
                        strokeWidth={size * 0.002}
                        opacity={0.6}
                    />
                ))}
                
                {/* Door */}
                <rect
                    x={-hutSize * 0.08}
                    y={-hutSize * 0.1}
                    width={hutSize * 0.16}
                    height={hutSize * 0.15}
                    fill="#4A3018"
                    stroke="#2D1F10"
                    strokeWidth={size * 0.003}
                />
            </g>
        );
        
    } else if (culturalStyle === 'asian') {
        // Asian style - Japanese/Chinese fishing hut with curved roof
        
        elements.push(
            <g key="asian-hut" transform={`translate(${centerX}, ${centerY})`}>
                {/* Foundation stones */}
                <ellipse cx={-hutSize * 0.3} cy={hutSize * 0.4} rx={hutSize * 0.08} ry={hutSize * 0.04} fill="#7A7A7A" />
                <ellipse cx={hutSize * 0.3} cy={hutSize * 0.4} rx={hutSize * 0.08} ry={hutSize * 0.04} fill="#7A7A7A" />
                
                {/* Main structure */}
                <path
                    d={`M ${-hutSize * 0.35} ${hutSize * 0.35}
                        L ${-hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.35} ${hutSize * 0.35}
                        Z`}
                    fill="#C8A882"
                    stroke="#9B7E5A"
                    strokeWidth={size * 0.004}
                />
                
                {/* Side wall with depth */}
                <path
                    d={`M ${hutSize * 0.35} ${hutSize * 0.35}
                        L ${hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.4} ${-hutSize * 0.2}
                        L ${hutSize * 0.4} ${hutSize * 0.3}
                        Z`}
                    fill="#A08060"
                    stroke="#9B7E5A"
                    strokeWidth={size * 0.003}
                />
                
                {/* Curved roof - characteristic Asian style */}
                <path
                    d={`M ${-hutSize * 0.45} ${-hutSize * 0.1}
                        Q ${-hutSize * 0.2} ${-hutSize * 0.35} ${0} ${-hutSize * 0.4}
                        Q ${hutSize * 0.2} ${-hutSize * 0.35} ${hutSize * 0.45} ${-hutSize * 0.1}
                        L ${hutSize * 0.5} ${-hutSize * 0.15}
                        Q ${hutSize * 0.25} ${-hutSize * 0.3} ${0} ${-hutSize * 0.32}
                        Q ${-hutSize * 0.25} ${-hutSize * 0.3} ${-hutSize * 0.4} ${-hutSize * 0.05}
                        Z`}
                    fill="#4A4A4A"
                    stroke="#2C2C2C"
                    strokeWidth={size * 0.004}
                />
                
                {/* Roof ridge decoration */}
                <line
                    x1={-hutSize * 0.4}
                    y1={-hutSize * 0.32}
                    x2={hutSize * 0.45}
                    y2={-hutSize * 0.32}
                    stroke="#2C2C2C"
                    strokeWidth={size * 0.006}
                />
                
                {/* Paper screen door */}
                <rect
                    x={-hutSize * 0.1}
                    y={hutSize * 0.05}
                    width={hutSize * 0.2}
                    height={hutSize * 0.3}
                    fill="#F5E6D3"
                    stroke="#8B6F47"
                    strokeWidth={size * 0.003}
                />
                
                {/* Door grid pattern */}
                <line x1={0} y1={hutSize * 0.05} x2={0} y2={hutSize * 0.35} stroke="#8B6F47" strokeWidth={size * 0.002} />
                <line x1={-hutSize * 0.1} y1={hutSize * 0.2} x2={hutSize * 0.1} y2={hutSize * 0.2} stroke="#8B6F47" strokeWidth={size * 0.002} />
            </g>
        );
        
    } else if (culturalStyle === 'mediterranean') {
        // Mediterranean/Middle Eastern style - Stone/adobe with flat roof
        
        elements.push(
            <g key="med-hut" transform={`translate(${centerX}, ${centerY})`}>
                {/* Main stone/adobe structure */}
                <path
                    d={`M ${-hutSize * 0.35} ${hutSize * 0.4}
                        L ${-hutSize * 0.35} ${-hutSize * 0.2}
                        L ${hutSize * 0.35} ${-hutSize * 0.2}
                        L ${hutSize * 0.35} ${hutSize * 0.4}
                        Z`}
                    fill="#E8DCC0"
                    stroke="#C4B5A0"
                    strokeWidth={size * 0.004}
                />
                
                {/* Side wall */}
                <path
                    d={`M ${hutSize * 0.35} ${hutSize * 0.4}
                        L ${hutSize * 0.35} ${-hutSize * 0.2}
                        L ${hutSize * 0.42} ${-hutSize * 0.25}
                        L ${hutSize * 0.42} ${hutSize * 0.35}
                        Z`}
                    fill="#D4C0A6"
                    stroke="#C4B5A0"
                    strokeWidth={size * 0.003}
                />
                
                {/* Flat roof with slight angle */}
                <path
                    d={`M ${-hutSize * 0.35} ${-hutSize * 0.2}
                        L ${hutSize * 0.35} ${-hutSize * 0.2}
                        L ${hutSize * 0.42} ${-hutSize * 0.25}
                        L ${-hutSize * 0.28} ${-hutSize * 0.25}
                        Z`}
                    fill="#B8A590"
                    stroke="#9A8875"
                    strokeWidth={size * 0.003}
                />
                
                {/* Arched doorway */}
                <path
                    d={`M ${-hutSize * 0.1} ${hutSize * 0.4}
                        L ${-hutSize * 0.1} ${hutSize * 0.1}
                        Q ${0} ${hutSize * 0.05} ${hutSize * 0.1} ${hutSize * 0.1}
                        L ${hutSize * 0.1} ${hutSize * 0.4}
                        Z`}
                    fill="#5C4033"
                    stroke="#3E2A1F"
                    strokeWidth={size * 0.003}
                />
                
                {/* Small window */}
                <rect
                    x={hutSize * 0.12}
                    y={0}
                    width={hutSize * 0.12}
                    height={hutSize * 0.12}
                    fill="#87CEEB"
                    stroke="#6B5D47"
                    strokeWidth={size * 0.002}
                    opacity={0.8}
                />
                
                {/* Decorative awning */}
                <path
                    d={`M ${-hutSize * 0.15} ${hutSize * 0.08}
                        L ${hutSize * 0.15} ${hutSize * 0.08}
                        L ${hutSize * 0.18} ${hutSize * 0.02}
                        L ${-hutSize * 0.12} ${hutSize * 0.02}
                        Z`}
                    fill="#8B7355"
                    stroke="#6B5D47"
                    strokeWidth={size * 0.002}
                />
            </g>
        );
        
    } else if (culturalStyle === 'african') {
        // African style - Round mud hut with conical thatch
        
        elements.push(
            <g key="african-hut" transform={`translate(${centerX}, ${centerY})`}>
                {/* Circular base */}
                <ellipse
                    cx={0}
                    cy={hutSize * 0.25}
                    rx={hutSize * 0.35}
                    ry={hutSize * 0.28}
                    fill="#C4A57B"
                    stroke="#9A8060"
                    strokeWidth={size * 0.004}
                />
                
                {/* Front highlight for 3D effect */}
                <path
                    d={`M ${-hutSize * 0.3} ${hutSize * 0.1}
                        Q ${-hutSize * 0.35} ${hutSize * 0.25} ${-hutSize * 0.25} ${hutSize * 0.4}
                        L ${hutSize * 0.25} ${hutSize * 0.4}
                        Q ${hutSize * 0.35} ${hutSize * 0.25} ${hutSize * 0.3} ${hutSize * 0.1}
                        Z`}
                    fill="#D4B590"
                    opacity={0.7}
                />
                
                {/* Conical thatched roof */}
                <path
                    d={`M ${-hutSize * 0.4} ${hutSize * 0.05}
                        L ${0} ${-hutSize * 0.45}
                        L ${hutSize * 0.4} ${hutSize * 0.05}
                        Q ${hutSize * 0.35} ${hutSize * 0.08} ${hutSize * 0.2} ${hutSize * 0.08}
                        Q ${0} ${hutSize * 0.1} ${-hutSize * 0.2} ${hutSize * 0.08}
                        Q ${-hutSize * 0.35} ${hutSize * 0.08} ${-hutSize * 0.4} ${hutSize * 0.05}
                        Z`}
                    fill="#8B7355"
                    stroke="#6B5D47"
                    strokeWidth={size * 0.004}
                />
                
                {/* Roof texture */}
                {[-0.15, 0, 0.15].map((offset, i) => (
                    <ellipse
                        key={`roof-texture-${i}`}
                        cx={0}
                        cy={hutSize * (-0.1 + offset)}
                        rx={hutSize * (0.25 - Math.abs(offset))}
                        ry={hutSize * 0.03}
                        fill="none"
                        stroke="#5A4A3A"
                        strokeWidth={size * 0.002}
                        opacity={0.5}
                    />
                ))}
                
                {/* Doorway */}
                <rect
                    x={-hutSize * 0.08}
                    y={hutSize * 0.15}
                    width={hutSize * 0.16}
                    height={hutSize * 0.25}
                    fill="#3E2A1F"
                    stroke="#2A1F15"
                    strokeWidth={size * 0.003}
                    rx={hutSize * 0.08}
                    ry={hutSize * 0.02}
                />
            </g>
        );
        
    } else {
        // European style - Traditional timber frame
        
        elements.push(
            <g key="european-hut" transform={`translate(${centerX}, ${centerY})`}>
                {/* Stone foundation */}
                <rect
                    x={-hutSize * 0.38}
                    y={hutSize * 0.35}
                    width={hutSize * 0.76}
                    height={hutSize * 0.08}
                    fill="#8A8A8A"
                    stroke="#6A6A6A"
                    strokeWidth={size * 0.003}
                />
                
                {/* Main timber frame structure */}
                <path
                    d={`M ${-hutSize * 0.35} ${hutSize * 0.35}
                        L ${-hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.35} ${hutSize * 0.35}
                        Z`}
                    fill={`url(#${uniqueId}-wall)`}
                    stroke="#6B4E3D"
                    strokeWidth={size * 0.004}
                />
                
                {/* Timber frame beams */}
                <line x1={-hutSize * 0.35} y1={hutSize * 0.1} x2={hutSize * 0.35} y2={hutSize * 0.1} stroke="#4A342A" strokeWidth={size * 0.005} />
                <line x1={0} y1={-hutSize * 0.15} x2={0} y2={hutSize * 0.35} stroke="#4A342A" strokeWidth={size * 0.005} />
                <line x1={-hutSize * 0.17} y1={-hutSize * 0.15} x2={-hutSize * 0.17} y2={hutSize * 0.35} stroke="#4A342A" strokeWidth={size * 0.004} />
                <line x1={hutSize * 0.17} y1={-hutSize * 0.15} x2={hutSize * 0.17} y2={hutSize * 0.35} stroke="#4A342A" strokeWidth={size * 0.004} />
                
                {/* Side wall */}
                <path
                    d={`M ${hutSize * 0.35} ${hutSize * 0.35}
                        L ${hutSize * 0.35} ${-hutSize * 0.15}
                        L ${hutSize * 0.42} ${-hutSize * 0.22}
                        L ${hutSize * 0.42} ${hutSize * 0.28}
                        Z`}
                    fill="#8B6F47"
                    stroke="#6B4E3D"
                    strokeWidth={size * 0.003}
                />
                
                {/* Peaked roof */}
                <path
                    d={`M ${-hutSize * 0.4} ${-hutSize * 0.12}
                        L ${0} ${-hutSize * 0.4}
                        L ${hutSize * 0.4} ${-hutSize * 0.12}
                        L ${hutSize * 0.47} ${-hutSize * 0.19}
                        L ${0} ${-hutSize * 0.45}
                        L ${-hutSize * 0.33} ${-hutSize * 0.19}
                        Z`}
                    fill={hasModernFeatures ? "#7F8C8D" : `url(#${uniqueId}-roof)`}
                    stroke="#4A342A"
                    strokeWidth={size * 0.004}
                />
                
                {/* Roof texture */}
                {!hasModernFeatures && [-0.05, 0.05, 0.15].map((offset, i) => (
                    <line
                        key={`roof-line-${i}`}
                        x1={-hutSize * (0.3 - offset * 0.8)}
                        y1={-hutSize * (0.2 + offset)}
                        x2={hutSize * (0.35 - offset * 0.8)}
                        y2={-hutSize * (0.2 + offset)}
                        stroke="#3A2A1A"
                        strokeWidth={size * 0.002}
                        opacity={0.4}
                    />
                ))}
                
                {/* Door */}
                <rect
                    x={-hutSize * 0.08}
                    y={hutSize * 0.1}
                    width={hutSize * 0.16}
                    height={hutSize * 0.25}
                    fill="#5C4033"
                    stroke="#3E2A1F"
                    strokeWidth={size * 0.003}
                />
                
                {/* Windows */}
                <rect
                    x={-hutSize * 0.28}
                    y={-hutSize * 0.05}
                    width={hutSize * 0.12}
                    height={hutSize * 0.12}
                    fill="#ADD8E6"
                    stroke="#4A342A"
                    strokeWidth={size * 0.003}
                    opacity={0.9}
                />
                <rect
                    x={hutSize * 0.16}
                    y={-hutSize * 0.05}
                    width={hutSize * 0.12}
                    height={hutSize * 0.12}
                    fill="#ADD8E6"
                    stroke="#4A342A"
                    strokeWidth={size * 0.003}
                    opacity={0.9}
                />
                
                {/* Window cross-beams */}
                <line x1={-hutSize * 0.22} y1={-hutSize * 0.05} x2={-hutSize * 0.22} y2={hutSize * 0.07} stroke="#4A342A" strokeWidth={size * 0.002} />
                <line x1={-hutSize * 0.28} y1={hutSize * 0.01} x2={-hutSize * 0.16} y2={hutSize * 0.01} stroke="#4A342A" strokeWidth={size * 0.002} />
                <line x1={hutSize * 0.22} y1={-hutSize * 0.05} x2={hutSize * 0.22} y2={hutSize * 0.07} stroke="#4A342A" strokeWidth={size * 0.002} />
                <line x1={hutSize * 0.16} y1={hutSize * 0.01} x2={hutSize * 0.28} y2={hutSize * 0.01} stroke="#4A342A" strokeWidth={size * 0.002} />
            </g>
        );
    }
    
    // Add fishing equipment based on culture
    const equipmentX = centerX - hutSize * 0.6;
    const equipmentY = centerY + hutSize * 0.3;
    
    elements.push(
        <g key="fishing-equipment">
            {/* Drying rack with fish */}
            <g>
                {/* Rack posts */}
                <rect x={equipmentX - hutSize * 0.02} y={equipmentY - hutSize * 0.2} width={hutSize * 0.03} height={hutSize * 0.3} fill="#654321" />
                <rect x={equipmentX + hutSize * 0.25} y={equipmentY - hutSize * 0.2} width={hutSize * 0.03} height={hutSize * 0.3} fill="#654321" />
                
                {/* Horizontal beam */}
                <rect x={equipmentX} y={equipmentY - hutSize * 0.18} width={hutSize * 0.25} height={hutSize * 0.03} fill="#8B6F47" />
                
                {/* Hanging fish */}
                {[0, 0.08, 0.16].map((offset, i) => (
                    <g key={`fish-${i}`}>
                        <line
                            x1={equipmentX + hutSize * (0.05 + offset)}
                            y1={equipmentY - hutSize * 0.16}
                            x2={equipmentX + hutSize * (0.05 + offset)}
                            y2={equipmentY - hutSize * 0.08}
                            stroke="#5A4A3A"
                            strokeWidth={size * 0.002}
                        />
                        <ellipse
                            cx={equipmentX + hutSize * (0.05 + offset)}
                            cy={equipmentY - hutSize * 0.05}
                            rx={hutSize * 0.03}
                            ry={hutSize * 0.05}
                            fill="#C0C0C0"
                            stroke="#808080"
                            strokeWidth={size * 0.002}
                        />
                    </g>
                ))}
            </g>
            
            {/* Fishing nets */}
            <g transform={`translate(${equipmentX + hutSize * 0.35}, ${equipmentY})`}>
                <ellipse cx={0} cy={0} rx={hutSize * 0.08} ry={hutSize * 0.05} fill="rgba(139, 90, 43, 0.3)" />
                <ellipse cx={0} cy={-hutSize * 0.02} rx={hutSize * 0.07} ry={hutSize * 0.04} fill="rgba(160, 110, 60, 0.4)" stroke="#8B5A2B" strokeWidth={size * 0.002} />
                {/* Net pattern */}
                {[-0.03, 0, 0.03].map((x, i) => (
                    [-0.02, 0, 0.02].map((y, j) => (
                        <circle
                            key={`net-${i}-${j}`}
                            cx={hutSize * x}
                            cy={hutSize * y - hutSize * 0.02}
                            r={size * 0.001}
                            fill="#5A4A3A"
                        />
                    ))
                ))}
            </g>
        </g>
    );
    
    // Add a small boat or canoe based on culture
    const boatX = centerX + hutSize * 0.7;
    const boatY = centerY + hutSize * 0.35;
    
    if (culturalStyle === 'caribbean' || culturalStyle === 'preColumbian' || culturalStyle === 'oceania') {
        // Canoe style
        elements.push(
            <g key="canoe">
                <ellipse cx={boatX} cy={boatY + size * 0.02} rx={size * 0.15} ry={size * 0.02} fill="rgba(0,0,0,0.2)" />
                <path
                    d={`M ${boatX - size * 0.15} ${boatY}
                        Q ${boatX - size * 0.12} ${boatY + size * 0.03} ${boatX} ${boatY + size * 0.03}
                        Q ${boatX + size * 0.12} ${boatY + size * 0.03} ${boatX + size * 0.15} ${boatY}
                        Q ${boatX + size * 0.12} ${boatY - size * 0.02} ${boatX} ${boatY - size * 0.02}
                        Q ${boatX - size * 0.12} ${boatY - size * 0.02} ${boatX - size * 0.15} ${boatY}
                        Z`}
                    fill="#8B6F47"
                    stroke="#654321"
                    strokeWidth={size * 0.003}
                />
                {/* Paddle */}
                <line x1={boatX - size * 0.08} y1={boatY} x2={boatX - size * 0.18} y2={boatY + size * 0.05} stroke="#654321" strokeWidth={size * 0.006} />
                <ellipse cx={boatX - size * 0.19} cy={boatY + size * 0.06} rx={size * 0.02} ry={size * 0.01} fill="#8B6F47" />
            </g>
        );
    } else {
        // Traditional rowboat
        elements.push(
            <g key="rowboat">
                <ellipse cx={boatX} cy={boatY + size * 0.02} rx={size * 0.12} ry={size * 0.02} fill="rgba(0,0,0,0.2)" />
                <path
                    d={`M ${boatX - size * 0.12} ${boatY}
                        L ${boatX - size * 0.1} ${boatY + size * 0.04}
                        L ${boatX + size * 0.1} ${boatY + size * 0.04}
                        L ${boatX + size * 0.12} ${boatY}
                        Q ${boatX} ${boatY - size * 0.02} ${boatX - size * 0.12} ${boatY}
                        Z`}
                    fill="#8B4513"
                    stroke="#654321"
                    strokeWidth={size * 0.004}
                />
                {/* Bench */}
                <rect x={boatX - size * 0.08} y={boatY} width={size * 0.16} height={size * 0.01} fill="#654321" />
                {/* Oars */}
                <line x1={boatX - size * 0.08} y1={boatY} x2={boatX - size * 0.15} y2={boatY + size * 0.06} stroke="#8B4513" strokeWidth={size * 0.006} />
                <line x1={boatX + size * 0.08} y1={boatY} x2={boatX + size * 0.15} y2={boatY + size * 0.06} stroke="#8B4513" strokeWidth={size * 0.006} />
            </g>
        );
    }
    
    // Add modern features if applicable
    if (hasModernFeatures && culturalStyle === 'european') {
        elements.push(
            <g key="modern-features">
                {/* Electric/neon sign */}
                <rect
                    x={centerX - hutSize * 0.25}
                    y={centerY - hutSize * 0.5}
                    width={hutSize * 0.5}
                    height={hutSize * 0.1}
                    fill="#2C3E50"
                    stroke="#1A252F"
                    strokeWidth={size * 0.003}
                    rx={size * 0.003}
                />
                <text
                    x={centerX}
                    y={centerY - hutSize * 0.44}
                    fontSize={size * 0.06}
                    textAnchor="middle"
                    fill="#00FFFF"
                    fontFamily="monospace"
                    style={{ filter: 'drop-shadow(0 0 2px #00FFFF)' }}
                >
                    BAIT
                </text>
                
                {/* Power line */}
                <line
                    x1={centerX + hutSize * 0.42}
                    y1={centerY - hutSize * 0.3}
                    x2={centerX + hutSize * 0.6}
                    y2={centerY - hutSize * 0.35}
                    stroke="#4A4A4A"
                    strokeWidth={size * 0.003}
                />
            </g>
        );
    }

    return <>{elements}</>;
});

export default FishingHutSymbol;