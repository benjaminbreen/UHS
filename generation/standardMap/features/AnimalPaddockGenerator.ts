/**
 * generation/standardMap/features/AnimalPaddockGenerator.ts - Generates animal paddocks for Standard Maps
 */
import { Tile, BiomeType, PathType, Point, MapData, SocietalProfile } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE_PX } from '../../../constants/index';

const FENCE_RAIL_COLOR = "#854d0e"; // dark yellow-brown
const FENCE_POST_COLOR = "#543512"; // warm dark brown
const FENCE_RAIL_WIDTH = TILE_SIZE_PX * 0.08;
const FENCE_POST_WIDTH = TILE_SIZE_PX * 0.06;
const FENCE_OPACITY = 0.75;

let fenceIdCounter = 0;

function findPaddockRegion(tiles: Tile[][], startTile: Tile, takenTiles: Set<string>): Set<string> | null {
    const region = new Set<string>();
    const queue: Tile[] = [startTile];
    const visited = new Set<string>([`${startTile.x},${startTile.y}`]);
    const MIN_SIZE = 4;
    const MAX_SIZE = 12;
    const suitableBiomes = [BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.STEPPE, BiomeType.HILLS, BiomeType.TUNDRA];

    if (takenTiles.has(`${startTile.x},${startTile.y}`)) return null;

    region.add(`${startTile.x},${startTile.y}`);

    while(queue.length > 0) {
        const current = queue.shift()!;
        
        const neighbors = [
            {x: current.x, y: current.y - 1}, {x: current.x + 1, y: current.y},
            {x: current.x, y: current.y + 1}, {x: current.x - 1, y: current.y},
        ];
        neighbors.sort(() => Math.random() - 0.5); // Randomize neighbor order

        for(const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (n.x >= 0 && n.x < MAP_WIDTH_TILES && n.y >= 0 && n.y < MAP_HEIGHT_TILES && !visited.has(key)) {
                visited.add(key);
                const neighborTile = tiles[n.y][n.x];
                if(suitableBiomes.includes(neighborTile.biome) && !takenTiles.has(key)) {
                    region.add(key);
                    if (region.size >= MAX_SIZE) break;
                    queue.push(neighborTile);
                }
            }
        }
        if (region.size >= MAX_SIZE) break;
    }

    return region.size >= MIN_SIZE ? region : null;
}

function tracePerimeter(paddockArea: Set<string>): Point[] {
    const edgePoints = new Map<string, { p1: Point, p2: Point }>();
    const TILE_HALF_SIZE = TILE_SIZE_PX / 2;

    paddockArea.forEach(coord => {
        const [x,y] = coord.split(',').map(Number);
        
        const edges = [
            { nx: x, ny: y - 1, p1: { x: x * TILE_SIZE_PX - TILE_HALF_SIZE, y: y * TILE_SIZE_PX - TILE_HALF_SIZE }, p2: { x: x * TILE_SIZE_PX + TILE_HALF_SIZE, y: y * TILE_SIZE_PX - TILE_HALF_SIZE } }, // N
            { nx: x + 1, ny: y, p1: { x: x * TILE_SIZE_PX + TILE_HALF_SIZE, y: y * TILE_SIZE_PX - TILE_HALF_SIZE }, p2: { x: x * TILE_SIZE_PX + TILE_HALF_SIZE, y: y * TILE_SIZE_PX + TILE_HALF_SIZE } }, // E
            { nx: x, ny: y + 1, p1: { x: x * TILE_SIZE_PX + TILE_HALF_SIZE, y: y * TILE_SIZE_PX + TILE_HALF_SIZE }, p2: { x: x * TILE_SIZE_PX - TILE_HALF_SIZE, y: y * TILE_SIZE_PX + TILE_HALF_SIZE } }, // S
            { nx: x - 1, ny: y, p1: { x: x * TILE_SIZE_PX - TILE_HALF_SIZE, y: y * TILE_SIZE_PX + TILE_HALF_SIZE }, p2: { x: x * TILE_SIZE_PX - TILE_HALF_SIZE, y: y * TILE_SIZE_PX - TILE_HALF_SIZE } }, // W
        ];

        edges.forEach(edge => {
            if (!paddockArea.has(`${edge.nx},${edge.ny}`)) {
                const key1 = `${edge.p1.x},${edge.p1.y}`;
                const key2 = `${edge.p2.x},${edge.p2.y}`;
                if (!edgePoints.has(`${key2}_${key1}`)) {
                    edgePoints.set(`${key1}_${key2}`, {p1: edge.p1, p2: edge.p2});
                }
            }
        });
    });
    
    if (edgePoints.size === 0) return [];
    
    const pointsGraph = new Map<string, { point: Point, neighbors: string[] }>();
    edgePoints.forEach((edge) => {
        const key1 = `${edge.p1.x},${edge.p1.y}`;
        const key2 = `${edge.p2.x},${edge.p2.y}`;
        if (!pointsGraph.has(key1)) pointsGraph.set(key1, { point: edge.p1, neighbors: [] });
        if (!pointsGraph.has(key2)) pointsGraph.set(key2, { point: edge.p2, neighbors: [] });
        pointsGraph.get(key1)!.neighbors.push(key2);
        pointsGraph.get(key2)!.neighbors.push(key1);
    });

    if (pointsGraph.size === 0) return [];
    const startKey = pointsGraph.keys().next().value;
    let currentKey = startKey;
    const orderedPathKeys: string[] = [];
    const visited = new Set<string>();
    
    for(let i=0; i < pointsGraph.size; i++) {
        if(visited.has(currentKey)) break;
        orderedPathKeys.push(currentKey);
        visited.add(currentKey);
        const neighbors = pointsGraph.get(currentKey)?.neighbors || [];
        let nextKey: string | undefined;
        for(const neighbor of neighbors) {
            if(!visited.has(neighbor)) {
                nextKey = neighbor;
                break;
            }
        }
        if(nextKey) {
            currentKey = nextKey;
        } else {
            break; // End of a chain
        }
    }
    
    return orderedPathKeys.map(key => pointsGraph.get(key)!.point);
}

