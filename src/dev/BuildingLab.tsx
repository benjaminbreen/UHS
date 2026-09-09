import { useEffect, useMemo, useRef, useState } from "react";
import graphics from "../content/graphics/buildings.json" with { type: "json" };
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
  candidate?: boolean;
  candidateType?: string;
  candidateGroup?: string;
  variant?: number;
  business?: string;
  sign?: string;
  animation?: {
    kind: string;
    xRatio: number;
    y: number;
    period?: number;
    phase?: number;
    chance?: number;
  };
};
type Recipe = Record<string, string | number | boolean | number[] | object>;
const facings = ["south", "north", "east", "west"] as const;
const backgrounds: Record<string, string> = {
  Grass: "#85965a",
  Sand: "#d6c8a2",
  Paving: "#b6b19c",
  Slate: "#343e43",
  Asphalt: "#343a3d",
  Concrete: "#a9ada5",
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
  const [selected, setSelected] = useState("candidate-modern-3x2-ranch-home");
  const [facing, setFacing] = useState<(typeof facings)[number]>("south");
  const [scale, setScale] = useState(3);
  const [background, setBackground] = useState("Grass");
  const [filter, setFilter] = useState("");
  const [recipes, setRecipes] = useState<Record<string, Recipe>>(
    religious.buildings as Record<string, Recipe>,
  );
  const [candidateRecipes, setCandidateRecipes] = useState<
    Record<string, Recipe>
  >(graphics.buildings as Record<string, Recipe>);
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
      models[k].candidate
        ? 0
        : k.startsWith("religious-")
          ? 1
        : /-urban-(hall|colonnade)/.test(k)
          ? 2
          : k.includes("-urban-")
            ? 3
            : 4;
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
  const candidateRecipe = model?.candidate ? candidateRecipes[selected] : undefined;

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
    const animation = model.animation;
    let phase = animation?.phase ?? 0;
    const draw = () => {
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
      if (animation?.kind === "roof-fan") {
        const fan = frames[`animation-roof-fan-${phase}`]?.frame;
        if (fan)
          ctx.drawImage(
            atlas,
            fan.x,
            fan.y,
            fan.w,
            fan.h,
            Math.round(ax + f.w * animation.xRatio - fan.w / 2),
            Math.round(ay + animation.y - fan.h / 2),
            fan.w,
            fan.h,
          );
      }
    };
    draw();
    if (animation?.kind !== "roof-fan") return;
    const timer = window.setInterval(() => {
      phase = (phase + 1) % 4;
      draw();
    }, Math.max(120, animation.period ?? 280));
    return () => window.clearInterval(timer);
  }, [atlas, frames, model, frameKey, scale, background]);

  const setField = (key: string, value: Recipe[string]) =>
    setRecipes((r) => ({ ...r, [recipeId]: { ...r[recipeId], [key]: value } }));
  const setCandidateField = (key: string, value: Recipe[string]) =>
    setCandidateRecipes((r) => ({
      ...r,
      [selected]: { ...r[selected], [key]: value },
    }));

  const rebuild = async () => {
    setBusy(true);
    setStatus("Rebuilding art (about 20 s)…");
    try {
      const candidate = Boolean(models[selected]?.candidate);
      const r = await fetch("/api/art", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: candidate
            ? "src/content/graphics/buildings.json"
            : "src/content/graphics/religious.json",
          content:
            JSON.stringify(
              candidate
                ? { materials: graphics.materials, buildings: candidateRecipes }
                : { materials, buildings: recipes },
              null,
              2,
            ) + "\n",
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
            Compiled building models on their footprints. The review-only
            modern infill candidates are listed first; their recipes drive
            compact facades, colorways and business signage.
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
                  <small>
                    {models[id].candidate
                      ? `${models[id].candidateGroup ?? "candidate"}${models[id].sign ? ` · ${models[id].sign}` : ""}`
                      : id.replace(/^religious-/, "")}
                  </small>
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
              {model.candidate
                ? ` · ${model.candidateType ?? "infill"} · variant ${model.variant ?? 0}${model.sign ? ` · sign ${model.sign}` : ""}`
                : ""}
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
          ) : model?.candidate ? (
            <div className="candidate-card">
              <span className="candidate-badge">Review-only candidate</span>
              <h2>Procedural feature recipe</h2>
              {candidateRecipe && (
                <div className="candidate-controls">
                  <label>
                    <span>Colorway (0–5)</span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={Number(candidateRecipe.variant ?? 0)}
                      onChange={(e) =>
                        setCandidateField(
                          "variant",
                          Math.max(0, Math.min(5, Number(e.target.value) || 0)),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Business type</span>
                    <input
                      value={String(candidateRecipe.business ?? "")}
                      onChange={(e) =>
                        setCandidateField("business", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Sign text</span>
                    <input
                      value={String(candidateRecipe.sign ?? "")}
                      maxLength={8}
                      onChange={(e) =>
                        setCandidateField("sign", e.target.value.toUpperCase())
                      }
                    />
                  </label>
                  <label>
                    <span>Roof detail</span>
                    <select
                      value={String(candidateRecipe.roofDetail ?? "vent")}
                      onChange={(e) =>
                        setCandidateField("roofDetail", e.target.value)
                      }
                    >
                      {["vent", "hvac", "solar"].map((detail) => (
                        <option key={detail}>{detail}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Awning</span>
                    <input
                      type="checkbox"
                      checked={Boolean(candidateRecipe.awning)}
                      onChange={(e) =>
                        setCandidateField("awning", e.target.checked)
                      }
                    />
                  </label>
                  <label>
                    <span>Garage</span>
                    <input
                      type="checkbox"
                      checked={Boolean(candidateRecipe.garage)}
                      onChange={(e) =>
                        setCandidateField("garage", e.target.checked)
                      }
                    />
                  </label>
                  <label>
                    <span>Porch</span>
                    <input
                      type="checkbox"
                      checked={Boolean(candidateRecipe.porch)}
                      onChange={(e) =>
                        setCandidateField("porch", e.target.checked)
                      }
                    />
                  </label>
                  <button className="rebuild" disabled={busy} onClick={rebuild}>
                    {busy ? "Rebuilding…" : "Rebuild candidate art"}
                  </button>
                  <pre>{status}</pre>
                </div>
              )}
              <dl>
                <dt>Group</dt>
                <dd>{model.candidateGroup}</dd>
                <dt>Use</dt>
                <dd>
                  {String(candidateRecipe?.business ?? model.business ?? model.candidateType)}
                </dd>
                <dt>Variant</dt>
                <dd>
                  {String(candidateRecipe?.variant ?? model.variant ?? 0)} ·
                  deterministic colorway/details
                </dd>
                <dt>Sign</dt>
                <dd>
                  {String(candidateRecipe?.sign ?? model.sign) ||
                    "none · residential frontage"}
                </dd>
                <dt>Motion</dt>
                <dd>
                  {model.animation?.kind === "roof-fan"
                    ? `roof fan · ${model.animation.period ?? 280}ms`
                    : "none · intentionally static"}
                </dd>
              </dl>
              <p>
                These compact sprites are authored for odd urban gaps and are
                not in the city generator yet. The art recipe can change the
                colorway, roof detail, frontage, awning, garage and sign text
                before approval.
              </p>
            </div>
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
