import type { Habitat } from "../../world/v3/habitats";

/** Which stone a loose rock is drawn as. The shared grey masonry trio stays
 * the temperate default; regional colourways lean on their own stone. */
const legacy = ["rock", "rock-1", "rock-2"];
const regional = (kind: string) => [0, 1, 2].map((i) => `nature-rock-${kind}-${i}`);
export function rockFrame(h: Habitat | undefined, roll: number): string {
  const pick = (set: string[], share: number) => {
    const r = roll / share;
    return r < 1 ? set[Math.floor(r * set.length)] : legacy[Math.floor(((roll - share) / (1 - share)) * 3)];
  };
  if (!h) return legacy[Math.floor(roll * 3)];
  const c = h.colorway;
  if (h.ecology === "desert")
    return pick(
      regional(
        c === "red-earth" || c === "kalahari" || c === "sonoran"
          ? "red"
          : c === "atacama" || c === "highland"
            ? "basalt"
            : "dune",
      ),
      0.9,
    );
  if (c === "red-earth" || c === "kalahari") return pick(regional("red"), 0.8);
  if (h.ecology === "tundra" || c === "alpine" || c === "montane")
    return pick(regional(c === "polar" ? "slab" : "lichen"), 0.8);
  if (h.ecology === "boreal-woodland") return pick(regional("lichen"), 0.6);
  if (h.ecology === "wetland" || h.ecology === "tropical-woodland")
    return pick(regional("mossy"), 0.7);
  if (h.ecology === "savanna" || h.ecology === "dry-scrub")
    return pick(regional(c === "sahel" || c === "acacia" ? "red" : "dune"), 0.5);
  if (h.kind === "woodland" || h.wet > 0.5) return pick(regional("mossy"), 0.4);
  return pick(regional("lichen"), 0.25);
}
