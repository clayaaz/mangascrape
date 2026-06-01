import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DownloadButton } from "../components/DownloadButton";
import { chapterStore } from "../lib/chapterStore";
import {
  proxiedImageSrc,
  scrapeMangaDetail,
  type Book,
  type Chapter,
  type MangaListItem,
} from "../lib/scraper";

type MangaState = { manga: MangaListItem };

export function MangaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as MangaState | null;
  const manga = state?.manga;

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newLinks, setNewLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!manga?.link) {
      navigate("/", { replace: true });
      return;
    }
    scrapeMangaDetail(manga.link).then((result) => {
      setBook(result.book);
      setChapters(result.chapters);
      setNewLinks(result.newChapterLinks);
    });
  }, [manga?.link, navigate]);

  if (!manga) return null;

  const title = book?.title ?? manga.title;
  const img = book?.img ?? manga.img;

  return (
    <div className="min-h-full pb-10">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-violet-500/10 bg-[#08080C]/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-violet-300 hover:text-violet-200"
        >
          ← Back
        </button>
      </header>

      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        {img && (
          <img
            src={proxiedImageSrc(img)}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080C]/35 via-[#08080C]/70 to-[#08080C]" />
        <div className="relative flex h-full items-end gap-4 px-5 pb-6">
          <img
            src={proxiedImageSrc(img)}
            alt=""
            className="h-[185px] w-[130px] shrink-0 rounded-xl border border-violet-500/25 object-cover shadow-[0_8px_40px_rgba(167,139,250,0.35)]"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="text-lg font-extrabold leading-6 text-[#f0ebff]">
              {title}
            </h1>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {book?.genres?.map((g, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-violet-500/30 bg-violet-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis */}
      <div className="mx-4 mt-5 rounded-2xl border border-violet-500/10 bg-white/[0.04] p-4">
        <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#5a4e7a]">
          Synopsis
        </p>
        <p className="text-[13px] leading-5 text-[#9585b8]">{book?.summary}</p>
      </div>

      {/* Chapters */}
      <div className="mx-4 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#5a4e7a]">
            Chapters
          </p>
          <span className="text-xs font-semibold text-[#4a4060]">
            {chapters.length} total
          </span>
        </div>

        <div className="overflow-hidden rounded-t-[14px] border border-violet-500/10">
          {chapters.map((chapter, i) => {
            const isNew = newLinks.has(chapter.clink);
            return (
              <Link
                key={chapter.clink}
                to="/chapter"
                state={{
                  title,
                  img,
                  link: manga.link,
                  chapter: chapter.chapter,
                  clink: chapter.clink,
                  chapterIndex: i,
                }}
                onClick={() => {
                  chapterStore.chapters = chapters;
                  chapterStore.currentIndex = i;
                }}
                className={`flex items-center gap-3 border-b border-violet-500/10 px-4 py-3 transition hover:bg-violet-500/10 ${
                  isNew ? "bg-green-400/5" : "bg-white/[0.03]"
                }`}
              >
                <div className="relative">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                      isNew
                        ? "bg-green-400/15 text-green-400"
                        : "bg-violet-500/10 text-[#7c6aaa]"
                    }`}
                  >
                    {chapters.length - i}
                  </span>
                  {isNew && (
                    <span className="absolute -bottom-1 -right-2 rounded border border-green-400 bg-green-900 px-1 py-px text-[7px] font-black text-green-400">
                      NEW
                    </span>
                  )}
                </div>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isNew
                      ? "font-semibold text-green-50"
                      : "font-medium text-[#c9bfe8]"
                  }`}
                >
                  {chapter.chapter}
                </span>
                <DownloadButton
                  chapter={chapter}
                  mangaLink={manga.link}
                  mangaTitle={title}
                  mangaImg={img}
                />
                <span className="text-xl font-light text-[#4a4060]">›</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
