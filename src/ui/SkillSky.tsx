import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gameAudio } from "../audio/director";
import { MAX_LEVEL, SKILLS, progress, rankOf, skillIds, type SkillId, type Skills } from "../core/skills";
import { TIERS, optionsAt, technique, type TechniqueId } from "../core/techniques";
import { CONSTELLATIONS, litStars, milestoneStars } from "./constellations";
import { SkyRenderer, type MilestoneState, type SkyEntry, type SkyTheme } from "./skill-sky";
import type { Pick } from "./Skills";
import "./skill-sky.css";

const HOLD_MS = 750;
const shown = skillIds.filter((id) => !SKILLS[id].hidden);

type Mode = "sky" | "skill" | "choose";
const THEME_KEY = "uhs-skill-sky-theme";
function savedTheme(): SkyTheme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function SkillSky({
  skills,
  known,
  pending,
  who,
  start,
  onLearn,
  onClose,
}: {
  skills: Skills;
  known: readonly TechniqueId[];
  pending: readonly Pick[];
  who: { name: string; role: string };
  /** Open on a skill, or straight onto a choice after a level-up. */
  start: { skill?: SkillId; pick?: Pick; levelUp?: boolean };
  onLearn: (id: TechniqueId) => void;
  onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sky = useRef<SkyRenderer>(null);
  const labels = useRef(new Map<SkillId, HTMLElement>());
  const plates = useRef<(HTMLElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<SkyTheme>(savedTheme);
  const [mode, setMode] = useState<Mode>(start.pick ? "choose" : start.skill ? "skill" : "sky");
  const [focus, setFocus] = useState<SkillId>(start.pick?.skill ?? start.skill ?? shown[0]);
  const [hover, setHover] = useState<SkillId>();
  const [pick, setPick] = useState<Pick | undefined>(start.pick);
  const [plate, setPlate] = useState<number>();
  const [held, setHeld] = useState<number>();
  const [bound, setBound] = useState<TechniqueId>();
  // Plates wait while the camera travels and the new star catches.
  const [ready, setReady] = useState(!start.pick);
  const back = useRef<Mode | undefined>(start.pick ? (start.levelUp ? undefined : "skill") : undefined);
  const hold = useRef({ at: 0, i: -1, raf: 0 });

  const entries: SkyEntry[] = useMemo(
    () =>
      shown.map((skill) => {
        const { level, into, span } = progress(skills[skill]);
        return {
          skill,
          group: SKILLS[skill].group,
          lit: litStars(CONSTELLATIONS[skill].stars.length, level, level >= MAX_LEVEL ? 0 : into / span),
          milestones: TIERS.map((tier): MilestoneState =>
            optionsAt(skill, tier).some((id) => known.includes(id))
              ? "chosen"
              : pending.some((p) => p.skill === skill && p.tier === tier)
                ? "waiting"
                : level >= tier
                  ? "unbuilt"
                  : "locked",
          ),
        };
      }),
    [skills, known, pending],
  );

  useEffect(() => {
    const r = new SkyRenderer(canvas.current!, theme);
    sky.current = r;
    const resize = new ResizeObserver(() => r.resize());
    resize.observe(canvas.current!.parentElement!);
    if (!start.pick) void gameAudio()?.event("hour");
    return () => {
      resize.disconnect();
      r.destroy();
      sky.current = null;
    };
  }, []);

  useEffect(() => sky.current?.set(entries), [entries]);
  useEffect(() => {
    sky.current?.setTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Private windows refuse storage; the choice lasts the session.
    }
  }, [theme]);

  const starOf = (p: Pick) => milestoneStars(CONSTELLATIONS[p.skill].stars.length)[TIERS.indexOf(p.tier)];

  // Where the camera looks follows the mode.
  useEffect(() => {
    const r = sky.current;
    if (!r) return;
    r.focus = mode === "sky" ? undefined : focus;
    r.hover = mode === "sky" ? (hover ?? focus) : undefined;
    if (mode === "sky") r.setLook({ kind: "overview" });
    else if (mode === "skill")
      r.setLook({ kind: "skill", skill: focus, z: 2.7, wide: [0.31, 0.5], tall: [0.5, 0.2] });
    else if (pick) r.setLook({ kind: "skill", skill: pick.skill, z: 2.7, wide: [0.5, 0.43], tall: [0.5, 0.3] });
  }, [mode, focus, hover, pick]);

  // A level-up: the sky first, then the eye travels, then the star catches.
  useEffect(() => {
    if (!start.pick) return;
    const r = sky.current!;
    r.setLook({ kind: "overview" }, true);
    const p = start.pick;
    const go = setTimeout(() => r.setLook({ kind: "skill", skill: p.skill, z: 2.7, wide: [0.5, 0.43], tall: [0.5, 0.3] }), 450);
    const catchStar = setTimeout(() => r.ignite(p.skill, starOf(p), false), 1500);
    const show = setTimeout(() => {
      setReady(true);
      void gameAudio()?.event("warm");
    }, 1900);
    return () => [go, catchStar, show].forEach(clearTimeout);
  }, []);

  // Each frame the renderer has moved, so the words follow the stars.
  useEffect(() => {
    const r = sky.current;
    if (!r) return;
    r.onFrame = () => {
      for (const [skill, el] of labels.current) {
        const [cx, cy] = r.at(skill);
        const [x, y] = r.css(cx, cy + 62);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.setProperty("--hit", `${r.span(116)}px`);
      }
      if (mode === "choose" && pick) {
        const [sx, sy] = r.css(...r.starAt(pick.skill, starOf(pick)));
        root.current?.style.setProperty("--sx", `${sx}px`);
        root.current?.style.setProperty("--sy", `${sy}px`);
        r.threadStar = ready && !bound ? { skill: pick.skill, star: starOf(pick) } : undefined;
        r.threads = plates.current.flatMap((el, i) => {
          if (!el) return [];
          const b = el.getBoundingClientRect();
          return [{ x: b.left + b.width / 2, y: b.top + 6, hot: i === plate || i === held }];
        });
      } else r.threadStar = undefined;
    };
  }, [mode, pick, plate, held, ready, bound]);

  const choose = useCallback((p: Pick) => {
    back.current = mode === "choose" ? back.current : mode;
    setFocus(p.skill);
    setPick(p);
    setPlate(undefined);
    setReady(false);
    setMode("choose");
    setTimeout(() => {
      setReady(true);
      void gameAudio()?.event("warm");
    }, 650);
  }, [mode]);

  const leaveChoice = useCallback(() => {
    if (!back.current) return onClose();
    setMode(back.current);
    setPick(undefined);
  }, [onClose]);

  const commit = useCallback(
    (i: number) => {
      if (!pick || bound) return;
      const id = pick.options[i];
      const el = plates.current[i];
      const r = sky.current!;
      if (el) {
        const b = el.getBoundingClientRect();
        const [sx, sy] = r.css(...r.starAt(pick.skill, starOf(pick)));
        el.style.setProperty("--fly-x", `${sx - (b.left + b.width / 2)}px`);
        el.style.setProperty("--fly-y", `${sy - (b.top + b.height / 2)}px`);
      }
      setBound(id);
      setTimeout(() => {
        r.ignite(pick.skill, starOf(pick));
        void gameAudio()?.event("learn");
        onLearn(id);
      }, r.still ? 0 : 560);
      setTimeout(() => {
        setBound(undefined);
        setPick(undefined);
        setMode("skill");
        back.current = undefined;
      }, r.still ? 900 : 3000);
    },
    [pick, bound, onLearn],
  );

  // Hold to bind: long enough to mean it, short enough not to drag.
  const startHold = (i: number) => {
    if (!ready || bound) return;
    cancelAnimationFrame(hold.current.raf);
    hold.current = { at: performance.now(), i, raf: 0 };
    setHeld(i);
    const step = () => {
      const p = Math.min(1, (performance.now() - hold.current.at) / HOLD_MS);
      plates.current[i]?.style.setProperty("--hold", String(p));
      if (p >= 1) {
        setHeld(undefined);
        commit(i);
        return;
      }
      hold.current.raf = requestAnimationFrame(step);
    };
    hold.current.raf = requestAnimationFrame(step);
  };
  const endHold = () => {
    const { i, raf } = hold.current;
    cancelAnimationFrame(raf);
    if (i >= 0 && !bound) plates.current[i]?.style.setProperty("--hold", "0");
    hold.current.i = -1;
    setHeld(undefined);
  };

  const open = (skill: SkillId) => {
    setFocus(skill);
    setMode("skill");
    void gameAudio()?.event("select");
  };
  // Arrow keys walk to the nearest constellation that way.
  const walk = (dx: number, dy: number) => {
    const r = sky.current!;
    const [fx, fy] = r.at(focus);
    let best: SkillId | undefined, score = Infinity;
    for (const s of shown) {
      if (s === focus) continue;
      const [x, y] = r.at(s);
      const along = (x - fx) * dx + (y - fy) * dy;
      if (along <= 0) continue;
      const side = Math.abs((x - fx) * dy - (y - fy) * dx);
      if (along + side * 2 < score) (score = along + side * 2), (best = s);
    }
    if (best) {
      setFocus(best);
      void gameAudio()?.event("select");
    }
  };
  const step = (by: number) => setFocus(shown[(shown.indexOf(focus) + by + shown.length) % shown.length]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (mode === "choose") {
        const n = pick?.options.length ?? 0;
        if (k === "ArrowRight" || k === "ArrowDown") setPlate((p) => (p === undefined ? 0 : (p + 1) % n));
        else if (k === "ArrowLeft" || k === "ArrowUp") setPlate((p) => (p === undefined ? n - 1 : (p + n - 1) % n));
        else if ((k === "Enter" || k === " ") && !e.repeat && plate !== undefined) startHold(plate);
        else if (k === "Escape") leaveChoice();
        else return;
      } else if (mode === "skill") {
        if (k === "ArrowRight" || k === "ArrowDown") step(1);
        else if (k === "ArrowLeft" || k === "ArrowUp") step(-1);
        else if (k === "Enter") {
          const p = pending.find((x) => x.skill === focus);
          if (p) choose(p);
        } else if (k === "Escape") setMode("sky");
        else return;
      } else {
        if (k === "ArrowRight") walk(1, 0);
        else if (k === "ArrowLeft") walk(-1, 0);
        else if (k === "ArrowUp") walk(0, -1);
        else if (k === "ArrowDown") walk(0, 1);
        else if (k === "Enter" || k === " ") open(focus);
        else if (k === "Escape") onClose();
        else return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") endHold();
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
    };
  });

  const learned = known.length;
  const waiting = pending.filter((p) => !SKILLS[p.skill].hidden);

  return (
    <div
      ref={root}
      className="vault"
      data-mode={mode}
      data-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label="Skills"
      data-modal="true"
    >
      <div className="vault-canvas">
        <canvas ref={canvas} />
      </div>
      <div className="vault-grain" aria-hidden="true" />

      <header className="vault-head">
        <small>Skills</small>
        <h1>{who.name}</h1>
        <p>
          {who.role} <span>·</span> {learned} {learned === 1 ? "technique" : "techniques"} learned
        </p>
      </header>
      <button
        className="vault-theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        <i data-sun={theme === "light" || undefined} aria-hidden="true" />
      </button>
      <button className="vault-close" onClick={onClose} aria-label="Close skills">
        <span aria-hidden="true">✕</span>
        <kbd>Esc</kbd>
      </button>
      {mode === "sky" && waiting.length > 0 && (
        <button className="vault-awaits" onClick={() => choose(waiting[0])}>
          <i aria-hidden="true" />
          {waiting.length === 1 ? "1 technique to choose" : `${waiting.length} techniques to choose`}
        </button>
      )}

      <div className="vault-labels">
        {shown.map((skill) => {
          const { level, into, span } = progress(skills[skill]);
          const def = CONSTELLATIONS[skill];
          const wants = waiting.some((p) => p.skill === skill);
          return (
            <button
              key={skill}
              ref={(el) => {
                if (el) labels.current.set(skill, el);
                else labels.current.delete(skill);
              }}
              className="vault-label"
              data-group={SKILLS[skill].group}
              data-selected={(mode === "sky" && (hover ?? focus) === skill) || undefined}
              data-focus={(mode !== "sky" && focus === skill) || undefined}
              data-untried={level === 0 || undefined}
              tabIndex={mode === "sky" ? 0 : -1}
              aria-label={`${SKILLS[skill].name}, level ${level}${wants ? ", a technique to choose" : ""}`}
              onMouseEnter={() => setHover(skill)}
              onMouseLeave={() => setHover(undefined)}
              onFocus={() => setFocus(skill)}
              onClick={() => open(skill)}
            >
              <span className="vault-hit" aria-hidden="true" />
              <small>{def.title}</small>
              <strong>
                {SKILLS[skill].name} <b>{level}</b>
              </strong>
              <span className="vault-label-bar" aria-hidden="true">
                <i style={{ width: `${level >= MAX_LEVEL ? 100 : Math.round((into / span) * 100)}%` }} />
              </span>
              {wants && <em>Technique ready</em>}
            </button>
          );
        })}
      </div>

      {mode === "skill" && (
        <SkillPage
          key={focus}
          skill={focus}
          skills={skills}
          known={known}
          pending={waiting}
          onChoose={choose}
          onBack={() => setMode("sky")}
          onStep={step}
        />
      )}

      {mode === "choose" && pick && (
        <div className="vault-choose" data-ready={ready || undefined} data-bound={bound ? true : undefined}>
          <header>
            {start.levelUp && pick === start.pick && (
              <span className="vault-rises">
                {SKILLS[pick.skill].name} reached level {pick.tier}
              </span>
            )}
            <small>
              {SKILLS[pick.skill].name} · level {pick.tier} technique
            </small>
            <h2>Choose a technique</h2>
            <p>Pick one. The other stays unlearned for this life.</p>
          </header>
          <div className="vault-plates" data-count={pick.options.length}>
            {pick.options.map((id, i) => {
              const def = technique(id);
              return (
                <button
                  key={id}
                  ref={(el) => {
                    plates.current[i] = el;
                  }}
                  className="vault-plate"
                  style={{ "--i": i } as CSSProperties}
                  data-group={SKILLS[pick.skill].group}
                  data-focus={plate === i || undefined}
                  data-held={held === i || undefined}
                  data-bound={bound === id || undefined}
                  data-dropped={(bound && bound !== id) || undefined}
                  onMouseEnter={() => setPlate(i)}
                  onFocus={() => setPlate(i)}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    startHold(i);
                  }}
                  onPointerUp={endHold}
                  onPointerCancel={endHold}
                  aria-label={`${def.name}: ${def.does}. Hold to choose.`}
                >
                  <span className="vault-plate-body">
                    <span className="vault-glyph" aria-hidden="true">
                      <i />
                    </span>
                    <span className="vault-plate-text">
                      <strong>{def.name}</strong>
                      <span>{def.does}</span>
                      <em>{def.flavor}</em>
                    </span>
                    <span className="vault-hold">
                      <i />
                      <span>{held === i ? "Keep holding…" : "Hold to choose"}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <footer>
            <button className="vault-later" onClick={leaveChoice}>
              Decide later
            </button>
            <span className="vault-keys">
              <kbd>←</kbd>
              <kbd>→</kbd> choose · hold <kbd>Enter</kbd> or the card · <kbd>Esc</kbd> later
            </span>
          </footer>
          {bound && (
            <div className="vault-flourish" aria-live="polite">
              <strong>
                {[...technique(bound).name].map((ch, i) => (
                  <span key={i} style={{ "--i": i } as CSSProperties}>
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </strong>
              <small>Learned · {SKILLS[pick.skill].name}</small>
            </div>
          )}
        </div>
      )}

      {mode === "sky" && (
        <footer className="vault-hints">
          <kbd>←</kbd>
          <kbd>↑</kbd>
          <kbd>→</kbd>
          <kbd>↓</kbd> wander · <kbd>Enter</kbd> look closer · <kbd>Esc</kbd> return
        </footer>
      )}
    </div>
  );
}

/** The printed page beside a constellation: what it is, how far along, and
 * the three stars that hold techniques. */
function SkillPage({
  skill,
  skills,
  known,
  pending,
  onChoose,
  onBack,
  onStep,
}: {
  skill: SkillId;
  skills: Skills;
  known: readonly TechniqueId[];
  pending: readonly Pick[];
  onChoose: (p: Pick) => void;
  onBack: () => void;
  onStep: (by: number) => void;
}) {
  const def = CONSTELLATIONS[skill];
  const info = SKILLS[skill];
  const { level, into, span } = progress(skills[skill]);
  const lit = litStars(def.stars.length, level, level >= MAX_LEVEL ? 0 : into / span);
  return (
    <aside className="vault-page" data-group={info.group}>
      <div className="vault-panel">
        <nav className="vault-page-nav">
          <button onClick={onBack}>‹ All skills</button>
          <span>
            <button onClick={() => onStep(-1)} aria-label="Previous skill">‹</button>
            <button onClick={() => onStep(1)} aria-label="Next skill">›</button>
          </span>
        </nav>
        <header style={{ "--i": 0 } as CSSProperties}>
          <div>
            <small>{def.title}</small>
            <h2>{info.name}</h2>
            <p className="vault-rank">{rankOf(level)}</p>
          </div>
          <b className="vault-level">{level}</b>
        </header>
        <div className="vault-progress" style={{ "--i": 1 } as CSSProperties}>
          <span className="vault-bar">
            {/* The whole road to ten, with the three technique levels marked. */}
            <i style={{ width: `${level >= MAX_LEVEL ? 100 : (level + into / span) * 10}%` }} />
            {TIERS.map((t) => (
              <b key={t} style={{ left: `${t * 10}%` }} data-past={level >= t || undefined} />
            ))}
          </span>
          <small>{level >= MAX_LEVEL ? "Mastered" : `${Math.floor(into)} / ${span} XP to level ${level + 1}`}</small>
        </div>
        <div className="vault-about" style={{ "--i": 2 } as CSSProperties}>
          <Chart skill={skill} lit={lit} />
          <p>{def.epigraph}</p>
        </div>
        <dl style={{ "--i": 4 } as CSSProperties}>
          <dt>Learned by</dt>
          <dd>{info.earned}</dd>
          {level > 0 && (
            <>
              <dt>Bonus now</dt>
              <dd>{info.perk(level)}</dd>
            </>
          )}
        </dl>
        <ol className="vault-tiers">
          {TIERS.map((tier, n) => {
            const options = optionsAt(skill, tier);
            const chosen = options.find((id) => known.includes(id));
            const p = pending.find((x) => x.skill === skill && x.tier === tier);
            const state = chosen ? "chosen" : p ? "waiting" : level >= tier ? "unbuilt" : "locked";
            return (
              <li key={tier} data-state={state} style={{ "--i": 5 + n } as CSSProperties}>
                <h4>
                  <i aria-hidden="true" />
                  Level {tier}
                  <small>
                    {state === "chosen" ? "Learned" : state === "waiting" ? "Choose now" : state === "locked" ? "Locked" : "Coming later"}
                  </small>
                </h4>
                <div className="vault-tablets">
                  {options.map((id) => {
                    const t = technique(id);
                    return (
                      <div
                        key={id}
                        className="vault-tablet"
                        data-chosen={chosen === id || undefined}
                        data-passed={(chosen && chosen !== id) || undefined}
                        data-unbuilt={t.ready === false || undefined}
                      >
                        <strong>{t.name}</strong>
                        <span>{t.ready === false ? "Not in the game yet" : t.does}</span>
                      </div>
                    );
                  })}
                </div>
                {p && (
                  <button className="vault-choose-here" onClick={() => onChoose(p)}>
                    Choose technique ›
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

/** The constellation engraved small, as a plate in the margin of the page. */
function Chart({ skill, lit }: { skill: SkillId; lit: number }) {
  const def = CONSTELLATIONS[skill];
  const ms = milestoneStars(def.stars.length);
  return (
    <svg className="vault-chart" viewBox="-60 -60 120 120" aria-hidden="true">
      <circle r="57" />
      {def.lines.map(([i, j]) => (
        <line
          key={`${i}-${j}`}
          x1={def.stars[i][0]}
          y1={def.stars[i][1]}
          x2={def.stars[j][0]}
          y2={def.stars[j][1]}
          data-lit={(lit >= i + 1 && lit >= j + 1) || undefined}
        />
      ))}
      {def.stars.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={ms.includes(i) ? 4.5 : 3}
          data-lit={lit >= i + 1 || undefined}
          data-milestone={ms.includes(i) || undefined}
        />
      ))}
    </svg>
  );
}
