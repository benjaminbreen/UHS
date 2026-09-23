import { RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { faunaProfiles } from "../content/fauna";
import type { FaunaState } from "../core/fauna";
import { FpsMeter } from "../ui/FpsMeter";
import { AudioTuningTab } from "./AudioTuningTab";
import {
  perf,
  setPerf,
  resetPerf,
  defaultPerfSwitches,
  type PerfSwitches,
} from "../render/perf-switches";
import { reshadeTerrain, setTerrainReach } from "../render/terrain-stream";
import type {
  FrameCap,
  LitterPalette,
  LiveGraphicsSettings,
  TreePalette,
  ZoomEase,
} from "../render/live-graphics";

type Props = {
  settings: LiveGraphicsSettings;
  zoom: number;
  onChange: (patch: Partial<LiveGraphicsSettings>) => void;
  onZoom: (zoom: number) => void;
  onClose: () => void;
  onReset: () => void;
  onAddAnimal: (species: string, state: FaunaState, count: number) => number;
  onClearAnimals: () => void;
};

const zoomEases: { value: ZoomEase; label: string }[] = [
  { value: "Sine.easeOut", label: "Sine out" },
  { value: "Cubic.easeOut", label: "Cubic out" },
  { value: "Linear", label: "Linear" },
];

export function LiveGraphicsPanel({
  settings,
  zoom,
  onChange,
  onZoom,
  onClose,
  onReset,
  onAddAnimal,
  onClearAnimals,
}: Props) {
  const [tab, setTab] = useState<"tuning" | "perf" | "audio">("tuning");
  const [species, setSpecies] = useState("house-sparrow");
  const profile = faunaProfiles.find((candidate) => candidate.id === species)!;
  const states = Object.keys(profile.art) as FaunaState[];
  const [animalState, setAnimalState] = useState<FaunaState>(states[0]);
  const [animalCount, setAnimalCount] = useState(3);
  const [animalMessage, setAnimalMessage] = useState("");
  const chooseSpecies = (id: string) => {
    setSpecies(id);
    const next = faunaProfiles.find((candidate) => candidate.id === id)!;
    setAnimalState(Object.keys(next.art)[0] as FaunaState);
  };
  const addAnimals = () => {
    const added = onAddAnimal(species, animalState, animalCount);
    setAnimalMessage(
      added
        ? `${added} test ${added === 1 ? "animal" : "animals"} added nearby.`
        : "Go outdoors to add test animals.",
    );
  };
  const tune = (
    field: keyof LiveGraphicsSettings,
    label: string,
    min: number,
    max: number,
    step: number,
    suffix = "",
  ) => (
    <label>
      <span>
        {label}{" "}
        <output>
          {Number(settings[field]).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
          {suffix}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(settings[field])}
        onChange={(event) =>
          onChange({
            [field]: Number(event.currentTarget.value),
          } as Partial<LiveGraphicsSettings>)
        }
      />
    </label>
  );
  return (
    <aside className="live-graphics-panel" aria-label="Live graphics tuning">
      <header>
        <div>
          <span>LIVE RENDERER</span>
          <strong>{tab === "tuning" ? "Pixel tuning" : tab === "audio" ? "Sound tuning" : "Performance"}</strong>
        </div>
        <button aria-label="Close live graphics tuning" onClick={onClose}>
          <X size={16} />
        </button>
      </header>

      <FpsMeter />

      <div className="live-frame-cap" role="group" aria-label="Frame cap">
        <span>Frame cap</span>
        {([30, 60] as FrameCap[]).map((cap) => (
          <button
            key={cap}
            aria-pressed={settings.frameCap === cap}
            onClick={() => onChange({ frameCap: cap })}
          >
            {cap} fps
          </button>
        ))}
      </div>

      <div className="live-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "tuning"}
          onClick={() => setTab("tuning")}
        >
          Pixel tuning
        </button>
        <button
          role="tab"
          aria-selected={tab === "perf"}
          onClick={() => setTab("perf")}
        >
          Performance
        </button>
        <button
          role="tab"
          aria-selected={tab === "audio"}
          onClick={() => setTab("audio")}
        >
          Audio
        </button>
      </div>

      {tab === "audio" ? (
        <AudioTuningTab />
      ) : tab === "perf" ? (
        <PerformanceTab />
      ) : (
        <>
          <details className="live-tuning-section" open>
            <summary>Tilt-shift</summary>
            <label className="live-graphics-check">
              <input
                type="checkbox"
                checked={settings.tiltShift}
                onChange={(event) =>
                  onChange({ tiltShift: event.currentTarget.checked })
                }
              />
              Miniature lens
            </label>
            <label className="live-graphics-check">
              <input
                type="checkbox"
                checked={settings.tiltFollow}
                onChange={(event) =>
                  onChange({ tiltFollow: event.currentTarget.checked })
                }
              />
              Focus follows the player
            </label>
            {!settings.tiltFollow && tune("tiltFocus", "Focus height", 0, 1, 0.01)}
            {tune("tiltBand", "Sharp band", 0, 1, 0.01)}
            {tune("tiltFalloff", "Falloff", 0.02, 1, 0.01)}
            {tune("tiltBlur", "Blur", 0, 24, 0.5, " px")}
            {tune("tiltTopBias", "Extra blur above", 0, 2, 0.05)}
            {tune("tiltSaturation", "Saturation", 0, 2, 0.05)}
            {tune("tiltContrast", "Contrast", 0.5, 1.5, 0.01)}
            {tune("tiltVignette", "Vignette", 0, 1, 0.01)}
          </details>

          <details className="live-tuning-section" open>
            <summary>Rocks &amp; composition</summary>
            <label className="live-graphics-check">
              <input
                type="checkbox"
                checked={settings.previewRockDistribution}
                onChange={(event) =>
                  onChange({
                    previewRockDistribution: event.currentTarget.checked,
                  })
                }
              />
              Preview redistributed rocks
            </label>
            <p>
              Replaces visible rocks with a deterministic art-direction preview.
              Collision and saved worlds stay unchanged.
            </p>
            {tune("rockDensity", "Rock density", 0, 10, 0.1, " / 100 tiles")}
            {tune("rockAltitudeBias", "High-altitude bias", 0, 3, 0.1)}
            {tune("rockDrynessBias", "Dry-ground bias", 0, 3, 0.1)}
            {tune("rockClustering", "Rock clustering", 0, 1, 0.05)}
            {tune("rockClusterScale", "Cluster size", 2, 24, 1, " tiles")}
            {tune("groundDetailDensity", "Ground-mark density", 0, 2, 0.05)}
            {tune("groundDetailSpacing", "Ground-mark spacing", 0.6, 2.5, 0.05)}
            {tune("groundDetailClustering", "Quiet-patch contrast", 0, 2, 0.05)}
            {tune("groundMottle", "Ground mottling", 0, 2, 0.05)}
          </details>

          <details className="live-tuning-section" open>
            <summary>Vegetation palette</summary>
            <label>
              Basic tree art
              <select
                value={settings.treePalette}
                onChange={(event) =>
                  onChange({
                    treePalette: event.currentTarget.value as TreePalette,
                  })
                }
              >
                <option value="native">World / ecology default</option>
                <option value="sheet-pine">trees.png pine</option>
                <option value="sheet-broadleaf">trees.png broadleaf</option>
                <option value="oak">Oak strip</option>
                <option value="birch">Birch strip</option>
                <option value="cedar">Cedar strip</option>
                <option value="fir">Fir strip</option>
                <option value="hazel">Hazel strip</option>
                <option value="maple">Maple strip</option>
                <option value="willow">Willow strip</option>
                <option value="apple">Apple strip</option>
                <option value="cherry">Cherry blossom strip</option>
              </select>
            </label>
            {tune("treeScale", "Alternate tree scale", 0.35, 1.25, 0.05)}
            <label>
              Extra ground assets
              <select
                value={settings.litterPalette}
                onChange={(event) =>
                  onChange({
                    litterPalette: event.currentTarget.value as LitterPalette,
                  })
                }
              >
                <option value="none">None</option>
                <option value="woodland">Woodland logs &amp; brush</option>
                <option value="grassland">Grassland tufts</option>
                <option value="mixed">Mixed study sheet</option>
              </select>
            </label>
            {tune(
              "litterDensity",
              "Extra asset density",
              0,
              8,
              0.1,
              " / 100 tiles",
            )}
            <p>
              Uses trees.png and the transparent growth strips in trees pngs/.
              This is a visual study layer and does not add blockers.
            </p>
          </details>

          <details className="live-tuning-section" open>
            <summary>Paths</summary>
            <p>
              Visual wear only; routes, movement, and reservations do not
              change.
            </p>
            {tune("pathWidth", "Path width", 0.45, 2, 0.05)}
            {tune("pathWobble", "Center-line wander", 0, 4, 0.1)}
            {tune("pathEdgeBreakup", "Edge irregularity", 0, 3, 0.1)}
            {tune("pathFringe", "Verge tufts", 0, 2, 0.1)}
          </details>

          <details className="live-tuning-section">
            <summary>Camera &amp; sampling</summary>

            <label className="live-graphics-check">
              <input
                type="checkbox"
                checked={settings.roundPixels}
                onChange={(event) =>
                  onChange({ roundPixels: event.currentTarget.checked })
                }
              />
              Round camera pixels
            </label>
            <label className="live-graphics-check">
              <input
                type="checkbox"
                checked={settings.characterOutline}
                onChange={(event) =>
                  onChange({ characterOutline: event.currentTarget.checked })
                }
              />
              Outline characters
            </label>

            <label>
              Texture filtering
              <select
                value={settings.textureSampling}
                onChange={(event) =>
                  onChange({
                    textureSampling: event.currentTarget.value as
                      | "nearest"
                      | "linear",
                  })
                }
              >
                <option value="nearest">Nearest</option>
                <option value="linear">Linear</option>
              </select>
            </label>

            <label>
              Browser canvas sampling
              <select
                value={settings.canvasSampling}
                onChange={(event) =>
                  onChange({
                    canvasSampling: event.currentTarget.value as
                      | "pixelated"
                      | "auto",
                  })
                }
              >
                <option value="pixelated">Pixelated</option>
                <option value="auto">Smooth</option>
              </select>
            </label>

            <label>
              <span>
                Live zoom <output>{zoom.toFixed(2)}×</output>
              </span>
              <input
                aria-label="Live zoom"
                type="range"
                min="0.5"
                max="6"
                step="0.05"
                value={zoom}
                onChange={(event) => onZoom(Number(event.currentTarget.value))}
              />
            </label>

            <label>
              <span>
                Zoom transition <output>{settings.zoomDuration} ms</output>
              </span>
              <input
                aria-label="Zoom transition"
                type="range"
                min="0"
                max="400"
                step="10"
                value={settings.zoomDuration}
                onChange={(event) =>
                  onChange({ zoomDuration: Number(event.currentTarget.value) })
                }
              />
            </label>

            <label>
              Zoom easing
              <select
                value={settings.zoomEase}
                onChange={(event) =>
                  onChange({ zoomEase: event.currentTarget.value as ZoomEase })
                }
              >
                {zoomEases.map((ease) => (
                  <option key={ease.value} value={ease.value}>
                    {ease.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>
                Camera follow <output>{settings.followLerp.toFixed(2)}</output>
              </span>
              <input
                aria-label="Camera follow"
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={settings.followLerp}
                onChange={(event) =>
                  onChange({ followLerp: Number(event.currentTarget.value) })
                }
              />
            </label>
          </details>

          <section
            className="live-animal-controls"
            aria-labelledby="live-animals"
          >
            <div>
              <span>LIVE ANIMALS</span>
              <strong id="live-animals">Add to this map</strong>
            </div>
            <label>
              Species
              <select
                value={species}
                onChange={(event) => chooseSpecies(event.currentTarget.value)}
              >
                {faunaProfiles.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.label.replace(/ study$/, "")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Animation
              <select
                value={animalState}
                onChange={(event) =>
                  setAnimalState(event.currentTarget.value as FaunaState)
                }
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state[0].toUpperCase() + state.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                Count <output>{animalCount}</output>
              </span>
              <input
                aria-label="Test animal count"
                type="range"
                min="1"
                max="12"
                step="1"
                value={animalCount}
                onChange={(event) =>
                  setAnimalCount(Number(event.currentTarget.value))
                }
              />
            </label>
            <div className="live-animal-actions">
              <button onClick={addAnimals}>Add nearby</button>
              <button
                onClick={() => {
                  onClearAnimals();
                  setAnimalMessage("Test animals cleared.");
                }}
              >
                Clear test animals
              </button>
            </div>
            <p role="status">
              {animalMessage || "Visual test animals are not saved."}
            </p>
          </section>
        </>
      )}

      <footer>
        <span>⌘` / Ctrl+`</span>
        <button
          onClick={() => {
            if (tab === "perf") {
              resetPerf();
              setTerrainReach(0);
              reshadeTerrain();
            } else if (tab !== "audio") onReset();
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </footer>
    </aside>
  );
}

type ToggleKey = {
  [K in keyof PerfSwitches]: PerfSwitches[K] extends boolean ? K : never;
}[keyof PerfSwitches];

const perfToggles: { key: ToggleKey; label: string; hint: string }[] = [
  {
    key: "sceneryRebuilds",
    label: "Scenery rebuilds",
    hint: "Destroys and rebuilds every tree, plant, fence and building once the camera moves past the reach below. Off pins the current scenery.",
  },
  {
    key: "bankShadows",
    label: "Bank shadows",
    hint: "Rasterised per chunk install and on every sun change.",
  },
  {
    key: "ambientPeople",
    label: "Ambient people",
    hint: "The periodic full redraw of everyone in range.",
  },
  {
    key: "routineBuilding",
    label: "Routine building",
    hint: "Path searches for residents, spent a frame at a time.",
  },
  {
    key: "crowdSeparation",
    label: "Crowd spacing",
    hint: "O(n\u00b2) over the drawn crowd, every frame.",
  },
  {
    key: "characterPoses",
    label: "Character poses",
    hint: "Per-actor pose, water depth and frame selection.",
  },
  {
    key: "livingWater",
    label: "Living water",
    hint: "Animated water surfaces.",
  },
  { key: "fauna", label: "Animal frames", hint: "" },
  { key: "wind", label: "Wind sway", hint: "" },
  { key: "fires", label: "Fire flicker", hint: "" },
  { key: "ripples", label: "Ripples", hint: "" },
  { key: "buildingAnimations", label: "Roof animations", hint: "" },
  {
    key: "worldTicks",
    label: "World simulation ticks",
    hint: "Engine ticks while walking. Off freezes the simulation.",
  },
];

/** Diagnostic switches. Bisect a stutter by turning one off and walking. */
function PerformanceTab() {
  const [, bump] = useState(0);
  const set = (patch: Partial<PerfSwitches>) => {
    setPerf(patch);
    bump((n) => n + 1);
  };
  return (
    <>
      <section className="live-tuning-section live-perf">
        <p>
          Turn one thing off, walk for ten seconds, and watch the hitch counter
          above. Nothing here is saved.
        </p>
        <label>
          <span>
            Terrain install budget{" "}
            <output>
              {perf.terrainInstallBudget === 0
                ? "paused"
                : `${perf.terrainInstallBudget} ms/frame`}
            </output>
          </span>
          <input
            aria-label="Terrain install budget"
            type="range"
            min="0"
            max="16"
            step="1"
            value={perf.terrainInstallBudget}
            onChange={(event) =>
              set({ terrainInstallBudget: Number(event.currentTarget.value) })
            }
          />
        </label>
        <p>
          A chunk is composed in slices and stops when the budget runs out, so
          this caps the cost, not the amount of ground. Lower means smoother
          walking and terrain that fills in a little later. 0 freezes streaming
          entirely — the sharpest test of whether it is the cause.
        </p>
        <label>
          <span>
            Scenery rebuild reach <output>{perf.sceneryReach} cells</output>
          </span>
          <input
            aria-label="Scenery rebuild reach"
            type="range"
            min="8"
            max="48"
            step="4"
            value={perf.sceneryReach}
            onChange={(event) =>
              set({ sceneryReach: Number(event.currentTarget.value) })
            }
          />
        </label>
        <p>
          How far the camera may travel before the whole scenery cache is torn
          down and rebuilt in one frame. Raising it makes each rebuild bigger
          but much rarer; the meter above reports the cost and the gap.
        </p>
        <label>
          <span>
            Streaming reach{" "}
            <output>
              {perf.terrainReach === 0
                ? "uncapped"
                : `${perf.terrainReach} cells`}
            </output>
          </span>
          <input
            aria-label="Streaming reach"
            type="range"
            min="0"
            max="120"
            step="8"
            value={perf.terrainReach}
            onChange={(event) => {
              const cells = Number(event.currentTarget.value);
              set({ terrainReach: cells });
              setTerrainReach(cells);
            }}
          />
        </label>
      </section>

      <section className="live-tuning-section live-perf">
        <h4>Subsystems</h4>
        {perfToggles.map((toggle) => (
          <label key={toggle.key} className="live-graphics-check">
            <input
              type="checkbox"
              checked={perf[toggle.key]}
              onChange={(event) => {
                const on = event.currentTarget.checked;
                set({ [toggle.key]: on } as Partial<PerfSwitches>);
                if (toggle.key === "bankShadows") reshadeTerrain();
              }}
            />
            <span>
              {toggle.label}
              {toggle.hint && <em>{toggle.hint}</em>}
            </span>
          </label>
        ))}
      </section>

      <section className="live-tuning-section live-perf">
        <h4>Quality presets</h4>
        <div className="live-animal-actions">
          <button
            onClick={() => {
              set(defaultPerfSwitches);
              setTerrainReach(0);
              reshadeTerrain();
            }}
          >
            Everything on
          </button>
          <button
            onClick={() => {
              set({
                sceneryRebuilds: false,
                bankShadows: false,
                ambientPeople: false,
                routineBuilding: false,
                crowdSeparation: false,
                characterPoses: false,
                livingWater: false,
                fauna: false,
                wind: false,
                fires: false,
                ripples: false,
                buildingAnimations: false,
              });
              reshadeTerrain();
            }}
          >
            Bare minimum
          </button>
          <button
            onClick={() => {
              set({
                sceneryRebuilds: false,
                bankShadows: false,
                crowdSeparation: false,
              });
              reshadeTerrain();
            }}
          >
            Drop the expensive three
          </button>
        </div>
        <p>
          If &ldquo;bare minimum&rdquo; still stutters on a fixed cadence, the
          cost is terrain streaming or the engine tick, not the renderer.
        </p>
      </section>
    </>
  );
}
