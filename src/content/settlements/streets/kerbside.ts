import type { WorldSetting } from "../../geography/types";
import { modernity } from "../modernity";

/** The small things a street of this place and date had standing on it, as
 * sprites of the kerbside prop families. Absent, the place had none then.
 * Lists are choices: one is drawn each time. */
export type Kerbside = {
  hydrant?: string;
  postBox?: string;
  phone?: string;
  busStop?: string;
  shelter?: string;
  meter?: string;
  nameSign?: string;
  /** Things scattered along the kerb, with how often each turns up. */
  scatter: [sprite: string, weight: number][];
  /** A shop's board on the pavement by its door. */
  board?: string[];
  /** A house's own things: its box at the kerb, its bin, a hoop by the drive. */
  mailbox?: string[];
  bin?: string[];
  hoop?: string;
};

const at = (family: string, v: number) => `study-propb-${family}-${v}`;
const between = (year: number, from: number, to = Infinity) => year >= from && year < to;

export function kerbsideFor(s: WorldSetting): Kerbside {
  const id = modernity(s).id, y = s.year;
  const k: Kerbside = { scatter: [] };
  const add = (sprite: string, weight: number) => k.scatter.push([sprite, weight]);
  if (y < 1880) return k;
  const commonwealth = ["britain", "australasia", "southern-africa", "south-asia", "sub-saharan-africa"].includes(id);
  const continental = id === "western-europe" || id === "eastern-europe";
  // Germany's post office painted its telephone boxes yellow until the nineties.
  const german = id === "western-europe" && s.lon >= 6 && s.lon <= 15 && s.lat >= 47 && s.lat <= 55;
  // The Low Countries and Denmark, where the bicycle never left the street.
  const cycling = id === "western-europe" && s.lon >= 3 && s.lon <= 13 && s.lat >= 50.5 && s.lat <= 58;

  if (id === "north-america") k.hydrant = at("fire-hydrant", y >= 1960 && s.lon < -100 ? 1 : 0);
  else if (id === "latin-america" && y >= 1930) k.hydrant = at("fire-hydrant", 1);
  else if (id === "japan" && y >= 1950) k.hydrant = at("fire-hydrant", 3);
  // Britain's hydrants are under a plate in the pavement.
  else if (id !== "britain" && y >= (continental ? 1890 : 1950)) k.hydrant = at("fire-hydrant", 2);

  if (id === "north-america") k.postBox = at("post-box", y < 1955 ? 1 : 0);
  else if (id === "japan" && y >= 1901) k.postBox = at("post-box", 3);
  else if (id === "east-asia" && y >= 1950) k.postBox = at("post-box", 5);
  else if (commonwealth || id === "southeast-asia") k.postBox = at("post-box", 2);
  else if (id !== "eastern-europe" && y >= 1900) k.postBox = at("post-box", 4);

  if (id === "britain" && y >= 1926) k.phone = at("phone-box", 0);
  else if (id === "north-america" && between(y, 1950, 2010)) k.phone = at("phone-box", y < 1975 ? 1 : 3);
  else if (id === "japan" && between(y, 1955, 2015)) k.phone = at("phone-box", 2);
  else if (german && between(y, 1950, 1996)) k.phone = at("phone-box", 4);
  else if (continental && between(y, 1950, 2010)) k.phone = at("phone-box", 1);
  else if (between(y, 1975, 2012)) k.phone = at("phone-box", 3);

  if (y >= 1930) k.busStop = at("bus-stop", id === "north-america" || id === "latin-america" ? 0 : id === "japan" || id === "east-asia" ? 2 : 1);
  if (y >= 1975) k.shelter = at("bus-stop", 3);

  if (id === "north-america" && y >= 1935) k.meter = at("parking-meter", y >= 2005 ? 2 : y >= 1960 ? 1 : 0);
  else if (id === "britain" && y >= 1958) k.meter = at("parking-meter", y >= 1995 ? 2 : 0);
  else if ((continental || id === "japan" || id === "australasia") && y >= 1985) k.meter = at("parking-meter", 2);

  if (y >= 1920)
    k.nameSign = at("street-sign", id === "north-america" || id === "latin-america" ? 0 : id === "japan" ? 2 : commonwealth ? 3 : 1);

  if (y >= 1920) k.board = y >= 1960 ? [at("pavement-board", 0), at("pavement-board", 1), at("pavement-board", 2)] : [at("pavement-board", 0)];

  if (id === "north-america" && between(y, 1955, 2015)) for (const v of [0, 1, 2, 3]) add(at("news-box", v), 1.5);
  if ((id === "japan" && y >= 1965) || ((id === "east-asia" || id === "southeast-asia") && y >= 1995))
    for (const v of [0, 1, 2, 3]) add(at("vending-machine", v), id === "japan" ? 3 : 1);
  // The bicycles themselves are parked by the town plan; the street only gives them somewhere to stand.
  if ((cycling && y >= 1930) || ((id === "east-asia" || id === "japan") && y >= 1960) || (continental && y >= 1975) || (id === "north-america" && y >= 1990))
    add(at("bike-rack", y >= 1990 ? 0 : 1), cycling || id === "east-asia" || id === "japan" ? 4 : 1.5);
  if (y >= 1950) add(at("utility-cabinet", id === "north-america" || id === "latin-america" ? 1 : continental || id === "britain" ? 2 : 1), 1.5);
  if (id === "north-america" && y >= 1970) add(at("kerb-rubbish", 0), 1);
  else if (id === "japan" && y >= 1970) add(at("kerb-rubbish", 1), 2);
  else if (y >= 1950) add(at("kerb-rubbish", 2), 0.8);
  add(at("street-bin", y >= 1960 ? 2 : 0), 2);

  // Dates after 2026 are projection.
  const asia = id === "east-asia" || id === "southeast-asia" || id === "south-asia";
  if (id === "east-asia" && y >= 2018) add(at("charging-post", 1), 2);
  else if (["north-america", "britain", "western-europe", "australasia", "japan"].includes(id) && y >= 2020) add(at("charging-post", 0), y >= 2032 ? 3 : 1);
  else if (y >= 2034) add(at("charging-post", 0), 1);
  if ((asia && y >= 2022) || (id === "sub-saharan-africa" && y >= 2026)) add(at("charging-post", 2), 1);
  if (id === "east-asia" && y >= 2016) add(at("parcel-locker", 1), 1.5);
  else if ((continental || id === "britain") && y >= 2018) add(at("parcel-locker", 0), 1);
  else if (y >= 2035) add(at("parcel-locker", s.lon > 60 ? 1 : 0), 1);
  if ((id === "east-asia" || id === "japan") && y >= 2028) add(at("delivery-robot", 1), 1);
  else if (["north-america", "britain", "western-europe"].includes(id) && y >= 2030) add(at("delivery-robot", 0), 1);

  if (id === "north-america" && y >= 1920) {
    k.mailbox = [at("kerb-mailbox", 0), at("kerb-mailbox", 1), at("kerb-mailbox", 2)];
    if (y >= 1960) k.hoop = at("driveway-hoop", 0);
  }
  if (["north-america", "britain", "western-europe", "australasia"].includes(id) && y >= (id === "north-america" ? 1990 : 1985))
    k.bin = [at("wheelie-bin", 0), at("wheelie-bin", 1), at("wheelie-bin", 2), at("wheelie-bin", 3)];
  else if (y >= 1900) k.bin = [at("dustbin", 0)];
  return k;
}
