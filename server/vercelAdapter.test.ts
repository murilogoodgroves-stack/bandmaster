import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import type { Request, Response } from 'express';

test('Vercel Express handler serves API routes without local startup or database writes', async () => {
  const previousVercel = process.env.VERCEL;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousOidcToken = process.env.VERCEL_OIDC_TOKEN;
  process.env.VERCEL = '1';
  process.env.NODE_ENV = 'production';
  process.env.VERCEL_OIDC_TOKEN = 'test-oidc-token';

  const server = createServer((req, res) => {
    void import('../api/[...path]').then(({ default: handler }) =>
      handler(req as Request, res as Response)
    );
  });

  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');

    const configResponse = await fetch(`http://127.0.0.1:${address.port}/api/config`);
    assert.equal(configResponse.status, 200);
    const config = await configResponse.json() as {
      database: { configured: boolean };
      ai: { configured: boolean };
    };
    assert.equal(config.database.configured, false);
    assert.equal(config.ai.configured, true);

    const protectedResponse = await fetch(`http://127.0.0.1:${address.port}/api/app-state`);
    assert.equal(protectedResponse.status, 401);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN = previousOidcToken;
  }
});
