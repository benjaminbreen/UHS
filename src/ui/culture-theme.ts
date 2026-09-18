import type { CultureId } from "../content/history/types";

/**
 * Per-culture dressing for the character panel: the painted night scene behind
 * it, an accent colour, and a woven border strip. Scenes live in
 * public/ui/scenes; a culture with no modern variant keeps its premodern one.
 */
const accents: Record<CultureId, string> = {
  european: "#8fb4e3",
  "north-african-west-asian": "#e3b455",
  "inner-eurasian": "#c9784f",
  "south-asian": "#ef7a86",
  "east-asian": "#5fc0a8",
  "southeast-asian": "#9bd05a",
  "west-central-african": "#b884d8",
  "east-southern-african": "#e2743f",
  mesoamerican: "#63c8e0",
  andean: "#ce5f9a",
  "other-indigenous-american": "#d8c05a",
  "australian-pacific": "#55a8c9",
};

/** Cultures with a painted modern scene as well as the premodern one. */
const modernScenes = new Set<CultureId>(["european"]);
const MODERN_FROM = 1900;

export function sceneFor(culture?: CultureId, year?: number) {
  const id = culture ?? "european";
  const modern =
    year !== undefined && year >= MODERN_FROM && modernScenes.has(id);
  return `/ui/scenes/${id}${modern ? "-modern" : ""}.webp`;
}

export function accentFor(culture?: CultureId) {
  return accents[culture ?? "european"];
}

/**
 * Motif tiles, drawn once each as SVG on a 40-wide box and repeated down the
 * strip. Colours are substituted at build time so the accent drives them.
 */
