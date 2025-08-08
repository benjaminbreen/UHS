/**
 * Enhanced interior map generator with culture-specific layouts, NPCs, and restricted areas
 */
import { 
    InteriorMapData, InteriorTile, Room, InteriorEntity, Point, 
    CulturalZone, HistoricalEra 
} from '../../types';
import { NpcEntity } from '../../types/npcTypes';
import { generateRoomLayouts } from './layouts/roomLayoutGenerator';
import { placeFurniture } from './furnishings/furniturePlacer';
import { ValueNoise } from '../../utils/noise';
import { InteriorGenerationConfig } from '../../types/interiorMapTypes';
import { generateRandomPrimarySource, PrimarySourceText } from '../../constants/items/primarySources';
// We'll create a simple NPC generation function for interiors
import { parseDateString } from '../../utils/dateUtils';
import { mapLocationToCulture } from '../../utils/mapUtils';

const INTERIOR_TILE_SIZE = 32;

interface RoomRestriction {
    roomId: string;
    requiredReligion?: string;
    requiredClass?: string[];
    isPrivate: boolean;
    penalty: 'warning' | 'reputation' | 'combat';
}

// Enhanced interior data is now just InteriorMapData with optional new fields
// (already defined in types/interiorMapTypes.ts)

/**
 * Generate culture-specific room purposes for holy places
 */
function getHolyPlaceRoomPurposes(religion: string, culturalZone: CulturalZone): Room['purpose'][] {
    const lowerReligion = religion.toLowerCase();
    
    if (lowerReligion.includes('catholic') || lowerReligion.includes('orthodox')) {
        return ['sanctuary', 'nave', 'vestry', 'crypt', 'bell_tower', 'hallway'];
    }
    if (lowerReligion.includes('protestant')) {
        return ['sanctuary', 'nave', 'study', 'hallway'];
    }
    if (lowerReligion.includes('islam') || lowerReligion.includes('sunni') || lowerReligion.includes('shia')) {
        return ['prayer_hall', 'mihrab', 'minaret', 'ablution', 'library', 'hallway'];
    }
    if (lowerReligion.includes('judaism')) {
        return ['sanctuary', 'ark_room', 'study', 'mikvah', 'hallway'];
    }
    if (lowerReligion.includes('buddhism')) {
        return ['meditation_hall', 'shrine_room', 'library', 'living_quarters', 'hallway'];
    }
    if (lowerReligion.includes('hinduism')) {
        return ['sanctum', 'mandapa', 'shrine_room', 'storage', 'hallway'];
    }
    if (lowerReligion.includes('shinto')) {
        return ['worship_hall', 'offering_hall', 'purification', 'storage', 'hallway'];
    }
    
    // Default pagan/ancient
    return ['sacred_chamber', 'ritual_room', 'offering_room', 'storage', 'hallway'];
}

/**
 * Generate NPCs for interior spaces
 */
