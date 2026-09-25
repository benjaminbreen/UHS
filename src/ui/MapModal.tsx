import { useEffect, useRef, useState } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import type { Runtime } from "../runtime/session";
import type { Point } from "../core/types";
import { Minimap, ridgeAt } from "./Minimap";
import { ArrivalMap } from "./ArrivalMap";
import { ATLAS_SCALE, atlasSample, fromAtlas, toAtlas } from "../world/geography/atlas";
import { SettlementGlyph, glyphFor } from "./map-glyphs";
import { formatHistoricalYear } from "../core/calendar";
import { PeriodMap, footprints, periodCaptions, periodStyle } from "./period-map";
import { noise } from "../world/geography/noise";

const W = 880, H = 540;
// One world tile is two metres, as the old "km across" readout had it.
const METRES = 2;
const MAX_SPAN = 131072;

export function MapModal({ runtime, onClose }: { runtime: Runtime; onClose: () => void }) {
  const world = runtime.engine.world;
  const pack = world.pack;
  const player = runtime.engine.state.player.pos;
  const here = player.space === "outside" ? player : world.place(player.space)!.entrance;
  const regional = !!pack.setting;
  // An invented settlement has no atlas around it: its map is the fixed plan.
  const home = regional ? { x: here.x, y: here.y } : { x: 20, y: 25 };
  const minSpan = regional ? 800 : (world.regionExtent ?? 320);
  const [earth, setEarth] = useState(false);
  const [span, setSpan] = useState(regional ? 1600 : minSpan);
  const [center, setCenter] = useState<Point>(home);
  const [chosen, setChosen] = useState<string>();
  const [hover, setHover] = useState<string>();
  const [listOpen, setListOpen] = useState(true);
  const [period, setPeriod] = useState(() => {
    try { return localStorage.getItem("uhs.periodMap") === "1"; } catch { return false; }
  });
  const togglePeriod = () => {
    setPeriod(!period);
    try { localStorage.setItem("uhs.periodMap", period ? "0" : "1"); } catch { /* private window */ }
  };
  const [destination, setDestination] = useState<{ lon: number; lat: number; name?: string }>();
  const [plan, setPlan] = useState<{ name: string; days?: number; sea?: number; error?: string }>();
  const [nearby, setNearby] = useState<{ id: string; name: string; rank: string; x: number; y: number; glyph: ReturnType<typeof glyphFor> }[]>([]);
  const [homeGlyph, setHomeGlyph] = useState<ReturnType<typeof glyphFor>>();
  const [roads, setRoads] = useState<Point[][]>([]);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean }>(undefined);
  const wheel = useRef(0);
  const settlements = [...world.settlements]
    .map((s) => ({ ...s, metres: Math.hypot(s.x - here.x, s.y - here.y) * METRES }))
    .sort((a, b) => a.metres - b.metres);
  const selected = settlements.find((s) => s.id === (chosen ?? hover));
  const card = settlements.find((s) => s.id === chosen);

  const toWorld = (el: HTMLElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect();
    return {
      x: center.x + ((clientX - r.left) / r.width - 0.5) * span,
      y: center.y + ((clientY - r.top) / r.height - 0.5) * span * H / W,
    };
  };
  const toScreen = (pt: Point) => ({
    left: `${((pt.x - center.x) / span + 0.5) * 100}%`,
    top: `${((pt.y - center.y) / (span * H / W) + 0.5) * 100}%`,
  });
  const toFrame = (pt: Point) => ({
    x: ((pt.x - center.x) / span + 0.5) * W,
    y: ((pt.y - center.y) / (span * H / W) + 0.5) * H,
  });
  const zoom = (factor: number, anchor?: Point) => {
    const next = Math.max(minSpan, Math.min(MAX_SPAN, span * factor));
    if (next === span) return;
    if (anchor) {
      const k = next / span;
      setCenter({ x: anchor.x + (center.x - anchor.x) * k, y: anchor.y + (center.y - anchor.y) * k });
    }
    setSpan(next);
  };
  const travel = (s: { x: number; y: number }) => {
    if (player.space !== "outside") {
      runtime.notice = "Return outside before traveling.";
      runtime.emit();
    } else runtime.walkTo({ x: s.x + 2, y: s.y + 5 });
    onClose();
  };

  useEffect(() => {
    if (!destination || !pack.setting) return setPlan(undefined);
    let live = true;
    setPlan(undefined);
    // Routing loads h3, so it waits until a journey is actually asked for.
    void Promise.all([import("../runtime/map-travel"), import("../world/travel/network")]).then(
      async ([travel, network]) => {
        const id = network.mapForCoordinate(destination);
        await network.loadTileNames([id]);
        if (!live) return;
        const map = network.permanentMap(id, pack.setting!.year);
        const name = destination.name ?? map.name;
        if (map.water) return setPlan({ name, error: "Open sea: choose somewhere on land." });
        if (id === runtime.journey?.id) return setPlan({ name, error: "You are here." });
        try {
          const route = travel.journeyPlan(lonLat, destination);
          setPlan({ name, days: route.days, sea: Math.round(route.sea) });
        } catch {
          setPlan({ name, error: "No route there at this scale." });
        }
      },
    );
    return () => { live = false; };
  }, [destination?.lon, destination?.lat]);

  useEffect(() => {
    if (earth || !pack.setting) return setNearby([]), setRoads([]);
    let live = true;
    const o = toAtlas(pack.anchor.lon, pack.anchor.lat), h = (span * H) / W / 2;
    // Villages crowd the map beyond a day's walk, towns beyond a region.
    const ranks = span <= 12000 ? ["village", "town", "city"] : span <= 50000 ? ["town", "city"] : ["city"];
    void Promise.all([import("../world/travel/network"), import("../world/travel/environment")]).then(async ([{ settlementsIn }, { resolveMapEnvironment }]) => {
      const found = await settlementsIn(
        o.x + center.x - span / 2, o.y + center.y - h, o.x + center.x + span / 2, o.y + center.y + h,
        pack.setting!.year,
      );
      if (!live) return;
      const order = ["city", "town", "village"], kept: typeof found = [];
      // Largest first; a label that would overlap one already placed is dropped.
      for (const p of found
        .map((p) => ({ ...p, x: p.x - o.x, y: p.y - o.y }))
        // This map's own places are drawn from its plan.
        .filter((p) => ranks.includes(p.rank) && (Math.abs(p.x) > 192 || Math.abs(p.y) > 192))
        .sort((a, b) => order.indexOf(a.rank) - order.indexOf(b.rank)))
        if (!kept.some((q) => Math.abs(q.x - p.x) < span * 0.17 && Math.abs(q.y - p.y) < span * 0.045))
          kept.push(p);
      const year = pack.setting!.year;
      setNearby(kept.map((p) => {
        const e = resolveMapEnvironment(fromAtlas(o.x + p.x, o.y + p.y), year);
        return { ...p, glyph: glyphFor(e.culture, e.architecture, year, p.rank) };
      }));
      const e = resolveMapEnvironment(pack.anchor, year);
      setHomeGlyph(glyphFor(e.culture, e.architecture, year, "town"));
      const x0 = center.x - span / 2, y0 = center.y - h;
      setRoads(roadsBetween([{ x: 0, y: 0, rank: "town" }, ...kept], x0, y0, span, h * 2, (x, y) =>
        atlasSample(o.x + x, o.y + y).coast < 0 ? Infinity
          // Uneven going, so level country does not route as a grid's diagonals.
          : 1 + Math.max(0, ridgeAt(o, x, y) - 0.3) * 12 + noise("going", x, y, span / 12, "roads") * 2));
    });
    return () => { live = false; };
  }, [earth, span, center.x, center.y]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (earth || (e.target as HTMLElement).closest?.("input, textarea")) return;
      const step = span / 6;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      };
      if (moves[e.key]) {
        e.preventDefault();
        setCenter((c) => ({ x: c.x + moves[e.key][0], y: c.y + moves[e.key][1] }));
      } else if (e.key === "+" || e.key === "=") zoom(0.5);
      else if (e.key === "-") zoom(2);
      else if (e.key.toLowerCase() === "m") onClose();
      else if (e.key.toLowerCase() === "p" && regional) togglePeriod();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const nice = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
  // The region is drawn on the atlas, where a tile east to west is a
  // longitude step, not the town plan's two metres.
  const metresAcross = span * (regional ? (111320 * Math.cos((pack.anchor.lat * Math.PI) / 180)) / ATLAS_SCALE : METRES);
  const bar = nice.filter((m) => m <= metresAcross / 5).at(-1) ?? 50;
  const origin = toAtlas(pack.anchor.lon, pack.anchor.lat);
  const lonLat = fromAtlas(origin.x + here.x, origin.y + here.y);
  const setting = pack.setting;
  const style = period && setting && !earth ? periodStyle(setting.culture, setting.year) : undefined;
  const journey = destination && <div className="map-journey">
    {!plan ? <span>Finding the road…</span> : <>
      <strong>{plan.name}</strong>
      {plan.error ? <span>{plan.error}</span> : <span>
        About {plan.days} day{plan.days === 1 ? "" : "s"} on the road{plan.sea ? `, ${plan.sea} km of it by sea` : ""}
      </span>}
      <div>
        {!plan.error && <button className="primary" onClick={() => { void runtime.journey?.voyage(destination); onClose(); }}>Set out</button>}
        <button onClick={() => setDestination(undefined)}>Cancel</button>
      </div>
    </>}
  </div>;

  return <div className="map-modal">
    <header className="map-title">
      <div>
        <h2>{pack.region}</h2>
        {setting && <p>{setting.location} · {formatHistoricalYear(setting.year)}</p>}
      </div>
      {regional && !earth && <div className="map-period">
        <button aria-pressed={period} onClick={togglePeriod} title="Period style (P)">Period style</button>
        {style && <small>{periodCaptions[style]}</small>}
      </div>}
      {regional && <div className="map-toggle" role="group" aria-label="Map scale">
        <button aria-pressed={!earth} onClick={() => setEarth(false)}>Region</button>
        <button aria-pressed={earth} onClick={() => setEarth(true)}>Earth</button>
      </div>}
    </header>
    <div className="map-body">
      <div className={style ? `map-stage period-${style}` : "map-stage"}>
        {earth && setting ? (
          <>
            <ArrivalMap lon={lonLat.lon} lat={lonLat.lat} year={setting.year} place={setting.location}
              pick={destination} onPick={setDestination} />
            {destination ? journey : <p className="map-journey-hint">Choose a destination to plan a journey</p>}
          </>
        ) : <>
          <div
            className="map-surface"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, cx: center.x, cy: center.y, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const r = e.currentTarget.getBoundingClientRect();
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) d.moved = true;
              if (d.moved) setCenter({
                x: d.cx - ((e.clientX - d.x) / r.width) * span,
                y: d.cy - ((e.clientY - d.y) / r.height) * span * H / W,
              });
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              drag.current = undefined;
              if (d?.moved) return;
              const at = toWorld(e.currentTarget, e.clientX, e.clientY);
              const r = e.currentTarget.getBoundingClientRect();
              const reach = (span / r.width) * 18;
              const hit = settlements.find((s) => Math.hypot(s.x - at.x, s.y - at.y) < reach);
              setChosen(hit?.id);
            }}
            onPointerCancel={() => { drag.current = undefined; }}
            onWheel={(e) => {
              wheel.current += e.deltaY;
              if (Math.abs(wheel.current) < 60) return;
              zoom(wheel.current > 0 ? 2 : 0.5, toWorld(e.currentTarget, e.clientX, e.clientY));
              wheel.current = 0;
            }}
          >
            {style
              ? <PeriodMap style={style} anchor={pack.anchor} center={center} span={span} dims={[W, H]} />
              : <Minimap runtime={runtime} large span={span} center={center} dims={[W, H]} route={selected} />}
          </div>
          <svg className="map-roads" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {style === "codex"
              ? roads.flatMap((road, i) => footprints(road.map(toFrame)).map((f, n) =>
                <ellipse key={`${i}-${n}`} className="map-foot" cx={f.x} cy={f.y} rx={3} ry={1.5} transform={`rotate(${f.angle} ${f.x} ${f.y})`} />))
              : roads.map((road, i) => <path key={i} d={smooth(road.map(toFrame))} />)}
          </svg>
          {nearby.map((p) => <button key={p.id} className={`map-settlement is-${p.rank}`} style={toScreen(p)}
            onClick={() => { setChosen(undefined); setDestination({ ...fromAtlas(origin.x + p.x, origin.y + p.y), name: p.name }); }}>
            <SettlementGlyph glyph={p.glyph} rank={p.rank} /><span>{p.name}</span>
          </button>)}
          {/* The pixel map draws home from its plan; a period map marks it like any town. */}
          {style && homeGlyph && <div className="map-settlement is-town is-home" style={toScreen(home)}>
            <SettlementGlyph glyph={homeGlyph} rank="town" /><span>{settlements[0]?.name ?? pack.region}</span>
          </div>}
          {style && setting && <div className="period-cartouche">
            <strong>{pack.region}</strong>
            <span>{formatHistoricalYear(setting.year)}</span>
          </div>}
          {journey}
          {card && <div className="map-card" style={toScreen(card)}>
            <strong>{card.name}</strong>
            {card.metres < 30 ? <span>You are here</span> : <>
              <span>{distance(card.metres)} · about {walk(card.metres)} on foot</span>
              <div>
                <button className="primary" onClick={() => travel(card)}>Travel</button>
                <button onClick={() => setChosen(undefined)}>Close</button>
              </div>
            </>}
          </div>}
          <div className="map-zoom">
              <button aria-label="Zoom in" onClick={() => zoom(0.5)}><Plus size={16} /></button>
              <button aria-label="Zoom out" onClick={() => zoom(2)}><Minus size={16} /></button>
              <button aria-label="Centre on you" onClick={() => setCenter(home)}><Crosshair size={16} /></button>
            </div>
            <div className="map-ruler" aria-label={`Scale: ${distance(bar)}`}>
              {/* The ruler box is half the stage wide. */}
              <i style={{ width: `${(bar / metresAcross) * 200}%` }} />
              <span>{distance(bar)}</span>
            </div>
        </>}
      </div>
      {!earth && settlements.length > 0 && <aside className={listOpen ? "map-places" : "map-places is-closed"}>
        <button className="map-places-toggle" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
          Places <small>{settlements.length}</small>
        </button>
        {listOpen && <ul>
          {settlements.map((s) => <li key={s.id}>
            <button
              aria-pressed={s.id === chosen}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(undefined)}
              onClick={() => { setChosen(s.id); setCenter({ x: (s.x + here.x) / 2, y: (s.y + here.y) / 2 }); }}
            >
              <span>{s.name}</span>
              <small>{s.metres < 30 ? "You are here" : `${distance(s.metres)} · ${walk(s.metres)}`}</small>
            </button>
          </li>)}
        </ul>}
      </aside>}
    </div>
  </div>;
}

