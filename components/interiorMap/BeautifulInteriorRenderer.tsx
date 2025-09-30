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

const TILE_SIZE = 24;
const WALL_HEIGHT_3D = 12;

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

// Lighting effects
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
                    <ellipse cx="0" cy="-12" rx="6" ry="8" fill="#FF6347" opacity="0.8"/>
                    <ellipse cx="0" cy="-14" rx="4" ry="6" fill="#FFD700" opacity="0.9"/>
                </g>
            )}
            
            {type === 'candle' && (
                <g transform={`translate(${x},${y})`}>
                    <rect x="-1" y="-6" width="2" height="12" fill="#F5DEB3" rx="1"/>
                    <ellipse cx="0" cy="-8" rx="3" ry="4" fill="#FFD700" opacity="0.8"/>
                </g>
            )}
            
            {type === 'brazier' && (
                <g transform={`translate(${x},${y})`}>
                    <ellipse cx="0" cy="0" rx="8" ry="4" fill="#8B4513"/>
                    <ellipse cx="0" cy="-2" rx="8" ry="4" fill="#CD853F"/>
                    <ellipse cx="0" cy="-8" rx="6" ry="8" fill="#FF6347" opacity="0.7"/>
                    <ellipse cx="0" cy="-10" rx="4" ry="6" fill="#FFD700" opacity="0.9"/>
                </g>
            )}
            
            {type === 'chandelier' && (
                <g transform={`translate(${x},${y})`}>
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#DAA520" strokeWidth="2"/>
                    <circle cx="-8" cy="-2" r="2" fill="#FFD700"/>
                    <circle cx="8" cy="-2" r="2" fill="#FFD700"/>
                    <circle cx="0" cy="-8" r="2" fill="#FFD700"/>
                    <circle cx="0" cy="6" r="2" fill="#FFD700"/>
                    <line x1="0" y1="-15" x2="0" y2="-8" stroke="#8B4513" strokeWidth="2"/>
                </g>
            )}
            
            {type === 'window' && (
                <g transform={`translate(${x},${y})`}>
                    <rect x="-12" y="-12" width="24" height="24" fill={color} opacity="0.3" rx="4"/>
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#654321" strokeWidth="1"/>
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#654321" strokeWidth="1"/>
                </g>
            )}
            
            {type === 'altar_glow' && (
                <circle
                    cx={x}
                    cy={y}
                    r={glowRadius * 1.5}
                    fill={`url(#altar-glow-${position.x}-${position.y})`}
                    opacity={intensity * 0.8}
                />
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

// Beautiful furniture rendering
const FurnitureElement: React.FC<{
    type: string;
    position: Point;
    rotation?: number;
    scale?: number;
    renderScale: number;
}> = ({ type, position, rotation = 0, scale = 1, renderScale }) => {
    const x = position.x * TILE_SIZE * renderScale;
    const y = position.y * TILE_SIZE * renderScale;
    const furnitureScale = scale * renderScale;
    
    return (
        <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${furnitureScale})`}>
            {type === 'altar' && (
                <g>
                    <rect x="-16" y="-8" width="32" height="16" fill="#8B7355" stroke="#654321" strokeWidth="1" rx="2"/>
                    <rect x="-14" y="-6" width="28" height="12" fill="#DEB887"/>
                    <rect x="-12" y="-10" width="24" height="4" fill="#DAA520" rx="2"/>
                    <circle cx="0" cy="-8" r="3" fill="#FFD700"/>
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
                    <rect x="-12" y="-8" width="24" height="16" fill="#DAA520" stroke="#B8860B" strokeWidth="1" rx="4"/>
                    <rect x="-10" y="-6" width="20" height="12" fill="#FFD700"/>
                    <rect x="-12" y="-20" width="24" height="12" fill="#DAA520" rx="2"/>
                    <rect x="-14" y="-8" width="4" height="16" fill="#DAA520"/>
                    <rect x="10" y="-8" width="4" height="16" fill="#DAA520"/>
                    <circle cx="-6" cy="-14" r="2" fill="#FF6347"/>
                    <circle cx="6" cy="-14" r="2" fill="#FF6347"/>
                    <path d="M-6,-18 L0,-22 L6,-18" fill="#FF6347"/>
                </g>
            )}
            
            {type === 'pillar' && (
                <g>
                    <ellipse cx="0" cy="0" rx="6" ry="4" fill="#A0826D"/>
                    <rect x="-6" y="-24" width="12" height="24" fill="#8B7355" stroke="#654321" strokeWidth="1"/>
                    <ellipse cx="0" cy="-24" rx="8" ry="5" fill="#DEB887"/>
                    <rect x="-8" y="-28" width="16" height="4" fill="#DAA520" rx="2"/>
                </g>
            )}
            
            {type === 'rug' && (
                <g>
                    <ellipse cx="0" cy="0" rx="20" ry="16" fill="#8B0000" stroke="#DAA520" strokeWidth="2"/>
                    <ellipse cx="0" cy="0" rx="16" ry="12" fill="#DC143C"/>
                    <path d="M-12,0 L12,0 M0,-8 L0,8" stroke="#DAA520" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="4" fill="none" stroke="#DAA520" strokeWidth="1"/>
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
        const viewBoxWidth = (layout.totalBounds.width * TILE_SIZE * scale) + (padding * 2);
        const viewBoxHeight = (layout.totalBounds.height * TILE_SIZE * scale) + (padding * 2);

        return {
            viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
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
                background: `radial-gradient(ellipse at center, ${layout.ambientLighting.color} 0%, rgba(0,0,0,0.8) 100%)`,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                maxHeight: '100%'
            }}
        >
            <defs>
                {Object.entries(FloorPatterns).map(([key, pattern]) => (
                    <g key={`pattern-${key}`}>{pattern}</g>
                ))}
                
                {/* Vignette effect */}
                <radialGradient id="vignette">
                    <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="70%" stopColor="rgba(0,0,0,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                </radialGradient>
                
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
            
            {/* Player character */}
            {playerCharacter && (
                <g transform={`translate(${playerPosition.x * TILE_SIZE * scale}, ${playerPosition.y * TILE_SIZE * scale})`}>
                    <PlayerIcon 
                        character={playerCharacter}
                        x={0}
                        y={0}
                        scale={scale}
                        showGlow={true}
                        showShadow={true}
                    />
                </g>
            )}
            
            {/* NPCs - using proper sprite rendering */}
            {npcs.map((npc, idx) => (
                <g
                    key={`npc-${npc.id || idx}`}
                    transform={`translate(${npc.x * TILE_SIZE * scale}, ${npc.y * TILE_SIZE * scale})`}
                    onClick={onNpcClick ? () => onNpcClick(npc) : undefined}
                    style={onNpcClick ? { cursor: 'pointer' } : undefined}
                >
                    <NpcIcon
                        npc={npc}
                        x={0}
                        y={0}
                        scale={scale}
                        showShadow={true}
                        isSelected={false}
                        debugMode={false}
                    />
                </g>
            ))}
            
            {/* Vignette overlay */}
            <rect
                width="100%"
                height="100%"
                fill="url(#vignette)"
                pointerEvents="none"
            />
        </svg>
    );
};

export default BeautifulInteriorRenderer;