import React from 'react';
import { METALS } from '../../constants/gameData/metals';

interface MineralGlintSymbolProps {
    x: number;
    y: number;
    metalId: string;
    quantity: number;
    tileSize: number;
    shouldAnimate?: boolean;
}

const MineralGlintSymbol: React.FC<MineralGlintSymbolProps> = ({ 
    x, 
    y, 
    metalId, 
    quantity,
    tileSize,
    shouldAnimate = true
}) => {
    const metal = METALS[metalId];
    if (!metal) return null;
    
    // Determine visual style based on metal type
    const visualType = metal.visual?.type || 'patches';
    const color = metal.visual?.color || 'rgba(150, 150, 150, 0.6)';
    
    // Calculate size based on quantity
    const sizeMultiplier = Math.min(1.5, 0.5 + (quantity / 200));
    
    const centerX = x * tileSize + tileSize / 2;
    const centerY = y * tileSize + tileSize / 2;
    
    switch (visualType) {
        case 'sparkles':
            // Animated sparkle effect for precious metals
            return (
                <g className="mineral-sparkles">
                    {[0, 120, 240].map((rotation, i) => (
                        <g key={i} transform={`rotate(${rotation} ${centerX} ${centerY})`}>
                            <circle
                                cx={centerX}
                                cy={centerY - tileSize * 0.2}
                                r={2 * sizeMultiplier}
                                fill={color}
                                opacity={0.8}
                            >
                                {shouldAnimate && (
                                    <animate
                                        attributeName="opacity"
                                        values="0.3;0.9;0.3"
                                        dur={`${2 + i * 0.5}s`}
                                        repeatCount="indefinite"
                                    />
                                )}
                            </circle>
                            <circle
                                cx={centerX}
                                cy={centerY - tileSize * 0.2}
                                r={1}
                                fill="white"
                                opacity={0.9}
                            >
                                {shouldAnimate && (
                                    <animate
                                        attributeName="opacity"
                                        values="0.5;1;0.5"
                                        dur={`${2 + i * 0.5}s`}
                                        repeatCount="indefinite"
                                    />
                                )}
                            </circle>
                        </g>
                    ))}
                </g>
            );
            
        case 'streaks':
            // Vein-like streaks for iron, coal, ochre
            return (
                <g className="mineral-streaks">
                    <path
                        d={`M ${centerX - tileSize * 0.3} ${centerY}
                            Q ${centerX} ${centerY - tileSize * 0.1}
                              ${centerX + tileSize * 0.3} ${centerY + tileSize * 0.1}`}
                        stroke={color}
                        strokeWidth={3 * sizeMultiplier}
                        fill="none"
                        opacity={0.6}
                    />
                    <path
                        d={`M ${centerX - tileSize * 0.2} ${centerY - tileSize * 0.2}
                            Q ${centerX} ${centerY}
                              ${centerX + tileSize * 0.2} ${centerY - tileSize * 0.1}`}
                        stroke={color}
                        strokeWidth={2 * sizeMultiplier}
                        fill="none"
                        opacity={0.5}
                    />
                    {shouldAnimate && (
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={tileSize * 0.15}
                            fill={color}
                            opacity={0}
                        >
                            <animate
                                attributeName="opacity"
                                values="0;0.3;0"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    )}
                </g>
            );
            
        case 'patches':
        default:
            // Patchy deposits for copper, tin, clay, etc.
            return (
                <g className="mineral-patches">
                    <ellipse
                        cx={centerX - tileSize * 0.1}
                        cy={centerY}
                        rx={tileSize * 0.2 * sizeMultiplier}
                        ry={tileSize * 0.15 * sizeMultiplier}
                        fill={color}
                        opacity={0.6}
                    />
                    <ellipse
                        cx={centerX + tileSize * 0.1}
                        cy={centerY - tileSize * 0.05}
                        rx={tileSize * 0.15 * sizeMultiplier}
                        ry={tileSize * 0.1 * sizeMultiplier}
                        fill={color}
                        opacity={0.5}
                    />
                    <circle
                        cx={centerX}
                        cy={centerY + tileSize * 0.1}
                        r={tileSize * 0.08 * sizeMultiplier}
                        fill={color}
                        opacity={0.7}
                    />
                    {shouldAnimate && (
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={tileSize * 0.25}
                            fill="white"
                            opacity={0}
                        >
                            <animate
                                attributeName="opacity"
                                values="0;0.2;0"
                                dur="4s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    )}
                </g>
            );
    }
};

export default MineralGlintSymbol;