import type { Finish, Kind, RoomParams } from "../../render/interiors/room";
import { shiftHue } from "../../render/interiors/room";
import type { InteriorProfile, RoomTemplate } from "./types";

export type BackroomSite = {
  lon: number;
  lat: number;
  year: number;
  settlement?: string;
  camp?: boolean;
  use?: string;
};

export type BackroomPropSpec = {
  kind: Kind;
  lx: number;
  ly: number;
  w: number;
  d: number;
  wall: boolean;
  on?: boolean;
  item?: string;
};

export type BackroomStaffSpec = {
  work: string;
  role: string;
  doing: string;
  sex?: "female" | "male";
  spot?: "stage" | "seat";
  hours?: [number, number];
};

export type SecretBackroom = {
  id: string;
  label: string;
  note: string;
  template: RoomTemplate;
  props: readonly BackroomPropSpec[];
  /** Specialist NPCs stationed inside the secret back-room. */
  staff?: readonly BackroomStaffSpec[];
  /** Whether this back-room belongs at this place, year, and building. */
  fits: (profile: InteriorProfile, site: BackroomSite, finish: Finish) => boolean;
};

const inBox = (s: BackroomSite, lon0: number, lon1: number, lat0: number, lat1: number) =>
  s.lon >= lon0 && s.lon <= lon1 && s.lat >= lat0 && s.lat <= lat1;
const isUrban = (s: BackroomSite) => s.settlement === "city" || s.settlement === "port" || s.settlement === "town";
const isShop = (p: InteriorProfile) => (p.program ?? p.rooms?.[0]?.program) === "shop";
const isTavern = (p: InteriorProfile) => (p.program ?? p.rooms?.[0]?.program) === "serve" || !!p.uses?.some((u) => /tavern|alehouse|inn|coffee|tea|izakaya/.test(u));

