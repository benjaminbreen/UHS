import {
  beltStyles,
  footwear,
  garments,
  headwear,
  leggings,
  type CharacterAppearance,
} from "../../core/character";
import type { ItemDef, ItemId } from "../../core/types";

/** Generic wearables, one per look the renderers already draw. Colours stay
 * the wearer's own; wardrobe kits will add specific garments on top. */
const label: Record<CharacterAppearance["wearing"]["garment"], string> = {
  none: "Nothing",
  tunic: "Tunic",
  "long-tunic": "Long tunic",
  skirt: "Skirt",
  robe: "Robe",
  dress: "Dress",
  shirt: "Shirt",
  coat: "Coat",
  wrap: "Wrapped cloth",
  "open-robe": "Open robe",
  poncho: "Poncho",
  loincloth: "Loincloth",
  gown: "Court gown",
  suit: "Pressure suit",
};
const sleeves: Partial<
  Record<
    CharacterAppearance["wearing"]["garment"],
    NonNullable<CharacterAppearance["wearing"]["sleeves"]>
  >
> = { tunic: "short", "long-tunic": "long", skirt: "short", dress: "long", shirt: "long",
  robe: "loose", "open-robe": "long", coat: "long", wrap: "none", poncho: "none", loincloth: "none", gown: "loose", suit: "long" };
const headLabel: Record<Exclude<(typeof headwear)[number], "none">, string> = {
  band: "Headband",
  cap: "Cap",
  hood: "Hood",
  wrap: "Head wrap",
  bowler: "Bowler hat",
  "top-hat": "Top hat",
  "flat-cap": "Flat cap",
  "ball-cap": "Peaked cap",
  brimmed: "Broad-brimmed hat",
  conical: "Conical hat",
  turban: "Turban",
  headscarf: "Headscarf",
  fez: "Fez",
  veil: "Veil",
  fillet: "Circlet",
  plume: "Plumed headdress",
  wig: "Powdered wig",
  helmet: "Helmet",
  visor: "Sealed helmet",
};
const legLabel: Record<Exclude<(typeof leggings)[number], "none">, string> = {
  hose: "Hose",
  trousers: "Trousers",
  wrapped: "Leg wrappings",
  sarong: "Sarong",
  wide: "Wide trousers",
};
const footLabel: Record<Exclude<(typeof footwear)[number], "none">, string> = {
  sandals: "Sandals",
  shoes: "Shoes",
  boots: "Boots",
  sneakers: "Sneakers",
};
const beltLabel: Record<
  Exclude<(typeof beltStyles)[number], "none">,
  string
> = {
  cord: "Cord belt",
  sash: "Sash",
  leather: "Leather belt",
  wide: "Wide belt",
};

