import { describe, it, expect } from "vitest";
import { beliefsForActor, beliefOptions, beliefSystems } from "../src/content/beliefs/index";
import { officiantsBySystem } from "../src/content/beliefs/officiants.generated";
import { resolveSetting } from "../src/content/geography/resolve";
import { officeAtSanctuary, officiantFor } from "../src/content/characters/officiant";
import { resolveCharacterContext } from "../src/content/characters/resolve";
import {
  characterLivelihood,
  characterSex, generateCharacter,
} from "../src/content/characters/generate";

import { neighborhoodCongregations, religiousProfile, religiousRules } from "../src/content/settlements/religious";
import { interiorProfileFor } from "../src/content/interiors/select";

const settingFor = (q: string) => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(`${q}: ${r.error}`);
  return r.setting;
};

describe("religious offices", () => {
  it("keeps a requested local office through character generation", () => {
    for (const [prompt,role] of [
      ["A priest in Rouen, 1350","Parish priest"], ["An imam in Fez, 1400","Imam"],
      ["A granthi in Amritsar, 1750","Granthi"], ["A rabbi in Thessaloniki, 1700","Rabbi"],
      ["A priest in London, 2020","Priest"],
    ]) {
      const s = settingFor(prompt);
      expect(s.role).toBe(role);
      expect(characterLivelihood(s,"another seed","player",role)).toMatchObject({id:"religious-specialist",label:role});
    }
    expect(resolveCharacterContext(settingFor("Fez 1400")).livelihoods.some(l => l.id === "sexton")).toBe(false);
  });
  it("keeps a person's affiliation through travel and hires for the actual sanctuary", () => {
    const town = settingFor("Thessaloniki, 1700"), elsewhere = settingFor("London, 2020");
    const synagogue = religiousProfile(town), mosque = religiousProfile(settingFor("Fez, 1400"));
    for (const [role,community] of [["Rabbi","ottoman-jewish"],["Imam","ottoman-muslim"],["Deacon","ottoman-christian"]]) {
      for (const seed of ["east","west","north","south"]) {
        const person = generateCharacter(town,seed,"player",34,role);
        const beliefs = beliefsForActor(elsewhere,person);
        expect(person.origin.community).toBe(community);
        expect(person.role).toBe(role);
        expect(beliefs.id).toBe(community);
        expect(officeAtSanctuary(town,role,beliefs,synagogue)).toBe(role === "Rabbi");
        expect(officeAtSanctuary(town,role,beliefs,mosque)).toBe(role === "Imam");
      }
    }
    expect(beliefOptions(elsewhere).reduce((n,b) => n+b.share,0)).toBeCloseTo(100);
    const none = beliefOptions(elsewhere).find(o => o.system.label === "No religious affiliation")!.system;
    expect(officeAtSanctuary(elsewhere,"Priest",none,religiousProfile(elsewhere))).toBe(false);
  });

  it("draws other congregations from locally supported traditions and available town size", () => {
    const sites = (prompt:string, radius:number, seed="faith-audit", school?:string) => {
      const s = settingFor(prompt), primary = religiousProfile(s);
      return primary ? neighborhoodCongregations(s,primary,school,radius,seed,"town").map(c => c.tradition) : [];
    };
    expect(sites("Thessaloniki, 1700",80).sort()).toEqual(["Islam","Orthodox Christian"]);
    expect(sites("Istanbul, 1700",80).sort()).toEqual(["Jewish","Orthodox Christian"]);
    expect(sites("Thessaloniki, 1700",40)).toHaveLength(1);
    expect(sites("Thessaloniki, 1700",28)).toEqual([]);
    expect(sites("Kyoto, 1350",80,"faith-audit","lotus")).toEqual(["pure-land"]);
    expect(sites("Kyoto, 1200",80,"faith-audit","pure-land")).toEqual([]);
    expect(sites("Rouen, 1350",40)).toEqual([]);
    expect(sites("Paris, 1350",90)).toEqual(["Latin Christian"]);
    expect(sites("Damascus, 1400",90)).toEqual(["Islam"]);
    expect(sites("Sydney, 1750",80)).toEqual([]);
    expect(sites("London, 1850",80)).toEqual([]);
    const london = new Set(Array.from({length:40}, (_,i) => sites("London, 2020",80,String(i))).flat());
    expect(london).toEqual(new Set(["Islam","Jewish","Hindu","Sikh"]));
  });

  it("restricts the temple's offices and readings to its school", () => {
    const s = settingFor("Kyoto, 1350"), site = religiousProfile(s)!;
    for (const [id,role,title] of [["pure-land","Pure Land monk","Nembutsu"],["lotus","Nichiren monk","Lotus Sutra"]]) {
      const person = generateCharacter(s,"faith","player",32,role);
      const system = beliefsForActor(s,person);
      expect(person.role).toBe(role);
      expect(officeAtSanctuary(s,role,system,site,id)).toBe(true);
      expect(officeAtSanctuary(s,role,system,site,id === "lotus" ? "pure-land" : "lotus")).toBe(false);
      expect(officeAtSanctuary(s,"Local shrine priest",system,site,id)).toBe(false);
      const room = interiorProfileFor({...s,use:"religious."+site.id,worshipSchool:id});
      expect(room.observance?.service?.passage?.title).toBe(title);
      expect(room.observance?.gathering.passage?.title).toBe(title);
    }
    const titles = new Set(Array.from({length:20},(_,i) => {
      const start = resolveSetting("A monk in Kyoto, 1350","monk-"+i);
      if ("error" in start) throw Error(start.error);
      return start.setting.role;
    }));
    expect(titles).toEqual(new Set(["Nichiren monk","Pure Land monk"]));
    const recognized = new Set(["Pueblo","Christian","Protestant",...religiousRules.flatMap(r => [r.faith,...(r.schools ?? []).map(s => s.id)])]);
    for (const b of beliefSystems) for (const tag of b.worship ?? []) expect(recognized.has(tag),b.id+" / "+tag).toBe(true);
  });

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
