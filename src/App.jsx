import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  API_URL,
  REFRESH_TIME,
  readFavorites,
  prepareCoins,
  filterCoins,
} from './market.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import MarketSummary from './components/MarketSummary.jsx';
import MarketToolbar from './components/MarketToolbar.jsx';
import CoinTable from './components/CoinTable.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  // State remembers values. Its setters tell React to update the screen.
  const [coins, setCoins] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rank');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [favorites, setFavorites] = useState(readFavorites);
  const [loading, setLoading] = useState(true);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');

  // Refs remember values without causing renders; these track network activity.
  const activeRequest = useRef(null);
  const lastFetched = useRef(0);

  // useCallback keeps a function stable for the effect that uses it below.
  const fetchPrices = useCallback(async () => {
    if (activeRequest.current) return; // Don't start overlapping requests.
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const nextCoins = prepareCoins(await response.json());
      if (activeRequest.current !== controller) return;
      setCoins(nextCoins);
      const now = new Date();
      setLastSuccess(now);
      lastFetched.current = now.getTime();
    } catch (requestError) {
      if (activeRequest.current === controller) {
        console.warn('Market request failed:', requestError);
        setError(
          'Could not update prices. Check your connection or try Refresh. The public API may be temporarily unavailable.',
        );
      }
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, []);

  // Effects synchronize with things outside React, such as timers and the API.
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      if (!document.hidden) fetchPrices();
    }, REFRESH_TIME);
    function onVisible() {
      if (!document.hidden && Date.now() - lastFetched.current >= REFRESH_TIME)
        fetchPrices();
    }
    document.addEventListener('visibilitychange', onVisible);
    // Cleanup stops work if this component is removed from the page.
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      const request = activeRequest.current;
      activeRequest.current = null;
      request?.abort();
    };
  }, [fetchPrices]);

  // Save the watchlist whenever favorites changes.
  useEffect(() => {
    try {
      localStorage.setItem('coinflow-favorites', JSON.stringify(favorites));
      setStorageError('');
    } catch {
      setStorageError(
        'Your browser could not save the watchlist. Changes will last for this session.',
      );
    }
  }, [favorites]);

  function toggleFavorite(id) {
    // Create a new array: never modify React state directly.
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  // Derived values are calculated from state instead of stored a second time.
  const visible = filterCoins(coins, query, watchlistOnly, favorites, sort);
  const status = error
    ? `${error}${lastSuccess ? ` Showing the stale snapshot fetched at ${lastSuccess.toLocaleTimeString()}.` : ''}`
    : loading
      ? coins.length
        ? 'Refreshing market data…'
        : 'Connecting to the market…'
      : 'Feed connected · Top 100 ranked assets · Auto-refresh every 60 seconds';
  const emptyMessage = !coins.length
    ? 'No market data yet. Use Refresh to try again.'
    : query.trim()
      ? 'No coins match your search.'
      : 'Your watchlist is empty. Star an asset to add it here.';

  // JSX uses className instead of class. Braces insert JavaScript values.
  // Pass state down as props and callbacks down so children can request changes.
  return (
    <>
      <Header />
      <main className="min-w-0">
        <Hero lastSuccess={lastSuccess} error={error} />

        {/* App owns the data; these components receive it through props. */}
        <MarketSummary coins={coins} />

        <section className="market" aria-labelledby="market-heading">
          <div className="market-heading">
            <div>
              <p className="eyebrow">EXPLORE THE MARKET</p>
              <h2 id="market-heading">Crypto overview</h2>
            </div>
            <button
              id="refresh"
              className="refresh"
              type="button"
              disabled={loading}
              onClick={fetchPrices}
            >
              {loading ? '↻ Updating…' : '↻ Refresh'}
            </button>
          </div>
          <MarketToolbar
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            watchlistOnly={watchlistOnly}
            onTabChange={setWatchlistOnly}
            favoriteCount={favorites.length}
          />
          <p className={`status${error ? ' error' : ''}`} role="status">
            {status}
          </p>
          {storageError && (
            <p className="status error" role="status">
              {storageError}
            </p>
          )}
          <CoinTable
            coins={visible}
            favorites={favorites}
            onToggle={toggleFavorite}
          />
          {!loading && !visible.length && (
            <div className="empty">{emptyMessage}</div>
          )}
          <div className="table-footer">
            <span id="result-count">
              {loading && !coins.length
                ? 'Loading assets…'
                : `${visible.length} of ${coins.length} assets`}
            </span>
            <span>All prices in USD</span>
          </div>
        </section>
        <Footer />
      </main>{' '}
    </>
  );
}
