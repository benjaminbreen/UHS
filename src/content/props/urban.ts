import type { PropDef } from "./catalog";
/** Explicit settlement furniture keeps its authored frame through the prop overlay. */
export const urbanProps: Record<string, PropDef> = {
  ferryTicketBooth: {
    name: "Ferry ticket booth", family: "ticket-booth", sprite: "harbor-ticket-office", solid: true,
    act: { verb: "Buy a ferry ticket", price: 1, gives: { "ferry-ticket": 1 }, text: "The clerk slides you a ticket. The conductor punches it on the outward crossing. The return is free." },
  },
  fishCounter: {
    name: "Fish seller’s counter", family: "market-counter", sprite: "harbor-fish-counter-0", solid: true, visualClearance: [1, 2, 2, 0],
  },
  fishCuringShed: {
    name: "Fish curing shed", family: "drying-rack", sprite: "harbor-fish-shed-0", solid: true, visualClearance: [2, 2, 2, 0],
  },
  grainHoist: {
    name: "Warehouse grain hoist", family: "warehouse-hoist", sprite: "harbor-grain-hoist", solid: true,
  },
  clothCounter: {
    name: "Cloth measuring counter", family: "market-counter", sprite: "harbor-cloth-counter-0", solid: true,
  },
  marketCounter: {
    name: "Market counter",
    family: "market-counter",
    solid: true,
    container: true,
  },
};
