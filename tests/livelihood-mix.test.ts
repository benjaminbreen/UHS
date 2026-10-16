import { describe, it, expect } from "vitest";
import { resolveSetting, settingFor as placeSetting } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { curatedStarts } from "../src/content/geography/curated-starts";
import {
  resolveCharacterContext,
  workAt,
} from "../src/content/characters/resolve";
import {
  characterLivelihood,
  characterSex,
} from "../src/content/characters/generate";
import { workplaceFor } from "../src/content/characters/workplace";
import { localLabel } from "../src/content/characters/officiant";
import { livelihoods } from "../src/content/characters/livelihoods";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { processFor } from "../src/content/economy/processes";
import { propDefs } from "../src/content/props/catalog";
import { requirementMet } from "../src/content/characters/requirements";
import { citySignatures } from "../src/content/characters/signatures";
import { localLabels } from "../src/content/characters/livelihood-labels.generated";
import { officiantsBySystem } from "../src/content/beliefs/officiants.generated";
import { characterStanding } from "../src/content/characters/resolve";

const settingFor = (q: string) => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(`${q}: ${r.error}`);
  return r.setting;
};
const PLACES = ["neolithic Anatolia", "medieval Normandy", "ancient Rome"];

describe("who does what in a settlement", () => {
  it("puts most of the workforce into producing food", () => {
    // Drawn evenly against dozens of specialist trades, food production was a
    // fiftieth of a village. A settlement that does not feed itself is the
    // single least plausible thing the generator produced. Counted by where
    // the work happens, not by a list of ids, so new food roles count too.
    const FOOD = new Set(["field", "pasture", "water", "wild"]);
    for (const q of PLACES) {
      const s = settingFor(q);
      const ctx = resolveCharacterContext(s);
      let fed = 0;
      for (let i = 0; i < 60; i++) {
        const l = characterLivelihood(s, "mix", `p${i}`, undefined, ctx, characterSex("mix", `p${i}`));
        if (FOOD.has(l.workplace ?? workplaceFor(l.activity))) fed++;
      }
      expect(fed / 60, q).toBeGreaterThan(0.4);
    }
  });

  it("does not give every adult a different trade", () => {
    for (const q of PLACES) {
      const s = settingFor(q);
      const ctx = resolveCharacterContext(s);
      const drawn = new Set(
        Array.from({ length: 24 }, (_, i) =>
          characterLivelihood(s, "mix", `p${i}`, undefined, ctx, characterSex("mix", `p${i}`)).id,
        ),
      );
      expect(drawn.size, q).toBeLessThan(20);
    }
  });

  it("can staff the work its settlement profile asks for", () => {
    // The planner lays fields and pens on the strength of the profile; if no
    // livelihood works a field, it used to lay them for nobody.
    for (const q of PLACES) {
      const ctx = resolveCharacterContext(settingFor(q));
      expect(workAt(ctx, "field").length, `${q} field`).toBeGreaterThan(0);
    }
  });

  it("keeps a trade out of the centuries before it existed", () => {
    const ids = (q: string) =>
      new Set(resolveCharacterContext(settingFor(q)).livelihoods.map((l) => l.id));
    const neolithic = ids("neolithic Anatolia");
    for (const late of [
      "glazier", "cooper", "miller", "saddler", "beekeeper",
      "candle-maker", "soap-boiler", "sexton", "fellah",
    ])
      expect(neolithic.has(late), `${late} in neolithic Anatolia`).toBe(false);
  });

  it("matches the work to what the country supports", () => {
    // One boolean decided whether a place farmed, so the steppe, a rice
    // district and a fjord all drew the same village list in the same
    // proportions. Each should now lean on what it actually lives on.
    const share = (q: string, of: (id: string) => boolean) => {
      const s = settingFor(q);
      const ctx = resolveCharacterContext(s);
      let n = 0;
      for (let i = 0; i < 60; i++)
        if (of(characterLivelihood(s, "sub", `p${i}`, undefined, ctx, characterSex("sub", `p${i}`)).id))
          n++;
      return n / 60;
    };
    const herding = (id: string) => /herd|shepherd|drover/.test(id);
    expect(share("12th century Mongolia", herding), "steppe herding").toBeGreaterThan(0.25);
    expect(share("medieval Normandy", herding), "Normandy herding").toBeLessThan(0.25);
  });

  it("gives every livelihood somewhere to work", () => {
    const all = [...livelihoods, ...commonLivelihoods];
    expect(all.filter((l) => !l.activity.trim()).map((l) => l.id)).toEqual([]);
    // The four hand-written kits had activity strings missing from the table,
    // so a gatherer foraged at a workbench.
    for (const id of ["gatherer", "trader", "traveler", "craftsperson"]) {
      const l = all.find((x) => x.id === id)!;
      expect(workAt(
        resolveCharacterContext(settingFor("medieval Normandy")),
        (l.workplace ?? "workshop") as never,
      )).toBeDefined();
    }
  });
});

