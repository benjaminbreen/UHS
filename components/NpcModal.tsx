/**
 * components/NpcModal.tsx – Wider, modern NPC/Player modal
 * - Wider layout (no clipped tabs)
 * - Big top-bar badges to the right of the name
 * - Large portrait sidebar
 * - Life History: alternating icon timeline with year pills
 * - Fixed-height content area (no jumpy tabs)
 */

import React, { useMemo, useState } from 'react';
import { NpcEntity, PlayerCharacter, Appearance, Point } from '../../types';
import { ProceduralPortrait } from './portraits';
import BeliefsPanel from './BeliefsPanel';
import { formatAppearanceText } from '../utils/colorUtils';
import { useMap } from '../contexts/MapContext';
import { getRelativeDirection } from '../utils/geographyUtils';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import { mapLocationToCulture } from '../utils/mapUtils';
import { calculateNpcLocationInfo } from '../utils/npcLocationUtils';
import { useGame } from '../contexts/GameContext';
import AccessoryMaintenanceService from '../services/accessoryMaintenanceService';
import { AttributeBadgeList } from './AttributeBadge';
import AttributeModal from './AttributeModal';

/* icons (lucide-react) */
import {
  Activity,
  BadgeCheck,
  Biohazard,
  BookOpen,
  Calendar,
  Church,
  Compass,
  Heart,
  Home,
  MapPin,
  Medal,
  Mountain,
  Scroll,
  Shield,
  Ship,
  Sparkles,
  Star,
  Swords,
  Trophy,
  User,
} from 'lucide-react';

interface NpcModalProps {
  npc: NpcEntity | PlayerCharacter;
  onClose: () => void;
  isPlayer?: boolean;
}

type NpcModalTab = 'overview' | 'stats' | 'beliefs' | 'equipment' | 'life-history' | 'goal' | 'history';

/* ----------------------------- small utilities ---------------------------- */

const cmToFeetAndInches = (cm?: number): string => {
  if (!cm && cm !== 0) return `N/A`;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
};

const kgToLbs = (kg?: number): string => {
  if (!kg && kg !== 0) return 'N/A';
  return `${Math.round(kg * 2.20462)} lbs`;
};

const pretty = (s?: string) =>
  (s || '—')
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

/* -------------------------------- UI atoms -------------------------------- */

const BigChip: React.FC<{ children: React.ReactNode; tone?: 'blue' | 'amber' | 'green' | 'violet' | 'slate' }> = ({
  children,
  tone = 'slate',
}) => {
  const toneMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-100 border-blue-400/40',
    amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-100 border-amber-400/40',
    green: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-100 border-emerald-400/40',
    violet: 'bg-violet-500/20 text-violet-700 dark:text-violet-100 border-violet-400/40',
    slate: 'bg-[var(--surface-chip-bg)] text-text-primary border-[var(--surface-chip-border)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs md:text-sm font-bold uppercase tracking-wide ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 text-sm">
    <span className="text-text-secondary">{label}</span>
    <span className="text-text-primary font-semibold text-right">{value}</span>
  </div>
);

const Bar: React.FC<{ value: number; max?: number; tone?: 'red' | 'blue' | 'violet' | 'emerald' | 'amber' }> = ({
  value,
  max = 100,
  tone = 'blue',
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tones: Record<string, string> = {
    red: 'from-red-600 to-red-400',
    blue: 'from-blue-500 to-cyan-400',
    violet: 'from-violet-500 to-fuchsia-400',
    emerald: 'from-emerald-500 to-green-400',
    amber: 'from-amber-500 to-yellow-400',
  };
  return (
    <div className="h-2 rounded bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: number; max?: number; Icon?: React.ElementType; tone?: Parameters<typeof Bar>[0]['tone'] }> = ({
  label,
  value,
  max = 10,
  Icon = Shield,
  tone = 'blue',
}) => (
  <div className="flex items-center gap-3">
    <div className="w-44 flex items-center gap-2 text-text-primary text-sm">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <div className="flex-1">
      <Bar value={value} max={max} tone={tone} />
    </div>
    <span className="w-10 text-right text-text-primary font-bold">{value}</span>
  </div>
);

const TraitRow: React.FC<{ label: string; value: number; Icon?: React.ElementType }> = ({ label, value, Icon = Sparkles }) => {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 flex items-center gap-2 text-text-primary text-sm">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="flex-1">
        <Bar value={pct} max={100} tone="violet" />
      </div>
      <span className="w-10 text-right text-text-primary font-bold">{pct}</span>
    </div>
  );
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void; Icon?: React.ElementType }> = ({
  label,
  active,
  onClick,
  Icon = Star,
}) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={[
      'flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors shrink-0',
      active
        ? 'text-text-primary surface-card border-b-2 border-[var(--accent-primary)] shadow-[0_0_15px_rgba(59,130,246,.25)]'
        : 'text-text-secondary hover:text-text-primary hover:bg-[var(--surface-muted-hover-bg)]',
    ].join(' ')}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

