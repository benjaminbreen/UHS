import type { WorldSetting } from "../content/geography/types";
import type { PropAct, PropDef } from "../content/props/catalog";
import { instrumentForProp, type InstrumentId } from "../audio/instruments";
import type { Prop } from "../render/interiors/room";
import type { InteriorLayout } from "../world/interior";
import { random } from "./random";
import type { Actor, Inventory, Place, Point, Position, WorldObject } from "./types";

export type RoomPropHost = {
  seed: string;
  clock: number;
  setting?: WorldSetting;
  year: number;
  places: readonly Place[];
  objects: WorldObject[];
  actors: Actor[];
  playerPos: Position;
  playerHouseholdId?: string;
  hasItem(id: string): boolean;
  interiorOf(space: string): InteriorLayout | undefined;
  blocked(x: number, y: number, space: string): boolean;
  actorAt(pos: Position, ignore: string): boolean;
  moveActor(a: Actor, pos: Position): void;
  asleep(a: Actor, space: string, label: string): boolean;
  mindsCounter(a: Actor, space: string, label: string): boolean;
  livesIn(a: Actor, space: string): boolean;
  rain(): number;
  storm(): number;
  say(who: string, text: string): void;
  lieDown(o: WorldObject): string;
  event(text: string): void;
};

const LIGHT_PROPS = new Set(["room-lamp", "room-lantern", "room-tapers", "room-brazier"]);
const FIRE_PROPS = new Set(["room-hearth", "room-firepit", "room-irori", "room-stove", "room-range"]);
const NPC_PROPS = new Set([
  "room-radio",
  "room-shrine",
  "room-scrolls",
  "room-desk",
  "room-icebox",
  "room-jars",
  "room-casks",
  "room-fountain",
  "room-basin",
  "room-map",
  "room-clock",
  "room-cat",
]);

const isElectricLamp = (o: WorldObject, room: InteriorLayout | undefined, year: number) =>
  o.prop === "room-lamp" && (room?.params.styles.lamp === "electric" || year >= 1910);

export const hasShutters = (room: InteriorLayout | undefined) => room?.params.windowStyle === "shutter";

/** Dynamic button label for an indoor prop act (adapting to electric vs flame lights, shutters, toggles, and era). */
export function roomPropVerb(o: WorldObject, def: PropDef, room: InteriorLayout | undefined, year: number) {
  const act = def.act;
  if (!act) return "";
  if (o.prop === "room-lamp" && isElectricLamp(o, room, year))
    return o.open ? "Switch off the lamp" : "Switch on the lamp";
  if (o.prop === "room-window")
    return hasShutters(room) ? (o.open ? "Shut the shutters" : "Open the shutters") : "Look out the window";
  if (o.prop === "room-scrolls") return year < 500 ? "Unroll a scroll" : "Read a book";
  if (act.toggle) return o.open ? act.toggle[1] : act.toggle[0];
  return act.verb;
}

/** Initial state (lit/playing/awake/open/stocked) when a room's furniture objects are first spawned. */
export function initialRoomPropState(
  key: string,
  q: Prop | undefined,
  room: InteriorLayout,
  clock: number,
  seed: string,
  hasItem: (id: string) => boolean,
  rain = 0,
): { open?: boolean; inventory?: Inventory } {
  const hour = ((clock / 3600) % 24 + 24) % 24;
  const dark = hour < 6 || hour >= 18 || room.params.windows === 0;
  const roll = random(seed, "room-init", key, q?.id ?? 0);
  if (LIGHT_PROPS.has(key)) return { open: dark };
  if (FIRE_PROPS.has(key)) return { open: hour < 10 || hour >= 16 };
  if (key === "room-window") return { open: !hasShutters(room) || (hour >= 6 && hour < 19 && rain < 0.4) };
  if (key === "room-shrine") return { open: !!q?.on || dark };
  if (key === "room-radio") return { open: hour >= 7 && hour < 22 && roll < 0.35 };
  if (key === "room-cat") return { open: hour >= 7 && hour < 21 && roll < 0.35 };
  if (key === "room-terrarium") return { open: hour >= 6 && hour < 22 };
  if (key === "room-birdcage") return { open: false };
  if (key === "room-piano" || key === "room-lute" || key === "room-guitar") return { open: q?.item === "backroom:speakeasy-piano" };
  if (key === "room-icebox" || key === "room-dresser") {
    const inv: Inventory = {};
    if (hasItem("bread")) inv.bread = 1;
    if (key === "room-icebox" && hasItem("milk") && roll < 0.6) inv.milk = 1;
    else if (hasItem("fish") && roll < 0.5) inv.fish = 1;
    if (hasItem("water") && roll > 0.4) inv.water = 1;
    return { open: false, inventory: inv };
  }
  return {};
}

