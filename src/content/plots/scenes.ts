import type { WorldSetting } from "../geography/types";
import { ruled } from "../history/order";
import { AEGEAN, CHINA, ISLAMIC, ITALY } from "./common";

export type Occasion = "feast" | "wedding" | "funeral" | "hearing" | "match" | "market" | "memorial" | "graves" | "smoke";

/** Where one person goes: a cell off the centre, how they hold themselves,
 * and the cell they look at. `role` keeps a place for someone in the plot. */
export type Spot = {
  dx: number;
  dy: number;
  pose: "sit" | "sit-seat" | "idle" | "sway" | "work";
  face: [number, number];
  role?: "head" | "party" | "you";
};
export type Scene = { props: { prop: string; dx: number; dy: number; v?: number }[]; spots: Spot[] };

type Kind = "ring" | "rows" | "stools" | "tables" | "round" | "couches" | "bench" | "yamen" | "qadi" | "moot";

const inside = (s: WorldSetting, b: readonly [number, number, number, number]) =>
  s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3];

/** How a household sat to eat together, broadly: round a fire where there
 * were no halls or tables to sit at, on mats in facing rows across most of
 * Asia, at boards on benches in Europe, round tables in China from the Song. */
function feastKind(s: WorldSetting): Kind {
  const { culture, year } = s;
  const contact = culture === "australian-pacific" ? 1800 : 1550;
  if (year >= 1950) return culture === "east-asian" || culture === "southeast-asian" ? "round" : "tables";
  switch (culture) {
    case "european":
      if (year < -800 || !ruled(s)) return "ring";
      // Greek and Roman diners lay on couches round a low table.
      return year < 450 && (inside(s, AEGEAN) || inside(s, ITALY)) ? "couches" : "tables";
    case "east-asian":
      // Tall tables and chairs replaced the mat in China over the Tang and Song.
      return (year >= 960 && inside(s, CHINA)) || year >= 1900 ? "round" : "rows";
    case "southeast-asian":
      return year >= 1900 ? "round" : "rows";
    case "south-asian":
      return year < -1500 ? "ring" : "rows";
    case "north-african-west-asian":
      // Mesopotamian and Egyptian banquets sat guests on stools; Islamic meals were taken on the floor.
      return year < -3500 ? "ring" : year < 650 ? "stools" : "rows";
    case "west-central-african":
    case "east-southern-african":
      // The Sahel and the Swahili coast ate as the rest of the Islamic world did.
      return year >= 1000 && inside(s, ISLAMIC) ? "rows" : "ring";
    case "mesoamerican":
    case "andean":
    case "other-indigenous-american":
    case "australian-pacific":
      return year >= contact ? "tables" : "ring";
    default:
      return "ring";
  }
}

function hearingKind(s: WorldSetting): Kind {
  if (!ruled(s)) return "moot";
  if (s.culture === "east-asian" || s.culture === "southeast-asian") return "yamen";
  if (s.culture === "north-african-west-asian" && s.year >= 650 && s.year < 1900) return "qadi";
  return "bench";
}

const toward = (dx: number, dy: number): [number, number] => [dx, dy];

function fireFor(s: WorldSetting) {
  if (s.culture === "australian-pacific") return "earthOven";
  if (s.culture === "west-central-african" || s.culture === "east-southern-african") return "threeStoneHearth";
  return s.culture === "inner-eurasian" ? "campHearth" : "longFire";
}
function seatFor(s: WorldSetting) {
  return s.culture === "european" || s.culture === "inner-eurasian" || s.culture === "other-indigenous-american" ? "seatLog" : "seatMat";
}
/** What the drink was kept in. */
function vesselFor(s: WorldSetting) {
  const { culture, year } = s;
  if (culture === "west-central-african" || culture === "east-southern-african" || culture === "mesoamerican" || culture === "australian-pacific") return "calabash";
  if (culture === "european") return year >= -100 && !(inside(s, AEGEAN) || inside(s, ITALY)) ? "barrel" : year > -1500 && year < 700 ? "amphora" : "jug";
  return "jar";
}

const board = (year: number) => (year < 1300 ? 0 : year < 1850 ? 1 : 2);

