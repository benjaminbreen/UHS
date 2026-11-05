import { useEffect, useState } from "react";
import { ProceduralLab } from "./terrain/ProceduralLab";
import { groundKits } from "../content/graphics/ground-kits";
import type { GroundKit } from "../render/ground-kit";
import { defaultGroundStyle, groundStyle } from "../render/ground-style";
import { restyleTerrain } from "../render/terrain-stream";
import "./terrain-lab.css";
import "./terrain-kits.css";

// Slider ranges by field name; kits share names so one table covers them all.
const ranges: Record<string, [number, number, number]> = {
  grain: [0, 1, 0.01],
  grainSize: [1, 3, 1],
  coverage: [0, 1, 0.01],
  scale: [4, 120, 1],
  blade: [0, 8, 1],
  shadeDepth: [0, 4, 1],
  shadowAlpha: [0, 1, 0.01],
  density: [0, 1, 0.01],
  spacing: [6, 40, 1],
  colony: [0, 1, 0.01],
  colonyScale: [10, 200, 1],
  weight: [0, 1, 0.01],
  blades: [1, 11, 1],
  height: [1, 16, 1],
  spread: [0, 6, 0.25],
  curl: [0, 1, 0.01],
  stalk: [0, 1, 0.01],
  cluster: [1, 8, 1],
  wear: [0, 2, 0.05],
};

// Saved tuning laid over the shipped kit, so fields added since still appear.
const merge = (base: any, saved: any): any =>
  saved === undefined || typeof base !== "object" || Array.isArray(base)
    ? saved ?? base
    : Object.fromEntries(Object.keys(base).map((k) => [k, merge(base[k], saved[k])]));
const stored = (kit: GroundKit): GroundKit => {
  try {
    const raw = localStorage.getItem(`uhs-terrain-kit-${kit.id}`);
    return raw ? merge(kit, JSON.parse(raw)) : kit;
  } catch {
    return kit;
  }
};
const store = (kit: GroundKit) => {
  try {
    localStorage.setItem(`uhs-terrain-kit-${kit.id}`, JSON.stringify(kit));
  } catch {
    /* private window */
  }
};

const setPath = (obj: unknown, path: (string | number)[], value: unknown): any => {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const copy: any = Array.isArray(obj) ? [...obj] : { ...(obj as object) };
  copy[head] = setPath((obj as any)[head], rest, value);
  return copy;
};

type Change = (path: (string | number)[], v: unknown) => void;
function Field({ name, value, path, onChange }: { name: string; value: unknown; path: (string | number)[]; onChange: Change }) {
  if (typeof value === "string" && value.startsWith("#"))
    return (
      <label className="tk-row">
        <span>{name}</span>
        <input type="color" value={value} onChange={(e) => onChange(path, e.target.value)} />
        <code>{value}</code>
      </label>
    );
  if (typeof value === "number") {
    // Season shifts are multipliers on the summer kit, whatever the field.
    const [min, max, step] = path[0] === "seasons" ? [0, 2, 0.05] : ranges[name] ?? [0, Math.max(1, value * 2), 0.01];
    return (
      <label className="tk-row">
        <span>{name}</span>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
        <code>{value}</code>
      </label>
    );
  }
  if (Array.isArray(value) && value.every((v) => typeof v === "string"))
    return (
      <div className="tk-row">
        <span>{name}</span>
        {value.map((v, i) => (
          <input key={i} type="color" value={v} onChange={(e) => onChange([...path, i], e.target.value)} />
        ))}
      </div>
    );
  if (value && typeof value === "object")
    return (
      <fieldset className="tk-group">
        <legend>{name}</legend>
        {Object.entries(value).map(([k, v]) => (
          <Field key={k} name={Array.isArray(value) ? `${name} ${Number(k) + 1}` : k} value={v} path={[...path, Array.isArray(value) ? Number(k) : k]} onChange={onChange} />
        ))}
      </fieldset>
    );
  return null;
}

function KitPanel() {
  const [kits, setKits] = useState(() => groundKits.map(stored));
  const [active, setActive] = useState(new URLSearchParams(location.search).get("kit") ?? groundKits[0].id);
  const [on, setOn] = useState(true);
  // Auto paints every kit where its biome matches; off forces the open kit everywhere.
  const [auto, setAuto] = useState(new URLSearchParams(location.search).get("kit") === null);
  const [status, setStatus] = useState("");
  const kit = kits.find((k) => k.id === active) ?? kits[0];

  // Edits re-rasterise every visible chunk, so slider drags are coalesced.
  useEffect(() => {
    const id = setTimeout(() => {
      const style = { ...(groundStyle() ?? defaultGroundStyle()) };
      if (on) style.kits = auto ? kits : [kit];
      else delete style.kits;
      restyleTerrain(style);
    }, 200);
    return () => clearTimeout(id);
  }, [kits, kit, on, auto]);
  useEffect(() => {
    const select = (id: string) => {
      setOn(id !== "shipped");
      setAuto(id === "auto");
      if (id !== "shipped" && id !== "auto") setActive(id);
    };
    Object.assign(window, { terrainKits: { select, ids: groundKits.map((k) => k.id) } });
  }, []);

  const update: Change = (path, value) =>
    setKits((all) =>
      all.map((k) => {
        if (k.id !== kit.id) return k;
        const next = setPath(k, path, value) as GroundKit;
        store(next);
        return next;
      }),
    );
  const replace = (next: GroundKit) => setKits((all) => all.map((k) => (k.id === next.id ? next : k)));
  return (
    <aside className="tk-panel">
      <header>
        <h2>Terrain kits</h2>
        <label>
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> kits on
        </label>
        <label>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> by biome
        </label>
      </header>
      <div className="tk-kits">
        {kits.map((k) => (
          <button key={k.id} className={k.id === kit.id ? "on" : ""} onClick={() => setActive(k.id)}>
            {k.name}
          </button>
        ))}
      </div>
      <p className="tk-note">{kit.note}</p>
      <div className="tk-actions">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(JSON.stringify(kit, null, 2));
            setStatus("Copied");
          }}
        >
          Copy JSON
        </button>
        <button
          onClick={() => {
            const raw = prompt("Paste kit JSON");
            if (!raw) return;
            try {
              const next = merge(groundKits.find((k) => k.id === kit.id), { ...JSON.parse(raw), id: kit.id });
              store(next);
              replace(next);
              setStatus("Imported");
            } catch {
              setStatus("Not valid JSON");
            }
          }}
        >
          Import
        </button>
        <button
          onClick={() => {
            try {
              localStorage.removeItem(`uhs-terrain-kit-${kit.id}`);
            } catch {
              /* ignore */
            }
            replace(groundKits.find((k) => k.id === kit.id)!);
          }}
        >
          Reset
        </button>
        <span>{status}</span>
      </div>
      {Object.entries(kit)
        .filter(([k]) => !["id", "name", "note"].includes(k))
        .map(([k, v]) => (
          <Field key={k} name={k} value={v} path={[k]} onChange={update} />
        ))}
    </aside>
  );
}

/** The procedural explorer's real world (tiers, banks, ramps, villages) with
 * its turf and paths painted from a kit. Not wired into play. */
export function TerrainKitsLab() {
  return <ProceduralLab route="/terrain-kits" panel={<KitPanel />} />;
}
