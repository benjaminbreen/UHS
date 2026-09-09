/** FNV-1a domain hashing; Mulberry32 mixing. All outcomes use explicit integer inputs. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** Folds one string's characters into a running FNV-1a state. */
function foldText(h: number, text: string): number {
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}
/** Folds an integer's decimal digits, most significant first, as `String(n)`
 * would have written them. Avoids allocating the string. */
function foldInteger(h: number, value: number): number {
  if (value < 0) {
    h ^= 45; // "-"
    h = Math.imul(h, 16777619);
    value = -value;
  }
  let scale = 1;
  while (value / scale >= 10) scale *= 10;
  do {
    h ^= 48 + (Math.floor(value / scale) % 10);
    h = Math.imul(h, 16777619);
    scale /= 10;
  } while (scale >= 1);
  return h;
}
/** Same bytes as hashing `[seed, ...keys].join("|")`, without building either
 * the array or the joined string. Generation calls this hundreds of thousands
 * of times per settlement, where those two allocations were the single largest
 * cost in world building; the digest, and so every world, is unchanged. */
export function random(seed: string, ...keys: (string | number)[]): number {
  return finish(foldKeys(foldText(2166136261, seed), keys));
}
/** Hash state after `seed` and `keys`, for callers that draw many values under
 * one fixed prefix. `randomFrom(prefix(seed, a), b)` equals `random(seed, a, b)`. */
export function prefix(seed: string, ...keys: (string | number)[]): number {
  return foldKeys(foldText(2166136261, seed), keys);
}
export function randomFrom(
  state: number,
  ...keys: (string | number)[]
): number {
  return finish(foldKeys(state, keys));
}
function foldKeys(h: number, keys: (string | number)[]): number {
  for (let i = 0; i < keys.length; i++) {
    h ^= 124; // "|"
    h = Math.imul(h, 16777619);
    const key = keys[i];
    // The integer path only inside the range the digit buffer and the truncation
    // in it are exact for. Everything else goes through the string, which is
    // slower but always right.
    h =
      typeof key === "number" &&
      key >= -2147483648 &&
      key <= 2147483647 &&
      Number.isInteger(key)
        ? foldInteger(h, key)
        : foldText(h, String(key));
  }
  return h;
}
function finish(h: number): number {
  let t = (h >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (k) =>
            JSON.stringify(k) +
            ":" +
            canonical((value as Record<string, unknown>)[k]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function stateHash(value: unknown): string {
  return hash(canonical(value)).toString(16).padStart(8, "0");
}