/** Strung up behind a wedding or a feast: paper lanterns in East Asia,
 * marigolds in India, bunting once it was printed cheap. */
function festoon(s: WorldSetting, occasion: Occasion) {
  if (occasion === "funeral") return [];
  const east = s.culture === "east-asian" || s.culture === "southeast-asian";
  const v = east && s.year >= 1000 ? 0 : s.culture === "south-asian" && s.year >= 1500 ? 1 : s.year >= 1850 ? 2 : undefined;
  return v === undefined ? [] : [{ prop: "festoon", dx: 0, dy: -4, v }];
}

/** What the shared food was laid on, eaten from the floor. */
function spread(s: WorldSetting, xs: number[]) {
  const islamic = s.culture !== "south-asian" && s.culture !== "east-asian" && s.culture !== "southeast-asian";
  if (islamic) {
    // A cloth or carpet spread on the floor, the dishes on a brass tray.
    const v = s.culture === "north-african-west-asian" ? 0 : 1;
    return [-2, 2].flatMap((dx) => [{ prop: "floorCarpet", dx, dy: 0, v }, { prop: "foodTray", dx, dy: 0, v: 0 }]);
  }
  if (s.culture === "east-asian") return xs.map((dx) => ({ prop: "foodTray", dx, dy: 0, v: 2 }));
  const mat = s.culture === "southeast-asian" ? [{ prop: "floorCarpet", dx: 0, dy: 0, v: 2 }] : [];
  return [...mat, ...xs.map((dx) => ({ prop: "foodTray", dx, dy: 0, v: 1 }))];
}

// Every layout leaves a clear tile between people: a figure is two tiles
// tall and a bench three wide, so neighbours on adjacent cells read as one heap.

/** A wide circle round the fire, those at the back on logs or mats. */
function ring(s: WorldSetting, dancers: boolean): Scene {
  const seat = seatFor(s), sitting = seat === "seatMat" ? "sit" : "sit-seat";
  const cells = [[-3, 1], [-3, -1], [-1, -3], [1, -3], [3, -1], [3, 1]];
  return {
    props: [
      { prop: fireFor(s), dx: 0, dy: 0 },
      ...cells.map(([dx, dy]) => ({ prop: seat, dx, dy })),
      { prop: vesselFor(s), dx: 5, dy: -2 },
      { prop: "basket", dx: -5, dy: -2 },
    ],
    spots: [
      ...cells.map(([dx, dy], i) => ({ dx, dy, pose: sitting, face: toward(0, 0), ...(i === 2 ? { role: "head" } : {}) }) as Spot),
      { dx: 0, dy: 3, pose: "idle", face: toward(0, 0), role: "you" },
      ...(dancers ? [{ dx: -1, dy: 2, pose: "sway", face: toward(1, 2) } as Spot, { dx: 2, dy: 2, pose: "sway", face: toward(-1, 2) } as Spot] : []),
    ],
  };
}

/** Two rows facing each other across the food, staggered so the near row
 * does not hide the far one's faces, and a tile back so it does not hide the food. */
function rows(s: WorldSetting, seated: "mat" | "stool", occasion: Occasion): Scene {
  const far = [-4, -2, 0, 2, 4], near = [-3, 1, 3];
  const seat = seated === "mat" ? "seatMat" : "stool", pose = seated === "mat" ? "sit" : "sit-seat";
  return {
    props: [
      ...far.map((x) => ({ prop: seat, dx: x, dy: -1 })),
      ...near.map((x) => ({ prop: seat, dx: x, dy: 2 })),
      ...(seated === "mat" ? spread(s, [-3, 1, 3]) : [-3, 1, 3].map((x, i) => ({ prop: i === 1 ? "jug" : "bowl", dx: x, dy: 0 }))),
      { prop: seat, dx: -6, dy: 0 },
      { prop: vesselFor(s), dx: 6, dy: -2 },
      ...festoon(s, occasion),
    ],
    spots: [
      { dx: -6, dy: 0, pose, face: toward(0, 0), role: "head" },
      ...far.map((x) => ({ dx: x, dy: -1, pose, face: toward(x, 0) }) as Spot),
      ...near.map((x) => ({ dx: x, dy: 2, pose, face: toward(x, 0) }) as Spot),
      { dx: -1, dy: 2, pose: "idle", face: toward(-1, 0), role: "you" },
    ],
  };
}

