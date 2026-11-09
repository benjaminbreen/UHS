import type { Weather } from "../core/weather";
import type { Scene } from "./ambience";

/** Field recordings to hold the synthesis against; `start` skips a quiet
 * opening, in seconds. Review only: fetched into
 * artifacts/audio-ref/ by `npm run audio:ambience`, never shipped. */
export const references = {
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
      ...weather,
    },
  },
});

/** The scenes the studio plays and the render script records. */
export const listeningScenes: ListeningScene[] = [
  make("drizzle-meadow", "Drizzle on a meadow", "light drizzle falling softly on grass", ["light-rainfall"], {}, { rain: 0.12 }),
  make("shower-woods", "Shower in broadleaf woods", "moderate rain falling on leaves in a forest", ["bourne-woods"], { ecology: "temperate-woodland" }, { rain: 0.45 }),
  make("boreal-rain", "Steady rain in pine forest", "steady rain in a pine forest", ["midwest-light"], { climate: "boreal", ecology: "boreal-woodland", season: "autumn" }, { rain: 0.35, tempC: 7 }),
  make("thunderstorm", "Summer thunderstorm", "heavy rain with rolling thunder", ["thunderstorm", "glenshaw"], { ecology: "temperate-woodland" }, { rain: 0.95, tempC: 22 }),
  make("tropical-downpour", "Tropical downpour", "torrential tropical rain on broad leaves", ["heavy-summer", "nepal"], { climate: "tropical", ecology: "tropical-woodland" }, { rain: 0.95, tempC: 27 }),
  make("monsoon-night", "Monsoon night", "monsoon rain at night with frogs calling", ["nepal", "veranda"], { climate: "monsoon", ecology: "tropical-woodland", night: true, hour: 22 }, { rain: 0.6, tempC: 26, wetness: 1 }),
  make("town-rain", "Rain in a stone town", "rain falling on stone streets and roofs in a town", ["rome"], { year: 1500, townDistance: 5, townSize: 120, climate: "mediterranean", season: "winter" }, { rain: 0.55, tempC: 11 }),
  make("desert-cloudburst", "Desert cloudburst", "a sudden heavy rain shower on dry desert ground", [], { climate: "arid", ecology: "desert" }, { rain: 0.7, tempC: 24 }),
  make("under-thatch", "Under a thatched roof", "rain on a thatched roof heard from inside", ["canvas"], { indoors: true, room: { area: 30, finish: 0 } }, { rain: 0.6 }),
  make("under-tile", "Under a tiled roof", "rain on a tiled roof heard from inside a room", ["window", "veranda"], { indoors: true, room: { area: 40, finish: 2 }, climate: "mediterranean" }, { rain: 0.6 }),
];
