import { sexOf, type BriefSpan, type PersonBrief, type Sex } from "./brief";
import { conditionBand } from "./time/structure";
import type { Actor, Place } from "./types";

/** How a resident stands to the householder, said from the householder's side:
 * a relation of kind `parent` means the householder is their parent. */
function kin(kind: string, sex: Sex): string {
  if (kind === "partner")
    return sex === "female" ? "wife" : sex === "male" ? "husband" : "partner";
  if (kind === "parent")
    return sex === "female" ? "daughter" : sex === "male" ? "son" : "child";
  if (kind === "child")
    return sex === "female" ? "mother" : sex === "male" ? "father" : "parent";
  return "lodger";
}
const possessive = (sex: Sex) =>
  sex === "female" ? "her" : sex === "male" ? "his" : "their";
const list = (parts: string[]) =>
  parts.length < 2
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
const TRADE: [number, string][] = [
  [0.8, "brisk"],
  [0.62, "good"],
  [0.44, "steady"],
  [0.26, "slow"],
];
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The focus card for a building: who holds it, what it is, and how it has
 * fared. Every part is read off what the world already knows — the household,
 * the structure's age and wear, the trade the lot supports — so it says the
 * same kind of thing about a Sumerian storehouse as about a Dutch shopfront.
 */
export function placeBrief(
  place: Place,
  year: number,
  holder: Actor | undefined,
  residents: Actor[],
): PersonBrief | undefined {
  if (!holder && !place.structure) return undefined;
  const identity: BriefSpan[] = [];
  // A guildhall has a warden, not a householder. Naming whoever holds the
  // keys as its resident turned every civic building into somebody's house.
  const institution = place.claim?.startsWith("venue-");
  if (holder && !institution) {
    const sex = sexOf(holder);
    identity.push({ text: holder.name, tone: "name" });
    if (holder.role)
      identity.push(
        { text: ", " },
        { text: lower(holder.role), tone: "role" },
        { text: "," },
      );
    identity.push({ text: " lives here" });
    const others = residents
      .filter((a) => a.id !== holder.id)
      .map((a) => {
        const term = kin(
          a.relations?.find((r) => r.other === holder.id)?.kind ?? "co-resident",
          sexOf(a),
        );
        return `${possessive(sex)} ${term} ${a.name}`;
      });
    if (others.length)
      identity.push({ text: ` with ${list(others)}` }, { text: "." });
    else identity.push({ text: " alone." });
  } else {
    identity.push({ text: place.description });
  }

  const moment: BriefSpan[] = [];
  const age = place.structure ? year - place.structure.built : undefined;
  if (age !== undefined) {
    moment.push({ text: "Put up " });
    moment.push({
      text:
        age < 2
          ? "within the year"
          : age < 12
            ? `about ${age} years ago`
            : `about ${Math.round(age / 10) * 10} years ago`,
      tone: "thing",
    });
    const condition = conditionBand(place.condition ?? 1);
    moment.push({ text: ", and " }, { text: condition, tone: "state" }, {
      text: ".",
    });
  }
  if (place.access === "public" && place.trade !== undefined) {
    const band = TRADE.find(([floor]) => place.trade! >= floor)?.[1] ?? "poor";
    moment.push(
      { text: " Business is " },
      { text: band, tone: "state" },
      { text: "." },
    );
  }
  if (!moment.length) return undefined;
  return { identity, moment };
}
