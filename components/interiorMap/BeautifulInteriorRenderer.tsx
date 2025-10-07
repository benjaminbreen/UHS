/**
 * Beautiful SVG-based interior renderer with 3D isometric walls, lighting, and shadows
 */
import React, { useMemo } from 'react';
import { ArchitecturalSpace, BuildingLayout } from '../../generation/interiorMap/architecturalLayouts';
import { Point, NpcEntity } from '../../types';
import { PlayerIcon } from '../symbols';
import { NpcIcon } from '../symbols';

interface BeautifulInteriorRendererProps {
    layout: BuildingLayout;
    playerPosition: Point;
    playerCharacter?: any; // PlayerCharacter type
    npcs?: NpcEntity[];
    scale?: number;
    onNpcClick?: (npc: NpcEntity) => void;
}

const TILE_SIZE = 32; // Increased from 24 for larger, more intimate scale
const WALL_HEIGHT_3D = 16; // Proportionally increased wall height

// Beautiful floor patterns
const FloorPatterns = {
    stone: (
        <pattern id="stoneFloor" patternUnits="userSpaceOnUse" width="48" height="48">
            <rect width="48" height="48" fill="#8B7D6B"/>
            <rect x="2" y="2" width="20" height="20" fill="#A0937F" stroke="#6B6B47" strokeWidth="0.5"/>
            <rect x="26" y="2" width="20" height="20" fill="#9C8F7C" stroke="#6B6B47" strokeWidth="0.5"/>
            <rect x="2" y="26" width="20" height="20" fill="#A3967F" stroke="#6B6B47" strokeWidth="0.5"/>
            <rect x="26" y="26" width="20" height="20" fill="#988B7E" stroke="#6B6B47" strokeWidth="0.5"/>
        </pattern>
    ),
    marble: (
        <pattern id="marbleFloor" patternUnits="userSpaceOnUse" width="48" height="48">
            <rect width="48" height="48" fill="#F8F8FF"/>
            <path d="M0,24 Q12,20 24,24 T48,24" stroke="#E6E6FA" strokeWidth="1" fill="none"/>
            <path d="M0,12 Q24,8 48,12" stroke="#E6E6FA" strokeWidth="0.5" fill="none"/>
            <path d="M0,36 Q24,40 48,36" stroke="#E6E6FA" strokeWidth="0.5" fill="none"/>
            <circle cx="12" cy="12" r="1" fill="#DDA0DD" opacity="0.3"/>
            <circle cx="36" cy="36" r="1" fill="#DDA0DD" opacity="0.3"/>
        </pattern>
    ),
    wood: (
        <pattern id="woodFloor" patternUnits="userSpaceOnUse" width="96" height="24">
            <rect width="96" height="24" fill="#D2B48C"/>
            <rect x="0" y="0" width="96" height="12" fill="#DEB887"/>
            <rect x="0" y="12" width="96" height="12" fill="#CD853F"/>
            <line x1="0" y1="12" x2="96" y2="12" stroke="#8B7355" strokeWidth="1"/>
            <line x1="24" y1="0" x2="24" y2="24" stroke="#8B7355" strokeWidth="0.5"/>
            <line x1="48" y1="0" x2="48" y2="24" stroke="#8B7355" strokeWidth="0.5"/>
            <line x1="72" y1="0" x2="72" y2="24" stroke="#8B7355" strokeWidth="0.5"/>
        </pattern>
    ),
    mosaic: (
        <pattern id="mosaicFloor" patternUnits="userSpaceOnUse" width="24" height="24">
            <rect width="24" height="24" fill="#F0E68C"/>
            <polygon points="4,4 8,4 6,8" fill="#4169E1"/>
            <polygon points="12,4 16,4 14,8" fill="#DC143C"/>
            <polygon points="20,4 24,4 22,8" fill="#32CD32"/>
            <polygon points="4,12 8,12 6,16" fill="#DC143C"/>
            <polygon points="12,12 16,12 14,16" fill="#32CD32"/>
            <polygon points="20,12 24,12 22,16" fill="#4169E1"/>
            <polygon points="4,20 8,20 6,24" fill="#32CD32"/>
            <polygon points="12,20 16,20 14,24" fill="#4169E1"/>
            <polygon points="20,20 24,20 22,24" fill="#DC143C"/>
        </pattern>
    ),
    carpet: (
        <pattern id="carpetFloor" patternUnits="userSpaceOnUse" width="48" height="48">
            <rect width="48" height="48" fill="#8B0000"/>
            <rect x="4" y="4" width="40" height="40" fill="#DC143C" stroke="#DAA520" strokeWidth="2"/>
            <path d="M12,12 L36,12 L36,36 L12,36 Z" fill="none" stroke="#DAA520" strokeWidth="1"/>
            <circle cx="24" cy="24" r="8" fill="none" stroke="#DAA520" strokeWidth="1"/>
            <path d="M16,24 L32,24 M24,16 L24,32" stroke="#DAA520" strokeWidth="1"/>
        </pattern>
    ),
    tile: (
        <pattern id="tileFloor" patternUnits="userSpaceOnUse" width="32" height="32">
            <rect width="32" height="32" fill="#4682B4"/>
            <rect x="2" y="2" width="12" height="12" fill="#5F9EA0" stroke="#2F4F4F" strokeWidth="0.5"/>
            <rect x="18" y="2" width="12" height="12" fill="#87CEEB" stroke="#2F4F4F" strokeWidth="0.5"/>
            <rect x="2" y="18" width="12" height="12" fill="#87CEEB" stroke="#2F4F4F" strokeWidth="0.5"/>
            <rect x="18" y="18" width="12" height="12" fill="#5F9EA0" stroke="#2F4F4F" strokeWidth="0.5"/>
        </pattern>
    )
};

