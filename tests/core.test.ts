import { bodyState, bodySummary, diseaseState, diseaseTime, exposure, infect, onsets, mealExposure, healthResearch, updateCourse, severity, resolvedInfection } from "../src/core/health";
import { smallSession } from "./fixtures";
import { describe, it, expect, vi } from "vitest";
import { doorApproach } from "../src/core/doors";
import { createSession, createSettingSession, restoreSession } from "../src/runtime/session";
import { endPlot, startPlot } from "../src/core/plot";
import { composeIntro, introText } from "../src/core/intro";
import { unusualOf } from "../src/core/unusual";
import { createWorld } from "../src/world/generate";
import { packs } from "../src/content/packs";
import { findPath } from "../src/core/pathfinding";
import { canonical } from "../src/core/random";
import { householdStory } from "../src/world/v3/household-story";
import { marriagePracticeFor } from "../src/content/households/practices";
import { lifeAimOf, lifeAimOptions, advanceLifeAim } from "../src/core/life-aim";
import { LIFE_AIM_TEMPLATES } from "../src/content/goals/life-aims";
import { absentChildOf } from "../src/content/bonds";
import { generateCharacter } from "../src/content/characters/generate";
import { livelihoodById } from "../src/content/characters/livelihoods";
import { commandSchema, snapshotSchema } from "../src/runtime/schema";
import { debt } from "../src/content/plots/debt";
import { commission } from "../src/content/plots/commission";
import { PLOTS } from "../src/content/plots";
import { telling } from "../src/core/word";
import { accused } from "../src/content/plots/accused";
import { goodName, sellerOf } from "../src/content/economy/products";
import type { PlotContext, PlotTemplate } from "../src/content/plots/types";
import { settingFor } from "../src/content/geography/resolve";
import { ruled } from "../src/content/history/order";
import { places } from "../src/content/geography/places";
import type { Engine } from "../src/core/engine";
import type { Actor, Household, PlayerCommand, Position, SocialRelation } from "../src/core/types";
let serial = 0;
/** Plots are drawn by weight; a test about one plot gives the draw only that one. */
function drawOnly<T>(plot: PlotTemplate, draw: () => T) {
  const all = PLOTS.splice(0, PLOTS.length, plot);
  try {
    return draw();
  } finally {
    PLOTS.splice(0, 1, ...all);
  }
}
const act = (e: Engine, command: PlayerCommand) =>
  e.act({
    actionId: `test-${serial++}`,
    expectedRevision: e.state.revision,
    command,
  });

