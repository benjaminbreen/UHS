import { useEffect, useMemo, useRef, useState } from "react";
import type { Runtime } from "../runtime/session";
import { floorName, type Tower } from "../world/tower";

const FH = 12, W = 176, STREET = 14;
const CROWNS = { step: 46, spire: 92, gable: 50, flat: 40, dome: 84 } as const;
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

const NEON = ["#ff4aa8", "#4ac8ff", "#ffb03a", "#6aff8a"];
const crownOf = (tower: Tower) => CROWNS[tower.style.section.crown];

/** Half the building's width at storey i: it steps back as the outside does. */
const halfAt = (tower: Tower, i: number, n: number) => {
  let half = 74;
  for (const [from, h] of tower.style.section.halves) if (i >= from * n) half = h;
  return half;
};

/** An aviation light: a slow blink after dark, a dull red lens by day. */
function beacon(g: CanvasRenderingContext2D, x: number, y: number, night: boolean, now: number, phase = 0) {
  const on = night && (now / 1500 + phase) % 1 < 0.35;
  if (on) {
    g.fillStyle = "rgba(255,60,50,0.35)";
    g.fillRect(x - 2, y - 2, 6, 6);
  }
  g.fillStyle = on ? "#ff5a48" : "#8a2a24";
  g.fillRect(x, y, 2, 2);
}

