import { describe, expect, it } from "vitest";
import { characterNameParts, generateCharacter } from "../src/content/characters/generate";
import { resolveCharacterContext } from "../src/content/characters/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { populateCharacter } from "../src/content/geography/character";
import { packForSetting } from "../src/content/geography/pack";
import { livelihoodOf } from "../src/world/v3/routines";
import { goodsOf } from "../src/content/economy/goods";
import { settingFor } from "../src/content/geography/resolve";
import { featuredPlaces, places } from "../src/content/geography/places";
import type { Actor, Inventory } from "../src/core/types";
import { createSettingSession } from "../src/runtime/session";

const place = (id: string) => {
  const found = places.find((p) => p.id === id);
  if (!found) throw new Error(`Missing fixture place: ${id}`);
  return found;
};

describe("contextual character generation", () => {
  it("resolves a requested apprentice specialty to its work and a suitable starting age", () => {
    const setting = { ...settingFor(place("rome"), 100), role: "Apprentice Brewer" };
    for (let i = 0; i < 8; i++) {
      const seed = `brewer-${i}`;
      const populated = populateCharacter(setting, seed);
      const age = populated.character!.age!;
      const person = generateCharacter(populated, seed, "player", age, populated.role);
      const kit = livelihoodOf(packForSetting(populated), { origin: person.origin } as Actor);
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThanOrEqual(27);
      expect(person.role).toBe("Apprentice Brewer");
      expect(person.origin.specialty).toBe("brewer");
      expect(kit?.activity).toBe("Brewing");
      expect(goodsOf(kit)).toContain("drink");
      expect(goodsOf(kit, 1)).toEqual(["drink"]);
    }
  });

  it("keeps an apprentice baker's production tied to the specialty", () => {
    const setting = { ...settingFor(place("rome"), 100), role: "Apprentice Baker" };
    const populated = populateCharacter(setting, "apprentice-baker");
    const person = generateCharacter(populated, "apprentice-baker", "player", populated.character!.age!, populated.role);
    const kit = livelihoodOf(packForSetting(populated), { origin: person.origin } as Actor);
    expect(kit?.trade).toBe("baker");
    expect(goodsOf(kit, 1)).toEqual(["bread"]);
  });

  it("resolves and populates every featured place through the integrated path", () => {
    for (const featured of featuredPlaces) {
      const setting = integratedSetting(settingFor(featured));
      expect(() => resolveCharacterContext(setting)).not.toThrow();
      const populated = populateCharacter(setting, "featured-place-seed");
      expect(populated.characterRevision).toBe(2);
      expect(populated.character).toBeDefined();
      expect(populated.characterName.length).toBeGreaterThan(0);
      expect(populated.characterName).not.toMatch(/^Resident \d+$/);
    }
  });

  it("keeps field streams independent when a role changes", () => {
    const setting = settingFor(place("congo"), 1300);
    const farmer = generateCharacter(
      setting,
      "stream-seed",
      "npc-1",
      34,
      "farmer",
    );
    const traveler = generateCharacter(
      setting,
      "stream-seed",
      "npc-1",
      34,
      "traveler",
    );

    expect(traveler.name).toBe(farmer.name);
    // Hair reads the livelihood rank on purpose (b1aea46): labouring and
    // destitute people get practical styles, and a farmer labours where a
    // traveler does not. Every other field must still be untouched, which is
    // what catches one field's stream bleeding into the next. The body reads
    // rank too: mass, and the width and belly drawn from it.
    const {
      hair: farmerHair,
      physique: farmerBody,
      build: farmerBuild,
      bodyShape: farmerShape,
      ...farmerRest
    } = farmer.appearance;
    const {
      hair: travelerHair,
      physique: travelerBody,
      build: travelerBuild,
      bodyShape: travelerShape,
      ...travelerRest
    } = traveler.appearance;
    expect(travelerBody?.strength).toBe(farmerBody?.strength);
    // Dress reads rank through means, and ornament metal follows the cloth.
    const tools = (r: typeof farmerRest) => ({ ...r, wearing: undefined, adornment: { ...r.adornment, metal: undefined } });
    expect(tools(travelerRest)).toEqual(tools(farmerRest));
    expect(traveler.role).not.toBe(farmer.role);
  });

  it("preserves an explicit player name while using the same generated pathway as an NPC", () => {
    const setting = settingFor(place("virginia"), 1650);
    const player = generateCharacter(
      setting,
      "pathway-seed",
      "player",
      34,
      "farmer",
      "Martha Custis",
    );
    const npc = generateCharacter(
      setting,
      "pathway-seed",
      "npc-1",
      34,
      "farmer",
    );

    expect(player.name).toBe("Martha Custis");
    // Same work, not the same words for it: what a farmer is called is drawn
    // per person, so two of them in one village grow different crops.
    expect(player.origin.livelihood).toBe(npc.origin.livelihood);
    expect(player.appearance).not.toEqual(undefined);
    expect(npc.appearance).not.toEqual(undefined);

    const populated = populateCharacter(
      { ...setting, role: "Farmer", characterName: "Martha Custis" },
      "pathway-seed",
    );
    expect(populated.characterName).toBe("Martha Custis");
    expect(populated.role).toBe(player.role);
  });

  it("uses the Congo profile at its lower boundary with deep complexions and dark hair", () => {
    const setting = settingFor(place("congo"), 1300);
    const context = resolveCharacterContext(setting);
    expect(context.profile.id).toBe("community.congo-basin");
    expect(context.appearance.id).toBe("appearance.congo-basin-1000-1800");

    const people = ["a", "b", "c", "d"].map((id) =>
      generateCharacter(setting, "congo-seed", id),
    );
    for (const person of people) {
      expect(context.appearance.skin).toContain(person.appearance.skin);
      expect(context.appearance.hairColors).toContain(
        person.appearance.hairColor,
      );
    }
    expect(
      resolveCharacterContext(settingFor(place("congo"), 999)).profile.id,
    ).not.toBe("community.congo-basin");
  });

  it("keeps Australian interior 1400 generation local and excludes Roman-era and pastoral items", () => {
    const setting = settingFor(place("australia"), 1400);
    const context = resolveCharacterContext(setting);
    expect(context.profile.id).toBe("community.australian-interior-pre1788");
    expect(context.names?.id).toBe(
      "names-australian-interior-pama-nyungan-hypothesis",
    );

    for (const id of ["a", "b", "c", "d", "e"]) {
      const person = generateCharacter(setting, "australia-seed", id);
      expect(person.name).toMatch(/^[A-Z][a-z]+$/);
      expect(person.origin.nameFormat).toBe("personal");
      expect(person.origin.notes.join(" ")).toContain(
        "not words, names, or reconstructions from a real language",
      );
      for (const forbidden of ["grain", "wool", "coin"])
        expect(person.inventory).not.toHaveProperty(forbidden);
    }
    expect(
      resolveCharacterContext(settingFor(place("australia"), 1788)).profile.id,
    ).not.toBe("community.australian-interior-pre1788");
  });

  it("selects distinct Virginia communities and defaults European 1650 to English colonial", () => {
    const base = settingFor(place("virginia"), 1650);
    const english = resolveCharacterContext(base);
    const indigenous = resolveCharacterContext({
      ...base,
      characterCommunity: "indigenous-local",
    });
    const african = resolveCharacterContext({
      ...base,
      characterCommunity: "african-diaspora",
    });

    expect(english.community).toBe("english-colonial");
    expect(english.profile.id).toBe("community.english-colonial");
    expect(english.appearance.id).toBe("appearance.english-colonial-light");
    expect(indigenous.profile.id).toBe("community.indigenous-local-virginia");
    expect(african.profile.id).toBe("community.african-diaspora-virginia");
    expect(
      new Set([
        english.appearance.id,
        indigenous.appearance.id,
        african.appearance.id,
      ]).size,
    ).toBe(3);
    expect(english.names?.id).toBe("names-english-virginia-1607-1750");
    expect(indigenous.names?.id).toBe("names-virginia-algonquian-1607-1750");
  });

  it("filters livelihoods by water and filters inventories by the local allowance", () => {
    const landlocked = settingFor(place("australia"), 1400);
    const context = resolveCharacterContext(landlocked);
    expect(
      context.livelihoods.some((livelihood) => livelihood.id === "fisher"),
    ).toBe(false);
    expect(
      generateCharacter(landlocked, "water-seed", "fish", 34, "fisher").role,
    ).not.toBe("Fisher");

    const congo = resolveCharacterContext(settingFor(place("congo"), 1300));
    const person = generateCharacter(
      settingFor(place("congo"), 1300),
      "inventory-seed",
      "farmer",
      34,
      "farmer",
    );
    expect(
      Object.keys(person.inventory).every((key) =>
        congo.profile.allowedItems.includes(key as keyof Inventory),
      ),
    ).toBe(true);
  });
});