/** Two boards on trestles with the company along the far side, the near side left open. */
function tables(s: WorldSetting, occasion: Occasion): Scene {
  const dancers = occasion === "wedding";
  const lit = s.year < 1850 && s.year >= 500;
  return {
    props: [
      { prop: "bench", dx: -2, dy: -1 },
      { prop: "bench", dx: 2, dy: -1 },
      ...[-2, 2].map((dx) => ({ prop: "trestleTable", dx, dy: 0, v: board(s.year) })),
      { prop: "stool", dx: -5, dy: 0 },
      { prop: vesselFor(s), dx: 6, dy: -1 },
      ...(lit ? [{ prop: "fireBasket", dx: -7, dy: -1 }, { prop: "fireBasket", dx: 8, dy: 1 }] : []),
      ...festoon(s, occasion),
    ],
    spots: [
      { dx: -5, dy: 0, pose: "sit-seat", face: toward(0, 0), role: "head" },
      ...[-3, -1, 1, 3].map((x) => ({ dx: x, dy: -1, pose: "sit-seat", face: toward(x, 1) }) as Spot),
      { dx: 0, dy: 2, pose: "idle", face: toward(0, 0), role: "you" },
      ...(dancers ? [{ dx: -3, dy: 3, pose: "sway", face: toward(-1, 3) } as Spot, { dx: -1, dy: 3, pose: "sway", face: toward(-3, 3) } as Spot] : []),
    ],
  };
}

/** Two round tables well apart, guests on the far side and the ends of each. */
function round(s: WorldSetting, occasion: Occasion): Scene {
  const tables = [-3, 3];
  const around = [[-1, 0], [0, -1], [1, 0]];
  return {
    props: [
      ...tables.flatMap((cx) => [{ prop: "roundTable", dx: cx, dy: 0, v: s.year < 1900 ? 0 : 1 }, ...around.map(([dx, dy]) => ({ prop: "stool", dx: cx + dx, dy }))]),
      ...festoon(s, occasion),
    ],
    spots: [
      ...tables.flatMap((cx, t) => around.map(([dx, dy], i) => ({
        dx: cx + dx, dy, pose: "sit-seat", face: toward(cx, 0), ...(t === 0 && i === 1 ? { role: "head" } : {}),
      }) as Spot)),
      { dx: 0, dy: 2, pose: "idle", face: toward(0, 0), role: "you" },
    ],
  };
}

/** Three couches round a low table. */
function couches(s: WorldSetting): Scene {
  const benches = [[0, -2], [-4, 0], [4, 0]];
  return {
    props: [
      { prop: "bowl", dx: 0, dy: 0 },
      ...benches.map(([dx, dy]) => ({ prop: "diningCouch", dx, dy, v: 1 })),
      { prop: vesselFor(s), dx: 7, dy: -2 },
      { prop: "jug", dx: -7, dy: -2 },
    ],
    spots: [
      { dx: -1, dy: -2, pose: "sit-seat", face: toward(0, 0), role: "head" },
      { dx: 1, dy: -2, pose: "sit-seat", face: toward(0, 0) },
      { dx: -4, dy: 0, pose: "sit-seat", face: toward(0, 0) },
      { dx: 4, dy: 0, pose: "sit-seat", face: toward(0, 0) },
      { dx: 0, dy: 2, pose: "idle", face: toward(0, 0), role: "you" },
    ],
  };
}

/** The one who judges in front, the two sides before them, everyone else behind.
 * On the town's assembly ground the elders take its stone seats. */
