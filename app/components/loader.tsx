import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import cheerio from "react-native-cheerio";
import Card from "./card";

async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const $ = cheerio.load(html);
  if ($("#book_list").length === 0 && $("#single_book").length > 0) {
    const manga = $("#single_book")
      .map(function (i: number, el: any) {
        return {
          title: $(el).find(".info .heading").text(),
          img: $(el).find(".cover img").attr("src"),
          summary: $(el).find(".summary p").text(),
          link: url,
        };
      })
      .get()[0];
    return { mangas: [manga], hasMore: false };
  }

  const mangas = $("#book_list .item")
    .map(function (i: number, el: any) {
      return {
        title: $(el).find(".title a").text(),
        link: $(el).find(".title a").attr("href"),
        img: $(el).find(".wrap_img img").attr("src"),
        summary: $(el).find(".summary").text(),
      };
    })
    .get();

  // if the page came back empty we've gone past the last page
  return { mangas, hasMore: mangas.length > 0 };
}

function getPageUrl(baseUrl: string, page: number): string {
  if (page === 1) return baseUrl;

  const url = new URL(baseUrl);
  if (url.searchParams.has("search")) {
    url.searchParams.set("page", String(page));
    return url.toString();
  } else {
    return `https://mangakatana.com/page/${page}`;
  }
}

export default function Loader({
  url,
  onLoadComplete,
}: {
  url: string;
  onLoadComplete: () => void;
}) {
  const [mangas, setMangas] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = useRef(true);

  // load a specific page and append results
  const loadPage = useCallback(
    async (pageNum: number) => {
      if (!hasMore.current) return;
      setLoadingMore(true);
      try {
        const result = await scrape(getPageUrl(url, pageNum));
        hasMore.current = result.hasMore;
        setMangas((prev) =>
          pageNum === 1 ? result.mangas : [...prev, ...result.mangas],
        );
      } finally {
        setLoadingMore(false);
        if (pageNum === 1) onLoadComplete();
      }
    },
    [url],
  );

  // reset when url changes (new search or refresh)
  useEffect(() => {
    hasMore.current = true;
    setMangas([]);
    setPage(1);
    loadPage(1);
  }, [url]);

  const handleEndReached = () => {
    if (loadingMore || !hasMore.current) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage);
  };

  return (
    <FlatList
      data={mangas}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => <Card manga={item} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3} // trigger when 30% from the bottom
      ListFooterComponent={
        loadingMore ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : null
      }
    />
  );
}
