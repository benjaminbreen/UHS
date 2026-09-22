// Node needs the attribute to load JSON as a module; without it Playwright,
// which loads this through Node rather than Vite, refuses the whole run.
import saved from "./sfx-tuning.json" with { type: "json" };
import type { Sound } from "./sfx";

/** Per-group multipliers over the sound recipes, set from the live panel's
 * Audio tab. Groups are the throttle keys the game already plays under. */
export type Tuning = {
  gain: number;
  pitch: number;
  brightness: number;
  length: number;
  /** Minimum ms between plays of this group. */
  gap: number;
  /** Footsteps only: pixels walked per footfall. */
  spacing?: number;
};
export const neutral: Tuning = {
  gain: 1,
  pitch: 1,
  brightness: 1,
  length: 1,
  gap: 60,
};

const STORE = "uhs-sfx-tuning-v1";
const load = (): Record<string, Partial<Tuning>> => {
  try {
    return { ...saved, ...JSON.parse(localStorage.getItem(STORE) ?? "{}") };
  } catch {
    return { ...saved };
  }
};
let overrides = load();

export function tuning(group: string): Tuning {
  const base = group === "step" ? { ...neutral, spacing: 8 } : neutral;
  return { ...base, ...overrides[group] };
}
export function setTuning(group: string, patch: Partial<Tuning>) {
  overrides = { ...overrides, [group]: { ...overrides[group], ...patch } };
  persist();
}
export function resetTuning(group?: string) {
  if (group) {
    const { [group]: _, ...rest } = overrides;
    overrides = rest;
  } else overrides = {};
  persist();
}
/** Only changed values, so the JSON stays short. */
export function tuningJson() {
  const out: Record<string, Partial<Tuning>> = {};
  for (const [group, values] of Object.entries(overrides)) {
    const base = tuning("");
    const changed = Object.fromEntries(
      Object.entries(values).filter(
        ([k, v]) =>
          v !== (group === "step" && k === "spacing" ? 8 : base[k as keyof Tuning]),
      ),
    );
    if (Object.keys(changed).length) out[group] = changed;
  }
  return JSON.stringify(out, null, 2);
}
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(overrides));
  } catch {
    /* Optional. */
  }
}

export function applyTuning(sound: Sound, t: Tuning): Sound {
  return sound.map((l) => {
    const f = l.kind === "tone" ? t.pitch : t.brightness;
    return {
      ...l,
      at: l.at * t.length,
      dur: l.dur * t.length,
      attack: l.attack && l.attack * t.length,
      gain: l.gain * t.gain,
      freq: Math.min(20000, l.freq * f),
      to: l.to && Math.min(20000, l.to * f),
    };
  });
}
