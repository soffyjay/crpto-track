import React from 'react';

// Hero displays one part of the page. Props supply its data and callbacks.
export default function Hero({ lastSuccess, error }) {
  return (
    <section className="intro">
      <div>
        <p className="eyebrow">THE MARKET, AT A GLANCE</p>
        <h1>
          Keep your finger
          <br />
          on the <span>pulse.</span>
        </h1>
        <p className="description">
          Follow crypto prices, spot the movers, and build your watchlist.
        </p>
      </div>
      <div className="feed-card">
        <span className="signal">◉</span>
        <strong>Always in the loop.</strong>
        <p>Market snapshots refresh every 60 seconds while this tab is open.</p>
        <span id="updated">
          {lastSuccess
            ? `${error ? 'Stale snapshot' : 'Last fetched at'} ${lastSuccess.toLocaleTimeString()}`
            : error
              ? 'Feed unavailable'
              : 'Waiting for first update'}
        </span>
      </div>
    </section>
  );
}
