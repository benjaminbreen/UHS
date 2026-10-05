import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Point } from "../core/types";
import type { Runtime } from "../runtime/session";
import { currentSheets, loadSheets, type SheetName } from "./sprite-atlas";
import { TaskScene } from "./task-scene";
import { SkyRenderer, type SkyLook } from "./skill-sky";
import { taskFigure } from "./task-figure";
import { taskView, tasksOf, type Part, type TaskSource, type TaskView } from "./task-view";
import { wikiSummary, type WikiSummary } from "./wiki";
import { smallMemoryDevice } from "../runtime/device";
import "./task-sky.css";

const EVIDENCE = {
  documented: "Documented",
  inferred: "Inferred",
  hypothesis: "Hypothesis",
  fictional: "Invented",
};
const EVIDENCE_SAYS = {
  documented: "Attested for this time and place.",
  inferred: "A reasonable extrapolation from what is attested nearby or later.",
  hypothesis: "A reconstruction some scholars argue for; the record is thin.",
  fictional: "Invented for the game where nothing is known.",
};
const PARTS = { morning: "Morning", midday: "Midday", evening: "Evening", night: "Night" };
/** The skills screen's sky at the task's hour: its night is the skills sky itself. */
const LOOKS: Record<Part, SkyLook> = { morning: "dawn", midday: "day", evening: "dusk", night: "dark" };

/** Two ways of drawing the task, kept side by side while they are compared:
 * the skills screen's campfire seen from afar, or a closer, larger scene. */
type Style = "campfire" | "close";
const STYLE_KEY = "uhs-task-view";
function savedStyle(): Style {
  try {
    return localStorage.getItem(STYLE_KEY) === "close" ? "close" : "campfire";
  } catch {
    return "campfire";
  }
}
type Stage = {
  show(view: TaskView, skyline: HTMLCanvasElement[]): void;
  leave(): void;
  destroy(): void;
  still: boolean;
};
function campfire(el: HTMLCanvasElement, view: TaskView, skyline: HTMLCanvasElement[]): Stage {
  const r = new SkyRenderer(el, LOOKS[view.part]);
  r.set([]);
  // Room beside the fire for a well, a stall or a drying rack.
  r.clearing = 40;
  r.figure = taskFigure(view.vignette, view.companion);
  r.setSkyline(skyline);
  r.setFire(true);
  const watch = new ResizeObserver(() => r.resize());
  watch.observe(el.parentElement!);
  let last = view.key;
  return {
    show(v, masks) {
      r.setTheme(LOOKS[v.part]);
      if (v.key !== last) r.figure = taskFigure(v.vignette, v.companion);
      last = v.key;
      if (masks !== r.skyline) r.setSkyline(masks);
    },
    leave: () => r.setFire(false),
    destroy() {
      watch.disconnect();
      r.destroy();
    },
    still: r.still,
  };
}
function closeUp(el: HTMLCanvasElement, view: TaskView, skyline: HTMLCanvasElement[], seed: number): Stage {
  const s = new TaskScene(el, { part: view.part, vignette: view.vignette, companion: view.companion, seed, skyline });
  s.setTilt(1, true);
  s.setTilt(0);
  const resize = () => s.resize();
  window.addEventListener("resize", resize);
  return {
    show: (v, masks) => s.setSpec({ part: v.part, vignette: v.vignette, companion: v.companion, seed, skyline: masks }),
    leave: () => s.setTilt(1),
    destroy() {
      window.removeEventListener("resize", resize);
      s.destroy();
    },
    still: s.still,
  };
}

/**
 * One of the day's tasks, looked at closely: the settlement's own country at
 * the task's hour with the task being done in it, what the game knows about
 * it, and, set apart, what the historical record says.
 */
