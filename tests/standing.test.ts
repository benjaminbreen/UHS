import { describe, it, expect } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { generateCharacter } from "../src/content/characters/generate";
import { resolveCharacterContext } from "../src/content/characters/resolve";

const settingFor = (q: string) => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(`${q}: ${r.error}`);
  return r.setting;
};
const sample = (q: string, n = 120) => {
  const s = settingFor(q);
  return Array.from({ length: n }, (_, i) =>
    generateCharacter(s, "standing", `p${i}`),
  );
};

describe("who is free", () => {
  it("makes bondage a share of a place, not a flag on a community", () => {
    // Virginia's English colonists included indentured servants and its
    // African-descended population included free people; Rome's enslaved were
    // a fifth of everyone. A model that cannot show this makes the ordinary
    // arrangement of most of the societies in the game invisible.
    const unfree = (q: string) =>
      sample(q).filter((c) => c.origin.standing === "unfree").length / 120;
    expect(unfree("1700 Virginia"), "Virginia").toBeGreaterThan(0.2);
    expect(unfree("ancient Rome"), "Rome").toBeGreaterThan(0.1);
    expect(unfree("neolithic Anatolia"), "neolithic Anatolia").toBe(0);
  });

  it("gives unfree people unfree work and nobody else", () => {
    for (const q of ["1700 Virginia", "ancient Rome", "medieval Normandy"]) {
      const ctx = resolveCharacterContext(settingFor(q));
      const unfreeIds = new Set(
        ctx.livelihoods.filter((l) => l.standing === "unfree").map((l) => l.id),
      );
      for (const c of sample(q, 80)) {
        const isUnfreeWork = unfreeIds.has(c.origin.livelihood);
        expect(isUnfreeWork, `${q}: ${c.role}`).toBe(
          c.origin.standing === "unfree",
        );
      }
    }
  });

  it("does not staff a modern town with pre-industrial crafts", () => {
    // A 1948 town was drawing swineherds, cottagers and vine dressers,
    // because the village tier never closed.
    const s = { ...settingFor("medieval Normandy"), year: 1970 };
    const ids = new Set(
      resolveCharacterContext(s).livelihoods.map((l) => l.id),
    );
    for (const gone of ["swineherd", "cottager", "vine-dresser", "thatcher", "ploughman", "thresher"])
      expect(ids.has(gone), `${gone} in 1970`).toBe(false);
  });
});
