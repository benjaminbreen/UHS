import { readFileSync, writeFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(
    new URL("../src/content/geography/atlas.generated.json", import.meta.url),
    "utf8",
  ),
);
// Half-degree buckets, each edge filed only in the cells it crosses; the
// runtime reads the 3x3 neighbourhood. Must match src/world/geography/atlas.ts.
const BUCKET = 0.5;
const width = 1440,
  height = 720,
  mask = new Uint8Array(width * height);
for (const ring of data.land) {
  const minY = Math.max(
    0,
    Math.floor((90 - Math.max(...ring.map((p) => p[1]))) * 4),
  );
  const maxY = Math.min(
    height - 1,
    Math.ceil((90 - Math.min(...ring.map((p) => p[1]))) * 4),
  );
  for (let row = minY; row <= maxY; row++) {
    const lat = 90 - (row + 0.5) / 4,
      hits = [];
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i];
      if (a[1] > lat !== b[1] > lat)
        hits.push(a[0] + ((lat - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2)
      mask.fill(
        1,
        row * width + Math.max(0, Math.ceil((hits[i] + 180) * 4 - 0.5)),
        row * width + Math.min(width, Math.ceil((hits[i + 1] + 180) * 4 - 0.5)),
      );
  }
}
const runs = [];
for (let i = 0; i < mask.length; i++) {
  if (!mask[i]) continue;
  const start = i;
  while (i < mask.length && mask[i]) i++;
  runs.push([start, i]);
}
function buckets(paths) {
  const result = new Map();
  let id = 0;
  for (const points of paths)
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      if (Math.abs(a[0] - b[0]) > 180) continue;
      for (
        let y = Math.floor(Math.min(a[1], b[1]) / BUCKET);
        y <= Math.floor(Math.max(a[1], b[1]) / BUCKET);
        y++
      )
        for (
          let x = Math.floor(Math.min(a[0], b[0]) / BUCKET);
          x <= Math.floor(Math.max(a[0], b[0]) / BUCKET);
          x++
        ) {
          const key = `${x},${y}`,
            list = result.get(key) ?? [];
          list.push(id);
          result.set(key, list);
        }
      id++;
    }
  return [...result].map(([key, ids]) => {
    const runs = [];
    for (let i = 0; i < ids.length; i++) {
      const start = ids[i];
      while (i + 1 < ids.length && ids[i + 1] === ids[i] + 1) i++;
      runs.push(start, ids[i] + 1);
    }
    return [key, runs];
  });
}
writeFileSync(
  new URL(
    "../src/content/geography/atlas-index.generated.json",
    import.meta.url,
  ),
  JSON.stringify({
    width,
    height,
    runs,
    bucket: BUCKET,
    land: buckets(data.land),
    rivers: buckets(data.rivers.map((r) => r.points)),
  }),
);
