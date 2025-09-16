/**
 * Beautiful interior generator - simplified approach with dedicated architectural layouts
 */
import { InteriorMapData, InteriorGenerationConfig } from '../../types/interiorMapTypes';
import { selectBuildingLayout, BuildingLayout, ArchitecturalSpace } from './architecturalLayouts';
import { createEliteForBuilding, convertEliteToNpc, getBuildingElite } from '../../services/buildingElites';
import { parseDateString } from '../../utils/dateUtils';
import { mapLocationToCulture } from '../../utils/mapUtils';
import { NpcEntity } from '../../types/npcTypes';
import { CulturalZone, HistoricalEra } from '../../types';

interface BeautifulInteriorData extends InteriorMapData {
    layout: BuildingLayout;
    namedElite?: NpcEntity;
    guardNpcs: NpcEntity[];
}

/**
 * Generate support NPCs (guards, attendants)
 */
function generateSupportNpcs(
    layout: BuildingLayout,
    buildingType: string,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    religion?: string
): NpcEntity[] {
    const npcs: NpcEntity[] = [];
    let npcIdCounter = 0;
    
    // Find restricted spaces that need guards
    const restrictedSpaces = layout.spaces.filter(space => 
        space.accessibility === 'restricted' || space.accessibility === 'sacred'
    );
    
    // Generate 1-2 guard NPCs (more for fortress)
    const guardCount = buildingType === 'fortress' ? 
        Math.min(3, Math.max(2, restrictedSpaces.length)) : 
        Math.min(2, Math.max(1, restrictedSpaces.length));
    
    for (let i = 0; i < guardCount; i++) {
        const guardSpace = restrictedSpaces[i] || layout.spaces[0];
        const guardPosition = {
            x: guardSpace.bounds.x + guardSpace.bounds.width / 2,
            y: guardSpace.bounds.y + guardSpace.bounds.height - 1
        };
        
        const guardNpc: NpcEntity = {
            id: `guard-${npcIdCounter++}`,
            name: generateGuardName(culturalZone),
            x: guardPosition.x,
            y: guardPosition.y,
            health: 120,
            maxHealth: 120,
            stats: {
                strength: 16,
                dexterity: 14,
                constitution: 15,
                intelligence: 10,
                wisdom: 12,
                charisma: 8,
                maxHealth: 120,
                experience: 500,
                level: 3,
                fatigue: 0,
                maxFatigue: 100
            },
            personality: {
                openness: 0.2,
                conscientiousness: 0.9,
                extraversion: 0.4,
                agreeableness: 0.3,
                neuroticism: 0.4,
                traits: ['vigilant', 'stern', 'loyal']
            },
            socialContext: {
                currentTown: '',
                reputation: 50,
                titles: [],
                achievements: []
            },
            class: 'warrior',
            role: buildingType === 'palace' ? 'Palace Guard' : 
                  buildingType === 'fortress' ? 'Fortress Guard' : 'Temple Guard',
            emoji: '⚔️',
            age: 25 + Math.floor(Math.random() * 20),
            gender: Math.random() > 0.3 ? 'male' : 'female',
            wealthLevel: 'poor',
            appearance: {
                skinTone: getSkinToneForCulture(culturalZone),
                skinColor: getSkinToneForCulture(culturalZone),
                hairColor: '#654321',
                eyeColor: '#8B4513',
                height: 170 + Math.random() * 15,
                build: 'muscular',
                hairstyle: 'short',
                affect: 'stern',
                clothing: [],
                palette: {
                    primary: '#8B4513', // Brown/leather for guards
                    secondary: '#654321',
                    accent: '#DAA520'
                }
            },
            descriptions: {
                short: `A stern ${buildingType === 'palace' ? 'palace' : buildingType === 'fortress' ? 'fortress' : 'temple'} guard`,
                long: `A disciplined guard who takes their duty very seriously`
            },
            backstory: `Trained to protect this sacred space and maintain order`,
            activity: 'patrolling',
            movement: { type: 'patrol' },
            targetX: guardPosition.x,
            targetY: guardPosition.y,
            direction: 'down',
            walkFrame: 0,
            onRoad: false,
            aiState: 'idle',
            era,
            culturalZone,
            religion: religion || 'Christianity',
            statusEffects: [],
            inventory: [],
            currency: 20 + Math.floor(Math.random() * 30),
            birthplace: 'Local',
            occupation: buildingType === 'palace' ? 'Palace Guard' : 
                        buildingType === 'fortress' ? 'Fortress Guard' : 'Temple Guard',
            socialClass: 'warrior',
            family: [],
            lifeEvents: [],
            personalGoal: {
                archetype: 'PROTECT',
                targetType: 'LOCATION',
                targetId: 'building',
                description: 'Protect this sacred/noble space'
            },
            ideology: 'DUTY',
            beliefs: [],
            memory: {
                opinionOfPlayer: 0,
                knownFactsAboutPlayer: new Set(),
                relationships: new Map(),
                conversationSummaries: []
            },
            // Guard-specific properties
            isHostile: false,
            patrolRoute: [
                guardPosition,
                { x: guardPosition.x + 2, y: guardPosition.y },
                { x: guardPosition.x, y: guardPosition.y + 2 },
                { x: guardPosition.x - 2, y: guardPosition.y }
            ],
            guardedRoom: guardSpace.id,
            requiredReligionToPass: guardSpace.requiredReligion,
            requiredClassToPass: guardSpace.requiredClass,
            confrontationDialogue: [
                'Halt! State your business here.',
                'This area is restricted to authorized personnel.',
                'You do not belong here. Leave immediately.'
            ]
        };
        
        npcs.push(guardNpc);
    }
    
    // Add one servant/attendant if it's a palace
    if (buildingType === 'palace' && npcs.length < 2) {
        const publicSpace = layout.spaces.find(s => s.accessibility === 'public') || layout.spaces[0];
        const servantPosition = {
            x: publicSpace.bounds.x + 1,
            y: publicSpace.bounds.y + 1
        };
        
        const servantNpc: NpcEntity = {
            id: `servant-${npcIdCounter++}`,
            name: generateServantName(culturalZone),
            x: servantPosition.x,
            y: servantPosition.y,
            health: 80,
            maxHealth: 80,
            stats: {
                strength: 10,
                dexterity: 12,
                constitution: 11,
                intelligence: 13,
                wisdom: 14,
                charisma: 12,
                maxHealth: 80,
                experience: 100,
                level: 1,
                fatigue: 0,
                maxFatigue: 90
            },
            personality: {
                openness: 0.6,
                conscientiousness: 0.8,
                extraversion: 0.5,
                agreeableness: 0.7,
                neuroticism: 0.6,
                traits: ['humble', 'helpful', 'nervous']
            },
            socialContext: {
                currentTown: '',
                reputation: 30,
                titles: [],
                achievements: []
            },
            class: 'commoner',
            role: 'Servant',
            emoji: '👥',
            age: 20 + Math.floor(Math.random() * 25),
            gender: Math.random() > 0.5 ? 'male' : 'female',
            wealthLevel: 'poor',
            appearance: {
                skinTone: getSkinToneForCulture(culturalZone),
                skinColor: getSkinToneForCulture(culturalZone),
                hairColor: '#8B4513',
                eyeColor: '#654321',
                height: 160 + Math.random() * 15,
                build: 'slight',
                hairstyle: 'simple',
                affect: 'humble',
                clothing: [],
                palette: {
                    primary: '#8B7355', // Simple brown/beige for servants
                    secondary: '#A0522D',
                    accent: '#CD853F'
                }
            },
            descriptions: {
                short: 'A palace servant',
                long: 'A nervous servant who works hard to please their masters'
            },
            backstory: 'Born into service, works diligently in the palace',
            activity: 'working',
            movement: { type: 'wander' },
            targetX: servantPosition.x,
            targetY: servantPosition.y,
            direction: 'right',
            walkFrame: 0,
            onRoad: false,
            aiState: 'idle',
            era,
            culturalZone,
            religion: religion || 'Christianity',
            statusEffects: [],
            inventory: [],
            currency: 5 + Math.floor(Math.random() * 15),
            birthplace: 'Local',
            occupation: 'Servant',
            socialClass: 'commoner',
            family: [],
            lifeEvents: [],
            personalGoal: {
                archetype: 'SURVIVE',
                targetType: 'SELF',
                targetId: 'LIVELIHOOD',
                description: 'Keep job and avoid trouble'
            },
            ideology: 'SUBMISSION',
            beliefs: [],
            memory: {
                opinionOfPlayer: 10, // Slightly positive
                knownFactsAboutPlayer: new Set(),
                relationships: new Map(),
                conversationSummaries: []
            },
            confrontationDialogue: [
                'Please, I don\'t want any trouble...',
                'The master won\'t like this disturbance.',
                'You should speak to the guards, not me.'
            ]
        };
        
        npcs.push(servantNpc);
    }
    
    return npcs;
}

