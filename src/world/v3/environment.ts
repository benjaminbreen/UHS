import { tributary } from "./tributaries";
import { boundarySample } from "../travel/seams";
import { trimCache } from "../../core/cache";
import { marshBasin } from "./wet-features";
import type { WorldSetting } from "../../content/geography/types";
import { habitatLayout } from "../../content/ecology/variants";
import {
  STREAM_BLOCK,
  streamDistance,
  streamKind,
  walkStream,
  type Stream,
} from "./features";
import { ecologyProfiles } from "../../content/ecology/profiles";
import { regionalLandforms } from "./landforms";
import { noise } from "../geography/noise";
import { random } from "../../core/random";
import { toAtlas, atlasSample } from "../geography/atlas";
import type { RegionalContext } from "../regional/context";
import type { LandSample } from "../geography/landscape";
/** Geography is sampled independently of settlements and player circumstances. */
export function createEnvironment(
  s: WorldSetting,
  seed: string,
  regional?: RegionalContext,
) {
  const cfg = s.environment!;
  const simpleWater = !!s.hydrologyRevision;
  const connectedWater = s.hydrologyRevision === 2;
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
  const field = (x: number, y: number) => {
    const global = plan.field(
      regional ? x + origin.x : x,
      regional ? y + origin.y : y,
    );
    const weight = blendWeight(x, y);
    return configuredPlan && weight
      ? global * (1 - weight) + configuredPlan.field(x, y) * weight
      : global;
  };
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
    const fx = Math.floor(ax / 4) * 4,
      fy = Math.floor(ay / 4) * 4;
    const fineKey = `${fx},${fy}`;
    let mid = fineCache.get(fineKey);
    if (!mid) {
      mid = atlasSample(fx + 2, fy + 2);
      trimCache(fineCache, 16384);
      fineCache.set(fineKey, mid);
    }
    return Math.abs(mid.coast) < 12 || mid.river < 12
      ? atlasSample(ax, ay)
      : mid;
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
    if (connectedWater) return mainWater(x, y).water;
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
  const tierFor = (h: number, ceiling: number) => {
    const t = Math.min(1, Math.max(0, (h - 0.28) / 0.52));
    return Math.min(Math.round(ceiling), Math.round(Math.pow(t, 1.15) * ceiling));
  };
  type Walked = { stream: Stream; kind: "creek" | "arroyo" | "trail" };
  const streamBlocks = new Map<string, Walked[]>();
  const streamsIn = (bx: number, by: number) => {
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
    const ceiling = Math.max(2, 1 + relief * 8);
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
      for (const c of candidates) {
        if (taken.length >= count) break;
        if (taken.some(([tx, ty]) => Math.hypot(tx - c.p[0], ty - c.p[1]) < 40)) continue;
        const stream = connectedWater && kind === "creek"
          ? tributary(seed, `${kind}-${bx}-${by}-${taken.length}`, c.p, openWater, field, (h) => tierFor(h, ceiling))
          : walkStream(
          seed,
          `${kind}-${bx}-${by}-${taken.length}`,
          c.p,
          field,
          // Inside the channel proper, not merely near its bank.
          (x, y) => openWater(x, y) < -2,
          (h) => tierFor(h, ceiling),
          60,
          0.006,
          (x, y) => Math.min(120, openWater(x, y)),
          !simpleWater,
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
        list.push({ stream, kind });
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
        if (trail) list.push({ stream: trail, kind: "trail" });
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
  const tierOfHeight = (h: number, ceiling: number) => {
    const t = Math.min(1, Math.max(0, (h - 0.28) / 0.52));
    return Math.min(Math.round(ceiling), Math.round(Math.pow(t, 1.15) * ceiling));
  };
  const cache = new Map<number, LandSample>();
  const mainWater = (x: number, y: number) => {
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
      const bar = noise(seed, x, y, 54, "sandbars");
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
    if (cfg.ecology === "wetland" && s.water === "none") {
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
      const feature = regional.featureAt(mx, my, [
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
    const swamp = connectedWater && (regional?.settingAt(x, y) ?? s).environment?.colorway === "swamp";
    if (swamp && water > -1.2 && water < 24 && kind !== "sea") {
      const spread = 3 + noise(seed, fx, fy, 24, "swamp-inundation") * 9;
      water = Math.max(-1.2, water - spread);
      shoreWidth = 1.1;
      floodplain = Math.max(floodplain, 12);
    }
    return { water, floodplain, shoreWidth, waterFlow, kind, riverAlong };
  };
  const calculate = (x: number, y: number): LandSample => {
    const local = regional?.settingAt(x, y) ?? s;
    const profile = ecologyProfiles[local.environment!.ecology];
    const fx = regional ? x + origin.x : x,
      fy = regional ? y + origin.y : y;
    const shape = field(x, y);
    let { water, floodplain, shoreWidth, waterFlow, kind, riverAlong } = mainWater(x, y);
    // Oxbows: a crescent of still water on the floodplain, its horns toward
    // the river, in the green envelopes.
    if (
      !simpleWater &&
      kind === "river" &&
      water > 5 &&
      water < 18 &&
      !["desert", "dry-scrub", "tundra"].includes(local.environment!.ecology)
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
    let landscape: LandSample["landscape"];
    let fall = false;
    let waterGradient: LandSample["waterGradient"];
    let creekTier: number | undefined;
    let creekMargin = false;
    const preCreek = { water, floodplain };
    for (const { stream, kind: sort } of streamsNear(x, y)) {
      const d = streamDistance(stream, x, y, connectedWater ? 8 : 4);
      if (!d) continue;
      if (sort === "creek") {
        // Two cells of water widening downstream, a narrow gravel edge, and a
        // plunge pool below each fall.
        const plunge = stream.falls.some(
          (f) => Math.hypot(x - stream.points[f][0], y - stream.points[f][1]) < 2.8,
        );
        const width =
          (connectedWater ? 0.8 : 0.55) +
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
          shoreWidth = 0.9;
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
        const width = 1.5 + d.along * 1.3 + (noise(seed, fx, fy, 9, "arroyo-width") - 0.5) * 0.8;
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
    // Real pools join the terrain sample before settlement siting and routing.
    // A common basin center controls eligibility across every pixel of the pool.
    const basin = marshBasin(seed, fx, fy, local.environment!.ecology);
    // A bog or flooded savanna admits more pools than the envelope alone.
    const pooling = habitatLayout(local.environment!.colorway).wet;
    if (
      (!simpleWater || local.environment!.ecology === "wetland") &&
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
    const seam = s.playableMap && !(simpleWater && s.geographyMode === "earth")
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
    // The place's own relief sets how many steps the ground may climb: a
    // floodplain still tops out at two, a mountain range runs to nine.
    // The ambient regional relief describes the countryside; the setting's own
    // relief is the floor, so a mountain place raises the ground around it
    // rather than being levelled by whatever the region averages to.
    const relief = Math.max(
      regional?.reliefAt(x, y) ?? local.relief ?? 0,
      s.relief ?? 0,
      0.1,
    );
    // Fractional so the number of steps drifts with the countryside rather
    // than jumping at a block edge.
    const ceiling = Math.max(2, 1 + relief * 8);
    // Spread across the landform's whole working range rather than three fixed
    // bands. The old middle band swallowed most of the map into one tier, so
    // no ceiling above it ever showed.
    const tierOf = (h: number) => {
      const t = Math.min(1, Math.max(0, (h - 0.28) / 0.52));
      return Math.min(
        Math.round(ceiling),
        Math.round(Math.pow(t, 1.15) * ceiling),
      );
    };
    // A town terraces rather than levels: sampling the landform broadly gives
    // it a few wide steps to build on instead of a stair at every cell, while
    // still letting it climb a hillside the way a real one does.
    const built = !!regional?.placeAt(x, y);
    let baseTier = tierOf(
      built
        ? (shape +
            field(x - 4, y) +
            field(x + 4, y) +
            field(x, y - 4) +
            field(x, y + 4)) /
            5
        : shape,
    );
    // A tier with no neighbour at the same height is a speck. Fall back to
    // whichever neighbouring height is nearest rather than snapping to one.
    const around = [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0],
    ].map(([dx, dy]) => tierOf(field(x + dx, y + dy)));
    if (!around.some((t) => t === baseTier))
      baseTier = around.reduce((best, t) =>
        Math.abs(t - baseTier) < Math.abs(best - baseTier) ? t : best,
      );
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
    let level =
      water < floodplain
        ? valleyFloor
        : water < terrace
          ? Math.max(valleyFloor, Math.min(valleyFloor + 1, baseTier))
          : baseTier;
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
      water,
      shoreWidth,
      waterFlow,
      kind,
      moisture,
      ...(landscape && water >= 0 ? { landscape } : {}),
      ...(fall ? { fall: true } : {}),
      ...(waterGradient ? { waterGradient } : {}),
      elevation: seam
        ? Math.round(
            (level * 14 * (1 - seam.weight) + seam.height * seam.weight) / 14,
          ) * 14
        : level * 14,
      travelRoad: !!seam?.road && water >= 0,
      summit: ceiling * 14,
      // Cold envelopes keep snow on their highest steps all year once the
      // relief is mountainous, which also marks the summit from a distance.
      snow:
        (local.environment!.ecology === "tundra" && s.season === "winter") ||
        (local.environment!.ecology === "boreal-woodland" &&
          s.season === "winter") ||
        (["tundra", "boreal-woodland"].includes(local.environment!.ecology) &&
          ceiling >= 6 &&
          level >= ceiling - 1),
    };
  };
  const sample = (x: number, y: number) => {
    // Packed, not a string: exact while |x| < 2^20 and |y| < 2^21.
    const key = x * 2097152 + y;
    let value = cache.get(key);
    if (!value) {
      value = calculate(x, y);
      trimCache(cache, 65536);
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
