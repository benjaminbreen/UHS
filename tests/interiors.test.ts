import { describe, expect, it } from "vitest";
import { interiorProfiles, resolveRoom } from "../src/content/interiors";
import { interiorProfileFor } from "../src/content/interiors/select";
import { worshipAct, worshipHours } from "../src/content/interiors/worship";
import { aarti, passageOn } from "../src/content/interiors/scripture";
import { buildInterior, ROOM_ORIGIN, roomAt } from "../src/world/interior";
import { resolveSetting, theaterViewerSetting } from "../src/content/geography/resolve";
import { THEATER_VIEWER_PRESETS } from "../src/content/interiors/performances";
import { planRoom, roomMask, type Shape } from "../src/render/interiors/room";
import { LETTERS, SPRITES } from "../src/render/interiors/sprites";
import { ALTARS } from "../src/render/interiors/altars";
import { FITS } from "../src/render/interiors/fits";
import { livelihoodById } from "../src/content/characters/livelihoods";
import { theatres } from "../src/content/interiors/theatres";
import { planBuilding } from "../src/render/interiors/building";
import type { SettlementWorld } from "../src/world/v3/generate";
import { livelihoodOf, placeFor, routineFor } from "../src/world/v3/routines";
import { doorApproach } from "../src/core/doors";
import type { Place } from "../src/core/types";
import { towerStyles } from "../src/content/towers";
import { towerPlan } from "../src/world/tower";
import { resolveCharacterContext } from "../src/content/characters/resolve";
import { createSettingSession } from "../src/runtime/session";
import { beliefsForActor } from "../src/content/beliefs";
import { officeAtSanctuary } from "../src/content/characters/officiant";
import { sanctuaryAt, religiousProfile } from "../src/content/settlements/religious";
import type { WorldSetting } from "../src/content/geography/types";
import { panelSetting } from "../scripts/review/panel";
import { shopKinds } from "../src/content/interiors/shops";
import { SECRET_BACKROOMS, pickBackroom, pickHouseholdQuirk } from "../src/content/interiors/backrooms";
import { INSTRUMENTS, instrumentForProp } from "../src/audio/instruments";
import { synthesize } from "../src/audio/synth";
import { performRoomAct } from "../src/core/room-props";
import { propDefs } from "../src/content/props/catalog";

const shapes: Shape[] = ["rect", "L", "round", "oval", "apse", "courtyard"];

