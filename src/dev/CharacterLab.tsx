import { CharacterVillage } from "./CharacterVillage";
import { characterShadow } from "../render/characters/shadow";
import { lightingPresets, type LightingId } from "../render/lighting";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  headShapes,
  jawShapes,
  bodyShapes,
  postures,
  sleeveStyles,
  hemStyles,
  faceFromTraits,
  allowedHeights,
  heightLabels,
  beardStyles,
  generateAppearance,
  garments,
  hairStyles,
  headwear,
  originalAppearance,
  type CharacterAppearance,
} from "../core/character";
import { characterAppearanceSchema } from "../runtime/schema";
import type { Runtime } from "../runtime/session";
import { drawCharacter } from "../render/characters/draw";
import {
  poses,
  poseTiming,
  type CharacterPose,
} from "../render/characters/poses";
import {
  loadCarriedArt,
  portableProps,
  type CarriedArt,
} from "../render/characters/props";
import "./character-lab.css";
function initialAppearance(runtime?: Runtime) {
  if (runtime) return runtime.appearanceFor(runtime.engine.state.player);
  try {
    const encoded = new URLSearchParams(location.search).get("appearance");
    if (encoded)
      return characterAppearanceSchema.parse(JSON.parse(atob(encoded)));
  } catch {
    /* Invalid share links use the baseline. */
  }
  return originalAppearance;
}
function download(name: string, href: string) {
  const a = document.createElement("a");
  a.download = name;
  a.href = href;
  a.click();
}
export function CharacterLab({
  runtime,
  onClose,
}: {
  runtime?: Runtime;
  onClose?: () => void;
}) {
  const [appearance, setAppearance] = useState(() =>
    initialAppearance(runtime),
  );
  const [previewAge, setPreviewAge] = useState(
    () =>
      runtime?.engine.state.player.age ??
      (initialAppearance(runtime).height === -2 ? 3 : 30),
  );
  const [seed, setSeed] = useState(
    new URLSearchParams(location.search).get("seed") ?? "people-01",
  );
  const [batch, setBatch] = useState(0),
    [count, setCount] = useState(48),
    [selected, setSelected] = useState<number | null>(null);
  const [pose, setPose] = useState<CharacterPose>("walk"),
    [direction, setDirection] = useState(2),
    [playing, setPlaying] = useState(true),
    [frame, setFrame] = useState(0);
  const [prop, setProp] = useState("study-prop-stick-0"),
    [props, setProps] = useState(new Map<string, CarriedArt>()),
    [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(5),
    [background, setBackground] = useState("#829255"),
    [target, setTarget] = useState("player"),
    [locked, setLocked] = useState(false);
  const [lighting, setLighting] = useState<LightingId>("midday");
  const shadowCanvas = useRef<HTMLCanvasElement>(null);
  const hero = useRef<HTMLCanvasElement>(null),
    sheet = useRef<HTMLCanvasElement>(null),
    gallery = useRef<HTMLCanvasElement>(null),
    file = useRef<HTMLInputElement>(null);
  const variants = useMemo(
    () =>
      Array.from({ length: count }, (_, i) =>
        generateAppearance(`${seed}:${batch}`, i, previewAge),
      ),
    [seed, batch, count, previewAge],
  );
  const displayVariants = useMemo(
    () =>
      locked
        ? variants.map((a) => ({ ...a, wearing: appearance.wearing }))
        : variants,
    [variants, locked, appearance.wearing],
  );
  useEffect(() => {
    let active = true;
    void loadCarriedArt()
      .then((p) => {
        if (active) setProps(p);
      })
      .catch((e) => setMessage(String(e)));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let request = 0,
      last = -1;
    const buffer = document.createElement("canvas");
    buffer.width = 80;
    buffer.height = 80;
    const b = buffer.getContext("2d")!;
    const galleryPhases = new Map<number, HTMLCanvasElement>();
    let sheetPainted = false;
    const paint = (time: number) => {
      const f = playing ? Math.floor(time / poseTiming(pose)) % 4 : frame;
      if (last !== f) {
        last = f;
        const art = props.get(prop);
        drawCharacter(b, appearance, direction, pose, f, art);
        if (shadowCanvas.current) {
          const sc = shadowCanvas.current.getContext("2d")!;
          sc.clearRect(0, 0, 160, 96);
          sc.drawImage(characterShadow(buffer, lighting), 0, 0);
        }
        if (hero.current) {
          const c = hero.current.getContext("2d")!;
          c.clearRect(0, 0, 80, 80);
          c.drawImage(buffer, 0, 0);
          hero.current.dataset.frame = String(f);
        }
        if (sheet.current && !sheetPainted) {
          sheetPainted = true;
          const c = sheet.current.getContext("2d")!;
          c.clearRect(0, 0, 256, 224);
          for (let d = 0; d < 4; d++)
            for (let j = 0; j < 4; j++) {
              drawCharacter(b, appearance, d, pose, j, art);
              c.drawImage(buffer, 8, 24, 64, 56, j * 64, d * 56, 64, 56);
            }
        }
        if (gallery.current) {
          let page = galleryPhases.get(f);
          if (!page) {
            page = document.createElement("canvas");
            page.width = 384;
            page.height = Math.ceil(count / 6) * 56;
            const c = page.getContext("2d")!;
            displayVariants.forEach((a, i) => {
              drawCharacter(b, a, direction, pose, f, art);
              c.drawImage(
                buffer,
                8,
                24,
                64,
                56,
                (i % 6) * 64,
                Math.floor(i / 6) * 56,
                64,
                56,
              );
            });
            galleryPhases.set(f, page);
          }
          const c = gallery.current.getContext("2d")!;
          c.clearRect(0, 0, page.width, page.height);
          c.drawImage(page, 0, 0);
        }
      }
      request = requestAnimationFrame(paint);
    };
    request = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(request);
  }, [
    appearance,
    direction,
    pose,
    playing,
    frame,
    prop,
    props,
    count,
    displayVariants,
    lighting,
  ]);
  const change = <K extends keyof CharacterAppearance>(
    key: K,
    value: CharacterAppearance[K],
  ) => setAppearance((a) => ({ ...a, [key]: value }));
  const wear = <K extends keyof CharacterAppearance["wearing"]>(
    key: K,
    value: CharacterAppearance["wearing"][K],
  ) =>
    setAppearance((a) => ({ ...a, wearing: { ...a.wearing, [key]: value } }));
  const select = (
    label: string,
    value: string,
    values: readonly string[],
    onChange: (value: string) => void,
  ) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {values.map((v) => (
          <option key={v} value={v}>
            {label === "Facing"
              ? ["North", "East", "South", "West"][Number(v)]
              : label === "Height"
                ? heightLabels[Number(v) as CharacterAppearance["height"]]
                : label === "Build"
                  ? ["Original", "Broad", "Full"][Number(v)]
                  : v}
          </option>
        ))}
      </select>
    </label>
  );
  const color = (
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <label className="cl-color">
      {label}
      <input
        aria-label={label}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
  const exported = JSON.stringify(appearance, null, 2);
  const actors = runtime
    ? [
        runtime.engine.state.player,
        ...runtime.engine.state.actors.filter((a) => a.kind === "human"),
      ]
    : [];
  return (
    <div className="character-lab" data-modal={onClose ? "true" : undefined}>
      <header className="cl-header">
        <div>
          <span className="cl-eyebrow">
            UNIVERSAL HISTORY SIMULATOR / ART WORKSHOP
          </span>
          <h1>
            Character lab<span>01</span>
          </h1>
          <p>Small pixels. A world of people.</p>
        </div>
        <div className="cl-actions">
          <button
            onClick={() => {
              download(
                "character.json",
                `data:application/json;charset=utf-8,${encodeURIComponent(exported)}`,
              );
            }}
          >
            Export recipe
          </button>
          <button onClick={() => file.current?.click()}>Import recipe</button>
          <button
            onClick={async () => {
              const url = new URL("/character-lab", location.origin);
              url.searchParams.set("seed", seed);
              url.searchParams.set(
                "appearance",
                btoa(JSON.stringify(appearance)),
              );
              try {
                await navigator.clipboard.writeText(url.href);
                setMessage("Share link copied.");
              } catch {
                setMessage(url.href);
              }
            }}
          >
            Copy share link
          </button>
          {onClose ? (
            <button onClick={onClose}>Back to world ×</button>
          ) : (
            <a href="/">Back to world ↗</a>
          )}
        </div>
      </header>
      <input
        ref={file}
        type="file"
        accept=".json"
        hidden
        onChange={async (e) => {
          try {
            const f = e.target.files?.[0];
            if (f) {
              const imported = characterAppearanceSchema.parse(
                JSON.parse(await f.text()),
              );
              setAppearance(imported);
              if (imported.height === -2) setPreviewAge(3);
              else if (!allowedHeights(previewAge).includes(imported.height))
                setPreviewAge(30);
              setMessage("Recipe imported.");
            }
          } catch {
            setMessage(
              "Invalid recipe. Expected a character appearance JSON file.",
            );
          }
          e.target.value = "";
        }}
      />
      <div className="cl-layout">
        <aside className="cl-controls">
          <h2>Appearance</h2>
          <p className="cl-muted">
            Original height is the usual adult size. Smaller bodies are drawn on
            the same pixel grid; the smallest is reserved for children under
            six.
          </p>
          <label>
            Age for preview & population
            <input
              aria-label="Preview age"
              type="number"
              min={0}
              max={120}
              value={previewAge}
              onChange={(e) => {
                const age = Math.max(
                  0,
                  Math.min(120, Math.floor(Number(e.target.value))),
                );
                setPreviewAge(age);
                setAppearance((a) => ({
                  ...a,
                  height: age < 6 ? -2 : age < 16 ? -1 : 0,
                  ...(age < 16 ? { beard: "none", build: 0 } : {}),
                }));
              }}
            />
          </label>
          <div className="cl-two">
            {select(
              "Height",
              String(appearance.height),
              allowedHeights(previewAge).map(String),
              (v) =>
                change("height", Number(v) as CharacterAppearance["height"]),
            )}
            {select("Build", String(appearance.build), ["0", "1", "2"], (v) =>
              change("build", Number(v) as 0 | 1 | 2),
            )}
          </div>
          <div className="cl-two">
            {color("Complexion", appearance.skin, (v) => change("skin", v))}
            {color("Hair color", appearance.hairColor, (v) =>
              change("hairColor", v),
            )}
          </div>
          {select("Hairstyle", appearance.hair, hairStyles, (v) =>
            change("hair", v as CharacterAppearance["hair"]),
          )}
          {select("Facial hair", appearance.beard, beardStyles, (v) =>
            change("beard", v as CharacterAppearance["beard"]),
          )}
          {select(
            "Head shape",
            appearance.head ?? "original",
            headShapes,
            (v) => change("head", v as CharacterAppearance["head"]),
          )}
          {select("Jaw shape", appearance.jaw ?? "original", jawShapes, (v) =>
            change("jaw", v as CharacterAppearance["jaw"]),
          )}
          {select(
            "Body shape",
            appearance.bodyShape ?? "straight",
            bodyShapes,
            (v) => change("bodyShape", v as CharacterAppearance["bodyShape"]),
          )}
          {select(
            "Resting posture",
            appearance.posture ?? "upright",
            postures,
            (v) => change("posture", v as CharacterAppearance["posture"]),
          )}
          {select(
            "Physique profile",
            appearance.physique?.sex ?? "unspecified",
            ["unspecified", "male", "female"],
            (v) =>
              change("physique", {
                strength: appearance.physique?.strength ?? 50,
                sex: v as "male" | "female" | "unspecified",
              }),
          )}
          <label>
            Strength (appearance trait)
            <input
              aria-label="Strength"
              type="range"
              min="0"
              max="100"
              value={appearance.physique?.strength ?? 50}
              onChange={(e) =>
                change("physique", {
                  sex: appearance.physique?.sex ?? "unspecified",
                  strength: Number(e.target.value),
                })
              }
            />
          </label>
          <button
            onClick={() =>
              setAppearance((a) => ({
                ...a,
                ...faceFromTraits(
                  seed,
                  batch,
                  previewAge,
                  a.physique ?? { strength: 50, sex: "unspecified" },
                ),
              }))
            }
          >
            Generate face from traits
          </button>
          <h2>Wearing</h2>
          {select(
            "Sleeves",
            appearance.wearing.sleeves ?? "short",
            sleeveStyles,
            (v) =>
              wear("sleeves", v as CharacterAppearance["wearing"]["sleeves"]),
          )}
          {select("Hem", appearance.wearing.hem ?? "plain", hemStyles, (v) =>
            wear("hem", v as CharacterAppearance["wearing"]["hem"]),
          )}
          {select("Garment", appearance.wearing.garment, garments, (v) =>
            wear("garment", v as CharacterAppearance["wearing"]["garment"]),
          )}
          <div className="cl-two">
            {color("Cloth", appearance.wearing.color, (v) => wear("color", v))}
            {color("Trousers / skirt", appearance.wearing.lowerColor, (v) =>
              wear("lowerColor", v),
            )}
            {color("Trim", appearance.wearing.trim, (v) => wear("trim", v))}
            {color("Cloak color", appearance.wearing.cloakColor, (v) =>
              wear("cloakColor", v),
            )}
          </div>
          {select("Headwear", appearance.wearing.headwear, headwear, (v) =>
            wear("headwear", v as CharacterAppearance["wearing"]["headwear"]),
          )}
          <div className="cl-checks">
            {(["cloak", "necklace", "earrings", "shoulderCloth"] as const).map(
              (k) => (
                <label key={k}>
                  <input
                    type="checkbox"
                    checked={appearance.wearing[k] ?? false}
                    onChange={(e) => wear(k, e.target.checked)}
                  />
                  {k}
                </label>
              ),
            )}
          </div>
          <button
            onClick={() => {
              setAppearance(originalAppearance);
              setPreviewAge(30);
              setSelected(null);
            }}
          >
            Original body & palette
          </button>
          {runtime && (
            <>
              <h2>In the world</h2>
              <label>
                Character
                <select
                  aria-label="World character"
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    const a = actors.find((a) => a.id === e.target.value);
                    if (a) {
                      setAppearance(runtime.appearanceFor(a));
                      setPreviewAge(a.age ?? 30);
                    }
                  }}
                >
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="cl-primary"
                disabled={
                  !!runtime.replay ||
                  !allowedHeights(
                    actors.find((a) => a.id === target)?.age,
                  ).includes(appearance.height)
                }
                onClick={() => {
                  runtime.customizeCharacter(target, appearance);
                  setMessage(
                    "Appearance and worn clothing applied to the world.",
                  );
                }}
              >
                Apply appearance & clothing
              </button>
              {!allowedHeights(
                actors.find((a) => a.id === target)?.age,
              ).includes(appearance.height) && (
                <p className="cl-muted">
                  This size is not available for the selected character’s age.
                  Preview age does not change their age in the world.
                </p>
              )}
            </>
          )}
          <p className="cl-muted">
            Unrestricted art studies. These wardrobe combinations are not claims
            of historical dress.
          </p>
        </aside>
        <main className="cl-main">
          <section className="cl-stage">
            <div className="cl-stage-top">
              <h2>
                {selected === null
                  ? "Your character"
                  : `Variant ${String(selected + 1).padStart(2, "0")}`}
              </h2>
              <span>1 source pixel = 1 world pixel</span>
            </div>
            <div className="cl-preview" style={{ backgroundColor: background }}>
              <canvas
                className="cl-shadow"
                ref={shadowCanvas}
                width={160}
                height={96}
                aria-label="Character shadow"
                style={{
                  width: 160 * zoom,
                  height: 96 * zoom,
                  bottom: 96 - 64 * zoom,
                }}
              />
              <div className="cl-ground-line" />
              <canvas
                ref={hero}
                width={80}
                height={80}
                aria-label="Animated character preview"
                style={{ width: 80 * zoom, height: 80 * zoom }}
              />
              <span className="cl-preview-label">
                {pose} · {["north", "east", "south", "west"][direction]} ·{" "}
                {zoom}×
              </span>
            </div>
            <div className="cl-playback">
              <button
                className="cl-primary"
                onClick={() => setPlaying((v) => !v)}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setFrame((f) => (f + 1) % 4);
                }}
              >
                Step frame
              </button>
              {select(
                "Lighting",
                lighting,
                lightingPresets.map((p) => p.id),
                (v) => setLighting(v as LightingId),
              )}
              {select("Frame", String(frame), ["0", "1", "2", "3"], (v) => {
                setPlaying(false);
                setFrame(Number(v));
              })}
              {select("Facing", String(direction), ["0", "1", "2", "3"], (v) =>
                setDirection(Number(v)),
              )}
              {select(
                "Zoom",
                String(zoom),
                ["2", "3", "4", "5", "6", "8"],
                (v) => setZoom(Number(v)),
              )}
              {color("Ground", background, setBackground)}
            </div>
            <div className="cl-pose-buttons" aria-label="Animations">
              {poses.map((p) => (
                <button
                  className={pose === p ? "active" : ""}
                  key={p}
                  onClick={() => setPose(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="cl-held">
              Carrying
              <select
                aria-label="Carrying"
                value={prop}
                onChange={(e) => setProp(e.target.value)}
              >
                <option value="">Empty hands</option>
                {portableProps.map((p) => (
                  <option key={p.id} value={p.sprite}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="cl-section">
            <div className="cl-section-title">
              <div>
                <h2>Animation sheet</h2>
                <p>North, east, south, west · four keyframes per row</p>
              </div>
              <button
                onClick={() =>
                  sheet.current &&
                  download("character-animation.png", sheet.current.toDataURL())
                }
              >
                Export PNG
              </button>
            </div>
            <div className="cl-sheet" style={{ backgroundColor: background }}>
              <canvas
                ref={sheet}
                width={256}
                height={224}
                aria-label="Four direction animation sheet"
              />
            </div>
          </section>
          <section className="cl-section">
            <div className="cl-section-title">
              <div>
                <h2>Population study</h2>
                <p>Click any character to inspect and edit its recipe.</p>
              </div>
              <button
                onClick={() =>
                  gallery.current &&
                  download(
                    "character-population.png",
                    gallery.current.toDataURL(),
                  )
                }
              >
                Export PNG
              </button>
            </div>
            <div className="cl-generation">
              <label>
                Seed
                <input
                  aria-label="Population seed"
                  value={seed}
                  onChange={(e) => {
                    setSeed(e.target.value);
                    setBatch(0);
                  }}
                />
              </label>
              {select("Count", String(count), ["24", "48", "96", "192"], (v) =>
                setCount(Number(v)),
              )}
              <button
                className="cl-primary"
                onClick={() => {
                  setBatch((b) => b + 1);
                  setSelected(null);
                }}
              >
                Generate next batch
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => setLocked(e.target.checked)}
                />
                Same wardrobe
              </label>
              <span>Batch {batch + 1}</span>
            </div>
            <div className="cl-gallery" style={{ backgroundColor: background }}>
              <canvas
                ref={gallery}
                width={384}
                height={Math.ceil(count / 6) * 56}
                aria-label="Generated character variants"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const col = Math.floor(
                      ((e.clientX - rect.left) / rect.width) * 6,
                    ),
                    row = Math.floor(
                      ((e.clientY - rect.top) / rect.height) *
                        Math.ceil(count / 6),
                    ),
                    i = row * 6 + col;
                  if (displayVariants[i]) {
                    setAppearance(displayVariants[i]);
                    setSelected(i);
                  }
                }}
              />
            </div>
          </section>
          <CharacterVillage
            appearance={appearance}
            age={previewAge}
            prop={prop}
            lighting={lighting}
          />
          <details className="cl-section">
            <summary>Selected recipe · JSON</summary>
            <pre data-testid="character-recipe">{exported}</pre>
          </details>
          <p role="status" className="cl-status">
            {message}
          </p>
        </main>
      </div>
    </div>
  );
}
