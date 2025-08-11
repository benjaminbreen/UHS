/**
 * components/FarmModal.tsx - Specialized modal for farm structures with rich demographics and visuals
 */
import React, { useMemo, useEffect, useState } from 'react';
import { TerrainStructure, MapData, Tile, TimeOfDay, Season, NpcEntity, HistoricalEra, CulturalZone, BiomeType } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { FACTION_DATA } from '../constants/gameData/factions';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

// Simple display name mappings
const BIOME_DISPLAY_NAMES: Record<string, string> = {
    GRASSLAND: 'Grassland',
    FOREST: 'Forest',
    DESERT: 'Desert',
    TUNDRA: 'Tundra',
    MOUNTAIN: 'Mountain',
    HILLS: 'Hills',
    MARSH: 'Marsh',
    FARMLAND: 'Farmland',
    RIVERBANK: 'Riverbank',
    COAST: 'Coast',
    SHALLOW_OCEAN: 'Shallow Ocean',
    DEEP_OCEAN: 'Deep Ocean'
};

const CLIMATE_DISPLAY_NAMES: Record<string, string> = {
    TEMPERATE: 'Temperate',
    MEDITERRANEAN: 'Mediterranean',
    COLD: 'Cold',
    TROPICAL: 'Tropical',
    DESERT: 'Desert',
    ARCTIC: 'Arctic'
};

interface FarmModalProps {
    structure: TerrainStructure;
    mapData: MapData;
    npcs: NpcEntity[];
    onClose: () => void;
    gameTimeHours: number;
    season: Season;
}

