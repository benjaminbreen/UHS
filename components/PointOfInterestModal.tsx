/**
 * components/PointOfInterestModal.tsx - A specialized modal for unique structures.
 * Redesigned for cohesive aesthetic and proper light/dark mode support
 */
import React, { useMemo, useCallback } from 'react';
import { TerrainStructure, MapData, HistoricalEra, CulturalZone, NpcEntity, GameDate, SpecialMapConfig } from '../types';
import { SOCIETAL_PROFILES, ITEM_DEFINITIONS, FACTION_DATA } from '../constants/index';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { useMap } from '../contexts/MapContext';
import { generatePoiDescription } from '../services/poiDescriptionGenerator';
import POISymbol from './POISymbol';
import { LazyPortrait } from './portraits';
import HolySiteInteractions from './HolySiteInteractions';
import { getReligiousEconomy, generateHolySiteTreasury, calculateHolySiteWealth } from '../constants/gameData/religiousEconomy';
import { getClergyRoles } from '../constants/characterData/religionClergyRoles';
import { getReligionDisplay, detectReligion } from '../constants/gameData/religionIcons';
import { getHistoricalEra } from '../constants/gameData/historicalContext';
import TimeAwareBackground from './TimeAwareBackground';
import { isSafari } from '../utils/browserUtils';

interface PointOfInterestModalProps {
  structure: TerrainStructure;
  mapData: MapData;
  onClose: () => void;
  onEnterSpecialMap?: (config: SpecialMapConfig) => void;
}

const getItemDefinition = (itemId: string) => {
    return ITEM_DEFINITIONS.find(item => item.id === itemId);
};

