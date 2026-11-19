import { livelihoodById } from "../characters/livelihoods";
import { herdWords, keptSpecies } from "../fauna/herding";
import { distance } from "../../core/types";
import { dueOf, pickOf, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const requests: Record<string, string> = {
  "Working the wharf": "Could you count the next load for me?",
  "Tending the sick": "Could you take water round while I'm out?",
  "Keeping the record": "Could you take the names while I'm gone?",
  "Tending animals": "Could you watch the {herd} until I get back?",
  "Minding the stall": "Could you mind the stall for half an hour?",
  Cooking: "Could you keep an eye on the pot for me?",
};

function coworker(c: PlotContext) {
  const activity = livelihoodById(c.player.origin?.livelihood ?? "")?.activity;
  if (!activity || !requests[activity]) return;
  const employer = c.activitySites?.(c.player.id)?.employment;
  if (activity === "Tending the sick" && employer?.kind !== "hospital") return;
  const job = employer?.id;
  const peers = c.actors.filter((a) => {
    if (a.kind !== "human" || a.dead || a.id === c.player.id || (a.age ?? 30) < 18 ||
      livelihoodById(a.origin?.livelihood ?? "")?.activity !== activity) return false;
    const site = c.activitySites?.(a.id)?.employment?.id;
    return job || site ? job === site : distance(a.work, c.player.work) === 0;
  });
  return pickOf(c, peers, "shift-coworker");
}

export const shift: PlotTemplate = {
  id: "shift",
  shape: "work",
  look: {
    emblem: "line",
    palette: { ink: "#101214", fill: "#262c32", edge: "#5a6672", light: "#e6eaee", accent: "#e0a848" },
  },
  weight: (c) => coworker(c) ? 0.6 * temper(c, "agreeableness") : 0,
  cast: (c) => {
    const friend = coworker(c);
    return friend && { friend };
  },
  begin: (c, cast) => {
    const friend = cast.friend!;
    const child = c.actors.find((a) => !a.dead && a.age !== undefined && a.age >= 4 && a.age < 14 &&
      friend.relations?.some((r) => r.kind === "child" && r.other === a.id));
    const reason = child ? `I promised to walk ${child.origin?.namePersonal || child.name} home.` : "I haven't had a chance to eat.";
    const activity = livelihoodById(friend.origin!.livelihood)!.activity;
    const herd = activity === "Tending animals" && c.setting
      ? c.fauna?.find((g) => g.owner === friend.id || g.owner === c.player.id)?.speciesId ?? keptSpecies(c.setting, c.seed, c.player.role)
      : undefined;
    const request = requests[activity].replace("{herd}", herdWords(herd).herd);
    return { deadline: dueOf(c.clock).deadline, words: { friend: friend.name, reason, request }, refs: { friend: friend.id } };
  },
  journal: { opens: "offered:ask", missed: "passed", notes: [{ after: "asked", label: "At work", line: "intro", roles: ["friend"] }] },
  opening: [],
  developments: [
    { id: "asked", when: { type: "all", of: [{ type: "speaking", role: "friend" }, { type: "at", scene: "workplace" }, { type: "not", of: { type: "due" } }] },
      then: [{ type: "choose", line: "ask", from: "friend", at: "workplace", choices: [{ id: "cover", minutes: 30 }, { id: "stay" }] }] },
    { id: "helped", when: { type: "fired", id: "cover" }, then: [{ type: "regard", role: "friend", delta: 2 }] },
  ],
  endings: [
    { id: "covered", when: { type: "fired", id: "cover" }, quiet: true },
    { id: "declined", when: { type: "fired", id: "stay" }, quiet: true },
    { id: "passed", when: { type: "due" }, quiet: true },
  ],
  wording: [{ title: "Half an Hour", lines: {
    aim: "Decide whether you can cover for {friend}.",
    intro: "{friend} asked you to take over for half an hour.",
    threat: "You've got your own work to finish.",
    ask: "{request} {reason}",
    "cover:label": "Take over for half an hour",
    "stay:label": "Say you have to get on",
    covered: "You covered for {friend} for half an hour.",
    declined: "{friend} stays at work.",
    passed: "The working day is over.",
  } }],
};
