import { useEffect, useRef } from "react";
import type { Engine } from "../core/engine";
import type { WorldSetting } from "../content/geography/types";
import type { StartingCharacter } from "../runtime/preparation";
import { formatHistoricalYear } from "../core/calendar";
import type { Snapshot } from "../core/types";
import { placeLabel } from "../content/geography/region-label";
import { aimLabel } from "../content/goals/types";
import { ArrivalPortrait } from "./ArrivalPortrait";
import { useArrival } from "./use-arrival";
import { birthPercentile } from "./arrival-data";
import glacialAtlas from "../assets/arrival-atlas-glacial.webp";
import modernAtlas from "../assets/arrival-atlas-modern.webp";
import "./arrival.css";
import "./arrival-descent.css";

// Degrees of longitude across the map pane at each loading stage.
const SPANS = [84, 30, 16];

/** Draws only the visible crop of the atlas: an <img> scaled to the zoom was a
 * layer tens of thousands of pixels wide and slowed the whole arrival. */
function DescentMap({ src, lon, lat, span, busy, still }: { src: string; lon: number; lat: number; span: number; busy: boolean; still: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef(span);
  target.current = span;
  const settle = useRef(busy);
  settle.current = busy;
  const wake = useRef<() => void>(undefined);
  useEffect(() => wake.current?.(), [span]);
  useEffect(() => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g || still) return;
    let loaded = false, alive = true, timer = 0, shown = SPANS[0];
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    // A timer, not a frame loop: an idle requestAnimationFrame still makes the
    // browser render every frame while the hidden game is building its scene.
    const draw = () => {
      const moving = Math.abs(shown - target.current) > 0.05;
      shown = calm ? target.current : shown + (target.current - shown) * 0.12;
      const creep = calm ? 1 : 1.35 - 0.35 * Math.exp(-(performance.now() - t0) / 25000);
      const w = Math.round(c.clientWidth * devicePixelRatio), h = Math.round(c.clientHeight * devicePixelRatio);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      // The atlas is equirectangular from 85°N to 85°S, so a degree is as many pixels down as across.
      const perDegree = image.width / 360;
      const sw = shown / creep * perDegree, sh = sw * h / w;
      g.fillStyle = "#12304a";
      g.fillRect(0, 0, w, h);
      g.imageSmoothingEnabled = false;
      g.drawImage(image, (lon + 180) * perDegree - sw / 2, (85 - lat) * perDegree - sh * .44, sw, sh, 0, 0, w, h);
      // Stepped like the art: ~24 fps while closing in, 4 fps for the slow creep.
      // Once the world has arrived the main thread is building the game; leave it be.
      timer = moving || !settle.current ? window.setTimeout(draw, moving ? 40 : 250) : 0;
    };
    const image = new Image();
    image.src = src;
    void image.decode().then(() => { loaded = true; if (alive) draw(); }, () => {});
    wake.current = () => { if (loaded && alive && !timer) draw(); };
    return () => { alive = false; clearTimeout(timer); };
  }, [src, lon, lat, still]);
  return <canvas ref={canvas} className="descent-map" />;
}

/** Who shares the roof, by first name and tie: "4 people: Petra (partner), Siobhán (child) and 1 more". */
function householdSummary({ player, households, actors }: Snapshot) {
  const home = households?.find((h) => h.members.includes(player.id) && (!player.householdId || h.id === player.householdId));
  const carried = player.identity?.household?.people;
  const ids = (home?.members ?? carried?.map((p) => p.id) ?? []).filter((id) => id !== player.id);
  if (!ids.length) return "Lives alone";
  const people = ids.flatMap((id) => {
    const person = actors.find((a) => a.id === id) ?? carried?.find((p) => p.id === id);
    return person ? [{ name: person.name, kind: player.relations?.find((r) => r.other === id)?.kind }] : [];
  });
  const firsts = people.map((p) => p.name.split(" ")[0]);
  const names = people.map(({ name, kind }, i) =>
    `${firsts.indexOf(firsts[i]) === firsts.lastIndexOf(firsts[i]) ? firsts[i] : name}${kind && kind !== "co-resident" ? ` (${kind.replace(/-/g, " ")})` : ""}`);
  const more = names.length - 3;
  return `${ids.length + 1} people: ${names.slice(0, 3).join(", ")}${more > 0 ? ` and ${more} more` : ""}`;
}

/** The arrival as a descent: the map closes on the place while the game's own
 * sidebar fills in, then the live start map shows through behind it. */
