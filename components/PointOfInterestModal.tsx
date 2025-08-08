/**
 * components/PointOfInterestModal.tsx - A specialized modal for unique structures.
 */
import React, { useMemo } from 'react';
import { TerrainStructure, MapData, HistoricalEra, CulturalZone, NpcEntity, GameDate } from '../types';
import { SOCIETAL_PROFILES, ITEM_DEFINITIONS, FACTION_DATA } from '../constants/index';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { useMap } from '../contexts/MapContext';
import { generatePoiDescription } from '../services/poiDescriptionGenerator';
import POISymbol from './POISymbol';
import { ProceduralPortrait } from './portraits';

interface PointOfInterestModalProps {
  structure: TerrainStructure;
  mapData: MapData;
  onClose: () => void;
}

const PointOfInterestModal: React.FC<PointOfInterestModalProps> = ({ structure, mapData, onClose }) => {
    const { npcs } = useMap();
    const { name, structureType, state, allegianceGroup, inputGoods, outputGoods, treasury } = structure;

    const gameDate = useMemo(() => {
        const year = parseInt(mapData.timeSlice || '1650', 10);
        return { year, month: 1, day: 1 } as GameDate;
    }, [mapData.timeSlice]);

    const description = useMemo(() => {
        return generatePoiDescription(structure, gameDate, mapData);
    }, [structure, gameDate, mapData]);
    
    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [mapData.timeSlice, mapData.continent]);
    
    const societalProfile = useMemo(() => {
        return SOCIETAL_PROFILES[culturalZone]?.[era] || SOCIETAL_PROFILES.DEFAULT;
    }, [culturalZone, era]);

    const factionData = useMemo(() => {
        return FACTION_DATA[culturalZone]?.[mapData.region || '']?.[era];
    }, [culturalZone, mapData.region, era]);

    const anchoredNpcs = useMemo(() => {
        const figures = npcs.filter(npc => npc.workplaceId === structure.id);
        // Get court roles from faction data, not societal profile
        const roleOrder = factionData?.courtRoles?.[structure.structureType] || [];
        
        if (roleOrder.length > 0) {
            figures.sort((a, b) => {
                const indexA = roleOrder.indexOf(a.role);
                const indexB = roleOrder.indexOf(b.role);
                // If a role is not in the list, it's considered lower rank
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }
        
        return figures;
    }, [npcs, structure.id, structure.structureType, factionData]);

    const consumedGoods = structureType === 'holy_site' ? societalProfile.holyPlaceConsumes : inputGoods;
    const producedGoods = structureType === 'holy_site' ? societalProfile.holyPlaceProduces : outputGoods;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="ff-panel w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <header className="flex items-center gap-4 mb-4 pb-4 border-b border-blue-500/30">
                        <div className="w-16 h-16 flex-shrink-0">
                            <POISymbol structure={structure} size={64} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-press-start" style={{ color: 'var(--ff-header-text)' }}>{name}</h3>
                            <p className="text-sm text-slate-300 capitalize">{structureType.replace(/_/g, ' ')}</p>
                        </div>
                    </header>

                    <main className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                        <p className="italic text-slate-300 leading-relaxed">{description}</p>
                        
                        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <DetailRow label="State" value={state} />
                            <DetailRow label="Allegiance" value={allegianceGroup || 'Unaligned'} />
                        </div>
                        
                        {structureType === 'holy_site' && (
                             <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                 <h4 className="font-semibold text-amber-300 mb-2">Offerings & Blessings</h4>
                                 <DetailRow label="Consumes" value={consumedGoods?.map(g => g.replace(/_/g, ' ')).join(', ') || 'Prayers'} />
                                 <DetailRow label="Produces" value={producedGoods?.map(g => g.replace(/_/g, ' ')).join(', ') || 'Faith'} />
                             </div>
                        )}

                        {treasury && Object.keys(treasury).length > 0 && (
                            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                <h4 className="font-semibold text-amber-300 mb-2">Treasury</h4>
                                {Object.entries(treasury).map(([itemId, quantity]) => (
                                    <DetailRow key={itemId} label={ITEM_DEFINITIONS[itemId]?.name || itemId} value={quantity.toLocaleString()} />
                                ))}
                            </div>
                        )}
                        
                        {anchoredNpcs.length > 0 && (
                             <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                 <h4 className="font-semibold text-cyan-400 mb-2">Key Figures</h4>
                                 <div className="space-y-2">
                                     {anchoredNpcs.map(npc => (
                                         <div key={npc.id} className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 shrink-0 bg-slate-700">
                                                <ProceduralPortrait character={npc} size={40} />
                                             </div>
                                             <div>
                                                 <p className="font-semibold text-white">{npc.name}</p>
                                                 <p className="text-xs text-slate-400">{npc.role}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        )}

                        {/* Placeholder for future Quest System */}
                        <div className="pt-4">
                            <h4 className="font-semibold text-lg text-blue-300 mb-3">Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="ff-action-button">Seek Audience</button>
                                <button className="ff-action-button">Offer Tribute</button>
                                <button className="ff-action-button">Investigate</button>
                                <button className="ff-action-button">Listen for Rumors</button>
                            </div>
                            <p className="text-xs text-center text-slate-500 mt-3 italic">(More actions will be available through the quest system.)</p>
                        </div>
                    </main>

                    <footer className="mt-6 flex justify-end">
                        <button onClick={onClose} className="ff-action-button">Leave</button>
                    </footer>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-slate-400">{label}:</span> 
        <span className="font-semibold text-white capitalize text-right">{value}</span>
    </div>
);


export default PointOfInterestModal;
