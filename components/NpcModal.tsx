/**
 * components/NpcModal.tsx - A comprehensive, tabbed modal for NPC/Player details.
*/
import React, { useState } from 'react';
import { NpcEntity, PlayerCharacter, Appearance, Point, BiomeType } from '../../types';
import { ProceduralPortrait } from './portraits';
import BeliefsPanel from './BeliefsPanel';
import { formatAppearanceText } from '../utils/colorUtils';
import { useMap } from '../contexts/MapContext';
import { getRelativeDirection } from '../utils/geographyUtils';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import { mapLocationToCulture } from '../utils/mapUtils';
import { useGame } from '../contexts/GameContext';

interface NpcModalProps {
  npc: NpcEntity | PlayerCharacter;
  onClose: () => void;
  isPlayer?: boolean;
}

type NpcModalTab = 'overview' | 'stats' | 'beliefs' | 'equipment' | 'life-history' | 'goal' | 'history';

const cmToFeetAndInches = (cm: number): string => {
    if (!cm) return `N/A`;
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
};

const kgToLbs = (kg: number): string => {
    if (!kg) return 'N/A';
    return `${Math.round(kg * 2.20462)} lbs`;
};

const StatDisplay: React.FC<{ label: string, value: number, icon?: string }> = ({ label, value, icon = '📊' }) => {
    const percentage = (value / 10) * 100; // Assuming max value of 10 for base stats
    const colorClass = value > 7 ? 'bg-green-500' : value > 4 ? 'bg-yellow-500' : 'bg-red-500';
  
    return (
        <div className="text-sm mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300 flex items-center gap-2">
                    <span className="w-4 text-center">{icon}</span>
                    {label}
                </span>
                <span className="font-mono text-white font-bold">{value}/10</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percentage}%` }}/>
            </div>
        </div>
    );
};

const TraitDisplay: React.FC<{ label: string, value: number, icon?: string }> = ({ label, value, icon = '🧠' }) => {
    const percentage = value * 100;
    const intensity = value > 0.8 ? 'Very High' : value > 0.6 ? 'High' : value > 0.4 ? 'Moderate' : value > 0.2 ? 'Low' : 'Very Low';
    const colorClass = value > 0.7 ? 'bg-sky-500' : value > 0.4 ? 'bg-teal-500' : 'bg-slate-500';
  
    return (
        <div className="text-sm mb-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">{label}</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{intensity}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percentage}%` }}/>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
        <span className="text-slate-400 text-xs uppercase tracking-wider">{label}</span> 
        <span className="font-semibold text-white capitalize text-right text-sm">{value}</span>
    </div>
);


