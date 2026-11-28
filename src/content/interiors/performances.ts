import type { CueKind } from "../../core/combat";
import type { InteriorSite } from "./select";
import { HISTORICAL_PLAYS } from "./repertoire-plays";
import { HISTORICAL_FILMS } from "./repertoire-films";

export type StagePos = "wing-l" | "left" | "center" | "right" | "wing-r";

export type PlayBeat = {
  speaker: number;
  pos: StagePos;
  partner?: { who: number; pos: StagePos };
  face?: "audience" | "partner";
  cue?: CueKind;
  line: string;
  stageDir?: string;
};

export type PlayScript = {
  id: string;
  title: string;
  creator?: string;
  basis: "documented" | "fiction";
  genre: string;
  venues: string[];
  years?: [number, number];
  bounds?: [number, number, number, number];
  cast: string[];
  beats: PlayBeat[];
};

export type FilmVisual =
  | "title-card"
  | "train-chase"
  | "moon-rocket"
  | "star-voyage"
  | "space-battle"
  | "alien-horizon"
  | "noir-rain"
  | "harbor-pier"
  | "western-ridge"
  | "canyon-standoff"
  | "palace-dance"
  | "samurai-bridge"
  | "bamboo-duel"
  | "cafe-street"
  | "factory-montage"
  | "neon-chase"
  | "neon-alley"
  | "galleon-sea"
  | "jungle-temple"
  | "rooftop-duel"
  | "lantern-festival"
  | "nile-dusk"
  | "clock-tower"
  | "metropolis-tower"
  | "nosferatu-shadow"
  | "odessa-steps"
  | "airfield-fog"
  | "kaiju-harbor"
  | "kash-train"
  | "chinampa-boats"
  | "dino-lagoon"
  | "zigzag-hill";

export type FilmScene = {
  visual: FilmVisual;
  /** Auditorium screen-glow color for this scene. */
  glow: number;
  /** Intertitle, dialogue line, or Benshi narration. */
  caption: string;
  /** [sky/bg, mid, accent, highlight] custom tint for the scene painter. */
  palette: [number, number, number, number];
};

export type FilmScript = {
  id: string;
  title: string;
  creator?: string;
  basis: "documented" | "fiction";
  genre: string;
  era: "silent" | "classic" | "modern";
  years: [number, number];
  /** [minLon, minLat, maxLon, maxLat] for regional preference. */
  bounds?: [number, number, number, number];
  silent?: boolean;
  benshi?: boolean;
  scenes: FilmScene[];
};

export const PLAYS: readonly PlayScript[] = HISTORICAL_PLAYS;
export const FILMS: readonly FilmScript[] = HISTORICAL_FILMS;

const BY_ID = new Map(FILMS.map((f) => [f.id, f]));
const PLAY_BY_ID = new Map(PLAYS.map((p) => [p.id, p]));

export function filmById(id: string | undefined): FilmScript | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function playById(id: string | undefined): PlayScript | undefined {
  return id ? PLAY_BY_ID.get(id) : undefined;
}

export function billingOf(work: { genre: string; creator?: string; basis: "documented" | "fiction" }): string {
  return work.basis === "documented" && work.creator ? `${work.genre} · ${work.creator}` : work.genre;
}

const inBounds = (b: [number, number, number, number], lon: number, lat: number) =>
  lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];

/** Picks a play or opera fitting the venue profile, region, and historical year. */
export function playFor(
  profileId: string,
  seed: number,
  site?: Pick<InteriorSite, "lon" | "lat" | "year">,
): PlayScript | undefined {
  const venueList = PLAYS.filter((p) => p.venues.includes(profileId));
  if (!venueList.length) return undefined;
  if (site) {
    const inEra = venueList.filter((p) => !p.years || (site.year >= p.years[0] && site.year <= p.years[1]));
    const dated = inEra.length ? inEra : venueList;
    const localDoc = dated.filter((p) => p.basis === "documented" && p.bounds && inBounds(p.bounds, site.lon, site.lat));
    if (localDoc.length) return localDoc[Math.abs(seed) % localDoc.length];
    const local = dated.filter((p) => p.bounds && inBounds(p.bounds, site.lon, site.lat));
    if (local.length) return local[Math.abs(seed) % local.length];
    const global = dated.filter((p) => !p.bounds);
    const pool = global.length ? global : dated;
    return pool[Math.abs(seed) % pool.length];
  }
  return venueList[Math.abs(seed) % venueList.length];
}

