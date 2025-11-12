/**
 * CharacterOverviewTab.tsx
 * Overview tab content for CharacterProfileModal - code-split for better performance
 */
import React from 'react';
import { PlayerCharacter } from '../../types';
import LazyPortrait from '../portraits/LazyPortrait';
import AccessoryMaintenanceService from '../../services/accessoryMaintenanceService';
import {
  Heart,
  Moon,
  Star,
  Biohazard,
  Sparkles,
  Sword,
  Backpack,
  Activity,
  House,
  Shield,
  Dumbbell,
  Feather,
  Brain,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface Props {
  character: PlayerCharacter;
  highlightedBackstory: React.ReactNode;
  handleOpenPortrait: () => void;
  setSelectedDisease: (disease: any) => void;
  setIsDiseaseModalOpen: (open: boolean) => void;
  handleTabChange: (tab: string) => void;
  cmToFeetAndInches: (cm?: number) => string;
  kgToLbs: (kg?: number) => string;
  getStatImpact: (statName: string, value: number) => string;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1 text-sm">
    <span className="text-text-secondary">{label}:</span>
    <span className="text-text-primary font-semibold text-right">{value}</span>
  </div>
);

const StatBar: React.FC<{ label: string; value: number; max?: number; Icon: any; color: string; tooltip?: string }> = ({
  label,
  value,
  max = 10,
  Icon,
  color,
  tooltip,
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="flex items-center gap-3 group relative">
      <div className="w-40 text-sm text-text-secondary flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex-1 h-3 rounded-full bg-[var(--surface-track-bg)] border border-[var(--surface-track-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="w-8 text-right font-bold text-text-primary">{value}</span>
        {value > 8 && <span className="text-green-400 text-xs">▲</span>}
        {value < 5 && <span className="text-red-400 text-xs">▼</span>}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute left-0 bottom-full mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
          <div className="bg-[var(--surface-tooltip-bg)] border border-[var(--surface-tooltip-border)] rounded-lg px-3 py-2 text-xs text-text-secondary shadow-xl max-w-xs">
            <div className="font-semibold text-text-primary mb-1">{label} {value}</div>
            <div className="text-text-secondary">{tooltip}</div>
            <div className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--surface-tooltip-bg)]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CharacterOverviewTab: React.FC<Props> = ({
  character,
  highlightedBackstory,
  handleOpenPortrait,
  setSelectedDisease,
  setIsDiseaseModalOpen,
  handleTabChange,
  cmToFeetAndInches,
  kgToLbs,
  getStatImpact,
}) => {
  return (
    <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Portrait + Vitals */}
      <div className="space-y-5">
        <div
          className="relative group cursor-pointer"
          title="Click to view full portrait"
          onClick={handleOpenPortrait}
        >
          <div className="aspect-square rounded-xl overflow-hidden border-2 border-[var(--border-normal)] bg-[var(--bg-secondary)] shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-black/30 pointer-events-none" />
            <LazyPortrait
              character={character}
              size={300}
              type="animated"
              trackChanges
              immediate={false}
            />
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition text-xs">
            View
          </div>
        </div>

        <div className="p-4 rounded-lg surface-card">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Vitals</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-red-400"><Heart className="w-4 h-4" /> Health</span>
                <span className="text-text-primary font-bold">
                  {Math.round(character.health)}/{Math.round(character.maxHealth)}
                </span>
              </div>
              <div className="h-3 rounded bg-[var(--surface-track-bg)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400"
                  style={{ width: `${(character.health / character.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-amber-400"><Moon className="w-4 h-4" /> Fatigue</span>
                <span className="text-text-primary font-bold">
                  {Math.round(character.fatigue)}/{Math.round(character.maxFatigue || 100)}
                </span>
              </div>
              <div className="h-3 rounded bg-[var(--surface-track-bg)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${(character.fatigue / (character.maxFatigue || 100)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-cyan-400"><Star className="w-4 h-4" /> Experience</span>
                <span className="text-text-primary font-bold">
                  {Math.round(character.experience)}/{Math.round(character.maxExperience)}
                </span>
              </div>
              <div className="h-3 rounded bg-[var(--surface-track-bg)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${(character.experience / character.maxExperience) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {character.diseaseHealth?.currentDiseases?.length ? (
            <div className="pt-4 mt-4 border-t border-[var(--border-normal)]">
              <h5 className="text-xs font-bold uppercase tracking-wider text-pink-300 mb-2">Conditions</h5>
              <div className="flex flex-wrap gap-2">
                {character.diseaseHealth.currentDiseases.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDisease(d);
                      setIsDiseaseModalOpen(true);
                    }}
                    className="px-2 py-1 rounded-full border border-pink-400/50 bg-pink-600/70 text-white text-xs font-bold hover:bg-pink-500/80 flex items-center gap-1"
                    title={`View details for ${d.disease.name}`}
                  >
                    <Biohazard className="w-3.5 h-3.5" />
                    {d.disease.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Body Modifications */}
        {(character.equippedItems?.accessory || character.appearance?.markings?.length > 0) && (
          (() => {
            const modifications: Array<{
              name: string;
              type: string;
              isPermanent: boolean;
              duration?: number;
              significance?: string;
            }> = [];

            if (character.equippedItems?.accessory) {
              const accessory = character.equippedItems.accessory;
              const specialType = (accessory as any).specialType;
              if (specialType) {
                modifications.push({
                  name: accessory.name,
                  type: specialType,
                  isPermanent: (accessory as any).isPermanent || false,
                  duration: (accessory as any).duration,
                  significance: AccessoryMaintenanceService.getCulturalSignificance(accessory)
                });
              }
            }

            if (character.appearance?.markings) {
              character.appearance.markings.forEach((marking: any) => {
                modifications.push({
                  name: marking.name || `${marking.type} marking`,
                  type: marking.type,
                  isPermanent: marking.isPermanent !== false,
                  duration: marking.duration,
                  significance: marking.culturalSignificance
                });
              });
            }

            if (modifications.length === 0) return null;

            return (
              <div className="p-4 rounded-lg surface-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Body Modifications
                </h4>
                <div className="space-y-2">
                  {modifications.map((mod, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-[var(--surface-muted-bg)]">
                      <div className="flex items-center gap-2">
                        {mod.type === 'tattoo' && <span className="text-lg">🖤</span>}
                        {mod.type === 'scarification' && <span className="text-lg">⚡</span>}
                        {mod.type === 'face_paint' && <span className="text-lg">🎨</span>}
                        {mod.type === 'paint' && <span className="text-lg">🎨</span>}
                        {mod.type === 'henna' && <span className="text-lg">🌿</span>}
                        {mod.type === 'piercing' && <span className="text-lg">💍</span>}
                        {mod.type === 'ash' && <span className="text-lg">⚱️</span>}
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{mod.name}</p>
                          <p className="text-xs text-text-secondary capitalize">{mod.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {mod.isPermanent && (
                          <span className="px-2 py-1 rounded-full bg-red-600/70 text-red-200 text-xs font-bold">
                            Permanent
                          </span>
                        )}
                        {mod.duration && (
                          <span className="px-2 py-1 rounded-full bg-yellow-600/70 text-yellow-200 text-xs font-bold">
                            Temporary ({mod.duration}h)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {modifications[0]?.significance && (
                    <p className="text-xs text-text-secondary italic mt-2">
                      {modifications[0].significance}
                    </p>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Background */}
      <div className="space-y-5">
        <div className="p-4 rounded-lg surface-card h-full">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">Background</h4>
          <p className="text-text-primary leading-relaxed italic whitespace-pre-wrap">
            {highlightedBackstory || character.backstory}
          </p>
        </div>
      </div>

      {/* Info + Top Stats */}
      <div className="space-y-5">
        <div className="p-4 rounded-lg surface-card">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Character Info</h4>
          <div className="space-y-2">
            <DetailRow label="Level" value={character.level} />
            <DetailRow label="Age" value={character.age} />
            <DetailRow label="Class" value={character.class?.replace(/_/g, ' ') || '—'} />
            <DetailRow label="Religion" value={character.religion || '—'} />
            <DetailRow label="Height" value={cmToFeetAndInches(character.appearance?.height)} />
            <DetailRow label="Weight" value={kgToLbs(character.appearance?.weight)} />
            {character.totalPlayTimeMinutes !== undefined && character.totalPlayTimeMinutes > 0 && (
              <DetailRow
                label="Play Time"
                value={`${Math.floor(character.totalPlayTimeMinutes / 60)}h ${character.totalPlayTimeMinutes % 60}m`}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 rounded-lg surface-card">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTabChange('equipment')}
              className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-text-primary">Equipment</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('inventory')}
              className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Backpack className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-text-primary">Inventory</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('health')}
              className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-text-primary">Full Stats</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('household')}
              className="p-2 rounded-lg bg-[var(--surface-muted-bg)] hover:bg-[var(--surface-muted-hover-bg)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <House className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-text-primary">Household</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg surface-card">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3">Top Stats</h4>
          <div className="space-y-3">
            {Object.entries(character.stats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([k, v]) => (
                <StatBar
                  key={k}
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                  value={v}
                  Icon={
                    k === 'strength'
                      ? Dumbbell
                      : k === 'dexterity'
                      ? Feather
                      : k === 'constitution'
                      ? Shield
                      : k === 'intelligence'
                      ? Brain
                      : k === 'persuasion'
                      ? MessageSquare
                      : Eye
                  }
                  color={
                    k === 'strength'
                      ? '#ef4444'
                      : k === 'dexterity'
                      ? '#22c55e'
                      : k === 'constitution'
                      ? '#f97316'
                      : k === 'intelligence'
                      ? '#3b82f6'
                      : k === 'persuasion'
                      ? '#8b5cf6'
                      : '#eab308'
                  }
                  tooltip={getStatImpact(k, v)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterOverviewTab;
