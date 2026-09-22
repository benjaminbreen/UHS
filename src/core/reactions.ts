/** What a swing, or a thrown thing landing, finds in a cell — and what that
 * ought to look and sound like. The engine classifies; the renderer owns the
 * colours and the noise. */
export type HitClass =
  | "rock"
  | "tree"
  | "trunk"
  | "brush"
  | "grass"
  | "crop"
  | "water"
  | "sand"
  | "soil"
  | "marsh"
  | "snow"
  | "stone"
  | "timber"
  | "pottery"
  | "fiber"
  | "metal"
  | "fire"
  | "creature"
  | "air";
export type ToolClass = "blade" | "blunt" | "haft" | "bare" | "thrown";
export type ReactionKind =
  | "shatter"
  | "crack"
  | "topple"
  | "thwock"
  | "thud"
  | "knock"
  | "swish"
  | "splash"
  | "scuff"
  | "ember"
  | "flinch"
  | "whoosh";
export type Hit = {
  at: { x: number; y: number };
  hit: HitClass;
  kind: ReactionKind;
  /** A hit that stops the arc: it earns the freeze, the shake and the sound. */
  solid: boolean;
  /** The prop or plant sprite struck, so the renderer can tint from it. */
  sprite?: string;
  /** Set when this blow actually changed the world. */
  damaged?: boolean;
  /** The struck prop, so the renderer can flash its sprite. */
  id?: string;
  /** What the blow knocked loose, already in the player's pack. */
  loot?: { item: string; n: number }[];
};
const SOLID: ReactionKind[] = [
  "shatter",
  "crack",
  "topple",
  "thwock",
  "thud",
  "knock",
];
export const isSolid = (kind: ReactionKind) => SOLID.includes(kind);
/** Everything answers to a blow. Where a pair is not listed the class's own
 * default stands, so a new prop or terrain is never silent. */
const DEFAULTS: Record<HitClass, ReactionKind> = {
  rock: "thwock",
  stone: "thwock",
  metal: "thwock",
  tree: "thud",
  trunk: "thud",
  timber: "knock",
  brush: "swish",
  grass: "swish",
  crop: "swish",
  fiber: "swish",
  pottery: "crack",
  water: "splash",
  sand: "scuff",
  soil: "scuff",
  marsh: "splash",
  snow: "scuff",
  fire: "ember",
  creature: "flinch",
  air: "whoosh",
};
export function reactionFor(hit: HitClass, tool: ToolClass): ReactionKind {
  // A thrown thing lands rather than bites: pottery bursts on anything hard,
  // and nothing it hits is cut.
  if (tool === "thrown")
    return hit === "water" || hit === "marsh"
      ? "splash"
      : hit === "sand" || hit === "soil" || hit === "snow"
        ? "scuff"
        : "shatter";
  // Bare hands sting on stone and do not cut brush.
  if (tool === "bare" && (hit === "rock" || hit === "stone" || hit === "metal"))
    return "thwock";
  if (tool === "blade" && (hit === "brush" || hit === "grass" || hit === "crop"))
    return "swish";
  if (tool === "blunt" && hit === "pottery") return "shatter";
  return DEFAULTS[hit];
}
/** The class of tool the held prop counts as. A tool's own work (chopping a
 * tree, digging) is resolved elsewhere; this is what its swing feels like. */
export function toolClass(
  tool: string | undefined,
  strike: boolean | undefined,
  edge = false,
): ToolClass {
  if (tool === "axe" || tool === "scythe") return "blade";
  if (tool === "pick") return "blunt";
  if (tool === "spade") return "blunt";
  if (edge) return "blade";
  return strike ? "haft" : "bare";
}
/** How many blows this surface takes before it gives, where it gives at all. */
export function toughness(hit: HitClass): number | undefined {
  return { pottery: 1, fiber: 2, timber: 3, metal: 4 }[
    hit as "pottery" | "fiber" | "timber" | "metal"
  ];
}
