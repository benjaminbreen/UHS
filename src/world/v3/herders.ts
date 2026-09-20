import { faunaAt } from "../../content/fauna";
import { herdNoun, herdingCustom } from "../../content/fauna/herding";
import {
  characterLivelihood,
  generateCharacter,
} from "../../content/characters/generate";
import {
  resolveCharacterContext,
  workAt,
} from "../../content/characters/resolve";
import { proceduralName } from "../../content/geography/character";
import type { WorldSetting } from "../../content/geography/types";
import type { FaunaGroup } from "../../core/fauna";
import { random } from "../../core/random";
import type { Actor, WorldModel } from "../../core/types";

/** What the trade that minds each animal tends to be called. */
const TRADE: Record<string, RegExp> = {
  sheep: /sheep|shep/,
  goat: /goat|shep/,
  cattle: /cattle|cow|drover|ox/,
  camel: /camel/,
  llama: /llama|alpaca/,
  horse: /horse/,
  donkey: /donkey|ass\b|drover/,
};
/** What to call someone when the tables' word is for a different animal. */
const PLAIN: Record<string, string> = {
  sheep: "Shepherd",
  goat: "Goatherd",
  cattle: "Cattle Herd",
  camel: "Camel Herd",
  donkey: "Donkey Herd",
  horse: "Horse Herd",
  llama: "Llama Herd",
};
/** Where each of a party stands, relative to the middle of the herd. */
const SEATS = [
  [3, 1],
  [-3, 2],
  [1, -3],
] as const;

/** The people out with a herd at grass, and their dog. Who they are follows
 * the custom of the place and date; what they are called, how they look and
 * what they are named come from the same tables as everyone else. */
export function herdersFor(
  world: WorldModel,
  seed: string,
  herd: FaunaGroup,
  setting: WorldSetting,
) {
  const actors: Actor[] = [];
  /** Who was sent, for anyone asking why: the actor keeps no age of its own. */
  const party: { age: number; sex: "male" | "female" }[] = [];
  const custom = herdingCustom(setting, herd.speciesId);
  const roll = (...keys: (string | number)[]) =>
    random(seed, "herders", herd.id, ...keys);
  const size = roll("party");
  const count =
    size < custom.party[0]
      ? 1
      : size < custom.party[0] + custom.party[1]
        ? 2
        : 3;
  const context = setting.characterRevision
    ? resolveCharacterContext(setting)
    : undefined;
  const label = herdNoun(herd.speciesId);
  for (let i = 0; i < count; i++) {
    const id = `${herd.id}-herder-${i}`;
    const free = SEATS.map(([dx, dy]) => ({
      x: herd.pos.x + dx,
      y: herd.pos.y + dy,
    })).filter((c) => !world.blocked(c.x, c.y, "outside"));
    const at = free[i % Math.max(1, free.length)];
    if (!at) break;
    // The first of a party is the one in charge, and less often the child.
    const young =
      roll(i, "young") < custom.youth * (i === 0 && count > 1 ? 0.5 : 1);
    const age = young
      ? 9 + Math.floor(roll(i, "age") * 8)
      : 17 + Math.floor(roll(i, "age") ** 1.6 * 45);
    let sex: "male" | "female" =
      roll(i, "sex") < custom.women ? "female" : "male";
    // A trade the tables give to one sex stays with it.
    // The trade named for this animal; failing that a plain herder, and only
    // then whatever else works the pasture. A goat is not minded by a horse herd.
    const trade = (s: "male" | "female") => {
      const open = context ? workAt(context, "pasture", s) : [];
      const named = TRADE[herd.speciesId];
      return (
        (named && open.find((l) => named.test(l.id))) ??
        open.find((l) => l.id === "herder") ??
        open[0]
      );
    };
    const other = sex === "male" ? "female" : "male";
    if (
      context &&
      !workAt(context, "pasture", sex).length &&
      workAt(context, "pasture", other).length
    )
      sex = other;
    const wanted = trade(sex)?.id ?? "herder";
    const livelihood = context
      ? characterLivelihood(setting, seed, id, wanted, context, sex)
      : undefined;
    const role = livelihood?.label ?? "Herder";
    const pos = { ...at, space: "outside" as const };
    const actor: Actor = {
      id,
      name: proceduralName(setting, seed, id),
      role,
      kind: "human",
      pos: { ...pos },
      home: { ...pos },
      work: { ...pos },
      sprite: `human-${i % 3}-${Math.floor(roll(i, "sprite") * 6)}`,
      inventory: { water: 2, wool: 1 },
      activity: `Minding the ${label}`,
      fatigue: 0,
      hunger: 5,
      trust: 1,
      memories: [],
      direction: 2,
      tends: { herd: herd.id, seat: i },
    };
    if (setting.characterRevision)
      Object.assign(
        actor,
        generateCharacter(
          setting,
          seed,
          id,
          age,
          wanted,
          undefined,
          undefined,
          sex,
        ),
      );
    // The tables name the work by place, and their word may be for another
    // animal: a "Goat Herd" out with camels. Say what this one is minding.
    const own = TRADE[herd.speciesId];
    const others = Object.entries(TRADE).some(
      ([species, word]) =>
        species !== herd.speciesId && word.test(actor.role.toLowerCase()),
    );
    if (
      others &&
      !(own && own.test(actor.role.toLowerCase())) &&
      PLAIN[herd.speciesId]
    ) {
      actor.role = PLAIN[herd.speciesId];
      const origin = (actor as { origin?: { roleLabel?: string } }).origin;
      if (origin) origin.roleLabel = actor.role;
    }
    actors.push(actor);
    party.push({ age, sex });
  }
  const dogs = faunaAt(setting).some((p) => p.id === "dog");
  const dog: FaunaGroup | undefined =
    actors.length && dogs && roll("dog") < custom.dog
      ? {
          id: `${herd.id}-dog`,
          speciesId: "dog",
          members: [
            {
              x: actors[0].pos.x + 1,
              y: actors[0].pos.y,
              direction: 3,
            },
          ].filter(
            (m) => !world.blocked(m.x, m.y, "outside"),
          ) as FaunaGroup["members"],
          pos: { ...actors[0].pos },
          home: { ...herd.home },
          homeRadius: Math.max(5, Math.round(herd.homeRadius / 2)),
          state: "idle",
          nextDecisionAt: 0,
          stride: 0,
          since: 0,
        }
      : undefined;
  return { actors, party, dog: dog?.members.length ? dog : undefined };
}
