import { useEffect, useMemo, useRef, useState } from "react";
import { gameAudio } from "../../audio/director";
import { timeSound } from "../../audio/time";
import { formatHistoricalYear } from "../../core/calendar";
import { endOfLife, liveOn, liveYears, type YearLine } from "../../core/time/years";
import type { Runtime } from "../../runtime/session";
import { retainTerrainWorker, takeTerrainWorker } from "../../runtime/terrain-worker-owner";
import { regionAt } from "../../content/geography/region-label";
import { CharacterSprite } from "../CharacterSprite";
import { SplashStars } from "../SplashStars";
import { bannerFor } from "../splash-banner";
import { calm } from "../motion";
import "./time.css";

const QUIET_MS = 240;
const LINE_MS = 1300;
const SOUND: Partial<Record<YearLine["kind"], "warm" | "rest" | "talk" | "select">> = {
  born: "warm",
  died: "rest",
  death: "rest",
  wed: "talk",
};

/**
 * The life run forward under the night sky, a year at a time: who was born,
 * who died, who married and left, the news, the body. Stop on any year to
 * play a day of it, older, in the same house; or watch to the end.
 */
export function Years({ runtime, toEnd, onClose }: { runtime: Runtime; toEnd: boolean; onClose: () => void }) {
  const engine = runtime.engine;
  const life = useMemo(() => liveYears(engine), [engine]);
  const p = engine.state.player;
  const setting = engine.world.pack.setting!;
  const beats = useMemo(
    () => life.years.flatMap((y, yi) => (y.lines.length ? y.lines.map((_, li) => ({ yi, li })) : [{ yi, li: -1 }])),
    [life],
  );
  const [beat, setBeat] = useState(calm() ? beats.length : 0);
  const [paused, setPaused] = useState(false);
  const [fast, setFast] = useState(toEnd);
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLOListElement>(null);
  const done = beat >= beats.length;
  const at = beat ? beats[beat - 1] : undefined;
  const current = at ? life.years[at.yi] : undefined;
  const year = current?.year ?? life.from;
  const age = current?.age ?? p.age ?? 30;
  const dead = !!life.died && done;

  useEffect(() => {
    runtime.flushAmbient();
    runtime.stop(false);
    runtime.timeTravelLocked = true;
    if (!calm()) void gameAudio()?.sound(timeSound(false), "time-travel");
    return () => {
      runtime.timeTravelLocked = false;
      runtime.resumeAmbient();
      runtime.emit(false);
    };
  }, [runtime]);

  useEffect(() => {
    if (done || paused) return;
    const next = beats[beat];
    const quiet = next.li < 0;
    const t = setTimeout(() => {
      if (!quiet) gameAudio()?.event(SOUND[life.years[next.yi].lines[next.li].kind] ?? "select");
      setBeat((n) => n + 1);
    }, (quiet ? QUIET_MS : LINE_MS) / (fast ? 4 : 1));
    return () => clearTimeout(t);
  }, [beat, done, paused, fast, beats, life]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: calm() ? "auto" : "smooth" });
  }, [beat]);

  const live = (y: number) => {
    if (busy) return;
    setBusy(true);
    // Let the button show it was pressed before the world is rebuilt.
    setTimeout(() => {
      const next = life.died && y >= life.died.year ? endOfLife(engine, life) : liveOn(engine, life, y);
      const worker = takeTerrainWorker(engine.world);
      if (worker) retainTerrainWorker(next.world, worker);
      runtime.replace(next, false, true);
      runtime.notice = `${setting.location}, ${formatHistoricalYear(y)}.`;
      runtime.emit(false);
      onClose();
    }, 30);
  };
  const primary = () => (dead ? live(life.died!.year) : current && !busy ? live(year) : undefined);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (![" ", "Enter", "Escape"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") onClose();
      else if (e.key === " ") setPaused((v) => !v);
      else primary();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  });

  const shown = life.years
    .map((y, yi) => ({ y, lines: y.lines.slice(0, beats.filter((b, i) => i < beat && b.yi === yi && b.li >= 0).length) }))
    .filter((x) => x.lines.length);
  const household = (current?.home ?? Object.values(life.people)
    .filter((x) => !x.away && x.born <= year && (x.died ?? Infinity) > year && (x.left ?? Infinity) > year)
    .sort((a, b) => a.born - b.born).map((x) => x.id))
    .filter((id) => id !== "player")
    .map((id) => {
      const x = life.people[id];
      const actor = engine.state.actors.find((a) => a.id === id);
      const appearance = actor
        ? runtime.appearanceFor({ ...actor, age: year - x.born })
        : x.drawn && runtime.appearanceFor({ id, sprite: "human-0-2", appearance: x.drawn.appearance, worn: x.drawn.worn, age: year - x.born });
      return { x, appearance, age: year - x.born };
    })
    .filter((m) => m.appearance);

  return (
    <div className="evening years" role="dialog" aria-modal="true" aria-label="The years">
      <SplashStars />
      <div className="evening-moon" aria-hidden="true" style={{ ["--phase" as string]: (beat * 0.37) % 1 }} />
      <div className="evening-horizon" aria-hidden="true">
        <img src={bannerFor(setting.culture, year, regionAt(setting.lon, setting.lat)?.id)} alt="" />
      </div>
      <div className="evening-card years-card">
        <div className="evening-ribbon">{toEnd ? "To the end" : "The years pass"}</div>
        <header className="years-head" data-dead={dead || undefined}>
          <span className="years-portrait">
            <CharacterSprite appearance={runtime.appearanceFor({ ...p, age })} age={age} portrait expression={dead ? "tired" : "neutral"} />
          </span>
          <span className="years-who">
            <b className="years-year" key={year}>{formatHistoricalYear(year)}</b>
            <span>
              {p.name}, {dead ? `died aged ${life.died!.age}` : `aged ${age}`}
            </span>
          </span>
        </header>
        {household.length > 0 && (
          <ul className="years-house" aria-label="At home">
            {household.slice(0, 9).map(({ x, appearance, age: n }) => (
              <li key={x.id} title={x.name}>
                <span className="years-house-face">
                  <CharacterSprite appearance={appearance!} age={n} portrait />
                </span>
                <small>{x.first}, {n}</small>
              </li>
            ))}
          </ul>
        )}
        <ol className="years-log" ref={log} aria-live="polite">
          {!shown.length && <li className="years-quiet">The years begin.</li>}
          {shown.map(({ y, lines }) => (
            <li key={y.year}>
              <button
                className="years-mark"
                disabled={busy}
                onClick={() => live(y.year)}
                title={y.lines.some((l) => l.kind === "death") ? "See how it ended" : `Live a day in ${formatHistoricalYear(y.year)}`}
              >
                {formatHistoricalYear(y.year).replace(/ CE$/, "")}
                <small>aged {y.age}</small>
              </button>
              <ul>
                {lines.map((l, i) => (
                  <li key={i} data-kind={l.kind} title={l.note}>
                    {l.label && <em>{l.label}</em>}
                    {l.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <footer className="years-actions">
          <button className="years-quiet-button" onClick={onClose} disabled={busy}>
            Back to today <kbd>Esc</kbd>
          </button>
          {!done && (
            <button className="years-quiet-button" onClick={() => setPaused((v) => !v)}>
              {paused ? "Go on" : "Pause"} <kbd>Space</kbd>
            </button>
          )}
          {!done && !fast && (
            <button className="years-quiet-button" onClick={() => setFast(true)}>
              Faster
            </button>
          )}
          <button className="evening-sleep ready" onClick={primary} disabled={busy || (!dead && !current)}>
            {busy ? "…" : dead ? "See how it ended" : `Live ${formatHistoricalYear(year)}`} <kbd>↵</kbd>
          </button>
        </footer>
      </div>
    </div>
  );
}
