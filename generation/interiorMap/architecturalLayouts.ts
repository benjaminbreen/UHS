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
        type: 'altar' | 'pew' | 'throne' | 'pillar' | 'rug' | 'chest' | 'tapestry' | 'statue' | 'table' | 'weapon_rack';
        position: Point;
        rotation?: number;
        scale?: number;
        culturalVariant?: 'european' | 'east_asian' | 'mena' | 'african' | 'default';
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
    entrance: { x: 20, y: 43 }, // FIXED: Inside entry corridor bounds (y: 42-46)
    backgroundPattern: 'stone_official',
    ambientLighting: { color: '#F5E6D3', intensity: 0.4 },
    spaces: [
        // Main Council Chamber
        {
            id: 'council_chamber',
            name: 'Council Chamber',
            type: 'room',
            bounds: { x: 10, y: 10, width: 20, height: 18 }, // ENLARGED: height 16 → 18
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
            bounds: { x: 12, y: 28, width: 16, height: 14 }, // ENLARGED: height 12 → 14
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
            bounds: { x: 2, y: 14, width: 8, height: 10 }, // ENLARGED: 6x8 → 8x10
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
            bounds: { x: 30, y: 14, width: 8, height: 10 }, // ENLARGED: 6x8 → 8x10, shifted left to fit
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
            bounds: { x: 14, y: 42, width: 12, height: 6 }, // ENLARGED: 8x4 → 12x6, centered on entrance
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

// FORTRESS COMMANDER CHAMBER - Military command post
export const FORTRESS_LAYOUT: BuildingLayout = {
    name: 'Fortress Commander Chamber',
    totalBounds: { width: 24, height: 18 }, // ENLARGED: height 16 → 18
    entrance: { x: 12, y: 16 }, // FIXED: Inside entrance area
    backgroundPattern: 'stone_fortress',
    ambientLighting: { color: '#D2B48C', intensity: 0.5 },
    spaces: [
        // Entrance Guard Area
        {
            id: 'entrance_area',
            name: 'Entrance',
            type: 'entrance',
            bounds: { x: 8, y: 14, width: 8, height: 4 }, // NEW: Entrance guard area
            floorType: 'stone',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 10, y: 16 }, intensity: 0.6, color: '#FF8C00' },
                { type: 'torch', position: { x: 14, y: 16 }, intensity: 0.6, color: '#FF8C00' }
            ],
            furniture: [
                { type: 'weapon_rack', position: { x: 9, y: 15 } },
                { type: 'weapon_rack', position: { x: 15, y: 15 } }
            ],
            accessibility: 'public'
        },
        // Main command chamber
        {
            id: 'command_chamber',
            name: 'Command Chamber',
            type: 'room',
            bounds: { x: 2, y: 2, width: 20, height: 12 }, // Same size, but now more space below
            floorType: 'stone',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 4, y: 4 }, intensity: 0.6, color: '#FF8C00' },
                { type: 'torch', position: { x: 20, y: 4 }, intensity: 0.6, color: '#FF8C00' },
                { type: 'brazier', position: { x: 12, y: 8 }, intensity: 0.8, color: '#FFD700' }
            ],
            furniture: [
                { type: 'throne', position: { x: 12, y: 4 }, rotation: 180, scale: 1.2 }, // Commander's seat facing entrance
                { type: 'table', position: { x: 12, y: 8 }, scale: 1.5 }, // War table
                { type: 'weapon_rack', position: { x: 4, y: 6 }, rotation: 90 },
                { type: 'weapon_rack', position: { x: 20, y: 6 }, rotation: 270 },
                { type: 'chest', position: { x: 6, y: 12 } },
                { type: 'chest', position: { x: 18, y: 12 } },
                { type: 'tapestry', position: { x: 2, y: 6 } },
                { type: 'tapestry', position: { x: 22, y: 6 } }
            ],
            accessibility: 'restricted',
            requiredClass: ['military_officer', 'nobility', 'messenger']
        }
    ]
};

