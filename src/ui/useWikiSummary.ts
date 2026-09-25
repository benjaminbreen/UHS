import { useEffect, useState } from "react";

export interface WikiPage {
  extract: string;
  url: string;
  thumb?: string;
  image?: string;
}

/** Kept for the session: the same stance is opened repeatedly while a player
 * clicks along the row, and the article does not change while they do. */
const cache = new Map<string, WikiPage | null>();

/**
 * The lead of the article, with its lead image. Wikipedia's REST summary
 * endpoint allows cross-origin reads, so this needs no proxy; a failure is
 * silent, because the authored text beside it already says the necessary thing.
 */
export function useWikiPage(title: string | undefined) {
  const [page, setPage] = useState<WikiPage | null>(
    title ? (cache.get(title) ?? null) : null,
  );
  useEffect(() => {
    if (!title) return setPage(null);
    const cached = cache.get(title);
    if (cached !== undefined) return setPage(cached);
    setPage(null);
    let live = true;
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    )
      .then((r) => (r.ok ? r.json() : undefined))
      .then((body) => {
        const found: WikiPage | null =
          body?.extract && body.type !== "disambiguation"
            ? {
                extract: body.extract,
                url: body.content_urls?.desktop?.page,
                thumb: body.thumbnail?.source,
                image: body.originalimage?.source,
              }
            : null;
        cache.set(title, found);
        if (live) setPage(found);
      })
      .catch(() => cache.set(title, null));
    return () => {
      live = false;
    };
  }, [title]);
  return page;
}

export function useWikiSummary(wiki: string | undefined) {
  return useWikiPage(wiki?.split("/wiki/")[1])?.extract ?? null;
}