function hearing(kind: Kind, s: WorldSetting, ground?: boolean): Scene {
  const mat = !ground && seatFor(s) === "seatMat";
  const judge: Scene = kind === "moot"
    ? {
      props: [-4, -2, 0, 2, 4].map((dx) => ({ prop: mat ? "seatMat" : "seatStone", dx, dy: -1 })),
      spots: [-4, -2, 0, 2, 4].map((dx) => ({ dx, dy: -1, pose: mat ? "sit" : "sit-seat", face: toward(0, 2), ...(dx === 0 ? { role: "head" } : {}) }) as Spot),
    }
    : kind === "qadi"
      ? { props: [{ prop: "seatMat", dx: 0, dy: -1 }], spots: [{ dx: 0, dy: -1, pose: "sit", face: toward(0, 1), role: "head" }] }
      : kind === "yamen"
        ? {
          // The magistrate sat behind a table; runners with staves stood either side.
          props: [{ prop: "stool", dx: 0, dy: -2 }, { prop: "bench", dx: 0, dy: -1 }],
          spots: [{ dx: 0, dy: -2, pose: "sit-seat", face: toward(0, 1), role: "head" }, { dx: -3, dy: -2, pose: "idle", face: toward(0, 1) }, { dx: 3, dy: -2, pose: "idle", face: toward(0, 1) }],
        }
        : {
          props: [{ prop: "bench", dx: 0, dy: -2 }, { prop: "trestleTable", dx: 0, dy: -1, v: s.year < 1850 ? 0 : 2 }],
          spots: [-1, 1].map((dx) => ({ dx, dy: -2, pose: "sit-seat", face: toward(0, 1), ...(dx === -1 ? { role: "head" } : {}) }) as Spot),
        };
  // Parties to a case knelt before a Chinese magistrate, and sat before a qadi.
  const before = kind === "yamen" || kind === "qadi" ? "sit" : "idle";
  return {
    props: judge.props,
    spots: [
      ...judge.spots,
      { dx: -2, dy: 1, pose: before, face: toward(0, -1), role: "party" },
      { dx: 2, dy: 1, pose: before, face: toward(0, -1), role: "you" },
      ...[-4, 0, 4].map((dx) => ({ dx, dy: 4, pose: "idle", face: toward(0, -1) }) as Spot),
    ],
  };
}

/** Kettledrums from the Mediterranean to Central and South Asia, a barrel drum
 * on a stand in East Asia, a tall standing drum in Africa and the Americas. */
function drumFor(s: WorldSetting) {
  if (s.culture === "east-asian" || s.culture === "southeast-asian") return 1;
  return ["west-central-african", "east-southern-african", "mesoamerican", "andean", "other-indigenous-american", "australian-pacific"].includes(s.culture) ? 2 : 0;
}
/** A drummer off to one side, standing to the drum. */
function music(s: WorldSetting, scene: Scene, dx: number, dy: number): Scene {
  return {
    props: [...scene.props, { prop: "festivalDrum", dx, dy, v: drumFor(s) }],
    // First in line after the named places, so a thin crowd still has its drummer.
    spots: [{ dx, dy: dy - 1, pose: "work", face: toward(dx, dy) }, ...scene.spots],
  };
}

/** A bout: the ring, if the game has one, the crowd sitting round its edge and
 * standing behind, the elders who judge on a carpet at the far side. */
function match(s: WorldSetting, ring?: number): Scene {
  const sitting = [[-4, -1], [-4, 1], [4, -1], [4, 1], [-2, -3], [2, -3]];
  const standing = [[-6, 0], [6, 0], [-5, -3], [5, -3], [-4, 3], [4, 3]];
  return {
    props: [
      ...(ring === undefined ? [] : [{ prop: "wrestlingRing", dx: 0, dy: 1, v: ring }]),
      { prop: "floorCarpet", dx: 0, dy: -4, v: s.culture === "north-african-west-asian" || s.culture === "inner-eurasian" ? 0 : 2 },
      { prop: vesselFor(s), dx: 7, dy: -4 },
    ],
    spots: [
      { dx: -1, dy: 0, pose: "idle", face: toward(1, 0), role: "head" },
      { dx: 1, dy: 0, pose: "idle", face: toward(-1, 0), role: "you" },
      ...[-1, 1].map((dx) => ({ dx, dy: -4, pose: "sit", face: toward(0, 0) }) as Spot),
      ...sitting.map(([dx, dy]) => ({ dx, dy, pose: "sit", face: toward(0, 0) }) as Spot),
      ...standing.map(([dx, dy]) => ({ dx, dy, pose: "idle", face: toward(0, 0) }) as Spot),
    ],
  };
}