describe("interior profiles", () => {
  it.runIf(!!process.env.FULL).each([
    ["A rabbi in Thessaloniki, 1700","Jewish","Genesis"],
    ["A priest in London, 2020","Anglican","Matthew"],
    ["A Nichiren monk in Kyoto, 1350","lotus","Lotus Sutra"],
    ["A hunter in Sydney, 1750","",""],
  ])("ties residents, work and worship together in %s", (prompt,tradition,reading) => {
    const seed = "faith-audit", start = resolveSetting(prompt,seed);
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting,seed), player = e.state.player;
    const s = e.world.pack.setting!, people = [player,...e.state.actors.filter(a => a.kind === "human")];
    const sites = e.world.places.filter(p => sanctuaryAt(p));
    const jobs = people.filter(a => e.world.activitySites?.(a.id)?.employment?.kind === "worship");
    if (!tradition) {
      expect(sites).toHaveLength(0);
      expect(jobs).toHaveLength(0);
      expect(beliefsForActor(s,player).practice.length).toBeGreaterThan(0);
      return;
    }
    expect(sites.length).toBeGreaterThan(1);
    expect(new Set(sites.map(p => p.id)).size).toBe(sites.length);
    for (const p of sites) {
      const room = e.interiorOf(p.id)!, door = e.doorOf(p.id)!;
      expect(door.placeId).toBe(p.id);
      const step = doorApproach(p);
      expect(e.blocked(step.x,step.y,"outside"), p.name).toBe(false);
      expect(room.observance?.tradition).toBe(p.worshipSchool ?? sanctuaryAt(p)?.faith);
    }
    const place = sites.find(p => (p.worshipSchool ?? sanctuaryAt(p)?.faith) === tradition)!;
    expect(place).toBeDefined();
    expect(e.interiorOf(place.id)?.observance?.service?.passage?.title).toBe(reading);
    expect(jobs).toContain(player);
    for (const a of jobs) {
      const site = e.world.place(e.world.activitySites!(a.id)!.employment!.id);
      expect(officeAtSanctuary(s,a.role,beliefsForActor(s,a),sanctuaryAt(site),site?.worshipSchool),a.role).toBe(true);
    }
    const plan = (e.world as SettlementWorld).planAt(place.x,place.y)!;
    for (const a of people.slice(0,30)) {
      const worship = beliefsForActor(s,a).worship;
      const target = placeFor(plan,seed,a.id,a.home,a.work,s.year,"sanctuary",undefined,false,a);
      const own = sites.find(p => worship?.includes(p.worshipSchool ?? sanctuaryAt(p)!.faith));
      expect(target?.pos).toEqual(own?.entrance);
    }
    const residents = people.map(a => beliefsForActor(s,a));
    expect(residents.some(b => b.worship?.includes(tradition))).toBe(true);
    expect(residents.some(b => !b.worship?.includes(tradition))).toBe(true);
    if (tradition === "lotus") {
      const other = sites.find(p => p.worshipSchool === "pure-land")!;
      expect(e.interiorOf(other.id)?.observance?.service?.passage?.title).toBe("Nembutsu");
      const monk = jobs.find(a => a.role === "Pure Land monk");
      expect(monk && e.world.activitySites!(monk.id)?.employment?.id).toBe(other.id);
      for (let day = 0; day < 21; day++) {
        const agenda = e.world.agenda!(player,day*86400);
        expect(agenda?.items.some(o => o.id === "day.japan.nembutsu")).toBe(false);
      }
    }
    if (tradition === "Anglican") expect(residents.some(b => b.label === "No religious affiliation")).toBe(true);
  });

  it.runIf(!!process.env.FULL)("starts a granthi on duty inside and lets the player listen and serve in the proper rooms", () => {
    const seed = "service-2", start = resolveSetting("A granthi in Amritsar, 1750",seed);
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting,seed), p = e.state.player;
    const job = e.world.activitySites?.("player")?.employment;
    expect(job?.kind).toBe("worship");
    expect(p.pos.space).toBe(job!.id);
    const layout = e.interiorOf(job!.id)!;
    const action = (label:string) => {
      const labels = new Set<string>();
      for (const cell of layout.walk) {
        const [x,y] = cell.split(",").map(Number);
        if (e.blocked(x,y,job!.id) || e.actorAt({x,y,space:job!.id},"player")) continue;
        p.pos = {x,y,space:job!.id};
        const a = e.worshipAction();
        if (a) labels.add(a.label);
        if (a?.label === label) return a;
      }
      throw Error(`No ${label}; available: ${[...labels]}; held: ${p.heldItem ?? p.held}; seats: ${layout.seats.length}`);
    };
    e.advance(30);
    const listen = action("Sit and listen");
    expect(roomAt(layout,p.pos.x,p.pos.y)?.role).toBe("sanctum");
    const heard = e.overheardReading();
    expect(heard?.passage.title).toMatch(/^Barah Maha/);
    expect(e.withinEarshot(heard!.reader,8)).toBe(true);
    const singers = e.state.actors.filter(a => a.pos.space === job!.id && worshipAct(layout.observance,a.activity,e.state.clock)?.passage)
      .map(actor => ({actor, activity:actor.activity}));
    const affiliations = singers.map(({actor}) => actor.origin!.belief);
    for (const {actor} of singers) actor.origin!.belief = "london-unaffiliated";
    expect(e.overheardReading()).toBeUndefined();
    singers.forEach(({actor},i) => { actor.origin!.belief = affiliations[i]; });
    for (const {actor} of singers) actor.activity = layout.observance!.visit.label;
    expect(e.overheardReading()).toBeUndefined();
    for (const {actor, activity} of singers) actor.activity = activity;
    e.execute(listen.command);
    expect(p.activity).toBe("Sitting and listening");
    e.execute(e.worshipAction()!.command);
    if (p.heldItem) e.execute({type:"stow"});
    const serve = action("Help serve the meal");
    expect(roomAt(layout,p.pos.x,p.pos.y)?.role).toBe("kitchen");
    expect(e.overheardReading()).toBeUndefined();
    serve.person!.hunger = 16;
    const at = e.state.clock, hunger = serve.person!.hunger;
    e.execute(serve.command);
    expect(e.state.clock - at).toBe(300);
    expect(serve.person!.hunger).toBeLessThan(hunger);
    expect(serve.person!.sharedMealHour).toBe(Math.floor(at/3600));
    p.pos = {...layout.entry,space:job!.id};
    expect(e.validate(serve.command)).toBeTruthy();
    expect(e.validate({type:"interact",action:"participate",target:job!.id+"/row"})).toBeTruthy();
  });
  it("plan every profile at every status, shape and size without overlaps or props outside the walls", () => {
    for (const pr of interiorProfiles)
      for (const room of (pr.rooms ?? [pr]).map((_, i) => i))
      for (const status of [0, 1, 2] as const)
        for (const shape of shapes)
          for (const [w, d] of [pr.size, [8, 6], [24, 16]]) {
            const p = resolveRoom(pr, { seed: 11, room, status, colorway: -1, w, d, shape, hour: 10 });
            const props = planRoom(p), mask = roomMask(p);
            const seen = new Set<number>();
            for (const q of props) {
              if (q.wall || q.kind === "rug" || q.kind === "cat" || q.kind === "fountain" || q.kind === "clutter") continue;
              for (let y = q.y; y < q.y + q.d; y++)
                for (let x = q.x; x < q.x + q.w; x++) {
                  expect(mask[y * w + x], `${pr.id} ${q.kind} at ${x},${y}`).toBeGreaterThan(0);
                  expect(seen.has(y * w + x), `${pr.id} ${q.kind} overlaps at ${x},${y}`).toBe(false);
                  seen.add(y * w + x);
                }
            }
            expect(props.filter((q) => q.kind === "door").length).toBe(pr.door === "none" ? 0 : 1);
          }
  });

  it("gives every profile colourways and a note on its evidence", () => {
    for (const pr of interiorProfiles) {
      expect(pr.colorways.length, pr.id).toBeGreaterThanOrEqual(2);
      expect(pr.note.length, pr.id).toBeGreaterThan(40);
    }
  });

  it("picks a dwelling that belongs to the place and date", () => {
    expect(interiorProfileFor({ lon: 135.8, lat: 35, year: 1700, settlement: "city" }).id).toBe("japanese-minka");
    expect(interiorProfileFor({ lon: 0.5, lat: 49, year: 1350, settlement: "village" }).id).toBe("medieval-cottage");
    expect(interiorProfileFor({ lon: 32.8, lat: 37.7, year: -7000 }).id).toBe("catalhoyuk-house");
    expect(interiorProfileFor({ lon: 106, lat: 47, year: 1600, camp: true }).id).toBe("mongol-ger");
    expect(interiorProfileFor({ lon: -90, lat: 41, year: 1935, settlement: "village" }).id).toBe("farmhouse-1930s");
    expect(interiorProfileFor({ lon: -0.1, lat: 51.5, year: 1700, settlement: "city", use: "venue.alehouse" }).id).toBe("english-tavern");
    expect(interiorProfileFor({ lon: -0.1, lat: 51.5, year: 1700, settlement: "city", use: "venue.town-hall" }).id).not.toBe("english-tavern");
    expect(interiorProfileFor({ lon: 135.8, lat: 35, year: 1700, settlement: "city", use: "venue.alehouse" }).id).toBe("japanese-minka");
    // A generic venue becomes what its region and century made of it.
    const venue = (lon: number, lat: number, year: number, v: string) => interiorProfileFor({ lon, lat, year, settlement: "city", use: v }).id;
    expect(venue(29, 41, 1650, "venue.bath-house")).toBe("hammam");
    expect(venue(29, 41, 400, "venue.bath-house")).toBe("roman-baths");
    expect(venue(12.5, 41.9, 1300, "venue.bath-house")).not.toBe("hammam");
    expect(venue(-4.8, 37.9, 1000, "venue.bath-house")).toBe("hammam");
    expect(venue(-4.8, 37.9, 1600, "venue.bath-house")).not.toBe("hammam");
    expect(venue(31.2, 30, 1530, "venue.coffee-house")).toBe("kahvehane");
    expect(venue(-0.1, 51.5, 1700, "venue.coffee-house")).not.toBe("kahvehane");
    expect(venue(12.5, 41.9, 1700, "venue.coffee-house")).not.toBe("kahvehane");
    expect(venue(14.3, 40.85, 1700, "venue.gaming-house")).toBe("gaming-house");
    expect(venue(29, 41, 1700, "venue.gaming-house")).toBe("kahvehane");
    expect(venue(10.2, 36.8, 1700, "venue.bath-house")).toBe("hammam");
    expect(venue(3.05, 36.75, 1700, "venue.coffee-house")).toBe("kahvehane");
    expect(venue(-99, 19, 1450, "venue.sweat-lodge")).toBe("temazcal");
    expect(venue(4.9, 52.4, 1650, "venue.alehouse")).toBe("english-tavern");
  });

  it("opens a building on the room its form makes, and fills the regions that fell back to an English cottage", () => {
    const pick = (lon: number, lat: number, year: number, more: object = {}) => interiorProfileFor({ lon, lat, year, settlement: "village", ...more }).id;
    expect(pick(-2, 51, -2500, { frame: "house-round-3" }), "a round hut is a round room").toBe("round-hut");
    expect(pick(139, 36, -3000, { frame: "house-pit-1" })).toBe("pit-house");
    expect(pick(105, 47, 900, { camp: true, frame: "steppe-tent-xiongnu-1" })).toBe("mongol-ger");
    expect(pick(22, -22, 1700, { camp: true, frame: "forager-shelter-san-1" })).toBe("forager-shelter");
    expect(pick(135.7, 35, 1200, { settlement: "city" })).toBe("japanese-minka");
    expect(pick(31.2, 30, 1300, { settlement: "city" })).toBe("maghrebi-dar");
    expect(pick(32, 26, -1500)).toBe("fellah-house");
    expect(pick(4.8, 45.7, 1742, { settlement: "city" })).toBe("european-townhouse");
    expect(pick(-3, 16.8, 1400, { settlement: "city" })).toBe("sahel-mud-house");
    expect(pick(-99.1, 19.4, 1450, { settlement: "city" })).toBe("mesoamerican-house");
    expect(pick(-72, -13.5, 1500)).toBe("andean-house");
    expect(pick(103.9, 13.4, 1200)).toBe("stilt-house");
    expect(pick(30.9, -20.3, 1300)).toBe("round-hut");
    const door = buildInterior({ id: "h", name: "House", claim: "landscape", access: "household" } as Place, { lon: 32.8, lat: 37.6, year: -6500, frame: "house-mudbrick-ob-1" }, {});
    expect(door.plan.entrance[0], "a Çatalhöyük plan behind a street door has a door").toBeGreaterThanOrEqual(0);
  });

  it("serves every drinking house from behind its counter, with seats and a bed for the household", () => {
    const sites = [
      { id: "english-tavern", lon: -0.1, lat: 51.5, year: 1700, use: "venue.alehouse", seat: "bench" },
      { id: "izakaya", lon: 139.7, lat: 35.7, year: 1800, use: "venue.izakaya", seat: "cushions" },
      { id: "kahvehane", lon: 29, lat: 41, year: 1650, use: "venue.kahvehane", seat: "divan" },
      { id: "pulqueria", lon: -99, lat: 19.4, year: 1750, use: "venue.pulqueria", seat: "bench" },
      { id: "chicheria", lon: -72, lat: -13.5, year: 1600, use: "venue.chicheria", seat: "bench" },
      { id: "chinese-teahouse", lon: 120, lat: 30, year: 1200, use: "venue.teahouse-east", seat: "bench" },
      { id: "chaya", lon: 135.8, lat: 35, year: 1700, use: "venue.teahouse-east", seat: "cushions" },
      { id: "chaikhana", lon: 64.4, lat: 39.8, year: 1800, use: "venue.chaikhana", seat: "cushions" },
      { id: "roman-gaming-house", lon: 14.5, lat: 40.75, year: 50, use: "venue.gaming-house", seat: "bench" },
      { id: "gaming-house", lon: -0.1, lat: 51.5, year: 1700, use: "venue.gaming-house", seat: "bench" },
      { id: "chinese-gaming-house", lon: 113.3, lat: 23.1, year: 1850, use: "venue.gaming-house", seat: "bench" },
      { id: "bakuchi-den", lon: 135.8, lat: 35, year: 1750, use: "venue.gaming-house", seat: "cushions" },
    ];
    for (const { id, seat, ...site } of sites)
      for (const fortune of [0.1, 0.5, 0.9])
        for (let n = 0; n < 15; n++) {
          const room = buildInterior({ id: `t-${id}-${n}`, access: "public", claim: `venue-${site.use}` } as Place, { ...site, settlement: "city" }, { fortune });
          const where = `${id} ${fortune} #${n}`;
          expect(interiorProfileFor(site).id, where).toBe(id);
          expect(room.work[0], where).toMatchObject({ kind: "bar", facing: 2 });
          expect(room.beds.length, where).toBeGreaterThan(0);
          expect(room.seats.some((s) => s.kind === seat), where).toBe(true);
        }
  });

  it("puts the chambers of a house of two storeys up a flight of stairs, every bed reached from the street door", () => {
    const sites = [
      { lon: -0.1, lat: 51.5, year: 1700, settlement: "city" },
      { lon: 4.9, lat: 52.4, year: 1650, settlement: "city" },
      { lon: -93, lat: 42, year: 1930, settlement: "village" },
      { lon: -0.1, lat: 51.5, year: 1450, settlement: "city", use: "worksite.european-inn" },
    ];
    for (const [i, site] of sites.entries())
      for (let n = 0; n < 6; n++) {
        const where = `${interiorProfileFor(site).id} #${n}`;
        const house = { id: `t-up${i}-${n}`, name: "House", description: "", x: 0, y: 0, w: 8, h: 6, sprite: "roman-insula-roman-italian-large-0", entrance: { x: 0, y: 0 }, access: "household", owner: "o", claim: site.use ?? "" } as Place;
        const room = buildInterior(house, site, { fortune: 0.5 });
        const flights = room.plan.doorways.filter((dw) => dw.stairs);
        expect(flights.length, where).toBeGreaterThan(0);
        expect(room.rooms.some((r) => r.label === "Landing"), where).toBe(true);
        const up = room.rooms.filter((r) => r.role === "sleep");
        expect(up.length, where).toBeGreaterThan(1);
        // interior.ts keeps only what the door leads to: a bed in every chamber means the stairs join the floors.
        for (const r of up) expect(room.beds.some((b) => b.x > r.x && b.x <= r.x + r.w && b.y > r.y && b.y <= r.y + r.d), `${where} ${r.label}`).toBe(true);
        // Floors stand clear of one another, and nothing a person uses is shut in: each loose piece has floor beside it.
        for (const dw of flights) expect(new Set(dw.cells.map((c) => c[1])).size, where).toBeGreaterThanOrEqual(7);
        for (const f of room.furniture) {
          // A table is reached from the seats drawn up to it.
          if (/table/.test(f.def)) continue;
          const edge = [];
          for (let x = f.pos.x - 1; x <= f.pos.x + f.size[0]; x++) for (let y = f.pos.y - 1; y <= f.pos.y + f.size[1]; y++) if ((x < f.pos.x || x >= f.pos.x + f.size[0]) !== (y < f.pos.y || y >= f.pos.y + f.size[1])) edge.push(`${x},${y}`);
          expect(edge.some((k) => room.walk.has(k)), `${where} ${f.def} at ${f.pos.x},${f.pos.y}`).toBe(true);
        }
      }
  });

  it("gives every house a way in and out, and every place to stand can be walked to from the door", () => {
    const place = (id: string): Place => ({ id, name: "House", description: "", x: 0, y: 0, w: 3, h: 3, entrance: { x: 0, y: 0 }, access: "household", owner: "o", claim: "" }) as Place;
    const sites = [
      { lon: 135.8, lat: 35, year: 1700, settlement: "city" },
      { lon: 127, lat: 37, year: 1700 },
      { lon: 112, lat: 34, year: 1500, settlement: "city" },
      { lon: 0.5, lat: 49, year: 1350 },
      { lon: 4, lat: 51, year: 1650, settlement: "city" },
      { lon: 10, lat: 60, year: 900 },
      { lon: 12, lat: 42, year: 50, settlement: "city" },
      { lon: 12, lat: 42, year: 50, camp: true },
      { lon: 32.8, lat: 37.7, year: -7000, roofHatch: true },
      { lon: -3, lat: 58, year: -3000 },
      { lon: 15, lat: 49, year: -5000 },
      { lon: -100, lat: 44, year: 1850, camp: true },
      { lon: -90, lat: 41, year: 1935, settlement: "village" },
      { lon: -74, lat: 40, year: 1935, settlement: "city" },
      { lon: 75, lat: 26.9, year: 1800, settlement: "city" },
      { lon: 80, lat: 25, year: 1800, settlement: "village" },
      { lon: 8, lat: 30, year: 1000, settlement: "city" },
      { lon: 5, lat: 30, year: 1000, settlement: "village" },
      { lon: 45, lat: 25, year: 600, camp: true },
      { lon: 100, lat: 47, year: 1600, camp: true },
      { lon: 133, lat: -12, year: 1500 },
      { lon: 142, lat: -38, year: 1500 },
      { lon: 10, lat: 50, year: 2000, camp: true },
      { lon: -0.1, lat: 51.5, year: 1700, settlement: "city", use: "venue.alehouse" },
    ];
    const hit = new Set<string>();
    for (const [i, site] of sites.entries())
      for (const activity of ["Weaving", "Turning pots", "Keeping the record", "Trading", "Hunting", "Household work"])
        for (const fortune of [0.1, 0.5, 0.9])
          for (let n = 0; n < 4; n++) {
            const id = interiorProfileFor(site).id;
            hit.add(id);
            const where = `${id} ${activity} ${fortune} #${n}`;
            const room = buildInterior(place(`t-h${i}-${n}`), site, { fortune, activity });
            const seen = new Set([`${room.entry.x},${room.entry.y}`]);
            for (const k of seen) {
              const [x, y] = k.split(",").map(Number);
              for (const m of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) if (room.walk.has(m)) seen.add(m);
            }
            const reach = (p: { x: number; y: number }) => seen.has(`${p.x},${p.y}`);
            expect(reach(room.exit), where).toBe(true);
            expect(room.entry, where).not.toEqual(room.exit);
            expect([...room.walk].every((k) => seen.has(k)), `${where} has a pocket the door cannot reach`).toBe(true);
            for (const spot of [...room.beds, ...room.work, ...room.fire, ...room.seats])
              // Sat on or lain in, a piece is reached from the floor beside it.
              expect(spot.on ? [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach({ x: spot.x + dx, y: spot.y + dy })) : reach(spot), `${where} ${spot.kind}`).toBe(true);
            for (const c of [room.bedCell, room.workCell, room.store])
              expect([c, { x: c.x + 1, y: c.y }, { x: c.x - 1, y: c.y }, { x: c.x, y: c.y + 1 }, { x: c.x, y: c.y - 1 }].some(reach), `${where} station out of reach`).toBe(true);
          }
    expect(hit.size).toBeGreaterThanOrEqual(22);
  });

  it("rings the seats of a gathering place round its fire or its water, with nobody behind a counter", () => {
    const sites = [
      { id: "sweat-lodge", lon: -101, lat: 44, year: 1850, use: "venue.sweat-lodge", seat: "cushions", also: ["firepit"] },
      { id: "kiva", lon: -108.5, lat: 37.2, year: 1100, use: "venue.kiva", seat: "ledge", also: ["firepit", "sipapu", "ladder"] },
      { id: "temazcal", lon: -90, lat: 17, year: 700, use: "venue.temazcal", seat: "cushions", also: ["hearth"] },
      { id: "roman-baths", lon: 14.5, lat: 40.75, year: 70, use: "venue.bath-house", seat: "ledge", also: ["pool", "basin", "brazier"] },
      { id: "hammam", lon: 29, lat: 41, year: 1600, use: "venue.hammam", seat: "ledge", also: ["slab", "basin", "pool"] },
      { id: "sento", lon: 139.7, lat: 35.7, year: 1800, use: "venue.sento", seat: "ledge", also: ["pool"] },
      { id: "madrasa", lon: 51.7, lat: 32.7, year: 1650, use: "venue.madrasa", seat: "cushions", also: ["lectern"] },
      { id: "quranic-school", lon: -3, lat: 16.8, year: 1500, use: "venue.quranic-school", seat: "cushions", also: ["lectern"] },
      { id: "wharenui", lon: 176, lat: -38, year: 1880, use: "venue.meeting-house", seat: "ledge", also: [] },
      { id: "council-longhouse", lon: -76, lat: 43, year: 1600, use: "venue.longhouse-council", seat: "ledge", also: ["firepit", "pegs"] },
      { id: "haus-tambaran", lon: 143, lat: -4, year: 1900, use: "venue.mens-house", seat: "ledge", also: ["firepit", "altar"] },
      { id: "age-set-house", lon: 36.8, lat: -2, year: 1850, use: "venue.age-set-house", seat: "cushions", also: ["firepit", "pegs"] },
      { id: "mound-temple", lon: -84.8, lat: 34.1, year: 1200, use: "religious.mississippian-platform-mound", seat: "ledge", also: ["firepit", "altar"] },
      { id: "telpochcalli", lon: -99.1, lat: 19.4, year: 1500, use: "venue.telpochcalli", seat: "cushions", also: ["brazier", "altar"] },
    ];
    for (const { id, seat, also, ...site } of sites)
      for (const fortune of [0.1, 0.5, 0.9])
        for (let n = 0; n < 10; n++) {
          const room = buildInterior({ id: `t-${id}-${n}`, access: "public", claim: `venue-${site.use}` } as Place, site, { fortune });
          const where = `${id} ${fortune} #${n}`;
          expect(interiorProfileFor(site).id, where).toBe(id);
          expect(room.params.program, where).toBe("gather");
          expect(room.seats.filter((s) => s.kind === seat).length, where).toBeGreaterThanOrEqual(4);
          for (const k of also) expect(room.props.some((q) => q.kind === k), `${where} ${k}`).toBe(true);
          expect(room.props.some((q) => q.kind === "bar"), where).toBe(false);
        }
  });

  it.runIf(!!process.env.FULL)("lodges whoever keeps a kiva with a neighbouring household, and leaves the kiva to its gatherings", () => {
    const e = createSettingSession({ ...panelSetting("area-colorado-plateau", 1100), settlement: "city", season: "summer" }, "cust");
    const kiva = e.world.places.find((p) => p.claim === "venue-venue.kiva")!;
    expect(e.state.households!.some((h) => h.residence === kiva.id)).toBe(false);
    const keeper = e.state.households!.find((h) => h.members.includes(kiva.owner))!;
    expect(e.world.place(keeper.residence!)!.claim.startsWith("venue-")).toBe(false);
    expect(e.interiorOf(kiva.id)!.params.program).toBe("gather");
  });

  it("builds the mosque of its region at the head of an Islamic town", () => {
    const at = (lon: number, lat: number, year: number) =>
      religiousProfile({ culture: "north-african-west-asian", lon, lat, year } as WorldSetting)?.id;
    expect(at(29, 41, 1600)).toBe("ottoman-mosque");
    expect(at(36.3, 33.5, 1300)).toBe("arab-mosque");
    expect(at(37.15, 36.2, 1600)).toBe("arab-mosque");
    expect(at(31.2, 30, 1400)).toBe("arab-mosque");
    expect(at(-5, 34, 1400)).toBe("maghrebi-mosque");
    expect(at(10.2, 36.8, 1700)).toBe("maghrebi-mosque");
    expect(at(51.7, 32.7, 1650)).toBe("persian-mosque");
    expect(at(44.4, 32.5, -2000)).toBe("mesopotamian-temple");
    const east = (lon: number, lat: number, year: number) =>
      religiousProfile({ culture: "east-asian", lon, lat, year } as WorldSetting)?.id;
    expect(east(116.4, 39.9, 1600)).toBe("chinese-temple");
    expect(east(126.98, 37.57, 1600)).toBe("korean-temple");
    expect(east(135.77, 35.01, 1700)).toBe("japanese-temple");
  });

  it("builds each faith's own sanctuary where it was the town's", () => {
    const at = (culture: WorldSetting["culture"], lon: number, lat: number, year: number) =>
      religiousProfile({ culture, lon, lat, year } as WorldSetting)?.id;
    // The Latin parish stops at the Orthodox frontier.
    expect(at("european", 2, 47, 1300)).toBe("gothic-parish");
    expect(at("european", 19.9, 50.06, 1400)).toBe("gothic-parish"); // Kraków
    expect(at("european", 25.3, 54.7, 1500)).toBe("gothic-parish"); // Vilnius
    expect(at("european", 22.9, 40.6, 1300)).toBe("byzantine-church"); // Thessaloniki
    expect(at("european", 23.7, 38, 1100)).toBe("byzantine-church"); // Athens
    expect(at("european", 20.5, 44.8, 1300)).toBe("byzantine-church"); // Belgrade
    expect(at("european", 26.1, 44.4, 1700)).toBe("byzantine-church"); // Bucharest
    expect(at("european", 31.3, 58.5, 1200)).toBe("rus-church"); // Novgorod
    expect(at("european", 30.5, 50.4, 1100)).toBe("rus-church"); // Kyiv
    expect(at("european", 37.6, 55.75, 1600)).toBe("muscovite-church");
    expect(at("european", 28.97, 41.0, 1600)).toBe("ottoman-mosque-istanbul");
    expect(at("european", 22.9, 40.6, 1700)).toBe("sephardi-synagogue");
    expect(at("north-african-west-asian", 44.8, 41.7, 1600)).toBe("caucasian-church"); // Tbilisi
    expect(at("north-african-west-asian", 36.3, 33.5, 500)).toBe("byzantine-church"); // Damascus
    expect(at("north-african-west-asian", 23.9 + 0.3, 40.2, 1500)).toBe("orthodox-monastery"); // Athos
    // Ethiopia, the Swahili coast and the Sahel, whatever family the atlas gives them.
    expect(at("west-central-african", 37.46, 12.6, 1700)).toBe("ethiopian-church"); // Gondar
    expect(at("east-southern-african", 39.04, 12.03, 1300)).toBe("ethiopian-church"); // Lalibela
    expect(at("west-central-african", 39.67, -4.05, 1600)).toBe("swahili-mosque"); // Mombasa
    expect(at("west-central-african", -4.55, 13.9, 1400)).toBe("sahel-mosque"); // Djenné
    expect(at("west-central-african", 8.52, 12, 1600)).toBe("sahel-mosque-south"); // Kano
    expect(at("west-central-african", 5.62, 6.34, 1600)).toBe("orisha-shrine"); // Benin City
    expect(at("west-central-african", -1.6, 6.7, 1800)).toBe("asante-shrine"); // Kumasi
    expect(at("west-central-african", 7.5, 6.4, 1500)).toBe("sacred-grove"); // Igboland
    expect(at("north-african-west-asian", 31.2, 30, 600)).toBe("coptic-church");
    expect(at("north-african-west-asian", 31.2, 30, 1000)).toBe("arab-mosque");
    expect(at("north-african-west-asian", 32.65, 25.7, -1300)).toBe("pharaonic-temple"); // Thebes
    expect(at("west-central-african", 30.5, 18.2, 900)).toBe("nubian-church"); // Old Dongola
    // Iran and Central Asia.
    expect(at("north-african-west-asian", 54.4, 31.9, 600)).toBe("iranian-fire-temple"); // Yazd
    expect(at("north-african-west-asian", 54.4, 31.9, 1100)).toBe("persian-mosque");
    expect(at("inner-eurasian", 64.4, 39.8, 1500)).toBe("central-asian-mosque"); // Bukhara
    // South and Southeast Asia.
    expect(at("south-asian", 78.12, 9.92, 1600)).toBe("dravida-temple"); // Madurai
    expect(at("south-asian", 79.93, 23.4, 1050)).toBe("nagara-temple"); // Khajuraho's region
    expect(at("south-asian", 77.74, 23.48, -100)).toBe("early-stupa"); // Sanchi
    expect(at("south-asian", 80.4, 8.35, 300)).toBe("lanka-dagoba"); // Anuradhapura
    expect(at("south-asian", 74.87, 31.64, 1700)).toBe("gurdwara"); // Amritsar
    expect(at("south-asian", 74.35, 31.56, 1650)).toBe("indo-islamic-mosque"); // Lahore
    expect(at("south-asian", 71.8, 21.5, 1500)).toBe("jain-temple"); // Palitana
    expect(at("south-asian", 72.85, 20.5, 1800)).toBe("parsi-fire-temple"); // Udvada
    expect(at("south-asian", 85.31, 27.72, 1600)).toBe("newar-temple"); // Kathmandu
    expect(at("southeast-asian", 94.9, 21.17, 1200)).toBe("burmese-pagoda"); // Bagan
    expect(at("southeast-asian", 100.57, 14.35, 1600)).toBe("wat"); // Ayutthaya
    expect(at("southeast-asian", 103.87, 13.41, 1150)).toBe("khmer-temple"); // Angkor
    expect(at("southeast-asian", 108.12, 15.76, 900)).toBe("cham-tower"); // My Son
    expect(at("southeast-asian", 110.49, -7.75, 850)).toBe("javanese-candi"); // Prambanan
    expect(at("south-asian", 115.09, -8.46, 1600)).toBe("balinese-pura");
    // The Pacific, keyed on bounds while the atlas tags these islands American.
    expect(at("mesoamerican", -157.86, 21.31, 1700)).toBe("heiau"); // Honolulu
    expect(at("andean", -149.57, -17.53, 1700)).toBe("marae"); // Tahiti
    expect(at("australian-pacific", 174.76, -36.85, 1700)).toBe("wharenui");
    // Synagogues where the town was Jewish.
    expect(at("north-african-west-asian", 35.5, 32.9, 400)).toBe("galilean-synagogue");
    expect(at("european", 25.15, 50.08, 1800)).toBe("ashkenazi-synagogue"); // Brody
    // Korea keeps its temples east of 128°; the Levant and the Gulf are not Egypt or Iran.
    expect(at("east-asian", 129.22, 35.84, 750)).toBe("korean-temple"); // Gyeongju
    expect(at("east-asian", 129.01, 35.1, 1600)).toBe("korean-temple"); // Busan
    expect(at("east-asian", 130.4, 33.59, 1600)).toBe("japanese-temple"); // Fukuoka
    expect(at("north-african-west-asian", 35.21, 31.78, -1000)).not.toBe("pharaonic-temple"); // Jerusalem
    expect(at("north-african-west-asian", 32.65, 25.7, -1300)).toBe("pharaonic-temple");
    expect(at("north-african-west-asian", 50.58, 26.24, 900)).not.toBe("iranian-fire-temple"); // Manama
    expect(at("north-african-west-asian", 52.5, 29.6, 600)).toBe("iranian-fire-temple"); // Shiraz
    expect(religiousProfile({ culture: "other-indigenous-american", lon: -90.06, lat: 38.66, year: 1100 } as WorldSetting)?.drawnAt).toBe("large");
    expect(religiousProfile({ culture: "other-indigenous-american", lon: -87.6, lat: 33.0, year: 1300 } as WorldSetting)?.drawnAt).toBe("small");
  });

  it("takes the sanctuary from its own claim and dates its fittings", () => {
    const site = (use:string, lon:number, lat:number, year:number) => interiorProfileFor({use:"religious."+use,lon,lat,year});
    const synagogue = site("sephardi-synagogue",22.9,40.6,1600);
    expect(synagogue.observance?.service?.passage?.title).toBe("Genesis");
    expect(synagogue.observance?.gathering.passage).toBeUndefined();
    const mosque = site("maghrebi-mosque",-5,34,1400).observance!;
    const prayer = (day:number, hour:number) => worshipAct(mosque,mosque.service!.label,(day * 24 + hour) * 3600);
    expect(prayer(2,12)?.passage?.title).toBe("Qur’an");
    expect(prayer(1,12)?.passage).toBeUndefined();
    expect(prayer(2,15)?.sound).toBeUndefined();
    expect(prayer(1,18)?.sound).toBe("recitation");
    expect(passageOn(aarti,{day:0,from:79}).title).toBe("Barah Maha · Chet");
    expect(passageOn(aarti,{day:9,from:108}).title).toBe("Barah Maha · Vaisakh");
    expect(passageOn(aarti,{day:10,from:111})).toBe(aarti);
    expect(synagogue.observance?.weekday).toBe(3);
    expect(religiousProfile({culture:"european",placeId:"city-thessaloniki",year:1700,lon:22.97,lat:40.78,playableMap:{id:"tile:122,-218"}} as WorldSetting)?.id).toBe("sephardi-synagogue");
    const reading = (day:number, hour:number) => worshipHours(synagogue.observance!, day, hour, synagogue.regulars!.hours);
    expect(reading(3,7).fill).toBeGreaterThan(reading(2,7).fill);
    expect(reading(3,7).fill).toBeGreaterThan(reading(3,17).fill);
    expect(reading(3,22)).toEqual({peak:false,fill:0});
    expect(site("japanese-temple",135.77,35.0,1200).observance?.service?.sound).toBe("recitation");
    expect(site("japanese-temple",135.77,35.0,1700).observance?.service?.sound).toBe("woodbeat");
    expect(synagogue.rooms?.find(r=>r.role==="sanctum")?.furnish).toContain("lectern");
    expect(site("gurdwara",74.87,31.64,1700).rooms?.find(r=>r.role==="kitchen")?.fire).toBe("firepit");
    expect(site("pharaonic-temple",32.65,25.7,-1300).styles).toMatchObject({altar:"naos",pole:"papyrus"});
    expect(site("pharaonic-temple",32.65,25.7,-2300).styles?.pole).toBe("timber");
    expect(site("iranian-fire-temple",54.4,31.9,600).rooms?.find(r=>r.role==="sanctum")?.styles?.altar).toBe("fire-sanctuary");
    expect(site("parsi-fire-temple",72.85,20.5,1800).rooms?.find(r=>r.role==="sanctum")?.styles?.altar).toBe("fire-urn");
    expect(site("byzantine-church",20.47,44.82,900).styles?.altar).toBe("screen-templon");
    expect(site("byzantine-church",20.47,44.82,1700).styles?.altar).toBe("screen-iconostasis");
    expect(site("central-asian-mosque",75.99,39.47,1500).id).toBe("mosque");
    expect(site("gothic-parish",-.1,51.5,2020).id).toBe("modern-parish");
    const use="religious.burmese-pagoda", where={use,lon:96.2,lat:16.8,year:1100};
    const court=buildInterior({id:"pagoda",claim:use.replace(".","-"),access:"public"} as Place,where,{});
    expect(court.params.shape).toBe("terrace");
    const mound=court.props.find(q=>q.kind==="altar")!;
    expect(court.floor.has(`${ROOM_ORIGIN+mound.x},${ROOM_ORIGIN+mound.y}`)).toBe(false);
    for(const [x,y] of [[mound.x-1,mound.y],[mound.x+mound.w,mound.y],[mound.x,mound.y-1],[mound.x,mound.y+mound.d]])
      expect(court.walk.has(`${ROOM_ORIGIN+x},${ROOM_ORIGIN+y}`)).toBe(true);
  });

  it("faces every place of worship to its altar down an aisle no column stands in", () => {
    const sites = [
      { id: "romanesque-church", lon: 2, lat: 47, year: 1100, use: "religious.romanesque-parish" },
      { id: "gothic-church", lon: 2, lat: 47, year: 1350, use: "religious.gothic-parish" },
      { id: "orthodox-church", lon: 22.9, lat: 40.6, year: 1300, use: "religious.gothic-parish" },
      { id: "orthodox-church", lon: 37.6, lat: 55.8, year: 1700, use: "venue.churchyard" },
      { id: "reformed-church", lon: -1, lat: 52, year: 1700, use: "religious.gothic-parish" },
      { id: "baroque-church", lon: -3.7, lat: 40.4, year: 1700, use: "religious.gothic-parish" },
      { id: "baroque-church", lon: -99, lat: 19, year: 1700, use: "religious.spanish-american-church" },
      { id: "mosque", lon: 36.3, lat: 33.5, year: 1200, use: "venue.mosque-court" },
      { id: "mosque", lon: 29, lat: 41, year: 1600, use: "religious.ottoman-mosque" },
      { id: "mosque", lon: -5, lat: 34, year: 1400, use: "religious.maghrebi-mosque" },
      { id: "chinese-temple", lon: 116, lat: 40, year: 1500, use: "venue.temple-court-east" },
      { id: "japanese-temple", lon: 135.8, lat: 35, year: 1700, use: "venue.temple-court-east" },
      { id: "chinese-temple", lon: 129, lat: 35.2, year: 1600, use: "religious.korean-temple" },
      { id: "japanese-temple", lon: 135.8, lat: 35, year: 1700, use: "religious.japanese-temple" },
      { id: "wat", lon: 100.5, lat: 13.7, year: 1800, use: "venue.wat" },
      { id: "hindu-temple", lon: 78, lat: 11, year: 1100, use: "venue.temple-court-south" },
      { id: "classical-temple", lon: 12.5, lat: 41.9, year: 100, use: "venue.temple-precinct" },
      { id: "mesopotamian-temple", lon: 44.4, lat: 32.5, year: -2000, use: "religious.mesopotamian-temple" },
      { id: "maya-temple", lon: -89.6, lat: 17.2, year: 700, use: "religious.maya-temple-pyramid" },
      { id: "chavin-gallery", lon: -77.2, lat: -9.6, year: -600, use: "religious.andean-platform-temple" },
      { id: "moche-huaca", lon: -79, lat: -8.1, year: 500, use: "religious.andean-platform-temple" },
      { id: "inca-temple", lon: -72, lat: -13.5, year: 1500, use: "religious.andean-platform-temple" },
      { id: "council-chamber", lon: 4.4, lat: 51.2, year: 1550, use: "venue.town-hall" },
      { id: "roman-basilica", lon: 14.5, lat: 40.75, year: 70, use: "civic.republican-imperial-italy" },
      { id: "grammar-school", lon: -1.3, lat: 51, year: 1600, use: "venue.school" },
      { id: "board-school", lon: -0.1, lat: 51.5, year: 1900, use: "venue.school" },
      { id: "terakoya", lon: 139.7, lat: 35.7, year: 1800, use: "venue.terakoya" },
      { id: "calmecac", lon: -99.1, lat: 19.4, year: 1500, use: "venue.calmecac" },
      { id: "gurukula", lon: 80, lat: 25, year: 1200, use: "venue.gurukula" },
      { id: "union-hall", lon: -2.2, lat: 53.5, year: 1900, use: "venue.union-hall" },
      { id: "elizabethan-playhouse", lon: -0.1, lat: 51.5, year: 1600, use: "venue.playhouse" },
      { id: "proscenium-playhouse", lon: -0.1, lat: 51.5, year: 1780, use: "venue.playhouse" },
      { id: "broadway-theatre", lon: -73.98, lat: 40.76, year: 1925, use: "venue.grand-theatre" },
      { id: "opera-house", lon: 16.4, lat: 48.2, year: 1800, use: "venue.opera-house" },
      { id: "noh-theatre", lon: 135.8, lat: 35, year: 1700, use: "venue.noh-stage" },
      { id: "kabuki-theatre", lon: 139.7, lat: 35.7, year: 1800, use: "venue.kabuki-theatre" },
      { id: "nickelodeon", lon: -74, lat: 40.7, year: 1915, use: "venue.cinema" },
      { id: "cinema", lon: -74, lat: 40.7, year: 1930, use: "venue.cinema" },
      { id: "multiplex", lon: -81.38, lat: 28.54, year: 1987, use: "venue.cinema" },
    ];
    for (const { id, ...site } of sites)
      for (const fortune of [0.1, 0.9])
        for (let n = 0; n < 6; n++) {
          const where = `${id} ${site.year} ${fortune} #${n}`;
          expect(interiorProfileFor(site).id, where).toBe(id);
          const room = buildInterior({ id: `t-${id}-${n}`, access: "public", claim: site.use.replace(".", "-") } as Place, site, { fortune });
          const altar = room.props.find((q) => q.kind === "altar");
          expect(altar, where).toBeDefined();
          const mid = altar!.x + Math.floor(altar!.w / 2);
          for (const q of room.props.filter((q) => (q.kind === "pole" || q.kind === "pew") && q.room === altar!.room))
            expect(q.x <= mid && mid < q.x + q.w && q.y > altar!.y, `${where} ${q.kind} in the aisle`).toBe(false);
        }
  });

  it("opens a shopfront house as its keeper's shop, the keeper behind the counter", () => {
    const shops = [
      { name: "Baker's shop", site: { lon: 4.9, lat: 52.4, year: 1650 }, stock: "bread", counter: "counter" },
      { name: "Blacksmith's workshop", site: { lon: -0.1, lat: 51.5, year: 1400 }, stock: "tools", counter: "counter" },
      { name: "Trader's shop", site: { lon: 12.5, lat: 41.9, year: 100 }, stock: "general", counter: "taberna" },
      { name: "Tea Broker's shop", site: { lon: 135.8, lat: 35, year: 1750 }, stock: "tea", counter: "platform" },
      { name: "Silk Mercer's shop", site: { lon: 29, lat: 41, year: 1650 }, stock: "cloth", counter: "platform" },
      { name: "Grocer's shop", site: { lon: -0.1, lat: 51.5, year: 1900 }, stock: "grocery", counter: "glazed" },
    ];
    for (const { name, site, stock, counter } of shops)
      for (const fortune of [0.1, 0.9])
        for (let n = 0; n < 5; n++) {
          const where = `${name} ${site.year} ${fortune} #${n}`;
          const room = buildInterior({ id: `t-shop-${n}`, name, access: "public", claim: "landscape" } as Place, { ...site, settlement: "city" }, { fortune });
          expect(roomAt(room, room.entry.x, room.entry.y), where).toBe(room.rooms[0]);
          expect(room.plan.rooms[0].styles, where).toMatchObject({ stock, shopcounter: counter });
          expect(room.work[0], where).toMatchObject({ kind: "shopcounter", facing: 2 });
          expect(room.beds.length, where).toBeGreaterThan(0);
        }
  });

  it("opens a house kept for eating or drinking as a serving room, seats and patrons", () => {
    for (const [name, site, bar] of [
      ["Cafe", { lon: -95, lat: 30, year: 2026 }, "cafe"],
      ["Publican's workshop", { lon: -0.1, lat: 51.5, year: 1950 }, "beer"],
      ["Diner", { lon: -95, lat: 30, year: 1955 }, "diner"],
      ["Publican's workshop", { lon: -0.1, lat: 51.5, year: 1780 }, "ale"],
      ["Cafe", { lon: 135.8, lat: 35, year: 1750 }, "tea"],
    ] as const) {
      const room = buildInterior({ id: "t-serve", name, access: "public", claim: "landscape" } as Place, { ...site, settlement: "city" }, { fortune: 0.5 });
      expect(room.plan.rooms[0], `${name} ${site.year}`).toMatchObject({ program: "serve", styles: { bar } });
      expect(room.props.some((q) => q.kind === "bar" && (q.room ?? 0) === 0), `${name} ${site.year}`).toBe(true);
      expect(room.seats.length, `${name} ${site.year}`).toBeGreaterThan(3);
      expect(room.regulars?.fill, `${name} ${site.year}`).toBeGreaterThan(0);
    }
  });

  it.runIf(!!process.env.FULL).each([
    ["A weaver in Kyoto, 1350", "loom"],
    ["A potter in Baghdad, 1000", "throw"],
    ["A luthier in London, 1895", "fixture"],
    ["A music shop owner in London, 1895", "shopcounter"],
  ])("gives the resident apprentice a shift at the master's workplace in %s", (prompt, tool) => {
    const seed = "neon-review", start = resolveSetting(prompt, seed);
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting, seed), s = e.state, master = s.player;
    const h = s.households!.find(h => h.members.includes(master.id))!;
    const learner = s.actors.find(a => a.relations?.some(r => r.other === master.id && r.reciprocal === "apprentice"))!;
    expect(learner.origin?.livelihood).toBe(master.origin?.livelihood);
    const plan = (e.world as SettlementWorld).planAt(h.home.x, h.home.y)!;
    const route = plan.stations.get(learner.id)!;
    expect(route.some(stop => stop.placeId === h.residence)).toBe(true);
    expect(route.at(-1)?.label).toBe("At home");
    const room = e.interiorOf(h.residence!)!, activity = livelihoodOf(e.world.pack, master)!.activity;
    s.clock = 12 * 3600;
    master.activity = learner.activity = activity;
    master.pos = e.indoorSpot(master, h.residence!, activity);
    learner.pos = e.indoorSpot(learner, h.residence!, activity);
    if (tool === "shopcounter") {
      expect(e.shopKeeper(h.residence!)).toBe(master.id);
      expect(e.indoorUse(learner.id, learner.pos)?.kind).not.toBe(tool);
      master.pos = { ...h.home, space: "outside" };
      learner.pos = e.indoorSpot(learner, h.residence!, activity);
      expect(e.shopKeeper(h.residence!)).toBe(learner.id);
      expect(e.indoorUse(learner.id, learner.pos)?.kind).toBe(tool);
    } else {
      const use = e.indoorUse(master.id, master.pos);
      expect(use?.kind).toBe(tool);
      expect(e.indoorUse(learner.id, learner.pos)?.propId).toBe(use?.propId);
      expect(learner.pos).not.toEqual(master.pos);
      expect(room.walk.has(learner.pos.x + "," + learner.pos.y)).toBe(true);
    }
  });

  it("places a child's toy by the household's own bedding", () => {
    for (const [id, year] of [["japanese-minka", 1350], ["european-townhouse", 1895]] as const) {
      const base = interiorProfiles.find(p => p.id === id)!;
      const profile = { ...base, clutter: [], rooms: base.rooms?.map(r => ({...r, clutter: []})) };
      const options = { seed: 7, status: 1 as const, colorway: 0, w: 12, d: 9, hour: 12, site: {lon: 0, lat: 0, year} };
      const home = planBuilding(profile, {...options, childResident: true});
      const toy = home.props.find(q => q.item === "toy")!;
      const bed = home.props.find(q => q.room === toy.room && q.kind === home.plan.rooms[toy.room!].sleep)!;
      expect(Math.hypot(Math.max(bed.x-toy.x, toy.x-bed.x-bed.w+1, 0), Math.max(bed.y-toy.y, toy.y-bed.y-bed.d+1, 0))).toBeLessThanOrEqual(4);
      expect(planBuilding(profile, options).props.some(q => q.item === "toy")).toBe(false);
    }
  });

  it.runIf(!!process.env.FULL).each([
    ["A music shop owner in London, 1895", "music"],
    ["A grocer in Thanh Hóa, 1969", "grocery"],
    ["A speakeasy proprietor in Boston, 1925", "speakeasy"],
  ])("opens the workplace and fills its shifts in %s", async (prompt, kind) => {
    const seed = "neon-review", start = resolveSetting(prompt, seed);
    if ("error" in start) throw Error(start.error);
    const { prepareConnectedStart } = await import("../src/runtime/map-travel");
    const e = await prepareConnectedStart(start.setting, seed), s = e.state;
    const place = e.world.places.find(p => p.owner === "player" && s.households?.some(h => h.residence === p.id))!;
    const room = e.interiorOf(place.id)!, door = e.doorOf(place.id)!;
    s.player.pos = { ...doorApproach(place), space: "outside" };
    const interact = (action: "open" | "enter", target: string) =>
      e.act({ actionId: action, expectedRevision: s.revision, command: { type: "interact", action, target } });
    if (!door.open) expect(interact("open", door.id).status).toBe("completed");
    expect(interact("enter", place.id).status).toBe("completed");
    if (kind !== "speakeasy") {
      expect(place).toMatchObject({ access: "public", shopKind: kind });
      expect(room.shopKind).toBe(kind);
      const counter = room.work.find(w => w.kind === "shopcounter")!;
      expect(counter).toBeDefined();
      if (kind === "music") {
        expect(s.player.origin?.livelihood).toBe("music-shop-owner");
        expect(room.furniture.some(f => f.def === "room-piano")).toBe(true);
        const plan = (e.world as SettlementWorld).planAt(place.x, place.y)!;
        const route = routineFor(plan, seed, e.world.pack, "player", plan.work.get("player")!, s.player);
        expect(route.some(stop => stop.placeId === place.id && stop.label === "Minding the shop counter")).toBe(true);
      }
      s.player.pos = { ...doorApproach(place), space: "outside" };
      const family = s.households!.find(h => h.residence === place.id && h.members.includes("player"))!;
      const relief = s.actors.find(a => family.members.includes(a.id) && (a.age ?? 30) >= 14)!;
      s.clock = Math.floor(s.clock / 86400) * 86400 + 8 * 3600;
      relief.pos = { x: counter.x, y: counter.y, space: place.id };
      relief.activity = "At the counter";
      expect(e.shopKeeper(place.id)).toBe(relief.id);
      expect(e.shopOf(relief.id)?.stock[kind === "music" ? "lute" : "grain"]).toBeGreaterThan(0);
      return;
    }
    expect(room.backroom?.id).toBe("speakeasy");
    for (const [hour, pianists] of [[12, 0], [18, 1], [1, 1], [2, 0]]) {
      s.clock = (Math.floor(s.clock / 86400) + (hour === 1 ? 1 : 0)) * 86400 + hour * 3600;
      e.advance(2);
      const staff = s.actors.filter(a => a.staff === place.id);
      expect(staff.filter(a => a.role === "Speakeasy Proprietor")).toHaveLength(0);
      expect(staff.filter(a => a.role === "Jazz Pianist")).toHaveLength(pianists);
    }
  });

  it("gets everyone up by day, one keeper behind a shop's counter selling its stock and the household in the rooms behind", () => {
    const start = resolveSetting("A grocer in Thanh Hóa, 1969", "shops");
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting, "shops");
    // Minute steps, as play advances: routines are built a few per step.
    for (let left = ((10 - (e.state.clock / 3600) % 24) + 24) % 24 * 3600; left > 0; left -= 60) e.advance(Math.min(60, left));
    const abed = e.state.actors.filter((a) => a.pos.space !== "outside" && e.indoorUse(a.id, a.pos)?.role === "bed" && !/sleep|resting/i.test(a.activity));
    expect(abed.map((a) => a.activity)).toEqual([]);
    const shops = e.world.places.filter((p) => e.interiorOf(p.id)?.params.program === "shop" && e.state.households?.some((h) => h.residence === p.id));
    let kept = 0;
    for (const p of shops) {
      const room = e.interiorOf(p.id)!, inside = e.state.actors.filter((a) => a.pos.space === p.id);
      const counter = inside.filter((a) => e.indoorUse(a.id, a.pos)?.kind === "shopcounter");
      expect(counter.length, p.name).toBeLessThanOrEqual(1);
      for (const a of inside) if (a !== counter[0] && e.state.households?.some((h) => h.id === a.householdId && h.residence === p.id)) expect(roomAt(room, a.pos.x, a.pos.y), `${p.name}: ${a.name}`).not.toBe(room.rooms[0]);
      if (!counter[0]) continue;
      kept++;
      expect(e.shopKeeper(p.id)).toBe(counter[0].id);
      if (shopKinds.find((k) => k.id === room.params.styles.stock)?.goods)
        expect(Object.keys(e.shopOf(counter[0].id)?.stock ?? {}).length, p.name).toBeGreaterThan(0);
    }
    expect(kept).toBeGreaterThan(shops.length / 2);
  });

  it("fills a works with rows of its machines, named or drawn by date", () => {
    const works = [["Sawtooth weaving shed", 1900, "loom"], ["Works", 1760, "moulds"], ["Iron foundry", 1880, "moulds"], ["Works", 1900, undefined]] as const;
    for (const [name, year, machine] of works)
      for (let n = 0; n < 6; n++) {
        const where = `${name} ${year} #${n}`;
        const room = buildInterior({ id: `t-works-${n}`, name, access: "public", claim: "landscape", landUse: "industrial" } as Place, { lon: -2.2, lat: 53.5, year, settlement: "city" }, { activity: "Weaving cloth" });
        expect(room.params.program, where).toBe("works");
        if (machine) expect(room.params.styles.machine, where).toBe(machine);
        expect(room.props.filter((q) => q.kind === "machine").length, where).toBeGreaterThanOrEqual(6);
        expect(room.seats.some((s) => s.kind === "machine"), where).toBe(true);
      }
  });

  it.runIf(!!process.env.FULL)("opens a downtown block as offices by date, a banking hall or a department store", () => {
    const blocks = [["Offices", 1880, "desk-high"], ["Offices", 1930, "typewriter"], ["Offices", 1995, "terminal"], ["Department store", 1910, "showcase"]] as const;
    for (const [name, year, machine] of blocks) {
      const room = buildInterior({ id: `t-office-${year}`, name, access: "public", claim: "landscape", landUse: "downtown" } as Place, { lon: -87.6, lat: 41.9, year, settlement: "city" }, {});
      expect(room.params.styles.machine, name).toBe(machine);
      expect(room.seats.some((s) => s.kind === "machine"), name).toBe(true);
    }
    const bank = buildInterior({ id: "t-bank", name: "Bank", access: "public", claim: "landscape", landUse: "downtown" } as Place, { lon: -87.6, lat: 41.9, year: 1900, settlement: "city" }, {});
    expect(bank.params.program).toBe("shop");
    expect(bank.props.some((q) => q.kind === "altar") && bank.props.some((q) => q.kind === "shopcounter")).toBe(true);
    const e = createSettingSession({ ...panelSetting("city-chicago", 1910), settlement: "city", season: "summer" }, "down");
    const offices = e.world.places.filter((p) => p.landUse === "downtown" && /^(Offices|Bank|Department store)$/.test(p.name));
    expect(offices.length).toBeGreaterThan(10);
    for (const p of offices) expect(e.state.households!.some((h) => h.residence === p.id), p.name).toBe(false);
  });

  it.runIf(!!process.env.FULL)("keeps a grown member of the household behind the bar and sits drinkers down late", () => {
    const e = createSettingSession({ ...panelSetting("london", 1700), season: "summer" }, "tavern");
    const ale = e.world.places.find((p) => p.claim === "venue-venue.alehouse")!;
    const room = e.interiorOf(ale.id)!;
    const home = e.state.households!.find((h) => h.residence === ale.id)!;
    const member = e.state.actors.find((a) => a.householdId === home.id)!;
    const visitor = e.state.actors.find((a) => a.kind === "human" && a.householdId !== home.id)!;
    const onWork = (p: { x: number; y: number }) => room.work.some((s) => s.x === p.x && s.y === p.y);
    const hour = (h: number) => (e.state.clock += ((h - (e.state.clock / 3600) % 24 + 24) % 24) * 3600);
    hour(20);
    member.age = 40;
    expect(e.indoorSpot(member, ale.id, "At home")).toMatchObject({ x: room.work[0].x, y: room.work[0].y });
    member.age = 8;
    expect(onWork(e.indoorSpot(member, ale.id, "At home"))).toBe(false);
    hour(23);
    const drinker = e.indoorSpot(visitor, ale.id, "At the alehouse");
    expect(room.seats.some((s) => s.x === drinker.x && s.y === drinker.y)).toBe(true);
  });

  it.runIf(!!process.env.FULL)("serves the period menu from behind the bar, paid in whole coins into the purse", () => {
    const e = createSettingSession({ ...panelSetting("london", 1700), season: "summer" }, "tavern");
    const ale = e.world.places.find((p) => p.claim === "venue-venue.alehouse")!;
    const home = e.state.households!.find((h) => h.residence === ale.id)!;
    const keeper = e.state.actors.find((a) => a.householdId === home.id && (a.age ?? 30) >= 16)!;
    e.state.clock += ((20 - (e.state.clock / 3600) % 24 + 24) % 24) * 3600;
    keeper.activity = "At home";
    keeper.pos = e.indoorSpot(keeper, ale.id, "At home");
    const p = e.state.player;
    p.pos = { ...keeper.pos, y: keeper.pos.y + 2 };
    p.hunger = 60;
    p.inventory.coin = 1;
    const served = e.menuOf(keeper.id)!;
    expect(served.menu.id).toBe("english-alehouse");
    expect(served.menu.dishes.map((d) => d.name)).not.toContain("Pint of porter");
    expect(e.act({ actionId: "order", expectedRevision: e.state.revision, command: { type: "order", target: keeper.id, dishes: ["The ordinary", "Quart of ale"] } }).status).toBe("completed");
    expect(p.inventory.coin).toBe(0);
    expect(p.hunger).toBeLessThan(20);
    expect(e.act({ actionId: "order", expectedRevision: e.state.revision, command: { type: "order", target: keeper.id, dishes: ["Small beer"] } }).status).toBe("rejected");
  });

  it.runIf(!!process.env.FULL)("fills the taproom with neighbours off the routine budget while the player is in it", () => {
    const e = createSettingSession({ ...panelSetting("london", 1700), season: "summer" }, "tavern");
    const ale = e.world.places.find((p) => p.claim === "venue-venue.alehouse")!;
    const room = e.interiorOf(ale.id)!;
    const home = e.state.households!.find((h) => h.residence === ale.id)!;
    e.state.clock += ((19 - (e.state.clock / 3600) % 24 + 24) % 24) * 3600;
    e.state.player.pos = { ...room.entry, space: ale.id };
    e.advance(60);
    const regulars = e.state.actors.filter((a) => a.pos.space === ale.id && a.householdId !== home.id && e.world.dormant?.(a.id));
    const neighbours = e.state.actors.filter(a => a.kind === "human" && (a.age ?? 30) >= 16 &&
      a.householdId !== home.id && e.world.dormant?.(a.id) && Math.hypot(a.home.x-ale.entrance.x,a.home.y-ale.entrance.y)<=60);
    expect(regulars.length).toBeGreaterThanOrEqual(Math.min(8,neighbours.length));
    expect(regulars.every((a) => room.seats.some((s) => s.x === a.pos.x && s.y === a.pos.y))).toBe(true);
    e.state.player.pos = { ...ale.entrance, space: "outside" };
    e.advance(60);
    expect(regulars.filter((a) => a.pos.space === ale.id)).toEqual([]);
  });

  it.runIf(!!process.env.FULL)("stands furniture in the house as things that block, shift and break", () => {
    const e = createSettingSession({ ...panelSetting("kyoto", 1700), season: "summer" }, "furniture");
    const home = e.state.households!.find((h) => h.members.includes("player"))!.residence!;
    const room = e.interiorOf(home)!;
    const pieces = room.furniture
      .map((f) => ({ f, o: e.state.objects.find((o) => o.id === `${home}-room-${f.propId}`)! }))
      .filter(({ o }) => propDefs[o.prop ?? ""]?.solid);
    expect(pieces.length).toBeGreaterThan(0);
    for (const { f, o } of pieces)
      for (let dx = 0; dx < f.size[0]; dx++) expect(e.blocked(o.pos.x + dx, o.pos.y, home), o.name).toBe(true);
    const { f: brokeF, o: broke } = pieces.find(({ f }) => room.floor.has(`${f.pos.x},${f.pos.y}`))!;
    broke.broken = true;
    expect(e.blocked(broke.pos.x, broke.pos.y, home)).toBe(false);
    // Nobody is sent to sit at, or work at, what is no longer there.
    const spots = [...room.seats, ...room.work, ...room.fire, ...room.beds].filter((s) => s.propId === brokeF.propId);
    const a = e.state.actors.find((x) => x.kind === "human")!;
    for (let n = 0; n < 6; n++) {
      const at = e.indoorSpot(a, home, "Resting", n);
      expect(spots.some((s) => s.x === at.x && s.y === at.y)).toBe(false);
      expect(e.blocked(at.x, at.y, home)).toBe(false);
    }
  });

  it("routes street-look cinemas to their era's multi-room cinema interior rather than a house shop", () => {
    for (const [year, id, screens] of [[1918, "nickelodeon", 1], [1938, "cinema", 1], [1987, "multiplex", 3]] as const) {
      const site = { lon: -81.38, lat: 28.54, year, settlement: "city", frame: "mod-theatre-0" };
      expect(interiorProfileFor(site).id).toBe(id);
      const room = buildInterior({ id: `cinema-${year}`, name: "Cinema", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, site, { activity: "Keeping a shop" });
      expect(room.rooms[0].role).toBe("entry");
      expect(room.plan.rooms[0].styles.stock).toBe(year >= 1966 ? "concessions" : "concessions-classic");
      expect(room.props.filter((q) => q.kind === "shopcounter").length).toBe(1);
      expect(room.props.filter((q) => q.kind === "altar").length).toBe(screens);
      expect(room.beds.length).toBe(0);
    }
  });

  it("gives every theatre, opera house and cinema valid specialist staff and spawns them indoors", () => {
    for (const profile of theatres) {
      expect(profile.rooms?.length, profile.id).toBeGreaterThanOrEqual(2);
      expect(profile.staff?.length, profile.id).toBeGreaterThan(0);
      for (const st of profile.staff ?? []) expect(livelihoodById(st.work), `${profile.id}:${st.work}`).toBeDefined();
    }
    const start = resolveSetting("A clerk in Orlando, 1987", "cinema-staff");
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting, "cinema-staff");
    const cinema = e.world.places.find((p) => e.interiorOf(p.id)?.staff?.length);
    if (cinema) {
      e.state.clock = Math.floor(e.state.clock / 86400) * 86400 + 20 * 3600;
      const layout = e.interiorOf(cinema.id)!;
      e.state.player.pos = { ...layout.entry, space: cinema.id };
      e.advance(10);
      const staff = e.state.actors.filter((a) => a.staff === cinema.id && a.pos.space === cinema.id);
      expect(staff.length).toBeGreaterThanOrEqual(5);
      expect(staff.some((a) => /concession|ticket|usher|manager|projectionist|critic/i.test(a.role ?? ""))).toBe(true);
      // Player can walk beside an open theatre chair, sit down facing the stage/screen, and stand back up.
      const openSeat = layout.seats.find((s) => s.kind === "pew" && !e.state.actors.some((a) => a.pos.space === cinema.id && a.pos.x === s.x && a.pos.y === s.y));
      expect(openSeat).toBeDefined();
      const beside = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ x: openSeat!.x + dx, y: openSeat!.y + dy })).find((q) => layout.walk.has(`${q.x},${q.y}`));
      expect(beside).toBeDefined();
      e.state.player.pos = { ...beside!, space: cinema.id };
      const u = e.usable();
      expect(u?.id.startsWith("room-seat:")).toBe(true);
      const res = e.act({ actionId: "sit-theatre", expectedRevision: e.state.revision, command: { type: "interact", action: "use-prop", target: u!.id } });
      expect(res.status, res.reason).toBe("completed");
      expect(e.state.player.seated?.pose).toBe("sit-seat");
      expect(e.state.player.direction).toBe(0);
      expect(e.indoorUse("player", e.state.player.pos)?.role).toBe("seat");
      e.act({ actionId: "stand-theatre", expectedRevision: e.state.revision, command: { type: "move", dx: 0, dy: 1 } });
      expect(e.state.player.seated).toBeUndefined();
    }
  });

  it("assigns plays to live theatres, distinct multi-scene films across eras/regions, and drives onstage actor dialogue", () => {
    const liveIds = ["elizabethan-playhouse", "proscenium-playhouse", "broadway-theatre", "opera-house", "noh-theatre", "kabuki-theatre"];
    for (const id of liveIds) {
      const profile = theatres.find((t) => t.id === id)!;
      const layout = buildInterior({ id: `live-${id}`, name: id, access: "public", claim: "" } as Place, { lon: 12, lat: 45, year: (profile.when.start?.year ?? 1850) + 10, settlement: "city" }, { profile });
      expect(layout.play, id).toBeDefined();
      expect(layout.play!.beats.length, id).toBeGreaterThanOrEqual(4);
    }
    // Multiplex gets 3 distinct multi-scene modern films; 1920 Tokyo nickelodeon gets a Benshi silent film; 1955 Mumbai gets a musical.
    const multi = buildInterior({ id: "cine-multi", name: "Multiplex", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: -81.38, lat: 28.54, year: 1987, settlement: "city", frame: "mod-theatre-0" }, {});
    const multiFilms = Object.values(multi.films ?? {});
    expect(multiFilms.length).toBe(3);
    expect(new Set(multiFilms.map((f) => f.id)).size).toBe(3);
    for (const f of multiFilms) expect(f.scenes.length).toBeGreaterThanOrEqual(3);

    const tokyoSilent = buildInterior({ id: "cine-tokyo", name: "Picture Hall", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: 139.7, lat: 35.7, year: 1920, settlement: "city", frame: "mod-theatre-0" }, {});
    expect(Object.values(tokyoSilent.films ?? {})[0]?.benshi).toBe(true);

    const mumbaiClassic = buildInterior({ id: "cine-mumbai", name: "Palace Cinema", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: 72.8, lat: 19.1, year: 1955, settlement: "city", frame: "mod-theatre-0" }, {});
    expect(Object.values(mumbaiClassic.films ?? {})[0]?.id).toBe("classic-monsoon");

    // Regional & historical specificity for documented plays, operas, and films:
    const viennaOpera = buildInterior({ id: "op-vienna", name: "Opera", access: "public", claim: "venue-venue.opera-house" } as Place, { lon: 16.37, lat: 48.2, year: 1788, settlement: "city", use: "venue.opera-house" }, {});
    expect(viennaOpera.play?.id).toBe("opera-don-giovanni");
    const veniceOpera = buildInterior({ id: "op-venice", name: "Opera", access: "public", claim: "venue-venue.opera-house" } as Place, { lon: 12.33, lat: 45.44, year: 1854, settlement: "city", use: "venue.opera-house" }, {});
    expect(veniceOpera.play?.id).toBe("opera-traviata");
    const berlin1927 = buildInterior({ id: "cine-berlin", name: "Kino", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: 13.4, lat: 52.52, year: 1927, settlement: "city", frame: "mod-theatre-0" }, {});
    expect(["silent-metropolis", "silent-nosferatu"]).toContain(Object.values(berlin1927.films ?? {})[0]?.id);
    const kolkata1956 = buildInterior({ id: "cine-kol", name: "Cinema", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: 88.36, lat: 22.57, year: 1956, settlement: "city", frame: "mod-theatre-0" }, {});
    expect(["classic-pather-panchali", "classic-monsoon"]).toContain(Object.values(kolkata1956.films ?? {})[0]?.id);
    const tehran1988 = buildInterior({ id: "cine-teh", name: "Cinema", access: "public", claim: "landscape", sprite: "mod-theatre-0" } as Place, { lon: 51.39, lat: 35.69, year: 1988, settlement: "city", frame: "mod-theatre-0" }, {});
    expect(Object.values(tehran1988.films ?? {})[0]?.id).toBe("modern-kiarostami");

    // Live opera house performance: onstage singers deliver scripted dialogue beats and block across stage positions.
    const start = resolveSetting("A musician in Vienna, 1890", "opera-dialogue");
    if ("error" in start) throw Error(start.error);
    const e = createSettingSession(start.setting, "opera-dialogue");
    const operaPlace = e.world.places.find((p) => e.interiorOf(p.id)?.play?.venues.includes("opera-house"))
      ?? e.world.places.find((p) => e.interiorOf(p.id)?.play);
    const target = operaPlace ?? e.world.places[0];
    if (!operaPlace) {
      // Force an opera house interior on a public building if this seed rolled another venue.
      target.claim = "venue-venue.opera-house";
      target.access = "public";
    }
    const layout = e.interiorOf(target.id)!;
    expect(layout.play).toBeDefined();
    expect(layout.stage).toBeDefined();
    e.state.clock = Math.floor(e.state.clock / 86400) * 86400 + 20 * 3600;
    e.state.player.pos = { ...layout.entry, space: target.id };
    e.signals.length = 0;
    e.advance(90);
    e.advance(90);
    const says = e.signals.filter((sig) => sig.kind === "say") as { kind: "say"; who: string; text: string }[];
    expect(says.length).toBeGreaterThanOrEqual(2);
    expect(new Set(says.map((sig) => sig.text)).size).toBeGreaterThanOrEqual(2);
    // Speaking cast members stand up on the raised wooden stage deck, not on the auditorium floor in front of it.
    const speaker = e.state.actors.find((a) => a.id === says[says.length - 1].who)!;
    expect(speaker.pos.y).toBe(layout.stage!.y);
    expect(speaker.pos.x).toBeGreaterThanOrEqual(layout.stage!.x0);
    expect(speaker.pos.x).toBeLessThanOrEqual(layout.stage!.x1);
  });

  it("resolves natural movie, opera, theatre, world-cinema and venue-role prompts into live seated or onstage starts", () => {
    const cases: [string, { venue: string; mode: string; role?: RegExp; minYear?: number }][] = [
      ["watching a movie", { venue: "multiplex|cinema|nickelodeon", mode: "seat", role: /moviegoer/i, minYear: 1910 }],
      ["watching a movie in 1920s Tokyo", { venue: "nickelodeon|cinema", mode: "seat", minYear: 1920 }],
      ["watching a movie in 1922 Tokyo", { venue: "nickelodeon", mode: "seat", minYear: 1922 }],
      ["watching a movie in Rome", { venue: "multiplex|cinema|nickelodeon", mode: "seat", minYear: 1910 }],
      ["watching a sci-fi movie", { venue: "multiplex", mode: "seat:film:modern-scifi" }],
      ["film noir", { venue: "cinema", mode: "seat:film:classic-noir" }],
      ["at a Bollywood musical", { venue: "cinema", mode: "seat:film:classic-monsoon" }],
      ["French New Wave film", { venue: "cinema", mode: "seat:film:classic-newwave" }],
      ["at an opera", { venue: "opera-house", mode: "seat", role: /operagoer/i }],
      ["a doctor at the opera in Milan 1870", { venue: "opera-house", mode: "seat", minYear: 1870 }],
      ["at a Broadway musical", { venue: "broadway-theatre", mode: "seat:play:broadway-lights" }],
      ["a theatergoer", { venue: "broadway-theatre|proscenium-playhouse|elizabethan-playhouse", mode: "seat", role: /theatergoer/i }],
      ["at the Globe Theatre", { venue: "elizabethan-playhouse", mode: "seat", role: /groundling/i }],
      ["watching kabuki", { venue: "kabuki-theatre", mode: "seat" }],
      ["watching noh", { venue: "noh-theatre", mode: "seat" }],
      ["a film critic", { venue: "multiplex|cinema|nickelodeon", mode: "seat", role: /critic/i }],
      ["an opera singer", { venue: "opera-house", mode: "stage", role: /opera singer/i }],
      ["a projectionist", { venue: "multiplex|cinema|nickelodeon", mode: "foyer", role: /projectionist/i }],
      ["a benshi", { venue: "nickelodeon", mode: "stage:film:silent-asakusa", role: /benshi/i }],
    ];
    for (const [prompt, want] of cases) {
      const r = resolveSetting(prompt, "theatre-prompts");
      expect("setting" in r, `${prompt}: ${"error" in r ? r.error : ""}`).toBe(true);
      if (!("setting" in r)) continue;
      expect(r.setting.startIn, prompt).toBe("theatre");
      expect(r.setting.venue, prompt).toMatch(new RegExp(`^(${want.venue})$`));
      expect(r.setting.venueRoom, prompt).toBe(want.mode);
      if (want.role) expect(r.setting.role, prompt).toMatch(want.role);
      if (want.minYear) expect(r.setting.year, prompt).toBeGreaterThanOrEqual(want.minYear);
    }

    // End-to-end session boot: "watching a sci-fi movie" spawns seated in a multiplex watching Starship Hyperion.
    const sciFi = resolveSetting("watching a sci-fi movie", "boot-scifi");
    if ("error" in sciFi) throw Error(sciFi.error);
    const eMovie = createSettingSession(sciFi.setting, "boot-scifi");
    expect(eMovie.state.player.pos.space).not.toBe("outside");
    expect(eMovie.state.player.seated?.pose).toBe("sit-seat");
    expect(eMovie.state.player.direction).toBe(0);
    expect(eMovie.state.player.activity).toContain("Starship Hyperion");
    expect(eMovie.state.actors.filter((a) => a.staff === eMovie.state.player.pos.space).length).toBeGreaterThanOrEqual(5);

    // End-to-end session boot: "at an opera" spawns seated in the Grand Opera House with onstage singers speaking on Frame 1.
    const opera = resolveSetting("at an opera", "boot-opera");
    if ("error" in opera) throw Error(opera.error);
    const eOpera = createSettingSession(opera.setting, "boot-opera");
    expect(eOpera.state.player.pos.space).not.toBe("outside");
    expect(eOpera.state.player.seated?.pose).toBe("sit-seat");
    expect(eOpera.state.player.direction).toBe(0);
    expect(eOpera.signals.some((sig) => sig.kind === "say")).toBe(true);

    // Every Settings → Developer → "Go to the theater" preset resolves cleanly to its real city, venue, and show.
    for (const preset of THEATER_VIEWER_PRESETS) {
      const s = theaterViewerSetting(preset.id, { mode: "seat" }, "viewer-check");
      expect(s.startIn, preset.id).toBe("theatre");
      expect(s.venue, preset.id).toBe(preset.venue);
      expect(s.year, preset.id).toBe(preset.year);
      expect(s.placeId, preset.id).toBe(preset.placeId);
    }
  });

  it("draws every sprite with letters that have a colour", () => {
    for (const [name, rows] of Object.entries(SPRITES))
      for (const ch of rows.join("")) if (ch !== "." && ch !== "#") expect(LETTERS[ch], `${name} uses "${ch}"`).toBeDefined();
    for (const [name, art] of Object.entries(ALTARS))
      for (const ch of art.rows.join("")) if (!".*%".includes(ch)) expect(art.ink[ch], `altar ${name} uses "${ch}"`).toBeDefined();
    for (const [fitName, fit] of Object.entries(FITS))
      for (const [name, rows] of Object.entries(fit.grids))
        for (const ch of rows.join("")) if (ch !== "." && ch !== "#") expect(fit.ink[ch] !== undefined || LETTERS[ch] !== undefined, `fit ${fitName}/${name} uses "${ch}"`).toBe(true);
  });

  it("keeps doorways two wide and clear of furniture, in front and through", () => {
    const flat = ["rug", "cat", "clutter", "mat", "cushions", "ladder"];
    for (const profile of interiorProfiles)
      for (const status of [0, 1, 2] as const)
        for (let seed = 1; seed <= 5; seed++) {
          const { plan, props, doorways } = planBuilding(profile, { seed, status, colorway: 0, w: profile.size[0], d: profile.size[1], hour: 12, trade: profile.trades[seed % profile.trades.length] });
          const where = `${profile.id} ${status} #${seed}`;
          const solid = new Set<string>();
          for (const q of props)
            if (!q.wall && !flat.includes(q.kind))
              for (let y = q.y; y < q.y + Math.max(1, q.d); y++) for (let x = q.x; x < q.x + q.w; x++) solid.add(`${x},${y}`);
          const floor = (x: number, y: number) => x >= 0 && y >= 0 && x < plan.w && y < plan.d && plan.mask[y * plan.w + x] > 0;
          for (const dw of doorways) {
            const xs = new Set(dw.cells.map(([x]) => x)), ys = new Set(dw.cells.map(([, y]) => y));
            // A neck between neighbours is two rows wide however long it runs.
            expect(dw.side || xs.size === 1 ? ys.size : xs.size, `${where} doorway width`).toBe(2);
            const own = new Set(dw.cells.map(([x, y]) => `${x},${y}`));
            // The cell each side of the doorway, and the one beyond it into the room.
            for (const [x, y] of dw.cells)
              for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
                for (const k of [1, 2]) {
                  const cx = x + dx * k, cy = y + dy * k;
                  if (!floor(cx, cy) || own.has(`${cx},${cy}`) || !own.has(`${x + dx * (k - 1)},${y + dy * (k - 1)}`) && k === 2) continue;
                  expect(solid.has(`${cx},${cy}`), `${where} furniture at ${cx},${cy} in a doorway`).toBe(false);
                }
          }
          const [ex, ey] = plan.entrance;
          if (ex >= 0) for (const dy of [0, 1, 2]) if (floor(ex, ey - dy)) expect(solid.has(`${ex},${ey - dy}`), `${where} furniture in the way in`).toBe(false);
        }
  });
});

