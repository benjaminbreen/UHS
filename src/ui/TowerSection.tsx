import { useEffect, useMemo, useRef, useState } from "react";
import type { Runtime } from "../runtime/session";
import { floorName, type Tower } from "../world/tower";

const FH = 12, W = 176, CROWN = 46, STREET = 14;
const hex = (h: string, k = 1) => {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const hash = (...k: number[]) => {
  let h = 2166136261;
  for (const v of k) h = Math.imul(h ^ v, 16777619);
  return ((h >>> 0) % 1000) / 1000;
};
const COATS = ["#2e3448", "#4a3a2e", "#3a4a3a", "#5a2e2e", "#6a6070", "#2a2a2a"];

/** Half the building's width at storey i: it steps back near the top, as the outside does. */
const halfAt = (i: number, n: number) => (i < n * 0.72 ? 74 : i < n - 2 ? 58 : 42);

function paint(g: CanvasRenderingContext2D, tower: Tower, here: number, car: number, hover: number | undefined, hour: number) {
  const n = tower.floors.length, H = CROWN + n * FH + STREET, cx = W / 2;
  const night = hour < 7 || hour >= 19, working = hour >= 9 && hour < 17;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, night ? "#141826" : "#7ea6c8");
  sky.addColorStop(1, night ? "#2a2438" : "#d8e2e4");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const yOf = (i: number) => CROWN + (n - 1 - i) * FH;
  const stone = "#c8b48c", stoneLit = "#e2d2ac", stoneDark = "#8a7658";
  // the crown over the top storey: steps and a mast
  let hw = halfAt(n - 1, n) - 6, y = yOf(n - 1);
  for (let k = 0; k < 3; k++, hw -= 9) {
    y -= 8;
    g.fillStyle = stone;
    g.fillRect(cx - hw, y, hw * 2, 8);
    g.fillStyle = stoneLit;
    g.fillRect(cx - hw, y, hw * 2, 1);
    g.fillStyle = "#3a3448";
    for (let x = cx - hw + 4; x < cx + hw - 3; x += 5) g.fillRect(x, y + 3, 2, 4);
  }
  g.fillStyle = "#9aa4b0";
  g.fillRect(cx - 1, y - 18, 2, 18);
  g.fillStyle = night && Math.floor(performance.now() / 600) % 2 ? "#ff4a3a" : "#a03028";
  g.fillRect(cx - 1, y - 20, 2, 2);
  for (const f of tower.floors) {
    const i = f.n, top = yOf(i), half = halfAt(i, n), x0 = cx - half, x1 = cx + half;
    const way = f.profile.colorways[f.colorway % f.profile.colorways.length];
    const lit = !night || (f.kind !== "lobby" ? hash(i, 7) < 0.3 : true);
    const dim = lit ? 1 : 0.32;
    const busy = f.kind === "lobby" ? hour >= 7 && hour < 20 : working;
    // the room: wall, a darker dado, the floor slab
    g.fillStyle = hex(way.wall, dim);
    g.fillRect(x0, top, half * 2, FH - 2);
    g.fillStyle = hex(way.wall, dim * 0.86);
    g.fillRect(x0, top + FH - 5, half * 2, 3);
    g.fillStyle = hex(way.floor, dim * 0.9);
    g.fillRect(x0, top + FH - 2, half * 2, 1);
    g.fillStyle = "#6a645a";
    g.fillRect(x0 - 2, top + FH - 1, half * 2 + 4, 1);
    if (night && lit) {
      g.fillStyle = "rgba(255,210,120,0.18)";
      g.fillRect(x0, top, half * 2, FH - 2);
    }
    // what furnishes it, in silhouette either side of the shaft
    const ink = hex(way.wood, dim), accent = hex(way.accent, dim), floorY = top + FH - 2;
    for (const [a, b] of [[x0 + 3, cx - 8], [cx + 8, x1 - 3]]) {
      if (f.kind === "lobby") {
        g.fillStyle = hex(way.trim, dim);
        for (let x = a + 4; x < b - 2; x += 12) g.fillRect(x, top, 2, FH - 2);
      } else if (f.kind === "bank") {
        g.fillStyle = ink;
        g.fillRect(a, floorY - 3, b - a, 3);
        g.fillStyle = accent;
        for (let x = a; x < b; x += 2) g.fillRect(x, floorY - 7, 1, 4);
      } else if (f.kind === "showroom") {
        for (let x = a + 1; x < b - 6; x += 9) {
          g.fillStyle = ink;
          g.fillRect(x, floorY - 4, 6, 4);
          g.fillStyle = night ? "#3a4a5a" : "#a8c8d8";
          g.fillRect(x + 1, floorY - 4, 4, 2);
        }
      } else if (f.kind === "suite") {
        g.fillStyle = accent;
        g.fillRect(a + 2, floorY - 1, b - a - 4, 1);
        g.fillStyle = ink;
        g.fillRect(a + 4, floorY - 4, 10, 3);
        g.fillRect(a + 4, floorY - 6, 2, 2);
        g.fillRect(b - 12, floorY - 3, 7, 3);
      } else {
        g.fillStyle = ink;
        for (let x = a + 1; x < b - 5; x += 9) {
          g.fillRect(x, floorY - 3, 5, 1);
          g.fillRect(x, floorY - 2, 1, 2);
          g.fillRect(x + 4, floorY - 2, 1, 2);
          g.fillStyle = "#2a2a30";
          g.fillRect(x + 2, floorY - 4, 2, 1);
          g.fillStyle = ink;
        }
      }
      if (busy && lit)
        for (let x = a + 3; x < b - 2; x += 7) {
          if (hash(i, x, 3) > (f.kind === "offices" ? 0.45 : 0.75)) continue;
          g.fillStyle = COATS[Math.floor(hash(i, x, 5) * COATS.length)];
          g.fillRect(x, floorY - 5, 2, 4);
          g.fillStyle = hash(i, x, 9) < 0.5 ? "#e0b08a" : "#a8724e";
          g.fillRect(x, floorY - 7, 2, 2);
        }
    }
    // outer walls, cut
    g.fillStyle = stone;
    g.fillRect(x0 - 2, top, 2, FH);
    g.fillRect(x1, top, 2, FH);
    if (i === here || i === hover) {
      g.strokeStyle = i === here ? "#e8c060" : "rgba(255,255,255,0.7)";
      g.lineWidth = 1;
      g.strokeRect(x0 - 0.5, top + 0.5, half * 2 + 1, FH - 2);
    }
    if (i < n - 1 && halfAt(i + 1, n) < half) {
      g.fillStyle = stoneLit;
      g.fillRect(x0 - 2, top - 1, half * 2 + 4, 1);
    }
  }
  // the shaft, its cables and the car
  const shaftTop = yOf(n - 1), shaftBottom = yOf(0) + FH;
  g.fillStyle = "#2a2630";
  g.fillRect(cx - 7, shaftTop, 14, shaftBottom - shaftTop);
  g.fillStyle = "#3a3440";
  for (let yy = shaftTop; yy < shaftBottom; yy += FH) g.fillRect(cx - 7, yy + FH - 1, 14, 1);
  const carY = CROWN + (n - 1 - car) * FH;
  g.fillStyle = "#6a6070";
  g.fillRect(cx - 1, shaftTop, 1, carY - shaftTop);
  g.fillRect(cx + 1, shaftTop, 1, carY - shaftTop);
  g.fillStyle = "#b8903a";
  g.fillRect(cx - 5, carY + 1, 10, FH - 3);
  g.fillStyle = "#e8c870";
  g.fillRect(cx - 5, carY + 1, 10, 1);
  g.fillStyle = "#5a4020";
  for (let x = cx - 4; x < cx + 5; x += 2) g.fillRect(x, carY + 3, 1, FH - 6);
  g.fillStyle = "#ffe0a0";
  g.fillRect(cx - 1, carY + 3, 2, 1);
  // the street
  const st = yOf(0) + FH;
  g.fillStyle = stoneDark;
  g.fillRect(0, st, W, 2);
  g.fillStyle = "#5a5a60";
  g.fillRect(0, st + 2, W, STREET - 2);
  g.fillStyle = "#7a7a80";
  g.fillRect(0, st + 2, W, 1);
}

