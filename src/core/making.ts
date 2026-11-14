import type { ItemDef, ItemId } from "./types";

/** The shapes a made thing can take. Each is a voxel model with two open
 * slots (scripts/art/voxel_items.py FORMS), coloured by what went into it. */
export const forms = ["figure", "bundle", "vessel", "blade", "pole", "raft", "cord", "mat", "cake", "box", "frame", "mask"] as const;
export type Form = (typeof forms)[number];

/** What each shape covers, for the model choosing one. */
export const formHints: Record<Form, string> = {
  figure: "a doll, idol, totem, effigy or scarecrow",
  bundle: "things tied or wrapped together; use when no other shape fits",
  vessel: "a bowl, pot, cup or basket that holds things",
  blade: "a knife, point, scraper or other edge on a handle",
  pole: "a head on a shaft: club, torch, mop, mallet, brush",
  raft: "logs or bundles lashed flat to float",
  cord: "rope, string, a braid or a coil of anything twisted",
  mat: "a woven or stitched sheet: mat, net, banner, cloth",
  cake: "a lump, loaf, paste, dough or mixture",
  box: "a chest, case, crate or cage",
  frame: "a rack, stand, trestle or scaffold",
  mask: "a mask or a face",
};

export type Making = {
  name: string;
  description: string;
  form: Form | "nothing";
  /** Which of the two things makes up most of it. */
  body: 0 | 1;
  difficulty: number;
  minutes: number;
  /** What the player is left holding if their hands fail. */
  flop: Flop;
};
export type Flop = { name: string; description: string; form: Form };

const flops: Record<Form, string> = {
  figure: "Thing with one arm",
  bundle: "Loose tangle",
  vessel: "Bowl that leaks",
  blade: "Blunt wedge",
  pole: "Stick with a loose head",
  raft: "Half a raft",
  cord: "Knot of knots",
  mat: "Mat with a hole in it",
  cake: "Grey lump",
  box: "Box with no bottom",
  frame: "Rack that leans",
  mask: "Face nobody asked for",
};

const words: [RegExp, Form, string][] = [
  [/raft|float/, "raft", "raft"],
  [/doll|man\b|woman|figure|idol|totem|effigy|puppet|scarecrow/, "figure", "figure"],
  [/mask|face/, "mask", "mask"],
  [/knife|blade|spear|point|sharpen|scraper|axe/, "blade", "blade"],
  [/club|torch|mop|hammer|mallet|staff|brush|broom/, "pole", "club"],
  [/rope|cord|string|twist|braid|plait/, "cord", "cord"],
  [/weav|net\b|mat\b|stitch|sew|banner/, "mat", "mat"],
  [/bowl|pot\b|cup|basket|jar|vessel/, "vessel", "bowl"],
  [/box|chest|crate|cage/, "box", "box"],
  [/rack|stand|frame|trestle|ladder/, "frame", "rack"],
  [/mix|knead|mash|grind|paste|dough|cake|loaf|bake|cook/, "cake", "cake"],
];

/** A plain answer from the player's own words, for when no model can be asked. */
export function guessMaking(a: ItemDef, b: ItemDef, text: string): Making {
  const [, form, noun] = words.find(([re]) => re.test(text.toLowerCase())) ?? [null, "bundle" as Form, "bundle"];
  const name = `${a.name} ${noun}`;
  return {
    name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
    description: `${a.name} and ${b.name.toLowerCase()}, put together by hand.`,
    form,
    body: 0,
    difficulty: 2,
    minutes: 20,
    flop: { name: flops[form], description: `It was meant to be a ${noun}. It is not one.`, form },
  };
}

/** How somebody takes a thing the giver made: regard on top of any gift's,
 * and what they do with it. */
export function giftOf(def: ItemDef, name: string, age = 30) {
  const made = def.made!;
  if (made.flop) return { regard: -1, line: `${name} looks at it, then at you, and takes it to be polite.` };
  if (age < 13 && (made.form === "figure" || made.form === "mask"))
    return { regard: 2, line: `${name} holds it up, gives it a name, and will not put it down.` };
  if (def.name.startsWith("Fine ")) return { regard: 2, line: `${name} turns it over twice. "You made this?"` };
  if (def.name.startsWith("Crude ")) return { regard: 0, line: `${name} takes it and thanks you, a little carefully.` };
  return { regard: 1, line: `${name} looks it over and nods. It is well made.` };
}

/** What a made thing can do follows from its shape and what went into it,
 * never from what it was called. */
export function madeTraits(form: Form, a: ItemDef, b: ItemDef): Partial<ItemDef> {
  return {
    ...(a.flammable || b.flammable ? { flammable: true } : {}),
    ...(form === "raft" ? { floats: true } : {}),
    ...(form === "blade" ? { hand: { strike: true, edge: true } } : {}),
    ...(form === "pole" ? { hand: { strike: true } } : {}),
    ...(form === "cake" && a.edible && b.edible ? { edible: Math.min(30, a.edible + b.edible) } : {}),
  };
}

/** `flop` marks a failed attempt: it has the shape but does none of the work. */
export type Made = { form: Form; body: ItemId; trim: ItemId; flop?: true };