// CHRISTIAN CATHEDRAL - Cross/Cruciform layout (IMPROVED)
export const CATHEDRAL_LAYOUT: BuildingLayout = {
    name: 'Gothic Cathedral',
    totalBounds: { width: 40, height: 50 }, // EXPANDED: 32x42 → 40x50
    entrance: { x: 20, y: 47 }, // Centered in narthex
    backgroundPattern: 'stone_cathedral',
    ambientLighting: { color: '#FFE4B5', intensity: 0.4 }, // Slightly brighter
    spaces: [
        // Narthex (entrance vestibule)
        {
            id: 'narthex',
            name: 'Narthex',
            type: 'entrance',
            bounds: { x: 14, y: 46, width: 12, height: 4 }, // EXPANDED: 8x4 → 12x4
            floorType: 'tile',
            wallHeight: 6,
            lightingSources: [
                { type: 'torch', position: { x: 16, y: 48 }, intensity: 0.6, color: '#FFA500' },
                { type: 'torch', position: { x: 24, y: 48 }, intensity: 0.6, color: '#FFA500' }
            ],
            furniture: [
                { type: 'pillar', position: { x: 15, y: 47 }, scale: 1.5 },
                { type: 'pillar', position: { x: 25, y: 47 }, scale: 1.5 }
            ],
            accessibility: 'public'
        },
        // Nave (main body) - MASSIVELY EXPANDED with rows of pews
        {
            id: 'nave',
            name: 'Nave',
            type: 'room',
            bounds: { x: 14, y: 24, width: 12, height: 22 }, // EXPANDED: 8x18 → 12x22
            floorType: 'stone',
            wallHeight: 10, // Taller for Gothic feel
            lightingSources: [
                { type: 'window', position: { x: 13, y: 28 }, intensity: 0.7, color: '#87CEEB' },
                { type: 'window', position: { x: 27, y: 28 }, intensity: 0.7, color: '#87CEEB' },
                { type: 'window', position: { x: 13, y: 36 }, intensity: 0.7, color: '#87CEEB' },
                { type: 'window', position: { x: 27, y: 36 }, intensity: 0.7, color: '#87CEEB' },
                { type: 'chandelier', position: { x: 20, y: 35 }, intensity: 0.9, color: '#FFD700' },
                { type: 'chandelier', position: { x: 20, y: 30 }, intensity: 0.9, color: '#FFD700' }
            ],
            furniture: [
                // Left aisle pews (6 rows)
                { type: 'pew', position: { x: 16, y: 44 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 42 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 40 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 38 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 36 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 34 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 32 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 30 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 28 }, rotation: 0 },
                { type: 'pew', position: { x: 16, y: 26 }, rotation: 0 },
                // Right aisle pews (10 rows)
                { type: 'pew', position: { x: 24, y: 44 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 42 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 40 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 38 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 36 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 34 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 32 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 30 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 28 }, rotation: 0 },
                { type: 'pew', position: { x: 24, y: 26 }, rotation: 0 },
                // Gothic pillars along nave
                { type: 'pillar', position: { x: 14, y: 42 }, scale: 1.5 },
                { type: 'pillar', position: { x: 26, y: 42 }, scale: 1.5 },
                { type: 'pillar', position: { x: 14, y: 34 }, scale: 1.5 },
                { type: 'pillar', position: { x: 26, y: 34 }, scale: 1.5 },
                { type: 'pillar', position: { x: 14, y: 26 }, scale: 1.5 },
                { type: 'pillar', position: { x: 26, y: 26 }, scale: 1.5 }
            ],
            accessibility: 'public'
        },
        // Transept (cross arms) - EXPANDED
        {
            id: 'transept',
            name: 'Transept',
            type: 'room',
            bounds: { x: 6, y: 18, width: 28, height: 8 }, // EXPANDED: 20x6 → 28x8
            floorType: 'marble',
            wallHeight: 8,
            lightingSources: [
                { type: 'chandelier', position: { x: 20, y: 22 }, intensity: 1.0, color: '#FFD700' },
                { type: 'window', position: { x: 5, y: 22 }, intensity: 0.8, color: '#87CEEB' },
                { type: 'window', position: { x: 35, y: 22 }, intensity: 0.8, color: '#87CEEB' }
            ],
            furniture: [
                { type: 'statue', position: { x: 8, y: 22 }, scale: 1.5 },
                { type: 'statue', position: { x: 32, y: 22 }, scale: 1.5 },
                { type: 'pillar', position: { x: 12, y: 20 }, scale: 1.5 },
                { type: 'pillar', position: { x: 28, y: 20 }, scale: 1.5 },
                { type: 'pillar', position: { x: 12, y: 24 }, scale: 1.5 },
                { type: 'pillar', position: { x: 28, y: 24 }, scale: 1.5 }
            ],
            accessibility: 'public'
        },
        // Chancel/Sanctuary (holy area) - EXPANDED
        {
            id: 'sanctuary',
            name: 'Sanctuary',
            type: 'altar',
            bounds: { x: 15, y: 8, width: 10, height: 12 }, // EXPANDED: 6x10 → 10x12
            floorType: 'marble',
            wallHeight: 6,
            lightingSources: [
                { type: 'altar_glow', position: { x: 20, y: 13 }, intensity: 1.2, color: '#FFF8DC' },
                { type: 'candle', position: { x: 18, y: 12 }, intensity: 0.6, color: '#FFD700' },
                { type: 'candle', position: { x: 22, y: 12 }, intensity: 0.6, color: '#FFD700' },
                { type: 'window', position: { x: 20, y: 9 }, intensity: 0.9, color: '#87CEEB' }
            ],
            furniture: [
                { type: 'altar', position: { x: 20, y: 13 }, scale: 1.5, culturalVariant: 'european' },
                { type: 'pillar', position: { x: 16, y: 16 }, scale: 1.5 },
                { type: 'pillar', position: { x: 24, y: 16 }, scale: 1.5 },
                { type: 'rug', position: { x: 20, y: 15 }, scale: 2.5, culturalVariant: 'european' }
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
    totalBounds: { width: 20, height: 26 }, // ENLARGED: height 24 → 26
    entrance: { x: 10, y: 24 }, // FIXED: Inside entrance vestibule
    backgroundPattern: 'stone_church',
    ambientLighting: { color: '#FFF8DC', intensity: 0.4 },
    spaces: [
        // Entrance Vestibule
        {
            id: 'entrance_vestibule',
            name: 'Entrance',
            type: 'entrance',
            bounds: { x: 7, y: 22, width: 6, height: 4 }, // NEW: Small entrance area
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 10, y: 24 }, intensity: 0.4, color: '#FFA500' }
            ],
            furniture: [],
            accessibility: 'public'
        },
        // Main worship area
        {
            id: 'worship_hall',
            name: 'Worship Hall',
            type: 'room',
            bounds: { x: 6, y: 12, width: 8, height: 10 }, // Same size
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
            bounds: { x: 7, y: 6, width: 6, height: 6 }, // ENLARGED: width 4 → 6
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
    totalBounds: { width: 28, height: 30 }, // ENLARGED: height 28 → 30
    entrance: { x: 14, y: 28 }, // FIXED: Inside entrance courtyard
    backgroundPattern: 'geometric_tiles',
    ambientLighting: { color: '#E6E6FA', intensity: 0.4 },
    spaces: [
        // Entrance Courtyard (Sahn)
        {
            id: 'entrance_courtyard',
            name: 'Entrance Courtyard',
            type: 'entrance',
            bounds: { x: 10, y: 26, width: 8, height: 4 }, // NEW: Islamic entrance courtyard
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 12, y: 28 }, intensity: 0.5, color: '#FFA500' },
                { type: 'torch', position: { x: 16, y: 28 }, intensity: 0.5, color: '#FFA500' }
            ],
            furniture: [
                { type: 'fountain', position: { x: 14, y: 28 } }
            ],
            accessibility: 'public'
        },
        // Connecting Corridor
        {
            id: 'corridor',
            name: 'Corridor',
            type: 'corridor',
            bounds: { x: 12, y: 24, width: 4, height: 2 }, // CONNECTS courtyard to prayer hall
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 14, y: 25 }, intensity: 0.4, color: '#FFA500' }
            ],
            furniture: [],
            accessibility: 'public'
        },
        // Main prayer hall (circular)
        {
            id: 'prayer_hall',
            name: 'Prayer Hall',
            type: 'room',
            bounds: { x: 6, y: 6, width: 16, height: 18 }, // ENLARGED: height 16 → 18, now goes to y:24
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
            bounds: { x: 11, y: 2, width: 6, height: 6 }, // ENLARGED: 4x4 → 6x6, shifted up
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
    totalBounds: { width: 24, height: 22 }, // ENLARGED: height 20 → 22
    entrance: { x: 12, y: 20 }, // FIXED: Inside entrance garden
    backgroundPattern: 'wood_zen',
    ambientLighting: { color: '#F5DEB3', intensity: 0.5 },
    spaces: [
        // Entrance Garden/Vestibule
        {
            id: 'entrance_garden',
            name: 'Entrance Garden',
            type: 'entrance',
            bounds: { x: 9, y: 18, width: 6, height: 4 }, // NEW: Zen garden entrance
            floorType: 'stone',
            wallHeight: 3,
            lightingSources: [
                { type: 'torch', position: { x: 12, y: 20 }, intensity: 0.4, color: '#FFA500' }
            ],
            furniture: [
                { type: 'planter', position: { x: 10, y: 19 } },
                { type: 'planter', position: { x: 14, y: 19 } }
            ],
            accessibility: 'public'
        },
        // Meditation hall
        {
            id: 'meditation_hall',
            name: 'Meditation Hall',
            type: 'room',
            bounds: { x: 4, y: 8, width: 16, height: 10 }, // ENLARGED: height 8 → 10
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
            bounds: { x: 9, y: 4, width: 6, height: 4 }, // ENLARGED: width 4 → 6
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

// HINDU TEMPLE - Open courtyard with multiple shrines (Mandapa style)
export const HINDU_TEMPLE_LAYOUT: BuildingLayout = {
    name: 'Hindu Temple',
    totalBounds: { width: 26, height: 24 }, // ENLARGED: height 22 → 24
    entrance: { x: 13, y: 22 }, // FIXED: Inside entrance vestibule
    backgroundPattern: 'stone_carved',
    ambientLighting: { color: '#FFF8DC', intensity: 0.6 },
    spaces: [
        // Main hall (Mandapa)
        {
            id: 'mandapa',
            name: 'Mandapa (Prayer Hall)',
            type: 'room',
            bounds: { x: 5, y: 10, width: 16, height: 10 },
            floorType: 'marble',
            wallHeight: 5,
            lightingSources: [
                { type: 'candle', position: { x: 8, y: 14 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 18, y: 14 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 8, y: 16 }, intensity: 0.4, color: '#FFD700' },
                { type: 'candle', position: { x: 18, y: 16 }, intensity: 0.4, color: '#FFD700' },
                { type: 'window', position: { x: 13, y: 10 }, intensity: 0.7, color: '#FFA500' }
            ],
            furniture: [
                { type: 'column', position: { x: 8, y: 12 } },
                { type: 'column', position: { x: 18, y: 12 } },
                { type: 'column', position: { x: 8, y: 18 } },
                { type: 'column', position: { x: 18, y: 18 } },
                { type: 'rug', position: { x: 11, y: 15 } },
                { type: 'rug', position: { x: 15, y: 15 } }
            ],
            accessibility: 'public'
        },
        // Main shrine (Garbhagriha - sanctum sanctorum)
        {
            id: 'garbhagriha',
            name: 'Garbhagriha (Inner Sanctum)',
            type: 'altar',
            bounds: { x: 11, y: 4, width: 4, height: 6 },
            floorType: 'marble',
            wallHeight: 4,
            lightingSources: [
                { type: 'altar_glow', position: { x: 13, y: 7 }, intensity: 1.0, color: '#FF6347' },
                { type: 'candle', position: { x: 12, y: 6 }, intensity: 0.5, color: '#FFD700' },
                { type: 'candle', position: { x: 14, y: 6 }, intensity: 0.5, color: '#FFD700' },
                { type: 'candle', position: { x: 12, y: 8 }, intensity: 0.5, color: '#FFD700' },
                { type: 'candle', position: { x: 14, y: 8 }, intensity: 0.5, color: '#FFD700' }
            ],
            furniture: [
                { type: 'altar', position: { x: 13, y: 7 } },
                { type: 'statue', position: { x: 13, y: 6 } }, // Main deity
                { type: 'planter', position: { x: 12, y: 9 } }, // Offerings
                { type: 'planter', position: { x: 14, y: 9 } }
            ],
            accessibility: 'sacred',
            requiredReligion: 'Hinduism'
        },
        // Entrance Vestibule
        {
            id: 'entrance_vestibule',
            name: 'Entrance',
            type: 'entrance',
            bounds: { x: 10, y: 20, width: 6, height: 4 }, // NEW: Entrance hall
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 13, y: 22 }, intensity: 0.5, color: '#FFA500' }
            ],
            furniture: [],
            accessibility: 'public'
        },
        // Side shrine 1 (for secondary deity)
        {
            id: 'side_shrine_1',
            name: 'Side Shrine',
            type: 'altar',
            bounds: { x: 2, y: 6, width: 5, height: 6 }, // ENLARGED: 3x4 → 5x6
            floorType: 'stone',
            wallHeight: 3,
            lightingSources: [
                { type: 'candle', position: { x: 4, y: 8 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'altar', position: { x: 4, y: 8 } },
                { type: 'statue', position: { x: 4, y: 7 } }
            ],
            accessibility: 'public'
        },
        // Side shrine 2
        {
            id: 'side_shrine_2',
            name: 'Side Shrine',
            type: 'altar',
            bounds: { x: 19, y: 6, width: 5, height: 6 }, // ENLARGED: 3x4 → 5x6
            floorType: 'stone',
            wallHeight: 3,
            lightingSources: [
                { type: 'candle', position: { x: 22, y: 8 }, intensity: 0.4, color: '#FFD700' }
            ],
            furniture: [
                { type: 'altar', position: { x: 22, y: 8 } },
                { type: 'statue', position: { x: 22, y: 7 } }
            ],
            accessibility: 'public'
        }
    ]
};

// SYNAGOGUE - Rectangular with bimah
export const SYNAGOGUE_LAYOUT: BuildingLayout = {
    name: 'Synagogue',
    totalBounds: { width: 18, height: 18 }, // ENLARGED: height 16 → 18
    entrance: { x: 9, y: 15 }, // FIXED: Inside entrance vestibule
    backgroundPattern: 'stone_hebrew',
    ambientLighting: { color: '#F0F8FF', intensity: 0.6 },
    spaces: [
        // Main sanctuary
        {
            id: 'sanctuary',
            name: 'Sanctuary',
            type: 'room',
            bounds: { x: 3, y: 4, width: 12, height: 10 }, // ENLARGED: 12x8 → 12x10, shifted down
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
        // Entrance Vestibule
        {
            id: 'entrance_vestibule',
            name: 'Entrance',
            type: 'entrance',
            bounds: { x: 6, y: 14, width: 6, height: 4 }, // NEW: Entrance hall containing entrance point
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 9, y: 16 }, intensity: 0.5, color: '#FFA500' }
            ],
            furniture: [],
            accessibility: 'public'
        },
        // Ark area
        {
            id: 'ark',
            name: 'Holy Ark',
            type: 'altar',
            bounds: { x: 7, y: 1, width: 4, height: 3 }, // Shifted up to make room
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
    totalBounds: { width: 32, height: 24 }, // Keep same size
    entrance: { x: 16, y: 19 }, // FIXED: Inside entrance hall (y: 16-22)
    backgroundPattern: 'marble_royal',
    ambientLighting: { color: '#FFF8DC', intensity: 0.85 }, // ENHANCED: brighter, warmer (0.7 → 0.85)
    spaces: [
        // Grand entrance hall
        {
            id: 'entrance_hall',
            name: 'Entrance Hall',
            type: 'entrance', // Changed to 'entrance' type
            bounds: { x: 12, y: 16, width: 8, height: 8 }, // ENLARGED: height 6 → 8
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
            floorType: 'marble', // Main floor: marble
            wallHeight: 8,
            lightingSources: [
                { type: 'chandelier', position: { x: 16, y: 11 }, intensity: 1.2, color: '#FFD700' }, // ENHANCED: intensity 1.0 → 1.2
                { type: 'window', position: { x: 10, y: 8 }, intensity: 0.8, color: '#87CEEB' }, // ENHANCED: 0.6 → 0.8
                { type: 'window', position: { x: 22, y: 8 }, intensity: 0.8, color: '#87CEEB' }, // ENHANCED: 0.6 → 0.8
                { type: 'torch', position: { x: 12, y: 10 }, intensity: 0.7, color: '#FF6347' }, // ENHANCED: 0.5 → 0.7
                { type: 'torch', position: { x: 20, y: 10 }, intensity: 0.7, color: '#FF6347' } // ENHANCED: 0.5 → 0.7
            ],
            furniture: [
                { type: 'throne', position: { x: 16, y: 8 }, scale: 1.8, culturalVariant: 'european' },
                { type: 'rug', position: { x: 16, y: 10 }, scale: 3, culturalVariant: 'european' },
                { type: 'rug', position: { x: 16, y: 14 }, scale: 2, culturalVariant: 'european' },
                { type: 'pillar', position: { x: 12, y: 8 }, scale: 1.8, culturalVariant: 'european' },
                { type: 'pillar', position: { x: 20, y: 8 }, scale: 1.8, culturalVariant: 'european' },
                { type: 'tapestry', position: { x: 8, y: 8 }, scale: 1.5 },
                { type: 'tapestry', position: { x: 24, y: 8 }, scale: 1.5 }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy', 'merchant']
        }
    ]
};

// MIDDLE EASTERN PALACE - Courtyard style
export const MIDDLE_EASTERN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Sultan\'s Palace',
    totalBounds: { width: 28, height: 30 }, // ENLARGED: height 28 → 30
    entrance: { x: 14, y: 27 }, // FIXED: Inside entrance vestibule
    backgroundPattern: 'geometric_palace',
    ambientLighting: { color: '#FFF5E6', intensity: 0.8 }, // ENHANCED: brighter, warmer (0.6 → 0.8)
    spaces: [
        // Entrance Vestibule
        {
            id: 'entrance_vestibule',
            name: 'Entrance',
            type: 'entrance',
            bounds: { x: 11, y: 26, width: 6, height: 4 }, // NEW: Palace entrance
            floorType: 'tile',
            wallHeight: 5,
            lightingSources: [
                { type: 'torch', position: { x: 13, y: 28 }, intensity: 0.5, color: '#FFA500' },
                { type: 'torch', position: { x: 15, y: 28 }, intensity: 0.5, color: '#FFA500' }
            ],
            furniture: [],
            accessibility: 'public'
        },
        // Courtyard reception
        {
            id: 'courtyard',
            name: 'Courtyard',
            type: 'room',
            bounds: { x: 8, y: 12, width: 12, height: 14 }, // ENLARGED: height 12 → 14
            floorType: 'tile',
            wallHeight: 4,
            lightingSources: [
                { type: 'brazier', position: { x: 12, y: 16 }, intensity: 0.9, color: '#FF6347' }, // ENHANCED: 0.6 → 0.9
                { type: 'brazier', position: { x: 16, y: 16 }, intensity: 0.9, color: '#FF6347' }, // ENHANCED: 0.6 → 0.9
                { type: 'brazier', position: { x: 12, y: 20 }, intensity: 0.9, color: '#FF6347' }, // ENHANCED: 0.6 → 0.9
                { type: 'brazier', position: { x: 16, y: 20 }, intensity: 0.9, color: '#FF6347' } // ENHANCED: 0.6 → 0.9
            ],
            furniture: [
                { type: 'rug', position: { x: 14, y: 18 }, scale: 6 }, // ENLARGED: 4 → 6
                { type: 'pillar', position: { x: 10, y: 14 }, scale: 1.8 }, // ENLARGED: added scale 1.8
                { type: 'pillar', position: { x: 18, y: 14 }, scale: 1.8 }, // ENLARGED: added scale 1.8
                { type: 'pillar', position: { x: 10, y: 22 }, scale: 1.8 }, // ENLARGED: added scale 1.8
                { type: 'pillar', position: { x: 18, y: 22 }, scale: 1.8 } // ENLARGED: added scale 1.8
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
                { type: 'chandelier', position: { x: 14, y: 9 }, intensity: 1.1, color: '#FFD700' }, // ENHANCED: 0.8 → 1.1
                { type: 'candle', position: { x: 12, y: 7 }, intensity: 0.6, color: '#FFD700' }, // ENHANCED: 0.4 → 0.6
                { type: 'candle', position: { x: 16, y: 7 }, intensity: 0.6, color: '#FFD700' } // ENHANCED: 0.4 → 0.6
            ],
            furniture: [
                { type: 'throne', position: { x: 14, y: 8 }, scale: 1.8, culturalVariant: 'mena' },
                { type: 'rug', position: { x: 14, y: 9 }, scale: 2.5, culturalVariant: 'mena' },
                { type: 'tapestry', position: { x: 10, y: 7 }, scale: 1.5 },
                { type: 'tapestry', position: { x: 18, y: 7 }, scale: 1.5 }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy']
        }
    ]
};

// ASIAN PALACE - Traditional East Asian layout
export const ASIAN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Imperial Palace',
    totalBounds: { width: 30, height: 22 }, // Keep same
    entrance: { x: 15, y: 17 }, // FIXED: Inside entrance courtyard (y: 14-20)
    backgroundPattern: 'wood_imperial',
    ambientLighting: { color: '#FFF8DC', intensity: 0.85 }, // ENHANCED: intensity 0.65 → 0.85, warmer color
    spaces: [
        // Entrance courtyard
        {
            id: 'entrance_court',
            name: 'Entrance Courtyard',
            type: 'entrance', // Changed to 'entrance' type
            bounds: { x: 10, y: 14, width: 10, height: 8 }, // ENLARGED: height 6 → 8
            floorType: 'wood',
            wallHeight: 4,
            lightingSources: [
                { type: 'torch', position: { x: 12, y: 16 }, intensity: 0.7, color: '#FF6347' }, // ENHANCED: 0.5 → 0.7
                { type: 'torch', position: { x: 18, y: 16 }, intensity: 0.7, color: '#FF6347' } // ENHANCED: 0.5 → 0.7
            ],
            furniture: [
                { type: 'pillar', position: { x: 12, y: 15 }, scale: 1.8 }, // ENLARGED: added scale 1.8
                { type: 'pillar', position: { x: 18, y: 15 }, scale: 1.8 }, // ENLARGED: added scale 1.8
                { type: 'rug', position: { x: 15, y: 17 }, scale: 5 } // ENLARGED: 2 → 5
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
                { type: 'chandelier', position: { x: 15, y: 10 }, intensity: 1.2, color: '#FFD700' }, // ENHANCED: 1.0 → 1.2
                { type: 'candle', position: { x: 10, y: 8 }, intensity: 0.6, color: '#FFD700' }, // ENHANCED: 0.4 → 0.6
                { type: 'candle', position: { x: 20, y: 8 }, intensity: 0.6, color: '#FFD700' } // ENHANCED: 0.4 → 0.6
            ],
            furniture: [
                { type: 'throne', position: { x: 15, y: 8 }, scale: 1.8, culturalVariant: 'east_asian' },
                { type: 'pillar', position: { x: 9, y: 9 }, scale: 1.8, culturalVariant: 'east_asian' },
                { type: 'pillar', position: { x: 21, y: 9 }, scale: 1.8, culturalVariant: 'east_asian' },
                { type: 'tapestry', position: { x: 7, y: 7 }, scale: 1.5 },
                { type: 'tapestry', position: { x: 23, y: 7 }, scale: 1.5 },
                { type: 'rug', position: { x: 15, y: 10 }, scale: 3, culturalVariant: 'east_asian' },
                { type: 'rug', position: { x: 15, y: 13 }, scale: 2, culturalVariant: 'east_asian' }
            ],
            accessibility: 'restricted',
            requiredClass: ['nobility', 'clergy']
        }
    ]
};

// AFRICAN PALACE - Great hall with traditional elements
export const AFRICAN_PALACE_LAYOUT: BuildingLayout = {
    name: 'Royal Compound',
    totalBounds: { width: 26, height: 20 }, // Keep same
    entrance: { x: 13, y: 14 }, // FIXED: Inside great hall (y: 10-18)
    backgroundPattern: 'earth_palace',
    ambientLighting: { color: '#FFF0DC', intensity: 0.85 }, // ENHANCED: intensity 0.7 → 0.85, warmer color
    spaces: [
        // Great hall
        {
            id: 'great_hall',
            name: 'Great Hall',
            type: 'entrance', // Changed to 'entrance' type - great hall IS the entrance
            bounds: { x: 6, y: 10, width: 14, height: 10 }, // ENLARGED: height 8 → 10
            floorType: 'stone',
            wallHeight: 5,
            lightingSources: [
                { type: 'brazier', position: { x: 10, y: 12 }, intensity: 0.9, color: '#FF6347' }, // ENHANCED: 0.7 → 0.9
                { type: 'brazier', position: { x: 16, y: 12 }, intensity: 0.9, color: '#FF6347' }, // ENHANCED: 0.7 → 0.9
                { type: 'torch', position: { x: 8, y: 14 }, intensity: 0.7, color: '#FF6347' }, // ENHANCED: 0.5 → 0.7
                { type: 'torch', position: { x: 18, y: 14 }, intensity: 0.7, color: '#FF6347' } // ENHANCED: 0.5 → 0.7
            ],
            furniture: [
                { type: 'throne', position: { x: 13, y: 12 }, scale: 1.8, culturalVariant: 'african' },
                { type: 'rug', position: { x: 13, y: 14 }, scale: 3, culturalVariant: 'african' },
                { type: 'rug', position: { x: 13, y: 17 }, scale: 2, culturalVariant: 'african' },
                { type: 'pillar', position: { x: 9, y: 13 }, scale: 1.8 },
                { type: 'pillar', position: { x: 17, y: 13 }, scale: 1.8 }
            ],
            accessibility: 'public'
        },
        // Royal chamber
        {
            id: 'royal_chamber',
            name: 'Royal Chamber',
            type: 'room',
            bounds: { x: 9, y: 4, width: 8, height: 6 }, // ENLARGED: height 5 → 6, shifted up
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
    'government_district': GOVERNMENT_FORUM_LAYOUT,
    'fortress': FORTRESS_LAYOUT
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
    
    // Handle fortress buildings
    if (buildingType === 'fortress') {
        console.log('🏰 Selected: FORTRESS_LAYOUT');
        return FORTRESS_LAYOUT;
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
        
        // TEMPORARILY DISABLED - procedural holy place layouts have NaN bugs
        // TODO: Fix holyPlaceInteriorIntegration.ts to generate valid connected layouts
        // if (culturalZone && era) {
        //     const culturalLayout = getHolyPlaceBuildingLayout(
        //         culturalZone as CulturalZone,
        //         era,
        //         religion
        //     );
        //
        //     if (culturalLayout) {
        //         console.log('✨ Using culturally-specific holy place layout:', culturalLayout.name);
        //         return culturalLayout;
        //     }
        // }
        
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

        // Hindu/Hinduism
        if (lowerReligion.includes('hindu')) {
            console.log('🕉️ Selected: HINDU_TEMPLE_LAYOUT (religion fallback)');
            return HINDU_TEMPLE_LAYOUT;
        }

        // Traditional/Indigenous religions - use cultural zone to determine appropriate layout
        if (lowerReligion.includes('traditional') || lowerReligion.includes('indigenous') || lowerReligion.includes('native')) {
            console.log('🌍 [ArchitecturalLayouts] Traditional religion detected, using cultural zone for layout');
            // Fall through to cultural zone logic below
        } else {
            console.log('❓ [ArchitecturalLayouts] No specific religion matched, using cultural zone fallback');
        }

        // Smart cultural zone fallbacks when no religion matched
        const lowerZone = (culturalZone || '').toLowerCase();

        if (lowerZone.includes('mena') || lowerZone.includes('middle')) {
            console.log('🕌 Selected: MOSQUE_LAYOUT (cultural zone fallback)');
            return MOSQUE_LAYOUT;
        }
        if (lowerZone.includes('east_asia') || lowerZone.includes('asia')) {
            console.log('🏯 Selected: BUDDHIST_TEMPLE_LAYOUT (cultural zone fallback)');
            return BUDDHIST_TEMPLE_LAYOUT;
        }
        if (lowerZone.includes('south_asia')) {
            console.log('🕉️ Selected: HINDU_TEMPLE_LAYOUT (cultural zone fallback)');
            return HINDU_TEMPLE_LAYOUT;
        }
        if (lowerZone.includes('african') || lowerZone.includes('africa')) {
            // African traditional shrines - use mosque for Islamic regions, simple temple otherwise
            if (era && era !== 'PREHISTORY' && era !== 'ANTIQUITY') {
                console.log('🕌 Selected: MOSQUE_LAYOUT (African Islamic fallback)');
                return MOSQUE_LAYOUT;
            }
            console.log('🏛️ Selected: BUDDHIST_TEMPLE_LAYOUT (African traditional fallback)');
            return BUDDHIST_TEMPLE_LAYOUT; // Generic sacred space
        }
    }

    // Final fallback - default to Christianity only for unspecified/European zones
    console.log('⛪ Selected: CHURCH_LAYOUT (final fallback)');
    return CHURCH_LAYOUT;
}