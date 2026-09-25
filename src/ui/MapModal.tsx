import { useEffect, useRef, useState } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import type { Runtime } from "../runtime/session";
import type { Point } from "../core/types";
import { Minimap } from "./Minimap";
import { ArrivalMap } from "./ArrivalMap";
import { fromAtlas, toAtlas } from "../world/geography/atlas";
import { formatHistoricalYear } from "../core/calendar";

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
  const [destination, setDestination] = useState<{ lon: number; lat: number; name?: string }>();
  const [plan, setPlan] = useState<{ name: string; days?: number; sea?: number; error?: string }>();
  const [nearby, setNearby] = useState<{ id: string; name: string; rank: string; x: number; y: number }[]>([]);
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
    if (earth || !pack.setting) return setNearby([]);
    let live = true;
    const o = toAtlas(pack.anchor.lon, pack.anchor.lat), h = (span * H) / W / 2;
    // Villages crowd the map beyond a day's walk, towns beyond a region.
    const ranks = span <= 12000 ? ["village", "town", "city"] : span <= 50000 ? ["town", "city"] : ["city"];
    void import("../world/travel/network").then(async ({ settlementsIn }) => {
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
        if (!kept.some((q) => Math.abs(q.x - p.x) < span * 0.1 && Math.abs(q.y - p.y) < span * 0.025))
          kept.push(p);
      setNearby(kept);
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
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const nice = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const metresAcross = span * METRES;
  const bar = nice.filter((m) => m <= metresAcross / 5).at(-1) ?? 50;
  const origin = toAtlas(pack.anchor.lon, pack.anchor.lat);
  const lonLat = fromAtlas(origin.x + here.x, origin.y + here.y);
  const setting = pack.setting;
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
      {regional && <div className="map-toggle" role="group" aria-label="Map scale">
        <button aria-pressed={!earth} onClick={() => setEarth(false)}>Region</button>
        <button aria-pressed={earth} onClick={() => setEarth(true)}>Earth</button>
      </div>}
    </header>
    <div className="map-body">
      <div className="map-stage">
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
            <Minimap runtime={runtime} large span={span} center={center} dims={[W, H]} route={selected} />
          </div>
          {nearby.map((p) => <button key={p.id} className={`map-settlement is-${p.rank}`} style={toScreen(p)}
            onClick={() => { setChosen(undefined); setDestination({ ...fromAtlas(origin.x + p.x, origin.y + p.y), name: p.name }); }}>
            <i />{p.name}
          </button>)}
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
              <i style={{ width: `${(bar / metresAcross) * 100}%` }} />
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

function distance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
// Five kilometres an hour, in a straight line; roads only make it longer.
function walk(m: number) {
  const minutes = Math.max(1, Math.round(m / 83));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ""}`.trim();
}