const PointOfInterestModal: React.FC<PointOfInterestModalProps> = ({ structure, mapData, onClose, onEnterSpecialMap }) => {
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

        // For holy sites, sort by clergy role hierarchy
        if (structure.structureType === 'holy_site') {
            const religion = (structure as any).religion || 'default';
            const clergyRoles = getClergyRoles(religion);

            figures.sort((a, b) => {
                const indexA = clergyRoles.indexOf(a.role);
                const indexB = clergyRoles.indexOf(b.role);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        } else {
            const roleOrder = factionData?.courtRoles?.[structure.structureType] || [];

            if (roleOrder.length > 0) {
                figures.sort((a, b) => {
                    const indexA = roleOrder.indexOf(a.role);
                    const indexB = roleOrder.indexOf(b.role);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
        }

        return figures;
    }, [npcs, structure.id, structure.structureType, factionData]);

    // Get economic goods for holy sites
    const holySiteEconomy = useMemo(() => {
        if (structureType === 'holy_site') {
            const religion = (structure as any).religion || structure.name || 'default';
            return getReligiousEconomy(religion, era);
        }
        return null;
    }, [structureType, structure, era]);

    // Calculate wealth level for holy sites
    const holySiteWealth = useMemo(() => {
        if (structureType === 'holy_site' && mapData) {
            const urbanizationLevel = 0.3;
            return calculateHolySiteWealth(urbanizationLevel, era, culturalZone);
        }
        return 5;
    }, [structureType, mapData, era, culturalZone]);

    // Generate treasury for holy sites
    const holySiteTreasury = useMemo(() => {
        if (structureType === 'holy_site') {
            const religion = (structure as any).religion || structure.name || 'default';
            return generateHolySiteTreasury(religion, era, holySiteWealth);
        }
        return treasury;
    }, [structureType, structure, era, holySiteWealth, treasury]);

    const consumedGoods = structureType === 'holy_site' ? holySiteEconomy?.consumes : inputGoods;
    const producedGoods = structureType === 'holy_site' ? holySiteEconomy?.produces : outputGoods;

    // Get religion information for holy sites
    const religion = useMemo(() => {
        if (structureType === 'holy_site') {
            let detectedReligion = (structure as any).religion;

            if (!detectedReligion || detectedReligion === 'generic') {
                detectedReligion = detectReligion(structure.name, culturalZone, era);
            }

            return getReligionDisplay(detectedReligion);
        }
        return null;
    }, [structureType, structure, culturalZone, era]);

    // Get structure-specific color scheme
    const getColorScheme = () => {
        switch (structureType) {
            case 'holy_site':
                return {
                    primary: 'purple',
                    accent: 'from-purple-600 to-indigo-600',
                    header: 'text-purple-600 dark:text-purple-300',
                    border: 'border-purple-700/30'
                };
            case 'palace':
                return {
                    primary: 'amber',
                    accent: 'from-amber-600 to-yellow-600',
                    header: 'text-amber-600 dark:text-amber-300',
                    border: 'border-amber-700/30'
                };
            case 'ruin':
                return {
                    primary: 'stone',
                    accent: 'from-stone-600 to-stone-700',
                    header: 'text-stone-600 dark:text-stone-300',
                    border: 'border-stone-700/30'
                };
            case 'fortress':
                return {
                    primary: 'red',
                    accent: 'from-red-600 to-orange-600',
                    header: 'text-red-600 dark:text-red-300',
                    border: 'border-red-700/30'
                };
            default:
                return {
                    primary: 'blue',
                    accent: 'from-blue-600 to-cyan-600',
                    header: 'text-blue-600 dark:text-blue-300',
                    border: 'border-blue-700/30'
                };
        }
    };

    const colors = getColorScheme();

    return (
        <div
            data-surface="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                }}
                className="border rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Banner Header with Background Image */}
                <div className="relative w-full h-[220px] shrink-0 overflow-hidden">
                    <TimeAwareBackground
                        biome={mapData.tiles?.[0]?.biome || 'grassland'}
                        weather="clear"
                        culturalZone={culturalZone}
                        era={era}
                        className="absolute inset-0 object-cover"
                    />

                    {/* Gradient overlays */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent"></div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent"
                        style={{ background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)' }}></div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-md transition-colors"
                        style={{
                            backgroundColor: 'var(--surface-overlay-strong)',
                            color: 'var(--text-primary)'
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>

                    {/* Title section */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                        <div className="flex items-end gap-4">
                            {/* POI Symbol */}
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 shadow-lg"
                                style={{
                                    backgroundColor: 'var(--surface-overlay-strong)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <POISymbol structure={structure} size={76} mapSeed={mapData.seed} />
                            </div>

                            {/* Title and metadata */}
                            <div className="flex-1">
                                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${colors.header}`}>
                                    {structureType.replace(/_/g, ' ')}
                                </p>
                                <h2 className="text-3xl font-bold text-amber-700 dark:text-amber-200 mb-1">
                                    {name}
                                </h2>
                                <p className="text-sm text-amber-700 dark:text-amber-100/90 flex items-center gap-2">
                                    <span>📍</span> {mapData.localArea || mapData.continent || 'Unknown Lands'}
                                </p>
                            </div>

                            {/* Religion badge for holy sites */}
                            {religion && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                                    style={{
                                        backgroundColor: 'var(--surface-overlay-strong)',
                                        borderColor: 'var(--border-normal)'
                                    }}>
                                    <span style={{ color: religion.color }} className="text-2xl">
                                        {religion.icon}
                                    </span>
                                    <span className="text-base font-bold" style={{ color: religion.color }}>
                                        {religion.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Description */}
                    <p className="italic text-[var(--text-secondary)] leading-relaxed mb-6 text-base">
                        {description}
                    </p>

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Status Info */}
                            <div className="rounded-lg p-4 border"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <h4 className={`font-semibold mb-3 flex items-center gap-2 ${colors.header}`}>
                                    <span className="text-lg">📍</span> Status
                                </h4>
                                <DetailRow label="State" value={state} />
                                {structureType !== 'ruin' && (
                                    <DetailRow label="Allegiance" value={allegianceGroup || 'Unaligned'} />
                                )}
                                {structureType === 'ruin' && structure.customData && (
                                    <>
                                        <DetailRow label="Original Era" value={structure.customData.originalEra || 'Unknown'} />
                                        <DetailRow label="Architecture" value={structure.customData.style || 'Unknown'} />
                                        <DetailRow label="Age" value={`~${structure.customData?.age || Math.floor(Math.random() * 800 + 200)} years`} />
                                        <DetailRow label="Material" value={structure.customData?.material || 'weathered stone'} />
                                    </>
                                )}
                                {structureType === 'holy_site' && (
                                    <DetailRow label="Wealth Level" value={`${holySiteWealth}/10`} />
                                )}
                            </div>

                            {/* Key Figures */}
                            {anchoredNpcs.length > 0 && (
                                <div className="rounded-lg p-4 border"
                                    style={{
                                        backgroundColor: 'var(--surface-card)',
                                        borderColor: 'var(--border-normal)'
                                    }}>
                                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${colors.header}`}>
                                        <span className="text-lg">👥</span> Key Figures
                                    </h4>
                                    <div className="space-y-3">
                                        {anchoredNpcs.map(npc => (
                                            <div key={npc.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                                                style={{
                                                    backgroundColor: 'var(--surface-muted-bg)'
                                                }}>
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 shrink-0"
                                                    style={{
                                                        borderColor: 'var(--border-normal)',
                                                        backgroundColor: 'var(--surface-muted)'
                                                    }}>
                                                    <LazyPortrait character={npc} size={48} type="procedural" staticMode={true} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--text-primary)]">{npc.name}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{npc.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Economic Activity for Holy Sites */}
                            {structureType === 'holy_site' && (consumedGoods || producedGoods) && (
                                <div className="rounded-lg p-4 border"
                                    style={{
                                        backgroundColor: 'var(--surface-card)',
                                        borderColor: 'var(--border-normal)'
                                    }}>
                                    <h4 className="font-semibold text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🕊️</span> Offerings & Blessings
                                    </h4>
                                    <div className="space-y-3">
                                        {consumedGoods && (
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Consumes:</p>
                                                <p className="text-sm text-[var(--text-primary)]">
                                                    {consumedGoods.map(g => g.replace(/_/g, ' ')).join(', ') || 'Various offerings'}
                                                </p>
                                            </div>
                                        )}
                                        {producedGoods && (
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Produces:</p>
                                                <p className="text-sm text-[var(--text-primary)]">
                                                    {producedGoods.map(g => g.replace(/_/g, ' ')).join(', ') || 'Spiritual services'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Treasury */}
                            {((structureType === 'holy_site' && holySiteTreasury && Object.keys(holySiteTreasury).length > 0) ||
                              (structureType !== 'holy_site' && treasury && Object.keys(treasury).length > 0)) && (
                                <div className="rounded-lg p-4 border"
                                    style={{
                                        backgroundColor: 'var(--surface-card)',
                                        borderColor: 'var(--border-normal)'
                                    }}>
                                    <h4 className="font-semibold text-amber-600 dark:text-amber-300 mb-3 flex items-center gap-2">
                                        <span className="text-lg">💰</span> Treasury
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(structureType === 'holy_site' ? holySiteTreasury : treasury || {})
                                            .slice(0, 6)
                                            .map(([itemId, quantity]) => (
                                            <div key={itemId} className="flex justify-between items-center py-1 px-2 rounded"
                                                style={{ backgroundColor: 'var(--surface-muted-bg)' }}>
                                                <span className="text-xs text-[var(--text-muted)] truncate">
                                                    {getItemDefinition(itemId)?.name || itemId.replace(/_/g, ' ')}:
                                                </span>
                                                <span className="text-sm font-semibold text-[var(--text-primary)] ml-2">
                                                    {quantity.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Structure-specific interactions */}
                    <div className="mt-6">
                        {structure.structureType === 'holy_site' ? (
                            <>
                                {/* Explore Sacred Complex Button */}
                                {onEnterSpecialMap && (
                                    <div className="mb-4 rounded-lg p-4 border"
                                        style={{
                                            backgroundColor: 'var(--surface-card)',
                                            borderColor: 'var(--border-normal)'
                                        }}>
                                        <h4 className="font-semibold text-lg text-purple-600 dark:text-purple-300 mb-3 flex items-center gap-2">
                                            <span>🛐</span> Sacred Complex
                                        </h4>
                                        <button
                                            onClick={() => {
                                                const config: SpecialMapConfig = {
                                                    culturalZone: culturalZone,
                                                    era: era,
                                                    region: mapData.region,
                                                    mapSize: 'medium',
                                                    structureId: structure.id,
                                                    structureName: structure.name || 'Sacred Site',
                                                    climate: mapData.climate,
                                                    customData: {
                                                        religion: religion?.name || 'Local Faith',
                                                        deity: religion?.primaryDeity,
                                                        yearBuilt: structure.customData?.yearBuilt || gameDate.year - Math.floor(Math.random() * 500),
                                                        culturalDetails: structure.customData
                                                    }
                                                };
                                                onEnterSpecialMap(config);
                                                onClose();
                                            }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/25 font-bold flex items-center justify-center gap-2"
                                        >
                                            <span>🚪</span> Explore Sacred Complex
                                        </button>
                                        <p className="text-xs text-center text-[var(--text-muted)] mt-2 italic">
                                            Enter the sacred interior to explore shrines, altars, and holy relics
                                        </p>
                                    </div>
                                )}
                                <HolySiteInteractions
                                    structure={structure}
                                    religion={religion?.name || 'Local Faith'}
                                    playerCharacter={npcs.find(npc => npc.isPlayerCharacter)}
                                    onServicePurchased={(service) => {
                                        console.log('Service purchased:', service);
                                    }}
                                />
                            </>
                        ) : structure.structureType === 'ruin' ? (
                            <div className="rounded-lg p-4 border"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <h4 className="font-semibold text-lg text-stone-600 dark:text-stone-300 mb-3 flex items-center gap-2">
                                    <span>🏛️</span> Exploration Options
                                </h4>
                                <div className="space-y-3">
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                        {structure.customData?.description ||
                                         `These ruins date back approximately ${structure.customData?.age || '500'} years. ` +
                                         `The ${structure.customData?.material || 'stone'} construction suggests ${structure.customData?.originalStructureType || 'ancient'} origins.`}
                                    </p>
                                    <div className="rounded-lg p-3 border border-yellow-600/30"
                                        style={{ backgroundColor: 'var(--surface-muted-bg)' }}>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-300 flex items-center gap-2">
                                            <span>⚠️</span>
                                            <span>To explore these ruins, move your character to this tile and select "Enter Ruins"</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : structure.structureType === 'palace' ? (
                            <div className="rounded-lg p-4 border"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <h4 className="font-semibold text-lg text-amber-600 dark:text-amber-300 mb-4 flex items-center gap-2">
                                    <span>👑</span> Court Actions
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Seek Royal Audience</button>
                                    <button className="ff-action-button">Offer Tribute</button>
                                    <button className="ff-action-button">Request Patronage</button>
                                    <button className="ff-action-button">Court Gossip</button>
                                </div>
                                <p className="text-xs text-center text-[var(--text-muted)] mt-3 italic">
                                    (Influence and reputation affect available options)
                                </p>
                            </div>
                        ) : structure.structureType === 'fortress' ? (
                            <div className="rounded-lg p-4 border"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <h4 className="font-semibold text-lg text-red-600 dark:text-red-300 mb-4 flex items-center gap-2">
                                    <span>⚔️</span> Military Actions
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Request Garrison Aid</button>
                                    <button className="ff-action-button">Enlist as Mercenary</button>
                                    <button className="ff-action-button">Trade Military Supplies</button>
                                    <button className="ff-action-button">Gather Intelligence</button>
                                </div>
                                <p className="text-xs text-center text-[var(--text-muted)] mt-3 italic">
                                    (Military structures may require proper credentials)
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg p-4 border"
                                style={{
                                    backgroundColor: 'var(--surface-card)',
                                    borderColor: 'var(--border-normal)'
                                }}>
                                <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <span>⚡</span> Actions
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="ff-action-button">Investigate</button>
                                    <button className="ff-action-button">Trade</button>
                                    <button className="ff-action-button">Gather Information</button>
                                    <button className="ff-action-button">Rest</button>
                                </div>
                                <p className="text-xs text-center text-[var(--text-muted)] mt-3 italic">
                                    (More actions will be available through the quest system)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t flex justify-end"
                    style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--border-subtle)'
                    }}>
                    <button onClick={onClose} className="ff-action-button">Leave</button>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-[var(--text-muted)] text-sm">{label}:</span>
        <span className="font-semibold text-[var(--text-primary)] capitalize text-right text-sm">{value}</span>
    </div>
);

export default PointOfInterestModal;
