import type { Actor, Household } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope } from "../characters/context-types";
import type { PersonalAim } from "./types";
import { sexOf } from "../../core/brief";

const place = (c: LifeAimContext) => c.setting?.location ? ` in ${c.setting.location}` : "";
const kin = (actor: Actor, relation: "child" | "parent" | "partner") => {
  const sex = sexOf(actor);
  const term = relation === "partner" ? "partner"
    : relation === "child" ? sex === "female" ? "daughter" : sex === "male" ? "son" : "child"
    : sex === "female" ? "mother" : sex === "male" ? "father" : "parent";
  return `${actor.name}, your ${actor.age === undefined ? "" : `${actor.age}-year-old `}${term}`;
};
const article = (word: string) => /^[aeiou]/i.test(word) ? "an" : "a";

export type LifeAimContext = {
  setting?: WorldSetting;
  player: Actor;
  household?: Household;
  adultChild?: Actor;
  marriageChild?: Actor;
  youngChild?: Actor;
  elderlyParent?: Actor;
  partner?: Actor;
  recentlyMoved: boolean;
  establishedHome?: "built" | "inherited";
  widowed: boolean;
  remembersDead: boolean;
  hardTimes: boolean;
  hardship?: "bad-year" | "fire" | "robbed";
  lostPartner?: "wife" | "husband" | "partner";
  rememberedKin?: string;
};
export type LifeAimTemplate = {
  id: string;
  weight: number;
  scope?: CharacterScope;
  eligible: (c: LifeAimContext) => boolean;
  bind: (c: LifeAimContext) => Pick<PersonalAim, "text" | "subjects" | "step">;
};

/** Broad concerns from present circumstances. Regional and period rules can
 * add scoped entries alongside these without multiplying them by era. */
export const LIFE_AIM_TEMPLATES: LifeAimTemplate[] = [
  {
    id: "mastery",
    weight: 1.8,
    eligible: (c) =>
      c.player.origin?.livelihood === "apprentice" &&
      !!c.player.origin.roleLabel?.startsWith("Apprentice "),
    bind: (c) => ({
      text: (() => {
        const trade = c.player.origin!.roleLabel!.slice("Apprentice ".length).toLowerCase();
        return `Earn the standing to work as ${article(trade)} ${trade} in your own right${place(c)}.`;
      })(),
      subjects: [],
      step: { type: "work", target: 3, progress: 0, text: "Complete three days of practice at your trade." },
    }),
  },
  {
    id: "child-future",
    weight: 1.8,
    eligible: (c) => !!c.adultChild,
    bind: (c) => ({
      text: `Help ${kin(c.adultChild!, "child")}, find a secure place of their own${place(c)}.`,
      subjects: [c.adultChild!.id],
      step: { type: "talk", actor: c.adultChild!.id, text: `Speak with ${c.adultChild!.name}.` },
    }),
  },
  {
    id: "marriage-hope",
    weight: 1.5,
    eligible: (c) =>
      !!c.marriageChild,
    bind: (c) => ({
      text: `Help ${kin(c.marriageChild!, "child")}, find a marriage match that suits them${place(c)}.`,
      subjects: [c.marriageChild!.id],
      step: { type: "talk", actor: c.marriageChild!.id, text: `Speak with ${c.marriageChild!.name}.` },
    }),
  },
  {
    id: "elder-kin",
    weight: 1.5,
    eligible: (c) => !!c.elderlyParent,
    bind: (c) => ({
      text: `Keep ${kin(c.elderlyParent!, "parent")}, cared for in your household${place(c)}.`,
      subjects: [c.elderlyParent!.id],
      step: { type: "give", actor: c.elderlyParent!.id, items: ["water", "bread", "fruit", "berries", "fish", "meat"], text: `Bring food or water to ${c.elderlyParent!.name}.` },
    }),
  },
  {
    id: "new-settlement",
    weight: 1.5,
    eligible: (c) => c.recentlyMoved,
    bind: (c) => ({
      text: `Make a secure home for your household${place(c)} after your move.`,
      subjects: [],
    }),
  },
  {
    id: "household-home",
    weight: 1.3,
    eligible: (c) => !!c.establishedHome,
    bind: (c) => ({
      text: c.establishedHome === "inherited"
        ? `Keep the home you inherited${place(c)} secure for your household.`
        : `Keep the home your household built${place(c)} secure for those who live there.`,
      subjects: [],
    }),
  },
  {
    id: "raise-kin",
    weight: 1.4,
    eligible: (c) => !!c.youngChild || (c.household?.infants ?? 0) > 0,
    bind: (c) => ({
      text: c.youngChild
        ? `See ${kin(c.youngChild, "child")}, safely into adulthood, with choices of their own.`
        : `See your household's youngest children safely through their first years${place(c)}.`,
      subjects: c.youngChild ? [c.youngChild.id] : [],
      step: c.youngChild
        ? { type: "give", actor: c.youngChild.id, items: ["water", "bread", "fruit", "berries", "fish", "meat"], text: `Bring food or water to ${c.youngChild.name}.` }
        : undefined,
    }),
  },
  {
    id: "restore-household",
    weight: 1.6,
    eligible: (c) => c.hardTimes,
    bind: (c) => ({
      text: `Restore your household's footing${place(c)} after ${c.hardship === "fire" ? "the fire" : c.hardship === "robbed" ? "the robbery" : "a bad year"}.`,
      subjects: [],
      step: { type: "work", target: 3, progress: 0, text: "Complete three days of steady work." },
    }),
  },
  {
    id: "remember-dead",
    weight: 1.25,
    eligible: (c) => c.remembersDead,
    bind: (c) => ({
      text: c.rememberedKin
        ? `Keep the memory of your ${c.rememberedKin} alive in your household${place(c)}.`
        : `Keep the memory of your household's dead alive${place(c)}.`,
      subjects: [],
    }),
  },
  {
    id: "widowed-household",
    weight: 1.3,
    eligible: (c) => c.widowed,
    bind: (c) => ({
      text: `Hold your household${place(c)} together after the loss of your ${c.lostPartner ?? "partner"}.`,
      subjects: [],
    }),
  },
  {
    id: "shared-future",
    weight: 1.1,
    eligible: (c) => !!c.partner && !c.adultChild && !c.youngChild && !(c.household?.infants ?? 0),
    bind: (c) => ({
      text: `Build a lasting future${place(c)} with ${kin(c.partner!, "partner")}.`,
      subjects: [c.partner!.id],
      step: { type: "talk", actor: c.partner!.id, text: `Speak with ${c.partner!.name}.` },
    }),
  },
];
