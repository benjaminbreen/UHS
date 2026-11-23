import type { Kit } from "../content/arms/kits";
import type { Arm } from "../content/arms/weapons";
import { generateCharacter } from "../content/characters/generate";
import { places } from "../content/geography/places";
import { settingFor } from "../content/geography/resolve";
import type { CharacterAppearance } from "../core/character";
import { drawCharacterG } from "../render/characters/doll/draw";
import type { CharacterPose } from "../render/characters/poses";
import { iconCarriedArt, type CarriedArt } from "../render/characters/props";
import { drawGarmentIcon, GARMENT_ICON, garmentIconFor, itemIconFor } from "../render/garment-icons";
import horseAtlas from "../render/generated/fauna-c-atlas.json" with { type: "json" };

/** Weapons the item icons do not cover, drawn point-up with the grip about
 * three quarters of the way down, which is how the doll's hand takes them. */
const INK: Record<string, string> = {
  S: "#dfe4e8", s: "#8e969e", W: "#9c6c3e", w: "#6b4628", G: "#c9a24a", O: "#2b2a33",
  J: "#5f9c7a", R: "#a8362c", L: "#5a3d2a", B: "#e6dccb",
};
const blade = (n: number, ...hilt: string[]) => [".S.", ...Array<string>(n).fill(".Ss"), ...hilt];
const ART: Record<string, string[]> = {
  dagger: blade(4, "GGG", ".L.", ".L."),
  kris: [".S.", ".Ss", "sS.", ".Ss", "sS.", ".Ss", "GGG", ".W.", ".W."],
  gladius: blade(6, "GGG", ".W.", ".W.", ".G."),
  sword: blade(9, "GGG", ".L.", ".L.", ".G."),
  rapier: [".S.", ...Array<string>(12).fill(".S."), "GGG", "GLG", ".L."],
  longsword: blade(13, "sSs", "GGG", ".L.", ".L.", ".L.", ".G."),
  zweihander: blade(16, "sSs", "GGG", ".L.", ".L.", ".L.", ".L.", ".G."),
  katana: [".S.", ".S.", ..."x".repeat(9).split("").map(() => "sS."), "GGG", ".O.", ".B.", ".O.", ".B.", ".O."],
  sabre: ["..S", "..S", ".Ss", ".Ss", ".Ss", "sS.", "sS.", "sS.", "sS.", "GGG", "GL.", ".L."],
  khopesh: [".SS.", "S..S", "...S", "...S", "..S.", ".Ss.", ".Ss.", ".Ss.", ".GG.", ".W.", ".W."],
  mace: ["sSs", "SSS", "sSs", ".w.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".L."],
  "star-mace": ["S.S", ".S.", "SSS", ".S.", "S.S", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W."],
  mere: [".J.", "JJJ", "JJJ", "JJJ", "JJJ", ".J.", ".J.", ".B."],
  axe: ["SS.", "SSW", "sSW", "..W", "..W", "..W", "..W", "..W", "..W", "..L"],
  "dane-axe": ["SS..", "SSS.", "SSSW", "sSSW", ".s.W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W", "...W"],
  iklwa: [".S.", "SSs", "SSs", "SSs", ".S.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W."],
  taiaha: [".W.", "WWW", "WWW", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".W.", ".R.", "RBR", ".B.", ".B."],
  grenade: [".s.", "OOO", "OsO", "OOO"],
  pike: [".S.", ".S.", ".s.", ...Array<string>(24).fill(".W.")],
  lance: [".S.", ".S.", ".R.", ...Array<string>(19).fill(".W."), "WWW", ".W.", ".W.", ".W."],
};

const arts = new Map<string, CarriedArt | undefined>();
export function armArt(arm: Arm): CarriedArt | undefined {
  const id = arm.art;
  if (!id) return undefined;
  if (arts.has(id)) return arts.get(id);
  let art: CarriedArt | undefined;
  if (id.startsWith("icon:")) {
    const item = id.slice(5), icon = garmentIconFor(item) ?? itemIconFor(item);
    art = icon ? iconCarriedArt(id, (ctx) => drawGarmentIcon(ctx, icon, 0, 0), GARMENT_ICON) : undefined;
  } else {
    const rows = ART[id.slice(5)], w = Math.max(...rows.map((r) => r.length));
    const image = document.createElement("canvas");
    image.width = w;
    image.height = rows.length;
    const ctx = image.getContext("2d", { willReadFrequently: true })!;
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      if (!INK[c]) return;
      ctx.fillStyle = INK[c];
      ctx.fillRect(x, y, 1, 1);
    }));
    art = { sprite: id, kind: "stick", image, width: w, height: rows.length };
  }
  arts.set(id, art);
  return art;
}

const looks = new Map<string, CharacterAppearance>();
/** A fighter of a kit, dressed by the game's own wardrobe for that place and
 * year. A few faces per kit, so a unit is not one man repeated. */
export function dress(kit: Kit, n: number): { key: string; look: CharacterAppearance } {
  const key = `${kit.id}:${n % 4}`;
  let look = looks.get(key);
  if (!look) {
    const place = places.find((p) => p.id === kit.place) ?? places[0];
    const made = generateCharacter(settingFor(place, kit.year), "arena", key, 24 + ((n * 7) % 14), kit.role, undefined, undefined, "male");
    look = { ...made.appearance, wearing: { ...made.appearance.wearing, sidearm: "none", ...kit.wear } };
    looks.set(key, look);
  }
  return { key, look };
}

const frames = new Map<string, HTMLCanvasElement>();
/** One drawn frame of a fighter, kept: the doll is too slow to draw fresh for
 * eighty people sixty times a second. */
export function figure(key: string, look: CharacterAppearance, facing: number, pose: CharacterPose, frame: number, art?: CarriedArt) {
  const id = `${key}|${facing}|${pose}|${frame}|${art?.sprite ?? ""}`;
  let c = frames.get(id);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 80;
    drawCharacterG(c.getContext("2d", { willReadFrequently: true })!, look, Math.round(facing / 2) % 4, pose, frame, art, facing);
    if (frames.size > 6000) frames.clear();
    frames.set(id, c);
  }
  return c;
}

const FACINGS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
let sheet: HTMLImageElement | undefined;
/** The horse sheet, once it has loaded. */
export function horses() {
  if (!sheet) {
    sheet = new Image();
    sheet.src = "/fauna-c/atlas.png";
  }
  return sheet.complete && sheet.naturalWidth ? sheet : undefined;
}
export function horseFrame(state: "idle" | "trot" | "flee" | "rear", facing: number, n: number) {
  return (horseAtlas.frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>)[`faunac-horse-${state}-${FACINGS[facing]}-${n & 7}`]?.frame;
}
/** Screen angle to the doll's eight facings: north 0, then clockwise. */
export const facingOf = (angle: number) => (Math.round(angle / (Math.PI / 4)) + 2 + 16) % 8;
