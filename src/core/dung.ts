import type { Position, WorldObject } from "./types";
import {
  DUNG_DRY_HOURS,
  DUNG_FRESH_HOURS,
  dungItem,
  dungItems,
  type DungKind,
} from "../content/fauna/dung";

/** Most dung a map keeps before the oldest is taken for granted as gathered. */
export const DUNG_CAP = 80;
export const DROPPINGS_CAP = 60;

const ageOf = (o: WorldObject, clock: number) =>
  (clock - (o.laid ?? clock)) / 3600;

export function dungObject(
  kind: DungKind,
  pos: Position,
  laid: number,
  id: string,
  from: string,
  variant = 0,
): WorldObject {
  const o: WorldObject =
    kind === "droppings"
      ? {
          id,
          name: "Droppings",
          description: "Fowl droppings, the white cap and all.",
          kind: "monument",
          sprite: variant ? "nature-dung-droppings-2" : "nature-dung-droppings",
          pos,
          inventory: {},
        }
      : {
          id,
          name: "",
          kind: "item",
          sprite: "",
          pos,
          inventory: {},
        };
  o.dung = kind;
  o.from = from;
  o.laid = laid;
  return ageDung(o, laid), o;
}

/** A pat crusts in a day and is dry through in three; a pile pales as it
 * dries; pellets and droppings look the same until they are gone. */
export function ageDung(o: WorldObject, clock: number) {
  const kind = o.dung;
  if (!kind || kind === "droppings") return;
  const age = ageOf(o, clock);
  const dry = age >= DUNG_DRY_HOURS;
  const item = dungItem[kind][dry ? 1 : 0];
  o.item = item;
  o.name = dungItems[item].name;
  o.sprite =
    kind === "pat"
      ? o.trodden && !dry
        ? "nature-dung-pat-trodden"
        : dry
          ? "nature-dung-pat-dry"
          : age >= DUNG_FRESH_HOURS
            ? "nature-dung-pat-crusted"
            : "nature-dung-pat"
      : dungItems[item].sprite;
}

/** Fresh enough to draw flies. */
export const freshDung = (o: WorldObject, clock: number) =>
  !!o.dung && !o.carriedBy && ageOf(o, clock) < DUNG_FRESH_HOURS;

/** Past the cap, the oldest go first. Returns the objects to keep. */
export function capDung(objects: WorldObject[]) {
  const over = (droppings: boolean, cap: number) => {
    const lying = objects.filter(
      (o) => o.dung && !o.carriedBy && (o.dung === "droppings") === droppings,
    );
    return lying.length > cap
      ? lying.sort((a, b) => (a.laid ?? 0) - (b.laid ?? 0)).slice(0, lying.length - cap)
      : [];
  };
  const gone = new Set([...over(false, DUNG_CAP), ...over(true, DROPPINGS_CAP)]);
  return gone.size ? objects.filter((o) => !gone.has(o)) : objects;
}
