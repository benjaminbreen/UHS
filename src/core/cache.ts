/** Evict a small oldest batch from a derived cache. Retain most warm entries,
 * and amortize Map iterator startup rather than scanning tombstones per insert. */
let scale = 1;
/** A phone keeps a quarter of each large cache. They only save recomputing
 * cells, and full they are tens of megabytes on each thread that has a world. */
export function shrinkCaches() {
  scale = 0.25;
}
export function trimCache<K, V>(cache: Map<K, V>, capacity: number) {
  if (capacity >= 16384) capacity *= scale;
  if (cache.size < capacity) return;
  const remove = Math.max(1, Math.ceil(capacity / 8));
  let removed = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (++removed >= remove) break;
  }
}
