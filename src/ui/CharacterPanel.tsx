import { useState } from "react";
import {
  Amphora,
  BedDouble,
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
import { describeStats, statsOf, statKeys } from "../core/stats";
import { abilitiesOf } from "../content/characters/abilities";
import { livelihoodById } from "../content/characters/livelihoods";
import { beliefOf, beliefsFor, unscopedBeliefs } from "../content/beliefs";
import { glyphForPower } from "../content/beliefs/icons";
import { GlyphIcon } from "./GlyphIcon";
import { sexFromName } from "../content/characters/name-sex";
import type { Runtime } from "../runtime/session";
import type { Actor, PlayerCommand } from "../core/types";
import type { StationActivity } from "../core/itinerary";

const dayIcons: Record<StationActivity, LucideIcon> = {
  rest: Moon,
  work: Hammer,
  tend: Sprout,
  haul: Package,
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
const Pips = ({ rank, tone }: { rank: number; tone: string }) => (
  <span className="pips" data-tone={tone} aria-label={`${rank} of 3`}>
    {[1, 2, 3].map((i) => (
      <i key={i} className={i <= rank ? "on" : ""} />
    ))}
  </span>
);

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
    "profile" | "household" | "abilities" | "beliefs"
  >("profile");
  const [shown, setShown] = useState<string | undefined>(undefined);
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
  const sex = actor.origin?.sex ?? sexFromName(actor.name);
  const they = sex === "female" ? "She" : sex === "male" ? "He" : "They";
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
    pack.setting ? beliefsFor(pack.setting) : unscopedBeliefs,
  );
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
    <div className="character-panel">
      <header>
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
            <div className="character-portrait">
              <CharacterSprite
                appearance={runtime.appearanceFor(actor)}
                portrait
              />
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
            <h1>
              {livelihood?.activity ??
                `${they} ${isPlayer ? "keep" : "keeps"} to the day's work.`}
            </h1>
            <p className="summary">
              {[
                livelihood?.label ?? actor.role,
                actor.origin?.community,
                household && `household of ${household.members.length}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
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
            <dl className="bearing">
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
                          {person!.origin
                            ? (livelihoodById(person!.origin.livelihood)
                                ?.label ?? person!.role)
                            : person!.role}
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
        <div className="character-tab">
          {household ? (
            <>
              <p>
                {household.members.length} people, sharing one store and one
                roof.
              </p>
              <ul className="household-list wide">
                {household.members.map((id) => {
                  const person = everyone.find((a) => a.id === id);
                  if (!person) return null;
                  const relation = (actor.relations ?? []).find(
                    (r) => r.other === id,
                  );
                  return (
                    <li key={id}>
                      <button onClick={() => onSelect(id)}>
                        <CharacterSprite
                          appearance={runtime.appearanceFor(person)}
                        />
                        <span>
                          {person.name}
                          <small>
                            {id === actor.id
                              ? "this person"
                              : (relationLabels[relation?.kind ?? ""] ??
                                "household")}
                            {person.age !== undefined && ` · ${person.age}`} ·{" "}
                            {person.role}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
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
        <div className="character-tab">
          <div className="patron">
            <GlyphIcon
              glyph={glyphForPower(belief.patron)}
              rank={belief.patron.rank}
              scale={4}
            />
            <h1>{belief.patron.name}</h1>
          </div>
          <p className="summary">
            {belief.patron.domain} · {belief.observance} in observance
            {belief.paramount && belief.paramount !== belief.patron
              ? ` · under ${belief.paramount.name}`
              : ""}
          </p>
          {belief.keeps && <p className="keeps">{belief.keeps}</p>}
          <h3>{belief.system.label}</h3>
          <ul className="powers">
            {belief.system.powers.map((power) => (
              <li key={power.name} data-rank={power.rank}>
                <GlyphIcon glyph={glyphForPower(power)} rank={power.rank} />
                <span>
                  {power.name}
                  <small>
                    {power.gloss ? `${power.gloss} · ` : ""}
                    {power.domain}
                    {power.relation
                      ? ` · ${power.relation.kind.replace("-", " ")} ${power.relation.of}`
                      : ""}
                  </small>
                </span>
                <em>{power.rank}</em>
              </li>
            ))}
          </ul>
          {belief.system.specialist && (
            <>
              <h3>Officiated by</h3>
              <p>{belief.system.specialist}</p>
            </>
          )}
          {belief.system.afterlife && (
            <>
              <h3>After death</h3>
              <p>{belief.system.afterlife}</p>
            </>
          )}
        </div>
      )}
      <footer>
        <span>{describeStats(stats).join(", ") || "unremarkable"}</span>
        <button onClick={onClose}>Close</button>
      </footer>
    </div>
  );
}
