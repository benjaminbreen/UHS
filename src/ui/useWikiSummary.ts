import { useEffect, useState } from "react";

/** Kept for the session: the same stance is opened repeatedly while a player
 * clicks along the row, and the article does not change while they do. */
const cache = new Map<string, string | null>();

/**
 * The opening paragraph of the linked article. Wikipedia's REST summary
 * endpoint allows cross-origin reads, so this needs no proxy; a failure is
 * silent, because the authored note below it already says the necessary thing.
 */
export function useWikiSummary(wiki: string | undefined) {
  const title = wiki?.split("/wiki/")[1];
  const [text, setText] = useState<string | null>(
    title ? (cache.get(title) ?? null) : null,
  );
  useEffect(() => {
    if (!title) return setText(null);
    const cached = cache.get(title);
    if (cached !== undefined) return setText(cached);
    let live = true;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then((r) => (r.ok ? r.json() : undefined))
      .then((body) => {
        const extract: string | null = body?.extract ?? null;
        cache.set(title, extract);
        if (live) setText(extract);
      })
      .catch(() => cache.set(title, null));
    return () => {
      live = false;
    };
  }, [title]);
  return text;
}
