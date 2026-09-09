import nature from "../../public/nature/atlas.json" with { type: "json" };
import { useEffect, useState } from "react";
import atlas from "../render/generated/atlas.json" with { type: "json" };
import ecology from "../../public/ecology/atlas.json" with { type: "json" };
import { Sprite } from "../ui/components";
import "./nature-lab.css";

type Asset = { id: string; label: string; category: string; frames: string[] };
const plantGroups: Record<string, string[]> = {
  "Broadleaf ages": Object.keys(nature.frames).filter((id) =>
    id.startsWith("nature-broadleaf-"),
  ),
  "New trees": Object.keys(nature.frames).filter(
    (id) =>
      !id.includes("scrub") &&
      !id.startsWith("nature-understory-") &&
      !id.startsWith("nature-broadleaf-"),
  ),
  "New shrubs": Object.keys(nature.frames).filter((id) => id.includes("scrub")),
  "New understory": Object.keys(nature.frames).filter((id) =>
    id.startsWith("nature-understory-"),
  ),
  Trees: [
    "oak",
    "olive",
    "hackberry",
    "acacia",
    "cypress",
    "ecology-fruit-tree",
  ],
  "Understory & crops": [
    "bush",
    "reeds",
    "flowers",
    "wheat",
    "flax",
    "crop-leafy",
    "ecology-berry-bush",
    "ecology-grazing",
  ],
  "Harvest & debris": [
    "log",
    "ecology-branches",
    "ecology-fruit-item",
    "ecology-berries-item",
  ],
};
const label = (id: string) =>
  id
    .replace(/^(nature-understory|ecology|nature)-/, "")
    .replaceAll("-", " ")
    .replace(/^./, (c) => c.toUpperCase());
