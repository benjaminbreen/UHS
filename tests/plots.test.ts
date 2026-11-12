import { describe, expect, it, vi } from "vitest";
import { createSettingSession, type Runtime } from "../src/runtime/session";
import { plotLine, startPlot, type PlotState } from "../src/core/plot";
import { STANCE_VOICE, stanceOf } from "../src/content/plots/stance";
import { PLOTS } from "../src/content/plots";
import { accused } from "../src/content/plots/accused";
import { commission } from "../src/content/plots/commission";
import { debt } from "../src/content/plots/debt";
import { feast } from "../src/content/plots/feast";
import { maneater } from "../src/content/plots/maneater";
import { raid } from "../src/content/plots/raid";
import { token } from "../src/content/plots/token";
import type { PlotTemplate } from "../src/content/plots/types";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { Engine } from "../src/core/engine";
import { doorApproach } from "../src/core/doors";
import { markOf } from "../src/core/kin";
import { items } from "../src/content/packs";
import type { PlayerCommand, Stats } from "../src/core/types";
import { taskView, tasksOf } from "../src/ui/task-view";
import { smallSession } from "./fixtures";

// London 1750 takes half a minute to build, so the cases share one world and
// each plays on its own copy of the state, apart from core.test.ts.
const setting = settingFor(places.find((p) => p.id === "london")!, 1750);
let london: Engine | undefined;
const session = () => {
  london ??= createSettingSession(setting, "b");
  return new Engine(london.world, items, london.state);
};
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

describe("plot templates", () => {
  it("word every line their opening, developments and endings call for", () => {
    for (const plot of PLOTS) {
      const called = ["aim", "intro", "threat", ...plot.endings.map((e) => e.id), ...(plot.journal?.notes.map((n) => n.line) ?? []),
        ...[...plot.opening, ...plot.developments.flatMap((d) => d.then)].flatMap((e) =>
          e.type === "choose" ? [e.line, ...e.choices.map((c) => `${c.id}:label`)] : "line" in e ? [e.line] : [])];
      for (const w of plot.wording)
        for (const key of called) expect(w.lines[key] ?? plot.wording.at(-1)!.lines[key], `${plot.id} ${w.title}: ${key}`).toBeTruthy();
    }
  });

  it("say a spoken line the speaker's way, where the wording that gives the line has one", () => {
    const stats = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50, strength: 50, wit: 50 } as Stats;
    expect(stanceOf(stats, 0)).toBeUndefined();
    expect(stanceOf({ ...stats, agreeableness: 20 }, 0)).toBe("bully");
    expect(stanceOf({ ...stats, agreeableness: 20 }, 4)).toBe("reluctant");
    for (const plot of PLOTS) {
      const slots = (line: string) => line.match(/\{\w+\}/g) ?? [];
      const known = new Set(plot.wording.flatMap((w) => Object.entries(w.lines)).filter(([k]) => !k.includes(".")).flatMap(([, l]) => slots(l)));
      for (const w of plot.wording)
        for (const [key, line] of Object.entries(w.lines)) {
          const [base, stance] = key.split(".");
          if (!stance) continue;
          expect(STANCE_VOICE, key).toHaveProperty(stance);
          expect(w.lines[base], `${plot.id}: ${key}`).toBeTruthy();
          for (const slot of slots(line)) expect(known, `${plot.id} ${key}: ${slot}`).toContain(slot);
        }
    }
    const plot = { id: "accused", wording: accused.wording.length - 1, words: { thing: "a hen", amount: "two baskets", due: "by sundown" }, cast: {} } as unknown as PlotState;
    expect(plotLine(plot, "accuse", undefined, "bully")).toBe("You stole a hen from me. I want two baskets for it by sundown. If I don't get it, I'll tell everyone here you're a thief.");
    expect(plotLine({ ...plot, wording: 0 }, "accuse", undefined, "bully")).toContain("magistrate");
  });
});

function tokenScene() {
  const e = smallSession(setting, "token-fixture");
  const s = e.state;
  delete s.plot;
  const plot = drawOnly(token, () => startPlot(s, { ...setting, year: -4321 }, token.id))!;
  const household = s.households!.find((h) => h.id === s.player.householdId)!;
  const house = e.world.place(household.residence!);
  const doorstep = house ? { ...doorApproach(house), space: "outside" } : household.home;
  const wild = { ...doorstep, x: doorstep.x + 100 };
  const actor = (role: string) => s.actors.find((a) => a.id === plot.cast[role])!;
  const runtime = { engine: e, dayGoals: () => [] } as unknown as Runtime;
  const today = () => taskView(runtime, { kind: "plot" });
  const talk = (role: string) => {
    const a = actor(role);
    a.pos = { ...s.player.pos, x: s.player.pos.x + 1 };
    return act(e, { type: "interact", action: "talk", target: a.id });
  };
  const answer = (line: string, choice: number) => act(e, { type: "choose", card: `plot:token:${line}`, choice });
  return { e, s, plot, actor, doorstep, wild, runtime, today, talk, answer };
}

