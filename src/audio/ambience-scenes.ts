import type { Weather } from "../core/weather";
import type { Scene } from "./ambience";

/** Field recordings to hold the synthesis against; `start` skips a quiet
 * opening, in seconds. Review only: fetched into
 * artifacts/audio-ref/ by `npm run audio:ambience`, never shipped. */
export const references = {
  "sung-hymn": {title:"Johannes.Hymnus.ogg", url:"https://upload.wikimedia.org/wikipedia/commons/e/e9/Johannes.Hymnus.ogg", licence:"Public domain, Membeth"},
  "woodblock": {title:"Blok music.ogg", url:"https://upload.wikimedia.org/wikipedia/commons/0/07/Blok_music.ogg", licence:"CC BY-SA 4.0, Krol111"},
  pencil: {
    title: "Pencil scratchings.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Pencil_scratchings.ogg",
    licence: "Public domain, gypsygirl",
  },
  "light-rainfall": {
    title: "Sound of light rainfall.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/15/Sound_of_light_rainfall.ogg",
    licence: "CC BY-SA 4.0, Mijesty",
  },
  "midwest-light": {
    title: "Light Rain Distant Thunder July 5th 2016.wav",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Light_Rain_Distant_Thunder_July_5th_2016.wav",
    licence: "CC0, kvgarlic",
  },
  "bourne-woods": {
    title: "Bourne woods rain 2020-05-10 0800.mp3",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Bourne_woods_rain_2020-05-10_0800.mp3",
    licence: "CC BY-SA 4.0, Robert EA Harvey",
    start: 15,
  },
  "heavy-summer": {
    title: "Heavy Rain in Summer.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/69/Heavy_Rain_in_Summer.ogg",
    licence: "CC BY-SA 3.0, Fiver, der Hellseher",
  },
  glenshaw: {
    title: "Heavy rain in Glenshaw, PA.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Heavy_rain_in_Glenshaw%2C_PA.ogg",
    licence: "CC BY-SA 3.0, Sage Ross",
  },
  nepal: {
    title: "October rain in Nepal.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/73/October_rain_in_Nepal.ogg",
    licence: "CC BY-SA 4.0, Nirmal Dulal",
  },
  veranda: {
    title: "Rain on a veranda and thunder.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Rain_on_a_veranda_and_t.ogg",
    licence: "Public domain, ezwa",
  },
  window: {
    title: "Rain against the window.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/41/Rain_against_the_window.ogg",
    licence: "Public domain, cori",
  },
  canvas: {
    title: "Dion-Bouton, regen op het linnen autodak.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Dion-Bouton%2C_regen_op_het_linnen_autodak_-_SoundCloud_-_Beeld_en_Geluid.ogg",
    licence: "CC BY-SA 3.0, Beeld en Geluid",
  },
  rome: {
    title: "Rain in Rome 25.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rain_in_Rome_25.ogg",
    licence: "CC BY-SA 3.0, Nicholas Gemini",
  },
  thunderstorm: {
    title: "Summer thunderstorm in the woods.ogg",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Summer_thunderstorm_in_the_woods.ogg",
    licence: "CC BY-SA 4.0, Serg Childed",
  },
} as const;
export type ReferenceId = keyof typeof references;

export interface ListeningScene {
  id: string;
  label: string;
  scene: Scene;
  /** What it should sound like, in words: the CLAP prompt. */
  describe: string;
  refs: ReferenceId[];
}

const make = (
  id: string,
  label: string,
  describe: string,
  refs: ReferenceId[],
  over: Partial<Scene>,
  weather: Partial<Weather>,
): ListeningScene => ({
  id,
  label,
  describe,
  refs,
  scene: {
    indoors: false,
    fireDistance: Infinity,
    townDistance: 200,
    townSize: 0,
    peopleNear: 0,
    night: false,
    season: "summer",
    climate: "temperate",
    ecology: "grassland",
    hour: 11,
    ...over,
    weather: {
      condition: "rain",
      label: "",
      tempC: 16,
      night: !!over.night,
      wind: { angle: 0, strength: 0.25 },
      wetness: 0.8,
      rain: 0.5,
      storm: 0,
      hail: 0,
      blizzard: 0,
      dust: 0,
      ...weather,
    },
  },
});

