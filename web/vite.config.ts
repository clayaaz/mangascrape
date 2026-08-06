import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";
import { defineConfig } from "vite";

/** Image CDN hosts used for chapter pages (i1, i2, …). */
const MK_CDN_SUBDOMAINS = ["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9"];

const MK_CDN_RE = /^https?:\/\/([a-z0-9]+)\.mangakatana\.com(\/.*)?$/i;

/** Keep redirect targets on the dev-server proxy instead of mangakatana.com. */
function rewriteMkLocation(location: string): string {
  const cdn = MK_CDN_RE.exec(location);
  if (cdn) return `/mk-img/${cdn[1]}${cdn[2] ?? "/"}`;

  if (location.startsWith("https://mangakatana.com"))
    return location.replace("https://mangakatana.com", "/mangakatana");
  if (location.startsWith("http://mangakatana.com"))
    return location.replace("http://mangakatana.com", "/mangakatana");
  if (
    location.startsWith("/") &&
    !location.startsWith("/mangakatana") &&
    !location.startsWith("/mk-img")
  )
    return `/mangakatana${location}`;

  return location;
}

function withProxyRedirectRewrite(options: ProxyOptions): ProxyOptions {
  const userConfigure = options.configure;
  return {
    ...options,
    configure: (proxy, opts) => {
      userConfigure?.(proxy, opts);
      proxy.on("proxyRes", (proxyRes) => {
        const code = proxyRes.statusCode ?? 0;
        const location = proxyRes.headers.location;
        if (code >= 300 && code < 400 && location) {
          proxyRes.headers.location = rewriteMkLocation(location);
        }
      });
    },
  };
}

function mkCdnProxies(): Record<string, ProxyOptions> {
  const proxies: Record<string, ProxyOptions> = {};
  for (const sub of MK_CDN_SUBDOMAINS) {
    const prefix = `/mk-img/${sub}`;
    proxies[prefix] = withProxyRedirectRewrite({
      target: `https://${sub}.mangakatana.com`,
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix.replace("/", "\\/")}`), ""),
    });
  }
  return proxies;
}

const siteProxy: Record<string, ProxyOptions> = {
  "/mangakatana": withProxyRedirectRewrite({
    target: "https://mangakatana.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/mangakatana/, ""),
  }),
  ...mkCdnProxies(),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: siteProxy },
  preview: { proxy: siteProxy },
});
