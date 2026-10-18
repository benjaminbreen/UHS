import { describe, expect, it, vi } from "vitest";
import {
  describeAdornment,
  earOrnaments,
  faceMarks,
  generateAdornment,
  generateAppearance,
  generateInjuryScar,
  generateEyeAlignment,
  generateEyeDetail,
  generateBrowConnection,
  injuryScarKinds,
  inheritLikeness,
  noseShapes,
  type CharacterAppearance,
} from "../src/core/character";
import { characterAppearanceSchema } from "../src/runtime/schema";
import { MAT } from "../src/render/portraits/raster";
import { mix } from "../src/render/characters/pixels";
import { appearanceKits } from "../src/content/characters/profiles/communities";
import {
  expressions,
  facePose,
  paintConstructed,
  restingFace,
  type Expression,
} from "../src/render/portraits/constructed";

const base = (over: Partial<CharacterAppearance> = {}): CharacterAppearance => {
  const a = generateAppearance("portrait-test", 3, 30);
  return {
    ...a,
    hair: "cropped",
    beard: "none",
    wearing: {
      ...a.wearing,
      headwear: "none",
      earrings: false,
      necklace: false,
    },
    adornment: { ears: "none", nose: "none", marks: "none" },
    ...over,
  };
};
const pixels = (a: CharacterAppearance, pose = restingFace) =>
  paintConstructed(a, 30, undefined, 0, false, pose).color.join("");

it("keeps an adult chin in front of the neck with a shaded transition beneath it", async () => {
  const { trace } = await import("../src/render/portraits/sculpted");
  const brightness = (c: string) => [1, 3, 5].reduce((sum, i) => sum + parseInt(c.slice(i, i + 2), 16), 0);
  for (const sex of ["male", "female"] as const) {
    const a = base({ hair: "bald", jaw: "original" });
    a.physique = { ...a.physique!, sex, strength: 50, mass: 50 };
    for (const turn of [0, 1]) {
      const r = trace(a, 30, { turn, pitch: 0 }), m = r.m;
      expect(m.jawW).toBeLessThan(m.headW);
      const chinZ = 8 + m.chinOut + m.chinR * 0.72;
      expect(chinZ).toBeGreaterThan(m.neck - 2 + 2);
      const [cx, cy] = r.f.projectHead([0, m.chinY, chinZ]);
      expect(r.mat[cy * 64 + cx]).toBe(MAT.skin);
      const foot = m.chinY - m.chinR * 0.4;
      const points = [1, 6.5].map(drop => r.f.projectBody([0, foot - drop, m.neck - 2]));
      const pixels = points.map(([x, y]) => y * 64 + x);
      expect(pixels.map(i => r.mat[i])).toEqual([MAT.skin, MAT.skin]);
      expect(brightness(r.color[pixels[0]])).toBeLessThan(brightness(r.color[pixels[1]]));
    }
  }
});

it("changes hair silhouettes while keeping facial proportions and eye colour fixed", async () => {
  const { trace } = await import("../src/render/portraits/sculpted");
  const a = base({ hair: "bob" });
  const masks: string[] = [], counts: number[] = [];
  const original = trace(a, 30, { turn: 1, pitch: 0 }).m;
  for (const hairTexture of ["straight", "wavy", "curly", "coiled"] as const) {
    const changed = { ...a, face: { ...a.face!, hairTexture } };
    const r = trace(changed, 30, { turn: 1, pitch: 0 });
    expect(r.m.seed).toBe(original.seed);
    expect([r.m.nose, r.m.eyeX, r.m.iris, r.m.cheek, r.m.headW, r.m.jawW, r.m.mouthW])
      .toEqual([original.nose, original.eyeX, original.iris, original.cheek, original.headW, original.jawW, original.mouthW]);
    masks.push(Array.from(r.mat, m => m === MAT.hair ? "1" : "0").join(""));
    counts.push(r.mat.filter(m => m === MAT.hair).length);
  }
  expect(new Set(masks).size).toBe(4);
  expect(counts[3]).toBeGreaterThan(counts[0]);
  for (const hair of ["cropped", "long", "braid"] as const) {
    const m = trace({ ...a, hair }, 30, { turn: 0, pitch: 0 }).m;
    expect(m.seed).toBe(original.seed);
    expect(m.nose).toEqual(original.nose);
    expect(m.iris).toBe(original.iris);
  }
});

