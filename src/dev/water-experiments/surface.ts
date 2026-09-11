import { scenery, obstacleField } from "./scenery";
import { waterNoise, waterHash } from "../../render/water-style";
import { WIDTH as W, HEIGHT as H, beachExtent, type Settings } from "./model";

const ramps = {
  tropical: [
    "#c4f4cf",
    "#8fe5c8",
    "#50d4cb",
    "#29b9cc",
    "#169ec6",
    "#1080b6",
    "#0c64a2",
    "#0a4b86",
    "#113969",
  ],
  green: [
    "#cde7a5",
    "#9cd9ae",
    "#63c6a9",
    "#30ac9e",
    "#188e96",
    "#117589",
    "#155c79",
    "#184765",
    "#213957",
  ],
  blue: [
    "#c2eee1",
    "#8bdde3",
    "#55c7e2",
    "#29acdb",
    "#188bc9",
    "#126bb5",
    "#13529b",
    "#173c7e",
    "#202e61",
  ],
  polar: [
    "#deece5",
    "#bcd9d5",
    "#92c3cc",
    "#71aabf",
    "#558ea9",
    "#426f91",
    "#365778",
    "#304361",
    "#2c354e",
  ],
};
const rgb = (s: string) =>
  [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
export function animatedSurface(
  field: Float32Array,
  s: Settings,
  system: "tiles" | "depth",
) {
  const obstacles = obstacleField(scenery(field, s), s);
  const colors = ramps[s.palette].map(rgb),
    data = new Uint8ClampedArray(W * H * 4);
  const bed = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      bed[i] = waterNoise(x, y, 49, 15) * 1.4 + waterNoise(x, y, 19, 16) * 0.5;
    }
  const flowTexture = new Float32Array(512 * 512);
  const periodic = (
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    salt: number,
  ) => {
    const gx = x / scaleX,
      gy = y / scaleY,
      ix = Math.floor(gx),
      iy = Math.floor(gy);
    const fx = gx - ix,
      fy = gy - iy;
    const at = (a: number, b: number) =>
      waterHash(a % (512 / scaleX), b % (512 / scaleY), salt);
    return (
      (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) +
      (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy
    );
  };
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++)
      flowTexture[y * 512 + x] =
        periodic(x, y, 32, 16, 51) * 0.7 + periodic(x, y, 8, 4, 52) * 0.3;
  const flowAt = (x: number, y: number) =>
    flowTexture[(Math.floor(y) & 511) * 512 + (Math.floor(x) & 511)];
  return (time: number) => {
    const motion =
      s.strength * (s.kind === "pond" ? 0.12 : s.kind === "lake" ? 0.38 : 1);
    const t =
      (system === "tiles" ? Math.floor(time * 10) / 10 : time) *
      (motion === 0 ? 0 : 1);
    const dx =
      s.kind === "river" ? Math.cos((s.direction * Math.PI) / 180) : 0.15;
    const dy =
      s.kind === "river" ? Math.sin((s.direction * Math.PI) / 180) : -1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x,
          d = field[i];
        if (d <= 0) {
          data[i * 4 + 3] = 0;
          continue;
        }
        const u = x + obstacles.u[i] - t * dx * (7 + motion * 3),
          v =
            y +
            obstacles.v[i] -
            t * dy * (7 + motion * 3) +
            obstacles.wake[i] * Math.sin(t * 2 + y * 0.2) * 3;
        const warp =
          Math.sin(v / 19 + t * 0.35) * 5 + Math.sin(u / 33 - v / 27) * 5;
        const a = Math.sin((u + warp) / 12 + Math.sin(v / 16) * 1.3);
        const b = Math.sin(v / 8 + Math.sin(u / 23 + t * 0.2) * 1.7);
        const wave = Math.sin(
          (x * dx + y * dy - obstacles.delay[i]) / 17 -
            t * (1.3 + motion * 0.3) +
            Math.sin(x / 32) * 0.7,
        );
        const depth = Math.min(
          6.8,
          Math.max(
            0,
            (d * (s.kind === "coast" ? 0.58 : 0.95)) /
              (1 + Math.max(0, beachExtent(s) - 0.7) * 0.35) +
              bed[i] -
              0.8,
          ),
        );
        let tone: number,
          caustic = 0;
        const cluster = flowAt(u + warp * 0.5, v);
        const detail = flowAt(u * 2 + 13, v * 2 + 57);
        if (system === "tiles") {
          // Advected, interlocking color clusters supply the surface, including the deep water.
          tone =
            depth + ((cluster - 0.5) * 2.8 + wave * 0.26) * Math.min(1, motion);
          tone += (detail - 0.5) * 0.6;
        } else {
          const refraction = (a + b) * 0.18 * Math.min(1, motion);
          tone = depth * 0.82 + refraction + wave * 0.35 * Math.min(1, motion);
          const net = Math.abs(
            Math.sin((u + warp + (cluster - 0.5) * 12) / 7) +
              Math.sin(v / 7 + Math.sin(u / 16) + (detail - 0.5) * 2),
          );
          caustic =
            d < 6
              ? (net < 0.1 ? 0.5 : net < 0.2 ? 0.2 : 0) *
                s.clarity *
                Math.min(1, d * 2)
              : 0;
          tone += (detail - 0.5) * 0.4;
        }
        const k = Math.max(0, Math.min(8, Math.floor(tone + 1)));
        const next = Math.min(8, k + 1),
          mix =
            system === "tiles"
              ? 0
              : Math.floor((Math.max(0, tone + 1) % 1) * 2) / 2;
        for (let channel = 0; channel < 3; channel++)
          data[i * 4 + channel] =
            (colors[k][channel] * (1 - mix) + colors[next][channel] * mix) *
              (1 - caustic) +
            colors[0][channel] * caustic;
        // Small broken facets prevent large uniform contour fills without single-pixel noise.
        if (system === "tiles" && detail > 0.66 && cluster > 0.48) {
          const highlight = colors[Math.max(0, k - 1)];
          for (let channel = 0; channel < 3; channel++)
            data[i * 4 + channel] = highlight[channel];
        }
        if (
          s.kind === "coast" &&
          s.strength >= 2 &&
          wave > 1 - (0.012 + s.foamWidth * 0.09) &&
          detail > s.foamBreakup * 0.8 &&
          !obstacles.solid[i] &&
          d > 1
        ) {
          const foam = colors[0];
          for (let channel = 0; channel < 3; channel++)
            data[i * 4 + channel] = Math.round(
              data[i * 4 + channel] * (1 - s.foamOpacity) +
                (foam[channel] * 0.7 + 255 * 0.3) * s.foamOpacity,
            );
        }
        data[i * 4 + 3] = 255;
      }
    return new ImageData(data, W, H);
  };
}
