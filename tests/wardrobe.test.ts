import { expect, it } from "vitest";
import {
  ageBandOf,
  kitsFor,
  meansOf,
  wardrobeFor,
  clothFor,
  clothId,
  rolesFrom,
  clothName,
  dyeAt,
  dyes,
  parseCloth,
  rarityOf,
  garmentKits,
  type GarmentKit,
} from "../src/content/characters/wardrobe";
import { generateAppearance, headwear } from "../src/core/character";

const base = generateAppearance("wardrobe-test", 0, 34).wearing;
const dress = (id: string, year: number, over: Partial<Parameters<typeof wardrobeFor>[0]> = {}) =>
  wardrobeFor({ id, ...over }, { year }, base);

it("bands the eras so no hat arrives before its century", () => {
  // Nothing cut and blocked in the Neolithic.
  for (let i = 0; i < 60; i++) {
    const w = dress(`neo-${i}`, -6500);
    expect(["none", "band"]).toContain(w.headwear);
  }
  // A peaked cap is a twentieth-century thing.
  const modern = new Set(
    Array.from({ length: 80 }, (_, i) => dress(`now-${i}`, 1995).headwear),
  );
  expect(modern.has("ball-cap")).toBe(true);
  expect(modern.has("bowler")).toBe(false);
});

it("keys the 1890s hat to standing", () => {
  const hats = (means: "poor" | "wealthy") =>
    new Set(
      Array.from(
        { length: 80 },
        (_, i) => dress(`vic-${means}-${i}`, 1890, { means }).headwear,
      ),
    );
  expect(hats("wealthy").has("bowler")).toBe(true);
  expect(hats("poor").has("bowler")).toBe(false);
  expect(hats("poor").has("flat-cap")).toBe(true);
});

it("keys options to sex and age", () => {
  const scarves = Array.from({ length: 40 }, (_, i) =>
    dress(`f-${i}`, 1890, { sex: "female" }).headwear,
  );
  expect(scarves).toContain("headscarf");
  expect(
    Array.from({ length: 40 }, (_, i) =>
      dress(`m-${i}`, 1890, { sex: "male" }).headwear,
    ),
  ).not.toContain("headscarf");
  expect(ageBandOf(8)).toBe("child");
  expect(ageBandOf(undefined)).toBe("adult");
});

it("resolves each slot from the narrowest kit that names it", () => {
  const all = kitsFor(undefined, 1600);
  expect(all.length).toBeGreaterThan(0);
  // Every era floor answers every slot, so nobody ends up undressed.
  const w = dress("early-modern", 1600);
  expect(w.garment).toBeTruthy();
  expect(w.footwear).toBeTruthy();
  expect(w.leggings).toBeTruthy();
  expect(headwear).toContain(w.headwear);
});

it("is stable for one person and spread across a crowd", () => {
  expect(dress("same", 1200)).toEqual(dress("same", 1200));
  const crowd = new Set(
    Array.from({ length: 40 }, (_, i) => dress(`crowd-${i}`, 1200).garment),
  );
  expect(crowd.size).toBeGreaterThan(2);
  // Unfree standing reads as poor without a wealth field in the world model.
  expect(meansOf({ id: "x", standing: "unfree" })).toBe("poor");
});

it("lets a narrow kit override one slot and inherit the rest", () => {
  const city: GarmentKit = {
    id: "test-city",
    label: "One city, one hat",
    // Narrower on years than the industrial floor it sits inside.
    scope: { years: [1880, 1900] },
    headwear: [{ value: "fez" }],
  };
  const pool = [...garmentKits, city];
  for (let i = 0; i < 20; i++) {
    const w = wardrobeFor({ id: `city-${i}` }, { year: 1890 }, base, pool);
    expect(w.headwear).toBe("fez");
    // Everything the city kit is silent about still comes from the floor.
    expect(w.footwear).toBeTruthy();
    expect(w.garment).not.toBe("wrap");
  }
  // Outside its years the kit does not apply.
  expect(
    Array.from(
      { length: 20 },
      (_, i) => wardrobeFor({ id: `late-${i}` }, { year: 1960 }, base, pool).headwear,
    ),
  ).not.toContain("fez");
});

