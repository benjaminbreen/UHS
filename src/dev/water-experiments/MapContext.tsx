import { useRef, useState } from "react";
import { shorePolishDefaults } from "../../render/living-water/polish";
const initial = {
  ...shorePolishDefaults,
  ecology: "tropical-woodland",
  season: "summer",
  water:
    new URLSearchParams(location.search).get("context") === "coast"
      ? "coast-n"
      : "river-ns",
  seed: "water-review",
};
export function MapContext({ onBack }: { onBack: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState(initial),
    [applied, setApplied] = useState(initial),
    [comparison, setComparison] = useState(false);
  const params = new URLSearchParams({
    waterContext: "true",
    polish: String(!comparison),
    ecology: applied.ecology,
    season: applied.season,
    water: applied.water,
    seed: applied.seed,
    landform: "plain",
    population: "none",
    start: "wanderer",
    blend: String(applied.blend),
    plants: String(applied.plants),
    rocks: String(applied.rocks),
    ripples: String(applied.ripples),
    coastScallop: String(applied.coastScallop ?? 1.4),
    coastScale: String(applied.coastScale ?? 18),
    coastBeachWidth: String(applied.coastBeachWidth ?? 8),
    beachVariation: String(applied.beachVariation ?? 0.5),
    offshoreCalm: String(applied.offshoreCalm ?? 0.95),
  });
  const save = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { schema: "uhs-shoreline-context", version: 1, settings: applied },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "shoreline-context.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <main className="water-lab water-map-context">
      <header>
        <div>
          <button onClick={onBack}>← Water studies</button>
          <p className="water-eyebrow">RENDERING WORKSHOP / 02</p>
          <h1>Shoreline in context</h1>
          <p>Real map terrain · drag to explore · scroll to zoom</p>
        </div>
        <span className="water-badge">LIVE MAP STUDY</span>
      </header>
      <section className="water-controls" aria-label="Map context controls">
        <label>
          Map ecology
          <select
            value={draft.ecology}
            onChange={(e) => setDraft({ ...draft, ecology: e.target.value })}
          >
            {[
              "tropical-woodland",
              "temperate-woodland",
              "wetland",
              "desert",
              "dry-scrub",
              "boreal-woodland",
              "tundra",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Season
          <select
            value={draft.season}
            onChange={(e) => setDraft({ ...draft, season: e.target.value })}
          >
            {["spring", "summer", "autumn", "winter"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Water feature
          <select
            value={draft.water}
            onChange={(e) => setDraft({ ...draft, water: e.target.value })}
          >
            {["river-ns", "river-ew", "lake", "coast-n"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Map seed
          <input
            value={draft.seed}
            onChange={(e) => setDraft({ ...draft, seed: e.target.value })}
          />
        </label>
        {(
          [
            ["blend", "Bank transition"],
            ["plants", "Shoreline plants"],
            ["rocks", "Stone clusters"],
            ["ripples", "Edge wavelets"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label} · {Math.round(draft[key] * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={draft[key]}
              onChange={(e) =>
                setDraft({ ...draft, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        {(
          [
            ["coastScallop", "Coastal scallop depth", 0, 4, 0.1],
            ["coastScale", "Coastal scallop size", 4, 40, 1],
            ["coastBeachWidth", "Ocean beach width", 1, 16, 0.25],
            ["beachVariation", "Outer beach variation", 0, 1, 0.05],
            ["offshoreCalm", "Offshore calmness", 0, 1, 0.05],
          ] as const
        ).map(([key, label, min, max, step]) => (
          <label key={key}>
            {label} · {draft[key]}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={draft[key]}
              onChange={(e) =>
                setDraft({ ...draft, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        <button onClick={() => setApplied({ ...draft })}>Apply to map</button>
        <button
          aria-pressed={comparison}
          onClick={() => setComparison(!comparison)}
        >
          {comparison ? "Show shoreline polish" : "Compare current C"}
        </button>
        <button
          onClick={() => {
            const w = frame.current?.contentWindow as
              | (Window & {
                  terrainLab?: {
                    scene: { options: { waterAnimation: boolean } };
                  };
                })
              | null;
            if (w?.terrainLab)
              w.terrainLab.scene.options.waterAnimation = paused;
            setPaused(!paused);
          }}
        >
          {paused ? "Animate water" : "Pause water"}
        </button>
        <button onClick={save}>Save map settings JSON</button>
      </section>
      <p role="status">
        {comparison ? "Current C" : "Shoreline polish"} · {applied.ecology} ·{" "}
        {applied.season}. Changes take effect with “Apply to map”.
      </p>
      <iframe
        ref={frame}
        onLoad={() => setPaused(false)}
        title="Live shoreline map"
        src={"/terrain-lab?" + params}
        style={{
          width: "100%",
          height: "min(78vh,900px)",
          minHeight: 520,
          border: "1px solid #40595c",
          borderRadius: 8,
          background: "#20362f",
        }}
      />
    </main>
  );
}
