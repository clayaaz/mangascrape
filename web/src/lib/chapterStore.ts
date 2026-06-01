import type { Chapter } from "./scraper";

export const chapterStore: { chapters: Chapter[]; currentIndex: number } = {
  chapters: [],
  currentIndex: 0,
};
