import { wearSlots } from "../core/character";
import { useState } from "react";
import {
  Amphora,
  BarChart3,
  BedDouble,
  BookOpen,
  Crown,
  Droplet,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Sprout,
  Users,
  Cog,
  Compass,
  Crosshair,
  Fish,
  Grid2x2,
  Hammer,
  Hand,
  Heart,
  Home,
  Leaf,
  MessageCircle,
  Mountain,
  Package,
  Rabbit,
  Sailboat,
  Scissors,
  ScrollText,
  ShoppingBag,
  Soup,
  TreePine,
  Waves,
  Wheat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CharacterSprite } from "./CharacterSprite";
import { Sprite, timeLabel } from "./components";
import { dayPlan } from "../core/itinerary";
import { dispositionOf, standingOf } from "../core/persona";
import { statsOf, statKeys } from "../core/stats";
import { abilitiesOf } from "../content/characters/abilities";
import { livelihoodById } from "../content/characters/livelihoods";
import {
  beliefOf,
  beliefsFor,
  unscopedBeliefs,
  wikiFor,
} from "../content/beliefs";
import { glyphForPower } from "../content/beliefs/icons";
import { deityIconFor } from "../content/beliefs/deity-icons";
import { GlyphIcon } from "./GlyphIcon";
import { stanceIcon } from "./StanceIcon";
import { useWikiSummary } from "./useWikiSummary";
import { outlookOf, outlookSentence, shortLabel } from "../core/outlook";
import { describeStanding, standingOf as rankOf } from "../core/standing";
import type { Stance, StanceTag } from "../content/outlook/types";
import { sexFromName } from "../content/characters/name-sex";
import type { Runtime } from "../runtime/session";
import type { Actor, PlayerCommand } from "../core/types";
import type { StationActivity } from "../core/itinerary";
import type { PersonalBelief } from "../content/beliefs";
import type { Power } from "../content/beliefs/types";

const dayIcons: Record<StationActivity, LucideIcon> = {
  rest: Moon,
  work: Hammer,
  tend: Sprout,
  haul: Package,
  "haul-catch": Package,
  "draw-water": Waves,
  gather: Leaf,
  visit: Users,
  graze: Rabbit,
  play: Footprints,
  cook: Soup,
  warm: Flame,
};
const conditionIcons: Record<string, LucideIcon> = {
  healthy: HeartPulse,
  unwell: HeartPulse,
  rested: BedDouble,
  tired: BedDouble,
  hungry: Soup,
  thirsty: Droplet,
};

const icons: Record<string, LucideIcon> = {
  Amphora,
  Cog,
  Compass,
  Crosshair,
  Fish,
  Grid2x2,
  Hammer,
  Heart,
  Home,
  Leaf,
  Mountain,
  Package,
  Rabbit,
  Sailboat,
  Scissors,
  ScrollText,
  ShoppingBag,
  Soup,
  TreePine,
  Waves,
  Wheat,
};
const relationLabels: Record<string, string> = {
  partner: "partner",
  parent: "parent",
  child: "child",
  "co-resident": "household",
};
type HouseholdRow = {
  person: Actor;
  note: string;
  isSelf: boolean;
  isHead: boolean;
};
type HouseholdGroup = { label: string; rows: HouseholdRow[] };

function roleOf(person: Actor): string {
  if (person.age !== undefined && person.age < 2) return "Infant";
  if (person.age !== undefined && person.age < 14) return "Child";
  return (
    person.origin?.roleLabel ??
    (person.origin
      ? (livelihoodById(person.origin.livelihood)?.label ?? person.role)
      : person.role)
  );
}

/* Groups the roof-sharers the way a household reads from the inside: the couple
 * at its head, then the generation above, then the children. */
