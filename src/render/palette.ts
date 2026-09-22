import law from "../content/graphics/palette.json" with { type: "json" };

type Rgb = readonly number[];
const lin = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const gam = (c: number) =>
  Math.round(
    255 *
      Math.min(1, Math.max(0, c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)),
  );
export function toOklab([r, g, b]: Rgb): [number, number, number] {
  const R = lin(r),
    G = lin(g),
    B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B),
    m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B),
    s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
export function fromOklab(L: number, a: number, b: number): number[] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const cache = new Map<number, number[]>();
/** Darken or lighten by `dv` (8-bit steps, as the old equal-RGB offsets were)
 * under the shared law: shadows lean cool and hold their colour, lights lean
 * warm and give a little up. Adding the same number to R, G and B is a
 * brightness slider, which is what made ramps read as one flat colour. */
export function shade(color: Rgb, dv: number): number[] {
  const rgb = [Math.round(color[0]), Math.round(color[1]), Math.round(color[2])];
  dv = Math.round(dv);
  if (!dv) return rgb;
  const key =
    ((rgb[0] & 255) << 24) ^ ((rgb[1] & 255) << 16) ^ ((rgb[2] & 255) << 8) ^ ((dv + 128) & 255);
  let out = cache.get(key);
  if (out) return out;
  const [L, a, b] = toOklab(rgb);
  const side = dv < 0 ? law.shadow : law.light,
    pull = Math.min(1, Math.abs(dv) / law.fullLeanAt);
  let C = Math.hypot(a, b),
    H = Math.atan2(b, a);
  // Near-greys have no hue to turn; give them a trace of the target instead.
  const target = (side.hue * Math.PI) / 180;
  if (C > 0.012) {
    let d = target - H;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const step = (side.lean * Math.PI) / 180 * pull;
    H += Math.sign(d) * Math.min(Math.abs(d), step);
    C *= 1 + (side.chroma - 1) * pull;
  } else {
    const t = 0.006 * pull,
      x = a + Math.cos(target) * t,
      y = b + Math.sin(target) * t;
    C = Math.hypot(x, y);
    H = Math.atan2(y, x);
  }
  out = fromOklab(L + (dv / 255) * 0.92, Math.cos(H) * C, Math.sin(H) * C);
  if (cache.size > 60000) cache.clear();
  cache.set(key, out);
  return out;
}
export const mottle = law.mottle;
