/**
 * Architectural layouts for specific building types with historically accurate floor plans
 */
import { Point, CulturalZone, HistoricalEra } from '../../types';
import { getHolyPlaceBuildingLayout } from './holyPlaceInteriorIntegration';

export interface ArchitecturalSpace {
    id: string;
    name: string;
    type: 'room' | 'corridor' | 'altar' | 'entrance';
    bounds: { x: number; y: number; width: number; height: number };
    floorType: 'stone' | 'marble' | 'wood' | 'mosaic' | 'carpet' | 'tile';
    wallHeight: number;
    lightingSources: Array<{
        type: 'torch' | 'candle' | 'brazier' | 'chandelier' | 'window' | 'altar_glow';
        position: Point;
        intensity: number;
        color: string;
    }>;
    furniture: Array<{
        type: 'altar' | 'pew' | 'throne' | 'pillar' | 'rug' | 'chest' | 'tapestry' | 'statue';
        position: Point;
        rotation?: number;
        scale?: number;
    }>;
    accessibility: 'public' | 'restricted' | 'sacred';
    requiredReligion?: string;
    requiredClass?: string[];
}

export interface BuildingLayout {
    name: string;
    totalBounds: { width: number; height: number };
    spaces: ArchitecturalSpace[];
    entrance: Point;
    backgroundPattern?: string;
    ambientLighting: { color: string; intensity: number };
}

// GOVERNMENT FORUM - Council chambers and administrative offices
export const GOVERNMENT_FORUM_LAYOUT: BuildingLayout = {
    name: 'Government Forum',
    totalBounds: { width: 40, height: 48 },
    entrance: { x: 20, y: 46 },
    backgroundPattern: 'stone_official',
    ambientLighting: { color: '#F5E6D3', intensity: 0.4 },
    spaces: [
        // Main Council Chamber
        {
            id: 'council_chamber',
            name: 'Council Chamber',
            type: 'room',
            bounds: { x: 10, y: 10, width: 20, height: 16 },
            floorType: 'marble',
            wallHeight: 6,
            lightingSources: [
                { type: 'chandelier', position: { x: 20, y: 18 }, intensity: 0.8, color: '#FFD700' },
                { type: 'window', position: { x: 9, y: 18 }, intensity: 0.5, color: '#87CEEB' },
                { type: 'window', position: { x: 31, y: 18 }, intensity: 0.5, color: '#87CEEB' },
                { type: 'brazier', position: { x: 15, y: 15 }, intensity: 0.6, color: '#FF6347' },
                { type: 'brazier', position: { x: 25, y: 15 }, intensity: 0.6, color: '#FF6347' }
            ],
            furniture: [
                { type: 'throne', position: { x: 20, y: 12 } }, // Council leader's seat
                { type: 'pew', position: { x: 15, y: 16 }, rotation: 90 }, // Council benches
                { type: 'pew', position: { x: 25, y: 16 }, rotation: 270 },
                { type: 'pew', position: { x: 15, y: 20 }, rotation: 90 },
                { type: 'pew', position: { x: 25, y: 20 }, rotation: 270 },
                { type: 'rug', position: { x: 20, y: 18 }, scale: 2 }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'merchant', 'clergy', 'scholar']
        },
        // Public Waiting Hall
        {
            id: 'waiting_hall',
            name: 'Public Waiting Hall',
            type: 'room',
            bounds: { x: 12, y: 28, width: 16, height: 12 },
            floorType: 'stone',
            wallHeight: 5,
            lightingSources: [
                { type: 'torch', position: { x: 14, y: 30 }, intensity: 0.5, color: '#FFA500' },
                { type: 'torch', position: { x: 26, y: 30 }, intensity: 0.5, color: '#FFA500' },
                { type: 'window', position: { x: 11, y: 34 }, intensity: 0.4, color: '#87CEEB' },
                { type: 'window', position: { x: 29, y: 34 }, intensity: 0.4, color: '#87CEEB' }
            ],
            furniture: [
                { type: 'pew', position: { x: 14, y: 32 } },
                { type: 'pew', position: { x: 26, y: 32 } },
                { type: 'pew', position: { x: 14, y: 36 } },
                { type: 'pew', position: { x: 26, y: 36 } }
            ],
            accessibility: 'public'
        },
        // Left Office - Tax/Finance
        {
            id: 'tax_office',
            name: 'Tax Collection Office',
            type: 'room',
            bounds: { x: 2, y: 14, width: 6, height: 8 },
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'candle', position: { x: 5, y: 18 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'chest', position: { x: 4, y: 16 } }, // Tax records
                { type: 'tapestry', position: { x: 3, y: 15 } }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'merchant']
        },
        // Right Office - Records/Archives
        {
            id: 'records_office',
            name: 'Records Archive',
            type: 'room',
            bounds: { x: 32, y: 14, width: 6, height: 8 },
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'candle', position: { x: 35, y: 18 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'chest', position: { x: 34, y: 16 } },
                { type: 'chest', position: { x: 36, y: 16 } },
                { type: 'tapestry', position: { x: 37, y: 15 } }
            ],
            accessibility: 'restricted',
            requiredClass: ['scholar', 'clergy', 'nobility']
        },
        // Entry Corridor
        {
            id: 'entry_corridor',
            name: 'Entry Hall',
            type: 'corridor',
            bounds: { x: 16, y: 42, width: 8, height: 4 },
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 18, y: 44 }, intensity: 0.5, color: '#FFA500' },
                { type: 'torch', position: { x: 22, y: 44 }, intensity: 0.5, color: '#FFA500' }
            ],
            furniture: [
                { type: 'statue', position: { x: 17, y: 43 } },
                { type: 'statue', position: { x: 23, y: 43 } }
            ],
            accessibility: 'public'
        }
    ]
};

