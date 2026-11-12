import Phaser from "phaser";
import type { SmallLifeContext } from "./small-creatures";

type Image = Phaser.GameObjects.Image;
type Species =
  | "japanese" | "barbary" | "rhesus" | "langur" | "vervet" | "colobus" | "capuchin" | "howler"
  | "olive-baboon" | "hamadryas" | "gelada" | "lar-gibbon" | "ring-tailed" | "sifaka";
type Family = "macaque" | "baboon" | "gibbon" | "lemur";
export type MonkeyContext = SmallLifeContext & { lat: number; lon: number; night: boolean; dawn: boolean };

// Each body faces east; the palette makes the species. f fur, F pale fur,
// c face, C cap or brow, h hands and feet, t and T tail, m mane, r rump,
// n nose, Y fruit. A frame a body lacks borrows the one its `stand` names.
type Body = { w: number; h: number; art: Record<string, string[]>; stand: Record<string, string> };
const MACAQUE: Body = {
  w: 12,
  h: 12,
  stand: {},
  art: {
    sit: ["............", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fcc...", ".....fFFf...", "....ffFFfh..", "....ffFFfh..", "...ffffff...", "..t.hh.hh...", ".tt........."],
    look: ["............", ".....fff....", "....fCCCf...", "....fcckf...", "....fcccc...", ".....fcc....", ".....fFFf...", "....ffFFfh..", "....ffFFfh..", "...ffffff...", "..t.hh.hh...", ".tt........."],
    eat: ["............", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fccccY.", "......fcchY.", ".....fFFfh..", "....ffFFf...", "....ffFFf...", "...ffffff...", "..t.hh.hh...", ".tt........."],
    chew: ["............", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fcc...", ".....fFFfY..", "....ffFFfhY.", "....ffFFf...", "...ffffff...", "..t.hh.hh...", ".tt........."],
    scratch: ["............", "....h.fff...", "....hfCCCf..", "....ffckcc..", "....ffcccc..", "....f.fcc...", ".....fFFf...", "....ffFFfh..", "....ffFFfh..", "...ffffff...", "..t.hh.hh...", ".tt........."],
    groom: ["............", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fcc...", ".....fFFfhh.", "....ffFFf.hh", "....ffFFf...", "...ffffff...", "..t.hh.hh...", ".tt........."],
    groom2: ["............", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fcc.hh", ".....fFFfh..", "....ffFFf...", "....ffFFf...", "...ffffff...", "..t.hh.hh...", ".tt........."],
    sleep: ["............", "............", "............", "......fff...", ".....fCCCf..", "....ffcccc..", "...fffFccc..", "...ffFFFf...", "..fffffff...", "..ffffffff..", ".t.hh..hh...", "tt.........."],
    call: ["......fff...", ".....fCCCf..", ".....fckcc..", ".....fcckw..", ".....fcccc..", "......ff....", ".....fFFfh..", ".....fFFf.h.", ".....ffff...", ".....f..f...", "..tt.f..f...", "tt..hh..hh.."],
    walk0: ["............", "............", "..tt........", ".t..........", ".t......fff.", "..t....fCCCf", "...ffffffckc", "...fFFFFfccc", "...ffffff.c.", "...f.f..f.f.", "..h..h.h..h.", "............"],
    walk1: ["............", "............", "..tt........", ".t..........", ".t......fff.", "..t....fCCCf", "...ffffffckc", "...fFFFFfccc", "...ffffff.c.", "....ff..ff..", "....hh..hh..", "............"],
    leap: ["............", "............", "...........h", "........fffh", "tt.....fCCCf", "..t.ffffffkc", "...ffFFFFccc", "..hh.....f..", ".h..........", "............", "............", "............"],
    crouch: ["............", "............", "............", "............", "......fff...", ".....fCCCf..", ".....fckcc..", "....ffcccc..", "...ffFFFf...", "..fffFFFfh..", ".t.hh.hh.h..", "tt.........."],
    hang: [".......h....", ".......f....", ".......f....", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fFf...", ".....ffFff..", ".....ffFff..", ".....h.t.h..", ".......t...."],
    tuck: [".......h....", ".......f....", ".......f....", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fFf...", ".....ffFff..", ".....fffff..", "....h..t..h.", ".......tt..."],
    // Arm over arm along a branch.
    brach: ["....h...h...", "....f...f...", ".....f.f....", "......fff...", ".....fCCCf..", ".....fckcc..", ".....fcccc..", "......fFf...", ".....ffFff..", ".....ffFff..", "....h..t.h..", "........t..."],
    // Seen from behind, on the trunk.
    climb0: ["...h....h...", "...f.ff.f...", "...cffffc...", "....ffff....", "...ffffff...", "...ffffff...", "...ffffff...", "....ffff....", "...ff..ff...", "...f....f...", "..h..tt..h..", "......t....."],
    climb1: ["............", "..h..ff..h..", "..fcffffcf..", "...ffffff...", "...ffffff...", "...ffffff...", "...ffffff...", "..hffffffh..", "...f....f...", "......t.....", ".....t......", "............"],
    roll: ["............", "............", "............", "....fffh....", "...ffFFff...", "..hfFFFFft..", "..fFccFFft..", "..ffckFff...", "...ffffff...", "....hfff....", "............", "............"],
  },
};
const BABOON: Body = {
  w: 18,
  h: 14,
  stand: { look: "sit", chew: "eat", scratch: "sit", groom2: "groom", call: "yawn", leap: "walk0", crouch: "walk1", hang: "climb0", tuck: "climb0", brach: "climb0", climb1: "climb0", roll: "walk1" },
  art: {
    sit: ["..................", "..........mmm.....", ".........mmffm....", ".........mfkcccn..", ".........mfcccc...", "........mmmff.....", ".......mmmFFf.....", "......ffffFFfh....", "......ffffFFfh....", ".....fffffffff....", "....rffffffff.....", "...t.hh..hhh......", "..t...............", "..tt.............."],
    eat: ["..................", "..........mmm.....", ".........mmffm....", ".........mfkcccn..", ".........mfccccY..", "........mmmffhY...", ".......mmmFFfh....", "......ffffFFf.....", "......ffffFFf.....", ".....fffffffff....", "....rffffffff.....", "...t.hh..hhh......", "..t...............", "..tt.............."],
    groom: ["..................", "..........mmm.....", ".........mmffm....", ".........mfkcccn..", ".........mfcccc...", "........mmmff.....", ".......mmmFFf.....", "......ffffFFfhh...", "......ffffFFf.hh..", ".....fffffffff....", "....rffffffff.....", "...t.hh..hhh......", "..t...............", "..tt.............."],
    // The threat: head up, mouth wide on the canines.
    yawn: ["..........mmm.....", ".........mmffccn..", ".........mfkc.....", ".........mfcw.w...", ".........mfccccc..", "........mmmff.....", ".......mmmFFf.....", "......ffffFFfh....", "......ffffFFfh....", ".....fffffffff....", "....rffffffff.....", "...t.hh..hhh......", "..t...............", "..tt.............."],
    sleep: ["..................", "..................", "..................", "..........mmm.....", ".........mmffm....", "........mmfccccn..", ".......mmmfcccc...", "......fffffFFf....", "......ffffFFFf....", ".....fffffffff....", "....rffffffff.....", "...t.hh..hhh......", "..t...............", "..tt.............."],
    walk0: ["..................", "..................", "..................", "...tt.............", "..t..t.......mmm..", "..t...ffffmmmffm..", "...rfffffffmmfkccn", "...ffffffffmmfccc.", "...ffffffFFfmf....", "....ff....ff......", "....f.f...f.f.....", "...h..h..h...h....", "..................", ".................."],
    walk1: ["..................", "..................", "..................", "...tt.............", "..t..t.......mmm..", "..t...ffffmmmffm..", "...rfffffffmmfkccn", "...ffffffffmmfccc.", "...ffffffFFfmf....", ".....ff...ff......", ".....ff...ff......", ".....hh...hh......", "..................", ".................."],
    climb0: ["....h.......h.....", "....f..mmm..f.....", "....fmmmmmmmf.....", ".....mmmmmmm......", ".....mffffffm.....", ".....ffffffff.....", ".....ffffffff.....", ".....ffffffff.....", "......rffffr......", ".....ff....ff.....", "....hf......fh....", "........t.........", ".......t..........", ".................."],
  },
};
const GIBBON: Body = {
  w: 14,
  h: 16,
  stand: { look: "sit", eat: "sit", chew: "sit", scratch: "sit", groom: "sit", groom2: "sit", sleep: "sit~", crouch: "sit", tuck: "hang", roll: "sit", leap: "brach", climb0: "brach", climb1: "hang" },
  art: {
    sit: ["..............", "..............", "..............", "..............", "..............", "......fff.....", ".....FfffF....", ".....FkckF....", ".....FcccF....", "......FFF.....", ".....fffff....", "....ffffffh...", "....ff.fffh...", "....ffffff....", "....f.ffff....", "...hh..hh....."],
    // Singing: head back, lips pursed.
    call: ["..............", "..............", "..............", "..............", "......fff.....", ".....FfffF....", ".....FkckF....", ".....FcwcF....", "......FFF.....", ".....fffff....", "....ffffffh...", "....ff.fffh...", "....ffffff....", "....ffffff....", "....f.ffff....", "...hh..hh....."],
    hang: [".....h........", ".....f........", ".....f........", ".....f........", ".....ff.......", "....FfffF.....", "....FkckF.....", "....FcccF.....", ".....FFF......", "....fffff.....", "...f.fff.f....", "...f.fff.f....", "...h.fff.h....", ".....f.f......", ".....f.f......", ".....h.h......"],
    brach: ["..h.....h.....", "..f.....f.....", "...f...f......", "....f.f.......", ".....ff.......", "....FfffF.....", "....FkckF.....", "....FcccF.....", ".....FFF......", "....fffff.....", ".....fff......", ".....fff......", "....f...f.....", "...f.....f....", "...h.....h....", ".............."],
    // Upright on the ground, arms raised for balance.
    walk0: ["..............", "..h.......h...", "..f.......f...", "...f.fff.f....", "....FfffF.....", "....FkckF.....", "....FcccF.....", ".....FFF......", "....fffff.....", ".....fff......", ".....fff......", ".....fff......", "....f..f......", "....f...f.....", "...f.....f....", "..hh.....hh..."],
    walk1: ["..............", "..h.......h...", "..f.......f...", "...f.fff.f....", "....FfffF.....", "....FkckF.....", "....FcccF.....", ".....FFF......", "....fffff.....", ".....fff......", ".....fff......", ".....fff......", ".....ff.......", ".....ff.......", ".....ff.......", "....hhh......."],
  },
};
const LEMUR: Body = {
  w: 12,
  h: 16,
  stand: { look: "sit", eat: "sit", chew: "sit", scratch: "sit", groom: "sit", groom2: "sit", sleep: "sit~", call: "sit", leap: "hop", crouch: "walk1", hang: "climb0", tuck: "climb0", brach: "climb0", climb1: "climb0", roll: "walk1" },
  art: {
    sit: ["............", "..t.........", ".T..........", ".t..........", ".T...F..F...", ".t...fFFf...", ".T..fckFck..", ".t..fFFFFcn.", ".T...fFFf...", ".t..ffFFf...", ".T.fffFFfh..", ".t.fffFFfh..", "..tffffff...", "...fffff....", "...hh.hh....", "............"],
    // Sunbathing: arms out, belly to the morning sun.
    sun: ["............", "............", "............", "............", "...F....F...", "...FffffF...", "...fckckf...", "....fFnF....", "hff.FFFF.ffh", "...hFFFFh...", "....FFFF....", "...ffffff...", "..ff.tt.ff..", "..h..Tt..h..", ".....tT.....", "....tTt....."],
    // A sifaka's sideways bound, arms up.
    hop: ["............", ".....h......", "...h.f......", "...f.F..F...", "....fFffF...", "....fckck...", "....fFFFn...", "....fFFF....", "....ffFF....", "...ffffff...", "..t.ffff.f..", ".T...ff...f.", ".t...f.....h", "t....f......", ".....h......", "............"],
    walk0: ["..tT........", ".t..........", ".T..........", ".t..........", ".T..........", "..t.........", "..T......F.F", "...t.....ffF", "...ffffffckc", "...fFFFFfFFn", "...ffffff...", "...f.f..f.f.", "..h..h.h..h.", "............", "............", "............"],
    walk1: ["..tT........", ".t..........", ".T..........", ".t..........", ".T..........", "..t.........", "..T......F.F", "...t.....ffF", "...ffffffckc", "...fFFFFfFFn", "...ffffff...", "....ff..ff..", "....hh..hh..", "............", "............", "............"],
    climb0: ["............", "............", "...h....h...", "...f.FF.f...", "....FffF....", "...ffffff...", "...ffffff...", "...ffffff...", "....ffff....", "...ff..ff...", "..h.ttt..h..", ".....T......", ".....t......", ".....T......", ".....t......", "............"],
  },
};
const BODY: Record<Family, Body> = { macaque: MACAQUE, baboon: BABOON, gibbon: GIBBON, lemur: LEMUR };
const FAMILY: Partial<Record<Species, Family>> = {
  "olive-baboon": "baboon", hamadryas: "baboon", gelada: "baboon",
  "lar-gibbon": "gibbon", "ring-tailed": "lemur", sifaka: "lemur",
};
const familyOf = (s: Species) => FAMILY[s] ?? "macaque";
const grounded = (f: Family) => f === "baboon" || f === "lemur";

const INK = { k: "#1d1410", w: "#f8f4ea", Y: "#e8c040" };
const SPECIES: Record<Species, Record<string, string>> = {
  japanese: { f: "#8a7a66", F: "#b8a890", c: "#d8645a", C: "#a89880", h: "#6a5a4a", t: "#8a7a66" },
  // The Barbary macaque has no tail to speak of.
  barbary: { f: "#b08a5a", F: "#d4b484", c: "#d8a090", C: "#c09a6a", h: "#7a5a3a" },
  rhesus: { f: "#9a7a52", F: "#c8a878", c: "#e0a08e", C: "#8a6a44", h: "#6a4a30", t: "#8a6a44" },
  langur: { f: "#a8a49a", F: "#d8d4c8", c: "#2a2420", C: "#c8c4b8", h: "#2a2420", t: "#a8a49a", k: "#8a6a3a" },
  vervet: { f: "#8a8a6a", F: "#d8d4c0", c: "#2a2420", C: "#e8e4d4", h: "#2a2420", t: "#8a8a6a", k: "#8a6a3a" },
  colobus: { f: "#1e1c1c", F: "#2a2626", c: "#3a3430", C: "#f2f0ea", h: "#141212", t: "#f2f0ea", k: "#c8a060" },
  capuchin: { f: "#5a3e26", F: "#e8d6b0", c: "#e8c8a0", C: "#2a1c12", h: "#3a2818", t: "#5a3e26" },
  howler: { f: "#2a2220", F: "#3a2e28", c: "#4a3a30", C: "#2a2220", h: "#141010", t: "#2a2220", k: "#c89a50" },
  "olive-baboon": { f: "#7a7450", F: "#9a9468", m: "#6a6440", c: "#3a3430", n: "#1d1814", h: "#3a3428", t: "#6a6440", r: "#5a4a3a" },
  // The hamadryas male's silver cape and red rump.
  hamadryas: { f: "#a8a296", F: "#c8c2b4", m: "#d8d4ca", c: "#d89080", n: "#a85a50", h: "#5a5248", t: "#a8a296", r: "#c84a3a" },
  // The gelada's bleeding-heart patch on the chest.
  gelada: { f: "#7a5a3a", F: "#c8443a", m: "#5a3e24", c: "#2a2018", n: "#1d1410", h: "#3a2818", t: "#5a3e24", r: "#5a3e24" },
  "lar-gibbon": { f: "#c8a87a", F: "#f0e8d8", c: "#3a302a", h: "#3a302a", k: "#c89a50" },
  "ring-tailed": { f: "#9a948c", F: "#ece8e0", c: "#2a2624", n: "#1d1410", h: "#3a3430", t: "#ece8e0", T: "#1e1c1c", k: "#e8a030" },
  sifaka: { f: "#e6dfcf", F: "#f6f2ea", c: "#2a2018", n: "#1d1410", h: "#3a3028", t: "#ece8dc", T: "#e0dccf", k: "#e8a030" },
};
const FRUIT = ["#e8c040", "#d0502e", "#8ab040", "#e88a30"];

/** Which primates live here, if any. */
function speciesAt(ctx: MonkeyContext, h: number): Species | undefined {
  const { lat, lon } = ctx;
  if (ctx.ecology === "tundra") return;
  if (lon > 129 && lon < 146 && lat > 30 && lat < 42) return "japanese";
  if (lon > -10 && lon < 12 && lat > 27 && lat < 37) return "barbary";
  // Madagascar has lemurs and no monkeys.
  if (lon > 42.5 && lon < 51 && lat > -26 && lat < -11) return lat < -21 || ctx.ecology === "dry-scrub" ? "ring-tailed" : "sifaka";
  const open = ["savanna", "grassland", "dry-scrub"].includes(ctx.ecology);
  if (open && lon > 36 && lon < 41.5 && lat > 8 && lat < 15 && ["highland", "temperate"].includes(ctx.climate)) return "gelada";
  if (open && ((lon > 36 && lon < 52 && lat > 8 && lat < 16) || (lon > 38 && lon < 46 && lat > 12 && lat < 22))) return "hamadryas";
  if (open && lon > -18 && lon < 52 && lat > -35 && lat < 16) return h < 0.6 ? "olive-baboon" : "vervet";
  const warm = ["tropical", "monsoon"].includes(ctx.climate) || ["tropical-woodland", "savanna"].includes(ctx.ecology);
  if (!warm || ctx.ecology === "desert") return;
  // No monkeys on the Caribbean islands or east of Wallace's line.
  if ((lon > -83 && lon < -59 && lat > 11.5) || (lon > 125 && lat < 5)) return;
  if (lon > -120 && lon < -34 && lat > -32 && lat < 24) return h < 0.6 ? "capuchin" : "howler";
  if (lon > -18 && lon < 52 && lat > -35 && lat < 16) return ctx.ecology === "tropical-woodland" && h > 0.55 ? "colobus" : "vervet";
  if (lon > 66 && lon < 92 && lat > 6 && lat < 31) return h < 0.5 ? "langur" : "rhesus";
  if (lon > 90 && lon < 122 && lat > -8 && lat < 26 && h < 0.55) return "lar-gibbon";
  if (lon > 60 && lon < 135 && lat > -11 && lat < 36) return "rhesus";
}

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

/** Every frame, plus a blinking copy of each with eyes: the eye pixel takes
 * the face colour. Fur is lit from above: its top edge a shade lighter, its
 * underside a shade darker. */
function texture(scene: Phaser.Scene, species: Species) {
  const key = `monkey-${species}`;
  if (scene.textures.exists(key)) return key;
  const { w, h, art, stand } = BODY[familyOf(species)];
  const frames = Object.entries(art).flatMap(([name, rows]) =>
    rows.some((r) => r.includes("k")) ? [[name, rows], [`${name}~`, rows.map((r) => r.replace(/k/g, "c"))]] : [[name, rows]],
  ) as [string, string[]][];
  const canvas = scene.textures.createCanvas(key, w * frames.length, h)!;
  const ctx = canvas.getContext();
  const ink: Record<string, string> = { ...INK, ...SPECIES[species] };
  const at = new Map<string, number>();
  frames.forEach(([name, rows], f) => {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!ink[ch]) return;
        const fur = ch === "f" || ch === "t" || ch === "m";
        const above = rows[y - 1]?.[x] ?? ".",
          below = rows[y + 1]?.[x] ?? ".";
        ctx.fillStyle = fur && !ink[below] ? shade(ink[ch], 0.8) : fur && !ink[above] ? shade(ink[ch], 1.18) : ink[ch];
        ctx.fillRect(f * w + x, y, 1, 1);
      }),
    );
    canvas.add(name, 0, f * w, 0, w, h);
    at.set(name, f);
  });
  for (const [name, like] of Object.entries(stand))
    for (const [n, l] of [[name, like], [`${name}~`, at.has(`${like}~`) ? `${like}~` : like]]) {
      const f = at.get(l);
      if (f !== undefined && !at.has(n)) canvas.add(n, 0, f * w, 0, w, h);
    }
  canvas.refresh();
  return key;
}

type P = { x: number; y: number; z: number };
/** One stretch of movement or one pose held. */
type Leg = {
  to: P;
  ms: number;
  frames: string[];
  fps?: number;
  /** Height of a leap's arc in pixels. */
  arc?: number;
  /** Hanging from a branch: drawn from the hand down, swaying. */
  hang?: boolean;
  /** Degrees turned over the leg: a tumble. */
  spin?: number;
  /** Turns to watch the player while it sits. */
  watch?: boolean;
  tree?: Image;
  then?: () => void;
};
type Monkey = {
  image: Image;
  shadow: Phaser.GameObjects.Ellipse;
  /** What it has in hand, drawn in the thing's colour. */
  loot?: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  z: number;
  from: P;
  tree: Image;
  legs: Leg[];
  leg?: Leg;
  started: number;
  seed: number;
  troop: number;
  size: number;
  /** A juvenile carried on its mother's back. */
  riding?: { on: Monkey; until: number };
};

const hash = (x: number, y: number, s: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Troops of monkeys in the trees. They perch, eat, scratch and groom each
 * other, hang and swing from crown to crown, come down to forage, play and
 * tumble, carry their young, sleep curled up at night, pelt passers-by with
 * fruit, and now and then rob someone of something to eat. */
export class Monkeys {
  private troop: Monkey[] = [];
  private context?: MonkeyContext;
  private species?: Species;
  private scanAt = 0;
  private stealAt = 0;
  private peltAt = 0;
  private last?: { x: number; y: number; t: number };
  private pace = 0;

  constructor(
    private scene: Phaser.Scene,
    private view: {
      player: () => Image | undefined;
      /** Other people on the street, for a monkey to rob. */
      people: () => Image[];
      plants: () => Map<string, Image[]>;
      seed: () => number;
      /** Takes something edible from the player; its colour, or nothing to take. */
      steal: () => string | undefined;
    },
  ) {}

  set(context: MonkeyContext | undefined) {
    const was = this.context;
    this.context = context;
    const species = context && speciesAt(context, hash(this.view.seed(), 2, 2));
    if (species !== this.species || !context || context.night !== was?.night) {
      this.clear();
      this.species = species;
      this.scanAt = 0;
    }
  }

  clear() {
    for (const m of this.troop) this.drop(m);
    this.troop = [];
  }

  private drop(m: Monkey) {
    m.image.destroy();
    m.shadow.destroy();
    m.loot?.destroy();
  }

  private trees() {
    const view = this.scene.cameras.main.worldView;
    const out: Image[] = [];
    for (const images of this.view.plants().values()) {
      if (!images.length) continue;
      const tree = images.reduce((a, b) => (b.displayHeight > a.displayHeight ? b : a));
      if (tree.active && tree.displayHeight >= 40 && tree.x > view.x - 120 && tree.x < view.right + 120 && tree.y > view.y - 80 && tree.y < view.bottom + 160)
        out.push(tree);
    }
    return out;
  }

  private crown(tree: Image, side = 0): P {
    return { x: tree.x + side * tree.displayWidth * 0.18, y: tree.y + 1, z: tree.displayHeight * 0.55 };
  }

  private scan() {
    const view = this.scene.cameras.main.worldView;
    this.troop = this.troop.filter((m) => {
      const keep = m.tree.active && m.x > view.x - 200 && m.x < view.right + 200 && m.y > view.y - 200 && m.y < view.bottom + 260;
      if (!keep) this.drop(m);
      return keep;
    });
    const lead = this.troop[0];
    this.scene.game.canvas.dataset.monkeys = `${this.species ?? "none"}:${this.troop.length}${lead ? `@${Math.floor(lead.x / 16)},${Math.floor(lead.y / 16)}` : ""}`;
    if (!this.species || this.troop.length) return;
    // One troop at a time, settled round one tree and its neighbours.
    const trees = this.trees().filter((t) => hash(Math.round(t.x), Math.round(t.y), this.view.seed()) < 0.35);
    if (!trees.length) return;
    const home = trees[0];
    const fam = familyOf(this.species);
    const roll = hash(home.x, home.y, 4);
    // Gibbons live as a pair and their young; baboons in big ground troops.
    const n = fam === "gibbon" ? 2 + Math.round(roll) : fam === "baboon" ? 5 + Math.floor(roll * 4) : fam === "lemur" ? 4 + Math.floor(roll * 3) : 3 + Math.floor(roll * 3);
    for (let i = 0; i < n; i++) {
      const at = grounded(fam)
        ? { x: home.x + (hash(i, home.x, 5) - 0.5) * 60, y: home.y + 4 + hash(i, home.y, 6) * 24, z: 0 }
        : this.crown(home, (i % 3) - 1);
      // The last of a family is a juvenile, a smaller copy of the rest.
      const size = i === n - 1 && n > 2 ? 0.7 : 1;
      const image = this.scene.add.image(at.x, at.y - at.z, texture(this.scene, this.species), "sit").setOrigin(0.5, 1).setScale(size);
      const shadow = this.scene.add.ellipse(at.x, at.y, BODY[fam].w * 0.55 * size, 2, 0x1d2230, 0.25);
      this.troop.push({
        image, shadow, x: at.x, y: at.y, z: at.z, from: at, tree: home,
        legs: [], started: 0, seed: hash(i, home.x, 7) * 100, troop: i, size,
      });
    }
  }

  update(time: number) {
    const ctx = this.context;
    if (!ctx || !this.species) return;
    if (time > this.scanAt) {
      this.scanAt = time + 2000;
      this.scan();
    }
    const player = this.view.player();
    if (player) {
      if (this.last && time > this.last.t)
        this.pace += (Math.hypot(player.x - this.last.x, player.y - this.last.y) / ((time - this.last.t) / 1000) - this.pace) * 0.1;
      this.last = { x: player.x, y: player.y, t: time };
    }
    for (const m of this.troop) this.step(m, time, ctx, player);
  }

  private begin(m: Monkey, time: number) {
    const landed = !!m.leg?.arc && m.leg.arc > 0;
    m.leg = m.legs.shift();
    m.from = { x: m.x, y: m.y, z: m.z };
    m.started = time;
    if (m.leg?.tree) m.tree = m.leg.tree;
    if (m.leg && Math.abs(m.leg.to.x - m.x) > 1) m.image.setFlipX(m.leg.to.x < m.x);
    // Squash on landing, then spring back.
    if (landed) {
      m.image.setScale(m.size * 1.25, m.size * 0.75);
      this.scene.tweens.add({ targets: m.image, scaleX: m.size, scaleY: m.size, duration: 160, ease: "Back.easeOut" });
    }
  }

  /** Startle the troop: everyone near goes up a tree, shrieking. Baboons
   * stand their ground instead: the big male gapes his canines at you while
   * the rest draw off. */
  private alarm(from: Monkey, time: number, player: Image) {
    const baboons = familyOf(this.species!) === "baboon";
    for (const m of this.troop) {
      if (m.z > 3 || m.riding || Math.hypot(m.x - from.x, m.y - from.y) > 70 || m.leg?.arc) continue;
      m.legs = [];
      if (baboons && m.troop === 0) {
        m.image.setFlipX(player.x < m.x);
        m.legs.push({ ...this.hold(["yawn", "sit", "yawn", "yawn"], 1800, { x: m.x, y: m.y, z: 0 }, 3, false), then: () => this.call(m) });
      } else if (baboons) {
        const away = Math.sign(m.x - player.x) || 1;
        m.legs.push(...this.walk(m, { x: m.x + away * 40, y: m.y + (hash(m.seed, time, 2) - 0.5) * 20, z: 0 }, 80));
      } else this.scamper(m, this.crown(m.tree, (m.troop % 3) - 1));
      this.begin(m, time + m.troop * 60);
      if (m === from || m.troop % 2) this.call(m);
    }
  }

  private step(m: Monkey, time: number, ctx: MonkeyContext, player?: Image) {
    if (m.riding) return this.ride(m, time, ctx);
    const d = player ? Math.hypot(player.x - m.x, player.y - m.y) : 1e9;
    // A player charging at a monkey on the ground sends the troop up the trees.
    const bold = familyOf(this.species!) === "baboon";
    if (player && m.z < 4 && d < 26 && this.pace > (bold ? 30 : 60) && !m.leg?.arc && !m.leg?.frames.includes("climb0") && !m.leg?.frames.includes("yawn"))
      this.alarm(m, time, player);
    if (!m.leg || time >= m.started + m.leg.ms) {
      const done = m.leg;
      if (done) {
        m.x = done.to.x;
        m.y = done.to.y;
        m.z = done.to.z;
        done.then?.();
      }
      if (!m.legs.length) this.think(m, time, ctx, player);
      this.begin(m, time);
    }
    const leg = m.leg!;
    const t = Math.max(0, Math.min(1, (time - m.started) / leg.ms));
    const ease = leg.arc ? t : t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    m.x = m.from.x + (leg.to.x - m.from.x) * ease;
    m.y = m.from.y + (leg.to.y - m.from.y) * ease;
    m.z = m.from.z + (leg.to.z - m.from.z) * ease + (leg.arc ? Math.sin(t * Math.PI) * leg.arc : 0);
    let frame = leg.frames[Math.floor(((time - m.started) / 1000) * (leg.fps ?? 4) + m.seed) % leg.frames.length];
    if (leg.watch && player && d < 80 && Math.abs(player.x - m.x) > 3) {
      m.image.setFlipX(player.x < m.x);
      if (frame === "sit") frame = "look";
    }
    // A blink every few seconds, out of step with the rest of the troop.
    if ((time / 120 + m.seed * 37) % 36 < 1 && this.scene.textures.get(m.image.texture.key).has(`${frame}~`)) frame = `${frame}~`;
    const aloft = m.z > 3;
    const sway = leg.hang ? Math.sin(time / 420 + m.seed) * 14 : 0;
    m.image
      .setFrame(frame)
      .setOrigin(0.5, leg.hang ? 0 : leg.spin ? 0.6 : 1)
      .setAngle(leg.spin ? leg.spin * t * (m.image.flipX ? -1 : 1) : sway)
      .setPosition(Math.round(m.x), Math.round(m.y - m.z - (leg.spin ? 5 * m.size : 0)))
      .setDepth(aloft ? m.tree.depth + 0.05 + m.troop * 0.001 : m.y + 0.5)
      .setTint(ctx.tint);
    m.shadow.setPosition(Math.round(m.x), Math.round(m.y)).setDepth(m.y + 0.4).setVisible(!aloft);
    const body = BODY[familyOf(this.species!)];
    m.loot
      ?.setPosition(Math.round(m.x + (m.image.flipX ? -1 : 1) * body.w * 0.33 * m.size), Math.round(m.y - m.z - (leg.hang ? -1 : 1) * body.h * 0.5 * m.size))
      .setDepth(m.image.depth + 0.01);
  }

  /** Clinging to its mother's back, going where she goes. */
  private ride(m: Monkey, time: number, ctx: MonkeyContext) {
    const mum = m.riding!.on;
    if (time > m.riding!.until || !mum.image.active || mum.leg?.hang || mum.leg?.spin) {
      m.riding = undefined;
      m.x = mum.x + (mum.image.flipX ? 6 : -6);
      m.y = mum.y + 2;
      m.z = mum.z;
      m.legs = [];
      m.leg = undefined;
      return;
    }
    m.x = mum.x;
    m.y = mum.y;
    m.z = mum.z;
    const climbing = mum.image.frame.name.startsWith("climb");
    const body = BODY[familyOf(this.species!)];
    const back = climbing ? 0 : (mum.image.flipX ? 1 : -1) * Math.round(body.w / 6);
    m.image
      .setFrame(climbing ? "climb0" : "sit")
      .setFlipX(mum.image.flipX)
      .setOrigin(0.5, 1)
      .setAngle(mum.image.angle)
      .setPosition(Math.round(mum.image.x + back), Math.round(mum.image.y - body.h * (climbing ? 0.25 : 0.5)))
      .setDepth(mum.image.depth + 0.002)
      .setTint(ctx.tint);
    m.shadow.setVisible(false);
  }

  private hold(frames: string[], ms: number, at: P, fps = 3, watch = true): Leg {
    return { to: at, ms, frames, fps, watch };
  }

  /** Across the ground: a sifaka bounds sideways on its hind legs in a
   * string of hops; the rest go on all fours. */
  private walk(m: Monkey, to: P, speed: number): Leg[] {
    const far = Math.hypot(to.x - m.x, to.y - m.y);
    if (this.species !== "sifaka") return [{ to, ms: (far / speed) * 1000 + 60, frames: ["walk0", "walk1"], fps: speed > 60 ? 12 : 7 }];
    const n = Math.max(1, Math.round(far / 14));
    return Array.from({ length: n }, (_, i) => ({
      to: { x: m.x + ((to.x - m.x) * (i + 1)) / n, y: m.y + ((to.y - m.y) * (i + 1)) / n, z: 0 },
      ms: 300,
      frames: ["hop"],
      arc: 6,
    }));
  }

  /** To the trunk, up it, and into the crown. */
  private scamper(m: Monkey, to: P) {
    const base = { x: m.tree.x, y: m.tree.y + 1, z: 0 };
    if (m.z < 3) {
      m.legs.push(...this.walk(m, base, 70));
      m.legs.push({ to: { ...base, z: to.z }, ms: (to.z / 55) * 1000, frames: ["climb0", "climb1"], fps: 9 });
    }
    m.legs.push({ to, ms: 300, frames: ["walk0", "walk1"], fps: 10 });
  }

  private think(m: Monkey, time: number, ctx: MonkeyContext, player?: Image) {
    const r = (n: number) => hash(m.seed, Math.floor(time), n);
    const here = { x: m.x, y: m.y, z: m.z };
    const aloft = m.z > 3;
    if (ctx.night) {
      // Huddled together in the crown till morning.
      m.legs.push(this.hold(["sleep"], 6000, aloft ? here : this.crown(m.tree, (m.troop % 3) - 1), 1, false));
      return;
    }
    // A thief does not sit about in the open with its prize.
    if (m.loot) {
      if (!aloft) return this.scamper(m, this.crown(m.tree, 0));
      m.legs.push(this.hold(["eat", "chew", "eat", "chew", "sit"], 5000, here, 3, false));
      m.legs.push({
        ...this.hold(["sit"], 400, here),
        then: () => {
          m.loot?.destroy();
          m.loot = undefined;
        },
      });
      return;
    }
    const fam = familyOf(this.species!);
    // Gibbons keep to the canopy; at dawn a pair sings together.
    if (fam === "gibbon" && !aloft) return this.scamper(m, this.crown(m.tree, 0));
    if (fam === "gibbon" && ctx.dawn && r(16) < 0.5) return this.sing(m, time);
    // A ring-tail starts its day sitting out with its arms spread to the sun.
    if (this.species === "ring-tailed" && (ctx.dawn || ctx.tempC < 16) && r(17) < 0.45)
      return void m.legs.push(this.hold(["sun", "sun", "sun~"], 4000 + r(18) * 4000, here, 1, false));
    if (fam === "baboon" && aloft && r(19) < 0.6) return this.descend(m, r);
    // A juvenile climbs onto its mother when she is about to move off.
    const mum = this.troop[0];
    if (m.size < 1 && mum !== m && !mum.riding && r(10) < 0.3 && Math.hypot(mum.x - m.x, mum.y - m.y) < 30 && Math.abs(mum.z - m.z) < 8) {
      m.riding = { on: mum, until: time + 9000 + r(11) * 9000 };
      return void m.legs.push(this.hold(["sit"], 500, here));
    }
    // In the cold they sit hunched together, as snow monkeys do.
    if (ctx.tempC < 3 && r(12) < 0.6) return void m.legs.push(this.hold(["sleep", "sleep", "sit"], 5000, here, 1));
    const under = player && Math.abs(player.x - m.tree.x) < 24 && player.y > m.tree.y - 10 && player.y < m.tree.y + 30;
    if (fam === "macaque" && aloft && under && time > this.peltAt && r(13) < 0.35) return this.pelt(m, time, player!);
    const near = player && Math.hypot(player.x - m.x, player.y - m.y) < 90;
    const thief = fam === "baboon" || fam === "macaque" || this.species === "ring-tailed";
    if (thief && time > this.stealAt && r(1) < (fam === "baboon" ? 0.35 : 0.2)) {
      if (near && this.pace < (fam === "baboon" ? 50 : 30)) return this.raid(m, time, player!, true);
      const mark = this.view.people().find((p) => Math.hypot(p.x - m.tree.x, p.y - m.tree.y) < 80);
      if (mark) return this.raid(m, time, mark, false);
    }
    const pick = r(2);
    const mate = this.troop.find((o) => o !== m && !o.riding && Math.hypot(o.x - m.x, o.y - m.y) < 14 && Math.abs(o.z - m.z) < 4 && !o.leg?.arc);
    if (mate && pick < 0.2) {
      // Grooming: one combs, the other sits still for it, eyes half shut.
      m.image.setFlipX(mate.x < m.x);
      m.legs.push(this.hold(["groom", "groom2", "groom", "groom2", "sit"], 4500, here, 3, false));
      mate.legs = [this.hold(["sit~", "sit", "sit~", "sit~"], 4500, { x: mate.x, y: mate.y, z: mate.z }, 1, false)];
      mate.leg = undefined;
      return;
    }
    if (aloft) {
      if (pick < 0.42) return void m.legs.push(this.hold(["sit", "eat", "chew", "eat", "chew", "sit", "scratch", "sit"], 2500 + r(3) * 3500, here, 2));
      if (fam === "gibbon" && pick < 0.75) {
        const next = this.trees()
          .filter((t) => t !== m.tree && Math.hypot(t.x - m.tree.x, t.y - m.tree.y) < 140)
          .sort((a, b) => hash(a.x, a.y, m.seed + time) - hash(b.x, b.y, m.seed + time))[0];
        if (next) return this.swing(m, next);
      }
      if (pick < 0.55 && (fam === "macaque" || fam === "gibbon")) {
        // Out along a branch hand over hand, then hang there and sway.
        const out = { x: m.x + (r(4) < 0.5 ? -1 : 1) * (6 + r(5) * 6), y: m.y, z: m.z - 2 };
        m.legs.push({ to: out, ms: 1200, frames: ["brach", "hang"], fps: 4, hang: true });
        m.legs.push({ to: out, ms: 2000 + r(6) * 2500, frames: ["hang", "hang", "tuck"], fps: 2, hang: true });
        m.legs.push({ to: here, ms: 1000, frames: ["brach", "hang"], fps: 4, hang: true });
        return;
      }
      if (pick < 0.82) {
        const next = this.trees()
          .filter((t) => t !== m.tree && Math.hypot(t.x - m.tree.x, t.y - m.tree.y) < 110)
          .sort((a, b) => hash(a.x, a.y, m.seed) - hash(b.x, b.y, m.seed))[0];
        if (next) return this.swing(m, next);
      }
      if (pick < 0.9 && this.species === "howler") {
        this.call(m);
        return void m.legs.push(this.hold(["call"], 1600, here, 4, false));
      }
      if (fam === "gibbon") return void m.legs.push(this.hold(["sit", "sit~", "sit"], 3000, here, 1));
      return this.descend(m, r);
    }
    // Two on the ground at play: a chase and a tumble.
    const playmate = this.troop.find((o) => o !== m && !o.riding && o.z < 3 && Math.hypot(o.x - m.x, o.y - m.y) < 40 && !o.leg?.arc);
    if (playmate && pick < 0.2) return this.play(m, playmate, r);
    if (pick < 0.5) return void m.legs.push(this.hold(["sit", "scratch", "sit", "eat", "chew", "eat"], 2000 + r(3) * 3000, here, 2));
    if (pick < 0.8 || (grounded(fam) && pick < 0.95)) {
      // Baboons range well out from their tree as they forage.
      const range = fam === "baboon" ? 110 : 50;
      const to = { x: m.tree.x + (r(8) - 0.5) * range, y: m.tree.y + (r(9) - 0.3) * range * 0.6, z: 0 };
      return void m.legs.push(...this.walk(m, to, 30));
    }
    this.scamper(m, this.crown(m.tree, (m.troop % 3) - 1));
  }

  /** Down to the ground: a crouch, a long drop and a soft landing. */
  private descend(m: Monkey, r: (n: number) => number) {
    const ground = { x: m.tree.x + (r(6) - 0.5) * 24, y: m.tree.y + 4 + r(7) * 10, z: 0 };
    m.legs.push(this.hold(["crouch"], 250, { x: m.x, y: m.y, z: m.z }, 1, false));
    m.legs.push({ to: ground, ms: 450, frames: ["leap"], arc: 4 });
    m.legs.push(this.hold(["crouch"], 150, ground, 1, false));
  }

  /** A gibbon pair's morning duet: rising whoops, one answering the other. */
  private sing(m: Monkey, time: number) {
    const here = { x: m.x, y: m.y, z: m.z };
    const whoop = (who: Monkey, at: P) => ({ ...this.hold(["call", "call", "sit"], 700, at, 4, false), then: () => this.call(who, true) });
    m.legs.push(...Array.from({ length: 5 }, () => whoop(m, here)), this.hold(["sit"], 1500, here));
    const mate = this.troop.find((o) => o !== m && o.size === 1 && !o.riding);
    if (mate && mate.z > 3) {
      const at = { x: mate.x, y: mate.y, z: mate.z };
      mate.legs = [this.hold(["sit"], 350, at), ...Array.from({ length: 5 }, () => whoop(mate, at))];
      mate.leg = undefined;
    }
    void time;
  }

  private play(m: Monkey, other: Monkey, r: (n: number) => number) {
    const dir = r(14) < 0.5 ? -1 : 1;
    const run = { x: m.x + dir * 22, y: m.y + (r(15) - 0.5) * 10, z: 0 };
    const meet = { x: run.x + dir * 6, y: run.y, z: 0 };
    m.legs.push({ to: run, ms: 450, frames: ["walk0", "walk1"], fps: 12 });
    m.legs.push({ to: meet, ms: 650, frames: ["roll"], spin: 720 });
    m.legs.push(this.hold(["sit", "scratch"], 900, meet, 2));
    other.legs = [
      { to: { x: other.x, y: other.y, z: 0 }, ms: 200, frames: ["crouch"] },
      { to: run, ms: 500 + (Math.hypot(run.x - other.x, run.y - other.y) / 90) * 1000, frames: ["walk0", "walk1"], fps: 12 },
      { to: { x: meet.x - dir * 3, y: meet.y, z: 0 }, ms: 400, frames: ["roll"], spin: 360 },
      this.hold(["sit"], 900, { x: meet.x - dir * 3, y: meet.y, z: 0 }, 2),
    ];
    other.leg = undefined;
  }

  /** Hang from the edge of the crown, swing, let go, and land in the next.
   * A gibbon goes hand over hand the whole way under the branches; a lemur
   * just jumps. */
  private swing(m: Monkey, next: Image) {
    const dir = Math.sign(next.x - m.tree.x) || 1;
    const fam = familyOf(this.species!);
    if (fam === "lemur") {
      const land = this.crown(next, -dir * 0.4);
      m.legs.push(this.hold(["crouch"], 300, { x: m.x, y: m.y, z: m.z }, 1, false));
      m.legs.push({ to: land, ms: (Math.hypot(land.x - m.x, land.y - m.y) / 120) * 1000 + 250, frames: ["hop"], arc: 16, tree: next, then: () => this.rustle(next) });
      m.legs.push(this.hold(["sit"], 500, land));
      return;
    }
    if (fam === "gibbon") {
      const from = { x: m.tree.x + dir * m.tree.displayWidth * 0.25, y: m.tree.y + 1, z: m.z - 4 };
      const to = { x: next.x - dir * next.displayWidth * 0.25, y: next.y + 1, z: next.displayHeight * 0.55 - 4 };
      m.legs.push({ to: from, ms: 400, frames: ["brach", "hang"], fps: 6, hang: true });
      const n = Math.max(2, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 22));
      for (let i = 1; i <= n; i++)
        m.legs.push({
          to: { x: from.x + ((to.x - from.x) * i) / n, y: from.y + ((to.y - from.y) * i) / n, z: from.z + ((to.z - from.z) * i) / n },
          ms: 320,
          frames: ["brach", "hang"],
          fps: 7,
          hang: true,
          // Each swing dips under the branch and rises to the next hold.
          arc: -6,
          tree: i === n ? next : undefined,
          then: i === n ? () => this.rustle(next) : undefined,
        });
      m.legs.push(this.hold(["sit"], 400, this.crown(next, -dir * 0.3)));
      return;
    }
    const edge = { x: m.tree.x + dir * m.tree.displayWidth * 0.3, y: m.tree.y + 1, z: m.z - 3 };
    const land = this.crown(next, -dir * 0.5);
    m.legs.push({ to: { ...edge }, ms: 500, frames: ["walk0", "walk1"], fps: 10 });
    m.legs.push({ to: { ...edge, z: edge.z - 1 }, ms: 900, frames: ["hang", "tuck"], fps: 3, hang: true });
    m.legs.push({
      to: land,
      ms: (Math.hypot(land.x - edge.x, land.y - edge.y, land.z - edge.z) / 110) * 1000 + 200,
      frames: ["leap"],
      arc: 12,
      tree: next,
      then: () => this.rustle(next),
    });
    m.legs.push(this.hold(["crouch", "sit"], 600, land, 3, false));
  }

  /** A fruit dropped on a passer-by from the crown, with a cackle. */
  private pelt(m: Monkey, time: number, player: Image) {
    this.peltAt = time + 40000;
    const here = { x: m.x, y: m.y, z: m.z };
    m.image.setFlipX(player.x < m.x);
    m.legs.push({
      ...this.hold(["eat"], 500, here, 1, false),
      then: () => {
        const color = FRUIT[Math.floor(hash(m.seed, time, 3) * FRUIT.length)];
        const fruit = this.scene.add
          .rectangle(m.x, m.y - m.z - 6, 2, 2, Phaser.Display.Color.HexStringToColor(color).color)
          .setDepth(m.tree.depth + 0.1);
        const tx = player.x + (hash(m.seed, time, 4) - 0.5) * 10,
          ty = player.y - 2;
        this.scene.tweens.add({
          targets: fruit,
          x: tx,
          y: ty,
          duration: 600,
          ease: "Quad.easeIn",
          onComplete: () => {
            fruit.setDepth(ty + 0.5);
            this.scene.tweens.add({
              targets: fruit,
              x: tx + 8,
              y: { from: ty, to: ty - 5 },
              yoyo: true,
              duration: 160,
              onComplete: () => this.scene.tweens.add({ targets: fruit, alpha: 0, delay: 3000, duration: 800, onComplete: () => fruit.destroy() }),
            });
          },
        });
        this.call(m);
      },
    });
    m.legs.push(this.hold(["call", "sit", "call"], 1200, here, 5, false));
  }

  /** Down the trunk, feigned interest elsewhere, a dash, a grab, and back up
   * the tree. Only a theft from the player takes anything real. */
  private raid(m: Monkey, time: number, mark: Image, isPlayer: boolean) {
    this.stealAt = time + (isPlayer ? 90000 : 45000);
    const side = m.x < mark.x ? -1 : 1;
    const foot = { x: m.tree.x, y: m.tree.y + 4, z: 0 };
    if (m.z > 3) {
      m.legs.push(this.hold(["crouch"], 250, { x: m.x, y: m.y, z: m.z }, 1, false));
      m.legs.push({ to: foot, ms: 450, frames: ["leap"], arc: 4 });
    }
    m.legs.push(this.hold(["sit", "scratch", "look"], 1400, foot, 2));
    m.legs.push({
      to: { x: mark.x + side * 6, y: mark.y, z: 0 },
      ms: (Math.hypot(mark.x - foot.x, mark.y - foot.y) / 120) * 1000 + 100,
      frames: ["walk0", "walk1"],
      fps: 12,
      then: () => {
        const close = Math.hypot(mark.x - m.x, mark.y - m.y) < 24;
        const color = !close ? undefined : isPlayer ? this.view.steal() : FRUIT[Math.floor(hash(m.seed, time, 5) * FRUIT.length)];
        if (color) {
          m.loot = this.scene.add.rectangle(m.x, m.y, 3, 3, Phaser.Display.Color.HexStringToColor(color).color);
          this.call(m);
          if (!isPlayer) this.startle(mark);
        }
        m.legs = [];
        this.scamper(m, this.crown(m.tree, 0));
      },
    });
  }

  /** A robbed passer-by jumps. */
  private startle(person: Image) {
    const y = person.y;
    this.scene.tweens.add({ targets: person, y: y - 3, yoyo: true, duration: 90, onComplete: () => person.setY(y) });
    const mark = this.scene.add.rectangle(person.x, person.y - person.displayHeight - 4, 1, 4, 0xf8f4ea).setDepth(person.depth + 1);
    const dot = this.scene.add.rectangle(person.x, person.y - person.displayHeight + 2, 1, 1, 0xf8f4ea).setDepth(person.depth + 1);
    this.scene.tweens.add({ targets: [mark, dot], alpha: 0, delay: 700, duration: 300, onComplete: () => (mark.destroy(), dot.destroy()) });
  }

  private rustle(tree: Image) {
    this.scene.tweens.add({ targets: tree, angle: { from: -1.5, to: 1.5 }, duration: 100, yoyo: true, repeat: 2, onComplete: () => tree.setAngle(0) });
    for (let i = 0; i < 3; i++) {
      const leaf = this.scene.add
        .rectangle(tree.x + (i - 1) * 6, tree.y - tree.displayHeight * 0.55, 2, 1, 0x5a8a3a)
        .setDepth(tree.depth + 0.2);
      this.scene.tweens.add({
        targets: leaf,
        x: leaf.x + (i - 1) * 8 + Math.sin(i * 3) * 6,
        y: tree.y - 2,
        angle: 180,
        alpha: 0,
        duration: 1400 + i * 200,
        ease: "Sine.easeIn",
        onComplete: () => leaf.destroy(),
      });
    }
  }

  /** A call: a few short marks fanning out from the mouth; a song's are
   * notes that rise. */
  private call(m: Monkey, song = false) {
    const body = BODY[familyOf(this.species!)];
    const x = m.x + (m.image.flipX ? -1 : 1) * body.w * 0.4 * m.size,
      y = m.y - m.z - body.h * 0.65 * m.size;
    if (song) {
      const note = this.scene.add.rectangle(x, y, 2, 2, 0xf8f4ea).setDepth(m.image.depth + 1);
      this.scene.tweens.add({ targets: note, y: y - 10, x: x + (m.image.flipX ? -4 : 4), alpha: 0, duration: 900, ease: "Sine.easeOut", onComplete: () => note.destroy() });
      return;
    }
    for (let i = 0; i < 3; i++) {
      const mark = this.scene.add.rectangle(x, y, 1, 3, 0xf8f4ea).setAngle((i - 1) * 35).setDepth(m.image.depth + 1).setAlpha(0);
      this.scene.tweens.add({
        targets: mark,
        alpha: { from: 0.9, to: 0 },
        x: x + (m.image.flipX ? -5 : 5),
        y: y - 3 + (i - 1) * 3,
        delay: i * 90,
        duration: 450,
        onComplete: () => mark.destroy(),
      });
    }
  }
}
