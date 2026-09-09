import { prepareSettingSession } from "../../runtime/preparation";
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Runtime } from "../../runtime/session";
import { WorldScene } from "../../render/WorldScene";
import type { RenderOptions } from "../../render/appearance";
import {
  ecologies,
  ecologyProfiles,
  landforms,
  populations,
  starts,
  householdForms,
} from "../../content/ecology/profiles";
import { patterns } from "../../content/settlements/profiles";
import { waters, type WorldSetting } from "../../content/geography/types";
import { settingFor } from "../../content/geography/resolve";
import { places } from "../../content/geography/places";
import { App } from "../../ui/App";

type Config = {
  place?: string;
  seed: string;
  ecology: (typeof ecologies)[number];
  landform: (typeof landforms)[number];
  population: (typeof populations)[number];
  start: (typeof starts)[number];
  household: (typeof householdForms)[number];
  pattern: (typeof patterns)[number] | "camp";
  water: (typeof waters)[number];
  season: WorldSetting["season"];
  year: number;
};
const defaults: Config = {
  seed: "ecology-01",
  ecology: "temperate-woodland",
  landform: "rolling",
  population: "sparse",
  start: "resident",
  household: "mixed",
  pattern: "clustered",
  water: "river-ns",
  season: "summer",
  year: -6499,
};
const examples: { name: string; value: Partial<Config> }[] = [
  { name: "Woodland households", value: { ...defaults } },
  {
    name: "Desert river",
    value: {
      ecology: "desert",
      water: "river-ew",
      population: "none",
      start: "wanderer",
      landform: "plain",
    },
  },
  {
    name: "Monsoon river",
    value: {
      ecology: "tropical-woodland",
      water: "river-ns",
      population: "none",
      start: "wanderer",
      landform: "plain",
    },
  },
  {
    name: "Tropical lagoon",
    value: {
      ecology: "tropical-woodland",
      water: "coast-n",
      population: "none",
      start: "wanderer",
      landform: "plain",
    },
  },
  {
    name: "Arctic shore",
    value: {
      ecology: "tundra",
      water: "coast-n",
      season: "winter",
      population: "none",
      start: "wanderer",
      landform: "plain",
    },
  },
  {
    name: "Uninhabited coast",
    value: {
      ecology: "grassland",
      landform: "plain",
      population: "none",
      start: "wanderer",
      water: "coast-n",
    },
  },
  {
    name: "Desert camp",
    value: {
      ecology: "desert",
      landform: "rolling",
      population: "sparse",
      start: "visitor",
      water: "lake",
      pattern: "camp",
    },
  },
  {
    name: "Tundra shepherd",
    value: {
      season: "winter",
      ecology: "tundra",
      landform: "plain",
      population: "none",
      start: "shepherd",
      water: "river-ew",
    },
  },
  {
    name: "Tropical waterfront",
    value: {
      ecology: "tropical-woodland",
      landform: "plain",
      population: "settled",
      start: "visitor",
      water: "coast-w",
      pattern: "waterfront",
    },
  },
  {
    name: "Dense town",
    value: {
      ecology: "grassland",
      landform: "plain",
      population: "settled",
      start: "resident",
      water: "river-ew",
      pattern: "dense",
      year: 1850,
    },
  },
];
function readConfig(): Config {
  const q = new URLSearchParams(location.search),
    c = { ...defaults };
  for (const key of [
    "seed",
    "ecology",
    "landform",
    "population",
    "start",
    "household",
    "pattern",
    "water",
    "season",
  ] as const)
    if (q.has(key)) (c as any)[key] = q.get(key);
  if (q.has("place") && places.some((p) => p.id === q.get("place")))
    c.place = q.get("place")!;
  if (q.has("year")) c.year = Number(q.get("year"));
  return c;
}
export function labSetting(c: Config): WorldSetting {
  const base = settingFor(
    places.find((p) => p.id === (c.place ?? "konya"))!,
    c.year,
  );
  const climate: Record<Config["ecology"], WorldSetting["climate"]> = {
    grassland: "temperate",
    "temperate-woodland": "temperate",
    "boreal-woodland": "boreal",
    "tropical-woodland": "tropical",
    wetland: "temperate",
    "dry-scrub": "mediterranean",
    desert: "arid",
    tundra: "tundra",
  };
  return {
    ...base,
    location: c.place
      ? `${base.location} · street study`
      : `${ecologyProfiles[c.ecology].label} · procedural study`,
    terrainRevision: 2,
    vegetationRevision: 5,
    environment: {
      ecology: c.ecology,
      landform: c.landform,
      population: c.population,
      start:
        c.population === "none" && c.start === "resident"
          ? "wanderer"
          : c.start,
      household: c.household,
    },
    climate: climate[c.ecology],
    water: c.water,
    season: c.season,
    settlementPattern: c.pattern === "camp" ? "clustered" : c.pattern,
    settlement:
      c.pattern === "camp"
        ? "camp"
        : c.pattern === "dense" || c.pattern === "planned"
          ? "city"
          : c.pattern === "waterfront"
            ? "port"
            : c.pattern === "farmstead"
              ? "farm"
              : "village",
    architecture:
      c.pattern === "camp"
        ? "shelter"
        : climate[c.ecology] === "arid"
          ? "mudbrick"
          : c.ecology === "tundra"
            ? "shelter"
            : c.year > 1500
              ? "timber"
              : base.architecture,
    role:
      c.start === "shepherd"
        ? "Shepherd"
        : c.start === "wanderer"
          ? "Wanderer"
          : c.start === "visitor"
            ? "Traveler"
            : "Household member",
  };
}
function Preview({
  runtime,
  onReady,
  layer,
  focus,
  motion,
}: {
  runtime: Runtime;
  motion: boolean;
  onReady: () => void;
  layer: string;
  focus: "settlement" | "start";
}) {
  const mount = useRef<HTMLDivElement>(null);
  const renderOptions = useRef<RenderOptions | undefined>(undefined);
  useEffect(() => {
    if (renderOptions.current) renderOptions.current.waterAnimation = motion;
  }, [motion]);
  useEffect(() => {
    const host = mount.current!,
      center = { ...runtime.engine.state.player.pos };
    const homes = runtime.engine.state.households?.map((h) => h.home) ?? [];
    if (focus === "settlement" && homes.length) {
      const nearest = [...homes].sort(
        (a, b) =>
          Math.hypot(a.x - center.x, a.y - center.y) -
          Math.hypot(b.x - center.x, b.y - center.y),
      )[0];
      const local = homes.filter(
        (h) => Math.hypot(h.x - nearest.x, h.y - nearest.y) < 130,
      );
      center.x = Math.round(local.reduce((n, h) => n + h.x, 0) / local.length);
      center.y = Math.round(local.reduce((n, h) => n + h.y, 0) / local.length);
    }
    if (
      focus === "settlement" &&
      !homes.length &&
      runtime.engine.state.manifest.setting?.water !== "none"
    ) {
      let nearest: { x: number; y: number } | undefined,
        distance = Infinity;
      for (let dy = -80; dy <= 80; dy += 4)
        for (let dx = -80; dx <= 80; dx += 4) {
          const d = dx * dx + dy * dy;
          if (d >= distance) continue;
          const x = center.x + dx,
            y = center.y + dy;
          if (runtime.engine.world.terrain(x, y) === "water") {
            nearest = { x, y };
            distance = d;
          }
        }
      if (nearest) {
        center.x = nearest.x;
        center.y = nearest.y;
      }
    }
    runtime.zoom = 0.625;
    const options: RenderOptions = {
      lab: true,
      overview: true,
      center,
      freeze: true,
      waterAnimation: motion,
      colorGrade: false,
    };
    renderOptions.current = options;
    const scene = new WorldScene(runtime, options);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: host.clientWidth,
      height: host.clientHeight,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      backgroundColor: "#26342e",
      scene,
      audio: { noAudio: true },
      banner: false,
      render: { preserveDrawingBuffer: true },
    });
    let overlay: Phaser.GameObjects.Graphics | undefined;
    options.onReady = () => {
      const camera = scene.cameras.main;
      camera.stopFollow();
      camera.centerOn(center.x * 16, center.y * 16);
      let drag: { x: number; y: number; sx: number; sy: number } | undefined;
      scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
        drag = { x: p.x, y: p.y, sx: camera.scrollX, sy: camera.scrollY };
      });
      scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (drag && p.isDown)
          camera.setScroll(
            drag.sx - (p.x - drag.x) / camera.zoom,
            drag.sy - (p.y - drag.y) / camera.zoom,
          );
      });
      const redraw = () => {
        center.x = Math.round(camera.midPoint.x / 16);
        center.y = Math.round(camera.midPoint.y / 16);
        scene.draw();
      };
      scene.input.on("pointerup", () => {
        drag = undefined;
        redraw();
      });
      scene.input.on(
        "wheel",
        (_p: unknown, _g: unknown, _dx: number, dy: number) => {
          runtime.zoom = Math.max(
            0.5,
            Math.min(3, runtime.zoom + (dy < 0 ? 0.25 : -0.25)),
          );
          scene.draw();
        },
      );
      if (layer !== "art") {
        overlay = scene.add.graphics().setDepth(18000);
        for (let y = center.y - 70; y < center.y + 70; y += 2)
          for (let x = center.x - 90; x < center.x + 90; x += 2) {
            const cell = runtime.engine.world.topography!(x, y);
            overlay.fillStyle(
              layer === "height"
                ? ([0x6faab5, 0xc5d18c, 0xd29162][cell.height] ?? 0xffffff)
                : cell.moisture! > 0.7
                  ? 0x438da2
                  : cell.moisture! > 0.4
                    ? 0x7cba73
                    : 0xd6b16f,
              0.33,
            );
            overlay.fillRect(x * 16, y * 16 - cell.height * 14, 32, 32);
          }
      }
    };
    const resize = new ResizeObserver(() =>
      game.scale.resize(host.clientWidth, host.clientHeight),
    );
    resize.observe(host);
    const poll = window.setInterval(() => {
      if (game.canvas.dataset.terrainReady === "true") {
        onReady();
        clearInterval(poll);
      }
    }, 100);
    Object.assign(window, {
      terrainLab: {
        runtime,
        scene,
        describe: () => ({
          seed: runtime.engine.state.manifest.seed,
          setting: runtime.engine.state.manifest.setting,
          spawn: runtime.engine.world.spawn,
          households: runtime.engine.state.households,
          resources: runtime.engine.state.objects.filter((o) => o.resource)
            .length,
        }),
      },
    });
    return () => {
      clearInterval(poll);
      resize.disconnect();
      game.destroy(true);
      delete (window as any).terrainLab;
    };
  }, [runtime, layer, focus]);
  return (
    <div
      ref={mount}
      className="proc-preview"
      data-testid="procedural-preview"
    />
  );
}
export function ProceduralLab() {
  const [draft, setDraft] = useState<Config>(readConfig),
    [applied, setApplied] = useState<Config>(),
    [runtime, setRuntime] = useState<Runtime>(),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [playing, setPlaying] = useState(false),
    [layer, setLayer] = useState("art"),
    [motion, setMotion] = useState(true),
    [focus, setFocus] = useState<"settlement" | "start">("settlement");
  const old = useRef<Runtime | undefined>(undefined);
  const preparation = useRef<AbortController | undefined>(undefined);
  const generate = async (c: Config) => {
    preparation.current?.abort();
    const controller = new AbortController();
    preparation.current = controller;
    setBusy(true);
    setReady(false);
    setError("");
    await new Promise((r) => setTimeout(r, 30));
    try {
      const next = new Runtime(
        await prepareSettingSession(labSetting(c), c.seed, controller.signal),
        {
          cacheTerrain: false,
        },
      );
      old.current?.dispose();
      old.current = next;
      setRuntime(next);
      setApplied({ ...c });
      const q = new URLSearchParams(
        Object.entries(c).map(([k, v]) => [k, String(v)]),
      );
      history.replaceState(null, "", `/terrain-lab?${q}`);
    } catch (e) {
      if (!controller.signal.aborted) setError(String(e));
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  useEffect(() => {
    void generate(draft);
    return () => {
      preparation.current?.abort();
      old.current?.dispose();
    };
  }, []);
  const update = (key: keyof Config, value: string) =>
    setDraft((d) => ({ ...d, [key]: key === "year" ? Number(value) : value }));
  const select = (
    label: string,
    key: keyof Config,
    values: readonly string[],
    names?: (v: string) => string,
  ) => (
    <label>
      {label}
      <select value={draft[key]} onChange={(e) => update(key, e.target.value)}>
        {values.map((v) => (
          <option key={v} value={v}>
            {names ? names(v) : v.replaceAll("-", " ")}
          </option>
        ))}
      </select>
    </label>
  );
  const play = () => {
    if (!runtime) return;
    runtime.zoom = 2;
    runtime.emit();
    Object.assign(window, { __uhs: runtime });
    setPlaying(true);
  };
  if (playing && runtime)
    return (
      <>
        <button
          className="proc-back"
          onClick={() => {
            runtime.stop();
            setPlaying(false);
            setReady(false);
          }}
        >
          ← Back to procedural explorer
        </button>
        <App runtime={runtime} writer={true} />
      </>
    );
  const e = runtime?.engine;
  return (
    <div className="terrain-lab proc-lab">
      <header className="terrain-header">
        <div>
          <a href="/">Universal History Simulator</a>
          <h1>Procedural explorer</h1>
        </div>
        <span>Geography · ecology · households</span>
        <a href="/terrain-lab?study=meadow">Art fixtures ↗</a>
        <a href="/">Return to world ↗</a>
      </header>
      <div className="proc-layout">
        <aside className="terrain-controls">
          <div className="terrain-eyebrow">Quick studies</div>
          <div className="proc-presets">
            {examples.map((p) => (
              <button
                key={p.name}
                disabled={busy}
                onClick={() => {
                  const c = { ...defaults, seed: draft.seed, ...p.value };
                  setDraft(c);
                  void generate(c);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="proc-actions">
            <label>
              Seed
              <input
                value={draft.seed}
                onChange={(e) => update("seed", e.target.value)}
              />
            </label>
            <button
              className="proc-primary"
              disabled={busy}
              onClick={() => void generate(draft)}
            >
              {busy ? "Generating…" : "Generate preview"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                const c = {
                  ...draft,
                  seed: `land-${crypto.randomUUID().slice(0, 8)}`,
                };
                setDraft(c);
                void generate(c);
              }}
            >
              New seed & generate
            </button>
          </div>
          {select(
            "Ecology",
            "ecology",
            ecologies,
            (v) => ecologyProfiles[v as Config["ecology"]].label,
          )}
          {select("Landform", "landform", landforms)}
          {select("Water", "water", waters)}
          {select("Population", "population", populations)}
          {select("Settlement pattern", "pattern", [...patterns, "camp"])}
          {select("Starting circumstances", "start", starts)}
          {select("Household composition", "household", householdForms)}
          {select("Season", "season", ["spring", "summer", "autumn", "winter"])}
          <label>
            Year (astronomical)
            <input
              type="number"
              value={draft.year}
              onChange={(e) => update("year", e.target.value)}
            />
          </label>
          <p>
            These are fictional test populations using shared prototype assets.
            Biome resources and household patterns are editable models, not
            reconstructions of a named community.
          </p>
        </aside>
        <main className="proc-main">
          <div className="proc-toolbar">
            <button onClick={() => setMotion((m) => !m)} aria-pressed={motion}>
              {motion ? "Pause water" : "Animate water"}
            </button>
            <div>
              <strong>
                {applied
                  ? ecologyProfiles[applied.ecology].label
                  : "Preparing world"}
              </strong>
              <small>
                {applied?.seed} · drag to pan · scroll to zoom
                {applied && JSON.stringify(applied) !== JSON.stringify(draft)
                  ? " · Controls changed; generate to apply"
                  : ""}
              </small>
            </div>
            <button
              onClick={() => {
                setReady(false);
                setFocus((f) => (f === "settlement" ? "start" : "settlement"));
              }}
            >
              {focus === "settlement"
                ? "Center on player"
                : e?.state.households?.length
                  ? "Center on settlement"
                  : "Center on landscape"}
            </button>
            <label>
              Overlay{" "}
              <select
                aria-label="Map overlay"
                value={layer}
                onChange={(e) => {
                  setReady(false);
                  setLayer(e.target.value);
                }}
              >
                <option value="art">Landscape</option>
                <option value="height">Elevation</option>
                <option value="moisture">Moisture</option>
              </select>
            </label>
            <button disabled={!ready || busy} onClick={play}>
              Play this world →
            </button>
          </div>
          {error ? (
            <p role="alert">{error}</p>
          ) : (
            runtime && (
              <Preview
                motion={motion}
                runtime={runtime}
                layer={layer}
                focus={focus}
                onReady={() => setReady(true)}
              />
            )
          )}
          <div className="proc-readout" role="status">
            {busy
              ? "Generating the shared world…"
              : ready
                ? "Ready to explore"
                : "Preparing visible terrain…"}{" "}
            · {e?.state.households?.length ?? 0} households ·{" "}
            {e?.state.actors.filter((a) => a.kind === "human").length ?? 0}{" "}
            residents · {e?.state.objects.filter((o) => o.resource).length ?? 0}{" "}
            resource patches
          </div>
          <details className="proc-households">
            <summary>Households, relationships & supplies</summary>
            {e?.state.households?.map((h) => (
              <div key={h.id}>
                <strong>
                  {h.residence ? "Dwelling" : "Camp"} · {h.members.length}{" "}
                  members
                </strong>
                <p>
                  {h.members
                    .map((id) =>
                      [e.state.player, ...e.state.actors].find(
                        (a) => a.id === id,
                      ),
                    )
                    .filter(Boolean)
                    .map((a) => `${a!.name} (${a!.age ?? "adult"}, ${a!.role})`)
                    .join(" · ")}
                </p>
                <p>
                  {h.members
                    .map((id) =>
                      [e.state.player, ...e.state.actors].find(
                        (a) => a.id === id,
                      ),
                    )
                    .filter(Boolean)
                    .map((a) =>
                      a!.relations?.length
                        ? `${a!.name}: ${a!.relations.map((r) => `${r.kind} of ${[e.state.player, ...e.state.actors].find((p) => p.id === r.other)?.name ?? r.other}`).join(", ")}`
                        : `${a!.name}: lives independently`,
                    )
                    .join(" · ")}
                </p>
                <small>
                  {Object.entries(
                    e.state.objects.find((o) => o.id === h.storeId)
                      ?.inventory ?? {},
                  )
                    .map(([k, v]) => `${v} ${k}`)
                    .join(", ")}
                </small>
              </div>
            ))}
            {!e?.state.households?.length && (
              <p>
                No resident households. The landscape is generated independently
                of habitation.
              </p>
            )}
          </details>
        </main>
      </div>
    </div>
  );
}