describe("Something at the Door", () => {
  it.each(["witness", "suspect"])("only shows discovered leads in Today when %s is first", (first) => {
    const { e, s, plot, actor, doorstep, wild, runtime, today, talk, answer } = tokenScene();
    const suspect = actor("suspect"), neighbour = actor("neighbour"), witness = actor("witness");
    suspect.name = "Wola";
    neighbour.name = "Chika";
    witness.name = "Taro";
    s.player.relations = [{ kind: "parent", other: "shared-parent" }];
    witness.relations = [{ kind: "parent", other: "shared-parent" }];
    witness.origin = { ...witness.origin!, sex: "male" };

    s.player.pos = { ...wild };
    e.advance(3660);
    expect(e.cards.every((c) => c.kind === "title")).toBe(true);
    expect(today()).toBeUndefined();
    expect(tasksOf(runtime, s.player.id).some((task) => task.source.kind === "plot")).toBe(false);
    expect(markOf(s, suspect.id)).toBeUndefined();

    s.player.pos = { ...doorstep };
    e.advance(60);
    const opening = e.cards.find((c) => c.choose?.card === "plot:token:intro")!;
    expect(opening.text).toContain("figure carved from bone");
    expect(today()?.facts.map((f) => f.text).join(" ")).not.toMatch(/Wola|Chika|Taro/);

    s.player.pos = { ...wild };
    expect(e.canShowCard(opening)).toBe(false);
    expect(answer("intro", 0).status).toBe("rejected");
    e.cards.length = 0;
    e.reofferCard();
    expect(e.cards.some((c) => c.choose?.card === "plot:token:intro")).toBe(false);

    s.player.pos = { ...doorstep };
    e.reofferCard();
    expect(answer("intro", 0).status).toBe("completed");
    e.cards.length = 0;
    s.player.pos = { ...wild };
    suspect.home = { ...s.player.home };
    neighbour.home = { ...s.player.home, x: s.player.home.x + 80 };
    if (first === "witness") {
      expect(talk("witness").status).toBe("completed");
      expect(today()?.facts.find((f) => f.label === "What you heard")?.text).toContain("Taro, your brother,");
      expect(today()?.facts.map((f) => f.text).join(" ")).toContain("Chika, another member of your settlement");
      expect(today()?.facts.map((f) => f.text).join(" ")).not.toContain("Wola");
      expect(e.cards.find((c) => c.speaker === witness.id)?.text).toContain("at first light");
    }

    suspect.pos = { ...s.player.pos, x: s.player.pos.x + 1 };
    e.advance(60, suspect.id);
    expect(today()?.facts.find((f) => f.label === "What you noticed")?.text).toContain("Wola, your neighbor, has fresh red ochre");
    expect(e.cards.some((c) => c.choose?.card === "plot:token:blush")).toBe(false);
    if (first === "suspect") {
      expect(today()?.facts.map((f) => f.text).join(" ")).not.toMatch(/Chika|Taro/);
      expect(talk("witness").status).toBe("completed");
      expect(today()?.facts.map((f) => f.text).join(" ")).toContain("Chika");
    }
    expect(talk("suspect").status).toBe("completed");
    const reply = e.cards.find((c) => c.choose?.card === "plot:token:blush")!;
    expect(reply.text).toContain("Wola, your neighbor, admits");
    s.player.pos = { ...doorstep };
    expect(e.canShowCard(reply)).toBe(false);
    expect(answer("blush", 0).status).toBe("rejected");
    expect(talk("suspect").status).toBe("completed");
    expect(answer("blush", 0).status).toBe("completed");
    expect(plot.ended).toBe("found");
  });

  it("waits at the doorstep for the visitor and cancels the watch if the player leaves", () => {
    const startWatch = () => {
      const scene = tokenScene();
      const { e, s, actor, doorstep, wild, answer } = scene;
      s.player.pos = { ...doorstep };
      actor("suspect").pos = { ...wild };
      e.advance(60);
      const rng = e.rng.bind(e);
      vi.spyOn(e, "rng").mockImplementation((key) => key.startsWith("plot:token:intro:") ? 0 : rng(key));
      expect(answer("intro", 1).status).toBe("completed");
      e.cards.length = 0;
      return scene;
    };
    const waiting = startWatch();
    waiting.e.advance(1740, waiting.actor("suspect").id);
    expect(waiting.e.cards).toEqual([]);
    expect(waiting.today()?.facts.map((f) => f.text).join(" ")).not.toContain(waiting.actor("suspect").name);
    waiting.actor("suspect").pos = { ...waiting.doorstep };
    waiting.e.advance(120, waiting.actor("suspect").id);
    expect(waiting.e.cards.find((c) => c.choose?.card === "plot:token:dawn")?.speaker).toBe(waiting.actor("suspect").id);
    expect(waiting.answer("dawn", 1).status).toBe("completed");
    expect(waiting.plot.ended).toBe("cool");

    const leaving = startWatch();
    leaving.s.player.pos = { ...leaving.wild };
    leaving.e.advance(60);
    expect(leaving.plot.ended).toBe("left-watch");
    expect(leaving.e.cards).toEqual([]);
  });

  it("expires an undiscovered mystery without a card or a record entry", () => {
    const { e, s, plot, wild, today } = tokenScene();
    s.player.pos = { ...wild };
    s.clock = plot.deadline - 60;
    e.advance(120);
    expect(plot.ended).toBe("unsolved");
    expect(today()).toBeUndefined();
    expect(e.cards.every((c) => c.kind === "title")).toBe(true);
    expect(s.record?.some((entry) => entry.card.startsWith("plot:")) ?? false).toBe(false);
  });
});

