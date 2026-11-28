import { existsSync, readFileSync } from "node:fs";
import { parseScenarioUrl } from "../src/content/geography/url";
import { placeLabel } from "../src/content/geography/region-label";
import { formatHistoricalYear } from "../src/core/calendar";
import { arrivalBackdrop } from "../src/ui/arrival-data";

declare const __UHS_INDEX_HTML__: string | undefined;

const LEGACY_MODES = new Set([
  "exploration",
  "survival",
  "commerce",
  "diplomacy",
  "scholarship",
  "livelihood",
  "story",
  "sandbox",
  "historical",
  "freeplay",
]);

const DEFAULT_ORIGIN = "https://historysimulator.vercel.app";

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function baseTemplate() {
  if (typeof __UHS_INDEX_HTML__ === "string" && __UHS_INDEX_HTML__)
    return __UHS_INDEX_HTML__;
  if (existsSync("dist/index.html")) return readFileSync("dist/index.html", "utf8");
  return readFileSync("index.html", "utf8");
}

export function renderScenarioHtml(
  template: string,
  pathname: string,
  search = "",
  origin = DEFAULT_ORIGIN,
): string {
  const parsed = parseScenarioUrl(pathname, search, "og-preview");
  if (!parsed?.setting) return template;
  const setting = parsed.setting;
  const parts = pathname.split("/").filter(Boolean);
  const third = parts[2] ? decodeURIComponent(parts[2]).trim().toLowerCase() : "";
  const explicitRole =
    !!new URLSearchParams(search).get("role")?.trim() ||
    (!!third && !LEGACY_MODES.has(third));
  const yearText = formatHistoricalYear(setting.year);
  const placeText = placeLabel(setting);
  const headline = explicitRole
    ? `${setting.role} in ${placeText}, ${yearText}`
    : `${placeText}, ${yearText}`;
  const title = `${headline} — Universal History Simulator`;
  const description = explicitRole
    ? `Step into ${placeText} in ${yearText} as a ${setting.role.toLowerCase()}. A procedural history simulator with persistent people, places, and consequences.`
    : `Step into ${placeText} in ${yearText}. A procedural history simulator with persistent people, places, and consequences.`;
  const imageUrl = `${origin}${arrivalBackdrop(setting)}`;
  const canonicalUrl = `${origin}${pathname}`;

  const ogTags = [
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="Universal History Simulator"/>`,
    `<meta property="og:title" content="${escapeHtml(title)}"/>`,
    `<meta property="og:description" content="${escapeHtml(description)}"/>`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}"/>`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${escapeHtml(title)}"/>`,
    `<meta name="twitter:description" content="${escapeHtml(description)}"/>`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"/>`,
  ].join("");

  return template
    .replace(/<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*\/?>/gi, "")
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}"/>`,
    )
    .replace(/<\/head>/i, `${ogTags}</head>`);
}

export async function og(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const year = url.searchParams.get("_year") ?? url.searchParams.get("year");
  const place = url.searchParams.get("_place") ?? url.searchParams.get("place");
  const role = url.searchParams.get("_role");
  const forward = new URLSearchParams(url.searchParams);
  forward.delete("_year");
  forward.delete("_place");
  forward.delete("_role");

  const placeSeg = place
    ? place.startsWith("@")
      ? place
      : encodeURIComponent(place)
    : "";
  const pathname =
    year && placeSeg
      ? `/${encodeURIComponent(year)}/${placeSeg}${role ? `/${encodeURIComponent(role)}` : ""}`
      : "/";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin =
    host && !host.startsWith("localhost") ? `${proto}://${host}` : DEFAULT_ORIGIN;

  const html = renderScenarioHtml(
    baseTemplate(),
    pathname,
    forward.toString(),
    origin,
  );
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
