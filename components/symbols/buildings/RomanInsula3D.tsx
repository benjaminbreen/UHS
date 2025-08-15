/**
 * components/symbols/buildings/RomanInsula3D.tsx - Renders a Roman multi-story apartment building.
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface RomanInsula3DProps {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  size: number; 
  seed: number; 
  tile: Tile; 
  roofColor?: string; 
  nightIntensity?: number;
}

const RomanInsula3D: React.FC<RomanInsula3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, nightIntensity = 0 
}) => {
    const rng = new ValueNoise(seed + tile.x * 277 + tile.y * 281);
    const uniqueId = `insula-${tile.x}-${tile.y}`;
    
    // Pre-calculate random values
    const stoneVariation = Array.from({length: 8}, () => rng.random());
    const balconyChance = rng.random();
    const stories = 3 + Math.floor(rng.random() * 2); // 3-4 stories
    
    const cx = x + width / 2;
    const insulaWidth = width * 0.9;
    const storyHeight = height / stories;
    const insulaY = y + height * 0.1;
    const depth = size * 0.35;
    
    // Roman architectural colors
    const romanStone = `hsl(35, 30%, ${70 + stoneVariation[0] * 15}%)`;
    const darkStone = `hsl(30, 35%, 50%)`;
    const lightStone = `hsl(40, 25%, 85%)`;
    const romanRed = `hsl(15, 70%, 45%)`;
    const shadowColor = `hsl(25, 40%, 30%)`;
    const mortarColor = `hsl(35, 20%, 75%)`;
    const tileRed = roofColor || `hsl(10, 65%, 40%)`;
    
    return (
        <g filter="url(#symbolShadow)">
            <defs>
                <linearGradient id={`romanGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={lightStone} />
                    <stop offset="50%" stopColor={romanStone} />
                    <stop offset="100%" stopColor={darkStone} />
                </linearGradient>
                <pattern id={`romanBrick-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="3">
                    <rect width="8" height="3" fill={romanStone} />
                    <rect x="0" y="0" width="3.8" height="1.4" fill={lightStone} stroke={mortarColor} strokeWidth="0.1" />
                    <rect x="4.2" y="0" width="3.8" height="1.4" fill={romanStone} stroke={mortarColor} strokeWidth="0.1" />
                    <rect x="2.1" y="1.6" width="3.8" height="1.4" fill={darkStone} stroke={mortarColor} strokeWidth="0.1" />
                </pattern>
            </defs>
            
            {/* Ground shadow */}
            <ellipse cx={cx + 4} cy={y + height + 4} rx={insulaWidth * 0.7} ry={insulaWidth * 0.3} 
                fill="rgba(0,0,0,0.35)" />
            
            {/* Main building structure */}
            <rect 
                x={cx - insulaWidth/2} 
                y={insulaY} 
                width={insulaWidth} 
                height={height * 0.9}
                fill={`url(#romanBrick-${uniqueId})`} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* 3D side wall */}
            <path 
                d={`M ${cx + insulaWidth/2} ${insulaY} 
                    L ${cx + insulaWidth/2 + depth} ${insulaY - depth * 0.5} 
                    L ${cx + insulaWidth/2 + depth} ${insulaY + height * 0.9 - depth * 0.5} 
                    L ${cx + insulaWidth/2} ${insulaY + height * 0.9} Z`}
                fill={darkStone} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Story divisions */}
            {Array.from({length: stories - 1}).map((_, i) => (
                <rect key={`story-div-${i}`}
                    x={cx - insulaWidth/2} 
                    y={insulaY + (i + 1) * storyHeight} 
                    width={insulaWidth} 
                    height={3}
                    fill={darkStone} 
                    stroke={shadowColor} 
                    strokeWidth="0.4" 
                />
            ))}
            
            {/* Roman tile roof */}
            <path 
                d={`M ${cx - insulaWidth * 0.55} ${insulaY} 
                    L ${cx + insulaWidth * 0.55} ${insulaY} 
                    L ${cx + insulaWidth * 0.55 + depth} ${insulaY - depth * 0.5} 
                    L ${cx - insulaWidth * 0.55 + depth} ${insulaY - depth * 0.5} Z`}
                fill={tileRed} 
                stroke={shadowColor} 
                strokeWidth="0.8" 
            />
            
            {/* Roof tile pattern */}
            {Array.from({length: 6}).map((_, i) => (
                <line key={`tile-${i}`}
                    x1={cx - insulaWidth * 0.5 + i * (insulaWidth / 6)} 
                    y1={insulaY - 2} 
                    x2={cx - insulaWidth * 0.5 + i * (insulaWidth / 6) + depth} 
                    y2={insulaY - 2 - depth * 0.5}
                    stroke={`hsl(10, 65%, 30%)`} 
                    strokeWidth="0.4" 
                    opacity="0.7"
                />
            ))}
            
            {/* Windows for each story */}
            {Array.from({length: stories}).map((_, story) => {
                const storyY = insulaY + story * storyHeight;
                const windowY = storyY + storyHeight * 0.3;
                const windowHeight = storyHeight * 0.4;
                
                return Array.from({length: 4}).map((_, winIdx) => (
                    <g key={`window-${story}-${winIdx}`}>
                        {/* Window opening */}
                        <rect 
                            x={cx - insulaWidth * 0.4 + winIdx * (insulaWidth / 5)} 
                            y={windowY} 
                            width={insulaWidth * 0.12} 
                            height={windowHeight}
                            fill="rgba(0,0,0,0.8)" 
                            stroke={darkStone} 
                            strokeWidth="0.6" 
                        />
                        
                        {/* Window frame */}
                        <rect 
                            x={cx - insulaWidth * 0.42 + winIdx * (insulaWidth / 5)} 
                            y={windowY - 1} 
                            width={insulaWidth * 0.16} 
                            height={windowHeight + 2}
                            fill="none" 
                            stroke={lightStone} 
                            strokeWidth="0.8" 
                        />
                        
                        {/* Window shutters (some windows) */}
                        {stoneVariation[winIdx] > 0.6 && (
                            <rect 
                                x={cx - insulaWidth * 0.45 + winIdx * (insulaWidth / 5)} 
                                y={windowY} 
                                width={insulaWidth * 0.03} 
                                height={windowHeight}
                                fill={romanRed} 
                                stroke={shadowColor} 
                                strokeWidth="0.3" 
                            />
                        )}
                    </g>
                ));
            })}
            
            {/* Balconies on upper floors */}
            {balconyChance > 0.4 && Array.from({length: 2}).map((_, balconyIdx) => {
                const balconyStory = balconyIdx + 1;
                const balconyY = insulaY + balconyStory * storyHeight + storyHeight * 0.6;
                const balconyX = cx - insulaWidth * 0.1;
                
                return (
                    <g key={`balcony-${balconyIdx}`}>
                        {/* Balcony platform */}
                        <rect 
                            x={balconyX} 
                            y={balconyY} 
                            width={insulaWidth * 0.2} 
                            height={3}
                            fill={lightStone} 
                            stroke={shadowColor} 
                            strokeWidth="0.6" 
                        />
                        
                        {/* Balcony supports */}
                        <rect 
                            x={balconyX - 1} 
                            y={balconyY} 
                            width={2} 
                            height={storyHeight * 0.3}
                            fill={darkStone} 
                            stroke={shadowColor} 
                            strokeWidth="0.4" 
                        />
                        <rect 
                            x={balconyX + insulaWidth * 0.2 - 1} 
                            y={balconyY} 
                            width={2} 
                            height={storyHeight * 0.3}
                            fill={darkStone} 
                            stroke={shadowColor} 
                            strokeWidth="0.4" 
                        />
                        
                        {/* Balcony railing */}
                        {Array.from({length: 5}).map((_, railIdx) => (
                            <rect key={`rail-${balconyIdx}-${railIdx}`}
                                x={balconyX + railIdx * (insulaWidth * 0.04)} 
                                y={balconyY - 4} 
                                width={1} 
                                height={4}
                                fill={lightStone} 
                                opacity="0.8"
                            />
                        ))}
                    </g>
                );
            })}
            
            {/* Ground floor shops/entrances */}
            <g>
                {/* Central entrance */}
                <rect 
                    x={cx - insulaWidth * 0.08} 
                    y={insulaY + height * 0.7} 
                    width={insulaWidth * 0.16} 
                    height={height * 0.2}
                    fill={shadowColor} 
                    stroke={darkStone} 
                    strokeWidth="0.8" 
                />
                
                {/* Shop entrances */}
                {Array.from({length: 2}).map((_, shopIdx) => (
                    <rect key={`shop-${shopIdx}`}
                        x={cx + (shopIdx === 0 ? -insulaWidth * 0.35 : insulaWidth * 0.2)} 
                        y={insulaY + height * 0.75} 
                        width={insulaWidth * 0.12} 
                        height={height * 0.15}
                        fill={shadowColor} 
                        stroke={darkStone} 
                        strokeWidth="0.6" 
                    />
                ))}
            </g>
            
            {/* Roman architectural details */}
            {/* Cornice */}
            <rect 
                x={cx - insulaWidth * 0.52} 
                y={insulaY - 3} 
                width={insulaWidth * 1.04} 
                height={5}
                fill={lightStone} 
                stroke={shadowColor} 
                strokeWidth="0.6" 
            />
            
            {/* Pilasters */}
            {Array.from({length: 3}).map((_, pilIdx) => (
                <rect key={`pilaster-${pilIdx}`}
                    x={cx - insulaWidth * 0.3 + pilIdx * (insulaWidth * 0.3)} 
                    y={insulaY + storyHeight} 
                    width={4} 
                    height={height * 0.6}
                    fill={lightStone} 
                    stroke={shadowColor} 
                    strokeWidth="0.4" 
                    opacity="0.8"
                />
            ))}
            
            {/* Night lighting */}
            {nightIntensity > 0 && (
                <g>
                    {Array.from({length: stories}).map((_, story) => 
                        Array.from({length: 2}).map((_, winIdx) => {
                            const storyY = insulaY + story * storyHeight;
                            const windowY = storyY + storyHeight * 0.3;
                            const windowHeight = storyHeight * 0.4;
                            const litChance = stoneVariation[story + winIdx];
                            
                            return litChance > 0.5 ? (
                                <rect key={`light-${story}-${winIdx}`}
                                    x={cx - insulaWidth * 0.25 + winIdx * (insulaWidth / 3)} 
                                    y={windowY} 
                                    width={insulaWidth * 0.12} 
                                    height={windowHeight}
                                    fill="rgba(255, 180, 100, 0.7)" 
                                    opacity={nightIntensity * 0.8}
                                />
                            ) : null;
                        })
                    )}
                </g>
            )}
        </g>
    );
});

export default RomanInsula3D;