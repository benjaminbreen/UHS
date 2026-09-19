import { useEffect, useRef, useState } from "react";
import {
  Axe,
  Bandage,
  Crosshair,
  Footprints,
  Heart,
  Leaf,
  MessageCircle,
  Pickaxe,
  Sailboat,
  Scale,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import {
  MAX_LEVEL,
  SKILLS,
  progress,
  rankOf,
  skillIds,
  type SkillGain,
  type SkillId,
  type Skills,
} from "../core/skills";

const ICONS: Record<SkillId, LucideIcon> = {
  hunting: Crosshair,
  foraging: Leaf,
  farming: Wheat,
  woodcraft: Axe,
  quarrying: Pickaxe,
  speech: MessageCircle,
  trade: Scale,
  wayfaring: Footprints,
  watercraft: Sailboat,
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
      <span className="vitals-bar">
        <i style={{ width: `${Math.max(0, Math.min(100, health))}%` }} />
      </span>
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

const GROUPS = ["Land", "Craft", "People", "Road"] as const;

/** The sidebar tab: every skill, grouped, with what it takes and what it gives. */
export function SkillsPanel({ skills }: { skills: Skills }) {
  const [open, setOpen] = useState<SkillId>();
  return (
    <div className="skills-panel">
      {GROUPS.map((group) => (
        <section key={group} aria-label={group}>
          {skillIds
            .filter((id) => SKILLS[id].group === group)
            .map((id) => {
              const def = SKILLS[id];
              const Icon = ICONS[id];
              const xp = skills[id] ?? 0;
              const { level, into, span } = progress(xp);
              return (
                <button
                  key={id}
                  className="skill-row"
                  aria-expanded={open === id}
                  data-untried={level === 0 || undefined}
                  onClick={() => setOpen(open === id ? undefined : id)}
                >
                  <span className="skill-icon">
                    <Icon size={15} />
                  </span>
                  <span className="skill-name">
                    {def.name}
                    <small>{rankOf(level)}</small>
                  </span>
                  <span className="skill-level">{level}</span>
                  <Pips xp={xp} />
                  {open === id && (
                    <span className="skill-detail">
                      <span>{def.earned}.</span>
                      {level > 0 && <span>Now: {def.perk(level)}.</span>}
                      {level < MAX_LEVEL && (
                        <span>
                          Next: {def.perk(level + 1)} · {Math.ceil(span - into)}{" "}
                          to go
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
        </section>
      ))}
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
