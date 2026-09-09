import nature from "../../public/nature/atlas.json" with { type: "json" };
import ecology from "../../public/ecology/atlas.json" with { type: "json" };
import atlas from "../render/generated/atlas.json" with { type: "json" };
import { useEffect, useMemo, useRef, useState } from "react";
import { treeArtRecipeSchema } from "./tree-art-schema";
import "./tree-lab.css";

type TreeSource = "nature" | "ecology" | "atlas";
type TreeFrame = { x: number; y: number; w: number; h: number };
export type TreeArtFrame = {
  source: TreeSource;
  frame: TreeFrame;
  palette: string[];
  pixels: string[];
};
type TreeAsset = {
  id: string;
  label: string;
  group: string;
  source: TreeSource;
  url: string;
  frame: TreeFrame;
};
type TreeRecipe = {
  version: 1;
  target: "tree";
  assets: Record<string, TreeArtFrame>;
};

const tokenAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const treeGroups: { label: string; ids: string[] }[] = [
  {
    label: "Broadleaf ages",
    ids: [
      "nature-broadleaf-sapling",
      "nature-broadleaf-young",
      "nature-broadleaf-mature",
      "nature-broadleaf-giant",
    ],
  },
  {
    label: "Regional trees",
    ids: [
      "nature-bamboo-clump",
      "nature-teak",
      "nature-feather-palm",
      "nature-spreading-pine",
      "nature-boreal-spruce",
      "nature-silver-birch",
      "nature-riverside-willow",
      "nature-tropical-broadleaf",
      "nature-sahel-thorn",
    ],
  },
  {
    label: "Legacy & food trees",
    ids: ["oak", "olive", "hackberry", "acacia", "cypress", "ecology-fruit-tree"],
  },
];

const manifestFor: Record<
  TreeSource,
  { frames: Record<string, { frame: TreeFrame }> }
> = {
  nature: nature as typeof nature,
  ecology: ecology as typeof ecology,
  atlas: atlas as typeof atlas,
};

const sourceFor = (id: string): TreeSource =>
  id.startsWith("nature-")
    ? "nature"
    : id.startsWith("ecology-")
      ? "ecology"
      : "atlas";

const urlFor: Record<TreeSource, string> = {
  nature: "/nature/atlas.png",
  ecology: "/ecology/atlas.png",
  atlas: "/packs/atlas.png",
};

const labelFor = (id: string) =>
  id
    .replace(/^(nature-broadleaf|nature|ecology)-/, "")
    .replaceAll("-", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const treeAssets: TreeAsset[] = treeGroups.flatMap(({ label: group, ids }) =>
  ids.flatMap((id) => {
    const source = sourceFor(id);
    const frame = manifestFor[source].frames[id]?.frame;
    return frame
      ? [{ id, label: labelFor(id), group, source, url: urlFor[source], frame }]
      : [];
  }),
);

function cloneFrame(frame: TreeArtFrame): TreeArtFrame {
  return {
    source: frame.source,
    frame: { ...frame.frame },
    palette: [...frame.palette],
    pixels: [...frame.pixels],
  };
}

function rgbHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

async function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function readAsset(
  asset: TreeAsset,
  images: Map<string, Promise<HTMLImageElement>>,
): Promise<TreeArtFrame> {
  let image = images.get(asset.url);
  if (!image) {
    image = loadImage(asset.url);
    images.set(asset.url, image);
  }
  const source = await image;
  const canvas = document.createElement("canvas");
  canvas.width = asset.frame.w;
  canvas.height = asset.frame.h;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(
    source,
    asset.frame.x,
    asset.frame.y,
    asset.frame.w,
    asset.frame.h,
    0,
    0,
    asset.frame.w,
    asset.frame.h,
  );
  const data = context.getImageData(0, 0, asset.frame.w, asset.frame.h).data;
  const palette: string[] = [];
  const indexes = new Map<string, number>();
  const pixels: string[] = [];
  for (let y = 0; y < asset.frame.h; y++) {
    let row = "";
    for (let x = 0; x < asset.frame.w; x++) {
      const offset = (y * asset.frame.w + x) * 4;
      if (data[offset + 3] === 0) {
        row += ".";
        continue;
      }
      const color = rgbHex(data[offset], data[offset + 1], data[offset + 2]);
      let index = indexes.get(color);
      if (index === undefined) {
        index = palette.length;
        if (index >= tokenAlphabet.length)
          throw new Error(`${asset.id} has more than 36 colors`);
        indexes.set(color, index);
        palette.push(color);
      }
      row += tokenAlphabet[index];
    }
    pixels.push(row);
  }
  return { source: asset.source, frame: { ...asset.frame }, palette, pixels };
}

function drawPixels(
  target: HTMLCanvasElement,
  art: TreeArtFrame,
  scale: number,
  grid: boolean,
) {
  const { w, h } = art.frame;
  target.width = w * scale;
  target.height = h * scale;
  const context = target.getContext("2d")!;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, target.width, target.height);
  context.fillStyle = "#334053";
  context.fillRect(0, 0, target.width, target.height);
  context.fillStyle = "#3d495a";
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (art.pixels[y]?.[x] === ".") continue;
      const paletteIndex = tokenAlphabet.indexOf(art.pixels[y]![x]!);
      const color = art.palette[paletteIndex];
      if (!color) continue;
      context.fillStyle = color;
      context.fillRect(x * scale, y * scale, scale, scale);
    }
  if (grid && scale >= 4) {
    context.strokeStyle = "#ffffff18";
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 1; x < w; x++) {
      context.moveTo(x * scale + 0.5, 0);
      context.lineTo(x * scale + 0.5, h * scale);
    }
    for (let y = 1; y < h; y++) {
      context.moveTo(0, y * scale + 0.5);
      context.lineTo(w * scale, y * scale + 0.5);
    }
    context.stroke();
  }
}

