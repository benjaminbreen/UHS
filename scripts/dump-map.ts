import { createSession } from "../src/runtime/session";
const pack = process.argv[2] ?? "roman",
  e = createSession(pack),
  w = e.world;
const startX = -64,
  startY = -64,
  width = 128,
  height = 128;
const tiles = Array.from({ length: height }, (_, y) =>
  Array.from({ length: width }, (_, x) => w.terrain(startX + x, startY + y)),
);
const sprites: { name: string; x: number; y: number; depth: number }[] = [];
for (let y = startY; y < startY + height; y++)
  for (let x = startX; x < startX + width; x++) {
    const d = w.decoration(x, y);
    if (d)
      sprites.push({
        name: d.sprite,
        x: x * 16 + 8,
        y: y * 16 + 16,
        depth: y * 16 + 12,
      });
  }
for (const p of w.places)
  sprites.push({
    name: p.sprite,
    x: (p.x + p.w / 2) * 16,
    y: (p.y + p.h) * 16 + 3,
    depth: (p.y + p.h) * 16 - 2,
  });
for (const o of e.state.objects.filter((o) => o.pos.space === "outside"))
  sprites.push({
    name: o.sprite,
    x: o.pos.x * 16 + 8,
    y: o.pos.y * 16 + 16,
    depth: o.pos.y * 16 + 10,
  });
for (const a of [e.state.player, ...e.state.actors])
  sprites.push({
    name: a.kind === "human" ? `${a.sprite}-${a.direction}-0` : `${a.sprite}0`,
    x: a.pos.x * 16 + 8,
    y: a.pos.y * 16 + 16,
    depth: a.pos.y * 16 + 14,
  });
process.stdout.write(
  JSON.stringify({
    pack,
    seed: e.state.manifest.seed,
    startX,
    startY,
    width,
    height,
    tiles,
    sprites: sprites.sort((a, b) => a.depth - b.depth),
  }),
);
