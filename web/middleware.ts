/**
 * Vercel Routing Middleware (edge runtime) — the primary mangakatana proxy.
 *
 * It runs before routing for the two proxy prefixes and serves the response
 * itself, so it doesn't depend on function-path routing (see `mkProxy.ts` for
 * why the Edge Function alone could not serve paths deeper than one segment).
 *
 * Any path that isn't a proxy route gets `undefined` back and falls through
 * to normal routing untouched.
 */
import { proxyResponse } from "./mkProxy.ts";

export const config = {
  matcher: ["/mangakatana/:path*", "/mk-img/:sub/:path*"],
  runtime: "edge",
};

export default proxyResponse;
