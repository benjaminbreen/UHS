export function boxBlur(src: Float32Array, TW: number, TH: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < TH; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * TW + Math.max(0, Math.min(TW - 1, x))];
    for (let x = 0; x < TW; x++) {
      tmp[y * TW + x] = sum / (2 * r + 1);
      sum += src[y * TW + Math.min(TW - 1, x + r + 1)] - src[y * TW + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < TW; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, Math.min(TH - 1, y)) * TW + x];
    for (let y = 0; y < TH; y++) {
      out[y * TW + x] = sum / (2 * r + 1);
      sum += tmp[Math.min(TH - 1, y + r + 1) * TW + x] - tmp[Math.max(0, y - r) * TW + x];
    }
  }
  return out;
}
