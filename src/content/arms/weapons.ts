import { launchers, weaponOf } from "../../core/combat";

/** How a blow does its harm, which is what armour answers. `pierce` is an
 * arrow, bolt or javelin; `ball` is gunpowder. */
export type Hurt = "cut" | "thrust" | "crush" | "pierce" | "ball";
export type Family =
  | "fist" | "dagger" | "club" | "axe" | "sword" | "greatsword" | "sabre"
  | "spear" | "pike" | "polearm" | "lance"
  | "bow" | "crossbow" | "sling" | "javelin" | "gun" | "machine-gun";
/** The one extra move a family has. */
export type Special =
  | "throw" | "lunge" | "smash" | "hook" | "bash" | "sweep" | "flurry"
  | "brace" | "unhorse" | "couch" | "aimed" | "bayonet" | "burst";

export type Shot = {
  /** Tiles. */
  range: number;
  /** Tiles a second. */
  speed: number;
  damage: number;
  /** Seconds to make ready again. */
  reload: number;
  /** Seconds to a full draw; damage and range grow with it. */
  draw?: number;
  /** Radians of error at one tile. */
  spread: number;
  /** Shot high to come down on a spot, so it can pass over friends. */
  lob?: boolean;
  hurt: Hurt;
  /** Rounds let off together before the reload. */
  burst?: number;
  smoke?: boolean;
  /** The thing itself is thrown, so the hand is empty afterwards. */
  thrown?: boolean;
  /** How many are carried, where it is not a quiver or a pouch of rounds. */
  carried?: number;
  /** Bursts where it lands, over this many tiles. */
  blast?: number;
};

export type Arm = {
  id: string;
  name: string;
  family: Family;
  hurt: Hurt;
  damage: number;
  /** Tiles from the body to the end of the blow. */
  reach: number;
  /** Degrees to each side of the facing that a blow covers. */
  arc: number;
  /** Seconds the blow is telegraphed, and seconds before the next. */
  windup: number;
  recover: number;
  /** Tiles the struck are driven back. */
  knock: number;
  /** How much of the other's footing a blow takes. */
  poise: number;
  /** Share of a blow the weapon stops when raised as a guard. */
  guard: number;
  /** Share of armour it ignores. */
  punch?: number;
  twoHanded?: boolean;
  /** Hits this much harder for each tile a second of closing speed. */
  momentum?: number;
  /** Loses a little of its edge with every blow that lands. */
  brittle?: boolean;
  special: Special;
  specialName: string;
  shot?: Shot;
  /** The art in the hand: an `icon:` item or one of the drawn `arms:` set. */
  art?: string;
  note: string;
};

