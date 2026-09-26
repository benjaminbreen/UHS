import presets from "../content/graphics/lighting.json" with { type: "json" };
export type LightingId =
  | "early-morning"
  | "morning"
  | "midday"
  | "afternoon"
  | "dusk"
  | "night";
export const lightingPresets = presets as (Omit<
  (typeof presets)[number],
  "id"
> & { id: LightingId })[];
/** Fixed local-hour art direction. No latitude/season simulation or per-minute work. */
export function lightingAt(clock: number) {
  const hour = (((clock / 3600) % 24) + 24) % 24;
  return (
    [...lightingPresets].reverse().find((p) => hour >= p.start) ??
    lightingPresets[5]
  );
}
export function lightingPreset(id: LightingId) {
  return lightingPresets.find((p) => p.id === id)!;
}
export function parseLighting(id: string | null): LightingId {
  if (id === "day") return "midday";
  if (id === "warm") return "afternoon";
  return lightingPresets.find((p) => p.id === id)?.id ?? "midday";
}
// A car's shadow does not depend on its paint: every paint uses the first's.
export const shadowFrame = (phase: LightingId, frame: string) =>
  `${phase}:${frame.startsWith("vehicle-") ? frame.replace(/-\d+-([ewsn])$/, "-0-$1") : frame}`;
const channels = (hex: string) => [16, 8, 0].map((s) => (parseInt(hex, 16) >> s) & 255);
/** The screen wash for an hour, eased between the presets' own hours so dusk
 * comes on over the evening rather than at a stroke, with low sun warming
 * the scene either side of sunrise and sunset. */
export function washAt(clock: number) {
  const hour = (((clock / 3600) % 24) + 24) % 24;
  const n = lightingPresets.length;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (hour >= lightingPresets[k].hour) i = k;
  const a = lightingPresets[i],
    b = lightingPresets[(i + 1) % n];
  const span = (b.hour - a.hour + 24) % 24 || 24;
  const t = ((hour - a.hour + 24) % 24) / span;
  // Black ambient means none: ease its alpha, not its colour, toward it.
  const ca = a.ambientAlpha ? channels(a.ambient) : channels(b.ambient),
    cb = b.ambientAlpha ? channels(b.ambient) : ca;
  const color = ca.map((c, k) => Math.round(c + (cb[k] - c) * t));
  const alpha = a.ambientAlpha + (b.ambientAlpha - a.ambientAlpha) * t;
  const golden = Math.max(
    0,
    1 - Math.abs(hour - 6.8) / 1.6,
    1 - Math.abs(hour - 18.2) / 1.8,
  );
  return {
    color: (color[0] << 16) | (color[1] << 8) | color[2],
    alpha,
    golden,
    /** How far windows and doorways show their lamps, 0 by day. */
    lamps: Math.min(1, Math.max(0, hour >= 12 ? (hour - 17.2) / 2.3 : (6.8 - hour) / 1.5)),
  };
}
