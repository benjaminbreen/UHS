import { useEffect, useRef, useState } from "react";
import {
  defaultGroundStyle,
  groundMaterials,
  neutralLayer,
  swatchCount,
  type GroundMaterial,
  type GroundStyle,
  type LayerStyle,
} from "../../render/ground-style";
import { restyleTerrain, setTerrainReach } from "../../render/terrain-stream";
import "./ground-style-panel.css";

const LAYER_FIELDS: {
  key: keyof LayerStyle;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "swatch",
    label: "GRASS+ swatch (−1 none)",
    min: -1,
    max: swatchCount - 1,
    step: 1,
  },
  { key: "opacity", label: "Swatch opacity", min: 0, max: 1, step: 0.05 },
  { key: "contrast", label: "Contrast", min: 0.3, max: 2, step: 0.05 },
  { key: "brightness", label: "Brightness", min: 0.5, max: 1.5, step: 0.02 },
  { key: "saturation", label: "Saturation", min: 0, max: 2, step: 0.05 },
];

const CONTOUR_FIELDS: {
  key: keyof GroundStyle["contour"];
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "wobble", label: "Contour wobble", min: 0, max: 1.2, step: 0.05 },
  { key: "scale", label: "Wobble scale", min: 1, max: 20, step: 1 },
  { key: "smoothing", label: "Contour smoothing", min: 0, max: 4, step: 1 },
  { key: "sides", label: "Side rim (px)", min: 0, max: 4, step: 1 },
];

const BANK_FIELDS: {
  key: keyof GroundStyle["bank"];
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "lip", label: "Grass lip (px)", min: 0, max: 8, step: 1 },
  { key: "fringe", label: "Overhanging fringe", min: 0, max: 1, step: 0.05 },
  { key: "strata", label: "Strata", min: 0, max: 2, step: 0.05 },
  { key: "lobes", label: "Earth lobes", min: 0, max: 1.5, step: 0.05 },
  { key: "roots", label: "Roots & stones", min: 0, max: 0.3, step: 0.01 },
  { key: "shadow", label: "Cast shadow (px)", min: 0, max: 10, step: 1 },
  {
    key: "brightness",
    label: "Earth brightness",
    min: 0.5,
    max: 1.5,
    step: 0.02,
  },
  { key: "contrast", label: "Earth contrast", min: 0.3, max: 2, step: 0.05 },
];

const TIERS = [0, 1, 2, 3];

