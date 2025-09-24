import React from 'react';
import { ScrollText, Skull } from 'lucide-react';
import { ProceduralPortrait } from './portraits';
import { PlayerCharacter, FamilyMember } from '../types';
import { EnhancedLifeEvent, EventImportance, EventKind } from '../services/lifeHistoryService';
import {
  Sparkles,
  Heart,
  Sword,
  Hammer,
  BookOpen,
  Users,
  Flame,
  Compass,
  Church,
  Briefcase,
  Baby,
  GraduationCap,
  Wheat,
  Crown,
  Scale,
  Book,
  Ship,
  FlaskConical,
  HeartCrack,
  Biohazard,
  Trophy,
  Activity,
  Handshake
} from 'lucide-react';

const EVENT_ICON: Record<EventKind, any> = {
  birth: Sparkles,
  apprenticeship: Hammer,
  education: GraduationCap,
  romance: Heart,
  marriage: Handshake,
  childbirth: Baby,
  battle: Sword,
  discovery: FlaskConical,
  journey: Ship,
  tragedy: HeartCrack,
  plague: Biohazard,
  achievement: Trophy,
  study: BookOpen,
  guild: Users,
  rival: Skull,
  injury: Activity,
  fire: Flame,
  travel: Compass,
  religious: Church,
  political: Crown,
  trade: Briefcase,
  family: Users,
  legal: Scale,
  artistic: Book,
  agricultural: Wheat,
  maritime: Ship,
  death: Skull
};

const EVENT_COLORS: Record<EventImportance, string> = {
  [EventImportance.MILESTONE]: 'bg-yellow-600 border-yellow-500',
  [EventImportance.TRAGEDY]: 'bg-red-600 border-red-500',
  [EventImportance.INJURY]: 'bg-orange-600 border-orange-500',
  [EventImportance.OPPORTUNITY]: 'bg-green-600 border-green-500',
  [EventImportance.RELATIONSHIP]: 'bg-purple-600 border-purple-500',
  [EventImportance.MUNDANE]: 'bg-slate-600 border-slate-500'
};

interface LifeEvent extends EnhancedLifeEvent {}

interface CharacterHistoryTabProps {
  character: PlayerCharacter;
  expandedLifeEvents: LifeEvent[];
  lifeEventsGenerated: boolean;
  findFamilyEvents: (name: string) => LifeEvent[];
  scrollToEvent: (year: number) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
  highlightedEventYear: number | null;
}