// Each place joins its nearest neighbours, larger places reaching further.
// Roads are routed over a coarse grid of the view by A*: water is closed,
// ridges are dear, and ground an earlier road took is cheap, so roads merge
// into trunks rather than running side by side.
function roadsBetween(
  places: (Point & { rank: string })[],
  x0: number, y0: number, w: number, h: number,
  cost: (x: number, y: number) => number,
) {
  const reach = { village: 1200, town: 2400, city: 6000 } as Record<string, number>;
  const pairs = new Map<string, [Point, Point]>();
  for (const p of places)
    for (const { q } of places
      .filter((q) => q !== p)
      .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) }))
      .filter(({ q, d }) => d < Math.max(reach[p.rank], reach[q.rank]))
      .sort((a, b) => a.d - b.d)
      .slice(0, p.rank === "village" ? 2 : 3)) {
      const [a, b] = p.x < q.x || (p.x === q.x && p.y < q.y) ? [p, q] : [q, p];
      pairs.set(`${a.x},${a.y}-${b.x},${b.y}`, [a, b]);
    }
  const cols = 120, rows = Math.round((cols * h) / w), cw = w / cols, ch = h / rows;
  const base = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) base[j * cols + i] = cost(x0 + (i + 0.5) * cw, y0 + (j + 0.5) * ch);
  const used = new Uint8Array(cols * rows);
  const cellOf = (p: Point) => {
    const i = Math.max(0, Math.min(cols - 1, Math.floor((p.x - x0) / cw)));
    const j = Math.max(0, Math.min(rows - 1, Math.floor((p.y - y0) / ch)));
    return j * cols + i;
  };
  const links = new Map<number, Set<number>>(), towns = new Set<number>();
  const link = (p: number, q: number) => {
    (links.get(p) ?? links.set(p, new Set()).get(p)!).add(q);
    (links.get(q) ?? links.set(q, new Set()).get(q)!).add(p);
  };
  const sorted = [...pairs.values()].sort(([a, b], [c, d]) => Math.hypot(b.x - a.x, b.y - a.y) - Math.hypot(d.x - c.x, d.y - c.y));
  for (const [a, b] of sorted) {
    const found = route(cellOf(a), cellOf(b), cols, rows, (k) => (used[k] ? base[k] * 0.3 : base[k]));
    if (!found) continue;
    // A knight's step goes through the cell it passes over, so roads that
    // share ground share cells, and so links.
    const cells = [found[0]];
    for (const k of found.slice(1)) {
      const p = cells.at(-1)!, dx = (k % cols) - (p % cols), dy = Math.floor(k / cols) - Math.floor(p / cols);
      if (Math.abs(dx) + Math.abs(dy) === 3) cells.push(p + Math.trunc(dy / 2) * cols + Math.trunc(dx / 2));
      cells.push(k);
    }
    // A road three times its crow-flight is not a road anyone keeps.
    if (cells.length > (Math.hypot(b.x - a.x, b.y - a.y) / cw) * 3 + 4) continue;
    for (let n = 1; n < cells.length; n++) link(cells[n - 1], cells[n]);
    for (const k of cells) used[k] = 1;
    towns.add(cells[0]).add(cells.at(-1)!);
  }
  // Walk the network from town to fork to town, so a stretch many roads
  // share is smoothed and drawn once.
  const stop = (k: number) => towns.has(k) || links.get(k)!.size !== 2;
  const seen = new Set<string>(), roads: Point[][] = [];
  const at = (k: number) => ({ x: x0 + ((k % cols) + 0.5) * cw, y: y0 + (Math.floor(k / cols) + 0.5) * ch });
  for (const [start, next] of links)
    if (stop(start))
      for (let q of next) {
        let p = start;
        const chain = [p];
        while (!seen.has(`${p},${q}`)) {
          seen.add(`${p},${q}`).add(`${q},${p}`);
          chain.push(q);
          if (stop(q)) break;
          const r = [...links.get(q)!].find((n) => n !== p)!;
          [p, q] = [q, r];
        }
        if (chain.length < 2) continue;
        const kept = chain.filter((_, n) => n === 0 || n === chain.length - 1 || n % 3 === 0);
        roads.push(chaikin(chaikin(kept.map(at))));
      }
  return roads;
}