// CHRISTIAN CATHEDRAL - Cross/Cruciform layout
export const CATHEDRAL_LAYOUT: BuildingLayout = {
    name: 'Gothic Cathedral',
    totalBounds: { width: 32, height: 40 },
    entrance: { x: 16, y: 38 },
    backgroundPattern: 'stone_cathedral',
    ambientLighting: { color: '#FFE4B5', intensity: 0.3 },
    spaces: [
        // Nave (main body)
        {
            id: 'nave',
            name: 'Nave',
            type: 'room',
            bounds: { x: 12, y: 20, width: 8, height: 18 },
            floorType: 'stone',
            wallHeight: 8,
            lightingSources: [
                { type: 'window', position: { x: 11, y: 25 }, intensity: 0.6, color: '#87CEEB' },
                { type: 'window', position: { x: 21, y: 25 }, intensity: 0.6, color: '#87CEEB' },
                { type: 'candle', position: { x: 14, y: 22 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 18, y: 22 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'pew', position: { x: 13, y: 32 }, rotation: 0 },
                { type: 'pew', position: { x: 17, y: 32 }, rotation: 0 },
                { type: 'pew', position: { x: 13, y: 28 }, rotation: 0 },
                { type: 'pew', position: { x: 17, y: 28 }, rotation: 0 },
                { type: 'pillar', position: { x: 12, y: 24 } },
                { type: 'pillar', position: { x: 20, y: 24 } }
            ],
            accessibility: 'public'
        },
        // Transept (cross arms)
        {
            id: 'transept',
            name: 'Transept',
            type: 'room',
            bounds: { x: 6, y: 16, width: 20, height: 6 },
            floorType: 'marble',
            wallHeight: 6,
            lightingSources: [
                { type: 'chandelier', position: { x: 16, y: 19 }, intensity: 0.8, color: '#FFD700' }
            ],
            furniture: [
                { type: 'statue', position: { x: 8, y: 18 } },
                { type: 'statue', position: { x: 24, y: 18 } }
            ],
            accessibility: 'public'
        },
        // Chancel/Sanctuary (holy area)
        {
            id: 'sanctuary',
            name: 'Sanctuary',
            type: 'altar',
            bounds: { x: 14, y: 8, width: 4, height: 8 },
            floorType: 'marble',
            wallHeight: 4,
            lightingSources: [
                { type: 'altar_glow', position: { x: 16, y: 12 }, intensity: 1.0, color: '#FFF8DC' },
                { type: 'candle', position: { x: 15, y: 11 }, intensity: 0.5, color: '#FFD700' },
                { type: 'candle', position: { x: 17, y: 11 }, intensity: 0.5, color: '#FFD700' }
            ],
            furniture: [
                { type: 'altar', position: { x: 16, y: 12 } }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Christianity',
            requiredClass: ['clergy', 'nobility']
        }
    ]
};

// SMALL CHRISTIAN CHURCH - T-shape
export const CHURCH_LAYOUT: BuildingLayout = {
    name: 'Village Church',
    totalBounds: { width: 20, height: 24 },
    entrance: { x: 10, y: 22 },
    backgroundPattern: 'stone_church',
    ambientLighting: { color: '#FFF8DC', intensity: 0.4 },
    spaces: [
        // Main worship area
        {
            id: 'worship_hall',
            name: 'Worship Hall',
            type: 'room',
            bounds: { x: 6, y: 12, width: 8, height: 10 },
            floorType: 'wood',
            wallHeight: 5,
            lightingSources: [
                { type: 'window', position: { x: 5, y: 16 }, intensity: 0.5, color: '#87CEEB' },
                { type: 'window', position: { x: 15, y: 16 }, intensity: 0.5, color: '#87CEEB' },
                { type: 'candle', position: { x: 8, y: 14 }, intensity: 0.3, color: '#FFD700' },
                { type: 'candle', position: { x: 12, y: 14 }, intensity: 0.3, color: '#FFD700' }
            ],
            furniture: [
                { type: 'pew', position: { x: 7, y: 18 } },
                { type: 'pew', position: { x: 11, y: 18 } },
                { type: 'pew', position: { x: 7, y: 16 } },
                { type: 'pew', position: { x: 11, y: 16 } }
            ],
            accessibility: 'public'
        },
        // Simple altar area
        {
            id: 'altar_area',
            name: 'Altar',
            type: 'altar',
            bounds: { x: 8, y: 6, width: 4, height: 6 },
            floorType: 'stone',
            wallHeight: 3,
            lightingSources: [
                { type: 'altar_glow', position: { x: 10, y: 9 }, intensity: 0.8, color: '#FFF8DC' }
            ],
            furniture: [
                { type: 'altar', position: { x: 10, y: 9 } }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Christianity',
            requiredClass: ['clergy']
        }
    ]
};

// MOSQUE - Circular/dome layout
export const MOSQUE_LAYOUT: BuildingLayout = {
    name: 'Grand Mosque',
    totalBounds: { width: 28, height: 28 },
    entrance: { x: 14, y: 26 },
    backgroundPattern: 'geometric_tiles',
    ambientLighting: { color: '#E6E6FA', intensity: 0.4 },
    spaces: [
        // Main prayer hall (circular)
        {
            id: 'prayer_hall',
            name: 'Prayer Hall',
            type: 'room',
            bounds: { x: 6, y: 6, width: 16, height: 16 },
            floorType: 'carpet',
            wallHeight: 6,
            lightingSources: [
                { type: 'chandelier', position: { x: 14, y: 14 }, intensity: 0.9, color: '#FFD700' },
                { type: 'window', position: { x: 14, y: 8 }, intensity: 0.6, color: '#87CEEB' },
                { type: 'torch', position: { x: 8, y: 10 }, intensity: 0.4, color: '#FF6347' },
                { type: 'torch', position: { x: 20, y: 10 }, intensity: 0.4, color: '#FF6347' },
                { type: 'torch', position: { x: 8, y: 18 }, intensity: 0.4, color: '#FF6347' },
                { type: 'torch', position: { x: 20, y: 18 }, intensity: 0.4, color: '#FF6347' }
            ],
            furniture: [
                { type: 'rug', position: { x: 10, y: 10 }, scale: 2 },
                { type: 'rug', position: { x: 14, y: 10 }, scale: 2 },
                { type: 'rug', position: { x: 18, y: 10 }, scale: 2 },
                { type: 'rug', position: { x: 10, y: 14 }, scale: 2 },
                { type: 'rug', position: { x: 14, y: 14 }, scale: 2 },
                { type: 'rug', position: { x: 18, y: 14 }, scale: 2 },
                { type: 'pillar', position: { x: 10, y: 10 } },
                { type: 'pillar', position: { x: 18, y: 10 } },
                { type: 'pillar', position: { x: 10, y: 18 } },
                { type: 'pillar', position: { x: 18, y: 18 } }
            ],
            accessibility: 'public'
        },
        // Mihrab (prayer direction)
        {
            id: 'mihrab',
            name: 'Mihrab',
            type: 'altar',
            bounds: { x: 12, y: 4, width: 4, height: 4 },
            floorType: 'mosaic',
            wallHeight: 2,
            lightingSources: [
                { type: 'altar_glow', position: { x: 14, y: 6 }, intensity: 0.7, color: '#98FB98' }
            ],
            furniture: [
                { type: 'rug', position: { x: 14, y: 6 }, scale: 1.5 }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Islam',
            requiredClass: ['clergy']
        }
    ]
};

// BUDDHIST TEMPLE - Rectangular with meditation areas
export const BUDDHIST_TEMPLE_LAYOUT: BuildingLayout = {
    name: 'Buddhist Temple',
    totalBounds: { width: 24, height: 20 },
    entrance: { x: 12, y: 18 },
    backgroundPattern: 'wood_zen',
    ambientLighting: { color: '#F5DEB3', intensity: 0.5 },
    spaces: [
        // Meditation hall
        {
            id: 'meditation_hall',
            name: 'Meditation Hall',
            type: 'room',
            bounds: { x: 4, y: 8, width: 16, height: 8 },
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'candle', position: { x: 6, y: 10 }, intensity: 0.3, color: '#FFD700' },
                { type: 'candle', position: { x: 18, y: 10 }, intensity: 0.3, color: '#FFD700' },
                { type: 'candle', position: { x: 6, y: 14 }, intensity: 0.3, color: '#FFD700' },
                { type: 'candle', position: { x: 18, y: 14 }, intensity: 0.3, color: '#FFD700' },
                { type: 'window', position: { x: 12, y: 8 }, intensity: 0.6, color: '#F0F8FF' }
            ],
            furniture: [
                { type: 'rug', position: { x: 8, y: 12 } },
                { type: 'rug', position: { x: 12, y: 12 } },
                { type: 'rug', position: { x: 16, y: 12 } }
            ],
            accessibility: 'public'
        },
        // Buddha shrine
        {
            id: 'shrine',
            name: 'Buddha Shrine',
            type: 'altar',
            bounds: { x: 10, y: 4, width: 4, height: 4 },
            floorType: 'stone',
            wallHeight: 3,
            lightingSources: [
                { type: 'altar_glow', position: { x: 12, y: 6 }, intensity: 0.9, color: '#FFE4E1' },
                { type: 'candle', position: { x: 11, y: 5 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 13, y: 5 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'altar', position: { x: 12, y: 6 } },
                { type: 'statue', position: { x: 12, y: 5 } }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Buddhism'
        }
    ]
};

// SYNAGOGUE - Rectangular with bimah
export const SYNAGOGUE_LAYOUT: BuildingLayout = {
    name: 'Synagogue',
    totalBounds: { width: 18, height: 16 },
    entrance: { x: 9, y: 14 },
    backgroundPattern: 'stone_hebrew',
    ambientLighting: { color: '#F0F8FF', intensity: 0.6 },
    spaces: [
        // Main sanctuary
        {
            id: 'sanctuary',
            name: 'Sanctuary',
            type: 'room',
            bounds: { x: 3, y: 6, width: 12, height: 8 },
            floorType: 'wood',
            wallHeight: 5,
            lightingSources: [
                { type: 'chandelier', position: { x: 9, y: 10 }, intensity: 0.8, color: '#FFD700' },
                { type: 'candle', position: { x: 6, y: 8 }, intensity: 0.3, color: '#FFD700' },
                { type: 'candle', position: { x: 12, y: 8 }, intensity: 0.3, color: '#FFD700' }
            ],
            furniture: [
                { type: 'pew', position: { x: 5, y: 12 } },
                { type: 'pew', position: { x: 11, y: 12 } },
                { type: 'pew', position: { x: 5, y: 10 } },
                { type: 'pew', position: { x: 11, y: 10 } }
            ],
            accessibility: 'public'
        },
        // Ark area
        {
            id: 'ark',
            name: 'Holy Ark',
            type: 'altar',
            bounds: { x: 7, y: 3, width: 4, height: 3 },
            floorType: 'marble',
            wallHeight: 4,
            lightingSources: [
                { type: 'altar_glow', position: { x: 9, y: 4.5 }, intensity: 1.0, color: '#E6E6FA' }
            ],
            furniture: [
                { type: 'altar', position: { x: 9, y: 4.5 } }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Judaism',
            requiredClass: ['clergy']
        }
    ]
};

// EUROPEAN PALACE - Throne room with antechamber
export const EUROPEAN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Royal Palace',
    totalBounds: { width: 32, height: 24 },
    entrance: { x: 16, y: 22 },
    backgroundPattern: 'marble_royal',
    ambientLighting: { color: '#F5F5DC', intensity: 0.7 },
    spaces: [
        // Grand entrance hall
        {
            id: 'entrance_hall',
            name: 'Entrance Hall',
            type: 'room',
            bounds: { x: 12, y: 16, width: 8, height: 6 },
            floorType: 'marble',
            wallHeight: 6,
            lightingSources: [
                { type: 'chandelier', position: { x: 16, y: 19 }, intensity: 0.9, color: '#FFD700' },
                { type: 'torch', position: { x: 13, y: 17 }, intensity: 0.4, color: '#FF6347' },
                { type: 'torch', position: { x: 19, y: 17 }, intensity: 0.4, color: '#FF6347' }
            ],
            furniture: [
                { type: 'tapestry', position: { x: 12, y: 16 } },
                { type: 'tapestry', position: { x: 20, y: 16 } }
            ],
            accessibility: 'public'
        },
        // Throne room
        {
            id: 'throne_room',
            name: 'Throne Room',
            type: 'room',
            bounds: { x: 8, y: 6, width: 16, height: 10 },
            floorType: 'marble',
            wallHeight: 8,
            lightingSources: [
                { type: 'chandelier', position: { x: 16, y: 11 }, intensity: 1.0, color: '#FFD700' },
                { type: 'window', position: { x: 10, y: 8 }, intensity: 0.6, color: '#87CEEB' },
                { type: 'window', position: { x: 22, y: 8 }, intensity: 0.6, color: '#87CEEB' },
                { type: 'torch', position: { x: 12, y: 10 }, intensity: 0.5, color: '#FF6347' },
                { type: 'torch', position: { x: 20, y: 10 }, intensity: 0.5, color: '#FF6347' }
            ],
            furniture: [
                { type: 'throne', position: { x: 16, y: 8 } },
                { type: 'rug', position: { x: 16, y: 12 }, scale: 3 },
                { type: 'pillar', position: { x: 12, y: 8 } },
                { type: 'pillar', position: { x: 20, y: 8 } },
                { type: 'tapestry', position: { x: 8, y: 8 } },
                { type: 'tapestry', position: { x: 24, y: 8 } }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy', 'merchant']
        }
    ]
};

// MIDDLE EASTERN PALACE - Courtyard style
export const MIDDLE_EASTERN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Sultan\'s Palace',
    totalBounds: { width: 28, height: 28 },
    entrance: { x: 14, y: 26 },
    backgroundPattern: 'geometric_palace',
    ambientLighting: { color: '#FFF8DC', intensity: 0.6 },
    spaces: [
        // Courtyard reception
        {
            id: 'courtyard',
            name: 'Courtyard',
            type: 'room',
            bounds: { x: 8, y: 12, width: 12, height: 12 },
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'brazier', position: { x: 12, y: 16 }, intensity: 0.6, color: '#FF6347' },
                { type: 'brazier', position: { x: 16, y: 16 }, intensity: 0.6, color: '#FF6347' },
                { type: 'brazier', position: { x: 12, y: 20 }, intensity: 0.6, color: '#FF6347' },
                { type: 'brazier', position: { x: 16, y: 20 }, intensity: 0.6, color: '#FF6347' }
            ],
            furniture: [
                { type: 'rug', position: { x: 14, y: 18 }, scale: 4 },
                { type: 'pillar', position: { x: 10, y: 14 } },
                { type: 'pillar', position: { x: 18, y: 14 } },
                { type: 'pillar', position: { x: 10, y: 22 } },
                { type: 'pillar', position: { x: 18, y: 22 } }
            ],
            accessibility: 'public'
        },
        // Sultan's chamber
        {
            id: 'divan',
            name: 'Sultan\'s Divan',
            type: 'room',
            bounds: { x: 10, y: 6, width: 8, height: 6 },
            floorType: 'carpet',
            wallHeight: 5,
            lightingSources: [
                { type: 'chandelier', position: { x: 14, y: 9 }, intensity: 0.8, color: '#FFD700' },
                { type: 'candle', position: { x: 12, y: 7 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 16, y: 7 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'throne', position: { x: 14, y: 8 } },
                { type: 'rug', position: { x: 14, y: 10 }, scale: 2 },
                { type: 'tapestry', position: { x: 10, y: 7 } },
                { type: 'tapestry', position: { x: 18, y: 7 } }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy']
        }
    ]
};

// ASIAN PALACE - Traditional East Asian layout
export const ASIAN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Imperial Palace',
    totalBounds: { width: 30, height: 22 },
    entrance: { x: 15, y: 20 },
    backgroundPattern: 'wood_imperial',
    ambientLighting: { color: '#F4F1DE', intensity: 0.65 },
    spaces: [
        // Entrance courtyard
        {
            id: 'entrance_court',
            name: 'Entrance Courtyard',
            type: 'room',
            bounds: { x: 10, y: 14, width: 10, height: 6 },
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 12, y: 16 }, intensity: 0.5, color: '#FF6347' },
                { type: 'torch', position: { x: 18, y: 16 }, intensity: 0.5, color: '#FF6347' }
            ],
            furniture: [
                { type: 'pillar', position: { x: 12, y: 15 } },
                { type: 'pillar', position: { x: 18, y: 15 } },
                { type: 'rug', position: { x: 15, y: 17 }, scale: 2 }
            ],
            accessibility: 'public'
        },
        // Throne hall
        {
            id: 'throne_hall',
            name: 'Dragon Throne Hall',
            type: 'room',
            bounds: { x: 6, y: 6, width: 18, height: 8 },
            floorType: 'marble',
            wallHeight: 7,
            lightingSources: [
                { type: 'chandelier', position: { x: 15, y: 10 }, intensity: 1.0, color: '#FFD700' },
                { type: 'candle', position: { x: 10, y: 8 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 20, y: 8 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'throne', position: { x: 15, y: 8 } },
                { type: 'pillar', position: { x: 9, y: 9 } },
                { type: 'pillar', position: { x: 21, y: 9 } },
                { type: 'tapestry', position: { x: 7, y: 7 } },
                { type: 'tapestry', position: { x: 23, y: 7 } },
                { type: 'rug', position: { x: 15, y: 12 }, scale: 4 }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy']
        }
    ]
};

// AFRICAN PALACE - Great hall with traditional elements
export const AFRICAN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Royal Compound',
    totalBounds: { width: 26, height: 20 },
    entrance: { x: 13, y: 18 },
    backgroundPattern: 'earth_palace',
    ambientLighting: { color: '#E8D5B7', intensity: 0.7 },
    spaces: [
        // Great hall
        {
            id: 'great_hall',
            name: 'Great Hall',
            type: 'room',
            bounds: { x: 6, y: 10, width: 14, height: 8 },
            floorType: 'stone',
            wallHeight: 5,
            lightingSources: [
                { type: 'brazier', position: { x: 10, y: 12 }, intensity: 0.7, color: '#FF6347' },
                { type: 'brazier', position: { x: 16, y: 12 }, intensity: 0.7, color: '#FF6347' },
                { type: 'torch', position: { x: 8, y: 14 }, intensity: 0.5, color: '#FF6347' },
                { type: 'torch', position: { x: 18, y: 14 }, intensity: 0.5, color: '#FF6347' }
            ],
            furniture: [
                { type: 'throne', position: { x: 13, y: 12 } },
                { type: 'rug', position: { x: 13, y: 15 }, scale: 3 },
                { type: 'pillar', position: { x: 9, y: 13 } },
                { type: 'pillar', position: { x: 17, y: 13 } }
            ],
            accessibility: 'public'
        },
        // Royal chamber
        {
            id: 'royal_chamber',
            name: 'Royal Chamber',
            type: 'room',
            bounds: { x: 9, y: 5, width: 8, height: 5 },
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'candle', position: { x: 13, y: 7 }, intensity: 0.6, color: '#FFD700' }
            ],
            furniture: [
                { type: 'chest', position: { x: 11, y: 6 } },
                { type: 'rug', position: { x: 13, y: 8 }, scale: 2 }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility']
        }
    ]
};

