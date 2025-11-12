import { CulturalZone, HistoricalEra } from '../types';
import { ruinsDataBridge } from './ruinsDataBridge';
import type { ArtifactTemplate, DiscoveryTemplate, PrimarySourceRef, RuinScriptMetadata } from '../generation/ruins/data';
import { ruinsMetricsService } from './ruinsMetricsService';
import type { PrimarySourceMetadata } from './primarySourceService';

export interface DiscoveryRequestContext {
    ruinId: string;
    discoveryTemplate: DiscoveryTemplate;
    year: number;
    culturalZone: CulturalZone;
    era: HistoricalEra;
    structureType: string;
    room: string;
    depth: number;
    mapLocation?: string;
}

export interface DiscoveryNarrative {
    title: string;
    description: string;
    followUpQuestion: string;
    citations: string[];
    isFallback: boolean;
}

const cache = new Map<string, DiscoveryNarrative>();

const storageKeyFor = (key: string) => `ruins_discovery_${key}`;

const loadFromStorage = (key: string): DiscoveryNarrative | undefined => {
    if (typeof localStorage === 'undefined') return undefined;
    try {
        const raw = localStorage.getItem(storageKeyFor(key));
        if (!raw) return undefined;
        return JSON.parse(raw) as DiscoveryNarrative;
    } catch {
        return undefined;
    }
};

const saveToStorage = (key: string, narrative: DiscoveryNarrative) => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(storageKeyFor(key), JSON.stringify(narrative));
    } catch (error) {
        console.warn('[ruinsContentBroker] Unable to persist discovery narrative', error);
    }
};

function buildCacheKey(context: DiscoveryRequestContext): string {
    return [
        context.ruinId,
        context.discoveryTemplate.id,
        context.year,
        context.culturalZone,
        context.era,
        context.depth
    ].join('|');
}

const culturalZoneLabels: Partial<Record<CulturalZone, string>> = {
    EUROPEAN: 'Europe',
    EAST_ASIAN: 'East Asia',
    MENA: 'Middle East & North Africa',
    SOUTH_ASIAN: 'South Asia',
    SOUTH_AMERICAN: 'South America',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'North America (pre-Columbian)',
    NORTH_AMERICAN_COLONIAL: 'North America (Colonial)',
    SUB_SAHARAN_AFRICAN: 'Sub-Saharan Africa',
    OCEANIA: 'Oceania',
    MESOAMERICAN: 'Mesoamerica',
    SOUTHEAST_ASIAN: 'Southeast Asia'
};

