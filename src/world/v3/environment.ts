import { boundaryWater } from "./boundary-water";
import { landscapeRecipe } from "../../content/ecology/landscapes";
import { drainageAt } from "./drainage";
import { tributary } from "./tributaries";
import { boundarySample } from "../travel/seams";
import { trimCache } from "../../core/cache";
import { marshBasin } from "./wet-features";
import { floodReach, waterscape } from "../../content/geography/waterscapes";
import type { WorldSetting } from "../../content/geography/types";
import { habitatLayout } from "../../content/ecology/variants";
import {
  STREAM_BLOCK,
  streamDistance,
  joinStream,
  streamKind,
  walkStream,
  type Stream,
} from "./features";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { regionalLandforms } from "./landforms";
import { cenoteDistance, formCeiling, metresPerTier, placeAltitude, reshape, snowlineAt, terrainFormOf } from "./terrain-forms";
import { noise } from "../geography/noise";
import { random } from "../../core/random";
import { toAtlas, atlasSample } from "../geography/atlas";
import type { RegionalContext } from "../regional/context";
import type { LandSample } from "../geography/landscape";
const seasons = ["spring", "summer", "autumn", "winter"] as const;
/** Geography is sampled independently of settlements and player circumstances. */
export function createEnvironment(
  s: WorldSetting,
  seed: string,
  regional?: RegionalContext,
) {
  const cfg = s.environment!;
  const ws = waterscape(s);
  const byS = seasons.map((season) => waterscape({ ...s, season }));
  const simpleWater = !!s.hydrologyRevision;
  const connectedWater = (s.hydrologyRevision ?? 0) >= 2;
  const origin = toAtlas(s.lon, s.lat);
  const plan = regionalLandforms(
    s,
    seed,
    regional
      ? (x, y) =>
          regional.settingAt(x - origin.x, y - origin.y, false).environment!
            .landform
      : undefined,
    regional ? (x, y) => regional.reliefAt(x - origin.x, y - origin.y) : undefined,
  );
  const configuredPlan =
    regional && s.geographyMode === "configured"
      ? regionalLandforms(s, seed)
      : undefined;
  const blendWeight = (x: number, y: number) =>
    configuredPlan
      ? // A bounded map is a portrait of its place, so the recipe owns the whole
        // playable area and Earth geography does not bleed into its corners.
        s.playableMap
        ? 1
        : Math.max(0, Math.min(1, (384 - Math.hypot(x, y)) / 192))
      : 0;
  const baseField = (x: number, y: number) => {
    const global = plan.field(
      regional ? x + origin.x : x,
      regional ? y + origin.y : y,
    );
    const weight = blendWeight(x, y);
    return configuredPlan && weight
      ? global * (1 - weight) + configuredPlan.field(x, y) * weight
      : global;
  };
  const form = terrainFormOf(s);
  const reshaped = new Map<number, number>();
  const field = form
    ? (x: number, y: number) => {
        const key = x * 2097152 + y;
        let h = reshaped.get(key);
        if (h === undefined) {
          const place = regional?.placeAt(x, y);
          const c = place ? regional!.local(place) : { x: 0, y: 0 };
          // reshape keeps 30 cells clear; a big town keeps clear to 60% of its
          // radius. A 140-cell radius is a farm's catchment, not built ground.
          const core = place && place.radius < 100 ? Math.max(30, place.radius * 0.6) : 30;
          h = reshape(form, seed, baseField(x, y), x + origin.x, y + origin.y, Math.hypot(x - c.x, y - c.y) - core + 30);
          trimCache(reshaped, 131072);
          reshaped.set(key, h);
        }
        return h;
      }
    : baseField;
  const altitude = placeAltitude(s);
  const atlasCache = new Map<string, ReturnType<typeof atlasSample>>();
  const fineCache = new Map<string, ReturnType<typeof atlasSample>>();
  function earth(x: number, y: number) {
    const ax = x + origin.x,
      ay = y + origin.y;
    const gx = Math.floor(ax / 32) * 32,
      gy = Math.floor(ay / 32) * 32;
    const key = `${gx},${gy}`;
    let broad = atlasCache.get(key);
    if (!broad) {
      broad = atlasSample(gx + 16, gy + 16);
      trimCache(atlasCache, 4096);
      atlasCache.set(key, broad);
    }
    if (Math.abs(broad.coast) >= 64 && broad.river >= 64) return broad;
    // Distance to a shore changes by at most a cell per cell, so a sample at
    // the middle of a four-cell block is within three cells of the truth.
    // Exact sampling is only needed where that error would move the water.
    const fine = (fx: number, fy: number) => {
      const fineKey = `${fx},${fy}`;
      let mid = fineCache.get(fineKey);
      if (!mid) {
        mid = atlasSample(fx + 2, fy + 2);
        trimCache(fineCache, 16384);
        fineCache.set(fineKey, mid);
      }
      return mid;
    };
    const mid = fine(Math.floor(ax / 4) * 4, Math.floor(ay / 4) * 4);
    if (Math.abs(mid.coast) < 12 || mid.river < 12) return atlasSample(ax, ay);
    // Between block middles the distance is interpolated: taken whole, the
    // sea's depth stepped every four cells and its swell drew the blocks.
    const u = (ax - 2) / 4,
      v = (ay - 2) / 4,
      ix = Math.floor(u),
      iy = Math.floor(v),
      tx = u - ix,
      ty = v - iy;
    const corner = [fine(ix * 4, iy * 4), fine(ix * 4 + 4, iy * 4), fine(ix * 4, iy * 4 + 4), fine(ix * 4 + 4, iy * 4 + 4)];
    const blend = (k: "coast" | "river") =>
      (corner[0][k] * (1 - tx) + corner[1][k] * tx) * (1 - ty) + (corner[2][k] * (1 - tx) + corner[3][k] * tx) * ty;
    return { ...mid, coast: blend("coast"), river: corner.every((c) => Number.isFinite(c.river)) ? blend("river") : mid.river };
  }
  // Meanders: the query point slides sideways to the channel by an amount
  // that varies along it, so a ruler-straight atlas centreline or planned
  // course bends into loops while the channel keeps its width. A 2-D warp
  // did this too, but it also stretched the distance field into wide pools.
  const sway = (t: number) =>
    (noise(seed, t, 0, 70, "meander") - 0.5) * 30 +
    (noise(seed, t, 0, 25, "meander-2") - 0.5) * 8;
  const meander = (x: number, y: number): [number, number] => {
    if (connectedWater && regional && s.geographyMode !== "configured") {
      // A shared continuous warp cannot jump when the nearest river segment changes.
      return [
        x + (noise(seed, x + origin.x, y + origin.y, 90, "river-warp-x") - 0.5) * 12,
        y + (noise(seed, x + origin.x, y + origin.y, 90, "river-warp-y") - 0.5) * 12,
      ];
    }
    const ax = regional ? x + origin.x : x,
      ay = regional ? y + origin.y : y;
    if (regional) {
      // Whichever channel is nearer: the atlas river or a regional feature
      // river such as a named town's own channel.
      const a = earth(x, y);
      let river = a.river,
        flow = a.riverFlow;
      if (river > 60) {
        const f = regional.featureAt(x, y, ["river"]);
        if (!f || Math.abs(f.distance) > 60) return [x, y];
        river = Math.abs(f.distance);
        flow = f.flow;
      }
      const [tx, ty] = flow;
      const len = Math.hypot(tx, ty) || 1;
      const ux = tx / len,
        uy = ty / len;
      const along = ax * ux + ay * uy;
      const shift = sway(along) * Math.min(1, Math.max(0, (60 - river) / 20));
      return [x - uy * shift, y + ux * shift];
    }
    return s.water === "river-ew" ? [x, y - sway(ax)] : [x - sway(ay), y];
  };
  // Open water from the big sources only, for stream walks to end at.
  const openWater = (x: number, y: number): number => {
    if (connectedWater) return (s.hydrologyRevision === 3 ? nativeWater(x, y) : mainWater(x, y)).water;
    const [mx, my] = meander(x, y);
    if (simpleWater && s.geographyMode === "configured")
      return s.water.startsWith("river")
        ? (configuredPlan ?? plan).river(mx, my).water
        : 1000;
    if (regional) {
      const a = earth(mx, my);
      const feature = simpleWater ? regional.featureAt(mx, my, ["land", "sea", "lake", "river"]) : undefined;
      if (simpleWater && feature)
        return feature.feature.kind === "land" ? -feature.distance : feature.distance;
      return Math.min(simpleWater ? a.coast : Math.abs(a.coast), a.river - 4);
    }
    return s.water.startsWith("river") ? plan.river(mx, my).water : 1000;
  };
  // How many steps the ground may climb: a floodplain tops out at two, a
  // mountain range at four or five. More than that on one hillside draws
  // a rule every few cells, so a range reads by its faces, not their count.
  const ceilingOf = (relief: number) => Math.max(2, 1 + relief * 3.5, form ? formCeiling[form] : 0);
  // Spread across the landform's whole working range rather than fixed bands.
  const tierOfHeight = (h: number, ceiling: number) => {
    const t = Math.min(1, Math.max(0, (h - 0.28) / 0.52));
    return Math.min(Math.round(ceiling), Math.round(Math.pow(t, 1.15) * ceiling));
  };
  /** `thin`: a rivulet, about a cell of water across. */
  type Walked = { stream: Stream; kind: "creek" | "arroyo" | "trail"; ceiling: number; thin?: boolean };
  const streamBlocks = new Map<string, Walked[]>();
  const joinedBlocks = new Map<string, Walked[]>();
  // Streams are walked a block at a time, blind to each other: left alone
  // they cross and run in pairs. Each yields to those ranked before it,
  // creeks before rivulets, so the small water gathers into the larger.
  const streamsIn = (bx: number, by: number) => {
    const key = `${bx},${by}`;
    let list = joinedBlocks.get(key);
    if (list) return list;
    const joins = (w: Walked) => w.kind === "arroyo" || (w.kind === "creek" && connectedWater);
    const near: { w: Walked; rank: string; own: boolean }[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        walkedIn(bx + dx, by + dy).forEach((w, i) => {
          if (joins(w)) near.push({ w, rank: `${w.thin ? 1 : 0},${by + dy},${bx + dx},${i}`, own: !dx && !dy });
        });
    near.sort((a, b) => (a.rank < b.rank ? -1 : 1));
    list = walkedIn(bx, by).filter((w) => !joins(w));
    const settled: Walked[] = [];
    for (const { w, own } of near) {
      const stream = joinStream(
        w.stream,
        settled.filter((o) => o.kind === w.kind).map((o) => o.stream),
        (x, y) => tierOfHeight(terraceHeight(Math.round(x), Math.round(y), w.ceiling), w.ceiling),
      );
      if (!stream) continue;
      settled.push({ ...w, stream });
      if (own) list.push({ ...w, stream });
    }
    trimCache(joinedBlocks, 64);
    joinedBlocks.set(key, list);
    return list;
  };
  const walkedIn = (bx: number, by: number) => {
    const key = `${bx},${by}`;
    let list = streamBlocks.get(key);
    if (list) return list;
    list = [];
    const ox = regional ? origin.x : 0,
      oy = regional ? origin.y : 0;
    const local = regional
      ? regional.settingAt(bx * STREAM_BLOCK + 96 - ox, by * STREAM_BLOCK + 96 - oy)
      : s;
    const env = local.environment!;
    const kind = streamKind(env.ecology, env.colorway);
    const relief = Math.max(
      regional?.reliefAt(bx * STREAM_BLOCK + 96 - ox, by * STREAM_BLOCK + 96 - oy) ?? 0,
      s.relief ?? 0,
      0.1,
    );
    const ceiling = ceilingOf(relief);
    // Search near real outlets; dry blocks need not contain a stream.
    if (kind) {
      const count = connectedWater ? 2 : simpleWater ? 1 : 2 + Math.floor(random(seed, "stream-count", bx, by) * 3);
      const candidates: { p: number[]; score: number }[] = [];
      for (let i = 0; i < (connectedWater ? 28 : 14); i++) {
        const cx = bx * STREAM_BLOCK + 8 + random(seed, "spring-x", bx, by, i) * (STREAM_BLOCK - 16) - ox,
          cy = by * STREAM_BLOCK + 8 + random(seed, "spring-y", bx, by, i) * (STREAM_BLOCK - 16) - oy;
        const w = openWater(cx, cy);
        if (w < (connectedWater ? 20 : 14) || (simpleWater && kind === "creek" && w > 90) || (regional && regional.placeAt(cx, cy))) continue;
        const near = w < 90 ? 1 - Math.abs(w - 40) / 60 : 0;
        candidates.push({
          p: [Math.round(cx), Math.round(cy)],
          score: field(cx, cy) + near * 0.5 + random(seed, "spring-roll", bx, by, i) * 0.1,
        });
      }
      candidates.sort((a, b) => b.score - a.score);
      const taken: number[][] = [];
      // After the creeks, a few rivulets from the springs left over.
      const rivulets = connectedWater && kind === "creek" ? 3 : 0;
      for (const c of candidates) {
        if (taken.length >= count + rivulets) break;
        const thin = taken.length >= count;
        if (taken.some(([tx, ty]) => Math.hypot(tx - c.p[0], ty - c.p[1]) < (thin ? 28 : 40))) continue;
        const stream = connectedWater && kind === "creek"
          ? tributary(seed, `${kind}-${bx}-${by}-${taken.length}`, c.p, openWater, (x, y) => terraceHeight(Math.round(x), Math.round(y), ceiling), (h) => tierOfHeight(h, ceiling))
          : walkStream(
          seed,
          `${kind}-${bx}-${by}-${taken.length}`,
          c.p,
          // A wash runs on the ground the terraces are cut from, so it keeps
          // to the low of each one and leaves it where the rim dips.
          kind === "arroyo" ? (x, y) => terraceHeight(Math.round(x), Math.round(y), ceiling) : field,
          // Inside the channel proper, not merely near its bank.
          (x, y) => openWater(x, y) < -2,
          (h) => tierOfHeight(h, ceiling),
          60,
          0.006,
          (x, y) => Math.min(120, openWater(x, y)),
          kind === "arroyo" ? "wash" : !simpleWater,
        );
        if (!stream || (simpleWater && kind === "creek" && stream.pond)) continue;
        // Through a town's outskirts is fine (roads bridge it, houses keep
        // off water); through its centre is not.
        if (
          regional &&
          stream.points.some(([px, py]) => {
            const place = regional.placeAt(px, py);
            if (!place) return false;
            const c0 = regional.local(place);
            return Math.max(Math.abs(px - c0.x), Math.abs(py - c0.y)) < place.radius * 0.5;
          })
        )
          continue;
        list.push({ stream, kind, ceiling, ...(thin ? { thin } : {}) });
        taken.push(c.p);
      }
    }
    // Animal trails: pasture to water, across open country.
    if (
      ["grassland", "savanna", "dry-scrub"].includes(env.ecology) &&
      random(seed, "trail-present", bx, by) < 0.6
    ) {
      const cx = bx * STREAM_BLOCK + 32 + random(seed, "trail-x", bx, by) * (STREAM_BLOCK - 64) - ox,
        cy = by * STREAM_BLOCK + 32 + random(seed, "trail-y", bx, by) * (STREAM_BLOCK - 64) - oy;
      if (openWater(cx, cy) > 16 && openWater(cx, cy) < 150) {
        const trail = walkStream(
          seed,
          `trail-${bx}-${by}`,
          [Math.round(cx), Math.round(cy)],
          (x, y) => openWater(x, y) / 400,
          (x, y) => openWater(x, y) < 3,
          () => 0,
          36,
          0.0012,
        );
        if (trail) list.push({ stream: trail, kind: "trail", ceiling });
      }
    }
    trimCache(streamBlocks, 64);
    streamBlocks.set(key, list);
    return list;
  };
  const streamsNear = (x: number, y: number) => {
    const ax = regional ? x + origin.x : x,
      ay = regional ? y + origin.y : y;
    const bx = Math.floor(ax / STREAM_BLOCK),
      by = Math.floor(ay / STREAM_BLOCK);
    const out: Walked[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) out.push(...streamsIn(bx + dx, by + dy));
    return out;
  };
  const stationTiers = new Map<string, number>();
  // The height the terraces are cut from: the landform, plus lobes about a
  // step tall so a hillside's brinks run in spurs and bays rather than as
  // parallel rules, then a median over a disc, which rounds corners and
  // drops any plateau, pit or sliver too small to stand on.
  const lobed = new Map<number, number>();
  const lobedHeight = (x: number, y: number, ceiling: number) => {
    const key = x * 2097152 + y;
    let h = lobed.get(key);
    if (h === undefined) {
      const fx = regional ? x + origin.x : x,
        fy = regional ? y + origin.y : y;
      h =
        field(x, y) +
        ((noise(seed, fx, fy, 46, "terrace-lobe") - 0.5) * 2.4 +
          (noise(seed, fx, fy, 17, "terrace-bay") - 0.5) * 1) *
          (0.52 / ceiling);
      trimCache(lobed, 262144);
      lobed.set(key, h);
    }
    return h;
  };
  const DISC: [number, number][] = [];
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 10) DISC.push([dx, dy]);
  const window = new Float64Array(DISC.length);
  // Callers pass whole cells: `lobed` keys on them, and a stream walk's
  // fractional points each cost 37 uncached fields and churned the cache.
  const terraceHeight = (x: number, y: number, ceiling: number) => {
    for (let i = 0; i < DISC.length; i++) window[i] = lobedHeight(x + DISC[i][0], y + DISC[i][1], ceiling);
    return window.sort()[DISC.length >> 1];
  };
  const cache = new Map<number, LandSample>();
  const nativeWater = (x: number, y: number) => {
    const fx = regional ? x + origin.x : x,
      fy = regional ? y + origin.y : y;
    const wx = x + (noise(seed, x, y, 75, "shore-warp-x") - 0.5) * 36,
      wy = y + (noise(seed, x, y, 87, "shore-warp-y") - 0.5) * 36;
    let waterFlow: readonly [number, number] = [0, 0];
    // Stable distance along the river course, for the step ladder. Atlas
    // rivers project onto their fixed flow; planned ones report it directly.
    let riverAlong: number | undefined;
    let water = 1000,
      floodplain = 3,
      shoreWidth = 2,
      kind: LandSample["kind"] = "river";
    if (
      s.water.startsWith("river") &&
      (!regional || s.geographyMode === "configured")
    ) {
      const r = (simpleWater ? configuredPlan ?? plan : plan).river(...meander(x, y));
      ({ water, floodplain, shoreWidth, waterFlow } = r);
      riverAlong = r.along;
    } else if (s.water.startsWith("coast")) {
      const signed =
        s.water === "coast-n"
          ? wy
          : s.water === "coast-s"
            ? -wy
            : s.water === "coast-e"
              ? -wx
              : wx;
      water = signed + 35 + (noise(seed, x, y, 27, "headlands") - 0.5) * 13;
      kind = "sea";
      shoreWidth = 2 + noise(seed, x, y, 46, "beaches") * 9;
      floodplain = shoreWidth + 3;
    } else if (s.water === "island") {
      // A whole small island drawn at map scale: this is a portrait of the
      // place, not a true-scale window onto it, so the sea closes all round.
      const lobes =
        (noise(seed, x, y, 71, "island-lobes") - 0.5) * 46 +
        (noise(seed, x, y, 29, "island-bays") - 0.5) * 20;
      water = 108 + lobes - Math.hypot(wx * 1.12, wy * 0.96);
      kind = "sea";
      shoreWidth = 2 + noise(seed, x, y, 44, "island-beaches") * 7;
      floodplain = shoreWidth + 4;
    } else if (s.water === "ocean") {
      // Open water, with the occasional bar or rock breaking the surface.
      const bar = noise(seed, x, y, 54, "sandbars") - (s.hydrologyRevision === 3 && s.playableMap ? Math.max(0, Math.hypot(x, y) - s.playableMap.size * 0.32) / 250 : 0);
      water = bar > 0.88 ? (bar - 0.88) * 170 - 5 : -22 - (0.88 - bar) * 44;
      kind = "sea";
      shoreWidth = 1.5 + noise(seed, x, y, 33, "bar-edges") * 2;
      floodplain = shoreWidth + 3;
    } else if (s.water === "lake") {
      // Overlapping distorted basins create coves and uneven shores.
      const a = Math.hypot((wx + 42) / 24, (wy - 19) / 29),
        b = Math.hypot((wx + 29) / 19, (wy - 35) / 21);
      water =
        (Math.min(a, b) - 1) * 24 +
        (noise(seed, x, y, 19, "lake-shore") - 0.5) * 4;
      kind = "lake";
      shoreWidth = 0.7 + noise(seed, x, y, 25, "lake-margin") * 3;
      floodplain = shoreWidth + noise(seed, x, y, 40, "lake-flat") * 7;
    }
    if (s.hydrologyRevision !== 3 && cfg.ecology === "wetland" && s.water === "none") {
      const pool = noise(seed, x, y, 24, "pools");
      if (pool > 0.72) {
        water = (0.72 - pool) * 70;
        kind = "lake";
      }
    }
    if (regional) {
      const [mx, my] = meander(x, y);
      const atlas = earth(mx, my);
      const riverWidth = 4 + noise(seed, fx, fy, 130, "atlas-river-width") * 3;
      const bankShape =
        (noise(seed, fx, fy, 13, "regional-coves") - 0.5) * 5 +
        (noise(seed, fx, fy, 37, "regional-bars") - 0.5) * 3;
      const riverWater = Math.min(
        atlas.river - riverWidth - bankShape,
        atlas.river - 2.5,
      );
      const coast = connectedWater ? earth(x, y).coast : atlas.coast;
      const earthWater = Math.min(coast, riverWater);
      // Explorer recipes constrain a bounded starting area; beyond it the same
      // generator returns to Earth geography, rather than extending a coast forever.
      const weight = blendWeight(x, y);
      water =
        weight === 1
          ? water
          : weight === 0
            ? earthWater
            : water * weight + Math.min(1000, earthWater) * (1 - weight);
      if (weight < 0.5) {
        kind = coast < riverWater ? "sea" : "river";
        shoreWidth =
          kind === "sea" ? 3 + noise(seed, fx, fy, 45, "beach-width") * 6 : 2;
        floodplain =
          kind === "river"
            ? 4 + noise(seed, fx, fy, 80, "floodplain") * 9
            : shoreWidth;
        waterFlow = atlas.riverFlow;
        riverAlong = fx * atlas.riverFlow[0] + fy * atlas.riverFlow[1];
      }
      const feature = s.hydrologyRevision === 3 && weight === 1 && (s.water === "ocean" || s.water === "island") ? undefined : regional.featureAt(mx, my, [
        "land",
        "sea",
        "lake",
        "river",
      ]);
      if (feature) {
        const type = feature.feature.kind;
        if (type === "river" || type === "sea" || type === "lake") {
          const localBank =
            (noise(seed, fx, fy, 15, "feature-coves") - 0.5) * 5;
          // Atlas centrelines are ruler segments. A slow sideways warp, the
          // same on both banks, turns them into meanders; a faster one
          // roughens the line. Both fade out away from the channel.
          const featureWater =
            type === "river" && Math.abs(feature.distance) < 9
              ? feature.distance -
                localBank * Math.max(0, 1 - Math.max(0, -feature.distance) / 4)
              : feature.distance;
          if (!connectedWater || featureWater < water) {
            water = featureWater;
            kind = type;
            waterFlow = feature.flow;
          }
        } else if (type === "land") water = Math.max(0.1, -feature.distance);
      }
    }
    const swamp = s.hydrologyRevision === 2 && (regional?.habitatAt(x, y) ?? s.environment)?.colorway === "swamp";
    if (swamp && water > -1.2 && water < 24 && kind !== "sea") {
      const spread = 3 + noise(seed, fx, fy, 24, "swamp-inundation") * 9;
      water = Math.max(-1.2, water - spread);
      shoreWidth = 1.1;
      floodplain = Math.max(floodplain, 12);
    }
    let reef: LandSample["reef"];
    if (ws.reef === "atoll") {
      // A portrait of the atoll: a ring of motus round its lagoon, the
      // village on the southern rim, passes through the reef elsewhere.
      const R = 58,
        rx = (x + wx) / 2,
        ry = (y + wy) / 2 + R;
      const r = Math.hypot(rx, ry),
        a = Math.atan2(ry, rx);
      const pass = Math.hypot(x, y) > 30 && noise(seed, Math.cos(a) * 40, Math.sin(a) * 40, 9, "atoll-passes") < 0.32;
      water = 3 + noise(seed, fx, fy, 23, "motu-width") * 4 - (pass ? 9 : 0) - Math.abs(r - R);
      kind = "sea";
      shoreWidth = 2.5 + noise(seed, fx, fy, 31, "motu-beach") * 2;
      floodplain = shoreWidth + 4;
      waterFlow = [0, 0];
      // The village's own motu is wide enough to hold it.
      water = Math.max(water, 36 - Math.hypot(x, y));
      reef = r < R ? "lagoon" : "outer";
    } else if (ws.reef === "fringing" && kind === "sea") reef = "outer";
    return { water, floodplain, shoreWidth, waterFlow, kind, riverAlong, reef };
  };
  const connectedBoundary = boundaryWater(s, seed, nativeWater, field);
  const mainWater = (x: number, y: number) => {
    const native = nativeWater(x, y);
    return s.hydrologyRevision === 3 ? { ...native, ...connectedBoundary(x, y, native) } : native;
  };
  // A qanat's line of shaft mounds, one every seven cells, from the hills to the town.
  const qanatAngle = random(seed, "qanat-angle") * Math.PI * 2;
  const qanat = (x: number, y: number, water: number): LandSample["landscape"] => {
    if (ws.works !== "qanat" || water < 3) return undefined;
    const ux = Math.cos(qanatAngle),
      uy = Math.sin(qanatAngle);
    const k = Math.round((x * ux + y * uy) / 7);
    if (k < 2 || k > 18) return undefined;
    const bend = (noise(seed, k * 7, 0, 40, "qanat-bend") - 0.5) * 12;
    return Math.floor(k * 7 * ux - uy * bend) === x && Math.floor(k * 7 * uy + ux * bend) === y
      ? { kind: "qanat", strength: 1 }
      : undefined;
  };
  const calculate = (x: number, y: number): LandSample => {
    const situation = s.situation;
    if (situation && (situation.landform !== "local" || Math.hypot(x, y) < (situation.camp === "expedition" ? 27 : 32))) {
      const island = situation.landform === "islet";
      const land = situation.landform === "local";
      // Signed ellipse dimensions are cell counts; coastline noise cannot swallow a five-cell island.
      const nx = (x + (situation.width % 2 ? 0 : .5)) / (situation.width / 2), ny = (y + (situation.depth % 2 ? 0 : .5)) / (situation.depth / 2);
      const water = land ? 1000 : island ? (1 - Math.hypot(nx, ny)) * Math.min(situation.width, situation.depth) / 2 : -40;
      return { water, shoreWidth: island ? 6 : 0, waterFlow: [0, 0], kind: "sea",
        moisture: .3, elevation: 0, summit: land ? 112 : 0,
        snow: land && s.climate === "tundra" };
    }
    const habitat = regional?.habitatAt(x, y) ?? s.environment!;
    const profile = ecologyProfiles[habitat.ecology];
    const fx = regional ? x + origin.x : x,
      fy = regional ? y + origin.y : y;
    let { water, floodplain, shoreWidth, waterFlow, kind, riverAlong, reef } = s.hydrologyRevision === 3 ? nativeWater(x, y) : mainWater(x, y);
    const town = regional
      ? (() => {
          const place = regional.placeAt(x, y);
          if (!place) return false;
          const c0 = regional.local(place);
          return Math.max(Math.abs(x - c0.x), Math.abs(y - c0.y)) < place.radius * 0.5;
        })()
      : Math.hypot(x, y) < 16;
    let dike = false;
    let reaches: number[] | undefined, wetPlaya: number | undefined;
    let waterGradientOverride: readonly [number, number] | undefined;
    // Distributaries: the contours of two smooth fields cross the delta plain
    // as a web of channels round low islands, the town on its own mound.
    if (ws.delta && water > 1.5 && !town) {
      const web =
        Math.min(
          Math.abs(noise(seed, fx, fy, 46, "delta-a") - 0.5) * 64,
          Math.abs(noise(seed, fx + 311, fy - 97, 70, "delta-b") - 0.5) * 98,
        ) - (0.9 + noise(seed, fx, fy, 30, "delta-width") * 1.5);
      if (web < water) {
        water = web;
        kind = "river";
        shoreWidth = 1.4;
      }
    }
    if (ws.delta) floodplain = Math.max(floodplain, 40);
    // Each season's flood, laid over the dry ground at the end.
    if (kind === "river" && water >= -1 && !town && byS.some((w) => w.flood > 0))
      reaches = byS.map((w) => floodReach(w, floodplain, s.climate));
    if (ws.works === "polder" && !town && water > 2) {
      // Straight drainage ditches across the reclaimed land, a raised dike
      // along the open water.
      dike = water < 3.4 && kind !== "lake";
      const axis = random(seed, "polder-axis") < 0.5;
      const u = axis ? fx : fy,
        v = axis ? fy : fx;
      const ditch = Math.min(((u % 11) + 11) % 11, 11 - (((u % 11) + 11) % 11)) - 0.55,
        drain = Math.min(((v % 44) + 44) % 44, 44 - (((v % 44) + 44) % 44)) - 0.7;
      if (!dike && Math.min(ditch, drain) < water) {
        water = Math.min(ditch, drain);
        kind = "lake";
        shoreWidth = 0.9;
        waterFlow = [0, 0];
        waterGradientOverride = ditch < drain ? (axis ? [1, 0] : [0, 1]) : axis ? [0, 1] : [1, 0];
        const side = ditch < drain ? (((u % 11) + 11) % 11 < 5.5 ? 1 : -1) : (((v % 44) + 44) % 44 < 22 ? 1 : -1);
        waterGradientOverride = [waterGradientOverride[0] * side, waterGradientOverride[1] * side];
      }
      floodplain = Math.max(floodplain, 40);
    }
    if (ws.works === "chinampa" && (kind !== "sea" || water > 0)) {
      // The lake the Valley of Mexico has since lost: the city on its island,
      // open water round it, the far shore two lake-widths off.
      const r = Math.hypot(x + (noise(seed, fx, fy, 40, "texcoco-x") - 0.5) * 24, y + (noise(seed, fx, fy, 40, "texcoco-y") - 0.5) * 24);
      const lake = Math.max(44 - r, r - 130);
      if (lake < water) {
        water = lake;
        kind = "lake";
        shoreWidth = 1.5;
      }
    }
    if (ws.works === "chinampa" && kind !== "river" && water < 0 && water > -36 && !town) {
      // Long raised beds of lake mud between canals, in a grid off the shore.
      const u = ((fx % 6) + 6) % 6,
        v = ((fy % 22) + 22) % 22;
      water =
        u < 4 && v < 20
          ? Math.min(u + 0.5, 3.5 - u, v + 0.5, 19.5 - v) * 0.6
          : -Math.max(u < 4 ? 0 : Math.min(u - 3.5, 5.5 - u), v < 20 ? 0 : Math.min(v - 19.5, 21.5 - v)) - 0.4;
      kind = "lake";
      shoreWidth = 0.5;
      floodplain = 40;
      waterFlow = [0, 0];
    }
    // Oxbows: a crescent of still water on the floodplain, its horns toward
    // the river, in the green envelopes.
    if (
      !simpleWater &&
      kind === "river" &&
      water > 5 &&
      water < 18 &&
      !["desert", "dry-scrub", "tundra"].includes(habitat.ecology)
    ) {
      const bx = Math.floor(fx / 48),
        by = Math.floor(fy / 48);
      if (random(seed, "oxbow", bx, by) < 0.4) {
        const cxAbs = bx * 48 + 8 + random(seed, "oxbow-x", bx, by) * 32,
          cyAbs = by * 48 + 8 + random(seed, "oxbow-y", bx, by) * 32;
        const cx = cxAbs - (regional ? origin.x : 0),
          cy = cyAbs - (regional ? origin.y : 0);
        const ow = openWater(cx, cy);
        if (ow > 7 && ow < 15) {
          const r = 5 + random(seed, "oxbow-r", bx, by) * 3;
          const gx = openWater(cx + 3, cy) - openWater(cx - 3, cy),
            gy = openWater(cx, cy + 3) - openWater(cx, cy - 3);
          const g = Math.hypot(gx, gy) || 1;
          const dist = Math.hypot(x - cx, y - cy) || 1;
          const ring = Math.abs(dist - r);
          const dot = ((x - cx) * gx + (y - cy) * gy) / (g * dist);
          if (ring < 1.6 && dot > -0.35 && !regional?.placeAt(x, y)) {
            water = ring - 1.6 + (noise(seed, fx, fy, 5, "oxbow-rim") - 0.5) * 0.5;
            kind = "lake";
            shoreWidth = 0.8;
            floodplain = 1.4;
            waterFlow = [0, 0];
          }
        }
      }
    }
    // Landscape streams: a creek from a spring to open water or a pond, a dry
    // arroyo in dry country, an animal trail from pasture to water.
    let landscape: LandSample["landscape"] = qanat(x, y, water);
    let fall = false;
    let waterGradient: LandSample["waterGradient"] = waterGradientOverride;
    let creekTier: number | undefined;
    let creekMargin = false;
    let washTier: number | undefined;
    const preCreek = { water, floodplain };
    for (const { stream, kind: sort, thin } of streamsNear(x, y)) {
      const d = streamDistance(stream, x, y, connectedWater ? 8 : 4);
      if (!d) continue;
      if (sort === "creek") {
        // Two cells of water widening downstream, a narrow gravel edge, and a
        // plunge pool below each fall.
        const plunge = stream.falls.some(
          (f) => Math.hypot(x - stream.points[f][0], y - stream.points[f][1]) < 2.8,
        );
        const width = thin
          ? // Water is decided a cell at a time: under 0.71 a diagonal run breaks into beads.
            0.74 + d.along * 0.12 + (noise(seed, fx, fy, 7, "creek-width") - 0.5) * 0.06 + (plunge ? 0.5 : 0)
          : (connectedWater ? 0.8 : 0.55) +
            d.along * (connectedWater ? 0.7 : 0.45) +
            (noise(seed, fx, fy, 7, "creek-width") - 0.5) * 0.3 +
            (plunge ? 0.7 : 0);
        const pool = stream.pond ? d.toEnd - (3 + noise(seed, fx, fy, 6, "pond-rim") * 1.4) : Infinity;
        const creekWater = Math.min(d.distance - width, pool);
        if (d.distance < width + 6 && water > 3) {
          creekMargin = true;
          creekTier = stream.tiers[Math.min(stream.tiers.length - 1, d.vertex)];
        }
        // The creek's distance field runs six cells out so the shore raster
        // interpolates smoothly; the terrace rule below ignores it (a small
        // distance would otherwise read as a floodplain and flatten a ring).
        if (creekWater < water && (simpleWater || water > 3) && creekWater < 6) {
          water = creekWater;
          waterGradient =
            pool < d.distance - width
              ? (() => {
                  const [ex, ey] = stream.points[stream.points.length - 1];
                  const len = Math.hypot(x - ex, y - ey) || 1;
                  return [(x - ex) / len, (y - ey) / len] as const;
                })()
              : d.gradient;
          kind = pool < d.distance - width ? "lake" : "river";
          shoreWidth = thin ? 0.45 : 0.9;
          floodplain = 1.8;
          const i = Math.min(stream.points.length - 2, Math.floor(d.along * (stream.points.length - 1)));
          const [ax, ay] = stream.points[i],
            [bx, by] = stream.points[i + 1];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          waterFlow = [(bx - ax) / len, (by - ay) / len];
          if (d.nearFall && stream.falls.some((f) => Math.hypot(x - stream.points[f][0], y - stream.points[f][1]) < 0.75))
            fall = true;
        }
      } else if (sort === "arroyo") {
        // Narrow at its head, and again where it dies on the flat short of
        // any water. Under a cell and a half across the bed breaks into beads.
        const width =
          (0.9 + d.along * 0.9 + (noise(seed, fx, fy, 9, "arroyo-width") - 0.5) * 0.5) *
          Math.min(1, d.along * 5 + 0.8, stream.pond ? (1 - d.along) * 5 + 0.8 : 1);
        // The bed takes the tier it is about to drop to a few cells early,
        // so the rim opens into a gully round it.
        if (d.distance < Math.max(width + 1, 2))
          washTier = stream.tiers[Math.min(stream.tiers.length - 1, d.vertex + 5)];
        if (d.distance < width + 1) {
          // Which bank is uphill, for the cut face on that side.
          const i = Math.min(stream.points.length - 2, Math.max(0, d.vertex));
          const [ax, ay] = stream.points[i],
            [bx, by] = stream.points[i + 1];
          const side = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax)) || 1;
          const uphill =
            field(x - (by - ay) * 0.1 * side, y + (bx - ax) * 0.1 * side) >
            field(x + (by - ay) * 0.1 * side, y - (bx - ax) * 0.1 * side);
          landscape = {
            kind: "arroyo",
            strength: Math.max(0, Math.min(1, (width - d.distance) / 1 + 0.5)),
            // A broken cut: a third of the uphill margin, in runs.
            cut:
              uphill &&
              d.distance > width - 0.3 &&
              d.distance < width + 0.5 &&
              noise(seed, fx, fy, 6, "arroyo-cut") > 0.45,
          };
        }
      } else if (d.distance < 0.9 && !landscape) {
        landscape = { kind: "trail", strength: 1 - d.distance / 0.9 };
      }
    }
    if (s.hydrologyRevision === 3 && s.playableMap) {
      const joined = connectedBoundary(x, y, { water, kind, waterFlow, floodplain, shoreWidth });
      ({ water, kind, waterFlow, floodplain, shoreWidth } = joined);
    }
    const ecologyParts = s.ecologyRevision === 2
      ? s.geographyMode === "configured"
        ? [{ ecology: cfg.ecology, colorway: cfg.colorway, weight: 1 }]
        : regional?.ecologyAt(x, y).parts ?? [{ ecology: cfg.ecology, colorway: cfg.colorway, weight: 1 }]
      : undefined;
    const recipe = ecologyParts ? landscapeRecipe(ecologyParts) : undefined;
    const drainage = recipe ? drainageAt(field, x, y, water, recipe, Math.sign(s.lat) || 1) : undefined;
    if (drainage && kind !== "sea" && water >= -1.2 && !regional?.placeAt(x, y)) {
      const edgeFade = s.playableMap ? Math.max(0, Math.min(1, (s.playableMap.size / 2 - 1 - Math.max(Math.abs(x), Math.abs(y))) / 24)) : 1;
      const spread = Math.max(0, drainage.saturation - 0.4) * 18 * edgeFade;
      if (spread > 0) {
        water = Math.max(-1.2, water - spread);
        floodplain = Math.max(floodplain, spread + 5);
      }
    }
    // Real pools join the terrain sample before settlement siting and routing.
    // A common basin center controls eligibility across every pixel of the pool.
    const basin = s.hydrologyRevision === 3 ? undefined : marshBasin(seed, fx, fy, habitat.ecology);
    // A bog or flooded savanna admits more pools than the envelope alone.
    const pooling = habitatLayout(habitat.colorway).wet;
    if (
      s.hydrologyRevision !== 3 &&
      (!simpleWater || habitat.ecology === "wetland") &&
      basin &&
      basin.distance < 2 &&
      water > shoreWidth + 5 &&
      profile.moisture * pooling > 0.36 &&
      basin.wet > 0.57 / Math.max(0.6, pooling) &&
      field(
        basin.x - (regional ? origin.x : 0),
        basin.y - (regional ? origin.y : 0),
      ) < 0.5 &&
      !regional?.placeAt(x, y)
    ) {
      water = basin.distance;
      kind = "lake";
      shoreWidth = 0.5;
      floodplain = 2.5;
      waterFlow = [0, 0];
    }
    // A regional map calls all dry land "sea" when no river is near, so test distance from the shore.
    if (form === "cenote" && (kind !== "sea" || water > 6)) {
      const d = cenoteDistance(seed, x + origin.x, y + origin.y);
      if (d < water) {
        water = d;
        kind = "lake";
        shoreWidth = 0.3;
        floodplain = 0.6;
        waterFlow = [0, 0];
      }
    }
    // A spring-fed oasis pool on low desert ground, and a playa that holds
    // shallow water only in the cool wet months and is a salt crust after.
    if (habitat.ecology === "desert" && water > 8 && field(x, y) < 0.45 && !regional?.placeAt(x, y)) {
      const ax = x + origin.x,
        ay = y + origin.y;
      const spring = noise(seed, ax, ay, 24, "oasis") * 0.8 + noise(seed, ax, ay, 5, "oasis-rim") * 0.2;
      const playa = ["atacama", "highland", "sahara", "kalahari", "reg"].includes(habitat.colorway ?? "")
        ? noise(seed, ax, ay, 38, "salt-pan")
        : 0;
      const d = (0.86 - spring) * 60,
        wet = Math.min(d, (0.77 - playa) * 50);
      if (wet < 7 && wet < water) {
        if (d < 7 && d < water) water = d;
        if (wet < water) wetPlaya = wet;
        kind = "lake";
        shoreWidth = 0.6;
        floodplain = 2;
        waterFlow = [0, 0];
      }
    }
    const seam = s.playableMap && s.hydrologyRevision !== 3 && !(simpleWater && s.geographyMode === "earth")
      ? boundarySample(
          s.playableMap.size,
          s.playableMap.exits.flatMap((e) => (e.seam ? [e.seam] : [])),
          x,
          y,
        )
      : undefined;
    if (seam) {
      water =
        Math.max(-64, Math.min(64, water)) * (1 - seam.weight) +
        seam.water * seam.weight;
      if (seam.weight > 0.5) {
        kind = seam.kind;
        waterFlow = seam.flow;
        shoreWidth = seam.kind === "sea" ? 6 : 2;
        floodplain = shoreWidth + 3;
      }
    }
    const moisture = Math.max(
      0.05,
      Math.min(
        0.96,
        (s.ecologyRevision && regional
          ? regional.ecologyAt(x, y).moisture
          : profile.moisture) +
          (noise(seed, fx, fy, 36, "moisture") - 0.5) * 0.22 +
          Math.max(0, 1 - Math.max(0, water) / 14) *
            noise(seed, fx + 43, fy - 19, 29, "drainage-pockets") *
            0.28,
      ),
    );
    // The ambient regional relief describes the countryside; the setting's own
    // relief is the floor, so a mountain place raises the ground around it
    // rather than being levelled by whatever the region averages to.
    const relief = Math.max(
      regional?.reliefAt(x, y) ?? s.relief ?? 0,
      s.relief ?? 0,
      0.1,
    );
    // Fractional so the number of steps drifts with the countryside rather
    // than jumping at a block edge.
    const ceiling = ceilingOf(relief);
    let baseTier = tierOfHeight(terraceHeight(x, y, ceiling), ceiling);
    // The terrace above the floodplain wanders: a straight reach otherwise
    // draws its first step as a ruled line the length of the screen.
    const terrace =
      floodplain + 10 + (noise(seed, fx, fy, 19, "terrace-edge") - 0.5) * 9;
    // The river's own step: the valley floor is a terrace ladder walked
    // downstream, so a river in high country drops a tier at a rapid every
    // so often instead of flowing along a trench cut to the map's floor.
    // Sampled on a coarse lattice along the flow and quantised, so both
    // banks and the water agree on where each step is.
    let valleyFloor = 0;
    if (!simpleWater && kind === "river" && water < terrace && ceiling > 3 && riverAlong !== undefined) {
      const [tx, ty] = waterFlow;
      const len = Math.hypot(tx, ty) || 1;
      const ux = tx / len,
        uy = ty / len;
      const along = riverAlong;
      // The floor at a point is the lowest ground the river has crossed so
      // far this reach (sampled every 12 cells upstream along the flow), one
      // step down: it can only descend, and it drops where the land does.
      // Cached per 12-cell station so both banks and the water agree.
      const REACH = 480;
      const station = Math.floor(along / 12);
      const head = Math.floor(along / REACH) * (REACH / 12);
      let floor = Infinity;
      for (let st = head; st <= station; st++) {
        const key = `${st}`;
        let t = stationTiers.get(key);
        if (t === undefined) {
          const sx = x + ux * (st * 12 - along),
            sy = y + uy * (st * 12 - along);
          t = tierOfHeight(field(sx, sy), ceiling);
          trimCache(stationTiers, 4096);
          stationTiers.set(key, t);
        }
        floor = Math.min(floor, t);
      }
      valleyFloor = Math.max(0, Math.min(baseTier - 1, floor - 1));
    }
    // Ground the flood covers is valley floor even when dry.
    // Every shore keeps a low margin two to four cells deep: a bank standing
    // at the water's edge cuts the shoreline square along its cells.
    const margin = 2.6 + noise(seed, fx, fy, 13, "shore-margin") * 1.6;
    let level =
      water < Math.max(floodplain, margin) || (reaches && water < Math.max(...reaches))
        ? valleyFloor
        : water < terrace
          ? Math.max(valleyFloor, Math.min(valleyFloor + 1, baseTier))
          : baseTier;
    // A sea cliff: the land stands straight up behind a narrow beach, two to
    // four steps high, and comes down again inland a step at a time. Low,
    // marshy and mangrove shores keep their beaches.
    if (kind === "sea" && water >= 0 && habitat.ecology !== "wetland" && !reef) {
      const bluff = noise(seed, fx, fy, 64, "sea-cliffs") * 0.8 + Math.min(relief, 0.6) * 0.5;
      if (bluff > 0.55) {
        const tall = 2 + Math.min(2, Math.floor((bluff - 0.55) * 9));
        const foot = Math.min(floodplain, shoreWidth + 1.5);
        level = water < foot ? 0 : Math.max(level, tall - Math.floor((water - foot) / 16));
      }
    }
    if (washTier !== undefined && washTier < level) level -= 1;
    if (dike) level = Math.max(level, 1);
    // A creek keeps its own tier and steps down at its falls; near a river
    // it can be no higher than the valley floor it joins.
    if (creekMargin && creekTier !== undefined) {
      // The creek lies on the ground it crosses: the ground's own step from
      // the river rules, never above the walk's tier. It steps down where
      // the land does, and the last drop into the valley is a fall.
      const w0 = preCreek.water,
        fp0 = preCreek.floodplain;
      // No terrace noise here: at the terrace edge it flipped neighbouring
      // creek cells between tiers and drew a rim round each one.
      const groundLevel = w0 < fp0 ? 0 : w0 < fp0 + 10 ? Math.min(1, baseTier) : baseTier;
      const creekLevel = Math.min(groundLevel, creekTier);
      // The water and a cell and a half of bank share the creek's tier so
      // the banks are continuous; further out the ground keeps its own step.
      level = water < 1.5 ? creekLevel : groundLevel;
    }
    return {
      ...(drainage ? { drainage, ecologyParts } : {}),
      water,
      shoreWidth,
      floodplain,
      waterFlow,
      kind,
      moisture,
      ...(landscape && water >= 0 ? { landscape } : {}),
      ...(fall ? { fall: true } : {}),
      ...(waterGradient ? { waterGradient } : {}),
      ...(kind === "sea" && ws.tide >= 0.3 && !reef ? { shelf: 1 + ws.tide * 9 } : {}),
      ...(reef ? { reef } : {}),
      ...(reaches || wetPlaya !== undefined
        ? {
            seasonal: seasons.map((season, i) => {
              const w = wetPlaya !== undefined && (season === "winter" || season === "spring") ? wetPlaya : water;
              return reaches && w < reaches[i] ? Math.max(-1.6, w - reaches[i]) : w;
            }),
          }
        : {}),
      elevation: seam
        ? Math.round(
            (level * 14 * (1 - seam.weight) + seam.height * seam.weight) / 14,
          ) * 14
        : level * 14,
      travelRoad: !!seam?.road && water >= 0,
      // The land's stature, not its step count: scree, snow and alpine plants read it.
      summit: Math.max(ceiling, 1 + relief * 8) * 14,
      ...(habitat.colorway === "ice" || altitude + level * metresPerTier(relief) > snowlineAt(s.lat, "summer") + 150
        ? { glacier: true }
        : {}),
      // Cold envelopes keep snow on their highest steps all year once the
      // relief is mountainous, which also marks the summit from a distance.
      snow:
        (habitat.ecology === "tundra" && s.season === "winter") ||
        (habitat.ecology === "boreal-woodland" &&
          s.season === "winter") ||
        (["tundra", "boreal-woodland"].includes(habitat.ecology) &&
          relief >= 0.625 &&
          level >= ceiling - 1) ||
        habitat.colorway === "ice" ||
        altitude + level * metresPerTier(relief) > snowlineAt(s.lat, s.season),
    };
  };
  const sample = (x: number, y: number) => {
    // Packed, not a string: exact while |x| < 2^20 and |y| < 2^21.
    const key = x * 2097152 + y;
    let value = cache.get(key);
    if (!value) {
      value = calculate(x, y);
      // A large town and its fields outgrow 65536 cells; at that size the
      // cache thrashed and London 1750 computed its land twice over.
      trimCache(cache, 131072);
      cache.set(key, value);
    }
    return value;
  };
  return { origin: toAtlas(s.lon, s.lat), sample, mainWater, tributariesAt: (x: number, y: number) => streamsNear(x, y).filter((s) => s.kind === "creek").map((s) => s.stream) };
}
/** Local habitats vary inside the selected climatic envelope. */
export function localEcology(
  s: WorldSetting,
  _seed: string,
  _x: number,
  _y: number,
  _f: LandSample,
) {
  // Local habitats retain their climatic envelope. Cover/wetness live in
  // habitat metadata, so a tropical clearing never becomes temperate grassland.
  return s.environment!.ecology;
}
