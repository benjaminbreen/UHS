/**
 * Wikipedia API Service
 * Fetches thumbnails and page info from Wikipedia for historical figures
 */

interface WikipediaPageInfo {
  title: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageUrl: string;
  extract?: string;
}

interface WikipediaApiResponse {
  query?: {
    pages?: Record<string, {
      pageid?: number;
      title: string;
      thumbnail?: {
        source: string;
        width: number;
        height: number;
      };
      extract?: string;
    }>;
  };
}

// Cache for Wikipedia data to avoid repeated API calls
const wikipediaCache = new Map<string, WikipediaPageInfo | null>();

/**
 * Fetch page info and thumbnail from Wikipedia
 * @param pageTitle - The Wikipedia page title (e.g., "Enheduanna")
 * @returns Page info including thumbnail URL and page link
 */
export async function getWikipediaPageInfo(pageTitle: string): Promise<WikipediaPageInfo | null> {
  // Check cache first
  if (wikipediaCache.has(pageTitle)) {
    return wikipediaCache.get(pageTitle) || null;
  }

  try {
    // Use Wikipedia API to get page info with thumbnail
    // pithumbsize=300 requests a thumbnail of ~300px width
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn(`[Wikipedia] Failed to fetch page for "${pageTitle}": ${response.status}`);
      wikipediaCache.set(pageTitle, null);
      return null;
    }

    const data = await response.json();

    const pageInfo: WikipediaPageInfo = {
      title: data.title || pageTitle,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
      extract: data.extract,
      thumbnail: data.thumbnail ? {
        source: data.thumbnail.source,
        width: data.thumbnail.width,
        height: data.thumbnail.height
      } : undefined
    };

    // Cache the result
    wikipediaCache.set(pageTitle, pageInfo);

    return pageInfo;
  } catch (error) {
    console.error(`[Wikipedia] Error fetching page info for "${pageTitle}":`, error);
    wikipediaCache.set(pageTitle, null);
    return null;
  }
}

/**
 * Batch fetch Wikipedia info for multiple figures
 * @param pageTitles - Array of Wikipedia page titles
 * @returns Map of title to page info
 */
export async function batchGetWikipediaInfo(pageTitles: string[]): Promise<Map<string, WikipediaPageInfo | null>> {
  const results = new Map<string, WikipediaPageInfo | null>();

  // Filter out already cached titles
  const uncachedTitles = pageTitles.filter(title => !wikipediaCache.has(title));

  // Add cached results
  for (const title of pageTitles) {
    if (wikipediaCache.has(title)) {
      results.set(title, wikipediaCache.get(title) || null);
    }
  }

  // Fetch uncached titles in parallel (with rate limiting)
  const BATCH_SIZE = 5; // Fetch 5 at a time to avoid overwhelming the API

  for (let i = 0; i < uncachedTitles.length; i += BATCH_SIZE) {
    const batch = uncachedTitles.slice(i, i + BATCH_SIZE);
    const promises = batch.map(title => getWikipediaPageInfo(title));
    const batchResults = await Promise.all(promises);

    batch.forEach((title, index) => {
      results.set(title, batchResults[index]);
    });

    // Small delay between batches to be nice to the API
    if (i + BATCH_SIZE < uncachedTitles.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get direct Wikipedia URL for a page title
 */
export function getWikipediaUrl(pageTitle: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
}

/**
 * Clear the Wikipedia cache (useful for testing)
 */
export function clearWikipediaCache(): void {
  wikipediaCache.clear();
}