/** A setting narrow enough to pick a regional kit. */
const place = (culture: string, year: number, lon = 80, lat = 15) =>
  ({ culture, year, placeId: "p", lon, lat, community: "local" }) as never;
const crowd = (
  culture: string,
  year: number,
  over: Record<string, unknown> = {},
  n = 200,
  at?: [number, number],
) =>
  Array.from({ length: n }, (_, i) =>
    wardrobeFor(
      { id: `${culture}-${year}-${JSON.stringify(over)}-${i}`, age: 30, ...over },
      { year, setting: place(culture, year, at?.[0], at?.[1]) },
      base,
    ),
  );
const share = <T>(rows: T[], f: (r: T) => boolean) =>
  rows.filter(f).length / rows.length;

it("dresses South Asia in wound cloth, and never ahead of its century", () => {
  for (const year of [-200, 900, 1300]) {
    const rows = crowd("south-asian", year);
    // The lower body is a wound cloth in every band before the mills.
    expect(share(rows, (w) => w.leggings === "sarong")).toBeGreaterThan(0.6);
    // Cut-and-sewn northern dress had not arrived, or not spread.
    expect(rows.map((w) => w.garment)).not.toContain("shirt");
    expect(rows.map((w) => w.garment)).not.toContain("coat");
    expect(rows.map((w) => w.leggings)).not.toContain("trousers");
    expect(rows.map((w) => w.footwear)).not.toContain("boots");
  }
});

it("brings the jama and the turban to Mughal-era South Asia", () => {
  const rich = crowd("south-asian", 1650, { means: "wealthy" });
  const poor = crowd("south-asian", 1650, { means: "poor" });
  expect(share(rich, (w) => w.garment === "open-robe")).toBeGreaterThan(0.15);
  expect(rich.map((w) => w.garment)).not.toContain("loincloth");
  // A labourer wears the same forms with less of them, never the court robe.
  expect(poor.map((w) => w.garment)).not.toContain("open-robe");
  expect(share(poor, (w) => w.footwear === "none")).toBeGreaterThan(0.2);
  // The turban is the period's one near-universal.
  expect(share(rich, (w) => w.headwear === "wrap")).toBeGreaterThan(0.4);
});

it("keeps the sarong in Southeast Asia after the shirt arrives", () => {
  const early = crowd("southeast-asian", 200);
  expect(share(early, (w) => w.leggings === "sarong")).toBeGreaterThan(0.8);
  expect(share(early, (w) => w.footwear === "none")).toBeGreaterThan(0.6);
  expect(early.map((w) => w.garment)).not.toContain("shirt");
  const modern = crowd("southeast-asian", 1980);
  expect(share(modern, (w) => w.garment === "shirt")).toBeGreaterThan(0.3);
  expect(share(modern, (w) => w.leggings === "sarong")).toBeGreaterThan(0.2);
});

it("puts the conical hat on the people working the fields", () => {
  const farmers = crowd("southeast-asian", 1600, { livelihood: "farmer" });
  const traders = crowd("southeast-asian", 1600, { livelihood: "trader" });
  const hat = (rows: typeof farmers) =>
    share(rows, (w) => w.headwear === "conical");
  expect(hat(farmers)).toBeGreaterThan(hat(traders) + 0.1);
});

it("dresses one person coherently when the record gives no sex", () => {
  // Seeded rather than drawn from both pools, so nobody gets a veil and a
  // loincloth at once.
  const rows = crowd("south-asian", 1650, {}, 120);
  for (const w of rows)
    if (w.headwear === "veil") expect(w.garment).not.toBe("loincloth");
});

