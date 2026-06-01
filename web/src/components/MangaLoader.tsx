import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPageUrl,
  scrapeMangaList,
  type MangaListItem,
} from "../lib/scraper";
import { MangaCard } from "./MangaCard";

export function MangaLoader({
  url,
  onLoadComplete,
}: {
  url: string;
  onLoadComplete: () => void;
}) {
  const [mangas, setMangas] = useState<MangaListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = useRef(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!hasMore.current) return;
      setLoadingMore(true);
      try {
        const result = await scrapeMangaList(getPageUrl(url, pageNum));
        hasMore.current = result.hasMore;
        setMangas((prev) =>
          pageNum === 1 ? result.mangas : [...prev, ...result.mangas],
        );
      } finally {
        setLoadingMore(false);
        if (pageNum === 1) onLoadComplete();
      }
    },
    [url, onLoadComplete],
  );

  useEffect(() => {
    hasMore.current = true;
    setMangas([]);
    setPage(1);
    loadPage(1);
  }, [url, loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingMore || !hasMore.current)
          return;
        const next = page + 1;
        setPage(next);
        loadPage(next);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loadingMore, loadPage]);

  return (
    <div className="pb-8">
      {mangas.map((m, i) => (
        <MangaCard key={`${m.link}-${i}`} manga={m} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
