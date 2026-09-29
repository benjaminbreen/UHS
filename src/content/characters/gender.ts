import { sexOf } from "../../core/brief";
import { random } from "../../core/random";
import type { Actor, Pack } from "../../core/types";

type Tradition = {
  term: string;
  lon: [number, number];
  lat: [number, number];
  from: number;
  to?: number;
  /** The sex the role is attested for; either when absent. */
  sex?: "male" | "female";
  rate: number;
};

// Attested third-gender roles, by rough geography. Rates are guesses.
const TRADITIONS: Tradition[] = [
  // Kama Sutra's tritiya-prakriti; hijra from the Persianate courts on.
  { term: "Of the third nature (tritiya-prakriti)", lon: [60, 95], lat: [5, 37], from: -300, to: 1300, sex: "male", rate: 0.004 },
  { term: "Hijra", lon: [60, 95], lat: [5, 37], from: 1300, sex: "male", rate: 0.004 },
  // Zapotec of the Isthmus of Tehuantepec, in colonial accounts from the 1500s.
  { term: "Muxe", lon: [-96, -94], lat: [15.5, 17.5], from: 1500, sex: "male", rate: 0.01 },
  { term: "Fa'afafine", lon: [-173, -171], lat: [-14.5, -13], from: 1000, sex: "male", rate: 0.01 },
  { term: "Fakaleitī", lon: [-176, -173], lat: [-22, -15], from: 1000, sex: "male", rate: 0.01 },
  { term: "Māhū", lon: [-161, -154], lat: [18, 23], from: 1000, rate: 0.006 },
  // Bugis of South Sulawesi, recorded by the 1500s.
  { term: "Calabai", lon: [119, 121], lat: [-6, -3], from: 1500, sex: "male", rate: 0.005 },
  { term: "Calalai", lon: [119, 121], lat: [-6, -3], from: 1500, sex: "female", rate: 0.003 },
  { term: "Nádleehí", lon: [-115, -103], lat: [31, 38], from: 1000, to: 1990, rate: 0.006 },
  { term: "Winkte", lon: [-110, -95], lat: [38, 52], from: 1000, to: 1990, sex: "male", rate: 0.005 },
];

/** Modern towns: 0.1% in 1890, rising to 1% by 2018. */
const modernRate = (year: number) =>
  year < 1890 ? 0 : 0.001 + 0.009 * Math.min(1, (year - 1890) / 128);

const modernTerm = (year: number) =>
  year >= 2010
    ? { term: "Nonbinary", pronoun: "they" as const }
    : year >= 1990
      ? { term: "Genderqueer" }
      : { term: "Neither man nor woman, by their own account" };

export function assignGender(a: Actor, pack: Pack, seed: string) {
  if (a.kind !== "human" || a.id === "player" || (a.age ?? 30) < 16) return;
  const year = pack.setting?.year ?? pack.year;
  const { lon, lat } = pack.anchor;
  const roll = random(seed, a.id, "gender");
  const sex = sexOf(a);
  const local = TRADITIONS.find(
    (t) =>
      lon >= t.lon[0] && lon <= t.lon[1] && lat >= t.lat[0] && lat <= t.lat[1] &&
      year >= t.from && year < (t.to ?? Infinity) && (!t.sex || t.sex === sex),
  );
  if (local) {
    if (roll < local.rate) a.gender = { term: local.term };
  } else if (pack.layout === "streets" && roll < modernRate(year))
    a.gender = modernTerm(year);
}