it("gives cloth a fibre, a colour and a quality that agree with each other", () => {
  const rows = Array.from({ length: 300 }, (_, i) =>
    clothFor(
      { id: `cloth-${i}`, age: 30, means: (["poor", "common", "wealthy"] as const)[i % 3] },
      { year: 1650, setting: place("south-asian", 1650) },
    ),
  );
  // Fine work went onto cloth worth the work, never onto undyed plain stuff.
  for (const c of rows)
    if (c.quality >= 2) expect(dyes[c.dye].tier).not.toBe("common");
  // A skin takes the colour it had.
  for (const c of rows)
    if (c.material === "hide" || c.material === "fur")
      expect(dyes[c.dye].tier).toBe("common");
  // Silk and the costly dyes are for the few.
  const poor = rows.filter((_, i) => i % 3 === 0);
  expect(poor.every((c) => c.material !== "silk")).toBe(true);
  expect(poor.some((c) => c.quality < 0)).toBe(true);
});

it("names a garment by what it is made of", () => {
  const name = clothName("robe", { material: "silk", dye: "indigo", quality: 2 }, "x");
  expect(name).toMatch(/indigo silk robe$/);
  expect(rarityOf({ material: "silk", dye: "indigo", quality: 2 })).toBe("rare");
  expect(rarityOf({ material: "hemp", dye: "undyed", quality: -1 })).toBe("common");
  // The id round-trips, so the cloth survives a save.
  const id = clothId("garment-robe", { material: "silk", dye: "lac", quality: 3 });
  expect(parseCloth(id)).toMatchObject({
    base: "garment-robe",
    cloth: { material: "silk", dye: "lac", quality: 3 },
  });
});

it("keeps synthetic colour out of every century that could not make it", () => {
  for (const year of [-500, 900, 1700]) {
    const rows = Array.from({ length: 150 }, (_, i) =>
      clothFor({ id: `dye-${year}-${i}` }, { year, setting: place("european", year) }),
    );
    expect(rows.map((c) => c.dye)).not.toContain("aniline");
    expect(rows.map((c) => c.material)).not.toContain("synthetic");
  }
  const modern = Array.from({ length: 150 }, (_, i) =>
    clothFor({ id: `dye-now-${i}` }, { year: 1980, setting: place("european", 1980) }),
  );
  expect(modern.map((c) => c.material)).toContain("synthetic");
});

it("wraps East Asia in the cross-collar robe, and keeps cotton late", () => {
  for (const year of [-500, 800, 1600]) {
    const rows = crowd("east-asian", year);
    expect(share(rows, (w) => w.garment === "open-robe")).toBeGreaterThan(0.25);
    // Held with a sash, not cinched with a buckle.
    expect(share(rows, (w) => w.belt === "sash")).toBeGreaterThan(0.5);
  }
  const fibres = (year: number) =>
    Array.from({ length: 200 }, (_, i) =>
      clothFor({ id: `ea-${year}-${i}` }, { year, setting: place("east-asian", year) }),
    ).map((c) => c.material);
  expect(fibres(800)).not.toContain("cotton");
  expect(fibres(1600)).toContain("cotton");
});

it("keeps the fez out of West Asia until the Ottomans standardised it", () => {
  for (const year of [-300, 900, 1600])
    expect(
      crowd("north-african-west-asian", year).map((w) => w.headwear),
    ).not.toContain("fez");
  const late = crowd("north-african-west-asian", 1900, { sex: "male" });
  expect(share(late, (w) => w.headwear === "fez")).toBeGreaterThan(0.05);
  // A wound head cloth stays the region's constant either way.
  expect(share(crowd("north-african-west-asian", 1100), (w) => w.headwear === "wrap")).toBeGreaterThan(0.4);
});

