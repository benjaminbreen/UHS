import { describe, expect, it } from "vitest";
import { interiorProfiles, resolveRoom } from "../src/content/interiors";
import { interiorProfileFor } from "../src/content/interiors/select";
import { buildInterior } from "../src/world/interior";
import { planRoom, roomMask, type Shape } from "../src/render/interiors/room";
import { LETTERS, SPRITES } from "../src/render/interiors/sprites";
import { ALTARS } from "../src/render/interiors/altars";
import { planBuilding } from "../src/render/interiors/building";
import type { Place } from "../src/core/types";
import { createSettingSession } from "../src/runtime/session";
import { panelSetting } from "../scripts/review/panel";

const shapes: Shape[] = ["rect", "L", "round", "oval", "apse", "courtyard"];

describe("interior profiles", () => {
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

  it("lodges whoever keeps a kiva with a neighbouring household, and leaves the kiva to its gatherings", () => {
    const e = createSettingSession({ ...panelSetting("area-colorado-plateau", 1100), settlement: "city", season: "summer" }, "cust");
    const kiva = e.world.places.find((p) => p.claim === "venue-venue.kiva")!;
    expect(e.state.households!.some((h) => h.residence === kiva.id)).toBe(false);
    const keeper = e.state.households!.find((h) => h.members.includes(kiva.owner))!;
    expect(e.world.place(keeper.residence!)!.claim.startsWith("venue-")).toBe(false);
    expect(e.interiorOf(kiva.id)!.params.program).toBe("gather");
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
      { id: "chinese-temple", lon: 116, lat: 40, year: 1500, use: "venue.temple-court-east" },
      { id: "japanese-temple", lon: 135.8, lat: 35, year: 1700, use: "venue.temple-court-east" },
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
      { id: "opera-house", lon: 16.4, lat: 48.2, year: 1800, use: "venue.opera-house" },
      { id: "noh-theatre", lon: 135.8, lat: 35, year: 1700, use: "venue.noh-stage" },
      { id: "kabuki-theatre", lon: 139.7, lat: 35.7, year: 1800, use: "venue.kabuki-theatre" },
      { id: "cinema", lon: -74, lat: 40.7, year: 1930, use: "venue.cinema" },
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
      { name: "Grocer's shop", site: { lon: -0.1, lat: 51.5, year: 1900 }, stock: "general", counter: "glazed" },
    ];
    for (const { name, site, stock, counter } of shops)
      for (const fortune of [0.1, 0.9])
        for (let n = 0; n < 5; n++) {
          const where = `${name} ${site.year} ${fortune} #${n}`;
          const room = buildInterior({ id: `t-shop-${n}`, name, access: "public", claim: "landscape" } as Place, { ...site, settlement: "city" }, { fortune });
          expect(room.plan.rooms[0].styles, where).toMatchObject({ stock, shopcounter: counter });
          expect(room.work[0], where).toMatchObject({ kind: "shopcounter", facing: 2 });
          expect(room.beds.length, where).toBeGreaterThan(0);
        }
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

  it("keeps a grown member of the household behind the bar and sits drinkers down late", () => {
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

  it("fills the taproom with neighbours off the routine budget while the player is in it", () => {
    const e = createSettingSession({ ...panelSetting("london", 1700), season: "summer" }, "tavern");
    const ale = e.world.places.find((p) => p.claim === "venue-venue.alehouse")!;
    const room = e.interiorOf(ale.id)!;
    e.state.clock += ((19 - (e.state.clock / 3600) % 24 + 24) % 24) * 3600;
    e.state.player.pos = { ...room.entry, space: ale.id };
    e.advance(60);
    const regulars = e.state.actors.filter((a) => a.pos.space === ale.id && e.world.dormant?.(a.id));
    expect(regulars.length).toBeGreaterThanOrEqual(8);
    expect(regulars.every((a) => room.seats.some((s) => s.x === a.pos.x && s.y === a.pos.y))).toBe(true);
    e.state.player.pos = { ...ale.entrance, space: "outside" };
    e.advance(60);
    expect(regulars.filter((a) => a.pos.space === ale.id)).toEqual([]);
  });

  it("stands furniture in the house as things that block, shift and break", () => {
    const e = createSettingSession({ ...panelSetting("kyoto", 1700), season: "summer" }, "furniture");
    const home = e.state.households!.find((h) => h.members.includes("player"))!.residence!;
    const room = e.interiorOf(home)!;
    const pieces = room.furniture.map((f) => e.state.objects.find((o) => o.id === `${home}-room-${f.propId}`)!);
    expect(pieces.length).toBeGreaterThan(0);
    for (const [i, o] of pieces.entries())
      for (let dx = 0; dx < room.furniture[i].size[0]; dx++) expect(e.blocked(o.pos.x + dx, o.pos.y, home), o.name).toBe(true);
    const broke = pieces[0];
    broke.broken = true;
    expect(e.blocked(broke.pos.x, broke.pos.y, home)).toBe(false);
    // Nobody is sent to sit at, or work at, what is no longer there.
    const spots = [...room.seats, ...room.work, ...room.fire, ...room.beds].filter((s) => s.propId === room.furniture[0].propId);
    const a = e.state.actors.find((x) => x.kind === "human")!;
    for (let n = 0; n < 6; n++) {
      const at = e.indoorSpot(a, home, "Resting", n);
      expect(spots.some((s) => s.x === at.x && s.y === at.y)).toBe(false);
      expect(e.blocked(at.x, at.y, home)).toBe(false);
    }
  });

  it("draws every sprite with letters that have a colour", () => {
    for (const [name, rows] of Object.entries(SPRITES))
      for (const ch of rows.join("")) if (ch !== "." && ch !== "#") expect(LETTERS[ch], `${name} uses "${ch}"`).toBeDefined();
    for (const [name, art] of Object.entries(ALTARS))
      for (const ch of art.rows.join("")) if (!".*%".includes(ch)) expect(art.ink[ch], `altar ${name} uses "${ch}"`).toBeDefined();
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
            expect(xs.size === 1 ? ys.size : xs.size, `${where} doorway width`).toBe(2);
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
