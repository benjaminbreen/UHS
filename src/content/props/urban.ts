import type { PropDef } from "./catalog";
/** Explicit settlement furniture keeps its authored frame through the prop overlay. */
export const urbanProps: Record<string, PropDef> = {
  ferryTicketBooth: {
    name: "Ferry ticket booth", family: "ticket-booth", sprite: "harbor-ticket-office", solid: true,
    act: { verb: "Buy a ferry ticket", price: 1, gives: { "ferry-ticket": 1 }, text: "The clerk tears a ticket from the book and slides it under the grille." },
  },
  marketCounter: {
    name: "Market counter",
    family: "market-counter",
    solid: true,
    container: true,
  },
};