describe("what the work is called here", () => {
  it("gives the generic kits a local name where one is authored", () => {
    // A gatherer in Neolithic Europe is a honey finder and in Amazonia a
    // brazil-nut gatherer. The id, the workplace and the day are the same;
    // calling both of them "Gatherer" wastes what the game knows about them.
    const base = settingFor("medieval Normandy");
    const cases: [string, number, number, number, string][] = [
      ["craftsperson", 12.5, 41.9, 100, "Rome"],
      ["craftsperson", 116, 34, 1500, "Ming China"],
      ["craftsperson", 8.2, 46.8, 1750, "Switzerland"],
      ["gatherer", -60, -5, 1400, "Amazonia"],
      ["gatherer", 10, 48, -5000, "Neolithic Europe"],
      ["hunter", -95, 68, 1500, "the Arctic"],
    ];
    for (const [id, lon, lat, year, where] of cases) {
      const kit = livelihoods.find((l) => l.id === id)!;
      const s = { ...base, lon, lat, year };
      const drawn = new Set(
        Array.from({ length: 16 }, (_, i) => localLabel(kit, s, "label", `p${i}`)),
      );
      expect(drawn.has(kit.label), `${id} still generic in ${where}`).toBe(false);
      expect(drawn.size, `${id} in ${where} has one name only`).toBeGreaterThan(1);
    }
  });

  it("keeps a local name inside the country that supports it", () => {
    const base = settingFor("medieval Normandy");
    const fisher = livelihoods.find((l) => l.id === "fisher")!;
    // Landlocked Switzerland was producing whalers.
    const swiss = new Set(
      Array.from({ length: 24 }, (_, i) =>
        localLabel(fisher, { ...base, lon: 8.2, lat: 46.8, year: 1750 }, "w", `p${i}`),
      ),
    );
    expect([...swiss]).not.toContain("Whaler");
  });

  it("gives every livelihood a work process at props that exist", () => {
    const families = new Set(Object.values(propDefs).map((d) => d.family));
    for (const kit of [...livelihoods, ...commonLivelihoods]) {
      const p = processFor(kit);
      expect(p, kit.activity).toBeDefined();
      for (const st of p!.stations) expect(families, st).toContain(st);
    }
  });
});

it("gives every curated start the work its title names, not a random draw", () => {
  for (const c of curatedStarts) {
    const place = places.find((p) => p.id === c.placeId);
    if (!place) continue;
    const s = placeSetting(place, c.year);
    const context = resolveCharacterContext(s);
    const [a, b] = (["female", "male"] as const).map((sex) =>
      characterLivelihood(s, sex, "player", c.role, context, sex).id);
    expect(a, c.role).toBe(b);
  }
});

