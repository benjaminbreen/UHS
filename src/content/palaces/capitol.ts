import type { Fair } from "../fairs/types";
import { palacePlan } from "./kit";
import { federal, ROYAL_BLUE } from "./styles";
import { senateTerms } from "./senators.generated";

const { room } = palacePlan(["senate-clerk", "senate-member"]);
export const capitol: Fair = {
  id: "us-capitol", name: "the United States Capitol", city: "Washington", place: "city-washington-d-c",
  where: [-77.2, 38.8, -76.9, 39.0], years: [1859, 2026], entry: "corridor",
  prompt: /\b(?:(?:u ?s|united states|american) (?:capitol|senat(?:e|or))|capitol hill|senate chamber|senator in washington)\b/,
  look: "palace", palace: { ...federal, cloth: ROYAL_BLUE }, scale: 5,
  areas: [
    room("corridor", "the Senate corridor", [0, 5, 9, 3], [], 0, "Senators and clerks pass through on their way to the floor.", { gate: "s", palace: { room: "vestibule" }, basis: "inferred" }),
    room("chamber", "the Senate chamber", [0, 0, 9, 5], [], 0, "Rows of desks curve around the presiding officer. A clerk reads the business before the Senate.", { palace: { room: "assembly", bays: ["panel", "panel", "arch"] }, basis: "inferred" }),
  ],
  posts: [["Senator", /\bsenators?\b/, "statesman", 1], ["Senate clerk", /\bclerks?\b/, "civil-servant", 1]],
  residents: senateTerms.map(([name, sex, born, first, last]) => [name, "Senator", sex, born, first, last, "chamber"]),
  role: "Visitor", finds: [], ticket: 0, coin: ["dollar", "dollars"], words: { short: "", enter: "the Senate wing of the Capitol." },
};
