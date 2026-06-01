import { useState } from "react";
import { BrandTitle } from "../components/BrandTitle";
import { MangaLoader } from "../components/MangaLoader";
import { changeSearchUrl } from "../lib/scraper";

export function HomePage() {
  const [term, setTerm] = useState("");
  const [url, setUrl] = useState("https://mangakatana.com/");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const handleSearch = () => {
    setSearchedTerm(term);
    setUrl(changeSearchUrl(term));
    setRefreshKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <div>
      <div className="px-5 pb-2 pt-4">
        <BrandTitle accent="M" rest="ANGA IKUZO" />
      </div>

      <div className="border-b border-violet-500/10 bg-[rgba(14,13,22,0.95)] px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search titles..."
            className="h-11 flex-1 rounded-xl border border-violet-500/20 bg-white/[0.06] px-4 text-[15px] text-[#e8e0ff] outline-none placeholder:text-[#5a5272] focus:border-violet-500/50"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl border border-violet-500/45 bg-violet-500/20 px-[18px] py-2.5 text-sm font-bold tracking-wide text-violet-300 transition hover:bg-violet-500/35"
          >
            Search
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 pt-3.5">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#6b5f8c]">
          {searchedTerm ? (
            <>
              Results for{" "}
              <span className="font-bold text-violet-400">
                &quot;{searchedTerm}&quot;
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-violet-400">Trending</span> this
              week
            </>
          )}
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3.5 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          <p className="text-[13px] uppercase tracking-widest text-[#5a4e7a]">
            Loading...
          </p>
        </div>
      )}

      <div className={loading ? "hidden" : ""}>
        <MangaLoader
          key={refreshKey}
          url={url}
          onLoadComplete={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
