import { describe, it, expect } from "vitest";
import { beliefSystems } from "../src/content/beliefs/index";
import { officiantsBySystem } from "../src/content/beliefs/officiants.generated";
import { resolveSetting } from "../src/content/geography/resolve";
import { officiantFor } from "../src/content/characters/officiant";
import { resolveCharacterContext } from "../src/content/characters/resolve";
import {
  characterLivelihood,
  characterSex,
} from "../src/content/characters/generate";

const settingFor = (q: string) => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(`${q}: ${r.error}`);
  return r.setting;
};

describe("religious offices", () => {
  it("gives every belief system a village-scale office, or none at all", () => {
    // "None at all" is the right answer for the handful of systems whose
    // record does not say who officiated; what is wrong is a system that has
    // officiants but only offers them in a city.
    for (const b of beliefSystems) {
      const o = officiantsBySystem[b.id];
      if (!o?.length) continue;
      expect(
        o.some((x) => x.tier === "local" || x.tier === "temple"),
        b.id,
      ).toBe(true);
    }
  });

  it("names the office for a power only where there is a pantheon", () => {
    // A priest of Amun-Ra serves Amun-Ra and not Osiris; a parish priest
    // serves no named god, and "Parish priest of The Devil" is a bug.
    for (const q of ["New Kingdom Egypt", "medieval Normandy", "1200 Mali"]) {
      const s = settingFor(q);
      for (let i = 0; i < 40; i++) {
        const office = officiantFor(s, "test", `p${i}`);
        if (!office) continue;
        expect(office.label, `${q}: ${office.label}`).not.toMatch(
          /\bof (the|\*)/i,
        );
        if (/parish|imam|minister|monk/i.test(office.label))
          expect(office.label, `${q}: ${office.label}`).not.toMatch(/ of /);
      }
    }
  });

  it("keeps the high offices rare", () => {
    // A settlement of high priests is as wrong as one with no shrine.
    const s = settingFor("New Kingdom Egypt");
    let paramount = 0;
    for (let i = 0; i < 200; i++)
      if (officiantFor(s, "rare", `p${i}`)?.tier === "paramount") paramount++;
    expect(paramount / 200).toBeLessThan(0.1);
  });

  it("draws religious work as a small share of the settlement", () => {
    const s = settingFor("New Kingdom Egypt");
    const ctx = resolveCharacterContext(s);
    let n = 0;
    for (let i = 0; i < 120; i++)
      if (
        characterLivelihood(s, "rel", `p${i}`, undefined, ctx, characterSex("rel", `p${i}`))
          .id === "religious-specialist"
      )
        n++;
    expect(n).toBeGreaterThan(0);
    expect(n / 120).toBeLessThan(0.2);
  });
});
