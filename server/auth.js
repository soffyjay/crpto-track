import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  randomBytes,
  scrypt as scryptCallback,
  createHash,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const scrypt = promisify(scryptCallback);
const SESSION_AGE = 7 * 24 * 60 * 60;
const digest = (value) => createHash('sha256').update(value).digest('hex');

export function createAuthServer({
  databasePath = 'server/data/auth.sqlite',
  secure = process.env.NODE_ENV === 'production',
} = {}) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, salt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
    );
  `);
  const attempts = new Map();
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const cookie = (token, age) =>
      res.setHeader(
        'Set-Cookie',
        `coinflow_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`,
      );
    const token = req.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('coinflow_session='))
      ?.slice('coinflow_session='.length);
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && url.pathname === '/api/auth/me') {
        const user = token
          ? db
              .prepare(
                `SELECT users.id, name, email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?`,
              )
              .get(digest(token), Date.now())
          : null;
        return send(200, { user: user || null });
      }
      if (
        req.method !== 'POST' ||
        !['/api/auth/signup', '/api/auth/login', '/api/auth/logout'].includes(
          url.pathname,
        )
      )
        return send(404, { error: 'Not found.' });
      // Browsers send Origin on these requests; reject cross-site mutations.
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host)
        return send(403, { error: 'Request origin is not allowed.' });
      if (req.headers['content-type']?.split(';')[0] !== 'application/json')
        return send(415, { error: 'Send JSON data.' });
      if (url.pathname === '/api/auth/logout') {
        if (token)
          db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(
            digest(token),
          );
        cookie('', 0);
        return send(200, { user: null });
      }
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      for (const [key, value] of attempts)
        if (value.until <= now) attempts.delete(key);
      const attempt = attempts.get(ip) || {
        count: 0,
        until: now + 15 * 60 * 1000,
      };
      attempts.set(ip, attempt);
      if (++attempt.count > 30)
        return send(429, {
          error: 'Too many attempts. Try again in 15 minutes.',
        });
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 8192)
          return send(413, { error: 'Request is too large.' });
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(400, { error: 'Invalid JSON.' });
      }
      const { password, name } = body || {};
      const email =
        typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (
        !email ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' ||
        password.length > 128 ||
        !password.length
      )
        return send(400, {
          error:
            'Enter a valid email and a password of at most 128 characters.',
        });
      let user;
      if (url.pathname === '/api/auth/signup') {
        if (
          typeof name !== 'string' ||
          !name.trim() ||
          name.trim().length > 80 ||
          password.length < 8
        )
          return send(400, {
            error:
              'Enter a name (up to 80 characters) and a password of at least 8 characters.',
          });
        const salt = randomBytes(16).toString('hex');
        const hash = (await scrypt(password, salt, 64)).toString('hex');
        try {
          const result = db
            .prepare(
              'INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)',
            )
            .run(name.trim(), email, hash, salt);
          user = {
            id: Number(result.lastInsertRowid),
            name: name.trim(),
            email,
          };
        } catch (error) {
          if (
            error.code?.includes('CONSTRAINT') ||
            error.message.includes('UNIQUE constraint')
          )
            return send(409, {
              error: 'An account with this email already exists.',
            });
          throw error;
        }
      } else {
        const account = db
          .prepare('SELECT * FROM users WHERE email = ?')
          .get(email);
        const hash = await scrypt(
          password,
          account?.salt || 'unregistered-account',
          64,
        );
        if (
          !account ||
          !timingSafeEqual(hash, Buffer.from(account.password_hash, 'hex'))
        )
          return send(401, { error: 'Email or password is incorrect.' });
        user = { id: account.id, name: account.name, email: account.email };
      }
      const sessionToken = randomBytes(32).toString('hex');
      db.prepare(
        'DELETE FROM sessions WHERE expires_at <= ? OR token_hash = ?',
      ).run(Date.now(), token ? digest(token) : '');
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
        digest(sessionToken),
        user.id,
        Date.now() + SESSION_AGE * 1000,
      );
      cookie(sessionToken, SESSION_AGE);
      return send(url.pathname.endsWith('signup') ? 201 : 200, { user });
    } catch (error) {
      console.error('Authentication request failed:', error);
      if (!res.headersSent)
        send(500, { error: 'Something went wrong. Please try again.' });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT || 3001);
  createAuthServer().listen(port, '127.0.0.1', () =>
    console.log(`Authentication API listening on http://127.0.0.1:${port}`),
  );
}
