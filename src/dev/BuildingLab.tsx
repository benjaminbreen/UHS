import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import graphics from "../content/graphics/buildings.json" with { type: "json" };
import religious from "../content/graphics/religious.json" with { type: "json" };
import period from "../content/graphics/period.json" with { type: "json" };
import theatres from "../content/graphics/theatres.json" with { type: "json" };
import halls from "../content/graphics/halls.json" with { type: "json" };
import {
  cornerTint,
  lightPhases,
  paintCornerTint,
} from "../render/corner-tint";
import "./building-lab.css";

/** Fields whose values are a fixed set. The editor renders a dropdown for
 * anything listed here, so adding a motif to a recipe is one line rather than
 * another branch in the form. */
const enumFields: Record<string, string[]> = {
  roofMaterial: ["slate", "terracotta", "grey-tile", "shingle", "thatch"],
  tower: ["west", "east", "none"],
  towerRoof: ["pyramid", "saddle"],
  // Theatres.
  form: [
    "colonnade",
    "ring",
    "open-stage",
    "front-house",
    "domed",
    "vaulted",
    "bath-shed",
    "arcaded",
    "portal",
    "long-hall",
  ],
  belfry: ["none", "lantern", "spire"],
  style: ["palladian", "baroque", "rococo", "beaux-arts"],
  order: ["doric", "ionic", "corinthian"],
  pedimentMotif: [
    "plain",
    "relief",
    "cartouche",
    "clock",
    "sculpture-group",
    "broken",
  ],
  roofline: ["plain", "balustrade", "urns", "statues", "quadriga", "dome"],
  roofCover: ["ring", "half", "none"],
  hangings: ["none", "painted", "heraldic"],
  roofForm: ["hipped", "gabled", "hip-and-gable"],
  finial: ["none", "onigawara", "gilt"],
  bannerStyle: ["strips", "pennant", "nobori"],
  marqueeStyle: ["canopy", "box", "blade"],
  facadeMotif: ["none", "chevrons", "streamline", "lattice"],
  wallFinish: ["ashlar", "boards"],
};

