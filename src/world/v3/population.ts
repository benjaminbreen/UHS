import { assignLocalWork, localWorkContext } from "./employment";
import { inheritLikeness } from "../../core/character";
import { motorized } from "../../content/settlements/modernity";
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
import { fishingRole, livelihoodOf, memberRoutine, routineFor, shoreRoutine } from "./routines";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { goods, goodsOf, standsIn } from "../../content/economy/goods";
import { workplaceFor } from "../../content/characters/workplace";
import { conditionOf, weatherStructure } from "../../core/time/structure";
import { householdStory } from "./household-story";
import { MEANS } from "./plan";
import { keeperLivesIn, buildingUse } from "../../content/interiors/select";
import { officeFor } from "../../content/interiors/offices";
import { marriagePracticeFor } from "../../content/households/practices";
import { capabilitiesFor } from "../../content/characters/resolve";
import { goodName, productFor, sellerOf } from "../../content/economy/products";
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
  let playerFriend: { a: Pick<Actor, "id" | "age" | "householdId" | "origin" | "relations">; home: Point } | undefined;
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
        generateCharacter(pack.setting, seed, adult.id, age, adult.role, undefined, undefined, adult.origin?.sex, undefined, undefined,
          pack.setting.employmentRevision ? localWorkContext(plan, pack, adult.id, adult.origin?.community) : undefined),
      );
    if(adult && sites.employment?.kind==="fishery")assignLocalWork(plan,pack,seed,adult,sites);
    const ownerCharacter = owner === "player" && pack.setting?.characterRevision
      ? generateCharacter(pack.setting,
          pack.setting.lifeStoryRevision ? pack.setting.character?.appearanceSeed ?? seed : seed,
          owner, age, sites.role ?? pack.role, pack.characterName,undefined,undefined,undefined,undefined,
          pack.setting.employmentRevision ? localWorkContext(plan,pack,owner) : undefined)
      : undefined;
    if (owner === "player" && pack.setting?.friendshipRevision)
      playerFriend = { a: { id: owner, age, householdId: id, origin: ownerCharacter?.origin, relations: [] }, home: household.home };
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
        pack.setting?.economyRevision,
      ),
    });
    if (pack.setting?.economyRevision) {
      household.producers = Object.fromEntries(household.makes!.map((g) => [g, owner]));
      household.products = Object.fromEntries(household.makes!.map((g) => [g, productFor(g, pack.setting!, kit?.trade ?? kit?.id)]));
      // A fictional taste draw, not a historical estimate of alcohol consumption.
      household.needs = goods.filter((g) => g.need && (g.id !== "drink" ||
        random(seed, id, "drink-preference") < 0.35)).map((g) => g.id);
      if (random(seed, id, "milk-preference") < 0.4) household.needs.push("milk");
      if (random(seed, id, "oil-preference") < 0.4) household.needs.push("oil");
    }
    // What the household can spend decides how the house has worn, and a fire
    // started the roof and walls over.
    if (place.structure) {
      place.structure = {
        ...weatherStructure(seed, place.id, fabric, story.weatherFrom, year, story.fortune),
        built,
      };
      if (pack.setting && motorized(pack.setting)) place.structure.vegetation *= 0.15;
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
        relations: [{ other: owner, kind: m.toHead, reciprocal: m.fromHead }],
        knownResources: [],
      };
      if (pack.setting?.characterRevision) {
        const partner = world.initialActors.find((b) => b.id === partnerId);
        const kin = m.fromHead === "child";
        const revised = !!pack.setting.namingRevision;
        const lineage = revised && kin && holderSex === "female" && m.ofPartner && partner && sexOf(partner) === "male"
          ? partner.origin : parent;
        // The parent's own recorded format, not the context's: outside the
        // hand-written kits the context has no format at all, which left every
        // household on the ported traditions with unrelated surnames.
        const format = lineage?.nameFormat;
        // A hereditary family name comes down from the father: a child takes
        // the householder's, or a mother's husband's where he lives here, and
        // the householder's own father shares it. Partners and mothers keep
        // the names they were born with.
        const lineal = kin || (m.fromHead === "parent" && m.sex === "male");
        const father = kin && holderSex === "female" && m.ofPartner && partner && sexOf(partner) === "male"
          ? partner.origin?.nameFamilies
          : lineage?.nameFamilies;
        const twoParents = revised && year < 2000 && holderSex === "female"
          ? [partner?.origin, parent] : [parent, partner?.origin];
        const inherited =
          lineal && (format === "family-personal" || format === "personal-family")
            ? father
            : kin &&
                format === "personal-two-families" &&
                twoParents[0]?.nameFamilies?.[0] &&
                twoParents[1]?.nameFamilies?.[0]
              ? [twoParents[0].nameFamilies[0], twoParents[1].nameFamilies[0]]
              : undefined;
        const sex = m.sex ?? characterSex(seed, memberId);
        const taken = new Set(
          household.members.map((id) => id === owner
            ? adult?.name ?? ownerCharacter?.name
            : world.initialActors.find((b) => b.id === id)?.name).filter((name): name is string => !!name),
        );
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
            lineal ? lineage?.nameTradition : undefined,
            revised ? {
              community: lineal ? lineage?.community : undefined,
              parentPersonal: kin ? lineage?.namePersonal : undefined,
              personal: m.fromHead === "parent" && m.sex === "male" ? parent?.nameParentPersonal : undefined,
              avoid: taken,
            } : undefined,
            pack.setting!.employmentRevision ? localWorkContext(plan, pack, memberId, lineal ? lineage?.community : undefined) : undefined,
          );
        let drawn = draw(0);
        for (let salt = 1; !revised && salt < 12; salt++) {
          if (
            (!m.sex || sexOf({ ...a, ...drawn }) === m.sex) &&
            !taken.has(drawn.name)
          )
            break;
          drawn = draw(salt);
        }
        Object.assign(a, drawn);
        // Kin look like kin: a child takes after the head and their partner,
        // and the head's own parent is drawn to match the head.
        const headLooks = adult?.appearance ?? ownerCharacter?.appearance;
        if (headLooks && !headLooks.lineage) headLooks.lineage = id;
        if (a.appearance && headLooks && (kin || m.fromHead === "parent")) {
          const parents = m.fromHead === "parent" ? [headLooks]
            : m.ofPartner ? [partner?.appearance] : [headLooks, partner?.appearance];
          a.appearance = inheritLikeness(a.appearance, parents.filter((p) => !!p), seed, memberId);
        }
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
      if (pack.setting?.employmentRevision && !child) {
        const memberSite = { ...sites, work: { ...(sites.domesticWork ?? sites.work) }, employment: undefined, role: undefined,
          gateId: undefined, rackId: undefined, pasture: undefined };
        plan.work.set(memberId, memberSite);
        assignLocalWork(plan, pack, seed, a, memberSite);
      }
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
      adult?.relations?.push({ other: memberId, kind: m.fromHead, reciprocal: m.toHead });
      pending.push({ id: memberId, a, child, site: sites, household });
    });
  }

  // Nobody lives in a kiva or a bath house: the household that keeps one
  // lodges with the nearest household that has a house to live in.
  const setting = pack.setting!;
  const venueOf = (h: Household) => {
    const place = plan.places.find((p) => p.id === h.residence);
    return place?.landUse === "industrial" || (place?.landUse === "downtown" && officeFor(place.name, year)) ? "works" : buildingUse(place?.claim ?? "");
  };
  for (const h of made) {
    const venue = venueOf(h);
    if (!venue || (venue !== "works" && keeperLivesIn({ lon: setting.lon, lat: setting.lat, year, use: venue }))) continue;
    const host = made
      .filter((o) => o !== h && !venueOf(o))
      .sort((a, b) => Math.hypot(a.home.x - h.home.x, a.home.y - h.home.y) - Math.hypot(b.home.x - h.home.x, b.home.y - h.home.y))[0];
    if (!host) continue;
    h.residence = host.residence;
    h.home = { ...host.home };
    const head = h.members[0], work = plan.work.get(head);
    if (work) {
      // The head's day was planned from the old door; plan it again from the new one.
      const site = { ...work, home: { x: host.home.x, y: host.home.y } };
      const actor = world.initialActors.find((b) => b.id === head);
      plan.work.set(head, site);
      if (plan.stations.has(head))
        plan.stations.set(head, withLoads(routineFor(plan, seed, pack, head, site, actor), carryKit(pack), undefined, goodsOf(livelihoodOf(pack, actor), pack.setting?.economyRevision)[0]));
    }
    for (const p of pending) if (p.household === h) p.site = { ...p.site, home: { x: host.home.x, y: host.home.y } };
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
      if (!(h.needs ? h.needs.includes(g.id) : g.need) || h.makes?.includes(g.id)) continue;
      const wanted = [g.id, standsIn[g.id]].filter(Boolean);
      let best: Household | undefined,
        score = Infinity;
      for (const s of made) {
        if (s === h || !s.makes?.some((m) => wanted.includes(m))) continue;
        const good = s.makes.includes(g.id) ? g.id : standsIn[g.id];
        if (pack.setting?.economyRevision && s.producers?.[good] !== "player" && !sellerOf({ good, from: s.id }, made, world.initialActors)) continue;
        const d =
          Math.hypot(s.home.x - home.x, s.home.y - home.y) -
          (residence(s)?.access === "public" ? 30 : 0) +
          random(seed, h.id, "buys", g.id, s.id) * 12;
        if (d < score) [best, score] = [s, d];
      }
      if (!best) continue;
      const good = best.makes!.includes(g.id) ? g.id : standsIn[g.id];
      buys.push({ good, from: best.id, ...(pack.setting?.economyRevision && {
        seller: best.producers?.[good], product: best.products?.[good],
      }) });
      customers.set(best.id, (customers.get(best.id) ?? 0) + 1);
    }
    h.buys = buys;
    const creditors = buys.filter((b) => (byId.get(b.from)?.fortune ?? 0) > (h.fortune ?? 0) + 0.2);
    const creditor = pack.setting?.economyRevision
      ? creditors.sort((a, b) =>
          (a.good === "drink" ? 0.15 : ["bread", "grain", "milk", "oil"].includes(a.good) ? 3 : 1) * random(seed, h.id, "credit", a.good, a.from) -
          (b.good === "drink" ? 0.15 : ["bread", "grain", "milk", "oil"].includes(b.good) ? 3 : 1) * random(seed, h.id, "credit", b.good, b.from)).at(-1)
      : creditors[0];
    if (creditor && (h.fortune ?? 1) < 0.3 && random(seed, h.id, "owes") < 0.6) {
      h.owes = creditor.from;
      if (pack.setting?.economyRevision) h.credit = {
        ...creditor, debtor: h.members[0],
        amount: 4 + Math.floor(random(seed, h.id, "credit-amount") * 5),
        reason: h.history?.some((e) => ["bad-year", "fire", "robbed"].includes(e.kind) && year - e.year <= 2) ? "hardship" : "household",
        repayment: capabilitiesFor(pack.setting).has("coinage") ? "money" : "produce",
      };
    }
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
    [...made.flatMap((h) => h.members.map((m) => ({ a: world.initialActors.find((b) => b.id === m)!, home: h.home }))).filter((p) => p.a), ...(playerFriend ? [playerFriend] : [])],
    seed,
  );
  for (const { id, a, child, site, household } of pending) {
    // Members get a routine of their own so a household spreads across the
    // settlement during the day instead of stacking on one doorstep.
    const kit = livelihoodOf(pack, a);
    const i = household.members.indexOf(id);
    const memberSite = {
      ...site,
      ...(pack.setting?.employmentRevision ? { work: { ...(site.domesticWork ?? site.work) } } : {}),
      employment: undefined,
      role: undefined,
      ...(pack.setting?.employmentRevision ? { gateId: undefined, rackId: undefined, pasture: undefined } : {}),
      label: child ? "Errands" : (kit?.activity ?? "Keeping house"),
      offset: (site.offset + 37 * i) % 1440,
    };
    const buy =
      household.buys?.[
        Math.floor(random(seed, id, "shop") * (household.buys?.length ?? 0))
      ];
    const from = buy && byId.get(buy.from);
    const shop = from && residence(from);
    const seller = buy && sellerOf(buy, made, world.initialActors);
    plan.work.set(id, memberSite);
    if (!child) assignLocalWork(plan, pack, seed, a, memberSite);
    // A fishing household's shore work falls to those not in the boat:
    // gutting, drying and selling, and the children's bait and baskets.
    const landing = plan.waterfront?.members.find((m) => m.homeId === household.residence && m.handling);
    // Fishers without a boat place, and those whose work was the household's own
    // getting and keeping, work the catch; anyone with a trade keeps it.
    const ashore = !kit || /house|near water|gathering/i.test(kit.activity);
    const shore = landing && (child ? (a.age ?? 0) >= 6 : ashore && (plan.work.get(id)?.employment?.kind ?? "shore") === "shore")
      ? fishingRole(plan, pack, seed, id, Math.max(1, i), a) : undefined;
    plan.stations.set(
      id,
      withLoads(
        shore
          ? shoreRoutine(plan, seed, pack, id, landing!, shore, a)
          : kit && !child
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
                    label: `Buying ${goodName(buy!.good, buy!.product)} from ${seller.name}`,
                  }
                : undefined,
            ),
        carryKit(pack),
        buy?.good,
        child ? undefined : goodsOf(kit, pack.setting?.economyRevision)[0],
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
export function befriend(people: { a: Pick<Actor, "id" | "age" | "householdId" | "origin" | "relations">; home: Point }[], seed: string) {
  const pairs: { a: typeof people[number]["a"]; b: typeof people[number]["a"]; score: number }[] = [];
  for (const [i, x] of people.entries())
    for (const y of people.slice(i + 1)) {
      const a = x.a,
        b = y.a;
      if (a.householdId === b.householdId) continue;
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