describe("work that needs what the place had", () => {
  const drawn = (q: string, n = 300) => {
    const s = settingFor(q);
    const ctx = resolveCharacterContext(s);
    return Array.from({ length: n }, (_, i) =>
      characterLivelihood(s, "need", `p${i}`, undefined, ctx, characterSex("need", `p${i}`), characterStanding(s, "need", `p${i}`)),
    );
  };
  const ids = (q: string) => new Set(drawn(q).map((l) => l.id));

  it("names only requirements it knows", () => {
    const s = settingFor("medieval Normandy");
    const used = [
      ...[...livelihoods, ...commonLivelihoods].flatMap((l) => [
        ...(l.requires ?? []),
        ...(l.labels ?? []).flatMap((v) => v.requires ?? []),
      ]),
      ...Object.values(localLabels).flatMap((vs) => vs.flatMap((v) => v.requires ?? [])),
    ];
    for (const r of new Set(used)) expect(() => requirementMet(r, s), r).not.toThrow();
  });

  it("keeps Old World animals, iron and print out of the pre-contact Americas", () => {
    // Cusco in 1450 drew horse herders; Tenochtitlan in 1500 had blacksmiths,
    // wool combers and a printer.
    for (const q of ["Cusco 1450", "Tenochtitlan 1500"]) {
      const here = ids(q);
      for (const id of ["horse-herder", "blacksmith", "printer", "wheelwright", "candle-maker", "shepherd", "ploughman", "oil-presser", "miller"])
        expect(here.has(id), `${id} in ${q}`).toBe(false);
    }
    expect(ids("Tenochtitlan 1500").has("wool-comber"), "wool in Tenochtitlan").toBe(false);
    expect(ids("Lima 1650").has("blacksmith"), "Lima after the conquest").toBe(true);
  });

  it("does not send early-modern European offices round the world", () => {
    // Benin City in 1600 was an eighth clerks and schoolteachers; Abbasid
    // Baghdad and Mughal Delhi were full of journeyman glaziers.
    const benin = ids("Benin City 1600");
    for (const id of ["clerk", "schoolteacher", "pharmacist", "shopkeeper", "printer", "glazier", "cabinetmaker", "journeyman"])
      expect(benin.has(id), `${id} in Benin`).toBe(false);
    for (const q of ["Baghdad 900", "Delhi 1650", "Timbuktu 1350"])
      expect(ids(q).has("journeyman"), `journeyman in ${q}`).toBe(false);
    const kano = ids("Kano 1850");
    for (const id of ["policeman", "postman", "milliner", "mill-worker", "nurse"])
      expect(kano.has(id), `${id} in Kano 1850`).toBe(false);
    expect(ids("London 1600").has("journeyman")).toBe(true);
  });

  it("keeps sea work on the sea and desert herds in the desert", () => {
    expect(ids("Timbuktu 1350").has("sea-fisher")).toBe(false);
    expect(ids("Athens 430 BCE").has("camel-herder")).toBe(false);
    expect(ids("12th century Mongolia").has("rice-farmer")).toBe(false);
    const kyoto = settingFor("Kyoto 1600");
    const fisher = livelihoods.find((l) => l.id === "fisher")!;
    const names = new Set(Array.from({ length: 40 }, (_, i) => localLabel(fisher, kyoto, "x", `p${i}`)));
    expect(names.has("Ama Diver"), "Ama divers inland").toBe(false);
  });

  it("gives a city the work it was known for", () => {
    const share = (q: string, of: RegExp) => {
      const all = drawn(q, 400);
      return all.filter((l) => of.test(l.id)).length / all.length;
    };
    // Manchester in 1840 drew more clerks than mill hands.
    expect(share("Manchester 1840", /^(mill-worker|power-loom-weaver|factory-hand)$/)).toBeGreaterThan(
      2 * share("Manchester 1840", /^clerk$/),
    );
    expect(share("Saint-Domingue 1780", /slave/)).toBeGreaterThan(0.4);
    const tenochtitlan = new Set(drawn("Tenochtitlan 1500").map((l) => l.label));
    expect(tenochtitlan.has("Canoe Paddler")).toBe(true);
  });

  it("points every signature at work and places that exist", () => {
    const known = new Set([...livelihoods, ...commonLivelihoods].map((l) => l.id));
    const placeIds = new Set(places.map((p) => p.id));
    for (const g of citySignatures) {
      for (const id of [...Object.keys(g.boost), ...Object.keys(g.labels ?? {})])
        expect(known.has(id), `${g.id}: ${id}`).toBe(true);
      for (const p of g.scope.places ?? []) expect(placeIds.has(p), `${g.id}: ${p}`).toBe(true);
    }
  });

  it("keeps clergy a small share and lords out of the priesthood", () => {
    expect(Object.values(officiantsBySystem).flat().some((o) => /curaca/i.test(o.label))).toBe(false);
    for (const q of ["Tenochtitlan 1500", "Baghdad 900", "Cusco 1450"]) {
      const all = drawn(q, 400);
      const clergy = all.filter((l) => l.fromBeliefs).length / all.length;
      expect(clergy, q).toBeLessThan(0.05);
    }
  });
});