it("dresses the Andes and Mesoamerica from the loom, not from a pattern", () => {
  for (const culture of ["andean", "mesoamerican"]) {
    const rows = crowd(culture, 1400);
    // The two shapes these regions were drawn for.
    expect(share(rows, (w) => w.garment === "poncho")).toBeGreaterThan(0.1);
    expect(share(rows, (w) => !!w.mantle)).toBeGreaterThan(0.2);
    // Rectangles off the loom, never cut and flared.
    for (const cut of ["dress", "skirt", "coat", "shirt"])
      expect(rows.map((w) => w.garment)).not.toContain(cut);
    // Banding is the default patterning, and it has to contrast to be seen.
    expect(share(rows, (w) => w.motif === "stripes")).toBeGreaterThan(0.25);
    for (const w of rows) expect(w.trim).not.toBe(w.color);
  }
});

it("makes American colour ordinary rather than costly", () => {
  const colours = (culture: string) =>
    Array.from({ length: 200 }, (_, i) =>
      clothFor(
        { id: `${culture}-dye-${i}`, means: "poor" },
        { year: 1400, setting: place(culture, 1400) },
      ).dye,
    );
  // Cochineal and Maya blue were local and abundant; a poor weaver's cloth
  // here is bright, which is the opposite of the European case.
  expect(colours("andean")).toContain("relbunium");
  expect(colours("andean")).toContain("qolle");
  expect(colours("mesoamerican")).toContain("mayablue");
  expect(colours("mesoamerican")).toContain("achiote");
  const european = Array.from({ length: 200 }, (_, i) =>
    clothFor({ id: `eu-dye-${i}`, means: "poor" }, { year: 1400, setting: place("european", 1400) }),
  ).map((c) => c.dye);
  expect(european).not.toContain("cochineal");
});

it("puts Europe in sandals and the steppe in boots", () => {
  // The Mediterranean and the steppe are near-inverses, and the leg is where
  // it shows: a bare leg and a sandal against trousers and a boot.
  const med = crowd("european", -300);
  expect(share(med, (w) => w.leggings === "none")).toBeGreaterThan(0.4);
  expect(share(med, (w) => w.footwear === "sandals")).toBeGreaterThan(0.4);
  expect(share(med, (w) => w.leggings === "trousers")).toBeLessThan(0.05);
  const steppe = crowd("inner-eurasian", -300);
  expect(share(steppe, (w) => w.leggings === "trousers")).toBeGreaterThan(0.4);
  expect(share(steppe, (w) => w.footwear === "boots")).toBeGreaterThan(0.5);
  // The wrapped riding coat, held with a sash, from the earliest band.
  expect(share(steppe, (w) => w.garment === "open-robe")).toBeGreaterThan(0.2);
});

it("walks Europe from the hood to the flat cap", () => {
  expect(share(crowd("european", 900), (w) => w.headwear === "hood")).toBeGreaterThan(0.15);
  expect(share(crowd("european", 900), (w) => w.leggings === "hose")).toBeGreaterThan(0.4);
  const victorian = crowd("european", 1850, { means: "poor" });
  expect(share(victorian, (w) => w.headwear === "flat-cap")).toBeGreaterThan(0.2);
  expect(victorian.map((w) => w.headwear)).not.toContain("bowler");
  expect(crowd("european", 900).map((w) => w.headwear)).not.toContain("bowler");
});

it("names a skin as cured rather than woven", () => {
  expect(clothName("cloak", { material: "fur", dye: "undyed", quality: 1 }, "a")).not.toMatch(
    /woven|spun/,
  );
  expect(clothName("cloak", { material: "linen", dye: "woad", quality: 1 }, "a")).toMatch(
    /woad-blue linen cloak$/,
  );
});

it("never puts a skirt over a pair of trousers", () => {
  for (const [culture, year] of [
    ["european", 1850],
    ["european", 1990],
    ["east-asian", 1980],
    ["mesoamerican", 1900],
  ] as const)
    for (const w of crowd(culture, year, { sex: "female" }))
      if (w.garment === "dress" || w.garment === "skirt")
        expect(["none", "hose", "wrapped"]).toContain(w.leggings);
});

