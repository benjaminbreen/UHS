import type { PropDef } from "./catalog";
/** Explicit settlement furniture keeps its authored frame through the prop overlay. */
export const urbanProps: Record<string, PropDef> = {
  marketCounter: {
    name: "Market counter",
    family: "market-counter",
    solid: true,
    container: true,
  },
};
