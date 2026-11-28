import type { Building, Doorway, PlacedRoom } from "../../render/interiors/building";
import { roomMask, type Kind, type Prop, type RoomParams } from "../../render/interiors/room";
import { resolveRoom, type RoomChoice } from "./resolve";
import type { InteriorProfile, RoomTemplate } from "./types";

/**
 * The Overlook Hotel & Hedge Maze (Easter egg — Stanley Kubrick's *The Shining*, 1980).
 *
 * Nine interconnected rooms plus an open-air snow-covered playable evergreen
 * hedge maze laid out on one continuous 47×51 grid using the procedural
 * interior engine.
 */

// 25×13 playable Overlook Hedge Maze ('#' = 3D snow-capped hedge, '.' = snow path,
// 'p' = bootprints in snow, 'C' = Central Maze Clearing).
export const OVERLOOK_MAZE_ROWS = [
  "#########################",
  "#p....p.....p...........#",
  "#.#####.####.####.#####.#",
  "#p#...#.#...p...#.#...#.#",
  "#.#.#.#.#.##.##.#.#.#.#.#",
  "#p..#.#.#.CCCCC.#...#.#.#",
  "#.###.#.#.CCCCC.###.#.#.#",
  "#.....#.#.CCCCC.#...#.#.#",
  "#.#####.#########.#.###.#",
  "#.#...p...#...#...#.....#",
  "#.#.#####.#.#.#.#####.###",
  "#...p.....p.#...#.......#",
  "###########.p.###########",
] as const;

export const OVERLOOK_MAZE_ORIGIN = { x: 8, y: 0 };
export const OVERLOOK_MAZE_OFFSET = { x: 3, y: 0 };
/** Center clearing bounds in room-plan coordinates (add ROOM_ORIGIN for game cells). */
export const OVERLOOK_CLEARING = { x0: 21, y0: 5, x1: 25, y1: 7 };

export const OVERLOOK_ROOM_NOTES: Record<string, string> = {
  "Overlook Lobby": "The brass room-key rack holds a hundred wooden tags. Slot 237 is empty. On the wall hangs a black-and-white photograph: Overlook Hotel, July 4th Ball, 1921.",
  "Colorado Lounge": "A winter storm beats against the tall lodge windows while pine logs crackle in the river-stone hearth. Beside the Adler typewriter sits a towering stack of typed pages — every single line reads the same.",
  "The Gold Room": "Golden light spills from the backlit shelves of the Art Deco bar. Faint 1920s ballroom jazz drifts from the ebony grand piano.",
  "Gold Room Restroom": "High-gloss blood-red lacquered walls gleam against stark white marble tiles and bright chrome mirrors.",
  "Overlook Kitchen": "Row upon row of gleaming No. 10 fruit cans and red Calumet baking powder tins line the steel shelves beside the heavy storeroom door.",
  "Second-Floor Corridor": "Interlocking burnt-orange, crimson, and brown hexagons stretch down the quiet hall. Beneath the bronze elevator doors, something dark glints softly on the carpet.",
  "Room 237": "Lavender wallpaper gives way to vivid green carpet and a steam-hushed avocado-green bathroom. The sunken green tub is drawn full.",
  "Torrance Quarters": "A woodgrain television flickers blue-white in the caretaker's suite. On the red inner door, splintered axe marks frame crimson letters: REDRUM.",
  "Overlook Hedge Maze": "Snow drifts down between twelve-foot evergreen hedges. Fresh bootprints wind through the frozen alleys toward the heart of the maze.",
};

export const OVERLOOK_CAST_LINES: Record<string, string[]> = {
  "Lloyd": [
    "Good evening, Mr. Torrance. What'll it be?",
    "Your money is no good here, sir. Orders from the house.",
    "Hair of the dog that bit you.",
  ],
  "Delbert Grady": [
    "I'm sorry to differ with you, sir, but you are the caretaker.",
    "You've always been the caretaker. I should know, sir. I've always been here.",
    "Allow me to brush that spot from your jacket, sir.",
  ],
  "Alexia Grady": [
    "Hello, Danny. Come and play with us.",
    "Forever... and ever... and ever.",
  ],
  "Eleanor Grady": [
    "Come play with us, Danny.",
    "Forever... and ever... and ever.",
  ],
  "Dick Hallorann": [
    "Enough canned peaches and fruit cocktail in that storeroom to last all winter.",
    "Just promise me one thing — stay out of Room 237.",
    "Some places shine, and the Overlook remembers everything that ever happened here.",
  ],
};