/* ------------------------------- life icons ------------------------------- */

const chooseEventIcon = (text: string) => {
  const t = (text || '').toLowerCase();
  if (t.includes('born') || t.includes('birth')) return { Icon: Sparkles, color: 'bg-amber-500' };
  if (t.includes('apprentice') || t.includes('study') || t.includes('learn')) return { Icon: BookOpen, color: 'bg-blue-500' };
  if (t.includes('marriage') || t.includes('wed') || t.includes('spouse')) return { Icon: BadgeCheck, color: 'bg-pink-500' };
  if (t.includes('battle') || t.includes('fight') || t.includes('guard')) return { Icon: Swords, color: 'bg-red-500' };
  if (t.includes('travel') || t.includes('journey') || t.includes('caravan')) return { Icon: Ship, color: 'bg-cyan-500' };
  if (t.includes('mountain') || t.includes('pass')) return { Icon: Mountain, color: 'bg-emerald-500' };
  if (t.includes('achievement') || t.includes('notable')) return { Icon: Trophy, color: 'bg-violet-500' };
  if (t.includes('sick') || t.includes('plague') || t.includes('fever')) return { Icon: Biohazard, color: 'bg-fuchsia-500' };
  if (t.includes('home') || t.includes('move') || t.includes('settle')) return { Icon: Home, color: 'bg-amber-600' };
  return { Icon: Scroll, color: 'bg-slate-500' };
};

/* --------------------------------- main ----------------------------------- */

