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

export function SettlementGlyph({ glyph, rank }: { glyph: Glyph; rank: string }) {
  const city = rank === "city", town = rank === "town";
  const size = city ? 28 : town ? 21 : 15;
  return <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d={glyphs[glyph]} fill={city ? "var(--map-glyph-accent)" : "var(--map-glyph-fill)"}
      stroke="var(--map-glyph-ink)" strokeWidth={city ? 0.9 : 1.1} strokeLinejoin="round" />
    {(town || city) && <path
      d={city ? "M0.5 19.5V17H2V18H3.5V17H5V18H6.5V17H8V18H9.5V17H11V18H12.5V17H14V18H15.5V17H17V18H18.5V17H19.5V19.5Z" : "M1 18H19"}
      fill="var(--map-glyph-fill)" stroke="var(--map-glyph-ink)" strokeWidth={city ? 0.8 : 1.4} strokeLinecap="round" />}
  </svg>;
}
