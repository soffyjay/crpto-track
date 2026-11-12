# Coinflow — React crypto market feed

Install Node.js 22.12+ (or a newer supported LTS release), which includes npm.
From the parent `app` folder, run:

```sh
cd crypto-feed
npm install
npm run dev
```

Open the local URL printed by Vite. Use this server instead of opening
index.html directly or using Live Server: JSX needs to be compiled.
An internet connection is required for market data. No API key is needed.

Run `npm run build` to create production files in `dist/`.
Run `npm run preview` to preview that build locally.

## Formatting and Tailwind CSS

Run `npm run format` to format project files with Prettier.
Run `npm run format:check` to check formatting without changing files.

Tailwind CSS v4 is connected through `vite.config.js` and imported in
`style.css`. You can add utility classes directly to JSX, for example
`className="flex gap-4"`. The main element uses `min-w-0` as a small example.
The existing custom CSS remains in place. Tailwind's reset (Preflight) is
omitted to preserve the current appearance.

## Learn the files

- `index.html` contains the root div where React mounts.
- `src/main.jsx` connects React to the page and imports the CSS.
- `src/App.jsx` manages shared state, API requests, refresh timers, and watchlist storage.
- `src/components/Header.jsx` displays the navigation and brand.
- `src/components/Hero.jsx` displays the introduction and feed timestamp.
- `src/components/MarketSummary.jsx` calculates and displays the overview cards.
- `src/components/MarketToolbar.jsx` displays search, sorting, and watchlist tabs.
- `src/components/CoinTable.jsx` renders the list of coins.
- `src/components/CoinRow.jsx` displays one coin and its watchlist button.
- `src/components/Footer.jsx` displays attribution and feed information.
- `src/market.js` contains formatting, filtering, and API-data helpers.
- `style.css` controls colors, spacing, and responsive layouts.
- `package.json` lists dependencies and terminal commands.

`useState` remembers values and updates the screen. `useEffect` handles
fetching, refresh timers, and saving favorites. `useRef` tracks a request
without causing renders. Props pass values to child components. Comments
in App.jsx explain these concepts where they are used.

The app requests https://api.coinpaprika.com/v1/tickers on opening and every
60 seconds while visible, showing the top 100 ranked assets in USD. A manual
Refresh button is also available. The provider may cache or delay data; this
is a polling feed, not a streaming exchange connection. API availability and
limits can change: https://coinpaprika.com/developers

Star coins to save a watchlist in your browser's localStorage. If storage is
blocked, the watchlist still works for the current session. Failed requests
show a clear error; previously loaded prices remain visible as a stale snapshot.

Try changing the colors in `:root` in `style.css`, or change `REFRESH_TIME`
in `src/market.js` to experiment with a slower refresh interval.
