import React, { useMemo, useEffect, useState } from 'react';
import { MapData } from '../types';
import { ValueNoise } from '../utils/noise';
import { TILE_SIZE_PX } from '../constants/index';

interface CoastlineOverlayProps {
  mapData: MapData;
  noise: ValueNoise;
  disableBlur?: boolean; // For debug mode
}

interface PixelPoint {
  x: number;
  y: number;
}

interface GridPoint {
  x: number;
  y: number;
}

const pointToKey = (p: GridPoint): string => `${p.x},${p.y}`;

/**
 * Smoothes a path of points using Chaikin's algorithm, which creates curves at corners.
 */
const chaikinCurve = (points: PixelPoint[], iterations: number): PixelPoint[] => {
  if (iterations === 0 || points.length < 3) return points;
  
  let newPoints: PixelPoint[] = [];
  if (points.length > 0) {
    newPoints.push(points[0]); // Keep start point
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const q = { x: p1.x * 0.75 + p2.x * 0.25, y: p1.y * 0.75 + p2.y * 0.25 };
      const r = { x: p1.x * 0.25 + p2.x * 0.75, y: p1.y * 0.25 + p2.y * 0.75 };
      newPoints.push(q, r);
    }
    newPoints.push(points[points.length - 1]); // Keep end point
  }
  return chaikinCurve(newPoints, iterations - 1);
};


