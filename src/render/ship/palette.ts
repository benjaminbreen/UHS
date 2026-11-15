import type { Hull } from "../../content/ships";

/** Light to dark, five steps, warm lights and violet-leaning shadows. */
export type Ramp = readonly [string, string, string, string, string];

export type ShipPalette = {
  /** Hull side planking above the wales. */
  side: Ramp;
  /** The broad wales and the darkest timber. */
  wale: Ramp;
  /** A painted strake: the gun-deck band, the white sheer, the junk's red. */
  band?: Ramp;
  /** Below the waterline: copper, lime or antifouling. */
  bottom: Ramp;
  /** Deck planking and its seams. */
  deck: Ramp;
  /** Inside face of the bulwarks. */
  bulwark: Ramp;
  /** Cap rails, spars, carved and turned wood. */
  rail: Ramp;
  /** Sailcloth or matting. */
  sail: Ramp;
  /** Gilding, brass and paint for the carving. */
  gilt: Ramp;
  /** Paint for deckhouses and superstructure. */
  house: Ramp;
};

const SAILCLOTH: Ramp = ["#fbf3dc", "#ece0bf", "#d3c39c", "#ad9b78", "#7d6c58"];
const OAK: Ramp = ["#d8b98a", "#b8955f", "#8f6c43", "#64472d", "#3c2a20"];
const GILT: Ramp = ["#ffe8a0", "#e8c060", "#c0903a", "#8a5e2a", "#553820"];

