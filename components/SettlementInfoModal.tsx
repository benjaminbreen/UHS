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
        
        // Use localArea for more specific cultural zone detection
        const localArea = mapData.localArea || '';
        let culture: CulturalZone;
        
        // Check for specific regions first
        if (localArea.toLowerCase().includes('moscow') || localArea.toLowerCase().includes('novgorod') || 
            localArea.toLowerCase().includes('kiev') || localArea.toLowerCase().includes('dnieper') ||
            localArea.toLowerCase().includes('volga') || localArea.toLowerCase().includes('poland') ||
            localArea.toLowerCase().includes('bohemia') || localArea.toLowerCase().includes('carpathian') ||
            localArea.toLowerCase().includes('thracian') || localArea.toLowerCase().includes('brandenburg')) {
            culture = 'SLAVIC' as CulturalZone;
        } else if (localArea.toLowerCase().includes('thebes') || localArea.toLowerCase().includes('nile') ||
                   localArea.toLowerCase().includes('alexandria') || localArea.toLowerCase().includes('cairo')) {
            culture = 'MENA' as CulturalZone;
        } else if (localArea.toLowerCase().includes('beijing') || localArea.toLowerCase().includes('yangtze') ||
                   localArea.toLowerCase().includes('yellow river') || localArea.toLowerCase().includes('han river')) {
            culture = 'EAST_ASIAN' as CulturalZone;
        } else {
            // Fallback to continent-based detection
            culture = mapLocationToCulture(mapData.continent || 'Europe', parsed.year);
        }
        
        let tod: TimeOfDay = 'Midday';
        if (gameTimeHours >= 5 && gameTimeHours < 8) tod = 'Dawn';
        else if (gameTimeHours >= 8 && gameTimeHours < 12) tod = 'Morning';
        else if (gameTimeHours >= 12 && gameTimeHours < 16) tod = 'Midday';
        else if (gameTimeHours >= 16 && gameTimeHours < 19) tod = 'Afternoon';
        else if (gameTimeHours >= 19 && gameTimeHours < 21) tod = 'Dusk';
        else tod = 'Night';

        return { era: parsed.era as HistoricalEra, culturalZone: culture, year: parsed.year, timeOfDay: tod };
    }, [mapData.timeSlice, mapData.continent, mapData.localArea, gameTimeHours]);

    const { name, description, economicProfile, population, families, allegianceString, settlementProfessions, representativeInhabitants } = useMemo(() => {
        const noise = new ValueNoise(tile.x * 17 + tile.y * 31 + mapData.seed);
        const { majorCity } = mapData;
        
        // Generate contextual description based on actual map data
        const getSettlementDescription = () => {
            const biomeType = tile.biome;
            const regionName = mapData.localArea || mapData.mapAreaName || 'this region';
            
            // First check if tile has city description stored directly
            if (tile.cityDescription) {
                return tile.cityDescription;
            }
            
            // Check if there's a major city nearby
            let nearbyCity = '';
            if (mapData.majorCity && mapData.majorCity.name && biomeType !== BiomeType.CITY_CENTER) {
                nearbyCity = ` near ${mapData.majorCity.name}`;
            } else if (tile.cityName && biomeType !== BiomeType.CITY_CENTER) {
                nearbyCity = ` near ${tile.cityName}`;
            }
            
            // Get local economic focus
            let economicPrefix = '';
            if (details.settlementProfessions && details.settlementProfessions.length > 0) {
                const primaryProfession = details.settlementProfessions[0].toLowerCase();
                if (primaryProfession.includes('farmer') || primaryProfession.includes('shepherd')) {
                    economicPrefix = "Farming ";
                } else if (primaryProfession.includes('miner')) {
                    economicPrefix = "Mining ";
                } else if (primaryProfession.includes('logger') || primaryProfession.includes('woodcutter')) {
                    economicPrefix = "Logging ";
                } else if (primaryProfession.includes('fisher')) {
                    economicPrefix = "Fishing ";
                } else if (primaryProfession.includes('merchant') || primaryProfession.includes('trader')) {
                    economicPrefix = "Trading ";
                } else if (primaryProfession.includes('smith') || primaryProfession.includes('craftsman')) {
                    economicPrefix = "Crafting ";
                }
            }
            
            if (biomeType === BiomeType.HAMLET) {
                if (nearbyCity) {
                    return `${economicPrefix}hamlet${nearbyCity}`;
                }
                return `${economicPrefix}hamlet in ${regionName}`;
            } else if (biomeType === BiomeType.FARMLAND) {
                const cropType = tile.cropType || 'grain';
                if (nearbyCity) {
                    return `${cropType} farm${nearbyCity}`;
                }
                return `${cropType} farm in ${regionName}`;
            } else if (biomeType === BiomeType.MARKETPLACE) {
                if (nearbyCity) {
                    return `Market square${nearbyCity}`;
                }
                return `Market square in ${regionName}`;
            } else if (biomeType === BiomeType.LOW_DENSITY_CITY) {
                if (mapData.majorCity && mapData.majorCity.name) {
                    return `Outer district of ${mapData.majorCity.name}`;
                }
                return `Low density urban area in ${regionName}`;
            } else if (biomeType === BiomeType.DENSE_CITY) {
                if (mapData.majorCity && mapData.majorCity.name) {
                    return `Dense urban core of ${mapData.majorCity.name}`;
                }
                return `Dense urban area in ${regionName}`;
            } else if (biomeType === BiomeType.CITY_CENTER && mapData.majorCity) {
                return mapData.majorCity.description || `The heart of ${regionName}`;
            }
            return `Settlement in ${regionName}`;
        };

        const getSettlementName = () => {
            const biomeType = tile.biome;
            
            // First check if tile has city name stored directly
            if (tile.cityName) {
                return tile.cityName;
            }
            
            // For city centers, use the actual city name from majorCity
            if (biomeType === BiomeType.CITY_CENTER && majorCity) {
                return majorCity.name;
            }
            
            // For other settlement types, use descriptive names
            if (biomeType === BiomeType.HAMLET) {
                return 'Hamlet';
            } else if (biomeType === BiomeType.FARMLAND) {
                return 'Farm';
            } else if (biomeType === BiomeType.MARKETPLACE) {
                return 'Marketplace';
            } else if (biomeType === BiomeType.LOW_DENSITY_CITY) {
                return 'Outer City';
            } else if (biomeType === BiomeType.DENSE_CITY) {
                return 'City Center';
            }
            
            // Fallback - capitalize and clean up biome name
            return biomeType.replace(/_/g, ' ').toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        let details = {
            name: '',
            description: '',
            population: tile.population || 0,
            economicProfile: ['Subsistence living'],
            families: [] as string[],
            allegianceString: 'Unaligned',
            settlementProfessions: [] as string[],
            representativeInhabitants: [] as any[]
        };
        
        // Economy - Get professions first so we can use them in the description
        details.settlementProfessions = getSettlementProfessions(tile, mapData, culturalZone, era);
        
        // Now set name and description after we have professions
        details.name = getSettlementName();
        details.description = getSettlementDescription();
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
        
        // Inhabitants - Always generate them for settlements with population
        if(details.population > 0 || tile.biome === BiomeType.FARMLAND) {
             const numInhabitants = 4;
             // Use settlement professions if available, otherwise use generic ones
             if (details.settlementProfessions.length === 0) {
                 // Fallback professions based on biome type and era
                 if (tile.biome === BiomeType.FARMLAND) {
                     details.settlementProfessions = ['Farmer', 'Farm Hand', 'Shepherd', 'Miller'];
                 } else if (tile.biome === BiomeType.MARKETPLACE) {
                     details.settlementProfessions = ['Merchant', 'Trader', 'Craftsman', 'Guard'];
                 } else if (tile.biome === BiomeType.HAMLET) {
                     details.settlementProfessions = ['Farmer', 'Blacksmith', 'Carpenter', 'Laborer'];
                 } else {
                     details.settlementProfessions = ['Artisan', 'Merchant', 'Scholar', 'Guard'];
                 }
             }
             
             for (let i = 0; i < numInhabitants; i++) {
                const gender = noise.random() > 0.5 ? 'Male' as Gender : 'Female' as Gender;
                let fullName: string;
                
                // Use family names from the families array if available
                const familyName = details.families.length > 0 
                    ? details.families[i % details.families.length]
                    : singleFamilyName;
                    
                if (familyName) {
                    const firstName = generateNpcName(gender, culturalZone, undefined, year, noise).split(' ')[0];
                    fullName = `${firstName} ${familyName}`;
                } else {
                    fullName = generateNpcName(gender, culturalZone, undefined, year, noise);
                }
                
                const age = 18 + Math.floor(noise.random() * 55);
                const profession = details.settlementProfessions[i % details.settlementProfessions.length];
                const wealth = i % 3 === 0 ? 'comfortable' : 'modest';

                const baseProfile = generateBaseProfile(noise, { era, culturalZone, region: mapData.localArea || '' });
                const { socialClass } = determineSocialRole(baseProfile, { era, culturalZone }, profession);
                
                // Add disease with 33% chance
                let diseaseStatus = null;
                if (Math.random() < 0.33) {
                    diseaseStatus = 'Common Cold'; // Simplified for representative inhabitants
                }
                
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
                    class: socialClass,
                    diseaseStatus
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

    const getBuildingTypeForLogging = () => {
        if (tile.biome === BiomeType.FARMLAND) return 'FarmBanner';
        if (tile.biome === BiomeType.MARKETPLACE) return 'MarketplaceBanner';
        if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER].includes(tile.biome)) {
            // For urban areas, we need to approximate the building type based on cultural zone and era
            // This mirrors the logic in UrbanSymbol.tsx
            const { year, era: eraName } = useMemo(() => parseDateString(mapData.timeSlice || '1650'), [mapData.timeSlice]);
            const eraLevel = eraName === 'Prehistoric' ? 0 : eraName === 'Ancient' ? 1 : eraName === 'Classical' ? 2 : eraName === 'Medieval' ? 3 : eraName === 'Early Modern' ? 4 : eraName === 'Modern' ? 5 : 6;
            
            if (eraLevel === 0) return 'PrehistoricShelter3D';
            if (eraLevel >= 6) return 'ModernSkyscraper3D';
            if (eraLevel === 5) return 'ModernCivic3D';
            
            switch(culturalZone) {
                case 'SUB_SAHARAN_AFRICAN': return eraLevel >= 3 ? 'AfricanStoneBuilding3D' : 'AfricanRoundHut3D';
                case 'EAST_ASIAN': return 'EastAsianPagoda3D';
                case 'SOUTH_ASIAN': return 'SouthAsianTemple3D';
                case 'MENA': return 'OttomanTownhouse3D';
                case 'OCEANIA': return 'PolynesianHouse3D';
                case 'NORTH_AMERICAN_PRE_COLUMBIAN': return 'BarkLonghouse3D';
                case 'SOUTH_AMERICAN': return 'AztecDwelling3D';
                default: return eraLevel >= 3 ? 'GeorgianRowhouse3D' : 'MedievalBuilding3D';
            }
        }
        return 'GenericBuilding';
    };

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
                     <span className="absolute top-3 right-12 text-xs text-gray-500 italic font-mono">{getBuildingTypeForLogging()}</span>
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
                                                 {p.diseaseStatus && (
                                                     <p className="text-xs text-orange-500 font-medium">{p.diseaseStatus}</p>
                                                 )}
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