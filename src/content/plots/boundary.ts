import { B, BRITAIN, dueOf, EGYPT, elderOf, ITALY, neighbours, partnerWords, pickOf, pronounWords, temper, working } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const pairOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 65 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "boundary-suspect") : undefined;
  const others = pool.filter((a) => a.householdId !== suspect?.householdId);
  const neighbour = others.length ? pickOf(c, others, "boundary-neighbour") : undefined;
  const elder = suspect && neighbour && elderOf(c, suspect);
  return suspect && neighbour && elder && elder.id !== neighbour.id ? { suspect, neighbour, elder } : undefined;
};

/** At first light you saw a neighbour shift the stone between two fields
 * that are not yours. Nobody saw you see it. */
export const boundary: PlotTemplate = {
  id: "boundary",
  shape: "witness",
  look: {
    emblem: "stone",
    palette: { ink: "#12140e", fill: "#2a3020", edge: "#6a6a3c", light: "#ecebd8", accent: "#e0b060" },
  },
  weight: (c) => (working(c) && pairOf(c) ? 0.5 * temper(c, "conscientiousness") : 0),
  cast: (c) => pairOf(c) ?? undefined,
  begin: (c, cast) => {
    const { suspect, neighbour, elder } = cast as Required<typeof cast>;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        suspect: suspect.name,
        neighbour: neighbour.name,
        elder: elder.name,
        due,
        paces: pickOf(c, ["two paces", "three paces", "a full stride"], "boundary-paces"),
        ...pronounWords(suspect),
        ...p.words,
      },
      refs: { suspect: suspect.id, neighbour: neighbour.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "decide", focus: "suspect", choices: [{ id: "quiet" }, { id: "told" }, { id: "judged" }, { id: "silent" }] }],
  developments: [
    { id: "paid", when: { type: "fired", id: "bought" }, then: [{ type: "regard", role: "suspect", delta: 2 }] },
    { id: "thanked", when: { type: "fired", id: "sworn" }, then: [{ type: "regard", role: "neighbour", delta: 2 }, { type: "regard", role: "suspect", delta: -2 }] },
    { id: "let-down", when: { type: "fired", id: "doubted" }, then: [{ type: "regard", role: "neighbour", delta: -2 }] },
    {
      id: "named",
      when: { type: "fired", id: "judged" },
      then: [{ type: "regard", role: "elder", delta: 1 }, { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" }],
    },
    {
      id: "offered",
      when: { type: "all", of: [{ type: "fired", id: "quiet" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "offer", focus: "suspect", from: "suspect", choices: [{ id: "bought" }, { id: "returned", check: { stat: "conscientiousness", skill: "speech", odds: 0.55 } }] }],
    },
    {
      id: "row",
      when: { type: "all", of: [{ type: "fired", id: "told" }, { type: "since", hours: 1 }] },
      then: [{ type: "gather", at: "authority", when: 3, label: "hearing", scene: "hearing", aim: "aim-hearing" }, { type: "card", line: "row", focus: "neighbour" }],
    },
    {
      id: "oath",
      when: { type: "all", of: [{ type: "any", of: [{ type: "fired", id: "row" }, { type: "fired", id: "named" }] }, { type: "came" }] },
      then: [{ type: "choose", line: "swear", focus: "suspect", choices: [{ id: "sworn", check: { stat: "conscientiousness", skill: "speech", odds: 0.6 } }, { id: "doubted" }] }],
    },
  ],
  endings: [
    { id: "bought", when: { type: "fired", id: "bought" } },
    { id: "brushed", when: { type: "fired", id: "returned:failed" } },
    { id: "returned", when: { type: "fired", id: "returned" } },
    { id: "outsworn", when: { type: "fired", id: "sworn:failed" } },
    { id: "judged", when: { type: "all", of: [{ type: "fired", id: "sworn" }, { type: "fired", id: "judged" }] } },
    { id: "sworn", when: { type: "fired", id: "sworn" } },
    { id: "doubted", when: { type: "fired", id: "doubted" } },
    { id: "absent", when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }] } },
    { id: "silent", when: { type: "after", id: "silent", hours: 3 } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "silent", when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "row" } }, { type: "not", of: { type: "fired", id: "named" } }] } },
  ],
  wording: [
    {
      // Numa's law made whoever ploughed up a boundary stone sacer, outside the gods' protection; the Terminalia honoured the stones each February.
      scope: { years: [B(700), 400], bounds: ITALY },
      title: "The Moved Stone",
      lines: {
        intro: "At first light you saw {suspect} dig up the boundary stone between {his} field and {neighbour}'s and set it down {paces} into {neighbour}'s land. Boundary stones are sacred to the god Terminus. {suspect} did not see you.",
        threat: "Moving one is a crime against the gods as well as a theft. Nobody else knows.",
        partner: "Your {partnerKin} {partner} says it is not your field, so it is not your business.",
        "kin-partner": "It's not our field. Think hard before you make an enemy over it.",
        swear: "{suspect} swears by Jupiter that {he} never touched the stone. {elder} asks whether you will swear to what you saw.",
        judged: "{elder} walks the line with a staff, finds the fresh earth and the old hole, and has the stone put back with a little wine poured for Terminus. Everyone hears whose hands moved it, and who saw.",
      },
    },
    {
      // The Instruction of Amenemope: "Do not move the markers on the borders of fields."
      scope: { years: [B(3000), B(30)], bounds: EGYPT },
      title: "The Moved Stone",
      lines: {
        intro: "The flood has gone down and the fields are being marked out again. At first light you saw {suspect} pull up the boundary stone between {his} plot and {neighbour}'s and push it in {paces} further over. {suspect} did not see you.",
        threat: "After the flood, the stones are all anyone has to show whose land is whose. Nobody else knows.",
        partner: "Your {partnerKin} {partner} says the scribes will measure again next year anyway.",
        "kin-partner": "It's not our plot. Be careful who you cross.",
        "cast-elder": "Remembers how the fields lay before the flood.",
        swear: "{suspect} swears {he} never touched the stone. {elder} asks whether you will swear to what you saw, by the life of the king.",
        silent: "You say nothing. When the scribes come to measure, they measure from where {suspect} put it.",
      },
    },
    {
      // English parishes walked their bounds at Rogationtide, beating the marks so children would remember them.
      scope: { years: [700, 1850], bounds: BRITAIN },
      title: "The Moved Mark",
      lines: {
        intro: "At first light you saw {suspect} pull up the merestone (the boundary stone) between {his} strip and {neighbour}'s and set it {paces} over. {suspect} did not see you.",
        threat: "The parish walks its bounds once a year, but nobody checks the strips between. Nobody else knows.",
        partner: "Your {partnerKin} {partner} says to keep out of it.",
        "kin-partner": "It's not our strip. Leave it, unless you want trouble with {suspect}.",
        "cast-elder": "Has walked the parish bounds every year since childhood.",
        swear: "{suspect} swears {he} never touched the stone. {elder} asks whether you will swear to what you saw, on the Bible.",
        silent: "You say nothing. The furrow settles, and by next year nobody remembers where the stone used to be.",
      },
    },
    {
      title: "The Moved Stone",
      lines: {
        aim: "Decide what to do about the moved stone, {due}.",
        intro: "At first light you saw {suspect} pull up the boundary stone between {his} field and {neighbour}'s and set it {paces} further over. {suspect} did not see you.",
        threat: "Nobody else knows. Whatever happens now depends on you.",
        partner: "Your {partnerKin} {partner} says it's not your field and not your business.",
        "kin-partner": "It's not our field. Think before you make an enemy.",
        "cast-suspect": "Moved the boundary stone at dawn, and thinks nobody saw.",
        "cast-neighbour": "Owns the field that just got smaller, and doesn't know it.",
        "cast-elder": "Remembers where every boundary used to run.",
        decide: "{suspect} is walking home with the spade over {his} shoulder. Nobody else was out in the fields.",
        "quiet:label": "Have a word with {suspect}",
        "quiet:then": "You catch {suspect} alone and tell {him} what you saw. {He} says nothing and walks away.",
        "told:label": "Tell {neighbour}",
        "told:then": "You tell {neighbour}, who goes straight out to the field.",
        "judged:label": "Take it to {elder}",
        "silent:label": "Keep out of it",
        offer: "Later, {suspect} comes to find you alone. {He} says that strip belonged to {his} family long ago, and that a share of what grows on it could come to you.",
        "bought:label": "Take the share",
        "returned:label": "Tell {him} to put it back",
        "returned:failed": "{suspect} laughs at you. \"Your word against mine.\"",
        swear: "{suspect} swears {he} never touched the stone. {elder} asks whether you will swear to what you saw.",
        row: "{neighbour} found the stone moved, and there's a row at the field. {suspect} denies it, and {neighbour} has named you as the one who saw. Both households are to come before {authority} {meet}.",
        hearing: "At the hearing about the stone",
        "aim-hearing": "Be at the hearing before {authority} {meet}, and say what you saw. It's marked on your map.",
        "judged:then": "{elder} listens, and says the matter will be heard before {authority}, with {suspect} there.",
        "sworn:failed": "Someone from {suspect}'s household swears {he} was at home all morning. It's your word against theirs.",
        outsworn: "With one oath against another, {elder} can't say who is lying, and the stone stays where it is. {suspect} knows who talked.",
        absent: "You don't come to the hearing. With no witness, {elder} leaves the stone where it stands. {neighbour} won't look at you, and {suspect} smiles.",
        "sworn:label": "Swear to what you saw",
        "doubted:label": "Say it was too dark to be sure",
        bought: "You take the share. The stone stays where it is, and at harvest a basket comes to your door. If it comes out, you're as guilty as {suspect}.",
        returned: "{suspect} looks at you for a long time. That evening the stone is back in its old hole. {He} owes you a favour.",
        brushed: "The stone stays where {suspect} put it. {He} knows that you saw, and {he} doesn't care.",
        sworn: "You swear. {elder} has the stone dug up, and beside it is the old hole, the grass still flat. The stone goes back. {neighbour} thanks you; {suspect} will not forget who talked.",
        doubted: "You say it was early and you might be wrong. With no witness, {elder} leaves the stone where it stands. {neighbour} won't look at you, and {suspect} smiles.",
        judged: "{elder} walks the line, finds the fresh earth and the old hole, and has the stone put back in front of both households. Everyone hears whose hands moved it, and who saw.",
        silent: "You say nothing. The stone stays where {suspect} put it, and in a year nobody will remember where it used to be.",
        gone: "With {suspect} gone, the stone is quietly put back where it belongs.",
      },
    },
  ],
};