function formatClockTime(clock: number) {
  const total = Math.floor((((clock % 86400) + 86400) % 86400) / 60);
  const h24 = Math.floor(total / 60), min = total % 60;
  const h12 = h24 % 12 || 12;
  const words = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const next = words[(h12 % 12) + 1];
  const part = h24 < 5 ? "in the night" : h24 < 12 ? "in the morning" : h24 < 17 ? "in the afternoon" : h24 < 21 ? "in the evening" : "at night";
  if (min < 4 || min > 56) {
    const hr = min > 56 ? next : words[h12];
    if ((h24 === 0 && min < 4) || (h24 === 23 && min > 56)) return "midnight";
    if ((h24 === 12 && min < 4) || (h24 === 11 && min > 56)) return "noon";
    return `${hr} o'clock ${part}`;
  }
  if (min >= 12 && min <= 18) return `quarter past ${words[h12]} ${part}`;
  if (min >= 27 && min <= 33) return `half past ${words[h12]} ${part}`;
  if (min >= 42 && min <= 48) return `quarter to ${next} ${part}`;
  return `${h12}:${String(min).padStart(2, "0")} ${h24 < 12 ? "in the morning" : h24 < 18 ? "in the afternoon" : "at night"}`;
}

/** Period- and place-aware broadcast line from a working radio. */
export function radioBroadcast(setting: WorldSetting | undefined, clock: number, seed: string, slot: number): string {
  const year = setting?.year ?? 1950;
  const place = setting?.location ?? "the city";
  const hour = ((clock / 3600) % 24 + 24) % 24;
  const tod = hour < 11 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const pick = <T>(list: readonly T[]) => list[Math.floor(random(seed, "radio", slot, Math.floor(clock / 900)) * list.length)];
  if (year < 1930) {
    return pick([
      `Through a crackle of static, a dance band plays a foxtrot from a hotel ballroom in ${place}.`,
      `An announcer's thin voice reads the ${tod} grain and shipping prices out of ${place}.`,
      `A string trio fades in and out through the hiss, followed by the time pips.`,
      `You catch a lecture on household wireless sets before the signal drifts into static.`,
    ]);
  }
  if (year < 1946) {
    return pick([
      `A calm announcer reads the ${tod} news bulletin and weather outlook for ${place}.`,
      `A big band swings through a brassy dance number, live from a studio hall.`,
      `Voices play out a tense serial drama over footsteps and a studio door slam.`,
      `A pianist finishes a waltz, and the studio announcer gives the station call sign and the hour.`,
    ]);
  }
  if (year < 1970) {
    return pick([
      `The announcer reads the ${tod} weather and regional headlines for ${place}, followed by a chime.`,
      `A bright guitar-and-piano record spins over the speaker, the bass humming warm in the cabinet.`,
      `A commentator calls the score of a local match over the roar of a distant crowd.`,
      `A host introduces a request hour for listeners across ${place} and the surrounding towns.`,
    ]);
  }
  return pick([
    `An announcer runs through the ${tod} headlines, local transit delays, and the forecast for ${place}.`,
    `A studio DJ fades out a pop single and takes a caller's song request from across town.`,
    `Two hosts trade sharp opinions on a local call-in talk show before cutting to the weather.`,
    `A familiar melody fills the room, punctuated by the station jingle on the half-hour.`,
  ]);
}

