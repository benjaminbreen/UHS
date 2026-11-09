import { describe, expect, it } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { startPlot } from "../src/core/plot";
import { PLOTS } from "../src/content/plots";
import { accused } from "../src/content/plots/accused";
import { commission } from "../src/content/plots/commission";
import { debt } from "../src/content/plots/debt";
import { feast } from "../src/content/plots/feast";
import type { PlotTemplate } from "../src/content/plots/types";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { Engine } from "../src/core/engine";
import { items } from "../src/content/packs";
import type { PlayerCommand } from "../src/core/types";

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
      const called = ["aim", "intro", "threat", ...plot.endings.map((e) => e.id),
        ...[...plot.opening, ...plot.developments.flatMap((d) => d.then)].flatMap((e) =>
          e.type === "choose" ? [e.line, ...e.choices.map((c) => `${c.id}:label`)] : "line" in e ? [e.line] : [])];
      for (const w of plot.wording)
        for (const key of called) expect(w.lines[key] ?? plot.wording.at(-1)!.lines[key], `${plot.id} ${w.title}: ${key}`).toBeTruthy();
    }
  });
});

describe("plots played out in London, 1750", () => {
  it("binds a seeded debt, sends the creditor over, and ends it by payment or seizure", () => {
    const e = session();
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
});
