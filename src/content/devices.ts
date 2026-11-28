import { random } from "../core/random";
import { en, type DeviceText } from "./device-text";

/** The pocket electronics a person might carry, as the item ids in carried.ts. */
export const deviceItems = ["phone", "pager", "pocket-radio", "cassette-player", "game-handheld"] as const;
export type DeviceItem = (typeof deviceItems)[number];
export type DeviceApp = "call" | "messages" | "news" | "weather" | "clock" | "map" | "money" | "tones" | "assistant" | "worm" | "catch" | "runner" | "radio" | "tape";
/** The body the screen is drawn in. */
export type DeviceShell = "brick" | "bar" | "flip" | "slab" | "pager" | "radio" | "tape" | "lcd" | "handheld";

/** One model of a device: what it was called, what it could do, and from when.
 * The fields a period look needs are here too, so wares.ts names and draws the item from the same row. */
export type DeviceModel = {
  item: DeviceItem;
  from: number;
  cultures?: readonly string[];
  art: string;
  name: string;
  description: string;
  shell: DeviceShell;
  apps: readonly DeviceApp[];
  /** How messages arrive: digits only, short text, or mail with pictures. */
  text?: "digits" | "short" | "mail";
  /** A colour screen; the rest are grey-green liquid crystal. */
  colour?: boolean;
};

const EAST_ASIA = ["east-asian"] as const;
/** Where the handset came late and cheap, and did more than talk: radio, a torch, and money. */
const LEAPFROG = ["west-central-african", "east-southern-african", "south-asian", "southeast-asian"] as const;
const AFRICA = ["west-central-african", "east-southern-african"] as const;

