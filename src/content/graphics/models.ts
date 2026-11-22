import boats from "./boats.generated.json" with { type: "json" };
import worksites from "./worksites.json" with { type: "json" };
import type modelsJson from "./models.generated.json";
import rawModels from "./models.generated.json?raw";
/** Compiled from content recipes by npm run art; shared by generator, game and lab. */
export type BuildingModel = (typeof modelsJson)[keyof typeof modelsJson];
// The modern street kit (172 models) is compiled with `bounds` and the
// anchor's height in some other frame than the sprite's, which drew each one
// ten cells west of its lot. Its occlusion is right: the sprite is that wide
// and four pixels taller, standing on the row below it. Fix in scripts/art.
/** Rows of empty sprite above what one of those models draws. */
const clearTop = new Map<unknown, number>();
type ModelShape = { anchor: number[]; bounds: number[]; occlusion?: number[]; height?: number; visible?: number[] };
function normalizeModel(model: ModelShape) {
  const o = model.occlusion;
  if (o && model.bounds[3] < o[3]) {
    model.bounds = [0, 0, o[2], o[3] + 4];
    delete model.visible;
    model.anchor = [model.anchor[0], o[3] + 1];
    if (model.height) clearTop.set(model, Math.max(0, o[3] - model.height - 8));
  }
  return model;
}
function lazyModels(source: string): Record<string, BuildingModel> {
  // Parsing all ~13.6k building models up front costs ~60 MB in V8 (~220 MB in
  // WebKit JSC) on each thread while a session uses only a couple hundred.
  const keys: string[] = [];
  const slots = new Map<string, number>();
  const starts: number[] = [];
  const ends: number[] = [];
  const len = source.length;
  let i = 0;
  while (i < len && source.charCodeAt(i) !== 123) i++;
  i++;
  while (i < len) {
    while (i < len) {
      const c = source.charCodeAt(i);
      if (c === 34 || c === 125) break;
      i++;
    }
    if (i >= len || source.charCodeAt(i) === 125) break;
    const keyStart = ++i;
    while (i < len && source.charCodeAt(i) !== 34) {
      if (source.charCodeAt(i) === 92) i++;
      i++;
    }
    const key = source.slice(keyStart, i);
    i++;
    while (i < len && source.charCodeAt(i) !== 58) i++;
    i++;
    while (i < len && source.charCodeAt(i) <= 32) i++;
    const valStart = i;
    let depth = 0, inStr = false;
    while (i < len) {
      const c = source.charCodeAt(i);
      if (inStr) {
        if (c === 92) i++;
        else if (c === 34) inStr = false;
      } else if (c === 34) {
        inStr = true;
      } else if (c === 123 || c === 91) {
        depth++;
      } else if (c === 125 || c === 93) {
        depth--;
        if (depth === 0) { i++; break; }
      }
      i++;
    }
    slots.set(key, keys.length);
    keys.push(key);
    starts.push(valStart);
    ends.push(i);
  }
  const sArr = Int32Array.from(starts), eArr = Int32Array.from(ends);
  const parsed = new Map<string, ModelShape>();
  const load = (key: string) => {
    let model = parsed.get(key);
    if (model) return model;
    const slot = slots.get(key);
    if (slot === undefined) return undefined;
    model = normalizeModel(JSON.parse(source.slice(sArr[slot], eArr[slot])) as ModelShape);
    parsed.set(key, model);
    return model;
  };
  return new Proxy({} as Record<string, BuildingModel>, {
    get(_, prop) { return typeof prop === "string" ? load(prop) : undefined; },
    has(_, prop) { return typeof prop === "string" && slots.has(prop); },
    ownKeys() { return keys; },
    getOwnPropertyDescriptor(_, prop) {
      return typeof prop === "string" && slots.has(prop)
        ? { enumerable: true, configurable: true }
        : undefined;
    },
  });
}
export const buildingModels: Record<string, BuildingModel> =
  typeof rawModels === "string"
    ? lazyModels(rawModels)
    : (() => {
        const models = rawModels as unknown as Record<string, ModelShape>;
        for (const model of Object.values(models)) normalizeModel(model);
        return models as unknown as Record<string, BuildingModel>;
      })();
