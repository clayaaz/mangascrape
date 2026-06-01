import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChapterImage } from "../components/ChapterImage";
import { getChapterBlobUrls } from "../lib/blobStore";
import { chapterStore } from "../lib/chapterStore";
import { getDownloadedChapter } from "../lib/downloadStore";
import { recordRead } from "../lib/historyStore";
import { scrapeChapterPages } from "../lib/scraper";

type ChapterState = {
  title: string;
  img: string;
  link: string;
  chapter: string;
  clink: string;
  chapterIndex: number;
};

function NavBar({
  currentIndex,
  totalChapters,
  onPrev,
  onNext,
}: {
  currentIndex: number;
  totalChapters: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isFirst = currentIndex === totalChapters - 1;
  const isLast = currentIndex === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-[rgba(14,13,22,0.95)] p-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrev}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-violet-500/25 bg-violet-500/10 py-2.5 text-[13px] font-bold uppercase tracking-wide text-violet-300 disabled:border-white/[0.06] disabled:bg-white/[0.03] disabled:text-[#3a3350]"
        >
          <span className="text-xl font-light">‹</span> Prev
        </button>
        <div className="h-7 w-px bg-violet-500/15" />
        <button
          type="button"
          disabled={isLast}
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-violet-500/25 bg-violet-500/10 py-2.5 text-[13px] font-bold uppercase tracking-wide text-violet-300 disabled:border-white/[0.06] disabled:bg-white/[0.03] disabled:text-[#3a3350]"
        >
          Next <span className="text-xl font-light">›</span>
        </button>
      </div>
    </div>
  );
}

export function ChapterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = location.state as ChapterState | null;

  const chapters = chapterStore.chapters;
  const currentIndex = params?.chapterIndex ?? 0;

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const blobUrlsRef = useRef<string[]>([]);

  const goToChapter = (index: number) => {
    if (!params || !chapters[index]) return;
    chapterStore.currentIndex = index;
    navigate("/chapter", {
      replace: true,
      state: {
        title: params.title,
        img: params.img,
        link: params.link,
        chapter: chapters[index].chapter,
        clink: chapters[index].clink,
        chapterIndex: index,
      },
    });
  };

  useEffect(() => {
    if (!params?.clink) {
      navigate("/", { replace: true });
      return;
    }

    setLoading(true);
    setPages([]);
    setLoadError(null);
    setIsOffline(false);

    recordRead({
      title: params.title,
      img: params.img,
      link: params.link,
      chapter: params.chapter,
      chapterIndex: currentIndex,
    });

    (async () => {
      try {
        const downloaded = await getDownloadedChapter(params.clink);
        if (downloaded) {
          const blobUrls = await getChapterBlobUrls(params.clink);
          if (blobUrls.length > 0) {
            blobUrlsRef.current = blobUrls;
            setIsOffline(true);
            setPages(blobUrls);
            return;
          }
        }
        const urls = await scrapeChapterPages(params.clink);
        if (!urls.length) {
          setLoadError("No pages found for this chapter.");
          return;
        }
        setPages(urls);
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : "Failed to load chapter",
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, [params?.clink, params?.title, params?.img, params?.link, params?.chapter, currentIndex, navigate]);

  if (!params) return null;

  return (
    <div className="min-h-full bg-[#08080C] pb-10">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-violet-500/10 bg-[#08080C]/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 text-violet-300"
        >
          ←
        </button>
        <h1 className="truncate text-sm font-bold text-violet-300">
          {params.chapter}
        </h1>
      </header>

      <div className="mx-4 mt-4">
        <NavBar
          currentIndex={currentIndex}
          totalChapters={chapters.length || 1}
          onPrev={() => goToChapter(currentIndex + 1)}
          onNext={() => goToChapter(currentIndex - 1)}
        />
      </div>

      <div className="mx-4 mt-4 mb-3.5 flex items-center justify-between">
        <span className="rounded-[10px] border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">
          {params.chapter}
        </span>
        <div className="flex items-center gap-2">
          {isOffline && (
            <span className="rounded-md border border-green-400/35 bg-green-400/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-green-400">
              ✓ OFFLINE
            </span>
          )}
          {!loading && (
            <span className="text-xs font-semibold text-[#4a4060]">
              {pages.length} pages
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          <p className="text-[13px] uppercase tracking-widest text-[#5a4e7a]">
            Loading pages...
          </p>
        </div>
      )}

      {loadError && !loading && (
        <p className="px-4 py-12 text-center text-sm text-red-400">{loadError}</p>
      )}

      {!loading &&
        pages.map((url, i) => (
        <div key={i} className="mb-0.5">
          <ChapterImage url={url} />
        </div>
      ))}

      {!loading && pages.length > 0 && (
        <div className="mx-4 mt-4 mb-2">
          <NavBar
            currentIndex={currentIndex}
            totalChapters={chapters.length || 1}
            onPrev={() => goToChapter(currentIndex + 1)}
            onNext={() => goToChapter(currentIndex - 1)}
          />
        </div>
      )}
    </div>
  );
}
