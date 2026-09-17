import { useEffect, useMemo, useRef, useState } from "react";
import {
  METRICS,
  METRIC_BY_ID,
  PRESETS,
  median,
  type Metric,
  type Preset,
  type Report,
  type Sprite,
} from "./art-audit-metrics";
import "./art-audit-lab.css";

/** Quality control for the pixel art.
 *
 * The report is measurements, not verdicts, so the whole point of this screen
 * is that the thresholds are yours: drag a slider until the sprites showing up
 * are the ones that actually look wrong, then that range is the rule worth
 * writing down. The overlays exist because most faults are invisible at 1x and
 * obvious once you show only the pixels that cause them.
 */

const ATLAS: Record<Sprite["source"], string> = {
  packs: "/packs/atlas.png",
  props: "/props/atlas.png",
};

const BACKDROPS: [string, string][] = [
  ["Sand", "#d8c8a0"],
  ["Grass", "#7c8c45"],
  ["Stone", "#9a9b86"],
  ["Dusk", "#3b4150"],
  ["Night", "#141a1f"],
  ["Void", "#ff00ff"],
];

type Overlay = "none" | "rim" | "offramp" | "value" | "steps";

const OVERLAYS: [Overlay, string, string][] = [
  ["none", "Art", "The sprite as it ships."],
  ["rim", "Rim", "Only the near-darkest boundary pixels. A tinted rim nearly vanishes; a keyline draws the whole outline."],
  ["offramp", "Off palette", "Pixels in no declared ramp, in magenta."],
  ["value", "Value", "Colour thrown away, so shape has to carry on light alone."],
  ["steps", "Steps", "Each distinct tone by its rank, dark to light. Shows how many steps a surface really uses and where they jump."],
];

const STEP_COLOURS = [
  "#1b1035", "#3b1a5c", "#6b2a6b", "#a33a5e", "#d2603f",
  "#e79a3c", "#efc75e", "#f2e6a0", "#ffffff",
];

const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

function hex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** One sprite, drawn from the packed atlas at an integer zoom. */
function SpriteView({
  sprite,
  atlas,
  zoom,
  overlay,
  palette,
}: {
  sprite: Sprite;
  atlas: Record<string, HTMLImageElement | undefined>;
  zoom: number;
  overlay: Overlay;
  palette: Set<string>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [x, y, w, h] = sprite.atlas;
  const image = atlas[sprite.source];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !image) return;
    const scratch = document.createElement("canvas");
    scratch.width = w;
    scratch.height = h;
    const sc = scratch.getContext("2d", { willReadFrequently: true })!;
    sc.drawImage(image, x, y, w, h, 0, 0, w, h);

    if (overlay !== "none") {
      const data = sc.getImageData(0, 0, w, h);
      const p = data.data;
      const lums: number[] = [];
      for (let i = 0; i < p.length; i += 4)
        if (p[i + 3]) lums.push(luminance(p[i], p[i + 1], p[i + 2]));
      const lo = Math.min(...lums);
      const hi = Math.max(...lums);
      const span = Math.max(hi - lo, 1e-6);
      // Tone ranks for the step view: every distinct colour, ordered by value.
      const ranks = new Map<string, number>();
      if (overlay === "steps") {
        const seen = new Set<string>();
        for (let i = 0; i < p.length; i += 4)
          if (p[i + 3]) seen.add(hex(p[i], p[i + 1], p[i + 2]));
        [...seen]
          .sort(
            (a, b) =>
              luminance(
                parseInt(a.slice(1, 3), 16),
                parseInt(a.slice(3, 5), 16),
                parseInt(a.slice(5, 7), 16),
              ) -
              luminance(
                parseInt(b.slice(1, 3), 16),
                parseInt(b.slice(3, 5), 16),
                parseInt(b.slice(5, 7), 16),
              ),
          )
          .forEach((c, i, all) =>
            ranks.set(
              c,
              Math.round((i / Math.max(all.length - 1, 1)) * (STEP_COLOURS.length - 1)),
            ),
          );
      }
      // The rim view needs to know which opaque pixels touch transparency.
      const opaque = (px: number, py: number) =>
        px >= 0 && py >= 0 && px < w && py < h && p[(py * w + px) * 4 + 3] > 0;

      for (let i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        const value = luminance(p[i], p[i + 1], p[i + 2]);
        const paint = (r: number, g: number, b: number, a = 255) => {
          p[i] = r; p[i + 1] = g; p[i + 2] = b; p[i + 3] = a;
        };
        if (overlay === "value") {
          const v = Math.round(((value - lo) / span) * 255);
          paint(v, v, v);
        } else if (overlay === "steps") {
          const c = STEP_COLOURS[ranks.get(hex(p[i], p[i + 1], p[i + 2])) ?? 0];
          paint(
            parseInt(c.slice(1, 3), 16),
            parseInt(c.slice(3, 5), 16),
            parseInt(c.slice(5, 7), 16),
          );
        } else if (overlay === "offramp") {
          if (palette.has(hex(p[i], p[i + 1], p[i + 2]))) paint(30, 34, 38, 90);
          else paint(255, 0, 200);
        } else if (overlay === "rim") {
          const edge =
            !opaque(px + 1, py) || !opaque(px - 1, py) ||
            !opaque(px, py + 1) || !opaque(px, py - 1);
          if (edge && value <= lo + 0.12 * span) paint(255, 0, 200);
          else paint(30, 34, 38, 70);
        }
      }
      sc.putImageData(data, 0, 0);
    }

    canvas.width = w * zoom;
    canvas.height = h * zoom;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scratch, 0, 0, canvas.width, canvas.height);
  }, [image, x, y, w, h, zoom, overlay, palette]);

  return <canvas ref={ref} className="aa-canvas" />;
}