const CoastlineOverlay: React.FC<CoastlineOverlayProps> = ({ mapData, noise, disableBlur = false }) => {
    // Detect Safari for automatic performance optimization
    const [isSafari, setIsSafari] = useState(false);
    
    useEffect(() => {
        const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsSafari(safari);
    }, []);
    
    // Determine if we should use blur effects
    const shouldUseBlur = !disableBlur && !isSafari;
    const coastlinePaths = useMemo(() => {
        if (!mapData) return null;

        const { tiles, width, height } = mapData;

        // 1. Find all unique land-water boundary edges
        const edges = new Set<string>();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const isLandCurrent = tiles[y][x].isLand;
                // Check right neighbor
                if (x < width - 1) {
                    const isLandRight = tiles[y][x + 1].isLand;
                    if (isLandCurrent !== isLandRight) {
                        const p1 = { x: x + 1, y };
                        const p2 = { x: x + 1, y: y + 1 };
                        edges.add(`${pointToKey(p1)}_${pointToKey(p2)}`);
                    }
                }
                // Check bottom neighbor
                if (y < height - 1) {
                    const isLandBelow = tiles[y + 1][x].isLand;
                    if (isLandCurrent !== isLandBelow) {
                        const p1 = { x, y: y + 1 };
                        const p2 = { x: x + 1, y: y + 1 };
                        edges.add(`${pointToKey(p1)}_${pointToKey(p2)}`);
                    }
                }
            }
        }
        
        // 2. Build a graph of connected points from the edges
        const pointsGraph = new Map<string, { point: GridPoint; connections: string[] }>();
        edges.forEach(edgeKey => {
            const [key1, key2] = edgeKey.split('_');
            
            if (!pointsGraph.has(key1)) {
                const [x, y] = key1.split(',').map(Number);
                pointsGraph.set(key1, { point: { x, y }, connections: [] });
            }
            if (!pointsGraph.has(key2)) {
                const [x, y] = key2.split(',').map(Number);
                pointsGraph.set(key2, { point: { x, y }, connections: [] });
            }
            
            pointsGraph.get(key1)!.connections.push(key2);
            pointsGraph.get(key2)!.connections.push(key1);
        });

        // 3. Trace continuous paths from the graph
        const allPaths: GridPoint[][] = [];
        const visitedPoints = new Set<string>();
        
        for (const startKey of pointsGraph.keys()) {
            if (visitedPoints.has(startKey)) continue;

            const currentPath: GridPoint[] = [];
            let currentKey: string | undefined = startKey;
            
            while (currentKey && !visitedPoints.has(currentKey)) {
                visitedPoints.add(currentKey);
                const node = pointsGraph.get(currentKey)!;
                currentPath.push(node.point);
                
                // Find the next unvisited neighbor
                currentKey = node.connections.find(connKey => !visitedPoints.has(connKey));
            }
            
            if (currentPath.length > 1) {
                allPaths.push(currentPath);
            }
        }
        
        let fullPathD = '';

        // 4. Convert each path into a smoothed, wiggled SVG 'd' string
        for (const path of allPaths) {
            const pixelPath: PixelPoint[] = path.map(p => ({
                x: p.x * TILE_SIZE_PX,
                y: p.y * TILE_SIZE_PX
            }));

            // More smoothing iterations for more pronounced curves (reduce for Safari)
            const smoothingIterations = shouldUseBlur ? 2 : 1;
            const smoothedPath = chaikinCurve(pixelPath, smoothingIterations);

            const wiggledPath = smoothedPath.map((p, i) => {
                 if (i === 0 || i === smoothedPath.length - 1) return p; // Don't wiggle endpoints
                // Reduce perturbation for Safari performance
                const perturbAmount = shouldUseBlur ? 0.3 : 0.2;
                const perturbX = (noise.noise(p.x * 0.2, p.y * 0.2) - 0.5) * TILE_SIZE_PX * perturbAmount;
                const perturbY = (noise.noise(p.y * 0.2, p.x * 0.2) - 0.5) * TILE_SIZE_PX * perturbAmount;
                return { x: p.x + perturbX, y: p.y + perturbY };
            });

            const pathD = "M " + wiggledPath.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ");
            fullPathD += pathD;
        }

        return { fullPathD };
    }, [mapData, noise]);

    if (!coastlinePaths) return null;
    
    const uniqueId = `coast-${mapData.seed}`;

    return (
        <g>
            <defs>
                {/* Gradients for proper color transitions */}
                <linearGradient id={`water-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#87CEEB" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#B0E0E6" stopOpacity="0.2" />
                </linearGradient>
                
                <linearGradient id={`sand-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D2B48C" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#F5DEB3" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FFF8DC" stopOpacity="0.3" />
                </linearGradient>

                {/* Only create blur filters if we're using them */}
                {shouldUseBlur && (
                    <>
                        {/* Wider, softer blur for the water glow */}
                        <filter id={`outer-coast-blur-${uniqueId}`}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                        </filter>
                        {/* Tighter blur for the sand */}
                        <filter id={`inner-coast-blur-${uniqueId}`}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
                        </filter>
                        {/* Soft blur for the sea foam line */}
                        <filter id={`foam-blur-${uniqueId}`}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                        </filter>
                    </>
                )}
            </defs>
            
            {shouldUseBlur ? (
                // Full blur version for Chrome/Firefox
                <>
                    {/* 1. Outer Water Gradient - wide and soft */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke={`url(#water-gradient-${uniqueId})`}
                        strokeWidth={TILE_SIZE_PX * 0.7}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                        filter={`url(#outer-coast-blur-${uniqueId})`}
                    />

                    {/* 2. Inner Land Gradient - less wide */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke={`url(#sand-gradient-${uniqueId})`}
                        strokeWidth={TILE_SIZE_PX * 0.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                        filter={`url(#inner-coast-blur-${uniqueId})`}
                    />
                    
                    {/* 3. Sea Foam Line */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke="rgba(255, 255, 255, 0.6)"
                        strokeWidth={TILE_SIZE_PX * 0.15}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#foam-blur-${uniqueId})`}
                    />

                    {/* 4. Main Line - sharp definition */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke="rgba(84, 57, 34, 0.15)"
                        strokeWidth={TILE_SIZE_PX * 0.08}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </>
            ) : (
                // Safari-optimized non-blur version
                <>
                    {/* 1. Wide water gradient stroke */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke={`url(#water-gradient-${uniqueId})`}
                        strokeWidth={TILE_SIZE_PX * 0.8}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                    />
                    
                    {/* 2. Medium sand gradient stroke */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke={`url(#sand-gradient-${uniqueId})`}
                        strokeWidth={TILE_SIZE_PX * 0.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.8"
                    />

                    {/* 3. Thin foam line */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth={TILE_SIZE_PX * 0.12}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                    />

                    {/* 4. Sharp coastline definition */}
                    <path
                        d={coastlinePaths.fullPathD}
                        stroke="rgba(84, 57, 34, 0.25)"
                        strokeWidth={TILE_SIZE_PX * 0.06}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </>
            )}
        </g>
    );
};

export default React.memo(CoastlineOverlay);