/** Strangers' goods laid out on mats, the strangers sitting behind them, buyers in front. */
function market(s: WorldSetting): Scene {
  return {
    props: [
      ...[-3, 3].map((dx) => ({ prop: "floorCarpet", dx, dy: 0, v: 2 })),
      // Saharan salt came south by caravan to the Niger towns.
      { prop: "tradeGoods", dx: -3, dy: 0, v: 0 },
      { prop: "tradeGoods", dx: 3, dy: 0, v: s.culture === "west-central-african" ? 1 : 2 },
      { prop: vesselFor(s), dx: 6, dy: -1 },
    ],
    spots: [
      { dx: -3, dy: -1, pose: "sit", face: toward(-3, 1), role: "head" },
      { dx: 3, dy: -1, pose: "sit", face: toward(3, 1) },
      ...[-5, -2, 2, 5].map((dx) => ({ dx, dy: 2, pose: "idle", face: toward(dx, 0) }) as Spot),
      { dx: 0, dy: 2, pose: "idle", face: toward(-3, 0), role: "you" },
    ],
  };
}

/** A table of offerings for the dead, the family kneeling in rows before it. */
function memorial(s: WorldSetting): Scene {
  const east = s.culture === "east-asian" || s.culture === "southeast-asian";
  return {
    props: [
      east ? { prop: "roundTable", dx: 0, dy: 0, v: 0 } : { prop: "trestleTable", dx: 0, dy: 0, v: board(s.year) },
      ...[-1, 1].map((dx) => ({ prop: "foodTray", dx, dy: 1, v: east ? 2 : 1 })),
      { prop: "censer", dx: 0, dy: 1, v: east ? 0 : 1 },
      { prop: "seatMat", dx: 0, dy: 3 },
    ],
    spots: [
      { dx: -2, dy: 3, pose: "sit", face: toward(0, 0), role: "head" },
      { dx: 0, dy: 3, pose: "sit", face: toward(0, 0), role: "you" },
      ...[-3, -1, 1, 3].map((dx) => ({ dx, dy: 5, pose: "sit", face: toward(dx, 0) }) as Spot),
    ],
  };
}

/** The family graves, swept, with food set before them; one old grave nobody keeps. */
function graves(): Scene {
  return {
    props: [
      { prop: "graveMound", dx: -3, dy: -1, v: 0 },
      { prop: "graveMound", dx: 1, dy: -1, v: 0 },
      { prop: "graveMound", dx: 6, dy: -2, v: 1 },
      ...[-3, 1].map((dx) => ({ prop: "foodTray", dx, dy: 1, v: 2 })),
      { prop: "censer", dx: -1, dy: 0, v: 0 },
      { prop: "basket", dx: -6, dy: 1 },
    ],
    spots: [
      { dx: -3, dy: 2, pose: "sit", face: toward(-3, 0), role: "head" },
      { dx: -1, dy: 2, pose: "idle", face: toward(-1, 0), role: "you" },
      ...[1, 3].map((dx) => ({ dx, dy: 2, pose: "sit", face: toward(dx, 0) }) as Spot),
      { dx: -5, dy: 3, pose: "idle", face: toward(-3, 0) },
    ],
  };
}

/** A line of smoky fires across the wind, people between them beating pots. */
function smoke(s: WorldSetting): Scene {
  const fires = [-6, -2, 2, 6];
  return {
    props: [...fires.map((dx) => ({ prop: fireFor(s), dx, dy: 0 })), ...[-4, 4].map((dx) => ({ prop: "pot", dx, dy: 1 }))],
    spots: [
      ...[-4, 0, 4].map((dx, i) => ({ dx, dy: 0, pose: "work", face: toward(dx, -3), ...(i === 1 ? { role: "head" } : {}) }) as Spot),
      ...[-7, 7].map((dx) => ({ dx, dy: 1, pose: "idle", face: toward(dx, -3) }) as Spot),
      { dx: 2, dy: 2, pose: "idle", face: toward(2, -3), role: "you" },
    ],
  };
}

/** Raked sand by default; a sumo ring in Japan, an akhara's pit in South
 * Asia, a roped meadow where oil wrestling is held. */
export function ringFor(s: WorldSetting) {
  if (inside(s, [128, 30, 146, 46])) return 1;
  if (s.culture === "south-asian") return 2;
  return s.year >= 1350 && inside(s, [20, 36, 45, 42.5]) ? 3 : 0;
}

