import React from 'react';

// MarketToolbar displays one part of the page. Props supply its data and callbacks.
export default function MarketToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  watchlistOnly,
  onTabChange,
  favoriteCount,
}) {
  // Controlled inputs receive values and send changes back to App.
  return (
    <div className="toolbar">
      <div className="tabs" role="group" aria-label="Filter coins">
        <button
          className={!watchlistOnly ? 'active' : ''}
          aria-pressed={!watchlistOnly}
          onClick={() => onTabChange(false)}
        >
          All assets
        </button>
        <button
          className={watchlistOnly ? 'active' : ''}
          aria-pressed={watchlistOnly}
          onClick={() => onTabChange(true)}
        >
          ☆ Watchlist <span id="watch-count">{favoriteCount}</span>
        </button>
      </div>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Search coins</span>
        <input
          id="search"
          type="search"
          placeholder="Search name or symbol…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <label className="sort">
        <span className="sr-only">Sort coins</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="rank">Market cap rank</option>
          <option value="gainers">Top gainers</option>
          <option value="losers">Top losers</option>
          <option value="price">Highest price</option>
        </select>
      </label>
    </div>
  );
}
