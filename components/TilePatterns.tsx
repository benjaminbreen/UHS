/**
 * components/TilePatterns.tsx - Enhanced procedural generation with realistic terrain textures
 */
import { useMemo } from 'react';
import { ClimateType, BiomeType, Tile } from '../types';
import { CLIMATE_WATER_COLORS } from '../constants/index';
import { ValueNoise } from '../utils/noise';

const PATTERN_SIZE = 128; // Optimized for performance while maintaining quality
const WATER_PATTERN_SIZE = 256;

// Enhanced cache with size limit for memory optimization
// Safari needs lower memory usage due to stricter limits
const MAX_CACHE_SIZE = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? 15 : 50;

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
        // Implement cache size management for memory efficiency
        if (patternCache.size >= MAX_CACHE_SIZE) {
            const firstKey = patternCache.keys().next().value;
            patternCache.delete(firstKey);
        }
        patternCache.set(cacheKey, pattern);
    }
    return pattern;
}

// Enhanced terrain patterns with realistic textures
function createRealisticTerrainPattern(biomeType: BiomeType, seed: number, climate?: ClimateType, season?: string): CanvasPattern | null {
    const cacheKey = `realistic-terrain-${biomeType}-${seed}-${climate}-${season}`;
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
        case BiomeType.PRAIRIE:
        case BiomeType.ALPINE_MEADOW:
            // Multi-layered realistic grass - adjust for biome type
            const isPrairie = biomeType === BiomeType.PRAIRIE;
            const isAlpine = biomeType === BiomeType.ALPINE_MEADOW;
            const isSteppe = biomeType === BiomeType.STEPPE;

            // Adjust grass density and color based on type
            const grassDensity = isAlpine ? 25 : isPrairie ? 30 : 35;
            const grassBaseColor = isPrairie ? [100, 120, 60] : isAlpine ? [80, 140, 80] : isSteppe ? [140, 130, 80] : [34, 139, 34];

            // Base grass patches - darker foundation
            for (let i = 0; i < grassDensity; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 20;
                
                const grassGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                grassGrad.addColorStop(0, `rgba(${grassBaseColor[0]}, ${grassBaseColor[1]}, ${grassBaseColor[2]}, ${0.35 + noise.random() * 0.25})`);
                grassGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = grassGrad;
                ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
            }
            
            // Individual grass blades - more realistic, sparser for prairie/alpine
            const bladeCount = isAlpine ? 80 : isPrairie ? 100 : 120;
            for (let i = 0; i < bladeCount; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 4 + noise.random() * 8;
                const bend = (noise.random() - 0.5) * 4;
                
                // Grass blade with natural curve - adjust color for prairie/alpine
                const bladeColorBase = isPrairie ? [100, 130, 60] : isAlpine ? [90, 150, 90] : isSteppe ? [130, 120, 70] : [46, 139, 87];
                ctx.strokeStyle = `rgba(${bladeColorBase[0] + Math.floor(noise.random() * 40)}, ${bladeColorBase[1] + Math.floor(noise.random() * 60)}, ${bladeColorBase[2] + Math.floor(noise.random() * 40)}, ${0.5 + noise.random() * 0.4})`;
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
                    
                    ctx.strokeStyle = `rgba(74, 180, 74, ${0.7 + noise.random() * 0.3})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(bladeX, bladeY);
                    ctx.lineTo(bladeX + (noise.random() - 0.5), bladeY - bladeHeight);
                    ctx.stroke();
                }
            }

            // Add prairie-specific tall grass waves
            if (isPrairie) {
                for (let i = 0; i < 15; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const height = 8 + noise.random() * 12;
                    const sway = (noise.random() - 0.5) * 6;

                    ctx.strokeStyle = `rgba(120, 110, 50, ${0.3 + noise.random() * 0.2})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(x + sway, y - height * 0.6, x + sway * 0.5, y - height);
                    ctx.stroke();
                }

                // Prairie wildflowers - very distinctive
                for (let i = 0; i < 12; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const flowerType = noise.random();

                    if (flowerType < 0.4) {
                        // Purple coneflowers
                        ctx.fillStyle = `rgba(160, 80, 180, ${0.6 + noise.random() * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5 + noise.random() * 1, 0, Math.PI * 2);
                        ctx.fill();
                        // Dark center
                        ctx.fillStyle = `rgba(60, 40, 20, 0.8)`;
                        ctx.beginPath();
                        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (flowerType < 0.7) {
                        // Golden black-eyed susans
                        ctx.fillStyle = `rgba(255, 200, 50, ${0.6 + noise.random() * 0.3})`;
                        ctx.beginPath();
                        ctx.arc(x, y, 1.2 + noise.random() * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                        // Dark center
                        ctx.fillStyle = `rgba(60, 40, 20, 0.8)`;
                        ctx.beginPath();
                        ctx.arc(x, y, 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        // Wild lupines (spiky flowers)
                        ctx.strokeStyle = `rgba(120, 140, 255, ${0.5 + noise.random() * 0.3})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + (noise.random() - 0.5) * 2, y - 6 - noise.random() * 4);
                        ctx.stroke();
                    }
                }

                // Prairie seed heads swaying in wind
                for (let i = 0; i < 10; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const height = 8 + noise.random() * 10;
                    const sway = (noise.random() - 0.5) * 6;

                    // Stem
                    ctx.strokeStyle = `rgba(100, 120, 50, ${0.4 + noise.random() * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + sway, y - height);
                    ctx.stroke();

                    // Seed head
                    ctx.fillStyle = `rgba(140, 100, 80, ${0.5 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.ellipse(x + sway, y - height, 1.5, 3, noise.random() * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Golden patches from seasonal grass color (summer)
                if (season === 'summer') {
                    for (let i = 0; i < 20; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const size = 10 + noise.random() * 15;

                        const goldenGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                        goldenGrad.addColorStop(0, `rgba(220, 170, 80, ${0.3 + noise.random() * 0.2})`);
                        goldenGrad.addColorStop(1, 'transparent');

                        ctx.fillStyle = goldenGrad;
                        ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
                    }
                }
            }

            // Add snow coverage for steppe and alpine meadows
            if ((isSteppe || isAlpine) && climate && season) {
                const shouldHaveSnow = (
                    // For steppe: always snow-covered in cold climates except summer
                    (isSteppe && climate === ClimateType.COLD && season !== 'summer') ||
                    // For steppe: winter snow in temperate climates
                    (isSteppe && (climate === ClimateType.TEMPERATE || climate === ClimateType.MEDITERRANEAN) && season === 'winter') ||
                    // Alpine meadow: Cold climates: spring, fall, winter
                    (isAlpine && climate === ClimateType.COLD && (season === 'spring' || season === 'fall' || season === 'winter')) ||
                    // Alpine meadow: Temperate and Mediterranean climates: winter only
                    (isAlpine && (climate === ClimateType.TEMPERATE || climate === ClimateType.MEDITERRANEAN) && season === 'winter')
                );

                if (shouldHaveSnow) {
                    // Determine snow coverage based on season and climate
                    const isSummer = season === 'summer';
                    const isSpring = season === 'spring';
                    const isFall = season === 'fall';
                    const isWinter = season === 'winter' || !season;

                    // For cold climates, add a base snow layer first
                    if (climate === ClimateType.COLD) {
                        const baseSnowOpacity = isWinter ? 0.7 : isSpring ? 0.5 : isFall ? 0.6 : 0;
                        if (baseSnowOpacity > 0) {
                            // Base white layer covering most of the tile
                            ctx.fillStyle = `rgba(255, 255, 255, ${baseSnowOpacity})`;
                            ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

                            // Add texture with subtle variations
                            for (let i = 0; i < 30; i++) {
                                const x = noise.random() * PATTERN_SIZE;
                                const y = noise.random() * PATTERN_SIZE;
                                const size = 15 + noise.random() * 25;
                                const opacity = 0.1 + noise.random() * 0.15;

                                ctx.fillStyle = `rgba(250, 250, 250, ${opacity})`;
                                ctx.beginPath();
                                ctx.arc(x, y, size, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }

                    // Snow patch counts by season and climate
                    let baseSnowPatches: number;
                    let snowOpacityBase: number;

                    if (climate === ClimateType.COLD) {
                        // Much higher patch counts for cold climates to create dense coverage
                        baseSnowPatches = isWinter ? 60 : isSpring ? 45 : isFall ? 55 : 0;
                        snowOpacityBase = isWinter ? 0.9 : isSpring ? 0.7 : isFall ? 0.8 : 0;
                    } else {
                        // Temperate and Mediterranean - winter only, lighter coverage
                        baseSnowPatches = isWinter ? 20 : 0;
                        snowOpacityBase = isWinter ? 0.7 : 0;
                    }

                    // Snow patches scattered throughout
                    for (let i = 0; i < baseSnowPatches; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const snowSize = climate === ClimateType.COLD ?
                                        (isWinter ? (12 + noise.random() * 20) :
                                         isSpring ? (8 + noise.random() * 15) :
                                         (10 + noise.random() * 18)) :
                                        (5 + noise.random() * 8);

                        // Irregular snow patch shape with rotation
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(noise.random() * Math.PI);
                        ctx.scale(0.8 + noise.random() * 0.4, 0.6 + noise.random() * 0.8);

                        // Main snow patch
                        const snowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, snowSize);
                        snowGrad.addColorStop(0, `rgba(255, 255, 255, ${snowOpacityBase + noise.random() * 0.15})`);
                        snowGrad.addColorStop(0.4, `rgba(250, 250, 255, ${(snowOpacityBase - 0.1) + noise.random() * 0.15})`);
                        snowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

                        ctx.fillStyle = snowGrad;
                        ctx.beginPath();
                        ctx.arc(0, 0, snowSize, 0, Math.PI * 2);
                        ctx.fill();

                        // Snow highlights
                        ctx.fillStyle = `rgba(250, 250, 250, ${(snowOpacityBase * 0.6) + noise.random() * 0.2})`;
                        ctx.beginPath();
                        ctx.arc(-snowSize * 0.2, -snowSize * 0.2, snowSize * 0.7, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }

                    // Additional smaller snow drifts for texture
                    const driftCount = Math.floor(baseSnowPatches * 0.8);
                    for (let i = 0; i < driftCount; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const driftWidth = 8 + noise.random() * 12;
                        const driftHeight = 3 + noise.random() * 6;

                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(noise.random() * Math.PI / 4);

                        const driftGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, driftWidth);
                        driftGrad.addColorStop(0, `rgba(255, 255, 255, ${(snowOpacityBase * 0.7) + noise.random() * 0.1})`);
                        driftGrad.addColorStop(0.6, `rgba(250, 250, 250, ${(snowOpacityBase * 0.5) + noise.random() * 0.1})`);
                        driftGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

                        ctx.fillStyle = driftGrad;
                        ctx.fillRect(-driftWidth/2, -driftHeight/2, driftWidth, driftHeight);
                        ctx.restore();
                    }
                }
            }

            // Add alpine meadow features
            if (isAlpine) {
                // Rocky patches scattered throughout - alpine terrain
                for (let i = 0; i < 12; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const rockSize = 4 + noise.random() * 8;

                    // Main rock
                    ctx.fillStyle = `rgba(120, 110, 100, ${0.4 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(x, y, rockSize, 0, Math.PI * 2);
                    ctx.fill();

                    // Rock highlights
                    ctx.fillStyle = `rgba(140, 130, 120, ${0.3 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(x - 1, y - 1, rockSize * 0.6, 0, Math.PI * 2);
                    ctx.fill();

                    // Rock shadows
                    ctx.fillStyle = `rgba(80, 70, 60, ${0.2 + noise.random() * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(x + 1, y + 1, rockSize * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Tiny alpine flowers (spring and summer blooming seasons)
                if (season === 'spring' || season === 'summer') {
                    // Random 1-4 flowers per tile as requested
                    const flowerCount = 1 + Math.floor(noise.random() * 4);
                    for (let i = 0; i < flowerCount; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const flowerType = noise.random();
                        // Tiny flowers as requested - much smaller than before
                        const flowerSize = 0.8 + noise.random() * 0.6;

                        if (flowerType < 0.25) {
                            // Alpine forget-me-nots (tiny blue flowers)
                            ctx.fillStyle = `rgba(120, 160, 255, ${0.7 + noise.random() * 0.2})`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize, 0, Math.PI * 2);
                            ctx.fill();
                            // Tiny white center
                            ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize * 0.25, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (flowerType < 0.4) {
                            // Mountain avens (tiny white/cream)
                            ctx.fillStyle = `rgba(255, 250, 240, ${0.6 + noise.random() * 0.2})`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize, 0, Math.PI * 2);
                            ctx.fill();
                            // Tiny yellow center
                            ctx.fillStyle = `rgba(255, 220, 100, 0.7)`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize * 0.3, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (flowerType < 0.6) {
                            // Alpine buttercups (tiny yellow)
                            ctx.fillStyle = `rgba(255, 230, 90, ${0.6 + noise.random() * 0.2})`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize, 0, Math.PI * 2);
                            ctx.fill();
                            // Tiny orange center
                            ctx.fillStyle = `rgba(255, 150, 60, 0.5)`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize * 0.25, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (flowerType < 0.8) {
                            // Alpine pinks (tiny purple/magenta)
                            ctx.fillStyle = `rgba(200, 120, 160, ${0.6 + noise.random() * 0.2})`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize, 0, Math.PI * 2);
                            ctx.fill();
                            // Tiny white center
                            ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize * 0.2, 0, Math.PI * 2);
                            ctx.fill();
                        } else {
                            // Simple wildflowers (tiny mixed colors)
                            const colors = [
                                [255, 180, 200], // Soft pink
                                [200, 255, 180], // Soft green-yellow
                                [180, 200, 255], // Soft blue
                                [255, 220, 180], // Soft peach
                                [220, 180, 255]  // Soft purple
                            ];
                            const colorChoice = colors[Math.floor(noise.random() * colors.length)];
                            ctx.fillStyle = `rgba(${colorChoice[0]}, ${colorChoice[1]}, ${colorChoice[2]}, ${0.5 + noise.random() * 0.3})`;
                            ctx.beginPath();
                            ctx.arc(x, y, flowerSize * 0.8, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }

                // Short alpine grass tufts - adapted to harsh conditions
                for (let i = 0; i < 60; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const height = 2 + noise.random() * 4; // Shorter than regular grass
                    const bend = (noise.random() - 0.5) * 2; // Less bend, tougher

                    ctx.strokeStyle = `rgba(${90 + Math.floor(noise.random() * 40)}, ${150 + Math.floor(noise.random() * 40)}, ${90 + Math.floor(noise.random() * 40)}, ${0.5 + noise.random() * 0.4})`;
                    ctx.lineWidth = 0.5 + noise.random() * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(x + bend, y - height * 0.6, x + bend * 0.3, y - height);
                    ctx.stroke();
                }

                // Moss patches on rocks (alpine environment)
                for (let i = 0; i < 8; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const mossSize = 3 + noise.random() * 6;

                    ctx.fillStyle = `rgba(60, 100, 40, ${0.3 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(x, y, mossSize, 0, Math.PI * 2);
                    ctx.fill();
                }

            }
            break;

        case BiomeType.SAVANNA:
            // Enhanced savanna - golden grassland with acacia trees
            // Strong golden overlay for sun-baked savanna look
            ctx.fillStyle = 'rgba(255, 215, 120, 0.35)'; // Strong golden tint
            ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

            // Golden grass waves - wavy texture across the tile
            for (let wave = 0; wave < 6; wave++) {
                const waveY = (wave / 6) * PATTERN_SIZE + noise.random() * 8;
                const waveHeight = 3 + noise.random() * 4;

                ctx.strokeStyle = `rgba(245, 200, 100, ${0.4 + noise.random() * 0.3})`;
                ctx.lineWidth = 2 + noise.random() * 1.5;
                ctx.beginPath();

                // Create wavy grass texture
                for (let x = 0; x < PATTERN_SIZE; x += 2) {
                    const waveOffset = Math.sin((x / PATTERN_SIZE) * Math.PI * 3 + wave) * waveHeight;
                    if (x === 0) {
                        ctx.moveTo(x, waveY + waveOffset);
                    } else {
                        ctx.lineTo(x, waveY + waveOffset);
                    }
                }
                ctx.stroke();
            }

            // Additional golden grass patches for variety
            for (let i = 0; i < 25; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 15;

                const grassGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                grassGrad.addColorStop(0, `rgba(255, 215, 140, ${0.4 + noise.random() * 0.2})`); // Brighter golden
                grassGrad.addColorStop(0.7, `rgba(240, 190, 110, ${0.3 + noise.random() * 0.15})`); // Warm gold
                grassGrad.addColorStop(1, 'transparent');

                ctx.fillStyle = grassGrad;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Individual wavy grass blades - more prominent
            for (let i = 0; i < 60; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 4 + noise.random() * 8;
                const wave = Math.sin(noise.random() * Math.PI * 2) * 3; // Wavy motion

                ctx.strokeStyle = `rgba(${180 + Math.floor(noise.random() * 40)}, ${140 + Math.floor(noise.random() * 30)}, ${70 + Math.floor(noise.random() * 25)}, ${0.6 + noise.random() * 0.3})`;
                ctx.lineWidth = 0.8 + noise.random() * 0.4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                // Create wavy grass blade
                ctx.quadraticCurveTo(x + wave * 0.5, y - height * 0.6, x + wave, y - height);
                ctx.stroke();
            }

            // Acacia trees (40-50% of tiles)
            if (noise.random() < 0.45) {
                const numTrees = 1 + Math.floor(noise.random() * 3); // 1-3 trees
                for (let i = 0; i < numTrees; i++) {
                    const treeX = 20 + noise.random() * (PATTERN_SIZE - 40); // Keep away from edges
                    const treeY = 20 + noise.random() * (PATTERN_SIZE - 40);
                    const treeHeight = 12 + noise.random() * 8;
                    const canopyWidth = 8 + noise.random() * 6;

                    // Tree trunk
                    ctx.strokeStyle = `rgba(74, 52, 32, ${0.7 + noise.random() * 0.2})`;
                    ctx.lineWidth = 1.5 + noise.random() * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(treeX, treeY);
                    ctx.lineTo(treeX + (noise.random() - 0.5) * 2, treeY - treeHeight);
                    ctx.stroke();

                    // Umbrella-shaped canopy
                    const canopyY = treeY - treeHeight + 2;
                    const canopyGrad = ctx.createRadialGradient(treeX, canopyY, 0, treeX, canopyY, canopyWidth);
                    canopyGrad.addColorStop(0, `rgba(96, 96, 64, ${0.4 + noise.random() * 0.2})`);
                    canopyGrad.addColorStop(0.8, `rgba(80, 80, 50, ${0.3 + noise.random() * 0.1})`);
                    canopyGrad.addColorStop(1, 'transparent');

                    ctx.fillStyle = canopyGrad;
                    ctx.beginPath();
                    ctx.ellipse(treeX, canopyY, canopyWidth, canopyWidth * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Tree shadow
                    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + noise.random() * 0.05})`;
                    ctx.beginPath();
                    ctx.ellipse(treeX + 2, treeY + 1, canopyWidth * 0.8, canopyWidth * 0.3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Termite mounds (5% chance)
            if (noise.random() < 0.05) {
                const moundX = noise.random() * PATTERN_SIZE;
                const moundY = noise.random() * PATTERN_SIZE;
                const moundSize = 3 + noise.random() * 2;

                ctx.fillStyle = `rgba(139, 119, 86, ${0.3 + noise.random() * 0.1})`;
                ctx.beginPath();
                ctx.ellipse(moundX, moundY, moundSize, moundSize * 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dry earth patches
            for (let i = 0; i < 8; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 6 + noise.random() * 10;

                ctx.fillStyle = `rgba(180, 140, 100, ${0.08 + noise.random() * 0.04})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case BiomeType.BADLANDS:
            // Badlands - subtle transitional terrain between scrub and desert
            // Base reddish-brown scrubby texture (like arid hills)
            for (let i = 0; i < 25; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 16;

                // Visible reddish-brown base color (like arid hills)
                ctx.fillStyle = `rgba(180, 140, 110, ${0.7 + noise.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Desert-colored blotches (transitional to desert tiles)
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 6 + noise.random() * 12;

                // Use desert tile colors for blotches
                const desertVariant = noise.random();
                const r = 210 + Math.floor(desertVariant * 20); // Sandy colors
                const g = 180 - Math.floor(desertVariant * 15);
                const b = 140 - Math.floor(desertVariant * 15);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + noise.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Scrub-like vegetation patches (transitional to scrub)
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const patchSize = 4 + noise.random() * 8;

                // Greenish scrub color patches
                ctx.fillStyle = `rgba(100, 120, 70, ${0.5 + noise.random() * 0.3})`;

                // Irregular patch shape like scrub vegetation
                ctx.beginPath();
                const points = 6 + Math.floor(noise.random() * 4);
                for (let p = 0; p < points; p++) {
                    const angle = (p / points) * Math.PI * 2;
                    const radius = patchSize * (0.7 + noise.random() * 0.6);
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (p === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            }

            // Very subtle eroded texture (much toned down)
            for (let i = 0; i < 8; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const length = 8 + noise.random() * 12;
                const angle = noise.random() * Math.PI;

                // Visible erosion lines
                ctx.strokeStyle = `rgba(150, 120, 90, ${0.7 + noise.random() * 0.2})`;
                ctx.lineWidth = 2.0 + noise.random() * 1.0;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                ctx.stroke();
            }

            // Sparse drought-resistant vegetation (like scrub but sparser)
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const bushSize = 2 + noise.random() * 4;

                // Irregular drought-resistant shrub
                ctx.fillStyle = `rgba(90, 110, 60, ${0.6 + noise.random() * 0.3})`;
                ctx.beginPath();
                const points = 5 + Math.floor(noise.random() * 3);
                for (let p = 0; p < points; p++) {
                    const angle = (p / points) * Math.PI * 2;
                    const radius = bushSize * (0.6 + noise.random() * 0.8);
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (p === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();

                // Sparse grass around shrubs
                for (let j = 0; j < 2; j++) {
                    const grassX = x + (noise.random() - 0.5) * 8;
                    const grassY = y + (noise.random() - 0.5) * 8;
                    const grassHeight = 1.5 + noise.random() * 2.5;

                    ctx.strokeStyle = `rgba(120, 140, 80, ${0.06 + noise.random() * 0.04})`;
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(grassX, grassY);
                    ctx.lineTo(grassX + (noise.random() - 0.5), grassY - grassHeight);
                    ctx.stroke();
                }
            }

            // Subtle rocky outcrops (very muted)
            for (let i = 0; i < 6; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const rockSize = 3 + noise.random() * 5;

                // Muted rock color
                ctx.fillStyle = `rgba(140, 120, 100, ${0.05 + noise.random() * 0.03})`;
                ctx.beginPath();
                ctx.arc(x, y, rockSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Snow coverage for savanna
            if (climate && season) {
                const shouldHaveSnow = (
                    // Savanna: always snow-covered in cold climates except summer
                    (climate === ClimateType.COLD && season !== 'summer') ||
                    // Savanna: winter snow in temperate climates
                    ((climate === ClimateType.TEMPERATE || climate === ClimateType.MEDITERRANEAN) && season === 'winter')
                );

                if (shouldHaveSnow) {
                    // Determine snow coverage based on season and climate
                    const isSummer = season === 'summer';
                    const isSpring = season === 'spring';
                    const isFall = season === 'fall';
                    const isWinter = season === 'winter' || !season;

                    // For cold climates, add a base snow layer first
                    if (climate === ClimateType.COLD) {
                        const baseSnowOpacity = isWinter ? 0.6 : isSpring ? 0.4 : isFall ? 0.5 : 0;
                        if (baseSnowOpacity > 0) {
                            // Base white layer covering most of the tile
                            ctx.fillStyle = `rgba(255, 255, 255, ${baseSnowOpacity})`;
                            ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);

                            // Add texture with subtle variations
                            for (let i = 0; i < 25; i++) {
                                const x = noise.random() * PATTERN_SIZE;
                                const y = noise.random() * PATTERN_SIZE;
                                const size = 12 + noise.random() * 20;
                                const opacity = 0.08 + noise.random() * 0.12;

                                ctx.fillStyle = `rgba(250, 250, 250, ${opacity})`;
                                ctx.beginPath();
                                ctx.arc(x, y, size, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }

                    // Snow patch counts by season and climate
                    let baseSnowPatches: number;
                    let snowOpacityBase: number;

                    if (climate === ClimateType.COLD) {
                        // High patch counts for cold climates to create dense coverage
                        baseSnowPatches = isWinter ? 50 : isSpring ? 35 : isFall ? 45 : 0;
                        snowOpacityBase = isWinter ? 0.8 : isSpring ? 0.6 : isFall ? 0.7 : 0;
                    } else {
                        // Temperate and Mediterranean - winter only, lighter coverage
                        baseSnowPatches = isWinter ? 18 : 0;
                        snowOpacityBase = isWinter ? 0.6 : 0;
                    }

                    // Snow patches scattered throughout savanna
                    for (let i = 0; i < baseSnowPatches; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const snowSize = climate === ClimateType.COLD ?
                                        (isWinter ? (10 + noise.random() * 18) :
                                         isSpring ? (7 + noise.random() * 12) :
                                         (8 + noise.random() * 15)) :
                                        (4 + noise.random() * 7);

                        // Irregular snow patch shape with rotation
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(noise.random() * Math.PI);
                        ctx.scale(0.8 + noise.random() * 0.4, 0.6 + noise.random() * 0.8);

                        // Main snow patch
                        const snowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, snowSize);
                        snowGrad.addColorStop(0, `rgba(255, 255, 255, ${snowOpacityBase + noise.random() * 0.12})`);
                        snowGrad.addColorStop(0.4, `rgba(250, 250, 255, ${(snowOpacityBase - 0.08) + noise.random() * 0.12})`);
                        snowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');

                        ctx.fillStyle = snowGrad;
                        ctx.beginPath();
                        ctx.arc(0, 0, snowSize, 0, Math.PI * 2);
                        ctx.fill();

                        // Snow highlights
                        ctx.fillStyle = `rgba(250, 250, 250, ${(snowOpacityBase * 0.5) + noise.random() * 0.15})`;
                        ctx.beginPath();
                        ctx.arc(-snowSize * 0.2, -snowSize * 0.2, snowSize * 0.6, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }

                    // Additional smaller snow drifts for texture
                    const driftCount = Math.floor(baseSnowPatches * 0.7);
                    for (let i = 0; i < driftCount; i++) {
                        const x = noise.random() * PATTERN_SIZE;
                        const y = noise.random() * PATTERN_SIZE;
                        const driftWidth = 6 + noise.random() * 10;
                        const driftHeight = 2 + noise.random() * 5;

                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(noise.random() * Math.PI / 4);

                        const driftGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, driftWidth);
                        driftGrad.addColorStop(0, `rgba(255, 255, 255, ${(snowOpacityBase * 0.6) + noise.random() * 0.08})`);
                        driftGrad.addColorStop(0.6, `rgba(250, 250, 250, ${(snowOpacityBase * 0.4) + noise.random() * 0.08})`);
                        driftGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

                        ctx.fillStyle = driftGrad;
                        ctx.fillRect(-driftWidth/2, -driftHeight/2, driftWidth, driftHeight);
                        ctx.restore();
                    }
                }
            }
            break;

        case BiomeType.TAIGA:
            // Enhanced taiga - dark coniferous forest with persistent snow year-round

            // Determine snow coverage based on season
            const isSummer = season === 'summer';
            const isSpring = season === 'spring';
            const isFall = season === 'fall';
            const isWinter = season === 'winter' || !season;

            // Base snow coverage (always present, even in summer)
            const baseSnowPatches = isSummer ? 30 : isSpring ? 45 : isFall ? 55 : 70;
            const snowOpacityBase = isSummer ? 0.5 : isSpring ? 0.65 : isFall ? 0.75 : 0.9;

            // Deep persistent snow patches FIRST (so they appear under trees)
            for (let i = 0; i < baseSnowPatches; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const snowSize = isSummer ? (10 + noise.random() * 12) :
                               isWinter ? (15 + noise.random() * 25) :
                               (12 + noise.random() * 18);

                // Irregular snow patch shape
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(noise.random() * Math.PI * 2);

                // Multi-layered snow for depth - whiter colors
                const snowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, snowSize);
                snowGrad.addColorStop(0, `rgba(255, 255, 255, ${snowOpacityBase + noise.random() * 0.1})`);
                snowGrad.addColorStop(0.5, `rgba(250, 250, 250, ${snowOpacityBase - 0.1})`);
                snowGrad.addColorStop(1, `rgba(245, 245, 245, ${Math.max(0.1, snowOpacityBase - 0.3)})`);

                ctx.fillStyle = snowGrad;
                ctx.beginPath();
                // Create irregular snow shape
                const points = 8;
                for (let p = 0; p < points; p++) {
                    const angle = (p / points) * Math.PI * 2;
                    const radius = snowSize * (0.7 + noise.random() * 0.3);
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (p === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Deep tree shadows - reduced opacity to show snow beneath
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const shadowWidth = 15 + noise.random() * 25;
                const shadowHeight = 10 + noise.random() * 15;

                // Elongated shadows from tall trees
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(noise.random() * Math.PI / 4); // Varied shadow direction

                const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth);
                shadowGrad.addColorStop(0, `rgba(15, 30, 20, ${0.25 + noise.random() * 0.1})`);
                shadowGrad.addColorStop(0.7, `rgba(25, 45, 30, ${0.1 + noise.random() * 0.05})`);
                shadowGrad.addColorStop(1, 'transparent');

                ctx.fillStyle = shadowGrad;
                ctx.fillRect(-shadowWidth/2, -shadowHeight/2, shadowWidth, shadowHeight);
                ctx.restore();
            }

            // Dense conifer needle carpet (reduced visibility in heavy snow)
            const needleCount = isWinter ? 40 : isFall ? 60 : isSpring ? 80 : 100;
            for (let i = 0; i < needleCount; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const needleLength = 1.5 + noise.random() * 3;
                const angle = noise.random() * Math.PI * 2;

                // Varied needle colors - more muted due to snow coverage
                const needleColor = noise.random() > 0.3 ?
                    `rgba(25, 65, 35, ${0.3 + noise.random() * 0.2})` : // Green needles
                    `rgba(60, 45, 30, ${0.25 + noise.random() * 0.15})`; // Brown fallen needles

                ctx.strokeStyle = needleColor;
                ctx.lineWidth = 0.4 + noise.random() * 0.3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * needleLength, y + Math.sin(angle) * needleLength);
                ctx.stroke();
            }

            // Small conifer tree silhouettes with heavy snow loading
            for (let i = 0; i < 6; i++) {
                const treeX = noise.random() * PATTERN_SIZE;
                const treeY = noise.random() * PATTERN_SIZE;
                const treeHeight = 8 + noise.random() * 12;
                const treeWidth = 4 + noise.random() * 6;

                // Simple triangular conifer shape (darker in winter due to contrast with snow)
                const treeOpacity = isWinter ? 0.4 : 0.3;
                ctx.fillStyle = `rgba(20, 45, 25, ${treeOpacity + noise.random() * 0.15})`;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY - treeHeight);
                ctx.lineTo(treeX - treeWidth/2, treeY);
                ctx.lineTo(treeX + treeWidth/2, treeY);
                ctx.closePath();
                ctx.fill();

                // Heavy snow on tree branches (always present)
                const snowOnTree = noise.random() > (isSummer ? 0.3 : 0.1);
                if (snowOnTree) {
                    // Multiple layers of snow on branches
                    for (let layer = 0; layer < 3; layer++) {
                        const layerY = treeY - treeHeight * (0.7 - layer * 0.25);
                        const layerWidth = treeWidth * (0.8 - layer * 0.2);

                        ctx.fillStyle = `rgba(250, 250, 250, ${snowOpacityBase - 0.1 - layer * 0.1})`;
                        ctx.beginPath();
                        ctx.moveTo(treeX, layerY);
                        ctx.lineTo(treeX - layerWidth/2, layerY + 3);
                        ctx.lineTo(treeX + layerWidth/2, layerY + 3);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Snow cap on top - whiter color
                    ctx.fillStyle = `rgba(255, 255, 255, ${snowOpacityBase})`;
                    ctx.beginPath();
                    ctx.arc(treeX, treeY - treeHeight, treeWidth/3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Tree trunk (partially hidden by snow)
                ctx.strokeStyle = `rgba(50, 35, 25, ${0.25 + noise.random() * 0.1})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(treeX, treeY);
                ctx.lineTo(treeX, treeY + 2);
                ctx.stroke();
            }

            // Enhanced pine cones with texture
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;

                // Main cone body
                ctx.fillStyle = `rgba(70, 50, 35, ${0.4 + noise.random() * 0.2})`;
                ctx.beginPath();
                ctx.ellipse(x, y, 1.5, 3, noise.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();

                // Cone scales texture
                for (let scale = 0; scale < 4; scale++) {
                    const scaleY = y - 1.5 + (scale * 0.8);
                    ctx.strokeStyle = `rgba(90, 65, 45, ${0.3 + noise.random() * 0.1})`;
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(x - 1, scaleY);
                    ctx.lineTo(x + 1, scaleY);
                    ctx.stroke();
                }
            }

            // Thick moss and lichen patches
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const mossSize = 5 + noise.random() * 12;

                // Varied moss colors - bright green to dark
                const mossColor = noise.random() > 0.5 ?
                    `rgba(40, 80, 50, ${0.2 + noise.random() * 0.15})` : // Bright moss
                    `rgba(60, 90, 40, ${0.15 + noise.random() * 0.1})`; // Darker lichen

                ctx.fillStyle = mossColor;
                ctx.beginPath();
                ctx.arc(x, y, mossSize, 0, Math.PI * 2);
                ctx.fill();

                // Moss texture - small dots
                for (let j = 0; j < 6; j++) {
                    const dotX = x + (noise.random() - 0.5) * mossSize;
                    const dotY = y + (noise.random() - 0.5) * mossSize;
                    ctx.fillStyle = `rgba(50, 100, 60, ${0.3 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Additional winter/cold climate snow effects (on top of base snow)
            if (season === 'winter' || season === 'fall') {
                // Extra large snow drifts in winter/fall
                const extraDrifts = isWinter ? 20 : 10;
                for (let i = 0; i < extraDrifts; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const driftWidth = 20 + noise.random() * 30;
                    const driftHeight = 15 + noise.random() * 20;

                    // Irregular snow drift shape
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(noise.random() * Math.PI / 4);

                    const snowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, driftWidth);
                    snowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.8 + noise.random() * 0.15})`);
                    snowGrad.addColorStop(0.6, `rgba(250, 250, 250, ${0.6 + noise.random() * 0.2})`);
                    snowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

                    ctx.fillStyle = snowGrad;
                    ctx.fillRect(-driftWidth/2, -driftHeight/2, driftWidth, driftHeight);
                    ctx.restore();
                }

                // Medium snow patches covering forest floor
                for (let i = 0; i < 35; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const snowSize = 5 + noise.random() * 12;

                    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + noise.random() * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(x, y, snowSize, 0, Math.PI * 2);
                    ctx.fill();

                    // Snow highlights for sparkle effect
                    ctx.fillStyle = `rgba(240, 248, 255, ${0.5 + noise.random() * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(x - 1, y - 1, snowSize * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Snow-laden conifer branches (heavier snow load)
                for (let i = 0; i < 25; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const branchLength = 8 + noise.random() * 12;
                    const angle = noise.random() * Math.PI * 2;

                    // Dark branch showing through
                    ctx.strokeStyle = `rgba(30, 45, 25, ${0.4 + noise.random() * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * branchLength, y + Math.sin(angle) * branchLength);
                    ctx.stroke();

                    // Heavy snow accumulation on branch
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + noise.random() * 0.2})`;
                    ctx.lineWidth = 3 + noise.random() * 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * branchLength * 0.9, y + Math.sin(angle) * branchLength * 0.9);
                    ctx.stroke();
                }

                // Snow-covered needle clusters (white over green)
                for (let i = 0; i < 40; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const clusterSize = 2 + noise.random() * 4;

                    // Snow-covered needle cluster
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(x, y, clusterSize, 0, Math.PI * 2);
                    ctx.fill();

                    // Hint of green needles showing through
                    ctx.fillStyle = `rgba(30, 70, 40, ${0.2 + noise.random() * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(x + 0.5, y + 0.5, clusterSize * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Snow accumulation in tree shadows (fills dark areas)
                for (let i = 0; i < 20; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const shadowSnowSize = 8 + noise.random() * 15;

                    // Bright snow in shadowy areas
                    const shadowSnowGrad = ctx.createRadialGradient(x, y, 0, x, y, shadowSnowSize);
                    shadowSnowGrad.addColorStop(0, `rgba(255, 255, 255, ${0.5 + noise.random() * 0.2})`);
                    shadowSnowGrad.addColorStop(0.7, `rgba(235, 245, 255, ${0.3 + noise.random() * 0.2})`);
                    shadowSnowGrad.addColorStop(1, 'transparent');

                    ctx.fillStyle = shadowSnowGrad;
                    ctx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
                }
            }

            // Fallen logs and forest debris
            for (let i = 0; i < 4; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const logLength = 12 + noise.random() * 15;
                const angle = noise.random() * Math.PI * 2;

                // Log
                ctx.strokeStyle = `rgba(60, 45, 30, ${0.3 + noise.random() * 0.2})`;
                ctx.lineWidth = 3 + noise.random() * 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * logLength, y + Math.sin(angle) * logLength);
                ctx.stroke();

                // Moss on logs
                ctx.strokeStyle = `rgba(40, 80, 50, ${0.2 + noise.random() * 0.1})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * logLength, y + Math.sin(angle) * logLength);
                ctx.stroke();
            }
            break;

        case BiomeType.WETLANDS:
            // Enhanced wetlands pattern with marshy pools and vegetation
            // Create irregular water pools with more realistic shapes
            for (let i = 0; i < 10; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const width = 12 + noise.random() * 20;
                const height = 8 + noise.random() * 15;
                
                // Irregular pool shape using ellipse with varied opacity
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(noise.random() * Math.PI);
                
                // More subtle, realistic water pooling
                const poolGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
                poolGrad.addColorStop(0, 'rgba(65, 105, 135, 0.25)');
                poolGrad.addColorStop(0.5, 'rgba(75, 115, 145, 0.15)');
                poolGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = poolGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, width, height * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Marsh grass clumps - denser and more varied
            for (let i = 0; i < 35; i++) {
                const clumpX = noise.random() * PATTERN_SIZE;
                const clumpY = noise.random() * PATTERN_SIZE;
                const clumpSize = 4 + noise.random() * 6;
                
                // Each clump has multiple grass blades
                for (let j = 0; j < 6; j++) {
                    const x = clumpX + (noise.random() - 0.5) * clumpSize;
                    const y = clumpY + (noise.random() - 0.5) * clumpSize;
                    const height = 5 + noise.random() * 10;
                    const sway = (noise.random() - 0.5) * 2;
                    
                    // Varied grass colors for depth
                    const grassColor = noise.random() > 0.5 
                        ? `rgba(55, 85, 35, ${0.5 + noise.random() * 0.3})`
                        : `rgba(75, 105, 55, ${0.4 + noise.random() * 0.3})`;
                    
                    ctx.strokeStyle = grassColor;
                    ctx.lineWidth = 0.7 + noise.random() * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(x + sway/2, y - height/2, x + sway, y - height);
                    ctx.stroke();
                }
            }
            
            // Cattails and reeds - more prominent
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 10 + noise.random() * 16;
                const sway = (noise.random() - 0.5) * 2.5;
                
                // Reed stem with slight curve
                ctx.strokeStyle = `rgba(70, 90, 40, ${0.5 + noise.random() * 0.3})`;
                ctx.lineWidth = 1 + noise.random() * 0.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + sway * 0.5, y - height * 0.6, x + sway, y - height);
                ctx.stroke();
                
                // Cattail head (40% chance)
                if (noise.random() > 0.6) {
                    // More realistic cattail shape
                    ctx.fillStyle = `rgba(92, 61, 28, ${0.6 + noise.random() * 0.2})`;
                    ctx.beginPath();
                    ctx.ellipse(x + sway, y - height, 2 + noise.random() * 0.5, 4 + noise.random() * 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Cattail texture
                    ctx.fillStyle = `rgba(71, 48, 22, 0.3)`;
                    ctx.beginPath();
                    ctx.ellipse(x + sway - 0.5, y - height + 1, 1.5, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Muddy/silty patches with varied colors
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 14;
                
                const mudGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
                mudGrad.addColorStop(0, 'rgba(85, 72, 55, 0.12)');
                mudGrad.addColorStop(0.6, 'rgba(95, 82, 65, 0.06)');
                mudGrad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = mudGrad;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Small sedge clumps
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                
                // Create small cluster of thin grasses
                for (let j = 0; j < 4; j++) {
                    const offsetX = x + (noise.random() - 0.5) * 3;
                    const offsetY = y + (noise.random() - 0.5) * 3;
                    const height = 3 + noise.random() * 5;
                    
                    ctx.strokeStyle = `rgba(65, 85, 45, ${0.4 + noise.random() * 0.2})`;
                    ctx.lineWidth = 0.4 + noise.random() * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(offsetX, offsetY);
                    ctx.lineTo(offsetX + (noise.random() - 0.5), offsetY - height);
                    ctx.stroke();
                }
            }
            
            // Lily pad hints - more subtle
            for (let i = 0; i < 6; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const radius = 2.5 + noise.random() * 2.5;
                
                ctx.fillStyle = `rgba(65, 95, 45, ${0.15 + noise.random() * 0.1})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Lily pad notch
                ctx.strokeStyle = `rgba(55, 85, 35, 0.25)`;
                ctx.lineWidth = 0.4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + radius * 0.8, y);
                ctx.stroke();
            }
            break;
            
        case BiomeType.MANGROVE:
            // Keep existing mangrove pattern as it's distinct from wetlands
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
            
            // Mangrove roots pattern
            for (let i = 0; i < 30; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const rootSpread = 8 + noise.random() * 12;
                
                // Aerial roots
                ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + noise.random() * 0.2})`;
                ctx.lineWidth = 1 + noise.random() * 0.5;
                
                for (let j = 0; j < 3; j++) {
                    const angle = (j / 3) * Math.PI * 2 + noise.random() * 0.5;
                    const endX = x + Math.cos(angle) * rootSpread;
                    const endY = y + Math.sin(angle) * rootSpread * 0.5;
                    
                    ctx.beginPath();
                    ctx.moveTo(x, y - 3);
                    ctx.quadraticCurveTo(x + (endX - x) * 0.5, y, endX, endY);
                    ctx.stroke();
                }
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
                
                ctx.strokeStyle = `rgba(34, 139, 34, ${0.3 + noise.random() * 0.2})`;
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
                
                ctx.fillStyle = `rgba(210, 180, 140, ${0.15 + noise.random() * 0.15})`;
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
                ctx.fillStyle = `rgba(107, 142, 35, ${0.25 + noise.random() * 0.25})`;
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
                    
                    ctx.strokeStyle = `rgba(154, 205, 50, ${0.3 + noise.random() * 0.3})`;
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
            // Bigger, more visible rocky mountain texture
            // Large rock formations
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const width = 30 + noise.random() * 60;
                const height = 10 + noise.random() * 20;
                const angle = noise.random() * Math.PI / 6;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.fillStyle = `rgba(105, 105, 105, ${0.4 + noise.random() * 0.3})`;
                ctx.fillRect(-width/2, -height/2, width, height);
                ctx.restore();
            }

            // Prominent rock veins
            for (let i = 0; i < 8; i++) {
                const x1 = noise.random() * PATTERN_SIZE;
                const y1 = noise.random() * PATTERN_SIZE;
                const x2 = x1 + (noise.random() - 0.5) * 60;
                const y2 = y1 + (noise.random() - 0.5) * 60;

                ctx.strokeStyle = `rgba(169, 169, 169, ${0.5 + noise.random() * 0.2})`;
                ctx.lineWidth = 2 + noise.random() * 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Add snow caps in cold climates during winter (like HillSymbol)
            if (season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE)) {
                // Snow patches on mountain peaks
                for (let i = 0; i < 15; i++) {
                    const x = noise.random() * PATTERN_SIZE;
                    const y = noise.random() * PATTERN_SIZE;
                    const snowWidth = 15 + noise.random() * 30;
                    const snowHeight = 8 + noise.random() * 15;

                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(noise.random() * Math.PI / 8);

                    // White snow patches
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + noise.random() * 0.2})`;
                    ctx.fillRect(-snowWidth/2, -snowHeight/2, snowWidth, snowHeight);

                    // Snow highlights
                    ctx.fillStyle = `rgba(245, 245, 250, ${0.5 + noise.random() * 0.2})`;
                    ctx.fillRect(-snowWidth/2 + 2, -snowHeight/2 + 2, snowWidth * 0.6, snowHeight * 0.4);

                    ctx.restore();
                }
            }
            break;

        case BiomeType.DESERT:
            // Nicer desert texture with visible sand dunes
            // Base sandy texture layer
            for (let i = 0; i < 40; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 4 + noise.random() * 10;

                // Varied sand colors
                const sandVariant = noise.random();
                const r = 210 + Math.floor(sandVariant * 30);
                const g = 180 - Math.floor(sandVariant * 20);
                const b = 140 - Math.floor(sandVariant * 20);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + noise.random() * 0.25})`;
                ctx.fillRect(x - size/2, y - size/2, size, size);
            }

            // Sand dune ridges - more prominent
            for (let i = 0; i < 5; i++) {
                const startY = (i / 5) * PATTERN_SIZE + (noise.random() - 0.5) * 15;

                // Dune highlight (lighter sand on top)
                ctx.strokeStyle = `rgba(235, 210, 170, ${0.5 + noise.random() * 0.2})`;
                ctx.lineWidth = 3 + noise.random() * 2;
                ctx.beginPath();
                ctx.moveTo(0, startY);

                for (let x = 0; x <= PATTERN_SIZE; x += 6) {
                    const duneY = startY + Math.sin(x * 0.04 + i) * 8;
                    ctx.lineTo(x, duneY);
                }
                ctx.stroke();

                // Dune shadow (darker sand in valleys)
                ctx.strokeStyle = `rgba(180, 140, 100, ${0.4 + noise.random() * 0.15})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, startY + 3);

                for (let x = 0; x <= PATTERN_SIZE; x += 6) {
                    const shadowY = startY + 3 + Math.sin(x * 0.04 + i) * 8;
                    ctx.lineTo(x, shadowY);
                }
                ctx.stroke();
            }

            // Small sand grains for texture
            for (let i = 0; i < 30; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;

                ctx.fillStyle = `rgba(225, 195, 155, ${0.6 + noise.random() * 0.2})`;
                ctx.fillRect(x, y, 2, 2);
            }
            break;

        case BiomeType.BEACH:
            // Nicer beach sand texture with tidal patterns
            // Fine sand base
            for (let i = 0; i < 35; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 3 + noise.random() * 7;

                // Beach sand colors - lighter than desert
                const sandTone = noise.random();
                const r = 238 + Math.floor(sandTone * 10);
                const g = 210 + Math.floor(sandTone * 15);
                const b = 173 + Math.floor(sandTone * 20);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + noise.random() * 0.2})`;
                ctx.fillRect(x - size/2, y - size/2, size, size);
            }

            // Tidal wash lines - where waves reach
            for (let i = 0; i < 4; i++) {
                const y = (i / 4) * PATTERN_SIZE;

                // Wet sand line (darker)
                ctx.strokeStyle = `rgba(210, 180, 150, ${0.5 + noise.random() * 0.15})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, y);

                for (let x = 0; x <= PATTERN_SIZE; x += 6) {
                    ctx.lineTo(x, y + Math.sin(x * 0.07 + i * 2) * 5);
                }
                ctx.stroke();

                // Foam line (lighter)
                ctx.strokeStyle = `rgba(255, 250, 245, ${0.6 + noise.random() * 0.2})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, y - 2);

                for (let x = 0; x <= PATTERN_SIZE; x += 6) {
                    ctx.lineTo(x, y - 2 + Math.sin(x * 0.07 + i * 2) * 5);
                }
                ctx.stroke();
            }

            // Shell and pebble hints
            for (let i = 0; i < 8; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;

                // Small shells/pebbles
                ctx.fillStyle = `rgba(255, 245, 230, ${0.7 + noise.random() * 0.2})`;
                ctx.fillRect(x - 1, y - 1, 3, 2);
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
                
                ctx.strokeStyle = `rgba(107, 142, 35, ${0.15 + noise.random() * 0.12})`;
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
                
                ctx.strokeStyle = `rgba(85, 170, 85, ${0.35 + noise.random() * 0.25})`;
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
                
                ctx.fillStyle = `rgba(85, 107, 47, ${0.3 + noise.random() * 0.25})`;
                ctx.beginPath();
                ctx.arc(x, y, plantSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Small stem
                ctx.strokeStyle = `rgba(107, 142, 35, ${0.4 + noise.random() * 0.25})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y - plantSize - 1);
                ctx.stroke();
            }
            break;

        case BiomeType.CLIFF:
        case BiomeType.VOLCANIC_ROCK:
            // Enhanced volcanic rock texture with lava veins and rough surfaces
            // Rough volcanic surface base
            for (let i = 0; i < 30; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 4 + noise.random() * 10;
                
                ctx.fillStyle = `rgba(139, 69, 19, ${0.2 + noise.random() * 0.25})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Volcanic veins and cracks
            for (let i = 0; i < 15; i++) {
                const x1 = noise.random() * PATTERN_SIZE;
                const y1 = noise.random() * PATTERN_SIZE;
                const x2 = x1 + (noise.random() - 0.5) * 30;
                const y2 = y1 + (noise.random() - 0.5) * 30;
                
                ctx.strokeStyle = `rgba(220, 20, 60, ${0.15 + noise.random() * 0.15})`;
                ctx.lineWidth = 1 + noise.random() * 1.5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            
            // Rough texture spots
            for (let i = 0; i < 25; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 2 + noise.random() * 4;
                
                ctx.fillStyle = `rgba(105, 105, 105, ${0.3 + noise.random() * 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case BiomeType.RIVER:
        case BiomeType.MAJOR_RIVER:
            // Simple river flow pattern
            // Flow lines
            for (let i = 0; i < 8; i++) {
                const y = (i / 8) * PATTERN_SIZE;

                ctx.strokeStyle = `rgba(135, 206, 250, 0.4)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, y);

                for (let x = 0; x <= PATTERN_SIZE; x += 6) {
                    ctx.lineTo(x, y + Math.sin(x * 0.06) * 6);
                }
                ctx.stroke();
            }

            // Simple ripples
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;

                ctx.strokeStyle = `rgba(173, 216, 230, 0.5)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 5 + noise.random() * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            break;

        case BiomeType.RIVERBANK:
            // Nicer riverbank texture with mud, reeds, and pebbles
            // Muddy base layer
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const width = 8 + noise.random() * 12;
                const height = width * (0.5 + noise.random() * 0.3);

                // Varied mud colors
                const mudTone = noise.random();
                const r = 101 + Math.floor(mudTone * 20);
                const g = 67 + Math.floor(mudTone * 18);
                const b = 33 + Math.floor(mudTone * 15);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + noise.random() * 0.2})`;
                ctx.fillRect(x - width/2, y - height/2, width, height);
            }

            // River stones/pebbles
            for (let i = 0; i < 18; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 2 + noise.random() * 5;

                // Stone colors
                ctx.fillStyle = `rgba(128, 128, 128, ${0.4 + noise.random() * 0.2})`;
                ctx.fillRect(x - size/2, y - size/2, size, size * 0.7);

                // Stone highlight
                ctx.fillStyle = `rgba(160, 160, 160, ${0.3 + noise.random() * 0.15})`;
                ctx.fillRect(x - size/2 + 1, y - size/2, size * 0.4, size * 0.3);
            }

            // Reeds and riverside plants
            for (let i = 0; i < 20; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const height = 6 + noise.random() * 10;

                // Reed stalks
                ctx.strokeStyle = `rgba(85, 107, 47, ${0.5 + noise.random() * 0.25})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (noise.random() - 0.5) * 2, y - height);
                ctx.stroke();

                // Occasional reed plumes (30% chance)
                if (noise.random() > 0.7) {
                    ctx.fillStyle = `rgba(140, 120, 100, ${0.5 + noise.random() * 0.2})`;
                    ctx.fillRect(x - 1, y - height - 3, 3, 4);
                }
            }

            // Water edge marks
            for (let i = 0; i < 3; i++) {
                const y = (i / 3) * PATTERN_SIZE + (noise.random() - 0.5) * 10;

                ctx.strokeStyle = `rgba(100, 149, 237, ${0.3 + noise.random() * 0.15})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, y);

                for (let x = 0; x <= PATTERN_SIZE; x += 10) {
                    ctx.lineTo(x, y + Math.sin(x * 0.1) * 3);
                }
                ctx.stroke();
            }
            break;

        case BiomeType.SHOALS_TILE:
            // Simple shallow water pattern
            // Sandy patches visible through water
            for (let i = 0; i < 30; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 8 + noise.random() * 12;

                ctx.fillStyle = `rgba(238, 203, 173, 0.35)`;
                ctx.fillRect(x - size/2, y - size/2, size, size);
            }

            // Wave ripples
            for (let i = 0; i < 10; i++) {
                const y = (i / 10) * PATTERN_SIZE;

                ctx.strokeStyle = `rgba(135, 206, 250, 0.5)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, y);

                for (let x = 0; x <= PATTERN_SIZE; x += 8) {
                    ctx.lineTo(x, y + Math.sin(x * 0.08) * 5);
                }
                ctx.stroke();
            }
            break;

        case BiomeType.SALT_FLATS:
            // Salt crystal formation patterns with mineral deposits
            // Crystalline polygon patterns (like real salt flats)
            for (let i = 0; i < 15; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 15 + noise.random() * 25;
                const sides = 5 + Math.floor(noise.random() * 3); // 5-7 sided polygons
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + noise.random() * 0.3})`;
                ctx.lineWidth = 1 + noise.random() * 1.5;
                ctx.beginPath();
                
                // Draw polygon
                for (let j = 0; j < sides; j++) {
                    const angle = (j / sides) * Math.PI * 2;
                    const px = x + Math.cos(angle) * size;
                    const py = y + Math.sin(angle) * size;
                    if (j === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.stroke();
            }
            
            // Mineral deposit spots (orange, red, blue areas)
            const mineralColors = [
                'rgba(255, 179, 102, 0.15)', // Orange
                'rgba(255, 127, 102, 0.15)', // Red
                'rgba(102, 217, 255, 0.12)', // Electric blue
                'rgba(255, 255, 255, 0.25)',  // White salt
            ];
            
            for (let i = 0; i < 12; i++) {
                const x = noise.random() * PATTERN_SIZE;
                const y = noise.random() * PATTERN_SIZE;
                const size = 10 + noise.random() * 20;
                const colorIndex = Math.floor(noise.random() * mineralColors.length);
                
                const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
                grad.addColorStop(0, mineralColors[colorIndex]);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Salt crust cracks
            for (let i = 0; i < 20; i++) {
                const x1 = noise.random() * PATTERN_SIZE;
                const y1 = noise.random() * PATTERN_SIZE;
                const length = 10 + noise.random() * 20;
                const angle = noise.random() * Math.PI * 2;
                const x2 = x1 + Math.cos(angle) * length;
                const y2 = y1 + Math.sin(angle) * length;
                
                ctx.strokeStyle = `rgba(230, 230, 250, ${0.15 + noise.random() * 0.1})`;
                ctx.lineWidth = 0.5 + noise.random() * 0.5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            break;

        default:
            return null;
    }

    const pattern = ctx.createPattern(canvas, 'repeat');
    if (pattern) {
        // Implement cache size management for memory efficiency
        if (patternCache.size >= MAX_CACHE_SIZE) {
            const firstKey = patternCache.keys().next().value;
            patternCache.delete(firstKey);
        }
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
        // Implement cache size management for memory efficiency
        if (patternCache.size >= MAX_CACHE_SIZE) {
            const firstKey = patternCache.keys().next().value;
            patternCache.delete(firstKey);
        }
        patternCache.set(cacheKey, pattern);
    }
    return pattern;
}

interface UseTilePatternsProps {
    mapData: { climate: ClimateType, seed: number, tiles?: Tile[][] } | null;
    season?: string;
}

export const useTilePatterns = ({ mapData, season }: UseTilePatternsProps) => {
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
            BiomeType.VOLCANIC_ROCK,
            BiomeType.SALT_FLATS,
            BiomeType.RIVER,
            BiomeType.MAJOR_RIVER,
            BiomeType.RIVERBANK,
            BiomeType.SHOALS_TILE,
            // New transitional biomes
            BiomeType.SAVANNA,
            BiomeType.TAIGA,
            BiomeType.PRAIRIE,
            BiomeType.ALPINE_MEADOW,
            BiomeType.BADLANDS
        ];

        for (const biome of allBiomes) {
            terrain.set(biome, createRealisticTerrainPattern(biome, mapData.seed, mapData.climate, season));
        }

        return { water, terrain, shorelineShadow };
    }, [mapData, season]);

    return patterns;
};