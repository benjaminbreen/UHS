/**
 * components/SettlementInfoModal.tsx - A detailed informational panel for settlements and farms.
 */
import React, { useMemo } from 'react';
import { Tile, MapData, BiomeType, CulturalZone, HistoricalEra, Gender, TimeOfDay } from '../types';
import { generateNpcName, generateBaseProfile, determineSocialRole } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString } from '../utils/dateUtils';
import { getSettlementProfessions } from '../services/settlementService';
import { ProceduralPortrait } from './portraits';
import CityBanner, { CitySize } from './CityBanner';
import FarmBanner from './FarmBanner';
import MarketplaceBanner, { Condition } from './MarketplaceBanner';
import { Season, ClimateType } from '../types';

interface SettlementInfoModalProps {
  tile: Tile;
  mapData: MapData;
  onClose: () => void;
  gameTimeHours: number;
  season: Season;
}

const DetailRow: React.FC<{ label: string; value: string | number | React.ReactNode; icon?: string }> = ({ label, value, icon }) => (
    <div className="flex justify-between items-baseline py-1.5 border-b border-slate-700/50">
        <span className="text-slate-400 flex items-center gap-2">
            {icon && <span className="text-base">{icon}</span>}
            {label}
        </span>
        <span className="text-white font-semibold text-right">{value}</span>
    </div>
);