function Slider({
  metric,
  range,
  onChange,
}: {
  metric: Metric;
  range: [number, number];
  onChange: (r: [number, number] | null) => void;
}) {
  const format = metric.format ?? ((v: number) => String(Math.round(v)));
  const active = range[0] > metric.min || range[1] < metric.max;
  return (
    <div className={`aa-slider${active ? " on" : ""}`}>
      <label>
        <span>{metric.label}</span>
        <em>
          {format(range[0])} – {format(range[1])}
        </em>
        {active && (
          <button onClick={() => onChange(null)} title="Clear">
            ×
          </button>
        )}
      </label>
      <div className="aa-track">
        {[0, 1].map((end) => (
          <input
            key={end}
            type="range"
            min={metric.min}
            max={metric.max}
            step={metric.step}
            value={range[end]}
            onChange={(e) => {
              const v = Number(e.target.value);
              const next: [number, number] = [...range] as [number, number];
              next[end] = v;
              if (next[0] > next[1]) next[end ? 0 : 1] = v;
              onChange(next);
            }}
          />
        ))}
      </div>
      <p>{metric.note}</p>
    </div>
  );
}

export function ArtAuditLab() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [atlas, setAtlas] = useState<
    Record<string, HTMLImageElement | undefined>
  >({});

  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [ranges, setRanges] = useState<Record<string, [number, number]>>({});
  const [preset, setPreset] = useState<string | null>(null);
  const [sort, setSort] = useState("ringDark");
  const [descending, setDescending] = useState(true);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [backdrop, setBackdrop] = useState(BACKDROPS[0][1]);
  const [zoom, setZoom] = useState(3);
  const [faultsOnly, setFaultsOnly] = useState(false);
  const [selected, setSelected] = useState<Sprite | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/art-audit.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(setReport)
      .catch(() =>
        setError("No report yet. Run: python3 scripts/art_audit.py"),
      );
  }, []);

  useEffect(() => {
    for (const [source, url] of Object.entries(ATLAS)) {
      const image = new Image();
      image.src = url;
      image.onload = () => setAtlas((a) => ({ ...a, [source]: image }));
    }
  }, []);

  const palette = useMemo(
    () =>
      new Set(
        Object.values(report?.ramps ?? {}).flat().map((c) => c.toLowerCase()),
      ),
    [report],
  );

  const allKinds = useMemo(
    () => [...new Set(report?.sprites.map((s) => s.kind) ?? [])].sort(),
    [report],
  );

  const rangeFor = (m: Metric): [number, number] =>
    ranges[m.id] ?? [m.min, m.max];

  const applyPreset = (p: Preset) => {
    setPreset(p.id);
    setRanges(
      Object.fromEntries(
        Object.entries(p.ranges).map(([k, v]) => [k, v as [number, number]]),
      ),
    );
    setFaultsOnly(p.id === "mechanical");
    if (p.sort) {
      setSort(p.sort);
      setDescending(p.desc ?? METRIC_BY_ID[p.sort]?.worse !== "low");
    }
  };

  const shown = useMemo(() => {
    if (!report) return [];
    const term = search.trim().toLowerCase();
    const out = report.sprites.filter((s) => {
      if (kinds.size && !kinds.has(s.kind)) return false;
      if (term && !s.key.toLowerCase().includes(term)) return false;
      if (faultsOnly && !s.edgeCut.length && s.binaryAlpha) return false;
      for (const [id, [lo, hi]] of Object.entries(ranges)) {
        const v = s[id as keyof Sprite];
        if (typeof v !== "number") return false;
        if (v < lo || v > hi) return false;
      }
      return true;
    });
    const metric = METRIC_BY_ID[sort];
    out.sort((a, b) => {
      const av = (a[sort as keyof Sprite] as number) ?? 0;
      const bv = (b[sort as keyof Sprite] as number) ?? 0;
      return descending ? bv - av : av - bv;
    });
    return metric ? out : out;
  }, [report, kinds, search, ranges, sort, descending, faultsOnly]);

  // Compared against its own kind, because a building is meant to be flatter
  // and bigger than a pot and one shared threshold would only flag one of them.
  const norms = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const kind of allKinds) {
      const group = report!.sprites.filter((s) => s.kind === kind);
      out[kind] = Object.fromEntries(
        METRICS.map((m) => [
          m.id,
          median(
            group
              .map((s) => s[m.id as keyof Sprite])
              .filter((v): v is number => typeof v === "number"),
          ),
        ]),
      );
    }
    return out;
  }, [report, allKinds]);

  if (error) return <div className="art-audit empty">{error}</div>;
  if (!report) return <div className="art-audit empty">Reading report…</div>;

  const visible = showAll ? shown : shown.slice(0, 240);

  return (
    <div className="art-audit">
      <header className="aa-header">
        <div>
          <div className="eyebrow">QUALITY CONTROL</div>
          <h1>Art audit</h1>
          <p>
            {report.sprites.length} sprites measured against{" "}
            {Object.keys(report.ramps).length} declared ramps ·{" "}
            {report.generated.replace("T", " ")}
          </p>
        </div>
        <a className="aa-back" href="/">
          ← World
        </a>
      </header>

      <div className="aa-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={preset === p.id ? "on" : ""}
            onClick={() => applyPreset(p)}
            title={p.blurb}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => {
            setRanges({});
            setPreset(null);
            setFaultsOnly(false);
          }}
        >
          Clear
        </button>
      </div>
      {preset && <p className="aa-blurb">{PRESETS.find((p) => p.id === preset)?.blurb}</p>}

      <div className="aa-layout">
        <aside className="aa-controls">
          <section>
            <h3>Kind</h3>
            <div className="aa-chips">
              {allKinds.map((k) => (
                <button
                  key={k}
                  className={kinds.has(k) ? "on" : ""}
                  onClick={() =>
                    setKinds((s) => {
                      const next = new Set(s);
                      next.has(k) ? next.delete(k) : next.add(k);
                      return next;
                    })
                  }
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              className="aa-search"
              placeholder="name contains…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="aa-check">
              <input
                type="checkbox"
                checked={faultsOnly}
                onChange={(e) => setFaultsOnly(e.target.checked)}
              />
              Clipped or soft-alpha only
            </label>
          </section>

          <section>
            <h3>View</h3>
            <div className="aa-chips">
              {OVERLAYS.map(([id, label, note]) => (
                <button
                  key={id}
                  className={overlay === id ? "on" : ""}
                  onClick={() => setOverlay(id)}
                  title={note}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="aa-chips">
              {BACKDROPS.map(([label, colour]) => (
                <button
                  key={label}
                  className={backdrop === colour ? "on" : ""}
                  style={{ background: colour, color: "#1b1f22" }}
                  onClick={() => setBackdrop(colour)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="aa-zoom">
              Zoom {zoom}×
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </section>

          <section>
            <h3>Sort</h3>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              className="aa-dir"
              onClick={() => setDescending((d) => !d)}
            >
              {descending ? "highest first" : "lowest first"}
            </button>
          </section>

          <section>
            <h3>Thresholds</h3>
            <p className="aa-hint">
              Drag until the sprites listed are the ones that actually look
              wrong. That range is the rule worth writing into the style doc.
            </p>
            {METRICS.map((m) => (
              <Slider
                key={m.id}
                metric={m}
                range={rangeFor(m)}
                onChange={(r) => {
                  setPreset(null);
                  setRanges((s) => {
                    const next = { ...s };
                    if (r) next[m.id] = r;
                    else delete next[m.id];
                    return next;
                  });
                }}
              />
            ))}
          </section>
        </aside>

        <main>
          <div className="aa-count">
            {shown.length} of {report.sprites.length} sprites
            {shown.length > visible.length && (
              <button onClick={() => setShowAll(true)}>
                show all {shown.length}
              </button>
            )}
          </div>
          <div className="aa-grid" style={{ background: backdrop }}>
            {visible.map((s) => (
              <button
                key={s.key}
                className={`aa-cell${selected?.key === s.key ? " on" : ""}`}
                onClick={() => setSelected(s)}
              >
                <SpriteView
                  sprite={s}
                  atlas={atlas}
                  zoom={zoom}
                  overlay={overlay}
                  palette={palette}
                />
                <span className="aa-tag">
                  {s.key.replace(/^study-prop[b]?-/, "")}
                  <em>
                    {(METRIC_BY_ID[sort]?.format ??
                      ((v: number) => v.toFixed(2)))(
                      (s[sort as keyof Sprite] as number) ?? 0,
                    )}
                  </em>
                </span>
              </button>
            ))}
          </div>
        </main>

        {selected && (
          <aside className="aa-detail">
            <header>
              <h3>{selected.key}</h3>
              <button onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="aa-detail-art" style={{ background: backdrop }}>
              <SpriteView
                sprite={selected}
                atlas={atlas}
                zoom={Math.max(2, Math.min(8, Math.floor(260 / selected.w)))}
                overlay={overlay}
                palette={palette}
              />
            </div>
            <p className="aa-meta">
              {selected.kind} · {selected.family} · {selected.w}×{selected.h} ·{" "}
              {selected.pixels} px
              {selected.ramps?.length ? ` · ${selected.ramps.join(", ")}` : ""}
            </p>
            {(selected.edgeCut.length > 0 || !selected.binaryAlpha) && (
              <p className="aa-fault">
                {selected.edgeCut.length
                  ? `Clipped at the ${selected.edgeCut.join(", ")} edge. `
                  : ""}
                {selected.binaryAlpha ? "" : "Part-transparent alpha."}
              </p>
            )}
            <div className="aa-swatches">
              {selected.top.map(([colour, n]) => (
                <i
                  key={colour}
                  style={{ background: colour }}
                  title={`${colour} · ${n}px${palette.has(colour) ? "" : " · off palette"}`}
                  className={palette.has(colour) ? "" : "off"}
                />
              ))}
            </div>
            <table className="aa-table">
              <tbody>
                {METRICS.map((m) => {
                  const v = selected[m.id as keyof Sprite];
                  if (typeof v !== "number") return null;
                  const norm = norms[selected.kind]?.[m.id] ?? 0;
                  const format = m.format ?? ((n: number) => n.toFixed(2));
                  // The bar is the sprite against its own kind's median, so
                  // "unusual for a building" is legible without knowing the units.
                  const ratio = norm ? Math.min(2, Math.abs(v) / Math.abs(norm)) : 1;
                  return (
                    <tr key={m.id}>
                      <th title={m.note}>{m.label}</th>
                      <td>{format(v)}</td>
                      <td className="aa-bar">
                        <i style={{ width: `${(ratio / 2) * 100}%` }} />
                      </td>
                      <td className="aa-norm">{format(norm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="aa-hint">
              Right column is the median for every other {selected.kind}.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

export default ArtAuditLab;
