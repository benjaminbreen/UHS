import { useEffect, useMemo, useRef, useState } from "react";
import {
  browShapes,
  chinShapes,
  earOrnaments,
  eyeShapes,
  eyeSizes,
  eyeSpacings,
  faceDetails,
  faceMarks,
  generateAppearance,
  generateFace,
  hairlines,
  hairTextures,
  markStyles,
  mouthShapes,
  noseOrnaments,
  noseShapes,
  ornamentMetals,
  type CharacterAppearance,
  type CharacterFace,
  type FaceAdornment,
} from "../core/character";
import { random } from "../core/random";
import type { Runtime } from "../runtime/session";
import {
  constructedDefaults,
  constructedRanges,
  expressions,
  type ConstructedTuning,
  type Expression,
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
  const [expression, setExpression] = useState<Expression>("neutral");
  const options = useMemo<PortraitRenderOptions>(
    () => ({ tuning, expression }),
    [tuning, expression],
  );
  const tuned = (Object.keys(tuning) as (keyof ConstructedTuning)[]).filter(
    (key) => tuning[key] !== constructedDefaults[key],
  );
  const [gridSize, setGridSize] = useState(12);
  const [mixedAges, setMixedAges] = useState(false);
  // Ages sampled per cell when mixed: a spread of children, adults and elders.
  const studyAges = useMemo(
    () =>
      Array.from({ length: gridSize }, (_, index) => {
        if (!mixedAges) return age;
        const roll = random(`${seed}:${batch}`, "study-age", index);
        const span = random(`${seed}:${batch}`, "study-age-span", index);
        return roll < 0.15
          ? 4 + Math.floor(span * 9)
          : roll < 0.25
            ? 13 + Math.floor(span * 5)
            : roll < 0.8
              ? 18 + Math.floor(span * 37)
              : 55 + Math.floor(span * 26);
      }),
    [gridSize, mixedAges, seed, batch, age],
  );
  const generated = useMemo(
    () =>
      studyAges.map((studyAge, index) =>
        generateAppearance(`${seed}:${batch}`, index, studyAge),
      ),
    [seed, batch, studyAges],
  );
  const shuffle = () => {
    setSeed(`shuffle-${Math.random().toString(36).slice(2, 8)}`);
    setActorId("generated-0");
  };
  const actorIndex = Number(actorId.replace("generated-", ""));
  const live = liveActors.find((actor) => actor.id === actorId);
  const base = live
    ? runtime!.appearanceFor(live)
    : (generated[Number.isFinite(actorIndex) ? actorIndex : 0] ?? generated[0]);
  const activeAge =
    live?.age ??
    (Number.isFinite(actorIndex) ? studyAges[actorIndex] : undefined) ??
    age;
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
  const adornment: FaceAdornment = edited.adornment ?? {};
  const adorn = <T extends string>(
    label: string,
    key: keyof FaceAdornment,
    values: readonly T[],
  ) => (
    <label>
      {label}
      <select
        value={(adornment[key] as string | undefined) ?? values[0]}
        aria-label={label}
        onChange={(event) =>
          setEdited((current) => ({
            ...current,
            adornment: {
              ...(current.adornment ?? {}),
              [key]: event.target.value,
            },
          }))
        }
      >
        {values.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
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
          <button onClick={shuffle}>Shuffle seed</button>
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
          <h2>
            Ornament <small>worn and worked into the skin</small>
          </h2>
          <div className="portrait-control-grid">
            {adorn("Ear ornament", "ears", earOrnaments)}
            {adorn("Nose ornament", "nose", noseOrnaments)}
            {adorn("Face marks", "marks", faceMarks)}
            {adorn("Mark style", "markStyle", markStyles)}
            {adorn("Ornament metal", "metal", ornamentMetals)}
          </div>
          <h2>
            Expression <small>renderer C</small>
          </h2>
          <label>
            Expression
            <select
              aria-label="Expression"
              value={expression}
              onChange={(event) =>
                setExpression(event.target.value as Expression)
              }
            >
              {expressions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
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

          <section className="portrait-expression-sheet">
            <header>
              <h2>Expressions</h2>
              <p>
                One face, twelve poses. Every pose is a set of pixel offsets to
                the brows, lids, mouth and gaze — the drawing underneath is the
                same recipe, so the person stays recognisable.
              </p>
            </header>
            <div className="portrait-expression-strip">
              {expressions.map((option) => (
                <button
                  key={option}
                  aria-pressed={expression === option}
                  onClick={() => setExpression(option)}
                  title={option}
                >
                  <PortraitCanvas
                    system={portraitSystems[2]}
                    appearance={edited}
                    age={activeAge}
                    label={`${live?.name ?? "Study"}, ${option}`}
                    options={{ tuning, expression: option }}
                  />
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="portrait-contact-section">
            <header>
              <div>
                <h2>Contact sheet</h2>
                <p>
                  {gridSize} deterministic recipes from the seed through{" "}
                  {sheetSystem.label}. Pick a single renderer tab to switch the
                  sheet; shuffle or start a new batch for fresh faces.
                </p>
              </div>
              <div className="portrait-sheet-controls">
                <label>
                  Grid
                  <select
                    aria-label="Grid size"
                    value={gridSize}
                    onChange={(event) => {
                      setGridSize(Number(event.target.value));
                      setActorId("generated-0");
                    }}
                  >
                    {[12, 24, 48].map((size) => (
                      <option key={size} value={size}>
                        {size} faces
                      </option>
                    ))}
                  </select>
                </label>
                <label className="portrait-check">
                  <input
                    type="checkbox"
                    checked={mixedAges}
                    onChange={(event) => setMixedAges(event.target.checked)}
                  />
                  Mixed ages
                </label>
                <button onClick={shuffle}>Shuffle</button>
              </div>
            </header>
            <div className="portrait-contact-sheet" data-size={gridSize}>
              {generated.map((appearance, index) => (
                <button
                  key={index}
                  aria-pressed={actorId === `generated-${index}`}
                  onClick={() => setActorId(`generated-${index}`)}
                  title={`Study ${index + 1} · age ${studyAges[index]}`}
                >
                  <PortraitCanvas
                    system={sheetSystem}
                    appearance={appearance}
                    age={studyAges[index]}
                    label={`Generated study ${index + 1}`}
                    options={options}
                  />
                  <span>
                    {String(index + 1).padStart(2, "0")}
                    {mixedAges ? ` · ${studyAges[index]}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