function generateGuardName(culturalZone: CulturalZone): string {
    const names: Record<CulturalZone, string[]> = {
        EUROPE: ['Marcus', 'Wilhelm', 'Gareth', 'Duncan', 'Roland'],
        MENA: ['Hassan', 'Omar', 'Khalid', 'Mustafa', 'Tariq'],
        EAST_ASIA: ['Kenji', 'Takeshi', 'Hiroshi', 'Akira', 'Ryu'],
        SOUTH_ASIA: ['Raj', 'Arjun', 'Krishna', 'Vikram', 'Suresh'],
        AFRICA: ['Kofi', 'Kwame', 'Jengo', 'Bakari', 'Tau'],
        AMERICAS: ['Cuauhtemoc', 'Tlacaelel', 'Necalli', 'Itzel', 'Milintica'],
        OCEANIA: ['Kai', 'Akamu', 'Keoni', 'Kalani', 'Makoa'],
        ARCTIC: ['Nanook', 'Yutu', 'Kaskae', 'Atuat', 'Siku'],
        NORTH_AMERICAN_PRE_COLUMBIAN: ['Strong Bear', 'Iron Wolf', 'Swift Eagle', 'Stone Hawk', 'Thunder Cloud']
    };
    
    const guardNames = names[culturalZone] || names.EUROPE;
    return guardNames[Math.floor(Math.random() * guardNames.length)];
}

