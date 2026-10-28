import type { WorldSetting } from "../geography/types";
import { ruled } from "../history/order";
import { AEGEAN, CHINA, ISLAMIC, ITALY } from "./common";

export type Occasion = "feast" | "wedding" | "funeral" | "hearing";

/** Where one person goes: a cell off the centre, how they hold themselves,
 * and the cell they look at. `role` keeps a place for someone in the plot. */
export type Spot = {
  dx: number;
  dy: number;
  pose: "sit" | "sit-seat" | "idle" | "sway";
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

/** The one who judges in front, the two sides before them, everyone else behind. */
function hearing(kind: Kind, s: WorldSetting): Scene {
  const judge: Scene = kind === "moot"
    ? {
      props: [-4, -2, 0, 2, 4].map((dx) => ({ prop: seatFor(s) === "seatMat" ? "seatMat" : "seatStone", dx, dy: -1 })),
      spots: [-4, -2, 0, 2, 4].map((dx) => ({ dx, dy: -1, pose: seatFor(s) === "seatMat" ? "sit" : "sit-seat", face: toward(0, 2), ...(dx === 0 ? { role: "head" } : {}) }) as Spot),
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

export function sceneFor(setting: WorldSetting | undefined, occasion: Occasion): Scene | undefined {
  if (!setting) return;
  if (occasion === "hearing") return hearing(hearingKind(setting), setting);
  const kind = feastKind(setting);
  return kind === "ring" ? ring(setting, occasion !== "funeral")
    : kind === "rows" ? rows(setting, "mat", occasion)
      : kind === "stools" ? rows(setting, "stool", occasion)
        : kind === "round" ? round(setting, occasion)
          : kind === "couches" ? couches(setting)
            : tables(setting, occasion);
}
