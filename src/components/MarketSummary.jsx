import React from 'react';
import { money, change, direction } from '../market.js';
// MarketSummary displays one part of the page. Props supply its data and callbacks.
export default function MarketSummary({ coins }) {
  const sum = (key) =>
    coins.reduce((total, coin) => total + (coin.quotes.USD[key] || 0), 0);
  const top = coins
    .filter((coin) => Number.isFinite(coin.quotes.USD.percent_change_24h))
    .sort(
      (a, b) =>
        b.quotes.USD.percent_change_24h - a.quotes.USD.percent_change_24h,
    )[0];

  return (
    <section className="stats" aria-label="Market overview">
      <article>
        <p>TRACKED MARKET CAP</p>
        <h2 id="market-cap">
          {coins.length ? money(sum('market_cap'), true) : '—'}
        </h2>
        <span>Across the top 100 assets</span>
      </article>
      <article>
        <p>24H TRADING VOLUME</p>
        <h2 id="volume">
          {coins.length ? money(sum('volume_24h'), true) : '—'}
        </h2>
        <span>Across the top 100 assets</span>
      </article>
      <article>
        <p>TOP 100 GAINER · 24H</p>
        <h2
          id="gainer"
          className={direction(top?.quotes.USD.percent_change_24h)}
        >
          {change(top?.quotes.USD.percent_change_24h)}
        </h2>
        <span id="gainer-name">
          {top ? `${top.name} · ${top.symbol}` : 'Waiting for market data'}
        </span>
      </article>
    </section>
  );
}