function bookReading(room: InteriorLayout | undefined, setting: WorldSetting | undefined, clock: number, seed: string, isDesk: boolean): string {
  const year = setting?.year ?? 1600;
  const trade = room?.params.trade ?? "household";
  const place = setting?.location ?? "the district";
  const pick = <T>(list: readonly T[]) => list[Math.floor(random(seed, isDesk ? "desk" : "book", trade, Math.floor(clock / 600)) * list.length)];
  if (isDesk) {
    if (trade === "merchant" || trade === "shopkeep")
      return pick([
        `Columns of weights, debts, and deliveries from suppliers round ${place}, ticked off in neat ink.`,
        `A half-written invoice, a bundle of receipts, and a wax-sealed letter quoting prices for next month.`,
      ]);
    if (trade === "scholar")
      return pick([
        `Notes crowded into the margins of a commentary, with a fresh nib and an inkwell beside them.`,
        `Letters from correspondents in neighbouring towns, folded flat beneath a smooth river stone.`,
      ]);
    return pick([
      `Household accounts, rent tallies, and a short letter left half-finished beside the pen.`,
      `Lists of seasonal stores, chores, and small sums owed to neighbours in ${place}.`,
    ]);
  }
  if (year < 500) {
    return pick([
      `You unroll a tightly wound scroll of poetry and speeches, its ink faded at the edges from handling.`,
      `You read a treatise on farming, stars, and the seasons, copied in a steady hand.`,
      `You scan a roll of local annals and names of magistrates who held office in ${place}.`,
    ]);
  }
  if (year < 1500) {
    return pick([
      `You leaf through a bound herbal describing bitter roots, poultices, and garden simples.`,
      `You read a page of a local chronicle noting bad harvests, fairs, and comets seen over ${place}.`,
      `You open a well-thumbed collection of proverbs, prayers, and calendar tables.`,
    ]);
  }
  if (year < 1850) {
    return pick([
      `You browse a printed almanac filled with tide tables, market days, and weather maxims for ${place}.`,
      `You dip into a travel account describing ports, customs, and roads far beyond ${place}.`,
      `You read a chapter of essays and verse, its pages marked with a slip of ribbon.`,
    ]);
  }
  return pick([
    `You flip through a worn novel, a household manual, and a stack of local newspapers from ${place}.`,
    `You read an illustrated history of the region, tucked beside an atlas and a trade directory.`,
    `You skim a magazine article and a paperback left dog-eared on the shelf.`,
  ]);
}

function shrineLine(room: InteriorLayout | undefined, setting: WorldSetting | undefined, wasLit: boolean): string {
  const faith = room?.observance?.tradition ?? setting?.culture ?? "";
  const lit = wasLit ? "The small candle burns steady." : "You light the candle and set it straight.";
  if (/shinto|buddh|east-asian|japanese|chinese|korean/i.test(faith))
    return `${lit} You bow your head before the household altar and take a quiet breath.`;
  if (/hindu|south-asian|indian/i.test(faith))
    return `${lit} You pause before the painted shrine, smelling faint incense and marigold petals.`;
  if (/roman|greek|mediterranean/i.test(faith) && (setting?.year ?? 0) < 400)
    return `${lit} You pause before the household spirits' niche and leave a quiet wish for the house.`;
  return `${lit} You stand a moment in quiet reflection before the house shrine.`;
}

function mapLine(host: RoomPropHost): string {
  const s = host.setting;
  const place = s?.location ?? "the area";
  const named = host.places
    .map((p) => p.name)
    .filter((n) => n && !/^House/i.test(n))
    .slice(0, 3);
  const landmarks = named.length ? ` Marks pick out ${named.join(", ")} and the roads linking them.` : "";
  const note = (s?.year ?? 1600) < 1500
    ? `Ink roads, rivers, and coastal headlands round ${place} are drawn out in a careful hand.`
    : `Roads, rivers, and neighbouring towns round ${place} are charted in fine lines.`;
  return `You study the wall map. ${note}${landmarks}`;
}

function drinkLine(o: WorldObject, room: InteriorLayout | undefined, setting: WorldSetting | undefined): string {
  if (o.prop === "room-fountain") return "You cup cool water from the courtyard fountain and drink, then top up what you carry.";
  if (o.prop === "room-basin") return "You splash cool water over your hands and face at the basin and take a drink.";
  if (o.prop === "room-casks" || o.prop === "room-tankards") {
    const culture = setting?.culture ?? "";
    const drink = /mediterranean|latin|iberian/i.test(culture) ? "table wine" : /east-asian/i.test(culture) ? "warm tea" : /north-african|west-asian/i.test(culture) ? "spiced water" : "small beer";
    return `You draw a mug of ${drink} and take a long, refreshing swallow.`;
  }
  return room?.params.trade === "host"
    ? "You ladle a cool drink from the jar and wet your throat."
    : "You dip a cup of cool drinking water from the clay jar and refill what you carry.";
}