/** Which heading a model sits under in the list. */
const groupOf = (model: Model | undefined, id = "") =>
  !model
    ? ""
    : model.theatre
      ? "Theatres"
      : model.hall
        ? "Baths and halls"
      : model.period
        ? "Period facades"
        : model.candidate
          ? "Modern infill"
          : id.startsWith("religious-")
            ? "Religious"
            : id.includes("-urban-")
              ? "Urban fabric"
              : "Houses";

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
  theatre?: boolean;
  hall?: boolean;
  form?: string;
  family?: string;
  period?: boolean;
  periodGroup?: string;
  style?: string;
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
const periodOptions: Record<string, string[]> = {
  roofStyle: ["parapet-hip", "hip", "gable", "pediment", "flat", "mansard", "chinese", "kawara", "giwa", "verandah-hip"],
  roofMaterial: ["slate", "grey-tile", "shingle", "terracotta", "tar", "kawara", "giwa", "copper", "thatch"],
  window: ["sash", "sash-arched", "tall", "bay", "shuttered", "lattice", "shoji", "slit"],
  door: ["fanlight", "stoop", "double", "shop", "shop-panels", "koshi", "arcade", "red-gate", "sliding"],
  cornice: ["none", "dentil", "bracket", "corbel", "eave"],
};
const periodExtras = [
  "chimneys", "railings", "basement", "tall", "hoods", "rusticated", "quoins",
  "pediment", "balcony", "canopy", "fire-escape", "water-tank", "skylight",
  "awning", "wares", "lanterns", "sign-board", "hanging-sign", "counter",
  "porch", "verandah", "maru",
];
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
  const [selected, setSelected] = useState("period-georgian-townhouse");
  const [facing, setFacing] = useState<(typeof facings)[number]>("south");
  const [scale, setScale] = useState(3);
  // "flat" is the shipped look: one tint over the whole sprite.
  const [lightPhase, setLightPhase] = useState("flat");
  const [swing, setSwing] = useState(1);
  const [background, setBackground] = useState("Grass");
  const [filter, setFilter] = useState("");
  const [recipes, setRecipes] = useState<Record<string, Recipe>>(
    religious.buildings as Record<string, Recipe>,
  );
  const [candidateRecipes, setCandidateRecipes] = useState<
    Record<string, Recipe>
  >(graphics.buildings as Record<string, Recipe>);
  const [periodRecipes, setPeriodRecipes] = useState<Record<string, Recipe>>(
    period.buildings as Record<string, Recipe>,
  );
  const [theatreRecipes, setTheatreRecipes] = useState<Record<string, Recipe>>(
    theatres.buildings as unknown as Record<string, Recipe>,
  );
  const [hallRecipes, setHallRecipes] = useState<Record<string, Recipe>>(
    halls.buildings as unknown as Record<string, Recipe>,
  );
  const [materials] = useState({
    ...religious.materials,
    ...theatres.materials,
    ...halls.materials,
  });
  const [civicAtlas, setCivicAtlas] = useState<HTMLImageElement>();
  const [civicFrames, setCivicFrames] = useState<Set<string>>(new Set());
  const [regionalAtlas, setRegionalAtlas] = useState<HTMLImageElement>();
  const [regionalFrames, setRegionalFrames] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      // Two files, not one: models.json is the recipe manifest, buildings.json
      // the packed atlas. They shared a name until the atlas started clobbering it.
      loadJSON<Record<string, Model>>("/packs/models.json", version),
      // Houses and landmarks pack to separate pages; the lab holds both and
      // picks the sheet a frame actually lives on.
      loadJSON<{ frames: Record<string, Frame> }>("/packs/buildings.json", version),
      loadImage(`/packs/buildings.png?v=${version}`),
      loadJSON<{ frames: Record<string, Frame> }>("/packs/civic.json", version),
      loadImage(`/packs/civic.png?v=${version}`),
      loadJSON<{ frames: Record<string, Frame> }>(
        "/packs/regional-buildings.json",
        version,
      ),
      loadImage(`/packs/regional-buildings.png?v=${version}`),
    ])
      .then(([m, a, img, c, civicImg, regional, regionalImg]) => {
        if (cancelled) return;
        setModels(m);
        setFrames({ ...a.frames, ...c.frames, ...regional.frames });
        setAtlas(img);
        setCivicAtlas(civicImg);
        setCivicFrames(new Set(Object.keys(c.frames)));
        setRegionalAtlas(regionalImg);
        setRegionalFrames(new Set(Object.keys(regional.frames)));
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
    // Theatres first: they are the family under active work, and the list is
    // long enough that anything at the bottom is effectively hidden.
    const rank = (k: string) =>
      models[k].theatre
        ? 0
        : models[k].hall
          ? 0.5
        : models[k].period
          ? 1
          : models[k].candidate
            ? 2
            : k.startsWith("religious-")
              ? 3
              : /-urban-(hall|colonnade)/.test(k)
                ? 4
                : k.includes("-urban-")
                  ? 5
                  : 6;
    return ids
      .filter(
        (k) =>
          !filter ||
          k.includes(filter) ||
          models[k].label.toLowerCase().includes(filter.toLowerCase()),
      )
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          (models[a].periodGroup ?? "").localeCompare(models[b].periodGroup ?? "") ||
          a.localeCompare(b),
      );
  }, [models, filter]);

  const frameKey = facing === "south" ? selected : `${selected}-${facing}`;
  const model = models[frameKey] ?? models[selected];
  const recipeId =
    (models[selected] as Model & { recipe?: string })?.recipe ?? "";
  const isTheatre = Boolean((models[selected] as Model)?.theatre);
  const isHall = Boolean((models[selected] as Model)?.hall);
  const recipe = recipeId
    ? isTheatre
      ? theatreRecipes[recipeId]
      : isHall
        ? hallRecipes[recipeId]
        : recipes[recipeId]
    : undefined;
  const candidateRecipe = model?.candidate ? candidateRecipes[selected] : undefined;
  const periodId = selected.replace(/^period-/, "");
  const periodRecipe = model?.period ? periodRecipes[periodId] : undefined;
  const setPeriodField = (key: string, value: Recipe[string]) =>
    setPeriodRecipes((r) => ({
      ...r,
      [periodId]: { ...r[periodId], [key]: value },
    }));

  const sheet = civicFrames.has(frameKey)
    ? civicAtlas
    : regionalFrames.has(frameKey)
      ? regionalAtlas
      : atlas;
  useEffect(() => {
    const c = canvas.current;
    if (!c || !sheet || !model || !frames[frameKey]) return;
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
        sheet,
        f.x,
        f.y,
        f.w,
        f.h,
        Math.round(ax),
        Math.round(ay),
        f.w,
        f.h,
      );
      const lit = lightPhases.find((p) => p.id === lightPhase);
      if (lit) {
        // Tinted off-screen, where the background is still transparent. Read
        // back from the stage instead and the grid under the building is
        // opaque, so the tint lands on a rectangle rather than on the sprite.
        const off = document.createElement("canvas");
        off.width = f.w;
        off.height = f.h;
        const octx = off.getContext("2d", { willReadFrequently: true })!;
        octx.drawImage(sheet, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
        const region = octx.getImageData(0, 0, f.w, f.h);
        paintCornerTint(region, cornerTint(lit, parseInt(lit.tint, 16), swing));
        octx.putImageData(region, 0, 0);
        // Same silhouette and same alpha, so this replaces the untinted draw
        // exactly. Clearing first would punch a hole in the grid under it.
        ctx.drawImage(off, Math.round(ax), Math.round(ay));
      }
      if (animation?.kind === "roof-fan") {
        const fan = frames[`animation-roof-fan-${phase}`]?.frame;
        if (fan)
          ctx.drawImage(
            sheet,
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
  }, [sheet, frames, model, frameKey, scale, background, lightPhase, swing]);

  const setField = (key: string, value: Recipe[string]) =>
    (isTheatre ? setTheatreRecipes : isHall ? setHallRecipes : setRecipes)((r) => ({
      ...r,
      [recipeId]: { ...r[recipeId], [key]: value },
    }));
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
      const isPeriod = Boolean(models[selected]?.period);
      const r = await fetch("/api/art", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: isPeriod
            ? "src/content/graphics/period.json"
            : candidate
              ? "src/content/graphics/buildings.json"
              : isTheatre
                ? "src/content/graphics/theatres.json"
                : isHall
                  ? "src/content/graphics/halls.json"
                  : "src/content/graphics/religious.json",
          content:
            JSON.stringify(
              isPeriod
                ? { materials: period.materials, buildings: periodRecipes }
                : candidate
                  ? { materials: graphics.materials, buildings: candidateRecipes }
                  : isTheatre
                    ? { materials: theatres.materials, buildings: theatreRecipes }
                    : isHall
                      ? { materials: halls.materials, buildings: hallRecipes }
                      : { materials: religious.materials, buildings: recipes },
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
            period facades (Georgian, brownstone, tenement, and their East and
            South Asian contemporaries) are listed first, then the modern
            infill candidates. Both are recipe-driven and rebuild in place.
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
            {bases.map((id, i) => (
              <Fragment key={id}>
                {groupOf(models[id], id) !== groupOf(models[bases[i - 1]], bases[i - 1]) && (
                  <li className="group">{groupOf(models[id], id)}</li>
                )}
                <li>
                <button
                  className={id === selected ? "on" : ""}
                  onClick={() => setSelected(id)}
                >
                  <span>{models[id].label}</span>
                  <small>
                    {models[id].period
                      ? models[id].periodGroup
                      : models[id].candidate
                        ? `${models[id].candidateGroup ?? "candidate"}${models[id].sign ? ` · ${models[id].sign}` : ""}`
                        : id.replace(/^religious-/, "")}
                  </small>
                </button>
                </li>
              </Fragment>
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
            <select
              value={lightPhase}
              onChange={(e) => setLightPhase(e.target.value)}
              title="Four-corner tint from the sun angle in lighting.json"
            >
              <option value="flat">Flat tint (shipped)</option>
              {lightPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <label className="building-zoom">
              Swing{" "}
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={swing}
                onChange={(e) => setSwing(Number(e.target.value))}
              />
              {swing.toFixed(1)}×
            </label>
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
                : model.period
                  ? ` · ${model.style} · colorway ${model.variant ?? 0}`
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
                  ) : enumFields[key] ? (
                    <select
                      value={String(value)}
                      onChange={(e) => setField(key, e.target.value)}
                    >
                      {enumFields[key].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
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
          ) : model?.period && periodRecipe ? (
            <div className="candidate-card">
              <span className="candidate-badge">Review-only period facade</span>
              <h2>Recipe · {periodId}</h2>
              <div className="candidate-controls">
                {Object.entries(periodRecipe)
                  .filter(([key]) => !["label", "group", "style", "description", "seed"].includes(key))
                  .map(([key, value]) => (
                    <label key={key}>
                      <span>{key}</span>
                      {key === "wall" ? (
                        <select
                          value={String(value)}
                          onChange={(e) => setPeriodField(key, e.target.value)}
                        >
                          {Object.keys(period.materials).map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      ) : periodOptions[key] ? (
                        <select
                          value={String(value)}
                          onChange={(e) => setPeriodField(key, e.target.value)}
                        >
                          {periodOptions[key].map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      ) : key === "extras" ? (
                        <span className="extras">
                          {periodExtras.map((extra) => (
                            <label key={extra}>
                              <input
                                type="checkbox"
                                checked={(value as string[]).includes(extra)}
                                onChange={(e) =>
                                  setPeriodField(
                                    key,
                                    e.target.checked
                                      ? [...(value as string[]), extra]
                                      : (value as string[]).filter((x) => x !== extra),
                                  )
                                }
                              />
                              {extra}
                            </label>
                          ))}
                        </span>
                      ) : typeof value === "number" ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setPeriodField(key, Number(e.target.value))}
                        />
                      ) : Array.isArray(value) ? (
                        <span className="pair">
                          {value.map((n, i) => (
                            <input
                              key={i}
                              type="number"
                              value={n as number}
                              onChange={(e) => {
                                const next = [...value];
                                next[i] = Number(e.target.value) || 0;
                                setPeriodField(key, next);
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <input
                          value={String(value)}
                          maxLength={key === "sign" ? 8 : undefined}
                          onChange={(e) =>
                            setPeriodField(
                              key,
                              key === "sign" ? e.target.value.toUpperCase() : e.target.value,
                            )
                          }
                        />
                      )}
                    </label>
                  ))}
                <button className="rebuild" disabled={busy} onClick={rebuild}>
                  {busy ? "Rebuilding…" : "Rebuild period art"}
                </button>
                <pre>{status}</pre>
              </div>
              <dl>
                <dt>Group</dt>
                <dd>{model.periodGroup}</dd>
                <dt>Style</dt>
                <dd>{model.style}</dd>
              </dl>
              <p>
                Period facades are authored for review and are not in the city
                generator yet. Change the wall material, window, door, roof,
                cornice, extras or colorway and rebuild.
              </p>
            </div>
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
