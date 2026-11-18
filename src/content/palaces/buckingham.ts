import type { Fair, FairArea, FairFind } from "../fairs/types";
import { find as f, palacePlan } from "./kit";
import { OLD_GOLD, ROYAL_BLUE, SAGE, victorianState } from "./styles";

// Buckingham Palace from 1856, when the Ballroom was finished, to the Queen's death in 1901.
// Up the screen is west: in from the Mall through the forecourt and the Quadrangle to the
// Grand Hall, then the state rooms round the Picture Gallery, and out to the garden. The
// state rooms are on the floor above the hall; the stair is left out and the plan flattened.

const finds: readonly FairFind[] = [
  f("chairs-of-state", "The chairs of state", "throne", [], "prize", "Two gilded chairs under a crimson canopy, on a dais of three steps.", "The Queen receives addresses here, and young women are presented to her at the afternoon Drawing Rooms: a curtsey, a kissed hand, and out backwards without turning."),
  f("winterhalter", "The royal family, by Winterhalter", "painting", [], "prize", "The Queen and Prince Albert with five of their children, painted in 1846, larger than life and very calm.", "It was shown to the public at St James's Palace and a hundred thousand people came to see it.", { tint: "#7a2c3a", w: 2 }),
  f("van-dyck", "Charles I, by Van Dyck", "painting", ["gallery"], "notable", "The King on a white horse under an arch, his riding master holding his helmet.", "It left the country when Cromwell sold the King's pictures, and was bought back.", { tint: "#3a3a4a", weight: 2 }),
  f("rembrandt", "The Shipbuilder and his Wife", "painting", ["gallery"], "notable", "A shipwright at his desk, turning round as his wife bursts in with a letter. Rembrandt, 1633.", "George IV paid five thousand guineas for it, the most he ever gave for a picture.", { tint: "#4a3a2a", weight: 2 }),
  f("erard-piano", "Erard grand piano", "piano", [], "notable", "A grand piano, its case gilded and painted all over with monkeys and cupids.", "Mendelssohn played here in 1842 while the Queen sang and the Prince turned the pages.", { verb: "Listen", time: 300, staff: "bp-musician" }),
  f("sevres", "Sèvres vase", "vase", ["state"], "common", "A vase of dark blue Sèvres porcelain with gilt bronze mounts.", "George IV bought French royal porcelain by the crate after the Revolution put it on the market.", { tint: "#2c3e8a", weight: 3 }),
  f("canova", "Marble by Canova", "statue", ["state", "garden"], "common", "A marble group by Canova, bought by George IV.", "It took the sculptor and his workshop about six years.", { weight: 2 }),
  f("visitors-book", "The visitors' book", "counter", [], "notable", "A book on a table by the door, with a pen.", "People who have been presented at court call afterwards and sign. Nobody reads it, and everybody checks who has signed.", { verb: "Sign the book", time: 120, staff: "bp-page" }),
  f("supper", "The supper room", "kiosk", [], "notable", "A long buffet under gold plate stacked to the ceiling.", "At a state ball two thousand people are fed standing up, after midnight.", { verb: "Take a plate", price: 0, heal: 10, time: 900, tint: "#b8863a", staff: "bp-footman" }),
];

const court = ["bp-guest", "bp-guest", "bp-lady", "bp-lady", "bp-equerry", "bp-footman", "bp-housemaid", "bp-page"];
const { room, open } = palacePlan(court, ["bp-guardsman"]);

const areas: FairArea[] = [
  open("forecourt", "the forecourt", [10, 30, 20, 6], "The gravel court inside the railings, where the guard is changed and carriages set down.", { gate: "s" }),
  open("quadrangle", "the Quadrangle", [12, 24, 16, 6], "The inner court, closed off from the Mall when the east front was built across it in 1850."),
  room("grand-hall", "the Grand Hall", [14, 19, 12, 5], ["state"], 2, "The low entrance hall of white Carrara marble, at the foot of the Grand Staircase.", { palace: { floor: "marble", room: "gallery", bays: ["mirror", "panel", "panel"] }, exhibits: ["visitors-book"] }),
  room("green-drawing", "the Green Drawing Room", [14, 14, 6, 5], ["state"], 2, "The first of the state rooms, where guests gather before going in to the Throne Room.", { palace: { cloth: SAGE } }),
  room("throne-room", "the Throne Room", [20, 14, 6, 5], ["state"], 1, "Crimson silk, a canopy and two chairs. Used for court presentations and, on ball nights before 1856, for dancing.", { palace: { room: "ballroom", bays: ["hanging", "mirror"] }, exhibits: ["chairs-of-state"] }),
  room("ballroom", "the Ballroom", [26, 14, 8, 6], [], 0, "The largest room in London when it opened in 1856, built because two thousand guests no longer fitted in the Throne Room.", { palace: { room: "ballroom", floor: "versailles", bays: ["window", "mirror"], cloth: OLD_GOLD }, exhibits: ["supper"] }),
  room("picture-gallery", "the Picture Gallery", [10, 10, 20, 4], ["gallery"], 4, "A long top-lit room down the middle of the house, hung with George IV's Dutch and Flemish pictures.", { palace: { room: "gallery", bays: ["hanging"] }, exhibits: ["winterhalter"] }),
  room("state-dining", "the State Dining Room", [4, 10, 6, 6], ["state"], 1, "Crimson walls, portraits of the Hanoverian kings, and a mahogany table that seats sixty.", { palace: { room: "dining", bays: ["hearth", "hanging", "hanging"] } }),
  room("blue-drawing", "the Blue Drawing Room", [10, 5, 7, 5], ["state"], 2, "The ballroom of the house until 1856. Its columns are painted to look like onyx.", { palace: { cloth: ROYAL_BLUE, bays: ["window", "mirror", "window", "hanging"] } }),
  room("music-room", "the Music Room", [17, 5, 6, 5], [], 0, "The bow-fronted room in the middle of the garden front, with a floor of inlaid woods.", { palace: { room: "ballroom", floor: "versailles", cloth: ROYAL_BLUE, bays: ["window", "mirror"] }, exhibits: ["erard-piano"] }),
  room("white-drawing", "the White Drawing Room", [23, 5, 7, 5], ["state"], 2, "White and gold, with yellow upholstery. A mirror and cabinet in one corner swing open as a hidden door to the private rooms.", { palace: { cloth: OLD_GOLD, bays: ["mirror", "window", "hearth", "window"] } }),
  open("garden", "the garden terrace", [10, 0, 20, 5], "The terrace on the west front, over forty acres of lawn and a lake in the middle of London.", { fountain: "basin" }),
];

export const buckingham: Fair = {
  id: "buckingham",
  name: "Buckingham Palace",
  city: "London",
  where: [-0.3, 51.4, 0.0, 51.6],
  years: [1856, 1901],
  entry: "forecourt",
  areas,
  scale: 5,
  look: "palace",
  palace: victorianState,
  role: "Courtier",
  finds,
  posts: [["Courtier", /\bcourtier\b/, "courtier", 1], ["Queen", /\bqueen\b/, "ruler", 0]],
  residents: [["Queen Victoria", "Queen", "female", 1819, 1856, 1901, "throne-room"]],
  ticket: 0,
  coin: ["shilling", "shillings"],
  prompt: /\bbuckingham\b/,
  place: "london",
  staff: { "": "bp-footman" },
  words: {
    short: "",
    gate: "The sentry looks at your card and the policeman waves you through.",
    enter: "raked gravel, scarlet coats, and a great many windows.",
  },
};
