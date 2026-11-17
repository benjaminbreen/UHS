import type { Fair, FairArea, FairFind } from "../fairs/types";
import { find as f, palacePlan } from "./kit";
import { CRIMSON, federal, OLD_GOLD, ROYAL_BLUE, SAGE } from "./styles";

// The President's House in Washington from 1818, when it was reopened after the fire of 1814,
// to 1900. Up the screen is south: in from Pennsylvania Avenue by the north door, through the
// Entrance Hall to the three parlours and out to the south grounds, with the East Room and the
// State Dining Room at either end. The office and the library were on the floor above; they are
// set beside the state rooms here, with no stair.

const finds: readonly FairFind[] = [
  f("lansdowne", "George Washington, by Gilbert Stuart", "painting", [], "prize", "Washington at full length in black velvet, one arm out, painted in 1797.", "When the British burned the house in 1814, Dolley Madison would not leave until it was taken off the wall. It is the only thing in the house that was here before the fire.", { tint: "#2a2a34", w: 2 }),
  f("monroe-plateau", "The Monroe plateau", "vase", [], "prize", "A mirrored centrepiece of gilt bronze more than fourteen feet long, with figures holding candles round its edge.", "President Monroe ordered it from Paris in 1817 with the rest of the furniture. Congress asked why American makers had not been used.", { tint: "#d8a83a" }),
  f("pianoforte", "Pianoforte", "piano", [], "notable", "A square piano with the lid up and music on the stand.", "The Marine Band plays for receptions here, and on the south grounds on summer Saturdays, when anybody may walk in and listen.", { verb: "Listen", time: 300, staff: "wh-bandsman" }),
  f("card-tray", "Card tray", "counter", [], "notable", "A silver tray on the hall table, deep in visiting cards.", "Anybody may call. You leave a card with the doorkeeper, and on reception days you walk in, shake the President's hand and walk out.", { verb: "Leave your card", time: 120, staff: "wh-doorkeeper" }),
  f("cabinet-table", "The Cabinet table", "counter", [], "notable", "A long table covered in green baize, with a chair for each department.", "The Cabinet meets here twice a week. The President's own desk is in the same room, and so are the people waiting to see him.", { staff: "wh-secretary", tint: "#3e6a4a" }),
  f("french-vases", "Paris porcelain vase", "vase", ["state"], "common", "A French porcelain vase painted with a view of a town, on a gilt base.", "Part of what Monroe bought in France to refurnish the house after the fire.", { tint: "#f0e8d8", weight: 3 }),
  f("marble-bust", "Marble bust", "statue", ["state", "garden"], "common", "A marble bust of a former President on a pedestal.", "Congress votes the money for one from time to time.", { weight: 2 }),
];

const callers = ["wh-caller", "wh-caller", "wh-office-seeker", "wh-office-seeker", "wh-congressman", "wh-servant", "wh-secretary", "wh-officer"];
const { room, open } = palacePlan(callers, ["wh-gardener"]);
const parlour = (cloth: readonly string[]) => ({ cloth, field: cloth });

const areas: FairArea[] = [
  open("north-grounds", "the north grounds", [10, 26, 20, 6], "The lawn and carriage drive on Pennsylvania Avenue. The gates stand open in the daytime.", { gate: "s" }),
  room("entrance-hall", "the Entrance Hall", [14, 21, 12, 5], ["state"], 2, "The hall inside the north door, where the doorkeeper sits and callers wait.", { palace: { room: "gallery", floor: "marble", bays: ["panel", "mirror", "panel"] }, exhibits: ["card-tray"], people: [...callers, "wh-doorkeeper"] }),
  room("east-room", "the East Room", [26, 15, 8, 11], ["state"], 2, "The largest room in the house, the whole depth of the east end, used for receptions, balls, weddings and funerals.", { palace: { room: "ballroom", floor: "herringbone", cloth: OLD_GOLD, bays: ["window", "mirror", "panel"] }, exhibits: ["lansdowne", "pianoforte"] }),
  room("state-dining", "the State Dining Room", [6, 15, 8, 11], ["state"], 1, "The dining room at the west end, for dinners of thirty or forty.", { palace: { room: "dining", cloth: SAGE, bays: ["hearth", "panel", "window"] }, exhibits: ["monroe-plateau"] }),
  room("green-room", "the Green Room", [14, 16, 4, 5], ["state"], 1, "The first of three parlours on the south side, used as a card room and for small dinners.", { palace: parlour(SAGE) }),
  room("blue-room", "the Blue Room", [18, 16, 4, 5], ["state"], 1, "The oval drawing room in the middle of the south front, where the President stands to receive. It was crimson until 1837; it has been blue since.", { palace: { ...parlour(ROYAL_BLUE), bays: ["window", "panel", "window"] } }),
  room("red-room", "the Red Room", [22, 16, 4, 5], ["state"], 1, "The parlour next to the dining room, a music room and the family's sitting room.", { palace: { ...parlour(CRIMSON), bays: ["panel", "hearth", "panel"] } }),
  room("office", "the President's office", [26, 10, 8, 5], [], 0, "The room where the President works and the Cabinet meets. It was upstairs on the south side; anybody with business, or without, could come up and wait.", { palace: { room: "office", floor: "herringbone", bays: ["bookcase", "window", "panel"], cloth: SAGE }, exhibits: ["cabinet-table"], people: ["wh-office-seeker", "wh-office-seeker", "wh-secretary", "wh-congressman"], basis: "inferred" }),
  room("library", "the library", [6, 10, 8, 5], [], 0, "The oval room upstairs, fitted with bookcases in 1850 when the Fillmores found there was not a book in the house.", { palace: { room: "library", floor: "herringbone", bays: ["bookcase", "bookcase", "hearth"], cloth: CRIMSON }, people: ["wh-secretary", "wh-servant"], basis: "inferred" }),
  open("south-grounds", "the south grounds", [10, 10, 16, 6], "The sloping lawn toward the river, open to the public, where the Marine Band plays on summer Saturdays.", { bandstands: 1, band: "wh-bandsman" }),
];

export const whiteHouse: Fair = {
  id: "white-house",
  name: "the President's House",
  city: "Washington",
  where: [-77.2, 38.8, -76.9, 39.0],
  years: [1818, 1900],
  entry: "north-grounds",
  areas,
  scale: 5,
  look: "palace",
  palace: federal,
  role: "Clerk",
  finds,
  ticket: 0,
  coin: ["dollar", "dollars"],
  prompt: /\bwhite house\b|\bpresident'?s house\b/,
  place: "city-washington-d-c",
  staff: { "": "wh-servant" },
  words: {
    short: "",
    gate: "Nobody stops you at the gate.",
    enter: "a white house on a lawn, the front door standing open.",
  },
};
