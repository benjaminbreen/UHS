/**
 * generation/interiorMap/interiorMapGenerator.ts - Main orchestrator for interior maps.
 */
import { InteriorMapData, InteriorTile, Room, InteriorEntity, InteriorPlayerData, Point, Tile, MapData } from '../../types';
import { generateRoomLayouts } from './layouts/roomLayoutGenerator';
import { placeFurniture } from './furnishings/furniturePlacer';
import { ValueNoise } from '../../utils/noise';
import { InteriorGenerationConfig } from '../../types/interiorMapTypes';

const INTERIOR_TILE_SIZE = 32;


// Base generation logic, adaptable for different building types
function generateInteriorLayout(
    config: InteriorGenerationConfig, 
    noise: ValueNoise,
    width: number,
    height: number,
    baseFloorTexture: string,
    baseFloorColor: string,
    baseWallTexture: string
): Omit<InteriorMapData, 'player'> {
    const tiles: InteriorTile[][] = Array.from({ length: height }, (_, y) => 
        Array.from({ length: width }, (_, x) => ({
             x, y, type: 'wall', texture: baseWallTexture, color: '#6b7280', isWalkable: false,
             material: 'stone',
             qualities: { flammability: 0.1, cleanliness: 0.4, value: 0.2 }
        }))
    );
    
    const { root, leafs } = generateRoomLayouts(width, height, noise);
    const rooms: Room[] = [];
    const floorTextures: Partial<Record<Room['purpose'], string>> = {
        kitchen: 'stone_tile_dark',
        storage: 'wood_plank_dark',
        tavern_main: 'wood_plank_dark',
        guard_room: 'stone_tile_dark',
        throne_room: 'marble_tile',
        great_hall: 'marble_tile',
        hallway: 'wood_plank_hall',
    };
    const floorColors: Partial<Record<Room['purpose'], string>> = {
        kitchen: '#4a5568',
        storage: '#856a5d',
        tavern_main: '#856a5d',
        guard_room: '#4a5568',
        throne_room: '#e5e7eb',
        great_hall: '#e5e7eb',
        hallway: '#9d876a',
    };
    const floorMaterials: Partial<Record<Room['purpose'], InteriorTile['material']>> = {
        kitchen: 'stone',
        storage: 'wood',
        tavern_main: 'wood',
        guard_room: 'stone',
        throne_room: 'stone',
        great_hall: 'stone',
        hallway: 'wood',
    };


    leafs.forEach(leaf => {
        if (leaf.room) {
            rooms.push(leaf.room);
            const texture = floorTextures[leaf.room.purpose] || baseFloorTexture;
            const color = floorColors[leaf.room.purpose] || baseFloorColor;
            const material = floorMaterials[leaf.room.purpose] || 'wood';
            for(let y = leaf.room.y; y < leaf.room.y + leaf.room.height; y++) {
                for(let x = leaf.room.x; x < leaf.room.x + leaf.room.width; x++) {
                    if(tiles[y]?.[x]) {
                        tiles[y][x] = { 
                            ...tiles[y][x], 
                            type: 'floor', 
                            texture, 
                            color, 
                            material,
                            isWalkable: true,
                            qualities: {
                                flammability: material === 'wood' ? 0.7 : 0.2,
                                cleanliness: 0.2 + noise.random() * 0.5,
                                value: material === 'stone' ? 0.4 : 0.2
                            }
                        };
                    }
                }
            }
        }
    });

    root.createHallways(tiles);

    // Create a dedicated entrance at the bottom center
    const entranceX = Math.floor(width / 2);
    const entranceY = height - 1;
    if(tiles[entranceY]?.[entranceX]) {
        tiles[entranceY][entranceX] = { 
            x: entranceX, y: entranceY, type: 'door', 
            texture: 'wood_plank_light', isWalkable: true, color: '#fcd34d',
            material: 'wood',
            qualities: { flammability: 0.6, cleanliness: 0.8, value: 0.3 }
        };
    }
    const entrancePoint = { x: entranceX, y: entranceY };

    // --- GUARANTEE NAVIGABILITY ---
    // Carve a path from the entrance to the nearest room's hallway connection.
    let nearestRoomCenter: Point | null = null;
    let minDistance = Infinity;
    rooms.forEach(room => {
        const roomCenterX = room.x + Math.floor(room.width/2);
        const roomCenterY = room.y + Math.floor(room.height/2);
        const dist = Math.hypot(entrancePoint.x - roomCenterX, entrancePoint.y - roomCenterY);
        if (dist < minDistance) {
            minDistance = dist;
            nearestRoomCenter = { x: roomCenterX, y: roomCenterY };
        }
    });

    if (nearestRoomCenter) {
        let currentX = entrancePoint.x;
        let currentY = entrancePoint.y - 1;
        
        const carveHallwayTile = (x: number, y: number) => {
             if(tiles[y]?.[x]?.type === 'wall') {
                tiles[y][x] = { 
                    ...tiles[y][x], type: 'floor', texture: 'wood_plank_hall', 
                    color: '#9d876a', isWalkable: true, material: 'wood',
                    qualities: { flammability: 0.7, cleanliness: 0.5, value: 0.2 }
                };
            }
        };

        // Carve vertically until aligned with target Y or a non-wall is hit
        while (currentY > nearestRoomCenter.y && tiles[currentY]?.[currentX]?.type === 'wall') {
            carveHallwayTile(currentX, currentY);
            currentY--;
        }
        // Carve horizontally until aligned with target X or a non-wall is hit
        while (currentX !== nearestRoomCenter.x && tiles[currentY]?.[currentX]?.type === 'wall') {
            carveHallwayTile(currentX, currentY);
            currentX += Math.sign(nearestRoomCenter.x - currentX);
        }
        // Carve vertically again to connect if horizontal path was blocked
        while (currentY > nearestRoomCenter.y && tiles[currentY]?.[currentX]?.type === 'wall') {
            carveHallwayTile(currentX, currentY);
            currentY--;
        }
    }
    // --- END NAVIGABILITY FIX ---


    const entities: InteriorEntity[] = placeFurniture(rooms, config);
    
    entities.forEach(entity => {
        const startX = Math.floor(entity.x / INTERIOR_TILE_SIZE);
        const startY = Math.floor(entity.y / INTERIOR_TILE_SIZE);
        const endX = Math.ceil((entity.x + entity.width) / INTERIOR_TILE_SIZE);
        const endY = Math.ceil((entity.y + entity.height) / INTERIOR_TILE_SIZE);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (tiles[y]?.[x]) {
                    tiles[y][x].isOccupiedBy = entity.id;
                    if (entity.subType !== 'rug') {
                         tiles[y][x].isWalkable = false;
                    }
                }
            }
        }
    });

    return {
        width, height,
        description: `An interior in a ${config.buildingType.replace(/_/g, ' ')}`,
        tiles, entities, rooms,
        entrance: entrancePoint,
        buildingType: config.buildingType,
        floor: config.floor,
        buildingId: config.buildingId,
        totalFloors: config.totalFloors,
    };
}


