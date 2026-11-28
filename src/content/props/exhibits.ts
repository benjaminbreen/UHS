import { campFinds, caveFinds } from "../caves";
import { catacombFinds } from "../catacombs";
import { fairs } from "../fairs";
import { mineFinds } from "../mines/finds";
import { prisonStyles } from "../prisons";
import { sewerFinds } from "../sewers";
import { tombStyles } from "../tombs";
import type { PropDef } from "./catalog";

type FindLike = {
  id: string;
  name: string;
  verb: string;
  look: string;
  text: string;
  time?: number;
  price?: number;
  heal?: number;
  fuel?: number;
  keeps?: boolean;
  tier?: string;
  loot?: Readonly<Record<string, number | readonly [number, number] | undefined>>;
  on?: "floor" | "wall" | "table";
  flat?: boolean;
  wall?: boolean;
  solid?: boolean;
};

const staticLoot = (loot: FindLike["loot"]) =>
  loot && Object.fromEntries(Object.entries(loot).flatMap(([k, n]) => (n === undefined ? [] : [[k, typeof n === "number" ? n : n[0]]])));

const findDef = (f: FindLike, family: string, opts: { solid: boolean; underfoot: boolean; vanishes?: boolean }): PropDef => {
  const clears = !f.keeps && !f.price;
  const once = clears || (!f.price && !f.heal && !!(f.loot || f.fuel));
  return {
    name: f.name,
    family,
    ...(opts.solid ? { solid: true } : {}),
    ...(opts.underfoot ? { underfoot: true } : {}),
    act: {
      verb: f.verb,
      text: f.text,
      seconds: f.time ?? 30,
      price: f.price,
      heal: f.heal,
      fuel: f.fuel,
      once,
      ...(clears ? { clears: true } : {}),
      ...(clears && opts.vanishes ? { vanishes: true } : {}),
      told: f.tier === "prize" || f.tier === "notable" ? "world" : "action",
      gives: staticLoot(f.loot),
    },
  };
};

const tombFinds = tombStyles.flatMap((s) => s.finds);
const allCaveFinds = [...caveFinds, ...campFinds];
const prisonFinds = prisonStyles[0].finds.filter((f) => !f.special);

/** What a complex shows or holds, as props: each find is a thing with an act of its own,
 * so the same engine prop code handles fairs, palaces, tombs, caves, sewers, mines, catacombs and prisons. */
export const exhibitProps: Record<string, PropDef> = {
  ...Object.fromEntries(fairs.flatMap((fair) => fair.finds).map((f) => [`exhibit-${f.id}`, {
    name: f.name,
    family: "exhibit",
    act: {
      verb: f.verb, text: f.text, minutes: Math.max(1, Math.round((f.time ?? 60) / 60)), price: f.price, heal: f.heal, once: !f.keeps && !f.price, told: f.tier === "common" ? "action" : "world",
      gives: staticLoot(f.loot),
    },
  } satisfies PropDef])),
  ...Object.fromEntries(tombFinds.map((f) => [`tomb-${f.id}`, findDef(f, "tomb", { solid: f.on === "floor" && !f.flat, underfoot: f.on === "wall" || !!f.flat, vanishes: true })])),
  ...Object.fromEntries(allCaveFinds.map((f) => [`cave-${f.id}`, findDef(f, "cave", { solid: f.on === "floor" && !f.flat, underfoot: f.on === "wall" || !!f.flat })])),
  ...Object.fromEntries(sewerFinds.map((f) => [`sewer-${f.id}`, findDef(f, "sewer", { solid: f.on === "floor" && !f.flat, underfoot: f.on === "wall" || !!f.flat })])),
  ...Object.fromEntries(mineFinds.map((f) => [`mine-${f.id}`, findDef(f, "mine", { solid: f.on === "floor" && !f.flat, underfoot: f.on === "wall" || !!f.flat })])),
  ...Object.fromEntries(catacombFinds.map((f) => [`catacomb-${f.id}`, findDef(f, "catacomb", { solid: f.on === "floor" && !f.flat, underfoot: f.on === "wall" || !!f.flat })])),
  ...Object.fromEntries(prisonFinds.map((f) => [`prison-${f.id}`, findDef(f, "prison", { solid: !!f.solid, underfoot: !f.solid, vanishes: true })])),
};

/** Each complex find is described by what a visitor sees of it. */
export const exhibitAbout: Record<string, string> = {
  ...Object.fromEntries(fairs.flatMap((fair) => fair.finds).map((f) => [`exhibit-${f.id}`, f.look])),
  ...Object.fromEntries(tombFinds.map((f) => [`tomb-${f.id}`, f.look])),
  ...Object.fromEntries(allCaveFinds.map((f) => [`cave-${f.id}`, f.look])),
  ...Object.fromEntries(sewerFinds.map((f) => [`sewer-${f.id}`, f.look])),
  ...Object.fromEntries(mineFinds.map((f) => [`mine-${f.id}`, f.look])),
  ...Object.fromEntries(catacombFinds.map((f) => [`catacomb-${f.id}`, f.look])),
  ...Object.fromEntries(prisonFinds.map((f) => [`prison-${f.id}`, f.look])),
};
