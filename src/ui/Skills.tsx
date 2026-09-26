import { useEffect, useRef, useState } from "react";
import {
  Axe,
  Bandage,
  Crosshair,
  Footprints,
  Hammer,
  Heart,
  Leaf,
  MessageCircle,
  PawPrint,
  Pickaxe,
  Scale,
  Swords,
  Target,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import {
  GROUPS,
  MAX_LEVEL,
  SKILLS,
  progress,
  rankOf,
  skillIds,
  type SkillGain,
  type SkillId,
  type Skills,
} from "../core/skills";
import {
  TIERS,
  optionsAt,
  type TechniqueId,
  type Tier,
} from "../core/techniques";
import { DrainBar } from "./motion";

const ICONS: Record<SkillId, LucideIcon> = {
  hunting: Crosshair,
  foraging: Leaf,
  farming: Wheat,
  animals: PawPrint,
  marksmanship: Target,
  arms: Swords,
  woodcraft: Axe,
  stonework: Pickaxe,
  crafting: Hammer,
  speech: MessageCircle,
  trade: Scale,
  wayfaring: Footprints,
};

/** Ten pips: filled to the level, the next one filling as experience comes. */
function Pips({ xp }: { xp: number }) {
  const { level, into, span } = progress(xp);
  return (
    <span className="skill-pips" aria-hidden="true">
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <i
          key={i}
          className={i < level ? "full" : undefined}
          style={
            i === level
              ? ({ "--fill": `${Math.round((into / span) * 100)}%` } as object)
              : undefined
          }
        />
      ))}
    </span>
  );
}

/** Health, always in the corner of the world; the hurt beside it when there
 * is one. */
export function Vitals({
  health,
  injury,
  clock,
}: {
  health: number;
  injury?: { name: string; until: number };
  clock: number;
}) {
  const days = injury ? Math.ceil((injury.until - clock) / 86400) : 0;
  return (
    <div
      className="vitals"
      data-low={health < 35 || undefined}
      role="status"
      aria-label={`Health ${Math.round(health)} of 100`}
    >
      <Heart size={13} fill="currentColor" />
      <DrainBar value={health} className="vitals-bar" />
      {injury && days > 0 && (
        <span className="vitals-injury">
          <Bandage size={12} /> {injury.name} · {days}d
        </span>
      )}
    </div>
  );
}

/** A gain slides in, shows the bar move, and leaves. A new level stays longer
 * and says what it is worth. */
export function SkillToast({
  gains,
  onOpen,
}: {
  gains: readonly SkillGain[];
  onOpen: () => void;
}) {
  const seen = useRef(gains.at(-1)?.serial ?? 0);
  const [shown, setShown] = useState<SkillGain>();
  const latest = gains.at(-1);
  useEffect(() => {
    // A new map is a new engine, and its count starts again.
    if (!latest) seen.current = 0;
    if (!latest || latest.serial <= seen.current) return;
    // A level-up is not pushed off screen by the next ordinary gain.
    const fresh = gains.filter((g) => g.serial > seen.current);
    seen.current = latest.serial;
    const pick = fresh.find((g) => g.level !== undefined) ?? latest;
    setShown((now) =>
      now?.level !== undefined && pick.level === undefined ? now : pick,
    );
  }, [latest, gains]);
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(
      () => setShown(undefined),
      shown.level !== undefined ? 5200 : 2200,
    );
    return () => clearTimeout(t);
  }, [shown]);
  if (!shown) return null;
  const def = SKILLS[shown.skill];
  const Icon = ICONS[shown.skill];
  const { level } = progress(shown.xp);
  return (
    <button
      key={shown.serial}
      className="skill-toast"
      data-level-up={shown.level !== undefined || undefined}
      onClick={onOpen}
    >
      <span className="skill-icon">
        <Icon size={shown.level !== undefined ? 20 : 15} />
      </span>
      <span className="skill-toast-body">
        {shown.level !== undefined ? (
          <>
            <small>
              {def.name} · level {shown.level}
            </small>
            <strong>{rankOf(shown.level)}</strong>
            <em>{def.perk(shown.level)}</em>
          </>
        ) : (
          <small>
            {def.name} {level} <b>+{Math.max(1, Math.round(shown.amount))}</b>
          </small>
        )}
        <Pips xp={shown.xp} />
      </span>
    </button>
  );
}

export type Pick = { skill: SkillId; tier: Tier; options: TechniqueId[] };

const shown = skillIds.filter((id) => !SKILLS[id].hidden);

function XpBar({ xp }: { xp: number }) {
  const { level, into, span } = progress(xp);
  const fill = level >= MAX_LEVEL ? 1 : into / span;
  return (
    <span className="skill-bar" aria-hidden="true">
      <i style={{ width: `${Math.round(fill * 100)}%` }} />
    </span>
  );
}

/** One pip per milestone: chosen, waiting to be chosen, or ahead. */
function Milestones({
  skill,
  level,
  known,
  pending,
}: {
  skill: SkillId;
  level: number;
  known: readonly TechniqueId[];
  pending: readonly Pick[];
}) {
  return (
    <span className="skill-milestones" aria-hidden="true">
      {TIERS.map((tier) => (
        <i
          key={tier}
          data-state={
            optionsAt(skill, tier).some((id) => known.includes(id))
              ? "chosen"
              : pending.some((p) => p.skill === skill && p.tier === tier)
                ? "waiting"
                : level >= tier
                  ? "reached"
                  : undefined
          }
        />
      ))}
    </span>
  );
}

/** The sidebar tab: every skill at a glance, and the way into the full view. */
export function SkillsPanel({
  skills,
  known,
  pending,
  onOpen,
}: {
  skills: Skills;
  known: readonly TechniqueId[];
  pending: readonly Pick[];
  onOpen: (skill?: SkillId) => void;
}) {
  return (
    <div className="skills-panel">
      {GROUPS.map((group) => (
        <section key={group} aria-label={group} data-group={group}>
          <h3>{group}</h3>
          {shown
            .filter((id) => SKILLS[id].group === group)
            .map((id) => {
              const Icon = ICONS[id];
              const xp = skills[id] ?? 0;
              const level = progress(xp).level;
              return (
                <button
                  key={id}
                  className="skill-row"
                  data-untried={level === 0 || undefined}
                  data-waiting={
                    pending.some((p) => p.skill === id) || undefined
                  }
                  onClick={() => onOpen(id)}
                >
                  <span className="skill-icon">
                    <Icon size={15} />
                  </span>
                  <span className="skill-name">{SKILLS[id].name}</span>
                  <span className="skill-level">{level}</span>
                  <Milestones
                    skill={id}
                    level={level}
                    known={known}
                    pending={pending}
                  />
                  <XpBar xp={xp} />
                </button>
              );
            })}
        </section>
      ))}
      <button className="skills-more" onClick={() => onOpen()}>
        See all skills ›
      </button>
    </div>
  );
}

/** What the player reads on coming round. */
export function CollapseNotice({
  collapse,
}: {
  collapse?: { serial: number; title: string; text: string };
}) {
  const [dismissed, setDismissed] = useState(collapse?.serial ?? 0);
  if (!collapse || collapse.serial <= dismissed) return null;
  return (
    <div
      className="collapse-notice"
      role="alertdialog"
      aria-label={collapse.title}
    >
      <div>
        <small>YOU WAKE</small>
        <h2>{collapse.title}</h2>
        <p>{collapse.text}</p>
        <button autoFocus onClick={() => setDismissed(collapse.serial)}>
          Get up
        </button>
      </div>
    </div>
  );
}