it("opens the civic buildings on the square into a working compound or covered shops", () => {
  for (const [use, lon, lat] of [["civic.bazaar",36,33],["civic.chinese-yamen",116,40],["civic.japanese-machi-bugyo",140,36],
    ["civic.korean-dongheon",127,37],["civic.mughal-kotwali",77,29]] as const) {
    const site = {use,lon,lat,year:1750,settlement:"city"};
    for (const seed of ["west","east"]) {
      const layout = buildInterior({id:"hall",claim:use.replace(".","-"),access:"public"} as Place, site, {seed});
      expect(layout.rooms).toHaveLength(4);
      for (const room of layout.rooms)
        expect([...layout.walk].some(k => { const [x,y] = k.split(",").map(Number); return roomAt(layout,x,y) === room; }),room.label).toBe(true);
      if (use === "civic.bazaar") {
        expect(layout.plan.rooms.filter(r=>r.program === "shop").map(r=>r.styles.stock)).toEqual(["cloth","pots"]);
        expect(new Set(layout.work.filter(s=>s.kind === "shopcounter").map(s=>s.propId)).size).toBe(2);
      } else {
        expect(layout.plan.rooms[0].shape).toBe("courtyard");
        expect(layout.work.some(s=>s.kind === "desk" && roomAt(layout,s.x,s.y)?.role === "work")).toBe(true);
      }
    }
  }
});

