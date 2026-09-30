import { useEffect, useMemo, useRef, useState } from "react";
import {
  interactive, planRoom,
  type Finish, type FloorPattern, type Prop, type RoomParams, type Shape, type WallPattern,
} from "../render/interiors/room";
import { interiorGroups, interiorProfile, resolveRoom, type RoomChoice } from "../content/interiors";
import { PixelRoom } from "../render/interiors/pixel";
import { VoxelRoom, type VoxelOptions } from "../render/interiors/voxel";
import "./interior-lab.css";

const WALLS: WallPattern[] = ["plaster", "brick", "timber", "panel", "stripe", "zellige", "mud", "stone", "bark", "hide", "felt", "canvas", "shoji", "reed"];
const FLOORS: FloorPattern[] = ["plank", "tile", "parquet", "earth", "mat", "rushes", "sand", "flag", "carpet", "paper"];
const SHAPES: Shape[] = ["rect", "L", "round", "oval", "apse", "courtyard"];
const SIZES: [string, number, number][] = [["Small", 8, 6], ["Medium", 12, 9], ["Medium-large", 14, 10], ["Large", 18, 13], ["Huge", 24, 16]];
const STATUS = ["Humble", "Common", "Elite"];
const BASIS = { documented: "Documented", archaeological: "Archaeological", reconstructed: "Reconstructed", modern: "Modern" };
const BREAKABLE = ["lamp", "lantern", "window"];
type Choice = RoomChoice & { profile: string };
const first = interiorProfile("maghrebi-dar")!;
const initial: Choice = { profile: first.id, seed: 7, status: 1, colorway: 0, w: 12, d: 10, hour: 9.5 };
const label = (k: string) => k[0].toUpperCase() + k.slice(1);
const clock = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;

type Stage = { canvas: HTMLCanvasElement | null; room?: PixelRoom | VoxelRoom };