it("leaves visible forehead above the brows for cropped hair and bobs", async () => {
  const { trace } = await import("../src/render/portraits/sculpted");
  const a = base();
  for (const hair of ["cropped", "bob"] as const) for (const hairTexture of ["straight", "wavy", "curly"] as const) {
    const r = trace({ ...a, hair, face: { ...a.face!, hairline: "average", hairTexture } }, 30, { turn: 0, pitch: 0 });
    const [x, y] = r.f.projectHead([0, 9.5, 12]);
    expect(r.mat[y * 64 + x]).toBe(MAT.skin);
  }
});

it("keeps covered hair textures out of the visible face and hood", async () => {
  const { paintSculpted } = await import("../src/render/portraits/sculpted");
  const a = base({ wearing: { ...base().wearing, headwear: "hood" } });
  const original = paintSculpted(a, 30).color;
  for (const hairTexture of ["straight", "wavy", "curly", "coiled"] as const)
    expect(paintSculpted({ ...a, hair: "long", face: { ...a.face!, hairTexture } }, 30).color).toEqual(original);
});

it("ages the same adult anatomy gradually without rerolling identity or mutating its recipe", async () => {
  const { paintSculpted, trace } = await import("../src/render/portraits/sculpted");
  const a = base({ hairColor: "#332419", hair: "cropped" });
  const saved = JSON.stringify(a);
  const ages = [20, 40, 60, 80];
  const models = ages.map(age => trace(a, age, { turn: 1, pitch: 0 }).m);
  const rendered = ages.map(age => paintSculpted(a, age));
  expect(models[1].sag).toBe(0);
  expect(models[2].sag).toBeLessThanOrEqual(1 / 6);
  expect(models[3].sag).toBeGreaterThanOrEqual(2 / 3);
  for (let i = 0; i < ages.length; i++) {
    const m = models[i];
    expect(m.seed).toBe(models[0].seed);
    expect(m.face).toEqual(models[0].face);
    expect([m.headW, m.headH, m.eyeX, m.iris, m.skin]).toEqual([models[0].headW, models[0].headH, models[0].eyeX, models[0].iris, models[0].skin]);
    if (i) {
      expect(m.cheek).toBeLessThan(models[i - 1].cheek);
      expect(m.hairline).toBeGreaterThanOrEqual(models[i - 1].hairline);
      expect(parseInt(m.hair.base.slice(1), 16)).toBeGreaterThanOrEqual(parseInt(models[i - 1].hair.base.slice(1), 16));
      expect(rendered[i].color).not.toEqual(rendered[i - 1].color);
    }
  }
  expect(JSON.stringify(a)).toBe(saved);
  expect(models[3].hair.base).not.toBe(models[0].hair.base);
  expect(paintSculpted(a, 20).color).toEqual(rendered[0].color);
});

it("uses the chosen full and partial brow connection rates with independent draws", () => {
  for (const [sex, rate, full, partial] of [
    ["male", 0.02, 2000, 4000], ["female", 0.02, 4000, 8000],
    ["male", 0.0075, 750, 1500], ["female", 0.0075, 1500, 3000],
  ] as const) {
    const counts = { none: 0, partial: 0, joined: 0 };
    for (let i = 0; i < 100000; i++) counts[generateBrowConnection("brow-rates", i, sex, rate)]++;
    expect(Math.abs(counts.joined - full)).toBeLessThan(full * 0.12);
    expect(Math.abs(counts.partial - partial)).toBeLessThan(partial * 0.12);
  }
  const a = generateAppearance("brow-rates", 7, 36, { sex: "female" });
  expect(a.browConnection).toBe(generateBrowConnection("brow-rates", 7, "female"));
  expect(characterAppearanceSchema.parse({ ...a, browConnection: "joined" }).browConnection).toBe("joined");
  const own = { ...a, browConnection: "none" as const };
  expect(inheritLikeness(own, [{ ...a, browConnection: "joined" }], "brow-family", "child").browConnection).toBe("none");
});