const room = (t: RoomTemplate): RoomTemplate => t;

export const overlookHotel: InteriorProfile = {
  id: "overlook-hotel",
  label: "The Overlook Hotel",
  region: "Colorado Rockies",
  period: "1909 – 1980",
  when: { start: { year: 1909 }, end: { year: 2100 } },
  basis: "modern",
  uses: ["venue.overlook"],
  institutionPlan: "overlook",
  note: "An isolated mountain resort hotel and snow-covered evergreen hedge maze in the Colorado Rockies: timber lodge lobby, soaring Colorado Lounge, gilded Art Deco Gold Room and red lacquered restroom, industrial kitchen, Hicks' hexagon corridor with Room 237, and a playable alpine labyrinth.",
  shapes: ["rect"],
  size: [16, 6],
  door: "door",
  windowStyle: "glazed",
  fire: "none",
  smokehole: false,
  seating: "chair",
  sleep: "none",
  trades: ["household"],
  furnish: [],
  looks: [
    { wall: "panel", floor: "plank", dado: "panel", wear: 0.08, soot: 0, windows: 0 },
    { wall: "panel", floor: "plank", dado: "panel", wear: 0.04, soot: 0, windows: 0 },
    { wall: "panel", floor: "plank", dado: "panel", wear: 0.02, soot: 0, windows: 0 },
  ],
  colorways: [
    { name: "Overlook cedar", wall: "#c89a64", trim: "#422818", floor: "#845c3c", wood: "#5a341c", accent: "#982228" },
    { name: "Overlook winter", wall: "#c09462", trim: "#3c2416", floor: "#7c5638", wood: "#54301a", accent: "#a8242a" },
  ],
  regulars: { hours: [0, 24], fill: 0 },
  staff: [
    { work: "tavern-keeper", name: "Lloyd", role: "Bartender", doing: "Polishing a whiskey glass behind the backlit Gold Room bar", roomLabel: "The Gold Room", spot: "stage", sex: "male", age: 46, hours: [0, 24] },
    { work: "valet", name: "Delbert Grady", role: "Former Caretaker", doing: "Waiting neatly beside the white porcelain basins", roomLabel: "Gold Room Restroom", sex: "male", age: 44, hours: [0, 24] },
    { work: "cook", name: "Dick Hallorann", role: "Head Chef", doing: "Checking the winter pantry shelves", roomLabel: "Overlook Kitchen", spot: "work", sex: "male", age: 62, hours: [0, 24] },
    { work: "scholar", name: "Alexia Grady", role: "Grady Twin", doing: "Standing quietly at the end of the hexagon corridor", roomLabel: "Second-Floor Corridor", sex: "female", age: 10, hours: [0, 24] },
    { work: "scholar", name: "Eleanor Grady", role: "Grady Twin", doing: "Holding her sister's hand on the hexagon carpet", roomLabel: "Second-Floor Corridor", sex: "female", age: 10, hours: [0, 24] },
  ],
  rooms: [
    room({
      id: "overlook-maze",
      label: "Overlook Hedge Maze",
      role: "hall",
      size: [31, 17],
      shapes: ["terrace"],
      windowStyle: "none",
      windows: 0,
      program: "passage",
      looks: [
        { wall: "stone", floor: "snow-ground", wear: 0, soot: 0 },
        { wall: "stone", floor: "snow-ground", wear: 0, soot: 0 },
        { wall: "stone", floor: "snow-ground", wear: 0, soot: 0 },
      ],
      colorways: [
        { name: "Alpine winter", wall: "#c4d8ea", trim: "#204230", floor: "#e2eef8", wood: "#5c3a20", accent: "#d8a838" },
      ],
    }),
    room({
      id: "room-237",
      label: "Room 237",
      role: "hall",
      size: [10, 7],
      windowStyle: "none",
      windows: 0,
      sleep: "bed",
      program: "passage",
      looks: [
        { wall: "wallpaper", floor: "broadloom", dado: "panel", wear: 0.04, soot: 0 },
        { wall: "wallpaper", floor: "broadloom", dado: "panel", wear: 0.02, soot: 0 },
        { wall: "wallpaper", floor: "broadloom", dado: "panel", wear: 0.01, soot: 0 },
      ],
      colorways: [
        { name: "Suite 237", wall: "#9e82b0", trim: "#c0d0ba", floor: "#4e924c", wood: "#442c38", accent: "#6e3e80" },
      ],
      styles: { altar: "overlook-bath237", lamp: "electric" },
    }),
    room({
      id: "hexagon-corridor",
      label: "Second-Floor Corridor",
      role: "hall",
      size: [19, 5],
      windowStyle: "none",
      windows: 0,
      program: "corridor",
      looks: [
        { wall: "wallpaper", floor: "overlook-hex", dado: "panel", wear: 0, soot: 0 },
        { wall: "wallpaper", floor: "overlook-hex", dado: "panel", wear: 0, soot: 0 },
        { wall: "wallpaper", floor: "overlook-hex", dado: "panel", wear: 0, soot: 0 },
      ],
      colorways: [
        { name: "Hicks hexagon", wall: "#dfd2b8", trim: "#4e2c1a", floor: "#d45a1e", wood: "#522e1a", accent: "#b22228" },
      ],
      styles: { altar: "overlook-elevator", lamp: "electric" },
    }),
    room({
      id: "torrance-quarters",
      label: "Torrance Quarters",
      role: "hall",
      size: [10, 7],
      windowStyle: "glazed",
      windows: 1,
      sleep: "bed",
      program: "passage",
      looks: [
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.06, soot: 0 },
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.03, soot: 0 },
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.02, soot: 0 },
      ],
      colorways: [
        { name: "Caretaker pine", wall: "#c69a68", trim: "#4c2c18", floor: "#885e3c", wood: "#664024", accent: "#9a2a24" },
      ],
      styles: { altar: "overlook-redrum", window: "snow", lamp: "electric" },
    }),
    room({
      id: "gold-room",
      label: "The Gold Room",
      role: "hall",
      size: [12, 9],
      windowStyle: "none",
      windows: 0,
      program: "passage",
      looks: [
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.03, soot: 0 },
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.02, soot: 0 },
        { wall: "deco", floor: "broadloom", dado: "panel", wear: 0.01, soot: 0 },
      ],
      colorways: [
        { name: "Gold ballroom", wall: "#dfc484", trim: "#583618", floor: "#6e1a24", wood: "#4c2614", accent: "#d8a434" },
      ],
      styles: { altar: "overlook-bar", lamp: "electric" },
    }),
    room({
      id: "colorado-lounge",
      label: "Colorado Lounge",
      role: "hall",
      size: [16, 9],
      windowStyle: "glazed",
      windows: 3,
      program: "passage",
      looks: [
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.04, soot: 0 },
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.02, soot: 0 },
        { wall: "timber", floor: "plank", dado: "panel", wear: 0.01, soot: 0 },
      ],
      colorways: [
        { name: "Timberline lodge", wall: "#cfa46e", trim: "#3e2414", floor: "#8a5e3a", wood: "#643e22", accent: "#a83824" },
      ],
      styles: { altar: "overlook-lounge-hearth", window: "snow", lamp: "electric" },
    }),
    room({
      id: "overlook-kitchen",
      label: "Overlook Kitchen",
      role: "kitchen",
      size: [11, 9],
      windowStyle: "none",
      windows: 0,
      trades: ["shopkeep"],
      program: "shop",
      looks: [
        { wall: "plaster", floor: "linoleum", dado: "panel", wear: 0.04, soot: 0 },
        { wall: "plaster", floor: "linoleum", dado: "panel", wear: 0.02, soot: 0 },
        { wall: "plaster", floor: "linoleum", dado: "panel", wear: 0.01, soot: 0 },
      ],
      colorways: [
        { name: "Mint tile", wall: "#98bfa4", trim: "#5c6a6e", floor: "#dce0d8", wood: "#6e7a7e", accent: "#b82628" },
      ],
      styles: { stock: "overlook-kitchen", shopcounter: "glazed", lamp: "electric" },
    }),
    room({
      id: "gold-restroom",
      label: "Gold Room Restroom",
      role: "hall",
      size: [9, 6],
      windowStyle: "none",
      windows: 0,
      program: "passage",
      looks: [
        { wall: "panel", floor: "tile", wear: 0, soot: 0 },
        { wall: "panel", floor: "tile", wear: 0, soot: 0 },
        { wall: "panel", floor: "tile", wear: 0, soot: 0 },
      ],
      colorways: [
        { name: "Red lacquer", wall: "#a8141c", trim: "#f0ece4", floor: "#eceae4", wood: "#3c1c16", accent: "#c41e26" },
      ],
      styles: { altar: "overlook-restroom-sinks", lamp: "electric" },
    }),
    room({
      id: "overlook-lobby",
      label: "Overlook Lobby",
      role: "entry",
      size: [16, 6],
      windowStyle: "glazed",
      windows: 1,
      trades: ["shopkeep"],
      program: "shop",
      looks: [
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.04, soot: 0 },
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.02, soot: 0 },
        { wall: "panel", floor: "plank", dado: "panel", wear: 0.01, soot: 0 },
      ],
      colorways: [
        { name: "Overlook cedar", wall: "#c89a64", trim: "#422818", floor: "#845c3c", wood: "#5a341c", accent: "#982228" },
      ],
      styles: { stock: "overlook-lobby", shopcounter: "glazed", window: "snow", lamp: "electric" },
    }),
  ],
};

