import { useEffect, useMemo, useRef, useState } from "react";
import {
  browShapes,
  chinShapes,
  eyeShapes,
  eyeSizes,
  eyeSpacings,
  faceDetails,
  generateAppearance,
  generateFace,
  hairlines,
  hairTextures,
  mouthShapes,
  noseShapes,
  type CharacterAppearance,
  type CharacterFace,
} from "../core/character";
import type { Runtime } from "../runtime/session";
import {
  constructedDefaults,
  constructedRanges,
  type ConstructedTuning,
} from "../render/portraits/constructed";
import {
  portraitSystems,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  type PortraitRenderOptions,
  type PortraitSystem,
} from "../render/portraits/systems";
import "./portrait-lab.css";

function PortraitCanvas({
  system,
  appearance,
  age,
  label,
  options,
}: {
  system: PortraitSystem;
  appearance: CharacterAppearance;
  age: number;
  label: string;
  options?: PortraitRenderOptions;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (context && system.render)
      system.render(context, appearance, age, options);
  }, [system, appearance, age, options]);
  return system.render ? (
    <canvas
      ref={canvas}
      width={PORTRAIT_WIDTH}
      height={PORTRAIT_HEIGHT}
      role="img"
      aria-label={`${label}, rendered with ${system.label}`}
    />
  ) : (
    <div className="portrait-missing" role="img" aria-label={system.label}>
      <span>B</span>
      Renderer slot ready
    </div>
  );
}

function withFace(
  appearance: CharacterAppearance,
  seed: string,
  age: number,
): CharacterAppearance & { face: CharacterFace } {
  return {
    ...appearance,
    face: appearance.face ?? generateFace(seed, 0, age),
  };
}