// 3D Isometric wall rendering
const IsometricWall: React.FC<{
    x: number;
    y: number;
    width: number;
    height: number;
    wallHeight: number;
    lightIntensity: number;
}> = ({ x, y, width, height, wallHeight, lightIntensity }) => {
    const topFace = `M${x},${y} L${x + width},${y} L${x + width - wallHeight/2},${y - wallHeight/2} L${x - wallHeight/2},${y - wallHeight/2} Z`;
    const rightFace = `M${x + width},${y} L${x + width},${y + height} L${x + width - wallHeight/2},${y + height - wallHeight/2} L${x + width - wallHeight/2},${y - wallHeight/2} Z`;
    
    const shadowIntensity = Math.max(0.2, 1 - lightIntensity);
    
    return (
        <g>
            {/* Main wall face */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#8B7355"
                stroke="#654321"
                strokeWidth={0.5}
            />
            
            {/* Top face (3D effect) */}
            <path
                d={topFace}
                fill="#A0826D"
                stroke="#654321"
                strokeWidth={0.5}
            />
            
            {/* Right face (3D effect) */}
            <path
                d={rightFace}
                fill={`rgba(107, 67, 33, ${shadowIntensity})`}
                stroke="#654321"
                strokeWidth={0.5}
            />
        </g>
    );
};

// Lighting effects with animated flames
const LightingEffect: React.FC<{
    type: string;
    position: Point;
    intensity: number;
    color: string;
    scale: number;
}> = ({ type, position, intensity, color, scale }) => {
    const x = position.x * TILE_SIZE * scale;
    const y = position.y * TILE_SIZE * scale;
    const glowRadius = 60 * intensity * scale;

    return (
        <g>
            {/* Glow effect */}
            <circle
                cx={x}
                cy={y}
                r={glowRadius}
                fill={`url(#glow-${type}-${position.x}-${position.y})`}
                opacity={intensity * 0.6}
            />

            {/* Light source visualization */}
            {type === 'torch' && (
                <g transform={`translate(${x},${y})`}>
                    <rect x="-2" y="-8" width="4" height="16" fill="#8B4513" rx="2"/>
                    <ellipse cx="0" cy="-12" rx="6" ry="8" fill="#FF6347" opacity="0.8">
                        <animate attributeName="ry" values="8;9;7;8" dur="1.5s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;0.9;0.7;0.8" dur="1.5s" repeatCount="indefinite"/>
                    </ellipse>
                    <ellipse cx="0" cy="-14" rx="4" ry="6" fill="#FFD700" opacity="0.9">
                        <animate attributeName="ry" values="6;7;5;6" dur="1s" repeatCount="indefinite"/>
                        <animate attributeName="cy" values="-14;-15;-13;-14" dur="1s" repeatCount="indefinite"/>
                    </ellipse>
                    {/* Smoke particles */}
                    <circle cx="-1" cy="-18" r="1" fill="#708090" opacity="0.3">
                        <animate attributeName="cy" values="-18;-28" dur="3s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.3;0" dur="3s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="1" cy="-20" r="1" fill="#708090" opacity="0.2">
                        <animate attributeName="cy" values="-20;-30" dur="4s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.2;0" dur="4s" repeatCount="indefinite"/>
                    </circle>
                </g>
            )}

            {type === 'candle' && (
                <g transform={`translate(${x},${y})`}>
                    <rect x="-1" y="-6" width="2" height="12" fill="#F5DEB3" rx="1"/>
                    <ellipse cx="0" cy="-8" rx="3" ry="4" fill="#FFD700" opacity="0.8">
                        <animate attributeName="ry" values="4;5;3;4" dur="2s" repeatCount="indefinite"/>
                    </ellipse>
                </g>
            )}

            {type === 'brazier' && (
                <g transform={`translate(${x},${y})`}>
                    <ellipse cx="0" cy="0" rx="8" ry="4" fill="#8B4513"/>
                    <ellipse cx="0" cy="-2" rx="8" ry="4" fill="#CD853F"/>
                    <ellipse cx="0" cy="-8" rx="6" ry="8" fill="#FF6347" opacity="0.7">
                        <animate attributeName="ry" values="8;10;7;8" dur="1.2s" repeatCount="indefinite"/>
                        <animate attributeName="rx" values="6;7;5;6" dur="1.5s" repeatCount="indefinite"/>
                    </ellipse>
                    <ellipse cx="0" cy="-10" rx="4" ry="6" fill="#FFD700" opacity="0.9">
                        <animate attributeName="ry" values="6;8;5;6" dur="1s" repeatCount="indefinite"/>
                        <animate attributeName="cy" values="-10;-12;-9;-10" dur="1s" repeatCount="indefinite"/>
                    </ellipse>
                    {/* Smoke */}
                    <circle cx="0" cy="-15" r="2" fill="#708090" opacity="0.4">
                        <animate attributeName="cy" values="-15;-30" dur="4s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.4;0" dur="4s" repeatCount="indefinite"/>
                        <animate attributeName="r" values="2;3" dur="4s" repeatCount="indefinite"/>
                    </circle>
                </g>
            )}

            {type === 'chandelier' && (
                <g transform={`translate(${x},${y})`}>
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#DAA520" strokeWidth="2"/>
                    <circle cx="-8" cy="-2" r="2" fill="#FFD700">
                        <animate attributeName="opacity" values="0.9;1;0.8;0.9" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="8" cy="-2" r="2" fill="#FFD700">
                        <animate attributeName="opacity" values="0.8;0.9;1;0.8" dur="2.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="0" cy="-8" r="2" fill="#FFD700">
                        <animate attributeName="opacity" values="1;0.8;0.9;1" dur="1.8s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="0" cy="6" r="2" fill="#FFD700">
                        <animate attributeName="opacity" values="0.9;0.8;1;0.9" dur="2.5s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="0" y1="-15" x2="0" y2="-8" stroke="#8B4513" strokeWidth="2"/>
                </g>
            )}

            {type === 'window' && (
                <g transform={`translate(${x},${y})`}>
                    <rect x="-12" y="-12" width="24" height="24" fill={color} opacity="0.3" rx="4"/>
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#654321" strokeWidth="1"/>
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#654321" strokeWidth="1"/>
                    {/* Dust motes in light beam */}
                    <circle cx="-4" cy="2" r="0.5" fill="#F5F5DC" opacity="0.6">
                        <animate attributeName="cy" values="2;12" dur="5s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="5s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="3" cy="-5" r="0.5" fill="#F5F5DC" opacity="0.5">
                        <animate attributeName="cy" values="-5;8" dur="6s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="6s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="-6" cy="8" r="0.5" fill="#F5F5DC" opacity="0.4">
                        <animate attributeName="cy" values="8;15" dur="7s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="7s" repeatCount="indefinite"/>
                    </circle>
                </g>
            )}

            {type === 'altar_glow' && (
                <circle
                    cx={x}
                    cy={y}
                    r={glowRadius * 1.5}
                    fill={`url(#altar-glow-${position.x}-${position.y})`}
                    opacity={intensity * 0.8}
                >
                    <animate attributeName="opacity" values="0.8;0.9;0.7;0.8" dur="3s" repeatCount="indefinite"/>
                </circle>
            )}

            <defs>
                <radialGradient id={`glow-${type}-${position.x}-${position.y}`}>
                    <stop offset="0%" stopColor={color} stopOpacity="0.8"/>
                    <stop offset="50%" stopColor={color} stopOpacity="0.4"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </radialGradient>

                {type === 'altar_glow' && (
                    <radialGradient id={`altar-glow-${position.x}-${position.y}`}>
                        <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
                        <stop offset="30%" stopColor={color} stopOpacity="0.6"/>
                        <stop offset="70%" stopColor={color} stopOpacity="0.2"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0"/>
                    </radialGradient>
                )}
            </defs>
        </g>
    );
};

// Beautiful furniture rendering with cultural variations
const FurnitureElement: React.FC<{
    type: string;
    position: Point;
    rotation?: number;
    scale?: number;
    renderScale: number;
    culturalVariant?: string; // 'european' | 'east_asian' | 'mena' | 'default'
}> = ({ type, position, rotation = 0, scale = 1, renderScale, culturalVariant = 'default' }) => {
    const x = position.x * TILE_SIZE * renderScale;
    const y = position.y * TILE_SIZE * renderScale;
    const furnitureScale = scale * renderScale;

    return (
        <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${furnitureScale})`}>
            {type === 'altar' && (
                <g>
                    {culturalVariant === 'east_asian' ? (
                        // East Asian altar with incense burner
                        <>
                            <rect x="-16" y="-8" width="32" height="16" fill="#8B0000" stroke="#4A0000" strokeWidth="1" rx="1"/>
                            <rect x="-14" y="-6" width="28" height="12" fill="#DC143C"/>
                            <circle cx="0" cy="-2" r="4" fill="#DAA520" stroke="#B8860B" strokeWidth="1"/>
                            <path d="M-2,-6 L0,-10 L2,-6" fill="#708090" opacity="0.7"/>
                        </>
                    ) : culturalVariant === 'mena' ? (
                        // MENA altar with geometric patterns
                        <>
                            <rect x="-16" y="-8" width="32" height="16" fill="#8B7355" stroke="#654321" strokeWidth="1" rx="2"/>
                            <rect x="-14" y="-6" width="28" height="12" fill="#D2B48C"/>
                            <path d="M-10,-2 L-6,-6 L-2,-2 L-6,2 Z" fill="#4169E1" opacity="0.8"/>
                            <path d="M2,-2 L6,-6 L10,-2 L6,2 Z" fill="#32CD32" opacity="0.8"/>
                        </>
                    ) : (
                        // European altar (default)
                        <>
                            <rect x="-16" y="-8" width="32" height="16" fill="#8B7355" stroke="#654321" strokeWidth="1" rx="2"/>
                            <rect x="-14" y="-6" width="28" height="12" fill="#DEB887"/>
                            <rect x="-12" y="-10" width="24" height="4" fill="#DAA520" rx="2"/>
                            <circle cx="0" cy="-8" r="3" fill="#FFD700"/>
                        </>
                    )}
                </g>
            )}

            {type === 'pew' && (
                <g>
                    <rect x="-20" y="-6" width="40" height="12" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2"/>
                    <rect x="-20" y="-12" width="4" height="6" fill="#8B4513"/>
                    <rect x="16" y="-12" width="4" height="6" fill="#8B4513"/>
                </g>
            )}

            {type === 'throne' && (
                <g>
                    {culturalVariant === 'east_asian' ? (
                        // East Asian throne with curved back
                        <>
                            <rect x="-12" y="-8" width="24" height="16" fill="#8B0000" stroke="#4A0000" strokeWidth="1" rx="4"/>
                            <rect x="-10" y="-6" width="20" height="12" fill="#DC143C"/>
                            <path d="M-12,-20 Q-14,-16 -12,-12 L-12,-8 L-14,-8 L-14,-12 Q-16,-16 -14,-20 Z" fill="#8B0000"/>
                            <path d="M12,-20 Q14,-16 12,-12 L12,-8 L14,-8 L14,-12 Q16,-16 14,-20 Z" fill="#8B0000"/>
                            <circle cx="0" cy="-14" r="3" fill="#FFD700"/>
                        </>
                    ) : culturalVariant === 'mena' ? (
                        // MENA throne with geometric patterns
                        <>
                            <rect x="-12" y="-8" width="24" height="16" fill="#4169E1" stroke="#1E3A8A" strokeWidth="1" rx="4"/>
                            <rect x="-10" y="-6" width="20" height="12" fill="#5B7FFF"/>
                            <rect x="-12" y="-20" width="24" height="12" fill="#4169E1" rx="2"/>
                            <path d="M-8,-14 L-4,-18 L0,-14 L-4,-10 Z" fill="#DAA520"/>
                            <path d="M4,-14 L8,-18 L4,-10 L0,-14 Z" fill="#DAA520"/>
                        </>
                    ) : (
                        // European throne (default)
                        <>
                            <rect x="-12" y="-8" width="24" height="16" fill="#DAA520" stroke="#B8860B" strokeWidth="1" rx="4"/>
                            <rect x="-10" y="-6" width="20" height="12" fill="#FFD700"/>
                            <rect x="-12" y="-20" width="24" height="12" fill="#DAA520" rx="2"/>
                            <rect x="-14" y="-8" width="4" height="16" fill="#DAA520"/>
                            <rect x="10" y="-8" width="4" height="16" fill="#DAA520"/>
                            <circle cx="-6" cy="-14" r="2" fill="#FF6347"/>
                            <circle cx="6" cy="-14" r="2" fill="#FF6347"/>
                            <path d="M-6,-18 L0,-22 L6,-18" fill="#FF6347"/>
                        </>
                    )}
                </g>
            )}

            {type === 'pillar' && (
                <g>
                    {culturalVariant === 'east_asian' ? (
                        // East Asian pillar with red lacquer
                        <>
                            <ellipse cx="0" cy="0" rx="6" ry="4" fill="#4A0000"/>
                            <rect x="-6" y="-24" width="12" height="24" fill="#8B0000" stroke="#4A0000" strokeWidth="1"/>
                            <ellipse cx="0" cy="-24" rx="8" ry="5" fill="#DC143C"/>
                            <rect x="-8" y="-28" width="16" height="4" fill="#DAA520" rx="2"/>
                            <path d="M-6,-12 L6,-12" stroke="#DAA520" strokeWidth="1"/>
                        </>
                    ) : culturalVariant === 'mena' ? (
                        // MENA pillar with geometric patterns
                        <>
                            <ellipse cx="0" cy="0" rx="6" ry="4" fill="#A0826D"/>
                            <rect x="-6" y="-24" width="12" height="24" fill="#D2B48C" stroke="#654321" strokeWidth="1"/>
                            <rect x="-6" y="-20" width="12" height="4" fill="#4169E1" opacity="0.6"/>
                            <rect x="-6" y="-12" width="12" height="4" fill="#32CD32" opacity="0.6"/>
                            <ellipse cx="0" cy="-24" rx="8" ry="5" fill="#DEB887"/>
                        </>
                    ) : (
                        // European/classical pillar (default)
                        <>
                            <ellipse cx="0" cy="0" rx="6" ry="4" fill="#A0826D"/>
                            <rect x="-6" y="-24" width="12" height="24" fill="#8B7355" stroke="#654321" strokeWidth="1"/>
                            <ellipse cx="0" cy="-24" rx="8" ry="5" fill="#DEB887"/>
                            <rect x="-8" y="-28" width="16" height="4" fill="#DAA520" rx="2"/>
                        </>
                    )}
                </g>
            )}

            {type === 'rug' && (
                <g>
                    {culturalVariant === 'mena' ? (
                        // Persian-style rug with geometric patterns
                        <>
                            <ellipse cx="0" cy="0" rx="20" ry="16" fill="#8B0000" stroke="#DAA520" strokeWidth="2"/>
                            <ellipse cx="0" cy="0" rx="16" ry="12" fill="#DC143C"/>
                            <path d="M-8,-6 L-4,-10 L0,-6 L-4,-2 Z" fill="#4169E1" opacity="0.8"/>
                            <path d="M4,-6 L8,-10 L4,-2 L0,-6 Z" fill="#32CD32" opacity="0.8"/>
                            <path d="M-8,2 L-4,6 L0,2 L-4,-2 Z" fill="#FFD700" opacity="0.8"/>
                            <path d="M4,2 L8,6 L4,-2 L0,2 Z" fill="#FF6347" opacity="0.8"/>
                            <circle cx="0" cy="0" r="3" fill="none" stroke="#FFD700" strokeWidth="0.8"/>
                        </>
                    ) : culturalVariant === 'east_asian' ? (
                        // East Asian rug with dragon/cloud motifs
                        <>
                            <rect x="-20" y="-16" width="40" height="32" fill="#8B0000" stroke="#DAA520" strokeWidth="2" rx="2"/>
                            <rect x="-16" y="-12" width="32" height="24" fill="#DC143C"/>
                            {/* Dragon/cloud pattern */}
                            <circle cx="-6" cy="-4" r="3" fill="#FFD700" opacity="0.7"/>
                            <circle cx="6" cy="-4" r="3" fill="#FFD700" opacity="0.7"/>
                            <circle cx="0" cy="4" r="4" fill="#FFD700" opacity="0.8"/>
                            <path d="M-8,0 Q-4,-4 0,0 T8,0" stroke="#DAA520" strokeWidth="1.5" fill="none"/>
                            <path d="M-10,-8 L10,-8" stroke="#FFD700" strokeWidth="0.8"/>
                            <path d="M-10,8 L10,8" stroke="#FFD700" strokeWidth="0.8"/>
                        </>
                    ) : culturalVariant === 'african' ? (
                        // African rug with geometric tribal patterns
                        <>
                            <rect x="-20" y="-16" width="40" height="32" fill="#8B4513" stroke="#000000" strokeWidth="2"/>
                            <rect x="-16" y="-12" width="32" height="24" fill="#D2691E"/>
                            {/* Tribal geometric patterns */}
                            <path d="M-12,-8 L-8,-4 L-12,0 L-8,4 L-12,8" stroke="#000000" strokeWidth="1.5" fill="none"/>
                            <path d="M12,-8 L8,-4 L12,0 L8,4 L12,8" stroke="#000000" strokeWidth="1.5" fill="none"/>
                            <circle cx="0" cy="0" r="4" fill="none" stroke="#000000" strokeWidth="1.5"/>
                            <path d="M-6,-6 L-2,-2 M6,-6 L2,-2 M-6,6 L-2,2 M6,6 L2,2" stroke="#FFD700" strokeWidth="1"/>
                        </>
                    ) : (
                        // European rug (default) with heraldic cross
                        <>
                            <ellipse cx="0" cy="0" rx="20" ry="16" fill="#8B0000" stroke="#DAA520" strokeWidth="2"/>
                            <ellipse cx="0" cy="0" rx="16" ry="12" fill="#DC143C"/>
                            <path d="M-12,0 L12,0 M0,-8 L0,8" stroke="#DAA520" strokeWidth="1.5"/>
                            <circle cx="0" cy="0" r="4" fill="none" stroke="#DAA520" strokeWidth="1"/>
                            <circle cx="0" cy="0" r="7" fill="none" stroke="#DAA520" strokeWidth="0.8"/>
                        </>
                    )}
                </g>
            )}

            {type === 'tapestry' && (
                <g>
                    <rect x="-2" y="-20" width="4" height="4" fill="#8B4513"/>
                    <rect x="-16" y="-16" width="32" height="24" fill="#4B0082" stroke="#DAA520" strokeWidth="1"/>
                    <rect x="-12" y="-12" width="24" height="16" fill="#8A2BE2"/>
                    <path d="M-8,-8 L8,-8 L8,4 L-8,4 Z" fill="none" stroke="#DAA520" strokeWidth="1"/>
                    <circle cx="-4" cy="-4" r="2" fill="#DAA520"/>
                    <circle cx="4" cy="-4" r="2" fill="#DAA520"/>
                </g>
            )}

            {type === 'chest' && (
                <g>
                    <rect x="-12" y="-6" width="24" height="12" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2"/>
                    <path d="M-12,-6 Q0,-12 12,-6" fill="#A0522D" stroke="#654321" strokeWidth="1"/>
                    <rect x="-2" y="-4" width="4" height="2" fill="#DAA520" rx="1"/>
                    <line x1="-8" y1="-3" x2="8" y2="-3" stroke="#654321" strokeWidth="1"/>
                </g>
            )}

            {type === 'table' && (
                <g>
                    <rect x="-16" y="-8" width="32" height="16" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="1"/>
                    <rect x="-14" y="-6" width="28" height="12" fill="#A0522D"/>
                    <rect x="-2" y="8" width="4" height="4" fill="#654321"/>
                    <rect x="-14" y="8" width="4" height="4" fill="#654321"/>
                    <rect x="10" y="8" width="4" height="4" fill="#654321"/>
                </g>
            )}

            {type === 'chair' && (
                <g>
                    <rect x="-6" y="-4" width="12" height="8" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="1"/>
                    <rect x="-6" y="-10" width="12" height="6" fill="#8B4513" rx="1"/>
                    <rect x="-6" y="4" width="3" height="6" fill="#654321"/>
                    <rect x="3" y="4" width="3" height="6" fill="#654321"/>
                </g>
            )}

            {type === 'statue' && (
                <g>
                    <rect x="-6" y="4" width="12" height="8" fill="#A0826D"/>
                    <ellipse cx="0" cy="0" rx="4" ry="6" fill="#D3D3D3"/>
                    <circle cx="0" cy="-8" r="4" fill="#D3D3D3"/>
                    <rect x="-2" y="-6" width="4" height="8" fill="#D3D3D3"/>
                    <rect x="-6" y="-4" width="3" height="6" fill="#D3D3D3"/>
                    <rect x="3" y="-4" width="3" height="6" fill="#D3D3D3"/>
                </g>
            )}

            {type === 'bookshelf' && (
                <g>
                    <rect x="-12" y="-16" width="24" height="32" fill="#8B4513" stroke="#654321" strokeWidth="1"/>
                    <rect x="-10" y="-14" width="20" height="28" fill="#A0522D"/>
                    <line x1="-10" y1="-4" x2="10" y2="-4" stroke="#654321" strokeWidth="1"/>
                    <line x1="-10" y1="6" x2="10" y2="6" stroke="#654321" strokeWidth="1"/>
                    {/* Books */}
                    <rect x="-8" y="-12" width="3" height="6" fill="#DC143C"/>
                    <rect x="-4" y="-12" width="3" height="6" fill="#4169E1"/>
                    <rect x="0" y="-12" width="3" height="6" fill="#228B22"/>
                    <rect x="4" y="-12" width="3" height="6" fill="#8B4513"/>
                </g>
            )}

            {type === 'fountain' && (
                <g>
                    <circle cx="0" cy="0" r="12" fill="#4682B4" opacity="0.6" stroke="#2F4F4F" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="8" fill="#87CEEB" opacity="0.8"/>
                    <circle cx="0" cy="-2" r="4" fill="#ADD8E6"/>
                    <circle cx="0" cy="-6" r="2" fill="#F0F8FF"/>
                </g>
            )}
        </g>
    );
};

// Environmental particle effects
const AmbientParticles: React.FC<{ bounds: { width: number; height: number }; scale: number; count?: number }> = ({
    bounds,
    scale,
    count = 15
}) => {
    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * bounds.width * TILE_SIZE * scale,
            y: Math.random() * bounds.height * TILE_SIZE * scale,
            duration: 8 + Math.random() * 8, // 8-16 seconds
            delay: Math.random() * 5,
            size: 0.3 + Math.random() * 0.7,
            endY: -20 - Math.random() * 40
        }));
    }, [bounds, scale, count]);

    return (
        <g opacity="0.4">
            {particles.map(p => (
                <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={p.size}
                    fill="#F5F5DC"
                >
                    <animate
                        attributeName="cy"
                        values={`${p.y};${p.endY}`}
                        dur={`${p.duration}s`}
                        begin={`${p.delay}s`}
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0;0.6;0.4;0"
                        dur={`${p.duration}s`}
                        begin={`${p.delay}s`}
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="cx"
                        values={`${p.x};${p.x + (Math.random() - 0.5) * 10};${p.x}`}
                        dur={`${p.duration / 2}s`}
                        begin={`${p.delay}s`}
                        repeatCount="indefinite"
                    />
                </circle>
            ))}
        </g>
    );
};

const BeautifulInteriorRenderer: React.FC<BeautifulInteriorRendererProps> = ({
    layout,
    playerPosition,
    playerCharacter,
    npcs = [],
    scale = 1,
    onNpcClick
}) => {
    const renderData = useMemo(() => {
        // Add padding around the viewBox to prevent clipping player/NPCs at edges
        const padding = TILE_SIZE * 2;
        const viewBoxX = -padding;
        const viewBoxY = -padding;
        // Divide by scale to zoom in (smaller viewBox = closer view)
        const viewBoxWidth = (layout.totalBounds.width * TILE_SIZE / scale) + (padding * 2);
        const viewBoxHeight = (layout.totalBounds.height * TILE_SIZE / scale) + (padding * 2);

        // Calculate center point for vignette (center of viewBox, accounting for negative offset)
        const centerX = viewBoxWidth / 2 + viewBoxX;
        const centerY = viewBoxHeight / 2 + viewBoxY;

        // Radius should cover entire viewport with smooth falloff
        const vignetteRadius = Math.max(viewBoxWidth, viewBoxHeight) * 0.8;

        return {
            viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
            viewBoxX,
            viewBoxY,
            viewBoxWidth,
            viewBoxHeight,
            centerX,
            centerY,
            vignetteRadius,
            spaces: layout.spaces,
            lighting: layout.spaces.flatMap(space => space.lightingSources),
            furniture: layout.spaces.flatMap(space => space.furniture)
        };
    }, [layout, scale]);
    
    return (
        <svg
            viewBox={renderData.viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            style={{
                background: `radial-gradient(ellipse 120% 100% at 50% 45%, ${layout.ambientLighting.color} 0%, rgba(0,0,0,0.9) 100%)`,
                maxHeight: '100%',
                maxWidth: '100%'
            }}
        >
            <defs>
                {Object.entries(FloorPatterns).map(([key, pattern]) => (
                    <g key={`pattern-${key}`}>{pattern}</g>
                ))}
                
                {/* Vignette effect - centered on viewBox with smooth falloff */}
                <radialGradient id="vignette" cx={renderData.centerX} cy={renderData.centerY} r={renderData.vignetteRadius} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="60%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
                </radialGradient>

                {/* Floor depth shading - subtle top-to-bottom gradient */}
                <linearGradient id="floorShading" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>

                {/* Shadow filter */}
                <filter id="dropShadow">
                    <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="rgba(0,0,0,0.5)"/>
                </filter>
            </defs>
            
            {/* Render spaces (floors and walls) */}
            {renderData.spaces.map((space, idx) => (
                <g key={`space-${idx}`}>
                    {/* Floor */}
                    <rect
                        x={space.bounds.x * TILE_SIZE * scale}
                        y={space.bounds.y * TILE_SIZE * scale}
                        width={space.bounds.width * TILE_SIZE * scale}
                        height={space.bounds.height * TILE_SIZE * scale}
                        fill={`url(#${space.floorType}Floor)`}
                        stroke="rgba(0,0,0,0.2)"
                        strokeWidth={0.5}
                    />

                    {/* Subtle floor depth gradient */}
                    <rect
                        x={space.bounds.x * TILE_SIZE * scale}
                        y={space.bounds.y * TILE_SIZE * scale}
                        width={space.bounds.width * TILE_SIZE * scale}
                        height={space.bounds.height * TILE_SIZE * scale}
                        fill="url(#floorShading)"
                        opacity="0.15"
                        pointerEvents="none"
                    />

                    {/* 3D Walls */}
                    <IsometricWall
                        x={space.bounds.x * TILE_SIZE * scale}
                        y={space.bounds.y * TILE_SIZE * scale}
                        width={space.bounds.width * TILE_SIZE * scale}
                        height={space.bounds.height * TILE_SIZE * scale}
                        wallHeight={space.wallHeight * scale}
                        lightIntensity={layout.ambientLighting.intensity}
                    />
                </g>
            ))}
            
            {/* Render furniture with shadows */}
            <g filter="url(#dropShadow)">
                {renderData.furniture.map((furniture, idx) => (
                    <FurnitureElement
                        key={`furniture-${idx}`}
                        type={furniture.type}
                        position={furniture.position}
                        rotation={furniture.rotation}
                        scale={furniture.scale}
                        renderScale={scale}
                        culturalVariant={furniture.culturalVariant || 'default'}
                    />
                ))}
            </g>
            
            {/* Render lighting effects */}
            {renderData.lighting.map((light, idx) => (
                <LightingEffect
                    key={`light-${idx}`}
                    type={light.type}
                    position={light.position}
                    intensity={light.intensity}
                    color={light.color}
                    scale={scale}
                />
            ))}

            {/* Ambient dust particles */}
            <AmbientParticles
                bounds={layout.totalBounds}
                scale={scale}
                count={12}
            />

            {/* Player character - no scale transform (viewBox handles zoom) */}
            {playerCharacter && (
                <g transform={`translate(${playerPosition.x * TILE_SIZE * scale}, ${playerPosition.y * TILE_SIZE * scale})`}>
                    <PlayerIcon
                        character={playerCharacter}
                        x={0}
                        y={0}
                        isInteriorMap={true}
                    />
                </g>
            )}

            {/* NPCs - no scale transform (viewBox handles zoom) */}
            {npcs.map((npc, idx) => {
                // Debug NPC position
                if (isNaN(npc.x) || isNaN(npc.y)) {
                    console.error('🚨 [BeautifulInteriorRenderer] NPC has NaN coordinates:', { name: npc.name, x: npc.x, y: npc.y });
                    return null;
                }

                return (
                    <g
                        key={`npc-${npc.id || idx}`}
                        transform={`translate(${npc.x * TILE_SIZE * scale}, ${npc.y * TILE_SIZE * scale})`}
                        onClick={onNpcClick ? () => onNpcClick(npc) : undefined}
                        style={onNpcClick ? { cursor: 'pointer' } : undefined}
                    >
                        <NpcIcon
                            npc={npc}
                            size={TILE_SIZE}
                            tileSize={TILE_SIZE}
                            isInteriorMap={true}
                        />
                    </g>
                );
            })}
            
            {/* Vignette overlay - covers entire viewBox */}
            <rect
                x={renderData.viewBoxX}
                y={renderData.viewBoxY}
                width={renderData.viewBoxWidth}
                height={renderData.viewBoxHeight}
                fill="url(#vignette)"
                pointerEvents="none"
            />
        </svg>
    );
};

export default BeautifulInteriorRenderer;