type Base = Omit<Arm, "id" | "name" | "note" | "art">;
const families: Record<Family, Base> = {
  fist: { family: "fist", hurt: "crush", damage: 7, reach: 0.9, arc: 50, windup: 0.16, recover: 0.2, knock: 0.5, poise: 14, guard: 0.45, special: "throw", specialName: "Throw" },
  dagger: { family: "dagger", hurt: "thrust", damage: 13, reach: 0.95, arc: 35, windup: 0.13, recover: 0.18, knock: 0.2, poise: 8, guard: 0.3, special: "lunge", specialName: "Lunge" },
  club: { family: "club", hurt: "crush", damage: 21, reach: 1.2, arc: 60, windup: 0.34, recover: 0.4, knock: 1.5, poise: 34, guard: 0.5, punch: 0.25, special: "smash", specialName: "Overhead smash" },
  axe: { family: "axe", hurt: "cut", damage: 24, reach: 1.2, arc: 55, windup: 0.32, recover: 0.42, knock: 0.9, poise: 28, guard: 0.45, punch: 0.15, special: "hook", specialName: "Hook the guard" },
  sword: { family: "sword", hurt: "cut", damage: 18, reach: 1.3, arc: 60, windup: 0.2, recover: 0.26, knock: 0.5, poise: 18, guard: 0.72, special: "flurry", specialName: "Flurry" },
  greatsword: { family: "greatsword", hurt: "cut", damage: 30, reach: 1.7, arc: 85, windup: 0.4, recover: 0.48, knock: 1.1, poise: 36, guard: 0.68, twoHanded: true, special: "sweep", specialName: "Sweep" },
  sabre: { family: "sabre", hurt: "cut", damage: 20, reach: 1.4, arc: 70, windup: 0.19, recover: 0.28, knock: 0.5, poise: 18, guard: 0.62, momentum: 0.12, special: "flurry", specialName: "Flurry" },
  spear: { family: "spear", hurt: "thrust", damage: 20, reach: 2.1, arc: 16, windup: 0.25, recover: 0.34, knock: 0.6, poise: 16, guard: 0.5, momentum: 0.1, special: "brace", specialName: "Brace" },
  pike: { family: "pike", hurt: "thrust", damage: 22, reach: 3.3, arc: 10, windup: 0.38, recover: 0.5, knock: 0.8, poise: 20, guard: 0.3, twoHanded: true, special: "brace", specialName: "Brace" },
  polearm: { family: "polearm", hurt: "cut", damage: 28, reach: 2.3, arc: 48, windup: 0.4, recover: 0.5, knock: 1.2, poise: 32, guard: 0.55, punch: 0.3, twoHanded: true, special: "unhorse", specialName: "Hook and drag" },
  lance: { family: "lance", hurt: "thrust", damage: 22, reach: 2.6, arc: 12, windup: 0.3, recover: 0.6, knock: 1.4, poise: 30, guard: 0.3, punch: 0.2, momentum: 0.3, special: "couch", specialName: "Couch the lance" },
  bow: { family: "bow", hurt: "crush", damage: 5, reach: 1, arc: 50, windup: 0.22, recover: 0.3, knock: 0.6, poise: 10, guard: 0.2, twoHanded: true, special: "aimed", specialName: "Aimed shot" },
  crossbow: { family: "crossbow", hurt: "crush", damage: 8, reach: 1, arc: 50, windup: 0.28, recover: 0.36, knock: 0.8, poise: 14, guard: 0.3, twoHanded: true, special: "aimed", specialName: "Aimed shot" },
  sling: { family: "sling", hurt: "crush", damage: 5, reach: 0.9, arc: 50, windup: 0.18, recover: 0.24, knock: 0.4, poise: 10, guard: 0.2, special: "aimed", specialName: "Aimed shot" },
  javelin: { family: "javelin", hurt: "thrust", damage: 16, reach: 1.7, arc: 16, windup: 0.24, recover: 0.32, knock: 0.5, poise: 14, guard: 0.4, special: "aimed", specialName: "Aimed throw" },
  gun: { family: "gun", hurt: "thrust", damage: 19, reach: 1.9, arc: 16, windup: 0.26, recover: 0.36, knock: 0.7, poise: 18, guard: 0.45, twoHanded: true, special: "bayonet", specialName: "Bayonet charge" },
  "machine-gun": { family: "machine-gun", hurt: "crush", damage: 6, reach: 0.9, arc: 50, windup: 0.3, recover: 0.4, knock: 0.5, poise: 10, guard: 0.2, twoHanded: true, special: "burst", specialName: "Long burst" },
};

// The hunting table's reach and reload are in game seconds and animal hit
// points; a fight runs faster and people are tougher.
const loosed = (id: keyof typeof launchers, hurt: Hurt, speed: number, spread: number, extra: Partial<Shot> = {}): Shot => {
  const l = launchers[id];
  return { range: l.range * 1.3, speed, damage: (l.damage + l.perDraw) * 4, reload: l.reload * 0.3, spread, hurt, ...(l.perDraw ? { draw: 0.7 } : {}), ...extra };
};
const BOW = loosed("bow", "pierce", 15, 0.05, { lob: true });
const BOLT = loosed("crossbow", "pierce", 22, 0.03);
const MUSKET = loosed("musket", "ball", 34, 0.085, { smoke: true });
const RIFLE = loosed("rifle", "ball", 46, 0.03);
const PISTOL = loosed("pistol", "ball", 30, 0.09, { smoke: true });
const JAVELIN: Shot = { range: 7, speed: 12, damage: 34, reload: 1.1, spread: 0.07, hurt: "pierce", thrown: true };

const arm = (id: string, family: Family, name: string, note: string, tweak: Partial<Arm> = {}): Arm => ({ ...families[family], id, name, note, ...tweak });