export function ArrivalDescent({ setting, engine, character, ready = !!engine, onEnter, onCancel }: {
  setting: WorldSetting;
  engine?: Engine;
  character?: StartingCharacter;
  ready?: boolean;
  onEnter: () => void;
  onCancel: () => void;
}) {
  const { requested, setRequested, leaving, opening, player, age, appearance, sex } = useArrival({ setting, engine, character, ready, onEnter });
  const stage = !player ? 0 : !engine ? 1 : !ready ? 2 : 3;
  const live = stage === 3;
  const enter = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (live) enter.current?.focus({ preventScroll: true }); }, [live]);
  // Only once the game may show: set while it is still building, this made every
  // hidden frame's compositor commit slow and more than doubled the time to ready.
  const phase = leaving ? "leaving" : live ? "live" : undefined;
  useEffect(() => {
    if (!phase) return;
    document.documentElement.dataset.arrival = phase;
    return () => { delete document.documentElement.dataset.arrival; };
  }, [phase]);
  const span = SPANS[Math.min(stage, 2)];
  const region = placeLabel(setting).slice(setting.location.length + 2);
  const birth = birthPercentile(setting.year);
  const work = engine?.dailyGoals().find((g) => g.slot === "work")?.text;
  const aim = engine?.state.lifeAim;
  const first = (player?.name ?? setting.characterName).split(" ")[0];
  const steps = ["Finding the place", `Building ${setting.location}`, `Waking ${first}`];
  const rows: [string, string | undefined][] = [
    ["Household", engine && householdSummary(engine.state)],
    ["Born", age === undefined ? undefined : formatHistoricalYear(setting.year - age)],
    ["Today's work", engine && (work ?? "No set work today")],
  ];
  const mine = birth === null ? 0 : Math.min(49, Math.floor(birth / 2));
  return <div className={`descent${live ? " is-live" : ""}${leaving ? " is-leaving" : ""}${opening ? " is-opening" : ""}`}
    data-modal="true" inert={leaving} role="dialog" aria-modal="true" aria-label={`Begin ${setting.characterName}'s life`}
    onAnimationEnd={(event) => { if (event.target === event.currentTarget && event.animationName === "descent-leave") onEnter(); }}>
    <section className="descent-stage" aria-hidden="true">
      <DescentMap src={setting.year <= -10000 ? glacialAtlas : modernAtlas} lon={setting.lon} lat={setting.lat} span={span} busy={!!engine} still={live} />
      <i className="descent-pin" />
    </section>
    <header className="descent-title">
      {region && <span>{region}</span>}
      <h2>{setting.location}</h2>
      <p>{formatHistoricalYear(setting.year)}</p>
    </header>
    <ol className="descent-steps" role="status" aria-label="Preparing the world">
      {steps.map((label, i) => <li key={i} className={i < stage ? "is-done" : i === stage ? "is-now" : undefined}>{label}</li>)}
    </ol>
    <aside className="descent-side">
      <div className="descent-who" aria-busy={!player}>
        <ArrivalPortrait appearance={appearance} age={age} />
        <div>
          <h1>{player?.name ?? setting.characterName}</h1>
          {player && <p>{player.role} · <b>{age}</b>{sex === "female" ? " · woman" : sex === "male" ? " · man" : ""}</p>}
        </div>
      </div>
      <dl className="descent-facts">
        {rows.map(([label, value]) => <div key={label} className={value === undefined ? "is-waiting" : undefined}>
          <dt>{label}</dt><dd>{value ?? <i />}</dd>
        </div>)}
      </dl>
      {aim && <div className="descent-card"><small>{aimLabel(aim)}</small><p>{aim.text}</p></div>}
      {birth !== null && <div className="descent-born">
        <div className="descent-squares" aria-hidden="true">{Array.from({ length: 50 }, (_, i) => <i key={i} className={i === mine ? "is-you" : i > mine ? "is-after" : undefined} />)}</div>
        <p>Born after <b>{birth}%</b> of everyone who has ever lived. Each square is 2%.{" "}
          <a href="https://www.prb.org/news/how-many-people-have-ever-lived-on-earth/" target="_blank" rel="noreferrer">Source</a></p>
      </div>}
      <div className="descent-actions">
        <button type="button" className="descent-back" onClick={onCancel}>Back</button>
        <button ref={enter} type="button" className="descent-enter" disabled={!engine || requested} onClick={() => setRequested(true)}>
          {requested ? "Entering life…" : engine ? "Enter life →" : `Building ${setting.location}…`}
        </button>
      </div>
    </aside>
  </div>;
}