export const SECRET_BACKROOMS: readonly SecretBackroom[] = [
  {
    id: "speakeasy",
    label: "Back-room speakeasy",
    note: "Behind the innocent front room, a concealed doorway opens onto a dim Art Deco speakeasy. An upright piano stands beside backlit shelves of bootleg spirits.",
    staff: [
      { work: "speakeasy-proprietor", role: "Speakeasy Proprietor", doing: "Pouring bootleg gin behind the backlit bar", spot: "stage" },
      { work: "pianist", role: "Jazz Pianist", doing: "Playing ragtime at the upright piano", spot: "stage", hours: [18, 2] },
    ],
    fits: (p, s) =>
      inBox(s, -130, -64, 24, 50) && s.year >= 1920 && s.year <= 1933 && isUrban(s) && (isShop(p) || isTavern(p) || p.id === "art-deco-apartments"),
    template: {
      id: "speakeasy",
      label: "Back-room speakeasy",
      role: "hall",
      size: [10, 7],
      windowStyle: "none",
      windows: 0,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.08, soot: 0.05 },
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.05, soot: 0.03 },
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.02, soot: 0 },
      ],
      colorways: [
        { name: "Prohibition velvet", wall: "#5e3646", trim: "#2c1820", floor: "#5a1a28", wood: "#42221c", accent: "#d8a438" },
      ],
      styles: { altar: "backroom-speakeasy-bar", lamp: "electric" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 6, d: 1, wall: true, on: true },
      { kind: "stool", lx: 3, ly: 2, w: 1, d: 1, wall: false },
      { kind: "stool", lx: 6, ly: 2, w: 1, d: 1, wall: false },
      { kind: "fixture", lx: 1, ly: 4, w: 2, d: 1, wall: false, on: true, item: "backroom:speakeasy-piano" },
      { kind: "fixture", lx: 6, ly: 4, w: 2, d: 1, wall: false, on: true, item: "backroom:card-table" },
      { kind: "stool", lx: 5, ly: 4, w: 1, d: 1, wall: false },
      { kind: "stool", lx: 8, ly: 4, w: 1, d: 1, wall: false },
      { kind: "lamp", lx: 0, ly: 1, w: 1, d: 1, wall: false, on: true },
      { kind: "lamp", lx: 9, ly: 1, w: 1, d: 1, wall: false, on: true },
      { kind: "clutter", lx: 4, ly: 5, w: 1, d: 1, wall: false, item: "bottles" },
    ],
  },
  {
    id: "wunderkammer",
    label: "Cabinet of curiosities",
    note: "A private rear door opens into a collector's wunderkammer: shelves of glowing specimen jars, red coral, a spiraling narwhal horn, and a brass celestial globe beneath a suspended crocodile.",
    staff: [
      { work: "antiquarian", role: "Curiosity Collector", doing: "Cataloguing specimens beside the walnut cabinet", spot: "stage" },
    ],
    fits: (p, s, finish) =>
      inBox(s, -12, 35, 34, 62) && s.year >= 1550 && s.year <= 1840 && isUrban(s) && finish >= 1 && !isTavern(p),
    template: {
      id: "wunderkammer",
      label: "Cabinet of curiosities",
      role: "work",
      size: [10, 7],
      windowStyle: "glazed",
      windows: 1,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "panel", floor: "parquet", dado: "panel", wear: 0.12, soot: 0.04 },
        { wall: "panel", floor: "parquet", dado: "panel", wear: 0.06, soot: 0.02 },
        { wall: "panel", floor: "parquet", dado: "panel", wear: 0.02, soot: 0 },
      ],
      colorways: [
        { name: "Collector's emerald", wall: "#3c584a", trim: "#382418", floor: "#7c5636", wood: "#52321c", accent: "#c89634" },
      ],
      styles: { altar: "backroom-wunderkammer" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 6, d: 1, wall: true, on: true },
      { kind: "window", lx: 9, ly: 0, w: 1, d: 0, wall: true, on: true },
      { kind: "rug", lx: 2, ly: 2, w: 6, d: 3, wall: false },
      { kind: "fixture", lx: 1, ly: 3, w: 1, d: 1, wall: false, on: true, item: "backroom:globe" },
      { kind: "desk", lx: 6, ly: 3, w: 2, d: 1, wall: false, on: true },
      { kind: "stool", lx: 6, ly: 4, w: 1, d: 1, wall: false },
      { kind: "armchair", lx: 1, ly: 5, w: 1, d: 1, wall: false },
      { kind: "clutter", lx: 3, ly: 3, w: 1, d: 1, wall: false, item: "books" },
      { kind: "clutter", lx: 8, ly: 4, w: 1, d: 1, wall: false, item: "candles" },
      { kind: "lamp", lx: 0, ly: 1, w: 1, d: 1, wall: false, on: true },
    ],
  },
  {
    id: "clandestine-press",
    label: "Clandestine press",
    note: "Tucked behind the front room sits a secret printing cellar. Fresh broadsheets hang drying overhead above an ink-stained wooden screw press and trays of lead type.",
    staff: [
      { work: "pamphleteer", role: "Clandestine Printer", doing: "Pulling contraband broadsheets off the wooden press", spot: "stage" },
    ],
    fits: (p, s) =>
      ((inBox(s, -12, 35, 35, 62) && s.year >= 1520 && s.year <= 1860)
        || (inBox(s, -85, -65, 35, 46) && s.year >= 1750 && s.year <= 1800)
        || (inBox(s, 10, 45, 42, 62) && s.year >= 1945 && s.year <= 1989))
      && isUrban(s) && !isTavern(p) && p.seating === "chair",
    template: {
      id: "clandestine-press",
      label: "Clandestine press",
      role: "work",
      size: [10, 7],
      windowStyle: "none",
      windows: 0,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "brick", floor: "plank", wear: 0.3, soot: 0.12 },
        { wall: "brick", floor: "plank", wear: 0.22, soot: 0.08 },
        { wall: "brick", floor: "plank", wear: 0.14, soot: 0.05 },
      ],
      colorways: [
        { name: "Printer's ink", wall: "#a88e74", trim: "#3c281c", floor: "#6e523a", wood: "#583820", accent: "#8c2624" },
      ],
      styles: { altar: "backroom-press" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 5, d: 1, wall: true, on: true },
      { kind: "fixture", lx: 1, ly: 3, w: 2, d: 1, wall: false, on: true, item: "backroom:typecase" },
      { kind: "crate", lx: 8, ly: 2, w: 1, d: 1, wall: false },
      { kind: "crate", lx: 8, ly: 3, w: 1, d: 1, wall: false },
      { kind: "table", lx: 6, ly: 4, w: 2, d: 1, wall: false },
      { kind: "stool", lx: 6, ly: 5, w: 1, d: 1, wall: false },
      { kind: "clutter", lx: 4, ly: 3, w: 1, d: 1, wall: false, item: "letters" },
      { kind: "clutter", lx: 3, ly: 5, w: 1, d: 1, wall: false, item: "books" },
      { kind: "clutter", lx: 7, ly: 2, w: 1, d: 1, wall: false, item: "candles" },
      { kind: "lamp", lx: 0, ly: 1, w: 1, d: 1, wall: false, on: true },
    ],
  },
  {
    id: "alchemist-sanctum",
    label: "Alchemist's sanctum",
    note: "Copper alembics gleam beside a banked brick furnace. Coiled glass retorts bubble softly under brass armillary rings and hand-inked star charts.",
    staff: [
      { work: "alchemist", role: "Alchemist", doing: "Watching copper alembics simmer over the furnace", spot: "stage" },
    ],
    fits: (p, s, finish) =>
      ((inBox(s, -12, 65, 22, 60) && s.year >= 850 && s.year <= 1760)
        || (inBox(s, 68, 146, 15, 45) && s.year >= 600 && s.year <= 1750))
      && isUrban(s) && finish >= 1 && !isTavern(p),
    template: {
      id: "alchemist-sanctum",
      label: "Alchemist's sanctum",
      role: "work",
      size: [10, 7],
      windowStyle: "none",
      windows: 0,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "stone", floor: "flag", wear: 0.22, soot: 0.18 },
        { wall: "stone", floor: "flag", wear: 0.16, soot: 0.14 },
        { wall: "stone", floor: "flag", wear: 0.1, soot: 0.1 },
      ],
      colorways: [
        { name: "Athanor stone", wall: "#9e9688", trim: "#3c2e24", floor: "#726c64", wood: "#543620", accent: "#428468" },
      ],
      styles: { altar: "backroom-alembic" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 5, d: 1, wall: true, on: true },
      { kind: "fixture", lx: 1, ly: 3, w: 1, d: 1, wall: false, on: true, item: "backroom:armillary" },
      { kind: "scrolls", lx: 8, ly: 1, w: 1, d: 1, wall: false },
      { kind: "table", lx: 6, ly: 3, w: 2, d: 1, wall: false },
      { kind: "stool", lx: 6, ly: 4, w: 1, d: 1, wall: false },
      { kind: "chest", lx: 8, ly: 4, w: 1, d: 1, wall: false },
      { kind: "clutter", lx: 2, ly: 5, w: 1, d: 1, wall: false, item: "books" },
      { kind: "clutter", lx: 4, ly: 4, w: 1, d: 1, wall: false, item: "candles" },
      { kind: "clutter", lx: 7, ly: 5, w: 1, d: 1, wall: false, item: "bottles" },
    ],
  },
  {
    id: "herb-stillroom",
    label: "Herb stillroom",
    note: "The air is thick with dried lavender, sage, and warm resin. Bundles of herbs hang from the rafters above shelves of colored glass tinctures and a simmering copper still.",
    staff: [
      { work: "herbalist", role: "Stillroom Herbalist", doing: "Distilling lavender and resin tinctures", spot: "stage" },
    ],
    fits: (_p, s) => s.year >= 1150 && s.year <= 1925 && !s.camp,
    template: {
      id: "herb-stillroom",
      label: "Herb stillroom",
      role: "work",
      size: [9, 7],
      windowStyle: "shutter",
      windows: 1,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "timber", floor: "plank", wear: 0.22, soot: 0.08 },
        { wall: "timber", floor: "plank", wear: 0.14, soot: 0.05 },
        { wall: "timber", floor: "plank", wear: 0.08, soot: 0.02 },
      ],
      colorways: [
        { name: "Apothecary herb", wall: "#d4c4a4", trim: "#4e3420", floor: "#866242", wood: "#624024", accent: "#4c7a52" },
      ],
      styles: { altar: "backroom-stillroom" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 5, d: 1, wall: true, on: true },
      { kind: "window", lx: 8, ly: 0, w: 1, d: 0, wall: true, on: true },
      { kind: "fixture", lx: 1, ly: 3, w: 1, d: 1, wall: false, on: true, item: "backroom:still" },
      { kind: "table", lx: 5, ly: 3, w: 2, d: 1, wall: false },
      { kind: "stool", lx: 5, ly: 4, w: 1, d: 1, wall: false },
      { kind: "basket", lx: 7, ly: 4, w: 1, d: 1, wall: false },
      { kind: "clutter", lx: 3, ly: 3, w: 1, d: 1, wall: false, item: "potted-herb" },
      { kind: "clutter", lx: 2, ly: 5, w: 1, d: 1, wall: false, item: "bottles" },
      { kind: "clutter", lx: 6, ly: 5, w: 1, d: 1, wall: false, item: "candles" },
    ],
  },
  {
    id: "smuggler-parlour",
    label: "Back-room parlour",
    note: "Through the back curtain lies a shuttered gaming snug — a green-baize card table under a low shaded lamp, flanked by contraband casks and brass-bound sea chests.",
    staff: [
      { work: "card-sharp", role: "Back-Room Dealer", doing: "Shuffling cards beside the green-baize table", spot: "stage" },
    ],
    fits: (p, s) => s.year >= 1650 && s.year <= 1965 && isUrban(s) && (isTavern(p) || isShop(p) || s.settlement === "port"),
    template: {
      id: "smuggler-parlour",
      label: "Back-room parlour",
      role: "hall",
      size: [10, 7],
      windowStyle: "none",
      windows: 0,
      sleep: "none",
      fire: "none",
      program: "passage",
      looks: [
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.24, soot: 0.1 },
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.16, soot: 0.06 },
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.08, soot: 0.03 },
      ],
      colorways: [
        { name: "Harbour snug", wall: "#7c6048", trim: "#322014", floor: "#664830", wood: "#4e2e1a", accent: "#22603e" },
      ],
      styles: { altar: "backroom-vault" },
    },
    props: [
      { kind: "altar", lx: 2, ly: 0, w: 5, d: 1, wall: true, on: true },
      { kind: "rug", lx: 2, ly: 2, w: 6, d: 4, wall: false },
      { kind: "fixture", lx: 4, ly: 3, w: 2, d: 1, wall: false, on: true, item: "backroom:card-table" },
      { kind: "stool", lx: 3, ly: 3, w: 1, d: 1, wall: false },
      { kind: "stool", lx: 6, ly: 3, w: 1, d: 1, wall: false },
      { kind: "stool", lx: 4, ly: 4, w: 1, d: 1, wall: false },
      { kind: "stool", lx: 5, ly: 4, w: 1, d: 1, wall: false },
      { kind: "clutter", lx: 1, ly: 4, w: 1, d: 1, wall: false, item: "bottles" },
      { kind: "clutter", lx: 8, ly: 4, w: 1, d: 1, wall: false, item: "candles" },
      { kind: "lamp", lx: 0, ly: 1, w: 1, d: 1, wall: false, on: true },
    ],
  },
];