const NpcModal: React.FC<NpcModalProps> = ({ npc, onClose, isPlayer: isExplicitlyPlayer = false }) => {
  const [activeTab, setActiveTab] = useState<NpcModalTab>('overview');
  const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const [showAttributeModal, setShowAttributeModal] = useState(false);

  const { terrainStructures } = useMap();
  const { gameDate, currentZone } = useGame();

  if (!npc) return null;

  const isPlayer = isExplicitlyPlayer || 'party' in npc;

  const appearance: Appearance | undefined = npc.appearance;
  const name = npc.name;
  const profession = isPlayer ? (npc as PlayerCharacter).profession : (npc as NpcEntity).role;
  const socialClass = isPlayer ? (npc as PlayerCharacter).class || 'Adventurer' : (npc as NpcEntity).class;
  const backstory = isPlayer ? (npc as PlayerCharacter).backstory : (npc as NpcEntity).descriptions?.long;
  const personality = npc.personality || {
    openness: 0.3,
    conscientiousness: 0.5,
    extraversion: 0.4,
    agreeableness: 0.5,
    neuroticism: 0.5,
  };

  const { workLocation, homeLocation } = useMemo(() => {
    if (isPlayer) {
      return { workLocation: 'Unemployed', homeLocation: 'No permanent residence' };
    }

    const locationInfo = calculateNpcLocationInfo(npc as NpcEntity, terrainStructures || [], isPlayer);

    // Add "Works at" prefix for work location if it's not "Unemployed"
    let work = locationInfo.workLocation;
    if (work !== 'Unemployed' && !work.startsWith('Works at') && !work.startsWith('Works as')) {
      work = `Works at ${work}`;
    } else if ((npc as NpcEntity).role && (npc as NpcEntity).role.toLowerCase() !== 'wanderer' && work === 'Unemployed') {
      work = `Works as a ${pretty((npc as NpcEntity).role)} locally`;
    }

    return { workLocation: work, homeLocation: locationInfo.homeLocation };
  }, [isPlayer, npc, terrainStructures]);

  const equipmentItems = useMemo(() => {
    if (isPlayer) return [];
    const e = npc as NpcEntity;
    const a = appearance;
    const items = [
      { label: 'Headgear', value: formatAppearanceText(a?.headgear, a?.palette?.secondary) },
      { label: 'Garment', value: formatAppearanceText(a?.garment, a?.palette?.primary) },
      { label: 'Accessory', value: formatAppearanceText(a?.accessory, a?.palette?.accent) },
      { label: 'Belt', value: formatAppearanceText(a?.belt, a?.palette?.secondary) },
      { label: 'Footwear', value: formatAppearanceText(a?.footwear, a?.palette?.secondary) },
    ].filter(x => x.value && !x.value.toLowerCase().includes('nothing'));
    return items;
  }, [isPlayer, npc, appearance]);

  const lifeEvents = (isPlayer ? (npc as PlayerCharacter).lifeEvents : (npc as NpcEntity).lifeEvents) || [];
  const family = (isPlayer ? (npc as PlayerCharacter).family : (npc as NpcEntity).family) || [];

  /* -------------------------------- sections ------------------------------- */

  const Overview = () => (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left */}
      <div className="space-y-6">
        {!isPlayer && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Connections</h3>
            <div className="rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-4 space-y-2">
              <DetailRow label="Livelihood" value={workLocation} />
              <DetailRow label="Residence" value={homeLocation} />
            </div>
          </section>
        )}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-4 text-sm">
            <div>
              <div className="text-text-secondary text-xs">Age</div>
              <div className="text-text-primary font-semibold">{npc.age} years</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Profession</div>
              <div className="text-green-400 font-semibold capitalize">{pretty(profession)}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Class</div>
              <div className="text-text-primary capitalize">{pretty(socialClass)}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Religion</div>
              <div className="text-text-primary">{npc.religion || '—'}</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">Social Context</h3>
          <div className="space-y-3">
            <TraitRow label="Privilege" value={npc.socialContext?.privilege ?? 0} Icon={BadgeCheck} />
            <TraitRow label="Ambition" value={npc.socialContext?.ambition ?? 0} Icon={Star} />
            <TraitRow label="Religiosity" value={npc.socialContext?.religiosity ?? 0} Icon={Church} />
          </div>
        </section>
      </div>

      {/* Right */}
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">Background</h3>
          <div className="rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-4">
            <p className="font-lora text-text-primary/90 italic leading-relaxed whitespace-pre-wrap">
              {backstory}
            </p>
          </div>
        </section>

        {/* Cultural Markings - New display for markings from appearance */}
        {appearance?.markings && appearance.markings.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Cultural Markings
            </h3>
            <div className="space-y-2">
              {appearance.markings.map((marking: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {marking.type === 'tattoo' && <span className="text-lg">🖤</span>}
                      {marking.type === 'scarification' && <span className="text-lg">⚡</span>}
                      {marking.type === 'paint' && <span className="text-lg">🎨</span>}
                      {marking.type === 'henna' && <span className="text-lg">🌿</span>}
                      {marking.type === 'ash' && <span className="text-lg">⚪</span>}
                      {marking.type === 'piercing' && <span className="text-lg">💍</span>}
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {marking.name || `${marking.location.charAt(0).toUpperCase() + marking.location.slice(1)} ${marking.type}`}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {marking.pattern?.replace(/_/g, ' ') || marking.type}
                        </p>
                      </div>
                    </div>
                    {marking.isPermanent ? (
                      <span className="px-2 py-1 rounded-full bg-purple-700/50 text-purple-200 text-xs font-bold">
                        Permanent
                      </span>
                    ) : marking.duration && (
                      <span className="px-2 py-1 rounded-full bg-yellow-600/70 text-yellow-200 text-xs font-bold">
                        {marking.duration < 24 ? `${marking.duration}h` : `${Math.floor(marking.duration / 24)}d`}
                      </span>
                    )}
                  </div>
                  {marking.culturalSignificance && (
                    <p className="text-xs text-text-secondary italic">
                      {marking.culturalSignificance}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Body Modifications - Legacy support for equipped accessories */}
        {!isPlayer && (npc as NpcEntity).equippedItems?.accessory && !appearance?.markings && (
          (() => {
            const accessory = (npc as NpcEntity).equippedItems.accessory;
            const specialType = (accessory as any).specialType;
            const isPermanent = (accessory as any).isPermanent;
            const duration = (accessory as any).duration;
            
            if (specialType) {
              return (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Body Modifications
                  </h3>
                  <div className="rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {specialType === 'tattoo' && <span className="text-lg">🖤</span>}
                        {specialType === 'scarification' && <span className="text-lg">⚡</span>}
                        {specialType === 'face_paint' && <span className="text-lg">🎨</span>}
                        {specialType === 'henna' && <span className="text-lg">🌿</span>}
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{accessory.name}</p>
                          <p className="text-xs text-text-secondary capitalize">{specialType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isPermanent && (
                          <span className="px-2 py-1 rounded-full bg-red-600/70 text-red-200 text-xs font-bold">
                            Permanent
                          </span>
                        )}
                        {duration && (
                          <span className="px-2 py-1 rounded-full bg-yellow-600/70 text-yellow-200 text-xs font-bold">
                            {AccessoryMaintenanceService.getTemporaryAccessoryDisplay(accessory)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary italic">
                      {AccessoryMaintenanceService.getCulturalSignificance(accessory)}
                    </p>
                  </div>
                </section>
              );
            }
            return null;
          })()
        )}

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3">Personality</h3>
          <div className="space-y-3">
            <TraitRow label="Openness" value={personality.openness || 0} />
            <TraitRow label="Conscientiousness" value={personality.conscientiousness || 0} />
            <TraitRow label="Extraversion" value={personality.extraversion || 0} />
            <TraitRow label="Agreeableness" value={personality.agreeableness || 0} />
            <TraitRow label="Neuroticism" value={personality.neuroticism || 0} Icon={Activity} />
          </div>
        </section>
      </div>
    </div>
  );

  const Stats = () => (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Physical Attributes</h4>
        <StatRow label="Strength" value={npc.stats.strength} Icon={Swords} tone="red" />
        <StatRow label="Dexterity" value={npc.stats.dexterity} Icon={Sparkles} tone="emerald" />
        <StatRow label="Constitution" value={npc.stats.constitution} Icon={Shield} tone="amber" />
        <StatRow label="Stamina" value={npc.stats.stamina} Icon={Heart} tone="red" />
      </section>
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Mental Attributes</h4>
        <StatRow label="Intelligence" value={npc.stats.intelligence} Icon={Star} tone="blue" />
        <StatRow label="Perception" value={npc.stats.perception} Icon={EyeIcon} tone="amber" />
        <StatRow label="Craftiness" value={npc.stats.craftiness} Icon={User} tone="violet" />
        <StatRow label="Persuasion" value={npc.stats.persuasion} Icon={BadgeCheck} tone="violet" />
      </section>

      <section className="lg:col-span-2 rounded-lg border border-[var(--border-normal)]/50 bg-[var(--surface-muted-bg)]/40 p-4 mt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Physical Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <DetailRow label="Gender" value={pretty(npc.gender)} />
          <DetailRow label="Height" value={cmToFeetAndInches(appearance?.height)} />
          <DetailRow label="Weight" value={kgToLbs(appearance?.weight)} />
          <DetailRow label="Build" value={pretty(appearance?.build)} />
          <DetailRow label="Hair Style" value={pretty(appearance?.hairstyle)} />
          <DetailRow
            label="Hair Color"
            value={<span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-normal)]" style={{ backgroundColor: appearance?.hairColor }} />
              <span className="capitalize">{appearance?.hairColorName || '—'}</span>
            </span>}
          />
          <DetailRow
            label="Eye Color"
            value={<span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-normal)]" style={{ backgroundColor: appearance?.eyeColor }} />
              <span className="capitalize">{appearance?.eyeColorName || '—'}</span>
            </span>}
          />
          <DetailRow label="Affect" value={pretty(appearance?.affect)} />
        </div>
      </section>
    </div>
  );

  const Equipment = () =>
    isPlayer ? (
      <div className="p-6 text-center text-text-secondary">Player equipment is managed in the main Character Profile.</div>
    ) : (
      <div className="p-6">
        <h4 className="text-lg font-semibold text-blue-300 mb-4 border-b border-[var(--border-normal)] pb-2">Worn Items</h4>
        <div className="grid gap-3">
          {equipmentItems.map(item => (
            <div key={item.label} className="grid grid-cols-3 gap-4 p-3 bg-[var(--surface-muted-bg)]/40 rounded-md border border-[var(--border-normal)]/50 text-sm">
              <div className="text-text-secondary font-medium">{item.label}</div>
              <div className="col-span-2 text-text-primary capitalize">{item.value}</div>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-4 p-3 bg-[var(--surface-muted-bg)]/40 rounded-md border border-[var(--border-normal)]/50 text-sm">
            <div className="text-text-secondary font-medium">Physical</div>
            <div className="col-span-2 text-text-primary capitalize">
              {appearance?.build || '—'} build, {appearance?.facialHair ? `with ${pretty(appearance.facialHairStyle)}` : 'clean-shaven'}
            </div>
          </div>
        </div>
      </div>
    );

  const LifeHistory = () =>
    isPlayer ? (
      <div className="p-6 text-center text-text-secondary">Your story is yet to be written.</div>
    ) : (
      <div className="p-6 space-y-8">
        {/* Family summary */}
        <section>
          <h4 className="text-lg font-semibold text-blue-300 mb-3 border-b border-[var(--border-normal)] pb-2">Family</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {(['father', 'mother'] as const).map(rel => {
              const m = family.find(f => f.relation === rel);
              return m ? (
                <div key={rel} className="p-3 rounded-lg bg-[var(--surface-muted-bg)]/40 border border-[var(--border-normal)]/50 text-sm flex justify-between">
                  <span className="text-text-secondary capitalize">{rel}</span>
                  <span className="text-text-primary">{m.name} ({m.profession})</span>
                </div>
              ) : null;
            })}
            {(() => {
              const spouse = family.find(f => f.relation === 'spouse');
              return spouse ? (
                <div className="p-3 rounded-lg bg-[var(--surface-muted-bg)]/40 border border-[var(--border-normal)]/50 text-sm flex justify-between">
                  <span className="text-text-secondary">Spouse</span>
                  <span className="text-text-primary">{spouse.name} ({spouse.profession}, age {spouse.age})</span>
                </div>
              ) : null;
            })()}
            <div className="p-3 rounded-lg bg-[var(--surface-muted-bg)]/40 border border-[var(--border-normal)]/50 text-sm md:col-span-3">
              <div className="text-text-secondary">Children</div>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-text-primary">
                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').map(c => (
                  <li key={c.name}>{c.name} (age {c.age})</li>
                ))}
                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').length === 0 && (
                  <li className="text-text-secondary">None</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Alternating timeline */}
        <section>
          <h4 className="text-lg font-semibold text-blue-300 mb-4 border-b border-[var(--border-normal)] pb-2">Timeline</h4>

          <div className="relative max-h-[54vh] overflow-y-auto pr-2">
            {/* spine */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px] bg-gradient-to-b from-blue-400/70 via-blue-400/20 to-transparent rounded" />
            <div className="space-y-6">
              {lifeEvents.map((evt: any, i: number) => {
                const sideLeft = i % 2 === 0;
                const { Icon, color } = chooseEventIcon(`${evt.event || ''} ${evt.title || ''}`);
                return (
                  <div key={`${evt.year}-${i}`} className="relative grid grid-cols-[1fr_2.5rem_1fr] items-start gap-3">
                    {/* left card */}
                    <div className={`${sideLeft ? '' : 'opacity-0 pointer-events-none'} transition`}>
                      <div className="rounded-xl border border-[var(--border-normal)]/60 bg-[var(--surface-card-bg)]/40 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/25 text-blue-200 border border-blue-400/30">
                            {evt.year}
                          </span>
                          <span className="text-xs text-text-secondary">Age {Math.max(0, (npc.age || 0) - (((npc as any).year || 0) - evt.year || 0))}</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary">
                          {evt.title || 'Life Event'}
                        </div>
                        <div className="text-sm text-text-secondary">{evt.event || evt.text}</div>
                      </div>
                    </div>

                    {/* dot */}
                    <div className="grid place-items-center">
                      <div className={`w-5 h-5 rounded-full ${color} border-2 border-[var(--surface-card-bg)] grid place-items-center shadow`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* right card */}
                    <div className={`${sideLeft ? 'opacity-0 pointer-events-none' : ''} transition`}>
                      <div className="rounded-xl border border-[var(--border-normal)]/60 bg-[var(--surface-card-bg)]/40 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/25 text-blue-200 border border-blue-400/30">
                            {evt.year}
                          </span>
                          <span className="text-xs text-text-secondary">Age {Math.max(0, (npc.age || 0) - (((npc as any).year || 0) - evt.year || 0))}</span>
                        </div>
                        <div className="text-sm font-semibold text-text-primary">
                          {evt.title || 'Life Event'}
                        </div>
                        <div className="text-sm text-text-secondary">{evt.event || evt.text}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!lifeEvents.length && <div className="text-text-secondary text-sm italic">No recorded life events.</div>}
            </div>
          </div>
        </section>
      </div>
    );

  const Goal = () =>
    isPlayer ? (
      <div className="p-6 text-center text-text-secondary">Your goals are your own to decide.</div>
    ) : (
      <div className="p-6">
        <h4 className="text-lg font-semibold text-blue-300 mb-3 border-b border-[var(--border-normal)] pb-2">Personal Goal</h4>
        <blockquote className="border-l-4 border-blue-500/70 pl-4 italic text-text-primary text-base">
          “{(npc as NpcEntity).personalGoal?.description || 'To live a quiet life.'}”
        </blockquote>
      </div>
    );

  const History = () => <div className="p-6 text-center text-text-secondary italic">You have not spoken with this person yet.</div>;

  /* --------------------------------- render -------------------------------- */

  return (
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface"
      onClick={onClose}
    >
      <div
        data-surface="modal-panel"
        className="ff-panel theme-surface w-full max-w-[92rem] h-full sm:h-[95vh] sm:h-[95dvh] md:h-[90vh] flex flex-col overflow-hidden"
        style={{
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          marginTop: 'env(safe-area-inset-top)',
          marginBottom: 'env(safe-area-inset-bottom)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Clean and minimal */}
        <div className="shrink-0 px-4 py-3 border-b border-[var(--border-normal)]/50 flex items-center justify-between">
          {/* Name and key info */}
          <div className="min-w-0 flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-semibold text-text-primary truncate">{name}</h2>
            <span className="text-text-secondary text-sm hidden sm:inline">
              {pretty(profession)} · {npc.age} years
            </span>

            {/* Compact attribute badges */}
            {npc.attributes?.length ? (
              <button
                onClick={() => setShowAttributeModal(true)}
                className="hidden md:flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                title="View attributes"
              >
                <AttributeBadgeList badges={npc.attributes} maxDisplay={3} size="small" />
              </button>
            ) : null}
          </div>

          {/* Status and close */}
          <div className="flex items-center gap-2">
            {npc.health?.currentDiseases?.length ? (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSelectedDisease(npc.health!.currentDiseases[0]);
                  setIsDiseaseModalOpen(true);
                }}
                className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-md border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1"
              >
                <Biohazard className="w-3 h-3" />
                {npc.health.currentDiseases.length > 1
                  ? `${npc.health.currentDiseases.length} conditions`
                  : npc.health.currentDiseases[0].disease.name}
              </button>
            ) : (
              <span className="px-2 py-1 text-emerald-400 text-xs">Healthy</span>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-[var(--surface-muted-bg)] transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: two columns; left = portrait; right = tabs+content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[320px_1fr]">
          {/* MOBILE PORTRAIT */}
          <div className="xl:hidden p-4 border-b border-[var(--border-normal)] bg-[var(--surface-muted-bg)]/40">
            <div className="relative mx-auto w-48">
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-[var(--border-normal)] bg-[var(--surface-card-bg)] shadow-lg">
                {/* AI Portrait for quest NPCs */}
                {!isPlayer && (npc as NpcEntity).isQuestNPC && (npc as NpcEntity).aiPortrait && (npc as NpcEntity).portraitType === 'ai' ? (
                  <div className="relative w-full h-full">
                    <img
                      src={(npc as NpcEntity).aiPortrait}
                      alt={`AI-generated portrait of ${npc.name}`}
                      className="w-full h-full object-cover"
                    />
                    {/* AI Quest NPC Badge */}
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-gradient-to-r from-green-600/90 to-emerald-600/90 text-white text-xs font-bold rounded-full border border-green-400/50 shadow-lg flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI
                    </div>
                  </div>
                ) : (
                  <ProceduralPortrait character={npc} size={180} />
                )}
              </div>
            </div>
          </div>

          {/* LEFT SIDEBAR - Clean and minimal */}
          <aside className="hidden xl:flex flex-col gap-4 p-4 border-r border-[var(--border-normal)]/50 min-h-0 overflow-y-auto">
            {/* Portrait */}
            <div className="relative mx-auto w-[280px]">
              <div className="aspect-square rounded-xl overflow-hidden border border-[var(--border-normal)]/50 bg-[var(--surface-card-bg)] shadow-lg">
                {!isPlayer && (npc as NpcEntity).isQuestNPC && (npc as NpcEntity).aiPortrait && (npc as NpcEntity).portraitType === 'ai' ? (
                  <img
                    src={(npc as NpcEntity).aiPortrait}
                    alt={npc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ProceduralPortrait character={npc} size={280} />
                )}
              </div>
            </div>

            {/* Quick info - simple list */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-text-secondary">Class</span>
                <span className="text-text-primary font-medium capitalize">{pretty(socialClass)}</span>
              </div>
              {npc.religion && (
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Religion</span>
                  <span className="text-text-primary">{npc.religion}</span>
                </div>
              )}
              {!isPlayer && (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">Work</span>
                    <span className="text-text-primary text-right max-w-[160px] truncate capitalize">{workLocation}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">Home</span>
                    <span className="text-text-primary text-right max-w-[160px] truncate capitalize">{homeLocation}</span>
                  </div>
                </>
              )}
              {(npc as any).birthplace && (
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">Origin</span>
                  <span className="text-text-primary">{(npc as any).birthplace}</span>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT: tabs + content */}
          <main className="flex flex-col min-h-0">
            {/* Folder tabs */}
            <div className="folder-tabs-container shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: Home },
                { id: 'stats', label: 'Stats', icon: Activity },
                { id: 'beliefs', label: 'Beliefs', icon: Sparkles },
                ...(!isPlayer ? [
                  { id: 'equipment', label: 'Equipment', icon: Shield },
                  { id: 'life-history', label: 'Life History', icon: Calendar },
                ] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as NpcModalTab)}
                  className={`folder-tab ${activeTab === tab.id ? 'folder-tab-active' : 'folder-tab-inactive'}`}
                >
                  <tab.icon className="folder-tab-icon" />
                  <span className="folder-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {activeTab === 'overview' && <Overview />}
              {activeTab === 'stats' && <Stats />}
              {activeTab === 'beliefs' && (
                <div className="p-5">
                  <BeliefsPanel character={npc} />
                </div>
              )}
              {activeTab === 'equipment' && <Equipment />}
              {activeTab === 'life-history' && <LifeHistory />}
              {activeTab === 'goal' && <Goal />}
              {activeTab === 'history' && <History />}
            </div>
          </main>
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

      {/* Attribute Modal */}
      {showAttributeModal && npc.attributes && (
        <AttributeModal
          isOpen={showAttributeModal}
          onClose={() => setShowAttributeModal(false)}
          attributes={npc.attributes}
          characterName={npc.name}
        />
      )}
    </div>
  );
};

/* tiny local Eye icon fallback */
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" strokeWidth="2" />
  </svg>
);

export default NpcModal;
