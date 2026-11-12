import React from 'react';
import CoinRow from './CoinRow.jsx';
// CoinTable displays one part of the page. Props supply its data and callbacks.
export default function CoinTable({ coins, favorites, onToggle }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>
              <span className="sr-only">Watchlist</span>☆
            </th>
            <th>#</th>
            <th>Asset</th>
            <th className="number">Price</th>
            <th className="number">24h change</th>
            <th className="number">Market cap</th>
            <th className="number">Volume (24h)</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              saved={favorites.includes(coin.id)}
              onToggle={onToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