it("connects brows only across the bridge without rerolling anatomy, eyes or expression", async () => {
  const { paintSculpted, trace } = await import("../src/render/portraits/sculpted");
  const a = base({ browConnection: "none" });
  for (const turn of [0, 1]) for (const expression of ["neutral", "angry"] as const) {
    const normal = paintSculpted(a, 30, { turn, expression });
    const traced = trace(a, 30, { turn, pitch: 0 });
    const eyes = [-1, 1].map(side => traced.f.projectHead([side * traced.m.eyeX, 1.8, 11.2]));
    for (const browConnection of ["partial", "joined"] as const) {
      const changed = { ...a, browConnection };
      expect(trace(changed, 30, { turn, pitch: 0 }).color).toEqual(traced.color);
      const drawn = paintSculpted(changed, 30, { turn, expression });
      expect(drawn.color).not.toEqual(normal.color);
      for (let i = 0; i < drawn.color.length; i++) if (drawn.color[i] !== normal.color[i]) {
        expect(i % 64).toBeGreaterThanOrEqual(Math.min(...eyes.map(p => p[0])) - 1);
        expect(i % 64).toBeLessThanOrEqual(Math.max(...eyes.map(p => p[0])) + 1);
        expect(Math.floor(i / 64)).toBeLessThan(Math.max(...eyes.map(p => p[1])) - 2);
      }
    }
  }
});

it("keeps small monolid eyes open and renders the recorded inner fold in either view", async () => {
  const { paintSculpted, trace } = await import("../src/render/portraits/sculpted");
  const a = base();
  a.face = { ...a.face!, eyeSize: "small", eyeShape: "round", eyelid: "monolid", epicanthus: true, detail: "clear" };
  a.eyeDetail = { irisSize: "default", pupilSize: "default", lowerLashes: false };
  a.eyeAlignment = "aligned";
  a.injuryScar = { kind: "none", side: -1 };
  for (const turn of [0, 0.5, 1]) {
    const { m, f } = trace(a, 30, { turn, pitch: 0 });
    const painted = paintSculpted(a, 30, { turn });
    const white = mix(mix("#f1e8dc", m.skin.shade, 0.22), m.skin.shade, 0.2);
    expect(painted.color.filter(c => c === white).length).toBeGreaterThan(0);
    for (const side of [-1, 1]) {
      const c = f.projectHead([side * m.eyeX, 1.8, 11.2]);
      const inner = f.projectHead([side * (m.eyeX - 2.4), 1.8, 11.8]);
      const outer = f.projectHead([side * (m.eyeX + 2.6), 1.8, 10.2]);
      const w = Math.max(3, Math.min(7, Math.abs(outer[0] - inner[0]) + 1));
      const x = c[0] - Math.floor(w / 2) + (side < 0 ? w - 1 : 0);
      expect(painted.color[(c[1] - 1) * 64 + x]).toBe(mix(m.skin.base, m.skin.shade, 0.25));
    }
  }
});

it("keeps eye alignment at 10/89/1 and combined eye details at 60% of women and 40% of men", () => {
  const counts = { inward: 0, aligned: 0, outward: 0, femaleCombined: 0, maleCombined: 0 };
  const femaleVariants = new Set<string>(), maleVariants = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    counts[generateEyeAlignment("eye-rates", i)]++;
    const f = generateEyeDetail("eye-rates", i, "female");
    const m = generateEyeDetail("eye-rates", i, "male");
    if (f.irisSize === "large" && f.pupilSize === "large" && f.lowerLashes) counts.femaleCombined++;
    if (m.irisSize === "large" && m.pupilSize === "large" && m.lowerLashes) counts.maleCombined++;
    femaleVariants.add(JSON.stringify(f)); maleVariants.add(JSON.stringify(m));
  }
  expect(counts.inward).toBeGreaterThan(900); expect(counts.inward).toBeLessThan(1100);
  expect(counts.aligned).toBeGreaterThan(8750); expect(counts.aligned).toBeLessThan(9050);
  expect(counts.outward).toBeGreaterThan(65); expect(counts.outward).toBeLessThan(140);
  expect(counts.femaleCombined).toBeGreaterThan(5850); expect(counts.femaleCombined).toBeLessThan(6150);
  expect(counts.maleCombined).toBeGreaterThan(3850); expect(counts.maleCombined).toBeLessThan(4150);
  expect(femaleVariants.size).toBe(8); expect(maleVariants.size).toBe(8);
  const a = generateAppearance("eye-rates", 7, 36, { sex: "female" });
  expect(a.eyeAlignment).toBe(generateEyeAlignment("eye-rates", 7));
  expect(a.eyeDetail).toEqual(generateEyeDetail("eye-rates", 7, "female"));
  expect(characterAppearanceSchema.parse(a).eyeDetail).toEqual(a.eyeDetail);
  expect(characterAppearanceSchema.parse(a).eyeAlignment).toBe(a.eyeAlignment);
});