export const CharacterHistoryTab: React.FC<CharacterHistoryTabProps> = ({
  character,
  expandedLifeEvents,
  lifeEventsGenerated,
  findFamilyEvents,
  scrollToEvent,
  timelineRef,
  highlightedEventYear
}) => {
  // Generate siblings from family data
  const siblings = (character.family || []).filter(
    f => f.relation === 'brother' || f.relation === 'sister'
  );

  // Check if family member is deceased based on life events
  const isDeceased = (memberName: string): boolean => {
    return expandedLifeEvents.some(event =>
      event.kind === 'death' &&
      (event.text.toLowerCase().includes(memberName.toLowerCase()) ||
       event.linkedCharacters?.includes('father') && memberName === character.family?.find(f => f.relation === 'father')?.name ||
       event.linkedCharacters?.includes('mother') && memberName === character.family?.find(f => f.relation === 'mother')?.name)
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left column - Family */}
      <div className="lg:w-1/3 p-4 lg:p-6 lg:border-r border-slate-700 overflow-y-auto">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6">
          Family & Lineage
        </h3>

        {/* Parents Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Parents</h4>
          <div className="space-y-3">
            {(['father', 'mother'] as const).map(rel => {
              const parent = (character.family || []).find(f => f.relation === rel);
              if (!parent) return null;

              const parentEvents = findFamilyEvents(parent.name);
              const hasEvents = parentEvents.length > 0;

              return (
                <button
                  key={rel}
                  onClick={() => {
                    if (hasEvents && parentEvents[0]) {
                      scrollToEvent(parentEvents[0].year);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    hasEvents
                      ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer'
                      : 'border-slate-800 cursor-default'
                  }`}
                >
                  {/* Mini portrait */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900 flex-shrink-0">
                    <ProceduralPortrait
                      character={{
                        name: parent.name,
                        gender: rel === 'father' ? 'male' : 'female',
                        age: (parent as any).age || character.age + 25,
                        profession: parent.profession,
                        culturalZone: character.culturalZone,
                        hometown: character.hometown
                      } as any}
                      size={48}
                    />
                    {isDeceased(parent.name) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Skull className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-semibold ${isDeceased(parent.name) ? 'text-slate-400' : 'text-white'}`}>
                        {parent.name}
                      </span>
                      {isDeceased(parent.name) && (
                        <span className="text-xs text-red-400 font-bold uppercase">DECEASED</span>
                      )}
                      {hasEvents && (
                        <span className="text-xs text-blue-400" title="Mentioned in timeline">
                          <ScrollText className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      <span className="capitalize text-blue-400">{rel}</span> • {parent.profession}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Siblings Section */}
        {siblings.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Siblings ({siblings.length})
            </h4>
            <div className="space-y-2">
              {siblings.map((sibling, idx) => {
                const siblingEvents = findFamilyEvents(sibling.name);
                const hasEvents = siblingEvents.length > 0;

                return (
                  <button
                    key={`${sibling.name}-${idx}`}
                    onClick={() => {
                      if (hasEvents && siblingEvents[0]) {
                        scrollToEvent(siblingEvents[0].year);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                      hasEvents
                        ? 'hover:bg-slate-800/50 cursor-pointer'
                        : 'cursor-default'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0">
                      <ProceduralPortrait
                        character={{
                          name: sibling.name,
                          gender: sibling.relation === 'brother' ? 'male' : 'female',
                          age: (sibling as any).age || character.age,
                          profession: (sibling as any).profession || 'Laborer',
                          culturalZone: character.culturalZone,
                          hometown: character.hometown
                        } as any}
                        size={40}
                      />
                      {isDeceased(sibling.name) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Skull className="w-3 h-3 text-white/80" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isDeceased(sibling.name) ? 'text-slate-400' : 'text-white'}`}>
                          {sibling.name}
                        </span>
                        {isDeceased(sibling.name) && (
                          <span className="text-xs text-red-400 font-bold uppercase">DECEASED</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sibling.relation} • Age {(sibling as any).age || '?'}
                      </div>
                    </div>
                    {hasEvents && (
                      <ScrollText className="w-3 h-3 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Children Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Children</h4>
          <div className="space-y-2">
            {(character.family || [])
              .filter(f => f.relation === 'son' || f.relation === 'daughter')
              .map((child, idx) => (
                <div
                  key={`${child.name}-${idx}`}
                  className="flex items-center gap-3 p-2 rounded-lg"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0">
                    <ProceduralPortrait
                      character={{
                        name: child.name,
                        gender: child.relation === 'son' ? 'male' : 'female',
                        age: (child as any).age || 10,
                        profession: 'Child',
                        culturalZone: character.culturalZone,
                        hometown: character.hometown
                      } as any}
                      size={40}
                    />
                    {isDeceased(child.name) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Skull className="w-3 h-3 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDeceased(child.name) ? 'text-slate-400' : 'text-white'}`}>
                        {child.name}
                      </span>
                      {isDeceased(child.name) && (
                        <span className="text-xs text-red-400 font-bold uppercase">DECEASED</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {child.relation} • Age {(child as any).age || '?'}
                    </div>
                  </div>
                </div>
              ))}
            {(character.family || []).filter(f =>
              f.relation === 'son' || f.relation === 'daughter'
            ).length === 0 && (
              <p className="text-sm text-slate-500 italic">No children</p>
            )}
          </div>
        </div>

        {/* Stats Summary for mobile */}
        <div className="lg:hidden mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-xs text-slate-400">
            <div>Born: {character.birthYear || 'Unknown'}</div>
            <div>Age: {character.age}</div>
            <div>Profession: {character.profession}</div>
            <div>Hometown: {character.hometown || 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Right column - Timeline */}
      <div className="flex-1 p-4 lg:p-6 min-h-0 flex flex-col">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
          Life Timeline
        </h3>

        {/* Loading state */}
        {!lifeEventsGenerated ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm">Generating life history...</p>
            </div>
          </div>
        ) : (
          <div
            ref={timelineRef}
            className="relative border-l-2 border-slate-600 pl-12 ml-8 space-y-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/40 pb-8"
          >
            {expandedLifeEvents.map((e, i) => {
              const Icon = EVENT_ICON[e.kind] || Sparkles;
              const colorClass = EVENT_COLORS[e.importance] || EVENT_COLORS[EventImportance.MUNDANE];
              const isHighlighted = highlightedEventYear === e.year;
              const age = e.year - (parseInt(character.birthYear || '0', 10) ||
                (character.year || 1500) - character.age);

              return (
                <div
                  key={`${e.kind}-${e.year}-${i}`}
                  data-year={e.year}
                  className={`relative transition-all duration-500 ${
                    isHighlighted
                      ? 'bg-blue-500/20 -mx-4 px-4 py-2 rounded-lg ring-2 ring-blue-500/50'
                      : ''
                  }`}
                >
                  <div className={`absolute -left-[36px] top-1 w-7 h-7 rounded-full ${colorClass} border-2 border-slate-900 grid place-items-center text-white transition-transform ${
                    isHighlighted ? 'scale-125' : ''
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">
                    {e.year}
                    {age >= 0 && (
                      <span className="ml-4 text-slate-600">
                        (Age {age})
                      </span>
                    )}
                  </div>
                  <div className="text-base lg:text-lg text-white font-semibold mt-1">{e.title}</div>
                  <div className="text-sm lg:text-base text-slate-300 mt-1 leading-relaxed">
                    {e.text}
                    {e.culturalContext && (
                      <span className="block text-xs text-blue-400 italic mt-1">
                        {e.culturalContext}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {expandedLifeEvents.length === 0 && (
              <div className="text-center text-slate-500 italic py-8">
                No life events generated yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};