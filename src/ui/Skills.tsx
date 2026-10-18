import type { Engine } from "../core/engine";
import type { PlayerCommand } from "../core/types";
import { bodySummary } from "../core/health";
import { dangerSummary } from "../core/danger";
import { useEffect, useRef, useState } from "react";
import {
  Axe,
  Bandage,
  Crosshair,
  ChevronDown,
  Footprints,
  Hammer,
  Leaf,
  MessageCircle,
  Moon,
  PawPrint,
  Pickaxe,
  Scale,
  Shield,
  ShieldAlert,
  Swords,
  Target,
  Utensils,
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

export function Vitals({
  health,
  injury,
  clock,
  engine,
  onCare,
}: {
  health: number;
  injury?: { name: string; until: number };
  clock: number;
  engine?: Engine;
  onCare?: (command: PlayerCommand) => void;
}) {
  const [details, setDetails] = useState(false);
  const danger = engine?.danger();
  const player = engine?.state.player;
  const days = injury ? Math.ceil((injury.until - clock) / 86400) : 0;
  const was = useRef(health);
  const [flash, setFlash] = useState<{ kind: "hurt" | "heal"; n: number }>();
  useEffect(() => {
    const delta = Math.round(health) - Math.round(was.current);
    was.current = health;
    if (delta)
      setFlash((f) => ({ kind: delta < 0 ? "hurt" : "heal", n: (f?.n ?? 0) + 1 }));
  }, [health]);
  const hp = Math.round(health);
  const tip = `Health ${hp} / 100${injury && days > 0 ? ` · ${injury.name}` : ""}`;
  return (
    <div
      key={flash?.n}
      className="vitals"
      data-low={health < 35 || undefined}
      data-flash={flash?.kind}
      data-open={details || undefined}
      role="status"
      aria-label={`Health ${hp} of 100`}
    >
      <span className="hearts" data-tip={details ? undefined : tip}>
        {HEARTS.map((i) => (
          <HeartContainer key={i} fill={Math.max(0, Math.min(1, (health - i * 20) / 20))} />
        ))}
      </span>
      {injury && days > 0 && (
        <span className="vitals-injury">
          <Bandage size={12} /> {days}d
        </span>
      )}
      {engine && player && danger && <>
        <button className="survival-toggle" aria-expanded={details} aria-label="Body and danger" onClick={() => setDetails(!details)}>
          <span className="pip" data-warn={player.hunger >= 70 || undefined}><Utensils size={13} /><span>{player.hunger >= 70 ? "Hungry" : "Fed"}</span></span>
          <span className="pip" data-warn={player.fatigue >= 70 || undefined}><Moon size={13} /><span>{player.fatigue >= 70 ? "Tired" : "Rested"}</span></span>
          <span className="pip" data-warn={danger.level === "raised" || undefined} data-alarm={danger.level === "high" || danger.level === "immediate" || undefined}>
            {danger.score > 0 ? <ShieldAlert size={13} /> : <Shield size={13} />}
            <span>{DANGER_LABEL[danger.level] ?? danger.level}</span>
          </span>
          <ChevronDown className="survival-chevron" size={13} />
        </button>
        {details && <div className="survival-details" role="region" aria-label="Body and danger details">
          <p>{bodySummary(engine.state, engine.world.pack.setting)}</p>
          {onCare && engine.careOptions().map((o) => <div className="care-option" key={o.treatment}><button disabled={!!o.unavailable} onClick={() => onCare(o.command)}>{o.label} · {o.minutes}m{o.coin ? ` · ${o.coin} coins` : ""}</button><small>{o.unavailable ?? o.note}</small></div>)}
          <p>{dangerSummary(danger)}</p>
          {engine.nearbyDanger().map((d) => <p key={d.bearing}>{d.bearing}, 16 paces ({d.pos.x}, {d.pos.y}): {d.level}. {d.reasons.join("; ")}</p>)}
        </div>}
      </>}
    </div>
  );
}

const DANGER_LABEL: Record<string, string> = { low: "Safe", raised: "Uneasy", high: "Danger", immediate: "In danger" };
const HEARTS = [0, 1, 2, 3, 4];
// 7x6 pixel heart; each container holds 20 health, filled in quarters.
const HEART_PATH = "M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z";

function HeartContainer({ fill }: { fill: number }) {
  const q = Math.ceil(fill * 4) / 4;
  return (
    <svg className="heart" viewBox="0 0 7 6" data-empty={q === 0 || undefined}>
      <path d={HEART_PATH} className="heart-empty" />
      <path d={HEART_PATH} className="heart-full" style={{ clipPath: `inset(0 ${100 - q * 100}% 0 0)` }} />
    </svg>
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
export function CollapseNotice({ collapse }: { collapse?: { serial: number; title: string; text: string } }) {
  const [dismissed, setDismissed] = useState(collapse?.serial ?? 0);
  if (!collapse || collapse.serial <= dismissed) return null;
  return (
    <div className="collapse-notice" role="alertdialog" aria-label={collapse.title}>
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
