import { useEffect, useRef, useState } from "react";
import { createSession, createSettingSession } from "../runtime/session";
import type { Engine } from "../core/engine";
import { packs } from "../content/packs";
import { places, featuredPlaces } from "../content/geography/places";
import {
  describeSetting,
  resolveSetting,
  settingFor,
} from "../content/geography/resolve";
import { settingSchema } from "../content/geography/types";
import { populateCharacter } from "../content/geography/character";
import { patterns, type Pattern } from "../content/settlements/profiles";
import { AtlasMap } from "./AtlasMap";
export function WorldSetup({
  onStart,
  initialSeed,
}: {
  onStart: (engine: Engine) => void;
  initialSeed: string;
}) {
  const [prompt, setPrompt] = useState(""),
    [place, setPlace] = useState("rome"),
    [year, setYear] = useState("100"),
    [seed, setSeed] = useState(initialSeed),
    [mode, setMode] = useState<"local" | "model">("local");
  const [legacy, setLegacy] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [token, setToken] = useState("");
  const [pattern, setPattern] = useState<Pattern | "">("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const chosen = places.find((p) => p.id === place)!;
  const numericYear = Number(year);
  const validYear =
    year.trim() !== "" &&
    Number.isInteger(numericYear) &&
    numericYear >= -1000000 &&
    numericYear <= 10000;
  const resolved = prompt.trim()
    ? resolveSetting(prompt, seed.trim() || "earth-2")
    : {
        setting: settingFor(chosen, validYear ? numericYear : chosen.year),
        description: "",
        needsInterpretation: false,
      };
  const candidate =
    "setting" in resolved
      ? settingSchema.safeParse(resolved.setting)
      : undefined;
  const localSetting =
    candidate?.success && (prompt.trim() || validYear)
      ? candidate.data
      : undefined;
  const needsModel =
    !!prompt.trim() &&
    (!("setting" in resolved) || resolved.needsInterpretation === true);
  const choose = (id: string) => {
    const p = places.find((p) => p.id === id)!;
    setPlace(id);
    setYear(String(p.year));
    setPrompt("");
    setLegacy("");
    setError("");
  };
  const begin = async () => {
    setError("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const worldSeed = seed.trim() || "earth-2";
      if (legacy && !prompt.trim()) {
        onStart(createSession(legacy, worldSeed));
        return;
      }
      let setting = localSetting;
      if (mode === "model" && needsModel) {
        const response = await fetch("/api/world-weaver", {
          method: "POST",
          signal: controller.current.signal,
          headers: {
            "Content-Type": "application/json",
            "X-World-Weaver-Code": token,
          },
          body: JSON.stringify({
            prompt: prompt.trim() || `${chosen.name}, ${year}`,
          }),
        });
        const result = await response.json().catch(() => {
          throw Error(
            "World Weaver is not available on this server. Use procedural mode or configure the World Weaver endpoint.",
          );
        });
        if (!response.ok)
          throw Error(
            result.error ||
              "World Weaver could not interpret this setting. You can use procedural mode.",
          );
        setting = settingSchema.parse(result.setting);
      }
      if (!setting)
        throw Error(
          "error" in resolved
            ? resolved.error
            : "Enter a whole year between −1,000,000 and 10,000.",
        );
      const parsed = populateCharacter(
        settingSchema.parse({
          ...setting,
          ...(pattern ? { settlementPattern: pattern } : {}),
        }),
        worldSeed,
      );
      const engine = createSettingSession(parsed, worldSeed);
      if (!controller.current.signal.aborted) onStart(engine);
    } catch (err) {
      if (!controller.current?.signal.aborted)
        setError(
          err instanceof Error ? err.message : "Could not create the world.",
        );
    } finally {
      if (!controller.current?.signal.aborted) setBusy(false);
    }
  };
  return (
    <>
      <div className="eyebrow">WORLD WEAVER · EARTH, REIMAGINED</div>
      <h2>Where will you begin?</h2>
      <div
        className="weaver-modes"
        role="group"
        aria-label="World creation mode"
      >
        <button
          aria-pressed={mode === "local"}
          disabled={busy}
          onClick={() => setMode("local")}
        >
          Procedural · free / offline
        </button>
        <button
          aria-pressed={mode === "model"}
          disabled={busy}
          onClick={() => {
            setMode("model");
            setLegacy("");
          }}
        >
          World Weaver · LLM enabled
        </button>
      </div>
      <p>
        {mode === "local"
          ? "Places, periods, and roles resolve on your device. No model or account needed."
          : "Specific requests resolve locally. World Weaver interprets ambiguous or unmatched details, then the procedural engine builds the world."}
      </p>
      <label className="field-label">
        Describe your starting situation
        <input
          value={prompt}
          maxLength={2000}
          disabled={busy}
          onChange={(e) => {
            setPrompt(e.target.value);
            setLegacy("");
          }}
          placeholder="Elizabethan London · a farmer in 19th-century Haiti"
        />
      </label>
      <div className="weaver-examples">
        {[
          "Elizabethan London",
          "Hellenistic Alexandria",
          "Roman legionary in Umbria",
          "Free Black farmer in 19th century Haiti",
          "Paleolithic shaman Siberia",
          "Medieval Normandy",
          "Beijing 1450",
        ].map((q) => (
          <button
            key={q}
            disabled={busy}
            onClick={() => {
              setPrompt(q);
              setLegacy("");
            }}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="seed-row">
        <label className="field-label">
          Or choose a place
          <select
            value={localSetting?.placeId ?? place}
            disabled={busy}
            onChange={(e) => choose(e.target.value)}
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Starting year
          <input
            aria-label="Starting year"
            type="number"
            value={
              prompt.trim() && localSetting ? String(localSetting.year) : year
            }
            disabled={busy || !!prompt.trim()}
            onChange={(e) => {
              setYear(e.target.value);
              setLegacy("");
            }}
          />
          <small>
            Negative years use astronomical numbering: −99 = 100 BCE.
          </small>
        </label>
      </div>
      <label className="field-label">
        Settlement layout
        <select
          value={pattern}
          disabled={busy || !!legacy}
          onChange={(e) => setPattern(e.target.value as Pattern | "")}
        >
          <option value="">Choose from the setting</option>
          {patterns.map((p) => (
            <option key={p} value={p}>
              {
                {
                  farmstead: "Farmstead",
                  clustered: "Clustered village",
                  roadside: "Roadside village",
                  dense: "Dense town",
                  planned: "Planned streets",
                  waterfront: "Waterfront settlement",
                }[p]
              }
            </option>
          ))}
        </select>
      </label>
      <AtlasMap
        lon={localSetting?.lon ?? chosen.lon}
        lat={localSetting?.lat ?? chosen.lat}
        onChoose={busy ? undefined : choose}
      />
      {localSetting && (mode === "local" || !needsModel) && (
        <p className="weaver-preview" aria-label="Resolved setting">
          {describeSetting(localSetting)}
        </p>
      )}
      {prompt.trim() && (
        <p className="weaver-preview" aria-label="Interpretation route">
          {needsModel
            ? mode === "model"
              ? "World Weaver will interpret this request."
              : "Using a local fallback. Refine the place and period, or enable World Weaver for interpretation."
            : "Matched locally — no model request needed."}
        </p>
      )}
      {mode === "model" && needsModel && (
        <label className="field-label">
          World Weaver access code
          <input
            type="password"
            autoComplete="off"
            disabled={busy}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <small>
            Requires the optional server endpoint. Your model API key stays on
            the server.
          </small>
        </label>
      )}
      <div className="seed-row">
        <label className="field-label">
          World seed
          <input
            value={seed}
            maxLength={100}
            disabled={busy}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>
        <button
          disabled={busy}
          onClick={() =>
            setSeed(
              `world-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
            )
          }
        >
          Another seed
        </button>
      </div>
      <details open>
        <summary>Original worlds · compatible with earlier recordings</summary>
        <div className="weaver-examples">
          {Object.values(packs).map((p) => (
            <button
              key={p.id}
              aria-pressed={legacy === p.id}
              disabled={busy}
              onClick={() => {
                setLegacy(p.id);
                setPrompt("");
                setSeed(p.defaultSeed);
                setMode("local");
              }}
            >
              {p.subtitle}
            </button>
          ))}
        </div>
      </details>
      {legacy && <p>{packs[legacy].subtitle} · generator v1</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="modal-bottom">
        <span>
          Export the current world first if you want to keep a separate copy.
        </span>
        <button
          className="filled-button"
          disabled={busy}
          onClick={() => void begin()}
        >
          {busy ? "Weaving the world…" : "Enter this world"}
        </button>
      </div>
    </>
  );
}
export const worldExamples = featuredPlaces;