export const arms: Record<string, Arm> = Object.fromEntries(
  [
    arm("fist", "fist", "Bare hands", "Most fights in most centuries were settled this way, and wrestling was a soldier's skill everywhere."),
    arm("dagger", "dagger", "Dagger", "The rondel and ballock daggers of medieval Europe finished armoured men through the gaps.", { art: "arms:dagger" }),
    arm("kris", "dagger", "Kris", "The wavy Javanese blade was a weapon, an heirloom and a mark of rank at once.", { art: "arms:kris", damage: 15, arc: 45 }),
    arm("cudgel", "club", "Cudgel", "A stout stick was the law's weapon and the robber's, cheap and legal to carry.", { art: "icon:cudgel", damage: 16, windup: 0.28, poise: 26 }),
    arm("mace", "club", "Mace", "A flanged iron head crushes what an edge cannot cut, which is why it outlived the sword against plate.", { art: "arms:mace", punch: 0.45 }),
    arm("star-mace", "club", "Star-headed mace", "Inca soldiers swung a stone or bronze star on a wooden haft; skulls from the conquest show the wounds.", { art: "arms:star-mace", punch: 0.3 }),
    arm("mere", "club", "Mere", "The Maori short club of greenstone is thrust edge-first at the temple or ribs, more like a blade than a bludgeon.", { art: "arms:mere", windup: 0.22, recover: 0.28, reach: 1, damage: 18 }),
    arm("macuahuitl", "axe", "Macuahuitl", "An oak board edged with obsidian blades: sharper than steel, and the edge shatters as it goes.", { art: "icon:macuahuitl", damage: 30, arc: 65, brittle: true, punch: 0, specialName: "Stunning flat" }),
    arm("war-axe", "axe", "War axe", "A one-handed axe hooks a shield rim down and bites through mail better than a sword.", { art: "arms:axe" }),
    arm("dane-axe", "greatsword", "Dane axe", "The long two-handed axe of the huscarls could, by the Bayeux Tapestry's account, fell a horse.", { art: "arms:dane-axe", punch: 0.3, guard: 0.45, damage: 34, windup: 0.46, special: "hook", specialName: "Hook the guard" }),
    arm("khopesh", "axe", "Khopesh", "The Egyptian sickle-sword grew out of the axe, and its hook could drag a shield aside.", { art: "arms:khopesh", damage: 21, windup: 0.26, recover: 0.34, guard: 0.55 }),
    arm("gladius", "sword", "Gladius", "The legion's short sword was for the stab from behind the shield, in a press too tight to swing.", { art: "arms:gladius", hurt: "thrust", reach: 1.1, arc: 30, windup: 0.16, recover: 0.22, special: "bash", specialName: "Shield bash" }),
    arm("sword", "sword", "Arming sword", "The knightly one-handed sword, worn with a shield and a symbol as much as a weapon.", { art: "arms:sword", special: "bash", specialName: "Shield bash" }),
    arm("rapier", "sword", "Rapier", "A civilian duelling sword: all point, long reach, and nearly useless against armour.", { art: "arms:rapier", hurt: "thrust", reach: 1.6, arc: 22, damage: 17, windup: 0.16, special: "lunge", specialName: "Lunge" }),
    arm("longsword", "greatsword", "Longsword", "Two hands on the hilt, or one on the blade to drive the point into a gap in plate.", { art: "arms:longsword", punch: 0.2, windup: 0.34, recover: 0.42, damage: 27 }),
    arm("zweihander", "greatsword", "Zweihänder", "The Landsknecht double-pay men carried it to break into a pike block.", { art: "arms:zweihander", reach: 2, damage: 33, windup: 0.46 }),
    arm("katana", "greatsword", "Katana", "A two-handed cutting sword. The draw and the cut can be one motion.", { art: "arms:katana", reach: 1.5, arc: 70, damage: 26, windup: 0.26, recover: 0.36, poise: 24, specialName: "Draw cut" }),
    arm("sabre", "sabre", "Sabre", "A curved cavalry blade: the horse's speed does the cutting.", { art: "arms:sabre" }),
    arm("talwar", "sabre", "Talwar", "The Indian sabre's disc pommel locks the wrist for a drawing cut.", { art: "arms:sabre", damage: 22, guard: 0.58 }),
    arm("spear", "spear", "Spear", "The commonest weapon in history: cheap, long, and deadly in a line.", { art: "icon:spear" }),
    arm("dory", "spear", "Dory", "The hoplite's eight-foot spear, used overarm above the shield wall.", { art: "icon:spear", reach: 2.3 }),
    arm("iklwa", "spear", "Iklwa", "Shaka's short stabbing spear, used underarm after the shield hooks the enemy's aside.", { art: "arms:iklwa", reach: 1.4, arc: 26, windup: 0.17, recover: 0.24, damage: 22, momentum: 0, special: "bash", specialName: "Shield hook" }),
    arm("yari", "spear", "Yari", "The straight Japanese spear replaced the bow as the samurai's main weapon in the wars of the 1500s.", { art: "icon:spear", reach: 2.4 }),
    arm("taiaha", "polearm", "Taiaha", "A Maori staff with a striking blade at one end and a stabbing tongue at the other, fought with constant feints.", { art: "arms:taiaha", hurt: "crush", damage: 20, reach: 1.9, windup: 0.24, recover: 0.3, poise: 26, punch: 0, special: "sweep", specialName: "Sweep" }),
    arm("pike", "pike", "Pike", "Fifteen feet of ash. Useless alone, and in a block it stopped every charge for two centuries.", { art: "arms:pike" }),
    arm("sarissa", "pike", "Sarissa", "The Macedonian pike was long enough for five ranks of points to reach past the front man.", { art: "arms:pike", reach: 3.6 }),
    arm("halberd", "polearm", "Halberd", "Axe, spike and hook on one pole: the Swiss used the hook to pull knights from the saddle.", { art: "icon:halberd" }),
    arm("glaive", "polearm", "Glaive", "A blade on a pole. The Chinese guandao and the European glaive are the same answer.", { art: "icon:glaive", damage: 26, arc: 60 }),
    arm("naginata", "polearm", "Naginata", "A curved blade on a long shaft, swept at a horse's legs.", { art: "icon:glaive", damage: 25, arc: 65, windup: 0.34 }),
    arm("poleaxe", "polearm", "Poleaxe", "The dismounted knight's weapon against other knights: hammer, spike and axe.", { art: "icon:halberd", hurt: "crush", punch: 0.5, reach: 1.9, damage: 30 }),
    arm("lance", "lance", "Lance", "Couched under the arm, it puts the whole weight of horse and rider behind one point.", { art: "arms:lance" }),
    arm("bow", "bow", "Bow", "A self bow of one piece of wood, the hunter's and the levy's.", { art: "icon:bow", shot: BOW }),
    arm("longbow", "bow", "Longbow", "A yew bow of a hundred pounds' draw or more. Archers' skeletons from the Mary Rose are bent by it.", { art: "icon:bow", shot: { ...BOW, range: 16, damage: 40, draw: 0.85, reload: 0.9 }, punch: 0.15 }),
    arm("composite-bow", "bow", "Composite bow", "Horn, wood and sinew glued in a short recurve: a longbow's power in a bow that fits on horseback.", { art: "icon:bow", shot: { ...BOW, range: 14, damage: 34, draw: 0.55, reload: 0.7 }, punch: 0.1 }),
    arm("yumi", "bow", "Yumi", "The Japanese bow is gripped a third of the way up so it can be shot from the saddle.", { art: "icon:bow", shot: { ...BOW, range: 14, damage: 36, draw: 0.7 }, punch: 0.1 }),
    arm("sling", "sling", "Sling", "A slung stone or lead bullet outranged many bows and could break bone under armour.", { art: "icon:sling", shot: { range: 11, speed: 17, damage: 24, reload: 0.9, draw: 0.6, spread: 0.07, hurt: "crush" } }),
    arm("pilum", "javelin", "Pilum", "A heavy javelin with a soft iron shank that bent in a shield and dragged it down.", { art: "icon:spear", shot: { ...JAVELIN, damage: 38 }, punch: 0.25 }),
    arm("assegai", "javelin", "Throwing spear", "The light throwing spear came before the stabbing one, and stayed in use beside it.", { art: "icon:spear", shot: JAVELIN }),
    arm("atlatl", "javelin", "Atlatl darts", "The spear-thrower is a lever that lengthens the arm. Spanish accounts say its darts went through mail.", { art: "icon:spear", shot: { ...JAVELIN, range: 10, speed: 16, damage: 36 }, punch: 0.2 }),
    arm("crossbow", "crossbow", "Crossbow", "Slow to span, but it needs weeks of training where the longbow needs years.", { art: "icon:crossbow", shot: BOLT, punch: 0.35 }),
    arm("arquebus", "gun", "Arquebus", "A matchlock: the slow-burning cord drops into the pan. One shot, then half a minute of loading.", { art: "icon:musket", shot: { ...MUSKET, range: 11, damage: 58 }, damage: 10, hurt: "crush", reach: 1.1, arc: 50, special: "aimed", specialName: "Aimed shot" }),
    arm("musket", "gun", "Musket and bayonet", "With the socket bayonet every musketeer was also a pikeman, and the pike disappeared.", { art: "icon:musket", shot: MUSKET }),
    arm("rifle", "gun", "Bolt-action rifle", "Ten aimed rounds a minute at half a mile. It made open ground impassable.", { art: "icon:rifle", shot: RIFLE }),
    arm("grenade", "javelin", "Hand grenades", "The Mills bomb and the stick grenade: thrown over the lip of a trench, where a rifle cannot reach.", { hurt: "crush", damage: 6, reach: 0.9, arc: 50, shot: { range: 8, speed: 9, damage: 62, reload: 1.3, spread: 0.05, hurt: "crush", thrown: true, lob: true, carried: 3, blast: 1.6 }, specialName: "Careful throw", art: "arms:grenade" }),
    arm("pistol", "gun", "Pistol", "A horseman's or an officer's last resort: one shot at arm's length.", { art: "icon:pistol", shot: PISTOL, damage: 9, hurt: "crush", reach: 1, arc: 50, twoHanded: false, special: "aimed", specialName: "Aimed shot" }),
    arm("machine-gun", "machine-gun", "Machine gun", "A water-cooled Maxim fired as fast as forty riflemen and did not get tired.", { art: "icon:rifle", shot: { ...RIFLE, reload: 1.1, burst: 6, spread: 0.11, range: 20 } }),
  ].map((a) => [a.id, a]),
);

