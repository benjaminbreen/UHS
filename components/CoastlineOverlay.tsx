import React, { useMemo } from 'react';
import { MapData } from '../types';
import { ValueNoise } from '../utils/noise';
import { TILE_SIZE_PX } from '../constants/index';

interface CoastlineOverlayProps {
  mapData: MapData;
  noise: ValueNoise;
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


const CoastlineOverlay: React.FC<CoastlineOverlayProps> = ({ mapData, noise }) => {
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

            // More smoothing iterations for more pronounced curves
            const smoothedPath = chaikinCurve(pixelPath, 2);

            const wiggledPath = smoothedPath.map((p, i) => {
                 if (i === 0 || i === smoothedPath.length - 1) return p; // Don't wiggle endpoints
                // Increased perturbation for more wiggles
                const perturbX = (noise.noise(p.x * 0.2, p.y * 0.2) - 0.5) * TILE_SIZE_PX * 0.3;
                const perturbY = (noise.noise(p.y * 0.2, p.x * 0.2) - 0.5) * TILE_SIZE_PX * 0.3;
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
                {/* Wider, softer blur for the water glow which spreads far */}
                <filter id={`outer-coast-blur-${uniqueId}`}>
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                </filter>
                {/* Tighter blur for the sand to keep it closer to shore */}
                <filter id={`inner-coast-blur-${uniqueId}`}>
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
                </filter>
                 {/* Soft blur for the sea foam line */}
                <filter id={`foam-blur-${uniqueId}`}>
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                </filter>
            </defs>
            
            {/* 1. Outer Water Gradient (Pale Electric Blue) - Drawn first, very wide and soft */}
            <path
                d={coastlinePaths.fullPathD}
                stroke="#89f7fe" // pale electric blue
                strokeWidth={TILE_SIZE_PX * 0.1} // 16px wide -> 8px bleed each way
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
                filter={`url(#outer-coast-blur-${uniqueId})`}
            />

            {/* 2. Inner Land Gradient (Sand Color) - Drawn on top, less wide */}
            <path
                d={coastlinePaths.fullPathD}
                stroke="#f5eac9" // sand color
                strokeWidth={TILE_SIZE_PX * 0.4} // 8px wide -> 4px bleed each way
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                filter={`url(#inner-coast-blur-${uniqueId})`}
            />
            
            {/* 3. Sea Foam Line - Crucial for hiding the transition and adding realism */}
            <path
                d={coastlinePaths.fullPathD}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth={TILE_SIZE_PX * 0.15} // 2.4px wide, covers the central seam
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#foam-blur-${uniqueId})`}
            />

           {/* 4. Main Line (Dark Brown) - sharp and on top for definition */}
            <path
                d={coastlinePaths.fullPathD}
                stroke="rgba(84, 57, 34, 0.1)" // A bit more transparent
                strokeWidth={TILE_SIZE_PX * 0.08} // approx 1.6px
                fill="none"1
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
};

export default React.memo(CoastlineOverlay);