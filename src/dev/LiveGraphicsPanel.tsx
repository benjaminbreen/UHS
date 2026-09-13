import { RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { faunaProfiles } from "../content/fauna";
import type { FaunaState } from "../core/fauna";
import { FpsMeter } from "../ui/FpsMeter";
import type { LiveGraphicsSettings, ZoomEase } from "../render/live-graphics";

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
  return (
    <aside className="live-graphics-panel" aria-label="Live graphics tuning">
      <header>
        <div>
          <span>LIVE RENDERER</span>
          <strong>Pixel tuning</strong>
        </div>
        <button aria-label="Close live graphics tuning" onClick={onClose}>
          <X size={16} />
        </button>
      </header>

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
              canvasSampling: event.currentTarget.value as "pixelated" | "auto",
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

      <label className="live-graphics-check">
        <input
          type="checkbox"
          checked={settings.showFps}
          onChange={(event) =>
            onChange({ showFps: event.currentTarget.checked })
          }
        />
        Show frame meter
      </label>

      <section className="live-animal-controls" aria-labelledby="live-animals">
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

      <footer>
        <span>⌘` / Ctrl+`</span>
        <button onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </footer>
      {settings.showFps && <FpsMeter />}
    </aside>
  );
}
