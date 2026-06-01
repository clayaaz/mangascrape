import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandTitle } from "../components/BrandTitle";
import {
  deleteAllForManga,
  deleteChapter,
  groupByManga,
  loadDownloadIndex,
  type DownloadedChapter,
  type MangaDownloadGroup,
} from "../lib/downloadStore";
import { chapterStore } from "../lib/chapterStore";
import { proxiedImageSrc } from "../lib/scraper";
import { formatBytes, timeAgo } from "../lib/utils";

export function DownloadsPage() {
  const [groups, setGroups] = useState<MangaDownloadGroup[]>([]);

  const reload = useCallback(async () => {
    const index = await loadDownloadIndex();
    setGroups(groupByManga(index));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const totalChapters = groups.reduce((s, g) => s + g.chapters.length, 0);
  const totalPages = groups.reduce((s, g) => s + g.totalPages, 0);

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <BrandTitle accent="D" rest="OWNLOADS" />
        {totalChapters > 0 && (
          <span className="text-[11px] font-semibold text-[#4a4060]">
            {totalChapters} chapters · {formatBytes(totalPages)}
          </span>
        )}
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#5a4e7a]">
          Saved for offline
        </span>
        <span className="text-xs font-semibold text-[#4a4060]">
          {groups.length} titles
        </span>
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-8 pt-20 text-center">
          <span className="text-5xl">⬇</span>
          <h2 className="text-lg font-bold text-[#c9bfe8]">No downloads yet</h2>
          <p className="text-[13px] leading-5 text-[#4a4060]">
            Tap the download button on any chapter to save it for offline
            reading.
          </p>
        </div>
      )}

      {groups.map((group) => (
        <MangaGroupCard key={group.mangaLink} group={group} onChanged={reload} />
      ))}
    </div>
  );
}

function MangaGroupCard({
  group,
  onChanged,
}: {
  group: MangaDownloadGroup;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [chapters, setChapters] = useState(group.chapters);

  const handleDeleteAll = () => {
    if (
      confirm(
        `Remove all ${chapters.length} downloaded chapters of "${group.mangaTitle}"?`,
      )
    ) {
      deleteAllForManga(group.mangaLink).then(onChanged);
    }
  };

  const handleChapterDeleted = async () => {
    const index = await loadDownloadIndex();
    const remaining = index.filter((c) => c.mangaLink === group.mangaLink);
    if (remaining.length === 0) onChanged();
    else setChapters(remaining);
  };

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-violet-500/10 bg-white/[0.04]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="relative flex w-full items-center text-left"
      >
        <div className="absolute left-5 right-5 top-0 h-px bg-white/[0.06]" />
        <img
          src={proxiedImageSrc(group.mangaImg)}
          alt=""
          className="h-[116px] w-20 shrink-0 object-cover"
        />
        <div className="flex flex-1 flex-col gap-1.5 p-3.5">
          <h3 className="line-clamp-2 text-sm font-bold text-[#e8e0ff]">
            {group.mangaTitle}
          </h3>
          <div className="flex gap-1.5">
            <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-[#7c6aaa]">
              {chapters.length} chapters
            </span>
            <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-[#7c6aaa]">
              {formatBytes(group.totalPages)}
            </span>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              to="/manga"
              state={{
                manga: {
                  title: group.mangaTitle,
                  img: group.mangaImg,
                  link: group.mangaLink,
                  summary: "",
                },
              }}
              className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-300"
            >
              View Manga
            </Link>
            <button
              type="button"
              onClick={handleDeleteAll}
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400"
            >
              Delete All
            </button>
          </div>
        </div>
        <span
          className={`pr-3.5 text-[22px] text-[#4a4060] transition ${expanded ? "-rotate-90 text-violet-400" : "rotate-90"}`}
        >
          ›
        </span>
      </button>

      {expanded && (
        <div className="border-t border-violet-500/10">
          {chapters.map((ch) => (
            <ChapterRow
              key={ch.clink}
              chapter={ch}
              mangaTitle={group.mangaTitle}
              mangaImg={group.mangaImg}
              mangaLink={group.mangaLink}
              onDeleted={handleChapterDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterRow({
  chapter,
  mangaLink,
  mangaTitle,
  mangaImg,
  onDeleted,
}: {
  chapter: DownloadedChapter;
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  onDeleted: () => void;
}) {
  const handleRead = () => {
    chapterStore.chapters = [
      { chapter: chapter.chapterName, clink: chapter.clink },
    ];
    chapterStore.currentIndex = 0;
  };

  const handleDelete = () => {
    if (confirm(`Remove offline copy of "${chapter.chapterName}"?`)) {
      deleteChapter(chapter.clink).then(onDeleted);
    }
  };

  return (
    <Link
      to="/chapter"
      state={{
        title: mangaTitle,
        img: mangaImg,
        link: mangaLink,
        chapter: chapter.chapterName,
        clink: chapter.clink,
        chapterIndex: 0,
      }}
      onClick={handleRead}
      className="flex items-center gap-2.5 border-t border-violet-500/5 px-4 py-2.5 transition hover:bg-violet-500/5"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#c9bfe8]">
          {chapter.chapterName}
        </p>
        <p className="text-[11px] text-[#4a4060]">
          {chapter.totalPages} pages · {formatBytes(chapter.totalPages)} ·{" "}
          {timeAgo(chapter.downloadedAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          handleDelete();
        }}
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-[10px] font-extrabold text-red-400"
      >
        ✕
      </button>
      <span className="text-lg text-[#4a4060]">›</span>
    </Link>
  );
}