/** The weapon a thing in the hand makes. Soldiers' arms are in the table. A
 * farm tool or a stick fights as what it most resembles, as hard as the
 * hunting table says it hits, so the two tables cannot disagree. */
export function armFor(id: string | undefined): Arm {
  if (!id) return arms.fist;
  if (arms[id]) return arms[id];
  if (id === "tool") return arms.dagger;
  const w = weaponOf(id);
  const family: Family = w.reach ? "spear" : w.damage >= 6 ? "axe" : "club";
  return { ...families[family], id, name: id.replace(/-/g, " "), note: "", damage: 6 + w.damage * 2.5, knock: Math.max(0.4, w.knock * 0.7) };
}

export const ARMOURS = ["none", "quilted", "mail", "lamellar", "plate"] as const;
export type Armour = (typeof ARMOURS)[number];
/** Share of each kind of harm that gets through, the footing it gives, and
 * what its weight does to wind and pace. */
export const armours: Record<Armour, { through: Record<Hurt, number>; poise: number; wind: number; pace: number; label: string }> = {
  none: { through: { cut: 1, thrust: 1, crush: 1, pierce: 1, ball: 1 }, poise: 30, wind: 1, pace: 1, label: "No armour" },
  quilted: { through: { cut: 0.7, thrust: 0.8, crush: 0.8, pierce: 0.7, ball: 0.95 }, poise: 36, wind: 0.95, pace: 0.98, label: "Quilted cloth" },
  mail: { through: { cut: 0.35, thrust: 0.65, crush: 0.85, pierce: 0.55, ball: 0.9 }, poise: 44, wind: 0.85, pace: 0.93, label: "Mail" },
  lamellar: { through: { cut: 0.45, thrust: 0.55, crush: 0.8, pierce: 0.45, ball: 0.9 }, poise: 44, wind: 0.85, pace: 0.93, label: "Lamellar" },
  plate: { through: { cut: 0.2, thrust: 0.4, crush: 0.7, pierce: 0.22, ball: 0.7 }, poise: 56, wind: 0.75, pace: 0.88, label: "Plate" },
};
export const armourOf = (worn?: string): Armour =>
  worn === "cuirass" ? "plate" : worn === "mail" || worn === "lamellar" || worn === "quilted" ? worn : "none";
/** Share of missiles a shield stops when it is between them and the body. */
export const shieldCover: Record<string, number> = { none: 0, round: 0.45, tall: 0.7 };
