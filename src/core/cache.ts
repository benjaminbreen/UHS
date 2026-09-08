/** Evict a small oldest batch from a derived cache. Retain most warm entries,
 * and amortize Map iterator startup rather than scanning tombstones per insert. */
export function trimCache<K, V>(cache: Map<K, V>, capacity: number) {
  if (cache.size < capacity) return;
  const remove = Math.max(1, Math.ceil(capacity / 8));
  let removed = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (++removed >= remove) break;
  }
}
