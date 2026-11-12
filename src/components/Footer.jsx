import React from 'react';

// Footer displays one part of the page. Props supply its data and callbacks.
export default function Footer() {
  return (
    <footer>
      <span>
        coinflow<span className="brand-dot">.</span>{' '}
        <span className="footer-copy">
          A little clarity in a fast-moving market.
        </span>
      </span>
      <a
        href="https://coinpaprika.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Data by CoinPaprika ↗
      </a>
      <p>
        Public API snapshots may be delayed. This feed uses polling, not
        tick-by-tick streaming.
      </p>
    </footer>
  );
}