function generateInteriorNpcs(
    buildingType: string,
    rooms: Room[],
    religion?: string,
    culturalZone?: CulturalZone,
    year?: number
): NpcEntity[] {
    const npcs: NpcEntity[] = [];
    let npcIdCounter = 0;
    
    if (buildingType === 'holy_place' || buildingType === 'temple') {
        // Generate priests/clergy
        const priestCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < priestCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const npc = createInteriorNpc(
                `priest-${npcIdCounter++}`,
                room.x + Math.floor(room.width / 2),
                room.y + Math.floor(room.height / 2),
                culturalZone || 'EUROPE',
                year || 1500
            );
            
            // Customize for religious role
            npc.name = generateClericName(religion || 'Christianity');
            npc.occupation = getReligiousTitle(religion || 'Christianity');
            npc.socialClass = 'clergy';
            npc.personality.traits.push('devout', 'scholarly');
            npc.inventory = []; // Will be populated with religious texts
            
            npcs.push(npc);
        }
        
        // Generate worshippers
        const worshipperCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < worshipperCount; i++) {
            const publicRooms = rooms.filter(r => 
                r.purpose === 'nave' || r.purpose === 'prayer_hall' || 
                r.purpose === 'worship_hall' || r.purpose === 'hallway'
            );
            const room = publicRooms[Math.floor(Math.random() * publicRooms.length)] || rooms[0];
            
            const npc = createInteriorNpc(
                `worshipper-${npcIdCounter++}`,
                room.x + Math.floor(Math.random() * room.width),
                room.y + Math.floor(Math.random() * room.height),
                culturalZone || 'EUROPE',
                year || 1500
            );
            
            npc.personality.traits.push('peaceful');
            npcs.push(npc);
        }
        
        // Generate guards for restricted areas
        const guardCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < guardCount; i++) {
            const restrictedRooms = rooms.filter(r => 
                r.purpose === 'sanctum' || r.purpose === 'ark_room' || 
                r.purpose === 'crypt' || r.purpose === 'sacred_chamber'
            );
            
            if (restrictedRooms.length > 0) {
                const room = restrictedRooms[Math.floor(Math.random() * restrictedRooms.length)];
                const npc = createInteriorNpc(
                    `guard-${npcIdCounter++}`,
                    room.x - 1, // Position at entrance
                    room.y + Math.floor(room.height / 2),
                    culturalZone || 'EUROPE',
                    year || 1500
                );
                
                npc.occupation = 'Temple Guard';
                npc.socialClass = 'warrior';
                npc.personality.traits = ['stern', 'vigilant', 'loyal'];
                npc.isHostile = false; // Will become hostile if player trespasses
                npc.patrolRoute = [
                    { x: room.x - 1, y: room.y },
                    { x: room.x - 1, y: room.y + room.height - 1 }
                ];
                
                npcs.push(npc);
            }
        }
    } else if (buildingType === 'palace') {
        // Generate nobles and courtiers
        const nobleCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < nobleCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const npc = createInteriorNpc(
                `noble-${npcIdCounter++}`,
                room.x + Math.floor(room.width / 2),
                room.y + Math.floor(room.height / 2),
                culturalZone || 'EUROPE',
                year || 1500
            );
            
            npc.socialClass = 'nobility';
            npc.personality.traits.push('haughty', 'cultured');
            npcs.push(npc);
        }
        
        // Generate palace guards
        const guardCount = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < guardCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const npc = createInteriorNpc(
                `palace-guard-${npcIdCounter++}`,
                room.x,
                room.y,
                culturalZone || 'EUROPE',
                year || 1500
            );
            
            npc.occupation = 'Palace Guard';
            npc.socialClass = 'warrior';
            npc.personality.traits = ['disciplined', 'alert'];
            npc.patrolRoute = generatePatrolRoute(room);
            
            npcs.push(npc);
        }
        
        // Generate servants
        const servantCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < servantCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const npc = createInteriorNpc(
                `servant-${npcIdCounter++}`,
                room.x + Math.floor(Math.random() * room.width),
                room.y + Math.floor(Math.random() * room.height),
                culturalZone || 'EUROPE',
                year || 1500
            );
            
            npc.socialClass = 'commoner';
            npc.occupation = 'Servant';
            npc.personality.traits.push('humble', 'hardworking');
            npcs.push(npc);
        }
    }
    
    return npcs;
}

/**
 * Generate room restrictions based on building type and religion
 */
function generateRoomRestrictions(
    buildingType: string,
    rooms: Room[],
    religion?: string
): RoomRestriction[] {
    const restrictions: RoomRestriction[] = [];
    
    if (buildingType === 'holy_place' || buildingType === 'temple') {
        rooms.forEach(room => {
            // Sanctums and sacred areas are highly restricted
            if (room.purpose === 'sanctum' || room.purpose === 'sacred_chamber' || 
                room.purpose === 'ark_room' || room.purpose === 'mihrab') {
                restrictions.push({
                    roomId: room.id,
                    requiredReligion: religion,
                    requiredClass: ['clergy', 'nobility'],
                    isPrivate: true,
                    penalty: 'combat'
                });
            }
            // Crypts and storage are moderately restricted
            else if (room.purpose === 'crypt' || room.purpose === 'vestry' || 
                     room.purpose === 'storage') {
                restrictions.push({
                    roomId: room.id,
                    requiredReligion: religion,
                    isPrivate: true,
                    penalty: 'reputation'
                });
            }
            // Living quarters are private
            else if (room.purpose === 'living_quarters') {
                restrictions.push({
                    roomId: room.id,
                    isPrivate: true,
                    penalty: 'warning'
                });
            }
        });
    } else if (buildingType === 'palace') {
        rooms.forEach(room => {
            // Throne room requires nobility
            if (room.purpose === 'throne_room') {
                restrictions.push({
                    roomId: room.id,
                    requiredClass: ['nobility', 'clergy', 'merchant'],
                    isPrivate: false,
                    penalty: 'reputation'
                });
            }
            // Private chambers are highly restricted
            else if (room.purpose === 'bedroom' || room.purpose === 'study') {
                restrictions.push({
                    roomId: room.id,
                    requiredClass: ['nobility'],
                    isPrivate: true,
                    penalty: 'combat'
                });
            }
            // Guard rooms are off-limits
            else if (room.purpose === 'guard_room') {
                restrictions.push({
                    roomId: room.id,
                    requiredClass: ['warrior', 'nobility'],
                    isPrivate: true,
                    penalty: 'combat'
                });
            }
        });
    }
    
    return restrictions;
}