export const BACKROOM_NOTES: Record<string, string> = Object.fromEntries(
  SECRET_BACKROOMS.map((b) => [b.label, b.note]),
);

export function backroomById(id: string) {
  return SECRET_BACKROOMS.find((b) => b.id === id);
}

/** Deterministically decides whether an ordinary shop, tavern, or urban house hides a secret back-room (~13% of eligible buildings), or guarantees one when the householder's profession calls for it. */
export function pickBackroom(
  profile: InteriorProfile,
  site: BackroomSite | undefined,
  seed: number,
  finish: Finish,
  forcedId?: string,
  ownerRole?: string,
): SecretBackroom | undefined {
  if (forcedId) return backroomById(forcedId);
  if (!site || site.camp) return undefined;
  // Never bolt a secret back-room onto sacred venues, theatres, hospitals, prisons, factories, towers, or the Overlook.
  if (profile.observance || profile.institution || profile.institutionPlan === "overlook" || profile.institutionPlan === "corridor" || profile.door === "lift" || profile.door === "none") return undefined;
  if (profile.program === "rows" || profile.program === "works" || profile.program === "ward" || profile.program === "gather") return undefined;
  if (profile.shapes[0] === "round" || profile.shapes[0] === "oval") return undefined;
  if (ownerRole) {
    const r = ownerRole.toLowerCase();
    if (/speakeasy|bootleg|blind-pig/.test(r)) return backroomById("speakeasy");
    if (/antiquarian|curiosity|cabinet keeper|natural philosopher|curio/.test(r)) return backroomById("wunderkammer");
    if (/pamphlet|clandestine print|underground print|samizdat/.test(r)) return backroomById("clandestine-press");
    if (/alchemist|chymist|jindan|iksir/.test(r)) return backroomById("alchemist-sanctum");
    if (/card sharp|faro dealer|back-room dealer|gaming-house|smuggl/.test(r)) return backroomById("smuggler-parlour");
    if (/herbalist|stillroom/.test(r)) return backroomById("herb-stillroom");
  }
  const eligible = SECRET_BACKROOMS.filter((b) => b.fits(profile, site, finish));
  if (!eligible.length) return undefined;
  const m1 = Math.imul(seed ^ 0x517cc1b7, 2654435761) >>> 0;
  const roll = (((m1 ^ (m1 >>> 15)) >>> 0) % 1000) / 1000;
  // Prohibition speakeasies and urban shops get a slightly livelier discovery rate (~15%); general dwellings ~11%.
  const chance = eligible.some((b) => b.id === "speakeasy") ? 0.22 : isShop(profile) || isTavern(profile) ? 0.15 : 0.11;
  if (roll >= chance) return undefined;
  const m2 = Math.imul(seed ^ 0x9e3779b9, 1597334677) >>> 0;
  const idx = ((m2 ^ (m2 >>> 15)) >>> 0) % eligible.length;
  return eligible[idx];
}