const motifs: Record<CultureId, (a: string, g: string) => string> = {
  // Lozenge lattice with an eight-point star, the Slavic and Nordic band.
  european: (a, g) =>
    `<path d="M20 2 38 20 20 38 2 20Z" fill="none" stroke="${g}" stroke-width="1.5"/>
     <path d="M20 8 32 20 20 32 8 20Z" fill="none" stroke="${a}" stroke-width="1"/>
     <path d="M20 13v14M13 20h14M15 15l10 10M25 15l-10 10" stroke="${a}" stroke-width="1"/>
     <path d="M0 20h4M36 20h4" stroke="${g}" stroke-width="1.5"/>`,
  // Interlaced octagon and eight-point star.
  "north-african-west-asian": (a, g) =>
    `<path d="M20 3 26 9h8v8l6 3-6 3v8h-8l-6 6-6-6H6v-8l-6-3 6-3V9h8Z" fill="none" stroke="${g}" stroke-width="1.4"/>
     <path d="M20 10 24 16 30 20 24 24 20 30 16 24 10 20 16 16Z" fill="none" stroke="${a}" stroke-width="1.1"/>`,
  // Running horn-curl scroll of the steppe.
  "inner-eurasian": (a, g) =>
    `<path d="M4 2c12 0 12 16 0 16s-12-16 0-16" fill="none" stroke="${a}" stroke-width="1.6"/>
     <path d="M36 22c-12 0-12 16 0 16s12-16 0-16" fill="none" stroke="${a}" stroke-width="1.6"/>
     <path d="M2 20h36" stroke="${g}" stroke-width="1.2"/>`,
  // Lotus petals over a dotted kolam ground.
  "south-asian": (a, g) =>
    `<path d="M20 4c8 6 8 16 0 22-8-6-8-16 0-22Z" fill="none" stroke="${a}" stroke-width="1.3"/>
     <path d="M20 10c14 2 16 10 16 16M20 10C6 12 4 20 4 26" fill="none" stroke="${g}" stroke-width="1.1"/>
     <circle cx="20" cy="33" r="2" fill="${a}"/><circle cx="8" cy="33" r="1.4" fill="${g}"/><circle cx="32" cy="33" r="1.4" fill="${g}"/>`,
  // Seigaiha wave arcs.
  "east-asian": (a, g) =>
    `<path d="M0 26a20 20 0 0 1 40 0" fill="none" stroke="${g}" stroke-width="1.4"/>
     <path d="M6 26a14 14 0 0 1 28 0" fill="none" stroke="${a}" stroke-width="1.2"/>
     <path d="M12 26a8 8 0 0 1 16 0" fill="none" stroke="${a}" stroke-width="1"/>
     <path d="M0 38a20 20 0 0 1 40 0" fill="none" stroke="${g}" stroke-width="1.4"/>`,
  // Tumpal: the bamboo-shoot triangle band of batik and songket.
  "southeast-asian": (a, g) =>
    `<path d="M4 38 20 6 36 38Z" fill="none" stroke="${g}" stroke-width="1.4"/>
     <path d="M10 38 20 18 30 38Z" fill="none" stroke="${a}" stroke-width="1.1"/>
     <circle cx="20" cy="30" r="2" fill="${a}"/>`,
  // Kente-style stripe with concentric diamonds.
  "west-central-african": (a, g) =>
    `<path d="M20 2 34 20 20 38 6 20Z" fill="none" stroke="${a}" stroke-width="1.3"/>
     <path d="M20 12 27 20 20 28 13 20Z" fill="${a}" opacity="0.35"/>
     <path d="M0 6h40M0 34h40" stroke="${g}" stroke-width="1.6"/>`,
  // Ndebele stepped blocks.
  "east-southern-african": (a, g) =>
    `<path d="M4 4h14v8h10v10h8" fill="none" stroke="${a}" stroke-width="2"/>
     <path d="M36 36H22v-8H12v-8H4" fill="none" stroke="${g}" stroke-width="2"/>`,
  // Greca: the stepped fret of Mitla.
  mesoamerican: (a, g) =>
    `<path d="M2 34V14h10v12h8V6h18" fill="none" stroke="${a}" stroke-width="2"/>
     <path d="M2 38h36" stroke="${g}" stroke-width="1.6"/>`,
  // Interlocking step-frets around a chakana cross.
  andean: (a, g) =>
    `<path d="M14 2h12v6h6v6h6v12h-6v6h-6v6H14v-6H8v-6H2V14h6V8h6Z" fill="none" stroke="${g}" stroke-width="1.3"/>
     <path d="M17 14h6v3h3v6h-3v3h-6v-3h-3v-6h3Z" fill="${a}" opacity="0.5"/>`,
  // Zigzag bands over chevrons.
  "other-indigenous-american": (a, g) =>
    `<path d="M0 10 10 2l10 8 10-8 10 8" fill="none" stroke="${a}" stroke-width="1.6"/>
     <path d="M0 24 10 16l10 8 10-8 10 8" fill="none" stroke="${g}" stroke-width="1.6"/>
     <path d="M0 38 10 30l10 8 10-8 10 8" fill="none" stroke="${a}" stroke-width="1.6"/>`,
  // Tapa cloth: triangle rows and a dotted rule.
  "australian-pacific": (a, g) =>
    `<path d="M2 16 10 4l8 12Z" fill="${a}" opacity="0.45"/>
     <path d="M22 16 30 4l8 12Z" fill="none" stroke="${a}" stroke-width="1.2"/>
     <path d="M2 24h36" stroke="${g}" stroke-width="1.2"/>
     <circle cx="10" cy="32" r="2" fill="${g}"/><circle cx="20" cy="32" r="2" fill="${a}"/><circle cx="30" cy="32" r="2" fill="${g}"/>`,
};

const cache = new Map<string, string>();

/** A tiling background-image value for the panel's left border strip. */
export function patternFor(culture?: CultureId) {
  const id = culture ?? "european";
  const hit = cache.get(id);
  if (hit) return hit;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">` +
    motifs[id](accents[id], "#b9903f") +
    `</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  cache.set(id, url);
  return url;
}
