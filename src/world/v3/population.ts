import { carryKit, withLoads } from "../../content/economy/carrying";
import {
  characterSex,
  generateCharacter,
} from "../../content/characters/generate";
import type {
  Actor,
  Household,
  Point,
  WorldModel,
  WorldObject,
} from "../../core/types";
import type { SettlementPlan } from "./types";
import { random } from "../../core/random";
import { sexOf, type Sex } from "../../core/brief";
import { livelihoodOf, memberRoutine, routineFor } from "./routines";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { goods, goodsOf, standsIn } from "../../content/economy/goods";
import { workplaceFor } from "../../content/characters/workplace";
import { conditionOf, weatherStructure } from "../../core/time/structure";
import { householdStory } from "./household-story";
import { MEANS } from "./plan";
import { marriagePracticeFor } from "../../content/households/practices";
const seasons = ["spring", "summer", "autumn", "winter"];
/** Households as the result of a life (household-story.ts), then the ties
 * between them: who makes what, and whom everyone else buys it from. */
export function populateHouseholds(
  world: WorldModel,
  plan: SettlementPlan,
  seed: string,
) {
  const pack = plan.site.pack ?? world.pack;
  const form = pack.setting!.environment!.household;
  const year = pack.setting?.year ?? pack.year;
  const made: Household[] = [];
  const pending: {
    id: string;
    a: Actor;
    child: boolean;
    site: ReturnType<typeof plan.work.get> & {};
    household: Household;
  }[] = [];
  for (const [owner, sites] of plan.work) {
    if (world.households!.some((h) => h.members.includes(owner))) continue;
    const place = plan.places.find((p) => p.owner === owner)!;
    if (!place) continue;
    const store = plan.objects.find(
      (o) =>
        o.owner === owner &&
        o.kind === "container" &&
        o.pos.space === "outside",
    );
    if (!store) continue;
    const id = `household-${owner}`,
      adult = plan.actors.find((a) => a.id === owner);
    const age =
      owner === "player"
        ? pack.setting?.character?.age ?? 34
        : 22 + Math.floor(random(seed, id, "age") ** 1.3 * 44);
    const household: Household = {
      id,
      members: [owner],
      residence: place.id,
      home: { ...sites.home, space: "outside" },
      storeId: store.id,
    };
    world.households!.push(household);
    made.push(household);
    if (adult)
      Object.assign(adult, {
        age,
        householdId: id,
        relations: [],
        knownResources: [],
      });
    if (adult && pack.setting?.characterRevision)
      Object.assign(
        adult,
        generateCharacter(pack.setting, seed, adult.id, age, adult.role),
      );
    const ownerCharacter = owner === "player" && pack.setting?.characterRevision
      ? generateCharacter(pack.setting,
          pack.setting.lifeStoryRevision ? pack.setting.character?.appearanceSeed ?? seed : seed,
          owner, age, pack.role, pack.characterName)
      : undefined;
    const parent = adult?.origin ?? ownerCharacter?.origin;
    const kit = livelihoodOf(pack, adult ?? (pack.setting?.lifeStoryRevision && parent
      ? { origin: parent } as Actor
      : undefined));
    const means = MEANS[kit?.rank ?? "labouring"];
    const practice = pack.setting?.lifeStoryRevision
      ? marriagePracticeFor(pack.setting)
      : undefined;
    const fabric = place.structure?.fabric ?? "timber";
    const built = place.structure?.built ?? year;
    // A settlement of one household form keeps it; the mixed default is
    // sampled, because a legible street wants a few people out on visible
    // errands rather than every resident stood in their own yard.
    const roll = random(seed, id, "form");
    const shared = form === "shared" || (form === "mixed" && roll < 0.4);
    const ownerSex = ownerCharacter && sexOf(ownerCharacter as Actor);
    const holderSex: Sex = adult
      ? sexOf(adult)
      : ownerSex && pack.setting?.lifeStoryRevision
        ? ownerSex
        : characterSex(seed, owner) === "female" ? "female" : "male";
    const story = householdStory({
      seed,
      id,
      year,
      age,
      sex: holderSex,
      means,
      shared,
      extended: form === "extended" || owner === "player",
      small: owner !== "player" && place.w * place.h <= 12,
      craft:
        place.access === "public" ||
        (!!kit && (kit.workplace ?? workplaceFor(kit.activity)) === "workshop"),
      player: owner === "player",
      modern: year >= 1900,
      revised: !!pack.setting?.lifeStoryRevision,
      formalMarriage: !!practice && parent?.standing !== "unfree",
      apprentice: parent?.livelihood === "apprentice",
      built,
      fabric,
    });
    Object.assign(household, {
      history: story.history,
      fortune: story.fortune,
      infants: story.infants,
      makes: goodsOf(
        kit ?? (parent && livelihoodOf(pack, { origin: parent } as Actor)),
      ),
    });
    // What the household can spend decides how the house has worn, and a fire
    // started the roof and walls over.
    if (place.structure) {
      place.structure = {
        ...weatherStructure(seed, place.id, fabric, story.weatherFrom, year, story.fortune),
        built,
      };
      place.condition = conditionOf(place.structure);
    }
    let partnerId: string | undefined;
    story.residents.forEach((m, i) => {
      const memberId = `${owner}-member-${i}`;
      const child = m.role === "Child";
      const a: Actor = {
        id: memberId,
        name: pack.names[
          Math.floor(random(seed, memberId, "name") * pack.names.length)
        ],
        role: m.role ?? "Householder",
        kind: "human",
        pos: { ...sites.home, space: "outside" },
        home: { ...sites.home, space: "outside" },
        work: { ...sites.work, space: "outside" },
        sprite: `human-${i % 3}-${(i + 2) % 6}`,
        inventory: { water: 1 },
        hunger: 8,
        fatigue: 0,
        activity: "At home",
        trust: 1,
        memories: [],
        direction: 2,
        age: m.age,
        householdId: id,
        relations: [{ other: owner, kind: m.toHead }],
        knownResources: [],
      };
      if (pack.setting?.characterRevision) {
        const partner = world.initialActors.find((b) => b.id === partnerId);
        const kin = m.fromHead === "child";
        // The parent's own recorded format, not the context's: outside the
        // hand-written kits the context has no format at all, which left every
        // household on the ported traditions with unrelated surnames.
        const format = parent?.nameFormat;
        const inherited =
          kin && format === "family-personal"
            ? parent?.nameFamilies
            : kin &&
                format === "personal-two-families" &&
                parent?.nameFamilies?.[0] &&
                partner?.origin?.nameFamilies?.[0]
              ? [parent.nameFamilies[0], partner.origin.nameFamilies[0]]
              : undefined;
        const sex = m.sex ?? characterSex(seed, memberId);
        const draw = (salt: number) =>
          generateCharacter(
            pack.setting!,
            seed,
            salt ? `${memberId}~${salt}` : memberId,
            m.age,
            child
              ? "Child"
              : m.role === "Servant"
                ? "servant"
                : m.role === "Apprentice"
                  ? "apprentice"
                  : undefined,
            undefined,
            inherited,
            sex,
            kin ? parent?.nameTradition : undefined,
          );
        // Where the name sets the body, redraw until it is the sex the story
        // needs, and until it is not a name already in the house: a kit of
        // sixteen names otherwise gives a husband his wife's.
        const taken = new Set(
          household.members.map((id) =>
            world.initialActors.find((b) => b.id === id)?.name ?? adult?.name,
          ),
        );
        let drawn = draw(0);
        for (let salt = 1; salt < 12; salt++) {
          if (
            (!m.sex || sexOf({ ...a, ...drawn }) === m.sex) &&
            !taken.has(drawn.name)
          )
            break;
          drawn = draw(salt);
        }
        Object.assign(a, drawn);
        if (child) {
          a.role = "Child";
          a.inventory = { water: 1 };
        }
      }
      for (let r = 1; r < 6; r++) {
        let found = false;
        for (const [dx, dy] of [
          [r, 0],
          [-r, 0],
          [0, r],
          [0, -r],
        ]) {
          const p = { ...a.pos, x: a.pos.x + dx, y: a.pos.y + dy };
          if (
            !world.blocked(p.x, p.y, "outside") &&
            !world.initialActors.some(
              (b) =>
                b.pos.x === p.x && b.pos.y === p.y && b.pos.space === p.space,
            )
          ) {
            a.pos = p;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      household.members.push(memberId);
      world.initialActors.push(a);
      if (practice && means >= practice.minimumMeans &&
          parent?.standing !== "unfree" && a.origin?.standing !== "unfree" &&
          m.fromHead === "child" && m.age >= 17 && m.age <= 23 &&
          !household.familyPlans?.length && random(seed, id, "seek-match", memberId) < 0.6)
        (household.familyPlans ??= []).push({ kind: "seek-match", subject: memberId });
      if (m.toHead === "partner") partnerId = memberId;
      if (m.ofPartner && partnerId) {
        const partner = world.initialActors.find((b) => b.id === partnerId)!;
        a.relations!.push({ other: partnerId, kind: "parent" });
        partner.relations!.push({ other: a.id, kind: "child" });
      }
      adult?.relations?.push({ other: memberId, kind: m.fromHead });
      pending.push({ id: memberId, a, child, site: sites, household });
    });
  }

  // Every household buys what it needs and does not make, from the nearest
  // household that makes it, a shopfront before a back door.
  const byId = new Map(made.map((h) => [h.id, h]));
  const residence = (h: Household) =>
    plan.places.find((p) => p.id === h.residence);
  const customers = new Map<string, number>();
  for (const h of made) {
    const home = h.home;
    const buys: Household["buys"] = [];
    for (const g of goods) {
      if (!g.need || h.makes?.includes(g.id)) continue;
      const wanted = [g.id, standsIn[g.id]].filter(Boolean);
      let best: Household | undefined,
        score = Infinity;
      for (const s of made) {
        if (s === h || !s.makes?.some((m) => wanted.includes(m))) continue;
        const d =
          Math.hypot(s.home.x - home.x, s.home.y - home.y) -
          (residence(s)?.access === "public" ? 30 : 0) +
          random(seed, h.id, "buys", g.id, s.id) * 12;
        if (d < score) [best, score] = [s, d];
      }
      if (!best) continue;
      buys.push({
        good: best.makes!.includes(g.id) ? g.id : standsIn[g.id],
        from: best.id,
      });
      customers.set(best.id, (customers.get(best.id) ?? 0) + 1);
    }
    h.buys = buys;
    const creditor = buys.find(
      (b) => (byId.get(b.from)?.fortune ?? 0) > (h.fortune ?? 0) + 0.2,
    );
    if (creditor && (h.fortune ?? 1) < 0.3 && random(seed, h.id, "owes") < 0.6)
      h.owes = creditor.from;
  }
  // A shop's trade is the custom it has, not the quarter it stands in.
  const busy = Math.max(3, made.length * 0.1);
  for (const h of made) {
    const place = residence(h);
    if (place?.trade === undefined || !h.makes?.length) continue;
    place.trade =
      0.3 * (h.fortune ?? 0.4) +
      0.7 * Math.min(1, (customers.get(h.id) ?? 0) / busy);
  }

  befriend(
    made.flatMap((h) => h.members.map((m) => ({ a: world.initialActors.find((b) => b.id === m)!, home: h.home }))).filter((p) => p.a),
    seed,
  );
  for (const { id, a, child, site, household } of pending) {
    // Members get a routine of their own so a household spreads across the
    // settlement during the day instead of stacking on one doorstep.
    const kit = livelihoodOf(pack, a);
    const i = household.members.indexOf(id);
    const memberSite = {
      ...site,
      label: child ? "Errands" : (kit?.activity ?? "Keeping house"),
      offset: (site.offset + 37 * i) % 1440,
    };
    const buy =
      household.buys?.[
        Math.floor(random(seed, id, "shop") * (household.buys?.length ?? 0))
      ];
    const from = buy && byId.get(buy.from);
    const shop = from && residence(from);
    const seller = from && world.initialActors.find((b) => b.id === from.members[0]);
    plan.work.set(id, memberSite);
    plan.stations.set(
      id,
      withLoads(
        kit && !child
          ? routineFor(plan, seed, pack, id, memberSite, a)
          : memberRoutine(
              plan,
              seed,
              id,
              site.home,
              pack.year,
              child,
              shop && seller
                ? {
                    pos: shop.entrance,
                    label: `Buying ${goods.find((g) => g.id === buy!.good)!.noun} from ${seller.name}`,
                  }
                : undefined,
            ),
        carryKit(pack),
        buy?.good,
        child ? undefined : goodsOf(kit)[0],
      ),
    );
  }
}
const populated = new WeakMap<WorldModel, Set<string>>();
export function addWildResources(
  world: WorldModel,
  seed: string,
  x: number,
  y: number,
) {
  let done = populated.get(world);
  if (!done) {
    done = new Set();
    populated.set(world, done);
  }
  const gx = Math.floor(x / 64),
    gy = Math.floor(y / 64);
  for (let cy = gy - 1; cy <= gy + 1; cy++)
    for (let cx = gx - 1; cx <= gx + 1; cx++) {
      const k = `${cx},${cy}`;
      if (done.has(k)) continue;
      done.add(k);
      for (let iy = 0; iy < 4; iy++)
        for (let ix = 0; ix < 4; ix++) {
          const px =
              cx * 64 +
              ix * 16 +
              3 +
              Math.floor(random(seed, k, ix, iy, "rx") * 9),
            py =
              cy * 64 +
              iy * 16 +
              3 +
              Math.floor(random(seed, k, ix, iy, "ry") * 9);
          const localPack = world.geography?.packAt(px, py) ?? world.pack;
          const eco = ecologyProfiles[localPack.setting!.environment!.ecology];
          if (
            world.blocked(px, py, "outside") ||
            world.protectedCell?.(px, py) ||
            world.terrain(px, py) === "dirt" ||
            world.places.some(
              (p) => Math.hypot(px - p.entrance.x, py - p.entrance.y) < 8,
            )
          )
            continue;
          if (
            random(seed, k, ix, iy, "present") >
            (localPack.setting!.environment!.ecology === "desert" ? 0.12 : 0.72)
          )
            continue;
          const local = world.topography?.(px, py).biome;
          const resourceSet =
            local && local in ecologyProfiles
              ? ecologyProfiles[local as keyof typeof ecologyProfiles].resources
              : eco.resources;
          const type =
            resourceSet[
              Math.floor(random(seed, k, ix, iy, "type") * resourceSet.length)
            ];
          const item = type === "grazing" ? "fodder" : type;
          const availability =
            localPack.setting!.environment!.ecology === "tropical-woodland"
              ? seasons
              : type === "fruit"
                ? ["summer", "autumn"]
                : type === "berries"
                  ? ["summer", "autumn"]
                  : seasons;
          const available = availability.includes(localPack.setting!.season);
          const sprite =
            type === "fruit"
              ? "ecology-fruit-tree"
              : type === "berries"
                ? "ecology-berry-bush"
                : type === "wood"
                  ? "ecology-branches"
                  : type === "reeds"
                    ? "reeds"
                    : "ecology-grazing";
          const o: WorldObject = {
            id: `resource-${px}-${py}`,
            name:
              type === "fruit"
                ? "Wild fruit tree"
                : type === "berries"
                  ? "Berry patch"
                  : type === "wood"
                    ? "Fallen branches"
                    : type === "reeds"
                      ? "Reed bed"
                      : "Grazing patch",
            kind: "tree",
            pos: { x: px, y: py, space: "outside" },
            sprite,
            inventory: available ? { [item]: 6 } : {},
            depleted: !available,
            resource: {
              item,
              capacity: 6,
              regrowSeconds: type === "wood" ? 86400 : 3 * 86400,
              seasons: availability,
              readyAt: 0,
            },
          };
          world.initialObjects.push(o);
        }
    }
}

/** Up to two friends each, outside the household: near in age, living close,
 * and of the same sex past childhood, which is the rule in most places and
 * times the simulator covers. */
function befriend(people: { a: Actor; home: Point }[], seed: string) {
  const pairs: { a: Actor; b: Actor; score: number }[] = [];
  for (const [i, x] of people.entries())
    for (const y of people.slice(i + 1)) {
      const a = x.a,
        b = y.a;
      if (a.householdId === b.householdId || a.id === "player" || b.id === "player") continue;
      const ageA = a.age ?? 30,
        ageB = b.age ?? 30;
      const child = ageA < 13 || ageB < 13;
      if (Math.abs(ageA - ageB) > (child ? 3 : 12)) continue;
      if (!child && a.origin?.sex !== b.origin?.sex) continue;
      const apart = Math.hypot(x.home.x - y.home.x, x.home.y - y.home.y);
      if (apart > 60) continue;
      pairs.push({
        a,
        b,
        score: apart + Math.abs(ageA - ageB) * 2 + random(seed, "friend", a.id, b.id) * 30,
      });
    }
  const count = new Map<string, number>();
  for (const { a, b } of pairs.sort((x, y) => x.score - y.score)) {
    if ((count.get(a.id) ?? 0) >= 2 || (count.get(b.id) ?? 0) >= 2) continue;
    (a.relations ??= []).push({ other: b.id, kind: "friend" });
    (b.relations ??= []).push({ other: a.id, kind: "friend" });
    count.set(a.id, (count.get(a.id) ?? 0) + 1);
    count.set(b.id, (count.get(b.id) ?? 0) + 1);
  }
}