/** The scenes the studio plays and the render script records. */
export const listeningScenes: ListeningScene[] = [
  make("parish-nave", "Rouen · parish nave, 1350", "a short sung response in a stone nave, with breath between phrases", ["sung-hymn"],
    {indoors:true, peopleNear:7, room:{area:168,finish:2,institution:"worship",floor:"flag",rite:"unison"}}, {condition:"clear",rain:0}),
  make("prayer-hall", "Fez · prayer hall, 1400", "one unaccompanied reciting voice in the prayer hall", [],
    {indoors:true, peopleNear:5, room:{area:130,finish:1,institution:"worship",floor:"mat",rite:"recitation"}}, {condition:"clear",rain:0}),
  make("temple-block", "Kyoto · main hall, 1700", "a hollow wooden percussion beat, softly answered by the room", ["woodblock"],
    {indoors:true, peopleNear:3, room:{area:120,finish:1,institution:"worship",floor:"plank",rite:"woodbeat"}}, {condition:"clear",rain:0}),
  make("london-ward", "London · hospital ward, 2020", "linen shifting and the soft rattle of wheels on a ward floor", [],
    { indoors: true, year: 2020, peopleNear: 2, room: { area: 130, finish: 1, institution: "hospital", role: "ward", floor: "linoleum", clinical: true } }, { condition: "clear", rain: 0 }),
  make("edo-ward", "Edo · infirmary, 1800", "cloth and a cup being set down beside a sleeping mat", [],
    { indoors: true, year: 1800, peopleNear: 2, room: { area: 130, finish: 1, institution: "hospital", role: "ward", floor: "mat" } }, { condition: "clear", rain: 0 }),
  make("board-school", "London · classroom, 1900", "pencils working in short runs, paper turning and desks shifting on boards", ["pencil"],
    { indoors: true, year: 1900, peopleNear: 8, room: { area: 100, finish: 1, institution: "school", role: "classroom", floor: "plank" } }, { condition: "clear", rain: 0 }),
  make("yamen-office", "Beijing · clerks’ room, 1750", "brush strokes, an inkstone and rustling papers in a county office", [],
    { indoors: true, year: 1750, culture: "east-asian", peopleNear: 3, room: { area: 64, finish: 1, institution: "magistracy", role: "work", floor: "plank" } }, { condition: "clear", rain: 0 }),
  make("bazaar-pottery", "Damascus · pottery stall, 1500", "pottery knocking against wood, footsteps and voices in a covered market", [],
    { indoors: true, year: 1500, peopleNear: 6, room: { area: 64, finish: 1, institution: "bazaar", role: "work", floor: "flag", stock: "pots" } }, { condition: "clear", rain: 0 }),
  make("dawn-chorus", "Dawn chorus in broadleaf woods", "songbirds singing at dawn in a forest", [],
    { ecology: "temperate-woodland", season: "spring", hour: 6, lon: 0 }, { condition: "clear", rain: 0, wetness: 0, wind: { angle: 0, strength: 0.15 } }),
  make("cricket-night", "Warm night in open country", "crickets chirping on a warm summer night", [],
    { night: true, hour: 23 }, { condition: "clear", rain: 0, wetness: 0, tempC: 16, wind: { angle: 0, strength: 0.1 } }),
  make("tropical-night", "Hot night at the forest edge", "tree crickets trilling and tree frogs whistling at night in the tropics", [],
    { climate: "tropical", ecology: "tropical-woodland", night: true, hour: 22 }, { condition: "clear", rain: 0, wetness: 0.5, tempC: 26, wind: { angle: 0, strength: 0.1 } }),
  make("cicada-noon", "Mediterranean noon in summer", "cicadas buzzing in the midday heat, a dove calling", [],
    { climate: "mediterranean", ecology: "dry-scrub", hour: 13 }, { condition: "clear", rain: 0, wetness: 0, tempC: 31, wind: { angle: 0, strength: 0.1 } }),
  make("drizzle-meadow", "Drizzle on a meadow", "light drizzle falling softly on grass", ["light-rainfall"], {}, { rain: 0.12 }),
  make("shower-woods", "Shower in broadleaf woods", "moderate rain falling on leaves in a forest", ["bourne-woods"], { ecology: "temperate-woodland" }, { rain: 0.45 }),
  make("boreal-rain", "Steady rain in pine forest", "steady rain in a pine forest", ["midwest-light"], { climate: "boreal", ecology: "boreal-woodland", season: "autumn" }, { rain: 0.35, tempC: 7 }),
  make("thunderstorm", "Summer thunderstorm", "heavy rain with rolling thunder", ["thunderstorm", "glenshaw"], { ecology: "temperate-woodland" }, { rain: 0.95, storm: 0.86, tempC: 22 }),
  make("tropical-downpour", "Tropical downpour", "torrential tropical rain on broad leaves", ["heavy-summer", "nepal"], { climate: "tropical", ecology: "tropical-woodland" }, { rain: 0.95, storm: 0.86, tempC: 27 }),
  make("monsoon-night", "Monsoon night", "monsoon rain at night with frogs calling", ["nepal", "veranda"], { climate: "monsoon", ecology: "tropical-woodland", night: true, hour: 22 }, { rain: 0.6, tempC: 26, wetness: 1 }),
  make("town-rain", "Rain in a stone town", "rain falling on stone streets and roofs in a town", ["rome"], { year: 1500, townDistance: 5, townSize: 120, climate: "mediterranean", season: "winter" }, { rain: 0.55, tempC: 11 }),
  make("desert-cloudburst", "Desert cloudburst", "a sudden heavy rain shower on dry desert ground", [], { climate: "arid", ecology: "desert" }, { rain: 0.7, tempC: 24 }),
  make("hailstorm", "Hailstorm", "hailstones clattering on the ground in a heavy summer shower with thunder", [], {}, { rain: 0.85, storm: 0.6, hail: 0.8, tempC: 17, wind: { angle: 0, strength: 0.6 } }),
  make("sandstorm", "Sandstorm", "a desert sandstorm, strong wind full of hissing sand", [], { climate: "arid", ecology: "desert", hour: 15 }, { condition: "dust", rain: 0, wetness: 0, dust: 0.85, tempC: 33, wind: { angle: 0, strength: 0.95 } }),
  make("blizzard", "Blizzard", "a blizzard, a gale howling across open snow", [], { climate: "boreal", ecology: "boreal-woodland", season: "winter" }, { condition: "snow", rain: 0, wetness: 0.1, blizzard: 0.9, tempC: -12, wind: { angle: 0, strength: 0.95 } }),
  make("under-thatch", "Under a thatched roof", "rain on a thatched roof heard from inside", ["canvas"], { indoors: true, room: { area: 30, finish: 0 } }, { rain: 0.6 }),
  make("under-tile", "Under a tiled roof", "rain on a tiled roof heard from inside a room", ["window", "veranda"], { indoors: true, room: { area: 40, finish: 2 }, climate: "mediterranean" }, { rain: 0.6 }),
];
