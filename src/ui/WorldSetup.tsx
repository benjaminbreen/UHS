import { prepareSettingSession } from "../runtime/preparation";
import { randomStart } from "../content/geography/random-start";
import {
  Sparkles,
  Brain,
  Dices,
  Settings2,
  MapPin,
  CalendarDays,
  House,
  UserRound,
  Flag,
  ArrowRight,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import type { Engine } from "../core/engine";

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
  initialPrompt = "",
  initialMode = "local",
}: {
  onStart: (engine: Engine) => void;
  initialSeed: string;
  initialPrompt?: string;
  initialMode?: "local" | "model";
}) {
  const [prompt, setPrompt] = useState(initialPrompt),
    [place, setPlace] = useState("rome"),
    [year, setYear] = useState("100"),
    [seed, setSeed] = useState(initialSeed),
    [mode, setMode] = useState<"local" | "model">(initialMode);
  const [role, setRole] = useState(""),
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
    setRole("");
    setError("");
  };
  const randomize = () => {
    const start = randomStart();
    choose(start.setting.placeId);
    setYear(String(start.setting.year));
    setSeed(start.seed);
    setRole(start.setting.role);
    setPattern("");
  };
  const editDetails = () => {
    if (localSetting) {
      setPlace(localSetting.placeId);
      setYear(String(localSetting.year));
      setRole(localSetting.role);
    }
    setPrompt("");
  };

  const begin = async () => {
    setError("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const worldSeed = seed.trim() || "earth-2";
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
          ...(role ? { role, characterName: role } : {}),
          ...(pattern ? { settlementPattern: pattern } : {}),
        }),
        worldSeed,
      );
      const engine = await prepareSettingSession(
        parsed,
        worldSeed,
        controller.current.signal,
      );
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
    <div className="weaver">
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
          <Sparkles />
          <span>
            Procedural<small>Generate a random start</small>
          </span>
        </button>
        <button
          aria-pressed={mode === "model"}
          disabled={busy}
          onClick={() => setMode("model")}
        >
          <Brain />
          <span>
            World Weaver<small>Use AI to create a start</small>
          </span>
        </button>
      </div>
      <div className="weaver-prompt">
        <button className="random-start" disabled={busy} onClick={randomize}>
          <Dices />
          Random start
        </button>
        <div>
          <input
            aria-label="Describe your starting situation"
            value={prompt}
            maxLength={2000}
            disabled={busy}
            onChange={(e) => {
              setPrompt(e.target.value);
              setRole("");
            }}
            placeholder="Describe a place, period, and character…"
          />
          {prompt && (
            <button
              aria-label="Clear starting situation"
              disabled={busy}
              onClick={() => {
                editDetails();
              }}
            >
              <X />
            </button>
          )}
        </div>
      </div>
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
            aria-pressed={prompt === q}
            onClick={() => {
              setPrompt(q);
              setRole("");
            }}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="weaver-details">
        <div className="weaver-manual">
          <h3>
            <Settings2 />
            Set the details manually
          </h3>
          <label className="weaver-field">
            <MapPin />
            <span>Place</span>
            <select
              aria-label="Place"
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
          <label className="weaver-field">
            <CalendarDays />
            <span>Starting year</span>
            <input
              aria-label="Starting year"
              type="number"
              value={prompt.trim() && localSetting ? localSetting.year : year}
              disabled={busy}
              onChange={(e) => {
                editDetails();
                setYear(e.target.value);
              }}
            />
            <small>
              Negative years use astronomical numbering (−99 = 100 BCE).
            </small>
          </label>
          <label className="weaver-field">
            <House />
            <span>Settlement layout</span>
            <select
              value={pattern}
              disabled={busy}
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
          <label className="weaver-field">
            <UserRound />
            <span>Role</span>
            <input
              aria-label="Role"
              placeholder="Choose from the setting"
              value={role || localSetting?.role || ""}
              disabled={busy}
              onChange={(e) => {
                editDetails();
                setRole(e.target.value);
              }}
            />
          </label>
        </div>
        <div className="weaver-location">
          <h3>
            <MapPin />
            Location on the world
          </h3>
          <AtlasMap
            lon={localSetting?.lon ?? chosen.lon}
            lat={localSetting?.lat ?? chosen.lat}
            onChoose={busy ? undefined : choose}
          />
          <div className="weaver-result" aria-label="Resolved setting">
            <h4>
              <Flag />
              Resulting start
            </h4>
            <p>
              {localSetting
                ? describeSetting({
                    ...localSetting,
                    ...(role ? { role } : {}),
                  })
                : "Describe your setting or choose the details."}
            </p>
            <small>
              {pattern
                ? pattern.charAt(0).toUpperCase() +
                  pattern.slice(1) +
                  " settlement"
                : "Settlement shaped by the setting"}
            </small>
          </div>
        </div>
      </div>
      {prompt.trim() && needsModel && (
        <p className="weaver-route">
          {mode === "model"
            ? "World Weaver will interpret this request."
            : "Some details could not be matched. Refine your request or use World Weaver."}
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
        </label>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="weaver-bottom">
        <button
          className="filled-button"
          disabled={busy}
          onClick={() => void begin()}
        >
          {busy ? (
            "Weaving the world…"
          ) : (
            <>
              Begin <ArrowRight />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
export const worldExamples = featuredPlaces;