it("varies irises, pupils and lashes inside the eye region without changing anatomy or a closed blink", async () => {
  const { paintSculpted, trace } = await import("../src/render/portraits/sculpted");
  const normal = { irisSize: "default", pupilSize: "default", lowerLashes: false } as const;
  const generated = generateAppearance("jewelry-scar-review", 7, 36, { sex: "male" });
  const a: CharacterAppearance = { ...generated, hair: "cropped", beard: "none", eyeAlignment: "aligned", eyeDetail: normal, wearing: { ...generated.wearing, headwear: "none", eyewear: "none" } };
  const variants = [{ ...normal, irisSize: "large" as const }, { ...normal, pupilSize: "large" as const }, { ...normal, lowerLashes: true }];
  for (const eyeDetail of variants) {
    const control = eyeDetail.pupilSize === "large" ? { ...a, eyeDetail: { ...normal, irisSize: "large" as const } } : a;
    const detail = eyeDetail.pupilSize === "large" ? { ...eyeDetail, irisSize: "large" as const } : eyeDetail;
    expect(paintSculpted({ ...control, eyeDetail: detail }, 36).color).not.toEqual(paintSculpted(control, 36).color);
  }
  for (const turn of [0, 0.5, 1]) {
    const traced = trace(a, 36, { turn, pitch: 0 });
    const eyes = [-1, 1].map(side => traced.f.projectHead([side * traced.m.eyeX, 1.8, 11.2]));
    for (const eyeDetail of variants) {
      expect(trace({ ...a, eyeDetail }, 36, { turn, pitch: 0 }).color).toEqual(traced.color);
      expect(paintSculpted({ ...a, eyeDetail }, 36, { turn, blink: 2 }).color).toEqual(paintSculpted(a, 36, { turn, blink: 2 }).color);
      for (const gazeX of [-1, 0, 1]) {
        const original = paintSculpted(a, 36, { turn, gazeX });
        const changed = paintSculpted({ ...a, eyeDetail }, 36, { turn, gazeX });
        for (let i = 0; i < original.color.length; i++) if (original.color[i] !== changed.color[i])
          expect(eyes.some(([x, y]) => Math.abs(i % 64 - x) <= 5 && Math.abs(Math.floor(i / 64) - y) <= 4)).toBe(true);
      }
    }
  }
});

it("rolls adult injury scars at the chosen art rates, separately from scarification", () => {
  const counts = { male: 0, female: 0 };
  for (const sex of ["male", "female"] as const) {
    for (let i = 0; i < 10000; i++) if (generateInjuryScar("scar-rates", i, 36, sex).kind !== "none") counts[sex]++;
    for (const age of [0, 9, 17]) for (let i = 0; i < 100; i++) expect(generateInjuryScar("scar-rates", i, age, sex).kind).toBe("none");
  }
  expect(counts.male).toBeGreaterThan(1900); expect(counts.male).toBeLessThan(2100);
  expect(counts.female).toBeGreaterThan(440); expect(counts.female).toBeLessThan(560);
  const a = generateAppearance("scar-rates", 4, 36, { sex: "male" });
  expect(a.injuryScar).toEqual(generateInjuryScar("scar-rates", 4, 36, "male"));
  expect(a).toEqual(generateAppearance("scar-rates", 4, 36, { sex: "male" }));
  const child = base({ injuryScar: { kind: "none", side: -1 } });
  expect(inheritLikeness(child, [{ ...child, injuryScar: { kind: "burn", side: 1 } }], "family", "child").injuryScar).toEqual(child.injuryScar);
  const marked = { ...a, adornment: { marks: "cheek-lines" as const, markStyle: "scar" as const }, injuryScar: { kind: "cheek" as const, side: -1 as const } };
  expect(characterAppearanceSchema.parse(marked).injuryScar).toEqual(marked.injuryScar);
  expect(characterAppearanceSchema.parse(marked).adornment).toEqual(marked.adornment);
});

