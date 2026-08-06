import * as cheerio from "cheerio";
import { absoluteMkUrl, fetchHtml, proxyUrl } from "./proxy";

export type MangaListItem = {
  title: string;
  link: string;
  img: string;
  summary: string;
};

export type Book = {
  title: string;
  img: string;
  summary: string;
  genres: string[];
};

export type Chapter = {
  chapter: string;
  clink: string;
};

export function changeSearchUrl(name: string): string {
  let url = "https://mangakatana.com/";
  if (name) {
    url += `?search=${encodeURIComponent(name)}&search_by=m_name`;
  } else {
    url += "page/1";
  }
  return url;
}

export function getPageUrl(baseUrl: string, page: number): string {
  if (page === 1) return baseUrl;
  const url = new URL(baseUrl);
  if (url.searchParams.has("search")) {
    url.searchParams.set("page", String(page));
    return url.toString();
  }
  return `https://mangakatana.com/page/${page}`;
}

export async function scrapeMangaList(
  url: string,
): Promise<{ mangas: MangaListItem[]; hasMore: boolean }> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  if ($("#book_list").length === 0 && $("#single_book").length > 0) {
    const el = $("#single_book").first();
    const canonical =
      $('link[rel="canonical"]').attr("href") ??
      $('meta[property="og:url"]').attr("content") ??
      url;
    const manga: MangaListItem = {
      title: el.find(".info .heading").text().trim(),
      img: el.find(".cover img").attr("src") ?? "",
      summary: el.find(".summary p").text().trim(),
      link: canonical,
    };
    return { mangas: [manga], hasMore: false };
  }

  const mangas = $("#book_list .item")
    .map((_, el) => ({
      title: $(el).find(".title a").text().trim(),
      link: $(el).find(".title a").attr("href") ?? "",
      img: $(el).find(".wrap_img img").attr("src") ?? "",
      summary: $(el).find(".summary").text().trim(),
    }))
    .get();

  return { mangas, hasMore: mangas.length > 0 };
}

export async function scrapeMangaDetail(url: string): Promise<{
  book: Book | null;
  chapters: Chapter[];
  newChapterLinks: Set<string>;
}> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const bookEl = $("#single_book").first();
  const book: Book | null = bookEl.length
    ? {
        title: bookEl.find(".info .heading").text().trim(),
        img: bookEl.find(".cover img").attr("src") ?? "",
        summary: bookEl.find(".summary p").text().trim(),
        genres: bookEl
          .find(".genres a")
          .map((_, g) => $(g).text().trim())
          .get(),
      }
    : null;

  const newChapters = $(".chapters .chapter .new")
    .map((_, el) => ({
      chapter: $(el).find("a").text().trim(),
      clink: $(el).find("a").attr("href") ?? "",
    }))
    .get();

  const chapters = $(".chapters .chapter")
    .map((_, el) => ({
      chapter: $(el).find("a").text().trim(),
      clink: $(el).find("a").attr("href") ?? "",
    }))
    .get();

  return {
    book,
    chapters,
    newChapterLinks: new Set(newChapters.map((c) => c.clink)),
  };
}

export async function scrapeChapterPages(clink: string): Promise<string[]> {
  const html = await fetchHtml(absoluteMkUrl(clink));
  const m = /var thzq=\[(.*?),\]/.exec(html);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((p) => absoluteMkUrl(p.trim().replace(/['"]/g, "")));
}

export function proxiedImageSrc(url: string): string {
  return proxyUrl(url);
}