export const waterborneFrames = new Set(Object.entries(worksites)
  .filter(([,s])=>"waterborne" in s && s.waterborne)
  .flatMap(([name])=>[name,...["north","east","west"].map(f=>`${name}-${f}`)])
  .concat(Object.entries(boats).flatMap(([name,spec])=>spec.finishes.flatMap(finish=>
    Array.from({length:8},(_,f)=>["","-back","-front"].map(layer=>`boat-${name}${finish}-${f}${layer}`)).flat()))));
/** A roof you can walk about on. Packed earth is laid flat; the models' own
 * `roof: "flat"` is a recipe default that boats and Gothic churches carry too.
 * An earth granary is a dome, and courts, pyramids and work yards are open. */
export function walkableRoof(frame: string) {
  const m = buildingModels[frame] as { roofMaterial?: string; serviceStyle?: string } | undefined;
  return !!m && m.roofMaterial === "earth" && !m.serviceStyle &&
    !/^(precinct|religious-meso|meso-ballcourt)-/.test(frame) &&
    (!frame.startsWith("worksite-") || /caravanserai|store-sahel|earth-fishing-house/.test(frame));
}

/** Street looks drawn for one business, by family name. */
const LOOK_BUSINESS: Record<string, string> = {
  pub: "pub", bank: "bank", chambers: "offices", office: "offices", emporium: "department store", diner: "diner",
  drivein: "burger drive-in", market: "supermarket", motel: "motel", gas: "gas station", theatre: "cinema",
};
/** What a frame's art shows at its street door: a named business ("cafe"),
 * an unnamed "shop", or nothing for a house. Whoever is put in the building
 * and how the door is treated follow this, so a cafe is never someone's
 * private home. Street looks declare their sign boards; the older families'
 * shop and stall forms are drawn with an open shop. */
export function shopArt(frame: string): string | undefined {
  const model = buildingModels[frame] as { business?: string; shopSigns?: unknown[]; role?: string } | undefined;
  if (!model) return undefined;
  if (model.business) return model.business.startsWith("residential") ? undefined : model.business;
  const look = LOOK_BUSINESS[/^mod-([a-z-]+?)-\d/.exec(frame)?.[1] ?? ""];
  if (look) return look;
  if (model.shopSigns?.length || model.role === "shop") return "shop";
  return !frame.startsWith("mod-") && /-urban-(shop|stall)(-(north|east|west))?$/.test(frame) ? "shop" : undefined;
}

export function buildingModel(frame: string): BuildingModel {
  const model = buildingModels[frame];
  if (!model) throw new Error(`Missing building model: ${frame}`);
  return model;
}

/** Every world tile the building's drawing covers: footprint, eaves, roof,
 * and any step drawn below. */
export function buildingArtCells(
  frame: string,
  rect: { x: number; y: number; w: number; h: number },
) {
  const model = buildingModel(frame);
  const drawX = rect.x * 16 + rect.w * 8 - model.anchor[0];
  const drawY = rect.y * 16 + rect.h * 16 - model.anchor[1];
  // Only the painted height: side gaps between neighbours are the town's
  // walkways, and the canvas width keeps them.
  const left = Math.floor(drawX / 16);
  const right = Math.ceil((drawX + model.bounds[2]) / 16);
  const top = Math.floor((drawY + ((model as { visible?: number[] }).visible?.[1] ?? clearTop.get(model) ?? 0)) / 16);
  const bottom = Math.ceil((drawY + model.bounds[3]) / 16);
  const cells: { x: number; y: number }[] = [];
  for (let y = top; y < bottom; y++)
    for (let x = left; x < right; x++) cells.push({ x, y });
  return cells;
}

/** World tiles above a building footprint occupied by its drawn roof and
 * upper wall. Props behind the house keep out of these cells so they do not
 * read as sitting on the roof. */
export function buildingRoofCells(
  frame: string,
  rect: { x: number; y: number; w: number; h: number },
) {
  return buildingArtCells(frame, rect).filter((p) => p.y < rect.y);
}
