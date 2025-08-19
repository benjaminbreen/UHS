import React, { useMemo, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMap } from '../contexts/MapContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { AnimalEntity, NpcEntity, isAnimal, isNpc, LensMode, MapArchetype, ClimateType, MapAnalysisData, MapData, GameDate, Season, HistoricalEra, CulturalZone, TerrainStructure, Item } from '../types';
import { generateAnimalDescriptions } from '../services/animalDescriptionGenerator';
import { formatDateWithSeason, parseDateString } from '../utils/dateUtils';
import HistoryPanel from './HistoryPanel';
import JournalPanel from './JournalPanel';
import { MAP_ARCHETYPE_DESCRIPTIONS, FACTION_DATA, STRUCTURE_BLUEPRINTS } from '../constants/index';
import { mapLocationToCulture } from '../utils/mapUtils';
import NarrationPanel from './NarrationPanel';
import InventoryPanel from './InventoryPanel';
import BeliefsPanel from './BeliefsPanel';
import { getSafariOptimizedClassName } from '../utils/safariUtils';
import { ProceduralPortrait } from './portraits';
import { SKILL_DATA, SKILL_BUTTON_ORDER } from '../constants/index';
import DiseaseService from '../services/diseaseService';


export type LeftSidebarTab = 'analysis' | 'overview' | 'npcs' | 'animals';
type RightSidebarTab = 'narrator' | 'inventory' | 'beliefs';

const AnimalListItem = React.memo(({ animal, isSelected, onClick, description }: { animal: AnimalEntity; isSelected: boolean; onClick: (animal: AnimalEntity) => void; description: string; }) => {
    return (
        <div onClick={() => onClick(animal)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-gray-300 hover:bg-slate-700/60 hover:shadow-sm ${isSelected ? 'bg-blue-800/70 text-white shadow-md ring-1 ring-blue-400/50' : ''}`}>
            <div className="text-2xl mr-3 flex-shrink-0">{animal.emoji}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{animal.speciesName}</p>
                <div className="text-xs text-gray-400 flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.53-2.475M15 19.128v-3.867m-1.371 3.267c-.24-.02-.48-.052-.728-.082m-4.5-4.243a4.5 4.5 0 118.27 2.135A4.5 4.5 0 0110.5 18c-1.554 0-2.923-.746-3.71-1.867m-1.371-3.267a4.5 4.5 0 015.426-3.318 4.5 4.5 0 011.88 4.041m-5.426-3.318a4.5 4.5 0 00-1.88-2.288M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{description}</span>
                </div>
            </div>
        </div>
    );
});

const NpcListItem = React.memo(({ npc, isSelected, onClick }: { npc: NpcEntity; isSelected: boolean; onClick: (npc: NpcEntity) => void; }) => {
    return (
        <div onClick={() => onClick(npc)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-gray-300 hover:bg-slate-700/60 hover:shadow-sm ${isSelected ? 'bg-blue-800/70 text-white shadow-md ring-1 ring-blue-400/50' : ''}`}>
            <div className="text-2xl mr-3 flex-shrink-0">{npc.emoji}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{npc.name}</p>
                <div className="text-xs text-gray-400 flex items-center mt-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.028.658a.78.78 0 01-.357.901l-1.444.722a.78.78 0 01-1.002-.215zM12 11a5 5 0 015 5v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="truncate">{npc.descriptions.short}</span>
                </div>
            </div>
        </div>
    );
});

