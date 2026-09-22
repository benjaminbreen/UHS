import { MapContext } from "./water-experiments/MapContext";
import preferredC from "../render/living-water/defaults.json" with { type: "json" };
import {
  bankClimates,
  bankStyle,
  type BankClimate,
  type BankMaterial,
} from "./water-experiments/banks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Preview } from "./water-experiments/Preview";
import {
  defaults,
  beachExtent,
  palettes,
  light,
  type Settings,
  type System,
  type WaterKind,
} from "./water-experiments/model";
import "./water-experiments.css";

const systems: { id: System; title: string; description: string }[] = [
  {
    id: "current",
    title: "A / Current",
    description:
      "Production depth raster, motif atlas and shoreline animation. Original climate colors; no new intensity, fish or reflection effects.",
  },
  {
    id: "tiles",
    title: "B / Pixel tides",
    description:
      "Moving, interlocking pixel colors: luminous turquoise to saturated cobalt. Directional clusters, broken ripples and lapping foam.",
  },
  {
    id: "depth",
    title: "C / Living depths",
    description:
      "Refracted color forms and fine caustic networks over submerged stones, plants and fish. The water color itself moves.",
  },
];
function readSettings(): Settings {
  const q = new URLSearchParams(location.search),
    s = { ...defaults };
  if (["river", "pond", "lake", "coast"].includes(q.get("kind")!))
    s.kind = q.get("kind") as WaterKind;
  if (q.get("palette")! in palettes)
    s.palette = q.get("palette") as Settings["palette"];
  if (
    q.get("bankClimate") === "auto" ||
    Object.hasOwn(bankClimates, q.get("bankClimate") ?? "")
  )
    s.bankClimate = q.get("bankClimate") as BankClimate | "auto";
  if (
    ["auto", "sand", "mud", "clay", "snow", "pebbles"].includes(
      q.get("bankMaterial")!,
    )
  )
    s.bankMaterial = q.get("bankMaterial") as BankMaterial;
  for (const key of [
    "bankDryColor",
    "bankWetColor",
    "bankContactColor",
  ] as const)
    if (/^#[0-9a-f]{6}$/i.test(q.get(key) ?? "")) s[key] = q.get(key)!;
  for (const [key, min, max] of [
    ["bankTintOpacity", 0, 1],
    ["wetEdgeOpacity", 0, 1],
    ["bankGradientSteps", 2, 8],
    ["wetEdgeWidth", 0, 0.6],
    ["bankLapping", 0, 1],
    ["beachWidth", 0, 3],
    ["altitudeLevels", 2, 8],
    ["foamOpacity", 0, 1],
    ["foamWidth", 0, 1],
    ["foamBreakup", 0, 1],
    ["rippleAmount", 0, 1],
    ["rocks", 0, 24],
    ["plants", 0, 45],
    ["rockSize", 0.5, 1.8],
    ["bankHeight", 0, 22],
    ["bankCover", 0, 1],
    ["boundaryDarkness", 0, 1],
    ["boundaryOpacity", 0, 1],
    ["roughness", 0, 2],
    ["strength", 0, 3],
    ["direction", 0, 360],
    ["hour", 0, 23],
    ["clarity", 0, 1],
    ["speed", 0.25, 2],
  ] as const) {
    const value = Number(q.get(key));
    if (q.has(key) && Number.isFinite(value))
      s[key] = Math.min(max, Math.max(min, value));
  }
  if (["auto", "reeds", "lilies", "seaweed"].includes(q.get("plantType")!))
    s.plantType = q.get("plantType") as Settings["plantType"];
  if (/^#[0-9a-f]{6}$/i.test(q.get("boundaryColor") ?? ""))
    s.boundaryColor = q.get("boundaryColor")!;
  for (const key of [
    "fish",
    "glitters",
    "paused",
    "autoBeach",
    "customBankColors",
    "bankGradient",
    "surfaceRipples",
  ] as const)
    if (q.has(key)) s[key] = q.get(key) === "true";
  return s;
}
export function WaterExperiments() {
  const [settings, setSettings] = useState(readSettings),
    [view, setView] = useState<System | "compare">("depth");
  const [mapContext, setMapContext] = useState(
    new URLSearchParams(location.search).has("context"),
  );
  const [copied, setCopied] = useState(false);
  const clock = useMemo(() => ({ time: 0 }), []),
    latest = useRef(settings);
  latest.current = settings;
  useEffect(() => {
    let request = 0,
      last = performance.now();
    const tick = (now: number) => {
      if (!latest.current.paused)
        clock.time += Math.min(0.1, (now - last) / 1000) * latest.current.speed;
      last = now;
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [clock]);
  useEffect(() => {
    history.replaceState(
      null,
      "",
      "?" +
        new URLSearchParams([
          ...Object.entries(settings).map(([k, v]) => [k, String(v)]),
          ...(mapContext ? [["context", "map"]] : []),
        ]),
    );
  }, [settings, mapContext]);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));
  if (mapContext) return <MapContext onBack={() => setMapContext(false)} />;
  return (
    <main className="water-lab">
      <header>
        <div>
          <a href="/">← Universal History Simulator</a>
          <p className="water-eyebrow">RENDERING WORKSHOP / 01</p>
          <h1>Water experiments</h1>
          <p>
            One shoreline. Three interpretations. Find the water worth getting
            lost in.
          </p>
        </div>
        <span className="water-badge">DEV PROTOTYPES</span>
      </header>
      <button onClick={() => setMapContext(true)} style={{ marginBottom: 20 }}>
        Shoreline in a real map ↗
      </button>
      <section className="water-controls" aria-label="Water controls">
        <label>
          Water type
          <select
            value={settings.kind}
            onChange={(e) => change("kind", e.target.value as WaterKind)}
          >
            {["coast", "river", "lake", "pond"].map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Climate / colorway
          <select
            value={settings.palette}
            onChange={(e) =>
              change("palette", e.target.value as Settings["palette"])
            }
          >
            {Object.entries(palettes).map(([k, p]) => (
              <option key={k} value={k}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Wave intensity
          <select
            value={settings.strength}
            onChange={(e) => change("strength", Number(e.target.value))}
          >
            {["Still", "Gentle", "Choppy", "Storm"].map((v, i) => (
              <option value={i} key={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Flow direction
          <select
            value={settings.direction}
            onChange={(e) => change("direction", Number(e.target.value))}
          >
            {[
              [0, "East →"],
              [90, "South ↓"],
              [180, "West ←"],
              [270, "North ↑"],
            ].map(([v, name]) => (
              <option value={v} key={v}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Time · {settings.hour}:00 · {light(settings).label}
          <input
            aria-label="Time of day"
            type="range"
            min="0"
            max="23"
            step="1"
            value={settings.hour}
            onChange={(e) => change("hour", Number(e.target.value))}
          />
        </label>
        <label>
          Transparency · {Math.round(settings.clarity * 100)}% (C)
          <input
            aria-label="Transparency"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.clarity}
            onChange={(e) => change("clarity", Number(e.target.value))}
          />
        </label>
        <label>
          Animation speed
          <select
            value={settings.speed}
            onChange={(e) => change("speed", Number(e.target.value))}
          >
            {[0.25, 0.5, 1, 2].map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["bankTintOpacity", "Bank tint opacity", 0, 1, 0.05],
            ["wetEdgeOpacity", "Wet edge opacity", 0, 1, 0.05],
            ["bankGradientSteps", "Gradient color steps", 2, 8, 1],
            ["wetEdgeWidth", "Wet bank edge width", 0, 0.6, 0.02],
            ["bankLapping", "Bank lapping", 0, 1, 0.05],
            ["beachWidth", "Beach width", 0, 3, 0.1],
            ["altitudeLevels", "Map altitude levels", 2, 8, 1],
            ["foamOpacity", "White wave opacity", 0, 1, 0.05],
            ["foamWidth", "White wave thickness", 0, 1, 0.05],
            ["foamBreakup", "White wave breakup", 0, 1, 0.05],
            ["rippleAmount", "Extra ripple density", 0, 1, 0.05],
            ["rocks", "Rocks", 0, 24, 1],
            ["rockSize", "Rock size", 0.5, 1.8, 0.1],
            ["plants", "Plant clusters", 0, 45, 1],
            ["bankHeight", "Bank height", 0, 22, 1],
            ["bankCover", "Bank vegetation", 0, 1, 0.05],
            ["boundaryDarkness", "Boundary darkness", 0, 1, 0.05],
            ["boundaryOpacity", "Boundary opacity", 0, 1, 0.05],
            ["roughness", "Shoreline roughness", 0, 2, 0.1],
          ] as const
        ).map(([key, label, min, max, step]) => (
          <label key={key}>
            {label} · {settings[key]}
            <input
              aria-label={label}
              disabled={key === "beachWidth" && settings.autoBeach}
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key]}
              onChange={(e) => change(key, Number(e.target.value))}
            />
          </label>
        ))}
        <label>
          Bank colorway
          <select
            aria-label="Bank colorway"
            value=""
            onChange={(e) => {
              const choices: Record<
                string,
                [BankMaterial, string, string, string]
              > = {
                sand: ["sand", "#edcc8d", "#c4a26d", "#97805b"],
                red: ["clay", "#d39b70", "#ac7050", "#82523f"],
                gray: ["pebbles", "#c5c3b7", "#959d96", "#677e7d"],
                snow: ["snow", "#edf4ed", "#c2d6d7", "#90acba"],
              };
              const [
                bankMaterial,
                bankDryColor,
                bankWetColor,
                bankContactColor,
              ] = choices[e.target.value];
              setSettings((s) => ({
                ...s,
                bankMaterial,
                bankDryColor,
                bankWetColor,
                bankContactColor,
                customBankColors: true,
              }));
            }}
          >
            <option value="" disabled>
              Choose a colorway…
            </option>
            <option value="sand">Warm golden sand</option>
            <option value="red">Warm red stone / clay</option>
            <option value="gray">Gray pebbles</option>
            <option value="snow">Snow & slush</option>
          </select>
        </label>
        {(
          [
            ["bankDryColor", "Bank surface color", "dry"],
            ["bankWetColor", "Wet edge color", "wet"],
            ["bankContactColor", "Water contact color", "contact"],
          ] as const
        ).map(([key, label, tone]) => (
          <label key={key}>
            {label}
            <input
              aria-label={label}
              type="color"
              value={
                settings.customBankColors
                  ? settings[key]
                  : bankStyle(settings)[tone]
              }
              onChange={(e) => {
                const style = bankStyle(settings);
                setSettings((s) => ({
                  ...s,
                  bankDryColor: style.dry,
                  bankWetColor: style.wet,
                  bankContactColor: style.contact,
                  customBankColors: true,
                  [key]: e.target.value,
                }));
              }}
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={settings.bankGradient}
            onChange={(e) => change("bankGradient", e.target.checked)}
          />
          Stepped bank gradient
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.customBankColors}
            onChange={(e) => change("customBankColors", e.target.checked)}
          />
          Custom bank colors
        </label>
        <label>
          Bank climate
          <select
            aria-label="Bank climate"
            value={settings.bankClimate}
            onChange={(e) =>
              change("bankClimate", e.target.value as Settings["bankClimate"])
            }
          >
            <option value="auto">Follow water climate</option>
            {Object.entries(bankClimates).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bank material
          <select
            aria-label="Bank material"
            value={settings.bankMaterial}
            onChange={(e) =>
              change("bankMaterial", e.target.value as BankMaterial)
            }
          >
            {["auto", "sand", "mud", "clay", "snow", "pebbles"].map((k) => (
              <option key={k} value={k}>
                {k === "auto" ? "By habitat" : k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bank boundary color
          <input
            aria-label="Bank boundary color"
            type="color"
            value={settings.boundaryColor}
            onChange={(e) => change("boundaryColor", e.target.value)}
          />
        </label>
        <label>
          Boundary color preset
          <select
            aria-label="Boundary color preset"
            value=""
            onChange={(e) => change("boundaryColor", e.target.value)}
          >
            <option value="" disabled>
              Choose a color…
            </option>
            <option value="#594329">Original dark earth</option>
            <option value="#a08b60">Soft warm earth</option>
            <option value="#c4b585">Sandy edge</option>
            <option value="#758071">Cool grey earth</option>
          </select>
        </label>
        <label>
          Plant type
          <select
            value={settings.plantType}
            onChange={(e) =>
              change("plantType", e.target.value as Settings["plantType"])
            }
          >
            <option value="auto">Habitat mix</option>
            <option value="reeds">Reeds & cattails</option>
            <option value="lilies">Water lilies</option>
            <option value="seaweed">Seaweed</option>
          </select>
          <small>
            Coasts always use seaweed. Counts are limited by available space.
            Scenery applies to B/C.
          </small>
        </label>
        <div className="water-checks">
          <label>
            <input
              type="checkbox"
              checked={settings.autoBeach}
              onChange={(e) => change("autoBeach", e.target.checked)}
            />
            Automatic beach from altitude levels
          </label>
          <small>
            Effective beach: {beachExtent(settings).toFixed(1)} tiles. Auto: 2
            levels → broad beach; 8 → cliff edge. A map-art preview rule, not
            yet connected to playable maps.
          </small>
          <label>
            <input
              type="checkbox"
              checked={settings.surfaceRipples}
              onChange={(e) => change("surfaceRipples", e.target.checked)}
            />
            Extra surface ripples (C)
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.fish}
              onChange={(e) => change("fish", e.target.checked)}
            />
            Fish & pond splashes
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.glitters}
              onChange={(e) => change("glitters", e.target.checked)}
            />
            Reflective glitters
          </label>
        </div>
      </section>
      <nav className="water-toolbar" aria-label="Comparison view">
        <div>
          {(
            [{ id: "compare", title: "Compare A / B / C" }, ...systems] as const
          ).map((s) => (
            <button
              key={s.id}
              aria-pressed={view === s.id}
              onClick={() => setView(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div>
          <button
            onClick={() => {
              const preset = {
                schema: "uhs-water-study",
                version: 1,
                rendererRevision: 7,
                view,
                selectedRenderer: view === "compare" ? null : view,
                settings,
                animationTimeSeconds: clock.time,
                sourceUrl: location.href,
              };
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(preset, null, 2) + "\n"], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = `water-study-${settings.kind}-${view}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Save settings JSON
          </button>
          <button
            onClick={() => {
              setSettings({ ...defaults, ...preferredC.settings } as Settings);
              setView("depth");
              clock.time = preferredC.animationTimeSeconds;
            }}
          >
            Load preferred C
          </button>
          <button onClick={() => change("paused", !settings.paused)}>
            {settings.paused ? "Resume animation" : "Pause animation"}
          </button>
          <button
            onClick={() => {
              setSettings({ ...defaults });
              clock.time = 0;
            }}
          >
            Reset
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Link copied" : "Copy study link"}
          </button>
        </div>
      </nav>
      <section
        className={`water-studies ${view === "compare" ? "" : "water-focus"}`}
      >
        {systems
          .filter((s) => view === "compare" || s.id === view)
          .map((s) => (
            <article key={s.id}>
              <div className="water-card-title">
                <h2>{s.title}</h2>
                <span>{s.id === "current" ? "BASELINE" : "EXPERIMENT"}</span>
              </div>
              <Preview settings={settings} system={s.id} clock={clock} />
              <p>{s.description}</p>
              {view === "compare" && (
                <button className="water-enlarge" onClick={() => setView(s.id)}>
                  Inspect at larger scale ↗
                </button>
              )}
            </article>
          ))}
      </section>
      <footer>
        <div className="water-swatches">
          {palettes[settings.palette].colors.map((c) => (
            <span key={c} style={{ background: c }} title={c} />
          ))}
          <span>{palettes[settings.palette].label}</span>
        </div>
        <p>
          Shared synthetic terrain fixture, 384 × 256 native pixels. River flow
          follows the arrow; coastal waves approach the shore. Pond and lake
          motion is scaled down. Storm spray appears on coasts.
        </p>
        <p>
          A runs the existing game water code and climate mapping. New wave,
          transparency, fish, speed and glitter controls apply to B/C where
          supported. Lighting uses the game’s shadow-time presets. These studies
          do not change playable worlds; full-world performance remains to be
          measured.
        </p>
      </footer>
    </main>
  );
}