const toTitleCase = (value: string): string =>
    value
        .split(/[\s_]+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

const formatEra = (era: HistoricalEra): string => {
    const base = toTitleCase(era.replace(/_/g, ' '));
    return base.replace('Renaissance Early Modern', 'Renaissance & Early Modern');
};

const formatYear = (year?: number): string | undefined => {
    if (typeof year !== 'number' || Number.isNaN(year)) return undefined;
    if (year === 0) return '1 CE';
    if (year < 0) return `${Math.abs(Math.floor(year))} BCE`;
    return `${Math.floor(year)} CE`;
};

const formatList = (items: string[]): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const sentenceCase = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

const formatKnowledgeTag = (tag: string): string => toTitleCase(tag.replace(/_/g, ' '));

const formatMedium = (medium: string): string => toTitleCase(medium.replace(/_/g, ' '));

function composeCuratedNarrative({
    context,
    template,
    scripts,
    artifacts,
    primarySources
}: {
    context: DiscoveryRequestContext;
    template: DiscoveryTemplate;
    scripts: RuinScriptMetadata[];
    artifacts: ArtifactTemplate[];
    primarySources: PrimarySourceMetadata[];
}): DiscoveryNarrative {
    const structureLabel = toTitleCase(context.structureType.replace(/_/g, ' '));
    const roomLabel = toTitleCase(template.room || context.room);
    const depthLabel = context.depth > 1 ? `Depth ${context.depth}` : 'Surface level';
    const eraLabel = formatEra(context.era);
    const yearLabel = formatYear(context.year);
    const cultureLabel =
        culturalZoneLabels[context.culturalZone] ?? toTitleCase(context.culturalZone.replace(/_/g, ' '));

    const scriptNames = scripts.slice(0, 2).map(script => script.displayName);
    const scriptMediums = Array.from(new Set(scripts.slice(0, 2).map(script => script.writingMedium)));
    const scriptLine =
        scriptNames.length > 0
            ? `Record medium: ${formatList(scriptNames)}${
                  scriptMediums.length > 0 ? ` (${formatList(scriptMediums.map(formatMedium))})` : ''
              }.`
            : 'Record medium: Local inscription methods (cataloguing in progress).';

    const scriptNotes = scripts
        .map(script => script.notes)
        .filter((note): note is string => Boolean(note))
        .slice(0, 2);

    const observationLines =
        template.scriptedElements.length > 0
            ? `Field observations:\n${template.scriptedElements.map(el => `- ${sentenceCase(el)}`).join('\n')}`
            : '';

    const artifactLines =
        artifacts.length > 0
            ? `Catalogued finds:\n${artifacts
                  .map(artifact => `- ${artifact.label}: ${sentenceCase(artifact.description)}`)
                  .join('\n')}`
            : '';

    const knowledgeLine =
        template.knowledgeTags.length > 0
            ? `Knowledge focus: ${formatList(template.knowledgeTags.map(formatKnowledgeTag))}.`
            : '';

    const citations = primarySources.map(source => {
        const sourceYear = formatYear(source.year);
        const author = source.author ? `, ${source.author}` : '';
        return `${source.title}${sourceYear ? ` (${sourceYear}${author})` : author ? ` (${author.trim()})` : ''}`;
    });

    const descriptionParts = [
        `${structureLabel} • ${roomLabel} • ${depthLabel}`,
        `${eraLabel}${yearLabel ? ` — c. ${yearLabel}` : ''} • ${cultureLabel}${
            context.mapLocation ? ` (${context.mapLocation})` : ''
        }`,
        scriptLine,
        scriptNotes.length > 0 ? `Medium notes: ${formatList(scriptNotes.map(sentenceCase))}` : '',
        observationLines,
        artifactLines,
        knowledgeLine
    ].filter(Boolean);

    const followUpQuestion =
        template.knowledgeTags.length > 0
            ? `How might these findings refine our understanding of ${formatList(
                  template.knowledgeTags.map(formatKnowledgeTag).map(value => value.toLowerCase())
              )} in ${cultureLabel}?`
            : 'What additional evidence would help interpret this space more completely?';

    return {
        title: `Discovery • ${roomLabel}`,
        description: descriptionParts.join('\n\n'),
        followUpQuestion,
        citations,
        isFallback: true
    };
}

export async function requestDiscoveryNarrative(context: DiscoveryRequestContext): Promise<DiscoveryNarrative> {
    const cacheKey = buildCacheKey(context);

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    const stored = loadFromStorage(cacheKey);
    if (stored) {
        cache.set(cacheKey, stored);
        return stored;
    }

    const { discoveryTemplate } = context;
    const matchedArtifacts = ruinsDataBridge
        .getArtifacts({
            culturalZone: context.culturalZone,
            era: context.era,
            structureType: context.structureType,
            room: context.room
        })
        .filter(artifact => discoveryTemplate.recommendedArtifacts.includes(artifact.id));

    const primaryRefs = matchedArtifacts.flatMap(artifact => artifact.primarySourceRefs ?? []);

    let narrative: DiscoveryNarrative;

    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
        const scripts = ruinsDataBridge.getScripts({
            culturalZone: context.culturalZone,
            era: context.era
        });

        const uniqueRefs: PrimarySourceRef[] = [];
        const seen = new Set<string>();
        for (const ref of primaryRefs) {
            const key = `${ref.shard}:${ref.sourceId}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRefs.push(ref);
            }
        }

        const resolvedSources = await Promise.all(
            uniqueRefs.map(ref => ruinsDataBridge.resolvePrimarySource(ref))
        );
        const primarySources = resolvedSources.filter((value): value is PrimarySourceMetadata => Boolean(value));

        narrative = composeCuratedNarrative({
            context,
            template: discoveryTemplate,
            scripts,
            artifacts: matchedArtifacts,
            primarySources
        });

        const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
        ruinsMetricsService.record('ruins.llm.request', {
            templateId: discoveryTemplate.id,
            status: 'curated',
            latencyMs: Math.round((end as number) - (start as number)),
            ruinId: context.ruinId,
            room: context.room
        });
    } catch (error) {
        console.error('[ruinsContentBroker] Failed to assemble curated narrative', error);
        narrative = {
            title: `Discovery • ${toTitleCase(context.room)}`,
            description: 'Field notes are pending due to a cataloguing error. Record observations manually.',
            followUpQuestion: 'What additional documentation is required to verify this discovery?',
            citations: [],
            isFallback: true
        };
        const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
        ruinsMetricsService.record('ruins.llm.request', {
            templateId: discoveryTemplate.id,
            status: 'error',
            latencyMs: Math.round((end as number) - (start as number)),
            ruinId: context.ruinId,
            room: context.room,
            error: (error as Error).message
        });
    }

    cache.set(cacheKey, narrative);
    saveToStorage(cacheKey, narrative);
    return narrative;
}