it("lays out hospital wards with repeated beds, a clear aisle and regional bedding", () => {
  const cases = [
    { lon:-.1,lat:51.5,year:1350,use:"worksite.european-infirmary",kind:"bed" },
    { lon:36.3,lat:33.5,year:1250,use:"worksite.bimaristan",kind:"bed" },
    { lon:-99.1,lat:19.4,year:1650,use:"worksite.colonial-hospital",kind:"bed" },
    { lon:139.7,lat:35.7,year:1800,use:"worksite.edo-infirmary",kind:"mat" },
    { lon:-.1,lat:51.5,year:1880,use:"worksite.pavilion-hospital",kind:"bed" },
    { lon:80.51,lat:8.35,year:1000,use:"worksite.sri-lankan-infirmary",kind:"bed" },
    { lon:77.2,lat:28.6,year:1950,use:"worksite.modern-ward",kind:"bed" },
  ];
  for (const site of cases) {
    const pr = interiorProfileFor({...site,settlement:"city"});
    for (const seed of ["west","east","third"]) {
      const layout = buildInterior({id:"ward",claim:site.use.replace(".","-"),access:"public"} as Place, site, {seed});
      expect(layout.rooms.length,site.use).toBeGreaterThanOrEqual(3);
      expect(layout.beds.length,site.use).toBeGreaterThanOrEqual(4);
      expect(layout.beds.every(b => b.kind === site.kind)).toBe(true);
      expect(layout.locks.size).toBe(0);
      expect(layout.work.some(s => s.kind === "basin"),site.use).toBe(true);
      for (const [i, room] of layout.rooms.entries()) {
        const inside = (x:number,y:number) => x>room.x && x<=room.x+room.w && y>room.y && y<=room.y+room.d;
        expect([...layout.walk].some(key => {const [x,y]=key.split(",").map(Number);return inside(x,y);}),site.use+" "+room.label).toBe(true);
        if (room.role === "ward") {
          const beds = layout.beds.filter(b => inside(b.x,b.y));
          expect(beds.length,room.label).toBeGreaterThan(0);
          if (layout.plan.rooms[i].program === "ward") for (const bed of beds)
            expect(Math.abs(bed.x-room.x-room.w/2)>1).toBe(true);
        }
      }
      expect(layout.rooms.some((_,i) => layout.plan.rooms[i].shape==="courtyard")).toBe(pr.institutionPlan==="court");
      if(site.use==="worksite.sri-lankan-infirmary") expect(layout.rooms.filter(r=>r.role==="ward")).toHaveLength(4);
    }
  }
});