const RightSidebar: React.FC = () => {
    const { setIsCharacterProfileModalOpen, onUseSkill, onSend, onCraft } = useUI();
    const { narrationHistory, playerInput, onPlayerInputChange, isNarratorLoading, gameDate, currentZone } = useGame();
    const { playerCharacter } = usePlayer();

    const [activeTab, setActiveTab] = useState<RightSidebarTab>('narrator');

    const statusInfo = useMemo(() => {
        if (!playerCharacter) return { text: 'Feeling okay', hasDisease: false, diseaseName: null };
        
        const healthPercent = playerCharacter.health / playerCharacter.maxHealth;
        const xpPercent = playerCharacter.experience / playerCharacter.maxExperience;
        const fatiguePercent = playerCharacter.fatigue / playerCharacter.maxFatigue;
        const stats = playerCharacter.stats;
    
        // Check for active diseases first (highest priority)
        if (playerCharacter.diseaseHealth && playerCharacter.diseaseHealth.currentDiseases) {
            const diseaseHealth = playerCharacter.diseaseHealth;
            if (diseaseHealth.currentDiseases && diseaseHealth.currentDiseases.length > 0) {
                const activeSymptomaticDiseases = diseaseHealth.currentDiseases.filter(
                    (activeDisease: any) => activeDisease.stage === 'symptomatic' || activeDisease.stage === 'active'
                );
                
                if (activeSymptomaticDiseases.length > 0) {
                    // Get the most severe disease
                    const mostSevereDisease = activeSymptomaticDiseases.reduce((worst: any, current: any) => 
                        current.severity > worst.severity ? current : worst
                    );
                    
                    const disease = mostSevereDisease.disease;
                    const daysSick = mostSevereDisease.contractedDate ? 
                        Math.floor((Date.now() - mostSevereDisease.contractedDate) / (1000 * 60 * 60 * 24)) + 1 : 1;
                    
                    return { 
                        text: `Currently sick with ${disease.severity} ${disease.name.toLowerCase()} (Day ${daysSick})`, 
                        hasDisease: true, 
                        diseaseName: disease.name,
                        severity: disease.severity,
                        daysSick: daysSick
                    };
                }
            }
        }

        // If disease is active, don't show other status text
        // Priority conditions (urgent states) - return regular status text if no disease
        let statusText = '';
        
        if (fatiguePercent > 0.95) statusText = 'Feeling awful';
        else if (fatiguePercent > 0.85) statusText = 'Feeling utterly exhausted';
        else if (fatiguePercent > 0.7) statusText = 'Feeling very weary';
        else if (fatiguePercent > 0.5) statusText = 'Feeling tired';
        else if (fatiguePercent < 0.15) statusText = 'Feeling energetic and refreshed';
        else if (fatiguePercent < 0.3) statusText = 'Feeling well-rested';
        else if (healthPercent < 0.3) statusText = 'Gravely injured and weakened';
        else if (healthPercent < 0.6) statusText = 'Wounded but pushing forward';
        else if (healthPercent < 0.8) statusText = 'Mildly injured';
        else if (xpPercent >= 0.9) statusText = 'On the verge of a breakthrough!';
        else if (xpPercent >= 0.8) statusText = 'Feeling accomplished and inspired';
        else if (xpPercent >= 0.65) statusText = 'Making excellent progress';
        else {
            // Stat-based descriptions for neutral states
            const hourNow = new Date().getHours();
            const seed = Math.floor(hourNow / 1) + playerCharacter.id.charCodeAt(0); // Changes every hour
            Math.floor(seed); // Use deterministic seed
            
            const statDescriptions: string[] = [];
            if (stats.intelligence >= 15) statDescriptions.push('feeling intellectually curious');
            if (stats.intelligence >= 12) statDescriptions.push('feeling thoughtful');
            if (stats.wisdom >= 15) statDescriptions.push('feeling wise and contemplative');
            if (stats.wisdom >= 12) statDescriptions.push('feeling perceptive');
            if (stats.charisma >= 15) statDescriptions.push('feeling socially confident');
            if (stats.charisma >= 12) statDescriptions.push('feeling personable');
            if (stats.strength >= 15) statDescriptions.push('feeling physically powerful');
            if (stats.strength >= 12) statDescriptions.push('feeling strong');
            if (stats.dexterity >= 15) statDescriptions.push('feeling agile and quick');
            if (stats.dexterity >= 12) statDescriptions.push('feeling nimble');
            if (stats.constitution >= 15) statDescriptions.push('feeling robust and hardy');
            if (stats.constitution >= 12) statDescriptions.push('feeling resilient');
            
            if (statDescriptions.length > 0) {
                const index = seed % statDescriptions.length;
                statusText = statDescriptions[index].charAt(0).toUpperCase() + statDescriptions[index].slice(1);
            } else {
                statusText = 'Feeling fine';
            }
        }
        
        return { text: statusText, hasDisease: false, diseaseName: null };
    }, [playerCharacter]);

    const healthPercent = playerCharacter ? (playerCharacter.health / playerCharacter.maxHealth) * 100 : 100;
    const fatiguePercent = playerCharacter ? (playerCharacter.fatigue / playerCharacter.maxFatigue) * 100 : 0;
    const xpPercent = playerCharacter ? (playerCharacter.experience / playerCharacter.maxExperience) * 100 : 0;
    const repPercent = playerCharacter ? playerCharacter.mapReputation : 50;

    return (
        <div className={getSafariOptimizedClassName("h-full flex flex-col w-[380px] flex-shrink-0 bg-sidebar-gradient shadow-sidebar-right backdrop-blur-xl border-l border-slate-700/80 text-slate-200")}>
            <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
                {/* Player Profile Card */}
                <div className="flex-shrink-0 p-4">
                    {playerCharacter && playerCharacter.appearance && (
                         <div 
                            className="p-3 mb-3 transition-all duration-200 border rounded-2xl cursor-pointer bg-gradient-to-br from-slate-800/90 to-slate-900/95 border-slate-600/50 hover:border-slate-500/70 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 hover:scale-[1.02]" 
                            onClick={() => setIsCharacterProfileModalOpen(true)}
                        >
                            <div className="flex items-start gap-4 mb-3">
                               <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-900 border-3 rounded-full border-slate-500/70 shadow-xl shadow-black/50">
                                            <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-br from-transparent via-transparent to-black/50"></div>
                                            <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                                            <div className="flex items-center justify-center w-full h-full">
                                                <ProceduralPortrait
                                                    character={playerCharacter}
                                                    size={96}
                                                />
                                            </div>
                                            <div className="absolute -inset-1 rounded-full -z-10 blur-sm bg-gradient-to-br from-slate-400/40 to-slate-600/40"></div>
                                        </div>
                                        
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-xl font-bold leading-tight text-white">{playerCharacter.name}</h4>
                                            <p className="text-sm font-semibold text-amber-300 capitalize">{playerCharacter.profession}</p>
                                            <p className="mt-1 text-xs text-gray-400">Age {playerCharacter.age} • {playerCharacter.gender || 'Unknown'}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="text-xl font-bold text-blue-300">Level {playerCharacter.level}</p>
                                            <div className="flex items-center justify-end gap-4 mt-1">
                                                <p className="text-sm font-semibold text-yellow-400 flex items-center gap-1" title="Currency">
                                                    <span>💰</span>
                                                    <span>{playerCharacter.currency}</span>
                                                </p>
                                                <p className="text-sm font-semibold text-green-400 flex items-center gap-1" title={`Map Reputation: ${repPercent}/100`}>
                                                    <span>🤝</span>
                                                    <span>{repPercent}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Disease Badges */}
                                    {playerCharacter.diseaseHealth && playerCharacter.diseaseHealth.currentDiseases && (
                                        <div className="mt-2">
                                            {playerCharacter.diseaseHealth.currentDiseases.map((disease, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-600/80 text-white text-xs font-bold rounded-full 
                                                             border border-pink-400 shadow-md mr-2 mb-1"
                                                    title={`${disease.disease.name} - ${disease.disease.severity}`}
                                                >
                                                    <span className="text-sm">{disease.disease.badgeIcon}</span>
                                                    <span>{disease.disease.name}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Show disease status OR regular status, not both */}
                                    {statusInfo.hasDisease ? (
                                        <p className={`mt-2 text-xs font-bold ${
                                            statusInfo.severity === 'critical' || statusInfo.severity === 'severe' ? 'text-red-500' :
                                            statusInfo.severity === 'moderate' ? 'text-orange-500' :
                                            'text-orange-400'
                                        }`}>
                                            {statusInfo.text}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs italic text-amber-200">
                                            {statusInfo.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 mt-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                                        <span>HEALTH</span>
                                        <span>{playerCharacter.health} / {playerCharacter.maxHealth}</span>
                                    </div>
                                    <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner"><div className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 shadow-sm" style={{ width: `${healthPercent}%` }}></div></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                                        <span>FATIGUE</span>
                                        <span>{playerCharacter.fatigue} / {playerCharacter.maxFatigue}</span>
                                    </div>
                                    <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner"><div className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-amber-400 via-amber-600 to-orange-600 shadow-sm" style={{ width: `${fatiguePercent}%` }}></div></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                                        <span>EXPERIENCE</span>
                                        <span>{playerCharacter.experience} / {playerCharacter.maxExperience}</span>
                                    </div>
                                    <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner"><div className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm" style={{ width: `${xpPercent}%` }}></div></div>
                                </div>
                            </div>

                            {/* Disease Status Section */}
                            {playerCharacter && playerCharacter.diseaseHealth && playerCharacter.diseaseHealth.currentDiseases && (
                                <div className="mt-3 p-2 rounded-lg bg-slate-800/30 border border-slate-600/50">
                                    <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
                                        <span>HEALTH STATUS</span>
                                        <span className="text-xs">
                                            {(() => {
                                                const diseaseHealth = playerCharacter.diseaseHealth;
                                                switch (diseaseHealth.overallHealthStatus) {
                                                    case 'critical': return '🔴 CRITICAL';
                                                    case 'sick': return '🔴 SICK';
                                                    case 'mild': return '🟡 MILD';
                                                    case 'healthy': 
                                                    default: 
                                                        return diseaseHealth.currentDiseases?.length > 0 ? '🟡 EXPOSED' : '✅ HEALTHY';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                    
                                    {(() => {
                                        const diseaseHealth = playerCharacter.diseaseHealth;
                                        const activeDiseases = diseaseHealth?.currentDiseases?.filter((d: any) => d.stage === 'symptomatic') || [];
                                        const incubatingDiseases = diseaseHealth?.currentDiseases?.filter((d: any) => d.stage === 'incubating') || [];
                                        
                                        if (activeDiseases.length === 0 && incubatingDiseases.length === 0) {
                                            return (
                                                <div className="text-xs text-green-400">
                                                    No active diseases detected
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="space-y-1">
                                                {activeDiseases.map((activeDisease: any, index: number) => (
                                                    <div key={`active-${index}`} className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <span>{activeDisease.disease.badgeIcon}</span>
                                                            <span className="text-red-300">{activeDisease.disease.name}</span>
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {activeDisease.daysRemaining}d left
                                                        </span>
                                                    </div>
                                                ))}
                                                {incubatingDiseases.map((activeDisease: any, index: number) => (
                                                    <div key={`incubating-${index}`} className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <span>🔄</span>
                                                            <span className="text-yellow-400">Incubating...</span>
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {activeDisease.daysRemaining}d
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mb-2">
                        <h4 className="mb-2 mt-2 text-xs tracking-wider text-gray-400 uppercase">Actions</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {SKILL_BUTTON_ORDER.map(skillId => {
                                 const skill = SKILL_DATA[skillId];
                                 if (!skill) return null;
                                 return (
                                    <button key={skillId} onClick={() => onUseSkill(skillId)} 
                                        className="flex flex-col items-center justify-center p-2 text-md font-semibold text-gray-300 transition-all duration-200 border rounded-lg aspect-square bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50 hover:bg-gradient-to-br hover:from-slate-600/90 hover:to-slate-700/70 hover:border-blue-400/50 hover:text-white hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                                        title={skill.description}>
                                        <div className="mb-0.5 text-base">{skill.icon}</div>
                                        <span className="text-[12px] leading-tight text-center">{skill.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex p-1.5 mx-4 mb-2 bg-slate-800/50 border border-slate-600/50 rounded-xl shrink-0">
                    <button onClick={() => setActiveTab('narrator')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'narrator' ? 'text-white bg-blue-600 shadow-glow-primary' : 'text-slate-400 hover:bg-slate-700/30'}`}>Narrator</button>
                    <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'inventory' ? 'text-white bg-blue-600 shadow-glow-primary' : 'text-slate-400 hover:bg-slate-700/30'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('beliefs')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'beliefs' ? 'text-white bg-blue-600 shadow-glow-primary' : 'text-slate-400 hover:bg-slate-700/30'}`}>Beliefs</button>
                </div>
                
                <div className="flex-1 min-h-0 px-4 pb-4">
                    {activeTab === 'narrator' && (
                        <NarrationPanel 
                            narrationHistory={narrationHistory} 
                            playerInput={playerInput} 
                            onPlayerInputChange={onPlayerInputChange} 
                            onSend={onSend}
                            isLoading={isNarratorLoading}
                        />
                    )}
                    {activeTab === 'inventory' && <InventoryPanel inventory={playerCharacter?.inventory || []} onCraft={onCraft} />}
                    {activeTab === 'beliefs' && <BeliefsPanel character={playerCharacter} />}
                </div>
            </div>
        </div>
    );
};

export default React.memo(RightSidebar);