function windowView(host: RoomPropHost, room: InteriorLayout | undefined): string {
  const hour = ((host.clock / 3600) % 24 + 24) % 24;
  const rain = host.rain(), storm = host.storm();
  const skyText = storm > 0.45
    ? "dark storm clouds and sheets of driving rain"
    : rain > 0.35
      ? "steady rain streaking down past the eaves"
      : rain > 0.1
        ? "a damp grey sky and light drizzle"
        : hour < 5 || hour >= 21
          ? "night sky and faint stars"
          : hour < 7
            ? "pale dawn light"
            : hour < 17
              ? "clear daylight"
              : "low golden evening light";
  const place = host.setting?.location ?? "the town";
  const storey = room?.params.storey;
  if (storey !== undefined && storey >= 3)
    return `You look out from floor ${storey + 1}. Rooftops and towers of ${place} stretch away beneath ${skyText}.`;
  return `You look out the window over ${place}. Outside there is ${skyText}.`;
}

/** Mild verbal reaction from an awake resident when the player meddles with their lights, radio, fire, shutters, or cupboards. */
export function reactRoomProp(
  host: RoomPropHost,
  o: WorldObject,
  kind: "light-off" | "radio-off" | "fire-off" | "shutter-shut" | "rummage",
) {
  if (!o.owner || o.owner === "player") return;
  const space = o.pos.space;
  if (space === "outside") return;
  const place = host.places.find((p) => p.id === space);
  if (place?.owner === "player") return;
  const room = host.interiorOf(space);
  const hour = ((host.clock / 3600) % 24 + 24) % 24;
  const dark = hour < 6 || hour >= 18 || (room?.params.windows ?? 1) === 0;
  if (kind === "light-off" && !dark) return;
  if (kind === "shutter-shut" && (dark || host.rain() >= 0.35)) return;

  const witness = host.actors
    .filter(
      (a) =>
        a.kind === "human" &&
        !a.dead &&
        !a.terror &&
        a.pos.space === space &&
        (!host.playerHouseholdId || a.householdId !== host.playerHouseholdId) &&
        !host.asleep(a, space, a.activity),
    )
    .sort((a, b) => Math.hypot(a.pos.x - host.playerPos.x, a.pos.y - host.playerPos.y) - Math.hypot(b.pos.x - host.playerPos.x, b.pos.y - host.playerPos.y))[0];
  if (!witness) return;

  witness.direction = faceToward(witness.pos, host.playerPos);
  const line =
    kind === "light-off"
      ? "Leave the light on, it's dark in here."
      : kind === "radio-off"
        ? "Hey, I was listening to that."
        : kind === "fire-off"
          ? "Don't put the fire out—we're still using it."
          : kind === "shutter-shut"
            ? "Leave the shutters open, we need the daylight."
            : `Keep out of our ${o.name.toLowerCase()}.`;
  if (kind === "rummage") witness.trust = Math.max(-10, witness.trust - 1);
  host.say(witness.id, line);
  host.event(`${witness.name} glances over. "${line}"`);
}

