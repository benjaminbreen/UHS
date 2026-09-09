import type { WorldObject } from "../../core/types";

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
