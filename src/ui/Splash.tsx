import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  X,
  ChevronDown,
  Wheat,
  Landmark,
  Leaf,
  MoveUpRight,
} from "lucide-react";
import { openings } from "../content/geography/openings";
import { StartPreview } from "./StartPreview";
import type { WorldSetting } from "../content/geography/types";
import type { Engine } from "../core/engine";
import { regionAt } from "../content/geography/region-label";
import { formatHistoricalYear } from "../core/calendar";
import type { randomStart } from "../content/geography/random-start";
import { bannerFor, defaultBanner, smokeFor } from "./splash-banner";
import { BannerSmoke } from "./BannerSmoke";
import { SplashStars } from "./SplashStars";
import "./splash.css";
type Starter = typeof import("../content/geography/random-start");
let starter: Starter | null = null;
let starterLoad: Promise<Starter> | null = null;
function loadStarter() {
  starterLoad ??= import("../content/geography/random-start").then((m) => {
    starter = m;
    return m;
  });
  return starterLoad;
}
const icons = {
  arrow: MoveUpRight,
  column: Landmark,
  wheat: Wheat,
  leaf: Leaf,
};
const WorldSetup = lazy(() =>
  import("./WorldSetup").then((m) => ({ default: m.WorldSetup })),
);
export function Splash({
  onStart,
}: {
  onStart: (engine: Engine) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<{
    seed: string;
    setting: WorldSetting;
  }>();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"local" | "model">("local");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<"world" | "about" | "sources" | null>(
    null,
  );
  const [seed] = useState(() => `world-${crypto.randomUUID()}`);
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const bannerImg = useRef<HTMLImageElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
      if (e.key === "Tab") {
        const controls = dialog.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [panel]);
  const randomizeCall = useRef(0);
  const applyStart = (next: ReturnType<typeof randomStart>) => {
    const region = regionAt(next.setting.lon, next.setting.lat);
    setSelected(next);
    setPrompt(
      `${next.setting.role} in ${region?.label ?? next.setting.location}, ${formatHistoricalYear(next.setting.year)}`,
    );
    setError("");
  };
  const randomize = async () => {
    // Draw synchronously once loaded so a click lands before the next read;
    // while loading, only the latest call may land.
    if (starter) return applyStart(starter.randomStart());
    const call = ++randomizeCall.current;
    const loaded = await loadStarter();
    if (call !== randomizeCall.current) return;
    applyStart(loaded.randomStart());
  };
  // Open on a random start rather than an empty box.
  useEffect(() => {
    void randomize();
  }, []);
  const region = selected
    ? regionAt(selected.setting.lon, selected.setting.lat)
    : undefined;
  const culture = region?.culture;
  const banner = bannerFor(culture, selected?.setting.year, region?.id);
  const launch = async (
    request?: string,
    selection: typeof selected | null = selected,
  ) => {
    if (controller.current) return;
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    setBusy("Preparing your world…");
    try {
      const { prepareSettingSession } = await import("../runtime/preparation");
      let worldSeed = `world-${crypto.randomUUID()}`;
      let setting;
      if (selection) {
        setting = selection.setting;
        worldSeed = selection.seed;
      } else if (request) {
        const { resolveSetting } = await import("../content/geography/resolve");
        const resolved = resolveSetting(request, worldSeed);
        if (!("setting" in resolved) || resolved.needsInterpretation) {
          setPanel("world");
          setError("Review the setting details before beginning.");
          return;
        }
        setting = resolved.setting;
      } else {
        const { randomStart } = await import(
          "../content/geography/random-start"
        );
        const start = randomStart();
        setting = start.setting;
        worldSeed = start.seed;
      }
      const engine = await prepareSettingSession(
        setting,
        worldSeed,
        abort.signal,
      );
      abort.signal.throwIfAborted();
      await onStart(engine);
    } catch (err) {
      if (!abort.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : "Could not create the world. Please try again.",
        );
    } finally {
      if (!abort.signal.aborted) {
        setBusy("");
        controller.current = null;
      }
    }
  };
  return (
    <main className="splash">
      <div className="splash-frame">
        <SplashStars />
        <div className="splash-content" inert={panel ? true : undefined}>
          <header className="splash-header">
            <div className="splash-logotype">
              <img
                src="/brand/uhs-stacked.png"
                alt="Universal History Simulator"
                width="722"
                height="218"
              />
            </div>
            <div className="splash-rule" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            <p>An experiment in teachably imperfect historical simulations</p>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!prompt.trim()) {
                setPanel("world");
                return;
              }
              if (mode === "model" && !selected) setPanel("world");
              else void launch(prompt.trim());
            }}
          >
            <label className="splash-eyebrow" htmlFor="opening-prompt">
              Your start
            </label>
            <div className="splash-input">
              <svg
                className="splash-cursor"
                viewBox="0 0 12 12"
                shapeRendering="crispEdges"
                aria-hidden="true"
              >
                <path
                  fill="#e9c785"
                  d="M1 0h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1H6v1h1v1h1v1H7v-1H6v-1H5v-1H4v1H3v1H2v1H1z"
                />
              </svg>
              <input
                id="opening-prompt"
                value={prompt}
                disabled={!!busy}
                maxLength={2000}
                onChange={(e) => {
                  setSelected(undefined);
                  setPrompt(e.target.value);
                }}
                placeholder="A hunter in Anatolia, 7000 BCE"
              />
              <button
                type="button"
                aria-label="Choose starting details"
                disabled={!!busy}
                onClick={() => setPanel("world")}
              >
                <ChevronDown />
              </button>
            </div>
            <div className="splash-actions">
              <button
                type="button"
                className="splash-random"
                disabled={!!busy}
                onClick={() => void randomize()}
              >
                Random start
              </button>
              <button className="splash-begin" disabled={!!busy}>
                Begin
              </button>
            </div>
          </form>
          <button
            type="button"
            className="splash-more"
            aria-expanded={moreOpen}
            aria-controls="splash-more"
            onClick={() => setMoreOpen((open) => !open)}
          >
            More info
            <ChevronDown
              className={moreOpen ? "about-chevron is-open" : "about-chevron"}
              size={14}
            />
          </button>
          <div
            id="splash-more"
            className="splash-more-panel"
            hidden={!moreOpen}
          >
            <div className="splash-more-inner">
              {selected && <StartPreview setting={selected.setting} />}
              <div
                className="splash-modes"
                role="group"
                aria-label="World creation mode"
              >
                <button
                  type="button"
                  aria-pressed={mode === "local"}
                  disabled={!!busy}
                  onClick={() => setMode("local")}
                >
                  Standard
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "model"}
                  disabled={!!busy}
                  onClick={() => setMode("model")}
                >
                  Use AI
                </button>
              </div>
              <div className="splash-divider">
                <span>✦</span>
              </div>
              <section
                className="splash-openings"
                aria-label="Opening scenarios"
              >
                <h2 className="splash-eyebrow">Or begin with</h2>
                <div className="opening-grid">
                  {openings.map((opening) => {
                    const Icon = icons[opening.icon];
                    return (
                      <button
                        key={opening.id}
                        disabled={!!busy}
                        onClick={() => {
                          setPrompt(opening.prompt);
                          setSelected(undefined);
                          void launch(opening.prompt, null);
                        }}
                      >
                        <Icon aria-hidden="true" />
                        <span>
                          {opening.title}
                          <small>{opening.detail}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
          <div className="splash-status" role="status">
            {busy}
            {busy && (
              <button
                onClick={() => {
                  controller.current?.abort();
                  controller.current = null;
                  setBusy("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {error && (
            <p className="splash-error" role="alert">
              {error}
            </p>
          )}
          <div className="splash-banner" aria-hidden="true">
            <div className="splash-banner-art">
              <img
                key={banner}
                ref={bannerImg}
                src={banner}
                alt=""
                onError={(e) => {
                  if (e.currentTarget.src.endsWith(defaultBanner)) return;
                  e.currentTarget.src = defaultBanner;
                }}
              />
              <BannerSmoke
                key={`smoke-${banner}`}
                img={bannerImg}
                emitters={smokeFor[banner] ?? []}
              />
            </div>
          </div>
          <footer className="splash-footer">
            <nav aria-label="About the simulator">
              <button
                aria-expanded={aboutOpen}
                aria-controls="splash-about"
                onClick={() => setAboutOpen((open) => !open)}
              >
                About{" "}
                <ChevronDown
                  className={
                    aboutOpen ? "about-chevron is-open" : "about-chevron"
                  }
                  size={13}
                />
              </button>
              <span>·</span>
              <button disabled={!!busy} onClick={() => setPanel("about")}>
                How it works
              </button>
              <span>·</span>
              <button disabled={!!busy} onClick={() => setPanel("sources")}>
                Sources
              </button>
              <span>·</span>
              <button disabled={!!busy} onClick={() => setPanel("world")}>
                Settings
              </button>
            </nav>
            <div id="splash-about" className="splash-about" hidden={!aboutOpen}>
              <p>Designed by Benjamin Breen.</p>
              <a
                href="https://github.com/benjaminbreen/UHS"
                target="_blank"
                rel="noreferrer"
              >
                Explore the project on GitHub <ArrowRight size={14} />
              </a>
            </div>
          </footer>
        </div>
      </div>
      {panel && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPanel(null);
          }}
        >
          <section
            ref={dialog}
            tabIndex={-1}
            className={`modal ${panel === "world" ? "modal-world" : "splash-info"}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "world"
                ? "Create a world"
                : panel === "about"
                  ? "How it works"
                  : "Sources and method"
            }
            data-modal="true"
          >
            <button
              className="close-modal icon-button"
              aria-label="Close dialog"
              onClick={() => setPanel(null)}
            >
              <X size={20} />
            </button>
            {panel === "world" ? (
              <Suspense fallback={<p>Opening the atlas…</p>}>
                <WorldSetup
                  initialSeed={selected?.seed ?? seed}
                  initialSetting={selected?.setting}
                  initialPrompt={selected ? "" : prompt}
                  initialMode={mode}
                  onStart={(engine) => void onStart(engine)}
                />
              </Suspense>
            ) : panel === "about" ? (
              <>
                <h2>One life in a generated world</h2>
                <p>
                  Choose a scenario, describe a place and date, or pick Random
                  start. Walk through the landscape, meet people, and interact
                  with the world.
                </p>
                <p>
                  Grounded uses local procedural rules. World Weaver can
                  interpret requests through an optional AI service; it does not
                  add autonomous AI characters.
                </p>
                <p>
                  Reloading returns here. You can export a world to a file from
                  the game’s Settings.
                </p>
              </>
            ) : (
              <>
                <h2>Sources and method</h2>
                <p>
                  Geography anchors the landscape. Dated regional content and
                  procedural rules shape settlements, livelihoods, and everyday
                  objects.
                </p>
                <p>
                  Generated people and street plans are plausible inventions,
                  not recovered historical records. Regional detail varies; a
                  recognized place does not imply a fully reconstructed city.
                </p>
                <p>
                  Once in a world, open the notebook to examine its sources and
                  historical claims.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