it("uses nineteenth-century Haitian given-plus-family names instead of fictional syllables", () => {
  const haiti = settingFor(place("haiti"), 1850);
  const context = resolveCharacterContext(haiti);
  expect(context.names?.id).toBe("names-haiti-nineteenth-century");
  expect(context.names?.format).toBe("personal-family");
  for (let i = 0; i < 48; i++) {
    const person = generateCharacter(haiti, "haiti-name-regression", `person-${i}`);
    expect(person.name.split(" ").length).toBeGreaterThanOrEqual(2);
    expect(person.origin.nameFormat).toBe("personal-family");
    expect(person.origin.nameFamilies).toHaveLength(1);
  }
});

it("uses an explicit early-Sinitic-style hypothesis for north China in 2000 BCE", () => {
  const earlyChina = { ...settingFor(place("beijing"), -1999) };
  const context = resolveCharacterContext(earlyChina);
  expect(context.names?.id).toBe("names-north-china-prewriting-3000-1200bce");
  expect(context.names?.sources.length).toBeGreaterThan(0);
  expect(generateCharacter(earlyChina, "early-china", "person").name).toMatch(
    /^[A-Z][\p{L}]+$/u,
  );
});

it("replaces the Amazon fallback with a qualified local linguistic hypothesis", () => {
  const amazon = settingFor(place("amazon"), 1400);
  const context = resolveCharacterContext(amazon);
  expect(context.names?.id).toBe(
    "names-central-amazon-manao-oriented-hypothesis",
  );
  expect(context.names?.sources.length).toBeGreaterThan(0);
  expect(generateCharacter(amazon, "amazon-name", "person").origin.nameFormat).toBe(
    "personal",
  );
});

