import {
  generateCharacter,
  characterLivelihood,
  eligibleInventory,
} from "../../content/characters/generate";
import { resolveCharacterContext } from "../../content/characters/resolve";
import {
  streetPalette,
  chooseStreetSurface,
} from "../../content/settlements/streets/palettes";
import { urbanNeighborhood, urbanSite, siteForm, type UrbanLot } from "./urban";
import { urbanNeighborhoodV1 } from "./urban-v1";
import { urbanCapacity } from "../../content/settlements/scale";
import { ornaments } from "../../content/settlements/ornaments";
import type { Actor, Pack, Point, Position, Terrain } from "../../core/types";
import { proceduralName } from "../../content/geography/character";
import { random } from "../../core/random";
import { buildingModel, buildingModels } from "../../content/graphics/models";
import {
  crossing,
  line,
  planRoad,
  planAccess,
  joinNetwork,
  roadCells,
  type Sample,
} from "./roads";
import { planRoutines } from "./routines";
import {
  cellKey,
  eachCell,
  type Rect,
  type Road,
  type SettlementPlan,
  type Site,
} from "./types";
/** The livelihood activity that keeps animals, as the character tables name it. */
const HERDING = "Tending animals";

export function planSettlement(
  site: Site,
  pack: Pack,
  seed: string,
  sample: Sample,
  connections: Road[],
): SettlementPlan {
  const c = site.center,
    profile = site.profile,
    r = profile.radius;
  const characterContext = pack.setting?.characterRevision
    ? resolveCharacterContext(pack.setting)
    : undefined;
  const sharedRoads = !!pack.setting?.roadRevision;
  const urban = urbanSite(site, pack);
  /** Resolved once: the lookup scans every dated rule, and both the square's
   * furniture and the building budget ask for it. */
  const fabric = siteForm(site, pack);
  /** Worlds pinned to the first urban revision keep their fixed lattice. */
  const composed = (pack.setting?.urbanRevision ?? 0) >= 2;
  const organic = !!pack.setting?.environment && profile.pattern !== "planned";
  const bounds = {
    x: c.x - r - 40,
    y: c.y - r - 40,
    w: (r + 40) * 2,
    h: (r + 40) * 2,
  };
  const plan: SettlementPlan = {
    site,
    roads: [],
    plots: [],
    places: [],
    objects: [],
    actors: [],
    enclosures: [],
    surface: new Map(),
    pavement: new Map(),
    streetSurfaces: new Map(),
    traffic: new Set(),
    reserved: new Set(),
    solid: new Set(),
    work: new Map(),
    stations: new Map(),
    slots: new Map(),
    spawn: { ...c },
    diagnostics: { routeFailures: 0, rejectedBuildings: 0 },
  };
  const centers = new Set<string>();
  const roads = plan.traffic,
    bridges = new Set<string>(),
    noRoad = new Set<string>();
  const rand = (...k: (string | number)[]) =>
    random(seed, "settlement-3", site.id, ...k);
  const pos = (p: Point): Position => ({ ...p, space: "outside" });
  const paint = (rect: Rect, t: Terrain, reserve = true) =>
    eachCell(rect, (x, y) => {
      plan.surface.set(cellKey(x, y), t);
      if (reserve) plan.reserved.add(cellKey(x, y));
    });
  const palette = pack.setting ? streetPalette(pack.setting) : undefined;
  const addRoad = (road: Road) => {
    const material =
      palette &&
      chooseStreetSurface(
        palette,
        road.width >= 2 ? "main" : road.width >= 1 ? "local" : "lane",
        rand("paving", road.id),
      );
    plan.roads.push(road);
    for (const p of road.points) centers.add(cellKey(p.x, p.y));
    roadCells(road, (x, y) => {
      const k = cellKey(x, y),
        f = sample(x, y);
      if (f.water < 0 && !bridges.has(k)) return;
      // Paved by tier, not by the settlement's rank: a city paved its streets,
      // not every back lane and doorstep in it.
      const stone = profile.paved && road.width >= 1;
      plan.surface.set(k, f.water < 0 ? "bridge" : stone ? "paving" : "dirt");
      // Earlier trunk roads keep their surface where later access lanes join.
      if (material && stone && !plan.streetSurfaces!.has(k))
        plan.streetSurfaces!.set(k, material);
      if (urban && stone && road.width < 2 && !plan.pavement!.has(k))
        plan.pavement!.set(k, "lane");
      roads.add(k);
      plan.reserved.add(k);
    });
  };
  const selected =
    sharedRoads && connections.some((p) => p.kind === "bridge")
      ? undefined
      : crossing(`${site.id}-bridge`, c, sample, r);
  for (const bridge of [
    ...connections.filter((p) => p.kind === "bridge"),
    ...(selected ? [selected] : []),
  ]) {
    roadCells(bridge, (x, y) => bridges.add(cellKey(x, y)));
    addRoad(bridge);
  }
  for (const road of connections.filter((p) => p.kind !== "bridge"))
    addRoad(road);
  const connect = (
    a: Point,
    b: Point,
    label: string,
    width = 1,
    area = bounds,
  ) => {
    const access = /^(door|yard-access|field-access|pen-access)/.test(label);
    const road = access
      ? (sharedRoads ? joinNetwork : planAccess)(
          `${site.id}-${label}`,
          label.startsWith("field-access") || label.startsWith("pen-access")
            ? b
            : a,
          sample,
          sharedRoads ? centers : roads,
          bridges,
          new Set([...plan.solid, ...noRoad]),
          area,
        )
      : sharedRoads &&
          /^(neighborhood|bridge-approach)/.test(label) &&
          roads.size
        ? joinNetwork(
            `${site.id}-${label}`,
            b,
            sample,
            label.startsWith("bridge-approach")
              ? new Set([...centers].filter((k) => !bridges.has(k)))
              : centers,
            bridges,
            new Set([...plan.solid, ...noRoad]),
            area,
            width,
          )
        : planRoad(
            `${site.id}-${label}`,
            a,
            b,
            sample,
            roads,
            bridges,
            new Set([...plan.solid, ...noRoad]),
            area,
            width,
            width ? 2 : 1,
            organic ? seed : undefined,
          );
    if (road && !(sharedRoads && label.startsWith("yard-access")))
      addRoad(road);
    else if (!road) plan.diagnostics.routeFailures++;
    return road;
  };
  /** A composed street is already known to be straight and on chosen ground, so
   * it needs validating, not searching. Refusing the whole segment on a wet or
   * blocked cell keeps the promise that a street is never half a street. */
  const lay = (a: Point, b: Point, label: string, width: number) => {
    const points = line(a, b);
    const road: Road = {
      id: `${site.id}-${label}`,
      points,
      width,
      kind: width ? "street" : "path",
      cost: points.length,
    };
    let valid = true;
    roadCells(road, (x, y) => {
      const k = cellKey(x, y);
      if (
        sample(x, y).water < 4 ||
        (site.accepts && !site.accepts(x, y)) ||
        plan.solid.has(k) ||
        noRoad.has(k)
      )
        valid = false;
    });
    if (!valid) {
      plan.diagnostics.routeFailures++;
      return;
    }
    addRoad(road);
    return road;
  };
  const dry = (rect: Rect, occupied = true) => {
    let lo = Infinity,
      hi = -Infinity,
      valid = true;
    eachCell(rect, (x, y) => {
      const f = sample(x, y);
      lo = Math.min(lo, f.elevation);
      hi = Math.max(hi, f.elevation);
      if (
        f.water < 4 ||
        (site.accepts && !site.accepts(x, y)) ||
        (occupied && plan.reserved.has(cellKey(x, y)))
      )
        valid = false;
    });
    return valid && (pack.setting?.terrainRevision ? hi === lo : hi - lo < 28);
  };
  /** Nearest usable landing water. Sampled once; both the quay and the public
   * space that faces it ask the same question. */
  let shoreFound: Point | null | undefined;
  const urbanShore = () => {
    if (shoreFound !== undefined) return shoreFound ?? undefined;
    let best = Infinity;
    shoreFound = null;
    for (let y = c.y - r; y < c.y + r; y += 2)
      for (let x = c.x - r; x < c.x + r; x += 2) {
        const f = sample(x, y),
          d = Math.hypot(x - c.x, y - c.y);
        if (f.water >= 4 && f.water < 8 && d < best) {
          best = d;
          shoreFound = { x, y };
        }
      }
    return shoreFound ?? undefined;
  };
  // Reserve the common first. Its water/hearth objects sit at the edge, never in the through route.
  const half = pack.setting?.terrainRevision
    ? 2
    : profile.plaza === "court"
      ? 4
      : profile.plaza === "market"
        ? 7
        : 5;
  const publicArea = {
    x: c.x - half,
    y: c.y - half,
    w: half * 2 + 1,
    h: half * 2 + 1,
  };
  // A composed town has its square; a second common at the centre only cost
  // the block it landed in.
  eachCell(
    urban && composed ? { ...publicArea, w: 0, h: 0 } : publicArea,
    (x, y) => {
      if (sample(x, y).water >= 0 && (!site.accepts || site.accepts(x, y))) {
        plan.surface.set(cellKey(x, y), profile.paved ? "paving" : "dirt");
        plan.reserved.add(cellKey(x, y));
        roads.add(cellKey(x, y));
      }
    },
  );
  if (sample(c.x, c.y).water >= 0) centers.add(cellKey(c.x, c.y));
  plan.plots.push({
    ...publicArea,
    id: `${site.id}-public`,
    kind: "public",
    access: { ...c },
  });
  const socialCenter = { ...c };
  const water = { x: c.x + 4, y: c.y - 3 },
    waterStand = { x: c.x + 3, y: c.y - 2 };
  plan.objects.push({
    id: `${site.id}-water`,
    name: "Shared water source",
    kind: "well",
    pos: pos(water),
    sprite: "well",
    inventory: {},
  });
  plan.objects.push({
    id: `${site.id}-hearth`,
    name: "Shared hearth",
    kind: "fire",
    pos: pos({ x: c.x - 4, y: c.y + 3 }),
    sprite: "fire",
    inventory: {},
  });
  let urbanLots: UrbanLot[] = [];
  if (urban) {
    /** A square is composed from the fabric's spec: one centrepiece on a dais
     * scaled to the square, four corners, stalls along the lower edge. The
     * shared water and hearth objects already exist for routines; the first
     * water piece and the brazier become them rather than duplicating them. */
    const composeSquare = (court: Rect, civicRect?: Rect) => {
      const spec = fabric.square;
      const min = Math.min(court.w, court.h);
      const cx = court.x + Math.floor(court.w / 2),
        cy = court.y + Math.floor(court.h / 2);
      const source = plan.objects.find((o) => o.id === `${site.id}-water`)!;
      const hearth = plan.objects.find((o) => o.id === `${site.id}-hearth`)!;
      let water = false,
        fire = false;
      const bed = (rect: Rect, tag: string) => {
        if (!dry(rect, false)) return false;
        eachCell(rect, (x, y) => {
          const k = cellKey(x, y);
          plan.surface.set(k, "grass");
          plan.pavement!.delete(k);
          plan.streetSurfaces!.delete(k);
        });
        const at = { x: rect.x + (rect.w >> 1), y: rect.y + (rect.h >> 1) };
        plan.solid.add(cellKey(at.x, at.y));
        plan.objects.push({
          id: `${site.id}-square-tree-${tag}`,
          name: "Square tree",
          kind: "tree",
          pos: pos(at),
          sprite: pack.trees[0],
          inventory: {},
        });
        return true;
      };
      const place = (key: string, spot: Point, tag: string, focus = false) => {
        const piece = ornaments[key];
        if (!piece) return;
        if (!dry({ ...spot, w: piece.size, h: piece.size }, false)) return;
        if (piece.kind === "well") {
          if (water) return;
          water = true;
          source.name = piece.label;
          source.sprite = (focus && piece.focusSprite) || piece.sprite;
          source.pos = pos(spot);
          waterStand.x = spot.x + 1;
          waterStand.y = spot.y;
          return;
        }
        if (piece.kind === "fire") {
          if (fire || spec.hearth !== "brazier") return;
          fire = true;
          hearth.name = piece.label;
          hearth.pos = pos(spot);
          return;
        }
        if (focus) plan.solid.add(cellKey(spot.x, spot.y));
        plan.objects.push({
          id: `${site.id}-${piece.id}-${tag}`,
          name: piece.label,
          kind: piece.kind,
          sprite: (focus && piece.focusSprite) || piece.sprite,
          pos: pos(spot),
          inventory: {},
        });
      };
      // Centrepiece. The dais is a paving grade the raster raises, so it fits
      // any footprint; the piece itself is the only solid cell.
      let daisHalf = 0;
      if (spec.focus === "tree") {
        bed({ x: cx - 1, y: cy - 1, w: 3, h: 3 }, "focus");
        daisHalf = 1;
      } else if (spec.focus) {
        const piece = ornaments[spec.focus];
        if (piece && !piece.grounded) {
          const size = Math.min(7, 2 * Math.floor((min + 3) / 7) + 1);
          daisHalf = size >> 1;
          eachCell(
            { x: cx - daisHalf, y: cy - daisHalf, w: size, h: size },
            (x, y) => plan.pavement!.set(cellKey(x, y), "dais"),
          );
        }
        place(spec.focus, { x: cx, y: cy }, "focus", true);
      }
      // Talk, and the player's first step, happen at the foot of the
      // monument, not inside it.
      socialCenter.y = cy + Math.max(1, daisHalf) + 1;
      plan.spawn = { x: cx, y: socialCenter.y };
      // Corners. Every square gets water; a brazier fabric gets its fire.
      const list = [...spec.corners];
      const waterKeys = ["well", "fountain"];
      if (!water && !list.some((k) => waterKeys.includes(k)))
        list.splice(Math.min(3, list.length), 0, "well");
      if (spec.hearth === "brazier" && !list.includes("brazier"))
        list.splice(Math.min(3, list.length), 0, "brazier");
      const anchors: [number, number, number, number][] = [
        [court.x, court.y, 1, 1],
        [court.x + court.w - 1, court.y, -1, 1],
        [court.x, court.y + court.h - 1, 1, -1],
        [court.x + court.w - 1, court.y + court.h - 1, -1, -1],
      ];
      for (const [i, [x0, y0, dx, dy]] of anchors.entries()) {
        if (!list.length) break;
        let key = list[i % list.length];
        if (key === "tree") {
          const rect = {
            x: dx > 0 ? x0 + 1 : x0 - 3,
            y: dy > 0 ? y0 + 1 : y0 - 3,
            w: 3,
            h: 3,
          };
          if (min >= 15 && bed(rect, `corner-${i}`)) continue;
          key = "planter";
        }
        place(key, { x: x0 + dx * 2, y: y0 + dy * 2 }, `corner-${i}`);
      }
      // A hidden hearth goes behind the civic range: still reachable for the
      // routines that cook and gather there, but off the square.
      if (spec.hearth === "hidden" && civicRect) {
        const r = civicRect;
        const rcx = r.x + (r.w >> 1),
          rcy = r.y + (r.h >> 1);
        const away =
          Math.abs(rcx - cx) > Math.abs(rcy - cy)
            ? { x: Math.sign(rcx - cx), y: 0 }
            : { x: 0, y: Math.sign(rcy - cy) };
        const behind = (t: number) =>
          away.x
            ? { x: away.x > 0 ? r.x + r.w : r.x - 1, y: r.y + t }
            : { x: r.x + t, y: away.y > 0 ? r.y + r.h : r.y - 1 };
        const span = away.x ? r.h : r.w;
        const spot = [span >> 1, 1, span - 2]
          .map(behind)
          .find(
            (q) =>
              dry({ ...q, w: 1, h: 1 }, false) &&
              !plan.solid.has(cellKey(q.x, q.y)) &&
              !roads.has(cellKey(q.x, q.y)),
          );
        if (spot) {
          hearth.pos = pos(spot);
          plan.reserved.add(cellKey(spot.x, spot.y));
        }
      }
      // Market counters line the square's lower edge, clear of the corners.
      for (const [i, x] of [court.x + 4, court.x + court.w - 5].entries())
        plan.objects.push({
          id: `${site.id}-market-${i}`,
          name: "Market counter",
          prop: "marketCounter",
          kind: "container",
          sprite: `urban-stall-${i}`,
          pos: pos({ x, y: court.y + court.h - 2 }),
          inventory: characterContext
            ? eligibleInventory({ grain: 6 }, characterContext)
            : { grain: 6 },
          owner: `${site.id}-community`,
        });
    };
    const paintCourt = (court: Rect, square?: string, civicRect?: Rect) => {
      const material =
        palette &&
        chooseStreetSurface(
          palette,
          "square",
          rand("square-paving", court.x, court.y),
        );
      eachCell(court, (x, y) => {
        const key = cellKey(x, y);
        plan.reserved.add(key);
        if (square || !roads.has(key))
          plan.surface.set(key, square ? "paving" : "dirt");
        if (square) {
          roads.add(key);
          plan.pavement!.set(key, "square");
          if (material) plan.streetSurfaces!.set(key, material);
        }
      });
      plan.plots.push({
        ...court,
        id: `${site.id}-${square ? "square" : "urban-court"}-${plan.plots.length}`,
        kind: "public",
        access: {
          x: court.x + Math.floor(court.w / 2),
          y: court.y + Math.floor(court.h / 2),
        },
      });
      if (square) {
        socialCenter.x = court.x + Math.floor(court.w / 2);
        socialCenter.y = court.y + Math.floor(court.h / 2);
        composeSquare(court, civicRect);
        // The centre is now the monument; anything that entered there
        // enters at its foot instead.
        for (const plot of plan.plots)
          if (plan.solid.has(cellKey(plot.access.x, plot.access.y)))
            plot.access = { ...socialCenter };
      }
      // Trees belong to planted court corners; the central passage stays clear.
      const garden = { x: court.x, y: court.y, w: 3, h: 3 };
      if (
        !square &&
        dry(garden, false) &&
        !roads.has(cellKey(garden.x + 1, garden.y + 1))
      ) {
        paint(garden, "grass");
        plan.objects.push({
          id: `${site.id}-court-tree-${plan.plots.length}`,
          name: "Courtyard tree",
          kind: "tree",
          pos: pos({ x: garden.x + 1, y: garden.y + 1 }),
          sprite: pack.trees[0],
          inventory: {},
        });
      }
    };
    const paintBlock = (block: Rect) =>
      eachCell(block, (x, y) => {
        if (
          !plan.surface.has(cellKey(x, y)) &&
          dry({ x, y, w: 1, h: 1 }, false)
        )
          plan.surface.set(cellKey(x, y), "dirt");
      });
    urbanLots = composed
      ? urbanNeighborhood(site, pack, seed, {
          lay,
          dry,
          shore: urbanShore(),
          bank: (x, y) => {
            const f = sample(x, y);
            return f.water >= 4 && f.water < 6.5 && f.kind !== "lake";
          },
          paintQuay: (rect) =>
            eachCell(rect, (x, y) => {
              const k = cellKey(x, y);
              if (plan.solid.has(k) || roads.has(k)) return;
              plan.surface.set(k, "paving");
              plan.pavement!.set(k, "footway");
              plan.reserved.add(k);
              roads.add(k);
            }),
          bridge: (() => {
            const ends = [
              ...connections.filter((p) => p.kind === "bridge"),
              ...(selected ? [selected] : []),
            ].flatMap((b) => [b.points[0], b.points.at(-1)!]);
            return ends.sort(
              (a, b) =>
                Math.hypot(a.x - c.x, a.y - c.y) -
                Math.hypot(b.x - c.x, b.y - c.y),
            )[0];
          })(),
          paintCourt,
          paintBlock,
          reserveGround: (rect) =>
            eachCell(rect, (x, y) => noRoad.add(cellKey(x, y))),
          buildWall: (wall, parts) => {
            for (const part of parts) {
              const k = cellKey(part.x, part.y);
              plan.solid.add(k);
              plan.reserved.add(k);
              noRoad.add(k);
            }
            plan.enclosures.push({
              ...wall.rect,
              // A circuit has many ways in. The single gate this field records
              // is the one a reader of the older fence contract would look for.
              gate: [...wall.openings]
                .map((k) => {
                  const [x, y] = k.split(",").map(Number);
                  return { x, y };
                })
                .sort((a, b) => a.y - b.y || a.x - b.x)[0] ?? { ...c },
              parts,
            });
          },
        })
      : urbanNeighborhoodV1(
          site,
          pack,
          seed,
          connect,
          dry,
          paintCourt,
          paintBlock,
        );
    for (const lot of urbanLots)
      eachCell(lot.rect, (x, y) => noRoad.add(cellKey(x, y)));
    if (selected) {
      connect(c, selected.points[0], "bridge-approach-a");
      connect(c, selected.points.at(-1)!, "bridge-approach-b");
    }
  } else if (organic) {
    // Local anchors precede buildings: dry courts/terraces, access to a crossing,
    // and a small number of neighborhood centers. Density does not imply a grid.
    const anchors: Point[] = [{ ...c }];
    if (selected) {
      for (const [i, end] of [
        selected.points[0],
        selected.points.at(-1)!,
      ].entries()) {
        if (connect(c, end, `bridge-approach${i}`, 0)) anchors.push(end);
      }
    }
    const candidates = Array.from({ length: 72 }, (_, i) => {
      const angle = rand("anchor-angle", i) * Math.PI * 2;
      const radius = (0.28 + rand("anchor-radius", i) * 0.66) * r;
      const p = {
        x: c.x + Math.round(Math.cos(angle) * radius),
        y: c.y + Math.round(Math.sin(angle) * radius),
      };
      const f = sample(p.x, p.y);
      const fit = dry({ x: p.x - 5, y: p.y - 5, w: 11, h: 11 }, false);
      return {
        p,
        fit,
        score:
          rand("anchor-score", i) * 18 +
          Math.abs(f.water - 24) * 0.05 +
          Math.abs(f.moisture - 0.5) * 8,
      };
    })
      .filter((a) => a.fit)
      .sort((a, b) => a.score - b.score);
    const count =
      profile.pattern === "dense"
        ? 8
        : profile.pattern === "waterfront"
          ? 6
          : profile.pattern === "farmstead"
            ? 3
            : sharedRoads
              ? 3
              : 5;
    let accepted = 0;
    for (const { p } of candidates) {
      if (accepted >= count) break;
      if (
        anchors.some(
          (a) =>
            Math.hypot(a.x - p.x, a.y - p.y) <
            (profile.pattern === "dense" ? 23 : 26),
        )
      )
        continue;
      const nearest = [...anchors].sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
      if (
        !connect(
          nearest,
          p,
          `neighborhood${accepted}`,
          accepted === 0 && pack.setting?.settlement !== "camp" ? 1 : 0,
        )
      )
        continue;
      anchors.push(p);
      accepted++;
      if (accepted % 2 === 1 && profile.pattern !== "roadside") {
        const size = 2 + Math.floor(rand("court-size", accepted) * 2);
        if (
          dry(
            { x: p.x - size, y: p.y - size, w: size * 2 + 1, h: size * 2 + 1 },
            false,
          )
        ) {
          for (let y = p.y - size; y <= p.y + size; y++)
            for (let x = p.x - size; x <= p.x + size; x++) {
              if (Math.hypot(x - p.x, (y - p.y) * 1.15) > size + 0.5) continue;
              plan.surface.set(
                cellKey(x, y),
                profile.paved ? "paving" : "dirt",
              );
              plan.reserved.add(cellKey(x, y));
              roads.add(cellKey(x, y));
            }
        }
      }
    }
    // A few cross-links form blocks; ordinary hamlets retain branching paths.
    if (profile.pattern === "dense" || profile.pattern === "waterfront")
      for (let i = 2; i < anchors.length; i += 2) {
        const a = anchors[i],
          b = anchors
            .filter((_, j) => j !== i && j !== 0)
            .sort(
              (u, v) =>
                Math.hypot(u.x - a.x, u.y - a.y) -
                Math.hypot(v.x - a.x, v.y - a.y),
            )[1];
        if (b && Math.hypot(a.x - b.x, a.y - b.y) < r)
          connect(a, b, `cross-lane${i}`, 0);
      }
  } else {
    for (const [i, dx, dy] of [
      [0, -1, 0],
      [1, 1, 0],
      [2, 0, -1],
      [3, 0, 1],
    ]) {
      if (profile.pattern === "farmstead" && i === 2) continue;
      let goal: Point | undefined;
      for (
        let distance =
          profile.pattern === "farmstead"
            ? i === 3
              ? r - 10
              : 32
            : profile.pattern === "roadside" && i > 1
              ? 32
              : r - 10;
        distance >= 18;
        distance -= 6
      ) {
        const q = { x: c.x + dx * distance, y: c.y + dy * distance };
        if (dry({ x: q.x - 2, y: q.y - 2, w: 5, h: 5 }, false)) {
          goal = q;
          break;
        }
      }
      if (goal)
        connect(
          c,
          goal,
          `approach${i}`,
          pack.setting?.settlement === "camp" ? 0 : 1,
        );
    }
    if (selected) {
      connect(c, selected.points[0], "bridge-approach-a");
      connect(c, selected.points.at(-1)!, "bridge-approach-b");
    }
    if (
      profile.pattern === "planned" ||
      profile.pattern === "dense" ||
      profile.pattern === "waterfront"
    ) {
      for (const offset of profile.pattern === "dense"
        ? [-47, -22, 19, 49]
        : [-52, -26, 26, 52])
        for (const vertical of [false, true]) {
          const bend =
            profile.pattern === "dense"
              ? Math.round(
                  (rand("lane-bend", offset, Number(vertical)) - 0.5) * 12,
                )
              : 0;
          const a = {
              x: c.x + (vertical ? offset : -r + 20),
              y: c.y + (vertical ? -r + 20 : offset),
            },
            b = {
              x: c.x + (vertical ? offset + bend : r - 20),
              y: c.y + (vertical ? r - 20 : offset + bend),
            };
          if (
            !dry({ x: a.x - 1, y: a.y - 1, w: 3, h: 3 }, false) ||
            !dry({ x: b.x - 1, y: b.y - 1, w: 3, h: 3 }, false)
          )
            continue;
          const band = vertical
            ? { x: a.x - 8, y: a.y, w: 24, h: b.y - a.y }
            : { x: a.x, y: a.y - 8, w: b.x - a.x, h: 24 };
          connect(a, b, `lane-${offset}-${vertical}`, 0, band);
        }
    } else if (profile.pattern === "clustered") {
      // Small household courts create several centers instead of a single street cross.
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1 + rand("court-angle"),
          q = {
            x: c.x + Math.round(Math.cos(a) * 30),
            y: c.y + Math.round(Math.sin(a) * 30),
          };
        const court = { x: q.x - 3, y: q.y - 3, w: 7, h: 7 };
        if (dry(court) && connect(c, q, `court${i}`, 0)) {
          paint(court, "dirt");
          eachCell(court, (x, y) => roads.add(cellKey(x, y)));
          plan.plots.push({
            ...court,
            id: `${site.id}-court${i}`,
            kind: "public",
            access: q,
          });
        }
      }
    }
  }
  if (profile.pattern === "waterfront") {
    const shore = urbanShore();
    if (shore && connect(c, shore, "landing")) {
      const landing = { x: shore.x - 4, y: shore.y - 3, w: 9, h: 7 };
      eachCell(landing, (x, y) => {
        if (sample(x, y).water >= 0) {
          plan.surface.set(cellKey(x, y), "paving");
          plan.reserved.add(cellKey(x, y));
        }
      });
      plan.plots.push({
        ...landing,
        id: `${site.id}-landing`,
        kind: "public",
        access: shore,
      });
    }
  }
  // Sample street frontage; fit the entire building and yard before accepting an entrance.
  const frontage: ({
    point: Point;
    nx: number;
    ny: number;
  } & Partial<UrbanLot>)[] = [...urbanLots];
  for (const road of urban ? [] : plan.roads.filter((p) => p.kind !== "bridge"))
    for (
      let j = profile.frontage;
      j < road.points.length;
      j += organic
        ? Math.max(
            5,
            profile.frontage - 3 + Math.floor(rand(road.id, "spacing", j) * 7),
          )
        : profile.frontage
    ) {
      const p = road.points[j],
        a = road.points[organic ? Math.max(0, j - 4) : j - 1];
      if (
        Math.hypot(p.x - c.x, p.y - c.y) > r - 10 ||
        Math.hypot(p.x - c.x, p.y - c.y) < 10
      )
        continue;
      const vx = p.x - a.x,
        vy = p.y - a.y;
      const dx = organic
          ? Math.abs(vx) >= Math.abs(vy)
            ? Math.sign(vx)
            : 0
          : Math.sign(vx),
        dy = organic
          ? Math.abs(vy) > Math.abs(vx)
            ? Math.sign(vy)
            : 0
          : Math.sign(vy);
      if (!dx && !dy) continue;
      for (const sign of [-1, 1])
        frontage.push({ point: p, nx: -dy * sign, ny: dx * sign });
    }
  // Composed parcels already arrive in the order their own fabric implies, one
  // round per block. Re-sorting them by distance would spend the whole capacity
  // on the quarter beside the plaza.
  if (!(urban && composed))
    frontage.sort(
      (a, b) =>
        Math.hypot(a.point.x - c.x, a.point.y - c.y) -
          Math.hypot(b.point.x - c.x, b.point.y - c.y) ||
        a.point.x - b.point.x ||
        a.point.y - b.point.y,
    );
  const owners: string[] = [];
  /** Households whose work is keeping animals, so a pen has someone to tend it. */
  const herders = new Set<string>();
  // A composed settlement's capacity comes from its own extent and fabric; the
  // flat profile count still governs villages and the older layouts.
  const limit =
    urban && composed
      ? Math.min(urbanCapacity(profile.radius, fabric), profile.buildings)
      : profile.buildings;
  for (let j = 0; j < frontage.length && plan.places.length < limit; j++) {
    const lot = frontage[j];
    const { point, nx, ny } = lot,
      i = plan.places.length;
    const base =
      pack.buildings[Math.floor(rand("building", j) * pack.buildings.length)];
    const facing =
      nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
    const frame =
        lot.frame ??
        (buildingModels[`${base}-${facing}`] ? `${base}-${facing}` : base),
      model = buildingModel(frame),
      [w, h] = model.footprint;
    // Old assets are only used south-facing until their oriented recipes are available.
    if (frame === base && facing !== "south") continue;
    const setback = organic
      ? 2 + Math.floor(rand("setback", j) * 5)
      : profile.paved
        ? 3
        : 4;
    const door = lot.rect
      ? point
      : { x: point.x + nx * setback, y: point.y + ny * setback };
    const rect = lot.rect ?? {
      x: door.x - model.entrance[0],
      y: door.y - model.entrance[1],
      w,
      h,
    };
    const yard = lot.yard ?? {
      x: rect.x - 1 + (nx < 0 ? -4 : 0),
      y: rect.y - 1 + (ny < 0 ? -4 : 0),
      w: w + 2 + (nx ? 4 : 0),
      h: h + 2 + (ny ? 4 : 0),
    };
    if (!dry(yard)) {
      plan.diagnostics.rejectedBuildings++;
      continue;
    }
    if (lot.civic) {
      const id = `${site.id}-civic`;
      eachCell(rect, (x, y) => plan.solid.add(cellKey(x, y)));
      paint(rect, "dirt");
      plan.places.push({
        id,
        name: lot.civic.label,
        owner: `${site.id}-community`,
        description: lot.civic.evidence.note,
        ...rect,
        sprite: frame,
        entrance: door,
        access: "public",
        claim: `civic-${lot.civic.id}`,
        entranceLabel: "Enter",
      });
      plan.objects.push({
        id: `${id}-exit`,
        name: "Return to the square",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: "door-open",
        inventory: {},
      });
      plan.plots.push({
        ...rect,
        id: `${id}-plot`,
        kind: "public",
        access: door,
      });
      continue;
    }
    const id = `${site.id}-h${i}`,
      owner =
        site.home &&
        (urban ? owners.length === 0 : i === 0) &&
        (!pack.setting?.environment ||
          pack.setting.environment.start === "resident")
          ? "player"
          : profile.pattern === "farmstead" && i % 3 !== 0
            ? owners.at(-1)!
            : `${id}-person`;
    const workPoint = lot.workPoint ?? {
      x: rect.x + (nx > 0 ? w + 2 : nx < 0 ? -2 : Math.floor(w / 2)),
      y: rect.y + (ny > 0 ? h + 2 : ny < 0 ? -2 : Math.floor(h / 2)),
    };
    if (!connect(door, point, `door${i}`, 0)) continue;
    const entranceLabel =
      model.opening === "roof-hatch" ? "Climb inside" : "Enter";
    // A settlement that keeps animals asks for someone to keep them. Drawing
    // every household freely from the dozens of trades on offer left a farm
    // with livestock and nobody whose work was livestock, so no pen was built.
    const wanted =
      owner === "player"
        ? pack.role
        : lot.quarter === "market"
          ? "trader"
          : lot.quarter === "craft"
            ? "craftsperson"
            : profile.livestock && i % 3 === 1
              ? "herder"
              : profile.fields !== "none" && i % 3 === 0
                ? "farmer"
                : undefined;
    const livelihood = pack.setting?.characterRevision
      ? characterLivelihood(pack.setting, seed, owner, wanted)
      : undefined;
    const role = livelihood
      ? livelihood.label
      : owner === "player"
        ? pack.role
        : profile.fields !== "none"
          ? i % 3 === 0
            ? "Farmer"
            : i % 3 === 1
              ? "Herder"
              : pack.roles[i % pack.roles.length]
          : pack.roles[i % pack.roles.length];
    // Who keeps animals is a question about the work, not about one label. The
    // livelihood tables name dozens of trades, so matching "Herder" by name
    // left a farmstead with no pen, no gate and no animals at all.
    if (livelihood ? livelihood.activity === HERDING : role === "Herder")
      herders.add(owner);
    eachCell(rect, (x, y) => plan.solid.add(cellKey(x, y)));
    if (!connect(workPoint, door, `yard-access${i}`, 0)) {
      eachCell(rect, (x, y) => plan.solid.delete(cellKey(x, y)));
      continue;
    }
    const shopfront =
      lot.quarter === "market" || lot.quarter === "craft" || i % 4 === 1;
    plan.places.push({
      id,
      name:
        lot.quarter === "market"
          ? `${role}'s shop`
          : lot.quarter === "elite"
            ? "Townhouse"
            : shopfront
              ? `${role}'s workshop`
              : i % 4 === 2
                ? "Household stores"
                : "Household",
      description: model.description,
      x: rect.x,
      y: rect.y,
      w,
      h,
      sprite: frame,
      entrance: door,
      access: shopfront ? "public" : "household",
      owner,
      claim: "landscape",
      entranceLabel,
    });
    if (urban) {
      paint(yard, "dirt");
      const footway = ny
        ? {
            x: rect.x,
            y: ny > 0 ? rect.y - 2 : rect.y + rect.h,
            w: rect.w,
            h: 2,
          }
        : {
            x: nx > 0 ? rect.x - 2 : rect.x + rect.w,
            y: rect.y,
            w: 2,
            h: rect.h,
          };
      const material =
        palette &&
        chooseStreetSurface(
          palette,
          "footway",
          rand("footway-paving", footway.x, footway.y),
        );
      eachCell(footway, (x, y) => {
        const k = cellKey(x, y);
        if (!plan.solid.has(k) && dry({ x, y, w: 1, h: 1 }, false)) {
          plan.surface.set(k, "paving");
          plan.pavement!.set(k, "footway");
          if (material) plan.streetSurfaces!.set(k, material);
          roads.add(k);
        }
      });
    } else if (organic)
      eachCell(yard, (x, y) => {
        plan.reserved.add(cellKey(x, y));
        if (
          Math.hypot(x - door.x, y - door.y) <
          (sharedRoads ? 1.4 : 2 + rand("yard-wear", i) * 2)
        )
          plan.surface.set(cellKey(x, y), "dirt");
      });
    else paint(yard, "dirt");

    plan.plots.push({
      ...yard,
      id: `${id}-plot`,
      kind: "household",
      owner,
      access: door,
    });
    const side = {
      x: workPoint.x + (ny ? (urban ? -1 : 2) : 0),
      y: workPoint.y + (nx ? (urban ? -1 : 2) : 0),
    };
    plan.slots.set(id, {
      yard: [side],
      work: [{ x: workPoint.x - (ny ? 2 : 0), y: workPoint.y - (nx ? 2 : 0) }],
    });
    if (!owners.includes(owner)) {
      owners.push(owner);
      const home = pos(door);
      const a: Actor = {
        id: owner,
        name: proceduralName(pack.setting!, seed, owner),
        role,
        kind: "human",
        pos: { ...home },
        home,
        work: pos(workPoint),
        sprite: `human-${i % 3}-${i % 6}`,
        inventory:
          role === "Farmer"
            ? { grain: 8, water: 2, tool: 1 }
            : role === "Herder"
              ? { wool: 4, water: 2 }
              : role === "Weaver"
                ? { flax: 5, wool: 3, water: 2 }
                : { [pack.trade.take]: 4, [pack.trade.give]: 3, water: 2 },
        activity: "Household work",
        fatigue: 0,
        hunger: 5,
        trust: i % 3 === 0 ? 2 : 1,
        memories: [],
        direction: 2,
      };
      if (pack.setting?.characterRevision)
        Object.assign(
          a,
          generateCharacter(pack.setting, seed, owner, 34, role),
        );
      if (owner !== "player") plan.actors.push(a);
      // The threshold and the work pocket are held against scattered decoration.
      // A rock dropped on a work point is a resident who cannot reach their own
      // work, and the decoration layer only skips reserved ground.
      plan.reserved.add(cellKey(door.x, door.y));
      plan.reserved.add(cellKey(workPoint.x, workPoint.y));
      plan.work.set(owner, {
        home: door,
        work: workPoint,
        water: waterStand,
        social: {
          x: socialCenter.x - 2 + (i % 4),
          y: socialCenter.y + 1 + (Math.floor(i / 4) % 3),
        },
        label:
          role === "Weaver"
            ? "Weaving"
            : role === "Merchant"
              ? "Trading"
              : `${role} at work`,
        offset: Math.floor(rand(owner, "schedule") * 150),
      });
    }
    plan.objects.push(
      {
        id: `${id}-store`,
        name: "Household stores",
        kind: "container",
        pos: pos(side),
        sprite: "basket",
        inventory: pack.setting?.characterRevision
          ? eligibleInventory(
              { grain: 4, wood: 2 },
              resolveCharacterContext(pack.setting),
            )
          : { grain: 4, wood: 2 },
        owner,
      },
      {
        id: `${id}-exit`,
        name:
          model.opening === "roof-hatch" ? "Roof ladder" : "Door to the street",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: model.opening === "roof-hatch" ? "ladder" : "door-open",
        inventory: {},
        owner,
      },
      {
        id: `${id}-bed`,
        name: "Sleeping place",
        kind: "bed",
        pos: { x: 4, y: 3, space: id },
        sprite: "bed",
        inventory: {},
        owner,
      },
      {
        id: `${id}-chest`,
        name: "Household chest",
        kind: "container",
        pos: { x: 8, y: 3, space: id },
        sprite: "basket",
        inventory: pack.setting?.characterRevision
          ? eligibleInventory(
              { grain: 3, wood: 2 },
              resolveCharacterContext(pack.setting),
            )
          : { grain: 3, wood: 2 },
        owner,
      },
    );
  }
  function landPlot(w: number, h: number, label: string): Rect | undefined {
    let best: Rect | undefined,
      score = Infinity,
      fits = 0;
    for (let ring = 45; ring <= r + 22; ring += 12)
      for (let i = 0; i < 20; i++) {
        const angle = organic
            ? rand(label, ring, i, "angle") * Math.PI * 2
            : (i * Math.PI) / 10 + rand(label, "angle"),
          rect = {
            x: c.x + Math.round(Math.cos(angle) * ring) - Math.floor(w / 2),
            y: c.y + Math.round(Math.sin(angle) * ring) - Math.floor(h / 2),
            w,
            h,
          };
        if (dry({ x: rect.x - 2, y: rect.y - 2, w: w + 4, h: h + 4 })) {
          if (!organic) return rect;
          const f = sample(rect.x + w / 2, rect.y + h / 2);
          const value =
            Math.abs(f.moisture - 0.62) * 60 +
            Math.hypot(rect.x - c.x, rect.y - c.y) * 0.1;
          if (value < score) {
            score = value;
            best = rect;
          }
          if (++fits >= 6) return best;
        }
      }
    return best;
  }
  const fieldOwners = characterContext
    ? owners.filter(
        (id) =>
          (id === "player"
            ? pack.role
            : plan.actors.find((a) => a.id === id)?.role) === "Farmer",
      )
    : owners;
  if (
    profile.fields !== "none" &&
    fieldOwners.length &&
    (!characterContext ||
      characterContext.profile.allowedItems.includes("grain"))
  )
    for (let i = 0; i < (profile.pattern === "farmstead" ? 5 : 4); i++) {
      const w =
          profile.fields === "strips"
            ? 6
            : profile.fields === "household"
              ? 9
              : 20,
        h =
          profile.fields === "strips"
            ? 24
            : profile.fields === "household"
              ? 10
              : 13;
      const field = landPlot(w, h, `field${i}`);
      if (!field) continue;
      const access = { x: field.x + Math.floor(w / 2), y: field.y + h + 1 };
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, access, `field-access${i}`, 0)) {
        eachCell(field, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = fieldOwners[i % fieldOwners.length],
        id = `${site.id}-field${i}`;
      paint(field, "field");
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      plan.plots.push({ ...field, id, kind: "field", owner, access });
      for (let y = field.y + 2; y < field.y + h - 2; y += 6)
        for (let x = field.x + 2; x < field.x + w - 2; x += 6)
          plan.objects.push({
            id: `${id}-crop-${x - field.x}-${y - field.y}`,
            name: "Cultivated grain",
            kind: "crop",
            pos: pos({ x, y }),
            sprite: "wheat",
            inventory: { grain: 3 },
            ...(pack.setting?.environment
              ? {
                  resource: {
                    item: "grain" as const,
                    capacity: 3,
                    regrowSeconds: 28 * 86400,
                    seasons: ["summer", "autumn"],
                    readyAt: 0,
                  },
                }
              : {}),
            owner,
            claim: "landscape",
          });
      const a = plan.actors.find((a) => a.id === owner)!;
      if (a) {
        a.role = "Farmer";
        a.work = pos(access);
      }
      const work = plan.work.get(owner)!;
      work.work = access;
      work.label = "Tending the field";
    }
  const herdOwners = owners
    .filter((id) => id !== "player" && herders.has(id))
    .slice(-2);
  if (profile.livestock && herdOwners.length)
    for (let i = 0; i < Math.min(2, herdOwners.length); i++) {
      const pen = landPlot(12, 11, `pen${i}`);
      if (!pen) continue;
      const gate = { x: pen.x + Math.floor(pen.w / 2), y: pen.y + pen.h - 1 },
        outside = { x: gate.x, y: gate.y + 1 };
      eachCell(pen, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, outside, `pen-access${i}`, 0)) {
        eachCell(pen, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = herdOwners[i],
        id = `${site.id}-pen${i}`,
        gateId = `${id}-gate`;
      plan.enclosures.push({ ...pen, gate });
      eachCell(pen, (x, y) => {
        const k = cellKey(x, y);
        plan.reserved.add(k);
        if (
          (x === pen.x ||
            x === pen.x + pen.w - 1 ||
            y === pen.y ||
            y === pen.y + pen.h - 1) &&
          (x !== gate.x || y !== gate.y)
        )
          plan.solid.add(k);
      });
      plan.objects.push({
        id: gateId,
        name: "Livestock gate",
        kind: "gate",
        pos: pos(gate),
        sprite: "gate",
        inventory: {},
        open: false,
        owner,
      });
      plan.objects.push({
        id: `${id}-trough`,
        name: "Animal trough",
        kind: "container",
        prop: "trough",
        sprite: "study-prop-trough-0",
        inventory: { water: 4 },
        owner,
        pos: pos({ x: pen.x + 2, y: pen.y + 2 }),
      });
      const pasture = { x: gate.x - 3, y: gate.y + 3, w: 7, h: 6 };
      const hasPasture = dry(pasture);
      if (hasPasture) {
        eachCell(pasture, (x, y) => plan.reserved.add(cellKey(x, y)));
        plan.plots.push({
          ...pasture,
          id: `${id}-pasture`,
          kind: "pasture",
          owner,
          access: outside,
        });
      }
      plan.plots.push({ ...pen, id, kind: "pasture", owner, access: outside });
      const herder = plan.actors.find((a) => a.id === owner)!;
      herder.role = "Herder";
      herder.work = pos(outside);
      const hw = plan.work.get(owner)!;
      hw.work = outside;
      hw.gateId = gateId;
      hw.label = "Tending livestock";
      for (let j = 0; j < 3; j++) {
        const home = { x: pen.x + 3 + j * 2, y: pen.y + 4 },
          kind = j === 2 ? "goat" : "sheep",
          aid = `${id}-animal${j}`,
          grazing = hasPasture
            ? { x: gate.x - 2 + j * 2, y: gate.y + 5 }
            : home;
        plan.actors.push({
          id: aid,
          name: kind === "goat" ? "Goat" : "Sheep",
          kind,
          role: "Animal",
          pos: pos(home),
          home: pos(home),
          work: pos(grazing),
          sprite: kind,
          inventory: {},
          activity: "Resting in the enclosure",
          fatigue: 0,
          hunger: 0,
          trust: 0,
          owner,
          memories: [],
          direction: 2,
        });
        plan.work.set(aid, {
          home,
          work: grazing,
          pasture: grazing,
          water: home,
          social: home,
          label: "Grazing",
          gateId,
          offset: j * 7,
        });
      }
    }
  if (pack.setting?.characterRevision) {
    for (const actor of plan.actors) {
      if (actor.kind !== "human") continue;
      const lacksWork =
        (actor.role === "Herder" && !plan.work.get(actor.id)?.gateId) ||
        (actor.role === "Farmer" &&
          !plan.plots.some((p) => p.kind === "field" && p.owner === actor.id));
      if (lacksWork)
        Object.assign(
          actor,
          generateCharacter(
            pack.setting,
            seed,
            actor.id,
            actor.age ?? 34,
            "Gatherer",
          ),
        );
    }
  }
  planRoutines(plan, seed, pack, sample);
  return plan;
}
