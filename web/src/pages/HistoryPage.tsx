import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandTitle } from "../components/BrandTitle";
import {
  clearHistory,
  loadHistory,
  removeEntry,
  type HistoryEntry,
} from "../lib/historyStore";
import { proxiedImageSrc } from "../lib/scraper";
import { timeAgo } from "../lib/utils";

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const handleRemove = async (link: string) => {
    setHistory(await removeEntry(link));
  };

  const handleClearAll = () => {
    if (confirm("Remove all reading history? This cannot be undone.")) {
      clearHistory().then(() => setHistory([]));
    }
  };

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <BrandTitle accent="H" rest="ISTORY" />
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#5a4e7a]">
          Recently read
        </span>
        <span className="text-xs font-semibold text-[#4a4060]">
          {history.length} titles
        </span>
      </div>

      {history.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-8 pt-20 text-center">
          <span className="text-5xl">📖</span>
          <h2 className="text-lg font-bold text-[#c9bfe8]">Nothing here yet</h2>
          <p className="text-[13px] leading-5 text-[#4a4060]">
            Chapters you open will appear here so you can pick up where you left
            off.
          </p>
        </div>
      )}

      {history.map((entry) => (
        <HistoryCard
          key={entry.link}
          entry={entry}
          onRemove={() => handleRemove(entry.link)}
        />
      ))}
    </div>
  );
}

function HistoryCard({
  entry,
  onRemove,
}: {
  entry: HistoryEntry;
  onRemove: () => void;
}) {
  return (
    <Link
      to="/manga"
      state={{
        manga: {
          title: entry.title,
          img: entry.img,
          link: entry.link,
          summary: "",
        },
      }}
      className="group relative mb-2.5 flex overflow-hidden rounded-2xl border border-violet-500/10 bg-white/[0.04] transition hover:border-violet-500/30 hover:bg-violet-500/10"
    >
      <div className="absolute left-5 right-5 top-0 h-px bg-white/[0.06]" />
      <img
        src={proxiedImageSrc(entry.img)}
        alt=""
        className="h-[116px] w-20 shrink-0 object-cover"
      />
      <div className="flex flex-1 flex-col justify-between p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-[#e8e0ff]">
          {entry.title}
        </h3>
        <span className="mt-1.5 inline-flex w-fit rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
          {entry.chapter}
        </span>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-[#4a4060]">{timeAgo(entry.readAt)}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-300">
              Resume →
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-[10px] font-extrabold text-red-400"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
