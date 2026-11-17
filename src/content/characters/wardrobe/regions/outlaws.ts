import type { GarmentKit, Option } from "../types";

/**
 * Robbers, footpads, press gangs and deserters: everyday clothes of their place,
 * worn rough, and the weapon of their trade in hand. Keyed on the livelihood,
 * so the kits dress no one else. Weights within a kit are art direction.
 */

type Kit = Omit<GarmentKit, "id" | "label" | "scope" | "priority">;
const kit = (id: string, label: string, scope: GarmentKit["scope"], parts: Kit): GarmentKit => ({
  id: `outlaw-${id}`, label, scope, priority: 5, ...parts,
});
const on = (...livelihoods: string[]) => <T>(value: T, weight = 1): Option<T> => ({ value, weight, livelihoods });
const b = on("bandit"), h = on("highwayman"), f = on("footpad"), c = on("cutpurse"), p = on("press-gang"), m = on("marauder");
const JAPAN = [129, 30, 146, 46] as const, INDIA = [66, 6, 92, 36] as const, ARABIA = [-17, 12, 60, 35] as const;
const SERTAO = [-48, -17, -34, -2] as const, MEXICO = [-118, 14, -86, 33] as const;

export const outlaws: readonly GarmentKit[] = [
  kit("bandit-ancient", "Robbers before firearms: club, spear, knife", { years: [-3500, 1500] }, {
    accessory: [b("cudgel", 4), b("spear", 3)], sidearm: [b("dagger", 3), b("none", 2)],
    dye: [b("undyed", 3), b("bark", 2), b("umber", 2)],
  }),
  kit("bandit-musket", "Robbers with the matchlock and flintlock", { years: [1500, 1870] }, {
    accessory: [b("musket", 3), b("cudgel", 3), b("spear", 1)], sidearm: [b("dagger", 3), b("none", 1)],
    over: [b("cloak", 2), b("none", 2)], neckwear: [b("neckerchief", 2), b("none", 1)],
    dye: [b("undyed", 3), b("bark", 2), b("umber", 2)],
  }),
  kit("bandit-rifle", "Robbers with the repeating rifle", { years: [1870, 10001] }, {
    accessory: [b("rifle", 4), b("cudgel", 1)], headwear: [b("brimmed", 3), b("cap", 1)],
    neckwear: [b("neckerchief", 3), b("none", 1)], dye: [b("undyed", 2), b("bark", 2), b("umber", 2)],
  }),
  kit("sanzoku", "Japanese mountain bandits: spear and sword", { years: [700, 1870], bounds: JAPAN }, {
    accessory: [b("spear", 3), b("glaive", 1), b("cudgel", 2)], sidearm: [b("katana", 2), b("none", 1)],
  }),
  kit("dacoit", "Dacoits: the lathi and the spear", { years: [1500, 1950], bounds: INDIA }, {
    accessory: [b("cudgel", 4), b("spear", 2), b("musket", 1)], headwear: [b("turban", 3), b("wrap", 1)],
  }),
  kit("raider", "Desert raiders: the lance, later the gun", { years: [-1000, 1930], bounds: ARABIA, cultures: ["north-african-west-asian"] }, {
    accessory: [b("spear", 4), b("musket", 1)], headwear: [b("headscarf", 3), b("wrap", 2)],
  }),
  kit("cangaceiro", "Cangaceiros: the leather half-moon hat and the rifle", { years: [1870, 1941], bounds: SERTAO }, {
    accessory: [b("rifle")], headwear: [b("brimmed")], footwear: [b("sandals", 2), b("boots", 1)],
  }),
  kit("bandido", "Bandidos: the sombrero and the carbine", { years: [1810, 1920], bounds: MEXICO }, {
    accessory: [b("rifle", 2), b("musket", 1)], headwear: [b("brimmed")],
  }),
  kit("highwayman", "The highwayman: riding coat, cloak, a scarf and a pistol", { years: [1600, 1840] }, {
    garment: [h("coat")], over: [h("cloak", 2), h("none", 1)], neckwear: [h("neckerchief")],
    headwear: [h("brimmed", 1), h("tricorne", 3)], footwear: [h("boots")],
    accessory: [h("pistol")], sidearm: [h("sword", 1), h("none", 1)],
  }),
  kit("footpad", "Footpads and garrotters: a cudgel under the coat", { years: [-500, 1960] }, {
    accessory: [f("cudgel", 4), f("none", 1)], neckwear: [f("neckerchief", 3), f("none", 1)],
    headwear: [f("cap", 2), f("none", 1)], dye: [f("undyed", 2), f("bark", 2), f("umber", 2)],
  }),
  kit("footpad-modern", "Street robbers: hands in pockets", { years: [1960, 10001] }, {
    accessory: [f("none")], headwear: [f("ball-cap", 2), f("none", 2)],
  }),
  kit("cutpurse", "Pickpockets: nothing to notice", { years: [-500, 10001] }, {
    accessory: [c("none")], bag: [c("none")],
  }),
  kit("press-gang", "The press gang: sailors' slops and cudgels", { years: [1664, 1815] }, {
    garment: [p("shirt", 2), p("coat", 1)], leggings: [p("trousers")], neckwear: [p("neckerchief")],
    headwear: [p("cap", 2), p("brimmed", 1)], accessory: [p("cudgel")],
  }),
  kit("routier", "Free companies: kettle hat and polearm", { years: [1300, 1500] }, {
    headwear: [m("kettle", 2), m("helmet", 1), m("none", 1)], armour: [m("quilted", 2), m("none", 1)],
    accessory: [m("spear", 2), m("halberd", 2)], sidearm: [m("sword", 2), m("dagger", 1)],
  }),
  kit("marauder", "Stragglers from the pike-and-shot armies", { years: [1500, 1870] }, {
    headwear: [m("brimmed", 2), m("helmet", 1), m("none", 1)], over: [m("cloak", 2), m("none", 1)],
    accessory: [m("musket", 3), m("halberd", 1)], sidearm: [m("sword", 2), m("dagger", 1)],
  }),
  kit("ronin", "The masterless samurai", { years: [1600, 1868], bounds: JAPAN }, {
    headwear: [m("none", 2), m("brimmed", 1)], accessory: [m("none")], sidearm: [m("katana")],
  }),
  kit("deserter-modern", "Deserters with their rifles", { years: [1870, 10001] }, {
    accessory: [m("rifle")], headwear: [m("cap", 2), m("none", 1)],
  }),
];