/** In date order within an item; among the models that fit a date and place, the last one wins. */
export const deviceModels: readonly DeviceModel[] = [
  { item: "phone", from: 1984, art: "phone-brick", name: "Cellular phone", shell: "brick", apps: ["call"],
    description: "A hand-held cellular telephone the size of a brick, with a rubber aerial and half an hour of talk in the battery. It costs as much as a small car." },
  { item: "phone", from: 1994, art: "phone-bar", name: "Mobile phone", shell: "bar", apps: ["call", "messages", "clock"], text: "short",
    description: "A plastic handset with a stub aerial and a two-line screen. It makes calls and holds short text messages of 160 characters." },
  { item: "phone", from: 1998, art: "phone-bar", name: "Mobile phone", shell: "bar", apps: ["call", "messages", "worm", "tones", "clock"], text: "short",
    description: "A pocket handset with a green-lit screen, a week of battery, changeable covers and a game about a worm." },
  // Japanese handsets had mail, a camera and the mobile web years before anyone else's.
  { item: "phone", from: 1999, cultures: EAST_ASIA, art: "phone-flip", name: "Clamshell phone", shell: "flip", colour: true, text: "mail",
    apps: ["call", "messages", "news", "weather", "tones", "clock"],
    description: "A folding handset with a colour screen, a strap of charms, picture mail and a menu of news, weather and train times." },
  { item: "phone", from: 2003, art: "phone-flip", name: "Flip phone", shell: "flip", colour: true, text: "short",
    apps: ["call", "messages", "worm", "tones", "clock"],
    description: "A folding handset with a small colour screen inside and a clock on the outside. It snaps shut to end a call." },
  { item: "phone", from: 2003, cultures: EAST_ASIA, art: "phone-flip", name: "Clamshell phone", shell: "flip", colour: true, text: "mail",
    apps: ["call", "messages", "news", "weather", "money", "tones", "clock"],
    description: "A folding handset with a camera, picture mail, the mobile web and a chip that pays at the station gate." },
  // The one-week battery, the torch and the FM radio kept these in pockets long after touchscreens arrived.
  { item: "phone", from: 2003, cultures: LEAPFROG, art: "phone-bar", name: "Mobile phone", shell: "bar", text: "short",
    apps: ["call", "messages", "radio", "worm", "clock"],
    description: "A tough little handset with a torch, an FM radio and a battery that lasts the week. Airtime is bought in scratch cards." },
  // M-Pesa launched in Kenya in 2007; mobile money spread across the continent from there.
  { item: "phone", from: 2007, cultures: AFRICA, art: "phone-bar", name: "Mobile phone", shell: "bar", text: "short",
    apps: ["call", "messages", "money", "radio", "worm", "clock"],
    description: "A tough little handset with a torch and an FM radio. Money is sent, received and kept on it through the network's menu." },
  { item: "phone", from: 2009, art: "smartphone", name: "Smartphone", shell: "slab", colour: true, text: "mail",
    apps: ["call", "messages", "news", "weather", "map", "clock"],
    description: "A slab of glass with a touchscreen: a telephone, a camera, a map and the news in one, and flat by evening." },
  { item: "phone", from: 2009, cultures: LEAPFROG, art: "phone-bar", name: "Mobile phone", shell: "bar", text: "short",
    apps: ["call", "messages", "money", "radio", "worm", "clock"],
    description: "A tough little handset with a torch and an FM radio. Money is sent, received and kept on it through the network's menu." },
  // One app for talk, payment and everything else: WeChat and Alipay in China from about 2013.
  { item: "phone", from: 2013, cultures: EAST_ASIA, art: "smartphone", name: "Smartphone", shell: "slab", colour: true, text: "mail",
    apps: ["call", "messages", "money", "news", "weather", "map", "clock"],
    description: "A slab of glass with a touchscreen. One app carries the talk, the payments and most of daily business, by scanning a square code." },
  { item: "phone", from: 2015, art: "smartphone", name: "Smartphone", shell: "slab", colour: true, text: "mail",
    apps: ["call", "messages", "news", "weather", "map", "money", "clock"],
    description: "A slab of glass with a touchscreen: telephone, camera, map, wallet and the news, checked a hundred times a day." },
  { item: "phone", from: 2035, art: "smartphone", name: "Phone", shell: "slab", colour: true, text: "mail",
    apps: ["assistant", "call", "messages", "news", "weather", "map", "money", "clock"],
    description: "A thin slab that mostly listens. An assistant reads out the day and answers for you; the screen is for when you want to check its work." },

  { item: "pager", from: 1980, art: "pager", name: "Pager", shell: "pager", apps: ["messages"], text: "digits",
    description: "A belt-clip receiver that beeps and shows a telephone number to ring back. Friends use number codes to say more." },
  { item: "pager", from: 1995, art: "pager", name: "Text pager", shell: "pager", apps: ["messages"], text: "short",
    description: "A belt-clip receiver with a line of text: a short message, the caller's name and the time." },

  { item: "pocket-radio", from: 1957, art: "pocket-radio", name: "Transistor radio", shell: "radio", apps: ["radio"],
    description: "A pocket radio set on a few transistors and a small battery, with a wrist strap, an earpiece and a dial that drifts." },

  { item: "cassette-player", from: 1979, art: "cassette-player", name: "Personal cassette player", shell: "tape", apps: ["tape"],
    description: "A cassette player small enough for a belt, with foam headphones. It plays one tape, one side at a time, and eats batteries." },
  { item: "cassette-player", from: 1986, art: "cassette-player", name: "Personal stereo", shell: "tape", apps: ["tape", "radio"],
    description: "A cassette player with a radio tuner, a belt clip and foam headphones." },
  { item: "cassette-player", from: 2002, art: "cassette-player", name: "Music player", shell: "tape", apps: ["tape"], colour: true,
    description: "A pocket player holding a thousand songs as files, with white earphones and a wheel to scroll through them." },

  { item: "game-handheld", from: 1980, art: "lcd-game", name: "Pocket game", shell: "lcd", apps: ["catch", "clock"],
    description: "A pocket game with one game on it: black figures that blink on and off across a grey screen. It is also a clock." },
  { item: "game-handheld", from: 1989, art: "game-handheld", name: "Handheld game console", shell: "handheld", apps: ["runner", "catch"],
    description: "A grey handheld with a green dot-matrix screen, a cross pad and two buttons. Games come on cartridges; four batteries last a long journey." },
];

export const isDevice = (id: string): id is DeviceItem => (deviceItems as readonly string[]).includes(id);

export function deviceModel(item: string, year: number, culture?: string): DeviceModel | undefined {
  return deviceModels.filter((m) => m.item === item && year >= m.from && (!m.cultures || m.cultures.includes(culture ?? ""))).at(-1);
}

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