describe("exposure, symptoms and care", () => {
  const setting = settingFor(places.find((p) => p.id === "london")!, 1980);
  function clinic() {
    const e = smallSession(setting, "disease-fixture");
    delete e.state.plot;
    e.state.ailments = [];
    e.state.actors = e.state.actors.slice(0, 2);
    const p = e.state.player, doctor = e.state.actors[0];
    p.pos = { ...p.home, space: "clinic" };
    doctor.pos = { ...p.pos, x: p.pos.x + 1 };
    doctor.role = "Doctor";
    doctor.medicalStock = { antibiotic: 2, rehydration: 2 };
    p.inventory.coin = 20;
    return e;
  }
  function symptomatic(e: Engine, id = "cough", who = e.state.player) {
    const ail = infect(e.state, id, who, setting, e.state.clock, "fixture source", "air");
    ail.since = e.state.clock - 86400;
    ail.days = 6;
    ail.infection!.mortality = 0;
    e.state.ailments!.push(ail);
    return ail;
  }

  it("accumulates indoor contact by duration, permits exposure before symptoms, and reduces outdoor exposure", () => {
    const a = clinic(), b = clinic(), outside = clinic();
    for (const e of [a, b, outside]) {
      const ill = symptomatic(e, "cough", e.state.actors[0]);
      ill.since = e.state.clock + 6 * 3600;
    }
    outside.state.player.pos.space = outside.state.actors[0].pos.space = "outside";
    const clock = a.state.clock;
    diseaseTime(a.state, 3600, clock);
    for (let n = 0; n < 60; n++) diseaseTime(b.state, 60, clock + n * 60);
    diseaseTime(outside.state, 3600, clock);
    const dose = (e: Engine) => diseaseState(e.state).exposures.find((x) => x.who === "player")!.dose;
    expect(dose(a)).toBeCloseTo(dose(b), 12);
    expect(dose(outside)).toBeLessThan(dose(a) / 5);
    expect(severity(a.state.ailments![0], clock)).toBe(0);
    for (const e of [a, b]) e.state.clock += 3600;
    expect(onsets(a.state, setting, new Set())).toEqual(onsets(b.state, setting, new Set()));
  });

  it("keeps incubation and infection sources out of observations, while retaining research truth", () => {
    const e = clinic(), clock = e.state.clock;
    exposure(e.state, e.state.player, "cough", "infectious-person", "air", 1000, clock);
    e.state.clock += 3600;
    e.state.ailments!.push(...onsets(e.state, setting, new Set()));
    const ail = e.state.ailments!.find((a) => a.who === "player")!;
    expect(ail.since).toBeGreaterThan(e.state.clock + 23 * 3600);
    expect(bodyState(e.state).illnesses).toEqual([]);
    expect(healthResearch(e.state)?.illnesses[0].infection?.source).toBe("infectious-person");
    e.state.clock = ail.since + 60;
    expect(bodyState(e.state).illnesses[0]).toMatchObject({ symptoms: ["cough", "feverishness", "tiredness"], trend: "worsening" });
    expect(bodyState(e.state).illnesses[0]).not.toHaveProperty("id");
    expect(bodySummary(e.state)).not.toMatch(/infectious-person|mortality|course|source/);
    expect(snapshotSchema.parse(e.snapshot()).disease).toEqual(e.state.disease);
  });

  it("shares contaminated provisions within a household and lets preparation prevent further exposures", () => {
    const e = clinic(), p = e.state.player, kin = e.state.actors[0], other = e.state.actors[1];
    const home = e.state.households![0];
    home.members = [p.id, kin.id];
    p.householdId = kin.householdId = home.id;
    diseaseState(e.state).sources.push({ id: "shared-meal", household: home.id, until: e.state.clock + 86400 });
    for (const a of [p, kin, other]) mealExposure(e.state, a, e.state.clock);
    expect(diseaseState(e.state).exposures.map((x) => x.who).sort()).toEqual([p.id, kin.id].sort());
    p.pos = { ...home.home };
    expect(act(e, { type: "care", target: p.id, treatment: "prepare-food" }).status).toBe("completed");
    const before = structuredClone(diseaseState(e.state).exposures);
    mealExposure(e.state, p, e.state.clock);
    mealExposure(e.state, kin, e.state.clock);
    expect(diseaseState(e.state).exposures).toEqual(before);
    expect(e.careOptions().find((o) => o.treatment === "prepare-food")?.unavailable).toContain("already");
  });

  it("distinguishes an open wound from a sprain, and dressing prevents new exposure without curing an infection", () => {
    const e = clinic(), p = e.state.player, clock = e.state.clock;
    p.injury = { name: "sprained ankle", until: clock + 86400 };
    diseaseTime(e.state, 600, clock);
    expect(e.state.disease?.exposures ?? []).toEqual([]);
    p.injury = { name: "a cut", until: clock + 86400, since: clock, open: true };
    diseaseTime(e.state, 600, clock);
    expect(diseaseState(e.state).exposures[0].disease).toBe("wound");
    const ail = symptomatic(e, "wound");
    expect(act(e, { type: "care", target: p.id, treatment: "clean-wound" }).status).toBe("completed");
    expect(e.state.ailments).toContain(ail);
    const dose = diseaseState(e.state).exposures[0].dose;
    diseaseTime(e.state, 600, e.state.clock);
    expect(diseaseState(e.state).exposures[0].dose).toBe(dose);
  });

  it("validates practitioner access and stock, charges for specific treatment, and makes care change the course", () => {
    const e = clinic(), p = e.state.player, doctor = e.state.actors[0];
    const ail = symptomatic(e, "wound"), i = ail.infection!;
    i.roll = 0.5; i.mortality = 0.9;
    updateCourse(ail, e.state.clock);
    expect(ail.course).toBe("die");
    expect(severity(ail, ail.since + ail.days * 86400 + 1)).toBe(1);
    doctor.medicalStock!.antibiotic = 0;
    expect(act(e, { type: "care", target: p.id, treatment: "medicine" }).status).toBe("rejected");
    expect(p.inventory.coin).toBe(20);
    doctor.medicalStock!.antibiotic = 1;
    doctor.pos.space = "outside";
    expect(e.careOptions().find((o) => o.treatment === "medicine")?.unavailable).toBeTruthy();
    doctor.pos = { ...p.pos, x: p.pos.x + 1 };
    expect(act(e, { type: "care", target: p.id, treatment: "medicine" }).status).toBe("completed");
    expect(p.inventory.coin).toBe(17);
    expect(doctor.medicalStock!.antibiotic).toBe(0);
    updateCourse(ail, e.state.clock);
    expect(ail.course).toBe("die");
    e.state.clock += 12 * 3600;
    updateCourse(ail, e.state.clock);
    expect(ail.course).toBe("mend");
    expect(e.state.disease?.events.some((x) => x.kind === "treatment" && x.treatment === "medicine")).toBe(true);
    ail.id = "cough";
    expect(e.careOptions().find((o) => o.treatment === "medicine")?.unavailable).toContain("infected wound");
  });

  it("offers symptom-based care, allows later care, and never treats conversation as a cure", () => {
    const e = clinic(), ail = symptomatic(e);
    e.healthStep(e.state.clock, false);
    const card = e.cards.find((c) => c.choose?.card === "care-symptoms")!;
    expect(card.text).toContain("cough");
    expect(card.choose!.choices.map((c) => c.label)).not.toContain("Clean and dress the wound");
    expect(card.choose!.choices.every((c) => c.odds === undefined && !c.unavailable)).toBe(true);
    expect(act(e, { type: "choose", card: "care-symptoms", choice: card.choose!.choices.at(-1)!.index }).status).toBe("completed");
    expect(act(e, { type: "care", target: "player", treatment: "consult" }).status).toBe("completed");
    expect(bodySummary(e.state)).toContain("assessed by");
    expect(bodySummary(e.state)).toContain("cause is uncertain");
    const npc = symptomatic(e, "flux", e.state.actors[1]);
    npc.infection!.mortality = 1; npc.infection!.roll = 0.5;
    e.state.kin = { since: e.state.clock, talked: { [npc.who]: e.state.clock }, said: {} };
    e.healthStep(e.state.clock, false);
    expect(npc.course).toBe("die");
    expect(npc.tended).toBeUndefined();
    expect(ail.infection?.assessment).toBeDefined();
  });

  it("sends the player to a sick relative who is out of reach, and asks again on arrival", () => {
    const e = clinic(), p = e.state.player, child = e.state.actors[1];
    p.relations = [{ kind: "child", other: child.id }];
    child.pos = { ...p.home, space: "outside" };
    symptomatic(e, "flux", child);
    e.healthStep(e.state.clock, false);
    const card = e.cards.find((c) => c.choose?.card === "care-symptoms")!;
    expect(card.text).toContain("diarrhea");
    expect(card.choose!.choices.map((c) => c.label)).toEqual([`Go to ${child.name.split(" ")[0]}`, "Carry on with your day"]);
    act(e, { type: "choose", card: "care-symptoms", choice: 0 });
    expect(e.lastChoice?.go).toBe(child.id);
    expect(e.state.care?.who).toBe(child.id);
    p.pos = { ...child.pos, x: child.pos.x + 1 };
    e.cards.length = 0;
    e.reofferCard();
    expect(e.cards[0].choose!.choices.map((c) => c.label)).toContain(`Sit with ${child.name.split(" ")[0]}`);
  });

  it("records recovery and temporary protection without making wound infection confer immunity", () => {
    const e = clinic(), ail = symptomatic(e), p = e.state.player;
    resolvedInfection(e.state, ail, p, e.state.clock);
    e.state.ailments = [];
    exposure(e.state, p, "cough", "another-person", "air", 1000, e.state.clock);
    expect(diseaseState(e.state).exposures).toEqual([]);
    e.state.clock = p.immune!.cough + 1;
    exposure(e.state, p, "cough", "another-person", "air", 1000, e.state.clock);
    expect(diseaseState(e.state).exposures).toHaveLength(1);
    expect(e.state.disease?.events.at(-1)?.kind).toBe("recovery");
    const wound = symptomatic(e, "wound");
    resolvedInfection(e.state, wound, p, e.state.clock);
    expect(p.immune?.wound).toBeUndefined();
  });

  it("keeps care options appropriate to the period and makes nursing an enteric case an exposure", () => {
    const e = clinic(), patient = e.state.actors[0];
    const ail = symptomatic(e, "flux", patient);
    e.world.pack.setting = { ...e.world.pack.setting!, year: 1650 };
    expect(e.careOptions().map((o) => o.treatment)).not.toContain("medicine");
    expect(e.careOptions().map((o) => o.treatment)).not.toContain("rehydration");
    expect(act(e, { type: "care", target: patient.id, treatment: "nurse" }).status).toBe("completed");
    expect(ail.infection!.careUntil).toBeGreaterThan(e.state.clock);
    expect(e.state.disease?.events.some((x) => x.kind === "exposure" && x.detail === "care" && x.who === "player")).toBe(true);
  });
});
function reach(e: Engine, target: Position) {
  const p = e.state.player.pos;
  for (const [dx, dy] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 0],
  ]) {
    const path = findPath(p, { x: target.x + dx, y: target.y + dy }, (x, y) =>
      e.blocked(x, y),
    );
    if (path.length) {
      for (const step of path)
        expect(
          act(e, { type: "move", dx: step.x - p.x, dy: step.y - p.y }).status,
        ).toBe("completed");
      return;
    }
  }
  throw Error("No route");
}
describe("shared deterministic foundation", () => {
  it("initializes both directions of household authority without confusing servants and apprentices", () => {
    const e = createSession("roman", "authority-check");
    e.state.households = [{ id: "home", members: ["player"], home: e.state.player.home, storeId: "store" }];
    const links: { kind: SocialRelation["kind"]; reverse: SocialRelation["kind"]; role?: string; recorded?: boolean }[] = [
      { kind: "parent", reverse: "child" },
      { kind: "child", reverse: "parent" },
      { kind: "partner", reverse: "partner" },
      { kind: "co-resident", reverse: "co-resident" },
      { kind: "friend", reverse: "friend" },
      { kind: "servant", reverse: "master" },
      { kind: "apprentice", reverse: "master" },
      { kind: "master", reverse: "servant", recorded: true },
      { kind: "master", reverse: "apprentice", recorded: true },
      { kind: "master", reverse: "servant", role: "Servant" },
      { kind: "master", reverse: "apprentice", role: "Apprentice potter" },
    ];
    e.state.actors = links.map((link, i) => ({
      ...structuredClone(e.state.player), id: `member-${i}`, role: link.role ?? "Potter", origin: undefined,
      relations: [{ other: "player", kind: link.kind, ...(link.recorded ? { reciprocal: link.reverse } : {}) }],
    }));
    e.initialize("authority-check");
    expect(e.state.player.relations).toEqual(links.map((link, i) => ({
      other: `member-${i}`, kind: link.reverse, reciprocal: link.kind,
    })));
  });

  it("varies new player relationships without implying a wedding where none is authored", () => {
    let partnered = 0, widowed = 0;
    for (let i = 0; i < 300; i++) {
      const story = householdStory({
        seed: `relationship-${i}`, id: "player-house", year: 1200, age: 50,
        sex: i % 2 ? "female" : "male", means: 0.6, shared: false,
        extended: true, small: false, craft: false, player: true,
        modern: false, revised: true, formalMarriage: false,
        built: 1180, fabric: "timber",
      });
      partnered += story.residents.some((r) => r.toHead === "partner") ? 1 : 0;
      widowed += story.history.some((e) => e.kind === "died" && e.as === "partner") ? 1 : 0;
      expect(story.history.some((e) => e.kind === "wed")).toBe(false);
    }
    expect(partnered).toBeGreaterThan(50);
    expect(partnered).toBeLessThan(290);
    expect(widowed).toBeGreaterThan(0);
  });

  it("offers a marriage aim only for an explicit, locally scoped family plan", () => {
    const roman = settingFor(places.find((p) => p.id === "rome")!, 100);
    const konya = settingFor(places.find((p) => p.id === "konya")!, -6499);
    expect(marriagePracticeFor(roman)).toBeDefined();
    expect(marriagePracticeFor(konya)).toBeUndefined();
    const base = createSession("roman", "aim-subject").state.player;
    const player = { ...base, relations: [{ other: "child", kind: "child" as const }] };
    const child = {
      ...base, id: "child", name: "Aelia", age: 19, householdId: "home",
      relations: [{ other: "player", kind: "parent" as const }],
    } as Actor;
    const household: Household = {
      id: "home", members: ["player", "child"], home: player.home,
      storeId: "store", familyPlans: [{ kind: "seek-match", subject: "child" }],
    };
    const withPlan = Array.from({ length: 40 }, (_, i) =>
      lifeAimOf(`aim-${i}`, roman, player, [child], [household]).id
    );
    expect(withPlan).toContain("marriage-hope");
    expect(lifeAimOptions("aim-0", roman, player, [child], [{ ...household, familyPlans: [] }]).map((a) => a.id))
      .not.toContain("marriage-hope");
    expect(lifeAimOptions("aim-0", konya, player, [child], [household]).map((a) => a.id))
      .not.toContain("marriage-hope");
  });

  it("grounds life-aim sentences in known kin, age, place, and hardship", () => {
    const setting = settingFor(places.find((p) => p.id === "konya")!, -6499);
    const base = createSession("roman", "aim-wording").state.player;
    const player: Actor = {
      ...base,
      origin: { ...base.origin!, livelihood: "farmer", roleLabel: "Farmer" },
      relations: [{ other: "child", kind: "child" }],
    };
    const child: Actor = {
      ...base, id: "child", name: "Nawelkura", age: 7, householdId: "home",
      origin: { ...base.origin!, sex: "female" },
    };
    const household: Household = {
      id: "home", members: [player.id, child.id], home: player.home, storeId: "store",
    };
    expect(lifeAimOptions("aim-wording", setting, player, [child], [household]).find((a) => a.id === "raise-kin")!.text)
      .toContain("Nawelkura, your 7-year-old daughter");

    child.age = 19;
    const grown = lifeAimOptions("aim-wording", setting, player, [child], [household]).find((a) => a.id === "child-future")!;
    expect(grown.text).toContain("Nawelkura, your 19-year-old daughter");
    expect(grown.text).toContain(`in ${setting.location}`);

    player.relations = [];
    household.fortune = 0.2;
    household.history = [{ year: setting.year - 1, kind: "fire" }];
    const hardship = lifeAimOptions("aim-wording", setting, player, [child], [household]).find((a) => a.id === "restore-household")!;
    expect(hardship.text).toContain(`in ${setting.location} after the fire`);
  });

  it("shares departure facts with the intro and drops a departure after a return or death", () => {
    const setting = settingFor(places.find((p) => p.id === "rome")!, 100);
    const e = createSession("roman", "aim-away");
    const home: Household = { id: "home", members: [e.state.player.id], home: e.state.player.home, storeId: "store" };
    e.state.households = [home];
    home.history = [{ year: 99, kind: "left", as: "son", name: "Marcus" }];
    const departure = absentChildOf(e.state.manifest.seed, home.history, setting)!;
    const options = lifeAimOptions(e.state.manifest.seed, setting, e.state.player, e.state.actors, e.state.households);
    const aim = options.find((a) => a.id === "absent-child")!;
    expect(aim.text).toContain(departure.why);
    expect(aim.text.includes("no news")).toBe(departure.noWord);
    expect(introText(composeIntro(e.state, setting, "Rome"))).toContain(departure.why);
    expect(aim.subjects).toEqual([]);
    for (const kind of ["joined", "died"] as const) {
      home.history.push({ year: 100, kind, as: "son", name: "Marcus" });
      expect(absentChildOf(e.state.manifest.seed, home.history, setting)).toBeUndefined();
      expect(lifeAimOptions("aim-away", setting, e.state.player, e.state.actors, e.state.households).some((a) => a.id === "absent-child")).toBe(false);
      home.history.pop();
    }
  });

  it("requires real living subjects for care, bonds, and debt", () => {
    const setting = settingFor(places.find((p) => p.id === "rome")!, 100);
    const e = createSession("roman", "aim-facts");
    const player = { ...e.state.player, relations: [{ kind: "child" as const, other: "child" }] };
    const child = { ...player, id: "child", name: "Aelia", age: 10, householdId: "home", relations: [] };
    const other = { ...player, id: "other", name: "Lucius", age: 35, householdId: "supplier", relations: [] };
    const households: Household[] = [
      { id: "home", members: [player.id, child.id], home: player.home, storeId: "home-store", owes: "supplier" },
      { id: "supplier", members: [other.id], home: other.home, storeId: "other-store" },
    ];
    const facts = { clock: 86400, ailments: [{ id: "fever", who: child.id, since: 0, days: 6, course: "die" as const }],
      bonds: [{ kind: "beloved" as const, with: other.id, mutual: true, secret: true }] };
    const aims = lifeAimOptions("facts", setting, player, [child, other], households, facts);
    expect(aims.find((a) => a.id === "care-through-illness")?.subjects).toEqual([child.id]);
    expect(aims.find((a) => a.id === "clear-obligation")?.subjects).toEqual([other.id]);
    expect(aims.find((a) => a.id === "beloved-future")?.text).toContain("private");
    const dead = lifeAimOptions("facts", setting, player, [{ ...child, dead: "fever" }, { ...other, dead: "fever" }], households, facts);
    expect(dead.every((a) => a.subjects.length === 0)).toBe(true);
    expect(dead.some((a) => ["care-through-illness", "clear-obligation", "beloved-future"].includes(a.id))).toBe(false);
    expect(lifeAimOptions("facts", setting, player, [child, other], households, { ...facts, clock: 7 * 86400 }).some((a) => a.id === "care-through-illness")).toBe(false);
  });

  it("scopes local opportunities by date, place, work, and available people", () => {
    const base = createSession("roman", "aim-scopes").state.player;
    const parent: Actor = { ...base, age: 40, origin: { ...base.origin!, standing: "free", livelihood: "farmer", roleLabel: "Farmer" }, relations: [{ kind: "child", other: "child" }] };
    const child: Actor = { ...base, id: "child", name: "Isidora", age: 12, householdId: "home", origin: { ...base.origin!, sex: "female" } };
    const teacher: Actor = { ...base, id: "weaver", name: "Libouke", age: 40, householdId: "other", role: "Weaver", activity: "Weaving", origin: { ...base.origin!, standing: "free", roleLabel: "Weaver" } };
    const home: Household = { id: "home", members: [parent.id, child.id], home: parent.home, storeId: "store" };
    const fayum = { ...settingFor(places.find((p) => p.id === "nile")!, 271), lon: 30.8, lat: 29.5 };
    const options = (year: number, people: Actor[], p = parent) => lifeAimOptions("scopes", { ...fayum, year }, p, people, [home]);
    expect(options(271, [child, teacher]).find((a) => a.id === "fayum-weaving-training")?.subjects).toEqual([child.id, teacher.id]);
    expect(options(271, [child]).some((a) => a.id === "fayum-weaving-training")).toBe(false);
    expect(options(300, [child, teacher]).some((a) => a.id === "fayum-weaving-training")).toBe(false);
    expect(options(271, [child, teacher], { ...parent, origin: { ...parent.origin!, standing: "unfree" } }).some((a) => a.id === "fayum-weaving-training")).toBe(false);
    const apprentice: Actor = { ...parent, origin: { ...parent.origin!, livelihood: "apprentice", roleLabel: "Apprentice Weaver" }, relations: [] };
    for (const [place, year, id] of [["city-florence", 1500, "florence-workshop-learning"], ["london", 1750, "london-apprentice-standing"]] as const) {
      const setting = settingFor(places.find((p) => p.id === place)!, year);
      expect(lifeAimOptions("scopes", setting, apprentice, [], []).map((a) => a.id)).toContain(id);
      expect(lifeAimOptions("scopes", { ...setting, year: -6499 }, apprentice, [], []).map((a) => a.id)).not.toContain(id);
      const unnamed = { ...apprentice, origin: { ...apprentice.origin!, roleLabel: "Apprentice" } };
      expect(lifeAimOptions("scopes", setting, unnamed, [], []).every((a) => !a.text.includes("apprentice's work"))).toBe(true);
    }
  });

  it("keeps family selection unchanged when a family gains equivalent variants", () => {
    const setting = settingFor(places.find((p) => p.id === "konya")!, -6499);
    const player = createSession("neolithic", "aim-families").state.player;
    const seeds = Array.from({ length: 200 }, (_, i) => `family-${i}`);
    const before = seeds.map((seed) => lifeAimOf(seed, setting, player, [], []).family);
    const fallback = LIFE_AIM_TEMPLATES.find((a) => a.id === "make-a-life")!;
    const count = LIFE_AIM_TEMPLATES.length;
    try {
      for (let i = 0; i < 20; i++) LIFE_AIM_TEMPLATES.push({ ...fallback, id: `extra-${i}`, family: "livelihood" });
      expect(seeds.map((seed) => lifeAimOf(seed, setting, player, [], []).family)).toEqual(before);
    } finally { LIFE_AIM_TEMPLATES.splice(count); }
  });

  it("generates varied, grounded and reproducible aims across six historical contexts", () => {
    const base = createSession("roman", "aim-audit").state.player;
    const contexts = [["rome", 100], ["konya", -6499], ["city-florence", 1500], ["london", 1750], ["kyoto", 1700], ["nile", 271]] as const;
    for (const [place, year] of contexts) {
      const setting = { ...settingFor(places.find((p) => p.id === place)!, year), characterRevision: 2 as const };
      const families = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const seed = `aim-audit-${place}-${i}`;
        const generated = generateCharacter(setting, seed, "player", 38);
        const player: Actor = { ...base, ...generated, age: 38, householdId: "home", activity: livelihoodById(generated.origin.livelihood)?.activity ?? "Working", relations: [{ kind: "child", other: "child" }] };
        const child: Actor = { ...base, id: "child", name: "Child", age: i % 2 ? 8 : 19, householdId: "home", origin: { ...base.origin!, sex: "female" } };
        const home: Household = { id: "home", members: [player.id, child.id], home: player.home, storeId: "store", fortune: i % 3 ? 0.6 : 0.2,
          history: [{ kind: "built", year: year - 10 }, { kind: "fire", year: year - 1 }] };
        const aim = lifeAimOf(seed, setting, player, [child], [home]);
        expect(aim).toEqual(lifeAimOf(seed, setting, player, [child], [home]));
        expect(snapshotSchema.shape.lifeAim.parse(aim)).toEqual(aim);
        expect(aim.text).not.toMatch(/undefined|\{|choices of their own|apprentice's work/);
        if (player.origin?.standing === "unfree") expect(aim.id).not.toBe("quiet-sufficiency");
        expect(aim.subjects.every((id) => id === child.id)).toBe(true);
        expect(aim.basis?.reason).toBeTruthy();
        expect(aim.basis?.means).toBeTruthy();
        if (aim.basis?.evidence) expect(aim.basis.evidence.sources.length).toBeGreaterThan(0);
        families.add(aim.family!);
      }
      expect(families.size, place).toBeGreaterThanOrEqual(4);
    }
  });

  it("advances only the named person's step through a real conversation", () => {
    const e = createSession("roman", "aim-conversation");
    const people = e.state.actors.filter((a) => a.kind === "human");
    const subject = people[0], other = people[1];
    expect(subject).toBeDefined();
    expect(other).toBeDefined();
    subject.pos = { ...e.state.player.pos };
    other.pos = { ...e.state.player.pos };
    subject.trust = 1;
    other.trust = 1;
    e.state.lifeAim = {
      id: "kin", text: "Keep in touch with kin.", subjects: [subject.id], revision: 1,
      step: { type: "talk", actor: subject.id, text: `Speak with ${subject.name}.` },
    };
    expect(act(e, { type: "interact", target: other.id, action: "talk" }).status).toBe("completed");
    expect(e.state.lifeAim.step?.type === "talk" && e.state.lifeAim.step.done).toBeFalsy();
    subject.pos = { ...e.state.player.pos };
    expect(act(e, { type: "interact", target: subject.id, action: "talk" }).status).toBe("completed");
    expect(e.state.lifeAim.step?.type === "talk" && e.state.lifeAim.step.done).toBe(true);
    expect(advanceLifeAim(e.state, { type: "talk", actor: subject.id })).toBe(false);
    e.state.lifeAim.step = {
      type: "give", actor: subject.id, items: ["water"], text: `Bring water to ${subject.name}.`,
    };
    e.state.player.heldItem = "water";
    subject.pos = { ...e.state.player.pos };
    const water = subject.inventory.water ?? 0;
    expect(act(e, { type: "give", target: subject.id, item: "water" }).status).toBe("completed");
    expect(subject.inventory.water).toBe(water + 1);
    expect(e.state.lifeAim.step.done).toBe(true);
    e.state.lifeAim.step = { type: "work", target: 3, progress: 0, text: "Practise your trade." };
    expect(advanceLifeAim(e.state, { type: "work" })).toBe(false);
    expect(advanceLifeAim(e.state, { type: "work" })).toBe(false);
    expect(advanceLifeAim(e.state, { type: "work" })).toBe(true);
    expect(advanceLifeAim(e.state, { type: "work" })).toBe(false);
  });
  it("binds a seeded debt, sends the creditor over, and ends it by payment or seizure", () => {
    const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
    const e = createSettingSession(setting, "b");
    delete e.state.plot;
    const plot = drawOnly(debt, () => startPlot(e.state, setting))!;
    expect(plot.id).toBe("debt");
    expect(e.state.lifeAim?.id).toBe("plot:debt");
    const again = structuredClone(e.state);
    delete again.plot;
    expect(drawOnly(debt, () => startPlot(again, setting))?.cast).toEqual(plot.cast);

    const creditor = e.state.actors.find((a) => a.id === plot.cast.creditor)!;
    for (let i = 0; i < 30 && !e.approacher; i++) act(e, { type: "wait", seconds: 60 });
    expect(e.approacher?.id).toBe(creditor.id);
    expect(e.cards.find((c) => c.kind === "speech")?.text).toContain(plot.words.amount);

    const coin = e.item("coin")!.value, owed = plot.owed!;
    e.state.player.inventory.coin = 3;
    expect(act(e, { type: "interact", target: creditor.id, action: "pay" }).status).toBe("completed");
    expect(plot.owed).toBe(owed - 3 * coin);
    expect(plot.ended).toBeUndefined();

    const home = e.state.households!.find((h) => h.members.includes(e.state.player.id))!;
    const store = e.state.objects.find((o) => o.id === home.storeId)!;
    store.inventory = { ...store.inventory, coin: 20 };
    plot.deadline = e.state.clock;
    act(e, { type: "wait", seconds: 120 });
    expect(plot.fired).toEqual(["opening", "remind", "seize"]);
    expect(plot.ended).toBe("seized");
    expect(e.state.lifeAim?.id).toBe(plot.aim?.id);

    // Reopened by hand: with the credit cleared, a fresh draw may pick another plot.
    const next = e.state.plot = { ...plot, ended: undefined, fired: ["opening"], owed: plot.total, seized: undefined };
    creditor.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    e.state.player.inventory.coin = next.owed!;
    expect(act(e, { type: "interact", target: creditor.id, action: "pay" }).status).toBe("completed");
    expect(next.ended).toBe("paid");

    delete e.state.plot;
    const charge = drawOnly(accused, () => startPlot(e.state, setting))!;
    const witness = e.state.actors.find((a) => a.id === charge.cast.witness)!;
    witness.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    act(e, { type: "interact", target: witness.id, action: "talk" });
    expect(charge.ended).toBe("cleared");
  });
  it("ends an order only when the work is brought after the day's work is done", () => {
    const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
    const e = createSettingSession(setting, "b");
    e.state.player.origin = { ...e.state.player.origin!, livelihood: "carpenter" };
    delete e.state.plot;
    const order = drawOnly(commission, () => startPlot(e.state, setting))!;
    const patron = e.state.actors.find((a) => a.id === order.cast.patron)!;
    patron.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    act(e, { type: "interact", target: patron.id, action: "talk" });
    expect(order.ended).toBeUndefined();
    order.fired.push("worked");
    act(e, { type: "interact", target: patron.id, action: "talk" });
    expect(order.ended).toBe("delivered");
  });
  it("calls up a levy or asks for rent only where a ruler could count households", () => {
    const at = (id: string, year: number) => ruled(settingFor(places.find((p) => p.id === id)!, year));
    expect(at("city-colider", 250)).toBe(false);
    expect(at("london", -200)).toBe(false);
    expect(at("cusco-city", 1450)).toBe(true);
    expect(at("rome", 100)).toBe(true);
  });
  it("binds the recorded debt to its real seller and product, never the eldest relative or first purchase", () => {
    const setting = { ...settingFor(places.find((p) => p.id === "city-multan")!, -620), economyRevision: 1 as const };
    const snapshot = createSession("roman", "credit-fixture").state;
    const player = snapshot.player;
    const sage = { ...player, id: "sage", name: "Aruni", role: "Forest sage", age: 75, householdId: "supplier" };
    const spinner = { ...sage, id: "spinner", role: "Spinner", age: 45 };
    const brewer = { ...sage, id: "brewer", name: "Mitra", role: "Brewer", age: 32 };
    const supplier: Household = {
      id: "supplier", members: [sage.id, spinner.id, brewer.id], home: player.home, storeId: "s",
      fortune: 0.8, makes: ["cloth", "drink"], producers: { cloth: spinner.id, drink: brewer.id },
      products: { cloth: "cloth", drink: "vedic-sura" },
    };
    const home: Household = {
      id: "home", members: [player.id], home: player.home, storeId: "h", fortune: 0.2,
      buys: [{ from: supplier.id, good: "cloth", seller: spinner.id, product: "cloth" },
        { from: supplier.id, good: "drink", seller: brewer.id, product: "vedic-sura" }],
      owes: supplier.id,
      credit: { from: supplier.id, good: "drink", seller: brewer.id, product: "vedic-sura",
        debtor: player.id, amount: 7, reason: "household", repayment: "produce" },
    };
    const c: PlotContext = { setting, seed: "credit", clock: 8 * 3600, player,
      actors: [sage, spinner, brewer], household: home, households: [home, supplier] };
    const cast = debt.cast(c)!;
    expect(cast.creditor?.id).toBe(brewer.id);
    const begun = debt.begin(c, cast);
    expect(begun.words.good).toBe(goodName("drink", home.credit!.product));
    expect(begun.owed).toBe(7);
    expect(begun.refs?.creditor).toBe(brewer.id);
    expect(sellerOf({ ...home.credit!, seller: sage.id }, c.households, c.actors)).toBeUndefined();
    supplier.fortune = 0.1;
    expect(debt.cast(c)?.creditor?.id).toBe(brewer.id);
    brewer.dead = "fever";
    expect(debt.cast(c)).toBeUndefined();
    delete brewer.dead;
    snapshot.households = c.households;
    snapshot.actors = c.actors;
    delete snapshot.plot;
    const plot = drawOnly(debt, () => startPlot(snapshot, setting))!;
    expect(plot.cast.creditor).toBe(brewer.id);
    plot.owed = 0;
    expect(endPlot(snapshot)?.id).toBe("paid");
    expect(home.credit).toBeUndefined();
    expect(home.owes).toBeUndefined();
  });
  it.runIf(!!process.env.FULL)("opens a life with one card naming the player, the place and the plot's people", () => {
    const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
    const e = createSettingSession(setting, "b");
    act(e, { type: "wait", seconds: 60 });
    act(e, { type: "wait", seconds: 60 });
    const titles = e.cards.filter((c) => c.kind === "title");
    expect(titles).toHaveLength(1);
    expect(titles[0].text).toContain(`You are ${e.state.player.name}`);
    expect(titles[0].text).not.toMatch(/undefined|[{}]/);
    expect(titles[0].aim).toBe(e.state.plot!.aim!.text);
    expect(e.state.plot!.aim!.revision).toBe(2);
    expect(titles[0].intro!.body.flat().map((s) => s.ref)).toContain(Object.values(e.state.plot!.cast)[0]);
    expect(composeIntro(e.state, setting, "London")).toEqual(composeIntro(structuredClone(e.state), setting, "London"));
  });
  it("remarks only on what is rare", () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const p = e.state.player, setting = e.world.pack.setting;
    p.stats = { strength: 50, agility: 50, endurance: 50, wit: 50, openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
    expect(unusualOf(e.state.manifest.seed, p, setting, e.state.actors)).toEqual([]);
    p.stats.strength = 90;
    expect(composeIntro(e.state, setting, "London").uncommon).toBe("Nobody in London is stronger than you, and everyone knows it.");
  });
  it("opens on a sick child, keeps them in bed, and lets the illness run its course", () => {
    const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
    const e = smallSession(setting, "b");
    delete e.state.plot;
    const child = e.state.actors.find((a) => a.kind === "human" && a.id !== e.state.player.id && a.householdId && !a.mount && !a.tends && !a.guard)!;
    child.age = 8;
    e.state.player.relations = [...(e.state.player.relations ?? []), { other: child.id, kind: "child" }];
    e.state.ailments = [{ id: "fever", who: child.id, since: e.state.clock - 3 * 86400, days: 6, course: "die" }];
    expect(introText(composeIntro(e.state, setting, "London"))).toContain(`${child.name} has had a fever for three days`);
    act(e, { type: "wait", seconds: 60 });
    expect(child.activity).toBe("Laid up with a fever");
    e.state.ailments[0].since = e.state.clock - 6 * 86400 + 60;
    act(e, { type: "wait", seconds: 3600 });
    expect(e.state.actors.some((a) => a.id === child.id)).toBe(false);
    expect(e.state.households!.find((h) => h.id === child.householdId)!.history!.at(-1)).toMatchObject({ kind: "died", name: child.name });
    expect(e.cards.find((c) => c.kind === "turn")?.text).toContain(`${child.name}, your`);
  });
  it("asks what to do when the player falls ill, weakens them, can kill them, and goes on as their household", () => {
    const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
    const e = smallSession(setting, "b");
    delete e.state.manifest.disease;
    delete e.state.plot;
    const p = e.state.player, strong = e.stats().strength;
    (e as unknown as { fallIll(id: string): void }).fallIll("fever");
    const care = e.cards.find((c) => c.choose)!.choose!;
    const pendingCare = structuredClone(e.state.care);
    e.cards.length = 0;
    e.reofferCard();
    expect(e.cards.find((c) => c.choose)?.choose?.card).toBe(care.card);
    expect(e.state.care).toEqual(pendingCare);
    expect(care.card).toMatch(/^care-self/);
    expect(care.choices.map((c) => c.label)).toContain("Go to bed and rest");
    expect(act(e, { type: "choose", card: care.card, choice: care.choices.find((c) => !c.unavailable)!.index }).status).toBe("completed");
    expect(e.state.care).toBeUndefined();
    const fever = e.state.ailments!.find((a) => a.who === p.id)!;
    Object.assign(fever, { course: "die", since: e.state.clock - 3 * 86400, days: 6, tended: true });
    expect(e.stats().strength).toBeLessThan(strong);
    fever.since = e.state.clock - 6 * 86400 + 60;
    act(e, { type: "wait", seconds: 3600 });
    expect(e.state.player.dead).toBe("of the fever");
    const home = e.state.households!.find((h) => h.members.includes("player"))!;
    let heir = e.heirs()[0];
    if (!heir) {
      heir = e.state.actors.find((a) => a.kind === "human" && (a.age ?? 0) >= 16 && !a.mount && !a.tends && !a.guard)!;
      heir.householdId = home.id;
      home.members.push(heir.id);
    }
    const dead = p.name, name = heir.name;
    expect(act(e, { type: "become", heir: heir.id }).status).toBe("completed");
    expect(e.state.player.name).toBe(name);
    expect(e.state.player.dead).toBeUndefined();
    expect(e.state.actors.some((a) => a.id === heir.id)).toBe(false);
    expect(home.members).toContain("player");
    expect(home.history!.at(-1)).toMatchObject({ kind: "died", name: dead });
    expect(act(e, { type: "wait", seconds: 60 }).status).toBe("completed");
  });
  it.runIf(!!process.env.FULL)("sends a hungry child to the player, minds being ignored, and eats what it is given", () => {
    const e = createSettingSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    delete e.state.plot;
    const child = e.state.actors.find((a) =>
      a.kind === "human" && a.id !== e.state.player.id && a.householdId && !a.mount && !a.tends && !a.guard)!;
    const home = e.state.households!.find((h) => h.members.includes(e.state.player.id))!;
    e.state.objects.find((o) => o.id === home.storeId)!.inventory = {};
    child.age = 6;
    child.hunger = 80;
    e.state.player.relations = [...(e.state.player.relations ?? []), { other: child.id, kind: "child" }];
    e.state.clock = Math.ceil(e.state.clock / 86400) * 86400 + 10 * 3600;
    for (let i = 0; i < 40 && !e.approacher; i++) act(e, { type: "wait", seconds: 60 });
    expect(e.approacher?.id).toBe(child.id);
    expect(e.cards.find((c) => c.kind === "speech" && c.speaker === child.id)?.text).toMatch(/hungry|eat|bread/);

    const trust = child.trust;
    for (let i = 0; i < 70; i++) act(e, { type: "wait", seconds: 60 });
    expect(child.trust).toBe(trust - 1);

    child.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    child.trust = 0;
    child.hunger = 80;
    e.state.player.inventory.bread = 1;
    expect(act(e, { type: "hold", item: "bread" }).status).toBe("completed");
    const hunger = child.hunger;
    expect(act(e, { type: "give", target: child.id, item: "bread" }).status).toBe("completed");
    expect(child.hunger).toBeLessThan(hunger);
  });
  it("passes stories about the player on, weaker each telling", () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const [a, b] = e.state.actors.filter((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.householdId !== e.state.player.householdId && !e.world.dormant?.(x.id));
    a.word = [{ act: "smashed", object: "cooking pot", victim: a.id, tone: -8, at: 0, hops: 0 }];
    const trust = b.trust;
    for (let i = 1; i <= 60 && !b.word?.length; i++) {
      b.pos = { ...a.pos, x: a.pos.x + 1 };
      (e as unknown as { spreadWord(c: number): void }).spreadWord(i * 600 + 1);
    }
    const heard = b.word![0];
    expect(heard).toMatchObject({ act: "smashed", object: "cooking pot", victim: a.id });
    expect(heard.hops).toBeGreaterThan(0);
    expect(heard.tone).toBe(-8 / 2 ** heard.hops);
    expect(b.trust).toBeLessThan(trust);
    const name = () => "Ligray";
    const story = { act: "smashed", object: "cooking pot", victim: "x", tone: -8, at: 0 };
    expect(telling({ ...story, hops: 1 }, name)).toBe("smashed Ligray's cooking pot");
    expect(telling({ ...story, hops: 2 }, name)).toBe("smashed a cooking pot");
    expect(telling({ ...story, hops: 3 }, name)).toBe("made trouble for people");
  });
  it("lets someone ask a favour and thanks the player for keeping it", () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const a = e.state.actors.find((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.householdId !== e.state.player.householdId)!;
    a.hunger = 80;
    e.answerAsk(a, "accepted");
    expect(e.state.asks).toMatchObject([{ by: a.id, kind: "food", accepted: true }]);
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    e.state.player.inventory.bread = 1;
    act(e, { type: "hold", item: "bread" });
    const trust = a.trust;
    expect(act(e, { type: "give", target: a.id, item: "bread" }).status).toBe("completed");
    expect(e.state.asks).toEqual([]);
    expect(a.trust).toBe(trust + 4);
    expect(a.word?.[0]).toMatchObject({ tone: 4, hops: 0 });
  });
  it("takes a favour the model names only when the engine can see it done", () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const humans = e.state.actors.filter((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.householdId !== e.state.player.householdId);
    const [a, cooper] = [humans[0], humans.find((x) => x.householdId !== humans[0].householdId)!];
    e.answerAsk(a, "made", { kind: "talk-to", target: "Nobody Atall", what: "speak to the moon" });
    expect(e.state.asks ?? []).toEqual([]);
    e.answerAsk(a, "made", { kind: "talk-to", target: cooper.name, what: "put in a word for my son" });
    expect(e.state.asks).toMatchObject([{ by: a.id, kind: "talk-to", to: cooper.id, what: "put in a word for my son" }]);
    cooper.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const trust = a.trust;
    act(e, { type: "interact", target: cooper.id, action: "talk" });
    expect(e.state.asks).toEqual([]);
    expect(a.trust).toBeGreaterThan(trust);
    expect(cooper.memories.at(-1)).toContain("on behalf of");
  });
  it.runIf(!!process.env.FULL)("asks for a hand with their own work, leads the player there and sets them to it", () => {
    const e = createSettingSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const humans = e.state.actors.filter((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.householdId !== e.state.player.householdId);
    const a = humans.find((x) => { e.answerAsk(x, "made", { kind: "help", target: x.name, what: "get the work done" }); return !!e.state.asks?.length; })!;
    const ask = e.state.asks![0];
    expect(ask).toMatchObject({ by: a.id, kind: "help", meet: a.work });
    expect(ask.task).toBeTruthy();
    a.pos = { ...a.work, x: a.work.x + 10 };
    delete a.errand;
    e.answerAsk(a, "accepted");
    expect(e.state.actors.find((x) => x.id === a.id)!.errand?.to).toEqual(a.work);
    a.pos = { ...a.work };
    e.state.player.pos = { ...a.work, x: a.work.x + 1 };
    (e as unknown as { helpStep(): void }).helpStep();
    expect(e.cards[0]).toMatchObject({ speaker: a.id, choose: { card: `help:${ask.id}` } });
    const trust = a.trust;
    expect(act(e, { type: "choose", card: `help:${ask.id}`, choice: 1 }).status).toBe("completed");
    expect(e.state.asks).toEqual([]);
    expect(a.trust).toBeGreaterThanOrEqual(trust + 3);
    expect(a.owes).toBe(true);
    const by = humans.find((x) => x !== a)!;
    e.complain(by, { act: "smashed", object: "cooking pot", victim: by.id, tone: -8, at: e.state.clock, hops: 0 });
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const called = act(e, { type: "narrate", intents: [{ type: "converse", with: a.id, said: "", delta: 0, callIn: "speak" }] });
    expect(called.reason).toBeUndefined();
    expect(e.state.complaints?.[0].spokenFor).toBe(a.id);
    expect(a.owes).toBeUndefined();
    expect(e.callInProblem(a, "lend")).toContain("owes you nothing");
    a.owes = true;
    a.trust = -2;
    act(e, { type: "narrate", intents: [{ type: "converse", with: a.id, said: "", delta: 0, callIn: "lend" }] });
    expect(a.owes).toBeUndefined();
    expect(Object.values(e.state.player.helped ?? {})).toEqual([1]);
    e.state.player.taught = ["farming"];
    expect(e.pendingPicks().some((x) => x.skill === "farming")).toBe(true);
  });
  it("gossips about other households, but not to their faces", () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    const humans = e.state.actors.filter((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.householdId !== e.state.player.householdId && !e.world.dormant?.(x.id));
    const a = humans[0], b = humans.find((x) => x.householdId !== a.householdId)!;
    const kin = e.state.actors.find((x) => x !== b && x.householdId === b.householdId)!;
    a.word = [{ act: `${b.name}'s household was robbed`, tone: -8, at: 0, hops: 1, about: b.id }];
    const trust = kin.trust;
    for (let i = 1; i <= 30; i++) {
      b.pos = kin.pos = { ...a.pos, x: a.pos.x + 1 };
      (e as unknown as { spreadWord(c: number): void }).spreadWord(i * 600 + 1);
    }
    expect(b.word?.some((w) => w.about) ?? false).toBe(false);
    expect(kin.word?.some((w) => w.about) ?? false).toBe(false);
    expect(kin.trust).toBe(trust);
  });
  it.runIf(!!process.env.FULL)("sends whoever keeps order to judge a complaint", () => {
    const e = createSettingSession(settingFor(places.find((p) => p.id === "london")!, 1750), "b");
    delete e.state.plot;
    const keeper = e.keeper()!;
    const by = e.state.actors.find((x) => x.kind === "human" && (x.age ?? 30) >= 16 && x.id !== keeper.id && x.householdId !== e.state.player.householdId)!;
    e.state.clock = Math.ceil(e.state.clock / 86400) * 86400 + 9 * 3600;
    e.complain(by, { act: "broke down the door of", object: "home", victim: by.id, tone: -10, at: e.state.clock, hops: 0 });
    for (let i = 0; i < 200 && e.approacher?.id !== keeper.id; i++) act(e, { type: "wait", seconds: 60 });
    expect(e.approacher?.id).toBe(keeper.id);
    expect(e.cards.find((c) => c.kind === "speech" && c.speaker === keeper.id)?.text).toContain(`broke down the door of ${by.name}'s home`);
    // Georgian England's heaviest penalty for a petty wrong is the whip.
    expect(e.cards.at(-1)?.text).toContain("whipping");
    expect(e.state.player.health).toBeLessThan(100);
  });
  it("replays identical commands, including uncertainty, to the same physical hash", () => {
    const a = createSession("roman", "repeat"),
      b = createSession("roman", "repeat");
    for (let i = 0; i < 100; i++) {
      const c: PlayerCommand = { type: "wait", seconds: 30 };
      const req = {
        actionId: `same-${i}`,
        expectedRevision: a.state.revision,
        command: c,
      };
      expect(a.act(req)).toEqual(b.act(req));
    }
    expect(a.hash()).toBe(b.hash());
  });
  it("keeps chunk geometry stable under request order and negative coordinates", () => {
    const a = createWorld(packs.roman, "edges"),
      b = createWorld(packs.roman, "edges");
    const coords = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, -1],
      [2, 2],
    ];
    const first = coords.map(([x, y]) => a.chunk(x, y));
    for (const [x, y] of [...coords].reverse()) b.chunk(x, y);
    coords.forEach(([x, y], i) => expect(b.chunk(x, y)).toEqual(first[i]));
    expect(a.chunk(-1, 0)[63]).toBe(a.terrain(-1, 0));
  });
  it("starts outside buildings with reachable entrances across varied seeds", () => {
    for (const pack of Object.values(packs))
      for (let i = 0; i < 12; i++) {
        const e = createSession(pack.id, `seed-${i}`);
        expect(e.blocked(e.state.player.pos.x, e.state.player.pos.y)).toBe(
          false,
        );
        for (const b of e.world.places.filter((p) => p.id.startsWith("s0"))) {
          expect(e.blocked(b.entrance.x, b.entrance.y)).toBe(false);
          expect(
            findPath(e.state.player.pos, b.entrance, (x, y) => e.blocked(x, y))
              .length,
            `${pack.id}/${i}/${b.id}`,
          ).toBeGreaterThan(0);
        }
      }
  }, 20000);
  it("deduplicates action IDs and rejects stale or changed requests without advancing time", () => {
    const e = createSession();
    const req = {
      actionId: "once",
      expectedRevision: 0,
      command: { type: "wait" as const, seconds: 60 },
    };
    const result = e.act(req),
      clock = e.state.clock;
    expect(e.act(req)).toEqual(result);
    expect(e.state.clock).toBe(clock);
    expect(
      e.act({ ...req, command: { type: "wait", seconds: 1 } }).status,
    ).toBe("rejected");
    expect(e.act({ ...req, actionId: "stale" }).status).toBe("rejected");
    expect(e.state.clock).toBe(clock);
  });
  it("does not advance time when observing, inspecting, or writing a note", () => {
    const e = createSession(),
      clock = e.state.clock,
      hash = e.hash();
    for (let i = 0; i < 20; i++) {
      e.observe();
      e.inspect("s0-person-1");
    }
    e.state.notes.push({ id: 1, time: clock, text: "An observation" });
    expect(e.state.clock).toBe(clock);
    expect(e.hash()).toBe(hash);
  });
  it("shows the same building description beyond sight and behind its walls", () => {
    const e = createSession("roman", "building-inspection");
    const place = e.world.places[0];
    e.state.player.pos = { ...place.entrance, space: "outside" };
    const seen = e.inspect(place.id)!;
    expect(seen.kind).toBe("building");
    expect(seen.description).toBeTruthy();
    const clock = e.state.clock;
    for (const pos of [
      { x: place.entrance.x + 50, y: place.entrance.y, space: "outside" },
      { x: place.x + Math.floor(place.w / 2), y: place.y - 1, space: "outside" },
    ]) {
      e.state.player.pos = pos;
      expect(e.visible({ ...place.entrance, space: "outside" })).toBe(false);
      const inspected = e.inspect(place.id)!;
      expect(inspected.description).toBe(seen.description);
      expect(inspected.brief).toEqual(seen.brief);
      expect(inspected.affordances.find((a) => a.command.type === "interact" && a.command.action === "enter")?.enabled).toBe(false);
      expect(act(e, { type: "interact", target: place.id, action: "enter" }).status).toBe("rejected");
    }
    expect(e.state.clock).toBe(clock);
  });
  it("conceals unobserved targets and private actor state", () => {
    const e = createSession();
    expect(e.inspect("s3-person-1")).toBeUndefined();
    expect(e.inspect("s0-house-0-chest")).toBeUndefined();
    for (const a of e.observe().actors) {
      expect(a).not.toHaveProperty("inventory");
      expect(a).not.toHaveProperty("memories");
      expect(a).not.toHaveProperty("trust");
    }
  });
  it("preserves trade quantities atomically and rejects impossible transfers", () => {
    const e = createSession();
    const a = e.state.actors[0];
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const totals = () => [
      e.state.player.inventory.coin! + a.inventory.coin!,
      e.state.player.inventory.bread! + a.inventory.bread!,
    ];
    const before = totals();
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "coin",
        giveQuantity: 2,
        take: "bread",
        takeQuantity: 1,
      }).status,
    ).toBe("completed");
    expect(totals()).toEqual(before);
    const hash = e.hash();
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "coin",
        giveQuantity: 999,
        take: "bread",
        takeQuantity: 1,
      }).status,
    ).toBe("rejected");
    expect(e.hash()).toBe(hash);
  });
  it("deals from a person's stock at fixed prices, and keeps the sale", () => {
    const e = createSession();
    const a = e.state.actors[0];
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    e.state.player.inventory.coin = 50;
    const shop = e.shopOf(a.id, true)!;
    const [id] = Object.keys(shop.stock);
    const price = e.buyPrice(id);
    const have = e.state.player.inventory[id] ?? 0;
    expect(act(e, { type: "deal", target: a.id, give: { coin: price - 1 }, take: { [id]: 1 } }).status).toBe("rejected");
    expect(act(e, { type: "deal", target: a.id, give: { coin: price }, take: { [id]: 1 } }).status).toBe("completed");
    expect(e.state.player.inventory[id]).toBe(have + 1);
    expect(e.shopOf(a.id, true)!.stock[id]).toBe(shop.stock[id]! - 1);
    expect(e.shopOf(a.id, true)!.purse).toBe(shop.purse + price);
    expect(e.sellPrice(id)).toBeLessThanOrEqual(price);
  });
  it("uses barter in the Neolithic pack and preserves item exclusions", () => {
    const e = createSession("neolithic");
    expect(e.state.player.inventory.coin).toBeUndefined();
    expect(e.world.pack.currency).toBeUndefined();
    const a = e.state.actors[0];
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "obsidian",
        giveQuantity: 1,
        take: "grain",
        takeQuantity: 1,
      }).status,
    ).toBe("completed");
    expect(e.state.player.inventory.grain).toBe(7);
  });
  it("enters and leaves the same persistent household after reload", () => {
    const e = createSession();
    const b = e.world.places.find((p) => p.access === "public")!;
    reach(e, { ...b.entrance, space: "outside" });
    // A public building stands open through the day; a shut one has to be
    // opened first, and either way entering needs an open door.
    const door = e.doorOf(b.id)!;
    if (!door.open)
      expect(
        act(e, { type: "interact", target: door.id, action: "open" }).status,
      ).toBe("completed");
    expect(
      act(e, { type: "interact", target: b.id, action: "enter" }).status,
    ).toBe("completed");
    const restored = restoreSession(e.snapshot());
    expect(restored.hash()).toBe(e.hash());
    expect(restored.state.player.pos.space).toBe(b.id);
    expect(
      act(restored, {
        type: "interact",
        target: `${b.id}-exit`,
        action: "exit",
      }).status,
    ).toBe("completed");
    // Out through the door, which for a back-on building is not the lot's
    // street-side entrance.
    expect(restored.state.player.pos).toEqual({
      ...doorApproach(b),
      space: "outside",
    });
  });
  it("records a theft, local witnesses, and real restitution", () => {
    const e = createSession("roman", undefined, { content: 1 });
    const o = e.state.objects.find((o) => o.kind === "container")!;
    o.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const witness = e.state.actors[0];
    witness.pos = { ...e.state.player.pos, y: e.state.player.pos.y + 1 };
    const oldOwner = o.owner;
    expect(
      act(e, { type: "interact", target: o.id, action: "take" }).status,
    ).toBe("completed");
    expect(o.owner).toBe(oldOwner);
    expect(o.depleted).toBe(true);
    expect(witness.memories.some((x) => x.includes(o.id))).toBe(true);
    expect(
      act(e, { type: "interact", target: o.id, action: "return" }).status,
    ).toBe("completed");
    expect(o.depleted).toBe(false);
  });
  it("captured animals never respawn after save and reload", () => {
    const e = createSession();
    const a = e.state.actors.find((a) => a.kind === "lizard")!;
    let captured = false;
    for (let i = 0; i < 15 && !captured; i++) {
      a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
      act(e, { type: "interact", target: a.id, action: "capture" });
      captured = !e.state.actors.some((x) => x.id === a.id);
    }
    expect(captured).toBe(true);
    expect(
      restoreSession(e.snapshot()).state.actors.some((x) => x.id === a.id),
    ).toBe(false);
    expect(e.state.player.inventory.lizard).toBe(1);
  });
  it("rejects incompatible and malformed saves before replacement", () => {
    const e = createSession();
    const save = e.snapshot();
    expect(() =>
      restoreSession({ ...save, manifest: { ...save.manifest, generator: 2 } }),
    ).toThrow();
    expect(() =>
      restoreSession({
        ...save,
        player: { ...save.player, inventory: { coin: -4 } },
      }),
    ).toThrow();
  });
  it("puts wearables on and takes them off through the inventory", () => {
    const e = createSession(Object.keys(packs)[0], "wear");
    const p = e.state.player;
    p.inventory["headwear-cap"] = 1;
    expect(act(e, { type: "wear", item: "headwear-cap" }).status).toBe(
      "completed",
    );
    expect(p.worn?.head).toBe("headwear-cap");
    expect(p.inventory["headwear-cap"] ?? 0).toBe(0);
    p.inventory["headwear-hood"] = 1;
    act(e, { type: "wear", item: "headwear-hood" });
    expect(p.worn?.head).toBe("headwear-hood");
    expect(p.inventory["headwear-cap"]).toBe(1);
    expect(act(e, { type: "remove", slot: "head" }).status).toBe("completed");
    expect(p.worn?.head).toBeUndefined();
    expect(p.inventory["headwear-hood"]).toBe(1);
    expect(act(e, { type: "remove", slot: "head" }).status).toBe("rejected");
    expect(act(e, { type: "wear", item: "grain" }).status).toBe("rejected");
    p.inventory["garment-robe"] = 1;
    act(e, { type: "wear", item: "garment-robe" });
    expect(p.worn?.body).toBe("garment-robe");
    // A bare torso is an ordinary state, not a refusal.
    expect(act(e, { type: "remove", slot: "body" }).status).toBe("completed");
    expect(p.worn?.body).toBeUndefined();
    expect(p.inventory["garment-robe"]).toBe(1);
    // Garments carry their cloth in the id; the runtime must let them through.
    expect(commandSchema.safeParse({ type: "wear", item: "garment-dress~wool.bleached.0" }).success).toBe(true);
    expect(restoreSession(e.snapshot()).hash()).toBe(e.hash());
  });
  it("supports a full procedural day in each pack, with persistent activity and no API", () => {
    for (const pack of Object.values(packs)) {
      const e = createSession(pack.id, "full-day");
      const first = canonical(e.state.actors.map((a) => a.pos));
      for (let i = 0; i < 12; i++) {
        expect(act(e, { type: "wait", seconds: 3600 }).status).toBe(
          "completed",
        );
        if ((e.state.player.inventory.grain ?? 0) > 0)
          act(e, { type: "use", item: "grain" });
        else if ((e.state.player.inventory.bread ?? 0) > 0)
          act(e, { type: "use", item: "bread" });
      }
      expect(e.state.clock).toBeGreaterThanOrEqual(21 * 3600);
      expect(canonical(e.state.actors.map((a) => a.pos))).not.toBe(first);
      expect(restoreSession(e.snapshot()).hash()).toBe(e.hash());
    }
  }, 20000);
});

