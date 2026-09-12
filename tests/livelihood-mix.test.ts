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
import { livelihoods } from "../src/content/characters/livelihoods";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";

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