function groupHousehold(
  actor: Actor,
  members: string[],
  everyone: Actor[],
): { groups: HouseholdGroup[]; hidden: number } {
  const by = (id: string) => everyone.find((a) => a.id === id);
  const kind = new Map(
    (actor.relations ?? []).map((r) => [r.other, r.kind] as const),
  );
  const partner = members
    .filter((id) => kind.get(id) === "partner")
    .map(by)
    .find(Boolean);
  const parentNames = [actor.name, partner?.name].filter(Boolean).join(" and ");
  const sexOf = (p: Actor) => p.origin?.sex ?? sexFromName(p.name);
  const head = members[0];

  const row = (person: Actor, note: string): HouseholdRow => ({
    person,
    note,
    isSelf: person.id === actor.id,
    isHead: person.id === head,
  });

  const parents: HouseholdRow[] = [];
  const elders: HouseholdRow[] = [];
  const children: HouseholdRow[] = [];
  const rest: HouseholdRow[] = [];
  for (const id of members) {
    const person = by(id);
    if (!person) continue;
    if (id === actor.id) {
      parents.push(row(person, ""));
      continue;
    }
    switch (kind.get(id)) {
      case "partner":
        // Only the first counts as the partner; the generator can list more.
        if (person.id === partner?.id)
          parents.push(row(person, `Partner of ${actor.name}`));
        else rest.push(row(person, "Shares the hearth"));
        break;
      case "parent": {
        const sex = sexOf(person);
        const word =
          sex === "female" ? "Mother" : sex === "male" ? "Father" : "Parent";
        elders.push(row(person, `${word} of ${actor.name}`));
        break;
      }
      case "child":
        children.push(row(person, `Child of ${parentNames}`));
        break;
      default:
        rest.push(row(person, "Shares the hearth"));
    }
  }
  children.sort((a, b) => (b.person.age ?? 0) - (a.person.age ?? 0));
  const ordered: HouseholdGroup[] = [
    { label: parents.length > 1 ? "Parents" : "Household", rows: parents },
    { label: "Elder kin", rows: elders },
    { label: "Children", rows: children },
    { label: "Also here", rows: rest },
  ].filter((g) => g.rows.length > 0);

  // Eight is as many faces as the card holds; the rest are counted, not listed.
  let left = 8;
  const groups: HouseholdGroup[] = [];
  let hidden = 0;
  for (const group of ordered) {
    if (left <= 0) {
      hidden += group.rows.length;
      continue;
    }
    groups.push({ label: group.label, rows: group.rows.slice(0, left) });
    hidden += Math.max(0, group.rows.length - left);
    left -= group.rows.length;
  }
  return { groups, hidden };
}

const Pips = ({ rank, tone }: { rank: number; tone: string }) => (
  <span className="pips" data-tone={tone} aria-label={`${rank} of 3`}>
    {[1, 2, 3].map((i) => (
      <i key={i} className={i <= rank ? "on" : ""} />
    ))}
  </span>
);

function PowerIcon({
  power,
  large = false,
}: {
  power: Power;
  large?: boolean;
}) {
  const source = deityIconFor(power.name);
  return source ? (
    <img
      className="deity-icon"
      src={source}
      alt=""
      width={large ? 96 : 64}
      height={large ? 96 : 64}
    />
  ) : (
    <GlyphIcon
      glyph={glyphForPower(power)}
      rank={power.rank}
      scale={large ? 6 : 4}
    />
  );
}

type PowerNode = {
  power: Power;
  x: number;
  y: number;
  tier: "primary" | "secondary";
};

export function beliefHierarchy(belief: PersonalBelief) {
  const featured = belief.system.powers
    .filter((power) => power.rank === "paramount")
    .slice(0, 3);
  if (!featured.length && belief.system.powers[0])
    featured.push(belief.system.powers[0]);
  const secondary = belief.system.powers
    .filter(
      (power) =>
        power.rank === "major" &&
        !featured.some((candidate) => candidate.name === power.name),
    )
    .slice(0, 5);
  const nodes: PowerNode[] = [
    ...featured.map((power, index) => ({
      power,
      x: ((index + 1) * 1000) / (featured.length + 1),
      y: 62,
      tier: "primary" as const,
    })),
    ...secondary.map((power, index) => ({
      power,
      x: ((index + 1) * 1000) / (secondary.length + 1),
      y: 232,
      tier: "secondary" as const,
    })),
  ];
  const positions = new Map(nodes.map((node) => [node.power.name, node]));
  const edges = nodes.flatMap((node) =>
    (node.power.relations ?? []).flatMap((relation) => {
      const target = positions.get(relation.of);
      if (!target || target.power.name === node.power.name) return [];
      // Between rows the line leaves from the facing edges. Within a row it
      // leaves from the far side and loops clear, so it never crosses the
      // icons sitting between the two ends.
      const sameRow = node.tier === target.tier;
      const startY = node.tier === "primary" ? node.y + 42 : node.y - 42;
      const endY = target.tier === "primary" ? target.y + 42 : target.y - 42;
      // Within a row the line runs through the gap between the rows, clear of
      // the icons standing between its two ends.
      const midY = sameRow
        ? startY + (node.tier === "primary" ? 20 : -20)
        : Math.round((startY + endY) / 2);
      return [
        {
          key: `${node.power.name}-${relation.kind}-${target.power.name}`,
          kind: relation.kind,
          path: `M ${node.x} ${startY} V ${midY} H ${target.x} V ${endY}`,
        },
      ];
    }),
  );
  return { nodes, edges, hidden: belief.system.powers.length - nodes.length };
}