describe("survival and local danger", () => {
  const body = () => {
    const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1400), "survival");
    e.state.introduced = true;
    e.state.ailments = [];
    delete e.state.plot;
    e.state.player.stats = { strength: 80, agility: 80, endurance: 80, wit: 80, openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
    return e;
  };

  it("applies the same bodily limits to narrator attempts and ordinary checks", () => {
    const healthy = body(), sick = body();
    const p = sick.state.player;
    p.hunger = p.fatigue = 100;
    p.injury = { name: "injured leg", until: sick.state.clock + 86400 };
    sick.state.ailments = [{ id: "fever", who: "player", since: sick.state.clock - 2 * 86400, days: 6, course: "mend" }];
    expect(sick.stats().strength).toBeLessThan(healthy.stats().strength / 2);
    expect(bodySummary(sick.state)).toMatch(/fever.*Physical ability reduced/);
    for (const e of [healthy, sick]) {
      const rng = vi.spyOn(e, "rng").mockReturnValue(0.5);
      act(e, { type: "narrate", intents: [{ type: "attempt", check: "strength", difficulty: 3, success: "You lift it.", failure: "You cannot lift it.", minutes: 1 }] });
      rng.mockRestore();
    }
    expect(healthy.state.events.some((e) => e.text === "You lift it.")).toBe(true);
    expect(sick.state.events.some((e) => e.text === "You cannot lift it.")).toBe(true);
    expect(bodyState(sick.state).illnesses[0]).toMatchObject({ id: "fever", since: sick.state.ailments![0].since });
    expect(bodyState(sick.state).illnesses[0]).not.toHaveProperty("course");
    const strength = healthy.stats().strength;
    healthy.state.player.health = 30;
    expect(healthy.stats().strength).toBeLessThan(strength);
  });

  it("wears down health after days without food, and a meal stops the loss", () => {
    const e = body(), p = e.state.player;
    p.hunger = 100;
    p.hungerDebt = 2 * 86400;
    act(e, { type: "wait", seconds: 3600 });
    expect(p.health).toBeCloseTo(99.75);
    p.inventory.bread = 2;
    expect(act(e, { type: "use", item: "bread" }).status).toBe("completed");
    const after = p.health!, debt = p.hungerDebt;
    act(e, { type: "wait", seconds: 3600 });
    expect(p.health).toBeGreaterThanOrEqual(after);
    expect(p.hungerDebt).toBeLessThan(debt);
  });

  it("lets exhausted people walk, refuses running, and needs food for overnight healing", () => {
    const e = body(), p = e.state.player;
    p.fatigue = 100;
    expect(e.validate({ type: "move", dx: 1, dy: 0, run: true })).toContain("exhausted");
    expect(e.validate({ type: "sleep", seconds: 8 * 3600 })).toBeUndefined();
    e.world.blocked = () => false;
    e.state.actors = [];
    expect(act(e, { type: "move", dx: 1, dy: 0 }).status).toBe("completed");
    p.pos.space = e.world.places[0].id;
    p.health = 60;
    p.hunger = 90;
    e.sleep(8 * 3600);
    expect(p.fatigue).toBeLessThan(30);
    expect(p.health).toBe(60);
    p.inventory.bread = 3;
    act(e, { type: "use", item: "bread" });
    act(e, { type: "use", item: "bread" });
    const health = p.health;
    e.sleep(8 * 3600);
    expect(p.health).toBeGreaterThan(health);
    p.injury = { name: "old sprain", until: e.state.clock + 60 };
    act(e, { type: "wait", seconds: 3600 });
    expect(p.injury).toBeUndefined();
  });

  it("distinguishes isolated night ground from shelter and guarded ground", () => {
    const e = body(), p = e.state.player;
    p.pos = { x: 500, y: 500, space: "outside" };
    e.state.actors = [];
    e.state.clock = 12 * 3600;
    const day = e.danger();
    e.state.clock = 23 * 3600;
    const night = e.danger();
    expect(night.score).toBeGreaterThan(day.score);
    expect(night.reasons).toContain("After dark");
    expect(e.danger()).toEqual(night);
    expect(e.nearbyDanger()).toHaveLength(4);
    p.pos.space = e.world.places[0].id;
    expect(e.danger().areaRisk).toBe(0);
    p.pos.space = "outside";
    const guard = body().state.actors[0];
    guard.pos = { ...p.pos }; guard.guard = { ward: "test" }; guard.trust = 0;
    e.state.actors = [guard];
    expect(e.danger().areaRisk).toBe(0);
  });

  it("interrupts with a replayable robbery choice and enforces its costs and cooldown", () => {
    const e = body(), p = e.state.player;
    p.inventory.coin = 5;
    const risk = vi.spyOn(e, "danger").mockReturnValue({ ...e.danger(), hourlyRisk: 12, areaRisk: 2 });
    act(e, { type: "wait", seconds: 3600 });
    expect(e.state.encounter?.card).toBe("roadside-robbery");
    expect(e.cards.some((c) => c.choose?.card === "roadside-robbery")).toBe(true);
    expect(act(e, { type: "sleep", seconds: 3600 }).status).toBe("rejected");
    expect(act(e, { type: "choose", card: "roadside-robbery", choice: 0 }).status).toBe("completed");
    expect(p.inventory.coin).toBe(3);
    expect(e.state.encounter).toBeUndefined();
    act(e, { type: "wait", seconds: 3600 });
    expect(e.state.encounter).toBeUndefined();
    risk.mockRestore();
  });

  it("makes an assaulted adult defend themselves and exposes their threat before the first blow", () => {
    const e = body(), p = e.state.player, a = e.state.actors[0];
    p.pos = { x: 20, y: 60, space: "outside" };
    a.age = 30; a.health = 100; a.terror = undefined; a.injury = undefined;
    a.pos = { ...p.pos, y: p.pos.y - 1 };
    a.home = a.work = { ...a.pos };
    e.state.actors = [a];
    e.world.blocked = () => false;
    p.direction = 0;
    expect(act(e, { type: "interact", target: a.id, action: "strike" }).status).toBe("completed");
    expect(a.health).toBeLessThan(100);
    expect(a.terror).toMatchObject({ cause: "assault", fight: true });
    expect(e.danger().threats[0]).toMatchObject({ id: a.id, state: "threatening" });
    const health = p.health!;
    act(e, { type: "wait", seconds: 36 });
    expect(p.health).toBeLessThan(health);
    expect(e.danger().threats.some((t) => t.state === "attacking")).toBe(true);
    p.health = 1;
    p.hunger = 100;
    p.hungerDebt = 2 * 86400;
    act(e, { type: "wait", seconds: 36 });
    expect(p.dead).toBeUndefined();
    expect(p.health).toBeGreaterThan(0);
    expect(p.injury).toBeDefined();
    e.walkOff(a, "away");
    expect(a.terror).toBeUndefined();
  });

  it("can turn serious anger into a visible threat without making every slight a fight", () => {
    const e = body(), a = e.state.actors[0], p = e.state.player;
    a.stats = { ...p.stats!, agreeableness: 0, extraversion: 100 };
    a.age = 30; a.health = 100;
    a.pos = { ...p.pos, x: p.pos.x + 1 };
    a.trust = 0;
    e.regard(a, -1);
    expect(a.terror).toBeUndefined();
    e.regard(a, -6);
    expect(a.terror).toMatchObject({ cause: "anger", fight: true });
    expect(a.terror!.strikeAfter).toBeGreaterThan(e.state.clock + 60);
    expect(p.health).toBe(100);
  });

  it("retains the old harmless hunger and fatigue rules for pinned older worlds", () => {
    const e = body(), p = e.state.player;
    delete e.state.manifest.survival;
    p.hunger = p.fatigue = 100;
    p.hungerDebt = 5 * 86400;
    const strength = e.stats().strength;
    act(e, { type: "wait", seconds: 3600 });
    expect(p.health).toBe(100);
    expect(e.stats().strength).toBe(strength);
    expect(e.danger().threats).toEqual([]);
  });
});
