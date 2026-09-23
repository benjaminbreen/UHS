import { communityFor } from "../content/characters/resolve";
import { formatHistoricalYear } from "../core/calendar";
import { randomStart } from "../content/geography/random-start";
import { curatedStart } from "../content/geography/curated-starts";
import { readStartMode } from "./start-mode";
import {
  Sparkles,
  Brain,
  Dices,
  Settings2,
  MapPin,
  CalendarDays,
  House,
  UserRound,
  ArrowRight,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import type { Engine } from "../core/engine";

import { places, featuredPlaces } from "../content/geography/places";
import { resolveSetting, settingFor } from "../content/geography/resolve";
import { StartPreview } from "./StartPreview";
import { settingSchema, type WorldSetting } from "../content/geography/types";
import { populateCharacter } from "../content/geography/character";
import { patterns, type Pattern } from "../content/settlements/profiles";
import { AtlasMap } from "./AtlasMap";
export function WorldSetup({
  onStart,
  initialSeed,
  initialPrompt = "",
  initialMode = "local",
  initialSetting,
}: {
  onStart: (engine: Engine) => void;
  initialSeed: string;
  initialSetting?: WorldSetting;
  initialPrompt?: string;
  initialMode?: "local" | "model";
}) {
  const [first] = useState(() => curatedStart());
  const [prompt, setPrompt] = useState(initialPrompt),
    [place, setPlace] = useState(initialSetting?.placeId ?? first.placeId),
    [year, setYear] = useState(String(initialSetting?.year ?? first.year)),
    [seed, setSeed] = useState(initialSeed),
    [mode, setMode] = useState<"local" | "model">(initialMode);
  const [role, setRole] = useState(
      initialSetting ? initialSetting.role : first.role,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [token, setToken] = useState("");
  const [community, setCommunity] = useState<
    WorldSetting["characterCommunity"]
  >(initialSetting?.characterCommunity);
  const [draft, setDraft] = useState(initialSetting);
  const [pattern, setPattern] = useState<Pattern | "">("");
  // The interpreted setting, kept beside the prompt it came from so a stale
  // preview never survives an edit.
  const [woven, setWoven] = useState<{ prompt: string; setting: WorldSetting }>();
  const [weaving, setWeaving] = useState(false);
  const [requiresCode, setRequiresCode] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const previewController = useRef<AbortController | null>(null);
  useEffect(() => {
    const local = new AbortController();
    void fetch("/api/world-weaver", { signal: local.signal })
      .then((r) => r.json())
      .then((r) => setRequiresCode(!!r?.requiresCode))
      .catch(() => {});
    return () => local.abort();
  }, []);
  useEffect(
    () => () => {
      controller.current?.abort();
      previewController.current?.abort();
    },
    [],
  );
  const chosen = places.find((p) => p.id === place) ?? places[0];
  const numericYear = Number(year);
  const validYear =
    year.trim() !== "" &&
    Number.isInteger(numericYear) &&
    numericYear >= -1000000 &&
    numericYear <= 10000;
  const resolved = prompt.trim()
    ? resolveSetting(prompt, seed.trim() || "earth-2")
    : {
        setting:
          draft ?? settingFor(chosen, validYear ? numericYear : chosen.year),
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
  const wovenSetting =
    woven && woven.prompt === prompt.trim() ? woven.setting : undefined;
  const previewSource = wovenSetting ?? localSetting;
  // The panel must read the setting the player will actually start in, so a
  // woven result overrides the procedural fallback in every field.
  const shown = previewSource;
  const preview = previewSource
    ? populateCharacter(
        {
          ...previewSource,
          ...(community
            ? { characterCommunity: community, characterName: "Traveler" }
            : {}),
          ...(role && role !== previewSource.role
            ? { role, characterName: role }
            : {}),
          ...(pattern ? { settlementPattern: pattern } : {}),
        },
        seed,
      )
    : undefined;
  const needsModel =
    !!prompt.trim() &&
    (!("setting" in resolved) || resolved.needsInterpretation === true);
  const choose = (id: string) => {
    const p = places.find((p) => p.id === id)!;
    setDraft(undefined);
    setCommunity(undefined);
    setWoven(undefined);
    setPlace(id);
    setYear(String(p.year));
    setPrompt("");
    setRole("");
    setError("");
  };
  const reroll = () => {
    const start = curatedStart(place);
    choose(start.placeId);
    setYear(String(start.year));
    setRole(start.role);
    setPattern("");
  };
  const randomize = () => {
    // Follows the choice made on the splash; this panel has no toggle of its own.
    const start = randomStart(readStartMode());
    choose(start.setting.placeId);
    setYear(String(start.setting.year));
    setSeed(start.seed);
    setRole(start.setting.role);
    setPattern("");
    setDraft(start.setting);
  };
  const editDetails = () => {
    setDraft(previewSource);
    setWoven(undefined);
    if (localSetting) {
      setPlace(localSetting.placeId);
      setYear(String(localSetting.year));
      setRole(localSetting.role);
    }
    setPrompt("");
  };

  const weave = async (text: string, signal: AbortSignal) => {
    const local = resolveSetting(text, seed.trim() || "earth-2");
    if (!("error" in local) && local.setting.situation) return local.setting;
    const response = await fetch("/api/world-weaver", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-World-Weaver-Code": token,
      },
      body: JSON.stringify({ prompt: text }),
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
    return settingSchema.parse(result.setting);
  };
  // Interpret on blur so the card shows the world the player will actually
  // start in, not the local fallback the request did not ask for.
  const askWeaver = async (next = prompt) => {
    const text = next.trim();
    if (mode !== "model" || !text || busy) return;
    if (requiresCode && !token) return;
    if (woven?.prompt === text) return;
    previewController.current?.abort();
    const local = new AbortController();
    previewController.current = local;
    setWeaving(true);
    setError("");
    try {
      setWoven({ prompt: text, setting: await weave(text, local.signal) });
    } catch (err) {
      if (!local.signal.aborted)
        setError(
          err instanceof Error ? err.message : "Could not interpret this start.",
        );
    } finally {
      if (!local.signal.aborted) setWeaving(false);
    }
  };

  const begin = async () => {
    setError("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const worldSeed = seed.trim() || "earth-2";
      let setting = wovenSetting ?? localSetting;
      if (mode === "model" && prompt.trim() && !wovenSetting)
        setting = await weave(
          prompt.trim() || `${chosen.name}, ${year}`,
          controller.current.signal,
        );
      if (!setting)
        throw Error(
          "error" in resolved
            ? resolved.error
            : "Enter a whole year between −1,000,000 and 10,000.",
        );
      const parsed = populateCharacter(
        settingSchema.parse({
          ...setting,
          ...(community
            ? { characterCommunity: community, characterName: "Traveler" }
            : {}),
          ...(role && role !== setting.role
            ? { role, characterName: role }
            : {}),
          ...(pattern ? { settlementPattern: pattern } : {}),
        }),
        worldSeed,
      );
      // The world takes seconds in the worker; the scene's code and art can be
      // on the way in the meantime.
      void import("../runtime/bootstrap");
      void import("../render/scene-assets").then((m) => m.warmSceneAssets());
      const { prepareConnectedStart } = await import("../runtime/map-travel");
      const engine = await prepareConnectedStart(
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
        {mode === "model" ? (
          <button
            className="random-start"
            disabled={busy || weaving || !prompt.trim()}
            onClick={() => void askWeaver()}
          >
            <Brain />
            {weaving ? "Weaving…" : "Preview"}
          </button>
        ) : (
          <button className="random-start" disabled={busy} onClick={randomize}>
            <Dices />
            Random start
          </button>
        )}
        <div>
          <input
            aria-label="Describe your starting situation"
            value={prompt}
            maxLength={2000}
            disabled={busy}
            onChange={(e) => {
              setPrompt(e.target.value);
              setWoven(undefined);
              setRole("");
            }}
            onBlur={() => void askWeaver()}
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
              setWoven(undefined);
              setRole("");
              void askWeaver(q);
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
            <div className="place-pick">
              <select
                aria-label="Place"
                value={
                  places.some((p) => p.id === shown?.placeId)
                    ? shown!.placeId
                    : place
                }
                disabled={busy}
                onChange={(e) => choose(e.target.value)}
              >
                {shown && !places.some((p) => p.id === shown.placeId) && (
                  <option value={shown.placeId}>{shown.location}</option>
                )}
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Another curated start"
                title="Another curated start"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  reroll();
                }}
              >
                <Dices />
              </button>
            </div>
          </label>
          <label className="weaver-field">
            <CalendarDays />
            <span>Starting year</span>
            <input
              aria-label="Starting year"
              type="number"
              value={prompt.trim() && shown ? shown.year : year}
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
                      encampment: "Herding camp",
                    }[p]
                  }
                </option>
              ))}
            </select>
          </label>
          {localSetting &&
            localSetting.lon >= -84 &&
            localSetting.lon <= -75 &&
            localSetting.lat >= 35 &&
            localSetting.lat <= 40 &&
            localSetting.year >= 1607 &&
            localSetting.year < 1750 && (
              <label className="weaver-field">
                <UserRound />
                <span>Starting community</span>
                <select
                  aria-label="Starting community"
                  disabled={busy}
                  value={community ?? communityFor(localSetting)}
                  onChange={(e) => {
                    setCommunity(
                      e.target.value as WorldSetting["characterCommunity"],
                    );
                    setDraft((previous) =>
                      previous
                        ? { ...previous, characterName: "Traveler" }
                        : previous,
                    );
                  }}
                >
                  <option value="english-colonial">
                    English colonial household
                  </option>
                  <option value="indigenous-local">
                    Indigenous local community
                  </option>
                  {localSetting.year >= 1619 && (
                    <option value="african-diaspora">
                      African-descended community
                    </option>
                  )}
                </select>
                <small>
                  Chooses this starting community, not the population of all
                  Virginia.
                </small>
              </label>
            )}
          <label className="weaver-field">
            <UserRound />
            <span>Role</span>
            <input
              aria-label="Role"
              placeholder="Choose from the setting"
              value={role || shown?.role || ""}
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
            lon={shown?.lon ?? chosen.lon}
            lat={shown?.lat ?? chosen.lat}
            onChoose={busy ? undefined : choose}
          />
          {weaving ? (
            <p className="weaver-route">World Weaver is interpreting this…</p>
          ) : (
            preview && <StartPreview setting={preview} />
          )}
        </div>
      </div>
      {prompt.trim() && (mode === "model" || needsModel) && (
        <p className="weaver-route">
          {mode !== "model"
            ? "Some details could not be matched. Refine your request or use World Weaver."
            : wovenSetting
              ? `World Weaver read this as ${wovenSetting.role} in ${wovenSetting.location}, ${formatHistoricalYear(wovenSetting.year)}. Begin, or edit the description and preview again.`
              : "Press Preview to see how World Weaver reads this request."}
        </p>
      )}
      {mode === "model" && requiresCode && (
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