/** The grave styles a town's burial ground uses, cycled, and how many graves;
 * none where the dead were buried under the house floor. */
export function burialFor(s: WorldSetting): { graves: number[]; count: number } | undefined {
  const { culture, year } = s, all = (graves: number[], count = 8) => ({ graves, count });
  if (year >= 650 && inside(s, ISLAMIC) && culture !== "european" && culture !== "south-asian")
    return all(year >= 1400 && inside(s, [20, 33, 45, 43]) ? [4, 4, 3] : [3]);
  switch (culture) {
    case "east-asian":
      return inside(s, [124, 33, 131, 43]) ? all([5, 5, 1], 5) : all(inside(s, [128, 30, 146, 46]) ? [6] : [0, 0, 1]);
    case "southeast-asian":
      return all([0, 1]);
    // Burned, not buried: a few stones raised to the dead where the pyres are.
    case "south-asian":
      return all([11], 3);
    case "european":
      return all(year < 500 ? [2, 10] : year < 1600 ? [7, 7, 8] : [8, 8, 7]);
    case "west-central-african":
    case "east-southern-african":
      return all([9, 9, 10]);
    case "other-indigenous-american":
      return all(year >= 1800 ? [7, 8] : [2, 10]);
    case "andean":
      return all([12], 3);
    case "inner-eurasian":
    case "north-african-west-asian":
      return all([2, 10]);
  }
}

/** A permanent ground's footprint round its anchor and its furniture. */
export type Ground = { box: [number, number, number, number]; props: Scene["props"] };

/** What the town keeps standing for an occasion, laid where that occasion's
 * scene lands on it; the engine finds the ground by its first prop. "tree" is
 * not a prop: the planner stands a shade tree there. */
export function groundFor(s: WorldSetting, id: string): Ground | undefined {
  if (id === "venue.wrestling-ground") return { box: [-8, -4, 7, 3], props: [{ prop: "wrestlingRing", dx: 0, dy: 1, v: ringFor(s) }] };
  if (id === "venue.assembly" || id === "venue.kgotla")
    return { box: [-5, -5, 5, 4], props: [...[-4, -2, 0, 2, 4].map((dx) => ({ prop: "seatStone", dx, dy: -1 })), { prop: "tree", dx: 0, dy: -4 }] };
  if (id === "venue.market-ground") return { box: [-6, -5, 6, 2], props: [{ prop: "tree", dx: 0, dy: -4 }] };
  const style = id === "burial" && burialFor(s);
  if (!style) return;
  // The first three are where a family's graves fall in the `graves` scene.
  const graves = [[-3, -1], [1, -1], [6, -2], [-6, -3], [-1, -4], [3, -4], [7, -5], [-5, -6]];
  return {
    box: [-10, -8, 10, 3],
    props: graves.slice(0, style.count).map(([dx, dy], i) => ({ prop: "graveMound", dx, dy, v: style.graves[i % style.graves.length] })),
  };
}

/** `words.ring` picks the wrestling ring's variant; without it a match has no ring.
 * `words.ground` says the meeting is on the town's own ground for it. */
export function sceneFor(setting: WorldSetting | undefined, occasion: Occasion, words?: Record<string, string>): Scene | undefined {
  if (!setting) return;
  if (occasion === "match") return music(setting, match(setting, words?.ring ? Number(words.ring) : undefined), -8, -3);
  if (occasion === "market") return market(setting);
  if (occasion === "memorial") return memorial(setting);
  if (occasion === "graves") return graves();
  if (occasion === "smoke") return smoke(setting);
  if (occasion === "hearing") return words?.ground ? hearing("moot", setting, true) : hearing(hearingKind(setting), setting);
  const kind = feastKind(setting);
  const scene = kind === "ring" ? ring(setting, occasion !== "funeral")
    : kind === "rows" ? rows(setting, "mat", occasion)
      : kind === "stools" ? rows(setting, "stool", occasion)
        : kind === "round" ? round(setting, occasion)
          : kind === "couches" ? couches(setting)
            : tables(setting, occasion);
  return occasion === "wedding" ? music(setting, scene, -9, -2) : scene;
}
