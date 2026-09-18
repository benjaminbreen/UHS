/**
 * What a garment is made of, what coloured it, and how well it was made.
 * Dyes are listed once and referenced by id from the regional kits, because
 * the same plant is used in a dozen places and only its availability differs.
 */
export const materials = [
  "hide",
  "fur",
  "barkcloth",
  "felt",
  "wool",
  "linen",
  "hemp",
  "jute",
  "cotton",
  "ramie",
  "silk",
  "synthetic",
] as const;
export type Material = (typeof materials)[number];

/** Internal tiers. `common` is unremarkable and carries no adjective. */
export const rarities = ["common", "distinctive", "rare", "unique"] as const;
export type Rarity = (typeof rarities)[number];
/** How the name is coloured where it is shown. */
export const rarityColors: Record<Rarity, string> = {
  common: "#b9bfc9",
  distinctive: "#74b481",
  rare: "#5f93d8",
  unique: "#b98ad6",
};
export const rarityLabels: Record<Rarity, string> = {
  common: "Ordinary",
  distinctive: "Distinctive",
  rare: "Rare",
  unique: "Unique",
};
/** Fine work, by tier. Chosen by a seeded roll, so one weaver's output reads
 * consistently rather than as a random adjective each time. */
export const fineWords: Record<Exclude<Rarity, "common">, readonly string[]> = {
  distinctive: ["well-made", "closely woven", "evenly spun", "neatly dyed"],
  rare: ["finely spun", "richly dyed", "supple", "fine-woven"],
  unique: ["exquisite", "masterwoven", "sumptuous", "peerless"],
};
/** A skin is cured, not spun: "closely woven fur" is nobody's garment. */
export const fineSkins: Record<Exclude<Rarity, "common">, readonly string[]> = {
  distinctive: ["well-cured", "soft-tanned", "thick", "neatly stitched"],
  rare: ["supple", "deep-furred", "finely cured", "unmarked"],
  unique: ["flawless", "princely", "sumptuous", "peerless"],
};
export const wornSkins = [
  "stiff",
  "cracked",
  "patched",
  "bald in places",
  "scarred",
  "ragged",
] as const;
/** Poor condition is a flaw, not a rarity: it never colours the name. */
export const wornWords = [
  "rough",
  "rough-spun",
  "patched",
  "worn thin",
  "frayed",
  "ragged",
  "torn",
] as const;

export type Dye = {
  name: string;
  hex: string;
  /** What it cost to get this colour onto cloth. */
  tier: Rarity;
};
/** Referenced by id from the kits. Names are the colour as a person would say
 * it, not the plant, except where the plant is the name. */
export const dyes = {
  undyed: { name: "undyed", hex: "#ded0b0", tier: "common" },
  bleached: { name: "bleached", hex: "#efe9d8", tier: "distinctive" },
  greige: { name: "greige", hex: "#c9bda2", tier: "common" },
  ochre: { name: "ochre", hex: "#b89343", tier: "common" },
  umber: { name: "umber", hex: "#59483d", tier: "common" },
  russet: { name: "russet", hex: "#ab5a36", tier: "common" },
  clay: { name: "clay-red", hex: "#bd7f5c", tier: "common" },
  soot: { name: "soot-black", hex: "#3a3733", tier: "common" },
  ash: { name: "ash-grey", hex: "#b4b6a4", tier: "common" },
  bark: { name: "bark-brown", hex: "#6b5334", tier: "common" },
  walnut: { name: "walnut", hex: "#4a382a", tier: "common" },
  madder: { name: "madder-red", hex: "#a83b34", tier: "distinctive" },
  weld: { name: "weld-yellow", hex: "#d3bb45", tier: "distinctive" },
  woad: { name: "woad-blue", hex: "#4a6c8c", tier: "distinctive" },
  turmeric: { name: "turmeric", hex: "#d9a53a", tier: "distinctive" },
  onion: { name: "onion-gold", hex: "#c58a3d", tier: "common" },
  pomegranate: { name: "pomegranate", hex: "#8a6a3a", tier: "distinctive" },
  henna: { name: "henna", hex: "#9c5535", tier: "distinctive" },
  sappan: { name: "sappan-red", hex: "#a04a45", tier: "distinctive" },
  morinda: { name: "morinda-red", hex: "#9a4436", tier: "distinctive" },
  safflower: { name: "safflower", hex: "#d4674f", tier: "distinctive" },
  indigo: { name: "indigo", hex: "#33507e", tier: "rare" },
  logwood: { name: "logwood-purple", hex: "#4a3b5c", tier: "rare" },
  lac: { name: "lac-crimson", hex: "#8e2f3f", tier: "rare" },
  kermes: { name: "kermes-scarlet", hex: "#9c2b33", tier: "rare" },
  cochineal: { name: "cochineal", hex: "#a02b40", tier: "rare" },
  saffron: { name: "saffron", hex: "#e0a32a", tier: "rare" },
  tyrian: { name: "Tyrian purple", hex: "#6b3b6e", tier: "unique" },
  vermilion: { name: "vermilion", hex: "#c34a2c", tier: "unique" },
  goldthread: { name: "gold-shot", hex: "#c8a24a", tier: "unique" },
  // The Americas. Cochineal, indigo and relbunium were local and abundant
  // here, so brilliant colour was ordinary cloth rather than a luxury — the
  // opposite of the European case, and the reason these rows should be vivid.
  mayablue: { name: "Maya blue", hex: "#2e83bd", tier: "distinctive" },
  achiote: { name: "achiote", hex: "#d4652c", tier: "common" },
  relbunium: { name: "chapi red", hex: "#b4323c", tier: "common" },
  qolle: { name: "q'olle yellow", hex: "#e8c33c", tier: "common" },
  chilca: { name: "chilca green", hex: "#5f9048", tier: "distinctive" },
  purpura: { name: "shellfish purple", hex: "#7d4a84", tier: "unique" },
  aniline: { name: "aniline mauve", hex: "#8a6aa8", tier: "distinctive" },
  vat: { name: "vat blue", hex: "#3a5a9a", tier: "common" },
  chrome: { name: "chrome green", hex: "#3f7a52", tier: "common" },
  white: { name: "bright white", hex: "#f2f2ee", tier: "common" },
} as const satisfies Record<string, Dye>;
export type DyeId = keyof typeof dyes;

