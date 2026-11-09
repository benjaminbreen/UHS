import { seasonAt } from "../../core/livelihood";
import { CHINA, partnerWords, pronounWords, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const stranger = { type: "choose" as const, line: "stranger", choices: [{ id: "tend" }, { id: "leave" }] };

const kinOf = (c: PlotContext) => {
  const ours = c.actors.filter((a) => a.kind === "human" && !a.dead && a.id !== c.player.id &&
    a.householdId === c.player.householdId && (a.age ?? 0) >= 8);
  const partner = c.player.relations?.find((r) => r.kind === "partner")?.other;
  return ours.find((a) => a.id === partner) ?? ours[0];
};

/** Qingming, early in the third month: the household goes out to the family
 * graves to sweep them and feed the dead. A Tang edict of 732 made the grave
 * visit part of the Cold Food festival; burning paper money there is Song. */
export const qingming: PlotTemplate = {
  id: "qingming",
  shape: "occasion",
  look: {
    emblem: "graves",
    palette: { ink: "#0e140e", fill: "#1c2a1e", edge: "#5a6a40", light: "#e6f2e8", accent: "#e8c070" },
  },
  weight: (c) => (c.setting && within(c, { years: [732, 2100], bounds: CHINA }) &&
    seasonAt(c.setting.season, c.clock) === "spring" && kinOf(c) ? 0.9 : 0),
  cast: (c) => {
    const kin = kinOf(c);
    return kin && { kin };
  },
  begin: (c, cast) => {
    const kin = cast.kin!;
    const p = partnerWords(c);
    const year = c.setting?.year ?? 1500;
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 18 * 3600,
      words: {
        kin: kin.name,
        burn: year >= 960 ? "burn paper money for them to spend" : "pour out wine for them",
        cold: year < 1500 ? " Since yesterday no fires have been lit for cooking, for the Cold Food days, so everything is eaten cold." : "",
        ...pronounWords(kin),
        ...p.words,
      },
      refs: { kin: kin.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "go", focus: "kin", from: "kin", choices: [{ id: "now" }, { id: "later" }, { id: "send" }] }],
  developments: [
    { id: "go-now", when: { type: "fired", id: "now" }, then: [{ type: "gather", at: "edge", when: 1, label: "graves", aim: "out", scene: "graves" }] },
    { id: "go-later", when: { type: "fired", id: "later" }, then: [{ type: "gather", at: "edge", when: "evening", label: "graves", aim: "out", scene: "graves" }] },
    { id: "there", when: { type: "came" }, then: [stranger] },
  ],
  endings: [
    { id: "tended", when: { type: "fired", id: "tend" } },
    { id: "swept", when: { type: "any", of: [{ type: "fired", id: "leave" }, { type: "all", of: [{ type: "fired", id: "there" }, { type: "gathered" }] }] } },
    { id: "sent", when: { type: "all", of: [{ type: "fired", id: "send" }, { type: "since", hours: 5 }] } },
    { id: "unswept", when: { type: "any", of: [{ type: "gathered" }, { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "now" } }, { type: "not", of: { type: "fired", id: "later" } }] }] } },
  ],
  wording: [
    {
      title: "Sweeping the Graves",
      lines: {
        aim: "Go out with {kin} to sweep the family graves before dark.",
        intro: "It is Qingming, the Clear and Bright festival. Every family goes out to its graves today to pull the weeds, put fresh earth on the mounds, set out food and {burn}.{cold}",
        threat: "Graves nobody tends look like the graves of a family that has died out.",
        partner: "Your {partnerKin} {partner} has wrapped up the food for the graves: rice, a cooked chicken, wine.",
        "kin-partner": "Everyone else has already gone out to the graves. Are you nearly done?",
        "cast-kin": "Is waiting to go out to the family graves with you.",
        go: "The basket's packed. Do we go now, or after the work? Families have been passing on the road since first light.",
        "now:label": "Go now, and leave the work",
        "now:then": "You leave the work where it is. {kin} picks up the hoe and the basket.",
        "later:label": "Finish the work first",
        "later:then": "You tell {kin} you'll go out to the graves this evening, when the day's work is done.",
        graves: "Sweeping the family graves",
        out: "Meet {kin} at the family graves {meet}. They're marked on your map.",
        "send:label": "Send {kin} on without you",
        "send:then": "{kin} takes the basket and goes on alone, and you stay to work.",
        stranger: "Your family's mounds are swept and the food is laid out. Next to them is an old grave nobody has tended in years, the stone half sunk and the mound gone to weeds.",
        "tend:label": "Clear that one too",
        "tend:then": "You pull the weeds from the stranger's grave as well and leave a little of your food on it.",
        "leave:label": "Leave it alone",
        "leave:then": "It isn't yours to tend. You turn back to your own mounds.",
        tended: "You walk home with dirt to the elbows. Whoever lies in that grave has been fed for once, and the old people say that kindness comes back to a family.",
        swept: "You bow, {burn}, and then sit on the grass and eat the rest. Children fly kites all along the hillside.",
        sent: "{kin} comes back at dusk with dirt on {his} knees and says the graves are done. Your relatives asked where you were.",
        unswept: "The light went before you could get out to the graves. Yours are the only ones still overgrown.",
      },
    },
  ],
};
