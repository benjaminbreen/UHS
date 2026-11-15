import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { seasonAt } from "../../core/livelihood";
import type { SeasonId } from "../../core/season";
import { skySeed, weatherAt } from "../../core/weather";
import { fishItemId, fishOf, fishingFinds, fishingWords, hullNames, seasonRun, waterOf, type FishKind, type FishingMethod, type FishingWater, type Hull } from "../../content/economy/fishing";
import { loadVoxelItems, voxelIcon } from "../../render/voxel-items";
import { fishingSound } from "../../audio/sfx";
import { gameAudio } from "../../audio/director";
import type { Runtime } from "../../runtime/session";
import { FishingArt, fishLength, fishSprite, type Look, type WaterPaletteName } from "./art";
import { livingProfile } from "../../render/living-water/profile";
import { FishingSim, H, MAX_MINUTES, W, type Catch, type SetKind, type Setup } from "./sim";
import "./fishing.css";

export type FishingStart = { setup: Setup; look: Look; title: string; place: string; log: Record<string, { n: number; best: number }> };

/** Places to try the game without a fisher's day: one per kind of water, craft and gear. */
export const FISHING_PRESETS = [
  { id: "bergen", palette: "blue", label: "Bergen, 1700 · hand lines from a clinker boat", place: "Bergen", climate: "temperate", culture: "european", water: "sea", method: "line", hull: "plank", afloat: true, hour: 6, season: "autumn" },
  { id: "nile", palette: "silt", label: "Nile, 1900 BCE · cast net from a reed skiff", place: "The Nile at Thebes", climate: "arid", culture: "north-african-west-asian", water: "river", method: "net", hull: "reed", afloat: true, hour: 7, season: "autumn" },
  { id: "kyoto", palette: "green", label: "Kyoto, 1350 · line from the Kamo bank", place: "The Kamo river, Kyoto", climate: "temperate", culture: "east-asian", water: "river", method: "line", afloat: false, hour: 17, season: "spring" },
  { id: "hawaii", palette: "lagoon", label: "Hawaiʻi, 1600 · spear in the reef shallows", place: "Kealakekua", climate: "tropical", culture: "australian-pacific", water: "sea", method: "spear", afloat: false, hour: 11, season: "summer" },
  { id: "columbia", palette: "blue", label: "Columbia River, 1800 · salmon spear", place: "Celilo, on the Columbia", climate: "boreal", culture: "other-indigenous-american", water: "river", method: "spear", afloat: false, hour: 6, season: "autumn" },
  { id: "amazon", palette: "murky", label: "Amazon, 1500 · line from a dugout at dusk", place: "The Amazon near Santarém", climate: "tropical", culture: "other-indigenous-american", water: "river", method: "line", hull: "dugout", afloat: true, hour: 18, season: "winter" },
  { id: "severn", palette: "murky", label: "Severn, 1450 · seine from the bank", place: "The Severn below Gloucester", climate: "temperate", culture: "european", water: "river", method: "seine", afloat: false, hour: 8, season: "summer" },
  { id: "titicaca", palette: "blue", label: "Lake Titicaca, 1450 · net from a totora boat", place: "Lake Titicaca", climate: "boreal", culture: "andean", water: "lake", method: "net", hull: "reed", afloat: true, hour: 9, season: "summer" },
] as const satisfies readonly { id: string; palette: WaterPaletteName; label: string; place: string; climate: string; culture: string; water: FishingWater; method: FishingMethod; hull?: Hull; afloat: boolean; hour: number; season: SeasonId }[];
export type FishingPreset = (typeof FISHING_PRESETS)[number];

