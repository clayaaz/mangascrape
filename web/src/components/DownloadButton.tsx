import { useEffect, useState } from "react";
import { loadQueue } from "../lib/downloadQueue";
import { deleteChapter, isChapterDownloaded } from "../lib/downloadStore";
import {
  queueDownload,
  subscribeToDownload,
} from "../lib/downloadWorker";
import type { Chapter } from "../lib/scraper";

type Status = "idle" | "queued" | "downloading" | "done" | "error";

export function DownloadButton({
  chapter,
  mangaLink,
  mangaTitle,
  mangaImg,
}: {
  chapter: Chapter;
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    async function checkState() {
      const done = await isChapterDownloaded(chapter.clink);
      if (done) {
        if (active) setStatus("done");
        return;
      }
      const queue = await loadQueue();
      const entry = queue.find((e) => e.clink === chapter.clink);
      if (!entry) {
        if (active) setStatus("idle");
        return;
      }
      if (active)
        setStatus(entry.status === "downloading" ? "downloading" : "queued");
    }
    checkState();
    return () => {
      active = false;
    };
  }, [chapter.clink]);

  useEffect(() => {
    return subscribeToDownload(chapter.clink, (p, s) => {
      if (s === "downloading") {
        setStatus("downloading");
        setProgress(p);
      } else if (s === "done") {
        setStatus("done");
        setProgress(1);
      } else if (s === "error") setStatus("error");
    });
  }, [chapter.clink]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === "done") {
      if (
        confirm(
          `Remove offline copy of "${chapter.chapter}"?`,
        )
      ) {
        await deleteChapter(chapter.clink);
        setStatus("idle");
        setProgress(0);
      }
      return;
    }
    if (status === "queued" || status === "downloading") return;
    setStatus("queued");
    await queueDownload({
      clink: chapter.clink,
      mangaLink,
      mangaTitle,
      mangaImg,
      chapterName: chapter.chapter,
    });
  };

  const base =
    "relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border text-sm font-bold";

  if (status === "queued") {
    return (
      <div className={`${base} border-violet-500/20 bg-violet-500/5 text-[#7c6aaa]`}>
        …
      </div>
    );
  }

  if (status === "downloading") {
    const pct = Math.round(progress * 100);
    return (
      <div className={`${base} border-violet-500/25 bg-violet-500/10`}>
        <div
          className="absolute inset-y-0 left-0 bg-violet-500/30"
          style={{ width: `${pct}%` }}
        />
        <span className="relative z-10 text-[8px] font-extrabold text-violet-300">
          {pct}%
        </span>
      </div>
    );
  }

  if (status === "done") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${base} border-green-400/40 bg-green-400/10 text-green-400`}
      >
        ✓
      </button>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${base} border-red-400/30 bg-red-500/10 text-red-400`}
      >
        ↺
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${base} border-violet-500/25 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20`}
    >
      ↓
    </button>
  );
}
