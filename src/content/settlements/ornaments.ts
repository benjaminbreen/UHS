import type { Pack, WorldObject } from "../../core/types";

/** What a public square held. Content names these per fabric; the planner only
 * places them, and the renderer only knows their sprites. A `monument` carries
 * no interaction: it is there to be looked at and to make the square read as a
 * particular place rather than an empty paved rectangle. */
export type Ornament = {
  id: string;
  label: string;
  sprite: string;
  kind: WorldObject["kind"];
  /** Cells the piece occupies, so a large one is not put in a doorway. */
  size: number;
  /** Larger sprite for the same thing when it is the square's centrepiece. */
  focusSprite?: string;
  /** The piece is its own platform or ground, so no dais is built under it. */
  grounded?: boolean;
};

/** What a street was lit by, where and when. Broad defaults, not a history of
 * public lighting: oil and then gas in western cities from about 1700, wired
 * lamps from the 1890s, sodium and its successors from about 1960. Before any
 * of that a city lit a square, not a street, and lit it with fire. */
export function lampFor(pack: Pack): { sprite: string; label: string } {
  const year = pack.year;
  const culture = pack.setting?.culture;
  const western =
    culture === "european" || culture === "north-african-west-asian";
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  const variant = western ? 0 : eastern ? 1 : 2;
  const lamp = (id: string, label: string) => ({
    sprite: `study-propb-${id}-${variant}`,
    label,
  });
  if (year >= 1960) return lamp("sodium-lamp", "Street lamp");
  if (year >= 1890) return lamp("electric-lamp", "Street lamp");
  if (year >= 1700 && western) return lamp("gas-lamp", "Gas lamp");
  if (year >= 1000 && eastern) return lamp("lantern-post", "Lantern post");
  // A square's fire, not a lit street: the column is a classical and west
  // Asian habit, the plain post is everyone else's.
  if (year >= -499 && (western || culture === "south-asian"))
    return lamp("brazier-post", "Brazier column");
  return lamp("torch-post", "Torch post");
}

/** What a market sold from. Five builds, chosen by date and region: trestles
 * before anything else, an awning where cloth was cheap, a roofed booth for a
 * permanent pitch, a cart for the street trader, a tubular barrow after that. */
export function stallFor(pack: Pack, index = 0): { sprite: string; label: string } {
  const year = pack.year;
  const culture = pack.setting?.culture;
  const eastern = culture === "east-asian" || culture === "southeast-asian";
  const build =
    year >= 1900
      ? "stall-modern"
      : year >= 1650
        ? "stall-cart"
        : eastern && year >= 500
          ? "stall-booth"
          : year >= -499
            ? "stall-awning"
            : "stall-trestle";
  const label =
    build === "stall-modern"
      ? "Market barrow"
      : build === "stall-cart"
        ? "Market cart"
        : build === "stall-booth"
          ? "Market booth"
          : build === "stall-awning"
            ? "Market stall"
            : "Trestle stall";
  // Neighbouring pitches are not the same pitch twice.
  return { sprite: `study-propb-${build}-${index % 3}`, label };
}

export const ornaments: Record<string, Ornament> = {
  well: {
    id: "well",
    label: "Public well",
    sprite: "well",
    kind: "well",
    size: 2,
    grounded: true,
  },
  fountain: {
    id: "fountain",
    label: "Public fountain",
    sprite: "fountain",
    focusSprite: "monument-fountain",
    kind: "well",
    size: 2,
  },
  brazier: {
    id: "brazier",
    label: "Public brazier",
    sprite: "fire",
    kind: "fire",
    size: 1,
  },
  statue: {
    id: "statue",
    label: "Statue on a plinth",
    sprite: "statue",
    focusSprite: "monument-statue",
    kind: "monument",
    size: 1,
  },
  stele: {
    id: "stele",
    label: "Inscribed stone",
    sprite: "stele",
    focusSprite: "monument-obelisk",
    kind: "monument",
    size: 1,
  },
  cross: {
    id: "cross",
    label: "Market cross",
    sprite: "market-cross",
    focusSprite: "monument-cross",
    kind: "monument",
    size: 1,
  },
  kiosk: {
    id: "kiosk",
    label: "Kiosk",
    sprite: "kiosk",
    kind: "monument",
    size: 2,
  },
  altar: {
    id: "altar",
    label: "Stepped platform",
    sprite: "altar-platform",
    kind: "monument",
    size: 2,
  },
  post: {
    id: "post",
    label: "Chain post",
    sprite: "post",
    kind: "monument",
    size: 1,
  },
  planter: {
    id: "planter",
    label: "Planter",
    sprite: "planter",
    kind: "monument",
    size: 1,
  },
  bench: {
    id: "bench",
    label: "Bench",
    sprite: "bench",
    kind: "monument",
    size: 1,
  },
  lamp: {
    id: "lamp",
    label: "Lamp post",
    sprite: "lamp-post",
    kind: "monument",
    size: 1,
  },
};