function crown(g: CanvasRenderingContext2D, tower: Tower, n: number, top: number, night: boolean, now: number) {
  const cx = W / 2, [lit, stone, dark] = tower.style.section.stone, half = halfAt(tower, n - 1, n);
  const kind = tower.style.section.crown;
  if (kind === "step") {
    let hw = half - 6, y = top;
    for (let k = 0; k < 3; k++, hw -= 9) {
      y -= 8;
      g.fillStyle = stone;
      g.fillRect(cx - hw, y, hw * 2, 8);
      g.fillStyle = lit;
      g.fillRect(cx - hw, y, hw * 2, 1);
      g.fillStyle = "#3a3448";
      for (let x = cx - hw + 4; x < cx + hw - 3; x += 5) g.fillRect(x, y + 3, 2, 4);
    }
    g.fillStyle = "#9aa4b0";
    g.fillRect(cx - 1, y - 18, 2, 18);
    beacon(g, cx - 1, y - 20, night, now);
  } else if (kind === "spire") {
    // balustrade and obelisks, the lantern, the drum, the gilt spire and the star
    g.fillStyle = lit;
    g.fillRect(cx - half, top - 3, half * 2, 1);
    for (let x = cx - half + 1; x < cx + half; x += 2) g.fillRect(x, top - 2, 1, 2);
    for (const x of [cx - half, cx + half - 2]) {
      g.fillStyle = stone;
      g.fillRect(x, top - 10, 2, 8);
      beacon(g, x, top - 12, night, now, x > cx ? 0.5 : 0);
    }
    const lw = Math.round(half * 0.7);
    g.fillStyle = stone;
    g.fillRect(cx - lw, top - 16, lw * 2, 14);
    g.fillStyle = lit;
    g.fillRect(cx - lw - 1, top - 17, lw * 2 + 2, 2);
    g.fillStyle = night ? "#e8b860" : "#3a3040";
    for (const k of [-1, 0, 1]) g.fillRect(cx + k * Math.round(lw * 0.6) - 1, top - 13, 3, 9);
    const dw = Math.round(lw * 0.6);
    g.fillStyle = stone;
    g.fillRect(cx - dw, top - 24, dw * 2, 7);
    g.fillStyle = dark;
    for (let x = cx - dw + 2; x < cx + dw - 1; x += 3) g.fillRect(x, top - 23, 1, 5);
    for (let j = 0; j < 44; j++) {
      const w = Math.round(dw * 0.6 * (1 - j / 44)) + 1;
      g.fillStyle = j % 8 === 4 ? "#f0d890" : "#c8a040";
      g.fillRect(cx - w, top - 25 - j, w, 1);
      g.fillStyle = j % 8 === 4 ? "#c8a040" : "#8a6a28";
      g.fillRect(cx, top - 25 - j, w, 1);
    }
    const sy = top - 76;
    if (night) {
      const a = 0.25 + 0.1 * Math.sin(now / 700);
      g.fillStyle = `rgba(255,60,50,${a})`;
      g.beginPath();
      g.arc(cx, sy, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = night ? "#ff6a50" : "#b02a24";
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 2 : 5, ang = -Math.PI / 2 + (k * Math.PI) / 5;
      g.lineTo(cx + r * Math.cos(ang), sy + r * Math.sin(ang));
    }
    g.fill();
    g.fillStyle = "#e0c060";
    g.fillRect(cx - 6, sy + 5, 2, 1);
    g.fillRect(cx + 4, sy + 5, 2, 1);
  } else if (kind === "flat") {
    // the louvred plant room, a cap, a mast with two lights
    g.fillStyle = stone;
    g.fillRect(cx - half - 1, top - 4, half * 2 + 2, 4);
    g.fillStyle = lit;
    g.fillRect(cx - half - 1, top - 4, half * 2 + 2, 1);
    const pw = Math.round(half / 2);
    g.fillStyle = dark;
    g.fillRect(cx - pw, top - 12, pw * 2, 8);
    g.fillStyle = stone;
    for (let y = top - 11; y < top - 4; y += 2) g.fillRect(cx - pw + 1, y, pw * 2 - 2, 1);
    g.fillStyle = "#9aa4b0";
    g.fillRect(cx + pw - 6, top - 36, 1, 24);
    beacon(g, cx + pw - 7, top - 38, night, now);
    beacon(g, cx - half, top - 6, night, now, 0.5);
    beacon(g, cx + half - 2, top - 6, night, now, 0.5);
  } else if (kind === "dome") {
    // a colonnade round the rooftop bar, a gilt dome, a mast
    const cw = Math.round(half * 0.7);
    g.fillStyle = stone;
    g.fillRect(cx - half - 1, top - 3, half * 2 + 2, 3);
    g.fillStyle = night ? "#f0c070" : "#3a3040";
    g.fillRect(cx - cw, top - 13, cw * 2, 10);
    g.fillStyle = lit;
    for (let x = cx - cw; x <= cx + cw - 2; x += Math.round(cw / 3)) g.fillRect(x, top - 13, 2, 10);
    g.fillRect(cx - cw - 1, top - 15, cw * 2 + 2, 2);
    const r = cw - 2;
    for (let x = -r; x <= r; x++) {
      const h = Math.round(r * 0.9 * Math.sqrt(1 - (x / r) ** 2));
      g.fillStyle = x < -r / 3 ? "#f0d890" : x < r / 3 ? "#c8a040" : "#8a6a28";
      g.fillRect(cx + x, top - 15 - h, 1, h);
    }
    g.fillStyle = "#c8a040";
    g.fillRect(cx, top - 26 - r, 1, 10);
    beacon(g, cx - 1, top - 28 - r, night, now);
  } else {
    // a glass gable on a granite band, a mast at the apex, a light at each corner
    g.fillStyle = stone;
    g.fillRect(cx - half - 1, top - 3, half * 2 + 2, 3);
    for (let j = 0; j < 20; j++) {
      const w = Math.round((half - 4) * (1 - j / 20));
      g.fillStyle = night ? "#2a3a52" : j % 5 ? "#8ab0c8" : "#c8d8e0";
      g.fillRect(cx - w, top - 4 - j, w * 2, 1);
    }
    g.fillStyle = "#9aa4b0";
    g.fillRect(cx, top - 34, 1, 10);
    beacon(g, cx - 1, top - 36, night, now);
    beacon(g, cx - half, top - 6, night, now, 0.5);
    beacon(g, cx + half - 2, top - 6, night, now, 0.5);
  }
}

function paint(g: CanvasRenderingContext2D, tower: Tower, here: number, car: number, hover: number | undefined, hour: number) {
  const CROWN = crownOf(tower), n = tower.floors.length, H = CROWN + n * FH + STREET, cx = W / 2;
  const night = hour < 7 || hour >= 19, now = performance.now();
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, night ? "#141826" : "#7ea6c8");
  sky.addColorStop(1, night ? "#2a2438" : "#d8e2e4");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const yOf = (i: number) => CROWN + (n - 1 - i) * FH;
  const [stoneLit, stone, stoneDark] = tower.style.section.stone;
  crown(g, tower, n, yOf(n - 1), night, now);
  const evening = (k: string) => k === "snack" || k === "mahjong" || k === "lounge";
  for (const f of tower.floors) {
    const i = f.n, top = yOf(i), half = halfAt(tower, i, n), x0 = cx - half, x1 = cx + half;
    const way = f.profile.colorways[f.colorway % f.profile.colorways.length];
    const [from, to] = f.hours, open = from <= to ? hour >= from && hour < to : hour >= from || hour < to;
    const home = !!f.stay && hour >= 17 && hour < 23 && hash(i, 7) < 0.8;
    const lit = !night || open || home || hash(i, 7) < 0.3;
    const dim = lit ? 1 : 0.32;
    const busy = open || home;
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
      } else if (f.kind === "snack" || f.kind === "lounge") {
        // a bar along one side, bottles glowing on the shelf behind it
        g.fillStyle = ink;
        g.fillRect(a, floorY - 4, Math.min(22, b - a), 4);
        for (let x = a + 1; x < a + Math.min(22, b - a) - 1; x += 3) {
          g.fillStyle = NEON[Math.floor(hash(i, x) * NEON.length)];
          g.fillRect(x, top + 2, 1, 2);
        }
        g.fillStyle = accent;
        for (let x = a + 26; x < b - 5; x += 10) g.fillRect(x, floorY - 3, 5, 1);
      } else if (f.kind === "mahjong") {
        for (let x = a + 2; x < b - 7; x += 12) {
          g.fillStyle = "#2a6a3a";
          g.fillRect(x, floorY - 3, 7, 1);
          g.fillStyle = ink;
          g.fillRect(x + 1, floorY - 2, 1, 2);
          g.fillRect(x + 5, floorY - 2, 1, 2);
          g.fillStyle = "#f0e8c8";
          g.fillRect(x + 3, top + 1, 1, 2);
        }
      } else if (f.kind === "school") {
        g.fillStyle = "#2a3a2e";
        g.fillRect(a + 1, top + 2, 8, 4);
        g.fillStyle = ink;
        for (let x = a + 12; x < b - 4; x += 6) g.fillRect(x, floorY - 3, 4, 1);
      } else if (f.kind === "showroom" || f.kind === "store") {
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
    // the tenants' signs up the outside of a Tokyo tower, lit and running after dark
    if (evening(f.kind) || f.kind === "school") {
      const col = NEON[i % NEON.length];
      g.fillStyle = night ? col : hex("#d0d0d0", 0.9);
      g.fillRect(x0 - 7, top + 1, 4, FH - 3);
      if (night && Math.floor(now / 160 + i) % 4 === 0) {
        g.fillStyle = "rgba(255,255,255,0.6)";
        g.fillRect(x0 - 7, top + 1, 4, FH - 3);
      }
    }
    if (i < n - 1 && halfAt(tower, i + 1, n) < half) {
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
  const carY = yOf(car);
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
      el.scrollTop = (crownOf(tower!) + (n - 1 - here) * FH) * (c.clientHeight / c.height) - el.clientHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [n, here, tower]);
  if (!tower) return <p>There is no lift here.</p>;
  const go = (to: number) => {
    if (ride.current || to === here) return;
    ride.current = { to, t0: performance.now(), ms: Math.min(2600, 500 + Math.abs(to - here) * 70) };
  };
  const floorAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const i = n - 1 - Math.floor((y - crownOf(tower)) / FH);
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
            height={crownOf(tower) + n * FH + STREET}
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