/** The tower drawn in section: every storey at once, the lift in its shaft,
 * and the directory. Choosing a floor runs the car there, then rides it. */
export function TowerSection({ runtime, onClose }: { runtime: Runtime; onClose: () => void }) {
  const at = useMemo(() => runtime.engine.towerLift(), [runtime]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number>();
  const ride = useRef<{ to: number; t0: number; ms: number } | undefined>(undefined);
  const tower = at?.tower, n = tower?.floors.length ?? 0, here = at?.n ?? 0;
  const hour = (runtime.engine.state.clock / 3600) % 24;
  const runs = useMemo(() => {
    const out: { from: number; to: number; name: string }[] = [];
    for (const f of tower?.floors ?? []) {
      const last = out[out.length - 1];
      if (last && last.name === f.name) last.to = f.n;
      else out.push({ from: f.n, to: f.n, name: f.name });
    }
    return out.reverse();
  }, [tower]);
  const hoverRef = useRef<number | undefined>(hover);
  hoverRef.current = hover;
  useEffect(() => {
    const g = canvas.current?.getContext("2d");
    if (!g || !tower) return;
    let frame = 0;
    const draw = () => {
      let car = here;
      const r = ride.current;
      if (r) {
        const t = Math.min(1, (performance.now() - r.t0) / r.ms);
        car = here + (r.to - here) * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        if (t >= 1) {
          ride.current = undefined;
          runtime.command({ type: "interact", target: String(r.to), action: "lift" });
          onClose();
          return;
        }
      }
      paint(g, tower, here, car, hoverRef.current, hour);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [tower, here, hour, runtime, onClose]);
  useEffect(() => {
    const el = scroller.current, c = canvas.current;
    if (!el || !c) return;
    const frame = requestAnimationFrame(() => {
      el.scrollTop = (CROWN + (n - 1 - here) * FH) * (c.clientHeight / c.height) - el.clientHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [n, here]);
  if (!tower) return <p>There is no lift here.</p>;
  const go = (to: number) => {
    if (ride.current || to === here) return;
    ride.current = { to, t0: performance.now(), ms: Math.min(2600, 500 + Math.abs(to - here) * 70) };
  };
  const floorAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const i = n - 1 - Math.floor((y - CROWN) / FH);
    return i >= 0 && i < n ? i : undefined;
  };
  return (
    <div className="tower-section">
      <div className="eyebrow">{tower.style.lift.name.toUpperCase()}</div>
      <h2>{floorName(here).replace(/^the /, "The ")}</h2>
      <div className="tower-body">
        <div className="tower-cut" ref={scroller}>
          <canvas
            ref={canvas}
            width={W}
            height={CROWN + n * FH + STREET}
            onMouseMove={(e) => setHover(floorAt(e))}
            onMouseLeave={() => setHover(undefined)}
            onClick={(e) => {
              const i = floorAt(e);
              if (i !== undefined) go(i);
            }}
          />
        </div>
        <ol className="tower-directory">
          {runs.map((r) => (
            <li key={r.from} className={here >= r.from && here <= r.to ? "here" : hover !== undefined && hover >= r.from && hover <= r.to ? "hover" : ""}>
              <button onClick={() => go(r.from === here ? r.to : r.from)} onMouseEnter={() => setHover(r.from)} onMouseLeave={() => setHover(undefined)}>
                <span className="floors">{r.from ? (r.from === r.to ? r.from + 1 : `${r.from + 1}–${r.to + 1}`) : "L"}</span>
                <span>{r.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