it("draws each healed injury scar on the face without repainting clothes", async () => {
  const { paintSculpted } = await import("../src/render/portraits/sculpted");
  const a = base({ hair: "bald", injuryScar: { kind: "none", side: -1 } });
  const plain = paintSculpted(a, 36);
  const seen = new Set<string>();
  for (const kind of injuryScarKinds.filter(k => k !== "none")) {
    const scarred = paintSculpted({ ...a, injuryScar: { kind, side: -1 } }, 36);
    expect(scarred.color).not.toEqual(plain.color);
    for (let i = 0; i < plain.mat.length; i++) if (plain.color[i] !== scarred.color[i]) expect([MAT.skin, 9]).toContain(plain.mat[i]);
    seen.add(scarred.color.join(""));
  }
  expect(seen.size).toBe(injuryScarKinds.length - 1);
  expect(paintSculpted({ ...a, injuryScar: { kind: "cheek", side: -1 } }, 9).color).toEqual(paintSculpted(a, 9).color);
});

it("uses personality only at rest and leaves explicit portrait emotions in control", async () => {
  const { paintSculpted, trace } = await import("../src/render/portraits/sculpted");
  const a = base({ face: { ...base().face!, brows: "straight" } });
  const warm = { ...a, restingPose: { inner: 0, outer: 1, corners: [1, 1] as [number, number] } };
  const wary = { ...a, restingPose: { inner: -1, outer: 0, corners: [-1, -1] as [number, number] } };
  expect(paintSculpted(warm).color).not.toEqual(paintSculpted(wary).color);
  expect(paintSculpted({ ...a, restingPose: { inner: 0, outer: 1, corners: [0, 0] } }).color).not.toEqual(paintSculpted(a).color);
  expect(trace(warm, 30, { turn: 1, pitch: 0 }).color).toEqual(trace(wary, 30, { turn: 1, pitch: 0 }).color);
  for (const expression of ["smile", "angry", "surprised", "tired"] as const)
    expect(paintSculpted(warm, 30, { expression }).color).toEqual(paintSculpted(wary, 30, { expression }).color);
  expect(paintSculpted(warm, 30, { expression: "smile", intensity: 0 }).color).toEqual(paintSculpted(warm).color);
});

it("covers the dangling pale pixels at both tilted outer eye corners", async () => {
  const { paintSculpted } = await import("../src/render/portraits/sculpted");
  const a = generateAppearance("portrait-personality", 4, 32, { sex: "male" });
  a.hair = "cropped"; a.beard = "none";
  a.face = { ...a.face!, brows: "straight" };
  a.wearing = { ...a.wearing, headwear: "none", garment: "tunic", color: "#556f78" };
  a.adornment = { ears: "none", nose: "none", marks: "none" };
  const r = paintSculpted(a, 32);
  expect(r.color[29 * 64 + 28]).toBe(r.color[29 * 64 + 29]);
  expect(r.color[29 * 64 + 44]).toBe(r.color[29 * 64 + 43]);
});

it("shows worn earrings even when no adornment style was recorded", async () => {
  const { paintSculpted } = await import("../src/render/portraits/sculpted");
  const a = base();
  const worn = { ...a, wearing: { ...a.wearing, earrings: true } };
  expect(paintSculpted(worn).color).not.toEqual(paintSculpted(a).color);
  expect(paintSculpted(worn).color).toEqual(paintSculpted({ ...a, adornment: { ears: "drop" } }).color);
  for (const nose of ["stud", "ring", "septum"] as const)
    expect(paintSculpted({ ...a, adornment: { nose } }).color).not.toEqual(paintSculpted(a).color);
});

