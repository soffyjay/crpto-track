export function money(value, compact = false) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : value < 1 ? 6 : 2,
  }).format(value);
}

export function change(value) {
  return Number.isFinite(value)
    ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    : '—';
}

export const API_URL = 'https://api.coinpaprika.com/v1/tickers';
export const REFRESH_TIME = 60000;
export function direction(value) {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : '';
}
export function readFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('coinflow-favorites') || '[]',
    );
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id) => typeof id === 'string'))]
      : [];
  } catch {
    return [];
  }
}
export function prepareCoins(data) {
  if (!Array.isArray(data)) throw new Error('Unexpected response');
  const valid = data.filter(
    (coin) =>
      typeof coin?.id === 'string' &&
      typeof coin.name === 'string' &&
      typeof coin.symbol === 'string' &&
      Number.isFinite(coin.rank) &&
      coin.rank > 0 &&
      Number.isFinite(coin.quotes?.USD?.price),
  );
  if (!valid.length) throw new Error('No market data returned');
  return valid.sort((a, b) => a.rank - b.rank).slice(0, 100);
}
export function filterCoins(coins, query, watchlistOnly, favorites, sort) {
  const search = query.trim().toLowerCase();
  // filter() makes a new array, so sort() won't change the original state.
  const visible = coins.filter(
    (coin) =>
      (coin.name + ' ' + coin.symbol).toLowerCase().includes(search) &&
      (!watchlistOnly || favorites.includes(coin.id)),
  );
  if (sort === 'gainers')
    visible.sort(
      (a, b) =>
        (b.quotes.USD.percent_change_24h ?? -Infinity) -
        (a.quotes.USD.percent_change_24h ?? -Infinity),
    );
  if (sort === 'losers')
    visible.sort(
      (a, b) =>
        (a.quotes.USD.percent_change_24h ?? Infinity) -
        (b.quotes.USD.percent_change_24h ?? Infinity),
    );
  if (sort === 'price')
    visible.sort((a, b) => b.quotes.USD.price - a.quotes.USD.price);
  return visible;
}
