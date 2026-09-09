import { useEffect, useMemo, useRef, useState } from "react";
import religious from "../content/graphics/religious.json" with { type: "json" };
import "./building-lab.css";

type Frame = { frame: { x: number; y: number; w: number; h: number } };
type Model = {
  frame: string;
  label: string;
  footprint: [number, number];
  entrance: [number, number];
  anchor: [number, number];
  height: number;
  description: string;
  religious?: boolean;
  family?: string;
};
type Recipe = Record<string, string | number | boolean | number[] | object>;
const facings = ["south", "north", "east", "west"] as const;
const backgrounds: Record<string, string> = {
  Grass: "#85965a",
  Sand: "#d6c8a2",
  Paving: "#b6b19c",
  Slate: "#343e43",
};

async function loadJSON<T>(path: string, v: number): Promise<T> {
  const r = await fetch(`${path}?v=${v}`);
  if (!r.ok) throw Error(`${path}: ${r.status}`);
  return r.json();
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(Error(`Cannot load ${src}`));
    img.src = src;
  });
}

/** A nested recipe section (scales, looks) edited as JSON; invalid text is
 * held locally and not written until it parses. */
function JsonField({
  value,
  onChange,
}: {
  value: object;
  onChange: (v: object) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 1));
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setText(JSON.stringify(value, null, 1));
    setBad(false);
  }, [value]);
  return (
    <textarea
      className={bad ? "bad" : ""}
      rows={Math.min(14, text.split("\n").length)}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        try {
          onChange(JSON.parse(e.target.value));
          setBad(false);
        } catch {
          setBad(true);
        }
      }}
    />
  );
}

/** Browse every compiled building, see it on its footprint, and edit the
 * recipe behind the religious ones. Rebuild runs the art pipeline through
 * the dev server and reloads the atlas. */