const about: Record<ItemId, string> = {
  "garment-tunic":
    "A simple shirt-length garment pulled over the head and belted at the waist; worn by workers the world over.",
  "garment-long-tunic":
    "A tunic falling to the ankles, with long sleeves: the everyday dress of settled, respectable folk.",
  "garment-skirt":
    "Cloth wrapped or gathered at the waist and falling free, cool to work in and easy to mend.",
  "garment-robe":
    "A loose, full-length garment with wide sleeves, worn for dignity as much as for warmth.",
  "garment-dress":
    "A fitted body and a full skirt in one piece, sewn to measure and kept for years.",
  "garment-shirt":
    "Buttoned or laced at the neck with long sleeves; worn next to the skin or under a coat.",
  "garment-coat":
    "A heavy, long-sleeved outer garment, cut close and fastened down the front against the cold.",
  "garment-wrap":
    "A single length of cloth wound and tucked about the body, with no seam to sew.",
  "garment-open-robe":
    "A long robe worn open down the front over other clothes, its edges falling loose.",
  "garment-poncho":
    "A blanket with a slit for the head; it sheds rain and doubles as bedding.",
  "garment-loincloth":
    "A strip of cloth passed between the legs and tied at the hips; enough in the heat.",
  "garment-gown":
    "A stiff, costly gown for court and ceremony, cut to be seen rather than worked in.",
  "garment-suit":
    "A sealed suit that holds air and warmth around the body where there is none outside.",
  "leggings-hose":
    "Close-fitting cloth stockings drawn up the legs and tied to the belt or doublet.",
  "leggings-trousers":
    "Two legs sewn to a seat; worn by riders, herders and, in time, nearly everyone.",
  "leggings-wrapped":
    "Strips of cloth wound round the calves from ankle to knee, against thorns and cold.",
  "leggings-sarong":
    "A tube of cloth stepped into and knotted at the waist, cool and endlessly retied.",
  "leggings-wide":
    "Loose, full trousers gathered at the waist, comfortable for squatting, riding and heat.",
  "footwear-sandals":
    "A sole bound to the foot with thongs; cheap, cool and quick to wear out.",
  "footwear-shoes":
    "Leather stitched to cover the whole foot; made by a cobbler and resoled more than once.",
  "footwear-boots":
    "Leather rising above the ankle, for mud, snow, stirrups and long roads.",
  "footwear-sneakers":
    "Canvas or leather uppers on a rubber sole, light and quiet underfoot.",
  "headwear-band":
    "A strip of cloth or leather tied round the brow to keep hair and sweat from the eyes.",
  "headwear-cap":
    "A small close-fitting cap of felt, wool or linen, worn indoors and out.",
  "headwear-hood":
    "A cloth hood pulled over the head and shoulders against wind and rain.",
  "headwear-wrap":
    "A length of cloth wound about the head, against sun, dust or custom.",
  "headwear-bowler":
    "A hard, round felt hat with a narrow brim, the mark of clerks and tradesmen.",
  "headwear-flat-cap":
    "A soft, peaked cloth cap worn by working men in town and country alike.",
  "headwear-ball-cap": "A soft crown with a stiff peak to shade the eyes.",
  "headwear-brimmed":
    "A hat of straw or felt with a wide brim, for long days under the sun.",
  "headwear-conical":
    "A cone of woven straw, bamboo or palm leaf, shading the head and shoulders in sun and rain.",
  "headwear-turban":
    "A long cloth wound about the head in careful folds; its style says where the wearer is from.",
  "headwear-headscarf":
    "A square of cloth folded and tied over the hair, for modesty, dust or warmth.",
  "headwear-fez":
    "A brimless, flat-topped cap of red felt, often with a tassel.",
  "headwear-veil":
    "Fine cloth draped over the head and face, worn for modesty, mourning or ceremony.",
  "headwear-fillet":
    "A thin band of metal worn round the brow, a mark of rank or office.",
  "headwear-plume":
    "Feathers bound into a crest, worn for ceremony, war or display.",
  "headwear-wig":
    "Curled false hair dusted white with starch powder, the height of genteel fashion.",
  "headwear-helmet":
    "A shell of hardened leather or metal that turns a blow meant for the skull.",
  "headwear-visor":
    "A closed helmet with a clear visor, sealed to the suit beneath it.",
  "headwear-top-hat":
    "A tall, flat-crowned silk hat, worn by gentlemen who wish to be seen as such.",
  "belt-cord":
    "A twisted cord tied round the waist to gather a garment and hang a pouch.",
  "belt-sash":
    "A broad band of cloth wound about the waist, often in a bright colour.",
  "belt-leather":
    "A leather strap with a buckle, to cinch a garment and carry a knife or purse.",
  "belt-wide":
    "A deep belt of leather or cloth that supports the back through heavy work.",
  "cloak":
    "A heavy cloth thrown over the shoulders and pinned; a coat by day, a blanket by night.",
  "mantle":
    "A loose cloth draped over the shoulders and arms, worn over other clothes out of doors.",
  "shoulder-cloth":
    "A folded cloth laid over one shoulder, for sweat, shade, carrying or show.",
  "necklace":
    "Beads, shells or stones strung to hang at the throat, as ornament, charm or wealth.",
  "chain":
    "Linked metal worn round the neck: jewellery, a badge of office, or savings worn close.",
  "glasses":
    "Ground lenses in a frame, perched on the nose to bring blurred things into focus.",
  "sunglasses": "Darkened lenses that cut the glare of the sun.",
  "earrings": "Small ornaments of metal, bone or stone worn through the ears.",
};

