/**
 * components/PlayerProfileCard.tsx - Reusable player profile display component
 */
import React, { useMemo, useState } from 'react';
import { PlayerCharacter } from '../types';
import { AnimatedPortrait } from './portraits';
import { AttributeBadgeList } from './AttributeBadge';
import AttributeModal from './AttributeModal';

interface PlayerProfileCardProps {
  playerCharacter: PlayerCharacter;
  showActions?: boolean;
  onUseSkill?: (skillId: string) => void;
  onProfileClick?: () => void;
}

const SKILL_BUTTON_ORDER = ['speak', 'dig', 'ride', 'craft'];
const SKILL_DATA: Record<string, { name: string; icon: string; description: string }> = {
  speak: { name: 'Speak', icon: '💬', description: 'Talk to NPCs' },
  dig: { name: 'Dig', icon: '⛏️', description: 'Search for items' },
  ride: { name: 'Ride', icon: '🐎', description: 'Mount/dismount' },
  craft: { name: 'Craft', icon: '🔨', description: 'Create items' }
};

const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({ 
  playerCharacter, 
  showActions = false, 
  onUseSkill,
  onProfileClick 
}) => {
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  
  const healthPercent = useMemo(() => (playerCharacter.health / playerCharacter.maxHealth) * 100, [playerCharacter.health, playerCharacter.maxHealth]);
  const fatiguePercent = useMemo(() => (playerCharacter.fatigue / playerCharacter.maxFatigue) * 100, [playerCharacter.fatigue, playerCharacter.maxFatigue]);
  const xpPercent = useMemo(() => (playerCharacter.experience / playerCharacter.maxExperience) * 100, [playerCharacter.experience, playerCharacter.maxExperience]);
  const repPercent = useMemo(() => playerCharacter.mapReputation || 0, [playerCharacter.mapReputation]);
  
  const statusInfo = useMemo(() => {
    if (!playerCharacter) return { text: 'Feeling okay', hasDisease: false, diseaseName: null };
    
    // Check for weather effects first (highest priority for immediate danger)
    const weatherEffects = playerCharacter.statusEffects?.filter(e => 
      ['feeling_cold', 'feeling_hot', 'feeling_wet'].includes(e.type)
    ) || [];
    
    if (weatherEffects.length > 0) {
      const coldEffect = weatherEffects.find(e => e.type === 'feeling_cold');
      const hotEffect = weatherEffects.find(e => e.type === 'feeling_hot');
      const wetEffect = weatherEffects.find(e => e.type === 'feeling_wet');
      
      if (coldEffect) {
        return { 
          text: '❄️ Feeling cold', 
          hasDisease: false, 
          diseaseName: null,
          isWeatherEffect: true 
        };
      
      }
    }
    
    // Check for active diseases (second priority)
    if (playerCharacter.diseaseHealth && playerCharacter.diseaseHealth.currentDiseases) {
      const diseaseHealth = playerCharacter.diseaseHealth;
      if (diseaseHealth.currentDiseases && diseaseHealth.currentDiseases.length > 0) {
        const activeSymptomaticDiseases = diseaseHealth.currentDiseases.filter(
          (activeDisease: any) => activeDisease.stage === 'symptomatic' || activeDisease.stage === 'active'
        );
        
        if (activeSymptomaticDiseases.length > 0) {
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
    
    // Health-based status messages
    const healthPct = playerCharacter.health / playerCharacter.maxHealth;
    const fatiguePct = playerCharacter.fatigue / playerCharacter.maxFatigue;
    
    if (healthPct < 0.2) return { text: 'Critically injured', hasDisease: false, diseaseName: null };
    if (healthPct < 0.4) return { text: 'Badly wounded', hasDisease: false, diseaseName: null };
    if (fatiguePct > 0.8) return { text: 'Exhausted', hasDisease: false, diseaseName: null };
    if (fatiguePct > 0.6) return { text: 'Very tired', hasDisease: false, diseaseName: null };
    if (healthPct < 0.6) return { text: 'Injured', hasDisease: false, diseaseName: null };
    if (fatiguePct > 0.4) return { text: 'Tired', hasDisease: false, diseaseName: null };
    if (healthPct > 0.9 && fatiguePct < 0.2) return { text: 'Feeling great', hasDisease: false, diseaseName: null };
    
    return { text: 'Feeling okay', hasDisease: false, diseaseName: null };
  }, [playerCharacter]);

  return (
    <div className="p-3 bg-gradient-to-b from-slate-800/90 to-slate-900/80 backdrop-blur-sm">
      {/* Player Profile Card */}
      <div className="relative p-3 border rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-600/50">
        <div 
          className={`flex items-start gap-3 ${onProfileClick ? 'cursor-pointer' : ''}`}
          onClick={onProfileClick}
        >
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-full overflow-hidden relative border-2 border-slate-600 shadow-2xl bg-gradient-to-br from-slate-700 to-slate-800">
              <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-br from-transparent via-transparent to-black/50"></div>
              <div className="absolute inset-0 z-10 pointer-events-none rounded-full bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              <div className="flex items-center justify-center w-full h-full">
                <AnimatedPortrait
                  character={playerCharacter}
                  size={96}
                  trackChanges={true}
                />
              </div>
              <div className="absolute -inset-1 rounded-full -z-10 blur-sm bg-gradient-to-br from-slate-400/40 to-slate-600/40"></div>
            </div>
            
            {/* Attribute badges */}
            {playerCharacter.attributes && playerCharacter.attributes.length > 0 && (
              <div className="absolute -top-1 -left-1 z-20">
                <AttributeBadgeList
                  badges={playerCharacter.attributes}
                  maxDisplay={3}
                  size="small"
                  onBadgeClick={() => setShowAttributeModal(true)}
                />
              </div>
            )}
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
            {playerCharacter.diseaseHealth && playerCharacter.diseaseHealth.currentDiseases && playerCharacter.diseaseHealth.currentDiseases.length > 0 && (
              <div className="mt-2">
                {playerCharacter.diseaseHealth.currentDiseases.map((disease: any, index: number) => (
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
            
            {/* Status text */}
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
        
        {/* Health/Fatigue/XP Bars */}
        <div className="space-y-2 mt-2">
          <div>
            <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
              <span>HEALTH</span>
              <span>{Math.ceil(playerCharacter.health)} / {Math.ceil(playerCharacter.maxHealth)}</span>
            </div>
            <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner">
              <div className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 shadow-sm" 
                style={{ width: `${healthPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
              <span>FATIGUE</span>
              <span>{Math.ceil(playerCharacter.fatigue)} / {Math.ceil(playerCharacter.maxFatigue)}</span>
            </div>
            <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner">
              <div className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-amber-400 via-amber-600 to-orange-600 shadow-sm" 
                style={{ width: `${fatiguePercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 text-[0.625rem] font-semibold tracking-widest text-gray-400">
              <span>EXPERIENCE</span>
              <span>{Math.ceil(playerCharacter.experience)} / {Math.ceil(playerCharacter.maxExperience)}</span>
            </div>
            <div className="w-full h-1.5 overflow-hidden bg-gray-700 rounded-full shadow-inner">
              <div className="h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm" 
                style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons - Only show if requested */}
      {showActions && onUseSkill && (
        <div className="mt-3">
          <h4 className="mb-2 text-xs tracking-wider text-gray-400 uppercase">Actions</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {SKILL_BUTTON_ORDER.map(skillId => {
              const skill = SKILL_DATA[skillId];
              if (!skill) return null;
              return (
                <button 
                  key={skillId} 
                  onClick={() => onUseSkill(skillId)} 
                  className="flex flex-col items-center justify-center px-2 py-1.5 text-md font-semibold text-gray-300 transition-all duration-200 border rounded-lg bg-gradient-to-br from-slate-700/80 to-slate-800/60 border-gray-600/50 hover:bg-gradient-to-br hover:from-slate-600/90 hover:to-slate-700/70 hover:border-blue-400/50 hover:text-white hover:shadow-lg"
                  style={{ aspectRatio: '1 / 0.7' }}
                  title={skill.description}
                >
                  <div className="mb-0.5 text-base" style={{
                    filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.3))',
                    textShadow: '0 0 8px rgba(255, 255, 255, 0.4)'
                  }}>{skill.icon}</div>
                  <span className="text-[11px] leading-tight text-center">{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Attribute Modal */}
      {showAttributeModal && playerCharacter.attributes && (
        <AttributeModal
          isOpen={showAttributeModal}
          onClose={() => setShowAttributeModal(false)}
          attributes={playerCharacter.attributes}
          characterName={playerCharacter.name}
        />
      )}
    </div>
  );
};

export default PlayerProfileCard;