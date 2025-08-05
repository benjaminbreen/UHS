/**
 * components/TilePatterns.tsx - Enhanced procedural generation with realistic terrain textures
 */
import { useMemo } from 'react';
import { ClimateType, BiomeType, Tile } from '../types';
import { CLIMATE_WATER_COLORS } from '../constants/index';
import { ValueNoise } from '../utils/noise';

const PATTERN_SIZE = 128; // Optimized for performance while maintaining quality
const WATER_PATTERN_SIZE = 256;

// Cache for generated patterns
const patternCache = new Map<string, CanvasPattern>();

// Enhanced water pattern for depth and realism
function createRealisticWaterPattern(climate: ClimateType, seed: number): CanvasPattern | null {
    const cacheKey = `realistic-water-${climate}-${seed}`;
    if (patternCache.has(cacheKey)) {
        return patternCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = WATER_PATTERN_SIZE;
    canvas.height = WATER_PATTERN_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const waterColors = CLIMATE_WATER_COLORS[climate];
    const noise = new ValueNoise(seed + 100);

    // Create base water with depth variation
    const baseGradient = ctx.createRadialGradient(
        WATER_PATTERN_SIZE / 2, WATER_PATTERN_SIZE / 2, 0,
        WATER_PATTERN_SIZE / 2, WATER_PATTERN_SIZE / 2, WATER_PATTERN_SIZE / 2
    );
    baseGradient.addColorStop(0, '#1e40af'); // Deep center
    baseGradient.addColorStop(0.6, '#2563eb'); // Medium depth
    baseGradient.addColorStop(1, '#3b82f6'); // Shallower edges
    
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, WATER_PATTERN_SIZE, WATER_PATTERN_SIZE);

    // Add subtle wave patterns
    for (let i = 0; i < 8; i++) {
        const centerX = noise.random() * WATER_PATTERN_SIZE;
        const centerY = noise.random() * WATER_PATTERN_SIZE;
        const radius = 20 + noise.random() * 40;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + noise.random() * 0.02})`;
        ctx.lineWidth = 1 + noise.random();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
    }
    return pattern;
}

// Enhanced terrain patterns with realistic textures
function createRealisticTerrainPattern(biomeType: BiomeType, seed: number): CanvasPattern | null {
    const cacheKey = `realistic-terrain-${biomeType}-${seed}`;
    if (patternCache.has(cacheKey)) {
        return patternCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = PATTERN_SIZE;
    canvas.height = PATTERN_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const noise = new ValueNoise(seed + biomeType.charCodeAt(0) * 100);

    // Fill with transparent base
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

    switch (biomeType) {
        case BiomeType.GRASSLAND:
        case BiomeType.STEPPE:
            // Multi-layered realistic grass
            // Base grass patches - darker foundation
            for (let i = 0; i < 35; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 20;
                
                const grassGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                grassGrad.addColorStop(0, `rgba(34, 139, 34, ${0.25 + noise.random() * 0.15})`);
                grassGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = grassGrad;
                ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
            }
            
            // Individual grass blades - more realistic
            for (let i = 0; i < 120; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 4 + noise.random() * 8;
                const bend = (noise.random() - 0.5) * 4;
                
                // Grass blade with natural curve
                ctx.strokeStyle = `rgba(${46 + Math.floor(noise.random() * 40)}, ${139 + Math.floor(noise.random() * 60)}, ${87 + Math.floor(noise.random() * 40)}, ${0.4 + noise.random() * 0.4})`;
                ctx.lineWidth = 0.8 + noise.random() * 0.4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + bend, y - height * 0.6, x + bend * 0.3, y - height);
                ctx.stroke();
            }
            
            // Grass clumps for density
            for (let i = 0; i < 25; i++) {
                const clumpX = noise.random() * PATTERN_SIZE;
                const clumpY = noise.random() * PATTERN_SIZE;
                const clumpSize = 3 + noise.random() * 6;
                
                for (let j = 0; j < 5; j++) {
                    const bladeX = clumpX + (noise.random() - 0.5) * clumpSize;
                    const bladeY = clumpY + (noise.random() - 0.5) * clumpSize;
                    const bladeHeight = 2 + noise.random() * 4;
                    
                    ctx.strokeStyle = `rgba(74, 180, 74, ${0.6 + noise.random() * 0.3})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(bladeX, bladeY);
                    ctx.lineTo(bladeX + (noise.random() - 0.5), bladeY - bladeHeight);
                    ctx.stroke();
                }
            }
            break;

        case BiomeType.WETLANDS:
        case BiomeType.MANGROVE:
            // Realistic wetland with water patches and reeds
            // Water patches scattered throughout
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const width = 12 + noise.random() * 20;
                const height = 8 + noise.random() * 15;
                
                const waterGrad = ctx.createRadialGradient(x, y, 0, x, y, width);
                waterGrad.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                waterGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
                waterGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = waterGrad;
                ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
            }
            
            // Wetland vegetation - reeds and rushes
            for (let i = 0; i < 60; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 6 + noise.random() * 12;
                const sway = (noise.random() - 0.5) * 2;
                
                // Reed stems
                ctx.strokeStyle = `rgba(101, 163, 13, ${0.4 + noise.random() * 0.3})`;
                ctx.lineWidth = 1 + noise.random() * 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + sway, y - height);
                ctx.stroke();
                
                // Reed tops
                if (noise.random() > 0.6) {
                    ctx.fillStyle = `rgba(139, 69, 19, ${0.3 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.ellipse(x + sway, y - height, 1 + noise.random(), 2 + noise.random(), 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Muddy patches
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 4 + noise.random() * 8;
                
                ctx.fillStyle = `rgba(101, 67, 33, ${0.1 + noise.random() * 0.15})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case BiomeType.FOREST:
        case BiomeType.DENSE_FOREST:
            // Dense forest undergrowth with fallen leaves
            // Dark forest floor base
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 15 + noise.random() * 25;
                
                const shadowGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                shadowGrad.addColorStop(0, 'rgba(20, 50, 20, 0.2)');
                shadowGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = shadowGrad;
                ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
            }
            
            // Fallen leaves scattered
            for (let i = 0; i < 40; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 1 + noise.random() * 3;
                const hue = noise.random() > 0.5 ? 'rgba(139, 69, 19, ' : 'rgba(184, 115, 51, ';
                
                ctx.fillStyle = hue + (0.1 + noise.random() * 0.2) + ')';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Forest undergrowth
            for (let i = 0; i < 50; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 3 + noise.random() * 6;
                
                ctx.strokeStyle = `rgba(34, 139, 34, ${0.2 + noise.random() * 0.2})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (noise.random() - 0.5) * 2, y - height);
                ctx.stroke();
            }
            break;

        case BiomeType.SCRUB:
            // Dry scrubland with sparse vegetation
            // Dry earth base
            for (let i = 0; i < 25; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 16;
                
                ctx.fillStyle = `rgba(210, 180, 140, ${0.08 + noise.random() * 0.12})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Sparse scrub bushes
            for (let i = 0; i < 18; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const bushSize = 3 + noise.random() * 8;
                
                // Bush shape - irregular
                ctx.fillStyle = `rgba(107, 142, 35, ${0.15 + noise.random() * 0.2})`;
                ctx.beginPath();
                const points = 6 + Math.floor(noise.random() * 4);
                for (let p = 0; p < points; p++) {
                    const angle = (p / points) * Math.PI * 2;
                    const radius = bushSize * (0.7 + noise.random() * 0.6);
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (p === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                
                // Sparse grass around bushes
                for (let j = 0; j < 3; j++) {
                    const grassX = x + (noise.random() - 0.5) * 12;
                    const grassY = y + (noise.random() - 0.5) * 12;
                    const grassHeight = 2 + noise.random() * 4;
                    
                    ctx.strokeStyle = `rgba(154, 205, 50, ${0.2 + noise.random() * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(grassX, grassY);
                    ctx.lineTo(grassX + (noise.random() - 0.5), grassY - grassHeight);
                    ctx.stroke();
                }
            }
            break;

        case BiomeType.MOUNTAIN:
        case BiomeType.HIGH_PEAK:
            // Rocky mountain texture with mineral veins
            // Rock layers
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const width = 20 + noise.random() * 50;
                const height = 6 + noise.random() * 12;
                const angle = noise.random() * Math.PI / 4;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.fillStyle = `rgba(105, 105, 105, ${0.1 + noise.random() * 0.15})`;
                ctx.fillRect(-width/2, -height/2, width, height);
                ctx.restore();
            }
            
            // Mineral veins
            for (let i = 0; i < 12; i++) {
                const x1 = noise.random() * PATTERN_SIZE;
                const y1 = noise.random() * PATTERN_SIZE;
                const x2 = x1 + (noise.random() - 0.5) * 40;
                const y2 = y1 + (noise.random() - 0.5) * 40;
                
                ctx.strokeStyle = `rgba(169, 169, 169, ${0.15 + noise.random() * 0.1})`;
                ctx.lineWidth = 1 + noise.random() * 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            break;

        case BiomeType.DESERT:
        case BiomeType.BEACH:
            // Realistic sand with dune patterns
            // Sand ripples
            for (let i = 0; i < 12; i++) {
                const y = (i / 12) * PATTERN_SIZE + (noise.random() - 0.5) * 15;
                const amplitude = 2 + noise.random() * 4;
                
                ctx.strokeStyle = `rgba(238, 203, 173, ${0.15 + noise.random() * 0.1})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, y);
                
                for (let x = 0; x <= PATTERN_SIZE; x += 4) {
                    const rippleY = y + Math.sin((x + i * 20) * 0.1) * amplitude;
                    ctx.lineTo(x, rippleY);
                }
                ctx.stroke();
            }
            
            // Sand granules
            for (let i = 0; i < 80; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 0.5 + noise.random() * 1.5;
                
                ctx.fillStyle = `rgba(244, 164, 96, ${0.1 + noise.random() * 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case BiomeType.FARMLAND:
            // Organized agricultural field patterns
            // Plowed field rows
            for (let i = 0; i < 16; i++) {
                const y = (i / 16) * PATTERN_SIZE;
                const furrowDepth = 0.8 + (i % 2) * 0.4;
                
                ctx.strokeStyle = `rgba(101, 67, 33, ${0.15 + furrowDepth * 0.1})`;
                ctx.lineWidth = furrowDepth + 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(PATTERN_SIZE, y + (noise.random() - 0.5) * 2);
                ctx.stroke();
            }
            
            // Crop plants in organized rows
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 10; col++) {
                    if (noise.random() > 0.3) { // Some randomness in planting
                        const x = (col / 10) * PATTERN_SIZE + (noise.random() - 0.5) * 8;
                        const y = (row / 8) * PATTERN_SIZE + (noise.random() - 0.5) * 6;
                        const cropSize = 1.5 + noise.random() * 2;
                        
                        // Crop plant
                        ctx.fillStyle = `rgba(50, 205, 50, ${0.3 + noise.random() * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x, y, cropSize, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Plant stem
                        ctx.strokeStyle = `rgba(34, 139, 34, ${0.4 + noise.random() * 0.2})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y - cropSize - 2);
                        ctx.stroke();
                    }
                }
            }
            break;

        case BiomeType.HILLS:
            // Rolling hill texture with grass
            // Hill contours
            for (let i = 0; i < 8; i++) {
                const startY = (i / 8) * PATTERN_SIZE + (noise.random() - 0.5) * 20;
                const amplitude = 8 + noise.random() * 12;
                
                ctx.strokeStyle = `rgba(107, 142, 35, ${0.08 + noise.random() * 0.08})`;
                ctx.lineWidth = 2 + noise.random();
                ctx.beginPath();
                ctx.moveTo(0, startY);
                
                for (let x = 0; x <= PATTERN_SIZE; x += 8) {
                    const hillY = startY + Math.sin((x + i * 30) * 0.03) * amplitude;
                    ctx.lineTo(x, hillY);
                }
                ctx.stroke();
            }
            
            // Hill grass
            for (let i = 0; i < 40; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const grassHeight = 3 + noise.random() * 5;
                
                ctx.strokeStyle = `rgba(85, 170, 85, ${0.25 + noise.random() * 0.25})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + (noise.random() - 0.5) * 2, y - grassHeight * 0.6, x, y - grassHeight);
                ctx.stroke();
            }
            break;

        case BiomeType.TUNDRA:
            // Cold, sparse tundra vegetation
            // Permafrost patches
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 6 + noise.random() * 12;
                
                ctx.fillStyle = `rgba(176, 196, 222, ${0.08 + noise.random() * 0.1})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Sparse tundra vegetation
            for (let i = 0; i < 30; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const plantSize = 1 + noise.random() * 3;
                
                ctx.fillStyle = `rgba(85, 107, 47, ${0.2 + noise.random() * 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, plantSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Small stem
                ctx.strokeStyle = `rgba(107, 142, 35, ${0.3 + noise.random() * 0.2})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y - plantSize - 1);
                ctx.stroke();
            }
            break;

        default:
            return null;
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
    }
    return pattern;
}

// Create shoreline shadow pattern for coastal depth effect
function createShorelineShadowPattern(seed: number): CanvasPattern | null {
    const cacheKey = `shoreline-shadow-${seed}`;
    if (patternCache.has(cacheKey)) {
        return patternCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = PATTERN_SIZE;
    canvas.height = PATTERN_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Create subtle gradient shadow for coastlines
    const shadowGradient = ctx.createLinearGradient(0, 0, PATTERN_SIZE, PATTERN_SIZE);
    shadowGradient.addColorStop(0, 'rgba(0, 20, 40, 0.12)');
    shadowGradient.addColorStop(0.5, 'rgba(0, 20, 40, 0.06)');
    shadowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        patternCache.set(cacheKey, pattern);
    }
    return pattern;
}

interface UseTilePatternsProps {
    mapData: { climate: ClimateType, seed: number, tiles?: Tile[][] } | null;
}

export const useTilePatterns = ({ mapData }: UseTilePatternsProps) => {
    const patterns = useMemo(() => {
        if (!mapData) {
            return { 
                water: null,
                terrain: new Map<BiomeType, CanvasPattern | null>(),
                shorelineShadow: null
            };
        }

        const water = createRealisticWaterPattern(mapData.climate, mapData.seed);
        const shorelineShadow = createShorelineShadowPattern(mapData.seed);
        
        // Generate all terrain patterns
        const terrain = new Map<BiomeType, CanvasPattern | null>();
        const allBiomes = [
            BiomeType.GRASSLAND,
            BiomeType.STEPPE,
            BiomeType.FOREST,
            BiomeType.DENSE_FOREST,
            BiomeType.WETLANDS,
            BiomeType.MANGROVE,
            BiomeType.SCRUB,
            BiomeType.MOUNTAIN,
            BiomeType.HIGH_PEAK,
            BiomeType.DESERT,
            BiomeType.BEACH,
            BiomeType.FARMLAND,
            BiomeType.HILLS,
            BiomeType.TUNDRA,
            BiomeType.CLIFF,
            BiomeType.VOLCANIC_ROCK
        ];

        for (const biome of allBiomes) {
            terrain.set(biome, createRealisticTerrainPattern(biome, mapData.seed));
        }

        return { water, terrain, shorelineShadow };
    }, [mapData]);

    return patterns;
};