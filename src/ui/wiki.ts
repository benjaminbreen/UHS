export type WikiSummary = {
  title: string;
  extract: string;
  image?: string;
  url: string;
};

const cache = new Map<string, Promise<WikiSummary | undefined>>();

/** A Wikipedia article's lead, through the REST summary endpoint, which
 * allows cross-origin reads. Undefined when the article or the network is
 * missing; callers show what they have. */
export function wikiSummary(title: string) {
  let hit = cache.get(title);
  if (!hit) {
    hit = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`)
      .then((r) => (r.ok ? r.json() : undefined))
      .then((d) =>
        d && d.type !== "disambiguation" && d.extract
          ? {
              title: d.title as string,
              extract: d.extract as string,
              image: (d.thumbnail?.source ?? d.originalimage?.source) as string | undefined,
              url: (d.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`) as string,
            }
          : undefined,
      )
      .catch(() => undefined);
    cache.set(title, hit);
  }
  return hit;
}