it("keeps necklaces visible over tailored garments and cheek paint above blush", async () => {
  const { paintSculpted } = await import("../src/render/portraits/sculpted");
  for (const garment of ["shirt", "coat"] as const) {
    const a = base({ wearing: { ...base().wearing, garment } });
    const plain = paintSculpted(a);
    const jewelry = paintSculpted({ ...a, wearing: { ...a.wearing, necklace: true, neckStyle: "chain" } });
    expect(jewelry.mat.filter(m => m === MAT.metal).length).toBeGreaterThan(plain.mat.filter(m => m === MAT.metal).length);
  }
  const a = base({ adornment: { ears: "none", nose: "none", marks: "cheek-lines", markStyle: "paint", markColor: "#b8352c" } });
  const r = paintSculpted(a);
  expect(r.color.filter(c => c === "#b8352c").length).toBe(8);
  for (const style of ["ink", "scar"] as const)
    expect(paintSculpted({ ...a, adornment: { ...a.adornment, markStyle: style, markColor: undefined } }).color).not.toEqual(r.color);
});

it("warms the resting nod off-thread and reports ready only after its pixels arrive", async () => {
  vi.resetModules();
  const jobs: { key: string; appearance: CharacterAppearance; age: number; pose: { turn: number; pitch: number } }[] = [];
  let worker: { onmessage?: (event: { data: object }) => void; onerror?: () => void };
  const terminate = vi.fn();
  vi.stubGlobal("Worker", class {
    onmessage?: (event: { data: object }) => void;
    onerror?: () => void;
    constructor() { worker = this; }
    terminate = terminate;
    postMessage(job: typeof jobs[number]) { jobs.push(job); }
  });
  try {
    const { warmSculpted, sculptedPoseReady, trace } = await import("../src/render/portraits/sculpted");
    const a = base();
    warmSculpted(a, 30, 0, false);
    warmSculpted(a, 30, 0, false);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].pose).toEqual({ turn: 0, pitch: 0.5 });
    expect(sculptedPoseReady(a, 30, 0, 0.5)).toBe(false);
    const { color, mat, layer, depth } = trace(a, 30, jobs[0].pose);
    worker!.onmessage?.({ data: { key: jobs[0].key, color, mat, layer, depth } });
    expect(sculptedPoseReady(a, 30, 0, 0.5)).toBe(true);
    expect(sculptedPoseReady(a, 31, 0, 0.5)).toBe(false);
    warmSculpted(a, 30, 1);
    expect(jobs.some((job) => job.pose.turn === 1 && job.pose.pitch === 0.5)).toBe(true);
    expect(jobs.filter((job) => job.pose.pitch === 0).map((job) => job.pose.turn).sort())
      .toEqual([0, 0.25, 0.5, 0.75, 1]);
    worker!.onerror?.();
    expect(terminate).toHaveBeenCalledTimes(1);
    const before = jobs.length;
    warmSculpted(a, 30, 1, false);
    expect(jobs).toHaveLength(before + 1);
  } finally {
    vi.unstubAllGlobals();
    vi.resetModules();
  }
});

describe("portrait expressions", () => {
  it("rests when nothing is asked of the face", () => {
    expect(facePose("neutral")).toEqual(restingFace);
    expect(facePose("happy", 0)).toEqual(restingFace);
    expect(pixels(base(), facePose("neutral"))).toBe(pixels(base()));
  });
  it("draws a different face for every named expression", () => {
    const drawn = new Map<string, Expression>();
    for (const expression of expressions) {
      const key = pixels(base(), facePose(expression));
      expect(drawn.has(key)).toBe(false);
      drawn.set(key, expression);
    }
    expect(drawn.size).toBe(expressions.length);
  });
  it("scales a pose, so a change can be played rather than cut to", () => {
    const half = facePose("laugh", 0.5);
    const full = facePose("laugh", 1);
    expect(half.mouthOpen).toBe(full.mouthOpen / 2);
    expect(pixels(base(), half)).not.toBe(pixels(base(), full));
    expect(pixels(base(), half)).not.toBe(pixels(base()));
  });
});