/**
 * One garment as an item id: the base id, then material, dye and quality.
 * Encoded in the id itself so the inventory stays a plain count of ids and
 * nothing else in the save format has to change.
 *
 * `quality` is -1 for worn, 0 for ordinary, 1..3 for the fine tiers.
 */
export type Cloth = { material: Material; dye: DyeId; quality: number };
const SEP = "~";
export function clothId(base: string, c: Cloth) {
  return c.material === "cotton" && c.dye === "undyed" && !c.quality
    ? base
    : `${base}${SEP}${c.material}.${c.dye}.${c.quality}`;
}
export function parseCloth(
  id: string,
): { base: string; cloth: Cloth } | undefined {
  const i = id.indexOf(SEP);
  if (i < 0) return undefined;
  const [material, dye, quality] = id.slice(i + 1).split(".");
  if (!materials.includes(material as Material) || !(dye in dyes))
    return undefined;
  return {
    base: id.slice(0, i),
    cloth: {
      material: material as Material,
      dye: dye as DyeId,
      quality: Number(quality) || 0,
    },
  };
}
export function rarityOf(c: Cloth): Rarity {
  return c.quality >= 3
    ? "unique"
    : c.quality === 2
      ? "rare"
      : c.quality === 1
        ? "distinctive"
        : "common";
}
/** "finely spun indigo silk robe", "ragged undyed hemp loincloth". */
export function clothName(base: string, c: Cloth, seed: string) {
  const pick = (list: readonly string[]) =>
    list[Math.abs(hash(seed)) % list.length];
  const rarity = rarityOf(c);
  const skin = c.material === "hide" || c.material === "fur";
  const adjective =
    c.quality < 0
      ? pick(skin ? wornSkins : wornWords)
      : rarity === "common"
        ? undefined
        : pick((skin ? fineSkins : fineWords)[rarity]);
  const words = [adjective, dyes[c.dye].name, c.material, base.toLowerCase()];
  const out = words.filter(Boolean).join(" ");
  return out.charAt(0).toUpperCase() + out.slice(1);
}
/** What the cloth does to a garment's price: the dye, the fibre and the work.
 * Silk dyed with kermes is not the same object as undyed hemp. */
export function clothWorth(c: Cloth) {
  const fibre = { silk: 4, cotton: 1.4, ramie: 1.2, linen: 1.2, wool: 1 }[
    c.material as "silk"
  ];
  const dye = { common: 1, distinctive: 1.5, rare: 2.5, unique: 5 }[
    dyes[c.dye].tier
  ];
  const work = [0.5, 1, 1.6, 2.6, 4][Math.max(0, c.quality) + (c.quality < 0 ? 0 : 1)];
  return (fibre ?? 0.9) * dye * (work ?? 1);
}
function hash(s: string) {
  let n = 7;
  for (const ch of s) n = (Math.imul(n, 31) + ch.charCodeAt(0)) | 0;
  return n;
}
