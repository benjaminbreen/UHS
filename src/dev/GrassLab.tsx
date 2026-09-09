import { useEffect, useMemo, useRef, useState } from "react";
import {
  cloneGrassArtRecipe,
  defaultGrassArtRecipe,
  grassPaletteRoles,
  resolveGrassArt,
  type GrassArtRecipe,
  type GrassPaletteRole,
} from "../content/graphics/grass-art";
import { ecologies, type Ecology } from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import { rasterHabitatTile } from "../render/habitat-raster";
import { grassArtRecipeSchema } from "./grass-art-schema";
import "./grass-lab.css";

type EditorKind = "turf" | "ticks";

const ecologyLabels: Record<Ecology, string> = {
  grassland: "Grassland",
  "temperate-woodland": "Temperate woodland",
  "boreal-woodland": "Boreal woodland",
  "tropical-woodland": "Tropical woodland",
  wetland: "Wetland",
  "dry-scrub": "Dry scrubland",
  desert: "Desert",
  tundra: "Tundra",
};
const paletteLabels: Record<GrassPaletteRole, string> = {
  base: "Base turf",
  light: "Light turf",
  dark: "Dark turf",
  mineral: "Exposed earth",
  litter: "Litter / woodland floor",
  bladeShadow: "Blade shadow",
  bladeLight: "Blade highlight",
};

function download(name: string, contents: string, type: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = `data:${type};charset=utf-8,${encodeURIComponent(contents)}`;
  link.click();
}

function pixelColor(
  kind: EditorKind,
  value: string,
  palette: GrassArtRecipe["palettes"][Ecology],
) {
  if (value === "0") return "#172018";
  if (kind === "ticks") return palette.bladeLight;
  if (value === "1") return palette.bladeShadow;
  if (value === "2") return palette.dark;
  return palette.bladeLight;
}

function GrassPreview({
  recipe,
  ecology,
}: {
  recipe: GrassArtRecipe;
  ecology: Ecology;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const art = useMemo(() => resolveGrassArt(recipe), [recipe]);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const tilesWide = 9;
    const tilesHigh = 6;
    target.width = tilesWide * 16;
    target.height = tilesHigh * 16;
    const ctx = target.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const sample: TopographySample = (x, y): TopographyCell => ({
      height: 0,
      surface: "grass",
      habitat: {
        ecology,
        kind: "open",
        wet: y > 3 ? 0.32 : 0.2,
        cover: 0.2,
        exposed: x < 2 ? 0.12 : 0,
        season: "summer",
      },
    });
    for (let y = 0; y < tilesHigh; y++)
      for (let x = 0; x < tilesWide; x++) {
        const image = ctx.createImageData(16, 16);
        image.data.set(rasterHabitatTile(sample, x, y, 0, 0, art).pixels);
        ctx.putImageData(image, x * 16, y * 16);
      }
  }, [art, ecology]);
  return (
    <canvas
      ref={canvas}
      className="grass-preview-canvas"
      data-testid="grass-preview"
      aria-label="Rendered grass texture preview"
    />
  );
}

