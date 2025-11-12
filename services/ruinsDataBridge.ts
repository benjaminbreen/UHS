import scripts from '../generation/ruins/data/scripts.json';
import artifacts from '../generation/ruins/data/artifactTemplates.json';
import discoveries from '../generation/ruins/data/discoveryTemplates.json';
import expeditionCards from '../generation/ruins/data/expeditionCards.json';

import { ArtifactTemplate, DiscoveryTemplate, ExpeditionCard, PrimarySourceRef, RuinScriptMetadata, RuinSupplementalData } from '../generation/ruins/data';
import { CulturalZone, HistoricalEra } from '../types';
import type { PrimarySourceMetadata } from './primarySourceService';

type FilterContext = {
    culturalZone?: CulturalZone;
    era?: HistoricalEra;
    structureType?: string;
    room?: string;
};

const supplementalData: RuinSupplementalData = {
    scripts: scripts as RuinScriptMetadata[],
    artifacts: artifacts as ArtifactTemplate[],
    discoveries: discoveries as DiscoveryTemplate[],
    expeditionCards: expeditionCards as ExpeditionCard[]
};

const matchesContext = <T extends { culturalZones?: CulturalZone[]; eras?: HistoricalEra[] }>(
    item: T,
    context: FilterContext
) => {
    const { culturalZone, era } = context;
    const zoneMatches = culturalZone
        ? !item.culturalZones || item.culturalZones.includes(culturalZone)
        : true;
    const eraMatches = era ? !item.eras || item.eras.includes(era) : true;
    return zoneMatches && eraMatches;
};

class RuinsDataBridge {
    private shardCache = new Map<string, PrimarySourceMetadata[]>();

    getAllSupplementalData(): RuinSupplementalData {
        return supplementalData;
    }

    getScripts(context: FilterContext = {}): RuinScriptMetadata[] {
        return supplementalData.scripts.filter(metadata => matchesContext(metadata, context));
    }

    getArtifacts(context: FilterContext = {}): ArtifactTemplate[] {
        return supplementalData.artifacts.filter(template => {
            if (!matchesContext(template, context)) return false;
            if (context.structureType && !template.structureTypes.includes(context.structureType)) {
                return false;
            }
            if (context.room && !template.rooms.includes(context.room)) {
                return false;
            }
            return true;
        });
    }

    getDiscoveryTemplates(context: FilterContext = {}): DiscoveryTemplate[] {
        return supplementalData.discoveries.filter(template => {
            if (!matchesContext(template, context)) return false;
            if (context.structureType && !template.structureTypes.includes(context.structureType)) {
                return false;
            }
            if (context.room && template.room !== context.room) {
                return false;
            }
            return true;
        });
    }

    getExpeditionCards(context: FilterContext = {}): ExpeditionCard[] {
        return supplementalData.expeditionCards.filter(card => matchesContext(card, context));
    }

    async resolvePrimarySource(ref: PrimarySourceRef): Promise<PrimarySourceMetadata | undefined> {
        const sources = await this.loadShard(ref.shard);
        return sources.find(source => source.id === ref.sourceId);
    }

    private async loadShard(shard: string): Promise<PrimarySourceMetadata[]> {
        if (this.shardCache.has(shard)) {
            return this.shardCache.get(shard)!;
        }

        try {
            const response = await fetch(`/sources/metadata/${shard}.json`);
            if (!response.ok) {
                console.warn(`[ruinsDataBridge] Failed to load shard ${shard}`, response.status);
                this.shardCache.set(shard, []);
                return [];
            }
            const data = await response.json();
            const sources = (data.sources || []) as PrimarySourceMetadata[];
            this.shardCache.set(shard, sources);
            return sources;
        } catch (error) {
            console.error(`[ruinsDataBridge] Error loading shard ${shard}`, error);
            this.shardCache.set(shard, []);
            return [];
        }
    }
}

export const ruinsDataBridge = new RuinsDataBridge();
