import { seasonAt } from "./livelihood";

export type SeasonId = "spring" | "summer" | "autumn" | "winter";
export type SeasonView = {
  id: SeasonId;
  /** Climate-appropriate name: a monsoon year is not spring/summer/autumn/winter. */
  label: string;
  color: string;
};

const order: SeasonId[] = ["spring", "summer", "autumn", "winter"];

// Astronomical quarters carry different weather in different climates, so each
// climate names and colours its own four. The id stays the astronomical one
// (already hemisphere-flipped at world creation) so resources and art agree.
const cycles: Record<string, [string, string, string, string]> = {
  temperate: ["Spring", "Summer", "Autumn", "Winter"],
  boreal: ["Thaw", "Summer", "Autumn", "Deep winter"],
  tundra: ["Break-up", "Midnight sun", "Freeze-up", "Polar night"],
  mediterranean: ["Spring", "Dry summer", "First rains", "Wet winter"],
  arid: ["Spring", "High heat", "Cooling", "Cool season"],
  tropical: ["Rains", "High rains", "Late rains", "Dry season"],
  monsoon: ["Hot dry", "Monsoon", "Post-monsoon", "Cool dry"],
};

const base: Record<SeasonId, string> = {
  spring: "#8fd07f",
  summer: "#f0c64e",
  autumn: "#e08a45",
  winter: "#8fc0e8",
};

// Where the plain seasonal colour would lie about the weather.
const tints: Record<string, Partial<Record<SeasonId, string>>> = {
  tundra: { spring: "#9fd8c8", summer: "#f4e089", winter: "#9f9fe0" },
  mediterranean: { summer: "#efb254", autumn: "#7fbfc4", winter: "#79aede" },
  arid: { spring: "#c9cf74", summer: "#f2a34a", autumn: "#d9a566", winter: "#b9c98f" },
  tropical: { spring: "#6fc9a8", summer: "#5bb8c4", autumn: "#7fc98f", winter: "#d9b45e" },
  monsoon: { spring: "#f0a14e", summer: "#6aa9d8", autumn: "#7fc4a0", winter: "#bcd08f" },
};

export function seasonFor(
  climate: string,
  initialSeason: string,
  clock: number,
): SeasonView {
  const id = (seasonAt(initialSeason, clock) ?? "spring") as SeasonId;
  const i = Math.max(0, order.indexOf(id));
  return {
    id,
    label: (cycles[climate] ?? cycles.temperate)[i],
    color: tints[climate]?.[id] ?? base[id],
  };
}