const assets: Asset[] = [
  ...Object.entries(plantGroups).flatMap(([category, ids]) =>
    ids.map((id) => ({ id, label: label(id), category, frames: [id] })),
  ),
  ...["sheep", "goat", "chicken", "lizard"].map((id) => ({
    id,
    label: label(id),
    category: "Animals",
    frames: Object.keys(atlas.frames)
      .filter((k) => new RegExp(`^${id}\\d+$`).test(k))
      .sort(),
  })),
];
function frameInfo(id: string) {
  const source = id.startsWith("nature-")
    ? nature
    : id.startsWith("ecology-")
      ? ecology
      : atlas;
  const frame = (
    source.frames as Record<
      string,
      { frame: { x: number; y: number; w: number; h: number } }
    >
  )[id]?.frame;
  return {
    frame,
    url: id.startsWith("nature-")
      ? "/nature/atlas.png"
      : id.startsWith("ecology-")
        ? "/ecology/atlas.png"
        : "/packs/atlas.png",
  };
}
export function NatureLab() {
  const [category, setCategory] = useState("Plants");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(assets[0]);
  const [scale, setScale] = useState(3);
  const [background, setBackground] = useState("meadow");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!playing || selected.frames.length < 2) return;
    const timer = window.setInterval(
      () => setFrame((f) => (f + 1) % selected.frames.length),
      400,
    );
    return () => clearInterval(timer);
  }, [playing, selected]);
  const pick = (asset: Asset) => {
    setSelected(asset);
    setFrame(0);
    setMessage("");
  };
  const id = selected.frames[frame] ?? selected.frames[0];
  const { frame: dimensions, url } = frameInfo(id);
  const filtered = assets.filter(
    (a) =>
      (category === "Animals"
        ? a.category === "Animals"
        : a.category !== "Animals") &&
      `${a.label} ${a.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function exportPNG() {
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const f = frameInfo(id).frame!;
      const canvas = document.createElement("canvas");
      canvas.width = f.w;
      canvas.height = f.h;
      canvas
        .getContext("2d")!
        .drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      const link = document.createElement("a");
      link.href = canvas.toDataURL();
      link.download = `${id}.png`;
      link.click();
      setMessage("Native-size transparent PNG exported.");
    } catch {
      setMessage("Could not export this frame. Please try again.");
    }
  }
  return (
    <main className="nature-lab">
      <header className="nature-header">
        <div>
          <div className="eyebrow">DEVELOPER · ASSET STUDIES</div>
          <h1>Plants & animals</h1>
          <p>Current game artwork, at its original pixel scale.</p>
        </div>
        <a href="/" className="action">
          Game opening ↗
        </a>
      </header>
      <div className="nature-layout">
        <section className="nature-library" aria-label="Asset library">
          <div
            className="nature-tabs"
            role="tablist"
            aria-label="Asset category"
          >
            {["Plants", "Animals"].map((c) => (
              <button
                role="tab"
                id={`nature-tab-${c}`}
                aria-controls="nature-assets"
                aria-selected={category === c}
                tabIndex={category === c ? 0 : -1}
                key={c}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? "Plants"
                        : e.key === "End"
                          ? "Animals"
                          : category === "Plants"
                            ? "Animals"
                            : "Plants";
                    setCategory(next);
                    pick(
                      assets.find((a) =>
                        next === "Animals"
                          ? a.category === "Animals"
                          : a.category !== "Animals",
                      )!,
                    );
                    document.getElementById(`nature-tab-${next}`)?.focus();
                  }
                }}
                onClick={() => {
                  setCategory(c);
                  pick(
                    assets.find((a) =>
                      c === "Animals"
                        ? a.category === "Animals"
                        : a.category !== "Animals",
                    )!,
                  );
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="nature-search">
            Find an asset
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or sprite ID…"
            />
          </label>
          <div
            id="nature-assets"
            role="tabpanel"
            aria-labelledby={`nature-tab-${category}`}
          >
            <p className="nature-count">{filtered.length} assets</p>
            <div className="nature-grid">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  aria-pressed={selected.id === a.id}
                  onClick={() => pick(a)}
                >
                  <div className="nature-thumb">
                    <Sprite
                      name={a.frames[0]}
                      scale={
                        (frameInfo(a.frames[0]).frame?.h ?? 0) > 104 ? 0.5 : 1
                      }
                    />
                  </div>
                  <strong>{a.label}</strong>
                  <small>{a.category}</small>
                </button>
              ))}
            </div>
            {!filtered.length && <p>No matching assets. Try another name.</p>}
          </div>
        </section>
        <section className="nature-inspector" aria-label="Selected asset">
          <div className="nature-title">
            <h2>{selected.label}</h2>
            <span>
              {dimensions?.w} × {dimensions?.h} px
            </span>
          </div>
          <div
            className={`nature-stage nature-bg-${background}`}
            data-testid="nature-preview"
          >
            <Sprite name={id} scale={scale} />
          </div>
          <div className="nature-controls">
            <label>
              Pixel scale
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
            <label>
              Backdrop
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              >
                <option value="meadow">Meadow</option>
                <option value="dry">Dry ground</option>
                <option value="forest">Forest shade</option>
                <option value="checker">Transparency grid</option>
                <option value="night">Night blue</option>
              </select>
            </label>
          </div>
          {selected.frames.length > 1 && (
            <div className="nature-controls">
              <label>
                Animation frame
                <select
                  value={frame}
                  onChange={(e) => {
                    setPlaying(false);
                    setFrame(Number(e.target.value));
                  }}
                >
                  {selected.frames.map((f, i) => (
                    <option key={f} value={i}>
                      {i + 1} · {f}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="action"
                aria-pressed={playing}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? "Pause animation" : "Play animation"}
              </button>
            </div>
          )}
          <div className="nature-meta">
            <code>{id}</code>
            <p>
              {selected.frames.length}{" "}
              {selected.frames.length === 1 ? "frame" : "frames"} · {url}
            </p>
            <p>
              Raw atlas preview. Backgrounds are comparison swatches; world
              lighting and shadows are not applied.
            </p>
          </div>
          <button className="action" onClick={exportPNG}>
            Export sprite PNG
          </button>
          <p role="status">{message}</p>
        </section>
      </div>
    </main>
  );
}
