import { sexFromName } from "../content/characters/name-sex";
import type { Actor } from "./types";

/** A span of the focus card's text. `tone` picks the colour; plain spans have
 * none. */
export type BriefSpan = {
  text: string;
  tone?: "name" | "role" | "state" | "thing";
};
/** Two lines: who they are, then what they are doing as you look at them. */
export type PersonBrief = { identity: BriefSpan[]; moment: BriefSpan[] };

type Sex = "male" | "female" | undefined;

const sexOf = (a: Actor): Sex => {
  const declared = a.origin?.sex ?? a.appearance?.physique?.sex;
  return declared === "male" || declared === "female"
    ? declared
    : sexFromName(a.name);
};
const pronoun = (sex: Sex) =>
  sex === "female" ? "She" : sex === "male" ? "He" : "They";
/** "They is" is the one place the neutral pronoun needs a different verb. */
const is = (sex: Sex) => (sex === "male" || sex === "female" ? "is" : "are");
const has = (sex: Sex) => (sex === "male" || sex === "female" ? "has" : "have");
/** Roles are stored title-cased for headings; mid-sentence they are not. */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "At work as a potter" — a label that reads after "is", unlike the bare role
 * the plan used to hand back. */
export const atWork = (role: string) =>
  `At work as ${/^[aeiou]/i.test(role) ? "an" : "a"} ${lower(role)}`;

/** Most activity labels are verb or prepositional phrases and read straight
 * after "is". The handful that are bare nouns — "Household work" — need a verb
 * putting in front of them. */
const VERBAL = /^(at|on|in|near|out|by|with|under|sent|\w+ing)\b/i;
const clause = (activity: string) =>
  VERBAL.test(activity) ? lower(activity) : `busy with ${lower(activity)}`;

/** Kin terms from the actor's side: a `parent` relation means the named person
 * is their parent, so they are the son or daughter. */
function kinTerm(kind: string, sex: Sex, first: boolean) {
  const word =
    kind === "partner"
      ? sex === "female"
        ? "Wife of"
        : sex === "male"
          ? "Husband of"
          : "Married to"
      : kind === "parent"
        ? sex === "female"
          ? "Daughter of"
          : sex === "male"
            ? "Son of"
            : "Child of"
        : kind === "child"
          ? sex === "female"
            ? "Mother of"
            : sex === "male"
              ? "Father of"
              : "Parent of"
          : "Lives with";
  return first ? word : lower(word);
}

const RANK: Record<string, number> = { partner: 0, child: 1, parent: 2 };

/**
 * Two lines of plain description, assembled from what the simulation already
 * knows. Every clause is dropped when its fact is missing, so a stranger with
 * no household gets a shorter card rather than a vaguer one.
 */
export function personBrief(
  actor: Actor,
  nameOf: (id: string) => string | undefined,
  itemName: (id: string) => string | undefined,
  carrying?: string,
): PersonBrief {
  const sex = sexOf(actor);
  const identity: BriefSpan[] = [{ text: actor.role, tone: "role" }];
  if (actor.age !== undefined) identity.push({ text: `, ${actor.age}` });
  identity.push({ text: "." });
  const kin = (actor.relations ?? [])
    .filter((r) => r.kind !== "co-resident" && nameOf(r.other))
    .sort((a, b) => (RANK[a.kind] ?? 3) - (RANK[b.kind] ?? 3))
    .slice(0, 2);
  kin.forEach((r, i) => {
    identity.push({ text: ` ${kinTerm(r.kind, sex, i === 0)} ` });
    identity.push({ text: nameOf(r.other)!, tone: "name" });
    identity.push({ text: i === kin.length - 1 ? "." : "," });
  });

  // Station labels are all verb or prepositional phrases, so every one of them
  // reads after "is": "is walking to the well", "is at the field".
  // The identity line already names the trade, so the generic work label would
  // say it twice in two lines.
  const doing =
    actor.activity === atWork(actor.role) ? "At work" : actor.activity;
  const moment: BriefSpan[] = [
    { text: `${pronoun(sex)} ${is(sex)} ${clause(doing)}` },
  ];
  const held =
    carrying ?? (actor.heldItem ? itemName(actor.heldItem) : undefined);
  if (held) moment.push({ text: ", carrying " }, { text: held, tone: "thing" });
  // One body note at most, worst first: a card that lists every gauge reads
  // like a status screen.
  const note =
    (actor.health ?? 100) < 50
      ? "is hurt"
      : actor.hunger > 65
        ? `${has(sex)} not eaten today`
        : actor.fatigue > 70
          ? `${is(sex)} worn out`
          : undefined;
  if (note) moment.push({ text: ", and " }, { text: note, tone: "state" });
  moment.push({ text: "." });
  if (actor.trust < 0)
    moment.push(
      { text: " " },
      { text: `${pronoun(sex)} ${is(sex)} wary of you`, tone: "state" },
      { text: "." },
    );
  return { identity, moment };
}

export const briefText = (b: PersonBrief) =>
  [b.identity, b.moment].map((l) => l.map((s) => s.text).join("")).join(" ");