describe("plots played out in London, 1750", () => {
  it("binds a seeded debt, sends the creditor over, and ends it by payment or seizure", () => {
    const e = smallSession({ ...setting, economyRevision: 1 }, "b");
    const local = e.world.pack.setting!;
    const s = e.state;
    s.clock = 9 * 3600 + 54;
    const home = s.households!.find((h) => h.members.includes(s.player.id))!;
    const creditor = s.actors.find((a) => a.kind === "human" && !a.dead && (a.age ?? 30) >= 18 &&
      a.householdId && a.householdId !== home.id)!;
    const supplier = s.households!.find((h) => h.id === creditor.householdId)!;
    supplier.makes = [...(supplier.makes ?? []), "bread"];
    supplier.producers = { ...supplier.producers, bread: creditor.id };
    home.owes = supplier.id;
    home.credit = { good: "bread", from: supplier.id, seller: creditor.id, debtor: s.player.id, amount: 8, reason: "household", repayment: "money" };
    const plot = startPlot(s, local, debt.id)!;
    expect(plot.id).toBe("debt");
    expect(plot.cast.creditor).toBe(creditor.id);
    expect(e.state.lifeAim?.id).toBe("plot:debt");
    const again = structuredClone(e.state);
    delete again.plot;
    expect(startPlot(again, local, debt.id)?.cast).toEqual(plot.cast);

    creditor.pos = { ...s.player.pos, x: s.player.pos.x + 1 };
    expect(act(e, { type: "wait", seconds: 6 }).status).toBe("completed");
    expect(e.approacher?.id).toBe(creditor.id);
    expect(e.cards.find((c) => c.kind === "speech")?.text).toContain(plot.words.amount);

    const coin = e.item("coin")!.value, owed = plot.owed!;
    e.state.player.inventory.coin = 3;
    expect(act(e, { type: "interact", target: creditor.id, action: "pay" }).status).toBe("completed");
    expect(plot.owed).toBe(owed - 3 * coin);
    expect(plot.ended).toBeUndefined();

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
  it("holds the feast and the hearing as gatherings the player has to walk to", () => {
    const e = session();
    const meet = (plot: NonNullable<typeof e.state.plot>) => {
      const g = plot.gathering!;
      e.state.clock = g.start - 60;
      e.state.player.pos = { ...g.at };
      e.advance(120);
    };
    delete e.state.plot;
    e.state.households!.find((h) => h.members.includes(e.state.player.id))!.fortune = 0.5;
    const party = drawOnly(feast, () => startPlot(e.state, setting))!;
    e.advance(60);
    const host = e.state.actors.find((a) => a.id === party.cast.host)!;
    host.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    e.state.player.inventory.coin = party.owed!;
    act(e, { type: "interact", target: host.id, action: "pay" });
    expect(party.ended).toBeUndefined();
    // Going straight there waits out the hours; something coming up can stop it short.
    for (let i = 0; i < 6 && e.state.clock < party.gathering!.start; i++) expect(act(e, { type: "attend" }).status).toBe("completed");
    e.advance(60);
    expect(party.ended).toBe("given");
    expect(e.state.actors.filter((a) => a.errand?.label === party.gathering!.label).length).toBeGreaterThan(2);
    expect(e.state.actors.some((a) => a.errand?.label === party.gathering!.label && a.errand.pose === "sit-seat")).toBe(true);
    expect(e.state.objects.filter((o) => o.id.startsWith("gathering-")).map((o) => o.prop)).toContain("bench");
    e.state.clock = party.gathering!.until;
    e.advance(120);
    expect(e.state.objects.some((o) => o.id.startsWith("gathering-"))).toBe(false);

    delete e.state.plot;
    const charge = drawOnly(accused, () => startPlot(e.state, setting))!;
    e.state.clock = charge.deadline;
    e.advance(180);
    expect(charge.ended).toBeUndefined();
    expect(e.state.lifeAim?.text).toContain("Answer");
    meet(charge);
    expect(charge.ended).toBe("judged");
  });
  it("puts a choice card up, and ends on what the player chose", () => {
    const e = session();
    delete e.state.plot;
    const choice: PlotTemplate = {
      ...commission, id: "test-choice", shape: "light", weight: () => 1, cast: () => ({}),
      begin: (c) => ({ deadline: c.clock + 86400, words: {} }),
      opening: [{ type: "choose", line: "ask", choices: [{ id: "stay" }, { id: "go", check: { stat: "agility", odds: 2 } }] }],
      developments: [],
      endings: [{ id: "went", when: { type: "fired", id: "go" } }, { id: "stayed", when: { type: "fired", id: "stay" } }],
      wording: [{ title: "A Choice", lines: { aim: "Choose.", intro: "", threat: "", ask: "Stay or go?", "stay:label": "Stay", "go:label": "Go", "go:then": "You go.", went: "Gone.", stayed: "Stayed." } }],
    };
    PLOTS.push(choice);
    try {
      const plot = drawOnly(choice, () => startPlot(e.state, setting))!;
      e.advance(60);
      // The first decision waits a little while into the day.
      expect(e.cards.some((c) => c.choose?.card === "plot:test-choice")).toBe(false);
      e.advance(3600);
      const card = e.cards.find((c) => c.choose?.card === "plot:test-choice")!;
      expect(card.choose!.choices.map((c) => c.label)).toEqual(["Stay", "Go"]);
      expect(card.moment).toBe("ask");
      expect(act(e, { type: "choose", card: "plot:test-choice", choice: 1 }).status).toBe("completed");
      expect(e.lastChoice?.line).toBe("You go.");
      expect(plot.ended).toBe("went");
    } finally {
      PLOTS.pop();
    }
  });
  it("ends an order only when the work is brought after the day's work is done", () => {
    const e = session();
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
  it("looses a named man-eater in lion country and ends when the player kills it", () => {
    const e = session();
    delete e.state.plot;
    const tsavo = { ...setting, lon: 38.5, lat: -3, year: 1898, culture: "east-southern-african" as const, settlement: "village" as const };
    expect(maneater.weight({ seed: "b", setting: tsavo, clock: 0, player: e.state.player, actors: e.state.actors, households: [] })).toBeGreaterThan(0);
    const plot = drawOnly(maneater, () => startPlot(e.state, tsavo))!;
    expect(plot.words.species).toBe("lion");
    e.advance(60);
    const beast = e.state.fauna?.find((g) => g.id === plot.refs?.beast);
    expect(beast?.maneater?.name).toBe(plot.words.beast);
    plot.fired.push("beast:slain");
    e.advance(60);
    expect(plot.ended).toBe("slain");
  });
  it("sends a raider to the household's pen at dusk and ends in the morning", () => {
    const e = session();
    e.state.player.origin = { ...e.state.player.origin!, livelihood: "shepherd" };
    delete e.state.plot;
    const gevaudan = { ...setting, lon: 3.5, lat: 44.7, year: 1765, culture: "european" as const, settlement: "village" as const };
    const plot = drawOnly(raid, () => startPlot(e.state, gevaudan))!;
    expect(plot.words.kind).toBe("wolf");
    e.advance(plot.deadline - 11 * 3600 - e.state.clock + 60);
    expect(e.state.fauna?.find((g) => g.id === plot.refs?.beast)?.stockRaid?.at).toBeTruthy();
    plot.fired.push("move");
    e.advance(plot.deadline - e.state.clock + 60);
    expect(["moved", "took", "killed"]).toContain(plot.ended);
  });
});
