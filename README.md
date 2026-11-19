# Coinflow — React crypto market feed

Install Node.js 24+ (which includes npm and the built-in SQLite module).
From the parent `app` folder, run:

```sh
cd crypto-feed
npm install
npm run dev
```

In a second terminal in the same folder, start the authentication backend:

```sh
npm run server
```

## Accounts and authentication

Use **Sign up** or **Log in** in the header. Signup accepts a name, email,
and password (8–128 characters), and logs you in immediately. Your name and
**Log out** replace those buttons while signed in. Refreshing the page restores
your session, which lasts seven days.

`server/auth.js` runs a Node HTTP API on `127.0.0.1:3001`. Vite forwards `/api`
requests to it. The endpoints are `POST /api/auth/signup`, `POST /api/auth/login`,
`POST /api/auth/logout`, and `GET /api/auth/me`. Passwords are hashed with scrypt
and a random salt. Sessions use random tokens in HttpOnly, SameSite cookies;
only token hashes are stored in the database. Login/signup attempts are limited
per IP. Account and session data persist in `server/data/auth.sqlite`, which is
excluded from Git. Watchlists still use browser storage.

Run `npm test` to check the authentication flow. Run `npm run build` to check
the frontend build. `npm run preview` also forwards API calls to the backend.

For deployment, run the backend behind an HTTPS reverse proxy that serves the
frontend and `/api` on the same origin, preserving the original Host header.
Set `NODE_ENV=production` to enable Secure cookies. This is a basic local
account system; email verification and password recovery are not included.
