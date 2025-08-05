import React, { useMemo, useState } from 'react';
import { GameDate, CulturalZone, HistoricalEra, MapData, NpcEntity, PrimarySource } from '../types';
import { HISTORY_GUIDE_DATA, PRIMARY_SOURCES_DATA, PROFESSIONS, ProfessionDefinition } from '../constants/index';
import WikipediaArticle from './WikipediaArticle';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface HistoryPanelProps {
    gameDate: GameDate;
    currentZone: string;
    currentRegion: string;
    localArea: string;
    useLlmForDescriptions: boolean;
    mapData: MapData | null;
    npcs: NpcEntity[];
}

type HistorySubTab = 'wikipedia' | 'primary_sources';

const PrimarySourceDisplay: React.FC<{ sources: PrimarySource[] }> = ({ sources }) => {
    if (sources.length === 0) {
        return (
            <div className="p-4 text-slate-400 italic text-sm">
                No primary sources found for the current context.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {sources.map((source, index) => (
                <div key={index} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <h4 className="font-semibold text-amber-400">{source.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{source.author}, c. {source.year}</p>
                    <blockquote className="border-l-2 border-amber-500/50 pl-3 text-sm italic text-slate-300">
                        "{source.excerpt}"
                    </blockquote>
                </div>
            ))}
        </div>
    );
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({
    gameDate,
    currentZone,
    currentRegion,
    localArea,
    useLlmForDescriptions,
    mapData,
    npcs
}) => {
    const [activeSubTab, setActiveSubTab] = useState<HistorySubTab>('wikipedia');

    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(String(gameDate.year));
        const culture = mapLocationToCulture(currentZone, dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [gameDate.year, currentZone]);

    const historicalSummary = useMemo(() => {
        return HISTORY_GUIDE_DATA[culturalZone]?.[era] || "No specific historical context is available for this time and place. The world is yours to discover.";
    }, [culturalZone, era]);

    const relevantPrimarySources = useMemo(() => {
        const sources: PrimarySource[] = [];
        const seenSources = new Set<string>();

        const addSource = (source: PrimarySource) => {
            const key = `${source.title}-${source.author}`;
            if (!seenSources.has(key)) {
                sources.push(source);
                seenSources.add(key);
            }
        };

        // 1. By Context (Era/Zone)
        const contextSources = PRIMARY_SOURCES_DATA.byContext?.[culturalZone]?.[era];
        if (contextSources) {
            contextSources.forEach(addSource);
        }
        
        if (!mapData) return sources;

        // 2. By Religion
        const dominantReligions = new Set<string>();
        mapData.tiles.flat().forEach(tile => {
            tile.dominantReligions?.forEach(r => dominantReligions.add(r.name));
        });
        dominantReligions.forEach(religion => {
            const religionSources = PRIMARY_SOURCES_DATA.byReligion?.[religion];
            if (religionSources) {
                religionSources.forEach(addSource);
            }
        });
        
        // 3. By Keyword (from nearby NPCs)
        const eraProfessions = PROFESSIONS[culturalZone]?.[era];
        if (eraProfessions) {
            const keywords = new Set<string>();
            npcs.forEach(npc => {
                const roleDef: ProfessionDefinition | undefined = eraProfessions[npc.class]?.[npc.role];
                if (roleDef?.keywords) {
                    roleDef.keywords.split(',').map(k => k.trim()).forEach(k => keywords.add(k));
                }
            });
            keywords.forEach(keyword => {
                const keywordSources = PRIMARY_SOURCES_DATA.byKeyword?.[keyword];
                if (keywordSources) {
                    keywordSources.forEach(addSource);
                }
            });
        }
        
        return sources;
    }, [culturalZone, era, mapData, npcs]);

    return (
        <div className="flex flex-col h-full bg-slate-900/30 rounded-lg border border-slate-700/50">
            <div className="p-4 shrink-0">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">Historical Context</h3>
                <p className="text-sm italic text-slate-400">{historicalSummary}</p>
            </div>
            
            <div className="flex bg-slate-800/60 border-y border-slate-700/50 shrink-0">
                {(['wikipedia', 'primary_sources'] as HistorySubTab[]).map(tab => (
                     <button
                        key={tab}
                        className={`flex-1 py-2 px-1 text-center text-xs font-semibold transition-colors duration-200 border-b-2 ${activeSubTab === tab ? 'text-white border-amber-400' : 'text-slate-300 border-transparent hover:bg-slate-700/50 hover:text-white'}`}
                        onClick={() => setActiveSubTab(tab)}
                        aria-selected={activeSubTab === tab}
                     >
                         {tab === 'wikipedia' ? 'Wikipedia' : 'Primary Sources'}
                     </button>
                ))}
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-thin">
                {activeSubTab === 'wikipedia' && (
                    <WikipediaArticle
                        gameDate={gameDate}
                        currentRegion={currentRegion}
                        localArea={localArea}
                        useLlm={useLlmForDescriptions}
                    />
                )}
                {activeSubTab === 'primary_sources' && (
                     <PrimarySourceDisplay sources={relevantPrimarySources} />
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;