export function PortraitLab({
  runtime,
  onClose,
}: {
  runtime?: Runtime;
  onClose?: () => void;
}) {
  const liveActors = runtime
    ? [
        runtime.engine.state.player,
        ...runtime.engine.state.actors.filter(
          (actor) => actor.kind === "human",
        ),
      ]
    : [];
  const [seed, setSeed] = useState("portrait-study-01");
  const [batch, setBatch] = useState(0);
  const [age, setAge] = useState(30);
  const [actorId, setActorId] = useState(liveActors[0]?.id ?? "generated-0");
  const [view, setView] = useState<string>("all");
  const [tuning, setTuning] = useState<ConstructedTuning>(constructedDefaults);
  const options = useMemo<PortraitRenderOptions>(() => ({ tuning }), [tuning]);
  const tuned = (Object.keys(tuning) as (keyof ConstructedTuning)[]).filter(
    (key) => tuning[key] !== constructedDefaults[key],
  );
  const generated = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        generateAppearance(`${seed}:${batch}`, index, age),
      ),
    [seed, batch, age],
  );
  const actorIndex = Number(actorId.replace("generated-", ""));
  const live = liveActors.find((actor) => actor.id === actorId);
  const base = live
    ? runtime!.appearanceFor(live)
    : (generated[Number.isFinite(actorIndex) ? actorIndex : 0] ?? generated[0]);
  const activeAge = live?.age ?? age;
  const [edited, setEdited] = useState<CharacterAppearance>(() =>
    withFace(base, seed, activeAge),
  );
  useEffect(() => {
    setEdited(withFace(base, `${seed}:${actorId}`, activeAge));
  }, [base, seed, actorId, activeAge]);
  const face = edited.face!;
  const changeFace = <K extends keyof CharacterFace>(
    key: K,
    value: CharacterFace[K],
  ) =>
    setEdited((current) => ({
      ...current,
      face: { ...current.face!, [key]: value },
    }));
  const visibleSystems = portraitSystems.filter(
    (system) => view === "all" || system.id === view,
  );
  const sheetSystem =
    visibleSystems.length === 1 ? visibleSystems[0] : portraitSystems[0];
  const letter = (system: PortraitSystem) => system.label.split(" ")[0];
  const select = <T extends string>(
    label: string,
    key: keyof CharacterFace,
    value: T,
    values: readonly T[],
  ) => (
    <label>
      {label}
      <select
        value={value}
        aria-label={label}
        onChange={(event) =>
          changeFace(key, event.target.value as CharacterFace[typeof key])
        }
      >
        {values.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );

  return (
    <main className="portrait-lab" data-modal={onClose ? "true" : undefined}>
      <header className="portrait-lab-header">
        <div>
          <span>UNIVERSAL HISTORY SIMULATOR / ART WORKSHOP</span>
          <h1>
            Portrait lab <small>64 × 80 native pixels</small>
          </h1>
          <p>
            One character recipe, three renderer slots, identical test subjects.
          </p>
        </div>
        <div className="portrait-lab-actions">
          <button onClick={() => setBatch((value) => value + 1)}>
            New batch
          </button>
          {onClose ? (
            <button onClick={onClose}>Back to world ×</button>
          ) : (
            <a href="/">Back to world ↗</a>
          )}
        </div>
      </header>

      <div className="portrait-lab-layout">
        <aside className="portrait-controls">
          <h2>Test subject</h2>
          {liveActors.length ? (
            <label>
              Character
              <select
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
              >
                {liveActors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name} · {actor.role}
                  </option>
                ))}
                {generated.map((_, index) => (
                  <option key={index} value={`generated-${index}`}>
                    Generated study {index + 1}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Study
              <select
                value={actorId}
                onChange={(event) => setActorId(event.target.value)}
              >
                {generated.map((_, index) => (
                  <option key={index} value={`generated-${index}`}>
                    Generated study {index + 1}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Seed
            <input
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
            />
          </label>
          {!live && (
            <label>
              Age
              <input
                type="number"
                min="0"
                max="100"
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
              />
            </label>
          )}
          <h2>
            Face recipe <small>revision {face.revision}</small>
          </h2>
          <div className="portrait-control-grid">
            {select("Eye size", "eyeSize", face.eyeSize, eyeSizes)}
            {select("Eye shape", "eyeShape", face.eyeShape, eyeShapes)}
            {select("Eye spacing", "eyeSpacing", face.eyeSpacing, eyeSpacings)}
            {select("Brows", "brows", face.brows, browShapes)}
            {select("Nose", "nose", face.nose, noseShapes)}
            {select("Mouth", "mouth", face.mouth, mouthShapes)}
            {select("Chin", "chin", face.chin, chinShapes)}
            {select(
              "Hair texture",
              "hairTexture",
              face.hairTexture,
              hairTextures,
            )}
            {select("Hairline", "hairline", face.hairline, hairlines)}
            {select("Face detail", "detail", face.detail, faceDetails)}
          </div>
          <details>
            <summary>Semantic recipe</summary>
            <pre>{JSON.stringify(edited, null, 2)}</pre>
          </details>
          <h2>
            Construction <small>renderer C defaults</small>
          </h2>
          <div className="portrait-tuning">
            {(
              Object.keys(constructedRanges) as (keyof ConstructedTuning)[]
            ).map((key) => {
              const range = constructedRanges[key];
              return (
                <label key={key}>
                  <span>
                    {range.label}
                    <output>{tuning[key]}</output>
                  </span>
                  <input
                    type="range"
                    aria-label={range.label}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={tuning[key]}
                    onChange={(event) =>
                      setTuning((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>
          <div className="portrait-tuning-actions">
            <button
              onClick={() => setTuning(constructedDefaults)}
              disabled={!tuned.length}
            >
              Reset construction
            </button>
          </div>
          <details open={tuned.length > 0}>
            <summary>Tuning to bake in</summary>
            <pre>
              {tuned.length
                ? JSON.stringify(
                    Object.fromEntries(tuned.map((k) => [k, tuning[k]])),
                    null,
                    2,
                  )
                : "All at defaults."}
            </pre>
          </details>
        </aside>

        <section className="portrait-workbench">
          <div
            className="portrait-view-tabs"
            role="tablist"
            aria-label="Portrait comparison"
          >
            {["all", ...portraitSystems.map((system) => system.id)].map(
              (id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                >
                  {id === "all"
                    ? portraitSystems.map(letter).join(" / ")
                    : `${letter(portraitSystems.find((s) => s.id === id)!)} only`}
                </button>
              ),
            )}
          </div>
          <div
            className="portrait-comparison"
            data-count={visibleSystems.length}
          >
            {visibleSystems.map((system) => (
              <article key={system.id}>
                <header>
                  <h2>{system.label}</h2>
                  <p>{system.description}</p>
                </header>
                <div className="portrait-stage">
                  <PortraitCanvas
                    system={system}
                    appearance={edited}
                    age={activeAge}
                    label={live?.name ?? `Generated study ${actorIndex + 1}`}
                    options={options}
                  />
                </div>
              </article>
            ))}
          </div>

          <section className="portrait-contact-section">
            <header>
              <h2>Contact sheet</h2>
              <p>
                The same twelve deterministic recipes through{" "}
                {sheetSystem.label}. Pick a single renderer tab to switch the
                sheet.
              </p>
            </header>
            <div className="portrait-contact-sheet">
              {generated.map((appearance, index) => (
                <button
                  key={index}
                  aria-pressed={actorId === `generated-${index}`}
                  onClick={() => setActorId(`generated-${index}`)}
                >
                  <PortraitCanvas
                    system={sheetSystem}
                    appearance={appearance}
                    age={age}
                    label={`Generated study ${index + 1}`}
                    options={options}
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