describe("portrait ornament", () => {
  it("draws every ear ornament, and differently", () => {
    const drawn = new Set(
      earOrnaments.map((ears) =>
        pixels(base({ adornment: { ears, nose: "none", marks: "none" } })),
      ),
    );
    expect(drawn.size).toBe(earOrnaments.length);
  });
  it("draws every face mark, and never over an eye or a hat", () => {
    const drawn = new Set(
      faceMarks.map((marks) =>
        pixels(base({ adornment: { marks, ears: "none", nose: "none" } })),
      ),
    );
    expect(drawn.size).toBe(faceMarks.length);
  });
  it("marks skin and nothing else", () => {
    // Everything a hat, hood, beard or garment covers stays covered, and no
    // line is drawn through an eye.
    for (const headwear of ["none", "hood", "helmet"] as const) {
      const wearing = { ...base().wearing, headwear };
      for (const marks of faceMarks) {
        const plain = paintConstructed(
          base({ wearing, adornment: { marks: "none" } }),
        );
        const inked = paintConstructed(base({ wearing, adornment: { marks } }));
        for (let i = 0; i < plain.color.length; i++)
          if (plain.color[i] !== inked.color[i])
            expect(plain.mat[i]).toBe(MAT.skin);
      }
    }
  });
  it("keeps marks and stretched lobes off small children", () => {
    const pools = {
      ears: ["spool"] as const,
      nose: ["ring"] as const,
      marks: ["cheek-lines"] as const,
    };
    const child = generateAdornment("seed", 0, 6, "female", pools);
    expect(child.marks).toBe("none");
    expect(child.nose).toBe("none");
    expect(child.ears).toBe("stud");
    expect(generateAdornment("seed", 0, 30, "female", pools).marks).toBe(
      "cheek-lines",
    );
  });
  it("honours a kit's sex convention for nose ornaments", () => {
    const pools = { nose: ["ring"] as const, noseSex: "female" as const };
    expect(generateAdornment("seed", 0, 30, "female", pools).nose).toBe("ring");
    expect(generateAdornment("seed", 0, 30, "male", pools).nose).toBe("none");
  });
  it("is deterministic and survives a save round trip", () => {
    const a = generateAppearance("adorn", 7, 30);
    expect(a.adornment).toEqual(generateAppearance("adorn", 7, 30).adornment);
    expect(characterAppearanceSchema.safeParse(a).success).toBe(true);
  });
  it("only draws ornaments a kit actually names", () => {
    for (const kit of appearanceKits) {
      const pools = kit.adornment ?? {};
      for (const ears of pools.ears ?? []) expect(earOrnaments).toContain(ears);
      for (const marks of pools.marks ?? []) expect(faceMarks).toContain(marks);
      // A pool with no "none" in it puts an ornament on every single person.
      if (pools.marks) expect(pools.marks).toContain("none");
      if (pools.ears) expect(pools.ears).toContain("none");
    }
  });
});

describe("portrait noses", () => {
  it("draws all nine profiles, and differently", () => {
    const drawn = new Set(
      noseShapes.map((nose) =>
        pixels(base({ face: { ...base().face!, nose } })),
      ),
    );
    expect(drawn.size).toBe(noseShapes.length);
  });
});

describe("saying what the portrait shows", () => {
  it("names each ornament and mark, and says nothing when there is none", () => {
    expect(describeAdornment(base())).toEqual([]);
    const notes = describeAdornment(
      base({
        adornment: {
          ears: "spool",
          nose: "septum",
          marks: "cheek-lines",
          markStyle: "scar",
          metal: "bone",
        },
        wearing: { ...base().wearing, necklace: true },
      }),
    );
    expect(notes.map((n) => n.kind)).toEqual(["ear", "nose", "neck", "mark"]);
    expect(notes[0].label).toBe("Bone spool in a stretched lobe");
    expect(notes[3].label).toBe("Lines across both cheeks, cut into the skin");
  });
  it("describes a worn pair of earrings the recipe never styled", () => {
    const notes = describeAdornment(
      base({
        adornment: undefined,
        wearing: { ...base().wearing, earrings: true },
      }),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0].label).toBe("Gold drop earring");
  });
  it("has a phrase for every shape the painter can draw", () => {
    for (const ears of earOrnaments)
      expect(
        describeAdornment(base({ adornment: { ears } })).length,
      ).toBe(ears === "none" ? 0 : 1);
    for (const marks of faceMarks) {
      const notes = describeAdornment(base({ adornment: { marks } }));
      expect(notes.length).toBe(marks === "none" ? 0 : 1);
      if (marks !== "none") expect(notes[0].label).not.toMatch(/undefined/);
    }
  });
});