export function GroundStylePanel({
  onRestyle,
}: {
  /** Scenes that draw once (the fixed studies) need an explicit rebuild. */
  onRestyle?: () => void;
} = {}) {
  const [on, setOn] = useState(false);
  const [style, setStyle] = useState<GroundStyle>(defaultGroundStyle);
  const [material, setMaterial] = useState<GroundMaterial>("turf");
  const [tier, setTier] = useState(0);
  const [open, setOpen] = useState(true);
  const [note, setNote] = useState("");
  const [reach, setReach] = useState(16);
  const timer = useRef<number>(0);
  const touched = useRef(false);

  // Restyling re-rasterises every visible chunk, so coalesce slider drags
  // rather than rebuilding the terrain on every input event.
  useEffect(() => {
    if (!on && !touched.current) return;
    touched.current = true;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      restyleTerrain(on ? style : null);
      onRestyle?.();
    }, 300);
    return () => clearTimeout(timer.current);
  }, [on, style, onRestyle]);
  useEffect(() => {
    setTerrainReach(reach);
  }, [reach]);
  useEffect(() => {
    // Lab-only hook so review scripts can load a style without clicking.
    Object.assign(window, { groundStyleLab: { apply: setStyle } });
    return () => {
      if (touched.current) restyleTerrain(null);
      delete (window as unknown as { groundStyleLab?: unknown }).groundStyleLab;
    };
  }, []);

  const setLayer = (key: keyof LayerStyle, value: number) =>
    setStyle((s) => ({
      ...s,
      materials: {
        ...s.materials,
        [material]: { ...s.materials[material], [key]: value },
      },
    }));
  const setOverride = (key: keyof LayerStyle, value: number | undefined) =>
    setStyle((s) => {
      const next = { ...(s.tiers[tier] ?? {}) };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return { ...s, tiers: s.tiers.map((t, i) => (i === tier ? next : t)) };
    });

  const exportJson = async () => {
    const text = JSON.stringify(style, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNote("Copied to clipboard");
    } catch {
      setNote("Clipboard blocked — see console");
      console.log(text);
    }
    setTimeout(() => setNote(""), 2400);
  };
  const importJson = () => {
    const text = prompt("Paste a ground style JSON");
    if (!text) return;
    try {
      setStyle(JSON.parse(text) as GroundStyle);
      setNote("Loaded");
    } catch {
      setNote("Could not parse that JSON");
    }
    setTimeout(() => setNote(""), 2400);
  };

  const layer = style.materials[material];
  const override = style.tiers[tier] ?? {};

  return (
    <aside className={`gsp${open ? "" : " shut"}`}>
      <header>
        <button className="gsp-fold" onClick={() => setOpen((v) => !v)}>
          {open ? "−" : "+"}
        </button>
        <h2>Ground style</h2>
        <label className="gsp-ab">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
          />
          {on ? "New" : "Current"}
        </label>
      </header>
      {open && (
        <div className="gsp-body">
          <p className="gsp-note">
            The toggle A/Bs the live terrain: off is the shipped renderer, on
            re-rasterises every visible chunk through these settings.
          </p>

          <h3>Material</h3>
          <div className="gsp-tabs">
            {groundMaterials.map((m) => (
              <button
                key={m}
                className={m === material ? "on" : ""}
                onClick={() => setMaterial(m)}
              >
                {m}
              </button>
            ))}
          </div>
          {LAYER_FIELDS.map((f) => (
            <Slider
              key={f.key}
              label={f.label}
              min={f.min}
              max={f.max}
              step={f.step}
              value={layer[f.key] as number}
              onChange={(v) => setLayer(f.key, v)}
            />
          ))}
          <button
            className="gsp-reset"
            onClick={() =>
              setStyle((s) => ({
                ...s,
                materials: { ...s.materials, [material]: { ...neutralLayer } },
              }))
            }
          >
            Reset {material}
          </button>

          <h3>Altitude override</h3>
          <div className="gsp-tabs">
            {TIERS.map((t) => (
              <button
                key={t}
                className={t === tier ? "on" : ""}
                onClick={() => setTier(t)}
              >
                Tier {t}
                {Object.keys(style.tiers[t] ?? {}).length ? " •" : ""}
              </button>
            ))}
          </div>
          <p className="gsp-note">
            Unticked fields inherit from the material. Ticked ones apply to
            every material at this height.
          </p>
          {LAYER_FIELDS.map((f) => {
            const set = f.key in override;
            return (
              <div key={f.key} className="gsp-override">
                <label className="gsp-check">
                  <input
                    type="checkbox"
                    checked={set}
                    onChange={(e) =>
                      setOverride(
                        f.key,
                        e.target.checked ? (layer[f.key] as number) : undefined,
                      )
                    }
                  />
                  {f.label}
                </label>
                <Slider
                  label=""
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={
                    (override[f.key] as number) ?? (layer[f.key] as number)
                  }
                  disabled={!set}
                  onChange={(v) => setOverride(f.key, v)}
                />
              </div>
            );
          })}

          <h3>Contour</h3>
          <p className="gsp-note">
            Height is read per pixel and clamped up to each cell's own tier, so
            the edge curves through a tile without moving the walkable grid.
          </p>
          {CONTOUR_FIELDS.map((f) => (
            <Slider
              key={f.key}
              label={f.label}
              min={f.min}
              max={f.max}
              step={f.step}
              value={style.contour[f.key]}
              onChange={(v) =>
                setStyle((s) => ({
                  ...s,
                  contour: { ...s.contour, [f.key]: v },
                }))
              }
            />
          ))}

          <h3>Bank of earth</h3>
          {BANK_FIELDS.map((f) => (
            <Slider
              key={f.key}
              label={f.label}
              min={f.min}
              max={f.max}
              step={f.step}
              value={style.bank[f.key] as number}
              onChange={(v) =>
                setStyle((s) => ({ ...s, bank: { ...s.bank, [f.key]: v } }))
              }
            />
          ))}
          <label className="gsp-check">
            <input
              type="checkbox"
              checked={style.bank.outline}
              onChange={(e) =>
                setStyle((s) => ({
                  ...s,
                  bank: { ...s.bank, outline: e.target.checked },
                }))
              }
            />
            Crease under the lip
          </label>

          <h3>Preview cost</h3>
          <Slider
            label="Stream reach (cells, 0 = full)"
            value={reach}
            min={0}
            max={40}
            step={2}
            onChange={setReach}
          />

          <div className="gsp-actions">
            <button onClick={exportJson}>Copy JSON</button>
            <button onClick={importJson}>Paste JSON</button>
            <button onClick={() => setStyle(defaultGroundStyle())}>
              Reset
            </button>
          </div>
          {note && <p className="gsp-note">{note}</p>}
        </div>
      )}
    </aside>
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
    <label className={`gsp-slider${disabled ? " off" : ""}`}>
      {label && (
        <span>
          {label}
          <em>{step < 1 ? value.toFixed(2) : value}</em>
        </span>
      )}
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
