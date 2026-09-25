import type { CultureId } from "../content/history/types";

// Inked settlement marks in the manner of early modern and fantasy maps,
// drawn on a 20-unit square with the ground at y = 17.
const glyphs = {
  steeple: "M3 17V12L6 9L9 12V17ZM9 17V8L11 3L13 8V17ZM13 17V12L16 10L18 12V17Z",
  temple: "M2.5 9L10 5L17.5 9ZM4 9V16M7 9V16M10 9V16M13 9V16M16 9V16M2.5 16H17.5V17.5H2.5Z",
  dome: "M3 17V12A5 5 0 0 1 13 12V17ZM8 7V5.5M14.5 17V6.5H16.5V17ZM14.5 6.5L15.5 3L16.5 6.5Z",
  flat: "M2.5 17V11H9V17ZM9 17V8.5H16V17ZM16 17V12H18V17ZM11 8.5V7H14V8.5",
  yurt: "M3 17V13Q10 6.5 17 13V17ZM8.5 17V14H11.5V17M10 7.8V6.5",
  shikhara: "M5 17V12Q10 1.5 15 12V17ZM10 4.5V2.5M8 17V14H12V17",
  stupa: "M4.5 17Q4.5 10.5 10 9.5Q15.5 10.5 15.5 17ZM10 9.5V3.5M8.5 5.5H11.5M8 7.5H12",
  pagoda: "M5 17V14H15V17ZM3 14L10 11L17 14ZM6 11V9.2H14V11ZM4.5 9.2L10 6.8L15.5 9.2ZM7.5 6.8L10 4.5L12.5 6.8Z",
  pyramid: "M2.5 17H17.5V14.5H15.5V12H13.5V9.5H6.5V12H4.5V14.5H2.5ZM8 9.5V6.5H12V9.5",
  roundhouse: "M3 17V14H9V17ZM2 14L6 9.5L10 14ZM11 17V13.5H17.5V17ZM10 13.5L14.2 8L18.5 13.5Z",
  tipi: "M4 17L10 5L16 17ZM9 5L8 2.5M11 5L12 2.5M9 17L10 13L11 17",
  mound: "M1.5 17L6 12H14L18.5 17ZM8 12V9L10 7L12 9V12Z",
  modern: "M2.5 17V9H7.5V17ZM7.5 17V4.5H12.5V17ZM12.5 17V11H17.5V17ZM9 7H11M9 9.5H11M9 12H11",
};
type Glyph = keyof typeof glyphs;

export function glyphFor(culture: CultureId, architecture: string, year: number, rank: string): Glyph {
  if (year >= 1900) return "modern";
  if (architecture === "classical") return "temple";
  const big = rank !== "village";
  switch (culture) {
    case "european": return "steeple";
    case "north-african-west-asian": return year >= 650 ? "dome" : "flat";
    case "inner-eurasian": return big && year >= 900 ? "dome" : "yurt";
    case "south-asian": return "shikhara";
    case "southeast-asian": return "stupa";
    case "east-asian": return "pagoda";
    case "mesoamerican":
    case "andean": return big ? "pyramid" : "flat";
    case "other-indigenous-american": return big ? "mound" : "tipi";
    default: return "roundhouse";
  }
}

const house = "M0 7V3.5L3 0.5L6 3.5V7Z";
const wall = "M0 7V3H1.5V4.2H3V3H4.5V4.2H6V3H7.5V4.2H9V3H10.5V4.2H12V3H13.5V4.2H15V3H16.5V4.2H18V3H19.5V4.2H21V3H22.5V4.2H24V3H25.5V4.2H27V3H28.5V7Z";

// A village is its landmark alone, a town sets houses beside it, a city
// rings a larger landmark and its houses with a wall.
export function SettlementGlyph({ glyph, rank }: { glyph: Glyph; rank: string }) {
  const city = rank === "city", town = rank === "town";
  const ink = { stroke: "var(--map-glyph-ink)", strokeLinejoin: "round" as const };
  const mark = (x: number, y: number, k: number, fill: string) =>
    <path d={glyphs[glyph]} transform={`translate(${x} ${y}) scale(${k})`} fill={fill} {...ink} strokeWidth={1.1 / k} />;
  const home = (x: number, y: number, k = 1) =>
    <path d={house} transform={`translate(${x} ${y}) scale(${k})`} fill="var(--map-glyph-fill)" {...ink} strokeWidth={0.8 / k} />;
  if (city) return <svg width={44} height={36} viewBox="0 0 30 24" aria-hidden="true">
    {home(3, 12.5)}{home(21, 12.5)}{home(8, 11, 1.1)}{home(16.5, 11.5)}
    {mark(6.5, -0.5, 0.85, "var(--map-glyph-accent)")}
    <path d={wall} transform="translate(0.75 16.5)" fill="var(--map-glyph-fill)" {...ink} strokeWidth={0.7} />
  </svg>;
  if (town) return <svg width={34} height={26} viewBox="0 0 26 20" aria-hidden="true">
    {home(2, 10)}{home(18, 10)}
    {mark(5.5, 0, 0.75, "var(--map-glyph-fill)")}
    <path d="M1 17.5H25" stroke="var(--map-glyph-ink)" strokeWidth={1.1} strokeLinecap="round" />
  </svg>;
  return <svg width={17} height={17} viewBox="0 0 20 20" aria-hidden="true">{mark(0, 0, 1, "var(--map-glyph-fill)")}</svg>;
}