// Generate procedural family based on seed
const generateFarmFamily = (seed: number, culturalZone: CulturalZone): {
    familyName: string;
    members: Array<{ name: string; age: number; role: string; portrait: string }>;
    population: number;
} => {
    const random = (max: number) => Math.floor((Math.sin(seed) * 10000) % max);
    const seededRandom = (s: number) => {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    
    // Cultural name pools
    const namesByZone: Record<string, { first: string[], last: string[] }> = {
        'EUROPEAN': {
            first: ['John', 'William', 'Mary', 'Elizabeth', 'Thomas', 'Sarah', 'James', 'Margaret', 'Robert', 'Anne'],
            last: ['Smith', 'Brown', 'Taylor', 'Wilson', 'Johnson', 'White', 'Green', 'Hill', 'Cooper', 'Wright']
        },
        'EAST_ASIAN': {
            first: ['Wei', 'Ming', 'Xiao', 'Li', 'Zhang', 'Chen', 'Wang', 'Liu', 'Mei', 'Hua'],
            last: ['Zhang', 'Wang', 'Li', 'Chen', 'Liu', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou']
        },
        'MENA': {
            first: ['Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Ali', 'Zainab', 'Omar', 'Layla', 'Hassan', 'Maryam'],
            last: ['Al-Rashid', 'Ibn Khaldun', 'Al-Hassan', 'Al-Masri', 'Al-Andalusi', 'Al-Baghdadi', 'Al-Dimashqi']
        },
        'SOUTH_AMERICAN': {
            first: ['Quispe', 'Zara', 'Yaku', 'Mama', 'Inti', 'Pacha', 'Ayar', 'Coya', 'Huascar', 'Nina'],
            last: ['Alanoca', 'Huanca', 'Quispe', 'Mamani', 'Condori', 'Choque', 'Apaza', 'Flores']
        },
        'SUB_SAHARAN_AFRICAN': {
            first: ['Kwame', 'Amara', 'Oluwaseun', 'Nia', 'Jabari', 'Zuri', 'Malik', 'Imani', 'Kofi', 'Asha'],
            last: ['Okonkwo', 'Mensah', 'Adebayo', 'Nkomo', 'Diouf', 'Keita', 'Diallo', 'Sesay']
        },
        'NORTH_AMERICAN_PRE_COLUMBIAN': {
            first: ['Takoda', 'Aiyana', 'Chayton', 'Nayeli', 'Koda', 'Nova', 'Mika', 'Shila', 'Kaya', 'Tala'],
            last: ['Running Bear', 'White Cloud', 'Strong Wind', 'Morning Star', 'Swift River', 'Eagle Eye']
        },
        'OCEANIAN': {
            first: ['Koa', 'Moana', 'Kai', 'Leilani', 'Makoa', 'Nani', 'Keoni', 'Alana', 'Ikaika', 'Kailani'],
            last: ['Kahui', 'Ngata', 'Aroha', 'Parata', 'Tipene', 'Tama', 'Rangi', 'Manu']
        },
        'ARCTIC': {
            first: ['Nanook', 'Siku', 'Atka', 'Yura', 'Kaskae', 'Nukka', 'Tatkret', 'Suka', 'Qimmiq', 'Nayeli'],
            last: ['Kanguq', 'Tikivik', 'Qimmiq', 'Nanurjuk', 'Tukkuttok', 'Amarok', 'Sivulliq']
        },
        'CARIBBEAN': {
            first: ['Jean', 'Marie', 'Pierre', 'Rose', 'Claude', 'Solange', 'Michel', 'Erzulie', 'Jacques', 'Celeste'],
            last: ['Baptiste', 'Toussaint', 'Dessalines', 'Louverture', 'Christophe', 'Petion', 'Boyer']
        },
        'CENTRAL_ASIAN': {
            first: ['Temur', 'Gulnara', 'Rustam', 'Dilnoza', 'Bekzod', 'Malika', 'Daler', 'Sitora', 'Jahongir', 'Nodira'],
            last: ['Karimov', 'Nazarbayev', 'Rakhmonov', 'Turkmenbashi', 'Khorezmi', 'Samarkandi', 'Bukhari']
        },
        'SOUTH_ASIAN': {
            first: ['Arjun', 'Priya', 'Ravi', 'Anita', 'Vikram', 'Sunita', 'Krishna', 'Radha', 'Raj', 'Lakshmi'],
            last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Rao', 'Mehta']
        },
        'AUSTRALIAN_ABORIGINAL': {
            first: ['Jedda', 'Talia', 'Jarrah', 'Kirra', 'Daku', 'Merinda', 'Warrin', 'Yindi', 'Boori', 'Kalinda'],
            last: ['Mundarra', 'Namatjira', 'Unaipon', 'Burnum', 'Mabo', 'Yunupingu', 'Langton']
        },
        'SOUTHEAST_ASIAN': {
            first: ['Budi', 'Siti', 'Agung', 'Dewi', 'Rizki', 'Putri', 'Hendra', 'Maya', 'Adi', 'Wati'],
            last: ['Wijaya', 'Kusuma', 'Santoso', 'Permana', 'Hartono', 'Susanto', 'Prasetyo']
        }
    };
    
    const names = namesByZone[culturalZone] || namesByZone['EUROPEAN'];
    const familyName = names.last[Math.abs(random(names.last.length))];
    
    // Generate 4-10 family members
    const numMembers = 4 + Math.abs(random(7));
    const members: Array<{ name: string; age: number; role: string; portrait: string }> = [];
    
    // Head of household
    members.push({
        name: names.first[Math.abs(random(names.first.length))] + ' ' + familyName,
        age: 35 + Math.abs(random(25)),
        role: 'Farmer',
        portrait: '👨‍🌾'
    });
    
    // Spouse
    members.push({
        name: names.first[Math.abs(random(names.first.length) + 1) % names.first.length] + ' ' + familyName,
        age: 30 + Math.abs(random(25)),
        role: 'Farmer',
        portrait: '👩‍🌾'
    });
    
    // Children and laborers
    for (let i = 2; i < numMembers; i++) {
        const age = 15 + Math.abs(random(30));
        members.push({
            name: names.first[(Math.abs(random(names.first.length) + i)) % names.first.length] + ' ' + familyName,
            age,
            role: age < 20 ? 'Laborer' : 'Farmer',
            portrait: age < 20 ? (i % 2 === 0 ? '👦' : '👧') : (i % 2 === 0 ? '👨' : '👩')
        });
    }
    
    return { familyName, members, population: numMembers };
};

// Generate religious distribution based on cultural zone and era
const generateReligions = (culturalZone: CulturalZone, era: HistoricalEra): Array<{ name: string; percentage: number }> => {
    const religionsByCulture: Record<string, Record<string, string[]>> = {
        'EUROPEAN': {
            'PREHISTORIC': ['Nature Worship', 'Ancestor Spirits', 'Sky Father'],
            'ANCIENT': ['Roman Paganism', 'Celtic Druidism', 'Germanic Paganism'],
            'MEDIEVAL': ['Catholic Christianity', 'Folk Beliefs', 'Local Saints'],
            'EARLY_MODERN': ['Catholic Christianity', 'Protestant Christianity', 'Folk Beliefs'],
            'MODERN_ERA': ['Christianity', 'Secular', 'Folk Traditions']
        },
        'EAST_ASIAN': {
            'PREHISTORIC': ['Ancestor Worship', 'Nature Spirits', 'Shamanism'],
            'ANCIENT': ['Taoism', 'Folk Religion', 'Ancestor Worship'],
            'MEDIEVAL': ['Buddhism', 'Taoism', 'Folk Religion', 'Confucianism'],
            'EARLY_MODERN': ['Buddhism', 'Confucianism', 'Taoism', 'Folk Religion'],
            'MODERN_ERA': ['Buddhism', 'Folk Religion', 'Secular']
        },
        'MENA': {
            'PREHISTORIC': ['Nature Worship', 'Sky Gods', 'Fertility Cults'],
            'ANCIENT': ['Ancient Egyptian Religion', 'Mesopotamian Polytheism', 'Zoroastrianism'],
            'MEDIEVAL': ['Islam', 'Eastern Christianity', 'Judaism'],
            'EARLY_MODERN': ['Islam', 'Christianity', 'Judaism'],
            'MODERN_ERA': ['Islam', 'Christianity', 'Secular']
        },
        'SOUTH_AMERICAN': {
            'PREHISTORIC': ['Amazonian Shamanism', 'Forest Spirit Worship', 'River Spirit Worship'],
            'ANCIENT': ['Amazonian Shamanism', 'Mountain Spirits', 'Sun Worship'],
            'MEDIEVAL': ['Inca Religion', 'Local Deities', 'Ancestor Worship'],
            'EARLY_MODERN': ['Catholic Christianity', 'Indigenous Beliefs', 'Syncretism'],
            'MODERN_ERA': ['Catholic Christianity', 'Protestant Christianity', 'Indigenous Beliefs']
        },
        'SUB_SAHARAN_AFRICAN': {
            'PREHISTORIC': ['Ancestor Worship', 'Nature Spirits', 'Animism'],
            'ANCIENT': ['Traditional African Religion', 'Ancestor Worship', 'Nature Spirits'],
            'MEDIEVAL': ['Traditional African Religion', 'Islam', 'Christianity'],
            'EARLY_MODERN': ['Traditional Religion', 'Islam', 'Christianity'],
            'MODERN_ERA': ['Christianity', 'Islam', 'Traditional Religion']
        },
        'NORTH_AMERICAN_PRE_COLUMBIAN': {
            'PREHISTORIC': ['Great Spirit', 'Animal Spirits', 'Nature Worship'],
            'ANCIENT': ['Great Spirit Worship', 'Nature Spirits', 'Ancestor Veneration'],
            'MEDIEVAL': ['Great Spirit', 'Clan Totems', 'Medicine Spirits'],
            'EARLY_MODERN': ['Traditional Beliefs', 'Christianity', 'Syncretism'],
            'MODERN_ERA': ['Christianity', 'Traditional Beliefs', 'Syncretism']
        },
        'OCEANIAN': {
            'PREHISTORIC': ['Ancestor Spirits', 'Ocean Deities', 'Sky Father'],
            'ANCIENT': ['Polynesian Religion', 'Ancestor Worship', 'Nature Spirits'],
            'MEDIEVAL': ['Polynesian Religion', 'Mana Beliefs', 'Tapu System'],
            'EARLY_MODERN': ['Traditional Religion', 'Christianity', 'Syncretism'],
            'MODERN_ERA': ['Christianity', 'Traditional Beliefs', 'Secular']
        },
        'ARCTIC': {
            'PREHISTORIC': ['Shamanism', 'Spirit Animals', 'Nature Worship'],
            'ANCIENT': ['Shamanism', 'Animal Spirits', 'Sea Goddess'],
            'MEDIEVAL': ['Shamanism', 'Inuit Religion', 'Spirit World'],
            'EARLY_MODERN': ['Shamanism', 'Christianity', 'Traditional Beliefs'],
            'MODERN_ERA': ['Christianity', 'Traditional Beliefs', 'Secular']
        },
        'CARIBBEAN': {
            'PREHISTORIC': ['Taino Religion', 'Nature Spirits', 'Ancestor Worship'],
            'ANCIENT': ['Taino Religion', 'Arawak Beliefs', 'Sea Spirits'],
            'MEDIEVAL': ['Indigenous Religion', 'Nature Worship', 'Ancestor Spirits'],
            'EARLY_MODERN': ['Vodou', 'Catholic Christianity', 'Obeah'],
            'MODERN_ERA': ['Christianity', 'Vodou', 'Rastafari']
        },
        'CENTRAL_ASIAN': {
            'PREHISTORIC': ['Tengrism', 'Shamanism', 'Sky Worship'],
            'ANCIENT': ['Tengrism', 'Buddhism', 'Zoroastrianism'],
            'MEDIEVAL': ['Islam', 'Buddhism', 'Tengrism'],
            'EARLY_MODERN': ['Islam', 'Buddhism', 'Folk Beliefs'],
            'MODERN_ERA': ['Islam', 'Secular', 'Folk Traditions']
        },
        'SOUTH_ASIAN': {
            'PREHISTORIC': ['Proto-Hinduism', 'Nature Worship', 'Fertility Cults'],
            'ANCIENT': ['Hinduism', 'Buddhism', 'Jainism'],
            'MEDIEVAL': ['Hinduism', 'Buddhism', 'Islam'],
            'EARLY_MODERN': ['Hinduism', 'Islam', 'Sikhism', 'Buddhism'],
            'MODERN_ERA': ['Hinduism', 'Islam', 'Christianity', 'Sikhism']
        },
        'AUSTRALIAN_ABORIGINAL': {
            'PREHISTORIC': ['Dreamtime', 'Ancestor Spirits', 'Land Spirits'],
            'ANCIENT': ['Dreamtime Beliefs', 'Totem Ancestors', 'Sacred Sites'],
            'MEDIEVAL': ['Dreamtime', 'Songlines', 'Spirit Beings'],
            'EARLY_MODERN': ['Traditional Beliefs', 'Christianity', 'Syncretism'],
            'MODERN_ERA': ['Christianity', 'Traditional Beliefs', 'Secular']
        },
        'SOUTHEAST_ASIAN': {
            'PREHISTORIC': ['Animism', 'Ancestor Worship', 'Nature Spirits'],
            'ANCIENT': ['Hinduism', 'Buddhism', 'Animism'],
            'MEDIEVAL': ['Buddhism', 'Islam', 'Hinduism', 'Animism'],
            'EARLY_MODERN': ['Islam', 'Buddhism', 'Christianity', 'Hinduism'],
            'MODERN_ERA': ['Islam', 'Buddhism', 'Christianity', 'Folk Religion']
        }
    };
    
    const defaultReligions = ['Local Folk Religion', 'Nature Worship', 'Ancestor Spirits'];
    const religions = religionsByCulture[culturalZone]?.[era] || defaultReligions;
    
    const distribution: Array<{ name: string; percentage: number }> = [];
    
    // Create a realistic distribution
    if (religions.length === 1) {
        distribution.push({ name: religions[0], percentage: 100 });
    } else if (religions.length === 2) {
        distribution.push({ name: religions[0], percentage: 70 });
        distribution.push({ name: religions[1], percentage: 30 });
    } else if (religions.length === 3) {
        distribution.push({ name: religions[0], percentage: 70 });
        distribution.push({ name: religions[1], percentage: 25 });
        distribution.push({ name: religions[2], percentage: 5 });
    } else {
        // 4+ religions
        distribution.push({ name: religions[0], percentage: 50 });
        distribution.push({ name: religions[1], percentage: 30 });
        distribution.push({ name: religions[2], percentage: 15 });
        distribution.push({ name: religions[3], percentage: 5 });
    }
    
    return distribution;
};

const FarmModal: React.FC<FarmModalProps> = ({ 
    structure, 
    mapData, 
    npcs, 
    onClose, 
    gameTimeHours, 
    season 
}) => {
    const { name, location, allegianceGroup } = structure;
    
    // Parse date and cultural info
    const { era, culturalZone, year } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        return {
            era: dateInfo.era as HistoricalEra,
            culturalZone: mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year),
            year: dateInfo.year
        };
    }, [mapData.timeSlice, mapData.continent]);
    
    // Get time of day
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);
    
    // Generate farm family
    const farmFamily = useMemo(() => {
        const seed = location[0] * 1000 + location[1];
        return generateFarmFamily(seed, culturalZone);
    }, [location, culturalZone]);
    
    // Generate religions
    const religions = useMemo(() => {
        return generateReligions(culturalZone, era);
    }, [culturalZone, era]);
    
    // Get faction data for allegiance
    const [allegiance, setAllegiance] = useState<string>('Generally loyal to Local Authorities');
    
    useEffect(() => {
        // Get the region name
        const regionName = mapData.mapAreaName || Object.keys(GEOGRAPHICAL_DATA[culturalZone] || {})[0];
        
        if (regionName) {
            const factionData = FACTION_DATA[culturalZone]?.[regionName]?.[era];
            if (factionData) {
                // Farmers have varied loyalty based on location seed
                const loyaltySeed = (location[0] + location[1]) * 13 % 100;
                
                if (loyaltySeed < 40) {
                    // Loyal to dominant power
                    setAllegiance(`Loyal to ${factionData.dominantPower || 'Local Authorities'}`);
                } else if (loyaltySeed < 70 && factionData.secondaryGroups && factionData.secondaryGroups.length > 0) {
                    // Loyal to secondary group
                    const secondaryGroup = factionData.secondaryGroups[loyaltySeed % factionData.secondaryGroups.length];
                    setAllegiance(`Sympathetic to ${secondaryGroup}`);
                } else if (loyaltySeed < 85) {
                    // Independent/neutral
                    setAllegiance('Independent, wary of authorities');
                } else {
                    // Disloyal/resistant
                    setAllegiance(`Resistant to ${factionData.dominantPower || 'authorities'}`);
                }
            }
        }
    }, [culturalZone, era, mapData.mapAreaName, location]);
    
    // Get tile info for crop type and biome
    const tile = mapData.tiles[location[1]]?.[location[0]];
    const cropType = tile?.cropType || 'Mixed Crops';
    const biomeType = tile?.biome || BiomeType.GRASSLAND;
    const biomeDisplay = BIOME_DISPLAY_NAMES[biomeType] || 'Grassland';
    const climateDisplay = CLIMATE_DISPLAY_NAMES[mapData.climate] || 'Temperate';
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col animate-popIn" 
                 onClick={e => e.stopPropagation()}>
                
                {/* Enhanced Banner with zoomed-in farm view */}
                <header className="relative w-full h-[200px] rounded-t-xl overflow-hidden shrink-0">
                    {/* Dynamic background based on time and season */}
                    <div className={`absolute inset-0 ${
                        timeOfDay === 'Night' ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900' :
                        timeOfDay === 'Dawn' || timeOfDay === 'Dusk' ? 'bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700' :
                        season === 'winter' ? 'bg-gradient-to-br from-gray-400 via-blue-300 to-white' :
                        season === 'fall' ? 'bg-gradient-to-br from-orange-700 via-amber-600 to-yellow-600' :
                        season === 'spring' ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-500' :
                        'bg-gradient-to-br from-blue-500 via-cyan-400 to-green-500'
                    }`}></div>
                    
                    {/* Animated farm scene - zoomed in view */}
                    <div className="absolute inset-0 flex items-end justify-center">
                        {/* Large farm building */}
                        <div className="relative mb-8 scale-150">
                            <div className="w-40 h-32 bg-red-800 relative shadow-2xl">
                                {/* Roof */}
                                <div className="absolute inset-x-0 -top-16 w-0 h-0 border-l-[80px] border-r-[80px] border-b-[64px] border-l-transparent border-r-transparent border-b-red-900"></div>
                                {/* Windows */}
                                <div className="absolute top-6 left-6 w-8 h-8 bg-yellow-200 opacity-80"></div>
                                <div className="absolute top-6 right-6 w-8 h-8 bg-yellow-200 opacity-80"></div>
                                {/* Door */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-amber-800"></div>
                                {/* Chimney with smoke */}
                                <div className="absolute -top-20 right-8 w-4 h-12 bg-gray-700">
                                    {(timeOfDay === 'Night' || season === 'winter') && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                            <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse mt-1 -ml-0.5 opacity-60"></div>
                                            <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse mt-1 -ml-1 opacity-40"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Detailed crop fields */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-800 to-green-600 opacity-70"></div>
                        <div className="absolute bottom-0 left-0 right-0 flex">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="flex-1 h-16 border-r border-green-900 bg-gradient-to-t from-green-900 to-green-700 opacity-50"></div>
                            ))}
                        </div>
                        
                        {/* Animals near barn */}
                        <div className="absolute bottom-12 left-16 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🐄</div>
                        <div className="absolute bottom-14 right-20 text-xl animate-bounce" style={{ animationDelay: '1s' }}>🐓</div>
                        <div className="absolute bottom-13 right-32 text-xl animate-bounce" style={{ animationDelay: '2s' }}>🐓</div>
                    </div>
                    
                    {/* Weather effects overlay */}
                    {season === 'winter' && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-fall"
                                     style={{ 
                                         left: `${Math.random() * 100}%`, 
                                         animationDelay: `${Math.random() * 5}s`,
                                         animationDuration: `${2 + Math.random() * 3}s`
                                     }}></div>
                            ))}
                        </div>
                    )}
                    
                    {/* Header text overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h2 className="text-2xl font-bold text-white mb-1" style={{ textShadow: '2px 2px 4px #000' }}>
                            {name || 'Farm'}
                        </h2>
                        <p className="text-sm text-slate-200 italic" style={{ textShadow: '1px 1px 2px #000' }}>
                            Traditional farming, {cropType.toLowerCase()} cultivation
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-300 mt-2" style={{ textShadow: '1px 1px 2px #000' }}>
                            <span>📍 {biomeDisplay}</span>
                            <span>•</span>
                            <span>🌡️ {climateDisplay}</span>
                            <span>•</span>
                            <span>🕐 {timeOfDay}</span>
                            <span>•</span>
                            <span>🍂 {season.charAt(0).toUpperCase() + season.slice(1)}</span>
                        </div>
                    </div>
                    
                    {/* Close button */}
                    <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-600/80 text-white rounded-full hover:bg-red-500 transition-colors shadow-lg">
                        ×
                    </button>
                </header>
                
                {/* Content with better organization */}
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* Left Column - Demographics */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                                    <span>👥</span> Demographics
                                </h3>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Est. Population</span>
                                        <span className="text-white font-bold text-base">{farmFamily.population}</span>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 pt-3">
                                        <span className="text-slate-400 block mb-2">Dominant Religions:</span>
                                        <div className="space-y-1">
                                            {religions.map((religion, i) => (
                                                <div key={i} className="flex justify-between items-center pl-4">
                                                    <span className="text-slate-300">{religion.name}</span>
                                                    <span className="text-white font-semibold">{religion.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 pt-3">
                                        <span className="text-slate-400 block mb-1">Prominent Families:</span>
                                        <div className="pl-4">
                                            <span className="text-white font-bold">{farmFamily.familyName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Economy & Allegiance */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                                    <span>💰</span> Economy & Allegiance
                                </h3>
                                
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-slate-400 block mb-1">Economic Profile:</span>
                                        <ul className="pl-4 space-y-1 text-slate-300">
                                            <li>• Primary professions: Farmer, Laborer</li>
                                            <li>• Main crop: {cropType}</li>
                                            <li>• Trade connections: Local markets</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="border-t border-slate-600 pt-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-slate-400">Allegiance</span>
                                            <span className="text-white text-right max-w-[60%] font-semibold">{allegiance}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Column - Representative Inhabitants */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-fit">
                            <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                                <span>👨‍👩‍👧‍👦</span> Representative Inhabitants
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {farmFamily.members.slice(0, 4).map((member, i) => (
                                    <div key={i} className="bg-slate-900/60 rounded-lg p-3 text-center hover:bg-slate-900/80 transition-colors">
                                        <div className="text-3xl mb-2">{member.portrait}</div>
                                        <div className="text-sm font-bold text-white">
                                            {member.name.split(' ')[0]}
                                        </div>
                                        <div className="text-sm font-bold text-white">
                                            {member.name.split(' ').slice(1).join(' ')}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">{member.age}, {member.role}</div>
                                    </div>
                                ))}
                            </div>
                            
                            {farmFamily.members.length > 4 && (
                                <p className="text-xs text-slate-400 text-center mt-4 italic">
                                    ...and {farmFamily.members.length - 4} other family members
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <footer className="border-t border-slate-700 p-4 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold">
                        Close
                    </button>
                </footer>
            </div>
            
            {/* Add animation styles */}
            <style jsx>{`
                @keyframes fall {
                    from { transform: translateY(-10px); }
                    to { transform: translateY(200px); }
                }
            `}</style>
        </div>
    );
};

export default FarmModal;