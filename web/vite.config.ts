import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";
import { defineConfig } from "vite";

/** Image CDN hosts used for chapter pages (i1, i2, …). */
const MK_CDN_SUBDOMAINS = ["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8", "i9"];

function mkCdnProxies(): Record<string, ProxyOptions> {
  const proxies: Record<string, ProxyOptions> = {};
  for (const sub of MK_CDN_SUBDOMAINS) {
    const prefix = `/mk-img/${sub}`;
    proxies[prefix] = {
      target: `https://${sub}.mangakatana.com`,
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix.replace("/", "\\/")}`), ""),
    };
  }
  return proxies;
}

const siteProxy: Record<string, ProxyOptions> = {
  "/mangakatana": {
    target: "https://mangakatana.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/mangakatana/, ""),
  },
  ...mkCdnProxies(),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: siteProxy },
  preview: { proxy: siteProxy },
});