/**
 * Place primary source texts in appropriate containers
 */
function placePrimarySourcesInContainers(
    entities: InteriorEntity[],
    buildingType: string,
    culturalZone: CulturalZone,
    year: number
): PrimarySourceText[] {
    const sources: PrimarySourceText[] = [];
    const containers = entities.filter(e => 
        e.type === 'container' && 
        (e.subType === 'chest' || e.subType === 'bookshelf' || e.subType === 'cabinet')
    );
    
    // Higher chance of texts in holy places and palaces
    const textChance = buildingType === 'holy_place' ? 0.6 : 
                       buildingType === 'palace' ? 0.4 : 0.2;
    
    containers.forEach(container => {
        if (Math.random() < textChance) {
            const source = generateRandomPrimarySource(
                culturalZone,
                year,
                buildingType as any
            );
            
            if (source) {
                // Add the source to the container's contents
                if (!container.contents) {
                    container.contents = [];
                }
                container.contents.push({
                    ...source,
                    id: `text-${Date.now()}-${Math.random()}`,
                    quantity: 1
                });
                
                sources.push(source);
            }
        }
    });
    
    return sources;
}

/**
 * Simple NPC creation for interior spaces
 */
function createInteriorNpc(
    id: string,
    x: number,
    y: number,
    culturalZone: CulturalZone,
    year: number
): NpcEntity {
    return {
        id,
        name: 'Stranger',
        x,
        y,
        health: 100,
        maxHealth: 100,
        stats: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            maxHealth: 100,
            experience: 0,
            level: 1,
            fatigue: 0,
            maxFatigue: 100
        },
        personality: {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.3,
            traits: []
        },
        socialContext: {
            currentTown: '',
            reputation: 0,
            titles: [],
            achievements: []
        },
        class: 'commoner',
        role: 'Villager',
        emoji: '🧑',
        age: 25 + Math.floor(Math.random() * 30),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        wealthLevel: 'poor',
        appearance: {
            skinTone: '#D2B48C',
            hairColor: '#8B4513',
            eyeColor: '#654321',
            height: 160 + Math.random() * 20,
            build: 'average',
            hairstyle: 'short',
            affect: 'neutral',
            clothing: []
        },
        descriptions: {
            short: 'A local resident',
            long: 'A person going about their daily business'
        },
        backstory: 'A resident of this area',
        activity: 'idle',
        movement: { type: 'stationary' },
        targetX: x,
        targetY: y,
        direction: 'down',
        walkFrame: 0,
        onRoad: false,
        aiState: 'idle',
        era: (year < 500 ? 'ANTIQUITY' : year < 1450 ? 'MEDIEVAL' : year < 1800 ? 'RENAISSANCE_EARLY_MODERN' : year < 1900 ? 'INDUSTRIAL_ERA' : 'MODERN_ERA') as HistoricalEra,
        culturalZone,
        religion: 'Christianity',
        statusEffects: [],
        inventory: [],
        currency: 10 + Math.floor(Math.random() * 50),
        birthplace: 'Local',
        family: [],
        lifeEvents: [],
        personalGoal: {
            archetype: 'SURVIVE',
            targetType: 'SELF',
            targetId: 'HEALTH',
            description: 'Stay alive and well'
        },
        ideology: 'TRADITIONALISM',
        beliefs: [],
        memory: {
            opinionOfPlayer: 0,
            knownFactsAboutPlayer: new Set(),
            relationships: new Map(),
            conversationSummaries: []
        },
        occupation: 'Villager',
        socialClass: 'commoner'
    };
}

