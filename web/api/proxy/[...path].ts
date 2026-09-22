/**
 * Vercel Edge Function fallback for the proxy rewrites in vercel.json.
 *
 * Primary handling is `middleware.ts` (Routing Middleware), which matches the
 * full browser path. This function only receives rewritten paths
 * (`/api/proxy/site/*`, `/api/proxy/img/:sub/*`) and — because Vercel routes
 * `api/` files by path — can only be reached when the path matches its route,
 * which in practice means at most one segment after `/api/proxy/`.
 *
 * See `mkProxy.ts` for the actual proxying logic (CORS, redirect following,
 * image content-type fix, caching).
 */
import { errorResponse, proxyResponse } from "../../mkProxy.ts";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  return (await proxyResponse(request)) ?? errorResponse(404, "Not a proxied path");
}