/** Number codes typed into a telephone keypad to say something on a digits-only pager; the text files say what each means. */
const pagerCodes: { cultures?: readonly string[]; code: string }[] = [
  ...["143", "911", "07734", "121", "1134 2 09", "411"].map((code) => ({ code })),
  // Goroawase, Japanese digits read by their sounds; and Mandarin number homophones (520, 88).
  ...["0840", "724106", "14106", "49", "3341", "0906", "520", "88"].map((code) => ({ code, cultures: EAST_ASIA })),
];

/** What one stop on a pocket radio's dial is playing; every third stop is between stations. */
export function radioStation(w: { seed: string; year: number; place: string; clock: number }, stop: number, t: DeviceText = en): string {
  if (stop % 3 === 2) return t.radio.static;
  const hour = (((w.clock / 3600) % 24) + 24) % 24;
  const part = t.radio.parts[hour < 11 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night"];
  const lines = w.year < 1975 ? t.radio.early : w.year < 2005 ? t.radio.middle : t.radio.late;
  return fill(lines[Math.floor(random(w.seed, "radio-station", stop, Math.floor(w.clock / 1800)) * lines.length)], { part, place: w.place });
}

export type DeviceMessage = { from: string; text: string; note?: string };
export type DeviceWorld = {
  seed: string;
  day: number;
  year: number;
  culture?: string;
  place: string;
  /** First names of the people who would get in touch: household and friends. */
  people: readonly string[];
  /** What the player has been asked to do. */
  asks: readonly { from: string; what: string }[];
  news: readonly string[];
  balance?: string;
};

const digits = (seed: string, ...keys: (string | number)[]) =>
  `555-${String(1000 + Math.floor(random(seed, "device-number", ...keys) * 9000)).slice(1).padStart(4, "0")}`;

/** What is waiting on the device today. The same day always shows the same messages. */
export function deviceMessages(model: DeviceModel, w: DeviceWorld, t: DeviceText = en): DeviceMessage[] {
  const roll = (...keys: (string | number)[]) => random(w.seed, "device", w.day, ...keys);
  const pick = <T>(list: readonly T[], ...keys: (string | number)[]) => list[Math.floor(roll(...keys) * list.length)];
  const m = t.messages;
  const out: DeviceMessage[] = [];
  if (model.text === "digits") {
    const codes = pagerCodes.filter((c) => !c.cultures || c.cultures.includes(w.culture ?? ""));
    for (const [i, name] of w.people.slice(0, 3).entries()) {
      const code = roll("code", i) < 0.6 ? pick(codes, "which", i).code : undefined;
      out.push({ from: "", text: code ? `${digits(w.seed, name)} ${code}` : digits(w.seed, name), note: code ? `${name}: ${t.codes[code] ?? en.codes[code]}` : fill(m.pageNumber, { name }) });
    }
    for (const ask of w.asks.slice(0, 2)) out.push({ from: "", text: `${digits(w.seed, ask.from)} 911`, note: fill(m.pageAsk, { name: ask.from, what: ask.what }) });
    if (!out.length) out.push({ from: "", text: digits(w.seed, "wrong"), note: m.pageWrong });
    return out;
  }
  const short = model.text === "short";
  for (const ask of w.asks.slice(0, 2)) out.push({ from: ask.from, text: fill(short ? m.askShort : m.askLong, { what: ask.what }) });
  for (const [i, name] of w.people.slice(0, 3).entries()) if (roll("chat", i) < 0.7) out.push({ from: name, text: pick(short ? m.chatShort : m.chatLong, "line", i) });
  if (model.apps.includes("money") && w.balance) out.push({ from: model.shell === "slab" ? t.senders.wallet : t.senders.mobileMoney, text: fill(m.money, { balance: w.balance }) });
  if (model.text === "mail" && w.news[0] && roll("alert") < 0.6) out.push({ from: t.senders.newsAlert, text: w.news[0] });
  const service = w.year < 2004 ? m.serviceEarly : w.year < 2035 ? m.serviceLater : m.serviceFuture;
  if (roll("service") < 0.5 || !out.length) out.push({ from: w.year < 2004 ? t.senders.network : t.senders.unknown, text: fill(pick(service, "which"), { place: w.place }) });
  return out;
}