// Helper functions
function generateClericName(religion: string): string {
    const titles = {
        'Christianity': ['Brother', 'Father', 'Sister', 'Mother'],
        'Islam': ['Imam', 'Sheikh', 'Mullah'],
        'Judaism': ['Rabbi', 'Reb'],
        'Buddhism': ['Venerable', 'Master'],
        'Hinduism': ['Swami', 'Pandit', 'Guru']
    };
    
    const names = ['Marcus', 'Thomas', 'John', 'Mary', 'Sarah', 'David', 'Samuel', 'Peter'];
    const religionKey = Object.keys(titles).find(k => religion.includes(k)) || 'Christianity';
    const titleList = titles[religionKey as keyof typeof titles] || titles.Christianity;
    
    return `${titleList[Math.floor(Math.random() * titleList.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
}

function getReligiousTitle(religion: string): string {
    const lowerReligion = religion.toLowerCase();
    
    if (lowerReligion.includes('catholic')) return 'Priest';
    if (lowerReligion.includes('orthodox')) return 'Priest';
    if (lowerReligion.includes('protestant')) return 'Minister';
    if (lowerReligion.includes('islam')) return 'Imam';
    if (lowerReligion.includes('judaism')) return 'Rabbi';
    if (lowerReligion.includes('buddhism')) return 'Monk';
    if (lowerReligion.includes('hinduism')) return 'Priest';
    if (lowerReligion.includes('shinto')) return 'Kannushi';
    
    return 'Priest';
}

function generatePatrolRoute(room: Room): Point[] {
    return [
        { x: room.x, y: room.y },
        { x: room.x + room.width - 1, y: room.y },
        { x: room.x + room.width - 1, y: room.y + room.height - 1 },
        { x: room.x, y: room.y + room.height - 1 }
    ];
}

/**
 * Enhanced interior map generation with NPCs and cultural features
 */
export function generateEnhancedInteriorMap(
    config: InteriorGenerationConfig & { 
        religion?: string;
        culturalZone?: CulturalZone;
        year?: number;
    }
): InteriorMapData {
    // Generate base interior using existing system
    const baseInterior = generateBaseInterior(config);
    
    // Generate NPCs
    const npcs = generateInteriorNpcs(
        config.buildingType,
        baseInterior.rooms,
        config.religion,
        config.culturalZone,
        config.year
    );
    
    // Generate restrictions
    const restrictions = generateRoomRestrictions(
        config.buildingType,
        baseInterior.rooms,
        config.religion
    );
    
    // Place primary sources
    const primarySources = placePrimarySourcesInContainers(
        baseInterior.entities,
        config.buildingType,
        config.culturalZone || 'EUROPE',
        config.year || 1500
    );
    
    return {
        ...baseInterior,
        npcs,
        restrictions
    };
}

// Generate base interior with culture-specific layouts
function generateBaseInterior(config: InteriorGenerationConfig & { 
    religion?: string;
    culturalZone?: CulturalZone;
}): InteriorMapData {
    const noise = new ValueNoise(config.contextTile.x * 10 + config.contextTile.y * 50 + config.floor);
    
    // Determine dimensions based on building type
    let width = 30, height = 30;
    let baseFloorTexture = 'stone_tile';
    let baseFloorColor = '#8B7355';
    let baseWallTexture = 'stone_wall';
    
    if (config.buildingType === 'holy_place' || config.buildingType === 'temple') {
        // Size varies by religion
        if (config.religion?.toLowerCase().includes('cathedral')) {
            width = 45; height = 35;
        } else if (config.religion?.toLowerCase().includes('mosque')) {
            width = 40; height = 40;
        } else if (config.religion?.toLowerCase().includes('synagogue')) {
            width = 30; height = 25;
        } else if (config.religion?.toLowerCase().includes('buddhist')) {
            width = 35; height = 35;
        } else {
            width = 30; height = 30;
        }
        
        // Material based on culture and religion
        if (config.culturalZone === 'EAST_ASIA') {
            baseFloorTexture = 'tatami_mat';
            baseFloorColor = '#D2B48C';
            baseWallTexture = 'paper_screen';
        } else if (config.culturalZone === 'MENA') {
            baseFloorTexture = 'tile_pattern';
            baseFloorColor = '#4682B4';
            baseWallTexture = 'adobe_wall';
        } else if (config.religion?.toLowerCase().includes('druid') || 
                   config.religion?.toLowerCase().includes('pagan')) {
            baseFloorTexture = 'packed_earth';
            baseFloorColor = '#8B7355';
            baseWallTexture = 'rough_stone';
        } else {
            baseFloorTexture = 'marble_tile';
            baseFloorColor = '#E5E7EB';
            baseWallTexture = 'stone_brick_ornate';
        }
    } else if (config.buildingType === 'palace') {
        width = 40; height = 30;
        baseFloorTexture = 'marble_tile';
        baseFloorColor = '#E5E7EB';
        baseWallTexture = 'stone_brick_ornate';
    }
    
    // Generate tiles
    const tiles: InteriorTile[][] = Array.from({ length: height }, (_, y) => 
        Array.from({ length: width }, (_, x) => ({
            x, y, 
            type: 'wall', 
            texture: baseWallTexture, 
            color: '#6b7280', 
            isWalkable: false,
            material: 'stone',
            qualities: { flammability: 0.1, cleanliness: 0.4, value: 0.2 }
        }))
    );
    
    // Generate room layout
    const { root, leafs } = generateRoomLayouts(width, height, noise);
    const rooms: Room[] = [];
    
    // Assign room purposes based on building type
    if (config.buildingType === 'holy_place' || config.buildingType === 'temple') {
        const purposes = getHolyPlaceRoomPurposes(config.religion || 'Generic', config.culturalZone || 'EUROPE');
        leafs.forEach((leaf, index) => {
            if (leaf.room) {
                leaf.room.purpose = purposes[index % purposes.length] as any;
                rooms.push(leaf.room);
            }
        });
    } else {
        // Use default room generation
        leafs.forEach(leaf => {
            if (leaf.room) {
                rooms.push(leaf.room);
            }
        });
    }
    
    // Fill rooms with appropriate floor tiles
    rooms.forEach(room => {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (tiles[y]?.[x]) {
                    tiles[y][x] = {
                        ...tiles[y][x],
                        type: 'floor',
                        texture: baseFloorTexture,
                        color: baseFloorColor,
                        isWalkable: true,
                        material: baseFloorTexture.includes('wood') ? 'wood' : 'stone',
                        qualities: {
                            flammability: baseFloorTexture.includes('wood') ? 0.7 : 0.2,
                            cleanliness: 0.5 + noise.random() * 0.3,
                            value: baseFloorTexture.includes('marble') ? 0.8 : 0.4
                        }
                    };
                }
            }
        }
    });
    
    // Create hallways
    root.createHallways(tiles);
    
    // Create entrance
    const entranceX = Math.floor(width / 2);
    const entranceY = height - 1;
    if (tiles[entranceY]?.[entranceX]) {
        tiles[entranceY][entranceX] = {
            x: entranceX, 
            y: entranceY, 
            type: 'door',
            texture: 'wood_door',
            isWalkable: true,
            color: '#8B4513',
            material: 'wood',
            qualities: { flammability: 0.6, cleanliness: 0.8, value: 0.3 }
        };
    }
    
    // Place furniture
    const entities: InteriorEntity[] = placeFurniture(rooms, config);
    
    // Update tile walkability based on furniture
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
    
    // Player start position
    const playerStartX = entranceX;
    const playerStartY = entranceY - 1;
    
    return {
        width,
        height,
        tiles,
        entities,
        rooms,
        entrance: { x: entranceX, y: entranceY },
        player: { x: playerStartX, y: playerStartY, emoji: '🧍' },
        description: `Interior of a ${config.buildingType.replace(/_/g, ' ')}`,
        buildingType: config.buildingType,
        buildingId: config.buildingId,
        floor: config.floor,
        totalFloors: config.totalFloors
    };
}