export const BUILDING_LAYOUTS: Record<string, BuildingLayout> = {
    'cathedral': CATHEDRAL_LAYOUT,
    'church': CHURCH_LAYOUT,
    'mosque': MOSQUE_LAYOUT,
    'buddhist_temple': BUDDHIST_TEMPLE_LAYOUT,
    'synagogue': SYNAGOGUE_LAYOUT,
    'european_palace': EUROPEAN_PALACE_LAYOUT,
    'middle_eastern_palace': MIDDLE_EASTERN_PALACE_LAYOUT,
    'asian_palace': ASIAN_PALACE_LAYOUT,
    'african_palace': AFRICAN_PALACE_LAYOUT,
    'government_forum': GOVERNMENT_FORUM_LAYOUT,
    'government_district': GOVERNMENT_FORUM_LAYOUT
};

/**
 * Select appropriate layout based on building type and religion
 */
export function selectBuildingLayout(
    buildingType: string,
    religion?: string,
    culturalZone?: string,
    size?: 'small' | 'medium' | 'large',
    seed?: number,
    era?: HistoricalEra
): BuildingLayout {
    console.log('🏗️ [ArchitecturalLayouts] Selecting layout for:', {
        buildingType,
        religion: religion || 'None',
        culturalZone: culturalZone || 'None',
        size: size || 'medium'
    });
    
    // Handle government buildings
    if (buildingType === 'government' || buildingType === 'government_district' || buildingType === 'government_forum') {
        console.log('🏛️ Selected: GOVERNMENT_FORUM_LAYOUT');
        return GOVERNMENT_FORUM_LAYOUT;
    }
    
    if (buildingType === 'palace') {
        // Use seed for deterministic randomization if no specific cultural zone match
        const palaceLayouts = [EUROPEAN_PALACE_LAYOUT, MIDDLE_EASTERN_PALACE_LAYOUT, ASIAN_PALACE_LAYOUT, AFRICAN_PALACE_LAYOUT];
        
        // First check for specific cultural zone matches
        if (culturalZone?.toLowerCase().includes('mena') || culturalZone?.toLowerCase().includes('middle east')) {
            console.log('🕌 Selected: MIDDLE_EASTERN_PALACE_LAYOUT (cultural match)');
            return MIDDLE_EASTERN_PALACE_LAYOUT;
        }
        if (culturalZone?.toLowerCase().includes('east_asia') || culturalZone?.toLowerCase().includes('asia')) {
            console.log('🏯 Selected: ASIAN_PALACE_LAYOUT (cultural match)');
            return ASIAN_PALACE_LAYOUT;
        }
        if (culturalZone?.toLowerCase().includes('africa')) {
            console.log('🏛️ Selected: AFRICAN_PALACE_LAYOUT (cultural match)');
            return AFRICAN_PALACE_LAYOUT;
        }
        if (culturalZone?.toLowerCase().includes('europe')) {
            console.log('🏰 Selected: EUROPEAN_PALACE_LAYOUT (cultural match)');
            return EUROPEAN_PALACE_LAYOUT;
        }
        
        // If no cultural match, use seed-based selection for variety
        if (seed !== undefined) {
            const selectedLayout = palaceLayouts[seed % palaceLayouts.length];
            console.log(`🎲 Selected: ${selectedLayout.name} (seed-based: ${seed % palaceLayouts.length})`);
            return selectedLayout;
        }
        
        // Fallback to European palace
        console.log('🏰 Selected: EUROPEAN_PALACE_LAYOUT (fallback)');
        return EUROPEAN_PALACE_LAYOUT;
    }
    
    if (buildingType === 'holy_place' || buildingType === 'temple') {
        const lowerReligion = (religion || '').toLowerCase();
        console.log('⛪ [ArchitecturalLayouts] Processing holy place with religion:', lowerReligion);
        console.log('🌍 Cultural zone:', culturalZone, 'Era:', era);
        
        // Try to use our culturally-specific holy place layouts first
        if (culturalZone && era) {
            const culturalLayout = getHolyPlaceBuildingLayout(
                culturalZone as CulturalZone,
                era,
                religion
            );
            
            if (culturalLayout) {
                console.log('✨ Using culturally-specific holy place layout:', culturalLayout.name);
                return culturalLayout;
            }
        }
        
        // Fallback to religion-based selection if no cultural layout found
        if (lowerReligion.includes('islam') || lowerReligion.includes('sunni') || lowerReligion.includes('shia')) {
            console.log('🕌 Selected: MOSQUE_LAYOUT (religion fallback)');
            return MOSQUE_LAYOUT;
        }
        if (lowerReligion.includes('buddhism') || lowerReligion.includes('buddhist')) {
            console.log('🏛️ Selected: BUDDHIST_TEMPLE_LAYOUT (religion fallback)');
            return BUDDHIST_TEMPLE_LAYOUT;
        }
        if (lowerReligion.includes('judaism') || lowerReligion.includes('jewish')) {
            console.log('✡️ Selected: SYNAGOGUE_LAYOUT (religion fallback)');
            return SYNAGOGUE_LAYOUT;
        }
        if (lowerReligion.includes('catholic') || lowerReligion.includes('orthodox') || 
            (lowerReligion.includes('christian') && size === 'large')) {
            console.log('⛪ Selected: CATHEDRAL_LAYOUT (religion fallback)');
            return CATHEDRAL_LAYOUT;
        }
        if (lowerReligion.includes('christian') || lowerReligion.includes('protestant')) {
            console.log('⛪ Selected: CHURCH_LAYOUT (religion fallback)');
            return CHURCH_LAYOUT;
        }
        
        console.log('❓ [ArchitecturalLayouts] No specific religion matched, falling back to default');
    }
    
    // Default fallback
    return CHURCH_LAYOUT;
}