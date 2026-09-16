/** Diagnostic switches for the live renderer panel.
 *
 * These exist to bisect a stutter: turn one subsystem off, walk, see whether
 * the hitch goes with it. Nothing here is persisted or part of normal play.
 */
export type PerfSwitches = {
  /** Milliseconds a frame may spend composing terrain. 0 freezes streaming. */
  terrainInstallBudget: number;
  /** Cells of terrain streamed around the camera; 0 means no cap. */
  terrainReach: number;
  /** Rebuilding the whole scenery cache when the camera anchor moves. */
  sceneryRebuilds: boolean;
  /** Cells the camera may move before the scenery cache is rebuilt. */
  sceneryReach: number;
  /** Re-rastering bank shadows on every chunk install and sun change. */
  bankShadows: boolean;
  livingWater: boolean;
  ambientPeople: boolean;
  /** The O(n²) crowd-spacing pass. */
  crowdSeparation: boolean;
  routineBuilding: boolean;
  characterPoses: boolean;
  fauna: boolean;
  wind: boolean;
  fires: boolean;
  ripples: boolean;
  buildingAnimations: boolean;
  /** Engine simulation ticks while walking. */
  worldTicks: boolean;
};

export const defaultPerfSwitches: PerfSwitches = {
  terrainInstallBudget: 6,
  terrainReach: 0,
  sceneryRebuilds: true,
  sceneryReach: 8,
  bankShadows: true,
  livingWater: true,
  ambientPeople: true,
  crowdSeparation: true,
  routineBuilding: true,
  characterPoses: true,
  fauna: true,
  wind: true,
  fires: true,
  ripples: true,
  buildingAnimations: true,
  worldTicks: true,
};

export const perf: PerfSwitches = { ...defaultPerfSwitches };

const listeners = new Set<(next: PerfSwitches) => void>();

export function setPerf(patch: Partial<PerfSwitches>) {
  Object.assign(perf, patch);
  for (const listener of listeners) listener(perf);
}

export function onPerfChange(listener: (next: PerfSwitches) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetPerf() {
  setPerf(defaultPerfSwitches);
}

// ---------------------------------------------------------------------------
// Frame profiler
//
// A 60 fps average hides a 40 ms frame every four seconds. The clock is the
// meter's own rAF, so a frame covers everything between two paints — the
// scene update, Phaser's render, the React commit, worker messages and any
// GC — not just the part of it this file can see. Whatever the named sections
// do not account for is reported as "unattributed", which is what points at
// work nobody has instrumented yet.

export type FrameBreakdown = {
  total: number;
  sections: [string, number][];
  /** Milliseconds since the previous hitch, which is the cadence. */
  gap: number;
  at: number;
};

let frameStart = 0;
let lapAt = 0;
let sections = new Map<string, number>();
let profiling = false;
/** The last few hitches, newest first. A single worst frame hides the
 * cadence, which is the thing that identifies a periodic stall. */
let log: FrameBreakdown[] = [];
let lastHitch = 0;
let hitches: number[] = [];
/** Worst frame since the previous sample, for the meter's spark. */
let windowWorst = 0;

/** Frames above this are what the eye reads as a stutter at 60 fps. */
export const HITCH_MS = 24;

export function setProfiling(on: boolean) {
  profiling = on;
  frameStart = 0;
  if (!on) resetProfile();
}

function add(name: string, ms: number) {
  if (ms < 0.05) return;
  sections.set(name, (sections.get(name) ?? 0) + ms);
}

/** Closes the frame that was running and opens the next one. Driven by the
 * meter's requestAnimationFrame, so it lines up with what the eye sees. */
export function frameTick(now: number) {
  if (!profiling) return;
  if (frameStart) {
    const total = now - frameStart;
    if (total > windowWorst) windowWorst = total;
    if (total >= HITCH_MS) {
      hitches.push(now);
      let attributed = 0;
      for (const ms of sections.values()) attributed += ms;
      const named: [string, number][] = [...sections];
      const rest = total - attributed;
      if (rest >= 0.5) named.push(["unattributed", rest]);
      log.unshift({
        total,
        at: now,
        gap: lastHitch ? now - lastHitch : 0,
        sections: named.sort((a, b) => b[1] - a[1]).slice(0, 5),
      });
      if (log.length > 5) log.pop();
      lastHitch = now;
    }
  }
  frameStart = now;
  sections = new Map();
}

/** Starts a run of `mark` calls. Time before this is not attributed. */
export function open() {
  if (profiling) lapAt = performance.now();
}

/** Closes the section that started at `open` or the previous mark. */
export function mark(name: string) {
  if (!profiling) return;
  const now = performance.now();
  add(name, now - lapAt);
  lapAt = now;
}

/** Attributes time measured somewhere else in the frame. */
export function span(name: string, ms: number) {
  if (profiling) add(name, ms);
}

/** Times `body` into a named section. */
export function timed<T>(name: string, body: () => T): T {
  if (!profiling) return body();
  const start = performance.now();
  try {
    return body();
  } finally {
    add(name, performance.now() - start);
  }
}

export function resetProfile() {
  log = [];
  hitches = [];
  lastHitch = 0;
  windowWorst = 0;
}

/** Reads the meter's state and clears the per-sample window. */
export function sampleProfile(now: number) {
  // Ten seconds of hitches, so the count describes now rather than the run.
  hitches = hitches.filter((t) => now - t < 10000);
  const worst = windowWorst;
  windowWorst = 0;
  return {
    log,
    hitches: hitches.length,
    worst,
    sinceHitch: lastHitch ? now - lastHitch : 0,
  };
}