function generateServantName(culturalZone: CulturalZone): string {
    const names: Record<CulturalZone, string[]> = {
        EUROPE: ['Thomas', 'Mary', 'John', 'Anne', 'Peter'],
        MENA: ['Ali', 'Fatima', 'Ahmed', 'Aisha', 'Yusuf'],
        EAST_ASIA: ['Taro', 'Hanako', 'Jiro', 'Sakura', 'Kenta'],
        SOUTH_ASIA: ['Ram', 'Sita', 'Gopal', 'Radha', 'Mohan'],
        AFRICA: ['Amara', 'Kofi', 'Asha', 'Kwaku', 'Nala'],
        AMERICAS: ['Ixchel', 'Yaotl', 'Citlali', 'Ehecatl', 'Itzel'],
        OCEANIA: ['Leilani', 'Kaleo', 'Nalani', 'Ikaika', 'Mahina'],
        ARCTIC: ['Tala', 'Nayeli', 'Kesuk', 'Siku', 'Yutu'],
        NORTH_AMERICAN_PRE_COLUMBIAN: ['Little Fox', 'Quiet Stream', 'Gentle Wind', 'Bright Star', 'Soft Rain']
    };
    
    const servantNames = names[culturalZone] || names.EUROPE;
    return servantNames[Math.floor(Math.random() * servantNames.length)];
}

function getSkinToneForCulture(culturalZone: CulturalZone): string {
    switch (culturalZone) {
        case 'AFRICA': return '#8B4513';
        case 'MENA': return '#D2B48C';
        case 'SOUTH_ASIA': return '#CD853F';
        case 'EAST_ASIA': return '#F5DEB3';
        case 'AMERICAS': return '#A0522D';
        case 'OCEANIA': return '#DEB887';
        default: return '#FDBCB4';
    }
}

/**
 * Main function to generate beautiful interior maps
 */