export function InteriorLab() {
  const [c, setC] = useState<Choice>(initial);
  const [over, setOver] = useState<Partial<RoomParams>>({});
  const profile = interiorProfile(c.profile) ?? first;
  const typical = profile.rooms?.[c.room ?? 0].size ?? profile.size;
  const p = useMemo<RoomParams>(
    () => ({ ...resolveRoom(profile, c), ...Object.fromEntries(Object.entries(over).filter(([, v]) => v !== undefined)) }),
    [profile, c, over],
  );
  const [view, setView] = useState<"hybrid" | "both" | "pixel" | "voxel">("hybrid");
  const [tool, setTool] = useState<"hand" | "hammer">("hand");
  const [traceDetail, setTraceDetail] = useState<1 | 2>(2);
  const [dither, setDither] = useState(false);
  const tracer = useRef<VoxelRoom | undefined>(undefined);
  const [vo, setVo] = useState<VoxelOptions>({ rot: 0, top: false, detail: 1, bevel: true, haze: true, posterize: false });
  const [playing, setPlaying] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [stat, setStat] = useState("");
  const [, bump] = useState(0);
  // Colours and surfaces restyle the room in place; anything that moves furniture replans it.
  const layout = [p.seed, p.w, p.d, p.shape, p.trade, p.finish, p.door, p.fire, p.windows, p.windowStyle, p.seating, p.sleep, p.pole, p.smokehole, p.furnish.join()].join("|");
  const props = useMemo<Prop[]>(() => planRoom(p), [layout]); // eslint-disable-line react-hooks/exhaustive-deps
  const big = p.w * p.d;
  const pix = useRef<Stage>({ canvas: null });
  const vox = useRef<Stage>({ canvas: null });
  const voxDirty = useRef(true);
  const pRef = useRef(p);
  pRef.current = p;

  const choose = (patch: Partial<Choice>) => setC((o) => ({ ...o, ...patch }));
  const update = (patch: Partial<RoomParams>) => setOver((o) => ({ ...o, ...patch }));
  const pickProfile = (id: string) => {
    const pr = interiorProfile(id)!;
    setOver({});
    const size = pr.rooms?.[0].size ?? pr.size;
    setC((o) => ({ ...o, profile: id, room: 0, colorway: 0, shape: undefined, trade: undefined, w: size[0], d: size[1] }));
  };

  useEffect(() => {
    if (pix.current.canvas && !pix.current.room) pix.current.room = new PixelRoom(pix.current.canvas);
    (pix.current.room as PixelRoom | undefined)?.set(p, props);
    voxDirty.current = true;
  }, [p, props, view]);
  useEffect(() => {
    voxDirty.current = true;
  }, [vo, traceDetail]);

  useEffect(() => {
    let raf = 0, last = performance.now(), lastVox = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (playing) setC((o) => ({ ...o, hour: (o.hour + dt * 0.8) % 24 }));
      const pr = pix.current.room as PixelRoom | undefined;
      if (view === "hybrid") {
        tracer.current ??= new VoxelRoom(document.createElement("canvas"));
        if (voxDirty.current && now - lastVox > (playing ? 450 : 90)) {
          voxDirty.current = false;
          lastVox = now;
          tracer.current.set(pRef.current, props, { rot: 0, top: true, detail: big > 180 ? 1 : traceDetail, bevel: false, haze: true, posterize: false }, pr?.holes());
          setStat(`traced in ${tracer.current.buildMs.toFixed(0)} ms`);
        }
        if (pr) pr.dither = dither;
        pr?.frame(dt, tracer.current.lightField(dt));
      } else pr?.frame(dt);
      if (vox.current.canvas) {
        if (!vox.current.room) {
          vox.current.room = new VoxelRoom(vox.current.canvas);
          voxDirty.current = true;
        }
        const vr = vox.current.room as VoxelRoom;
        if (voxDirty.current && now - lastVox > (playing ? 450 : 90)) {
          voxDirty.current = false;
          lastVox = now;
          vr.set(pRef.current, props, { ...vo, detail: Math.min(vo.detail, big > 300 ? 1 : big > 150 ? 2 : 4) as 1 | 2 | 4 });
          setStat(`${vr.W}×${vr.H} px · lit in ${vr.buildMs.toFixed(0)} ms`);
        }
        vr.frame(dt);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [props, vo, playing, view, traceDetail, dither, big]);

  const locate = (e: React.MouseEvent<HTMLCanvasElement>, s: Stage) => {
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const room = s.room;
    if (!room) return -1;
    return room.pick(((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height);
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>, s: Stage) => {
    const id = locate(e, s);
    if (s.room) s.room.hover = id;
    const q = props[id];
    if (tool === "hammer" && s === pix.current) {
      const text = !q || ["tapestry", "pegs", "plates", "map", "clutter"].includes(q.kind) ? "Strike" : q.broken ? "Already broken" : BREAKABLE.includes(q.kind) ? `Smash the ${q.kind}` : "Too sturdy";
      setTip({ x: e.clientX, y: e.clientY, text });
      e.currentTarget.style.cursor = "crosshair";
      return;
    }
    const verbs = q && !q.broken && !(q.kind === "window" && p.windowStyle !== "shutter") && !(q.kind === "door" && p.door === "opening") && interactive[q.kind];
    setTip(q ? { x: e.clientX, y: e.clientY, text: verbs ? verbs[q.on ? 1 : 0] : q.broken ? `Broken ${q.kind}` : label(q.item ?? q.kind) } : null);
    e.currentTarget.style.cursor = verbs ? "pointer" : "default";
  };
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>, s: Stage) => {
    if (tool === "hammer" && s === pix.current) {
      const c = e.currentTarget, r = c.getBoundingClientRect();
      const hit = (s.room as PixelRoom).hit(((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height);
      if (!hit) return;
      if (hit !== "floor") voxDirty.current = true;
      c.animate([{ transform: "none" }, { transform: "translate(3px,-2px)" }, { transform: "translate(-2px,2px)" }, { transform: "none" }], { duration: 140 });
      return;
    }
    const q = props[locate(e, s)];
    if (!q || q.broken || !interactive[q.kind] || (q.kind === "window" && p.windowStyle !== "shutter") || (q.kind === "door" && p.door === "opening")) return;
    q.on = !q.on;
    voxDirty.current = true;
    const verbs = interactive[q.kind]!;
    setTip((t) => t && { ...t, text: verbs[q.on ? 1 : 0] });
    bump((n) => n + 1);
  };
  const leave = (s: Stage) => {
    if (s.room) s.room.hover = -1;
    setTip(null);
  };

  const stage = (s: React.MutableRefObject<Stage>, title: string, note: string, extra?: React.ReactNode) => (
    <figure className="ilab-stage">
      <figcaption>
        <strong>{title}</strong>
        <span>{note}</span>
        {extra}
      </figcaption>
      <div className="ilab-canvas">
        <canvas
          ref={(c) => {
            if (c && c !== s.current.canvas) s.current = { canvas: c };
          }}
          onMouseMove={(e) => onMove(e, s.current)}
          onMouseLeave={() => leave(s.current)}
          onClick={(e) => onClick(e, s.current)}
        />
      </div>
    </figure>
  );

  return (
    <div className="ilab">
      <header className="ilab-head">
        <div>
          <p className="ilab-eyebrow">Universal History Simulator · development</p>
          <h1>Interior lab</h1>
          <p>{interiorGroups.reduce((n, g) => n + g.profiles.length, 0)} dwellings, three levels of finish, six room shapes. Click doors, fires, lamps, chests, bedding and the cat; take a hammer to the rest.</p>
        </div>
        <div className="ilab-views" role="group" aria-label="View">
          {(["hybrid", "both", "pixel", "voxel"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "both" ? "Side by side" : label(v)}
            </button>
          ))}
        </div>
      </header>
      <div className="ilab-body">
        <aside className="ilab-panel">
          <section>
            <h2>Tool</h2>
            <div className="ilab-chips">
              <button aria-pressed={tool === "hand"} onClick={() => setTool("hand")}>Hand</button>
              <button aria-pressed={tool === "hammer"} disabled={view === "voxel"} onClick={() => setTool("hammer")}>Hammer</button>
            </div>
            <button
              className="ilab-wide"
              onClick={() => {
                (pix.current.room as PixelRoom | undefined)?.repair();
                voxDirty.current = true;
              }}
            >
              Repair everything
            </button>
          </section>
          <section>
            <h2>Dwelling</h2>
            <select className="ilab-wide" value={c.profile} onChange={(e) => pickProfile(e.target.value)}>
              {interiorGroups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.profiles.map((pr) => <option key={pr.id} value={pr.id}>{pr.label}</option>)}
                </optgroup>
              ))}
            </select>
            <div className="ilab-card">
              <p className="ilab-meta">
                {profile.region} · {profile.period}
                <span className={`ilab-basis ilab-basis-${profile.basis}`}>{BASIS[profile.basis]}</span>
              </p>
              <p>{profile.note}</p>
            </div>
            {profile.rooms && (
              <div className="ilab-chips">
                {profile.rooms.map((rm, i) => (
                  <button key={rm.id} aria-pressed={(c.room ?? 0) === i} onClick={() => { setOver({}); choose({ room: i, w: rm.size[0], d: rm.size[1], trade: undefined }); }}>
                    {rm.label}
                  </button>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2>Household</h2>
            <div className="ilab-chips ilab-three">
              {STATUS.map((t, i) => (
                <button key={t} aria-pressed={c.status === i} onClick={() => choose({ status: i as Finish })}>{t}</button>
              ))}
            </div>
            <div className="ilab-chips">
              {profile.trades.map((t) => (
                <button key={t} aria-pressed={p.trade === t} onClick={() => choose({ trade: t })}>{label(t)}</button>
              ))}
            </div>
            <div className="ilab-row">
              <span>Seed {c.seed}</span>
              <button onClick={() => choose({ seed: 1 + Math.floor(Math.random() * 9999) })}>Reroll</button>
            </div>
          </section>
          <section>
            <h2>Colourway</h2>
            <div className="ilab-ways">
              {profile.colorways.map((w, i) => (
                <button key={w.name} aria-pressed={c.colorway === i} onClick={() => { setOver((o) => ({ ...o, wall: undefined, trim: undefined, floor: undefined, wood: undefined, accent: undefined })); choose({ colorway: i }); }} title={w.name}>
                  <span className="ilab-strip">{[w.wall, w.trim, w.floor, w.wood, w.accent].map((h, k) => <i key={k} style={{ background: h }} />)}</span>
                  <small>{w.name}</small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>Room</h2>
            <div className="ilab-chips ilab-three">
              {SHAPES.map((sh) => (
                <button key={sh} aria-pressed={p.shape === sh} className={profile.shapes.includes(sh) ? "" : "ilab-off"} onClick={() => choose({ shape: sh })}>{sh === "L" ? "L-shape" : label(sh)}</button>
              ))}
            </div>
            <div className="ilab-chips ilab-three">
              <button aria-pressed={c.w === typical[0] && c.d === typical[1]} onClick={() => choose({ w: typical[0], d: typical[1] })}>Typical</button>
              {SIZES.map(([n, w, d]) => (
                <button key={n} aria-pressed={c.w === w && c.d === d} onClick={() => choose({ w, d })}>{n}</button>
              ))}
            </div>
            <label className="ilab-slider">
              <span>Width · {c.w} tiles</span>
              <input type="range" min={5} max={28} value={c.w} onChange={(e) => choose({ w: +e.target.value })} />
            </label>
            <label className="ilab-slider">
              <span>Depth · {c.d} tiles</span>
              <input type="range" min={4} max={20} value={c.d} onChange={(e) => choose({ d: +e.target.value })} />
            </label>
            <label className="ilab-slider">
              <span>Wear · {Math.round(p.wear * 100)}%</span>
              <input type="range" min={0} max={1} step={0.05} value={p.wear} onChange={(e) => update({ wear: +e.target.value })} />
            </label>
            <label className="ilab-slider">
              <span>Soot · {Math.round(p.soot * 100)}%</span>
              <input type="range" min={0} max={1} step={0.05} value={p.soot} onChange={(e) => update({ soot: +e.target.value })} />
            </label>
          </section>
          <section>
            <h2>Surfaces</h2>
            {([["Walls", "wallPattern", WALLS], ["Lower wall", "dado", WALLS], ["Floor", "floorPattern", FLOORS]] as const).map(([name, key, list]) => (
              <label key={key} className="ilab-select">
                <span>{name}</span>
                <select value={p[key] ?? ""} onChange={(e) => update({ [key]: e.target.value || undefined })}>
                  {key === "dado" && <option value="">Same as walls</option>}
                  {list.map((w) => <option key={w} value={w}>{label(w)}</option>)}
                </select>
              </label>
            ))}
            <div className="ilab-swatches">
              {(["wall", "trim", "floor", "wood", "accent"] as const).map((k) => (
                <label key={k}>
                  <input type="color" value={p[k]} onChange={(e) => update({ [k]: e.target.value })} />
                  <span>{label(k)}</span>
                </label>
              ))}
            </div>
            <button className="ilab-wide" disabled={!Object.values(over).some((v) => v !== undefined)} onClick={() => setOver({})}>Back to the profile</button>
          </section>
          <section>
            <h2>Light</h2>
            <label className="ilab-slider">
              <span>Time · {clock(p.hour)}</span>
              <input type="range" min={0} max={23.99} step={0.05} value={c.hour} onChange={(e) => choose({ hour: +e.target.value })} />
            </label>
            <button className="ilab-wide" aria-pressed={playing} onClick={() => setPlaying((v) => !v)}>
              {playing ? "Pause the day" : "Run the day"}
            </button>
          </section>
          {view === "hybrid" && (
            <section>
              <h2>Traced light</h2>
              <label className="ilab-select">
                <span>Light resolution</span>
                <select value={traceDetail} onChange={(e) => setTraceDetail(+e.target.value as 1 | 2)}>
                  <option value={1}>One sample a pixel</option>
                  <option value={2}>Four samples a pixel, softer</option>
                </select>
              </label>
              <label className="ilab-check">
                <input type="checkbox" checked={dither} onChange={(e) => setDither(e.target.checked)} />
                <span>Dithered light bands</span>
              </label>
              <p className="ilab-stat">{stat}</p>
            </section>
          )}
          {(view === "both" || view === "voxel") && (
            <section>
              <h2>Voxel</h2>
              <div className="ilab-chips">
                <button aria-pressed={!vo.top} onClick={() => setVo((o) => ({ ...o, top: false }))}>Isometric</button>
                <button aria-pressed={vo.top} onClick={() => setVo((o) => ({ ...o, top: true }))}>Top-down</button>
              </div>
              <label className="ilab-select">
                <span>Detail</span>
                <select value={vo.detail} onChange={(e) => setVo((o) => ({ ...o, detail: +e.target.value as 1 | 2 | 4 }))}>
                  <option value={1}>8 voxels a tile · 16 px, SNES</option>
                  <option value={2}>16 voxels a tile · 32 px, PS1 sprites</option>
                  <option value={4}>32 voxels a tile · 64 px, FF7 backdrops</option>
                </select>
              </label>
              <div className="ilab-row">
                <button onClick={() => setVo((o) => ({ ...o, rot: o.rot + 3 }))}>↺ Turn</button>
                <button onClick={() => setVo((o) => ({ ...o, rot: o.rot + 1 }))}>Turn ↻</button>
              </div>
              {(["haze", "bevel", "posterize"] as const).map((k) => (
                <label key={k} className="ilab-check">
                  <input type="checkbox" checked={vo[k]} onChange={(e) => setVo((o) => ({ ...o, [k]: e.target.checked }))} />
                  <span>{{ haze: "Volumetric sunbeams", bevel: "Bevelled voxels", posterize: "Posterised palette" }[k]}</span>
                </label>
              ))}
              <p className="ilab-stat">{stat}</p>
            </section>
          )}
        </aside>
        <main className={`ilab-stages ilab-${view}`}>
          {view === "hybrid" &&
            stage(pix, `${STATUS[c.status]} ${profile.label.toLowerCase()}${profile.rooms ? " · " + profile.rooms[c.room ?? 0].label.toLowerCase() : ""}`, `${p.w} × ${p.d} tiles · ${props.length} pieces · pixels lit by the voxel ray tracer`)}
          {(view === "both" || view === "pixel") &&
            stage(pix, "Pixel art", "16 px tiles, hue-shifted ramps, auto sel-out, dithered light")}
          {(view === "both" || view === "voxel") &&
            stage(vox, "Voxel", "8 voxels a tile, ray-traced sun, sky and firelight")}
        </main>
      </div>
      {tip && (
        <div className="ilab-tip" style={{ left: tip.x + 14, top: tip.y + 12 }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