/** The game for where the player stands, or a preset; `method` and `hour` override either. */
export function fishingStart(runtime: Runtime, preset?: FishingPreset, method?: FishingMethod, hourOverride?: number): FishingStart {
  const e = runtime.engine, s = e.world.pack.setting, clock = e.state.clock;
  const here = e.fishingHere();
  const weather = weatherAt(skySeed(e.state.manifest), s?.climate ?? "temperate", s?.season ?? "spring", clock);
  const seasonHere = (seasonAt(s?.season ?? "spring", clock) ?? "spring") as SeasonId;
  const climate = preset?.climate ?? s?.climate ?? "temperate";
  const culture = preset?.culture ?? s?.culture ?? "european";
  const water: FishingWater = preset?.water ?? here?.practice.water ?? (s && waterOf(s)) ?? "river";
  const m: FishingMethod = method ?? preset?.method ?? here?.practice.method ?? "line";
  const hull = preset ? ("hull" in preset ? preset.hull : undefined) : here?.practice.hull;
  const afloat = preset ? preset.afloat : !!here?.afloat;
  const season = preset?.season ?? seasonHere;
  const hour = hourOverride ?? preset?.hour ?? ((clock / 3600) % 24);
  const live = !preset;
  const setup: Setup = {
    seed: `${e.state.manifest.seed}:fishing:${Math.floor(clock / 60)}:${preset?.id ?? ""}`,
    method: m, water, hull, afloat,
    kinds: fishOf({ climate: climate as never, culture: culture as never }, water),
    hour, run: seasonRun({ climate: climate as never }, season),
    rain: live ? weather.rain : 0, wind: live ? weather.wind.strength : 0.2,
    snow: live && weather.condition === "snow", mist: live && weather.condition === "mist",
    season,
    finds: fishingFinds(water).flatMap(([id, kg, weight]) => { const it = e.item(id); return it ? [{ id, name: it.name, kg, weight }] : []; }),
    sets: { pot: m === "trap" ? 5 : 3, weir: !afloat, net: true },
  };
  const words = fishingWords[m];
  const title = afloat ? words.fish : words.shore;
  const craft = afloat && hull ? hullNames[hull].name.toLowerCase() : undefined;
  return {
    setup, title: craft ? `${title}, from a ${craft}` : title,
    place: preset?.place ?? s?.location ?? "The water",
    log: e.state.fishLog ?? {},
    look: { climate, season, culture, palette: preset?.palette ?? waterNear(runtime) ?? "murky", appearance: runtime.appearanceFor(e.state.player) },
  };
}

/** The palette the world paints the nearest water in. */
function waterNear(runtime: Runtime): WaterPaletteName | undefined {
  const top = runtime.engine.world.topography, p = runtime.engine.state.player.pos;
  if (!top) return;
  for (let r = 0; r <= 4; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const c = top(Math.round(p.x) + dx, Math.round(p.y) + dy);
        if (c?.surface === "water" && c.waterVisual) return livingProfile(c).palette;
      }
}