it("renders an Icelandic patronymic without treating it as a hereditary family name", async () => {
  const { characterNameParts } = await import(
    "../src/content/characters/generate"
  );
  const iceland = {
    ...settingFor(place("london"), 1850),
    placeId: "iceland-test",
    location: "Iceland",
    lon: -19,
    lat: 64.8,
  };
  const name = characterNameParts(iceland, "icelandic-regression", "person");
  expect(name.format).toBe("personal-patronymic");
  expect(name.display).toMatch(/\S*(?:son|dóttir)$/);
  expect(name.families).toEqual([]);
});

it("gives a hand-written kit's people names that match their sex, beside the kit's other traditions", async () => {
  const { characterNameParts } = await import(
    "../src/content/characters/generate"
  );
  const rome = settingFor(place("rome"), 100);
  const kit = resolveCharacterContext(rome).names!;
  expect(kit.id).toBe("names-roman-italy-100bce-476ce");
  const women = Array.from({ length: 60 }, (_, i) =>
    characterNameParts(rome, "roman-names", `w-${i}`, undefined, undefined, "female"),
  );
  for (const n of women.filter((n) => "tradition" in n && n.tradition === kit.id))
    expect(kit.feminine).toContain(n.personal);
  expect(women.some((n) => "tradition" in n && n.tradition === "ancient-greek")).toBe(true);
});
it("keeps multiword Burmese personal names intact and scopes them to the Burmese scenario", async () => {
  const { characterNameParts } = await import(
    "../src/content/characters/generate"
  );
  const setting = settingFor(place("burma"), 1350);
  const context = resolveCharacterContext(setting);
  expect(context.names?.format).toBe("personal");
  expect(context.names?.sources.length).toBeGreaterThan(0);
  const names = Array.from({ length: 80 }, (_, i) =>
    characterNameParts(setting, "burmese-names", `actor-${i}`),
  );
  expect(names.some((n) => n.display.includes(" "))).toBe(true);
  for (const n of names) {
    expect(n.display).toBe(n.personal);
    expect(n.families).toEqual([]);
    expect(n.display).not.toMatch(/^Resident /);
  }
});

