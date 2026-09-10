import { useEffect, useMemo, useRef, useState } from "react";
import { makeField } from "./terrain-experiments/field";
import {
  layoutFor,
  prepareSwatches,
  renderProcedural,
  type Swatch,
} from "./terrain-experiments/procedural";
import {
  loadAtlas,
  renderAtlas,
  type Atlas,
} from "./terrain-experiments/atlas";
import { palettes } from "./terrain-experiments/palette";
import { defaults, type Settings } from "./terrain-experiments/settings";
import "./terrain-experiments.css";

type Patch = Omit<Partial<Settings>, "field"> & {
  field?: Partial<Settings["field"]>;
};

export function TerrainExperiments() {
  const [s, setS] = useState<Settings>(defaults);
  const [atlas, setAtlas] = useState<Atlas>();
  const [swatch, setSwatch] = useState<Swatch>();
  const [ms, setMs] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const set = (patch: Patch) =>
    setS((prev) => ({
      ...prev,
      ...patch,
      field: { ...prev.field, ...patch.field },
    }));

  useEffect(() => {
    void loadAtlas().then((a) => {
      setAtlas(a);
      const turf = a.sheets.turf;
      const data = turf
        .getContext("2d")!
        .getImageData(0, 0, turf.width, turf.height);
      setSwatch(prepareSwatches(data));
    });
    // Lab-only hook so review scripts can drive the panel without clicking.
    Object.assign(window, { terrainExperiments: { apply: set } });
    return () => {
      delete (window as unknown as { terrainExperiments?: unknown })
        .terrainExperiments;
    };
  }, []);

  const field = useMemo(() => makeField(s.field), [s.field]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (s.approach === "atlas" && !atlas) return;
    const draw = () => {
      const started = performance.now();
      const ctx = c.getContext("2d")!;
      if (s.approach === "atlas") {
        renderAtlas(ctx, atlas!, field, s);
      } else {
        const buf = renderProcedural(field, s, swatch);
        c.width = buf.width;
        c.height = buf.height;
        ctx.putImageData(buf.toImageData(), 0, 0);
      }
      setMs(Math.round(performance.now() - started));
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [field, s, atlas, swatch]);

  const size = layoutFor(field, s.rise);
  const exportPng = () => {
    const a = document.createElement("a");
    a.href = canvas.current!.toDataURL("image/png");
    a.download = `uhs-terrain-${s.approach}-${s.field.seed}.png`;
    a.click();
  };

  return (
    <div className="tx">
      <header className="tx-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>Terrain experiments</h1>
        </div>
        <span>Grass, dirt and altitude steps · 16 px tiles</span>
        <div className="tx-header-actions">
          <button onClick={() => setS(defaults)}>Reset</button>
          <button onClick={exportPng}>Export PNG</button>
        </div>
      </header>
      <div className="tx-layout">
        <aside className="tx-controls">
          <Group title="Approach">
            <div className="tx-approach">
              {(["procedural", "atlas"] as const).map((a) => (
                <button
                  key={a}
                  className={s.approach === a ? "on" : ""}
                  onClick={() => set({ approach: a })}
                >
                  {a === "procedural" ? "A · Procedural" : "B · Tileset atlas"}
                </button>
              ))}
            </div>
            <p className="tx-note">
              {s.approach === "procedural"
                ? "Every pixel drawn from code against the chosen palette. The grass/dirt boundary is a continuous field, so it ignores the tile grid."
                : "Grass & Dirt 47-blob sheets, GRASS+ turf and the Mystic Woods earth bank, composited on the same height field."}
            </p>
            <Select
              label="Palette"
              value={s.palette}
              options={palettes.map((p, i) => [i, p.name] as [number, string])}
              onChange={(v) => set({ palette: v })}
            />
          </Group>

          <Group title="Field">
            <Slider
              label="Seed"
              value={s.field.seed}
              min={0}
              max={64}
              step={1}
              onChange={(v) => set({ field: { seed: v } })}
            />
            <Slider
              label="Width"
              value={s.field.width}
              min={16}
              max={80}
              step={1}
              onChange={(v) => set({ field: { width: v } })}
            />
            <Slider
              label="Height"
              value={s.field.height}
              min={12}
              max={60}
              step={1}
              onChange={(v) => set({ field: { height: v } })}
            />
            <Slider
              label="Altitude levels"
              value={s.field.levels}
              min={1}
              max={5}
              step={1}
              onChange={(v) => set({ field: { levels: v } })}
            />
            <Slider
              label="Relief scale"
              value={s.field.reliefScale}
              min={4}
              max={30}
              step={1}
              onChange={(v) => set({ field: { reliefScale: v } })}
            />
            <Slider
              label="Plateau flatness"
              value={s.field.plateauBias}
              min={0}
              max={0.95}
              step={0.05}
              onChange={(v) => set({ field: { plateauBias: v } })}
            />
            <Slider
              label="Contour wobble"
              value={s.contourWobble}
              min={0}
              max={1.2}
              step={0.05}
              onChange={(v) => set({ contourWobble: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Wobble scale"
              value={s.contourScale}
              min={1}
              max={20}
              step={1}
              onChange={(v) => set({ contourScale: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Contour smoothing"
              value={s.contourSmoothing}
              min={0}
              max={4}
              step={1}
              onChange={(v) => set({ contourSmoothing: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Step height (px)"
              value={s.rise}
              min={8}
              max={28}
              step={1}
              onChange={(v) => set({ rise: v })}
            />
            <Slider
              label="Zoom"
              value={s.zoom}
              min={1}
              max={6}
              step={1}
              onChange={(v) => set({ zoom: v })}
            />
          </Group>

          <Group title="Grass / dirt edge">
            <Slider
              label="Dirt coverage"
              value={s.field.dirtCoverage}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => set({ field: { dirtCoverage: v } })}
            />
            <Slider
              label="Patch scale"
              value={s.field.dirtScale}
              min={3}
              max={24}
              step={1}
              onChange={(v) => set({ field: { dirtScale: v } })}
            />
            <Slider
              label="Scalloping"
              value={s.edgeScallop}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => set({ edgeScallop: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Grass rim (px)"
              value={s.edgeRim}
              min={0}
              max={3}
              step={1}
              onChange={(v) => set({ edgeRim: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Overhanging fringe"
              value={s.edgeFringe}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ edgeFringe: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Pebbles on dirt"
              value={s.edgePebbles}
              min={0}
              max={0.6}
              step={0.02}
              onChange={(v) => set({ edgePebbles: v })}
              disabled={s.approach === "atlas"}
            />
          </Group>

          <Group title="Bank of earth">
            <Slider
              label="Grass lip (px)"
              value={s.bankLip}
              min={0}
              max={8}
              step={1}
              onChange={(v) => set({ bankLip: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Strata"
              value={s.bankStrata}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => set({ bankStrata: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Earth lobes"
              value={s.bankLobes}
              min={0}
              max={1.5}
              step={0.05}
              onChange={(v) => set({ bankLobes: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Roots & stones"
              value={s.bankRoots}
              min={0}
              max={0.3}
              step={0.01}
              onChange={(v) => set({ bankRoots: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Side rim (px)"
              value={s.bankSides}
              min={0}
              max={4}
              step={1}
              onChange={(v) => set({ bankSides: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Cast shadow (px)"
              value={s.bankShadow}
              min={0}
              max={8}
              step={1}
              onChange={(v) => set({ bankShadow: v })}
            />
            <Toggle
              label="Edge outline"
              value={s.bankOutline}
              onChange={(v) => set({ bankOutline: v })}
            />
          </Group>

          <Group title="Turf texture">
            <Slider
              label="Swatch (−1 drifts)"
              value={s.turfSwatchVariant}
              min={-1}
              max={11}
              step={1}
              onChange={(v) => set({ turfSwatchVariant: v })}
              disabled={s.approach === "atlas" || s.turfPerLevel}
            />
            <Slider
              label="Swatch opacity"
              value={s.turfSwatchOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ turfSwatchOpacity: v })}
              disabled={s.approach === "atlas"}
            />
            <Toggle
              label="Swatch per altitude"
              value={s.turfPerLevel}
              onChange={(v) => set({ turfPerLevel: v })}
              disabled={s.approach === "atlas"}
            />
            {s.turfPerLevel &&
              Array.from({ length: s.field.levels }, (_, level) => (
                <Slider
                  key={level}
                  label={`Level ${level} (−1 none)`}
                  value={s.turfLevelSwatch[level] ?? -1}
                  min={-1}
                  max={11}
                  step={1}
                  onChange={(v) =>
                    set({
                      turfLevelSwatch: s.turfLevelSwatch.map((prev, i) =>
                        i === level ? v : prev,
                      ),
                    })
                  }
                  disabled={s.approach === "atlas"}
                />
              ))}
            <Slider
              label="Brightness"
              value={s.turfBrightness}
              min={0.5}
              max={1.5}
              step={0.02}
              onChange={(v) => set({ turfBrightness: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Saturation"
              value={s.turfSaturation}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => set({ turfSaturation: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Contrast"
              value={s.turfContrast}
              min={0.3}
              max={2}
              step={0.05}
              onChange={(v) => set({ turfContrast: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Tone variation"
              value={s.turfVariation}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => set({ turfVariation: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Noise scale"
              value={s.turfScale}
              min={1}
              max={12}
              step={0.2}
              onChange={(v) => set({ turfScale: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Octaves"
              value={s.turfOctaves}
              min={1}
              max={5}
              step={1}
              onChange={(v) => set({ turfOctaves: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Blade density"
              value={s.bladeDensity}
              min={0}
              max={0.4}
              step={0.01}
              onChange={(v) => set({ bladeDensity: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Clumping"
              value={s.clumpiness}
              min={0}
              max={1.5}
              step={0.05}
              onChange={(v) => set({ clumpiness: v })}
              disabled={s.approach === "atlas"}
            />
            <Toggle
              label="GRASS+ turf under blobs"
              value={s.atlasTurf}
              onChange={(v) => set({ atlasTurf: v })}
              disabled={s.approach === "procedural"}
            />
            <Slider
              label="Turf variant (−1 mixes)"
              value={s.atlasTurfVariant}
              min={-1}
              max={11}
              step={1}
              onChange={(v) => set({ atlasTurfVariant: v })}
              disabled={s.approach === "procedural"}
            />
            <Toggle
              label="Recolour sheets to palette"
              value={s.atlasRecolour}
              onChange={(v) => set({ atlasRecolour: v })}
              disabled={s.approach === "procedural"}
            />
          </Group>

          <Group title="Scatter">
            <Slider
              label="Flowers"
              value={s.flowerDensity}
              min={0}
              max={0.2}
              step={0.005}
              onChange={(v) => set({ flowerDensity: v })}
            />
            <Slider
              label="Tufts"
              value={s.tuftDensity}
              min={0}
              max={0.4}
              step={0.01}
              onChange={(v) => set({ tuftDensity: v })}
              disabled={s.approach === "atlas"}
            />
            <Slider
              label="Rocks"
              value={s.rockDensity}
              min={0}
              max={0.1}
              step={0.002}
              onChange={(v) => set({ rockDensity: v })}
            />
            <Slider
              label="Drift clumping"
              value={s.scatterClumping}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => set({ scatterClumping: v })}
              disabled={s.approach === "atlas"}
            />
          </Group>
        </aside>
        <main className="tx-stage">
          <canvas
            ref={canvas}
            style={{
              width: size.width * s.zoom,
              height: size.height * s.zoom,
              imageRendering: "pixelated",
            }}
          />
          <footer className="tx-status">
            {size.width}×{size.height} px · {s.field.levels} levels · {s.rise}{" "}
            px step · drew in {ms} ms
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

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: [number, string][];
  onChange: (v: number) => void;
}) {
  return (
    <label className="tx-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map(([v, name]) => (
          <option key={v} value={v}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