export function TaskSky({
  runtime,
  start,
  onClose,
  onGuide,
  onPin,
  pinned,
}: {
  runtime: Runtime;
  start: TaskSource;
  onClose: () => void;
  onGuide: (to: Point, label: string) => void;
  onPin: (goalId: string) => void;
  pinned?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Stage>(null);
  const [style, setStyle] = useState<Style>(savedStyle);
  const [source, setSource] = useState<TaskSource>(start);
  const [leaving, setLeaving] = useState(false);
  // The first opening waits for the camera to come down; switching tasks after does not.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2000);
    return () => clearTimeout(t);
  }, []);
  const view = useMemo(() => taskView(runtime, source), [runtime, source]);
  const actorId = source.kind === "plan" ? source.actorId : runtime.engine.state.player.id;
  const tasks = useMemo(() => tasksOf(runtime, actorId), [runtime, actorId]);
  const skyline = useSkyline(runtime);
  const seed = useMemo(() => hash(runtime.engine.state.manifest.seed), [runtime]);

  useEffect(() => {
    if (!canvas.current || !view) return;
    const s = style === "campfire" ? campfire(canvas.current, view, skyline) : closeUp(canvas.current, view, skyline, seed);
    scene.current = s;
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {
      /* The choice lasts the session without storage. */
    }
    return () => s.destroy();
    // A renderer per style; later tasks and skylines go through show().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);
  useEffect(() => {
    if (view) scene.current?.show(view, skyline);
  }, [view?.key, view?.part, skyline]);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    scene.current?.leave();
    setTimeout(onClose, scene.current?.still ? 0 : 520);
  };
  const step = (by: number) => {
    const i = tasks.findIndex((t) => key(t.source) === key(source));
    const next = tasks[(i + by + tasks.length) % tasks.length];
    if (next) setSource(next.source);
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", down, true);
    return () => window.removeEventListener("keydown", down, true);
  });

  if (!view)
    return (
      <div className="tasks" role="dialog" aria-modal="true" data-modal="true" aria-label="Task">
        <button className="tasks-close" onClick={onClose}>✕</button>
      </div>
    );
  const s = runtime.engine.state;
  const setting = runtime.engine.world.pack.setting;
  const year = setting?.year ?? runtime.engine.world.pack.year;
  return (
    <div className="tasks" data-leaving={leaving || undefined} data-settled={settled || undefined} data-part={view.part} role="dialog" aria-modal="true" data-modal="true" aria-label={view.title}>
      <div className="tasks-canvas">
        <canvas ref={canvas} key={style} aria-hidden="true" />
      </div>
      <header className="tasks-head" key={`h-${view.key}`}>
        <small>
          {view.kicker} · {PARTS[view.part]}
        </small>
        <h1>{view.title}</h1>
        <p>
          {view.who.name}
          <span>·</span>
          {view.who.role}
          <span>·</span>
          {setting?.location ?? runtime.engine.world.pack.name}, {year > 0 ? `${year} CE` : `${1 - year} BCE`}
        </p>
      </header>
      <button className="tasks-view" onClick={() => setStyle((v) => (v === "campfire" ? "close" : "campfire"))} title="Switch between the campfire and the close view">
        View: {style === "campfire" ? "Campfire" : "Close"}
      </button>
      <button className="tasks-close" onClick={close} aria-label="Close">
        ✕ <kbd>Esc</kbd>
      </button>
      <section className="tasks-panel tasks-day" key={`d-${view.key}`} aria-label={view.who.self ? "Your day" : `${view.who.name}'s day`}>
        <h2>{view.who.self ? "Your day" : `${view.who.name.split(" ")[0]}'s day`}</h2>
        <dl>
          {view.where && (
            <div style={{ "--i": 0 } as CSSProperties}>
              <dt>Where</dt>
              <dd>{view.where.label}</dd>
            </div>
          )}
          {view.facts.map((f, i) => (
            <div key={f.label} style={{ "--i": i + 1 } as CSSProperties}>
              <dt>{f.label}</dt>
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
        <div className="tasks-actions">
          {view.where?.pos && (
            <button className="primary" onClick={() => { onGuide(view.where!.pos!, view.title); close(); }}>
              Show me the way
            </button>
          )}
          {view.goalId && view.who.self && !view.done && (
            <button onClick={() => onPin(view.goalId!)} data-on={pinned === view.goalId || undefined}>
              {pinned === view.goalId ? "Today's aim ✓" : "Make this today's aim"}
            </button>
          )}
          {view.done && <span className="tasks-done">Done today</span>}
        </div>
        <p className="tasks-fine">From this world: the people, places and reasons are the game's own.</p>
      </section>
      <Record view={view} key={`r-${view.key}`} />
      <nav className="tasks-strip" aria-label="The day's tasks">
        <button onClick={() => step(-1)} aria-label="Previous task">‹</button>
        <ol>
          {tasks.map((t) => (
            <li key={key(t.source)}>
              <button data-on={key(t.source) === key(source) || undefined} onClick={() => setSource(t.source)} title={t.label}>
                {t.label}
              </button>
            </li>
          ))}
        </ol>
        <button onClick={() => step(1)} aria-label="Next task">›</button>
      </nav>
      <p className="tasks-keys" aria-hidden="true">
        <kbd>←</kbd>
        <kbd>→</kbd> the day · <kbd>Esc</kbd> return
        {s.player.id === actorId ? "" : ` · ${view.who.name.split(" ")[0]}`}
      </p>
    </div>
  );
}

/** The historical side, kept apart from the game's: accounts written for
 * this place and time first, then the reading, then on request a model's. */
function Record({ view }: { view: TaskView }) {
  const r = view.record;
  const [pages, setPages] = useState<WikiSummary[]>([]);
  const [account, setAccount] = useState<string>();
  const [asking, setAsking] = useState<"idle" | "busy" | "none">("idle");
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let live = true;
    setPages([]);
    setAccount(undefined);
    setAsking("idle");
    void Promise.all((r?.wiki ?? []).slice(0, 8).map(wikiSummary)).then((all) => {
      if (live) setPages(all.filter((p): p is WikiSummary => !!p).filter((p, i, a) => a.findIndex((q) => q.title === p.title) === i));
    });
    return () => {
      live = false;
    };
  }, [view.key]);
  useEffect(() => {
    void fetch("/api/task-lore", { signal: AbortSignal.timeout(3000) })
      .then((res) => (res.ok ? res.json() : undefined))
      .then((d) => setAvailable(!!d?.available))
      .catch(() => setAvailable(false));
  }, []);
  const ask = async () => {
    setAsking("busy");
    try {
      const res = await fetch("/api/task-lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ ...view.lore, note: (view.lore.note ?? "").slice(0, 600), evidence: r?.evidence ?? "" }),
      });
      const d = res.ok ? await res.json() : undefined;
      if (typeof d?.text === "string") {
        setAccount(d.text);
        setAsking("idle");
      } else setAsking("none");
    } catch {
      setAsking("none");
    }
  };
  if (!r && !pages.length && !available) return null;
  const lore = r?.lore ?? [];
  const shown = pages.slice(0, 2), more = pages.slice(2);
  return (
    <section className="tasks-panel tasks-record" aria-label="In the record" data-evidence={r?.evidence}>
      <h2>In the record</h2>
      {r?.note && (
        <div className="tasks-lore" data-evidence={r.evidence}>
          {r.evidence && <Stamp evidence={r.evidence} />}
          <p className="tasks-note">{r.note}</p>
        </div>
      )}
      {lore.map((l) => (
        <article className="tasks-lore" key={l.id} data-evidence={l.evidence}>
          <Stamp evidence={l.evidence} />
          <h3>{l.title}</h3>
          <p>{l.text}</p>
        </article>
      ))}
      {!!lore.length && <p className="tasks-says">Written for this game from the reading below. The stamp says how firm the evidence is.</p>}
      {shown.map((page) => (
        <article className="tasks-wiki" key={page.title}>
          {page.image && <img src={page.image} alt="" loading="lazy" />}
          <div>
            <strong>{page.title}</strong>
            <p>{page.extract}</p>
            <a href={page.url} target="_blank" rel="noreferrer">
              Read on Wikipedia ›
            </a>
          </div>
        </article>
      ))}
      {(!!more.length || !!r?.links.some((u) => !/wikipedia\.org/.test(u))) && (
        <ul className="tasks-links">
          {more.map((p) => (
            <li key={p.title}>
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.title}
              </a>
            </li>
          ))}
          {r?.links
            .filter((u) => !/wikipedia\.org/.test(u))
            .map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer">
                  {u.replace(/^https:\/\/(www\.)?/, "").split("/")[0]}
                </a>
              </li>
            ))}
        </ul>
      )}
      {!!r?.books.length && (
        <ul className="tasks-books">
          {r.books.map((b) => (
            <li key={b.title}>
              <cite>{b.title}</cite> — {b.author}, {b.year}. <span>{b.note}</span>
            </li>
          ))}
        </ul>
      )}
      {account ? (
        <div className="tasks-account">
          <small>Written by a language model from the notes above. Check the sources.</small>
          <p>{account}</p>
        </div>
      ) : available ? (
        <button className="tasks-ask" onClick={ask} disabled={asking === "busy"}>
          {asking === "busy" ? "Writing…" : asking === "none" ? "No account available" : "What would this have involved?"}
        </button>
      ) : null}
    </section>
  );
}
function Stamp({ evidence }: { evidence: keyof typeof EVIDENCE }) {
  return (
    <span className="tasks-stamp" title={EVIDENCE_SAYS[evidence]}>
      {EVIDENCE[evidence]}
    </span>
  );
}