/** Picks a historically and regionally fitting film for a cinema screening room, keeping variety across multiplex screens. */
export function filmFor(site: Pick<InteriorSite, "lon" | "lat" | "year">, seed: number, exclude: Set<string> = new Set()): FilmScript {
  const era: FilmScript["era"] = site.year < 1925 ? "silent" : site.year < 1966 ? "classic" : "modern";
  const inEra = FILMS.filter((f) => !exclude.has(f.id) && site.year >= f.years[0] && site.year <= f.years[1]);
  const pool = inEra.length ? inEra : FILMS.filter((f) => !exclude.has(f.id) && f.era === era);
  const avail = pool.length ? pool : FILMS;
  const regional = avail.filter((f) => f.bounds && inBounds(f.bounds, site.lon, site.lat));
  // Lead screen showcases local/national cinema; additional multiplex screens mix local & international hits.
  if (regional.length && (exclude.size === 0 || Math.abs(seed) % 3 === 0)) {
    return regional[Math.abs(seed) % regional.length];
  }
  const sameEraGlobal = avail.filter((f) => f.era === era && !f.bounds);
  if (sameEraGlobal.length) return sameEraGlobal[Math.abs(seed) % sameEraGlobal.length];
  const sameEra = avail.filter((f) => f.era === era);
  const pickFrom = sameEra.length ? sameEra : avail;
  return pickFrom[Math.abs(seed) % pickFrom.length];
}

export function defaultFilmForStyle(style: string, seed: number): FilmScript {
  const era: FilmScript["era"] =
    style === "stage-cinema-silent" ? "silent" : style === "stage-cinema" ? "classic" : "modern";
  const list = FILMS.filter((f) => f.era === era);
  return list[Math.abs(seed) % list.length] ?? FILMS[0];
}

export type TheatreStartMode = "seat" | "stage" | "foyer";

export type TheatreStartRule = {
  id: string;
  match: RegExp;
  venue:
    | "nickelodeon"
    | "cinema"
    | "multiplex"
    | "opera-house"
    | "broadway-theatre"
    | "proscenium-playhouse"
    | "elizabethan-playhouse"
    | "noh-theatre"
    | "kabuki-theatre"
    | "auto-cinema"
    | "auto-theatre";
  mode: TheatreStartMode;
  role: string;
  work?: string;
  film?: string;
  play?: string;
  defaults: readonly (readonly [string, number])[];
};