const BOXES: readonly { x: number; y: number; w: number; d: number }[] = [
  { x: 8, y: 0, w: 31, d: 17 },   // 0: Overlook Hedge Maze & Snowy Grounds
  { x: 1, y: 21, w: 10, d: 7 },   // 1: Room 237
  { x: 14, y: 21, w: 19, d: 5 },  // 2: Second-Floor Corridor
  { x: 36, y: 21, w: 10, d: 7 },  // 3: Torrance Quarters
  { x: 1, y: 32, w: 12, d: 9 },   // 4: The Gold Room
  { x: 16, y: 32, w: 16, d: 9 },  // 5: Colorado Lounge
  { x: 35, y: 32, w: 11, d: 9 },  // 6: Overlook Kitchen
  { x: 2, y: 45, w: 9, d: 6 },    // 7: Gold Room Restroom
  { x: 16, y: 45, w: 16, d: 6 },  // 8: Overlook Lobby
];

const throughCells = (x: number, y0: number, y1: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = y0; y <= y1; y++) out.push([x, y], [x + 1, y]);
  return out;
};
const sideCells = (x0: number, x1: number, y: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let x = x0; x <= x1; x++) out.push([x, y], [x, y + 1]);
  return out;
};

/** Builds the complete 9-room Overlook Hotel & playable Snow-Capped Hedge Maze. */
export function buildOverlookBuilding(profile: InteriorProfile, c: RoomChoice): Building {
  const w = 47, d = 51;
  const mask = new Uint8Array(w * d), cells = new Int16Array(w * d).fill(-1);
  const rooms: RoomParams[] = [];
  const placed: PlacedRoom[] = [];
  const props: Prop[] = [];
  let nextId = 0;

  const addProp = (
    ri: number,
    kind: Kind,
    lx: number,
    ly: number,
    pw: number,
    pd: number,
    wall: boolean,
    on = true,
    item?: string,
  ) => {
    const b = BOXES[ri];
    props.push({
      id: nextId++,
      kind,
      x: b.x + lx,
      y: b.y + ly,
      w: pw,
      d: pd,
      wall,
      on,
      room: ri,
      ...(item ? { item } : {}),
      seed: c.seed + nextId * 131,
    });
  };

  const doorways: Doorway[] = [
    // Overlook Lobby (8) -> Colorado Lounge (5)
    { from: 8, to: 5, private: false, cells: throughCells(23, 41, 44) },
    // Colorado Lounge (5) -> The Gold Room (4)
    { from: 4, to: 5, private: false, side: true, cells: sideCells(13, 15, 37) },
    // Colorado Lounge (5) -> Overlook Kitchen (6)
    { from: 5, to: 6, private: false, side: true, cells: sideCells(32, 34, 37) },
    // The Gold Room (4) -> Gold Room Restroom (7)
    { from: 7, to: 4, private: false, cells: throughCells(8, 41, 44) },
    // Colorado Lounge (5) -> Grand Staircase up to Second-Floor Corridor (2)
    { from: 5, to: 2, private: false, stairs: 6, cells: throughCells(23, 26, 31) },
    // Second-Floor Corridor (2) -> Room 237 (1)
    { from: 1, to: 2, private: false, side: true, cells: sideCells(11, 13, 23) },
    // Second-Floor Corridor (2) -> Torrance Quarters (3)
    { from: 2, to: 3, private: false, side: true, cells: sideCells(33, 35, 23) },
    // Second-Floor Corridor (2) -> North Garden Archway out to Overlook Hedge Maze (0)
    { from: 2, to: 0, private: false, cells: throughCells(23, 17, 20) },
  ];

  const templates = profile.rooms!;
  for (let ri = 0; ri < BOXES.length; ri++) {
    const b = BOXES[ri], t = templates[ri];
    const params = resolveRoom(profile, {
      ...c,
      status: 2,
      colorway: 0,
      room: ri,
      w: b.w,
      d: b.d,
      shape: t.shapes?.[0] ?? "rect",
      seed: c.seed + ri * 101,
    });
    params.role = t.role ?? "hall";
    params.dines = false;
    if (ri === 8) params.entrance = 7; // South front door at world x=23, y=50
    rooms.push(params);
    placed.push({ label: t.label, role: params.role, x: b.x, y: b.y, w: b.w, d: b.d, private: false });
    const m = roomMask(params);
    for (let y = 0; y < b.d; y++) {
      for (let x = 0; x < b.w; x++) {
        if (m[y * b.w + x]) {
          mask[(y + b.y) * w + (x + b.x)] = m[y * b.w + x];
          cells[(y + b.y) * w + (x + b.x)] = ri;
        }
      }
    }
  }

  for (const dw of doorways) {
    for (const [cx, cy] of dw.cells) {
      mask[cy * w + cx] = 1;
      cells[cy * w + cx] = dw.to === 0 ? 2 : dw.to;
    }
  }

  // --- Room 0: Overlook Hedge Maze & Snowy Grounds ---
  const mazeRows = OVERLOOK_MAZE_ROWS;
  const mh = mazeRows.length, mw = mazeRows[0].length;
  const isHedge = (mx: number, my: number) => my >= 0 && my < mh && mx >= 0 && mx < mw && mazeRows[my][mx] === "#";
  for (let my = 0; my < mh; my++) {
    let mx = 0;
    while (mx < mw) {
      if (!isHedge(mx, my)) {
        if (mazeRows[my][mx] === "p") {
          addProp(0, "clutter", OVERLOOK_MAZE_OFFSET.x + mx, OVERLOOK_MAZE_OFFSET.y + my, 1, 1, false, false, "overlook:prints");
        }
        mx++;
        continue;
      }
      // Group contiguous horizontal hedge tiles into <= 8-tile runs so cutouts stay compact & crisp.
      let run = "";
      const startX = mx;
      while (mx < mw && isHedge(mx, my) && run.length < 8) {
        const bit = (isHedge(mx, my - 1) ? 1 : 0)
          | (isHedge(mx + 1, my) ? 2 : 0)
          | (isHedge(mx, my + 1) ? 4 : 0)
          | (isHedge(mx - 1, my) ? 8 : 0);
        run += bit.toString(16);
        mx++;
      }
      addProp(0, "fixture", OVERLOOK_MAZE_OFFSET.x + startX, OVERLOOK_MAZE_OFFSET.y + my, run.length, 1, false, true, `overlook:hedge:${run}`);
    }
  }
  // Central Maze Clearing: snow-dusted bench, glowing frosted lantern post & embedded fire axe!
  addProp(0, "fixture", 13, 5, 1, 1, false, true, "overlook:lantern-post");
  addProp(0, "bench", 15, 5, 1, 1, false, false);
  addProp(0, "fixture", 17, 5, 1, 1, false, true, "overlook:axe");
  // Snowy Forecourt: "OVERLOOK MAZE" timber archway, wooden maze map sign, frosted lanterns, alpine blue spruces.
  addProp(0, "fixture", 10, 13, 3, 1, false, true, "overlook:maze-arch");
  addProp(0, "fixture", 18, 13, 1, 1, false, true, "overlook:maze-sign");
  addProp(0, "fixture", 13, 14, 1, 1, false, true, "overlook:lantern-post");
  addProp(0, "fixture", 17, 14, 1, 1, false, true, "overlook:lantern-post");
  for (const [px, py] of [[1, 2], [1, 7], [1, 12], [3, 15], [29, 2], [29, 7], [29, 12], [27, 15]] as const) {
    addProp(0, "fixture", px, py, 1, 1, false, true, "overlook:pine");
  }
  for (const [fx, fy] of [[15, 15], [15, 14], [15, 13]] as const) {
    addProp(0, "clutter", fx, fy, 1, 1, false, false, "overlook:prints");
  }

  // --- Room 1: Room 237 (lavender & vivid avocado-green suite) ---
  addProp(1, "altar", 1, 0, 4, 1, true, true);
  addProp(1, "dresser", 6, 0, 2, 1, true, false);
  addProp(1, "frame", 5, 0, 1, 0, true, false);
  addProp(1, "bed", 6, 2, 2, 2, false, false);
  addProp(1, "armchair", 1, 4, 1, 1, false, false);
  addProp(1, "table", 2, 4, 1, 1, false, false);
  addProp(1, "lamp", 0, 2, 1, 1, false, true);
  addProp(1, "lamp", 8, 5, 1, 1, false, true);

  // --- Room 2: Second-Floor Hexagon Corridor ---
  addProp(2, "altar", 2, 0, 4, 1, true, true); // Blood Elevator Alcove
  addProp(2, "frame", 12, 0, 1, 0, true, false);
  addProp(2, "frame", 15, 0, 1, 0, true, false);
  addProp(2, "lamp", 1, 0, 1, 1, false, true);
  addProp(2, "lamp", 7, 0, 1, 1, false, true);
  addProp(2, "lamp", 13, 0, 1, 1, false, true);
  addProp(2, "lamp", 17, 0, 1, 1, false, true);
  addProp(2, "fixture", 2, 3, 1, 1, false, true, "overlook:tricycle");
  addProp(2, "clutter", 6, 2, 1, 1, false, false, "overlook:tennis-ball");

  // --- Room 3: Torrance Quarters (Caretaker's Apartment) ---
  addProp(3, "altar", 1, 0, 3, 1, true, true); // REDRUM Door with splintered axe marks
  addProp(3, "window", 6, 0, 1, 0, true, true);
  addProp(3, "frame", 8, 0, 1, 0, true, false);
  addProp(3, "fixture", 5, 1, 1, 1, false, true, "overlook:tv");
  addProp(3, "bed", 7, 1, 2, 2, false, false);
  addProp(3, "table", 2, 4, 2, 1, false, false);
  addProp(3, "stool", 2, 5, 1, 1, false, false);
  addProp(3, "stool", 3, 5, 1, 1, false, false);
  addProp(3, "fixture", 5, 5, 1, 1, false, true, "overlook:axe");
  addProp(3, "lamp", 8, 5, 1, 1, false, true);

  // --- Room 4: The Gold Room ---
  addProp(4, "altar", 2, 0, 8, 1, true, true); // Illuminated Backlit Art Deco Bar
  for (const sx of [2, 4, 7, 9]) addProp(4, "stool", sx, 2, 1, 1, false, false);
  addProp(4, "fixture", 1, 5, 2, 1, false, true, "overlook:piano");
  addProp(4, "table", 6, 5, 2, 1, false, false);
  addProp(4, "stool", 5, 5, 1, 1, false, false);
  addProp(4, "stool", 8, 5, 1, 1, false, false);
  addProp(4, "lamp", 0, 2, 1, 1, false, true);
  addProp(4, "lamp", 11, 2, 1, 1, false, true);
  addProp(4, "lamp", 1, 7, 1, 1, false, true);

  // --- Room 5: The Colorado Lounge ---
  addProp(5, "altar", 1, 0, 5, 1, true, true); // Massive River-Stone Fireplace
  addProp(5, "window", 10, 0, 1, 0, true, true);
  addProp(5, "window", 12, 0, 1, 0, true, true);
  addProp(5, "window", 14, 0, 1, 0, true, true);
  addProp(5, "rug", 2, 2, 4, 3, false, false);
  addProp(5, "armchair", 1, 3, 1, 1, false, false);
  addProp(5, "armchair", 5, 3, 1, 1, false, false);
  addProp(5, "fixture", 3, 5, 2, 1, false, true, "overlook:typewriter");
  addProp(5, "stool", 3, 6, 1, 1, false, false);
  addProp(5, "sofa", 11, 1, 3, 1, false, false);
  addProp(5, "rug", 10, 3, 4, 3, false, false);
  addProp(5, "fixture", 11, 4, 2, 1, false, true, "overlook:maze-model");
  addProp(5, "lamp", 0, 1, 1, 1, false, true);
  addProp(5, "lamp", 15, 1, 1, 1, false, true);
  addProp(5, "lamp", 1, 7, 1, 1, false, true);
  addProp(5, "lamp", 14, 7, 1, 1, false, true);

  // --- Room 6: Overlook Kitchen & Cold Storeroom ---
  addProp(6, "stock", 1, 0, 2, 1, true, false); // Pantry shelves (cans & Calumet tins)
  addProp(6, "stock", 4, 0, 2, 1, true, false); // Steel Walk-In Storeroom Door
  addProp(6, "stock", 7, 0, 2, 1, true, false); // Second Pantry Shelf
  addProp(6, "frame", 3, 0, 1, 0, true, false); // Hanging copper pans
  addProp(6, "frame", 6, 0, 1, 0, true, false); // Menu slate
  addProp(6, "shopcounter", 2, 3, 5, 1, false, false); // Stainless prep counter
  addProp(6, "range", 8, 3, 2, 1, false, true); // Industrial stove
  addProp(6, "display", 8, 6, 2, 1, false, false); // Stacked crate of No. 10 cans
  addProp(6, "lamp", 0, 1, 1, 1, false, true);
  addProp(6, "lamp", 10, 1, 1, 1, false, true);

  // --- Room 7: Gold Room Restroom (Blood-Red Lacquer & White Marble) ---
  addProp(7, "altar", 0, 0, 5, 1, true, true); // White porcelain pedestal basins & backlit mirrors
  addProp(7, "lamp", 0, 4, 1, 1, false, true);
  addProp(7, "lamp", 8, 4, 1, 1, false, true);

  // --- Room 8: Overlook Lobby ---
  addProp(8, "stock", 1, 0, 2, 1, true, false); // Brass Room-Key Rack (slot 237!)
  addProp(8, "frame", 4, 0, 1, 0, true, false); // July 4th 1921 Overlook Ball Photo
  addProp(8, "frame", 10, 0, 1, 0, true, false); // Alpine Rockies Lodge Poster
  addProp(8, "stock", 12, 0, 2, 1, true, false); // Lobby mahogany cabinet
  addProp(8, "window", 14, 0, 1, 0, true, true);
  addProp(8, "shopcounter", 1, 2, 4, 1, false, false); // Brass Reception Desk
  addProp(8, "armchair", 10, 1, 1, 1, false, false);
  addProp(8, "display", 11, 3, 2, 1, false, false); // Brass Luggage Trolley
  addProp(8, "display", 14, 3, 1, 1, false, false); // Potted Alpine Palm
  addProp(8, "lamp", 5, 4, 1, 1, false, true);
  addProp(8, "lamp", 10, 4, 1, 1, false, true);

  return {
    plan: { w, d, mask, cells, rooms, entrance: [23, 50], doorways },
    props,
    rooms: placed,
    doorways,
  };
}
