import { it, expect } from "vitest";
import { runEconomy } from "../src/core/economy";
import { harvestResource } from "../src/core/livelihood";
import type { Economy, Household } from "../src/core/types";

const village = (): Household[] => {
  const h = (id: string, x: number, makes: string[], buys: [string, string][]) => ({
    id, members: [id + "1", id + "2"], home: { x, y: 0, space: "outside" as const },
    storeId: id, makes, buys: buys.map(([good, from]) => ({ good, from })),
  });
  const v = [
    h("farm", 0, ["grain"], [["bread", "baker"], ["drink", "brewer"]]),
    h("baker", 5, ["bread"], [["drink", "brewer"]]),
    h("brewer", 9, ["drink"], [["bread", "baker"]]),
  ];
  // Two farmers cannot keep both a baker and a brewer in grain.
  v[0].members.push("farm3");
  return v;
};
const everyone = (h: Household) => h.members.length;
const ledger = (): Economy => ({ hour: 0, stock: {}, short: {} });

it("keeps household stocks bounded and fed while every trade works", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 7, everyone);
  expect(e.short).toEqual({});
  for (const stock of Object.values(e.stock))
    for (const n of Object.values(stock)) expect(n).toBeLessThanOrEqual(90);
});

it("runs bread and ale short downstream when the farm stops", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 21, (h) => (h.id === "farm" ? 0 : everyone(h)));
  expect(e.short.brewer).toEqual(["bread", "drink"]);
  expect(e.stock.baker.bread).toBe(0);
});

it("feeds a household grain from the farm when the baker stops", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 21, (h) => (h.id === "baker" ? 0 : everyone(h)));
  expect(e.short.brewer).toBeUndefined();
  expect(e.stock.baker.bread).toBe(0);
});

it("catches up an absence exactly as if it had been watched", () => {
  const v = village(), watched = ledger(), away = ledger();
  for (let t = 1; t <= 72; t++) runEconomy(v, watched, t, everyone);
  runEconomy(v, away, 72, everyone);
  expect(away).toEqual(watched);
});

it("slows a patch's regrowth when it is taken from again and again", () => {
  const regrowth = (every: number) => {
    const a = { pos: { x: 0, y: 0, space: "outside" }, inventory: {} } as any;
    const o = { pos: a.pos, inventory: { fruit: 1 }, depleted: false,
      resource: { item: "fruit", capacity: 1, regrowSeconds: 86400, seasons: ["summer"], readyAt: 0 } } as any;
    let t = 0;
    for (let i = 0; i < 4; i++, t += every) {
      o.depleted = false; o.inventory.fruit = 1;
      harvestResource(a, o, t);
    }
    return o.resource.readyAt - (t - every);
  };
  expect(regrowth(86400)).toBeGreaterThan(regrowth(86400 * 60));
});
