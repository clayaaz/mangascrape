import { useState } from "react";
import { proxyUrl } from "../lib/proxy";

/**
 * Chapter page image — same data as mobile BlobImage, but uses <img src>
 * through the dev proxy (mobile fetches to blob because of RN image/CDN quirks).
 */
export function ChapterImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const src = url.startsWith("blob:") ? url : proxyUrl(url);

  if (failed) {
    return (
      <p className="py-6 text-center text-sm text-red-400">
        Failed to load page image
      </p>
    );
  }

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      loading="lazy"
      className="mx-auto block w-full max-w-3xl"
      onError={() => setFailed(true)}
    />
  );
}