export const wearableItems: Record<ItemId, ItemDef> = Object.fromEntries(([
  ...garments
    .filter((g): g is Exclude<typeof g, "none"> => g !== "none")
    .map((garment) => [
    `garment-${garment}`,
    {
      id: `garment-${garment}`,
      name: label[garment],
      sprite: "wool",
      value: 3,
      wear: {
        slot: "body",
        look: {
          garment,
          ...(sleeves[garment] && { sleeves: sleeves[garment] }),
        },
      },
    },
  ]),
  ...leggings
    .filter((l): l is Exclude<typeof l, "none"> => l !== "none")
    .map((l) => [
      `leggings-${l}`,
      {
        id: `leggings-${l}`,
        name: legLabel[l],
        sprite: "wool",
        value: 2,
        wear: { slot: "legs", look: { leggings: l } },
      },
    ]),
  ...footwear
    .filter((f): f is Exclude<typeof f, "none"> => f !== "none")
    .map((f) => [
      `footwear-${f}`,
      {
        id: `footwear-${f}`,
        name: footLabel[f],
        sprite: "wool",
        value: f === "boots" ? 5 : 3,
        wear: { slot: "feet", look: { footwear: f } },
      },
    ]),
  ...headwear
    .filter((h): h is Exclude<typeof h, "none"> => h !== "none")
    .map((h) => [
      `headwear-${h}`,
      {
        id: `headwear-${h}`,
        name: headLabel[h],
        sprite: "flax",
        value: 1,
        wear: { slot: "head", look: { headwear: h } },
      },
    ]),
  ...beltStyles
    .filter((b): b is Exclude<typeof b, "none"> => b !== "none")
    .map((b) => [
      `belt-${b}`,
      {
        id: `belt-${b}`,
        name: beltLabel[b],
        sprite: "wool",
        value: 1,
        wear: { slot: "belt", look: { belt: b } },
      },
    ]),
  [
    "cloak",
    {
      id: "cloak",
      name: "Cloak",
      sprite: "wool",
      value: 4,
      wear: { slot: "over", look: { cloak: true } },
    },
  ],
  ["mantle", { id: "mantle", name: "Mantle", sprite: "wool", value: 3,
    wear: { slot: "over", look: { mantle: true } } }],
  [
    "shoulder-cloth",
    {
      id: "shoulder-cloth",
      name: "Shoulder cloth",
      sprite: "wool",
      value: 2,
      wear: { slot: "over", look: { shoulderCloth: true } },
    },
  ],
  [
    "necklace",
    {
      id: "necklace",
      name: "Necklace",
      sprite: "coin",
      value: 5,
      wear: { slot: "neck", look: { necklace: true } },
    },
  ],
  [
    "chain",
    {
      id: "chain",
      name: "Chain",
      sprite: "coin",
      value: 6,
      wear: { slot: "neck", look: { necklace: true, neckStyle: "chain" } },
    },
  ],
  [
    "glasses",
    {
      id: "glasses",
      name: "Glasses",
      sprite: "coin",
      value: 4,
      wear: { slot: "eyes", look: { eyewear: "glasses" } },
    },
  ],
  [
    "sunglasses",
    {
      id: "sunglasses",
      name: "Sunglasses",
      sprite: "coin",
      value: 3,
      wear: { slot: "eyes", look: { eyewear: "sunglasses" } },
    },
  ],
  [
    "earrings",
    {
      id: "earrings",
      name: "Earrings",
      sprite: "coin",
      value: 4,
      wear: { slot: "ears", look: { earrings: true } },
    },
  ],
] as [ItemId, ItemDef][]).map(([id, d]) => [id, { ...d, description: about[id] }]));