/**
 * Main entry point for generating an interior map. Dispatches to the correct generator.
 * @param config The configuration object defining the interior to generate.
 * @returns An InteriorMapData object.
 */
export function generateInteriorMap(config: InteriorGenerationConfig): InteriorMapData {
    const noise = new ValueNoise(config.contextTile.x * 10 + config.contextTile.y * 50 + config.floor);
    
    let interiorData: Omit<InteriorMapData, 'player' | 'entrance'> & { entrance?: Point };
    let width: number, height: number;

    switch (config.buildingType) {
        case 'palace':
            width = 40; height = 30;
            interiorData = generateInteriorLayout(config, noise, width, height, 'marble_tile', '#e5e7eb', 'stone_brick_ornate');
            break;
        case 'tavern':
            width = 25; height = 20;
            interiorData = generateInteriorLayout(config, noise, width, height, 'wood_plank_dark', '#856a5d', 'stone_wall');
            break;
        case 'house':
        case 'ruin': // Ruin entrance leads to a simple 'house' like layout for now
        case 'temple': // Temple leads to a simple 'house' like layout for now
        default:
            width = 20; height = 15;
            interiorData = generateInteriorLayout(config, noise, width, height, 'wood_plank_light', '#a08a70', 'stone_wall');
            break;
    }
    
    // Player Start
    const playerStartX = interiorData.entrance ? interiorData.entrance.x : Math.floor(width / 2);
    let playerStartY = interiorData.entrance ? interiorData.entrance.y - 1 : height - 2;

    const startTile = interiorData.tiles[playerStartY]?.[playerStartX];
    if(!startTile || !startTile.isWalkable) {
        if(interiorData.tiles[playerStartY+1]?.[playerStartX]?.isWalkable) {
            playerStartY = playerStartY + 1;
        } else {
             playerStartY = interiorData.entrance ? interiorData.entrance.y - 1 : height - 2; // Fallback
        }
    }


    return {
        ...interiorData,
        player: { x: playerStartX, y: playerStartY, emoji: '🧍🏽' }
    };
}