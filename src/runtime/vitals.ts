/**
 * Black box recorder for crashes we cannot watch happen.
 *
 * iOS Safari kills the whole web process when a tab runs out of memory: no
 * exception, no console, just "A problem repeatedly occurred". The only
 * evidence available is whatever survived in localStorage, so the running
 * session keeps a small snapshot there and the next load reads it back.
 */

type Counter = () => number;

type Snapshot = {
  at: number;
  /** Seconds since this session started. */
  uptime: number;
  counts: Record<string, number>;
  events: string[];
  errors: string[];
  /** Set on pagehide: a record without it means the process died. */
  closed?: boolean;
  ua: string;
  viewport: string;
};

const KEY = "uhs.vitals";
const WRITE_MS = 2000;
const EVENT_LIMIT = 40;
const ERROR_LIMIT = 20;

const counters = new Map<string, Counter>();
const events: string[] = [];
const errors: string[] = [];
let started = 0;
let installed = false;
let lastWrite = 0;
let previous: Snapshot | undefined;

/**
 * Expose a number worth watching over time. A count that climbs across
 * repeated open/close cycles and never falls is the leak.
 */
export function watchCount(name: string, read: Counter) {
  counters.set(name, read);
}

function stamp() {
  return ((Date.now() - started) / 1000).toFixed(1);
}

/** Note something the player did, so a crash can be tied to an action. */
export function markEvent(name: string) {
  if (!installed) return;
  events.push(`${stamp()}s ${name}`);
  if (events.length > EVENT_LIMIT) events.shift();
  write(true);
}

function noteError(kind: string, detail: unknown) {
  const text =
    detail instanceof Error
      ? `${detail.name}: ${detail.message}`
      : String(detail);
  errors.push(`${stamp()}s ${kind} ${text.slice(0, 300)}`);
  if (errors.length > ERROR_LIMIT) errors.shift();
  write(true);
}

function snapshot(closed = false): Snapshot {
  const counts: Record<string, number> = {};
  for (const [name, read] of counters) {
    try {
      counts[name] = read();
    } catch {
      counts[name] = -1;
    }
  }
  return {
    at: Date.now(),
    uptime: Number(stamp()),
    counts,
    events: [...events],
    errors: [...errors],
    closed: closed || undefined,
    ua: navigator.userAgent,
    viewport: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}@${window.devicePixelRatio}`,
  };
}

function write(force = false) {
  const now = Date.now();
  if (!force && now - lastWrite < WRITE_MS) return;
  lastWrite = now;
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()));
  } catch {
    // A full or disabled store is not worth crashing over.
  }
}

/** The previous session's last snapshot, read once at install. */
export function lastSession() {
  return previous;
}

export function currentVitals() {
  return snapshot();
}

export function installVitals() {
  if (installed) return;
  installed = true;
  started = Date.now();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) previous = JSON.parse(raw) as Snapshot;
  } catch {
    previous = undefined;
  }

  // Reachable from a remote Web Inspector on the device itself.
  (window as unknown as Record<string, unknown>).__vitals = {
    now: currentVitals,
    last: lastSession,
    mark: markEvent,
  };

  countWorkers();
  watchCount("domCanvas", () => document.getElementsByTagName("canvas").length);
  watchCount("domNodes", () => document.getElementsByTagName("*").length);
  watchCount(
    "heapMB",
    () =>
      Math.round(
        ((performance as unknown as { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize ?? 0) / 1e6,
      ),
  );

  // A resize storm is the other way iOS kills a Phaser tab: the URL bar
  // collapsing reallocates the drawing buffer, and a layout that reacts to the
  // new height can drive it in a loop.
  let resizes = 0;
  window.addEventListener("resize", () => resizes++);
  watchCount("resizes", () => resizes);

  window.addEventListener("error", (e) =>
    noteError("error", e.error ?? e.message),
  );
  window.addEventListener("unhandledrejection", (e) =>
    noteError("rejection", e.reason),
  );
  window.addEventListener("pagehide", () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot(true)));
    } catch {
      // ignore
    }
  });
  document.addEventListener("visibilitychange", () => {
    markEvent(document.hidden ? "hidden" : "visible");
  });
  setInterval(() => write(), WRITE_MS);

  if (previous && !previous.closed) {
    const age = Math.round((Date.now() - previous.at) / 1000);
    console.warn(
      `[vitals] previous session ended without unload ${age}s ago — likely a process kill.`,
      previous,
    );
  }
}

/**
 * Every worker is a second copy of the module graph it loads, so on a phone
 * the live count matters more than anything on the main thread. Counting them
 * at the constructor catches all five spawn sites at once.
 */
function countWorkers() {
  let live = 0;
  let made = 0;
  const Native = window.Worker;
  class Counted extends Native {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      live++;
      made++;
    }
    terminate() {
      live--;
      super.terminate();
    }
  }
  window.Worker = Counted;
  watchCount("workers", () => live);
  watchCount("workersMade", () => made);
}

/**
 * Hook a Phaser game up: texture and scene counts, plus the context-loss event
 * that a GPU-side kill fires before the tab dies.
 */
export function watchGame(game: Phaser.Game | undefined) {
  if (!game) {
    counters.delete("textures");
    counters.delete("scenes");
    return;
  }
  watchCount("textures", () => Object.keys(game.textures.list).length);
  // What the sheets actually cost: a decoded texture is width x height x 4
  // bytes whatever the PNG compressed to, and this is the budget that kills
  // the tab.
  watchCount("textureMB", () => {
    let bytes = 0;
    for (const texture of Object.values(
      game.textures.list as Record<string, Phaser.Textures.Texture>,
    ))
      for (const source of texture?.source ?? [])
        bytes += (source.width ?? 0) * (source.height ?? 0) * 4;
    return Math.round(bytes / 1e6);
  });
  watchCount("scenes", () => game.scene.scenes.length);
  const canvas = game.canvas;
  canvas?.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    noteError("webglcontextlost", "gpu context lost");
  });
  canvas?.addEventListener("webglcontextrestored", () =>
    markEvent("webglcontextrestored"),
  );
}
