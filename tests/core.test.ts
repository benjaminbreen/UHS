import { describe, it, expect } from "vitest";
import { doorApproach } from "../src/core/doors";
import { createSession, restoreSession } from "../src/runtime/session";
import { createWorld } from "../src/world/generate";
import { packs } from "../src/content/packs";
import { findPath } from "../src/core/pathfinding";
import { canonical } from "../src/core/random";
import { householdStory } from "../src/world/v3/household-story";
import { marriagePracticeFor } from "../src/content/households/practices";
import { lifeAimOf, advanceLifeAim } from "../src/core/life-aim";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { Engine } from "../src/core/engine";
import type { Actor, Household, PlayerCommand, Position } from "../src/core/types";
let serial = 0;
const act = (e: Engine, command: PlayerCommand) =>
  e.act({
    actionId: `test-${serial++}`,
    expectedRevision: e.state.revision,
    command,
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
    expect(lifeAimOf("aim-0", roman, player, [child], [{ ...household, familyPlans: [] }]).id)
      .toBe("child-future");
    expect(lifeAimOf("aim-0", konya, player, [child], [household]).id)
      .toBe("child-future");
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
    expect(lifeAimOf("aim-wording", setting, player, [child], [household]).text)
      .toBe("See Nawelkura, your 7-year-old daughter, safely into adulthood, with choices of their own.");

    child.age = 19;
    const grown = lifeAimOf("aim-wording", setting, player, [child], [household]);
    expect(grown.text).toContain("Nawelkura, your 19-year-old daughter");
    expect(grown.text).toContain(`in ${setting.location}`);

    player.relations = [];
    household.fortune = 0.2;
    household.history = [{ year: setting.year - 1, kind: "fire" }];
    const hardship = lifeAimOf("aim-wording", setting, player, [child], [household]);
    expect(hardship.text).toContain(`in ${setting.location} after the fire`);
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
    const e = createSession("roman", undefined, undefined, undefined, 1);
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
