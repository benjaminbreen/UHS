import type { Habitat } from "../../world/v3/habitats";

/** Which stone a loose rock is drawn as. The shared grey masonry trio stays
 * the temperate default; regional colourways lean on their own stone. */
const legacy = ["rock", "rock-1", "rock-2"];
const regional = (kind: string) =>
  [0, 1, 2].map((i) => `nature-rock-${kind}-${i}`);
/** Which regional stone a habitat is made of, and how much of its loose rock
 * uses it rather than the shared grey trio. */
export function stoneKind(h: Habitat): { kind: string; share: number } {
  const c = h.colorway;
  if (h.ecology === "desert")
    return {
      kind:
        c === "red-earth" || c === "kalahari" || c === "sonoran"
          ? "red"
          : c === "atacama" || c === "highland"
            ? "basalt"
            : "dune",
      share: 0.9,
    };
  if (c === "red-earth" || c === "kalahari") return { kind: "red", share: 0.8 };
  if (h.ecology === "tundra" || c === "alpine" || c === "montane")
    return { kind: c === "polar" ? "slab" : "lichen", share: 0.8 };
  if (h.ecology === "boreal-woodland") return { kind: "lichen", share: 0.6 };
  if (h.ecology === "wetland" || h.ecology === "tropical-woodland")
    return { kind: "mossy", share: 0.7 };
  if (h.ecology === "savanna" || h.ecology === "dry-scrub")
    return {
      kind: c === "sahel" || c === "acacia" ? "red" : "dune",
      share: 0.5,
    };
  if (h.kind === "woodland" || h.wet > 0.5)
    return { kind: "mossy", share: 0.4 };
  return { kind: "lichen", share: 0.25 };
}
export function boulderFrame(h: Habitat | undefined, roll: number, size?: "medium" | "large"): string {
  if (size) {
    const stone = h && stoneKind(h);
    return `nature-rock-${stone && roll < stone.share ? stone.kind : "grey"}-${size}`;
  }
  const kind = h ? stoneKind(h).kind : "slab";
  if (kind === "basalt" || kind === "slab") {
    if (roll >= 0.6) return `nature-boulder-${kind}-b`;
    roll /= 0.6;
  }
  return `nature-boulder-${kind}-${Math.floor(roll * 3)}`;
}
export function rockFrame(h: Habitat | undefined, roll: number): string {
  const alternate = roll >= 0.6;
  roll = alternate ? (roll - 0.6) / 0.4 : roll / 0.6;
  const pick = (set: string[], share: number) => {
    const r = roll / share;
    return r < 1
      ? set[Math.floor(r * set.length)]
      : legacy[Math.floor(((roll - share) / (1 - share)) * 3)];
  };
  const frame = h ? pick(regional(stoneKind(h).kind), stoneKind(h).share) : legacy[Math.floor(roll * 3)];
  return alternate
    ? frame.startsWith("nature-rock-") ? frame.replace(/-\d$/, "-b") : "nature-rock-grey-b"
    : frame;
}
