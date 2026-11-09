import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";

type Piece = "work" | "broken" | "rough" | "done" | "none";
type Who = "door" | "beside" | "corner" | "hearth" | "none";
// For each moment: the piece on the bench, where the other person is, and how the room is lit.
const STATES: Record<string, { piece: Piece; who: Who; dark?: boolean; coin?: boolean; broom?: boolean; fixed?: "lashed" | "new" | "lent" }> = {
  first: { piece: "work", who: "door" },
  slip: { piece: "broken", who: "beside" },
  taught: { piece: "done", who: "beside" },
  afraid: { piece: "work", who: "corner" },
  sulked: { piece: "work", who: "hearth" },
  fetched: { piece: "done", who: "beside", broom: true },
  alone: { piece: "done", who: "door" },
  broke: { piece: "broken", who: "none" },
  worse: { piece: "broken", who: "none" },
  mended: { piece: "done", who: "none", fixed: "lashed" },
  borrowed: { piece: "done", who: "door", fixed: "lent" },
  bought: { piece: "done", who: "none", fixed: "new", coin: true },
  change: { piece: "work", who: "door" },
  withdrawn: { piece: "work", who: "none", dark: true },
  rushed: { piece: "rough", who: "door" },
  stiff: { piece: "done", who: "door" },
  paid: { piece: "done", who: "door", coin: true },
  pleased: { piece: "done", who: "beside", coin: true },
  delivered: { piece: "done", who: "beside" },
  gone: { piece: "work", who: "none" },
  lost: { piece: "broken", who: "none", dark: true },
  late: { piece: "work", who: "none", dark: true },
};

/** A workshop: the bench, the tools on the wall, the hearth and the lit doorway. */
export default function bench(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), fire = rgb(pal.accent);
  const s = STATES[ending ?? ""] ?? { piece: "work", who: "none" };
  const FY = 50, f = Math.floor(t / 170) % 3, dark = !!s.dark;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const g = glow(x, y, 22, 40, dark ? 24 : 50, dark ? 16 : 34, f), d = dark ? 0 : glow(x, y, 132, FY, 34, 26);
      const base = y < FY ? (y % 6 === 0 ? mix(ink, fill, dark ? 0.3 : 0.55) : mix(ink, fill, dark ? 0.5 : 0.8)) : mix(wood, ink, dark ? 0.65 : 0.45);
      px(x, y, g === 2 ? mix(fill, fire, dark ? 0.2 : 0.35) : d === 2 ? mix(fill, light, 0.25) : g === 1 || d === 1 ? mix(fill, fire, dark ? 0.06 : 0.15) : base);
    }
  // The doorway: daylight, or dusk once the day is lost.
  rect(124, 14, 18, FY - 14, dark ? mix(ink, fill, 0.6) : mix(light, fire, 0.2));
  rect(124, FY - 9, 18, 9, dark ? mix(ink, wood, 0.4) : mix(wood, light, 0.45));
  if (dark) rect(136, 18, 2, 2, mix(fill, light, 0.6));
  for (let y = FY; y < EMBLEM_H; y++) rect(124 - (y - FY), y, 18 + (y - FY) * 2, 1, dark ? mix(wood, ink, 0.35) : mix(wood, light, 0.3 - (y - FY) * 0.015));
  rect(122, 12, 22, 2, mix(wood, ink, 0.2));
  rect(122, 14, 2, FY - 14, mix(wood, ink, 0.2));
  // The hearth, low on the left.
  rect(10, FY - 10, 22, 10, mix(wood, ink, 0.3));
  rect(14, FY - 7, 14, 7, mix(ink, fill, 0.2));
  if (!dark) { flame(ctx, 17, FY - 5, f); flame(ctx, 21, FY - 4, (f + 2) % 3); }
  else rect(16, FY - 2, 10, 2, mix(fire, ink, 0.5));
  // Tools on the wall: a saw, a hammer, tongs, a coil of cord.
  const iron = mix(fill, light, 0.35), haft = mix(wood, light, 0.15);
  rect(44, 18, 14, 4, iron); rect(56, 18, 4, 3, haft);
  rect(66, 16, 1, 12, haft); rect(64, 16, 5, 3, iron);
  rect(74, 16, 1, 11, iron); rect(77, 16, 1, 11, iron); rect(74, 16, 4, 1, iron);
  rect(86, 18, 6, 6, haft); rect(88, 20, 2, 2, mix(ink, fill, 0.7));
  rect(40, 30, 64, 1, mix(wood, ink, 0.3));
  const coat = mix(wood, fire, 0.25), skin = mix(wood, light, 0.45), them = mix(fill, light, 0.3);
  person(ctx, 56, FY - 3, 21, coat, skin);
  if (s.who === "beside") person(ctx, 86, FY - 2, 18, mix(fire, ink, 0.3), skin);
  // The bench.
  const top = mix(wood, light, 0.25);
  rect(34, 38, 74, 3, top);
  rect(34, 41, 74, 1, mix(wood, ink, 0.3));
  rect(38, 42, 3, FY - 42 + 2, mix(wood, ink, 0.4)); rect(100, 42, 3, FY - 42 + 2, mix(wood, ink, 0.4));
  const work = mix(wood, light, 0.5), shine = pal.light;
  if (s.piece === "work") { rect(70, 34, 12, 4, work); rect(70, 34, 6, 1, shine); }
  if (s.piece === "rough") { rect(70, 34, 12, 4, work); px(73, 33, work); px(79, 35, mix(wood, ink, 0.4)); }
  if (s.piece === "done") {
    rect(68, 33, 16, 5, work); rect(68, 33, 16, 1, shine);
    if (ending === "pleased" || ending === "paid" || ending === "taught") rect(74, 31, 4, 2, mix(fire, light, 0.3));
  }
  if (s.piece === "broken") {
    rect(64, 35, 9, 3, work);
    for (let i = 0; i < 7; i++) rect(76 + i, 37 - (i >> 1), 2, 1, work);
    if (ending === "broke" || ending === "worse") [[73, 32], [75, 33], [74, 30]].forEach(([x, y]) => px(x, y, pal.accent));
    if (ending !== "broke") { rect(70, FY + 2, 4, 2, work); rect(82, FY + 4, 3, 1, work); }
  }
  if (s.fixed === "lashed") for (let i = 0; i < 3; i++) rect(72 + i * 2, 33, 1, 5, mix(fire, ink, 0.35));
  if (s.fixed === "new") rect(86, 35, 10, 2, mix(light, fire, 0.1));
  if (s.fixed === "lent") rect(86, 35, 10, 2, mix(fill, light, 0.4));
  if (s.coin) for (let i = 0; i < 3; i++) if (t > 300 + i * 200) rect(90 + i * 3, 36, 2, 2, pal.accent);
  const come = ease(t / 900);
  if (s.who === "door") person(ctx, 128 + Math.round(6 * (1 - come)), FY + 3, 16, them, skin);
  if (s.who === "corner") person(ctx, 112, FY + 2, 12, mix(fire, ink, 0.3), skin);
  if (s.who === "hearth") person(ctx, 30, FY + 4, 10, mix(fire, ink, 0.3), skin);
  if (s.broom) { rect(94, 34, 1, 18, haft); rect(92, FY, 5, 2, mix(fire, wood, 0.4)); }
  fadeEdges(ctx, pal.ink);
}