const key = (s: TaskSource) => (s.kind === "goal" ? `g:${s.id}` : s.kind === "aim" ? "aim" : `p:${s.actorId}:${s.label}`);
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const images = new Map<string, Promise<HTMLImageElement>>();
const image = (src: string) => {
  let hit = images.get(src);
  if (!hit) {
    hit = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    images.set(src, hit);
  }
  return hit;
};
/** The settlement's own buildings, nearest the player first, as cut-outs for
 * the skyline. Until the sheets arrive, or where none match, a few plain
 * shapes stand in: huts before towns, flat roofs where it is dry. */
function useSkyline(runtime: Runtime) {
  const world = runtime.engine.world;
  const fallback = useMemo(() => shapes(runtime), [runtime]);
  const [cut, setCut] = useState<HTMLCanvasElement[]>(fallback);
  useEffect(() => {
    // Decorative cut-outs must not decode another full building atlas on a phone.
    if (smallMemoryDevice()) return;
    let live = true;
    const p = runtime.engine.state.player.pos;
    const here = p.space === "outside" ? p : (world.place(p.space)?.entrance ?? p);
    const sprites = [...new Set(
      [...world.places]
        .filter((b) => Math.hypot(b.entrance.x - here.x, b.entrance.y - here.y) < 120)
        .sort((a, b) => Math.hypot(a.entrance.x - here.x, a.entrance.y - here.y) - Math.hypot(b.entrance.x - here.x, b.entrance.y - here.y))
        .map((b) => b.sprite),
    )].slice(0, 8);
    void (async () => {
      const sheets = currentSheets() ?? (await loadSheets().catch(() => null));
      if (!sheets || !sprites.length) return;
      const out: HTMLCanvasElement[] = [];
      for (const sprite of sprites) {
        const name = (Object.keys(sheets) as SheetName[]).find((n) => sheets[n].frames[sprite]);
        if (!name) continue;
        const f = sheets[name].frames[sprite].frame;
        const img = await image(sheets[name].image).catch(() => undefined);
        if (!img) continue;
        const c = document.createElement("canvas");
        c.width = f.w;
        c.height = f.h;
        c.getContext("2d")!.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
        out.push(c);
      }
      if (live && out.length) setCut(out);
    })();
    return () => {
      live = false;
    };
  }, [runtime, world]);
  return cut;
}
function shapes(runtime: Runtime): HTMLCanvasElement[] {
  const setting = runtime.engine.world.pack.setting;
  const year = setting?.year ?? runtime.engine.world.pack.year;
  const dry = setting?.climate === "arid";
  const kind = year < -3000 || setting?.settlement === "camp" ? "hut" : dry ? "flat" : "gable";
  const make = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000";
    draw(g);
    return c;
  };
  if (kind === "hut")
    return [0, 1, 2].map((i) =>
      make(20, 14, (g) => {
        for (let y = 0; y < 14; y++) {
          const half = i === 1 ? Math.round((y / 14) * 10) : Math.round(Math.sqrt(1 - ((13 - y) / 14) ** 2) * 10);
          g.fillRect(10 - half, y, half * 2, 1);
        }
      }),
    );
  if (kind === "flat")
    return [0, 1, 2].map((i) =>
      make(18 + i * 6, 14 + i * 3, (g) => {
        g.fillRect(0, 3, 18 + i * 6, 11 + i * 3);
        g.fillRect(2, 0, 4, 3);
      }),
    );
  return [0, 1, 2].map((i) =>
    make(22 + i * 4, 18, (g) => {
      const w = 22 + i * 4;
      g.fillRect(2, 8, w - 4, 10);
      for (let y = 0; y < 9; y++) g.fillRect(Math.round(w / 2 - y * (w / 18)), y, Math.round(y * (w / 9)), 1);
      if (i === 2) g.fillRect(w - 7, 1, 2, 5);
    }),
  );
}