export function shipPalette(hull: Hull, year: number): ShipPalette {
  switch (hull.look) {
    case "tarred":
      return {
        side: ["#5d4a40", "#46362f", "#342824", "#251c1c", "#181216"],
        wale: ["#3e322e", "#2c2322", "#1f1819", "#161114", "#0e0b10"],
        band: ["#f1cf7a", "#d9ac52", "#b8873a", "#8a6230", "#5a3f26"],
        bottom: year >= 1780 ? ["#e7a46c", "#c77d4c", "#9c5a3a", "#6f3f2c", "#462820"] : ["#efe6cf", "#d8ccb0", "#b4a88e", "#8a806e", "#5e584e"],
        deck: ["#ddd0b0", "#c9b893", "#b09d79", "#8c7a5d", "#5b4c3d"],
        bulwark: ["#c4624a", "#a64c39", "#83392d", "#5e2a24", "#3c1c1c"],
        rail: OAK, sail: SAILCLOTH, gilt: GILT,
        house: ["#e9e2cf", "#d0c6ae", "#aea48c", "#82796a", "#565048"],
      };
    case "varnish":
      return hull.kind === "junk"
        ? {
            side: ["#b88552", "#9a6a3e", "#7a5030", "#583824", "#38241a"],
            wale: ["#5e4030", "#463024", "#33231c", "#241914", "#160f0e"],
            band: ["#e0624a", "#c24434", "#9c3028", "#6e2220", "#461818"],
            bottom: ["#f2ece0", "#ddd3c2", "#bdb19e", "#958a7a", "#675f56"],
            deck: ["#d6aa72", "#c0925c", "#a07648", "#7a5636", "#4e3624"],
            bulwark: ["#d65c44", "#b44234", "#8e3028", "#642220", "#3e1618"],
            rail: ["#d29a5c", "#b07844", "#8a5832", "#623c24", "#3e2618"],
            sail: ["#e8a868", "#cc844a", "#a86438", "#7c462a", "#4e2c20"],
            gilt: GILT,
            house: ["#e8c890", "#cca470", "#a88054", "#7c5a3c", "#4e3a28"],
          }
        : {
            side: ["#c08a56", "#a06c3e", "#7e512e", "#5a3822", "#3a2419"],
            wale: ["#4a3426", "#36261e", "#281c17", "#1c1412", "#120d0e"],
            band: ["#e0b85c", "#c4943e", "#9c6e2e", "#6e4a24", "#46301c"],
            bottom: ["#efe6cf", "#d8ccb0", "#b4a88e", "#8a806e", "#5e584e"],
            deck: ["#d8b47e", "#c29a66", "#a27c50", "#7c5c3c", "#4f3a28"],
            bulwark: ["#b8503c", "#9a3e30", "#7a2e26", "#56201e", "#361616"],
            rail: OAK, sail: SAILCLOTH, gilt: GILT,
            house: ["#d8b47e", "#c29a66", "#a27c50", "#7c5c3c", "#4f3a28"],
          };
    case "black":
      return {
        side: ["#4c4f58", "#35383f", "#25272d", "#1a1b20", "#111216"],
        wale: ["#2c2e34", "#202227", "#17181c", "#101114", "#0a0a0d"],
        band: ["#f6f2e6", "#e2dccb", "#c2baa6", "#948c7c", "#625c52"],
        bottom: ["#f0d690", "#d4b262", "#ad8a42", "#7c602e", "#4e3c22"],
        deck: ["#e4d2a6", "#cfba8c", "#b39d70", "#8c7854", "#5a4c3a"],
        bulwark: ["#f0ebdf", "#dad3c2", "#b8b09e", "#8a8476", "#5c5850"],
        rail: OAK, sail: SAILCLOTH, gilt: GILT,
        house: ["#f2eee2", "#dcd5c4", "#b9b1a0", "#8a8476", "#5c5850"],
      };
    case "oiled":
      return {
        side: ["#dca868", "#c08a4c", "#9c6c38", "#744e2a", "#4a321e"],
        wale: ["#7c5430", "#5e3e24", "#442c1c", "#2e1e14", "#1c130e"],
        band: ["#f2ead8", "#dcd0b6", "#bcae92", "#8e8270", "#605848"],
        bottom: ["#fbf6ea", "#e8dfcc", "#cabfa8", "#9c927e", "#6c6456"],
        deck: ["#d8a868", "#bf8e52", "#9e7040", "#78522e", "#4c3420"],
        bulwark: ["#c89458", "#a87642", "#845832", "#5e3e24", "#3c2818"],
        rail: ["#e2b070", "#c69050", "#a06e3a", "#744e2a", "#4a321e"],
        sail: ["#fcf6e4", "#efe4c6", "#d8c8a2", "#b0a080", "#7e705c"],
        gilt: ["#7ad0c4", "#4ea89c", "#2e7c74", "#1e5650", "#123634"],
        house: ["#d8a868", "#bf8e52", "#9e7040", "#78522e", "#4c3420"],
      };
    case "liner":
    default:
      return {
        side: ["#4a4e58", "#33363e", "#24262c", "#191a1f", "#101115"],
        wale: ["#2a2c32", "#1e2025", "#16171b", "#0f1013", "#09090c"],
        band: ["#ffffff", "#e8eaea", "#c8cccc", "#9aa0a2", "#6a7072"],
        bottom: ["#e0705a", "#c4503e", "#9c3a30", "#702a26", "#481c1c"],
        deck: ["#e6d6b0", "#d4c098", "#b8a27a", "#907c5c", "#5e5040"],
        bulwark: ["#f6f6f0", "#e2e2da", "#c2c4bc", "#94968e", "#64665e"],
        rail: ["#d8b47e", "#bf9662", "#9c7648", "#725434", "#4a3624"],
        sail: SAILCLOTH, gilt: ["#ffe8a0", "#e8c060", "#c0903a", "#8a5e2a", "#553820"],
        house: ["#fbfbf6", "#e8e9e2", "#cdd0c8", "#a0a49c", "#6e7270"],
      };
  }
}

/** The open sea by climate: deep, mid, light, crest, glint. */
export function seaRamp(lat: number): Ramp {
  const a = Math.abs(lat);
  if (a < 24) return ["#1a5a72", "#21788c", "#3a98a2", "#9ad8d0", "#f4fffa"];
  if (a < 42) return ["#1c4664", "#27607a", "#3b7c8e", "#94c4c8", "#f2fbfa"];
  return ["#1e3a50", "#2a4e62", "#3d6474", "#9ab8bc", "#eef6f6"];
}
