import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'crypto';
import {
  deleteUserAppStateSnapshot,
  loadUserAppStateSnapshot,
  resolveDatabaseSource,
  saveUserAppStateSnapshot,
} from './db';

const databaseIntegrationEnabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
  && Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL);

describe('tenant-scoped app state persistence helpers', () => {
  it('saves and loads an isolated owner snapshot, then removes it', { skip: !databaseIntegrationEnabled }, async () => {
    const ownerId = `test-${randomUUID()}`;
    const key = `test-${randomUUID()}`;
    const payload = { bands: [{ id: 'b-test', name: 'Test Band' }], users: [] };

    try {
      const saved = await saveUserAppStateSnapshot(ownerId, key, payload);
      assert.equal(saved?.ownerId, ownerId);
      assert.deepEqual(await loadUserAppStateSnapshot(ownerId, key), payload);
    } finally {
      await deleteUserAppStateSnapshot(ownerId, key);
    }
  });

  it('detects a Neon/Postgres connection provided by alternate environment keys', () => {
    const previousUrl = process.env.DATABASE_URL;
    const previousPgUrl = process.env.POSTGRES_URL;
    const previousPrismaUrl = process.env.POSTGRES_PRISMA_URL;
    const previousNeonUrl = process.env.NEON_DATABASE_URL;

    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    process.env.NEON_DATABASE_URL = 'test-database-url';

    try {
      assert.equal(resolveDatabaseSource(), 'NEON_DATABASE_URL');
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