// --- Everyday Household Quirks & Sophisticated Room Variation ---

export type HouseholdQuirk = {
  id: string;
  /** Extra lived-in clutter items mixed into the room's pool. */
  clutter: readonly string[];
  /** Optional signature corner vignettes (`quirk:*` fixtures), footprint [w, d]. */
  fixtures?: readonly { item: string; w: number; d: number }[];
  /** Extra decor / companion piece added to living rooms. */
  furnish?: readonly Kind[];
  /** Multiplier on wear (<1 immaculate, >1 characterfully weathered). */
  wearScale?: number;
};

/** Picks a grounded, era-appropriate personality quirk for any ordinary house, shop, or tavern, honoring the householder's profession when relevant. */
export function pickHouseholdQuirk(
  profile: InteriorProfile,
  year: number,
  seed: number,
  finish: Finish,
  ownerRole?: string,
): HouseholdQuirk | undefined {
  if (profile.observance || profile.institution || profile.institutionPlan === "overlook" || profile.program === "rows" || profile.program === "works" || profile.program === "ward") return undefined;
  if (profile.shapes[0] === "round" || profile.shapes[0] === "oval" || profile.door === "flap") return undefined;

  if (ownerRole || profile.id.startsWith("shop-pet-") || profile.id.startsWith("shop-music-")) {
    const r = (ownerRole ?? "").toLowerCase();
    if (profile.id.startsWith("shop-pet-") || /pet shop|bird-?sell|bird fancier|canary|aquarium/.test(r)) {
      return {
        id: "pet-shop",
        clutter: ["potted-herb", "flowers", "bottles"],
        furnish: ["cat", "plant"],
        fixtures: [
          { item: "quirk:birdcage", w: 1, d: 1 },
          { item: "quirk:terrarium", w: 1, d: 1 },
          { item: "quirk:birdcage", w: 1, d: 1 },
        ],
      };
    }
    if (profile.id.startsWith("shop-music-") || /music shop|instrument maker|luthier|piano maker|piano tuner/.test(r)) {
      return {
        id: "music-shop",
        clutter: ["letters", "candles", "books"],
        fixtures: year >= 1820
          ? [{ item: "quirk:piano", w: 2, d: 1 }, { item: year >= 1920 ? "quirk:guitar" : "quirk:lute", w: 1, d: 1 }]
          : [{ item: "quirk:lute", w: 1, d: 1 }, { item: "quirk:lute", w: 1, d: 1 }],
      };
    }
    if (/piano|pianist/.test(r)) {
      return { id: "musical", clutter: ["candles", "letters"], fixtures: [{ item: "quirk:piano", w: 2, d: 1 }] };
    }
    if (/lutenist|oud|pipa|biwa/.test(r)) {
      return { id: "musical", clutter: ["candles", "letters"], fixtures: [{ item: "quirk:lute", w: 1, d: 1 }] };
    }
    if (/guitar|vihuel/.test(r)) {
      return { id: "musical", clutter: ["candles", "bottles"], fixtures: [{ item: "quirk:guitar", w: 1, d: 1 }] };
    }
    if (/painter|artist/.test(r)) {
      return { id: "painter", clutter: ["bottles", "letters", "candles"], furnish: ["frame"], fixtures: [{ item: "quirk:easel", w: 1, d: 1 }] };
    }
  }

  const m = Math.imul(seed ^ 0x27d4eb2d, 2654435761) >>> 0;
  const mix = (m ^ (m >>> 15)) >>> 0;
  const h = mix % 100;
  // ~78% of ordinary dwellings/shops carry a distinct lived-in quirk so neighbors feel genuinely different!
  if (h >= 78) return undefined;

  const chair = profile.seating === "chair";
  const pool: HouseholdQuirk[] = [
    {
      id: "hearth-cat",
      clutter: ["yarn", "candles", "tea-set"],
      furnish: ["cat", "rug"],
    },
    {
      id: "botanical",
      clutter: ["potted-herb", "flowers", "bottles"],
      furnish: ["plant"],
      fixtures: [
        year >= 1820 && chair && finish >= 1
          ? { item: "quirk:terrarium", w: 1, d: 1 }
          : { item: "quirk:herb-rack", w: 1, d: 1 },
      ],
    },
    {
      id: "musical",
      clutter: ["candles", "letters"],
      fixtures: [
        year >= 1955 ? { item: "quirk:guitar", w: 1, d: 1 }
        : year >= 1835 && chair && finish >= 1 ? { item: "quirk:piano", w: 2, d: 1 }
        : { item: "quirk:lute", w: 1, d: 1 },
      ],
    },
    {
      id: "tea-lover",
      clutter: ["tea-set", "candles", "books"],
      ...(year >= 1650 ? { fixtures: [{ item: "quirk:samovar", w: 1, d: 1 }] } : {}),
    },
    {
      id: "weathered",
      clutter: ["bottles", "candles", "shoes"],
      wearScale: 1.45,
    },
    {
      id: "fastidious",
      clutter: ["flowers", "tea-set"],
      furnish: ["frame"],
      wearScale: 0.45,
    },
  ];
  if (year >= 1200 && finish >= 1) {
    pool.push({
      id: "bookish",
      clutter: ["books", "letters", "candles"],
      furnish: chair ? ["armchair", "lamp"] : ["scrolls"],
      ...(year >= 1520 && chair ? { fixtures: [{ item: "quirk:globe", w: 1, d: 1 }] } : {}),
    });
  }
  if (year >= 1450 && chair && finish >= 1) {
    pool.push({
      id: "painter",
      clutter: ["bottles", "letters", "candles"],
      furnish: ["frame"],
      fixtures: [{ item: "quirk:easel", w: 1, d: 1 }],
    });
  }
  if (year >= 1760 && year <= 1955 && chair && finish >= 1) {
    pool.push({
      id: "songbird",
      clutter: ["flowers", "tea-set", "chess"],
      fixtures: [{ item: "quirk:birdcage", w: 1, d: 1 }],
    });
  }
  if (year >= 1100) {
    pool.push({
      id: "games",
      clutter: ["chess", "bottles", "candles"],
    });
  }
  return pool[(mix >>> 7) % pool.length];
}

/** Gives multi-room houses subtle, harmonious per-room palette variation (cooler restful bedrooms, warmer kitchens, richer studies)
 * so every room in a house feels distinct rather than stamped from a single flat swatch. */
export function varyRoomPalette(params: RoomParams, role: RoomParams["role"], seed: number): RoomParams {
  if (!role || params.floorPattern === "overlook-hex" || params.floorPattern === "snow-ground") return params;
  const jitter = (((seed >>> 3) % 7) - 3) * 0.008;
  if (role === "sleep") {
    return {
      ...params,
      wall: shiftHue(params.wall, 0.04 + jitter, -0.02),
      accent: shiftHue(params.accent, 0.08, -0.01),
    };
  }
  if (role === "kitchen") {
    return {
      ...params,
      wall: shiftHue(params.wall, -0.02 + jitter, -0.01),
      floor: shiftHue(params.floor, -0.01, -0.03),
    };
  }
  if (role === "work" || role === "store") {
    return {
      ...params,
      wall: shiftHue(params.wall, jitter, -0.04),
      wear: Math.min(1, params.wear + 0.08),
    };
  }
  return {
    ...params,
    wall: shiftHue(params.wall, jitter, 0),
  };
}
