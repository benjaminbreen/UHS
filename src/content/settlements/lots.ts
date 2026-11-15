import type { WorldSetting } from "../geography/types";

/**
 * Open lots: what a town or village did with ground it left unbuilt. A lot
 * gets one use from the place's own facts (culture, climate, ecology,
 * building material, year), and the use lays its props out to fit whatever
 * rectangle the block left. The art is scripts/art/props_b/lots.py.
 */
export type LotUse = "garden" | "drying" | "fuel" | "threshing" | "pen" | "sacred" | "ruin" | "waste" | "square";

/** A prop at a cell of the lot, counted from its top-left; `garden` lots
 * also want their open ground dug into beds by the yard code. */
export type LotItem = { prop: string; x: number; y: number };
export type LotPlan = { use: LotUse; items: LotItem[]; garden?: boolean; fenced?: boolean; /** Rows from the top left as lawn; the rest stays a gravel walk. */ lawn?: (y: number) => boolean };

const hash = (...k: (string | number)[]) => {
  let h = 2166136261;
  for (const ch of k.join("|")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};

type Facts = Pick<WorldSetting, "culture" | "climate" | "architecture" | "settlement" | "year"> & {
  environment?: { ecology?: string };
  lon?: number;
};

const town = (s: Facts) => s.settlement === "city" || s.settlement === "port";
const african = (s: Facts) => s.culture === "west-central-african" || s.culture === "east-southern-african";

function fuel(s: Facts): string[] {
  const eco = s.environment?.ecology;
  if (s.culture === "south-asian" || ((eco === "desert" || eco === "grassland") && s.culture !== "european"))
    return ["lotDungStack", "lotDungCakes"];
  if (s.culture === "east-asian" || s.culture === "inner-eurasian") return ["lotStalkBundles", "lotStrawCone"];
  if (african(s)) return ["lotThornBundles", "lotStalkBundles"];
  if (s.year >= 1800 && town(s)) return ["lotLumber", "lotCordwoodTall"];
  return ["lotCordwood", "lotCordwoodTall", "lotFaggots"];
}

function drying(s: Facts): string[] {
  const japan = s.culture === "east-asian" && (s.lon ?? 0) > 129;
  if (town(s) && s.year >= 1700 && s.culture === "european") return ["lotLaundry"];
  if (s.culture === "european") return s.year < 1800 && town(s) ? ["lotTenterWoad", "lotTenterMadder"] : ["lotClothEurope"];
  if (japan) return s.year >= 1600 ? ["lotStretchers", "lotDaikon"] : ["lotDaikon"];
  if (s.culture === "mesoamerican") return s.year >= -1500 ? ["lotMaize", "lotClothMeso"] : ["lotGrain"];
  if (s.culture === "south-asian")
    return s.year >= 1550 ? ["lotChilies", "lotClothSouthAsia"] : ["lotGrain", "lotTurmeric", "lotClothSouthAsia"];
  if (s.culture === "west-central-african") return s.year >= 1600 ? ["lotMaize", "lotClothIndigo"] : ["lotGrain", "lotClothIndigo"];
  if (s.culture === "east-southern-african") return ["lotHide", "lotHideDark"];
  if (s.architecture === "mudbrick") return ["lotMudBricks", "lotGrain"];
  if (s.culture === "east-asian") return ["lotStrawCone", "lotGrain"];
  return ["lotGrain", "lotHide"];
}

/** The place's dead and its holy ground, by tradition and date. */
function sacred(s: Facts, key: string): { centre?: string; graves?: string[] } {
  const c = s.culture, y = s.year, lon = s.lon ?? 0;
  if (c === "european") {
    if (town(s) && y >= 1000 && hash(key, "jewish") < 0.2) return { graves: ["lotMatzevah"] };
    if (y < 600) return { centre: "lotAltar" };
    return { centre: y >= 1100 ? "lotCross" : undefined, graves: y >= 1650 ? ["lotHeadstone", "lotWoodenCross"] : ["lotWoodenCross"] };
  }
  if (c === "north-african-west-asian")
    return y >= 700 ? { graves: y >= 1450 && lon >= 20 ? ["lotTurbanStone", "lotMuslimGrave"] : ["lotMuslimGrave"] } : { centre: "lotAltar" };
  if (c === "east-asian") return { graves: lon > 129 && y >= 1200 ? ["lotGorinto"] : ["lotGraveMound"] };
  if (c === "south-asian") return { centre: "lotTreeShrine" };
  if (c === "southeast-asian") return { centre: y > -500 ? "lotSpiritHouse" : "lotShrineTree" };
  if (c === "west-central-african") return { graves: y >= 1100 && town(s) ? ["lotMuslimGrave"] : ["lotPotGrave"] };
  if (c === "andean") return y >= 1540 ? { graves: ["lotWoodenCross"] } : y >= 1000 ? { centre: "lotChullpa" } : { centre: "lotAltar" };
  if (c === "inner-eurasian") return { graves: ["lotCairn"] };
  if (c === "east-southern-african" || c === "australian-pacific") return { centre: "lotShrineTree" };
  if (c === "mesoamerican") return y >= 1540 ? { graves: ["lotWoodenCross"] } : { centre: "lotAltar" };
  return { centre: "lotAltar" };
}

/** What a kitchen garden keeps at its back corner. */
function gardenPiece(s: Facts): string {
  if (s.culture === "south-asian") return "lotTulsi";
  if (s.culture === "mesoamerican") return "lotCuezcomatl";
  if (s.climate === "tropical" || s.climate === "monsoon") return "lotBanana";
  if (s.climate === "arid" && s.culture === "north-african-west-asian") return "lotDatePalm";
  return s.culture === "european" ? "lotSkeps" : "lotWaterJar";
}

function weights(s: Facts): [LotUse, number][] {
  const t = town(s);
  // From the boulevard age a European city turned its leftover ground into
  // railed garden squares; kitchen plots, pens and threshing floors had gone
  // to the edge of town. A builder's yard and the odd gap stayed.
  if (t && s.year >= 1850 && s.culture === "european")
    return [["square", 4], ["fuel", 1.2], ["waste", 1], ["drying", 0.3], ["ruin", 0.4], ["sacred", 0.3]];
  return [
    ["garden", t ? 3 : 4],
    ["waste", t ? 2.5 : 1.5],
    ["fuel", 2],
    ["threshing", t ? 0.3 : 3],
    ["pen", t ? 0.7 : 2],
    ["drying", 2],
    ["sacred", 0.8],
    ["ruin", t ? 1.5 : 0.8],
  ];
}

/** What one open lot, w by h cells, becomes. `key` makes the choice stable
 * for that lot and different from its neighbour's. */
export function planLot(s: Facts, w: number, h: number, key: string): LotPlan {
  const table = weights(s).filter(([u]) => (u !== "threshing" && u !== "sacred") || (w >= 6 && h >= 5));
  let roll = hash(key, "use") * table.reduce((a, [, v]) => a + v, 0), use: LotUse = "waste";
  for (const [u, v] of table) if ((roll -= v) < 0) { use = u; break; }
  const items: LotItem[] = [];
  const pick = (list: string[], i: number) => list[Math.floor(hash(key, "pick", i) * list.length)];
  const back = 1, front = h - 2;
  if (use === "square") {
    const walk = (h >> 1) + 1;
    for (let x = 1; x < w - 1; x += 4) {
      items.push({ prop: "lotPlane", x, y: back });
      if (h >= 8) items.push({ prop: "lotPlane", x, y: front });
    }
    items.push({ prop: w >= 9 && h >= 7 ? "lotWorthy" : "lotUrn", x: w >> 1, y: walk - 1 });
    if (w >= 8) for (const x of [2, w - 3]) items.push({ prop: "lotSquareBench", x, y: walk - 1 });
    items.push({ prop: "lotPigeons", x: (w >> 1) + 2, y: walk });
    return { use, items, fenced: true, lawn: (y) => y !== walk };
  }
  if (use === "garden") {
    if (w >= 6) {
      items.push({ prop: gardenPiece(s), x: 1, y: back });
      if ((s.climate === "tropical" || s.climate === "monsoon") && w >= 9) items.push({ prop: "lotPergola", x: w - 3, y: back });
    }
    return { use, items, garden: true, fenced: true };
  }
  if (use === "fuel") {
    const kinds = fuel(s);
    const standing = kinds.filter((k) => k !== "lotDungCakes");
    for (let x = 1, i = 0; x < w - 1; x += 3, i++) items.push({ prop: standing[i % standing.length], x, y: back });
    if (h >= 6) {
      if (kinds[1] === "lotDungCakes") for (let x = 2; x < w - 2; x += 3) items.push({ prop: "lotDungCakes", x, y: back + 3 });
      else items.push({ prop: s.culture === "european" ? "lotChoppingBlock" : kinds[0], x: 2, y: front });
    }
    return { use, items, fenced: true };
  }
  if (use === "drying") {
    const kinds = drying(s);
    for (let y = back + 1, r = 0; y < h - 1; y += 3, r++)
      for (let x = 2; x < w - 1; x += 4) items.push({ prop: pick(kinds, r * 7 + x), x, y });
    return { use, items, fenced: true };
  }
  if (use === "threshing") {
    const cx = w >> 1, cy = Math.max(3, h >> 1);
    items.push({ prop: "lotThreshingFloor", x: cx, y: cy + 1 });
    items.push({ prop: s.culture === "european" ? "lotRick" : "lotStrawCone", x: w - 3, y: back });
    if (s.culture !== "south-asian" && !african(s)) items.push({ prop: "lotRoller", x: cx, y: cy - 1 });
    items.push({ prop: "lotStooks", x: 1, y: front });
    return { use, items };
  }
  if (use === "pen") {
    items.push({ prop: s.culture === "european" || s.culture === "east-asian" ? "lotStoneTrough" : "lotMudTrough", x: w >> 1, y: front - 1 });
    items.push({ prop: "lotStrawHeap", x: 2, y: back + 1 });
    items.push({ prop: "lotDungHeap", x: w - 3, y: back + 1 });
    return { use, items, fenced: true };
  }
  if (use === "sacred") {
    const sc = sacred(s, key);
    if (sc.centre) items.push({ prop: sc.centre, x: w >> 1, y: sc.graves ? back + 1 : h >> 1 });
    if (sc.graves)
      for (let y = back + (sc.centre ? 4 : 1), r = 0; y < h - 1; y += 3, r++)
        for (let x = 1 + (r % 2); x < w - 1; x += 3) items.push({ prop: pick(sc.graves, r * 11 + x), x, y });
    return { use, items, fenced: !!sc.graves };
  }
  if (use === "ruin") {
    const earth = s.architecture === "mudbrick" || s.culture === "inner-eurasian";
    const kinds = earth
      ? [s.culture === "inner-eurasian" || s.culture === "east-asian" ? "lotSlumpedRammed" : "lotSlumpedWall", "lotMudRubble"]
      : s.architecture === "timber" || s.culture === "east-asian"
        ? ["lotCharredPost", "lotCharredStump", "lotCharredBeam", "lotBurntRubble"]
        : (s.culture === "european" || s.culture === "north-african-west-asian") && s.year > -700 && s.year < 1700
          ? ["lotRubble", "lotColumnDrum", "lotRubble", "lotCharredBeam"]
          : ["lotRubble", "lotCharredPost", "lotCharredBeam"];
    const n = Math.max(2, Math.min(8, Math.floor((w * h) / 18)));
    for (let i = 0; i < n; i++)
      items.push({ prop: kinds[i % kinds.length], x: 1 + Math.floor(hash(key, "rx", i) * (w - 2)), y: 1 + Math.floor(hash(key, "ry", i) * (h - 2)) });
    return { use, items };
  }
  if (w * h >= 30 && hash(key, "dump") < 0.5)
    items.push({ prop: s.architecture === "mudbrick" ? "lotMudRubble" : "lotRubble", x: Math.floor(hash(key, "wx") * (w - 2)) + 1, y: h - 2 });
  return { use, items };
}
