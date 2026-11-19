import React, { useEffect, useRef, useState } from 'react';

async function authRequest(action, values) {
  const response = await fetch(`/api/auth/${action}`, {
    method: values ? 'POST' : 'GET',
    credentials: 'same-origin',
    ...(values && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Authentication failed. Please try again.');
  return data.user;
}

export default function Header() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState('login');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const signup = mode === 'signup';

  useEffect(() => {
    let active = true;
    authRequest('me')
      .then((value) => {
        if (active) setUser(value);
      })
      .catch(() => {
        if (active)
          setError(
            'Could not connect to authentication. Make sure the backend is running.',
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function openAuth(nextMode) {
    setMode(nextMode);
    setError('');
    dialog.current.showModal();
  }

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError('');
    try {
      setUser(await authRequest(mode, values));
      dialog.current.close();
    } catch (requestError) {
      setError(
        requestError instanceof SyntaxError
          ? 'Authentication is unavailable. Make sure the backend is running.'
          : requestError.message,
      );
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    setError('');
    try {
      await authRequest('logout', {});
      setUser(null);
    } catch {
      setError('Could not log out. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="topbar">
      <a className="brand" href="./index.html">
        <span className="logo">↗</span> coinflow
        <span className="brand-dot">.</span>
      </a>
      <span className="header-label">YOUR WINDOW INTO CRYPTO</span>
      <div className="header-actions">
        <span className="badge">● Market feed</span>
        {checking ? (
          <span className="auth-user" role="status">
            Checking account…
          </span>
        ) : user ? (
          <>
            <span className="auth-user">Hi, {user.name}</span>
            <button className="auth-button" disabled={pending} onClick={logout}>
              {pending ? 'Logging out…' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <button className="auth-button" onClick={() => openAuth('login')}>
              Log in
            </button>
            <button
              className="auth-button primary"
              onClick={() => openAuth('signup')}
            >
              Sign up
            </button>
          </>
        )}
      </div>
      {error && !dialog.current?.open && (
        <p className="auth-header-error" role="alert">
          {error}
        </p>
      )}
      <dialog
        ref={dialog}
        className="auth-dialog"
        aria-labelledby="auth-title"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="auth-dialog-heading">
          <h2 id="auth-title">
            {signup ? 'Create your account' : 'Welcome back'}
          </h2>
          <button
            type="button"
            className="auth-close"
            aria-label="Close"
            disabled={pending}
            onClick={() => dialog.current.close()}
          >
            ×
          </button>
        </div>
        <p className="auth-description">
          {signup ? 'Sign up to Coinflow.' : 'Log in to your Coinflow account.'}
        </p>
        <form key={mode} onSubmit={submit} className="auth-form">
          {signup && (
            <label>
              Name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                autoFocus
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              autoFocus={!signup}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              required
              minLength={signup ? 8 : 1}
              maxLength={128}
            />
          </label>
          {signup && (
            <span className="auth-description">Use at least 8 characters.</span>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-button primary" disabled={pending}>
            {pending ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          {signup ? 'Already have an account?' : 'New to Coinflow?'}{' '}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode(signup ? 'login' : 'signup');
              setError('');
            }}
          >
            {signup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </dialog>
    </header>
  );
}