it("orders family names by convention and can inherit them without splitting personal names", async () => {
  const { characterNameParts } = await import(
    "../src/content/characters/generate"
  );
  const chinese = settingFor(place("beijing"), 1450);
  const c = characterNameParts(chinese, "naming-order", "parent");
  expect(c.display).toBe(`${c.families[0]} ${c.personal}`);
  const child = characterNameParts(
    chinese,
    "naming-order",
    "child",
    undefined,
    c.families,
  );
  expect(child.families).toEqual(c.families);
  const spanish = {
    ...chinese,
    lon: -3.7,
    lat: 40.4,
    culture: "european" as const,
    year: 1950,
  };
  const s = characterNameParts(spanish, "naming-order", "parent");
  expect(s.families).toHaveLength(2);
  expect(s.display).toBe(`${s.personal} ${s.families.join(" ")}`);
  const inherited = characterNameParts(
    spanish,
    "naming-order",
    "child",
    undefined,
    ["García", "Ruiz"],
  );
  expect(inherited.families).toEqual(["García", "Ruiz"]);
  // A Chinese naming profile must not bleed into nearby Korea.
  expect(
    resolveCharacterContext({ ...chinese, lon: 126.97, lat: 37.56 }).names?.id,
  ).not.toBe(resolveCharacterContext(chinese).names?.id);
});

it("uses stable fictional names for still-uncovered contexts without claiming local authenticity", async () => {
  const { inventedName } = await import(
    "../src/content/characters/invented-name"
  );
  // The Amazon has a Guarani tradition, and the Falklands fell inside Patagonia
  // once its box was widened to cover them, so the uncovered case is now the
  // Antarctic Peninsula: no naming region claims it, and none should.
  const s = {
    ...settingFor(place("amazon"), 1400),
    lon: -64,
    lat: -69,
    placeId: "uncovered-indigenous-american-context",
  };
  const people = Array.from({ length: 96 }, (_, i) =>
    generateCharacter(s, "amazon-regression", `person-${i}`),
  );
  expect(new Set(people.map((p) => p.name)).size).toBeGreaterThan(85);
  for (const [i, person] of people.entries()) {
    expect(person.name).toBe(inventedName("amazon-regression", `person-${i}`));
    expect(person.name).not.toMatch(/\d/);
    expect(person.origin.nameKit).toBeUndefined();
    expect(person.origin.nameFormat).toBe("invented");
  }
  expect(
    generateCharacter(
      s,
      "amazon-regression",
      "player",
      34,
      "Traveler",
      "My chosen name",
    ).name,
  ).toBe("My chosen name");
});

it("puts generated personal accessories in real inventory and in the hand", () => {
  const setting = settingFor(place("kyoto"), 1850);
  const people = Array.from({ length: 40 }, (_, i) => generateCharacter(setting, "accessories", `person-${i}`, 30, "Geisha"));
  const held = people.filter((person) => person.heldItem === "fan");
  expect(held.length).toBeGreaterThan(20);
  for (const person of held) expect(person.inventory.fan).toBe(1);
  const early = generateCharacter(settingFor(place("kyoto"), 1200), "accessories", "early", 30, "Geisha");
  expect(early.heldItem).toBeUndefined();
});

it("applies regional wardrobes to ordinary generated residents as well as scenarios", () => {
  const people = Array.from({ length: 30 }, (_, i) => generateCharacter(settingFor(place("paris"), 1888), "ordinary-wardrobe", `resident-${i}`, 34));
  for (const person of people) {
    expect(["shirt", "coat", "dress", "skirt", "gown"]).toContain(person.appearance.wearing.garment);
    expect(person.appearance.wearing.cut).toBeDefined();
  }
  const gentleman = generateCharacter(settingFor(place("paris"), 1888), "ordinary-wardrobe", "gentleman", 34, "Gentleman", "Jacques Laurent", undefined, "male");
  expect(gentleman.appearance.wearing.garment).toBe("coat");
  expect(["bowler", "top-hat"]).toContain(gentleman.appearance.wearing.headwear);
});

