import { shiftHue, type Finish, type RoomParams, type Shape, type Trade } from "../../render/interiors/room";
import type { InteriorProfile } from "./types";

export type RoomChoice = {
  seed: number;
  /** Index into the profile's rooms, if it has several. */
  room?: number;
  status: Finish;
  /** Index into the profile's colorways; -1 picks one from the seed. */
  colorway: number;
  w: number;
  d: number;
  shape?: Shape;
  trade?: Trade;
  hour: number;
};

/** A profile plus a household's choices become the generic room the renderers draw. */
export function resolveRoom(base: InteriorProfile, c: RoomChoice): RoomParams {
  const t = base.rooms?.[c.room ?? 0];
  const pr: InteriorProfile = t
    ? {
        ...base, ...t,
        styles: { ...base.styles, ...t.styles },
        kits: { ...base.kits, ...t.kits },
        looks: base.looks.map((l, i) => ({ ...l, ...t.looks?.[i] })) as InteriorProfile["looks"],
        shapes: t.shapes ?? base.shapes,
        furnish: t.furnish ?? base.furnish,
        trades: t.trades ?? base.trades,
        clutter: t.clutter ?? base.clutter,
      }
    : base;
  const look = pr.looks[c.status];
  const trade = c.trade && pr.trades.includes(c.trade) ? c.trade : pr.trades[0];
  const ways = pr.colorways;
  const way = ways[c.colorway >= 0 ? c.colorway % ways.length : c.seed % ways.length];
  // Humble rooms lose a little saturation and light; elite ones gain it in the accent.
  const dim = [-0.05, 0, 0.03][c.status];
  const tone = (hex: string) => shiftHue(hex, 0, dim);
  // A colourway's floor is for laid floors; beaten earth, sand and rushes stay earth-coloured.
  const natural = look.floor === "earth" || look.floor === "sand" || look.floor === "rushes";
  const floor = natural ? blend(way.floor, look.floor === "sand" ? "#c8ac80" : "#7e6446", 0.75) : way.floor;
  return {
    seed: c.seed,
    w: c.w,
    d: c.d,
    shape: c.shape ?? pr.shapes[0],
    finish: c.status,
    wall: tone(way.wall),
    trim: tone(way.trim),
    floor: tone(floor),
    wood: tone(way.wood),
    accent: c.status === 2 ? shiftHue(way.accent, 0, 0.02) : tone(way.accent),
    wallPattern: look.wall,
    floorPattern: look.floor,
    dado: look.dado,
    door: pr.door,
    windows: look.windows ?? (pr.windowStyle === "none" ? 0 : 1 + c.status),
    windowStyle: pr.windowStyle,
    fire: pr.fire,
    smokehole: pr.smokehole,
    seating: pr.seating,
    sleep: pr.sleep,
    pole: !!pr.pole,
    furnish: [...(look.furnish ?? []), ...pr.furnish],
    trade,
    styles: pr.styles ?? {},
    kit: pr.kits?.[trade],
    clutter: pr.clutter ?? [],
    hour: c.hour,
    wear: look.wear,
    soot: look.soot,
  };
}

function blend(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return "#" + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0");
}
