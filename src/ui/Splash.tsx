import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Dices,
  Wheat,
  Landmark,
  Leaf,
  MoveUpRight,
  X,
  ChevronDown,
} from "lucide-react";
import type { Engine } from "../core/engine";
import { openings } from "../content/geography/openings";
import "./splash.css";
const WorldSetup = lazy(() =>
  import("./WorldSetup").then((m) => ({ default: m.WorldSetup })),
);
const icons = {
  arrow: MoveUpRight,
  column: Landmark,
  wheat: Wheat,
  leaf: Leaf,
};
export function Splash({
  onStart,
}: {
  onStart: (engine: Engine) => void | Promise<void>;
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
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
  const launch = async (request?: string) => {
    if (controller.current) return;
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    setBusy("Preparing your world…");
    try {
      const { prepareSettingSession } = await import("../runtime/preparation");
      let worldSeed = `world-${crypto.randomUUID()}`;
      let setting;
      if (request) {
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
      <div className="splash-content" inert={panel ? true : undefined}>
        <header className="splash-header">
          <svg width="0" height="0" className="logo-filter" aria-hidden="true">
            <defs>
              <filter id="uhs-logo-ink" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  8 0 0 0 -0.85"
                />
              </filter>
            </defs>
          </svg>
          <div className="splash-logotype">
            <img
              src="/brand/uhs.png"
              alt="Universal History Simulator"
              width="1196"
              height="190"
            />
            <svg
              className="logo-glint"
              viewBox="0 0 15 15"
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <path
                className="glint-rays"
                fill="#e9c785"
                d="M7 0h1v4H7zM7 11h1v4H7zM0 7h4v1H0zM11 7h4v1h-4z"
              />
              <path
                className="glint-cross"
                fill="#fff2cc"
                d="M6 3h3v3h3v3H9v3H6V9H3V6h3z"
              />
              <path fill="#fffdf2" d="M6 6h3v3H6z" />
            </svg>
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
            if (mode === "model") setPanel("world");
            else void launch(prompt.trim());
          }}
        >
          <label className="splash-eyebrow" htmlFor="opening-prompt">
            Who will you be?
          </label>
          <div className="splash-input">
            <input
              id="opening-prompt"
              value={prompt}
              disabled={!!busy}
              maxLength={2000}
              onChange={(e) => setPrompt(e.target.value)}
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
                <span className="mode-diamond" />
                <span>
                  Grounded<small>Procedural · no model calls</small>
                </span>
              </button>
              <button
                type="button"
                aria-pressed={mode === "model"}
                disabled={!!busy}
                onClick={() => setMode("model")}
              >
                <span className="mode-diamond" />
                <span>
                  World Weaver<small>AI-assisted world creation</small>
                </span>
              </button>
            </div>
            <button className="splash-begin" disabled={!!busy}>
              Begin <ArrowRight size={20} />
            </button>
            <button
              type="button"
              className="splash-random"
              disabled={!!busy}
              onClick={() => void launch()}
            >
              <Dices size={18} />
              Random start
            </button>
          </div>
        </form>
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
        <div className="splash-divider">
          <span>✦</span>
        </div>
        <section className="splash-openings" aria-label="Opening scenarios">
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
                    void launch(opening.prompt);
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
              Sources and method
            </button>
            <span>·</span>
            <button disabled={!!busy} onClick={() => setPanel("world")}>
              Starting details
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
                  initialSeed={seed}
                  initialPrompt={prompt}
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
