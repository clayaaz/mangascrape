/** Headers for HTML page fetches through the proxy (not needed for <img src>). */
export const HTML_FETCH_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

const MK_CDN_RE = /^https?:\/\/([a-z0-9]+\.mangakatana\.com)(\/.*)?$/i;

/** Ensure mangakatana paths/URLs are absolute before scraping. */
export function absoluteMkUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://mangakatana.com${url}`;
  return `https://mangakatana.com/${url}`;
}

/**
 * Rewrite mangakatana URLs to same-origin paths.
 * Locally the vite dev server proxies them (`vite.config.ts`); in production the
 * same paths are served by the Vercel edge function in `api/proxy.ts`, which
 * also adds CORS + cache headers.
 * Use as <img src> — avoids CORS and fetch preflight issues.
 */
export function proxyUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/mangakatana") || url.startsWith("/mk-img")) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const absolute = absoluteMkUrl(url);

  const cdn = MK_CDN_RE.exec(absolute);
  if (cdn) {
    const subdomain = cdn[1].split(".")[0];
    const path = cdn[2] ?? "/";
    return `/mk-img/${subdomain}${path}`;
  }

  if (absolute.startsWith("https://mangakatana.com"))
    return absolute.replace("https://mangakatana.com", "/mangakatana");
  if (absolute.startsWith("http://mangakatana.com"))
    return absolute.replace("http://mangakatana.com", "/mangakatana");

  return url;
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(proxyUrl(absoluteMkUrl(url)), {
    headers: HTML_FETCH_HEADERS,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Binary download (offline saves) — same-origin, no extra headers. */
export async function fetchProxiedBlob(url: string): Promise<Blob> {
  const res = await fetch(proxyUrl(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}