// Sixteen headings: eight on a grid alone make roads of right angles and diagonals.
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
  [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

function route(from: number, to: number, cols: number, rows: number, cost: (k: number) => number) {
  const g = new Float32Array(cols * rows).fill(Infinity), prev = new Int32Array(cols * rows).fill(-1);
  const tx = to % cols, ty = Math.floor(to / cols);
  const open: [number, number][] = [[0, from]];
  g[from] = 0;
  while (open.length) {
    let best = 0;
    for (let n = 1; n < open.length; n++) if (open[n][0] < open[best][0]) best = n;
    const [, k] = open[best];
    open[best] = open[open.length - 1];
    open.pop();
    if (k === to) break;
    const x = k % cols, y = Math.floor(k / cols);
    for (const [dx, dy] of STEPS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx;
        // A knight's step also pays for the cell it passes over.
        const over = Math.abs(dx) + Math.abs(dy) === 3 ? (y + Math.trunc(dy / 2)) * cols + x + Math.trunc(dx / 2) : n;
        const c = n === to ? 1 : Math.max(cost(n), cost(over));
        if (c === Infinity) continue;
        const next = g[k] + c * Math.hypot(dx, dy);
        if (next >= g[n]) continue;
        g[n] = next;
        prev[n] = k;
        open.push([next + Math.hypot(tx - nx, ty - ny) * 0.4, n]);
      }
  }
  if (g[to] === Infinity) return undefined;
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

function chaikin(pts: Point[]) {
  const out = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 }, { x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
  }
  out.push(pts.at(-1)!);
  return out;
}

// Grid steps smoothed into curves through their midpoints.
function smooth(pts: Point[]) {
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++)
    d += `Q${pts[i].x} ${pts[i].y} ${(pts[i].x + pts[i + 1].x) / 2} ${(pts[i].y + pts[i + 1].y) / 2}`;
  return d + `L${pts.at(-1)!.x} ${pts.at(-1)!.y}`;
}

function distance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
// Five kilometres an hour, in a straight line; roads only make it longer.
function walk(m: number) {
  const minutes = Math.max(1, Math.round(m / 83));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ""}`.trim();
}
