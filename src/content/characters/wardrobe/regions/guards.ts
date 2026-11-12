import type { Accessory, GarmentKit, Option } from "../types";

/**
 * Guards, watchmen and warriors: what they wore on the body and head and what
 * they carried. Everything is keyed on the `guard` role tag, so these kits
 * dress only people who stand watch or fight and fall through for everyone
 * else. Priority 3 puts them over the generic soldier kit, which knows only
 * coats, helmets and boots.
 *
 * The broad strokes are well attested (bronze cuirass and round shield in the
 * Greek world, mail and the kite shield in the eleventh century, halberd and
 * morion at the Renaissance gate, lacquered lamellar in Japan, quilted cotton
 * in Mesoamerica and the Sahel). Weights within a kit are art direction.
 */

const IRON = "#767d84",
  BRONZE = "#b08848",
  LACQUER = "#7a2e24",
  HIDE = "#a07850",
  OXHIDE = "#e6dccb",
  WOOD = "#8a6440",
  PAINTED = "#a8362c";

const g = <T>(value: T, weight = 1, extra: Partial<Option<T>> = {}): Option<T> => ({ value, weight, roles: ["guard"], ...extra });
type Kit = Omit<GarmentKit, "id" | "label" | "scope" | "priority">;
const kit = (id: string, label: string, scope: GarmentKit["scope"], parts: Kit): GarmentKit => ({
  id: `guard-${id}`, label, scope, priority: 3, ...parts,
});
const arms = (...xs: [Accessory, number][]) => xs.map(([v, w]) => g(v, w));
// Standing armies and irregulars after 1870 are keyed on the work, not the role
// text, so an askari or a jawan is dressed as one without a word list.
const on = (livelihood: string) => <T>(value: T, weight = 1): Option<T> => ({ value, weight, livelihoods: [livelihood], ages: ["youth", "adult"] });
const u = on("soldier"), q = on("guerrilla");
const uniform = (id: string, label: string, scope: GarmentKit["scope"], parts: Kit): GarmentKit => ({
  id: `uniform-${id}`, label, scope, priority: 4, ...parts,
});
const TAIWAN = [119.3, 21.8, 122.1, 25.4] as const, HONG_KONG = [113.8, 22.15, 114.45, 22.6] as const;
const TURKEY = [26, 36.5, 41.6, 42.2] as const, TURKEY_NE = [41.6, 36, 43.5, 41.1] as const;
const bare = { footwear: [g("none" as const)] };
const sandals = { footwear: [g("sandals" as const)] };

