import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createAuthServer } from './auth.js';

test('accounts persist; sessions authenticate, expire on logout, and reject invalid requests', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'coinflow-auth-'));
  const databasePath = join(directory, 'auth.sqlite');
  let server;
  let base;
  async function start() {
    server = createAuthServer({ databasePath });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
  }
  const request = (action, body, cookie, origin) =>
    fetch(`${base}/api/auth/${action}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(cookie && { Cookie: cookie }),
        ...(origin && { Origin: origin }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });
  const account = {
    name: 'Ada',
    email: 'ADA@example.com',
    password: 'correct horse battery',
  };
  try {
    await start();
    assert.deepEqual(await (await request('me')).json(), { user: null });
    assert.equal(
      (await request('signup', { ...account, password: 'short' })).status,
      400,
    );
    const created = await request('signup', account);
    assert.equal(created.status, 201);
    const cookie = created.headers.get('set-cookie').split(';')[0];
    assert.match(created.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
    const { user } = await created.json();
    assert.equal(user.email, 'ada@example.com');
    assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name']);
    assert.deepEqual(
      (await (await request('me', null, cookie)).json()).user,
      user,
    );
    assert.equal((await request('signup', account)).status, 409);
    assert.equal(
      (await request('login', { ...account, password: 'wrong' })).status,
      401,
    );
    assert.equal(
      (await request('logout', {}, cookie, 'https://other.example')).status,
      403,
    );
    await stop();
    await start();
    assert.deepEqual(
      (await (await request('me', null, cookie)).json()).user,
      user,
    );
    assert.equal((await request('logout', {}, cookie)).status, 200);
    assert.equal((await (await request('me', null, cookie)).json()).user, null);
    const login = await request('login', account);
    assert.equal(login.status, 200);
    assert.equal((await login.json()).user.id, user.id);
    assert.equal(
      (await request('login', { ...account, password: 'x'.repeat(129) }))
        .status,
      400,
    );
    const tooLarge = await request('signup', {
      ...account,
      name: 'x'.repeat(9000),
    });
    assert.equal(tooLarge.status, 413);
    let limited;
    for (let index = 0; index < 31; index++)
      limited = await request('login', { email: 'invalid', password: 'x' });
    assert.equal(limited.status, 429);
  } finally {
    if (server?.listening) await stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
