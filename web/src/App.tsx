import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TabLayout } from "./components/TabLayout";
import { initDownloadWorker } from "./lib/downloadWorker";
import { ChapterPage } from "./pages/ChapterPage";
import { DownloadsPage } from "./pages/DownloadsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { MangaPage } from "./pages/MangaPage";

export default function App() {
  useEffect(() => {
    initDownloadWorker();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TabLayout />}>
          <Route index element={<HomePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
        </Route>
        <Route path="manga" element={<MangaPage />} />
        <Route path="chapter" element={<ChapterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
