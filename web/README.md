# Manga Ikuzo — Web

React + Tailwind web client for the [Manga Ikuzo](../) Expo app. Same features: browse/search [MangaKatana](https://mangakatana.com), read chapters, reading history, and offline chapter downloads.

## Run

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/mangakatana/*` to mangakatana.com so scraping works without CORS errors.

## Build

```bash
npm run build
npm run preview
```

For production you need a similar reverse proxy for `/mangakatana` (or host scraping on a small backend).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- cheerio (HTML scraping, same selectors as the mobile app)
- localStorage (history, download index, queue)
- IndexedDB (offline page blobs)