function PixelCanvas({
  art,
  scale,
  grid,
  className,
  label,
  onPaint,
}: {
  art: TreeArtFrame;
  scale: number;
  grid: boolean;
  className?: string;
  label: string;
  onPaint?: (x: number, y: number, erase: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  useEffect(() => {
    if (canvas.current) drawPixels(canvas.current, art, scale, grid);
  }, [art, grid, scale]);
  const paint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPaint || !canvas.current) return;
    const bounds = canvas.current.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * art.frame.w);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * art.frame.h);
    if (x < 0 || y < 0 || x >= art.frame.w || y >= art.frame.h) return;
    onPaint(x, y, event.button === 2 || (event.buttons & 2) === 2);
  };
  return (
    <canvas
      ref={canvas}
      className={className}
      role={onPaint ? "application" : undefined}
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!onPaint) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        painting.current = true;
        paint(event);
      }}
      onPointerMove={(event) => {
        if (painting.current) paint(event);
      }}
      onPointerUp={(event) => {
        painting.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        painting.current = false;
      }}
    />
  );
}

function download(name: string, contents: string, type: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = `data:${type};charset=utf-8,${encodeURIComponent(contents)}`;
  link.click();
}

function recipeIsUsable(recipe: TreeRecipe) {
  return Object.entries(recipe.assets).every(([, asset]) => {
    const { w, h } = asset.frame;
    return (
      asset.pixels.length === h &&
      asset.pixels.every((row) => row.length === w) &&
      [...asset.pixels.join("")].every(
        (token) => token === "." || tokenAlphabet.includes(token),
      )
    );
  });
}