/** Executes a specialised indoor prop act (radio, lights, fires, windows, wheels, beds, shrine, map, clock, books, drinks, cat). */
export function performRoomAct(
  host: RoomPropHost,
  o: WorldObject,
  act: PropAct,
  secondary = false,
): { text: string; seconds: number; water?: boolean; rest?: number; sound?: "switch" | "radio" | "fire" | "shutter" | "drink" | "cat" | "rest" | "bird"; openInstrument?: InstrumentId } {
  const room = host.interiorOf(o.pos.space);
  const kind = act.room!;
  if (kind === "radio") {
    if (secondary && o.open) {
      o.fired = host.clock;
      const slot = Math.floor(host.clock / 60) + (o.id.length * 7);
      return {
        text: `You nudge the tuning dial. ${radioBroadcast(host.setting, host.clock, host.seed, slot)}`,
        seconds: 60,
        rest: 2,
        sound: "radio",
      };
    }
    o.open = !o.open;
    o.fired = host.clock;
    if (!o.open) {
      reactRoomProp(host, o, "radio-off");
      return { text: "You click the radio dial off. The room settles into quiet.", seconds: 10, sound: "switch" };
    }
    const slot = Math.floor(host.clock / 120) + o.pos.x * 13 + o.pos.y;
    return {
      text: `You turn the radio on. The dial glows warm amber. ${radioBroadcast(host.setting, host.clock, host.seed, slot)}`,
      seconds: 60,
      rest: 2,
      sound: "radio",
    };
  }
  if (kind === "light") {
    o.open = !o.open;
    o.fired = host.clock;
    if (!o.open) reactRoomProp(host, o, "light-off");
    if (o.prop === "room-lamp" && isElectricLamp(o, room, host.year)) {
      return {
        text: o.open ? "You click the switch. Warm electric light fills the room." : "You switch off the lamp.",
        seconds: 10,
        sound: "switch",
      };
    }
    if (o.prop === "room-brazier") {
      return {
        text: o.open ? "You rake the charcoal and kindle the brazier until it glows warm." : "You bank the brazier down to grey ash.",
        seconds: 30,
        sound: "fire",
      };
    }
    if (o.prop === "room-tapers") {
      return {
        text: o.open ? "You touch flame to the tapers. Soft candlelight flickers across the walls." : "You pinch the tapers out; thin threads of wax smoke rise.",
        seconds: 20,
        sound: "fire",
      };
    }
    const label = o.prop === "room-lantern" ? "lantern" : "lamp";
    return {
      text: o.open ? `You light the ${label}. A steady warm glow spreads across the room.` : `You put out the ${label}.`,
      seconds: 20,
      sound: "fire",
    };
  }
  if (kind === "fire") {
    if (secondary && o.open) {
      return { text: `You hold your hands out to the ${o.name.toLowerCase()}. Warmth sinks into your bones.`, seconds: 90, rest: 5, sound: "fire" };
    }
    o.open = !o.open;
    o.fired = host.clock;
    if (!o.open) {
      reactRoomProp(host, o, "fire-off");
      return { text: `You rake ash over the coals and bank the ${o.name.toLowerCase()} down.`, seconds: 30, sound: "fire" };
    }
    return { text: `You lay kindling and coax the ${o.name.toLowerCase()} back into a warm blaze.`, seconds: 60, rest: 3, sound: "fire" };
  }
  if (kind === "window") {
    if (secondary || !hasShutters(room)) {
      return { text: windowView(host, room), seconds: 20 };
    }
    o.open = !o.open;
    o.fired = host.clock;
    if (!o.open) {
      reactRoomProp(host, o, "shutter-shut");
      return { text: "You pull the wooden shutters closed and drop the latch.", seconds: 15, sound: "shutter" };
    }
    return { text: `You throw the shutters open. ${windowView(host, room)}`, seconds: 15, sound: "shutter" };
  }
  if (kind === "wheel") {
    o.open = true;
    o.fired = host.clock;
    return {
      text: o.prop === "room-throw"
        ? "You kick the potter's wheel into a steady spin, feeling the flywheel catch its rhythm."
        : "You treadle the spinning wheel; the wooden rim whirs and twists a neat length of yarn.",
      seconds: 120,
    };
  }
  if (kind === "bed") {
    return { text: host.lieDown(o), seconds: 60, rest: 10, sound: "rest" };
  }
  if (kind === "shrine") {
    const wasLit = !!o.open;
    o.open = true;
    o.fired = host.clock;
    return { text: shrineLine(room, host.setting, wasLit), seconds: 120, rest: 4, sound: wasLit ? undefined : "fire" };
  }
  if (kind === "map") {
    return { text: mapLine(host), seconds: 60 };
  }
  if (kind === "clock") {
    return { text: `You glance at the clock. It shows ${formatClockTime(host.clock)}.`, seconds: 10 };
  }
  if (kind === "book" || kind === "desk") {
    return { text: bookReading(room, host.setting, host.clock, host.seed, kind === "desk"), seconds: kind === "desk" ? 120 : 180, rest: 3 };
  }
  if (kind === "drink") {
    return { text: drinkLine(o, room, host.setting), seconds: 45, water: true, rest: 2, sound: "drink" };
  }
  if (kind === "terrarium") {
    o.open = !o.open;
    o.fired = host.clock;
    return {
      text: o.open
        ? "You click the brass heat lamp on. Warm golden light floods the glass terrarium, and a small green frog creeps onto the stone to bask."
        : "You switch off the terrarium's heat lamp. The damp ferns settle into cool green shade.",
      seconds: 10,
      sound: "switch",
    };
  }
  if (kind === "birdcage") {
    o.open = true;
    o.fired = host.clock;
    return {
      text: "You whistle softly by the brass bars. The songbird hops along its perch, flutters its wings, and answers with a bright cascade of notes.",
      seconds: 15,
      rest: 2,
      sound: "bird",
    };
  }
  if (kind === "instrument") {
    const inst = instrumentForProp(o.prop) ?? "piano";
    o.open = true;
    o.fired = host.clock;
    return { text: "", seconds: 0, openInstrument: inst };
  }
  // cat
  const wasAwake = !!o.open;
  o.open = true;
  o.fired = host.clock;
  return {
    text: wasAwake
      ? "The cat leans into your hand, purring steadily, its tail flicking against the floor."
      : "You stroke the cat behind its ears. It stretches, blinks awake, and begins to purr.",
    seconds: 20,
    rest: 2,
    sound: "cat",
  };
}