const TabButton: React.FC<{
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
        isActive
          ? 'text-blue-400 border-blue-400 bg-blue-500/10'
          : 'text-gray-400 border-transparent hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const NpcModal: React.FC<NpcModalProps> = ({ npc, onClose, isPlayer: isExplicitlyPlayer = false }) => {
  const [activeTab, setActiveTab] = useState<NpcModalTab>('overview');
  const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const { terrainStructures, mapData } = useMap();
  const { gameDate, currentZone } = useGame();

  if (!npc) return null;

  const isPlayer = isExplicitlyPlayer || 'party' in npc;
  
  const targetName = npc.name;
  const profession = isPlayer ? (npc as PlayerCharacter).profession : (npc as NpcEntity).role;
  const socialClass = isPlayer ? (npc as PlayerCharacter).class || 'Adventurer' : (npc as NpcEntity).class;
  const description = isPlayer ? (npc as PlayerCharacter).backstory : (npc as NpcEntity).descriptions.long;
  const appearance = npc.appearance;

  const getWealthColor = (wealth: string) => {
    switch (wealth) {
      case 'noble': return '#a855f7';
      case 'wealthy': return '#f59e0b';
      case 'comfortable': return '#3b82f6';
      case 'modest': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'beliefs':
            return <BeliefsPanel character={npc} />;
        case 'equipment':
             if (isPlayer) return <div className="p-4 text-center text-gray-500">Player equipment is managed in the main Character Profile.</div>;
            const npcEntity = npc as NpcEntity;
            const equipmentItems = [
                { label: 'Headgear', value: formatAppearanceText(npcEntity.equippedItems?.head || appearance?.headgear, appearance?.palette?.secondary) },
                { label: 'Garment', value: formatAppearanceText(npcEntity.equippedItems?.torso || appearance?.garment, appearance?.palette?.primary) },
                { label: 'Accessory', value: formatAppearanceText(npcEntity.equippedItems?.amulet || appearance?.accessory, appearance?.palette?.accent) },
                { label: 'Belt', value: formatAppearanceText(npcEntity.equippedItems?.belt || appearance?.belt, appearance?.palette?.secondary) },
                { label: 'Footwear', value: formatAppearanceText(npcEntity.equippedItems?.feet || appearance?.footwear, appearance?.palette?.secondary) }
            ].filter(item => item.value && !item.value.toLowerCase().includes('nothing'));

            return (
                <div className="p-6">
                    <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Worn Items</h4>
                    <dl className="text-sm space-y-3">
                        {equipmentItems.map(item => (
                            <div key={item.label} className="grid grid-cols-3 gap-4 p-3 bg-slate-800/40 rounded-md">
                                <dt className="text-gray-400 font-medium">{item.label}</dt>
                                <dd className="col-span-2 text-white capitalize flex items-center gap-2">
                                  <span>{item.value}</span>
                                </dd>
                            </div>
                        ))}
                         <div className="grid grid-cols-3 gap-4 p-3 bg-slate-800/40 rounded-md">
                             <dt className="text-gray-400 font-medium">Physical</dt>
                             <dd className="col-span-2 text-white capitalize">
                                 {appearance?.build} build, {appearance?.facialHair ? `with ${appearance.facialHairStyle?.replace(/_/g, ' ')}` : 'clean-shaven'}
                             </dd>
                         </div>
                    </dl>
                </div>
            );
        case 'life-history':
            if (isPlayer) return <div className="p-4 text-center text-gray-500">Your story is yet to be written.</div>;
            const { lifeEvents = [], family = [] } = npc as NpcEntity;
            return (
                <div className="p-6 grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Family</h4>
                        <div className="space-y-4 text-sm">
                            {(['father', 'mother'] as const).map(rel => {
                                const member = family.find(f => f.relation === rel);
                                if (!member) return null;
                                return <div key={rel}><strong>{member.relation.charAt(0).toUpperCase() + member.relation.slice(1)}:</strong> {member.name} ({member.profession})</div>
                            })}
                            {(['spouse'] as const).map(rel => {
                                const member = family.find(f => f.relation === rel);
                                if (!member) return null;
                                return <div key={rel}><strong>Spouse:</strong> {member.name} ({member.profession}, age {member.age})</div>
                            })}
                             <div>
                                <strong>Children:</strong>
                                <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                    {family.filter(f => f.relation === 'son' || f.relation === 'daughter').map(child => (
                                        <li key={child.name}>{child.name} (age {child.age})</li>
                                    ))}
                                    {family.filter(f => f.relation === 'son' || f.relation === 'daughter').length === 0 && <li>None</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Timeline</h4>
                        <div className="relative border-l-2 border-gray-600 pl-6 space-y-6">
                            {lifeEvents.map((event, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[30.5px] top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-800"></div>
                                    <div className="text-xs text-gray-400 font-semibold">{event.year}</div>
                                    <div className="text-sm text-white">{event.event}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        case 'goal':
             if (isPlayer) return <div className="p-4 text-center text-gray-500">Your goals are your own to decide.</div>;
             return (
                <div className="p-6">
                    <h4 className="font-semibold text-lg text-blue-400 mb-3 border-b border-slate-700 pb-2">Personal Goal</h4>
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 text-base">
                        "{(npc as NpcEntity).personalGoal?.description || 'To live a quiet life.'}"
                    </blockquote>
                </div>
             );
        case 'history':
             return <div className="p-6 text-center text-gray-500 italic">You have not spoken with this person yet.</div>;
        case 'stats':
            return (
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-blue-300 mb-4 border-b border-slate-700 pb-2">PHYSICAL ATTRIBUTES</h4>
                        <div className="space-y-4">
                            <StatDisplay label="Strength" value={npc.stats.strength} icon="💪" />
                            <StatDisplay label="Dexterity" value={npc.stats.dexterity} icon="🤸" />
                            <StatDisplay label="Constitution" value={npc.stats.constitution} icon="❤️" />
                            <StatDisplay label="Stamina" value={npc.stats.stamina} icon="⚡" />
                        </div>
                         <h4 className="font-semibold text-blue-300 mb-4 border-b border-slate-700 pb-2 mt-6">MENTAL ATTRIBUTES</h4>
                        <div className="space-y-4">
                            <StatDisplay label="Intelligence" value={npc.stats.intelligence} icon="🧠" />
                            <StatDisplay label="Perception" value={npc.stats.perception} icon="👁️" />
                            <StatDisplay label="Craftiness" value={npc.stats.craftiness} icon="🛠️" />
                            <StatDisplay label="Persuasion" value={npc.stats.persuasion} icon="💬" />
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-blue-300 mb-4 border-b border-slate-700 pb-2">PHYSICAL DETAILS</h4>
                        <div className="text-sm space-y-3 p-4 bg-slate-800/50 rounded-md border border-slate-700">
                            <div className="flex justify-between"><strong>Gender:</strong> <span className="capitalize">{npc.gender}</span></div>
                            <div className="flex justify-between"><strong>Height:</strong> <span>{cmToFeetAndInches(appearance?.height)}</span></div>
                            <div className="flex justify-between"><strong>Weight:</strong> <span>{kgToLbs(appearance?.weight)}</span></div>
                            <div className="flex justify-between"><strong>Build:</strong> <span className="capitalize">{appearance?.build}</span></div>
                            <div className="flex justify-between"><strong>Hair Style:</strong> <span className="capitalize">{appearance?.hairstyle.replace(/_/g, ' ')}</span></div>
                            <div className="flex justify-between items-center"><strong>Hair Color:</strong> <div className="w-4 h-4 rounded-full border border-slate-500" style={{backgroundColor: appearance?.hairColor}}></div></div>
                            <div className="flex justify-between items-center"><strong>Eye Color:</strong> <div className="w-4 h-4 rounded-full border border-slate-500" style={{backgroundColor: appearance?.eyeColor}}></div></div>
                            <div className="flex justify-between"><strong>Affect:</strong> <span className="capitalize">{appearance?.affect}</span></div>
                            <div className="flex justify-between"><strong>Birthplace:</strong> <span className="capitalize">{npc.birthplace}</span></div>
                        </div>
                    </div>
                </div>
            );
        case 'overview':
        default:
            let workLocation = 'Unemployed';
            if (!isPlayer) {
                const npcEntity = npc as NpcEntity;
                const workplace = terrainStructures?.find(s => s.id === npcEntity.workplaceId);
                if (workplace) {
                    workLocation = `Works at ${workplace.name}`;
                } else if (npcEntity.role.toLowerCase() !== 'wanderer') {
                    workLocation = `Works as a ${npcEntity.role} locally`;
                }
            }
            
            let homeLocation = 'No permanent residence';
            if (!isPlayer && (npc as NpcEntity).homeLocation) {
                 const npcEntity = npc as NpcEntity;
                 homeLocation = `Lives in a settlement ${getRelativeDirection({x: npcEntity.x, y: npcEntity.y}, npcEntity.homeLocation as Point)}`;
            }

            return (
                <div className="p-6 grid md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                         {/* Connections Section */}
                        {!isPlayer && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Connections</h3>
                             <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-2 text-sm">
                                <DetailRow label="Livelihood" value={workLocation} />
                                <DetailRow label="Residence" value={homeLocation} />
                            </div>
                        </div>
                        )}
                        {/* Character Info Grid */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Details</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                <div>
                                    <div className="text-slate-400 text-xs">AGE:</div>
                                    <div className="text-white font-semibold">{npc.age} years</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">PROFESSION:</div>
                                    <div className="text-green-400 capitalize">{profession}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">CLASS:</div>
                                    <div className="text-white capitalize">{socialClass.toLowerCase()}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs">RELIGION:</div>
                                    <div className="text-white">{npc.religion}</div>
                                </div>
                            </div>
                        </div>
        
                        {/* Social Context */}
                        <div>
                             <h3 className="text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider">Social Context</h3>
                            <div className="space-y-3">
                                <TraitDisplay label="Privilege" value={npc.socialContext?.privilege || 0} />
                                <TraitDisplay label="Ambition" value={npc.socialContext?.ambition || 0} />
                                <TraitDisplay label="Religiosity" value={npc.socialContext?.religiosity || 0} />
                            </div>
                        </div>
                    </div>
        
                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Background Section */}
                         <div>
                            <h3 className="text-lg font-bold text-amber-400 mb-4 uppercase tracking-wider">Background</h3>
                            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                <p className="font-lora text-base text-slate-200 leading-relaxed italic">
                                    {description}
                                </p>
                            </div>
                        </div>
        
                        {/* Personality */}
                        <div>
                            <h3 className="text-lg font-bold text-purple-400 mb-4 uppercase tracking-wider">Personality</h3>
                            <div className="space-y-3">
                                <TraitDisplay label="Openness" value={npc.personality?.openness || 0} />
                                <TraitDisplay label="Conscientiousness" value={npc.personality?.conscientiousness || 0} />
                                <TraitDisplay label="Extraversion" value={npc.personality?.extraversion || 0} />
                                <TraitDisplay label="Agreeableness" value={npc.personality?.agreeableness || 0} />
                                <TraitDisplay label="Neuroticism" value={npc.personality?.neuroticism || 0} />
                            </div>
                        </div>
                    </div>
                </div>
            );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="ff-panel flex flex-col w-full max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 flex justify-between items-start gap-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 border-2 border-gray-600 shadow-lg flex-shrink-0">
                    <ProceduralPortrait
                        character={npc}
                        size={64}
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-blue-300">{targetName}</h3>
                    <p className="text-green-400 font-semibold capitalize">{profession} • {socialClass.toLowerCase()}</p>
                </div>
            </div>
            
            <div className="flex items-start gap-3">
                {/* Health/Disease Badge */}
                {npc.diseaseHealth?.currentDiseases && npc.diseaseHealth.currentDiseases.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-w-xs">
                        {npc.diseaseHealth.currentDiseases.map((disease, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDisease(disease);
                                    setIsDiseaseModalOpen(true);
                                }}
                                className="px-2 py-0.5 bg-pink-600/80 hover:bg-pink-500 text-white text-xs font-bold rounded-full 
                                         border border-pink-400 shadow-md hover:shadow-pink-500/50 transition-all duration-200
                                         flex items-center gap-1 cursor-pointer"
                                title={`Click for details about ${disease.disease.name}`}
                            >
                                <span className="text-sm">{disease.disease.badgeIcon}</span>
                                <span>{disease.disease.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <span className="px-3 py-1 bg-green-600/80 text-white text-xs font-bold rounded-full 
                                   border border-green-400 shadow-md">
                        ✅ Healthy
                    </span>
                )}
                
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white text-3xl font-thin leading-none transition-colors"
                >
                    &times;
                </button>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-800/50">
            <TabButton label="Overview" icon="👁️" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton label="Stats" icon="📊" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            <TabButton label="Beliefs" icon="💭" isActive={activeTab === 'beliefs'} onClick={() => setActiveTab('beliefs')} />
            {!isPlayer && <TabButton label="Equipment" icon="👕" isActive={activeTab === 'equipment'} onClick={() => setActiveTab('equipment')} />}
            {!isPlayer && <TabButton label="Life History" icon="📜" isActive={activeTab === 'life-history'} onClick={() => setActiveTab('life-history')} />}
            {!isPlayer && <TabButton label="Goal" icon="🎯" isActive={activeTab === 'goal'} onClick={() => setActiveTab('goal')} />}
            {!isPlayer && <TabButton label="History" icon="💬" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />}
        </div>
        
        {/* Main Content */}
        <div className="flex-grow overflow-y-auto bg-gray-800/30 scrollbar-thin">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 flex justify-end bg-gray-800/50">
          <button 
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-md transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Disease Modal */}
      {selectedDisease && (
        <DiseaseModal
          disease={selectedDisease}
          isOpen={isDiseaseModalOpen}
          onClose={() => {
            setIsDiseaseModalOpen(false);
            setSelectedDisease(null);
          }}
          currentYear={gameDate.year}
          culturalZone={mapLocationToCulture(currentZone, gameDate.year)}
        />
      )}
    </div>
  );
};

export default NpcModal;