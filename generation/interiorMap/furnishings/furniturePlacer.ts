/**
 * generation/interiorMap/furnishings/furniturePlacer.ts - Places furniture in rooms.
 */
import { Room, InteriorEntity, FurnitureQuality, HistoricalEra } from '../../../types';
import { InteriorGenerationConfig } from '../../../types';
import { parseDateString } from '../../../utils/dateUtils';

let entityIdCounter = 0;
const INTERIOR_TILE_SIZE = 32;

// Helper to check if an area is free in the occupancy grid
function canPlace(grid: boolean[][], room: Room, gridX: number, gridY: number, itemWidth: number, itemHeight: number): boolean {
    if (gridX < 0 || gridY < 0 || gridX + itemWidth > room.width || gridY + itemHeight > room.height) {
        return false;
    }
    for (let y = gridY; y < gridY + itemHeight; y++) {
        for (let x = gridX; x < gridX + itemWidth; x++) {
            if (grid[y]?.[x]) {
                return false; // Occupied
            }
        }
    }
    return true;
}

// Helper to mark an area as occupied
function occupy(grid: boolean[][], gridX: number, gridY: number, itemWidth: number, itemHeight: number): void {
     for (let y = gridY; y < gridY + itemHeight; y++) {
        for (let x = gridX; x < gridX + itemWidth; x++) {
            if (grid[y]?.[x] !== undefined) {
                grid[y][x] = true;
            }
        }
    }
}


function placeFurnitureInRoom(room: Room, quality: FurnitureQuality, purpose: Room['purpose'], entities: InteriorEntity[], config: InteriorGenerationConfig) {
    const dateInfo = parseDateString(config.date);
    const occupancyGrid = Array.from({ length: room.height }, () => Array(room.width).fill(false));
    const random = () => Math.random(); // Simple random for now

    const placeItem = (item: Omit<InteriorEntity, 'id' | 'x' | 'y'>): boolean => {
        const itemWidthTiles = Math.ceil(item.width / INTERIOR_TILE_SIZE);
        const itemHeightTiles = Math.ceil(item.height / INTERIOR_TILE_SIZE);
        
        let attempts = 0;
        while (attempts < 20) {
            const gridX = Math.floor(random() * (room.width - itemWidthTiles + 1));
            const gridY = Math.floor(random() * (room.height - itemHeightTiles + 1));
            
            if(canPlace(occupancyGrid, room, gridX, gridY, itemWidthTiles, itemHeightTiles)) {
                const finalX = (room.x + gridX) * INTERIOR_TILE_SIZE + (item.subType === 'rug' ? 0 : (random() - 0.5) * 4);
                const finalY = (room.y + gridY) * INTERIOR_TILE_SIZE + (item.subType === 'rug' ? 0 : (random() - 0.5) * 4);
                
                entities.push({ 
                    ...item,
                    x: finalX,
                    y: finalY,
                    id: `furn-${entityIdCounter++}`,
                });
                occupy(occupancyGrid, gridX, gridY, itemWidthTiles, itemHeightTiles);
                return true;
            }
            attempts++;
        }
        return false;
    };


    switch (purpose) {
        case 'living':
            placeItem({ type: 'furniture', subType: 'fireplace', quality, width: 64, height: 32, isInteractable: false });
            placeItem({ type: 'decor', subType: 'rug', quality, width: 64, height: 96, isInteractable: false });
            placeItem({ type: 'furniture', subType: 'table', quality, width: 64, height: 32, isInteractable: false });
            if (dateInfo.era >= HistoricalEra.INDUSTRIAL_ERA && random() < 0.4) {
                 placeItem({ type: 'furniture', subType: 'sewing_machine', quality, width: 48, height: 48, isInteractable: false });
            }
            break;
        case 'bedroom':
            placeItem({ type: 'furniture', subType: 'bed', quality, width: 32, height: 64, isInteractable: false });
            placeItem({ type: 'furniture', subType: 'cabinet', quality, width: 64, height: 32, isInteractable: true });
            placeItem({ type: 'furniture', subType: 'chest', quality, width: 48, height: 32, isInteractable: true });
            if (random() > 0.4) {
                 if(placeItem({ type: 'furniture', subType: 'desk', quality, width: 48, height: 32, isInteractable: false })) {
                    const lastDesk = entities[entities.length-1];
                    placeItem({ 
                        type: 'furniture', subType: 'chair', quality, width: 32, height: 32, isInteractable: false
                    });
                 }
            }
            break;
        case 'kitchen':
            placeItem({ type: 'furniture', subType: 'kitchen_hearth', quality, width: 64, height: 48, isInteractable: false });
            if (random() < 0.3) { // Barrels appear less frequently
                placeItem({ type: 'furniture', subType: 'barrel', quality, width: 28, height: 36, isInteractable: true });
            }
            break;
        case 'storage':
            placeItem({ type: 'furniture', subType: 'bookshelf', quality, width: 32, height: 96, isInteractable: true });
            if (random() < 0.3) {
                placeItem({ type: 'furniture', subType: 'barrel', quality, width: 28, height: 36, isInteractable: true });
            }
            break;
        case 'tavern_main':
            placeItem({ type: 'furniture', subType: 'bar_counter', quality, width: 128, height: 32, isInteractable: false });
            placeItem({ type: 'furniture', subType: 'fireplace', quality, width: 96, height: 32, isInteractable: false });
            for (let i = 0; i < 3; i++) {
                placeItem({ type: 'furniture', subType: 'table', quality, width: 64, height: 64, isInteractable: false });
            }
            break;
        case 'throne_room':
            placeItem({ type: 'furniture', subType: 'throne', quality, width: 64, height: 64, isInteractable: false });
            placeItem({ type: 'decor', subType: 'rug', quality, width: (room.width - 2) * INTERIOR_TILE_SIZE, height: (room.height - 3) * INTERIOR_TILE_SIZE });
            break;
        case 'great_hall':
            placeItem({ type: 'furniture', subType: 'grand_table', quality, width: (room.width - 4) * INTERIOR_TILE_SIZE, height: 64 });
            placeItem({ type: 'decor', subType: 'tapestry', quality, width: 32, height: 96 });
            break;
        case 'guard_room':
            for(let i=0; i<3; i++) {
                placeItem({ type: 'structure', subType: 'armor_stand', quality, width: 32, height: 64 });
            }
            break;
    }
}

