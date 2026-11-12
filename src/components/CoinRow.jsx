import React from 'react';
import { money, change, direction } from '../market.js';

// A component is a function returning JSX (HTML-like markup).
// Props pass values from the parent App to this reusable row.
export default function CoinRow({ coin, saved, onToggle }) {
  const quote = coin.quotes.USD;
  return (
    <tr>
      <td>
        <button
          type="button"
          className={`star${saved ? ' saved' : ''}`}
          aria-pressed={saved}
          aria-label={`${saved ? 'Remove' : 'Add'} ${coin.name} ${saved ? 'from' : 'to'} watchlist`}
          onClick={() => onToggle(coin.id)}
        >
          {saved ? '★' : '☆'}
        </button>
      </td>
      <td>{coin.rank}</td>
      <td>
        <div className="asset">
          <span className="coin-icon" aria-hidden="true">
            {coin.symbol.slice(0, 1)}
          </span>
          <div>
            <strong>{coin.name}</strong>
            <small>{coin.symbol}</small>
          </div>
        </div>
      </td>
      <td className="number">{money(quote.price)}</td>
      <td className={`number ${direction(quote.percent_change_24h)}`}>
        {change(quote.percent_change_24h)}
      </td>
      <td className="number">{money(quote.market_cap, true)}</td>
      <td className="number">{money(quote.volume_24h, true)}</td>
    </tr>
  );
}
