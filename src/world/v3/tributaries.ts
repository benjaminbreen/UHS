import { random } from "../../core/random";
import type { Stream } from "./features";

type Field = (x: number, y: number) => number;

export function tributary(
  seed: string,
  id: string,
  start: number[],
  water: Field,
  height: Field,
  tierOf: (height: number) => number,
): Stream | undefined {
  const points = [start];
  const phase = random(seed, id, "bend-phase") * Math.PI * 2;
  const wavelength = 28 + random(seed, id, "bend-length") * 24;
  let travelled = 0;
  for (let step = 0; step < 90; step++) {
    const [x, y] = points[points.length - 1];
    const here = water(x, y);
    if (here < -2) break;
    const gx = water(x + 2, y) - water(x - 2, y);
    const gy = water(x, y + 2) - water(x, y - 2);
    const bend =
      Math.sin(phase + (travelled * Math.PI * 2) / wavelength) * 1.15;
    const heading =
      Math.atan2(-gy, -gx) + bend * Math.min(1, Math.max(0, here / 8));
    let best: number[] | undefined;
    let score = Infinity;
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const nx = x + Math.cos(angle) * 2,
        ny = y + Math.sin(angle) * 2;
      const distance = water(nx, ny);
      if (distance >= here - 0.2) continue;
      const climb = Math.max(0, height(nx, ny) - height(x, y));
      const cost = 1 - Math.cos(angle - heading) + climb * 8;
      if (cost < score) {
        score = cost;
        best = [nx, ny];
      }
    }
    if (!best) return undefined;
    points.push(best);
    travelled += 2;
  }
  const end = points[points.length - 1];
  if (points.length < 8 || water(end[0], end[1]) >= -2) return undefined;
  const smooth = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    smooth.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
    smooth.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  smooth.push(end);
  let tier = Infinity;
  const tiers = smooth.map(
    ([x, y]) => (tier = Math.min(tier, tierOf(height(x, y)))),
  );
  const falls = tiers.flatMap((t, i) => (i && t < tiers[i - 1] ? [i] : []));
  return {
    points: smooth,
    tiers,
    falls,
    pond: false,
    bounds: [
      Math.min(...smooth.map((p) => p[0])) - 8,
      Math.min(...smooth.map((p) => p[1])) - 8,
      Math.max(...smooth.map((p) => p[0])) + 8,
      Math.max(...smooth.map((p) => p[1])) + 8,
    ],
  };
}