it("gives new local populations varied component names while preserving unpinned naming", () => {
  const london = { ...settingFor(place("london"), 1550), namingRevision: undefined };
  const older = Array.from({ length: 100 }, (_, i) => characterNameParts(london, "name-review", `npc-${i}`));
  expect(new Set(older.map((n) => n.display)).size).toBe(25);
  expect(older.every((n) => n.families.length === 0)).toBe(true);
  const richer = Array.from({ length: 100 }, (_, i) => characterNameParts({ ...london, namingRevision: 1 }, "name-review", `npc-${i}`));
  expect(new Set(richer.map((n) => n.display)).size).toBeGreaterThan(85);
  expect(richer.every((n) => n.format === "personal-family" && n.families.length === 1)).toBe(true);
  for (const [id, year] of [["paris", 1450], ["rome", 1450], ["virginia", 1650]] as const) {
    const local = { ...settingFor(place(id), year), namingRevision: 1 as const };
    const names = Array.from({ length: 30 }, (_, i) => characterNameParts(local, "local-components", `npc-${i}`));
    expect(names.every((n) => n.families.length === 1), id).toBe(true);
  }
  expect(populateCharacter(london, "new-world").namingRevision).toBe(1);
});

it("keeps early bynames separate from hereditary surnames", () => {
  const early = { ...settingFor(place("london"), 1200), namingRevision: 1 as const };
  const parent = characterNameParts(early, "byname", "parent");
  const child = characterNameParts(early, "byname", "child", undefined, ["Smith"]);
  expect(parent.format).toBe("personal-byname");
  expect(parent.display).not.toBe(parent.personal);
  expect(parent.families).toEqual([]);
  expect(child.families).toEqual([]);
  const later = characterNameParts({ ...early, year: 1550 }, "byname", "child", undefined, ["Smith"]);
  expect(later.families).toEqual(["Smith"]);
});

it("inherits a Roman family component while displaying its feminine form", () => {
  const rome = { ...settingFor(place("rome"), 100), namingRevision: 1 as const };
  const tradition = resolveCharacterContext(rome).names!.id;
  const father = generateCharacter(rome, "roman-family", "father", 40, undefined, undefined, ["Cornelius"], "male", tradition);
  const daughter = generateCharacter(rome, "roman-family", "daughter", 12, "Child", undefined, father.origin.nameFamilies, "female", tradition);
  expect(father.name).toMatch(/^Cornelius /);
  expect(daughter.name).toMatch(/^Cornelia /);
  expect(daughter.origin.nameFamilies).toEqual(father.origin.nameFamilies);
  expect(daughter.origin.namePersonal).toBeDefined();
});

it("builds patronymics from an actual parent's personal name across generations", () => {
  const iceland = { ...settingFor(place("london"), 1850), namingRevision: 1 as const, placeId: "iceland-test", lon: -19, lat: 64.8 };
  const tradition = resolveCharacterContext(iceland).names!.id;
  const father = generateCharacter(iceland, "real-parent", "father", 40, undefined, undefined, undefined, "male", tradition, { personal: "Jón" });
  const daughter = generateCharacter(iceland, "real-parent", "daughter", 12, "Child", undefined, undefined, "female", tradition, { parentPersonal: father.origin.namePersonal });
  expect(daughter.name).toMatch(/ Jónsdóttir$/);
  expect(daughter.origin.nameParentPersonal).toBe("Jón");
  expect(daughter.origin.nameFamilies).toEqual([]);
  const son = generateCharacter(iceland, "real-parent", "son", 12, "Child", undefined, undefined, "male", tradition, { personal: "Einar", parentPersonal: "Jón" });
  const grandson = generateCharacter(iceland, "real-parent", "grandson", 6, "Child", undefined, undefined, "male", tradition, { parentPersonal: son.origin.namePersonal });
  expect(son.name).toBe("Einar Jónsson");
  expect(grandson.name).toMatch(/ Einarsson$/);
  const maternal = characterNameParts(iceland, "real-parent", "maternal", undefined, undefined, "female", tradition, { parentPersonal: "Helga" });
  expect(maternal.display).toMatch(/ Helgudóttir$/);
});