export function TreeLab() {
  const [art, setArt] = useState<Record<string, TreeArtFrame>>({});
  const [original, setOriginal] = useState<Record<string, TreeArtFrame>>({});
  const [selectedId, setSelectedId] = useState("nature-broadleaf-mature");
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(4);
  const [selectedColor, setSelectedColor] = useState<number | null>(0);
  const [message, setMessage] = useState("Loading tree atlas pixels…");
  const file = useRef<HTMLInputElement>(null);
  const images = useMemo(() => new Map<string, Promise<HTMLImageElement>>(), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(treeAssets.map((asset) => readAsset(asset, images)))
      .then((frames) => {
        if (cancelled) return;
        const next = Object.fromEntries(
          frames.map((frame, index) => [treeAssets[index]!.id, frame]),
        );
        setArt(next);
        setOriginal(Object.fromEntries(
          Object.entries(next).map(([id, frame]) => [id, cloneFrame(frame)]),
        ));
        setMessage("Source atlas loaded. Edits stay local until you export.");
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load the tree atlas.");
      });
    return () => {
      cancelled = true;
    };
  }, [images]);

  const selected = treeAssets.find((asset) => asset.id === selectedId) ?? treeAssets[0]!;
  const current = art[selected.id];
  const source = original[selected.id];
  const filteredGroups = treeGroups
    .map((group) => ({
      ...group,
      ids: group.ids.filter((id) => {
        const asset = treeAssets.find((entry) => entry.id === id);
        return (
          asset &&
          `${asset.label} ${asset.id}`.toLowerCase().includes(query.toLowerCase())
        );
      }),
    }))
    .filter((group) => group.ids.length);

  const editPixel = (x: number, y: number, erase: boolean) => {
    if (!current) return;
    const token = erase || selectedColor === null ? "." : tokenAlphabet[selectedColor];
    if (!token) return;
    setArt((previous) => {
      const next = cloneFrame(previous[selected.id]!);
      next.pixels[y] = `${next.pixels[y]!.slice(0, x)}${token}${next.pixels[y]!.slice(x + 1)}`;
      return { ...previous, [selected.id]: next };
    });
  };

  const updateColor = (index: number, color: string) => {
    setArt((previous) => {
      const next = cloneFrame(previous[selected.id]!);
      next.palette[index] = color;
      return { ...previous, [selected.id]: next };
    });
  };

  const addColor = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!current || current.palette.length >= tokenAlphabet.length) return;
    const color = event.target.value;
    setArt((previous) => {
      const next = cloneFrame(previous[selected.id]!);
      next.palette.push(color);
      return { ...previous, [selected.id]: next };
    });
    setSelectedColor(current.palette.length);
    event.target.value = "#ffffff";
  };

  const resetSelected = () => {
    if (!source) return;
    setArt((previous) => ({ ...previous, [selected.id]: cloneFrame(source) }));
    setMessage(`${selected.label} restored from the source atlas.`);
  };

  const exported = JSON.stringify(
    { version: 1, target: "tree", assets: art } satisfies TreeRecipe,
    null,
    2,
  );
  const importRecipe = async (fileToRead: File) => {
    try {
      const parsed = treeArtRecipeSchema.parse(JSON.parse(await fileToRead.text())) as TreeRecipe;
      if (!recipeIsUsable(parsed)) throw new Error("Invalid pixel dimensions");
      setArt((previous) => ({ ...previous, ...parsed.assets }));
      setSelectedId(Object.keys(parsed.assets)[0] ?? selectedId);
      setMessage(`Imported ${Object.keys(parsed.assets).length} tree recipe(s).`);
    } catch {
      setMessage("Invalid recipe. Expected a version 1 tree-art JSON file.");
    }
  };

  return (
    <main className="tree-lab">
      <header className="tree-header">
        <div>
          <span className="tree-eyebrow">UNIVERSAL HISTORY SIMULATOR / ART WORKSHOP</span>
          <h1>Tree texture lab</h1>
          <p>Hand-edit the tree pixels and palette used by the world renderer.</p>
        </div>
        <nav className="tree-actions" aria-label="Tree lab links">
          <button
            disabled={!Object.keys(art).length}
            onClick={() => download("tree-art.json", exported, "application/json")}
          >
            Export JSON
          </button>
          <button onClick={() => file.current?.click()}>Import JSON</button>
          <button onClick={resetSelected} disabled={!current}>
            Reset selected
          </button>
          <a href="/nature-lab">Asset gallery ↗</a>
          <a href="/">Back to game ↗</a>
        </nav>
      </header>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) await importRecipe(selectedFile);
          event.target.value = "";
        }}
      />
      <div className="tree-layout">
        <aside className="tree-library" aria-label="Tree asset library">
          <label className="tree-search">
            Find a tree
            <input
              aria-label="Find a tree"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or sprite ID…"
            />
          </label>
          <p className="tree-count">{treeAssets.length} editable tree assets</p>
          {filteredGroups.map((group) => (
            <section key={group.label} className="tree-group">
              <h2>{group.label}</h2>
              <div className="tree-asset-grid">
                {group.ids.map((id) => {
                  const asset = treeAssets.find((entry) => entry.id === id)!;
                  const frame = art[id];
                  return (
                    <button
                      key={id}
                      aria-pressed={selectedId === id}
                      onClick={() => {
                        setSelectedId(id);
                        setSelectedColor(0);
                        setMessage("");
                      }}
                    >
                      {frame ? (
                        <PixelCanvas
                          art={frame}
                          scale={Math.max(1, Math.min(2, 96 / Math.max(frame.frame.w, frame.frame.h)))}
                          grid={false}
                          label={`${asset.label} thumbnail`}
                        />
                      ) : (
                        <span className="tree-thumb-loading" />
                      )}
                      <strong>{asset.label}</strong>
                      <small>{asset.id}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {!filteredGroups.length && <p>No matching tree assets.</p>}
        </aside>
        <section className="tree-editor" aria-label="Selected tree editor">
          <div className="tree-title">
            <div>
              <span className="tree-eyebrow">SOURCE PIXELS</span>
              <h2>{selected.label}</h2>
              <code>{selected.id}</code>
            </div>
            <span>{current ? `${current.frame.w} × ${current.frame.h} native pixels` : "Loading…"}</span>
          </div>
          <div className="tree-tool-row">
            <label>
              Pixel scale
              <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                {[2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>{value}×</option>
                ))}
              </select>
            </label>
            <p>Left-drag paints. Right-drag erases. Select a swatch to choose the ink.</p>
          </div>
          <div className="tree-editor-scroll">
            {current ? (
              <PixelCanvas
                art={current}
                scale={scale}
                grid
                className="tree-pixel-editor"
                label={`${selected.label} pixel editor`}
                onPaint={editPixel}
              />
            ) : (
              <div className="tree-loading">Loading atlas pixels…</div>
            )}
          </div>
          {current && (
            <section className="tree-palette" aria-label="Tree palette">
              <div className="tree-section-heading">
                <div>
                  <span className="tree-eyebrow">PALETTE</span>
                  <h2>Colors in this asset</h2>
                </div>
                <label className="tree-add-color">
                  <span>Add color</span>
                  <input type="color" defaultValue="#ffffff" onChange={addColor} />
                </label>
              </div>
              <div className="tree-swatches">
                <button
                  className={selectedColor === null ? "selected" : ""}
                  onClick={() => setSelectedColor(null)}
                >
                  <i className="tree-transparent" />
                  <span>Erase</span>
                </button>
                {current.palette.map((color, index) => (
                  <label key={`${index}-${color}`} className={selectedColor === index ? "selected" : ""}>
                    <button
                      aria-label={`Use palette color ${index + 1}`}
                      onClick={() => setSelectedColor(index)}
                    >
                      <i style={{ background: color }} />
                      <span>{tokenAlphabet[index]}</span>
                    </button>
                    <input
                      aria-label={`Edit palette color ${index + 1}`}
                      type="color"
                      value={color}
                      onChange={(event) => updateColor(index, event.target.value)}
                    />
                    <code>{color}</code>
                  </label>
                ))}
              </div>
              <p className="tree-note">
                Recoloring a swatch updates every pixel that uses it. The exported palette preserves the exact mapping.
              </p>
            </section>
          )}
          {current && source && (
            <section className="tree-comparison" aria-label="Tree comparison">
              <div className="tree-section-heading">
                <div>
                  <span className="tree-eyebrow">LIVE COMPARISON</span>
                  <h2>Current design · source atlas</h2>
                </div>
                <span>Transparent pixels shown on the checkerboard</span>
              </div>
              <div className="tree-previews">
                <div>
                  <span>Current</span>
                  <PixelCanvas art={current} scale={2} grid={false} label="Current tree preview" />
                </div>
                <div>
                  <span>Source</span>
                  <PixelCanvas art={source} scale={2} grid={false} label="Source tree preview" />
                </div>
              </div>
            </section>
          )}
          <div className="tree-status" role="status">{message}</div>
        </section>
      </div>
      <details className="tree-recipe">
        <summary>Show current JSON recipe</summary>
        <pre>{exported}</pre>
      </details>
      <p className="tree-footer">
        The recipe is atlas-aware: each asset keeps its source texture and frame coordinates, then stores readable palette-index pixel rows for direct review and application.
      </p>
    </main>
  );
}
