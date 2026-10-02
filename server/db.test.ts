import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { saveAppStateSnapshot, loadAppStateSnapshot, getDatabaseStatus } from './db';

describe('app state persistence helpers', () => {
  it('should save and load a snapshot payload from the configured database', async () => {
    const key = 'test-app-state-sync';
    const payload = { bands: [{ id: 'b-test', name: 'Test Band' }], users: [] };

    const saved = await saveAppStateSnapshot(key, payload);
    assert.equal(saved?.key, key);

    const loaded = await loadAppStateSnapshot(key);
    assert.deepEqual(loaded, payload);
  });

  it('should detect a Neon/Postgres connection provided by alternate env keys', () => {
    const previousUrl = process.env.DATABASE_URL;
    const previousPgUrl = process.env.POSTGRES_URL;
    const previousPrismaUrl = process.env.POSTGRES_PRISMA_URL;
    const previousNeonUrl = process.env.NEON_DATABASE_URL;

    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    process.env.NEON_DATABASE_URL = 'postgres://user:pass@neon.example.com/neondb';

    try {
      const status = getDatabaseStatus();
      assert.equal(status.configured, true);
      assert.equal(status.source, 'NEON_DATABASE_URL');
    } finally {
      if (previousUrl) process.env.DATABASE_URL = previousUrl;
      else delete process.env.DATABASE_URL;

      if (previousPgUrl) process.env.POSTGRES_URL = previousPgUrl;
      else delete process.env.POSTGRES_URL;

      if (previousPrismaUrl) process.env.POSTGRES_PRISMA_URL = previousPrismaUrl;
      else delete process.env.POSTGRES_PRISMA_URL;

      if (previousNeonUrl) process.env.NEON_DATABASE_URL = previousNeonUrl;
      else delete process.env.NEON_DATABASE_URL;
    }
  });
});