it("retries only a name, retaining the person's family, community and generated traits", () => {
  const london = { ...settingFor(place("london"), 1550), namingRevision: 1 as const };
  const original = generateCharacter(london, "name-only-retry", "person", 34, "Farmer");
  const retried = generateCharacter(london, "name-only-retry", "person", 34, "Farmer", undefined, undefined, undefined, undefined, { avoid: new Set([original.name]) });
  expect(retried.name).not.toBe(original.name);
  const { name: _oldName, origin: oldOrigin, ...oldTraits } = original;
  const { name: _newName, origin: newOrigin, ...newTraits } = retried;
  expect(newTraits).toEqual(oldTraits);
  expect(newOrigin).toEqual({ ...oldOrigin, namePersonal: newOrigin.namePersonal });
  expect(retried).toEqual(generateCharacter(london, "name-only-retry", "person", 34, "Farmer", undefined, undefined, undefined, undefined, { avoid: new Set([original.name]) }));
  const custom = generateCharacter(london, "name-only-retry", "custom", 34, undefined, "My chosen name", undefined, undefined, undefined, { avoid: new Set(["My chosen name"]) });
  expect(custom.name).toBe("My chosen name");
  expect(custom.origin.namePersonal).toBeUndefined();
});

it("reports atlas naming traditions without falsely claiming invented syllables", () => {
  const london = { ...settingFor(place("london"), 1850), characterRevision: 2 as const, namingRevision: 1 as const };
  expect(resolveCharacterContext(london).names).toBeUndefined();
  expect(resolveCharacterContext(london).traditions).toBeDefined();
  expect(packForSetting(london).evidence.some((e) => e.id === "character-names-unresearched")).toBe(false);
  const unsupported = { ...london, placeId: "uncovered", lon: -65, lat: -69 };
  expect(packForSetting(unsupported).evidence.some((e) => e.id === "character-names-unresearched")).toBe(true);
  const roman = { ...london, ...settingFor(place("rome"), 100) };
  const evidence = packForSetting(roman).evidence;
  expect(evidence.some((e) => e.id === "character-names-roman-italy-100bce-476ce" && !!e.url)).toBe(true);
});

it("uses actual household parents for patronymics and preserves family traditions", () => {
  const s = { ...settingFor(place("london"), 1850), placeId: "iceland-family", lon: -19, lat: 64.8,
    settlement: "village" as const, geographyMode: "configured" as const, water: "none" as const,
    environment: { ecology: "temperate-woodland" as const, landform: "plain" as const,
      population: "sparse" as const, start: "resident" as const, household: "extended" as const },
    character: { appearanceSeed: "iceland-family", age: 42, hunger: 8, fatigue: 0 },
  };
  const engine = createSettingSession(s, "iceland-family");
  const people = [engine.state.player, ...engine.state.actors];
  let checked = 0;
  for (const child of people) {
    if (child.origin?.nameFormat !== "personal-patronymic") continue;
    const parents = child.relations?.filter((r) => r.kind === "parent")
      .map((r) => people.find((a) => a.id === r.other)).filter((a): a is Actor => !!a);
    const parent = parents?.find((a) => a.origin?.sex === "male") ?? parents?.[0];
    const head = engine.state.households?.find((h) => h.id === child.householdId)?.members[0];
    if (head === child.id && parent?.origin?.sex !== "male") continue;
    if (!parent?.origin?.namePersonal) continue;
    expect(child.origin.nameParentPersonal, child.name).toBe(parent.origin.namePersonal);
    expect(child.origin.nameTradition).toBe(parent.origin.nameTradition);
    expect(child.origin.community).toBe(parent.origin.community);
    checked++;
  }
  expect(checked).toBeGreaterThan(0);
});
