/** Integer world-coordinate hash in [0, 1): no per-frame random draws or chunk-local seeds. */
export function cellHash(x: number, y: number, salt = 0) {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(salt, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
/** Smooth world-anchored value noise; sampling never depends on chunk boundaries. */
export function valueNoise(x: number, y: number, scale: number, salt: number) {
  const ix = Math.floor(x / scale),
    iy = Math.floor(y / scale);
  const sx = x / scale - ix,
    sy = y / scale - iy;
  const fx = sx * sx * (3 - 2 * sx),
    fy = sy * sy * (3 - 2 * sy);
  return (
    (cellHash(ix, iy, salt) * (1 - fx) + cellHash(ix + 1, iy, salt) * fx) *
      (1 - fy) +
    (cellHash(ix, iy + 1, salt) * (1 - fx) +
      cellHash(ix + 1, iy + 1, salt) * fx) *
      fy
  );
}
