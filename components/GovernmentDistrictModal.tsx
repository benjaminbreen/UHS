/**
 * components/GovernmentDistrictModal.tsx - Modal for interacting with government buildings
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Tile, PlayerCharacter, MapData, TerrainStructure, HistoricalEra } from '../types';
import { parseDateString } from '../utils/dateUtils';
import GovernmentBanner, { GovernmentType } from './GovernmentBanner';
import { EUROPEAN_FACTIONS } from '../constants/gameData/factions/european';
import { EAST_ASIAN_FACTIONS } from '../constants/gameData/factions/eastAsian';
import { MENA_FACTIONS } from '../constants/gameData/factions/mena';
import { SOUTH_ASIAN_FACTIONS } from '../constants/gameData/factions/southAsian';
import { SUB_SAHARAN_AFRICAN_FACTIONS } from '../constants/gameData/factions/subSaharanAfrican';
import { SOUTH_AMERICAN_FACTIONS } from '../constants/gameData/factions/southAmerican';
import { NORTH_AMERICAN_COLONIAL_FACTIONS } from '../constants/gameData/factions/northAmericanColonial';
import { NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS } from '../constants/gameData/factions/northAmericanPreColumbian';
import { OCEANIA_FACTIONS } from '../constants/gameData/factions/oceania';

interface GovernmentDistrictModalProps {
    structure: TerrainStructure;
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    currentLocation: string;
    formattedDate: string;
    onClose: () => void;
}

interface GovernmentInfo {
    buildingName: string;
    buildingType: GovernmentType;
    buildingDescription: string;
    dominantPower: string;
    dominantPowerDescription: string;
    eraContext: string;
    allegianceGroups: Array<{name: string, type: string, description: string}>;
    interactions: string[];
}

// Map culture zones to faction data
const FACTION_DATA_MAP = {
    'Europe': EUROPEAN_FACTIONS.EUROPEAN || {},
    'MENA': MENA_FACTIONS.MENA || {},
    'East Asia': EAST_ASIAN_FACTIONS.EAST_ASIAN || {},
    'South Asia': SOUTH_ASIAN_FACTIONS.SOUTH_ASIAN || {},
    'Sub Saharan Africa': SUB_SAHARAN_AFRICAN_FACTIONS.SUB_SAHARAN_AFRICAN || {},
    'South America': SOUTH_AMERICAN_FACTIONS.SOUTH_AMERICAN || {},
    'North America': {
        ...NORTH_AMERICAN_COLONIAL_FACTIONS.NORTH_AMERICAN || {},
        ...NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS.NORTH_AMERICAN || {}
    },
    'Oceania': OCEANIA_FACTIONS.OCEANIA || {}
};

const GovernmentDistrictModal: React.FC<GovernmentDistrictModalProps> = ({
    structure,
    tile,
    playerCharacter,
    mapData,
    currentLocation,
    formattedDate,
    onClose
}) => {
    const [governmentInfo, setGovernmentInfo] = useState<GovernmentInfo | null>(null);

    const { era, year } = useMemo(() => {
        // Use mapData.timeSlice which contains the year string
        return parseDateString(mapData.timeSlice || '1650');
    }, [mapData.timeSlice]);

    useEffect(() => {
        const generateGovernmentInfo = (): GovernmentInfo => {
            // Get culture zone from currentLocation
            let cultureZone = 'Europe'; // Default fallback
            for (const zone of Object.keys(FACTION_DATA_MAP)) {
                if (currentLocation.includes(zone) || zone.includes(currentLocation.split(' ')[0])) {
                    cultureZone = zone;
                    break;
                }
            }

            const factionData = FACTION_DATA_MAP[cultureZone as keyof typeof FACTION_DATA_MAP];
            const regionData = factionData[currentLocation];
            const eraData = regionData?.[era];

            // Determine building type based on era and culture
            const getBuildingInfo = (): { name: string, desc: string, type: GovernmentType } => {
                switch (era) {
                    case HistoricalEra.ANTIQUITY:
                        if (cultureZone === 'Europe') return { name: 'Forum', desc: 'A grand public square where citizens gather to hear proclamations and conduct civic business.', type: 'forum' };
                        if (cultureZone === 'MENA') return { name: 'Palace Complex', desc: 'An imposing administrative center where regional governors hold court.', type: 'palace_complex' };
                        if (cultureZone === 'East Asia') return { name: 'Commandery Office', desc: 'A formal administrative building where imperial officials manage local affairs.', type: 'commandery' };
                        return { name: 'Tribal Council Grounds', desc: 'A sacred meeting place where tribal leaders gather to make decisions for the community.', type: 'tribal_council' };
                    
                    case HistoricalEra.MEDIEVAL:
                        if (cultureZone === 'Europe') return { name: 'Great Hall', desc: 'A fortified manor house serving as the seat of local lordship and justice.', type: 'great_hall' };
                        if (cultureZone === 'MENA') return { name: 'Diwan', desc: 'The administrative court where the local ruler holds audience and dispenses justice.', type: 'diwan' };
                        if (cultureZone === 'East Asia') return { name: 'Prefecture Hall', desc: 'An elegant compound where imperial magistrates govern according to the Mandate of Heaven.', type: 'prefecture' };
                        return { name: 'Royal Palace', desc: 'The seat of a powerful kingdom, adorned with symbols of divine authority.', type: 'royal_palace' };
                    
                    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
                        if (cultureZone === 'Europe') return { name: 'Town Hall', desc: 'A Renaissance civic building where merchant guilds and city councils meet.', type: 'town_hall' };
                        if (cultureZone === 'MENA') return { name: 'Court of the Pasha', desc: 'An ornate Ottoman administrative building with distinctive Islamic architecture.', type: 'pasha_court' };
                        return { name: 'Colonial Administration', desc: 'A European-style building representing distant imperial authority.', type: 'colonial_admin' };
                    
                    case HistoricalEra.INDUSTRIAL_ERA:
                        return { name: 'Municipal Building', desc: 'A grand Victorian civic center reflecting the prosperity of the industrial age.', type: 'municipal' };
                    
                    case HistoricalEra.MODERN_ERA:
                        return { name: 'Government Complex', desc: 'A modern administrative building with glass facades and efficient bureaucratic design.', type: 'modern_complex' };
                    
                    default:
                        return { name: 'Government Building', desc: 'An administrative center where local officials manage civic affairs.', type: 'default' };
                }
            };

            const buildingInfo = getBuildingInfo();

            // Use faction data if available, otherwise create generic info
            const dominantPower = eraData?.dominantPower || 'Local Authority';
            const dominantPowerDescription = eraData?.dominantPowerDescription || 
                `The governing power maintains order and collects taxes in this region. Their authority is backed by armed forces and administrative control.`;
            const eraContext = eraData?.eraContextSentence || 
                `This is ${era.toLowerCase().replace('_', ' ')}, when political power is concentrated in the hands of those who control territory and trade.`;
            
            const allegianceGroups = eraData?.allegianceGroups || [
                { name: dominantPower, type: 'primary', description: 'The ruling authority in this area.' },
                { name: 'Local Merchants', type: 'secondary', description: 'Traders who depend on government protection.' },
                { name: 'Common Folk', type: 'neutral', description: 'The ordinary people subject to governmental authority.' }
            ];

            // Generate context-appropriate interactions
            const getInteractions = (): string[] => {
                const baseInteractions = [
                    'Petition the Authorities',
                    'Seek an Audience',
                    'Inquire About Local Laws'
                ];

                if (era === HistoricalEra.MODERN_ERA) {
                    return [...baseInteractions, 'File Official Documents', 'Report to Bureaucracy'];
                } else if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
                    return [...baseInteractions, 'Request Royal Favor', 'Present Tribute'];
                } else {
                    return [...baseInteractions, 'Offer Service', 'Seek Protection'];
                }
            };

            return {
                buildingName: buildingInfo.name,
                buildingType: buildingInfo.type,
                buildingDescription: buildingInfo.desc,
                dominantPower,
                dominantPowerDescription,
                eraContext,
                allegianceGroups,
                interactions: getInteractions()
            };
        };

        setGovernmentInfo(generateGovernmentInfo());
    }, [era, currentLocation, structure, mapData.timeSlice]);

    if (!governmentInfo) {
        return null; // Loading
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
                {/* Header Banner */}
                <GovernmentBanner 
                    type={governmentInfo.buildingType}
                    name={governmentInfo.buildingName}
                    location={`${currentLocation} • ${formattedDate}`}
                    dominantPower={governmentInfo.dominantPower}
                    era={era}
                />
                
                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Building Description */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">🏛️ The Building</h3>
                        <p className="text-slate-300 leading-relaxed">
                            {governmentInfo.buildingDescription} {governmentInfo.eraContext}
                        </p>
                    </div>

                    {/* Political Situation */}
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/50">
                        <h3 className="text-lg font-bold text-blue-300 mb-3">⚔️ Political Situation</h3>
                        <p className="text-blue-200 leading-relaxed mb-4">
                            {governmentInfo.dominantPowerDescription}
                        </p>
                        
                        <div className="space-y-3">
                            <h4 className="text-md font-semibold text-blue-200">Key Powers & Factions:</h4>
                            {governmentInfo.allegianceGroups.map((group, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <span className={`w-3 h-3 rounded-full mt-1 ${
                                        group.type === 'primary' ? 'bg-yellow-400' :
                                        group.type === 'secondary' ? 'bg-blue-400' :
                                        group.type === 'rebel' ? 'bg-red-400' :
                                        'bg-gray-400'
                                    }`}></span>
                                    <div>
                                        <span className="font-semibold text-blue-200">{group.name}</span>
                                        <p className="text-sm text-blue-300">{group.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interaction Options */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">🤝 Available Actions</h3>
                        <p className="text-slate-300 mb-4">
                            What would you like to do at this government building? 
                            <span className="text-yellow-400"> (These interactions will be fully implemented in future updates)</span>
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {governmentInfo.interactions.map((interaction, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        // TODO: Implement LLM-powered quest interactions
                                        alert(`"${interaction}" - This feature will be available in a future update with dynamic quest generation!`);
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 text-left border border-purple-500 opacity-75 hover:opacity-100"
                                >
                                    📋 {interaction}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-4 text-xs text-slate-400 bg-slate-600 rounded p-3">
                            <p><strong>Coming Soon:</strong> Dynamic quest generation, faction relationship tracking, political intrigue missions, and character-driven diplomatic scenarios.</p>
                        </div>
                    </div>

                    {/* Character Status */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">Your Standing</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Reputation:</span>
                                <span className="text-green-400 ml-2">Unknown Visitor</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Wealth:</span>
                                <span className="text-yellow-400 ml-2">{playerCharacter.currency} coins</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Social Class:</span>
                                <span className="text-blue-400 ml-2 capitalize">{playerCharacter.class}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Charisma:</span>
                                <span className="text-purple-400 ml-2">{playerCharacter.stats.charisma}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900 p-4 rounded-b-2xl border-t border-slate-600">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-400">
                            Interactions with government officials can lead to quests, opportunities, or trouble
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                        >
                            Leave the Building
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GovernmentDistrictModal;