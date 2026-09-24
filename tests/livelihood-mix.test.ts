import { describe, it, expect } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
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