const clockText = (hour: number) => {
  const h = Math.floor(hour) % 24, m = Math.floor((hour % 1) * 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
const spriteUrl = new Map<string, string>();
function fishUrl(c: Catch) {
  const key = `${c.kind.name}:${fishLength(c.kg)}`;
  let url = spriteUrl.get(key);
  if (!url) spriteUrl.set(key, (url = fishSprite(c.kind, fishLength(c.kg)).toDataURL()));
  return url;
}
const iconUrls = new Map<string, string>();
function iconUrl(id: string) {
  let url = iconUrls.get(id);
  if (!url) {
    const c = voxelIcon(id);
    if (c) iconUrls.set(id, (url = c.toDataURL()));
  }
  return url;
}
function Pic({ c }: { c: Catch }) {
  const url = iconUrl(c.find ?? fishItemId(c.kind));
  if (url) return <img className="fg-icon" src={url} alt="" />;
  return c.find ? null : <img src={fishUrl(c)} alt="" style={{ width: fishSprite(c.kind, fishLength(c.kg)).width * 3 }} />;
}
const Stars = ({ n }: { n?: number }) => (n ? <i className="fg-stars">{"★".repeat(n)}</i> : null);

/** What each set gear is called where the player stands. */
function gearNames(look: Look, water: FishingWater): Record<SetKind, string> {
  const asia = look.culture === "east-asian" || look.culture === "southeast-asian";
  return {
    pot: asia ? "Bamboo trap" : water === "sea" ? (look.culture === "european" ? "Lobster pot" : "Basket trap") : look.culture === "european" ? "Wicker trap" : "Basket trap",
    weir: water === "sea" ? "Stone weir" : look.climate === "boreal" ? "Salmon weir" : "Wattle weir",
    net: "Set net",
  };
}
const whenText = (k: FishKind) =>
  [
    k.when?.hours === "night" ? "bites at night" : k.when?.hours === "twilight" ? "bites at dawn and dusk" : k.when?.hours === "day" ? "bites by day" : "",
    k.when?.seasons ? `in ${k.when.seasons.join(" and ")}` : "",
    k.when?.rain ? "when it rains" : "",
    k.trap ? "goes into traps" : "",
    k.rare ? "seldom seen" : "",
  ].filter(Boolean).join(", ") || "about most days";
const kgText = (kg: number) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(kg < 10 ? 1 : 0)} kg`);

type Toast = { id: number; c: Catch; at: number; first: boolean };

export function FishingGame({ start, practice, onLeave }: { start: FishingStart; practice?: boolean; onLeave: (spell?: { caught: { id: string; kg: number }[]; minutes: number }) => void }) {
  const sim = useMemo(() => new FishingSim(start.setup), [start]);
  const art = useMemo(() => new FishingArt(sim, start.look), [sim, start]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(3);
  const [, setFrame] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [done, setDone] = useState(false);
  const [book, setBook] = useState(false);
  const [fresh, setFresh] = useState<{ c: Catch; at: number }>();
  const toastId = useRef(0);
  const names = useMemo(() => gearNames(start.look, start.setup.water), [start]);
  const findName = (c: Catch) => (c.find ? start.setup.finds.find((f) => f.id === c.find)?.name ?? "Something" : c.kind.name);
  const seen = (k: FishKind) => !!start.log[fishItemId(k)] || sim.caught.some((c) => c.kind === k);

  const pick = (kind: SetKind) => (sim.placing = sim.placing === kind || !sim.left(kind) ? undefined : kind);
  const gear = (["pot", "weir", "net"] as const).filter((k) => (k === "pot" ? start.setup.sets.pot : start.setup.sets[k]));
  useEffect(() => void loadVoxelItems(), []);

  useEffect(() => {
    const fit = () => setScale(Math.max(1, Math.min(6, Math.floor(Math.min((innerWidth - 32) / W, (innerHeight - 150) / H)))));
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const g = canvas.current!.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    let last = performance.now(), raf = 0, hud = 0;
    const audio = gameAudio();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!done && !book) sim.update(dt);
      for (const ev of sim.take()) {
        const pan = "x" in ev && ev.x !== undefined ? (ev.x / W) * 1.4 - 0.7 : 0;
        if (ev.type === "land") {
          const c = ev.catch, first = !c.find && !start.log[fishItemId(c.kind)] && sim.caught.find((x) => x.kind === c.kind) === c;
          void audio?.sound(fishingSound(c.find ? "find" : first ? "new" : c.best ? "best" : "land", c.kg > 3), "fish-land");
          if (c.stars) void audio?.sound(fishingSound("star", c.stars > 1), "fish-star");
          if (first) setFresh({ c, at: now });
          setToasts((t) => [...t.slice(-3), { id: toastId.current++, c, at: now, first }]);
        } else void audio?.sound(fishingSound(ev.type, "big" in ev && !!ev.big), `fish-${ev.type}`, pan, ev.type === "nibble" ? 60 : 30);
      }
      art.draw(g);
      if (now - hud > 200) {
        hud = now;
        setFrame((f) => f + 1);
        setToasts((t) => t.filter((x) => now - x.at < 2600));
        setFresh((f) => (f && now - f.at > 3200 ? undefined : f));
        if (sim.minutes >= MAX_MINUTES && !done) setDone(true);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sim, art, done, book, start]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (["escape", " ", "f", "a", "d", "arrowleft", "arrowright", "w", "s", "arrowup", "arrowdown", "b", "1", "2", "3"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (k === "b") return setBook((b) => !b);
      if (k === "escape") {
        if (book) return setBook(false);
        if (sim.placing) return void (sim.placing = undefined);
        return setDone((d) => !d);
      }
      if (done || book) return;
      const kind = gear[+k - 1];
      if (kind) return pick(kind);
      if ((k === " " || k === "f") && !e.repeat) sim.press();
      if (k === "a" || k === "arrowleft") nudge(-1);
      if (k === "d" || k === "arrowright") nudge(1);
    };
    const nudge = (dir: number) => {
      if (sim.gear === "spear") {
        const at = sim.spearPoint();
        sim.pointer = { x: at.x + dir * 6, y: at.y };
      } else sim.aim = Math.max(-1.15, Math.min(1.15, sim.aim + dir * 0.08));
    };
    const vertical = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (sim.gear !== "spear" || done) return;
      const at = sim.spearPoint();
      if (k === "w" || k === "arrowup") sim.pointer = { x: at.x, y: at.y - 5 };
      if (k === "s" || k === "arrowdown") sim.pointer = { x: at.x, y: at.y + 5 };
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "f") {
        e.preventDefault();
        e.stopPropagation();
        sim.release();
      }
    };
    const both = (e: KeyboardEvent) => { down(e); vertical(e); };
    addEventListener("keydown", both, true);
    addEventListener("keyup", up, true);
    return () => {
      removeEventListener("keydown", both, true);
      removeEventListener("keyup", up, true);
    };
  }, [sim, done, book]);

  const toGame = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const point = (e: React.PointerEvent) => {
    const p = toGame(e), h = sim.hand;
    sim.pointer = p;
    if (sim.phase.kind === "aim" && sim.gear !== "spear")
      sim.aim = Math.max(-1.15, Math.min(1.15, Math.atan2(p.x - h.x, (h.y - p.y) / 0.85)));
  };

  const caught = sim.caught;
  const best = caught.reduce<Catch | undefined>((b, c) => (!b || c.kg > b.kg ? c : b), undefined);
  const byKind = [...caught.reduce((m, c) => {
    const x = m.get(c.find ?? c.kind.name) ?? { c, n: 0, kg: 0 };
    x.n++;
    x.kg += c.kg;
    if (c.kg > x.c.kg) x.c = c;
    return m.set(c.find ?? c.kind.name, x);
  }, new Map<string, { c: Catch; n: number; kg: number }>()).values()].sort((a, b) => b.kg - a.kg);
  const feeding = sim.feeding;
  const finish = () => onLeave(practice ? undefined : {
    caught: sim.caught.map((c) => ({ id: c.find ?? fishItemId(c.kind), kg: +c.kg.toFixed(2) })),
    minutes: Math.max(1, Math.round(sim.minutes)),
  });
  const isNew = (c: Catch) => !c.find && !start.log[fishItemId(c.kind)];
  const kinds = start.setup.kinds, seenCount = kinds.filter(seen).length;

  return createPortal(
    <div className="fg-overlay" role="dialog" aria-label="Fishing">
      <header className="fg-top" style={{ width: W * scale }}>
        <div>
          <h2>{start.title}</h2>
          <p>{start.place}{practice ? " · practice, nothing is recorded" : ""}</p>
        </div>
        <div className="fg-clock">
          <b>{clockText(sim.hour)}</b>
          <span data-level={feeding > 1.15 ? "high" : feeding < 0.85 ? "low" : "mid"}>
            {feeding > 1.15 ? "The fish are feeding" : feeding < 0.85 ? "A slack hour" : "Fish about"}
          </span>
        </div>
      </header>
      <div className="fg-stage" style={{ width: W * scale, height: H * scale }}>
        <canvas
          ref={canvas}
          width={W}
          height={H}
          style={{ width: W * scale, height: H * scale }}
          onPointerMove={point}
          onPointerDown={(e) => {
            if (done) return;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            point(e);
            sim.press(toGame(e));
          }}
          onPointerUp={() => sim.release()}
          onPointerCancel={() => sim.release()}
          onContextMenu={(e) => e.preventDefault()}
        />
        <ol className="fg-toasts">
          {toasts.map((t) => (
            <li key={t.id} data-best={t.c.best || t.first || undefined} data-find={t.c.find ? true : undefined}>
              <Pic c={t.c} />
              <span>
                <b>{findName(t.c)} <Stars n={t.c.stars} /></b>
                {t.c.find ? "Found in the water" : kgText(t.c.kg)}{t.first ? " · new kind!" : t.c.best ? " · biggest yet!" : ""}
              </span>
            </li>
          ))}
        </ol>
        {fresh && !done && (
          <div className="fg-fresh" key={fresh.at}>
            <small>New for your book</small>
            <Pic c={fresh.c} />
            <b>{fresh.c.kind.name}</b>
            <p>{fresh.c.kind.note}</p>
          </div>
        )}
        {gear.length > 0 && !done && !book && (
          <div className="fg-gear" onPointerDown={(e) => e.stopPropagation()}>
            {gear.map((k, i) => (
              <button key={k} data-on={sim.placing === k || undefined} disabled={!sim.left(k)} onClick={() => pick(k)} title={`${names[k]} (${i + 1})`}>
                <span className={`fg-gear-${k}`} />
                {names[k]} <em>{sim.left(k)}</em>
              </button>
            ))}
            <button onClick={() => setBook(true)} title="Fish book (B)"><span className="fg-gear-book" />Book <em>{seenCount}/{kinds.length}</em></button>
          </div>
        )}
        {book && (
          <div className="fg-summary fg-book">
            <h3>{start.place}</h3>
            <p>{seenCount} of {kinds.length} kinds from this water</p>
            <ul>
              {kinds.map((k) => {
                const log = start.log[fishItemId(k)], here = sim.caught.filter((c) => c.kind === k);
                const n = (log?.n ?? 0) + here.length, best = Math.max(log?.best ?? 0, ...here.map((c) => c.kg));
                const url = iconUrl(fishItemId(k));
                return (
                  <li key={k.name} data-seen={n > 0 || undefined}>
                    {url ? <img className="fg-icon" src={url} alt="" /> : <span />}
                    <span>
                      <b>{n ? k.name : "???"}</b>
                      <small>{n ? k.note : whenText(k)}</small>
                    </span>
                    <span>{n ? `×${n} · best ${kgText(best)}` : ""}</span>
                  </li>
                );
              })}
            </ul>
            <div className="fg-actions"><button className="primary" onClick={() => setBook(false)}>Back to the water</button></div>
          </div>
        )}
        {done && (
          <div className="fg-summary">
            <h3>{sim.count ? `${sim.count} fish, ${kgText(sim.kg)}` : caught.length ? "No fish, but something" : "Nothing today"}</h3>
            <p>
              {Math.round(sim.minutes) < 60 ? `${Math.max(1, Math.round(sim.minutes))} minutes` : `${(sim.minutes / 60).toFixed(1)} hours`} on the water
              {best ? ` · best a ${best.kind.name.toLowerCase()} of ${kgText(best.kg)}` : ""}
            </p>
            <ul>
              {byKind.map(({ c, n, kg }) => (
                <li key={findName(c)}>
                  <Pic c={c} />
                  <b>{findName(c)}{isNew(c) && <em className="fg-new">new</em>}</b>
                  <span>×{n}{c.find ? "" : ` · ${kgText(kg)}`}</span>
                </li>
              ))}
            </ul>
            <div className="fg-actions">
              {sim.minutes < MAX_MINUTES && <button onClick={() => setDone(false)}>Keep fishing</button>}
              <button className="primary" onClick={finish}>{practice ? "Close" : "Head back with the catch"}</button>
            </div>
          </div>
        )}
      </div>
      <footer className="fg-bottom" style={{ width: W * scale }}>
        <span className="fg-hint">{done ? "" : sim.hint}</span>
        <span className="fg-keys">
          <kbd>{sim.gear === "spear" ? "Click" : "Hold"}</kbd> {sim.gear === "spear" ? "strike" : "cast · haul"}
          <kbd>A</kbd><kbd>D</kbd> aim
          {gear.length > 0 && <><kbd>1</kbd>–<kbd>{gear.length}</kbd> set gear</>}
          <kbd>B</kbd> book
          <kbd>Esc</kbd> stop
        </span>
        <span className="fg-tally">{sim.count} fish · {kgText(sim.kg)}</span>
      </footer>
    </div>,
    document.body,
  );
}
