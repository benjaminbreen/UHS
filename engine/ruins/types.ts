import { PrimarySourceMetadata } from '../../services/primarySourceService';
import { ContainerContents } from '../../services/specialMapContainerService';
import { OverlayObjectType } from '../../types/core/tile';

export type TileType =
    'wall' |
    'floor' |
    'door' |
    'treasure' |
    'trap' |
    'stairs_down' |
    'stairs_up' |
    'entrance' |
    'altar' |
    'statue' |
    'rubble' |
    'water' |
    'chasm' |
    'pillar' |
    'manuscript' |
    'inscription' |
    'mural' |
    'torch' |
    'boulder' |
    'weak_wall' |
    'locked_door' |
    'debris' |
    'discovery' |
    'chest' |
    'food';

export interface DungeonTile {
    type: TileType;
    visible: boolean;
    explored: boolean;
    hasGold?: number;
    hasItem?: any;
    hasManuscript?: PrimarySourceMetadata;
    hasTrap?: boolean;
    trapTriggered?: boolean;
    description?: string;
    inscription?: string;
    muralDescription?: string;
    lightSource?: boolean;
    lightRadius?: number;
    lightLevel?: number;
    hasFood?: string;
    hasTorch?: boolean;
    discoveryId?: string;
    hasBeenDiscovered?: boolean;
    discoveryText?: string;
    containerContents?: ContainerContents;
    containerType?: OverlayObjectType;
    chestOpened?: boolean;
    pushable?: boolean;
    breakable?: boolean;
    durability?: number;
    pushDirection?: 'north' | 'south' | 'east' | 'west' | null;
    isUnstable?: boolean;
    excavatable?: boolean;
    hasKey?: boolean;
}

export interface DungeonPlayer {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    gold: number;
    level: number;
    inventory: any[];
    manuscripts: PrimarySourceMetadata[];
    hasTorch?: boolean;
    torchTurns?: number;
    experience?: number;
    nextLevelExp?: number;
    hunger?: number;
    maxHunger?: number;
    attack?: number;
    defense?: number;
    accuracy?: number;
    evasion?: number;
    weapon?: any;
    armor?: any;
    defending?: boolean;
}

export interface Entity {
    id: string;
    x: number;
    y: number;
    type: string;
    subtype: string;
    name: string;
    hp: number;
    maxHp: number;
    hostile: boolean;
    dialogue?: string[];
    loot?: any[];
    description: string;
    symbol: string;
    emoji?: string;
    color: string;
    attack?: number;
    defense?: number;
    accuracy?: number;
    evasion?: number;
    level?: number;
    canNegotiate?: boolean;
    moveCooldown?: number;
    moveSpeed?: number;
    aiState?: 'idle' | 'pursuing' | 'attacking' | 'fleeing' | 'stunned';
    lastMove?: number;
    lastAttack?: number;
    behavior?: 'aggressive' | 'defensive' | 'erratic' | 'ambush' | 'ranged';
    rangedAttack?: {
        range: number;
        projectileType: 'web' | 'poison' | 'rock' | 'spine';
        projectileSymbol: string;
        projectileColor: string;
    };
}
