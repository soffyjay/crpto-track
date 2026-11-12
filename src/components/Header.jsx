import React from 'react';

// Header displays one part of the page. Props supply its data and callbacks.
export default function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="./index.html">
        <span className="logo">↗</span> coinflow
        <span className="brand-dot">.</span>
      </a>
      <span className="header-label">YOUR WINDOW INTO CRYPTO</span>
      <span className="badge">● Market feed</span>
    </header>
  );
}