it("keeps European women in skirts before they had the choice", () => {
  const victorian = crowd("european", 1850, { sex: "female" });
  expect(
    share(victorian, (w) => w.garment === "dress" || w.garment === "skirt"),
  ).toBeGreaterThan(0.7);
  expect(victorian.map((w) => w.leggings)).not.toContain("trousers");
  // By the late twentieth century both are ordinary.
  const modern = crowd("european", 1990, { sex: "female" });
  expect(
    share(modern, (w) => w.garment === "dress" || w.garment === "skirt"),
  ).toBeGreaterThan(0.25);
  expect(share(modern, (w) => w.leggings === "trousers")).toBeGreaterThan(0.25);
});

it("splits Indigenous America by climate rather than by culture tag", () => {
  // The one region in the atlas scoped on bounds: the tag covers two places
  // that dress nothing alike.
  const north = crowd("other-indigenous-american", 1500, {}, 200, [-100, 45]);
  const amazon = crowd("other-indigenous-american", 1500, {}, 200, [-60, -5]);
  expect(share(north, (w) => w.footwear === "shoes")).toBeGreaterThan(0.4);
  expect(share(north, (w) => w.leggings !== "none")).toBeGreaterThan(0.5);
  expect(amazon.map((w) => w.leggings)).toEqual(
    amazon.map(() => "none"),
  );
  expect(share(amazon, (w) => w.footwear === "none")).toBeGreaterThan(0.8);
  expect(share(amazon, (w) => w.headwear === "plume")).toBeGreaterThan(0.2);
});

it("weaves West African cloth in strips and dyes it with indigo", () => {
  const rows = crowd("west-central-african", 1500);
  expect(share(rows, (w) => w.motif === "stripes")).toBeGreaterThan(0.4);
  expect(share(rows, (w) => w.leggings === "sarong")).toBeGreaterThan(0.4);
  // Indigo is the region's own dye, worn by everyone rather than by the few.
  const poor = Array.from({ length: 200 }, (_, i) =>
    clothFor(
      { id: `wca-${i}`, means: "poor" },
      { year: 1500, setting: place("west-central-african", 1500, 5, 10) },
    ).dye,
  );
  expect(poor).toContain("indigo");
});

it("carries rank on the shoulder in Africa and the Pacific", () => {
  for (const [culture, year, at] of [
    ["east-southern-african", 500, [35, -5]],
    ["australian-pacific", 1500, [170, -15]],
  ] as const) {
    const rows = crowd(culture, year, {}, 200, at as [number, number]);
    expect(share(rows, (w) => !!w.mantle)).toBeGreaterThan(0.2);
    expect(share(rows, (w) => w.footwear === "none")).toBeGreaterThan(0.6);
  }
  // Missionary dress reaches the islands in a generation and stays.
  const island = crowd("australian-pacific", 1900, { sex: "female" }, 200, [170, -15]);
  expect(share(island, (w) => w.garment === "dress")).toBeGreaterThan(0.3);
});

it("reads a role off whatever the world weaver called someone", () => {
  expect(rolesFrom("Able Seaman")).toEqual(["sailor"]);
  expect(rolesFrom("cosmonaut")).toEqual(["astronaut"]);
  expect(rolesFrom("infantry private")).toEqual(["soldier"]);
  expect(rolesFrom("Empress of Brazil")).toEqual(["aristocrat"]);
  expect(rolesFrom("daughter of the King of Hawaii")).toEqual(["aristocrat"]);
  expect(rolesFrom("22nd century farmer")).toEqual([]);
  expect(rolesFrom(undefined, "Shogun")).toEqual(["aristocrat"]);
});