export function placeFurniture(rooms: Room[], config: InteriorGenerationConfig): InteriorEntity[] {
    const entities: InteriorEntity[] = [];
    entityIdCounter = 0;
    
    let quality: FurnitureQuality = 'standard';
    if(config.buildingType === 'palace') quality = 'lavish';
    else if (config.buildingType === 'tavern') quality = 'humble';

    // Assign purposes to rooms
    const assignedPurposes = new Set<Room['purpose']>();
    const purposesByBuilding: Record<string, Room['purpose'][]> = {
        house: ['living', 'bedroom', 'kitchen', 'storage'],
        tavern: ['tavern_main', 'storage', 'kitchen'],
        palace: ['great_hall', 'throne_room', 'guard_room', 'bedroom', 'storage']
    };
    const purposeList: Room['purpose'][] = purposesByBuilding[config.buildingType] || ['living', 'storage'];
    
    rooms.forEach((room, index) => {
        const purpose = purposeList[index % purposeList.length];
        if (!assignedPurposes.has(purpose) || purpose === 'storage' || purpose === 'bedroom') {
            room.purpose = purpose;
            assignedPurposes.add(purpose);
        } else {
            // Fallback for when we run out of unique primary purposes
            const fallbackPurposes: Room['purpose'][] = ['storage', 'private_chamber'];
            room.purpose = fallbackPurposes[index % 2];
        }
        placeFurnitureInRoom(room, quality, room.purpose, entities, config);
    });
    
    // Place staircases
    if (config.totalFloors > 1 && rooms.length > 0) {
        const staircaseRoom = rooms[rooms.length - 1]; // Place in the "last" room for consistency
        if (config.floor > 0) { // Place stairs going down
            entities.push({
                id: `struct-${entityIdCounter++}`, type: 'structure', subType: 'staircase',
                x: (staircaseRoom.x + 1) * INTERIOR_TILE_SIZE, y: (staircaseRoom.y + 1) * INTERIOR_TILE_SIZE,
                width: 32, height: 64,
                direction: 'down',
                targetFloor: config.floor - 1,
                isInteractable: true,
            });
        }
        if (config.floor < config.totalFloors - 1) { // Place stairs going up
             entities.push({
                id: `struct-${entityIdCounter++}`, type: 'structure', subType: 'staircase',
                x: (staircaseRoom.x + staircaseRoom.width - 2) * INTERIOR_TILE_SIZE, y: (staircaseRoom.y + 1) * INTERIOR_TILE_SIZE,
                width: 32, height: 64,
                direction: 'up',
                targetFloor: config.floor + 1,
                isInteractable: true,
            });
        }
    }

    return entities;
}