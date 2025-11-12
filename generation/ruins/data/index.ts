import { CulturalZone, HistoricalEra } from '../../../types';

export type WritingMedium =
    | 'textile'
    | 'stone'
    | 'metal'
    | 'parchment'
    | 'papyrus'
    | 'clay'
    | 'oral'
    | 'wood'
    | 'digital';

export interface RuinScriptMetadata {
    id: string;
    displayName: string;
    writingMedium: WritingMedium;
    culturalZones: CulturalZone[];
    eras: HistoricalEra[];
    notes?: string;
    fallbackLanguageId?: string;
}

export interface PrimarySourceRef {
    shard: string;
    sourceId: string;
    usage: 'discovery' | 'encounter' | 'translation';
}

export type EducationalFocus =
    | 'ritual'
    | 'governance'
    | 'economy'
    | 'daily_life'
    | 'technology'
    | 'military'
    | 'art'
    | 'environment';

export interface ArtifactTemplate {
    id: string;
    label: string;
    description: string;
    structureTypes: string[];
    rooms: string[];
    culturalZones: CulturalZone[];
    eras: HistoricalEra[];
    educationalFocus: EducationalFocus;
    primarySourceRefs?: PrimarySourceRef[];
}

export interface DiscoveryTemplate {
    id: string;
    room: string;
    structureTypes: string[];
    culturalZones: CulturalZone[];
    eras: HistoricalEra[];
    scriptedElements: string[];
    recommendedArtifacts: string[];
    knowledgeTags: string[];
}

export interface ExpeditionCard {
    id: string;
    name: string;
    description: string;
    effectType:
        | 'reveal_room'
        | 'reduce_hazard'
        | 'boost_translation'
        | 'increase_loot'
        | 'knowledge_bonus'
        | 'combat_advantage';
    culturalZones?: CulturalZone[];
    eras?: HistoricalEra[];
    unlockCondition?: string;
}

export interface RuinSupplementalData {
    scripts: RuinScriptMetadata[];
    artifacts: ArtifactTemplate[];
    discoveries: DiscoveryTemplate[];
    expeditionCards: ExpeditionCard[];
}