it("issues a uniform that beats whatever the place would have worn", () => {
  for (const [culture, year] of [
    ["european", 1969],
    ["east-asian", 2150],
  ] as const) {
    const crew = crowd(culture, year, { roles: ["astronaut"] });
    expect(crew.every((w) => w.garment === "suit")).toBe(true);
    expect(crew.every((w) => w.footwear === "boots")).toBe(true);
    expect(share(crew, (w) => w.headwear === "visor")).toBeGreaterThan(0.3);
  }
  // Nobody was in a pressure suit before there was anywhere to wear one.
  expect(
    crowd("european", 1900, { roles: ["astronaut"] }).map((w) => w.garment),
  ).not.toContain("suit");
  // And a uniform does not leak onto the people standing next to them.
  expect(crowd("european", 1969).map((w) => w.garment)).not.toContain("suit");
});

it("puts soldiers and sailors in their own dress, in any century", () => {
  const troops = crowd("european", 1916, { roles: ["soldier"] });
  expect(troops.every((w) => w.footwear === "boots")).toBe(true);
  expect(share(troops, (w) => w.headwear === "helmet")).toBeGreaterThan(0.3);
  expect(crowd("european", 1916).map((w) => w.headwear)).not.toContain("helmet");
  // The steppe keeps its own leg under an early soldier's coat.
  const early = crowd("east-asian", 1200, { roles: ["soldier"] });
  expect(share(early, (w) => w.headwear === "helmet")).toBeGreaterThan(0.3);
  // Wide-cut legs and a striped shirt, wherever the ship happens to be.
  for (const culture of ["european", "southeast-asian"]) {
    const crew = crowd(culture, 1780, { roles: ["sailor"] });
    expect(share(crew, (w) => w.leggings === "wide")).toBeGreaterThan(0.4);
    expect(share(crew, (w) => w.motif === "stripes")).toBeGreaterThan(0.4);
  }
});

it("spawns court dress for the few, and only while it existed", () => {
  // About one person in five hundred: the emperor, not the merchant.
  const rate =
    Array.from({ length: 20000 }, (_, i) => meansOf({ id: `pop-${i}` })).filter(
      (m) => m === "elite",
    ).length / 20000;
  expect(rate).toBeGreaterThan(0.001);
  expect(rate).toBeLessThan(0.006);
  // A stated title reaches it directly, wherever the world is set.
  expect(meansOf({ id: "x", roles: rolesFrom("Empress of Brazil") })).toBe("elite");
  const court = crowd("european", 1760, { means: "elite", sex: "female" });
  expect(share(court, (w) => w.garment === "gown")).toBeGreaterThan(0.3);
  expect(share(court, (w) => w.headwear === "wig")).toBeGreaterThan(0.3);
  expect(court.map((w) => w.leggings)).not.toContain("trousers");
  // Court dress reaches the elite of any region, not only Europe.
  const hawaii = crowd("australian-pacific", 1860, { means: "elite", sex: "female" }, 200, [-157, 21]);
  expect(share(hawaii, (w) => w.garment === "gown")).toBeGreaterThan(0.3);
  // Nobody ordinary is wearing it, and the wig belongs to its own century.
  expect(crowd("european", 1760).map((w) => w.headwear)).not.toContain("wig");
  expect(crowd("european", 1900, { means: "elite" }).map((w) => w.headwear)).not.toContain("wig");
});

it("dresses the future the same way everywhere, in cloth that costs nothing", () => {
  for (const culture of ["european", "south-asian", "andean"]) {
    const rows = crowd(culture, 2150);
    expect(share(rows, (w) => w.garment === "suit")).toBeGreaterThan(0.1);
    const fibres = Array.from({ length: 100 }, (_, i) =>
      clothFor({ id: `f-${culture}-${i}` }, { year: 2150, setting: place(culture, 2150) }),
    );
    expect(fibres.some((c) => c.material === "synthetic")).toBe(true);
  }
  // Before 2020 the regions still decide.
  expect(crowd("south-asian", 1990).map((w) => w.garment)).not.toContain("suit");
});