export function BuildingLab() {
  const [version, setVersion] = useState(0);
  const [models, setModels] = useState<Record<string, Model>>({});
  const [frames, setFrames] = useState<Record<string, Frame>>({});
  const [atlas, setAtlas] = useState<HTMLImageElement>();
  const [selected, setSelected] = useState("religious-romanesque-chapel");
  const [facing, setFacing] = useState<(typeof facings)[number]>("south");
  const [scale, setScale] = useState(3);
  const [background, setBackground] = useState("Grass");
  const [filter, setFilter] = useState("");
  const [recipes, setRecipes] = useState<Record<string, Recipe>>(
    religious.buildings as Record<string, Recipe>,
  );
  const [materials] = useState(religious.materials);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadJSON<Record<string, Model>>("/packs/buildings.json", version),
      loadJSON<{ frames: Record<string, Frame> }>("/packs/atlas.json", version),
      loadImage(`/packs/atlas.png?v=${version}`),
    ])
      .then(([m, a, img]) => {
        if (cancelled) return;
        setModels(m);
        setFrames(a.frames);
        setAtlas(img);
      })
      .catch((e) => setStatus(String(e)));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const bases = useMemo(() => {
    const ids = Object.keys(models).filter(
      (k) => !/-(north|east|west)$/.test(k),
    );
    const rank = (k: string) =>
      k.startsWith("religious-")
        ? 0
        : /-urban-(hall|colonnade)/.test(k)
          ? 1
          : k.includes("-urban-")
            ? 2
            : 3;
    return ids
      .filter(
        (k) =>
          !filter ||
          k.includes(filter) ||
          models[k].label.toLowerCase().includes(filter.toLowerCase()),
      )
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [models, filter]);

  const frameKey = facing === "south" ? selected : `${selected}-${facing}`;
  const model = models[frameKey] ?? models[selected];
  const recipeId =
    (models[selected] as Model & { recipe?: string })?.recipe ?? "";
  const recipe = recipeId ? recipes[recipeId] : undefined;

  useEffect(() => {
    const c = canvas.current;
    if (!c || !atlas || !model || !frames[frameKey]) return;
    const f = frames[frameKey].frame;
    const [fw, fh] = model.footprint;
    const pad = 32;
    const w = Math.max(fw * 16, f.w) + pad * 2,
      h = Math.max(f.h, fh * 16) + pad * 2;
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = backgrounds[background];
    ctx.fillRect(0, 0, w, h);
    // Footprint grid: the cells the building occupies, entrance marked.
    const ox = pad + (w - pad * 2 - fw * 16) / 2,
      oy = h - pad - fh * 16;
    ctx.fillStyle = "#0002";
    ctx.fillRect(ox, oy, fw * 16, fh * 16);
    ctx.strokeStyle = "#0004";
    ctx.lineWidth = 1 / scale;
    for (let x = 0; x <= fw; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * 16, oy);
      ctx.lineTo(ox + x * 16, oy + fh * 16);
      ctx.stroke();
    }
    for (let y = 0; y <= fh; y++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + y * 16);
      ctx.lineTo(ox + fw * 16, oy + y * 16);
      ctx.stroke();
    }
    const [ex, ey] = model.entrance;
    ctx.fillStyle = "#e0b44c88";
    ctx.fillRect(ox + ex * 16, oy + ey * 16, 16, 16);
    // The sprite's anchor sits at the footprint's bottom centre.
    const ax = ox + (fw * 16) / 2 - model.anchor[0],
      ay = oy + fh * 16 - model.anchor[1];
    ctx.drawImage(
      atlas,
      f.x,
      f.y,
      f.w,
      f.h,
      Math.round(ax),
      Math.round(ay),
      f.w,
      f.h,
    );
  }, [atlas, frames, model, frameKey, scale, background]);

  const setField = (key: string, value: Recipe[string]) =>
    setRecipes((r) => ({ ...r, [recipeId]: { ...r[recipeId], [key]: value } }));

  const rebuild = async () => {
    setBusy(true);
    setStatus("Rebuilding art (about 20 s)…");
    try {
      const r = await fetch("/api/art", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: "src/content/graphics/religious.json",
          content:
            JSON.stringify({ materials, buildings: recipes }, null, 2) + "\n",
        }),
      });
      const out = await r.json();
      setStatus(
        out.ok
          ? out.output.trim().split("\n").slice(-1)[0]
          : `Failed: ${out.error}\n${out.output ?? ""}`,
      );
      if (out.ok) setVersion((v) => v + 1);
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="building-lab">
      <header>
        <div>
          <h1>Building panel</h1>
          <p>
            Compiled building models on their footprints. Religious recipes are
            editable; rebuild writes the recipe and recompiles the art.
          </p>
        </div>
        <a href="/">Return to world ↗</a>
      </header>
      <div className="building-body">
        <aside>
          <input
            placeholder="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <ul>
            {bases.map((id) => (
              <li key={id}>
                <button
                  className={id === selected ? "on" : ""}
                  onClick={() => setSelected(id)}
                >
                  <span>{models[id].label}</span>
                  <small>{id.replace(/^religious-/, "")}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main>
          <div className="building-controls">
            {facings.map((f) => (
              <button
                key={f}
                className={f === facing ? "on" : ""}
                onClick={() => setFacing(f)}
              >
                {f}
              </button>
            ))}
            <label>
              Zoom{" "}
              <input
                type="range"
                min={1}
                max={6}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />{" "}
              {scale}×
            </label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            >
              {Object.keys(backgrounds).map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="building-stage">
            <canvas ref={canvas} />
          </div>
          {model && (
            <p className="building-meta">
              <b>{model.label}</b> · footprint {model.footprint[0]}×
              {model.footprint[1]} · entrance {model.entrance.join(",")} ·
              height {model.height}px{model.family ? ` · ${model.family}` : ""}
              <br />
              <span>{model.description}</span>
            </p>
          )}
        </main>
        <section className="building-recipe">
          {recipe ? (
            <>
              <h2>Recipe · {recipeId}</h2>
              {Object.entries(recipe).map(([key, value]) => (
                <label key={key}>
                  <span>{key}</span>
                  {typeof value === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setField(key, e.target.checked)}
                    />
                  ) : typeof value === "number" ? (
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setField(key, Number(e.target.value))}
                    />
                  ) : typeof value === "object" && !Array.isArray(value) ? (
                    <JsonField
                      value={value}
                      onChange={(v) => setField(key, v)}
                    />
                  ) : Array.isArray(value) ? (
                    <span className="pair">
                      {value.map((n, i) => (
                        <input
                          key={i}
                          type="number"
                          min={key === "footprint" ? 3 : -1}
                          max={14}
                          value={n}
                          onChange={(e) => {
                            const next = [...value];
                            next[i] = Math.max(
                              key === "footprint" ? 3 : -1,
                              Math.min(14, Number(e.target.value) || 0),
                            );
                            setField(key, next);
                          }}
                        />
                      ))}
                      <small>
                        {key === "footprint" ? "w × d, max 14" : "x, y"}
                      </small>
                    </span>
                  ) : key === "wall" ? (
                    <select
                      value={value}
                      onChange={(e) => setField(key, e.target.value)}
                    >
                      {Object.keys(materials).map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  ) : key === "roofMaterial" ? (
                    <select
                      value={value}
                      onChange={(e) => setField(key, e.target.value)}
                    >
                      {[
                        "slate",
                        "terracotta",
                        "grey-tile",
                        "shingle",
                        "thatch",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  ) : key === "tower" ? (
                    <select
                      value={value}
                      onChange={(e) => setField(key, e.target.value)}
                    >
                      {["west", "east", "none"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  ) : key === "towerRoof" ? (
                    <select
                      value={value}
                      onChange={(e) => setField(key, e.target.value)}
                    >
                      {["pyramid", "saddle"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={String(value)}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  )}
                </label>
              ))}
              <button className="rebuild" disabled={busy} onClick={rebuild}>
                {busy ? "Rebuilding…" : "Rebuild art"}
              </button>
              <pre>{status}</pre>
            </>
          ) : (
            <p className="building-hint">
              House and civic models are compiled from{" "}
              <code>buildings.json</code> and <code>urban.json</code>; only
              religious recipes are editable here for now.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
