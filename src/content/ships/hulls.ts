import { at } from "../caves/regions";
import type { Box } from "../caves/types";
import type { Hull } from "./types";

const ATLANTIC: Box = [-82, -40, 20, 62];
const SWAHILI: Box = [32, -27, 52, 12];
const GULF: Box = [47, 22, 60, 31];
const MALABAR: Box = [66, 6, 80, 25];
const WEST_AFRICA: Box = [-20, -18, 12, 20];
const NEW_WORLD: Box = [-130, -56, -34, 60];
// Wherever European ships went in the sailing age.
const EUROPEAN_SEAS = [ATLANTIC, at.europe, at.mediterranean, at.caribbean, NEW_WORLD, WEST_AFRICA, at.southernAfrica, at.india, at.southeastAsia, [110, 18, 124, 32] as Box];
const ANYWHERE: Box = [-180, -60, 180, 72];

export const hulls: readonly Hull[] = [
  {
    id: "galleon", kind: "square-rigger", label: "Galleon",
    years: [1540, 1690], where: EUROPEAN_SEAS,
    length: 34, beam: 9, masts: [0.2, 0.5, 0.74], below: ["gundeck", "hold"],
    poop: 0.3, forecastle: 0.2, freeboard: 46, ports: "guns", look: "varnish", head: "lion",
    people: ["sailor", "bosun", "helmsman", "officer", "ship-cook", "ship-boy", "soldier-aboard", "friar", "merchant-aboard", "carpenter-aboard"],
    weight: 3,
    note: "High-charged ships of the Spanish, Portuguese, Dutch and English: fore and aft castles, square sails on fore and main, a lateen on the mizzen. The Manila galleons and the flotas are documented in detail; the deck plan here is a composite.",
  },
  {
    id: "indiaman", kind: "square-rigger", label: "East Indiaman",
    years: [1680, 1840], where: [...EUROPEAN_SEAS, [140, -44, 154, -28]],
    length: 40, beam: 10, masts: [0.2, 0.5, 0.76], below: ["gundeck", "hold"],
    poop: 0.28, forecastle: 0.16, freeboard: 44, ports: "guns", look: "tarred", head: "woman",
    people: ["sailor", "bosun", "helmsman", "officer", "ship-cook", "ship-boy", "lascar", "soldier-aboard", "passenger-gentry", "carpenter-aboard", "surgeon-aboard", "convict"],
    weight: 3,
    note: "The big armed merchantmen of the East India companies and the navies' ships of the line looked much alike: a gun deck under the weather deck, a quarterdeck with the wheel, the boats on the booms. Convict transports to New South Wales were usually such ships.",
  },
  {
    id: "emigrant-ship", kind: "square-rigger", label: "Emigrant ship",
    years: [1815, 1895], where: [...EUROPEAN_SEAS, at.australia, [165, -48, 179, -34], at.northAmerica],
    length: 38, beam: 9, masts: [0.2, 0.5, 0.76], below: ["steerage", "hold"],
    poop: 0.22, forecastle: 0.14, freeboard: 38, ports: "painted", look: "black",
    people: ["sailor", "bosun", "helmsman", "officer", "ship-cook", "ship-boy", "emigrant", "emigrant-child", "surgeon-aboard"],
    weight: 3,
    note: "Packet ships and barques carried most of the millions who left Europe before steam took over in the 1870s: steerage berths in two tiers down the 'tween deck, a voyage of five weeks to New York or three months to Australia.",
  },
  {
    id: "junk", kind: "junk", label: "Junk",
    years: [960, 1920], where: [at.china, at.southeastAsia, [118, 22, 131, 34]],
    length: 32, beam: 10, masts: [0.27, 0.5, 0.8], below: ["compartments"],
    poop: 0.24, forecastle: 0.1, freeboard: 40, look: "varnish",
    people: ["junk-sailor", "junk-helmsman", "huozhang", "junk-cook", "junk-merchant", "nanyang-migrant"],
    weight: 4,
    note: "Ocean-going junks of the Fujian and Guangdong trade: a flat transom bow, a high stern, battened sails of matting, a hold split into watertight compartments, and a shrine to Mazu aft. The Quanzhou wreck (1270s) and the Tek Sing (1822) give the plan.",
  },
  {
    id: "dhow", kind: "dhow", label: "Dhow",
    years: [-500, 2027], where: [at.arabia, SWAHILI, GULF, MALABAR, at.horn, [32, 12, 44, 30]],
    length: 26, beam: 8, masts: [0.2, 0.52], below: ["hold"],
    poop: 0.26, forecastle: 0.08, freeboard: 34, look: "oiled", head: "scroll",
    people: ["dhow-sailor", "nakhoda", "dhow-helmsman", "dhow-singer", "dhow-merchant", "hajji"],
    weight: 4,
    note: "Sewn and later nailed ships of the Indian Ocean, sailing on the monsoon: a raked stem, a high square stern on the baghlah and boom, lateen sails, a hearth in a box of sand. The design is old and stable; this one stands for the baghlah and boom of the last few centuries.",
  },
  {
    id: "steamer", kind: "steamer", label: "Steamship",
    years: [1855, 1965], where: [ANYWHERE],
    length: 50, beam: 10, masts: [0.2, 0.78], below: ["steerage", "stokehold"],
    poop: 0.14, forecastle: 0.12, freeboard: 52, ports: "portholes", funnels: 1, look: "liner",
    people: ["deckhand", "steamer-officer", "steward", "stoker", "emigrant", "emigrant-child", "hajji", "lascar"],
    weight: 2,
    note: "The ocean steamer of the great migrations, 1860s to 1950s: a black hull, a white midships house with the bridge, a funnel in the company's colours, steerage in the 'tween decks and the stokehold under it all. Crossings fell from five weeks to ten days.",
  },
];

export const hullById = new Map(hulls.map((h) => [h.id, h]));
