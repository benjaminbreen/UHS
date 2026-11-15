import { faunaAt } from "../fauna";
import type { WorldSetting } from "../geography/types";
import { deepTimeFinds } from "./deep-time";
import { naturalFinds } from "./natural";
import { americasFinds, modernFinds } from "./new-world-modern";
import { oldWorldFinds } from "./old-world";
import type { Box, CaveFind, CaveKind, CaveLight } from "./types";

export type { CaveFind, CaveKind, CaveLight } from "./types";
export { caveItems } from "./items";

export const caveFinds: CaveFind[] = [...naturalFinds, ...deepTimeFinds, ...oldWorldFinds, ...americasFinds, ...modernFinds];
const byId = new Map(caveFinds.map((f) => [f.id, f]));
export const caveFind = (id: string) => byId.get(id);

export type CavePlace = Pick<WorldSetting, "lon" | "lat" | "year">;

const inBox = ([w, s, e, n]: Box, lon: number, lat: number) => lon >= w && lon <= e && lat >= s && lat <= n;

/** Whether a find belongs in this cave, at this place and date, on this level. */
export function findFits(f: CaveFind, place: CavePlace, kind: CaveKind, depth: number) {
  return (
    (!f.years || (place.year >= f.years[0] && place.year <= f.years[1])) &&
    (!f.where || f.where.some((b) => inBox(b, place.lon, place.lat))) &&
    (!f.kinds || f.kinds.includes(kind)) &&
    (!f.depth || (depth >= f.depth[0] && depth <= f.depth[1]))
  );
}

/** What someone going underground carries, by date. Reach and burn time are
 * tuned for play (the clock runs about fifteen game seconds to one real
 * one, so a torch is five minutes); the order of invention is documented. */
const lights: CaveLight[] = [
  { id: "torch", name: "Pine torch", years: [-1000000, -3001], burns: 4500, reach: 6.5, flame: true, color: "#ffb060",
    lit: "You light a torch of resinous wood at the mouth.", out: "Your torch burns down to your fingers and goes out." },
  { id: "oil-lamp", name: "Oil lamp", years: [-3000, 1299], burns: 5400, reach: 6, flame: true, color: "#ffc070",
    lit: "You light your lamp and shield it with a hand.", out: "The lamp drinks the last of its oil and goes out." },
  { id: "lantern", name: "Candle lantern", years: [1300, 1859], burns: 6000, reach: 6.5, flame: true, color: "#ffc878",
    lit: "You light the candle in your lantern and shut the horn door.", out: "The candle gutters into its own wax and goes out." },
  { id: "kerosene", name: "Kerosene lantern", years: [1860, 1899], burns: 8000, reach: 7.5, flame: true, color: "#ffd088",
    lit: "You trim the wick and light the lantern.", out: "The lantern burns dry and goes out." },
  { id: "carbide", name: "Carbide lamp", years: [1900, 1949], burns: 9000, reach: 8.5, flame: true, color: "#fff0c0",
    lit: "You drip water on the carbide and strike the flint. The lamp hisses white.", out: "The carbide is spent. The flame shrinks to a blue bead and dies." },
  { id: "flashlight", name: "Electric torch", years: [1950, 1999], burns: 10000, reach: 9.5, flame: false, color: "#fff6dc",
    lit: "You switch on your torch.", out: "The beam goes yellow, then orange, then out. The batteries are dead." },
  { id: "headlamp", name: "Headlamp", years: [2000, 10000], burns: 14000, reach: 10.5, flame: false, color: "#eef6ff",
    lit: "You switch on your headlamp.", out: "Your headlamp blinks its low-battery warning and goes dark." },
  { id: "clay-candle", name: "Candle in clay", years: [1300, 1899], burns: 5000, reach: 6, flame: true, mine: true, color: "#ffc070",
    lit: "You press a candle into a lump of clay on your hat brim and light it.", out: "The candle burns down into its clay and goes out." },
  // Davy's gauze kept the flame from the gas, at the price of a dim light.
  { id: "safety-lamp", name: "Safety lamp", years: [1816, 1929], burns: 7000, reach: 5, flame: true, safe: true, mine: true, color: "#ffd890",
    lit: "You check the gauze is whole, lock the lamp and light it.", out: "The oil is spent. The flame shrinks inside its gauze and dies." },
  { id: "cap-lamp", name: "Cap lamp", years: [1930, 10000], burns: 16000, reach: 9.5, flame: false, mine: true, color: "#fff4d8",
    lit: "You clip the battery to your belt and switch on the lamp on your helmet.", out: "The cap lamp's battery is flat. The beam fades to nothing." },
];
export const caveLightFor = (year: number) => lights.find((l) => !l.mine && year >= l.years[0] && year <= l.years[1]) ?? lights[0];
/** What a miner carries down: a safety lamp in a gassy coal pit once there was one. */
export function mineLightFor(year: number, coal: boolean) {
  const id = year >= 1930 ? "cap-lamp" : coal && year >= 1816 ? "safety-lamp" : year >= 1900 ? "carbide" : year >= 1300 ? "clay-candle" : undefined;
  return id ? caveLight(id) : caveLightFor(year);
}
export const caveLight = (id: string) => lights.find((l) => l.id === id) ?? lights[0];

/** Animals that den underground, likeliest first. */
const DENNERS: [string, number][] = [
  ["cave-bear", 5], ["brown-bear", 3], ["short-faced-bear", 2], ["cave-lion", 2], ["leopard", 2.5], ["jaguar", 2],
  ["smilodon", 1.5], ["american-lion", 1.5], ["gray-wolf", 2], ["polar-bear", 2], ["tiger", 1], ["lion", 1],
  ["golden-jackal", 1], ["coyote", 1], ["red-fox", 0.8],
];
export function caveDenners(setting: WorldSetting): [string, number][] {
  const here = new Set(faunaAt(setting).map((p) => p.id));
  return DENNERS.filter(([id]) => here.has(id));
}
/** Vipers and cobras keep to the warm, dry ground between about these latitudes. */
export const caveSnakes = (place: CavePlace, kind: CaveKind) => kind !== "ice" && kind !== "sea" && Math.abs(place.lat) < 42;
