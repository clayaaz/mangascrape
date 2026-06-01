import { Link } from "react-router-dom";
import type { MangaListItem } from "../lib/scraper";
import { proxiedImageSrc } from "../lib/scraper";

export function MangaCard({ manga }: { manga: MangaListItem }) {
  return (
    <Link
      to="/manga"
      state={{ manga }}
      className="group mx-4 my-1.5 flex overflow-hidden rounded-2xl border border-violet-500/10 bg-white/[0.04] transition hover:border-violet-500/35 hover:bg-violet-500/10 active:scale-[0.985]"
    >
      <div className="absolute left-5 right-5 top-0 h-px bg-white/[0.06]" />
      <img
        src={proxiedImageSrc(manga.img)}
        alt=""
        className="h-40 w-[110px] shrink-0 object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="mb-1.5 line-clamp-2 text-[15px] font-bold leading-5 text-[#e8e0ff]">
            {manga.title}
          </h3>
          <p className="line-clamp-4 text-xs leading-[17px] text-[#6b5f8c]">
            {manga.summary}
          </p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-violet-400">
          Read →
        </span>
      </div>
    </Link>
  );
}
