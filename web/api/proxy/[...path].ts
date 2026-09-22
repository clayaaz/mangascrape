/**
 * Vercel Edge Function that proxies mangakatana HTML pages and chapter images.
 *
 * It lives in `api/proxy/[...path].ts` (a catch-all) because a plain
 * `api/proxy.ts` only serves the exact `/api/proxy` path — Vercel does not
 * route `/api/proxy/site/page/2` to it, which is what the rewrites in
 * vercel.json produce:
 *   /mangakatana/*       -> /api/proxy/site/*      https://mangakatana.com/*
 *   /mk-img/:sub/:path*  -> /api/proxy/img/:sub/*  https://:sub.mangakatana.com/*
 *
 * Why this exists:
 *  - Plain external rewrites hand upstream redirects straight to the browser.
 *    A fetch() that follows a 30x to mangakatana.com / i*.mangakatana.com is
 *    cross-origin, and upstream sends no CORS headers -> CORS error.
 *    Here every redirect is followed server-side instead, and every response
 *    is sent back with `Access-Control-Allow-Origin: *`.
 *  - The image route fixes `Content-Type` (upstream serves
 *    `application/octet-stream` for chapter pages) and adds caching headers.
 */

export const config = { runtime: "edge" };

const SITE_PREFIX = "/api/proxy/site";
const IMG_PREFIX = "/api/proxy/img";
/** The same paths the browser uses (in case a rewrite passes them through). */
const SITE_PUBLIC = "/mangakatana";
const IMG_PUBLIC = "/mk-img";

/** This proxy may only reach mangakatana.com and its subdomains. */
const ALLOWED_HOST_RE = /^(?:[a-z0-9-]+\.)*mangakatana\.com$/i;
const CDN_LABEL_RE = /^[a-z0-9-]+$/i;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Accept-Language, Range, User-Agent",
  "Access-Control-Expose-Headers":
    "Content-Length, Content-Range, Content-Type, ETag, Last-Modified, Cache-Control",
};

/** Pages are scraped, so keep the CDN/browser cache short. */
const PAGE_CACHE_CONTROL = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
/** Chapter images are immutable token URLs — cache them hard. */
const IMAGE_CACHE_CONTROL = "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400";

const IMAGE_TYPE_BY_EXT: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

type Route = { url: URL; kind: "site" | "img" };

/** Split an incoming path into an upstream origin + path, or null. */
function splitPath(pathname: string): Route | null {
  let origin: string;
  let rest: string;
  let kind: Route["kind"];

  if (pathname === SITE_PREFIX || pathname.startsWith(`${SITE_PREFIX}/`)) {
    kind = "site";
    origin = "https://mangakatana.com";
    rest = pathname.slice(SITE_PREFIX.length);
  } else if (pathname === IMG_PREFIX || pathname.startsWith(`${IMG_PREFIX}/`)) {
    const [, sub = "", ...segments] = pathname.slice(IMG_PREFIX.length).split("/");
    if (!CDN_LABEL_RE.test(sub)) return null;
    kind = "img";
    origin = `https://${sub}.mangakatana.com`;
    rest = `/${segments.join("/")}`;
  } else if (pathname === SITE_PUBLIC || pathname.startsWith(`${SITE_PUBLIC}/`)) {
    kind = "site";
    origin = "https://mangakatana.com";
    rest = pathname.slice(SITE_PUBLIC.length);
  } else if (pathname.startsWith(`${IMG_PUBLIC}/`)) {
    const [, sub = "", ...segments] = pathname.slice(IMG_PUBLIC.length).split("/");
    if (!CDN_LABEL_RE.test(sub)) return null;
    kind = "img";
    origin = `https://${sub}.mangakatana.com`;
    rest = `/${segments.join("/")}`;
  } else {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rest || "/", origin);
  } catch {
    return null;
  }
  if (!ALLOWED_HOST_RE.test(url.hostname)) return null;
  return { url, kind };
}

/**
 * Map the incoming function path to the upstream URL.
 * Accepts both the rewritten path (`/api/proxy/site/...`) and the original
 * browser path (`/mangakatana/...`, `/mk-img/...`).
 * Returns null when the path isn't one of the two proxy routes (or escapes
 * the allowed hosts, e.g. via a protocol-relative `//host` path).
 */
function resolveRoute(incoming: URL): Route | null {
  const route = splitPath(incoming.pathname);
  if (!route) return null;
  // Vercel rewrites keep the original query string (?search=…&page=…).
  route.url.search = incoming.search;
  return route;
}

/** Upstream serves chapter images as `application/octet-stream` — fix that. */
function imageContentType(pathname: string, declared: string | null): string {
  const bare = (declared ?? "").split(";")[0].trim().toLowerCase();
  const generic = !bare || bare === "application/octet-stream" || bare === "binary/octet-stream";
  if (!generic && declared) return declared;

  const dot = pathname.lastIndexOf(".");
  const ext = dot >= 0 ? pathname.slice(dot + 1).toLowerCase() : "";
  return IMAGE_TYPE_BY_EXT[ext] ?? declared ?? "application/octet-stream";
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return errorResponse(405, "Method not allowed");
  }

  const route = resolveRoute(new URL(request.url));
  if (!route) return errorResponse(404, "Not a proxied path");

  const upstreamHeaders = new Headers({
    "User-Agent": USER_AGENT,
    "Accept-Language": request.headers.get("accept-language") ?? "en-US,en;q=0.9",
    Referer: "https://mangakatana.com/",
    Accept:
      route.kind === "img"
        ? "image/*,*/*;q=0.8"
        : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  });
  if (route.kind === "img") {
    const range = request.headers.get("range");
    if (range) upstreamHeaders.set("Range", range);
  }

  let upstream: Response;
  try {
    // Follow redirects here so the browser never sees a cross-origin 30x.
    upstream = await fetch(route.url, { headers: upstreamHeaders, redirect: "follow" });
  } catch {
    return errorResponse(502, `Could not reach ${route.url.host}`);
  }

  const headers = new Headers(CORS_HEADERS);

  const declared = upstream.headers.get("content-type");
  const contentType =
    route.kind === "img" ? imageContentType(route.url.pathname, declared) : declared;
  if (contentType) headers.set("Content-Type", contentType);

  // Copy validators/range info only — never content-encoding/content-length,
  // the fetch body is already decoded.
  for (const name of ["etag", "last-modified", "accept-ranges", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set(
    "Cache-Control",
    upstream.ok
      ? route.kind === "img"
        ? IMAGE_CACHE_CONTROL
        : PAGE_CACHE_CONTROL
      : "no-store",
  );

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
