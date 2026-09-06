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
export const shadowFrame = (phase: LightingId, frame: string) =>
  `${phase}:${frame}`;
