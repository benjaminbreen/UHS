import { describe, expect, it } from "vitest";
import { generateCharacter } from "../src/content/characters/generate";
import { resolveCharacterContext } from "../src/content/characters/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { populateCharacter } from "../src/content/geography/character";
import { settingFor } from "../src/content/geography/resolve";
import { featuredPlaces, places } from "../src/content/geography/places";
import type { Inventory } from "../src/core/types";

const place = (id: string) => {
  const found = places.find((p) => p.id === id);
  if (!found) throw new Error(`Missing fixture place: ${id}`);
  return found;
};

describe("contextual character generation", () => {
  it("resolves and populates every featured place through the integrated path", () => {
    for (const featured of featuredPlaces) {
      const setting = integratedSetting(settingFor(featured));
      expect(() => resolveCharacterContext(setting)).not.toThrow();
      const populated = populateCharacter(setting, "featured-place-seed");
      expect(populated.characterRevision).toBe(1);
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
    expect(traveler.appearance).toEqual(farmer.appearance);
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
    expect(player.role).toBe(npc.role);
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
        "not words, names, or reconstructions from any named Aboriginal language",
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
  expect(context.names?.evidence.status).toBe("hypothesis");
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
  expect(context.names?.evidence.status).toBe("hypothesis");
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

it("keeps multiword Burmese personal names intact and scopes them to the Burmese scenario", async () => {
  const { characterNameParts } = await import(
    "../src/content/characters/generate"
  );
  const setting = settingFor(place("burma"), 1350);
  const context = resolveCharacterContext(setting);
  expect(context.names?.format).toBe("personal");
  expect(context.names?.evidence.status).toBe("hypothesis");
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
  const s = {
    ...settingFor(place("amazon"), 1400),
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