/** Expansive prompt rules for starting inside cinemas, opera houses, Broadway/West End theatres, playhouses, and world stages. */
export const THEATRE_STARTS: readonly TheatreStartRule[] = [
  // Backstage, stage & front-of-house venue roles
  {
    id: "role-film-critic",
    match: /\b(?:film|movie|cinema)\s+critic\b/i,
    venue: "auto-cinema",
    mode: "seat",
    role: "Film Critic",
    work: "critic",
    defaults: [["city-new-york", 1954], ["paris", 1962], ["city-los-angeles", 1984]],
  },
  {
    id: "role-opera-critic",
    match: /\bopera\s+critic\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Opera Critic",
    work: "critic",
    defaults: [["city-vienna", 1888], ["city-milan", 1875], ["paris", 1892]],
  },
  {
    id: "role-theatre-critic",
    match: /\b(?:theatre|theater|drama)\s+critic\b/i,
    venue: "auto-theatre",
    mode: "seat",
    role: "Drama Critic",
    work: "critic",
    defaults: [["city-new-york", 1949], ["london", 1895], ["paris", 1860]],
  },
  {
    id: "role-benshi",
    match: /\bbenshi\b/i,
    venue: "nickelodeon",
    mode: "stage",
    role: "Benshi",
    work: "benshi",
    film: "silent-asakusa",
    defaults: [["city-tokyo", 1922]],
  },
  {
    id: "role-opera-singer",
    match: /\b(?:opera\s+singer|soprano|prima\s+donna|opera\s+diva|tenor)\b/i,
    venue: "opera-house",
    mode: "stage",
    role: "Opera Singer",
    work: "opera-singer",
    defaults: [["city-vienna", 1890], ["city-milan", 1872], ["paris", 1885]],
  },
  {
    id: "role-ballerina",
    match: /\b(?:ballerina|ballet\s+dancer)\b/i,
    venue: "opera-house",
    mode: "stage",
    role: "Ballerina",
    work: "ballerina",
    defaults: [["paris", 1882], ["city-moscow", 1895], ["city-vienna", 1890]],
  },
  {
    id: "role-conductor",
    match: /\b(?:orchestra\s+conductor|opera\s+conductor|conductor|maestro)\b/i,
    venue: "opera-house",
    mode: "stage",
    role: "Conductor",
    work: "conductor",
    defaults: [["city-vienna", 1885], ["city-milan", 1880], ["city-new-york", 1925]],
  },
  {
    id: "role-kabuki-actor",
    match: /\bkabuki\s+actor\b/i,
    venue: "kabuki-theatre",
    mode: "stage",
    role: "Kabuki Actor",
    work: "actor",
    defaults: [["city-tokyo", 1810], ["kyoto", 1785]],
  },
  {
    id: "role-noh-actor",
    match: /\bnoh\s+actor\b/i,
    venue: "noh-theatre",
    mode: "stage",
    role: "Noh Actor",
    work: "actor",
    defaults: [["kyoto", 1680]],
  },
  {
    id: "role-stage-actor",
    match: /\b(?:broadway|stage|theatre|theater|playhouse)\s+(?:actor|actress|star|player)\b/i,
    venue: "auto-theatre",
    mode: "stage",
    role: "Stage Actor",
    work: "actor",
    defaults: [["city-new-york", 1949], ["london", 1895], ["london", 1604]],
  },
  {
    id: "role-director",
    match: /\b(?:theatre|theater|stage|broadway)\s+director\b/i,
    venue: "broadway-theatre",
    mode: "stage",
    role: "Stage Director",
    work: "theatre-director",
    defaults: [["city-new-york", 1949], ["london", 1932]],
  },
  {
    id: "role-projectionist",
    match: /\b(?:film\s+)?projectionist\b/i,
    venue: "auto-cinema",
    mode: "foyer",
    role: "Projectionist",
    work: "projectionist",
    defaults: [["city-los-angeles", 1948], ["city-orlando", 1987], ["city-new-york", 1921]],
  },
  {
    id: "role-concessions",
    match: /\b(?:concessions?\s+(?:seller|worker|clerk|attendant)|popcorn\s+seller)\b/i,
    venue: "auto-cinema",
    mode: "foyer",
    role: "Concession Seller",
    work: "concession-seller",
    defaults: [["city-orlando", 1987], ["city-chicago", 1952], ["city-los-angeles", 1984]],
  },
  {
    id: "role-usher",
    match: /\b(?:(?:movie\s+theat(?:er|re)|cinema|opera|theat(?:er|re))\s+)?usher\b/i,
    venue: "auto-cinema",
    mode: "foyer",
    role: "Usher",
    work: "usher",
    defaults: [["city-new-york", 1942], ["city-orlando", 1987], ["london", 1935]],
  },
  {
    id: "role-ticket-taker",
    match: /\b(?:ticket\s+taker|box[- ]office\s+clerk)\b/i,
    venue: "auto-cinema",
    mode: "foyer",
    role: "Ticket Taker",
    work: "ticket-taker",
    defaults: [["city-new-york", 1938], ["city-chicago", 1920], ["city-orlando", 1987]],
  },
  {
    id: "role-impresario",
    match: /\b(?:impresario|(?:opera\s+house|theat(?:er|re)|cinema)\s+(?:owner|manager))\b/i,
    venue: "opera-house",
    mode: "foyer",
    role: "Impresario",
    work: "theatre-owner",
    defaults: [["city-vienna", 1878], ["paris", 1890], ["city-new-york", 1930]],
  },
  {
    id: "role-stagehand",
    match: /\b(?:stagehand|stage\s+manager|prompter)\b/i,
    venue: "broadway-theatre",
    mode: "foyer",
    role: "Stagehand",
    work: "stagehand",
    defaults: [["city-new-york", 1935], ["london", 1892]],
  },

  // Specific iconic films & world cinema traditions
  {
    id: "film-metropolis",
    match: /\bmetropolis\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "silent-metropolis",
    defaults: [["city-berlin", 1927]],
  },
  {
    id: "film-nosferatu",
    match: /\b(?:nosferatu|german\s+expressionist)\b/i,
    venue: "nickelodeon",
    mode: "seat",
    role: "Moviegoer",
    film: "silent-nosferatu",
    defaults: [["city-berlin", 1922]],
  },
  {
    id: "film-safety-last",
    match: /\b(?:safety\s+last|harold\s+lloyd|silent\s+comedy|slapstick)\b/i,
    venue: "nickelodeon",
    mode: "seat",
    role: "Moviegoer",
    film: "silent-safety-last",
    defaults: [["city-los-angeles", 1923], ["city-new-york", 1923]],
  },
  {
    id: "film-casablanca",
    match: /\bcasablanca\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-casablanca",
    defaults: [["city-new-york", 1943], ["city-los-angeles", 1943]],
  },
  {
    id: "film-godzilla",
    match: /\b(?:godzilla|gojira|kaiju(?:\s+(?:movie|film))?)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-godzilla",
    defaults: [["city-tokyo", 1954]],
  },
  {
    id: "film-pather-panchali",
    match: /\b(?:pather\s+panchali|satyajit\s+ray|bengali\s+(?:film|cinema))\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Filmgoer",
    film: "classic-pather-panchali",
    defaults: [["city-kolkata", 1956]],
  },
  {
    id: "film-bicycle-thieves",
    match: /\b(?:bicycle\s+thieves|italian\s+neorealism|neorealist\s+film)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Filmgoer",
    film: "classic-bicycle-thieves",
    defaults: [["rome", 1949], ["city-milan", 1949]],
  },
  {
    id: "film-maria-candelaria",
    match: /\b(?:mar[ií]a\s+candelaria|mexican\s+(?:golden\s+age|cinema|film))\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-maria-candelaria",
    defaults: [["city-mexico-city", 1944]],
  },
  {
    id: "film-akira",
    match: /\b(?:akira|anime\s+(?:movie|film)|cyberpunk\s+anime)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-akira",
    defaults: [["city-tokyo", 1988]],
  },
  {
    id: "film-kiarostami",
    match: /\b(?:kiarostami|iranian\s+(?:film|cinema|new\s+wave)|friend'?s\s+house)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Filmgoer",
    film: "modern-kiarostami",
    defaults: [["city-tehran", 1988]],
  },
  {
    id: "film-sholay",
    match: /\bsholay\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-sholay",
    defaults: [["city-mumbai", 1975]],
  },
  {
    id: "film-dino",
    match: /\b(?:dinosaur\s+(?:movie|film)|jurassic|thunder\s+lizards)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-dino",
    defaults: [["city-orlando", 1993], ["city-los-angeles", 1993]],
  },
  {
    id: "film-scifi",
    match: /\b(?:sci[- ]?fi|science\s+fiction|space\s+opera)\s+(?:movie|film|flick|show)|starship\s+hyperion\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-scifi",
    defaults: [["city-los-angeles", 1980], ["city-orlando", 1987], ["city-new-york", 1983]],
  },
  {
    id: "film-neon",
    match: /\b(?:(?:80s|1980s|neon|synthwave|action)\s+(?:movie|film|thriller)|neon\s+precinct)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-neon",
    defaults: [["city-los-angeles", 1986], ["city-orlando", 1987], ["city-chicago", 1985]],
  },
  {
    id: "film-adventure",
    match: /\b(?:(?:adventure|pirate|swashbuckl\w+)\s+(?:movie|film)|emerald\s+galleon)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-adventure",
    defaults: [["city-orlando", 1987], ["city-new-york", 1984], ["london", 1986]],
  },
  {
    id: "film-kungfu",
    match: /\b(?:(?:kung\s*fu|martial\s+arts|hong\s+kong\s+action)\s+(?:movie|film)?|dragon\s+of\s+kowloon)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    film: "modern-kungfu",
    defaults: [["city-hong-kong", 1978], ["city-hong-kong", 1986], ["city-san-francisco", 1982]],
  },
  {
    id: "film-noir",
    match: /\b(?:film\s+noir|noir\s+(?:movie|film)|detective\s+(?:movie|film)|maltese\s+falcon)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-noir",
    defaults: [["city-san-francisco", 1942], ["city-los-angeles", 1948], ["city-new-york", 1946]],
  },
  {
    id: "film-western",
    match: /\b(?:(?:technicolor\s+)?western\s+(?:movie|film)|cowboy\s+movie|the\s+searchers)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-western",
    defaults: [["city-los-angeles", 1956], ["city-chicago", 1956], ["city-new-york", 1957]],
  },
  {
    id: "film-bollywood",
    match: /\b(?:bollywood(?:\s+(?:movie|film|musical))?|indian\s+musical|hindi\s+(?:movie|film)|mughal[- ]e[- ]azam)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-monsoon",
    defaults: [["city-mumbai", 1960], ["city-mumbai", 1962]],
  },
  {
    id: "film-samurai",
    match: /\b(?:samurai\s+(?:movie|film|cinema)|kurosawa|seven\s+samurai|jidaigeki)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-samurai",
    defaults: [["city-tokyo", 1954], ["kyoto", 1956]],
  },
  {
    id: "film-newwave",
    match: /\b(?:french\s+new\s+wave|new\s+wave\s+(?:movie|film)|nouvelle\s+vague|art[- ]?house\s+(?:movie|film|cinema)|breathless|godard)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Filmgoer",
    film: "classic-newwave",
    defaults: [["paris", 1960], ["paris", 1962]],
  },
  {
    id: "film-montage",
    match: /\b(?:soviet\s+(?:film|montage|cinema)|battleship\s+potemkin|potemkin|eisenstein)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "silent-potemkin",
    defaults: [["city-moscow", 1926], ["city-moscow", 1930]],
  },
  {
    id: "film-nile",
    match: /\b(?:egyptian\s+(?:movie|film|cinema)|cairo\s+(?:cinema|station)|chahine)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    film: "classic-nile",
    defaults: [["cairo", 1958], ["cairo", 1960]],
  },
  {
    id: "film-melies",
    match: /\b(?:m[eé]li[eè]s|trip\s+to\s+the\s+moon|voyage\s+dans\s+la\s+lune|silent\s+(?:fantasy|sci[- ]?fi))\b/i,
    venue: "nickelodeon",
    mode: "seat",
    role: "Moviegoer",
    film: "silent-trip-moon",
    defaults: [["paris", 1910], ["london", 1912]],
  },
  // Cinema eras & general moviegoing
  {
    id: "cinema-silent",
    match: /\b(?:nickelodeon|silent\s+(?:movie|film|picture|cinema)|picture\s+show)\b/i,
    venue: "nickelodeon",
    mode: "seat",
    role: "Moviegoer",
    defaults: [["city-new-york", 1918], ["paris", 1914], ["city-tokyo", 1922], ["city-berlin", 1922]],
  },
  {
    id: "cinema-classic",
    match: /\b(?:picture\s+palace|art\s+deco\s+cinema|golden\s+age\s+cinema|classic\s+(?:movie|film)|vintage\s+cinema)\b/i,
    venue: "cinema",
    mode: "seat",
    role: "Moviegoer",
    defaults: [["city-los-angeles", 1948], ["city-new-york", 1943], ["paris", 1960], ["city-tokyo", 1954]],
  },
  {
    id: "cinema-multiplex",
    match: /\b(?:multiplex(?:\s+cinema)?|(?:summer\s+)?blockbuster|mall\s+cinema|midnight\s+movie)\b/i,
    venue: "multiplex",
    mode: "seat",
    role: "Moviegoer",
    defaults: [["city-orlando", 1987], ["city-los-angeles", 1984], ["city-chicago", 1989], ["city-new-york", 1986]],
  },
  {
    id: "cinema-general",
    match: /\b(?:watching\s+a\s+(?:movie|film)|seeing\s+a\s+(?:movie|film)|(?:at|going\s+to)\s+the\s+movies|at\s+a\s+(?:movie|film)|movie\s+night|moviegoer|filmgoer|cinemagoer|movie\s+theat(?:er|re)|cinema)\b/i,
    venue: "auto-cinema",
    mode: "seat",
    role: "Moviegoer",
    defaults: [
      ["city-orlando", 1987],
      ["city-los-angeles", 1948],
      ["paris", 1960],
      ["city-tokyo", 1954],
      ["city-mumbai", 1960],
      ["city-berlin", 1927],
    ],
  },

  // Specific historical plays & operas
  {
    id: "opera-don-giovanni",
    match: /\b(?:don\s+giovanni|mozart\s+opera)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    play: "opera-don-giovanni",
    defaults: [["city-vienna", 1788]],
  },
  {
    id: "opera-traviata",
    match: /\b(?:la\s+traviata|verdi\s+opera)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    play: "opera-traviata",
    defaults: [["city-venice", 1854], ["city-milan", 1860]],
  },
  {
    id: "opera-carmen",
    match: /\b(?:carmen\s+opera|bizet|at\s+carmen)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    play: "opera-carmen",
    defaults: [["paris", 1876]],
  },
  {
    id: "opera-peking",
    match: /\b(?:peking\s+opera|beijing\s+opera|farewell\s+my\s+concubine)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    play: "play-peking-concubine",
    defaults: [["city-shanghai", 1928]],
  },
  {
    id: "opera-ravenna",
    match: /\b(?:ff6\s+opera|siege\s+of\s+ravenna|maria\s+and\s+draco)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    play: "opera-siege",
    defaults: [["city-vienna", 1888], ["city-milan", 1876], ["city-venice", 1882]],
  },
  {
    id: "opera-ballet",
    match: /\b(?:(?:at|watching|seeing)\s+(?:a|the)\s+ballet|ballet\s+performance|balletgoer)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Balletgoer",
    defaults: [["paris", 1884], ["city-moscow", 1895], ["city-vienna", 1890], ["london", 1908]],
  },
  {
    id: "opera-general",
    match: /\b(?:(?:at|watching|seeing|listening\s+to)\s+(?:an?|the)\s+opera|opera\s+house|opera\s*goer|la\s+scala|palais\s+garnier|metropolitan\s+opera)\b/i,
    venue: "opera-house",
    mode: "seat",
    role: "Operagoer",
    defaults: [["city-vienna", 1788], ["city-milan", 1858], ["paris", 1876], ["city-venice", 1854], ["city-new-york", 1905]],
  },
  {
    id: "stage-hamlet",
    match: /\b(?:hamlet|doctor\s+faustus|volpone)\b/i,
    venue: "elizabethan-playhouse",
    mode: "seat",
    role: "Groundling",
    play: "play-hamlet",
    defaults: [["london", 1601]],
  },
  {
    id: "stage-moliere",
    match: /\b(?:tartuffe|moli[eè]re|marriage\s+of\s+figaro|beaumarchais)\b/i,
    venue: "proscenium-playhouse",
    mode: "seat",
    role: "Playgoer",
    play: "play-tartuffe",
    defaults: [["paris", 1670], ["paris", 1784]],
  },
  {
    id: "stage-chekhov",
    match: /\b(?:cherry\s+orchard|chekhov)\b/i,
    venue: "proscenium-playhouse",
    mode: "seat",
    role: "Theatergoer",
    play: "play-cherry-orchard",
    defaults: [["city-moscow", 1904]],
  },
  {
    id: "stage-wilde",
    match: /\b(?:oscar\s+wilde|importance\s+of\s+being\s+earnest)\b/i,
    venue: "proscenium-playhouse",
    mode: "seat",
    role: "Theatregoer",
    play: "play-earnest",
    defaults: [["london", 1895]],
  },
  {
    id: "stage-salesman",
    match: /\b(?:death\s+of\s+a\s+salesman|arthur\s+miller)\b/i,
    venue: "broadway-theatre",
    mode: "seat",
    role: "Theatergoer",
    play: "broadway-salesman",
    defaults: [["city-new-york", 1949]],
  },
  {
    id: "stage-raisin",
    match: /\b(?:raisin\s+in\s+the\s+sun|lorraine\s+hansberry)\b/i,
    venue: "broadway-theatre",
    mode: "seat",
    role: "Theatergoer",
    play: "broadway-raisin",
    defaults: [["city-new-york", 1959]],
  },
  {
    id: "stage-broadway-musical",
    match: /\b(?:broadway\s+musical|(?:at|watching|seeing)\s+a\s+musical|lights\s+over\s+42nd)\b/i,
    venue: "broadway-theatre",
    mode: "seat",
    role: "Theatergoer",
    play: "broadway-lights",
    defaults: [["city-new-york", 1938], ["city-new-york", 1955]],
  },
  {
    id: "stage-west-end",
    match: /\bwest\s+end(?:\s+(?:play|show|musical|theat(?:re|er)))?\b/i,
    venue: "broadway-theatre",
    mode: "seat",
    role: "Theatregoer",
    defaults: [["london", 1895], ["london", 1932]],
  },
  {
    id: "stage-broadway",
    match: /\b(?:broadway(?:\s+(?:play|show|theat(?:er|re)))?|opening\s+night)\b/i,
    venue: "broadway-theatre",
    mode: "seat",
    role: "Theatergoer",
    defaults: [["city-new-york", 1949], ["city-new-york", 1959], ["city-new-york", 1935]],
  },
  {
    id: "stage-globe",
    match: /\b(?:globe\s+theat(?:re|er)|elizabethan\s+play(?:house)?|shakespeare(?:an)?\s+play|groundling)\b/i,
    venue: "elizabethan-playhouse",
    mode: "seat",
    role: "Groundling",
    defaults: [["london", 1601], ["london", 1606]],
  },
  {
    id: "stage-kabuki",
    match: /\b(?:(?:watching|at|seeing)\s+(?:a\s+)?kabuki|kabuki(?:\s+(?:play|theat(?:re|er)|show))?|chushingura|47\s+ronin)\b/i,
    venue: "kabuki-theatre",
    mode: "seat",
    role: "Playgoer",
    defaults: [["city-tokyo", 1752], ["kyoto", 1780]],
  },
  {
    id: "stage-noh",
    match: /\b(?:(?:watching|at|seeing)\s+(?:a\s+)?noh|noh\s+(?:play|theat(?:re|er)|stage)|atsumori|zeami)\b/i,
    venue: "noh-theatre",
    mode: "seat",
    role: "Playgoer",
    defaults: [["kyoto", 1450], ["kyoto", 1680]],
  },
  {
    id: "stage-general",
    match: /\b(?:theat(?:er|re)\s*goer|playgoer|(?:watching|seeing|at)\s+a\s+(?:stage\s+)?play|(?:at|in)\s+(?:a|the)\s+(?:theat(?:er|re)|playhouse)|playhouse|matinee)\b/i,
    venue: "auto-theatre",
    mode: "seat",
    role: "Theatergoer",
    defaults: [["city-new-york", 1949], ["london", 1895], ["paris", 1784], ["city-moscow", 1904], ["london", 1601]],
  },
];

export function resolveTheatreVenueId(venue: TheatreStartRule["venue"], year: number): string {
  if (venue === "auto-cinema") return year < 1925 ? "nickelodeon" : year < 1966 ? "cinema" : "multiplex";
  if (venue === "auto-theatre") return year < 1660 ? "elizabethan-playhouse" : year < 1885 ? "proscenium-playhouse" : "broadway-theatre";
  return venue;
}

export function encodeTheatreRoom(mode: TheatreStartMode, opts?: { film?: string; play?: string }): string {
  if (opts?.film) return `${mode}:film:${opts.film}`;
  if (opts?.play) return `${mode}:play:${opts.play}`;
  return mode;
}

export function decodeTheatreRoom(value: string | undefined): { mode: TheatreStartMode; film?: string; play?: string } {
  if (!value) return { mode: "seat" };
  const [m, kind, id] = value.split(":");
  const mode: TheatreStartMode = m === "stage" || m === "foyer" || m === "seat" ? m : "seat";
  return { mode, ...(kind === "film" && id ? { film: id } : {}), ...(kind === "play" && id ? { play: id } : {}) };
}

export function theatreStartFromPrompt(input: string): TheatreStartRule | undefined {
  return THEATRE_STARTS.find((r) => r.match.test(input));
}

export type TheaterViewerPreset = {
  id: string;
  group: "cinema" | "stage";
  label: string;
  placeId: string;
  year: number;
  venue: Exclude<TheatreStartRule["venue"], "auto-cinema" | "auto-theatre">;
  role: string;
  film?: string;
  play?: string;
};

/** Dev media-viewer presets for Settings → Developer → "Go to the theater". */
export const THEATER_VIEWER_PRESETS: readonly TheaterViewerPreset[] = [
  // Cinemas & world film
  { id: "orlando-1987", group: "cinema", label: "Orlando, 1987 · 3-Screen Multiplex", placeId: "city-orlando", year: 1987, venue: "multiplex", role: "Moviegoer" },
  { id: "paris-1910", group: "cinema", label: "Paris, 1910 · Silent Nickelodeon (Méliès)", placeId: "paris", year: 1910, venue: "nickelodeon", role: "Moviegoer", film: "silent-trip-moon" },
  { id: "ny-1918", group: "cinema", label: "New York, 1918 · Silent Nickelodeon (Train Robbery)", placeId: "city-new-york", year: 1918, venue: "nickelodeon", role: "Moviegoer", film: "silent-train-robbery" },
  { id: "berlin-1922", group: "cinema", label: "Berlin, 1922 · Weimar Silent Kino (Nosferatu)", placeId: "city-berlin", year: 1922, venue: "nickelodeon", role: "Moviegoer", film: "silent-nosferatu" },
  { id: "tokyo-1922", group: "cinema", label: "Tokyo, 1922 · Silent Cinema + Live Benshi (Orochi)", placeId: "city-tokyo", year: 1922, venue: "nickelodeon", role: "Moviegoer", film: "silent-asakusa" },
  { id: "la-1923", group: "cinema", label: "Los Angeles, 1923 · Silent Slapstick (Safety Last!)", placeId: "city-los-angeles", year: 1923, venue: "nickelodeon", role: "Moviegoer", film: "silent-safety-last" },
  { id: "moscow-1926", group: "cinema", label: "Moscow, 1926 · Soviet Cinema (Potemkin)", placeId: "city-moscow", year: 1926, venue: "cinema", role: "Moviegoer", film: "silent-potemkin" },
  { id: "berlin-1927", group: "cinema", label: "Berlin, 1927 · Weimar Picture Palace (Metropolis)", placeId: "city-berlin", year: 1927, venue: "cinema", role: "Moviegoer", film: "silent-metropolis" },
  { id: "sf-1942", group: "cinema", label: "San Francisco, 1942 · Film Noir Palace (Maltese Falcon)", placeId: "city-san-francisco", year: 1942, venue: "cinema", role: "Moviegoer", film: "classic-noir" },
  { id: "ny-1943", group: "cinema", label: "New York, 1943 · Picture Palace (Casablanca)", placeId: "city-new-york", year: 1943, venue: "cinema", role: "Moviegoer", film: "classic-casablanca" },
  { id: "mexico-1944", group: "cinema", label: "Mexico City, 1944 · Golden Age Cinema (María Candelaria)", placeId: "city-mexico-city", year: 1944, venue: "cinema", role: "Moviegoer", film: "classic-maria-candelaria" },
  { id: "rome-1949", group: "cinema", label: "Rome, 1949 · Neorealist Cinema (Bicycle Thieves)", placeId: "rome", year: 1949, venue: "cinema", role: "Filmgoer", film: "classic-bicycle-thieves" },
  { id: "tokyo-1954-samurai", group: "cinema", label: "Tokyo, 1954 · Japanese Cinema (Seven Samurai)", placeId: "city-tokyo", year: 1954, venue: "cinema", role: "Moviegoer", film: "classic-samurai" },
  { id: "tokyo-1954-godzilla", group: "cinema", label: "Tokyo, 1954 · Kaiju Matinee (Godzilla)", placeId: "city-tokyo", year: 1954, venue: "cinema", role: "Moviegoer", film: "classic-godzilla" },
  { id: "kolkata-1956", group: "cinema", label: "Kolkata, 1956 · Bengali Cinema (Pather Panchali)", placeId: "city-kolkata", year: 1956, venue: "cinema", role: "Filmgoer", film: "classic-pather-panchali" },
  { id: "la-1956", group: "cinema", label: "Los Angeles, 1956 · Technicolor Western (The Searchers)", placeId: "city-los-angeles", year: 1956, venue: "cinema", role: "Moviegoer", film: "classic-western" },
  { id: "cairo-1958", group: "cinema", label: "Cairo, 1958 · Egyptian Cinema (Cairo Station)", placeId: "cairo", year: 1958, venue: "cinema", role: "Moviegoer", film: "classic-nile" },
  { id: "mumbai-1960", group: "cinema", label: "Mumbai, 1960 · Indian Musical Palace (Mughal-e-Azam)", placeId: "city-mumbai", year: 1960, venue: "cinema", role: "Moviegoer", film: "classic-monsoon" },
  { id: "paris-1960", group: "cinema", label: "Paris, 1960 · French New Wave (Breathless)", placeId: "paris", year: 1960, venue: "cinema", role: "Filmgoer", film: "classic-newwave" },
  { id: "mumbai-1975", group: "cinema", label: "Mumbai, 1975 · Indian Action Cinema (Sholay)", placeId: "city-mumbai", year: 1975, venue: "multiplex", role: "Moviegoer", film: "modern-sholay" },
  { id: "hk-1978", group: "cinema", label: "Hong Kong, 1978 · Martial Arts Multiplex", placeId: "city-hong-kong", year: 1978, venue: "multiplex", role: "Moviegoer", film: "modern-kungfu" },
  { id: "tehran-1988", group: "cinema", label: "Tehran, 1988 · Iranian New Wave (Kiarostami)", placeId: "city-tehran", year: 1988, venue: "multiplex", role: "Filmgoer", film: "modern-kiarostami" },
  { id: "tokyo-1988", group: "cinema", label: "Tokyo, 1988 · Cyberpunk Anime Multiplex (Akira)", placeId: "city-tokyo", year: 1988, venue: "multiplex", role: "Moviegoer", film: "modern-akira" },
  { id: "orlando-1993", group: "cinema", label: "Orlando, 1993 · 90s Dino Blockbuster Multiplex", placeId: "city-orlando", year: 1993, venue: "multiplex", role: "Moviegoer", film: "modern-dino" },

  // Live theatres, opera houses & world stages
  { id: "vienna-1788", group: "stage", label: "Vienna, 1788 · Grand Opera House (Don Giovanni)", placeId: "city-vienna", year: 1788, venue: "opera-house", role: "Operagoer", play: "opera-don-giovanni" },
  { id: "venice-1854", group: "stage", label: "Venice, 1854 · Grand Opera House (La Traviata)", placeId: "city-venice", year: 1854, venue: "opera-house", role: "Operagoer", play: "opera-traviata" },
  { id: "paris-1876", group: "stage", label: "Paris, 1876 · Grand Opera House (Carmen)", placeId: "paris", year: 1876, venue: "opera-house", role: "Operagoer", play: "opera-carmen" },
  { id: "milan-1888", group: "stage", label: "Milan, 1888 · Grand Opera House (Siege of Ravenna)", placeId: "city-milan", year: 1888, venue: "opera-house", role: "Operagoer", play: "opera-siege" },
  { id: "london-1601", group: "stage", label: "London, 1601 · Elizabethan Globe Playhouse (Hamlet)", placeId: "london", year: 1601, venue: "elizabethan-playhouse", role: "Groundling", play: "play-hamlet" },
  { id: "paris-1670", group: "stage", label: "Paris, 1670 · Proscenium Playhouse (Tartuffe)", placeId: "paris", year: 1670, venue: "proscenium-playhouse", role: "Playgoer", play: "play-tartuffe" },
  { id: "mexico-1683", group: "stage", label: "Mexico City, 1683 · New Spain Playhouse (Sor Juana)", placeId: "city-mexico-city", year: 1683, venue: "proscenium-playhouse", role: "Playgoer", play: "play-house-of-desires" },
  { id: "kyoto-1450", group: "stage", label: "Kyoto, 1450 · Noh Theatre (Zeami's Atsumori)", placeId: "kyoto", year: 1450, venue: "noh-theatre", role: "Playgoer", play: "noh-atsumori" },
  { id: "edo-1752", group: "stage", label: "Edo (Tokyo), 1752 · Kabuki Theatre (47 Rōnin)", placeId: "city-tokyo", year: 1752, venue: "kabuki-theatre", role: "Playgoer", play: "kabuki-chushingura" },
  { id: "london-1895", group: "stage", label: "London, 1895 · Victorian Playhouse (Oscar Wilde)", placeId: "london", year: 1895, venue: "proscenium-playhouse", role: "Theatregoer", play: "play-earnest" },
  { id: "moscow-1904", group: "stage", label: "Moscow, 1904 · Russian Playhouse (Cherry Orchard)", placeId: "city-moscow", year: 1904, venue: "proscenium-playhouse", role: "Theatergoer", play: "play-cherry-orchard" },
  { id: "kolkata-1915", group: "stage", label: "Kolkata, 1915 · Bengali Playhouse (Tagore)", placeId: "city-kolkata", year: 1915, venue: "proscenium-playhouse", role: "Theatergoer", play: "play-post-office" },
  { id: "shanghai-1928", group: "stage", label: "Shanghai, 1928 · Peking Opera (Farewell My Concubine)", placeId: "city-shanghai", year: 1928, venue: "opera-house", role: "Operagoer", play: "play-peking-concubine" },
  { id: "ny-1938", group: "stage", label: "New York, 1938 · Broadway Musical (42nd Street)", placeId: "city-new-york", year: 1938, venue: "broadway-theatre", role: "Theatergoer", play: "broadway-lights" },
  { id: "ny-1949", group: "stage", label: "New York, 1949 · Broadway Drama (Death of a Salesman)", placeId: "city-new-york", year: 1949, venue: "broadway-theatre", role: "Theatergoer", play: "broadway-salesman" },
  { id: "ny-1959", group: "stage", label: "New York, 1959 · Broadway Drama (Raisin in the Sun)", placeId: "city-new-york", year: 1959, venue: "broadway-theatre", role: "Theatergoer", play: "broadway-raisin" },
  { id: "lagos-1964", group: "stage", label: "Lagos, 1964 · Yoruba Travelling Theatre (Ogunde)", placeId: "city-lagos", year: 1964, venue: "proscenium-playhouse", role: "Theatergoer", play: "play-yoruba-ronu" },
];
