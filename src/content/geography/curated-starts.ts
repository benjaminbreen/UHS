export type CuratedStart = { placeId: string; year: number; role: string };

export const curatedStarts: CuratedStart[] = [
  { placeId: "rome", year: 100, role: "Baker" },
  { placeId: "mexico", year: 1500, role: "Featherworker" },
  { placeId: "tikal", year: 750, role: "Scribe" },
  { placeId: "london", year: 1590, role: "Player" },
  { placeId: "alexandria", year: -250, role: "Librarian" },
  { placeId: "athens", year: -430, role: "Potter" },
  { placeId: "mesopotamia", year: -2100, role: "Scribe" },
  { placeId: "nile", year: -1350, role: "Farmer" },
  { placeId: "beijing", year: 1450, role: "Silk merchant" },
  { placeId: "kyoto", year: 1000, role: "Court poet" },
  { placeId: "city-baghdad", year: 900, role: "Bookseller" },
  { placeId: "city-samarkand", year: 1400, role: "Tilemaker" },
  { placeId: "timbuktu", year: 1350, role: "Manuscript copyist" },
  { placeId: "city-venice", year: 1500, role: "Glassblower" },
  { placeId: "cusco", year: 1500, role: "Llama herder" },
  { placeId: "city-istanbul", year: 1550, role: "Coffee seller" },
  { placeId: "haiti", year: 1820, role: "Farmer" },
  { placeId: "normandy", year: 1100, role: "Stonemason" },
  { placeId: "siberia", year: -20000, role: "Shaman" },
  { placeId: "natufian", year: -11500, role: "Wild-grain harvester" },
  { placeId: "clovis", year: -11000, role: "Flintknapper" },
  { placeId: "magdalenian", year: -12999, role: "Painter" },
  { placeId: "polynesia", year: 1200, role: "Navigator" },
  { placeId: "city-benin-city", year: 1500, role: "Bronze caster" },
  { placeId: "delhi", year: 1650, role: "Miniature painter" },
];

export function curatedStart(not?: string): CuratedStart {
  const pool = curatedStarts.filter((s) => s.placeId !== not);
  return pool[Math.floor(Math.random() * pool.length)];
}