it("names modern cloth the way a modern wearer would", () => {
  const modern = { year: 2025, id: "garment-long-tunic" };
  const name = clothName(
    "Long tunic",
    { material: "synthetic", dye: "bleached", quality: 0 },
    "x",
    modern,
  );
  expect(name).toMatch(/^White (polyester|nylon|acrylic) tunic dress$/);
  // Polyester fades; it does not fray or spin.
  expect(
    clothName("Shirt", { material: "synthetic", dye: "vat", quality: -1 }, "q", {
      year: 2025,
      id: "garment-shirt",
    }),
  ).toMatch(
    /^(Faded|Pilled|Bobbled|Stained|Sun-bleached) blue polyester [a-z- ]*shirt$/i,
  );
  // Rayon before the war, and nothing renamed before the shops.
  expect(
    clothName("Tunic", { material: "synthetic", dye: "woad", quality: 0 }, "x", {
      year: 1930,
      id: "garment-tunic",
    }),
  ).toMatch(/^Blue (rayon|viscose) T-shirt$/);
  // Nothing is renamed before the shops that sold it.
  expect(
    clothName("Tunic", { material: "linen", dye: "woad", quality: 0 }, "x", {
      year: 1200,
      id: "garment-tunic",
    }),
  ).toBe("Woad-blue linen tunic");
});

it("draws every wearable it offers", async () => {
  const { garmentIconFor } = await import("../src/render/garment-icons");
  const { wearableItems } = await import("../src/content/characters/wearables");
  const missing = Object.keys(wearableItems).filter((id) => !garmentIconFor(id));
  expect(missing).toEqual([]);
});

it("gives each worn item the colour the figure is drawn in", async () => {
  const { wornFromWearing } = await import("../src/core/wearing");
  const setting = place("east-asian", -1135, 137, 35);
  const loud: string[] = [];
  for (let i = 0; i < 200; i++) {
    const id = `jp-${i}`;
    const w = wardrobeFor({ id, age: 30 }, { year: -1135, setting }, base);
    const c = clothFor({ id, age: 30 }, { year: -1135, setting }, undefined, w.color);
    // The item list says what the figure shows: one dye per part, not one
    // dye for the whole person.
    const body = wornFromWearing(w, c).body;
    if (body)
      expect(parseCloth(body)?.cloth.dye).toBe(dyeAt(w.color) ?? c.dye);
    if (dyes[c.dye].tier !== "common") loud.push(c.dye);
  }
  // Dyeing at scale is a later thing: Bronze Age cloth is mostly earth.
  expect(loud.length).toBeLessThan(30);
  expect(loud).not.toContain("weld");
});

it("draws every item a person can pick up", async () => {
  const { garmentIconFor, itemIconFor } = await import(
    "../src/render/garment-icons"
  );
  const { items } = await import("../src/content/packs");
  const missing = Object.values(items)
    .filter((i) => !garmentIconFor(i.id) && !itemIconFor(i.id))
    .map((i) => i.id);
  expect(missing).toEqual([]);
});

it("keeps modern men out of dresses, hemp and mauve", () => {
  const setting = place("european", 2009);
  for (let i = 0; i < 200; i++) {
    const man = { id: `nola-${i}`, sex: "male" as const, age: 34 };
    const w = wardrobeFor(man, { year: 2009, setting }, base);
    expect(["dress", "skirt", "gown"]).not.toContain(w.garment);
    const c = clothFor(man, { year: 2009, setting });
    expect(c.dye).not.toBe("aniline");
  }
  const hemp = Array.from({ length: 300 }, (_, i) =>
    clothFor({ id: `h-${i}` }, { year: 2009, setting }).material,
  ).filter((m) => m === "hemp").length;
  expect(hemp).toBeLessThan(15);
});