/** One panel for the player and for anybody else: the same derived facts read
 * the same way whoever is being looked at. */
export function CharacterPanel({
  runtime,
  actorId,
  onClose,
  onAction,
  onSelect,
}: {
  runtime: Runtime;
  actorId: string;
  onClose: () => void;
  onAction: (command: PlayerCommand) => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<
    "profile" | "household" | "abilities" | "beliefs" | "ideology"
  >("profile");
  const [selectedStanceId, setSelectedStanceId] = useState<string | undefined>(
    undefined,
  );
  const [shown, setShown] = useState<string | undefined>(undefined);
  const [selectedPowerName, setSelectedPowerName] = useState<
    string | undefined
  >(undefined);
  const state = runtime.engine.state,
    seed = state.manifest.seed,
    pack = runtime.engine.world.pack;
  const everyone: Actor[] = [state.player, ...state.actors];
  const actor = everyone.find((a) => a.id === actorId);
  if (!actor) return null;
  const isPlayer = actor.id === state.player.id;
  const stats = statsOf(seed, actor),
    held = abilitiesOf(seed, actor),
    household = state.households?.find((h) => h.members.includes(actor.id));
  const livelihood = actor.origin
    ? livelihoodById(actor.origin.livelihood)
    : undefined;
  // A religious office is named for the belief system in force, so the drawn
  // title is on the actor, not on the table row its id points at.
  const roleLabel = actor.origin?.roleLabel ?? livelihood?.label ?? actor.role;
  const sex = actor.origin?.sex ?? sexFromName(actor.name);
  const they = sex === "female" ? "She" : sex === "male" ? "He" : "They";
  const householdView = household
    ? groupHousehold(actor, household.members, everyone)
    : undefined;
  // Placeholder until households carry real stores, tools and a recorded past.
  const size = household?.members.length ?? 0;
  const householdStats = [
    {
      icon: Home,
      label: "Shelter",
      value: size > 6 ? "Longhouse" : "Wood-and-bark house",
    },
    {
      icon: Hammer,
      label: "Tools",
      value: size > 5 ? "Shared and varied" : "Basic",
    },
    { icon: BedDouble, label: "Sleeping places", value: String(size) },
    { icon: Package, label: "Craft goods", value: "Some" },
    {
      icon: Users,
      label: "Dependents",
      value: String(
        household?.members.filter((id) => {
          const age = everyone.find((a) => a.id === id)?.age;
          return age !== undefined && age < 14;
        }).length ?? 0,
      ),
    },
  ];
  const raised =
    householdView?.groups
      .find((g) => g.label === "Children")
      ?.rows.map((r) => r.person.name) ?? [];
  const familyHistory = household
    ? `${actor.name}'s household was established near here several years ago. ` +
      (raised.length
        ? `${raised.join(", ")} ${raised.length > 1 ? "were" : "was"} born into the household and raised here. `
        : "") +
      "The family lives by daily work, exchange with nearby households, and " +
      "seasonal shares. They continue to keep one shelter, one hearth, and common stores."
    : "";
  const members = (actor.relations ?? [])
    .map((r) => ({
      relation: relationLabels[r.kind] ?? r.kind,
      // Blood and partnership read as closer than sharing a roof.
      closeness: r.kind === "co-resident" ? 2 : 3,
      person: everyone.find((a) => a.id === r.other),
    }))
    .filter((m) => m.person && m.person.kind === "human");
  const belief = beliefOf(
    seed,
    actor,
    pack.setting
      ? beliefsFor(pack.setting, actor.origin?.community)
      : unscopedBeliefs,
  );
  const hierarchy = beliefHierarchy(belief);
  const selectedPower =
    belief.system.powers.find((power) => power.name === selectedPowerName) ??
    belief.patron ??
    hierarchy.nodes[0]?.power ??
    belief.system.powers[0]!;
  const outlook = pack.setting
    ? outlookOf(seed, actor, pack.setting)
    : { stances: [] as Stance[], tags: new Set<StanceTag>() };
  const stance =
    outlook.stances.find((s) => s.id === selectedStanceId) ??
    outlook.stances[0];
  // Called here rather than in the tab body: a hook cannot sit behind a
  // condition, and the fetch is cheap and cached either way. A general's
  // article is the nearest one rather than one about the stance itself —
  // prosperity theology for "wealth is a sign of favour" — so it is offered
  // as a link and not quoted.
  const excerpt = useWikiSummary(stance?.fallback ? undefined : stance?.wiki);
  const rank = rankOf(seed, actor);
  const routine = runtime.engine.world.itinerary?.(actor.id);
  const plan = routine ? dayPlan(routine, state.clock) : [];
  const inspection = isPlayer ? undefined : runtime.engine.inspect(actor.id);
  // The mockup's one highlighted action; the rest stay in the Available list.
  const follow = inspection?.affordances.find(
    (a) => a.command.type === "interact" && a.command.action === "follow",
  );
  const available = (inspection?.affordances ?? []).filter((a) => a !== follow);
  const carrying = actor.held
    ? state.objects.find((o) => o.id === actor.held)
    : undefined;
  const goods = Object.entries(actor.inventory)
    .map(([id, n]) => [id, n ?? 0] as [string, number])
    .filter(([, n]) => n > 0);
  const worn = wearSlots.flatMap((slot) =>
    actor.worn?.[slot] ? [[slot, actor.worn[slot]!] as const] : [],
  );
  const shownId = shown ?? goods[0]?.[0];
  const wearable = shownId && runtime.item(shownId)?.wear ? shownId : undefined;
  const condition = [
    (actor.health ?? 100) < 40
      ? "Unwell"
      : actor.hunger > 70
        ? "Hungry"
        : "Healthy",
    actor.fatigue > 65 ? "Tired" : "Rested",
  ];
  if (actor.hunger > 55 && actor.hunger <= 70) condition.push("Thirsty");

  return (
    <div className="character-panel" data-tab={tab}>
      <header className="character-header">
        <i className="character-mark" aria-hidden="true" />
        <h2>{actor.name}</h2>
        <p>
          {actor.role}
          {actor.age !== undefined && ` · ${actor.age} years`}
        </p>
        <span className="where">
          {pack.region} · {pack.date}
        </span>
      </header>
      <nav role="tablist" aria-label="Character sections">
        {(
          [
            ["profile", "Profile"],
            ["household", "Household"],
            ["abilities", "Abilities"],
            ["beliefs", "Beliefs"],
            ["ideology", "Ideology"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "profile" && (
        <div className="character-body">
          <aside className="character-aside">
            <div className="portrait-frame corner-frame">
              <div className="character-portrait">
                <CharacterSprite
                  appearance={runtime.appearanceFor(actor)}
                  age={actor.age}
                  portrait
                />
              </div>
            </div>
            <ul className="condition">
              {condition.map((c) => {
                const Icon = conditionIcons[c.toLowerCase()] ?? HeartPulse;
                return (
                  <li key={c} data-state={c.toLowerCase()}>
                    <Icon size={16} />
                    {c}
                  </li>
                );
              })}
            </ul>
            <h3>Carrying</h3>
            <div className="carrying">
              {carrying ? (
                <>
                  <Sprite name={carrying.sprite} scale={1} />
                  <span>{carrying.name}</span>
                </>
              ) : (
                <span>Nothing in hand</span>
              )}
            </div>
            <i className="rule-diamond" aria-hidden="true" />
            <p className="character-quote">
              &ldquo;A quiet life keeps the village strong.&rdquo;
            </p>
            {follow && (
              <button
                className="follow-day"
                disabled={!follow.enabled}
                title={follow.reason}
                onClick={() => {
                  onAction(follow.command);
                  onClose();
                }}
              >
                <i />
                Follow {actor.name.split(" ")[0]}'s day
              </button>
            )}
          </aside>
          <div className="character-main">
            <h3>Currently</h3>
            <h1>
              {livelihood?.activity ??
                `${they} ${isPlayer ? "keep" : "keeps"} to the day's work.`}
            </h1>
            <p className="summary">
              {[
                roleLabel,
                actor.origin?.community,
                household && `household of ${household.members.length}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="panel-card">
              <h3>Today</h3>
              {plan.length > 0 ? (
              <ol className="day-plan">
                {plan.map((entry, i) => {
                  const Icon = dayIcons[entry.activity] ?? Hand;
                  const next =
                    entry.state === "later" &&
                    !plan.some((e, j) => j < i && e.state === "later");
                  return (
                    <li key={entry.label} data-state={entry.state}>
                      <Icon size={17} />
                      <time>{timeLabel(entry.minute * 60)}</time>
                      <span>{entry.label}</span>
                      <em>
                        {entry.state === "now"
                          ? "now"
                          : entry.state === "done"
                            ? "done"
                            : next
                              ? "next"
                              : "later"}
                      </em>
                    </li>
                  );
                })}
              </ol>
              ) : (
                <ol className="day-plan">
                  {[...state.events]
                    .reverse()
                    .slice(0, 4)
                    .map((e) => (
                      <li key={e.id} data-state="done">
                        <Moon size={17} />
                        <time>{timeLabel(e.time)}</time>
                        <span>{e.text}</span>
                      </li>
                    ))}
                </ol>
              )}
            </div>
            <div className="character-pair">
              <div className="panel-card">
                <h3>About</h3>
                <p className="character-about">
                  {actor.name.split(" ")[0]} is a {roleLabel.toLowerCase()}
                  {actor.origin?.community
                    ? ` of the ${actor.origin.community}`
                    : ""}
                  , known for {dispositionOf(stats).toLowerCase()} habits.{" "}
                  {they} take part in the daily work of the settlement.
                </p>
              </div>
              <div className="panel-card">
                <h3>Abilities</h3>
                <ul className="ability-list">
                  {held.map(({ ability, rank }) => {
                    const Icon = icons[ability.icon] ?? Hand;
                    return (
                      <li key={ability.id}>
                        <Icon size={16} />
                        <span>{ability.label}</span>
                        <Pips rank={rank} tone={ability.stat} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <dl className="bearing panel-card">
              <div>
                <dt>Disposition</dt>
                <dd>{dispositionOf(stats)}</dd>
              </div>
              <div>
                <dt>Standing</dt>
                <dd>{standingOf(seed, actor, household)}</dd>
              </div>
            </dl>
          </div>
          <aside className="character-side">
            <h3>Household</h3>
            {members.length ? (
              <ul className="household-list">
                {members.map(({ relation, closeness, person }) => (
                  <li key={person!.id}>
                    <button onClick={() => onSelect(person!.id)}>
                      <CharacterSprite
                        appearance={runtime.appearanceFor(person!)}
                      />
                      <span>
                        {person!.name}
                        <small>
                          {relation} ·{" "}
                          {person!.origin?.roleLabel ??
                            (person!.origin
                              ? (livelihoodById(person!.origin.livelihood)
                                  ?.label ?? person!.role)
                              : person!.role)}
                        </small>
                      </span>
                      <b className="dots" aria-hidden="true">
                        {[1, 2, 3].map((i) => (
                          <i key={i} className={i <= closeness ? "on" : ""} />
                        ))}
                      </b>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No household recorded here.</p>
            )}
            <h3>Worn</h3>
            <ul className="belongings worn">
              {worn.map(([slot, id]) => (
                <li key={slot}>
                  <button
                    aria-label={
                      isPlayer
                        ? `Take off ${runtime.item(id)?.name ?? id}`
                        : (runtime.item(id)?.name ?? id)
                    }
                    title={runtime.item(id)?.name ?? id}
                    disabled={!isPlayer || slot === "body"}
                    onClick={() => runtime.command({ type: "remove", slot })}
                  >
                    <Sprite name={runtime.item(id)?.sprite ?? ""} scale={1} />
                  </button>
                </li>
              ))}
              {!worn.length && (
                <li className="empty" aria-hidden="true">
                  ·
                </li>
              )}
            </ul>
            <h3>Belongings</h3>
            <ul className="belongings">
              {goods.map(([id, n]) => (
                <li key={id}>
                  <button
                    aria-pressed={shown === id}
                    onClick={() => setShown(id)}
                  >
                    <Sprite name={runtime.item(id)?.sprite ?? ""} scale={1} />
                    {n > 1 && <b>×{n}</b>}
                  </button>
                </li>
              ))}
              {Array.from({ length: Math.max(0, 6 - goods.length) }, (_, i) => (
                <li key={`empty-${i}`} className="empty" aria-hidden="true">
                  +
                </li>
              ))}
            </ul>
            <p className="belonging-note">
              {goods.length
                ? [
                    runtime.item(shown ?? goods[0][0])?.name,
                    runtime.item(shown ?? goods[0][0])?.description,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Carries nothing."}
              {isPlayer && goods.length > 0 && wearable && (
                <button
                  className="wear-action"
                  onClick={() =>
                    runtime.command({ type: "wear", item: wearable })
                  }
                >
                  Wear
                </button>
              )}
            </p>
            {inspection && (
              <>
                <h3>Available</h3>
                <ul className="available">
                  {available.map((a, i) => (
                    <li key={i}>
                      <button
                        disabled={!a.enabled}
                        title={a.reason}
                        onClick={() => {
                          onAction(a.command);
                          onClose();
                        }}
                      >
                        {a.command.type === "trade" ? (
                          <ShoppingBag size={14} />
                        ) : a.label.includes("Talk") ? (
                          <MessageCircle size={14} />
                        ) : (
                          <Hand size={14} />
                        )}
                        {a.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </div>
      )}
      {tab === "household" && (
        <div className="character-tab household-tab">
          {household && householdView ? (
            <>
              <p className="household-line">
                {household.members.length} people sharing one roof, one hearth,
                and stored provisions.
              </p>
              <div className="household-grid">
                <section className="panel-card household-card">
                  <h3>
                    <Home size={18} /> Household
                  </h3>
                  <div className="household-groups">
                    {householdView.groups.map((group) => (
                      <div className="household-group" key={group.label}>
                        <span className="household-group-label">
                          {group.label}
                        </span>
                        <i className="household-stem" aria-hidden="true" />
                        <ul className="household-rows">
                          {group.rows.map(({ person, note, isSelf, isHead }) => (
                            <li key={person.id}>
                              <button
                                onClick={() => onSelect(person.id)}
                                aria-current={isSelf ? "true" : undefined}
                              >
                                <span
                                  className="household-portrait"
                                  aria-hidden="true"
                                >
                                  <CharacterSprite
                                    appearance={runtime.appearanceFor(person)}
                                    scale={2}
                                  />
                                </span>
                                <span className="household-who">
                                  <b>{person.name}</b>
                                  <small>
                                    {person.age !== undefined && (
                                      <>
                                        Age {person.age}
                                        <i aria-hidden="true">·</i>
                                      </>
                                    )}
                                    {roleOf(person)}
                                  </small>
                                </span>
                                <span className="household-note">
                                  {isHead && (
                                    <em className="household-chip">
                                      <Crown size={13} /> Head of household
                                    </em>
                                  )}
                                  {isSelf && (
                                    <em className="household-chip is-self">
                                      <i
                                        className="rule-diamond"
                                        aria-hidden="true"
                                      />{" "}
                                      This person
                                    </em>
                                  )}
                                  {!isSelf && note && <i>{note}</i>}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {householdView.hidden > 0 && (
                    <p className="household-more">
                      {householdView.hidden} more share the roof.
                    </p>
                  )}
                </section>
                <div className="household-side">
                  <section className="panel-card">
                    <h3>
                      <BarChart3 size={18} /> Household stats
                      <em>Shared material conditions.</em>
                    </h3>
                    <dl className="household-stats">
                      {householdStats.map(({ icon: Icon, label, value }) => (
                        <div key={label}>
                          <Icon size={16} />
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <section className="panel-card">
                    <h3>
                      <BookOpen size={18} /> Family history
                      <em>A simple record of the household's past.</em>
                    </h3>
                    <p className="household-history">{familyHistory}</p>
                  </section>
                </div>
              </div>
            </>
          ) : (
            <p>No household is recorded for {actor.name}.</p>
          )}
        </div>
      )}
      {tab === "abilities" && (
        <div className="character-tab">
          <ul className="ability-list wide">
            {held.map(({ ability, rank }) => {
              const Icon = icons[ability.icon] ?? Hand;
              return (
                <li key={ability.id}>
                  <Icon size={16} />
                  <span>{ability.label}</span>
                  <Pips rank={rank} tone={ability.stat} />
                </li>
              );
            })}
          </ul>
          <h3>Measures</h3>
          <ul className="stat-bars">
            {statKeys.map((key) => (
              <li key={key}>
                <span>{key}</span>
                <i>
                  <b style={{ width: `${stats[key]}%` }} />
                </i>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === "beliefs" && (
        <div className="belief-layout">
          <aside className="belief-aside">
            <div className="belief-portrait">
              <CharacterSprite
                appearance={runtime.appearanceFor(actor)}
                age={actor.age}
                portrait
              />
            </div>
            <h1>Spiritual life</h1>
            <p>
              {belief.system.label}. {belief.keeps ?? belief.system.practice[0]}
            </p>
            <dl className="belief-measures">
              <div>
                <dt>Observance</dt>
                <dd>{belief.observance}</dd>
              </div>
              {belief.patron && (
                <div>
                  <dt>Personal devotion</dt>
                  <dd>{belief.patron.name}</dd>
                </div>
              )}
              <div>
                <dt>Evidence</dt>
                <dd>{belief.system.evidence.status}</dd>
              </div>
            </dl>
            {belief.system.specialist && (
              <div className="belief-tradition">
                <h3>Officiated by</h3>
                <p>{belief.system.specialist}</p>
              </div>
            )}
          </aside>
          <div className="belief-main">
            <div className="belief-intro">
              <div>
                <h3>Belief and devotion</h3>
                <h1>{belief.system.label}</h1>
                <p>
                  The central figures in {actor.name.split(" ")[0]}'s religious
                  world.
                </p>
              </div>
              <div className="belief-legend" aria-label="Relationship legend">
                <span>
                  <i /> named relation
                </span>
              </div>
            </div>
            <div className="power-map">
              <svg
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {hierarchy.edges.map((edge) => (
                  <path
                    key={edge.key}
                    d={edge.path}
                    data-relation={edge.kind}
                  />
                ))}
              </svg>
              {hierarchy.nodes.map((node) => (
                <button
                  key={node.power.name}
                  className="power-node"
                  data-tier={node.tier}
                  data-selected={selectedPower.name === node.power.name}
                  style={{ left: `${node.x / 10}%`, top: `${node.y / 3}%` }}
                  onClick={() => setSelectedPowerName(node.power.name)}
                  aria-pressed={selectedPower.name === node.power.name}
                >
                  <PowerIcon power={node.power} />
                  <strong>{node.power.name}</strong>
                  <small>
                    {node.tier === "primary" ? "foundational" : "important"}
                  </small>
                </button>
              ))}
              {hierarchy.hidden > 0 && (
                <span className="more-powers">+{hierarchy.hidden} known</span>
              )}
            </div>
            <div className="power-detail">
              <div className="power-identity">
                <h1>{selectedPower.name}</h1>
                <div className="power-portrait">
                  <PowerIcon power={selectedPower} large />
                </div>
                <p>{selectedPower.domain}</p>
              </div>
              <div className="power-copy">
                <h2>{selectedPower.domain}.</h2>
                {selectedPower.gloss && <p>{selectedPower.gloss}</p>}
                <p>{belief.system.evidence.claim}</p>
                <dl>
                  <div>
                    <dt>Personal stance</dt>
                    <dd>
                      {selectedPower.name === belief.patron?.name
                        ? "Personally significant"
                        : "Central to this tradition"}
                    </dd>
                  </div>
                  <div>
                    <dt>Relation</dt>
                    <dd>
                      {selectedPower.relations?.length
                        ? selectedPower.relations
                            .map(
                              (relation) =>
                                `${relation.kind.replaceAll("-", " ")} ${relation.of}`,
                            )
                            .join(" · ")
                        : hierarchy.nodes.find(
                              (node) => node.power.name === selectedPower.name,
                            )?.tier === "primary"
                          ? "Foundational"
                          : "Important"}
                    </dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{belief.system.evidence.status}</dd>
                  </div>
                </dl>
              </div>
              <div className="belief-practices">
                <h3>Practices</h3>
                <ul>
                  {belief.system.practice.slice(0, 3).map((practice) => (
                    <li key={practice}>{practice}</li>
                  ))}
                </ul>
                {wikiFor(belief.system, selectedPower) && (
                  <a
                    href={wikiFor(belief.system, selectedPower)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === "ideology" && (
        <div className="outlook-layout">
          <aside className="outlook-aside">
            <div className="portrait-frame corner-frame outlook-portrait">
              <CharacterSprite
                appearance={runtime.appearanceFor(actor)}
                age={actor.age}
                portrait
              />
            </div>
            <h1>Outlook</h1>
            <i className="rule-diamond" aria-hidden="true" />
            <p>
              {outlook.stances.length
                ? outlookSentence(outlook)
                : "Nothing is recorded of what people here held, beyond their religious practice."}
            </p>
            {outlook.tags.size > 0 && (
              <ul className="outlook-tags">
                {[...outlook.tags].map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
            {rank && (
              <dl className="outlook-measures">
                <div>
                  <dt>Standing</dt>
                  <dd>{describeStanding(rank)}</dd>
                </div>
              </dl>
            )}
          </aside>
          <div className="outlook-main">
            <h3>Ideology and outlook</h3>
            <h1>{stance ? stance.label : "No recorded positions"}</h1>
            <p className="outlook-lede">
              Held alongside {actor.name.split(" ")[0]}&apos;s religious
              practice, and drawn from what was available here and then.
            </p>
            <div className="stance-row">
              {outlook.stances.map((held) => {
                const Icon = stanceIcon(held.icon);
                return (
                  <button
                    key={held.id}
                    className="stance-card"
                    data-kind={held.kind}
                    data-selected={stance?.id === held.id}
                    onClick={() => setSelectedStanceId(held.id)}
                    aria-pressed={stance?.id === held.id}
                  >
                    <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
                    <strong>{shortLabel(held)}</strong>
                    <small>{held.kind}</small>
                  </button>
                );
              })}
            </div>
            {stance && (
              <div className="stance-detail corner-frame">
                <div className="stance-identity">
                  <span className="stance-tile" data-kind={stance.kind}>
                    {(() => {
                      const Icon = stanceIcon(stance.icon);
                      return (
                        <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                      );
                    })()}
                  </span>
                  <h2>{stance.label}</h2>
                  <small>{stance.kind}</small>
                  <dl>
                    <div>
                      <dt>Leaning</dt>
                      <dd>{stance.lean ?? "settled"}</dd>
                    </div>
                    <div>
                      <dt>Held by</dt>
                      <dd>
                        {stance.ranks ? stance.ranks.join(", ") : "every rank"}
                      </dd>
                    </div>
                    <div>
                      <dt>Commonness</dt>
                      <dd>
                        {stance.weight >= 16
                          ? "ordinary"
                          : stance.weight >= 8
                            ? "widely held"
                            : "a minority"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="stance-copy">
                  <p>{stance.note}</p>
                  {excerpt && <p className="stance-excerpt">{excerpt}</p>}
                  <a href={stance.wiki} target="_blank" rel="noreferrer">
                    {stance.fallback ? "Related reading ↗" : "View source ↗"}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <footer>
        <span />
        <button onClick={onClose}>Close</button>
      </footer>
    </div>
  );
}