export function generateBeautifulInterior(config: InteriorGenerationConfig): BeautifulInteriorData {
    console.log('🎨 [BeautifulInteriorGenerator] Starting generation');
    console.log('🏛️ Config details:', {
        buildingType: config.buildingType,
        buildingId: config.buildingId,
        date: config.date,
        location: config.location,
        contextTile: {
            holyPlaceReligion: config.contextTile.holyPlaceReligion,
            structure: config.contextTile.structure
        }
    });
    
    if (config.buildingType === 'holy_place' || config.buildingType === 'temple') {
        console.log('🕊️ [BeautifulInteriorGenerator] Processing HOLY SITE with religion:', config.contextTile.holyPlaceReligion);
    }
    
    // Parse context
    const dateInfo = parseDateString(config.date || '1500 CE');
    const culturalZone = mapLocationToCulture(config.location || 'Europe', dateInfo.year);
    const religion = config.contextTile.holyPlaceReligion;
    
    console.log('🌍 Parsed context:', {
        dateInfo: dateInfo.era,
        culturalZone,
        religion: religion || 'None'
    });
    
    // Select appropriate architectural layout with variation seed
    const buildingSeed = config.buildingId.split('-').pop() || '0'; // Use building ID suffix as seed
    const seedNum = parseInt(buildingSeed) || Math.abs(config.buildingId.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
    const sizeVariants = ['small', 'medium', 'large'] as const;
    const selectedSize = sizeVariants[seedNum % 3];
    
    console.log('🎲 [BeautifulInteriorGenerator] Using seed for variation:', {
        buildingId: config.buildingId,
        seedNum,
        selectedSize,
        culturalZone
    });
    
    const layout = selectBuildingLayout(
        config.buildingType,
        religion,
        culturalZone,
        selectedSize,
        seedNum, // Pass seed for additional randomization
        dateInfo.era as HistoricalEra
    );
    
    // console.log('[BeautifulInteriorGenerator] Selected layout:', layout.name);
    
    // Generate or retrieve building elite - prioritize existing NPCs from standard map
    let namedElite: NpcEntity | undefined;
    
    console.log('🏰 [BeautifulInteriorGenerator] Generating elite for:', config.buildingType, config.buildingId);
    
    // First check if there are existing NPCs from the standard map with this workplaceId
    const mapNpcs = config.standardMapContext.npcs || [];
    const existingWorkplaceNpc = mapNpcs.find(npc => npc.workplaceId === config.buildingId);
    
    if (existingWorkplaceNpc) {
        // Use the existing NPC from the standard map as the elite
        console.log('🎯 [BeautifulInteriorGenerator] Using existing workplace NPC as elite:', existingWorkplaceNpc.name, existingWorkplaceNpc.role);
        
        // Position the existing NPC in the interior
        const eliteSpace = layout.spaces.find(s => 
            s.type === 'altar' || s.accessibility === 'restricted'
        ) || layout.spaces[0];
        
        namedElite = {
            ...existingWorkplaceNpc,
            x: eliteSpace.bounds.x + Math.floor(eliteSpace.bounds.width / 2),
            y: eliteSpace.bounds.y + Math.floor(eliteSpace.bounds.height / 2)
        };
        
    } else {
        // Fallback: create new elite using the buildingElites service
        console.log('🆕 [BeautifulInteriorGenerator] No existing workplace NPC found, creating new elite');
        
        let existingElite = getBuildingElite(config.buildingId);
        
        if (!existingElite) {
            // Create new elite
            const eliteSpace = layout.spaces.find(s => 
                s.type === 'altar' || s.accessibility === 'restricted'
            ) || layout.spaces[0];
            
            const elitePosition = {
                x: eliteSpace.bounds.x + eliteSpace.bounds.width / 2,
                y: eliteSpace.bounds.y + eliteSpace.bounds.height / 2
            };
            
            existingElite = createEliteForBuilding(
                config.buildingId,
                config.buildingType as 'palace' | 'holy_place' | 'fortress',
                elitePosition,
                religion,
                culturalZone,
                dateInfo.era as HistoricalEra,
                config.standardMapContext.region // Pass region for faction data court roles
            );
        }
        
        // Position the elite NPC based on building type
        let eliteX, eliteY;
        if (existingElite.id.includes('fortress') || config.buildingType === 'fortress') {
            // Fortress commander goes in the command chamber (restricted space)
            const commandSpace = layout.spaces.find(s => s.accessibility === 'restricted') || layout.spaces[0];
            eliteX = commandSpace.bounds.x + Math.floor(commandSpace.bounds.width / 2);
            eliteY = commandSpace.bounds.y + Math.floor(commandSpace.bounds.height / 2) - 2; // Positioned near throne
        } else if (existingElite.id.includes('palace')) {
            const restrictedSpace = layout.spaces.find(s => s.accessibility === 'restricted');
            eliteX = restrictedSpace?.bounds.x || 10;
            eliteY = restrictedSpace?.bounds.y || 10;
        } else {
            const altarSpace = layout.spaces.find(s => s.type === 'altar');
            eliteX = altarSpace?.bounds.x || 10;
            eliteY = altarSpace?.bounds.y || 10;
        }
        
        namedElite = convertEliteToNpc(existingElite, {
            x: eliteX,
            y: eliteY
        });
        
        console.log('🎖️ [BeautifulInteriorGenerator] Created fortress/building elite:', {
            name: namedElite.name,
            position: { x: eliteX, y: eliteY },
            buildingType: config.buildingType
        });
    }
    
    // Generate support NPCs
    const guardNpcs = generateSupportNpcs(
        layout,
        config.buildingType,
        culturalZone,
        dateInfo.era as HistoricalEra,
        religion
    );
    
    // Player start position (always at entrance)
    const playerPosition = layout.entrance;
    
    // Create simplified interior data structure
    const interiorData: BeautifulInteriorData = {
        width: layout.totalBounds.width,
        height: layout.totalBounds.height,
        tiles: [], // Not using the tile system - everything is rendered via SVG
        entities: [], // Not using entity system - furniture is part of architectural spaces
        rooms: [], // Not using room system - using architectural spaces instead
        player: {
            x: playerPosition.x,
            y: playerPosition.y,
            emoji: '🧍'
        },
        entrance: layout.entrance,
        buildingType: config.buildingType,
        buildingId: config.buildingId,
        floor: config.floor,
        totalFloors: config.totalFloors,
        description: `${layout.name} - A magnificent ${config.buildingType.replace('_', ' ')}`,
        // Enhanced data
        layout,
        namedElite,
        guardNpcs,
        npcs: guardNpcs.concat(namedElite ? [namedElite] : [])
    };
    
    return interiorData;
}

/**
 * Check if player has appropriate access to a space
 */
export function checkSpaceAccess(
    space: ArchitecturalSpace,
    playerReligion: string,
    playerClass: string,
    playerReputation: number
): { canAccess: boolean; reason?: string } {
    if (space.accessibility === 'public') {
        return { canAccess: true };
    }
    
    if (space.accessibility === 'sacred') {
        if (space.requiredReligion && playerReligion !== space.requiredReligion) {
            return { 
                canAccess: false, 
                reason: `This sacred space is reserved for followers of ${space.requiredReligion}` 
            };
        }
        if (space.requiredClass && !space.requiredClass.includes(playerClass)) {
            return { 
                canAccess: false, 
                reason: `Only ${space.requiredClass.join(' or ')} may enter this sacred area` 
            };
        }
    }
    
    if (space.accessibility === 'restricted') {
        if (space.requiredClass && !space.requiredClass.includes(playerClass)) {
            return { 
                canAccess: false, 
                reason: `This area is restricted to ${space.requiredClass.join(' or ')}` 
            };
        }
        if (playerReputation < 50) {
            return { 
                canAccess: false, 
                reason: 'Your reputation is too low to access this restricted area' 
            };
        }
    }
    
    return { canAccess: true };
}

/**
 * Get the architectural space that contains a given position
 */
export function getSpaceAtPosition(layout: BuildingLayout, x: number, y: number): ArchitecturalSpace | null {
    for (const space of layout.spaces) {
        if (x >= space.bounds.x && x < space.bounds.x + space.bounds.width &&
            y >= space.bounds.y && y < space.bounds.y + space.bounds.height) {
            return space;
        }
    }
    return null;
}