const SettlementInfoModal: React.FC<SettlementInfoModalProps> = ({ tile, mapData, onClose, gameTimeHours, season }) => {
    const { era, culturalZone, year, timeOfDay } = useMemo(() => {
        const parsed = parseDateString(mapData.timeSlice || '1650');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', parsed.year);
        
        let tod: TimeOfDay = 'Midday';
        if (gameTimeHours >= 5 && gameTimeHours < 8) tod = 'Dawn';
        else if (gameTimeHours >= 8 && gameTimeHours < 12) tod = 'Morning';
        else if (gameTimeHours >= 12 && gameTimeHours < 16) tod = 'Midday';
        else if (gameTimeHours >= 16 && gameTimeHours < 19) tod = 'Afternoon';
        else if (gameTimeHours >= 19 && gameTimeHours < 21) tod = 'Dusk';
        else tod = 'Night';

        return { era: parsed.era as HistoricalEra, culturalZone: culture as CulturalZone, year: parsed.year, timeOfDay: tod };
    }, [mapData.timeSlice, mapData.continent, gameTimeHours]);

    const { name, description, economicProfile, population, families, allegianceString, settlementProfessions, representativeInhabitants } = useMemo(() => {
        const noise = new ValueNoise(tile.x * 17 + tile.y * 31 + mapData.seed);
        const { majorCity } = mapData;
        
        let details = {
            name: tile.biome === BiomeType.CITY_CENTER && majorCity ? majorCity.name : tile.biome.replace(/_/g, ' '),
            description: tile.biome === BiomeType.CITY_CENTER && majorCity ? majorCity.description : 'A local settlement.',
            population: tile.population || 0,
            economicProfile: ['Subsistence living'],
            families: [] as string[],
            allegianceString: 'Unaligned',
            settlementProfessions: [] as string[],
            representativeInhabitants: [] as any[]
        };
        
        // Economy
        details.settlementProfessions = getSettlementProfessions(tile, mapData, culturalZone, era);
        if (details.settlementProfessions.length > 0) {
            details.economicProfile = [`Primary professions: ${details.settlementProfessions.slice(0,3).join(', ')}.`];
        } else {
            details.economicProfile = ['Primarily subsistence agriculture.'];
        }

        // Families
        let singleFamilyName: string | null = null;
        if (tile.biome === BiomeType.FARMLAND) {
            singleFamilyName = generateNpcName('Male', culturalZone, undefined, year, noise).split(' ')[1] || 'Stonemason';
        }

        if(details.population > 0 && !singleFamilyName){
            const familyCount = Math.max(1, Math.floor(details.population / (8 + noise.random() * 8)));
            for (let i = 0; i < familyCount; i++) {
                const familyName = generateNpcName('Male', culturalZone, undefined, year, noise).split(' ')[1];
                if (familyName) details.families.push(familyName);
            }
            details.families = [...new Set(details.families)].slice(0, 3);
        } else if (singleFamilyName) {
            details.families = [singleFamilyName];
        }
        
        // Allegiance
        const dominantFactionKey = mapData.majorCity?.allegiance || 'Local Authorities';
        const loyalty = tile.allegianceBreakdown?.[dominantFactionKey] ?? (Object.values(tile.allegianceBreakdown || {})[0] || 0);
        
        if (loyalty > 0.9) details.allegianceString = `Staunchly loyal to ${dominantFactionKey}`;
        else if (loyalty > 0.7) details.allegianceString = `Strongly aligned with ${dominantFactionKey}`;
        else if (loyalty > 0.5) details.allegianceString = `Generally loyal to ${dominantFactionKey}`;
        else if (loyalty > 0.3) details.allegianceString = `Questionable loyalty to ${dominantFactionKey}`;
        else details.allegianceString = `Has strong dissenting elements`;
        
        // Inhabitants
        if(details.settlementProfessions.length > 0) {
             const numInhabitants = 4;
             for (let i = 0; i < numInhabitants; i++) {
                const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
                let fullName: string;
                if (singleFamilyName) {
                    const firstName = generateNpcName(gender, culturalZone, undefined, year, noise).split(' ')[0];
                    fullName = `${firstName} ${singleFamilyName}`;
                } else {
                    fullName = generateNpcName(gender, culturalZone, undefined, year, noise);
                }
                const age = 18 + Math.floor(noise.random() * 55);
                const profession = details.settlementProfessions[i % details.settlementProfessions.length];
                const wealth = i % 3 === 0 ? 'comfortable' : 'modest';

                const baseProfile = generateBaseProfile(noise, { era, culturalZone, region: mapData.localArea || '' });
                const { socialClass } = determineSocialRole(baseProfile, { era, culturalZone }, profession);
                
                details.representativeInhabitants.push({ 
                    name: fullName, 
                    age, 
                    profession, 
                    gender, 
                    wealthLevel: wealth,
                    portraitSeed: noise.random() * 1000000,
                    appearance: baseProfile.appearance,
                    stats: baseProfile.stats,
                    era: baseProfile.era,
                    culturalZone: baseProfile.culturalZone,
                    class: socialClass
                });
            }
        }
        
        return details;
    }, [tile, mapData, culturalZone, era, year]);
    
    const bannerProps = useMemo(() => {
        return {
            era, culturalZone,
            condition: (population > 100 ? 'prosperous' : 'humble') as Condition,
            climate: mapData.climate,
            season: season,
            seed: mapData.seed,
            timeOfDay,
            mapData
        };
    }, [era, culturalZone, population, mapData, season, timeOfDay]);

    const renderBanner = () => {
        switch(tile.biome) {
            case BiomeType.FARMLAND:
                return <FarmBanner {...bannerProps} cropType={tile.cropType || 'Wheat'} height={150} />;
            case BiomeType.MARKETPLACE:
                return <MarketplaceBanner {...bannerProps} height={150} />;
            case BiomeType.HAMLET:
            case BiomeType.LOW_DENSITY_CITY:
            case BiomeType.DENSE_CITY:
            case BiomeType.CITY_CENTER:
                 return <CityBanner {...bannerProps} size={population > 500 ? 'big_city' : 'smaller_city'} height={150} />;
            default:
                return <div className="w-full h-[150px] bg-slate-700" />;
        }
    };
    

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-primary-lg w-full max-w-4xl flex flex-col animate-popIn" style={{maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
                 <header className="relative w-full h-[150px] rounded-t-xl overflow-hidden shrink-0">
                    {renderBanner()}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 text-white">
                         <h2 className="text-2xl font-bold capitalize" style={{ textShadow: '2px 2px 4px #000' }}>{name}</h2>
                         <p className="text-sm italic text-slate-300" style={{ textShadow: '1px 1px 2px #000' }}>{description}</p>
                    </div>
                     <button onClick={onClose} className="absolute top-3 right-3 text-slate-300 hover:text-white transition-colors">&times;</button>
                </header>

                <div className="p-5 flex-grow overflow-y-auto scrollbar-thin text-sm space-y-4">
                   <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                             <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                                <h4 className="font-semibold text-lg text-amber-300 mb-2 flex items-center gap-2"><span className="text-xl">👥</span> Demographics</h4>
                                <div className="text-sm space-y-2">
                                    <DetailRow label="Est. Population" value={population} />
                                    <div className="pt-2">
                                        <p className="text-gray-400 mb-1">Dominant Religions:</p>
                                        {tile.dominantReligions && tile.dominantReligions.length > 0 ? (
                                             tile.dominantReligions.map(r => <DetailRow key={r.name} label={r.name} value={`${Math.round(r.percentage * 100)}%`}/>)
                                        ) : <p className="text-white text-xs italic">No dominant religion.</p>}
                                    </div>
                                    {families.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-gray-400 mb-1">Prominent Families:</p>
                                            <p className="text-white font-semibold text-sm leading-relaxed">{families.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                                <h4 className="font-semibold text-lg text-green-400 mb-2 flex items-center gap-2"><span className="text-xl">💰</span> Economy & Allegiance</h4>
                                 <div className="text-sm space-y-2">
                                    <div className="space-y-1">
                                      <p className="text-gray-400">Economic Profile:</p>
                                      {economicProfile.map((line, i) => <p key={i} className="text-white">• {line}</p>)}
                                    </div>
                                    <DetailRow label="Allegiance" value={allegianceString} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                         {representativeInhabitants.length > 0 && (
                            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                                <h4 className="font-semibold text-lg text-cyan-400 mb-3 flex items-center gap-2"><span className="text-xl">👤</span> Representative Inhabitants</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {representativeInhabitants.map((p, i) => (
                                        <div key={i} className="bg-slate-900/50 p-3 rounded-md text-center flex items-center gap-4 border border-slate-700/50">
                                             <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 shrink-0 bg-slate-700">
                                                <ProceduralPortrait
                                                    character={p as any}
                                                    size={64}
                                                />
                                             </div>
                                             <div className="text-left">
                                                 <p className="font-bold text-sm text-white">{p.name}</p>
                                                 <p className="text-xs text-slate-400">{p.age}, {p.profession}</p>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                   </div>
                </div>
                
                <footer className="mt-auto pt-4 border-t border-blue-500/30 flex justify-end p-4 bg-slate-800/80 rounded-b-xl">
                    <button onClick={onClose} className="ff-action-button">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default SettlementInfoModal;