export const guards: readonly GarmentKit[] = [
  kit("greek", "Hoplite and phalanx: bronze, the round shield, the spear", { years: [-1500, -100], cultures: ["european"] }, {
    garment: [g("tunic")], ...sandals,
    headwear: [g("helmet", 6), g("none", 1)],
    armour: [g("cuirass", 3), g("quilted", 3)], armourColor: [g(BRONZE)],
    shield: [g("round")], shieldColor: [g(BRONZE, 2), g(PAINTED, 1)], shieldMark: [g("none", 2), g("lambda", 1)],
    accessory: arms(["spear", 1]),
  }),
  kit("roman", "Legion and city cohort: mail and the long shield", { years: [-100, 400], cultures: ["european"] }, {
    garment: [g("tunic")], ...sandals,
    headwear: [g("helmet")],
    armour: [g("mail", 5), g("cuirass", 2)], armourColor: [g(IRON)],
    shield: [g("tall")], shieldColor: [g(PAINTED)], shieldMark: [g("rim")],
    accessory: arms(["spear", 1]),
  }),
  kit("early-medieval", "The war band: nasal helm, round shield, spear", { years: [400, 1050], cultures: ["european"] }, {
    garment: [g("tunic")],
    headwear: [g("nasal", 4), g("helmet", 1), g("none", 2)],
    armour: [g("mail", 3), g("quilted", 4)], armourColor: [g(IRON)],
    shield: [g("round")], shieldColor: [g(PAINTED, 2), g(WOOD, 2)], shieldMark: [g("none", 2), g("bands", 1)],
    accessory: arms(["spear", 1]),
  }),
  kit("high-medieval", "Mail and the kite shield", { years: [1050, 1250], cultures: ["european"] }, {
    garment: [g("long-tunic")],
    headwear: [g("nasal", 5), g("kettle", 1)],
    armour: [g("mail", 6), g("quilted", 2)], armourColor: [g(IRON)],
    shield: [g("tall", 5), g("round", 1)], shieldColor: [g(PAINTED, 2), g(WOOD, 1)], shieldMark: [g("chevron", 2), g("cross", 1), g("none", 2)],
    accessory: arms(["spear", 3], ["crossbow", 1]),
  }),
  kit("late-medieval", "The town watch: kettle hat, gambeson, bill or spear", { years: [1250, 1450], cultures: ["european"] }, {
    garment: [g("tunic")],
    headwear: [g("kettle", 5), g("nasal", 1), g("helmet", 2)],
    armour: [g("mail", 4), g("quilted", 3), g("cuirass", 1)], armourColor: [g(IRON)],
    shield: [g("none", 3), g("round", 2), g("tall", 1)], shieldColor: [g(PAINTED), g(WOOD)], shieldMark: [g("chevron", 1), g("none", 2)],
    accessory: arms(["spear", 4], ["halberd", 2], ["crossbow", 2]),
  }),
  // The longbow, not the crossbow, armed the English and Welsh levy.
  kit("english-longbow", "English and Welsh archers: the longbow", { years: [1250, 1550], cultures: ["european"], bounds: [-5.8, 49.9, 1.8, 55.8] }, {
    accessory: arms(["bow", 5], ["spear", 2], ["halberd", 1]),
  }),
  kit("pike-and-shot", "Halberdier and arquebusier: morion and breastplate", { years: [1450, 1650], cultures: ["european"] }, {
    garment: [g("coat", 2), g("tunic", 1)],
    headwear: [g("kettle", 6), g("helmet", 1)],
    armour: [g("cuirass", 5), g("quilted", 2), g("none", 2)], armourColor: [g(IRON)],
    shield: [g("none")],
    accessory: arms(["halberd", 5], ["spear", 2], ["musket", 2]),
  }),
  kit("musket", "Coat and musket at the gate", { years: [1650, 1870], cultures: ["european"] }, {
    garment: [g("coat")],
    headwear: [g("cap", 3), g("brimmed", 3)],
    armour: [g("none")], shield: [g("none")],
    accessory: arms(["musket", 6], ["halberd", 1]),
  }),

  kit("wa-ancient", "Assyria to Achaemenid: pointed helmet and scale", { years: [-2000, -550], cultures: ["north-african-west-asian"] }, {
    garment: [g("tunic", 2), g("long-tunic", 1)], ...sandals,
    headwear: [g("nasal", 5), g("helmet", 1)],
    armour: [g("lamellar", 5), g("quilted", 2)], armourColor: [g(BRONZE)],
    shield: [g("tall", 3), g("round", 3)], shieldColor: [g(WOOD), g(BRONZE)],
    accessory: arms(["spear", 4], ["bow", 1]),
  }),
  kit("wa-classical", "Persian, Parthian, Byzantine: scale and quilt", { years: [-550, 650], cultures: ["north-african-west-asian"] }, {
    garment: [g("tunic", 2), g("long-tunic", 2)],
    headwear: [g("helmet", 2), g("nasal", 2), g("wrap", 2)],
    armour: [g("lamellar", 3), g("quilted", 3), g("mail", 2)], armourColor: [g(IRON)],
    shield: [g("round", 4), g("tall", 2)], shieldColor: [g(PAINTED), g(WOOD)],
    accessory: arms(["spear", 4], ["bow", 1]),
  }),
  kit("wa-islamic", "Caliphate to Mamluk: the conical helm, mail, the round shield", { years: [650, 1450], cultures: ["north-african-west-asian"] }, {
    garment: [g("long-tunic", 2), g("robe", 1)],
    headwear: [g("nasal", 5), g("turban", 2)],
    armour: [g("mail", 6), g("quilted", 2)], armourColor: [g(IRON)],
    shield: [g("round")], shieldColor: [g(WOOD), g(HIDE), g(IRON)],
    accessory: arms(["spear", 5], ["bow", 1]),
  }),
  kit("wa-gunpowder", "Janissary and gate guard: börk, turban, musket", { years: [1450, 1870], cultures: ["north-african-west-asian"] }, {
    garment: [g("open-robe", 2), g("long-tunic", 2)],
    headwear: [g("turban", 3), g("cap", 3), g("nasal", 1)],
    armour: [g("mail", 2), g("none", 4)], armourColor: [g(IRON)],
    shield: [g("none", 4), g("round", 1)], shieldColor: [g(WOOD)],
    accessory: arms(["musket", 3], ["spear", 3], ["halberd", 1]),
  }),

  kit("steppe", "Steppe and Silk Road: lamellar, the bow, the lance", { years: [-1000, 1700], cultures: ["inner-eurasian"] }, {
    garment: [g("open-robe", 2), g("long-tunic", 1)], footwear: [g("boots")],
    headwear: [g("nasal", 5), g("cap", 2)],
    armour: [g("lamellar", 5), g("quilted", 2)], armourColor: [g(IRON, 3), g(LACQUER, 1)],
    shield: [g("round", 3), g("none", 2)], shieldColor: [g(HIDE), g(WOOD)],
    accessory: arms(["bow", 6], ["spear", 3]),
  }),

  kit("sa-early", "Mauryan to Rajput: quilt, round shield, spear", { years: [-600, 1200], cultures: ["south-asian"] }, {
    garment: [g("tunic", 1), g("none", 1)], ...bare,
    headwear: [g("turban", 3), g("none", 3), g("helmet", 1)],
    armour: [g("quilted", 4), g("none", 3)],
    shield: [g("round", 5), g("tall", 1)], shieldColor: [g(HIDE), g(WOOD)],
    accessory: arms(["spear", 5], ["bow", 2]),
  }),
  kit("sa-late", "Sultanate and Mughal: the mail coat, the dhal, matchlock", { years: [1200, 1870], cultures: ["south-asian"] }, {
    garment: [g("long-tunic", 2), g("open-robe", 1)], ...sandals,
    headwear: [g("turban", 5), g("helmet", 1), g("nasal", 1)],
    armour: [g("mail", 4), g("quilted", 2), g("none", 2)], armourColor: [g(IRON)],
    shield: [g("round")], shieldColor: [g(HIDE), g(IRON)],
    accessory: arms(["spear", 4], ["musket", 2]),
  }),

  kit("china", "From Han to Ming: lamellar, the glaive, the spear", { years: [-500, 1650], cultures: ["east-asian"] }, {
    garment: [g("long-tunic", 2), g("tunic", 1)], footwear: [g("boots")],
    headwear: [g("helmet", 5), g("cap", 1)],
    armour: [g("lamellar", 6), g("quilted", 2)], armourColor: [g(IRON, 3), g(LACQUER, 1)],
    shield: [g("none", 3), g("round", 2), g("tall", 1)], shieldColor: [g(PAINTED), g(WOOD)], shieldMark: [g("tiger", 2), g("none", 1)],
    accessory: arms(["spear", 5], ["glaive", 3], ["crossbow", 2]),
  }),
  kit("qing", "Qing bannerman and green standard: padded coat, spear, matchlock", { years: [1650, 1900], cultures: ["east-asian"] }, {
    garment: [g("long-tunic", 2), g("open-robe", 1)], footwear: [g("boots")],
    headwear: [g("cap", 4), g("conical", 2)],
    armour: [g("quilted", 3), g("none", 3)],     shield: [g("none")],
    accessory: arms(["spear", 4], ["musket", 3]),
  }),
  kit("japan-armoured", "Samurai and ashigaru: lacquered lamellar, yari and naginata", { years: [700, 1600], cultures: ["east-asian"], bounds: [128, 30, 146, 46] }, {
    garment: [g("long-tunic")], ...sandals,
    headwear: [g("kabuto", 6), g("none", 1)],
    armour: [g("lamellar")], armourColor: [g(LACQUER, 3), g(IRON, 1)],
    shield: [g("none")],
    // The sashimono, in the lord's colours: rarely worn at a peacetime gate.
    backFlag: [g("", 3), g("#e8e0d0", 1), g("#a8362c", 1), g("#2a3a5a", 1)],
    accessory: arms(["spear", 3], ["glaive", 3], ["bow", 3]),
  }),
  kit("japan-edo", "Edo gate guard: no armour in peacetime, the spear by the gate", { years: [1600, 1870], cultures: ["east-asian"], bounds: [128, 30, 146, 46] }, {
    garment: [g("open-robe", 2), g("long-tunic", 1)], ...sandals,
    headwear: [g("none")], armour: [g("none")], shield: [g("none")],
    accessory: arms(["spear", 5], ["glaive", 1]),
  }),

  kit("southeast-asia", "Spear and shield of the archipelago and the mainland", { years: [-500, 1870], cultures: ["southeast-asian"] }, {
    garment: [g("none", 2), g("tunic", 2)], ...bare,
    headwear: [g("none", 3), g("wrap", 2), g("helmet", 1)],
    armour: [g("quilted", 3), g("none", 4)],
    shield: [g("round", 4), g("tall", 3)], shieldColor: [g(WOOD), g(PAINTED)],
    accessory: arms(["spear", 6]),
  }),

  kit("west-africa", "Sahel and forest: quilted cotton, hide shield, spear", { years: [-500, 1900], cultures: ["west-central-african"] }, {
    garment: [g("none", 2), g("wrap", 2), g("robe", 1)], ...bare,
    headwear: [g("none", 4), g("cap", 2), g("wrap", 1)],
    armour: [g("quilted", 3), g("none", 5)],
    shield: [g("tall", 4), g("round", 2)], shieldColor: [g(HIDE), g(OXHIDE)], shieldMark: [g("none", 3), g("cowhide", 1)],
    accessory: arms(["spear", 6], ["bow", 1]),
  }),
  kit("east-south-africa", "Oxhide shield and spear", { years: [-500, 1900], cultures: ["east-southern-african"] }, {
    garment: [g("none", 3), g("wrap", 2)], ...bare,
    headwear: [g("none", 6), g("plume", 1)],
    armour: [g("none")],
    shield: [g("tall", 5), g("round", 3)], shieldColor: [g(HIDE, 2), g("#3a2a20", 2)], shieldMark: [g("cowhide")],
    accessory: arms(["spear", 1]),
  }),

  kit("mesoamerica", "Cotton armour and the chimalli", { years: [-500, 1530], cultures: ["mesoamerican"] }, {
    garment: [g("loincloth", 1), g("tunic", 2)], ...sandals,
    // The orders' helmets went to proven captors; most fought in quilted cotton.
    headwear: [g("plume", 3), g("none", 3), g("jaguar", 1), g("eagle", 1)],
    armour: [g("quilted")],
    shield: [g("round")], shieldColor: [g(PAINTED), g(OXHIDE), g("#2f6a8a")], shieldMark: [g("bands", 2), g("none", 1)],
    accessory: arms(["spear", 2], ["macuahuitl", 3], ["bow", 2]),
  }),
  kit("andes", "Quilted tunic, cane helmet, small round shield", { years: [-500, 1540], cultures: ["andean"] }, {
    garment: [g("tunic")], ...sandals,
    headwear: [g("helmet", 3), g("none", 3)],
    // Cane and wood helmets; the quilt keeps its own colour.
    armour: [g("quilted")], armourColor: [g(WOOD)],
    shield: [g("round", 4), g("none", 1)], shieldColor: [g(PAINTED), g(WOOD)], shieldMark: [g("bands", 1), g("none", 2)],
    accessory: arms(["spear", 3], ["sling", 1]),
  }),
  kit("north-america", "Bow and spear, a hide shield on the plains", { years: [-5000, 1900], cultures: ["other-indigenous-american"] }, {
    headwear: [g("none", 4), g("plume", 1)],
    armour: [g("none")],
    shield: [g("none", 4), g("round", 1)], shieldColor: [g(HIDE)],
    accessory: arms(["bow", 5], ["spear", 3]),
  }),
  uniform("1870", "Coat, peaked cap and the breech-loader", { years: [1870, 1914] }, {
    garment: [u("coat")], leggings: [u("trousers")], footwear: [u("boots")], belt: [u("leather")],
    headwear: [u("peaked-cap", 5), u("helmet", 1), u("cap", 1)],
    dye: [u("vat", 4), u("soot", 2), u("madder", 1), u("bark", 2)], motif: [u("placket")],
    armour: [u("none")], shield: [u("none")], accessory: [u("rifle", 6), u("none", 1)],
  }),
  uniform("world-wars", "Khaki, field grey and olive: helmet, puttees, rifle", { years: [1914, 1946] }, {
    garment: [u("coat", 4), u("shirt", 2)], leggings: [u("wrapped", 4), u("trousers", 4)], footwear: [u("boots")], belt: [u("leather")],
    headwear: [u("helmet", 5), u("peaked-cap", 3), u("cap", 2)], over: [u("none", 5), u("cloak", 1)],
    dye: [u("bark", 4), u("ash", 4), u("umber", 3), u("chilca", 2)], motif: [u("placket")],
    armour: [u("none")], shield: [u("none")], accessory: [u("rifle", 8), u("none", 1)],
  }),
  uniform("late", "Fatigues, beret and boots", { years: [1946, 10001] }, {
    garment: [u("shirt", 4), u("coat", 2)], leggings: [u("trousers")], footwear: [u("boots")], belt: [u("wide")],
    headwear: [u("helmet", 4), u("beret", 3), u("ball-cap", 2), u("brimmed", 1), u("peaked-cap", 1)],
    dye: [u("chilca", 4), u("bark", 3), u("umber", 2), u("ash", 1)], motif: [u("placket")],
    armour: [u("none")], shield: [u("none")], accessory: [u("rifle", 6), u("none", 1)],
  }),
  uniform("ottoman", "Ottoman conscript: the fez", { years: [1870, 1925], bounds: TURKEY }, { headwear: [u("fez")] }),
  // Turkey dropped the fez in 1925; Iran's army never wore it.
  uniform("africa", "Askari and tirailleur: the red chechia, khaki and puttees", { years: [1870, 1965], cultures: ["west-central-african", "east-southern-african", "north-african-west-asian"], except: [TURKEY, TURKEY_NE, [44, 25, 63, 40]] }, {
    headwear: [u("fez", 6), u("peaked-cap", 1), u("pith-helmet", 1)],
    leggings: [u("wrapped", 3), u("trousers", 2), u("none", 2)], footwear: [u("boots", 3), u("none", 2)],
    dye: [u("ochre", 4), u("bark", 3), u("vat", 1)],
  }),
  uniform("south-asia", "Sepoy and jawan: the pagri over khaki", { years: [1870, 1948], cultures: ["south-asian"] }, {
    headwear: [u("turban", 6), u("helmet", 1)], dye: [u("ochre", 4), u("bark", 3)], leggings: [u("wrapped", 3), u("trousers", 2)],
  }),
  uniform("japan", "Imperial conscript: khaki, peaked cap, puttees", { years: [1873, 1946], cultures: ["east-asian"], bounds: [128, 30, 146, 46] }, {
    headwear: [u("peaked-cap", 4), u("helmet", 2)], leggings: [u("wrapped")], dye: [u("ochre", 4), u("bark", 2)],
  }),
  uniform("pla", "PLA: soft cap, green cotton, canvas shoes", { years: [1947, 1990], cultures: ["east-asian"], bounds: [98, 18, 125, 42], except: [TAIWAN, HONG_KONG] }, {
    garment: [u("coat")], headwear: [u("cap", 5), u("helmet", 1)], footwear: [u("sneakers", 3), u("boots", 1)],
    dye: [u("chilca", 5), u("ochre", 1)],
  }),
  uniform("red-army", "Red Army: the gymnastyorka, the greatcoat, the furazhka", { years: [1918, 1992], bounds: [27, 41, 60, 70], except: [TURKEY, TURKEY_NE] }, {
    headwear: [u("peaked-cap", 3), u("cap", 2), u("helmet", 2)], over: [u("none", 3), u("cloak", 2)],
    dye: [u("chilca", 3), u("bark", 3), u("ash", 1)],
  }),
  uniform("guerrilla", "Irregulars: their own clothes, a hat, a rifle", { years: [1870, 10001] }, {
    garment: [q("shirt", 4), q("tunic", 1), q("coat", 1)], leggings: [q("trousers")],
    headwear: [q("brimmed", 3), q("beret", 1), q("cap", 2), q("none", 2)], footwear: [q("sandals", 2), q("boots", 2), q("shoes", 1)],
    dye: [q("bark", 3), q("undyed", 2), q("chilca", 2), q("umber", 2)], accessory: [q("rifle", 5), q("none", 1)],
  }),
  uniform("revolution-mexico", "The Revolution: the sombrero and the carbine", { years: [1910, 1931], bounds: [-118, 13, -86, 33] }, {
    headwear: [q("brimmed")], garment: [q("shirt")], footwear: [q("sandals", 2), q("boots", 1)], dye: [q("undyed", 3), q("bleached", 2), q("bark", 1)],
  }),
  uniform("guerrilla-early", "The Peninsular guerrilla: musket and cloak", { years: [1800, 1870] }, {
    headwear: [q("brimmed", 2), q("cap", 2)], over: [q("cloak", 1), q("none", 2)], accessory: [q("musket", 4), q("none", 1)],
  }),

  kit("pacific", "The long shield and the spear", { years: [-5000, 1900], cultures: ["australian-pacific"] }, {
    garment: [g("none", 2), g("loincloth", 1)], ...bare,
    headwear: [g("none")], armour: [g("none")],
    shield: [g("tall")], shieldColor: [g(WOOD), g(PAINTED)],
    accessory: arms(["spear", 1]),
  }),
];
