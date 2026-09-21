import { useEffect, useMemo, useRef, useState } from "react";
import {
  H,
  OY,
  T,
  W,
  makeLayout,
  proposed,
  render,
  today,
  wallMaterials,
  type EdgeSettings,
} from "./edge-lab/render";
import "./terrain-experiments.css";

export function EdgeLab() {
  const [s, setS] = useState<EdgeSettings>(proposed);
  const [holding, setHolding] = useState(false);
  const [ms, setMs] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const set = (patch: Partial<EdgeSettings>) =>
    setS((prev) => ({ ...prev, ...patch }));

  // Holding Compare shows today's look on the same seed.
  const shown = useMemo(
    () =>
      holding
        ? { ...today, seed: s.seed, zoom: s.zoom, showRaw: s.showRaw }
        : s,
    [holding, s],
  );
  const layout = useMemo(() => makeLayout(shown), [shown]);
  const before = useMemo(
    () => makeLayout({ ...today, seed: s.seed }),
    [s.seed],
  );

  useEffect(() => {
    // Lab-only hook so review scripts can drive the panel without clicking.
    Object.assign(window, { edgeLab: { apply: set } });
    return () => {
      delete (window as unknown as { edgeLab?: unknown }).edgeLab;
    };
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const id = requestAnimationFrame(() => {
      const started = performance.now();
      const buf = render(layout, shown);
      c.width = buf.width;
      // The lift margin above the map is cropped, not shown as a blank band.
      c.height = buf.height - OY;
      const ctx = c.getContext("2d")!;
      ctx.putImageData(buf.toImageData(), 0, -OY);
      if (shown.showRaw) {
        ctx.strokeStyle = "#ff8a80";
        ctx.lineWidth = 2;
        ctx.beginPath();
        layout.raw.forEach((row, x) => {
          ctx.lineTo(x * T, row * T);
          ctx.lineTo((x + 1) * T, row * T);
        });
        ctx.stroke();
      }
      setMs(Math.round(performance.now() - started));
    });
    return () => cancelAnimationFrame(id);
  }, [layout, shown]);

  const exportPng = () => {
    const a = document.createElement("a");
    a.href = canvas.current!.toDataURL("image/png");
    a.download = `uhs-edges-${s.seed}.png`;
    a.click();
  };
  const town = s.townEdge === "wall";

  return (
    <div className="tx">
      <header className="tx-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>Altitude edge lab</h1>
        </div>
        <span>
          Mockup of the proposed edge handling · 16 px tiles, 14 px rise
        </span>
        <div className="tx-header-actions">
          <button
            onPointerDown={() => setHolding(true)}
            onPointerUp={() => setHolding(false)}
            onPointerLeave={() => setHolding(false)}
          >
            Hold to compare
          </button>
          <button onClick={exportPng}>Export PNG</button>
        </div>
      </header>
      <div className="tx-layout">
        <aside className="tx-controls">
          <Group title="Preset">
            <div className="tx-approach">
              <button
                onClick={() => setS({ ...today, seed: s.seed, zoom: s.zoom })}
              >
                A · Today
              </button>
              <button
                onClick={() =>
                  setS({ ...proposed, seed: s.seed, zoom: s.zoom })
                }
              >
                B · Proposed
              </button>
            </div>
            <p className="tx-note">
              One fixture: a paved town on the left, open country on the right,
              ground rising to the north-east. Every control below is one part
              of the proposal and can be switched on its own.
            </p>
            <Slider
              label="Seed"
              value={s.seed}
              min={0}
              max={40}
              step={1}
              onChange={(v) => set({ seed: v })}
            />
            <Slider
              label="Zoom"
              value={s.zoom}
              min={1}
              max={4}
              step={1}
              onChange={(v) => set({ zoom: v })}
            />
            <Toggle
              label="Show the raw contour"
              value={s.showRaw}
              onChange={(v) => set({ showRaw: v })}
            />
          </Group>

          <Group title="1 · Town terraces its slope">
            <Toggle
              label="Straighten the boundary in town"
              value={s.terrace}
              onChange={(v) => set({ terrace: v })}
            />
            <Toggle
              label="Snap to kerbs and rear lot lines"
              value={s.snap}
              disabled={!s.terrace}
              onChange={(v) => set({ snap: v })}
            />
            <Slider
              label="Minimum run (tiles)"
              value={s.minRun}
              min={2}
              max={12}
              step={1}
              disabled={!s.terrace || s.snap}
              onChange={(v) => set({ minRun: v })}
            />
            <Toggle
              label="Terrace rows stand against mid-block steps"
              value={s.rowsHide}
              disabled={!s.terrace || !s.snap}
              onChange={(v) => set({ rowsHide: v })}
            />
            <Pick
              label="Street crossings"
              value={s.crossing}
              options={[
                ["cut", "Earth cut, road only (today)"],
                ["graded", "Graded street, full width"],
                ["steps", "Stone steps, full width"],
              ]}
              onChange={(v) => set({ crossing: v as EdgeSettings["crossing"] })}
            />
          </Group>

          <Group title="2 · Edge styles">
            <Pick
              label="Town edges"
              value={s.townEdge}
              options={[
                ["bank", "Earth bank (today)"],
                ["wall", "Retaining wall"],
              ]}
              onChange={(v) => set({ townEdge: v as EdgeSettings["townEdge"] })}
            />
            <Pick
              label="Wall material"
              value={String(s.wallMaterial)}
              options={wallMaterials.map(
                (n, i) => [String(i), n] as [string, string],
              )}
              disabled={!town}
              onChange={(v) => set({ wallMaterial: Number(v) })}
            />
            <Toggle
              label="Parapet on the wall"
              value={s.parapet}
              disabled={!town}
              onChange={(v) => set({ parapet: v })}
            />
            <Pick
              label="Open country edges"
              value={s.countryEdge}
              options={[
                ["auto", "Auto · per run, crag on tall drops"],
                ["bank", "Earth bank"],
                ["slope", "Grass slope"],
                ["crag", "Crag"],
              ]}
              onChange={(v) =>
                set({ countryEdge: v as EdgeSettings["countryEdge"] })
              }
            />
            <Slider
              label="Slope length (tiles)"
              value={s.slopeLength}
              min={1}
              max={3}
              step={1}
              onChange={(v) => set({ slopeLength: v })}
            />
          </Group>

          <Group title="3 · Renderer polish">
            <Slider
              label="Side face width (px)"
              value={s.sideFace}
              min={0}
              max={6}
              step={1}
              onChange={(v) => set({ sideFace: v })}
            />
            <Slider
              label="Rim saturation"
              value={s.rimSaturation}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ rimSaturation: v })}
            />
            <Toggle
              label="Weeds, scree and gutter at the foot"
              value={s.foot}
              onChange={(v) => set({ foot: v })}
            />
            <Slider
              label="Contact shadow (px)"
              value={s.contactShadow}
              min={0}
              max={8}
              step={1}
              onChange={(v) => set({ contactShadow: v })}
            />
            <Slider
              label="Contour wobble"
              value={s.wobble}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ wobble: v })}
            />
          </Group>

          <Group title="4 · Hillshade">
            <Slider
              label="Strength"
              value={s.hillshade}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ hillshade: v })}
            />
          </Group>
        </aside>
        <main className="tx-stage">
          <canvas
            ref={canvas}
            style={{
              width: W * T * s.zoom,
              height: H * T * s.zoom,
              imageRendering: "pixelated",
            }}
          />
          <footer className="tx-status">
            {holding ? "Showing today · " : ""}
            boundary jogs {before.jogs} → {layout.jogs} · level lots{" "}
            {before.built}/{before.lots} → {layout.built}/{layout.lots} · drew
            in {ms} ms
          </footer>
        </main>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tx-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`tx-slider${disabled ? " off" : ""}`}>
      <span>
        {label}
        <em>{step < 1 ? value.toFixed(2) : value}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`tx-toggle${disabled ? " off" : ""}`}>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Pick({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`tx-select${disabled ? " off" : ""}`}>
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, name]) => (
          <option key={v} value={v}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