function generateFencePathD(points: Point[], noise: ValueNoise): { railD: string, postD: string } {
    if (points.length < 2) return { railD: "", postD: ""};

    let railD = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    let postD = "";
    
    for (let i = 1; i < points.length; i++) {
        railD += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
        
        // Place posts along the segment
        if (noise.random() < 0.9) {
             const midX = (points[i-1].x + points[i].x) / 2 + (noise.random()-0.5) * TILE_SIZE_PX * 0.1;
             const midY = (points[i-1].y + points[i].y) / 2 + (noise.random()-0.5) * TILE_SIZE_PX * 0.1;
             const postLength = FENCE_POST_WIDTH * 0.7;
             postD += ` M ${midX - postLength} ${midY} L ${midX + postLength} ${midY}`;
             postD += ` M ${midX} ${midY - postLength} L ${midX} ${midY + postLength}`;
        }
    }
    if(points[0].x === points[points.length-1].x && points[0].y === points[points.length-1].y){
       railD += " Z"; // Close the rail path if it's a loop
    }
    return { railD, postD };
}

export function generateAnimalPaddocks(mapData: MapData, noise: ValueNoise, societalProfile: SocietalProfile) {
    if (!societalProfile.isPastoral) {
        return; // Don't generate paddocks for non-pastoral societies
    }

    let placedPaddocks = 0;
    const MAX_PADDOCKS = 2;
    const tiles = mapData.tiles;
    const paddocksPlacedAt = new Set<string>();

    const potentialStarts: Tile[] = [];
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY].includes(tiles[y][x].biome)) {
                potentialStarts.push(tiles[y][x]);
            }
        }
    }
    potentialStarts.sort(() => noise.random() - 0.5);

    for (const start of potentialStarts) {
        if (placedPaddocks >= MAX_PADDOCKS) return;

        let paddockStartTile: Tile | null = null;
        for(let dy=-3; dy<=3 && !paddockStartTile; dy++) {
            for(let dx=-3; dx<=3 && !paddockStartTile; dx++) {
                const checkX = start.x + dx; const checkY = start.y + dy;
                if(checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    const candidateTile = tiles[checkY][checkX];
                    if([BiomeType.GRASSLAND, BiomeType.STEPPE, BiomeType.HILLS, BiomeType.SCRUB, BiomeType.TUNDRA].includes(candidateTile.biome) && !paddocksPlacedAt.has(`${checkX},${checkY}`)) {
                        paddockStartTile = candidateTile;
                    }
                }
            }
        }

        if(paddockStartTile) {
            const paddockArea = findPaddockRegion(tiles, paddockStartTile, paddocksPlacedAt);
            if (paddockArea) {
                const perimeter = tracePerimeter(paddockArea);
                if(perimeter.length > 3) {
                    const { railD, postD } = generateFencePathD(perimeter, noise);
                    
                    if(railD) {
                        mapData.pathObjects?.push({
                           id: `fence-rail-${fenceIdCounter}`, type: PathType.FENCE, svgD: railD, strokeWidth: FENCE_RAIL_WIDTH,
                           strokeColor: FENCE_RAIL_COLOR, opacity: FENCE_OPACITY, strokeDasharray: `3 2`
                        });
                    }
                    if(postD) {
                        mapData.pathObjects?.push({
                            id: `fence-post-${fenceIdCounter}`, type: PathType.FENCE, svgD: postD, strokeWidth: FENCE_POST_WIDTH,
                            strokeColor: FENCE_POST_COLOR, opacity: FENCE_OPACITY
                         });
                    }
                    
                    fenceIdCounter++;
                    placedPaddocks++;
                    paddockArea.forEach(coord => {
                        const [px, py] = coord.split(',').map(Number);
                        tiles[py][px].paddockType = 'Livestock';
                        paddocksPlacedAt.add(coord);
                    });
                }
            }
        }
    }
}