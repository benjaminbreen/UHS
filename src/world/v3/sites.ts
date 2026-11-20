import type { Point } from "../../core/types";
import type { Rect } from "./types";

/** A business that stands on its own paved lot once its customers drive. */
export type SiteKind = "gas" | "market" | "drive-in" | "motel" | "garage";

export function siteKindOf(business: string): SiteKind | undefined {
  if (/gas station/.test(business)) return "gas";
  if (/grocery|market/.test(business)) return "market";
  if (/drive-in|diner/.test(business)) return "drive-in";
  if (/motel/.test(business)) return "motel";
  if (/workshop|tire/.test(business)) return "garage";
  return undefined;
}

/** Cells of apron beside the building and in front of it, and what it is laid in. */
export const SITES: Record<SiteKind, { side: number; depth: number; surface: "concrete" | "asphalt" }> = {
  gas: { side: 3, depth: 8, surface: "concrete" },
  market: { side: 2, depth: 6, surface: "asphalt" },
  "drive-in": { side: 3, depth: 6, surface: "asphalt" },
  motel: { side: 1, depth: 6, surface: "asphalt" },
  garage: { side: 2, depth: 4, surface: "concrete" },
};

type Piece = { sprite: string; name: string; x: number; y: number; prop?: string };
const at = (family: string, v: number) => `study-propb-${family}-${v}`;

/** What stands on a lot: marked bays nose-in to the building, the cars in
 * them, and the kind's own furniture. The door's column is kept clear. */
export function siteLayout(kind: SiteKind, site: Rect, house: Rect, door: Point, year: number, roll: (key: string) => number) {
  const top = house.y + house.h, bottom = site.y + site.h - 1, left = site.x, right = site.x + site.w - 1;
  const bays: Rect[] = [], cars: (Point & { heading: "n" | "e" })[] = [], props: Piece[] = [];
  const row = () => {
    for (let x = left + (site.w % 2); x + 1 <= right; x += 2) {
      if (door.x >= x && door.x <= x + 1) continue;
      // A walk's width between the shop front and the cars' noses.
      bays.push({ x, y: top + 2, w: 2, h: 3 });
      if (roll(`car-${x}`) < 0.55) cars.push({ x, y: top + 4, heading: "n" });
    }
    if (!cars.length && bays.length) cars.push({ x: bays[0].x, y: top + 4, heading: "n" });
  };
  const clearOfDoor = (x: number) => Math.abs(x - door.x) >= 2;
  if (kind === "gas") {
    const livery = year < 1948 ? 0 : year < 1972 ? 1 : 2 + Math.floor(roll("livery") * 2);
    const cx = left + (site.w >> 1);
    // Clear of the shop front: the canopy stands four cells tall.
    props.push({ sprite: at("pump-island", livery), name: "Petrol pumps", x: cx, y: top + 5 });
    props.push({ sprite: at("price-sign", livery), name: "Station sign", x: left, y: bottom });
    if (roll("pump-car") < 0.6) cars.push({ x: cx - 1, y: top + 7, heading: "e" });
    props.push({ sprite: at("tyre-stack", 1), name: "Stacked tyres", x: house.x + house.w, y: top - 1 });
    if (clearOfDoor(house.x)) props.push({ sprite: at("ice-chest", 0), name: "Ice chest", x: house.x, y: top, prop: "iceChest" });
  } else if (kind === "garage") {
    props.push({ sprite: at("tyre-stack", 0), name: "Stacked tyres", x: house.x + house.w, y: top });
    props.push({ sprite: at("steel-drum", Math.floor(roll("drum") * 3)), name: "Oil drum", x: house.x - 1, y: top });
    if (roll("job") < 0.6) cars.push({ x: clearOfDoor(house.x + 1) ? house.x + 1 : house.x + house.w - 3, y: top + 3, heading: "n" });
  } else {
    row();
    const sign = kind === "motel" ? 0 : kind === "market" ? 2 : roll("sign") < 0.5 ? 3 : 1;
    props.push({ sprite: at("pole-sign", sign), name: "Sign", x: left, y: bottom });
    if (kind === "market") {
      props.push({ sprite: at("trolley-bay", roll("trolleys") < 0.6 ? 0 : 1), name: "Trolley bay", x: right - 1, y: bottom });
      if (clearOfDoor(house.x + 1)) props.push({ sprite: at("produce-stand", Math.floor(roll("produce") * 2)), name: "Produce stand", x: house.x + 1, y: top });
      if (clearOfDoor(house.x + house.w - 2)) props.push({ sprite: at("ice-chest", 1), name: "Drinks cooler", x: house.x + house.w - 2, y: top, prop: "iceChest" });
    }
    if (kind === "drive-in") props.push({ sprite: at("menu-board", Math.floor(roll("menu") * 2)), name: "Menu board", x: right, y: top + 1 });
  }
  return { bays, cars, props };
}