function adjacentStand(host: RoomPropHost, o: WorldObject, actorId: string): Point | undefined {
  const [w, h] = o.size ?? [1, 1];
  const candidates: Point[] = [];
  for (let x = o.pos.x; x < o.pos.x + w; x++) candidates.push({ x, y: o.pos.y + h });
  for (let y = o.pos.y; y < o.pos.y + h; y++) candidates.push({ x: o.pos.x - 1, y }, { x: o.pos.x + w, y });
  for (let x = o.pos.x; x < o.pos.x + w; x++) candidates.push({ x, y: o.pos.y - 1 });
  return candidates.find((pt) => {
    const pos = { ...pt, space: o.pos.space };
    if (pt.x === host.playerPos.x && pt.y === host.playerPos.y && o.pos.space === host.playerPos.space) return false;
    return !host.blocked(pt.x, pt.y, o.pos.space) && !host.actorAt(pos, actorId);
  });
}

function faceToward(from: Point, to: Point): 0 | 1 | 2 | 3 {
  const dx = to.x - from.x, dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
}

/** Gentle autonomous room life: NPCs switch lamps at dusk/dawn, play radios, check iceboxes/books/shrines, and pet the cat. */
export function tickRoomProps(host: RoomPropHost, space: string, room: InteriorLayout, lastSlot: Map<string, number>) {
  const slot = Math.floor(host.clock / 120);
  if (lastSlot.get(space) === slot) return;
  lastSlot.set(space, slot);

  const props = host.objects.filter((o) => o.pos.space === space && o.prop && !o.carriedBy && !o.broken);
  if (!props.length) return;

  // Cats eventually curl back up for a nap (~20 min); spun craft wheels coast to a stop (~3 min); songbirds settle down.
  for (const o of props) {
    if ((o.prop === "room-cat" || o.prop === "room-birdcage") && o.open && host.clock - (o.fired ?? 0) >= 1200) o.open = false;
    if ((o.prop === "room-spinwheel" || o.prop === "room-throw") && o.open && host.clock - (o.fired ?? 0) >= 180) o.open = false;
  }

  const inRoom = host.actors.filter((a) => a.kind === "human" && !a.dead && !a.terror && a.pos.space === space);
  if (!inRoom.length) return;
  const awake = inRoom.filter((a) => !host.asleep(a, space, a.activity));
  const hour = ((host.clock / 3600) % 24 + 24) % 24;
  const rain = host.rain();
  const dark = hour < 6 || hour >= 18 || room.params.windows === 0;
  const brightDay = hour >= 7 && hour < 17 && room.params.windows > 0;
  const untouched = (o: WorldObject) => host.clock - (o.fired ?? -9999) >= 1800;

  // Bedtime: if everyone in the house is asleep, shut off unattended lamps, fires, shutters, and radios.
  if (!awake.length) {
    for (const o of props) {
      if ((LIGHT_PROPS.has(o.prop!) || FIRE_PROPS.has(o.prop!) || o.prop === "room-radio" || (o.prop === "room-window" && hasShutters(room))) && o.open && untouched(o)) {
        o.open = false;
        o.fired = host.clock;
      }
    }
    return;
  }

  // Where the household is in, it keeps its own lamps and fire, not its customers.
  const home = awake.filter((a) => host.livesIn(a, space));
  const freeActors = (home.length ? home : awake).filter((a) => !host.mindsCounter(a, space, a.activity.toLowerCase()));
  const helper = freeActors[0] ?? home[0] ?? awake[0];

  // Dusk / dawn lamp switching first, then hearth tending and storm/dusk shutters.
  for (const o of props) {
    if (!untouched(o) || !LIGHT_PROPS.has(o.prop!)) continue;
    if (dark && !o.open) {
      const spot = adjacentStand(host, o, helper.id);
      if (spot && freeActors.includes(helper)) {
        host.moveActor(helper, { ...spot, space });
        helper.direction = faceToward(spot, o.pos);
      }
      o.open = true;
      o.fired = host.clock;
      const electric = isElectricLamp(o, room, host.year);
      helper.activity = electric ? "Switching on the lamp" : "Lighting the lamp";
      host.event(electric ? `${helper.name} switches on the lamp.` : `${helper.name} lights the ${o.name.toLowerCase()}.`);
      return;
    }
    if (brightDay && o.open && o.prop !== "room-brazier") {
      o.open = false;
      o.fired = host.clock;
      const electric = isElectricLamp(o, room, host.year);
      host.event(electric ? `${helper.name} switches off the lamp.` : `${helper.name} puts out the ${o.name.toLowerCase()}.`);
      return;
    }
  }
  for (const o of props) {
    if (!untouched(o)) continue;
    if (FIRE_PROPS.has(o.prop!) && !o.open && ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 21))) {
      o.open = true;
      o.fired = host.clock;
      helper.activity = "Tending the fire";
      host.event(`${helper.name} kindles the ${o.name.toLowerCase()}.`);
      return;
    }
    if (o.prop === "room-window" && hasShutters(room)) {
      const wantShut = hour >= 19 || hour < 6 || rain >= 0.4;
      if (wantShut && o.open) {
        o.open = false;
        o.fired = host.clock;
        host.event(rain >= 0.4 ? `${helper.name} pulls the shutters tight against the rain.` : `${helper.name} closes the shutters for the evening.`);
        return;
      }
      if (!wantShut && !o.open && hour >= 6 && hour < 18 && rain < 0.35) {
        o.open = true;
        o.fired = host.clock;
        host.event(`${helper.name} throws the shutters open to the daylight.`);
        return;
      }
    }
  }

  // Every ~12 game minutes, an idle awake NPC interacts with an interesting prop in the room.
  if (slot % 6 !== 0 || !freeActors.length) return;
  const usable = props.filter((o) => NPC_PROPS.has(o.prop!));
  if (!usable.length) return;

  const actor = freeActors[Math.floor(random(host.seed, "room-npc", space, slot) * freeActors.length)];
  const target = usable[Math.floor(random(host.seed, "room-prop", space, slot) * usable.length)];
  const spot = adjacentStand(host, target, actor.id);
  if (spot) {
    host.moveActor(actor, { ...spot, space });
    actor.direction = faceToward(spot, target.pos);
  }

  if (target.prop === "room-radio") {
    if (!target.open && hour >= 7 && hour < 22 && untouched(target)) {
      target.open = true;
      target.fired = host.clock;
      actor.activity = "Listening to the radio";
      host.event(`${actor.name} turns on the radio. ${radioBroadcast(host.setting, host.clock, host.seed, slot)}`);
    } else if (target.open) {
      actor.activity = "Listening to the radio";
    }
  } else if (target.prop === "room-shrine") {
    target.open = true;
    target.fired = host.clock;
    actor.activity = "Praying at the shrine";
  } else if (target.prop === "room-scrolls" || target.prop === "room-desk") {
    actor.activity = target.prop === "room-desk" ? "Looking over papers" : "Reading";
  } else if (target.prop === "room-icebox") {
    actor.activity = "Checking the icebox";
  } else if (target.prop === "room-jars" || target.prop === "room-casks" || target.prop === "room-fountain" || target.prop === "room-basin") {
    actor.activity = "Getting a drink";
  } else if (target.prop === "room-map") {
    actor.activity = "Studying the map";
  } else if (target.prop === "room-clock") {
    actor.activity = "Checking the time";
  } else if (target.prop === "room-cat") {
    target.open = true;
    target.fired = host.clock;
    actor.activity = "Petting the cat";
  }
}