describe("towers", () => {
  const towerIn = (prompt: string, frames: string, seed = "plan") => {
    const resolved = resolveSetting(prompt, "tower");
    if (!("setting" in resolved)) throw Error(prompt);
    const s = resolved.setting;
    return { s, tower: towerPlan({ id: `t-${seed}`, sprite: `${frames}0-urban-tall` } as Place, seed, s)! };
  };
  it("lets each style's tower to firms of its place and year, staffed by work found there", () => {
    for (const [prompt, style] of [["Typist in New York 1930", towerStyles[0]], ["Clerk in Moscow 1955", towerStyles[1]], ["Clerk in Tokyo 1988", towerStyles[2]]] as const) {
      const { s, tower } = towerIn(prompt, style.frames);
      const n = tower.floors.length, here = new Set(resolveCharacterContext(s).livelihoods.map((l) => l.id));
      expect(n, style.id).toBeGreaterThanOrEqual(style.storeys[0]);
      expect(n, style.id).toBeLessThanOrEqual(style.storeys[1]);
      expect(tower.floors.map((f) => f.n)).toEqual([...Array(n).keys()]);
      expect(tower.floors[0].kind).toBe("lobby");
      expect(tower.floors[n - 1].kind, style.id).toMatch(/suite|lounge/);
      for (const f of tower.floors) {
        expect(style.rooms[f.kind] ?? style.lobby, `${style.id} ${f.kind}`).toBe(f.profile);
        expect(f.staff.length, f.name).toBeGreaterThan(0);
        for (const w of f.staff) expect(here.has(w.work), `${prompt}: ${w.work}`).toBe(true);
        expect(f.name, f.tenant).not.toMatch(/[{}[\]]/);
        if (f.n) expect(f.profile?.door).toBe("lift");
      }
    }
  });
  it("lets an office building and a block of flats by the storeys drawn, with stairs where there was no lift", () => {
    const plan = (prompt: string, sprite: string, o: Partial<Place>) => {
      const resolved = resolveSetting(prompt, "tower");
      if (!("setting" in resolved)) throw Error(prompt);
      return towerPlan({ id: "b", sprite, ...o } as Place, "plan", resolved.setting)!;
    };
    const office = plan("Clerk in Chicago 1965", "mod-office-0-urban-tall", { name: "Offices" });
    expect(office.floors).toHaveLength(7);
    expect(office.floors[0].kind).toBe("lobby");
    expect(office.style.lift.name).toBe("Lift");
    const flats = plan("Clerk in New York 1920", "mod-walkup-0-urban-tall", { name: "Tenement", access: "household" });
    expect(flats.floors[0].kind).toBe("home");
    expect(flats.floors[0].profile).toBeUndefined();
    expect(flats.floors.slice(1).every((f) => f.kind === "flat")).toBe(true);
    expect(flats.style.lift.name).toBe("Stairs");
    expect(plan("Clerk in Moscow 1975", "mod-panelka-0-urban-tall", { name: "Flats", access: "household" }).style.lift.name).toBe("Lift");
    expect(plan("Clerk in Chicago 1965", "mod-brick-0-urban-row", { name: "Offices" })).toBeUndefined();
  });
  it("keeps firms to their era and economy", () => {
    const kinds = (prompt: string, frames: string) =>
      new Set(["a", "b", "c", "d"].flatMap((seed) => towerIn(prompt, frames, seed).tower.floors.map((f) => f.tenant)));
    const chicago = kinds("Clerk in Chicago 1925", "mod-deco-");
    expect(chicago.has("software") || chicago.has("call-centre") || chicago.has("ministry")).toBe(false);
    expect(chicago.has("law") || chicago.has("insurance")).toBe(true);
    const moscow = kinds("Clerk in Moscow 1955", "mod-vysotka-");
    expect(moscow.has("law") || moscow.has("brokers") || moscow.has("advertising")).toBe(false);
    expect(moscow.has("ministry")).toBe(true);
    expect(kinds("Clerk in Bangkok 2010", "mod-deco-").has("software")).toBe(true);
  });
  it.runIf(!!process.env.FULL)("lets a New York tower by its floors, and its lift carries the player up", () => {
    const resolved = resolveSetting("Typist in New York 1930", "tower");
    if (!("setting" in resolved)) throw Error("Fixture setting");
    const e = createSettingSession(resolved.setting, "tower");
    const place = e.world.places.find((p) => p.sprite?.startsWith("mod-deco-"));
    expect(place, "a deco tower downtown").toBeTruthy();
    const tower = e.towerOf(place!.id)!;
    expect(tower.floors.length).toBeGreaterThanOrEqual(22);
    expect(new Set(tower.floors.map((f) => f.name)).size).toBeGreaterThan(4);
    const lobby = e.interiorOf(place!.id)!;
    const door = lobby.props.find((q) => q.kind === "elevator")!;
    e.state.player.pos = { x: door.x + ROOM_ORIGIN, y: door.y + ROOM_ORIGIN + 1, space: place!.id };
    expect(e.towerLift()?.n).toBe(0);
    e.act({ actionId: "lift", expectedRevision: e.state.revision, command: { type: "interact", action: "lift", target: "12" } });
    expect(e.state.player.pos.space).toBe(`${place!.id}@12`);
    expect(e.towerLift()?.n).toBe(12);
  });

  it("recreates The Overlook Hotel and a solvable snow-capped Hedge Maze as a Shining easter egg", () => {
    const start = resolveSetting("The Shining", "overlook-test");
    if ("error" in start) throw Error(start.error);
    expect(start.needsInterpretation).toBe(false);
    expect(start.setting.placeId).toBe("overlook-hotel");
    expect(start.setting.characterName).toBe("Jack Torrance");
    expect(start.setting.season).toBe("winter");
    expect(start.setting.startIn).toBe("hotel");

    const wendy = resolveSetting("Wendy Torrance in Room 237", "overlook-wendy");
    if ("error" in wendy) throw Error(wendy.error);
    expect(wendy.setting.characterName).toBe("Wendy Torrance");
    expect(wendy.setting.venueRoom).toBe("Room 237");

    const ball = resolveSetting("Overlook Hotel 1921", "overlook-1921");
    if ("error" in ball) throw Error(ball.error);
    expect(ball.setting.year).toBe(1921);
    expect(ball.setting.season).toBe("summer");

    const layout = buildInterior(
      { id: "overlook-1", name: "The Overlook Hotel", access: "public", claim: "venue-venue.overlook", w: 6, h: 4 } as Place,
      { lon: -105.52, lat: 40.38, year: 1980, use: "venue.overlook" },
      { seed: "overlook-test", fortune: 0.9 },
    );
    expect(layout.profileId).toBe("overlook-hotel");
    expect(layout.rooms.map((r) => r.label)).toEqual([
      "Overlook Hedge Maze",
      "Room 237",
      "Second-Floor Corridor",
      "Torrance Quarters",
      "The Gold Room",
      "Colorado Lounge",
      "Overlook Kitchen",
      "Gold Room Restroom",
      "Overlook Lobby",
    ]);
    // Every single room AND the central Hedge Maze clearing must be reachable on foot from the hotel entrance.
    const reached = new Set<string>([`${layout.entry.x},${layout.entry.y}`]);
    const queue = [layout.entry];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy, k = `${nx},${ny}`;
        if (!reached.has(k) && layout.walk.has(k)) {
          reached.add(k);
          queue.push({ x: nx, y: ny });
        }
      }
    }
    for (const r of layout.rooms) {
      const hasWalkable = [...reached].some((k) => {
        const [x, y] = k.split(",").map(Number);
        return roomAt(layout, x, y) === r;
      });
      expect(hasWalkable, `reachable room ${r.label}`).toBe(true);
    }
    // Central Maze Clearing (plan coords x=21..25, y=5..7 -> game coords + ROOM_ORIGIN) must be solvable!
    expect(reached.has(`${23 + ROOM_ORIGIN},${6 + ROOM_ORIGIN}`)).toBe(true);
    // Corridor uses Hicks' hexagon carpet; Hedge Maze uses open-air snowy terrace.
    expect(layout.plan.rooms[2].floorPattern).toBe("overlook-hex");
    expect(layout.plan.rooms[0].floorPattern).toBe("snow-ground");
    expect(layout.plan.rooms[0].shape).toBe("terrace");
  });

  it("spawns walkable procedural secret back-rooms and varied household quirks across eras", () => {
    const sites: Record<string, { lon: number; lat: number; year: number; settlement: "city" | "town" }> = {
      speakeasy: { lon: -87.63, lat: 41.88, year: 1925, settlement: "city" },
      wunderkammer: { lon: 4.9, lat: 52.37, year: 1660, settlement: "city" },
      "clandestine-press": { lon: 2.35, lat: 48.86, year: 1789, settlement: "city" },
      "alchemist-sanctum": { lon: 14.42, lat: 50.08, year: 1595, settlement: "city" },
      "herb-stillroom": { lon: -1.26, lat: 51.75, year: 1640, settlement: "town" },
      "smuggler-parlour": { lon: -0.1, lat: 51.5, year: 1740, settlement: "city" },
    };
    for (const br of SECRET_BACKROOMS) {
      const site = sites[br.id] ?? { lon: 2.35, lat: 48.86, year: 1750, settlement: "city" as const };
      // Test both a multi-room home and a single-room public shopfront.
      for (const mode of ["home", "shop"] as const) {
        const place = (mode === "shop"
          ? { id: `br-shop-${br.id}`, name: "Corner Shop", access: "public", claim: "", w: 4, h: 4 }
          : { id: `br-home-${br.id}`, name: "Townhouse", access: "household", claim: "", w: 6, h: 5 }) as Place;
        const layout = buildInterior(place, site, { seed: `br-${br.id}`, fortune: 0.7, activity: mode === "shop" ? "grocer" : "clerk", secretRoom: br.id });
        expect(layout.backroom?.id, `${br.id} (${mode})`).toBe(br.id);
        expect(layout.rooms[layout.rooms.length - 1].label, `${br.id} (${mode})`).toBe(br.label);
        expect(layout.plan.doorways.some((dw) => dw.secret), `${br.id} secret doorway`).toBe(true);
        if (br.staff?.length) {
          for (const st of br.staff) {
            expect(layout.staff?.some((s) => s.roomLabel === br.label && s.work === st.work), `${br.id} staff ${st.work}`).toBe(true);
          }
        }
        // BFS from entrance must reach inside the secret back-room.
        const reached = new Set<string>([`${layout.entry.x},${layout.entry.y}`]);
        const q = [layout.entry];
        while (q.length) {
          const cur = q.shift()!;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const k = `${cur.x + dx},${cur.y + dy}`;
            if (!reached.has(k) && layout.walk.has(k)) { reached.add(k); q.push({ x: cur.x + dx, y: cur.y + dy }); }
          }
        }
        const secretWing = layout.rooms[layout.rooms.length - 1];
        const reachedSecret = [...reached].some((k) => {
          const [x, y] = k.split(",").map(Number);
          return roomAt(layout, x, y) === secretWing;
        });
        expect(reachedSecret, `${br.id} (${mode}) reachable on foot`).toBe(true);
      }
    }
    // Organic spawn rate: occasional (~8-30%) in eligible urban buildings, zero in churches/theatres.
    const chicagoProfile = interiorProfileFor({ lon: -87.63, lat: 41.88, year: 1925, settlement: "city" });
    let hits = 0;
    for (let s = 1; s <= 120; s++) {
      if (pickBackroom(chicagoProfile, { lon: -87.63, lat: 41.88, year: 1925, settlement: "city" }, s * 73, 1)) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(8);
    expect(hits).toBeLessThanOrEqual(40);
    const church = interiorProfiles.find((p) => p.observance)!;
    for (let s = 1; s <= 40; s++) expect(pickBackroom(church, { lon: 2, lat: 48, year: 1750, settlement: "city" }, s, 2)).toBeUndefined();
    // Everyday household quirks vary across seeds and place distinct quirk fixtures or clutter.
    const quirks = new Set<string>();
    const fixtures = new Set<string>();
    for (let s = 1; s <= 60; s++) {
      const q = pickHouseholdQuirk(chicagoProfile, 1925, s * 19, 1);
      if (q) { quirks.add(q.id); for (const f of q.fixtures ?? []) fixtures.add(f.item); }
    }
    expect(quirks.size).toBeGreaterThanOrEqual(6);
    expect(fixtures.size).toBeGreaterThanOrEqual(4);

    // New specialist professions exist, resolve from player prompts, and furnish matching shops/back-rooms.
    for (const id of ["pianist", "lutenist", "guitarist", "instrument-maker", "speakeasy-proprietor", "pet-shop-owner", "antiquarian", "alchemist", "pamphleteer", "card-sharp"]) {
      expect(livelihoodById(id), `livelihood ${id}`).toBeDefined();
    }
    for (const [prompt, match] of [
      ["A piano player in Chicago, 1925", /pianist|piano player/i],
      ["A speakeasy proprietor in Chicago, 1925", /speakeasy/i],
      ["A pet shop owner in London, 1895", /pet shop/i],
      ["An alchemist in Prague, 1595", /alchemist/i],
      ["A lutenist in Venice, 1560", /lutenist/i],
      ["A curiosity collector in Amsterdam, 1660", /curiosity|collector|antiquarian|cabinet/i],
    ] as const) {
      const r = resolveSetting(prompt, "prof-test");
      expect("setting" in r, prompt).toBe(true);
      if ("setting" in r) expect(r.setting.role, prompt).toMatch(match);
    }
    // Pet Shop Owner's public shop spawns live birdcages + terrarium; Speakeasy Proprietor spawns Speakeasy with Proprietor + Jazz Pianist.
    const petShop = buildInterior(
      { id: "pet-shop-1", name: "Pet Shop Owner's shop", access: "public", claim: "", w: 5, h: 5 } as Place,
      { lon: -0.1, lat: 51.5, year: 1895, settlement: "city" },
      { seed: "pet-shop", fortune: 0.7, ownerRole: "Pet Shop Owner", activity: "Exchanging goods" },
    );
    expect(petShop.rooms[0].label).toBe("Pet shop");
    expect(petShop.furniture.some((f) => f.def === "room-birdcage")).toBe(true);
    expect(petShop.furniture.some((f) => f.def === "room-terrarium")).toBe(true);

    const musicShop = buildInterior(
      { id: "music-shop-1", name: "Luthier's shop", access: "public", claim: "", w: 5, h: 5 } as Place,
      { lon: -0.1, lat: 51.5, year: 1895, settlement: "city" },
      { seed: "music-shop", fortune: 0.7, ownerRole: "Music Shop Owner", activity: "Making instruments" },
    );
    expect(musicShop.rooms[0].label).toBe("Music shop");
    expect(musicShop.furniture.some((f) => f.def === "room-piano")).toBe(true);

    const speakOwner = buildInterior(
      { id: "speak-owner-1", name: "Speakeasy Proprietor's shop", access: "public", claim: "", w: 5, h: 5 } as Place,
      { lon: -87.63, lat: 41.88, year: 1925, settlement: "city" },
      { seed: "speak-owner", fortune: 0.7, ownerRole: "Speakeasy Proprietor", activity: "Keeping the house" },
    );
    expect(speakOwner.backroom?.id).toBe("speakeasy");
    expect(speakOwner.staff?.some((s) => s.work === "speakeasy-proprietor")).toBe(true);
    expect(speakOwner.staff?.some((s) => s.work === "pianist")).toBe(true);
  });

  it("wires interactive birdcage, toggleable terrarium heat lamp, and reusable playable instruments", () => {
    for (const key of ["room-birdcage", "room-terrarium", "room-piano", "room-lute", "room-guitar"]) {
      expect(propDefs[key]?.act?.room, key).toBeDefined();
    }
    // Speakeasy back-room exposes its upright piano as an interactive room-piano prop.
    const sp = buildInterior(
      { id: "inst-sp", name: "Corner Shop", access: "public", claim: "", w: 5, h: 5 } as Place,
      { lon: -87.63, lat: 41.88, year: 1925, settlement: "city" },
      { seed: "inst-sp", fortune: 0.7, activity: "grocer", secretRoom: "speakeasy" },
    );
    expect(sp.furniture.some((f) => f.def === "room-piano")).toBe(true);
    // Terrarium toggles heat lamp, birdcage sings, and instruments request their overlay.
    const host = {
      seed: "t", clock: 43200, year: 1925, places: [], objects: [], actors: [],
      playerPos: { x: 2, y: 2, space: "h1" }, hasItem: () => false, interiorOf: () => undefined,
      blocked: () => false, actorAt: () => false, moveActor: () => {}, asleep: () => false,
      mindsCounter: () => false, livesIn: () => true, rain: () => 0, storm: () => 0, say: () => {}, lieDown: () => "", event: () => {},
    };
    const terr = { id: "o-terr", name: "Parlour terrarium", kind: "prop" as const, prop: "room-terrarium", pos: { x: 2, y: 2, space: "h1" }, open: true, inventory: {} };
    const off = performRoomAct(host, terr as any, propDefs["room-terrarium"].act!);
    expect(terr.open).toBe(false);
    expect(off.sound).toBe("switch");
    const on = performRoomAct(host, terr as any, propDefs["room-terrarium"].act!);
    expect(terr.open).toBe(true);
    expect(on.sound).toBe("switch");

    const cage = { id: "o-cage", name: "Songbird cage", kind: "prop" as const, prop: "room-birdcage", pos: { x: 2, y: 2, space: "h1" }, open: false, inventory: {} };
    const chirp = performRoomAct(host, cage as any, propDefs["room-birdcage"].act!);
    expect(cage.open).toBe(true);
    expect(chirp.sound).toBe("bird");

    for (const [prop, expected] of [["room-piano", "piano"], ["room-lute", "lute"], ["room-guitar", "guitar"]] as const) {
      expect(instrumentForProp(prop)).toBe(expected);
      const obj = { id: `o-${expected}`, name: expected, kind: "prop" as const, prop, pos: { x: 2, y: 2, space: "h1" }, open: false, inventory: {} };
      const act = performRoomAct(host, obj as any, propDefs[prop].act!);
      expect(act.openInstrument).toBe(expected);
      const spec = INSTRUMENTS[expected];
      const buf = synthesize(spec.voice, spec.baseMidi, 0, 0, 22050);
      expect(buf.some((v) => Math.abs(v) > 0.05), `${expected} synth audio`).toBe(true);
    }
  });
});