export function GrassLab() {
  const [recipe, setRecipe] = useState<GrassArtRecipe>(() =>
    cloneGrassArtRecipe(),
  );
  const [ecology, setEcology] = useState<Ecology>("grassland");
  const [kind, setKind] = useState<EditorKind>("turf");
  const [variant, setVariant] = useState(0);
  const [ink, setInk] = useState<1 | 2 | 3>(2);
  const [message, setMessage] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const palette = recipe.palettes[ecology];
  const rows =
    kind === "turf"
      ? (recipe.motifs.turf[variant] ?? recipe.motifs.turf[0])
      : (recipe.motifs.ticks[variant] ?? recipe.motifs.ticks[0]);
  const width = rows[0]?.length ?? 0;

  useEffect(() => {
    setVariant(0);
  }, [kind]);

  const editPixel = (x: number, y: number, erase = false) => {
    setRecipe((current) => {
      const next = JSON.parse(JSON.stringify(current)) as GrassArtRecipe;
      const value =
        kind === "ticks"
          ? erase
            ? "0"
            : rows[y][x] === "0"
              ? "1"
              : "0"
          : erase
            ? "0"
            : String(ink);
      const source =
        kind === "turf"
          ? next.motifs.turf[variant]
          : next.motifs.ticks[variant];
      source[y] = `${source[y].slice(0, x)}${value}${source[y].slice(x + 1)}`;
      return next;
    });
    setMessage("");
  };

  const updateColor = (role: GrassPaletteRole, value: string) => {
    setRecipe((current) => ({
      ...current,
      palettes: {
        ...current.palettes,
        [ecology]: { ...current.palettes[ecology], [role]: value },
      },
    }));
    setMessage("");
  };

  const exported = JSON.stringify(recipe, null, 2);
  const reset = () => {
    setRecipe(cloneGrassArtRecipe());
    setMessage("Default grass art restored.");
  };
  const importRecipe = async (fileToRead: File) => {
    try {
      const parsed = grassArtRecipeSchema.parse(
        JSON.parse(await fileToRead.text()),
      ) as GrassArtRecipe;
      setRecipe(parsed);
      setMessage("Grass recipe imported.");
    } catch {
      setMessage("Invalid recipe. Expected a version 1 grass-art JSON file.");
    }
  };

  return (
    <main className="grass-lab">
      <header className="grass-header">
        <div>
          <span className="grass-eyebrow">
            UNIVERSAL HISTORY SIMULATOR / ART WORKSHOP
          </span>
          <h1>Grass texture lab</h1>
          <p>
            Edit the native pixels and palette that drive procedural ground.
          </p>
        </div>
        <nav className="grass-actions" aria-label="Grass lab links">
          <button
            onClick={() =>
              download("grass-art.json", exported, "application/json")
            }
          >
            Export JSON
          </button>
          <button onClick={() => file.current?.click()}>Import JSON</button>
          <button onClick={reset}>Reset defaults</button>
          <a href="/terrain-lab?ecology=grassland&population=none&start=wanderer&landform=plain&water=none&seed=grass-review">
            Terrain preview ↗
          </a>
          <a href="/">Back to game ↗</a>
        </nav>
      </header>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const selected = event.target.files?.[0];
          if (selected) await importRecipe(selected);
          event.target.value = "";
        }}
      />
      <div className="grass-layout">
        <aside className="grass-controls">
          <section>
            <h2>Preview ecology</h2>
            <label>
              Ecology
              <select
                aria-label="Ecology"
                value={ecology}
                onChange={(event) => setEcology(event.target.value as Ecology)}
              >
                {ecologies.map((id) => (
                  <option key={id} value={id}>
                    {ecologyLabels[id]}
                  </option>
                ))}
              </select>
            </label>
            <p className="grass-note">
              Colors are scoped by ecology. Motifs are shared so the pixel
              language stays consistent across climates.
            </p>
          </section>
          <section>
            <h2>Texture source</h2>
            <div
              className="grass-kind-tabs"
              role="tablist"
              aria-label="Grass texture source"
            >
              <button
                role="tab"
                aria-selected={kind === "turf"}
                onClick={() => setKind("turf")}
              >
                Turf tuft
              </button>
              <button
                role="tab"
                aria-selected={kind === "ticks"}
                onClick={() => setKind("ticks")}
              >
                Ground ticks
              </button>
            </div>
            <p className="grass-note">
              {kind === "turf"
                ? "The larger 9×8 blade cluster repeated across open grass."
                : "Small 8×8 supporting marks on the base sward."}
            </p>
            <div className="grass-variants" aria-label="Texture variants">
              {(kind === "turf" ? recipe.motifs.turf : recipe.motifs.ticks).map(
                (_, index) => (
                  <button
                    key={index}
                    aria-pressed={variant === index}
                    onClick={() => setVariant(index)}
                  >
                    Variant {index + 1}
                  </button>
                ),
              )}
            </div>
          </section>
          {kind === "turf" && (
            <section>
              <h2>Pixel ink</h2>
              <div
                className="grass-ink-tools"
                role="group"
                aria-label="Turf pixel ink"
              >
                {([1, 2, 3] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={ink === value}
                    onClick={() => setInk(value)}
                  >
                    <i
                      style={{
                        background: pixelColor(kind, String(value), palette),
                      }}
                    />
                    {value === 1
                      ? "Shadow"
                      : value === 2
                        ? "Body"
                        : "Highlight"}
                  </button>
                ))}
              </div>
              <p className="grass-note">
                Left click paints. Right click erases. Ground ticks toggle on
                and off.
              </p>
            </section>
          )}
          <section>
            <h2>Palette</h2>
            <div className="grass-palette">
              {grassPaletteRoles.map((role) => (
                <label key={role}>
                  <span>{paletteLabels[role]}</span>
                  <input
                    aria-label={paletteLabels[role]}
                    type="color"
                    value={palette[role]}
                    onChange={(event) => updateColor(role, event.target.value)}
                  />
                  <code>{palette[role]}</code>
                </label>
              ))}
            </div>
          </section>
        </aside>
        <section className="grass-stage">
          <div className="grass-stage-heading">
            <div>
              <span className="grass-eyebrow">SOURCE PIXELS</span>
              <h2>
                {kind === "turf" ? "Turf tuft" : "Ground ticks"} · variant{" "}
                {variant + 1}
              </h2>
            </div>
            <span>
              {width} × {rows.length} native pixels
            </span>
          </div>
          <div className="grass-editor-wrap">
            <div
              className="grass-pixel-grid"
              style={{ gridTemplateColumns: `repeat(${width}, 34px)` }}
              role="grid"
              aria-label={`${kind} pixel editor`}
              onContextMenu={(event) => event.preventDefault()}
            >
              {rows.flatMap((row, y) =>
                [...row].map((value, x) => (
                  <button
                    key={`${x}-${y}`}
                    className="grass-pixel"
                    role="gridcell"
                    aria-label={`Pixel ${x},${y}`}
                    data-value={value}
                    style={{ background: pixelColor(kind, value, palette) }}
                    onClick={() => editPixel(x, y)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      editPixel(x, y, true);
                    }}
                  />
                )),
              )}
            </div>
          </div>
          <div className="grass-rendered-heading">
            <div>
              <span className="grass-eyebrow">ACTUAL RENDERER</span>
              <h2>Procedural grass preview</h2>
            </div>
            <span>9 × 6 terrain tiles · 1× source pixels</span>
          </div>
          <div className="grass-preview-wrap">
            <GrassPreview recipe={recipe} ecology={ecology} />
          </div>
          <p className="grass-note grass-stage-note">
            This preview runs the same pixel rasterizer used by the terrain
            worker. Roads, shoreline edges, and vegetation remain separate
            renderer layers.
          </p>
          <div className="grass-status" role="status">
            {message ||
              "Edits are local to this lab until you export the recipe."}
          </div>
        </section>
      </div>
      <details className="grass-recipe">
        <summary>Show current JSON recipe</summary>
        <pre>{exported}</pre>
      </details>
      <p className="grass-footer">
        Default source preserved: {defaultGrassArtRecipe.version}. The exported
        file is intended for review and direct application to the TypeScript art
        recipe.
      </p>
    </main>
  );
}
